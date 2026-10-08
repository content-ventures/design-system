/**
 * Linhas compactas que se alinham e quebram: `Accordion` com marcadores guarda o lugar do marcador nas
 * linhas sem estado (os títulos ficam na mesma borda); `MetaList` deixa um fato mais longo que a linha
 * quebrar dentro dele, com o “·” pendurado no recuo; `Segmented` esticado reparte a sobra entre as
 * opções. O jsdom não calcula CSS: o que é visual é conferido no texto do CSS.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Accordion } from './structure';
import { MetaList } from './surfaces';

function css(file: string) {
  return readFileSync(join(process.cwd(), 'src/components/ds-v3', file), 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  );
}

function block(source: string, selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`).exec(source)?.[2] ?? '';
}

describe('Accordion: marcadores alinhados', () => {
  it('numa lista com marcadores, a linha sem estado guarda o lugar do marcador, mudo', () => {
    const { container } = render(
      <Accordion
        items={[
          { id: 'titulo', title: 'Título', status: 'done', content: 'ok' },
          { id: 'capa', title: 'Imagem de destaque', meta: 'Sem capa', content: 'Sem capa' },
        ]}
      />,
    );
    const spacer = container.querySelector('[data-status="none"]');
    expect(spacer).not.toBeNull();
    expect(spacer?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByRole('button', { name: /Imagem de destaque/ })).toBeTruthy();
    expect(block(css('structure.module.css'), ".accMark[data-status='none']")).toMatch(
      /background:\s*none/,
    );
  });

  it('sem nenhum marcador na lista, nenhuma linha reserva lugar', () => {
    const { container } = render(
      <Accordion
        items={[
          { id: 'a', title: 'A', content: 'a' },
          { id: 'b', title: 'B', content: 'b' },
        ]}
      />,
    );
    expect(container.querySelector('[data-status="none"]')).toBeNull();
  });
});

describe('MetaList: fato longo quebra', () => {
  it('quebra dentro do item, com o separador pendurado no recuo; uma linha só ainda corta', () => {
    render(
      <MetaList
        items={['Sugestão de imagem de destaque: Gustavo Hoff com o kit de demonstração']}
      />,
    );
    expect(screen.getByText(/Gustavo Hoff/)).toBeTruthy();
    const source = css('surfaces.module.css');
    const item = block(source, '.metaItem');
    expect(item).toMatch(/padding-left:\s*var\(--meta-gap\)/);
    expect(item).toMatch(/overflow-wrap:\s*break-word/);
    expect(item).not.toMatch(/white-space:\s*nowrap/);
    expect(block(source, '.metaItem::before')).toMatch(
      /margin-left:\s*calc\(var\(--meta-gap\) \* -1\)/,
    );
    expect(block(source, ".meta[data-wrap='false'] .metaItem")).toMatch(
      /text-overflow:\s*ellipsis/,
    );
  });
});

describe('Segmented: trilho esticado', () => {
  it('as opções crescem com o trilho (sem rabo vazio depois da última)', () => {
    expect(block(css('selection.module.css'), '.segment')).toMatch(/flex:\s*1 0 auto/);
  });
});
