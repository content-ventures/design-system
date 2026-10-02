'use client';

import {
  BarChart3,
  Check,
  CircleAlert,
  Download,
  FileSignature,
  LayoutList,
  Megaphone,
  Pause,
  Pencil,
  Plus,
  RotateCw,
  Rows3,
  Trash2,
  Users,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type ReactNode,
} from 'react';
import {
  Avatar,
  Badge,
  BrandMark,
  Button,
  Checkbox,
  Chip,
  Count,
  DateRangePicker,
  Dialog,
  Field,
  IconButton,
  IconTile,
  SearchField,
  Segmented,
  Switch,
  Tabs,
  Tooltip,
  VisuallyHidden,
  type Tone,
} from '@mediaon/design-system/v3';
import { Sidebar } from '@mediaon/design-system/v3/app-shell';
import {
  ActiveFilters,
  FilterBand,
  FilterBar,
  FilterField,
  type ActiveFilter,
} from '@mediaon/design-system/v3/filter-bar';
import { LinkButton } from '@mediaon/design-system/v3/link';
import { List, ListGroup, ListItem, ListItemSkeleton } from '@mediaon/design-system/v3/list-item';
import { Metric, MetricStrip, type MetricProps } from '@mediaon/design-system/v3/metric-strip';
import { Pagination } from '@mediaon/design-system/v3/pagination';
import { RowActions } from '@mediaon/design-system/v3/row-actions';
import { Select } from '@mediaon/design-system/v3/select';
import {
  BulkBar,
  ColumnsMenu,
  DataTable,
  SelectAllBand,
  type Column,
  type SortState,
} from '@mediaon/design-system/v3/table';
import { TagInput } from '@mediaon/design-system/v3/tag-input';
import { Timeline, type TimelineEntry } from '@mediaon/design-system/v3/timeline';
import { toast, Toaster } from '@mediaon/design-system/v3/toast';
import { Col, Row, Shot, Shots, State, States } from '../stage';
import x from './dados.module.css';

/* ——————————————————————————— Dados fictícios ——————————————————————————— */

type StatusKey =
  | 'draft'
  | 'submitted'
  | 'adjustments_requested'
  | 'awaiting_pi_signature'
  | 'approved'
  | 'pi_rejected'
  | 'active'
  | 'paused'
  | 'completed'
  | 'rejected'
  | 'cancelled';

/** O mesmo mapa de status do /dashboardv3 (rótulo, tom e pulso). */
const STATUS: Record<StatusKey, { label: string; tone: Tone; live?: boolean }> = {
  draft: { label: 'Rascunho', tone: 'gray' },
  submitted: { label: 'Aguardando aprovação', tone: 'violet' },
  adjustments_requested: { label: 'Ajustes solicitados', tone: 'orange' },
  awaiting_pi_signature: { label: 'Aguardando assinatura do P.I.', tone: 'amber' },
  approved: { label: 'Aprovada', tone: 'teal' },
  active: { label: 'Veiculando', tone: 'green', live: true },
  paused: { label: 'Pausada', tone: 'gray' },
  completed: { label: 'Concluída', tone: 'gray' },
  rejected: { label: 'Rejeitada', tone: 'red' },
  cancelled: { label: 'Cancelada', tone: 'red' },
  pi_rejected: { label: 'P.I. rejeitado', tone: 'red' },
};
const STATUS_ORDER = Object.keys(STATUS) as StatusKey[];

const BUCKETS: { value: string; label: string; statuses?: StatusKey[] }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'veiculacao', label: 'Em veiculação', statuses: ['approved', 'active', 'paused'] },
  {
    value: 'aprovacao',
    label: 'Em aprovação',
    statuses: ['submitted', 'adjustments_requested', 'awaiting_pi_signature'],
  },
  { value: 'rascunhos', label: 'Rascunhos', statuses: ['draft'] },
  {
    value: 'encerradas',
    label: 'Encerradas',
    statuses: ['completed', 'rejected', 'cancelled', 'pi_rejected'],
  },
];
const EDITABLE: StatusKey[] = ['draft', 'adjustments_requested'];

type Campaign = {
  id: string;
  name: string;
  asset: string;
  advertiser: string;
  status: StatusKey;
  budget?: number;
  links: number;
  start?: string;
  end?: string;
};

const CAMPAIGNS: Campaign[] = [
  {
    id: '2041',
    name: 'Coleção Primavera-Verão no portal',
    asset: 'Banner Super Topo — Portal',
    advertiser: 'Aurora Calçados',
    status: 'active',
    budget: 18000,
    links: 10,
    start: '2026-10-01',
    end: '2026-10-31',
  },
  {
    id: '2038',
    name: 'Newsletter dos expositores',
    asset: 'E-mail marketing dedicado',
    advertiser: 'Estúdio Norte',
    status: 'active',
    budget: 8000,
    links: 8,
    start: '2026-10-05',
    end: '2026-10-25',
  },
  {
    id: '2035',
    name: 'Convite para o estande B-214',
    asset: 'Push no app da feira',
    advertiser: 'Casa Forma',
    status: 'awaiting_pi_signature',
    budget: 3600,
    links: 5,
    start: '2026-10-14',
    end: '2026-10-17',
  },
  {
    id: '2032',
    name: 'Destaque couro vegetal',
    asset: 'Banner Super Topo — Portal',
    advertiser: 'Lume Acessórios',
    status: 'submitted',
    budget: 9000,
    links: 10,
    start: '2026-10-10',
    end: '2026-10-30',
  },
  {
    id: '2029',
    name: 'Retargeting de credenciados',
    asset: 'Banner Super Topo — Portal',
    advertiser: 'Grupo Horizonte',
    status: 'adjustments_requested',
    budget: 13500,
    links: 10,
    start: '2026-10-01',
    end: '2026-10-31',
  },
  {
    id: '2026',
    name: 'Vitrine de lançamentos Aurora',
    asset: 'Banner Super Topo — Portal',
    advertiser: 'Aurora Calçados',
    status: 'adjustments_requested',
    budget: 11230,
    links: 10,
    start: '2026-10-12',
    end: '2026-10-30',
  },
  {
    id: '2023',
    name: 'Rodada de negócios — segunda edição',
    asset: 'Rodada de negócios — lista qualificada',
    advertiser: 'Ateliê Sul',
    status: 'paused',
    budget: 3600,
    links: 6,
    start: '2026-09-25',
    end: '2026-10-17',
  },
  {
    id: '2020',
    name: 'Guia oficial do visitante',
    asset: 'E-mail marketing dedicado',
    advertiser: 'Pátio Couro',
    status: 'completed',
    budget: 12000,
    links: 8,
    start: '2026-09-15',
    end: '2026-09-30',
  },
  {
    id: '2017',
    name: 'Painel de LED — lançamento',
    asset: 'Painel de LED — Pavilhão Azul',
    advertiser: 'Bella Passo',
    status: 'approved',
    budget: 18000,
    links: 4,
    start: '2026-10-14',
    end: '2026-10-17',
  },
  {
    id: '2014',
    name: 'Carrossel de tendências',
    asset: 'Post patrocinado no Instagram oficial',
    advertiser: 'Aurora Calçados',
    status: 'draft',
    budget: 6500,
    links: 6,
    start: '2026-10-05',
    end: '2026-10-12',
  },
  {
    id: '2011',
    name: 'Destaque na vitrine — Bloom',
    asset: 'Destaque na vitrine',
    advertiser: 'Aurora Calçados',
    status: 'active',
    budget: 4500,
    links: 3,
    start: '2026-10-01',
    end: '2026-10-15',
  },
  {
    id: '2008',
    name: 'Push de abertura dos portões',
    asset: 'Push no app da feira',
    advertiser: 'Grupo Horizonte',
    status: 'completed',
    budget: 2400,
    links: 2,
    start: '2026-09-20',
    end: '2026-09-21',
  },
  {
    id: '2005',
    name: 'E-mail de pré-credenciamento',
    asset: 'E-mail marketing dedicado',
    advertiser: 'Bella Passo',
    status: 'rejected',
    budget: 8000,
    links: 4,
    start: '2026-09-01',
    end: '2026-09-10',
  },
  {
    id: '2002',
    name: 'Banner lateral — coleção inverno',
    asset: 'Banner lateral — Portal',
    advertiser: 'Lume Acessórios',
    status: 'cancelled',
    budget: 5400,
    links: 5,
    start: '2026-09-10',
    end: '2026-09-30',
  },
  {
    id: '1995',
    name: 'Lançamento da coleção Bloom',
    asset: 'Banner Super Topo — Portal',
    advertiser: 'Aurora Calçados',
    status: 'active',
    budget: 9900,
    links: 7,
    start: '2026-10-03',
    end: '2026-10-24',
  },
  {
    id: '1991',
    name: 'Rodada com compradores',
    asset: 'Rodada de negócios — lista qualificada',
    advertiser: 'Casa Forma',
    status: 'submitted',
    budget: 7200,
    links: 5,
    start: '2026-10-06',
    end: '2026-10-27',
  },
  {
    id: '1987',
    name: 'Newsletter de pós-feira',
    asset: 'E-mail marketing dedicado',
    advertiser: 'Estúdio Norte',
    status: 'draft',
    links: 0,
  },
];
const ADVERTISERS = [...new Set(CAMPAIGNS.map((row) => row.advertiser))].sort((a, b) =>
  a.localeCompare(b, 'pt-BR'),
);

const money = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
const short = (iso?: string) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '');
const periodOf = (row: Campaign) =>
  row.start ? `${short(row.start)} – ${short(row.end)}` : undefined;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const int = (value: number) => value.toLocaleString('pt-BR');

function sortRows(rows: Campaign[], sort: SortState) {
  const dir = sort.direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (sort.key === 'budget') return ((a.budget ?? 0) - (b.budget ?? 0)) * dir;
    if (sort.key === 'name') return a.name.localeCompare(b.name, 'pt-BR') * dir;
    if (sort.key === 'period') return (a.start ?? '').localeCompare(b.start ?? '') * dir;
    return a.id.localeCompare(b.id) * dir;
  });
}

/** Largura do elemento, para esconder colunas em painéis estreitos. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Janela de celular (≤ 640): as pranchas “Celular” repetiriam o “Em contexto”, que já é o celular. */
function usePhoneViewport() {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia('(max-width: 640px)');
      query.addEventListener('change', notify);
      return () => query.removeEventListener('change', notify);
    },
    () => window.matchMedia('(max-width: 640px)').matches,
    () => false,
  );
}

/** Rolagem lateral: marca o lado que ainda tem conteúdo (`data-fade-start` / `data-fade-end`). */
function useScrollEdges<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const overflow = el.scrollWidth > el.clientWidth + 1;
      el.dataset.fadeStart = String(overflow && el.scrollLeft > 1);
      el.dataset.fadeEnd = String(overflow && el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, []);
  return ref;
}

/* ——————————————————————————— Células ——————————————————————————— */

function NameCell({ row }: { row: Campaign }) {
  return (
    <span className={x.nameCell}>
      <span className={x.name} title={`${row.name} · #${row.id}`}>
        {row.name}
      </span>
      <span className={x.sub}>
        <span className={x.subAsset} title={row.asset}>
          {row.asset}
        </span>
        <span>#{row.id}</span>
      </span>
    </span>
  );
}
function AdvertiserCell({ name }: { name: string }) {
  return (
    <span className={x.advertiser} title={name}>
      <BrandMark name={name} size="xs" variant="soft" decorative />
      <span>{name}</span>
    </span>
  );
}
function StatusCell({
  status,
  size,
  wrap = size !== 'sm',
}: {
  status: StatusKey;
  size?: 'sm' | 'md';
  wrap?: boolean;
}) {
  const item = STATUS[status];
  return (
    <Badge variant="text" size={size} tone={item.tone} live={item.live} wrap={wrap}>
      {item.label}
    </Badge>
  );
}
function DeliverySwitch({
  row,
  onChange,
}: {
  row: Campaign;
  onChange: (status: StatusKey) => void;
}) {
  const can = row.status === 'active' || row.status === 'paused' || row.status === 'approved';
  const on = row.status === 'active';
  const help = can
    ? on
      ? 'Pausar a veiculação'
      : row.status === 'approved'
        ? 'Iniciar a veiculação'
        : 'Retomar a veiculação'
    : `${STATUS[row.status].label}: veiculação indisponível`;
  return (
    <span className={x.switchCell} onClick={(event) => event.stopPropagation()}>
      <Tooltip content={help}>
        <span className={x.switchHit}>
          <Switch
            size="sm"
            hideLabel
            label={`Veiculação de ${row.name}`}
            checked={on}
            disabled={!can}
            onCheckedChange={(checked) => onChange(checked ? 'active' : 'paused')}
          />
        </span>
      </Tooltip>
    </span>
  );
}
function rowActions(row: Campaign) {
  const live = row.status === 'active';
  return (
    <RowActions
      label={`Ações de ${row.name}`}
      actions={[
        { id: 'analytics', label: 'Analytics', icon: BarChart3, onSelect: () => undefined },
        {
          id: 'edit',
          label: 'Editar',
          icon: Pencil,
          hidden: !EDITABLE.includes(row.status),
          onSelect: () => undefined,
        },
        {
          id: 'delete',
          label: 'Excluir',
          icon: Trash2,
          danger: true,
          disabled: live,
          hint: live ? 'Campanhas no ar não podem ser excluídas' : undefined,
          onSelect: () => undefined,
        },
      ]}
    />
  );
}

const nameColumn: Column<Campaign> = {
  key: 'name',
  header: 'Campanha',
  sortable: true,
  name: 'Campanha',
  pinned: true,
  skeleton: 'lines',
  render: (row) => <NameCell row={row} />,
};
const advertiserColumn: Column<Campaign> = {
  key: 'advertiser',
  header: 'Anunciante',
  width: '17%',
  render: (row) => <AdvertiserCell name={row.advertiser} />,
};
const statusColumn: Column<Campaign> = {
  key: 'status',
  header: 'Status',
  width: 168,
  render: (row) => <StatusCell status={row.status} />,
};
const budgetColumn: Column<Campaign> = {
  key: 'budget',
  header: 'Verba',
  width: 128,
  numeric: true,
  sortable: true,
  fallback: '—',
  render: (row) => (row.budget ? money(row.budget) : null),
};
const linksColumn: Column<Campaign> = {
  key: 'links',
  header: 'Vínculos',
  width: 84,
  align: 'end',
  fallback: '—',
  skeleton: 'short',
  render: (row) => (row.links ? <span className={x.tabular}>{row.links}</span> : null),
};
const periodColumn: Column<Campaign> = {
  key: 'period',
  header: 'Período',
  width: 120,
  sortable: true,
  fallback: '—',
  render: (row) => (row.start ? <span className={x.period}>{periodOf(row)}</span> : null),
};

/** Celular: cada campanha vira uma linha de cartão (seleção, chave, nome, duas linhas de meta, ⋯). */
function CampaignCards({
  rows,
  selected,
  onToggle,
  onStatus,
}: {
  rows: Campaign[];
  selected: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onStatus: (id: string, status: StatusKey) => void;
}) {
  return (
    <ul className={x.cards} aria-label="Campanhas">
      {rows.map((row) => {
        const isSelected = selected.has(row.id);
        return (
          <li key={row.id} className={x.card} data-selected={isSelected || undefined}>
            <span className={x.cardCheck}>
              <Checkbox
                aria-label={`Selecionar ${row.name}`}
                checked={isSelected}
                onChange={() => onToggle(row.id)}
              />
            </span>
            <DeliverySwitch row={row} onChange={(status) => onStatus(row.id, status)} />
            <span className={x.cardMain}>
              <span className={x.cardName}>{row.name}</span>
              <span className={x.cardMeta}>
                <span className={x.cardStatus}>
                  <StatusCell status={row.status} size="sm" />
                </span>
                <span className={x.cardMore}>{row.advertiser}</span>
              </span>
              <span className={x.cardMeta}>
                <span>{row.budget ? money(row.budget) : '—'}</span>
                {row.start && <span>{periodOf(row)}</span>}
              </span>
            </span>
            <span className={x.cardMenu}>
              <RowActions
                compact
                label={`Ações de ${row.name}`}
                overflowLabel={`Ações de ${row.name}`}
                actions={[
                  {
                    id: 'analytics',
                    label: 'Analytics',
                    icon: BarChart3,
                    onSelect: () => undefined,
                  },
                  {
                    id: 'edit',
                    label: 'Editar',
                    icon: Pencil,
                    hidden: !EDITABLE.includes(row.status),
                    onSelect: () => undefined,
                  },
                  {
                    id: 'delete',
                    label: 'Excluir',
                    icon: Trash2,
                    danger: true,
                    disabled: row.status === 'active',
                    hint:
                      row.status === 'active'
                        ? 'Campanhas no ar não podem ser excluídas'
                        : undefined,
                    onSelect: () => undefined,
                  },
                ]}
              />
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Panel({
  title,
  sub,
  aside,
  children,
}: {
  title: string;
  sub?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={x.panel}>
      <header className={x.panelHead}>
        <div className={x.panelTitle}>
          <h4>{title}</h4>
          {sub && <p>{sub}</p>}
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}

function Phone({ children }: { children: ReactNode }) {
  return <div className={x.phone}>{children}</div>;
}

const toggleIn = (set: Set<string>, id: string) => {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
};

/* ——————————————————————————— Tabela ——————————————————————————— */

type AudienceRow = {
  id: string;
  name: string;
  impressions: number;
  clicks: number;
  leads: number;
  freq: string;
};
const AUDIENCES: AudienceRow[] = [
  {
    id: 'visitantes',
    name: 'Visitantes credenciados',
    impressions: 41204,
    clicks: 812,
    leads: 15,
    freq: '1,02×',
  },
  {
    id: 'lojistas',
    name: 'Lojistas e compradores',
    impressions: 38861,
    clicks: 1074,
    leads: 43,
    freq: '2,24×',
  },
  {
    id: 'expositores',
    name: 'Expositores',
    impressions: 17263,
    clicks: 410,
    leads: 13,
    freq: '1,61×',
  },
];
const ctr = (clicks: number, impressions: number) =>
  `${((clicks / impressions) * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

type Lead = {
  id: string;
  company: string;
  city: string;
  segment: string;
  audience: string;
  channel: string;
  at: string;
};
const LEADS: Lead[] = [
  {
    id: 'l1',
    company: 'Sapataria Ladeira',
    city: 'Salvador, BA',
    segment: 'Loja de calçados',
    audience: 'Visitantes credenciados',
    channel: 'Portal da feira',
    at: '22/10 · 16:25',
  },
  {
    id: 'l2',
    company: 'Trilha Norte Outdoor',
    city: 'Florianópolis, SC',
    segment: 'Esportivo',
    audience: 'Lojistas e compradores',
    channel: 'Portal da feira',
    at: '22/10 · 15:48',
  },
  {
    id: 'l3',
    company: 'Calçados Vila Rica',
    city: 'Novo Hamburgo, RS',
    segment: 'Loja de calçados',
    audience: 'Visitantes credenciados',
    channel: 'Portal da feira',
    at: '22/10 · 15:39',
  },
  {
    id: 'l4',
    company: 'Pequenos Passos Kids',
    city: 'Curitiba, PR',
    segment: 'Calçado infantil',
    audience: 'Lojistas e compradores',
    channel: 'App Francal',
    at: '22/10 · 14:59',
  },
  {
    id: 'l5',
    company: 'Bottega Jardins',
    city: 'São Paulo, SP',
    segment: 'Multimarcas',
    audience: 'Visitantes credenciados',
    channel: 'App Francal',
    at: '22/10 · 13:39',
  },
  {
    id: 'l6',
    company: 'Vila Pantanal Couros',
    city: 'Campo Grande, MS',
    segment: 'Couro',
    audience: 'Lojistas e compradores',
    channel: 'Portal da feira',
    at: '22/10 · 10:21',
  },
];

function AudienceTable() {
  const [ref, width] = useWidth<HTMLDivElement>();
  const narrow = width > 0 && width < 560;
  const totals = AUDIENCES.reduce(
    (sum, row) => ({
      impressions: sum.impressions + row.impressions,
      clicks: sum.clicks + row.clicks,
      leads: sum.leads + row.leads,
    }),
    { impressions: 0, clicks: 0, leads: 0 },
  );
  return (
    <div ref={ref}>
      <DataTable
        variant="plain"
        density="compact"
        label="Por público"
        rows={AUDIENCES}
        rowKey={(row) => row.id}
        hiddenColumns={narrow ? ['ctr', 'freq'] : []}
        columns={[
          {
            key: 'name',
            header: 'Público',
            render: (row) => <span className={x.strong}>{row.name}</span>,
          },
          {
            key: 'impressions',
            header: 'Impressões',
            numeric: true,
            render: (row) => int(row.impressions),
          },
          { key: 'clicks', header: 'Cliques', numeric: true, render: (row) => int(row.clicks) },
          {
            key: 'ctr',
            header: 'CTR',
            numeric: true,
            render: (row) => ctr(row.clicks, row.impressions),
          },
          { key: 'leads', header: 'Leads', numeric: true, render: (row) => int(row.leads) },
          {
            key: 'freq',
            header: 'Frequência',
            hint: 'Impressões por pessoa do público',
            numeric: true,
            render: (row) => row.freq,
          },
        ]}
        totalRow={{
          name: 'Total',
          impressions: int(totals.impressions),
          clicks: int(totals.clicks),
          ctr: ctr(totals.clicks, totals.impressions),
          leads: int(totals.leads),
          freq: '1,39×',
        }}
      />
    </div>
  );
}

function LeadsTable() {
  const [ref, width] = useWidth<HTMLDivElement>();
  const hidden =
    width > 0 && width < 560
      ? ['segment', 'audience', 'channel']
      : width > 0 && width < 760
        ? ['audience']
        : [];
  return (
    <div ref={ref}>
      <DataTable
        variant="plain"
        density="compact"
        label="Leads recentes"
        rows={LEADS}
        rowKey={(row) => row.id}
        hiddenColumns={hidden}
        columns={[
          {
            key: 'company',
            header: 'Empresa',
            render: (row) => (
              <span className={x.twoLine}>
                <span className={x.strong}>{row.company}</span>
                <span className={x.caption}>{row.city}</span>
              </span>
            ),
          },
          { key: 'segment', header: 'Segmento', render: (row) => row.segment },
          { key: 'audience', header: 'Público', render: (row) => row.audience },
          { key: 'channel', header: 'Canal', render: (row) => row.channel },
          {
            key: 'at',
            header: 'Recebido',
            align: 'end',
            render: (row) => <span className={x.when}>{row.at}</span>,
          },
        ]}
      />
    </div>
  );
}

/** Painel estreito (celular): a tabela fica com Campanha e Status, meio a meio. */
const fitNarrow = (columns: Column<Campaign>[], narrow: boolean) =>
  narrow
    ? columns.map((column) => (column.key === 'status' ? { ...column, width: '46%' } : column))
    : columns;

const NARROW_HIDDEN = ['advertiser', 'budget', 'period'];

const pick = (...ids: string[]) =>
  ids
    .map((id) => CAMPAIGNS.find((row) => row.id === id))
    .filter((row): row is Campaign => Boolean(row));

function Tabela() {
  const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable');
  const [ref, width] = useWidth<HTMLDivElement>();
  const narrow = width > 0 && width < 640;
  const impressions: Record<string, number | undefined> = { '2041': 271400, '2023': 98210 };
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="md">
        <div className={x.stack} ref={ref}>
          <Panel title="Por público" sub="Impressões no período">
            <AudienceTable />
          </Panel>
          <Panel title="Leads recentes" sub="214 leads desde 01/10">
            <LeadsTable />
          </Panel>
        </div>
      </Shot>

      <Shot
        title="Densidade"
        align="stretch"
        pad="sm"
        aside={
          <Segmented
            size="sm"
            label="Densidade"
            value={density}
            onChange={setDensity}
            options={[
              { value: 'compact', label: 'Compacta' },
              { value: 'comfortable', label: 'Confortável' },
            ]}
          />
        }
      >
        <DataTable
          label="Campanhas"
          density={density}
          fixed={!narrow}
          hiddenColumns={narrow ? NARROW_HIDDEN : undefined}
          rows={CAMPAIGNS.slice(0, 5)}
          rowKey={(row) => row.id}
          columns={fitNarrow(
            [nameColumn, advertiserColumn, statusColumn, budgetColumn, periodColumn],
            narrow,
          )}
        />
      </Shot>

      <Shot title="Alinhamento" align="stretch" pad="md">
        <div className={x.alignTable}>
          <DataTable
            label="Alinhamento das colunas"
            density="compact"
            hiddenColumns={narrow ? ['status', 'impressions', 'links', 'actions'] : undefined}
            rows={pick('2041', '2023', '2035', '1987')}
            rowKey={(row) => row.id}
            columns={[
              {
                key: 'name',
                header: 'Campanha',
                truncate: !narrow,
                title: (row) => row.name,
                render: (row) => <span className={x.strong}>{row.name}</span>,
              },
              {
                ...statusColumn,
                width: 224,
                render: (row) => <StatusCell status={row.status} wrap={false} />,
              },
              {
                key: 'impressions',
                header: 'Impressões',
                numeric: true,
                width: 112,
                fallback: '—',
                render: (row) => {
                  const value = impressions[row.id];
                  return value ? int(value) : null;
                },
              },
              budgetColumn,
              { ...linksColumn, numeric: true },
              {
                key: 'actions',
                header: <VisuallyHidden>Ações</VisuallyHidden>,
                align: 'end',
                width: 116,
                render: (row) => rowActions(row),
              },
            ]}
          />
        </div>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Tabela de dados ——————————————————————————— */

function useCampaignState(initial = CAMPAIGNS) {
  const [rows, setRows] = useState(initial);
  const setStatus = useCallback((id: string, status: StatusKey) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status } : row)));
  }, []);
  return [rows, setRows, setStatus] as const;
}

function CampaignTable({
  rows,
  selected,
  onSelectedChange,
  sort,
  onSort,
  hidden,
  onStatus,
  footer,
  loading,
  error,
  empty,
  transitionKey,
  narrow = false,
}: {
  rows: Campaign[];
  selected?: ReadonlySet<string>;
  onSelectedChange?: (next: Set<string>) => void;
  sort?: SortState;
  onSort?: (next: SortState) => void;
  hidden?: ReadonlySet<string>;
  onStatus: (id: string, status: StatusKey) => void;
  footer?: ReactNode;
  loading?: boolean;
  error?: ReactNode;
  empty?: ReactNode;
  transitionKey?: string;
  /** Painel estreito: Campanha e Status, sem largura fixa. */
  narrow?: boolean;
}) {
  const columns: Column<Campaign>[] = [
    {
      key: 'delivery',
      header: <VisuallyHidden>Veiculação</VisuallyHidden>,
      name: 'Veiculação',
      width: 56,
      skeleton: 'control',
      render: (row) => <DeliverySwitch row={row} onChange={(status) => onStatus(row.id, status)} />,
    },
    nameColumn,
    advertiserColumn,
    statusColumn,
    budgetColumn,
    linksColumn,
    periodColumn,
    {
      key: 'actions',
      header: <VisuallyHidden>Ações</VisuallyHidden>,
      name: 'Ações',
      pinned: true,
      align: 'end',
      width: 116,
      skeleton: 'none',
      render: (row) => rowActions(row),
    },
  ];
  return (
    <DataTable
      label="Campanhas do portal"
      density="compact"
      fixed={!narrow}
      selectable
      rows={rows}
      rowKey={(row) => row.id}
      rowLabel={(row) => row.name}
      columns={
        narrow
          ? columns.map((column) =>
              column.key === 'status'
                ? {
                    ...column,
                    width: '36%',
                    render: (row: Campaign) => <StatusCell status={row.status} size="sm" wrap />,
                  }
                : column,
            )
          : columns
      }
      selected={selected}
      onSelectedChange={onSelectedChange}
      sort={sort}
      onSort={onSort}
      hiddenColumns={
        narrow
          ? new Set([...(hidden ?? []), ...NARROW_HIDDEN, 'delivery', 'links', 'actions'])
          : hidden
      }
      footer={footer}
      loading={loading}
      error={error}
      empty={empty}
      transitionKey={transitionKey}
    />
  );
}

const COLUMN_CHOICES: Column<Campaign>[] = [
  { key: 'delivery', header: 'Veiculação', render: () => null },
  advertiserColumn,
  statusColumn,
  budgetColumn,
  linksColumn,
  periodColumn,
];

const STATE_HIDDEN: ReadonlySet<string> = new Set(['links']);

function StateBox({
  title,
  error = false,
  children,
}: {
  title: string;
  /** Falha: o mesmo marcador único de erro dos gráficos (CircleAlert em vermelho). */
  error?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={x.stateBox}>
      {error && <IconTile icon={CircleAlert} tone="red" variant="soft" />}
      <strong>{title}</strong>
      {children}
    </div>
  );
}

function TabelaDados() {
  const [rows, , setStatus] = useCampaignState();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortState>({ key: 'created', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hidden, setHidden] = useState<Set<string>>(new Set(['links']));
  const [mode, setMode] = useState<'data' | 'loading' | 'empty' | 'none' | 'error'>('data');
  const [stateSelected, setStateSelected] = useState<Set<string>>(new Set());
  const [stateRef, stateWidth] = useWidth<HTMLDivElement>();
  const modeBarRef = useScrollEdges<HTMLDivElement>();
  const [phoneSelected, setPhoneSelected] = useState<Set<string>>(new Set(['2035']));
  const [phoneRows, , setPhoneStatus] = useCampaignState(CAMPAIGNS.slice(0, 6));
  const phoneViewport = usePhoneViewport();
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const term = query.trim().replace(/^#/, '').toLowerCase();
    const list = term
      ? rows.filter((row) => `${row.name} ${row.advertiser} ${row.id}`.toLowerCase().includes(term))
      : rows;
    return sortRows(list, sort);
  }, [rows, query, sort]);
  const onPageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };
  const last = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, last);
  const pageRows = filtered.slice((current - 1) * pageSize, current * pageSize);
  const selectedLive = rows.filter((row) => selected.has(row.id) && row.status === 'active').length;

  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="sm">
        <div className={x.listing}>
          <div className={x.toolbar}>
            <div className={x.toolbarSearch}>
              <SearchField
                size="sm"
                value={query}
                onValueChange={(value) => {
                  setQuery(value);
                  setPage(1);
                }}
                placeholder="Campanha, anunciante ou nº"
                label="Buscar campanhas"
              />
            </div>
            <ColumnsMenu columns={COLUMN_CHOICES} hidden={hidden} onHiddenChange={setHidden} />
          </div>
          <div className={x.desktopOnly}>
            <CampaignTable
              rows={pageRows}
              selected={selected}
              onSelectedChange={setSelected}
              sort={sort}
              onSort={setSort}
              hidden={hidden}
              onStatus={setStatus}
              transitionKey={`${query}:${current}`}
              empty={
                <StateBox title={`Nada encontrado para “${query.trim()}”`}>
                  <Button size="sm" onClick={() => setQuery('')}>
                    Limpar busca
                  </Button>
                </StateBox>
              }
              footer={
                <Pagination
                  page={current}
                  pageSize={pageSize}
                  onPageSizeChange={onPageSize}
                  total={filtered.length}
                  noun="campanhas"
                  onPageChange={setPage}
                />
              }
            />
          </div>
          <div className={x.phoneOnly}>
            <div className={x.cardsFrame}>
              <CampaignCards
                rows={pageRows}
                selected={selected}
                onStatus={setStatus}
                onToggle={(id) => setSelected((value) => toggleIn(value, id))}
              />
              <Pagination
                page={current}
                pageSize={pageSize}
                onPageSizeChange={onPageSize}
                total={filtered.length}
                noun="campanhas"
                onPageChange={setPage}
              />
            </div>
          </div>
          <BulkBar
            dock
            count={selected.size}
            noun={selected.size === 1 ? 'selecionada' : 'selecionadas'}
            onClear={() => setSelected(new Set())}
            actions={[
              { label: 'Exportar', icon: Download, onSelect: () => undefined },
              {
                label: 'Excluir',
                icon: Trash2,
                danger: true,
                disabled: selectedLive === selected.size,
                hint:
                  selectedLive === selected.size
                    ? 'Campanhas no ar não podem ser excluídas'
                    : undefined,
                onSelect: () => undefined,
              },
            ]}
          />
        </div>
      </Shot>

      <Shot title="Estados" align="stretch" pad="sm">
        <div className={x.fixedHeight} ref={stateRef}>
          <div className={x.modeBar} ref={modeBarRef}>
            <Segmented
              size="sm"
              label="Estado da tabela"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'data', label: 'Dados' },
                { value: 'loading', label: 'Carregando' },
                { value: 'empty', label: 'Vazio' },
                { value: 'none', label: 'Sem resultado' },
                { value: 'error', label: 'Erro' },
              ]}
            />
          </div>
          <CampaignTable
            rows={mode === 'data' || mode === 'loading' ? CAMPAIGNS.slice(0, 5) : []}
            hidden={STATE_HIDDEN}
            narrow={stateWidth > 0 && stateWidth < 640}
            selected={stateSelected}
            onSelectedChange={setStateSelected}
            onStatus={() => undefined}
            loading={mode === 'loading'}
            error={
              mode === 'error' ? (
                <StateBox error title="Não foi possível carregar as campanhas">
                  <Button size="sm" icon={RotateCw} onClick={() => setMode('data')}>
                    Tentar de novo
                  </Button>
                </StateBox>
              ) : undefined
            }
            empty={
              mode === 'none' ? (
                <StateBox title="Nada encontrado para “couro”">
                  <Button size="sm" onClick={() => setMode('data')}>
                    Limpar busca
                  </Button>
                </StateBox>
              ) : (
                <StateBox title="Nenhuma campanha ainda">
                  <Button size="sm" variant="primary" icon={Plus}>
                    Nova campanha
                  </Button>
                </StateBox>
              )
            }
          />
        </div>
      </Shot>

      {!phoneViewport && (
        <Shot title="Celular" align="center" pad="md">
          <Phone>
            <div className={x.cardsFrame}>
              <CampaignCards
                rows={phoneRows}
                selected={phoneSelected}
                onStatus={setPhoneStatus}
                onToggle={(id) => setPhoneSelected((value) => toggleIn(value, id))}
              />
            </div>
          </Phone>
        </Shot>
      )}
    </Shots>
  );
}

/* ——————————————————————————— Barra de filtros ——————————————————————————— */

function overlaps(row: Campaign, from: string, to: string) {
  if (!from && !to) return true;
  if (!row.start || !row.end) return false;
  if (from && row.end < from) return false;
  if (to && row.start > to) return false;
  return true;
}

const statusOptions = [
  { value: '', label: 'Todos os status' },
  ...STATUS_ORDER.map((key) => ({ value: key, label: STATUS[key].label })),
];
const advertiserOptions = [
  { value: '', label: 'Todos os anunciantes' },
  ...ADVERTISERS.map((name) => ({
    value: name,
    label: name,
    leading: <BrandMark name={name} size="xs" variant="soft" decorative />,
  })),
];

function useListingFilters() {
  const [tab, setTab] = useState('todas');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [advertiser, setAdvertiser] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const counts = Object.fromEntries(
    BUCKETS.map((bucket) => [
      bucket.value,
      bucket.statuses
        ? CAMPAIGNS.filter((row) => bucket.statuses?.includes(row.status)).length
        : CAMPAIGNS.length,
    ]),
  );
  const rows = useMemo(() => {
    const bucket = BUCKETS.find((item) => item.value === tab)?.statuses;
    const term = query.trim().replace(/^#/, '').toLowerCase();
    return CAMPAIGNS.filter(
      (row) =>
        (!bucket || bucket.includes(row.status)) &&
        (!status || row.status === status) &&
        (!advertiser || row.advertiser === advertiser) &&
        overlaps(row, from, to) &&
        (!term || `${row.name} ${row.advertiser} ${row.id}`.toLowerCase().includes(term)),
    );
  }, [tab, query, status, advertiser, from, to]);
  const count = [status, advertiser, from || to].filter(Boolean).length;
  const clear = () => {
    setStatus('');
    setAdvertiser('');
    setFrom('');
    setTo('');
  };
  return {
    tab,
    setTab,
    query,
    setQuery,
    status,
    setStatus,
    advertiser,
    setAdvertiser,
    from,
    to,
    setFrom,
    setTo,
    counts,
    rows,
    count,
    clear,
  };
}

function ViewAndExport() {
  const [view, setView] = useState<'grupos' | 'lista'>('lista');
  return (
    <>
      <Segmented
        size="sm"
        label="Modo de exibição"
        value={view}
        onChange={setView}
        options={[
          { value: 'grupos', label: 'Agrupada por status', icon: Rows3, iconOnly: true },
          { value: 'lista', label: 'Lista', icon: LayoutList, iconOnly: true },
        ]}
      />
      <Tooltip content="Exportar CSV">
        <IconButton label="Exportar" icon={Download} variant="ghost" size="sm" />
      </Tooltip>
    </>
  );
}

function MiniTable({ rows, transitionKey }: { rows: Campaign[]; transitionKey?: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const narrow = width > 0 && width < 640;
  return (
    <div ref={ref}>
      <DataTable
        label="Campanhas"
        density="compact"
        fixed={!narrow}
        hiddenColumns={narrow ? NARROW_HIDDEN : undefined}
        rows={rows.slice(0, 6)}
        rowKey={(row) => row.id}
        transitionKey={transitionKey}
        empty={<StateBox title="Nenhuma campanha atende aos filtros" />}
        columns={fitNarrow(
          [nameColumn, advertiserColumn, statusColumn, budgetColumn, periodColumn],
          narrow,
        )}
      />
    </div>
  );
}

function BandFields({
  status,
  setStatus,
  advertiser,
  setAdvertiser,
  from,
  to,
  onPeriod,
}: {
  status: string;
  setStatus: (value: string) => void;
  advertiser: string;
  setAdvertiser: (value: string) => void;
  from: string;
  to: string;
  onPeriod: (from: string, to: string) => void;
}) {
  return (
    <>
      <FilterField>
        <Select
          size="sm"
          label="Status"
          value={status}
          onChange={setStatus}
          placeholder="Todos os status"
          options={statusOptions}
        />
      </FilterField>
      <FilterField>
        <Select
          size="sm"
          label="Anunciante"
          value={advertiser}
          onChange={setAdvertiser}
          placeholder="Todos os anunciantes"
          searchable
          options={advertiserOptions}
        />
      </FilterField>
      <FilterField wide>
        <DateRangePicker
          size="sm"
          aria-label="Período"
          placeholder="Qualquer período"
          clearable
          duration={false}
          start={from}
          end={to}
          onChange={(range) => onPeriod(range.start, range.end)}
        />
      </FilterField>
    </>
  );
}

const noop = () => undefined;
const searchStub = (
  <SearchField
    size="sm"
    value=""
    onValueChange={noop}
    placeholder="Campanha, anunciante ou nº"
    label="Buscar campanhas"
  />
);

function BarraFiltros() {
  const f = useListingFilters();
  const [open, setOpen] = useState(true);
  const phone = useListingFilters();
  const [phoneOpen, setPhoneOpen] = useState(true);
  const phoneViewport = usePhoneViewport();
  const tabs = (state: ReturnType<typeof useListingFilters>) => (
    <Tabs
      label="Recortes por status"
      value={state.tab}
      onChange={state.setTab}
      items={BUCKETS.map((bucket) => ({
        value: bucket.value,
        label: bucket.label,
        count: state.counts[bucket.value],
      }))}
    />
  );
  const staticBar = (pressed: boolean, count: number) => (
    <FilterBar
      search={searchStub}
      filtersOpen={pressed}
      onFiltersOpenChange={noop}
      filterCount={count}
      actions={<ViewAndExport />}
    />
  );
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="sm">
        <div className={x.listing}>
          <FilterBar
            tabs={tabs(f)}
            search={
              <SearchField
                size="sm"
                value={f.query}
                onValueChange={f.setQuery}
                placeholder="Campanha, anunciante ou nº"
                label="Buscar campanhas"
              />
            }
            filtersOpen={open}
            onFiltersOpenChange={setOpen}
            filterCount={f.count}
            bandId="dados-band"
            actions={<ViewAndExport />}
          />
          <div className={x.afterBar}>
            <FilterBand id="dados-band" open={open} onClear={f.count ? f.clear : undefined}>
              <BandFields
                status={f.status}
                setStatus={f.setStatus}
                advertiser={f.advertiser}
                setAdvertiser={f.setAdvertiser}
                from={f.from}
                to={f.to}
                onPeriod={(from, to) => {
                  f.setFrom(from);
                  f.setTo(to);
                }}
              />
            </FilterBand>
            <p className={x.summary} aria-live="polite">
              {f.rows.length} de {plural(CAMPAIGNS.length, 'campanha', 'campanhas')}
            </p>
            <MiniTable
              rows={f.rows}
              transitionKey={`${f.tab}:${f.status}:${f.advertiser}:${f.from}:${f.to}:${f.query}`}
            />
          </div>
        </div>
      </Shot>

      <Shot title="Estados" tone="white" align="stretch" pad="md">
        <div className={x.looseStates}>
          <States columns={1}>
            <State label="Fechada">
              <div className={x.barStack}>{staticBar(false, 0)}</div>
            </State>
            <State label="Aberta">
              <div className={x.barStack}>
                {staticBar(true, 0)}
                <FilterBand>
                  <BandFields
                    status=""
                    setStatus={noop}
                    advertiser=""
                    setAdvertiser={noop}
                    from=""
                    to=""
                    onPeriod={noop}
                  />
                </FilterBand>
              </div>
            </State>
            <State label="Com filtros">
              <div className={x.barStack}>
                {staticBar(true, 2)}
                <FilterBand onClear={noop}>
                  <BandFields
                    status="active"
                    setStatus={noop}
                    advertiser="Aurora Calçados"
                    setAdvertiser={noop}
                    from=""
                    to=""
                    onPeriod={noop}
                  />
                </FilterBand>
              </div>
            </State>
            <State label="Muitos">
              <div className={x.narrowBand}>
                <FilterBand onClear={noop}>
                  <BandFields
                    status="active"
                    setStatus={noop}
                    advertiser=""
                    setAdvertiser={noop}
                    from="2026-10-01"
                    to="2026-10-31"
                    onPeriod={noop}
                  />
                  <FilterField>
                    <Select
                      size="sm"
                      label="Canal"
                      value=""
                      onChange={noop}
                      placeholder="Todos os canais"
                      options={[{ value: '', label: 'Todos os canais' }]}
                    />
                  </FilterField>
                  <FilterField>
                    <Select
                      size="sm"
                      label="Público"
                      value=""
                      onChange={noop}
                      placeholder="Todos os públicos"
                      options={[{ value: '', label: 'Todos os públicos' }]}
                    />
                  </FilterField>
                </FilterBand>
              </div>
            </State>
          </States>
        </div>
      </Shot>

      {!phoneViewport && (
        <Shot title="Celular" align="center" pad="md">
          <Phone>
            <FilterBar
              tabs={tabs(phone)}
              search={
                <SearchField
                  size="sm"
                  value={phone.query}
                  onValueChange={phone.setQuery}
                  placeholder="Campanha, anunciante ou nº"
                  label="Buscar campanhas"
                />
              }
              filtersOpen={phoneOpen}
              onFiltersOpenChange={setPhoneOpen}
              filterCount={phone.count}
              actions={<ViewAndExport />}
            />
            <div className={x.afterBar}>
              <FilterBand open={phoneOpen} onClear={phone.count ? phone.clear : undefined}>
                <BandFields
                  status={phone.status}
                  setStatus={phone.setStatus}
                  advertiser={phone.advertiser}
                  setAdvertiser={phone.setAdvertiser}
                  from={phone.from}
                  to={phone.to}
                  onPeriod={(from, to) => {
                    phone.setFrom(from);
                    phone.setTo(to);
                  }}
                />
              </FilterBand>
            </div>
          </Phone>
        </Shot>
      )}
    </Shots>
  );
}

/* ——————————————————————————— Filtros ativos ——————————————————————————— */

const PERIODS = [
  { value: '2026-10-01|2026-10-31', label: '01/10 – 31/10' },
  { value: '2026-09-01|2026-09-30', label: '01/09 – 30/09' },
  { value: '2026-10-14|2026-10-17', label: '14/10 – 17/10' },
];

function Choices({
  options,
  value,
  onChoose,
  label,
}: {
  options: { value: string; label: string; leading?: ReactNode }[];
  value: string;
  onChoose: (value: string) => void;
  label: string;
}) {
  return (
    <div className={x.choices} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          className={x.choice}
          onClick={() => onChoose(option.value)}
        >
          {option.leading}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

function FiltrosAtivos() {
  const [status, setStatus] = useState<StatusKey | ''>('active');
  const [advertiser, setAdvertiser] = useState('Aurora Calçados');
  const [period, setPeriod] = useState('2026-10-01|2026-10-31');
  const [open, setOpen] = useState(false);
  const [from = '', to = ''] = period ? period.split('|') : [];
  const rows = CAMPAIGNS.filter(
    (row) =>
      (!status || row.status === status) &&
      (!advertiser || row.advertiser === advertiser) &&
      overlaps(row, from, to),
  );
  const clearAll = () => {
    setStatus('');
    setAdvertiser('');
    setPeriod('');
  };
  const filters: ActiveFilter[] = [];
  if (status)
    filters.push({
      id: 'status',
      label: 'Status',
      value: STATUS[status].label,
      onRemove: () => setStatus(''),
      edit: (
        <Choices
          label="Status"
          value={status}
          onChoose={(value) => setStatus(value as StatusKey)}
          options={(['active', 'paused', 'approved', 'submitted'] as StatusKey[]).map((key) => ({
            value: key,
            label: STATUS[key].label,
          }))}
        />
      ),
    });
  if (advertiser)
    filters.push({
      id: 'advertiser',
      label: 'Anunciante',
      value: advertiser,
      leading: <BrandMark name={advertiser} size="xs" variant="soft" decorative />,
      onRemove: () => setAdvertiser(''),
      edit: (
        <Choices
          label="Anunciante"
          value={advertiser}
          onChoose={setAdvertiser}
          options={ADVERTISERS.slice(0, 6).map((name) => ({
            value: name,
            label: name,
            leading: <BrandMark name={name} size="xs" variant="soft" decorative />,
          }))}
        />
      ),
    });
  if (period)
    filters.push({
      id: 'period',
      label: 'Período',
      value:
        PERIODS.find((item) => item.value === period)?.label ?? `${short(from)} – ${short(to)}`,
      onRemove: () => setPeriod(''),
      edit: <Choices label="Período" value={period} onChoose={setPeriod} options={PERIODS} />,
    });
  const sample = (
    id: string,
    label: string,
    value: string,
    extra?: Partial<ActiveFilter>,
  ): ActiveFilter => ({
    id,
    label,
    value,
    onRemove: noop,
    ...extra,
  });
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="sm">
        <div className={x.listing}>
          <FilterBar
            search={searchStub}
            filtersOpen={open}
            onFiltersOpenChange={setOpen}
            filterCount={filters.length}
            actions={<ViewAndExport />}
          />
          <div className={x.afterBar}>
            <FilterBand open={open} onClear={filters.length ? clearAll : undefined}>
              <FilterField>
                <Select
                  size="sm"
                  label="Status"
                  value={status}
                  onChange={(value) => setStatus(value as StatusKey | '')}
                  placeholder="Todos os status"
                  options={statusOptions}
                />
              </FilterField>
              <FilterField>
                <Select
                  size="sm"
                  label="Anunciante"
                  value={advertiser}
                  onChange={setAdvertiser}
                  placeholder="Todos os anunciantes"
                  options={advertiserOptions}
                />
              </FilterField>
              <FilterField wide>
                <DateRangePicker
                  size="sm"
                  aria-label="Período"
                  placeholder="Qualquer período"
                  clearable
                  duration={false}
                  start={from}
                  end={to}
                  onChange={(range) =>
                    setPeriod(range.start || range.end ? `${range.start}|${range.end}` : '')
                  }
                />
              </FilterField>
            </FilterBand>
            {!open && (
              <div className={x.activeRow}>
                <ActiveFilters filters={filters} onClearAll={clearAll}>
                  {rows.length} de {plural(CAMPAIGNS.length, 'campanha', 'campanhas')}
                </ActiveFilters>
              </div>
            )}
            <MiniTable rows={rows} transitionKey={`${status}:${advertiser}:${period}`} />
          </div>
        </div>
      </Shot>

      <Shot title="Estados" align="stretch" pad="md">
        <States min={204}>
          <State label="Repouso">
            <Chip label="Status:" onRemove={noop} onClick={noop}>
              Veiculando
            </Chip>
          </State>
          <State label="Hover">
            <Chip label="Status:" onRemove={noop} onClick={noop} data-force="hover">
              Veiculando
            </Chip>
          </State>
          <State label="Remover em hover">
            <Chip label="Status:" onRemove={noop} onClick={noop} removeForce="hover">
              Veiculando
            </Chip>
          </State>
          <State label="Foco">
            <Chip label="Status:" onRemove={noop} onClick={noop} data-force="focus">
              Veiculando
            </Chip>
          </State>
          <State label="Removendo">
            <Chip label="Status:" onRemove={noop} removing>
              Veiculando
            </Chip>
          </State>
          <State label="Com marca" span={2}>
            <Chip
              label="Anunciante:"
              leading={<BrandMark name="Aurora Calçados" size="xs" variant="soft" decorative />}
              onRemove={noop}
              onClick={noop}
            >
              Aurora Calçados
            </Chip>
          </State>
          <State label="Excesso (+2)" span={2}>
            <ActiveFilters
              onClearAll={noop}
              filters={[
                sample('s', 'Status', 'Veiculando'),
                sample('a', 'Anunciante', 'Aurora Calçados', {
                  leading: <BrandMark name="Aurora Calçados" size="xs" variant="soft" decorative />,
                }),
                sample('p', 'Período', '01/10 – 31/10'),
                sample('c', 'Canal', 'Portal da feira'),
                sample('u', 'Público', 'Lojistas e compradores'),
                sample('v', 'Verba', 'Acima de R$ 10.000,00'),
              ]}
            />
          </State>
        </States>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Ações em lote ——————————————————————————— */

const bulkActions = (opts: { disabledDelete?: boolean } = {}) => [
  { label: 'Exportar', icon: Download, onSelect: noop },
  { label: 'Pausar', icon: Pause, onSelect: noop },
  {
    label: 'Excluir',
    icon: Trash2,
    danger: true,
    disabled: opts.disabledDelete,
    hint: opts.disabledDelete ? 'Campanhas no ar não podem ser excluídas' : undefined,
    onSelect: noop,
  },
];

function AcoesLote() {
  const [rows, setRows] = useState(CAMPAIGNS);
  const [ref, width] = useWidth<HTMLDivElement>();
  const narrow = width > 0 && width < 640;
  const [selected, setSelected] = useState<Set<string>>(new Set(['2041', '2035', '2029']));
  const [page, setPage] = useState(1);
  const [processing, setProcessing] = useState<string | undefined>();
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [exiting, setExiting] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<{ ids: string[]; skipped: number } | null>(null);
  const pageSize = 6;
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pages);
  const pageRows = rows.slice((current - 1) * pageSize, current * pageSize);
  const chosen = rows.filter((row) => selected.has(row.id));
  const live = chosen.filter((row) => row.status === 'active');
  const pageAll = pageRows.length > 0 && pageRows.every((row) => selected.has(row.id));
  const allSelected = chosen.length === rows.length;
  const phoneViewport = usePhoneViewport();
  const [dockSelected, setDockSelected] = useState<Set<string>>(new Set(['2041', '2029']));
  const dockRows = pick('2041', '2035', '2029');

  function pause() {
    const ids = live.map((row) => row.id);
    setProcessing('Pausar');
    setPending(new Set(chosen.map((row) => row.id)));
    window.setTimeout(() => {
      setRows((list) =>
        list.map((row) => (ids.includes(row.id) ? { ...row, status: 'paused' } : row)),
      );
      setProcessing(undefined);
      setPending(new Set());
      toast(plural(ids.length, 'campanha pausada', 'campanhas pausadas'));
    }, 1100);
  }
  function remove(ids: string[]) {
    const before = rows;
    setConfirm(null);
    setExiting(new Set(ids));
    window.setTimeout(() => {
      setRows((list) => list.filter((row) => !ids.includes(row.id)));
      setSelected((value) => new Set([...value].filter((id) => !ids.includes(id))));
      setExiting(new Set());
      toast(plural(ids.length, 'campanha excluída', 'campanhas excluídas'), {
        action: { label: 'Desfazer', onClick: () => setRows(before) },
      });
    }, 200);
  }

  const confirmName =
    confirm?.ids.length === 1 ? rows.find((row) => row.id === confirm.ids[0])?.name : undefined;
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="sm">
        <div className={x.listing} ref={ref}>
          <DataTable
            label="Campanhas"
            density="compact"
            fixed={!narrow}
            hiddenColumns={narrow ? NARROW_HIDDEN : undefined}
            selectable
            rows={pageRows}
            rowKey={(row) => row.id}
            rowLabel={(row) => row.name}
            selected={selected}
            onSelectedChange={setSelected}
            pending={pending}
            exiting={exiting}
            banner={
              pageAll && rows.length > pageRows.length ? (
                <SelectAllBand
                  pageCount={pageRows.length}
                  total={rows.length}
                  allSelected={allSelected}
                  onSelectAll={() => setSelected(new Set(rows.map((row) => row.id)))}
                  onClear={() => setSelected(new Set())}
                />
              ) : undefined
            }
            columns={fitNarrow(
              [nameColumn, advertiserColumn, statusColumn, budgetColumn, periodColumn],
              narrow,
            )}
            footer={
              <Pagination
                page={current}
                pageSize={pageSize}
                total={rows.length}
                noun="campanhas"
                onPageChange={setPage}
              />
            }
          />
          <BulkBar
            dock
            count={selected.size}
            noun={selected.size === 1 ? 'selecionada' : 'selecionadas'}
            processing={processing}
            onClear={() => setSelected(new Set())}
            actions={[
              {
                label: 'Exportar',
                icon: Download,
                onSelect: () =>
                  toast(plural(chosen.length, 'campanha exportada', 'campanhas exportadas'), {
                    tone: 'info',
                  }),
              },
              {
                label: 'Pausar',
                icon: Pause,
                disabled: live.length === 0,
                hint: live.length === 0 ? 'Nenhuma campanha no ar na seleção' : undefined,
                onSelect: pause,
              },
              {
                label: 'Excluir',
                icon: Trash2,
                danger: true,
                disabled: live.length === chosen.length,
                hint:
                  live.length === chosen.length
                    ? 'Campanhas no ar não podem ser excluídas'
                    : undefined,
                onSelect: () =>
                  setConfirm({
                    ids: chosen.filter((row) => row.status !== 'active').map((row) => row.id),
                    skipped: live.length,
                  }),
              },
            ]}
          />
          <Dialog
            open={confirm !== null}
            onClose={() => setConfirm(null)}
            size="sm"
            divided={false}
            title={
              confirmName
                ? `Excluir ${confirmName}?`
                : `Excluir ${confirm?.ids.length ?? 0} campanhas?`
            }
            description={
              confirm?.skipped
                ? `${confirm.skipped} em veiculação ${confirm.skipped === 1 ? 'fica' : 'ficam'} de fora.`
                : undefined
            }
            footer={
              <>
                <Button data-autofocus onClick={() => setConfirm(null)}>
                  Cancelar
                </Button>
                <Button variant="danger" onClick={() => confirm && remove(confirm.ids)}>
                  {confirmName
                    ? 'Excluir campanha'
                    : `Excluir ${confirm?.ids.length ?? 0} campanhas`}
                </Button>
              </>
            }
          />
          <Toaster />
        </div>
      </Shot>

      <Shot title="Estados" align="stretch" pad="md">
        <States columns={1} align="center">
          <State label="Uma">
            <BulkBar count={1} noun="selecionada" onClear={noop} actions={bulkActions()} />
          </State>
          <State label="Várias">
            <BulkBar count={3} noun="selecionadas" onClear={noop} actions={bulkActions()} />
          </State>
          <State label="Página toda">
            <div className={x.bandSample}>
              <DataTable
                label="Página selecionada"
                density="compact"
                selectable
                rows={pick('2041', '2035', '2029')}
                rowKey={(row) => row.id}
                rowLabel={(row) => row.name}
                selected={new Set(['2041', '2035', '2029'])}
                banner={
                  <SelectAllBand pageCount={3} total={17} onSelectAll={noop} onClear={noop} />
                }
                columns={[
                  {
                    key: 'name',
                    header: 'Campanha',
                    truncate: true,
                    title: (row) => row.name,
                    render: (row) => <span className={x.strong}>{row.name}</span>,
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    width: 132,
                    render: (row) => <StatusCell status={row.status} wrap={false} />,
                  },
                ]}
              />
            </div>
          </State>
          <State label="Ação indisponível">
            <BulkBar
              count={2}
              noun="selecionadas"
              onClear={noop}
              actions={bulkActions({ disabledDelete: true })}
            />
          </State>
          <State label="Processando">
            <BulkBar
              count={3}
              noun="selecionadas"
              processing="Pausar"
              onClear={noop}
              actions={bulkActions()}
            />
          </State>
        </States>
      </Shot>

      {!phoneViewport && (
        <Shot title="Celular" align="center" pad="md">
          <Phone>
            <div className={x.phoneDock}>
              <div className={x.cardsFrame}>
                <CampaignCards
                  rows={dockRows}
                  selected={dockSelected}
                  onStatus={noop}
                  onToggle={(id) => setDockSelected((value) => toggleIn(value, id))}
                />
              </div>
              <BulkBar
                dock
                count={dockSelected.size}
                noun={dockSelected.size === 1 ? 'selecionada' : 'selecionadas'}
                onClear={() => setDockSelected(new Set())}
                actions={bulkActions()}
              />
            </div>
          </Phone>
        </Shot>
      )}
    </Shots>
  );
}

/* ——————————————————————————— Lista ——————————————————————————— */

const PIS: {
  code: string;
  advertiser: string;
  amount: number;
  when: string;
  status: string;
  tone: Tone;
}[] = [
  {
    code: '2026-0400',
    advertiser: 'Aurora Calçados',
    amount: 18000,
    when: 'Assinatura em 72 h',
    status: 'Enviado',
    tone: 'amber',
  },
  {
    code: '2026-0398',
    advertiser: 'Estúdio Norte',
    amount: 8000,
    when: 'Assinado em 28/09',
    status: 'Ativo',
    tone: 'green',
  },
  {
    code: '2026-0391',
    advertiser: 'Casa Forma',
    amount: 3600,
    when: 'Assinatura em 18 h',
    status: 'Enviado',
    tone: 'amber',
  },
  {
    code: '2026-0385',
    advertiser: 'Ateliê Sul',
    amount: 3600,
    when: 'Pausado em 12/10',
    status: 'Pausado',
    tone: 'gray',
  },
];
const AUDIENCE_CHOICES = [
  { id: 'visitantes', name: 'Visitantes credenciados', size: '142 mil' },
  { id: 'lojistas', name: 'Lojistas e compradores', size: '38 mil' },
  { id: 'expositores', name: 'Expositores', size: '1.240' },
  { id: 'imprensa', name: 'Imprensa e influenciadores', size: '310' },
];

function PiRow({ force }: { force?: string }) {
  return (
    <div className={x.fill}>
      <List label="Pedido de inserção">
        <ListItem
          href="#lista"
          data-force={force}
          leading={<BrandMark name="Aurora Calçados" size="sm" variant="soft" decorative />}
          title="P.I. 2026-0400 · Aurora Calçados"
          description="R$ 18.000,00 · Assinatura em 72 h"
          meta={
            <Badge variant="text" size="sm" tone="amber">
              Enviado
            </Badge>
          }
        />
      </List>
    </div>
  );
}

function Lista() {
  const [notify, setNotify] = useState({ lead: true, approved: true, pi: false, weekly: true });
  const [audiences, setAudiences] = useState<Set<string>>(new Set(['visitantes', 'lojistas']));
  const [channels, setChannels] = useState([
    { id: 'portal', name: 'Portal da feira', share: '50%' },
    { id: 'app', name: 'App Francal', share: '30%' },
    { id: 'email', name: 'E-mail marketing', share: '12%' },
    { id: 'vitrine', name: 'Vitrine', share: '8%' },
  ]);
  const toggle = (key: keyof typeof notify) => (value: boolean) =>
    setNotify((current) => ({ ...current, [key]: value }));
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="md">
        <div className={x.grid2}>
          <Col gap={10}>
            <h4 className={x.listTitle}>Pedidos de inserção</h4>
            <List label="Pedidos de inserção">
              {PIS.map((item) => (
                <ListItem
                  key={item.code}
                  href="#lista"
                  leading={<BrandMark name={item.advertiser} size="sm" variant="soft" decorative />}
                  title={`P.I. ${item.code} · ${item.advertiser}`}
                  description={`${money(item.amount)} · ${item.when}`}
                  meta={
                    <Badge variant="text" size="sm" tone={item.tone}>
                      {item.status}
                    </Badge>
                  }
                />
              ))}
            </List>
          </Col>
          <Col gap={10}>
            <h4 className={x.listTitle}>Notificações</h4>
            <List label="Notificações">
              <ListItem
                title="Novo lead"
                description="E-mail e push"
                trailing={
                  <Switch
                    size="sm"
                    hideLabel
                    label="Novo lead"
                    checked={notify.lead}
                    onCheckedChange={toggle('lead')}
                  />
                }
              />
              <ListItem
                title="Campanha aprovada"
                description="E-mail"
                trailing={
                  <Switch
                    size="sm"
                    hideLabel
                    label="Campanha aprovada"
                    checked={notify.approved}
                    onCheckedChange={toggle('approved')}
                  />
                }
              />
              <ListItem
                title="P.I. assinado"
                description="Push no app"
                trailing={
                  <Switch
                    size="sm"
                    hideLabel
                    label="P.I. assinado"
                    checked={notify.pi}
                    onCheckedChange={toggle('pi')}
                  />
                }
              />
              <ListItem
                title="Resumo semanal"
                description="Segunda, 8h"
                trailing={
                  <Switch
                    size="sm"
                    hideLabel
                    label="Resumo semanal"
                    checked={notify.weekly}
                    onCheckedChange={toggle('weekly')}
                  />
                }
              />
            </List>
          </Col>
          <Col gap={10}>
            <h4 className={x.listTitle}>Públicos</h4>
            <List label="Públicos">
              {AUDIENCE_CHOICES.map((item) => (
                <ListItem
                  key={item.id}
                  checkbox
                  title={item.name}
                  meta={item.size}
                  selected={audiences.has(item.id)}
                  onClick={() => setAudiences((value) => toggleIn(value, item.id))}
                />
              ))}
            </List>
          </Col>
          <Col gap={10}>
            <h4 className={x.listTitle}>Ordem dos canais</h4>
            <List
              label="Ordem dos canais"
              onReorder={(from, to) =>
                setChannels((list) => {
                  const next = [...list];
                  const [moved] = next.splice(from, 1);
                  if (moved) next.splice(to, 0, moved);
                  return next;
                })
              }
            >
              {channels.map((item) => (
                <ListItem key={item.id} draggable title={item.name} meta={item.share} />
              ))}
            </List>
          </Col>
        </div>
      </Shot>
      <Shot title="Linha clicável com ação ao lado" tone="white" align="stretch" pad="md">
        <div className={x.fill}>
          <List label="Avisos">
            <ListItem
              href="#lista"
              title="Campanha aprovada · Aurora Calçados"
              description="A campanha entra no ar em 12/10"
              meta="há 2 h"
              actions={<IconButton size="sm" variant="ghost" icon={Check} label="Marcar como lida" />}
            />
            <ListItem
              href="#lista"
              title="P.I. 2026-0400 rejeitado pelo anunciante"
              description="Valor acima do combinado"
              meta="ontem"
            />
          </List>
        </div>
      </Shot>

      <Shot title="Estados" align="stretch" pad="md">
        <States min={280}>
          <State label="Repouso">
            <PiRow />
          </State>
          <State label="Hover">
            <PiRow force="hover" />
          </State>
          <State label="Pressionado">
            <PiRow force="active" />
          </State>
          <State label="Foco">
            <PiRow force="focus" />
          </State>
          <State label="Selecionado">
            <div className={x.fill}>
              <List label="Selecionado">
                <ListItem
                  checkbox
                  selected
                  title="Lojistas e compradores"
                  meta="38 mil"
                  onClick={noop}
                />
              </List>
            </div>
          </State>
          <State label="Indisponível">
            <div className={x.fill}>
              <List label="Indisponível">
                <ListItem
                  checkbox
                  disabled
                  title="Imprensa e influenciadores"
                  meta="310"
                  onClick={noop}
                />
              </List>
            </div>
          </State>
          <State label="Carregando">
            <div className={x.fill}>
              <List label="Carregando">
                <ListItemSkeleton />
              </List>
            </div>
          </State>
          <State label="Vazio">
            <div className={x.fill}>
              <List label="Vazio" empty="Nenhum P.I. pendente" />
            </div>
          </State>
        </States>
      </Shot>

      <Shot title="Grupos" align="center" pad="md">
        <div className={x.groupList}>
          <List label="Leads" maxHeight={316}>
            <ListGroup label="Hoje" meta="4">
              {LEADS.slice(0, 4).map((lead) => (
                <ListItem
                  key={lead.id}
                  href="#lista"
                  title={lead.company}
                  description={`${lead.city} · ${lead.channel}`}
                  meta={lead.at.split(' · ')[1]}
                />
              ))}
            </ListGroup>
            <ListGroup label="Ontem" meta="2">
              {LEADS.slice(4).map((lead) => (
                <ListItem
                  key={lead.id}
                  href="#lista"
                  title={lead.company}
                  description={`${lead.city} · ${lead.channel}`}
                  meta={lead.at.split(' · ')[1]}
                />
              ))}
            </ListGroup>
            <ListGroup label="20/10" meta="2">
              {LEADS.slice(0, 2).map((lead) => (
                <ListItem
                  key={`old-${lead.id}`}
                  href="#lista"
                  title={lead.company}
                  description={`${lead.city} · ${lead.channel}`}
                  meta="09:12"
                />
              ))}
            </ListGroup>
          </List>
        </div>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Badge ——————————————————————————— */

function Badges() {
  const [tab, setTab] = useState('todas');
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="md">
        <div className={x.grid2}>
          <Panel title="Status da campanha">
            <ul className={x.statusGrid}>
              {STATUS_ORDER.map((key) => (
                <li key={key}>
                  <StatusCell status={key} />
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Na tabela">
            <DataTable
              variant="plain"
              density="compact"
              label="Status na tabela"
              rows={pick('2035', '2041', '2029')}
              rowKey={(row) => row.id}
              columns={[
                {
                  key: 'name',
                  header: 'Campanha',
                  truncate: true,
                  title: (row) => row.name,
                  render: (row) => <span className={x.strong}>{row.name}</span>,
                },
                {
                  key: 'status',
                  header: 'Status',
                  width: 156,
                  render: (row) => <StatusCell status={row.status} />,
                },
              ]}
            />
          </Panel>
          <Panel title="Bônus">
            <dl className={x.props}>
              <div>
                <dt>+20% de impressões</dt>
                <dd>
                  <Badge variant="text" tone="green">
                    Liberado
                  </Badge>
                </dd>
              </div>
              <div>
                <dt>Destaque extra na newsletter</dt>
                <dd>
                  <Badge variant="text" tone="gray" dot="hollow">
                    Bloqueado
                  </Badge>
                </dd>
              </div>
              <div>
                <dt>Post no Instagram oficial</dt>
                <dd>
                  <Badge variant="text" tone="gray" dot="hollow">
                    Bloqueado
                  </Badge>
                </dd>
              </div>
            </dl>
          </Panel>
          <Panel title="Contagens">
            <div className={x.counts}>
              <Tabs
                label="Recortes"
                value={tab}
                onChange={setTab}
                size="sm"
                items={[
                  { value: 'todas', label: 'Todas', count: 17 },
                  { value: 'veiculacao', label: 'Em veiculação', count: 6 },
                  { value: 'aprovacao', label: 'Em aprovação', count: 5 },
                ]}
              />
              <div className={x.sidebarSample}>
                <Sidebar
                  groups={[
                    {
                      id: 'operacao',
                      label: 'Operação',
                      items: [
                        { id: 'campanhas', label: 'Campanhas', icon: Megaphone, count: 5 },
                        {
                          id: 'pis',
                          label: 'Pedidos de inserção',
                          icon: FileSignature,
                          count: 2,
                        },
                        { id: 'leads', label: 'Leads', icon: Users, count: 12 },
                      ],
                    },
                  ]}
                  active="campanhas"
                />
              </div>
            </div>
          </Panel>
        </div>
      </Shot>

      <Shot title="Variantes" align="stretch" pad="md">
        <States min={150}>
          <State label="Texto">
            <Badge variant="text" tone="green" live>
              Veiculando
            </Badge>
          </State>
          <State label="Texto sm">
            <Badge variant="text" size="sm" tone="amber">
              Enviado
            </Badge>
          </State>
          <State label="Inativo">
            <Badge variant="text" tone="gray" dot="hollow">
              Bloqueado
            </Badge>
          </State>
          <State label="Suave">
            <Badge tone="orange">Ajustes solicitados</Badge>
          </State>
          <State label="Suave sm">
            <Badge tone="teal" size="sm">
              Aprovada
            </Badge>
          </State>
          <State label="Contagem">
            <Row gap={8}>
              <Count>12</Count>
              <Count tone="accent">5</Count>
              <Count tone="solid">3</Count>
            </Row>
          </State>
        </States>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Tags ——————————————————————————— */

const INTEREST_SUGGESTIONS = [
  'Banner',
  'Newsletter',
  'Push',
  'Vitrine',
  'Painel de LED',
  'Display',
  'Rodada de negócios',
];

function useLoop(period: number) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setTick((value) => value + 1), period);
    return () => window.clearInterval(timer);
  }, [period]);
  return tick;
}

function Tags() {
  const [interests, setInterests] = useState(['Vitrine', 'Display', 'Newsletter']);
  const [full, setFull] = useState(['Banner', 'Push', 'Vitrine']);
  const tick = useLoop(1800);
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="md">
        <div className={x.grid3}>
          <article className={x.miniCard}>
            <header className={x.miniHead}>
              <BrandMark name="Sapataria Ladeira" size="sm" variant="soft" decorative />
              <span className={x.twoLine}>
                <span className={x.strong}>Sapataria Ladeira</span>
                <span className={x.caption}>Salvador, BA · Loja de calçados</span>
              </span>
            </header>
            <div className={x.tagRow}>
              <Chip variant="neutral" size="sm">
                Vitrine
              </Chip>
              <Chip variant="neutral" size="sm">
                Display
              </Chip>
              <Tooltip content="Newsletter, Push">
                <span
                  className={x.countHit}
                  tabIndex={0}
                  aria-label="Mais 2 interesses: Newsletter, Push"
                >
                  <Count>+2</Count>
                </span>
              </Tooltip>
            </div>
          </article>
          <article className={x.miniCard}>
            <span className={x.twoLine}>
              <span className={x.strong}>Sandália Bloom</span>
              <span className={x.caption}>Aurora Calçados · Ref. AB-2207</span>
            </span>
            <div className={x.tagRow}>
              <Chip variant="outline" size="sm">
                Couro vegetal
              </Chip>
              <Chip variant="outline" size="sm">
                Feminino
              </Chip>
              <Chip variant="outline" size="sm">
                Lançamento
              </Chip>
            </div>
          </article>
          <div className={x.miniCard}>
            <Field label="Interesses" meta={`${interests.length} de 6`}>
              {({ id }) => (
                <TagInput
                  id={id}
                  values={interests}
                  onChange={setInterests}
                  suggestions={INTEREST_SUGGESTIONS}
                  max={6}
                  placeholder="Adicionar interesse"
                />
              )}
            </Field>
          </div>
        </div>
      </Shot>

      <Shot title="Variantes" align="stretch" pad="md">
        <States min={140}>
          <State label="Neutra">
            <Chip variant="neutral">Feminino</Chip>
          </State>
          <State label="Neutra sm">
            <Chip variant="neutral" size="sm">
              Feminino
            </Chip>
          </State>
          <State label="Contorno">
            <Chip variant="outline">Couro vegetal</Chip>
          </State>
          <State label="Contorno sm">
            <Chip variant="outline" size="sm">
              Couro vegetal
            </Chip>
          </State>
          <State label="Removível">
            <Chip variant="neutral" onRemove={noop}>
              Newsletter
            </Chip>
          </State>
        </States>
      </Shot>

      <Shot title="Estados" align="stretch" pad="md">
        <States min={200}>
          <State label="Repouso">
            <Chip variant="neutral" onRemove={noop}>
              Push
            </Chip>
          </State>
          <State label="Hover">
            <Chip variant="neutral" onRemove={noop} removeForce="hover">
              Push
            </Chip>
          </State>
          <State label="Foco">
            <div className={x.tagField}>
              <TagInput
                values={['Banner', 'Push']}
                onChange={noop}
                label="Interesses"
                data-force="focus"
              />
            </div>
          </State>
          <State label="Adicionando">
            <Row gap={4}>
              <Chip variant="neutral" size="sm">
                Banner
              </Chip>
              <Chip key={tick} variant="neutral" size="sm" appear>
                Vitrine
              </Chip>
            </Row>
          </State>
          <State label="Removendo">
            <Row gap={4}>
              <Chip variant="neutral" size="sm">
                Banner
              </Chip>
              <Chip variant="neutral" size="sm" removing onRemove={noop}>
                Push
              </Chip>
            </Row>
          </State>
          <State label="Máximo">
            <div className={x.tagField}>
              <TagInput values={full} onChange={setFull} label="Interesses" max={3} />
            </div>
          </State>
        </States>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— KPI ——————————————————————————— */

type Range = '7d' | '14d' | 'all';
const KPI: Record<Range, MetricProps[]> = {
  '7d': [
    {
      label: 'Impressões',
      value: '97.328',
      delta: { value: '3,8%', trend: 'up' },
      hint: '24,3% do contratado',
      tooltip: 'Contra 93.760 nos 7 dias anteriores',
    },
    {
      label: 'Cliques',
      value: '2.296',
      delta: { value: '10,2%', trend: 'up' },
      hint: 'média de 328 por dia',
      tooltip: 'Contra 2.084 nos 7 dias anteriores',
    },
    {
      label: 'CTR',
      value: '2,36%',
      delta: { value: '6,1%', trend: 'up' },
      hint: 'pico de 2,77% em 16/10',
      tooltip: 'Contra 2,22% nos 7 dias anteriores',
    },
    {
      label: 'Leads',
      value: '71',
      delta: { value: '14,5%', trend: 'down' },
      hint: '3,1% dos cliques',
      tooltip: 'Contra 83 nos 7 dias anteriores',
    },
    {
      label: 'Custo por lead',
      value: 'R$ 61,69',
      delta: { value: '21,4%', trend: 'up', tone: 'bad' },
      hint: 'R$ 4.379,76 gastos',
      tooltip: 'Contra R$ 50,82 nos 7 dias anteriores',
    },
    {
      label: 'Entrega vs. plano',
      value: '108%',
      delta: { value: '4 p.p.', trend: 'up' },
      hint: 'plano de 90.323',
      tooltip: 'Contra 104% nos 7 dias anteriores',
    },
  ],
  '14d': [
    {
      label: 'Impressões',
      value: '186.950',
      delta: { value: '2,1%', trend: 'up' },
      hint: '46,7% do contratado',
      tooltip: 'Contra 183.100 nos 14 dias anteriores',
    },
    {
      label: 'Cliques',
      value: '4.302',
      delta: { value: '7,4%', trend: 'up' },
      hint: 'média de 307 por dia',
      tooltip: 'Contra 4.006 nos 14 dias anteriores',
    },
    {
      label: 'CTR',
      value: '2,30%',
      delta: { value: '5,2%', trend: 'up' },
      hint: 'pico de 2,77% em 16/10',
      tooltip: 'Contra 2,19% nos 14 dias anteriores',
    },
    {
      label: 'Leads',
      value: '139',
      delta: { value: '3,0%', trend: 'up' },
      hint: '3,2% dos cliques',
      tooltip: 'Contra 135 nos 14 dias anteriores',
    },
    {
      label: 'Custo por lead',
      value: 'R$ 60,52',
      delta: { value: '2,9%', trend: 'down', tone: 'good' },
      hint: 'R$ 8.412,28 gastos',
      tooltip: 'Contra R$ 62,33 nos 14 dias anteriores',
    },
    {
      label: 'Entrega vs. plano',
      value: '103%',
      delta: { value: '1 p.p.', trend: 'up' },
      hint: 'plano de 181.500',
      tooltip: 'Contra 102% nos 14 dias anteriores',
    },
  ],
  all: [
    { label: 'Impressões', value: '271.400', hint: '67,9% do contratado' },
    { label: 'Cliques', value: '6.120', hint: 'média de 279 por dia' },
    { label: 'CTR', value: '2,25%', hint: 'pico de 2,77% em 16/10' },
    { label: 'Leads', value: '214', hint: '3,5% dos cliques' },
    { label: 'Custo por lead', value: 'R$ 57,07', hint: 'R$ 12.213,00 gastos' },
    { label: 'Entrega vs. plano', value: '101%', hint: 'plano de 268.700' },
  ],
};
const RANGES: { value: Range; label: string }[] = [
  { value: '7d', label: '7 dias' },
  { value: '14d', label: '14 dias' },
  { value: 'all', label: 'Todo o período' },
];
const WINDOW: Record<Range, string> = {
  '7d': '16/10 – 22/10',
  '14d': '09/10 – 22/10',
  all: '01/10 – 22/10',
};

function Kpis() {
  const [range, setRange] = useState<Range>('7d');
  const [phoneRange, setPhoneRange] = useState<Range>('7d');
  const phoneViewport = usePhoneViewport();
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="md">
        <div className={x.stack}>
          <div className={x.kpiBlock}>
            <div className={x.kpiBar}>
              <Segmented
                size="sm"
                label="Período"
                value={range}
                onChange={setRange}
                options={RANGES}
              />
              <span className={x.window}>{WINDOW[range]}</span>
            </div>
            <MetricStrip label="Indicadores do período" items={KPI[range]} />
          </div>
          <MetricStrip
            label="Resumo da campanha"
            items={[
              { label: 'Impressões', value: '271.400', hint: 'Entregues no período' },
              { label: 'Cliques', value: '6.120', hint: 'CTR 2,25%' },
              { label: 'Leads', value: '214', hint: 'Campanha + vitrine' },
              {
                label: 'Entrega',
                value: '68%',
                meter: { value: 68, label: 'Entrega' },
                hint: 'de ≈ 400.000 impressões',
              },
            ]}
          />
          <div className={x.formStrip}>
            <MetricStrip
              size="figure"
              label="Estimativa"
              items={[
                { label: 'Por dia', value: '≈ 14.815', hint: 'impressões' },
                { label: 'Com bônus', value: '≈ 480.000', hint: '+20% liberado' },
                { label: 'Custo efetivo', value: 'R$ 35,63', hint: 'por mil impressões' },
              ]}
            />
          </div>
        </div>
      </Shot>

      <Shot title="Estados" align="stretch" pad="md">
        <States min={200}>
          <State label="Com variação">
            <MetricStrip columns={1}>
              <Metric
                label="Impressões"
                value="97.328"
                delta={{ value: '3,8%', trend: 'up' }}
                hint="24,3% do contratado"
              />
            </MetricStrip>
          </State>
          <State label="Sem dado">
            <MetricStrip columns={1}>
              <Metric label="Leads" empty />
            </MetricStrip>
          </State>
          <State label="Carregando">
            <MetricStrip columns={1}>
              <Metric label="Cliques" loading />
            </MetricStrip>
          </State>
          <State label="Atenção">
            <MetricStrip columns={1}>
              <Metric
                label="Entrega vs. plano"
                value="86%"
                delta={{ value: '9 p.p.', trend: 'down' }}
                hint="Abaixo do ritmo"
                warn
              />
            </MetricStrip>
          </State>
          <State label="Hover">
            <MetricStrip columns={1}>
              <Metric
                label="CTR"
                value="2,36%"
                delta={{ value: '6,1%', trend: 'up' }}
                hint="pico de 2,77% em 16/10"
                tooltip="Contra 2,22%"
                data-force="hover"
              />
            </MetricStrip>
          </State>
          <State label="Foco">
            <MetricStrip columns={1}>
              <Metric
                label="CTR"
                value="2,36%"
                delta={{ value: '6,1%', trend: 'up' }}
                hint="pico de 2,77% em 16/10"
                tooltip="Contra 2,22%"
                data-force="focus"
              />
            </MetricStrip>
          </State>
        </States>
      </Shot>

      {!phoneViewport && (
        <Shot title="Celular" align="center" pad="md">
          <Phone>
            <div className={x.kpiBlock}>
              <Segmented
                size="sm"
                full
                label="Período"
                value={phoneRange}
                onChange={setPhoneRange}
                options={RANGES}
              />
              <MetricStrip label="Indicadores do período" items={KPI[phoneRange]} />
            </div>
          </Phone>
        </Shot>
      )}
    </Shots>
  );
}

/* ——————————————————————————— Linha do tempo ——————————————————————————— */

const HISTORY: TimelineEntry[] = [
  {
    id: 'h1',
    title: 'Veiculação iniciada',
    description: 'Marina Lopes',
    date: '29/09',
    state: 'current',
  },
  { id: 'h2', title: 'P.I. assinado', description: 'Aurora Calçados', date: '29/09' },
  { id: 'h3', title: 'Aprovada · P.I. gerado', description: 'Marina Lopes', date: '29/09' },
  { id: 'h4', title: 'Enviada para aprovação', description: 'Marina Lopes', date: '28/09' },
  { id: 'h5', title: 'Campanha criada', description: 'Marina Lopes', date: '28/09' },
];
const OLDER: TimelineEntry[] = [
  { id: 'h6', title: 'Briefing preenchido', description: 'Marina Lopes', date: '27/09' },
  { id: 'h7', title: 'Ativo escolhido', description: 'Marina Lopes', date: '27/09' },
  { id: 'h8', title: 'Rascunho iniciado', description: 'Marina Lopes', date: '27/09' },
];
type Activity = TimelineEntry & { group: string };
const ACTIVITY: Activity[] = [
  {
    id: 'a1',
    group: 'Hoje',
    title: (
      <>
        <b>Rafael Dias</b> pediu ajustes
      </>
    ),
    marker: <Avatar name="Rafael Dias" size="xs" decorative />,
    date: 'há 2 h',
    quote:
      'A peça do Super Topo está com o logo da feira cortado na versão mobile. Pode reenviar em 970 × 250 com margem de segurança de 20 px? Assim que chegar, aprovo no mesmo dia e o P.I. sai para assinatura.',
  },
  {
    id: 'a2',
    group: 'Hoje',
    title: (
      <>
        <b>Marina Lopes</b> enviou para aprovação
      </>
    ),
    marker: <Avatar name="Marina Lopes" size="xs" decorative />,
    date: 'há 5 h',
  },
  {
    id: 'a3',
    group: '29/09',
    title: (
      <>
        <b>Aurora Calçados</b> assinou o <span className={x.nowrap}>P.I. 2026-0400</span>
      </>
    ),
    marker: <BrandMark name="Aurora Calçados" size="xs" variant="soft" decorative />,
    date: '16:42',
  },
  {
    id: 'a4',
    group: '29/09',
    title: (
      <>
        <b>Clara Souto</b> aprovou a campanha
      </>
    ),
    marker: <Avatar name="Clara Souto" size="xs" decorative />,
    date: '11:08',
  },
];
const groupOf = (entry: TimelineEntry) => ACTIVITY.find((item) => item.id === entry.id)?.group;

function LinhaDoTempo() {
  const [more, setMore] = useState(false);
  const olderId = useId();
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="md">
        <div className={x.timelineGrid}>
          <aside className={x.aside}>
            <section className={x.asideBlock}>
              <h4 className={x.asideTitle}>Pedido de inserção</h4>
              <div className={x.piRow}>
                <span className={x.twoLine}>
                  <span className={x.strong}>P.I. 2026-0400</span>
                  <span className={x.caption}>R$ 18.000,00</span>
                </span>
                <Badge variant="text" size="sm" tone="green">
                  Ativo
                </Badge>
              </div>
            </section>
            <section className={x.asideBlock}>
              <h4 className={x.asideTitle}>Histórico</h4>
              <div>
                <Timeline variant="dots" label="Histórico" items={HISTORY} />
                <div id={olderId} className={x.older} data-open={more || undefined} inert={!more}>
                  <div className={x.olderClip}>
                    <div className={x.olderInner}>
                      <Timeline variant="dots" label="Histórico anterior" items={OLDER} />
                    </div>
                  </div>
                </div>
              </div>
              <span className={x.more}>
                <LinkButton
                  aria-expanded={more}
                  aria-controls={olderId}
                  onClick={() => setMore((value) => !value)}
                >
                  {more ? 'Ver menos' : 'Ver histórico completo'}
                </LinkButton>
              </span>
            </section>
          </aside>
          <Panel title="Atividade">
            <Timeline variant="activity" label="Atividade" items={ACTIVITY} groupBy={groupOf} />
          </Panel>
        </div>
      </Shot>

      <Shot title="Variantes" align="stretch" pad="md">
        <States min={300}>
          <State label="Pontos">
            <div className={x.fill}>
              <Timeline variant="dots" label="Histórico" items={HISTORY.slice(0, 3)} />
            </div>
          </State>
          <State label="Etapas">
            <div className={x.fill}>
              <Timeline
                variant="steps"
                label="Depois do envio"
                items={[
                  {
                    title: 'Aprovação do portal',
                    description: 'Comercial do portal',
                    state: 'current',
                  },
                  {
                    title: 'P.I. para assinatura',
                    description: 'Assinatura em 72 h',
                    state: 'upcoming',
                  },
                  { title: 'Veiculação', description: 'No ar no período', state: 'upcoming' },
                ]}
              />
            </div>
          </State>
          <State label="Atividade">
            <div className={x.fill}>
              <Timeline variant="activity" label="Atividade" items={ACTIVITY.slice(1, 4)} />
            </div>
          </State>
        </States>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Registro ——————————————————————————— */

export { Badges, Kpis, LinhaDoTempo, TabelaDados };

export const specimens: Record<string, ComponentType> = {
  tabela: Tabela,
  'data-table': TabelaDados,
  'barra-filtros': BarraFiltros,
  'filtros-ativos': FiltrosAtivos,
  'acoes-lote': AcoesLote,
  lista: Lista,
  badge: Badges,
  tags: Tags,
  kpi: Kpis,
  timeline: LinhaDoTempo,
};
