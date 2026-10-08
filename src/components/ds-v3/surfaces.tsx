import type { LucideIcon } from 'lucide-react';
import { isValidElement } from 'react';
import type { ComponentProps, CSSProperties, MouseEvent, ReactNode } from 'react';
import type { Tone } from './badge';
import { TruncatedText } from './overlays';
import s from './surfaces.module.css';

/* ——————————————————————————— Card ——————————————————————————— */

/**
 * Superfície do produto: papel, fio de 1px, `--r-lg`, sem sombra em repouso.
 * `interactive` = cartão-link (use `CardLink` dentro: o cartão inteiro vira alvo); `selected` =
 * escolhido; `disabled` = indisponível; `loading` = esqueleto por dentro (`aria-busy`).
 * `elevation` fica por compatibilidade: `raised` é chapado; `lifted` é só o cartão em arrasto.
 */
export function Card({
  padding = 'md',
  elevation = 'raised',
  interactive = false,
  selected = false,
  disabled = false,
  loading = false,
  as: Tag = 'section',
  className = '',
  ...props
}: ComponentProps<'section'> & {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  elevation?: 'flat' | 'raised' | 'lifted';
  interactive?: boolean;
  selected?: boolean;
  disabled?: boolean;
  loading?: boolean;
  as?: 'section' | 'article' | 'div' | 'li';
}) {
  const Element = Tag as 'div';
  return (
    <Element
      aria-busy={loading || undefined}
      {...(props as ComponentProps<'div'>)}
      className={`${s.card} ${className}`}
      data-pad={padding}
      data-elevation={elevation}
      data-interactive={(interactive && !disabled && !loading) || undefined}
      data-selected={selected || undefined}
      data-disabled={disabled || undefined}
      data-loading={loading || undefined}
    />
  );
}

/**
 * Alvo de um cartão-link. Cobre o cartão inteiro (o anel de foco é desenhado no cartão).
 * Com `href` vira `<a>`; sem, `<button>`. `disabled` mantém o texto e tira a ação.
 */
export function CardLink({
  href,
  onClick,
  disabled = false,
  children,
  className = '',
  ...rest
}: {
  href?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-current'?: 'page' | 'true';
}) {
  if (href && !disabled) {
    return (
      <a
        {...rest}
        href={href}
        onClick={onClick}
        className={`${s.cardLink} ${className}`}
        data-card-link=""
      >
        {children}
      </a>
    );
  }
  return (
    <button
      {...rest}
      type="button"
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled || undefined}
      className={`${s.cardLink} ${className}`}
      data-card-link=""
    >
      {children}
    </button>
  );
}

/**
 * Cabeçalho de cartão: título 13/600 (`size="md"` = 14/600, nível de seção), meta curta ao lado,
 * ação à direita (um `LinkButton`, um menu). Sem ícone em caixa.
 */
export function CardHeader({
  title,
  description,
  leading,
  actions,
  meta,
  divided = false,
  titleAs: Title = 'h3',
  badge,
  size = 'sm',
}: {
  title: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  actions?: ReactNode;
  /** Informação curta ao lado do título (“214”, “2 de 3”). */
  meta?: ReactNode;
  divided?: boolean;
  titleAs?: 'h2' | 'h3' | 'h4';
  badge?: ReactNode;
  size?: 'sm' | 'md';
}) {
  return (
    <header
      className={s.header}
      data-divided={divided || undefined}
      data-size={size}
      data-stacked={description ? true : undefined}
    >
      {leading}
      <div className={s.headerText}>
        <div className={s.titleRow}>
          <Title className={s.title}>
            {title}
            {badge}
          </Title>
          {meta !== undefined && <span className={s.headerMeta}>{meta}</span>}
        </div>
        {description && <p className={s.description}>{description}</p>}
      </div>
      {actions && <div className={s.actions}>{actions}</div>}
    </header>
  );
}

/** Bandeja rebaixada que agrupa cartões de papel (catálogo, quadros). */
export function Tray({
  title,
  meta,
  actions,
  children,
  className = '',
}: {
  title?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${s.tray} ${className}`}>
      {(title || meta || actions) && (
        <div className={s.trayHead}>
          {title && <span className={s.trayTitle}>{title}</span>}
          {meta && <span className={s.trayMeta}>{meta}</span>}
          {actions && <span className={s.trayActions}>{actions}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

/** Cartão com nota tingida anexada embaixo (pendência, verificação, aviso do item). */
export function AttachedNote({
  tone,
  icon: Icon,
  note,
  children,
}: {
  tone: Extract<Tone, 'orange' | 'blue' | 'red' | 'green' | 'amber'>;
  icon?: LucideIcon;
  note: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={s.attached} data-tone={tone}>
      {children}
      <p className={s.attachedNote}>
        {Icon && <Icon aria-hidden="true" />}
        {note}
      </p>
    </div>
  );
}

/** Lista de propriedades com ícone opcional (compatibilidade). Para fichas novas, `DescriptionList`. */
export function PropertyList({
  items,
}: {
  items: { label: string; icon?: LucideIcon; value: ReactNode }[];
}) {
  return (
    <dl className={s.props}>
      {items.map(({ label, icon: Icon, value }) => (
        <div key={label} className={s.prop}>
          <dt>
            {Icon && <Icon aria-hidden="true" />}
            {label}
          </dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ——————————————————————————— Divisórias ——————————————————————————— */

/**
 * Fio de 1px. `line` separa seções; `soft` separa linhas dentro de um painel.
 * `vertical` divide grupos de controles numa barra (20px de altura por padrão).
 * `label` centraliza uma legenda curta entre dois fios (“ou”).
 */
export function Divider({
  spacing = 'none',
  orientation = 'horizontal',
  inset,
  tone = 'line',
  label,
  length,
  className = '',
}: {
  spacing?: 'none' | 'sm' | 'md';
  orientation?: 'horizontal' | 'vertical';
  /** Recuo inicial em px (alinha o fio ao texto de uma lista com marca ou ícone). */
  inset?: number;
  tone?: 'line' | 'soft';
  label?: ReactNode;
  /** Altura do fio vertical, em px. */
  length?: number;
  className?: string;
}) {
  const style = {
    ...(inset !== undefined ? { '--divider-inset': `${inset}px` } : null),
    ...(length !== undefined ? { '--divider-length': `${length}px` } : null),
  } as CSSProperties;
  if (label !== undefined && orientation === 'horizontal') {
    return (
      <div
        role="separator"
        aria-orientation="horizontal"
        className={`${s.labeled} ${className}`}
        data-tone={tone}
        data-spacing={spacing}
        style={style}
      >
        <span>{label}</span>
      </div>
    );
  }
  if (orientation === 'vertical') {
    return (
      <span
        role="separator"
        aria-orientation="vertical"
        className={`${s.vertical} ${className}`}
        data-tone={tone}
        data-spacing={spacing}
        style={style}
      />
    );
  }
  return (
    <hr
      className={`${s.divider} ${className}`}
      data-tone={tone}
      data-spacing={spacing}
      style={style}
    />
  );
}

/**
 * Item de `MetaList` com opções. `numeric` liga os números tabulares só nesse fato (dinheiro,
 * datas, contagens, “#2041”): em texto comum o hífen tabular da Inter abre buracos
 * (“Primavera - Verão”).
 */
export type MetaItem = { value: ReactNode; numeric?: boolean };

const isBlankNode = (node: ReactNode) =>
  node === null || node === undefined || node === false || node === '';

function isMetaItem(item: ReactNode | MetaItem): item is MetaItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    !Array.isArray(item) &&
    !isValidElement(item) &&
    'value' in item
  );
}

/**
 * Linha de fatos separados por “·” que quebra sem separador pendurado: cada item desenha o seu
 * separador à esquerda e a linha recua a largura dele, então o “·” de começo de linha fica fora
 * do recorte. `wrap={false}` fica numa linha só (célula de tabela): o primeiro fato cede espaço
 * com reticências e os demais ficam inteiros. Item `{ value, numeric: true }` usa números
 * tabulares; texto comum fica proporcional.
 */
export function MetaList({
  items,
  separator = '·',
  size = 'md',
  wrap = true,
  className = '',
  label,
}: {
  items: (ReactNode | MetaItem)[];
  separator?: string;
  /** `md` 13px (cabeçalho de página); `sm` 12px; `xs` 11.5px (linha de apoio). */
  size?: 'xs' | 'sm' | 'md';
  /** `false`: uma linha só; o primeiro fato corta com reticências. */
  wrap?: boolean;
  className?: string;
  /** Nome acessível do grupo, quando os itens sozinhos não se explicam. */
  label?: string;
}) {
  const visible = items
    .map((item) => (isMetaItem(item) ? item : { value: item, numeric: false }))
    .filter((item) => !isBlankNode(item.value));
  return (
    <div
      className={`${s.meta} ${className}`}
      data-size={size}
      data-wrap={wrap ? undefined : 'false'}
      role={label ? 'group' : undefined}
      aria-label={label}
      style={{ '--meta-sep': JSON.stringify(separator) } as CSSProperties}
    >
      <span className={s.metaTrack}>
        {visible.map((item, index) =>
          // Numa linha só, o primeiro item é o que cede: o texto inteiro vai na dica do DS quando corta.
          !wrap && index === 0 && typeof item.value === 'string' ? (
            <TruncatedText
              key={index}
              className={s.metaItem}
              data-num={item.numeric ? '' : undefined}
              text={item.value}
            />
          ) : (
            <span key={index} className={s.metaItem} data-num={item.numeric ? '' : undefined}>
              {item.value}
            </span>
          ),
        )}
      </span>
    </div>
  );
}

export function Overline({
  children,
  as: Tag = 'p',
}: {
  children: ReactNode;
  as?: 'p' | 'h3' | 'h4' | 'span';
}) {
  return <Tag className={s.overline}>{children}</Tag>;
}
