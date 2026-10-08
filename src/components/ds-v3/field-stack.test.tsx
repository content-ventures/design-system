/**
 * Pilha de campos no corpo de `Section` e de `Drawer`: os corpos são fluxo comum (sem gap) e se
 * marcam com `data-part`; a regra de `fields.module.css` dá 20 px entre um campo (ou grupo) e o
 * próximo nesses corpos — o rótulo nunca encosta no controle de cima.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DrawerFrame } from './drawer';
import { Field, FieldGroup } from './fields';
import { Section } from './structure';

const css = readFileSync(resolve(__dirname, 'fields.module.css'), 'utf8');

function Fields() {
  return (
    <>
      <Field label="Chamada">{({ id }) => <input id={id} />}</Field>
      <Field label="Título">{({ id }) => <input id={id} />}</Field>
      <FieldGroup label="Rodapé">
        <Field label="Veículo">{({ id }) => <input id={id} />}</Field>
      </FieldGroup>
    </>
  );
}

describe('Pilha de campos', () => {
  it('o corpo da Section marca a pilha e recebe os campos direto', () => {
    const { getByLabelText } = render(
      <Section title="Slide 1 · Capa">
        <Fields />
      </Section>,
    );
    const body = getByLabelText('Chamada').closest('[data-part="section-body"]');
    expect(body).not.toBeNull();
    // O campo (rótulo + controle) é filho direto do corpo: é aí que a regra da pilha alcança.
    const field = getByLabelText('Título').parentElement;
    expect(field?.parentElement).toBe(body);
  });

  it('o corpo da gaveta marca a pilha', () => {
    const { getByLabelText } = render(
      <DrawerFrame title="Falantes">
        <Fields />
      </DrawerFrame>,
    );
    expect(getByLabelText('Chamada').closest('[data-part="drawer-body"]')).not.toBeNull();
  });

  it('a regra da pilha dá o vão da grade do grupo entre campos irmãos', () => {
    expect(css).toMatch(
      /:is\(\[data-part='section-body'\], \[data-part='drawer-body'\]\)\s*>\s*:is\(\.field, \.group\)\s*\+\s*:is\(\.field, \.group\) \{\s*margin-top: var\(--s-5\);/,
    );
  });
});
