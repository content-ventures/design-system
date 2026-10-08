/**
 * `FixedFrame` e `Disclosure`: no celular a lateral vira um resumo recolhível no topo do corpo.
 * Ele vem logo depois do h1 do cabeçalho, então o título do resumo é um h2 (nenhum nível pula);
 * `Disclosure` sozinho continua h3, com `headingLevel` para quem precisa de outro.
 */
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Disclosure, FixedFrame, PageHeader } from './structure';

afterEach(() => vi.restoreAllMocks());

describe('Disclosure', () => {
  it('título em h3 por padrão; `headingLevel` muda só o nível', () => {
    const { rerender } = render(<Disclosure summary="Detalhes">Corpo</Disclosure>);
    expect(screen.getByRole('heading', { level: 3, name: /Detalhes/ })).toBeInTheDocument();
    rerender(
      <Disclosure summary="Detalhes" headingLevel="h2">
        Corpo
      </Disclosure>,
    );
    expect(screen.getByRole('heading', { level: 2, name: /Detalhes/ })).toBeInTheDocument();
  });
});

describe('FixedFrame no celular', () => {
  it('a lateral vira um resumo em h2, logo abaixo do h1 do cabeçalho', () => {
    // Estreito: a moldura se mede com 390 px.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          width: 390,
          height: 800,
          top: 0,
          left: 0,
          right: 390,
          bottom: 800,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect,
    );
    render(
      <FixedFrame
        header={<PageHeader variant="frame" title="Nova produção" />}
        aside={<p>Prévia</p>}
        asideSummary="Prévia · 120 palavras"
      >
        <p>Formulário</p>
      </FixedFrame>,
    );
    const levels = screen
      .getAllByRole('heading')
      .map((heading) => Number(heading.tagName.slice(1)));
    expect(levels).toEqual([1, 2]);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Prévia · 120 palavras');
  });
});
