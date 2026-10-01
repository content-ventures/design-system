import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button, Dialog, Progress, Switch, Tabs } from './primitives';
import { CampaignTable } from './campaign-table';
import { CampaignWizard } from './campaign-wizard';
import { PerformanceChart } from './charts';

describe('primitivos V2', () => {
  it('bloqueia ações durante carregamento', async () => {
    const action = vi.fn();
    render(
      <Button loading onClick={action}>
        Salvar
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(action).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });
  it('limita progresso ao intervalo válido', () => {
    render(<Progress value={130} label="Entrega" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
  it('expõe preferência como switch rotulado', async () => {
    const action = vi.fn();
    render(<Switch label="Notificar" checked={false} onChange={action} />);
    await userEvent.click(screen.getByRole('switch', { name: 'Notificar' }));
    expect(action).toHaveBeenCalledWith(true);
  });
  it('abre e fecha diálogo com rótulo e descrição', () => {
    const { rerender } = render(
      <Dialog open title="Confirmar" description="Somente uma prévia" onClose={() => {}} />,
    );
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Confirmar');
    expect(screen.getByRole('dialog')).toHaveAccessibleDescription('Somente uma prévia');
    rerender(<Dialog open={false} title="Confirmar" onClose={() => {}} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('navega abas com setas e End', async () => {
    render(
      <Tabs
        label="Relatório"
        items={[
          { id: 'um', label: 'Resumo', content: 'Conteúdo resumo' },
          { id: 'dois', label: 'Histórico', content: 'Conteúdo histórico' },
          { id: 'tres', label: 'Detalhes', content: 'Conteúdo detalhes' },
        ]}
      />,
    );
    screen.getByRole('tab', { name: 'Resumo' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Histórico' })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Conteúdo histórico');
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Detalhes' })).toHaveAttribute('aria-selected', 'true');
  });
});
describe('dados fictícios', () => {
  it('busca campanhas sem depender de acentos', async () => {
    render(<CampaignTable onNotify={() => {}} />);
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar campanhas' }), 'colecao');
    expect(screen.getByRole('button', { name: 'Lançamento coleção 2027' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Presença em destaque' })).not.toBeInTheDocument();
  });
  it('filtra por status e remove o filtro visível', async () => {
    render(<CampaignTable onNotify={() => {}} />);
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Filtrar por status' }),
      'Rascunho',
    );
    expect(screen.getByRole('status')).toHaveTextContent('1 campanha(s)');
    await userEvent.click(screen.getByRole('button', { name: 'Remover filtro de status' }));
    expect(screen.getByRole('status')).toHaveTextContent('6 campanha(s)');
  });
  it('ordena e pagina sem duplicar resultados', async () => {
    render(<CampaignTable onNotify={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Investimento' }));
    expect(screen.getByRole('columnheader', { name: 'Investimento' })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Próxima página' }));
    expect(
      screen.getByRole('button', { name: 'Novos caminhos para sua marca' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeDisabled();
  });
  it('só arquiva exemplos após confirmação', async () => {
    const notify = vi.fn();
    render(<CampaignTable onNotify={notify} />);
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Selecionar Conexões que geram negócios' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Arquivar na prévia' }));
    expect(screen.getByRole('button', { name: 'Conexões que geram negócios' })).toBeInTheDocument();
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Arquivar na prévia' }),
    );
    expect(
      screen.queryByRole('button', { name: 'Conexões que geram negócios' }),
    ).not.toBeInTheDocument();
    expect(notify).toHaveBeenCalledWith('Campanhas arquivadas somente nesta prévia.');
  });
  it('oferece recuperação na busca vazia', async () => {
    render(<CampaignTable onNotify={() => {}} />);
    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Buscar campanhas' }),
      'inexistente',
    );
    expect(screen.getByText('Nenhuma campanha encontrada')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(screen.getByRole('status')).toHaveTextContent('6 campanha(s)');
  });
  it('troca métrica e período com alternativa tabular', async () => {
    render(<PerformanceChart />);
    await userEvent.click(screen.getByRole('button', { name: 'Leads' }));
    await userEvent.click(screen.getByRole('button', { name: '7 dias' }));
    expect(screen.getByRole('img')).toHaveAccessibleName(/Leads nos últimos 7 dias/);
    await userEvent.click(screen.getByText('Ver dados em tabela'));
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('23–29 set. 2026 · Exemplo')).toBeInTheDocument();
  });
});
describe('campanha em página, sem backend', () => {
  it('valida o nome e preserva preenchimento ao voltar', async () => {
    render(<CampaignWizard onNotify={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Dê um nome');
    expect(screen.getByLabelText(/Nome da campanha/)).toHaveFocus();
    await userEvent.type(screen.getByLabelText(/Nome da campanha/), 'Campanha teste');
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('heading', { name: 'Encontre o público certo.' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(screen.getByLabelText(/Nome da campanha/)).toHaveValue('Campanha teste');
  });
  it('completa o fluxo sem chamar rede', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch');
    render(<CampaignWizard onNotify={() => {}} />);
    await userEvent.type(screen.getByLabelText(/Nome da campanha/), 'Nova demonstração');
    for (let i = 0; i < 3; i++)
      await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByText('Tudo certo para continuar?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Concluir demonstração' }));
    expect(screen.getByRole('heading', { name: 'Fluxo concluído.' })).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
    fetch.mockRestore();
  });
  it('recupera somente o rascunho da aba', async () => {
    const notify = vi.fn();
    render(<CampaignWizard onNotify={notify} />);
    await userEvent.type(screen.getByLabelText(/Nome da campanha/), 'Rascunho local');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar rascunho local' }));
    await userEvent.clear(screen.getByLabelText(/Nome da campanha/));
    await userEvent.click(screen.getByRole('button', { name: 'Recuperar rascunho local' }));
    expect(screen.getByLabelText(/Nome da campanha/)).toHaveValue('Rascunho local');
  });
});
