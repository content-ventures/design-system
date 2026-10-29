/**
 * Contraste do placeholder (WCAG 1.4.3 AA): o token `--placeholder` precisa de
 * ≥ 4,5:1 sobre `--paper` nos temas claro e escuro, e os campos do DS usam o
 * token nos seletores de placeholder. `--subtle` segue com o valor de antes.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { contrastRatio } from './color-picker';

const read = (file: string) => readFileSync(join(__dirname, file), 'utf8');

/** Declarações `--nome: valor;` do primeiro bloco aberto pelo seletor. */
function tokensOf(css: string, selector: string) {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`bloco ${selector} não encontrado`);
  const body = css.slice(start, css.indexOf('\n}', start));
  const tokens = new Map<string, string>();
  for (const match of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    tokens.set(match[1] ?? '', (match[2] ?? '').trim());
  }
  return tokens;
}

const theme = read('theme.module.css');
const light = tokensOf(theme, '.theme');
const dark = new Map([...light, ...tokensOf(theme, ".theme[data-color-scheme='dark']")]);

/** Resolve `var(--x)` em cadeia dentro do tema. */
function resolve(tokens: Map<string, string>, name: string): string {
  const value = tokens.get(name);
  if (!value) throw new Error(`token ${name} ausente`);
  const ref = /^var\((--[\w-]+)\)$/.exec(value);
  return ref ? resolve(tokens, ref[1] ?? '') : value;
}

describe('token --placeholder', () => {
  it.each([
    ['claro', light],
    ['escuro', dark],
  ])('tem contraste ≥ 4,5:1 sobre --paper no tema %s', (_, tokens) => {
    const ratio = contrastRatio(resolve(tokens, '--placeholder'), resolve(tokens, '--paper'));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('no tema claro vale --muted (#697181)', () => {
    expect(resolve(light, '--placeholder')).toBe('#697181');
  });

  it('--subtle fica intocado', () => {
    expect(light.get('--subtle')).toBe('#99a0ad');
    expect(resolve(dark, '--subtle')).toBe('#9aa1ae');
  });
});

describe('campos do DS usam --placeholder', () => {
  it.each([
    ['fields.module.css', /\.control textarea::placeholder \{[^}]*color: var\(--placeholder\)/],
    ['select.module.css', /\n\.placeholder \{[^}]*color: var\(--placeholder\)/],
    ['multiselect.module.css', /\n\.placeholder \{[^}]*color: var\(--placeholder\)/],
    ['tag-input.module.css', /\.input::placeholder \{[^}]*color: var\(--placeholder\)/],
    ['date-picker.module.css', /\.segment\[data-empty='true'\] \{[^}]*color: var\(--placeholder\)/],
  ])('%s', (file, rule) => {
    expect(read(file)).toMatch(rule);
  });
});
