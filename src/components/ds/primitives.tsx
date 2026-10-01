'use client';

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { Check, ChevronRight, Circle, CircleAlert, Info, LoaderCircle, X } from 'lucide-react';
import s from './primitives.module.css';

export type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className = '',
  disabled,
  ...props
}: ComponentProps<'button'> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}) {
  return (
    <button
      {...props}
      type={props.type ?? 'button'}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${s.button} ${s[variant]} ${s[size]} ${className}`}
    >
      {loading && <LoaderCircle size={15} className={s.spinner} aria-hidden="true" />}
      {children}
    </button>
  );
}
export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`${s.badge} ${s[`tone_${tone}`]}`}>
      <span className={s.dot} aria-hidden="true" />
      {children}
    </span>
  );
}
export function Field({
  label,
  hint,
  error,
  required,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  htmlFor: string;
}) {
  return (
    <div className={s.field}>
      <label htmlFor={htmlFor}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {children}
      {(error || hint) && (
        <p
          id={`${htmlFor}-hint`}
          className={error ? s.errorText : s.hint}
          role={error ? 'alert' : undefined}
        >
          {error && <CircleAlert size={13} aria-hidden="true" />}
          {error || hint}
        </p>
      )}
    </div>
  );
}
export function Input({ className = '', ...props }: ComponentProps<'input'>) {
  return <input className={`${s.input} ${className}`} {...props} />;
}
export function Switch({
  label,
  checked,
  onChange,
  disabled = false,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  description?: string;
}) {
  const id = useId();
  return (
    <label className={s.switchRow} htmlFor={id}>
      <span>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      <span className={s.switchControl}>
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <span aria-hidden="true" />
      </span>
    </label>
  );
}
export function Alert({
  title,
  children,
  tone = 'brand',
}: {
  title: string;
  children?: ReactNode;
  tone?: Tone;
}) {
  const Icon =
    tone === 'success' ? Check : tone === 'danger' || tone === 'warning' ? CircleAlert : Info;
  return (
    <div
      className={`${s.alert} ${s[`tone_${tone}`]}`}
      role={tone === 'danger' ? 'alert' : undefined}
    >
      <Icon size={17} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        {children && <p>{children}</p>}
      </div>
    </div>
  );
}
export function Section({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className={s.section}>
      <div className={s.sectionHeader}>
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Segmented({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  label: string;
}) {
  return (
    <div className={s.segmented} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
export function Progress({ value, label }: { value: number; label: string }) {
  const bounded = Math.max(0, Math.min(100, value));
  return (
    <div
      className={s.progress}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={bounded}
      aria-label={label}
    >
      <span style={{ width: `${bounded}%` }} />
    </div>
  );
}
export function Steps({
  steps,
  current,
  onSelect,
}: {
  steps: readonly string[];
  current: number;
  onSelect?: (index: number) => void;
}) {
  return (
    <ol className={s.steps} aria-label="Etapas da campanha">
      {steps.map((step, i) => (
        <li key={step} aria-current={i === current ? 'step' : undefined}>
          <button
            type="button"
            onClick={() => onSelect?.(i)}
            disabled={!onSelect || i > current}
            aria-label={`${i + 1}. ${step}${i < current ? ', concluída' : ''}`}
          >
            <span>{i < current ? <Check size={13} /> : i + 1}</span>
            {step}
          </button>
          {i < steps.length - 1 && <ChevronRight size={13} aria-hidden="true" />}
        </li>
      ))}
    </ol>
  );
}
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={s.dialog}
      aria-labelledby={id}
      aria-describedby={description ? `${id}-description` : undefined}
      onCancel={onClose}
      onClose={onClose}
    >
      <header>
        <span className={s.dialogSymbol}>
          <CircleAlert size={20} />
        </span>
        <Button variant="ghost" aria-label="Fechar diálogo" onClick={onClose}>
          <X size={17} />
        </Button>
      </header>
      <h2 id={id}>{title}</h2>
      {description && <p id={`${id}-description`}>{description}</p>}
      {children}
      {footer && <footer>{footer}</footer>}
    </dialog>
  );
}
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className={s.empty}>
      <span className={s.emptyIcon}>
        <Circle size={22} strokeDasharray="3 4" aria-hidden="true" />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timeout = setTimeout(onClose, 5000);
    return () => clearTimeout(timeout);
  }, [message, onClose]);
  return (
    <div className={s.toast} role="status">
      <Check size={17} aria-hidden="true" />
      <span>{message}</span>
      <Button variant="ghost" aria-label="Fechar notificação" onClick={onClose}>
        <X size={16} />
      </Button>
    </div>
  );
}

export function Tabs({
  items,
  label,
}: {
  items: { id: string; label: string; content: ReactNode }[];
  label: string;
}) {
  const [active, setActive] = useState(0);
  const uid = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <div>
      <div className={s.tabs} role="tablist" aria-label={label}>
        {items.map((item, i) => (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            id={`${uid}-tab-${item.id}`}
            role="tab"
            aria-selected={active === i}
            aria-controls={`${uid}-panel-${item.id}`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => {
              const next =
                e.key === 'ArrowRight'
                  ? (i + 1) % items.length
                  : e.key === 'ArrowLeft'
                    ? (i - 1 + items.length) % items.length
                    : e.key === 'Home'
                      ? 0
                      : e.key === 'End'
                        ? items.length - 1
                        : null;
              if (next !== null) {
                e.preventDefault();
                setActive(next);
                refs.current[next]?.focus();
              }
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item, i) => (
        <div
          key={item.id}
          id={`${uid}-panel-${item.id}`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-${item.id}`}
          hidden={active !== i}
          tabIndex={0}
          className={s.tabPanel}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
