/**
 * Esqueletos: blocos decorativos com o gancho estável `[data-skeleton]` (o produto confere “a
 * tela carregou” por ele, nunca por `data-shape`, que outras peças também usam) e a região com
 * `aria-busy` + “Carregando” para leitor de tela.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Skeleton, SkeletonRegion, SkeletonRows, SkeletonText } from './feedback';
import { IconTile } from './identity';
import { Sparkles } from './icons';

describe('Skeleton', () => {
  it('cada bloco traz `data-skeleton` e fica fora da árvore de acessibilidade', () => {
    const { container } = render(<Skeleton shape="block" width={120} />);
    const block = container.firstElementChild as HTMLElement;
    expect(block).toHaveAttribute('data-skeleton', '');
    expect(block).toHaveAttribute('aria-hidden', 'true');
  });

  it('texto e linhas em esqueleto: região ocupada com um bloco marcado por barra', () => {
    const { container } = render(
      <>
        <SkeletonText lines={3} label="Carregando o texto" />
        <SkeletonRows columns={[{ lead: true }, { sub: '40%' }]} rows={2} />
      </>,
    );
    expect(container.querySelectorAll('[aria-busy="true"]')).toHaveLength(2);
    expect(screen.getByText('Carregando o texto')).toBeInTheDocument();
    // 3 barras de texto + 2 linhas × (círculo e barra na 1ª coluna, barra e meta na 2ª).
    expect(container.querySelectorAll('[data-skeleton]')).toHaveLength(3 + 2 * 4);
  });

  it('o gancho não pega peças decorativas que só compartilham `data-shape`', () => {
    const { container } = render(
      <SkeletonRegion>
        <IconTile icon={Sparkles} />
      </SkeletonRegion>,
    );
    expect(container.querySelector('[data-shape]')).not.toBeNull();
    expect(container.querySelector('[data-skeleton]')).toBeNull();
  });
});
