import type { Metadata } from 'next';
import { interV3 } from '../../components/ds-v3/font';
import { ThemeV3 } from '../../components/ds-v3/theme';
import { CatalogV3 } from '../design-system-v3/catalog';

export const metadata: Metadata = {
  title: 'Design System · MediaOn',
  description: 'Biblioteca oficial de tokens, componentes, padrões e templates do MediaOn.',
  robots: { index: false, follow: false },
};

/** Catálogo oficial da plataforma. O V3 é a implementação padrão desta rota. */
export default function DesignSystemPage() {
  return (
    <div className={interV3.variable}>
      <ThemeV3>
        <CatalogV3 />
      </ThemeV3>
    </div>
  );
}
