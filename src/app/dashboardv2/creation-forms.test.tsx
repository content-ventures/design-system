import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { CampaignProvider } from '../campanhas/campaign-context';
import { DashboardWorkspace } from './dashboard-workspace';

beforeEach(() => window.history.replaceState(null, '', '/dashboardv2#campanhas/novo'));
const setup = () =>
  render(
    <CampaignProvider>
      <DashboardWorkspace />
    </CampaignProvider>,
  );
const visit = (hash: string) =>
  act(() => {
    window.history.pushState(null, '', hash);
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
const choose = async (user: ReturnType<typeof userEvent.setup>, label: string, option: string) => {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(screen.getByRole('option', { name: option }));
};

describe('criação refinada — campos e resumo', () => {
  it('atualiza resumo, datas do calendário e mídia sem marcar informações incompletas como prontas', async () => {
    setup();
    const user = userEvent.setup();
    const summary = within(screen.getByRole('complementary', { name: 'Resumo da campanha' }));
    expect(screen.getByRole('heading', { name: 'Nova campanha', level: 1 })).toBeInTheDocument();
    expect(
      summary.getByRole('button', { name: 'Investimento e período Pendente' }),
    ).toBeInTheDocument();
    await user.type(
      screen.getByRole('textbox', { name: 'Nome da campanha' }),
      'Outubro em movimento',
    );
    await user.type(screen.getByRole('textbox', { name: 'Verba planejada (R$)' }), '3.200,49');
    await choose(user, 'Anunciante', 'Estúdio Norte');
    await user.click(screen.getByRole('checkbox', { name: 'Newsletter' }));
    await user.click(screen.getByRole('button', { name: 'Abrir calendário de início' }));
    await user.click(screen.getByRole('button', { name: 'segunda-feira, 5 de outubro de 2026' }));
    expect(summary.getByText('Outubro em movimento')).toBeInTheDocument();
    expect(summary.getByText('Estúdio Norte · Rascunho')).toBeInTheDocument();
    expect(summary.getByText('R$ 3.200,49')).toBeInTheDocument();
    expect(summary.getByText('27 dias')).toBeInTheDocument();
    expect(summary.getByText('Newsletter')).toBeInTheDocument();
    expect(summary.getAllByRole('button', { name: /Preenchido/ })).toHaveLength(3);
    await user.clear(screen.getByRole('textbox', { name: 'Verba planejada (R$)' }));
    expect(
      summary.getByRole('button', { name: 'Investimento e período Pendente' }),
    ).toBeInTheDocument();
    await user.click(summary.getByRole('button', { name: 'Mídias selecionadas Preenchido' }));
    expect(screen.getByRole('heading', { name: 'Mídia e entrega' })).toHaveFocus();
    expect(window.location.hash).toBe('#campanhas/novo');
  });

  it('seleciona apenas um formato, vincula opções da sessão e salva o ativo com centavos', async () => {
    visit('#publicos/novo');
    setup();
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'Público recém-criado');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    visit('#inventario/novo');
    await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'Newsletter · Outubro');
    await user.click(screen.getByRole('radio', { name: 'E-mail' }));
    expect(screen.getByRole('radio', { name: 'Display' })).not.toBeChecked();
    await choose(user, 'Canal', 'Newsletter Francal');
    await choose(user, 'Público', 'Público recém-criado');
    await user.clear(screen.getByRole('spinbutton', { name: 'Disponível' }));
    await user.type(screen.getByRole('spinbutton', { name: 'Disponível' }), '4');
    await user.type(screen.getByRole('textbox', { name: 'Preço-base' }), '2.450,90');
    const summary = within(screen.getByRole('complementary', { name: 'Resumo do ativo' }));
    expect(summary.getByText('Público recém-criado')).toBeInTheDocument();
    expect(summary.getByText('R$ 2.450,90')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    await user.click(screen.getByRole('button', { name: 'Newsletter · Outubro' }));
    expect(screen.getByRole('heading', { name: 'Newsletter · Outubro' })).toBeInTheDocument();
    expect(screen.getByText('Público recém-criado')).toBeInTheDocument();
    expect(screen.getByText('R$ 2.450,90')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Editar' }));
    expect(screen.getByRole('radio', { name: 'E-mail' })).toBeChecked();
    expect(screen.getByRole('textbox', { name: 'Preço-base' })).toHaveValue('2.450,90');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('heading', { name: 'Newsletter · Outubro' })).toBeInTheDocument();
  });

  it('anuncia erros, mantém o preenchimento e não envia ao navegar pelo resumo', async () => {
    setup();
    const user = userEvent.setup();
    await user.type(
      screen.getByRole('textbox', { name: 'Nome da campanha' }),
      'Campanha em revisão',
    );
    await user.click(screen.getByRole('button', { name: 'Criar rascunho' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Revise os 2 campos sinalizados.');
    expect(screen.getByRole('textbox', { name: 'Verba planejada (R$)' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Informações da campanha Preenchido' }));
    expect(screen.getByRole('textbox', { name: 'Nome da campanha' })).toHaveValue(
      'Campanha em revisão',
    );
    expect(window.location.hash).toBe('#campanhas/novo');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(window.location.hash).toBe('#campanhas');
    expect(screen.queryByRole('button', { name: 'Campanha em revisão' })).not.toBeInTheDocument();
  });
});
