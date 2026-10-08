'use client';

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { LiveRegion, VisuallyHidden } from './a11y';
import { Badge } from './badge';
import { Button, ButtonGroup, IconButton } from './button';
import { EmptyState, ErrorState, Skeleton, SkeletonRegion } from './feedback';
import { Highlight, SearchField, assignRef } from './fields';
import { FloatingToolbar, type FloatingToolbarDismissReason } from './floating-toolbar';
import { Check, ChevronDown, ChevronUp, Users, type LucideIcon } from './icons';
import { Avatar } from './identity';
import { LinkButton } from './link';
import { Menu, type MenuItem } from './menu';
import { Tooltip } from './overlays';
import { reducedMotion, useIsoLayoutEffect } from './popover';
import { ScrollArea } from './structure';
import { ToolbarButton } from './toolbar';
import s from './transcript-viewer.module.css';

/* ——————————————————————————— Tipos ——————————————————————————— */

export type TranscriptSpeaker = {
  id: string;
  name: string;
  /** Foto. Sem ela (ou se falhar), o orbe do nome — nunca iniciais. */
  src?: string;
};

export type TranscriptSegment = {
  id: string;
  speaker?: TranscriptSpeaker;
  /** Início em milissegundos. Sem ele, a fala não mostra tempo. */
  start?: number;
  /** Fim em milissegundos (sincronia com áudio). Sem ele, vale o início da próxima fala com tempo. */
  end?: number;
  text: string;
  /** Só pranchas: estado parado da fala (`hover`, `active`, `focus`). Nunca no produto. */
  force?: string;
};

/** Trecho selecionado dentro de uma fala. `start`/`end` são índices (UTF-16) em `text` da fala. */
export type TranscriptSelection = {
  segmentId: string;
  start: number;
  end: number;
  text: string;
};

export type TranscriptAction = {
  id: string;
  /** Começa por verbo: “Inserir citação”, “Usar como contexto”, “Perguntar à IA”. */
  label: string;
  icon?: LucideIcon;
  disabled?: boolean;
  onSelect: (selection: TranscriptSelection) => void;
};

/** Itens prontos ou render prop (compor com `ToolbarButton`/`ToolbarMenu` dentro da barra). */
export type TranscriptSelectionActions =
  TranscriptAction[] | ((selection: TranscriptSelection, api: { close: () => void }) => ReactNode);

export type TranscriptViewerProps = Omit<ComponentProps<'section'>, 'children'> & {
  /** Nome da região (“Transcrição da entrevista”). */
  label: string;
  segments: readonly TranscriptSegment[];
  /** `compact`: prévia sem busca nem filtro, até `limit` falas e “Ver transcrição completa”. */
  variant?: 'full' | 'compact';
  /** Termo buscado. Sem `query`, a busca guarda o próprio estado. */
  query?: string;
  onQueryChange?: (query: string) => void;
  /** Id do falante filtrado (`null` = todos). Sem a prop, o filtro guarda o próprio estado. */
  speakerFilter?: string | null;
  onSpeakerFilterChange?: (speakerId: string | null) => void;
  /** Fala em destaque (ex.: origem do parágrafo sob o ponteiro). Entra em vista sozinha. */
  activeId?: string | null;
  /** Falas já usadas no texto: ganham “Usado”. */
  usedIds?: readonly string[];
  /** Clique ou Enter numa fala. */
  onSegmentClick?: (segment: TranscriptSegment) => void;
  /** Seleção de texto dentro de uma única fala; `null` quando a seleção some. */
  onSelectText?: (selection: TranscriptSelection | null) => void;
  /** Ações da barra flutuante que aparece junto da seleção. */
  selectionActions?: TranscriptSelectionActions;
  /** Reservado ao áudio (R4): tempo atual em ms. Quando presente, a fala que o contém fica ativa. */
  currentTime?: number;
  /** Reservado ao áudio (R4): a marca de tempo vira botão “Ir para mm:ss”. */
  onSeek?: (ms: number) => void;
  /** `compact`: quantas falas mostrar. */
  limit?: number;
  /** `compact`: abre a transcrição inteira. */
  onExpand?: () => void;
  loading?: boolean;
  /** Falha ao carregar: o que falhou (“Não foi possível abrir a transcrição”). */
  error?: ReactNode;
  onRetry?: () => void;
  /** Sem falas. Padrão: “Nenhuma fala”. */
  empty?: ReactNode;
  /** Altura do componente; a lista rola por dentro. Também vale um pai com altura. */
  height?: number | string;
  /** Altura máxima da área de falas. */
  maxHeight?: number | string;
  /** Lista em janela. Padrão: ligada acima de 200 falas. Precisa de altura (prop ou pai). */
  virtualize?: boolean;
  /** Só pranchas: seleção parada, desenhada no texto, com a barra no fluxo. */
  pinnedSelection?: TranscriptSelection;
};

/* ——————————————————————————— Auxiliares ——————————————————————————— */

const VIRTUAL_FROM = 200;
const OVERSCAN = 480;
const TEXT_ATTR = 'data-segment-text';
const numberFormat = new Intl.NumberFormat('pt-BR');

const pad = (value: number) => String(value).padStart(2, '0');

/** Marca de tempo de fala: `mm:ss`, ou `h:mm:ss` a partir de 1 h. Recebe milissegundos. */
export function formatTimestamp(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

const isoDuration = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `PT${Math.floor(total / 3600)}H${Math.floor((total % 3600) / 60)}M${total % 60}S`;
};

/* Mesma regra do `Highlight`: sem maiúsculas nem acentos, ocorrências sem sobreposição. */
const fold = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const foldedCache = new WeakMap<TranscriptSegment, string>();
function foldedText(segment: TranscriptSegment) {
  let value = foldedCache.get(segment);
  if (value === undefined) {
    value = '';
    for (const char of segment.text) value += fold(char);
    foldedCache.set(segment, value);
  }
  return value;
}
function occurrences(haystack: string, needle: string) {
  let total = 0;
  let from = haystack.indexOf(needle);
  while (from !== -1) {
    total += 1;
    from = haystack.indexOf(needle, from + needle.length);
  }
  return total;
}

type SpeakerEntry = { speaker: TranscriptSpeaker; total: number };
function speakersOf(segments: readonly TranscriptSegment[]) {
  const map = new Map<string, SpeakerEntry>();
  for (const segment of segments) {
    if (!segment.speaker) continue;
    const entry = map.get(segment.speaker.id) ?? { speaker: segment.speaker, total: 0 };
    entry.total += 1;
    map.set(segment.speaker.id, entry);
  }
  return [...map.values()];
}

/** Intervalos de tempo de cada fala (fim = `end` ou início da próxima fala com tempo). */
function timelineOf(segments: readonly TranscriptSegment[]) {
  const spans: { id: string; from: number; to: number }[] = [];
  let next = Infinity;
  for (let i = segments.length - 1; i >= 0; i -= 1) {
    const segment = segments[i];
    if (!segment || segment.start === undefined) continue;
    spans.unshift({ id: segment.id, from: segment.start, to: segment.end ?? next });
    next = segment.start;
  }
  return spans;
}

const fullyIn = (inner: DOMRect, outer: DOMRect) =>
  inner.top >= outer.top && inner.bottom <= outer.bottom;

/** Leva `el` para a vista. Com rolagem própria, centraliza só dentro dela; sem, usa a página. */
function reveal(el: HTMLElement, viewport: HTMLElement | null, smooth: boolean, page: boolean) {
  const behavior: ScrollBehavior = smooth ? 'smooth' : 'auto';
  if (viewport && viewport.scrollHeight > viewport.clientHeight + 1) {
    const v = viewport.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (fullyIn(r, v)) return;
    const top = viewport.scrollTop + (r.top - v.top) - Math.max(0, (v.height - r.height) / 2);
    if (typeof viewport.scrollTo === 'function') viewport.scrollTo({ top, behavior });
    else viewport.scrollTop = top;
    return;
  }
  if (page) el.scrollIntoView?.({ block: 'nearest', behavior });
}

/** Seleção atual, se estiver toda dentro de uma única fala desta transcrição. */
function readSelection(root: HTMLElement | null): TranscriptSelection | null {
  if (!root || typeof window === 'undefined') return null;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
  let hit: { el: HTMLElement; part: Range } | null = null;
  for (const el of Array.from(root.querySelectorAll<HTMLElement>(`[${TEXT_ATTR}]`))) {
    if (!range.intersectsNode(el)) continue;
    const part = document.createRange();
    part.selectNodeContents(el);
    if (range.compareBoundaryPoints(Range.START_TO_START, part) > 0)
      part.setStart(range.startContainer, range.startOffset);
    if (range.compareBoundaryPoints(Range.END_TO_END, part) < 0)
      part.setEnd(range.endContainer, range.endOffset);
    if (part.collapsed || !part.toString().trim()) continue;
    if (hit) return null; // atravessa duas falas
    hit = { el, part };
  }
  if (!hit) return null;
  const before = document.createRange();
  before.selectNodeContents(hit.el);
  before.setEnd(hit.part.startContainer, hit.part.startOffset);
  const start = before.toString().length;
  const text = hit.part.toString();
  return { segmentId: hit.el.getAttribute(TEXT_ATTR) ?? '', start, end: start + text.length, text };
}

const sameSelection = (a: TranscriptSelection | null, b: TranscriptSelection | null) =>
  a === b ||
  (a !== null &&
    b !== null &&
    a.segmentId === b.segmentId &&
    a.start === b.start &&
    a.end === b.end);

/* ——————————————————————————— Janela (lista longa) ——————————————————————————— */

type Row = { segment: TranscriptSegment; groupStart: boolean; key: string };
type View = { top: number; height: number; width: number };

/** Altura estimada antes da medida: linhas de 20 px pela largura útil, + cabeçalho do falante. */
function estimateRow(row: Row, width: number) {
  const usable = Math.max(160, (width || 320) - 96);
  const lines = Math.max(1, Math.ceil(row.segment.text.length / (usable / 6.4)));
  return lines * 20 + 12 + (row.groupStart && row.segment.speaker ? 32 : 0);
}

/** Primeiro índice `j` com `offsets[j] > x` (ou `>=` com `inclusive`). */
function search(offsets: number[], x: number, inclusive: boolean) {
  let lo = 0;
  let hi = offsets.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const value = offsets[mid] ?? 0;
    if (inclusive ? value >= x : value > x) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

/**
 * Renderiza só as falas na janela (mais 480 px de folga), medindo cada uma depois de pintar.
 * Medida nova acima da janela compensa a rolagem, então o texto lido não pula.
 */
function useWindow(
  rows: Row[],
  enabled: boolean,
  viewportRef: RefObject<HTMLDivElement | null>,
  listRef: RefObject<HTMLDivElement | null>,
) {
  const heights = useRef(new Map<string, number>());
  const widthRef = useRef(0);
  const [version, setVersion] = useState(0);
  const [view, setView] = useState<View>({ top: 0, height: 0, width: 0 });

  const sync = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const next = { top: vp.scrollTop, height: vp.clientHeight, width: vp.clientWidth };
    // Largura nova quebra as linhas de outro jeito: as medidas antigas não valem mais.
    if (widthRef.current && next.width !== widthRef.current) heights.current.clear();
    widthRef.current = next.width;
    setView((prev) =>
      prev.top === next.top && prev.height === next.height && prev.width === next.width
        ? prev
        : next,
    );
  }, [viewportRef]);

  useIsoLayoutEffect(() => {
    if (!enabled) return;
    sync();
    const vp = viewportRef.current;
    if (!vp || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => sync());
    observer.observe(vp);
    return () => observer.disconnect();
  }, [enabled, sync]);

  const offsets = useMemo(() => {
    if (!enabled) return null;
    const list = [0];
    let total = 0;
    for (const row of rows) {
      total += heights.current.get(row.key) ?? estimateRow(row, view.width);
      list.push(total);
    }
    return list;
    // `version`: alturas medidas mudaram.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, rows, version, view.width]);

  useIsoLayoutEffect(() => {
    if (!offsets) return;
    const vp = viewportRef.current;
    const list = listRef.current;
    if (!vp || !list) return;
    let changed = false;
    let shift = 0;
    for (const child of Array.from(list.children)) {
      const el = child as HTMLElement;
      const key = el.dataset.key;
      const index = Number(el.dataset.index);
      if (!key || Number.isNaN(index)) continue;
      const measured = el.offsetHeight;
      const known = (offsets[index + 1] ?? 0) - (offsets[index] ?? 0);
      if (!measured || measured === known) continue;
      heights.current.set(key, measured);
      changed = true;
      if ((offsets[index] ?? 0) + known <= vp.scrollTop) shift += measured - known;
    }
    if (shift) vp.scrollTop += shift;
    if (changed) setVersion((value) => value + 1);
  });

  let start = 0;
  let end = rows.length;
  let before = 0;
  let after = 0;
  if (offsets) {
    start = Math.max(0, search(offsets, view.top - OVERSCAN, false) - 1);
    end = Math.min(
      rows.length,
      Math.max(start + 1, search(offsets, view.top + view.height + OVERSCAN, true)),
    );
    before = offsets[start] ?? 0;
    after = (offsets[rows.length] ?? 0) - (offsets[end] ?? 0);
  }
  return { start, end, before, after, offsets, sync };
}

/* ——————————————————————————— Fala ——————————————————————————— */

type RowApi = {
  click: (segment: TranscriptSegment, event: ReactMouseEvent<HTMLElement>) => void;
  keyDown: (segment: TranscriptSegment, event: ReactKeyboardEvent<HTMLElement>) => void;
  focus: (id: string) => void;
  seek: (ms: number) => void;
  lostFocus: () => void;
};

const SegmentRow = memo(function SegmentRow({
  row,
  index,
  total,
  query,
  active,
  used,
  tabbable,
  focusable,
  interactive,
  seekable,
  pinned,
  bar,
  api,
}: {
  row: Row;
  index: number;
  total: number;
  query: string;
  active: boolean;
  used: boolean;
  tabbable: boolean;
  focusable: boolean;
  interactive: boolean;
  seekable: boolean;
  pinned?: TranscriptSelection;
  bar?: ReactNode;
  api: RowApi;
}) {
  const { segment, groupStart } = row;
  const { speaker, start } = segment;
  const segmentRef = useRef<HTMLDivElement>(null);

  // Fala que sai da janela levando o foco: o foco vai para a área de rolagem, não para o body.
  useIsoLayoutEffect(() => {
    const node = segmentRef.current;
    return () => {
      if (node && node === document.activeElement) api.lostFocus();
    };
  }, [api]);

  const stamp = start === undefined ? null : formatTimestamp(start);
  const content = pinned ? (
    <>
      {segment.text.slice(0, pinned.start)}
      <span className={s.selected}>{segment.text.slice(pinned.start, pinned.end)}</span>
      {segment.text.slice(pinned.end)}
    </>
  ) : query ? (
    <Highlight text={segment.text} query={query} />
  ) : (
    segment.text
  );

  return (
    <div
      role="listitem"
      className={s.row}
      data-id={segment.id}
      data-key={row.key}
      data-index={index}
      data-first={index === 0 || undefined}
      data-group-start={groupStart || undefined}
      aria-posinset={index + 1}
      aria-setsize={total}
    >
      {groupStart && speaker && (
        // O nome vai para o leitor de tela em cada fala (abaixo); aqui é só visual.
        <div className={s.speaker} aria-hidden="true">
          <span className={s.orb}>
            <Avatar name={speaker.name} src={speaker.src} size="xs" decorative />
          </span>
          <span className={s.speakerName}>{speaker.name}</span>
        </div>
      )}
      {bar && <div className={s.pinnedBar}>{bar}</div>}
      <div
        ref={segmentRef}
        className={s.segment}
        data-segment={segment.id}
        data-active={active || undefined}
        data-used={used || undefined}
        data-interactive={interactive || undefined}
        data-force={segment.force}
        tabIndex={focusable ? (tabbable ? 0 : -1) : undefined}
        aria-current={active || undefined}
        onClick={interactive ? (event) => api.click(segment, event) : undefined}
        onKeyDown={focusable ? (event) => api.keyDown(segment, event) : undefined}
        onFocus={
          focusable
            ? (event) => {
                if (event.target === event.currentTarget) api.focus(segment.id);
              }
            : undefined
        }
      >
        <span className={s.time}>
          {start !== undefined &&
            stamp &&
            (seekable ? (
              <button
                type="button"
                className={s.seek}
                tabIndex={tabbable ? 0 : -1}
                aria-label={`Ir para ${stamp}`}
                onClick={() => api.seek(start)}
              >
                <time dateTime={isoDuration(start)}>{stamp}</time>
              </button>
            ) : (
              <time dateTime={isoDuration(start)}>{stamp}</time>
            ))}
        </span>
        <div className={s.body}>
          {speaker && <VisuallyHidden>{`${speaker.name}: `}</VisuallyHidden>}
          <span className={s.text} data-segment-text={segment.id}>
            {content}
          </span>
          {used && (
            <span className={s.used}>
              <Badge tone="gray" size="sm" icon={Check}>
                Usado
              </Badge>
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

/* ——————————————————————————— TranscriptViewer ——————————————————————————— */

/**
 * Transcrição como fonte de um texto: falas corridas, sem caixa por parágrafo e sem fio lateral.
 * Falas seguidas do mesmo falante ficam sob um só cabeçalho (orbe + nome); a calha à esquerda
 * leva a marca de tempo (`mm:ss`, tabular) quando a fala tem início.
 *
 * - Busca: destaca com `Highlight` (sem acentos/maiúsculas), conta e navega (↵ / ⇧↵ no campo).
 * - Filtro de falante num `Menu` com orbes. Fala ativa (`activeId` ou `currentTime`) ganha o
 *   fundo de seleção e entra em vista (suave; instantâneo com movimento reduzido).
 * - Selecionar texto dentro de uma fala chama `onSelectText` e abre a barra de ações.
 * - Teclado: uma parada de Tab na lista; ↑/↓, Home/End entre falas; Enter = `onSegmentClick`;
 *   ⇧Enter seleciona a fala inteira e leva o foco às ações; Alt+F10 vai à barra; Esc fecha.
 * - Acima de 200 falas, só a janela visível é renderizada (dê altura ao componente ou ao pai).
 */
export function TranscriptViewer({
  label,
  segments,
  variant = 'full',
  query: queryProp,
  onQueryChange,
  speakerFilter: filterProp,
  onSpeakerFilterChange,
  activeId,
  usedIds,
  onSegmentClick,
  onSelectText,
  selectionActions,
  currentTime,
  onSeek,
  limit = 4,
  onExpand,
  loading = false,
  error,
  onRetry,
  empty,
  height,
  maxHeight,
  virtualize,
  pinnedSelection,
  className = '',
  style,
  ref,
  ...props
}: TranscriptViewerProps) {
  const compact = variant === 'compact';
  const [innerQuery, setInnerQuery] = useState('');
  const [innerFilter, setInnerFilter] = useState<string | null>(null);
  const query = compact ? '' : (queryProp ?? innerQuery);

  const speakers = useMemo(() => speakersOf(segments), [segments]);
  const requested = compact ? null : filterProp !== undefined ? filterProp : innerFilter;
  const filterEntry = requested
    ? speakers.find((entry) => entry.speaker.id === requested)
    : undefined;
  const filter = filterEntry ? filterEntry.speaker.id : null;

  const timeMode = useMemo(() => {
    let any = false;
    for (const segment of segments) {
      if (segment.start === undefined) continue;
      if (segment.start >= 3_600_000) return 'long';
      any = true;
    }
    return any ? 'short' : 'none';
  }, [segments]);
  const gutter = timeMode !== 'none' ? timeMode : speakers.length ? 'orb' : 'none';

  const rows = useMemo<Row[]>(() => {
    const visible = filter
      ? segments.filter((segment) => segment.speaker?.id === filter)
      : segments;
    const list = compact ? visible.slice(0, Math.max(1, limit)) : visible;
    return list.map((segment, i) => {
      const groupStart = i === 0 || list[i - 1]?.speaker?.id !== segment.speaker?.id;
      return { segment, groupStart, key: `${segment.id}:${groupStart ? 'h' : 's'}` };
    });
  }, [segments, filter, compact, limit]);
  const indexOf = useMemo(() => new Map(rows.map((row, i) => [row.segment.id, i])), [rows]);
  const used = useMemo(() => new Set(usedIds ?? []), [usedIds]);
  const timeline = useMemo(() => timelineOf(segments), [segments]);
  const active =
    currentTime !== undefined
      ? (timeline.find((span) => currentTime >= span.from && currentTime < span.to)?.id ?? null)
      : (activeId ?? null);

  /* ——— Busca ——— */
  const needle = fold(query.trim());
  const matches = useMemo(() => {
    const list: { segmentId: string; index: number }[] = [];
    if (!needle) return list;
    for (const row of rows) {
      const total = occurrences(foldedText(row.segment), needle);
      for (let k = 0; k < total; k += 1) list.push({ segmentId: row.segment.id, index: k });
    }
    return list;
  }, [rows, needle]);
  const searchKey = `${needle}\u0000${filter ?? ''}`;
  const [cursor, setCursor] = useState({ key: '', index: 0, tick: 0 });
  const current =
    matches.length === 0
      ? -1
      : cursor.key === searchKey
        ? Math.min(cursor.index, matches.length - 1)
        : 0;
  const match = current >= 0 ? matches[current] : undefined;
  const step = (delta: 1 | -1) => {
    if (!matches.length) return;
    const next = (Math.max(current, 0) + delta + matches.length) % matches.length;
    setCursor((prev) => ({ key: searchKey, index: next, tick: prev.tick + 1 }));
  };

  /* ——— Refs e janela ——— */
  const rootRef = useRef<HTMLElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const showList = !loading && !error && segments.length > 0;
  const virtual = showList && !compact && (virtualize ?? rows.length > VIRTUAL_FROM);
  const win = useWindow(rows, virtual, viewportRef, listRef);

  /* ——— Seleção ——— */
  const hasActions = Boolean(selectionActions) && !compact;
  const watchSelection = hasActions || Boolean(onSelectText);
  const [selection, setSelection] = useState<TranscriptSelection | null>(null);
  const [lastSelection, setLastSelection] = useState<TranscriptSelection | null>(null);
  const selectionRef = useRef<TranscriptSelection | null>(null);
  /** Seleção feita pelo teclado (⇧Enter): a barra abre com o foco na primeira ação. */
  const [barFocus, setBarFocus] = useState(false);

  /* ——— Foco itinerante ——— */
  const [focusId, setFocusId] = useState<string | null>(null);
  const tabId =
    focusId && indexOf.has(focusId)
      ? focusId
      : active && indexOf.has(active)
        ? active
        : (rows[0]?.segment.id ?? null);
  const interactive = Boolean(onSegmentClick);
  const focusable = interactive || (watchSelection && !compact);

  const elementOf = (id: string) => {
    const list = listRef.current;
    if (!list) return null;
    for (const child of Array.from(list.children))
      if ((child as HTMLElement).dataset.id === id) return child as HTMLElement;
    return null;
  };
  const segmentOf = (id: string) =>
    elementOf(id)?.querySelector<HTMLElement>('[data-segment]') ?? null;
  const textOf = (id: string) =>
    elementOf(id)?.querySelector<HTMLElement>(`[${TEXT_ATTR}]`) ?? null;

  /* ——— Rolagem pedida (fala ativa, ocorrência, foco por teclado) ——— */
  const pending = useRef<{
    id: string;
    smooth: boolean;
    focus: boolean;
    page: boolean;
    tries: number;
  } | null>(null);
  const flush = () => {
    const wish = pending.current;
    if (!wish) return;
    const row = elementOf(wish.id);
    if (row) {
      pending.current = null;
      const target = segmentOf(wish.id) ?? row;
      reveal(target, viewportRef.current, wish.smooth && !reducedMotion(), wish.page);
      if (wish.focus) target.focus({ preventScroll: true });
      return;
    }
    // Fora da janela: rola até a posição estimada; a próxima pintura renderiza a fala.
    const index = indexOf.get(wish.id);
    const vp = viewportRef.current;
    if (index === undefined || !win.offsets || !vp || wish.tries > 3) {
      pending.current = null;
      return;
    }
    wish.tries += 1;
    vp.scrollTop = Math.max(0, (win.offsets[index] ?? 0) - vp.clientHeight / 3);
    win.sync();
  };
  const request = (id: string, options: { smooth: boolean; focus: boolean; page: boolean }) => {
    pending.current = { id, ...options, tries: 0 };
    flush();
  };
  useIsoLayoutEffect(() => {
    flush();
  });

  const mounted = useRef(false);

  // Fala ativa entra em vista. Na montagem só rola dentro da própria lista (nunca a página).
  const shownActive = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (active === shownActive.current) return;
    const first = shownActive.current === undefined;
    shownActive.current = active;
    if (!active || compact || !indexOf.has(active)) return;
    request(active, { smooth: !first, focus: false, page: !first });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, compact, indexOf]);

  // Busca: a ocorrência atual entra em vista.
  useEffect(() => {
    if (!match) return;
    request(match.segmentId, { smooth: true, focus: false, page: mounted.current });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey, current, cursor.tick]);

  // Depois dos efeitos acima: na montagem eles não rolam a página.
  useEffect(() => {
    mounted.current = true;
  }, []);

  // Ocorrência atual mais forte que as outras (as marcas vêm do `Highlight`).
  useIsoLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list
      .querySelectorAll('mark[data-current]')
      .forEach((mark) => mark.removeAttribute('data-current'));
    if (!match) return;
    const text = textOf(match.segmentId);
    text?.querySelectorAll('mark')[match.index]?.setAttribute('data-current', '');
  });

  /* ——— Callbacks recentes para as linhas memorizadas ——— */
  const latest = useRef({ onSegmentClick, onSeek, onSelectText });
  useIsoLayoutEffect(() => {
    latest.current = { onSegmentClick, onSeek, onSelectText };
  });

  const commit = useCallback((next: TranscriptSelection | null) => {
    if (sameSelection(selectionRef.current, next)) return;
    selectionRef.current = next;
    setSelection(next);
    if (next) setLastSelection(next);
    latest.current.onSelectText?.(next);
  }, []);

  const closeBar = (returnFocus: boolean) => {
    const was = selectionRef.current;
    window.getSelection()?.removeAllRanges();
    commit(null);
    if (returnFocus && was) segmentOf(was.segmentId)?.focus({ preventScroll: true });
  };

  const selectWhole = (id: string) => {
    const text = textOf(id);
    const live = window.getSelection();
    if (!text || !live) return;
    const range = document.createRange();
    range.selectNodeContents(text);
    live.removeAllRanges();
    live.addRange(range);
    setBarFocus(hasActions);
    commit(readSelection(rootRef.current));
  };

  const handlers = useRef<RowApi | null>(null);
  useIsoLayoutEffect(() => {
    handlers.current = {
      click(segment, event) {
        const handler = latest.current.onSegmentClick;
        if (!handler) return;
        if ((event.target as Element).closest('button, a')) return;
        // Terminar de selecionar texto não é clique na fala.
        const live = window.getSelection();
        if (live && !live.isCollapsed && event.currentTarget.contains(live.anchorNode)) return;
        handler(segment);
      },
      keyDown(segment, event) {
        if (event.target !== event.currentTarget) return;
        const index = indexOf.get(segment.id);
        if (index === undefined) return;
        if (event.key === 'Enter') {
          event.preventDefault();
          if (event.shiftKey) {
            if (watchSelection) selectWhole(segment.id);
          } else latest.current.onSegmentClick?.(segment);
          return;
        }
        const next =
          event.key === 'ArrowDown'
            ? index + 1
            : event.key === 'ArrowUp'
              ? index - 1
              : event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? rows.length - 1
                  : null;
        if (next === null) return;
        event.preventDefault();
        const target = rows[Math.min(rows.length - 1, Math.max(0, next))];
        if (!target || target.segment.id === segment.id) return;
        setFocusId(target.segment.id);
        request(target.segment.id, { smooth: false, focus: true, page: true });
      },
      focus(id) {
        setFocusId(id);
      },
      seek(ms) {
        latest.current.onSeek?.(ms);
      },
      lostFocus() {
        const vp = viewportRef.current;
        if (vp?.hasAttribute('tabindex')) vp.focus({ preventScroll: true });
      },
    };
  });
  const api = useMemo<RowApi>(
    () => ({
      click: (segment, event) => handlers.current?.click(segment, event),
      keyDown: (segment, event) => handlers.current?.keyDown(segment, event),
      focus: (id) => handlers.current?.focus(id),
      seek: (ms) => handlers.current?.seek(ms),
      lostFocus: () => handlers.current?.lostFocus(),
    }),
    [],
  );

  // Seleção com ponteiro: lida ao soltar; com teclado ou alças de toque, depois de uma pausa.
  useEffect(() => {
    if (!watchSelection) return;
    let timer = 0;
    let pressing = false;
    const check = () => {
      setBarFocus(false);
      commit(readSelection(rootRef.current));
    };
    const onChange = () => {
      if (pressing) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(check, 120);
    };
    const onDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) pressing = true;
    };
    const onUp = () => {
      if (!pressing) return;
      pressing = false;
      window.clearTimeout(timer);
      timer = window.setTimeout(check, 0);
    };
    document.addEventListener('selectionchange', onChange);
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('pointerup', onUp, true);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('selectionchange', onChange);
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('pointerup', onUp, true);
    };
  }, [watchSelection, commit]);

  // Ação executada: a barra fecha e a seleção some; pelo teclado, o foco volta à fala.
  const runAction = (action: TranscriptAction, keyboard: boolean) => {
    const sel = selectionRef.current ?? lastSelection;
    if (!sel || action.disabled) return;
    action.onSelect(sel);
    closeBar(keyboard);
  };
  // Esc limpa a seleção (a barra devolve o foco); clique fora só fecha (o navegador cuida do resto).
  const dismiss = (reason: FloatingToolbarDismissReason) => {
    if (reason === 'escape') window.getSelection()?.removeAllRanges();
    commit(null);
  };
  const barItems = (
    sel: TranscriptSelection,
    run: (action: TranscriptAction, keyboard: boolean) => void,
  ) =>
    !selectionActions
      ? null
      : typeof selectionActions === 'function'
        ? selectionActions(sel, { close: () => closeBar(true) })
        : selectionActions.map((action) => (
            <ToolbarButton
              key={action.id}
              label={action.label}
              icon={action.icon}
              showLabel
              disabled={action.disabled}
              onClick={(event) => run(action, event.detail === 0)}
            />
          ));
  const anchorRect = () => {
    const sel = selectionRef.current;
    const text = sel ? textOf(sel.segmentId) : null;
    if (!text) return null;
    const live = window.getSelection();
    if (live && live.rangeCount && !live.isCollapsed) {
      const range = live.getRangeAt(0);
      if (typeof range.getBoundingClientRect === 'function') {
        const box = range.getBoundingClientRect();
        if (box.width || box.height) return box;
      }
    }
    return text.getBoundingClientRect();
  };

  /* ——— Cabeçalho ——— */
  const hasQuery = Boolean(query.trim());
  const announcement = !hasQuery
    ? ''
    : matches.length
      ? `Ocorrência ${current + 1} de ${matches.length}`
      : 'Nenhuma ocorrência';

  const filterItems: MenuItem[] = [
    {
      label: 'Todos os falantes',
      icon: Users,
      meta: `${numberFormat.format(segments.length)} falas`,
      checked: filter === null,
      onSelect: () => {
        if (filterProp === undefined) setInnerFilter(null);
        onSpeakerFilterChange?.(null);
      },
    },
    ...speakers.map(({ speaker, total }) => ({
      label: speaker.name,
      leading: <Avatar name={speaker.name} src={speaker.src} size="xs" decorative />,
      meta: `${numberFormat.format(total)} ${total === 1 ? 'fala' : 'falas'}`,
      checked: filter === speaker.id,
      onSelect: () => {
        if (filterProp === undefined) setInnerFilter(speaker.id);
        onSpeakerFilterChange?.(speaker.id);
      },
    })),
  ];
  const filtered = filterEntry?.speaker;

  const header = !compact && !error && (loading || segments.length > 0) && (
    <div className={s.header}>
      <div className={s.tools}>
        <SearchField
          className={s.search}
          size="sm"
          value={query}
          onValueChange={(next) => {
            if (queryProp === undefined) setInnerQuery(next);
            onQueryChange?.(next);
          }}
          label="Buscar na transcrição"
          placeholder="Buscar"
          disabled={loading}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            step(event.shiftKey ? -1 : 1);
          }}
        />
        {speakers.length > 1 && !loading && (
          <Menu
            label="Filtrar por falante"
            align="end"
            width={256}
            sections={[{ items: filterItems }]}
            trigger={(trigger) => (
              <Button
                {...trigger}
                size="sm"
                icon={filtered ? undefined : Users}
                trailingIcon={ChevronDown}
                aria-label={`Falante: ${filtered ? filtered.name : 'todos'}`}
              >
                {filtered && (
                  <Avatar name={filtered.name} src={filtered.src} size="xs" decorative />
                )}
                <span className={s.filterLabel}>
                  {filtered ? filtered.name.split(' ')[0] : 'Falantes'}
                </span>
              </Button>
            )}
          />
        )}
      </div>
      {hasQuery && !loading && (
        <div className={s.results}>
          <span className={s.count} aria-hidden="true">
            {matches.length
              ? `${numberFormat.format(current + 1)} de ${numberFormat.format(matches.length)}`
              : 'Nenhuma ocorrência'}
          </span>
          <ButtonGroup label="Ocorrências" size="sm">
            <Tooltip content="Ocorrência anterior" shortcut="⇧↵">
              <IconButton
                size="sm"
                icon={ChevronUp}
                label="Ocorrência anterior"
                disabled={!matches.length}
                onClick={() => step(-1)}
              />
            </Tooltip>
            <Tooltip content="Próxima ocorrência" shortcut="↵">
              <IconButton
                size="sm"
                icon={ChevronDown}
                label="Próxima ocorrência"
                disabled={!matches.length}
                onClick={() => step(1)}
              />
            </Tooltip>
          </ButtonGroup>
        </div>
      )}
      <LiveRegion message={announcement} />
    </div>
  );

  /* ——— Corpo ——— */
  const renderRows = () =>
    rows.slice(win.start, win.end).map((row, i) => {
      const index = win.start + i;
      const id = row.segment.id;
      const pinned = pinnedSelection?.segmentId === id ? pinnedSelection : undefined;
      return (
        <SegmentRow
          key={id}
          row={row}
          index={index}
          total={rows.length}
          query={hasQuery ? query : ''}
          active={active === id}
          used={used.has(id)}
          tabbable={tabId === id}
          focusable={focusable}
          interactive={interactive}
          seekable={Boolean(onSeek)}
          pinned={pinned}
          bar={
            pinned && selectionActions ? (
              <FloatingToolbar pinned open label="Ações do trecho" anchor={() => null}>
                {barItems(pinned, (action) => action.onSelect(pinned))}
              </FloatingToolbar>
            ) : undefined
          }
          api={api}
        />
      );
    });

  const list = (
    <div
      ref={listRef}
      role="list"
      className={s.list}
      data-virtual={virtual || undefined}
      style={
        virtual
          ? ({ '--before': `${win.before}px`, '--after': `${win.after}px` } as CSSProperties)
          : undefined
      }
    >
      {renderRows()}
    </div>
  );

  let body: ReactNode;
  if (error) {
    body = (
      <ErrorState
        className={s.state}
        size={compact ? 'inline' : 'panel'}
        title={error}
        onRetry={onRetry}
      />
    );
  } else if (loading) {
    body = (
      <SkeletonRegion label="Carregando transcrição" className={s.skeleton}>
        {[3, 2, 4].slice(0, compact ? 2 : 3).map((lines, group) => (
          <div key={group} className={s.skeletonGroup}>
            <div className={s.speaker}>
              <span className={s.orb}>
                <Skeleton shape="circle" width={20} delay={group * 80} />
              </span>
              <Skeleton width={group % 2 ? 88 : 112} height={12} delay={group * 80} />
            </div>
            <div className={s.skeletonLines}>
              {Array.from({ length: lines }, (_, line) => (
                <Skeleton
                  key={line}
                  height={10}
                  width={line === lines - 1 ? '60%' : '100%'}
                  delay={group * 80}
                />
              ))}
            </div>
          </div>
        ))}
      </SkeletonRegion>
    );
  } else if (segments.length === 0) {
    body = (
      <EmptyState
        className={s.state}
        size={compact ? 'inline' : 'panel'}
        title={empty ?? 'Nenhuma fala'}
      />
    );
  } else if (compact) {
    body = list;
  } else {
    body = (
      <ScrollArea
        label="Falas"
        className={s.scroll}
        viewportClassName={s.viewport}
        viewportRef={viewportRef}
        maxHeight={maxHeight}
        onScroll={virtual ? win.sync : undefined}
      >
        {list}
        {hasActions && lastSelection && (
          <FloatingToolbar
            open={selection !== null}
            label="Ações do trecho"
            anchor={anchorRect}
            autoFocus={barFocus}
            onDismiss={dismiss}
          >
            {barItems(selection ?? lastSelection, runAction)}
          </FloatingToolbar>
        )}
      </ScrollArea>
    );
  }

  const hidden = compact && showList ? segments.length - rows.length : 0;

  return (
    <section
      {...props}
      ref={(node) => {
        rootRef.current = node;
        assignRef(ref, node);
      }}
      aria-label={label}
      aria-busy={loading || undefined}
      className={`${s.root} ${className}`}
      data-variant={variant}
      data-gutter={gutter}
      style={height !== undefined ? { height, ...style } : style}
    >
      {header}
      {body}
      {hidden > 0 && (
        <div className={s.more}>
          <span>
            {numberFormat.format(rows.length)} de {numberFormat.format(segments.length)} falas
          </span>
          {onExpand && <LinkButton onClick={onExpand}>Ver transcrição completa</LinkButton>}
        </div>
      )}
    </section>
  );
}
