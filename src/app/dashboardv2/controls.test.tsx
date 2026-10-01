import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CampaignProvider } from '../campanhas/campaign-context';
import { DashboardWorkspace } from './dashboard-workspace';
import { SelectControl, selectOptions } from './controls';

beforeEach(() => window.history.replaceState(null, '', '/dashboardv2#campanhas/novo'));
const setup = () =>
  render(
    <CampaignProvider>
      <DashboardWorkspace />
    </CampaignProvider>,
  );

describe('controles do Dashboard V2', () => {
  it('seleciona pelo teclado, fecha com Escape e mantém o valor cancelado', async () => {
    const change = vi.fn();
    render(
      <SelectControl
        label="Categoria"
        options={selectOptions(['Digital', 'Presencial', 'Híbrido'])}
        onValueChange={change}
      />,
    );
    const user = userEvent.setup();
    const trigger = screen.getByRole('combobox', { name: 'Categoria' });
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('listbox')).toBeVisible();
    await user.keyboard('{End}{Enter}');
    expect(trigger).toHaveTextContent('Híbrido');
    expect(trigger).toHaveFocus();
    expect(change).toHaveBeenLastCalledWith('Híbrido');
    await user.keyboard('{Enter}{Home}{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveTextContent('Híbrido');
    expect(trigger).toHaveFocus();
  });

  it('fecha ao clicar fora, respeita desabilitados e inclui a seleção no formulário', async () => {
    const submit = vi.fn();
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(new FormData(event.currentTarget).get('category'));
        }}
      >
        <SelectControl
          label="Categoria"
          name="category"
          options={[
            { value: 'digital', label: 'Digital' },
            { value: 'presencial', label: 'Presencial', disabled: true },
          ]}
        />
        <button type="submit">Salvar</button>
        <SelectControl label="Bloqueado" disabled options={selectOptions(['Indisponível'])} />
      </form>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('combobox', { name: 'Categoria' }));
    expect(screen.getByRole('option', { name: 'Presencial' })).toHaveAttribute('data-disabled');
    await user.pointer({ target: document.documentElement, keys: '[MouseLeft]' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Bloqueado' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(submit).toHaveBeenCalledWith('digital');
  });

  it('valida campos vazios com foco e mensagem acessível sem perder o que foi digitado', async () => {
    setup();
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox', { name: 'Nome da campanha' }), '   ');
    await user.click(screen.getByRole('button', { name: 'Criar rascunho' }));
    const name = screen.getByRole('textbox', { name: 'Nome da campanha' });
    expect(name).toHaveFocus();
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAccessibleDescription('Preencha este campo.');
    await user.type(name, 'Campanha de demonstração');
    expect(name).not.toHaveAttribute('aria-invalid');
    expect(screen.getByRole('textbox', { name: 'Verba planejada (R$)' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(name).toHaveValue('   Campanha de demonstração');
  });

  it('aceita valor brasileiro com centavos, mantém o anunciante escolhido e salva o valor exato', async () => {
    setup();
    const user = userEvent.setup();
    await user.type(
      screen.getByRole('textbox', { name: 'Nome da campanha' }),
      'Conexões de outubro',
    );
    await user.click(screen.getByRole('combobox', { name: 'Anunciante' }));
    await user.click(screen.getByRole('option', { name: 'Estúdio Norte' }));
    const money = screen.getByRole('textbox', { name: 'Verba planejada (R$)' });
    await user.type(money, '1.234,56');
    await user.tab();
    expect(money).toHaveValue('1.234,56');
    await user.click(screen.getByRole('checkbox', { name: 'Newsletter' }));
    await user.click(screen.getByRole('button', { name: 'Criar rascunho' }));
    await user.click(screen.getByRole('button', { name: 'Conexões de outubro' }));
    expect(screen.getByText('R$ 1.234,56')).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getAllByText('Estúdio Norte')).toHaveLength(2);
  });

  it('rejeita um valor monetário inválido em vez de convertê-lo silenciosamente', async () => {
    setup();
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox', { name: 'Nome da campanha' }), 'Minha campanha');
    const money = screen.getByRole('textbox', { name: 'Verba planejada (R$)' });
    await user.type(money, '1,2,3');
    await user.click(screen.getByRole('button', { name: 'Criar rascunho' }));
    expect(money).toHaveFocus();
    expect(money).toHaveAccessibleDescription('Use um valor como 1.234,56.');
    expect(window.location.hash).toBe('#campanhas/novo');
  });

  it('associa erro de período ao término e preserva os outros campos', async () => {
    setup();
    const user = userEvent.setup();
    await user.type(
      screen.getByRole('textbox', { name: 'Nome da campanha' }),
      'Período em revisão',
    );
    await user.type(screen.getByRole('textbox', { name: 'Verba planejada (R$)' }), '1500');
    await user.click(screen.getByRole('checkbox', { name: 'Superbanner' }));
    const end = screen.getByLabelText('Término');
    await user.clear(end);
    await user.type(end, '2026-09-01');
    await user.click(screen.getByRole('button', { name: 'Criar rascunho' }));
    expect(end).toHaveFocus();
    expect(end).toHaveAccessibleDescription('O término deve ser igual ou posterior ao início.');
    expect(screen.getByRole('textbox', { name: 'Nome da campanha' })).toHaveValue(
      'Período em revisão',
    );
  });
  it('seleciona uma data no calendário e devolve o foco ao campo', async () => {
    setup();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Abrir calendário de início' }));
    expect(screen.getByRole('dialog', { name: 'Calendário de início' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'segunda-feira, 5 de outubro de 2026' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Início' })).toHaveValue('05/10/2026');
    expect(screen.getByRole('textbox', { name: 'Início' })).toHaveFocus();
  });

  it('rejeita uma data inexistente sem normalizá-la para outro mês', async () => {
    setup();
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox', { name: 'Nome da campanha' }), 'Período inválido');
    await user.type(screen.getByRole('textbox', { name: 'Verba planejada (R$)' }), '1500');
    const date = screen.getByRole('textbox', { name: 'Término' });
    await user.clear(date);
    await user.type(date, '31/02/2026');
    await user.click(screen.getByRole('checkbox', { name: 'Newsletter' }));
    await user.click(screen.getByRole('button', { name: 'Criar rascunho' }));
    expect(date).toHaveFocus();
    expect(date).toHaveValue('31/02/2026');
    expect(date).toHaveAccessibleDescription('Informe uma data válida no formato dd/mm/aaaa.');
    expect(window.location.hash).toBe('#campanhas/novo');
  });
});
