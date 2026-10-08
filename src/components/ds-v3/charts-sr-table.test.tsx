/**
 * Tabela para leitor de tela dos gráficos: fica dentro de um bloco oculto que recorta. Uma `table`
 * ignora a largura de 1 px e não recorta, então sozinha alargava a página no celular (408 px numa
 * tela de 390). O nome da tabela continua vindo da legenda (`caption`).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BarChart, DonutChart, LineChart, SankeyChart, type ChartDatum, type ChartSeries } from './charts';

const DAYS: ChartDatum[] = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((label, index) => ({
  label,
  title: `${label} · ${index + 10}/10/2026`,
  values: { aprovadas: index % 3 },
}));
const SERIES: ChartSeries[] = [{ key: 'aprovadas', label: 'Aprovações' }];

/** O bloco oculto vem da regra `.srOnly` do próprio módulo. */
function srOnlyRule() {
  const css = readFileSync(join(__dirname, 'charts.module.css'), 'utf8');
  return css.match(/\.srOnly\s*\{([^}]*)\}/)?.[1] ?? '';
}

function expectHiddenBlock(name: string) {
  const table = screen.getByRole('table', { name });
  const wrapper = table.parentElement;
  expect(wrapper?.tagName).toBe('DIV');
  // A tabela não carrega a regra de oculto (nela, largura 1 px e recorte não valem).
  expect(table).not.toHaveAttribute('class');
  expect(wrapper).toHaveAttribute('class');
  expect(wrapper?.children).toHaveLength(1);
}

describe('Gráficos — tabela para leitor de tela', () => {
  it('a regra de oculto recorta: bloco absoluto de 1 px com overflow escondido', () => {
    const rule = srOnlyRule();
    expect(rule).toMatch(/position:\s*absolute/);
    expect(rule).toMatch(/width:\s*1px/);
    expect(rule).toMatch(/overflow:\s*hidden/);
    expect(rule).toMatch(/clip-path:\s*inset\(50%\)/);
  });

  it('linha: tabela dentro de um div oculto, com o nome do gráfico', () => {
    render(<LineChart label="Aprovações por dia nos últimos 7 dias" data={DAYS} series={SERIES} />);
    expectHiddenBlock('Aprovações por dia nos últimos 7 dias');
  });

  it('barras: tabela dentro de um div oculto', () => {
    render(<BarChart label="Aprovações por dia" data={DAYS} series={SERIES} />);
    expectHiddenBlock('Aprovações por dia');
  });

  it('rosca: tabela dentro de um div oculto', () => {
    render(
      <DonutChart
        label="Peças por formato"
        data={[
          { key: 'artigo', label: 'Artigo', value: 6 },
          { key: 'carrossel', label: 'Carrossel', value: 3 },
        ]}
      />,
    );
    expectHiddenBlock('Peças por formato');
  });

  it('sankey: tabela dentro de um div oculto', () => {
    render(
      <SankeyChart
        label="Da entrevista à aprovação"
        nodes={[
          { key: 'entrevista', label: 'Entrevista' },
          { key: 'aprovada', label: 'Aprovada' },
        ]}
        links={[{ source: 'entrevista', target: 'aprovada', value: 4 }]}
      />,
    );
    expectHiddenBlock('Da entrevista à aprovação');
  });
});
