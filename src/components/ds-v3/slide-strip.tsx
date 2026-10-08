'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { VisuallyHidden, useAnnouncer } from './a11y';
import { Badge } from './badge';
import { Button, IconButton } from './button';
import { ConfirmDialog } from './confirm-dialog';
import { Skeleton } from './feedback';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Copy,
  Ellipsis,
  GripVertical,
  Plus,
  Trash2,
} from './icons';
import { ratioOf, type MediaRatio } from './media';
import { Menu, Tooltip, type MenuItem, type MenuSection } from './overlays';
import { reducedMotion, useIsoLayoutEffect } from './popover';
import s from './slide-strip.module.css';

export type SlideStripItemState = 'ok' | 'warning' | 'error';
export type SlideStripOrientation = 'vertical' | 'horizontal';

export type SlideStripItem = {
  id: string;
  /** Nome curto do slide (“Capa”, “Citação”). */
  label: string;
  /** Miniatura na proporção da faixa (ex.: `SlideCanvas mode="thumb"` ou uma imagem). Decorativa. */
  thumb?: ReactNode;
  /** `warning` (âmbar) e `error` (vermelho) ganham ponto + texto. */
  state?: SlideStripItemState;
  /** Texto do aviso (“Título excede 2 linhas”). Sem ele: “Revisar” ou “Com erro”. */
  issue?: string;
  /** Linha de apoio quando não há aviso (“42 palavras”). */
  meta?: string;
  /** Pranchas: estado parado da miniatura (`hover`, `active`, `focus`; `tip` = dica aberta, na horizontal). */
  force?: string;
};

export type SlideStripProps = Omit<ComponentProps<'div'>, 'onChange' | 'children'> & {
  /** Nome da faixa (“Slides do carrossel”). */
  label: string;
  items: SlideStripItem[];
  /** Id do slide escolhido. */
  value: string | null;
  onChange: (id: string) => void;
  /** Liga a alça de arrasto, Alt + setas e “Mover” no menu. */
  onReorder?: (from: number, to: number) => void;
  onAdd?: () => void;
  onDuplicate?: (id: string) => void;
  /**
   * Chamado depois da confirmação (Delete ou “Excluir” no menu). Pode ser assíncrono: a confirmação
   * carrega e fica aberta se falhar. Se o excluído era o escolhido, a faixa escolhe o vizinho.
   */
  onRemove?: (id: string) => void | Promise<unknown>;
  /** Falso: exclui direto (o produto oferece desfazer). */
  confirmRemove?: boolean;
  /** Proporção das miniaturas. */
  ratio?: MediaRatio;
  /** `vertical` no painel lateral do estúdio; `horizontal` em coluna estreita ou celular. */
  orientation?: SlideStripOrientation;
  loading?: boolean;
  /** Miniaturas em esqueleto enquanto carrega. */
  loadingCount?: number;
  /** Tudo parado (ex.: gerando os textos). */
  disabled?: boolean;
  /** Nome da peça nos textos (“Adicionar slide”, “Excluir slide 3?”). */
  noun?: string;
  addLabel?: string;
  /** Limite de itens: “Adicionar” e “Duplicar” ficam indisponíveis com o motivo. */
  maxItems?: number;
  /** Abaixo disso “Excluir” fica indisponível. */
  minItems?: number;
  /** Sem itens. Padrão: “Nenhum slide”. */
  empty?: ReactNode;
};

type DragState = {
  from: number;
  to: number;
  origin: number;
  last: number;
  scroll0: number;
  raf: number;
};

const itemsOf = (list: HTMLElement | null) => [
  ...(list?.querySelectorAll<HTMLLIElement>(':scope > li[data-item]') ?? []),
];

function tokenMs(el: Element, name: string, fallback: number) {
  const value = parseFloat(getComputedStyle(el).getPropertyValue(name));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
function tokenEase(el: Element) {
  return (
    getComputedStyle(el).getPropertyValue('--ease-move').trim() || 'cubic-bezier(0.65, 0, 0.35, 1)'
  );
}

/** Rolagem mais próxima no eixo; `null` quando quem rola é a página (a faixa não mexe na página). */
function scrollerOf(el: HTMLElement | null, vertical: boolean): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node && node !== document.body && node !== document.documentElement) {
    const style = getComputedStyle(node);
    const overflow = vertical ? style.overflowY : style.overflowX;
    const room = vertical
      ? node.scrollHeight > node.clientHeight
      : node.scrollWidth > node.clientWidth;
    if (/(auto|scroll)/.test(overflow) && room) return node;
    node = node.parentElement;
  }
  return null;
}

/**
 * Faixa de slides de um carrossel (ou de qualquer sequência de peças): miniaturas numeradas na
 * proporção da peça, escolha com setas, reordenação pela alça ou Alt + setas, duplicar e excluir
 * no menu “⋯” (Delete também exclui, com confirmação). Slide com aviso ou erro mostra ponto + texto.
 * Controlada: a faixa só pede (`onChange`, `onReorder`, `onRemove`…); quem muda a lista é o produto.
 */
export function SlideStrip({
  label,
  items,
  value,
  onChange,
  onReorder,
  onAdd,
  onDuplicate,
  onRemove,
  confirmRemove = true,
  ratio = '4/5',
  orientation = 'vertical',
  loading = false,
  loadingCount = 5,
  disabled = false,
  noun = 'slide',
  addLabel,
  maxItems,
  minItems = 1,
  empty,
  className = '',
  ...props
}: SlideStripProps) {
  const listRef = useRef<HTMLOListElement>(null);
  const uid = useId();
  const { announce, region } = useAnnouncer();
  const vertical = orientation === 'vertical';
  const count = items.length;
  const selectedIndex = items.findIndex((item) => item.id === value);
  const roving = selectedIndex >= 0 ? selectedIndex : 0;
  const reorderable = Boolean(onReorder) && !disabled && count > 1;
  const removable = Boolean(onRemove) && !disabled && count > minItems;
  const atLimit = maxItems !== undefined && count >= maxItems;
  const limitText = `Limite de ${maxItems ?? 0}`;
  const thumbRatio = ratioOf(ratio);

  const [pending, setPending] = useState<{ id: string; index: number; label: string } | null>(null);
  const lastPending = useRef(pending);
  if (pending) lastPending.current = pending;
  const shown = pending ?? lastPending.current;

  const flip = useRef<Map<string, DOMRect> | null>(null);
  const focusAfter = useRef<string | null>(null);
  const settleDrag = useRef(false);
  const drag = useRef<DragState | null>(null);

  const tileOf = (id: string | undefined) =>
    itemsOf(listRef.current)
      .find((li) => li.dataset.id === id)
      ?.querySelector<HTMLButtonElement>('[data-tile]') ?? null;

  const clearStyles = (lis: HTMLLIElement[]) =>
    lis.forEach((li) => {
      li.style.transition = '';
      li.style.transform = '';
      delete li.dataset.dragging;
    });

  // Depois de reordenar: o arrasto limpa os deslocamentos (a tela já está no lugar novo); o teclado
  // anima cada miniatura da posição antiga para a nova (FLIP) e devolve o foco à que se moveu.
  useIsoLayoutEffect(() => {
    const lis = itemsOf(listRef.current);
    if (settleDrag.current) {
      settleDrag.current = false;
      clearStyles(lis);
    }
    const before = flip.current;
    flip.current = null;
    if (before && !reducedMotion()) {
      const duration = lis[0] ? tokenMs(lis[0], '--dur-3', 280) : 280;
      const easing = lis[0] ? tokenEase(lis[0]) : undefined;
      lis.forEach((li) => {
        const old = before.get(li.dataset.id ?? '');
        if (!old || typeof li.animate !== 'function') return;
        const now = li.getBoundingClientRect();
        const dx = old.left - now.left;
        const dy = old.top - now.top;
        if (dx || dy)
          li.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
            duration,
            easing,
          });
      });
    }
    const id = focusAfter.current;
    focusAfter.current = null;
    if (id) {
      const tile = tileOf(id);
      if (tile && document.activeElement !== tile) tile.focus();
    }
  });

  // A escolhida fica à vista dentro da rolagem da faixa ou do painel (nunca rola a página).
  useEffect(() => {
    if (selectedIndex < 0) return;
    const li = itemsOf(listRef.current)[selectedIndex];
    const scroller = scrollerOf(listRef.current, vertical);
    if (!li || !scroller || typeof scroller.scrollBy !== 'function') return;
    const box = scroller.getBoundingClientRect();
    const rect = li.getBoundingClientRect();
    const pad = 8;
    const delta = vertical
      ? rect.top < box.top
        ? rect.top - box.top - pad
        : rect.bottom > box.bottom
          ? rect.bottom - box.bottom + pad
          : 0
      : rect.left < box.left
        ? rect.left - box.left - pad
        : rect.right > box.right
          ? rect.right - box.right + pad
          : 0;
    if (!delta) return;
    scroller.scrollBy({
      [vertical ? 'top' : 'left']: delta,
      behavior: reducedMotion() ? 'auto' : 'smooth',
    });
  }, [selectedIndex, vertical]);

  useEffect(
    () => () => {
      if (drag.current) cancelAnimationFrame(drag.current.raf);
    },
    [],
  );

  function select(index: number, focus = false) {
    const item = items[index];
    if (!item || disabled) return;
    if (item.id !== value) onChange(item.id);
    if (focus) itemsOf(listRef.current)[index]?.querySelector<HTMLElement>('[data-tile]')?.focus();
  }

  function move(index: number, delta: -1 | 1, refocus: boolean) {
    const to = index + delta;
    const item = items[index];
    if (!onReorder || !item || disabled || to < 0 || to >= count) return;
    flip.current = new Map(
      itemsOf(listRef.current).map((li) => [li.dataset.id ?? '', li.getBoundingClientRect()]),
    );
    if (refocus) focusAfter.current = item.id;
    onReorder(index, to);
    announce(`${item.label}: posição ${to + 1} de ${count}.`);
    // O produto recusou a troca (nenhum commit): descarta a foto antiga.
    requestAnimationFrame(() => {
      flip.current = null;
    });
  }

  /** Foco volta à faixa quando a confirmação fecha (o slide de origem já não existe). */
  function refocusLater(id: string | null) {
    let tries = 0;
    const step = () => {
      tries += 1;
      const tile =
        tileOf(id ?? undefined) ??
        itemsOf(listRef.current)[0]?.querySelector<HTMLElement>('[data-tile]');
      const active = document.activeElement;
      if (tile && (!active || active === document.body)) {
        tile.focus();
        return;
      }
      if (tries < 60) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  async function remove(id: string, index: number) {
    const neighbor = items[index + 1] ?? items[index - 1];
    const wasSelected = id === value;
    await onRemove?.(id);
    if (wasSelected && neighbor) onChange(neighbor.id);
    refocusLater(wasSelected ? (neighbor?.id ?? null) : value);
  }

  function requestRemove(index: number) {
    const item = items[index];
    if (!item || !removable) return;
    if (!confirmRemove) {
      void remove(item.id, index);
      return;
    }
    setPending({ id: item.id, index, label: item.label });
  }

  function onTileKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (disabled) return;
    const back = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
    const ahead = event.key === 'ArrowRight' || event.key === 'ArrowDown';
    if ((back || ahead) && event.altKey) {
      if (!reorderable) return;
      event.preventDefault();
      move(index, back ? -1 : 1, true);
    } else if (back || ahead) {
      event.preventDefault();
      select(index + (back ? -1 : 1), true);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      select(event.key === 'Home' ? 0 : count - 1, true);
    } else if ((event.key === 'Delete' || event.key === 'Backspace') && removable) {
      event.preventDefault();
      requestRemove(index);
    }
  }

  function startDrag(index: number, event: ReactPointerEvent<HTMLElement>) {
    if (!reorderable || event.button !== 0) return;
    const lis = itemsOf(listRef.current);
    const li = lis[index];
    if (!li) return;
    event.preventDefault();
    const handle = event.currentTarget;
    handle.setPointerCapture?.(event.pointerId);

    const rects = lis.map((el) => el.getBoundingClientRect());
    const start = (r: DOMRect) => (vertical ? r.top : r.left);
    const size = (r: DOMRect) => (vertical ? r.height : r.width);
    const axis = (d: number) => (vertical ? `translateY(${d}px)` : `translateX(${d}px)`);
    const r0 = rects[index] as DOMRect;
    const first = rects[0] as DOMRect;
    const last = rects[rects.length - 1] as DOMRect;
    const second = rects[1];
    const gap = second ? start(second) - (start(first) + size(first)) : 0;
    const shift = size(r0) + gap;
    const scroller = scrollerOf(listRef.current, vertical);
    const scrollPos = () => (scroller ? (vertical ? scroller.scrollTop : scroller.scrollLeft) : 0);
    const point = (e: { clientX: number; clientY: number }) => (vertical ? e.clientY : e.clientX);
    const duration = tokenMs(li, '--dur-3', 280);
    const settle = tokenMs(li, '--dur-2', 180);
    const easing = tokenEase(li);

    const state: DragState = {
      from: index,
      to: index,
      origin: point(event),
      last: point(event),
      scroll0: scrollPos(),
      raf: 0,
    };
    drag.current = state;
    li.dataset.dragging = '';
    lis.forEach((el) => {
      if (el !== li) el.style.transition = `transform ${duration}ms ${easing}`;
    });

    const update = () => {
      const delta = state.last - state.origin + (scrollPos() - state.scroll0);
      const min = start(first) - start(r0);
      const max = start(last) + size(last) - (start(r0) + size(r0));
      const d = Math.min(Math.max(delta, min), max);
      li.style.transform = `${axis(d)} scale(1.02)`;
      const center = start(r0) + d + size(r0) / 2;
      let to = index;
      lis.forEach((el, i) => {
        if (i === index) return;
        const r = rects[i] as DOMRect;
        const mid = start(r) + size(r) / 2;
        let offset = 0;
        if (i > index && center > mid) {
          offset = -shift;
          to = Math.max(to, i);
        } else if (i < index && center < mid) {
          offset = shift;
          to = Math.min(to, i);
        }
        el.style.transform = offset ? axis(offset) : '';
      });
      state.to = to;
    };

    // Perto da borda da rolagem, a faixa rola sozinha enquanto a alça está presa.
    const tick = () => {
      if (scroller) {
        const box = scroller.getBoundingClientRect();
        const lo = vertical ? box.top : box.left;
        const hi = vertical ? box.bottom : box.right;
        const edge = 40;
        let speed = 0;
        if (state.last < lo + edge) speed = -Math.ceil((lo + edge - state.last) / 4);
        else if (state.last > hi - edge) speed = Math.ceil((state.last - (hi - edge)) / 4);
        if (speed) {
          if (vertical) scroller.scrollTop += speed;
          else scroller.scrollLeft += speed;
          update();
        }
      }
      state.raf = requestAnimationFrame(tick);
    };

    const onMove = (moveEvent: PointerEvent) => {
      state.last = point(moveEvent);
      update();
    };
    const onEscape = (keyEvent: globalThis.KeyboardEvent) => {
      if (keyEvent.key !== 'Escape') return;
      keyEvent.preventDefault();
      keyEvent.stopPropagation();
      end(false);
    };
    const end = (commit: boolean) => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('keydown', onEscape, true);
      cancelAnimationFrame(state.raf);
      drag.current = null;
      const { from, to } = state;
      const item = items[from];
      const finish = () => {
        if (!commit || to === from || !item) {
          clearStyles(lis);
          return;
        }
        settleDrag.current = true;
        onReorder?.(from, to);
        announce(`${item.label}: posição ${to + 1} de ${count}.`);
        // Sem commit (o produto recusou), as miniaturas voltam ao lugar.
        requestAnimationFrame(() => {
          if (!settleDrag.current) return;
          settleDrag.current = false;
          clearStyles(itemsOf(listRef.current));
        });
      };
      if (!commit || to === from || reducedMotion()) {
        if (!commit) lis.forEach((el) => (el.style.transform = ''));
        finish();
        return;
      }
      const target =
        to > from
          ? start(rects[to] as DOMRect) + size(rects[to] as DOMRect) - (start(r0) + size(r0))
          : start(rects[to] as DOMRect) - start(r0);
      li.style.transition = `transform ${settle}ms ${easing}`;
      li.style.transform = axis(target);
      window.setTimeout(finish, settle + 10);
    };
    const onUp = () => end(true);
    const onCancel = () => end(false);
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onCancel);
    window.addEventListener('keydown', onEscape, true);
    state.raf = requestAnimationFrame(tick);
  }

  function menuOf(item: SlideStripItem, index: number): MenuSection[] {
    const main: MenuItem[] = [];
    if (onDuplicate)
      main.push({
        label: 'Duplicar',
        icon: Copy,
        disabled: atLimit,
        description: atLimit ? limitText : undefined,
        onSelect: () => onDuplicate(item.id),
      });
    if (onReorder && count > 1) {
      main.push(
        {
          label: vertical ? 'Mover para cima' : 'Mover para a esquerda',
          icon: vertical ? ArrowUp : ArrowLeft,
          disabled: index === 0,
          onSelect: () => move(index, -1, false),
        },
        {
          label: vertical ? 'Mover para baixo' : 'Mover para a direita',
          icon: vertical ? ArrowDown : ArrowRight,
          disabled: index === count - 1,
          onSelect: () => move(index, 1, false),
        },
      );
    }
    const sections: MenuSection[] = main.length ? [{ items: main }] : [];
    if (onRemove)
      sections.push({
        items: [
          {
            label: 'Excluir',
            icon: Trash2,
            danger: removable,
            disabled: !removable,
            description: removable ? undefined : `Mínimo de ${minItems}`,
            onSelect: () => requestRemove(index),
          },
        ],
      });
    return sections;
  }

  const hint = [
    'Setas trocam de slide.',
    reorderable ? 'Alt mais setas mudam a posição.' : '',
    removable ? 'Delete exclui.' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const add = onAdd && !loading && (
    <AddControl
      label={addLabel ?? `Adicionar ${noun}`}
      vertical={vertical}
      ratio={thumbRatio}
      disabled={disabled}
      blocked={atLimit}
      reason={limitText}
      onAdd={onAdd}
    />
  );

  return (
    <div
      {...props}
      className={`${s.strip} ${className}`}
      data-orientation={orientation}
      data-disabled={disabled || undefined}
    >
      {loading ? (
        <ol className={s.list} aria-label={label} aria-busy="true">
          {Array.from({ length: loadingCount }, (_, index) => (
            <li key={index} className={s.item} data-skeleton="">
              <span className={s.tile}>
                {vertical && <span className={s.num} />}
                <span className={s.thumb} style={{ aspectRatio: thumbRatio }}>
                  <Skeleton
                    shape="block"
                    width="100%"
                    height="100%"
                    radius={0}
                    delay={index * 80}
                  />
                </span>
                {vertical && (
                  <span className={s.text}>
                    <Skeleton width="72%" delay={index * 80} />
                  </span>
                )}
              </span>
            </li>
          ))}
        </ol>
      ) : count === 0 ? (
        <p className={s.empty}>{empty ?? `Nenhum ${noun}`}</p>
      ) : (
        <ol ref={listRef} className={s.list} aria-label={label}>
          {items.map((item, index) => {
            const selected = index === selectedIndex;
            const issue = item.state === 'warning' || item.state === 'error';
            const tone = item.state === 'error' ? 'red' : 'amber';
            const issueText = item.issue ?? (item.state === 'error' ? 'Com erro' : 'Revisar');
            const describe = [issue ? issueText : item.meta, hint].filter(Boolean).join(' ');
            const tab = index === roving ? 0 : -1;
            const sections = disabled ? [] : menuOf(item, index);
            return (
              <li
                key={item.id}
                className={s.item}
                data-item=""
                data-id={item.id}
                data-selected={selected || undefined}
                data-state={issue ? item.state : undefined}
                data-reorder={reorderable || undefined}
                data-actions={sections.length ? '' : undefined}
              >
                {tileTip(
                  vertical,
                  item,
                  issue ? issueText : undefined,
                  <button
                    type="button"
                    className={s.tile}
                    data-tile=""
                    aria-current={selected ? 'true' : undefined}
                    aria-label={`${index + 1}. ${item.label}`}
                    aria-describedby={`${uid}-d${index}`}
                    tabIndex={tab}
                    disabled={disabled}
                    data-force={item.force}
                    onClick={() => select(index)}
                    onKeyDown={(event) => onTileKey(event, index)}
                  >
                    {vertical ? (
                      <>
                        <span className={s.num} aria-hidden="true">
                          {index + 1}
                        </span>
                        <Thumb ratio={thumbRatio}>{item.thumb}</Thumb>
                        <span className={s.text} aria-hidden="true">
                          <span className={s.label}>{item.label}</span>
                          {issue ? (
                            <Badge variant="text" size="sm" tone={tone} wrap>
                              {issueText}
                            </Badge>
                          ) : (
                            item.meta && <span className={s.meta}>{item.meta}</span>
                          )}
                        </span>
                      </>
                    ) : (
                      <>
                        <Thumb ratio={thumbRatio}>{item.thumb}</Thumb>
                        <span className={s.cap} aria-hidden="true">
                          <span className={s.num}>{index + 1}</span>
                          {issue && <span className={s.dot} data-tone={tone} />}
                        </span>
                      </>
                    )}
                  </button>,
                )}
                <VisuallyHidden>
                  <span id={`${uid}-d${index}`}>{describe}</span>
                </VisuallyHidden>
                {reorderable && (
                  // Só ponteiro (o teclado reordena com Alt + setas): a dica é visual.
                  <Tooltip bare describe={false} content="Arrastar para mudar a posição">
                    <span
                      className={s.grip}
                      aria-hidden="true"
                      onPointerDown={(event) => startDrag(index, event)}
                    >
                      <GripVertical />
                    </span>
                  </Tooltip>
                )}
                {sections.length > 0 && (
                  <span className={s.actions}>
                    <Menu
                      label={`Ações de ${item.label}`}
                      align="end"
                      sections={sections}
                      trigger={(trigger) => (
                        <IconButton
                          {...trigger}
                          label={`Ações de ${item.label}`}
                          icon={Ellipsis}
                          variant="ghost"
                          size="sm"
                          tabIndex={tab}
                        />
                      )}
                    />
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {add}
      {loading && <VisuallyHidden role="status">Carregando</VisuallyHidden>}
      {region}
      {onRemove && confirmRemove && (
        <ConfirmDialog
          open={pending !== null}
          onClose={() => setPending(null)}
          tone="danger"
          title={`Excluir ${noun} ${(shown?.index ?? 0) + 1}?`}
          description={shown ? `“${shown.label}” sai da sequência.` : undefined}
          confirmLabel={`Excluir ${noun}`}
          onConfirm={() => (pending ? remove(pending.id, pending.index) : undefined)}
        />
      )}
    </div>
  );
}

/**
 * Na fita horizontal só aparecem o número e a miniatura: a dica do DS traz o nome e o aviso (o ponto
 * colorido não fala sozinho). O leitor de tela já ouve os dois pelo próprio bloco (nome e descrição).
 */
function tileTip(
  vertical: boolean,
  item: SlideStripItem,
  issue: string | undefined,
  tile: ReactElement,
) {
  if (vertical) return tile;
  return (
    <Tooltip
      bare
      describe={false}
      content={[item.label, issue].filter(Boolean).join(' · ')}
      open={item.force?.split(' ').includes('tip')}
    >
      {tile}
    </Tooltip>
  );
}

/** Moldura da miniatura: proporção da peça, fio interno, fundo g-50 quando não há arte. */
function Thumb({ ratio, children }: { ratio: string; children?: ReactNode }) {
  return (
    <span className={s.thumb} style={{ aspectRatio: ratio }} aria-hidden="true" inert>
      {children}
    </span>
  );
}

/** “Adicionar”: linha com botão fantasma na vertical; miniatura vazia com “+” na horizontal. */
function AddControl({
  label,
  vertical,
  ratio,
  disabled,
  blocked,
  reason,
  onAdd,
}: {
  label: string;
  vertical: boolean;
  ratio: string;
  disabled: boolean;
  blocked: boolean;
  reason: string;
  onAdd: () => void;
}) {
  const run = () => {
    if (!blocked) onAdd();
  };
  const control = vertical ? (
    <Button
      variant="ghost"
      size="sm"
      icon={Plus}
      className={s.addRow}
      disabled={disabled}
      aria-disabled={blocked || undefined}
      onClick={run}
    >
      {label}
    </Button>
  ) : (
    <button
      type="button"
      className={s.addTile}
      aria-label={label}
      disabled={disabled}
      aria-disabled={blocked || undefined}
      onClick={run}
    >
      <span className={s.addBox} style={{ aspectRatio: ratio }}>
        <Plus aria-hidden="true" />
      </span>
    </button>
  );
  if (disabled) return control;
  if (blocked) return <Tooltip content={reason}>{control}</Tooltip>;
  return vertical ? control : <Tooltip content={label}>{control}</Tooltip>;
}
