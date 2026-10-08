/**
 * Linha de lista clicável com controle ao lado: o controle fica fora do link
 * (nada de botão dentro de link) e o `onClick` roda também quando a linha é
 * link — é o que deixa "abrir" marcar como lida.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { FileText, PenLine } from 'lucide-react';
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

  it('icon desenha o ícone na frente, oculto do leitor de tela; leading tem precedência', () => {
    render(
      <List label="Produções">
        <ListItem icon={PenLine} title="Artigo da feira" href="#artigo" />
        <ListItem
          icon={FileText}
          leading={<span data-testid="lead">orbe</span>}
          title="Transcrição"
        />
      </List>,
    );
    const link = screen.getByRole('link', { name: 'Artigo da feira' });
    const glyph = link.querySelector('[data-icon] svg');
    expect(glyph).toHaveAttribute('aria-hidden', 'true');
    expect(link.closest('li')).toHaveAttribute('data-lead');

    const row = screen.getByText('Transcrição').closest('li') as HTMLElement;
    expect(screen.getByTestId('lead')).toBeInTheDocument();
    expect(row.querySelector('[data-icon]')).toBeNull();
  });

  it('titleLines={2} marca a linha para o título quebrar em duas; o padrão é uma', () => {
    render(
      <List label="Aguardando você">
        <ListItem
          titleLines={2}
          title="Grupo Horizonte: logística que encurtou o prazo de entrega em três dias"
          description="Erro · Artigo"
        />
        <ListItem title="Casa Forma" description="Ajustes solicitados" />
      </List>,
    );
    const long = screen.getByText(/Grupo Horizonte/).closest('li') as HTMLElement;
    const short = screen.getByText('Casa Forma').closest('li') as HTMLElement;
    expect(long).toHaveAttribute('data-title-lines', '2');
    expect(short).not.toHaveAttribute('data-title-lines');
  });

  it('bleed só vale sem contorno: marca a moldura para as linhas sangrarem o respiro', () => {
    const { container, rerender } = render(
      <List label="Aguardando você" framed={false} bleed>
        <ListItem title="Casa Forma" />
      </List>,
    );
    const frame = container.firstElementChild as HTMLElement;
    expect(frame).toHaveAttribute('data-bleed');
    rerender(
      <List label="Aguardando você" bleed>
        <ListItem title="Casa Forma" />
      </List>,
    );
    expect(container.firstElementChild).not.toHaveAttribute('data-bleed');
    expect(container.firstElementChild).toHaveAttribute('data-framed');
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
