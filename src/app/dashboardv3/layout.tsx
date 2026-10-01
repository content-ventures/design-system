import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { interV3 } from '../../components/ds-v3/font';
import { ThemeV3 } from '../../components/ds-v3/theme';
import { Toaster } from '../../components/ds-v3/toast';

export const metadata: Metadata = {
  title: 'Dashboard V3 · MediaOn',
  description: 'Protótipo navegável do Ad Manager no Design System V3. Dados fictícios.',
  robots: { index: false, follow: false },
};

export default function DashboardV3Layout({ children }: { children: ReactNode }) {
  return (
    <div className={interV3.variable}>
      <ThemeV3 style={{ minHeight: '100dvh' }}>
        {children}
        <Toaster />
      </ThemeV3>
    </div>
  );
}
