'use client';
import { useState } from 'react';
import {
  Search,
  MoreHorizontal,
  X,
  Download,
  Check,
  CircleCheck,
  CircleDashed,
  CircleX,
  Clock3,
  Copy,
  Eye,
  FileText,
  Send,
  Tag as TagIcon,
  Trash2,
} from 'lucide-react';
import {
  ActionMenu,
  Button,
  IconButton,
  Checkbox,
  Input,
  Select,
  DataTable,
  Dialog,
  Status,
  Tag,
  Combobox,
  type TableSort,
  type useToast,
} from '../../components/ds-v2';
import { Stage, Metrics, Activity, Segmented } from './specimen-ui';
import s from './specimen.module.css';
const initialRows = [
  {
    id: '1',
    name: 'Lançamento primavera',
    secondary: 'Calçados Aurora · Display',
    tags: ['Display', 'Primavera'],
    status: 'Em veiculação',
    budget: 24800,
    owner: 'Ana Lima',
  },
  {
    id: '2',
    name: 'Conexões que transformam',
    secondary: 'Studio Forma · E-mail',
    tags: ['E-mail', 'Francal 2026'],
    status: 'Em revisão',
    budget: 12600,
    owner: 'Pedro Costa',
  },
  {
    id: '3',
    name: 'Francal — última chamada',
    secondary: 'Grupo Horizonte · Social',
    tags: ['Social', 'Francal 2026'],
    status: 'Rascunho',
    budget: 4800,
    owner: 'Ana Lima',
  },
  {
    id: '4',
    name: 'Novos caminhos',
    secondary: 'Ateliê Norte · Display',
    tags: ['Display', 'Institucional'],
    status: 'Em veiculação',
    budget: 18200,
    owner: 'Bia Souza',
  },
];
const currency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
type CampaignRow = (typeof initialRows)[number];
const statusPresentation = {
  'Em veiculação': { tone: 'blue', icon: CircleDashed },
  'Em revisão': { tone: 'amber', icon: Clock3 },
  Rascunho: { tone: 'neutral', icon: FileText },
} as const;
const campaignStatus = (status: string) =>
  statusPresentation[status as keyof typeof statusPresentation] ?? statusPresentation.Rascunho;
const tagTone = (value: string) =>
  value === 'Display'
    ? 'blue'
    : value === 'E-mail'
      ? 'green'
      : value === 'Social'
        ? 'violet'
        : value === 'Primavera'
          ? 'amber'
          : 'neutral';
export function DataSpecimen({
  id,
  notify,
  embedded = false,
}: {
  id: string;
  notify: ReturnType<typeof useToast>['notify'];
  embedded?: boolean;
}) {
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(id === 'filtros-ativos' ? 'Em veiculação' : 'Todos');
  const [selected, setSelected] = useState<string[]>([]);
  const [sort, setSort] = useState<TableSort>({ key: 'name', direction: 'asc' });
  const [density, setDensity] = useState('Confortável');
  const [tags, setTags] = useState(['francal-2026', 'display', 'primavera']);
  const [detailRow, setDetailRow] = useState<CampaignRow | null>(null);
  const [removeRow, setRemoveRow] = useState<CampaignRow | null>(null);
  const filtered = rows
    .filter(
      (row) =>
        row.name.toLowerCase().includes(query.toLowerCase()) &&
        (filter === 'Todos' || row.status === filter),
    )
    .sort(
      (a, b) =>
        (sort.key === 'budget' ? a.budget - b.budget : a.name.localeCompare(b.name)) *
        (sort.direction === 'asc' ? 1 : -1),
    );
  const toolbar = (
    <div className={s.toolbar}>
      <Input
        aria-label="Buscar campanhas"
        placeholder="Buscar campanha…"
        icon={<Search size={14} />}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <Select
        label="Filtrar status"
        value={filter}
        onValueChange={setFilter}
        options={['Todos', 'Em veiculação', 'Em revisão', 'Rascunho'].map((value) => ({
          value,
          label: value,
        }))}
      />
      <span className={s.muted}>{filtered.length} campanhas</span>
    </div>
  );
  const table = (
    <DataTable
      label="Campanhas de demonstração"
      rows={filtered}
      rowKey={(row) => row.id}
      density={density === 'Compacta' ? 'compact' : 'comfortable'}
      sort={sort}
      onSort={setSort}
      empty={
        <div className={s.empty}>
          <h3>Nenhuma campanha encontrada</h3>
          <Button
            onClick={() => {
              setQuery('');
              setFilter('Todos');
            }}
          >
            Limpar filtros
          </Button>
        </div>
      }
      columns={[
        ...(id === 'acoes-lote' || id === 'data-table'
          ? [
              {
                key: 'select',
                label: 'Selecionar',
                sortable: false,
                header: (
                  <Checkbox
                    className={s.tableSelection}
                    label="Selecionar campanhas visíveis"
                    checked={
                      filtered.length > 0 && filtered.every((row) => selected.includes(row.id))
                    }
                    onChange={(event) =>
                      setSelected(event.target.checked ? filtered.map((row) => row.id) : [])
                    }
                  />
                ),
                width: 44,
                render: (row: (typeof initialRows)[number]) => (
                  <Checkbox
                    className={s.tableSelection}
                    label={`Selecionar ${row.name}`}
                    checked={selected.includes(row.id)}
                    onChange={(event) =>
                      setSelected(
                        event.target.checked
                          ? [...selected, row.id]
                          : selected.filter((item) => item !== row.id),
                      )
                    }
                  />
                ),
              },
            ]
          : []),
        {
          key: 'name',
          label: 'Campanha',
          width: 280,
          sortable: true,
          render: (row) => (
            <div>
              <strong style={{ font: 'var(--type-entity)' }}>{row.name}</strong>
              <small className={s.muted} style={{ display: 'block' }}>
                {row.secondary}
              </small>
            </div>
          ),
        },
        {
          key: 'status',
          label: 'Status',
          width: 165,
          sortable: false,
          render: (row) => {
            const presentation = campaignStatus(row.status);
            return (
              <Status
                value={row.status}
                tone={presentation.tone}
                icon={presentation.icon}
                variant="soft"
              />
            );
          },
        },
        {
          key: 'tags',
          label: 'Classificações',
          width: 215,
          sortable: false,
          render: (row) => (
            <div className={s.tableTags}>
              {row.tags.map((value) => (
                <Tag key={value} value={value} tone={tagTone(value)} />
              ))}
            </div>
          ),
        },
        {
          key: 'budget',
          label: 'Investimento',
          width: 135,
          numeric: true,
          sortable: true,
          render: (row) => currency(row.budget),
        },
        {
          key: 'action',
          label: 'Ações',
          width: 64,
          kind: 'action',
          sortable: false,
          render: (row) => (
            <ActionMenu
              label={`Ações de ${row.name}`}
              simple
              trigger={
                <IconButton label={`Ações de ${row.name}`} icon={MoreHorizontal} variant="ghost" />
              }
              items={[
                {
                  label: 'Ver detalhes',
                  icon: Eye,
                  onSelect: () => setDetailRow(row),
                },
                {
                  label: 'Duplicar',
                  icon: Copy,
                  onSelect: () => {
                    setRows((previous) => [
                      ...previous,
                      { ...row, id: String(Date.now()), name: `${row.name} (cópia)` },
                    ]);
                    notify('Cópia adicionada à demonstração.');
                  },
                },
                {
                  label: 'Remover',
                  icon: Trash2,
                  danger: true,
                  onSelect: () => setRemoveRow(row),
                },
              ]}
            />
          ),
        },
      ]}
    />
  );
  const main = (
    <div className={s.dataStack}>
      {!['tabela', 'acoes-lote'].includes(id) && toolbar}
      {(id === 'filtros-ativos' || query || filter !== 'Todos') && (
        <div className={`${s.row} ${s.activeFilters}`}>
          <span className={s.muted}>Filtros ativos</span>
          {(filter !== 'Todos' ? [filter] : id === 'filtros-ativos' ? ['Todos os status'] : []).map(
            (item) => (
              <span className={s.activeFilter} key={item}>
                <span>{item}</span>
                <button aria-label={`Remover filtro ${item}`} onClick={() => setFilter('Todos')}>
                  <X size={11} aria-hidden="true" />
                </button>
              </span>
            ),
          )}
          {query && (
            <span className={s.activeFilter}>
              <span>Nome: {query}</span>
              <button aria-label="Remover busca" onClick={() => setQuery('')}>
                <X size={11} aria-hidden="true" />
              </button>
            </span>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              setQuery('');
              setFilter('Todos');
            }}
          >
            Limpar filtros
          </Button>
        </div>
      )}
      {(id === 'acoes-lote' || id === 'data-table') && selected.length > 0 && (
        <div className={s.notice}>
          <Check size={16} />
          <div>{selected.length} selecionadas</div>
          <Button
            onClick={() => {
              setRows((previous) =>
                previous.map((row) =>
                  selected.includes(row.id) ? { ...row, status: 'Rascunho' } : row,
                ),
              );
              setSelected([]);
              notify('Campanhas movidas para rascunho no exemplo.');
            }}
          >
            Mover para rascunho
          </Button>
          <Button variant="ghost" onClick={() => setSelected([])}>
            Cancelar
          </Button>
        </div>
      )}
      {table}
      <Dialog
        open={!!detailRow}
        onClose={() => setDetailRow(null)}
        title={detailRow?.name ?? 'Detalhes da campanha'}
        description="Resumo do registro selecionado na tabela."
        density="compact"
        footer={<Button onClick={() => setDetailRow(null)}>Fechar</Button>}
      >
        {detailRow && (
          <div className={s.tableRecordSummary}>
            <div className={s.tableRecordLead}>
              {(() => {
                const presentation = campaignStatus(detailRow.status);
                return (
                  <Status
                    value={detailRow.status}
                    tone={presentation.tone}
                    icon={presentation.icon}
                    variant="soft"
                  />
                );
              })()}
              <div className={s.tableTags}>
                {detailRow.tags.map((value) => (
                  <Tag key={value} value={value} tone={tagTone(value)} icon={TagIcon} />
                ))}
              </div>
            </div>
            <dl>
              <div>
                <dt>Contexto</dt>
                <dd>{detailRow.secondary}</dd>
              </div>
              <div>
                <dt>Responsável</dt>
                <dd>{detailRow.owner}</dd>
              </div>
              <div>
                <dt>Investimento</dt>
                <dd>{currency(detailRow.budget)}</dd>
              </div>
            </dl>
          </div>
        )}
      </Dialog>
      <Dialog
        open={!!removeRow}
        onClose={() => setRemoveRow(null)}
        title="Remover campanha?"
        description="A campanha será removida somente desta demonstração local."
        density="compact"
        footer={
          <>
            <Button onClick={() => setRemoveRow(null)}>Cancelar</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!removeRow) return;
                setRows((previous) => previous.filter((item) => item.id !== removeRow.id));
                setSelected((previous) => previous.filter((id) => id !== removeRow.id));
                notify('Campanha removida deste exemplo.');
                setRemoveRow(null);
              }}
            >
              Remover do exemplo
            </Button>
          </>
        }
      >
        <p className={s.tableRemoveCopy}>
          {removeRow ? `Você está removendo “${removeRow.name}”.` : ''}
        </p>
      </Dialog>
      <div className={s.spread}>
        <span className={s.muted}>{filtered.length} registros · exemplos locais</span>
        <Segmented
          label="Densidade"
          values={['Confortável', 'Compacta']}
          value={density}
          onChange={setDensity}
        />
      </div>
    </div>
  );
  if (embedded) return main;
  if (id === 'kpi')
    return (
      <Stage title="Indicadores da operação">
        <Metrics />
        <div className={s.matrix}>
          <div>
            <h3>Valor e unidade</h3>
            <p>Moeda, volume e contagem são explícitos.</p>
          </div>
          <div>
            <h3>Contexto de comparação</h3>
            <p>Variação e período ficam abaixo do valor principal.</p>
          </div>
        </div>
      </Stage>
    );
  if (id === 'timeline')
    return (
      <Stage title="Histórico da campanha">
        <Activity />
      </Stage>
    );
  if (id === 'badge')
    return (
      <Stage title="Estados operacionais">
        <div className={s.statusCloud}>
          {(
            [
              { value: 'Rascunho', tone: 'neutral', icon: FileText },
              { value: 'Enviado', tone: 'violet', icon: Send },
              { value: 'Em revisão', tone: 'amber', icon: Clock3 },
              { value: 'Em veiculação', tone: 'blue', icon: CircleDashed },
              { value: 'Aprovado', tone: 'green', icon: CircleCheck },
              { value: 'Reprovado', tone: 'red', icon: CircleX },
              { value: 'Expirado', tone: 'neutral', icon: Clock3 },
            ] as const
          ).map(({ value, tone, icon }) => (
            <Status key={value} value={value} tone={tone} icon={icon} variant="soft" />
          ))}
        </div>
      </Stage>
    );
  if (id === 'tags')
    return (
      <Stage title="Classificação de campanhas">
        <div className={s.form}>
          <div className={s.fieldIntro}>
            <strong>Classificações</strong>
            <span>Combine evento, formato e sazonalidade.</span>
          </div>
          <Combobox
            multiple
            label="Classificações da campanha"
            value={tags}
            onChange={setTags}
            placeholder="Adicionar classificação…"
            options={[
              { value: 'francal-2026', label: 'Francal 2026', description: 'Evento' },
              { value: 'beauty-fair', label: 'Beauty Fair', description: 'Evento' },
              { value: 'display', label: 'Display', description: 'Formato' },
              { value: 'email', label: 'E-mail', description: 'Formato' },
              { value: 'social', label: 'Social', description: 'Formato' },
              { value: 'primavera', label: 'Primavera', description: 'Sazonalidade' },
              { value: 'inverno', label: 'Inverno', description: 'Sazonalidade' },
            ]}
          />
        </div>
      </Stage>
    );
  if (id === 'lista')
    return (
      <Stage title="Arquivos recentes">
        <ul className={s.fileList}>
          {[
            'Plano de mídia — Outubro.pdf',
            'Criativo — Display.png',
            'Credenciados setembro.csv',
          ].map((name, index) => (
            <li key={name}>
              <span aria-hidden="true">
                <FileText size={17} />
              </span>
              <div>
                <strong>{name}</strong>
                <small>
                  {['PDF · 2,4 MB', 'Imagem · 180 KB', 'CSV · 18.400 registros'][index]} ·
                  adicionado hoje
                </small>
              </div>
              <IconButton
                label={`Ver ${name}`}
                icon={Download}
                onClick={() =>
                  notify({
                    title: name,
                    message: 'Exemplo de arquivo, sem download disponível.',
                    variant: 'info',
                  })
                }
              />
            </li>
          ))}
        </ul>
      </Stage>
    );
  return (
    <Stage
      title={
        id === 'tabela'
          ? 'Listagem de registros'
          : id === 'acoes-lote'
            ? 'Seleção e ação em lote'
            : 'Operação de campanhas'
      }
    >
      {main}
    </Stage>
  );
}
