'use client';

import { Check, ChevronDown, ChevronRight, CircleAlert, LoaderCircle, Lock } from 'lucide-react';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { VisuallyHidden } from './a11y';
import { Tooltip } from './overlays';
import s from './stepper.module.css';

/* useLayoutEffect no cliente (mede antes de pintar), useEffect no servidor. */
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/* ——— Estado de etapa ——— */

/**
 * `warn` = pendência que não impede seguir (briefing incompleto num rascunho, “!” âmbar);
 * `error` = precisa ser corrigida (“!” vermelho); `blocked` = ainda não liberada (cadeado).
 * `active` = em andamento: a etapa em que o trabalho está quando a régua mostra outra (quem volta
 * a uma etapa feita continua vendo onde a jornada parou). Anel azul com número; o disco sólido
 * continua só na atual.
 */
export type StepState = 'done' | 'current' | 'active' | 'upcoming' | 'warn' | 'error' | 'blocked';

export type StepItem = {
  id: string;
  label: string;
  /** Linha de apoio, usada pela lista vertical. */
  description?: ReactNode;
  /** Força um estado (pendência, bloqueada). Sem ele, o estado vem da posição em relação à atual. */
  state?: Exclude<StepState, 'current'>;
  /** Informação curta à direita na lista vertical (ex.: “3 campos”). */
  meta?: ReactNode;
  /**
   * Por que a etapa está assim (bloqueada, com pendência, com erro), curto e sem ponto final:
   * “Libera quando o artigo for aprovado”. Vai na dica do DS (`Tooltip`) e é a descrição lida pelo
   * leitor de tela (`aria-describedby`). Numa régua navegável, a etapa fora de alcance com motivo
   * continua focável (indisponível): teclado e toque também chegam ao porquê. Ignorado na atual.
   */
  reason?: string;
  /** Estado parado para pranchas: `hover`, `focus` e `tip` (dica aberta). */
  force?: string;
};

const stateText: Record<StepState, string> = {
  done: 'concluída',
  current: 'etapa atual',
  active: 'em andamento',
  upcoming: 'a seguir',
  warn: 'com pendência',
  error: 'com erro',
  blocked: 'bloqueada',
};

/** Estado de uma etapa: a atual vence; depois o estado forçado; depois a posição. */
export function stepStateAt(steps: StepItem[], index: number, current: number): StepState {
  if (index === current) return 'current';
  const forced = steps[index]?.state;
  if (forced) return forced;
  return index < current ? 'done' : 'upcoming';
}

function defaultSelectable(state: StepState) {
  return state === 'done' || state === 'active' || state === 'error' || state === 'warn';
}

const forced = (force: string | undefined, state: string) =>
  force?.split(' ').includes(state) ?? false;

/**
 * Alvo de uma etapa (régua e lista). Selecionável é botão; fora de alcance mas com dica (motivo ou
 * nome escondido) numa régua navegável vira botão indisponível focável, que não navega; o resto é
 * texto. O motivo é a descrição do botão; num texto, vai junto do estado para o leitor de tela.
 * A dica nunca repete para o leitor o que ele já ouve: o nome escondido segue no próprio alvo.
 */
function StepTarget({
  step,
  state,
  index,
  className,
  selectable,
  navigable,
  tip,
  onSelect,
  children,
}: {
  step: StepItem;
  state: StepState;
  index: number;
  className: string | undefined;
  selectable: boolean;
  /** A régua navega (tem `onStepSelect`). */
  navigable: boolean;
  /** Texto da dica: o motivo, com o nome antes quando o rótulo está escondido. */
  tip: string | undefined;
  onSelect: (index: number) => void;
  /** Conteúdo, recebendo o texto extra do estado (motivo, quando o alvo é só texto). */
  children: (stateExtra: string | undefined) => ReactNode;
}) {
  const reasonId = useId();
  const reason = state === 'current' ? undefined : step.reason;
  const unavailable = !selectable && state !== 'current' && navigable && Boolean(tip);
  const control = selectable || unavailable;
  const describedBy = control && reason ? reasonId : undefined;
  const hit = selectable ? (
    <button
      type="button"
      className={className}
      data-force={step.force}
      aria-describedby={describedBy}
      onClick={() => onSelect(index)}
    >
      {children(undefined)}
    </button>
  ) : unavailable ? (
    // Sem clique: Enter, Espaço e toque só mostram a dica.
    <button
      type="button"
      className={className}
      data-force={step.force}
      aria-disabled="true"
      aria-describedby={describedBy}
    >
      {children(undefined)}
    </button>
  ) : (
    <span
      className={className}
      data-force={step.force}
      aria-current={state === 'current' ? 'step' : undefined}
    >
      {children(reason)}
    </span>
  );
  return (
    <>
      {tip ? (
        <Tooltip bare describe={false} content={tip} open={forced(step.force, 'tip')}>
          {hit}
        </Tooltip>
      ) : (
        hit
      )}
      {describedBy && (
        <span id={reasonId} hidden>
          {reason}
        </span>
      )}
    </>
  );
}

/** Texto do estado para o leitor de tela; num alvo que é só texto, leva o motivo junto. */
function stateNote(state: StepState, extra: string | undefined) {
  return `(${stateText[state]}${extra ? `: ${extra}` : ''})`;
}

/** Rótulos escondidos pela largura (recolhida ou consulta de contêiner): '1' por etapa sem nome à vista. */
function hiddenLabels(track: HTMLElement) {
  // Fora do layout (aba oculta, ambiente de teste): nada conta como escondido.
  if (!track.clientWidth) return '';
  return Array.from(track.querySelectorAll<HTMLElement>('[data-step-label]'), (label) =>
    label.getBoundingClientRect().width < 2 ? '1' : '0',
  ).join('');
}

/**
 * Marcador de 20 px. A atual é o único disco sólido (azul, número branco). Feita = azul 50 com
 * check azul desenhado; em andamento = anel azul com número azul; a seguir = anel cinza com
 * número; pendência “!” âmbar; erro “!” vermelho; bloqueada = cadeado. Ao virar “feita”, o check
 * se desenha em 180 ms.
 */
export function StepMarker({
  state,
  index,
  size = 'md',
  tone = 'solid',
}: {
  state: StepState;
  index: number;
  size?: 'xs' | 'sm' | 'md';
  /** Mantido por compatibilidade: a etapa atual é sempre o disco sólido. */
  tone?: 'solid' | 'soft';
}) {
  const [shown, setShown] = useState(state);
  const [draw, setDraw] = useState(false);
  if (shown !== state) {
    setShown(state);
    setDraw(state === 'done');
  }
  return (
    <span
      className={s.marker}
      data-state={state}
      data-size={size}
      data-tone={tone}
      data-draw={draw || undefined}
      aria-hidden="true"
    >
      {state === 'done' ? (
        <svg className={s.check} viewBox="0 0 12 12" fill="none">
          <path d="M2.75 6.25 5 8.5 9.25 3.75" pathLength={1} />
        </svg>
      ) : state === 'blocked' ? (
        <Lock />
      ) : state === 'error' || state === 'warn' ? (
        <b>!</b>
      ) : (
        index + 1
      )}
    </span>
  );
}

/* ——— Stepper horizontal ——— */

/**
 * Etapas numeradas numa linha (régua da criação). Feita volta com um clique (rótulo sublinha no
 * hover); a atual é o único marcador sólido; o conector depois de uma feita fica azul 200.
 * Quando os rótulos não cabem, só a atual mantém o nome e os marcadores ganham alvo de 40 px.
 */
export function Stepper({
  steps,
  current,
  onStepSelect,
  canSelect,
  label = 'Etapas',
  size = 'md',
  connector = 'line',
  fit = 'fill',
  align = 'start',
}: {
  steps: StepItem[];
  current: number;
  onStepSelect?: (index: number) => void;
  /** Quais etapas aceitam clique. Padrão: feitas, em andamento e com pendência. */
  canSelect?: (index: number, state: StepState) => boolean;
  label?: string;
  size?: 'sm' | 'md';
  connector?: 'line' | 'chevron';
  /** `fill` estica os conectores até a largura toda; `content` usa conectores curtos. */
  fit?: 'fill' | 'content';
  /** Com `fit="content"`: encosta a régua no início ou no fim da largura disponível. */
  align?: 'start' | 'end';
}) {
  const last = steps.length - 1;
  const navRef = useRef<HTMLElement>(null);
  /** Largura mínima com todos os rótulos, medida no momento em que a linha deixou de caber. */
  const needRef = useRef(0);
  const [squeezed, setSqueezed] = useState(false);
  /** Etapas sem nome à vista ('1' por etapa): ganham a dica com o nome. */
  const [hidden, setHidden] = useState('');

  /* Quando os rótulos não cabem, só a atual mantém o nome — nunca sobrepor conector e marcador. */
  useIsoLayoutEffect(() => {
    const nav = navRef.current;
    const track = nav?.firstElementChild as HTMLElement | null;
    if (!nav || !track) return;
    function check() {
      const first = track?.firstElementChild;
      const lastItem = track?.lastElementChild;
      if (!nav || !track || !first || !lastItem) return;
      const room = track.clientWidth;
      if (nav.dataset.squeezed === 'true') {
        setSqueezed(needRef.current > room + 1);
      } else {
        /* Os itens não encolhem abaixo do conteúdo: se o último passa da borda, não cabe. */
        const used = lastItem.getBoundingClientRect().right - first.getBoundingClientRect().left;
        if (used > room + 1) {
          needRef.current = used;
          setSqueezed(true);
        }
      }
      // A consulta de contêiner também esconde rótulos sem passar pelo estado recolhido.
      setHidden(hiddenLabels(track));
    }
    check();
    const observer = new ResizeObserver(check);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [fit, steps.length, current]);

  /* Recolher (ou trocar a atual, ou os nomes) muda quais nomes ficam à vista: mede antes de pintar. */
  const names = steps.map((step) => step.label).join('\n');
  useIsoLayoutEffect(() => {
    const track = navRef.current?.firstElementChild as HTMLElement | null;
    if (track) setHidden(hiddenLabels(track));
  }, [squeezed, current, names, size, fit]);

  // Régua que rola: a etapa atual fica à vista (scrollTo no trilho, nunca scrollIntoView).
  useEffect(() => {
    const track = navRef.current?.firstElementChild as HTMLElement | null;
    const item = track?.querySelector<HTMLElement>('[aria-current="step"]');
    if (!track) return;
    const overflowing = track.scrollWidth > track.clientWidth + 1;
    track.dataset.overflow = overflowing ? 'true' : '';
    if (!item || !overflowing) return;
    track.scrollTo({ left: item.offsetLeft - (track.clientWidth - item.offsetWidth) / 2 });
  }, [current, squeezed]);

  return (
    <nav
      ref={navRef}
      className={s.stepper}
      aria-label={label}
      data-size={size}
      data-fit={fit}
      data-align={align}
      data-squeezed={squeezed || undefined}
    >
      <ol className={s.track}>
        {steps.map((step, index) => {
          const state = stepStateAt(steps, index, current);
          const selectable =
            Boolean(onStepSelect) &&
            state !== 'current' &&
            (canSelect ? canSelect(index, state) : defaultSelectable(state));
          const reason = state === 'current' ? undefined : step.reason;
          // Nome escondido pela largura: a dica traz o nome (e o motivo, quando houver).
          const tip =
            state !== 'current' && hidden[index] === '1'
              ? [step.label, reason].filter(Boolean).join(' · ')
              : reason;
          return (
            <li key={step.id} className={s.step} data-state={state}>
              <StepTarget
                step={step}
                state={state}
                index={index}
                className={s.stepHit}
                selectable={selectable}
                navigable={Boolean(onStepSelect)}
                tip={tip}
                onSelect={(target) => onStepSelect?.(target)}
              >
                {(extra) => (
                  <>
                    <StepMarker state={state} index={index} size={size} />
                    <span className={s.stepLabel} data-step-label="">
                      {step.label}
                      <VisuallyHidden>{stateNote(state, extra)}</VisuallyHidden>
                    </span>
                  </>
                )}
              </StepTarget>
              {index < last && (
                <span
                  className={s.connector}
                  data-kind={connector}
                  data-done={state === 'done' || undefined}
                  aria-hidden="true"
                >
                  {connector === 'chevron' && <ChevronRight />}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ——— Stepper compacto ——— */

/**
 * “Etapa 3 de 6” com o nome da etapa e uma barra segmentada (atual em azul sólido, feitas em
 * azul claro). Para celular, painéis estreitos e cabeçalhos densos.
 */
export function StepperCompact({
  steps,
  current,
  label = 'Progresso',
  actions,
  showNext = true,
}: {
  steps: StepItem[];
  current: number;
  label?: string;
  actions?: ReactNode;
  showNext?: boolean;
}) {
  const step = steps[current];
  const next = steps[current + 1];
  const total = steps.length;
  /* Pendência nunca só em cor: o segmento vermelho vem acompanhado do nome da etapa. */
  const issues = steps.filter((_, index) => stepStateAt(steps, index, current) === 'error');
  const issueText = issues.length
    ? `Pendência em ${issues.map((item) => item.label).join(' e ')}`
    : undefined;
  return (
    <div className={s.compact}>
      <div className={s.compactHead}>
        <div className={s.compactText}>
          <span className={s.compactCount}>
            Etapa {current + 1} de {total}
          </span>
          <span className={s.compactTitle}>{step?.label}</span>
        </div>
        {actions && <div className={s.compactActions}>{actions}</div>}
      </div>
      <div
        className={s.segments}
        role="progressbar"
        aria-label={label}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current + 1}
        aria-valuetext={`Etapa ${current + 1} de ${total}: ${step?.label ?? ''}`}
        style={{ '--n': total } as CSSProperties}
      >
        {steps.map((item, index) => (
          <i key={item.id} data-state={stepStateAt(steps, index, current)} />
        ))}
      </div>
      {(showNext || issueText) && (
        <div className={s.compactFoot}>
          {showNext && (
            <span className={s.compactNext}>
              {next ? (
                <>
                  A seguir: <b>{next.label}</b>
                </>
              ) : (
                'Última etapa'
              )}
            </span>
          )}
          {issueText && (
            <span className={s.compactIssue}>
              <CircleAlert aria-hidden="true" />
              {issueText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ——— Lista vertical de etapas ——— */

/**
 * Etapas empilhadas com descrição, para a coluna lateral de fluxos longos. O fio entre os
 * marcadores fica azul 200 depois de uma feita; feitas voltam com um clique.
 */
export function StepList({
  steps,
  current,
  onStepSelect,
  canSelect,
  label = 'Etapas',
  tone = 'tray',
}: {
  steps: StepItem[];
  current: number;
  onStepSelect?: (index: number) => void;
  canSelect?: (index: number, state: StepState) => boolean;
  label?: string;
  tone?: 'tray' | 'plain';
}) {
  return (
    <nav aria-label={label} className={s.list} data-tone={tone}>
      <ol className={s.listTrack}>
        {steps.map((step, index) => {
          const state = stepStateAt(steps, index, current);
          const selectable =
            Boolean(onStepSelect) &&
            state !== 'current' &&
            (canSelect ? canSelect(index, state) : defaultSelectable(state));
          return (
            <li key={step.id} className={s.listItem} data-state={state}>
              <StepTarget
                step={step}
                state={state}
                index={index}
                className={s.listHit}
                selectable={selectable}
                navigable={Boolean(onStepSelect)}
                // Na lista o nome está sempre à vista: a dica é só o motivo.
                tip={state === 'current' ? undefined : step.reason}
                onSelect={(target) => onStepSelect?.(target)}
              >
                {(extra) => (
                  <>
                    <StepMarker state={state} index={index} />
                    <span className={s.listText}>
                      <span className={s.listLabel}>
                        {step.label}
                        <VisuallyHidden>{stateNote(state, extra)}</VisuallyHidden>
                      </span>
                      {step.description && <span className={s.listDesc}>{step.description}</span>}
                    </span>
                    {step.meta && <span className={s.listMeta}>{step.meta}</span>}
                  </>
                )}
              </StepTarget>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ——— Trilha do ciclo de vida ——— */

export type PipelineSubstep = { label: string; state: 'done' | 'current' | 'upcoming' };
export type PipelineStage = {
  id: string;
  label: string;
  state: 'done' | 'current' | 'upcoming' | 'error';
  /** Linha abaixo do título: o que acontece na fase (“Assinatura em 72 h”). */
  detail?: ReactNode;
  substeps?: PipelineSubstep[];
};

const substepText = { done: 'feito', current: 'agora', upcoming: 'pendente' } as const;

/**
 * Trilha do ciclo de vida (rascunho → concluída).
 * `journey`: a jornada do detalhe — marcador, título e dica de cada fase em linha, conectores
 * flexíveis (azul 200 depois de uma feita); em largura estreita, vira coluna.
 * `popover` (padrão): faixa compacta que abre o detalhe com subetapas no hover ou no clique.
 */
export function StepPipeline({
  stages,
  label,
  variant = 'popover',
  defaultOpen = false,
  align = 'start',
}: {
  stages: PipelineStage[];
  label: string;
  variant?: 'popover' | 'journey';
  defaultOpen?: boolean;
  align?: 'start' | 'end';
}) {
  if (variant === 'journey') return <Journey stages={stages} label={label} />;
  return <PipelinePopover stages={stages} label={label} defaultOpen={defaultOpen} align={align} />;
}

function Journey({ stages, label }: { stages: PipelineStage[]; label: string }) {
  return (
    <div className={s.journeyWrap}>
      <ol className={s.journey} aria-label={label}>
        {stages.map((stage, index) => (
          <li
            key={stage.id}
            className={s.phase}
            data-state={stage.state}
            aria-current={stage.state === 'current' ? 'step' : undefined}
          >
            <StepMarker state={stage.state} index={index} />
            <span className={s.phaseText}>
              <strong>
                {stage.label}
                <VisuallyHidden>{`(${stateText[stage.state]})`}</VisuallyHidden>
              </strong>
              {stage.detail && <span>{stage.detail}</span>}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function PipelinePopover({
  stages,
  label,
  defaultOpen,
  align,
}: {
  stages: PipelineStage[];
  label: string;
  defaultOpen: boolean;
  align: 'start' | 'end';
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [pinned, setPinned] = useState(defaultOpen);
  const id = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const leaveTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    function onDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setPinned(false);
      }
    }
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);
  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);

  const currentIndex = stages.findIndex((stage) => stage.state === 'current');
  const currentStage = stages[currentIndex];
  const summary = currentStage
    ? `${currentStage.label}, etapa ${currentIndex + 1} de ${stages.length}`
    : `${stages.filter((stage) => stage.state === 'done').length} de ${stages.length} concluídas`;

  return (
    <div
      ref={wrapRef}
      className={s.pipeWrap}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'mouse') return;
        window.clearTimeout(leaveTimer.current);
        setOpen(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== 'mouse' || pinned) return;
        leaveTimer.current = window.setTimeout(() => setOpen(false), 160);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault();
          setOpen(false);
          setPinned(false);
          triggerRef.current?.focus();
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className={s.pipe}
        aria-expanded={open}
        aria-controls={id}
        aria-label={`${label}: ${summary}`}
        data-open={open || undefined}
        onClick={() => {
          const next = !(open && pinned);
          setPinned(next);
          setOpen(next);
        }}
      >
        {stages.map((stage, index) => (
          <span key={stage.id} className={s.pipeStage} data-state={stage.state}>
            {index > 0 && (
              <i
                className={s.pipeSep}
                data-done={stages[index - 1]?.state === 'done' || undefined}
                aria-hidden="true"
              />
            )}
            <StepMarker state={stage.state} index={index} size="xs" />
            {stage.label}
          </span>
        ))}
        <ChevronDown className={s.pipeChevron} aria-hidden="true" />
      </button>
      {open && (
        <div
          id={id}
          className={s.pop}
          data-align={align}
          role="group"
          aria-label={`${label} em detalhe`}
        >
          <ol className={s.popList}>
            {stages.map((stage, index) => (
              <li key={stage.id} className={s.popItem} data-state={stage.state}>
                <StepMarker state={stage.state} index={index} />
                <div className={s.popBody}>
                  <span className={s.popTitle}>
                    {stage.label}
                    <VisuallyHidden>{`(${stateText[stage.state]})`}</VisuallyHidden>
                  </span>
                  {stage.detail && <span className={s.popDetail}>{stage.detail}</span>}
                  {stage.substeps && stage.substeps.length > 0 && (
                    <ol className={s.subList}>
                      {stage.substeps.map((sub) => (
                        <li key={sub.label} className={s.sub} data-state={sub.state}>
                          <span className={s.subMark} aria-hidden="true">
                            {sub.state === 'done' && <Check />}
                          </span>
                          <span className={s.subLabel}>{sub.label}</span>
                          <VisuallyHidden>{`(${substepText[sub.state]})`}</VisuallyHidden>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

/* ——— Seção recolhível de formulário ——— */

export type SectionState = 'empty' | 'active' | 'done' | 'error';

const sectionText: Record<SectionState, string> = {
  empty: 'não preenchida',
  active: 'em edição',
  done: 'preenchida',
  error: 'com pendência',
};

/**
 * Cartão de seção de um passo. Recolhida, mostra o resumo alinhado à coluna dos controles
 * (“Não definido” quando vazia). Aberta, empilha `FormRow`s: rótulo à esquerda, controle à direita.
 */
export function FormSection({
  title,
  state = 'empty',
  summary,
  emptySummary = 'Não definido',
  meta,
  open,
  onOpenChange,
  labelWidth,
  titleAs: Heading = 'h3',
  children,
}: {
  title: string;
  state?: SectionState;
  summary?: ReactNode;
  emptySummary?: string;
  /** Informação curta à direita quando aberta (ex.: “3 de 4 campos”). */
  meta?: ReactNode;
  open: boolean;
  /** Sem ele, a seção fica fixa (sem chevron). */
  onOpenChange?: (open: boolean) => void;
  /** Largura da coluna de rótulos, em px. Padrão 200. */
  labelWidth?: number;
  /** Nível do título (o tamanho não muda). Padrão h3; h2 quando a seção vem logo abaixo do h1 da página. */
  titleAs?: 'h2' | 'h3' | 'h4';
  children?: ReactNode;
}) {
  const id = useId();
  const bodyId = `${id}-body`;
  const titleId = `${id}-title`;
  const collapsible = Boolean(onOpenChange);
  const style = labelWidth ? ({ '--label-w': `${labelWidth}px` } as CSSProperties) : undefined;
  const head = (
    <>
      <span className={s.sectionLead}>
        <span className={s.sectionMark} data-state={state} aria-hidden="true">
          {state === 'done' ? <Check /> : state === 'error' ? <b>!</b> : null}
        </span>
        <span id={titleId} className={s.sectionTitle}>
          {title}
        </span>
        <VisuallyHidden>{`(${sectionText[state]})`}</VisuallyHidden>
      </span>
      <span className={s.sectionSummary} data-empty={(!open && !summary) || undefined}>
        {open ? null : (summary ?? emptySummary)}
      </span>
      <span className={s.sectionMeta}>{open ? meta : null}</span>
      {collapsible && <ChevronDown className={s.sectionChevron} aria-hidden="true" />}
    </>
  );
  return (
    <section
      className={s.section}
      data-open={open || undefined}
      data-state={state}
      style={style}
      aria-labelledby={titleId}
    >
      <Heading className={s.sectionH}>
        {collapsible ? (
          <button
            type="button"
            className={s.sectionHead}
            aria-expanded={open}
            aria-controls={bodyId}
            onClick={() => onOpenChange?.(!open)}
          >
            {head}
          </button>
        ) : (
          <div className={s.sectionHead}>{head}</div>
        )}
      </Heading>
      {open && (
        <div id={bodyId} className={s.sectionBody}>
          {children}
        </div>
      )}
    </section>
  );
}

/**
 * Linha de formulário: rótulo e explicação à esquerda, controle e ajuda à direita. Com `children`
 * como função, recebe o `id` do controle e o rótulo vira `<label for>`; com nó, vira um grupo.
 */
export function FormRow({
  label,
  description,
  required,
  optional,
  hint,
  error,
  children,
}: {
  label: string;
  description?: ReactNode;
  required?: boolean;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  children:
    ReactNode | ((props: { id: string; describedBy?: string; invalid: boolean }) => ReactNode);
}) {
  const id = useId();
  const controlId = `${id}-control`;
  const labelId = `${id}-label`;
  const descId = `${id}-desc`;
  const describedBy = error || hint ? descId : undefined;
  const marks = (
    <>
      {required && (
        <span className={s.required} aria-hidden="true">
          *
        </span>
      )}
      {optional && <span className={s.optional}>Opcional</span>}
    </>
  );
  const note = error ? (
    <p id={descId} className={s.rowError}>
      <CircleAlert aria-hidden="true" />
      {error}
    </p>
  ) : (
    hint && (
      <p id={descId} className={s.rowHint}>
        {hint}
      </p>
    )
  );
  return (
    <div className={s.row} data-invalid={error ? true : undefined}>
      <div className={s.rowLabel}>
        {typeof children === 'function' ? (
          <label id={labelId} htmlFor={controlId} className={s.rowTitle}>
            {label}
            {marks}
          </label>
        ) : (
          <span id={labelId} className={s.rowTitle}>
            {label}
            {marks}
          </span>
        )}
        {description && <span className={s.rowDesc}>{description}</span>}
      </div>
      {typeof children === 'function' ? (
        <div className={s.rowControl}>
          {children({ id: controlId, describedBy, invalid: Boolean(error) })}
          {note}
        </div>
      ) : (
        <div
          className={s.rowControl}
          role="group"
          aria-labelledby={labelId}
          aria-describedby={describedBy}
        >
          {children}
          {note}
        </div>
      )}
    </div>
  );
}

/* ——— Barra de ações do fluxo ——— */

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

const saveText: Record<SaveStatus, string> = {
  saved: 'Rascunho salvo agora',
  saving: 'Salvando rascunho…',
  unsaved: 'Alterações não salvas',
  error: 'Não foi possível salvar',
};

/**
 * Estado do salvamento (ícone + texto + complemento, e “Tentar de novo” no erro), anunciado com
 * educação a leitores de tela. É o mesmo da `ActionBar`; solto, vai numa linha de status (ex.: sob
 * o texto de um estúdio, quando as ações sobem para o cabeçalho).
 */
export function SaveIndicator({
  status,
  label,
  detail,
  onRetry,
  'data-force': force,
}: {
  status: SaveStatus;
  label?: string;
  /** Complemento discreto do estado (ex.: “há 2 min”). */
  detail?: ReactNode;
  onRetry?: () => void;
  /** Prancha: estado parado de “Tentar de novo” (`hover`, `focus`). Nunca no produto. */
  'data-force'?: string;
}) {
  return (
    <>
      <span className={s.barStatus} data-status={status} role="status">
        <span className={s.barIcon} aria-hidden="true">
          {status === 'saved' ? (
            <Check />
          ) : status === 'saving' ? (
            <LoaderCircle />
          ) : status === 'error' ? (
            <CircleAlert />
          ) : (
            <i />
          )}
        </span>
        <span className={s.barLabel}>{label ?? saveText[status]}</span>
        {detail && <span className={s.barDetail}>{detail}</span>}
      </span>
      {status === 'error' && onRetry && (
        <button type="button" className={s.barRetry} data-force={force} onClick={onRetry}>
          Tentar de novo
        </button>
      )}
    </>
  );
}

/**
 * Rodapé fixo de páginas com etapas: estado do rascunho à esquerda, ações à direita
 * (cancelar, voltar, continuar). O estado é anunciado com educação a leitores de tela.
 */
export function ActionBar({
  status,
  statusLabel,
  detail,
  onRetry,
  start,
  position = 'sticky',
  children,
}: {
  status?: SaveStatus;
  statusLabel?: string;
  /** Complemento discreto do estado (ex.: “às 14:32”). */
  detail?: ReactNode;
  onRetry?: () => void;
  /** Conteúdo extra à esquerda, depois do estado. */
  start?: ReactNode;
  position?: 'sticky' | 'static';
  children: ReactNode;
}) {
  return (
    <div className={s.bar} data-position={position}>
      <div className={s.barStart}>
        {status && (
          <SaveIndicator status={status} label={statusLabel} detail={detail} onRetry={onRetry} />
        )}
        {start}
      </div>
      <div className={s.barActions}>{children}</div>
    </div>
  );
}
