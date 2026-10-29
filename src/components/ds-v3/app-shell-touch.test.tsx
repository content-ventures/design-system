/**
 * Moldura do app no celular: alvos de toque de 44 px.
 *
 * Medido em 322, 390 e 1280 px: o shell não rola de lado, mas no celular o botão `Menu` e o sino
 * mediam 40 × 40 px (o `Menu` encolhia para 33 px em 322) e os itens da gaveta 34 px de altura. A
 * correção fica só na moldura: alvos de 44 px abaixo de 640 px, sem encolher. O jsdom não mede
 * layout; este teste trava as regras do CSS para elas não voltarem a 40 px.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const css = readFileSync(join(import.meta.dirname, 'app-shell.module.css'), 'utf8');

/** Corpo de cada `@container <nome> (max-width: <px>)`, com as chaves balanceadas. */
function containerBlocks(name: string, maxWidth: number): string[] {
  const head = `@container ${name} (max-width: ${maxWidth}px)`;
  const blocks: string[] = [];
  for (let at = css.indexOf(head); at !== -1; at = css.indexOf(head, at + 1)) {
    const open = css.indexOf('{', at);
    let depth = 0;
    for (let i = open; i < css.length; i += 1) {
      if (css[i] === '{') depth += 1;
      if (css[i] === '}' && --depth === 0) {
        blocks.push(css.slice(open + 1, i));
        break;
      }
    }
  }
  return blocks;
}

/** A regra que começa pelo seletor (sozinho ou o primeiro de uma lista), até o `}`. */
function rule(blocks: string[], selector: string): string {
  for (const block of blocks) {
    const start = block.search(
      new RegExp(`(^|\\n)\\s*${selector.replace(/[.[\]]/g, '\\$&')}\\s*[,{]`),
    );
    if (start >= 0) return block.slice(start, block.indexOf('}', start));
  }
  return '';
}

describe('AppShell no celular', () => {
  const topbar = containerBlocks('topbar', 640);
  const shell = containerBlocks('shell', 640);

  it('botão Menu e sino medem 44 × 44 px e não encolhem', () => {
    const targets = rule(topbar, '.topbar .menuButton');
    expect(targets).toContain('.topbar .bell button');
    expect(targets).toMatch(/width:\s*44px/);
    expect(targets).toMatch(/height:\s*44px/);
    expect(targets).toMatch(/flex-shrink:\s*0/);
  });

  it('itens, busca e limpar a busca da gaveta medem 44 px', () => {
    expect(rule(shell, '.shell[data-drawer] .navItem')).toMatch(/min-height:\s*44px/);
    expect(rule(shell, '.shell[data-drawer] .filter')).toMatch(/height:\s*44px/);
    const clear = rule(shell, '.shell[data-drawer] .filterClear');
    expect(clear).toMatch(/width:\s*44px/);
    expect(clear).toMatch(/height:\s*44px/);
  });

  it('no computador os itens continuam com ao menos 24 px', () => {
    const base = css.slice(css.indexOf('.navItem {'), css.indexOf('}', css.indexOf('.navItem {')));
    expect(Number(/min-height:\s*(\d+)px/.exec(base)?.[1])).toBeGreaterThanOrEqual(24);
  });
});
