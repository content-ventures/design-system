'use client';

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import s from './popover.module.css';

/* ——————————————————————————————————————————————————————————————————————————
 * Camadas — utilitários compartilhados (Popover, HoverCard, Tooltip, Dialog, Drawer, BottomSheet).
 * —————————————————————————————————————————————————————————————————————————— */

export const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export const reducedMotion = () =>
  typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

/** Mantém a camada montada durante a saída: `open` → `closing` (`exitMs`) → `closed`. */
export function usePresence(open: boolean, exitMs: number) {
  const [state, setState] = useState<'open' | 'closing' | 'closed'>(open ? 'open' : 'closed');
  if (open && state !== 'open') setState('open');
  if (!open && state === 'open') setState('closing');
  useEffect(() => {
    if (state !== 'closing') return;
    const timer = window.setTimeout(() => setState('closed'), reducedMotion() ? 0 : exitMs);
    return () => window.clearTimeout(timer);
  }, [state, exitMs]);
  return state;
}

const FOCUSABLE = [
  'a[href]',
  'button:not(:disabled)',
  'input:not(:disabled):not([type="hidden"])',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

/** Controles focáveis e visíveis de uma camada, na ordem do documento. */
export function focusablesIn(root: Element) {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.closest('[inert]') && el.getClientRects().length > 0,
  );
}

/** Tab e Shift+Tab dão a volta dentro da camada (foco preso sem depender do navegador). */
export function trapTab(event: KeyboardEvent | ReactKeyboardEvent, root: Element) {
  if (event.key !== 'Tab') return;
  const list = focusablesIn(root);
  const first = list[0];
  const last = list[list.length - 1];
  if (!first || !last) {
    event.preventDefault();
    return;
  }
  const active = document.activeElement;
  if (event.shiftKey && (active === first || !root.contains(active))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || !root.contains(active))) {
    event.preventDefault();
    first.focus();
  }
}

/** O elemento focável do gatilho (o próprio, ou o primeiro controle dentro dele). */
export function focusTarget(el: Element | null): HTMLElement | null {
  if (!el) return null;
  if (el instanceof HTMLElement && el.matches(FOCUSABLE)) return el;
  return el.querySelector<HTMLElement>(FOCUSABLE);
}

/** Onde o flutuante mora: no diálogo aberto (camada do topo) ou no escopo do tema. */
export function layerHost(from: Element | null): Element | null {
  if (!from) return null;
  return from.closest('dialog[open]') ?? from.closest('[data-ds-v3]') ?? document.body;
}

/* ——————————————————————————— Posição ——————————————————————————— */

export type Side = 'top' | 'bottom' | 'left' | 'right';
export type Align = 'start' | 'center' | 'end';
type Box = { top: number; bottom: number; left: number; right: number };
export type Placement = { top: number; left: number; side: Side; maxHeight: number };

const EDGE = 8;

/**
 * Limite vertical para virar: a janela, ou o contêiner rolável mais próximo quando ele é mais
 * apertado (a última linha de uma tabela com rolagem abre para cima).
 */
export function boundaryOf(anchor: Element): Box {
  const vh = window.innerHeight;
  const vw = document.documentElement.clientWidth;
  const box: Box = { top: 0, bottom: vh, left: 0, right: vw };
  for (let node = anchor.parentElement; node && node !== document.body; node = node.parentElement) {
    const style = getComputedStyle(node);
    const scrolls = /(auto|scroll)/.test(`${style.overflowY} ${style.overflowX}`);
    if (scrolls) {
      const rect = node.getBoundingClientRect();
      box.top = Math.max(box.top, rect.top);
      box.bottom = Math.min(box.bottom, rect.bottom);
      break;
    }
  }
  return box;
}

/** O gatilho saiu de vista (rolou para fora da janela ou de um ancestral que recorta). */
export function anchorHidden(anchor: Element) {
  const rect = anchor.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const outside = (box: { top: number; bottom: number; left: number; right: number }) =>
    y < box.top || y > box.bottom || x < box.left || x > box.right;
  if (outside({ top: 0, left: 0, bottom: window.innerHeight, right: window.innerWidth })) return true;
  for (let node = anchor.parentElement; node && node !== document.body; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (style.overflowX !== 'visible' || style.overflowY !== 'visible') {
      if (outside(node.getBoundingClientRect())) return true;
    }
  }
  return false;
}

/**
 * Ancorado ao gatilho com `gap` de folga; vira para o lado oposto quando falta espaço e fica a
 * 8 px da borda da janela.
 */
export function placeFloating(
  a: DOMRect,
  width: number,
  height: number,
  side: Side,
  align: Align,
  gap: number,
  bounds: Box,
): Placement {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const clampX = (x: number) => Math.min(Math.max(x, EDGE), Math.max(EDGE, vw - width - EDGE));
  const clampY = (y: number) => Math.min(Math.max(y, EDGE), Math.max(EDGE, vh - height - EDGE));
  if (side === 'left' || side === 'right') {
    let final: Side = side;
    let left = side === 'right' ? a.right + gap : a.left - gap - width;
    if (side === 'right' && left + width > vw - EDGE && a.left - gap - width >= EDGE) {
      final = 'left';
      left = a.left - gap - width;
    } else if (side === 'left' && left < EDGE && a.right + gap + width <= vw - EDGE) {
      final = 'right';
      left = a.right + gap;
    }
    const top = align === 'start' ? a.top : align === 'end' ? a.bottom - height : a.top + a.height / 2 - height / 2;
    return { top: clampY(top), left: clampX(left), side: final, maxHeight: vh - EDGE * 2 };
  }
  const below = bounds.bottom - a.bottom - gap - EDGE;
  const above = a.top - bounds.top - gap - EDGE;
  let final: Side = side;
  if (side === 'bottom' && height > below && above > below) final = 'top';
  if (side === 'top' && height > above && below > above) final = 'bottom';
  const room = final === 'bottom' ? vh - a.bottom - gap - EDGE : a.top - gap - EDGE;
  const h = Math.min(height, room);
  const top = final === 'bottom' ? a.bottom + gap : a.top - gap - h;
  const left = align === 'start' ? a.left : align === 'end' ? a.right - width : a.left + a.width / 2 - width / 2;
  return { top, left: clampX(left), side: final, maxHeight: Math.max(120, room) };
}

/**
 * Posiciona `panel` (fixo, num portal) junto de `anchor` antes da pintura e o acompanha na rolagem
 * e no redimensionamento. Gatilho fora de vista: `onHidden`.
 */
export function useAnchoredPosition({
  active,
  anchor,
  panel,
  side,
  align,
  gap = 6,
  onHidden,
}: {
  active: boolean;
  anchor: () => Element | null;
  panel: () => HTMLElement | null;
  side: Side;
  align: Align;
  gap?: number;
  onHidden?: () => void;
}) {
  const latest = useRef({ anchor, panel, onHidden });
  useIsoLayoutEffect(() => {
    latest.current = { anchor, panel, onHidden };
  });
  useIsoLayoutEffect(() => {
    if (!active) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const a = latest.current.anchor();
      const p = latest.current.panel();
      if (!a || !p) return;
      if (anchorHidden(a)) {
        latest.current.onHidden?.();
        return;
      }
      const rect = a.getBoundingClientRect();
      const place = placeFloating(rect, p.offsetWidth, p.scrollHeight, side, align, gap, boundaryOf(a));
      p.style.top = `${Math.round(place.top)}px`;
      p.style.left = `${Math.round(place.left)}px`;
      p.style.maxHeight = `${Math.floor(place.maxHeight)}px`;
      p.style.visibility = '';
      p.dataset.side = place.side;
    };
    const schedule = (event?: Event) => {
      const p = latest.current.panel();
      if (event?.target instanceof Node && p?.contains(event.target)) return;
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => schedule());
    const a = latest.current.anchor();
    const p = latest.current.panel();
    if (a) observer?.observe(a);
    if (p) observer?.observe(p);
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
    };
  }, [active, side, align, gap]);
}

/* ——————————————————————————— Popover ——————————————————————————— */

export type PopoverTriggerProps = {
  ref: (node: HTMLElement | null) => void;
  onClick: (event: ReactMouseEvent<HTMLElement>) => void;
  'aria-expanded': boolean;
  'aria-haspopup': 'dialog';
  'aria-controls': string | undefined;
};

type PopoverContent = ReactNode | ((api: { close: () => void }) => ReactNode);

const EXIT_MS = 120;

/**
 * Painel leve ancorado a um gatilho: papel, fio de 1px, raio 10, sombra de flutuante, sem seta.
 * Fixo na janela (nenhuma tabela ou moldura o recorta), a 6 px do gatilho; vira quando falta espaço.
 * Abre no clique; Escape, clique fora ou foco saindo fecham. O foco entra no primeiro controle
 * (se houver) e volta ao gatilho. Até 3 campos — mais que isso é gaveta.
 */
export function Popover({
  trigger,
  children,
  side = 'bottom',
  align = 'start',
  width,
  label,
  modal = false,
  open: openProp,
  onOpenChange,
  pinned = false,
  padding = 'md',
  className = '',
}: {
  /** Renderize o gatilho espalhando as props (ref, clique e ARIA). */
  trigger: (props: PopoverTriggerProps) => ReactNode;
  children: PopoverContent;
  side?: Side;
  align?: Align;
  width?: number;
  /** Nome acessível do painel. */
  label: string;
  /** Prende o foco no painel (Tab dá a volta). */
  modal?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Prancha: painel aberto e parado, no fluxo, junto do gatilho. Nunca no produto. */
  pinned?: boolean;
  /** `md` 12/14 · `none` para listas que vão de borda a borda. */
  padding?: 'md' | 'none';
  className?: string;
}) {
  const [inner, setInner] = useState(false);
  const open = openProp ?? inner;
  const presence = usePresence(open && !pinned, EXIT_MS);
  const anchorRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const id = useId();
  const latest = useRef({ open, onOpenChange, controlled: openProp !== undefined });
  useIsoLayoutEffect(() => {
    latest.current = { open, onOpenChange, controlled: openProp !== undefined };
  });

  const setOpen = (next: boolean) => {
    if (!latest.current.controlled) setInner(next);
    latest.current.onOpenChange?.(next);
  };
  const close = (returnFocus: boolean) => {
    if (!latest.current.open) return;
    setOpen(false);
    if (returnFocus) focusTarget(anchorRef.current)?.focus({ preventScroll: true });
  };
  const closeRef = useRef(close);
  useIsoLayoutEffect(() => {
    closeRef.current = close;
  });

  const mounted = presence !== 'closed';
  // Hospedeiro decidido no render da abertura: o painel já existe quando os efeitos rodam.
  const host = mounted ? layerHost(anchorRef.current) : null;

  useAnchoredPosition({
    active: presence === 'open' && Boolean(host),
    anchor: () => anchorRef.current,
    panel: () => panelRef.current,
    side,
    align,
    onHidden: () => closeRef.current(false),
  });

  // Foco: entra no primeiro controle; sem controle, fica no gatilho (Escape continua valendo).
  useEffect(() => {
    if (presence !== 'open') return;
    const panel = panelRef.current;
    if (!panel) return;
    const frame = requestAnimationFrame(() => {
      const target = panel.querySelector<HTMLElement>('[data-autofocus]') ?? focusablesIn(panel)[0];
      target?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [presence]);

  useEffect(() => {
    if (presence !== 'open') return;
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      closeRef.current(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      // Escape dentro do painel já foi tratado lá; aqui só o foco no gatilho.
      if (!anchorRef.current?.contains(document.activeElement)) return;
      event.preventDefault();
      closeRef.current(false);
    };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [presence]);

  const content = typeof children === 'function' ? children({ close: () => close(true) }) : children;
  const triggerProps: PopoverTriggerProps = {
    ref: (node) => {
      anchorRef.current = node;
    },
    onClick: (event) => {
      if (pinned) return;
      if (!anchorRef.current) anchorRef.current = event.currentTarget;
      setOpen(!open);
    },
    'aria-expanded': pinned || open,
    'aria-haspopup': 'dialog',
    'aria-controls': open ? id : undefined,
  };

  if (pinned) {
    return (
      <span className={s.pinned} data-side={side} data-align={align}>
        {trigger(triggerProps)}
        <div
          className={`${s.popover} ${className}`}
          data-static
          data-padding={padding}
          role="dialog"
          aria-label={label}
          style={{ width }}
        >
          {content}
        </div>
      </span>
    );
  }

  const style: CSSProperties = { width, top: -9999, left: -9999, visibility: 'hidden' };
  return (
    <>
      {trigger(triggerProps)}
      {mounted &&
        host &&
        createPortal(
          <div
            ref={panelRef}
            id={id}
            className={`${s.popover} ${className}`}
            role="dialog"
            aria-modal={modal || undefined}
            aria-label={label}
            data-state={presence}
            data-side={side}
            data-padding={padding}
            tabIndex={-1}
            style={style}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                close(true);
                return;
              }
              if (modal) trapTab(event, event.currentTarget);
            }}
            onBlur={(event) => {
              if (modal) return;
              const next = event.relatedTarget as Node | null;
              if (!next) return;
              if (event.currentTarget.contains(next) || anchorRef.current?.contains(next)) return;
              close(false);
            }}
          >
            {content}
          </div>,
          host,
        )}
    </>
  );
}

/** Título curto do painel (13/600), opcionalmente com ação ou meta à direita. */
export function PopoverHeader({ title, meta }: { title: ReactNode; meta?: ReactNode }) {
  return (
    <div className={s.header}>
      <span className={s.title}>{title}</span>
      {meta && <span className={s.meta}>{meta}</span>}
    </div>
  );
}

export const popoverStyles = s;
