/**
 * `EditableTitle`: título em repouso, campo ao editar. Enter salva e devolve o foco, Esc desfaz,
 * sair do campo salva, vazio e igual não salvam, contador perto do limite, erro, salvando e
 * somente leitura.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { EditableTitle } from './editable-title';

function Controlled({ onCommit = vi.fn() }: { onCommit?: (value: string) => void }) {
  const [value, setValue] = useState('Entrevista Ateliê Sul');
  return (
    <>
      <EditableTitle
        label="Nome da produção"
        value={value}
        maxLength={30}
        onCommit={(next) => {
          setValue(next);
          onCommit(next);
        }}
      />
      <button type="button">Depois</button>
    </>
  );
}

describe('EditableTitle', () => {
  it('em repouso é um título com botão que descreve a ação', () => {
    render(
      <EditableTitle label="Título do artigo" value="Couro reaproveitado" onCommit={vi.fn()} />,
    );
    const heading = screen.getByRole('heading', { level: 1, name: 'Couro reaproveitado' });
    const trigger = screen.getByRole('button', { name: 'Couro reaproveitado' });
    expect(heading).toContainElement(trigger);
    expect(trigger).toHaveAccessibleDescription('Editar título do artigo');
  });

  it('abre pelo teclado com tudo selecionado; Enter salva e devolve o foco ao título', async () => {
    const user = userEvent.setup();
    const commit = vi.fn();
    render(<Controlled onCommit={commit} />);

    await user.tab();
    const trigger = screen.getByRole('button', { name: 'Entrevista Ateliê Sul' });
    expect(trigger).toHaveFocus();
    await user.keyboard('{Enter}');

    const field = screen.getByRole('textbox', { name: 'Nome da produção' });
    expect(field).toHaveFocus();
    expect(field).toHaveValue('Entrevista Ateliê Sul');
    expect((field as HTMLTextAreaElement).selectionStart).toBe(0);
    expect((field as HTMLTextAreaElement).selectionEnd).toBe('Entrevista Ateliê Sul'.length);

    await user.keyboard('  Perfil   Juliana Prates ');
    await user.keyboard('{Enter}');

    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith('Perfil Juliana Prates');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Perfil Juliana Prates' })).toHaveFocus();
  });

  it('Esc desfaz, chama onCancel e devolve o rascunho a quem acompanha', async () => {
    const user = userEvent.setup();
    const commit = vi.fn();
    const change = vi.fn();
    const cancel = vi.fn();
    render(
      <EditableTitle
        label="Nome da produção"
        value="Entrevista Ateliê Sul"
        onCommit={commit}
        onChange={change}
        onCancel={cancel}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Entrevista Ateliê Sul' }));
    await user.keyboard('Rascunho novo');
    expect(change).toHaveBeenLastCalledWith('Rascunho novo');

    await user.keyboard('{Escape}');
    expect(commit).not.toHaveBeenCalled();
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(change).toHaveBeenLastCalledWith('Entrevista Ateliê Sul');
    expect(screen.getByRole('button', { name: 'Entrevista Ateliê Sul' })).toHaveFocus();
  });

  it('sair do campo salva; vazio ou igual não salvam', async () => {
    const user = userEvent.setup();
    const commit = vi.fn();
    render(<Controlled onCommit={commit} />);

    await user.click(screen.getByRole('button', { name: 'Entrevista Ateliê Sul' }));
    await user.keyboard('Entrevista Ateliê Sul');
    await user.tab();
    expect(commit).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Entrevista Ateliê Sul' }));
    await user.clear(screen.getByRole('textbox'));
    await user.keyboard('{Enter}');
    expect(commit).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Entrevista Ateliê Sul' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Entrevista Ateliê Sul' }));
    await user.keyboard('Perfil da fundadora');
    await user.click(screen.getByRole('button', { name: 'Depois' }));
    expect(commit).toHaveBeenCalledWith('Perfil da fundadora');
    expect(screen.getByRole('button', { name: 'Perfil da fundadora' })).toBeInTheDocument();
  });

  it('não aceita quebra de linha e mostra o contador a partir de 80% do limite', async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    await user.click(screen.getByRole('button', { name: 'Entrevista Ateliê Sul' }));
    const field = screen.getByRole('textbox', { name: 'Nome da produção' });
    expect(field).toHaveAttribute('maxLength', '30');
    expect(screen.queryByText(/\/30$/)).not.toBeInTheDocument();

    await user.clear(field);
    await user.keyboard('Entrevista com a fundadora');
    expect(screen.getByText('26/30')).toBeInTheDocument();

    await user.keyboard('{Shift>}{Enter}{/Shift}');
    expect(field).not.toBeInTheDocument();
  });

  it('erro marca o campo e descreve; salvando avisa e marca aria-busy', () => {
    const { container, rerender } = render(
      <EditableTitle
        label="Nome da produção"
        value="Entrevista Ateliê Sul"
        error="Já existe uma produção com este nome"
        onCommit={vi.fn()}
        defaultEditing
      />,
    );
    const field = screen.getByRole('textbox', { name: 'Nome da produção' });
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleDescription('Já existe uma produção com este nome');
    expect(field).not.toHaveFocus();

    rerender(
      <EditableTitle
        label="Nome da produção"
        value="Entrevista Ateliê Sul"
        onCommit={vi.fn()}
        saving
      />,
    );
    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');
  });

  it('somente leitura é só o título; vazio mostra o placeholder', () => {
    const { rerender } = render(
      <EditableTitle label="Nome do slide" size="card" value="Capa" onCommit={vi.fn()} readOnly />,
    );
    expect(screen.getByRole('heading', { level: 3, name: 'Capa' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    rerender(<EditableTitle label="Nome do slide" size="card" value="" onCommit={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Sem título' })).toBeInTheDocument();
  });

  it('edição controlada avisa a mudança e respeita o valor de fora', async () => {
    const user = userEvent.setup();
    const editing = vi.fn();
    const { rerender } = render(
      <EditableTitle
        label="Nome da produção"
        value="Entrevista Ateliê Sul"
        onCommit={vi.fn()}
        editing={false}
        onEditingChange={editing}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Entrevista Ateliê Sul' }));
    expect(editing).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    rerender(
      <EditableTitle
        label="Nome da produção"
        value="Entrevista Ateliê Sul"
        onCommit={vi.fn()}
        editing
        onEditingChange={editing}
        autoFocus
      />,
    );
    expect(screen.getByRole('textbox', { name: 'Nome da produção' })).toHaveValue(
      'Entrevista Ateliê Sul',
    );
  });
});
