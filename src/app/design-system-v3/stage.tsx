import type { CSSProperties, ReactNode } from 'react';
import s from './stage.module.css';

/*
 * Helpers de prancha do catálogo V3. Só layout: cor, raio e tipo vêm dos tokens.
 * Regra da casa: nenhum texto além de legendas de 1–3 palavras.
 *
 *   <Stage>               superfície com fio de 1px e raio 10. `tone="tray"` usa a bandeja --g-50.
 *                         <Stage tone="tray" pad="lg" align="center">…</Stage>
 *   <States>              grade de células legendadas (Repouso, Hover, Foco…). Aceita `items` ou <State>.
 *                         <States items={[{ label: 'Repouso', children: <Button /> }]} />
 *                         <States columns={4}><State label="Hover"><Button data-force="hover" /></State></States>
 *                         Células alinham pelo topo e a legenda fica 10 px sob o próprio componente.
 *                         `captions="end"` alinha as legendas pelo pé da linha (alturas mistas, leitura horizontal).
 *   <State>               uma célula de <States>: componente em cima, legenda 11.5 --muted embaixo.
 *   <Row> / <Col>         pilha horizontal (quebra linha) / vertical, gap na escala de 4.
 *   <Phone>               a ÚNICA moldura de celular do catálogo: 390 (ou 100%), fio --line, --r-xl, papel.
 *                         <Phone height={720} label="Celular, 390">…</Phone>
 *
 *   Legado, mantido para as pranchas existentes:
 *   <Shots> + <Shot title>  prancha com título curto (h2) sobre palco chapado (--g-50, --r-xl;
 *                           tone="white" = papel, altura pelo conteúdo).
 *                           `description` é aceito e ignorado: sem parágrafo explicativo no catálogo.
 *   <SpecRows rows>         tabela rótulo → amostras.  <Note> legenda curta.  `stage` = classes do módulo.
 */

type Pad = 'none' | 'sm' | 'md' | 'lg';
type Align = 'stretch' | 'center' | 'start';

/** Superfície da prancha. Papel branco por padrão; `tray` = bandeja fria. pad: 0 · 16 · 24 · 40. */
export function Stage({
  children,
  tone = 'paper',
  pad = 'md',
  align = 'stretch',
  minHeight,
  className = '',
  style,
}: {
  children: ReactNode;
  tone?: 'paper' | 'tray';
  pad?: Pad;
  /** stretch: filhos ocupam a largura · center: centraliza · start: encosta no início. */
  align?: Align;
  minHeight?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`${s.surface} ${className}`}
      data-tone={tone}
      data-pad={pad}
      data-align={align}
      style={minHeight ? { minHeight, ...style } : style}
    >
      {children}
    </div>
  );
}

/** Célula legendada: o componente vivo e uma legenda de 1–3 palavras embaixo. */
export function State({
  label,
  children,
  span,
}: {
  label: string;
  children?: ReactNode;
  /** Ocupa mais de uma coluna da grade. */
  span?: number;
}) {
  return (
    <figure className={s.state} style={span ? { gridColumn: `span ${span}` } : undefined}>
      <div className={s.stateBody}>{children}</div>
      <figcaption className={s.stateLabel}>{label}</figcaption>
    </figure>
  );
}

/**
 * Grade de estados. Sem `columns`, as células se distribuem por largura mínima (`min`, padrão 120).
 * `align="center"` centraliza componente e legenda (botões, marcas); o padrão encosta no início (campos).
 */
export function States({
  items,
  children,
  columns,
  min = 120,
  align = 'start',
  captions = 'under',
}: {
  items?: { label: string; children?: ReactNode; node?: ReactNode; span?: number }[];
  children?: ReactNode;
  columns?: number;
  min?: number;
  align?: 'start' | 'center';
  /** under: legenda 10 px sob o componente (padrão) · end: legendas alinhadas pelo pé da linha. */
  captions?: 'under' | 'end';
}) {
  const template = columns
    ? `repeat(${columns}, minmax(0, 1fr))`
    : `repeat(auto-fill, minmax(min(${min}px, 100%), 1fr))`;
  return (
    <div
      className={s.states}
      data-align={align}
      data-captions={captions === 'end' ? 'end' : undefined}
      data-fixed={columns && columns > 2 ? '' : undefined}
      style={{ gridTemplateColumns: template }}
    >
      {items?.map((item) => (
        <State key={item.label} label={item.label} span={item.span}>
          {item.children ?? item.node}
        </State>
      ))}
      {children}
    </div>
  );
}

export function Row({
  children,
  gap,
  align = 'center',
  justify,
  wrap = true,
}: {
  children: ReactNode;
  gap?: number;
  align?: CSSProperties['alignItems'];
  justify?: CSSProperties['justifyContent'];
  wrap?: boolean;
}) {
  return (
    <div
      className={s.row}
      style={{ gap, alignItems: align, justifyContent: justify, flexWrap: wrap ? 'wrap' : 'nowrap' }}
    >
      {children}
    </div>
  );
}

export function Col({
  children,
  gap,
  align,
}: {
  children: ReactNode;
  gap?: number;
  align?: CSSProperties['justifyItems'];
}) {
  return (
    <div className={s.col} style={{ gap, justifyItems: align }}>
      {children}
    </div>
  );
}

/** Moldura de celular (390). Uma só para todas as famílias; flutuantes dentro dela usam `contained`. */
export function Phone({
  children,
  height,
  className = '',
  label,
}: {
  children: ReactNode;
  height?: number | string;
  className?: string;
  /** Nome do grupo para leitor de tela (ex.: “Celular, 390”). */
  label?: string;
}) {
  return (
    <div
      className={`${s.phone} ${className}`}
      style={height !== undefined ? { height } : undefined}
      role={label ? 'group' : undefined}
      aria-label={label}
    >
      {children}
    </div>
  );
}

/* ——— Legado ——— */

export function Shots({ children }: { children: ReactNode }) {
  return <div className={s.shots}>{children}</div>;
}

export function Shot({
  title,
  aside,
  children,
  align = 'center',
  pad = 'md',
  tone = 'canvas',
  minHeight,
}: {
  title: string;
  /** Ignorado de propósito: o catálogo não tem parágrafo explicativo. */
  description?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  align?: 'center' | 'start' | 'stretch';
  pad?: Pad;
  tone?: 'canvas' | 'white' | 'blue';
  minHeight?: number;
}) {
  return (
    <figure className={s.shot}>
      <figcaption className={s.shotHead}>
        <h2 className={s.shotTitle}>{title}</h2>
        {aside && <div className={s.shotAside}>{aside}</div>}
      </figcaption>
      <div
        className={s.stage}
        data-align={align}
        data-pad={pad}
        data-tone={tone === 'white' ? 'paper' : 'tray'}
        style={minHeight ? { minHeight } : undefined}
      >
        {children}
      </div>
    </figure>
  );
}

export function SpecRows({ rows }: { rows: { label: string; hint?: string; content: ReactNode }[] }) {
  return (
    <div className={s.specRows}>
      {rows.map((row) => (
        <div key={row.label} className={s.specRow}>
          <div className={s.specLabel}>
            <strong>{row.label}</strong>
            {row.hint && <span>{row.hint}</span>}
          </div>
          <div className={s.row}>{row.content}</div>
        </div>
      ))}
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <span className={s.note}>{children}</span>;
}

export const stage = s;
