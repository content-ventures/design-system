/**
 * `KanbanBoard fill`: o quadro mede onde começa na página e grava em `--kanban-top`, que o CSS
 * desconta da altura da janela; o corpo de cada coluna é o que rola.
 */
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { KanbanBoard, KanbanColumn } from './kanban';

afterEach(() => vi.restoreAllMocks());

function topAt(top: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    () =>
      ({
        width: 1200,
        height: 0,
        top,
        left: 0,
        right: 1200,
        bottom: top,
        x: 0,
        y: top,
        toJSON: () => ({}),
      }) as DOMRect,
  );
}

describe('KanbanBoard fill', () => {
  it('grava o topo do quadro, arredondado para cima, e marca o modo', () => {
    topAt(212.4);
    render(
      <KanbanBoard label="Etapas" fill>
        <KanbanColumn title="Artigo" count={0} />
      </KanbanBoard>,
    );
    const board = screen.getByRole('region', { name: 'Etapas' });
    expect(board).toHaveAttribute('data-fill', 'true');
    expect(board.style.getPropertyValue('--kanban-top')).toBe('213px');
  });

  it('soma a rolagem de quem contém o quadro: o topo é o da página, não o da janela', () => {
    topAt(-88);
    const { container } = render(<div />);
    const scroller = container.firstElementChild as HTMLElement;
    Object.defineProperty(scroller, 'scrollTop', { value: 300, configurable: true });
    render(
      <KanbanBoard label="Etapas" fill>
        <KanbanColumn title="Artigo" count={0} />
      </KanbanBoard>,
      { container: scroller },
    );
    expect(
      screen.getByRole('region', { name: 'Etapas' }).style.getPropertyValue('--kanban-top'),
    ).toBe('212px');
  });

  it('sem `fill`, o quadro cresce com o conteúdo e não mede nada', () => {
    topAt(212);
    render(
      <KanbanBoard label="Etapas">
        <KanbanColumn title="Artigo" count={0} />
      </KanbanBoard>,
    );
    const board = screen.getByRole('region', { name: 'Etapas' });
    expect(board).not.toHaveAttribute('data-fill');
    expect(board.style.getPropertyValue('--kanban-top')).toBe('');
  });

  it('a lista de cartões é o corpo que rola, e o ref chega ao quadro', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <KanbanBoard label="Etapas" fill ref={ref}>
        <KanbanColumn title="Artigo" count={1}>
          <div role="listitem">Tendências do verão</div>
        </KanbanColumn>
      </KanbanBoard>,
    );
    expect(ref.current).toBe(screen.getByRole('region', { name: 'Etapas' }));
    expect(screen.getByRole('list', { name: 'Artigo' })).toHaveAttribute('data-kanban-body');
  });
});
