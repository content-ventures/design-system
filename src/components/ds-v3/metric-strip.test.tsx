/**
 * Indicador clicável: `href` vira link e `onClick` vira botão sem mudar o desenho; o nome acessível
 * vem do conteúdo. Sem ação continua grupo rotulado. Carregando não é alvo.
 * Tendência: linha só com dois pontos ou mais. Medidor cinza por padrão. Cinco indicadores quebram
 * sem célula vazia.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Metric, MetricStrip } from './metric-strip';

describe('Metric — clicável', () => {
  it('sem ação é um grupo rotulado, fora da ordem de tabulação', () => {
    render(
      <MetricStrip label="Indicadores">
        <Metric label="Em produção" value="12" hint="2 gerando agora" />
      </MetricStrip>,
    );
    const group = screen.getByRole('group', { name: 'Em produção' });
    expect(group).not.toHaveAttribute('tabindex');
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('href vira link com o conteúdo no nome e responde a Enter', async () => {
    const user = userEvent.setup();
    const open = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <MetricStrip label="Indicadores">
        <Metric label="Aguardando aprovação" value="3" href="#aprovacao" onClick={open} />
      </MetricStrip>,
    );
    const link = screen.getByRole('link', { name: /Aguardando aprovação\s*3/ });
    expect(link).toHaveAttribute('href', '#aprovacao');
    expect(link).toHaveAttribute('data-interactive');

    await user.tab();
    expect(link).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('onClick vira botão e responde a Espaço', async () => {
    const user = userEvent.setup();
    const open = vi.fn();
    render(
      <MetricStrip
        label="Indicadores"
        items={[{ label: 'Aprovadas', value: '8', onClick: open }]}
      />,
    );
    const button = screen.getByRole('button', { name: /Aprovadas\s*8/ });
    expect(button).toHaveAttribute('type', 'button');

    button.focus();
    await user.keyboard(' ');
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('carregando não é link nem botão', () => {
    render(
      <MetricStrip label="Indicadores">
        <Metric label="Aprovadas" href="#aprovadas" loading />
      </MetricStrip>,
    );
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByRole('group', { name: 'Aprovadas' })).toHaveAttribute('aria-busy', 'true');
  });

  it('linkAs recebe o link do framework', () => {
    function FrameworkLink(props: { href: string; className?: string; children?: ReactNode }) {
      return <a data-framework="" {...props} />;
    }
    render(
      <MetricStrip label="Indicadores">
        <Metric label="Em produção" value="12" href="/productions" linkAs={FrameworkLink} />
      </MetricStrip>,
    );
    expect(screen.getByRole('link', { name: /Em produção/ })).toHaveAttribute('data-framework');
  });
});

describe('Metric — tendência e medidor', () => {
  it('tendência com dois pontos ou mais: linha decorativa e a leitura para leitor de tela', () => {
    render(
      <MetricStrip
        label="Indicadores"
        items={[
          {
            label: 'Cliques',
            value: '2.296',
            delta: { value: '10,2%', trend: 'up' },
            sparkline: { points: [290, 305, 318, 378], label: 'De 290 a 378 por dia' },
          },
        ]}
      />,
    );
    const cell = screen.getByRole('group', { name: 'Cliques' });
    expect(cell).toHaveAttribute('data-spark');
    const line = cell.querySelector('svg');
    expect(line).toHaveAttribute('aria-hidden', 'true');
    expect(line?.querySelector('path')?.getAttribute('d')).not.toMatch(/NaN/);
    expect(cell).toHaveTextContent('De 290 a 378 por dia');
  });

  it('sem linha com um ponto só, sem dado ou carregando', () => {
    render(
      <MetricStrip label="Indicadores">
        <Metric label="Leads" value="71" sparkline={{ points: [8] }} />
        <Metric label="CTR" empty sparkline={{ points: [2, 3] }} />
        <Metric label="Cliques" loading sparkline={{ points: [2, 3] }} />
      </MetricStrip>,
    );
    for (const name of ['Leads', 'CTR', 'Cliques']) {
      const cell = screen.getByRole('group', { name });
      expect(cell).not.toHaveAttribute('data-spark');
      expect(cell.querySelector('svg')).toBeNull();
    }
  });

  it('medidor cinza por padrão; o tom vem do Meter', () => {
    render(
      <MetricStrip label="Indicadores">
        <Metric label="Aproveitamento da IA" value="77,5" unit="%" meter={{ value: 77.5, label: 'Palavras mantidas' }} />
        <Metric label="Entrega" value="86" unit="%" meter={{ value: 86, label: 'Entrega do plano', tone: 'amber' }} />
      </MetricStrip>,
    );
    expect(screen.getByRole('progressbar', { name: 'Palavras mantidas' })).toHaveAttribute('data-tone', 'neutral');
    expect(screen.getByRole('progressbar', { name: 'Entrega do plano' })).toHaveAttribute('data-tone', 'amber');
  });
});

describe('MetricStrip — linhas sem célula vazia', () => {
  /** Regra do próprio módulo (jsdom não faz layout; a quebra real é conferida no navegador). */
  function rule(selector: string) {
    const css = readFileSync(join(__dirname, 'metric-strip.module.css'), 'utf8');
    const escaped = selector.replace(/[.*+?^${}()|[\]\\>]/g, '\\$&');
    return css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
  }

  it('cinco indicadores marcam cinco colunas', () => {
    render(
      <MetricStrip
        label="Indicadores dos últimos 7 dias"
        items={['Em produção', 'Aguardando aprovação', 'Aprovações', 'Tempo até aprovação', 'Aproveitamento da IA'].map(
          (label, index) => ({ label, value: String(index + 1) }),
        )}
      />,
    );
    const strip = screen.getByRole('region', { name: 'Indicadores dos últimos 7 dias' });
    expect(strip).toHaveAttribute('data-cols', '5');
    expect(strip.children).toHaveLength(5);
  });

  it('a faixa quebra em linhas e a última se reparte por igual (5 → 3 + 2 → 2 + 2 + 1)', () => {
    expect(rule('.strip')).toMatch(/display:\s*flex/);
    expect(rule('.strip')).toMatch(/flex-wrap:\s*wrap/);
    // Base de 1/cols (menos 1 px de folga de arredondamento) e crescimento: a sobra vai para as células.
    expect(rule('.strip > *')).toMatch(/flex:\s*1 1 calc\(100% \/ var\(--cols\) - 1px\)/);
  });
});
