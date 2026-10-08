'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { focusablesIn, layerHost, placeFloating, useIsoLayoutEffect, usePresence } from './popover';
import { Toolbar, type ToolbarProps } from './toolbar';
import s from './floating-toolbar.module.css';

/* ——————————————————————————————————————————————————————————————————————————
 * FloatingToolbar — barra sobre um trecho (família C3): seleção no texto ou na transcrição.
 * Camada flutuante (§7) ancorada a um retângulo que o produto fornece; não rouba o foco.
 * —————————————————————————————————————————————————————————————————————————— */

export type FloatingToolbarDismissReason = 'escape' | 'outside';

export type FloatingToolbarProps = Omit<ToolbarProps, 'orientation' | 'variant' | 'sticky'> & {
  open: boolean;
  /**
   * Retângulo do trecho na janela (ex.: `range.getBoundingClientRect()`), relido a cada rolagem,
   * redimensionamento, mudança de seleção e render. `null` esconde a barra sem fechá-la.
   */
  anchor: () => DOMRect | null;
  /** Lado preferido. Vira sozinho quando não cabe. */
  placement?: 'top' | 'bottom';
  /** Distância do trecho, em px. */
  offset?: number;
  /** Escape (em qualquer lugar) ou clique fora da barra e dos menus dela. O produto fecha. */
  onDismiss?: (reason: FloatingToolbarDismissReason) => void;
  /** Leva o foco ao primeiro botão ao abrir (aberta pelo teclado). Padrão: o foco fica no texto. */
  autoFocus?: boolean;
  /** Prancha: barra parada, no fluxo. Nunca no produto. */
  pinned?: boolean;
  /**
   * Segue o trecho a cada quadro enquanto aberta: para um trecho que muda de tamanho ou de lugar
   * sem rolagem (um widget que entra no parágrafo, o texto de cima que cresce). Padrão: só relê
   * em rolagem, redimensionamento, mudança de seleção e render.
   */
  follow?: boolean;
};

const EXIT_MS = 160;
const EDGE = 8;

/** O trecho saiu de vista: da janela ou de um ancestral que recorta (painel com rolagem). */
function rectHidden(rect: DOMRect, from: Element | null) {
  const vw = document.documentElement.clientWidth || window.innerWidth;
  const vh = window.innerHeight;
  const outside = (box: { top: number; bottom: number; left: number; right: number }) =>
    rect.bottom < box.top ||
    rect.top > box.bottom ||
    rect.right < box.left ||
    rect.left > box.right;
  if (outside({ top: 0, left: 0, bottom: vh, right: vw })) return true;
  for (let node = from?.parentElement; node && node !== document.body; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (/(auto|scroll|hidden|clip)/.test(`${style.overflowX} ${style.overflowY}`)) {
      if (outside(node.getBoundingClientRect())) return true;
    }
  }
  return false;
}

/**
 * Barra de ferramentas flutuante sobre um trecho: papel, fio de 1 px, `--shadow-lg`, raio 10,
 * `--z-popover`, num portal no escopo do tema (ou no diálogo aberto). Fica acima do trecho e vira
 * para baixo quando falta espaço, a 8 px da borda da janela; some quando o trecho sai de vista
 * (inclusive do painel com rolagem onde ela é declarada).
 *
 * Não rouba o foco: os botões usam `keepFocus` e a seleção do editor continua. Alt+F10 leva o foco
 * à barra; ←/→ andam entre os botões; Tab ou Escape devolvem o foco ao texto. Escape fecha.
 */
export function FloatingToolbar({
  open,
  anchor,
  placement = 'top',
  offset = 8,
  onDismiss,
  autoFocus = false,
  pinned = false,
  follow = false,
  size = 'sm',
  keepFocus = true,
  className = '',
  children,
  ...toolbarProps
}: FloatingToolbarProps) {
  const homeRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const presence = usePresence(open && !pinned, EXIT_MS);
  const mounted = presence !== 'closed';
  const [host, setHost] = useState<Element | null>(null);
  const latest = useRef({ anchor, onDismiss, placement, offset });
  useIsoLayoutEffect(() => {
    latest.current = { anchor, onDismiss, placement, offset };
  });

  // Onde a camada mora é decidido ao abrir: no diálogo aberto (camada do topo) ou no escopo do tema.
  useIsoLayoutEffect(() => {
    if (pinned) return;
    setHost(mounted ? layerHost(homeRef.current) : null);
  }, [mounted, pinned]);

  const position = () => {
    const panel = panelRef.current;
    if (!panel || pinned) return;
    const rect = latest.current.anchor();
    if (!rect || rectHidden(rect, homeRef.current)) {
      panel.dataset.hidden = '';
      return;
    }
    delete panel.dataset.hidden;
    const vw = document.documentElement.clientWidth || window.innerWidth;
    const vh = window.innerHeight;
    const place = placeFloating(
      rect,
      panel.offsetWidth,
      panel.offsetHeight,
      latest.current.placement,
      'center',
      latest.current.offset,
      { top: 0, bottom: vh, left: 0, right: vw },
    );
    const top = Math.min(Math.max(place.top, EDGE), Math.max(EDGE, vh - panel.offsetHeight - EDGE));
    panel.style.top = `${Math.round(top)}px`;
    panel.style.left = `${Math.round(place.left)}px`;
    panel.style.visibility = '';
    panel.dataset.side = place.side;
  };
  const positionRef = useRef(position);
  useIsoLayoutEffect(() => {
    positionRef.current = position;
  });

  // Cada render relê o trecho (o produto renderiza de novo quando a seleção muda).
  useIsoLayoutEffect(() => {
    if (presence === 'open' && host) positionRef.current();
  });

  // Rolagem, redimensionamento, mudança de seleção e da própria barra reposicionam no próximo quadro.
  useEffect(() => {
    if (presence !== 'open' || !host) return;
    let frame = 0;
    const schedule = () => {
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          positionRef.current();
        });
    };
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    if (panelRef.current) observer?.observe(panelRef.current);
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    document.addEventListener('selectionchange', schedule);
    // `follow`: compara o retângulo do trecho a cada quadro e reposiciona só quando ele muda.
    let watch = 0;
    let last = '';
    const track = () => {
      const rect = latest.current.anchor();
      const key = rect ? `${rect.top}:${rect.left}:${rect.width}:${rect.height}` : '';
      if (key !== last) {
        last = key;
        positionRef.current();
      }
      watch = requestAnimationFrame(track);
    };
    if (follow) watch = requestAnimationFrame(track);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(watch);
      observer?.disconnect();
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('selectionchange', schedule);
    };
  }, [presence, host, follow]);

  /** Foco no botão com a parada de Tab da barra (o primeiro, na primeira vez). */
  const focusToolbar = () => {
    const panel = panelRef.current;
    if (!panel) return;
    if (!panel.contains(document.activeElement) && document.activeElement instanceof HTMLElement) {
      returnTo.current = document.activeElement;
    }
    const target =
      panel.querySelector<HTMLElement>('[role="toolbar"] button[tabindex="0"]') ??
      focusablesIn(panel)[0];
    target?.focus({ preventScroll: true });
  };
  const restoreFocus = () => {
    const target = returnTo.current;
    returnTo.current = null;
    if (target?.isConnected) target.focus({ preventScroll: true });
  };
  const handlers = useRef({ focusToolbar, restoreFocus });
  useIsoLayoutEffect(() => {
    handlers.current = { focusToolbar, restoreFocus };
  });

  useEffect(() => {
    if (presence !== 'open' || !host || !autoFocus) return;
    const frame = requestAnimationFrame(() => handlers.current.focusToolbar());
    return () => cancelAnimationFrame(frame);
  }, [presence, host, autoFocus]);

  useEffect(() => {
    if (presence !== 'open' || !host) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        if (panelRef.current?.contains(document.activeElement)) handlers.current.restoreFocus();
        latest.current.onDismiss?.('escape');
        return;
      }
      if (event.key === 'F10' && event.altKey) {
        event.preventDefault();
        handlers.current.focusToolbar();
      }
    };
    const onDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target || panelRef.current?.contains(target)) return;
      // Menus abertos pela barra (Reescrever ▾, Mais) moram em outro portal.
      if (target.closest?.('[role="menu"]')) return;
      latest.current.onDismiss?.('outside');
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown, true);
    };
  }, [presence, host]);

  const toolbar = (
    <Toolbar {...toolbarProps} size={size} keepFocus={keepFocus} className={s.toolbar}>
      {children}
    </Toolbar>
  );

  if (pinned) {
    return (
      <div className={`${s.floating} ${className}`} data-static="" data-side={placement}>
        {toolbar}
      </div>
    );
  }

  const style: CSSProperties = { top: -9999, left: -9999, visibility: 'hidden' };
  return (
    <>
      <span ref={homeRef} hidden />
      {mounted &&
        host &&
        createPortal(
          <div
            ref={panelRef}
            className={`${s.floating} ${className}`}
            data-state={presence}
            data-side={placement}
            style={style}
            onFocus={(event: ReactFocusEvent<HTMLDivElement>) => {
              const from = event.relatedTarget;
              if (from instanceof HTMLElement && !event.currentTarget.contains(from))
                returnTo.current = from;
            }}
            onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>) => {
              // Tab devolve o foco ao texto: a barra mora num portal, longe dele na ordem do documento.
              if (event.key !== 'Tab' || event.defaultPrevented || !returnTo.current?.isConnected)
                return;
              event.preventDefault();
              handlers.current.restoreFocus();
            }}
          >
            {toolbar}
          </div>,
          host,
        )}
    </>
  );
}
