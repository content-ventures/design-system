import type { ReactNode } from 'react';

import { VisuallyHidden } from './a11y';
import { Skeleton } from './feedback';
import s from './route-skeleton.module.css';

/**
 * Esqueletos de rota, para os `loading.tsx`: a página aparece com a geometria final enquanto o
 * servidor responde. Só recebem contagens estruturais — nunca dados —, então o HTML do
 * carregamento não vaza nome de portal, contagem ou linha. A raiz de cada um anuncia a pendência
 * (`role="status"`, `aria-busy` e “Carregando” para leitor de tela) e leva `data-route-skeleton`,
 * que os testes de rota e o E2E usam para achá-la. Sem estado: rodam no servidor.
 */

function Root({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div
      data-route-skeleton=""
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={`${s.root} ${className}`}
    >
      <VisuallyHidden>Carregando</VisuallyHidden>
      {children}
    </div>
  );
}

function range(count: number): number[] {
  return Array.from({ length: Math.max(0, Math.floor(count)) }, (_, index) => index);
}

/** Barras das células de valor, alternadas para a tabela não parecer uma grade chapada. */
const CELL_BARS = ['48%', '56%', '40%', '52%'];

/**
 * A página inteira: título e linha de apoio, a barra de busca e filtro com a ação principal à
 * direita (`actions`) e o corpo — outros esqueletos de rota, sem dados.
 */
export function PageSkeleton({
  actions = true,
  className,
  children,
}: {
  /** Mostra a barra de busca, filtro e ação principal sob o título. */
  actions?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Root className={`${s.page} ${className ?? ''}`}>
      <div className={s.head}>
        <Skeleton width={240} height={28} radius="var(--r-sm)" />
        <Skeleton width={360} height={12} />
      </div>
      {actions ? (
        <div className={s.toolbar}>
          <Skeleton width={280} height="var(--h-md)" radius="var(--r-md)" />
          <Skeleton width={120} height="var(--h-md)" radius="var(--r-md)" />
          <Skeleton width={144} height="var(--h-md)" radius="var(--r-md)" className={s.primary} />
        </div>
      ) : null}
      {children}
    </Root>
  );
}

/** Tabela: moldura da `Table`, cabeçalho de 38 px no cinza e linhas de 60 px com fio. */
export function TableSkeleton({
  rows = 8,
  columns = 5,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  const cols = range(columns);
  const template = cols.map((col) => (col === 0 ? 'minmax(0, 2fr)' : 'minmax(0, 1fr)')).join(' ');
  return (
    <Root className={className}>
      <div className={s.table}>
        <div className={s.tableHead} style={{ gridTemplateColumns: template }}>
          {cols.map((col) => (
            <Skeleton key={col} width={col === 0 ? 88 : 56} height={9} />
          ))}
        </div>
        {range(rows).map((row) => (
          <div key={row} className={s.tableRow} style={{ gridTemplateColumns: template }}>
            {cols.map((col) =>
              col === 0 ? (
                <span key={col} className={s.cellStack}>
                  <Skeleton width="64%" height={11} delay={row * 80} />
                  <Skeleton width="36%" height={9} delay={row * 80} />
                </span>
              ) : (
                <Skeleton
                  key={col}
                  width={CELL_BARS[(col - 1) % CELL_BARS.length]}
                  height={11}
                  delay={row * 80}
                />
              ),
            )}
          </div>
        ))}
      </div>
    </Root>
  );
}

/** Cartões de indicador: rótulo, número e linha de apoio, numa grade que se ajusta à largura. */
export function CardsSkeleton({ cards = 4, className }: { cards?: number; className?: string }) {
  return (
    <Root className={className}>
      <div className={s.cards}>
        {range(cards).map((card) => (
          <div key={card} className={s.card}>
            <Skeleton width="44%" height={10} delay={card * 80} />
            <Skeleton width="58%" height={24} radius="var(--r-sm)" delay={card * 80} />
            <Skeleton width="72%" height={9} delay={card * 80} />
          </div>
        ))}
      </div>
    </Root>
  );
}

/** Gráfico: título do painel e a área do gráfico na altura final (`height`, em px). */
export function ChartSkeleton({
  height = 240,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return (
    <Root className={className}>
      <div className={s.card}>
        <Skeleton width="32%" height={12} />
        <Skeleton shape="block" width="100%" height={height} radius="var(--r-md)" />
      </div>
    </Root>
  );
}

/** Formulário: rótulo e campo por linha, com as ações no pé, à direita. */
export function FormSkeleton({ fields = 5, className }: { fields?: number; className?: string }) {
  return (
    <Root className={className}>
      <div className={s.form}>
        {range(fields).map((field) => (
          <div key={field} className={s.field}>
            <Skeleton width={128} height={10} delay={field * 80} />
            <Skeleton width="100%" height="var(--h-md)" radius="var(--r-md)" delay={field * 80} />
          </div>
        ))}
        <div className={s.formFoot}>
          <Skeleton width={96} height="var(--h-md)" radius="var(--r-md)" />
          <Skeleton width={128} height="var(--h-md)" radius="var(--r-md)" />
        </div>
      </div>
    </Root>
  );
}
