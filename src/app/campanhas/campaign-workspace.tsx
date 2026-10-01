'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type SetStateAction } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  CircleCheck,
  Rows3,
  Tag,
  LayoutGrid,
  ListFilter,
  List,
  Plus,
  Search,
  SlidersHorizontal,
  Users2,
  X,
} from 'lucide-react';
import { useCampaigns, type WorkspaceState } from './campaign-context';
import { CampaignStatusLabel } from './campaign-status';
import { CampaignTable, type TableDensity } from './campaign-table';
import { CampaignMonitor } from './campaign-monitor';
import {
  campaignCsv,
  currency,
  delivery,
  filterCampaigns,
  number,
  shortDate,
  statusLabels,
  type Campaign,
  type Direction,
} from './campaign-data';
import s from './pilot.module.css';
import t from './campaign-table.module.css';
import r from './campaign-reference.module.css';

export function Status({ campaign }: { campaign: Campaign }) {
  return <CampaignStatusLabel status={campaign.status} />;
}

export function BrandTile({ campaign, large = false }: { campaign: Campaign; large?: boolean }) {
  return (
    <span
      aria-hidden
      className={`${s.brandTile} ${large ? s.largeTile : ''}`}
      data-identity={campaign.identity}
    >
      {campaign.initials}
    </span>
  );
}

export function Delivery({ campaign }: { campaign: Campaign }) {
  if (!['active', 'paused', 'completed'].includes(campaign.status))
    return <span className={s.notStarted}>Não iniciada</span>;
  const progress = delivery(campaign);
  return (
    <div
      className={s.delivery}
      aria-label={`${progress}% da meta de impressões: ${number(campaign.delivered)} de ${number(campaign.target)}`}
    >
      <div className={s.deliveryBars} aria-hidden>
        {Array.from({ length: 20 }, (_, i) => (
          <i key={i} data-filled={i < Math.round(progress / 5)} />
        ))}
      </div>
      <span>
        {progress}
        <small>%</small>
      </span>
    </div>
  );
}

function FlightTimeline({ rows }: { rows: Campaign[] }) {
  const origin = Date.UTC(2026, 8, 1);
  const day = 86400000;
  return (
    <div className={s.flightView}>
      <div className={s.flightHeader}>
        <span>Campanha</span>
        <div>
          <span>01 set</span>
          <span>15 set</span>
          <span>01 out</span>
          <span>15 out</span>
          <span>31 out</span>
        </div>
      </div>
      {rows.map((row) => {
        const start = Math.max(0, (Date.parse(row.start) - origin) / day);
        const duration = Math.min(
          61 - start,
          (Date.parse(row.end) - Date.parse(row.start)) / day + 1,
        );
        return (
          <div className={s.flightRow} key={row.id}>
            <Link className={s.flightName} href={`/campanhas/${row.id}`}>
              <BrandTile campaign={row} />
              <div>
                <strong>{row.advertiser}</strong>
                <span>{row.name}</span>
                <small>{statusLabels[row.status]}</small>
              </div>
            </Link>
            <div className={s.flightTrack}>
              <div className={s.flightGrid} aria-hidden="true">
                {Array.from({ length: 4 }, (_, index) => (
                  <span key={index} />
                ))}
              </div>
              <Link
                href={`/campanhas/${row.id}`}
                className={s.flightBar}
                data-status={row.status}
                style={{ left: `${(start / 61) * 100}%`, width: `${(duration / 61) * 100}%` }}
                aria-label={`${row.name}: ${shortDate(row.start)} a ${shortDate(row.end)}, ${statusLabels[row.status]}`}
              >
                <span>
                  {shortDate(row.start)} — {shortDate(row.end)}
                </span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        );
      })}
      <p className={s.viewNote}>
        Veiculação <span>·</span> Períodos contratados de setembro e outubro de 2026. Clique em uma
        faixa para abrir a campanha.
      </p>
    </div>
  );
}

function Portfolio({ rows }: { rows: Campaign[] }) {
  return (
    <div className={s.portfolio}>
      {rows.map((row) => (
        <Link className={s.campaignCard} key={row.id} href={`/campanhas/${row.id}`}>
          <div className={s.creative} data-identity={row.identity}>
            <span className={s.creativeBrand}>{row.advertiser}</span>
            <div className={s.creativeTitle}>{row.name}</div>
            <span className={s.creativeCaption}>
              Composição ilustrativa <ArrowUpRight size={16} />
            </span>
          </div>
          <div className={s.cardBody}>
            <Status campaign={row} />
            <h2>{row.name}</h2>
            <div className={s.cardMeta}>
              <span>
                {shortDate(row.start)} — {shortDate(row.end)}
              </span>
              <strong>{currency(row.budget)}</strong>
            </div>
            <Delivery campaign={row} />
          </div>
        </Link>
      ))}
    </div>
  );
}

export function CampaignWorkspace({
  initialDirection = 'monitoramento',
}: {
  initialDirection?: Direction;
}) {
  const { rows, workspace, setWorkspace, setDeliveryEnabled } = useCampaigns();
  const {
    query,
    status,
    advertiser,
    format = 'all',
    period,
    sort,
    selected,
    extraFilters,
    density,
  } = workspace;
  const direction = workspace.direction ?? initialDirection;
  function update<K extends keyof WorkspaceState>(
    key: K,
    value: SetStateAction<WorkspaceState[K]>,
  ) {
    setWorkspace((current) => ({
      ...current,
      [key]: typeof value === 'function' ? value(current[key]) : value,
    }));
  }
  const setQuery = (value: string) => update('query', value);
  const setStatus = (value: string) => update('status', value);
  const setAdvertiser = (value: string) => update('advertiser', value);
  const setPeriod = (value: string) => update('period', value);
  const setSort = (value: 'asc' | 'desc') => update('sort', value);
  const setDirection = (value: Direction) => update('direction', value);
  const setSelected = (value: SetStateAction<string[]>) => update('selected', value);
  const setExtraFilters = (value: boolean) => update('extraFilters', value);
  const [notice, setNotice] = useState('');
  const attentionTab = useRef<HTMLButtonElement>(null);
  const visible = filterCampaigns(rows, { query, status, advertiser, format, period }).sort(
    (a, b) => (sort ? (a.budget - b.budget) * (sort === 'asc' ? 1 : -1) : 0),
  );
  const selectedVisible = visible.filter((row) => selected.includes(row.id));
  const active = rows.filter((row) => row.status === 'active');
  const attention = rows.filter(
    (row) => row.status === 'submitted' || row.status === 'adjustments',
  );
  const statuses = [
    { id: 'all', label: 'Todas as campanhas', count: rows.length },
    { id: 'active', label: 'Em veiculação', count: active.length },
    { id: 'attention', label: 'Precisam de atenção', count: attention.length },
    { id: 'draft', label: 'Rascunhos', count: rows.filter((row) => row.status === 'draft').length },
  ];
  const advertisers = [...new Set(rows.map((row) => row.advertiser))].sort();
  const formats = [...new Set(rows.flatMap((row) => row.assets))].sort();

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  function resetFilters() {
    setQuery('');
    setStatus('all');
    setAdvertiser('all');
    update('format', 'all');
    setPeriod('all');
    setSelected([]);
  }
  function changeDirection(value: Direction) {
    setDirection(value);
    const url = new URL(window.location.href);
    url.searchParams.set('visao', value);
    window.history.replaceState(null, '', url);
  }
  function exportRows() {
    const exported = selectedVisible.length ? selectedVisible : visible;
    const url = URL.createObjectURL(
      new Blob([campaignCsv(exported)], { type: 'text/csv;charset=utf-8;' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mediaon-campanhas-demonstracao.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(
      exported.length === 1
        ? '1 campanha fictícia exportada.'
        : `${exported.length} campanhas fictícias exportadas.`,
    );
  }
  function changeDelivery(campaign: Campaign, enabled: boolean) {
    setDeliveryEnabled(campaign.id, enabled);
    setNotice(`${campaign.name}: ${enabled ? 'retomada' : 'pausada'} somente na demonstração.`);
  }

  return (
    <div className={`${t.page} ${r.referencePage}`} data-reference-page>
      <label className={`${t.search} ${r.globalSearch}`}>
        <Search size={17} aria-hidden="true" />
        <span className={s.srOnly}>Buscar campanhas</span>
        <input
          type="search"
          placeholder="Buscar por nome ou anunciante..."
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelected([]);
          }}
        />
      </label>
      {attention.length > 0 && (
        <aside
          className={`${t.infoBanner} ${r.infoBanner}`}
          aria-labelledby="campaign-review-title"
        >
          <div className={t.infoCopy}>
            <h2 id="campaign-review-title">
              {attention.length === 1
                ? '1 campanha aguarda sua revisão'
                : `${attention.length} campanhas aguardam sua revisão`}
            </h2>
            <p>Confira os materiais em aprovação e os ajustes solicitados.</p>
          </div>
          <button
            className={t.infoAction}
            onClick={() => {
              setWorkspace((current) => ({
                ...current,
                status: 'attention',
                query: '',
                advertiser: 'all',
                format: 'all',
                period: 'all',
                selected: [],
              }));
              attentionTab.current?.focus();
            }}
          >
            Ver pendências
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </aside>
      )}
      <div className={`${t.heading} ${r.heading}`}>
        <div>
          <h1>Campanhas</h1>
        </div>
        <div className={t.headingActions}>
          <Link className={`${s.primaryButton} ${t.createButton}`} href="/campanhas/nova">
            <Plus size={18} />
            Nova campanha
          </Link>
        </div>
      </div>

      <section className={`${t.workspace} ${r.workspace}`} aria-label="Biblioteca de campanhas">
        <div className={r.filterGrid}>
          <div className={r.filterField}>
            <label htmlFor="anunciante">Anunciante</label>
            <div className={t.select}>
              <Users2 size={16} aria-hidden="true" />
              <select
                id="anunciante"
                value={advertiser}
                onChange={(e) => {
                  setAdvertiser(e.target.value);
                  setSelected([]);
                }}
              >
                <option value="all">Todos os anunciantes</option>
                {advertisers.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
              <ChevronDown size={13} />
            </div>
          </div>
          <div className={r.filterField}>
            <label htmlFor="etapa-campanha">Status</label>
            <div className={t.select}>
              <CircleCheck size={16} aria-hidden="true" />
              <select
                id="etapa-campanha"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setSelected([]);
                }}
              >
                <option value="all">Todos os status</option>
                <option value="attention">Precisam de atenção</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} aria-hidden="true" />
            </div>
          </div>
          <div className={r.filterField}>
            <label htmlFor="formato-campanha">Formato</label>
            <div className={t.select}>
              <Tag size={16} aria-hidden="true" />
              <select
                id="formato-campanha"
                value={format}
                onChange={(event) => {
                  update('format', event.target.value);
                  setSelected([]);
                }}
              >
                <option value="all">Todos os formatos</option>
                {formats.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
              <ChevronDown size={13} aria-hidden="true" />
            </div>
          </div>
          <div className={r.filterField}>
            <label htmlFor="ordenar-campanhas">Ordenar por</label>
            <div className={t.select}>
              <SlidersHorizontal size={16} aria-hidden="true" />
              <select
                id="ordenar-campanhas"
                value={sort ?? 'default'}
                onChange={(event) =>
                  update(
                    'sort',
                    event.target.value === 'default'
                      ? null
                      : (event.target.value as 'asc' | 'desc'),
                  )
                }
              >
                <option value="default">Ordem original</option>
                <option value="desc">Maior verba</option>
                <option value="asc">Menor verba</option>
              </select>
              <ChevronDown size={13} aria-hidden="true" />
            </div>
          </div>
        </div>
        <div className={`${t.workspaceHeader} ${r.workspaceHeader}`}>
          <div className={t.tabs} role="group" aria-label="Filtrar por etapa">
            {statuses.map((item) => (
              <button
                key={item.id}
                ref={item.id === 'attention' ? attentionTab : undefined}
                aria-pressed={status === item.id}
                onClick={() => {
                  setStatus(item.id);
                  setSelected([]);
                }}
              >
                {item.label}
                <span>{item.count}</span>
              </button>
            ))}
          </div>
          <div className={t.views} role="group" aria-label="Direção visual">
            {(
              [
                { id: 'monitoramento', label: 'Monitoramento', Icon: Rows3 },
                { id: 'operacao', label: 'Operação', Icon: List },
                { id: 'portfolio', label: 'Portfólio', Icon: LayoutGrid },
                { id: 'veiculacao', label: 'Veiculação', Icon: CalendarDays },
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                title={label}
                aria-label={label}
                aria-pressed={direction === id}
                onClick={() => changeDirection(id)}
              >
                <Icon size={17} />
              </button>
            ))}
          </div>
        </div>
        <div className={`${t.resultsBar} ${r.resultsBar}`}>
          <span aria-live="polite">
            <strong>{visible.length}</strong> {visible.length === 1 ? 'campanha' : 'campanhas'}
            {visible.length !== rows.length && <span> de {rows.length} no total</span>}
          </span>
          <div className={r.resultActions}>
            <button className={r.exportButton} onClick={exportRows} disabled={!visible.length}>
              <ArrowDownToLine size={14} />
              Exportar
            </button>
            <button
              className={r.periodButton}
              aria-label="Filtros"
              aria-expanded={extraFilters}
              aria-controls="filtros-periodo"
              onClick={() => setExtraFilters(!extraFilters)}
            >
              <CalendarDays size={16} />
              {period === 'all'
                ? 'Todos os períodos'
                : period === 'setembro'
                  ? 'Setembro de 2026'
                  : 'Outubro de 2026'}
              <ChevronDown size={13} />
            </button>
            {direction === 'operacao' && (
              <label className={`${t.select} ${t.density}`}>
                <span className={s.srOnly}>Densidade da tabela</span>
                <select
                  value={density}
                  onChange={(event) => update('density', event.target.value as TableDensity)}
                >
                  <option value="comfortable">Confortável</option>
                  <option value="compact">Compacta</option>
                </select>
                <ChevronDown size={13} />
              </label>
            )}
          </div>
        </div>
        {extraFilters && (
          <div className={`${s.filterPanel} ${r.periodPanel}`} id="filtros-periodo">
            <label htmlFor="periodo">
              <CalendarDays size={15} />
              Campanhas com veiculação em
            </label>
            <select
              id="periodo"
              value={period}
              onChange={(event) => {
                setPeriod(event.target.value);
                setSelected([]);
              }}
            >
              <option value="all">Qualquer período</option>
              <option value="setembro">Setembro de 2026</option>
              <option value="outubro">Outubro de 2026</option>
            </select>
            <button className={s.textButton} onClick={resetFilters}>
              Limpar filtros
            </button>
          </div>
        )}
        {(direction === 'portfolio' || direction === 'veiculacao') && (
          <div className={s.directionCaption}>
            <strong>{direction === 'portfolio' ? 'Portfólio' : 'Veiculação'}</strong>
            <span>
              {direction === 'portfolio'
                ? 'Mais presença visual. Campanhas vistas como um portfólio de marcas.'
                : 'O calendário no centro. Veja como as campanhas se encontram no tempo.'}
            </span>
          </div>
        )}
        {selectedVisible.length > 0 && (
          <div className={t.selectionTools}>
            <strong>
              {selectedVisible.length}{' '}
              {selectedVisible.length === 1 ? 'campanha selecionada' : 'campanhas selecionadas'}
            </strong>
            <button onClick={exportRows}>
              <ArrowDownToLine size={14} /> Exportar seleção
            </button>
            <button aria-label="Limpar seleção" onClick={() => setSelected([])}>
              <X size={16} />
            </button>
          </div>
        )}
        {visible.length === 0 ? (
          <div className={s.empty}>
            <ListFilter size={26} />
            <h2>Nenhuma campanha por aqui</h2>
            <p>Tente outro nome ou remova os filtros para ampliar a busca.</p>
            <button className={s.secondaryButton} onClick={resetFilters}>
              Limpar busca e filtros
            </button>
          </div>
        ) : direction === 'monitoramento' ? (
          <CampaignMonitor
            rows={visible}
            selected={selected}
            setSelected={setSelected}
            onDeliveryChange={changeDelivery}
          />
        ) : direction === 'portfolio' ? (
          <Portfolio rows={visible} />
        ) : direction === 'veiculacao' ? (
          <FlightTimeline rows={visible} />
        ) : (
          <CampaignTable
            rows={visible}
            density={density}
            selected={selected}
            setSelected={setSelected}
            sort={sort}
            onSort={() => setSort(sort === 'desc' ? 'asc' : 'desc')}
            onDeliveryChange={changeDelivery}
          />
        )}
        <div className={t.footer}>
          <span>
            Verba das campanhas exibidas{' '}
            <strong>{currency(visible.reduce((total, row) => total + row.budget, 0))}</strong>
          </span>
        </div>
      </section>
      <div className={s.toastRegion} role="status">
        {notice && (
          <div className={s.toast}>
            <CircleCheck size={18} />
            {notice}
            <button aria-label="Fechar aviso" onClick={() => setNotice('')}>
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
