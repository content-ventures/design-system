/**
 * Régua e lista de etapas: o motivo (`reason`) de uma etapa fora de alcance vira dica do DS e
 * descrição para leitor de tela; todo nome escondido pela largura ganha a dica com o nome. Nenhum
 * `title` nativo. A etapa bloqueada não navega, mas continua alcançável por teclado e toque.
 */
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { StepList, Stepper, type StepItem } from './stepper';

const REASON = 'Libera quando o artigo for aprovado';

const STEPS: StepItem[] = [
  { id: 'material', label: 'Material', state: 'done' },
  { id: 'artigo', label: 'Artigo' },
  { id: 'carrossel', label: 'Carrossel', state: 'blocked', reason: REASON },
  { id: 'entrega', label: 'Entrega' },
];

const nav = () => screen.getByRole('navigation', { name: 'Etapas da produção' });
const tooltip = () => screen.findByRole('tooltip', { hidden: true });
const nativeTitles = () =>
  Array.from(document.querySelectorAll('[title]')).filter((node) => node.getAttribute('title'));

/**
 * Simula a régua sem espaço para os nomes: o trilho tem largura e o rótulo de toda etapa que não é
 * a atual mede 1 px (o recorte visual do CSS recolhido).
 */
function squeezeLabels() {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(320);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const collapsed =
      this.hasAttribute('data-step-label') &&
      this.closest('li')?.getAttribute('data-state') !== 'current';
    const width = collapsed ? 1 : 24;
    return { x: 0, y: 0, top: 0, left: 0, bottom: 24, right: width, width, height: 24 } as DOMRect;
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('Stepper', () => {
  it('etapa bloqueada com motivo: focável, não navega, motivo na dica e na descrição', async () => {
    const user = userEvent.setup();
    const onStepSelect = vi.fn();
    render(
      <Stepper label="Etapas da produção" steps={STEPS} current={1} onStepSelect={onStepSelect} />,
    );
    const blocked = within(nav()).getByRole('button', { name: /Carrossel/ });
    expect(blocked).toHaveAttribute('aria-disabled', 'true');
    expect(blocked).toHaveAccessibleName('Carrossel (bloqueada)');
    expect(blocked).toHaveAccessibleDescription(REASON);

    await user.click(blocked);
    expect(onStepSelect).not.toHaveBeenCalled();

    await user.hover(blocked);
    expect(await tooltip()).toHaveTextContent(REASON);
    expect(nativeTitles()).toEqual([]);
  });

  it('o teclado chega à etapa bloqueada e a dica abre no foco', async () => {
    const user = userEvent.setup();
    render(
      <Stepper label="Etapas da produção" steps={STEPS} current={1} onStepSelect={() => {}} />,
    );
    await user.tab(); // Material (feita)
    await user.tab(); // Carrossel (bloqueada)
    expect(within(nav()).getByRole('button', { name: /Carrossel/ })).toHaveFocus();
    expect(await tooltip()).toHaveTextContent(REASON);
  });

  it('feita continua navegando; a atual e a seguir sem dica ficam como texto', async () => {
    const user = userEvent.setup();
    const onStepSelect = vi.fn();
    render(
      <Stepper label="Etapas da produção" steps={STEPS} current={1} onStepSelect={onStepSelect} />,
    );
    await user.click(within(nav()).getByRole('button', { name: 'Material (concluída)' }));
    expect(onStepSelect).toHaveBeenCalledWith(0);
    expect(within(nav()).getAllByRole('button')).toHaveLength(2);
    expect(within(nav()).getByText('Artigo').closest('[aria-current]')).toHaveAttribute(
      'aria-current',
      'step',
    );
  });

  it('nome escondido pela largura: dica com o nome (e o motivo), sem repetir para o leitor', async () => {
    squeezeLabels();
    const user = userEvent.setup();
    render(
      <Stepper label="Etapas da produção" steps={STEPS} current={1} onStepSelect={() => {}} />,
    );
    const steps = within(nav());

    // Feita: navega; a dica mostra o nome que o rótulo recortado esconde.
    const done = steps.getByRole('button', { name: 'Material (concluída)' });
    expect(done).not.toHaveAttribute('aria-describedby');
    await user.hover(done);
    expect(await tooltip()).toHaveTextContent(/^Material$/);
    await user.unhover(done);

    // A seguir, sem nome à vista: indisponível focável só para a dica (não navega).
    const upcoming = steps.getByRole('button', { name: 'Entrega (a seguir)' });
    expect(upcoming).toHaveAttribute('aria-disabled', 'true');
    expect(upcoming).not.toHaveAttribute('aria-describedby');

    // Bloqueada: nome e motivo na dica; o leitor ouve o nome uma vez e o motivo como descrição.
    const blocked = steps.getByRole('button', { name: 'Carrossel (bloqueada)' });
    expect(blocked).toHaveAccessibleDescription(REASON);
    await user.hover(blocked);
    expect(await tooltip()).toHaveTextContent(`Carrossel · ${REASON}`);

    expect(nativeTitles()).toEqual([]);
  });

  it('régua só de leitura: nada vira botão; o motivo vai junto do estado', () => {
    render(<Stepper label="Etapas da produção" steps={STEPS} current={1} />);
    expect(within(nav()).queryAllByRole('button')).toEqual([]);
    expect(within(nav()).getByText(`(bloqueada: ${REASON})`)).toBeInTheDocument();
  });

  it('o motivo da etapa atual é ignorado', () => {
    render(
      <Stepper label="Etapas da produção" steps={STEPS} current={2} onStepSelect={() => {}} />,
    );
    const current = within(nav()).getByText('Carrossel').closest('[aria-current]');
    expect(current).toHaveAttribute('aria-current', 'step');
    expect(current).not.toHaveAttribute('aria-describedby');
    expect(screen.queryByText(REASON)).toBeNull();
  });

  it('vendo outra etapa: a do trabalho fica “em andamento”, navega e não vira a atual', async () => {
    const user = userEvent.setup();
    const onStepSelect = vi.fn();
    const steps: StepItem[] = STEPS.map((step) =>
      step.id === 'artigo'
        ? { ...step, state: 'active' }
        : step.id === 'material'
          ? { id: step.id, label: step.label }
          : step,
    );
    render(
      <Stepper label="Etapas da produção" steps={steps} current={0} onStepSelect={onStepSelect} />,
    );
    const active = within(nav()).getByRole('button', { name: 'Artigo (em andamento)' });
    expect(active.closest('li')).toHaveAttribute('data-state', 'active');
    expect(active.querySelector('[data-state="active"]')).toHaveTextContent('2');
    expect(within(nav()).getByText('Material').closest('[aria-current]')).toHaveAttribute(
      'aria-current',
      'step',
    );
    await user.click(active);
    expect(onStepSelect).toHaveBeenCalledWith(1);
    expect(nativeTitles()).toEqual([]);
  });

  it('prancha: `force="tip"` deixa a dica aberta e parada', () => {
    const steps: StepItem[] = STEPS.map((step) =>
      step.id === 'carrossel' ? { ...step, force: 'tip' } : step,
    );
    render(
      <Stepper label="Etapas da produção" steps={steps} current={1} onStepSelect={() => {}} />,
    );
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent(REASON);
  });
});

describe('StepList', () => {
  it('etapa bloqueada com motivo: indisponível focável, descrição e dica', async () => {
    const user = userEvent.setup();
    const onStepSelect = vi.fn();
    render(
      <StepList label="Etapas da produção" steps={STEPS} current={1} onStepSelect={onStepSelect} />,
    );
    const blocked = within(nav()).getByRole('button', { name: /Carrossel/ });
    expect(blocked).toHaveAttribute('aria-disabled', 'true');
    expect(blocked).toHaveAccessibleDescription(REASON);
    await user.click(blocked);
    expect(onStepSelect).not.toHaveBeenCalled();
    await user.hover(blocked);
    expect(await tooltip()).toHaveTextContent(REASON);
  });

  it('sem motivo, a etapa fora de alcance segue como texto (o nome está à vista)', () => {
    render(
      <StepList label="Etapas da produção" steps={STEPS} current={1} onStepSelect={() => {}} />,
    );
    expect(within(nav()).getByText('Entrega').closest('button')).toBeNull();
  });
});

describe('Tooltip na etapa', () => {
  it('clicar numa etapa indisponível não fecha a dica (o clique pergunta “por quê?”)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <Stepper label="Etapas da produção" steps={STEPS} current={1} onStepSelect={() => {}} />,
    );
    const blocked = within(nav()).getByRole('button', { name: /Carrossel/ });
    await user.hover(blocked);
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent(REASON);
    await user.click(blocked);
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent(REASON);
  });
});
