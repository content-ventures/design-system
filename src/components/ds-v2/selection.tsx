'use client';

import { useId, useEffect, useRef, type ComponentProps } from 'react';
import { Check, Minus } from 'lucide-react';
import s from './primitives.module.css';

export type SwitchProps = Omit<
  ComponentProps<'button'>,
  'onChange' | 'children' | 'aria-label' | 'aria-checked'
> & {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  description?: string;
};
export function Switch({
  label,
  checked,
  onCheckedChange,
  description,
  className = '',
  onClick,
  ...props
}: SwitchProps) {
  const id = useId();
  return (
    <>
      <button
        {...props}
        type="button"
        role="switch"
        className={`${s.switch} ${className}`}
        aria-label={label}
        aria-checked={checked}
        aria-describedby={
          [props['aria-describedby'], description ? id : undefined].filter(Boolean).join(' ') ||
          undefined
        }
        title={props.title ?? description}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) onCheckedChange(!checked);
        }}
      >
        <span className={s.track} aria-hidden="true" />
      </button>
      {description && (
        <span id={id} className={s.srOnly}>
          {description}
        </span>
      )}
    </>
  );
}

export function Checkbox({
  label,
  className = '',
  indeterminate = false,
  ...props
}: Omit<ComponentProps<'input'>, 'type'> & { label: string; indeterminate?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <label className={`${s.checkbox} ${className}`}>
      <span className={s.checkControl}>
        <input {...props} ref={ref} type="checkbox" />
        {indeterminate ? (
          <Minus size={12} aria-hidden="true" />
        ) : (
          <Check size={12} aria-hidden="true" />
        )}
      </span>
      <span>{label}</span>
    </label>
  );
}
