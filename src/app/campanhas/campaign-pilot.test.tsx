import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { campaigns, campaignCsv, delivery, filterCampaigns } from './campaign-data';
import { CampaignProvider } from './campaign-context';
import { CampaignWorkspace } from './campaign-workspace';
import { CampaignDetail } from './campaign-detail';
import { NewCampaign } from './new-campaign';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
const filters = { query: '', status: 'all', advertiser: 'all', period: 'all' };
const setup = () =>
  render(
    <CampaignProvider>
      <CampaignWorkspace initialDirection="operacao" />
    </CampaignProvider>,
  );

beforeEach(() => {
  push.mockClear();
  window.history.replaceState(null, '', '/campanhas');
});

describe('contrato local da tela-piloto', () => {
  it('busca sem acentos e filtra os intervalos por sobreposição', () => {
    expect(
      filterCampaigns(campaigns, { ...filters, query: 'capitulo' }).map((row) => row.id),
    ).toEqual(['norte']);
    expect(
      filterCampaigns(campaigns, { ...filters, period: 'outubro' }).map((row) => row.id),
    ).toEqual(['norte', 'horizonte', 'forma', 'sul']);
  });
  it('combina status e anunciante', () => {
    expect(
      filterCampaigns(campaigns, { ...filters, status: 'attention', advertiser: 'Casa Forma' }).map(
        (row) => row.id,
      ),
    ).toEqual(['forma']);
  });
  it('exporta somente os exemplos recebidos, com escape de aspas', () => {
    const csv = campaignCsv([{ ...campaigns[0]!, name: 'Campanha "teste"' }]);
    expect(csv).toContain('Campanha ""teste""');
    expect(csv).not.toContain('Estúdio Norte');
    expect(csv).toContain('demonstração');
  });
  it('limita a entrega visual a 100%', () => {
    expect(delivery({ ...campaigns[0]!, delivered: 200000 })).toBe(100);
  });
});

describe('gestão de campanhas', () => {
  it('inicia compacta, separa anunciante e mantém formatos junto da campanha', () => {
    setup();
    const table = screen.getByRole('table');
    expect(table).toHaveAttribute('data-density', 'compact');
    expect(within(table).getByRole('columnheader', { name: 'Anunciante' })).toBeInTheDocument();
    const row = within(table).getAllByRole('row')[1]!;
    expect(within(row).getByRole('cell', { name: 'Aurora' })).toBeInTheDocument();
    const campaignCell = within(row)
      .getByRole('link', { name: 'Novas conexões, grandes negócios' })
      .closest('td')!;
    expect(campaignCell).toHaveTextContent('Superbanner');
    expect(campaignCell).toHaveTextContent('Newsletter');
    expect(
      within(row).getByRole('link', { name: 'Abrir Novas conexões, grandes negócios' }),
    ).toHaveAttribute('href', '/campanhas/aurora');
    const search = screen.getByRole('searchbox', { name: 'Buscar campanhas' });
    const stages = screen.getByRole('group', { name: 'Filtrar por etapa' });
    expect(search.compareDocumentPosition(stages) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it('separa seleção de veiculação e bloqueia etapas que não podem ser retomadas', async () => {
    setup();
    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(7);
    expect(
      switches.filter((control) => control.getAttribute('aria-checked') === 'true'),
    ).toHaveLength(3);
    for (const campaign of campaigns.filter((row) => row.status !== 'active')) {
      const control = screen.getByRole('switch', { name: `Veiculação de ${campaign.name}` });
      expect(control).toBeDisabled();
      expect(control).toHaveAccessibleDescription(/Veiculação indisponível nesta etapa/);
      await userEvent.click(control);
      expect(control).toHaveAttribute('aria-checked', 'false');
    }
    expect(screen.getAllByRole('checkbox')).toHaveLength(8);
  });
  it('pausa e retoma por teclado sem alterar seleção, verba ou entrega acumulada', async () => {
    setup();
    const control = screen.getByRole('switch', {
      name: 'Veiculação de Novas conexões, grandes negócios',
    });
    const selection = screen.getByRole('checkbox', {
      name: 'Selecionar Novas conexões, grandes negócios',
    });
    await userEvent.click(selection);
    control.focus();
    await userEvent.keyboard(' ');
    expect(control).toHaveAttribute('aria-checked', 'false');
    expect(within(screen.getByRole('table')).getByText('Pausada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Em veiculação 2' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('pausada somente na demonstração');
    expect(selection).toBeChecked();
    expect(screen.getByText('68.400')).toBeInTheDocument();
    expect(screen.getByText('R$ 18.400')).toBeInTheDocument();
    await userEvent.keyboard('{Enter}');
    expect(control).toHaveAttribute('aria-checked', 'true');
    expect(within(screen.getByRole('table')).queryByText('Pausada')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Em veiculação 3' })).toBeInTheDocument();
  });
  it('atualiza o filtro de veiculação ao pausar e permite reencontrar o exemplo', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Em veiculação 3' }));
    await userEvent.click(
      screen.getByRole('switch', { name: 'Veiculação de Novas conexões, grandes negócios' }),
    );
    expect(screen.getAllByRole('row')).toHaveLength(3);
    await userEvent.click(screen.getByRole('button', { name: 'Todas as campanhas 7' }));
    expect(
      screen.getByRole('switch', { name: 'Veiculação de Novas conexões, grandes negócios' }),
    ).toHaveAttribute('aria-checked', 'false');
    expect(within(screen.getByRole('table')).getByText('Pausada')).toBeInTheDocument();
  });
  it('preserva a pausa em memória ao navegar para o detalhe e voltar', async () => {
    const { rerender } = setup();
    await userEvent.click(
      screen.getByRole('switch', { name: 'Veiculação de Novas conexões, grandes negócios' }),
    );
    rerender(
      <CampaignProvider>
        <CampaignDetail id="aurora" />
      </CampaignProvider>,
    );
    expect(screen.getByText('Pausada')).toBeInTheDocument();
    expect(
      screen.getByText(/A campanha está pausada somente nesta demonstração/),
    ).toBeInTheDocument();
    expect(screen.queryByText('Não iniciada')).not.toBeInTheDocument();
    rerender(
      <CampaignProvider>
        <CampaignWorkspace initialDirection="operacao" />
      </CampaignProvider>,
    );
    expect(
      screen.getByRole('switch', { name: 'Veiculação de Novas conexões, grandes negócios' }),
    ).toHaveAttribute('aria-checked', 'false');
  });
  it('alterna densidade sem perder busca, seleção ou ordenação', async () => {
    setup();
    await userEvent.selectOptions(screen.getByLabelText('Densidade da tabela'), 'comfortable');
    await userEvent.type(screen.getByRole('searchbox'), 'aurora');
    await userEvent.click(screen.getByRole('button', { name: 'Verba' }));
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Selecionar Novas conexões, grandes negócios' }),
    );
    await userEvent.selectOptions(screen.getByLabelText('Densidade da tabela'), 'compact');
    expect(screen.getByRole('table')).toHaveAttribute('data-density', 'compact');
    expect(screen.getByRole('searchbox')).toHaveValue('aurora');
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByRole('columnheader', { name: 'Verba' })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    expect(
      screen.getByRole('checkbox', { name: 'Selecionar Novas conexões, grandes negócios' }),
    ).toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: 'Selecionar campanhas visíveis' }),
    ).toBePartiallyChecked();
    await userEvent.selectOptions(screen.getByLabelText('Densidade da tabela'), 'comfortable');
    expect(screen.getByRole('table')).toHaveAttribute('data-density', 'comfortable');
  });
  it('apresenta entrega com números, meta e semântica de progresso', () => {
    setup();
    const progress = screen.getByRole('progressbar', {
      name: 'Entrega de Novas conexões, grandes negócios',
    });
    expect(progress).toHaveAttribute('aria-valuenow', '68');
    expect(progress).toHaveAttribute('aria-valuetext', '68.400 de 100.000 impressões, 68% da meta');
    expect(screen.getByText('68.400')).toBeInTheDocument();
    expect(screen.getByText('de 100.000')).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar')).toHaveLength(4);
    expect(
      screen.queryByRole('progressbar', { name: /Sua marca em primeiro plano/ }),
    ).not.toBeInTheDocument();
  });
  it('mantém formatos legíveis e remove iniciais decorativas da tabela', () => {
    setup();
    const table = screen.getByRole('table');
    expect(within(table).getAllByText('Superbanner')).toHaveLength(5);
    expect(within(table).getAllByText('Newsletter')).toHaveLength(4);
    expect(table.querySelector('[data-identity]')).not.toBeInTheDocument();
    expect(
      within(table).getByRole('link', { name: 'Novas conexões, grandes negócios' }),
    ).toHaveAttribute('href', '/campanhas/aurora');
  });
  it('recalcula a verba exibida com os filtros', async () => {
    setup();
    await userEvent.type(screen.getByRole('searchbox'), 'norte');
    const total = screen.getByText(/Verba das campanhas exibidas/);
    expect(total).toHaveTextContent('R$ 12.600');
    await userEvent.clear(screen.getByRole('searchbox'));
    expect(total).toHaveTextContent('R$ 74.700');
  });
  it('filtra nomes e recupera a busca vazia', async () => {
    setup();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar campanhas' }), 'nao existe');
    expect(screen.getByText('Nenhuma campanha por aqui')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Limpar busca e filtros' }));
    expect(screen.getAllByRole('row')).toHaveLength(8);
    await userEvent.type(screen.getByRole('searchbox'), 'norte');
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'O próximo capítulo do design' })).toHaveAttribute(
      'href',
      '/campanhas/norte',
    );
  });
  it('abre a fila de atenção sem manter filtros que ocultem pendências', async () => {
    setup();
    const banner = screen.getByRole('complementary', {
      name: '2 campanhas aguardam sua revisão',
    });
    expect(within(banner).getByRole('heading', { level: 2 })).toHaveTextContent(
      '2 campanhas aguardam sua revisão',
    );
    expect(
      within(banner).getByText(/materiais em aprovação e os ajustes solicitados/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Resumo de todas as campanhas' }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Selecionar Novas conexões, grandes negócios' }),
    );
    await userEvent.selectOptions(screen.getByLabelText('Anunciante'), 'Aurora');
    await userEvent.click(screen.getByRole('button', { name: 'Filtros' }));
    await userEvent.selectOptions(screen.getByLabelText('Campanhas com veiculação em'), 'outubro');
    await userEvent.type(screen.getByRole('searchbox'), 'aurora');
    await userEvent.click(within(banner).getByRole('button', { name: 'Ver pendências' }));
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Precisam de atenção 2' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(screen.getByLabelText('Anunciante')).toHaveValue('all');
    expect(screen.getByLabelText('Campanhas com veiculação em')).toHaveValue('all');
    expect(screen.getByRole('button', { name: 'Precisam de atenção 2' })).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Exportar seleção' })).not.toBeInTheDocument();
  });
  it('combina os filtros de anunciante e período', async () => {
    setup();
    await userEvent.selectOptions(screen.getByLabelText('Anunciante'), 'Aurora');
    expect(screen.getAllByRole('row')).toHaveLength(3);
    await userEvent.click(screen.getByRole('button', { name: 'Filtros' }));
    await userEvent.selectOptions(screen.getByLabelText('Campanhas com veiculação em'), 'outubro');
    expect(screen.getByText('Nenhuma campanha por aqui')).toBeInTheDocument();
  });
  it('ordena verba e informa o sentido para tecnologia assistiva', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Verba' }));
    expect(screen.getByRole('columnheader', { name: 'Verba' })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Novas conexões, grandes negócios');
    await userEvent.click(screen.getByRole('button', { name: 'Verba' }));
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Uma nova temporada de possibilidades');
  });
  it('seleciona apenas as linhas visíveis e limpa ao mudar o filtro', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Em veiculação 3' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Selecionar campanhas visíveis' }));
    expect(
      screen.getAllByRole('checkbox').filter((box) => (box as HTMLInputElement).checked),
    ).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'Exportar seleção' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Rascunhos 1' }));
    expect(screen.queryByRole('button', { name: 'Exportar seleção' })).not.toBeInTheDocument();
  });
  it('exporta a seleção, não a lista toda', async () => {
    const create = vi.fn(() => 'blob:demo');
    const revoke = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: create });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revoke });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    setup();
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Selecionar Novas conexões, grandes negócios' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Exportar seleção' }));
    expect(create).toHaveBeenCalledOnce();
    expect(screen.getByRole('status')).toHaveTextContent('1 campanha fictícia exportada');
    click.mockRestore();
  });
  it('muda a composição sem perder a busca, com URL compartilhável', async () => {
    setup();
    await userEvent.type(screen.getByRole('searchbox'), 'lume');
    await userEvent.click(
      within(screen.getByRole('group', { name: 'Direção visual' })).getByRole('button', {
        name: 'Portfólio',
      }),
    );
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('Composição ilustrativa')).toBeInTheDocument();
    expect(window.location.search).toBe('?visao=portfolio');
    await userEvent.click(
      within(screen.getByRole('group', { name: 'Direção visual' })).getByRole('button', {
        name: 'Veiculação',
      }),
    );
    expect(
      screen.getByRole('link', { name: /Ideias que merecem ser vistas:.*Em veiculação/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveValue('lume');
  });
  it('leva a criação para uma página, não um diálogo', () => {
    setup();
    expect(screen.getByRole('link', { name: 'Nova campanha' })).toHaveAttribute(
      'href',
      '/campanhas/nova',
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('páginas complementares da prévia', () => {
  it('preserva a busca ao entrar em um detalhe e voltar para a lista', async () => {
    const { rerender } = setup();
    await userEvent.type(screen.getByRole('searchbox'), 'norte');
    await userEvent.selectOptions(screen.getByLabelText('Densidade da tabela'), 'compact');
    rerender(
      <CampaignProvider>
        <CampaignDetail id="norte" />
      </CampaignProvider>,
    );
    rerender(
      <CampaignProvider>
        <CampaignWorkspace initialDirection="operacao" />
      </CampaignProvider>,
    );
    expect(screen.getByRole('searchbox')).toHaveValue('norte');
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByRole('table')).toHaveAttribute('data-density', 'compact');
  });
  it('explica detalhes e deixa claro que não há publicação', () => {
    render(
      <CampaignProvider>
        <CampaignDetail id="forma" />
      </CampaignProvider>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Design para novos encontros',
    );
    expect(screen.getByText(/revisar o formato do criativo/)).toBeInTheDocument();
    expect(screen.getByText(/não estão conectadas a esta prévia/)).toBeInTheDocument();
  });
  it('oferece retorno para um identificador desconhecido', () => {
    render(
      <CampaignProvider>
        <CampaignDetail id="inexistente" />
      </CampaignProvider>,
    );
    expect(screen.getByRole('link', { name: 'Ver campanhas de exemplo' })).toHaveAttribute(
      'href',
      '/campanhas',
    );
  });
  it('cria somente um rascunho em memória, preservando dados entre etapas', async () => {
    render(
      <CampaignProvider>
        <NewCampaign />
      </CampaignProvider>,
    );
    await userEvent.type(screen.getByLabelText('Nome da campanha'), 'Teste de interface');
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    await userEvent.type(screen.getByLabelText('Verba planejada (R$)'), '2500');
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByText('Teste de interface')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(screen.getByLabelText('Verba planejada (R$)')).toHaveValue(2500);
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Criar rascunho' }));
    expect(push).toHaveBeenCalledWith(expect.stringMatching(/^\/campanhas\/rascunho-/));
    expect(sessionStorage.length).toBe(0);
    expect(localStorage.length).toBe(0);
  });
  it('exige pelo menos um ativo antes de revisar', async () => {
    render(
      <CampaignProvider>
        <NewCampaign />
      </CampaignProvider>,
    );
    await userEvent.type(screen.getByLabelText('Nome da campanha'), 'Teste');
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    await userEvent.type(screen.getByLabelText('Verba planejada (R$)'), '2500');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Superbanner' }));
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Escolha pelo menos um ativo');
    expect(push).not.toHaveBeenCalled();
  });
});
