/**
 * `Toolbar`: uma parada de Tab (tabindex itinerante), ←/→/Home/End entre os botões, Tab sai.
 * `ToolbarToggle` alterna com `aria-pressed`; indisponível continua focável e diz o motivo.
 * `keepFocus` não tira o foco do editor; `ToolbarMenu` mostra o valor e devolve o foco ao editor.
 * O que não cabe vai para “Mais”, e escolher ali aciona o botão escondido.
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Bold, Heading2, Italic, Link2, Redo2, Undo2 } from 'lucide-react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarMenu,
  ToolbarSeparator,
  ToolbarToggle,
} from './toolbar';

function Basic({ onUndo = () => {} }: { onUndo?: () => void }) {
  return (
    <>
      <button type="button">Antes</button>
      <Toolbar label="Formatação do texto">
        <ToolbarButton label="Desfazer" icon={Undo2} shortcut="⌘Z" onClick={onUndo} />
        <ToolbarButton label="Refazer" icon={Redo2} />
        <ToolbarSeparator />
        <ToolbarGroup label="Estilo do texto">
          <ToolbarToggle label="Negrito" icon={Bold} pressed={false} onPressedChange={() => {}} />
          <ToolbarToggle label="Itálico" icon={Italic} pressed onPressedChange={() => {}} />
        </ToolbarGroup>
      </Toolbar>
      <button type="button">Depois</button>
    </>
  );
}

describe('Toolbar', () => {
  it('é uma parada de Tab só; setas, Home e End andam e dão a volta', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const toolbar = screen.getByRole('toolbar', { name: 'Formatação do texto' });
    const undo = within(toolbar).getByRole('button', { name: 'Desfazer' });
    const redo = within(toolbar).getByRole('button', { name: 'Refazer' });
    const bold = within(toolbar).getByRole('button', { name: 'Negrito' });
    const italic = within(toolbar).getByRole('button', { name: 'Itálico' });
    expect(undo).toHaveAttribute('tabindex', '0');
    expect(redo).toHaveAttribute('tabindex', '-1');

    screen.getByRole('button', { name: 'Antes' }).focus();
    await user.tab();
    expect(undo).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(redo).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(bold).toHaveFocus();
    await user.keyboard('{End}');
    expect(italic).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(undo).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(italic).toHaveFocus();
    await user.keyboard('{Home}');
    expect(undo).toHaveFocus();

    // A parada acompanha o último foco; Tab sai da barra.
    await user.keyboard('{ArrowRight}');
    expect(redo).toHaveAttribute('tabindex', '0');
    expect(undo).toHaveAttribute('tabindex', '-1');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Depois' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(redo).toHaveFocus();
  });

  it('o separador é um fio sem foco, na orientação certa', () => {
    render(<Basic />);
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
    expect(screen.getByRole('group', { name: 'Estilo do texto' })).toBeInTheDocument();
  });

  it('alterna pelo teclado e informa o estado', async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(
      <Toolbar label="Formatação">
        <ToolbarToggle
          label="Negrito"
          icon={Bold}
          shortcut="⌘B"
          pressed={false}
          onPressedChange={change}
        />
      </Toolbar>,
    );
    const bold = screen.getByRole('button', { name: 'Negrito' });
    expect(bold).toHaveAttribute('aria-pressed', 'false');
    await user.tab();
    await user.keyboard('{Enter}');
    expect(change).toHaveBeenCalledWith(true);
  });

  it('indisponível continua focável, não executa e diz o motivo', async () => {
    const user = userEvent.setup();
    const click = vi.fn();
    render(
      <Toolbar label="Formatação">
        <ToolbarButton label="Desfazer" icon={Undo2} />
        <ToolbarButton
          label="Link"
          icon={Link2}
          disabled
          disabledReason="Selecione um trecho para criar link"
          onClick={click}
        />
      </Toolbar>,
    );
    const link = screen.getByRole('button', { name: 'Link' });
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAccessibleDescription('Selecione um trecho para criar link');
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(link).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.click(link);
    expect(click).not.toHaveBeenCalled();
  });

  it('keepFocus: o clique executa sem tirar o foco do editor', async () => {
    const user = userEvent.setup();
    const bold = vi.fn();
    render(
      <>
        <textarea aria-label="Texto do artigo" defaultValue="Couro vegetal" />
        <Toolbar label="Formatação" keepFocus>
          <ToolbarButton label="Negrito" icon={Bold} onClick={bold} />
        </Toolbar>
      </>,
    );
    const editor = screen.getByRole('textbox', { name: 'Texto do artigo' });
    editor.focus();
    const button = screen.getByRole('button', { name: 'Negrito' });
    expect(fireEvent.mouseDown(button)).toBe(false);
    await user.click(button);
    expect(bold).toHaveBeenCalledTimes(1);
    expect(editor).toHaveFocus();
  });

  it('ToolbarMenu mostra o valor, abre pelo teclado e devolve o foco ao editor', async () => {
    const user = userEvent.setup();
    const pick = vi.fn();
    render(
      <>
        <textarea aria-label="Texto do artigo" defaultValue="Couro vegetal" />
        <Toolbar label="Formatação" keepFocus>
          <ToolbarMenu
            label="Estilo do parágrafo"
            value="Texto"
            sections={[
              {
                items: [
                  { label: 'Texto', checked: true },
                  { label: 'Intertítulo', icon: Heading2, checked: false, onSelect: pick },
                ],
              },
            ]}
          />
        </Toolbar>
      </>,
    );
    const trigger = screen.getByRole('button', { name: 'Estilo do parágrafo: Texto' });
    expect(trigger).toHaveTextContent('Texto');
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');

    // Pelo teclado: ↓ abre no item marcado; escolher fecha e o foco volta ao gatilho.
    act(() => trigger.focus());
    await user.keyboard('{ArrowDown}');
    const menu = await screen.findByRole('menu', { name: 'Estilo do parágrafo' });
    expect(menu).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();

    // Pelo ponteiro, com o editor focado: escolher devolve o foco ao editor.
    const editor = screen.getByRole('textbox', { name: 'Texto do artigo' });
    editor.focus();
    await user.click(trigger);
    await user.click(await screen.findByRole('menuitemradio', { name: 'Intertítulo' }));
    expect(pick).toHaveBeenCalledTimes(1);
    await act(async () => {
      await Promise.resolve();
    });
    expect(editor).toHaveFocus();
  });
});

describe('Toolbar · Mais', () => {
  const ITEM = 40;
  const descriptors: PropertyDescriptor[] = [];

  /** Largura fixa da barra; cada item ou “Mais” visível ocupa 40 px. */
  function mockLayout(width: number) {
    const proto = HTMLElement.prototype;
    descriptors.push(
      Object.getOwnPropertyDescriptor(proto, 'clientWidth') ?? { value: 0, configurable: true },
      Object.getOwnPropertyDescriptor(proto, 'scrollWidth') ?? { value: 0, configurable: true },
    );
    Object.defineProperty(proto, 'clientWidth', {
      configurable: true,
      get(this: HTMLElement) {
        return this.getAttribute('role') === 'toolbar' ? width : 0;
      },
    });
    Object.defineProperty(proto, 'scrollWidth', {
      configurable: true,
      get(this: HTMLElement) {
        if (this.getAttribute('role') !== 'toolbar') return 0;
        const visible = this.querySelectorAll(
          '[data-toolbar-leaf="item"]:not([data-overflowed]), [data-toolbar-more]:not([data-overflowed])',
        ).length;
        return visible * ITEM;
      },
    });
  }

  afterEach(() => {
    const proto = HTMLElement.prototype;
    const [client, scroll] = descriptors.splice(0);
    if (client) Object.defineProperty(proto, 'clientWidth', client);
    if (scroll) Object.defineProperty(proto, 'scrollWidth', scroll);
  });

  it('esconde do fim, mantém `keep`, e o “Mais” aciona o botão escondido', async () => {
    mockLayout(130);
    const user = userEvent.setup();
    const italic = vi.fn();
    render(
      <Toolbar label="Formatação">
        <ToolbarButton label="Desfazer" icon={Undo2} />
        <ToolbarSeparator />
        <ToolbarButton label="Negrito" icon={Bold} />
        <ToolbarButton label="Itálico" icon={Italic} onClick={italic} />
        <ToolbarButton label="Link" icon={Link2} keep />
      </Toolbar>,
    );
    // 130 px: Desfazer + Link (keep) + Mais = 120.
    const more = screen.getByRole('button', { name: 'Mais' });
    expect(
      screen.getByRole('button', { name: 'Negrito' }).closest('[data-toolbar-leaf]'),
    ).toHaveAttribute('data-overflowed');
    expect(
      screen.getByRole('button', { name: 'Link' }).closest('[data-toolbar-leaf]'),
    ).not.toHaveAttribute('data-overflowed');

    // “Mais” entra na ordem das setas.
    await user.tab();
    await user.keyboard('{End}');
    expect(more).toHaveFocus();

    await user.click(more);
    const menu = await screen.findByRole('menu', { name: 'Mais' });
    expect(within(menu).getByRole('menuitem', { name: 'Negrito' })).toBeInTheDocument();
    await user.click(within(menu).getByRole('menuitem', { name: 'Itálico' }));
    expect(italic).toHaveBeenCalledTimes(1);
  });

  it('sem espaço nem para os `keep`, eles também saem e o “Mais” fica visível', () => {
    mockLayout(70);
    render(
      <Toolbar label="Formatação">
        <ToolbarButton label="Desfazer" icon={Undo2} />
        <ToolbarButton label="Negrito" icon={Bold} keep />
      </Toolbar>,
    );
    const more = screen.getByRole('button', { name: 'Mais' });
    expect(more.closest('[data-toolbar-more]')).not.toHaveAttribute('data-overflowed');
    expect(document.querySelectorAll('[data-toolbar-leaf][data-overflowed]')).toHaveLength(2);
  });

  it('com espaço, nada vai para “Mais”', () => {
    mockLayout(400);
    render(
      <Toolbar label="Formatação">
        <ToolbarButton label="Desfazer" icon={Undo2} />
        <ToolbarButton label="Negrito" icon={Bold} />
      </Toolbar>,
    );
    const more = screen.getByRole('button', { name: 'Mais', hidden: true });
    expect(more.closest('[data-toolbar-more]')).toHaveAttribute('data-overflowed');
    expect(document.querySelectorAll('[data-toolbar-leaf][data-overflowed]')).toHaveLength(0);
  });
});

describe('Toolbar end', () => {
  it('encosta o estado do documento à direita, fora do roving: Tab passa da barra para ele', async () => {
    const user = userEvent.setup();
    render(
      <Toolbar label="Formatação" end={<button type="button">v2</button>}>
        <ToolbarButton label="Negrito" icon={Bold} />
        <ToolbarButton label="Itálico" icon={Italic} />
      </Toolbar>,
    );
    const end = screen.getByRole('button', { name: 'v2' });
    expect(end.closest('[data-toolbar-end]')).not.toBeNull();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Negrito' })).toHaveFocus();
    await user.tab();
    expect(end).toHaveFocus();
  });
});
