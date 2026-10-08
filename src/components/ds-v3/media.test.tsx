/**
 * `MediaFrame` com altura que limita: `maxHeight` vira teto na proporção (a moldura estreita e
 * centra) e `fitHeight` mede o palco — a altura visível da área que rola, menos o que vem antes da
 * peça e a legenda, com piso de 240 px. Com legenda, o limite vai na figura inteira.
 */
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FIT_HEIGHT_MIN, MediaFrame, ratioValue } from './media';

const rect = (top: number, height: number) =>
  ({
    top,
    height,
    bottom: top + height,
    left: 0,
    right: 400,
    width: 400,
    x: 0,
    y: top,
    toJSON: () => ({}),
  }) as DOMRect;

/** Palco de 578 px com respiro de 24: a peça começa no topo útil (165) e a legenda tem 24 + 8. */
function mockStage({ before = 0 }: { before?: number } = {}) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    if (this.dataset.testid === 'stage') return rect(141, 578);
    if (this.tagName === 'FIGURE') return rect(165 + before, 538);
    return rect(165 + before, 506);
  });
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.dataset.testid === 'stage' ? 578 : 0;
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('MediaFrame · altura que limita', () => {
  it('lê a proporção como número', () => {
    expect(ratioValue('4/5')).toBeCloseTo(0.8);
    expect(ratioValue('16:9')).toBeCloseTo(16 / 9);
    expect(ratioValue('torto')).toBe(1);
  });

  it('sem limite, a moldura segue só a largura', () => {
    const { container } = render(<MediaFrame ratio="4/5" alt="Capa" state="loading" />);
    const frame = container.firstElementChild as HTMLElement;
    expect(frame).not.toHaveAttribute('data-bound');
    expect(frame.style.getPropertyValue('--media-ar')).toBe('');
  });

  it('`maxHeight` leva teto e proporção para o CSS da moldura', () => {
    const { container } = render(
      <MediaFrame ratio="4/5" alt="Capa" state="loading" maxHeight={480} />,
    );
    const frame = container.firstElementChild as HTMLElement;
    expect(frame).toHaveAttribute('data-bound');
    expect(frame.style.getPropertyValue('--media-ar')).toBe('0.8');
    expect(frame.style.getPropertyValue('--media-max-h')).toBe('480px');
  });

  it('com legenda, o limite vai na figura e a moldura fica livre', () => {
    const { container } = render(
      <MediaFrame
        ratio="4/5"
        alt="Capa"
        state="loading"
        maxHeight="60dvh"
        caption="1080 × 1350 px"
      />,
    );
    const figure = container.querySelector('figure') as HTMLElement;
    expect(figure).toHaveAttribute('data-bound');
    expect(figure.style.getPropertyValue('--media-max-h')).toBe('60dvh');
    expect(figure.firstElementChild).not.toHaveAttribute('data-bound');
  });

  it('`fitHeight` mede o palco: altura visível, menos o que vem antes e a legenda', () => {
    mockStage({ before: 40 });
    render(
      <div data-testid="stage" style={{ overflowY: 'auto', padding: 24 }}>
        <MediaFrame ratio="1/1" alt="Slide 1" state="loading" fitHeight caption="Slide 1 de 5" />
      </div>,
    );
    const figure = document.querySelector('figure') as HTMLElement;
    // 578 − 48 de respiro − 40 antes − 32 de legenda (538 − 506).
    expect(figure.style.getPropertyValue('--media-fit-h')).toBe('458px');
  });

  it('`fitHeight` nunca encolhe abaixo do piso', () => {
    mockStage({ before: 900 });
    render(
      <div data-testid="stage" style={{ overflowY: 'auto', padding: 24 }}>
        <MediaFrame ratio="4/5" alt="Slide 1" state="loading" fitHeight />
      </div>,
    );
    const frame = screen.getByTestId('stage').firstElementChild as HTMLElement;
    expect(frame.style.getPropertyValue('--media-fit-h')).toBe(`${FIT_HEIGHT_MIN}px`);
  });
});
