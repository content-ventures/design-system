/**
 * `FilterBar` sem faixa de filtros: `filters={false}` dispensa `filtersOpen` e
 * `onFiltersOpenChange` (o botão “Filtros” não aparece). Com faixa, o botão continua controlado.
 * Empilhar é do CSS (quebra de linha), não de uma medida no cliente: o HTML do servidor e a barra
 * hidratada são iguais, e as contagens que chegam nas abas não mudam atributos de layout.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { FilterBar } from './filter-bar';
import { Tabs } from './tabs';

const css = readFileSync(resolve(__dirname, 'filter-bar.module.css'), 'utf8');

function Bar({ counts }: { counts?: number[] }) {
  return (
    <FilterBar
      filters={false}
      tabs={
        <Tabs
          label="Produções por status"
          value="todas"
          onChange={() => undefined}
          items={[
            { value: 'todas', label: 'Todas', count: counts?.[0] },
            { value: 'edicao', label: 'Em edição', count: counts?.[1] },
          ]}
        />
      }
      search={<input aria-label="Buscar produção" />}
    />
  );
}

describe('FilterBar', () => {
  it('sem faixa de filtros não pede estado nem mostra o botão', () => {
    render(<FilterBar filters={false} search={<input aria-label="Buscar produção" />} />);
    expect(screen.getByRole('textbox', { name: 'Buscar produção' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Filtros/ })).toBeNull();
  });

  it('com faixa, o botão alterna pelo teclado e informa o estado', async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(<FilterBar filtersOpen={false} onFiltersOpenChange={change} bandId="faixa" />);
    const button = screen.getByRole('button', { name: /Filtros/ });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-controls', 'faixa');

    button.focus();
    await user.keyboard('{Enter}');
    expect(change).toHaveBeenCalledWith(true);
  });

  it('servidor e cliente desenham a mesma barra, com ou sem contagens', () => {
    const attrs = (el: Element | null) =>
      el ? [...el.attributes].map((attr) => `${attr.name}=${attr.value}`).sort() : [];
    const host = document.createElement('div');
    host.innerHTML = renderToString(<Bar />);
    const server = host.firstElementChild;

    const { container, rerender } = render(<Bar />);
    expect(attrs(container.firstElementChild)).toEqual(attrs(server));
    expect(container.firstElementChild).not.toHaveAttribute('data-stacked');

    rerender(<Bar counts={[9, 5]} />);
    expect(attrs(container.firstElementChild)).toEqual(attrs(server));
  });

  it('a quebra de linha decide o empilhamento, com a busca na base de 220', () => {
    expect(css).toMatch(/\.bar \{[^}]*flex-wrap: wrap;/);
    expect(css).toMatch(
      /\.search \{[^}]*flex: 1 1 220px;[^}]*min-width: 220px;[^}]*max-width: 320px;/,
    );
    expect(css).not.toMatch(/data-stacked/);
  });
});
