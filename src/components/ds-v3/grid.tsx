'use client';

/*
 * Grade (Contrato V3 · estrutura · §12): blocos lado a lado em proporção (2:1, 3:2, 1:1, 1:1:1) ou
 * cartões automáticos com largura mínima. O vão vem da escala (8 cartões · 16 blocos) e as colunas
 * empilham pela largura do próprio bloco (container query), não da janela — funciona dentro de
 * molduras e painéis. Sem caixa, sem fio: quem desenha a superfície é o filho.
 */

import {
  Children,
  createContext,
  isValidElement,
  useContext,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import s from './grid.module.css';

/** Proporção das colunas; `auto` repete colunas de `min` px até onde couber. */
export type GridColumns = '1:1' | '2:1' | '1:2' | '3:2' | '1:1:1' | 'auto';
/** `sm` 8 px (cartões, §12) · `md` 16 px (blocos e painéis). */
export type GridGap = 'sm' | 'md';
/** Larguras do próprio bloco em que a grade vira uma coluna (≤). Breakpoints do contrato §12. */
export type GridCollapse = 480 | 640 | 760 | 960 | 1024 | 1280;
export type GridElement = 'div' | 'ul' | 'ol' | 'section';

export type GridProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  columns: GridColumns;
  /** Só `auto`: largura mínima de cada coluna, em px. Padrão 196 (cartões do contrato). */
  min?: number;
  /** Padrão: `sm` em `auto` (cartões) e `md` nas proporções (blocos). */
  gap?: GridGap;
  /**
   * Proporções: empilha quando o bloco tem esta largura ou menos. Padrão 760. `false` nunca
   * empilha. Ignorado em `auto`, que já se ajusta pela largura mínima.
   */
  collapseBelow?: GridCollapse | false;
  /** `ul`/`ol`: cada filho vira um item da lista (`GridItem` sozinho, se não for um). */
  as?: GridElement;
  /** Nome acessível (lista ou seção). */
  label?: string;
  /** `stretch`: filhos da mesma linha com a mesma altura (painéis) · `start`: altura natural. */
  align?: 'stretch' | 'start';
  children?: ReactNode;
};

/* A grade avisa os itens se é lista (li) ou não (div). */
const ListContext = createContext(false);

export type GridItemProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  /**
   * `full` ocupa a linha inteira; `2` ocupa duas colunas (só nas proporções de 3 colunas ou na
   * linha de 2). Empilhada, a grade devolve cada item a uma coluna.
   */
  span?: 2 | 'full';
  children?: ReactNode;
};

/** Item da grade: `li` dentro de `Grid as="ul|ol"`, `div` nos demais. Use para `span`. */
export function GridItem({ span, className = '', children, ...props }: GridItemProps) {
  const list = useContext(ListContext);
  const Tag = list ? 'li' : 'div';
  return (
    <Tag {...props} className={`${s.item} ${className}`} data-span={span}>
      {children}
    </Tag>
  );
}

/**
 * Colunas para compor páginas sem CSS de produto. Proporções empilham em uma coluna abaixo de
 * `collapseBelow`; `auto` cabe quantas colunas de `min` px couberem (`repeat(auto-fill, …)`).
 * Em lista (`as="ul"`), cada filho vira `li` sem que o produto escreva a tag.
 */
export function Grid({
  columns,
  min = 196,
  gap,
  collapseBelow = 760,
  as: Tag = 'div',
  label,
  align = 'stretch',
  className = '',
  style,
  children,
  ...props
}: GridProps) {
  const list = Tag === 'ul' || Tag === 'ol';
  const items = list
    ? Children.map(children, (child) => {
        if (child === null || child === undefined || typeof child === 'boolean') return null;
        if (isValidElement(child) && child.type === GridItem) return child;
        return <GridItem>{child}</GridItem>;
      })
    : children;
  const auto = columns === 'auto';
  return (
    <div className={`${s.root} ${className}`} style={style} data-part="grid">
      <Tag
        {...props}
        className={s.grid}
        aria-label={label ?? props['aria-label']}
        data-columns={columns}
        data-gap={gap ?? (auto ? 'sm' : 'md')}
        data-align={align}
        data-collapse={auto || collapseBelow === false ? undefined : collapseBelow}
        style={auto ? ({ '--grid-min': `${min}px` } as CSSProperties) : undefined}
      >
        <ListContext.Provider value={list}>{items}</ListContext.Provider>
      </Tag>
    </div>
  );
}
