'use client';

import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { Button, IconButton } from './button';
import { VisuallyHidden } from './a11y';
import f from './fields.module.css';
import s from './date-picker.module.css';

/* ——— Tipos públicos ——— */

/** Datas sempre em ISO `aaaa-mm-dd`; string vazia = sem data. */
export type DateRange = { start: string; end: string };
/** Faixa destacada no calendário, sem bloquear dias (ex.: janela de venda do ativo). */
export type DateWindow = { start: string; end: string; label?: string };
export type DatePreset = { label: string; start: string; end: string };

export type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  window?: DateWindow;
  placeholder?: string;
  invalid?: boolean;
  id?: string;
  describedBy?: string;
  'aria-label'?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
  /** Aceita digitar a data (dd/mm/aaaa); o ícone abre o calendário. */
  editable?: boolean;
  /** Com `editable`: mensagem do que foi digitado ("Data inválida") ou `null` quando vale. */
  onInputError?: (message: string | null) => void;
  /** Prancha: estado parado (`hover`, `focus`). */
  'data-force'?: string;
};

export type DateRangePickerProps = {
  start: string;
  end: string;
  onChange: (range: DateRange) => void;
  min?: string;
  max?: string;
  window?: DateWindow;
  presets?: DatePreset[];
  /** `true` marca o controle inteiro; o objeto marca só a data com erro. */
  invalid?: boolean | { start?: boolean; end?: boolean };
  startLabel?: string;
  endLabel?: string;
  /** Ids dos dois segmentos, para `<label htmlFor>` externos. */
  ids?: { start?: string; end?: string };
  describedBy?: string | { start?: string; end?: string };
  /** Nome do grupo (ex.: "Período de veiculação"). */
  'aria-label'?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
  /**
   * Formulário: duas caixas com rótulo visível ("Início *", "Término *"), cada uma igual ao `Input`
   * dentro de um `Field`, lado a lado (gap `--date-split-gap`, 16 px), e um calendário de período só.
   * Lê e alinha como dois campos da grade. Sem seta, duração nem "limpar": mostre a duração fora.
   */
  labels?: boolean;
  /** Com `labels`: asterisco de obrigatório nos dois rótulos. */
  required?: boolean;
  /**
   * Texto do controle vazio e fechado, lido como valor — o "tudo" de um filtro (ex.: "Qualquer
   * período"), como o "Todos os status" do Select ao lado. Sem ele, cada segmento mostra o rótulo.
   */
  placeholder?: string;
  /** Botão de limpar dentro do controle quando há data (ex.: filtros). */
  clearable?: boolean;
  /** Duração ("27 dias") ao fim do controle. Padrão: sim (nunca com `labels`). */
  duration?: boolean;
};

/* ——— Datas ISO, sem fuso: toda a aritmética roda no calendário UTC ——— */

const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];
const WEEKDAYS = [
  ['D', 'domingo'],
  ['S', 'segunda-feira'],
  ['T', 'terça-feira'],
  ['Q', 'quarta-feira'],
  ['Q', 'quinta-feira'],
  ['S', 'sexta-feira'],
  ['S', 'sábado'],
] as const;
const DAY_MS = 86_400_000;

const pad = (n: number) => String(n).padStart(2, '0');

/** Normaliza estouros (32/10 → 01/11) e devolve ISO. */
function toISO(y: number, m: number, d: number) {
  const date = new Date(Date.UTC(y, m, d));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function parse(value: string | undefined) {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]) - 1;
  const d = Number(match[3]);
  return toISO(y, m, d) === value ? { y, m, d } : null;
}
const isISO = (value: string | undefined): value is string => parse(value) !== null;
const orEmpty = (value: string | undefined) => (isISO(value) ? value : '');
const orNone = (value: string | undefined) => (isISO(value) ? value : undefined);

const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

function addDays(value: string, amount: number) {
  const p = parse(value);
  return p ? toISO(p.y, p.m, p.d + amount) : value;
}
/** Mesmo dia no mês de destino, limitado ao último dia dele (31/01 + 1 mês → 28/02). */
function addMonths(value: string, amount: number) {
  const p = parse(value);
  if (!p) return value;
  const target = new Date(Date.UTC(p.y, p.m + amount, 1));
  const y = target.getUTCFullYear();
  const m = target.getUTCMonth();
  return toISO(y, m, Math.min(p.d, daysInMonth(y, m)));
}
function weekday(value: string) {
  const p = parse(value);
  return p ? new Date(Date.UTC(p.y, p.m, p.d)).getUTCDay() : 0;
}
/** Mês como índice contínuo (ano × 12 + mês), para somar e comparar sem datas. */
function monthIndex(value: string) {
  const p = parse(value);
  return p ? p.y * 12 + p.m : 0;
}
const monthOf = (index: number) => ({ y: Math.floor(index / 12), m: ((index % 12) + 12) % 12 });

/** Dias corridos, contando o primeiro e o último. */
function spanDays(start: string, end: string) {
  const a = parse(start);
  const b = parse(end);
  if (!a || !b || end < start) return 0;
  return Math.round((Date.UTC(b.y, b.m, b.d) - Date.UTC(a.y, a.m, a.d)) / DAY_MS) + 1;
}
function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
function clampDate(value: string, min?: string, max?: string) {
  if (min && value < min) return min;
  if (max && value > max) return max;
  return value;
}

/* ——— Formatos (regra A-21: dd/MM/aaaa; intervalo dd/MM – dd/MM) ——— */

function dateBR(value: string) {
  const p = parse(value);
  return p ? `${pad(p.d)}/${pad(p.m + 1)}/${p.y}` : '';
}
function dayMonth(value: string) {
  const p = parse(value);
  return p ? `${pad(p.d)}/${pad(p.m + 1)}` : '';
}
function spoken(value: string) {
  const p = parse(value);
  return p ? `${p.d} de ${MONTHS[p.m] ?? ''} de ${p.y}` : '';
}
function monthTitle(index: number) {
  const { y, m } = monthOf(index);
  const name = MONTHS[m] ?? '';
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} de ${y}`;
}
/** Intervalo compacto; o ano só aparece quando as pontas caem em anos diferentes. */
function rangeText(start: string, end: string) {
  return start.slice(0, 4) === end.slice(0, 4)
    ? `${dayMonth(start)} – ${dayMonth(end)}`
    : `${dateBR(start)} – ${dateBR(end)}`;
}
const daysText = (n: number) => `${n} ${n === 1 ? 'dia' : 'dias'}`;

/* ——— Camada flutuante ——— */

type Placement = { top: number; left: number; side: 'below' | 'above'; minWidth?: number };
const GAP = 6;
const EDGE = 8;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** O gatilho saiu de vista: o centro dele ficou fora da janela ou de algum ancestral que recorta. */
function anchorHidden(anchor: Element) {
  const rect = anchor.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const outside = (box: { top: number; bottom: number; left: number; right: number }) =>
    y < box.top || y > box.bottom || x < box.left || x > box.right;
  if (outside({ top: 0, left: 0, bottom: window.innerHeight, right: window.innerWidth })) {
    return true;
  }
  for (let node = anchor.parentElement; node && node !== document.body; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (style.overflowX !== 'visible' || style.overflowY !== 'visible') {
      if (outside(node.getBoundingClientRect())) return true;
    }
  }
  return false;
}

/**
 * Área em que o painel pode aparecer: o contêiner rolável mais próximo do gatilho (ex.: o miolo de
 * uma moldura com topo e rodapé fixos), limitado à janela. Sem contêiner, a própria janela.
 */
function visibleBox(anchor: Element) {
  const vh = window.innerHeight;
  for (let node = anchor.parentElement; node && node !== document.body; node = node.parentElement) {
    const overflow = getComputedStyle(node).overflowY;
    if (overflow === 'auto' || overflow === 'scroll') {
      const box = node.getBoundingClientRect();
      return { top: Math.max(0, box.top), bottom: Math.min(vh, box.bottom) };
    }
  }
  return { top: 0, bottom: vh };
}

/**
 * Painel preso à janela, num portal dentro do escopo do tema: nenhuma moldura o recorta e ele não
 * ocupa espaço no layout. Abre abaixo do gatilho, vira para cima quando falta espaço e fica dentro da
 * área rolável do gatilho — numa moldura fixa, nunca cobre o topo nem o rodapé. Acompanha rolagem e
 * redimensionamento. No celular, tem ao menos a largura do gatilho. Fecha no clique fora; Escape devolve o foco.
 */
function Popover({
  anchorRef,
  open,
  onDismiss,
  label,
  id,
  children,
}: {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  /** `restore`: devolver o foco ao gatilho. */
  onDismiss: (restore: boolean) => void;
  label: string;
  id: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [host, setHost] = useState<Element | null>(null);
  const [place, setPlace] = useState<Placement | null>(null);
  const dismiss = useRef(onDismiss);
  useLayoutEffect(() => {
    dismiss.current = onDismiss;
  });

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!open || !anchor) {
      setPlace(null);
      return;
    }
    // Dentro de um diálogo, o painel precisa estar na mesma camada do topo para aparecer.
    setHost(anchor.closest('dialog[open]') ?? anchor.closest('[data-ds-v3]') ?? document.body);
  }, [open, anchorRef]);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const pop = ref.current;
    if (!open || !host || !anchor || !pop) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (anchorHidden(anchor)) {
        dismiss.current(false);
        return;
      }
      const a = anchor.getBoundingClientRect();
      const width = pop.offsetWidth;
      const height = pop.offsetHeight;
      const vw = document.documentElement.clientWidth;
      const box = visibleBox(anchor);
      const below = box.bottom - a.bottom - GAP - EDGE;
      const above = a.top - box.top - GAP - EDGE;
      const side = height <= below || below >= above ? 'below' : 'above';
      const next: Placement = {
        side,
        top: clamp(
          side === 'below' ? a.bottom + GAP : a.top - GAP - height,
          box.top + EDGE,
          Math.max(box.top + EDGE, box.bottom - height - EDGE),
        ),
        left: clamp(a.left, EDGE, Math.max(EDGE, vw - width - EDGE)),
        minWidth: vw < 640 ? Math.round(a.width) : undefined,
      };
      setPlace((prev) =>
        prev &&
        prev.top === next.top &&
        prev.left === next.left &&
        prev.side === next.side &&
        prev.minWidth === next.minWidth
          ? prev
          : next,
      );
    };
    const schedule = (event?: Event) => {
      if (event?.target instanceof Node && pop.contains(event.target)) return;
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    const observer = new ResizeObserver(() => schedule());
    observer.observe(pop);
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
    };
  }, [open, host, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (ref.current?.contains(target) || anchorRef.current?.contains(target)) return;
      dismiss.current(false);
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [open, anchorRef]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      // Também impede que um <dialog> por trás feche junto.
      event.preventDefault();
      event.stopPropagation();
      dismiss.current(true);
      return;
    }
    if (event.key !== 'Tab' || !ref.current) return;
    // O painel vive no fim do documento: o Tab circula dentro dele até Escape ou escolha.
    const items = [...ref.current.querySelectorAll<HTMLElement>('button:not(:disabled)')].filter(
      (item) => item.tabIndex >= 0,
    );
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  }

  if (!open || !host) return null;
  const style: CSSProperties = place
    ? { top: place.top, left: place.left, minWidth: place.minWidth }
    : { top: -9999, left: -9999 };
  return createPortal(
    <div
      ref={ref}
      id={id}
      role="dialog"
      aria-label={label}
      className={s.pop}
      data-side={place?.side ?? 'below'}
      style={style}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>,
    host,
  );
}

/* ——— Calendário ——— */

const NARROW = '(max-width: 639px)';
function subscribeNarrow(notify: () => void) {
  const query = window.matchMedia(NARROW);
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
}
const readNarrow = () => window.matchMedia(NARROW).matches;

function monthStartDay(index: number) {
  const { y, m } = monthOf(index);
  return new Date(Date.UTC(y, m, 1)).getUTCDay();
}
/** Semanas que o mês ocupa (4 a 6), com a semana começando no domingo. */
function weeksIn(index: number) {
  const { y, m } = monthOf(index);
  return Math.ceil((monthStartDay(index) + daysInMonth(y, m)) / 7);
}
function monthCells(index: number, rows: number) {
  const { y, m } = monthOf(index);
  const offset = monthStartDay(index);
  const total = daysInMonth(y, m);
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: 7 }, (_, col) => {
      const day = row * 7 + col - offset + 1;
      return day >= 1 && day <= total ? { date: toISO(y, m, day), day, last: day === total } : null;
    }),
  );
}

type PanelProps = {
  mode: 'single' | 'range';
  value: string;
  start: string;
  end: string;
  anchor: 'start' | 'end';
  min?: string;
  max?: string;
  marked?: DateWindow;
  presets?: DatePreset[];
  onPick: (date: string) => void;
  onPreset?: (preset: DatePreset) => void;
  onClear: () => void;
  onToday?: (today: string) => void;
};

function CalendarPanel({
  mode,
  value,
  start,
  end,
  anchor,
  min,
  max,
  marked,
  presets,
  onPick,
  onPreset,
  onClear,
  onToday,
}: PanelProps) {
  const narrow = useSyncExternalStore(subscribeNarrow, readNarrow, () => false);
  // Dois meses só quando o período escolhível passa de um mês: uma janela de outubro não ganha um
  // novembro inteiro apagado ao lado.
  const spanMonths = min && max ? monthIndex(max) - monthIndex(min) + 1 : 2;
  const count = mode === 'range' && !narrow ? Math.min(2, Math.max(1, spanMonths)) : 1;
  const [today] = useState(todayISO);
  const isDisabled = (date: string) => Boolean((min && date < min) || (max && date > max));

  // Data em foco ao abrir: a ponta que está sendo escolhida; sem data, hoje ou o início da janela.
  const [initial] = useState(() => {
    const chosen = mode === 'single' ? value : anchor === 'end' ? end || start : start || end;
    if (chosen) return clampDate(chosen, min, max);
    const base = marked && today < marked.start ? marked.start : today;
    return clampDate(base, min, max);
  });
  const [view, setView] = useState(() => {
    let first = monthIndex(initial);
    if (count === 2 && mode === 'range' && anchor === 'end' && start && monthIndex(start) < first) {
      first -= 1;
    }
    if (max && first + count - 1 > monthIndex(max)) first = monthIndex(max) - count + 1;
    if (min && first < monthIndex(min)) first = monthIndex(min);
    return first;
  });
  const [focusDate, setFocusDate] = useState(initial);
  const [hover, setHover] = useState<string | null>(null);
  // Sentido da última troca de mês: a grade entra deslizando 8 px desse lado.
  const [dir, setDir] = useState<'next' | 'prev'>();
  const rootRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef(true);
  const titleIds = useId();

  const lastView = view + count - 1;
  const visible = (date: string) => {
    const index = monthIndex(date);
    return index >= view && index <= lastView;
  };
  const tabbable =
    [focusDate, mode === 'single' ? value : start, end, today].find(
      (date) => date && visible(date) && !isDisabled(date),
    ) ?? firstEnabled();
  function firstEnabled() {
    for (let index = view; index <= lastView; index += 1) {
      const { y, m } = monthOf(index);
      for (let day = 1; day <= daysInMonth(y, m); day += 1) {
        const date = toISO(y, m, day);
        if (!isDisabled(date)) return date;
      }
    }
    const { y, m } = monthOf(view);
    return toISO(y, m, 1);
  }

  // Foco por teclado (e na abertura) vai para o dia certo depois que o mês novo renderiza.
  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    rootRef.current
      ?.querySelector<HTMLButtonElement>(`[data-date="${tabbable}"]`)
      ?.focus({ preventScroll: true });
  });

  function move(next: string) {
    const date = clampDate(next, min, max);
    const index = monthIndex(date);
    pendingFocus.current = true;
    setFocusDate(date);
    setHover(date);
    if (index < view) setDir('prev');
    else if (index > view + count - 1) setDir('next');
    setView((current) =>
      index < current ? index : index > current + count - 1 ? index - count + 1 : current,
    );
  }

  function onGridKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    const from = tabbable;
    const steps: Record<string, () => string> = {
      ArrowLeft: () => addDays(from, -1),
      ArrowRight: () => addDays(from, 1),
      ArrowUp: () => addDays(from, -7),
      ArrowDown: () => addDays(from, 7),
      PageUp: () => addMonths(from, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(from, event.shiftKey ? 12 : 1),
      Home: () => addDays(from, -weekday(from)),
      End: () => addDays(from, 6 - weekday(from)),
    };
    const step = steps[event.key];
    if (!step) return;
    event.preventDefault();
    move(step());
  }

  // Prévia do intervalo: a ponta fixa fica cheia, a que segue o ponteiro fica vazada.
  const fixed = anchor === 'end' ? start : end;
  const moving = anchor === 'end' ? end : start;
  const previewing =
    mode === 'range' &&
    hover !== null &&
    Boolean(fixed) &&
    !isDisabled(fixed) &&
    hover !== moving &&
    !isDisabled(hover) &&
    (anchor === 'end' || hover <= end);
  let lo = start;
  let hi = end;
  if (previewing && hover) {
    lo = hover < fixed ? hover : fixed;
    hi = hover < fixed ? fixed : hover;
  }
  const hasBand = mode === 'range' && Boolean(lo && hi) && lo < hi;

  const prevDisabled = Boolean(min && monthIndex(min) >= view);
  const nextDisabled = Boolean(max && monthIndex(max) <= lastView);
  const presetList = mode === 'range' ? (presets ?? []) : [];
  const months = Array.from({ length: count }, (_, i) => view + i);
  // Linhas = o maior mês visível. Durante a abertura a altura só cresce: navegar entre meses de
  // 5 e 6 semanas não faz o painel encolher e pular sob o ponteiro.
  const needed = Math.max(...months.map(weeksIn));
  const [rows, setRows] = useState(needed);
  if (needed > rows) setRows(needed);
  // Marcar dia a dia (e a legenda) só quando informa algo além dos limites: se todo dia escolhível já
  // está na janela, os dias apagados já a mostram.
  const markDays = Boolean(marked && !(min && max && marked.start <= min && marked.end >= max));
  const legend = markDays ? marked : undefined;
  // A janela é sempre o pontilhado sob o número (data única e período, como nos seletores
  // aprovados): a faixa azul fica só para a escolha, e as duas nunca se confundem.

  return (
    <div ref={rootRef} className={s.panel}>
      {(presetList.length > 0 || legend) && (
        <div className={s.top}>
          {presetList.length > 0 && (
            <div className={s.presets} role="group" aria-label="Atalhos de período">
              {presetList.map((preset) => {
                const usable =
                  isISO(preset.start) &&
                  isISO(preset.end) &&
                  preset.start <= preset.end &&
                  !isDisabled(preset.start) &&
                  !isDisabled(preset.end);
                return (
                  <button
                    key={preset.label}
                    type="button"
                    className={s.preset}
                    aria-pressed={preset.start === start && preset.end === end}
                    disabled={!usable}
                    onClick={() => onPreset?.(preset)}
                  >
                    {preset.label}
                    {!legend &&
                      marked &&
                      preset.start === marked.start &&
                      preset.end === marked.end && (
                        <span className={s.presetDates}>{rangeText(preset.start, preset.end)}</span>
                      )}
                  </button>
                );
              })}
            </div>
          )}
          {legend && (
            <span className={s.legend}>
              <span className={s.swatch} aria-hidden="true" />
              {legend.label ?? 'Janela do ativo'}
              <b>{rangeText(legend.start, legend.end)}</b>
            </span>
          )}
        </div>
      )}

      <div className={s.months} onPointerLeave={() => setHover(null)}>
        {months.map((index, i) => {
          const titleId = `${titleIds}-${i}`;
          return (
            <div key={i} className={s.month}>
              <div className={s.head}>
                {i === 0 ? (
                  <IconButton
                    label="Mês anterior"
                    icon={ChevronLeft}
                    variant="ghost"
                    size="sm"
                    className={s.nav}
                    disabled={prevDisabled}
                    onClick={() => {
                      setDir('prev');
                      setView((current) => current - 1);
                    }}
                  />
                ) : (
                  <span className={s.navGap} />
                )}
                <div id={titleId} className={s.title} aria-live={i === 0 ? 'polite' : undefined}>
                  {monthTitle(index)}
                </div>
                {i === count - 1 ? (
                  <IconButton
                    label="Próximo mês"
                    icon={ChevronRight}
                    variant="ghost"
                    size="sm"
                    className={s.nav}
                    disabled={nextDisabled}
                    onClick={() => {
                      setDir('next');
                      setView((current) => current + 1);
                    }}
                  />
                ) : (
                  <span className={s.navGap} />
                )}
              </div>
              <table
                role="grid"
                aria-labelledby={titleId}
                className={s.grid}
                onKeyDown={onGridKeyDown}
              >
                <thead>
                  <tr>
                    {WEEKDAYS.map(([short, long]) => (
                      <th key={long} scope="col" className={s.weekday}>
                        <span aria-hidden="true">{short}</span>
                        <VisuallyHidden>{long}</VisuallyHidden>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody key={index} className={s.weeks} data-dir={dir}>
                  {monthCells(index, Math.max(rows, needed)).map((week, row) => (
                    <tr key={row}>
                      {week.map((cell, col) => {
                        if (!cell) return <td key={`empty-${col}`} className={s.cell} />;
                        const { date, day, last } = cell;
                        const disabled = isDisabled(date);
                        const filled =
                          mode === 'single'
                            ? date === value
                            : previewing
                              ? date === fixed
                              : date === start || date === end;
                        const ghost = previewing && date === hover && !filled;
                        // A faixa nunca passa sob dias indisponíveis (ex.: início gravado fora da janela).
                        const band =
                          hasBand && !disabled && date >= lo && date <= hi
                            ? date === lo
                              ? 'start'
                              : date === hi
                                ? 'end'
                                : 'mid'
                            : undefined;
                        const selected =
                          mode === 'single'
                            ? date === value
                            : Boolean(start) &&
                              (end ? date >= start && date <= end : date === start);
                        const inWindow =
                          markDays && Boolean(marked && date >= marked.start && date <= marked.end);
                        return (
                          <td
                            key={date}
                            role="gridcell"
                            aria-selected={selected}
                            className={s.cell}
                            data-band={band}
                            data-cap-l={
                              band && (col === 0 || day === 1 || isDisabled(addDays(date, -1)))
                                ? true
                                : undefined
                            }
                            data-cap-r={
                              band && (col === 6 || last || isDisabled(addDays(date, 1)))
                                ? true
                                : undefined
                            }
                          >
                            <button
                              type="button"
                              className={s.day}
                              data-date={date}
                              data-filled={filled || undefined}
                              data-ghost={ghost || undefined}
                              data-today={date === today || undefined}
                              data-window={inWindow || undefined}
                              tabIndex={date === tabbable ? 0 : -1}
                              aria-label={spoken(date)}
                              aria-disabled={disabled || undefined}
                              aria-current={date === today ? 'date' : undefined}
                              onClick={() => {
                                if (!disabled) onPick(date);
                              }}
                              onPointerEnter={() => setHover(date)}
                              // Foco não abre prévia: ela vem do ponteiro ou das setas (`move`).
                              onFocus={() => setFocusDate(date)}
                            >
                              {day}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      <div className={s.foot}>
        {mode === 'range' ? (
          <span className={s.summary} aria-live="polite">
            {start && end ? (
              <>
                <b>{rangeText(start, end)}</b> · {daysText(spanDays(start, end))}
              </>
            ) : start ? (
              <>
                <b>{dayMonth(start)} –</b> escolha o término
              </>
            ) : (
              'Escolha o início'
            )}
          </span>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className={s.footButton}
            disabled={isDisabled(today)}
            onClick={() => onToday?.(today)}
          >
            Hoje
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={s.footButton}
          disabled={mode === 'single' ? !value : !start && !end}
          onClick={onClear}
        >
          Limpar
        </Button>
      </div>
    </div>
  );
}

/* ——— Data única ——— */

/** dd/mm/aaaa (ou dd/mm, no ano de referência) → ISO; `null` quando a data não existe (31/02). */
function parseBR(text: string, fallbackYear: number) {
  const match = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?$/.exec(text.trim());
  if (!match) return null;
  const d = Number(match[1]);
  const m = Number(match[2]);
  const short = match[3]?.length === 2;
  const y = match[3] ? Number(match[3]) + (short ? 2000 : 0) : fallbackYear;
  const iso = `${y}-${pad(m)}-${pad(d)}`;
  return isISO(iso) ? iso : null;
}
/** Só dígitos viram dd/mm/aaaa enquanto se digita; quem digita as barras manda nelas. */
function maskDate(raw: string) {
  // "5/" vira "05/": a barra digitada depois de um dígito só completa o dia (ou o mês).
  const padded = raw.replace(/[^\d/]/g, '').replace(/(^|\/)(\d)\//g, '$10$2/');
  const digits = padded.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/**
 * Campo de data com calendário próprio. Visual idêntico ao `Input` (altura, raio, borda, foco e
 * erro). Clique, Enter, Espaço ou ↓ abrem o calendário; escolher um dia confirma e fecha.
 * O nome vem do `<label htmlFor={id}>` (ou `aria-label`); a data por extenso vai na descrição.
 * Com `editable`, o campo também aceita digitar ("05102026" → 05/10/2026); o erro de digitação
 * ("Data inválida") chega por `onInputError` para o `Field` mostrar.
 */
export function DatePicker({
  value,
  onChange,
  min,
  max,
  window: marked,
  placeholder,
  invalid,
  id,
  describedBy,
  'aria-label': ariaLabel,
  size = 'md',
  disabled,
  editable = false,
  onInputError,
  'data-force': force,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popId = useId();
  const valueId = useId();
  const date = orEmpty(value);
  const markedWindow = marked && isISO(marked.start) && isISO(marked.end) ? marked : undefined;
  // Digitável: um `value` que não é ISO entra como texto cru (ex.: o que veio de uma importação).
  const [text, setText] = useState(() => (date ? dateBR(date) : editable ? value : ''));
  const [synced, setSynced] = useState(date);
  if (synced !== date) {
    setSynced(date);
    setText(date ? dateBR(date) : '');
  }

  function close(restore: boolean) {
    setOpen(false);
    if (restore) (editable ? inputRef : triggerRef).current?.focus({ preventScroll: true });
  }
  function commit(next: string) {
    onInputError?.(null);
    setText(next ? dateBR(next) : '');
    onChange(next);
    close(true);
  }
  function commitText() {
    const raw = text.trim();
    if (!raw) {
      onInputError?.(null);
      if (date) onChange('');
      return;
    }
    const year = Number((orNone(min) ?? todayISO()).slice(0, 4));
    const iso = parseBR(raw, year);
    if (!iso) {
      onInputError?.('Data inválida');
      return;
    }
    if (min && isISO(min) && iso < min) {
      onInputError?.(`A partir de ${dateBR(min)}`);
      return;
    }
    if (max && isISO(max) && iso > max) {
      onInputError?.(`Até ${dateBR(max)}`);
      return;
    }
    onInputError?.(null);
    setText(dateBR(iso));
    if (iso !== date) onChange(iso);
  }

  const panel = (
    <Popover
      anchorRef={editable ? boxRef : triggerRef}
      open={open}
      onDismiss={close}
      label="Escolher data"
      id={popId}
    >
      <CalendarPanel
        mode="single"
        value={date}
        start=""
        end=""
        anchor="start"
        min={orNone(min)}
        max={orNone(max)}
        marked={markedWindow}
        onPick={commit}
        onClear={() => commit('')}
        onToday={commit}
      />
    </Popover>
  );

  if (editable) {
    return (
      <>
        <div
          ref={boxRef}
          className={`${f.control} ${s.editable}`}
          data-size={size}
          data-invalid={invalid || undefined}
          data-disabled={disabled || undefined}
          data-open={open || undefined}
          data-force={force}
        >
          <button
            type="button"
            className={s.calButton}
            tabIndex={-1}
            aria-label="Abrir calendário"
            disabled={disabled}
            onClick={() => {
              setOpen((current) => !current);
              inputRef.current?.focus({ preventScroll: true });
            }}
          >
            <CalendarDays aria-hidden="true" />
          </button>
          <input
            ref={inputRef}
            id={id}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            placeholder={placeholder ?? 'dd/mm/aaaa'}
            value={text}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-invalid={invalid || undefined}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={open ? popId : undefined}
            aria-describedby={[valueId, describedBy].filter(Boolean).join(' ')}
            onChange={(event) => setText(maskDate(event.target.value))}
            onBlur={commitText}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commitText();
              } else if (event.key === 'ArrowDown' && !open) {
                event.preventDefault();
                setOpen(true);
              }
            }}
          />
          <span id={valueId} hidden>
            {date ? spoken(date) : 'Sem data'}
          </span>
        </div>
        {panel}
      </>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={`${f.control} ${s.trigger}`}
        data-size={size}
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        data-open={open || undefined}
        data-force={force}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popId : undefined}
        aria-describedby={[valueId, describedBy].filter(Boolean).join(' ')}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <CalendarDays aria-hidden="true" />
        <span className={s.text} data-empty={!date || undefined}>
          {date ? dateBR(date) : (placeholder ?? 'Selecionar data')}
        </span>
        <span id={valueId} hidden>
          {date ? spoken(date) : 'Sem data'}
        </span>
      </button>
      {panel}
    </>
  );
}

/* ——— Calendário em linha ——— */

export type CalendarEvent = {
  /** ISO `aaaa-mm-dd`. */
  date: string;
  label: string;
  /**
   * Padrão: ponto neutro (evento comum). Tons de status só quando o evento é um status — `amber`
   * para prazo. Azul é ação e seleção, nunca categoria: `accent` fica por compatibilidade e é neutro.
   */
  tone?: 'accent' | 'gray' | 'green' | 'amber' | 'orange' | 'red' | 'violet' | 'teal';
};

export type CalendarProps = {
  value?: string;
  onChange?: (value: string) => void;
  /** `range`: o primeiro clique define o início, o segundo o término (com prévia sob o ponteiro). */
  mode?: 'single' | 'range';
  start?: string;
  end?: string;
  onRangeChange?: (range: DateRange) => void;
  min?: string;
  max?: string;
  window?: DateWindow;
  /** Ponto de 4 px sob o número (até três por dia). */
  events?: CalendarEvent[];
  /** Mês visível (`aaaa-mm`), controlado. */
  month?: string;
  onMonthChange?: (month: string) => void;
  /** Hoje (ISO). Padrão: a data do aparelho. */
  today?: string;
  /** Prancha: dia sob o ponteiro (hover ou prévia da faixa). */
  hoverDate?: string;
  /** Prancha: dia com o anel de foco. */
  focusDate?: string;
  'aria-label'?: string;
};

const DOT: Record<NonNullable<CalendarEvent['tone']>, string> = {
  accent: 'var(--g-500)',
  gray: 'var(--g-500)',
  green: 'var(--green-dot)',
  amber: 'var(--amber-dot)',
  orange: 'var(--orange-dot)',
  red: 'var(--red-dot)',
  violet: 'var(--violet-dot)',
  teal: 'var(--teal-dot)',
};
const ymOf = (index: number) => {
  const { y, m } = monthOf(index);
  return `${y}-${pad(m + 1)}`;
};
function indexOfYM(value: string | undefined) {
  const match = value ? /^(\d{4})-(\d{2})$/.exec(value) : null;
  return match ? Number(match[1]) * 12 + Number(match[2]) - 1 : null;
}

/**
 * Mês em grade, no fluxo da página (agenda, painéis). Seis semanas fixas — trocar de mês não muda a
 * altura —, dias de fora do mês apagados, hoje com anel, selecionado em azul sólido, janela em faixa
 * b-50 e eventos em pontos. A grade desliza 8 px no sentido da navegação. Setas, PageUp/PageDown
 * (Shift: ano), Home/End percorrem; Enter escolhe.
 */
export function Calendar({
  value = '',
  onChange,
  mode = 'single',
  start = '',
  end = '',
  onRangeChange,
  min,
  max,
  window: marked,
  events = [],
  month,
  onMonthChange,
  today: todayProp,
  hoverDate,
  focusDate: forcedFocus,
  'aria-label': ariaLabel,
}: CalendarProps) {
  const [realToday] = useState(todayISO);
  const today = isISO(todayProp) ? todayProp : realToday;
  const lo = orNone(min);
  const hi = orNone(max);
  const isDisabled = (date: string) => Boolean((lo && date < lo) || (hi && date > hi));
  const selectedValue = orEmpty(value);
  const from = orEmpty(start);
  const to = orEmpty(end);
  const initial = (mode === 'single' ? selectedValue : from) || today;
  const [innerView, setInnerView] = useState(() => monthIndex(initial));
  const controlled = indexOfYM(month);
  const view = controlled ?? innerView;
  const [dir, setDir] = useState<'next' | 'prev'>();
  const [focusDate, setFocusDate] = useState(() => clampDate(initial, lo, hi));
  const [hover, setHover] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef(false);
  const titleId = useId();
  const markedWindow = marked && isISO(marked.start) && isISO(marked.end) ? marked : undefined;

  const byDate = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    if (!isISO(event.date)) continue;
    byDate.set(event.date, [...(byDate.get(event.date) ?? []), event]);
  }

  function goMonth(next: number) {
    if (next === view) return;
    setDir(next > view ? 'next' : 'prev');
    if (controlled === null) setInnerView(next);
    onMonthChange?.(ymOf(next));
  }

  // Seis semanas a partir do domingo anterior ao dia 1.
  const { y, m } = monthOf(view);
  const first = toISO(y, m, 1);
  const gridStart = addDays(first, -weekday(first));
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const inGrid = (date: string) => date >= gridStart && date <= (days[41] ?? gridStart);
  const inMonth = (date: string) => monthIndex(date) === view;

  const tabbable =
    [focusDate, mode === 'single' ? selectedValue : from, to, today].find(
      (date) => date && inMonth(date) && !isDisabled(date),
    ) ??
    days.find((date) => inMonth(date) && !isDisabled(date)) ??
    first;

  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    rootRef.current
      ?.querySelector<HTMLButtonElement>(`[data-date="${tabbable}"]`)
      ?.focus({ preventScroll: true });
  });

  function move(next: string) {
    const date = clampDate(next, lo, hi);
    pendingFocus.current = true;
    setFocusDate(date);
    if (mode === 'range') setHover(date);
    goMonth(monthIndex(date));
  }
  function onGridKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    const base = tabbable;
    const steps: Record<string, () => string> = {
      ArrowLeft: () => addDays(base, -1),
      ArrowRight: () => addDays(base, 1),
      ArrowUp: () => addDays(base, -7),
      ArrowDown: () => addDays(base, 7),
      PageUp: () => addMonths(base, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(base, event.shiftKey ? 12 : 1),
      Home: () => addDays(base, -weekday(base)),
      End: () => addDays(base, 6 - weekday(base)),
    };
    const step = steps[event.key];
    if (!step) return;
    event.preventDefault();
    move(step());
  }
  function pick(date: string) {
    if (isDisabled(date)) return;
    setFocusDate(date);
    if (!inMonth(date)) goMonth(monthIndex(date));
    if (mode === 'single') {
      onChange?.(date);
      return;
    }
    if (!from || to) onRangeChange?.({ start: date, end: '' });
    else onRangeChange?.(date < from ? { start: date, end: from } : { start: from, end: date });
  }

  // Período: com o início escolhido, a faixa acompanha o ponteiro até o término.
  const pointer = hoverDate ?? hover;
  const previewing =
    mode === 'range' && Boolean(from) && !to && pointer !== null && !isDisabled(pointer);
  let bandLo = from;
  let bandHi = to;
  if (previewing && pointer) {
    bandLo = pointer < from ? pointer : from;
    bandHi = pointer < from ? from : pointer;
  }
  const hasBand = mode === 'range' && Boolean(bandLo && bandHi) && bandLo < bandHi;
  const windowBand =
    mode === 'single' && markedWindow && markedWindow.start < markedWindow.end
      ? markedWindow
      : undefined;
  const prevDisabled = Boolean(lo && monthIndex(lo) >= view);
  const nextDisabled = Boolean(hi && monthIndex(hi) <= view);

  return (
    <div ref={rootRef} className={s.calendar} aria-label={ariaLabel} role="group">
      <div className={s.head}>
        <IconButton
          label="Mês anterior"
          icon={ChevronLeft}
          variant="ghost"
          size="sm"
          className={s.nav}
          disabled={prevDisabled}
          onClick={() => goMonth(view - 1)}
        />
        <div id={titleId} className={s.title} aria-live="polite">
          {monthTitle(view)}
        </div>
        <IconButton
          label="Próximo mês"
          icon={ChevronRight}
          variant="ghost"
          size="sm"
          className={s.nav}
          disabled={nextDisabled}
          onClick={() => goMonth(view + 1)}
        />
      </div>
      <table
        role="grid"
        aria-labelledby={titleId}
        className={s.grid}
        onKeyDown={onGridKeyDown}
        onPointerLeave={() => setHover(null)}
      >
        <thead>
          <tr>
            {WEEKDAYS.map(([short, long]) => (
              <th key={long} scope="col" className={s.weekday}>
                <span aria-hidden="true">{short}</span>
                <VisuallyHidden>{long}</VisuallyHidden>
              </th>
            ))}
          </tr>
        </thead>
        <tbody key={view} className={s.weeks} data-dir={dir}>
          {Array.from({ length: 6 }, (_, row) => (
            <tr key={row}>
              {days.slice(row * 7, row * 7 + 7).map((date, col) => {
                const disabled = isDisabled(date);
                const outside = !inMonth(date);
                const filled =
                  mode === 'single' ? date === selectedValue : date === from || date === to;
                const ghost = previewing && date === pointer && !filled;
                const band =
                  hasBand && !disabled && date >= bandLo && date <= bandHi
                    ? date === bandLo
                      ? 'start'
                      : date === bandHi
                        ? 'end'
                        : 'mid'
                    : windowBand && !disabled && date >= windowBand.start && date <= windowBand.end
                      ? 'mid'
                      : undefined;
                const dayEvents = byDate.get(date) ?? [];
                const selected =
                  mode === 'single'
                    ? date === selectedValue
                    : Boolean(from) && (to ? date >= from && date <= to : date === from);
                const name = [spoken(date), ...dayEvents.map((event) => event.label)].join(', ');
                const forced =
                  forcedFocus === date
                    ? 'focus'
                    : mode === 'single' && hoverDate === date
                      ? 'hover'
                      : undefined;
                return (
                  <td
                    key={date}
                    role="gridcell"
                    aria-selected={selected}
                    className={s.cell}
                    data-band={band}
                    data-cap-l={
                      band &&
                      (col === 0 || isDisabled(addDays(date, -1)) || date === windowBand?.start)
                        ? true
                        : undefined
                    }
                    data-cap-r={
                      band &&
                      (col === 6 || isDisabled(addDays(date, 1)) || date === windowBand?.end)
                        ? true
                        : undefined
                    }
                  >
                    <button
                      type="button"
                      className={s.day}
                      data-date={date}
                      data-filled={filled || undefined}
                      data-ghost={ghost || undefined}
                      data-today={date === today || undefined}
                      data-outside={outside || undefined}
                      data-force={forced}
                      tabIndex={date === tabbable && inGrid(date) ? 0 : -1}
                      aria-label={name}
                      aria-disabled={disabled || undefined}
                      aria-current={date === today ? 'date' : undefined}
                      onClick={() => pick(date)}
                      onPointerEnter={() => setHover(date)}
                      onFocus={() => setFocusDate(date)}
                    >
                      {Number(date.slice(8))}
                      {dayEvents.length > 0 && (
                        <span className={s.dots} aria-hidden="true">
                          {dayEvents.slice(0, 3).map((event, index) => (
                            <i
                              key={index}
                              style={{ '--dot': DOT[event.tone ?? 'gray'] } as CSSProperties}
                            />
                          ))}
                        </span>
                      )}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ——— Período ——— */

/**
 * Período num controle só, em dois segmentos (início → término) e a duração ao fim.
 * O calendário mostra dois meses (um abaixo de 640 px). O segmento clicado diz qual ponta o
 * próximo clique define: pelo início, o clique define o início e passa ao término; pelo término,
 * define o término e fecha (antes do início, as pontas trocam). Cada clique já confirma —
 * não há "Aplicar"; o rodapé resume o período e oferece "Limpar".
 */
export function DateRangePicker({
  start,
  end,
  onChange,
  min,
  max,
  window: marked,
  presets,
  invalid,
  startLabel = 'Início',
  endLabel = 'Término',
  ids,
  describedBy,
  'aria-label': ariaLabel,
  size = 'md',
  disabled,
  labels = false,
  required,
  placeholder,
  clearable,
  duration,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<'start' | 'end'>('start');
  // Trocar de segmento com o painel aberto reabre o calendário na ponta escolhida.
  const [panelKey, setPanelKey] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const endRef = useRef<HTMLButtonElement>(null);
  const popId = useId();
  const startValueId = useId();
  const endValueId = useId();
  const autoId = useId();
  const segmentIds = { start: ids?.start ?? `${autoId}-start`, end: ids?.end ?? `${autoId}-end` };

  const from = orEmpty(start);
  const to = orEmpty(end);
  const span = !labels && duration !== false && from && to ? spanDays(from, to) : 0;
  const showClear = Boolean(clearable && !labels && !disabled && (from || to));
  // Vazio e fechado, com placeholder: um texto só ("Qualquer período") no lugar de "Início → Término".
  const collapsed = Boolean(placeholder) && !from && !to && !open;
  const markedWindow = marked && isISO(marked.start) && isISO(marked.end) ? marked : undefined;
  const invalidStart = typeof invalid === 'object' ? Boolean(invalid.start) : Boolean(invalid);
  const invalidEnd = typeof invalid === 'object' ? Boolean(invalid.end) : Boolean(invalid);
  const describe = (which: 'start' | 'end') =>
    typeof describedBy === 'object' ? describedBy[which] : describedBy;

  // Início gravado fora dos limites (herdado de outro ativo) vale como vazio: escolhe-se o início de novo.
  const fromUsable = Boolean(
    from && !(min && isISO(min) && from < min) && !(max && isISO(max) && from > max),
  );
  function openAt(which: 'start' | 'end') {
    const next = which === 'end' && !fromUsable ? 'start' : which;
    if (open && anchor === next) {
      setOpen(false);
      return;
    }
    setAnchor(next);
    if (open) setPanelKey((key) => key + 1);
    setOpen(true);
  }
  function close(restore: boolean, which: 'start' | 'end' = anchor) {
    setOpen(false);
    if (restore) (which === 'end' ? endRef : startRef).current?.focus({ preventScroll: true });
  }
  function pick(date: string) {
    if (anchor === 'start' || !fromUsable) {
      onChange({ start: date, end: to && date <= to ? to : '' });
      setAnchor('end');
      return;
    }
    onChange(date < from ? { start: date, end: from } : { start: from, end: date });
    close(true, 'end');
  }

  /** Atributos comuns de cada ponta, no segmento (controle único) ou na caixa (`labels`). */
  const endProps = (which: 'start' | 'end') => {
    const iso = which === 'start' ? from : to;
    const invalidHere = which === 'start' ? invalidStart : invalidEnd;
    return {
      ref: which === 'start' ? startRef : endRef,
      id: segmentIds[which],
      type: 'button' as const,
      disabled,
      'aria-label': which === 'start' ? startLabel : endLabel,
      'aria-invalid': invalidHere || undefined,
      'aria-haspopup': 'dialog' as const,
      'aria-expanded': open,
      'aria-controls': open ? popId : undefined,
      'aria-describedby': [which === 'start' ? startValueId : endValueId, describe(which)]
        .filter(Boolean)
        .join(' '),
      onClick: () => openAt(which),
      onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === 'ArrowDown' && !open) {
          event.preventDefault();
          openAt(which);
        }
      },
      'data-invalid': invalidHere || undefined,
      iso,
    };
  };
  const spokenValue = (which: 'start' | 'end', iso: string) => (
    <span id={which === 'start' ? startValueId : endValueId} hidden>
      {iso ? spoken(iso) : 'Sem data'}
    </span>
  );

  const segment = (which: 'start' | 'end') => {
    const { iso, ...props } = endProps(which);
    const empty = collapsed ? placeholder : props['aria-label'];
    // Fechado e vazio com placeholder: um botão só, lido como o grupo ("Período") e o valor
    // ("Qualquer período") — não como "Início".
    const name = collapsed ? (ariaLabel ?? 'Período') : props['aria-label'];
    return (
      <button
        {...props}
        aria-label={name}
        className={s.segment}
        data-active={(open && anchor === which) || undefined}
        data-empty={!iso || undefined}
        data-placeholder={collapsed || undefined}
      >
        {iso ? dateBR(iso) : empty}
        {collapsed ? (
          <span id={startValueId} hidden>
            {placeholder}
          </span>
        ) : (
          spokenValue(which, iso)
        )}
      </button>
    );
  };

  const popover = (
    <Popover
      anchorRef={rootRef}
      open={open}
      onDismiss={(restore) => close(restore)}
      label="Escolher período"
      id={popId}
    >
      <CalendarPanel
        key={panelKey}
        mode="range"
        value=""
        start={from}
        end={to}
        anchor={anchor}
        min={orNone(min)}
        max={orNone(max)}
        marked={markedWindow}
        presets={presets}
        onPick={pick}
        onPreset={(preset) => {
          onChange({ start: preset.start, end: preset.end });
          close(true, 'end');
        }}
        onClear={() => {
          onChange({ start: '', end: '' });
          setAnchor('start');
        }}
      />
    </Popover>
  );

  if (labels) {
    // Duas caixas com rótulo, como dois campos lado a lado, e um calendário de período só.
    // A caixa da ponta que está sendo escolhida fica com o anel de foco enquanto o painel está aberto.
    const box = (which: 'start' | 'end') => {
      const { iso, ...props } = endProps(which);
      return (
        <div className={s.splitField}>
          <div className={f.labelRow}>
            <label htmlFor={props.id} className={f.label}>
              {props['aria-label']}
              {required && (
                <span className={f.required} aria-hidden="true">
                  *
                </span>
              )}
            </label>
          </div>
          <button
            {...props}
            className={`${f.control} ${s.trigger}`}
            data-size={size}
            data-disabled={disabled || undefined}
            data-open={(open && anchor === which) || undefined}
          >
            <CalendarDays aria-hidden="true" />
            <span className={s.text} data-empty={!iso || undefined}>
              {iso ? dateBR(iso) : 'Selecionar data'}
            </span>
            {spokenValue(which, iso)}
          </button>
        </div>
      );
    };
    return (
      <>
        <div ref={rootRef} role="group" aria-label={ariaLabel} className={s.split}>
          {box('start')}
          {box('end')}
        </div>
        {popover}
      </>
    );
  }

  return (
    <>
      <div
        ref={rootRef}
        role="group"
        aria-label={ariaLabel}
        className={`${f.control} ${s.range}`}
        data-size={size}
        data-invalid={invalidStart || invalidEnd || undefined}
        data-disabled={disabled || undefined}
        data-open={open || undefined}
        onClick={(event) => {
          // Clique fora dos segmentos (ícone, seta, duração) abre pela ponta que falta.
          if (disabled || (event.target as Element).closest('button')) return;
          openAt(from && !to ? 'end' : 'start');
          (from && !to ? endRef : startRef).current?.focus({ preventScroll: true });
        }}
      >
        <CalendarDays aria-hidden="true" />
        {segment('start')}
        {!collapsed && (
          <>
            <span className={s.arrow} aria-hidden="true">
              –
            </span>
            {segment('end')}
          </>
        )}
        {span > 0 && <span className={s.span}>{daysText(span)}</span>}
        {showClear && (
          <button
            type="button"
            className={`${f.clear} ${s.clear}`}
            aria-label={ariaLabel ? `Limpar ${ariaLabel.toLowerCase()}` : 'Limpar datas'}
            onClick={() => {
              onChange({ start: '', end: '' });
              setAnchor('start');
              setOpen(false);
              startRef.current?.focus({ preventScroll: true });
            }}
          >
            <X aria-hidden="true" />
          </button>
        )}
      </div>
      {popover}
    </>
  );
}

/* ——— Prancha: dias isolados ——— */

export type DayPreviewItem = {
  day: number;
  today?: boolean;
  selected?: boolean;
  outside?: boolean;
  disabled?: boolean;
  /** Dentro da faixa (janela ou período). Dias seguidos com faixa formam uma tira só. */
  band?: boolean;
  /** `hover`, `focus`. */
  force?: string;
  events?: NonNullable<CalendarEvent['tone']>[];
};

/** Uma tira de dias com o desenho do calendário, para mostrar cada estado parado. */
export function DayPreview({ days }: { days: DayPreviewItem[] }) {
  return (
    <table className={`${s.grid} ${s.dayPreview}`} role="presentation">
      <tbody>
        <tr>
          {days.map((item, index) => {
            const prev = days[index - 1];
            const next = days[index + 1];
            return (
              <td
                key={index}
                className={s.cell}
                data-band={item.band ? 'mid' : undefined}
                data-cap-l={(item.band && !prev?.band) || undefined}
                data-cap-r={(item.band && !next?.band) || undefined}
              >
                <span
                  className={s.day}
                  data-filled={item.selected || undefined}
                  data-today={item.today || undefined}
                  data-outside={item.outside || undefined}
                  data-force={item.force}
                  aria-disabled={item.disabled || undefined}
                >
                  {item.day}
                  {item.events && item.events.length > 0 && (
                    <span className={s.dots} aria-hidden="true">
                      {item.events.map((tone, dot) => (
                        <i key={dot} style={{ '--dot': DOT[tone] } as CSSProperties} />
                      ))}
                    </span>
                  )}
                </span>
              </td>
            );
          })}
        </tr>
      </tbody>
    </table>
  );
}
