import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { DesignSystemTheme, Button, Dialog, Combobox, PasswordInput } from './index';

function SelectionExample() {
  const [value, setValue] = useState(['a']);
  return (
    <Combobox
      label="Portais"
      multiple
      value={value}
      onChange={setValue}
      options={[
        { value: 'a', label: 'Francal' },
        { value: 'b', label: 'Beauty Fair' },
        { value: 'c', label: 'Portal bloqueado', disabled: true },
      ]}
    />
  );
}
describe('controles adicionais da biblioteca V2', () => {
  it('busca e seleciona por teclado, preserva seleção e permite remover', async () => {
    const user = userEvent.setup();
    render(
      <DesignSystemTheme>
        <SelectionExample />
      </DesignSystemTheme>,
    );
    const input = screen.getByRole('combobox', { name: 'Portais' });
    await user.type(input, 'Beauty');
    expect(screen.getByRole('option', { name: 'Beauty Fair' })).toBeInTheDocument();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Remover Francal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remover Beauty Fair' })).toBeInTheDocument();
    expect(input.parentElement).toContainElement(
      screen.getByRole('button', { name: 'Remover Beauty Fair' }),
    );
    await user.type(input, 'bloqueado');
    await user.keyboard('{Enter}');
    expect(
      screen.queryByRole('button', { name: 'Remover Portal bloqueado' }),
    ).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    await user.click(screen.getByRole('button', { name: 'Remover Francal' }));
    expect(screen.queryByRole('button', { name: 'Remover Francal' })).not.toBeInTheDocument();
    await user.clear(input);
    await user.keyboard('{Backspace}');
    expect(screen.queryByRole('button', { name: 'Remover Beauty Fair' })).not.toBeInTheDocument();
  });
  it('alterna a visibilidade da senha sem apagar o valor', async () => {
    const user = userEvent.setup();
    render(
      <DesignSystemTheme>
        <PasswordInput aria-label="Senha" defaultValue="exemplo-123" />
      </DesignSystemTheme>,
    );
    const input = screen.getByLabelText('Senha');
    expect(input).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveValue('exemplo-123');
    await user.click(screen.getByRole('button', { name: 'Ocultar senha' }));
    expect(input).toHaveAttribute('type', 'password');
  });
  it('abre o diálogo, cancela por Escape e restaura foco e rolagem', async () => {
    function Example() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Abrir exemplo</Button>
          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            title="Editar registro"
            description="Revise os dados antes de salvar."
            size="medium"
          >
            <input aria-label="Nome" />
          </Dialog>
        </>
      );
    }
    const user = userEvent.setup();
    render(
      <DesignSystemTheme>
        <Example />
      </DesignSystemTheme>,
    );
    const trigger = screen.getByRole('button', { name: 'Abrir exemplo' });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Editar registro' });
    expect(dialog).toHaveAttribute('open');
    expect(dialog).toHaveAttribute('data-size', 'medium');
    expect(dialog).toHaveAccessibleDescription('Revise os dados antes de salvar.');
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent(dialog, new Event('cancel', { bubbles: true, cancelable: true }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).not.toBe('hidden');
  });
});
