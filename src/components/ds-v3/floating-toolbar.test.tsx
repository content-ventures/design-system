/**
 * `FloatingToolbar`: não rouba o foco do texto; fica acima do trecho e vira para baixo sem espaço;
 * Escape e clique fora pedem para fechar; Alt+F10 leva o foco à barra, as setas andam entre os
 * botões e Escape devolve o foco ao texto.
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Bold, Italic, Scissors } from 'lucide-react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { FloatingToolbar, type FloatingToolbarDismissReason } from './floating-toolbar';
import { ToolbarButton, ToolbarToggle } from './toolbar';

const rect = (top: number, left = 100, width = 120, height = 20) =>
  ({
    top,
    left,
    width,
    height,
    bottom: top + height,
    right: left + width,
    x: left,
    y: top,
    toJSON: () => ({}),
  }) as DOMRect;

function Selection({
  anchorTop = 300,
  onDismiss = () => {},
  initialOpen = true,
}: {
  anchorTop?: number;
  onDismiss?: (reason: FloatingToolbarDismissReason) => void;
  initialOpen?: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);
  const [bold, setBold] = useState(false);
  return (
    <>
      <textarea
        aria-label="Texto do artigo"
        defaultValue="Rastreabilidade vira argumento de venda"
      />
      <button type="button">Fora</button>
      <FloatingToolbar
        open={open}
        label="Seleção"
        anchor={() => rect(anchorTop)}
        onDismiss={(reason) => {
          onDismiss(reason);
          setOpen(false);
        }}
      >
        <ToolbarToggle label="Negrito" icon={Bold} pressed={bold} onPressedChange={setBold} />
        <ToolbarButton label="Itálico" icon={Italic} />
        <ToolbarButton label="Encurtar" icon={Scissors} showLabel />
      </FloatingToolbar>
    </>
  );
}

describe('FloatingToolbar', () => {
  it('fechada não monta nada', () => {
    render(<Selection initialOpen={false} />);
    expect(screen.queryByRole('toolbar')).toBeNull();
  });

  it('abre sem tirar o foco do texto e acima do trecho', async () => {
    const user = userEvent.setup();
    render(<Selection />);
    const editor = screen.getByRole('textbox', { name: 'Texto do artigo' });
    act(() => editor.focus());
    const toolbar = await screen.findByRole('toolbar', { name: 'Seleção' });
    expect(editor).toHaveFocus();

    const panel = toolbar.parentElement as HTMLElement;
    expect(panel).toHaveAttribute('data-side', 'top');
    // jsdom não mede: altura 0, então o topo fica a 8 px acima do trecho.
    expect(panel.style.top).toBe('292px');

    // Clique num botão executa e o foco continua no texto.
    await user.click(within(toolbar).getByRole('button', { name: 'Negrito' }));
    expect(within(toolbar).getByRole('button', { name: 'Negrito' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(editor).toHaveFocus();
  });

  it('`follow`: o trecho que cresce sem rolagem leva a barra junto', async () => {
    let top = 300;
    render(
      <FloatingToolbar open follow label="Sugestão" placement="bottom" anchor={() => rect(top)}>
        <ToolbarButton label="Aceitar" icon={Bold} showLabel />
      </FloatingToolbar>,
    );
    const panel = (await screen.findByRole('toolbar', { name: 'Sugestão' }))
      .parentElement as HTMLElement;
    expect(panel.style.top).toBe('328px');
    // O parágrafo ganhou uma linha (um widget entrou nele): nenhum evento de rolagem acontece.
    top = 340;
    await act(
      () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
    );
    expect(panel.style.top).toBe('368px');
  });

  it('sem espaço acima, vira para baixo', async () => {
    render(<Selection anchorTop={4} />);
    const panel = (await screen.findByRole('toolbar')).parentElement as HTMLElement;
    expect(panel).toHaveAttribute('data-side', 'bottom');
    expect(panel.style.top).toBe('32px');
  });

  it('Escape pede para fechar', async () => {
    const user = userEvent.setup();
    const dismiss = vi.fn();
    render(<Selection onDismiss={dismiss} />);
    act(() => screen.getByRole('textbox').focus());
    await screen.findByRole('toolbar');
    await user.keyboard('{Escape}');
    expect(dismiss).toHaveBeenCalledWith('escape');
  });

  it('clique fora pede para fechar; dentro, não', async () => {
    const dismiss = vi.fn();
    render(<Selection onDismiss={dismiss} />);
    const toolbar = await screen.findByRole('toolbar');
    fireEvent.pointerDown(within(toolbar).getByRole('button', { name: 'Itálico' }));
    expect(dismiss).not.toHaveBeenCalled();
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Fora' }));
    expect(dismiss).toHaveBeenCalledWith('outside');
  });

  it('Alt+F10 leva o foco à barra; setas andam; Escape devolve ao texto', async () => {
    const user = userEvent.setup();
    const dismiss = vi.fn();
    render(<Selection onDismiss={dismiss} />);
    const editor = screen.getByRole('textbox', { name: 'Texto do artigo' });
    act(() => editor.focus());
    const toolbar = await screen.findByRole('toolbar');
    const bold = within(toolbar).getByRole('button', { name: 'Negrito' });
    const italic = within(toolbar).getByRole('button', { name: 'Itálico' });
    const shorten = within(toolbar).getByRole('button', { name: 'Encurtar' });

    await user.keyboard('{Alt>}{F10}{/Alt}');
    expect(bold).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(italic).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(shorten).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(bold).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(editor).toHaveFocus();
    expect(dismiss).toHaveBeenCalledWith('escape');
  });

  it('prancha: parada no fluxo, sem portal', () => {
    render(
      <FloatingToolbar open label="Seleção" anchor={() => null} pinned>
        <ToolbarButton label="Negrito" icon={Bold} />
      </FloatingToolbar>,
    );
    const panel = screen.getByRole('toolbar').parentElement as HTMLElement;
    expect(panel).toHaveAttribute('data-static');
  });
});
