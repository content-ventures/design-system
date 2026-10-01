import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { DesignSystemTheme } from '../../components/ds-v2';
import { AgendaExample } from './agenda-specimen';
import { InviteMembersDialog } from './invite-specimen';
import { SettingsExample, DirectoryExample } from './settings-specimen';
import { PlansExample, InlineNotices, RecordDetail, DetailLayerExample } from './context-specimens';
const setup = (child: ReactNode) => render(<DesignSystemTheme>{child}</DesignSystemTheme>);

describe('composições de agenda, configurações e contexto', () => {
  it('navega dias pelo teclado, valida o horário e aceita um evento de dia inteiro', async () => {
    setup(<AgendaExample />);
    const user = userEvent.setup();
    const selectedDay = screen.getByRole('button', {
      name: /6 de outubro de 2026, selecionado, com eventos/,
    });
    act(() => selectedDay.focus());
    await user.keyboard('{ArrowRight}{Enter}');
    expect(screen.getByText('Nenhum evento neste período.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Novo evento' }));
    const dialog = within(screen.getByRole('dialog'));
    await user.type(dialog.getByRole('textbox', { name: 'Título' }), 'Entrega da campanha');
    fireEvent.change(dialog.getByLabelText('Término'), { target: { value: '08:00' } });
    await user.click(dialog.getByRole('button', { name: 'Salvar evento' }));
    expect(dialog.getByRole('alert')).toHaveTextContent('O término precisa ser depois do início.');
    expect(dialog.getByLabelText('Término')).toHaveAttribute('aria-invalid', 'true');
    await user.click(dialog.getByRole('switch', { name: 'Dia inteiro' }));
    await user.type(dialog.getByLabelText('Notas do evento'), 'Conferir os links.');
    await user.click(dialog.getByRole('button', { name: 'Salvar evento' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Entrega da campanha.*Dia inteiro/ }));
    expect(screen.getByLabelText('Notas do evento')).toHaveValue('Conferir os links.');
  });

  it('cancelar a edição não modifica o evento original', async () => {
    setup(<AgendaExample />);
    const user = userEvent.setup();
    await user.click(
      screen.getByRole('button', { name: /Revisão de criativos · Aurora Confirmado/ }),
    );
    const title = screen.getByRole('textbox', { name: 'Título' });
    await user.clear(title);
    await user.type(title, 'Outra revisão');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(
      screen.getByRole('button', { name: /Revisão de criativos · Aurora Confirmado/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Outra revisão/ })).not.toBeInTheDocument();
  });

  it('abre participantes para baixo com identidade e e-mail', async () => {
    setup(<AgendaExample />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Novo evento' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Novo evento' }));

    await user.click(dialog.getByRole('combobox', { name: 'Participantes' }));

    const options = dialog.getByRole('listbox', { name: 'Participantes' });
    expect(options).toHaveAttribute('data-placement', 'bottom');
    expect(within(options).getByText('ana.lima@mediaon.com.br')).toBeVisible();
    expect(within(options).getByText('pedro.costa@mediaon.com.br')).toBeVisible();
    expect(options.querySelectorAll('[data-option-visual]')).toHaveLength(3);
  });

  it('alterna entre as visualizações de mês, semana, dia e agenda', async () => {
    setup(<AgendaExample />);
    const user = userEvent.setup();
    const views = within(screen.getByRole('group', { name: 'Visualização da agenda' }));

    expect(views.getByRole('button', { name: 'Mês' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(views.getByRole('button', { name: 'Semana' }));
    expect(views.getByRole('button', { name: 'Semana' })).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: /Revisão de criativos · Aurora Confirmado/ }),
    ).toBeInTheDocument();

    await user.click(views.getByRole('button', { name: 'Dia' }));
    expect(views.getByRole('button', { name: 'Dia' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('09:00')).toBeInTheDocument();

    await user.click(views.getByRole('button', { name: 'Agenda' }));
    expect(views.getByRole('button', { name: 'Agenda' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Próximos eventos')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Aprovação do plano de mídia Pendente/ }),
    ).toBeInTheDocument();
  });

  it('valida todos os destinatários, evita duplicatas e adiciona convites de uma vez', async () => {
    const invite = vi.fn();
    const close = vi.fn();
    setup(
      <InviteMembersDialog
        open
        onClose={close}
        onInvite={invite}
        members={[
          { name: 'Ana', email: 'ana@example.com', role: 'Administrador', status: 'Ativo' },
        ]}
      />,
    );
    const user = userEvent.setup();
    const emails = screen.getByRole('textbox', { name: 'E-mails' });
    await user.type(emails, 'ANA@example.com, bia@example.com');
    await user.click(screen.getByRole('button', { name: 'Adicionar convites' }));
    expect(emails).toHaveAccessibleDescription('ana@example.com já faz parte deste exemplo.');
    expect(invite).not.toHaveBeenCalled();
    await user.clear(emails);
    await user.type(emails, 'bia@example.com, inválido');
    await user.click(screen.getByRole('button', { name: 'Adicionar convites' }));
    expect(invite).not.toHaveBeenCalled();
    await user.clear(emails);
    await user.type(emails, 'bia@example.com, carla@example.com, bia@example.com');
    await user.click(screen.getByRole('button', { name: 'Adicionar convites' }));
    expect(invite).toHaveBeenCalledWith([
      { name: 'bia', email: 'bia@example.com', role: 'Editor', status: 'Convite pendente' },
      { name: 'carla', email: 'carla@example.com', role: 'Editor', status: 'Convite pendente' },
    ]);
    expect(close).toHaveBeenCalledOnce();
  });

  it('bloqueia convites além da capacidade apresentada', async () => {
    const invite = vi.fn();
    setup(
      <InviteMembersDialog
        open
        onClose={() => {}}
        onInvite={invite}
        members={Array.from({ length: 10 }, (_, i) => ({
          name: `Pessoa ${i}`,
          email: `p${i}@example.com`,
          role: 'Leitor',
          status: 'Ativo',
        }))}
      />,
    );
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox', { name: 'E-mails' }), 'nova@example.com');
    await user.click(screen.getByRole('button', { name: 'Adicionar convites' }));
    expect(screen.getByRole('textbox', { name: 'E-mails' })).toHaveAccessibleDescription(
      'Há 0 lugares disponíveis neste exemplo.',
    );
    expect(invite).not.toHaveBeenCalled();
  });

  it('preserva rascunho entre abas e descarta somente alterações não salvas', async () => {
    const notify = vi.fn();
    setup(<SettingsExample notify={notify} />);
    const user = userEvent.setup();
    const name = screen.getByRole('textbox', { name: 'Nome da empresa' });
    await user.clear(name);
    await user.type(name, 'Novo portal');
    await user.click(screen.getByRole('tab', { name: 'Aparência' }));
    await user.click(screen.getByRole('radio', { name: /Compacta/ }));
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(notify).toHaveBeenCalledWith('Configurações salvas nesta demonstração.');
    await user.click(screen.getByRole('radio', { name: /Padrão/ }));
    await user.click(screen.getByRole('button', { name: 'Descartar' }));
    expect(screen.getByRole('radio', { name: /Compacta/ })).toBeChecked();
    await user.click(screen.getByRole('tab', { name: 'Empresa' }));
    expect(screen.getByRole('textbox', { name: 'Nome da empresa' })).toHaveValue('Novo portal');
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeDisabled();
  });

  it('mantém o mapeamento anterior ao descartar a edição de um papel', async () => {
    setup(<DirectoryExample />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('combobox', { name: 'Papel do grupo Comercial' }));
    await user.click(screen.getByRole('option', { name: 'Leitor' }));
    await user.click(screen.getByRole('button', { name: 'Descartar' }));
    expect(screen.getByRole('combobox', { name: 'Papel do grupo Comercial' })).toHaveTextContent(
      'Editor',
    );
    expect(screen.getByRole('button', { name: 'Salvar mapeamento' })).toBeDisabled();
  });

  it('apresenta o total anual antes de confirmar a seleção do plano', async () => {
    setup(<PlansExample />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Anual' }));
    await user.click(screen.getByRole('button', { name: 'Escolher Profissional' }));
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByText(/14\.304/)).toBeInTheDocument();
    await user.click(dialog.getByRole('button', { name: 'Voltar' }));
    expect(screen.getByText(/Plano selecionado: Essencial/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Escolher Profissional' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar no exemplo' }));
    expect(screen.getByRole('status')).toHaveTextContent(
      'Profissional · anual selecionado apenas no exemplo.',
    );
  });

  it('resolve e dispensa avisos sem alterar os demais', async () => {
    setup(<InlineNotices />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Simular nova validação' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Arquivo validado no exemplo')).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Dispensar: Novos filtros disponíveis no inventário' }),
    );
    expect(screen.queryByText('Novos filtros disponíveis no inventário')).not.toBeInTheDocument();
    expect(screen.getByText('Confirme o prazo antes de reservar a mídia')).toBeInTheDocument();
  });

  it('anexa notas e mudanças de etapa ao histórico do registro', async () => {
    setup(<RecordDetail notify={vi.fn()} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Adicionar uma nota'), 'Cliente aprovou os formatos.');
    await user.click(screen.getByRole('button', { name: 'Registrar nota' }));
    expect(screen.getByRole('list')).toHaveTextContent('Cliente aprovou os formatos.');
    expect(screen.getByLabelText('Adicionar uma nota')).toHaveValue('');
    await user.click(screen.getByRole('combobox', { name: 'Etapa da oportunidade' }));
    await user.click(screen.getByRole('option', { name: 'Ganho' }));
    expect(screen.getByRole('list')).toHaveTextContent('Etapa alterada para Ganho');
  });
  it('conserva uma nota ao fechar e reabrir o painel de detalhes', async () => {
    setup(<DetailLayerExample notify={vi.fn()} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Abrir detalhe do lead' }));
    await user.type(screen.getByLabelText('Adicionar uma nota'), 'Retorno agendado.');
    await user.click(screen.getByRole('button', { name: 'Registrar nota' }));
    await user.click(screen.getByRole('button', { name: 'Fechar detalhe' }));
    await user.click(screen.getByRole('button', { name: 'Abrir detalhe do lead' }));
    expect(screen.getByRole('list')).toHaveTextContent('Retorno agendado.');
  });
});
