'use client';

import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { Menu } from './menu';
import s from './pagination.module.css';

/** Sete posições fixas: 1 2 3 4 5 … 12 · 1 … 4 5 6 … 12 · 1 … 8 9 10 11 12. A largura não pula. */
export function pageList(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, 'gap', total];
  if (current >= total - 3) return [1, 'gap', total - 4, total - 3, total - 2, total - 1, total];
  return [1, 'gap', current - 1, current, current + 1, 'gap', total];
}

/** Botão de página. Exportado para pranchas de estado (`force`). */
export function PageButton({
  page,
  current = false,
  onClick,
  force,
}: {
  page: number;
  current?: boolean;
  onClick?: () => void;
  force?: string;
}) {
  return (
    <button
      type="button"
      className={s.page}
      aria-current={current ? 'page' : undefined}
      aria-label={`Página ${page}`}
      data-force={force}
      onClick={onClick}
    >
      {page}
    </button>
  );
}

/** Seta anterior/próxima. Exportada para pranchas de estado (`force`). */
export function PageArrow({
  direction,
  disabled,
  onClick,
  force,
}: {
  direction: 'prev' | 'next';
  disabled?: boolean;
  onClick?: () => void;
  force?: string;
}) {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      className={s.arrow}
      aria-label={direction === 'prev' ? 'Página anterior' : 'Próxima página'}
      disabled={disabled}
      data-force={force}
      onClick={onClick}
    >
      <Icon aria-hidden="true" />
    </button>
  );
}

/**
 * Rodapé de listas: resumo “1–10 de 17 campanhas”, páginas ao centro e itens por página à direita.
 * Abaixo de 640 px de largura (ou com `variant="compact"`) vira ‹ 2 de 12 › e “Por página” sai.
 * Sem itens, não aparece.
 */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  sizes = [10, 25, 50],
  noun = 'itens',
  variant = 'auto',
  label = 'Paginação',
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  sizes?: number[];
  noun?: string;
  /** `auto` troca para o compacto em larguras de até 640 px. */
  variant?: 'auto' | 'full' | 'compact';
  label?: string;
}) {
  if (total <= 0) return null;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pages);
  const from = (current - 1) * pageSize + 1;
  const to = Math.min(total, current * pageSize);
  const format = (value: number) => value.toLocaleString('pt-BR');
  return (
    <div className={s.root} data-variant={variant}>
      <div className={s.bar}>
        <p className={s.summary} aria-live="polite">
          <span>
            <strong>
              {format(from)}–{format(to)}
            </strong>{' '}
            de {format(total)}
          </span>{' '}
          <span>{noun}</span>
        </p>
        <nav className={s.pages} aria-label={label}>
          <PageArrow direction="prev" disabled={current <= 1} onClick={() => onPageChange(current - 1)} />
          <span className={s.numbers}>
            {pageList(current, pages).map((entry, index) =>
              entry === 'gap' ? (
                <span key={`gap-${index}`} className={s.gap} aria-hidden="true">
                  …
                </span>
              ) : (
                <PageButton
                  key={entry}
                  page={entry}
                  current={entry === current}
                  onClick={() => onPageChange(entry)}
                />
              ),
            )}
          </span>
          <span className={s.compactLabel} aria-hidden="true">
            <b>{current}</b> de {pages}
          </span>
          <PageArrow direction="next" disabled={current >= pages} onClick={() => onPageChange(current + 1)} />
        </nav>
        {onPageSizeChange && (
          <div className={s.perPage}>
            <span aria-hidden="true">Por página</span>
            <Menu
              label="Itens por página"
              align="end"
              side="top"
              width={112}
              sections={[
                {
                  items: sizes.map((size) => ({
                    label: String(size),
                    checked: size === pageSize,
                    onSelect: () => onPageSizeChange(size),
                  })),
                },
              ]}
              trigger={(props) => (
                <Button
                  {...props}
                  size="sm"
                  trailingIcon={ChevronDown}
                  className={s.perPageButton}
                  aria-label={`Itens por página: ${pageSize}`}
                >
                  {pageSize}
                </Button>
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
}
