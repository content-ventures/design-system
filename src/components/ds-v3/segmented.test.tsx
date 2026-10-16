/**
 * `Segmented` com opção indisponível (“Em breve”): a opção continua à vista e no leitor de tela
 * (`aria-disabled`, motivo como descrição e na dica do DS), mas nem o clique nem as setas a escolhem —
 * as setas pulam para a próxima disponível. `disabled` no grupo trava todas as opções e mantém a
 * escolha atual como parada de Tab, com o motivo na dica. Travar ou soltar não remonta o botão (o
 * foco fica nele) e as teclas do grupo nunca rolam a página nem repetem a escolha.
 */
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileText, Link2, Type } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { Segmented, type SegmentOption } from './selection';

type Material = 'arquivo' | 'texto' | 'link';

const OPTIONS: SegmentOption<Material>[] = [
  { value: 'arquivo', label: 'Arquivo', icon: FileText },
  { value: 'texto', label: 'Texto', icon: Type },
  { value: 'link', label: 'Link', icon: Link2, disabled: true, disabledReason: 'Em breve' },
];

function Picker({
  onChange,
  initial = 'arquivo',
  ...props
}: {
  onChange?: (value: Material) => void;
  initial?: Material;
  options?: SegmentOption<Material>[];
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [value, setValue] = useState<Material>(initial);
  return (
    <>
      <button type="button">Antes</button>
      <Segmented
        label="Material"
        options={OPTIONS}
        {...props}
        value={value}
        onChange={(next) => {
          onChange?.(next);
          setValue(next);
        }}
      />
    </>
  );
}

const radio = (name: string) => screen.getByRole('radio', { name });

describe('Segmented: opção indisponível', () => {
  it('fica à vista com aria-disabled e o motivo como descrição', () => {
    render(<Picker />);
    const link = radio('Link');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('aria-checked', 'false');
    expect(link).toHaveAccessibleDescription('Em breve');
    // Nada de `title` nativo: o motivo mora só na dica do DS.
    expect(link.getAttribute('title') ?? '').toBe('');
    // As outras não ganham motivo nem estado.
    expect(radio('Texto')).not.toHaveAttribute('aria-disabled');
    expect(radio('Texto')).not.toHaveAccessibleDescription();
    expect(screen.getByRole('radiogroup', { name: 'Material' })).not.toHaveAttribute(
      'aria-disabled',
    );
  });

  it('o clique não escolhe a opção', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Picker onChange={onChange} />);
    await user.click(radio('Link'));
    expect(onChange).not.toHaveBeenCalled();
    expect(radio('Arquivo')).toHaveAttribute('aria-checked', 'true');

    await user.click(radio('Texto'));
    expect(onChange).toHaveBeenCalledWith('texto');
  });

  it('setas, Home e End pulam a opção indisponível e dão a volta', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Picker onChange={onChange} />);
    await user.tab();
    await user.tab();
    expect(radio('Arquivo')).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(radio('Texto')).toHaveFocus();
    expect(radio('Texto')).toHaveAttribute('aria-checked', 'true');

    // Depois de Texto vem Link (indisponível): a seta volta para Arquivo.
    await user.keyboard('{ArrowRight}');
    expect(radio('Arquivo')).toHaveFocus();
    expect(radio('Arquivo')).toHaveAttribute('aria-checked', 'true');

    // De Arquivo para trás, a volta pula Link e cai em Texto.
    await user.keyboard('{ArrowLeft}');
    expect(radio('Texto')).toHaveFocus();

    await user.keyboard('{Home}');
    expect(radio('Arquivo')).toHaveFocus();
    await user.keyboard('{End}');
    expect(radio('Texto')).toHaveFocus();

    expect(onChange).not.toHaveBeenCalledWith('link');
    expect(radio('Link')).toHaveAttribute('tabindex', '-1');
  });

  it('o motivo abre na dica do DS ao passar o ponteiro', async () => {
    const user = userEvent.setup();
    render(<Picker />);
    await user.hover(radio('Link'));
    expect(await screen.findByRole('tooltip', { hidden: true })).toHaveTextContent('Em breve');
    await user.unhover(radio('Link'));
    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
  });

  it('só ícone: a dica dá o motivo, e o nome continua o nome acessível', async () => {
    const user = userEvent.setup();
    render(
      <Picker
        options={OPTIONS.map((option) => ({
          ...option,
          iconOnly: true,
          ...(option.value === 'link' ? { disabledReason: 'Link chega em breve' } : {}),
        }))}
      />,
    );
    const link = radio('Link');
    expect(link).toHaveAccessibleDescription('Link chega em breve');
    await user.hover(link);
    expect(await screen.findByRole('tooltip', { hidden: true })).toHaveTextContent(
      'Link chega em breve',
    );
    // A disponível segue com o nome na dica, sem repetir como descrição.
    expect(radio('Texto')).not.toHaveAccessibleDescription();
  });
});

describe('Segmented disabled', () => {
  it('trava o grupo: a escolha atual é a parada de Tab, com o motivo na dica', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Picker
        onChange={onChange}
        initial="texto"
        disabled
        disabledReason="Aguarde a IA terminar."
      />,
    );
    expect(screen.getByRole('radiogroup', { name: 'Material' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    for (const name of ['Arquivo', 'Texto', 'Link']) {
      expect(radio(name)).toHaveAttribute('aria-disabled', 'true');
    }
    // O motivo da opção vale antes do motivo do grupo.
    expect(radio('Link')).toHaveAccessibleDescription('Em breve');
    expect(radio('Arquivo')).toHaveAccessibleDescription('Aguarde a IA terminar.');

    await user.tab();
    await user.tab();
    const texto = radio('Texto');
    expect(texto).toHaveFocus();
    expect(await screen.findByRole('tooltip', { hidden: true })).toHaveTextContent(
      'Aguarde a IA terminar.',
    );

    await user.keyboard('{ArrowRight}{Home}{End}');
    await user.click(radio('Arquivo'));
    expect(onChange).not.toHaveBeenCalled();
    expect(texto).toHaveAttribute('aria-checked', 'true');
  });
});

describe('Segmented: foco e teclas nas bordas', () => {
  it('ligar e desligar o grupo não tira o foco da opção', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Picker />);
    await user.tab();
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(radio('Texto')).toHaveFocus();

    // O botão é o mesmo nó: ganhar o motivo não o remonta.
    const texto = radio('Texto');
    rerender(<Picker disabled disabledReason="Aguarde" />);
    expect(radio('Texto')).toBe(texto);
    expect(texto).toHaveFocus();
    expect(texto).toHaveAccessibleDescription('Aguarde');

    rerender(<Picker />);
    expect(radio('Texto')).toBe(texto);
    expect(texto).toHaveFocus();
    expect(texto).not.toHaveAccessibleDescription();
  });

  it('a escolha atual indisponível segue parada de Tab e as setas saem dela', async () => {
    const user = userEvent.setup();
    render(<Picker initial="link" />);
    await user.tab();
    await user.tab();
    expect(radio('Link')).toHaveFocus();
    expect(radio('Link')).toHaveAttribute('tabindex', '0');
    await user.keyboard('{ArrowRight}');
    expect(radio('Arquivo')).toHaveFocus();
    expect(radio('Arquivo')).toHaveAttribute('aria-checked', 'true');
  });

  it('com uma opção só disponível, as setas não repetem a escolha', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Picker
        onChange={onChange}
        options={OPTIONS.map((option) =>
          option.value === 'texto' ? { ...option, disabled: true } : option,
        )}
      />,
    );
    await user.tab();
    await user.tab();
    expect(radio('Arquivo')).toHaveFocus();
    await user.keyboard('{ArrowRight}{ArrowLeft}{Home}{End}');
    expect(onChange).not.toHaveBeenCalled();
    expect(radio('Arquivo')).toHaveFocus();
  });

  it('no grupo travado, as setas não rolam a página', () => {
    render(<Picker initial="texto" disabled disabledReason="Aguarde a IA terminar." />);
    for (const key of ['ArrowDown', 'ArrowRight', 'Home', 'End']) {
      expect(fireEvent.keyDown(radio('Texto'), { key })).toBe(false);
    }
    // Outras teclas seguem o caminho normal.
    expect(fireEvent.keyDown(radio('Texto'), { key: 'a' })).toBe(true);
  });

  it('Espaço e Enter na opção indisponível não escolhem', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Picker onChange={onChange} initial="link" />);
    await user.tab();
    await user.tab();
    expect(radio('Link')).toHaveFocus();
    await user.keyboard(' ');
    await user.keyboard('{Enter}');
    expect(onChange).not.toHaveBeenCalled();
    expect(radio('Link')).toHaveAttribute('aria-checked', 'true');
  });

  it('o clique na indisponível não leva o foco; as setas andam a partir da escolha', async () => {
    const user = userEvent.setup();
    render(<Picker />);
    await user.tab();
    await user.tab();
    expect(radio('Arquivo')).toHaveFocus();
    await user.click(radio('Link'));
    expect(radio('Arquivo')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(radio('Texto')).toHaveAttribute('aria-checked', 'true');
  });

  it('no toque, indisponível sem motivo não abre dica; com motivo, abre', async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <Picker
        options={OPTIONS.map((option) =>
          option.value === 'link' ? { ...option, disabledReason: undefined } : option,
        )}
      />,
    );
    await user.pointer({ keys: '[TouchA]', target: radio('Link') });
    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
    unmount();

    render(<Picker />);
    await user.pointer({ keys: '[TouchA]', target: radio('Link') });
    expect(await screen.findByRole('tooltip', { hidden: true })).toHaveTextContent('Em breve');
  });
});
