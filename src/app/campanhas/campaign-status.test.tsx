import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CampaignStatusLabel } from './campaign-status';
import { statusLabels, type CampaignStatus } from './campaign-data';

const styleDirectory = resolve(process.cwd(), 'src/app/campanhas');
const css = readdirSync(styleDirectory)
  .filter((name) => name.endsWith('.module.css'))
  .map((name) => readFileSync(resolve(styleDirectory, name), 'utf8'))
  .join('\n');
const token = (name: string) => css.match(new RegExp(`--${name}: (#[\\da-f]{6});`))![1]!;
const rgb = (hex: string) => {
  const expanded =
    hex.length <= 5
      ? '#' +
        hex
          .slice(1)
          .split('')
          .map((value) => value + value)
          .join('')
      : hex;
  return [1, 3, 5].map((index) => parseInt(expanded.slice(index, index + 2), 16) / 255);
};
const luminance = (hex: string) =>
  rgb(hex)
    .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
    .reduce((total, value, index) => total + value * [0.2126, 0.7152, 0.0722][index]!, 0);
const contrast = (foreground: string, background: string) =>
  (Math.max(luminance(foreground), luminance(background)) + 0.05) /
  (Math.min(luminance(foreground), luminance(background)) + 0.05);

describe('status da campanha — texto sem símbolos personalizados', () => {
  it.each(Object.keys(statusLabels) as CampaignStatus[])(
    'mantém a etapa %s legível sem ícones',
    (status) => {
      const { container } = render(<CampaignStatusLabel status={status} />);
      expect(screen.getByText(statusLabels[status])).toBeInTheDocument();
      expect(container.querySelector('[data-status]')).toHaveAttribute('data-status', status);
      expect(container.querySelector('svg')).not.toBeInTheDocument();
      expect(container.querySelector('[data-status]')).toHaveTextContent(statusLabels[status]);
    },
  );
  it('mantém os estados distinguíveis sem depender de cor', () => {
    const labels = new Set(
      (Object.keys(statusLabels) as CampaignStatus[]).map((status) => {
        const { container, unmount } = render(<CampaignStatusLabel status={status} />);
        const text = container.textContent;
        unmount();
        return text;
      }),
    );
    expect(labels.size).toBe(Object.keys(statusLabels).length);
  });
  it('reutiliza a mesma anatomia no rascunho de criação', () => {
    render(<CampaignStatusLabel status="draft" label="Rascunho demonstrativo" />);
    expect(screen.getByText('Rascunho demonstrativo')).toBeInTheDocument();
  });
  it('não volta ao formato de cápsula com fundo e borda', () => {
    const style = css.match(/\.status\s*\{([^}]+)\}/)![1]!;
    expect(style).not.toMatch(/background|border/);
    expect(css).not.toMatch(/\.statusDot|\.draftDot|\.statusSymbol/);
  });
});

describe('diretriz de cores frias no piloto', () => {
  it('mantém toda a paleta em neutros ou matizes frios, inclusive estados interativos', () => {
    const colors = [
      ...new Set(css.match(/#[\da-f]{8}\b|#[\da-f]{6}\b|#[\da-f]{4}\b|#[\da-f]{3}\b/gi)),
    ];
    for (const color of colors) {
      const [r, g, b] = rgb(color) as [number, number, number];
      const max = Math.max(r, g, b),
        min = Math.min(r, g, b),
        delta = max - min;
      if (delta < 0.015) continue;
      let hue =
        (max === r
          ? ((g - b) / delta) % 6
          : max === g
            ? (b - r) / delta + 2
            : (r - g) / delta + 4) * 60;
      if (hue < 0) hue += 360;
      expect(hue, `${color} precisa permanecer frio`).toBeGreaterThanOrEqual(200);
      expect(hue, `${color} precisa permanecer frio`).toBeLessThanOrEqual(280);
    }
  });
  it('preserva contraste dos textos sobre superfícies claras', () => {
    for (const background of ['#ffffff', token('canvas'), '#e5ebf6']) {
      expect(contrast(token('status-ink'), background)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('preserva contraste do título, apoio e ação na faixa informativa', () => {
    expect(contrast('#ffffff', token('info-background'))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token('info-support'), token('info-background'))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token('info-background'), '#eef2ff')).toBeGreaterThanOrEqual(4.5);
  });
});

describe('diretriz plana, sem novos vetores', () => {
  it('não usa gradientes, sombras ou efeitos de relevo no piloto', () => {
    expect(css).not.toMatch(/(?:linear|radial|conic)-gradient\s*\(/);
    expect(css).not.toMatch(/(?:box-shadow|text-shadow|drop-shadow|perspective)\s*[:(]/);
    expect(css).not.toMatch(/translate[XYZ]?\s*\(|rotate[XYZ]?\s*\(/);
  });
  it('usa apenas a biblioteca instalada para ícones e o controle nativo para seleção', () => {
    const directory = resolve(process.cwd(), 'src/app/campanhas');
    for (const file of readdirSync(directory).filter(
      (name) => name.endsWith('.tsx') && !name.endsWith('.test.tsx'),
    )) {
      expect(readFileSync(resolve(directory, file), 'utf8'), file).not.toMatch(/<svg\b/);
    }
    expect(css).not.toContain('data:image/svg');
    const checkbox = css.match(/\.checkTarget input\s*\{([^}]+)\}/)![1]!;
    expect(checkbox).toContain('accent-color: var(--accent-ink)');
    expect(checkbox).not.toContain('appearance: none');
  });
});
