'use client';

import { ArrowDownRight, ArrowUpRight, Download, Minus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Button, Segmented, Tooltip, VisuallyHidden, type SegmentOption } from '@/components/ds-v3';
import { ChartKey, LineChart, formatCompact, formatInt, type ChartDatum } from '@/components/ds-v3/charts';
import { toast } from '@/components/ds-v3/toast';
import type { CampaignStatus } from '../domain';
import { brl, dateBR, dateShort, int, parseMoney, pct } from '../pricing';
import type { Campaign } from '../store';
import {
  AS_OF,
  breakdown,
  buildAnalytics,
  isFairDay,
  metricOf,
  plannedDaily,
  plannedUntil,
  sumDays,
  weekdayShort,
  windowOf,
  type Analytics,
  type DayRow,
  type RangeKey,
} from './analytics-data';
import a from './analytics.module.css';

/** Previsão já formatada pelo detalhe (as mesmas regras de verba e estimativa da visão geral). */
export type ForecastItem = { label: string; value?: string; hint: string };

const RANGES: SegmentOption<RangeKey>[] = [
  { value: '7d', label: '7 dias' },
  { value: '14d', label: '14 dias' },
  { value: 'all', label: 'Todo o período' },
];
type Mode = 'daily' | 'cumulative';
const MODES: SegmentOption<Mode>[] = [
  { value: 'daily', label: 'Por dia' },
  { value: 'cumulative', label: 'Acumulado' },
];

const decimal = (value: number, digits = 1) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const ratio = (part: number, whole: number) => (whole > 0 ? part / whole : 0);
/** Frequência por pessoa, com a mesma regra do construtor ("< 0,01×" abaixo de um centésimo). */
const times = (volume: number, people: number) => {
  if (!people) return '—';
  const f = volume / people;
  return f > 0 && f < 0.01 ? '< 0,01×' : `${decimal(f, 2)}×`;
};
/** "21/10 · 16:42" */
const stamp = (iso: string) => `${dateShort(iso.slice(0, 10))} · ${iso.slice(11, 16)}`;

/* ——— Variação ——— */
/**
 * Seta e percentual no topo da célula. Para o leitor de tela, a variação vem depois do valor (ordem
 * do DOM) e diz a direção e a base: "alta de 33,7% em relação aos 7 dias anteriores".
 */
function Change({ value, unit, better, basis }: { value: number; unit: '%' | 'p.p.'; better: 'up' | 'down'; basis: string }) {
  const flat = Math.abs(value) < (unit === '%' ? 0.05 : 0.5);
  const up = value > 0;
  const good = flat ? undefined : up === (better === 'up');
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  // Pontos percentuais em inteiros: cabem ao lado do rótulo e bastam para ler o ritmo.
  const text = unit === '%' ? `${decimal(Math.abs(value))}%` : `${decimal(Math.abs(value), 0)} p.p.`;
  return (
    <span className={a.change} data-tone={good === undefined ? 'flat' : good ? 'good' : 'bad'}>
      <Icon aria-hidden="true" />
      <VisuallyHidden>{flat ? 'estável, ' : up ? 'alta de ' : 'queda de '}</VisuallyHidden>
      {text}
      <VisuallyHidden>{` em relação ${basis}`}</VisuallyHidden>
    </span>
  );
}

type Kpi = { key: string; label: string; value: string; change?: { value: number; unit: '%' | 'p.p.'; better: 'up' | 'down' }; hint: string; warn?: boolean };

/** Largura do contêiner do gráfico, para escolher quantas datas cabem no eixo. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setWidth(element.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/**
 * Marcas do eixo X: datas redondas (01, 05, 10…) quando o período é longo, de N em N dias
 * (contando do último) quando é curto, e nunca mais do que cabe na largura (~64 px por "05/10").
 */
function xTicksFor(dates: string[], width: number) {
  const n = dates.length;
  const room = Math.max(4, Math.floor(((width || 1000) - 56) / 64));
  const all = dates.map((_, i) => i);
  if (n <= Math.min(room, 8)) return all;
  const everyFromEnd = (step: number) => all.filter((i) => (n - 1 - i) % step === 0);
  if (n <= 16) return everyFromEnd(Math.max(2, Math.ceil(n / room)));
  for (const days of [
    [1, 5, 10, 15, 20, 25],
    [1, 10, 20],
  ]) {
    const ticks = all.filter((i) => days.includes(Number(dates[i]?.slice(8, 10))));
    const first = ticks[0];
    if (first === undefined || first >= 3) ticks.unshift(0);
    const last = ticks[ticks.length - 1] ?? 0;
    if (n - 1 - last >= 3) ticks.push(n - 1);
    if (ticks.length <= room) return ticks;
  }
  return everyFromEnd(Math.ceil(n / room));
}

export function CampaignAnalytics({ campaign, forecast }: { campaign: Campaign; forecast: ForecastItem[] }) {
  const an = useMemo(() => buildAnalytics(campaign), [campaign]);
  if (!an) return <AnalyticsEmpty status={campaign.status} forecast={forecast} />;
  return <AnalyticsBoard campaign={campaign} an={an} />;
}

/**
 * Período inicial: concluída abre no período inteiro (a primeira leitura é o resultado final). No ar,
 * a maior janela que tem um período anterior completo do mesmo tamanho para comparar.
 */
function initialRange(an: Analytics, status: CampaignStatus): RangeKey {
  if (status === 'completed') return 'all';
  const elapsed = an.days.length;
  if (elapsed >= 28) return '14d';
  if (elapsed >= 14) return '7d';
  return 'all';
}

function AnalyticsBoard({ campaign, an }: { campaign: Campaign; an: Analytics }) {
  const [range, setRange] = useState<RangeKey>(() => initialRange(an, campaign.status));
  const [mode, setMode] = useState<Mode>('daily');
  const [chartRef, chartWidth] = useWidth<HTMLDivElement>();
  const metric = an.metric;
  const win = windowOf(an, range);
  const totals = sumDays(win.days);
  const prevTotals = sumDays(win.prev);
  // Só compara janelas do mesmo tamanho: 14 dias contra 8 mediria a diferença das janelas, não a campanha.
  const comparable = range !== 'all' && win.prev.length > 0 && win.prev.length === win.days.length;
  const first = win.days[0]?.iso ?? '';
  const last = win.days[win.days.length - 1]?.iso ?? '';
  const basis = win.prev.length === 1 ? 'o dia anterior' : `os ${win.prev.length} dias anteriores`;
  const basisAfter = win.prev.length === 1 ? 'ao dia anterior' : `aos ${win.prev.length} dias anteriores`;
  const budget = parseMoney(campaign.draft.budget);
  const lastRead = an.days[an.days.length - 1]?.iso ?? '';
  const status =
    campaign.status === 'paused' && an.pausedAt
      ? { text: `Pausada desde ${dateShort(an.pausedAt)}`, warn: true }
      : campaign.status === 'completed'
        ? { text: `Concluída em ${dateShort(lastRead)}`, warn: false }
        : { text: `Atualizado em ${dateShort(AS_OF)}`, warn: false };

  /* ——— Indicadores ——— */
  const perDay = (value: number, days: DayRow[]) => ratio(value, days.length);
  /** Variação de volume pela média diária (janelas de tamanhos diferentes continuam comparáveis). */
  const volumeChange = (now: number, before: number) => {
    const b = perDay(before, win.prev);
    return comparable && b > 0 ? { value: (perDay(now, win.days) / b - 1) * 100, unit: '%' as const, better: 'up' as const } : undefined;
  };
  const metricNow = metricOf(an, totals);
  const metricBefore = metricOf(an, prevTotals);
  const ctr = ratio(totals.clicks, totals.impressions) * 100;
  const ctrBefore = ratio(prevTotals.clicks, prevTotals.impressions) * 100;
  const spend = metricNow * an.unitCost;
  const cpl = totals.leads > 0 && an.unitCost > 0 ? spend / totals.leads : undefined;
  const cplBefore = prevTotals.leads > 0 && an.unitCost > 0 ? (metricBefore * an.unitCost) / prevTotals.leads : undefined;
  const plannedWindow = plannedDaily(an) * win.days.length;
  const plannedBefore = plannedDaily(an) * win.prev.length;
  const cumulative = metricOf(an, sumDays(an.days));
  const plannedToDate = plannedUntil(an, an.days.length - 1);
  const paceNow = range === 'all' ? ratio(cumulative, plannedToDate) : ratio(metricNow, plannedWindow);
  const paceBefore = ratio(metricBefore, plannedBefore);
  const planPct = Math.min(100, (an.days.length / an.calendar.length) * 100);

  const peak = win.days.reduce<DayRow | undefined>(
    (best, day) => (day.impressions > 0 && (!best || day.clicks / day.impressions > best.clicks / Math.max(1, best.impressions)) ? day : best),
    undefined,
  );
  const feminine = metric.unit === 'impressões';
  const metricHint =
    range === 'all'
      ? `de ${int(an.contracted)} ${feminine ? 'contratadas' : 'contratados'}`
      : `${pct(ratio(metricNow, an.contracted) * 100, 1)} do contratado`;

  const volume = (key: 'impressions' | 'clicks' | 'leads', label: string): Kpi => {
    const isMetric = metric.key === key;
    const now = totals[key];
    return {
      key,
      label,
      value: int(now),
      change: volumeChange(now, prevTotals[key]),
      hint: isMetric
        ? metricHint
        : key === 'leads'
          ? `${pct(ratio(totals.leads, totals.clicks) * 100, 1)} dos cliques`
          : `média de ${int(perDay(now, win.days))} por dia`,
    };
  };
  const kpis: Kpi[] = [
    volume('impressions', metric.key === 'impressions' ? metric.label : 'Impressões'),
    volume('clicks', 'Cliques'),
    {
      key: 'ctr',
      label: 'CTR',
      value: pct(ctr, 2),
      change: comparable && ctrBefore > 0 ? { value: (ctr / ctrBefore - 1) * 100, unit: '%', better: 'up' } : undefined,
      hint: peak ? `pico de ${pct(ratio(peak.clicks, peak.impressions) * 100, 2)} em ${dateShort(peak.iso)}` : 'Sem cliques',
    },
    volume('leads', 'Leads'),
    {
      key: 'cpl',
      label: 'Custo por lead',
      value: cpl !== undefined ? brl(cpl) : '—',
      change: comparable && cpl !== undefined && cplBefore ? { value: (cpl / cplBefore - 1) * 100, unit: '%', better: 'down' } : undefined,
      // "Verba" é sempre o valor contratado; o consumido diz que é consumo.
      hint:
        an.unitCost > 0
          ? range === 'all' && Number.isFinite(budget) && budget > 0
            ? `${brl(spend)} de ${brl(budget)}`
            : `${brl(spend)} gastos`
          : 'Sem verba contratada',
    },
    {
      key: 'pace',
      label: 'Entrega vs. plano',
      value: pct(paceNow * 100, 0),
      change: comparable && paceBefore > 0 ? { value: (paceNow - paceBefore) * 100, unit: 'p.p.', better: 'up' } : undefined,
      hint:
        range === 'all'
          ? campaign.status === 'completed'
            ? `${pct(an.delivered, 0)} entregue`
            : `${pct(an.delivered, 0)} entregue · plano ${pct(planPct, 0)}`
          : `plano de ${int(plannedWindow)}`,
      warn: range === 'all' && paceNow < 0.9 && campaign.status !== 'completed',
    },
  ];

  /* ——— Gráfico ——— */
  // O acumulado sempre cobre o contrato inteiro (a linha só faz sentido até a meta); os números de
  // cima seguem o período escolhido.
  const fullChart = range === 'all' || mode === 'cumulative';
  const chartDates = fullChart ? an.calendar : win.days.map((day) => day.iso);
  const offset = fullChart ? 0 : win.start;
  let acc = an.days.slice(0, offset).reduce((sum, day) => sum + (metric.key === 'clicks' ? day.clicks : day.impressions), 0);
  const data: ChartDatum[] = chartDates.map((iso, i) => {
    const index = offset + i;
    const day = an.days[index];
    const value = day ? (metric.key === 'clicks' ? day.clicks : day.impressions) : null;
    if (value !== null) acc += value;
    return {
      label: dateShort(iso),
      title: `${weekdayShort(iso)}, ${dateShort(iso)}${isFairDay(iso) ? ' · dia de feira' : ''}`,
      values:
        mode === 'daily'
          ? { real: value, plan: Math.round(plannedDaily(an)) }
          : { real: value === null ? null : acc, plan: Math.round(plannedUntil(an, index)) },
    };
  });

  /* ——— Canais e públicos ——— */
  const channels = breakdown(an.channels, totals);
  // Um canal só: o painel "Por canal" seria uma barra de 100%. O público ocupa a largura toda.
  const single = channels.length < 2;
  const audiences = breakdown(an.audiences, totals);
  const metricColumn = metric.key === 'impressions' ? metric.label : 'Impressões';
  const audienceTotal = audiences.reduce((sum, item) => sum + item.size, 0);
  const leadTotal = sumDays(an.days).leads;

  /** Planilha diária da janela (separador ";" e BOM, como o Exportar da lista). */
  function exportCsv() {
    const cell = (value: string) => (/[";\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
    const lines = [
      ['Data', metricColumn, 'Cliques', 'CTR', 'Leads', `Ritmo planejado (${metric.unit} por dia)`],
      ...win.days.map((day) => [
        dateBR(day.iso),
        String(day.impressions),
        String(day.clicks),
        pct(ratio(day.clicks, day.impressions) * 100, 2),
        String(day.leads),
        String(Math.round(plannedDaily(an))),
      ]),
    ].map((row) => row.map(cell).join(';'));
    const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `analytics-${campaign.id}-${range === 'all' ? 'periodo' : range}.csv`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    toast('CSV exportado.', { tone: 'info', description: `${win.days.length} ${win.days.length === 1 ? 'dia' : 'dias'} · ${campaign.draft.name}` });
  }

  return (
    <div className={a.board}>
      <div className={a.toolbar}>
        <Segmented size="sm" label="Período" options={RANGES} value={range} onChange={setRange} />
        <span className={a.window}>
          {first ? `${dateShort(first)} – ${dateShort(last)}` : '—'}
          {range !== 'all' && <span>{comparable ? `Variação contra ${basis}` : 'Sem período anterior completo'}</span>}
          <span data-warn={status.warn || undefined}>{status.text}</span>
        </span>
        <Button variant="ghost" size="sm" icon={Download} className={a.export} onClick={exportCsv}>
          Exportar CSV
        </Button>
      </div>

      <section className={a.kpis} aria-label="Indicadores do período">
        {/* Rótulo, valor, variação e legenda — a mesma régua das faixas do detalhe, sem enfeite. A
            variação vem depois do valor no DOM e sobe para o lado do rótulo pela grade. */}
        {kpis.map((kpi) => (
          <div key={kpi.key} className={a.kpi} role="group" aria-label={kpi.label}>
            <span className={a.kpiLabel} aria-hidden="true">
              {kpi.label}
            </span>
            <b className={a.kpiValue} data-empty={kpi.value === '—' || undefined}>
              {kpi.value}
            </b>
            {kpi.change && <Change {...kpi.change} basis={basisAfter} />}
            <span className={a.kpiHint} data-warn={kpi.warn || undefined}>
              {kpi.hint}
            </span>
          </div>
        ))}
      </section>

      <section className={a.panel} aria-labelledby="an-delivery">
        <header className={a.panelHead}>
          <div className={a.panelTitle}>
            <h2 id="an-delivery">{mode === 'daily' ? 'Entrega diária' : 'Entrega acumulada'}</h2>
            <ul className={a.keys} aria-label="Legenda">
              <li>
                <ChartKey color="blue" shape="line" />
                {metric.label}
              </li>
              <li>
                <ChartKey color="gray" shape="dashed" />
                Ritmo planejado
                <span>
                  {mode === 'daily'
                    ? `${int(plannedDaily(an))} por dia`
                    : `${int(an.contracted)} até ${dateShort(an.calendar[an.calendar.length - 1] ?? '')}`}
                </span>
              </li>
            </ul>
          </div>
          <Segmented size="sm" label="Leitura do gráfico" options={MODES} value={mode} onChange={setMode} />
        </header>
        <div className={a.chart} ref={chartRef} data-an-chart>
          <LineChart
            label={`${mode === 'daily' ? 'Entrega diária' : 'Entrega acumulada'} de ${metric.unit}`}
            data={data}
            series={[
              { key: 'real', label: metric.label, color: 'blue' },
              { key: 'plan', label: 'Ritmo planejado', color: 'gray', dashed: true },
            ]}
            area
            height={272}
            format={formatInt}
            axisFormat={formatCompact}
            xTicks={xTicksFor(chartDates, chartWidth)}
          />
        </div>
      </section>

      <div className={a.split} data-single={single || undefined}>
        {!single && (
        <section className={a.panel} aria-labelledby="an-channels">
          <header className={a.panelHead}>
            <div className={a.panelTitle}>
              <h2 id="an-channels">Por canal</h2>
              <p>{metricColumn} no período</p>
            </div>
          </header>
          <ol className={a.bars}>
            {channels.map((row) => {
              const value = metric.key === 'clicks' ? row.clicks : row.impressions;
              const share = ratio(value, metricNow) * 100;
              return (
                <li key={row.id}>
                  <div className={a.barHead}>
                    <span className={a.barName}>{row.name}</span>
                    <span className={a.barValue}>
                      <b>{int(value)}</b>
                      <span>{pct(share, 1)}</span>
                    </span>
                  </div>
                  <span className={a.track} aria-hidden="true">
                    <i style={{ width: `${share}%` }} />
                    {channels.length > 1 && <span className={a.planMark} style={{ left: `${row.plan}%` }} />}
                  </span>
                  <span className={a.barMeta}>
                    {int(row.clicks)} {row.clicks === 1 ? 'clique' : 'cliques'} · CTR {pct(ratio(row.clicks, row.impressions) * 100, 2)} · {int(row.leads)}{' '}
                    {row.leads === 1 ? 'lead' : 'leads'}
                    {channels.length > 1 && <> · plano {pct(row.plan, 0)}</>}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
        )}

        <section className={a.panel} aria-labelledby="an-audiences">
          <header className={a.panelHead}>
            <div className={a.panelTitle}>
              <h2 id="an-audiences">Por público</h2>
              <p>
                {metricColumn} no período
                {single && channels[0] ? ` · ${channels[0].name}` : ''}
              </p>
            </div>
          </header>
          <table className={a.table}>
            <thead>
              <tr>
                <th scope="col">Público</th>
                <th scope="col">{metricColumn}</th>
                <th scope="col">Cliques</th>
                <th scope="col">CTR</th>
                <th scope="col">Leads</th>
                <th scope="col">
                  <Tooltip content={`${metricColumn} por pessoa do público`}>
                    <span className={a.term} tabIndex={0}>
                      Frequência
                    </span>
                  </Tooltip>
                </th>
              </tr>
            </thead>
            <tbody>
              {audiences.map((row) => (
                <tr key={row.id}>
                  <th scope="row">
                    {row.name}
                    {/* Celular: CTR e frequência descem para a legenda do nome (3 números por linha). */}
                    <span className={a.rowMeta}>
                      CTR {pct(ratio(row.clicks, row.impressions) * 100, 2)} · frequência {times(row.impressions, row.size)}
                    </span>
                  </th>
                  <td data-label={metricColumn}>{int(row.impressions)}</td>
                  <td data-label="Cliques">{int(row.clicks)}</td>
                  <td data-label="CTR">{pct(ratio(row.clicks, row.impressions) * 100, 2)}</td>
                  <td data-label="Leads">{int(row.leads)}</td>
                  <td data-label="Frequência">{times(row.impressions, row.size)}</td>
                </tr>
              ))}
            </tbody>
            {audiences.length > 1 && (
              <tfoot>
                <tr>
                  <th scope="row">
                    Total
                    <span className={a.rowMeta}>
                      CTR {pct(ctr, 2)} · frequência {times(totals.impressions, audienceTotal)}
                    </span>
                  </th>
                  <td data-label={metricColumn}>{int(totals.impressions)}</td>
                  <td data-label="Cliques">{int(totals.clicks)}</td>
                  <td data-label="CTR">{pct(ctr, 2)}</td>
                  <td data-label="Leads">{int(totals.leads)}</td>
                  <td data-label="Frequência">{times(totals.impressions, audienceTotal)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </section>
      </div>

      <section className={a.panel} aria-labelledby="an-leads">
        <header className={a.panelHead}>
          <div className={a.panelTitle}>
            <h2 id="an-leads">Leads recentes</h2>
            <p>
              {int(leadTotal)} {leadTotal === 1 ? 'lead' : 'leads'} desde {dateShort(an.calendar[0] ?? '')}
            </p>
          </div>
        </header>
        {an.leads.length === 0 ? (
          <p className={a.none}>Nenhum lead até agora.</p>
        ) : (
          <table className={`${a.table} ${a.leads}`}>
            <thead>
              <tr>
                <th scope="col">Empresa</th>
                <th scope="col">Segmento</th>
                <th scope="col">Público</th>
                <th scope="col">Canal</th>
                <th scope="col">Recebido</th>
              </tr>
            </thead>
            <tbody>
              {an.leads.map((lead) => (
                <tr key={lead.id}>
                  <th scope="row">
                    <span className={a.company}>{lead.company}</span>
                    <span className={a.place}>{lead.place}</span>
                    <span className={a.leadMeta} aria-hidden="true">
                      {lead.segment} · {lead.channel}
                    </span>
                  </th>
                  <td data-label="Segmento">{lead.segment}</td>
                  <td data-label="Público">{lead.audience}</td>
                  <td data-label="Canal">{lead.channel}</td>
                  <td data-label="Recebido" className={a.when}>
                    {stamp(lead.at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

/* ——— Sem veiculação: texto curto e a previsão, sem gráfico de mentira ——— */
const STOPPED: CampaignStatus[] = ['rejected', 'pi_rejected', 'cancelled', 'completed'];
function AnalyticsEmpty({ status, forecast }: { status: CampaignStatus; forecast: ForecastItem[] }) {
  const stopped = STOPPED.includes(status);
  const live = status === 'active' || status === 'paused';
  return (
    <div className={a.board}>
      <section className={a.empty} aria-labelledby="an-empty">
        <div className={a.emptyText}>
          <h2 id="an-empty">{stopped ? 'Sem métricas' : 'Ainda sem métricas'}</h2>
          <p>
            {status === 'completed'
              ? 'Nenhuma leitura foi registrada no período.'
              : stopped
                ? 'A campanha não chegou a veicular.'
                : live
                  ? 'A veiculação começou. A primeira leitura chega em até 24 h.'
                  : 'As métricas aparecem quando a campanha entrar no ar.'}
          </p>
        </div>
        {!stopped && (
          <dl className={a.forecast} aria-label="Previsão" style={{ '--n': forecast.length } as CSSProperties}>
            {forecast.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd data-empty={!item.value || undefined}>{item.value ?? '—'}</dd>
                <dd>{item.hint}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </div>
  );
}
