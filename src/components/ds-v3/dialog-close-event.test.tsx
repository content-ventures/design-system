import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Dialog } from './overlays';

describe('native dialog close events', () => {
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
