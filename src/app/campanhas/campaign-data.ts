// Cenário fictício para avaliação de interface. Não representa dados da Francal.
export type CampaignStatus =
  'active' | 'paused' | 'submitted' | 'adjustments' | 'draft' | 'completed';
export type Direction = 'monitoramento' | 'operacao' | 'portfolio' | 'veiculacao';
export type Campaign = {
  id: string;
  name: string;
  advertiser: string;
  initials: string;
  identity: 'cobalt' | 'slate' | 'steel' | 'ice' | 'iris' | 'silver';
  status: CampaignStatus;
  assets: string[];
  budget: number;
  delivered: number;
  target: number;
  start: string;
  end: string;
};

export const statusLabels: Record<CampaignStatus, string> = {
  active: 'Em veiculação',
  paused: 'Pausada',
  submitted: 'Em aprovação',
  adjustments: 'Ajustes solicitados',
  draft: 'Rascunho',
  completed: 'Concluída',
};

export const campaigns: Campaign[] = [
  {
    id: 'aurora',
    name: 'Novas conexões, grandes negócios',
    advertiser: 'Aurora',
    initials: 'au',
    identity: 'cobalt',
    status: 'active',
    assets: ['Superbanner', 'Newsletter'],
    budget: 18400,
    delivered: 68400,
    target: 100000,
    start: '2026-09-01',
    end: '2026-09-30',
  },
  {
    id: 'norte',
    name: 'O próximo capítulo do design',
    advertiser: 'Estúdio Norte',
    initials: 'n.',
    identity: 'slate',
    status: 'active',
    assets: ['Superbanner', 'Redes sociais'],
    budget: 12600,
    delivered: 42300,
    target: 75000,
    start: '2026-09-10',
    end: '2026-10-15',
  },
  {
    id: 'horizonte',
    name: 'Sua marca em primeiro plano',
    advertiser: 'Grupo Horizonte',
    initials: 'h',
    identity: 'steel',
    status: 'submitted',
    assets: ['Superbanner'],
    budget: 8200,
    delivered: 0,
    target: 50000,
    start: '2026-10-01',
    end: '2026-10-31',
  },
  {
    id: 'forma',
    name: 'Design para novos encontros',
    advertiser: 'Casa Forma',
    initials: 'f.',
    identity: 'ice',
    status: 'adjustments',
    assets: ['Newsletter', 'Redes sociais'],
    budget: 9500,
    delivered: 0,
    target: 60000,
    start: '2026-09-25',
    end: '2026-10-20',
  },
  {
    id: 'lume',
    name: 'Ideias que merecem ser vistas',
    advertiser: 'Lume',
    initials: 'lu',
    identity: 'iris',
    status: 'active',
    assets: ['Superbanner'],
    budget: 6300,
    delivered: 32400,
    target: 40000,
    start: '2026-09-05',
    end: '2026-09-30',
  },
  {
    id: 'sul',
    name: 'Uma nova temporada de possibilidades',
    advertiser: 'Ateliê Sul',
    initials: 'as',
    identity: 'silver',
    status: 'draft',
    assets: ['Newsletter'],
    budget: 5000,
    delivered: 0,
    target: 30000,
    start: '2026-10-05',
    end: '2026-10-30',
  },
  {
    id: 'aurora-anterior',
    name: 'Presença que se transforma em conexão',
    advertiser: 'Aurora',
    initials: 'au',
    identity: 'cobalt',
    status: 'completed',
    assets: ['Superbanner', 'Newsletter'],
    budget: 14700,
    delivered: 80000,
    target: 80000,
    start: '2026-09-01',
    end: '2026-09-20',
  },
];

export const currency = (n: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(n);
export const number = (n: number) => new Intl.NumberFormat('pt-BR').format(n);
export const shortDate = (date: string) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' })
    .format(new Date(`${date}T12:00:00Z`))
    .replace('.', '');
export const delivery = (campaign: Campaign) =>
  Math.min(100, Math.round((campaign.delivered / campaign.target) * 100));
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export function filterCampaigns(
  rows: Campaign[],
  filters: { query: string; status: string; advertiser: string; period: string; format?: string },
) {
  return rows.filter((row) => {
    const matchesStatus =
      filters.status === 'all' ||
      row.status === filters.status ||
      (filters.status === 'attention' && ['submitted', 'adjustments'].includes(row.status));
    const from = filters.period === 'setembro' ? '2026-09-01' : '2026-10-01';
    const to = filters.period === 'setembro' ? '2026-09-30' : '2026-10-31';
    return (
      normalize(`${row.name} ${row.advertiser}`).includes(normalize(filters.query)) &&
      matchesStatus &&
      (filters.advertiser === 'all' || row.advertiser === filters.advertiser) &&
      (!filters.format || filters.format === 'all' || row.assets.includes(filters.format)) &&
      (filters.period === 'all' || (row.start <= to && row.end >= from))
    );
  });
}

export function campaignCsv(rows: Campaign[]) {
  const cell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  return (
    '\uFEFF' +
    [
      ['Campanha (demonstração)', 'Anunciante', 'Status', 'Verba BRL', 'Início', 'Fim'],
      ...rows.map((row) => [
        row.name,
        row.advertiser,
        statusLabels[row.status],
        row.budget,
        row.start,
        row.end,
      ]),
    ]
      .map((row) => row.map(cell).join(';'))
      .join('\r\n')
  );
}
