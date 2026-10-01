/**
 * Dados fictícios do catálogo V3. Nomes de marcas e pessoas são inventados; nenhum dado real.
 * Domínio: Ad Manager de feiras B2B (portal da feira, expositores, anunciantes, mídia).
 */
import type { Tone } from '@/components/ds-v3';

export type CampaignStatus = 'veiculando' | 'agendada' | 'aprovacao' | 'ajustes' | 'pausada' | 'rascunho' | 'concluida';

export const campaignStatus: Record<CampaignStatus, { label: string; tone: Tone }> = {
  veiculando: { label: 'Veiculando', tone: 'green' },
  agendada: { label: 'Agendada', tone: 'blue' },
  aprovacao: { label: 'Em aprovação', tone: 'violet' },
  ajustes: { label: 'Ajustes pedidos', tone: 'orange' },
  pausada: { label: 'Pausada', tone: 'amber' },
  rascunho: { label: 'Rascunho', tone: 'gray' },
  concluida: { label: 'Concluída', tone: 'teal' },
};

export type Campaign = {
  id: string;
  name: string;
  advertiser: string;
  channel: string;
  status: CampaignStatus;
  period: string;
  budget: number;
  impressions: number;
  clicks: number;
  delivery: number;
  owner: string;
  live: boolean;
};

export const campaigns: Campaign[] = [
  {
    id: 'CP-2041',
    name: 'Coleção Primavera-Verão no portal',
    advertiser: 'Aurora Calçados',
    channel: 'Display · Portal',
    status: 'veiculando',
    period: '01 – 30 set',
    budget: 18400,
    impressions: 412_880,
    clicks: 9_314,
    delivery: 68,
    owner: 'Marina Lopes',
    live: true,
  },
  {
    id: 'CP-2038',
    name: 'Newsletter dos expositores',
    advertiser: 'Estúdio Norte',
    channel: 'E-mail dedicado',
    status: 'veiculando',
    period: '10 set – 15 out',
    budget: 12600,
    impressions: 86_240,
    clicks: 5_102,
    delivery: 56,
    owner: 'Rafael Dias',
    live: true,
  },
  {
    id: 'CP-2036',
    name: 'Destaque na vitrine — couro vegetal',
    advertiser: 'Lume Acessórios',
    channel: 'Vitrine',
    status: 'aprovacao',
    period: '05 – 30 out',
    budget: 6300,
    impressions: 0,
    clicks: 0,
    delivery: 0,
    owner: 'Clara Souto',
    live: false,
  },
  {
    id: 'CP-2031',
    name: 'Retargeting de visitantes credenciados',
    advertiser: 'Grupo Horizonte',
    channel: 'Display · Rede',
    status: 'ajustes',
    period: '01 – 31 out',
    budget: 8200,
    impressions: 0,
    clicks: 0,
    delivery: 0,
    owner: 'Marina Lopes',
    live: false,
  },
  {
    id: 'CP-2027',
    name: 'Convite para o lançamento no estande',
    advertiser: 'Casa Forma',
    channel: 'Push · App',
    status: 'agendada',
    period: '14 – 16 out',
    budget: 4800,
    impressions: 0,
    clicks: 0,
    delivery: 0,
    owner: 'Tiago Rezende',
    live: false,
  },
  {
    id: 'CP-2019',
    name: 'Rodada de negócios — segunda edição',
    advertiser: 'Ateliê Sul',
    channel: 'Display · Portal',
    status: 'pausada',
    period: '20 ago – 20 set',
    budget: 9500,
    impressions: 201_460,
    clicks: 3_880,
    delivery: 41,
    owner: 'Rafael Dias',
    live: false,
  },
  {
    id: 'CP-2012',
    name: 'Guia oficial do visitante',
    advertiser: 'Pátio Couro',
    channel: 'E-mail dedicado',
    status: 'concluida',
    period: '01 – 31 ago',
    budget: 15200,
    impressions: 540_120,
    clicks: 14_906,
    delivery: 100,
    owner: 'Clara Souto',
    live: false,
  },
];

export const brl = (value: number, digits = 0) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
export const int = (value: number) => value.toLocaleString('pt-BR');
export const compact = (value: number) =>
  value.toLocaleString('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
export const pct = (value: number, digits = 1) =>
  `${value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
