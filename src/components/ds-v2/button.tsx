'use client';

import { LoaderCircle, type LucideIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import f from './creation.module.css';

export function Button({
  variant = 'secondary',
  icon: Icon,
  children,
  className = '',
  type = 'button',
  loading = false,
  size = 'default',
  ...props
}: ComponentProps<'button'> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost' | 'soft';
  size?: 'small' | 'default' | 'large';
  icon?: LucideIcon;
  loading?: boolean;
}) {
  return (
    <button
      {...props}
      type={type}
      disabled={props.disabled || loading}
      aria-busy={loading || undefined}
      className={`${f.button} ${className}`}
      data-variant={variant}
      data-size={size}
    >
      {loading ? (
        <LoaderCircle size={15} className={f.spinner} aria-hidden="true" />
      ) : (
        Icon && <Icon size={15} aria-hidden="true" />
      )}
      {children}
    </button>
  );
}

export function IconButton({
  label,
  icon: Icon,
  ...props
}: Omit<ComponentProps<typeof Button>, 'children' | 'aria-label'> & {
  label: string;
  icon: LucideIcon;
}) {
  return (
    <Button
      {...props}
      aria-label={label}
      title={props.title ?? label}
      className={`${f.iconButton} ${props.className ?? ''}`}
    >
      <Icon size={16} aria-hidden="true" />
    </Button>
  );
}
