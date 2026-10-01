import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Avatar, DesignSystemTheme, Stepper } from '../../components/ds-v2';
import { LeadBoard } from './lead-board';
import { UploadExample, validateLocalFile } from './reference-media';
import { AppearanceExample, SetupChecklist } from './reference-flows';
import type { ReactNode } from 'react';

const setup = (children: ReactNode) => render(<DesignSystemTheme>{children}</DesignSystemTheme>);

describe('padrões refinados com as referências', () => {
  it('recupera as iniciais se a imagem falhar, sem perder a presença acessível', () => {
    const view = setup(<Avatar name="Ana Lima" src="/foto.png" presence="online" />);
    const image = view.container.querySelector('img');
    expect(image).not.toBeNull();
    fireEvent.error(image!);
    expect(screen.getByRole('img', { name: 'Ana Lima, online' })).toHaveTextContent('AL');
    expect(view.container.querySelector('img')).toBeNull();
  });
  it('permite retornar somente às etapas concluídas pelo teclado', async () => {
    const change = vi.fn();
    setup(
      <Stepper
        current={1}
        onStepChange={change}
        steps={[{ label: 'Informações' }, { label: 'Mídias' }, { label: 'Revisão' }]}
      />,
    );
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard('{Enter}');
    expect(change).toHaveBeenCalledWith(0);
    expect(screen.queryByRole('button', { name: 'Revisão' })).not.toBeInTheDocument();
    expect(screen.getByText('Mídias').closest('li')).toHaveAttribute('aria-current', 'step');
  });
  it('move leads pelo menu, atualiza contagens e combina filtros', async () => {
    setup(<LeadBoard />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Ações de Calçados Aurora' }));
    await user.click(screen.getByRole('menuitem', { name: 'Mover para Qualificados' }));
    const qualified = within(screen.getByRole('region', { name: 'Qualificados' }));
    expect(qualified.getByRole('article', { name: 'Calçados Aurora' })).toBeInTheDocument();
    expect(qualified.getByRole('heading', { name: /Qualificados\s*3/ })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Calçados Aurora movido para Qualificados.',
    );
    await user.type(screen.getByRole('textbox', { name: 'Buscar leads' }), 'calcados');
    expect(screen.getAllByRole('article')).toHaveLength(1);
    await user.click(screen.getByRole('combobox', { name: 'Responsável' }));
    await user.click(screen.getByRole('option', { name: 'Pedro Costa' }));
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });
  it('valida a criação do lead e abre o detalhe do novo registro', async () => {
    setup(<LeadBoard />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Novo lead' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Novo lead' }));
    await user.click(dialog.getByRole('button', { name: 'Adicionar lead' }));
    expect(dialog.getByRole('textbox', { name: 'Empresa' })).toHaveFocus();
    await user.type(dialog.getByRole('textbox', { name: 'Empresa' }), 'Empresa de exemplo');
    await user.type(dialog.getByRole('textbox', { name: 'Contato' }), 'Carla');
    await user.click(dialog.getByRole('button', { name: 'Adicionar lead' }));
    await user.click(screen.getByRole('button', { name: 'Empresa de exemplo' }));
    expect(screen.getByRole('dialog', { name: 'Empresa de exemplo' })).toHaveTextContent('Carla');
  });
  it('rejeita arquivos vazios, grandes ou com formato incompatível', () => {
    expect(validateLocalFile({ name: 'arquivo.pdf', type: 'application/pdf', size: 0 })).toContain(
      'vazio',
    );
    expect(
      validateLocalFile({ name: 'arquivo.pdf', type: 'application/pdf', size: 11 * 1024 * 1024 }),
    ).toContain('10 MB');
    expect(
      validateLocalFile({ name: 'arquivo.png', type: 'application/pdf', size: 100 }),
    ).toContain('PNG');
    expect(validateLocalFile({ name: 'ARQUIVO.CSV', type: '', size: 100 })).toBeNull();
  });
  it('seleciona vários arquivos, cancela e retoma sem reintroduzir arquivos removidos', async () => {
    setup(<UploadExample />);
    const user = userEvent.setup();
    await user.upload(screen.getByLabelText('Selecionar arquivos'), [
      new File(['image'], 'novo.png', { type: 'image/png' }),
      new File(['pdf'], 'plano.pdf', { type: 'application/pdf' }),
    ]);
    await user.click(screen.getByRole('button', { name: 'Simular envio' }));
    expect(screen.getByRole('progressbar', { name: 'Envio de novo.png' })).toHaveAttribute(
      'aria-valuenow',
      '25',
    );
    await user.click(screen.getByRole('button', { name: 'Cancelar novo.png' }));
    expect(screen.getByRole('article', { name: 'novo.png' })).toHaveTextContent('Cancelado');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente novo.png' }));
    await user.click(screen.getByRole('button', { name: 'Avançar simulação' }));
    await user.click(screen.getByRole('button', { name: 'Simular falha' }));
    expect(screen.getByRole('article', { name: 'novo.png' })).toHaveTextContent(
      'Conexão interrompida',
    );
    await user.click(screen.getByRole('button', { name: 'Tentar novamente novo.png' }));
    await user.click(screen.getByRole('button', { name: 'Remover plano.pdf' }));
    await user.click(screen.getByRole('button', { name: 'Simular envio' }));
    expect(screen.getByRole('article', { name: 'novo.png' })).not.toHaveTextContent(
      'Conexão interrompida',
    );
    expect(screen.queryByRole('article', { name: 'plano.pdf' })).not.toBeInTheDocument();
  });
  it('abre a seleção de arquivos no tamanho médio com anatomia completa', async () => {
    setup(<UploadExample />);
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: 'Ver em modal' });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Adicionar arquivos' });
    expect(dialog).toHaveAttribute('data-size', 'medium');
    expect(dialog).toHaveAccessibleDescription('Criativos e documentos da campanha');
    expect(within(dialog).getByText('Arquivos selecionados')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Concluir' })).toBeEnabled();
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog', { name: 'Adicionar arquivos' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
  it('descarta a escolha do modal ao cancelar e aplica somente ao salvar', async () => {
    setup(<AppearanceExample notify={() => {}} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Alterar aparência' }));
    await user.click(screen.getByRole('radio', { name: 'Grade' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await user.click(screen.getByRole('button', { name: 'Alterar aparência' }));
    expect(screen.getByRole('radio', { name: 'Destaque' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'Discreto' }));
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(screen.getByText('Discreto')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Alterar aparência' })).toHaveFocus();
  });
  it('abre a prévia local e libera a URL ao fechar', async () => {
    const create = vi.fn(() => 'blob:local-preview');
    const revoke = vi.fn();
    const previousCreate = URL.createObjectURL;
    const previousRevoke = URL.revokeObjectURL;
    URL.createObjectURL = create;
    URL.revokeObjectURL = revoke;
    try {
      setup(<UploadExample />);
      const user = userEvent.setup();
      await user.upload(
        screen.getByLabelText('Selecionar arquivos'),
        new File(['png'], 'peca.png', { type: 'image/png' }),
      );
      await user.click(screen.getByRole('button', { name: 'Ver peca.png' }));
      expect(screen.getByRole('img', { name: 'Prévia de peca.png' })).toHaveAttribute(
        'src',
        'blob:local-preview',
      );
      await user.click(screen.getByRole('button', { name: 'Fechar janela' }));
      expect(revoke).toHaveBeenCalledWith('blob:local-preview');
    } finally {
      URL.createObjectURL = previousCreate;
      URL.revokeObjectURL = previousRevoke;
    }
  });
  it('atualiza o checklist por tarefa sem duplicar uma conclusão', async () => {
    setup(<SetupChecklist />);
    const user = userEvent.setup();
    await user.click(
      within(screen.getByText('Catálogo de mídias').closest('li')!).getByRole('button', {
        name: 'Configurar',
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Marcar como concluído' }));
    expect(screen.getByText('2 de 4 concluídos')).toBeInTheDocument();
    await user.click(
      within(screen.getByText('Catálogo de mídias').closest('li')!).getByRole('button', {
        name: 'Revisar',
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Marcar como concluído' }));
    expect(screen.getByText('2 de 4 concluídos')).toBeInTheDocument();
  });
});
