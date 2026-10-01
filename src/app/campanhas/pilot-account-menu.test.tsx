import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PilotAccountMenu } from './pilot-account-menu';

describe('conta demonstrativa no rodapé', () => {
  it('abre as opções sem habilitar autenticação ou inventar outras contas', async () => {
    render(<PilotAccountMenu collapsed={false} />);
    const trigger = screen.getByRole('button', { name: 'Conta: Equipe de mídia' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Conta de demonstração' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(within(dialog).getAllByText('Equipe de mídia')).toHaveLength(1);
    for (const name of [
      'Meu perfil',
      'Configurações da conta',
      'Dispositivos conectados',
      'Sair da conta',
    ]) {
      expect(within(dialog).getByRole('button', { name })).toBeDisabled();
    }
    expect(within(dialog).getByText('Prévia sem autenticação')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Fechar opções da conta' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('usa a mesma foto local no cartão e no popover, sem monograma', async () => {
    render(<PilotAccountMenu collapsed={false} />);
    const trigger = screen.getByRole('button', { name: 'Conta: Equipe de mídia' });
    expect(
      within(trigger).getByRole('img', { name: 'Avatar fictício de demonstração' }),
    ).toHaveAttribute('width', '36');
    expect(trigger).not.toHaveTextContent('FM');
    await userEvent.click(trigger);
    const portraits = screen.getAllByRole('img', { name: 'Avatar fictício de demonstração' });
    expect(portraits).toHaveLength(2);
    expect(portraits[0]).toHaveAttribute('src', portraits[1]!.getAttribute('src'));
    expect(portraits[0]!.getAttribute('src')).toContain('avatar-demo.png');
  });

  it('fecha pelo botão e por clique externo, sem capturar foco de outro controle', async () => {
    render(
      <>
        <PilotAccountMenu collapsed={false} />
        <button>Fora da conta</button>
      </>,
    );
    const trigger = screen.getByRole('button', { name: 'Conta: Equipe de mídia' });
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('button', { name: 'Fechar opções da conta' }));
    expect(trigger).toHaveFocus();
    await userEvent.click(trigger);
    const outside = screen.getByRole('button', { name: 'Fora da conta' });
    await userEvent.click(outside);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(outside).toHaveFocus();
  });

  it('continua disponível na faixa recolhida e fecha ao sair com Tab', async () => {
    render(
      <>
        <PilotAccountMenu collapsed />
        <button>Próxima ação</button>
      </>,
    );
    const trigger = screen.getByRole('button', { name: 'Conta: Equipe de mídia' });
    expect(trigger).toHaveAttribute('title', 'Equipe de mídia · Francal');
    await userEvent.click(trigger);
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Próxima ação' })).toHaveFocus();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
