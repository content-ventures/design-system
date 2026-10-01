'use client';

import { Check, MoreHorizontal, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { Badge, Count, type Tone } from '@/components/ds-v3/badge';
import { Button, IconButton } from '@/components/ds-v3/button';
import { Drawer, DrawerFrame } from '@/components/ds-v3/drawer';
import { Avatar, BrandMark } from '@/components/ds-v3/identity';
import {
  ActivityComposer,
  ActivityFeed,
  StageIcon,
  type ActivityDraft,
  type ActivityEntry,
  type LeadOutcome,
  type NextActionDue,
  type StageKind,
} from '@/components/ds-v3/kanban';
import { TextLink } from '@/components/ds-v3/link';
import { List, ListItem } from '@/components/ds-v3/list-item';
import { Menu } from '@/components/ds-v3/menu';
import { Dialog } from '@/components/ds-v3/overlays';
import { Select, type SelectOption } from '@/components/ds-v3/select';
import { DescriptionList } from '@/components/ds-v3/structure';
import { TagInput } from '@/components/ds-v3/tag-input';
import { Toaster, toast } from '@/components/ds-v3/toast';
import toastStyles from '@/components/ds-v3/toast.module.css';
import { Shot, Shots, State, States } from '../stage';
import d from './detalhe.module.css';

/* ——————————————————————————— Dados ——————————————————————————— */

export type StageId = 'novo' | 'contato' | 'qualificado' | 'proposta' | 'ganho' | 'perdido';

export const STAGES: { id: StageId; label: string; kind: StageKind; progress?: number; tone?: Tone }[] = [
  { id: 'novo', label: 'Novo', kind: 'todo' },
  { id: 'contato', label: 'Em contato', kind: 'progress', progress: 0.25 },
  { id: 'qualificado', label: 'Qualificado', kind: 'progress', progress: 0.5 },
  { id: 'proposta', label: 'Proposta', kind: 'progress', progress: 0.75 },
  { id: 'ganho', label: 'Ganho', kind: 'done', tone: 'green' },
  { id: 'perdido', label: 'Perdido', kind: 'lost', tone: 'gray' },
];
export const stageOf = (id: StageId) => STAGES.find((stage) => stage.id === id) ?? STAGES[0]!;
export function StageGlyph({ id, size = 14 }: { id: StageId; size?: number }) {
  const stage = stageOf(id);
  return <StageIcon kind={stage.kind} progress={stage.progress} tone={stage.tone ?? 'blue'} size={size} />;
}

export type Lead = {
  id: string;
  code: string;
  company: string;
  place: string;
  contact: string;
  email: string;
  phone: string;
  origin: string;
  originDetail: string;
  owner: string;
  value: number;
  age: number;
  interests: string[];
  stage: StageId;
  next?: { label: string; due: NextActionDue };
  outcome?: LeadOutcome;
};

export const LEADS: Lead[] = [
  { id: 'l-1301', code: '1301', company: 'Couro Nobre', place: 'Franca, SP · Curtume', contact: 'Tiago Rezende', email: 'compras@couronobre.com.br', phone: '(16) 99812-4410', origin: 'Vitrine', originDetail: 'Vitrine · Couro vegetal', owner: 'Clara Souto', value: 9800, age: 1, interests: ['E-mail marketing'], stage: 'novo' },
  { id: 'l-1298', code: '1298', company: 'Bella Passo', place: 'Birigui, SP · Calçado infantil', contact: 'Marina Lopes', email: 'marketing@bellapasso.com.br', phone: '(18) 99640-2231', origin: 'Portal', originDetail: 'Portal · Formulário de mídia', owner: 'Tiago Rezende', value: 14200, age: 2, interests: ['Push no app', 'Painel de LED'], stage: 'novo', next: { label: 'Retornar hoje às 14:00', due: 'today' } },
  { id: 'l-1296', code: '1296', company: 'Casa Forma', place: 'Novo Hamburgo, RS · Calçado masculino', contact: 'Clara Souto', email: 'clara@casaforma.com.br', phone: '(51) 99120-7781', origin: 'Indicação', originDetail: 'Indicação · Grupo Horizonte', owner: 'Marina Lopes', value: 6300, age: 3, interests: [], stage: 'novo' },
  { id: 'l-1291', code: '1291', company: 'Sapataria Ladeira', place: 'Salvador, BA · Loja de calçados', contact: 'Juliana Prates', email: 'juliana@sapatarialadeira.com.br', phone: '(71) 98842-1290', origin: 'Vitrine', originDetail: 'Vitrine · Coleção Primavera-Verão', owner: 'Rafael Dias', value: 18400, age: 3, interests: ['Banner Super Topo', 'Painel de LED', 'E-mail marketing', 'Push no app'], stage: 'contato', next: { label: 'Retornar hoje às 14:00', due: 'today' } },
  { id: 'l-1287', code: '1287', company: 'Ateliê Sul', place: 'Porto Alegre, RS · Couro artesanal', contact: 'Rafael Dias', email: 'contato@ateliesul.com.br', phone: '(51) 98711-0932', origin: 'Portal', originDetail: 'Portal · Mídia kit', owner: 'Clara Souto', value: 7900, age: 9, interests: ['Destaque na vitrine'], stage: 'contato', next: { label: 'Enviar mídia kit · 18/10', due: 'overdue' } },
  { id: 'l-1284', code: '1284', company: 'Lume Acessórios', place: 'São Paulo, SP · Bolsas e cintos', contact: 'Clara Souto', email: 'clara@lume.com.br', phone: '(11) 99230-1180', origin: 'Evento', originDetail: 'Evento · Esquenta Francal', owner: 'Juliana Prates', value: 11000, age: 4, interests: ['Push no app'], stage: 'contato' },
  { id: 'l-1279', code: '1279', company: 'Grupo Horizonte', place: 'Belo Horizonte, MG · Varejo multimarcas', contact: 'Tiago Rezende', email: 'midia@grupohorizonte.com.br', phone: '(31) 99456-2201', origin: 'Vitrine', originDetail: 'Vitrine · Lançamentos', owner: 'Marina Lopes', value: 24000, age: 5, interests: ['Painel de LED'], stage: 'qualificado' },
  { id: 'l-1275', code: '1275', company: 'Estúdio Norte', place: 'Recife, PE · Design e acessórios', contact: 'Juliana Prates', email: 'ola@estudionorte.com.br', phone: '(81) 99877-6610', origin: 'Portal', originDetail: 'Portal · Formulário de mídia', owner: 'Tiago Rezende', value: 8400, age: 2, interests: ['E-mail marketing'], stage: 'qualificado', next: { label: 'Reunião 24/10 às 10:00', due: 'later' } },
  { id: 'l-1268', code: '1268', company: 'Pátio Couro', place: 'Franca, SP · Curtume', contact: 'Marina Lopes', email: 'comercial@patiocouro.com.br', phone: '(16) 99102-3344', origin: 'Indicação', originDetail: 'Indicação · Couro Nobre', owner: 'Rafael Dias', value: 21500, age: 6, interests: ['Banner Super Topo', 'Painel de LED'], stage: 'proposta', next: { label: 'Retornar 21/10 às 16:00', due: 'overdue' } },
  { id: 'l-1262', code: '1262', company: 'Aurora Calçados', place: 'Franca, SP · Calçado feminino', contact: 'Juliana Prates', email: 'midia@auroracalcados.com.br', phone: '(16) 99345-8820', origin: 'Vitrine', originDetail: 'Vitrine · Coleção Primavera-Verão', owner: 'Marina Lopes', value: 18000, age: 2, interests: ['Banner Super Topo'], stage: 'proposta' },
  { id: 'l-1250', code: '1250', company: 'Vila Couro', place: 'Campina Grande, PB · Couro', contact: 'Rafael Dias', email: 'vendas@vilacouro.com.br', phone: '(83) 99610-4471', origin: 'Portal', originDetail: 'Portal · Mídia kit', owner: 'Clara Souto', value: 15000, age: 1, interests: ['Destaque na vitrine'], stage: 'ganho', outcome: { kind: 'won', date: '22/10' } },
  { id: 'l-1244', code: '1244', company: 'Trama Bolsas', place: 'Divinópolis, MG · Bolsas', contact: 'Tiago Rezende', email: 'trama@tramabolsas.com.br', phone: '(37) 99223-1100', origin: 'Vitrine', originDetail: 'Vitrine · Bolsas', owner: 'Juliana Prates', value: 5200, age: 12, interests: [], stage: 'perdido', outcome: { kind: 'lost', reason: 'Preço' } },
  { id: 'l-1239', code: '1239', company: 'Solar Calçados', place: 'Jaú, SP · Calçado feminino', contact: 'Clara Souto', email: 'solar@solarcalcados.com.br', phone: '(14) 99733-2019', origin: 'Evento', originDetail: 'Evento · Esquenta Francal', owner: 'Rafael Dias', value: 9100, age: 15, interests: [], stage: 'perdido', outcome: { kind: 'lost', reason: 'Prazo' } },
];

export const brl = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

const OWNERS: SelectOption[] = ['Rafael Dias', 'Marina Lopes', 'Clara Souto', 'Tiago Rezende', 'Juliana Prates'].map(
  (name) => ({ value: name, label: name, leading: <Avatar name={name} size="xs" decorative /> }),
);
const LOST_REASONS: SelectOption[] = ['Preço', 'Prazo', 'Sem verba', 'Concorrente', 'Sem resposta'].map((label) => ({
  value: label,
  label,
}));
const INTEREST_SUGGESTIONS = [
  'Banner Super Topo',
  'E-mail marketing',
  'Push no app',
  'Painel de LED',
  'Destaque na vitrine',
  'Patrocínio de pavilhão',
];

const ACTIVITIES: ActivityEntry[] = [
  {
    id: 'a-3',
    kind: 'call',
    author: 'Rafael Dias',
    when: 'há 2 h',
    text: 'Juliana confirmou interesse no Painel de LED do Pavilhão Azul para a semana da feira. Quer comparar com o Banner Super Topo antes de fechar e pediu os números de 2025.',
    next: { label: 'Retornar hoje às 14:00', due: 'today' },
  },
  {
    id: 'a-2',
    kind: 'email',
    author: 'Rafael Dias',
    when: 'ontem',
    text: 'Enviado o mídia kit da Francal 2026 com a tabela de CPM do portal e os pacotes de lançamento.',
    next: { label: 'Mídia kit lido · 20/10', due: 'later', done: true },
  },
  {
    id: 'a-1',
    kind: 'note',
    author: 'Marina Lopes',
    when: '18/10',
    text: 'Lead veio da Vitrine, coleção Primavera-Verão. Loja com 3 unidades em Salvador.',
  },
];

const CAMPAIGNS = [
  { name: 'Coleção Primavera-Verão no portal', meta: 'Banner Super Topo — Portal · 01/10 – 31/10', status: 'Veiculando', tone: 'green' as Tone, live: true },
  { name: 'Esquenta Francal', meta: 'E-mail marketing dedicado · 01/09 – 15/09', status: 'Concluída', tone: 'gray' as Tone, live: false },
];

/* ——————————————————————————— Avisos ——————————————————————————— */

/** O catálogo pode já ter um Toaster; se não tiver, monta um. */
export function EnsureToaster() {
  const [needed, setNeeded] = useState(false);
  useEffect(() => {
    const cls = toastStyles.viewport;
    setNeeded(!cls || !document.querySelector(`.${CSS.escape(cls)}`));
  }, []);
  return needed ? <Toaster /> : null;
}

/* ——————————————————————————— Registro de atividade ——————————————————————————— */

function draftToEntry(draft: ActivityDraft, author = 'Rafael Dias'): ActivityEntry {
  const date = draft.date ? draft.date.split('-').reverse().slice(0, 2).join('/') : '';
  const today = draft.date === '2026-10-22';
  const label = date ? `Retornar ${today ? 'hoje' : date}${draft.time ? ` às ${draft.time}` : ''}` : '';
  return {
    id: `a-${Date.now()}`,
    kind: draft.kind,
    author,
    when: 'agora',
    text: draft.text,
    next: label ? { label, due: today ? 'today' : 'later' } : null,
  };
}

/** Compositor + linha do tempo, com o estado na própria prancha. */
export function ActivityLog({ compact = false }: { compact?: boolean }) {
  const [items, setItems] = useState<ActivityEntry[]>(ACTIVITIES);
  return (
    <div className={d.activity} data-compact={compact || undefined}>
      <ActivityComposer
        owners={compact ? undefined : OWNERS}
        onSubmit={(draft) => {
          setItems((list) => [draftToEntry(draft), ...list]);
          toast('Atividade registrada');
        }}
      />
      <ActivityFeed
        items={items}
        onToggleNext={(id, done) =>
          setItems((list) =>
            list.map((item) => (item.id === id && item.next ? { ...item, next: { ...item.next, done } } : item)),
          )
        }
        onDelete={(id) => {
          const gone = items.find((item) => item.id === id);
          setItems((list) => list.filter((item) => item.id !== id));
          if (gone)
            toast('Registro excluído', {
              action: { label: 'Desfazer', onClick: () => setItems((list) => [gone, ...list]) },
            });
        }}
      />
    </div>
  );
}

/* ——————————————————————————— Detalhe do lead ——————————————————————————— */

type LeadState = { stage: StageId; outcome?: LeadOutcome };

function useLeadState(lead: Lead) {
  const [state, setState] = useState<LeadState>({ stage: lead.stage, outcome: lead.outcome });
  const [flash, setFlash] = useState(0);
  function move(stage: StageId, withUndo = true) {
    const previous = state;
    setState({ stage, outcome: stage === 'ganho' ? { kind: 'won', date: '22/10' } : stage === 'perdido' ? state.outcome : undefined });
    setFlash((value) => value + 1);
    if (withUndo)
      toast(`Lead movido para ${stageOf(stage).label}`, {
        action: {
          label: 'Desfazer',
          onClick: () => {
            setState(previous);
            setFlash((value) => value + 1);
          },
        },
      });
  }
  return { state, setState, flash, setFlash, move };
}

function LeadBody({ lead, compact = false }: { lead: Lead; compact?: boolean }) {
  const [interests, setInterests] = useState(lead.interests);
  return (
    <div className={d.body}>
      <section className={d.section} aria-labelledby={`${lead.id}-contato`}>
        <h3 id={`${lead.id}-contato`} className={d.sectionTitle}>
          Contato
        </h3>
        <DescriptionList
          labelWidth={compact ? 96 : 120}
          items={[
            { label: 'Contato', value: lead.contact, leading: <Avatar name={lead.contact} size="xs" decorative /> },
            {
              label: 'E-mail',
              value: (
                <TextLink href={`mailto:${lead.email}`} tone="text">
                  {lead.email}
                </TextLink>
              ),
              copy: lead.email,
            },
            { label: 'Telefone', value: lead.phone, copy: lead.phone },
            { label: 'Origem', value: lead.originDetail },
            { label: 'Responsável', value: lead.owner, leading: <Avatar name={lead.owner} size="xs" decorative /> },
          ]}
        />
      </section>
      <section className={d.section} aria-labelledby={`${lead.id}-interesses`}>
        <h3 id={`${lead.id}-interesses`} className={d.sectionTitle}>
          Interesses
        </h3>
        <TagInput
          label="Interesses"
          values={interests}
          onChange={setInterests}
          suggestions={INTEREST_SUGGESTIONS}
          placeholder="Adicionar interesse"
        />
      </section>
      <section className={d.section} aria-labelledby={`${lead.id}-atividades`}>
        <h3 id={`${lead.id}-atividades`} className={d.sectionTitle}>
          Atividades
        </h3>
        <ActivityLog compact={compact} />
      </section>
      <section className={d.section} aria-labelledby={`${lead.id}-campanhas`}>
        <h3 id={`${lead.id}-campanhas`} className={d.sectionTitle}>
          Campanhas relacionadas <Count>{CAMPAIGNS.length}</Count>
        </h3>
        <List label="Campanhas relacionadas">
          {CAMPAIGNS.map((campaign) => (
            <ListItem
              key={campaign.name}
              title={campaign.name}
              description={campaign.meta}
              href="#detalhe-lead"
              meta={
                <Badge variant="text" tone={campaign.tone} live={campaign.live}>
                  {campaign.status}
                </Badge>
              }
            />
          ))}
        </List>
      </section>
    </div>
  );
}

type Layout = { title: ReactNode; description: ReactNode; leading: ReactNode; toolbar: ReactNode; actions: ReactNode };

/** Cabeçalho, barra e ações do detalhe — os mesmos na moldura estática e na gaveta real. */
function useLeadLayout(lead: Lead, compact = false) {
  const { state, move, flash, setState, setFlash } = useLeadState(lead);
  const [confirm, setConfirm] = useState<'won' | 'lost' | null>(null);
  const [reason, setReason] = useState('Preço');
  const outcome = state.outcome;
  const reopen = () => {
    setState({ stage: 'proposta', outcome: undefined });
    setFlash((value) => value + 1);
    toast('Lead reaberto em Proposta');
  };
  const options: SelectOption[] = STAGES.map((stage) => ({
    value: stage.id,
    label: stage.label,
    leading: <StageGlyph id={stage.id} />,
  }));

  const stageSelect = (
    <Select size="sm" label="Etapa do lead" value={state.stage} options={options} onChange={(value) => move(value as StageId)} />
  );
  const layout: Layout = {
    leading: <BrandMark name={lead.company} size="md" decorative />,
    title: (
      <span className={d.title}>
        {lead.company}
        {outcome && (
          <span className={d.outcome} key={outcome.kind}>
            <Badge variant="text" tone={outcome.kind === 'won' ? 'green' : 'gray'} dot={outcome.kind === 'lost' ? 'hollow' : true}>
              {outcome.kind === 'won' ? 'Ganho' : `Perdido · ${outcome.reason}`}
            </Badge>
          </span>
        )}
      </span>
    ),
    description: lead.place,
    toolbar: compact ? (
      <span className={d.stageSelect} key={flash} data-flash={flash > 0 || undefined}>
        {stageSelect}
      </span>
    ) : outcome ? (
      <Button size="sm" variant="ghost" onClick={reopen}>
        Reabrir lead
      </Button>
    ) : (
      <span className={d.toolbar}>
        <Button size="sm" icon={Check} onClick={() => setConfirm('won')}>
          Marcar ganho
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirm('lost')}>
          Marcar perdido
        </Button>
      </span>
    ),
    actions: (
      <>
        {!compact && (
          <span className={d.stageSelect} key={flash} data-flash={flash > 0 || undefined}>
            {stageSelect}
          </span>
        )}
        <Menu
          label={`Mais ações de ${lead.company}`}
          align="end"
          width={200}
          sections={[
            ...(compact
              ? [
                  {
                    items: outcome
                      ? [{ label: 'Reabrir lead', onSelect: reopen }]
                      : [
                          { label: 'Marcar como ganho', onSelect: () => setConfirm('won') },
                          { label: 'Marcar como perdido', onSelect: () => setConfirm('lost') },
                        ],
                  },
                ]
              : []),
            {
              items: [
                { label: 'Criar campanha', onSelect: () => toast(`Rascunho criado para ${lead.company}`) },
                { label: 'Trocar responsável', onSelect: () => toast('Responsável atualizado') },
              ],
            },
            { items: [{ label: 'Excluir lead', danger: true, onSelect: () => toast('Exclusão pede confirmação', { tone: 'info' }) }] },
          ]}
          trigger={(trigger) => <IconButton {...trigger} label="Mais ações" icon={MoreHorizontal} variant="ghost" size="sm" />}
        />
      </>
    ),
  };

  const dialogs = (
    <>
      <Dialog
        open={confirm === 'won'}
        onClose={() => setConfirm(null)}
        size="sm"
        divided={false}
        title={`Marcar ${lead.company} como ganho?`}
        footer={
          <>
            <Button onClick={() => setConfirm(null)}>Cancelar</Button>
            <Button
              variant="primary"
              icon={Check}
              data-autofocus
              onClick={() => {
                setConfirm(null);
                setState({ stage: 'ganho', outcome: { kind: 'won', date: '22/10' } });
                setFlash((value) => value + 1);
                toast('Lead marcado como ganho');
              }}
            >
              Marcar como ganho
            </Button>
          </>
        }
      />
      <Dialog
        open={confirm === 'lost'}
        onClose={() => setConfirm(null)}
        size="sm"
        title={`Marcar ${lead.company} como perdido?`}
        footer={
          <>
            <Button data-autofocus onClick={() => setConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              icon={X}
              onClick={() => {
                setConfirm(null);
                setState({ stage: 'perdido', outcome: { kind: 'lost', reason } });
                setFlash((value) => value + 1);
                toast('Lead marcado como perdido');
              }}
            >
              Marcar como perdido
            </Button>
          </>
        }
      >
        <div className={d.reason}>
          <span className={d.reasonLabel} id={`${lead.id}-motivo`}>
            Motivo
          </span>
          <Select value={reason} onChange={setReason} options={LOST_REASONS} label="Motivo" />
        </div>
      </Dialog>
    </>
  );
  return { layout, dialogs };
}

/** Detalhe do lead numa moldura estática (prancha). */
export function LeadFrame({ lead, width = 520, height = 720 }: { lead: Lead; width?: number; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState(width);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const measure = () => setRoom(Math.min(width, el.clientWidth || width));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [width]);
  const compact = room < 440;
  const { layout, dialogs } = useLeadLayout(lead, compact);
  return (
    <div ref={ref} className={d.frameWrap} style={{ maxWidth: width }}>
      <DrawerFrame {...layout} width={width} height={height} onClose={() => undefined} className={d.frame}>
        <LeadBody lead={lead} compact={compact} />
      </DrawerFrame>
      {dialogs}
    </div>
  );
}

/** Gaveta real do lead, aberta a partir de uma lista ou do quadro. */
export function LeadDrawer({ lead, open, onClose }: { lead: Lead; open: boolean; onClose: () => void }) {
  const { layout, dialogs } = useLeadLayout(lead);
  return (
    <>
      <Drawer {...layout} open={open} onClose={onClose} size="md">
        <LeadBody lead={lead} />
      </Drawer>
      {dialogs}
    </>
  );
}

/* ——————————————————————————— Pranchas ——————————————————————————— */

const SAPATARIA = LEADS.find((lead) => lead.company === 'Sapataria Ladeira') ?? LEADS[0]!;

function DetalheLead() {
  const [openId, setOpenId] = useState<string | null>(null);
  const listed = LEADS.filter((lead) => lead.stage !== 'perdido').slice(2, 8);
  const openLead = LEADS.find((lead) => lead.id === openId);
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="start" pad="lg">
        <div className={d.context}>
          <div className={d.listCol}>
            <List label="Leads">
              {listed.map((lead) => (
                <ListItem
                  key={lead.id}
                  leading={<BrandMark name={lead.company} size="xs" variant="soft" decorative />}
                  title={lead.company}
                  description={`${stageOf(lead.stage).label} · ${lead.owner}`}
                  meta={<span className={d.money}>{brl(lead.value)}</span>}
                  selected={openId === lead.id}
                  onClick={() => setOpenId(lead.id)}
                />
              ))}
            </List>
          </div>
          <LeadFrame lead={SAPATARIA} />
        </div>
        {openLead && <LeadDrawer key={openLead.id} lead={openLead} open={Boolean(openId)} onClose={() => setOpenId(null)} />}
      </Shot>
      <Shot title="Celular" align="center" pad="lg">
        <div className={d.phone}>
          <LeadFrame lead={SAPATARIA} width={390} height={760} />
        </div>
      </Shot>
      <EnsureToaster />
    </Shots>
  );
}

function RegistroAtividade() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="center" pad="lg">
        <div className={d.logColumn}>
          <h3 className={d.sectionTitle}>Atividades</h3>
          <ActivityLog />
        </div>
      </Shot>
      <Shot title="Estados" align="start" pad="lg">
        <States min={360}>
          <State label="Composer vazio">
            <div className={d.cell}>
              <ActivityComposer />
            </div>
          </State>
          <State label="Preenchido">
            <div className={d.cell}>
              <ActivityComposer
                defaultValue={{
                  kind: 'meeting',
                  text: 'Reunião no estande: quer o Painel de LED nos 3 primeiros dias.',
                  date: '2026-10-24',
                  time: '10:00',
                }}
              />
            </div>
          </State>
          <State label="Enviando">
            <div className={d.cell}>
              <ActivityComposer sending defaultValue={{ kind: 'call', text: 'Retorno sobre o pacote de lançamento.' }} />
            </div>
          </State>
          <State label="Erro">
            <div className={d.cell}>
              <ActivityComposer error="Escreva o registro" defaultValue={{ kind: 'email' }} />
            </div>
          </State>
          <State label="Com próxima ação">
            <div className={d.cell} data-paper="">
              <ActivityFeed items={[ACTIVITIES[0]!]} />
            </div>
          </State>
          <State label="Atrasada">
            <div className={d.cell} data-paper="">
              <ActivityFeed
                items={[
                  {
                    id: 'late',
                    kind: 'call',
                    author: 'Clara Souto',
                    when: '17/10',
                    text: 'Pediu o mídia kit com os valores do Destaque na vitrine.',
                    next: { label: 'Enviar mídia kit · 18/10', due: 'overdue' },
                  },
                ]}
              />
            </div>
          </State>
        </States>
      </Shot>
      <EnsureToaster />
    </Shots>
  );
}

export const specimens: Record<string, ComponentType> = {
  'detalhe-lead': DetalheLead,
  'registro-atividade': RegistroAtividade,
};
