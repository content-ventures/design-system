'use client';

import { useState } from 'react';
import { SelectControl, selectOptions } from './controls';
import { RecordEditor, type RecordChoices } from './record-editor';
import type { Notify } from './toasts';
import { RecordTable } from './record-table';
import { recordTableDefinition, selectRecords, type RecordSort } from './record-table-model';
import t from './record-table.module.css';
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  ClipboardList,
  ChevronRight,
  Pencil,
  Plus,
  Target,
} from 'lucide-react';

import {
  Empty,
  Status,
  SummaryStrip,
  Tabs,
  Toolbar,
  displayValue,
  exportRecords,
  toneFor,
} from './workspace-ui';
import {
  navigate,
  normalize,
  screens,
  type DemoRecord,
  type ScreenKey,
  type ViewMode,
} from './workspace-data';
import { formatCurrency as currency } from './workspace-ui';
import s from './dashboard.module.css';
import a from './application.module.css';

type ScreenProps = {
  screen: ScreenKey;
  records: DemoRecord[];
  recordId: string | null;
  mode: ViewMode;
  save: (record: DemoRecord) => void;
  notice: Notify;
  choices?: RecordChoices;
};
export function RecordScreen({
  screen,
  records,
  recordId,
  mode,
  save,
  notice,
  choices,
}: ScreenProps) {
  const config = screens[screen];
  const definition = recordTableDefinition(screen);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [facets, setFacets] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<RecordSort>(
    definition.sort ?? { key: 'name', direction: 'asc' },
  );
  const [view, setView] = useState('board');
  const [editing, setEditing] = useState(false);
  const statuses = [...new Set(records.map((record) => record.status))];
  const filtered = selectRecords(records, query, { status: filter, ...facets }, sort);
  const reset = () => {
    setQuery('');
    setFilter('all');
    setFacets({});
  };
  const store = (record: DemoRecord) => {
    save(record);
    setEditing(false);
    navigate(screen, mode);
    notice({
      title: 'Cadastro salvo',
      message: `${record.name} está disponível na lista.`,
      action: { label: 'Ver cadastro', onClick: () => navigate(screen, mode, record.id) },
    });
  };
  if (recordId === 'novo' && config.create)
    return <RecordEditor screen={screen} mode={mode} save={store} choices={choices} />;
  if (recordId) {
    const record = records.find((record) => record.id === recordId);
    if (!record) return <Empty reset={() => navigate(screen, mode)} />;
    if (editing && !config.readonly)
      return (
        <RecordEditor
          screen={screen}
          mode={mode}
          initial={record}
          choices={choices}
          save={store}
          cancel={() => setEditing(false)}
        />
      );
    return (
      <RecordDetail screen={screen} record={record} mode={mode} edit={() => setEditing(true)} />
    );
  }
  const leads = config.kind === 'leads';
  return (
    <>
      <Toolbar
        title={config.title}
        query={query}
        setQuery={setQuery}
        exportAction={() => {
          const fields = config.fields.map((field) => ({
            ...field,
            label:
              definition.columns.find((column) => column.key === field.key)?.label ?? field.label,
          }));
          if (screen === 'inventario')
            fields.push(
              { key: 'unit', label: 'Unidade de preço' },
              { key: 'capacity', label: 'Capacidade total', type: 'number' },
            );
          exportRecords(screen, fields, filtered);
          notice('Arquivo CSV exportado.');
        }}
      >
        {(leads || definition.tabs) && (
          <Tabs
            active={leads ? view : filter}
            onChange={leads ? setView : setFilter}
            values={
              leads
                ? [
                    { id: 'board', label: 'Funil' },
                    { id: 'list', label: 'Lista' },
                  ]
                : [
                    { id: 'all', label: 'Todos', count: records.length },
                    ...statuses.map((status) => ({ id: status, label: status })),
                  ]
            }
          />
        )}
        {Boolean(definition.filters?.length) && (
          <div className={t.filters}>
            {definition.filters?.map((key) => {
              const field = config.fields.find((field) => field.key === key)!;
              const allLabels: Record<string, string> = {
                status: 'Todas as situações',
                type: 'Todos os tipos',
                category: 'Todas as categorias',
                format: 'Todos os formatos',
                origin: 'Todas as origens',
                actor: 'Todos os responsáveis',
                owner: 'Todos os responsáveis',
                portal: 'Todos os portais',
                role: 'Todos os papéis',
                sector: 'Todos os setores',
                stage: 'Todas as etapas',
                metric: 'Todas as métricas',
                advertiser: 'Todos os anunciantes',
              };
              return (
                <div key={key}>
                  <SelectControl
                    label={`Filtrar por ${field.label.toLowerCase()}`}
                    compact
                    value={facets[key] ?? 'all'}
                    onValueChange={(value) =>
                      setFacets((current) => ({ ...current, [key]: value }))
                    }
                    options={[
                      { value: 'all', label: allLabels[key] ?? 'Todos' },
                      ...selectOptions(
                        [...new Set(records.map((record) => String(record[key])))].sort((a, b) =>
                          a.localeCompare(b, 'pt-BR'),
                        ),
                      ),
                    ]}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Toolbar>
      <div className={a.screenBody}>
        {screen === 'publicos' && (
          <SummaryStrip
            items={[
              {
                label: 'Públicos ativos',
                value: records.filter((record) => record.status === 'Ativo').length,
              },
              {
                label: 'Tamanho somado das bases',
                value: records
                  .filter((record) => record.status === 'Ativo')
                  .reduce((sum, record) => sum + Number(record.size), 0)
                  .toLocaleString('pt-BR'),
                hint: 'Pode incluir pessoas em mais de um público',
              },
              {
                label: 'Origem CDP',
                value: records.filter((record) => record.origin === 'Credenciamento CDP').length,
              },
            ]}
          />
        )}
        {screen === 'inventario' && (
          <SummaryStrip
            items={[
              { label: 'Ativos cadastrados', value: records.length },
              {
                label: 'Com disponibilidade',
                value: records.filter((record) => Number(record.remaining) > 0).length,
              },
              {
                label: 'Formatos de mídia',
                value: new Set(records.map((record) => record.format)).size,
              },
            ]}
          />
        )}
        {screen === 'data-on' && (
          <SummaryStrip
            items={[
              { label: 'Perfis interessados', value: '26.200' },
              { label: 'Visitas às páginas', value: '4.390' },
              { label: 'Pedidos de contato', value: '132' },
            ]}
          />
        )}
        {screen === 'pedidos' && (
          <SummaryStrip
            items={[
              {
                label: 'Aguardando aprovação',
                value: records.filter((record) => record.status === 'Aguardando aprovação').length,
              },
              {
                label: 'Assinados',
                value: records.filter((record) => record.status === 'Assinado').length,
              },
              {
                label: 'Valor dos pedidos',
                value: currency(records.reduce((sum, record) => sum + Number(record.value), 0)),
              },
            ]}
          />
        )}
        <div className={a.contextBar}>
          <span>
            {filtered.length} {filtered.length === 1 ? 'registro' : 'registros'}
            {query && ` para “${query}”`}
          </span>
          {(filter !== 'all' ||
            query ||
            Object.values(facets).some((value) => value !== 'all')) && (
            <button onClick={reset}>Limpar filtros</button>
          )}
        </div>
        {filtered.length === 0 ? (
          <Empty reset={reset} />
        ) : leads && view === 'board' ? (
          <LeadBoard
            records={filtered}
            mode={mode}
            onMove={(record, stage) => {
              save({ ...record, status: stage });
              notice(`${record.name} movido para ${stage}.`);
            }}
          />
        ) : (
          <RecordTable
            screen={screen}
            records={filtered}
            sort={sort}
            onSort={setSort}
            onOpen={(record) => {
              if (screen === 'notificacoes' && record.status === 'Não lida')
                save({ ...record, status: 'Lida' });
              navigate(screen, mode, record.id);
            }}
          />
        )}
      </div>
    </>
  );
}
function RecordDetail({
  screen,
  record,
  mode,
  edit,
}: {
  screen: ScreenKey;
  record: DemoRecord;
  mode: ViewMode;
  edit: () => void;
}) {
  const config = screens[screen];
  const related: Partial<Record<ScreenKey, { screen: ScreenKey; label: string }[]>> = {
    publicos: [
      { screen: 'inventario', label: 'Ativos de mídia' },
      { screen: 'metricas', label: 'Métricas disponíveis' },
    ],
    inventario: [
      { screen: 'publicos', label: 'Públicos' },
      { screen: 'canais', label: 'Canais' },
      { screen: 'campanhas', label: 'Campanhas' },
    ],
    canais: [
      { screen: 'inventario', label: 'Inventário' },
      { screen: 'metricas', label: 'Métricas' },
    ],
    pedidos: [
      { screen: 'campanhas', label: 'Campanhas' },
      { screen: 'criativos', label: 'Criativos' },
    ],
    fornecedores: [
      { screen: 'campanhas', label: 'Campanhas' },
      { screen: 'pedidos', label: 'Pedidos de Inserção' },
    ],
  };
  return (
    <div className={a.screenBody}>
      <button className={a.backButton} onClick={() => navigate(screen, mode)}>
        <ArrowLeft size={15} />
        Voltar para {config.title}
      </button>
      <div className={a.detailHeading}>
        <div>
          <span className={a.eyebrow}>{config.title}</span>
          <h2>{record.name}</h2>
          <Status value={record.status} />
        </div>
        {!config.readonly && (
          <button className={s.createButton} onClick={edit}>
            <Pencil size={14} />
            Editar
          </button>
        )}
      </div>
      <div className={a.detailGrid}>
        <section className={a.detailSection}>
          <h3>Informações principais</h3>
          <dl>
            {config.fields
              .filter((field) => field.key !== 'name')
              .map((field) => (
                <div key={field.key}>
                  <dt>{field.label}</dt>
                  <dd>{displayValue(record[field.key], field)}</dd>
                </div>
              ))}
          </dl>
        </section>
        {(related[screen] || record.description || screen === 'pedidos') && (
          <section className={a.detailSection}>
            <h3>{related[screen] ? 'Relacionados' : 'Detalhes'}</h3>
            {record.description && <p>{record.description}</p>}
            {related[screen] && (
              <div className={a.relatedLinks}>
                {related[screen]!.map((link) => (
                  <button key={link.screen} onClick={() => navigate(link.screen, mode)}>
                    {link.label}
                    <ArrowRight size={14} />
                  </button>
                ))}
              </div>
            )}
            {screen === 'publicos' && (
              <div className={a.inlineNote}>
                <Target size={17} />
                <p>A disponibilidade é acompanhada por métrica e período.</p>
              </div>
            )}
            {screen === 'pedidos' && (
              <div className={a.inlineNote}>
                <FileStamp />
                <p>Assinatura e aprovação indisponíveis nesta prévia.</p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
function FileStamp() {
  return <ClipboardList size={18} />;
}
function LeadBoard({
  records,
  mode,
  onMove,
}: {
  records: DemoRecord[];
  mode: ViewMode;
  onMove: (record: DemoRecord, stage: string) => void;
}) {
  const stages = ['Novo', 'Em Contato', 'Qualificado', 'Convertido', 'Perdido'];
  return (
    <div className={a.kanban} aria-label="Funil de leads">
      {stages.map((stage) => {
        const items = records.filter((record) => record.status === stage);
        return (
          <section
            key={stage}
            className={a.kanbanColumn}
            data-tone={toneFor(stage)}
            aria-label={stage}
          >
            <h2>
              <span>{stage}</span>
              <small>{items.length}</small>
            </h2>
            {items.map((record) => (
              <article key={record.id} className={a.leadCard}>
                <span className={a.eyebrow}>{record.origin}</span>
                <button className={a.recordLink} onClick={() => navigate('leads', mode, record.id)}>
                  {record.name}
                </button>
                <p>{record.company}</p>
                <div className={a.leadOwner}>
                  <span>EC</span>
                  {record.owner}
                </div>
                <label className={a.stageSelect}>
                  <span className={s.srOnly}>Etapa de {record.name}</span>
                  <SelectControl
                    id={`lead-stage-${record.id}`}
                    label={`Etapa de ${record.name}`}
                    compact
                    value={record.status}
                    onValueChange={(value) => {
                      onMove(record, value);
                      requestAnimationFrame(() =>
                        document.getElementById(`lead-stage-${record.id}`)?.focus(),
                      );
                    }}
                    options={selectOptions(stages)}
                  />
                </label>
              </article>
            ))}
            {items.length === 0 && <p className={a.columnEmpty}>Nenhum lead nesta etapa</p>}
          </section>
        );
      })}
    </div>
  );
}
export function CatalogScreen({ records, mode }: { records: DemoRecord[]; mode: ViewMode }) {
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState('all');
  const visible = records.filter(
    (record) =>
      (format === 'all' || record.format === format) &&
      normalize(`${record.name} ${record.description}`).includes(normalize(query)),
  );
  return (
    <>
      <Toolbar title="Catálogo de Mídia" query={query} setQuery={setQuery}>
        <Tabs
          active={format}
          onChange={setFormat}
          values={[
            { id: 'all', label: 'Todos os formatos' },
            ...['Display', 'E-mail', 'Social'].map((value) => ({ id: value, label: value })),
          ]}
        />
      </Toolbar>
      <div className={a.screenBody}>
        {visible.length === 0 ? (
          <Empty
            reset={() => {
              setQuery('');
              setFormat('all');
            }}
          />
        ) : (
          <div className={a.catalogGrid}>
            {visible.map((record) => (
              <article className={a.catalogCard} key={record.id}>
                <div className={a.assetPreview} data-format={record.format}>
                  <Boxes size={32} strokeWidth={1} />
                  <span>{record.format}</span>
                </div>
                <div className={a.catalogCopy}>
                  <Status value={record.status} />
                  <h2>{record.name}</h2>
                  <p>{record.description}</p>
                  <div>
                    <strong>{currency(Number(record.price))}</strong>
                    <small>{record.unit}</small>
                  </div>
                  <button
                    className={s.createButton}
                    disabled={Number(record.remaining) === 0}
                    onClick={() => navigate('campanhas', mode, 'novo')}
                  >
                    <Plus size={14} />
                    Planejar campanha
                    <ChevronRight size={13} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
