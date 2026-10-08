/**
 * `NumberField fit`: a quantidade pequena não estica na coluna — o campo marca `data-fit` e
 * reserva os dígitos do máximo (`--number-ch`); sem `fit`, nada muda.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NumberField } from './number-field';

describe('NumberField fit', () => {
  it('reserva os dígitos do máximo (mínimo 2, mais folga) e marca o controle', () => {
    render(
      <NumberField label="Quantidade" value={5} onChange={() => {}} min={3} max={10} stepper fit />,
    );
    const control = screen.getByRole('spinbutton', { name: 'Quantidade' })
      .parentElement as HTMLElement;
    expect(control).toHaveAttribute('data-fit');
    expect(control.style.getPropertyValue('--number-ch')).toBe('3ch');
  });

  it('milhar e decimais contam; sem `fit` o controle segue a coluna', () => {
    const { rerender } = render(
      <NumberField label="Valor" value={1} onChange={() => {}} max={45000} decimals={2} fit />,
    );
    const control = () =>
      screen.getByRole('spinbutton', { name: 'Valor' }).parentElement as HTMLElement;
    // “45.000” (6) + “,00” (3) + 1 de folga.
    expect(control().style.getPropertyValue('--number-ch')).toBe('10ch');
    rerender(<NumberField label="Valor" value={1} onChange={() => {}} max={45000} decimals={2} />);
    expect(control()).not.toHaveAttribute('data-fit');
    expect(control().style.getPropertyValue('--number-ch')).toBe('');
  });
});
