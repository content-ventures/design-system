/**
 * Zona de perigo: seção com nome acessível vindo do título visível, e as ações
 * de exemplo sem vermelho sólido (o sólido fica só na confirmação).
 */
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './button';
import { DangerZone } from './index';

// O barril carrega a fonte do Next, que não existe fora do build.
vi.mock('./font', () => ({ interV3: { variable: '' } }));

function Example() {
  return (
    <DangerZone description="Ações que não podem ser desfeitas.">
      <Button variant="danger-soft">Remover vínculo — Portal A</Button>
      <Button variant="danger-soft">Remover da plataforma</Button>
    </DangerZone>
  );
}

describe('DangerZone', () => {
  it('tem nome acessível "Zona de perigo" a partir do título visível', () => {
    render(<Example />);
    const zone = screen.getByRole('region', { name: 'Zona de perigo' });
    const title = within(zone).getByRole('heading', { name: 'Zona de perigo' });
    expect(title).toBeVisible();
    expect(zone).toHaveAccessibleDescription('Ações que não podem ser desfeitas.');
  });

  it('aceita outro título', () => {
    render(
      <DangerZone title="Excluir conta">
        <Button variant="danger-soft">Excluir</Button>
      </DangerZone>,
    );
    expect(screen.getByRole('region', { name: 'Excluir conta' })).toBeInTheDocument();
  });

  it('nenhum botão filho de exemplo é vermelho sólido', () => {
    render(<Example />);
    const buttons = within(screen.getByRole('region', { name: 'Zona de perigo' })).getAllByRole(
      'button',
    );
    expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      expect(button).not.toHaveAttribute('data-variant', 'danger');
    }
  });
});

describe('catálogo: Hierarquia de ação', () => {
  it('a prancha lista as 6 regras numeradas e usa a zona de perigo no exemplo certo', async () => {
    const { specimens, ACTION_HIERARCHY_RULES } =
      await import('../../app/design-system-v3/specimens/acoes');
    const Specimen = specimens['hierarquia-acao'];
    expect(Specimen).toBeDefined();
    if (!Specimen) return;
    render(<Specimen />);

    const rules = screen.getByRole('list', { name: 'Hierarquia de ação' });
    expect(rules.tagName).toBe('OL');
    expect(
      within(rules)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([...ACTION_HIERARCHY_RULES]);
    expect(ACTION_HIERARCHY_RULES).toHaveLength(6);

    const zone = screen.getByRole('region', { name: 'Zona de perigo' });
    for (const button of within(zone).getAllByRole('button')) {
      expect(button).not.toHaveAttribute('data-variant', 'danger');
    }
  });
});
