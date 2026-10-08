/**
 * Selo de aprovação: nome acessível como imagem, decorativo com rótulo vazio, tamanho e parado
 * como atributos (o CSS desenha), atributos extras repassados.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Seal } from './seal';

describe('Seal', () => {
  it('é uma imagem com o rótulo como nome', () => {
    render(<Seal label="Aprovado" size="lg" />);
    const seal = screen.getByRole('img', { name: 'Aprovado' });
    expect(seal).toHaveAttribute('data-size', 'lg');
    expect(seal).not.toHaveAttribute('data-still');
    expect(seal.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('rótulo vazio vira decoração; still desliga a entrada', () => {
    const { container } = render(<Seal label="" still data-testid="selo" />);
    expect(screen.queryByRole('img')).toBeNull();
    const seal = screen.getByTestId('selo');
    expect(seal).toHaveAttribute('aria-hidden', 'true');
    expect(seal).toHaveAttribute('data-still');
    expect(seal).toHaveAttribute('data-size', 'md');
    expect(container.firstChild).toBe(seal);
  });
});
