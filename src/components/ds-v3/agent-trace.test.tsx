/**
 * `AgentTrace`: estados das etapas (sobre `ProgressSteps variant="trace"`), recolher pelo teclado,
 * tentar de novo a partir da etapa com falha, anúncio educado da troca de etapa e a linha compacta.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AgentTrace, type AgentTraceStep } from './agent-trace';
import { ProgressSteps } from './feedback';

const LABELS = [
  'Lendo material',
  'Selecionando falas-chave',
  'Montando estrutura',
  'Escrevendo introdução',
  'Escrevendo seção 2 de 3',
  'Conferindo citações',
];

function run(current: number, failAt?: number): AgentTraceStep[] {
  return LABELS.map((label, index) => ({
    id: `s${index + 1}`,
    label,
    state:
      failAt === index
        ? 'error'
        : index < current
          ? 'done'
          : index === current && failAt === undefined
            ? 'current'
            : 'upcoming',
    meta: index === 0 ? '42 falas' : undefined,
  }));
}

describe('AgentTrace', () => {
  it('lista as etapas com o estado para leitor de tela e recolhe pelo teclado', async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    render(
      <AgentTrace label="Gerando artigo" steps={run(2)} onCollapsedChange={onCollapsedChange} />,
    );

    const list = screen.getByRole('list', { name: 'Gerando artigo' });
    expect(list).toHaveAttribute('aria-busy', 'true');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(6);
    expect(items[0]).toHaveAttribute('data-state', 'done');
    expect(items[0]).toHaveTextContent('42 falas');
    expect(items[0]).toHaveTextContent('(concluído)');
    expect(items[2]).toHaveTextContent('(em andamento)');

    const toggle = screen.getByRole('button', { name: /Gerando artigo/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveTextContent('3/6');
    expect(toggle).toHaveTextContent('etapa 3 de 6');

    await user.tab();
    expect(toggle).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
    // Recolhido, o cabeçalho diz o que está rodando.
    expect(toggle).toHaveTextContent('Montando estrutura');
    await waitFor(() => expect(screen.queryByRole('list')).toBeNull());

    await user.keyboard(' ');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(onCollapsedChange).toHaveBeenLastCalledWith(false);
  });

  it('na falha mostra “Falhou” e tenta de novo a partir da etapa', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const steps = run(4, 4).map((step) =>
      step.id === 's5' ? { ...step, detail: 'O modelo não respondeu em 60 s.' } : step,
    );
    render(<AgentTrace label="Gerando artigo" steps={steps} onRetry={onRetry} />);

    const toggle = screen.getByRole('button', { name: /Gerando artigo/ });
    expect(toggle).toHaveTextContent('Falhou · Escrevendo seção 2 de 3');
    expect(screen.getByRole('list')).not.toHaveAttribute('aria-busy');
    expect(screen.getByText('O modelo não respondeu em 60 s.')).toHaveAttribute(
      'data-state',
      'error',
    );

    const retries = screen.getAllByRole('button', { name: 'Tentar de novo a partir desta etapa' });
    expect(retries).toHaveLength(1);
    await user.click(retries[0] as HTMLElement);
    expect(onRetry).toHaveBeenCalledWith('s5');
  });

  it('anuncia a troca de etapa e o fim, sem falar na primeira pintura', async () => {
    const { rerender } = render(<AgentTrace label="Gerando artigo" steps={run(1)} />);
    const region = screen.getByRole('status');
    expect(region).toHaveTextContent('');

    rerender(<AgentTrace label="Gerando artigo" steps={run(2)} />);
    await waitFor(() => expect(region).toHaveTextContent('Gerando artigo: Montando estrutura'));

    rerender(
      <AgentTrace label="Gerando artigo" steps={run(6)} summary="Concluído em 38 s · 6 etapas" />,
    );
    await waitFor(() => expect(region).toHaveTextContent('Gerando artigo: concluído'));
    expect(screen.getByRole('button', { name: /Gerando artigo/ })).toHaveTextContent(
      'Concluído em 38 s · 6 etapas',
    );
  });

  it('não anuncia quando announce={false}', async () => {
    const { rerender } = render(
      <AgentTrace label="Gerando artigo" steps={run(1)} announce={false} />,
    );
    rerender(<AgentTrace label="Gerando artigo" steps={run(2)} announce={false} />);
    await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('controlado: collapsed manda, defaultCollapsed só vale no início', async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    render(
      <AgentTrace
        label="Gerando artigo"
        steps={run(6)}
        collapsed
        onCollapsedChange={onCollapsedChange}
      />,
    );
    const toggle = screen.getByRole('button', { name: /Gerando artigo/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveTextContent('Concluído · 6 etapas');
    await user.click(toggle);
    expect(onCollapsedChange).toHaveBeenCalledWith(false);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('compacto: uma linha com a etapa atual, a posição e a ação de tentar de novo', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { rerender, container } = render(
      <AgentTrace variant="compact" label="Gerando artigo" steps={run(2)} />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-variant', 'compact');
    expect(root).toHaveTextContent('Montando estrutura');
    expect(root).toHaveTextContent('3/6');
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();

    rerender(
      <AgentTrace variant="compact" label="Gerando artigo" steps={run(4, 4)} onRetry={onRetry} />,
    );
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(onRetry).toHaveBeenCalledWith('s5');
  });

  it('compacto com preview e action: trecho numa segunda linha (não anunciado) e a ação no fim', async () => {
    const { rerender, container } = render(
      <AgentTrace
        variant="compact"
        label="Gerando artigo"
        steps={run(2)}
        preview="…o pedido pagou a primeira esteira."
        action={<a href="#abrir">Abrir</a>}
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-preview');
    const preview = screen.getByText('…o pedido pagou a primeira esteira.');
    // A posição e a ação ficam na linha de cima; o trecho fica fora dela e fora da região de aviso.
    const line = screen.getByText('3/6', { exact: false }).closest('div') as HTMLElement;
    expect(line).not.toBe(root);
    expect(line).toContainElement(screen.getByRole('link', { name: 'Abrir' }));
    expect(line).not.toContainElement(preview);
    expect(screen.getByRole('status')).not.toContainElement(preview);

    // Sem preview, a mesma linha (o spinner não remonta) e a ação continua no fim.
    rerender(
      <AgentTrace
        variant="compact"
        label="Gerando artigo"
        steps={run(6)}
        action={<a href="#abrir">Abrir</a>}
      />,
    );
    expect(root).not.toHaveAttribute('data-preview');
    expect(screen.queryByText('…o pedido pagou a primeira esteira.')).toBeNull();
    expect(line).toContainElement(screen.getByRole('link', { name: 'Abrir' }));
    expect(line).toHaveTextContent('Concluído');
  });

  it('status="stopped" vence a derivação', () => {
    render(
      <AgentTrace
        label="Gerando artigo"
        steps={run(3).map((s) => ({ ...s, state: s.state === 'current' ? 'upcoming' : s.state }))}
        status="stopped"
      />,
    );
    expect(screen.getByRole('button', { name: /Gerando artigo/ })).toHaveTextContent(
      'Interrompido',
    );
  });
});

describe('ProgressSteps', () => {
  it('linhas (padrão) mostram a meta só na concluída; trace mostra em todo estado menos “a seguir”', () => {
    const steps = [
      { label: 'Enviando', state: 'done' as const, meta: '#2041' },
      { label: 'Validando', state: 'current' as const, meta: '4 s' },
      { label: 'Publicando', state: 'upcoming' as const, meta: 'depois' },
      { label: 'Notificando', state: 'skipped' as const, meta: 'Sem contato' },
    ];
    const { rerender } = render(<ProgressSteps label="Envio" steps={steps} />);
    expect(screen.getByText('#2041')).toBeInTheDocument();
    expect(screen.queryByText('4 s')).toBeNull();
    expect(screen.getByText('(pulado)')).toBeInTheDocument();

    rerender(<ProgressSteps label="Envio" steps={steps} variant="trace" />);
    expect(screen.getByRole('list')).toHaveAttribute('data-variant', 'trace');
    expect(screen.getByText('4 s')).toBeInTheDocument();
    expect(screen.getByText('Sem contato')).toBeInTheDocument();
    expect(screen.queryByText('depois')).toBeNull();
  });
});

describe('AgentTrace: fontes da etapa (contrato do CSS)', () => {
  it('o grupo de fontes cabe na coluna do passo; cada chip corta o próprio texto', () => {
    const css = readFileSync(
      join(process.cwd(), 'src/components/ds-v3/agent-trace.module.css'),
      'utf8',
    );
    const sources = css.match(/\.sources \{([^}]*)\}/)?.[1] ?? '';
    expect(sources).toMatch(/min-width:\s*0/);
    expect(sources).toMatch(/max-width:\s*100%/);
    expect(sources).toMatch(/flex-wrap:\s*wrap/);
  });
});
