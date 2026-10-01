import type { Metadata } from 'next';
import { interV3 } from '../../components/ds-v3/font';
import { ThemeV3 } from '../../components/ds-v3/theme';
import { CatalogV3 } from './catalog';

export const metadata: Metadata = {
  title: 'Design System V3 · MediaOn',
  description: 'Biblioteca V3 do MediaOn: tokens, componentes, padrões e templates.',
  robots: { index: false, follow: false },
};

export default function DesignSystemV3Page() {
  return (
    <div className={interV3.variable}>
      <ThemeV3>
        <CatalogV3 />
      </ThemeV3>
    </div>
  );
}
