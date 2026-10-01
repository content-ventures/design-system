import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { CampaignProvider } from './campaign-context';
import { PilotShell } from './pilot-shell';

const inter = localFont({
  src: [
    { path: '../../fonts/inter-regular.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/inter-medium.woff2', weight: '500', style: 'normal' },
    { path: '../../fonts/inter-semibold.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-campaign',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Campanhas · MediaOn — Prévia de design',
  robots: { index: false, follow: false },
};

export default function CampaignLayout({ children }: { children: ReactNode }) {
  return (
    <div className={inter.variable}>
      <CampaignProvider>
        <PilotShell>{children}</PilotShell>
      </CampaignProvider>
    </div>
  );
}
