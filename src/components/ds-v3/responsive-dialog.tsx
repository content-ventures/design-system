'use client';

import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { BottomSheet, type SheetSnap } from './bottom-sheet';
import { Dialog, type DialogSize } from './overlays';
import { reducedMotion } from './popover';

export type ResponsiveVariant = 'dialog' | 'sheet';

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', notify);
      return () => list.removeEventListener('change', notify);
    },
    () => window.matchMedia(query).matches,
    // Servidor: diálogo (a folha só existe no celular, depois de medir).
    () => false,
  );
}

/** Saída da camada atual antes de a outra entrar (Dialog 160 ms, folha 200 ms). */
const MORPH_MS = 200;

/**
 * O mesmo conteúdo e o mesmo rodapé: `Dialog` acima de `breakpoint` (640) e `BottomSheet` a partir
 * dele. Na folha, as ações empilham na largura toda com a principal em cima. Trocar de variante com
 * a camada aberta fecha uma (saída dela) e abre a outra (entrada dela).
 */
export function ResponsiveDialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  breakpoint = 640,
  variant: forced,
  snap = 'auto',
  dismissible = true,
  dirty = false,
  contained = false,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: DialogSize;
  breakpoint?: number;
  /** Força a variante (pranchas, simuladores). Sem ela, decide a largura da janela. */
  variant?: ResponsiveVariant;
  snap?: SheetSnap;
  dismissible?: boolean;
  /** Há dado digitado e não enviado: o véu deixa de fechar. */
  dirty?: boolean;
  /** Presa ao contêiner posicionado mais próximo, em vez da janela. */
  contained?: boolean;
}) {
  const narrow = useMediaQuery(`(max-width: ${breakpoint}px)`);
  const wanted: ResponsiveVariant = forced ?? (narrow ? 'sheet' : 'dialog');
  const [shown, setShown] = useState<ResponsiveVariant>(wanted);
  const morphing = open && shown !== wanted;
  // Fechada, a próxima abertura já usa a variante pedida.
  if (!open && shown !== wanted) setShown(wanted);

  useEffect(() => {
    if (!morphing) return;
    const timer = window.setTimeout(() => setShown(wanted), reducedMotion() ? 0 : MORPH_MS);
    return () => window.clearTimeout(timer);
  }, [morphing, wanted]);

  const common = { onClose, dismissible: dismissible && !dirty, contained };
  return (
    <>
      <Dialog
        {...common}
        open={open && shown === 'dialog' && !morphing}
        title={title}
        description={description}
        footer={footer}
        size={size}
        divided={false}
      >
        {children}
      </Dialog>
      <BottomSheet
        {...common}
        open={open && shown === 'sheet' && !morphing}
        title={title}
        description={description}
        footer={footer}
        snap={snap}
      >
        {children}
      </BottomSheet>
    </>
  );
}
