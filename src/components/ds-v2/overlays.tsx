'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { X } from 'lucide-react';
import { IconButton } from './button';
import s from './extensions.module.css';

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  kind = 'modal',
  size = 'default',
  density = 'default',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  kind?: 'modal' | 'drawer' | 'sheet' | 'responsive';
  size?: 'small' | 'default' | 'medium' | 'wide';
  density?: 'default' | 'compact';
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={s.dialog}
      data-kind={kind}
      data-size={size}
      data-density={density}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
      onCancel={(event) => {
        event.preventDefault();
        close.current();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            close.current();
        }
      }}
    >
      <header className={s.dialogHeader}>
        <div>
          <h2 id={`${id}-title`}>{title}</h2>
          {description && <p id={`${id}-description`}>{description}</p>}
        </div>
        <IconButton label="Fechar janela" icon={X} variant="ghost" onClick={onClose} />
      </header>
      <div className={s.dialogBody}>{open && children}</div>
      {footer && <footer className={s.dialogFooter}>{footer}</footer>}
    </dialog>
  );
}

export function Popover({
  trigger,
  children,
  label,
  open,
  onOpenChange,
  compact = false,
  align = 'end',
  onOpenAutoFocus,
}: {
  trigger: ReactNode;
  children: ReactNode;
  label: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  compact?: boolean;
  align?: 'start' | 'center' | 'end';
  onOpenAutoFocus?: (event: Event) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  // O estado local força a resolução do portal após a montagem do gatilho.
  const [internalOpen, setInternalOpen] = useState(false);
  return (
    <PopoverPrimitive.Root
      open={open ?? internalOpen}
      onOpenChange={(next) => {
        setInternalOpen(next);
        onOpenChange?.(next);
      }}
    >
      <PopoverPrimitive.Trigger asChild ref={ref}>
        {trigger}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal
        container={ref.current?.closest<HTMLElement>('dialog, [data-controls-root]') ?? undefined}
      >
        <PopoverPrimitive.Content
          aria-label={label}
          className={s.popover}
          data-compact={compact || undefined}
          align={align}
          onOpenAutoFocus={onOpenAutoFocus}
          sideOffset={6}
          collisionPadding={16}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export function Tooltip({ children, text }: { children: ReactNode; text: string }) {
  const id = useId();
  const [dismissed, setDismissed] = useState(false);
  return (
    <span
      className={s.tooltipWrap}
      tabIndex={0}
      aria-describedby={id}
      data-dismissed={dismissed}
      onFocus={() => setDismissed(false)}
      onMouseEnter={() => setDismissed(false)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          setDismissed(true);
        }
      }}
    >
      {children}
      <span id={id} role="tooltip" className={s.tooltip}>
        {text}
      </span>
    </span>
  );
}
