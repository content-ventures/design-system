'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { VisuallyHidden } from './a11y';
import { Button } from './button';
import { Skeleton } from './feedback';
import { ImageOff, Quote, RotateCw } from './icons';
import { boundVars, ratioOf, useFitHeight, type MediaRatio } from './media';
import { useIsoLayoutEffect } from './popover';
import { ThemeV3 } from './theme';
import s from './slide-canvas.module.css';

/* ——————————————————————————— Tipos ——————————————————————————— */

export type SlideLayout = 'cover' | 'text' | 'quote' | 'list' | 'closing';
export type SlideTheme = 'light' | 'dark' | 'accent';
export type SlideSlot = 'eyebrow' | 'title' | 'body' | 'quote' | 'attribution' | 'items' | 'footer';
export type SlideCanvasMode = 'read' | 'edit' | 'thumb';
export type SlideCanvasState = 'loading' | 'ready' | 'error';
/** Tamanho final da peça em px (exportação). A proporção do quadro sai daqui. */
export type SlideDesign = { w: number; h: number };

/** Texto de cada lugar do slide. Só texto: o layout decide tipo, cor e posição. */
export type SlideContent = {
  /** Chapéu: uma linha curta acima do título. */
  eyebrow?: string;
  title?: string;
  /** Texto corrido; `\n` quebra linha. */
  body?: string;
  quote?: string;
  /** Crédito da citação (“Nome, cargo”). */
  attribution?: string;
  items?: string[];
  /** Rodapé de uma linha (veículo, endereço). */
  footer?: string;
};

/** Limites por lugar: linhas (chapéu, título, crédito, rodapé) ou itens (lista). */
export type SlideLimits = Partial<
  Record<'eyebrow' | 'title' | 'attribution' | 'footer', number>
> & {
  items?: number;
};

export type SlideOverflow = Partial<Record<SlideSlot, boolean>>;

/* ——————————————————————————— Layouts como dado ——————————————————————————— */

type SlotSpec = {
  slot: SlideSlot;
  /** Máximo de linhas; acima disso o lugar transborda. */
  lines?: number;
  /** Ocupa o espaço que sobra; transborda quando não cabe no slide. */
  fill?: boolean;
  /** Na edição aparece mesmo vazio, com o nome do lugar. */
  required?: boolean;
};
type LayoutSpec = { align: 'start' | 'center' | 'end'; slots: SlotSpec[] };

const LAYOUTS: Record<SlideLayout, LayoutSpec> = {
  cover: {
    align: 'end',
    slots: [
      { slot: 'eyebrow', lines: 1 },
      { slot: 'title', lines: 4, required: true },
      { slot: 'body', fill: true },
    ],
  },
  text: {
    align: 'start',
    slots: [
      { slot: 'eyebrow', lines: 1 },
      { slot: 'title', lines: 2, required: true },
      { slot: 'body', fill: true, required: true },
    ],
  },
  quote: {
    align: 'center',
    slots: [
      { slot: 'quote', fill: true, required: true },
      { slot: 'attribution', lines: 2 },
    ],
  },
  list: {
    align: 'start',
    slots: [
      { slot: 'eyebrow', lines: 1 },
      { slot: 'title', lines: 2, required: true },
      { slot: 'items', fill: true, required: true },
    ],
  },
  closing: {
    align: 'center',
    slots: [
      { slot: 'title', lines: 3, required: true },
      { slot: 'body', fill: true },
    ],
  },
};
const FOOTER: SlotSpec = { slot: 'footer', lines: 1 };
const ITEMS_MAX = 5;
/** Largura de desenho: o slide é composto em 360 px com a escala de leitura e ampliado. */
const BASE = 360;

/** Nome curto de cada lugar (rótulo de campo, nome acessível, marcador vazio). */
export const SLIDE_SLOT_LABELS: Record<SlideSlot, string> = {
  eyebrow: 'Chapéu',
  title: 'Título',
  body: 'Texto',
  quote: 'Citação',
  attribution: 'Crédito',
  items: 'Lista',
  footer: 'Rodapé',
};

function specOf(layout: SlideLayout, slot: SlideSlot, limits?: SlideLimits): SlotSpec | undefined {
  const spec =
    slot === 'footer' ? FOOTER : LAYOUTS[layout].slots.find((entry) => entry.slot === slot);
  if (!spec) return undefined;
  if (slot === 'items' || !spec.lines) return spec;
  const custom = limits?.[slot as keyof Omit<SlideLimits, 'items'>];
  return custom ? { ...spec, lines: custom } : spec;
}

/** Lugares que o layout usa, na ordem de leitura (rodapé por último). Monta os campos do produto. */
export function slideSlots(layout: SlideLayout): SlideSlot[] {
  return [...LAYOUTS[layout].slots.map((entry) => entry.slot), 'footer'];
}

/**
 * Texto do aviso quando um lugar transborda, igual no campo e na faixa de slides:
 * “Título excede 2 linhas”, “Texto não cabe no slide”.
 */
export function slideOverflowMessage(layout: SlideLayout, slot: SlideSlot, limits?: SlideLimits) {
  const spec = specOf(layout, slot, limits);
  const label = SLIDE_SLOT_LABELS[slot];
  if (spec?.lines) return `${label} excede ${spec.lines} ${spec.lines === 1 ? 'linha' : 'linhas'}`;
  return `${label} não cabe no slide`;
}

/** “4/5” → 1080 × 1350. */
function designOf(ratio: MediaRatio, design?: SlideDesign): SlideDesign {
  if (design && design.w > 0 && design.h > 0) return design;
  const [w, h] = ratioOf(ratio)
    .split('/')
    .map((part) => Number(part.trim()) || 1);
  return { w: 1080, h: Math.round((1080 * (h ?? 1)) / (w ?? 1)) };
}

/* ——————————————————————————— Medição ——————————————————————————— */

function lineHeightOf(el: HTMLElement) {
  const style = getComputedStyle(el);
  const line = parseFloat(style.lineHeight);
  if (Number.isFinite(line) && line > 0) return line;
  const size = parseFloat(style.fontSize);
  return Number.isFinite(size) && size > 0 ? size * 1.3 : 20;
}

function clampText(text: HTMLElement, lines: number) {
  text.dataset.clamped = '';
  text.style.setProperty('--clamp', String(Math.max(1, lines)));
}

/**
 * Mede no espaço de desenho (360 px), sem depender da escala: 1) zera cortes; 2) lugar com limite
 * de linhas que passa dele ganha corte com reticências; 3) o lugar elástico recebe o que sobrou —
 * se não cabe, corta na última linha inteira (lista: some o item que não cabe).
 */
function measureSlide(
  frame: HTMLElement,
  main: HTMLElement,
  layout: SlideLayout,
  limits?: SlideLimits,
) {
  const result: SlideOverflow = {};
  const wrappers = [...frame.querySelectorAll<HTMLElement>('[data-slot]')];
  wrappers.forEach((wrapper) => {
    const text = wrapper.querySelector<HTMLElement>('[data-text]');
    if (text) {
      delete text.dataset.clamped;
      text.style.removeProperty('--clamp');
    }
    wrapper.querySelectorAll<HTMLElement>('[data-cut]').forEach((li) => delete li.dataset.cut);
  });

  wrappers.forEach((wrapper) => {
    const slot = wrapper.dataset.slot as SlideSlot;
    if (wrapper.dataset.empty !== undefined) return;
    if (slot === 'items') {
      const max = limits?.items ?? ITEMS_MAX;
      const rows = [...wrapper.querySelectorAll<HTMLElement>('li')];
      if (rows.length > max) {
        rows.slice(max).forEach((li) => (li.dataset.cut = ''));
        result.items = true;
      }
      return;
    }
    const lines = specOf(layout, slot, limits)?.lines;
    const text = wrapper.querySelector<HTMLElement>('[data-text]');
    if (!lines || !text) return;
    const line = lineHeightOf(text);
    if (text.scrollHeight > lines * line + 1) {
      clampText(text, lines);
      result[slot] = true;
    }
  });

  const fill = LAYOUTS[layout].slots.find((entry) => entry.fill)?.slot;
  const fillEl = fill
    ? ([...main.children].find((child) => (child as HTMLElement).dataset.slot === fill) as
        HTMLElement | undefined)
    : undefined;
  if (fill && fillEl && fillEl.dataset.empty === undefined) {
    const kids = [...main.children] as HTMLElement[];
    const gap = parseFloat(getComputedStyle(main).rowGap) || 0;
    const total =
      kids.reduce((sum, kid) => sum + kid.offsetHeight, 0) + gap * Math.max(0, kids.length - 1);
    const over = total - main.clientHeight;
    if (over > 1) {
      const allowed = fillEl.offsetHeight - over;
      if (fill === 'items') {
        fillEl.querySelectorAll<HTMLElement>('li:not([data-cut])').forEach((li) => {
          if (li.offsetTop + li.offsetHeight > allowed + 0.5) li.dataset.cut = '';
        });
      } else {
        const text = fillEl.querySelector<HTMLElement>('[data-text]');
        if (text) clampText(text, Math.floor(allowed / lineHeightOf(text)));
      }
      result[fill] = true;
    }
  }
  return result;
}

const sameOverflow = (a: SlideOverflow, b: SlideOverflow) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<SlideSlot>;
  for (const key of keys) if (Boolean(a[key]) !== Boolean(b[key])) return false;
  return true;
};

const tidy = (value?: string) => value?.trim().replace(/[.\s]+$/, '') ?? '';

/** Resumo do slide para leitor de tela (modo leitura). */
function summaryOf(content: SlideContent, page?: { current: number; total: number }) {
  const parts = [
    page ? `Slide ${page.current} de ${page.total}` : 'Slide',
    tidy(content.eyebrow),
    tidy(content.title),
    tidy(content.body),
    content.quote ? `“${tidy(content.quote)}”` : '',
    tidy(content.attribution),
    content.items?.length ? content.items.map(tidy).join('; ') : '',
    tidy(content.footer),
  ];
  return `${parts.filter(Boolean).join('. ')}.`;
}

/* ——————————————————————————— Componente ——————————————————————————— */

export type SlideCanvasProps = Omit<ComponentProps<'div'>, 'children' | 'content'> & {
  layout: SlideLayout;
  content: SlideContent;
  /** Modelo neutro provisório: papel claro, papel escuro ou azul de ação. */
  theme?: SlideTheme;
  /** Proporção do quadro. Ignorada quando há `design`. */
  ratio?: MediaRatio;
  /** Tamanho final (padrão: 1080 de largura na proporção de `ratio`). */
  design?: SlideDesign;
  limits?: SlideLimits;
  /** `read`: imagem com resumo · `edit`: lugares escolhíveis e transbordo marcado · `thumb`: miniatura decorativa. */
  mode?: SlideCanvasMode;
  state?: SlideCanvasState;
  /** Posição na sequência (“2/5” no rodapé). */
  page?: { current: number; total: number };
  /** Marca no rodapé (ex.: `BrandMark` decorativo). */
  brand?: ReactNode;
  /** Nome acessível. Padrão: resumo do conteúdo (leitura) ou “Slide N” (edição). */
  label?: string;
  radius?: 'none' | 'sm' | 'md' | 'lg';
  selectedSlot?: SlideSlot | null;
  onSlotSelect?: (slot: SlideSlot | null) => void;
  /** Chamado quando um lugar passa a transbordar ou volta a caber. */
  onOverflow?: (slot: SlideSlot, overflowing: boolean) => void;
  onRetry?: () => void;
  /** Pranchas: estado parado de um lugar na edição (`hover`, `focus`). */
  slotForce?: { slot: SlideSlot; state: string };
  /** Teto da altura do quadro (número = px; texto = medida CSS). O quadro estreita e centra. */
  maxHeight?: number | string;
  /**
   * Cabe no palco: a altura visível da área que rola em volta, menos o que vem antes do slide nela
   * (piso de 240 px), como `MediaFrame fitHeight`.
   */
  fitHeight?: boolean;
};

/**
 * Um slide desenhado a partir de dados: layout (capa, texto, citação, lista, fecho) com lugares
 * de texto, tema neutro e escala para a largura do contêiner. Compõe em 360 px com a escala de
 * leitura (`--t-prose-*`) e amplia; o tamanho final (`design`, padrão 1080 × 1350) só define a
 * proporção. Mede o texto no lugar real: título acima do limite de linhas ou texto que não cabe
 * ganha reticências, `onOverflow(lugar, true)` e, na edição, contorno tracejado âmbar. As cores do
 * slide não seguem o modo escuro da interface: o slide é a peça, igual em qualquer tela.
 */
export function SlideCanvas({
  layout,
  content,
  theme = 'light',
  ratio = '4/5',
  design,
  limits,
  mode = 'read',
  state = 'ready',
  page,
  brand,
  label,
  radius,
  selectedSlot = null,
  onSlotSelect,
  onOverflow,
  onRetry,
  slotForce,
  maxHeight,
  fitHeight = false,
  className = '',
  style,
  onClick,
  onKeyDown,
  ...props
}: SlideCanvasProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const uid = useId();
  const size = designOf(ratio, design);
  const height = (BASE * size.h) / size.w;
  const spec = LAYOUTS[layout];
  const edit = mode === 'edit';
  const thumb = mode === 'thumb';
  const bound = fitHeight || maxHeight !== undefined;
  useFitHeight(rootRef, rootRef, fitHeight);

  const [scale, setScale] = useState(0);
  useIsoLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const update = () => {
      const width = el.clientWidth;
      if (width > 0) setScale(width / BASE);
    };
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // A fonte muda a métrica: mede de novo quando ela termina de carregar.
  const [fontsTick, setFontsTick] = useState(0);
  useEffect(() => {
    const fonts = typeof document === 'undefined' ? undefined : document.fonts;
    if (!fonts) return;
    let alive = true;
    const bump = () => alive && setFontsTick((tick) => tick + 1);
    fonts.ready?.then(bump).catch(() => undefined);
    fonts.addEventListener?.('loadingdone', bump);
    return () => {
      alive = false;
      fonts.removeEventListener?.('loadingdone', bump);
    };
  }, []);

  const [overflow, setOverflow] = useState<SlideOverflow>({});
  const reported = useRef<SlideOverflow | null>(null);
  const report = useRef(onOverflow);
  useIsoLayoutEffect(() => {
    report.current = onOverflow;
  });
  const contentKey = JSON.stringify(content);
  const limitsKey = JSON.stringify(limits ?? {});
  useIsoLayoutEffect(() => {
    if (state !== 'ready') return;
    const frame = frameRef.current;
    const main = mainRef.current;
    if (!frame || !main) return;
    const next = measureSlide(frame, main, layout, limits);
    setOverflow((prev) => (sameOverflow(prev, next) ? prev : next));
    const before = reported.current;
    reported.current = next;
    const notify = report.current;
    if (!notify) return;
    // Primeira medição: informa todos os lugares do layout; depois, só o que mudou.
    const slots = new Set<SlideSlot>([
      ...(before ? (Object.keys(before) as SlideSlot[]) : slideSlots(layout)),
      ...(Object.keys(next) as SlideSlot[]),
    ]);
    slots.forEach((slot) => {
      const now = Boolean(next[slot]);
      if (!before || Boolean(before[slot]) !== now) notify(slot, now);
    });
    // Conteúdo e limites entram pela chave serializada (objetos novos a cada render não remedem).
  }, [layout, contentKey, limitsKey, size.w, size.h, state, theme, fontsTick]);

  const select = (slot: SlideSlot | null) => {
    if (edit) onSlotSelect?.(slot);
  };

  const valueOf = (slot: SlideSlot): string => {
    if (slot === 'items') return (content.items ?? []).filter(Boolean).join('; ');
    return (content[slot] ?? '').trim();
  };

  // Função de desenho (não componente): o nó do lugar sobrevive às renderizações e o foco fica.
  const renderSlot = (entry: SlotSpec) => {
    const { slot } = entry;
    const value = valueOf(slot);
    const empty = value === '';
    if (empty && !(edit && entry.required)) return null;
    const over = Boolean(overflow[slot]) && !empty;
    const selected = edit && selectedSlot === slot;
    const noteId = `${uid}-${slot}`;
    const force = slotForce?.slot === slot ? slotForce.state : undefined;
    const body =
      slot === 'items' && !empty ? (
        <ol className={s.items}>
          {(content.items ?? []).filter(Boolean).map((item, index) => (
            <li key={`${index}-${item}`} className={s.item}>
              <span className={s.itemNum}>{index + 1}</span>
              <span className={s.itemText}>{item}</span>
            </li>
          ))}
        </ol>
      ) : (
        <span className={s.text} data-text="" data-empty={empty || undefined}>
          {empty ? SLIDE_SLOT_LABELS[slot] : slot === 'quote' ? `“${value}”` : value}
        </span>
      );
    // Sem `onSlotSelect` a edição só desenha (seleção e transbordo), sem virar botão.
    if (!edit || !onSlotSelect) {
      return (
        <div
          key={slot}
          className={s.slot}
          data-slot={slot}
          data-empty={empty || undefined}
          data-overflow={over || undefined}
          data-selected={selected || undefined}
          data-force={force}
        >
          {body}
        </div>
      );
    }
    return (
      <div
        key={slot}
        className={s.slot}
        data-slot={slot}
        data-empty={empty || undefined}
        data-overflow={over || undefined}
        data-selected={selected || undefined}
        data-force={force}
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        aria-label={`${SLIDE_SLOT_LABELS[slot]}: ${empty ? 'vazio' : value}`}
        aria-describedby={over ? noteId : undefined}
        onClick={(event) => {
          event.stopPropagation();
          select(slot);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            select(slot);
          }
        }}
      >
        {body}
        {over && (
          <VisuallyHidden>
            <span id={noteId}>{slideOverflowMessage(layout, slot, limits)}</span>
          </VisuallyHidden>
        )}
      </div>
    );
  };

  const frame = (
    <div className={s.frame} ref={frameRef}>
      <div className={s.main} ref={mainRef} data-layout={layout} data-align={spec.align}>
        {layout === 'quote' && (
          <span className={s.mark} aria-hidden="true">
            <Quote />
          </span>
        )}
        {spec.slots.map(renderSlot)}
      </div>
      {(brand || content.footer || page) && (
        <div className={s.foot}>
          {brand && (
            <span className={s.brand} aria-hidden="true">
              {brand}
            </span>
          )}
          {content.footer ? renderSlot(FOOTER) : <span className={s.spacer} />}
          {page && (
            <span className={s.page}>
              {page.current}/{page.total}
            </span>
          )}
        </div>
      )}
    </div>
  );

  const skeleton = (
    <div className={s.frame}>
      <div className={s.main} data-layout="cover" data-align="end">
        <Skeleton width="36%" height={14} />
        <span className={s.skelTitle}>
          <Skeleton width="92%" height={24} />
          <Skeleton width="68%" height={24} delay={80} />
        </span>
        <span className={s.skelBody}>
          <Skeleton width="86%" height={12} delay={160} />
          <Skeleton width="54%" height={12} delay={240} />
        </span>
      </div>
      <div className={s.foot}>
        <Skeleton width="32%" height={10} delay={320} />
      </div>
    </div>
  );

  const error = (
    <div
      className={s.error}
      role={onRetry && !thumb ? 'group' : 'img'}
      aria-label={onRetry && !thumb ? undefined : 'Prévia indisponível'}
    >
      <ImageOff className={s.errorIcon} aria-hidden="true" />
      {!thumb && <span className={s.errorText}>Prévia indisponível</span>}
      {onRetry && !thumb && (
        <Button size="sm" icon={RotateCw} onClick={onRetry}>
          Tentar de novo
        </Button>
      )}
    </div>
  );

  const ready = state === 'ready';
  const role = thumb || state === 'error' ? undefined : edit && ready ? 'group' : 'img';
  const name =
    state === 'loading'
      ? 'Carregando slide'
      : edit
        ? (label ?? (page ? `Slide ${page.current} de ${page.total}` : 'Slide'))
        : (label ?? summaryOf(content, page));

  return (
    <div
      {...props}
      ref={rootRef}
      className={`${s.canvas} ${className}`}
      style={{
        aspectRatio: `${size.w} / ${size.h}`,
        ...(bound ? boundVars(size.w / size.h, maxHeight) : null),
        ...style,
      }}
      data-bound={bound || undefined}
      data-mode={mode}
      data-state={state}
      data-theme={theme}
      data-layout={layout}
      data-radius={radius ?? (thumb ? 'none' : 'md')}
      data-scaled={scale > 0 || undefined}
      role={role}
      aria-roledescription={role ? 'slide' : undefined}
      aria-label={role ? name : undefined}
      aria-busy={state === 'loading' || undefined}
      aria-hidden={thumb || undefined}
      onClick={(event: MouseEvent<HTMLDivElement>) => {
        onClick?.(event);
        if (edit && !event.defaultPrevented) select(null);
      }}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        if (edit && event.key === 'Escape' && selectedSlot) {
          event.preventDefault();
          select(null);
        }
      }}
    >
      {state === 'error' ? (
        error
      ) : (
        <div
          className={s.scaler}
          style={{ width: BASE, height, transform: `scale(${scale || 1})` }}
        >
          <ThemeV3
            mode={theme === 'dark' ? 'dark' : 'light'}
            className={s.slide}
            data-theme={theme}
            aria-hidden={!edit || !ready || undefined}
          >
            {ready ? frame : skeleton}
          </ThemeV3>
        </div>
      )}
    </div>
  );
}
