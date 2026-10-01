'use client';

import type { LucideIcon } from 'lucide-react';
import { Check, X } from 'lucide-react';
import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { VisuallyHidden } from './a11y';
import { LinkButton } from './link';
import { StepMarker } from './stepper';
import s from './timeline.module.css';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export type TimelineState = 'done' | 'current' | 'upcoming' | 'blocked';
export type TimelineEntry = {
  /** Chave estável (para animar só o que chega). Padrão: título + posição. */
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  date?: ReactNode;
  dateTime?: string;
  /** Padrão `done`. Em `dots`, `current` é o ponto azul (o mais recente). */
  state?: TimelineState;
  icon?: LucideIcon;
  badge?: ReactNode;
  extra?: ReactNode;
  /** `activity`: marcador da pessoa ou da marca (Avatar xs, BrandMark xs). */
  marker?: ReactNode;
  /** `activity`: texto citado (comentário, motivo), recolhido em 3 linhas. */
  quote?: ReactNode;
};

const stateLabel: Record<TimelineState, string> = {
  done: 'Concluída',
  current: 'Em andamento',
  upcoming: 'Pendente',
  blocked: 'Bloqueada',
};

/**
 * Marcos em ordem.
 * - `dots` (Histórico): ponto de 6 px — o mais recente em azul —, título 13/500 e meta “Marina Lopes ·
 *   29/09”; sem trilho.
 * - `steps` (próximos passos): marcador de 20 px do Stepper (feita, atual, a seguir) ligado por fio.
 * - `activity` (registro): Avatar/BrandMark xs como marcador, fio `--line-soft`, data relativa à direita.
 * - `icons`: mantido por compatibilidade.
 * `groupBy` separa com legendas (“Hoje”, “29/09”). Itens que chegam depois entram em cascata (40 ms).
 */
export function Timeline({
  items,
  variant = 'steps',
  label,
  groupBy,
}: {
  items: TimelineEntry[];
  variant?: 'dots' | 'steps' | 'activity' | 'icons';
  label: string;
  groupBy?: (entry: TimelineEntry, index: number) => string | undefined;
}) {
  const keyOf = (entry: TimelineEntry, index: number) =>
    entry.id ?? `${typeof entry.title === 'string' ? entry.title : 'item'}-${index}`;
  // Chegadas: o que não estava na primeira pintura entra com esmaecimento escalonado.
  const first = useRef<Set<string> | null>(null);
  if (first.current === null) first.current = new Set(items.map(keyOf));
  const order = useRef(new Map<string, number>());
  const fresh = items.map(keyOf).filter((key) => !first.current?.has(key) && !order.current.has(key));
  fresh.forEach((key, index) => order.current.set(key, index));

  const groups: { name?: string; entries: { entry: TimelineEntry; index: number }[] }[] = [];
  items.forEach((entry, index) => {
    const name = groupBy?.(entry, index);
    const last = groups[groups.length - 1];
    if (!last || (groupBy && last.name !== name)) groups.push({ name, entries: [{ entry, index }] });
    else last.entries.push({ entry, index });
  });

  const list = (entries: { entry: TimelineEntry; index: number }[], groupLabel?: string) => (
    <ol className={s.list} data-variant={variant} aria-label={groupLabel ? `${label} · ${groupLabel}` : label}>
      {entries.map(({ entry, index }) => {
        const key = keyOf(entry, index);
        const state = entry.state ?? 'done';
        const arrival = order.current.get(key);
        return (
          <li
            key={key}
            className={s.item}
            data-state={state}
            data-enter={arrival !== undefined || undefined}
            style={arrival !== undefined ? ({ '--i': Math.min(arrival, 5) } as CSSProperties) : undefined}
            aria-current={state === 'current' && variant === 'steps' ? 'step' : undefined}
          >
            <Marker entry={entry} state={state} index={index} variant={variant} />
            <div className={s.body}>
              <div className={s.titleRow}>
                <span className={s.title}>{entry.title}</span>
                {variant === 'steps' && <VisuallyHidden>{stateLabel[state]}</VisuallyHidden>}
                {entry.badge}
                {variant !== 'dots' && entry.date && (
                  <time className={s.date} dateTime={entry.dateTime}>
                    {entry.date}
                  </time>
                )}
              </div>
              {variant === 'dots' ? (
                (entry.description || entry.date) && (
                  <div className={s.meta}>
                    {entry.description}
                    {entry.description && entry.date && <span aria-hidden="true"> · </span>}
                    {entry.date && <time dateTime={entry.dateTime}>{entry.date}</time>}
                  </div>
                )
              ) : (
                entry.description && <div className={s.desc}>{entry.description}</div>
              )}
              {entry.quote && (
                <div className={s.quote}>
                  <ExpandableText>{entry.quote}</ExpandableText>
                </div>
              )}
              {entry.extra && <div className={s.extra}>{entry.extra}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );

  if (!groupBy) return list(groups[0]?.entries ?? []);
  return (
    <div className={s.groups} role="group" aria-label={label}>
      {groups.map((group, index) => (
        <Fragment key={`${group.name ?? ''}-${index}`}>
          <div className={s.groupHead} aria-hidden="true">
            {group.name}
          </div>
          {list(group.entries, group.name)}
        </Fragment>
      ))}
    </div>
  );
}

function Marker({
  entry,
  state,
  index,
  variant,
}: {
  entry: TimelineEntry;
  state: TimelineState;
  index: number;
  variant: 'dots' | 'steps' | 'activity' | 'icons';
}) {
  if (variant === 'dots') return <span className={s.dot} aria-hidden="true" />;
  if (variant === 'steps')
    return (
      <span className={s.marker} aria-hidden="true">
        <StepMarker state={state} index={index} />
      </span>
    );
  if (variant === 'activity')
    return (
      <span className={s.marker} aria-hidden="true">
        {entry.marker ?? <span className={s.dot} />}
      </span>
    );
  const Icon = entry.icon;
  return (
    <span className={s.bubble} aria-hidden="true">
      {Icon ? <Icon /> : state === 'done' ? <Check /> : state === 'blocked' ? <X /> : index + 1}
    </span>
  );
}

/**
 * Texto longo recolhido em `lines` linhas (padrão 3). “Ver tudo” só aparece quando há corte de fato.
 */
export function ExpandableText({
  children,
  lines = 3,
  moreLabel = 'Ver tudo',
  lessLabel = 'Ver menos',
}: {
  children: ReactNode;
  lines?: number;
  moreLabel?: string;
  lessLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const [open, setOpen] = useState(false);
  const [clipped, setClipped] = useState(false);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    const measure = () => setClipped(el.scrollHeight > el.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, children]);
  return (
    <div className={s.expandable}>
      <div
        ref={ref}
        id={id}
        className={s.clamp}
        data-open={open || undefined}
        style={{ '--lines': lines } as CSSProperties}
      >
        {children}
      </div>
      {(clipped || open) && (
        <LinkButton tone="quiet" aria-expanded={open} aria-controls={id} onClick={() => setOpen((value) => !value)}>
          {open ? lessLabel : moreLabel}
        </LinkButton>
      )}
    </div>
  );
}
