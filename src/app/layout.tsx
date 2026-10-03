import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { interV3 } from '../components/ds-v3/font';
import { ThemeV3 } from '../components/ds-v3/theme';
import './globals.css';

export const metadata: Metadata = {
  title: 'Design System · MediaOn',
  description: 'Catálogo do DS V3: tokens, componentes, padrões e templates do MediaOn.',
};

/** Tokens e fonte do V3 valem em todo o app do catálogo, como no app oficial. */
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" className={interV3.variable}>
      <body>
        <ThemeV3 style={{ minHeight: '100dvh' }}>{children}</ThemeV3>
      </body>
    </html>
  );
}
