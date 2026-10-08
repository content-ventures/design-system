/**
 * `SaveIndicator`: o estado de salvamento da `ActionBar`, solto. Anuncia como status e, no erro,
 * oferece “Tentar de novo”.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ActionBar, SaveIndicator } from './stepper';

describe('SaveIndicator', () => {
  it('mostra o estado com o rótulo próprio e o complemento', () => {
    render(<SaveIndicator status="saved" label="Salvo" detail="há 2 min" />);
    expect(screen.getByRole('status')).toHaveTextContent('Salvo');
    expect(screen.getByRole('status')).toHaveTextContent('há 2 min');
  });

  it('no erro oferece “Tentar de novo”', async () => {
    const onRetry = vi.fn();
    render(<SaveIndicator status="error" onRetry={onRetry} />);
    expect(screen.getByRole('status')).toHaveTextContent('Não foi possível salvar');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('a prancha para “Tentar de novo” em hover pelo `data-force` (gêmeo do :hover)', () => {
    render(<SaveIndicator status="error" onRetry={() => {}} data-force="hover" />);
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toHaveAttribute(
      'data-force',
      'hover',
    );
  });

  it('é o mesmo estado da ActionBar', () => {
    render(
      <ActionBar status="saving">
        <button type="button">Continuar</button>
      </ActionBar>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Salvando rascunho…');
  });
});
