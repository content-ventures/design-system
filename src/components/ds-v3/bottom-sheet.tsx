'use client';

import {
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { ContainedLayer, useModalLayer } from './overlays';
import { useIsoLayoutEffect } from './popover';
import { ScrollArea } from './structure';
import s from './bottom-sheet.module.css';

export type SheetSnap = 'auto' | 'half' | 'full';

type SheetLayoutProps = {
  /** Título curto (16/600). Sem título, a camada usa `label` como nome acessível. */
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** Ações fixas no fim (empilhadas na largura toda, a principal em cima). */
  footer?: ReactNode;
};

/** Distância (fração da altura) e velocidade (px/ms) que fecham ao soltar. */
const CLOSE_RATIO = 0.3;
const FLICK = 0.5;

function SheetLayout({
  title,
  description,
  children,
  footer,
  label,
  titleId,
  descId,
  scrollTop,
  grabber,
  onHandleDown,
}: SheetLayoutProps & {
  label: string;
  titleId: string;
  descId: string;
  scrollTop?: number;
  grabber: ReactNode;
  onHandleDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  const viewport = useRef<HTMLDivElement | null>(null);
  const [scrolled, setScrolled] = useState(false);
  useIsoLayoutEffect(() => {
    const el = viewport.current;
    if (!el || !scrollTop) return;
    el.scrollTop = scrollTop;
    setScrolled(el.scrollTop > 0);
  }, [scrollTop]);
  return (
    <>
      <div className={s.handle} data-scrolled={scrolled || undefined} onPointerDown={onHandleDown}>
        {grabber}
        {title && (
          <div className={s.head}>
            <h2 id={titleId} className={s.title}>
              {title}
            </h2>
            {description && (
              <p id={descId} className={s.description}>
                {description}
              </p>
            )}
          </div>
        )}
      </div>
      <ScrollArea
        label={typeof title === 'string' ? title : label}
        className={s.scroll}
        viewportClassName={s.viewport}
        viewportRef={viewport}
        onScroll={(event) => {
          const next = event.currentTarget.scrollTop > 0;
          if (next !== scrolled) setScrolled(next);
        }}
      >
        <div className={s.content} data-footer={footer ? true : undefined}>
          {children}
        </div>
      </ScrollArea>
      {footer && <footer className={s.foot}>{footer}</footer>}
    </>
  );
}

const NUDGE: Keyframe[] = [
  { transform: 'translateY(0)' },
  { transform: 'translateY(-6px)' },
  { transform: 'translateY(0)' },
];

/**
 * Folha que sobe do fim da tela — o modal do celular. Raio 2xl só no topo, alça de 36 × 4, até 90%
 * da altura; corpo rola por dentro e o rodapé fica preso com folga para a área segura.
 * Entra em 280 ms e sai em 200 ms. Arrastar pela alça ou pelo título acompanha o dedo: soltar
 * depois de 30% da altura (ou num gesto rápido) fecha; antes disso, volta. Em `half`, arrastar para
 * cima abre a altura toda (dois pontos de parada, nunca mais). Toque no véu e Escape fecham.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  snap = 'auto',
  dismissible = true,
  contained = false,
  label = 'Painel',
}: SheetLayoutProps & {
  open: boolean;
  onClose: () => void;
  /** `auto` altura do conteúdo · `half` meia altura (arrasta até a total) · `full` 90%. */
  snap?: SheetSnap;
  dismissible?: boolean;
  /** Presa ao contêiner posicionado mais próximo (simulador de celular). */
  contained?: boolean;
  /** Nome acessível quando não há título. */
  label?: string;
}) {
  const layer = useModalLayer({
    open,
    onClose,
    dismissible,
    exitMs: 200,
    contained,
    initialFocus: (root) => root.querySelector<HTMLElement>('[data-autofocus]'),
    nudge: NUDGE,
  });
  const titleId = useId();
  const descId = useId();
  const [expanded, setExpanded] = useState(false);
  if (layer.presence === 'closed' && expanded) setExpanded(false);
  const expandable = snap === 'half';
  const drag = useRef<{
    id: number;
    startY: number;
    dy: number;
    lastY: number;
    lastT: number;
    v: number;
    height: number;
    max: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);

  // Durante a saída o conteúdo é o último aberto.
  const content = { title, description, children, footer };
  const frozen = useRef(content);
  if (open) frozen.current = content;
  const shown = open ? content : frozen.current;

  // Cada abertura começa limpa (sem resto de arrasto).
  useIsoLayoutEffect(() => {
    const sheet = layer.ref.current;
    if (!sheet || layer.presence !== 'open') return;
    sheet.style.transform = '';
    sheet.style.height = '';
    sheet.style.transition = '';
  }, [layer.presence]);

  function settle(sheet: HTMLElement) {
    // Solta os estilos do dedo: a transição do CSS leva de volta ao ponto de parada.
    requestAnimationFrame(() => {
      sheet.style.transform = '';
      sheet.style.height = '';
    });
  }

  function onHandleDown(event: ReactPointerEvent<HTMLDivElement>) {
    const sheet = layer.ref.current;
    if (!sheet || event.button !== 0 || layer.presence !== 'open') return;
    const root = contained ? sheet.parentElement : null;
    const area = root ? root.clientHeight : window.innerHeight;
    drag.current = {
      id: event.pointerId,
      startY: event.clientY,
      dy: 0,
      lastY: event.clientY,
      lastT: event.timeStamp,
      v: 0,
      height: sheet.offsetHeight,
      max: area * 0.9,
      moved: false,
    };
    suppressClick.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    sheet.dataset.dragging = '';
  }
  function onHandleMove(event: ReactPointerEvent<HTMLElement>) {
    const d = drag.current;
    const sheet = layer.ref.current;
    if (!d || !sheet || event.pointerId !== d.id) return;
    const dy = event.clientY - d.startY;
    const dt = Math.max(1, event.timeStamp - d.lastT);
    d.v = d.v * 0.4 + ((event.clientY - d.lastY) / dt) * 0.6;
    d.lastY = event.clientY;
    d.lastT = event.timeStamp;
    d.dy = dy;
    if (Math.abs(dy) > 4) d.moved = true;
    if (dy >= 0) {
      sheet.style.height = '';
      sheet.style.transform = `translateY(${dy}px)`;
    } else if (expandable && !expanded) {
      const room = Math.max(0, d.max - d.height);
      const grow = Math.min(-dy, room);
      const over = -dy - grow;
      sheet.style.height = `${d.height + grow}px`;
      sheet.style.transform = over > 0 ? `translateY(${-over * 0.2}px)` : '';
    } else {
      // Já no alto: resistência elástica.
      sheet.style.transform = `translateY(${dy * 0.2}px)`;
    }
  }
  function onHandleUp(event: ReactPointerEvent<HTMLElement>) {
    const d = drag.current;
    const sheet = layer.ref.current;
    if (!d || !sheet || event.pointerId !== d.id) return;
    drag.current = null;
    delete sheet.dataset.dragging;
    suppressClick.current = d.moved;
    if (!d.moved) {
      settle(sheet);
      return;
    }
    const { dy, v, height, max } = d;
    if (dy > 0 && (dy > height * CLOSE_RATIO || v > FLICK)) {
      // Sai do ponto onde o dedo soltou: a animação de saída parte do transform atual.
      onClose();
      return;
    }
    if (expandable && !expanded && dy < 0 && (-dy > (max - height) * 0.25 || v < -FLICK)) {
      setExpanded(true);
    } else if (expandable && expanded && dy > height * 0.12) {
      setExpanded(false);
    }
    settle(sheet);
  }

  const grabber = expandable ? (
    <button
      type="button"
      className={s.grabber}
      aria-label={expanded ? 'Recolher painel' : 'Expandir painel'}
      aria-expanded={expanded}
      onClick={() => {
        if (suppressClick.current) {
          suppressClick.current = false;
          return;
        }
        setExpanded((value) => !value);
      }}
    />
  ) : (
    <span className={s.grabber} aria-hidden="true" />
  );

  const dialog = (
    <dialog
      {...layer.dialogProps}
      className={s.sheet}
      data-snap={snap}
      data-expanded={expanded || undefined}
      aria-labelledby={shown.title ? titleId : undefined}
      aria-label={shown.title ? undefined : label}
      aria-describedby={shown.description ? descId : undefined}
      tabIndex={-1}
      onPointerMove={onHandleMove}
      onPointerUp={onHandleUp}
      onPointerCancel={onHandleUp}
    >
      {layer.mounted && (
        <SheetLayout
          {...shown}
          label={label}
          titleId={titleId}
          descId={descId}
          grabber={grabber}
          onHandleDown={onHandleDown}
        />
      )}
    </dialog>
  );
  if (!contained) return dialog;
  return (
    <ContainedLayer presence={layer.presence} scrimProps={layer.scrimProps} className={s.containedRoot}>
      {dialog}
    </ContainedLayer>
  );
}

/**
 * A mesma folha, parada e sem camada — para pranchas. Mora num contêiner posicionado (moldura de
 * celular) com o véu. `drag` desenha o arrasto em curso; `scrollTop`, o corpo rolado.
 */
export function BottomSheetFrame({
  title,
  description,
  children,
  footer,
  snap = 'auto',
  expanded = false,
  drag,
  scrollTop,
  label = 'Painel',
  className = '',
  style,
}: SheetLayoutProps & {
  snap?: SheetSnap;
  expanded?: boolean;
  /** Prancha: deslocamento do dedo em px (Arrastando). */
  drag?: number;
  scrollTop?: number;
  label?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const titleId = useId();
  const descId = useId();
  return (
    <div className={`${s.frameRoot} ${className}`} style={style}>
      <div className={s.frameScrim} style={drag ? ({ opacity: 0.8 } as CSSProperties) : undefined} />
      <section
        className={`${s.sheet} ${s.frame}`}
        data-snap={snap}
        data-expanded={expanded || undefined}
        data-dragging={drag ? '' : undefined}
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : label}
        style={drag ? { transform: `translateY(${drag}px)` } : undefined}
      >
        <SheetLayout
          title={title}
          description={description}
          footer={footer}
          label={label}
          titleId={titleId}
          descId={descId}
          scrollTop={scrollTop}
          grabber={<span className={s.grabber} aria-hidden="true" />}
        >
          {children}
        </SheetLayout>
      </section>
    </div>
  );
}
