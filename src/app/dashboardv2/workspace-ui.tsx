'use client';

import { useState, type ReactNode } from 'react';
import {
  ArrowDownToLine,
  ArrowDownAZ,
  ChevronUp,
  CircleCheck,
  Search,
  Target,
  X,
  type LucideIcon,
} from 'lucide-react';
import { number } from '../campanhas/campaign-data';
import type { DemoRecord, Field } from './workspace-data';
import s from './dashboard.module.css';
import a from './application.module.css';
import { Status as StatusLabel } from '../../components/ds-v2/status';

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export type Tone = 'blue' | 'amber' | 'pink' | 'green';
export const toneFor = (status: string): Tone =>
  /Ativo|Disponível|Em veiculação|Novo|Manual|Últimos/.test(status)
    ? 'blue'
    : /Conclu|Assinado|Convertido|Aprovado|Lida|Enviado/.test(status)
      ? 'green'
      : /Atenção|Indisponível|Arquivado|Perdido|Atrasado|Ajustes|aprovação/.test(status)
        ? 'pink'
        : 'amber';
export function Group({
  id,
  label,
  tone,
  icon: Icon = Target,
  count,
  children,
}: {
  id: string;
  label: string;
  tone: Tone;
  icon?: LucideIcon;
  count: number;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(true);
  return (
    <section className={`${s.group} ${a.groupSurface}`} data-tone={tone} aria-label={label}>
      <h2>
        <button
          className={s.groupHeading}
          aria-expanded={expanded}
          aria-controls={`group-${id}`}
          onClick={() => setExpanded(!expanded)}
        >
          <ChevronUp size={15} className={s.collapseIcon} aria-hidden="true" />
          <Icon size={15} className={s.groupIcon} aria-hidden="true" />
          <span>{label}</span>
          <span className={s.count}>{count}</span>
        </button>
      </h2>
      <div id={`group-${id}`} hidden={!expanded}>
        {children}
      </div>
    </section>
  );
}
export function Status({ value }: { value: string }) {
  return <StatusLabel value={value} tone={toneFor(value)} className={a.recordStatus} />;
}
export function displayValue(value: string | number | undefined, field: Field) {
  if (value === undefined || value === '') return '—';
  if (field.type === 'currency') return formatCurrency(Number(value));
  if (field.type === 'number') return number(Number(value));
  if (/^\d{4}-\d{2}-\d{2}T/.test(String(value)) && Number.isFinite(Date.parse(String(value))))
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(String(value)));
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value)))
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(
      new Date(`${value}T12:00:00Z`),
    );
  return String(value);
}
export function exportRecords(title: string, fields: Field[], records: DemoRecord[]) {
  const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const csv =
    '\uFEFF' +
    [
      fields.map((field) => field.label),
      ...records.map((record) => fields.map((field) => displayValue(record[field.key], field))),
    ]
      .map((row) => row.map(quote).join(';'))
      .join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `mediaon-${title}-demo.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export { Tabs } from '../../components/ds-v2/tabs';
export function Toolbar({
  title,
  query,
  setQuery,
  children,
  exportAction,
  onSort,
  sort,
}: {
  title: string;
  query: string;
  setQuery: (value: string) => void;
  children?: ReactNode;
  exportAction?: () => void;
  onSort?: () => void;
  sort?: boolean;
}) {
  return (
    <div className={`${s.toolbar} ${a.screenToolbar}`}>
      {children}
      <div className={s.toolbarTools}>
        <label className={s.search}>
          <Search size={15} aria-hidden="true" />
          <input
            aria-label={`Buscar ${title.toLowerCase()}`}
            placeholder="Buscar…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button aria-label="Limpar busca" onClick={() => setQuery('')}>
              <X size={13} />
            </button>
          )}
        </label>
        {onSort && (
          <button
            className={s.iconButton}
            aria-label={sort ? 'Ordenar de Z a A' : 'Ordenar de A a Z'}
            title="Ordenar por nome"
            onClick={onSort}
          >
            <ArrowDownAZ size={17} />
          </button>
        )}
        {exportAction && (
          <button
            className={s.iconButton}
            aria-label={`Exportar ${title.toLowerCase()}`}
            title="Exportar CSV"
            onClick={exportAction}
          >
            <ArrowDownToLine size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
export function Empty({ reset }: { reset: () => void }) {
  return (
    <div className={s.empty}>
      <Search size={28} />
      <h2>Nenhum resultado encontrado</h2>
      <p>Tente outro termo ou limpe os filtros.</p>
      <button onClick={reset}>Limpar filtros</button>
    </div>
  );
}
export function SummaryStrip({
  items,
}: {
  items: { label: string; value: string | number; hint?: string }[];
}) {
  return (
    <dl className={a.summaryStrip}>
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
          {item.hint && <small>{item.hint}</small>}
        </div>
      ))}
    </dl>
  );
}
export function SavedNote() {
  return (
    <span className={a.savedNote}>
      <CircleCheck size={14} />
      Alterações salvas nesta demonstração
    </span>
  );
}
