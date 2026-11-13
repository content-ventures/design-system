/**
 * `DateRangePicker startMax`: teto próprio do início. Escolhendo o início (aberto por «Início *» ou
 * sem início utilizável), os dias depois de `startMax` ficam indisponíveis e o clique neles não muda
 * nada; escolhendo o término, vale `max`. Sem `startMax`, o teto das duas pontas é `max`.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DateRangePicker, type DateRangePickerProps } from './date-picker';

type Props = Partial<DateRangePickerProps> & Pick<DateRangePickerProps, 'onChange'>;

function renderPicker(props: Props) {
  return render(
    <DateRangePicker
      start=""
      end=""
      labels
      required
      min="2026-11-12"
      aria-label="Período de veiculação"
      {...props}
    />,
  );
}

function day(date: string) {
  return document.querySelector<HTMLButtonElement>(`[data-date="${date}"]`);
}

/** Avança ou volta o calendário aberto até o dia aparecer. */
async function showDay(user: ReturnType<typeof userEvent.setup>, date: string) {
  for (let step = 0; step < 24 && !day(date); step += 1) {
    const first = document.querySelector<HTMLButtonElement>('[data-date]')?.dataset.date ?? '';
    const label = date < first ? 'Mês anterior' : 'Próximo mês';
    await user.click(screen.getByRole('button', { name: label }));
  }
  const found = day(date);
  if (!found) throw new Error(`Dia ${date} fora do calendário`);
  return found;
}

function disabledDays() {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('[data-date]'))
    .filter((button) => button.getAttribute('aria-disabled') === 'true')
    .map((button) => button.dataset.date);
}

describe('DateRangePicker startMax', () => {
  it.each([
    ['sem período', { start: '', end: '' }],
    ['com período', { start: '2026-11-15', end: '2027-02-14' }],
  ])('aberto por «Início *» %s: depois de startMax fica indisponível', async (_, range) => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPicker({ ...range, startMax: '2027-05-10', max: '2027-11-09', onChange });

    await user.click(screen.getByRole('button', { name: 'Início' }));
    const last = await showDay(user, '2027-05-10');
    expect(last).not.toHaveAttribute('aria-disabled');
    const after = day('2027-05-11');
    expect(after).toHaveAttribute('aria-disabled', 'true');
    // O mês do teto do início é o último a que se chega.
    expect(screen.getByRole('button', { name: 'Próximo mês' })).toBeDisabled();

    await user.click(after!);
    expect(onChange).not.toHaveBeenCalled();

    await user.click(last);
    expect(onChange).toHaveBeenCalledWith({
      start: '2027-05-10',
      end: range.end && '2027-05-10' <= range.end ? range.end : '',
    });
  });

  it('aberto por «Término *» com período: vale max, não startMax', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPicker({
      start: '2026-11-15',
      end: '2027-02-14',
      startMax: '2027-05-10',
      max: '2027-05-14',
      onChange,
    });

    await user.click(screen.getByRole('button', { name: 'Término' }));
    const last = await showDay(user, '2027-05-14');
    expect(day('2027-05-11')).not.toHaveAttribute('aria-disabled');
    expect(last).not.toHaveAttribute('aria-disabled');
    const after = day('2027-05-15');
    expect(after).toHaveAttribute('aria-disabled', 'true');

    await user.click(after!);
    expect(onChange).not.toHaveBeenCalled();
    await user.click(last);
    expect(onChange).toHaveBeenCalledWith({ start: '2026-11-15', end: '2027-05-14' });
  });

  it('depois de escolher o início, o término vai até max', async () => {
    const user = userEvent.setup();
    let range = { start: '', end: '' };
    const onChange = vi.fn((next: typeof range) => {
      range = next;
    });
    const { rerender } = renderPicker({ startMax: '2027-05-10', max: '2027-11-09', onChange });

    await user.click(screen.getByRole('button', { name: 'Início' }));
    await user.click(await showDay(user, '2027-05-10'));
    rerender(
      <DateRangePicker
        {...range}
        labels
        required
        min="2026-11-12"
        aria-label="Período de veiculação"
        startMax="2027-05-10"
        max="2027-11-09"
        onChange={onChange}
      />,
    );

    expect(await showDay(user, '2027-11-09')).not.toHaveAttribute('aria-disabled');
    expect(day('2027-11-10')).toHaveAttribute('aria-disabled', 'true');
  });

  it('atalho com início depois de startMax fica indisponível', async () => {
    const user = userEvent.setup();
    renderPicker({
      startMax: '2027-05-10',
      max: '2027-11-09',
      presets: [
        { label: 'Cabe', start: '2027-05-10', end: '2027-11-09' },
        { label: 'Começa tarde', start: '2027-05-11', end: '2027-06-10' },
      ],
      onChange: vi.fn(),
    });

    await user.click(screen.getByRole('button', { name: 'Término' }));
    expect(screen.getByRole('button', { name: 'Cabe' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Começa tarde' })).toBeDisabled();
  });

  it('sem startMax, o início vai até max como antes', async () => {
    const user = userEvent.setup();
    renderPicker({ max: '2027-05-14', onChange: vi.fn() });

    await user.click(screen.getByRole('button', { name: 'Início' }));
    await showDay(user, '2027-05-14');
    expect(disabledDays().filter((date) => date!.startsWith('2027-05'))).toEqual(
      Array.from({ length: 17 }, (_, i) => `2027-05-${String(15 + i).padStart(2, '0')}`),
    );
    expect(screen.getByRole('button', { name: 'Próximo mês' })).toBeDisabled();
  });
});

describe('DateRangePicker labels', () => {
  it('a caixa tira o nome do <label> visível, sem aria-label', async () => {
    renderPicker({ start: '2026-11-15', end: '', onChange: vi.fn() });
    const box = screen.getByRole('button', { name: 'Início' });
    expect(box).not.toHaveAttribute('aria-label');
    await waitFor(() => expect(box).toHaveAccessibleDescription(/15 de novembro de 2026/i));
  });
});
