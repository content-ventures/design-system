/**
 * Ficha de entidade: uma só ação com o estilo principal, selo de estado em texto, bloco
 * de pendências ausente quando vazio e a ordem título, selo, ações.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './button';
import { EntitySheet, type EntitySheetProps } from './index';

// O barril carrega a fonte do Next, que não existe fora do build.
vi.mock('./font', () => ({ interV3: { variable: '' } }));

function renderSheet(props: Partial<EntitySheetProps> = {}) {
  return render(
    <EntitySheet
      titulo="Naturaltech"
      selo={{ texto: 'Inativa', tom: 'gray' }}
      acaoPrincipal={{ rotulo: 'Ativar', onClick: () => {} }}
      acoesSecundarias={<Button variant="secondary">Ver prévia</Button>}
      configuracoes={{ href: '/vitrine/configuracoes' }}
      pendencias={<p>A primeira dobra está vazia</p>}
      {...props}
    >
      <p>Fila de solicitações</p>
    </EntitySheet>,
  );
}

describe('EntitySheet', () => {
  it('tem uma só ação com o estilo principal', () => {
    const onClick = vi.fn();
    const { container } = renderSheet({ acaoPrincipal: { rotulo: 'Ativar', onClick } });
    const primary = container.querySelectorAll('[data-variant="primary"]');
    expect(primary).toHaveLength(1);
    expect(primary[0]).toHaveTextContent('Ativar');
    fireEvent.click(screen.getByRole('button', { name: 'Ativar' }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Ver prévia' })).toHaveAttribute(
      'data-variant',
      'secondary',
    );
  });

  it('a ação principal pode ser um link', () => {
    renderSheet({ acaoPrincipal: { rotulo: 'Ver no ar', href: 'https://vitrine.example.com' } });
    const link = screen.getByRole('link', { name: 'Ver no ar' });
    expect(link).toHaveAttribute('href', 'https://vitrine.example.com');
    expect(link).toHaveAttribute('data-variant', 'primary');
  });

  it('o selo é texto com ponto, ou anel no tom cinza, nunca só cor', () => {
    const { container, rerender } = renderSheet();
    const seal = container.querySelector('[data-tone="gray"]')!;
    expect(seal).toHaveTextContent('Inativa');
    expect(seal.querySelector('[aria-hidden="true"]')).toHaveAttribute('data-hollow');
    rerender(
      <EntitySheet
        titulo="Naturaltech"
        selo={{ texto: 'Ativa', tom: 'green' }}
        acaoPrincipal={{ rotulo: 'Ver no ar', href: '/' }}
      />,
    );
    const active = container.querySelector('[data-tone="green"]')!;
    expect(active).toHaveTextContent('Ativa');
    const dot = active.querySelector('[aria-hidden="true"]')!;
    expect(dot).not.toBeNull();
    expect(dot).not.toHaveAttribute('data-hollow');
  });

  it('tem o ⚙ Configurações', () => {
    renderSheet();
    expect(screen.getByRole('link', { name: 'Configurações' })).toHaveAttribute(
      'href',
      '/vitrine/configuracoes',
    );
  });

  it('sem pendências, o bloco não existe', () => {
    const { container, rerender } = renderSheet();
    expect(container.querySelector('[data-entity-sheet-pendencias]')).toHaveTextContent(
      'A primeira dobra está vazia',
    );
    for (const pendencias of [undefined, null, false, []]) {
      rerender(
        <EntitySheet
          titulo="Naturaltech"
          selo={{ texto: 'Inativa', tom: 'gray' }}
          acaoPrincipal={{ rotulo: 'Ativar' }}
          pendencias={pendencias}
        />,
      );
      expect(container.querySelector('[data-entity-sheet-pendencias]')).toBeNull();
    }
  });

  it('ordem: título, selo, ações, pendências e conteúdo', () => {
    const { container } = renderSheet();
    const sheet = screen.getByRole('region', { name: 'Naturaltech' });
    const title = within(sheet).getByRole('heading', { level: 1, name: 'Naturaltech' });
    const seal = within(sheet).getByText('Inativa');
    const actions = container.querySelector('[data-entity-sheet-actions]')!;
    const pending = container.querySelector('[data-entity-sheet-pendencias]')!;
    const content = within(sheet).getByText('Fila de solicitações');
    const ordered = [title, seal, actions, pending, content];
    for (let index = 1; index < ordered.length; index += 1)
      expect(
        ordered[index - 1]!.compareDocumentPosition(ordered[index]!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    expect(within(actions as HTMLElement).getAllByRole('button')[0]).toHaveTextContent('Ativar');
  });
});
