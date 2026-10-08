'use client';

import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import {
  Children,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { Button, IconButton } from './button';
import { MediaFrame, ratioOf, useFitHeight, type MediaRatio, type MediaState } from './media';
import { Dialog, Tooltip } from './overlays';
import s from './gallery.module.css';

export type GalleryItem = {
  id: string;
  src?: string;
  alt: string;
  /** Proporção real da peça (“970/250”). */
  ratio: MediaRatio;
  /** Nome do arquivo ou rótulo curto (“peca-970x250.png”). */
  label: string;
  /** Legenda tabular (“970 × 250 px · PNG”). */
  meta?: string;
};

const SWIPE = 48;

/**
 * Peças lado a lado: imagem principal + faixa de miniaturas, anterior/próximo nas laterais,
 * “2 de 3”, ←/→ no teclado e arrasto no toque. Clicar na principal abre a peça grande.
 * Sem reprodução automática; um item só esconde toda a navegação. Com `fitHeight`, o palco não
 * passa da altura visível da área que rola em volta: a peça (um slide 4:5) aparece inteira, sem
 * rolar, num painel largo e baixo.
 */
export function Gallery({
  items,
  index,
  onIndexChange,
  label = 'Peças',
  stageRatio = '16/9',
  onDownload,
  thumbForce,
  mainState,
  fitHeight = false,
}: {
  items: GalleryItem[];
  index: number;
  onIndexChange: (index: number) => void;
  label?: string;
  /** Proporção do palco; a peça entra inteira (contain) no centro. */
  stageRatio?: MediaRatio;
  onDownload?: (item: GalleryItem) => void;
  /** Pranchas: miniatura parada em `hover` ou `focus`. */
  thumbForce?: { index: number; state: string };
  /** Pranchas: estado parado da peça principal. */
  mainState?: MediaState;
  /**
   * Cabe no palco: a altura do palco para na altura visível da área que rola em volta, menos o que
   * vem antes da galeria e a faixa de miniaturas (piso de 240 px, como no `MediaFrame`). A largura
   * segue a do contêiner; a peça encolhe por dentro e continua inteira (contain).
   */
  fitHeight?: boolean;
}) {
  const galleryRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLButtonElement>(null);
  const count = items.length;
  // Sem peças não há palco: a medida recomeça quando a galeria aparece.
  useFitHeight(galleryRef, stageRef, fitHeight, count > 0 ? 'stage' : 'empty');
  const current = Math.min(Math.max(index, 0), Math.max(0, count - 1));
  const item = items[current];
  const multiple = count > 1;

  // Direção e camada que sai: deriva da troca de índice, sem efeito.
  const [shown, setShown] = useState({ index: current, dir: 0, leaving: null as number | null });
  if (shown.index !== current) {
    setShown({ index: current, dir: current > shown.index ? 1 : -1, leaving: shown.index });
  }
  useEffect(() => {
    if (shown.leaving === null) return;
    const timer = window.setTimeout(() => setShown((value) => ({ ...value, leaving: null })), 200);
    return () => window.clearTimeout(timer);
  }, [shown.leaving]);

  const [open, setOpen] = useState(false);
  const [drag, setDrag] = useState<{ x: number; dx: number; id: number } | null>(null);
  const moved = useRef(false);
  const thumbsRef = useRef<HTMLDivElement>(null);

  // A miniatura atual fica visível na faixa (rolagem curta, sem mexer na página).
  useEffect(() => {
    const strip = thumbsRef.current;
    const thumb = strip?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!strip || !thumb) return;
    // Foco itinerante: se o teclado está na faixa, ele acompanha a miniatura escolhida.
    if (strip.contains(document.activeElement) && document.activeElement !== thumb) {
      thumb.focus({ preventScroll: true });
    }
    const left = thumb.offsetLeft - strip.offsetLeft;
    if (
      left < strip.scrollLeft ||
      left + thumb.offsetWidth > strip.scrollLeft + strip.clientWidth
    ) {
      strip.scrollTo({ left: left - 8, behavior: 'smooth' });
    }
  }, [current]);

  if (!item) return null;

  const go = (next: number) => {
    if (next < 0 || next >= count || next === current) return;
    onIndexChange(next);
  };
  const onKey = (event: KeyboardEvent<HTMLElement>) => {
    if (!multiple || open) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(current + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(current - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      go(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      go(count - 1);
    }
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    moved.current = false;
    if (!multiple || event.pointerType === 'mouse') return;
    setDrag({ x: event.clientX, dx: 0, id: event.pointerId });
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag || drag.id !== event.pointerId) return;
    let dx = event.clientX - drag.x;
    if (Math.abs(dx) > 6) moved.current = true;
    // Nas pontas, o arrasto resiste (um terço do deslocamento).
    if ((current === 0 && dx > 0) || (current === count - 1 && dx < 0)) dx /= 3;
    setDrag({ ...drag, dx });
  };
  const onPointerEnd = () => {
    if (!drag) return;
    if (drag.dx <= -SWIPE) go(current + 1);
    else if (drag.dx >= SWIPE) go(current - 1);
    setDrag(null);
  };

  const leaving = shown.leaving !== null ? items[shown.leaving] : undefined;
  const layerStyle = { '--dir': shown.dir } as CSSProperties;
  const dragStyle: CSSProperties | undefined = drag
    ? { transform: `translateX(${drag.dx}px)`, transition: 'none' }
    : undefined;

  return (
    <section
      ref={galleryRef}
      className={s.gallery}
      aria-roledescription="galeria"
      aria-label={label}
      onKeyDown={onKey}
      data-single={!multiple || undefined}
      data-fit={fitHeight || undefined}
    >
      <div className={s.stageWrap}>
        <button
          ref={stageRef}
          type="button"
          className={s.stage}
          style={{ aspectRatio: ratioOf(stageRatio) }}
          aria-label={`Ampliar ${item.label}`}
          aria-haspopup="dialog"
          onClick={() => {
            if (moved.current) return;
            setOpen(true);
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          data-dragging={drag ? '' : undefined}
        >
          {leaving && (
            <span
              key={`out-${leaving.id}`}
              className={s.layer}
              data-leaving=""
              style={layerStyle}
              aria-hidden="true"
            >
              <Piece item={leaving} />
            </span>
          )}
          <span
            key={item.id}
            className={s.layer}
            data-dir={shown.dir || undefined}
            style={layerStyle}
          >
            <span className={s.dragLayer} style={dragStyle}>
              <Piece item={item} state={mainState} />
            </span>
          </span>
        </button>
        {multiple && (
          <>
            <IconButton
              className={`${s.nav} ${s.prev}`}
              label="Peça anterior"
              icon={ChevronLeft}
              size="sm"
              disabled={current === 0}
              onClick={() => go(current - 1)}
            />
            <IconButton
              className={`${s.nav} ${s.next}`}
              label="Próxima peça"
              icon={ChevronRight}
              size="sm"
              disabled={current === count - 1}
              onClick={() => go(current + 1)}
            />
          </>
        )}
      </div>

      {multiple && (
        <div className={s.foot}>
          <div
            className={s.thumbs}
            ref={thumbsRef}
            role="group"
            aria-label={`Miniaturas · ${label}`}
          >
            {items.map((entry, i) => (
              <Tooltip key={entry.id} bare describe={false} content={entry.label}>
                <button
                  type="button"
                  className={s.thumb}
                  aria-current={i === current}
                  tabIndex={i === current ? 0 : -1}
                  aria-label={`${entry.label} (${i + 1} de ${count})`}
                  onClick={() => go(i)}
                  data-force={thumbForce?.index === i ? thumbForce.state : undefined}
                >
                  <Piece item={entry} thumb />
                </button>
              </Tooltip>
            ))}
          </div>
          <span className={s.counter} aria-live="polite">
            {current + 1} de {count}
          </span>
        </div>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={item.label}
        description={item.meta}
        size="lg"
        footerStart={
          multiple ? (
            <span className={s.lightNav}>
              <IconButton
                label="Peça anterior"
                icon={ChevronLeft}
                size="sm"
                variant="ghost"
                disabled={current === 0}
                onClick={() => go(current - 1)}
              />
              <span className={s.counter}>
                {current + 1} de {count}
              </span>
              <IconButton
                label="Próxima peça"
                icon={ChevronRight}
                size="sm"
                variant="ghost"
                disabled={current === count - 1}
                onClick={() => go(current + 1)}
              />
            </span>
          ) : undefined
        }
        footer={
          <Button icon={Download} onClick={() => onDownload?.(item)}>
            Baixar
          </Button>
        }
      >
        <div
          className={s.light}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') go(current + 1);
            if (event.key === 'ArrowLeft') go(current - 1);
          }}
        >
          <Piece item={item} large />
        </div>
      </Dialog>
    </section>
  );
}

/** A peça inteira dentro do palco, na própria proporção. */
function Piece({
  item,
  thumb = false,
  large = false,
  state,
}: {
  item: GalleryItem;
  thumb?: boolean;
  large?: boolean;
  state?: MediaState;
}) {
  const [w, h] = ratioOf(item.ratio)
    .split('/')
    .map((part) => Number(part.trim()) || 1);
  const wide = (w ?? 1) / (h ?? 1);
  return (
    <span
      className={s.piece}
      data-thumb={thumb || undefined}
      data-large={large || undefined}
      style={{ '--ar': wide } as CSSProperties}
    >
      <MediaFrame
        ratio={item.ratio}
        src={item.src}
        alt={thumb ? '' : item.alt}
        fit="contain"
        radius={thumb ? 'none' : 'sm'}
        state={state}
      />
    </span>
  );
}

/* ——————————————————————————— Carrossel ——————————————————————————— */

/**
 * Fileira com rolagem e encaixe: o próximo item aparece cortado (sinal de que há mais).
 * Anterior/próximo só existem quando há o que rolar; sem pontos e sem reprodução automática.
 */
export function Carousel({
  children,
  label,
  title,
  perView = 4,
}: {
  children: ReactNode;
  label: string;
  /** Título da faixa; os botões ficam à direita dele. Sem título, flutuam nas laterais. */
  title?: ReactNode;
  /** Itens inteiros por vista no desktop (o seguinte aparece pela metade). */
  perView?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ overflow: false, start: true, end: false });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const max = track.scrollWidth - track.clientWidth;
      setEdges({
        overflow: max > 2,
        start: track.scrollLeft <= 2,
        end: track.scrollLeft >= max - 2,
      });
    };
    measure();
    track.addEventListener('scroll', measure, { passive: true });
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    ro?.observe(track);
    return () => {
      track.removeEventListener('scroll', measure);
      ro?.disconnect();
    };
  }, []);

  const page = (dir: 1 | -1) => {
    const track = trackRef.current;
    const first = track?.firstElementChild as HTMLElement | null;
    if (!track || !first) return;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const step = first.offsetWidth + gap;
    const per = Math.max(1, Math.floor((track.clientWidth + gap) / step));
    track.scrollBy({ left: dir * per * step, behavior: 'smooth' });
  };

  const buttons = edges.overflow ? (
    <span className={s.carouselNav}>
      <IconButton
        label="Anteriores"
        icon={ChevronLeft}
        size="sm"
        disabled={edges.start}
        onClick={() => page(-1)}
      />
      <IconButton
        label="Próximos"
        icon={ChevronRight}
        size="sm"
        disabled={edges.end}
        onClick={() => page(1)}
      />
    </span>
  ) : null;

  return (
    <section className={s.carousel} aria-roledescription="carrossel" aria-label={label}>
      {title !== undefined && (
        <header className={s.carouselHead}>
          <h3 className={s.carouselTitle}>{title}</h3>
          {buttons}
        </header>
      )}
      <div className={s.trackWrap} data-floating={title === undefined || undefined}>
        <div
          ref={trackRef}
          className={s.track}
          style={{ '--per': perView } as CSSProperties}
          role="list"
        >
          {Children.map(children, (child) => (
            <div className={s.slide} role="listitem">
              {child}
            </div>
          ))}
        </div>
        {title === undefined && buttons}
      </div>
    </section>
  );
}
