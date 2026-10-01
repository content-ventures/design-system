/**
 * Leituras de veiculação fictícias para a aba Analytics do detalhe da campanha.
 *
 * Determinísticas: a semente é o id da campanha, então servidor e navegador desenham o mesmo
 * gráfico e recarregar não muda nada. Os números ficam presos ao que o resto do protótipo mostra:
 * a soma dos dias bate com impressões, cliques e leads de `campaign.metrics`, a entrega acumulada
 * bate com o percentual entregue, e canais e públicos partem da alocação gravada no rascunho.
 */
import { ASSETS, AUDIENCES, CHANNELS, PRICING, STATUS_DONE, byId, type Channel, type PricingModel } from '../domain';
import { estimateUnits, parseMoney } from '../pricing';
import { mainAsset, type Campaign } from '../store';
import { effectiveModel } from '../builder/validation';

export type RangeKey = '7d' | '14d' | 'all';
/**
 * Dia da última leitura, o mesmo para todas as campanhas do protótipo: as que estão no ar param
 * no mesmo "hoje", e o ritmo sai dos dados (entregue × planejado até aqui), não o contrário.
 */
export const AS_OF = '2026-10-22';
export const RANGE_DAYS: Record<RangeKey, number | undefined> = { '7d': 7, '14d': 14, all: undefined };

export type DayRow = { iso: string; impressions: number; clicks: number; leads: number };
export type Totals = { impressions: number; clicks: number; leads: number };
type Share = { id: string; name: string; plan: number; weight: number; ctr: number; lead: number };
export type Lead = { id: string; company: string; place: string; segment: string; channel: string; audience: string; at: string };

export type Analytics = {
  model: PricingModel | '';
  /** Métrica contratada: impressões (CPM), cliques (CPC) ou disparos (por disparo). */
  metric: { key: 'impressions' | 'clicks'; label: string; unit: string };
  /** Volume contratado na métrica, para o ritmo planejado. */
  contracted: number;
  /** Percentual entregue (o mesmo da faixa de métricas da visão geral). */
  delivered: number;
  /** Verba por unidade da métrica, para o custo por lead. */
  unitCost: number;
  /** Todos os dias do período contratado. */
  calendar: string[];
  /** Um item por dia com entrega, do início até a última leitura. */
  days: DayRow[];
  /** Pausada: dia da pausa (a série termina nele). */
  pausedAt?: string;
  channels: Share[];
  audiences: (Share & { size: number })[];
  leads: Lead[];
};

/* ——— Aleatório com semente ——— */
function hash(text: string) {
  let h = 2166136261;
  for (const ch of text) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Divide um total inteiro pelos pesos (maiores restos): a soma das partes é exatamente o total. */
export function split(total: number, weights: number[]) {
  const sum = weights.reduce((acc, w) => acc + Math.max(0, w), 0);
  if (!(sum > 0) || total <= 0) return weights.map(() => 0);
  const raw = weights.map((w) => (Math.max(0, w) / sum) * total);
  const out = raw.map(Math.floor);
  let rest = Math.round(total) - out.reduce((acc, v) => acc + v, 0);
  const order = raw.map((v, i) => ({ i, f: v - Math.floor(v) })).sort((x, y) => y.f - x.f);
  for (const { i } of order) {
    if (rest <= 0) break;
    out[i] = (out[i] ?? 0) + 1;
    rest -= 1;
  }
  return out;
}

/* ——— Datas (UTC puro: sem fuso, sem virada de dia) ——— */
const DAY = 86_400_000;
const utc = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y ?? 2026, (m ?? 1) - 1, d ?? 1);
};
const isoOf = (time: number) => new Date(time).toISOString().slice(0, 10);
export const weekdayOf = (iso: string) => new Date(utc(iso)).getUTCDay();
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const weekdayShort = (iso: string) => WEEKDAYS[weekdayOf(iso)] ?? '';

/** Dias da feira no pavilhão (a janela do painel de LED da entrada). */
const FAIR = byId(ASSETS, 'as-led')?.window ?? { start: '2026-10-14', end: '2026-10-17' };
export const isFairDay = (iso: string) => iso >= FAIR.start && iso <= FAIR.end;

/* ——— Fatores por canal e por público ——— */
const CHANNEL_CTR: Record<Channel['kind'], number> = { web: 1, app: 1.28, email: 1, social: 0.82, onsite: 0.55, list: 1.35 };
const CHANNEL_LEAD: Record<Channel['kind'], number> = { web: 1, app: 0.85, email: 1.1, social: 0.7, onsite: 0.6, list: 1.6 };
const AUDIENCE_CTR: Record<string, number> = { 'aud-cred': 0.92, 'aud-lojistas': 1.22, 'aud-intl': 1.08, 'aud-imprensa': 0.74 };
const AUDIENCE_LEAD: Record<string, number> = { 'aud-cred': 0.8, 'aud-lojistas': 1.55, 'aud-intl': 1.3, 'aud-imprensa': 0.35 };

/* ——— Empresas de exemplo (inventadas) ——— */
const COMPANIES: { name: string; place: string; segment: string; intl?: boolean }[] = [
  { name: 'Calçados Vila Rica', place: 'Novo Hamburgo, RS', segment: 'Loja de calçados' },
  { name: 'Rede Solado Sul', place: 'Porto Alegre, RS', segment: 'Rede de lojas' },
  { name: 'Distribuidora Passo Certo', place: 'Franca, SP', segment: 'Distribuidor' },
  { name: 'Armazém Couro & Cia', place: 'Belo Horizonte, MG', segment: 'Atacado' },
  { name: 'Pequenos Passos Kids', place: 'Curitiba, PR', segment: 'Calçado infantil' },
  { name: 'Bottega Jardins', place: 'São Paulo, SP', segment: 'Multimarcas' },
  { name: 'Trilha Norte Outdoor', place: 'Florianópolis, SC', segment: 'Esportivo' },
  { name: 'Casa Maré Modas', place: 'Recife, PE', segment: 'Multimarcas' },
  { name: 'Pé de Ipê Store', place: 'Campinas, SP', segment: 'E-commerce' },
  { name: 'Lojas Cerrado', place: 'Goiânia, GO', segment: 'Rede de lojas' },
  { name: 'Atelier Corsário', place: 'Rio de Janeiro, RJ', segment: 'Boutique' },
  { name: 'Sapataria Ladeira', place: 'Salvador, BA', segment: 'Loja de calçados' },
  { name: 'Grupo Varanda Moda', place: 'Fortaleza, CE', segment: 'Rede de lojas' },
  { name: 'Potiguar Calçados', place: 'Natal, RN', segment: 'Atacado' },
  { name: 'Luna Brava Acessórios', place: 'Brasília, DF', segment: 'Bolsas e acessórios' },
  { name: 'Vila Pantanal Couros', place: 'Campo Grande, MS', segment: 'Couro' },
  { name: 'Passo Firme Calçados', place: 'Londrina, PR', segment: 'Loja de calçados' },
  { name: 'Andes Pie Importadora', place: 'Santiago, CL', segment: 'Importador', intl: true },
  { name: 'Rambla Shoes', place: 'Montevidéu, UY', segment: 'Importador', intl: true },
  { name: 'Calzados del Plata', place: 'Buenos Aires, AR', segment: 'Distribuidor', intl: true },
  { name: 'Paso Andino', place: 'Lima, PE', segment: 'Importador', intl: true },
];

/** Monta a leitura completa de uma campanha com métricas. Sem métricas, não há o que desenhar. */
export function buildAnalytics(campaign: Campaign): Analytics | undefined {
  const metrics = campaign.metrics;
  const draft = campaign.draft;
  if (!metrics || !draft.startDate || !draft.endDate) return undefined;
  const random = seeded(hash(campaign.id));
  const model = effectiveModel(draft);
  const asset = mainAsset(draft);

  const metricKey: Analytics['metric']['key'] = model === 'cpc' ? 'clicks' : 'impressions';
  const label = model === 'per_display' ? 'Disparos' : model === 'cpc' ? 'Cliques' : 'Impressões';
  const metric = { key: metricKey, label, unit: label.toLowerCase() };

  const startT = utc(draft.startDate);
  const totalDays = Math.max(1, Math.round((utc(draft.endDate) - startT) / DAY) + 1);
  const calendar = Array.from({ length: totalDays }, (_, i) => isoOf(startT + i * DAY));
  const delivered = Math.max(0, Math.min(100, metrics.delivered));

  // Volume contratado: a estimativa da verba, como na visão geral. Se os totais de exemplo
  // não fecham com ela, vale o volume implícito no percentual entregue (o número que a tela mostra).
  const budget = parseMoney(draft.budget);
  const estimate = asset && Number.isFinite(budget) && budget > 0 && asset.basePrice > 0 ? estimateUnits(asset, budget) : 0;
  const impressionsTotal = Math.round(
    metrics.impressions ?? (metricKey === 'impressions' && estimate ? (estimate * delivered) / 100 : (metrics.clicks ?? 0) / 0.02),
  );
  const clicksTotal = Math.round(
    metrics.clicks ?? (metricKey === 'clicks' && estimate ? (estimate * delivered) / 100 : impressionsTotal * 0.018),
  );
  const leadsTotal = Math.round(metrics.leads ?? clicksTotal * 0.035);
  const metricTotal = metricKey === 'clicks' ? clicksTotal : impressionsTotal;
  const implied = delivered > 0 ? metricTotal / (delivered / 100) : 0;
  const contracted = Math.max(
    1,
    Math.round(estimate && (!implied || Math.abs(implied - estimate) / estimate <= 0.06) ? estimate : implied || estimate || metricTotal),
  );
  const unitCost = Number.isFinite(budget) && budget > 0 ? budget / contracted : 0;

  // Dias com entrega: do início até a leitura de referência (AS_OF) ou até a pausa registrada no
  // histórico. Concluída (ou 100% entregue) usa o período inteiro.
  const pausedEntry =
    campaign.status === 'paused'
      ? campaign.history.find((entry) => entry.text === STATUS_DONE.paused)
      : undefined;
  const pausedAt = pausedEntry?.at.slice(0, 10);
  const lastDay = pausedAt && pausedAt < AS_OF ? pausedAt : AS_OF;
  const elapsed =
    campaign.status === 'completed' || delivered >= 100
      ? totalDays
      : Math.max(1, Math.min(totalDays, Math.round((utc(lastDay) - startT) / DAY) + 1));

  // Curva diária: arranque nos dois primeiros dias, fim de semana mais fraco (B2B),
  // pico nos dias de feira e leve crescimento ao longo do período.
  const shape = calendar.slice(0, elapsed).map((iso, i) => {
    const wd = weekdayOf(iso);
    const weekend = wd === 0 || wd === 6 ? 0.62 : 1;
    const fair = isFairDay(iso) ? 1.7 : 1;
    const ramp = i === 0 ? 0.55 : i === 1 ? 0.82 : 1;
    const trend = 1 + 0.16 * (i / Math.max(1, elapsed - 1));
    const stop = campaign.status === 'paused' && i === elapsed - 1 ? 0.5 : 1;
    return weekend * fair * ramp * trend * stop * (0.86 + random() * 0.28);
  });
  const impressions = split(impressionsTotal, shape);
  const clicks = split(
    clicksTotal,
    impressions.map((value, i) => value * (0.84 + random() * 0.32) * (isFairDay(calendar[i] ?? '') ? 1.12 : 1)),
  );
  const leads = split(
    leadsTotal,
    clicks.map((value, i) => value * (0.65 + random() * 0.7) * (isFairDay(calendar[i] ?? '') ? 1.3 : 1)),
  );
  const days: DayRow[] = calendar.slice(0, elapsed).map((iso, i) => ({
    iso,
    impressions: impressions[i] ?? 0,
    clicks: clicks[i] ?? 0,
    leads: leads[i] ?? 0,
  }));

  // Canais e públicos: a alocação do rascunho, com a entrega real desviando alguns pontos.
  const drift = () => 1 + (random() - 0.5) * 0.18;
  const channels: Share[] = draft.channelIds.map((id) => {
    const channel = byId(CHANNELS, id);
    const plan = draft.channelAlloc[id] ?? 100 / Math.max(1, draft.channelIds.length);
    return {
      id,
      name: channel?.name ?? id,
      plan,
      weight: plan * drift(),
      ctr: (channel ? CHANNEL_CTR[channel.kind] : 1) * drift(),
      lead: (channel ? CHANNEL_LEAD[channel.kind] : 1) * drift(),
    };
  });
  const audiences = draft.audienceIds.map((id) => {
    const audience = byId(AUDIENCES, id);
    const plan = draft.audienceAlloc[id] ?? 100 / Math.max(1, draft.audienceIds.length);
    return {
      id,
      name: audience?.name ?? id,
      size: audience?.size ?? 0,
      plan,
      weight: plan * drift(),
      ctr: (AUDIENCE_CTR[id] ?? 1) * drift(),
      lead: (AUDIENCE_LEAD[id] ?? 1) * drift(),
    };
  });

  return {
    model,
    metric,
    contracted,
    delivered,
    unitCost,
    calendar,
    days,
    pausedAt,
    channels,
    audiences,
    leads: recentLeads(campaign.id, days, channels, audiences),
  };
}

/** Os leads mais recentes, em horário comercial, nos últimos dias com lead. */
function recentLeads(id: string, days: DayRow[], channels: Share[], audiences: Share[]): Lead[] {
  const random = seeded(hash(`${id}:leads`));
  const pick = <T extends { weight: number; lead: number }>(list: T[]) => {
    const total = list.reduce((acc, item) => acc + item.weight * item.lead, 0);
    let at = random() * total;
    for (const item of list) {
      at -= item.weight * item.lead;
      if (at <= 0) return item;
    }
    return list[list.length - 1];
  };
  const used = new Set<number>();
  const out: Lead[] = [];
  for (let d = days.length - 1; d >= 0 && out.length < 6; d--) {
    const day = days[d];
    if (!day) continue;
    const count = Math.min(day.leads, 6 - out.length);
    // Horários do dia em ordem decrescente: o primeiro da lista é o mais recente.
    const minutes = Array.from({ length: count }, () => 9 * 60 + Math.floor(random() * 9 * 60)).sort((x, y) => y - x);
    for (const minute of minutes) {
      const audience = pick(audiences);
      const intl = audience?.id === 'aud-intl';
      const pool = COMPANIES.map((company, index) => ({ company, index })).filter(
        ({ company, index }) => Boolean(company.intl) === intl && !used.has(index),
      );
      const choice = pool[Math.floor(random() * pool.length)] ?? { company: COMPANIES[0], index: 0 };
      used.add(choice.index);
      out.push({
        id: `${id}-lead-${out.length}`,
        company: choice.company?.name ?? '',
        place: choice.company?.place ?? '',
        segment: choice.company?.segment ?? '',
        channel: pick(channels)?.name ?? '—',
        audience: audience?.name ?? '—',
        at: `${day.iso}T${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`,
      });
    }
  }
  return out;
}

/* ——— Recortes por período ——— */
export function sumDays(days: DayRow[]): Totals {
  return days.reduce(
    (acc, day) => ({ impressions: acc.impressions + day.impressions, clicks: acc.clicks + day.clicks, leads: acc.leads + day.leads }),
    { impressions: 0, clicks: 0, leads: 0 },
  );
}

/** Janela do período escolhido e a janela imediatamente anterior (para a variação). */
export function windowOf(an: Analytics, range: RangeKey) {
  const size = RANGE_DAYS[range];
  const end = an.days.length;
  const start = size ? Math.max(0, end - size) : 0;
  const days = an.days.slice(start, end);
  const prev = size ? an.days.slice(Math.max(0, start - size), start) : [];
  return { days, prev, start, end };
}

/** Planejado acumulado até o dia `index` (inclusive), em linha reta até o volume contratado. */
export const plannedUntil = (an: Analytics, index: number) => (an.contracted * (index + 1)) / an.calendar.length;
/** Planejado por dia. */
export const plannedDaily = (an: Analytics) => an.contracted / an.calendar.length;

export const metricOf = (an: Analytics, totals: Totals) => (an.metric.key === 'clicks' ? totals.clicks : totals.impressions);

/** Distribui os totais de uma janela entre canais ou públicos (impressões, cliques e leads). */
export function breakdown<T extends Share>(list: T[], totals: Totals) {
  const impressions = split(
    totals.impressions,
    list.map((item) => item.weight),
  );
  const clicks = split(
    totals.clicks,
    list.map((item, i) => (impressions[i] ?? 0) * item.ctr),
  );
  const leads = split(
    totals.leads,
    list.map((item, i) => (clicks[i] ?? 0) * item.lead),
  );
  return list.map((item, i) => ({ ...item, impressions: impressions[i] ?? 0, clicks: clicks[i] ?? 0, leads: leads[i] ?? 0 }));
}

export const pricingLabel = (model: PricingModel | '') => (model ? PRICING[model].label : '');
