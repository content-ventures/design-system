'use client';

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Globe,
  Handshake,
  ImageUp,
  Lock,
  MonitorSmartphone,
  Newspaper,
  Presentation,
  Send,
  Smartphone,
  Trash2,
  TriangleAlert,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import { Badge, type Tone } from '@mediaon/design-system/v3/badge';
import { Button, IconButton } from '@mediaon/design-system/v3/button';
import { Combobox } from '@mediaon/design-system/v3/combobox';
import { DatePicker, DateRangePicker } from '@mediaon/design-system/v3/date-picker';
import { Field, Input, Textarea } from '@mediaon/design-system/v3/fields';
import { BrandMark } from '@mediaon/design-system/v3/identity';
import { LinkButton } from '@mediaon/design-system/v3/link';
import { MetricStrip } from '@mediaon/design-system/v3/metric-strip';
import { MoneyField } from '@mediaon/design-system/v3/money-field';
import { NumberField } from '@mediaon/design-system/v3/number-field';
import { Dialog } from '@mediaon/design-system/v3/overlays';
import { Select } from '@mediaon/design-system/v3/select';
import { Checkbox, ChoiceCard, Segmented } from '@mediaon/design-system/v3/selection';
import { Slider } from '@mediaon/design-system/v3/slider';
import { Stepper, type StepItem, type StepState } from '@mediaon/design-system/v3/stepper';
import { Disclosure, FixedFrame } from '@mediaon/design-system/v3/structure';
import { toast } from '@mediaon/design-system/v3/toast';
import { ToggleGroup } from '@mediaon/design-system/v3/toggle';
import { Shot, Shots, State } from '../stage';
import { EnsureToaster } from './detalhe';
import w from './wizard.module.css';

/* ——————————————————————————— Formatos ——————————————————————————— */

export const brl = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
export const int = (value: number) => Math.round(value).toLocaleString('pt-BR');
const time = (iso: string) => new Date(`${iso}T12:00:00`).getTime();
export const short = (iso: string) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '');
export const full = (iso: string) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '');
export function days(start: string, end: string) {
  if (!start || !end || end < start) return 0;
  return Math.round((time(end) - time(start)) / 86_400_000) + 1;
}
/** Consulta de mídia sem piscar na hidratação (servidor = falso). */
export function useMedia(query: string) {
  return useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', notify);
      return () => list.removeEventListener('change', notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
const reduced = () =>
  typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/* ——————————————————————————— Dados ——————————————————————————— */

type Advertiser = {
  id: string;
  name: string;
  segment: string;
  cnpj: string;
  campaigns: number;
  live: number;
  contracted: number | null;
  last: { name: string; asset: string; status: string; tone: Tone; period: string; value: number | null };
};

const ADVERTISERS: Advertiser[] = [
  { id: 'aurora', name: 'Aurora Calçados', segment: 'Calçado feminino', cnpj: '12.345.678/0001-90', campaigns: 3, live: 1, contracted: 18000, last: { name: 'Vitrine de lançamentos Aurora', asset: 'Banner Super Topo — Portal', status: 'Ajustes solicitados', tone: 'orange', period: '12/10 – 30/10', value: 11230 } },
  { id: 'norte', name: 'Estúdio Norte', segment: 'Design e acessórios', cnpj: '23.456.789/0001-01', campaigns: 2, live: 1, contracted: 8000, last: { name: 'Newsletter dos expositores', asset: 'E-mail marketing dedicado', status: 'Rascunho', tone: 'gray', period: '15/10 – 15/10', value: null } },
  { id: 'lume', name: 'Lume Acessórios', segment: 'Bolsas e cintos', cnpj: '34.567.890/0001-12', campaigns: 2, live: 1, contracted: null, last: { name: 'Destaque couro vegetal', asset: 'Destaque na vitrine', status: 'Aguardando aprovação', tone: 'violet', period: '10/10 – 30/10', value: null } },
  { id: 'horizonte', name: 'Grupo Horizonte', segment: 'Varejo multimarcas', cnpj: '45.678.901/0001-23', campaigns: 2, live: 0, contracted: null, last: { name: 'Retargeting credenciados', asset: 'Push no app da feira', status: 'Ajustes solicitados', tone: 'orange', period: '01/10 – 31/10', value: null } },
  { id: 'forma', name: 'Casa Forma', segment: 'Calçado masculino', cnpj: '56.789.012/0001-34', campaigns: 2, live: 1, contracted: 22500, last: { name: 'Painel Pavilhão Azul', asset: 'Painel de LED — Pavilhão Azul', status: 'Aguardando assinatura do P.I.', tone: 'amber', period: '14/10 – 17/10', value: 22500 } },
  { id: 'sul', name: 'Ateliê Sul', segment: 'Couro artesanal', cnpj: '67.890.123/0001-45', campaigns: 2, live: 1, contracted: 3600, last: { name: 'Coleção inverno', asset: 'Banner Super Topo — Portal', status: 'Aguardando aprovação', tone: 'violet', period: '01/10 – 17/10', value: 3600 } },
  { id: 'bella', name: 'Bella Passo', segment: 'Calçado infantil', cnpj: '78.901.234/0001-56', campaigns: 2, live: 1, contracted: 18000, last: { name: 'Volta às aulas', asset: 'Push no app da feira', status: 'Aprovada', tone: 'teal', period: '14/10 – 17/10', value: 18000 } },
];

const AURORA_HISTORY = [
  { name: 'Vitrine de lançamentos Aurora', asset: 'Banner Super Topo — Portal', status: 'Ajustes solicitados', tone: 'orange' as Tone, period: '12/10 – 30/10', value: 11230 },
  { name: 'Carrossel de tendências', asset: 'Post patrocinado no Instagram', status: 'Rascunho', tone: 'gray' as Tone, period: '05/10 – 12/10', value: null },
  { name: 'Coleção Primavera-Verão no portal', asset: 'Banner Super Topo — Portal', status: 'Veiculando', tone: 'green' as Tone, period: '01/10 – 31/10', value: 18000 },
];

type CategoryId = 'online' | 'organico' | 'offline' | 'prospeccao';
const CATEGORIES: { value: CategoryId; label: string; icon: LucideIcon }[] = [
  { value: 'online', label: 'Mídia Online', icon: MonitorSmartphone },
  { value: 'organico', label: 'Conteúdo Orgânico', icon: Newspaper },
  { value: 'offline', label: 'Mídia Offline', icon: Presentation },
  { value: 'prospeccao', label: 'Prospecção Ativa', icon: Handshake },
];

export type Asset = {
  id: string;
  category: CategoryId;
  name: string;
  description: string;
  model: string;
  price: string;
  unitPrice: number;
  window: { start: string; end: string };
  channels: string;
  audiences: string;
  extra: string;
  format?: { w: number; h: number };
  reach?: string;
  reserved?: number;
  soldOut?: boolean;
};

export const ASSETS: Asset[] = [
  { id: 'banner', category: 'online', name: 'Banner Super Topo — Portal', description: 'Formato 970 × 250 no topo de todas as páginas do portal da feira.', model: 'CPM', price: 'R$ 45,00 / mil impressões', unitPrice: 45, window: { start: '2026-10-01', end: '2026-11-30' }, channels: 'Portal da feira, App Francal', audiences: 'Visitantes credenciados, Lojistas e compradores', extra: '7 campos · 3 bônus', format: { w: 970, h: 250 }, reach: '880.000 disponíveis', reserved: 62 },
  { id: 'email', category: 'online', name: 'E-mail marketing dedicado', description: 'Disparo exclusivo para a base de credenciados, com a peça do anunciante.', model: 'Por disparo', price: 'R$ 0,40 / disparo', unitPrice: 0.4, window: { start: '2026-09-15', end: '2026-11-30' }, channels: 'E-mail', audiences: 'Visitantes credenciados', extra: '5 campos · 1 bônus', format: { w: 600, h: 800 }, reach: '142.000 contatos', reserved: 38 },
  { id: 'push', category: 'online', name: 'Push no app da feira', description: 'Notificação no app para quem está no pavilhão, com clique para a vitrine.', model: 'CPC', price: 'R$ 1,80 / clique', unitPrice: 1.8, window: { start: '2026-10-10', end: '2026-10-20' }, channels: 'App Francal', audiences: 'Visitantes no pavilhão', extra: '4 campos · 2 bônus', format: { w: 360, h: 120 }, reach: '64.000 instalações', reserved: 100, soldOut: true },
  { id: 'vitrine', category: 'online', name: 'Destaque na vitrine (bonificação)', description: 'Selo de destaque na vitrine de expositores durante a feira.', model: 'Bônus', price: 'Sem cobrança', unitPrice: 0, window: { start: '2026-10-01', end: '2026-10-31' }, channels: 'Vitrine', audiences: 'Todos os visitantes', extra: '2 campos', format: { w: 300, h: 300 }, reach: '310.000 visitas', reserved: 20 },
  { id: 'instagram', category: 'organico', name: 'Post patrocinado no Instagram oficial', description: 'Post no perfil da feira com marcação do anunciante.', model: 'Diária', price: 'R$ 1.200,00 / post', unitPrice: 1200, window: { start: '2026-10-01', end: '2026-10-31' }, channels: 'Instagram', audiences: 'Seguidores da feira', extra: '4 campos', reach: '96.000 seguidores', reserved: 40 },
  { id: 'blog', category: 'organico', name: 'Matéria no blog da feira', description: 'Conteúdo editorial sobre a coleção, revisado pela redação.', model: 'Diária', price: 'R$ 2.400,00 / matéria', unitPrice: 2400, window: { start: '2026-09-20', end: '2026-11-15' }, channels: 'Portal da feira', audiences: 'Leitores do portal', extra: '6 campos', reach: '41.000 leitores', reserved: 10 },
  { id: 'led', category: 'offline', name: 'Painel de LED — Pavilhão Azul', description: 'Inserções de 15 s no painel da entrada do Pavilhão Azul.', model: 'Inserção', price: 'R$ 300,00 / inserção', unitPrice: 300, window: { start: '2026-10-12', end: '2026-10-17' }, channels: 'Pavilhão Azul', audiences: 'Visitantes no pavilhão', extra: '3 campos', format: { w: 1920, h: 1080 }, reach: '36 inserções / semana', reserved: 58 },
  { id: 'totem', category: 'offline', name: 'Totem na entrada principal', description: 'Totem iluminado com a peça do anunciante na entrada da feira.', model: 'Diária', price: 'R$ 900,00 / dia', unitPrice: 900, window: { start: '2026-10-13', end: '2026-10-16' }, channels: 'Entrada principal', audiences: 'Todos os visitantes', extra: '3 campos', reach: '4 totens', reserved: 75 },
  { id: 'lista', category: 'prospeccao', name: 'Lista de compradores qualificados', description: 'Contatos de lojistas que pediram apresentação de marcas.', model: 'Por contato', price: 'R$ 12,00 / contato', unitPrice: 12, window: { start: '2026-10-01', end: '2026-12-15' }, channels: 'Comercial', audiences: 'Lojistas e compradores', extra: '2 campos', reach: '2.400 contatos', reserved: 30 },
];
const assetOf = (id: string) => ASSETS.find((asset) => asset.id === id);

const CHANNELS = [
  { id: 'portal', name: 'Portal da feira', icon: Globe },
  { id: 'app', name: 'App Francal', icon: Smartphone },
];
const AUDIENCES = [
  { id: 'credenciados', name: 'Visitantes credenciados', meta: '48.200 pessoas · mín. 50.000 · máx. 600.000', available: 880000 },
  { id: 'lojistas', name: 'Lojistas e compradores', meta: '21.600 pessoas · mín. 25.000 · máx. 300.000', available: 350000 },
  { id: 'internacionais', name: 'Compradores internacionais', meta: '3.900 pessoas · mín. 10.000 · máx. 48.000', available: 48000 },
];
const BONUSES = [
  { id: 'impressoes', name: '+20% de impressões', rule: 'Verba ≥ R$ 15.000,00', min: 15000, text: 'Impressões extras sem custo durante a feira.' },
  { id: 'newsletter', name: 'Destaque na newsletter', rule: 'Verba ≥ R$ 27.000,00', min: 27000, text: 'Logo na newsletter diária dos credenciados.' },
  { id: 'fidelidade', name: 'Desconto de fidelidade', rule: 'A partir da 3ª campanha', min: 0, text: '5% de desconto a partir da terceira campanha.' },
];

/* ——— Briefing (esquema que gera o formulário) ——— */

export type BriefKind = 'text' | 'url' | 'textarea' | 'select' | 'multi' | 'date' | 'file';
export type BriefField = {
  id: string;
  kind: BriefKind;
  label: string;
  required?: boolean;
  options?: string[];
  max?: number;
  hint?: string;
  placeholder?: string;
};
export type BriefValue = string | string[] | null;
export type BriefValues = Record<string, BriefValue>;

export const BRIEF_FIELDS: BriefField[] = [
  { id: 'peca', kind: 'file', label: 'Peça criativa', required: true, hint: 'PNG ou JPG · 970 × 250 px' },
  { id: 'url', kind: 'url', label: 'URL de destino', required: true, placeholder: 'https://' },
  { id: 'alt', kind: 'textarea', label: 'Texto alternativo da peça', max: 180 },
  { id: 'idioma', kind: 'select', label: 'Idioma da peça', required: true, options: ['Português', 'Inglês', 'Espanhol'] },
  { id: 'pavilhoes', kind: 'multi', label: 'Pavilhões de interesse', options: ['Pavilhão Azul', 'Pavilhão Verde', 'Pavilhão Laranja', 'Área internacional'] },
  { id: 'entrega', kind: 'date', label: 'Entrega do criativo', required: true, hint: 'Até 5 dias úteis antes do início' },
];
export const BRIEF_START: BriefValues = { peca: 'peca-970x250.png', url: 'https://aurora.com.br/primavera', alt: '', idioma: '', pavilhoes: [], entrega: '' };

const filled = (value: BriefValue | undefined) => (Array.isArray(value) ? value.length > 0 : Boolean(value));
export function briefCount(fields: BriefField[], values: BriefValues, sendLater = false) {
  const live = fields.filter((field) => !(sendLater && field.kind === 'file'));
  return { done: live.filter((field) => filled(values[field.id])).length, total: live.length };
}
function briefMissing(values: BriefValues, sendLater: boolean) {
  return BRIEF_FIELDS.filter((field) => field.required && !(sendLater && field.kind === 'file') && !filled(values[field.id]));
}
const briefError: Record<string, string> = {
  peca: 'Envie a peça ou marque o envio depois',
  url: 'Informe a URL de destino',
  idioma: 'Escolha o idioma da peça',
  entrega: 'Defina a data de entrega',
};

/* ——————————————————————————— Rascunho ——————————————————————————— */

export type Draft = {
  name: string;
  advertiserId: string;
  category: CategoryId | null;
  assetId: string;
  start: string;
  end: string;
  budget: number | null;
  channels: Record<string, number | null>;
  audiences: Record<string, number | null>;
  brief: BriefValues;
  sendLater: boolean;
  submitNow: boolean;
};

export const FULL_DRAFT: Draft = {
  name: 'Coleção Primavera-Verão 2027',
  advertiserId: 'aurora',
  category: 'online',
  assetId: 'banner',
  start: '2026-10-05',
  end: '2026-10-31',
  budget: 18000,
  channels: { portal: 50, app: 50 },
  audiences: { credenciados: 50, lojistas: 50 },
  brief: BRIEF_START,
  sendLater: false,
  submitNow: true,
};
export const EMPTY_DRAFT: Draft = {
  name: '',
  advertiserId: '',
  category: null,
  assetId: '',
  start: '',
  end: '',
  budget: null,
  channels: {},
  audiences: {},
  brief: { peca: '', url: '', alt: '', idioma: '', pavilhoes: [], entrega: '' },
  sendLater: false,
  submitNow: true,
};

const STEPS = ['Identificação', 'Ativo', 'Precificação', 'Canal + Público', 'Briefing', 'Revisão'];
type Errors = Record<string, string>;

const sum = (record: Record<string, number | null>) =>
  Object.values(record).reduce<number>((total, value) => total + (value ?? 0), 0);

function validate(step: number, draft: Draft, forSend = false): Errors {
  const errors: Errors = {};
  if (step === 0) {
    if (!draft.name.trim()) errors.name = 'Informe o nome da campanha';
    if (!draft.advertiserId) errors.advertiser = 'Escolha o anunciante';
  }
  if (step === 1) {
    if (!draft.assetId) errors.asset = 'Escolha um ativo';
    if (!draft.start) errors.start = 'Defina o início';
    if (!draft.end) errors.end = 'Defina o término';
  }
  if (step === 2 && !draft.budget) errors.budget = 'Informe a verba';
  if (step === 3) {
    const channels = Object.keys(draft.channels);
    const audiences = Object.keys(draft.audiences);
    if (!channels.length) errors.channels = 'Marque pelo menos um canal';
    else if (Math.round(sum(draft.channels)) !== 100) errors.channels = 'A alocação dos canais precisa somar 100%';
    if (!audiences.length) errors.audiences = 'Marque pelo menos um público';
    else if (Math.round(sum(draft.audiences)) !== 100) errors.audiences = 'A alocação dos públicos precisa somar 100%';
  }
  if (step === 4 && forSend) for (const field of briefMissing(draft.brief, draft.sendLater)) errors[field.id] = briefError[field.id] ?? 'Obrigatório no envio';
  return errors;
}

/* ——————————————————————————— Pequenas peças ——————————————————————————— */

function Section({
  title,
  meta,
  actions,
  children,
  headingRef,
}: {
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  headingRef?: (node: HTMLHeadingElement | null) => void;
}) {
  return (
    <section className={w.section}>
      <header className={w.sectionHead}>
        <h2 className={w.sectionTitle} tabIndex={-1} ref={headingRef}>
          {title}
        </h2>
        {meta && <span className={w.sectionMeta}>{meta}</span>}
        {actions && <span className={w.sectionActions}>{actions}</span>}
      </header>
      <div className={w.sectionBody}>{children}</div>
    </section>
  );
}

function Group({
  label,
  required,
  meta,
  actions,
  labelId,
  children,
}: {
  label: string;
  required?: boolean;
  meta?: ReactNode;
  actions?: ReactNode;
  labelId?: string;
  children: ReactNode;
}) {
  return (
    <div className={w.group}>
      <div className={w.groupHead}>
        <span className={w.groupLabel} id={labelId}>
          {label}
          {required && (
            <span className={w.req} aria-hidden="true">
              *
            </span>
          )}
        </span>
        {meta && <span className={w.groupMeta}>{meta}</span>}
        {actions && <span className={w.groupActions}>{actions}</span>}
      </div>
      {children}
    </div>
  );
}

function ErrorText({ id, children }: { id?: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} className={w.fieldError} role="alert">
      <CircleAlert aria-hidden="true" />
      {children}
    </p>
  );
}

/** Pisca o fundo da linha em b-25 por 600 ms quando o valor muda (nunca na primeira pintura). */
function useFlash(value: string) {
  const [tick, setTick] = useState(0);
  const first = useRef(value);
  useEffect(() => {
    if (value === first.current) return;
    first.current = value;
    setTick((current) => current + 1);
  }, [value]);
  return tick;
}

/* ——————————————————————————— Resumo da campanha ——————————————————————————— */

export type Reason = { text: string; who: string; at: string };

function Block({
  label,
  meta,
  current,
  watch,
  children,
}: {
  label: string;
  meta?: ReactNode;
  current?: boolean;
  watch: string;
  children: ReactNode;
}) {
  const tick = useFlash(watch);
  return (
    <section className={w.block} data-current={current || undefined}>
      {tick > 0 && <i key={tick} className={w.flash} aria-hidden="true" />}
      <div className={w.blockHead}>
        <span className={w.blockLabel}>{label}</span>
        {meta && <span className={w.blockMeta}>{meta}</span>}
      </div>
      {children}
    </section>
  );
}

function WindowBar({ asset, start, end }: { asset: Asset; start: string; end: string }) {
  const from = time(asset.window.start);
  const span = time(asset.window.end) - from || 1;
  const left = start ? Math.max(0, Math.min(1, (time(start) - from) / span)) : 0;
  const right = end ? Math.max(0, Math.min(1, (time(end) - from) / span)) : 0;
  const has = Boolean(start && end && end >= start);
  return (
    <div className={w.window}>
      <div className={w.track} aria-hidden="true">
        {has && <i style={{ '--l': `${left * 100}%`, '--w': `${Math.max(2, (right - left) * 100)}%` } as CSSProperties} />}
      </div>
      <div className={w.trackLegend}>
        <span>{short(asset.window.start)}</span>
        <span>janela do ativo</span>
        <span>{short(asset.window.end)}</span>
      </div>
    </div>
  );
}

function Bars({ items, layout = 'compact' }: { items: { name: string; share: number; note?: string }[]; layout?: 'compact' | 'inline' }) {
  return (
    <ul className={w.bars} data-layout={layout}>
      {items.map((item) => (
        <li key={item.name}>
          <span className={w.barName}>{item.name}</span>
          {item.note && <small>{item.note}</small>}
          <b>{Math.round(item.share)}%</b>
          <i aria-hidden="true">
            <i style={{ width: `${Math.min(100, item.share)}%` }} />
          </i>
        </li>
      ))}
    </ul>
  );
}

function ReasonNote({ reason, lines = 3 }: { reason: Reason; lines?: 2 | 3 }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [clamped, setClamped] = useState(false);
  useIsoLayoutEffect(() => {
    const node = ref.current;
    if (!node || open) return;
    setClamped(node.scrollHeight > node.clientHeight + 1);
  }, [open, reason.text]);
  return (
    <section className={w.reason} aria-label="Motivo">
      <span className={w.reasonLabel}>
        <i aria-hidden="true" />
        Motivo
      </span>
      <p ref={ref} className={w.reasonText} data-lines={lines} data-open={open || undefined}>
        {reason.text}
      </p>
      {clamped && !open && (
        <LinkButton onClick={() => setOpen(true)}>ver tudo</LinkButton>
      )}
      <span className={w.reasonMeta}>
        {reason.who} · {reason.at}
      </span>
    </section>
  );
}

export const REASON: Reason = {
  text: 'Trocar a peça pela versão com o selo da Francal 2026 e reduzir o período para a semana da feira. O comercial aprova assim que a peça nova chegar.',
  who: 'Marina Lopes',
  at: '29/09/2026 às 16:42',
};

/** Quanto do resumo já é conhecido: só aparece o que a etapa já alcançou. */
export function summaryFacts(draft: Draft) {
  const asset = assetOf(draft.assetId);
  const budget = draft.budget ?? 0;
  const period = days(draft.start, draft.end);
  return {
    asset,
    budget,
    period,
    amount: budget > 0 ? brl(budget) : undefined,
    periodText: period ? `${period} ${period === 1 ? 'dia' : 'dias'}` : undefined,
    impressions: asset && asset.unitPrice && budget ? (budget / asset.unitPrice) * 1000 : 0,
  };
}

/**
 * Resumo vivo ao lado do formulário (320): identidade, Verba, Ativo, Período, Distribuição e Bônus,
 * separados por fio. O bloco da etapa atual tem o rótulo em azul; valor novo pisca a linha em b-25.
 */
export function CampaignSummary({
  draft,
  step,
  known = 5,
  reason,
}: {
  draft: Draft;
  /** Etapa atual (rótulo azul no bloco que ela define). */
  step: number;
  /** Até qual etapa os dados já foram vistos. */
  known?: number;
  reason?: Reason;
}) {
  const advertiser = ADVERTISERS.find((item) => item.id === draft.advertiserId);
  const facts = summaryFacts(draft);
  const asset = known >= 1 ? facts.asset : undefined;
  const amount = known >= 2 ? facts.amount : undefined;
  const hasPeriod = known >= 1 && facts.period > 0;
  const channels = known >= 3 ? Object.entries(draft.channels) : [];
  const audiences = known >= 3 ? Object.entries(draft.audiences) : [];
  const unlocked = BONUSES.filter((bonus) => facts.budget >= bonus.min).length;
  return (
    <div className={w.summary}>
      {reason && <ReasonNote reason={reason} lines={2} />}
      <div className={w.identity}>
        {advertiser && <BrandMark name={advertiser.name} size="sm" decorative />}
        <div>
          <strong data-empty={!draft.name || undefined}>{draft.name || 'Campanha sem nome'}</strong>
          <span>{advertiser?.name ?? 'Anunciante a definir'}</span>
        </div>
      </div>
      <Block label="Verba" current={step === 2} watch={amount ?? ''}>
        {amount ? (
          <>
            <b className={w.amount}>{amount}</b>
            {asset && facts.impressions > 0 && <span className={w.estimate}>≈ {int(facts.impressions)} impressões</span>}
            {asset && <span className={w.sub}>{asset.model} · {brl(asset.unitPrice)} por mil impressões</span>}
          </>
        ) : (
          <span className={w.placeholder}>A definir</span>
        )}
      </Block>
      <Block label="Ativo" current={step === 1} watch={asset?.id ?? ''} meta={asset ? CATEGORIES.find((item) => item.value === asset.category)?.label : undefined}>
        {asset ? (
          <>
            <strong className={w.value}>{asset.name}</strong>
            <span className={w.sub}>2 canais · 3 públicos disponíveis</span>
          </>
        ) : (
          <span className={w.placeholder}>A definir</span>
        )}
      </Block>
      <Block label="Período" current={step === 1} watch={hasPeriod ? `${draft.start}${draft.end}` : ''} meta={hasPeriod ? facts.periodText : undefined}>
        <strong className={w.value} data-empty={!hasPeriod || undefined}>
          {hasPeriod ? `${short(draft.start)} – ${short(draft.end)}` : 'A definir'}
        </strong>
        {asset && <WindowBar asset={asset} start={hasPeriod ? draft.start : ''} end={hasPeriod ? draft.end : ''} />}
      </Block>
      <Block label="Distribuição" current={step === 3} watch={JSON.stringify([channels, audiences])}>
        {channels.length || audiences.length ? (
          <>
            {channels.length > 0 && (
              <div className={w.barGroup}>
                <span className={w.barGroupLabel}>Canais</span>
                <Bars items={channels.map(([id, share]) => ({ name: CHANNELS.find((item) => item.id === id)?.name ?? id, share: share ?? 0 }))} />
              </div>
            )}
            {audiences.length > 0 && (
              <div className={w.barGroup}>
                <span className={w.barGroupLabel}>Públicos</span>
                <Bars items={audiences.map(([id, share]) => ({ name: AUDIENCES.find((item) => item.id === id)?.name ?? id, share: share ?? 0 }))} />
              </div>
            )}
          </>
        ) : (
          <span className={w.placeholder}>A definir</span>
        )}
      </Block>
      {asset && (
        <Block label="Bônus" current={step === 2} watch={String(unlocked)} meta={`${unlocked} de ${BONUSES.length}`}>
          <ul className={w.bonus}>
            {BONUSES.map((bonus) => {
              const on = facts.budget >= bonus.min;
              const missing = bonus.min - facts.budget;
              return (
                <li key={bonus.id} data-state={on ? 'on' : 'off'} data-long={!on || undefined}>
                  <i aria-hidden="true" />
                  <span>{bonus.name}</span>
                  <small>{on ? 'Liberado' : `Faltam ${brl(missing)}`}</small>
                </li>
              );
            })}
          </ul>
        </Block>
      )}
    </div>
  );
}

/* ——————————————————————————— Etapas ——————————————————————————— */

type StepProps = {
  draft: Draft;
  update: (patch: Partial<Draft>) => void;
  errors: Errors;
  headingRef: (node: HTMLHeadingElement | null) => void;
  goTo: (index: number) => void;
};

function StepIdentification({ draft, update, errors, headingRef }: StepProps) {
  const id = useId();
  const chosen = ADVERTISERS.find((item) => item.id === draft.advertiserId);
  return (
    <Section title="Identificação" headingRef={headingRef}>
      <div className={w.grid2}>
        <Field label="Nome da campanha" required error={errors.name} id={`${id}-name`}>
          {(props) => (
            <Input
              id={props.id}
              aria-describedby={props.describedBy}
              invalid={props.invalid}
              aria-invalid={props.invalid || undefined}
              placeholder="Ex.: Lançamento coleção verão"
              value={draft.name}
              onChange={(event) => update({ name: event.target.value })}
            />
          )}
        </Field>
        <Field label="Anunciante" required error={errors.advertiser} id={`${id}-adv`}>
          {(props) => (
            <Combobox
              id={props.id}
              describedBy={props.describedBy}
              invalid={props.invalid}
              value={draft.advertiserId}
              onChange={(value) => update({ advertiserId: value })}
              placeholder="Selecione o anunciante"
              options={ADVERTISERS.map((item) => ({
                value: item.id,
                label: item.name,
                description: item.segment,
                leading: <BrandMark name={item.name} size="xs" variant="soft" decorative />,
              }))}
            />
          )}
        </Field>
      </div>
      {chosen ? (
        <Group label="Histórico no portal" actions={<LinkButton onClick={() => update({ advertiserId: '' })}>Trocar</LinkButton>}>
          <div className={w.history}>
            <div className={w.historyHead}>
              <BrandMark name={chosen.name} size="sm" decorative />
              <span>
                <strong>{chosen.name}</strong>
                <small>
                  CNPJ {chosen.cnpj} · {chosen.segment}
                </small>
              </span>
            </div>
            <MetricStrip
              size="figure"
              label="Números do anunciante"
              items={[
                { label: 'Campanhas no portal', value: String(chosen.campaigns) },
                { label: 'Em veiculação', value: String(chosen.live) },
                { label: 'Verba contratada', value: chosen.contracted ? brl(chosen.contracted) : '—' },
              ]}
            />
            <table className={w.table} data-fixed="">
              <caption className={w.srOnly}>Campanhas de {chosen.name}</caption>
              <colgroup>
                <col />
                <col style={{ width: '27%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: 104 }} />
                <col style={{ width: 112 }} />
              </colgroup>
              <tbody>
                {(chosen.id === 'aurora' ? AURORA_HISTORY : [chosen.last]).map((row) => (
                  <tr key={row.name}>
                    <th scope="row">{row.name}</th>
                    <td className={w.muted}>{row.asset}</td>
                    <td>
                      <Badge variant="text" tone={row.tone} live={row.status === 'Veiculando'}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className={w.num}>{row.period}</td>
                    <td className={w.num}>{row.value ? brl(row.value) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Group>
      ) : (
        <Group label="Anunciantes do portal">
          <table className={w.table} data-head="">
            <thead>
              <tr>
                <th scope="col">Anunciante</th>
                <th scope="col" className={w.num}>
                  Campanhas
                </th>
                <th scope="col" className={w.num}>
                  Em veiculação
                </th>
                <th scope="col" className={w.num}>
                  Verba contratada
                </th>
                <th scope="col">Última campanha</th>
              </tr>
            </thead>
            <tbody>
              {ADVERTISERS.map((item) => (
                <tr key={item.id} className={w.pickRow} onClick={() => update({ advertiserId: item.id })}>
                  <th scope="row">
                    <button type="button" className={w.pick} onClick={() => update({ advertiserId: item.id })}>
                      <BrandMark name={item.name} size="xs" variant="soft" decorative />
                      <span>
                        <b>{item.name}</b>
                        <small>{item.segment}</small>
                      </span>
                    </button>
                  </th>
                  <td className={w.num}>{item.campaigns}</td>
                  <td className={w.num}>{item.live}</td>
                  <td className={w.num}>{item.contracted ? brl(item.contracted) : '—'}</td>
                  <td>
                    <span className={w.lastCell}>
                      <Badge variant="text" tone={item.last.tone}>
                        {item.last.status}
                      </Badge>
                      <small>{item.last.period}</small>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Group>
      )}
    </Section>
  );
}

export const PACKAGES = [
  {
    id: 'lancamento',
    name: 'Pacote Lançamento',
    rows: [
      { name: 'Banner Super Topo — Portal', window: '01/10 – 30/11' },
      { name: 'E-mail marketing dedicado', window: '15/09 – 30/11' },
      { name: 'Push no app da feira', window: '10/10 – 20/10' },
    ],
    price: 'Sem preço fechado',
    fixed: false,
  },
  {
    id: 'feira',
    name: 'Pacote Semana da Feira',
    rows: [
      { name: 'Painel de LED — Pavilhão Azul', window: '12/10 – 17/10' },
      { name: 'Totem na entrada principal', window: '13/10 – 16/10' },
      { name: 'Destaque na vitrine', window: '01/10 – 31/10' },
    ],
    price: 'R$ 21.500,00',
    fixed: true,
  },
];

/** Cartões de pacote: ativos com a janela de cada um e o preço (fechado ou não). */
export function PackageChoices({ value, onChange, name = 'pacote' }: { value: string; onChange: (id: string) => void; name?: string }) {
  return (
    <div className={w.packages} role="radiogroup" aria-label="Pacote">
      {PACKAGES.map((item) => (
        <ChoiceCard
          key={item.id}
          name={name}
          value={item.id}
          checked={value === item.id}
          onChange={onChange}
          title={item.name}
          extra={
            <span className={w.packRows}>
              {item.rows.map((row) => (
                <span key={row.name} className={w.packRow}>
                  <span>{row.name}</span>
                  <small>{row.window}</small>
                </span>
              ))}
            </span>
          }
          footer={
            <span className={w.packPrice} data-fixed={item.fixed || undefined}>
              {item.fixed ? (
                <>
                  <b>{item.price}</b> preço fechado
                </>
              ) : (
                item.price
              )}
            </span>
          }
        />
      ))}
    </div>
  );
}

/** Cartões de ativo da etapa 2 (também usados na prancha “Card de mídia e pacote”). */
export function AssetChoices({
  assets,
  value,
  onChange,
  invalid,
  name = 'ativo',
  force,
  disabled = [],
}: {
  assets: Asset[];
  value: string;
  onChange: (id: string) => void;
  invalid?: boolean;
  name?: string;
  force?: Record<string, string>;
  /** Ativos esgotados no período. */
  disabled?: string[];
}) {
  return (
    <div className={w.assets} role="radiogroup" aria-label="Ativo" aria-invalid={invalid || undefined}>
      {assets.map((asset) => (
        <ChoiceCard
          key={asset.id}
          name={name}
          value={asset.id}
          checked={value === asset.id}
          onChange={onChange}
          invalid={invalid}
          disabled={disabled.includes(asset.id)}
          data-force={force?.[asset.id]}
          title={<span className={w.clamp2}>{asset.name}</span>}
          description={<span className={w.clamp2}>{asset.description}</span>}
          extra={
            <span className={w.assetMeta}>
              <span>
                <b>{asset.model}</b> {asset.price}
              </span>
              <span className={w.nowrap}>
                {disabled.includes(asset.id) ? 'Esgotado no período' : `${short(asset.window.start)} – ${short(asset.window.end)}`}
              </span>
            </span>
          }
        />
      ))}
    </div>
  );
}

function StepAsset({ draft, update, errors, headingRef }: StepProps) {
  const id = useId();
  const [kind, setKind] = useState<'ativo' | 'pacote'>('ativo');
  const [pack, setPack] = useState('lancamento');
  const assets = ASSETS.filter((asset) => asset.category === (draft.category ?? 'online'));
  const asset = assetOf(draft.assetId);
  return (
    <Section
      title="Ativo"
      headingRef={headingRef}
      actions={
        <Segmented
          label="Contratar"
          size="sm"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'ativo', label: 'Ativo' },
            { value: 'pacote', label: 'Pacote' },
          ]}
        />
      }
    >
      <Group label="Categoria" required labelId={`${id}-cat`}>
        <ToggleGroup
          type="single"
          required
          label="Categoria"
          labelledBy={`${id}-cat`}
          value={draft.category}
          onChange={(value) => update({ category: (value as CategoryId) ?? draft.category, assetId: '' })}
          items={CATEGORIES.map((item) => ({
            value: item.value,
            label: item.label,
            icon: item.icon,
            count: ASSETS.filter((asset) => asset.category === item.value).length,
          }))}
        />
      </Group>
      {kind === 'pacote' ? (
        <Group label="Pacote" required meta={`${PACKAGES.length} disponíveis`}>
          <PackageChoices value={pack} onChange={setPack} name="pacote-etapa" />
        </Group>
      ) : (
      <Group label="Ativo" required meta={`${assets.length} disponíveis`}>
        <AssetChoices assets={assets} value={draft.assetId} invalid={Boolean(errors.asset)} onChange={(value) => update({ assetId: value })} />
        <ErrorText>{errors.asset}</ErrorText>
        {asset && (
          <dl className={w.assetStrip}>
            <div>
              <dt>Canais</dt>
              <dd>{asset.channels}</dd>
            </div>
            <div>
              <dt>Públicos</dt>
              <dd>{asset.audiences}</dd>
            </div>
            <div>
              <dt>Briefing e bônus</dt>
              <dd>{asset.extra}</dd>
            </div>
          </dl>
        )}
      </Group>
      )}
      <Group label="Período de veiculação" required>
        <div className={w.period}>
          <DateRangePicker
            start={draft.start}
            end={draft.end}
            onChange={(range) => update({ start: range.start, end: range.end })}
            min={asset?.window.start}
            max={asset?.window.end}
            window={asset ? { ...asset.window, label: 'Janela do ativo' } : undefined}
            startLabel="Início"
            endLabel="Término"
            invalid={errors.start || errors.end ? { start: Boolean(errors.start), end: Boolean(errors.end) } : undefined}
            aria-label="Período de veiculação"
          />
        </div>
        {errors.start || errors.end ? (
          <ErrorText>{errors.start ?? errors.end}</ErrorText>
        ) : (
          asset && (
            <p className={w.help}>
              Janela do ativo <b>{`${short(asset.window.start)} – ${short(asset.window.end)}`}</b>
            </p>
          )
        )}
      </Group>
    </Section>
  );
}

/** Bloco de verba: valor herói, entrega estimada, régua e faixa de números. */
export function BudgetBlock({
  budget,
  onChange,
  invalid,
  error,
}: {
  budget: number | null;
  onChange: (value: number | null) => void;
  invalid?: boolean;
  error?: string;
}) {
  const id = useId();
  const [notice, setNotice] = useState<string | undefined>(undefined);
  const value = budget ?? 0;
  const impressions = (value / 45) * 1000;
  const period = 27;
  const bonus = value >= 15000;
  const withBonus = impressions * (bonus ? 1.2 : 1);
  const effective = withBonus ? (value / withBonus) * 1000 * 0.95 : 0;
  return (
    <div className={w.budget} data-invalid={invalid || undefined}>
      <div className={w.budgetTop}>
        <Field
          label="Verba planejada"
          required
          id={`${id}-budget`}
          error={error}
          notice={notice}
          hint="Múltiplos de R$ 45,00"
        >
          {(props) => (
            <MoneyField
              id={props.id}
              aria-describedby={props.describedBy}
              invalid={props.invalid}
              size="hero"
              value={budget}
              min={2025}
              max={45000}
              multiple={45}
              onChange={(next) => {
                setNotice(undefined);
                onChange(next);
              }}
              onAdjust={(next, _typed, reason) =>
                setNotice(
                  reason === 'min'
                    ? `Ajustada para ${brl(next)} — mínimo deste ativo`
                    : reason === 'max'
                      ? `Ajustada para ${brl(next)} — máximo deste ativo`
                      : `Ajustada para ${brl(next)}`,
                )
              }
            />
          )}
        </Field>
        <div className={w.estimateBox}>
          <span className={w.estimateLabel}>Entrega estimada</span>
          <span className={w.estimateFigure} key={Math.round(impressions)}>
            {value ? (
              <>
                ≈ {int(impressions)} <small>impressões</small>
              </>
            ) : (
              <span className={w.placeholder}>A definir</span>
            )}
          </span>
          <span className={w.estimateRule}>
            <b>CPM</b> R$ 45,00 por mil impressões <Lock aria-hidden="true" />
          </span>
        </div>
      </div>
      <div className={w.budgetSlider}>
        <Slider
          label="Verba planejada"
          value={value || 2025}
          empty={!value}
          min={2025}
          max={45000}
          step={45}
          onChange={(next) => onChange(next)}
          format={brl}
          marks={[{ value: 9000, kind: 'recommended', label: 'Recomendado' }]}
          start={<span className={w.sliderEnd}>Mínimo · R$ 2.025,00</span>}
          end={<span className={w.sliderEnd}>R$ 45.000,00 · Máximo</span>}
        />
      </div>
      <div className={w.budgetStrip}>
        <MetricStrip
          size="figure"
          label="Previsão"
          items={[
            { label: 'Por dia', value: value ? `≈ ${int(impressions / period)}` : undefined, hint: `impressões por dia · ${period} dias`, empty: !value },
            { label: 'Com bônus', value: value ? `≈ ${int(withBonus)}` : undefined, hint: bonus ? '+20% liberado' : 'Bônus a partir de R$ 15.000,00', empty: !value },
            { label: 'Custo efetivo', value: value ? brl(effective) : undefined, hint: 'por mil impressões · −5%', empty: !value },
          ]}
        />
      </div>
    </div>
  );
}

function BonusCards({ budget }: { budget: number }) {
  return (
    <div className={w.bonusCards}>
      {BONUSES.map((bonus) => {
        const on = budget >= bonus.min;
        return (
          <div key={bonus.id} className={w.bonusCard} data-on={on || undefined}>
            <span className={w.bonusState}>
              <i aria-hidden="true" />
              {on ? 'Liberado' : 'Bloqueado'}
            </span>
            <strong>{bonus.name}</strong>
            <span className={w.bonusText}>{bonus.text}</span>
            {!on && (
              <span className={w.bonusMeter} aria-hidden="true">
                <i style={{ width: `${Math.min(100, (budget / bonus.min) * 100)}%` }} />
              </span>
            )}
            <span className={w.bonusRule}>
              {bonus.rule}
              {!on && ` · faltam ${brl(bonus.min - budget)}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StepPricing({ draft, update, errors, headingRef }: StepProps) {
  const unlocked = BONUSES.filter((bonus) => (draft.budget ?? 0) >= bonus.min).length;
  return (
    <Section title="Precificação" headingRef={headingRef}>
      <BudgetBlock budget={draft.budget} onChange={(budget) => update({ budget })} invalid={Boolean(errors.budget)} error={errors.budget} />
      <Group label="Bônus" meta={`${unlocked} de ${BONUSES.length} liberados`}>
        <BonusCards budget={draft.budget ?? 0} />
      </Group>
    </Section>
  );
}

function AllocTable({
  kind,
  rows,
  value,
  onChange,
  budget,
  error,
}: {
  kind: 'canal' | 'publico';
  rows: { id: string; name: string; icon?: LucideIcon; meta?: string; available?: number }[];
  value: Record<string, number | null>;
  onChange: (next: Record<string, number | null>) => void;
  budget: number;
  error?: string;
}) {
  const total = Math.round(sum(value));
  const count = Object.keys(value).length;
  const ok = count > 0 && total === 100;
  return (
    <div className={w.alloc} data-invalid={error ? true : undefined}>
      <table className={w.allocTable}>
        <thead>
          <tr>
            <th scope="col">{kind === 'canal' ? 'Canal' : 'Público'}</th>
            {kind === 'publico' && (
              <th scope="col" className={w.num} data-wide="">
                Disponível
              </th>
            )}
            <th scope="col" className={w.num}>
              {kind === 'canal' ? 'Valor' : 'Volume'}
            </th>
            <th scope="col" className={w.allocCol}>
              Alocação
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const on = row.id in value;
            const share = value[row.id] ?? 0;
            const Icon = row.icon;
            return (
              <tr key={row.id} data-on={on || undefined}>
                <th scope="row">
                  <span className={w.allocName}>
                    <Checkbox
                      aria-label={row.name}
                      checked={on}
                      onChange={(event) => {
                        const next = { ...value };
                        if (event.target.checked) next[row.id] = 0;
                        else delete next[row.id];
                        onChange(next);
                      }}
                    />
                    {Icon && <Icon className={w.allocIcon} aria-hidden="true" />}
                    <span>
                      <b>{row.name}</b>
                      {row.meta && <small>{row.meta}</small>}
                    </span>
                  </span>
                </th>
                {kind === 'publico' && (
                  <td className={w.num} data-wide="">
                    {int(row.available ?? 0)}
                  </td>
                )}
                <td className={w.num}>
                  {on && share ? (kind === 'canal' ? `≈ R$ ${int((budget * share) / 100)}` : int(200000 * (share / 50))) : '—'}
                </td>
                <td className={w.allocCol}>
                  {on ? (
                    <NumberField
                      size="sm"
                      label={`Alocação de ${row.name}`}
                      value={value[row.id] ?? null}
                      min={0}
                      max={100}
                      suffix="%"
                      onChange={(next) => onChange({ ...value, [row.id]: next })}
                    />
                  ) : (
                    <span className={w.dash}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className={w.allocFoot} data-state={ok ? 'ok' : error ? 'error' : 'warn'}>
        {ok ? (
          <>
            <Check aria-hidden="true" />
            100% distribuído
          </>
        ) : error ? (
          <>
            <CircleAlert aria-hidden="true" />
            {error}
          </>
        ) : (
          <>
            <TriangleAlert aria-hidden="true" />
            {total < 100 ? `Faltam ${100 - total}%` : `Passou ${total - 100}%`}
          </>
        )}
      </div>
    </div>
  );
}

function evenly(record: Record<string, number | null>) {
  const keys = Object.keys(record);
  if (!keys.length) return record;
  const base = Math.floor(100 / keys.length);
  return Object.fromEntries(keys.map((key, index) => [key, index === 0 ? 100 - base * (keys.length - 1) : base]));
}

function StepChannels({ draft, update, errors, headingRef }: StepProps) {
  return (
    <Section title="Canal + Público" headingRef={headingRef}>
      <Group
        label="Canais"
        meta={`${Object.keys(draft.channels).length} de ${CHANNELS.length} marcados`}
        actions={<LinkButton onClick={() => update({ channels: evenly(draft.channels) })}>Dividir igualmente</LinkButton>}
      >
        <AllocTable kind="canal" rows={CHANNELS} value={draft.channels} budget={draft.budget ?? 0} onChange={(channels) => update({ channels })} error={errors.channels} />
      </Group>
      <Group
        label="Públicos"
        meta="mínimo e máximo por empresa"
        actions={<LinkButton onClick={() => update({ audiences: evenly(draft.audiences) })}>Dividir igualmente</LinkButton>}
      >
        <AllocTable kind="publico" rows={AUDIENCES} value={draft.audiences} budget={draft.budget ?? 0} onChange={(audiences) => update({ audiences })} error={errors.audiences} />
      </Group>
    </Section>
  );
}

/* ——— Formulário gerado pelo esquema (Briefing) ——— */

/** Área de envio da peça: vazia, em arrasto (tracejado) ou com o arquivo conferido. */
export function UploadSlot({
  value,
  onChange,
  invalid,
  describedBy,
  id,
  hint,
}: {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
  id?: string;
  hint?: string;
}) {
  const [over, setOver] = useState(false);
  if (value)
    return (
      <div className={w.file}>
        <span className={w.thumb} aria-hidden="true" />
        <span className={w.fileText}>
          <b>{value}</b>
          <small>970 × 250 px · 1 KB · PNG</small>
          <span className={w.fileOk}>
            <Check aria-hidden="true" />
            Medidas conferem com o formato do ativo
          </span>
        </span>
        <IconButton label={`Remover ${value}`} icon={Trash2} variant="ghost" size="sm" onClick={() => onChange('')} />
      </div>
    );
  return (
    <div
      className={w.drop}
      data-over={over || undefined}
      data-invalid={invalid || undefined}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        onChange(event.dataTransfer.files[0]?.name ?? 'peca-970x250.png');
      }}
    >
      <ImageUp aria-hidden="true" />
      <span className={w.dropText}>
        <span>
          {over ? (
            'Solte para enviar'
          ) : (
            <>
              Arraste a peça ou{' '}
              <button type="button" id={id} aria-describedby={describedBy} className={w.dropButton} onClick={() => onChange('peca-970x250.png')}>
                escolha um arquivo
              </button>
            </>
          )}
        </span>
        {hint && <small>{hint}</small>}
      </span>
    </div>
  );
}

/** Um campo do esquema → o componente certo. */
export function BriefInput({
  field,
  value,
  onChange,
  error,
}: {
  field: BriefField;
  value: BriefValue;
  onChange: (value: BriefValue) => void;
  error?: string;
}) {
  const text = typeof value === 'string' ? value : '';
  const list = Array.isArray(value) ? value : [];
  if (field.kind === 'multi')
    return (
      <Group label={field.label} required={field.required} labelId={`brief-${field.id}`}>
        <ToggleGroup
          type="multiple"
          label={field.label}
          labelledBy={`brief-${field.id}`}
          value={list}
          onChange={(next) => onChange(next)}
          items={(field.options ?? []).map((option) => ({ value: option, label: option }))}
        />
      </Group>
    );
  return (
    <Field label={field.label} required={field.required} error={error} hint={field.kind === 'file' ? undefined : field.hint}>
      {(props) => {
        if (field.kind === 'file')
          return <UploadSlot id={props.id} describedBy={props.describedBy} value={text} invalid={props.invalid} hint={field.hint} onChange={onChange} />;
        if (field.kind === 'textarea')
          return (
            <Textarea
              id={props.id}
              aria-describedby={props.describedBy}
              invalid={props.invalid}
              maxLength={field.max}
              rows={4}
              value={text}
              onChange={(event) => onChange(event.target.value)}
            />
          );
        if (field.kind === 'select')
          return (
            <Select
              id={props.id}
              describedBy={props.describedBy}
              invalid={props.invalid}
              value={text}
              placeholder="Selecione"
              onChange={(next) => onChange(next)}
              options={(field.options ?? []).map((option) => ({ value: option, label: option }))}
            />
          );
        if (field.kind === 'date')
          return (
            <DatePicker
              id={props.id}
              describedBy={props.describedBy}
              invalid={props.invalid}
              value={text}
              placeholder="Selecionar data"
              onChange={(next) => onChange(next)}
            />
          );
        return (
          <Input
            id={props.id}
            aria-describedby={props.describedBy}
            invalid={props.invalid}
            aria-invalid={props.invalid || undefined}
            type={field.kind === 'url' ? 'url' : 'text'}
            placeholder={field.placeholder}
            value={text}
            onChange={(event) => onChange(event.target.value)}
          />
        );
      }}
    </Field>
  );
}

/**
 * Formulário gerado de um esquema: grade de 2 colunas (alinha no topo), área de texto ocupando duas
 * linhas, upload na largura toda. “Enviar depois da contratação” recolhe o upload (280 ms).
 */
export function BriefForm({
  fields,
  values,
  onChange,
  sendLater,
  onSendLater,
  errors = {},
  fresh,
}: {
  fields: BriefField[];
  values: BriefValues;
  onChange: (id: string, value: BriefValue) => void;
  sendLater: boolean;
  onSendLater: (value: boolean) => void;
  errors?: Errors;
  /** Campo recém-adicionado (entra com altura e esmaecimento). */
  fresh?: string;
}) {
  const file = fields.find((field) => field.kind === 'file');
  const rest = fields.filter((field) => field.kind !== 'file');
  return (
    <div className={w.brief}>
      {file && (
        <div className={w.fileRow}>
          <div className={w.collapse} data-open={!sendLater || undefined} aria-hidden={sendLater || undefined} inert={sendLater || undefined}>
            <div>
              <BriefInput field={file} value={values[file.id] ?? ''} onChange={(value) => onChange(file.id, value)} error={errors[file.id]} />
            </div>
          </div>
          <Checkbox label="Enviar depois da contratação" checked={sendLater} onChange={(event) => onSendLater(event.target.checked)} />
        </div>
      )}
      <div className={w.briefGrid}>
        {rest.map((field) => (
          <div
            key={field.id}
            className={w.briefCell}
            data-tall={field.kind === 'textarea' || undefined}
            data-fresh={fresh === field.id || undefined}
          >
            <div>
              <BriefInput field={field} value={values[field.id] ?? ''} onChange={(value) => onChange(field.id, value)} error={errors[field.id]} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepBriefing({ draft, update, errors, headingRef }: StepProps) {
  const count = briefCount(BRIEF_FIELDS, draft.brief, draft.sendLater);
  return (
    <Section
      title="Briefing"
      headingRef={headingRef}
      meta={<span key={count.done}>{`${count.done} de ${count.total} preenchidos · obrigatórios só no envio`}</span>}
    >
      <BriefForm
        fields={BRIEF_FIELDS}
        values={draft.brief}
        sendLater={draft.sendLater}
        errors={errors}
        onSendLater={(sendLater) => update({ sendLater })}
        onChange={(id, value) => update({ brief: { ...draft.brief, [id]: value } })}
      />
    </Section>
  );
}

function ReviewSection({ title, meta, onEdit, children }: { title: string; meta?: string; onEdit: () => void; children: ReactNode }) {
  return (
    <section className={w.review}>
      <header className={w.reviewHead}>
        <h3>{title}</h3>
        {meta && <span className={w.groupMeta}>{meta}</span>}
        <LinkButton tone="quiet" className={w.edit} onClick={onEdit}>
          Editar
        </LinkButton>
      </header>
      {children}
    </section>
  );
}

function StepReview({ draft, headingRef, goTo }: StepProps) {
  const advertiser = ADVERTISERS.find((item) => item.id === draft.advertiserId);
  const facts = summaryFacts(draft);
  const asset = facts.asset;
  const count = briefCount(BRIEF_FIELDS, draft.brief, draft.sendLater);
  return (
    <div className={w.reviewWrap}>
      <header className={w.reviewTop}>
        {advertiser && <BrandMark name={advertiser.name} size="md" decorative />}
        <span className={w.reviewTitles}>
          <h2 className={w.reviewTitle} tabIndex={-1} ref={headingRef}>
            {draft.name || 'Campanha sem nome'}
          </h2>
          <small>
            {advertiser?.name} · CNPJ {advertiser?.cnpj}
          </small>
        </span>
        <LinkButton tone="quiet" className={w.edit} onClick={() => goTo(0)}>
          Editar
        </LinkButton>
      </header>
      <MetricStrip
        size="figure"
        label="Resumo da campanha"
        items={[
          { label: 'Verba', value: facts.amount ?? '—', hint: 'CPM · R$ 45,00 por mil' },
          { label: 'Entrega estimada', value: facts.impressions ? `≈ ${int(facts.impressions)}` : '—', hint: 'impressões · +20% bônus' },
          { label: 'Duração', value: facts.periodText ?? '—', hint: `${short(draft.start)} – ${short(draft.end)}` },
          { label: 'Público potencial', value: '69.800', hint: 'pessoas em 2 públicos' },
        ]}
      />
      <div className={w.reviewGrid}>
        <ReviewSection title="Ativo" onEdit={() => goTo(1)}>
          <dl className={w.pairs}>
            <div>
              <dt>Ativo</dt>
              <dd>{asset?.name ?? '—'}</dd>
            </div>
            <div>
              <dt>Categoria</dt>
              <dd>{CATEGORIES.find((item) => item.value === draft.category)?.label ?? '—'}</dd>
            </div>
            <div>
              <dt>Janela do ativo</dt>
              <dd className={w.num}>{asset ? `${full(asset.window.start)} – ${full(asset.window.end)}` : '—'}</dd>
            </div>
          </dl>
        </ReviewSection>
        <ReviewSection title="Precificação" meta={`${BONUSES.filter((bonus) => facts.budget >= bonus.min).length} de 3 bônus`} onEdit={() => goTo(2)}>
          <ul className={w.bonus} data-review="">
            {BONUSES.map((bonus) => {
              const on = facts.budget >= bonus.min;
              return (
                <li key={bonus.id} data-state={on ? 'on' : 'off'}>
                  <i aria-hidden="true" />
                  <span>{bonus.name}</span>
                  <small>{on ? 'Liberado' : `Faltam ${brl(bonus.min - facts.budget)}`}</small>
                </li>
              );
            })}
          </ul>
        </ReviewSection>
        <ReviewSection title="Canais" meta={`${Object.keys(draft.channels).length} canais`} onEdit={() => goTo(3)}>
          <Bars
            layout="inline"
            items={Object.entries(draft.channels).map(([id, share]) => ({
              name: CHANNELS.find((item) => item.id === id)?.name ?? id,
              share: share ?? 0,
              note: `≈ R$ ${int((facts.budget * (share ?? 0)) / 100)}`,
            }))}
          />
        </ReviewSection>
        <ReviewSection title="Públicos" meta={`${Object.keys(draft.audiences).length} públicos`} onEdit={() => goTo(3)}>
          <Bars
            layout="inline"
            items={Object.entries(draft.audiences).map(([id, share]) => ({
              name: AUDIENCES.find((item) => item.id === id)?.name ?? id,
              share: share ?? 0,
              note: `${int(200000 * ((share ?? 0) / 50))} un`,
            }))}
          />
        </ReviewSection>
      </div>
      <ReviewSection title="Briefing" meta={`${count.done} de ${count.total} preenchidos`} onEdit={() => goTo(4)}>
        <dl className={w.briefPairs}>
          {BRIEF_FIELDS.filter((field) => !(draft.sendLater && field.kind === 'file')).map((field) => {
            const value = draft.brief[field.id];
            const has = filled(value);
            return (
              <div key={field.id}>
                <dt>{field.label}</dt>
                <dd data-state={has ? undefined : field.required ? 'missing' : 'empty'}>
                  {has
                    ? Array.isArray(value)
                      ? value.join(', ')
                      : field.kind === 'date' && typeof value === 'string'
                        ? full(value)
                        : value
                    : field.required
                      ? 'Falta'
                      : 'Não informado'}
                </dd>
              </div>
            );
          })}
        </dl>
      </ReviewSection>
    </div>
  );
}

/** Lateral da revisão: como salvar, o que falta e o que acontece depois. */
function SendPanel({ draft, update, goTo, onFix }: { draft: Draft; update: (patch: Partial<Draft>) => void; goTo: (index: number) => void; onFix: (index: number) => void }) {
  const missing = briefMissing(draft.brief, draft.sendLater);
  const checks = STEPS.slice(0, 5).map((title, index) => {
    const found = validate(index, draft, true);
    const keys = Object.keys(found);
    const state = keys.length === 0 ? 'ok' : index === 4 && !draft.submitNow ? 'warn' : 'error';
    const text =
      state === 'ok'
        ? undefined
        : index === 4
          ? `${missing.length} ${missing.length === 1 ? 'campo obrigatório faltando' : 'campos obrigatórios faltando'}`
          : found[keys[0] ?? ''];
    return { index, title, state, text };
  });
  const blocked = draft.submitNow && missing.length > 0;
  return (
    <div className={w.send}>
      <div className={w.sendHead}>
        <span className={w.blockLabel}>Envio</span>
        <strong>Como salvar esta campanha?</strong>
      </div>
      <div className={w.sendOptions} role="radiogroup" aria-label="Como salvar esta campanha?">
        <ChoiceCard
          name="envio"
          value="rascunho"
          checked={!draft.submitNow}
          onChange={() => update({ submitNow: false })}
          title="Salvar como rascunho"
          description="Fica com você para continuar depois."
        />
        <ChoiceCard
          name="envio"
          value="enviar"
          checked={draft.submitNow}
          onChange={() => update({ submitNow: true })}
          title="Enviar para aprovação"
          description="O comercial do portal revisa e responde por aqui."
          footer={
            blocked ? (
              <span className={w.blocker}>
                <CircleAlert aria-hidden="true" />
                {missing.length === 1 ? 'Falta 1 campo do briefing' : `Faltam ${missing.length} campos do briefing`}
                <LinkButton className={w.blockerLink} onClick={() => onFix(4)}>
                  Preencher
                </LinkButton>
              </span>
            ) : undefined
          }
        />
      </div>
      <section className={w.block}>
        <div className={w.blockHead}>
          <span className={w.blockLabel}>Checagem</span>
          <span className={w.blockMeta}>{`${checks.filter((check) => check.state === 'ok').length} de ${checks.length}`}</span>
        </div>
        <ul className={w.checks}>
          {checks.map((check) => (
            <li key={check.title}>
              <button type="button" data-state={check.state} onClick={() => (check.state === 'ok' ? goTo(check.index) : onFix(check.index))}>
                <span className={w.checkIcon} aria-hidden="true">
                  {check.state === 'ok' ? <Check /> : check.state === 'warn' ? <TriangleAlert /> : <CircleAlert />}
                </span>
                <span className={w.checkText}>
                  <b>{check.title}</b>
                  {check.text && <span>{check.text}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      {draft.submitNow && (
        <section className={w.block}>
          <div className={w.blockHead}>
            <span className={w.blockLabel}>Depois do envio</span>
          </div>
          <ol className={w.next}>
            <li>Aprovação do portal</li>
            <li>P.I. para assinatura</li>
            <li>Veiculação</li>
          </ol>
        </section>
      )}
    </div>
  );
}

/* ——————————————————————————— Rodapé de 4 posições ——————————————————————————— */

export function WizardFooter({
  first,
  last,
  submitNow = true,
  status,
  errorCount = 0,
  busy = false,
  narrow = false,
  onCancel,
  onDraft,
  onBack,
  onNext,
}: {
  first: boolean;
  last: boolean;
  submitNow?: boolean;
  status?: 'unsaved' | 'saved';
  errorCount?: number;
  busy?: boolean;
  narrow?: boolean;
  onCancel?: () => void;
  onDraft?: () => void;
  onBack?: () => void;
  onNext?: () => void;
}) {
  return (
    <div className={w.footer} data-narrow={narrow || undefined} role="region" aria-label="Ações da campanha">
      {!narrow && (
        <div className={w.status}>
          {status && (
            <span className={w.saveState} data-clean={status === 'saved' || undefined} role="status">
              <i aria-hidden="true" />
              {status === 'saved' ? 'Rascunho salvo agora' : 'Alterações não salvas'}
            </span>
          )}
          {errorCount > 0 && (
            <span className={w.errorCount} role="status" key={errorCount}>
              <CircleAlert aria-hidden="true" />
              {errorCount === 1 ? 'Revise o campo sinalizado' : `Revise os ${errorCount} campos sinalizados`}
            </span>
          )}
        </div>
      )}
      <div className={w.footerButtons}>
        {!narrow && (
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button
          variant="ghost"
          className={w.draftSlot}
          data-hidden={last || undefined}
          aria-hidden={last || undefined}
          tabIndex={last ? -1 : undefined}
          disabled={busy}
          onClick={onDraft}
        >
          Salvar rascunho
        </Button>
        <Button icon={ArrowLeft} className={w.back} aria-label="Voltar" disabled={first || busy} onClick={onBack}>
          {!narrow && 'Voltar'}
        </Button>
        <span className={w.primarySlot}>
          {last ? (
            <Button variant="primary" icon={submitNow ? Send : Check} loading={busy} onClick={onNext}>
              {submitNow ? 'Enviar para aprovação' : 'Salvar rascunho'}
            </Button>
          ) : (
            <Button variant="primary" trailingIcon={ArrowRight} loading={busy} onClick={onNext}>
              Continuar
            </Button>
          )}
        </span>
      </div>
    </div>
  );
}

/* ——————————————————————————— Diálogo de criação ——————————————————————————— */

type Run = { kind: 'submit' | 'draft'; name: string; facts: string[] };
const RUN_STEPS: Record<Run['kind'], string[]> = {
  submit: ['Conferindo regras do ativo', 'Gerando a campanha', 'Notificando o comercial do portal'],
  draft: ['Conferindo os dados', 'Salvando o rascunho'],
};

/** Registro da campanha criada: nome, número e os fatos (verba · período · anunciante). */
export function CreatedRecord({ name, number, facts }: { name: string; number: string; facts: string[] }) {
  return (
    <div className={w.record}>
      <p className={w.recordHead}>
        <span className={w.recordName}>{name}</span>
        <span className={w.recordId}>#{number}</span>
      </p>
      <p className={w.recordFacts}>
        {facts.map((fact, index) => (
          <span key={fact}>
            {index > 0 && <i aria-hidden="true">·</i>}
            {fact}
          </span>
        ))}
      </p>
    </div>
  );
}

/** Sucesso do diálogo de criação (também desenhado parado na prancha do resumo). */
export function CreatedSuccess({ run, onRestart, onView }: { run: Run; onRestart?: () => void; onView?: () => void }) {
  const submit = run.kind === 'submit';
  return (
    <div className={w.success}>
      <div className={w.successHead}>
        <svg className={w.seal} viewBox="0 0 40 40" aria-hidden="true">
          <circle className={w.sealFill} cx="20" cy="20" r="20" />
          <path className={w.sealCheck} d="M12.5 20.5l5 5L28 15" pathLength={1} />
        </svg>
        <div className={w.reveal}>
          <h2 className={w.successTitle}>{submit ? 'Campanha enviada para aprovação' : 'Rascunho salvo'}</h2>
          <p className={w.successNote}>{submit ? 'O comercial do portal revisa e responde por aqui.' : 'Fica com você para continuar depois.'}</p>
        </div>
      </div>
      <div className={w.reveal} data-delay="1">
        <CreatedRecord name={run.name} number="3017" facts={run.facts} />
      </div>
      <div className={w.successFoot}>
        <Button onClick={onRestart}>Criar outra campanha</Button>
        <Button variant="primary" trailingIcon={ArrowRight} data-autofocus onClick={onView}>
          Ver campanha
        </Button>
      </div>
    </div>
  );
}

function CreationDialog({ run, onDone }: { run: Run | null; onDone: (restart: boolean) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState(0);
  const [done, setDone] = useState(false);
  const steps = run ? RUN_STEPS[run.kind] : [];
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (run && !dialog.open) {
      setActive(0);
      setDone(reduced());
      dialog.showModal();
      dialog.focus();
    }
    if (!run && dialog.open) dialog.close();
  }, [run]);
  useEffect(() => {
    if (!run || done) return;
    const timer = window.setTimeout(() => {
      if (active >= steps.length) setDone(true);
      else setActive((value) => value + 1);
    }, active >= steps.length ? 220 : 720);
    return () => window.clearTimeout(timer);
  }, [run, active, done, steps.length]);
  useEffect(() => {
    if (!done) return;
    const frame = requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus());
    return () => cancelAnimationFrame(frame);
  }, [done]);
  return (
    <dialog
      ref={ref}
      className={w.creating}
      aria-label={run?.kind === 'draft' ? 'Salvando o rascunho' : 'Enviando para aprovação'}
      tabIndex={-1}
      onCancel={(event) => event.preventDefault()}
    >
      {run &&
        (done ? (
          <CreatedSuccess run={run} onRestart={() => onDone(true)} onView={() => onDone(false)} />
        ) : (
          <div className={w.progress}>
            <h2 className={w.successTitle}>{run.kind === 'draft' ? 'Salvando o rascunho' : 'Enviando para aprovação'}</h2>
            <ol className={w.progressList} aria-live="polite">
              {steps.map((label, index) => (
                <li key={label} data-state={index < active ? 'done' : index === active ? 'current' : 'next'}>
                  <span className={w.progressMark} aria-hidden="true">
                    {index < active ? <Check /> : <i />}
                  </span>
                  {label}
                </li>
              ))}
            </ol>
          </div>
        ))}
    </dialog>
  );
}

/* ——————————————————————————— Moldura da criação ——————————————————————————— */

const STEP_VIEWS = [StepIdentification, StepAsset, StepPricing, StepChannels, StepBriefing, StepReview];

function scrollParent(node: HTMLElement | null) {
  for (let el = node?.parentElement; el; el = el.parentElement) {
    const style = getComputedStyle(el);
    if (/(auto|scroll)/.test(style.overflowY)) return el;
  }
  return null;
}

export function CampaignWizard({
  initialStep = 0,
  initialDraft = { ...FULL_DRAFT, name: '', advertiserId: '' },
  height = 760,
}: {
  initialStep?: number;
  initialDraft?: Draft;
  height?: number | string;
}) {
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [step, setStep] = useState(initialStep);
  const [reached, setReached] = useState(initialStep);
  const [dir, setDir] = useState<'forward' | 'back'>('forward');
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'unsaved' | 'saved' | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [run, setRun] = useState<Run | null>(null);
  const [exit, setExit] = useState(false);
  const [round, setRound] = useState(0);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);
  useIsoLayoutEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const measure = () => setNarrow(el.clientWidth <= 760);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const last = step === STEPS.length - 1;

  function update(patch: Partial<Draft>) {
    const next = { ...draft, ...patch };
    setDraft(next);
    setStatus('unsaved');
    // Erros só somem quando corrigidos.
    setErrors((current) => {
      if (!Object.keys(current).length) return current;
      const fresh = validate(step, next, step === 4);
      return Object.fromEntries(Object.entries(fresh).filter(([key]) => key in current));
    });
  }

  function show(index: number, focusHeading = true) {
    setDir(index >= step ? 'forward' : 'back');
    setStep(index);
    setReached((current) => Math.max(current, index));
    setErrors({});
    requestAnimationFrame(() => {
      scrollParent(contentRef.current)?.scrollTo({ top: 0 });
      if (focusHeading) headingRef.current?.focus({ preventScroll: true });
    });
  }

  function reveal(found: Errors) {
    flushSync(() => setErrors(found));
    const root = contentRef.current;
    const target =
      root?.querySelector<HTMLElement>('[aria-invalid="true"]') ?? root?.querySelector<HTMLElement>('[role="alert"]');
    target?.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
    const control = target?.matches('input, button, textarea') ? target : target?.querySelector<HTMLElement>('input, button, textarea');
    control?.focus({ preventScroll: true });
  }

  function goTo(index: number) {
    if (index <= step) return show(index);
    for (let at = step; at < index; at += 1) {
      const found = validate(at, draft);
      if (Object.keys(found).length) {
        if (at !== step) show(at, false);
        requestAnimationFrame(() => reveal(found));
        return;
      }
    }
    show(index);
  }

  function fix(index: number) {
    show(index, false);
    requestAnimationFrame(() => reveal(validate(index, draft, true)));
  }

  function facts() {
    const f = summaryFacts(draft);
    return [f.amount ?? '—', `${short(draft.start)} – ${short(draft.end)}`, ADVERTISERS.find((item) => item.id === draft.advertiserId)?.name ?? ''];
  }

  function next() {
    if (busy) return;
    if (!last) return goTo(step + 1);
    for (let at = 0; at < STEPS.length - 1; at += 1) {
      const found = validate(at, draft, draft.submitNow);
      if (Object.keys(found).length) return fix(at);
    }
    setBusy(true);
    timer.current = window.setTimeout(() => {
      setBusy(false);
      setRun({ kind: draft.submitNow ? 'submit' : 'draft', name: draft.name, facts: facts() });
    }, reduced() ? 0 : 400);
  }

  function saveDraft() {
    for (let at = 0; at < STEPS.length - 1; at += 1) {
      const found = validate(at, draft);
      if (Object.keys(found).length) return fix(at);
    }
    setStatus('saved');
    toast('Rascunho salvo');
  }

  function restart() {
    setRun(null);
    setDraft({ ...FULL_DRAFT, name: '', advertiserId: '' });
    setStep(0);
    setReached(0);
    setErrors({});
    setStatus(undefined);
    setRound((value) => value + 1);
  }

  const items: StepItem[] = STEPS.map((label, index) => {
    if (index === step || index > reached || index === STEPS.length - 1) return { id: String(index), label };
    const found = validate(index, draft, index === 4);
    const state: Exclude<StepState, 'current'> = Object.keys(found).length
      ? index === 4 && !draft.submitNow
        ? 'warn'
        : 'error'
      : 'done';
    return { id: String(index), label, state };
  });

  const View = STEP_VIEWS[step] ?? StepIdentification;
  const errorCount = Object.keys(errors).length;
  const f = summaryFacts(draft);
  const ref = (node: HTMLHeadingElement | null) => {
    headingRef.current = node;
  };

  return (
    <div className={w.wizard} key={round} ref={rootRef}>
      <FixedFrame
        height={height}
        mainLabel={`Etapa ${step + 1} de ${STEPS.length}: ${STEPS[step]}`}
        asideLabel={last ? 'Envio' : 'Resumo da campanha'}
        asideSummary={`Resumo · ${reached >= 2 && f.amount ? f.amount : 'sem verba'} · ${reached >= 1 && f.periodText ? f.periodText : 'sem período'}`}
        header={(narrow) => (
          <div className={w.head} data-narrow={narrow || undefined}>
            <div className={w.title}>
              <h1>Nova campanha</h1>
              {!narrow && <span>Criada pelo admin</span>}
            </div>
            {narrow && <IconButton label="Cancelar" icon={X} variant="ghost" className={w.headClose} onClick={() => setExit(true)} />}
            <div className={w.steps}>
              <Stepper
                label="Etapas da campanha"
                steps={items}
                current={step}
                fit={narrow ? 'fill' : 'content'}
                align="end"
                canSelect={(index) => index <= reached}
                onStepSelect={(index) => goTo(index)}
              />
            </div>
          </div>
        )}
        aside={
          last ? (
            narrow ? undefined : (
              <SendPanel draft={draft} update={update} goTo={goTo} onFix={fix} />
            )
          ) : (
            <CampaignSummary draft={draft} step={step} known={reached} />
          )
        }
        footer={(narrow) => (
          <WizardFooter
            first={step === 0}
            last={last}
            narrow={narrow}
            submitNow={draft.submitNow}
            status={status}
            errorCount={errorCount}
            busy={busy}
            onCancel={() => setExit(true)}
            onDraft={saveDraft}
            onBack={() => show(step - 1)}
            onNext={next}
          />
        )}
      >
        <div ref={contentRef} key={step} className={w.stepView} data-dir={dir}>
          {/* No celular, a decisão de envio vem antes da revisão (A-49). */}
          {last && narrow && (
            <div className={w.sendFirst}>
              <SendPanel draft={draft} update={update} goTo={goTo} onFix={fix} />
            </div>
          )}
          <View draft={draft} update={update} errors={errors} headingRef={ref} goTo={goTo} />
        </div>
      </FixedFrame>
      <Dialog
        open={exit}
        onClose={() => setExit(false)}
        size="sm"
        divided={false}
        title="Descartar a campanha?"
        footer={
          <>
            <Button data-autofocus onClick={() => setExit(false)}>
              Continuar editando
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setExit(false);
                restart();
              }}
            >
              Descartar
            </Button>
          </>
        }
      />
      <CreationDialog
        run={run}
        onDone={(again) => {
          if (again) restart();
          else {
            setRun(null);
            toast('Campanha #3017 aberta', { tone: 'info' });
          }
        }}
      />
    </div>
  );
}

/* ——————————————————————————— Pranchas ——————————————————————————— */

function Wizard() {
  const phone = useMedia('(max-width: 640px)');
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="none">
        <CampaignWizard />
      </Shot>
      <Shot title="Celular" align="center" pad="lg">
        <div className={w.phones}>
          <div className={w.phone}>
            <CampaignWizard initialStep={1} initialDraft={FULL_DRAFT} height={760} />
          </div>
          <div className={w.phone}>
            <CampaignWizard initialStep={5} initialDraft={FULL_DRAFT} height={760} />
          </div>
        </div>
      </Shot>
      <Shot title="Rodapé" align="stretch" pad="lg">
        <div className={w.footers}>
          <State label="Primeira etapa">
            <div className={w.footerCell}>
              <WizardFooter narrow={phone} first last={false} />
            </div>
          </State>
          <State label="Alterado">
            <div className={w.footerCell}>
              <WizardFooter narrow={phone} first={false} last={false} status="unsaved" />
            </div>
          </State>
          <State label="Com erros">
            <div className={w.footerCell}>
              <WizardFooter narrow={phone} first={false} last={false} status="unsaved" errorCount={2} />
            </div>
          </State>
          <State label="Revisão">
            <div className={w.footerCell}>
              <WizardFooter narrow={phone} first={false} last status="saved" />
            </div>
          </State>
          <State label="Enviando">
            <div className={w.footerCell}>
              <WizardFooter narrow={phone} first={false} last status="unsaved" busy />
            </div>
          </State>
        </div>
      </Shot>
      <EnsureToaster />
    </Shots>
  );
}

type SummaryMode = 'vazio' | 'parcial' | 'completo' | 'motivo';

function ResumoCampanha() {
  const phone = useMedia('(max-width: 640px)');
  const [mode, setMode] = useState<SummaryMode>('completo');
  const [budget, setBudget] = useState<number | null>(18000);
  const base: Draft =
    mode === 'vazio'
      ? EMPTY_DRAFT
      : mode === 'parcial'
        ? { ...FULL_DRAFT, budget: null, channels: {}, audiences: {} }
        : FULL_DRAFT;
  const draft = { ...base, budget: mode === 'vazio' || mode === 'parcial' ? null : budget };
  const known = mode === 'vazio' ? -1 : mode === 'parcial' ? 1 : 5;
  const f = summaryFacts({ ...FULL_DRAFT, budget });
  return (
    <Shots>
      <Shot
        title="Em contexto"
        tone="white"
        align="stretch"
        pad="none"
        aside={
          <Segmented
            label="Estado do resumo"
            size="sm"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'vazio', label: 'Vazio' },
              { value: 'parcial', label: 'Parcial' },
              { value: 'completo', label: 'Completo' },
              { value: 'motivo', label: phone ? 'Motivo' : 'Com motivo' },
            ]}
          />
        }
      >
        <div className={w.slice}>
          <div className={w.sliceMain}>
            <Section title="Precificação">
              <BudgetBlock
                budget={mode === 'vazio' || mode === 'parcial' ? null : budget}
                onChange={(value) => {
                  setBudget(value);
                  if (mode === 'vazio' || mode === 'parcial') setMode('completo');
                }}
              />
              <Group label="Bônus" meta={`${BONUSES.filter((bonus) => (draft.budget ?? 0) >= bonus.min).length} de ${BONUSES.length} liberados`}>
                <BonusCards budget={draft.budget ?? 0} />
              </Group>
            </Section>
          </div>
          <aside className={w.sliceAside} aria-label="Resumo da campanha">
            <CampaignSummary draft={draft} step={2} known={known} reason={mode === 'motivo' ? REASON : undefined} />
          </aside>
        </div>
      </Shot>
      <Shot title="Celular" align="center" pad="lg">
        <div className={w.phones}>
          <State label="Recolhido">
            <div className={w.phoneSummary}>
              <Disclosure summary={`Resumo · ${f.amount ?? 'sem verba'} · ${f.periodText ?? 'sem período'}`} variant="bar">
                <div className={w.disclosureBody}>
                  <CampaignSummary draft={{ ...FULL_DRAFT, budget }} step={2} />
                </div>
              </Disclosure>
            </div>
          </State>
          <State label="Aberto">
            <div className={w.phoneSummary}>
              <Disclosure summary={`Resumo · ${f.amount ?? 'sem verba'} · ${f.periodText ?? 'sem período'}`} variant="bar" defaultOpen>
                <div className={w.disclosureBody}>
                  <CampaignSummary draft={{ ...FULL_DRAFT, budget }} step={2} />
                </div>
              </Disclosure>
            </div>
          </State>
        </div>
      </Shot>
      <Shot title="Registro" align="center" pad="lg">
        <div className={w.records}>
          <State label="Enviada">
            <div className={w.successFrame}>
              <CreatedSuccess run={{ kind: 'submit', name: 'Coleção Primavera-Verão 2027', facts: ['R$ 18.000,00', '05/10 – 31/10', 'Aurora Calçados'] }} />
            </div>
          </State>
          <State label="Rascunho">
            <div className={w.successFrame}>
              <CreatedSuccess run={{ kind: 'draft', name: 'Coleção Primavera-Verão 2027', facts: ['R$ 18.000,00', '05/10 – 31/10', 'Aurora Calçados'] }} />
            </div>
          </State>
        </div>
      </Shot>
      <EnsureToaster />
    </Shots>
  );
}

export const specimens: Record<string, ComponentType> = {
  wizard: Wizard,
  'resumo-campanha': ResumoCampanha,
};
