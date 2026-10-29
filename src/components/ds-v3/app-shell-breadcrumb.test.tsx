import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Breadcrumb } from './app-shell';

describe('trilha com níveis de contexto', () => {
  it('apresenta níveis sem destino como texto e reserva aria-current à página atual', () => {
    const go = vi.fn();
    const { container } = render(
      <Breadcrumb
        items={[
          { label: 'Organizadora: Açucena' },
          { label: 'Portal: Feira A', onClick: go },
          { label: 'Campanhas' },
        ]}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Organizadora: Açucena' })).toBeNull();
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(container.querySelector('[aria-current="page"]')).toHaveTextContent('Campanhas');
    fireEvent.click(screen.getByRole('button', { name: 'Portal: Feira A' }));
    expect(go).toHaveBeenCalledOnce();
  });

  it('a trilha compacta retorna ao ancestral com destino, ignorando rótulos de contexto', () => {
    const go = vi.fn();
    render(
      <Breadcrumb
        variant="compact"
        items={[
          { label: 'Organizadora: Açucena' },
          { label: 'Portal: Feira A', onClick: go },
          { label: 'Operação' },
          { label: 'Campanhas' },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Portal: Feira A' }));
    expect(go).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Operação' })).toBeNull();
  });
});
