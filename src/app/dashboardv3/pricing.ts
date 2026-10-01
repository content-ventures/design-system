/**
 * Regras de verba, estimativa, bônus, alocação e disponibilidade.
 * Mesma aritmética da produção (lib/campaigns/campaign-pricing.ts, campaign-availability.ts),
 * reescrita para o protótipo. Funções puras.
 */
import {
  AUDIENCES,
  EXCLUSIVITY,
  PRICING,
  byId,
  type Asset,
  type BonusRule,
  type BriefField,
  type Category,
  type PricingModel,
} from './domain';

export const brl = (value: number, digits = 2) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
export const int = (value: number) => Math.round(value).toLocaleString('pt-BR');
export const pct = (value: number, digits = 0) =>
  `${value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
export const dateBR = (iso: string) => (iso ? iso.split('-').reverse().join('/') : '—');
export const dateShort = (iso: string) => (iso ? iso.split('-').reverse().slice(0, 2).join('/') : '—');

/** "1.234,56" → 1234.56; aceita também "1234.56". Vazio → NaN. */
export function parseMoney(text: string) {
  const clean = text.replace(/[^\d,.-]/g, '').trim();
  if (!clean) return Number.NaN;
  const normalized = clean.includes(',') ? clean.replace(/\./g, '').replace(',', '.') : clean;
  return Number(normalized);
}

export type BudgetBounds = {
  min: number;
  recommended?: number;
  max?: number;
  step?: number;
  /** teto só visual do controle deslizante */
  sliderMax: number;
};

export function budgetBounds(asset: Asset): BudgetBounds {
  const base = asset.basePrice;
  if (base > 0) {
    const min = asset.minPurchase ? Math.max(Math.ceil(asset.minPurchase / base) * base, base) : base;
    const recommended = asset.recommended ? Math.round(asset.recommended / base) * base : undefined;
    const max = asset.maxValue ? Math.floor(asset.maxValue / base) * base : undefined;
    return { min, recommended, max, step: base, sliderMax: max ?? Math.max(min * 20, 100_000) };
  }
  const min = asset.minPurchase ?? 0;
  return { min, max: asset.maxValue, sliderMax: asset.maxValue ?? Math.max(min * 20, 100_000) };
}

/** Arredonda ao múltiplo do preço-base e limita à faixa. */
export function snapBudget(value: number, bounds: BudgetBounds) {
  if (!Number.isFinite(value) || value <= 0) return value;
  let next = bounds.step ? Math.round(value / bounds.step) * bounds.step : value;
  next = Math.max(next, bounds.min);
  if (bounds.max) next = Math.min(next, bounds.max);
  return Math.round(next * 100) / 100;
}

export function estimateUnits(asset: Asset, budget: number) {
  if (!asset.basePrice || !budget) return 0;
  const units = Math.floor(budget / asset.basePrice + 1e-9);
  return asset.pricing === 'cpm' ? units * 1000 : units;
}
export function unitsLabel(asset: Asset) {
  return PRICING[asset.pricing].unitPlural;
}

export function budgetErrors(asset: Asset, budget: number): string | undefined {
  if (!PRICING[asset.pricing].needsBudget) return undefined;
  if (!Number.isFinite(budget) || budget <= 0) return 'Informe a verba da campanha.';
  const bounds = budgetBounds(asset);
  if (budget < bounds.min) return `Verba mínima deste ativo: ${brl(bounds.min)}.`;
  if (bounds.max && budget > bounds.max) return `Verba máxima deste ativo: ${brl(bounds.max)}.`;
  if (bounds.step) {
    const remainder = Math.abs(budget / bounds.step - Math.round(budget / bounds.step)) * bounds.step;
    if (remainder > 0.01) return `A verba deve ser múltipla de ${brl(bounds.step)} (preço base do ativo).`;
  }
  return undefined;
}

/* ——— Bônus ——— */
export type BonusState = 'liberado' | 'bloqueado' | 'incluido';
/** `model` é o modelo efetivo da campanha (no pacote, o escolhido); sem ele, vale o do ativo. */
export function bonusState(rule: BonusRule, asset: Asset, budget: number, campaignCount: number, model?: PricingModel | ''): BonusState {
  if ((model || asset.pricing) === 'bonus') return 'incluido';
  const pass = rule.conditions.every((condition) => {
    const left = condition.field === 'budget' ? budget || 0 : campaignCount;
    switch (condition.op) {
      case '>':
        return left > condition.value;
      case '<=':
        return left <= condition.value;
      case '<':
        return left < condition.value;
      case '==':
        return left === condition.value;
      default:
        return left >= condition.value;
    }
  });
  return pass ? 'liberado' : 'bloqueado';
}
export function bonusConditionText(rule: BonusRule) {
  if (rule.conditions.length === 0) return 'Sempre incluído';
  return rule.conditions
    .map((condition) =>
      condition.field === 'budget'
        ? `Verba ${condition.op === '>=' ? '≥' : condition.op} ${brl(condition.value)}`
        : `A partir da ${condition.value}ª campanha`,
    )
    .join(' e ');
}

/* ——— Alocação ——— */
/** Divisão igual com o resto no primeiro item (33,34 / 33,33 / 33,33). */
export function equalSplit(ids: string[]): Record<string, number> {
  if (ids.length === 0) return {};
  const base = Math.floor((100 / ids.length) * 100) / 100;
  const rest = Math.round((100 - base * ids.length) * 100) / 100;
  return Object.fromEntries(ids.map((id, index) => [id, index === 0 ? base + rest : base]));
}
export const sum = (values: number[]) => values.reduce((total, value) => total + (Number(value) || 0), 0);
export function allocationError(kind: 'canal' | 'público', total: number) {
  return Math.abs(total - 100) > 0.5
    ? `As alocações de ${kind} somam ${pct(total, 1)} — devem somar 100%.`
    : undefined;
}

/* ——— Públicos: limites, disponibilidade e frequência ——— */
export function audienceLimits(audienceId: string, model: PricingModel | '') {
  const audience = byId(AUDIENCES, audienceId);
  return model ? audience?.limits[model] : undefined;
}
export function audienceAvailable(audienceId: string, model: PricingModel | '') {
  const limits = audienceLimits(audienceId, model);
  return limits ? Math.max(0, limits.capacity - limits.reserved) : undefined;
}
export function audienceVolume(asset: Asset, budget: number, share: number) {
  if (!asset.basePrice || !budget) return 0;
  return Math.round(((budget * share) / 100 / asset.basePrice) * (asset.pricing === 'cpm' ? 1000 : 1));
}
export function audienceIssue(audienceId: string, model: PricingModel | '', volume: number): string | undefined {
  const limits = audienceLimits(audienceId, model);
  if (!limits || !volume) return undefined;
  if (volume > limits.capacity - limits.reserved) return 'estoque';
  if (volume < limits.min) return 'minimo';
  if (volume > limits.maxPerAdvertiser) return 'maximo';
  return undefined;
}
export function frequency(audienceId: string, volume: number) {
  const audience = byId(AUDIENCES, audienceId);
  if (!audience || !audience.size || !volume) return undefined;
  const f = volume / audience.size;
  return f < 0.01 ? '< 0,01×' : `${f.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}×`;
}

/* ——— Exclusividade por CNPJ ——— */
export function exclusivityBlock(advertiserId: string, category: Category | '', start: string, end: string) {
  if (!advertiserId || !category || !start || !end) return undefined;
  return EXCLUSIVITY.find(
    (rule) =>
      rule.blocked.includes(advertiserId) &&
      rule.category === category &&
      start <= rule.end &&
      end >= rule.start,
  );
}

/* ——— Briefing ——— */
export type FormValues = Record<string, unknown>;
export function fieldVisible(field: BriefField, values: FormValues) {
  if (!field.showIf) return true;
  const raw = values[field.showIf.field];
  const text = Array.isArray(raw) ? raw.join(',') : String(raw ?? '');
  const { op, value } = field.showIf;
  if (op === 'eq') return text === value;
  if (op === 'neq') return text !== value;
  if (op === 'contains') return text.includes(value);
  if (op === 'gt') return Number(text) > Number(value);
  return Number(text) < Number(value);
}
export function isFilled(field: BriefField, value: unknown) {
  if (field.type === 'file_upload') {
    const file = value as { name?: string; later?: boolean } | undefined;
    return Boolean(file?.name || file?.later);
  }
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && String(value).trim() !== '';
}
export function missingRequired(fields: BriefField[], values: FormValues) {
  return fields.filter((field) => field.required && fieldVisible(field, values) && !isFilled(field, values[field.id]));
}
