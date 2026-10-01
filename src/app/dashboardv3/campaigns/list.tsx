'use client';

import {
  BarChart3,
  ChevronDown,
  CircleAlert,
  Download,
  Ellipsis,
  Eye,
  LayoutList,
  Link2,
  ListFilter,
  Pencil,
  Plus,
  Rows3,
  Trash2,
  X,
} from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import {
  Badge,
  BrandMark,
  Segmented,
  BulkBar,
  Button,
  Checkbox,
  Chip,
  DataTable,
  DateRangePicker,
  Dialog,
  IconButton,
  Menu,
  Pagination,
  SearchField,
  Switch,
  Tabs,
  Tooltip,
  VisuallyHidden,
  type Column,
  type MenuItem,
  type SortState,
} from '@/components/ds-v3';
import { Select } from '@/components/ds-v3/select';
import { toast } from '@/components/ds-v3/toast';
import { effectiveModel } from '../builder/validation';
import {
  ADVERTISERS,
  AUDIENCES,
  CHANNELS,
  EDITABLE,
  PACKAGES,
  PRICING,
  STATUS,
  STATUS_ORDER,
  byId,
  type CampaignStatus,
} from '../domain';
import { brl, dateBR, dateShort, parseMoney } from '../pricing';
import { assetsOf, mainAsset, store, useStore, type Campaign } from '../store';
import { BUCKETS } from './buckets';
import l from './list.module.css';

const TABS: { value: string; label: string; statuses?: CampaignStatus[] }[] = [
  { value: 'todas', label: 'Todas' },
  ...BUCKETS.map((bucket) => ({ value: bucket.key, label: bucket.label, statuses: bucket.statuses })),
];
/** Como cada recorte se lê numa frase ("Nenhuma campanha em aprovação"). */
const TAB_PHRASE: Record<string, string> = {
  veiculacao: 'em veiculação',
  aprovacao: 'em aprovação',
  rascunhos: 'em rascunho',
  encerradas: 'encerrada',
};
const REASON_STATUSES: CampaignStatus[] = ['rejected', 'adjustments_requested', 'pi_rejected', 'cancelled'];
const DELETE_TEXT =
  'A exclusão apaga a campanha, as métricas entregues e os P.I., e devolve o estoque reservado — tudo na mesma transação. Não há como desfazer.';
const LIVE_DELETE = 'Campanhas em veiculação não podem ser excluídas.';

const stop = (event: ReactMouseEvent) => event.stopPropagation();
const detailHref = (campaign: Campaign, suffix = '') => `/dashboardv3/campanhas/${campaign.id}${suffix}` as Route;

/** Consulta de mídia sem piscar no servidor (lá vale `false`: tabela completa). */
function useMedia(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Valor que a campanha custa: verba informada ou, nos modelos sem verba, o preço do pacote/ativo. */
function budgetValue(campaign: Campaign) {
  const d = campaign.draft;
  const value = parseMoney(d.budget);
  if (Number.isFinite(value) && value > 0) return value;
  const model = effectiveModel(d);
  if (model && model !== 'bonus' && !PRICING[model].needsBudget) {
    const price = d.selectionKind === 'package' ? byId(PACKAGES, d.packageId)?.totalPrice : mainAsset(d)?.basePrice;
    if (price) return price;
  }
  return undefined;
}
/** Verba com centavos, como no resto do app. Bonificação não tem cobrança. */
function budgetText(campaign: Campaign) {
  const value = budgetValue(campaign);
  if (value !== undefined) return brl(value);
  return effectiveModel(campaign.draft) === 'bonus' ? 'Sem cobrança' : undefined;
}
function periodText(campaign: Campaign, format: (iso: string) => string = dateShort) {
  const { startDate, endDate } = campaign.draft;
  return startDate || endDate ? `${format(startDate)} – ${format(endDate)}` : '';
}
function assetTextOf(campaign: Campaign) {
  const d = campaign.draft;
  const pack = d.selectionKind === 'package' ? byId(PACKAGES, d.packageId) : undefined;
  return pack ? `Pacote: ${pack.name}` : assetsOf(d).map((asset) => asset.name).join(', ') || '—';
}

function linksOf(campaign: Campaign) {
  const assets = assetsOf(campaign.draft);
  const unique = <T,>(list: T[]) => [...new Set(list)];
  return {
    Ativos: assets.map((asset) => asset.name),
    Canais: unique(assets.flatMap((asset) => asset.channelIds)).map((id) => byId(CHANNELS, id)?.name ?? id),
    Públicos: unique(assets.flatMap((asset) => asset.audienceIds)).map((id) => byId(AUDIENCES, id)?.name ?? id),
    Métricas: unique(assets.map((asset) => (asset.pricing === 'cpm' ? 'Impressões' : asset.pricing === 'cpc' ? 'Cliques' : asset.pricing === 'per_display' ? 'Disparos' : 'Entregas'))),
    Bonificações: unique(assets.flatMap((asset) => asset.bonuses.map((bonus) => bonus.name))),
  };
}
const linkTotal = (campaign: Campaign) => Object.values(linksOf(campaign)).reduce((sum, list) => sum + list.length, 0);

/** Planilha das campanhas (separador ";" e BOM para o Excel em pt-BR abrir com acentos). */
function exportCsv(list: Campaign[]) {
  if (!list.length) return;
  const cell = (value: string) => (/[";\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
  const lines = [
    ['Campanha', 'Anunciante', 'Status', 'Verba', 'Período'],
    ...list.map((campaign) => [
      campaign.draft.name,
      byId(ADVERTISERS, campaign.draft.advertiserId)?.name ?? '',
      STATUS[campaign.status].label,
      budgetText(campaign) ?? '',
      periodText(campaign, dateBR),
    ]),
  ].map((row) => row.map(cell).join(';'));
  const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'campanhas.csv';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  toast(`${list.length} ${list.length === 1 ? 'campanha exportada' : 'campanhas exportadas'}.`, { tone: 'info' });
}

/** Os cinco grupos de vínculos (ativos, canais, públicos, métricas, bonificações), em chips. */
function LinksGroups({ campaign }: { campaign: Campaign }) {
  return (
    <>
      {Object.entries(linksOf(campaign)).map(([group, items]) =>
        items.length ? (
          <div key={group} className={l.linksGroup}>
            <span>
              {group} ({items.length})
            </span>
            <div>
              {items.map((item) => (
                <Chip key={item} size="sm" variant="soft">
                  {item}
                </Chip>
              ))}
            </div>
          </div>
        ) : null,
      )}
    </>
  );
}

/**
 * Número de vínculos que abre o detalhamento. O painel é fixo na janela: nunca é cortado pela tabela.
 * `inline`: "N vínculos" em texto, para a linha de apoio do nome (tablet) e para o cartão (celular).
 */
function LinksPopover({ campaign, inline = false }: { campaign: Campaign; inline?: boolean }) {
  const [pos, setPos] = useState<{ top: number; left: number; up: boolean; max: number } | null>(null);
  const open = pos !== null;
  const ref = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const links = linksOf(campaign);
  const total = Object.values(links).reduce((sum, list) => sum + list.length, 0);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => !ref.current?.contains(event.target as Node) && setPos(null);
    const esc = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setPos(null);
      buttonRef.current?.focus();
    };
    // Rolar a página ou a tabela solta o painel da âncora: fecha. A rolagem dentro do painel não conta.
    const onScroll = (event: Event) => !ref.current?.contains(event.target as Node) && setPos(null);
    const onResize = () => setPos(null);
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', esc);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);
  if (!total) return inline ? null : <span className={l.muted}>—</span>;
  function toggle() {
    if (open) return setPos(null);
    const r = buttonRef.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom;
    const up = r.bottom + 6 + 440 > window.innerHeight && r.top > below;
    const left = Math.min(Math.max(8, r.right - 280), window.innerWidth - 288);
    const room = (up ? r.top : below) - 6 - 16;
    setPos({ top: up ? r.top - 6 : r.bottom + 6, left, up, max: Math.min(420, Math.max(160, room)) });
  }
  return (
    <span className={l.links} data-inline={inline || undefined} ref={ref} onClick={stop}>
      <button
        ref={buttonRef}
        type="button"
        className={inline ? l.linksInline : l.linksButton}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${total} ${total === 1 ? 'vínculo' : 'vínculos'}`}
        onClick={toggle}
      >
        {inline ? `${total} ${total === 1 ? 'vínculo' : 'vínculos'}` : total}
      </button>
      {pos && (
        <div
          className={l.linksPanel}
          role="dialog"
          aria-label={`Vínculos de ${campaign.draft.name}`}
          style={{ top: pos.top, left: pos.left, maxHeight: pos.max, translate: pos.up ? '0 -100%' : undefined }}
        >
          <LinksGroups campaign={campaign} />
        </div>
      )}
    </span>
  );
}

/**
 * Liga e desliga a veiculação direto na linha, como no Meta Ads. Só vale entre aprovada, no ar e pausada.
 * Ligar uma aprovada pede confirmação (`onStart`); pausar e retomar são imediatos, com "Desfazer".
 */
/** Invólucro do interruptor: recebe a descrição da dica e a repassa ao próprio `role="switch"`. */
function SwitchAnchor({
  'aria-describedby': describedBy,
  title,
  children,
}: {
  'aria-describedby'?: string;
  title?: string;
  children: (describedBy?: string) => ReactNode;
}) {
  return (
    <span className={l.toggleHit} title={title || undefined}>
      {children(describedBy)}
    </span>
  );
}

function DeliveryToggle({ campaign, operator, onStart }: { campaign: Campaign; operator: boolean; onStart: (campaign: Campaign) => void }) {
  const on = campaign.status === 'active';
  const can = operator && (campaign.status === 'active' || campaign.status === 'paused' || campaign.status === 'approved');
  const help = !operator
    ? 'Pausar e retomar ficam com o portal.'
    : can
      ? on
        ? 'Pausar a veiculação'
        : campaign.status === 'approved'
          ? 'Iniciar a veiculação'
          : 'Retomar a veiculação'
      : `${STATUS[campaign.status].label}: veiculação indisponível.`;
  return (
    <span
      className={l.toggle}
      onClick={(event) => {
        stop(event);
        // No toque não há hover: tocar o interruptor indisponível mostra o motivo.
        if (!can && window.matchMedia('(pointer: coarse)').matches) toast(help, { tone: 'info' });
      }}
    >
      <Tooltip content={help}>
        <SwitchAnchor>
          {(describedBy) => (
            <Switch
              size="sm"
              hideLabel
              label={`Veiculação de ${campaign.draft.name}`}
              describedBy={describedBy}
              checked={on}
              disabled={!can}
              onCheckedChange={(checked) => {
                if (checked && campaign.status === 'approved') {
                  onStart(campaign);
                  return;
                }
                // "Desfazer" devolve o retrato anterior: sem entrada falsa no histórico.
                const before = campaign;
                const options = {
                  description: campaign.draft.name,
                  action: { label: 'Desfazer', onClick: () => store.restore(before) },
                };
                store.transition(campaign.id, checked ? 'active' : 'paused');
                toast(
                  checked ? 'Veiculação retomada.' : campaign.status === 'approved' ? 'Campanha pausada antes de veicular.' : 'Veiculação pausada.',
                  options,
                );
              }}
            />
          )}
        </SwitchAnchor>
      </Tooltip>
    </span>
  );
}

export function CampaignList() {
  const router = useRouter();
  const { campaigns, persona } = useStore();
  const [tab, setTab] = useState('todas');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [advertiser, setAdvertiser] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState<SortState>({ key: 'created', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toDelete, setToDelete] = useState<{ list: Campaign[]; skipped: number }>({ list: [], skipped: 0 });
  const [toStart, setToStart] = useState<Campaign | null>(null);
  const [linksFor, setLinksFor] = useState<Campaign | null>(null);
  const [view, setView] = useState<'grupos' | 'lista'>('lista');
  const [showFilters, setShowFilters] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  // Até 900px (celular e tablet em pé) a lista vira linhas de cartão; até 1439px a tabela perde as colunas
  // Vínculos e Período, que sobem para a linha de apoio do nome (a Campanha fica larga em 1280 e 1366).
  const phone = useMedia('(max-width: 900px)');
  const narrow = useMedia('(max-width: 1439px)');
  const operator = persona === 'operador';

  const scoped = useMemo(
    () => (operator ? campaigns : campaigns.filter((campaign) => campaign.draft.advertiserId === 'adv-aurora')),
    [campaigns, operator],
  );
  const filtersOn = Boolean(status || advertiser || from || to);
  const searching = Boolean(query.trim());
  const rows = useMemo(() => {
    const term = query.trim().replace(/^#/, '').toLowerCase();
    const tabStatuses = TABS.find((item) => item.value === tab)?.statuses;
    const list = scoped.filter((campaign) => {
      const d = campaign.draft;
      if (tabStatuses && !tabStatuses.includes(campaign.status)) return false;
      if (status && campaign.status !== status) return false;
      if (advertiser && d.advertiserId !== advertiser) return false;
      if (from && d.endDate && d.endDate < from) return false;
      if (to && d.startDate && d.startDate > to) return false;
      if (term) {
        const text = `${d.name} ${campaign.id.replace('cmp-', '')} ${byId(ADVERTISERS, d.advertiserId)?.name ?? ''} ${assetsOf(d)
          .map((asset) => asset.name)
          .join(' ')}`.toLowerCase();
        if (!text.includes(term)) return false;
      }
      return true;
    });
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sort.key === 'budget') return ((budgetValue(a) ?? 0) - (budgetValue(b) ?? 0)) * dir;
      if (sort.key === 'name') return a.draft.name.localeCompare(b.draft.name, 'pt-BR') * dir;
      if (sort.key === 'period') return a.draft.startDate.localeCompare(b.draft.startDate) * dir;
      return a.createdAt.localeCompare(b.createdAt) * dir;
    });
  }, [scoped, tab, status, advertiser, from, to, query, sort]);
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage(1), [tab, status, advertiser, from, to, query, persona]);
  // Depois de excluir (ou de aumentar o "Por página"), a página atual nunca fica além da última.
  useEffect(() => {
    const last = Math.max(1, Math.ceil(rows.length / pageSize));
    if (page > last) setPage(last);
  }, [rows.length, pageSize, page]);
  // A seleção vale só para o que está à vista: trocar de aba, buscar ou filtrar solta o que saiu do recorte
  // (o "Excluir" em lote nunca age sobre campanhas escondidas). Trocar de papel também passa por aqui.
  useEffect(() => {
    setSelected((current) => {
      const ids = new Set(rows.map((campaign) => campaign.id));
      const next = new Set([...current].filter((id) => ids.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [rows]);
  // Com a barra de lote presa à base da janela, o foco por teclado rola o conteúdo para cima dela.
  const selecting = selected.size > 0;
  useEffect(() => {
    if (!selecting) return;
    const root = document.documentElement;
    const previous = root.style.scrollPaddingBottom;
    root.style.scrollPaddingBottom = '76px';
    return () => {
      root.style.scrollPaddingBottom = previous;
    };
  }, [selecting]);

  const counts = Object.fromEntries(
    TABS.map((item) => [item.value, item.statuses ? scoped.filter((campaign) => item.statuses?.includes(campaign.status)).length : scoped.length]),
  );
  const reasons = operator ? [] : scoped.filter((campaign) => REASON_STATUSES.includes(campaign.status) && campaign.reason);

  function clearFilters() {
    setStatus('');
    setAdvertiser('');
    setFrom('');
    setTo('');
  }
  function toggleOne(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  const askDelete = (campaign: Campaign) => setToDelete({ list: [campaign], skipped: 0 });
  const closeDelete = () => setToDelete({ list: [], skipped: 0 });

  const allColumns: Column<Campaign>[] = [
    {
      key: 'delivery',
      header: <VisuallyHidden>Veiculação</VisuallyHidden>,
      width: 52,
      render: (campaign) => <DeliveryToggle campaign={campaign} operator={operator} onStart={setToStart} />,
    },
    {
      key: 'name',
      header: 'Campanha',
      sortable: true,
      render: (campaign) => {
        const d = campaign.draft;
        const assetText = assetTextOf(campaign);
        // Sem as colunas Período e Vínculos (até 1439px), os dois sobem para a linha de apoio.
        const period = narrow ? periodText(campaign) : '';
        return (
          <span className={l.nameCell}>
            <Link href={detailHref(campaign)} onClick={stop} title={`${d.name} · ${campaign.id.replace('cmp-', '#')}`}>
              {d.name}
            </Link>
            {/* O ativo cede espaço; período e vínculos ficam inteiros. Com as colunas completas, o número
                da campanha entra no lugar deles (no tablet ele segue no título do link e na busca). */}
            <span className={l.sub}>
              <span className={l.subAsset} title={assetText}>
                {assetText}
              </span>
              {period && <span>{period}</span>}
              {narrow && linkTotal(campaign) > 0 && (
                <span>
                  <LinksPopover campaign={campaign} inline />
                </span>
              )}
              {!narrow && <span>{campaign.id.replace('cmp-', '#')}</span>}
            </span>
          </span>
        );
      },
    },
    ...(operator
      ? [
          {
            key: 'advertiser',
            header: 'Anunciante',
            width: narrow ? 168 : '14.6%',
            render: (campaign: Campaign) => {
              const item = byId(ADVERTISERS, campaign.draft.advertiserId);
              return item ? (
                <span className={l.advertiser} title={item.name}>
                  <BrandMark name={item.name} size="xs" variant="soft" decorative />
                  <span>{item.name}</span>
                </span>
              ) : (
                <span className={l.muted}>—</span>
              );
            },
          },
        ]
      : []),
    {
      key: 'status',
      header: 'Status',
      // 160 px cabem "Aguardando assinatura / do P.I." em duas linhas a 13 px.
      width: narrow ? 160 : '14%',
      render: (campaign) => (
        <span className={l.status} title={STATUS[campaign.status].label}>
          <Badge variant="text" tone={STATUS[campaign.status].tone} live={STATUS[campaign.status].live}>
            {STATUS[campaign.status].label}
          </Badge>
        </span>
      ),
    },
    {
      key: 'budget',
      header: 'Verba',
      width: 118,
      numeric: true,
      sortable: true,
      render: (campaign) => budgetText(campaign) ?? <span className={l.muted}>—</span>,
    },
    { key: 'links', header: 'Vínculos', align: 'end', width: 72, render: (campaign) => <LinksPopover campaign={campaign} /> },
    {
      key: 'period',
      header: 'Período',
      width: 116,
      sortable: true,
      render: (campaign) =>
        campaign.draft.startDate || campaign.draft.endDate ? (
          <span className={l.period}>{periodText(campaign)}</span>
        ) : (
          <span className={l.muted}>—</span>
        ),
    },
    {
      key: 'actions',
      header: <VisuallyHidden>Ações</VisuallyHidden>,
      align: 'end',
      width: operator ? 118 : 86,
      // Slots fixos: Analytics, Editar e Excluir ficam no mesmo x em todas as linhas. "Ver" é o nome e a linha.
      render: (campaign) => {
        const editable = EDITABLE.includes(campaign.status);
        const live = campaign.status === 'active';
        return (
          <span className={l.actions} onClick={stop}>
            <Tooltip content="Analytics">
              <IconButton label="Analytics" icon={BarChart3} variant="ghost" size="sm" onClick={() => router.push(detailHref(campaign, '?aba=analytics'))} />
            </Tooltip>
            {editable ? (
              <Tooltip content="Editar">
                <IconButton label="Editar" icon={Pencil} variant="ghost" size="sm" onClick={() => router.push(detailHref(campaign, '/editar'))} />
              </Tooltip>
            ) : (
              <span className={l.slot} aria-hidden="true" />
            )}
            {operator && (
              <Tooltip content={live ? LIVE_DELETE : 'Excluir'}>
                <IconButton label="Excluir" icon={Trash2} variant="ghost" size="sm" disabled={live} onClick={() => askDelete(campaign)} />
              </Tooltip>
            )}
          </span>
        );
      },
    },
  ];
  // Tablet: Vínculos e Período saem da grade (o período vai para a linha de apoio do nome).
  const columns = narrow ? allColumns.filter((column) => column.key !== 'links' && column.key !== 'period') : allColumns;

  // O período (início e término) é um filtro só.
  const filterCount = [status, advertiser, from || to].filter(Boolean).length;
  // O vazio diz a causa real: busca, filtros, aba ou nenhuma campanha.
  const emptyBlock = searching && !filtersOn ? (
    <div className={l.empty}>
      <h3>Nada encontrado para “{query.trim()}”</h3>
      <p>Busque pelo nome, {operator ? 'anunciante, ' : ''}ativo ou número da campanha.</p>
      <Button size="sm" onClick={() => setQuery('')}>
        Limpar busca
      </Button>
    </div>
  ) : filtersOn ? (
    <div className={l.empty}>
      <h3>Nenhuma campanha</h3>
      <p>{operator ? 'Nenhuma campanha do portal atende aos filtros escolhidos.' : 'Nenhuma campanha sua atende aos filtros escolhidos.'}</p>
      <Button
        size="sm"
        onClick={() => {
          clearFilters();
          setQuery('');
        }}
      >
        Limpar filtros{searching ? ' e busca' : ''}
      </Button>
    </div>
  ) : tab !== 'todas' ? (
    <div className={l.empty}>
      <h3>Nenhuma campanha {TAB_PHRASE[tab]}</h3>
      <Button size="sm" variant="ghost" onClick={() => setTab('todas')}>
        Ver todas
      </Button>
    </div>
  ) : (
    <div className={l.empty}>
      <h3>Nenhuma campanha ainda</h3>
      <Button size="sm" variant="primary" icon={Plus} onClick={() => router.push('/dashboardv3/campanhas/nova' as Route)}>
        Nova campanha
      </Button>
    </div>
  );

  const table = (list: Campaign[], footer?: ReactNode) => (
    <div className={l.tableWrap}>
      <DataTable
        label={operator ? 'Campanhas do portal' : 'Minhas campanhas'}
        rows={list}
        rowKey={(campaign) => campaign.id}
        columns={columns}
        density="compact"
        fixed
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        sort={sort}
        onSort={setSort}
        onRowClick={(campaign) => router.push(detailHref(campaign))}
        empty={emptyBlock}
        footer={footer}
      />
    </div>
  );

  /** Celular: cada campanha vira uma linha de cartão com seleção, chave, resumo e menu de ações. */
  const cardRow = (campaign: Campaign) => {
    const d = campaign.draft;
    const item = byId(ADVERTISERS, d.advertiserId);
    const budget = budgetText(campaign);
    const period = periodText(campaign);
    const links = linkTotal(campaign);
    const live = campaign.status === 'active';
    const isSelected = selected.has(campaign.id);
    const actions: MenuItem[] = [
      { label: 'Ver', icon: Eye, onSelect: () => router.push(detailHref(campaign)) },
      // Celular: a aba fica abaixo do cabeçalho e da jornada; o link já rola até ela (#abas).
      { label: 'Analytics', icon: BarChart3, onSelect: () => router.push(detailHref(campaign, '?aba=analytics#abas')) },
      // No celular os vínculos ("N vínculos", com o detalhamento) ficam aqui: a linha do cartão não comporta.
      ...(links > 0
        ? [{ label: `${links} ${links === 1 ? 'vínculo' : 'vínculos'}`, icon: Link2, onSelect: () => setLinksFor(campaign) }]
        : []),
      ...(EDITABLE.includes(campaign.status)
        ? [{ label: 'Editar', icon: Pencil, onSelect: () => router.push(detailHref(campaign, '/editar')) }]
        : []),
      ...(operator
        ? [
            {
              label: 'Excluir',
              icon: Trash2,
              danger: !live,
              disabled: live,
              description: live ? LIVE_DELETE : undefined,
              onSelect: () => askDelete(campaign),
            },
          ]
        : []),
    ];
    return (
      <li key={campaign.id} className={l.cardRow} data-selected={isSelected || undefined} onClick={() => router.push(detailHref(campaign))}>
        <span className={l.cardCheck} onClick={stop}>
          <Checkbox aria-label={`Selecionar ${d.name}`} checked={isSelected} onChange={() => toggleOne(campaign.id)} />
        </span>
        <DeliveryToggle campaign={campaign} operator={operator} onStart={setToStart} />
        <div className={l.cardMain}>
          <Link href={detailHref(campaign)} className={l.cardName} onClick={stop}>
            {d.name}
          </Link>
          {/* Duas linhas fixas, sem quebra: status (e anunciante) em cima; verba e período embaixo.
              O anunciante cede com reticências; a altura do cartão é sempre a mesma. */}
          <span className={l.cardMeta}>
            <span className={l.cardStatus}>
              <Badge variant="text" tone={STATUS[campaign.status].tone} live={STATUS[campaign.status].live}>
                {STATUS[campaign.status].label}
              </Badge>
            </span>
            {operator && item && (
              <span className={l.cardAdvertiser} title={item.name}>
                {item.name}
              </span>
            )}
          </span>
          {(budget || period) && (
            <span className={l.cardMeta}>
              {budget && <span>{budget}</span>}
              {period && <span>{period}</span>}
            </span>
          )}
        </div>
        <span className={l.cardMenu} onClick={stop}>
          <Menu
            align="end"
            label="Ações"
            sections={[{ items: actions }]}
            trigger={(props) => <IconButton {...props} label={`Ações de ${d.name}`} icon={Ellipsis} variant="ghost" size="sm" />}
          />
        </span>
      </li>
    );
  };
  const cards = (list: Campaign[], footer?: ReactNode) => (
    <div className={l.cards}>
      {list.length ? <ul className={l.cardList}>{list.map(cardRow)}</ul> : <div className={l.cardsEmpty}>{emptyBlock}</div>}
      {footer}
    </div>
  );
  const listing = (list: Campaign[], footer?: ReactNode) => (phone ? cards(list, footer) : table(list, footer));

  const selectedLive = campaigns.filter((campaign) => selected.has(campaign.id) && campaign.status === 'active').length;
  const starts = rows.map((campaign) => campaign.draft.startDate).filter(Boolean).sort();
  const ends = rows.map((campaign) => campaign.draft.endDate).filter(Boolean).sort();
  const range = starts[0] && ends.length ? `${dateShort(starts[0])} – ${dateShort(ends[ends.length - 1] ?? '')}` : '';
  const liveNow = rows.filter((campaign) => campaign.status === 'active').length;

  return (
    <>
      <div className={l.head}>
        <div className={l.headText}>
          <h1 className={l.title}>{operator ? 'Campanhas' : 'Minhas campanhas'}</h1>
          <p className={l.lede}>
            {operator
              ? `${rows.length} de ${scoped.length} ${scoped.length === 1 ? 'campanha' : 'campanhas'} do portal.`
              : `${scoped.length} ${scoped.length === 1 ? 'campanha sua' : 'campanhas suas'} neste portal.`}
          </p>
        </div>
        <div className={l.headActions}>
          <Button variant="primary" icon={Plus} onClick={() => router.push('/dashboardv3/campanhas/nova' as Route)}>
            Nova campanha
          </Button>
        </div>
      </div>

      {reasons.length > 0 && (
        <div className={l.alerts}>
          {reasons.map((campaign) => {
            const at = campaign.reason ? new Date(campaign.reason.at) : undefined;
            return (
              <div key={campaign.id} className={l.reasonAlert} data-tone={campaign.status === 'adjustments_requested' ? 'orange' : 'red'} role="status">
                <CircleAlert className={l.reasonIcon} aria-hidden="true" />
                <div className={l.reasonText}>
                  <strong>
                    {campaign.draft.name} — {STATUS[campaign.status].label}
                  </strong>
                  <p>{campaign.reason?.text}</p>
                  {at && (
                    <span>
                      Em {at.toLocaleDateString('pt-BR')} às {at.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                {campaign.status === 'adjustments_requested' && (
                  <Button size="sm" onClick={() => router.push(detailHref(campaign, '/editar'))}>
                    Ajustar e reenviar
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className={l.bar}>
        <Tabs
          label="Recortes por status"
          value={tab}
          onChange={setTab}
          items={TABS.map((item) => ({ value: item.value, label: item.label, count: counts[item.value] }))}
        />
        <div className={l.barEnd}>
          <div className={l.search}>
            <SearchField
              size="sm"
              value={query}
              onValueChange={setQuery}
              placeholder={operator ? 'Campanha, anunciante ou nº' : 'Campanha ou nº'}
              label={operator ? 'Buscar por nome, anunciante, ativo ou número' : 'Buscar por nome, ativo ou número'}
            />
          </div>
          <Button size="sm" variant={showFilters || filterCount ? 'soft' : 'ghost'} icon={ListFilter} aria-expanded={showFilters} onClick={() => setShowFilters((value) => !value)}>
            Filtros{filterCount ? ` · ${filterCount}` : ''}
          </Button>
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
            <IconButton label="Exportar" icon={Download} variant="ghost" size="sm" disabled={!rows.length} onClick={() => exportCsv(rows)} />
          </Tooltip>
        </div>
      </div>

      {showFilters && (
        <div className={l.toolbar} role="search">
          <div className={l.filter}>
            <Select
              size="sm"
              label="Status"
              value={status}
              onChange={(value) => {
                setStatus(value);
                // Um status fora da aba atual levaria a uma lista vazia sem motivo aparente.
                const tabStatuses = TABS.find((item) => item.value === tab)?.statuses;
                if (value && tabStatuses && !tabStatuses.includes(value as CampaignStatus)) setTab('todas');
              }}
              placeholder="Todos os status"
              options={[{ value: '', label: 'Todos os status' }, ...STATUS_ORDER.map((key) => ({ value: key, label: STATUS[key].label }))]}
            />
          </div>
          {operator && (
            <div className={l.filter}>
              <Select
                size="sm"
                label="Anunciante"
                value={advertiser}
                onChange={setAdvertiser}
                placeholder="Todos os anunciantes"
                searchable
                options={[
                  { value: '', label: 'Todos os anunciantes' },
                  ...ADVERTISERS.filter((item) => campaigns.some((campaign) => campaign.draft.advertiserId === item.id)).map((item) => ({
                    value: item.id,
                    label: item.name,
                    leading: <BrandMark name={item.name} size="xs" variant="soft" decorative />,
                  })),
                ]}
              />
            </div>
          )}
          <div className={l.date}>
            <DateRangePicker
              size="sm"
              aria-label="Período"
              placeholder="Qualquer período"
              clearable
              duration={false}
              start={from}
              end={to}
              onChange={(range) => {
                setFrom(range.start);
                setTo(range.end);
              }}
            />
          </div>
          {filtersOn && (
            <Button size="sm" variant="ghost" icon={X} onClick={clearFilters}>
              Limpar filtros
            </Button>
          )}
        </div>
      )}

      {view === 'grupos' ? (
        <div className={l.groups}>
          {BUCKETS.map((group) => {
            const list = rows.filter((campaign) => group.statuses.includes(campaign.status));
            if (!list.length) return null;
            const closed = collapsed[group.key];
            return (
              <section key={group.key} className={l.group} aria-label={group.label}>
                <button
                  type="button"
                  className={l.groupHead}
                  aria-expanded={!closed}
                  onClick={() => setCollapsed((value) => ({ ...value, [group.key]: !value[group.key] }))}
                >
                  <ChevronDown className={l.groupChevron} aria-hidden="true" />
                  <span>{group.label}</span>
                  <span className={l.groupCount}>{list.length}</span>
                </button>
                {!closed && listing(list)}
              </section>
            );
          })}
          {rows.length === 0 && listing([])}
          {rows.length > 0 && (
            <p className={l.foot}>
              <span>
                {rows.length} {rows.length === 1 ? 'campanha' : 'campanhas'}
                {range && ` · ${range}`}
              </span>
              <span>{liveNow} no ar agora</span>
            </p>
          )}
        </div>
      ) : (
        listing(
          pageRows,
          rows.length > 0 ? (
            <Pagination
              page={page}
              pageSize={pageSize}
              total={rows.length}
              noun="campanhas"
              onPageChange={setPage}
              onPageSizeChange={
                phone
                  ? undefined
                  : (size) => {
                      setPageSize(size);
                      setPage(1);
                    }
              }
            />
          ) : undefined,
        )
      )}
      <div className={l.bulkDock}>
        <BulkBar
          count={selected.size}
          noun={selected.size === 1 ? 'selecionada' : 'selecionadas'}
          onClear={() => setSelected(new Set())}
          actions={[
            { label: 'Exportar', icon: Download, onSelect: () => exportCsv(campaigns.filter((campaign) => selected.has(campaign.id))) },
            ...(operator
              ? [
                  {
                    label: 'Excluir',
                    icon: Trash2,
                    danger: true,
                    // Só campanhas no ar na seleção: não há o que excluir.
                    disabled: selectedLive === selected.size,
                    hint: selectedLive === selected.size ? LIVE_DELETE : undefined,
                    onSelect: () => {
                      const targets = campaigns.filter((campaign) => selected.has(campaign.id));
                      const deletable = targets.filter((campaign) => campaign.status !== 'active');
                      if (!deletable.length) return;
                      setToDelete({ list: deletable, skipped: targets.length - deletable.length });
                    },
                  },
                ]
              : []),
          ]}
        />
      </div>

      <Dialog
        open={toDelete.list.length > 0}
        onClose={closeDelete}
        size="sm"
        divided={false}
        title={toDelete.list.length === 1 ? `Excluir ${toDelete.list[0]?.draft.name ?? ''}?` : `Excluir ${toDelete.list.length} campanhas?`}
        description={`${DELETE_TEXT}${toDelete.skipped > 0 ? ` ${toDelete.skipped} em veiculação ${toDelete.skipped === 1 ? 'fica' : 'ficam'} de fora.` : ''}`}
        footer={
          <>
            <Button data-autofocus onClick={closeDelete}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                const ids = toDelete.list.map((campaign) => campaign.id);
                ids.forEach((id) => store.remove(id));
                setSelected((current) => {
                  const next = new Set(current);
                  ids.forEach((id) => next.delete(id));
                  return next;
                });
                closeDelete();
                toast(ids.length === 1 ? 'Campanha excluída e estoque liberado.' : `${ids.length} campanhas excluídas e estoque liberado.`);
              }}
            >
              {toDelete.list.length === 1 ? 'Excluir' : `Excluir ${toDelete.list.length}`}
            </Button>
          </>
        }
      >
        {null}
      </Dialog>

      <Dialog
        open={Boolean(linksFor)}
        onClose={() => setLinksFor(null)}
        size="sm"
        divided={false}
        title={linksFor ? `${linkTotal(linksFor)} ${linkTotal(linksFor) === 1 ? 'vínculo' : 'vínculos'}` : ''}
        description={linksFor?.draft.name}
      >
        {linksFor && (
          <div className={l.linksSheet}>
            <LinksGroups campaign={linksFor} />
          </div>
        )}
      </Dialog>

      <Dialog
        open={Boolean(toStart)}
        onClose={() => setToStart(null)}
        size="sm"
        divided={false}
        title="Iniciar a veiculação agora?"
        description={toStart?.draft.startDate ? `O período contratado começa em ${dateBR(toStart.draft.startDate)}.` : 'A campanha entra no ar imediatamente.'}
        footer={
          <>
            <Button data-autofocus onClick={() => setToStart(null)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (toStart) {
                  store.transition(toStart.id, 'active');
                  toast('Veiculação iniciada.', { description: toStart.draft.name });
                }
                setToStart(null);
              }}
            >
              Iniciar veiculação
            </Button>
          </>
        }
      >
        {null}
      </Dialog>
    </>
  );
}
