'use client';

import type { Notify } from './toasts';

import { Fragment, useState, type ReactNode } from 'react';
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  ListFilter,
  ListTree,
  Pause,
  Play,
  Rows3,
  Search,
  X,
} from 'lucide-react';
import { useCampaigns } from '../campanhas/campaign-context';
import { CampaignDeliveryToggle } from './campaign-toggle';
import {
  delivery,
  filterCampaigns,
  number,
  shortDate,
  statusLabels,
  type Campaign,
} from '../campanhas/campaign-data';
import { CampaignRows, campaignGroups } from './campaign-screen';
import { SelectControl, selectOptions } from './controls';
import { Empty, Group, Status, exportRecords, formatCurrency } from './workspace-ui';
import { navigate, screenHref, type ViewMode } from './workspace-data';
import s from './dashboard.module.css';
import t from './table-explorer.module.css';

const directions = [
  {
    id: 'compacta',
    name: 'Operação compacta',
    icon: Rows3,
    number: '01',
    summary: 'Mais linhas. Menos cliques.',
    use: 'Campanhas, inventário e cadastros',
    description: 'Lista contínua, seleção em lote e controles à mão para tocar a operação diária.',
    tradeoff: 'Prioriza agilidade; o contexto completo fica nos detalhes.',
  },
  {
    id: 'performance',
    name: 'Leitura de performance',
    icon: BarChart3,
    number: '02',
    summary: 'Os números vêm primeiro.',
    use: 'Entrega de mídia e disponibilidade',
    description:
      'Métricas alinhadas, barras de entrega e totais para comparar campanhas lado a lado.',
    tradeoff: 'Facilita a comparação; precisa de mais espaço horizontal.',
  },
  {
    id: 'contexto',
    name: 'Revisão com contexto',
    icon: ListTree,
    number: '03',
    summary: 'Abra uma linha. Veja o todo.',
    use: 'Aprovações, planejamento e pedidos',
    description:
      'Linhas mais abertas, formatos visíveis e detalhes que se expandem sem sair da lista.',
    tradeoff: 'Dá mais contexto; exibe menos registros por tela.',
  },
] as const;
type Variant = (typeof directions)[number]['id'] | 'atual';
type SortKey = 'name' | 'budget' | 'delivery';
type Sort = 'original' | `${SortKey}-${'asc' | 'desc'}`;
const canToggle = (row: Campaign) => row.status === 'active' || row.status === 'paused';
const pending = (row: Campaign) => Math.max(0, row.target - row.delivered);
const sortOptions: { value: Sort; label: string }[] = [
  { value: 'original', label: 'Ordem original' },
  { value: 'name-asc', label: 'Nome · A a Z' },
  { value: 'name-desc', label: 'Nome · Z a A' },
  { value: 'budget-desc', label: 'Maior verba' },
  { value: 'budget-asc', label: 'Menor verba' },
  { value: 'delivery-desc', label: 'Maior entrega' },
  { value: 'delivery-asc', label: 'Menor entrega' },
];

function Miniature({ variant }: { variant: string }) {
  return (
    <span className={t.miniature} data-variant={variant} aria-hidden="true">
      <span className={t.miniHead}>
        <i />
        <i />
        <i />
      </span>
      {[0, 1, 2].map((row) => (
        <span className={t.miniRow} key={row}>
          <i />
          <i />
          <i style={{ width: `${[78, 51, 65][row]}%` }} />
        </span>
      ))}
    </span>
  );
}

function Progress({ row }: { row: Campaign }) {
  return (
    <span className={t.progress} aria-label={`${delivery(row)}% da meta de impressões`}>
      <span className={t.track} aria-hidden="true">
        <i style={{ width: `${delivery(row)}%` }} />
      </span>
      <span>{delivery(row)}%</span>
    </span>
  );
}

function SortHeading({
  field,
  children,
  sort,
  change,
  numeric = false,
}: {
  field: SortKey;
  children: ReactNode;
  sort: Sort;
  change: (value: Sort) => void;
  numeric?: boolean;
}) {
  const active = sort.startsWith(`${field}-`);
  const descending = sort.endsWith('-desc');
  const Icon = active ? (descending ? ArrowDown : ArrowUp) : ArrowUpDown;
  return (
    <th
      scope="col"
      className={numeric ? t.numeric : undefined}
      aria-sort={active ? (descending ? 'descending' : 'ascending') : 'none'}
    >
      <button
        className={t.sortButton}
        onClick={() => change(`${field}-${active && !descending ? 'desc' : 'asc'}`)}
      >
        {children}
        <Icon size={12} aria-hidden="true" />
      </button>
    </th>
  );
}

function RowName({
  row,
  mode,
  secondary = false,
}: {
  row: Campaign;
  mode: ViewMode;
  secondary?: boolean;
}) {
  return (
    <div className={t.rowIdentity}>
      {secondary && (
        <span className={s.avatar} data-identity={row.identity} aria-hidden="true">
          {row.initials}
        </span>
      )}
      <div>
        <a
          className={t.name}
          href={screenHref('campanhas', mode, row.id)}
          title={row.name}
          onClick={(event) => {
            event.preventDefault();
            navigate('campanhas', mode, row.id);
          }}
        >
          {row.name}
        </a>
        {secondary && <span className={t.secondary}>{row.advertiser}</span>}
      </div>
    </div>
  );
}

export function TableExplorer({
  mode,
  variantId,
  notice,
}: {
  mode: ViewMode;
  variantId: string | null;
  notice: Notify;
}) {
  const variant: Variant =
    variantId === 'atual' || directions.some((item) => item.id === variantId)
      ? (variantId as Variant)
      : 'compacta';
  const direction = directions.find((item) => item.id === variant);
  const { rows, setDeliveryEnabled } = useCampaigns();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [advertiser, setAdvertiser] = useState('all');
  const [sort, setSort] = useState<Sort>('original');
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>('aurora');
  const scoped = mode === 'anunciante' ? rows.filter((row) => row.advertiser === 'Aurora') : rows;
  const visible = filterCampaigns(scoped, { query, status, advertiser, period: 'all' }).sort(
    (left, right) => {
      if (sort === 'original') return 0;
      const [key, order] = sort.split('-');
      const difference =
        key === 'name'
          ? left.name.localeCompare(right.name, 'pt-BR')
          : key === 'budget'
            ? left.budget - right.budget
            : delivery(left) - delivery(right);
      return difference * (order === 'desc' ? -1 : 1);
    },
  );
  const eligible = visible.filter(canToggle);
  const selectedRows = eligible.filter((row) => selected.includes(row.id));
  const allSelected = eligible.length > 0 && selectedRows.length === eligible.length;
  const totalBudget = visible.reduce((sum, row) => sum + row.budget, 0);
  const delivered = visible.reduce((sum, row) => sum + row.delivered, 0);
  const target = visible.reduce((sum, row) => sum + row.target, 0);
  const toggle = (row: Campaign, enabled: boolean) => {
    setDeliveryEnabled(row.id, enabled);
    notice(`${row.name}: veiculação ${enabled ? 'ativada' : 'desativada'}.`);
  };
  const bulkToggle = (enabled: boolean) => {
    selectedRows.forEach((row) => setDeliveryEnabled(row.id, enabled));
    notice(
      `${selectedRows.length} campanhas: veiculação ${enabled ? 'ativada' : 'desativada'} nesta prévia.`,
    );
    setSelected([]);
  };
  const reset = () => {
    setQuery('');
    setStatus('all');
    setAdvertiser('all');
    setSelected([]);
  };
  const exportVisible = () => {
    exportRecords(
      'exploracao-tabelas',
      [
        { key: 'name', label: 'Campanha' },
        { key: 'advertiser', label: 'Anunciante' },
        { key: 'status', label: 'Status' },
        { key: 'budget', label: 'Verba', type: 'currency' },
        { key: 'delivered', label: 'Impressões', type: 'number' },
        { key: 'target', label: 'Meta', type: 'number' },
      ],
      visible.map((row) => ({
        id: row.id,
        name: row.name,
        advertiser: row.advertiser,
        status: statusLabels[row.status],
        budget: row.budget,
        delivered: row.delivered,
        target: row.target,
      })),
    );
    notice(`${visible.length} campanhas exportadas para CSV.`);
  };

  return (
    <div className={t.explorer}>
      <div className={t.comparisonHeading}>
        <span>ESCOLHA UM MODELO PARA EXPERIMENTAR</span>
        <button
          className={t.reference}
          aria-pressed={variant === 'atual'}
          onClick={() => navigate('tabelas', mode, 'atual')}
        >
          <Rows3 size={14} />
          Comparar com a atual
        </button>
      </div>
      <div className={t.choices} role="group" aria-label="Modelos de tabela">
        {directions.map((item) => (
          <button
            key={item.id}
            className={t.choice}
            aria-pressed={variant === item.id}
            aria-label={item.name}
            onClick={() => navigate('tabelas', mode, item.id)}
          >
            <span className={t.choiceTop}>
              <span>{item.number}</span>
              {item.id === 'compacta' && <span className={t.recommended}>Minha sugestão</span>}
              <span className={t.radio}>{variant === item.id && <Check size={12} />}</span>
            </span>
            <Miniature variant={item.id} />
            <span className={t.choiceTitle}>
              <item.icon size={16} />
              {item.name}
            </span>
            <span className={t.choiceDescription}>{item.summary}</span>
          </button>
        ))}
      </div>
      <div className={t.directionNote}>
        <div>
          <strong>{direction?.name ?? 'Tabela atual · agrupada por etapa'}</strong>
          <p>
            {direction?.description ??
              'A referência aprovada, com grupos coloridos e linhas de densidade intermediária.'}
          </p>
        </div>
        <span>{direction?.use ?? 'Visão das etapas do fluxo'}</span>
      </div>

      <section aria-label="Prévia da tabela" className={t.preview}>
        <div className={t.previewHeading}>
          <h2>
            Campanhas <span>{scoped.length}</span>
          </h2>
          <span>Dados de demonstração · set–out, 2026</span>
        </div>
        <div className={t.filters}>
          <label className={`${s.search} ${t.search}`}>
            <Search size={15} aria-hidden="true" />
            <input
              aria-label="Buscar campanhas"
              placeholder="Buscar campanha ou anunciante…"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSelected([]);
              }}
            />
            {query && (
              <button
                aria-label="Limpar busca"
                onClick={() => {
                  setQuery('');
                  setSelected([]);
                }}
              >
                <X size={13} />
              </button>
            )}
          </label>
          <SelectControl
            compact
            label="Filtrar status da tabela"
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setSelected([]);
            }}
            options={[
              { value: 'all', label: 'Todos os status' },
              ...Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
            ]}
          />
          <SelectControl
            compact
            label="Filtrar anunciante da tabela"
            value={advertiser}
            onValueChange={(value) => {
              setAdvertiser(value);
              setSelected([]);
            }}
            options={[
              { value: 'all', label: 'Todos os anunciantes' },
              ...selectOptions([...new Set(scoped.map((row) => row.advertiser))]),
            ]}
          />
          <SelectControl
            compact
            label="Ordenar tabela"
            value={sort}
            onValueChange={(value) => setSort(value as Sort)}
            options={sortOptions}
          />
          <button
            className={t.export}
            onClick={exportVisible}
            aria-label="Exportar campanhas"
            title="Exportar campanhas filtradas para CSV"
          >
            <ArrowDownToLine size={15} />
            <span>Exportar</span>
          </button>
        </div>
        {variant === 'compacta' && visible.length > 0 && (
          <div className={t.bulk} data-selected={selectedRows.length > 0}>
            {selectedRows.length ? (
              <>
                <strong>{selectedRows.length} selecionadas</strong>
                <button
                  onClick={() => bulkToggle(true)}
                  disabled={selectedRows.every((row) => row.status === 'active')}
                >
                  <Play size={13} />
                  Ativar
                </button>
                <button
                  onClick={() => bulkToggle(false)}
                  disabled={selectedRows.every((row) => row.status === 'paused')}
                >
                  <Pause size={13} />
                  Pausar
                </button>
                <button className={t.clearSelection} onClick={() => setSelected([])}>
                  Limpar seleção
                  <X size={13} />
                </button>
              </>
            ) : (
              <>
                <ListFilter size={14} />
                <span>Selecione campanhas em veiculação ou pausadas para agir em lote.</span>
              </>
            )}
          </div>
        )}
        {variant === 'performance' && visible.length > 0 && (
          <dl className={t.metricStrip}>
            <div>
              <dt>Verba planejada</dt>
              <dd>{formatCurrency(totalBudget)}</dd>
            </div>
            <div>
              <dt>Impressões entregues</dt>
              <dd>
                {number(delivered)}
                <small> de {number(target)}</small>
              </dd>
            </div>
            <div>
              <dt>Entrega da seleção</dt>
              <dd>
                {target ? Math.round((delivered / target) * 100) : 0}%<small> da meta</small>
              </dd>
            </div>
          </dl>
        )}
        {visible.length === 0 ? (
          <Empty reset={reset} />
        ) : variant === 'atual' ? (
          <div className={t.current}>
            {campaignGroups.map((group) => {
              const groupRows = visible.filter((row) => group.statuses.includes(row.status));
              return (
                groupRows.length > 0 && (
                  <Group key={group.id} {...group} count={groupRows.length}>
                    <CampaignRows
                      rows={groupRows}
                      onToggle={toggle}
                      onOpen={(row) => navigate('campanhas', mode, row.id)}
                    />
                  </Group>
                )
              );
            })}
          </div>
        ) : (
          <div
            className={t.tableScroll}
            role="region"
            aria-label={`Tabela ${direction?.name}`}
            tabIndex={0}
          >
            <table className={t.table} data-variant={variant}>
              <caption className={s.srOnly}>Campanhas · {direction?.name}</caption>
              <colgroup>
                {variant === 'compacta' ? (
                  <>
                    <col style={{ width: 40 }} />
                    <col style={{ width: 240 }} />
                    <col style={{ width: 115 }} />
                    <col style={{ width: 144 }} />
                    <col style={{ width: 116 }} />
                    <col style={{ width: 118 }} />
                    <col style={{ width: 66 }} />
                  </>
                ) : variant === 'performance' ? (
                  <>
                    <col style={{ width: 270 }} />
                    <col style={{ width: 120 }} />
                    <col style={{ width: 118 }} />
                    <col style={{ width: 114 }} />
                    <col style={{ width: 145 }} />
                    <col style={{ width: 114 }} />
                    <col style={{ width: 70 }} />
                  </>
                ) : (
                  <>
                    <col style={{ width: 320 }} />
                    <col style={{ width: 190 }} />
                    <col style={{ width: 145 }} />
                    <col style={{ width: 165 }} />
                    <col style={{ width: 70 }} />
                    <col style={{ width: 45 }} />
                  </>
                )}
              </colgroup>
              <thead>
                <tr>
                  {variant === 'compacta' && (
                    <th scope="col" className={t.checkCell}>
                      <label className={t.checkTarget}>
                        <input
                          type="checkbox"
                          aria-label="Selecionar todas as campanhas elegíveis"
                          checked={allSelected}
                          disabled={eligible.length === 0}
                          ref={(node) => {
                            if (node) node.indeterminate = selectedRows.length > 0 && !allSelected;
                          }}
                          onChange={() =>
                            setSelected(allSelected ? [] : eligible.map((row) => row.id))
                          }
                        />
                      </label>
                    </th>
                  )}
                  <SortHeading field="name" sort={sort} change={setSort}>
                    Campanha
                  </SortHeading>
                  {variant === 'compacta' ? (
                    <>
                      <th scope="col">Anunciante</th>
                      <th scope="col">Status</th>
                      <SortHeading field="budget" sort={sort} change={setSort} numeric>
                        Verba
                      </SortHeading>
                      <SortHeading field="delivery" sort={sort} change={setSort}>
                        Entrega
                      </SortHeading>
                    </>
                  ) : variant === 'performance' ? (
                    <>
                      <SortHeading field="budget" sort={sort} change={setSort} numeric>
                        Verba
                      </SortHeading>
                      <th scope="col" className={t.numeric}>
                        Impressões
                      </th>
                      <th scope="col" className={t.numeric}>
                        Meta
                      </th>
                      <SortHeading field="delivery" sort={sort} change={setSort}>
                        Entrega
                      </SortHeading>
                      <th scope="col" className={t.numeric}>
                        A entregar
                      </th>
                    </>
                  ) : (
                    <>
                      <th scope="col">Formatos de mídia</th>
                      <th scope="col">Período</th>
                      <th scope="col">Status</th>
                    </>
                  )}
                  <th scope="col" className={t.center}>
                    Ativa
                  </th>
                  {variant === 'contexto' && (
                    <th scope="col">
                      <span className={s.srOnly}>Detalhes</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <Fragment key={row.id}>
                    <tr
                      data-selected={variant === 'compacta' && selected.includes(row.id)}
                      data-expanded={variant === 'contexto' && expanded === row.id}
                    >
                      {variant === 'compacta' && (
                        <td className={t.checkCell}>
                          <label className={t.checkTarget}>
                            <input
                              type="checkbox"
                              aria-label={`Selecionar ${row.name}`}
                              disabled={!canToggle(row)}
                              checked={selected.includes(row.id)}
                              title={
                                canToggle(row)
                                  ? 'Selecionar para ações de veiculação'
                                  : 'Veiculação indisponível nesta etapa'
                              }
                              onChange={() =>
                                setSelected((current) =>
                                  current.includes(row.id)
                                    ? current.filter((id) => id !== row.id)
                                    : [...current, row.id],
                                )
                              }
                            />
                          </label>
                        </td>
                      )}
                      <td className={t.identityCell}>
                        <RowName row={row} mode={mode} secondary={variant !== 'compacta'} />
                        {variant === 'performance' && (
                          <span className={t.metricStatus}>
                            <Status value={statusLabels[row.status]} />
                          </span>
                        )}
                      </td>
                      {variant === 'compacta' ? (
                        <>
                          <td className={t.muted}>{row.advertiser}</td>
                          <td>
                            <Status value={statusLabels[row.status]} />
                          </td>
                          <td className={t.numeric}>{formatCurrency(row.budget)}</td>
                          <td>
                            <Progress row={row} />
                          </td>
                        </>
                      ) : variant === 'performance' ? (
                        <>
                          <td className={t.numeric}>{formatCurrency(row.budget)}</td>
                          <td className={`${t.numeric} ${t.metricValue}`}>
                            {number(row.delivered)}
                          </td>
                          <td className={`${t.numeric} ${t.muted}`}>{number(row.target)}</td>
                          <td className={t.progressCell}>
                            <Progress row={row} />
                          </td>
                          <td className={`${t.numeric} ${t.muted}`}>{number(pending(row))}</td>
                        </>
                      ) : (
                        <>
                          <td>
                            <span className={t.assets}>
                              {row.assets.map((asset) => (
                                <span key={asset}>{asset}</span>
                              ))}
                            </span>
                          </td>
                          <td className={t.muted}>
                            {shortDate(row.start)} – {shortDate(row.end)}
                          </td>
                          <td>
                            <Status value={statusLabels[row.status]} />
                          </td>
                        </>
                      )}
                      <td className={`${s.toggleCell} ${t.toggleCell}`}>
                        <CampaignDeliveryToggle campaign={row} onChange={toggle} />
                      </td>
                      {variant === 'contexto' && (
                        <td className={t.expandCell}>
                          <button
                            className={t.expandButton}
                            aria-label={`Detalhes de ${row.name}`}
                            aria-expanded={expanded === row.id}
                            aria-controls={`table-detail-${row.id}`}
                            onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                          >
                            {expanded === row.id ? (
                              <ChevronDown size={17} />
                            ) : (
                              <ChevronRight size={17} />
                            )}
                          </button>
                        </td>
                      )}
                    </tr>
                    {variant === 'contexto' && (
                      <tr className={t.detailRow} hidden={expanded !== row.id}>
                        <td colSpan={6}>
                          <section
                            className={t.expandedDetail}
                            id={`table-detail-${row.id}`}
                            aria-label={`Planejamento de ${row.name}`}
                          >
                            <div className={t.detailSummary}>
                              <span>PLANEJAMENTO E ENTREGA</span>
                              <strong>{row.name}</strong>
                              <p>
                                {row.advertiser} · {statusLabels[row.status]}
                              </p>
                              <a
                                href={screenHref('campanhas', mode, row.id)}
                                onClick={(event) => {
                                  event.preventDefault();
                                  navigate('campanhas', mode, row.id);
                                }}
                              >
                                Abrir campanha
                                <ChevronRight size={13} />
                              </a>
                            </div>
                            <dl className={t.detailMetrics}>
                              <div>
                                <dt>Verba planejada</dt>
                                <dd>{formatCurrency(row.budget)}</dd>
                              </div>
                              <div>
                                <dt>Impressões</dt>
                                <dd>
                                  {number(row.delivered)} <small>/ {number(row.target)}</small>
                                </dd>
                              </div>
                              <div>
                                <dt>Formatos contratados</dt>
                                <dd>{row.assets.join(' · ')}</dd>
                              </div>
                              <div>
                                <dt>Entrega da meta</dt>
                                <dd>
                                  <Progress row={row} />
                                </dd>
                              </div>
                            </dl>
                          </section>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
              {variant === 'performance' && (
                <tfoot>
                  <tr>
                    <th scope="row">
                      Total · {visible.length} {visible.length === 1 ? 'campanha' : 'campanhas'}
                    </th>
                    <td className={t.numeric}>{formatCurrency(totalBudget)}</td>
                    <td className={t.numeric}>{number(delivered)}</td>
                    <td className={t.numeric}>{number(target)}</td>
                    <td>{target ? Math.round((delivered / target) * 100) : 0}% da meta</td>
                    <td className={t.numeric}>
                      {number(visible.reduce((sum, row) => sum + pending(row), 0))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
        <footer className={t.tableFooter}>
          <span>
            {visible.length} de {scoped.length} campanhas
          </span>
          <span>
            {variant === 'compacta'
              ? 'Seleção em lote · ações rápidas'
              : variant === 'performance'
                ? 'Totais calculados sobre os filtros'
                : variant === 'contexto'
                  ? 'Use a seta para expandir os detalhes'
                  : 'Grupos por etapa · referência aprovada'}
          </span>
        </footer>
      </section>
      <p className={t.tradeoff}>
        <strong>Onde esse modelo funciona melhor</strong>
        {direction?.tradeoff ??
          'Ajuda a acompanhar as etapas, com mais separação visual entre os registros.'}
      </p>
    </div>
  );
}
