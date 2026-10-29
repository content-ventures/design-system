import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Select } from './select';
import { Dialog } from './overlays';
import { anchorHidden } from './popover';

const descriptors = new Map(
  ['showPopover', 'hidePopover', 'getAnimations'].map((key) => [
    key,
    Object.getOwnPropertyDescriptor(HTMLElement.prototype, key),
  ]),
);
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  for (const [key, descriptor] of descriptors) {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, key, descriptor);
    else Reflect.deleteProperty(HTMLElement.prototype, key);
  }
});
const options = [
  { value: 'transcript', label: 'Transcrição' },
  { value: 'report', label: 'Relatório' },
];
function nativeLayer() {
  const show = vi.fn(function (this: HTMLElement) {
    this.dataset.topLayer = 'open';
  });
  const hide = vi.fn(function (this: HTMLElement) {
    delete this.dataset.topLayer;
  });
  Object.defineProperty(HTMLElement.prototype, 'showPopover', { configurable: true, value: show });
  Object.defineProperty(HTMLElement.prototype, 'hidePopover', { configurable: true, value: hide });
  return { show, hide };
}

describe('Select in the native top layer', () => {
  it('preserves keyboard input during sheet entry and then dismisses a still-hidden anchor', async () => {
    nativeLayer(); let moving = true;
    Object.defineProperty(HTMLElement.prototype, 'getAnimations', { configurable: true, value: function (this: HTMLElement) {
      return moving && this.tagName === 'DIALOG' ? [{ playState: 'running', pending: false, effect: { getTiming: () => ({ iterations: 1 }) } }] : [];
    } });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return this.getAttribute('role') === 'combobox' ? new DOMRect(20, 900, 300, 44) : new DOMRect(0, 0, 1000, 768);
    });
    render(<Dialog open title="Material" onClose={() => {}}><Select label="Tipo" value="transcript" options={options} onChange={() => {}} /></Dialog>);
    const trigger = screen.getByRole('combobox', { name: 'Tipo' }); trigger.focus(); await userEvent.keyboard('{ArrowDown}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true'); moving = false;
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
  });
  it.each([false, true])('honors clipping above contained=%s dialogs only', async contained => {
    nativeLayer();
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return this.hasAttribute('data-clips-outside') ? new DOMRect(0, 0, 10, 10) : new DOMRect(0, 0, 1000, 768);
    });
    render(<div data-clips-outside style={{ overflow: 'hidden' }}><Dialog open contained={contained} title="Material" onClose={() => {}}><Select label="Tipo" value="transcript" options={options} onChange={() => {}} /></Dialog></div>);
    const trigger = screen.getByRole('combobox', { name: 'Tipo' });
    expect(anchorHidden(trigger)).toBe(contained);
    await userEvent.click(trigger); expect(trigger).toHaveAttribute('aria-expanded', String(!contained));
  });
  it('opens above transformed ancestors and preserves keyboard selection and focus', async () => {
    const native = nativeLayer(),
      change = vi.fn(),
      user = userEvent.setup();
    render(
      <Dialog open title="Material" onClose={() => {}}>
        <Select label="Tipo" value="transcript" options={options} onChange={change} />
      </Dialog>,
    );
    const trigger = screen.getByRole('combobox', { name: 'Tipo' });
    await user.click(trigger);
    const panel = document.querySelector('[popover="manual"]');
    expect(panel).toHaveAttribute('data-top-layer', 'open');
    expect(native.show).toHaveBeenCalledTimes(1);
    await user.keyboard('{End}{Enter}');
    expect(change).toHaveBeenCalledWith('report');
    expect(trigger).toHaveFocus();
    await waitFor(() => expect(document.querySelector('[popover]')).toBeNull());
  });

  it('keeps outside-pointer and hidden-anchor dismissal', async () => {
    nativeLayer();
    const user = userEvent.setup();
    render(
      <Dialog open title="Material" onClose={() => {}}>
        <Select label="Tipo" value="transcript" options={options} onChange={() => {}} />
      </Dialog>,
    );
    const trigger = screen.getByRole('combobox', { name: 'Tipo' });
    await user.click(trigger);
    fireEvent.pointerDown(document.body);
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    await user.click(trigger);
    Object.defineProperty(trigger, 'getBoundingClientRect', {
      value: () => ({ top: -100, bottom: -64, left: 0, right: 100, width: 100, height: 36 }),
    });
    fireEvent.scroll(window);
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
  });

  it('retains the portal fallback when native popovers are unavailable', async () => {
    Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
    Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
    const change = vi.fn(),
      user = userEvent.setup();
    render(
      <Dialog open title="Material" onClose={() => {}}>
        <Select label="Tipo" value="transcript" options={options} onChange={change} />
      </Dialog>,
    );
    await user.click(screen.getByRole('combobox', { name: 'Tipo' }));
    expect(document.querySelector('[popover]')).toBeNull();
    await user.click(screen.getByRole('option', { name: 'Relatório' }));
    expect(change).toHaveBeenCalledWith('report');
  });
});
