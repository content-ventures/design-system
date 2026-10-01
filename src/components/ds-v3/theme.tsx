import type { ComponentProps } from 'react';
import t from './theme.module.css';

/** Escopo dos tokens V3. Menus e diálogos renderizam dentro dele para herdar o tema. */
export function ThemeV3({ className = '', ...props }: ComponentProps<'div'>) {
  return <div {...props} className={`${t.theme} ${className}`} data-ds-v3 />;
}
