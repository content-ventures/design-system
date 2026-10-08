/**
 * `WorkspaceLayout`: alças com o teclado do separador (inclusive o painel de fim, que cresce para a
 * esquerda), recolher no trilho e reabrir, memória neste navegador, F6 entre regiões, modo foco
 * que não mexe na preferência, e abas no modo estreito sem desmontar as regiões.
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ResizablePanels } from './structure';
import { WorkspaceLayout, WorkspaceToggle, type WorkspaceLayoutProps } from './workspace-layout';

/* jsdom não mede nem tem PointerEvent: largura fixa por teste e um PointerEvent mínimo. */
let frameWidth = 1400;
beforeEach(() => {
  frameWidth = 1400;
  localStorage.clear();
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    () =>
      ({
        width: frameWidth,
        height: 720,
        top: 0,
        left: 0,
        right: frameWidth,
        bottom: 720,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect,
  );
  if (!('PointerEvent' in window)) {
    class PointerEventShim extends MouseEvent {
      pointerId: number;
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.pointerId = init.pointerId ?? 1;
      }
    }
    vi.stubGlobal('PointerEvent', PointerEventShim);
  }
});
afterEach(() => {
  vi.restoreAllMocks();
});

/** Os quadros de animação rodam na hora (foco que segue a ação). */
function flushFrames() {
  return act(async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 40));
  });
}

function Studio(props: Partial<WorkspaceLayoutProps>) {
  return (
    <WorkspaceLayout
      height={720}
      mainLabel="Texto"
      header={
        <div>
          <WorkspaceToggle side="start" />
          <button type="button">Enviar para aprovação</button>
          <WorkspaceToggle side="end" />
        </div>
      }
      start={{
        label: 'Fonte',
        defaultSize: 320,
        min: 240,
        max: 480,
        content: <button type="button">Clara Souto · 12:48</button>,
      }}
      end={{
        label: 'Copiloto',
        defaultSize: 380,
        min: 320,
        max: 560,
        content: <button type="button">Sugerir intertítulos</button>,
      }}
      {...props}
    >
      <p>Couro vegetal sai do nicho e chega às vitrines da Francal 2026</p>
    </WorkspaceLayout>
  );
}

describe('WorkspaceLayout — largo', () => {
  it('desenha três regiões nomeadas e duas alças com a largura de cada painel', () => {
    render(<Studio />);
    expect(screen.getByRole('group', { name: 'Fonte' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Texto' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Copiloto' })).toBeInTheDocument();
    const start = screen.getByRole('separator', { name: 'Redimensionar Fonte' });
    const end = screen.getByRole('separator', { name: 'Redimensionar Copiloto' });
    expect(start).toHaveAttribute('aria-valuenow', '320');
    expect(start).toHaveAttribute('aria-orientation', 'vertical');
    expect(start).toHaveAttribute('aria-controls', screen.getByRole('group', { name: 'Fonte' }).id);
    expect(end).toHaveAttribute('aria-valuenow', '380');
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('teclado na alça: setas (fim cresce para a esquerda), Shift ×4, Home/End e memória', async () => {
    const user = userEvent.setup();
    const sizes: number[] = [];
    render(
      <Studio
        storageKey="studio-artigo"
        end={undefined}
        start={{
          label: 'Fonte',
          defaultSize: 320,
          min: 240,
          max: 480,
          content: 'Transcrição',
          onSizeChange: (size) => sizes.push(size),
        }}
      />,
    );
    const start = screen.getByRole('separator', { name: 'Redimensionar Fonte' });
    start.focus();
    await user.keyboard('{ArrowRight}');
    expect(start).toHaveAttribute('aria-valuenow', '336');
    await user.keyboard('{Shift>}{ArrowLeft}{/Shift}');
    expect(start).toHaveAttribute('aria-valuenow', '272');
    await user.keyboard('{End}');
    expect(start).toHaveAttribute('aria-valuenow', '480');
    await user.keyboard('{Home}');
    expect(start).toHaveAttribute('aria-valuenow', '240');
    expect(sizes).toEqual([336, 272, 480, 240]);
    expect(JSON.parse(localStorage.getItem('studio-artigo:start') ?? '{}')).toEqual({
      size: 240,
      collapsed: false,
    });
  });

  it('o painel de fim cresce com ← e encolhe com →', async () => {
    const user = userEvent.setup();
    render(<Studio />);
    const end = screen.getByRole('separator', { name: 'Redimensionar Copiloto' });
    end.focus();
    await user.keyboard('{ArrowLeft}');
    expect(end).toHaveAttribute('aria-valuenow', '396');
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(end).toHaveAttribute('aria-valuenow', '364');
  });

  it('Enter recolhe no trilho; o botão do trilho reabre e leva o foco ao painel', async () => {
    const user = userEvent.setup();
    const changes: boolean[] = [];
    render(
      <Studio
        start={{
          label: 'Fonte',
          content: <button type="button">Clara Souto · 12:48</button>,
          onCollapsedChange: (value) => changes.push(value),
        }}
      />,
    );
    const handle = screen.getByRole('separator', { name: 'Redimensionar Fonte' });
    handle.focus();
    await user.keyboard('{Enter}');
    expect(handle).toHaveAttribute('aria-valuenow', '0');
    expect(handle).toHaveAttribute('aria-valuetext', 'Recolhido');
    const pane = document.getElementById(handle.getAttribute('aria-controls') ?? '');
    expect(pane).toHaveAttribute('inert');

    const reopen = screen.getAllByRole('button', { name: 'Mostrar Fonte' });
    // Trilho + botão do cabeçalho: os dois dizem que o painel está fechado.
    expect(reopen).toHaveLength(2);
    reopen.forEach((button) => expect(button).toHaveAttribute('aria-expanded', 'false'));
    const rail = reopen.find((button) => button.closest('[data-ws-stop="rail"]'));
    await user.click(rail!);
    await flushFrames();
    expect(pane).not.toHaveAttribute('inert');
    expect(pane).toHaveFocus();
    expect(changes).toEqual([true, false]);
  });

  it('o botão do cabeçalho recolhe e mostra o painel', async () => {
    const user = userEvent.setup();
    render(<Studio />);
    const toggle = screen.getByRole('button', { name: 'Recolher Copiloto' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.click(toggle);
    expect(screen.getAllByRole('button', { name: 'Mostrar Copiloto' })).toHaveLength(2);
    expect(screen.getByRole('separator', { name: 'Redimensionar Copiloto' })).toHaveAttribute(
      'aria-valuenow',
      '0',
    );
  });

  it('arrastar a alça redimensiona e, abaixo do mínimo, recolhe', () => {
    render(<Studio storageKey="studio-drag" />);
    const handle = screen.getByRole('separator', { name: 'Redimensionar Fonte' });
    fireEvent.pointerDown(handle, { button: 0, clientX: 320, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 400, pointerId: 1 });
    expect(handle).toHaveAttribute('aria-valuenow', '400');
    expect(handle).toHaveAttribute('data-dragging');
    fireEvent.pointerUp(handle, { clientX: 400, pointerId: 1 });
    expect(handle).not.toHaveAttribute('data-dragging');
    expect(JSON.parse(localStorage.getItem('studio-drag:start') ?? '{}')).toEqual({
      size: 400,
      collapsed: false,
    });

    fireEvent.pointerDown(handle, { button: 0, clientX: 400, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 100, pointerId: 1 });
    expect(handle).toHaveAttribute('aria-valuetext', 'Recolhido');
    fireEvent.pointerUp(handle, { clientX: 100, pointerId: 1 });
    // Recolhido pelo arrasto, lembra a largura de antes para reabrir como estava.
    expect(JSON.parse(localStorage.getItem('studio-drag:start') ?? '{}')).toEqual({
      size: 400,
      collapsed: true,
    });
  });

  it('restaura largura e recolhimento guardados', () => {
    localStorage.setItem('studio-salvo:start', JSON.stringify({ size: 288, collapsed: false }));
    localStorage.setItem('studio-salvo:end', JSON.stringify({ size: 420, collapsed: true }));
    render(<Studio storageKey="studio-salvo" />);
    expect(screen.getByRole('separator', { name: 'Redimensionar Fonte' })).toHaveAttribute(
      'aria-valuenow',
      '288',
    );
    expect(screen.getByRole('separator', { name: 'Redimensionar Copiloto' })).toHaveAttribute(
      'aria-valuetext',
      'Recolhido',
    );
  });

  it('F6 e Shift+F6 percorrem cabeçalho, painéis e tela; painel recolhido entra pelo trilho', async () => {
    const user = userEvent.setup();
    render(<Studio end={{ label: 'Copiloto', content: 'IA', defaultCollapsed: true }} />);
    screen.getByRole('button', { name: 'Enviar para aprovação' }).focus();
    await user.keyboard('{F6}');
    expect(screen.getByRole('group', { name: 'Fonte' })).toHaveFocus();
    await user.keyboard('{F6}');
    expect(screen.getByRole('group', { name: 'Texto' })).toHaveFocus();
    await user.keyboard('{F6}');
    const rail = screen
      .getAllByRole('button', { name: 'Mostrar Copiloto' })
      .find((button) => button.closest('[data-ws-stop="rail"]'));
    expect(rail).toHaveFocus();
    await user.keyboard('{F6}');
    expect(document.activeElement?.getAttribute('data-ws-stop')).toBe('header');
    await user.keyboard('{Shift>}{F6}{/Shift}');
    expect(rail).toHaveFocus();
  });

  it('F6 a partir de uma alça segue para a região seguinte (Shift+F6 volta para a anterior)', async () => {
    const user = userEvent.setup();
    render(<Studio />);
    screen.getByRole('separator', { name: 'Redimensionar Fonte' }).focus();
    await user.keyboard('{F6}');
    expect(screen.getByRole('group', { name: 'Texto' })).toHaveFocus();
    screen.getByRole('separator', { name: 'Redimensionar Copiloto' }).focus();
    await user.keyboard('{Shift>}{F6}{/Shift}');
    expect(screen.getByRole('group', { name: 'Texto' })).toHaveFocus();
  });

  it('modo foco recolhe os dois sem mudar a preferência; reabrir é só espiar; Escape sai', async () => {
    const user = userEvent.setup();
    const exits: boolean[] = [];
    function Focused() {
      const [focus, setFocus] = useState(true);
      return (
        <Studio
          storageKey="studio-foco"
          focus={focus}
          onFocusChange={(next) => {
            exits.push(next);
            setFocus(next);
          }}
        />
      );
    }
    render(<Focused />);
    expect(screen.getByRole('separator', { name: 'Redimensionar Fonte' })).toHaveAttribute(
      'aria-valuetext',
      'Recolhido',
    );
    expect(screen.getByRole('separator', { name: 'Redimensionar Copiloto' })).toHaveAttribute(
      'aria-valuetext',
      'Recolhido',
    );
    const rail = screen
      .getAllByRole('button', { name: 'Mostrar Fonte' })
      .find((button) => button.closest('[data-ws-stop="rail"]'));
    await user.click(rail!);
    expect(screen.getByRole('separator', { name: 'Redimensionar Fonte' })).toHaveAttribute(
      'aria-valuenow',
      '320',
    );
    expect(JSON.parse(localStorage.getItem('studio-foco:start') ?? '{}')).toEqual({
      size: 320,
      collapsed: false,
    });

    screen.getByRole('button', { name: 'Enviar para aprovação' }).focus();
    await user.keyboard('{Escape}');
    expect(exits).toEqual([false]);
    expect(screen.getByRole('separator', { name: 'Redimensionar Copiloto' })).toHaveAttribute(
      'aria-valuenow',
      '380',
    );
  });
});

describe('WorkspaceLayout — estreito', () => {
  it('vira abas, abre na tela principal e troca de região sem desmontar', async () => {
    frameWidth = 800;
    const user = userEvent.setup();
    render(<Studio />);
    const tabs = screen.getByRole('tablist', { name: 'Painéis' });
    const [fonte, texto, copiloto] = within(tabs).getAllByRole('tab');
    expect(fonte).toHaveTextContent('Fonte');
    expect(texto).toHaveAttribute('aria-selected', 'true');
    expect(copiloto).toHaveTextContent('Copiloto');
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Recolher|Mostrar/ })).not.toBeInTheDocument();
    expect(screen.getByRole('tabpanel', { name: 'Texto' })).toBeInTheDocument();

    const source = screen.getByRole('button', { name: 'Clara Souto · 12:48', hidden: true });
    await user.click(fonte!);
    expect(screen.getByRole('tabpanel', { name: 'Fonte' })).toContainElement(source);
    expect(screen.getByRole('button', { name: 'Clara Souto · 12:48' })).toBe(source);
    // A tela principal continua montada (só fica fora de alcance): nada se perde ao trocar de aba.
    const article = screen.getByText(/Couro vegetal sai do nicho/);
    expect(article.closest('[role="tabpanel"]')).toHaveAttribute('inert');

    await user.keyboard('{ArrowRight}');
    expect(texto).toHaveAttribute('aria-selected', 'true');
  });

  it('tela única (sem painéis): nem abas nem painel de aba, só a região nomeada', () => {
    frameWidth = 800;
    render(
      <WorkspaceLayout height={720} mainLabel="Material" header={<h1>Produção</h1>}>
        <p>Transcrição</p>
      </WorkspaceLayout>,
    );
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
    expect(screen.getByText('Transcrição')).toBeVisible();
    expect(screen.getByRole('group', { name: 'Material' })).toBeInTheDocument();
  });

  it('view controlado avisa a troca', async () => {
    frameWidth = 600;
    const user = userEvent.setup();
    const views: string[] = [];
    render(<Studio view="end" onViewChange={(next) => views.push(next)} />);
    expect(screen.getByRole('tab', { name: 'Copiloto' })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('tab', { name: 'Fonte' }));
    expect(views).toEqual(['start']);
    expect(screen.getByRole('tab', { name: 'Copiloto' })).toHaveAttribute('aria-selected', 'true');
  });
});

describe('ResizablePanels — mesma alça', () => {
  it('setas, Enter recolhe e o foco vai para “Mostrar lista”; memória continua', async () => {
    frameWidth = 1000;
    const user = userEvent.setup();
    render(
      <ResizablePanels
        storageKey="leads-split"
        defaultSize={320}
        min={240}
        max={480}
        left={<p>Leads</p>}
        right={<p>Detalhe</p>}
      />,
    );
    const handle = screen.getByRole('separator', { name: 'Redimensionar painéis' });
    handle.focus();
    await user.keyboard('{ArrowRight}');
    expect(handle).toHaveAttribute('aria-valuenow', '336');
    await user.keyboard('{Enter}');
    await flushFrames();
    expect(handle).toHaveAttribute('aria-valuetext', 'Recolhido');
    expect(screen.getByRole('button', { name: 'Mostrar lista' })).toHaveFocus();
    expect(JSON.parse(localStorage.getItem('leads-split') ?? '{}')).toEqual({
      size: 336,
      collapsed: true,
    });
  });
});
