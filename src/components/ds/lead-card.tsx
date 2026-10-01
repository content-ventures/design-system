'use client';

import { useState } from 'react';
import { ArrowUpRight, Building2, Check, Clock3, Mail, MapPin, Star } from 'lucide-react';
import { Badge, Button } from './primitives';
import s from './lead-card.module.css';

export type Lead = {
  name: string;
  company: string;
  initials: string;
  interest: string;
  source: string;
  city: string;
  owner: string;
  elapsed: string;
  color: 'blue' | 'green' | 'amber';
};
export const exampleLeads: Lead[] = [
  {
    name: 'Marina Costa',
    company: 'Empresa Aurora',
    initials: 'MC',
    interest: 'Coleção verão 2027',
    source: 'Vitrine · Pedido de contato',
    city: 'São Paulo, SP',
    owner: 'Equipe comercial',
    elapsed: 'Há 12 min',
    color: 'blue',
  },
  {
    name: 'Rafael Almeida',
    company: 'Grupo Horizonte',
    initials: 'RA',
    interest: 'Novos fornecedores',
    source: 'Campanha · Formulário',
    city: 'Curitiba, PR',
    owner: 'Equipe de relacionamento',
    elapsed: 'Há 45 min',
    color: 'green',
  },
  {
    name: 'Camila Rocha',
    company: 'Casa Forma',
    initials: 'CR',
    interest: 'Linha de decoração',
    source: 'Vitrine · Catálogo',
    city: 'Belo Horizonte, MG',
    owner: 'Equipe comercial',
    elapsed: 'Há 1 h',
    color: 'amber',
  },
];

export function LeadCard({
  lead = exampleLeads[0]!,
  stage = 'Novo lead',
  onStageChange,
}: {
  lead?: Lead;
  stage?: string;
  onStageChange?: (value: string) => void;
}) {
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [contacted, setContacted] = useState(false);
  return (
    <article className={s.card} data-color={lead.color}>
      <div className={s.topline}>
        <Badge tone={contacted || stage === 'Qualificados' ? 'success' : 'brand'}>
          {contacted ? 'Contato registrado' : stage}
        </Badge>
        <button
          className={s.favorite}
          aria-label={`Destacar ${lead.name}`}
          aria-pressed={saved}
          onClick={() => setSaved(!saved)}
        >
          <Star size={17} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className={s.identity}>
        <span className={s.avatar}>
          {lead.initials}
          <i />
        </span>
        <div>
          <h3>{lead.name}</h3>
          <p>
            <Building2 size={12} />
            {lead.company}
          </p>
        </div>
      </div>
      <div className={s.interest}>
        <span>Interesse demonstrado</span>
        <strong>{lead.interest}</strong>
      </div>
      <div className={s.metadata}>
        <span>
          <MapPin size={13} />
          {lead.city}
        </span>
        <span>{lead.source}</span>
      </div>
      <div className={s.owner}>
        <span className={s.ownerAvatar}>EQ</span>
        <span>{lead.owner}</span>
        <small>
          <Clock3 size={12} />
          {lead.elapsed}
        </small>
      </div>
      {onStageChange ? (
        <label className={s.stage}>
          Mover para
          <select
            aria-label={`Etapa de ${lead.company}`}
            value={stage}
            onChange={(e) => onStageChange(e.target.value)}
          >
            {['Novos leads', 'Em contato', 'Qualificados'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      ) : (
        <Button
          variant="secondary"
          className={s.contactButton}
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Fechar contato' : 'Ver contato'}
          <ArrowUpRight size={15} />
        </Button>
      )}
      {expanded && (
        <div className={s.contact}>
          <span>
            <Mail size={14} />
            contato@exemplo.invalid
          </span>
          <Button size="sm" variant="ghost" onClick={() => setContacted(!contacted)}>
            <Check size={14} />
            {contacted ? 'Desfazer registro' : 'Registrar contato local'}
          </Button>
          <small>Contato fictício. Nenhuma mensagem será enviada.</small>
        </div>
      )}
    </article>
  );
}
