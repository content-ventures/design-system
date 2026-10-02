import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Design System · MediaOn',
  description: 'Biblioteca oficial de tokens, componentes, padrões e templates do MediaOn.',
  robots: { index: false, follow: false },
};

/** Rota legada temporária para links que ainda apontam para a nomenclatura V3. */
export default function DesignSystemV3Page() {
  redirect('/design-system');
}
