import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { CampaignProvider } from '../campanhas/campaign-context';
import { DashboardWorkspace } from './dashboard-workspace';

beforeEach(() => window.history.replaceState(null, '', '/dashboardv2#tabelas/compacta'));
const setup = () =>
  render(
    <CampaignProvider>
      <DashboardWorkspace />
    </CampaignProvider>,
  );
const choose = async (user: ReturnType<typeof userEvent.setup>, label: string, option: string) => {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(screen.getByRole('option', { name: option }));
};

describe('exploração de tabelas — comparação e operação local', () => {
  it('preserva busca, ordenação e foco ao alternar modelos e no histórico', async () => {
    setup();
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox', { name: 'Buscar campanhas' }), 'Aurora');
    await choose(user, 'Ordenar tabela', 'Maior verba');
    await user.click(screen.getByRole('button', { name: 'Leitura de performance' }));
    expect(screen.getByRole('button', { name: 'Leitura de performance' })).toHaveFocus();
    expect(screen.getByRole('textbox', { name: 'Buscar campanhas' })).toHaveValue('Aurora');
    expect(screen.getAllByRole('switch')).toHaveLength(2);
    expect(screen.getByRole('combobox', { name: 'Ordenar tabela' })).toHaveTextContent(
      'Maior verba',
    );
    expect(window.location.hash).toBe('#tabelas/performance');
    await user.click(screen.getByRole('button', { name: 'Revisão com contexto' }));
    expect(screen.getByRole('textbox', { name: 'Buscar campanhas' })).toHaveValue('Aurora');
    act(() => {
      window.history.replaceState(null, '', '#tabelas/performance');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.getByRole('button', { name: 'Leitura de performance' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getAllByRole('switch')).toHaveLength(2);
  });

  it('pausa em lote apenas campanhas elegíveis e mantém a alteração nos outros modelos', async () => {
    setup();
    const user = userEvent.setup();
    expect(
      screen.getByRole('checkbox', { name: 'Selecionar Sua marca em primeiro plano' }),
    ).toBeDisabled();
    await user.click(
      screen.getByRole('checkbox', { name: 'Selecionar todas as campanhas elegíveis' }),
    );
    expect(screen.getByText('3 selecionadas')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Pausar' }));
    expect(screen.getByRole('status')).toHaveTextContent('3 campanhas: veiculação desativada');
    expect(
      screen
        .getAllByRole('switch')
        .every((control) => control.getAttribute('aria-checked') === 'false'),
    ).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Leitura de performance' }));
    expect(screen.getAllByText('Pausada')).toHaveLength(3);
    expect(
      screen.getByRole('switch', { name: 'Veiculação de Sua marca em primeiro plano' }),
    ).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Comparar com a atual' }));
    expect(
      screen.getByRole('switch', { name: 'Veiculação de Novas conexões, grandes negócios' }),
    ).toHaveAttribute('aria-checked', 'false');
  });

  it('limpa seleção ao filtrar e calcula totais somente dos resultados visíveis', async () => {
    setup();
    const user = userEvent.setup();
    await user.click(
      screen.getByRole('checkbox', { name: 'Selecionar todas as campanhas elegíveis' }),
    );
    await choose(user, 'Filtrar anunciante da tabela', 'Aurora');
    expect(screen.queryByText('3 selecionadas')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Leitura de performance' }));
    const totalRow = screen.getByRole('rowheader', { name: 'Total · 2 campanhas' }).closest('tr')!;
    expect(totalRow.textContent?.replaceAll('\u00a0', ' ')).toContain('R$ 33.100,00');
    expect(totalRow).toHaveTextContent('148.400');
    expect(totalRow).toHaveTextContent('180.000');
    expect(totalRow).toHaveTextContent('82% da meta');
    await choose(user, 'Filtrar status da tabela', 'Em veiculação');
    expect(screen.getAllByRole('switch')).toHaveLength(1);
    expect(
      screen.getByRole('rowheader', { name: 'Total · 1 campanha' }).closest('tr'),
    ).toHaveTextContent('68.400');
  });

  it('ordena por valores numéricos e recupera a lista após busca vazia', async () => {
    setup();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Verba' }));
    let table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent(
      'Uma nova temporada de possibilidades',
    );
    await user.click(screen.getByRole('button', { name: 'Verba' }));
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent(
      'Novas conexões, grandes negócios',
    );
    await user.type(screen.getByRole('textbox', { name: 'Buscar campanhas' }), 'inexistente');
    await user.click(screen.getByRole('button', { name: 'Revisão com contexto' }));
    expect(
      screen.getByRole('heading', { name: 'Nenhum resultado encontrado' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    table = screen.getByRole('table');
    expect(within(table).getAllByRole('switch')).toHaveLength(7);
  });

  it('expande pelo teclado sem sair da lista e abre o detalhe na rota existente', async () => {
    window.history.replaceState(null, '', '/dashboardv2#tabelas/contexto');
    setup();
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', {
      name: 'Detalhes de O próximo capítulo do design',
    });
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.queryByRole('region', { name: 'Planejamento de Novas conexões, grandes negócios' }),
    ).not.toBeInTheDocument();
    const detail = screen.getByRole('region', {
      name: 'Planejamento de O próximo capítulo do design',
    });
    expect(detail).toHaveTextContent('Superbanner · Redes sociais');
    await user.click(within(detail).getByRole('link', { name: 'Abrir campanha' }));
    expect(window.location.hash).toBe('#campanhas/norte');
    expect(
      screen.getByRole('heading', { name: 'O próximo capítulo do design' }),
    ).toBeInTheDocument();
  });
});
