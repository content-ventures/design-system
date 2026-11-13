import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { floatingHost, Menu } from './menu';

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

describe('teclado do menu do sino', () => {
  const sections = [
    {
      label: 'Hoje',
      items: [
        {
          label: 'Primeiro aviso',
          notice: { time: 'há 1 h', unread: true, tone: 'alerta' as const },
        },
        {
          label: 'Segundo aviso',
          notice: { time: 'há 2 h', unread: false, tone: 'neutro' as const },
        },
      ],
    },
    { items: [{ label: 'Ver todas' }] },
  ];

  function renderMenu() {
    render(
      <div data-ds-v3>
        <Menu
          label="Notificações"
          title="Notificações"
          sections={sections}
          trigger={(props) => (
            <button type="button" {...props}>
              Sino
            </button>
          )}
        />
      </div>,
    );
    return screen.getByRole('button', { name: 'Sino' });
  }

  it('↓ no sino foca o primeiro aviso; setas percorrem e dão a volta', async () => {
    const user = userEvent.setup();
    const bell = renderMenu();
    bell.focus();
    await user.keyboard('{ArrowDown}');
    const items = screen.getAllByRole('menuitem');
    expect(document.activeElement).toBe(items[0]);
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(items[1]);
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(items[2]);
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(items[0]);
    await user.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(items[2]);
  });

  it('Escape fecha e devolve o foco ao sino; Enter abre de novo', async () => {
    const user = userEvent.setup();
    const bell = renderMenu();
    bell.focus();
    await user.keyboard('{Enter}');
    expect(document.activeElement).toBe(screen.getAllByRole('menuitem')[0]);
    await user.keyboard('{Escape}');
    expect(document.activeElement).toBe(bell);
    expect(bell.getAttribute('aria-expanded')).toBe('false');
  });

  it('Tab fecha e devolve o foco ao sino', async () => {
    const user = userEvent.setup();
    const bell = renderMenu();
    bell.focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Tab}');
    expect(document.activeElement).toBe(bell);
  });
});

describe('item atual (`current`)', () => {
  const sections = [
    {
      label: 'Portais',
      items: [
        { label: 'Naturaltech', current: true },
        { label: 'Escolar Office Brasil', current: false },
      ],
    },
    { items: [{ label: 'Sair' }] },
  ];

  async function open() {
    render(
      <div data-ds-v3>
        <Menu
          label="Conta"
          sections={sections}
          trigger={(props) => (
            <button type="button" {...props}>
              Conta
            </button>
          )}
        />
      </div>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Conta' }));
  }

  it('o atual tem `aria-current="true"` e o check; os outros, nenhum dos dois', async () => {
    await open();
    const current = screen.getByRole('menuitem', { name: 'Naturaltech' });
    expect(current).toHaveAttribute('aria-current', 'true');
    expect(current.querySelector('svg')).not.toBeNull();
    const other = screen.getByRole('menuitem', { name: 'Escolar Office Brasil' });
    expect(other).not.toHaveAttribute('aria-current');
    expect(other.querySelector('svg')).toBeNull();
  });

  it('itens de lugar (`current` definido) têm 44 px; sem `current`, a altura de hoje', async () => {
    await open();
    expect(screen.getByRole('menuitem', { name: 'Escolar Office Brasil' })).toHaveAttribute(
      'data-place',
      '',
    );
    expect(screen.getByRole('menuitem', { name: 'Sair' })).not.toHaveAttribute('data-place');
    const css = readFileSync(resolve(__dirname, 'menu.module.css'), 'utf8');
    expect(css).toMatch(/\.item\[data-place\] \{[^}]*min-height: 44px;/);
  });
});
