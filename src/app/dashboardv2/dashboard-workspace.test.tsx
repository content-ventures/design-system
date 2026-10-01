import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { CampaignProvider } from '../campanhas/campaign-context';
import { DashboardWorkspace } from './dashboard-workspace';

const setup = () =>
  render(
    <CampaignProvider>
      <DashboardWorkspace />
    </CampaignProvider>,
  );
beforeEach(() => {
  window.history.replaceState(null, '', '/dashboardv2');
});
const choose = async (user: ReturnType<typeof userEvent.setup>, label: string, option: string) => {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(screen.getByRole('option', { name: option }));
};
const link = (name: string | RegExp) =>
  within(screen.getByRole('navigation', { name: 'Menu principal' })).getByRole('link', { name });

describe('dashboardv2 — navegação e veiculação', () => {
  it('pausa e retoma pelo teclado, preservando a campanha ao navegar entre áreas', async () => {
    setup();
    const user = userEvent.setup();
    const name = 'Veiculação de Novas conexões, grandes negócios';
    const control = screen.getByRole('switch', { name });
    control.focus();
    await user.keyboard(' ');
    expect(control).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('status')).toHaveTextContent('veiculação desativada');
    await user.click(link('Inventário'));
    expect(screen.getByRole('heading', { name: 'Inventário', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Superbanner · Página inicial')).toBeInTheDocument();
    await user.click(link('Campanhas'));
    const paused = screen.getByRole('switch', { name });
    expect(paused).toHaveAttribute('aria-checked', 'false');
    await user.click(paused);
    expect(paused).toHaveAttribute('aria-checked', 'true');
  });

  it('impede ativação de campanhas sem aprovação ou já concluídas', () => {
    setup();
    for (const name of [
      'Sua marca em primeiro plano',
      'Uma nova temporada de possibilidades',
      'Presença que se transforma em conexão',
    ]) {
      const control = screen.getByRole('switch', { name: `Veiculação de ${name}` });
      expect(control).toBeDisabled();
      expect(control).toHaveAttribute('aria-checked', 'false');
    }
  });

  it('combina busca e anunciante e recupera resultados vazios', async () => {
    setup();
    const user = userEvent.setup();
    await choose(user, 'Filtrar por anunciante', 'Aurora');
    expect(screen.getAllByRole('switch')).toHaveLength(2);
    await user.type(screen.getByRole('textbox', { name: 'Buscar campanhas' }), 'novas conexoes');
    expect(screen.getAllByRole('switch')).toHaveLength(1);
    await user.type(screen.getByRole('textbox', { name: 'Buscar campanhas' }), ' inexistente');
    expect(
      screen.getByRole('heading', { name: 'Nenhum resultado encontrado' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(screen.getAllByRole('switch')).toHaveLength(7);
  });

  it('cria rascunho e abre detalhes sem sair do Dashboard V2', async () => {
    setup();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Nova campanha' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Nome da campanha' }),
      'Campanha de outubro',
    );
    await user.type(screen.getByRole('textbox', { name: 'Verba planejada (R$)' }), '12000');
    await user.click(screen.getByRole('checkbox', { name: 'Newsletter' }));
    await user.click(screen.getByRole('button', { name: 'Criar rascunho' }));
    expect(window.location.pathname).toBe('/dashboardv2');
    expect(
      screen.getByRole('switch', { name: 'Veiculação de Campanha de outubro' }),
    ).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Campanha de outubro' }));
    expect(screen.getByRole('heading', { name: 'Campanha de outubro' })).toBeInTheDocument();
    expect(window.location.hash).toMatch(/^#campanhas\/demo-/);
    await user.click(screen.getByRole('button', { name: 'Todas as campanhas' }));
    expect(screen.getByRole('button', { name: 'Campanha de outubro' })).toBeInTheDocument();
  });
});

describe('dashboardv2 — estrutura do produto', () => {
  it('mantém o cabeçalho da página direto, sem ícone decorativo nem texto auxiliar', () => {
    setup();
    const heading = screen.getByRole('heading', { name: 'Campanhas', level: 1 });

    expect(heading.querySelector('svg')).toBeNull();
    expect(screen.queryByText('Todas as suas campanhas, em um só lugar.')).not.toBeInTheDocument();
  });

  it('abre links diretos e acompanha o histórico da navegação', async () => {
    window.history.replaceState(null, '', '/dashboardv2#publicos');
    setup();
    expect(screen.getByRole('heading', { name: 'Públicos', level: 1 })).toBeInTheDocument();
    await userEvent.click(link('Inventário'));
    act(() => {
      window.history.replaceState(null, '', '/dashboardv2#publicos');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.getByRole('heading', { name: 'Públicos', level: 1 })).toHaveFocus();
    expect(link('Públicos')).toHaveAttribute('aria-current', 'page');
  });

  it('cadastra e edita um público, preservando os dados durante a navegação', async () => {
    setup();
    const user = userEvent.setup();
    await user.click(link('Públicos'));
    await user.click(screen.getByRole('button', { name: 'Novo público' }));
    await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'Comunidade de arquitetura');
    await user.clear(screen.getByRole('spinbutton', { name: 'Tamanho da base' }));
    await user.type(screen.getByRole('spinbutton', { name: 'Tamanho da base' }), '1000');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    await user.click(link('Canais'));
    await user.click(link('Públicos'));
    await user.click(screen.getByRole('button', { name: 'Comunidade de arquitetura' }));
    expect(screen.getByText('1.000')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Editar' }));
    await choose(user, 'Status', 'Arquivado');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    await user.click(screen.getByRole('tab', { name: 'Arquivado' }));
    expect(screen.getByRole('button', { name: 'Comunidade de arquitetura' })).toBeInTheDocument();
  });

  it('filtra inventário por teclado mantendo uma lista contínua', async () => {
    setup();
    const user = userEvent.setup();
    await user.click(link('Inventário'));
    screen.getByRole('tab', { name: /Todos/ }).focus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Parcialmente reservado' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Parcialmente reservado' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getAllByRole('table')).toHaveLength(1);
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(
      screen.queryByRole('region', { name: 'Parcialmente reservado' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Superbanner · Conteúdo' })).toBeInTheDocument();
  });

  it('move um lead e mantém a nova etapa na visualização em lista', async () => {
    setup();
    const user = userEvent.setup();
    await user.click(link(/^Leads/));
    await choose(user, 'Etapa de Marina Costa', 'Qualificado');
    const stage = screen.getByRole('region', { name: 'Qualificado' });
    expect(within(stage).getByRole('button', { name: 'Marina Costa' })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Lista' }));
    expect(
      within(screen.getByRole('table', { name: 'Leads' })).getByRole('button', {
        name: 'Marina Costa',
      }),
    ).toBeInTheDocument();
    await user.click(link('Inventário'));
    await user.click(link(/^Leads/));
    expect(screen.getByRole('combobox', { name: 'Etapa de Marina Costa' })).toHaveTextContent(
      'Qualificado',
    );
  });

  it('apresenta as estruturas do anunciante e da administração pelo seletor de visualização', async () => {
    setup();
    const user = userEvent.setup();
    await choose(user, 'Visualização', 'Visão do anunciante');
    expect(link('Catálogo de Mídia')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Fornecedores' })).not.toBeInTheDocument();
    await user.click(link('Campanhas'));
    expect(screen.getAllByRole('switch')).toHaveLength(2);
    await choose(user, 'Visualização', 'Administração');
    await user.click(link('Portais'));
    expect(screen.getByRole('heading', { name: 'Portais', level: 1 })).toBeInTheDocument();
    expect(window.location.hash).toBe('#plataforma/portais');
  });
});
