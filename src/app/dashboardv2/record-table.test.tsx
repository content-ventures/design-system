import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CampaignProvider } from '../campanhas/campaign-context';
import { DashboardWorkspace } from './dashboard-workspace';
import { recordTableDefinition, selectRecords } from './record-table-model';
import { screens, type DemoRecord, type ScreenKey } from './workspace-data';

const setup = (hash: string) => {
  window.history.replaceState(null, '', `/dashboardv2#${hash}`);
  return render(
    <CampaignProvider>
      <DashboardWorkspace />
    </CampaignProvider>,
  );
};
const choose = async (user: ReturnType<typeof userEvent.setup>, label: string, option: string) => {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(screen.getByRole('option', { name: option }));
};
const bodyRows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1);

describe('listas adequadas ao domínio', () => {
  it('mostra importações em um histórico único, ordenado por data e com ordenação numérica', async () => {
    setup('plataforma/importacoes');
    const user = userEvent.setup();
    expect(screen.getAllByRole('table')).toHaveLength(1);
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(bodyRows()[0]).toHaveTextContent('Anunciantes outubro.csv');
    expect(
      screen.getByRole('button', { name: 'Ordenar por recebido em' }).closest('th'),
    ).toHaveAttribute('aria-sort', 'descending');
    await user.click(screen.getByRole('button', { name: 'Ordenar por registros' }));
    await user.click(screen.getByRole('button', { name: 'Ordenar por registros' }));
    expect(bodyRows()[0]).toHaveTextContent('Credenciados setembro.csv');
    await user.click(screen.getByRole('button', { name: 'Credenciados setembro.csv' }));
    expect(screen.getByRole('heading', { name: 'Credenciados setembro.csv' })).toBeInTheDocument();
  });

  it('combina tipo, situação e busca e recupera a lista vazia', async () => {
    setup('plataforma/importacoes');
    const user = userEvent.setup();
    await choose(user, 'Filtrar por tipo', 'Anunciantes');
    await choose(user, 'Filtrar por situação', 'Em revisão');
    expect(bodyRows()).toHaveLength(1);
    await user.type(screen.getByRole('textbox', { name: 'Buscar importações' }), 'credenciados');
    expect(
      screen.getByRole('heading', { name: 'Nenhum resultado encontrado' }),
    ).toBeInTheDocument();
    await user.click(
      within(
        screen.getByRole('heading', { name: 'Nenhum resultado encontrado' }).parentElement!,
      ).getByRole('button', { name: 'Limpar filtros' }),
    );
    expect(bodyRows()).toHaveLength(2);
  });

  it('expõe unidade de preço e estoque de cada mídia, sem somar unidades diferentes', async () => {
    setup('inventario');
    const user = userEvent.setup();
    const banner = screen
      .getByRole('button', { name: 'Superbanner · Página inicial' })
      .closest('tr')!;
    expect(banner).toHaveTextContent('200.000');
    expect(banner).toHaveTextContent('impressões');
    expect(banner).toHaveTextContent('CPM');
    await choose(user, 'Filtrar por formato', 'E-mail');
    expect(bodyRows()).toHaveLength(2);
    expect(bodyRows().every((row) => row.textContent?.includes('por envio'))).toBe(true);
    expect(
      screen.queryByRole('button', { name: 'Superbanner · Página inicial' }),
    ).not.toBeInTheDocument();
  });

  it('separa e-mail e papel na lista de pessoas e oferece filtro de papel', async () => {
    setup('plataforma/usuarios');
    const user = userEvent.setup();
    await choose(user, 'Filtrar por papel', 'Anunciante');
    expect(bodyRows()).toHaveLength(1);
    expect(bodyRows()[0]).toHaveTextContent('aurora@example.invalid');
    expect(bodyRows()[0]).toHaveTextContent('Anunciante');
  });

  it('usa uma caixa de notificações e atualiza a leitura ao abrir uma mensagem', async () => {
    setup('notificacoes');
    const user = userEvent.setup();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Lista de notificações' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Campanha aprovada' }));
    expect(screen.getByRole('button', { name: 'Notificações, 1 não lidas' })).toBeInTheDocument();
    act(() => {
      window.history.pushState(null, '', '#notificacoes');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await user.click(screen.getByRole('tab', { name: 'Não lida' }));
    expect(screen.queryByRole('button', { name: 'Campanha aprovada' })).not.toBeInTheDocument();
  });

  it('ordena datas por valor e números por magnitude, preservando a fonte e colocando ausentes por último', () => {
    const records: DemoRecord[] = [
      { id: 'a', name: 'A', status: 'Ativo', date: '2026-10-01', size: 20 },
      { id: 'b', name: 'B', status: 'Ativo', date: '2026-09-30', size: 100 },
      { id: 'c', name: 'C', status: 'Ativo' },
    ];
    expect(
      selectRecords(records, '', {}, { key: 'date', direction: 'desc' }).map((row) => row.id),
    ).toEqual(['a', 'b', 'c']);
    expect(
      selectRecords(records, '', {}, { key: 'size', direction: 'desc' }).map((row) => row.id),
    ).toEqual(['b', 'a', 'c']);
    expect(records.map((row) => row.id)).toEqual(['a', 'b', 'c']);
  });

  it('configura colunas e filtros existentes em todas as áreas de registros', () => {
    for (const [key, config] of Object.entries(screens)) {
      if (!config.fields.length) continue;
      const definition = recordTableDefinition(key as ScreenKey);
      const keys = config.fields.map((field) => field.key);
      expect(definition.columns.filter((column) => column.key === 'name')).toHaveLength(1);
      for (const column of definition.columns) {
        expect(keys).toContain(column.key);
        for (const secondary of column.secondary ?? []) expect(keys).toContain(secondary);
      }
      for (const filter of definition.filters ?? []) expect(keys).toContain(filter);
      if (definition.sort) expect(keys).toContain(definition.sort.key);
    }
  });
});
