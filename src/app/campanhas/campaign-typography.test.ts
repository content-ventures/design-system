import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), 'src', path), 'utf8');
const shell = source('app/campanhas/pilot.module.css');
const table = source('app/campanhas/campaign-table.module.css');
const reference = source('app/campanhas/campaign-reference.module.css');

describe('tipografia do piloto de campanhas', () => {
  it('carrega os três pesos locais somente no layout de campanhas', () => {
    const layout = source('app/campanhas/layout.tsx');
    expect(layout).toContain("from 'next/font/local'");
    for (const [name, weight] of [
      ['regular', '400'],
      ['medium', '500'],
      ['semibold', '600'],
    ]) {
      const file = `inter-${name}.woff2`;
      expect(layout).toContain(file);
      expect(layout).toContain(`weight: '${weight}'`);
      const font = readFileSync(resolve(process.cwd(), 'src/fonts', file));
      expect(font.toString('ascii', 0, 4)).toBe('wOF2');
    }
    expect(source('app/layout.tsx')).not.toContain('fonts/inter-');
    expect(layout).not.toContain('geist');
    expect(layout).not.toContain('roboto');
  });

  it('usa algarismos tabulares e alinhados sem sintetizar pesos', () => {
    expect(shell).toContain('font-family: var(--font-campaign), sans-serif');
    expect(shell).toContain('--font-utility: var(--font-campaign)');
    expect(reference).toContain('font-variant-numeric: lining-nums tabular-nums');
    expect(shell).toContain('font-synthesis: none');
    expect(table).not.toMatch(/font-weight:\s*(450|550)\b/);
  });

  it('mantém a escala da tabela legível, inclusive na densidade compacta', () => {
    expect(table).toContain('--text-primary: 14px');
    expect(table).toContain('--text-body: 13px');
    expect(table).toContain('--text-meta: 12px');
    expect(table).not.toMatch(/font-size:\s*(?:[1-9]|10|11)px\b/);
  });

  it('distingue nome, anunciante e status também por peso e cor', () => {
    const name = table.match(/\.campaignLink strong\s*\{([^}]+)\}/)![1]!;
    const advertiser = table.match(/\.advertiserCell > span\s*\{([^}]+)\}/)![1]!;
    const status = table.match(/\.statusCell > span\s*\{([^}]+)\}/)![1]!;
    expect(name).toContain('font-weight: 600');
    expect(name).toContain('color: var(--ink)');
    expect(advertiser).toContain('font-weight: 400');
    expect(advertiser).toContain('color: #69758b');
    expect(status).toContain('font-weight: 400');
    expect(name).toContain('letter-spacing: 0');
    expect(status).toContain('letter-spacing: 0');
  });

  it('separa nome, dados e rótulos por escala, peso, ritmo e contraste', () => {
    const metrics = reference.match(/\.cardMetrics dd\s*\{([^}]+)\}/)![1]!;
    const label = reference.match(/\.cardMetrics dt\s*\{([^}]+)\}/)![1]!;
    const title = reference.match(/\.cardTitle h2\s*\{([^}]+)\}/)![1]!;
    expect(title).toContain('font-size: var(--type-title)');
    expect(title).toContain('font-weight: 600');
    expect(title).toContain('line-height: var(--leading-title)');
    expect(metrics).toContain('font-size: var(--type-value)');
    expect(metrics).toContain('font-weight: 500');
    expect(metrics).toContain('letter-spacing: 0');
    expect(label).toContain('font-size: var(--type-caption)');
    expect(label).toContain('color: var(--text-tertiary)');
    const color = shell.match(/--text-tertiary:\s*#([\da-f]{6})/)![1]!;
    const channels = color.match(/../g)!.map((channel) => {
      const value = parseInt(channel, 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    const luminance = channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
    expect(1.05 / (luminance + 0.05)).toBeGreaterThanOrEqual(4.5);
  });

  it('centraliza a escala e não encolhe os nomes de campanha no celular', () => {
    for (const token of [
      '--type-page: 28px',
      '--type-title: 16px',
      '--type-value: 22px',
      '--type-ui: 14px',
      '--type-support: 13px',
      '--type-caption: 12px',
    ]) {
      expect(shell).toContain(token);
    }
    const mobile = reference.split('@media (max-width: 767px)')[1]!;
    expect(mobile).not.toMatch(/\.cardTitle h2\s*\{/);
    expect(source('app/campanhas/campaign-monitor.tsx')).toContain(
      '<strong>{campaign.advertiser}</strong>',
    );
  });
});
