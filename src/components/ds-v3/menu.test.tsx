import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { floatingHost } from './menu';

afterEach(cleanup);

describe('camada dos menus flutuantes', () => {
  it.each([true, false])('gaveta aberta=%s preserva a camada acima do véu', (open) => {
    render(
      <div data-ds-v3 data-testid="theme">
        <div data-nav-open={open || undefined}>
          <div data-part="sidebar" data-testid="sidebar">
            <button>Seletor</button>
          </div>
        </div>
      </div>,
    );
    expect(floatingHost(screen.getByRole('button'))).toBe(
      screen.getByTestId(open ? 'sidebar' : 'theme'),
    );
  });

  it('diálogo interno continua na camada de topo', () => {
    render(
      <div data-ds-v3 data-nav-open>
        <div data-part="sidebar">
          <dialog open>
            <button>Seletor</button>
          </dialog>
        </div>
      </div>,
    );
    expect(floatingHost(screen.getByRole('button'))).toBe(screen.getByRole('dialog'));
  });
});
