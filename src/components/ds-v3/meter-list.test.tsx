/**
 * O medidor de participação: com a razão como valor, o % repetido sai
 * (`shares={false}`); sem dado, o valor é "—" e a trilha fica vazia — não zero.
 */
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MeterList } from './charts';

describe('MeterList', () => {
  it('mostra valor e participação por padrão', () => {
    render(
      <MeterList label="Por canal" items={[{ key: 'a', label: 'Portal', value: 1200, share: 50 }]} />,
    );
    const item = within(screen.getByRole('list', { name: 'Por canal' })).getByRole('listitem');
    expect(item).toHaveTextContent('Portal');
    expect(item).toHaveTextContent('%');
  });

  it('sem participação e com item sem dado', () => {
    render(
      <MeterList
        label="Cumprimento"
        shares={false}
        format={(value) => `${value}%`}
        items={[
          { key: 'a', label: 'Onboarding', value: 75, share: 75 },
          { key: 'b', label: 'Renovação', value: 0, share: 0, empty: true },
        ]}
      />,
    );
    const [first, second] = within(screen.getByRole('list', { name: 'Cumprimento' })).getAllByRole(
      'listitem',
    );
    expect(first).toHaveTextContent('Onboarding75%');
    expect(first).not.toHaveTextContent('75,0%');
    expect(second).toHaveTextContent('Renovação—');
  });
});
