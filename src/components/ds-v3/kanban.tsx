'use client';

import {
  CircleAlert,
  Clock,
  Mail,
  MoreHorizontal,
  Phone,
  StickyNote,
  Users,
  type LucideIcon,
} from 'lucide-react';
import {
  Children,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { useAnnouncer, VisuallyHidden } from './a11y';
import { Chip, Count, type Tone } from './badge';
import { Button, IconButton } from './button';
import { DatePicker } from './date-picker';
import { Textarea } from './fields';
import { Avatar, BrandMark } from './identity';
import { Menu, type MenuSection } from './menu';
import { Tooltip } from './overlays';
import { Select, type SelectOption } from './select';
import { Checkbox, Segmented } from './selection';
import { ExpandableText } from './structure';
import { TimeField } from './time-field';
import s from './kanban.module.css';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const reducedMotion = () =>
  typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

/* ——————————————————————————— Ícone de etapa ——————————————————————————— */

export type StageKind = 'todo' | 'progress' | 'done' | 'lost';

/**
 * Estado de uma etapa do funil desenhado em 16 px: círculo tracejado (ainda não começou),
 * pizza que cresce com o avanço, check (ganho) e X (perdido). Chapado, uma cor.
 */
export function StageIcon({
  kind,
  progress = 0.5,
  tone = 'blue',
  label,
  size = 16,
}: {
  kind: StageKind;
  /** 0–1, só para `progress`. */
  progress?: number;
  tone?: Tone;
  /** Nome acessível quando o ícone aparece sem o nome da etapa ao lado. */
  label?: string;
  size?: number;
}) {
  const a = Math.max(0.02, Math.min(0.98, progress)) * Math.PI * 2;
  const r = 3.6;
  const x = 8 + r * Math.sin(a);
  const y = 8 - r * Math.cos(a);
  const large = a > Math.PI ? 1 : 0;
  return (
    <svg
      className={s.stage}
      data-tone={kind === 'todo' ? 'gray' : tone}
      viewBox="0 0 16 16"
      width={size}
      height={size}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {kind === 'todo' && (
        <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.2 2.1" />
      )}
      {kind === 'progress' && (
        <>
          <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d={`M8 8V${8 - r}A${r} ${r} 0 ${large} 1 ${x.toFixed(3)} ${y.toFixed(3)}Z`} fill="currentColor" />
        </>
      )}
      {kind === 'done' && (
        <>
          <circle cx="8" cy="8" r="7" fill="currentColor" />
          <path d="m5.2 8.2 1.9 1.9 3.8-4" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {kind === 'lost' && (
        <>
          <circle cx="8" cy="8" r="7" fill="currentColor" />
          <path d="m5.8 5.8 4.4 4.4m0-4.4-4.4 4.4" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

/* ——————————————————————————— Arrastar e soltar ——————————————————————————— */

export type KanbanMove<C extends string> = {
  id: string;
  column: C;
  /** Cartão antes do qual o item entra; `null` = fim da coluna. */
  beforeId: string | null;
};

/** Coluna como o teclado a enxerga: ordem dos cartões e nome para os avisos. */
export type KanbanLane<C extends string> = {
  id: C;
  ids: string[];
  label: string;
  /** Recolhida: o teclado passa direto por ela. */
  collapsed?: boolean;
};

/** O que desenhar numa coluna: cartões e o espaço de destino (que cresce, some ou fica). */
export type KanbanEntry =
  | { kind: 'card'; id: string }
  | { kind: 'slot'; key: string; height: number; motion: 'enter' | 'exit' | 'none' };

type Target<C> = { column: C; beforeId: string | null };
type Slot<C> = Target<C> & { key: string; motion: 'enter' | 'none' };
type Session<C> = {
  id: string;
  from: C;
  el: HTMLElement;
  board: HTMLElement | null;
  pointerId: number;
  touch: boolean;
  startX: number;
  startY: number;
  x: number;
  y: number;
  started: boolean;
  settling: boolean;
  timer?: number;
  frame?: number;
  clone?: HTMLElement;
  offsetX: number;
  offsetY: number;
  rect?: DOMRect;
  origin?: Target<C>;
};

const DRAG_THRESHOLD = 4;
const TOUCH_HOLD = 240;
const SETTLE_MS = 180;
const EXIT_MS = 280;
const EDGE = 56;

const cardsIn = (column: Element) => [...column.querySelectorAll<HTMLElement>('[data-kanban-card]')];

/**
 * Arrastar e soltar entre colunas, com ponteiro (mouse, toque com toque longo) e teclado.
 *
 * - Ponteiro: o cartão sobe (sombra de arrasto, escala 1,02 em 180 ms) e segue o ponteiro; o espaço
 *   de destino cresce até a altura do cartão (280 ms) e o anterior encolhe. Ao soltar, o cartão
 *   assenta no espaço em 180 ms. Esc cancela e devolve o cartão.
 * - Teclado (cartão em foco): Espaço pega; ←/→ trocam de coluna; ↑/↓ mudam a ordem; Espaço solta;
 *   Esc cancela. Cada passo é anunciado numa região viva.
 *
 * O hook não guarda os dados: `onMove` recebe a posição e quem consome reordena.
 */
export function useKanbanDrag<C extends string>({
  onMove,
  lanes,
  labelOf = (id) => id,
  onDrop,
}: {
  onMove: (move: KanbanMove<C>) => void;
  /** Colunas na ordem da tela (necessário para o teclado). */
  lanes?: KanbanLane<C>[];
  /** Nome do cartão nos avisos (“Sapataria Ladeira”). */
  labelOf?: (id: string) => string;
  /** Depois de um movimento concluído (ponteiro ou teclado), com a coluna de origem. */
  onDrop?: (move: KanbanMove<C> & { from: C }) => void;
}) {
  const [drag, setDrag] = useState<{ id: string; from: C; height: number } | null>(null);
  const [slot, setSlotState] = useState<Slot<C> | null>(null);
  const [leaving, setLeaving] = useState<(Slot<C> & { at: number })[]>([]);
  const [picked, setPicked] = useState<{ id: string; from: C; origin: Target<C> } | null>(null);
  const { announce, region } = useAnnouncer();
  const hintId = useId();
  const session = useRef<Session<C> | null>(null);
  const slotRef = useRef<Slot<C> | null>(null);
  const seq = useRef(0);
  const latest = useRef({ onMove, onDrop, lanes, labelOf });
  const boardRef = useRef<HTMLElement | null>(null);
  const handlers = useRef<{
    move: (event: PointerEvent) => void;
    up: (event: PointerEvent) => void;
    cancel: () => void;
    key: (event: KeyboardEvent) => void;
    touchmove: (event: TouchEvent) => void;
  } | null>(null);

  useIsoLayoutEffect(() => {
    latest.current = { onMove, onDrop, lanes, labelOf };
  });

  const placeSlot = useCallback((next: Target<C>, motion: 'enter' | 'none') => {
    const prev = slotRef.current;
    if (prev && prev.column === next.column && prev.beforeId === next.beforeId) return;
    if (prev && motion === 'enter') {
      const gone = { ...prev, at: Date.now() };
      setLeaving((list) => [...list, gone]);
      window.setTimeout(() => setLeaving((list) => list.filter((item) => item.key !== gone.key)), EXIT_MS + 20);
    }
    seq.current += 1;
    const value: Slot<C> = { ...next, key: `slot-${seq.current}`, motion };
    slotRef.current = value;
    setSlotState(value);
  }, []);

  const clear = useCallback(() => {
    slotRef.current = null;
    setSlotState(null);
    setLeaving([]);
    setDrag(null);
  }, []);

  /* ——— Ponteiro ——— */

  // Ouvintes estáveis (adicionar e remover a mesma função), que delegam ao código da renderização atual.
  const listeners = useRef<{
    move: (event: PointerEvent) => void;
    up: (event: PointerEvent) => void;
    cancel: () => void;
    key: (event: KeyboardEvent) => void;
    touchmove: (event: TouchEvent) => void;
  } | null>(null);
  if (listeners.current === null)
    listeners.current = {
      move: (event) => handlers.current?.move(event),
      up: (event) => handlers.current?.up(event),
      cancel: () => handlers.current?.cancel(),
      key: (event) => handlers.current?.key(event),
      touchmove: (event) => handlers.current?.touchmove(event),
    };

  function detach() {
    const h = listeners.current;
    if (!h) return;
    window.removeEventListener('pointermove', h.move);
    window.removeEventListener('pointerup', h.up);
    window.removeEventListener('pointercancel', h.cancel);
    window.removeEventListener('keydown', h.key, true);
    window.removeEventListener('touchmove', h.touchmove);
  }

  function columnAt(x: number, y: number, board: HTMLElement | null): HTMLElement | null {
    const scope = board ?? document;
    const columns = [...scope.querySelectorAll<HTMLElement>('[data-kanban-column]')];
    let best: HTMLElement | null = null;
    let bestDistance = Infinity;
    for (const col of columns) {
      const rect = col.getBoundingClientRect();
      if (y < rect.top - 80 || y > rect.bottom + 80) continue;
      if (x >= rect.left && x <= rect.right) return col;
      const distance = x < rect.left ? rect.left - x : x - rect.right;
      if (distance < bestDistance && distance < 24) {
        bestDistance = distance;
        best = col;
      }
    }
    return best;
  }

  function targetAt(x: number, y: number, current: Session<C>): Target<C> | null {
    const col = columnAt(x, y, current.board);
    if (!col) return null;
    const column = col.dataset.kanbanColumn as C;
    const cards = cardsIn(col).filter((el) => el.dataset.kanbanCard !== current.id);
    let beforeId: string | null = null;
    for (const el of cards) {
      const rect = el.getBoundingClientRect();
      if (y < rect.top + rect.height / 2) {
        beforeId = el.dataset.kanbanCard ?? null;
        break;
      }
    }
    return { column, beforeId };
  }

  function autoScroll() {
    const current = session.current;
    if (!current?.started || current.settling) return;
    const board = current.board;
    if (board) {
      const rect = board.getBoundingClientRect();
      let dx = 0;
      if (current.x > rect.right - EDGE) dx = Math.min(18, (current.x - (rect.right - EDGE)) / 3);
      else if (current.x < rect.left + EDGE) dx = -Math.min(18, (rect.left + EDGE - current.x) / 3);
      if (dx) {
        board.scrollLeft += dx;
        const next = targetAt(current.x, current.y, current);
        if (next) placeSlot(next, 'enter');
      }
    }
    current.frame = window.requestAnimationFrame(autoScroll);
  }

  function begin() {
    const current = session.current;
    if (!current || current.started) return;
    current.started = true;
    const el = current.el;
    const rect = el.getBoundingClientRect();
    current.rect = rect;
    current.offsetX = current.x - rect.left;
    current.offsetY = current.y - rect.top;
    // Ponto de partida: o cartão seguinte na mesma coluna.
    const col = el.closest<HTMLElement>('[data-kanban-column]');
    const siblings = col ? cardsIn(col) : [];
    const index = siblings.indexOf(el);
    const origin: Target<C> = {
      column: current.from,
      beforeId: siblings[index + 1]?.dataset.kanbanCard ?? null,
    };
    current.origin = origin;
    // O cartão que sobe é uma cópia presa à janela; o original sai do fluxo e o espaço fica no lugar.
    const clone = el.cloneNode(true) as HTMLElement;
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
    clone.setAttribute('aria-hidden', 'true');
    clone.removeAttribute('data-kanban-card');
    if (s.dragLayer) clone.classList.add(s.dragLayer);
    clone.style.left = `${rect.left}px`;
    clone.style.top = `${rect.top}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.transformOrigin = `${current.offsetX}px ${current.offsetY}px`;
    (el.closest('[data-ds-v3]') ?? document.body).appendChild(clone);
    current.clone = clone;
    window.requestAnimationFrame(() => clone.setAttribute('data-up', ''));
    document.documentElement.dataset.kanbanDragging = '';
    slotRef.current = null;
    placeSlot(origin, 'none');
    setDrag({ id: current.id, from: current.from, height: rect.height });
    current.frame = window.requestAnimationFrame(autoScroll);
    announce(`${latest.current.labelOf(current.id)} em arrasto.`);
  }

  function finish(commit: boolean) {
    const current = session.current;
    if (!current) return;
    window.clearTimeout(current.timer);
    if (current.frame) window.cancelAnimationFrame(current.frame);
    detach();
    if (!current.started || !current.clone) {
      session.current = null;
      return;
    }
    current.settling = true;
    const clone = current.clone;
    const target = commit ? slotRef.current : null;
    if (!commit && current.origin) placeSlot(current.origin, 'enter');
    // Assenta no espaço de destino (ou volta à origem) antes de trocar a cópia pelo cartão real.
    window.requestAnimationFrame(() => {
      const board = current.board ?? document;
      const spot = board.querySelector<HTMLElement>('[data-kanban-slot="active"]');
      const rect = current.rect;
      clone.setAttribute('data-settling', '');
      clone.removeAttribute('data-up');
      if (spot && rect) {
        const box = spot.getBoundingClientRect();
        clone.style.translate = `${box.left - rect.left}px ${box.top - rect.top}px`;
      } else {
        clone.setAttribute('data-vanish', '');
      }
      const done = () => {
        const from = current.from;
        if (target) {
          const move = { id: current.id, column: target.column, beforeId: target.beforeId };
          latest.current.onMove(move);
          latest.current.onDrop?.({ ...move, from });
          const lane = latest.current.lanes?.find((item) => item.id === target.column);
          announce(`${latest.current.labelOf(current.id)} solto em ${lane?.label ?? target.column}.`);
        } else {
          announce('Movimento cancelado.');
        }
        session.current = null;
        delete document.documentElement.dataset.kanbanDragging;
        clear();
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => clone.remove()));
      };
      window.setTimeout(done, reducedMotion() ? 0 : SETTLE_MS);
    });
  }

  handlers.current = {
    move(event) {
      const current = session.current;
      if (!current || event.pointerId !== current.pointerId || current.settling) return;
      current.x = event.clientX;
      current.y = event.clientY;
      const dx = current.x - current.startX;
      const dy = current.y - current.startY;
      if (!current.started) {
        if (current.touch) {
          // Rolar antes do toque longo: não é arrasto.
          if (Math.hypot(dx, dy) > 8) finish(false);
          return;
        }
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        begin();
      }
      event.preventDefault();
      if (current.clone && current.rect) current.clone.style.translate = `${dx}px ${dy}px`;
      const next = targetAt(current.x, current.y, current);
      if (next) placeSlot(next, 'enter');
    },
    up(event) {
      const current = session.current;
      if (!current || event.pointerId !== current.pointerId) return;
      finish(current.started);
    },
    cancel() {
      finish(false);
    },
    key(event) {
      if (event.key !== 'Escape' || !session.current?.started) return;
      event.preventDefault();
      event.stopPropagation();
      finish(false);
    },
    touchmove(event) {
      if (session.current?.started) event.preventDefault();
    },
  };

  useEffect(
    () => () => {
      const current = session.current;
      if (current?.clone) current.clone.remove();
      if (current?.frame) window.cancelAnimationFrame(current.frame);
      const h = listeners.current;
      if (h) {
        window.removeEventListener('pointermove', h.move);
        window.removeEventListener('pointerup', h.up);
        window.removeEventListener('pointercancel', h.cancel);
        window.removeEventListener('keydown', h.key, true);
        window.removeEventListener('touchmove', h.touchmove);
      }
      delete document.documentElement.dataset.kanbanDragging;
    },
    [],
  );

  function onPointerDown(event: ReactPointerEvent<HTMLElement>, id: string, column: C) {
    if (event.button !== 0 || session.current || picked) return;
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select, label, [role="menu"], [data-no-drag]')) return;
    const el = event.currentTarget;
    boardRef.current = el.closest<HTMLElement>('[data-kanban-board]');
    session.current = {
      id,
      from: column,
      el,
      board: boardRef.current,
      pointerId: event.pointerId,
      touch: event.pointerType !== 'mouse',
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      started: false,
      settling: false,
      offsetX: 0,
      offsetY: 0,
    };
    const h = listeners.current;
    if (!h) return;
    window.addEventListener('pointermove', h.move, { passive: false });
    window.addEventListener('pointerup', h.up);
    window.addEventListener('pointercancel', h.cancel);
    window.addEventListener('keydown', h.key, true);
    window.addEventListener('touchmove', h.touchmove, { passive: false });
    if (session.current.touch) session.current.timer = window.setTimeout(begin, TOUCH_HOLD);
  }

  /* ——— Teclado ——— */

  const focusCard = useCallback((id: string) => {
    window.requestAnimationFrame(() => {
      const scope = boardRef.current ?? document;
      scope.querySelector<HTMLElement>(`[data-kanban-card="${CSS.escape(id)}"]`)?.focus({ preventScroll: false });
    });
  }, []);

  function laneOf(id: string) {
    const all = latest.current.lanes ?? [];
    const index = all.findIndex((lane) => lane.ids.includes(id));
    return { all, index, lane: all[index] };
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLElement>, id: string, column: C) {
    if (event.target !== event.currentTarget) return;
    const name = latest.current.labelOf(id);
    boardRef.current = event.currentTarget.closest<HTMLElement>('[data-kanban-board]');
    if (!picked) {
      if (event.key !== ' ') return;
      event.preventDefault();
      const { lane } = laneOf(id);
      const ids = lane?.ids ?? [];
      const at = ids.indexOf(id);
      setPicked({ id, from: column, origin: { column, beforeId: ids[at + 1] ?? null } });
      announce(
        `${name} pego, ${lane?.label ?? column}, posição ${at + 1} de ${ids.length}. Setas movem, Espaço solta, Esc cancela.`,
      );
      return;
    }
    if (picked.id !== id) return;
    const { all, index, lane } = laneOf(id);
    if (!lane) return;
    const ids = lane.ids;
    const at = ids.indexOf(id);
    const move = (target: Target<C>, where: string) => {
      latest.current.onMove({ id, ...target });
      announce(where);
      focusCard(id);
    };
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const rest = ids.filter((item) => item !== id);
      const nextAt = event.key === 'ArrowUp' ? Math.max(0, at - 1) : Math.min(rest.length, at + 1);
      if (nextAt === at) return;
      move({ column: lane.id, beforeId: rest[nextAt] ?? null }, `Posição ${nextAt + 1} de ${ids.length}.`);
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const step = event.key === 'ArrowLeft' ? -1 : 1;
      let target = index + step;
      while (all[target]?.collapsed) target += step;
      const next = all[target];
      if (!next) return;
      const position = Math.min(at, next.ids.length);
      move(
        { column: next.id, beforeId: next.ids[position] ?? null },
        `${next.label}, posição ${position + 1} de ${next.ids.length + 1}.`,
      );
      return;
    }
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      setPicked(null);
      announce(`${name} solto em ${lane.label}, posição ${at + 1}.`);
      if (lane.id !== picked.from) latest.current.onDrop?.({ id, column: lane.id, beforeId: ids[at + 1] ?? null, from: picked.from });
      return;
    }
    if (event.key === 'Escape' || event.key === 'Tab') {
      if (event.key === 'Escape') event.preventDefault();
      latest.current.onMove({ id, ...picked.origin });
      setPicked(null);
      announce(`Movimento cancelado. ${name} voltou para a posição de origem.`);
      if (event.key === 'Escape') focusCard(id);
    }
  }

  function cardProps(id: string, column: C) {
    return {
      'data-kanban-card': id,
      'aria-describedby': hintId,
      'aria-roledescription': 'cartão arrastável',
      onPointerDown: (event: ReactPointerEvent<HTMLElement>) => onPointerDown(event, id, column),
      onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => onKeyDown(event, id, column),
    };
  }

  function columnProps(column: C) {
    return {
      'data-kanban-column': column,
      'data-drop': (drag !== null && slot?.column === column) || undefined,
    };
  }

  /** Compatível com a versão anterior: onde desenhar o espaço (`undefined` = em lugar nenhum). */
  function slotFor(column: C, ids: string[]): string | null | undefined {
    if (!drag || slot?.column !== column) return undefined;
    const origin = ids.indexOf(drag.id);
    if (origin >= 0 && (ids[origin + 1] ?? null) === slot.beforeId) return undefined;
    return slot.beforeId;
  }

  /** Cartões e espaços de uma coluna, na ordem de desenho. O cartão em arrasto sai do fluxo. */
  function layout(column: C, ids: string[]): KanbanEntry[] {
    const visible = drag ? ids.filter((id) => id !== drag.id) : ids;
    if (!drag) return visible.map((id) => ({ kind: 'card', id }));
    const slots: { beforeId: string | null; entry: KanbanEntry }[] = [];
    for (const item of leaving)
      if (item.column === column)
        slots.push({ beforeId: item.beforeId, entry: { kind: 'slot', key: item.key, height: drag.height, motion: 'exit' } });
    if (slot && slot.column === column)
      slots.push({ beforeId: slot.beforeId, entry: { kind: 'slot', key: slot.key, height: drag.height, motion: slot.motion } });
    const out: KanbanEntry[] = [];
    for (const id of visible) {
      for (const item of slots) if (item.beforeId === id) out.push(item.entry);
      out.push({ kind: 'card', id });
    }
    for (const item of slots) if (item.beforeId === null || !visible.includes(item.beforeId)) out.push(item.entry);
    return out;
  }

  return {
    draggingId: drag?.id ?? null,
    placeholderHeight: drag?.height ?? 0,
    isDragging: drag !== null,
    /** Cartão pego pelo teclado (desenhe-o erguido). */
    pickedId: picked?.id ?? null,
    /** Coluna sob o cartão em arrasto. */
    overColumn: drag ? (slot?.column ?? null) : null,
    cardProps,
    columnProps,
    slot: slotFor,
    layout,
    /** Instruções e avisos para leitor de tela. Renderize uma vez, perto do quadro. */
    region: (
      <>
        <VisuallyHidden id={hintId}>
          Espaço pega o cartão. Setas movem entre colunas e posições. Espaço solta, Esc cancela. Enter abre.
        </VisuallyHidden>
        {region}
      </>
    ),
  };
}

/* ——————————————————————————— Quadro, coluna, espaço e vazio ——————————————————————————— */

/** Faixa de colunas com rolagem horizontal. No celular as colunas encaixam em 85% da largura. */
export function KanbanBoard({
  label,
  children,
  className = '',
  ...props
}: ComponentProps<'div'> & { label: string }) {
  return (
    <div {...props} role="region" aria-label={label} className={`${s.board} ${className}`} data-kanban-board="">
      <div className={s.boardTrack}>{children}</div>
    </div>
  );
}

/** Número que troca por esmaecimento quando o valor muda (totais da coluna). */
function Swap({ children, value }: { children: ReactNode; value: string }) {
  return (
    <span key={value} className={s.swap}>
      {children}
    </span>
  );
}

/**
 * Coluna em bandeja `--g-50`. Cabeçalho com ícone de etapa, nome, contagem e ações; o total da
 * coluna logo abaixo, em legenda. Recolhida, vira uma faixa de 44 px (ícone + contagem) que
 * ainda recebe cartões.
 */
export function KanbanColumn({
  title,
  icon,
  count,
  total,
  totalHint,
  actions,
  collapsed = false,
  onExpand,
  empty,
  footer,
  children,
  width,
  className = '',
  style,
  ...props
}: Omit<ComponentProps<'section'>, 'title'> & {
  title: string;
  icon?: ReactNode;
  count: number;
  /** Valor somado da coluna, já formatado. */
  total?: ReactNode;
  totalHint?: ReactNode;
  actions?: ReactNode;
  collapsed?: boolean;
  onExpand?: () => void;
  /** Mostrado quando a coluna não tem cartões. */
  empty?: ReactNode;
  /** Fora da lista, no pé da coluna (ex.: “Mostrar mais”). */
  footer?: ReactNode;
  width?: number;
  'data-drop'?: boolean;
  'data-kanban-column'?: string;
}) {
  const headingId = useId();
  const noun = count === 1 ? 'lead' : 'leads';
  if (collapsed) {
    return (
      <section
        {...props}
        className={`${s.column} ${className}`}
        data-collapsed="true"
        aria-labelledby={headingId}
        style={style}
      >
        <Tooltip content={`${title} · ${count} ${noun}`}>
          <button
            type="button"
            className={s.collapsedButton}
            onClick={onExpand}
            aria-expanded={false}
            aria-label={`Expandir ${title}, ${count} ${noun}`}
          >
            {icon}
            <Count>{count}</Count>
            <span id={headingId} hidden>
              {title}
            </span>
          </button>
        </Tooltip>
      </section>
    );
  }
  const hasCards = Children.toArray(children).length > 0;
  const totalText = typeof total === 'string' || typeof total === 'number' ? String(total) : '';
  return (
    <section
      {...props}
      className={`${s.column} ${className}`}
      aria-labelledby={headingId}
      style={width ? ({ ...style, '--col-w': `${width}px` } as CSSProperties) : style}
    >
      <header className={s.columnHead}>
        <div className={s.columnTitleRow}>
          {icon && <span className={s.columnIcon}>{icon}</span>}
          <h3 id={headingId} className={s.columnTitle}>
            {title}
          </h3>
          <Count label={`${count} ${noun}`}>
            <Swap value={String(count)}>{count}</Swap>
          </Count>
          {actions && <div className={s.columnActions}>{actions}</div>}
        </div>
        {total !== undefined && (
          <p className={s.columnTotal}>
            <Swap value={totalText}>
              {total}
              {totalHint && <> {totalHint}</>}
            </Swap>
          </p>
        )}
      </header>
      <div className={s.columnBody} role="list" aria-labelledby={headingId}>
        {children}
        {!hasCards && empty}
      </div>
      {footer && <div className={s.columnFoot}>{footer}</div>}
    </section>
  );
}

/**
 * Espaço tracejado onde o cartão vai entrar: cresce até a altura do cartão (280 ms) e encolhe ao
 * sair. `height="auto"` estica até o contêiner.
 */
export function KanbanPlaceholder({
  height = 96,
  label = 'Solte aqui',
  motion = 'none',
  slotKey,
}: {
  height?: number | 'auto';
  label?: string;
  motion?: 'enter' | 'exit' | 'none';
  slotKey?: string;
}) {
  return (
    <div
      className={s.placeholder}
      data-motion={motion}
      data-kanban-slot={motion === 'exit' ? 'leaving' : 'active'}
      data-key={slotKey}
      style={height === 'auto' ? undefined : ({ '--h': `${height}px` } as CSSProperties)}
      role="presentation"
    >
      <span>{label}</span>
    </div>
  );
}

/** Coluna sem cartões: uma linha discreta; durante o arrasto, vira o convite para soltar. */
export function KanbanEmpty({
  title,
  description,
  action,
  active = false,
  compact = false,
}: {
  /** Mantido por compatibilidade: o vazio da coluna não leva ícone. */
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  /** Um cartão está sendo arrastado sobre a coluna. */
  active?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={s.empty} data-active={active || undefined} data-compact={compact || undefined} role="listitem">
      <span className={s.emptyTitle}>{active ? 'Solte aqui' : title}</span>
      {description && !active && <span className={s.emptyDesc}>{description}</span>}
      {action && !active && action}
    </div>
  );
}

/** Botão só-ícone compacto (24 px) para cabeçalhos de coluna e cartão. */
export function KanbanIconButton(props: Omit<ComponentProps<typeof IconButton>, 'variant' | 'size'>) {
  return <IconButton {...props} variant="ghost" size="sm" className={`${s.mini} ${props.className ?? ''}`} />;
}

/* ——————————————————————————— Próxima ação ——————————————————————————— */

export type NextActionDue = 'today' | 'overdue' | 'later';

/**
 * Compromisso com data: relógio de 13 px e o texto. Hoje = laranja, atrasado = vermelho, depois =
 * texto. `chip` desenha a etiqueta do registro de atividade; `done` risca.
 */
export function NextAction({
  label,
  due = 'later',
  variant = 'line',
  done = false,
}: {
  label: ReactNode;
  due?: NextActionDue;
  variant?: 'line' | 'chip';
  done?: boolean;
}) {
  return (
    <span className={s.nextAction} data-due={due} data-variant={variant} data-done={done || undefined}>
      <Clock aria-hidden="true" />
      <span className={s.nextActionText}>{label}</span>
      {!done && due === 'overdue' && <VisuallyHidden>, atrasada</VisuallyHidden>}
      {done && <VisuallyHidden>, concluída</VisuallyHidden>}
    </span>
  );
}

/* ——————————————————————————— Cartão de lead ——————————————————————————— */

export type LeadInterest = { label: string; tone?: Tone };
export type LeadNote = {
  tone: 'orange' | 'green' | 'red' | 'amber' | 'blue';
  icon?: LucideIcon;
  text: ReactNode;
};
export type LeadOutcome = { kind: 'won'; date: string } | { kind: 'lost'; reason: string };

const money = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });

export type LeadCardProps = Omit<ComponentProps<'article'>, 'children'> & {
  company: string;
  /** Código do lead, sem o “#”. */
  code: string;
  /** Responsável. */
  owner: string;
  /** Origem (“Vitrine”). O ícone é ignorado: o cartão não tem linha de ícones. */
  source?: { label: string; icon?: LucideIcon };
  /** Origem em texto; vence `source`. */
  origin?: string;
  value?: number | null;
  /** Mantido por compatibilidade; o contato fica no detalhe do lead. */
  contact?: string | null;
  interests?: LeadInterest[];
  /** Forma antiga da próxima ação (`overdue` = vermelho). */
  nextStep?: { label: string; date: string; overdue?: boolean } | null;
  /** Próxima ação: “Retornar hoje às 14:00”. */
  nextAction?: { label: string; due?: NextActionDue } | null;
  /** Mantidos por compatibilidade (o cartão enxuto não mostra contadores). */
  attachments?: number;
  comments?: number;
  /** Última atividade (“há 2 h”); aparece quando não há `age`. */
  activity?: string;
  /** Dias na etapa. Acima de 7, em âmbar. */
  age?: number;
  density?: 'default' | 'compact';
  selected?: boolean;
  /** Erguido: o cartão está nas mãos de quem arrasta (ou pego pelo teclado). */
  lifted?: boolean;
  /** Fantasma: o lugar de origem enquanto o cartão é arrastado. */
  ghost?: boolean;
  /** Linha de nota no pé (alerta curto). */
  note?: LeadNote;
  /** Ganho em … / Perdido · motivo. */
  outcome?: LeadOutcome;
  /** Gatilho de menu de ações (use `KanbanIconButton` dentro de um `Menu`). */
  menu?: ReactNode;
  /** Teto de interesses visíveis (padrão 2); o resto vira “+N”. */
  maxInterests?: number;
  /** Abre o detalhe (clique e Enter). O cartão vira focável. */
  onOpen?: () => void;
  /** Prancha: `hover`, `focus`. */
  'data-force'?: string;
};

/**
 * Cartão de lead enxuto: papel, fio de 1 px, raio 10, sem sombra em repouso. Três linhas —
 * marca e empresa; valor e origem; responsável e tempo na etapa — e, quando houver, a próxima
 * ação, até dois interesses e o desfecho. Nada de linhas rotuladas com ícone.
 */
export function LeadCard({
  company,
  code,
  owner,
  source,
  origin,
  value,
  contact: _contact,
  interests = [],
  nextStep,
  nextAction,
  attachments: _attachments,
  comments: _comments,
  activity,
  age,
  density = 'default',
  selected = false,
  lifted = false,
  ghost = false,
  note,
  outcome,
  menu,
  maxInterests = 2,
  onOpen,
  className = '',
  onClick,
  onKeyDown,
  ...props
}: LeadCardProps) {
  const nameId = useId();
  const summaryId = useId();
  const from = origin ?? source?.label;
  const next =
    nextAction ??
    (nextStep ? { label: `${nextStep.label} · ${nextStep.date}`, due: nextStep.overdue ? 'overdue' : 'later' } : null);
  const shown = interests.slice(0, Math.max(0, maxInterests));
  const rest = interests.slice(shown.length);
  const stale = age !== undefined && age > 7;
  const describedBy = [summaryId, props['aria-describedby']].filter(Boolean).join(' ');

  const valueNode =
    value != null ? (
      <span className={s.value}>{money(value)}</span>
    ) : (
      <span className={s.valueMissing}>Sem valor</span>
    );

  const menuNode = menu && (
    <span
      className={s.cardMenu}
      data-no-drag=""
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {menu}
    </span>
  );

  return (
    <article
      {...props}
      className={`${s.card} ${className}`}
      data-density={density}
      data-selected={selected || undefined}
      data-lifted={lifted || undefined}
      data-ghost={ghost || undefined}
      data-outcome={outcome?.kind}
      data-open={onOpen ? true : undefined}
      tabIndex={props.tabIndex ?? (onOpen ? 0 : undefined)}
      aria-labelledby={nameId}
      aria-describedby={describedBy}
      aria-current={selected ? 'true' : undefined}
      role={props.role ?? 'listitem'}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onOpen?.();
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented && event.key === 'Enter' && event.target === event.currentTarget) onOpen?.();
      }}
    >
      <div className={s.cardHead}>
        <BrandMark name={company} size="xs" variant="soft" decorative />
        <h4 id={nameId} className={s.company} title={company}>
          {company}
        </h4>
        <span className={s.code}>
          <span aria-hidden="true">#</span>
          {code}
        </span>
        {menuNode}
      </div>
      {density === 'compact' ? (
        <div className={s.cardRow}>
          {valueNode}
          <span className={s.owner}>
            <Avatar name={owner} size="xs" />
          </span>
        </div>
      ) : (
        <>
          <div className={s.cardRow} data-start="">
            {valueNode}
            {from && (
              <span className={s.origin}>
                <span aria-hidden="true">·</span> {from}
              </span>
            )}
          </div>
          <div className={s.cardRow}>
            <span className={s.owner}>
              <Avatar name={owner} size="xs" decorative />
              <span className={s.ownerName}>{owner}</span>
            </span>
            {outcome ? null : age !== undefined ? (
              <span className={s.age} data-stale={stale || undefined} title={`${age} ${age === 1 ? 'dia' : 'dias'} na etapa`}>
                {age} d<VisuallyHidden>{age === 1 ? 'ia na etapa' : 'ias na etapa'}</VisuallyHidden>
              </span>
            ) : (
              activity && <span className={s.age}>{activity}</span>
            )}
          </div>
          {next && !outcome && (
            <div className={s.cardLine}>
              <NextAction label={next.label} due={next.due} />
            </div>
          )}
          {shown.length > 0 && !outcome && (
            <div className={s.tags}>
              {shown.map((item) => (
                <Chip key={item.label} variant="neutral" size="sm">
                  {item.label}
                </Chip>
              ))}
              {rest.length > 0 && (
                <Tooltip content={rest.map((item) => item.label).join(', ')}>
                  <span className={s.more} tabIndex={-1}>
                    <Count label={`Mais ${rest.length}: ${rest.map((item) => item.label).join(', ')}`}>+{rest.length}</Count>
                  </span>
                </Tooltip>
              )}
            </div>
          )}
        </>
      )}
      {outcome && (
        <div className={s.outcome} data-kind={outcome.kind}>
          <i aria-hidden="true" />
          {outcome.kind === 'won' ? `Ganho em ${outcome.date}` : `Perdido · ${outcome.reason}`}
        </div>
      )}
      {note && !outcome && (
        <div className={s.note} data-tone={note.tone}>
          <i aria-hidden="true" />
          <span>{note.text}</span>
        </div>
      )}
      <VisuallyHidden>
        <span id={summaryId}>
          {`Lead ${code}. Responsável ${owner}. `}
          {value != null ? `Valor ${money(value)}. ` : ''}
          {from ? `Origem ${from}. ` : ''}
          {age !== undefined ? `${age} dias na etapa. ` : ''}
        </span>
      </VisuallyHidden>
    </article>
  );
}

/* ——————————————————————————— Registro de atividade ——————————————————————————— */

export type ActivityKind = 'call' | 'email' | 'meeting' | 'note';

export const activityKinds: { value: ActivityKind; label: string; icon: LucideIcon; verb: string }[] = [
  { value: 'call', label: 'Ligação', icon: Phone, verb: 'registrou uma ligação' },
  { value: 'email', label: 'E-mail', icon: Mail, verb: 'registrou um e-mail' },
  { value: 'meeting', label: 'Reunião', icon: Users, verb: 'registrou uma reunião' },
  { value: 'note', label: 'Nota', icon: StickyNote, verb: 'adicionou uma nota' },
];

export type ActivityDraft = {
  kind: ActivityKind;
  text: string;
  /** Próxima ação: data ISO e hora `HH:mm` (opcionais). */
  date: string;
  time: string;
  owner: string;
};

export type ActivityEntry = {
  id: string;
  kind: ActivityKind;
  author: string;
  /** Relativo: “há 2 h”, “ontem”. */
  when: string;
  text: string;
  next?: { label: string; due: NextActionDue; done?: boolean } | null;
};

function useNarrow<T extends HTMLElement>(limit: number) {
  const ref = useRef<T>(null);
  const [narrow, setNarrow] = useState(false);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const measure = () => setNarrow(el.clientWidth < limit);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [limit]);
  return [ref, narrow] as const;
}

/**
 * Compositor do registro: tipo (Ligação, E-mail, Reunião, Nota), texto que cresce, próxima ação
 * (data, hora e, opcional, responsável) e “Registrar”. Vazio → “Escreva o registro” no próprio
 * campo; enviando → botão em espera; registrado → limpa e devolve o foco ao texto.
 */
export function ActivityComposer({
  onSubmit,
  owners,
  defaultValue,
  sending: sendingProp,
  error: errorProp,
  submitLabel = 'Registrar',
  label = 'Registrar atividade',
  'data-force': force,
}: {
  onSubmit?: (draft: ActivityDraft) => void;
  /** Responsáveis possíveis da próxima ação; sem lista, o campo some. */
  owners?: SelectOption[];
  defaultValue?: Partial<ActivityDraft>;
  /** Prancha: retrato parado do envio. */
  sending?: boolean;
  /** Prancha: retrato parado do erro. */
  error?: string;
  submitLabel?: string;
  label?: string;
  /** Prancha: `focus` no texto. */
  'data-force'?: string;
}) {
  const id = useId();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [rootRef, narrow] = useNarrow<HTMLFormElement>(440);
  const [kind, setKind] = useState<ActivityKind>(defaultValue?.kind ?? 'call');
  const [text, setText] = useState(defaultValue?.text ?? '');
  const [date, setDate] = useState(defaultValue?.date ?? '');
  const [time, setTime] = useState(defaultValue?.time ?? '');
  const [owner, setOwner] = useState(defaultValue?.owner ?? owners?.[0]?.value ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const sending = sendingProp ?? busy;
  const shownError = errorProp ?? error;
  const errorId = `${id}-error`;

  function submit() {
    if (sending) return;
    if (!text.trim()) {
      setError('Escreva o registro');
      textRef.current?.focus();
      return;
    }
    setBusy(true);
    timer.current = window.setTimeout(() => {
      onSubmit?.({ kind, text: text.trim(), date, time, owner });
      setBusy(false);
      setText('');
      setDate('');
      setTime('');
      textRef.current?.focus();
    }, reducedMotion() ? 0 : 400);
  }

  return (
    <form
      ref={rootRef}
      className={s.composer}
      aria-label={label}
      data-invalid={shownError ? true : undefined}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <Segmented
        label="Tipo de atividade"
        size="sm"
        value={kind}
        onChange={setKind}
        options={activityKinds.map((item) => ({ value: item.value, label: item.label, icon: item.icon, iconOnly: narrow }))}
      />
      <div className={s.composerText}>
        <Textarea
          ref={textRef}
          aria-label="Registro"
          placeholder="O que foi conversado?"
          value={text}
          rows={2}
          autoSize={{ minRows: 2, maxRows: 8 }}
          invalid={Boolean(shownError)}
          aria-describedby={shownError ? errorId : undefined}
          data-force={force}
          onChange={(event) => {
            setText(event.target.value);
            if (error) setError(undefined);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              submit();
            }
          }}
        />
        {shownError && (
          <p id={errorId} className={s.composerError} role="alert">
            <CircleAlert aria-hidden="true" />
            {shownError}
          </p>
        )}
      </div>
      <div className={s.composerFoot}>
        <span className={s.composerLabel} id={`${id}-next`}>
          Próxima ação
        </span>
        <div className={s.composerNext} role="group" aria-labelledby={`${id}-next`}>
          <span className={s.composerDate}>
            <DatePicker value={date} onChange={setDate} size="sm" aria-label="Data da próxima ação" placeholder="Data" />
          </span>
          <span className={s.composerTime}>
            <TimeField value={time} onChange={setTime} size="sm" label="Hora da próxima ação" placeholder="Hora" />
          </span>
          {owners && owners.length > 0 && (
            <span className={s.composerOwner}>
              <Select value={owner} onChange={setOwner} options={owners} size="sm" label="Responsável" />
            </span>
          )}
        </div>
        <Button type="submit" variant="primary" size="sm" loading={sending} className={s.composerSubmit}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

/**
 * Registro em linha do tempo: orbe do autor, “Rafael Dias registrou uma ligação”, quando, o texto
 * (3 linhas, “ver tudo”) e a próxima ação com “Concluir”. Entrada nova cresce e esmaece em 280 ms;
 * concluir risca a ação em 180 ms. Menu da entrada: Editar, Excluir.
 */
export function ActivityFeed({
  items,
  onToggleNext,
  onEdit,
  onDelete,
  label = 'Atividades',
  'data-force': force,
}: {
  items: ActivityEntry[];
  onToggleNext?: (id: string, done: boolean) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  label?: string;
  /** Prancha: `hover` na primeira entrada. */
  'data-force'?: string;
}) {
  const first = useRef<Set<string> | null>(null);
  if (first.current === null) first.current = new Set(items.map((item) => item.id));
  const known = first.current;
  return (
    <ol className={s.feed} aria-label={label}>
      {items.map((item, index) => {
        const meta = activityKinds.find((kind) => kind.value === item.kind) ?? activityKinds[0];
        const sections: MenuSection[] = [
          {
            items: [
              { label: 'Editar', onSelect: () => onEdit?.(item.id) },
              { label: 'Excluir', danger: true, onSelect: () => onDelete?.(item.id) },
            ],
          },
        ];
        return (
          <li
            key={item.id}
            className={s.entry}
            data-enter={!known.has(item.id) || undefined}
            data-force={index === 0 ? force : undefined}
          >
            <div className={s.entryInner}>
              <span className={s.entryMarker} aria-hidden="true">
                <Avatar name={item.author} size="xs" decorative />
              </span>
              <div className={s.entryBody}>
                <div className={s.entryHead}>
                  <p className={s.entryTitle}>
                    <b>{item.author}</b> {meta?.verb}
                  </p>
                  <span className={s.entryWhen}>{item.when}</span>
                  <span className={s.entryMenu}>
                    <Menu
                      label={`Ações do registro de ${item.author}`}
                      align="end"
                      width={160}
                      sections={sections}
                      trigger={(trigger) => (
                        <IconButton {...trigger} label="Ações do registro" icon={MoreHorizontal} variant="ghost" size="sm" className={s.mini} />
                      )}
                    />
                  </span>
                </div>
                <div className={s.entryText}>
                  <ExpandableText lines={3}>{item.text}</ExpandableText>
                </div>
                {item.next && (
                  <div className={s.entryNext} data-done={item.next.done || undefined}>
                    <NextAction label={item.next.label} due={item.next.due} variant="chip" done={item.next.done} />
                    <Checkbox
                      label="Concluir"
                      checked={Boolean(item.next.done)}
                      onChange={(event) => onToggleNext?.(item.id, event.target.checked)}
                    />
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
