/**
 * `Select autoFocus`: a gaveta que abre para pedir uma decisão leva o foco ao campo dessa decisão
 * (`[data-autofocus]` no gatilho), e não ao primeiro campo de texto do corpo.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Drawer } from './drawer';
import { Field, Input } from './fields';
import { Select } from './select';

const OPTIONS = [
  { value: 'p1', label: 'Otávio Prado' },
  { value: 'none', label: 'Sem atribuição' },
];

describe('Select autoFocus', () => {
  it('marca o gatilho e a gaveta abre com o foco nele', async () => {
    render(
      <Drawer open onClose={() => {}} title="Falantes">
        <Field label="Cargo de Otávio">
          {({ id }) => <Input id={id} defaultValue="diretor" />}
        </Field>
        <Field label="Mediador">
          {({ id }) => (
            <Select
              id={id}
              value=""
              placeholder="Escolha quem fala"
              options={OPTIONS}
              onChange={() => {}}
              invalid
              autoFocus
            />
          )}
        </Field>
      </Drawer>,
    );
    const trigger = screen.getByRole('combobox', { name: 'Mediador' });
    expect(trigger).toHaveAttribute('data-autofocus');
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('sem `autoFocus`, nada muda', () => {
    render(<Select label="Mediador" value="" options={OPTIONS} onChange={() => {}} />);
    expect(screen.getByRole('combobox', { name: 'Mediador' })).not.toHaveAttribute(
      'data-autofocus',
    );
  });
});
