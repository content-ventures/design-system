'use client';

import { ArrowLeft, ArrowRight, Check, CircleAlert, Lock, Send, X } from 'lucide-react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Button, Dialog, IconButton } from '@/components/ds-v3';
import {
  ADVERTISERS,
  ASSETS,
  EDITABLE,
  PACKAGES,
  PRICING,
  SELF_ADVERTISER_ID,
  STATUS,
  byId,
} from '../domain';
import { brl, budgetBounds, dateShort, parseMoney, snapBudget } from '../pricing';
import { Shell } from '../shell';
import { emptyDraft, mainAsset, store, useStore, type CampaignDraft, type Persona } from '../store';
import { CreatingDialog, type CreationRun } from './creating';
import { StepAsset, StepIdentification, StepPricing } from './steps-a';
import { StepChannels, StepForm, StepReview } from './steps-b';
import { SendPanel, Summary } from './summary';
import { Alert, type StepProps } from './ui';
import {
  STEPS,
  effectiveModel,
  validateAll,
  validateStep,
  type Errors,
  type StepKey,
} from './validation';
import b from './builder.module.css';

const STEP_VIEW = [StepIdentification, StepAsset, StepPricing, StepChannels, StepForm, StepReview];
const LIST = '/dashboardv3/campanhas';
const NEW = '/dashboardv3/campanhas/nova';

/** Navegar entre etapas não exige o briefing completo: os obrigatórios só valem ao enviar. */
const navigationErrors = (key: StepKey, draft: CampaignDraft) =>
  validateStep(key, key === 'form' ? { ...draft, submitNow: false } : draft);

/** Verba (mesma regra da lista e do detalhe), período compacto e, para o operador, o anunciante. */
function factsOf(draft: CampaignDraft, persona: Persona) {
  const facts: string[] = [];
  const value = parseMoney(draft.budget);
  const model = effectiveModel(draft);
  const pack = draft.selectionKind === 'package' ? byId(PACKAGES, draft.packageId) : undefined;
  if (Number.isFinite(value) && value > 0) facts.push(brl(value));
  else if (model === 'bonus') facts.push('Sem cobrança');
  else if (model && !PRICING[model].needsBudget) {
    const price = pack ? pack.totalPrice : mainAsset(draft)?.basePrice;
    if (price) facts.push(brl(price));
  }
  if (draft.startDate && draft.endDate)
    facts.push(`${dateShort(draft.startDate)} – ${dateShort(draft.endDate)}`);
  // Quem anuncia já sabe em nome de quem: para ele, o fato útil é o ativo contratado.
  const who =
    persona === 'anunciante'
      ? (pack?.name ?? byId(ASSETS, draft.assetId)?.name)
      : byId(ADVERTISERS, draft.advertiserId)?.name;
  if (who) facts.push(who);
  return facts;
}

/**
 * "Criar outra campanha" no fim da criação recomeça do zero na mesma rota: a chave remonta o
 * construtor com estado limpo (na edição, a navegação para /nova já faz isso).
 */
export function CampaignBuilder({ mode, id }: { mode: 'create' | 'edit'; id?: string }) {
  const [round, setRound] = useState(0);
  return (
    <Builder
      key={round}
      mode={mode}
      id={id}
      restarted={round > 0}
      onRestart={() => setRound((current) => current + 1)}
    />
  );
}

function Builder({
  mode,
  id,
  restarted,
  onRestart,
}: {
  mode: 'create' | 'edit';
  id?: string;
  restarted: boolean;
  onRestart: () => void;
}) {
  const router = useRouter();
  const { persona, campaigns } = useStore();
  // Retrato da campanha na abertura: depois de salvar, o status novo ("Enviada") não pode trocar a
  // tela por "não pode ser editada" por trás do diálogo de conclusão.
  const [existing] = useState(() => (mode === 'edit' && id ? store.get(id) : undefined));
  const initial = useMemo<CampaignDraft>(
    () => existing?.draft ?? emptyDraft(persona),
    [existing, persona],
  );
  const [draft, setDraft] = useState<CampaignDraft>(initial);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]));
  const [exitTo, setExitTo] = useState<string | null>(null);
  const [run, setRun] = useState<CreationRun | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [adjusted, setAdjusted] = useState<{ from: number; to: number } | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const sideRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLOListElement>(null);
  const createdByAdmin = existing ? existing.createdByAdmin : persona === 'operador';
  // A campanha em edição não conta para a regra "número de campanhas" dos bônus.
  const advertiserCampaigns = campaigns.filter(
    (campaign) =>
      campaign.draft.advertiserId === draft.advertiserId &&
      campaign.status !== 'draft' &&
      campaign.id !== existing?.id,
  ).length;
  const listLabel = persona === 'anunciante' ? 'Minhas campanhas' : 'Campanhas';
  // O anunciante só edita as próprias campanhas; a de outra empresa responde como inexistente.
  const foreign = Boolean(
    persona === 'anunciante' && existing && existing.draft.advertiserId !== SELF_ADVERTISER_ID,
  );
  const locked = mode === 'edit' && (!existing || foreign || !EDITABLE.includes(existing.status));
  const busy = run !== null;

  // Na abertura da edição: a verba gravada fora da regra do ativo é ajustada uma vez, com aviso,
  // e `?etapa=N` abre direto na etapa pedida, já mostrando o que falta nela.
  useEffect(() => {
    if (mode !== 'edit' || !existing || locked) return;
    let effective = existing.draft;
    const asset = mainAsset(existing.draft);
    const value = parseMoney(existing.draft.budget);
    if (
      asset &&
      Number.isFinite(value) &&
      value > 0 &&
      existing.draft.selectionKind !== 'package'
    ) {
      const snapped = snapBudget(value, budgetBounds(asset));
      if (Math.abs(snapped - value) > 0.009) {
        const budget = snapped.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        effective = { ...effective, budget };
        setAdjusted({ from: value, to: snapped });
        setDraft((current) => ({ ...current, budget }));
      }
    }
    const asked = Number(new URLSearchParams(window.location.search).get('etapa'));
    const key = Number.isInteger(asked) ? STEPS[asked - 1]?.key : undefined;
    if (!key) return;
    const index = asked - 1;
    setVisited(new Set(Array.from({ length: index + 1 }, (_, at) => at)));
    setStep(index);
    const found = validateStep(key, { ...effective, submitNow: true });
    requestAnimationFrame(() => reveal(found));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // O papel "anunciante" monta a campanha em seu próprio nome.
  useEffect(() => {
    if (mode === 'create')
      setDraft((current) => ({
        ...current,
        advertiserId:
          emptyDraft(persona).advertiserId || (persona === 'operador' ? current.advertiserId : ''),
      }));
  }, [persona, mode]);

  // Depois de salvar não há mais o que perder: sai o aviso de saída e o "Alterações não salvas".
  const dirty = savedId === null && JSON.stringify(draft) !== JSON.stringify(initial);

  // "Criar outra campanha": o formulário novo abre com o foco no título da primeira etapa.
  useEffect(() => {
    if (!restarted) return;
    const frame = requestAnimationFrame(() =>
      mainRef.current?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fechar a aba com alterações pede confirmação do navegador.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // O diálogo de saída abre com o foco na ação segura.
  useEffect(() => {
    if (exitTo === null) return;
    const frame = requestAnimationFrame(() =>
      document.querySelector<HTMLElement>('dialog[open] [data-autofocus]')?.focus(),
    );
    return () => cancelAnimationFrame(frame);
  }, [exitTo]);

  const last = step === STEPS.length - 1;
  const stateOf = (index: number) => {
    if (index === step) return 'current';
    // A régua usa a regra completa: o briefing conta como pendência de envio.
    const key = STEPS[index]?.key;
    const full = key
      ? validateStep(key, key === 'form' ? { ...draft, submitNow: true } : draft)
      : {};
    const hasErrors = Object.keys(full).length > 0;
    // Num rascunho, o briefing incompleto não impede salvar: é aviso, não erro.
    if (visited.has(index) && index < step && key === 'form' && hasErrors && !draft.submitNow)
      return 'warn';
    if (visited.has(index) && hasErrors && index < step) return 'error';
    if (visited.has(index) && !hasErrors && index < STEPS.length - 1) return 'done';
    return 'upcoming';
  };
  const errorCount =
    Object.keys(errors).filter((key) => key !== 'block' && key !== 'form').length ||
    (errors.form ? 1 : 0);

  function update(patch: Partial<CampaignDraft>) {
    const next = { ...draft, ...patch };
    setDraft(next);
    if ('budget' in patch) setAdjusted(null);
    // Mantém só os erros que continuam valendo; nada some antes de ser corrigido.
    setErrors((current) => {
      if (!Object.keys(current).length) return current;
      const key = STEPS[step]?.key;
      const fresh = key ? validateStep(key, next) : {};
      return Object.fromEntries(Object.entries(fresh).filter(([name]) => name in current));
    });
  }
  /** Troca de etapa. `focusHeading` falso quando a seguir vem `reveal`: o foco vai para o campo, não para o título. */
  function show(index: number, focusHeading = true) {
    setStep(index);
    setVisited((current) => new Set(current).add(index));
    setErrors({});
    // A moldura não se move: o miolo e a lateral voltam ao topo, e a régua rola só no próprio trilho.
    requestAnimationFrame(() => {
      mainRef.current?.scrollTo({ top: 0 });
      sideRef.current?.scrollTo({ top: 0 });
      bodyRef.current?.scrollTo({ top: 0 });
      const list = stepsRef.current;
      const item = list?.querySelector<HTMLElement>('[aria-current="step"]');
      if (list && item && list.scrollWidth > list.clientWidth)
        list.scrollTo({ left: item.offsetLeft - (list.clientWidth - item.offsetWidth) / 2 });
      if (focusHeading)
        mainRef.current?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
    });
  }
  /** Marca os erros e leva o foco ao primeiro campo inválido (os erros já estão no DOM quando a busca roda). */
  function reveal(found: Errors) {
    flushSync(() => setErrors(found));
    const main = mainRef.current;
    // O primeiro campo inválido manda; um aviso solto (sem campo) só rola até ele.
    const target =
      main?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
      main?.querySelector<HTMLElement>('[role="alert"]');
    target?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
    const control = target?.matches('input, select, textarea, button')
      ? target
      : target?.querySelector<HTMLElement>('input, button, textarea');
    if (control) control.focus({ preventScroll: true });
    else main?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  }
  function goTo(index: number) {
    if (index <= step) return show(index);
    for (let at = step; at < index; at += 1) {
      const key = STEPS[at]?.key;
      if (!key) break;
      const found = navigationErrors(key, draft);
      if (Object.keys(found).length) {
        show(at, false);
        requestAnimationFrame(() => reveal(found));
        return;
      }
    }
    show(index);
  }
  /** Atalho "Preencher"/Checagem da revisão: abre a etapa já mostrando o que falta para enviar. */
  function fix(index: number) {
    const key = STEPS[index]?.key;
    show(index, false);
    if (!key) return;
    const found = validateStep(key, key === 'form' ? { ...draft, submitNow: true } : draft);
    requestAnimationFrame(() => reveal(found));
  }
  /**
   * Validado, o salvamento roda no diálogo de criação (conferindo → gerando → notificando), que
   * grava na etapa certa e termina com "Ver campanha" / "Criar outra campanha". Sem toast: o diálogo
   * já é o aviso.
   */
  function start(payload: CampaignDraft) {
    if (run) return;
    setRun({
      kind: payload.submitNow ? 'submit' : 'draft',
      edit: mode === 'edit',
      resent: existing?.status === 'adjustments_requested',
      isPackage: payload.selectionKind === 'package',
      name: payload.name.trim(),
      facts: factsOf(payload, persona),
      commit: () => {
        const saved = store.save(payload, { id: existing?.id, persona });
        setSavedId(saved);
        return saved;
      },
    });
  }
  function save() {
    const invalid = validateAll(draft);
    if (invalid) {
      show(invalid.index, false);
      requestAnimationFrame(() => reveal(invalid.errors));
      return;
    }
    start(draft);
  }
  /** Como na produção: salvar valida e, se faltar algo, volta à primeira etapa com pendência. */
  function saveDraft() {
    const next = { ...draft, submitNow: false };
    const invalid = validateAll(next);
    if (invalid) {
      show(invalid.index, false);
      requestAnimationFrame(() => reveal(invalid.errors));
      return;
    }
    setDraft(next);
    start(next);
  }
  function restart() {
    if (mode === 'create') onRestart();
    else router.push(NEW as Route);
  }
  function leave(href = LIST) {
    if (dirty) return setExitTo(href);
    router.push(href as Route);
  }
  const onNavigate = (href: string) => {
    if (!dirty) return true;
    setExitTo(href);
    return false;
  };

  const title = mode === 'edit' ? 'Editar campanha' : 'Nova campanha';
  const crumbs = [
    { label: persona === 'anunciante' ? 'Anunciar' : 'Operação' },
    { label: listLabel, href: LIST },
    { label: mode === 'edit' && !foreign ? existing?.draft.name || title : title },
  ];

  if (locked) {
    const known = existing && !foreign ? existing : undefined;
    return (
      <Shell crumbs={crumbs}>
        <div className={b.locked}>
          {known && <Lock aria-hidden="true" />}
          <h1>
            {known ? 'Esta campanha não pode ser editada' : 'Campanha não encontrada neste portal'}
          </h1>
          <p>
            {known
              ? `Só rascunhos e campanhas com ajustes solicitados podem ser editados. Status atual: ${STATUS[known.status].label}.`
              : 'Ela pode ter sido excluída. Volte à lista de campanhas.'}
          </p>
          <div className={b.lockedActions}>
            {known && (
              <Button variant="primary" onClick={() => router.push(`${LIST}/${known.id}` as Route)}>
                Ver a campanha
              </Button>
            )}
            <Button onClick={() => router.push(LIST as Route)}>Voltar para campanhas</Button>
          </div>
        </div>
      </Shell>
    );
  }

  const View = STEP_VIEW[step] ?? StepIdentification;
  const current = STEPS[step] ?? STEPS[0];
  const props: StepProps = {
    draft,
    update,
    errors,
    persona,
    goTo,
    campaignCount: advertiserCampaigns + 1,
    campaignId: existing?.id,
    adjustedBudget: adjusted ?? undefined,
  };
  const advertiserName = byId(ADVERTISERS, draft.advertiserId)?.name;
  const reason = existing?.status === 'adjustments_requested' ? existing.reason : undefined;
  const saveState = dirty
    ? adjusted
      ? 'Verba ajustada — salve para manter'
      : 'Alterações não salvas'
    : mode === 'edit'
      ? 'Sem alterações'
      : undefined;

  return (
    <Shell frame crumbs={crumbs} onNavigate={onNavigate}>
      <div className={b.frame} data-fixed-footer>
        <div className={b.head}>
          <div className={b.title}>
            <h1>{title}</h1>
            <span>{createdByAdmin ? 'Criada pelo admin' : 'Criada pelo anunciante'}</span>
          </div>
          <IconButton
            className={b.headClose}
            label="Cancelar"
            icon={X}
            variant="ghost"
            onClick={() => leave()}
          />
          <ol className={b.steps} aria-label="Etapas da campanha" ref={stepsRef}>
            {STEPS.map((item, index) => {
              const state = stateOf(index);
              return (
                <li
                  key={item.key}
                  data-after-done={index > 0 && stateOf(index - 1) === 'done' ? true : undefined}
                >
                  <button
                    type="button"
                    className={b.stepButton}
                    data-state={state}
                    aria-current={index === step ? 'step' : undefined}
                    onClick={() => goTo(index)}
                  >
                    <span className={b.marker} aria-hidden="true">
                      {state === 'done' ? (
                        <Check />
                      ) : state === 'error' || state === 'warn' ? (
                        '!'
                      ) : (
                        index + 1
                      )}
                    </span>
                    {item.title}
                    {state === 'done' && <span className={b.srOnly}>(concluída)</span>}
                    {state === 'error' && <span className={b.srOnly}>(revise esta etapa)</span>}
                    {state === 'warn' && (
                      <span className={b.srOnly}>(briefing com campos pendentes)</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div className={b.body} ref={bodyRef}>
          <main
            className={b.main}
            ref={mainRef}
            aria-label={`Etapa ${step + 1} de ${STEPS.length}: ${current.title}`}
          >
            <div className={b.content}>
              {/* Na etapa 3 o ajuste é dito no próprio campo de verba, sem um aviso a mais no topo. */}
              {adjusted && step === 0 && (
                <Alert tone="amber" title="Verba ajustada">
                  A verba foi ajustada de {brl(adjusted.from)} para {brl(adjusted.to)} para seguir a
                  regra do ativo.
                </Alert>
              )}
              <View {...props} />
            </div>
          </main>
          <aside
            className={b.side}
            aria-label={last ? 'Envio' : 'Resumo da campanha'}
            data-panel={last ? 'send' : 'summary'}
            ref={sideRef}
          >
            {last ? (
              <SendPanel
                draft={draft}
                update={update}
                goTo={goTo}
                onFix={fix}
                advertiserName={advertiserName}
                reason={reason}
              />
            ) : (
              <Summary
                draft={draft}
                campaignCount={advertiserCampaigns + 1}
                advertiserName={advertiserName}
                step={step}
                reason={reason}
              />
            )}
          </aside>
        </div>

        <div className={b.footer} role="region" aria-label="Ações da campanha">
          <div className={b.status}>
            {saveState && (
              <span className={b.saveState} data-clean={!dirty || undefined}>
                <i aria-hidden="true" />
                {saveState}
              </span>
            )}
            <span className={b.stepCount}>
              Etapa {step + 1} de {STEPS.length}
            </span>
            {errorCount > 0 && (
              <span className={b.errorCount} role="status">
                <CircleAlert aria-hidden="true" />
                Revise{' '}
                {errorCount === 1 ? 'o campo sinalizado' : `os ${errorCount} campos sinalizados`}
              </span>
            )}
          </div>
          <div className={b.footerButtons}>
            <Button variant="ghost" className={b.cancel} onClick={() => leave()}>
              Cancelar
            </Button>
            {/* Na revisão a ação principal já salva o rascunho: o espaço fica, para nada pular. */}
            <Button
              variant="ghost"
              className={b.draftSlot}
              disabled={busy}
              onClick={saveDraft}
              data-hidden={last || undefined}
              aria-hidden={last || undefined}
              tabIndex={last ? -1 : undefined}
            >
              Salvar rascunho
            </Button>
            <Button
              icon={ArrowLeft}
              className={b.back}
              aria-label="Voltar"
              disabled={step === 0 || busy}
              onClick={() => show(step - 1)}
            >
              <span className={b.backText}>Voltar</span>
            </Button>
            <span className={b.primarySlot}>
              {last ? (
                <Button
                  variant="primary"
                  icon={draft.submitNow ? Send : Check}
                  disabled={busy}
                  onClick={save}
                >
                  {draft.submitNow ? 'Enviar para aprovação' : 'Salvar rascunho'}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  trailingIcon={ArrowRight}
                  disabled={busy}
                  onClick={() => goTo(step + 1)}
                >
                  Continuar
                </Button>
              )}
            </span>
          </div>
        </div>
      </div>

      <Dialog
        open={exitTo !== null}
        onClose={() => setExitTo(null)}
        size="sm"
        divided={false}
        title="Descartar a campanha?"
        description="O que você preencheu ainda não foi salvo e será perdido."
        footer={
          <>
            <Button data-autofocus onClick={() => setExitTo(null)}>
              Continuar editando
            </Button>
            <Button variant="danger" onClick={() => router.push((exitTo ?? LIST) as Route)}>
              Descartar
            </Button>
          </>
        }
      >
        {null}
      </Dialog>

      <CreatingDialog
        run={run}
        onView={(saved) => router.push(`${LIST}/${saved}` as Route)}
        onRestart={restart}
        onList={() => router.push(LIST as Route)}
      />
    </Shell>
  );
}
