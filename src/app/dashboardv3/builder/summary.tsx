'use client';

import { Check, ChevronDown, CircleAlert, TriangleAlert } from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { BrandMark, VisuallyHidden } from '@/components/ds-v3';
import {
  ASSETS,
  AUDIENCES,
  CATEGORIES,
  CHANNELS,
  PACKAGES,
  PRICING,
  byId,
  type Asset,
} from '../domain';
import {
  bonusState,
  brl,
  dateShort,
  estimateUnits,
  int,
  missingRequired,
  parseMoney,
  unitsLabel,
} from '../pricing';
import { mainAsset, type CampaignDraft } from '../store';
import { onRadioKeys, rovingTab } from './ui';
import { STEPS, effectiveModel, validateStep } from './validation';
import s from './summary.module.css';

const time = (iso: string) => new Date(`${iso}T12:00:00`).getTime();
export function days(start: string, end: string) {
  if (!start || !end || end < start) return 0;
  return Math.round((time(end) - time(start)) / 86_400_000) + 1;
}

/** Motivo dos ajustes pedidos pelo comercial (campanha em "ajustes solicitados"). */
export type AdjustmentReason = { text: string; at: string; who?: string };

/** A lateral só fica fixa ao lado do formulário a partir de 1021px; abaixo disso o resumo recolhe. */
const WIDE = '(min-width: 1021px)';
function subscribeWide(notify: () => void) {
  const query = window.matchMedia(WIDE);
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
}
const useWide = () =>
  useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE).matches,
    () => true,
  );

/** Período da campanha desenhado dentro da janela do ativo. */
function WindowBar({ asset, start, end }: { asset: Asset; start: string; end: string }) {
  const from = time(asset.window.start);
  const span = time(asset.window.end) - from || 1;
  const left = start ? Math.max(0, Math.min(1, (time(start) - from) / span)) : 0;
  const right = end ? Math.max(0, Math.min(1, (time(end) - from) / span)) : 0;
  const has = Boolean(start && end && end >= start);
  return (
    <div className={s.window}>
      <div className={s.track} aria-hidden="true">
        {has && (
          <i
            style={
              {
                '--l': `${left * 100}%`,
                '--w': `${Math.max(2, (right - left) * 100)}%`,
              } as CSSProperties
            }
          />
        )}
      </div>
      <div className={s.trackLegend}>
        <span>{dateShort(asset.window.start)}</span>
        <span>janela do ativo</span>
        <span>{dateShort(asset.window.end)}</span>
      </div>
    </div>
  );
}

export function Bars({
  items,
  layout = 'stack',
}: {
  items: { name: string; share: number; note?: string }[];
  /**
   * `compact`: uma linha por item (nome · %) com o traço de 2 px embaixo — lateral estreita.
   * `inline`: a nota sobe para a linha do nome, antes do % — revisão, onde a altura é contada.
   */
  layout?: 'stack' | 'compact' | 'inline';
}) {
  return (
    <ul className={s.bars} data-layout={layout}>
      {items.map((item) => (
        <li key={item.name}>
          <span className={s.barName}>{item.name}</span>
          <b>{Math.round(item.share)}%</b>
          <i aria-hidden="true">
            <i style={{ width: `${Math.min(100, item.share)}%` }} />
          </i>
          {item.note && <small>{item.note}</small>}
        </li>
      ))}
    </ul>
  );
}

function Block({
  label,
  meta,
  current,
  empty,
  placeholder = 'A definir',
  children,
}: {
  label: string;
  meta?: ReactNode;
  current?: boolean;
  /** Onde o dado será definido; quando presente, o bloco mostra o valor de espera. */
  empty?: string;
  placeholder?: string;
  children?: ReactNode;
}) {
  return (
    <section className={s.block} data-current={current || undefined}>
      <div className={s.blockHead}>
        <span className={s.label}>{label}</span>
        {meta && <span className={s.meta}>{meta}</span>}
      </div>
      {empty ? (
        <>
          <span className={s.placeholder}>{placeholder}</span>
          <p className={s.empty}>{empty}</p>
        </>
      ) : (
        children
      )}
    </section>
  );
}

/** O pedido de ajustes abre a lateral: é o motivo de a campanha estar sendo editada. */
function ReasonNote({ reason, lines = 3 }: { reason: AdjustmentReason; lines?: 2 | 3 }) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  useEffect(() => {
    const node = textRef.current;
    if (!node || expanded) return;
    const measure = () => setClamped(node.scrollHeight > node.clientHeight + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [expanded, reason.text]);
  const at = new Date(reason.at);
  const when = Number.isNaN(at.getTime())
    ? ''
    : ` · ${at.toLocaleDateString('pt-BR')} às ${at.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  return (
    <section className={s.reason} aria-labelledby="ajustes-solicitados">
      <span className={s.reasonLabel} id="ajustes-solicitados">
        <i aria-hidden="true" />
        Ajustes solicitados
      </span>
      <p ref={textRef} className={s.reasonText} data-lines={lines} data-open={expanded || undefined}>
        {reason.text}
      </p>
      {clamped && !expanded && (
        <button type="button" className={s.textButton} onClick={() => setExpanded(true)}>
          ver tudo
        </button>
      )}
      <span className={s.reasonMeta}>
        {reason.who ?? 'Comercial do portal'}
        {when}
      </span>
    </section>
  );
}

/** Resumo vivo ao lado do formulário: o que a campanha já é, desenhado com os próprios dados. */
export function Summary({
  draft,
  campaignCount,
  advertiserName,
  step,
  reason,
}: {
  draft: CampaignDraft;
  campaignCount: number;
  advertiserName?: string;
  step: number;
  reason?: AdjustmentReason;
}) {
  const wide = useWide();
  const [openSmall, setOpenSmall] = useState(false);
  const asset = mainAsset(draft);
  const model = effectiveModel(draft);
  const budget = parseMoney(draft.budget);
  const hasBudget = Number.isFinite(budget) && budget > 0;
  const isPackage = draft.selectionKind === 'package';
  const pack = byId(PACKAGES, draft.packageId);
  const what = isPackage ? pack?.name : byId(ASSETS, draft.assetId)?.name;
  const period = days(draft.startDate, draft.endDate);
  const periodText = period > 0 ? `${period} ${period === 1 ? 'dia' : 'dias'}` : undefined;
  const allocation = Boolean(asset?.allowAllocation);
  const fixed = model && !PRICING[model].needsBudget;
  const fixedPrice = isPackage ? pack?.totalPrice : asset?.basePrice;
  const amount = hasBudget
    ? brl(budget)
    : fixed
      ? model === 'bonus'
        ? 'Sem cobrança'
        : fixedPrice
          ? brl(fixedPrice)
          : undefined
      : undefined;
  const channels = draft.channelIds.map((id) => ({
    name: byId(CHANNELS, id)?.name ?? id,
    share: allocation ? (draft.channelAlloc[id] ?? 0) : 100 / draft.channelIds.length,
  }));
  const audiences = draft.audienceIds.map((id) => ({
    name: byId(AUDIENCES, id)?.name ?? id,
    share: allocation ? (draft.audienceAlloc[id] ?? 0) : 100 / draft.audienceIds.length,
  }));
  return (
    <>
      {reason && (
        <div className={s.lead}>
          {/* No resumo, duas linhas: o texto inteiro está no painel de envio e no "ver tudo". */}
          <ReasonNote reason={reason} lines={2} />
        </div>
      )}
      <details
        className={s.disclosure}
        open={wide || openSmall}
        onToggle={(event) => {
          if (!wide) setOpenSmall(event.currentTarget.open);
        }}
      >
        <summary className={s.disclosureHead}>
          <span>
            Resumo · {amount ?? 'sem verba'} · {periodText ?? 'sem período'}
          </span>
          <ChevronDown aria-hidden="true" />
        </summary>
        <div className={s.panel}>
          <div className={s.identity}>
            {advertiserName && <BrandMark name={advertiserName} size="md" decorative />}
            <div>
              <strong data-empty={!draft.name || undefined}>
                {draft.name || 'Campanha sem nome'}
              </strong>
              <span>{advertiserName ?? 'Anunciante a definir'}</span>
            </div>
          </div>

          <Block
            label="Verba"
            current={step === 2}
            empty={amount ? undefined : 'Definida na etapa 3, Precificação.'}
          >
            <b className={s.amount}>{amount}</b>
            {asset && !isPackage && hasBudget && asset.basePrice > 0 && (
              <span className={s.estimate}>
                ≈ {int(estimateUnits(asset, budget))} {unitsLabel(asset)}
              </span>
            )}
            <span className={s.sub}>
              {model ? PRICING[model].label : ''}
              {!isPackage && asset?.basePrice && model && PRICING[model].needsBudget
                ? ` · ${brl(asset.basePrice)} por ${PRICING[model].unit}`
                : fixed
                  ? isPackage
                    ? ' · preço fechado no pacote'
                    : ' · preço fechado no ativo'
                  : ''}
            </span>
          </Block>

          <Block
            label={isPackage ? 'Pacote' : 'Ativo'}
            current={step === 1}
            empty={what ? undefined : 'Escolhido na etapa 2, Ativo.'}
            meta={
              draft.category
                ? CATEGORIES.find((item) => item.value === draft.category)?.label
                : undefined
            }
          >
            <strong className={s.value}>{what}</strong>
            {asset && !isPackage && (
              <span className={s.sub}>
                {asset.channelIds.length} {asset.channelIds.length === 1 ? 'canal' : 'canais'} ·{' '}
                {asset.audienceIds.length}{' '}
                {asset.audienceIds.length === 1 ? 'público disponível' : 'públicos disponíveis'}
              </span>
            )}
            {isPackage && pack && (
              <span className={s.sub}>{pack.assetIds.length} ativos no pacote</span>
            )}
          </Block>

          <Block
            label="Período"
            current={step === 1}
            meta={periodText}
            empty={period > 0 || asset ? undefined : 'Definido na etapa 2, Ativo.'}
          >
            <strong className={s.value} data-empty={!period || undefined}>
              {period > 0
                ? `${dateShort(draft.startDate)} – ${dateShort(draft.endDate)}`
                : 'A definir'}
            </strong>
            {asset && <WindowBar asset={asset} start={draft.startDate} end={draft.endDate} />}
          </Block>

          <Block
            label="Distribuição"
            current={step === 3}
            empty={
              channels.length || audiences.length
                ? undefined
                : 'Marcados na etapa 4, Canal + Público.'
            }
          >
            {channels.length > 0 && (
              <div className={s.group}>
                <span className={s.groupLabel}>Canais</span>
                <Bars items={channels} layout="compact" />
              </div>
            )}
            {audiences.length > 0 && (
              <div className={s.group}>
                <span className={s.groupLabel}>Públicos</span>
                <Bars items={audiences} layout="compact" />
              </div>
            )}
          </Block>

          {asset && asset.bonuses.length > 0 && (
            <Block
              label="Bônus"
              current={step === 2}
              meta={`${asset.bonuses.filter((rule) => bonusState(rule, asset, hasBudget ? budget : 0, campaignCount, model) !== 'bloqueado').length} de ${asset.bonuses.length}`}
            >
              <ul className={s.bonus}>
                {asset.bonuses.map((rule) => {
                  const state = bonusState(
                    rule,
                    asset,
                    hasBudget ? budget : 0,
                    campaignCount,
                    model,
                  );
                  const budgetRule = rule.conditions.find(
                    (condition) => condition.field === 'budget',
                  );
                  const missing =
                    budgetRule && state === 'bloqueado'
                      ? budgetRule.value - (hasBudget ? budget : 0)
                      : 0;
                  return (
                    <li key={rule.id} data-state={state} data-long={missing > 0 || undefined}>
                      <i aria-hidden="true" />
                      <span>{rule.name}</span>
                      <small>
                        {state === 'bloqueado'
                          ? missing > 0
                            ? `Faltam ${brl(missing)}`
                            : 'Bloqueado'
                          : state === 'incluido'
                            ? 'Incluído'
                            : 'Liberado'}
                      </small>
                    </li>
                  );
                })}
              </ul>
            </Block>
          )}
        </div>
      </details>
    </>
  );
}

/** Na revisão, a lateral vira a decisão de envio: como salvar, o que falta e o que acontece depois. */
export function SendPanel({
  draft,
  update,
  goTo,
  onFix,
  reason,
}: {
  draft: CampaignDraft;
  update: (patch: Partial<CampaignDraft>) => void;
  goTo: (index: number) => void;
  /** Abre a etapa já marcando os campos que faltam (atalho "Preencher" e itens da Checagem com pendência). */
  onFix: (index: number) => void;
  advertiserName?: string;
  reason?: AdjustmentReason;
}) {
  const asset = mainAsset(draft);
  const missing = asset ? missingRequired(asset.fields, draft.formValues) : [];
  const formIndex = STEPS.findIndex((item) => item.key === 'form');
  const checks = STEPS.slice(0, 5).map((item, index) => {
    const entries = Object.entries(
      validateStep(item.key, item.key === 'form' ? { ...draft, submitNow: true } : draft),
    );
    const state =
      entries.length === 0 ? 'ok' : item.key === 'form' && !draft.submitNow ? 'warn' : 'error';
    const [firstKey, firstMessage] = entries[0] ?? [];
    // Etapa em dia: só o título. Com pendência: o que falta, em uma frase.
    const text =
      state === 'ok'
        ? undefined
        : item.key === 'form' && missing.length
          ? `${missing.length} ${missing.length === 1 ? 'campo obrigatório faltando' : 'campos obrigatórios faltando'}`
          : firstKey === 'block'
            ? 'Contratação bloqueada no período'
            : firstMessage || 'Incompleta';
    return { index, title: item.title, state, text };
  });
  const options = [
    {
      value: false,
      title: 'Salvar como rascunho',
      text: 'Fica com você para continuar depois. Ninguém é notificado.',
    },
    {
      value: true,
      title: 'Enviar para aprovação',
      text: 'O comercial do portal revisa e responde por aqui.',
    },
  ];
  return (
    <div className={s.panel}>
      {reason && <ReasonNote reason={reason} />}
      <div className={s.sendHead}>
        <span className={s.label}>Envio</span>
        <strong>Como salvar esta campanha?</strong>
      </div>
      <div className={s.decision}>
        <div
          className={s.options}
          data-blocked={(draft.submitNow && missing.length > 0) || undefined}
          role="radiogroup"
          aria-label="Enviar para aprovação agora?"
          onKeyDown={onRadioKeys}
        >
          {options.map((option, index) => (
            <button
              key={option.title}
              type="button"
              role="radio"
              aria-checked={draft.submitNow === option.value}
              tabIndex={rovingTab(draft.submitNow === option.value, index, true)}
              className={s.option}
              onClick={() => update({ submitNow: option.value })}
            >
              <span className={s.optionText}>
                <strong>{option.title}</strong>
                <span>{option.text}</span>
              </span>
              <span className={s.radio} aria-hidden="true" />
            </button>
          ))}
        </div>
        {draft.submitNow && missing.length > 0 && (
          <p className={s.blocker}>
            <CircleAlert aria-hidden="true" />
            <span>
              {missing.length === 1
                ? 'Falta 1 campo do briefing'
                : `Faltam ${missing.length} campos do briefing`}
            </span>
            <button type="button" className={s.textButton} onClick={() => onFix(formIndex)}>
              Preencher
            </button>
          </p>
        )}
      </div>

      <Block
        label="Checagem"
        meta={`${checks.filter((check) => check.state === 'ok').length} de ${checks.length}`}
      >
        <ul className={s.checks}>
          {checks.map((check) => (
            <li key={check.title}>
              <button
                type="button"
                data-state={check.state}
                onClick={() => (check.state === 'ok' ? goTo(check.index) : onFix(check.index))}
              >
                <span className={s.checkIcon} aria-hidden="true">
                  {check.state === 'ok' ? (
                    <Check />
                  ) : check.state === 'warn' ? (
                    <TriangleAlert />
                  ) : (
                    <CircleAlert />
                  )}
                </span>
                <span className={s.checkText}>
                  <b>{check.title}</b>
                  {check.text ? (
                    <span>{check.text}</span>
                  ) : (
                    <VisuallyHidden>(sem pendências)</VisuallyHidden>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Block>

      {draft.submitNow && (
        <Block label="Depois do envio">
          <ol className={s.next}>
            <li>
              <b>Aprovação do portal</b>
            </li>
            <li>
              <b>P.I. para assinatura</b>
            </li>
            <li>
              <b>Veiculação</b>
            </li>
          </ol>
        </Block>
      )}
    </div>
  );
}
