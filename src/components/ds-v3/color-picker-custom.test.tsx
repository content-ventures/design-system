/**
 * A cor personalizada do painel (28/10/2026): além das doze prontas, o seletor do sistema e o código
 * `#RRGGBB`, com a leitura de contraste acompanhando a cor digitada.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { cleanHexInput, ColorField, HEX_FORMAT_MESSAGE } from './color-picker';

function Harness({
  initial = '#3E63DD',
  onChange,
}: {
  initial?: string;
  onChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <ColorField
      label="Cor de destaque"
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

function openPanel() {
  fireEvent.click(screen.getByRole('button', { name: 'Escolher cor' }));
  return screen.getByRole('dialog', { name: 'Cores da marca' });
}

/** A linha da leitura do painel: amostra, código e contraste. */
const readout = () => screen.getByText(/:1 · (AAA|AA|Baixo)$/).parentElement!;
const tab = (shiftKey = false) =>
  fireEvent.keyDown(document.activeElement!, { key: 'Tab', shiftKey });
const isOpen = () =>
  screen.getByRole('button', { name: 'Escolher cor' }).getAttribute('aria-expanded') === 'true';

describe('cleanHexInput', () => {
  it('maiúsculas, só hexadecimais, com o # na frente, até 7', () => {
    expect(cleanHexInput('5b2a86')).toBe('#5B2A86');
    expect(cleanHexInput('#zz12g')).toBe('#12');
    expect(cleanHexInput('##1234567')).toBe('#123456');
    expect(cleanHexInput('')).toBe('');
  });
});

describe('ColorField · cor personalizada', () => {
  it('o painel traz o seletor do sistema e o código da cor personalizada', () => {
    render(<Harness />);
    openPanel();
    expect(screen.getByLabelText('Escolher no seletor do sistema')).toHaveAttribute(
      'type',
      'color',
    );
    expect(screen.getByLabelText('Cor personalizada')).toHaveValue('#3E63DD');
  });

  it('código válido fora das prontas vale na hora, normalizado, e a leitura acompanha', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    openPanel();
    const custom = screen.getByLabelText('Cor personalizada');
    custom.focus();
    fireEvent.change(custom, { target: { value: 'f5d90a' } });
    expect(onChange).toHaveBeenLastCalledWith('#F5D90A');
    expect(custom).toHaveValue('#F5D90A');
    // Amarelo claro com texto branco: a leitura mostra a medida baixa da cor digitada.
    expect(readout()).toHaveTextContent('1,4:1 · Baixo');
    expect(screen.getByLabelText('Cor de destaque')).toHaveValue('#F5D90A');

    fireEvent.change(custom, { target: { value: '#0B3D2E' } });
    expect(readout()).toHaveTextContent(/AAA$/);
  });

  it('código incompleto não muda a cor e, ao confirmar, mostra o formato esperado', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    openPanel();
    const custom = screen.getByLabelText('Cor personalizada');
    custom.focus();
    fireEvent.change(custom, { target: { value: '#12AB' } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.keyDown(custom, { key: 'Enter' });
    const error = screen.getByText(HEX_FORMAT_MESSAGE);
    expect(custom).toHaveAttribute('aria-invalid', 'true');
    expect(custom).toHaveAttribute('aria-describedby', error.id);
    // A leitura segue a cor que vale, não o código pela metade.
    expect(readout()).toHaveTextContent(/^#3E63DD/);
  });

  it('Enter com código válido aplica, fecha e devolve o foco à amostra', () => {
    render(<Harness />);
    openPanel();
    const custom = screen.getByLabelText('Cor personalizada');
    custom.focus();
    fireEvent.change(custom, { target: { value: '#123ABC' } });
    fireEvent.keyDown(custom, { key: 'Enter' });
    expect(isOpen()).toBe(false);
    expect(screen.getByRole('button', { name: 'Escolher cor' })).toHaveFocus();
    expect(screen.getByLabelText('Cor de destaque')).toHaveValue('#123ABC');
  });

  it('o seletor do sistema aplica a cor escolhida em maiúsculas', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    openPanel();
    fireEvent.change(screen.getByLabelText('Escolher no seletor do sistema'), {
      target: { value: '#a1b2c3' },
    });
    expect(onChange).toHaveBeenLastCalledWith('#A1B2C3');
    expect(screen.getByLabelText('Cor personalizada')).toHaveValue('#A1B2C3');
  });

  it('Tab percorre a grade, o seletor e o código; do último, sai para o código do campo', () => {
    render(<Harness />);
    openPanel();
    const selected = screen.getByRole('button', { name: '#3E63DD' });
    expect(selected).toHaveFocus();
    tab();
    expect(screen.getByLabelText('Escolher no seletor do sistema')).toHaveFocus();
    tab();
    expect(screen.getByLabelText('Cor personalizada')).toHaveFocus();
    tab(true);
    expect(screen.getByLabelText('Escolher no seletor do sistema')).toHaveFocus();
    tab(true);
    expect(selected).toHaveFocus();
    tab();
    tab();
    tab();
    expect(isOpen()).toBe(false);
    expect(screen.getByLabelText('Cor de destaque')).toHaveFocus();
  });
});
