/**
 * `Gallery fitHeight`: o palco para na altura visível da área que rola em volta, menos o que vem
 * antes da galeria e a faixa de miniaturas, com o piso de 240 px do `MediaFrame`. Sem a opção, o
 * palco segue só a proporção.
 */
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Gallery, type GalleryItem } from './gallery';
import { FIT_HEIGHT_MIN } from './media';

const SLIDES: GalleryItem[] = [1, 2, 3].map((n) => ({
  id: `s${n}`,
  alt: `Slide ${n} de 3`,
  ratio: '1080/1350',
  label: `carrossel-v1-${n}.png`,
}));

const rect = (top: number, height: number) =>
  ({
    top,
    height,
    bottom: top + height,
    left: 0,
    right: 600,
    width: 600,
    x: 0,
    y: top,
    toJSON: () => ({}),
  }) as DOMRect;

/** Palco de 578 px com respiro de 24; a galeria (500) tem o palco (440) e a faixa de miniaturas. */
function mockStage({ before = 0 }: { before?: number } = {}) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    if (this.dataset.testid === 'stage') return rect(141, 578);
    if (this.tagName === 'SECTION') return rect(165 + before, 500);
    return rect(165 + before, 440);
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

describe('Gallery · cabe no palco', () => {
  it('sem `fitHeight`, nada é medido', () => {
    render(<Gallery items={SLIDES} index={0} onIndexChange={() => {}} label="Slides" />);
    const gallery = screen.getByRole('region', { name: 'Slides' });
    expect(gallery).not.toHaveAttribute('data-fit');
    expect(gallery.style.getPropertyValue('--media-fit-h')).toBe('');
  });

  it('mede a altura visível, menos o que vem antes e as miniaturas', () => {
    mockStage({ before: 40 });
    render(
      <div data-testid="stage" style={{ overflowY: 'auto', padding: 24 }}>
        <Gallery items={SLIDES} index={0} onIndexChange={() => {}} label="Slides" fitHeight />
      </div>,
    );
    const gallery = screen.getByRole('region', { name: 'Slides' });
    expect(gallery).toHaveAttribute('data-fit');
    // 578 − 48 de respiro − 40 antes − 60 de miniaturas (500 − 440).
    expect(gallery.style.getPropertyValue('--media-fit-h')).toBe('430px');
  });

  it('nunca encolhe abaixo do piso', () => {
    mockStage({ before: 900 });
    render(
      <div data-testid="stage" style={{ overflowY: 'auto', padding: 24 }}>
        <Gallery items={SLIDES} index={1} onIndexChange={() => {}} label="Slides" fitHeight />
      </div>,
    );
    const gallery = screen.getByRole('region', { name: 'Slides' });
    expect(gallery.style.getPropertyValue('--media-fit-h')).toBe(`${FIT_HEIGHT_MIN}px`);
  });
});
