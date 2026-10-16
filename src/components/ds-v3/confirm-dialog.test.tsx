/**
 * `ConfirmDialog acknowledge`: o aviso de um bloqueio que a pessoa não resolve na hora. Um botão
 * primário só (“Entendi” por padrão) com o foco, sem Cancelar; clique, Enter e Esc fecham, e
 * `onConfirm` é opcional. A pergunta padrão continua com Cancelar.
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmDialog } from './confirm-dialog';

function footerButtons(role: 'dialog' | 'alertdialog' = 'alertdialog') {
  const footer = screen.getByRole(role).querySelector('footer');
  if (!footer) throw new Error('Diálogo sem rodapé');
  return within(footer).getAllByRole('button');
}

describe('ConfirmDialog acknowledge', () => {
  it('um botão só, “Entendi”, primário e com o foco; sem Cancelar', async () => {
    render(
      <ConfirmDialog
        open
        acknowledge
        onClose={vi.fn()}
        title="Você não tem permissão para isso"
        description="Só editor ou admin cria produções."
      />,
    );
    // O aviso interrompe e pede resposta: é um alertdialog, não um diálogo de edição.
    const dialog = screen.getByRole('alertdialog', { name: 'Você não tem permissão para isso' });
    expect(dialog).toHaveAccessibleDescription('Só editor ou admin cria produções.');
    const buttons = footerButtons();
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveTextContent('Entendi');
    expect(buttons[0]).toHaveAttribute('data-variant', 'primary');
    expect(screen.queryByRole('button', { name: 'Cancelar' })).toBeNull();
    await waitFor(() => expect(buttons[0]).toHaveFocus());
  });

  it('clicar no botão fecha, sem onConfirm', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <ConfirmDialog open acknowledge onClose={onClose} title="Você não tem permissão para isso" />,
    );
    await user.click(screen.getByRole('button', { name: 'Entendi' }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('Enter no botão roda onConfirm e fecha; rótulo próprio', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        acknowledge
        onClose={onClose}
        onConfirm={onConfirm}
        confirmLabel="Voltar às produções"
        title="Você não tem permissão para isso"
      />,
    );
    const button = screen.getByRole('button', { name: 'Voltar às produções' });
    await waitFor(() => expect(button).toHaveFocus());
    await user.keyboard('{Enter}');
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('Esc fecha como sempre', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <ConfirmDialog open acknowledge onClose={onClose} title="Você não tem permissão para isso" />,
    );
    await waitFor(() => expect(screen.getByRole('button', { name: 'Entendi' })).toHaveFocus());
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('a pergunta padrão continua com Cancelar e o botão da ação', () => {
    render(
      <ConfirmDialog
        open
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Iniciar veiculação?"
        confirmLabel="Iniciar veiculação"
      />,
    );
    // A pergunta mantém o papel nativo do diálogo.
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(footerButtons('dialog').map((button) => button.textContent)).toEqual([
      'Cancelar',
      'Iniciar veiculação',
    ]);
  });
});
