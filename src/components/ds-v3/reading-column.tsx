/*
 * Coluna de leitura (Contrato V3 · estrutura · §12): a medida do texto corrido (`--prose-measure`,
 * 68ch na fonte de leitura), centrada na área (padrão) ou encostada no início, com o ritmo de página
 * (24) entre os blocos. O que acompanha um texto — avisos, a decisão, a diferença entre versões, a
 * grade de imagens, o próprio `Prose` — fica na mesma coluna e na mesma borda do texto. A medida é
 * calculada na fonte de leitura (a mesma do `Prose` md e do `DiffView` em leitura); o conteúdo volta
 * à fonte da interface. Sem superfície, sem fio: só posiciona.
 */

import type { ComponentProps, ReactNode } from 'react';
import s from './reading-column.module.css';

export type ReadingColumnAlign = 'center' | 'start';

export type ReadingColumnProps = Omit<ComponentProps<'div'>, 'children'> & {
  children?: ReactNode;
  /** Centrada na área (padrão) ou encostada no início, como o `Prose`. */
  align?: ReadingColumnAlign;
  /** `section`/`article` quando a coluna é uma região própria da página. */
  as?: 'div' | 'section' | 'article';
  /** Nome da região para leitor de tela (`div` com nome vira `region`). */
  label?: string;
};

export function ReadingColumn({
  align = 'center',
  as: Tag = 'div',
  label,
  className = '',
  children,
  ...props
}: ReadingColumnProps) {
  return (
    <Tag
      {...props}
      className={`${s.column} ${className}`}
      data-part="reading-column"
      data-align={align}
      role={Tag === 'div' && label ? 'region' : props.role}
      aria-label={label ?? props['aria-label']}
    >
      <div className={s.stack}>{children}</div>
    </Tag>
  );
}
