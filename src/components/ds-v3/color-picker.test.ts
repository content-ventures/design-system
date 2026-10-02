/**
 * As contas puras do campo de cor: o hexadecimal normalizado e a leitura de
 * contraste que o campo e as telas de marca mostram.
 */
import { describe, expect, it } from 'vitest';

import { contrastRatio, normalizeHex, whiteTextContrast } from './color-picker';

describe('color-picker', () => {
  it('normaliza #RRGGBB e recusa o resto', () => {
    expect(normalizeHex(' 1e40af ')).toBe('#1E40AF');
    expect(normalizeHex('#1E4')).toBeNull();
  });

  it('contraste WCAG: preto e branco dão 21:1; texto branco sobre a cor', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(whiteTextContrast('#1E40AF')).toBeGreaterThan(4.5);
    expect(whiteTextContrast('#F5D90A')).toBeLessThan(4.5);
  });
});
