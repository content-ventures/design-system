import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Design System · Content Ventures',
  description: 'Biblioteca oficial de tokens, componentes e padrões da Content Ventures.',
  robots: { index: false, follow: false },
};

/** Rota legada temporária para links que ainda apontam para a nomenclatura V3. */
export default function DesignSystemV3Page() {
  redirect('/design-system');
}
