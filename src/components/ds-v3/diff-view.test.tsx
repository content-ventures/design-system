/**
 * Diferença entre versões: inserção/remoção em <ins>/<del> com texto para leitor de tela, resumo
 * calculado, sequências sem mudança recolhidas e abertas pelo teclado, lado a lado sem duplicar
 * leitura.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { DiffView, diffStats, formatDiffSummary, type DiffBlock } from './diff-view';

const BLOCKS: DiffBlock[] = [
  {
    id: 'b1',
    change: 'unchanged',
    type: 'title',
    hunks: [{ kind: 'equal', text: 'Couro vegetal chega às vitrines' }],
  },
  {
    id: 'b2',
    change: 'modified',
    hunks: [
      { kind: 'equal', text: 'A meta é chegar a ' },
      { kind: 'delete', text: '25%' },
      { kind: 'insert', text: '30%' },
      { kind: 'equal', text: ' do catálogo.' },
    ],
  },
  {
    id: 'b3',
    change: 'unchanged',
    hunks: [{ kind: 'equal', text: 'Compradores querem saber a origem.' }],
  },
  { id: 'b4', change: 'unchanged', hunks: [{ kind: 'equal', text: 'O selo já é exigência.' }] },
  {
    id: 'b5',
    change: 'added',
    type: 'h2',
    hunks: [{ kind: 'equal', text: 'O que muda para o lojista' }],
  },
  {
    id: 'b6',
    change: 'removed',
    hunks: [{ kind: 'equal', text: 'O couro vegetal ainda é caro.' }],
  },
];

describe('diffStats / formatDiffSummary', () => {
  it('conta palavras inseridas e removidas e blocos alterados', () => {
    const stats = diffStats(BLOCKS);
    expect(stats).toEqual({ inserted: 7, deleted: 7, changed: 3 });
    expect(formatDiffSummary(stats).text).toBe('+7 −7 palavras · 3 blocos');
    expect(formatDiffSummary(stats).spoken).toBe(
      '7 palavras inseridas, 7 removidas, 3 blocos alterados',
    );
    expect(formatDiffSummary({ inserted: 0, deleted: 0, changed: 0 }).text).toBe('Sem alterações');
  });
});

describe('DiffView', () => {
  it('marca inserção e remoção sem depender só de cor', () => {
    render(
      <DiffView blocks={BLOCKS} before={{ label: 'v3 · IA' }} after={{ label: 'v4 · João' }} />,
    );
    const region = screen.getByRole('region', { name: 'Diferenças entre v3 · IA e v4 · João' });
    const ins = region.querySelectorAll('ins');
    const del = region.querySelectorAll('del');
    expect(ins[0]).toHaveTextContent('Inserido: 30%');
    expect(del[0]).toHaveTextContent('Removido: 25%');
    // Bloco inteiro adicionado/removido vira um trecho só.
    expect(ins[1]).toHaveTextContent('Inserido: O que muda para o lojista');
    expect(del[1]).toHaveTextContent('Removido: O couro vegetal ainda é caro.');
    expect(
      within(region).getByText('7 palavras inseridas, 7 removidas, 3 blocos alterados'),
    ).toBeInTheDocument();
  });

  it('recolhe sequências sem mudança e abre/fecha pelo teclado', async () => {
    const user = userEvent.setup();
    render(<DiffView blocks={BLOCKS} collapseUnchanged summary={false} />);
    // b1 (início) e b3–b4 (meio) viram botões.
    const first = screen.getByRole('button', { name: 'Mostrar 1 bloco sem alteração' });
    const middle = screen.getByRole('button', { name: 'Mostrar 2 blocos sem alteração' });
    expect(middle).toHaveAttribute('aria-expanded', 'false');
    const body = document.getElementById(middle.getAttribute('aria-controls') ?? '') as HTMLElement;
    expect(body).toHaveAttribute('inert');

    middle.focus();
    await user.keyboard('{Enter}');
    expect(middle).toHaveAttribute('aria-expanded', 'true');
    expect(middle).toHaveAccessibleName('Recolher 2 blocos');
    expect(body).not.toHaveAttribute('inert');
    expect(document.activeElement).toBe(middle);

    await user.keyboard(' ');
    expect(middle).toHaveAttribute('aria-expanded', 'false');
    expect(first).toHaveAttribute('aria-expanded', 'false');
  });

  it('context mantém blocos iguais colados à mudança', () => {
    render(<DiffView blocks={BLOCKS} collapseUnchanged context={1} summary={false} />);
    // b1 fica (vizinho de b2); de b3–b4, b3 fica e b4 também (vizinho de b5): nada recolhe.
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Couro vegetal chega às vitrines')).toBeInTheDocument();
  });

  it('lado a lado: o antes de um bloco igual não é lido duas vezes', () => {
    render(
      <DiffView
        mode="split"
        blocks={BLOCKS.slice(1, 3)}
        before={{ label: 'v3 · IA' }}
        after={{ label: 'v4 · João' }}
      />,
    );
    const copies = screen.getAllByText('Compradores querem saber a origem.');
    expect(copies).toHaveLength(2);
    expect(copies[0]).toHaveAttribute('aria-hidden', 'true');
    expect(copies[1]).not.toHaveAttribute('aria-hidden');
    // No antes só a remoção; no depois só a inserção.
    const pair = copies[0]?.parentElement?.previousElementSibling as HTMLElement;
    const [left, right] = Array.from(pair.children) as HTMLElement[];
    expect(left?.querySelector('ins')).toBeNull();
    expect(right?.querySelector('del')).toBeNull();
  });

  it('carregando mostra esqueleto e esconde o resumo', () => {
    render(<DiffView blocks={[]} loading before={{ label: 'v1' }} after={{ label: 'v2' }} />);
    const region = screen.getByRole('region');
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(within(region).getByText('Carregando diferenças')).toBeInTheDocument();
    expect(within(region).queryByText(/palavras/)).toBeNull();
  });

  it('data-force chega ao botão da sequência recolhida', () => {
    render(<DiffView blocks={BLOCKS} collapseUnchanged data-force="hover" />);
    const toggles = screen.getAllByRole('button');
    toggles.forEach((toggle) => expect(toggle).toHaveAttribute('data-force', 'hover'));
    fireEvent.click(toggles[0] as HTMLElement);
    expect(toggles[0]).toHaveAttribute('aria-expanded', 'true');
  });
});
