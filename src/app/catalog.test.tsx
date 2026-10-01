import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { inventory, inventoryCount } from './inventory';
import { samples, sampleCount, sampleFor } from './catalog';
import { Showcase } from './showcase';

describe('integridade da biblioteca', () => {
  it('preserva os 126 itens e não inventa amostras fora do inventário', () => {
    const ids = inventory.flatMap((group) => group.items.map((item) => item.id));
    expect(inventoryCount).toBe(126);
    expect(new Set(ids).size).toBe(126);
    expect(sampleCount).toBe(Object.keys(samples).length);
    for (const id of Object.keys(samples)) expect(ids).toContain(id);
    expect(sampleFor('combobox')).toBeUndefined();
  });
  const cases = Object.entries(samples).filter(
    ([, kind], index, list) => list.findIndex(([, k]) => k === kind) === index,
  );
  it.each(cases)('renderiza a amostra %s (%s)', (id) => {
    const { container } = render(
      <Showcase
        selection={id}
        theme="light"
        setTheme={() => {}}
        portal="mediaon"
        setPortal={() => {}}
        onNotify={() => {}}
      />,
    );
    expect(container.textContent?.length).toBeGreaterThan(30);
  });
  it('não apresenta itens planejados como concluídos', () => {
    render(
      <Showcase
        selection="combobox"
        theme="light"
        setTheme={() => {}}
        portal="mediaon"
        setPortal={() => {}}
        onNotify={() => {}}
      />,
    );
    expect(screen.getByText('Planejado')).toBeInTheDocument();
    expect(screen.getByText(/ainda não foi desenvolvido/)).toBeInTheDocument();
  });
  it('não importa código de produto, banco ou integrações', () => {
    const files = readdirSync(resolve('src'), { recursive: true }).filter(
      (file): file is string =>
        typeof file === 'string' && /\.(tsx?|css)$/.test(file) && !file.includes('.test.'),
    );
    for (const file of files) {
      const text = readFileSync(resolve('src', file), 'utf8');
      expect(text).not.toMatch(
        /from\s+['"](?:@mediaon\/(?:db|ui|connectors)|@supabase|.*apps\/(?:web|vitrine))/,
      );
      expect(text).not.toMatch(/['"]use server['"]|fetch\(|XMLHttpRequest|supabase\.from/);
    }
  });
});

function luminance(hex: string) {
  const channels = hex
    .replace('#', '')
    .match(/.{2}/g)!
    .map((c) => {
      const v = parseInt(c, 16) / 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}
function ratio(a: string, b: string) {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
describe('contraste dos tokens', () => {
  const css = readFileSync(resolve('src/components/ds/tokens.css'), 'utf8');
  const blocks = [...css.matchAll(/([^{}]+)\{([^}]+)\}/g)].map((match) => ({
    selector: match[1]!,
    tokens: Object.fromEntries(
      [...match[2]!.matchAll(/--ds-([\w-]+):\s*(#[\da-fA-F]{6});/g)].map((pair) => [
        pair[1]!,
        pair[2]!,
      ]),
    ),
  }));
  for (const theme of ['light', 'dark'])
    for (const portal of ['mediaon', 'setorial', 'negocios']) {
      const tokens: Record<string, string> = {};
      for (const block of blocks) {
        const isDark = block.selector.includes("data-theme='dark'");
        const portalName = block.selector.match(/data-portal='([^']+)'/)?.[1];
        if ((!isDark || theme === 'dark') && (!portalName || portalName === portal))
          Object.assign(tokens, block.tokens);
      }
      it(`${theme}/${portal}: texto e estado com AA`, () => {
        for (const [fg, bg] of [
          ['ink', 'surface'],
          ['muted', 'surface'],
          ['muted', 'canvas'],
          ['on-brand', 'brand'],
          ['brand', 'brand-soft'],
          ['success', 'success-soft'],
          ['warning', 'warning-soft'],
          ['danger', 'danger-soft'],
          ['signature-ink', 'signature'],
        ])
          expect(ratio(tokens[fg!]!, tokens[bg!]!), `${fg}/${bg}`).toBeGreaterThanOrEqual(4.5);
      });
      it(`${theme}/${portal}: controles e dados distinguíveis`, () => {
        for (const token of ['control-line', 'brand', 'chart-2', 'chart-3'])
          expect(ratio(tokens[token]!, tokens.surface!), token).toBeGreaterThanOrEqual(3);
      });
    }
});
