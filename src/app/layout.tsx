import type { Metadata } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';

import './globals.css';
import '../components/ds/tokens.css';

const instrument = localFont({
  src: [
    { path: '../fonts/instrument-regular.ttf', weight: '400' },
    { path: '../fonts/instrument-medium.ttf', weight: '500' },
    { path: '../fonts/instrument-semibold.ttf', weight: '600' },
  ],
  variable: '--font-interface',
  display: 'swap',
});
const mono = localFont({
  src: '../fonts/plex-mono.ttf',
  variable: '--font-utility',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: 'Design System v2 · MediaOn',
  description: 'Ambiente isolado para a nova biblioteca visual do MediaOn.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${instrument.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
