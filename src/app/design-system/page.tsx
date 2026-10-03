import type { Metadata } from 'next';
import { CatalogV3 } from '../design-system-v3/catalog';

export const metadata: Metadata = {
  title: 'Design System · MediaOn',
  description: 'Biblioteca oficial de tokens, componentes, padrões e templates do MediaOn.',
  robots: { index: false, follow: false },
};

/** Catálogo oficial da plataforma. Tema e fonte do V3 vêm do layout raiz. */
export default function DesignSystemPage() {
  return <CatalogV3 />;
}
