/**
 * Cartão da tabela no celular: o título é a coluna fixa (o nome do registro),
 * mesmo com uma coluna de indicador antes dela; célula sem nada a mostrar fica
 * marcada para não virar uma linha só com rótulo.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DataTable, type Column } from './table';

type Row = { id: string; name: string; live: boolean; budget: string | null };

const ROWS: Row[] = [
  { id: 'a', name: 'Verão', live: true, budget: 'R$ 6.000,00' },
  { id: 'b', name: 'Inverno', live: false, budget: null },
];

function cellOf(name: string, col: string) {
  const row = screen.getByText(name).closest('tr') as HTMLElement;
  return row.querySelector(`td[data-col="${col}"]`) as HTMLElement;
}

describe('DataTable — título do cartão', () => {
  it('a coluna fixa é o título, mesmo depois de um indicador', () => {
    const columns: Column<Row>[] = [
      { key: 'live', header: 'No ar', render: (row) => (row.live ? 'No ar' : null) },
      { key: 'name', header: 'Campanha', pinned: true, render: (row) => row.name },
      { key: 'budget', header: 'Verba', render: (row) => row.budget },
    ];
    render(<DataTable label="Campanhas" rows={ROWS} rowKey={(row) => row.id} columns={columns} />);

    expect(cellOf('Verão', 'name')).toHaveAttribute('data-title');
    expect(cellOf('Verão', 'live')).not.toHaveAttribute('data-title');
    expect(cellOf('Inverno', 'live')).toHaveAttribute('data-blank');
    expect(cellOf('Inverno', 'budget')).toHaveAttribute('data-blank');
    expect(cellOf('Verão', 'budget')).not.toHaveAttribute('data-blank');
  });

  it('sem coluna fixa, o título é a primeira com cabeçalho; fallback não é vazio', () => {
    const columns: Column<Row>[] = [
      { key: 'name', header: 'Campanha', render: (row) => row.name },
      { key: 'budget', header: 'Verba', render: (row) => row.budget, fallback: '—' },
      { key: 'actions', header: '', render: () => null },
    ];
    render(<DataTable label="Campanhas" rows={ROWS} rowKey={(row) => row.id} columns={columns} />);

    expect(cellOf('Inverno', 'name')).toHaveAttribute('data-title');
    expect(cellOf('Inverno', 'budget')).not.toHaveAttribute('data-blank');
    expect(cellOf('Inverno', 'actions')).not.toHaveAttribute('data-title');
  });

  it('abre a linha por clique e teclado, sem capturar controles internos', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    const onAction = vi.fn();
    const columns: Column<Row>[] = [
      { key: 'name', header: 'Campanha', render: (row) => row.name },
      {
        key: 'actions',
        header: 'Ações',
        render: () => (
          <button type="button" onClick={onAction}>
            Editar
          </button>
        ),
      },
    ];
    render(
      <DataTable
        label="Campanhas"
        rows={ROWS}
        rowKey={(row) => row.id}
        rowLabel={(row) => `Abrir ${row.name}`}
        columns={columns}
        onRowClick={onRowClick}
      />,
    );

    const row = screen.getByText('Verão').closest('tr') as HTMLElement;
    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0]!);
    expect(onAction).toHaveBeenCalledOnce();
    expect(onRowClick).not.toHaveBeenCalled();

    await user.click(row);
    expect(onRowClick).toHaveBeenCalledWith(ROWS[0]);
    row.focus();
    await user.keyboard('{Enter}');
    expect(onRowClick).toHaveBeenCalledTimes(2);
  });
});
