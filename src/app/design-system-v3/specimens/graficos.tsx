'use client';

import { ChartSpline, Table2 } from 'lucide-react';
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { Badge, BrandMark, IconButton, Segmented, type SegmentOption } from '@mediaon/design-system/v3';
import {
  BarChart,
  ChartCard,
  ChartFigures,
  ChartKey,
  ChartState,
  ChartSwap,
  ChartTable,
  DonutChart,
  DonutMeter,
  FunnelChart,
  Legend,
  LineChart,
  MeterList,
  formatBRL,
  formatBRLCompact,
  formatDelta,
  formatInt,
  formatPct,
  type ChartDatum,
  type ChartSeries,
  type DonutDatum,
  type FunnelStage,
  type LegendItem,
} from '@mediaon/design-system/v3/charts';
import { LinkButton } from '@mediaon/design-system/v3/link';
import { Shot, Shots, State, States } from '../stage';
import g from './graficos.module.css';

/* ——————————————————————————— Dados fictícios (Francal 2026) ——————————————————————————— */

const WEEKDAY = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const two = (n: number) => String(n).padStart(2, '0');
const dayLabel = (day: number, month = 10) => `${two(day)}/${two(month)}`;
const dayTitle = (day: number, month = 10) =>
  `${dayLabel(day, month)}/2026 · ${WEEKDAY[new Date(2026, month - 1, day).getDay()]}`;
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const ref = 'var(--g-400)';

/** Impressões de 01/10 a 22/10 (272.000 = 68% do contratado) e previsão até 31/10. */
const OCT_REAL = [
  10_600, 11_112, 8_200, 7_600, 13_210, 12_870, 13_540, 12_980, 13_760, 8_400, 7_900, 13_090,
  13_880, 14_210, 13_320, 23_740, 12_310, 8_820, 14_650, 13_190, 12_480, 12_138,
];
const OCT_FORECAST = [13_600, 9_200, 8_700, 13_900, 14_100, 14_300, 14_200, 13_800, 13_900];
const TODAY = OCT_REAL.length - 1;
const OCT_DAILY = [...OCT_REAL, ...OCT_FORECAST];
const OCT_CUM = OCT_DAILY.reduce<number[]>((acc, v) => [...acc, (acc[acc.length - 1] ?? 0) + v], []);
const CONTRACTED = 400_000;
const PLANNED = 12_903;

/** Semana de 16/10 a 22/10 (a mesma do Analytics aprovado). */
const WEEK = range(16, 22);
const WEEK_IMP = OCT_REAL.slice(15);
const PORTAL = [212, 118, 96, 171, 152, 141, 136];
const PORTAL_PREV = [180, 150, 120, 140, 128, 133, 137];
const APP = [248, 160, 128, 210, 190, 170, 164];
const NEWSLETTER = [64, 22, 18, 71, 58, 49, 52];
const VITRINE = [41, 30, 26, 44, 39, 35, 38];

const weekData = (values: Record<string, number[]>): ChartDatum[] =>
  WEEK.map((day, i) => ({
    label: dayLabel(day),
    title: dayTitle(day),
    values: Object.fromEntries(Object.entries(values).map(([key, list]) => [key, list[i] ?? null])),
  }));

const CHANNEL_SERIES: ChartSeries[] = [
  { key: 'portal', label: 'Portal da feira', color: 'blue' },
  { key: 'app', label: 'App Francal', color: 'teal' },
];
const CHANNEL_DATA = weekData({ portal: PORTAL, app: APP });

function useHidden(initial: string[] = []) {
  const [hidden, setHidden] = useState<string[]>(initial);
  const toggle = (key: string) =>
    setHidden((list) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]));
  return [hidden, toggle] as const;
}

/* ——————————————————————————— Barras e colunas ——————————————————————————— */

const MONTHS: [string, string, number][] = [
  ['Nov', 'Novembro de 2025', 182_400],
  ['Dez', 'Dezembro de 2025', 151_200],
  ['Jan', 'Janeiro de 2026', 168_900],
  ['Fev', 'Fevereiro de 2026', 204_300],
  ['Mar', 'Março de 2026', 236_100],
  ['Abr', 'Abril de 2026', 221_700],
  ['Mai', 'Maio de 2026', 248_500],
  ['Jun', 'Junho de 2026', 263_900],
  ['Jul', 'Julho de 2026', 241_300],
  ['Ago', 'Agosto de 2026', 288_600],
  ['Set', 'Setembro de 2026', 312_400],
  ['Out', 'Outubro de 2026', 272_000],
];
const MONTH_DATA: ChartDatum[] = MONTHS.map(([label, title, v]) => ({ label, title, values: { imp: v } }));
const MONTH_SERIES: ChartSeries[] = [{ key: 'imp', label: 'Impressões', color: 'blue' }];
type Span = '6m' | '12m';
const SPANS: SegmentOption<Span>[] = [
  { value: '6m', label: '6 meses' },
  { value: '12m', label: '12 meses' },
];

function MonthlyCard() {
  const [span, setSpan] = useState<Span>('6m');
  const data = span === '6m' ? MONTH_DATA.slice(-6) : MONTH_DATA;
  return (
    <ChartCard
      title="Impressões por mês"
      period={{ label: 'Período', options: SPANS, value: span, onChange: setSpan }}
    >
      <BarChart
        label="Impressões por mês"
        data={data}
        series={MONTH_SERIES}
        highlight={data.length - 1}
        values="highlight"
        height={244}
      />
    </ChartCard>
  );
}

function ChannelsCard() {
  return (
    <ChartCard title="Por canal" description="Impressões no período">
      <MeterList
        label="Impressões por canal"
        items={[
          {
            key: 'portal',
            label: 'Portal da feira',
            value: 49_385,
            share: 50.7,
            plan: 50,
            caption: '1.026 cliques · CTR 2,08% · 33 leads · plano 50%',
          },
          {
            key: 'app',
            label: 'App Francal',
            value: 47_943,
            share: 49.3,
            plan: 50,
            caption: '1.270 cliques · CTR 2,65% · 38 leads · plano 50%',
          },
        ]}
      />
    </ChartCard>
  );
}

const PAVILIONS: [string, number][] = [
  ['Pavilhão Azul — Calçados femininos', 64],
  ['Pavilhão Verde — Couro e componentes', 48],
  ['Pavilhão Branco — Infantil e juvenil', 37],
  ['Mezanino — Bolsas e acessórios', 29],
  ['Pavilhão Laranja — Esportivo e casual', 21],
  ['Área de lançamentos', 15],
];

function PavilionCard() {
  return (
    <ChartCard title="Leads por pavilhão" description="214 leads desde 01/10">
      <BarChart
        orientation="horizontal"
        label="Leads por pavilhão"
        data={PAVILIONS.map(([label, v]) => ({ label, values: { leads: v } }))}
        series={[{ key: 'leads', label: 'Leads', color: 'blue' }]}
        labelWidth={260}
        axisFormat={formatInt}
      />
    </ChartCard>
  );
}

function BarCell(props: { force?: string; active?: number; pinned?: number }) {
  return (
    <div className={g.cell}>
      <BarChart
        label="Impressões por mês"
        data={MONTH_DATA.slice(-6)}
        series={MONTH_SERIES}
        highlight={5}
        values="highlight"
        height={180}
        forceActive={props.active}
        pinned={props.pinned}
        data-force={props.force}
      />
    </div>
  );
}

export function GraficoBarras() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch">
        <div className={g.stack}>
          <div className={`${g.grid} ${g.split}`}>
            <MonthlyCard />
            <ChannelsCard />
          </div>
          <PavilionCard />
        </div>
      </Shot>
      <Shot title="Estados" tone="white" align="stretch">
        <States min={420}>
          <State label="Repouso">
            <BarCell />
          </State>
          <State label="Hover">
            <BarCell active={2} />
          </State>
          <State label="Foco (teclado)">
            <BarCell force="focus" active={3} />
          </State>
          <State label="Destaque fixo">
            <BarCell pinned={1} />
          </State>
        </States>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Linhas ——————————————————————————— */

type Mode = 'daily' | 'cumulative';
const MODES: SegmentOption<Mode>[] = [
  { value: 'daily', label: 'Por dia' },
  { value: 'cumulative', label: 'Acumulado' },
];

/** Por dia: a semana. Acumulado: o total da campanha desde 01/10 (o mesmo da Área: 272.000 em 22/10). */
function deliveryData(mode: Mode): ChartDatum[] {
  return WEEK.map((day, i) => ({
    label: dayLabel(day),
    title: dayTitle(day),
    values: { imp: mode === 'daily' ? (WEEK_IMP[i] ?? 0) : (OCT_CUM[day - 1] ?? 0) },
  }));
}

function deliveryLegend(mode: Mode): LegendItem[] {
  return [
    { key: 'imp', label: 'Impressões', color: 'blue', shape: 'line' },
    mode === 'daily'
      ? { key: 'ref', label: 'Ritmo planejado', color: ref, shape: 'dashed', detail: '12.903 por dia' }
      : { key: 'ref', label: 'Contratado', color: ref, shape: 'dashed', detail: '400.000' },
  ];
}

function DeliveryCard() {
  const [mode, setMode] = useState<Mode>('daily');
  return (
    <ChartCard
      title={mode === 'daily' ? 'Entrega diária' : 'Entrega acumulada'}
      legend={<Legend items={deliveryLegend(mode)} />}
      actions={
        <Segmented size="sm" label="Leitura do gráfico" options={MODES} value={mode} onChange={setMode} />
      }
    >
      <LineChart
        label={mode === 'daily' ? 'Entrega diária de impressões' : 'Entrega acumulada de impressões'}
        data={deliveryData(mode)}
        series={[{ key: 'imp', label: 'Impressões', color: 'blue' }]}
        area
        height={272}
        reference={{ value: mode === 'daily' ? PLANNED : CONTRACTED, label: '' }}
      />
    </ChartCard>
  );
}

function ClicksCard() {
  const [hidden, toggle] = useHidden();
  return (
    <ChartCard
      title="Cliques por canal"
      legend={
        <Legend
          items={[
            { key: 'portal', label: 'Portal da feira', color: 'blue', shape: 'line', value: formatInt(sum(PORTAL)) },
            { key: 'app', label: 'App Francal', color: 'teal', shape: 'line', value: formatInt(sum(APP)) },
          ]}
          hidden={hidden}
          onToggle={toggle}
        />
      }
    >
      <LineChart label="Cliques por canal" data={CHANNEL_DATA} series={CHANNEL_SERIES} hidden={hidden} height={220} />
    </ChartCard>
  );
}

function CompareCard({ active }: { active?: number }) {
  const data = WEEK.map((day, i) => ({
    label: dayLabel(day),
    title: dayTitle(day),
    values: { now: PORTAL[i] ?? null, prev: PORTAL_PREV[i] ?? null },
  }));
  return (
    <ChartCard
      title="Cliques no Portal da feira"
      legend={
        <Legend
          items={[
            { key: 'now', label: 'Esta semana', color: 'blue', shape: 'line', value: formatInt(sum(PORTAL)) },
            { key: 'prev', label: '7 dias anteriores', color: 'blue', faded: true, shape: 'dashed', value: formatInt(sum(PORTAL_PREV)) },
          ]}
        />
      }
    >
      <LineChart
        label="Cliques no Portal da feira contra os 7 dias anteriores"
        data={data}
        series={[
          { key: 'now', label: 'Esta semana', color: 'blue' },
          { key: 'prev', label: '7 dias anteriores', color: 'blue', dashed: true, faded: true },
        ]}
        height={220}
        forceActive={active}
        tooltip={(i) => {
          const now = PORTAL[i] ?? 0;
          const prev = PORTAL_PREV[i] ?? 0;
          return { delta: { value: prev ? (now / prev - 1) * 100 : 0, label: 'vs. 7 dias antes' } };
        }}
      />
    </ChartCard>
  );
}

function LineCell({ force, active, hide }: { force?: string; active?: number; hide?: string[] }) {
  const [hidden, toggle] = useHidden(hide);
  return (
    <div className={g.cell}>
      <div className={g.cellHead}>
        <Legend
          items={[
            { key: 'portal', label: 'Portal da feira', color: 'blue', shape: 'line' },
            { key: 'app', label: 'App Francal', color: 'teal', shape: 'line' },
          ]}
          hidden={hidden}
          onToggle={toggle}
        />
      </div>
      <LineChart
        label="Cliques por canal"
        data={CHANNEL_DATA}
        series={CHANNEL_SERIES}
        hidden={hidden}
        height={176}
        forceActive={active}
        data-force={force}
      />
    </div>
  );
}

export function GraficoLinhas() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch">
        <div className={g.stack}>
          <DeliveryCard />
          <div className={`${g.grid} ${g.halves}`}>
            <ClicksCard />
            <CompareCard />
          </div>
        </div>
      </Shot>
      <Shot title="Estados" tone="white" align="stretch">
        <States min={420}>
          <State label="Repouso">
            <LineCell />
          </State>
          <State label="Hover">
            <LineCell active={3} />
          </State>
          <State label="Série oculta">
            <LineCell hide={['app']} />
          </State>
          <State label="Foco">
            <LineCell force="focus" active={1} />
          </State>
        </States>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Área ——————————————————————————— */

const OCT = range(1, 31);
const ACC_DATA: ChartDatum[] = OCT.map((day, i) => ({
  label: dayLabel(day),
  title: `${dayTitle(day)}${i > TODAY ? ' · previsão' : ''}`,
  values: { imp: OCT_CUM[i] ?? null },
}));
const ACC_TICKS = [0, 4, 9, 14, 19, 24, 30];

function AccumulatedChart({ height = 260, active }: { height?: number; active?: number }) {
  return (
    <LineChart
      label="Impressões acumuladas contra o contratado"
      data={ACC_DATA}
      series={[{ key: 'imp', label: 'Impressões', color: 'blue' }]}
      area
      height={height}
      forecastFrom={TODAY}
      marker={{ index: TODAY, label: 'Hoje' }}
      reference={{ value: CONTRACTED, label: 'Contratado 400.000', align: 'end' }}
      xTicks={ACC_TICKS}
      forceActive={active}
      tooltip={(i) => {
        const forecast = i > TODAY;
        return {
          rows: [
            {
              key: 'acc',
              label: forecast ? 'Previsão acumulada' : 'Acumulado',
              value: formatInt(OCT_CUM[i] ?? 0),
              color: 'blue',
              shape: forecast ? 'dashed' : 'line',
            },
            { key: 'day', label: forecast ? 'Previsto no dia' : 'No dia', value: formatInt(OCT_DAILY[i] ?? 0) },
          ],
        };
      }}
    />
  );
}

const LEADS_PORTAL = [3, 4, 2, 1, 5, 6, 5, 4, 6, 2, 2, 7, 6, 8, 7, 9, 5, 3, 7, 6, 6, 8];
const LEADS_APP = [2, 3, 2, 1, 4, 4, 5, 3, 5, 2, 1, 5, 5, 6, 6, 8, 4, 2, 6, 5, 5, 6];

const running = (list: number[]) => list.map((_, i) => sum(list.slice(0, i + 1)));

function StackedAreaCard() {
  const portal = running(LEADS_PORTAL);
  const app = running(LEADS_APP);
  const data = range(1, 22).map((day, i) => ({
    label: dayLabel(day),
    title: dayTitle(day),
    values: { portal: portal[i] ?? null, app: app[i] ?? null },
  }));
  return (
    <ChartCard
      title="Leads acumulados por canal"
      legend={
        <Legend
          items={[
            { key: 'portal', label: 'Portal da feira', color: 'blue', shape: 'square', value: formatInt(sum(LEADS_PORTAL)) },
            { key: 'app', label: 'App Francal', color: 'teal', shape: 'square', value: formatInt(sum(LEADS_APP)) },
          ]}
        />
      }
    >
      <LineChart
        label="Leads acumulados por canal, empilhados"
        data={data}
        series={CHANNEL_SERIES}
        area
        stacked
        markLast={false}
        height={232}
        xTicks={[0, 4, 9, 14, 21]}
      />
    </ChartCard>
  );
}

const ACC_LEGEND: LegendItem[] = [
  { key: 'imp', label: 'Impressões', color: 'blue', shape: 'line', value: '272.000' },
  { key: 'fc', label: 'Previsão', color: 'blue', shape: 'dashed', detail: '387.700 em 31/10' },
  { key: 'ref', label: 'Contratado', color: ref, shape: 'dashed' },
];

export function GraficoArea() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch">
        <div className={`${g.grid} ${g.split}`}>
          <ChartCard title="Impressões acumuladas" legend={<Legend items={ACC_LEGEND} />}>
            <AccumulatedChart height={260} />
          </ChartCard>
          <StackedAreaCard />
        </div>
      </Shot>
      <Shot title="Estados" tone="white" align="stretch">
        <States min={320}>
          <State label="Repouso">
            <div className={g.cell}>
              <AccumulatedChart height={180} />
            </div>
          </State>
          <State label="Hover">
            <div className={g.cell}>
              <AccumulatedChart height={180} active={13} />
            </div>
          </State>
          <State label="Previsão">
            <div className={g.cell}>
              <AccumulatedChart height={180} active={27} />
            </div>
          </State>
        </States>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Pizza e rosca ——————————————————————————— */

const BUDGET: DonutDatum[] = [
  { key: 'portal', label: 'Portal da feira', value: 9_000 },
  { key: 'app', label: 'App Francal', value: 5_400 },
  { key: 'news', label: 'Newsletter', value: 3_600 },
];
const AUDIENCE: DonutDatum[] = [
  { key: 'visit', label: 'Visitantes credenciados', value: 48_200 },
  { key: 'shop', label: 'Lojistas e compradores', value: 21_600 },
];
/** Roscas lado a lado: mesmo diâmetro e espessura. */
const DONUT = { size: 152, thickness: 14, gap: 2 } as const;
const brl2 = (v: number) => formatBRL(v, 2);

function DeliveryMetric() {
  return (
    <div className={g.kpis}>
      <div className={g.kpi}>
        <div className={g.kpiText}>
          <span className={g.kpiLabel}>Entrega</span>
          <b className={g.kpiValue}>68%</b>
          <span className={g.kpiHint}>272.000 de 400.000</span>
        </div>
        <DonutMeter value={68} label="Entrega" />
      </div>
      <div className={g.kpi}>
        <div className={g.kpiText}>
          <span className={g.kpiLabel}>Verba consumida</span>
          <b className={g.kpiValue}>R$ 12.240,00</b>
          <span className={g.kpiHint}>de R$ 18.000,00</span>
        </div>
      </div>
      <div className={g.kpi}>
        <div className={g.kpiText}>
          <span className={g.kpiLabel}>Dias restantes</span>
          <b className={g.kpiValue}>9</b>
          <span className={g.kpiHint}>até 31/10</span>
        </div>
      </div>
    </div>
  );
}

function DonutCell(props: { force?: string; active?: number; single?: boolean }) {
  return (
    <div className={g.cell} data-center>
      <DonutChart
        label="Distribuição da verba por canal"
        data={props.single ? [{ key: 'portal', label: 'Portal da feira', value: 18_000 }] : BUDGET}
        size={132}
        thickness={12}
        gap={2}
        centerLabel="Verba"
        centerValue="R$ 18 mil"
        format={formatBRLCompact}
        legend="bottom"
        legendColumns="share"
        forceActive={props.active}
        data-force={props.force}
      />
    </div>
  );
}

export function GraficoRosca() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch">
        <div className={g.stack}>
          <div className={`${g.grid} ${g.donuts}`}>
            <ChartCard title="Distribuição da verba por canal">
              <DonutChart
                label="Distribuição da verba por canal"
                data={BUDGET}
                {...DONUT}
                centerLabel="Verba"
                centerValue={brl2(18_000)}
                format={brl2}
              />
            </ChartCard>
            <ChartCard title="Público potencial">
              <DonutChart label="Público potencial" data={AUDIENCE} {...DONUT} centerLabel="Pessoas" />
            </ChartCard>
          </div>
          <DeliveryMetric />
        </div>
      </Shot>
      <Shot title="Estados" tone="white" align="stretch">
        <States min={220}>
          <State label="Repouso">
            <DonutCell />
          </State>
          <State label="Hover">
            <DonutCell active={1} />
          </State>
          <State label="Foco">
            <DonutCell active={0} force="focus" />
          </State>
          <State label="1 fatia (100%)">
            <DonutCell single />
          </State>
        </States>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Barras empilhadas ——————————————————————————— */

const WEEKS: [string, string, number, number, number][] = [
  ['S39', 'S39 · 21/09 – 27/09', 22, 14, 6],
  ['S40', 'S40 · 28/09 – 04/10', 26, 18, 8],
  ['S41', 'S41 · 05/10 – 11/10', 31, 20, 9],
  ['S42', 'S42 · 12/10 – 18/10', 38, 25, 11],
  ['S43', 'S43 · 19/10 – 25/10', 44, 29, 14],
];
const ORIGIN_SERIES: ChartSeries[] = [
  { key: 'portal', label: 'Portal', color: 'blue' },
  { key: 'app', label: 'App', color: 'teal' },
  { key: 'vitrine', label: 'Vitrine', color: 'violet' },
];
const WEEK_DATA: ChartDatum[] = WEEKS.map(([label, title, portal, app, vitrine]) => ({
  label,
  title,
  values: { portal, app, vitrine },
}));
const originTotal = (key: 'portal' | 'app' | 'vitrine') =>
  formatInt(sum(WEEK_DATA.map((d) => d.values[key] ?? 0)));

function OriginLegend({ hidden, toggle }: { hidden: string[]; toggle: (key: string) => void }) {
  return (
    <Legend
      items={[
        { key: 'portal', label: 'Portal', color: 'blue', shape: 'square', value: originTotal('portal') },
        { key: 'app', label: 'App', color: 'teal', shape: 'square', value: originTotal('app') },
        { key: 'vitrine', label: 'Vitrine', color: 'violet', shape: 'square', value: originTotal('vitrine') },
      ]}
      hidden={hidden}
      onToggle={toggle}
    />
  );
}

function WeeklyLeadsCard({ active }: { active?: number }) {
  const [hidden, toggle] = useHidden();
  return (
    <ChartCard title="Leads por semana e origem" legend={<OriginLegend hidden={hidden} toggle={toggle} />}>
      <BarChart
        label="Leads por semana e origem"
        data={WEEK_DATA}
        series={ORIGIN_SERIES}
        layout="stacked"
        hidden={hidden}
        highlight={4}
        values="highlight"
        height={244}
        axisFormat={formatInt}
        forceActive={active}
      />
    </ChartCard>
  );
}

const STATUS: [string, number, number, number][] = [
  ['Aurora Calçados', 5, 2, 1],
  ['Grupo Horizonte', 4, 1, 1],
  ['Estúdio Norte', 3, 1, 2],
  ['Pátio Couro', 2, 3, 1],
  ['Casa Forma', 2, 2, 0],
  ['Lume Acessórios', 1, 0, 3],
];

function StatusCard() {
  return (
    <ChartCard
      title="Status das campanhas por anunciante"
      legend={
        <Legend
          items={[
            { key: 'live', label: 'Veiculando', color: 'green' },
            { key: 'wait', label: 'Aguardando aprovação', color: 'violet' },
            { key: 'draft', label: 'Rascunho', color: 'gray' },
          ]}
        />
      }
    >
      <BarChart
        orientation="horizontal"
        layout="stacked"
        normalize
        label="Status das campanhas por anunciante"
        data={STATUS.map(([name, live, wait, draft]) => ({
          label: name,
          lead: <BrandMark name={name} size="xs" variant="soft" decorative />,
          values: { live, wait, draft },
        }))}
        series={[
          { key: 'live', label: 'Veiculando', color: 'green' },
          { key: 'wait', label: 'Aguardando aprovação', color: 'violet' },
          { key: 'draft', label: 'Rascunho', color: 'gray' },
        ]}
        grid="none"
        labelWidth={168}
      />
    </ChartCard>
  );
}

function StackCell({ active, hide }: { active?: number; hide?: string[] }) {
  const [hidden, toggle] = useHidden(hide);
  return (
    <div className={g.cell}>
      <div className={g.cellHead}>
        <OriginLegend hidden={hidden} toggle={toggle} />
      </div>
      <BarChart
        label="Leads por semana e origem"
        data={WEEK_DATA}
        series={ORIGIN_SERIES}
        layout="stacked"
        hidden={hidden}
        highlight={4}
        values="highlight"
        height={184}
        axisFormat={formatInt}
        forceActive={active}
      />
    </div>
  );
}

export function GraficoEmpilhado() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch">
        <div className={`${g.grid} ${g.halves}`}>
          <WeeklyLeadsCard />
          <StatusCard />
        </div>
      </Shot>
      <Shot title="Estados" tone="white" align="stretch">
        <States min={320}>
          <State label="Repouso">
            <StackCell />
          </State>
          <State label="Hover">
            <StackCell active={2} />
          </State>
          <State label="Série oculta">
            <StackCell hide={['app']} />
          </State>
        </States>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Funil ——————————————————————————— */

const FUNNEL: FunnelStage[] = [
  { key: 'imp', label: 'Impressões', value: 271_400 },
  { key: 'click', label: 'Cliques', value: 6_120 },
  { key: 'lead', label: 'Leads', value: 214 },
  { key: 'prop', label: 'Propostas', value: 38 },
  { key: 'deal', label: 'Contratos', value: 9 },
];
type Change = 'rate' | 'drop';
const CHANGES: SegmentOption<Change>[] = [
  { value: 'rate', label: 'Taxa' },
  { value: 'drop', label: 'Perda' },
];

function FunnelCard() {
  const [change, setChange] = useState<Change>('rate');
  return (
    <ChartCard
      title="Funil da campanha"
      actions={
        <Segmented size="sm" label="Entre etapas" options={CHANGES} value={change} onChange={setChange} />
      }
      bleed
    >
      <FunnelChart label="Funil da campanha" stages={FUNNEL} change={change} height={148} />
    </ChartCard>
  );
}

export function GraficoFunil() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch">
        <FunnelCard />
      </Shot>
      <Shot title="Estados" tone="white" align="stretch">
        <States min={9999}>
          <State label="Repouso">
            <div className={g.frame}>
              <FunnelChart label="Funil da campanha" stages={FUNNEL} change="rate" height={120} />
            </div>
          </State>
          <State label="Hover">
            <div className={g.frame}>
              <FunnelChart label="Funil da campanha" stages={FUNNEL} change="rate" height={120} forceActive={2} />
            </div>
          </State>
          <State label="Celular">
            <div className={g.phone}>
              <ChartCard title="Funil da campanha">
                <FunnelChart label="Funil da campanha" stages={FUNNEL} change="rate" variant="bars" />
              </ChartCard>
            </div>
          </State>
        </States>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Legendas e tooltips ——————————————————————————— */

const FOUR_SERIES: ChartSeries[] = [
  { key: 'portal', label: 'Portal da feira', color: 'blue' },
  { key: 'app', label: 'App Francal', color: 'teal' },
  { key: 'news', label: 'Newsletter', color: 'violet' },
  { key: 'vitrine', label: 'Vitrine', color: 'amber' },
];
const FOUR_DATA = weekData({ portal: PORTAL, app: APP, news: NEWSLETTER, vitrine: VITRINE });

function ToggleLegendCard() {
  const [hidden, toggle] = useHidden(['vitrine']);
  return (
    <ChartCard
      title="Cliques por canal"
      legend={
        <Legend
          items={[
            { key: 'portal', label: 'Portal da feira', color: 'blue', shape: 'line', value: formatInt(sum(PORTAL)) },
            { key: 'app', label: 'App Francal', color: 'teal', shape: 'line', value: formatInt(sum(APP)) },
            { key: 'news', label: 'Newsletter', color: 'violet', shape: 'line', value: formatInt(sum(NEWSLETTER)) },
            { key: 'vitrine', label: 'Vitrine', color: 'amber', shape: 'line', value: formatInt(sum(VITRINE)) },
          ]}
          hidden={hidden}
          onToggle={toggle}
        />
      }
    >
      <LineChart label="Cliques por canal" data={FOUR_DATA} series={FOUR_SERIES} hidden={hidden} height={220} />
    </ChartCard>
  );
}

function EndLabelsCard() {
  return (
    <ChartCard title="Leads por canal">
      <LineChart
        label="Leads por canal"
        data={weekData({ portal: [7, 5, 3, 8, 6, 6, 7], app: [5, 4, 2, 6, 5, 5, 6], news: [2, 1, 1, 3, 2, 2, 3] })}
        series={[
          { key: 'portal', label: 'Portal da feira', color: 'blue' },
          { key: 'app', label: 'App Francal', color: 'teal' },
          { key: 'news', label: 'Newsletter', color: 'violet' },
        ]}
        endLabels
        height={220}
        axisFormat={formatInt}
      />
    </ChartCard>
  );
}

function LegendButtonCell({ force, off }: { force?: string; off?: boolean }) {
  const [hidden, toggle] = useHidden(off ? ['portal'] : []);
  return (
    <Legend
      items={[{ key: 'portal', label: 'Portal da feira', color: 'blue', shape: 'line', value: '1.026', force }]}
      hidden={hidden}
      onToggle={toggle}
    />
  );
}

export function GraficoLegenda() {
  return (
    <Shots>
      <Shot title="Legendas" tone="white" align="stretch">
        <div className={g.stack}>
          <div className={g.cell}>
            <States columns={4}>
              <State label="Linha">
                <Key shape="line" color="blue" label="Impressões" />
              </State>
              <State label="Tracejada">
                <Key shape="dashed" color={ref} label="Ritmo planejado" />
              </State>
              <State label="Ponto">
                <Key shape="dot" color="teal" label="App Francal" />
              </State>
              <State label="Quadrado">
                <Key shape="square" color="violet" label="Vitrine" />
              </State>
            </States>
          </div>
          <div className={`${g.grid} ${g.halves}`}>
            <ChartCard title="Entrega diária" legend={<Legend items={deliveryLegend('daily')} />}>
              <LineChart
                label="Entrega diária de impressões"
                data={deliveryData('daily')}
                series={[{ key: 'imp', label: 'Impressões', color: 'blue' }]}
                area
                height={220}
                reference={{ value: PLANNED, label: '' }}
              />
            </ChartCard>
            <EndLabelsCard />
          </div>
          <ToggleLegendCard />
        </div>
      </Shot>
      <Shot title="Tooltip" tone="white" align="stretch">
        <div className={`${g.grid} ${g.halves}`}>
          <CompareCard active={3} />
          <WeeklyLeadsCard active={3} />
        </div>
      </Shot>
      <Shot title="Estados" tone="white" align="stretch">
        <States min={180}>
          <State label="Repouso">
            <LegendButtonCell />
          </State>
          <State label="Hover">
            <LegendButtonCell force="hover" />
          </State>
          <State label="Oculta">
            <LegendButtonCell off />
          </State>
          <State label="Foco">
            <LegendButtonCell force="focus" />
          </State>
        </States>
      </Shot>
    </Shots>
  );
}

function Key({ shape, color, label }: { shape: 'line' | 'dashed' | 'dot' | 'square'; color: string; label: string }) {
  return (
    <span className={g.key}>
      <ChartKey color={color} shape={shape} />
      {label}
    </span>
  );
}

/* ——————————————————————————— Eixos e formatação ——————————————————————————— */

/** Mesmas impressões em três granularidades: ≈ 13 mil por dia, ≈ 90 mil por semana, ≈ 270 mil por mês. */
const WEEK_AXIS: [string, string, number, number][] = [
  ['27/07–02/08', '27/07 – 02/08/2026', 78_400, 2.12],
  ['03–09/08', '03/08 – 09/08/2026', 84_100, 2.18],
  ['10–16/08', '10/08 – 16/08/2026', 81_900, 2.15],
  ['17–23/08', '17/08 – 23/08/2026', 88_600, 2.24],
  ['24–30/08', '24/08 – 30/08/2026', 86_200, 2.21],
  ['31/08–06/09', '31/08 – 06/09/2026', 92_300, 2.29],
  ['07–13/09', '07/09 – 13/09/2026', 89_800, 2.26],
  ['14–20/09', '14/09 – 20/09/2026', 84_700, 2.22],
  ['21–27/09', '21/09 – 27/09/2026', 93_100, 2.31],
  ['28/09–04/10', '28/09 – 04/10/2026', 96_400, 2.38],
  ['05–11/10', '05/10 – 11/10/2026', 91_500, 2.34],
  ['12–18/10', '12/10 – 18/10/2026', 98_200, 2.41],
];
const DAY_CTR = [2.08, 2.21, 1.96, 2.34, 2.27, 2.41, 2.18, 2.05, 2.36, 2.52, 2.44, 2.61];
const MONTH_CTR = [2.02, 2.06, 2.11, 2.09, 2.17, 2.21, 2.19, 2.24, 2.28, 2.33, 2.36, 2.38];
/** Verba por impressão do P.I. (R$ 18.000,00 por 400.000). */
const PRICE = 18_000 / CONTRACTED;
type XFormat = 'day' | 'week' | 'month';
const XFORMATS: SegmentOption<XFormat>[] = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
];
type GridKind = 'dashed' | 'solid' | 'none';
const GRIDS: SegmentOption<GridKind>[] = [
  { value: 'dashed', label: 'Tracejada' },
  { value: 'solid', label: 'Sólida' },
  { value: 'none', label: 'Nenhuma' },
];
type AxisRow = { label: string; title: string; imp: number; ctr: number };
const AXIS_ROWS: Record<XFormat, AxisRow[]> = {
  day: range(11, 22).map((day, i) => ({
    label: dayLabel(day),
    title: dayTitle(day),
    imp: OCT_REAL[day - 1] ?? 0,
    ctr: DAY_CTR[i] ?? 0,
  })),
  week: WEEK_AXIS.map(([label, title, imp, ctr]) => ({ label, title, imp, ctr })),
  month: MONTHS.map(([label, title, imp], i) => ({ label, title, imp, ctr: MONTH_CTR[i] ?? 0 })),
};
/** Mesmo ritmo de rótulos nas três células: a cada 3 dias, 4 semanas e por trimestre. */
const AXIS_TICKS: Record<XFormat, number[]> = {
  day: [2, 5, 8, 11],
  week: [3, 7, 11],
  month: [2, 5, 8, 11],
};
const axisData = (x: XFormat): ChartDatum[] =>
  AXIS_ROWS[x].map((row) => ({
    label: row.label,
    title: row.title,
    values: { imp: row.imp, spend: Math.round(row.imp * PRICE * 100) / 100, ctr: row.ctr },
  }));
const pct1 = (v: number) => formatPct(v, 1);
const signedPct = (v: number) => (v < 0 ? `−${formatPct(-v, 0)}` : formatPct(v, 0));

function AxisPanels() {
  const [x, setX] = useState<XFormat>('day');
  const [grid, setGrid] = useState<GridKind>('dashed');
  const data = axisData(x);
  const ticks = AXIS_TICKS[x];
  return (
    <div className={g.stack}>
      <div className={g.toolbar}>
        <div className={g.control}>
          <span className={g.controlLabel}>Eixo X</span>
          <Segmented size="sm" label="Eixo X" options={XFORMATS} value={x} onChange={setX} />
        </div>
        <div className={g.control}>
          <span className={g.controlLabel}>Grade</span>
          <Segmented size="sm" label="Grade" options={GRIDS} value={grid} onChange={setGrid} />
        </div>
      </div>
      <div className={`${g.grid} ${g.thirds}`}>
        <div className={g.cell}>
          <LineChart
            label="Impressões"
            yLabel="Impressões"
            data={data}
            series={[{ key: 'imp', label: 'Impressões', color: 'blue' }]}
            grid={grid}
            height={196}
            xTicks={ticks}
          />
        </div>
        <div className={g.cell}>
          <BarChart
            label="Verba"
            yLabel="Verba"
            data={data}
            series={[{ key: 'spend', label: 'Verba', color: 'blue' }]}
            grid={grid}
            height={196}
            format={(v) => formatBRL(v, 2)}
            axisFormat={formatBRLCompact}
            xTicks={ticks}
          />
        </div>
        <div className={g.cell}>
          <LineChart
            label="CTR"
            yLabel="CTR"
            data={data}
            series={[{ key: 'ctr', label: 'CTR', color: 'blue' }]}
            grid={grid}
            height={196}
            min={1.5}
            max={3}
            format={(v) => formatPct(v, 2)}
            axisFormat={pct1}
            xTicks={ticks}
          />
        </div>
      </div>
    </div>
  );
}

const VARIATION = [12, -4, 8, 15, -9, 6, -3, 11, 18, -6, 9, 14];

function VariationCard() {
  return (
    <ChartCard title="Variação semanal de leads">
      <BarChart
        label="Variação semanal de leads"
        data={VARIATION.map((v, i) => ({
          label: `S${32 + i}`,
          title: `S${32 + i}`,
          values: { delta: v },
          color: v < 0 ? 'red' : undefined,
        }))}
        series={[{ key: 'delta', label: 'Variação', color: 'neutral' }]}
        format={(v) => formatDelta(v, 0)}
        axisFormat={signedPct}
        height={220}
        maxBarWidth={22}
      />
    </ChartCard>
  );
}

type Width = '640' | '420' | '320';
const WIDTHS: SegmentOption<Width>[] = [
  { value: '640', label: '640' },
  { value: '420', label: '420' },
  { value: '320', label: '320' },
];

function WidthDemo() {
  const [width, setWidth] = useState<Width>('640');
  return (
    <div className={g.stack}>
      <div className={g.toolbar}>
        <Segmented size="sm" label="Largura" options={WIDTHS} value={width} onChange={setWidth} />
      </div>
      <div className={g.cell} style={{ width: `${width}px`, maxWidth: '100%' }}>
        <LineChart
          label="Impressões por semana"
          yLabel="Impressões"
          data={axisData('week')}
          series={[{ key: 'imp', label: 'Impressões', color: 'blue' }]}
          area
          height={200}
        />
      </div>
    </div>
  );
}

export function GraficoEixos() {
  return (
    <Shots>
      <Shot title="Formatos" tone="white" align="stretch">
        <AxisPanels />
      </Shot>
      <Shot title="Variação" tone="white" align="stretch">
        <VariationCard />
      </Shot>
      <Shot title="Largura" tone="white" align="stretch">
        <WidthDemo />
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Estados dos gráficos ——————————————————————————— */

type ChartStateKind = 'data' | 'loading' | 'empty' | 'error' | 'partial';
const STATES: SegmentOption<ChartStateKind>[] = [
  { value: 'data', label: 'Dados' },
  { value: 'loading', label: 'Carregando' },
  { value: 'empty', label: 'Vazio' },
  { value: 'error', label: 'Erro' },
  { value: 'partial', label: 'Parcial' },
];

function StatesCard({
  state,
  onState,
  initialTable = false,
  height = 240,
}: {
  state: ChartStateKind;
  onState?: (next: ChartStateKind) => void;
  initialTable?: boolean;
  height?: number;
}) {
  const [table, setTable] = useState(initialTable);
  const [retrying, setRetrying] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const data = deliveryData('daily');
  const series: ChartSeries[] = [{ key: 'imp', label: 'Impressões', color: 'blue' }];
  const hasData = state === 'data' || state === 'partial';

  function retry() {
    window.clearTimeout(timer.current);
    if (onState) {
      onState('loading');
      timer.current = window.setTimeout(() => onState('data'), 800);
      return;
    }
    // Prancha parada: o botão mostra a espera e o erro continua.
    setRetrying(true);
    timer.current = window.setTimeout(() => setRetrying(false), 1200);
  }

  let body: ReactNode;
  if (state === 'loading') body = <ChartState kind="loading" skeleton="line" height={height} />;
  else if (state === 'empty')
    body = (
      <ChartState
        kind="empty"
        height={height}
        title="Sem entregas no período"
        action={
          <LinkButton onClick={onState ? () => onState('data') : undefined}>Ver todo o período</LinkButton>
        }
      />
    );
  else if (state === 'error')
    body = <ChartState kind="error" height={height} onRetry={retry} retrying={retrying} />;
  else if (table) body = <ChartTable caption="Entrega diária de impressões" data={data} series={series} />;
  else
    body = (
      <LineChart
        label="Entrega diária de impressões"
        data={data}
        series={series}
        area
        height={height}
        forecastFrom={state === 'partial' ? data.length - 2 : undefined}
        reference={{ value: PLANNED, label: '' }}
      />
    );

  return (
    <ChartCard
      title="Entrega diária"
      legend={<Legend items={deliveryLegend('daily')} />}
      actions={
        <>
          {state === 'partial' && (
            <Badge tone="amber" size="sm">
              Parcial · atualizado 16:40
            </Badge>
          )}
          <IconButton
            variant="ghost"
            size="sm"
            icon={table ? ChartSpline : Table2}
            label={table ? 'Ver como gráfico' : 'Ver como tabela'}
            aria-pressed={table}
            disabled={!hasData}
            onClick={() => setTable((on) => !on)}
          />
        </>
      }
      figures={
        <ChartFigures
          loading={state === 'loading'}
          items={[
            { label: 'Impressões', value: hasData ? '97.328' : state === 'empty' ? '0' : '—' },
            { label: 'Cliques', value: hasData ? '2.296' : state === 'empty' ? '0' : '—' },
            { label: 'CTR', value: hasData ? '2,36%' : '—' },
          ]}
        />
      }
    >
      <ChartSwap id={`${state}-${hasData && table ? 'table' : 'chart'}`} minHeight={height}>
        {body}
      </ChartSwap>
    </ChartCard>
  );
}

function StatesDemo() {
  const [state, setState] = useState<ChartStateKind>('data');
  return (
    <div className={g.stack}>
      <div className={g.toolbar}>
        <div className={g.scrollX}>
          <Segmented size="sm" label="Estado do gráfico" options={STATES} value={state} onChange={setState} />
        </div>
      </div>
      <StatesCard state={state} onState={setState} />
    </div>
  );
}

const STATE_MATRIX: [ChartStateKind, string][] = [
  ['loading', 'Carregando'],
  ['empty', 'Vazio'],
  ['error', 'Erro'],
  ['partial', 'Parcial'],
];

export function GraficoEstados() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch">
        <StatesDemo />
      </Shot>
      <Shot title="Leitura alternativa" tone="white" align="stretch">
        <StatesCard state="data" initialTable />
      </Shot>
      <Shot title="Estados" tone="white" align="stretch">
        <States min={420} captions="end">
          {STATE_MATRIX.map(([kind, label]) => (
            <State key={kind} label={label}>
              <div className={g.fill}>
                <StatesCard state={kind} height={180} />
              </div>
            </State>
          ))}
        </States>
      </Shot>
      <Shot title="Celular" align="center">
        <div className={g.phone}>
          <StatesCard state="data" />
        </div>
      </Shot>
    </Shots>
  );
}

/** Pranchas desta frente (id do inventário → componente). */
export const specimens: Record<string, ComponentType> = {
  'grafico-barras': GraficoBarras,
  'grafico-linhas': GraficoLinhas,
  'grafico-area': GraficoArea,
  'grafico-rosca': GraficoRosca,
  'grafico-empilhado': GraficoEmpilhado,
  'grafico-funil': GraficoFunil,
  'grafico-legenda': GraficoLegenda,
  'grafico-eixos': GraficoEixos,
  'grafico-estados': GraficoEstados,
};
