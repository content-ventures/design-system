/**
 * `PromptComposer`: formulário controlado do copiloto. Enter envia (Shift+Enter quebra linha) ou
 * ⌘/Ctrl+Enter com `submitKey="mod-enter"`; vazio e acima do limite não enviam e dizem o motivo;
 * gerando, Parar substitui Enviar (Esc também para); erro com “Tentar de novo”; pedidos prontos
 * preenchem ou enviam; `ref.focus()` leva ao campo.
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  PromptComposer,
  PromptModelMenu,
  type PromptComposerHandle,
  type PromptComposerProps,
} from './prompt-composer';

function Harness({ initial = '', ...props }: Partial<PromptComposerProps> & { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <PromptComposer value={value} onChange={setValue} onSubmit={() => undefined} {...props} />;
}

describe('PromptComposer', () => {
  it('é um formulário nomeado; Enter envia o texto aparado e Shift+Enter quebra linha', async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    render(<Harness onSubmit={submit} />);
    expect(screen.getByRole('form', { name: 'Pedido ao copiloto' })).toBeInTheDocument();
    const field = screen.getByRole('textbox', { name: 'Pedido' });
    expect(field).toHaveAttribute('placeholder', 'Peça uma mudança ao texto…');

    await user.type(field, '  Deixe mais direto{Shift>}{Enter}{/Shift}sem perder a fala  ');
    expect(submit).not.toHaveBeenCalled();
    expect(field).toHaveValue('  Deixe mais direto\nsem perder a fala  ');

    await user.keyboard('{Enter}');
    expect(submit).toHaveBeenCalledWith({ text: 'Deixe mais direto\nsem perder a fala' });
  });

  it('com submitKey="mod-enter", Enter quebra linha e Ctrl+Enter envia', async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    render(<Harness onSubmit={submit} submitKey="mod-enter" initial="Encurte" />);
    const field = screen.getByRole('textbox', { name: 'Pedido' });
    await user.click(field);
    await user.keyboard('{Enter}');
    expect(submit).not.toHaveBeenCalled();
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(submit).toHaveBeenCalledWith({ text: 'Encurte' });
  });

  it('vazio não envia: Enviar fica indisponível, focável, com o motivo como descrição', async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    render(<Harness onSubmit={submit} />);
    const send = screen.getByRole('button', { name: 'Enviar' });
    expect(send).toHaveAttribute('aria-disabled', 'true');
    expect(send).toHaveAccessibleDescription('Escreva um pedido');

    await user.click(send);
    await user.click(screen.getByRole('textbox', { name: 'Pedido' }));
    await user.keyboard('{Enter}');
    expect(submit).not.toHaveBeenCalled();

    await user.keyboard('Oi');
    expect(screen.getByRole('button', { name: 'Enviar' })).not.toHaveAttribute('aria-disabled');
  });

  it('o botão Enviar envia pelo teclado (Tab até ele e Enter)', async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    render(<Harness onSubmit={submit} initial="Sugira intertítulos" />);
    screen.getByRole('textbox', { name: 'Pedido' }).focus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Enviar' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(submit).toHaveBeenCalledWith({ text: 'Sugira intertítulos' });
  });

  it('gerando, Parar substitui Enviar; clique e Esc chamam onStop; Enter não envia', async () => {
    const user = userEvent.setup();
    const stop = vi.fn();
    const submit = vi.fn();
    render(<Harness status="streaming" onStop={stop} onSubmit={submit} initial="Próximo pedido" />);
    expect(screen.queryByRole('button', { name: 'Enviar' })).toBeNull();
    expect(screen.getByRole('form')).toHaveAttribute('aria-busy', 'true');

    await user.click(screen.getByRole('button', { name: 'Parar' }));
    expect(stop).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('textbox', { name: 'Pedido' }));
    await user.keyboard('{Enter}');
    expect(submit).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');
    expect(stop).toHaveBeenCalledTimes(2);
  });

  it('erro aparece como alerta e “Tentar de novo” chama onRetry', async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    render(
      <Harness
        status="error"
        error="Não foi possível gerar a resposta."
        onRetry={retry}
        initial="Encurte"
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível gerar a resposta.');
    expect(screen.getByRole('textbox', { name: 'Pedido' })).toHaveAccessibleDescription(
      /Não foi possível gerar a resposta/,
    );
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('pedidos prontos preenchem o campo ou enviam direto', async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    const presets = [{ id: 'direto', label: 'Mais direto', prompt: 'Deixe o trecho mais direto.' }];
    const { unmount } = render(<Harness presets={presets} onSubmit={submit} />);
    await user.click(screen.getByRole('button', { name: 'Mais direto' }));
    expect(screen.getByRole('textbox', { name: 'Pedido' })).toHaveValue(
      'Deixe o trecho mais direto.',
    );
    expect(submit).not.toHaveBeenCalled();
    unmount();

    render(<Harness presets={presets} presetAction="submit" onSubmit={submit} />);
    await user.click(screen.getByRole('button', { name: 'Mais direto' }));
    expect(submit).toHaveBeenCalledWith({
      text: 'Deixe o trecho mais direto.',
      presetId: 'direto',
    });
  });

  it('mostra o contador perto do limite e bloqueia o envio acima dele', () => {
    const { rerender } = render(<Harness maxLength={20} initial="curto" />);
    expect(screen.queryByText('5/20')).toBeNull();

    rerender(
      <PromptComposer
        value={'x'.repeat(17)}
        onChange={() => undefined}
        onSubmit={() => undefined}
        maxLength={20}
      />,
    );
    expect(screen.getByText('17/20')).toBeInTheDocument();

    rerender(
      <PromptComposer
        value={'x'.repeat(24)}
        onChange={() => undefined}
        onSubmit={() => undefined}
        maxLength={20}
      />,
    );
    expect(screen.getByRole('textbox', { name: 'Pedido' })).toHaveAttribute('aria-invalid', 'true');
    const send = screen.getByRole('button', { name: 'Enviar' });
    expect(send).toHaveAttribute('aria-disabled', 'true');
    expect(send).toHaveAccessibleDescription('Encurte para até 20 caracteres');
  });

  it('ref.focus() leva o foco ao campo com o cursor no fim', () => {
    const ref = createRef<PromptComposerHandle>();
    render(<Harness ref={ref} initial="Deixe mais direto" />);
    act(() => ref.current?.focus());
    const field = screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Pedido' });
    expect(field).toHaveFocus();
    expect(field.selectionStart).toBe('Deixe mais direto'.length);
  });

  it('indisponível desliga campo, pedidos prontos e Enviar', () => {
    render(<Harness disabled presets={[{ id: 'a', label: 'Mais direto', prompt: 'x' }]} />);
    expect(screen.getByRole('textbox', { name: 'Pedido' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Mais direto' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
  });
});

describe('PromptModelMenu', () => {
  it('diz o modelo atual e troca pelo menu com o teclado', async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(
      <PromptModelMenu
        value="local"
        onChange={change}
        options={[
          { value: 'local', label: 'Simulação local' },
          { value: 'rapido', label: 'Modelo rápido' },
        ]}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Modelo: Simulação local' });
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('menuitemradio', { name: /Simulação local/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await user.click(screen.getByRole('menuitemradio', { name: /Modelo rápido/ }));
    expect(change).toHaveBeenCalledWith('rapido');
  });
});
