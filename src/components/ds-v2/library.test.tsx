import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Button,
  Breadcrumbs,
  DataTable,
  DesignSystemTheme,
  EmptyState,
  FormField,
  Input,
  InlineAlert,
  Select,
  Switch,
  SwitchField,
  Tabs,
  Timeline,
} from './index';

describe('contrato público do Design System V2', () => {
  it('adapta vazio e erro ao espaço que o componente substitui', () => {
    render(
      <DesignSystemTheme>
        <EmptyState
          placement="table"
          tone="error"
          title="Nenhum resultado"
          description="Revise os filtros."
          actions={<Button>Limpar filtros</Button>}
        />
        <InlineAlert title="Falha ao atualizar" tone="error" placement="section">
          Seus filtros foram preservados.
        </InlineAlert>
      </DesignSystemTheme>,
    );
    expect(screen.getByRole('alert', { name: 'Nenhum resultado' })).toHaveAttribute(
      'data-placement',
      'table',
    );
    expect(screen.getByRole('alert', { name: 'Falha ao atualizar' })).toHaveAttribute(
      'data-placement',
      'section',
    );
  });
  it('não envia formulários sem intenção e bloqueia novos cliques ao carregar', async () => {
    const user = userEvent.setup();
    const submit = vi.fn((event) => event.preventDefault());
    const click = vi.fn();
    render(
      <DesignSystemTheme>
        <form onSubmit={submit}>
          <Button onClick={click}>Cancelar</Button>
          <Button type="submit" loading>
            Salvando
          </Button>
        </form>
      </DesignSystemTheme>,
    );
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await user.click(screen.getByRole('button', { name: 'Salvando' }));
    expect(click).toHaveBeenCalledOnce();
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Salvando' })).toHaveAttribute('aria-busy', 'true');
  });

  it('usa seleção por teclado no próprio escopo do tema e devolve o foco', async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const { container } = render(
      <DesignSystemTheme>
        <Select
          label="Formato da mídia"
          defaultValue="display"
          onValueChange={change}
          options={[
            { value: 'display', label: 'Display' },
            { value: 'email', label: 'E-mail' },
          ]}
        />
      </DesignSystemTheme>,
    );
    await user.tab();
    await user.keyboard(' ');
    expect(container.querySelector('[data-controls-root]')).toContainElement(
      screen.getByRole('listbox'),
    );
    await user.keyboard('{End}{Enter}');
    expect(change).toHaveBeenCalledWith('email');
    expect(screen.getByRole('combobox')).toHaveFocus();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('alterna o switch pelo teclado e preserva a regra de bloqueio do consumidor', async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(
      <DesignSystemTheme>
        <Switch label="Veiculação" checked={false} onCheckedChange={change} />
        <Switch label="Aguardando aprovação" checked={false} onCheckedChange={change} disabled />
      </DesignSystemTheme>,
    );
    await user.tab();
    await user.keyboard(' ');
    expect(change).toHaveBeenCalledWith(true);
    await user.click(screen.getByRole('switch', { name: 'Aguardando aprovação' }));
    expect(change).toHaveBeenCalledOnce();
  });

  it('combina switch, contexto e estado visual sem duplicar o nome acessível', () => {
    render(
      <DesignSystemTheme>
        <SwitchField
          label="Veiculação"
          description="Controla a entrega da campanha."
          stateLabel="Ativa"
          checked
          onCheckedChange={() => {}}
        />
      </DesignSystemTheme>,
    );

    const control = screen.getByRole('switch', { name: 'Veiculação' });
    expect(control).toBeChecked();
    expect(control).toHaveAccessibleDescription('Controla a entrega da campanha.');
    expect(screen.getByText('Ativa')).toBeVisible();
  });

  it('associa rótulo e erro sem depender de uma tela de cadastro', () => {
    render(
      <DesignSystemTheme>
        <FormField id="name" label="Nome" required>
          <Input id="name" error="Informe o nome." required />
        </FormField>
      </DesignSystemTheme>,
    );
    const input = screen.getByRole('textbox', { name: 'Nome' });
    expect(input).toHaveAccessibleDescription('Informe o nome.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('expõe ordenação e estado vazio de tabela sem assumir regras de domínio', () => {
    const sort = vi.fn();
    render(
      <DesignSystemTheme>
        <DataTable
          label="Pessoas"
          rows={[]}
          rowKey={(row: { id: string }) => row.id}
          sort={{ key: 'name', direction: 'asc' }}
          onSort={sort}
          columns={[
            { key: 'name', label: 'Nome', width: 240, render: () => null },
            { key: 'actions', label: 'Ações', width: 80, sortable: false, render: () => null },
          ]}
        />
      </DesignSystemTheme>,
    );
    expect(screen.getByRole('button', { name: 'Ordenar por nome' }).closest('th')).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ordenar por nome' }));
    expect(sort).toHaveBeenCalledWith({ key: 'name', direction: 'desc' });
    expect(
      within(screen.getByRole('table')).getByText('Nenhum registro encontrado.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ordenar por ações' })).not.toBeInTheDocument();
  });

  it('permite associar as abas ao painel e navegar com End', async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(
      <DesignSystemTheme>
        <Tabs
          active="all"
          onChange={change}
          values={[
            { id: 'all', label: 'Todas', panelId: 'panel' },
            { id: 'active', label: 'Ativas', panelId: 'panel' },
          ]}
        />
        <div id="panel" role="tabpanel">
          Conteúdo
        </div>
      </DesignSystemTheme>,
    );
    await user.tab();
    await user.keyboard('{End}');
    expect(change).toHaveBeenCalledWith('active');
    expect(screen.getByRole('tab', { name: 'Ativas' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Ativas' })).toHaveAttribute('aria-controls', 'panel');
  });

  it('identifica a página atual e revela níveis recolhidos do breadcrumb', async () => {
    const user = userEvent.setup();
    render(
      <DesignSystemTheme>
        <Breadcrumbs
          maxItems={3}
          items={[
            { label: 'Portal Francal', href: '/portal' },
            { label: 'Planejamento', href: '/planejamento' },
            { label: 'Marketing', href: '/marketing' },
            { label: 'Campanhas', href: '/campanhas' },
            { label: 'Lançamento primavera' },
          ]}
        />
      </DesignSystemTheme>,
    );

    expect(screen.getByText('Lançamento primavera').closest('[aria-current]')).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.queryByRole('link', { name: 'Planejamento' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mostrar 2 níveis ocultos' }));
    expect(screen.getByRole('link', { name: 'Planejamento' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Marketing' })).toBeVisible();
  });

  it('expõe a progressão e os metadados da linha do tempo', () => {
    render(
      <DesignSystemTheme>
        <Timeline
          label="Histórico da campanha"
          items={[
            {
              title: 'Campanha criada',
              description: 'Estrutura inicial definida.',
              date: '29 set, 15:55',
              dateTime: '2026-09-29T15:55:00-03:00',
              state: 'complete',
            },
            {
              title: 'Proposta em revisão',
              date: 'Hoje, 09:40',
              state: 'current',
            },
          ]}
        />
      </DesignSystemTheme>,
    );

    const timeline = screen.getByRole('list', { name: 'Histórico da campanha' });
    expect(within(timeline).getAllByRole('listitem')).toHaveLength(2);
    expect(within(timeline).getByText('Proposta em revisão').closest('li')).toHaveAttribute(
      'aria-current',
      'step',
    );
    expect(within(timeline).getByText('29 set, 15:55')).toHaveAttribute(
      'datetime',
      '2026-09-29T15:55:00-03:00',
    );
  });
});
