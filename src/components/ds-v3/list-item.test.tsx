/**
 * Linha de lista clicável com controle ao lado: o controle fica fora do link
 * (nada de botão dentro de link) e o `onClick` roda também quando a linha é
 * link — é o que deixa "abrir" marcar como lida.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { List, ListItem } from './list-item';

describe('ListItem', () => {
  it('ações ficam fora do link; onClick roda com href', () => {
    const open = vi.fn();
    const act = vi.fn();
    render(
      <List label="Avisos">
        <ListItem
          href="#aviso"
          onClick={open}
          title="Campanha aprovada"
          actions={
            <button type="button" onClick={act}>
              Marcar como lida
            </button>
          }
        />
      </List>,
    );

    const link = screen.getByRole('link', { name: /Campanha aprovada/ });
    const button = screen.getByRole('button', { name: 'Marcar como lida' });
    expect(link.contains(button)).toBe(false);

    fireEvent.click(link);
    expect(open).toHaveBeenCalledTimes(1);
    fireEvent.click(button);
    expect(act).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('linha desabilitada não chama onClick', () => {
    const open = vi.fn();
    render(
      <List label="Avisos">
        <ListItem href="#aviso" onClick={open} disabled title="Antigo" />
      </List>,
    );
    fireEvent.click(screen.getByText('Antigo'));
    expect(open).not.toHaveBeenCalled();
  });
});
