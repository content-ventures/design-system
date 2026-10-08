'use client';

import { useEffect, useId, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { VisuallyHidden, useAnnouncer } from './a11y';
import { Button } from './button';
import { ProgressSteps, Reveal, Spinner, type ProgressStep } from './feedback';
import {
  ChevronDown,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleStop,
  RotateCcw,
  Sparkles,
} from './icons';
import { LinkButton } from './link';
import s from './agent-trace.module.css';

/*
 * Rastro de uma geração da IA (“Lendo material · Selecionando falas · Escrevendo seção 2 de 3”).
 * Sem caixa: um cabeçalho que recolhe e as etapas de `ProgressSteps variant="trace"` (marcador de
 * 20 px ligado por trilho de 1 px). Verde só no fim que deu certo, vermelho só na falha, azul só na
 * etapa atual. Mudanças são anunciadas com educação (região `status`), sem mover o foco.
 */

export type AgentTraceStepState = 'upcoming' | 'current' | 'done' | 'error' | 'skipped';

/** Situação do run inteiro. Padrão: derivada das etapas (`stopped` só por prop). */
export type AgentTraceStatus = 'idle' | 'running' | 'done' | 'error' | 'stopped';

export type AgentTraceStep = {
  id: string;
  label: string;
  state: AgentTraceStepState;
  /** À direita: “4 s”, “5 trechos”, “42 falas”. */
  meta?: string;
  /** Sob o rótulo. Em `error`, o motivo (fica em vermelho). */
  detail?: ReactNode;
  /** Fontes que a etapa usou (ex.: `SourceChip`), numa linha que quebra. */
  sources?: ReactNode;
};

export type AgentTraceProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  /** Nome do run (“Gerando artigo”). Também nomeia a lista e prefixa os anúncios. */
  label: string;
  steps: AgentTraceStep[];
  /** Resumo do fim (“Concluído em 38 s · 6 etapas”): no cabeçalho quando concluído ou parado. */
  summary?: ReactNode;
  /** Força a situação (ex.: `stopped` depois de “Parar”). Padrão: derivada das etapas. */
  status?: AgentTraceStatus;
  /** `full` cabeçalho + etapas · `compact` uma linha (etapa atual + “3/6”) para painéis e listas. */
  variant?: 'full' | 'compact';
  /** O cabeçalho recolhe e abre as etapas. Padrão `true` (só em `full`). */
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  /** Controlado. */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Mostra “Tentar de novo a partir desta etapa” na etapa com falha. */
  onRetry?: (stepId: string) => void;
  /** Padrão: “Tentar de novo a partir desta etapa” (`full`) · “Tentar de novo” (`compact`). */
  retryLabel?: string;
  /** Anuncia mudança de etapa e o fim do run. Desligue numa lista com vários runs. Padrão `true`. */
  announce?: boolean;
  /**
   * Só `compact`: o que a IA está escrevendo agora (“…o pedido pagou a primeira esteira.”), numa
   * segunda linha em `--muted` alinhada ao nome. Sem espaço, corta no começo (as palavras mais
   * novas, no fim, ficam à vista). Não é anunciado.
   */
  preview?: ReactNode;
  /** Só `compact`: ação no fim da linha (“Abrir”), depois da contagem. */
  action?: ReactNode;
  /** Pranchas: estado parado do cabeçalho (`hover`, `active`, `focus`). Nunca no produto. */
  'data-force'?: string;
};

function statusOf(steps: AgentTraceStep[]): AgentTraceStatus {
  if (steps.some((step) => step.state === 'error')) return 'error';
  if (steps.some((step) => step.state === 'current')) return 'running';
  if (steps.length > 0 && steps.every((step) => step.state === 'done' || step.state === 'skipped'))
    return 'done';
  return 'idle';
}

/** Etapa que define a posição: a atual, senão a que falhou. */
function focusStep(steps: AgentTraceStep[]) {
  const index = steps.findIndex((step) => step.state === 'current' || step.state === 'error');
  return index < 0 ? undefined : { step: steps[index] as AgentTraceStep, index };
}

function Glyph({
  status,
  collapsed,
  size,
}: {
  status: AgentTraceStatus;
  collapsed: boolean;
  size: 14 | 16;
}) {
  if (status === 'running') {
    // Aberto, a etapa atual já gira no marcador; recolhido, o cabeçalho mostra a espera.
    return collapsed ? <Spinner size={size} tone="accent" /> : <Sparkles aria-hidden="true" />;
  }
  const Icon =
    status === 'done'
      ? CircleCheck
      : status === 'error'
        ? CircleAlert
        : status === 'stopped'
          ? CircleStop
          : CircleDashed;
  return <Icon aria-hidden="true" />;
}

/**
 * Passos visíveis de uma geração da IA. `full`: cabeçalho de 36 px (ícone de situação, nome,
 * etapa atual ou resumo, “3/6”, chevron) que recolhe as etapas; cada etapa traz meta à direita,
 * `detail` e `sources` embaixo e, na falha, “Tentar de novo a partir desta etapa”. `compact`: uma
 * linha para listas (“Gerando artigo · Escrevendo seção 2 de 3 · 3/6”), com `action` no fim e, se
 * houver `preview`, o texto sendo escrito numa segunda linha. Controlado: o run vive fora do
 * componente; aqui só se desenha e se avisa.
 */
export function AgentTrace({
  label,
  steps,
  summary,
  status: statusProp,
  variant = 'full',
  collapsible = true,
  defaultCollapsed = false,
  collapsed: collapsedProp,
  onCollapsedChange,
  onRetry,
  retryLabel,
  announce: shouldAnnounce = true,
  preview,
  action,
  className = '',
  'data-force': force,
  ...props
}: AgentTraceProps) {
  const listId = useId();
  const [inner, setInner] = useState(defaultCollapsed);
  const compact = variant === 'compact';
  const canCollapse = collapsible && !compact;
  const collapsed = canCollapse ? (collapsedProp ?? inner) : false;
  const status = statusProp ?? statusOf(steps);
  const at = focusStep(steps);
  const total = steps.length;
  const failed = steps.find((step) => step.state === 'error');

  const { announce, region } = useAnnouncer('polite');
  // Anúncio só quando algo muda depois da primeira pintura (abrir a página não fala sozinho).
  const spoken = `${status}|${at?.step.id ?? ''}|${at?.step.label ?? ''}`;
  const lastSpoken = useRef(spoken);
  useEffect(() => {
    if (lastSpoken.current === spoken) return;
    lastSpoken.current = spoken;
    if (!shouldAnnounce) return;
    const message =
      status === 'running' && at
        ? `${label}: ${at.step.label}`
        : status === 'done'
          ? `${label}: concluído`
          : status === 'error' && failed
            ? `${label}: falhou em ${failed.label}`
            : status === 'stopped'
              ? `${label}: interrompido`
              : '';
    if (message) announce(message);
  }, [spoken, shouldAnnounce, status, label, at, failed, announce]);

  const toggle = () => {
    const next = !collapsed;
    if (collapsedProp === undefined) setInner(next);
    onCollapsedChange?.(next);
  };

  const showCount = status === 'running' && at !== undefined && total > 1;
  const count = showCount ? (
    <span className={s.count}>
      <span aria-hidden="true">
        {at.index + 1}/{total}
      </span>
      <VisuallyHidden>{`, etapa ${at.index + 1} de ${total}`}</VisuallyHidden>
    </span>
  ) : null;

  // Texto ao lado do nome: o que está rodando (recolhido/compacto), o resumo do fim ou a falha.
  const failure = failed ? (
    <>
      <span className={s.failWord}>Falhou</span>
      {` · ${failed.label}`}
    </>
  ) : (
    <span className={s.failWord}>Falhou</span>
  );
  const secondary: ReactNode =
    status === 'running'
      ? collapsed || compact
        ? at?.step.label
        : undefined
      : status === 'done'
        ? (summary ?? (compact ? 'Concluído' : `Concluído · ${total} etapas`))
        : status === 'error'
          ? (summary ?? failure)
          : status === 'stopped'
            ? (summary ?? 'Interrompido')
            : (summary ?? 'Na fila');

  if (compact) {
    const hasPreview = preview !== undefined && preview !== null && preview !== '';
    // A linha fica sempre no mesmo nó: o trecho que chega ou some não remonta o spinner.
    return (
      <div
        {...props}
        className={`${s.trace} ${className}`}
        data-variant="compact"
        data-status={status}
        data-preview={hasPreview || undefined}
      >
        <div className={s.compactLine}>
          <span className={s.glyph}>
            <Glyph status={status} collapsed size={14} />
          </span>
          <span className={s.title}>{label}</span>
          {secondary !== undefined && secondary !== null && (
            <span key={spoken} className={s.secondary}>
              <span className={s.dot} aria-hidden="true">
                ·
              </span>
              {secondary}
            </span>
          )}
          {count}
          {status === 'error' && failed && onRetry && (
            <LinkButton className={s.compactRetry} onClick={() => onRetry(failed.id)}>
              {retryLabel ?? 'Tentar de novo'}
            </LinkButton>
          )}
          {action && <span className={s.compactAction}>{action}</span>}
        </div>
        {hasPreview && (
          <span className={s.preview}>
            <span className={s.previewText}>{preview}</span>
          </span>
        )}
        {region}
      </div>
    );
  }

  const head = (
    <>
      <span className={s.glyph}>
        <Glyph status={status} collapsed={collapsed} size={16} />
      </span>
      <span className={s.title}>{label}</span>
      {secondary !== undefined && secondary !== null && (
        <span key={spoken} className={s.secondary}>
          <span className={s.dot} aria-hidden="true">
            ·
          </span>
          {secondary}
        </span>
      )}
      <span className={s.end}>
        {count}
        {canCollapse && <ChevronDown className={s.chevron} aria-hidden="true" />}
      </span>
    </>
  );

  const progressSteps: ProgressStep[] = steps.map((step) => {
    const retry = step.state === 'error' && onRetry;
    const hasDetail = Boolean(step.detail || step.sources || retry);
    return {
      id: step.id,
      label: step.label,
      state: step.state,
      meta: step.meta,
      detail: hasDetail ? (
        <>
          {step.detail && (
            <div className={s.detail} data-state={step.state}>
              {step.detail}
            </div>
          )}
          {step.sources && (
            <div className={s.sources} role="group" aria-label={`Fontes · ${step.label}`}>
              {step.sources}
            </div>
          )}
          {retry && (
            <Button size="sm" icon={RotateCcw} onClick={() => onRetry(step.id)}>
              {retryLabel ?? 'Tentar de novo a partir desta etapa'}
            </Button>
          )}
        </>
      ) : undefined,
    };
  });

  return (
    <div
      {...props}
      className={`${s.trace} ${className}`}
      data-variant="full"
      data-status={status}
      data-collapsed={collapsed || undefined}
    >
      {canCollapse ? (
        <button
          type="button"
          className={s.head}
          aria-expanded={!collapsed}
          aria-controls={collapsed ? undefined : listId}
          onClick={toggle}
          data-force={force}
        >
          {head}
        </button>
      ) : (
        <div className={s.head} data-static="">
          {head}
        </div>
      )}
      <Reveal open={!collapsed}>
        <div id={listId} className={s.body}>
          <ProgressSteps variant="trace" label={label} steps={progressSteps} />
        </div>
      </Reveal>
      {region}
    </div>
  );
}
