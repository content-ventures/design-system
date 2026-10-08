/**
 * Medidor: cinza por padrão (prontidão, progresso), porque azul é ação e nunca status. Âmbar,
 * vermelho e verde só quando pedidos. A tendência sem pontos não desenha nada.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Meter, Sparkline } from './stat';

/** Corpo de uma regra do próprio módulo (jsdom não calcula estilo de CSS Modules). */
function rule(selector: string) {
  const css = readFileSync(join(__dirname, 'stat.module.css'), 'utf8');
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
}

describe('Meter', () => {
  it('sem tom é neutro, com a barra em cinza', () => {
    render(<Meter value={3} max={4} label="Prontidão: 3 de 4 conferências" />);
    const bar = screen.getByRole('progressbar', { name: 'Prontidão: 3 de 4 conferências' });
    expect(bar).toHaveAttribute('aria-valuenow', '3');
    expect(bar).toHaveAttribute('aria-valuemax', '4');
    expect(bar.parentElement).toHaveAttribute('data-tone', 'neutral');
    expect(rule('.meterFill')).toMatch(/background:\s*var\(--gray-dot\)/);
    expect(rule(".meter[data-tone='blue'] .meterFill")).toMatch(/background:\s*var\(--b-600\)/);
  });

  it('na tabela (inline) também é neutro e mostra o percentual', () => {
    render(<Meter value={3} max={4} label="Prontidão" inline />);
    const bar = screen.getByRole('progressbar', { name: 'Prontidão' });
    expect(bar.parentElement).toHaveAttribute('data-tone', 'neutral');
    expect(bar.parentElement).toHaveTextContent('75%');
  });

  it('tom de atenção quando pedido', () => {
    render(<Meter value={1} max={4} label="Prontidão: 2 bloqueiam" tone="amber" />);
    expect(screen.getByRole('progressbar', { name: 'Prontidão: 2 bloqueiam' }).parentElement).toHaveAttribute(
      'data-tone',
      'amber',
    );
  });
});

describe('Sparkline', () => {
  it('sem pontos não desenha', () => {
    const { container } = render(<Sparkline points={[]} />);
    expect(container.querySelector('svg')).toBeNull();
  });

  it('com pontos, traço sem NaN e ponto no último valor', () => {
    const { container } = render(<Sparkline points={[3, 3, 3]} tone="gray" />);
    expect(container.querySelector('path')?.getAttribute('d')).not.toMatch(/NaN/);
    expect(container.querySelector('circle')).not.toBeNull();
  });
});

describe('Sparkline fluida', () => {
  it('estica só na horizontal: traço que não escala e o ponto final como segmento redondo', () => {
    const { container } = render(<Sparkline points={[290, 305, 378]} width={64} height={24} tone="gray" fluid />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('preserveAspectRatio', 'none');
    expect(svg).not.toHaveAttribute('width');
    const [line, dot] = Array.from(container.querySelectorAll('path'));
    expect(line).toHaveAttribute('vector-effect', 'non-scaling-stroke');
    expect(dot?.getAttribute('d')).toMatch(/h0$/);
    expect(dot).toHaveAttribute('stroke-linecap', 'round');
    expect(container.querySelector('circle')).toBeNull();
  });
});
