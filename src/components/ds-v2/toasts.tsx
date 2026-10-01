'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Info, TriangleAlert, X } from 'lucide-react';
import { Button as FormButton } from './button';
import t from './toasts.module.css';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';
export type ToastInput = {
  message: string;
  title?: string;
  variant?: ToastVariant;
  action?: { label: string; onClick: () => void };
};
export type Notify = (input: string | ToastInput) => void;
export type ToastNotice = ToastInput & { id: number; variant: ToastVariant };

const variants = {
  info: { icon: Info, label: 'Informação' },
  success: { icon: Check, label: 'Sucesso' },
  warning: { icon: TriangleAlert, label: 'Atenção' },
  error: { icon: TriangleAlert, label: 'Erro' },
};

export function useToast({ fallbackFocusId }: { fallbackFocusId?: string } = {}) {
  const [toast, setToast] = useState<ToastNotice | null>(null);
  const sequence = useRef(0);
  const origin = useRef<HTMLElement | null>(null);
  const notify = useCallback<Notify>((input) => {
    const details = typeof input === 'string' ? { message: input } : input;
    origin.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setToast({ ...details, variant: details.variant ?? 'success', id: ++sequence.current });
  }, []);
  const dismiss = useCallback(
    (restoreFocus = false) => {
      setToast(null);
      if (restoreFocus) {
        const target = origin.current?.isConnected
          ? origin.current
          : fallbackFocusId
            ? document.getElementById(fallbackFocusId)
            : null;
        target?.focus({ preventScroll: true });
      }
    },
    [fallbackFocusId],
  );
  return { toast, notify, dismiss };
}

export function ToastCard({
  toast,
  dismiss,
  action,
}: {
  toast: ToastInput;
  dismiss: () => void;
  action?: () => void;
}) {
  const variant = toast.variant ?? 'success';
  const { icon: Icon, label } = variants[variant];
  return (
    <div className={t.toast} data-variant={variant}>
      <span className={t.icon} aria-hidden="true">
        <Icon size={17} />
      </span>
      <div className={t.content}>
        <span className={t.srOnly}>{label}: </span>
        {toast.title && <p className={t.title}>{toast.title}</p>}
        <p className={t.message} data-secondary={Boolean(toast.title)}>
          {toast.message}
        </p>
        {toast.action && (
          <FormButton className={t.action} onClick={action ?? toast.action.onClick}>
            {toast.action.label}
          </FormButton>
        )}
      </div>
      <button className={t.close} aria-label="Fechar aviso" onClick={dismiss} type="button">
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

function ToastLifetime({
  toast,
  dismiss,
  suspended,
}: {
  toast: ToastNotice;
  dismiss: (restore?: boolean) => void;
  suspended: boolean;
}) {
  const element = useRef<HTMLDivElement>(null);
  const control = useRef<{ pause: () => void; resume: () => void } | null>(null);
  const hovering = useRef(false);
  const focused = useRef(false);
  const suspension = useRef(suspended);
  // Avisos que pedem decisão ficam disponíveis até o usuário dispensar ou agir.
  const persistent =
    Boolean(toast.action) || toast.variant === 'error' || toast.variant === 'warning';

  useEffect(() => {
    if (persistent) return;
    let remaining = 6000;
    let started = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const pause = () => {
      if (timer === undefined) return;
      clearTimeout(timer);
      timer = undefined;
      remaining = Math.max(0, remaining - (Date.now() - started));
    };
    const resume = () => {
      if (
        timer !== undefined ||
        document.hidden ||
        hovering.current ||
        focused.current ||
        suspension.current
      )
        return;
      started = Date.now();
      timer = setTimeout(() => dismiss(), remaining);
    };
    const visibility = () => (document.hidden ? pause() : resume());
    control.current = { pause, resume };
    document.addEventListener('visibilitychange', visibility);
    resume();
    return () => {
      pause();
      control.current = null;
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [persistent, dismiss]);
  useEffect(() => {
    suspension.current = suspended;
    if (suspended) control.current?.pause();
    else control.current?.resume();
  }, [suspended]);

  const close = () => dismiss(Boolean(element.current?.contains(document.activeElement)));
  return (
    <div
      ref={element}
      className={t.enter}
      onPointerEnter={() => {
        hovering.current = true;
        control.current?.pause();
      }}
      onPointerLeave={() => {
        hovering.current = false;
        control.current?.resume();
      }}
      onFocusCapture={() => {
        focused.current = true;
        control.current?.pause();
      }}
      onBlurCapture={(event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return;
        focused.current = false;
        control.current?.resume();
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        close();
      }}
    >
      <ToastCard
        toast={toast}
        dismiss={close}
        action={() => {
          dismiss();
          toast.action?.onClick();
        }}
      />
    </div>
  );
}

export function ToastViewport({
  toast,
  dismiss,
  suspended = false,
}: {
  toast: ToastNotice | null;
  dismiss: (restore?: boolean) => void;
  suspended?: boolean;
}) {
  const urgent = toast?.variant === 'error' || toast?.variant === 'warning';
  return (
    <div className={t.viewport} inert={suspended || undefined} data-suspended={suspended}>
      <div
        role={toast && !urgent ? 'status' : undefined}
        aria-live={suspended ? 'off' : 'polite'}
        aria-atomic="true"
      >
        {toast && !urgent && (
          <ToastLifetime key={toast.id} toast={toast} dismiss={dismiss} suspended={suspended} />
        )}
      </div>
      <div
        role={toast && urgent ? 'alert' : undefined}
        aria-live={suspended ? 'off' : 'assertive'}
        aria-atomic="true"
      >
        {toast && urgent && (
          <ToastLifetime key={toast.id} toast={toast} dismiss={dismiss} suspended={suspended} />
        )}
      </div>
    </div>
  );
}
