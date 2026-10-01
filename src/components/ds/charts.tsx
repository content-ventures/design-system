'use client';

import { useId, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Segmented } from './primitives';
import s from './patterns.module.css';

const impressions = [
  1200, 1450, 1100, 1700, 1680, 2050, 1870, 2530, 2340, 2780, 2400, 3060, 3280, 3220,
];
const leads = [12, 14, 11, 19, 16, 24, 22, 27, 21, 32, 28, 34, 40, 37];
export function PerformanceChart({
  kind = 'line',
  compact = false,
}: {
  kind?: 'line' | 'area' | 'bar';
  compact?: boolean;
}) {
  const [metric, setMetric] = useState('impressoes');
  const [period, setPeriod] = useState('14');
  const chartId = useId();
  const data = (metric === 'impressoes' ? impressions : leads).slice(-Number(period));
  const total = data.reduce((a, b) => a + b, 0);
  const max = metric === 'impressoes' ? 4000 : 50;
  const coords = data.map((v, i) => [44 + (i / (data.length - 1)) * 516, 156 - (v / max) * 124]);
  const path = coords.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
  const label = metric === 'impressoes' ? 'Impressões' : 'Leads';
  return (
    <div className={s.chartPanel}>
      <div className={s.panelHeading}>
        <span>Performance de mídia</span>
        <Segmented
          label="Período do gráfico"
          value={period}
          onChange={setPeriod}
          options={[
            { value: '7', label: '7 dias' },
            { value: '14', label: '14 dias' },
          ]}
        />
      </div>
      <div className={s.chartMetrics}>
        <div>
          <span className={s.microLabel}>{label}</span>
          <div className={s.metricValue}>
            {new Intl.NumberFormat('pt-BR').format(total)}
            <span>
              <ArrowUpRight size={13} /> {metric === 'impressoes' ? '18,4' : '12,8'}%
            </span>
          </div>
        </div>
        <Segmented
          label="Métrica do gráfico"
          value={metric}
          onChange={setMetric}
          options={[
            { value: 'impressoes', label: 'Impressões' },
            { value: 'leads', label: 'Leads' },
          ]}
        />
      </div>
      <svg className={s.chart} viewBox="0 0 584 193" role="img" aria-labelledby={chartId}>
        <title id={chartId}>
          {label} nos últimos {period} dias: {total.toLocaleString('pt-BR')} no total. Dados
          fictícios, com tendência de crescimento.
        </title>
        {[0, 0.5, 1].map((tick) => (
          <g key={tick}>
            <line
              x1="44"
              x2="568"
              y1={156 - tick * 124}
              y2={156 - tick * 124}
              className={s.gridLine}
            />
            <text x="30" y={160 - tick * 124} textAnchor="end">
              {(max * tick).toLocaleString('pt-BR')}
            </text>
          </g>
        ))}
        {kind === 'bar' ? (
          data.map((v, i) => (
            <rect
              key={i}
              x={44 + i * (516 / data.length)}
              y={156 - (v / max) * 124}
              height={(v / max) * 124}
              width={516 / data.length - 10}
              rx="3"
              fill="var(--ds-brand)"
            >
              <title>
                {i + 30 - data.length} set.: {v.toLocaleString('pt-BR')} {label.toLowerCase()}
              </title>
            </rect>
          ))
        ) : (
          <>
            {kind === 'area' && (
              <path d={`${path} L560,156 L44,156 Z`} fill="var(--ds-brand-soft)" />
            )}
            <path
              key={`${metric}-${period}`}
              className={s.chartLine}
              pathLength={1}
              d={path}
              fill="none"
              stroke="var(--ds-brand)"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {coords.map(([x, y], i) => (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={i === data.length - 1 ? 4 : 2.5}
                fill="var(--ds-surface)"
                stroke="var(--ds-brand)"
                strokeWidth="1.8"
              >
                <title>
                  {i + 30 - data.length} set.: {data[i]?.toLocaleString('pt-BR')}
                </title>
              </circle>
            ))}
          </>
        )}
        {[0, Math.floor((data.length - 1) / 2), data.length - 1].map((i) => (
          <text
            key={i}
            x={44 + (i / (data.length - 1)) * 516}
            y="184"
            textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
          >
            {i + 30 - data.length} set.
          </text>
        ))}
      </svg>
      <div className={s.chartFooter}>
        <span>
          <i />
          {label}
        </span>
        <span>{30 - data.length}–29 set. 2026 · Exemplo</span>
      </div>
      {!compact && (
        <details className={s.dataDisclosure}>
          <summary>Ver dados em tabela</summary>
          <div className={s.tableScroll}>
            <table>
              <caption>Valores fictícios usados no gráfico</caption>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>{label}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((v, i) => (
                  <tr key={i}>
                    <td>{i + 30 - data.length}/09/2026</td>
                    <td>{v.toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}

export function ChannelChart() {
  const channels = [
    { name: 'Vitrine', value: 48 },
    { name: 'Mídia de performance', value: 32 },
    { name: 'E-mail', value: 20 },
  ];
  return (
    <div className={s.channelChart}>
      <h3>Origem dos leads</h3>
      <p>Distribuição por canal · dados fictícios</p>
      {channels.map((c, i) => (
        <div key={c.name}>
          <span>{c.name}</span>
          <strong>{c.value}%</strong>
          <div className={s.channelTrack}>
            <span
              style={{
                width: `${c.value}%`,
                background:
                  i === 0 ? 'var(--ds-brand)' : i === 1 ? 'var(--ds-chart-3)' : 'var(--ds-chart-2)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
