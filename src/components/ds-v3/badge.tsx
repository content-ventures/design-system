'use client';

import { X, type LucideIcon } from 'lucide-react';
import {
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { Tooltip, useClipped } from './overlays';
import s from './badge.module.css';

export type Tone =
  'gray' | 'blue' | 'green' | 'amber' | 'orange' | 'red' | 'violet' | 'teal' | 'pink';

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Status e rótulos curtos. O tom é sempre explícito: o componente não infere regra de negócio
 * pelo texto.
 *
 * - `text` (ponto 6 px + texto 13/400): padrão de tabela, cabeçalho e lista. Com `wrap` (célula
 *   estreita), quebra em até duas linhas com o ponto preso à primeira.
 * - `soft` (fundo do tom, sem fio): só em cartão e kanban.
 * - `solid`: só contador de novidade (“Novo”, “3”).
 * - `dot="hollow"`: anel cinza para o inativo (Bloqueado). `live`: pulso — só Veiculando.
 */
export function Badge({
  children,
  tone = 'gray',
  variant = 'soft',
  size = 'md',
  shape = 'rounded',
  dot = false,
  live = false,
  icon: Icon,
  title,
  wrap = false,
}: {
  children: ReactNode;
  tone?: Tone;
  variant?: 'soft' | 'outline' | 'text' | 'solid';
  size?: 'sm' | 'md' | 'lg';
  shape?: 'rounded' | 'pill';
  dot?: boolean | 'hollow';
  /** Pulso discreto no ponto, para o que está acontecendo agora (veiculando). */
  live?: boolean;
  icon?: LucideIcon;
  /** Texto inteiro numa dica do DS (`Tooltip`) quando o selo corta — nunca o `title` nativo. */
  title?: string;
  /** `text` em célula de tabela: quebra em até duas linhas em vez de estourar a coluna. */
  wrap?: boolean;
}) {
  const showDot = Boolean(dot) || variant === 'text' || live;
  const [labelRef, clipped] = useClipped<HTMLSpanElement>([children]);
  const badge = (
    <span
      className={s.badge}
      data-tone={tone}
      data-variant={variant}
      data-size={size}
      data-shape={shape}
      data-live={live || undefined}
      data-wrap={wrap || undefined}
    >
      {Icon ? (
        <Icon aria-hidden="true" />
      ) : (
        showDot && (
          <i className={s.dot} data-hollow={dot === 'hollow' || undefined} aria-hidden="true" />
        )
      )}
      <span ref={labelRef} className={s.label}>
        {children}
      </span>
    </span>
  );
  return title ? (
    <Tooltip content={title} bare describe={false} disabled={!clipped}>
      {badge}
    </Tooltip>
  ) : (
    badge
  );
}

/**
 * Filtro aplicado (`paper`, 26/30 px: prefixo 12 `--muted` + valor 12/500) ou etiqueta
 * (`neutral`/`outline`, 24/26 px). Com `onRemove`, ganha o X nomeado; Backspace ou Delete com o
 * chip em foco também removem. Com `onClick`, o corpo vira botão (abre o filtro para editar).
 */
export function Chip({
  children,
  label,
  icon: Icon,
  leading,
  size = 'md',
  variant = 'paper',
  onRemove,
  removeLabel,
  onClick,
  expanded,
  leaving = false,
  appear = false,
  removing = false,
  highlighted = false,
  title,
  'data-force': force,
  removeForce,
  ref: outerRef,
}: {
  children?: ReactNode;
  /** Prefixo discreto, como "Status:". */
  label?: string;
  icon?: LucideIcon;
  /** Marca ou orbe antes do valor (BrandMark xs, Avatar xs). */
  leading?: ReactNode;
  size?: 'sm' | 'md';
  /** `paper` = filtro aplicado; `neutral`/`soft` e `outline` = etiqueta. */
  variant?: 'paper' | 'soft' | 'neutral' | 'outline';
  onRemove?: () => void;
  removeLabel?: string;
  /** Corpo clicável (ex.: reabrir o filtro). */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Com `onClick` que abre um painel: estado do painel. */
  expanded?: boolean;
  /** Saindo: encolhe a largura e some (180 ms). Quem remove mantém o chip montado enquanto isso. */
  leaving?: boolean;
  /** Recém-adicionado: entra com escala .9 → 1 (120 ms). */
  appear?: boolean;
  /** Prancha: retrato parado do chip saindo. */
  removing?: boolean;
  /** Marcado para sair (1º Backspace num campo de etiquetas) ou repetido (destaque breve). */
  highlighted?: boolean;
  /** Texto inteiro numa dica do DS quando o valor corta — nunca o `title` nativo. */
  title?: string;
  'data-force'?: string;
  /** Prancha: estado forçado do X (`hover`, `focus`). */
  removeForce?: string;
  ref?: Ref<HTMLSpanElement>;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [valueRef, clipped] = useClipped<HTMLSpanElement>([children]);
  const setRef = (node: HTMLSpanElement | null) => {
    ref.current = node;
    if (typeof outerRef === 'function') outerRef(node);
    else if (outerRef) outerRef.current = node;
  };
  const kind = variant === 'paper' ? 'filter' : 'tag';
  useLayoutEffect(() => {
    const el = ref.current;
    if (!leaving || !el || reduced()) return;
    const width = el.getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(el.parentElement ?? el).columnGap) || 0;
    const animation = el.animate(
      [
        { maxWidth: `${width}px`, opacity: 1, marginInlineEnd: '0px' },
        { maxWidth: '0px', opacity: 0, marginInlineEnd: `${-gap}px` },
      ],
      { duration: 180, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' },
    );
    return () => animation.cancel();
  }, [leaving]);

  function onKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    if (!onRemove || leaving) return;
    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      onRemove();
    }
  }
  const name =
    removeLabel ??
    `Remover ${label ? `${label.replace(/:\s*$/, '')} ` : ''}${typeof children === 'string' ? children : 'filtro'}`;
  const body = (
    <>
      {Icon && <Icon aria-hidden="true" />}
      {leading && <span className={s.chipLeading}>{leading}</span>}
      {label && <span className={s.label}>{label}</span>}
      {children !== undefined && (
        <span ref={valueRef} className={s.value}>
          {children}
        </span>
      )}
    </>
  );
  const chip = (
    <span
      ref={setRef}
      className={s.chip}
      data-kind={kind}
      data-size={size}
      data-variant={variant === 'soft' ? 'neutral' : variant}
      data-interactive={onClick ? '' : undefined}
      data-removable={onRemove ? '' : undefined}
      data-leaving={leaving || undefined}
      data-appear={appear || undefined}
      data-removing={removing || undefined}
      data-highlighted={highlighted || undefined}
      data-force={onClick ? undefined : force}
      aria-hidden={leaving || undefined}
      onKeyDown={onKeyDown}
    >
      {onClick ? (
        <button
          type="button"
          className={s.chipBody}
          onClick={onClick}
          aria-expanded={expanded}
          data-force={force}
          tabIndex={leaving ? -1 : undefined}
        >
          {body}
        </button>
      ) : (
        <span className={s.chipBody}>{body}</span>
      )}
      {onRemove && (
        <button
          type="button"
          className={s.remove}
          onClick={onRemove}
          aria-label={name}
          data-force={removeForce}
          tabIndex={leaving ? -1 : undefined}
        >
          <X aria-hidden="true" />
        </button>
      )}
    </span>
  );
  return title ? (
    <Tooltip content={title} bare describe={false} disabled={!clipped}>
      {chip}
    </Tooltip>
  ) : (
    chip
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className={s.kbd}>{children}</kbd>;
}

/** Contagem: neutra (g-75), destaque (b-100) ou sólida (b-600). Números tabulares. */
export function Count({
  children,
  tone = 'neutral',
  label,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'solid';
  label?: string;
}) {
  return (
    <span className={s.count} data-tone={tone} aria-label={label}>
      {children}
    </span>
  );
}
