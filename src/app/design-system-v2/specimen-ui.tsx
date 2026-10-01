'use client';
import type { ReactNode } from 'react';
import { CalendarDays, CircleDollarSign, FileCheck2, Info, Send } from 'lucide-react';
import s from './specimen.module.css';
import { Stepper, Timeline, type TimelineItem } from '../../components/ds-v2';
export function Stage({
  title,
  children,
  tools,
  footer,
  appearance = 'framed',
}: {
  title: string;
  children: ReactNode;
  tools?: ReactNode;
  footer?: string;
  appearance?: 'framed' | 'plain';
}) {
  return (
    <section className={s.stage} data-appearance={appearance}>
      <header className={s.stageHeader}>
        <strong>{title}</strong>
        {tools ?? <span>Exemplo interativo</span>}
      </header>
      <div className={s.stageBody}>{children}</div>
      {footer && (
        <footer className={s.stageFooter}>
          <Info size={13} />
          {footer}
        </footer>
      )}
    </section>
  );
}
export function Segmented({
  label,
  values,
  value,
  onChange,
}: {
  label: string;
  values: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={s.segment} role="group" aria-label={label}>
      {values.map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={value === item}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
export function Steps({
  current,
  labels = ['Informações', 'Mídias', 'Revisão'],
}: {
  current: number;
  labels?: string[];
}) {
  return <Stepper current={current} steps={labels.map((label) => ({ label }))} />;
}
export function Metrics() {
  return (
    <div className={s.kpis}>
      {[
        ['Investimento', 'R$ 24.800', '68% do orçamento'],
        ['Impressões', '184.260', '+12,4% no período'],
        ['Campanhas ativas', '18', '4 iniciadas neste mês'],
      ].map(([label, value, note]) => (
        <article key={label}>
          <small>{label}</small>
          <strong>{value}</strong>
          <span>{note}</span>
        </article>
      ))}
    </div>
  );
}
export function Activity({ extra = [] }: { extra?: string[] }) {
  const base: TimelineItem[] = [
    {
      title: 'Campanha criada por Ana Lima',
      description: 'Estrutura inicial e responsáveis definidos.',
      date: '29 set, 15:55',
      dateTime: '2026-09-29T15:55:00-03:00',
      meta: 'Equipe comercial',
      icon: FileCheck2,
    },
    {
      title: 'Mídias e período definidos',
      description: 'Display e e-mail reservados para outubro.',
      date: '29 set, 16:20',
      dateTime: '2026-09-29T16:20:00-03:00',
      meta: 'Equipe comercial',
      icon: CalendarDays,
    },
    {
      title: 'Investimento confirmado',
      description: 'Orçamento previsto de R$ 24.800,00.',
      date: '30 set, 08:15',
      dateTime: '2026-09-30T08:15:00-03:00',
      meta: 'Equipe comercial',
      icon: CircleDollarSign,
    },
    {
      title: 'Proposta enviada para revisão',
      description: 'Aguardando a análise e a aprovação do portal.',
      date: 'Hoje, 09:40',
      dateTime: '2026-09-30T09:40:00-03:00',
      meta: 'Equipe comercial',
      icon: Send,
    },
  ];
  const added: TimelineItem[] = extra.map((title, index) => ({
    title,
    description: 'Atividade registrada no histórico da campanha.',
    date: index === extra.length - 1 ? 'Agora' : 'Hoje',
    meta: 'Você',
    icon: Send,
  }));
  const items = [...base, ...added].map((item, index, list) => ({
    ...item,
    state: index === list.length - 1 ? ('current' as const) : ('complete' as const),
  }));

  return <Timeline label="Histórico da campanha" items={items} />;
}
export function Description({ entries }: { entries: [string, ReactNode][] }) {
  return (
    <dl className={s.description}>
      {entries.map(([label, value]) => (
        <div key={label} style={{ display: 'contents' }}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
