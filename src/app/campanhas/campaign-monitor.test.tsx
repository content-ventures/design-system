import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { CampaignProvider } from './campaign-context';
import { CampaignWorkspace } from './campaign-workspace';

const setup = () =>
  render(
    <CampaignProvider>
      <CampaignWorkspace />
    </CampaignProvider>,
  );
beforeEach(() => window.history.replaceState(null, '', '/campanhas'));

describe('monitoramento próximo da referência visual', () => {
  it('é a visualização inicial, com quatro métricas reais por campanha', () => {
    setup();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(7);
    const card = screen.getByRole('article', { name: 'Novas conexões, grandes negócios' });
    expect(within(card).getAllByRole('term')).toHaveLength(4);
    for (const value of ['68.400', '100.000', '68%', 'R$ 18.400'])
      expect(within(card).getByText(value)).toBeInTheDocument();
    expect(
      within(card).getByRole('link', { name: 'Novas conexões, grandes negócios' }),
    ).toHaveAttribute('href', '/campanhas/aurora');
    const draft = screen.getByRole('article', { name: 'Uma nova temporada de possibilidades' });
    expect(within(draft).getAllByText('—')).toHaveLength(2);
    expect(within(draft).getByRole('switch')).toBeDisabled();
  });
  it('combina formato, status e ordenação', async () => {
    setup();
    await userEvent.selectOptions(screen.getByLabelText('Formato'), 'Superbanner');
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'active');
    await userEvent.selectOptions(screen.getByLabelText('Ordenar por'), 'asc');
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(3);
    expect(cards[0]).toHaveAccessibleName('Ideias que merecem ser vistas');
    expect(cards[2]).toHaveAccessibleName('Novas conexões, grandes negócios');
  });
  it('mantém seleção e toggle separados e preserva pausa ao trocar de visualização', async () => {
    setup();
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Selecionar Novas conexões, grandes negócios' }),
    );
    const control = screen.getByRole('switch', {
      name: 'Veiculação de Novas conexões, grandes negócios',
    });
    control.focus();
    await userEvent.keyboard(' ');
    expect(control).toHaveAttribute('aria-checked', 'false');
    expect(
      screen.getByRole('checkbox', { name: 'Selecionar Novas conexões, grandes negócios' }),
    ).toBeChecked();
    expect(screen.getByRole('button', { name: 'Exportar seleção' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Operação' }));
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(
      screen.getByRole('switch', { name: 'Veiculação de Novas conexões, grandes negócios' }),
    ).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(screen.getByRole('button', { name: 'Monitoramento' }));
    expect(window.location.search).toBe('?visao=monitoramento');
    expect(
      within(screen.getByRole('article', { name: 'Novas conexões, grandes negócios' })).getByText(
        'Pausada',
      ),
    ).toBeInTheDocument();
  });
  it('a faixa de pendências também limpa o novo filtro de formato', async () => {
    setup();
    await userEvent.selectOptions(screen.getByLabelText('Formato'), 'Redes sociais');
    await userEvent.click(screen.getByRole('button', { name: 'Ver pendências' }));
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(
      screen.getByRole('article', { name: 'Sua marca em primeiro plano' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Formato')).toHaveValue('all');
  });
});
