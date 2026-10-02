'use client';

import { ChevronRight, GripVertical } from 'lucide-react';
import {
  Children,
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { VisuallyHidden } from './a11y';
import s from './list-item.module.css';
import { ScrollArea } from './structure';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const EASE_MOVE = 'cubic-bezier(0.65, 0, 0.35, 1)';
const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type ReorderApi = {
  start: (li: HTMLLIElement, event: ReactPointerEvent<HTMLElement>) => void;
  move: (li: HTMLLIElement, delta: -1 | 1, title: string) => void;
  hintId: string;
};
const ReorderContext = createContext<ReorderApi | null>(null);

const itemsOf = (list: HTMLElement | null) =>
  [...(list?.querySelectorAll<HTMLLIElement>(':scope > li[data-item]') ?? [])];

/**
 * Lista em fios dentro de um contorno (um painel, nunca um cartão por linha). `onReorder` liga o
 * arrastar pela alça (as outras linhas abrem espaço em 280 ms) e Alt + ↑/↓ pelo teclado, com aviso
 * para leitor de tela. `maxHeight` rola a lista e prende os cabeçalhos de grupo no topo.
 */
export function List({
  label,
  dividers = true,
  framed = true,
  children,
  empty,
  onReorder,
  maxHeight,
}: {
  label: string;
  dividers?: boolean;
  framed?: boolean;
  children?: ReactNode;
  /** Sem itens: uma linha em `--muted` (“Nenhum P.I. pendente”). */
  empty?: ReactNode;
  onReorder?: (from: number, to: number) => void;
  maxHeight?: number;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const hintId = useId();
  const [announce, setAnnounce] = useState('');
  const positions = useRef(new Map<HTMLLIElement, number>());
  const settle = useRef<'drag' | 'key' | null>(null);
  const moved = useRef<HTMLLIElement | null>(null);
  const drag = useRef<{
    li: HTMLLIElement;
    from: number;
    to: number;
    startY: number;
    items: HTMLLIElement[];
    tops: number[];
    heights: number[];
  } | null>(null);

  // Depois de reordenar: arrasto limpa os deslocamentos (a tela já está no lugar novo);
  // teclado anima cada linha da posição antiga para a nova (FLIP).
  useIsoLayoutEffect(() => {
    const items = itemsOf(listRef.current);
    if (settle.current === 'drag') {
      items.forEach((li) => {
        li.style.transition = '';
        li.style.transform = '';
        delete li.dataset.dragging;
      });
    } else if (settle.current === 'key' && !reduced()) {
      items.forEach((li) => {
        const before = positions.current.get(li);
        const delta = before === undefined ? 0 : before - li.offsetTop;
        if (delta) li.animate([{ transform: `translateY(${delta}px)` }, { transform: 'none' }], { duration: 280, easing: EASE_MOVE });
      });
    }
    // O navegador pode tirar o foco ao mover o nó: devolve à alça da linha movida.
    const li = moved.current;
    moved.current = null;
    if (li && !li.contains(document.activeElement)) li.querySelector<HTMLElement>('button')?.focus();
    settle.current = null;
    positions.current = new Map(items.map((item) => [item, item.offsetTop]));
  });

  const api: ReorderApi | null = onReorder
    ? {
        hintId,
        start(li, event) {
          const items = itemsOf(listRef.current);
          const from = items.indexOf(li);
          if (from < 0) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = {
            li,
            from,
            to: from,
            startY: event.clientY,
            items,
            tops: items.map((item) => item.offsetTop),
            heights: items.map((item) => item.offsetHeight),
          };
          li.dataset.dragging = '';
          items.forEach((item) => {
            if (item !== li) item.style.transition = `transform 280ms ${EASE_MOVE}`;
          });
          const handle = event.currentTarget;
          const onMove = (moveEvent: PointerEvent) => {
            const d = drag.current;
            if (!d) return;
            const first = d.tops[0] ?? 0;
            const lastIndex = d.items.length - 1;
            const lastBottom = (d.tops[lastIndex] ?? 0) + (d.heights[lastIndex] ?? 0);
            const h = d.heights[d.from] ?? 0;
            const top0 = d.tops[d.from] ?? 0;
            const dy = Math.min(Math.max(moveEvent.clientY - d.startY, first - top0), lastBottom - h - top0);
            d.li.style.transform = `translateY(${dy}px) scale(1.01)`;
            const center = top0 + dy + h / 2;
            let to = d.from;
            d.items.forEach((item, index) => {
              if (index === d.from) return;
              const mid = (d.tops[index] ?? 0) + (d.heights[index] ?? 0) / 2;
              let shift = 0;
              if (index > d.from && center > mid) {
                shift = -h;
                to = Math.max(to, index);
              } else if (index < d.from && center < mid) {
                shift = h;
                to = Math.min(to, index);
              }
              item.style.transform = shift ? `translateY(${shift}px)` : '';
            });
            d.to = to;
          };
          const onUp = () => {
            handle.removeEventListener('pointermove', onMove);
            handle.removeEventListener('pointerup', onUp);
            handle.removeEventListener('pointercancel', onUp);
            const d = drag.current;
            drag.current = null;
            if (!d) return;
            const h = d.heights[d.from] ?? 0;
            const slot =
              d.to > d.from
                ? d.heights.slice(d.from + 1, d.to + 1).reduce((sum, value) => sum + value, 0)
                : -d.heights.slice(d.to, d.from).reduce((sum, value) => sum + value, 0);
            const finish = () => {
              if (d.to === d.from) {
                d.items.forEach((item) => {
                  item.style.transition = '';
                  item.style.transform = '';
                });
                delete d.li.dataset.dragging;
                return;
              }
              settle.current = 'drag';
              onReorder(d.from, d.to);
              const title = d.li.dataset.title ?? 'Item';
              setAnnounce(`${title} movido para a posição ${d.to + 1} de ${d.items.length}.`);
            };
            if (reduced() || !h) return finish();
            d.li.style.transition = `transform 180ms ${EASE_MOVE}`;
            d.li.style.transform = `translateY(${slot}px)`;
            window.setTimeout(finish, 190);
          };
          handle.addEventListener('pointermove', onMove);
          handle.addEventListener('pointerup', onUp);
          handle.addEventListener('pointercancel', onUp);
        },
        move(li, delta, title) {
          const items = itemsOf(listRef.current);
          const from = items.indexOf(li);
          const to = from + delta;
          if (from < 0 || to < 0 || to >= items.length) return;
          settle.current = 'key';
          moved.current = li;
          onReorder(from, to);
          setAnnounce(`${title} movido para a posição ${to + 1} de ${items.length}.`);
        },
      }
    : null;

  const count = Children.toArray(children).length;
  const list = (
    <ul ref={listRef} className={s.list} aria-label={label} data-dividers={dividers || undefined}>
      {count === 0 && empty ? <li className={s.empty}>{empty}</li> : children}
    </ul>
  );
  return (
    <ReorderContext.Provider value={api}>
      <div className={s.frame} data-framed={framed || undefined}>
        {maxHeight ? (
          // Com rolagem: o fim esmaece enquanto ainda há linhas abaixo (some no fim da lista).
          <ScrollArea label={label} maxHeight={maxHeight} fade="end">
            {list}
          </ScrollArea>
        ) : (
          list
        )}
        {api && (
          <>
            <VisuallyHidden>
              <span id={hintId}>Alt mais seta para cima ou para baixo muda a posição.</span>
            </VisuallyHidden>
            <VisuallyHidden>
              <span role="status" aria-live="polite">
                {announce}
              </span>
            </VisuallyHidden>
          </>
        )}
      </div>
    </ReorderContext.Provider>
  );
}

/** Grupo com cabeçalho em legenda que fica preso no topo enquanto o grupo rola. */
export function ListGroup({ label, meta, children }: { label: string; meta?: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <li className={s.group}>
      <div className={s.groupHead} id={id}>
        <span>{label}</span>
        {meta && <span className={s.groupMeta}>{meta}</span>}
      </div>
      <ul className={s.list} aria-labelledby={id} data-dividers="">
        {children}
      </ul>
    </li>
  );
}

/**
 * Linha de lista: 56 px com descrição, 44 sem (`sm`: 48/36). Título 13/500, descrição 12
 * `--muted` com reticências, meta em legenda à direita, `trailing` para Switch ou IconButton.
 * `href` vira link com chevron; `onClick`, botão; `checkbox`, caixa de seleção na frente.
 * Linha clicável não leva controle no `trailing` (nada de botão dentro de botão): o controle de
 * uma linha clicável vai em `actions`, ao lado da linha e fora dela. Com `href`, `onClick` também
 * roda (ex.: marcar como lida ao abrir).
 */
export function ListItem({
  leading,
  title,
  description,
  meta,
  trailing,
  actions,
  href,
  onClick,
  selected = false,
  disabled = false,
  density = 'md',
  draggable = false,
  checkbox = false,
  'data-force': force,
  'data-testid': testId,
}: {
  leading?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  /** Controles ao lado da linha e fora dela (a linha pode ser link ou botão). */
  actions?: ReactNode;
  href?: string;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  density?: 'md' | 'sm';
  draggable?: boolean;
  /** Linha que marca e desmarca (role checkbox), com a caixa na frente. */
  checkbox?: boolean;
  /** Prancha: `hover`, `active`, `focus`. */
  'data-force'?: string;
  /** Vai na linha clicável (link, botão ou bloco), para testes. */
  'data-testid'?: string;
}) {
  const reorder = useContext(ReorderContext);
  const liRef = useRef<HTMLLIElement>(null);
  const titleText = typeof title === 'string' ? title : undefined;
  const interactive = Boolean(href || onClick) && !disabled;

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!reorder || !draggable || !event.altKey) return;
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    if (liRef.current) reorder.move(liRef.current, event.key === 'ArrowUp' ? -1 : 1, titleText ?? 'Item');
  }

  const content = (
    <>
      {checkbox && (
        <span className={s.box} aria-hidden="true">
          <svg viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.2 5 8.6l4.6-5.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
      {leading && <span className={s.leading}>{leading}</span>}
      <span className={s.text}>
        <span className={s.title}>{title}</span>
        {description && <span className={s.desc}>{description}</span>}
      </span>
      {meta && <span className={s.meta}>{meta}</span>}
      {trailing && <span className={s.trailing}>{trailing}</span>}
      {href && !trailing && <ChevronRight className={s.chevron} aria-hidden="true" />}
    </>
  );
  const common = {
    className: s.row,
    'data-force': force,
    'data-testid': testId,
    onKeyDown,
  };
  const row = href ? (
    <a
      {...common}
      href={disabled ? undefined : href}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onClick}
    >
      {content}
    </a>
  ) : onClick || checkbox ? (
    <button
      {...common}
      type="button"
      role={checkbox ? 'checkbox' : undefined}
      aria-checked={checkbox ? selected : undefined}
      aria-pressed={!checkbox && onClick && selected ? true : undefined}
      disabled={disabled}
      onClick={onClick}
    >
      {content}
    </button>
  ) : (
    <div {...common} aria-disabled={disabled || undefined} tabIndex={draggable && reorder ? -1 : undefined}>
      {content}
    </div>
  );
  return (
    <li
      ref={liRef}
      className={s.item}
      data-item=""
      data-title={titleText}
      data-density={density}
      data-lines={description ? 2 : 1}
      data-meta={meta ? '' : undefined}
      data-lead={leading || checkbox ? '' : undefined}
      data-selected={selected || undefined}
      data-disabled={disabled || undefined}
      data-interactive={interactive || checkbox || undefined}
      data-reorder={(draggable && reorder) || undefined}
      data-actions={actions ? '' : undefined}
    >
      {draggable && reorder && (
        <button
          type="button"
          className={s.grip}
          aria-label={`Reordenar ${titleText ?? 'item'}`}
          aria-describedby={reorder.hintId}
          onPointerDown={(event) => liRef.current && reorder.start(liRef.current, event)}
          onKeyDown={onKeyDown}
          data-force={force}
        >
          <GripVertical aria-hidden="true" />
        </button>
      )}
      {row}
      {actions && <span className={s.actions}>{actions}</span>}
    </li>
  );
}

/** Linha de esqueleto com a geometria final (marca, título, descrição, meta). */
export function ListItemSkeleton({ lines = 2, leading = true, meta = true }: { lines?: 1 | 2; leading?: boolean; meta?: boolean }) {
  return (
    <li className={s.item} data-lines={lines} data-density="md" aria-hidden="true">
      <div className={s.row}>
        {leading && <span className={s.skel} data-kind="mark" />}
        <span className={s.text}>
          <span className={s.skel} style={{ width: '46%' }} />
          {lines === 2 && <span className={s.skel} data-kind="sub" style={{ width: '64%' }} />}
        </span>
        {meta && <span className={s.skel} data-kind="meta" />}
      </div>
    </li>
  );
}
