import type { Metadata } from 'next';
import { inter } from '../../components/ds-v2/font';
import { CampaignProvider } from '../campanhas/campaign-context';
import { DashboardWorkspace } from './dashboard-workspace';

export const metadata: Metadata = {
  title: 'Dashboard v2 · MediaOn',
  description: 'Prévia navegável da estrutura do MediaOn, com dados fictícios e interações locais.',
  robots: { index: false, follow: false },
};

export default function DashboardV2Page() {
  return (
    <div className={inter.variable}>
      <CampaignProvider>
        <DashboardWorkspace />
      </CampaignProvider>
    </div>
  );
}
