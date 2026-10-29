import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Dialog } from './overlays';
afterEach(() => vi.restoreAllMocks());

describe('native dialog close events', () => {
  it.each([false, true])('wraps Tab and Shift+Tab within contained=%s layers', contained => {
    // jsdom has no layout; these mounted controls are visible in the browser.
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([new DOMRect(0, 0, 100, 36)] as unknown as DOMRectList);
    render(<Dialog open contained={contained} title="Material" onClose={() => {}} footer={<button>Cancelar</button>}><input aria-label="Título" /></Dialog>);
    const first = screen.getByRole('button', { name: 'Fechar' }), last = screen.getByRole('button', { name: 'Cancelar' });
    act(() => first.focus()); fireEvent.keyDown(first, { key: 'Tab', shiftKey: true }); expect(last).toHaveFocus();
    fireEvent.keyDown(last, { key: 'Tab' }); expect(first).toHaveFocus();
  });
  it('ignores a queued close after the same dialog has reopened', () => {
    const close = vi.fn(); render(<Dialog open title="Material" onClose={close}>Original</Dialog>);
    const dialog = screen.getByRole('dialog', { name: 'Material' }) as HTMLDialogElement;
    expect(dialog.open).toBe(true); fireEvent(dialog, new Event('close')); expect(close).not.toHaveBeenCalled(); expect(dialog.open).toBe(true);
    dialog.close(); fireEvent(dialog, new Event('close')); expect(close).toHaveBeenCalledTimes(1);
  });
  it('does not apply a child close event to its parent', () => {
    const close = vi.fn(); render(<Dialog open title="Material" onClose={close}><dialog data-testid="child">Original</dialog></Dialog>);
    fireEvent(screen.getByTestId('child'), new Event('close', { bubbles: true })); expect(close).not.toHaveBeenCalled();
  });
});
