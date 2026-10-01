'use client';

import { Check, ChevronRight, type LucideIcon } from 'lucide-react';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Kbd } from './badge';
import s from './menu.module.css';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export type MenuItem = {
  label: string;
  icon?: LucideIcon;
  /** Marca, avatar ou bloco no lugar do ícone. */
  leading?: ReactNode;
  /** Segunda linha. Num item indisponível, diz o motivo. */
  description?: string;
  /** Texto curto à direita, em cinza (ex.: “Encerrado”). */
  meta?: string;
  shortcut?: string;
  /** Item de escolha única: `true` mostra o check azul à direita. */
  checked?: boolean;
  danger?: boolean;
  disabled?: boolean;
  /** Esmaecido, mas ainda escolhível (portal encerrado). */
  muted?: boolean;
  /** Destaque de hover fixo, só para documentação (equivale a `force: 'hover'`). */
  active?: boolean;
  /** Estado parado para pranchas: `hover`, `active` ou `focus`. */
  force?: string;
  /** Submenu: abre à direita depois de 120 ms de hover, com → ou Enter. */
  items?: MenuItem[];
  onSelect?: () => void;
};
export type MenuSection = { label?: string; items: MenuItem[] };

/* ——————————————————————————— Posição ——————————————————————————— */

type Rect = { top: number; left: number; right: number; bottom: number };
type Side = 'bottom' | 'top' | 'right' | 'left';
type Align = 'start' | 'end';
type Placed = { top: number; left: number; side: Side; align: Align; maxHeight?: number };

const EDGE = 8;

/** Ancorado ao gatilho, vira para o outro lado quando falta espaço e fica a 8 px da borda da janela. */
function place(anchor: Rect, width: number, height: number, side: Side, align: Align, gap: number): Placed {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  if (side === 'right' || side === 'left') {
    let finalSide: Side = side;
    let left = side === 'right' ? anchor.right + gap : anchor.left - gap - width;
    if (side === 'right' && left + width > vw - EDGE) {
      finalSide = 'left';
      left = anchor.left - gap - width;
    } else if (side === 'left' && left < EDGE) {
      finalSide = 'right';
      left = anchor.right + gap;
    }
    left = Math.min(Math.max(left, EDGE), Math.max(EDGE, vw - width - EDGE));
    const top = Math.min(Math.max(anchor.top, EDGE), Math.max(EDGE, vh - height - EDGE));
    return { top, left, side: finalSide, align: 'start', maxHeight: vh - EDGE * 2 };
  }
  const below = vh - anchor.bottom - gap - EDGE;
  const above = anchor.top - gap - EDGE;
  let finalSide: Side = side;
  if (side === 'bottom' && height > below && above > below) finalSide = 'top';
  if (side === 'top' && height > above && below > above) finalSide = 'bottom';
  const room = finalSide === 'bottom' ? below : above;
  const h = Math.min(height, room);
  const top = finalSide === 'bottom' ? anchor.bottom + gap : anchor.top - gap - h;
  let finalAlign = align;
  let left = align === 'start' ? anchor.left : anchor.right - width;
  if (align === 'start' && left + width > vw - EDGE && anchor.right - width >= EDGE) {
    finalAlign = 'end';
    left = anchor.right - width;
  } else if (align === 'end' && left < EDGE && anchor.left + width <= vw - EDGE) {
    finalAlign = 'start';
    left = anchor.left;
  }
  left = Math.min(Math.max(left, EDGE), Math.max(EDGE, vw - width - EDGE));
  return { top, left, side: finalSide, align: finalAlign, maxHeight: height > room ? Math.max(room, 120) : undefined };
}

const ORIGIN: Record<Side, Record<Align, string>> = {
  bottom: { start: 'top left', end: 'top right' },
  top: { start: 'bottom left', end: 'bottom right' },
  right: { start: 'top left', end: 'top left' },
  left: { start: 'top right', end: 'top right' },
};

/** Onde o flutuante deve morar: no diálogo aberto (camada do topo) ou no escopo do tema. */
export function floatingHost(from: Element | null): Element | null {
  if (!from) return null;
  return from.closest('dialog[open]') ?? from.closest('[data-ds-v3]') ?? document.body;
}

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const ITEM_SELECTOR = '[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]';

/* ——————————————————————————— Superfície ——————————————————————————— */

export type MenuSurfaceProps = {
  sections: MenuSection[];
  label: string;
  id?: string;
  /** Liga todos os painéis do mesmo menu (clique fora ignora qualquer um deles). */
  rootId: string;
  host?: Element | null;
  /** Retângulo de ancoragem, lido a cada reposicionamento. */
  anchor?: () => Rect | null;
  side?: Side;
  align?: Align;
  gap?: number;
  width?: number;
  phase?: 'open' | 'closing';
  isStatic?: boolean;
  level?: number;
  /** Foco inicial ao abrir. `panel`: aberto pelo ponteiro — nenhum item destacado até a primeira seta. */
  initialFocus?: 'first' | 'last' | 'checked' | 'panel' | 'none';
  /** Fecha o menu inteiro. */
  onDismiss?: (returnFocus: boolean) => void;
  /** Fecha só este submenu e devolve o foco ao item pai. */
  onBack?: () => void;
  onPointerEnterPanel?: () => void;
};

/**
 * Painel de menu: itens, seções, submenus, teclado (setas, Home/End, digitação) e posição fixa.
 * Usado por `Menu`, `ContextMenu` e `MenuPanel` (estático, para pranchas).
 */
export function MenuSurface({
  sections,
  label,
  id,
  rootId,
  host,
  anchor,
  side = 'bottom',
  align = 'start',
  gap = 6,
  width,
  phase = 'open',
  isStatic = false,
  level = 0,
  initialFocus = 'first',
  onDismiss,
  onBack,
  onPointerEnterPanel,
}: MenuSurfaceProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef(anchor);
  const [pos, setPos] = useState<Placed | null>(null);
  const [sub, setSub] = useState<{ key: string; focus: boolean } | null>(null);
  const subTimer = useRef<number | undefined>(undefined);
  const typed = useRef({ text: '', at: 0 });
  const focused = useRef(false);

  useEffect(() => {
    anchorRef.current = anchor;
  }, [anchor]);

  useIsoLayoutEffect(() => {
    if (isStatic) return;
    const panel = panelRef.current;
    if (!panel) return;
    let frame = 0;
    const update = () => {
      const rect = anchorRef.current?.();
      if (!rect) return;
      setPos(place(rect, panel.offsetWidth, panel.scrollHeight, side, align, gap));
    };
    update();
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
    };
  }, [isStatic, side, align, gap]);

  // Foco inicial: depois de posicionado (nada de rolar a página para um painel ainda fora do lugar).
  useEffect(() => {
    if (isStatic || !pos || focused.current || initialFocus === 'none') return;
    focused.current = true;
    const list = itemsOf(panelRef.current);
    if (initialFocus === 'panel') {
      panelRef.current?.focus({ preventScroll: true });
      return;
    }
    const target =
      initialFocus === 'last'
        ? list[list.length - 1]
        : initialFocus === 'checked'
          ? (list.find((el) => el.getAttribute('aria-checked') === 'true') ?? list[0])
          : list.find((el) => el.getAttribute('aria-disabled') !== 'true');
    (target ?? panelRef.current)?.focus({ preventScroll: true });
  }, [pos, isStatic, initialFocus]);

  useEffect(() => () => window.clearTimeout(subTimer.current), []);

  function itemsOf(panel: HTMLElement | null) {
    return panel ? [...panel.querySelectorAll<HTMLElement>(ITEM_SELECTOR)] : [];
  }
  function focusAt(list: HTMLElement[], index: number) {
    list[(index + list.length) % list.length]?.focus({ preventScroll: false });
  }
  function openSub(key: string, focus: boolean) {
    window.clearTimeout(subTimer.current);
    setSub({ key, focus });
  }
  function closeSub(delay = 0) {
    window.clearTimeout(subTimer.current);
    if (!delay) {
      setSub(null);
      return;
    }
    subTimer.current = window.setTimeout(() => setSub(null), delay);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const panel = panelRef.current;
    // Eventos de submenus em portal sobem pela árvore do React: cada painel cuida só dos seus.
    if (!panel || !panel.contains(event.target as Node)) return;
    const list = itemsOf(panel);
    const current = list.indexOf(document.activeElement as HTMLElement);
    const item = current >= 0 ? list[current] : undefined;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusAt(list, current + 1);
        return;
      case 'ArrowUp':
        event.preventDefault();
        focusAt(list, current < 0 ? -1 : current - 1);
        return;
      case 'Home':
        event.preventDefault();
        focusAt(list, 0);
        return;
      case 'End':
        event.preventDefault();
        focusAt(list, list.length - 1);
        return;
      case 'ArrowRight':
        if (item?.getAttribute('aria-haspopup') === 'menu' && item.getAttribute('aria-disabled') !== 'true') {
          event.preventDefault();
          openSub(item.dataset.key ?? '', true);
        }
        return;
      case 'ArrowLeft':
        if (level > 0) {
          event.preventDefault();
          onBack?.();
        }
        return;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        if (level > 0) onBack?.();
        else onDismiss?.(true);
        return;
      case 'Tab':
        if (isStatic) return;
        event.preventDefault();
        onDismiss?.(true);
        return;
    }
    // Digitar leva ao primeiro item que começa com o texto (500 ms entre teclas).
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && event.key !== ' ') {
      const now = Date.now();
      typed.current.text = now - typed.current.at > 500 ? event.key : typed.current.text + event.key;
      typed.current.at = now;
      const term = normalize(typed.current.text);
      // Primeira tecla procura depois do item atual; as seguintes continuam a partir dele.
      const from = Math.max(current, 0) + (term.length > 1 || current < 0 ? 0 : 1);
      const order = [...list.slice(from), ...list.slice(0, from)];
      const match = order.find((el) => normalize(el.dataset.label ?? '').startsWith(term));
      if (match) {
        event.preventDefault();
        match.focus();
      }
    }
  }

  const style: CSSProperties = isStatic
    ? { width }
    : {
        width,
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        maxHeight: pos?.maxHeight,
        visibility: pos ? undefined : 'hidden',
        transformOrigin: pos ? ORIGIN[pos.side][pos.align] : undefined,
      };

  const panel = (
    <div
      ref={panelRef}
      id={id}
      role="menu"
      aria-label={label}
      tabIndex={-1}
      className={s.panel}
      data-menu-root={rootId}
      data-static={isStatic || undefined}
      data-phase={isStatic ? undefined : pos ? phase : 'measure'}
      data-side={pos?.side}
      data-level={level}
      style={style}
      onKeyDown={onKeyDown}
      onPointerEnter={onPointerEnterPanel}
      onContextMenu={(event) => event.preventDefault()}
    >
      {sections.map((section, sectionIndex) => (
        <div
          key={section.label ?? sectionIndex}
          className={s.section}
          role="group"
          aria-label={section.label}
        >
          {section.label && (
            <div className={s.sectionLabel} aria-hidden="true">
              {section.label}
            </div>
          )}
          {section.items.map((item, itemIndex) => {
            const key = `${sectionIndex}-${itemIndex}`;
            const Icon = item.icon;
            const hasSub = Boolean(item.items?.length);
            const subOpen = sub?.key === key;
            const role = item.checked === undefined ? 'menuitem' : 'menuitemradio';
            return (
              <button
                key={`${item.label}-${itemIndex}`}
                type="button"
                role={role}
                aria-checked={item.checked}
                aria-disabled={item.disabled || undefined}
                aria-haspopup={hasSub ? 'menu' : undefined}
                aria-expanded={hasSub ? subOpen : undefined}
                tabIndex={-1}
                className={s.item}
                data-key={key}
                data-label={item.label}
                data-danger={item.danger || undefined}
                data-muted={item.muted || undefined}
                data-rich={Boolean(item.description) || undefined}
                data-force={item.force ?? (item.active ? 'hover' : undefined)}
                onPointerMove={(event) => {
                  if (event.pointerType !== 'mouse') return;
                  const el = event.currentTarget;
                  if (document.activeElement !== el) el.focus({ preventScroll: true });
                  if (hasSub && !item.disabled) {
                    if (!subOpen) {
                      window.clearTimeout(subTimer.current);
                      subTimer.current = window.setTimeout(() => setSub({ key, focus: false }), 120);
                    }
                  } else if (sub) {
                    closeSub(120);
                  }
                }}
                onPointerLeave={(event) => {
                  if (event.pointerType !== 'mouse' || hasSub) return;
                  if (document.activeElement === event.currentTarget) panelRef.current?.focus({ preventScroll: true });
                }}
                onClick={() => {
                  if (item.disabled) return;
                  if (hasSub) {
                    openSub(key, true);
                    return;
                  }
                  item.onSelect?.();
                  onDismiss?.(true);
                }}
              >
                {item.leading ? (
                  <span className={s.lead} aria-hidden="true">
                    {item.leading}
                  </span>
                ) : (
                  Icon && <Icon className={s.icon} aria-hidden="true" />
                )}
                <span className={s.text}>
                  <span className={s.label}>{item.label}</span>
                  {item.description && <span className={s.desc}>{item.description}</span>}
                </span>
                {(item.meta || item.shortcut || item.checked || hasSub) && (
                  <span className={s.end}>
                    {item.meta && <span className={s.meta}>{item.meta}</span>}
                    {item.shortcut && <Kbd>{item.shortcut}</Kbd>}
                    {item.checked && <Check className={s.check} aria-hidden="true" />}
                    {hasSub && <ChevronRight className={s.chevron} aria-hidden="true" />}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );

  const subItem = sub ? findItem(sections, sub.key) : undefined;
  const subMenu =
    sub && subItem?.items && host && phase === 'open' ? (
      <MenuSurface
        key={sub.key}
        sections={[{ items: subItem.items }]}
        label={subItem.label}
        rootId={rootId}
        host={host}
        anchor={() => {
          const panelEl = panelRef.current;
          const itemEl = panelEl?.querySelector<HTMLElement>(`[data-key="${sub.key}"]`);
          if (!panelEl || !itemEl) return null;
          const p = panelEl.getBoundingClientRect();
          const i = itemEl.getBoundingClientRect();
          return { top: i.top - 5, bottom: i.bottom, left: p.left, right: p.right };
        }}
        side="right"
        gap={4}
        width={Math.max(184, width ? width - 40 : 0)}
        level={level + 1}
        initialFocus={sub.focus ? 'first' : 'none'}
        onDismiss={onDismiss}
        onBack={() => {
          setSub(null);
          panelRef.current?.querySelector<HTMLElement>(`[data-key="${sub.key}"]`)?.focus();
        }}
        onPointerEnterPanel={() => window.clearTimeout(subTimer.current)}
      />
    ) : null;

  if (isStatic) return panel;
  return (
    <>
      {host ? createPortal(panel, host) : panel}
      {subMenu}
    </>
  );
}

function findItem(sections: MenuSection[], key: string) {
  const [a, b] = key.split('-').map(Number);
  return sections[a ?? -1]?.items[b ?? -1];
}

/* ——————————————————————————— Menu ancorado ——————————————————————————— */

export type MenuTriggerProps = {
  'aria-haspopup': 'menu';
  'aria-expanded': boolean;
  'aria-controls': string | undefined;
  onClick: (event?: ReactMouseEvent<HTMLElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  ref: (node: HTMLButtonElement | null) => void;
};

/**
 * Menu de ações ancorado a um gatilho. Flutua fixo na janela (nunca é cortado por tabela ou
 * moldura), vira para cima ou para o lado quando falta espaço. Setas, Home/End e digitação
 * percorrem; Escape fecha e devolve o foco. O gatilho é renderizado pelo consumidor.
 */
export function Menu({
  trigger,
  sections,
  align = 'start',
  side = 'bottom',
  label,
  width,
  onOpenChange,
}: {
  trigger: (props: MenuTriggerProps) => ReactNode;
  sections: MenuSection[];
  align?: 'start' | 'end';
  /** Lado preferido. Vira sozinho quando não cabe. */
  side?: 'bottom' | 'top';
  label: string;
  width?: number;
  onOpenChange?: (open: boolean) => void;
}) {
  const [phase, setPhase] = useState<'closed' | 'open' | 'closing'>('closed');
  const [host, setHost] = useState<Element | null>(null);
  const [initialFocus, setInitialFocus] = useState<'first' | 'last' | 'checked' | 'panel'>('first');
  const [session, setSession] = useState(0);
  const id = useId();
  const rootId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const exitTimer = useRef<number | undefined>(undefined);
  const open = phase === 'open';

  function show(focus: 'first' | 'last' | 'checked' | 'panel') {
    window.clearTimeout(exitTimer.current);
    setHost(floatingHost(triggerRef.current));
    setInitialFocus(focus);
    setSession((value) => value + 1);
    setPhase('open');
    onOpenChange?.(true);
  }
  function close(returnFocus: boolean) {
    setPhase((value) => (value === 'closed' ? value : 'closing'));
    onOpenChange?.(false);
    if (returnFocus) triggerRef.current?.focus({ preventScroll: true });
    window.clearTimeout(exitTimer.current);
    exitTimer.current = window.setTimeout(() => setPhase((value) => (value === 'closing' ? 'closed' : value)), 120);
  }

  useEffect(() => {
    if (!open) return;
    function onDown(event: PointerEvent) {
      const target = event.target as Element | null;
      if (target?.closest?.(`[data-menu-root="${CSS.escape(rootId)}"]`)) return;
      if (triggerRef.current?.contains(target)) return;
      close(false);
    }
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rootId]);
  useEffect(() => () => window.clearTimeout(exitTimer.current), []);

  const hasChecked = sections.some((section) => section.items.some((item) => item.checked));
  return (
    <span className={s.anchor}>
      {trigger({
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': open ? id : undefined,
        // Clique do ponteiro (detail ≥ 1) abre sem destacar item; Enter/Espaço (detail 0) já foca o primeiro.
        onClick: (event) =>
          open ? close(false) : show(event && event.detail > 0 ? 'panel' : hasChecked ? 'checked' : 'first'),
        onKeyDown: (event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            show(event.key === 'ArrowUp' ? 'last' : hasChecked ? 'checked' : 'first');
          }
        },
        ref: (node) => {
          triggerRef.current = node;
        },
      })}
      {phase !== 'closed' && host && (
        <MenuSurface
          key={session}
          id={id}
          sections={sections}
          label={label}
          rootId={rootId}
          host={host}
          anchor={() => triggerRef.current?.getBoundingClientRect() ?? null}
          side={side}
          align={align}
          width={width}
          phase={phase === 'open' ? 'open' : 'closing'}
          initialFocus={initialFocus}
          onDismiss={close}
        />
      )}
    </span>
  );
}

/** Painel de menu aberto e parado — para pranchas e composições. Aceita `force` nos itens. */
export function MenuPanel({
  sections,
  label,
  width = 240,
}: {
  sections: MenuSection[];
  label: string;
  width?: number;
}) {
  const rootId = useId();
  return <MenuSurface sections={sections} label={label} rootId={rootId} width={width} isStatic />;
}
