import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ThemeV3 } from './theme';

describe('ThemeV3 — aparência', () => {
  it('mantém o tema claro aprovado como padrão', () => {
    render(<ThemeV3 data-testid="theme" />);
    expect(screen.getByTestId('theme')).toHaveAttribute('data-color-scheme', 'light');
  });

  it('propaga o tema às peças que têm escopo próprio, permitindo override explícito', () => {
    render(
      <ThemeV3 mode="dark">
        <ThemeV3 data-testid="inherited" />
        <ThemeV3 mode="light" data-testid="explicit" />
      </ThemeV3>,
    );
    expect(screen.getByTestId('inherited')).toHaveAttribute('data-color-scheme', 'dark');
    expect(screen.getByTestId('explicit')).toHaveAttribute('data-color-scheme', 'light');
  });

  it('resolve o modo automático pela preferência do dispositivo', () => {
    render(<ThemeV3 mode="system" data-testid="system" />);
    expect(screen.getByTestId('system')).toHaveAttribute('data-color-scheme', 'light');
  });
});
