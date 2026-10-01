'use client';

import { Columns3, List as ListIcon, MoreHorizontal, Plus } from 'lucide-react';
import { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { Button } from '@/components/ds-v3/button';
import { SearchField } from '@/components/ds-v3/fields';
import { Avatar, BrandMark } from '@/components/ds-v3/identity';
import {
  KanbanBoard,
  KanbanColumn,
  KanbanEmpty,
  KanbanIconButton,
  KanbanPlaceholder,
  LeadCard,
  useKanbanDrag,
  type LeadOutcome,
} from '@/components/ds-v3/kanban';
import { List, ListGroup, ListItem } from '@/components/ds-v3/list-item';
import { Menu, type MenuSection } from '@/components/ds-v3/menu';
import { Select } from '@/components/ds-v3/select';
import { Segmented } from '@/components/ds-v3/selection';
import { toast } from '@/components/ds-v3/toast';
import { Shot, Shots, State, States } from '../stage';
import { EnsureToaster, LEADS, LeadDrawer, STAGES, StageGlyph, brl, stageOf, type Lead, type StageId } from './detalhe';
import k from './kanban.module.css';

/* ——————————————————————————— Peças ——————————————————————————— */

const NEW_LEAD: Lead = {
  id: 'l-1305',
  code: '1305',
  company: 'Calçados Serrana',
  place: 'Gramado, RS · Calçado feminino',
  contact: 'Clara Souto',
  email: 'contato@calcadosserrana.com.br',
  phone: '(54) 99231-8870',
  origin: 'Portal',
  originDetail: 'Portal · Formulário de mídia',
  owner: 'Rafael Dias',
  value: 7200,
  age: 0,
  interests: ['Push no app'],
  stage: 'novo',
};
const byId = new Map([...LEADS, NEW_LEAD].map((lead) => [lead.id, lead]));
const leadOf = (id: string) => byId.get(id) ?? LEADS[0]!;

const total = (ids: string[]) =>
  `R$ ${ids.reduce((sum, id) => sum + (byId.get(id)?.value ?? 0), 0).toLocaleString('pt-BR')}`;

const outcomeFor = (lead: Lead, stage: StageId): LeadOutcome | undefined =>
  stage === 'ganho'
    ? { kind: 'won', date: lead.outcome?.kind === 'won' ? lead.outcome.date : '22/10' }
    : stage === 'perdido'
      ? { kind: 'lost', reason: lead.outcome?.kind === 'lost' ? lead.outcome.reason : 'Preço' }
      : undefined;

/** Props do cartão a partir do lead (a etapa decide o desfecho). */
function cardOf(lead: Lead, stage: StageId) {
  return {
    company: lead.company,
    code: lead.code,
    owner: lead.owner,
    origin: lead.origin,
    value: lead.value,
    age: lead.age,
    interests: lead.interests.map((label) => ({ label })),
    nextAction: lead.next ?? null,
    outcome: outcomeFor(lead, stage),
  };
}

function CardMenu({ lead, stage, onMove }: { lead: Lead; stage: StageId; onMove?: (to: StageId) => void }) {
  const sections: MenuSection[] = [
    { items: [{ label: 'Abrir lead' }, { label: 'Registrar atividade' }] },
    {
      items: [
        {
          label: 'Mover para',
          items: STAGES.filter((item) => item.id !== stage).map((item) => ({
            label: item.label,
            leading: <StageGlyph id={item.id} />,
            onSelect: () => onMove?.(item.id),
          })),
        },
      ],
    },
  ];
  return (
    <Menu
      label={`Ações de ${lead.company}`}
      align="end"
      width={196}
      sections={sections}
      trigger={(trigger) => <KanbanIconButton {...trigger} label="Ações do lead" icon={MoreHorizontal} />}
    />
  );
}

type Columns = Record<StageId, string[]>;
const initialColumns = (): Columns =>
  Object.fromEntries(STAGES.map((stage) => [stage.id, LEADS.filter((lead) => lead.stage === stage.id).map((lead) => lead.id)])) as Columns;

const OWNER_OPTIONS = [
  { value: 'todos', label: 'Responsável: Todos' },
  ...['Rafael Dias', 'Marina Lopes', 'Clara Souto', 'Tiago Rezende', 'Juliana Prates'].map((name) => ({
    value: name,
    label: name,
    leading: <Avatar name={name} size="xs" decorative />,
  })),
];

/* ——————————————————————————— Quadro vivo ——————————————————————————— */

function LeadPipeline({ narrow = false }: { narrow?: boolean }) {
  const [columns, setColumns] = useState<Columns>(initialColumns);
  const [collapsed, setCollapsed] = useState<Set<StageId>>(() => new Set(['perdido']));
  const [query, setQuery] = useState('');
  const [owner, setOwner] = useState('todos');
  const [view, setView] = useState<'funil' | 'lista'>('funil');
  const [openId, setOpenId] = useState<string | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('pt-BR');
    const keep = (id: string) => {
      const lead = leadOf(id);
      if (owner !== 'todos' && lead.owner !== owner) return false;
      if (!needle) return true;
      return `${lead.company} ${lead.contact} ${lead.code}`.toLocaleLowerCase('pt-BR').includes(needle);
    };
    return Object.fromEntries(STAGES.map((stage) => [stage.id, columns[stage.id].filter(keep)])) as Columns;
  }, [columns, query, owner]);

  function move(id: string, column: StageId, beforeId: string | null) {
    setColumns((current) => {
      const next = Object.fromEntries(
        STAGES.map((stage) => [stage.id, current[stage.id].filter((item) => item !== id)]),
      ) as Columns;
      const list = next[column];
      const at = beforeId ? list.indexOf(beforeId) : -1;
      list.splice(at < 0 ? list.length : at, 0, id);
      return next;
    });
  }

  function stageOfId(id: string): StageId {
    return STAGES.find((stage) => columns[stage.id].includes(id))?.id ?? 'novo';
  }

  function moveWithToast(id: string, to: StageId, from: StageId) {
    const lead = leadOf(id);
    toast(`${lead.company} movido para ${stageOf(to).label}`, {
      action: { label: 'Desfazer', onClick: () => move(id, from, null) },
    });
  }

  const drag = useKanbanDrag<StageId>({
    lanes: STAGES.map((stage) => ({
      id: stage.id,
      ids: visible[stage.id],
      label: stageOf(stage.id).label,
      collapsed: collapsed.has(stage.id),
    })),
    labelOf: (id) => leadOf(id).company,
    onMove: ({ id, column, beforeId }) => move(id, column, beforeId),
    onDrop: ({ id, column, from }) => {
      if (column !== from) moveWithToast(id, column, from);
    },
  });

  const openLead = openId ? leadOf(openId) : null;

  return (
    <div className={k.pipeline} data-narrow={narrow || undefined}>
      <div className={k.toolbar}>
        <div className={k.search}>
          <SearchField size="sm" value={query} onValueChange={setQuery} label="Buscar lead" placeholder="Empresa ou contato" />
        </div>
        <div className={k.owner}>
          <Select size="sm" value={owner} onChange={setOwner} options={OWNER_OPTIONS} label="Responsável" />
        </div>
        <Segmented
          label="Visualização"
          size="sm"
          value={view}
          onChange={setView}
          options={[
            { value: 'funil', label: 'Funil', icon: Columns3, iconOnly: narrow },
            { value: 'lista', label: 'Lista', icon: ListIcon, iconOnly: narrow },
          ]}
        />
        <span className={k.toolbarEnd}>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => {
              if (STAGES.some((stage) => columns[stage.id].includes(NEW_LEAD.id))) {
                setOpenId(NEW_LEAD.id);
                return;
              }
              setColumns((current) => ({ ...current, novo: [NEW_LEAD.id, ...current.novo] }));
              setCollapsed((current) => {
                const next = new Set(current);
                next.delete('novo');
                return next;
              });
              setFresh(NEW_LEAD.id);
              toast(`${NEW_LEAD.company} criado em Novo`);
            }}
          >
            Novo lead
          </Button>
        </span>
      </div>

      {view === 'funil' ? (
        <KanbanBoard label="Funil de leads" className={k.board}>
          {STAGES.map((stage) => {
            const ids = visible[stage.id];
            const entries = drag.layout(stage.id, ids);
            const isCollapsed = collapsed.has(stage.id);
            return (
              <KanbanColumn
                key={stage.id}
                {...drag.columnProps(stage.id)}
                title={stage.label}
                icon={<StageGlyph id={stage.id} />}
                count={ids.length}
                total={total(ids)}
                totalHint="estimado"
                collapsed={isCollapsed}
                onExpand={() =>
                  setCollapsed((current) => {
                    const next = new Set(current);
                    next.delete(stage.id);
                    return next;
                  })
                }
                actions={
                  <>
                    {stage.id === 'novo' && (
                      <KanbanIconButton
                        label="Adicionar lead em Novo"
                        icon={Plus}
                        onClick={() => toast('Lead criado em Novo', { tone: 'info' })}
                      />
                    )}
                    <Menu
                      label={`Ações da coluna ${stage.label}`}
                      align="end"
                      width={180}
                      sections={[
                        {
                          items: [
                            {
                              label: 'Recolher coluna',
                              onSelect: () => setCollapsed((current) => new Set(current).add(stage.id)),
                            },
                            {
                              label: 'Ordenar por valor',
                              onSelect: () =>
                                setColumns((current) => ({
                                  ...current,
                                  [stage.id]: [...current[stage.id]].sort((a, b) => leadOf(b).value - leadOf(a).value),
                                })),
                            },
                          ],
                        },
                      ]}
                      trigger={(trigger) => <KanbanIconButton {...trigger} label={`Ações de ${stage.label}`} icon={MoreHorizontal} />}
                    />
                  </>
                }
                empty={
                  <KanbanEmpty
                    title={query || owner !== 'todos' ? 'Nenhum lead no filtro' : 'Nenhum lead'}
                    active={drag.overColumn === stage.id}
                  />
                }
              >
                {entries.map((entry) =>
                  entry.kind === 'slot' ? (
                    <KanbanPlaceholder key={entry.key} slotKey={entry.key} height={entry.height} motion={entry.motion} />
                  ) : (
                    <LeadCard
                      key={entry.id}
                      {...cardOf(leadOf(entry.id), stage.id)}
                      {...drag.cardProps(entry.id, stage.id)}
                      lifted={drag.pickedId === entry.id}
                      selected={openId === entry.id}
                      className={fresh === entry.id ? k.fresh : undefined}
                      onOpen={() => setOpenId(entry.id)}
                      menu={
                        <CardMenu
                          lead={leadOf(entry.id)}
                          stage={stage.id}
                          onMove={(to) => {
                            const from = stageOfId(entry.id);
                            move(entry.id, to, null);
                            moveWithToast(entry.id, to, from);
                          }}
                        />
                      }
                    />
                  ),
                )}
              </KanbanColumn>
            );
          })}
        </KanbanBoard>
      ) : (
        <div className={k.listView}>
          <List label="Leads por etapa">
            {STAGES.map((stage) =>
              visible[stage.id].length ? (
                <ListGroup key={stage.id} label={stage.label} meta={total(visible[stage.id])}>
                  {visible[stage.id].map((id) => {
                    const lead = leadOf(id);
                    return (
                      <ListItem
                        key={id}
                        leading={<BrandMark name={lead.company} size="xs" variant="soft" decorative />}
                        title={lead.company}
                        description={`${lead.owner} · ${lead.origin}`}
                        meta={<span className={k.money}>{brl(lead.value)}</span>}
                        onClick={() => setOpenId(id)}
                      />
                    );
                  })}
                </ListGroup>
              ) : null,
            )}
          </List>
        </div>
      )}
      {drag.region}
      {openLead && (
        <LeadDrawer key={openLead.id} lead={openLead} open={Boolean(openId)} onClose={() => setOpenId(null)} />
      )}
    </div>
  );
}

/* ——————————————————————————— Estados parados ——————————————————————————— */

const LADEIRA = LEADS.find((lead) => lead.company === 'Sapataria Ladeira') ?? LEADS[0]!;
const ATELIE = LEADS.find((lead) => lead.company === 'Ateliê Sul') ?? LEADS[0]!;
const HORIZONTE = LEADS.find((lead) => lead.company === 'Grupo Horizonte') ?? LEADS[0]!;
const NORTE = LEADS.find((lead) => lead.company === 'Estúdio Norte') ?? LEADS[0]!;

function StaticColumn({
  title,
  stage,
  ids,
  children,
  drop,
  collapsed,
}: {
  title?: string;
  stage: StageId;
  ids: string[];
  children?: ReactNode;
  drop?: boolean;
  collapsed?: boolean;
}) {
  return (
    <KanbanColumn
      title={title ?? stageOf(stage).label}
      icon={<StageGlyph id={stage} />}
      count={ids.length}
      total={ids.length ? total(ids) : undefined}
      totalHint={ids.length ? 'estimado' : undefined}
      data-drop={drop || undefined}
      collapsed={collapsed}
      actions={<KanbanIconButton label="Ações da coluna" icon={MoreHorizontal} />}
      empty={<KanbanEmpty title="Nenhum lead" active={drop} />}
    >
      {children}
    </KanbanColumn>
  );
}

function Kanban() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="md">
        <LeadPipeline />
      </Shot>
      <Shot title="Celular" align="center" pad="lg">
        <div className={k.phone}>
          <LeadPipeline narrow />
        </div>
      </Shot>
      <Shot title="Estados" tone="white" align="start" pad="lg">
        <div className={k.states}>
          <State label="Repouso">
            <StaticColumn stage="qualificado" ids={[HORIZONTE.id, NORTE.id]}>
              <LeadCard {...cardOf(HORIZONTE, 'qualificado')} menu={<KanbanIconButton label="Ações" icon={MoreHorizontal} />} />
              <LeadCard {...cardOf(NORTE, 'qualificado')} menu={<KanbanIconButton label="Ações" icon={MoreHorizontal} />} />
            </StaticColumn>
          </State>
          <State label="Arrastando">
            <StaticColumn stage="contato" ids={[ATELIE.id]}>
              <LeadCard {...cardOf(ATELIE, 'contato')} menu={<KanbanIconButton label="Ações" icon={MoreHorizontal} />} />
              <div className={k.liftedWrap}>
                <KanbanPlaceholder height={148} />
                <div className={k.lifted}>
                  <LeadCard {...cardOf(LADEIRA, 'contato')} lifted menu={<KanbanIconButton label="Ações" icon={MoreHorizontal} />} />
                </div>
              </div>
            </StaticColumn>
          </State>
          <State label="Sobre coluna">
            <StaticColumn stage="proposta" ids={[LEADS[9]!.id]} drop>
              <LeadCard {...cardOf(LEADS[9]!, 'proposta')} menu={<KanbanIconButton label="Ações" icon={MoreHorizontal} />} />
              <KanbanPlaceholder height={112} />
            </StaticColumn>
          </State>
          <State label="Coluna vazia">
            <StaticColumn stage="ganho" ids={[]} />
          </State>
          <State label="Recolhida">
            <div className={k.collapsedCell}>
              <StaticColumn stage="perdido" ids={['a', 'b']} collapsed />
            </div>
          </State>
        </div>
      </Shot>
      <EnsureToaster />
    </Shots>
  );
}

/* ——————————————————————————— Cartão de lead ——————————————————————————— */

function CardLead() {
  const [openId, setOpenId] = useState<string | null>(null);
  const ids = ['l-1291', 'l-1287', 'l-1284', 'l-1250', 'l-1244'];
  const stageFor = (id: string) => leadOf(id).stage;
  const openLead = openId ? leadOf(openId) : null;
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="center" pad="lg">
        <KanbanColumn
          title="Meus leads"
          count={ids.length}
          total={total(ids)}
          totalHint="estimado"
          actions={<KanbanIconButton label="Ações da coluna" icon={MoreHorizontal} />}
          width={296}
        >
          {ids.map((id) => {
            const lead = leadOf(id);
            return (
              <LeadCard
                key={id}
                {...cardOf(lead, stageFor(id))}
                density={id === 'l-1284' ? 'compact' : 'default'}
                selected={openId === id}
                onOpen={() => setOpenId(id)}
                menu={<CardMenu lead={lead} stage={stageFor(id)} />}
              />
            );
          })}
        </KanbanColumn>
        {openLead && (
          <LeadDrawer key={openLead.id} lead={openLead} open={Boolean(openId)} onClose={() => setOpenId(null)} />
        )}
      </Shot>
      <Shot title="Variantes" align="stretch" pad="lg">
        <States min={260}>
          <State label="Detalhado">
            <div className={k.cell}>
              <LeadCard {...cardOf(LADEIRA, 'contato')} menu={<KanbanIconButton label="Ações" icon={MoreHorizontal} />} />
            </div>
          </State>
          <State label="Compacto">
            <div className={k.cell}>
              <LeadCard {...cardOf(HORIZONTE, 'qualificado')} density="compact" menu={<KanbanIconButton label="Ações" icon={MoreHorizontal} />} />
            </div>
          </State>
          <State label="Atrasado">
            <div className={k.cell}>
              <LeadCard {...cardOf(ATELIE, 'contato')} menu={<KanbanIconButton label="Ações" icon={MoreHorizontal} />} />
            </div>
          </State>
          <State label="Ganho">
            <div className={k.cell}>
              <LeadCard {...cardOf(leadOf('l-1250'), 'ganho')} menu={<KanbanIconButton label="Ações" icon={MoreHorizontal} />} />
            </div>
          </State>
          <State label="Perdido">
            <div className={k.cell}>
              <LeadCard {...cardOf(leadOf('l-1244'), 'perdido')} menu={<KanbanIconButton label="Ações" icon={MoreHorizontal} />} />
            </div>
          </State>
        </States>
      </Shot>
      <Shot title="Estados" align="stretch" pad="lg">
        <States min={220}>
          <State label="Repouso">
            <div className={k.cell}>
              <LeadCard {...cardOf(NORTE, 'qualificado')} menu={<KanbanIconButton label="Ações" icon={MoreHorizontal} />} />
            </div>
          </State>
          <State label="Hover">
            <div className={k.cell}>
              <LeadCard {...cardOf(NORTE, 'qualificado')} data-force="hover" menu={<KanbanIconButton label="Ações" icon={MoreHorizontal} />} />
            </div>
          </State>
          <State label="Foco">
            <div className={k.cell}>
              <LeadCard {...cardOf(NORTE, 'qualificado')} data-force="focus" menu={<KanbanIconButton label="Ações" icon={MoreHorizontal} />} />
            </div>
          </State>
          <State label="Selecionado">
            <div className={k.cell}>
              <LeadCard {...cardOf(NORTE, 'qualificado')} selected menu={<KanbanIconButton label="Ações" icon={MoreHorizontal} />} />
            </div>
          </State>
          <State label="Arrastando">
            <div className={k.cell} data-lift="">
              <LeadCard {...cardOf(NORTE, 'qualificado')} lifted menu={<KanbanIconButton label="Ações" icon={MoreHorizontal} />} />
            </div>
          </State>
        </States>
      </Shot>
      <EnsureToaster />
    </Shots>
  );
}

export const specimens: Record<string, ComponentType> = {
  kanban: Kanban,
  'card-lead': CardLead,
};
