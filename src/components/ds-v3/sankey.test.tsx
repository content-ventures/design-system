/**
 * Sankey: fluxos sem volume ou com nó inexistente ficam de fora; o resumo e a
 * tabela para leitor de tela trazem cada fluxo com a participação na origem.
 */
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SankeyChart, type SankeyLink, type SankeyNode } from './charts';

const NODES: SankeyNode[] = [
  { key: 'vitrine', label: 'Vitrine' },
  { key: 'portal', label: 'Portal' },
  { key: 'ganho', label: 'Ganho', color: 'green' },
  { key: 'perdido', label: 'Perdido', color: 'red' },
];

const LINKS: SankeyLink[] = [
  { source: 'vitrine', target: 'ganho', value: 30 },
  { source: 'vitrine', target: 'perdido', value: 70 },
  { source: 'portal', target: 'ganho', value: 50 },
  { source: 'portal', target: 'perdido', value: 0 },
  { source: 'portal', target: 'fantasma', value: 10 },
];

describe('SankeyChart', () => {
  it('tabela acessível com os fluxos válidos e a participação na origem', () => {
    render(<SankeyChart label="Jornada dos leads" nodes={NODES} links={LINKS} />);

    const table = screen.getByRole('table', { name: 'Jornada dos leads' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent('VitrineGanho3030,0%');
    expect(rows[1]).toHaveTextContent('VitrinePerdido7070,0%');
    expect(rows[2]).toHaveTextContent('PortalGanho50100,0%');
  });

  it('grupo navegável pelo teclado, com a dica de uso', () => {
    render(<SankeyChart label="Jornada dos leads" nodes={NODES} links={LINKS} />);

    const group = screen.getByRole('group', { name: /Jornada dos leads\. Use as setas/ });
    expect(group).toHaveAttribute('tabindex', '0');
  });
});
