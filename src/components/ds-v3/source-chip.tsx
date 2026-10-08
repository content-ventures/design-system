'use client';

import {
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { VisuallyHidden } from './a11y';
import { Button } from './button';
import { Spinner } from './feedback';
import { HoverCard } from './hover-card';
import {
  Check,
  FileText,
  Image as ImageIcon,
  Library,
  Link2,
  Quote,
  ScrollText,
  TextQuote,
  X,
  type LucideIcon,
} from './icons';
import { Tooltip } from './overlays';
import { Popover } from './popover';
import s from './source-chip.module.css';

/*
 * Fonte de um texto gerado: a transcrição, um trecho, um link, o acervo. Chip de 28 px (compositor,
 * etapas da IA, revisão) ou marca de citação dentro do texto corrido (`inline`). A prévia abre num
 * `HoverCard` no ponteiro e no foco por teclado; no toque, num `Popover`. Sem fio lateral, sem caixa
 * colorida: verde só no check de “usada”, vermelho só no “Falta”.
 */

export type SourceKind = 'transcript' | 'excerpt' | 'url' | 'archive' | 'quote' | 'media' | 'file';

/**
 * `selected` escolhida como contexto (azul de seleção) · `used` conferida no texto (check verde) ·
 * `missing` a citação não bate com a fonte (“Falta” em vermelho).
 */
export type SourceChipState = 'default' | 'selected' | 'used' | 'missing';

/** Nome de cada tipo, para leitor de tela e legendas. */
export const sourceKindLabel: Record<SourceKind, string> = {
  transcript: 'Transcrição',
  excerpt: 'Trecho',
  url: 'Link',
  archive: 'Acervo',
  quote: 'Citação',
  media: 'Mídia',
  file: 'Arquivo',
};

const KIND_ICON: Record<SourceKind, LucideIcon> = {
  transcript: ScrollText,
  excerpt: TextQuote,
  url: Link2,
  archive: Library,
  quote: Quote,
  media: ImageIcon,
  file: FileText,
};

const STATE_TEXT: Record<SourceChipState, string> = {
  default: '',
  selected: ' (selecionada)',
  used: ' (usada)',
  missing: ' (falta)',
};

export type SourceChipProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  kind: SourceKind;
  /** “Clara Souto”, “Trecho 12:48”, “valor.globo.com”. Corta com reticências. */
  label: string;
  /** Depois do rótulo, em cinza: “Entrevistadora · 12:48”. */
  meta?: string;
  state?: SourceChipState;
  /** `chip` 28 px · `inline` marca de citação no meio do texto (número ou rótulo curto). */
  variant?: 'chip' | 'inline';
  /** Número da citação. Em `inline`, substitui o rótulo visível. */
  index?: number;
  /** Prévia de leitura (fala, trecho, página): `HoverCard` no ponteiro/foco, `Popover` no toque. */
  preview?: ReactNode;
  /** Largura da prévia. Padrão 320. */
  previewWidth?: number;
  /** Abre a fonte (rola a transcrição até o trecho, abre o link). */
  onOpen?: () => void;
  /** Ação da prévia no toque. Padrão: “Abrir na transcrição”, “Abrir link” ou “Abrir fonte”. */
  openLabel?: string;
  /** Tira a fonte do contexto (compositor). Só em `chip`; Delete/Backspace no chip também removem. */
  onRemove?: () => void;
  disabled?: boolean;
  /** Resolvendo a fonte (título do link, trecho): spinner no lugar do ícone. */
  loading?: boolean;
  /** Prancha: prévia aberta e parada, no fluxo. Nunca no produto. */
  previewPinned?: boolean;
  /** Pranchas: estado parado (`hover`, `active`, `focus`). Nunca no produto. */
  'data-force'?: string;
};

function defaultOpenLabel(kind: SourceKind) {
  if (kind === 'transcript' || kind === 'excerpt') return 'Abrir na transcrição';
  if (kind === 'url') return 'Abrir link';
  return 'Abrir fonte';
}

/**
 * Fonte citada. `chip`: ícone do tipo 14, rótulo 12/500, meta 11.5 `--muted`, remover 20 px.
 * Hover fio `--line-hover` + `--g-25`; selecionada `--select-bg`/`--select-line`; usada ganha check
 * verde; falta troca a meta por “Falta” vermelho com fio `--red-line`. `inline`: marca de 18 px
 * levemente elevada na linha, número tabular (ou ícone + rótulo curto), azul suave no hover.
 * Clique (ponteiro/teclado) chama `onOpen`; no toque, abre a prévia com a ação de abrir.
 */
export function SourceChip({
  kind,
  label,
  meta,
  state = 'default',
  variant = 'chip',
  index,
  preview,
  previewWidth = 320,
  onOpen,
  openLabel,
  onRemove,
  disabled = false,
  loading = false,
  previewPinned = false,
  className = '',
  'data-force': force,
  ...props
}: SourceChipProps) {
  const [touchOpen, setTouchOpen] = useState(false);
  const pointer = useRef('');
  const inline = variant === 'inline';
  const interactive = Boolean(onOpen || preview);
  const missing = state === 'missing';
  const Icon = KIND_ICON[kind];
  const kindText = sourceKindLabel[kind];
  const named = `${index !== undefined ? `Fonte ${index}, ` : ''}${kindText}: ${label}${
    meta ? ` · ${meta}` : ''
  }`;

  const glyph = loading ? (
    <Spinner size={14} tone="muted" delay={0} className={s.icon} />
  ) : (
    <Icon className={s.icon} aria-hidden="true" />
  );

  const content = inline ? (
    <>
      {index !== undefined ? (
        <span className={s.index} aria-hidden="true">
          {index}
        </span>
      ) : (
        <>
          {glyph}
          <span className={s.label} aria-hidden="true">
            {label}
          </span>
        </>
      )}
      {missing && (
        <span className={s.missing} aria-hidden="true">
          Falta
        </span>
      )}
      <VisuallyHidden>{`${named}${STATE_TEXT[state]}`}</VisuallyHidden>
    </>
  ) : (
    <>
      {glyph}
      {index !== undefined && (
        <span className={s.chipIndex}>
          <VisuallyHidden>Fonte </VisuallyHidden>
          {index}
        </span>
      )}
      <VisuallyHidden>{`${kindText}: `}</VisuallyHidden>
      <span className={s.label}>{label}</span>
      {missing ? (
        <span className={s.missing}>Falta</span>
      ) : (
        meta && <span className={s.meta}>{meta}</span>
      )}
      {state === 'used' && <Check className={s.used} aria-hidden="true" data-icon="used" />}
      {state !== 'default' && state !== 'missing' && (
        <VisuallyHidden>{STATE_TEXT[state]}</VisuallyHidden>
      )}
    </>
  );

  const usePreview = Boolean(preview) && !disabled;

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    pointer.current = event.pointerType;
  };
  const activate = () => {
    const touch = pointer.current === 'touch' || pointer.current === 'pen';
    pointer.current = '';
    if (disabled || loading) return;
    if (touch && usePreview) {
      setTouchOpen((open) => !open);
      return;
    }
    onOpen?.();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (inline || !onRemove || disabled) return;
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      onRemove();
    }
  };

  const hit = (ref?: (node: HTMLElement | null) => void) =>
    interactive ? (
      <button
        ref={ref}
        type="button"
        className={s.hit}
        disabled={disabled}
        aria-busy={loading || undefined}
        aria-expanded={touchOpen || undefined}
        aria-haspopup={usePreview && !onOpen ? 'dialog' : undefined}
        onPointerDown={onPointerDown}
        onClick={activate}
        onKeyDown={onKeyDown}
      >
        {content}
      </button>
    ) : (
      <span className={s.hit}>{content}</span>
    );

  const touchPanel = usePreview ? (
    <Popover
      open={touchOpen}
      onOpenChange={setTouchOpen}
      label={`Prévia · ${label}`}
      width={previewWidth}
      trigger={(triggerProps) => hit(triggerProps.ref)}
    >
      {({ close }) => (
        <div className={s.preview}>
          {preview}
          {onOpen && (
            <Button
              size="sm"
              onClick={() => {
                close();
                onOpen();
              }}
            >
              {openLabel ?? defaultOpenLabel(kind)}
            </Button>
          )}
        </div>
      )}
    </Popover>
  ) : (
    hit()
  );

  const card = <div className={s.preview}>{preview}</div>;
  // Prancha: a prévia parada fica sob o chip inteiro (fora da caixa de 28 px).
  const body =
    usePreview && !previewPinned ? (
      <HoverCard trigger={touchPanel} width={previewWidth}>
        {card}
      </HoverCard>
    ) : (
      touchPanel
    );

  const chip = (
    <span
      {...props}
      className={`${s.chip} ${className}`}
      data-variant={variant}
      data-state={state}
      data-kind={kind}
      data-interactive={interactive || undefined}
      data-disabled={disabled || undefined}
      data-loading={loading || undefined}
      data-force={force}
    >
      {body}
      {!inline && onRemove && (
        <Tooltip bare describe={false} content="Remover">
          <button
            type="button"
            className={s.remove}
            aria-label={`Remover ${label}`}
            disabled={disabled}
            onClick={onRemove}
          >
            <X aria-hidden="true" />
          </button>
        </Tooltip>
      )}
    </span>
  );

  if (usePreview && previewPinned) {
    return (
      <HoverCard trigger={chip} width={previewWidth} pinned>
        {card}
      </HoverCard>
    );
  }
  return chip;
}
