import { act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { expect, it } from 'vitest';
import { Button, ButtonLink } from './button';
import { Input, Textarea } from './fields';
import { KanbanCard } from './kanban';

function Controls() {
  const [search, setSearch] = useState('');
  const [reason, setReason] = useState('');
  const [result, setResult] = useState('');
  return (
    <>
      <Input
        aria-label="Busca"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <Textarea
        aria-label="Justificativa"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      <Button onClick={() => setResult(search + ' · ' + reason)}>Aplicar</Button>
      <KanbanCard title="Lead de teste" onOpen={() => setResult('Detalhe aberto')} />
      <KanbanCard title="Cartão indisponível" inert />
      <Input aria-label="Somente leitura" value="Informação" readOnly />
      <Input aria-label="Campo nativo" name="native" defaultValue="Preservado" />
      <Button type="submit">Enviar formulário nativo</Button>
      <ButtonLink href="/destino">Abrir destino</ButtonLink>
      <output>{result}</output>
    </>
  );
}
it('preserva entrada e ação após hidratação, mantendo os controles nativos disponíveis no HTML', async () => {
  const container = document.createElement('div');
  container.innerHTML = renderToString(<Controls />);
  document.body.append(container);
  const page = within(container);
  expect(page.getByLabelText('Busca')).toBeDisabled();
  expect(page.getByLabelText('Justificativa')).toBeDisabled();
  expect(page.getByRole('button', { name: 'Aplicar' })).toBeDisabled();
  expect(container.querySelector('article')).toHaveAttribute('inert');
  expect(page.getByLabelText('Somente leitura')).toBeEnabled();
  expect(page.getByLabelText('Campo nativo')).toBeEnabled();
  expect(page.getByRole('button', { name: 'Enviar formulário nativo' })).toBeEnabled();
  expect(page.getByRole('link', { name: 'Abrir destino' })).toHaveAttribute('href', '/destino');
  const root = await act(async () => hydrateRoot(container, <Controls />));
  try {
    const user = userEvent.setup();
    await user.type(page.getByLabelText('Busca'), 'AÇUCENA');
    await user.type(page.getByLabelText('Justificativa'), 'Conferência');
    await user.click(page.getByRole('button', { name: 'Aplicar' }));
    expect(page.getByRole('status')).toHaveTextContent('AÇUCENA · Conferência');
    expect(page.getByLabelText('Campo nativo')).toHaveValue('Preservado');
    expect(page.getByRole('listitem', { name: 'Lead de teste' })).not.toHaveAttribute('inert');
    expect(container.querySelectorAll('article')[1]).toHaveAttribute('inert');
    await user.click(page.getByRole('listitem', { name: 'Lead de teste' }));
    expect(page.getByRole('status')).toHaveTextContent('Detalhe aberto');
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
