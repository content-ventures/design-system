'use client';

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ChartNoAxesColumn,
  CircleAlert,
  RotateCw,
  type LucideIcon,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Button } from './button';
import { IconTile } from './identity';
import { Segmented, type SegmentOption } from './selection';
import s from './charts.module.css';

/*
 * Gráficos do MediaOn V3 — SVG puro, chapados.
 * Marcas finas, cor sólida, grade recessiva, tooltip em papel (fixo, nunca recortado) e leitura
 * alternativa em tabela. Largura medida no cliente: o SVG é desenhado em pixels reais.
 *
 * Movimento: nada anima na primeira pintura. Depois dela, mudança de dado transforma a marca
 * (barra, linha, área) em 280 ms com `ease-out`; o que entra depois aparece por `@starting-style`.
 * `prefers-reduced-motion` zera as durações pelo tema.
 */

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/* ——————————————————————————— Cores ——————————————————————————— */

export type ChartColor =
  | 'blue'
  | 'teal'
  | 'violet'
  | 'amber'
  | 'pink'
  | 'green'
  | 'orange'
  | 'red'
  | 'sky'
  | 'gray'
  /** Grandeza sem status nem identidade (variação positiva ao lado de perdas em vermelho). */
  | 'neutral';

/**
 * solid: marca · muted: barra em repouso · soft: faixa clara · hover: barra em repouso sob o
 * ponteiro · light: série de comparação (mesma matiz, mais clara) · ink: texto na cor da série.
 */
type Tone = {
  solid: string;
  muted: string;
  soft: string;
  hover: string;
  light: string;
  ink: string;
};
export type ChartTone = keyof Tone;

const tint = (token: string, amount: number) =>
  `color-mix(in srgb, var(${token}) ${amount}%, var(--paper))`;

function statusTone(name: string): Tone {
  return {
    solid: `var(--${name}-dot)`,
    muted: `var(--${name}-line)`,
    soft: `var(--${name}-line)`,
    hover: tint(`--${name}-dot`, 55),
    light: tint(`--${name}-dot`, 55),
    ink: `var(--${name}-ink)`,
  };
}

const palette: Record<ChartColor, Tone> = {
  blue: {
    solid: 'var(--b-600)',
    muted: 'var(--b-200)',
    soft: 'var(--b-100)',
    hover: 'var(--b-300)',
    light: 'var(--b-300)',
    ink: 'var(--b-700)',
  },
  sky: {
    solid: 'var(--b-400)',
    muted: 'var(--b-200)',
    soft: 'var(--b-100)',
    hover: 'var(--b-300)',
    light: 'var(--b-200)',
    ink: 'var(--b-700)',
  },
  teal: statusTone('teal'),
  violet: statusTone('violet'),
  amber: statusTone('amber'),
  pink: statusTone('pink'),
  green: statusTone('green'),
  orange: statusTone('orange'),
  red: statusTone('red'),
  gray: {
    solid: 'var(--g-300)',
    muted: 'var(--g-150)',
    soft: 'var(--g-100)',
    hover: 'var(--g-200)',
    light: 'var(--g-200)',
    ink: 'var(--g-600)',
  },
  neutral: {
    solid: 'var(--g-400)',
    muted: 'var(--g-200)',
    soft: 'var(--g-100)',
    hover: 'var(--g-300)',
    light: 'var(--g-300)',
    ink: 'var(--g-700)',
  },
};

/**
 * Ordem categórica fixa (validada para daltonismo em pares vizinhos, inclusive fechando a rosca).
 * A cor segue a entidade: filtrar séries nunca repinta as que ficam.
 */
export const chartPalette: ChartColor[] = ['blue', 'teal', 'violet', 'amber', 'pink'];

/** Cor CSS de um tom do gráfico. */
export function chartColor(color: ChartColor, step: ChartTone = 'solid') {
  return palette[color][step];
}

const isChartColor = (value: string): value is ChartColor => value in palette;
const cssColor = (color: ChartColor | string) =>
  isChartColor(color) ? palette[color].solid : color;

const seriesColor = (series: ChartSeries, index: number): ChartColor =>
  series.color ?? chartPalette[index] ?? 'gray';

/** Rampa ordinal do funil: etapa de topo escura, as seguintes clareando (b-600 → b-200). */
const funnelRamp = ['var(--b-600)', 'var(--b-500)', 'var(--b-400)', 'var(--b-300)', 'var(--b-200)'];
const funnelRampLong = [
  'var(--b-700)',
  'var(--b-600)',
  'var(--b-500)',
  'var(--b-400)',
  'var(--b-300)',
  'var(--b-200)',
  'var(--b-100)',
];
function rampFor(count: number) {
  const steps = count <= funnelRamp.length ? funnelRamp : funnelRampLong;
  const last = steps.length - 1;
  if (count <= 1) return [steps[0] as string];
  const span = Math.min(last, count - 1);
  return Array.from(
    { length: count },
    (_, i) => steps[Math.round((i * span) / (count - 1))] as string,
  );
}

/* ——————————————————————————— Formatos pt-BR ——————————————————————————— */

export const formatInt = (value: number) =>
  value.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
/**
 * Compacto (“25 mil”, “1,2 mi”). Duas casas só quando são exatas (marca de eixo “1,25 mi”),
 * para nunca arredondar uma marca redonda para outro número.
 */
export function formatCompact(value: number) {
  const abs = Math.abs(value);
  const unit = abs >= 1e9 ? 1e9 : abs >= 1e6 ? 1e6 : abs >= 1e3 ? 1e3 : 1;
  const m = abs / unit;
  const exact = (d: number) => Math.abs(m * 10 ** d - Math.round(m * 10 ** d)) < 1e-6;
  const digits = !exact(1) && exact(2) ? 2 : 1;
  return value.toLocaleString('pt-BR', { notation: 'compact', maximumFractionDigits: digits });
}
export const formatBRL = (value: number, digits = 0) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
export const formatBRLCompact = (value: number) =>
  value === 0 ? 'R$ 0' : `R$ ${formatCompact(value)}`;
export const formatPct = (value: number, digits = 1) =>
  `${value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
/** Variação com sinal tipográfico: “+18,4%”, “−62,0%”. */
export const formatDelta = (value: number, digits = 1) =>
  `${value > 0 ? '+' : value < 0 ? '−' : ''}${formatPct(Math.abs(value), digits)}`;

/* ——————————————————————————— Escala ——————————————————————————— */

/**
 * Marcas redondas do eixo (1, 2, 2,5, 5 × 10ⁿ): o intervalo mais justo com no máximo 6 marcas.
 * `counts` limita as tentativas (eixos estreitos pedem poucas marcas).
 */
export function niceTicks(
  max: number,
  min = 0,
  counts: number[] = [4, 5, 3, 6],
  limit = 6,
): number[] {
  const span = max - min;
  if (!(span > 0)) return [min, min + 1, min + 2, min + 3, min + 4];
  let best: number[] | null = null;
  let fallback: number[] | null = null;
  for (const count of counts) {
    const raw = span / count;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const n = raw / mag;
    const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
    const start = Math.floor(min / step + 1e-9) * step;
    const steps = Math.ceil((max - start) / step - 1e-9);
    const ticks = Array.from({ length: steps + 1 }, (_, i) =>
      Number((start + i * step).toPrecision(12)),
    );
    const range = (t: number[]) => (t[t.length - 1] ?? 0) - (t[0] ?? 0);
    if (!fallback || range(ticks) < range(fallback)) fallback = ticks;
    if (ticks.length > limit) continue;
    // Mesmo intervalo: 5 marcas leem melhor; depois 4, 6 e 3.
    const ideal = Math.min(5, limit);
    const fit = (t: number[]) => Math.abs(t.length - ideal) + (t.length < ideal ? 0 : 0.5);
    if (
      !best ||
      range(ticks) < range(best) ||
      (range(ticks) === range(best) && fit(ticks) < fit(best))
    )
      best = ticks;
  }
  return best ?? fallback ?? [min, max];
}

/** Largura aproximada de um rótulo (Inter, algarismos tabulares), por classe de caractere. */
function textWidth(text: string, size = 12) {
  let em = 0;
  for (const ch of text) {
    if (/[0-9]/.test(ch)) em += 0.6;
    else if (/[A-ZÀ-Ý%]/.test(ch)) em += 0.66;
    else if (/[\s.,:;·|il1'!]/.test(ch)) em += 0.28;
    else if (/[mwMW]/.test(ch)) em += 0.8;
    else em += 0.52;
  }
  return em * size;
}

const clamp = (value: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, value));

/** Quantas marcas de Y cabem com folga (uma a cada ~28 px), até 6. */
const tickLimit = (plotH: number) => clamp(Math.floor(plotH / 28) + 1, 3, 6);

/* ——————————————————————————— Medida, prontidão e exploração ——————————————————————————— */

function useWidth<T extends HTMLElement>() {
  const [node, setNode] = useState<T | null>(null);
  const [width, setWidth] = useState(0);
  useIsoLayoutEffect(() => {
    if (!node) return;
    const measure = () => setWidth(Math.floor(node.clientWidth));
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);
  return [setNode, width, node] as const;
}

/**
 * Marca o nó com `data-ready` depois da primeira pintura. O CSS só anima a entrada (por
 * `@starting-style`) do que aparece depois disso: a primeira pintura nunca anima.
 */
function useReady(node: Element | null) {
  useEffect(() => {
    if (!node) return;
    const id = requestAnimationFrame(() => node.setAttribute('data-ready', ''));
    return () => cancelAnimationFrame(id);
  }, [node]);
}

type ExplorerOptions = {
  /** Enter, espaço ou clique fixam o destaque; Escape solta. */
  lockable?: boolean;
  /** Índice desenhado como em hover (pranchas). */
  force?: number;
  /** Índice já fixado ao montar. */
  pinned?: number;
  /**
   * Identidade de cada índice (rótulo do dado). Quando o recorte muda (6 → 12 meses), o destaque
   * fixado e o do teclado seguem o mesmo dado; se ele saiu do recorte, somem.
   */
  keys?: string[];
  /** Raiz do gráfico: um toque fora dela solta o destaque de toque. */
  root?: Element | null;
};

/**
 * Exploração por ponteiro e teclado: setas percorrem, Home/End vão às pontas, Enter fixa,
 * Escape solta. O anúncio para leitor de tela só acontece quando a mudança veio do teclado.
 * Toque nunca fixa: mostra o destaque, que fica até um toque fora do gráfico.
 */
function useExplorer(count: number, initial = 0, options: ExplorerOptions = {}) {
  const { lockable = false, force, pinned, keys, root } = options;
  const [hover, setHover] = useState<number | null>(null);
  const [keyboard, setKeyboard] = useState(false);
  const [locked, setLocked] = useState<number | null>(pinned ?? null);
  const touch = useRef(false);

  // Mudou o conjunto de dados: o destaque acompanha o dado pelo rótulo, nunca pela posição.
  const identity = keys ? keys.join('␟') : String(count);
  const [seen, setSeen] = useState({ identity, keys });
  if (seen.identity !== identity) {
    const follow = (index: number | null) => {
      const key = index === null ? undefined : seen.keys?.[index];
      const next = key === undefined || !keys ? -1 : keys.indexOf(key);
      return next >= 0 ? next : null;
    };
    setSeen({ identity, keys });
    setHover(follow(hover));
    setLocked(follow(locked));
  }

  const valid = (index: number | null | undefined) =>
    index != null && index >= 0 && index < count ? index : null;
  const live = valid(hover);
  const lock = valid(locked);
  const forced = valid(force);
  /** O que o gráfico mostra: hover, senão o fixado, senão o forçado. */
  const current = live ?? lock ?? forced;
  /** Índice desenhado com o estado de hover (faixa cinza, barra clara). */
  const hovered = live ?? (lock === null ? forced : null);

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (count === 0) return;
    const from = current ?? -1;
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = Math.min(count - 1, from + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = from < 0 ? count - 1 : Math.max(0, from - 1);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = count - 1;
        break;
      case 'Enter':
      case ' ':
        if (!lockable || current === null) return;
        event.preventDefault();
        setKeyboard(true);
        setLocked(lock === current ? null : current);
        return;
      case 'Escape':
        if (live === null && lock === null) return;
        event.preventDefault();
        setLocked(null);
        setHover(null);
        return;
      default:
        return;
    }
    event.preventDefault();
    setKeyboard(true);
    setHover(next);
  }
  function onFocus(event: FocusEvent<HTMLElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.currentTarget.matches(':focus-visible')) {
      setKeyboard(true);
      setHover(lock ?? Math.min(count - 1, Math.max(0, initial)));
    }
  }
  function onBlur(event: FocusEvent<HTMLElement>) {
    if (event.target !== event.currentTarget) return;
    setHover(null);
    setKeyboard(false);
  }
  const point = useCallback((index: number | null) => {
    setKeyboard(false);
    setHover(index);
  }, []);
  const focusAt = useCallback((index: number) => {
    setKeyboard(true);
    setHover(index);
  }, []);
  const toggle = useCallback(
    (index: number) => {
      // Toque: destaque passageiro (o dedo não tem hover para soltar depois).
      if (touch.current) {
        setKeyboard(false);
        setHover(index);
        return;
      }
      if (!lockable) return;
      setLocked((previous) => (previous === index ? null : index));
    },
    [lockable],
  );
  /** Registra o tipo de ponteiro antes do clique (vai na raiz, em captura). */
  const capture = useCallback((event: ReactPointerEvent) => {
    touch.current = event.pointerType === 'touch';
  }, []);
  /** Ponteiro saiu: some o destaque. No toque, ele fica até um toque fora. */
  const leave = useCallback((event: ReactPointerEvent) => {
    if (event.pointerType === 'touch') return;
    setKeyboard(false);
    setHover(null);
  }, []);

  const pointer = live !== null && !keyboard;
  useEffect(() => {
    if (!pointer || !root) return;
    const onDown = (event: PointerEvent) => {
      if (!root.contains(event.target as Node)) setHover(null);
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [pointer, root]);

  return {
    current,
    hovered,
    locked: lock,
    /** Hover vindo do ponteiro (não do forçado). */
    pointer,
    keyboard,
    point,
    focusAt,
    toggle,
    capture,
    leave,
    bind: {
      tabIndex: 0,
      onKeyDown,
      onFocus,
      onBlur,
      onPointerDownCapture: capture,
      onPointerLeave: leave,
    },
  };
}

/**
 * Tabela para leitor de tela, dentro de um `div` oculto: a `table` não encolhe a 1 px nem recorta
 * o conteúdo, e sozinha alargava a página no celular (408 px numa tela de 390).
 */
function SrTable({ caption, head, rows }: { caption: string; head: string[]; rows: string[][] }) {
  return (
    <div className={s.srOnly}>
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {head.map((cell, index) => (
              <th key={`${cell}-${index}`} scope="col">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) =>
                cellIndex === 0 ? (
                  <th key={cellIndex} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={cellIndex}>{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Live({ children }: { children: ReactNode }) {
  return (
    <div className={s.srOnly} aria-live="polite" aria-atomic="true">
      {children}
    </div>
  );
}

/** `d` como propriedade CSS: o navegador interpola a forma (mesma sequência de comandos). */
function morph(path: string, extra: CSSProperties = {}): CSSProperties {
  return Object.assign({}, extra, { d: `path('${path}')` }) as CSSProperties;
}

const f2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Barra com raio só na ponta do dado (topo, ou base nas negativas). A sequência de comandos é
 * sempre a mesma — inclusive com altura zero — para a forma poder se transformar.
 */
function barD(x: number, y: number, w: number, h: number, rt: number, rb: number) {
  const W = Math.max(0, w);
  const H = Math.max(0, h);
  const t = Math.min(rt, W / 2, H);
  const b = Math.min(rb, W / 2, Math.max(0, H - t));
  return [
    `M${f2(x)} ${f2(y + t)}`,
    `Q${f2(x)} ${f2(y)} ${f2(x + t)} ${f2(y)}`,
    `H${f2(x + W - t)}`,
    `Q${f2(x + W)} ${f2(y)} ${f2(x + W)} ${f2(y + t)}`,
    `V${f2(y + H - b)}`,
    `Q${f2(x + W)} ${f2(y + H)} ${f2(x + W - b)} ${f2(y + H)}`,
    `H${f2(x + b)}`,
    `Q${f2(x)} ${f2(y + H)} ${f2(x)} ${f2(y + H - b)}`,
    'Z',
  ].join('');
}

/* ——————————————————————————— Tooltip flutuante ——————————————————————————— */

type Box = { left: number; top: number; right: number; bottom: number };
type Placement = 'side' | 'above' | 'below';

const TIP_GAP = 12;
const TIP_EDGE = 8;

/**
 * Faixa disponível num eixo: a do gráfico (dentro da janela, a 8 px da borda) quando o balão cabe
 * nela; senão, a da janela.
 */
function span(lo: number, hi: number, size: number, view: number) {
  const a = Math.max(lo, TIP_EDGE);
  const b = Math.min(hi, view - TIP_EDGE);
  return b - a >= size
    ? { lo: a, hi: b }
    : { lo: TIP_EDGE, hi: Math.max(TIP_EDGE + size, view - TIP_EDGE) };
}

/**
 * Camada fixa do tooltip: renderiza no escopo do tema (portal) e fica dentro do próprio gráfico
 * (`root`) — nunca sobre o cartão vizinho. Ao lado: à direita da marca, ou à esquerda quando não
 * cabe; acima/abaixo: vira quando falta espaço. Acompanha a âncora com 120 ms de atraso e nunca
 * é recortada por moldura com `overflow`.
 */
function FloatingTip({
  root,
  anchor,
  placement = 'side',
  children,
}: {
  root: Element;
  /** Retângulo da marca em coordenadas da janela. */
  anchor: () => Box | null;
  placement?: Placement;
  children: ReactNode;
}) {
  const tipRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef(anchor);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [glide, setGlide] = useState(false);

  const place = useCallback(() => {
    const tip = tipRef.current;
    const box = anchorRef.current();
    if (!tip || !box) return;
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    // Marca fora da janela (rolou para longe): o tooltip some em vez de grudar na borda.
    if (box.bottom < 0 || box.top > vh || box.right < 0 || box.left > vw) {
      setPos(null);
      setGlide(false);
      return;
    }
    const frame = root.getBoundingClientRect();
    const xs = span(frame.left, frame.right, w, vw);
    const ys = span(frame.top, frame.bottom, h, vh);
    let left: number;
    let top: number;
    if (placement === 'side') {
      const after = box.right + TIP_GAP;
      const before = box.left - TIP_GAP - w;
      const fitsAfter = after + w <= xs.hi;
      const fitsBefore = before >= xs.lo;
      // Cabe dos dois lados: direita. Em nenhum: o lado com mais espaço.
      left = fitsAfter || (!fitsBefore && xs.hi - box.right >= box.left - xs.lo) ? after : before;
      top = (box.top + box.bottom) / 2 - h / 2;
    } else {
      const above = box.top - TIP_GAP - h;
      const below = box.bottom + TIP_GAP;
      const fitsAbove = above >= ys.lo;
      const fitsBelow = below + h <= ys.hi;
      top =
        placement === 'above'
          ? fitsAbove || !fitsBelow
            ? above
            : below
          : fitsBelow || !fitsAbove
            ? below
            : above;
      left = (box.left + box.right) / 2 - w / 2;
    }
    left = clamp(left, xs.lo, xs.hi - w);
    top = clamp(top, ys.lo, ys.hi - h);
    setPos((previous) =>
      previous && Math.abs(previous.left - left) < 0.5 && Math.abs(previous.top - top) < 0.5
        ? previous
        : { left, top },
    );
  }, [placement, root]);

  useIsoLayoutEffect(() => {
    anchorRef.current = anchor;
    place();
  });

  useEffect(() => {
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [place]);

  // Só desliza depois de posicionado: a primeira aparição nasce no lugar.
  useEffect(() => {
    if (!pos || glide) return;
    const id = requestAnimationFrame(() => setGlide(true));
    return () => cancelAnimationFrame(id);
  }, [pos, glide]);

  const host = root.closest('[data-ds-v3]') ?? document.body;
  return createPortal(
    <div
      ref={tipRef}
      className={s.float}
      data-placed={pos ? true : undefined}
      data-glide={glide || undefined}
      style={{ left: pos?.left ?? 0, top: pos?.top ?? 0 }}
      aria-hidden="true"
    >
      {children}
    </div>,
    host,
  );
}

/* ——————————————————————————— Chave, legenda e tooltip ——————————————————————————— */

export type KeyShape = 'dot' | 'square' | 'line' | 'dashed';

/** Marca de identidade da série. Espelha a marca do gráfico: ponto, quadrado, traço ou tracejado. */
export function ChartKey({
  color,
  shape = 'dot',
  hollow = false,
}: {
  color: ChartColor | string;
  shape?: KeyShape;
  hollow?: boolean;
}) {
  const value = cssColor(color);
  if (shape === 'line' || shape === 'dashed') {
    return (
      <svg className={s.keyLine} width="14" height="4" viewBox="0 0 14 4" aria-hidden="true">
        <line
          x1="1"
          x2="13"
          y1="2"
          y2="2"
          style={{ stroke: hollow ? 'var(--g-300)' : value }}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={shape === 'dashed' ? '3 3' : undefined}
        />
      </svg>
    );
  }
  return (
    <i
      className={s.key}
      data-shape={shape}
      data-hollow={hollow || undefined}
      style={{ '--key': value } as CSSProperties}
      aria-hidden="true"
    />
  );
}

export type LegendItem = {
  key: string;
  label: string;
  /** Tom do gráfico ou cor CSS (ex.: `var(--g-400)` da referência). */
  color: ChartColor | string;
  shape?: KeyShape;
  /** Valor ao lado do rótulo (total da série, participação). */
  value?: ReactNode;
  /** Complemento discreto em `--muted` (“12.903 por dia”). */
  detail?: ReactNode;
  /** Série de comparação (mesma matiz, mais clara). */
  faded?: boolean;
  /** Estado parado para pranchas (`hover`, `active`, `focus`). */
  force?: string;
};

type Nudge = { x: number; y: number; below: boolean; host: Element };

/**
 * Legenda. Sem `onToggle`, linha de chaves (como no “Entrega diária” aprovado). Com `onToggle`,
 * cada item vira um botão que mostra/oculta a série; a última visível não some — mostra a dica
 * “Pelo menos uma série”.
 */
export function Legend({
  items,
  hidden = [],
  onToggle,
  label = 'Legenda',
}: {
  items: LegendItem[];
  hidden?: string[];
  onToggle?: (key: string) => void;
  label?: string;
}) {
  const visible = items.filter((item) => !hidden.includes(item.key)).length;
  const [nudge, setNudge] = useState<Nudge | null>(null);

  useEffect(() => {
    if (!nudge) return;
    const timer = window.setTimeout(() => setNudge(null), 1600);
    const close = () => setNudge(null);
    window.addEventListener('scroll', close, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', close, true);
    };
  }, [nudge]);

  return (
    <>
      <ul className={s.legend} aria-label={label} data-interactive={onToggle ? true : undefined}>
        {items.map((item) => {
          const off = hidden.includes(item.key);
          const color =
            item.faded && isChartColor(item.color) ? palette[item.color].light : item.color;
          const content = (
            <>
              <ChartKey color={color} shape={item.shape} hollow={off} />
              <span className={s.legendLabel}>{item.label}</span>
              {item.detail !== undefined && <span className={s.legendDetail}>{item.detail}</span>}
              {item.value !== undefined && <span className={s.legendValue}>{item.value}</span>}
            </>
          );
          return (
            <li key={item.key}>
              {onToggle ? (
                <button
                  type="button"
                  className={s.legendButton}
                  aria-pressed={!off}
                  data-off={off || undefined}
                  data-last={!off && visible === 1 ? true : undefined}
                  data-force={item.force}
                  onClick={(event) => {
                    if (!off && visible === 1) {
                      const box = event.currentTarget.getBoundingClientRect();
                      const below = box.top < 44;
                      setNudge({
                        x: box.left + box.width / 2,
                        y: below ? box.bottom + 8 : box.top - 8,
                        below,
                        host: event.currentTarget.closest('[data-ds-v3]') ?? document.body,
                      });
                      return;
                    }
                    setNudge(null);
                    onToggle(item.key);
                  }}
                >
                  {content}
                </button>
              ) : (
                <span className={s.legendItem}>{content}</span>
              )}
            </li>
          );
        })}
      </ul>
      {onToggle && <Live>{nudge ? 'Pelo menos uma série fica visível.' : ''}</Live>}
      {nudge &&
        createPortal(
          <span
            className={s.nudge}
            data-below={nudge.below || undefined}
            style={{ left: nudge.x, top: nudge.y }}
            aria-hidden="true"
          >
            Pelo menos uma série
          </span>,
          nudge.host,
        )}
    </>
  );
}

export type TooltipRow = {
  key: string;
  label: string;
  value: string;
  color?: ChartColor | string;
  shape?: KeyShape;
  /** Participação, em `--muted` antes do valor (“62,5%”). */
  share?: string;
};

export type TooltipDelta = {
  value: number;
  /** “vs. semana anterior”. */
  label: string;
  /** Qual direção é boa (padrão: subir). */
  better?: 'up' | 'down';
  unit?: '%' | 'p.p.';
};

/**
 * Tooltip em papel: título com a data, linhas com chave + rótulo + valor tabular à direita,
 * total e variação opcionais. `inline` desenha a peça parada (pranchas).
 */
export function ChartTooltip({
  title,
  rows,
  total,
  delta,
  footer,
  style,
  side = 'right',
  className = '',
  inline = false,
}: {
  title?: ReactNode;
  rows: TooltipRow[];
  total?: { label?: string; value: string };
  delta?: TooltipDelta;
  footer?: ReactNode;
  /** Legado: posição absoluta dentro do gráfico. */
  style?: CSSProperties;
  side?: 'left' | 'right' | 'center';
  className?: string;
  inline?: boolean;
}) {
  const positioned = style !== undefined && !inline;
  const up = delta ? delta.value > 0 : false;
  const flat = delta ? Math.abs(delta.value) < 0.05 : false;
  const good = delta && !flat ? up === ((delta.better ?? 'up') === 'up') : undefined;
  const Arrow = up ? ArrowUpRight : ArrowDownRight;
  return (
    <div
      className={`${s.tooltip} ${className}`}
      style={style}
      data-positioned={positioned || undefined}
      data-side={positioned ? side : undefined}
      data-inline={inline || undefined}
      aria-hidden={inline ? undefined : true}
    >
      {title && <div className={s.tipTitle}>{title}</div>}
      <div className={s.tipRows}>
        {rows.map((row) => (
          <div key={row.key} className={s.tipRow}>
            <span className={s.tipKey}>
              {row.color && <ChartKey color={row.color} shape={row.shape ?? 'line'} />}
            </span>
            <span className={s.tipLabel}>{row.label}</span>
            {row.share && <span className={s.tipShare}>{row.share}</span>}
            <span className={s.tipValue}>{row.value}</span>
          </div>
        ))}
      </div>
      {total && (
        <div className={s.tipTotal}>
          <span>{total.label ?? 'Total'}</span>
          <b>{total.value}</b>
        </div>
      )}
      {footer && <div className={s.tipFoot}>{footer}</div>}
      {delta && (
        <div className={s.tipDelta} data-tone={good === undefined ? 'flat' : good ? 'good' : 'bad'}>
          {!flat && <Arrow aria-hidden="true" />}
          <span>
            {delta.unit === 'p.p.'
              ? `${Math.abs(delta.value).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} p.p.`
              : formatPct(Math.abs(delta.value))}{' '}
            {delta.label}
          </span>
        </div>
      )}
    </div>
  );
}

/* ——————————————————————————— Cartão do gráfico ——————————————————————————— */

export type ChartFigure = {
  label: string;
  value: ReactNode;
  unit?: string;
  /** Selo de variação, ex.: <Delta />. */
  delta?: ReactNode;
  color?: ChartColor;
  shape?: KeyShape;
  hint?: ReactNode;
};

/** Números de resumo acima do gráfico, separados por fio vertical (empilham em cartão estreito). */
export function ChartFigures({
  items,
  loading = false,
}: {
  items: ChartFigure[];
  /** Valores em esqueleto (mesma altura), enquanto o gráfico carrega. */
  loading?: boolean;
}) {
  return (
    <dl className={s.figures} aria-busy={loading || undefined}>
      {items.map((item) => (
        <div key={item.label} className={s.figure}>
          <dt className={s.figureLabel}>
            {item.color && <ChartKey color={item.color} shape={item.shape ?? 'dot'} />}
            {item.label}
          </dt>
          {/* Valor em texto (“E-mail”): sem algarismos tabulares, que abrem o hífen. */}
          <dd
            className={s.figureValue}
            data-text={(typeof item.value === 'string' && !/\d/.test(item.value)) || undefined}
          >
            {loading ? (
              <i className={s.figureSkeleton} aria-label="Carregando" />
            ) : (
              <>
                <span>
                  {item.value}
                  {item.unit && <span className={s.figureUnit}>{item.unit}</span>}
                </span>
                {item.delta}
              </>
            )}
          </dd>
          {item.hint && <dd className={s.figureHint}>{item.hint}</dd>}
        </div>
      ))}
    </dl>
  );
}

/**
 * Painel de gráfico (igual ao painel do Analytics aprovado): papel, fio de 1 px, raio 10,
 * padding 16/20. Título 14/600; descrição só quando carrega contexto do dado; legenda sob o título;
 * período (segmentado) e ações à direita.
 */
export function ChartCard<P extends string = string>({
  title,
  description,
  period,
  actions,
  figures,
  legend,
  footer,
  footerIcon: FooterIcon,
  children,
  bleed = false,
  titleAs: Title = 'h3',
  className = '',
}: {
  title: ReactNode;
  description?: ReactNode;
  period?: { options: SegmentOption<P>[]; value: P; onChange: (value: P) => void; label?: string };
  actions?: ReactNode;
  figures?: ReactNode;
  legend?: ReactNode;
  footer?: ReactNode;
  footerIcon?: LucideIcon;
  children: ReactNode;
  /** Gráfico encosta nas bordas do cartão (funil em fita). */
  bleed?: boolean;
  titleAs?: 'h2' | 'h3' | 'h4';
  className?: string;
}) {
  const id = useId();
  return (
    <section className={`${s.card} ${className}`} aria-labelledby={id}>
      <header className={s.head}>
        <div className={s.headText}>
          <Title id={id} className={s.title}>
            {title}
          </Title>
          {description && <p className={s.desc}>{description}</p>}
          {legend && <div className={s.headLegend}>{legend}</div>}
        </div>
        {(period || actions) && (
          <div className={s.headActions}>
            {period && (
              <Segmented
                size="sm"
                label={period.label ?? 'Período'}
                options={period.options}
                value={period.value}
                onChange={period.onChange}
              />
            )}
            {actions}
          </div>
        )}
      </header>
      {figures && <div className={s.figuresRow}>{figures}</div>}
      <div className={s.body} data-bleed={bleed || undefined}>
        {children}
      </div>
      {footer && (
        <footer className={s.foot}>
          {FooterIcon && <FooterIcon aria-hidden="true" />}
          <span className={s.footText}>{footer}</span>
        </footer>
      )}
    </section>
  );
}

/** Troca de conteúdo com crossfade de 180 ms (dados, estados, tabela). */
export function ChartSwap({
  id,
  children,
  minHeight,
}: {
  id: string;
  children: ReactNode;
  minHeight?: number;
}) {
  return (
    <div key={id} className={s.swap} style={minHeight ? { minHeight } : undefined}>
      {children}
    </div>
  );
}

/* ——————————————————————————— Estados ——————————————————————————— */

export type SkeletonShape = 'bars' | 'line' | 'donut' | 'funnel' | 'rows';

/**
 * Carregando, sem dados e erro — na mesma altura do gráfico, para nada pular. O esqueleto é
 * chapado (g-100) e pulsa devagar; nada de spinner nem brilho correndo.
 */
export function ChartState({
  kind,
  height = 240,
  skeleton = 'bars',
  title,
  description,
  action,
  onRetry,
  retrying = false,
  icon,
}: {
  kind: 'loading' | 'empty' | 'error';
  height?: number;
  skeleton?: SkeletonShape;
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  onRetry?: () => void;
  /** “Tentar de novo” em espera. */
  retrying?: boolean;
  icon?: LucideIcon;
}) {
  if (kind === 'loading') {
    return (
      <div className={s.state} style={{ height }} role="status" aria-label="Carregando gráfico">
        <Skeleton shape={skeleton} height={height} />
      </div>
    );
  }
  const error = kind === 'error';
  return (
    <div className={s.state} style={{ height }} role={error ? 'alert' : undefined}>
      <div className={s.stateBody}>
        <IconTile
          icon={icon ?? (error ? CircleAlert : ChartNoAxesColumn)}
          tone={error ? 'red' : 'gray'}
          variant="soft"
        />
        <p className={s.stateTitle}>
          {title ?? (error ? 'Não foi possível carregar' : 'Sem dados no período')}
        </p>
        {description && <p className={s.stateText}>{description}</p>}
        {(action || (error && onRetry)) && (
          <div className={s.stateAction}>
            {action ?? (
              <Button size="sm" icon={RotateCw} onClick={onRetry} loading={retrying}>
                Tentar de novo
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Skeleton({ shape, height }: { shape: SkeletonShape; height: number }) {
  if (shape === 'donut') {
    const size = Math.min(144, Math.round(height * 0.6));
    return (
      <div className={s.skDonut} aria-hidden="true">
        <i
          className={s.skRing}
          style={{ width: size, height: size, borderWidth: Math.max(8, Math.round(size * 0.09)) }}
        />
        <div className={s.skLines}>
          {[84, 66, 74].map((w) => (
            <span key={w} className={s.skLegend}>
              <i className={s.skDot} />
              <i className={s.skBlock} style={{ width: `${w - 30}%` }} />
              <i className={s.skBlock} style={{ width: 36, marginLeft: 'auto' }} />
            </span>
          ))}
        </div>
      </div>
    );
  }
  if (shape === 'rows' || shape === 'funnel') {
    const widths = shape === 'funnel' ? [100, 72, 50, 32, 18] : [92, 76, 64, 50, 38, 26];
    return (
      <div className={s.skRows} data-shape={shape} aria-hidden="true">
        {widths.map((w, i) => (
          <div key={i} className={s.skRow}>
            <i className={s.skBlock} style={{ width: 88 }} />
            <i className={s.skBar} style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
    );
  }
  if (shape === 'line') {
    return (
      <div className={s.skPlot} aria-hidden="true">
        <div className={s.skY}>
          {[0, 1, 2, 3, 4].map((i) => (
            <i key={i} className={s.skBlock} />
          ))}
        </div>
        <svg className={s.skSvg} viewBox="0 0 400 120" preserveAspectRatio="none">
          <path
            d="M4 34 C40 40 62 92 104 94 S150 60 200 66 S262 70 300 68 S360 66 396 62"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className={s.skX}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <i key={i} className={s.skBlock} />
          ))}
        </div>
      </div>
    );
  }
  const bars = [46, 62, 54, 70, 58, 78, 66, 88, 74];
  return (
    <div className={s.skPlot} aria-hidden="true">
      <div className={s.skY}>
        {[0, 1, 2, 3, 4].map((i) => (
          <i key={i} className={s.skBlock} />
        ))}
      </div>
      <div className={s.skBars}>
        {bars.map((h, i) => (
          <i key={i} className={s.skBar} style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className={s.skX}>
        {bars.map((_, i) => (
          <i key={i} className={s.skBlock} />
        ))}
      </div>
    </div>
  );
}

/* ——————————————————————————— Dados comuns ——————————————————————————— */

export type ChartDatum = {
  /** Rótulo curto do eixo, ex.: “Set”. */
  label: string;
  /** Título por extenso no tooltip, ex.: “16/10/2026 · sexta”. */
  title?: string;
  /** Linha secundária (barras horizontais), ex.: canal ou cota. */
  detail?: string;
  /** Marca antes do rótulo nas barras horizontais (BrandMark xs). */
  lead?: ReactNode;
  values: Record<string, number | null>;
  /** Cor própria do item em série única (ex.: tom de status, variação negativa). */
  color?: ChartColor;
};

export type ChartSeries = {
  key: string;
  label: string;
  color?: ChartColor;
  /** Linha tracejada — período anterior, previsão. */
  dashed?: boolean;
  /** Comparação: mesma matiz, mais clara. */
  faded?: boolean;
};

type Grid = 'dashed' | 'solid' | 'none';

/** Leitura alternativa visível: a mesma informação do gráfico em tabela. */
export function ChartTable({
  caption,
  data,
  series,
  format = formatInt,
  head = 'Data',
  hidden = [],
}: {
  caption: string;
  data: ChartDatum[];
  series: ChartSeries[];
  format?: (value: number) => string;
  head?: string;
  hidden?: string[];
}) {
  const shown = series.filter((sr) => !hidden.includes(sr.key));
  return (
    <div className={s.tableWrap}>
      <table className={s.table}>
        <caption className={s.srOnly}>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{head}</th>
            {shown.map((sr) => (
              <th key={sr.key} scope="col">
                {sr.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={`${d.label}-${i}`}>
              <th scope="row">{d.title ?? d.label}</th>
              {shown.map((sr) => {
                const v = d.values[sr.key];
                return <td key={sr.key}>{v == null ? '—' : format(v)}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function YGrid({
  ticks,
  y,
  left,
  right,
  grid,
  format,
}: {
  ticks: number[];
  y: (value: number) => number;
  left: number;
  right: number;
  grid: Grid;
  format: (value: number) => string;
}) {
  const bottom = ticks[0] ?? 0;
  return (
    <g aria-hidden="true">
      {ticks.map((tick, index) => {
        const py = Math.round(y(tick)) + 0.5;
        const zero = tick === 0 && bottom < 0;
        const base = index === 0 && bottom >= 0;
        return (
          <g key={tick}>
            {(base || zero || grid !== 'none') && (
              <line
                className={s.gridLine}
                data-base={base || undefined}
                data-zero={zero || undefined}
                data-dashed={!base && !zero && grid === 'dashed' ? true : undefined}
                x1={left}
                x2={right}
                y1={py}
                y2={py}
              />
            )}
            <text
              className={s.axisText}
              x={left - 10}
              y={py}
              textAnchor="end"
              dominantBaseline="central"
            >
              {format(tick)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** Corte no eixo quando ele não começa em zero: um ziguezague discreto sobre a linha de base. */
function AxisBreak({ x, y }: { x: number; y: number }) {
  return (
    <g className={s.axisBreak} transform={`translate(${x} ${y})`} aria-hidden="true">
      <rect x={-1} y={-4} width={12} height={8} />
      <path d="M0 0.5l2-3 3 6 3-6 2 3" />
    </g>
  );
}

/** De quantos em quantos rótulos mostrar no eixo X para que vizinhos não se toquem. */
function labelStep(labels: string[], slot: number, gap = 10) {
  const widths = labels.map((label) => textWidth(label, 11.5));
  for (let step = 1; step < labels.length; step++) {
    let fits = true;
    for (let i = 0; i + step < labels.length; i += step) {
      if (((widths[i] ?? 0) + (widths[i + step] ?? 0)) / 2 + gap > slot * step) {
        fits = false;
        break;
      }
    }
    if (fits) return step;
  }
  return Math.max(1, labels.length);
}

/** Marcas pedidas (dias redondos), descartando as que colariam na vizinha; a última fica. */
function fitTicks(wanted: number[], data: ChartDatum[], x: (i: number) => number) {
  const list = wanted.filter((i) => i >= 0 && i < data.length).sort((a, b) => a - b);
  const half = (i: number) => textWidth(data[i]?.label ?? '', 11.5) / 2;
  const kept: number[] = [];
  for (const i of list) {
    const prev = kept[kept.length - 1];
    if (prev === undefined || x(i) - half(i) - (x(prev) + half(prev)) >= 10) kept.push(i);
  }
  const last = list[list.length - 1];
  if (last !== undefined && kept[kept.length - 1] !== last) {
    while (kept.length) {
      const prev = kept[kept.length - 1] as number;
      if (x(last) - half(last) - (x(prev) + half(prev)) >= 10) break;
      kept.pop();
    }
    kept.push(last);
  }
  return new Set(kept);
}

/** Índices de rótulos visíveis: a cada `step`, contados do último (sempre visível), em ritmo regular. */
function visibleTicks(count: number, step: number) {
  const shown = new Set<number>();
  for (let i = count - 1; i >= 0; i -= step) shown.add(i);
  return shown;
}

function announce(d: ChartDatum | undefined, shown: ChartSeries[], format: (v: number) => string) {
  if (!d) return '';
  return `${d.title ?? d.label}: ${shown
    .map((sr) => {
      const v = d.values[sr.key];
      return `${sr.label} ${v == null ? 'sem dado' : format(v)}`;
    })
    .join(', ')}`;
}

/* ——————————————————————————— Barras ——————————————————————————— */

export type BarChartProps = {
  /** Nome do gráfico para leitores de tela e legenda da tabela alternativa. */
  label: string;
  data: ChartDatum[];
  series: ChartSeries[];
  orientation?: 'vertical' | 'horizontal';
  /** Várias séries lado a lado (padrão) ou empilhadas. */
  layout?: 'grouped' | 'stacked';
  /** Índice em destaque (ex.: mês atual). Os demais ficam mais claros. */
  highlight?: number;
  /** Rótulos de valor: nenhum, só o destaque ou todos. */
  values?: 'none' | 'highlight' | 'all';
  /** Sólida ou tingida com topo marcado. */
  appearance?: 'solid' | 'tinted';
  height?: number;
  format?: (value: number) => string;
  axisFormat?: (value: number) => string;
  labelFormat?: (value: number) => string;
  maxBarWidth?: number;
  grid?: Grid;
  /** Chaves de séries ocultas (controle pela `Legend`). */
  hidden?: string[];
  /** Resumo em texto; se ausente, é gerado. */
  summary?: string;
  /** Largura da coluna de rótulos (horizontal). */
  labelWidth?: number;
  /** Horizontal empilhada em 100%: cada linha mostra a participação de cada série. */
  normalize?: boolean;
  /** Título do eixo Y, em legenda no alto à esquerda (nunca girado). */
  yLabel?: string;
  /**
   * Índices dos rótulos do eixo X (vertical), para alinhar o ritmo com gráficos vizinhos.
   * Sem isso, o espaçamento é automático.
   */
  xTicks?: number[];
  /** Enter, espaço ou clique fixam o destaque (padrão: ligado). */
  lockable?: boolean;
  /** Índice já fixado ao montar. */
  pinned?: number;
  /** Índice desenhado como em hover (pranchas). */
  forceActive?: number;
  /** Estado parado para pranchas (`focus`). Nunca no produto. */
  'data-force'?: string;
};

function barSummary(
  label: string,
  data: ChartDatum[],
  series: ChartSeries[],
  format: (v: number) => string,
) {
  const first = data[0];
  if (!first) return `${label}: sem dados.`;
  if (series.length === 1) {
    const key = series[0]?.key ?? '';
    const valued = data.filter((d) => d.values[key] != null);
    const max = valued.reduce(
      (a, b) => ((b.values[key] ?? 0) > (a.values[key] ?? 0) ? b : a),
      valued[0] ?? first,
    );
    const min = valued.reduce(
      (a, b) => ((b.values[key] ?? 0) < (a.values[key] ?? 0) ? b : a),
      valued[0] ?? first,
    );
    return `${label}: ${data.length} itens. Maior valor em ${max.title ?? max.label}, ${format(max.values[key] ?? 0)}; menor em ${min.title ?? min.label}, ${format(min.values[key] ?? 0)}.`;
  }
  const totals = series.map(
    (sr) => `${sr.label} soma ${format(data.reduce((a, d) => a + (d.values[sr.key] ?? 0), 0))}`,
  );
  return `${label}: ${data.length} itens e ${series.length} séries. ${totals.join('; ')}.`;
}

function tableOf(data: ChartDatum[], series: ChartSeries[], format: (v: number) => string) {
  return {
    head: ['Item', ...series.map((sr) => sr.label)],
    rows: data.map((d) => [
      d.title ?? d.label,
      ...series.map((sr) => {
        const v = d.values[sr.key];
        return v == null ? 'sem dado' : format(v);
      }),
    ]),
  };
}

const keyboardHint = (lockable: boolean) =>
  `Use as setas para percorrer${lockable ? ', Enter para fixar e Escape para soltar' : ''}.`;

/** Barras e colunas. Vertical em SVG; horizontal em grade HTML (rótulos longos com reticências). */
export function BarChart(props: BarChartProps) {
  return props.orientation === 'horizontal' ? (
    <HorizontalBars {...props} />
  ) : (
    <VerticalBars {...props} />
  );
}

function VerticalBars({
  label,
  data,
  series,
  layout = 'grouped',
  highlight,
  values = 'none',
  appearance = 'solid',
  height = 260,
  format = formatInt,
  axisFormat = formatCompact,
  labelFormat,
  maxBarWidth = 28,
  grid = 'dashed',
  hidden = [],
  summary,
  yLabel,
  xTicks,
  lockable = true,
  pinned,
  forceActive,
  'data-force': force,
}: BarChartProps) {
  const [ref, width, node] = useWidth<HTMLDivElement>();
  useReady(node);
  const shown = series.filter((sr) => !hidden.includes(sr.key));
  const colors = new Map(series.map((sr, i) => [sr.key, seriesColor(sr, i)] as const));
  const stacked = layout === 'stacked' && series.length > 1;
  const single = shown.length === 1;
  const labels = data.map((d) => d.label);
  /* Outro conjunto de categorias (6 → 12 meses): as marcas trocam por crossfade, sem morph. */
  const categories = labels.join('␟');
  const explorer = useExplorer(data.length, highlight ?? data.length - 1, {
    lockable,
    force: forceActive,
    pinned,
    keys: labels,
    root: node,
  });
  const { current, hovered, locked } = explorer;

  const num = (d: ChartDatum, key: string) => d.values[key] ?? 0;
  const tops = data.map((d) =>
    stacked
      ? shown.reduce((sum, sr) => sum + Math.max(0, num(d, sr.key)), 0)
      : Math.max(0, ...shown.map((sr) => num(d, sr.key))),
  );
  const lows = stacked ? [0] : data.map((d) => Math.min(0, ...shown.map((sr) => num(d, sr.key))));
  const padTop = (values === 'none' ? 12 : 26) + (yLabel ? 20 : 0);
  const axisH = 28;
  const plotH = Math.max(10, height - padTop - axisH);
  const ticks = niceTicks(Math.max(0, ...tops), Math.min(0, ...lows), undefined, tickLimit(plotH));
  const top = ticks[ticks.length - 1] ?? 1;
  const bottom = ticks[0] ?? 0;
  const tickLabels = ticks.map(axisFormat);
  const axisW = Math.ceil(Math.max(...tickLabels.map((t) => textWidth(t, 11.5)))) + 12;
  const left = axisW;
  const right = Math.max(left, width - 2);
  const plotW = right - left;
  const slot = plotW / Math.max(1, data.length);
  const lanes = stacked ? 1 : Math.max(1, shown.length);
  const laneGap = lanes > 1 ? 2 : 0;
  const barW = Math.max(
    3,
    Math.floor(
      lanes > 1
        ? Math.min(maxBarWidth * 0.64, (slot * 0.68 - laneGap * (lanes - 1)) / lanes)
        : Math.min(maxBarWidth, slot * 0.56),
    ),
  );
  const groupW = barW * lanes + laneGap * (lanes - 1);
  const radius = 3;
  const y = (v: number) => padTop + plotH - ((v - bottom) / (top - bottom || 1)) * plotH;
  const zeroY = Math.round(y(0));
  const floorY = Math.round(y(bottom));
  const step = labelStep(labels, slot);
  const ticksX = xTicks
    ? fitTicks(xTicks, data, (i) => left + slot * i + slot / 2)
    : visibleTicks(data.length, step);
  if (!xTicks && highlight !== undefined && step > 1) {
    [highlight - 1, highlight + 1].forEach((near) => ticksX.delete(near));
    ticksX.add(highlight);
  }
  const fmtLabel = labelFormat ?? format;
  const bandW = Math.round(Math.min(slot - 4, Math.max(groupW + 16, slot * 0.7)));
  const bandX = (i: number) => Math.round(left + slot * i + (slot - bandW) / 2);

  function fillFor(color: ChartColor, index: number) {
    const tone = palette[color];
    if (appearance === 'tinted')
      return hovered === index || locked === index ? tone.hover : tone.muted;
    if (highlight === undefined || index === highlight || index === locked) return tone.solid;
    return hovered === index ? tone.hover : tone.muted;
  }

  const summaryText = summary ?? barSummary(label, data, shown, format);
  const table = tableOf(data, shown, format);

  let tip: ReactNode = null;
  const datum = current !== null ? data[current] : undefined;
  if (current !== null && datum && node && width > 0) {
    const rows: TooltipRow[] = shown.map((sr) => {
      const v = datum.values[sr.key];
      return {
        key: sr.key,
        label: sr.label,
        value: v == null ? '—' : format(v),
        color: (single && datum.color) || colors.get(sr.key),
        shape: 'square',
      };
    });
    const cx = left + slot * current + slot / 2;
    const markTop = Math.min(zeroY, Math.round(y(tops[current] ?? 0)));
    const at = Math.min(floorY - 8, markTop + 12);
    tip = (
      <FloatingTip
        root={node}
        anchor={() => {
          const r = node.getBoundingClientRect();
          return {
            left: r.left + cx - groupW / 2,
            right: r.left + cx + groupW / 2,
            top: r.top + at,
            bottom: r.top + at,
          };
        }}
      >
        <ChartTooltip
          title={datum.title ?? datum.label}
          rows={rows}
          total={stacked && shown.length > 1 ? { value: format(tops[current] ?? 0) } : undefined}
        />
      </FloatingTip>
    );
  }

  return (
    <div
      ref={ref}
      className={s.chart}
      style={{ height }}
      role="group"
      aria-label={`${label}. ${keyboardHint(lockable)}`}
      data-force={force}
      {...explorer.bind}
    >
      {width > 0 && (
        <svg className={s.svg} width={width} height={height} role="img" aria-label={summaryText}>
          {yLabel && (
            <text className={s.yTitle} x={0} y={11}>
              {yLabel}
            </text>
          )}
          {locked !== null && (
            <rect
              className={s.band}
              data-locked="true"
              x={bandX(locked)}
              y={padTop - 6}
              width={bandW}
              height={floorY - padTop + 6}
              rx="6"
            />
          )}
          {hovered !== null && hovered !== locked && (
            <rect
              className={s.band}
              x={bandX(hovered)}
              y={padTop - 6}
              width={bandW}
              height={floorY - padTop + 6}
              rx="6"
            />
          )}
          <YGrid ticks={ticks} y={y} left={left} right={right} grid={grid} format={axisFormat} />
          <g key={categories} className={s.plot}>
            <g className={s.bars} aria-hidden="true">
              {data.map((d, i) => {
                const x0 = Math.round(left + slot * i + (slot - groupW) / 2);
                if (stacked) {
                  let acc = 0;
                  let first = true;
                  const lastKey = [...shown].reverse().find((sr) => num(d, sr.key) > 0)?.key;
                  return (
                    <g key={d.label}>
                      {series.map((sr) => {
                        const on = !hidden.includes(sr.key);
                        const v = on ? Math.max(0, num(d, sr.key)) : 0;
                        const y1 = Math.round(y(acc));
                        acc += v;
                        const y0 = Math.round(y(acc));
                        let h = y1 - y0;
                        // 1 px de papel entre segmentos.
                        if (v > 0 && !first) h = Math.max(0, h - 1);
                        if (v > 0) first = false;
                        const p = barD(x0, y0, barW, h, sr.key === lastKey ? radius : 0, 0);
                        return (
                          <path
                            key={sr.key}
                            className={s.bar}
                            d={p}
                            style={morph(p, { fill: fillFor(colors.get(sr.key) ?? 'gray', i) })}
                          />
                        );
                      })}
                    </g>
                  );
                }
                return (
                  <g key={d.label}>
                    {shown.map((sr, lane) => {
                      const v = d.values[sr.key];
                      if (v == null) return null;
                      const color = (single && d.color) || colors.get(sr.key) || 'gray';
                      const bx = x0 + lane * (barW + laneGap);
                      const vy = Math.round(y(v));
                      const p =
                        v >= 0
                          ? barD(bx, vy, barW, zeroY - vy, radius, 0)
                          : barD(bx, zeroY, barW, vy - zeroY, 0, radius);
                      return (
                        <g key={sr.key}>
                          <path
                            className={s.bar}
                            d={p}
                            style={morph(p, { fill: fillFor(color, i) })}
                          />
                          {appearance === 'tinted' && v > 0 && zeroY - vy > 2 && (
                            <rect
                              x={bx}
                              y={vy}
                              width={barW}
                              height="2"
                              rx="1"
                              style={{ fill: palette[color].solid }}
                            />
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </g>
            {values !== 'none' && (
              <g aria-hidden="true">
                {data.map((d, i) => {
                  if (values === 'highlight' && i !== highlight) return null;
                  if (!stacked && lanes > 1) {
                    return shown.map((sr, lane) => {
                      const v = d.values[sr.key];
                      if (v == null) return null;
                      const x0 = Math.round(left + slot * i + (slot - groupW) / 2);
                      return (
                        <text
                          key={`${d.label}-${sr.key}`}
                          className={s.valueText}
                          x={x0 + lane * (barW + laneGap) + barW / 2}
                          y={v >= 0 ? y(v) - 8 : y(v) + 16}
                          textAnchor="middle"
                        >
                          {fmtLabel(v)}
                        </text>
                      );
                    });
                  }
                  const total = stacked ? (tops[i] ?? 0) : (d.values[shown[0]?.key ?? ''] ?? 0);
                  if (!total && !stacked) return null;
                  return (
                    <text
                      key={d.label}
                      className={s.valueText}
                      data-strong={i === highlight || undefined}
                      x={left + slot * i + slot / 2}
                      y={total >= 0 ? y(Math.max(0, total)) - 8 : y(total) + 16}
                      textAnchor="middle"
                    >
                      {fmtLabel(total)}
                    </text>
                  );
                })}
              </g>
            )}
            <g aria-hidden="true">
              {data.map((d, i) =>
                ticksX.has(i) ? (
                  <text
                    key={d.label}
                    className={s.xText}
                    data-active={i === current || undefined}
                    data-strong={i === highlight || i === locked || undefined}
                    x={left + slot * i + slot / 2}
                    y={floorY + 18}
                    textAnchor="middle"
                  >
                    {d.label}
                  </text>
                ) : null,
              )}
            </g>
          </g>
          <g>
            {data.map((d, i) => (
              <rect
                key={d.label}
                className={s.hit}
                x={left + slot * i}
                y={0}
                width={slot}
                height={height}
                onPointerEnter={() => explorer.point(i)}
                onClick={() => explorer.toggle(i)}
              />
            ))}
          </g>
        </svg>
      )}
      {tip}
      <SrTable caption={label} head={table.head} rows={table.rows} />
      <Live>
        {explorer.keyboard && current !== null
          ? `${announce(data[current], shown, format)}${locked === current ? '. Fixado' : ''}`
          : ''}
      </Live>
    </div>
  );
}

function HorizontalBars({
  label,
  data,
  series,
  layout = 'grouped',
  highlight,
  format = formatInt,
  axisFormat = formatCompact,
  labelFormat,
  grid = 'dashed',
  hidden = [],
  summary,
  labelWidth = 180,
  normalize = false,
  lockable = true,
  pinned,
  forceActive,
  'data-force': force,
}: BarChartProps) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  useReady(node);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shown = series.filter((sr) => !hidden.includes(sr.key));
  const colors = new Map(series.map((sr, i) => [sr.key, seriesColor(sr, i)] as const));
  const stacked = layout === 'stacked' && series.length > 1;
  const single = shown.length === 1;
  const explorer = useExplorer(data.length, highlight ?? 0, {
    lockable,
    force: forceActive,
    pinned,
    keys: data.map((d) => d.label),
    root: node,
  });
  const { current, hovered, locked } = explorer;
  const totals = data.map((d) =>
    stacked
      ? shown.reduce((sum, sr) => sum + Math.max(0, d.values[sr.key] ?? 0), 0)
      : Math.max(0, ...shown.map((sr) => d.values[sr.key] ?? 0)),
  );
  const percent = stacked && normalize;
  /* Trilha de 200–400 px: até 4 marcas, para os rótulos não colarem. */
  const ticks = percent ? [0, 25, 50, 75, 100] : niceTicks(Math.max(0, ...totals), 0, [3, 4]);
  const top = ticks[ticks.length - 1] ?? 1;
  const fmtLabel = labelFormat ?? format;
  const ratio = (v: number) => Math.max(0, Math.min(1, v / top));
  const w = (v: number) => `calc((100% - var(--value-room)) * ${ratio(v).toFixed(4)})`;
  const summaryText = summary ?? barSummary(label, data, shown, format);
  const table = tableOf(data, shown, format);
  const tickText = percent ? (v: number) => formatPct(v, 0) : axisFormat;

  function fill(color: ChartColor, index: number) {
    const tone = palette[color];
    if (highlight === undefined || index === highlight || index === locked) return tone.solid;
    return hovered === index ? tone.hover : tone.muted;
  }

  let tip: ReactNode = null;
  const datum = current !== null ? data[current] : undefined;
  if (current !== null && datum && node) {
    const index = current;
    const total = totals[index] ?? 0;
    const rows: TooltipRow[] = shown.map((sr) => {
      const v = datum.values[sr.key];
      return {
        key: sr.key,
        label: sr.label,
        value: v == null ? '—' : format(v),
        share: percent && v != null && total ? formatPct((v / total) * 100, 0) : undefined,
        color: (single && datum.color) || colors.get(sr.key),
        shape: 'square',
      };
    });
    tip = (
      <FloatingTip
        root={node}
        placement="above"
        anchor={() => {
          const row = rowRefs.current[index];
          if (!row) return null;
          const r = row.getBoundingClientRect();
          const bar = row.querySelector('[data-bar]')?.getBoundingClientRect();
          const end = bar ? bar.right : r.left + r.width / 2;
          return { left: end, right: end, top: r.top + 4, bottom: r.bottom - 4 };
        }}
      >
        <ChartTooltip
          title={datum.title ?? datum.label}
          rows={rows}
          total={stacked && shown.length > 1 ? { value: format(total) } : undefined}
        />
      </FloatingTip>
    );
  }

  return (
    <div
      ref={setNode}
      className={s.hchart}
      style={{ '--label-w': `min(${labelWidth}px, 40%)` } as CSSProperties}
      role="group"
      aria-label={`${label}. ${keyboardHint(lockable)}`}
      data-force={force}
      {...explorer.bind}
    >
      <div className={s.hgrid} aria-hidden="true">
        {ticks.map((tick, index) =>
          index === 0 || grid !== 'none' ? (
            <svg key={tick} className={s.hgridLine} style={{ left: w(tick) }}>
              <line
                className={s.gridLine}
                data-base={index === 0 || undefined}
                data-dashed={index > 0 && grid === 'dashed' ? true : undefined}
                x1="0.5"
                x2="0.5"
                y1="0"
                y2="100%"
              />
            </svg>
          ) : null,
        )}
      </div>
      <div className={s.hrows} role="img" aria-label={summaryText}>
        {data.map((d, i) => {
          const total = totals[i] ?? 0;
          let first = true;
          const lastKey = [...shown].reverse().find((sr) => (d.values[sr.key] ?? 0) > 0)?.key;
          return (
            <div
              key={d.label}
              ref={(el) => {
                rowRefs.current[i] = el;
              }}
              className={s.hrow}
              data-active={hovered === i || undefined}
              data-locked={locked === i || undefined}
              data-tall={d.detail ? true : undefined}
              data-group={!stacked && shown.length > 1 ? true : undefined}
              onPointerEnter={() => explorer.point(i)}
              onClick={() => explorer.toggle(i)}
              aria-hidden="true"
            >
              <span className={s.hlabel} title={d.title ?? d.label}>
                {d.lead && <span className={s.hlead}>{d.lead}</span>}
                <span className={s.htext}>
                  <span className={s.hname} data-strong={i === highlight || undefined}>
                    {d.label}
                  </span>
                  {d.detail && <span className={s.hdetail}>{d.detail}</span>}
                </span>
              </span>
              {stacked ? (
                <span className={s.htrack}>
                  <span
                    className={s.hstack}
                    data-bar
                    style={{ width: percent ? (total ? w(100) : 0) : w(total) }}
                  >
                    {series.map((sr) => {
                      const v = hidden.includes(sr.key) ? 0 : Math.max(0, d.values[sr.key] ?? 0);
                      const gap = v > 0 && !first;
                      if (v > 0) first = false;
                      return (
                        <i
                          key={sr.key}
                          className={s.hseg}
                          data-on={v > 0 || undefined}
                          data-gap={gap || undefined}
                          data-end={sr.key === lastKey || undefined}
                          style={{ flexGrow: v, background: fill(colors.get(sr.key) ?? 'gray', i) }}
                        />
                      );
                    })}
                  </span>
                  <span className={s.hvalue} data-strong={i === highlight || undefined}>
                    {fmtLabel(total)}
                  </span>
                </span>
              ) : (
                <span className={s.hlanes}>
                  {shown.map((sr, lane) => {
                    const v = d.values[sr.key];
                    const color = (single && d.color) || colors.get(sr.key) || 'gray';
                    return (
                      <span
                        key={sr.key}
                        className={s.htrack}
                        data-lanes={shown.length > 1 || undefined}
                      >
                        <i
                          className={s.hbar}
                          data-bar={lane === 0 || undefined}
                          style={{ width: v ? w(v) : 0, background: fill(color, i) }}
                        />
                        <span className={s.hvalue} data-strong={i === highlight || undefined}>
                          {v == null ? '—' : fmtLabel(v)}
                        </span>
                      </span>
                    );
                  })}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className={s.haxis} aria-hidden="true">
        {ticks.map((tick) => (
          <span key={tick} style={{ left: w(tick) }}>
            {tickText(tick)}
          </span>
        ))}
      </div>
      {tip}
      <SrTable caption={label} head={table.head} rows={table.rows} />
      <Live>
        {explorer.keyboard && current !== null
          ? `${announce(data[current], shown, format)}${locked === current ? '. Fixado' : ''}`
          : ''}
      </Live>
    </div>
  );
}

/* ——————————————————————————— Medidor (barras de participação) ——————————————————————————— */

export type MeterItem = {
  key: string;
  label: string;
  value: number;
  /** Participação, 0–100. */
  share: number;
  /** Alocação planejada, 0–100: um traço fino atravessa a trilha. */
  plan?: number;
  /** Legenda com os números de apoio (“1.026 cliques · CTR 2,08%”). */
  caption?: ReactNode;
  color?: ChartColor;
  /** Sem dado (não é zero): o valor sai "—" e a trilha fica vazia. */
  empty?: boolean;
};

/**
 * Barras de participação do Analytics aprovado (“Por canal”): nome, valor, %, trilha de 6 px.
 * Quando o valor já é a razão (cumprimento, conversão), `shares={false}` tira o % repetido.
 */
export function MeterList({
  label,
  items,
  format = formatInt,
  shares = true,
}: {
  label: string;
  items: MeterItem[];
  format?: (value: number) => string;
  /** Mostra a participação (%) ao lado do valor. */
  shares?: boolean;
}) {
  return (
    <ol className={s.meters} aria-label={label}>
      {items.map((item) => (
        <li key={item.key} className={s.meter}>
          <div className={s.meterHead}>
            <span className={s.meterName}>{item.label}</span>
            <span className={s.meterValue}>
              <b>{item.empty ? '—' : format(item.value)}</b>
              {shares && !item.empty && <span>{formatPct(item.share)}</span>}
            </span>
          </div>
          <span className={s.meterTrack} aria-hidden="true">
            <i
              style={{
                width: `${item.empty ? 0 : clamp(item.share, 0, 100)}%`,
                background: item.color ? palette[item.color].solid : undefined,
              }}
            />
            {item.plan !== undefined && (
              <span className={s.meterPlan} style={{ left: `${clamp(item.plan, 0, 100)}%` }} />
            )}
          </span>
          {item.caption && <span className={s.meterCaption}>{item.caption}</span>}
        </li>
      ))}
    </ol>
  );
}

/* ——————————————————————————— Linhas e área ——————————————————————————— */

export type TooltipContent = {
  title?: ReactNode;
  rows?: TooltipRow[];
  total?: { label?: string; value: string };
  delta?: TooltipDelta;
};

export type LineChartProps = {
  label: string;
  data: ChartDatum[];
  series: ChartSeries[];
  height?: number;
  /** Preenche a área sob as séries contínuas (não tracejadas). Chapada. */
  area?: boolean;
  curve?: 'smooth' | 'linear';
  format?: (value: number) => string;
  axisFormat?: (value: number) => string;
  grid?: Grid;
  hidden?: string[];
  summary?: string;
  /** Linha de referência horizontal (meta, contratado, ritmo). */
  reference?: { value: number; label: string; align?: 'start' | 'end' };
  /** Marca o último ponto real de cada série contínua visível (tracejadas são referência). */
  markLast?: boolean;
  /** Domínio do eixo Y. Por padrão começa em zero (fora disso, um corte marca o eixo). */
  min?: number;
  max?: number;
  /**
   * Índices dos rótulos do eixo X, quando o calendário pede marcas redondas
   * (dias 1, 5, 10… ou o início de cada mês). Sem isso, o espaçamento é automático.
   */
  xTicks?: number[];
  /** Áreas empilhadas (até 3 séries): faixa clara da série + linha no topo. */
  stacked?: boolean;
  /** Último índice real: depois dele a linha é tracejada e a área mais clara (previsão, parcial). */
  forecastFrom?: number;
  /** Linha vertical de referência no tempo (“Hoje”). */
  marker?: { index: number; label: string };
  /** Rótulo no fim de cada linha, no lugar da legenda (abaixo de 440 px vira legenda no topo). */
  endLabels?: boolean;
  /** Título do eixo Y, em legenda no alto à esquerda (nunca girado). */
  yLabel?: string;
  /** Conteúdo extra do tooltip (acumulado, total, variação). */
  tooltip?: (index: number, rows: TooltipRow[]) => TooltipContent;
  /** Índice desenhado como em hover (pranchas). */
  forceActive?: number;
  /** Estado parado para pranchas (`focus`). Nunca no produto. */
  'data-force'?: string;
};

type Pt = { x: number; y: number };

/** Curva monótona (Fritsch–Carlson): suave sem inventar picos entre os pontos. */
function monotone(points: Pt[]) {
  const n = points.length;
  const first = points[0];
  if (!first) return '';
  if (n === 1) return `M${f2(first.x)} ${f2(first.y)}`;
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const a = points[i] as Pt;
    const b = points[i + 1] as Pt;
    dx[i] = b.x - a.x;
    m[i] = (b.y - a.y) / (b.x - a.x || 1);
  }
  const t: number[] = new Array(n).fill(0);
  t[0] = m[0] ?? 0;
  t[n - 1] = m[n - 2] ?? 0;
  for (let i = 1; i < n - 1; i++) {
    const m0 = m[i - 1] ?? 0;
    const m1 = m[i] ?? 0;
    const d0 = dx[i - 1] ?? 1;
    const d1 = dx[i] ?? 1;
    t[i] = m0 * m1 <= 0 ? 0 : (3 * (d0 + d1)) / ((2 * d1 + d0) / m0 + (d1 + 2 * d0) / m1);
  }
  let d = `M${f2(first.x)} ${f2(first.y)}`;
  for (let i = 0; i < n - 1; i++) {
    const a = points[i] as Pt;
    const b = points[i + 1] as Pt;
    const h = (dx[i] ?? 0) / 3;
    d += `C${f2(a.x + h)} ${f2(a.y + (t[i] ?? 0) * h)} ${f2(b.x - h)} ${f2(b.y - (t[i + 1] ?? 0) * h)} ${f2(b.x)} ${f2(b.y)}`;
  }
  return d;
}

const linear = (points: Pt[]) =>
  points.map((p, i) => `${i === 0 ? 'M' : 'L'}${f2(p.x)} ${f2(p.y)}`).join('');

type Piece = { from: number; to: number; dashed: boolean };

/** Linhas multissérie com área opcional, linha-guia vertical e tooltip com todas as séries. */
export function LineChart({
  label,
  data,
  series,
  height = 260,
  area = false,
  curve = 'smooth',
  format = formatInt,
  axisFormat = formatCompact,
  grid = 'dashed',
  hidden = [],
  summary,
  reference,
  markLast = true,
  min,
  max,
  xTicks,
  stacked = false,
  forecastFrom,
  marker,
  endLabels = false,
  yLabel,
  tooltip,
  forceActive,
  'data-force': force,
}: LineChartProps) {
  const [ref, width, node] = useWidth<HTMLDivElement>();
  useReady(node);
  const shown = series.filter((sr) => !hidden.includes(sr.key));
  const colors = new Map(series.map((sr, i) => [sr.key, seriesColor(sr, i)] as const));
  const n = data.length;
  const today =
    forecastFrom !== undefined && forecastFrom >= 0 && forecastFrom < n - 1
      ? forecastFrom
      : undefined;
  // Toque: a dica fica depois que o dedo sai e some num toque fora do gráfico (useExplorer).
  const explorer = useExplorer(n, today ?? n - 1, {
    force: forceActive,
    keys: data.map((d) => d.label),
    root: node,
  });
  const { current: active, point } = explorer;
  const pointing = explorer.pointer;
  const [pointerY, setPointerY] = useState<number | null>(null);

  /* Empilhamento: topo e base de cada série. */
  const stack = stacked && shown.length > 1;
  const cum = new Map<string, { top: (number | null)[]; base: number[] }>();
  if (stack) {
    const acc = data.map(() => 0);
    for (const sr of shown) {
      const base = acc.slice();
      const topValues = data.map((d, i) => {
        const v = d.values[sr.key];
        if (v == null) return null;
        acc[i] = (acc[i] ?? 0) + v;
        return acc[i] ?? 0;
      });
      cum.set(sr.key, { top: topValues, base });
    }
  }
  const plotValue = (key: string, i: number): number | null =>
    stack ? (cum.get(key)?.top[i] ?? null) : (data[i]?.values[key] ?? null);

  const all: number[] = [];
  data.forEach((_, i) =>
    shown.forEach((sr) => {
      const v = plotValue(sr.key, i);
      if (v != null) all.push(v);
    }),
  );
  const lo = min ?? 0;
  // A referência nunca encosta no topo: sobra espaço para o rótulo dela acima da linha.
  const hi = max ?? Math.max(reference ? reference.value * 1.06 : 0, ...all, lo + 1);
  /* Rótulos no fim das linhas apertam o gráfico estreito: abaixo de 440 px viram legenda no topo. */
  const endsAsLegend = endLabels && width > 0 && width < 440;
  const padTop = marker || yLabel ? 32 : 14;
  const axisH = 28;
  const plotH = Math.max(10, height - padTop - axisH);
  const ticks = niceTicks(hi, lo, undefined, tickLimit(plotH));
  const top = ticks[ticks.length - 1] ?? hi;
  const bottom = ticks[0] ?? lo;
  const tickLabels = ticks.map(axisFormat);
  const axisW = Math.ceil(Math.max(...tickLabels.map((t) => textWidth(t, 11.5)))) + 12;
  const endW =
    endLabels && !endsAsLegend
      ? Math.ceil(Math.max(0, ...shown.map((sr) => textWidth(sr.label, 11.5)))) + 18
      : 0;
  const left = axisW;
  const right = Math.max(left + 20, width - 2 - endW);
  const inset = 10;
  const stepX = n > 1 ? (right - left - inset * 2) / (n - 1) : 0;
  const x = (i: number) => left + inset + stepX * i;
  const y = (v: number) => padTop + plotH - ((v - bottom) / (top - bottom || 1)) * plotH;
  const baseY = Math.round(y(bottom));
  const every = labelStep(
    data.map((d) => d.label),
    stepX || right - left,
  );
  const ticksX = xTicks ? fitTicks(xTicks, data, x) : visibleTicks(n, every);
  const draw = curve === 'smooth' ? monotone : linear;

  function piecesOf(key: string): Piece[] {
    const out: Piece[] = [];
    let start = -1;
    const flush = (end: number) => {
      if (start < 0) return;
      if (today === undefined || today >= end) out.push({ from: start, to: end, dashed: false });
      else if (today <= start) out.push({ from: start, to: end, dashed: true });
      else {
        out.push({ from: start, to: today, dashed: false });
        out.push({ from: today, to: end, dashed: true });
      }
      start = -1;
    };
    for (let i = 0; i < n; i++) {
      if (plotValue(key, i) == null) flush(i - 1);
      else if (start < 0) start = i;
    }
    flush(n - 1);
    return out;
  }
  const pointsOf = (key: string, piece: Piece) => {
    const pts: Pt[] = [];
    for (let i = piece.from; i <= piece.to; i++)
      pts.push({ x: x(i), y: y(plotValue(key, i) ?? 0) });
    return pts;
  };
  const strokeOf = (sr: ChartSeries) => {
    const tone = palette[colors.get(sr.key) ?? 'gray'];
    return sr.faded ? tone.light : tone.solid;
  };

  const summaryText =
    summary ??
    (n
      ? `${label}: ${shown
          .map((sr) => {
            const valued = data.filter((d) => d.values[sr.key] != null);
            const a = valued[0];
            const b = valued[valued.length - 1];
            return a && b
              ? `${sr.label} vai de ${format(a.values[sr.key] ?? 0)} em ${a.title ?? a.label} a ${format(b.values[sr.key] ?? 0)} em ${b.title ?? b.label}`
              : `${sr.label} sem dados`;
          })
          .join('; ')}.`
      : `${label}: sem dados.`);
  const table = tableOf(data, shown, format);
  /* Último ponto real de cada série contínua: todas marcadas, ou nenhuma. */
  const lastPoints = shown
    .filter((sr) => !sr.dashed)
    .map((sr) => {
      const valued = data.reduce((found, d, i) => (d.values[sr.key] != null ? i : found), -1);
      return { sr, index: today !== undefined ? Math.min(today, valued) : valued };
    })
    .filter((item) => item.index >= 0 && plotValue(item.sr.key, item.index) != null);

  /* Rótulos no fim das linhas, afastados quando colam. */
  const ends =
    endLabels && !endsAsLegend
      ? shown
          .map((sr) => {
            let at = -1;
            data.forEach((_, i) => {
              if (plotValue(sr.key, i) != null) at = i;
            });
            return at < 0
              ? null
              : {
                  sr,
                  x: x(at),
                  y: y(plotValue(sr.key, at) ?? 0),
                  ly: y(plotValue(sr.key, at) ?? 0),
                };
          })
          .filter(
            (item): item is { sr: ChartSeries; x: number; y: number; ly: number } => item !== null,
          )
          .sort((a, b) => a.y - b.y)
      : [];
  for (let i = 1; i < ends.length; i++) {
    const prev = ends[i - 1];
    const cur = ends[i];
    if (prev && cur && cur.ly - prev.ly < 15) cur.ly = prev.ly + 15;
  }

  let tip: ReactNode = null;
  const datum = active !== null ? data[active] : undefined;
  if (active !== null && datum && node && width > 0) {
    const index = active;
    const baseRows: TooltipRow[] = shown.map((sr) => {
      const v = datum.values[sr.key];
      return {
        key: sr.key,
        label: sr.label,
        value: v == null ? '—' : format(v),
        color: strokeOf(sr),
        shape: sr.dashed || (today !== undefined && index > today) ? 'dashed' : 'line',
      };
    });
    const custom = tooltip?.(index, baseRows);
    const sum = shown.reduce((acc, sr) => acc + (datum.values[sr.key] ?? 0), 0);
    const ys = shown
      .map((sr) => plotValue(sr.key, index))
      .filter((v): v is number => v != null)
      .map(y);
    const ax = x(index);
    const ay =
      pointing && pointerY !== null ? clamp(pointerY, padTop, baseY) : Math.min(baseY, ...ys);
    tip = (
      <FloatingTip
        root={node}
        anchor={() => {
          // Coordenadas do SVG (a legenda no topo, quando há, fica acima dele).
          const r = (node.querySelector(':scope > svg') ?? node).getBoundingClientRect();
          return { left: r.left + ax, right: r.left + ax, top: r.top + ay, bottom: r.top + ay };
        }}
      >
        <ChartTooltip
          title={custom?.title ?? datum.title ?? datum.label}
          rows={custom?.rows ?? baseRows}
          total={custom?.total ?? (stack ? { value: format(sum) } : undefined)}
          delta={custom?.delta}
        />
      </FloatingTip>
    );
  }

  function onMove(event: ReactPointerEvent<SVGRectElement>) {
    const box = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!box) return;
    // Toque: o dedo cobre o ponto; a dica fica na altura da marca, não do dedo.
    setPointerY(event.pointerType === 'touch' ? null : event.clientY - box.top);
    if (!stepX) return point(0);
    const px = event.clientX - box.left;
    point(clamp(Math.round((px - left - inset) / stepX), 0, n - 1));
  }

  const refY = reference ? Math.round(y(reference.value)) + 0.5 : 0;
  const markerX =
    marker && marker.index >= 0 && marker.index < n ? Math.round(x(marker.index)) + 0.5 : null;

  return (
    <div
      ref={ref}
      className={s.chart}
      // Arrasto horizontal percorre os dias; o vertical continua rolando a página.
      // Com a legenda no topo (rótulos de fim de linha em gráfico estreito), a altura cresce com ela.
      style={{ height: endsAsLegend ? undefined : height, touchAction: 'pan-y' }}
      role="group"
      aria-label={`${label}. ${keyboardHint(false)}`}
      data-force={force}
      {...explorer.bind}
    >
      {endsAsLegend && (
        <div className={s.chartLegend}>
          <Legend
            items={shown.map((sr) => ({
              key: sr.key,
              label: sr.label,
              color: strokeOf(sr),
              shape: sr.dashed ? 'dashed' : 'line',
            }))}
          />
        </div>
      )}
      {width > 0 && (
        <svg className={s.svg} width={width} height={height} role="img" aria-label={summaryText}>
          {yLabel && (
            <text className={s.yTitle} x={0} y={11}>
              {yLabel}
            </text>
          )}
          <YGrid ticks={ticks} y={y} left={left} right={right} grid={grid} format={axisFormat} />
          {bottom > 0 && <AxisBreak x={left + 2} y={baseY + 0.5} />}
          <g aria-hidden="true">
            {area &&
              shown
                .filter((sr) => !sr.dashed)
                .flatMap((sr) =>
                  piecesOf(sr.key)
                    .filter((piece) => piece.to > piece.from)
                    .map((piece) => {
                      const pts = pointsOf(sr.key, piece);
                      const first = pts[0] as Pt;
                      const last = pts[pts.length - 1] as Pt;
                      let path: string;
                      if (stack) {
                        const base: Pt[] = [];
                        for (let i = piece.to; i >= piece.from; i--)
                          base.push({ x: x(i), y: y(cum.get(sr.key)?.base[i] ?? 0) });
                        path = `${draw(pts)}L${draw(base).slice(1)}Z`;
                      } else {
                        path = `${draw(pts)}L${f2(last.x)} ${baseY}L${f2(first.x)} ${baseY}Z`;
                      }
                      const tone = palette[colors.get(sr.key) ?? 'gray'];
                      const opacity = stack
                        ? piece.dashed
                          ? 0.55
                          : 1
                        : piece.dashed
                          ? 0.04
                          : 0.08;
                      return (
                        <path
                          key={`a:${sr.key}:${piece.from}-${piece.to}:${piece.dashed}`}
                          className={s.area}
                          d={path}
                          style={morph(path, {
                            fill: stack ? tone.muted : tone.solid,
                            fillOpacity: opacity,
                          })}
                        />
                      );
                    }),
                )}
          </g>
          {reference && (
            <g className={s.ref} style={{ transform: `translateY(${refY}px)` }} aria-hidden="true">
              <line className={s.refLine} x1={left} x2={right} y1={0} y2={0} />
            </g>
          )}
          {markerX !== null && marker && (
            <g aria-hidden="true">
              <line className={s.markerLine} x1={markerX} x2={markerX} y1={padTop - 6} y2={baseY} />
              <text
                className={s.markerText}
                x={markerX}
                y={padTop - 12}
                textAnchor={markerX < left + 20 ? 'start' : markerX > right - 20 ? 'end' : 'middle'}
              >
                {marker.label}
              </text>
            </g>
          )}
          <g aria-hidden="true">
            {[...shown].reverse().flatMap((sr) =>
              piecesOf(sr.key).map((piece) => {
                const path = draw(pointsOf(sr.key, piece));
                return (
                  <path
                    key={`l:${sr.key}:${piece.from}-${piece.to}:${piece.dashed}`}
                    className={s.line}
                    d={path}
                    style={morph(path, { stroke: strokeOf(sr) })}
                    strokeDasharray={sr.dashed || piece.dashed ? '4 4' : undefined}
                  />
                );
              }),
            )}
          </g>
          {reference?.label && (
            <g className={s.ref} style={{ transform: `translateY(${refY}px)` }} aria-hidden="true">
              <text
                key={reference.label}
                className={s.refText}
                x={reference.align === 'start' ? left + 8 : right - 2}
                y={refY - padTop < 18 ? 15 : -7}
                textAnchor={reference.align === 'start' ? 'start' : 'end'}
              >
                {reference.label}
              </text>
            </g>
          )}
          {active !== null && datum && (
            <g aria-hidden="true">
              <line
                className={s.crosshair}
                x1={Math.round(x(active)) + 0.5}
                x2={Math.round(x(active)) + 0.5}
                y1={padTop - 6}
                y2={baseY}
              />
              {shown.map((sr) => {
                const v = plotValue(sr.key, active);
                if (v == null) return null;
                const stroke = strokeOf(sr);
                const hollow = sr.dashed || (today !== undefined && active > today);
                return (
                  <circle
                    key={sr.key}
                    className={s.dot}
                    cx={x(active)}
                    cy={y(v)}
                    r="4"
                    style={{
                      fill: hollow ? 'var(--paper)' : stroke,
                      stroke: hollow ? stroke : undefined,
                    }}
                    data-hollow={hollow || undefined}
                  />
                );
              })}
            </g>
          )}
          {markLast &&
            (!endLabels || endsAsLegend) &&
            active === null &&
            lastPoints.map(({ sr, index }) => (
              <circle
                key={sr.key}
                className={s.endDot}
                cx={x(index)}
                cy={y(plotValue(sr.key, index) ?? 0)}
                r="4"
                style={{ stroke: strokeOf(sr) }}
                aria-hidden="true"
              />
            ))}
          {ends.map((item) => (
            <g key={item.sr.key} aria-hidden="true">
              <circle
                cx={item.x}
                cy={item.y}
                r="3"
                className={s.endMark}
                style={{ fill: strokeOf(item.sr) }}
              />
              <text
                className={s.endLabel}
                x={item.x + 10}
                y={item.ly}
                dominantBaseline="central"
                style={{ fill: palette[colors.get(item.sr.key) ?? 'gray'].ink }}
              >
                {item.sr.label}
              </text>
            </g>
          ))}
          <g aria-hidden="true">
            {data.map((d, i) => {
              if (!ticksX.has(i)) return null;
              const tx = x(i);
              const w = textWidth(d.label, 11.5) / 2;
              return (
                <text
                  key={`${d.label}-${i}`}
                  className={s.xText}
                  data-active={i === active || undefined}
                  x={clamp(tx, w, width - w)}
                  y={baseY + 18}
                  textAnchor="middle"
                >
                  {d.label}
                </text>
              );
            })}
          </g>
          <rect
            className={s.hit}
            x={left}
            y={0}
            width={Math.max(0, right - left)}
            height={height}
            onPointerMove={onMove}
            onPointerEnter={onMove}
            onPointerDown={onMove}
          />
        </svg>
      )}
      {tip}
      <SrTable caption={label} head={table.head} rows={table.rows} />
      <Live>
        {explorer.keyboard && active !== null ? announce(data[active], shown, format) : ''}
      </Live>
    </div>
  );
}

/* ——————————————————————————— Rosca ——————————————————————————— */

export type DonutDatum = { key: string; label: string; value: number; color?: ChartColor };

export type DonutChartProps = {
  label: string;
  data: DonutDatum[];
  /** Diâmetro em px. */
  size?: number;
  thickness?: number;
  /** Espaço entre segmentos, em px. */
  gap?: number;
  /** Arcos sólidos, ou em dois tons (faixa clara + fio escuro). */
  variant?: 'solid' | 'duo';
  centerLabel?: string;
  /** Substitui o total formatado no centro. */
  centerValue?: string;
  format?: (value: number) => string;
  legend?: 'right' | 'bottom' | 'none';
  /** Colunas da legenda. Em cartões estreitos, só o percentual dá espaço ao nome. */
  legendColumns?: 'both' | 'share' | 'value';
  summary?: string;
  /** Fatia desenhada como em hover (pranchas). */
  forceActive?: number;
  /** Fatia já fixada ao montar. */
  pinned?: number;
  /** Estado parado para pranchas (`focus` vai à linha da legenda em `forceActive`). */
  'data-force'?: string;
};

/**
 * Rosca com pontas arredondadas e respiro entre segmentos; total no centro; legenda com valor e
 * %. Hover numa fatia ou linha da legenda engrossa a fatia (+2 px), esmaece as outras e troca o
 * centro. As linhas da legenda são o caminho do teclado (Enter fixa).
 */
export function DonutChart({
  label,
  data,
  size = 200,
  thickness,
  gap = 5,
  variant = 'solid',
  centerLabel = 'Total',
  centerValue,
  format = formatInt,
  legend = 'right',
  legendColumns = 'both',
  summary,
  forceActive,
  pinned,
  'data-force': force,
}: DonutChartProps) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  useReady(node);
  const items = data.map((d, i) => ({
    ...d,
    tone: d.color ?? chartPalette[i] ?? ('gray' as ChartColor),
  }));
  const total = items.reduce((sum, d) => sum + Math.max(0, d.value), 0);
  const explorer = useExplorer(items.length, 0, {
    lockable: true,
    force: forceActive,
    pinned,
    keys: items.map((d) => d.key),
    root: node,
  });
  const { current: active, locked } = explorer;
  const stroke = thickness ?? Math.max(8, Math.round(size * 0.1));
  const r = (size - stroke) / 2 - 1 - (variant === 'duo' ? 1 : 0);
  const c = size / 2;
  const share = (v: number) => (total ? (v / total) * 100 : 0);
  const pt = (a: number, rad: number) => [c + rad * Math.cos(a), c + rad * Math.sin(a)] as const;
  const arc = (a0: number, a1: number, rad: number) => {
    const [x0, y0] = pt(a0, rad);
    const [x1, y1] = pt(a1, rad);
    return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${rad} ${rad} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  };
  const positive = items.filter((d) => d.value > 0);
  const multi = positive.length > 1;
  const capAngle = stroke / 2 / r;
  const gapAngle = gap / r;
  const TAU = Math.PI * 2;
  /*
   * Tamanho mínimo de fatia no desenho: uma fatia de 0,6% não cabe nem a ponta redonda. A fatia
   * mínima ganha o espaço de um ponto (mais o respiro), tirado das maiores. Legenda, centro e
   * tabela seguem exatos.
   */
  const raw = items.map((d) => (total ? (Math.max(0, d.value) / total) * TAU : 0));
  const minSpan = multi ? ((variant === 'duo' ? 10 : stroke) + gap) / r : 0;
  const boost = raw.reduce((sum, v) => sum + (v > 0 && v < minSpan ? minSpan - v : 0), 0);
  const large = raw.reduce((sum, v) => sum + (v >= minSpan ? v : 0), 0);
  const spans =
    boost > 0 && large > boost * 2
      ? raw.map((v) => (v > 0 && v < minSpan ? minSpan : v * (1 - boost / large)))
      : raw;
  let cursor = -Math.PI / 2;
  const segments = items.map((d, i) => {
    const span = spans[i] ?? 0;
    const a0 = cursor;
    cursor += span;
    const pad = multi ? capAngle + gapAngle / 2 : 0;
    let s0 = a0 + pad;
    let s1 = a0 + span - pad;
    if (s1 <= s0) {
      const middle = a0 + span / 2;
      s0 = middle - 0.0005;
      s1 = middle + 0.0005;
    }
    return { ...d, a0, a1: a0 + span, s0, s1, span };
  });
  /* Dois tons: faixa clara como setor com cantos de 4 px; o fio escuro corre na borda externa. */
  const thin = 3;
  const rOut = r + stroke / 2;
  const rIn = r - stroke / 2;
  const clipBase = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const P = (a: number, rad: number) => {
    const [px, py] = pt(a, rad);
    return `${px.toFixed(2)} ${py.toFixed(2)}`;
  };
  const sector = (a0: number, a1: number) => {
    const half = multi ? gap / 2 : 0;
    const o0 = a0 + half / rOut;
    const o1 = a1 - half / rOut;
    const i0 = a0 + half / rIn;
    const i1 = a1 - half / rIn;
    const len = Math.min((o1 - o0) * rOut, (i1 - i0) * rIn);
    const rc = Math.max(0, Math.min(4, len / 2, stroke / 2));
    const t = rc / stroke;
    const big = (v: number) => (v > Math.PI ? 1 : 0);
    return [
      `M${P(o0 + rc / rOut, rOut)}`,
      `A${rOut} ${rOut} 0 ${big(o1 - o0)} 1 ${P(o1 - rc / rOut, rOut)}`,
      `A${rc} ${rc} 0 0 1 ${P(o1 + (i1 - o1) * t, rOut - rc)}`,
      `L${P(i1 + (o1 - i1) * t, rIn + rc)}`,
      `A${rc} ${rc} 0 0 1 ${P(i1 - rc / rIn, rIn)}`,
      `A${rIn} ${rIn} 0 ${big(i1 - i0)} 0 ${P(i0 + rc / rIn, rIn)}`,
      `A${rc} ${rc} 0 0 1 ${P(i0 + (o0 - i0) * t, rIn + rc)}`,
      `L${P(o0 + (i0 - o0) * t, rOut - rc)}`,
      `A${rc} ${rc} 0 0 1 ${P(o0 + rc / rOut, rOut)}Z`,
    ].join('');
  };
  const focus = active !== null ? items[active] : undefined;
  const centerText = focus ? format(focus.value) : total ? (centerValue ?? format(total)) : '—';
  const inner = (size - stroke * 2) * 0.76;
  const base = size >= 200 ? 22 : size >= 150 ? 18 : size >= 110 ? 16 : size >= 90 ? 14 : 12;
  const valueSize = Math.max(
    11.5,
    Math.min(base, Math.floor((inner / textWidth(centerText, 1)) * 10) / 10),
  );
  const summaryText =
    summary ??
    (total
      ? `${label}: total ${centerValue ?? format(total)}. ${items
          .map((d) => `${d.label} ${format(d.value)} (${formatPct(share(d.value))})`)
          .join('; ')}.`
      : `${label}: sem dados.`);
  const keyboardOnFigure = legend === 'none';

  function onRowKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const list = event.currentTarget.closest('ul');
    const buttons = list ? Array.from(list.querySelectorAll<HTMLButtonElement>('button')) : [];
    let next = -1;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight')
      next = Math.min(buttons.length - 1, index + 1);
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = Math.max(0, index - 1);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = buttons.length - 1;
    else if (event.key === 'Escape' && locked !== null) {
      event.preventDefault();
      explorer.toggle(locked);
      return;
    }
    if (next < 0) return;
    event.preventDefault();
    buttons[next]?.focus();
  }

  return (
    <div
      ref={setNode}
      className={s.donut}
      data-legend={legend}
      data-active={active !== null || undefined}
      onPointerDownCapture={explorer.capture}
    >
      <div
        className={s.donutFigure}
        style={{ width: size, height: size }}
        role="group"
        aria-label={`${label}.${keyboardOnFigure ? ` ${keyboardHint(true)}` : ''}`}
        data-force={keyboardOnFigure ? force : undefined}
        {...(keyboardOnFigure ? explorer.bind : { onPointerLeave: explorer.leave })}
      >
        <svg width={size} height={size} role="img" aria-label={summaryText} className={s.donutSvg}>
          {total === 0 || positive.length <= 1 ? (
            <circle
              cx={c}
              cy={c}
              r={r}
              fill="none"
              className={s.seg}
              data-active={(active !== null && positive.length === 1) || undefined}
              onPointerEnter={() => {
                const only = items.findIndex((d) => d.value > 0);
                if (only >= 0) explorer.point(only);
              }}
              style={{
                strokeWidth: active !== null && total > 0 ? stroke + 2 : stroke,
                stroke:
                  total === 0
                    ? 'var(--g-100)'
                    : variant === 'duo'
                      ? palette[positive[0]?.tone ?? 'gray'].soft
                      : palette[positive[0]?.tone ?? 'gray'].solid,
              }}
            />
          ) : (
            segments.map((seg, i) =>
              seg.value > 0 ? (
                <g
                  key={seg.key}
                  className={s.seg}
                  data-active={active === i || undefined}
                  onPointerEnter={() => explorer.point(i)}
                  onClick={() => explorer.toggle(i)}
                >
                  {variant === 'duo' ? (
                    <>
                      <clipPath id={`${clipBase}-${i}`}>
                        <path d={sector(seg.a0, seg.a1)} />
                      </clipPath>
                      <path d={sector(seg.a0, seg.a1)} style={{ fill: palette[seg.tone].soft }} />
                      <path
                        d={arc(seg.a0, seg.a1, rOut - thin / 2)}
                        fill="none"
                        strokeWidth={thin}
                        clipPath={`url(#${clipBase}-${i})`}
                        style={{ stroke: palette[seg.tone].solid }}
                      />
                    </>
                  ) : (
                    <path
                      d={arc(seg.s0, seg.s1, r)}
                      fill="none"
                      strokeLinecap="round"
                      style={{
                        stroke: palette[seg.tone].solid,
                        strokeWidth: active === i ? stroke + 2 : stroke,
                      }}
                    />
                  )}
                </g>
              ) : null,
            )
          )}
          {variant === 'duo' && total > 0 && positive.length === 1 && (
            <circle
              cx={c}
              cy={c}
              r={rOut - thin / 2}
              fill="none"
              strokeWidth={thin}
              style={{ stroke: palette[positive[0]?.tone ?? 'gray'].solid }}
            />
          )}
        </svg>
        <div className={s.donutCenter} aria-hidden="true">
          <span key={centerText} className={s.donutValue} style={{ fontSize: valueSize }}>
            {centerText}
          </span>
          <span
            key={focus?.key ?? 'total'}
            className={s.donutLabel}
            data-small={size < 130 || undefined}
            style={{ maxWidth: inner }}
          >
            {focus ? focus.label : centerLabel}
          </span>
        </div>
      </div>
      {legend !== 'none' && (
        <ul className={s.dlegend} data-columns={legendColumns} aria-label={`${label}: legenda`}>
          {items.map((d, i) => (
            <li key={d.key}>
              <button
                type="button"
                className={s.dlegendRow}
                data-active={active === i || undefined}
                data-force={forceActive === i ? force : undefined}
                aria-pressed={locked === i}
                onPointerEnter={() => explorer.point(i)}
                onPointerLeave={explorer.leave}
                onFocus={(event) => {
                  if (event.currentTarget.matches(':focus-visible')) explorer.focusAt(i);
                }}
                onBlur={() => explorer.point(null)}
                onClick={() => explorer.toggle(i)}
                onKeyDown={(event) => onRowKey(event, i)}
              >
                <ChartKey color={d.tone} shape="dot" />
                <span className={s.dlegendLabel} title={d.label}>
                  {d.label}
                </span>
                {legendColumns !== 'share' && (
                  <span className={s.dlegendValue}>{total ? format(d.value) : '—'}</span>
                )}
                {legendColumns !== 'value' && (
                  <span className={s.dlegendShare}>{total ? formatPct(share(d.value)) : '—'}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      <SrTable
        caption={label}
        head={['Item', 'Valor', 'Participação']}
        rows={items.map((d) => [d.label, format(d.value), formatPct(share(d.value))])}
      />
      <Live>
        {explorer.keyboard && focus
          ? `${focus.label}: ${format(focus.value)}, ${formatPct(share(focus.value))} do total${locked === active ? '. Fixado' : ''}`
          : ''}
      </Live>
    </div>
  );
}

/** Rosca pequena de progresso (48 px) para acompanhar uma métrica: trilha g-100 + arco. */
export function DonutMeter({
  value,
  label,
  size = 48,
  thickness = 6,
  color = 'blue',
}: {
  /** 0–100. */
  value: number;
  label: string;
  size?: number;
  thickness?: number;
  color?: ChartColor;
}) {
  const pct = clamp(value, 0, 100);
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  const length = (pct / 100) * circumference;
  return (
    <svg
      className={s.dmeter}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${label}: ${formatPct(pct, 0)}`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        className={s.dmeterTrack}
        style={{ strokeWidth: thickness }}
      />
      {pct > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className={s.dmeterArc}
          style={{
            stroke: palette[color].solid,
            strokeWidth: thickness,
            strokeDasharray: `${length.toFixed(2)} ${circumference.toFixed(2)}`,
          }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
    </svg>
  );
}

/* ——————————————————————————— Funil ——————————————————————————— */

export type FunnelStage = { key: string; label: string; value: number; hint?: string };

export type FunnelChartProps = {
  label: string;
  stages: FunnelStage[];
  /** Fita horizontal que afina (padrão) ou barras horizontais centradas. */
  variant?: 'ribbon' | 'bars';
  /** Altura da fita, em px. */
  height?: number;
  /** Pílula entre etapas: perda (“−97,7%”) ou taxa de passagem (“2,25%”). */
  change?: 'drop' | 'rate';
  format?: (value: number) => string;
  /**
   * Escala da espessura. Na fita, `log` (padrão) mantém etapas pequenas visíveis quando as quedas
   * são de ordens de grandeza (impressões → contratos); os números carregam o valor exato. Nas
   * barras, `linear` (padrão): o comprimento é honesto, com 4 px de mínimo.
   */
  scale?: 'log' | 'linear';
  summary?: string;
  /** Etapa desenhada como em hover (pranchas). */
  forceActive?: number;
  /** Estado parado para pranchas (`focus`). */
  'data-force'?: string;
};

function funnelRatios(values: number[], scale: 'log' | 'linear') {
  const top = Math.max(1, ...values);
  if (scale === 'linear') return values.map((v) => Math.max(0, v) / top);
  const floor = Math.max(1, Math.min(...values.map((v) => Math.max(1, v))));
  const lt = Math.log(top);
  const lf = Math.log(floor);
  return values.map((v) => (lt === lf ? 1 : (Math.log(Math.max(1, v)) - lf) / (lt - lf)));
}

/**
 * Taxa com até 2 casas abaixo de 10% (“2,25%”, “3,5%”) e 1 casa acima (“17,8%”). Abaixo de
 * 0,01% não arredonda para zero: “< 0,01%”.
 */
const formatRate = (value: number) =>
  value > 0 && value < 0.005
    ? '< 0,01%'
    : `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: value < 10 ? 2 : 1 })}%`;

/** Funil de conversão: fita que afina ou barras; pílulas com a taxa (ou perda) entre etapas. */
export function FunnelChart({
  label,
  stages,
  variant = 'ribbon',
  height = 200,
  change = 'drop',
  format = formatInt,
  scale,
  summary,
  forceActive,
  'data-force': force,
}: FunnelChartProps) {
  const [ref, width, node] = useWidth<HTMLDivElement>();
  useReady(node);
  const [ribbon, setRibbon] = useState<HTMLDivElement | null>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const explorer = useExplorer(stages.length, 0, {
    force: forceActive,
    keys: stages.map((st) => st.key),
    root: node,
  });
  const { current: active } = explorer;
  const n = stages.length;
  const values = stages.map((st) => st.value);
  /* Colunas estreitas demais para a fita (celular): cai para barras. */
  const mode =
    variant === 'bars' || (width > 0 && width / Math.max(1, n) < 112) ? 'bars' : 'ribbon';
  const ratios = funnelRatios(values, scale ?? (mode === 'bars' ? 'linear' : 'log'));
  const colors = rampFor(n);
  const first = values[0] ?? 0;
  const pass = (i: number) => {
    const prev = values[i - 1] ?? 0;
    return prev ? ((values[i] ?? 0) / prev) * 100 : 0;
  };
  const ofTop = (i: number) => (first ? ((values[i] ?? 0) / first) * 100 : 0);
  const pill = (i: number) =>
    change === 'drop' ? formatDelta(pass(i) - 100, 1) : formatRate(pass(i));
  const summaryText =
    summary ??
    `${label}: ${stages
      .map((st, i) =>
        i === 0
          ? `${st.label} ${format(st.value)}`
          : `${st.label} ${format(st.value)} (${formatPct(pass(i), 1)} da etapa anterior)`,
      )
      .join('; ')}.`;
  const table = {
    head: ['Etapa', 'Volume', 'Da etapa anterior', 'Do topo'],
    rows: stages.map((st, i) => [
      st.label,
      format(st.value),
      i === 0 ? '—' : formatPct(pass(i), 2),
      formatPct(ofTop(i), 2),
    ]),
  };
  const live =
    explorer.keyboard && active !== null && stages[active]
      ? `${stages[active]?.label}: ${format(stages[active]?.value ?? 0)}${
          active > 0 ? `, ${formatPct(pass(active), 2)} da etapa anterior` : ''
        }`
      : '';
  const topLabel = (stages[0]?.label ?? 'topo').toLocaleLowerCase('pt-BR');

  function tipFor(index: number) {
    const st = stages[index];
    if (!st) return null;
    const rows: TooltipRow[] = [
      { key: 'v', label: 'Volume', value: format(st.value), color: colors[index], shape: 'square' },
    ];
    if (index > 0) {
      rows.push({ key: 'p', label: 'Da etapa anterior', value: formatRate(pass(index)) });
      rows.push({ key: 't', label: `Das ${topLabel}`, value: formatRate(ofTop(index)) });
    }
    return <ChartTooltip title={st.label} rows={rows} />;
  }

  let tip: ReactNode = null;
  if (active !== null && node && stages[active]) {
    const index = active;
    if (mode === 'bars') {
      tip = (
        <FloatingTip
          root={node}
          placement="above"
          anchor={() => {
            const row = rowRefs.current[index];
            const bar = row?.querySelector('[data-bar]')?.getBoundingClientRect();
            const r = row?.getBoundingClientRect();
            if (!r) return null;
            const cx = bar ? (bar.left + bar.right) / 2 : r.left + r.width / 2;
            return { left: cx, right: cx, top: r.top + 4, bottom: r.bottom - 4 };
          }}
        >
          {tipFor(index)}
        </FloatingTip>
      );
    } else if (ribbon && width > 0) {
      const colW = width / Math.max(1, n);
      tip = (
        <FloatingTip
          root={node}
          anchor={() => {
            // Ao lado da coluna, centrado na fita; a folga passa da pílula entre as etapas.
            const r = ribbon.getBoundingClientRect();
            const cy = (r.top + r.bottom) / 2;
            const x0 = r.left + colW * index;
            return { left: x0 - 22, right: x0 + colW + 22, top: cy, bottom: cy };
          }}
        >
          {tipFor(index)}
        </FloatingTip>
      );
    }
  }

  if (mode === 'bars') {
    return (
      <div ref={ref} className={s.froot}>
        <div
          className={s.fbars}
          data-fallback={variant !== 'bars' || undefined}
          data-active={active !== null || undefined}
          role="group"
          aria-label={`${label}. ${keyboardHint(false)}`}
          data-force={force}
          {...explorer.bind}
        >
          <div role="img" aria-label={summaryText} className={s.fbarsRows}>
            {stages.map((st, i) => (
              <div
                key={st.key}
                ref={(el) => {
                  rowRefs.current[i] = el;
                }}
                className={s.fbarRow}
                data-active={active === i || undefined}
                onPointerEnter={() => explorer.point(i)}
                aria-hidden="true"
              >
                <span className={s.fbarText}>
                  <span className={s.fbarLabel}>{st.label}</span>
                  <span className={s.fbarValue}>{format(st.value)}</span>
                </span>
                <span className={s.fbarConv}>{i === 0 ? '' : <b key={change}>{pill(i)}</b>}</span>
                <span className={s.fbarTrack}>
                  {st.value > 0 && (
                    <i
                      className={s.fbar}
                      data-bar
                      style={{
                        width: `max(4px, ${f2((ratios[i] ?? 0) * 100)}%)`,
                        background: colors[i],
                      }}
                    />
                  )}
                </span>
              </div>
            ))}
          </div>
          {tip}
          <SrTable caption={label} head={table.head} rows={table.rows} />
          <Live>{live}</Live>
        </div>
      </div>
    );
  }

  const colW = n ? width / n : 0;
  /* Algum nome não cabe numa linha: todas as colunas reservam duas, e os números seguem alinhados. */
  const wrap = width > 0 && stages.some((st) => textWidth(st.label, 12) > colW - 41);
  const maxH = Math.round(height * 0.84);
  const minH = Math.max(14, Math.round(height * 0.12));
  /* Etapa zerada: a fita afina até sumir e a coluna fica só com um tracejado. */
  const hOf = (i: number) =>
    (values[i] ?? 0) <= 0 ? 0 : Math.round(minH + (maxH - minH) * (ratios[i] ?? 0));
  const cy = height / 2;
  const paths = stages.map((_, i) => {
    const x0 = i * colW - (i > 0 ? 1 : 0);
    const x1 = (i + 1) * colW;
    const hl = hOf(i);
    const hr = i < n - 1 ? hOf(i + 1) : hl;
    const xm = i * colW + colW * 0.42;
    const cx = (xm + x1) / 2;
    return [
      `M${f2(x0)} ${f2(cy - hl / 2)}`,
      `L${f2(xm)} ${f2(cy - hl / 2)}`,
      `C${f2(cx)} ${f2(cy - hl / 2)} ${f2(cx)} ${f2(cy - hr / 2)} ${f2(x1)} ${f2(cy - hr / 2)}`,
      `L${f2(x1)} ${f2(cy + hr / 2)}`,
      `C${f2(cx)} ${f2(cy + hr / 2)} ${f2(cx)} ${f2(cy + hl / 2)} ${f2(xm)} ${f2(cy + hl / 2)}`,
      `L${f2(x0)} ${f2(cy + hl / 2)}Z`,
    ].join('');
  });

  return (
    <div ref={ref} className={s.froot}>
      <div
        className={s.funnel}
        style={{ '--n': n, '--ribbon-h': `${height}px` } as CSSProperties}
        data-active={active !== null || undefined}
        role="group"
        aria-label={`${label}. ${keyboardHint(false)}`}
        data-force={force}
        {...explorer.bind}
      >
        <div className={s.fcols} data-wrap={wrap || undefined} aria-hidden="true">
          {stages.map((st, i) => (
            <div
              key={st.key}
              className={s.fcol}
              data-active={active === i || undefined}
              onPointerEnter={() => explorer.point(i)}
            >
              <span className={s.fLabel} title={st.label}>
                {st.label}
              </span>
              <span className={s.fValue}>{format(st.value)}</span>
              {st.hint && <span className={s.fMeta}>{st.hint}</span>}
            </div>
          ))}
        </div>
        <div ref={setRibbon} className={s.fribbon}>
          {width > 0 && (
            <svg
              width={width}
              height={height}
              role="img"
              aria-label={summaryText}
              className={s.fsvg}
            >
              {paths.map((d, i) =>
                (values[i] ?? 0) > 0 ? (
                  <path
                    key={stages[i]?.key ?? i}
                    d={d}
                    // Esmaecer por cor (opaca), não por opacidade: a emenda entre etapas não aparece.
                    style={morph(d, {
                      fill:
                        active !== null && active !== i
                          ? `color-mix(in srgb, ${colors[i]} 45%, var(--paper))`
                          : colors[i],
                    })}
                    className={s.fpath}
                    data-active={active === i || undefined}
                  />
                ) : (
                  <line
                    key={stages[i]?.key ?? i}
                    className={s.fzero}
                    x1={i * colW + 4}
                    x2={(i + 1) * colW - 4}
                    y1={Math.round(cy) + 0.5}
                    y2={Math.round(cy) + 0.5}
                  />
                ),
              )}
            </svg>
          )}
          {width > 0 &&
            stages.slice(1).map((st, index) => (
              <span
                key={`${st.key}-${change}`}
                className={s.fpill}
                style={{ left: (index + 1) * colW, top: cy }}
                aria-hidden="true"
              >
                {pill(index + 1)}
                <ArrowRight aria-hidden="true" />
              </span>
            ))}
        </div>
        {tip}
        <SrTable caption={label} head={table.head} rows={table.rows} />
        <Live>{live}</Live>
      </div>
    </div>
  );
}

/* ——————————————————————————— Sankey ——————————————————————————— */

export type SankeyNode = {
  key: string;
  label: string;
  /** Cor do nó. Sem ela: série da paleta na primeira coluna, cinza nas demais. */
  color?: ChartColor;
  /** Coluna fixa (0 = origem). Sem ela, a profundidade do nó no fluxo. */
  column?: number;
};

export type SankeyLink = { source: string; target: string; value: number };

export type SankeyChartProps = {
  label: string;
  nodes: SankeyNode[];
  links: SankeyLink[];
  /** Altura da área dos fluxos, em px. */
  height?: number;
  format?: (value: number) => string;
  summary?: string;
  /** Fluxo desenhado como em hover (pranchas): índice em `links`. */
  forceActive?: number;
  /** Estado parado para pranchas (`focus`). */
  'data-force'?: string;
};

type SankeyLayoutNode = SankeyNode & {
  index: number;
  col: number;
  value: number;
  in: number;
  out: number;
  x: number;
  y: number;
  h: number;
  tone: ChartColor;
  explicit: boolean;
};

type SankeyLayoutLink = SankeyLink & {
  index: number;
  d: string;
  t: number;
  mid: { x: number; y: number };
  tone: ChartColor;
};

const SANKEY_NODE_W = 10;
const SANKEY_GAP = 12;

/** Coluna de cada nó: a informada, senão o caminho mais longo desde uma origem. */
function sankeyColumns(nodes: SankeyNode[], links: SankeyLink[]) {
  const col = new Map(nodes.map((nd) => [nd.key, nd.column ?? 0]));
  for (let pass = 0; pass < nodes.length; pass += 1) {
    let changed = false;
    for (const lk of links) {
      const target = nodes.find((nd) => nd.key === lk.target);
      if (!target || target.column !== undefined) continue;
      const next = (col.get(lk.source) ?? 0) + 1;
      if (next > (col.get(lk.target) ?? 0)) {
        col.set(lk.target, next);
        changed = true;
      }
    }
    if (!changed) break;
  }
  return col;
}

/**
 * Diagrama de Sankey: o volume que sai de cada origem e chega a cada destino, em faixas de
 * espessura proporcional. Complementa o funil quando a perda não é linear — o lead que sai do
 * Portal e vira Ganho, o que vem da Vitrine e se perde no contato. Hover num fluxo destaca só ele
 * (dica com volume e participação na origem e no destino); hover num nó destaca os fluxos dele.
 * Setas percorrem os fluxos pelo teclado. Estreito demais para as colunas, vira lista de fluxos.
 */
export function SankeyChart({
  label,
  nodes,
  links,
  height = 300,
  format = formatInt,
  summary,
  forceActive,
  'data-force': force,
}: SankeyChartProps) {
  const [ref, width, node] = useWidth<HTMLDivElement>();
  useReady(node);
  const [svgEl, setSvgEl] = useState<SVGSVGElement | null>(null);
  const [nodeHover, setNodeHover] = useState<string | null>(null);

  const valid = links.filter(
    (lk) =>
      lk.value > 0 &&
      nodes.some((nd) => nd.key === lk.source) &&
      nodes.some((nd) => nd.key === lk.target),
  );
  const explorer = useExplorer(valid.length, 0, {
    force: forceActive,
    keys: valid.map((lk) => `${lk.source}→${lk.target}`),
    root: node,
  });
  const active = explorer.current;

  const cols = sankeyColumns(nodes, valid);
  const colCount = Math.max(1, ...[...cols.values()].map((c) => c + 1));
  const byKey = new Map(nodes.map((nd) => [nd.key, nd]));
  const labelOf = (key: string) => byKey.get(key)?.label ?? key;
  const sumIn = (key: string) =>
    valid.filter((lk) => lk.target === key).reduce((acc, lk) => acc + lk.value, 0);
  const sumOut = (key: string) =>
    valid.filter((lk) => lk.source === key).reduce((acc, lk) => acc + lk.value, 0);

  /* Cada coluna precisa de largura para o rótulo: abaixo disso, a lista. */
  const mode = width > 0 && width / colCount < 150 ? 'list' : 'flow';

  const used = nodes.filter((nd) => sumIn(nd.key) + sumOut(nd.key) > 0);
  const firstCol = used.filter((nd) => (cols.get(nd.key) ?? 0) === 0);
  const leftPad = Math.min(
    180,
    Math.max(
      0,
      ...firstCol.map((nd) => Math.max(textWidth(nd.label, 12), textWidth(format(sumOut(nd.key)), 13))),
    ) + 16,
  );
  const lastColIndex = colCount - 1;
  const lastCol = used.filter((nd) => (cols.get(nd.key) ?? 0) === lastColIndex);
  const rightPad = Math.min(
    180,
    Math.max(
      0,
      ...lastCol.map((nd) => Math.max(textWidth(nd.label, 12), textWidth(format(sumIn(nd.key)), 13))),
    ) + 16,
  );
  const x0 = leftPad;
  const x1 = Math.max(x0 + SANKEY_NODE_W, width - rightPad - SANKEY_NODE_W);
  const xOf = (col: number) => (colCount <= 1 ? x0 : x0 + ((x1 - x0) * col) / (colCount - 1));

  /* Escala única: a coluna mais cheia ocupa a altura toda. */
  const columns = Array.from({ length: colCount }, (_, c) =>
    used.filter((nd) => (cols.get(nd.key) ?? 0) === c),
  );
  const valueOf = (key: string) => Math.max(sumIn(key), sumOut(key));
  const ky = Math.min(
    ...columns
      .filter((list) => list.length > 0)
      .map((list) => {
        const total = list.reduce((acc, nd) => acc + valueOf(nd.key), 0);
        return total > 0 ? (height - SANKEY_GAP * (list.length - 1)) / total : Infinity;
      }),
  );
  const scale = Number.isFinite(ky) ? ky : 0;

  let paletteIndex = 0;
  const layout = new Map<string, SankeyLayoutNode>();
  columns.forEach((list, c) => {
    const total =
      list.reduce((acc, nd) => acc + Math.max(2, valueOf(nd.key) * scale), 0) +
      SANKEY_GAP * Math.max(0, list.length - 1);
    let y = (height - total) / 2;
    for (const nd of list) {
      const h = Math.max(2, valueOf(nd.key) * scale);
      const tone: ChartColor =
        nd.color ?? (c === 0 ? (chartPalette[paletteIndex++ % chartPalette.length] ?? 'blue') : 'gray');
      layout.set(nd.key, {
        ...nd,
        index: nodes.indexOf(nd),
        col: c,
        value: valueOf(nd.key),
        in: sumIn(nd.key),
        out: sumOut(nd.key),
        x: xOf(c),
        y,
        h,
        tone,
        explicit: nd.color !== undefined || c === 0,
      });
      y += h + SANKEY_GAP;
    }
  });

  /* Faixas empilhadas na ordem vertical do outro lado: nenhum fluxo cruza à toa. */
  const outOffset = new Map<string, number>();
  const inOffset = new Map<string, number>();
  const order = valid
    .map((lk, index) => ({ lk, index }))
    .sort((a, b) => {
      const ta = layout.get(a.lk.target)?.y ?? 0;
      const tb = layout.get(b.lk.target)?.y ?? 0;
      return ta - tb;
    });
  const linkLayout: SankeyLayoutLink[] = [];
  for (const { lk, index } of order) {
    const src = layout.get(lk.source);
    const tgt = layout.get(lk.target);
    if (!src || !tgt) continue;
    const t = lk.value * scale;
    const so = outOffset.get(lk.source) ?? 0;
    outOffset.set(lk.source, so + t);
    linkLayout.push({ ...lk, index, d: '', t, mid: { x: 0, y: 0 }, tone: src.tone });
  }
  const inOrder = [...linkLayout].sort(
    (a, b) => (layout.get(a.source)?.y ?? 0) - (layout.get(b.source)?.y ?? 0),
  );
  const tOffsetOf = new Map<number, number>();
  for (const lk of inOrder) {
    const to = inOffset.get(lk.target) ?? 0;
    inOffset.set(lk.target, to + lk.t);
    tOffsetOf.set(lk.index, to);
  }
  const sOffsetOf = new Map<number, number>();
  outOffset.clear();
  for (const lk of linkLayout) {
    const so = outOffset.get(lk.source) ?? 0;
    outOffset.set(lk.source, so + lk.t);
    sOffsetOf.set(lk.index, so);
  }
  for (const lk of linkLayout) {
    const src = layout.get(lk.source);
    const tgt = layout.get(lk.target);
    if (!src || !tgt) continue;
    const xs = src.x + SANKEY_NODE_W;
    const xt = tgt.x;
    const ys = src.y + (sOffsetOf.get(lk.index) ?? 0);
    const yt = tgt.y + (tOffsetOf.get(lk.index) ?? 0);
    const xm = (xs + xt) / 2;
    lk.d = [
      `M${f2(xs)} ${f2(ys)}`,
      `C${f2(xm)} ${f2(ys)} ${f2(xm)} ${f2(yt)} ${f2(xt)} ${f2(yt)}`,
      `L${f2(xt)} ${f2(yt + lk.t)}`,
      `C${f2(xm)} ${f2(yt + lk.t)} ${f2(xm)} ${f2(ys + lk.t)} ${f2(xs)} ${f2(ys + lk.t)}Z`,
    ].join('');
    lk.mid = { x: xm, y: (ys + yt) / 2 + lk.t / 2 };
    /* Destino com cor própria (status: Ganho, Perdido) pinta o fluxo que chega nele. */
    if (!src.explicit && tgt.explicit) lk.tone = tgt.tone;
  }
  const linkByIndex = new Map(linkLayout.map((lk) => [lk.index, lk]));

  const pctOf = (part: number, whole: number) => (whole ? (part / whole) * 100 : 0);
  const summaryText =
    summary ??
    `${label}: ${valid
      .map((lk) => `${labelOf(lk.source)} para ${labelOf(lk.target)}, ${format(lk.value)}`)
      .join('; ')}.`;
  const table = {
    head: ['Origem', 'Destino', 'Volume', 'Da origem'],
    rows: valid.map((lk) => [
      labelOf(lk.source),
      labelOf(lk.target),
      format(lk.value),
      formatPct(pctOf(lk.value, sumOut(lk.source)), 1),
    ]),
  };
  const activeLink = active !== null ? valid[active] : undefined;
  const live =
    explorer.keyboard && activeLink
      ? `${labelOf(activeLink.source)} para ${labelOf(activeLink.target)}: ${format(activeLink.value)}`
      : '';

  function linkTip(index: number) {
    const lk = valid[index];
    const lay = linkByIndex.get(index);
    if (!lk || !lay) return null;
    return (
      <ChartTooltip
        title={`${labelOf(lk.source)} → ${labelOf(lk.target)}`}
        rows={[
          { key: 'v', label: 'Volume', value: format(lk.value), color: lay.tone, shape: 'square' },
          {
            key: 'o',
            label: `De ${labelOf(lk.source)}`,
            value: formatPct(pctOf(lk.value, sumOut(lk.source)), 1),
          },
          {
            key: 'd',
            label: `Em ${labelOf(lk.target)}`,
            value: formatPct(pctOf(lk.value, sumIn(lk.target)), 1),
          },
        ]}
      />
    );
  }

  function nodeTip(key: string) {
    const nd = layout.get(key);
    if (!nd) return null;
    const rows: TooltipRow[] = [];
    if (nd.in > 0) rows.push({ key: 'in', label: 'Entrada', value: format(nd.in) });
    if (nd.out > 0) rows.push({ key: 'out', label: 'Saída', value: format(nd.out) });
    return <ChartTooltip title={nd.label} rows={rows} />;
  }

  let tip: ReactNode = null;
  if (mode === 'flow' && node && svgEl) {
    if (nodeHover && layout.get(nodeHover)) {
      const nd = layout.get(nodeHover);
      tip = nd ? (
        <FloatingTip
          root={node}
          anchor={() => {
            const r = svgEl.getBoundingClientRect();
            return {
              left: r.left + nd.x,
              right: r.left + nd.x + SANKEY_NODE_W,
              top: r.top + nd.y + nd.h / 2,
              bottom: r.top + nd.y + nd.h / 2,
            };
          }}
        >
          {nodeTip(nodeHover)}
        </FloatingTip>
      ) : null;
    } else if (active !== null && linkByIndex.get(active)) {
      const lay = linkByIndex.get(active);
      tip = lay ? (
        <FloatingTip
          root={node}
          anchor={() => {
            const r = svgEl.getBoundingClientRect();
            const cx = r.left + lay.mid.x;
            const cy = r.top + lay.mid.y;
            return { left: cx - 6, right: cx + 6, top: cy, bottom: cy };
          }}
        >
          {linkTip(active)}
        </FloatingTip>
      ) : null;
    }
  }

  const isLit = (lk: SankeyLayoutLink) =>
    nodeHover ? lk.source === nodeHover || lk.target === nodeHover : active === lk.index;
  const dimmed = nodeHover !== null || active !== null;

  if (mode === 'list') {
    const max = Math.max(1, ...valid.map((lk) => lk.value));
    return (
      <div ref={ref} className={s.sroot}>
        <div
          className={s.slist}
          data-active={active !== null || undefined}
          role="group"
          aria-label={`${label}. ${keyboardHint(false)}`}
          data-force={force}
          {...explorer.bind}
        >
          <ul role="img" aria-label={summaryText} className={s.slistRows}>
            {valid.map((lk, i) => (
              <li
                key={`${lk.source}-${lk.target}`}
                className={s.slistRow}
                data-active={active === i || undefined}
                onPointerEnter={() => explorer.point(i)}
                aria-hidden="true"
              >
                <span className={s.slistText}>
                  <span>
                    {labelOf(lk.source)} → {labelOf(lk.target)}
                  </span>
                  <b>{format(lk.value)}</b>
                </span>
                <span className={s.slistTrack}>
                  <i
                    style={{
                      width: `max(4px, ${f2((lk.value / max) * 100)}%)`,
                      background: cssColor(linkByIndex.get(i)?.tone ?? 'gray'),
                    }}
                  />
                </span>
              </li>
            ))}
          </ul>
          <SrTable caption={label} head={table.head} rows={table.rows} />
          <Live>{live}</Live>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className={s.sroot}>
      <div
        className={s.sankey}
        style={{ height }}
        data-active={dimmed || undefined}
        role="group"
        aria-label={`${label}. ${keyboardHint(false)}`}
        data-force={force}
        {...explorer.bind}
      >
        {width > 0 && (
          <svg
            ref={setSvgEl}
            width={width}
            height={height}
            role="img"
            aria-label={summaryText}
            className={s.ssvg}
          >
            {linkLayout.map((lk) => (
              <path
                key={`${lk.source}-${lk.target}`}
                d={lk.d}
                className={s.slink}
                style={{ fill: cssColor(lk.tone) }}
                data-active={isLit(lk) || undefined}
                onPointerEnter={() => {
                  setNodeHover(null);
                  explorer.point(lk.index);
                }}
              />
            ))}
            {[...layout.values()].map((nd) => (
              <rect
                key={nd.key}
                x={nd.x}
                y={nd.y}
                width={SANKEY_NODE_W}
                height={nd.h}
                rx={2}
                className={s.snode}
                style={{ fill: cssColor(nd.tone) }}
                data-active={nodeHover === nd.key || undefined}
                onPointerEnter={() => setNodeHover(nd.key)}
                onPointerLeave={() => setNodeHover(null)}
              />
            ))}
          </svg>
        )}
        {width > 0 &&
          [...layout.values()].map((nd) => {
            const side = nd.col === lastColIndex && colCount > 1 ? 'right' : nd.col === 0 ? 'left' : 'mid';
            const value = nd.col === 0 ? nd.out : nd.in;
            return (
              <span
                key={nd.key}
                className={s.slabel}
                data-side={side}
                style={{
                  top: nd.y + nd.h / 2,
                  left: side === 'left' ? nd.x - 8 : nd.x + SANKEY_NODE_W + 8,
                }}
                aria-hidden="true"
              >
                <span>{nd.label}</span>
                <b>{format(value)}</b>
              </span>
            );
          })}
        {tip}
        <SrTable caption={label} head={table.head} rows={table.rows} />
        <Live>{live}</Live>
      </div>
    </div>
  );
}
