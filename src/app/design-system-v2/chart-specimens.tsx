'use client';
import { useState } from 'react';
import { Button, Select } from '../../components/ds-v2';
import { Stage, Segmented } from './specimen-ui';
import s from './specimen.module.css';

const periods = ['Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out'];
const series = [
  { name: 'Display', color: '#1686cf', values: [42, 58, 48, 76, 64, 92] },
  { name: 'E-mail', color: '#58a98b', values: [22, 31, 27, 43, 35, 54] },
  { name: 'Social', color: '#bba274', values: [18, 24, 32, 23, 39, 30] },
];
export function ChartSpecimen({ id, embedded = false }: { id: string; embedded?: boolean }) {
  const [visible, setVisible] = useState(['Display', 'E-mail', 'Social']);
  const [state, setState] = useState('Com dados');
  const [period, setPeriod] = useState('Semestre');
  const area = id === 'grafico-area';
  const line =
    id === 'grafico-linhas' || area || id === 'grafico-eixos' || id === 'grafico-estados';
  const donut = id === 'grafico-rosca';
  const funnel = id === 'grafico-funil';
  const stacked = id === 'grafico-empilhado';
  const data = series
    .filter((item) => visible.includes(item.name))
    .map((item) => ({
      ...item,
      values: period === 'Trimestre' ? item.values.slice(3) : item.values,
    }));
  const months = period === 'Trimestre' ? periods.slice(3) : periods;
  const max = stacked ? 200 : 100;
  const x = (index: number) => 54 + index * (490 / Math.max(1, months.length - 1));
  const y = (value: number) => 222 - (value / max) * 180;
  const content = (
    <div className={s.stack}>
      {!embedded && (
        <div className={s.spread}>
          <div>
            <h3>
              {donut
                ? 'Distribuição por canal'
                : funnel
                  ? 'Conversão do pipeline'
                  : 'Impressões por canal'}
            </h3>
            <p className={s.muted}>
              Cenário fictício ·{' '}
              {donut
                ? 'participação nas impressões'
                : funnel
                  ? 'contatos em cada etapa'
                  : 'em milhares'}
            </p>
          </div>
          <Select
            compact
            label="Período do gráfico"
            value={period}
            onValueChange={setPeriod}
            options={['Semestre', 'Trimestre'].map((value) => ({ value, label: value }))}
          />
        </div>
      )}
      {state === 'Carregando' ? (
        <div
          role="status"
          aria-label="Carregando gráfico"
          className={s.stack}
          style={{ height: 260, justifyContent: 'end' }}
        >
          {[85, 65, 100, 75].map((width, index) => (
            <div key={index} className={s.skeleton} style={{ width: `${width}%`, height: 26 }} />
          ))}
        </div>
      ) : state === 'Sem dados' || !data.length ? (
        <div className={s.empty}>
          <h3>Nenhum dado para exibir</h3>
          <p>Selecione um canal ou amplie o período.</p>
          <Button
            onClick={() => {
              setVisible(series.map((item) => item.name));
              setState('Com dados');
            }}
          >
            Restaurar visualização
          </Button>
        </div>
      ) : state === 'Erro' ? (
        <div className={s.empty}>
          <h3>Não foi possível carregar as métricas</h3>
          <Button onClick={() => setState('Com dados')}>Tentar novamente</Button>
        </div>
      ) : (
        <>
          <svg
            className={s.chart}
            viewBox="0 0 600 270"
            role="img"
            aria-label={`${donut ? 'Participação nas impressões' : funnel ? 'Funil de contatos' : 'Impressões em milhares'}: ${data.map((item) => item.name).join(', ')}. Os valores completos estão na tabela abaixo.`}
          >
            {!donut && !funnel && (
              <>
                {[0, 25, 50, 75, 100].map((tick) => (
                  <g key={tick}>
                    <line
                      x1="42"
                      x2="570"
                      y1={y((tick * max) / 100)}
                      y2={y((tick * max) / 100)}
                      stroke="#ededf0"
                    />
                    <text x="32" y={y((tick * max) / 100) + 4} textAnchor="end">
                      {(tick * max) / 100}k
                    </text>
                  </g>
                ))}
                {months.map((month, index) => (
                  <text key={month} x={x(index)} y="250" textAnchor="middle">
                    {month}
                  </text>
                ))}
              </>
            )}
            {line &&
              data.map((item) => (
                <g key={item.name}>
                  {area && (
                    <path
                      d={`M ${x(0)} 222 ${item.values.map((value, index) => `L ${x(index)} ${y(value)}`).join(' ')} L ${x(item.values.length - 1)} 222 Z`}
                      fill={item.color}
                      opacity=".09"
                    />
                  )}
                  <polyline
                    points={item.values.map((value, index) => `${x(index)},${y(value)}`).join(' ')}
                    fill="none"
                    stroke={item.color}
                    strokeWidth="2"
                  />
                  {item.values.map((value, index) => (
                    <circle key={index} cx={x(index)} cy={y(value)} r="3.5" fill={item.color}>
                      <title>
                        {months[index]} · {item.name}: {value} mil
                      </title>
                    </circle>
                  ))}
                </g>
              ))}
            {!line &&
              !donut &&
              !funnel &&
              months.map((month, index) => (
                <g key={month}>
                  {data.map((item, seriesIndex) => {
                    const value = item.values[index] ?? 0;
                    const offset = stacked
                      ? data
                          .slice(0, seriesIndex)
                          .reduce((total, previous) => total + (previous.values[index] ?? 0), 0)
                      : 0;
                    return (
                      <rect
                        key={item.name}
                        x={x(index) - 13 + (stacked ? 0 : seriesIndex * 9)}
                        y={y(value + offset)}
                        width={stacked ? 26 : 8}
                        height={(value / max) * 180}
                        rx="2"
                        fill={item.color}
                      >
                        <title>
                          {month} · {item.name}: {value} mil
                        </title>
                      </rect>
                    );
                  })}
                </g>
              ))}
            {donut && (
              <>
                <circle cx="220" cy="130" r="82" fill="none" stroke="#f3f4f5" strokeWidth="30" />
                {data.map((item, index) => {
                  const total = data.reduce(
                    (sum, entry) => sum + entry.values.reduce((a, b) => a + b, 0),
                    0,
                  );
                  const amount = item.values.reduce((a, b) => a + b, 0) / total;
                  const prior =
                    data
                      .slice(0, index)
                      .reduce((sum, entry) => sum + entry.values.reduce((a, b) => a + b, 0), 0) /
                    total;
                  return (
                    <circle
                      key={item.name}
                      cx="220"
                      cy="130"
                      r="82"
                      fill="none"
                      stroke={item.color}
                      strokeWidth="30"
                      strokeDasharray={`${amount * 515.22 - 3} 515.22`}
                      strokeDashoffset={-prior * 515.22}
                      transform="rotate(-90 220 130)"
                    >
                      <title>
                        {item.name}: {Math.round(amount * 100)}%
                      </title>
                    </circle>
                  );
                })}
                <text x="220" y="124" textAnchor="middle">
                  Impressões
                </text>
                <text
                  x="220"
                  y="147"
                  textAnchor="middle"
                  style={{ fontSize: 21, fontWeight: 600, fill: '#151719' }}
                >
                  {data.reduce(
                    (total, item) => total + item.values.reduce((sum, value) => sum + value, 0),
                    0,
                  )}{' '}
                  mil
                </text>
                {data.map((item, index) => (
                  <g key={item.name}>
                    <circle cx="372" cy={86 + index * 42} r="4" fill={item.color} />
                    <text x="388" y={90 + index * 42}>
                      {item.name}
                    </text>
                  </g>
                ))}
              </>
            )}
            {funnel &&
              [
                ['Novos contatos', 1200],
                ['Qualificados', 720],
                ['Propostas', 240],
                ['Fechados', 96],
              ].map(([label, value], index) => (
                <g key={label}>
                  <rect
                    x="130"
                    y={20 + index * 58}
                    width={(Number(value) / 1200) * 370}
                    height="35"
                    rx="4"
                    fill={['#1686cf', '#3f97d0', '#72b1dc', '#a3cde9'][index]}
                  />
                  <text x="115" y={42 + index * 58} textAnchor="end">
                    {label}
                  </text>
                  <text x={140 + (Number(value) / 1200) * 370} y={42 + index * 58}>
                    {value}
                  </text>
                </g>
              ))}
          </svg>
          {!funnel && (
            <div className={s.legend} role="group" aria-label="Séries do gráfico">
              {series.map((item) => (
                <button
                  key={item.name}
                  aria-pressed={visible.includes(item.name)}
                  onClick={() =>
                    setVisible((previous) =>
                      previous.includes(item.name)
                        ? previous.filter((name) => name !== item.name)
                        : [...previous, item.name],
                    )
                  }
                >
                  <i style={{ background: item.color }} />
                  {item.name}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      <details className={s.chartTable}>
        <summary>Ver valores em tabela</summary>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <caption>{funnel ? 'Contatos por etapa' : 'Impressões em milhares por canal'}</caption>
            <thead>
              <tr>
                <th scope="col">{funnel ? 'Etapa' : 'Canal'}</th>
                {(funnel ? ['Contatos'] : months).map((month) => (
                  <th key={month} scope="col">
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {funnel
                ? [
                    ['Novos contatos', 1200],
                    ['Qualificados', 720],
                    ['Propostas', 240],
                    ['Fechados', 96],
                  ].map(([label, value]) => (
                    <tr key={label}>
                      <th scope="row">{label}</th>
                      <td>{value}</td>
                    </tr>
                  ))
                : data.map((item) => (
                    <tr key={item.name}>
                      <th scope="row">{item.name}</th>
                      {item.values.map((value, index) => (
                        <td key={index}>{value}</td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
  return embedded ? (
    content
  ) : (
    <Stage
      title="Visualização de métricas"
      tools={
        id === 'grafico-estados' ? (
          <Segmented
            label="Estado do gráfico"
            values={['Com dados', 'Carregando', 'Sem dados', 'Erro']}
            value={state}
            onChange={setState}
          />
        ) : undefined
      }
    >
      {content}
    </Stage>
  );
}
