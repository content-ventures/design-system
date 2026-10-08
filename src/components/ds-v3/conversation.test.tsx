/**
 * `Conversation` + `ConversationTurn` + `ConversationArtifact`: linha do tempo rolável (`log`)
 * que segue o fim e oferece “Ir para o fim” quando a pessoa sobe; turnos da pessoa, da IA e
 * notas; resposta chegando (`aria-busy`, sem ações); copiar, gerar de novo, voto com comentário;
 * erro e interrupção com a ação em texto; artefato que abre pelo teclado.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Conversation, ConversationArtifact, ConversationTurn } from './conversation';

/** O jsdom não faz layout: dá à área uma altura de conteúdo e de janela. */
function fakeLayout(el: HTMLElement, scrollHeight: number, clientHeight: number) {
  Object.defineProperty(el, 'scrollHeight', { configurable: true, value: scrollHeight });
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: clientHeight });
}

describe('Conversation', () => {
  it('é um log nomeado e focável; sem turnos mostra o estado vazio', async () => {
    const user = userEvent.setup();
    render(<Conversation label="Conversa com o copiloto" empty={<p>Peça um ajuste ao texto</p>} />);
    const log = screen.getByRole('log', { name: 'Conversa com o copiloto' });
    expect(log).toHaveTextContent('Peça um ajuste ao texto');
    await user.tab();
    expect(log).toHaveFocus();
  });

  it('subindo para reler mostra “Ir para o fim”; o botão volta ao fim e some', async () => {
    const user = userEvent.setup();
    render(
      <Conversation label="Conversa" footer={<button type="button">Compositor</button>}>
        <ConversationTurn role="user">Deixe a introdução mais direta</ConversationTurn>
        <ConversationTurn role="assistant">Cortei a contextualização da feira.</ConversationTurn>
      </Conversation>,
    );
    const log = screen.getByRole('log');
    fakeLayout(log, 1200, 300);
    log.scrollTop = 200;
    fireEvent.scroll(log);
    const jump = await screen.findByRole('button', { name: 'Ir para o fim' });

    await user.click(jump);
    expect(log.scrollTop).toBe(1200);
    expect(screen.queryByRole('button', { name: 'Ir para o fim' })).toBeNull();
    expect(log).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Compositor' })).toBeInTheDocument();
  });

  it('o conteúdo cresce antes do evento da ida ao fim: segue acompanhando, sem “Ir para o fim”', () => {
    render(
      <Conversation label="Conversa">
        <ConversationTurn role="assistant">Etapas da geração</ConversationTurn>
      </Conversation>,
    );
    const log = screen.getByRole('log');
    // A conversa abriu no fim; o trace cresceu 71 px antes de o evento daquela rolagem chegar.
    fakeLayout(log, 600, 529);
    fireEvent.scroll(log);
    expect(screen.queryByRole('button', { name: 'Ir para o fim' })).toBeNull();

    // A pessoa sobe para reler: aí sim o botão aparece.
    log.scrollTop = 40;
    fireEvent.scroll(log);
    expect(screen.getByRole('button', { name: 'Ir para o fim' })).toBeInTheDocument();
  });

  it('arrastar a barra para cima durante o deslize solta o acompanhamento; já no fim, nada desliza', async () => {
    const user = userEvent.setup();
    const scrollTo = vi.fn();
    const { rerender } = render(
      <Conversation label="Conversa">
        <ConversationTurn role="assistant">Etapas</ConversationTurn>
      </Conversation>,
    );
    const log = screen.getByRole('log');
    Object.defineProperty(log, 'scrollTo', { configurable: true, value: scrollTo });
    fakeLayout(log, 1200, 300);
    log.scrollTop = 900;
    // Um pedido novo com a área no fim: nenhum deslize (nem um `gliding` que nunca terminaria).
    rerender(
      <Conversation label="Conversa">
        <ConversationTurn role="assistant">Etapas</ConversationTurn>
        <ConversationTurn role="user">Mais direto</ConversationTurn>
      </Conversation>,
    );
    expect(scrollTo).not.toHaveBeenCalled();

    // Longe do fim, o próximo pedido desliza; a pessoa pega a barra e sobe no meio do caminho.
    log.scrollTop = 100;
    fireEvent.scroll(log);
    await user.click(screen.getByRole('button', { name: 'Ir para o fim' }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 1200, behavior: 'smooth' });
    fireEvent.pointerDown(log);
    log.scrollTop = 60;
    fireEvent.scroll(log);
    expect(screen.getByRole('button', { name: 'Ir para o fim' })).toBeInTheDocument();
  });

  it('no fim, rolar não mostra o botão', () => {
    render(
      <Conversation label="Conversa">
        <ConversationTurn role="user">Oi</ConversationTurn>
      </Conversation>,
    );
    const log = screen.getByRole('log');
    fakeLayout(log, 1200, 300);
    log.scrollTop = 890;
    fireEvent.scroll(log);
    expect(screen.queryByRole('button', { name: 'Ir para o fim' })).toBeNull();
  });
});

describe('ConversationTurn', () => {
  it('pessoa: balão com nome “Você” e o contexto enviado junto', () => {
    render(
      <ConversationTurn role="user" context={<span>Seleção · §1</span>}>
        Deixe a introdução mais direta
      </ConversationTurn>,
    );
    const turn = screen.getByRole('article', { name: 'Você' });
    expect(within(turn).getByRole('group', { name: 'Enviado junto' })).toHaveTextContent(
      'Seleção · §1',
    );
    expect(turn).toHaveTextContent('Deixe a introdução mais direta');
  });

  it('IA chegando: cabeçalho com meta, aria-busy e nenhuma ação até terminar', () => {
    const { rerender } = render(
      <ConversationTurn
        role="assistant"
        meta="Simulação local · 12 s"
        status="streaming"
        copyText="Cortei"
        onRetry={() => undefined}
        onFeedback={() => undefined}
      >
        Cortei
      </ConversationTurn>,
    );
    const turn = screen.getByRole('article', { name: 'Copiloto' });
    expect(turn).toHaveAttribute('aria-busy', 'true');
    expect(turn).toHaveTextContent('Simulação local · 12 s');
    expect(screen.queryByRole('group', { name: 'Ações da resposta' })).toBeNull();

    rerender(
      <ConversationTurn
        role="assistant"
        meta="Simulação local · 12 s"
        copyText="Cortei"
        onRetry={() => undefined}
        onFeedback={() => undefined}
      >
        Cortei
      </ConversationTurn>,
    );
    const actions = screen.getByRole('group', { name: 'Ações da resposta' });
    expect(
      within(actions)
        .getAllByRole('button')
        .map((b) => b.getAttribute('aria-label')),
    ).toEqual(['Copiar resposta', 'Gerar de novo', 'Marcar como útil', 'Marcar como não útil']);
  });

  it('copia a resposta e confirma no nome do botão', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const copied = vi.fn();
    render(
      <ConversationTurn role="assistant" copyText="Texto da resposta" onCopy={copied}>
        Texto da resposta
      </ConversationTurn>,
    );
    await user.click(screen.getByRole('button', { name: 'Copiar resposta' }));
    expect(writeText).toHaveBeenCalledWith('Texto da resposta');
    expect(copied).toHaveBeenCalled();
    expect(await screen.findByRole('button', { name: 'Resposta copiada' })).toBeInTheDocument();
  });

  it('voto alterna pelo teclado; 👎 pede comentário opcional e envia com a nota', async () => {
    const user = userEvent.setup();
    const feedback = vi.fn();
    const { rerender } = render(
      <ConversationTurn role="assistant" onFeedback={feedback} feedback={null}>
        Resposta
      </ConversationTurn>,
    );
    const up = screen.getByRole('button', { name: 'Marcar como útil' });
    expect(up).toHaveAttribute('aria-pressed', 'false');
    up.focus();
    await user.keyboard('{Enter}');
    expect(feedback).toHaveBeenLastCalledWith('up');
    expect(screen.queryByRole('dialog')).toBeNull();

    rerender(
      <ConversationTurn role="assistant" onFeedback={feedback} feedback="up">
        Resposta
      </ConversationTurn>,
    );
    expect(screen.getByRole('button', { name: 'Marcar como útil' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'Marcar como útil' }));
    expect(feedback).toHaveBeenLastCalledWith(null);

    await user.click(screen.getByRole('button', { name: 'Marcar como não útil' }));
    expect(feedback).toHaveBeenLastCalledWith('down');
    const dialog = await screen.findByRole('dialog', { name: 'O que faltou?' });
    await user.type(
      within(dialog).getByRole('textbox', { name: 'O que faltou?' }),
      'Perdeu a fala',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Enviar comentário' }));
    expect(feedback).toHaveBeenLastCalledWith('down', 'Perdeu a fala');
  });

  it('erro vira alerta com “Tentar de novo”; interrompida oferece “Continuar”', async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    const resume = vi.fn();
    const { rerender } = render(
      <ConversationTurn role="assistant" status="error" onRetry={retry} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível concluir a resposta.');
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(retry).toHaveBeenCalledTimes(1);
    // No erro, “Gerar de novo” não se repete nas ações.
    expect(screen.queryByRole('button', { name: 'Gerar de novo' })).toBeNull();

    rerender(<ConversationTurn role="assistant" status="stopped" onContinue={resume} />);
    expect(screen.getByText('Resposta interrompida')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it('nota do sistema é uma legenda nomeada', () => {
    render(
      <ConversationTurn role="system-note" meta="14:02">
        Rascunho v1 salvo
      </ConversationTurn>,
    );
    const note = screen.getByRole('article', { name: 'Aviso' });
    expect(note).toHaveTextContent('Rascunho v1 salvo');
    expect(note).toHaveTextContent('14:02');
  });
});

describe('ConversationArtifact', () => {
  it('o título abre pelo teclado e a meta o descreve; ações continuam próprias', async () => {
    const user = userEvent.setup();
    const open = vi.fn();
    const restore = vi.fn();
    render(
      <ConversationArtifact
        title="Rascunho v1"
        meta="812 palavras · 4 min de leitura"
        onOpen={open}
        actions={
          <button type="button" onClick={restore}>
            Restaurar
          </button>
        }
      />,
    );
    const title = screen.getByRole('button', { name: 'Rascunho v1' });
    expect(title).toHaveAccessibleDescription('812 palavras · 4 min de leitura');
    title.focus();
    await user.keyboard('{Enter}');
    expect(open).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Restaurar' }));
    expect(restore).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledTimes(1);
  });
});
