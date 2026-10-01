'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  layerHost,
  useAnchoredPosition,
  useIsoLayoutEffect,
  usePresence,
  type Align,
  type Side,
} from './popover';
import s from './popover.module.css';

function cssDelay(anchor: Element | null, fallback: number) {
  if (!anchor) return fallback;
  const raw = getComputedStyle(anchor).getPropertyValue('--hover-card-delay').trim();
  const value = parseFloat(raw);
  if (!Number.isFinite(value)) return fallback;
  return raw.endsWith('ms') ? value : raw.endsWith('s') ? value * 1000 : value;
}

/**
 * Prévia de leitura de um nome (anunciante, pessoa) ao parar o ponteiro sobre ele: abre depois de
 * `--hover-card-delay` (500 ms) no hover ou com foco de teclado, fica aberta enquanto o ponteiro
 * viaja até ela e fecha `closeDelay` depois de sair. Só leitura e um link; nada que mude dado.
 * Sem foco preso. No toque não existe: o toque segue o link.
 */
export function HoverCard({
  trigger,
  children,
  openDelay,
  closeDelay = 200,
  width = 300,
  side = 'bottom',
  align = 'start',
  pinned = false,
}: {
  /** O nome (TextLink) que já leva ao mesmo destino do link do cartão. */
  trigger: ReactNode;
  children: ReactNode;
  /** Padrão: `--hover-card-delay` do tema (500 ms). */
  openDelay?: number;
  closeDelay?: number;
  width?: number;
  side?: Side;
  align?: Align;
  /** Prancha: cartão aberto e parado, no fluxo. Nunca no produto. */
  pinned?: boolean;
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<number | undefined>(undefined);
  const closeTimer = useRef<number | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const presence = usePresence(open, 120);
  const [host, setHost] = useState<Element | null>(null);
  const latest = useRef({ openDelay, closeDelay });
  useIsoLayoutEffect(() => {
    latest.current = { openDelay, closeDelay };
  });

  const clear = () => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
  };
  const scheduleOpen = () => {
    clear();
    const anchor = anchorRef.current;
    openTimer.current = window.setTimeout(
      () => {
        setHost(layerHost(anchorRef.current));
        setOpen(true);
      },
      latest.current.openDelay ?? cssDelay(anchor, 500),
    );
  };
  const scheduleClose = () => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), latest.current.closeDelay);
  };
  const keep = () => window.clearTimeout(closeTimer.current);

  useEffect(() => () => clear(), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      clear();
      setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useAnchoredPosition({
    active: presence === 'open' && Boolean(host),
    anchor: () => anchorRef.current,
    panel: () => cardRef.current,
    side,
    align,
    gap: 6,
    onHidden: () => setOpen(false),
  });

  if (pinned) {
    return (
      <span className={s.pinned} data-side={side} data-align={align}>
        {trigger}
        <div className={`${s.popover} ${s.card}`} data-static style={{ width }}>
          {children}
        </div>
      </span>
    );
  }

  return (
    <span
      ref={anchorRef}
      style={{ display: 'inline-flex', minWidth: 0, maxWidth: '100%' }}
      onPointerEnter={(event) => {
        if (event.pointerType === 'touch') return;
        if (open) keep();
        else scheduleOpen();
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'touch') return;
        scheduleClose();
      }}
      onPointerDown={() => clear()}
      onFocus={(event) => {
        if (event.target instanceof HTMLElement && event.target.matches(':focus-visible')) scheduleOpen();
      }}
      onBlur={(event) => {
        const next = event.relatedTarget as Node | null;
        if (next && cardRef.current?.contains(next)) return;
        clear();
        setOpen(false);
      }}
    >
      {trigger}
      {presence !== 'closed' &&
        host &&
        createPortal(
          <div
            ref={cardRef}
            className={`${s.popover} ${s.card}`}
            data-state={presence}
            data-side={side}
            style={{ width, top: -9999, left: -9999, visibility: 'hidden' }}
            onPointerEnter={keep}
            onPointerLeave={scheduleClose}
          >
            {children}
          </div>,
          host,
        )}
    </span>
  );
}
