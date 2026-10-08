/**
 * Moldura numa linha só: com `steps`, a régua fica entre o título e as ações (ordem de leitura e
 * de tabulação: título, régua, ações, ⋯) e a versão compacta só existe junto da régua. Quem decide
 * qual das duas aparece é o CSS (container query), então as duas saem no HTML do servidor.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from './button';
import { Banner } from './feedback';
import { Stepper, StepperCompact, type StepItem } from './stepper';
import { PageHeader } from './structure';

const STEPS: StepItem[] = [
  { id: 'material', label: 'Material', state: 'done' },
  { id: 'artigo', label: 'Artigo' },
  {
    id: 'carrossel',
    label: 'Carrossel',
    state: 'blocked',
    reason: 'Libera quando o artigo for aprovado',
  },
  { id: 'entrega', label: 'Entrega', state: 'blocked' },
];

describe('PageHeader steps', () => {
  it('frame numa linha: título, régua, ações e ⋯ nessa ordem', () => {
    const { container } = render(
      <PageHeader
        variant="frame"
        title="Casa Forma: o estande que vende antes da feira"
        steps={<Stepper label="Etapas da produção" steps={STEPS} current={1} size="sm" />}
        actions={<Button size="sm">Enviar para aprovação</Button>}
        more={<Button size="sm">Mais</Button>}
      />,
    );
    const main = container.querySelector('[data-part="page-header"] > div');
    expect(main).toHaveAttribute('data-steps', 'true');
    const order = Array.from(main?.children ?? []).map(
      (child) => child.getAttribute('data-part') ?? child.textContent,
    );
    expect(order[0]).toContain('Casa Forma');
    expect(order[1]).toBe('page-header-steps');
    expect(order[2]).toBe('Enviar para aprovação');
    expect(order[3]).toBe('Mais');
    expect(screen.getByRole('navigation', { name: 'Etapas da produção' })).toBeInTheDocument();
    expect(container.querySelector('[data-part="page-header-steps-compact"]')).toBeNull();
  });

  it('versão compacta: sai junto da régua e marca a régua para o celular', () => {
    const { container } = render(
      <PageHeader
        variant="frame"
        title="Ateliê Sul"
        steps={<Stepper label="Etapas da produção" steps={STEPS} current={1} size="sm" />}
        stepsCompact={
          <StepperCompact
            label="Progresso da produção"
            steps={STEPS}
            current={1}
            showNext={false}
          />
        }
      />,
    );
    expect(container.querySelector('[data-part="page-header-steps"]')).toHaveAttribute(
      'data-compact',
      'true',
    );
    expect(container.querySelector('[data-part="page-header-steps-compact"]')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Progresso da produção' })).toHaveAttribute(
      'aria-valuetext',
      'Etapa 2 de 4: Artigo',
    );
  });

  it('sem `steps`, nada muda: a compacta sozinha não aparece', () => {
    const { container } = render(
      <PageHeader
        variant="frame"
        title="Nova campanha"
        stepsCompact={<StepperCompact steps={STEPS} current={1} />}
      />,
    );
    expect(container.querySelector('[data-part="page-header"] > div')).not.toHaveAttribute(
      'data-steps',
    );
    expect(container.querySelector('[data-part="page-header-steps-compact"]')).toBeNull();
  });

  it('aviso: bloco próprio depois da linha do título, antes do `toolbar`', () => {
    const { container } = render(
      <PageHeader
        variant="frame"
        title="Ateliê Sul"
        steps={<Stepper label="Etapas da produção" steps={STEPS} current={1} size="sm" />}
        notice={
          <Banner tone="warning" variant="inline" title="Aberta em outra aba">
            Esta aba ficou só para leitura.
          </Banner>
        }
        toolbar={<Button size="sm">Filtrar</Button>}
      />,
    );
    const header = container.querySelector('[data-part="page-header"]');
    const parts = Array.from(header?.children ?? []).map((child) =>
      child.getAttribute('data-part'),
    );
    expect(parts[1]).toBe('page-header-notice');
    expect(header?.children[2]).toHaveTextContent('Filtrar');
    expect(screen.getByRole('status')).toHaveTextContent('Aberta em outra aba');
  });
});
