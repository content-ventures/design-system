'use client';

import {
  Check,
  CheckCheck,
  CircleAlert,
  CircleCheck,
  Clock,
  Info,
  Lock,
  RotateCw,
  SearchX,
  TriangleAlert,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type AnimationEvent,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { VisuallyHidden } from './a11y';
import { Button } from './button';
import { LinkButton } from './link';
import s from './feedback.module.css';

/*
 * Feedback do DS V3: alerta, faixa de aviso, progresso, spinner, esqueleto, estados (vazio, erro,
 * acesso) e notificações. Tons de status só para status; nada de degradê, brilho ou ícone em caixa
 * fora dos estados de página. Movimento curto (120–280 ms) e sempre com `prefers-reduced-motion`.
 */

/* ——————————————————————————— Presença (entra/sai com altura) ——————————————————————————— */

type Phase = 'enter' | 'shown' | 'leave' | 'gone';
const EXIT_MS = 180;

/**
 * Mostra e esconde um bloco animando a altura (`grid-template-rows: 0fr → 1fr`) e a opacidade.
 * Na primeira pintura aparece pronto (sem animar), a menos que `appear`. `gap` é um espaço acima
 * que recolhe junto — use numa pilha para o vão não pular quando o bloco sai.
 */
export function Reveal({
  open = true,
  appear = false,
  gap = 0,
  onExited,
  className = '',
  children,
}: {
  open?: boolean;
  appear?: boolean;
  gap?: number;
  /** Chamado quando a saída termina e o bloco deixa a tela. */
  onExited?: () => void;
  className?: string;
  children: ReactNode;
}) {
  const [phase, setPhase] = useState<Phase>(open ? (appear ? 'enter' : 'shown') : 'gone');
  const [last, setLast] = useState(open);
  if (last !== open) {
    setLast(open);
    setPhase(open ? 'enter' : 'leave');
  }
  const exited = useRef(onExited);
  useEffect(() => {
    exited.current = onExited;
  });
  useEffect(() => {
    if (phase !== 'leave') return;
    const timer = window.setTimeout(() => {
      setPhase('gone');
      exited.current?.();
    }, EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === 'gone') return null;
  return (
    <div
      className={`${s.reveal} ${className}`}
      data-phase={phase}
      onAnimationEnd={(event: AnimationEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget && phase === 'enter') setPhase('shown');
      }}
    >
      <div className={s.revealClip}>
        <div style={gap ? { paddingTop: gap } : undefined}>{children}</div>
      </div>
    </div>
  );
}

/* ——————————————————————————— Alerta ——————————————————————————— */

export type AlertTone = 'info' | 'success' | 'warning' | 'attention' | 'danger';

const ALERT_ICON: Record<AlertTone, LucideIcon> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  attention: CircleAlert,
  danger: CircleAlert,
};

/** Botão X dos avisos: 24 px, cor do tom, hover num véu do próprio tom. */
function Dismiss({
  label,
  onClick,
  force,
}: {
  label: string;
  onClick: () => void;
  force?: string;
}) {
  return (
    <button
      type="button"
      className={s.dismiss}
      aria-label={label}
      title={label}
      onClick={onClick}
      data-force={force}
    >
      <X aria-hidden="true" />
    </button>
  );
}

/**
 * Aviso de status dentro do conteúdo (o `.notice` do detalhe). Fundo do tom, fio de 1 px do tom,
 * raio 8, ícone 15. `title` 12/500 na cor do tom; texto 12 `--text`; `meta` legenda `--muted`.
 * À direita: `end` (prazo, valor tabular) e `action` (ação em texto). Com `onDismiss`, o X recolhe
 * o aviso (180 ms) e só então avisa quem o renderiza. `info` azul · `success` verde · `warning`
 * âmbar · `attention` laranja · `danger` vermelho (anunciado como alerta).
 */
export function Alert({
  tone = 'info',
  title,
  children,
  meta,
  end,
  action,
  icon,
  onDismiss,
  dismissLabel = 'Dispensar aviso',
  compact = false,
  open = true,
  appear = false,
  gap,
  role,
  className = '',
  'data-force': force,
}: {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  meta?: ReactNode;
  /** Valor curto à direita, na cor do tom (ex.: “Expira em 48 h”). */
  end?: ReactNode;
  /** Uma ação em texto (`LinkButton`); herda a cor do tom. */
  action?: ReactNode;
  /** Troca o ícone do tom quando o assunto pede (ex.: P.I.). */
  icon?: LucideIcon;
  onDismiss?: () => void;
  dismissLabel?: string;
  /** Uma linha só, 36 px: para formulários e rodapés. */
  compact?: boolean;
  /** Mostrar/esconder com animação de altura. */
  open?: boolean;
  /** Anima também na primeira pintura (aviso que surge depois de uma ação). */
  appear?: boolean;
  /** Vão acima que recolhe junto (pilha de avisos). */
  gap?: number;
  role?: 'status' | 'alert' | 'none';
  className?: string;
  /** Prancha: estado parado do X (`hover`, `active`, `focus`). */
  'data-force'?: string;
}) {
  const [closing, setClosing] = useState(false);
  const [lastOpen, setLastOpen] = useState(open);
  if (lastOpen !== open) {
    setLastOpen(open);
    if (!open) setClosing(false);
  }
  const Icon = icon ?? ALERT_ICON[tone];
  const side = end || action;
  return (
    <Reveal
      open={open && !closing}
      appear={appear}
      gap={gap}
      onExited={closing ? onDismiss : undefined}
    >
      <div
        className={`${s.alert} ${className}`}
        data-tone={tone}
        data-compact={compact || undefined}
        data-dismissible={onDismiss ? true : undefined}
        role={role === 'none' ? undefined : (role ?? (tone === 'danger' ? 'alert' : 'status'))}
      >
        <div className={s.alertRow}>
          <Icon className={s.alertIcon} aria-hidden="true" />
          <div className={s.alertBody}>
            {title && <strong className={s.alertTitle}>{title}</strong>}
            {children && <div className={s.alertText}>{children}</div>}
            {meta && <span className={s.alertMeta}>{meta}</span>}
          </div>
          {side && (
            <div className={s.alertSide}>
              {end && <span className={s.alertEnd}>{end}</span>}
              {action && <span className={s.toneAction}>{action}</span>}
            </div>
          )}
          {onDismiss && (
            <Dismiss label={dismissLabel} onClick={() => setClosing(true)} force={force} />
          )}
        </div>
      </div>
    </Reveal>
  );
}

/* ——————————————————————————— Faixa de aviso ——————————————————————————— */

export type BannerTone = AlertTone | 'neutral';

const BANNER_ICON: Record<BannerTone, LucideIcon> = { ...ALERT_ICON, neutral: Info };

/** `m:ss` (ou `h:mm:ss`) até `to`. Tabular; atualiza a cada segundo. */
export function Countdown({ to, onExpire }: { to: Date; onExpire?: () => void }) {
  const [now, setNow] = useState<number | null>(null);
  const expired = useRef(onExpire);
  useEffect(() => {
    expired.current = onExpire;
  });
  const target = to.getTime();
  useEffect(() => {
    let done = false;
    const tick = () => {
      const current = Date.now();
      setNow(current);
      if (!done && current >= target) {
        done = true;
        expired.current?.();
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [target]);
  const left = now === null ? null : Math.max(0, Math.ceil((target - now) / 1000));
  return (
    <time
      className={s.countdown}
      role="timer"
      aria-live="off"
      dateTime={left === null ? undefined : `PT${left}S`}
    >
      {left === null ? ' :  ' : formatClock(left)}
    </time>
  );
}

function formatClock(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = String(total % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

/**
 * Aviso de página. `band`: faixa de 40 px na largura toda, logo abaixo do topo, sem raio, fio
 * inferior do tom. `inline`: o mesmo desenho com raio 8 dentro do conteúdo. Título 12/500 na cor
 * do tom + texto 12. Uma faixa por página; ao dispensar, recolhe e o conteúdo sobe.
 */
export function Banner({
  tone = 'info',
  title,
  children,
  action,
  icon,
  onDismiss,
  dismissLabel = 'Dispensar aviso',
  countdown,
  variant = 'band',
  open = true,
  appear = false,
  className = '',
  style,
  'data-force': force,
}: {
  tone?: BannerTone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  icon?: LucideIcon;
  onDismiss?: () => void;
  dismissLabel?: string;
  /** Contagem regressiva tabular depois do título (ex.: sessão). */
  countdown?: { to: Date; onExpire?: () => void };
  variant?: 'band' | 'inline';
  open?: boolean;
  appear?: boolean;
  className?: string;
  /** `--banner-gutter` alinha o texto ao título da página (padrão 32). */
  style?: CSSProperties;
  'data-force'?: string;
}) {
  const [closing, setClosing] = useState(false);
  const [lastOpen, setLastOpen] = useState(open);
  if (lastOpen !== open) {
    setLastOpen(open);
    if (!open) setClosing(false);
  }
  const Icon = icon ?? BANNER_ICON[tone];
  return (
    <Reveal open={open && !closing} appear={appear} onExited={closing ? onDismiss : undefined}>
      <div className={s.bannerBox}>
        <div
          className={`${s.banner} ${className}`}
          data-tone={tone}
          data-variant={variant}
          role={tone === 'danger' ? 'alert' : 'status'}
          style={style}
        >
          <Icon className={s.bannerIcon} aria-hidden="true" />
          <p className={s.bannerText}>
            {title && <strong>{title}</strong>}
            {countdown && (
              <>
                {' '}
                <Countdown to={countdown.to} onExpire={countdown.onExpire} />
              </>
            )}
            {children && <span>{children}</span>}
          </p>
          {action && <span className={`${s.bannerAction} ${s.toneAction}`}>{action}</span>}
          {onDismiss && (
            <Dismiss label={dismissLabel} onClick={() => setClosing(true)} force={force} />
          )}
        </div>
      </div>
    </Reveal>
  );
}

/* ——————————————————————————— Progresso ——————————————————————————— */

export type ProgressTone = 'accent' | 'success' | 'warning' | 'danger';

/**
 * Barra de progresso de uma tarefa (envio, importação, entrega). Trilho g-100 de 4 px (`sm` 3 px),
 * preenchimento b-600 que anda em 280 ms. Sem `value` = indeterminado (um trecho de 30% que
 * desliza). Ao chegar a 100%, o preenchimento fica verde e o valor vira “Concluído”.
 * Dado parado (meta, ocupação) é `Meter`, não `Progress`.
 */
export function Progress({
  value,
  max = 100,
  label,
  valueText,
  tone = 'accent',
  size = 'md',
  end,
  className = '',
  'aria-label': ariaLabel,
}: {
  value?: number;
  max?: number;
  label?: ReactNode;
  /** Texto do valor (padrão: percentual). Também vira `aria-valuetext`. */
  valueText?: string;
  tone?: ProgressTone;
  size?: 'sm' | 'md';
  /** Substitui o valor à direita (ex.: “Tentar de novo”). */
  end?: ReactNode;
  className?: string;
  /** Nome quando não há `label` visível. */
  'aria-label'?: string;
}) {
  const labelId = useId();
  const indeterminate = value === undefined;
  const pct = indeterminate ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  const complete = !indeterminate && pct >= 100 && (tone === 'accent' || tone === 'success');
  const shown = valueText ?? `${Math.round(pct)}%`;
  // Sem rótulo, a linha de cima só aparece se houver algo a dizer (valor próprio, ação ou conclusão).
  const hasHead = Boolean(label || end || valueText || complete);
  return (
    <div
      className={`${s.progress} ${className}`}
      data-tone={complete ? 'success' : tone}
      data-size={size}
      data-complete={complete || undefined}
      data-indeterminate={indeterminate || undefined}
    >
      {hasHead && (
        <div className={s.progressHead}>
          {label && (
            <span id={labelId} className={s.progressLabel}>
              {label}
            </span>
          )}
          <span className={s.progressValue}>
            {end ??
              (complete ? (
                <span className={s.progressDone}>
                  <CircleCheck aria-hidden="true" />
                  Concluído
                </span>
              ) : (
                !indeterminate && shown
              ))}
          </span>
        </div>
      )}
      <div
        className={s.progressTrack}
        role="progressbar"
        aria-labelledby={label ? labelId : undefined}
        aria-label={label ? undefined : ariaLabel}
        aria-valuemin={indeterminate ? undefined : 0}
        aria-valuemax={indeterminate ? undefined : max}
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuetext={indeterminate ? undefined : complete ? 'Concluído' : shown}
        aria-busy={indeterminate || undefined}
      >
        <span className={s.progressFill} style={indeterminate ? undefined : { width: `${pct}%` }} />
      </div>
    </div>
  );
}

export type ProgressStep = {
  label: string;
  state: 'done' | 'current' | 'upcoming';
  /** À direita quando concluída (ex.: “#2041”). */
  meta?: ReactNode;
};

/**
 * Sequência curta de uma operação (a do diálogo de criação): marcador de 20 px — número no que
 * vem, anel girando no atual, check desenhado no feito — em linhas com fio `--line-soft`.
 */
export function ProgressSteps({ steps, label }: { steps: ProgressStep[]; label: string }) {
  const running = steps.some((step) => step.state === 'current');
  return (
    <ol className={s.steps} aria-label={label} aria-busy={running || undefined}>
      {steps.map((step, index) => (
        <li key={step.label} className={s.step} data-state={step.state}>
          <span className={s.marker} aria-hidden="true">
            {step.state === 'upcoming' && index + 1}
            {step.state === 'current' && (
              <svg className={s.markerSpin} viewBox="0 0 20 20">
                <circle className={s.markerTrack} cx="10" cy="10" r="9" />
                <circle className={s.markerArc} cx="10" cy="10" r="9" pathLength={1} />
              </svg>
            )}
            {step.state === 'done' && (
              <svg className={s.tick} viewBox="0 0 24 24">
                <path d="M4.5 12.5l5 5L19.5 7" pathLength={1} />
              </svg>
            )}
          </span>
          <span className={s.stepLabel}>{step.label}</span>
          {step.state === 'done' && step.meta && <span className={s.stepMeta}>{step.meta}</span>}
          <VisuallyHidden>
            {step.state === 'done'
              ? '(concluído)'
              : step.state === 'current'
                ? '(em andamento)'
                : ''}
          </VisuallyHidden>
        </li>
      ))}
    </ol>
  );
}

/* ——————————————————————————— Spinner ——————————————————————————— */

/**
 * Espera curta e localizada. Arco de 2 px sobre um anel; gira em 0,8 s. Só aparece depois de
 * `delay` (300 ms): esperas rápidas nunca piscam. Guarda o espaço desde o início (sem salto).
 * Com `label`, anuncia o texto numa região `status`. Região que demora mais de 1 s usa `Skeleton`.
 */
export function Spinner({
  size = 16,
  tone = 'current',
  label,
  delay = 300,
  className = '',
}: {
  size?: 14 | 16 | 20 | 24;
  tone?: 'current' | 'accent' | 'muted';
  label?: string;
  delay?: number;
  className?: string;
}) {
  const [visible, setVisible] = useState(delay <= 0);
  useEffect(() => {
    if (delay <= 0) return;
    const timer = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(timer);
  }, [delay]);
  const c = size / 2;
  const r = c - 1;
  return (
    <span
      className={`${s.spinner} ${className}`}
      data-tone={tone}
      style={{ width: size, height: size }}
    >
      {visible && (
        <svg className={s.spinnerSvg} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <circle className={s.spinnerTrack} cx={c} cy={c} r={r} />
          <circle className={s.spinnerArc} cx={c} cy={c} r={r} pathLength={1} />
        </svg>
      )}
      {label && <VisuallyHidden role="status">{visible ? label : ''}</VisuallyHidden>}
    </span>
  );
}

/* ——————————————————————————— Esqueleto ——————————————————————————— */

type Size = number | string;

/**
 * Bloco chapado (`--skeleton`) que pulsa devagar (opacidade 1 → .55), sem brilho correndo.
 * Sempre com a geometria final do conteúdo. `text` 12 px raio 4 · `circle` · `block` raio 8.
 */
export function Skeleton({
  width,
  height,
  radius,
  shape = 'text',
  delay,
  className = '',
  style,
}: {
  width?: Size;
  height?: Size;
  radius?: Size;
  shape?: 'text' | 'circle' | 'block';
  /** Atraso do pulso em ms (linhas vizinhas defasam 80 ms). */
  delay?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const h = height ?? (shape === 'circle' ? (width ?? 20) : shape === 'block' ? 40 : 12);
  const w = width ?? (shape === 'circle' ? h : '100%');
  return (
    <span
      aria-hidden="true"
      className={`${s.skel} ${className}`}
      data-shape={shape}
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        animationDelay: delay ? `${delay}ms` : undefined,
        ...style,
      }}
    />
  );
}

/** Região carregando: `aria-busy` + “Carregando” para leitor de tela. Os blocos são decorativos. */
export function SkeletonRegion({
  label = 'Carregando',
  className = '',
  style,
  children,
}: {
  label?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div className={className} style={style} aria-busy="true">
      <VisuallyHidden>{label}</VisuallyHidden>
      {children}
    </div>
  );
}

/** Parágrafo em esqueleto: barras de 10 px em linhas de 20 px; a última mais curta. */
export function SkeletonText({
  lines = 3,
  lastWidth = '60%',
  lineHeight = 20,
  barHeight = 10,
  label,
}: {
  lines?: number;
  lastWidth?: Size;
  lineHeight?: number;
  barHeight?: number;
  label?: string;
}) {
  return (
    <SkeletonRegion
      label={label}
      className={s.skelText}
      style={{ '--skel-line': `${lineHeight}px` } as CSSProperties}
    >
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          height={barHeight}
          width={index === lines - 1 && lines > 1 ? lastWidth : '100%'}
        />
      ))}
    </SkeletonRegion>
  );
}

export type SkeletonColumn = {
  /** Trilha da grade (px, %, `1fr`). Padrão `1fr`. */
  width?: Size;
  /** Largura da barra dentro da célula. */
  bar?: Size;
  /** Segunda linha (meta) com esta largura. */
  sub?: Size;
  shape?: 'text' | 'circle' | 'block';
  height?: number;
  radius?: Size;
  /** Círculo de 20 px antes da barra (marca, avatar). */
  lead?: boolean;
  align?: 'start' | 'end' | 'center';
};

/**
 * Linhas em esqueleto com as mesmas colunas da tabela/lista que vão substituir (altura da linha
 * igual, fio entre linhas). Cada linha atrasa o pulso em 80 ms.
 */
export function SkeletonRows({
  columns,
  rows = 5,
  rowHeight = 46,
  divided = true,
  gap = 16,
  label,
  className = '',
}: {
  columns: SkeletonColumn[];
  rows?: number;
  rowHeight?: number;
  divided?: boolean;
  gap?: number;
  label?: string;
  className?: string;
}) {
  const template = columns
    .map((column) =>
      typeof column.width === 'number' ? `${column.width}px` : (column.width ?? 'minmax(0, 1fr)'),
    )
    .join(' ');
  return (
    <SkeletonRegion label={label} className={`${s.skelRows} ${className}`}>
      {Array.from({ length: rows }, (_, row) => (
        <div
          key={row}
          className={s.skelRow}
          data-divided={divided || undefined}
          style={{ gridTemplateColumns: template, minHeight: rowHeight, columnGap: gap }}
        >
          {columns.map((column, col) => (
            <div key={col} className={s.skelCell} data-align={column.align ?? 'start'}>
              {column.lead && <Skeleton shape="circle" width={20} delay={row * 80} />}
              <span className={s.skelStack}>
                <Skeleton
                  shape={column.shape}
                  width={column.bar ?? (column.shape === 'circle' ? column.height : '72%')}
                  height={column.height}
                  radius={column.radius}
                  delay={row * 80}
                />
                {column.sub && <Skeleton width={column.sub} height={9} delay={row * 80} />}
              </span>
            </div>
          ))}
        </div>
      ))}
    </SkeletonRegion>
  );
}

/**
 * Troca o esqueleto pelo conteúdo com crossfade de 180 ms. As duas camadas dividem a mesma célula
 * da grade durante a troca: com a mesma geometria, nada se mexe.
 */
export function LoadingSwap({
  loading,
  skeleton,
  children,
  label = 'Carregando',
  className = '',
}: {
  loading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  const [showSkeleton, setShowSkeleton] = useState(loading);
  const [last, setLast] = useState(loading);
  if (last !== loading) {
    setLast(loading);
    if (loading) setShowSkeleton(true);
  }
  useEffect(() => {
    if (loading) return;
    const timer = window.setTimeout(() => setShowSkeleton(false), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [loading]);
  return (
    <div className={`${s.swap} ${className}`} aria-busy={loading || undefined}>
      {showSkeleton && (
        <div
          className={s.swapLayer}
          data-layer={loading ? 'skeleton' : 'leaving'}
          aria-hidden="true"
        >
          {skeleton}
        </div>
      )}
      {!loading && (
        <div className={s.swapLayer} data-layer="content" data-fade={showSkeleton || undefined}>
          {children}
        </div>
      )}
      <VisuallyHidden role="status">{loading ? label : ''}</VisuallyHidden>
    </div>
  );
}

/* ——————————————————————————— Estados (vazio, erro, acesso) ——————————————————————————— */

export type StateSize = 'page' | 'panel' | 'inline';
type Heading = 'h1' | 'h2' | 'h3' | 'p';

function StateBlock({
  icon: Icon,
  tone = 'gray',
  title,
  description,
  meta,
  actions,
  size,
  role,
  heading = 'p',
  className = '',
}: {
  icon?: LucideIcon;
  tone?: 'gray' | 'red';
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  size: StateSize;
  role?: 'alert' | 'status';
  heading?: Heading;
  className?: string;
}) {
  if (size === 'inline') {
    return (
      <div className={`${s.stateInline} ${className}`} data-tone={tone} role={role}>
        {Icon && <Icon className={s.stateInlineIcon} aria-hidden="true" />}
        <span className={s.stateInlineText}>{title}</span>
        {actions && <span className={s.stateInlineActions}>{actions}</span>}
      </div>
    );
  }
  const Title = heading;
  return (
    <div className={`${s.state} ${className}`} data-size={size} role={role}>
      {size === 'page' && Icon && (
        <span className={s.stateTile} data-tone={tone} aria-hidden="true">
          <Icon />
        </span>
      )}
      <div className={s.stateText}>
        <Title className={s.stateTitle}>{title}</Title>
        {description && <p className={s.stateDesc}>{description}</p>}
        {meta && <p className={s.stateMeta}>{meta}</p>}
      </div>
      {actions && <div className={s.stateActions}>{actions}</div>}
    </div>
  );
}

/**
 * Nada para mostrar. `page`: ícone num bloco cinza de 40 (o único `IconTile` do sistema fora de
 * erro/acesso), título 14/600, uma linha de apoio (≤ 60 caracteres) e ações. `panel`: centrado,
 * sem ícone. `inline`: uma linha 13 `--muted` + ação em texto. O texto diz a causa (busca, aba,
 * nenhum registro), nunca culpa um filtro que não existe.
 */
export function EmptyState({
  icon,
  title,
  description,
  meta,
  actions,
  size = 'panel',
  heading,
  className,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  size?: StateSize;
  heading?: Heading;
  className?: string;
}) {
  return (
    <StateBlock
      icon={icon}
      title={title}
      description={description}
      meta={meta}
      actions={actions}
      size={size}
      heading={heading}
      className={className}
    />
  );
}

/**
 * Falha ao carregar. Diz o que falhou, oferece “Tentar de novo” (carregando enquanto tenta) e mostra
 * o código e a hora em legenda tabular. `page`: tentar é a ação principal; `panel`: secundária
 * pequena; `inline`: ação em texto. Sem rastro técnico, sem culpar quem usa.
 */
export function ErrorState({
  title,
  description,
  code,
  time,
  onRetry,
  retrying = false,
  actions,
  size = 'panel',
  heading,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  code?: string | number;
  /** Quando falhou (ex.: “22/10 16:40”). */
  time?: string;
  onRetry?: () => void;
  retrying?: boolean;
  actions?: ReactNode;
  size?: StateSize;
  heading?: Heading;
  className?: string;
}) {
  const meta = [code !== undefined ? `Código ${code}` : null, time].filter(Boolean).join(' · ');
  const retry =
    onRetry &&
    (size === 'inline' ? (
      <LinkButton onClick={onRetry} disabled={retrying} aria-busy={retrying || undefined}>
        {retrying ? 'Tentando…' : 'Tentar de novo'}
      </LinkButton>
    ) : (
      <Button
        variant={size === 'page' ? 'primary' : 'secondary'}
        size={size === 'page' ? 'md' : 'sm'}
        icon={RotateCw}
        loading={retrying}
        onClick={onRetry}
      >
        Tentar de novo
      </Button>
    ));
  return (
    <StateBlock
      icon={CircleAlert}
      tone="red"
      title={title}
      description={description}
      meta={meta || undefined}
      actions={
        retry || actions ? (
          <>
            {retry}
            {actions}
          </>
        ) : undefined
      }
      size={size}
      role="alert"
      heading={heading}
      className={className}
    />
  );
}

export type AccessKind = 'restricted' | 'expired' | 'not-found' | 'locked';

const ACCESS_ICON: Record<AccessKind, LucideIcon> = {
  restricted: Lock,
  expired: Clock,
  'not-found': SearchX,
  locked: Lock,
};

/**
 * Página que não pode ser mostrada: sem permissão, sessão expirada, não encontrada (inclusive
 * registro de outro anunciante) e edição bloqueada (com o status atual em `meta`).
 */
export function AccessState({
  kind,
  title,
  description,
  meta,
  actions,
  size = 'page',
  heading,
  className,
}: {
  kind: AccessKind;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  size?: Exclude<StateSize, 'inline'>;
  heading?: Heading;
  className?: string;
}) {
  return (
    <StateBlock
      icon={ACCESS_ICON[kind]}
      title={title}
      description={description}
      meta={meta}
      actions={actions}
      size={size}
      heading={heading}
      className={className}
    />
  );
}

/* ——————————————————————————— Notificações ——————————————————————————— */

/**
 * Uma notificação. `leading`: `Avatar` xs (pessoa), `BrandMark` xs (organização) ou
 * `<NotificationDot tone>` (evento do sistema). Não lida: título 500 `--ink` + ponto azul de 6 px na
 * borda esquerda. “Marcar como lida” aparece no hover/foco (sempre no toque).
 */
export function NotificationItem({
  leading,
  title,
  meta,
  unread = false,
  href,
  onOpen,
  onMarkRead,
  markLabel = 'Marcar como lida',
  'data-force': force,
}: {
  leading?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  unread?: boolean;
  href?: string;
  onOpen?: () => void;
  onMarkRead?: () => void;
  markLabel?: string;
  /** Prancha: `hover`, `focus`, `active`. */
  'data-force'?: string;
}) {
  const titleId = useId();
  const mainRef = useRef<HTMLElement | null>(null);
  // O anel de foco é da linha clicável; o fundo de hover/pressionado é do item.
  const rowForce = force
    ?.split(' ')
    .filter((token) => token !== 'focus')
    .join(' ');
  const body = (
    <>
      <span className={s.nLead} aria-hidden="true">
        {leading}
      </span>
      <span className={s.nText}>
        <span id={titleId} className={s.nTitle}>
          {title}
        </span>
        {meta && <span className={s.nMeta}>{meta}</span>}
      </span>
      {unread && <VisuallyHidden> (não lida)</VisuallyHidden>}
    </>
  );
  return (
    <li className={s.nItem} data-unread={unread || undefined} data-force={rowForce || undefined}>
      <i className={s.nDot} aria-hidden="true" />
      {href ? (
        <a
          ref={(node) => {
            mainRef.current = node;
          }}
          className={s.nMain}
          href={href}
          onClick={onOpen}
          data-force={force}
        >
          {body}
        </a>
      ) : (
        <button
          ref={(node) => {
            mainRef.current = node;
          }}
          type="button"
          className={s.nMain}
          onClick={onOpen}
          data-force={force}
        >
          {body}
        </button>
      )}
      {onMarkRead && (
        <button
          type="button"
          className={s.nMark}
          aria-label={markLabel}
          aria-describedby={titleId}
          title={markLabel}
          tabIndex={unread ? undefined : -1}
          disabled={!unread}
          onClick={() => {
            onMarkRead();
            // O botão some com a leitura: o foco fica na própria notificação.
            mainRef.current?.focus();
          }}
        >
          <Check aria-hidden="true" />
        </button>
      )}
    </li>
  );
}

/** Ponto de 8 px no lugar do avatar para eventos do sistema (começou a veicular, aguarda aprovação). */
export function NotificationDot({
  tone = 'gray',
}: {
  tone?: 'green' | 'violet' | 'amber' | 'orange' | 'red' | 'gray' | 'teal';
}) {
  return <i className={s.nStatus} data-tone={tone} aria-hidden="true" />;
}

export type NotificationEntry = {
  id: string;
  leading?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  unread?: boolean;
  href?: string;
};

/**
 * Painel de notificações (o menu do sino, 344 px): cabeçalho com “Marcar todas como lidas”, grupos
 * “Hoje / Anteriores”, rodapé “Ver todas”. Vazio: “Tudo em dia”.
 */
export function NotificationList({
  groups,
  title = 'Notificações',
  onOpen,
  onMarkRead,
  onMarkAll,
  onViewAll,
  emptyTitle = 'Tudo em dia',
  elevated = true,
  className = '',
  style,
  id,
}: {
  groups: { label: string; items: NotificationEntry[] }[];
  title?: string;
  onOpen?: (id: string) => void;
  onMarkRead?: (id: string) => void;
  onMarkAll?: () => void;
  onViewAll?: () => void;
  emptyTitle?: string;
  /** Sombra de camada flutuante (menu do sino). `false` para o painel chapado numa página. */
  elevated?: boolean;
  className?: string;
  style?: CSSProperties;
  id?: string;
}) {
  const titleId = useId();
  const filled = groups.filter((group) => group.items.length > 0);
  const unread = filled.some((group) => group.items.some((item) => item.unread));
  return (
    <section
      id={id}
      className={`${s.nPanel} ${className}`}
      data-elevated={elevated || undefined}
      style={style}
      aria-labelledby={titleId}
    >
      <header className={s.nHead}>
        <h2 id={titleId} className={s.nHeadTitle}>
          {title}
        </h2>
        {onMarkAll && filled.length > 0 && (
          <LinkButton onClick={onMarkAll} disabled={!unread}>
            Marcar todas como lidas
          </LinkButton>
        )}
      </header>
      {filled.length === 0 ? (
        <div className={s.nEmpty}>
          <EmptyState size="inline" icon={CheckCheck} title={emptyTitle} />
        </div>
      ) : (
        <div className={s.nBody}>
          {filled.map((group) => (
            <div key={group.label} className={s.nGroup} role="group" aria-label={group.label}>
              <p className={s.nGroupLabel} aria-hidden="true">
                {group.label}
              </p>
              <ul className={s.nList}>
                {group.items.map((item) => (
                  <NotificationItem
                    key={item.id}
                    leading={item.leading}
                    title={item.title}
                    meta={item.meta}
                    unread={item.unread}
                    href={item.href}
                    onOpen={onOpen ? () => onOpen(item.id) : undefined}
                    onMarkRead={onMarkRead ? () => onMarkRead(item.id) : undefined}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      {onViewAll && (
        <footer className={s.nFoot}>
          <LinkButton onClick={onViewAll}>Ver todas</LinkButton>
        </footer>
      )}
    </section>
  );
}
