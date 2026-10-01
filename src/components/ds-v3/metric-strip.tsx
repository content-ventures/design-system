'use client';

import type { ReactNode } from 'react';
import { VisuallyHidden } from './a11y';
import { Tooltip } from './overlays';
import { Delta } from './stat';
import s from './metric-strip.module.css';

export type MetricDelta = {
  value: string;
  trend: 'up' | 'down' | 'flat';
  /** Bom ou ruim independe da direção (custo subindo é ruim). Padrão: sobe = bom. */
  tone?: 'good' | 'bad' | 'flat';
  /** Leitura completa, ex.: “alta de 3,8% contra os 7 dias anteriores”. */
  label?: string;
};

export type MetricProps = {
  label: string;
  value?: ReactNode;
  /** Unidade depois do número (“%”), menor e em `--muted`. */
  unit?: string;
  delta?: MetricDelta;
  /** Legenda com dado (“24,3% do contratado”). */
  hint?: ReactNode;
  /** Legenda em âmbar: atenção (“Abaixo do ritmo”). */
  warn?: boolean;
  /** Barra de 4 px sob o valor (entrega, consumo). */
  meter?: { value: number; max?: number; label?: string };
  /** Sem dado: “—” e a legenda “Sem dados no período” (ou o texto passado). */
  empty?: boolean | string;
  loading?: boolean;
  /** Comparação ao passar o mouse ou focar a célula. */
  tooltip?: string;
  'data-force'?: string;
};

/** Uma célula da faixa. Rótulo 12 `--muted` com a variação à direita, valor tabular e legenda. */
export function Metric({
  label,
  value,
  unit,
  delta,
  hint,
  warn = false,
  meter,
  empty = false,
  loading = false,
  tooltip,
  'data-force': force,
}: MetricProps) {
  const isEmpty = Boolean(empty) || value === undefined || value === null || value === '';
  const caption = isEmpty && !loading ? (typeof empty === 'string' ? empty : hint ?? 'Sem dados no período') : hint;
  const pct = meter ? Math.max(0, Math.min(100, (meter.value / (meter.max ?? 100)) * 100)) : 0;
  const valueKey = typeof value === 'string' || typeof value === 'number' ? String(value) : undefined;
  const cell = (
    <div
      className={s.metric}
      role="group"
      aria-label={label}
      aria-busy={loading || undefined}
      tabIndex={tooltip ? 0 : undefined}
      data-tip={tooltip ? '' : undefined}
      data-force={force}
    >
      <span className={s.label} aria-hidden="true">
        {label}
      </span>
      {loading ? (
        <>
          <span className={s.skelValue} aria-hidden="true" />
          <span className={s.skelHint} aria-hidden="true" />
          <VisuallyHidden>Carregando</VisuallyHidden>
        </>
      ) : (
        <>
          <b className={s.value} data-empty={isEmpty || undefined} key={valueKey}>
            {isEmpty ? '—' : value}
            {unit && !isEmpty && <span className={s.unit}>{unit}</span>}
          </b>
          {delta && !isEmpty && (
            <span className={s.change} key={`d-${delta.value}-${delta.trend}`}>
              <Delta
                value={delta.value}
                trend={delta.trend}
                tone={delta.tone}
                variant="text"
                label={delta.label}
              />
            </span>
          )}
          {meter && !isEmpty && (
            <span
              className={s.meter}
              role="progressbar"
              aria-label={meter.label ?? label}
              aria-valuemin={0}
              aria-valuemax={meter.max ?? 100}
              aria-valuenow={meter.value}
            >
              <i style={{ width: `${pct}%` }} />
            </span>
          )}
          {caption && (
            <span className={s.hint} data-warn={(warn && !isEmpty) || undefined}>
              {caption}
            </span>
          )}
        </>
      )}
    </div>
  );
  return tooltip ? <Tooltip content={tooltip}>{cell}</Tooltip> : cell;
}

/**
 * Faixa de indicadores: um contorno só, células unidas por fio de 1 px. Até 6 células; quebra pela
 * largura do próprio contêiner (6 → 3 → 2; 4 → 2). `figure` é a faixa compacta de formulário (16 px).
 */
export function MetricStrip({
  items,
  children,
  columns,
  size = 'kpi',
  label,
}: {
  items?: MetricProps[];
  children?: ReactNode;
  columns?: number;
  size?: 'kpi' | 'figure';
  /** Nome do grupo para leitor de tela (“Indicadores do período”). */
  label?: string;
}) {
  const count = Math.min(6, columns ?? items?.length ?? 4);
  return (
    <div className={s.root}>
      <section className={s.strip} data-size={size} data-cols={count} aria-label={label}>
        {items?.map((item) => <Metric key={item.label} {...item} />)}
        {children}
      </section>
    </div>
  );
}
