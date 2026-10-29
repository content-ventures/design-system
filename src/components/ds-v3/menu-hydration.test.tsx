import { act, within, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { expect, it } from 'vitest';
import { Menu } from './menu';

it('libera o gatilho somente depois da hidratação e abre o menu pelo teclado', async () => {
  const menu = (
    <Menu
      label="Módulos"
      trigger={(props) => <button {...props}>Trocar módulo</button>}
      sections={[
        {
          items: [
            { label: 'AdManager', checked: true },
            { label: 'Audiência', checked: false },
          ],
        },
      ]}
    />
  );
  const container = document.createElement('div');
  container.innerHTML = renderToString(menu);
  document.body.append(container);
  const trigger = within(container).getByRole('button', { name: 'Trocar módulo' });
  expect(trigger).toBeDisabled();
  const root = await act(async () => hydrateRoot(container, menu));
  try {
    expect(trigger).toBeEnabled();
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('menu', { name: 'Módulos' })).toBeVisible();
    expect(screen.getAllByRole('menuitemradio')).toHaveLength(2);
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
