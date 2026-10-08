/**
 * Sugestão da IA: ações por estado, atalhos ⌘↵/Esc com o foco dentro, avaliação 👍/👎 com nota,
 * alternativas escolhíveis por rádio nativo, barra presa ao trecho e foco que não se perde quando
 * a decisão tira o botão da tela.
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { DiffBlock } from './diff-view';
import {
  SuggestionBar,
  SuggestionCard,
  SuggestionGroup,
  type SuggestionState,
} from './suggestion-card';

const DIFF: DiffBlock[] = [
  {
    id: 'p3',
    change: 'modified',
    hunks: [
      { kind: 'delete', text: 'Segundo Clara Souto, diretora de produto, a meta' },
      { kind: 'insert', text: 'A meta, diz Clara Souto,' },
      { kind: 'equal', text: ' é chegar a 30% do catálogo até 2027.' },
    ],
  },
];

const base = {
  title: 'Reescrever · mais direto',
  provenance: ['Prompt edição v2', 'Simulação local', { value: '3 s', numeric: true }],
};

describe('SuggestionCard', () => {
  it('pronta: Aceitar, Inserir abaixo, Descartar, Tentar de novo e Editar chamam cada callback', async () => {
    const user = userEvent.setup();
    const calls = {
      onAccept: vi.fn(),
      onInsert: vi.fn(),
      onDiscard: vi.fn(),
      onRetry: vi.fn(),
      onEdit: vi.fn(),
    };
    render(<SuggestionCard {...base} diff={DIFF} {...calls} />);

    const card = screen.getByRole('article', { name: 'Sugestão: Reescrever · mais direto' });
    expect(within(card).getByRole('group', { name: 'Origem da sugestão' })).toHaveTextContent(
      'Prompt edição v2',
    );
    expect(card.querySelector('ins')).toHaveTextContent('Inserido: A meta, diz Clara Souto,');

    await user.click(within(card).getByRole('button', { name: /^Aceitar/ }));
    await user.click(within(card).getByRole('button', { name: 'Inserir abaixo' }));
    await user.click(within(card).getByRole('button', { name: /^Descartar/ }));
    await user.click(within(card).getByRole('button', { name: 'Tentar de novo' }));
    await user.click(within(card).getByRole('button', { name: 'Editar sugestão' }));
    Object.values(calls).forEach((fn) => expect(fn).toHaveBeenCalledTimes(1));
    expect(within(card).getByRole('button', { name: /^Aceitar/ })).toHaveAttribute(
      'aria-keyshortcuts',
      'Meta+Enter Control+Enter',
    );
  });

  it('⌘↵ / Ctrl+↵ aceita e Esc descarta com o foco dentro do cartão', async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    const onDiscard = vi.fn();
    render(
      <SuggestionCard {...base} proposal="Texto novo" onAccept={onAccept} onDiscard={onDiscard} />,
    );
    act(() => screen.getByRole('button', { name: /^Descartar/ }).focus());
    await user.keyboard('{Meta>}{Enter}{/Meta}');
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onAccept).toHaveBeenCalledTimes(2);
    await user.keyboard('{Escape}');
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it('gerando: esqueleto, Aceitar indisponível (sem atalho) e Descartar ativo', async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    const onDiscard = vi.fn();
    render(
      <SuggestionCard {...base} state="streaming" onAccept={onAccept} onDiscard={onDiscard} />,
    );
    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('aria-busy', 'true');
    expect(within(card).getByText('Gerando sugestão')).toBeInTheDocument();
    const accept = within(card).getByRole('button', { name: 'Aceitar' });
    expect(accept).toHaveAttribute('aria-disabled', 'true');
    await user.click(accept);
    act(() => accept.focus());
    await user.keyboard('{Meta>}{Enter}{/Meta}');
    expect(onAccept).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it('modo inserir: a ação principal é Inserir abaixo', async () => {
    const user = userEvent.setup();
    const onInsert = vi.fn();
    render(
      <SuggestionCard {...base} mode="insert" proposal="Parágrafo novo" onInsert={onInsert} />,
    );
    await user.click(screen.getByRole('button', { name: /^Inserir abaixo/ }));
    expect(onInsert).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: /^Aceitar/ })).toBeNull();
  });

  it('trecho mudou: status + Reaplicar (⌘↵); sem Aceitar', async () => {
    const user = userEvent.setup();
    const onReapply = vi.fn();
    render(
      <SuggestionCard
        {...base}
        state="stale"
        proposal="Texto"
        onAccept={vi.fn()}
        onReapply={onReapply}
      />,
    );
    expect(screen.getByText('Trecho mudou')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Aceitar/ })).toBeNull();
    act(() => screen.getByRole('button', { name: /^Reaplicar/ }).focus());
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onReapply).toHaveBeenCalledTimes(1);
  });

  it('erro: motivo + Tentar de novo; descartada recolhe o corpo', () => {
    const onRetry = vi.fn();
    const { rerender } = render(
      <SuggestionCard
        {...base}
        state="error"
        error="A conexão caiu."
        proposal="Parcial"
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText('A conexão caiu.')).toBeInTheDocument();
    expect(screen.getByText('Falhou')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    rerender(<SuggestionCard {...base} state="discarded" proposal="Parcial" onRetry={onRetry} />);
    expect(screen.getByText('Descartada')).toBeInTheDocument();
    expect(screen.queryByText('Parcial')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('avaliação alterna, desmarca e pede nota no 👎', async () => {
    const user = userEvent.setup();
    const onFeedback = vi.fn();
    const onFeedbackNote = vi.fn();
    render(
      <SuggestionCard
        {...base}
        state="applied"
        proposal="Texto"
        onFeedback={onFeedback}
        onFeedbackNote={onFeedbackNote}
      />,
    );
    const up = screen.getByRole('button', { name: 'Marcar como útil' });
    await user.click(up);
    expect(up).toHaveAttribute('aria-pressed', 'true');
    await user.click(up);
    expect(up).toHaveAttribute('aria-pressed', 'false');
    expect(onFeedback.mock.calls).toEqual([['up'], [null]]);

    await user.click(screen.getByRole('button', { name: 'Marcar como ruim' }));
    const note = screen.getByRole('textbox', { name: 'Nota sobre a sugestão' });
    expect(note).toHaveFocus();
    await user.type(note, 'Perdeu a citação{Enter}');
    expect(onFeedbackNote).toHaveBeenCalledWith('Perdeu a citação');
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('Esc na nota fecha a nota sem descartar', async () => {
    const user = userEvent.setup();
    const onDiscard = vi.fn();
    render(
      <SuggestionCard
        {...base}
        proposal="Texto"
        onDiscard={onDiscard}
        onFeedback={vi.fn()}
        onFeedbackNote={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Marcar como ruim' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(onDiscard).not.toHaveBeenCalled();
  });

  it('decisão que tira o botão da tela devolve o foco ao cartão', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [state, setState] = useState<SuggestionState>('ready');
      return (
        <SuggestionCard
          {...base}
          state={state}
          proposal="Texto"
          onAccept={() => setState('applied')}
        />
      );
    }
    render(<Harness />);
    act(() => screen.getByRole('button', { name: /^Aceitar/ }).focus());
    await user.keyboard('{Enter}');
    expect(screen.getByText('Aplicada')).toBeInTheDocument();
    expect(screen.getByRole('article')).toHaveFocus();
  });
});

describe('SuggestionGroup', () => {
  it('alternativas compactas são rádios; Aceitar aplica só com escolha', async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    function Harness() {
      const [picked, setPicked] = useState<string | null>(null);
      return (
        <SuggestionCard
          title="Títulos alternativos"
          acceptLabel="Usar título"
          acceptBlockedReason={picked ? undefined : 'Escolha um título'}
          onAccept={() => onAccept(picked)}
        >
          <SuggestionGroup label="Títulos alternativos" value={picked} onValueChange={setPicked}>
            <SuggestionCard
              variant="compact"
              value="a"
              proposal="Couro de cacto chega à Francal"
              meta="31 caracteres"
            />
            <SuggestionCard
              variant="compact"
              value="b"
              proposal="Rastrear a cadeia virou condição"
            />
            <SuggestionCard variant="compact" value="c" state="streaming" />
          </SuggestionGroup>
        </SuggestionCard>
      );
    }
    render(<Harness />);
    const group = screen.getByRole('radiogroup', { name: 'Títulos alternativos' });
    const radios = within(group).getAllByRole('radio');
    expect(radios).toHaveLength(3);
    expect(radios[2]).toBeDisabled();
    expect(new Set(radios.map((radio) => radio.getAttribute('name'))).size).toBe(1);

    const use = screen.getByRole('button', { name: 'Usar título' });
    expect(use).toHaveAttribute('aria-disabled', 'true');
    await user.click(use);
    expect(onAccept).not.toHaveBeenCalled();

    await user.click(radios[1] as HTMLElement);
    expect(radios[1]).toBeChecked();
    act(() => radios[1]?.focus());
    await user.keyboard('{Meta>}{Enter}{/Meta}');
    expect(onAccept).toHaveBeenCalledWith('b');
  });
});

describe('SuggestionBar', () => {
  it('gerando: progresso, Aceitar indisponível; pronta: atalhos e Tentar de novo', async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    const onDiscard = vi.fn();
    const onRetry = vi.fn();
    const { rerender } = render(
      <SuggestionBar
        label="Reescrever · mais direto"
        state="streaming"
        progress={40}
        onAccept={onAccept}
        onDiscard={onDiscard}
        onRetry={onRetry}
      />,
    );
    const bar = screen.getByRole('group', { name: 'Sugestão: Reescrever · mais direto' });
    expect(bar).toHaveAttribute('aria-busy', 'true');
    expect(within(bar).getByRole('progressbar', { name: 'Progresso da sugestão' })).toHaveAttribute(
      'aria-valuenow',
      '40',
    );
    expect(within(bar).getByRole('button', { name: 'Aceitar' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(within(bar).queryByRole('button', { name: 'Tentar de novo' })).toBeNull();

    rerender(
      <SuggestionBar
        label="Reescrever · mais direto"
        state="ready"
        onAccept={onAccept}
        onDiscard={onDiscard}
        onRetry={onRetry}
      />,
    );
    expect(screen.queryByRole('progressbar')).toBeNull();
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });
    expect(screen.getByRole('status')).toHaveTextContent('Sugestão pronta');
    act(() => screen.getByRole('button', { name: 'Tentar de novo' }).focus());
    await user.keyboard('{Meta>}{Enter}{/Meta}');
    expect(onAccept).toHaveBeenCalledTimes(1);
    await user.keyboard('{Escape}');
    expect(onDiscard).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
