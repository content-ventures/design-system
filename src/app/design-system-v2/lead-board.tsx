'use client';

import { useId, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
} from 'lucide-react';
import {
  ActionMenu,
  AvatarGroup,
  Button,
  Dialog,
  FormField,
  IconButton,
  Input,
  Select,
  Status,
} from '../../components/ds-v2';
import { Description } from './specimen-ui';
import s from './reference-patterns.module.css';

const stages = ['Novos', 'Qualificados', 'Proposta', 'Fechados'] as const;
type LeadStage = (typeof stages)[number];
type Lead = {
  id: string;
  company: string;
  contact: string;
  stage: LeadStage;
  value: number;
  origin: string;
  date: string;
  activity: string;
  comments: number;
  attachments: number;
  owner: string;
  tag: string;
};
const initialLeads: Lead[] = [
  {
    id: 'aurora',
    company: 'Calçados Aurora',
    contact: 'Mariana Souza',
    stage: 'Novos',
    value: 24800,
    origin: 'Credenciamento',
    date: 'Hoje',
    activity: 'Primeiro contato',
    comments: 2,
    attachments: 1,
    owner: 'Ana Lima',
    tag: 'Display',
  },
  {
    id: 'norte',
    company: 'Ateliê Norte',
    contact: 'Camila Rocha',
    stage: 'Novos',
    value: 9600,
    origin: 'Vitrine',
    date: '02 out',
    activity: 'Apresentar formatos',
    comments: 1,
    attachments: 0,
    owner: 'Pedro Costa',
    tag: 'E-mail',
  },
  {
    id: 'forma',
    company: 'Studio Forma',
    contact: 'Rafael Martins',
    stage: 'Qualificados',
    value: 12600,
    origin: 'Indicação',
    date: 'Hoje',
    activity: 'Reunião de briefing',
    comments: 4,
    attachments: 2,
    owner: 'Ana Lima',
    tag: 'Multicanal',
  },
  {
    id: 'passo',
    company: 'Passo Leve',
    contact: 'Luiza Melo',
    stage: 'Qualificados',
    value: 18400,
    origin: 'Credenciamento',
    date: '03 out',
    activity: 'Definir investimento',
    comments: 3,
    attachments: 1,
    owner: 'Pedro Costa',
    tag: 'Display',
  },
  {
    id: 'horizonte',
    company: 'Grupo Horizonte',
    contact: 'Bruno Reis',
    stage: 'Proposta',
    value: 32600,
    origin: 'Comercial',
    date: '01 out',
    activity: 'Retorno da proposta',
    comments: 6,
    attachments: 3,
    owner: 'Ana Lima',
    tag: 'Multicanal',
  },
  {
    id: 'terra',
    company: 'Terra & Couro',
    contact: 'Sofia Nunes',
    stage: 'Proposta',
    value: 14800,
    origin: 'Vitrine',
    date: '05 out',
    activity: 'Revisar pedido',
    comments: 2,
    attachments: 2,
    owner: 'Pedro Costa',
    tag: 'E-mail',
  },
  {
    id: 'essenza',
    company: 'Essenza',
    contact: 'Clara Alves',
    stage: 'Fechados',
    value: 21000,
    origin: 'Comercial',
    date: '29 set',
    activity: 'Pedido aprovado',
    comments: 5,
    attachments: 2,
    owner: 'Ana Lima',
    tag: 'Display',
  },
];
const money = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

function LeadCard({
  lead,
  onMove,
  onDetail,
  prefix,
}: {
  lead: Lead;
  onMove: (id: string, stage: LeadStage) => void;
  onDetail: () => void;
  prefix: string;
}) {
  return (
    <article
      className={s.leadCard}
      aria-label={lead.company}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', lead.id);
        event.dataTransfer.effectAllowed = 'move';
      }}
    >
      <div className={s.cardContext}>
        <span>{lead.origin}</span>
        <ActionMenu
          label={`Mover ${lead.company}`}
          simple
          trigger={
            <IconButton
              id={`${prefix}-${lead.id}-actions`}
              label={`Ações de ${lead.company}`}
              icon={MoreHorizontal}
              variant="ghost"
            />
          }
          items={stages
            .filter((stage) => stage !== lead.stage)
            .map((stage) => ({
              label: `Mover para ${stage}`,
              icon: ArrowRight,
              onSelect: () => onMove(lead.id, stage),
            }))}
        />
      </div>
      <button type="button" className={s.cardTitle} onClick={onDetail}>
        {lead.company}
      </button>
      <p className={s.contact}>{lead.contact}</p>
      <div className={s.cardValue}>
        <strong>{money(lead.value)}</strong>
        <Status
          variant="soft"
          value={lead.tag}
          tone={lead.tag === 'Multicanal' ? 'amber' : lead.tag === 'E-mail' ? 'green' : 'blue'}
        />
      </div>
      <div className={s.nextActivity}>
        <CalendarDays size={13} />
        <span>{lead.activity}</span>
        <time>{lead.date}</time>
      </div>
      <footer className={s.leadFooter}>
        <div>
          <span
            aria-label={`${lead.comments} ${lead.comments === 1 ? 'comentário' : 'comentários'}`}
            title="Comentários"
          >
            <MessageSquare size={13} />
            {lead.comments}
          </span>
          <span
            aria-label={`${lead.attachments} ${lead.attachments === 1 ? 'anexo' : 'anexos'}`}
            title="Anexos"
          >
            <Paperclip size={13} />
            {lead.attachments}
          </span>
        </div>
        <AvatarGroup
          people={[
            { name: lead.owner, tone: lead.owner === 'Ana Lima' ? 'blue' : 'green' },
            ...(lead.stage === 'Proposta' ? [{ name: 'Bia Souza', tone: 'amber' as const }] : []),
          ]}
        />
      </footer>
    </article>
  );
}

export function LeadBoard({ single = false }: { single?: boolean }) {
  const uid = useId();
  const [leads, setLeads] = useState(initialLeads);
  const [query, setQuery] = useState('');
  const [owner, setOwner] = useState('Todos');
  const [sort, setSort] = useState('Atividade');
  const [announcement, setAnnouncement] = useState('');
  const [over, setOver] = useState<LeadStage | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [creating, setCreating] = useState<LeadStage | null>(null);
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [error, setError] = useState('');
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const filtered = leads.filter(
    (lead) =>
      normalize(`${lead.company} ${lead.contact}`).includes(normalize(query)) &&
      (owner === 'Todos' || lead.owner === owner),
  );
  const selected = leads.find((lead) => lead.id === detail);
  function move(id: string, stage: LeadStage) {
    const lead = leads.find((item) => item.id === id);
    if (!lead || lead.stage === stage) return;
    setLeads((previous) => previous.map((item) => (item.id === id ? { ...item, stage } : item)));
    setAnnouncement(`${lead.company} movido para ${stage}.`);
    requestAnimationFrame(() => document.getElementById(`${uid}-${id}-actions`)?.focus());
  }
  function openCreate(stage: LeadStage) {
    setCompany('');
    setContact('');
    setError('');
    setCreating(stage);
  }
  const card = (lead: Lead) => (
    <LeadCard
      key={lead.id}
      lead={lead}
      onMove={move}
      onDetail={() => setDetail(lead.id)}
      prefix={uid}
    />
  );
  return (
    <div className={s.boardShell}>
      {!single && (
        <>
          <div className={s.boardToolbar}>
            <Input
              aria-label="Buscar leads"
              placeholder="Buscar empresa ou contato…"
              icon={<Search size={14} />}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Select
              label="Responsável"
              value={owner}
              onValueChange={setOwner}
              options={['Todos', 'Ana Lima', 'Pedro Costa'].map((value) => ({
                value,
                label: value === 'Todos' ? 'Todos os responsáveis' : value,
              }))}
            />
            <Select
              label="Ordenação dos leads"
              value={sort}
              onValueChange={setSort}
              options={['Atividade', 'Maior valor', 'Empresa'].map((value) => ({
                value,
                label: value,
              }))}
            />
            <Button variant="primary" icon={Plus} onClick={() => openCreate('Novos')}>
              Novo lead
            </Button>
          </div>
          <div className={s.boardSummary}>
            <span>
              {filtered.length} oportunidades <span>·</span>{' '}
              {money(filtered.reduce((sum, lead) => sum + lead.value, 0))}
            </span>
            <span>Francal 2026</span>
          </div>
        </>
      )}
      {single ? (
        <div className={s.singleCard}>{leads[0] && card(leads[0])}</div>
      ) : (
        <div className={s.boardScroll} role="region" aria-label="Funil de leads" tabIndex={0}>
          <div className={s.board}>
            {stages.map((stage, index) => {
              const stageLeads = filtered
                .filter((lead) => lead.stage === stage)
                .sort((a, b) =>
                  sort === 'Maior valor'
                    ? b.value - a.value
                    : sort === 'Empresa'
                      ? a.company.localeCompare(b.company, 'pt-BR')
                      : (a.date === 'Hoje' ? 0 : parseInt(a.date) || 99) -
                        (b.date === 'Hoje' ? 0 : parseInt(b.date) || 99),
                );
              return (
                <section
                  key={stage}
                  className={s.lane}
                  data-stage={index}
                  data-over={over === stage || undefined}
                  aria-label={stage}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setOver(stage);
                  }}
                  onDragLeave={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null))
                      setOver(null);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setOver(null);
                    move(event.dataTransfer.getData('text/plain'), stage);
                  }}
                >
                  <header className={s.laneHeader}>
                    <div>
                      <h3>
                        <i aria-hidden="true" />
                        {stage}
                        <span>{stageLeads.length}</span>
                      </h3>
                      <small>{money(stageLeads.reduce((sum, lead) => sum + lead.value, 0))}</small>
                    </div>
                    <IconButton
                      label={`Adicionar lead em ${stage}`}
                      icon={Plus}
                      variant="ghost"
                      onClick={() => openCreate(stage)}
                    />
                  </header>
                  <div className={s.laneCards}>
                    {stageLeads.map(card)}
                    {!stageLeads.length && (
                      <div className={s.emptyLane}>
                        Nenhum lead{query || owner !== 'Todos' ? ' neste filtro' : ' nesta etapa'}.
                      </div>
                    )}
                  </div>
                  <button type="button" className={s.addLead} onClick={() => openCreate(stage)}>
                    <Plus size={14} />
                    Adicionar lead
                  </button>
                </section>
              );
            })}
          </div>
        </div>
      )}
      <span role="status" className={s.srOnly}>
        {announcement}
      </span>
      <Dialog
        open={Boolean(creating)}
        onClose={() => setCreating(null)}
        title="Novo lead"
        description={`Oportunidade em ${creating ?? 'Novos'}`}
        footer={
          <>
            <Button onClick={() => setCreating(null)}>Cancelar</Button>
            <Button variant="primary" type="submit" form={`${uid}-create`}>
              Adicionar lead
            </Button>
          </>
        }
      >
        <form
          id={`${uid}-create`}
          className={s.formStack}
          onSubmit={(event) => {
            event.preventDefault();
            if (company.trim().length < 3) {
              setError('Informe uma empresa com pelo menos 3 caracteres.');
              document.getElementById(`${uid}-company`)?.focus();
              return;
            }
            const id = `local-${Date.now()}`;
            setLeads((previous) => [
              ...previous,
              {
                id,
                company: company.trim(),
                contact: contact.trim() || 'Contato a definir',
                stage: creating ?? 'Novos',
                value: 0,
                origin: 'Cadastro manual',
                date: 'A definir',
                activity: 'Agendar contato',
                comments: 0,
                attachments: 0,
                owner: 'Ana Lima',
                tag: 'Display',
              },
            ]);
            setAnnouncement(`${company} adicionado.`);
            setCreating(null);
          }}
        >
          <FormField id={`${uid}-company`} label="Empresa" required>
            <Input
              id={`${uid}-company`}
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              error={error || undefined}
            />
          </FormField>
          <FormField id={`${uid}-contact`} label="Contato">
            <Input
              id={`${uid}-contact`}
              value={contact}
              onChange={(event) => setContact(event.target.value)}
            />
          </FormField>
        </form>
      </Dialog>
      <Dialog
        open={Boolean(selected)}
        onClose={() => setDetail(null)}
        kind="drawer"
        title={selected?.company ?? 'Lead'}
        description={selected?.contact}
      >
        {selected && (
          <div className={s.formStack}>
            <Status value={selected.stage} tone="blue" />
            <Description
              entries={[
                ['Valor estimado', money(selected.value)],
                ['Responsável', selected.owner],
                ['Origem', selected.origin],
                ['Próxima atividade', `${selected.activity} · ${selected.date}`],
              ]}
            />
            <Select
              label="Etapa do lead"
              value={selected.stage}
              onValueChange={(stage) => {
                setLeads((previous) =>
                  previous.map((lead) =>
                    lead.id === selected.id ? { ...lead, stage: stage as LeadStage } : lead,
                  ),
                );
                setAnnouncement(`${selected.company} movido para ${stage}.`);
              }}
              options={stages.map((value) => ({ value, label: value }))}
            />
          </div>
        )}
      </Dialog>
    </div>
  );
}
