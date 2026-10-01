import type { Metadata } from 'next';
import { inter } from '../../components/ds-v2/font';
import { DesignSystemTheme } from '../../components/ds-v2/theme';
import { DesignSystemCatalog } from './catalog';

export const metadata: Metadata = {
  title: 'Design System V2 · MediaOn',
  description: 'Tokens, componentes e padrões da base aprovada do MediaOn.',
  robots: { index: false, follow: false },
};

export default function DesignSystemV2Page() {
  return (
    <div className={inter.variable}>
      <DesignSystemTheme>
        <DesignSystemCatalog />
      </DesignSystemTheme>
    </div>
  );
}
