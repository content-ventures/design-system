/**
 * Ações de linha: o padrão não muda para quem já usa; `target="touch"` marca o
 * grupo para o alvo de 44 px; a ação indisponível no "⋯" diz o motivo; e
 * `compact` leva tudo para o "⋯".
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { Archive, Pencil, Power, Trash2 } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { RowActions, type RowAction } from './row-actions';

function actions(): RowAction[] {
  return [
    { id: 'edit', label: 'Editar', icon: Pencil, onSelect: vi.fn() },
    { id: 'status', label: 'Desativar canal', icon: Power, onSelect: vi.fn() },
    { id: 'archive', label: 'Arquivar', icon: Archive, onSelect: vi.fn() },
    {
      id: 'delete',
      label: 'Excluir canal',
      icon: Trash2,
      danger: true,
      disabled: true,
      hint: 'Usado em 1 ativo — desative em vez de excluir',
      onSelect: vi.fn(),
    },
  ];
}

describe('RowActions', () => {
  it('sem target, o markup é o de antes: sem data-target e igual ao padrão explícito', () => {
    const implicit = render(<RowActions label="Ações de Canal A" actions={actions()} />);
    const html = implicit.container.innerHTML;
    implicit.unmount();
    const explicit = render(
      <RowActions label="Ações de Canal A" actions={actions()} target="default" />,
    );

    expect(html).toBe(explicit.container.innerHTML);
    expect(screen.getByRole('group', { name: 'Ações de Canal A' })).not.toHaveAttribute(
      'data-target',
    );
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('com target="touch", o grupo leva data-target="touch"', () => {
    render(<RowActions label="Ações de Canal A" actions={actions()} target="touch" />);
    expect(screen.getByRole('group', { name: 'Ações de Canal A' })).toHaveAttribute(
      'data-target',
      'touch',
    );
  });

  it('ação desabilitada com hint no "⋯" expõe o motivo como description', () => {
    render(<RowActions label="Ações de Canal A" actions={actions()} max={1} target="touch" />);
    fireEvent.click(screen.getByRole('button', { name: 'Mais ações' }));

    const menu = screen.getByRole('menu');
    const item = within(menu).getByRole('menuitem', { name: /Excluir canal/ });
    expect(item).toHaveAttribute('aria-disabled', 'true');
    expect(item).toHaveTextContent('Usado em 1 ativo — desative em vez de excluir');
  });

  it('compact põe todas as ações no "⋯"', () => {
    render(<RowActions label="Ações de Canal A" actions={actions()} compact />);
    const group = screen.getByRole('group', { name: 'Ações de Canal A' });
    expect(within(group).getAllByRole('button')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Mais ações' }));
    const labels = within(screen.getByRole('menu'))
      .getAllByRole('menuitem')
      .map((item) => item.textContent);
    expect(labels).toHaveLength(4);
    expect(labels.at(-1)).toContain('Excluir canal');
  });
});
