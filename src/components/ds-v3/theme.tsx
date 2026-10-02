'use client';

import { createContext, useContext, useSyncExternalStore, type ComponentProps } from 'react';
import t from './theme.module.css';

export type ThemeMode = 'light' | 'dark' | 'system';

const ThemeContext = createContext<ThemeMode>('light');
const darkQuery = '(prefers-color-scheme: dark)';
function subscribeSystemTheme(onChange: () => void) {
  const media = window.matchMedia(darkQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
const getSystemTheme = () => window.matchMedia(darkQuery).matches;
const getServerTheme = () => false;

/** Escopo dos tokens V3. Menus e diálogos renderizam dentro dele para herdar o tema. */
export function ThemeV3({
  className = '',
  mode,
  children,
  ...props
}: ComponentProps<'div'> & { mode?: ThemeMode }) {
  const inherited = useContext(ThemeContext);
  const appearance = mode ?? inherited;
  const systemDark = useSyncExternalStore(subscribeSystemTheme, getSystemTheme, getServerTheme);
  const dark = appearance === 'dark' || (appearance === 'system' && systemDark);
  return (
    <ThemeContext.Provider value={appearance}>
      <div
        {...props}
        className={`${t.theme} ${className}`}
        data-ds-v3
        data-color-scheme={dark ? 'dark' : 'light'}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
