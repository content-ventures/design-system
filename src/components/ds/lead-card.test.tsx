import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LeadCard, exampleLeads } from './lead-card';
import { IdentityOverview } from '../../app/identity-overview';

describe('card de lead — exploração 02', () => {
  it('apresenta pessoa, empresa e interesse sem depender de cores', () => {
    render(<LeadCard />);
    expect(screen.getByRole('heading', { name: 'Marina Costa' })).toBeInTheDocument();
    expect(screen.getByText('Empresa Aurora')).toBeInTheDocument();
    expect(screen.getByText('Coleção verão 2027')).toBeInTheDocument();
    expect(screen.getByText('Novo lead')).toBeInTheDocument();
  });
  it('alterna o destaque com estado acessível', async () => {
    const user = userEvent.setup();
    render(<LeadCard />);
    const button = screen.getByRole('button', { name: 'Destacar Marina Costa' });
    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });
  it('expande o contato fictício, registra localmente e permite desfazer', async () => {
    const user = userEvent.setup();
    render(<LeadCard />);
    await user.click(screen.getByRole('button', { name: 'Ver contato' }));
    expect(screen.getByRole('button', { name: 'Fechar contato' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByText('contato@exemplo.invalid')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Registrar contato local' }));
    expect(screen.getByText('Contato registrado')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Desfazer registro' }));
    expect(screen.getByText('Novo lead')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Fechar contato' }));
    expect(screen.queryByText('contato@exemplo.invalid')).not.toBeInTheDocument();
  });
  it('reutiliza o mesmo card no kanban com seleção nativa', async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(<LeadCard lead={exampleLeads[1]} stage="Novos leads" onStageChange={change} />);
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Etapa de Grupo Horizonte' }),
      'Em contato',
    );
    expect(change).toHaveBeenCalledWith('Em contato');
    expect(screen.queryByRole('button', { name: 'Ver contato' })).not.toBeInTheDocument();
  });
});

describe('composição da nova direção', () => {
  it('alterna a demonstração de veiculação sem publicar campanhas', async () => {
    const user = userEvent.setup();
    render(<IdentityOverview onNotify={() => {}} />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeChecked();
    await user.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(screen.getByText('Pausada nesta demonstração')).toBeVisible();
  });
  it('permite rever a assinatura e mantém descrição textual', async () => {
    const user = userEvent.setup();
    render(<IdentityOverview onNotify={() => {}} />);
    const accessibleName =
      'Duas formas se encontram, representando a conexão entre marcas e pessoas.';
    const before = screen.getByRole('img', { name: accessibleName });
    await user.click(screen.getByRole('button', { name: 'Rever movimento' }));
    const after = screen.getByRole('img', { name: accessibleName });
    expect(after).not.toBe(before);
    expect(after).toBeInTheDocument();
  });
});
