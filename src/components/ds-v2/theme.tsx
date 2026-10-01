import type { ComponentProps } from 'react';
import t from './theme.module.css';

/** Escopo de tokens e dos portais de dropdown/calendário. Não altera o tema da página externa. */
export function DesignSystemTheme({ className = '', ...props }: ComponentProps<'div'>) {
  return <div {...props} className={`${t.theme} ${className}`} data-controls-root data-ds-v2 />;
}
