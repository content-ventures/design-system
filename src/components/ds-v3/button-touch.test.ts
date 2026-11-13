/**
 * Alvo de toque dos botões: 44 px de altura mínima só abaixo de 900 px.
 *
 * O corte do celular no produto é `max-width: 899.98px` (o mesmo da moldura do app). Com
 * `max-width: 900px`, a regra também valia na tela de 900 px, e um botão de 36 px no computador
 * (a engrenagem «Ajustes do quadro» de Meus leads) saía com 44 px. O jsdom não mede layout; este
 * teste trava a consulta do CSS.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const css = readFileSync(join(import.meta.dirname, 'button.module.css'), 'utf8');

describe('button.module.css — alvo de toque', () => {
  it('sobe para 44 px só abaixo de 900 px', () => {
    const touch = css.match(/@media \(max-width: ([\d.]+)px\) \{\s*\.button \{\s*min-height: 44px;/);
    expect(touch?.[1]).toBe('899.98');
  });
});
