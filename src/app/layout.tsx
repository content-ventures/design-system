import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { interV3 } from '../components/ds-v3/font';
import { ThemeV3 } from '../components/ds-v3/theme';
import './globals.css';

export const metadata: Metadata = {
  title: 'Design System · Content Ventures',
  description: 'Biblioteca oficial de tokens, componentes e padrões da Content Ventures.',
};

/** Tokens e fonte do V3 valem em todo o harness visual. */
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" className={interV3.variable}>
      <body>
        <ThemeV3 style={{ minHeight: '100dvh' }}>{children}</ThemeV3>
      </body>
    </html>
  );
}
