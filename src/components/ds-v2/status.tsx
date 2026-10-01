import type { ComponentProps } from 'react';
import type { LucideIcon } from 'lucide-react';
import s from './primitives.module.css';

export type StatusTone = 'blue' | 'green' | 'amber' | 'pink' | 'red' | 'violet' | 'neutral';
export type TagTone = 'blue' | 'green' | 'amber' | 'violet' | 'neutral';
export function Status({
  value,
  tone = 'neutral',
  variant = 'dot',
  icon: Icon,
  className = '',
  ...props
}: ComponentProps<'span'> & {
  value: string;
  tone?: StatusTone;
  variant?: 'dot' | 'soft';
  icon?: LucideIcon;
}) {
  return (
    <span
      {...props}
      className={`${s.status} ${className}`}
      data-tone={tone}
      data-variant={variant}
      data-has-icon={Icon ? '' : undefined}
    >
      {Icon ? (
        <Icon className={s.statusIcon} size={14} aria-hidden="true" />
      ) : (
        <i aria-hidden="true" />
      )}
      <span>{value}</span>
    </span>
  );
}

export function Tag({
  value,
  tone = 'neutral',
  icon: Icon,
  className = '',
  ...props
}: ComponentProps<'span'> & {
  value: string;
  tone?: TagTone;
  icon?: LucideIcon;
}) {
  return (
    <span {...props} className={`${s.tag} ${className}`} data-tone={tone}>
      {Icon && <Icon size={12} aria-hidden="true" />}
      <span>{value}</span>
    </span>
  );
}
