/**
 * Validação por etapa — mesmas regras e mensagens da produção (zod do wizard),
 * com as correções planejadas marcadas.
 */
import { ASSETS, AUDIENCES, CHANNELS, PACKAGES, PRICING, byId } from '../domain';
import {
  allocationError,
  audienceAvailable,
  audienceIssue,
  audienceLimits,
  audienceVolume,
  brl,
  budgetErrors,
  dateBR,
  dateShort,
  exclusivityBlock,
  fieldVisible,
  int,
  isFilled,
  missingRequired,
  parseMoney,
  sum,
} from '../pricing';
import { mainAsset, type CampaignDraft } from '../store';

export const STEPS = [
  { key: 'identification', title: 'Identificação', description: 'Nome e anunciante' },
  { key: 'asset', title: 'Ativo', description: 'O que será veiculado e quando' },
  { key: 'pricing', title: 'Precificação', description: 'Modelo, verba e bônus' },
  { key: 'channels_audiences', title: 'Canal + Público', description: 'Onde e para quem' },
  { key: 'form', title: 'Briefing', description: 'Briefing do ativo' },
  { key: 'review', title: 'Revisão', description: 'Conferir e salvar' },
] as const;
export type StepKey = (typeof STEPS)[number]['key'];
export type Errors = Record<string, string>;

export function effectiveModel(draft: CampaignDraft) {
  if (draft.selectionKind === 'asset') return mainAsset(draft)?.pricing ?? '';
  return draft.pricingModel;
}

export function validateStep(step: StepKey, draft: CampaignDraft): Errors {
  const errors: Errors = {};
  if (step === 'identification') {
    if (!draft.name.trim()) errors.name = 'Informe o nome da campanha.';
    if (!draft.advertiserId) errors.advertiserId = 'Selecione o anunciante.';
  }
  if (step === 'asset') {
    if (draft.selectionKind === 'asset') {
      if (!draft.category) errors.category = 'Selecione a categoria.';
      if (!draft.assetId) errors.assetId = 'Selecione o ativo.';
    } else if (!draft.packageId) {
      errors.packageId = 'Selecione o pacote.';
    } else if (byId(PACKAGES, draft.packageId)?.assetIds.length === 0) {
      // Pacote em montagem: sem ativos não há o que cobrar nem veicular.
      errors.packageId = 'Este pacote ainda não tem ativos. Escolha outro pacote.';
    }
    // O erro fica na data que falta (ou na final, quando inverte o período), nunca na já preenchida.
    if (!draft.startDate) errors.startDate = 'Defina o período de veiculação da campanha.';
    if (!draft.endDate) errors.endDate = 'Defina o período de veiculação da campanha.';
    if (draft.startDate && draft.endDate && draft.endDate < draft.startDate)
      errors.endDate = 'A data final não pode ser anterior à inicial.';
  }
  if (step === 'pricing') {
    const asset = mainAsset(draft);
    const budget = parseMoney(draft.budget);
    if (draft.selectionKind === 'package') {
      const model = draft.pricingModel;
      if (!model) errors.pricingModel = 'Selecione o modelo de precificação.';
      const needs = !model || PRICING[model].needsBudget;
      if (needs) {
        if (!Number.isFinite(budget) || budget <= 0) errors.budget = 'Informe a verba da campanha.';
        else if (asset?.minPurchase && budget < asset.minPurchase)
          errors.budget = `Verba mínima do pacote: ${brl(asset.minPurchase)}.`;
      }
    } else if (asset) {
      const message = budgetErrors(asset, budget);
      if (message) errors.budget = message;
    }
  }
  if (step === 'channels_audiences') {
    const asset = mainAsset(draft);
    const budget = parseMoney(draft.budget) || 0;
    if (asset?.allowAllocation) {
      if (draft.channelIds.length > 0) {
        const message = allocationError('canal', sum(draft.channelIds.map((id) => draft.channelAlloc[id] ?? 0)));
        if (message) errors.channels = message;
      }
      if (draft.audienceIds.length > 0) {
        const message = allocationError('público', sum(draft.audienceIds.map((id) => draft.audienceAlloc[id] ?? 0)));
        if (message) errors.audiences = message;
      }
    }
    if (asset) {
      draft.audienceIds.forEach((id) => {
        const share = asset.allowAllocation ? draft.audienceAlloc[id] ?? 0 : 100 / draft.audienceIds.length;
        const volume = audienceVolume(asset, budget, share);
        const issue = audienceIssue(id, asset.pricing, volume);
        const audience = byId(AUDIENCES, id);
        const limits = audienceLimits(id, asset.pricing);
        if (!audience || !issue || !limits) return;
        if (issue === 'minimo') errors[`aud-${id}`] = `Público "${audience.name}": o mínimo é ${int(limits.min)} un (alocado: ${int(volume)} un).`;
        if (issue === 'maximo')
          errors[`aud-${id}`] = `Público "${audience.name}": o máximo por empresa é ${int(limits.maxPerAdvertiser)} un (alocado: ${int(volume)} un).`;
        if (issue === 'estoque')
          errors[`aud-${id}`] = `${audience.name}: o volume pedido (${int(volume)}) passa do disponível de ${dateBR(draft.startDate)} a ${dateBR(draft.endDate)}, que é ${int(audienceAvailable(id, asset.pricing) ?? 0)}.`;
      });
    }
    const block = exclusivityBlock(draft.advertiserId, asset?.category ?? '', draft.startDate, draft.endDate);
    if (block) errors.block = 'Contratação bloqueada';
  }
  if (step === 'form' && draft.submitNow) {
    const asset = mainAsset(draft);
    const missing = asset ? missingRequired(asset.fields, draft.formValues) : [];
    if (missing.length === 1) errors.form = `Preencha o campo obrigatório do formulário: ${missing[0]?.label}.`;
    if (missing.length > 1)
      errors.form = `Preencha os campos obrigatórios do formulário: ${missing
        .slice(0, 3)
        .map((field) => field.label)
        .join(', ')}${missing.length > 3 ? '…' : ''}.`;
    missing.forEach((field) => {
      errors[`field-${field.id}`] = 'Campo obrigatório para enviar à aprovação.';
    });
  }
  return errors;
}

export function validateAll(draft: CampaignDraft) {
  for (const [index, step] of STEPS.entries()) {
    const errors = validateStep(step.key, draft);
    if (Object.keys(errors).length > 0) return { index, errors };
  }
  return undefined;
}

/** Linha de resumo que aparece sob cada etapa no trilho à esquerda. */
export function stepSummary(step: StepKey, draft: CampaignDraft, advertiserName?: string) {
  const asset = mainAsset(draft);
  if (step === 'identification') return [draft.name, advertiserName].filter(Boolean).join(' · ');
  if (step === 'asset') {
    const what =
      draft.selectionKind === 'package' ? byId(PACKAGES, draft.packageId)?.name : byId(ASSETS, draft.assetId)?.name;
    const when = draft.startDate && draft.endDate ? `${dateShort(draft.startDate)} – ${dateShort(draft.endDate)}` : '';
    return [what, when].filter(Boolean).join(' · ');
  }
  if (step === 'pricing') {
    const model = effectiveModel(draft);
    const budget = parseMoney(draft.budget);
    return [model ? PRICING[model].label : '', Number.isFinite(budget) && budget > 0 ? brl(budget) : '']
      .filter(Boolean)
      .join(' · ');
  }
  if (step === 'channels_audiences') {
    const parts = [];
    if (draft.channelIds.length) parts.push(`${draft.channelIds.length} ${draft.channelIds.length === 1 ? 'canal' : 'canais'}`);
    if (draft.audienceIds.length) parts.push(`${draft.audienceIds.length} ${draft.audienceIds.length === 1 ? 'público' : 'públicos'}`);
    return parts.join(' · ');
  }
  if (step === 'form' && asset) {
    // Condições são só regras de exibição: não contam como campo a preencher.
    const visible = asset.fields.filter(
      (field) => field.type !== 'condition' && fieldVisible(field, draft.formValues),
    );
    if (!visible.length) return 'Sem briefing';
    const filled = visible.filter((field) => isFilled(field, draft.formValues[field.id])).length;
    return `${filled} de ${visible.length} preenchidos`;
  }
  return '';
}

export const channelName = (id: string) => byId(CHANNELS, id)?.name ?? id;
export const audienceName = (id: string) => byId(AUDIENCES, id)?.name ?? id;
