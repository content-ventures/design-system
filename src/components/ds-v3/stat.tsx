import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Tone } from './badge';
import { IconTile } from './identity';
import s from './stat.module.css';

/**
 * Indicador. Cabeçalho (ícone, nome, período) em papel e o número numa bandeja rebaixada,
 * com até duas linhas de detalhamento ao lado. Indisponível mostra “—” e explica no rodapé.
 */
export function StatCard({
  icon,
  tone = 'blue',
  title,
  period,
  value,
  unit,
  breakdown,
  delta,
  aside,
  footer,
  href,
  unavailable = false,
}: {
  icon: LucideIcon;
  tone?: Tone;
  title: string;
  period?: string;
  value: ReactNode;
  unit?: string;
  breakdown?: { label: string; value: ReactNode }[];
  delta?: ReactNode;
  aside?: ReactNode;
  footer?: ReactNode;
  href?: string;
  unavailable?: boolean;
}) {
  return (
    <article className={s.stat} data-state={unavailable ? 'unavailable' : undefined}>
      <header className={s.statHead}>
        <IconTile icon={icon} tone={tone} size="lg" />
        <div className={s.statTitles}>
          <h3 className={s.statTitle}>{title}</h3>
          {period && <span className={s.statSub}>{period}</span>}
        </div>
        {href && (
          <a href={href} className={s.statLink} aria-label={`Abrir ${title}`}>
            <ArrowUpRight aria-hidden="true" />
          </a>
        )}
      </header>
      <div className={s.statBody}>
        <span className={s.value}>
          {unavailable ? '—' : value}
          {unit && !unavailable && <span className={s.unit}>{unit}</span>}
        </span>
        {breakdown && !unavailable && (
          <span className={s.breakdown}>
            {breakdown.map((line) => (
              <span key={line.label}>
                {line.label}: <b>{line.value}</b>
              </span>
            ))}
          </span>
        )}
        {delta && !unavailable && <span style={{ paddingBottom: 5 }}>{delta}</span>}
        {aside && <span className={s.statAside}>{aside}</span>}
      </div>
      {footer && <footer className={s.statFoot}>{footer}</footer>}
    </article>
  );
}

export function Delta({
  value,
  trend,
  label,
  tone,
  variant = 'soft',
}: {
  value: string;
  trend: 'up' | 'down' | 'flat';
  /** Leitura completa para leitores de tela, ex.: “12,4% acima do mês anterior”. */
  label?: string;
  /**
   * Bom ou ruim independe da direção: custo por lead subindo é ruim. Sem `tone`, subir é bom,
   * cair é ruim e estável é neutro.
   */
  tone?: 'good' | 'bad' | 'flat';
  /** `soft` (selo) ou `text` (seta + número, como na faixa de indicadores). */
  variant?: 'soft' | 'text';
}) {
  const Icon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;
  const resolved = tone ?? (trend === 'up' ? 'good' : trend === 'down' ? 'bad' : 'flat');
  return (
    <span className={s.delta} data-trend={trend} data-tone={resolved} data-variant={variant} aria-label={label}>
      <Icon aria-hidden="true" />
      {value}
    </span>
  );
}

/**
 * Tom do medidor. `neutral` (cinza, padrão) é o de prontidão, progresso e participação: azul é ação,
 * nunca status. Âmbar e vermelho só quando o número pede atenção; verde, concluído.
 */
export type MeterTone = 'neutral' | Extract<Tone, 'blue' | 'green' | 'amber' | 'red'>;

export function Meter({
  value,
  max = 100,
  label,
  tone = 'neutral',
  size = 'md',
  start,
  end,
  inline = false,
}: {
  value: number;
  max?: number;
  label: string;
  /** Padrão `neutral`. */
  tone?: MeterTone;
  size?: 'sm' | 'md' | 'lg';
  start?: ReactNode;
  end?: ReactNode;
  /** Barra com o percentual à direita, para células de tabela. */
  inline?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const bar = (
    <span
      className={s.meterTrack}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <i className={s.meterFill} style={{ width: `${pct}%` }} />
    </span>
  );
  if (inline) {
    return (
      <span className={`${s.meter} ${s.inline}`} data-tone={tone} data-size="sm">
        {bar}
        <span>{Math.round(pct)}%</span>
      </span>
    );
  }
  return (
    <span className={s.meter} data-tone={tone} data-size={size}>
      {bar}
      {(start || end) && (
        <span className={s.meterLabels}>
          <span>{start}</span>
          <span>{end}</span>
        </span>
      )}
    </span>
  );
}

/**
 * Linha de tendência compacta: traço de 1,5 px chapado e ponto no último valor. Decorativa.
 * `fluid` estica na largura do contêiner (CSS decide a largura) sem engrossar o traço nem achatar o
 * ponto; `width` vira só a proporção de desenho.
 */
export function Sparkline({
  points,
  width = 96,
  height = 36,
  tone = 'blue',
  fluid = false,
}: {
  points: number[];
  width?: number;
  height?: number;
  tone?: Extract<Tone, 'blue' | 'green' | 'red' | 'violet' | 'gray'>;
  fluid?: boolean;
}) {
  const color = {
    blue: 'var(--b-600)',
    green: 'var(--green-dot)',
    red: 'var(--red-dot)',
    violet: 'var(--violet-dot)',
    gray: 'var(--g-400)',
  }[tone];
  // Sem pontos não há linha (Math.min de nada é Infinity e o traço viraria NaN).
  if (points.length === 0) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const x = (i: number) => (i / Math.max(1, points.length - 1)) * (width - 3);
  const y = (v: number) => height - 3 - ((v - min) / (max - min || 1)) * (height - 6);
  const line = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const last = points.length - 1;
  const end = { x: x(last), y: y(points[last] ?? 0) };
  if (fluid) {
    // Escala só na horizontal: traço que não escala e o ponto como segmento nulo de ponta redonda.
    return (
      <svg
        className={s.spark}
        data-fluid=""
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={`M${end.x.toFixed(1)} ${end.y.toFixed(1)}h0`}
          stroke={color}
          strokeWidth="4.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }
  return (
    <svg className={s.spark} width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={end.x} cy={end.y} r="2.25" fill={color} />
    </svg>
  );
}
