'use client';

import { useCallback, useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';

const hidden = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const;

/** Texto só para leitores de tela (aceita `role`/`aria-live` para avisos sem área visível). */
export function VisuallyHidden({
  children,
  ...rest
}: { children?: ReactNode } & Omit<HTMLAttributes<HTMLSpanElement>, 'style'>) {
  return (
    <span {...rest} style={hidden}>
      {children}
    </span>
  );
}

/**
 * Região viva invisível. Monte uma vez, perto do controle que gera o aviso, e troque `message`:
 * o leitor de tela anuncia o texto novo sem mover o foco. `assertive` só para erro que bloqueia.
 */
export function LiveRegion({
  message,
  politeness = 'polite',
}: {
  message: string;
  politeness?: 'polite' | 'assertive';
}) {
  return (
    <VisuallyHidden role={politeness === 'assertive' ? 'alert' : 'status'} aria-live={politeness} aria-atomic="true">
      {message}
    </VisuallyHidden>
  );
}

/**
 * Anúncios para leitor de tela a partir de uma ação (pausar, salvar, mover cartão).
 * `announce` limpa a região e escreve no quadro seguinte: o mesmo texto repetido é anunciado de novo.
 * Renderize `region` uma vez no componente.
 */
export function useAnnouncer(politeness: 'polite' | 'assertive' = 'polite') {
  const [message, setMessage] = useState('');
  const frame = useRef<number | undefined>(undefined);
  useEffect(() => () => cancelAnimationFrame(frame.current ?? 0), []);
  const announce = useCallback((text: string) => {
    cancelAnimationFrame(frame.current ?? 0);
    setMessage('');
    frame.current = requestAnimationFrame(() => setMessage(text));
  }, []);
  return { announce, message, region: <LiveRegion message={message} politeness={politeness} /> };
}
