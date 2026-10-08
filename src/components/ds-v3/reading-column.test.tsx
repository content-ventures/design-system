/**
 * `ReadingColumn`: a medida do texto para o que acompanha um `Prose` (avisos, decisão, diferenças,
 * imagens). Centrada por padrão, encostada com `align="start"`, região nomeada quando pedida. O jsdom
 * não calcula CSS: a medida (68ch na fonte de leitura, o miolo de volta à fonte da interface) é
 * conferida no texto do CSS.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ReadingColumn } from './reading-column';

const CSS = readFileSync(
  join(process.cwd(), 'src/components/ds-v3/reading-column.module.css'),
  'utf8',
).replace(/\/\*[\s\S]*?\*\//g, '');

function block(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`).exec(CSS)?.[2] ?? '';
}

describe('ReadingColumn', () => {
  it('centrada por padrão, com o conteúdo num só bloco de ritmo', () => {
    render(
      <ReadingColumn data-testid="column">
        <p>Versão 2 aprovada</p>
        <p>Texto do artigo</p>
      </ReadingColumn>,
    );
    const column = screen.getByTestId('column');
    expect(column.tagName).toBe('DIV');
    expect(column).toHaveAttribute('data-part', 'reading-column');
    expect(column).toHaveAttribute('data-align', 'center');
    expect(column).not.toHaveAttribute('role');
    expect(column.children).toHaveLength(1);
    expect(column.firstElementChild?.children).toHaveLength(2);
  });

  it('encostada no início e região nomeada; repassa atributos e classe', () => {
    render(
      <ReadingColumn align="start" label="Alterações da versão 2" className="extra" id="leitura">
        <p>Diferenças</p>
      </ReadingColumn>,
    );
    const region = screen.getByRole('region', { name: 'Alterações da versão 2' });
    expect(region).toHaveAttribute('data-align', 'start');
    expect(region).toHaveAttribute('id', 'leitura');
    expect(region.className).toContain('extra');
  });

  it('section e article não ganham role; o nome vai no aria-label', () => {
    render(
      <ReadingColumn as="article" label="Artigo final">
        <p>Texto</p>
      </ReadingColumn>,
    );
    const article = screen.getByRole('article', { name: 'Artigo final' });
    expect(article.tagName).toBe('ARTICLE');
    expect(article).not.toHaveAttribute('role');
  });

  it('CSS: 68ch na fonte de leitura, centrada pela margem, miolo na fonte da interface', () => {
    const column = block('.column');
    expect(column).toMatch(/max-width:\s*var\(--prose-measure\)/);
    expect(column).toMatch(/margin-inline:\s*auto/);
    expect(column).toMatch(/font:\s*var\(--t-prose-body\)/);
    expect(block(".column[data-align='start']")).toMatch(/margin-inline:\s*0/);
    const stack = block('.stack');
    expect(stack).toMatch(/gap:\s*var\(--s-6\)/);
    expect(stack).toMatch(/font:\s*var\(--t-body\)/);
    // Só posiciona: nada de superfície, fio ou sombra.
    expect(CSS).not.toMatch(/border|box-shadow|background/);
  });
});
