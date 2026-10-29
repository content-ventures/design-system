import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useModalLayer } from './overlays';
import { Select } from './select';

function Layer({
  children,
  name = 'Camada',
  contained = false,
  onClose = vi.fn(),
}: {
  children?: ReactNode;
  name?: string;
  contained?: boolean;
  onClose?: () => void;
}) {
  const layer = useModalLayer({ open: true, onClose, contained, dismissible: true, exitMs: 0 });
  return (
    <dialog {...layer.dialogProps} aria-label={name} tabIndex={-1}>
      {children}
    </dialog>
  );
}

beforeEach(() => {
  // O jsdom não calcula layout; controles renderizados têm uma caixa no navegador.
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockImplementation(function (
    this: HTMLElement,
  ) {
    const rects = this.closest('[hidden]') ? [] : [new DOMRect()];
    return Object.assign(rects, { item: (index: number) => rects[index] ?? null });
  });
});

it('Escape no Select fecha apenas a lista e mantém o diálogo e o foco', async () => {
  const user = userEvent.setup();
  const close = vi.fn();
  render(
    <Layer onClose={close}>
      <Select
        label="Portal"
        options={[{ value: 'a', label: 'Feira A' }]}
        value=""
        onChange={vi.fn()}
      />
      <button>Cancelar</button>
    </Layer>,
  );
  const select = screen.getByRole('combobox', { name: 'Portal' });
  select.focus();
  await user.keyboard('{ArrowDown}');
  expect(screen.getByRole('listbox')).toBeInTheDocument();
  await user.keyboard('{Escape}');
  expect(select).toHaveAttribute('aria-expanded', 'false');
  expect(select).toHaveFocus();
  expect(screen.getByRole('dialog')).toBeVisible();
  expect(close).not.toHaveBeenCalled();
});
afterEach(() => vi.restoreAllMocks());

describe.each([false, true])('sequência de foco modal contained=%s', (contained) => {
  it.each([false, true])('dá a volta nos extremos com Shift=%s', (shiftKey) => {
    render(
      <Layer contained={contained}>
        <button>Primeiro</button>
        <button>Último</button>
      </Layer>,
    );
    const first = screen.getByRole('button', { name: 'Primeiro' });
    const last = screen.getByRole('button', { name: 'Último' });
    const from = shiftKey ? first : last;
    from.focus();
    expect(fireEvent.keyDown(from, { key: 'Tab', shiftKey })).toBe(false);
    expect(shiftKey ? last : first).toHaveFocus();
  });

  it.each([false, true])('entra na sequência a partir da camada com Shift=%s', (shiftKey) => {
    render(
      <Layer contained={contained}>
        <button>Primeiro</button>
        <button>Último</button>
      </Layer>,
    );
    const dialog = screen.getByRole('dialog');
    dialog.focus();
    expect(fireEvent.keyDown(dialog, { key: 'Tab', shiftKey })).toBe(false);
    expect(screen.getByRole('button', { name: shiftKey ? 'Último' : 'Primeiro' })).toHaveFocus();
  });

  it('retém Tab quando a camada não possui controles', () => {
    render(<Layer contained={contained} />);
    const dialog = screen.getByRole('dialog');
    dialog.focus();
    expect(fireEvent.keyDown(dialog, { key: 'Tab' })).toBe(false);
    expect(dialog).toHaveFocus();
  });

  it('ignora controles ocultos, desabilitados e fora da sequência de Tab', () => {
    render(
      <Layer contained={contained}>
        <button tabIndex={-1}>Fora da sequência</button>
        <button>Primeiro</button>
        <button>Último</button>
        <button disabled tabIndex={0}>
          Indisponível
        </button>
        <button hidden>Oculto</button>
        <button tabIndex={-2}>Também fora</button>
      </Layer>,
    );
    const first = screen.getByRole('button', { name: 'Primeiro' });
    const last = screen.getByRole('button', { name: 'Último' });
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(first).toHaveFocus();
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });

  it.each(['Tab', 'Escape'])('respeita %s já tratado pelo controle', (key) => {
    const close = vi.fn();
    render(
      <Layer contained={contained} onClose={close}>
        <button>Primeiro</button>
        <button onKeyDown={(event) => event.preventDefault()}>Controle</button>
      </Layer>,
    );
    const control = screen.getByRole('button', { name: 'Controle' });
    control.focus();
    fireEvent.keyDown(control, { key });
    expect(control).toHaveFocus();
    expect(close).not.toHaveBeenCalled();
  });
});

it.each([false, true])(
  'a camada externa não captura eventos da interna por portal=%s',
  (portal) => {
    const outerClose = vi.fn();
    const innerClose = vi.fn();
    const inner = (
      <Layer name="Interna" onClose={innerClose}>
        <button>Um</button>
        <button>Dois</button>
      </Layer>
    );
    render(
      <Layer name="Externa" onClose={outerClose}>
        <button>Fora</button>
        {portal ? createPortal(inner, document.body) : inner}
      </Layer>,
    );
    const [first, last] = within(screen.getByRole('dialog', { name: 'Interna' })).getAllByRole(
      'button',
    );
    first!.focus();
    expect(fireEvent.keyDown(first!, { key: 'Tab' })).toBe(true);
    expect(first).toHaveFocus();
    last!.focus();
    expect(fireEvent.keyDown(last!, { key: 'Tab' })).toBe(false);
    expect(first).toHaveFocus();
    fireEvent.keyDown(first!, { key: 'Escape' });
    expect(innerClose).toHaveBeenCalledOnce();
    expect(outerClose).not.toHaveBeenCalled();
  },
);
