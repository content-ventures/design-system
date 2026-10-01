'use client';

import { ArrowDown, ArrowUp } from 'lucide-react';
import type { ReactNode } from 'react';
import t from './data-table.module.css';

export type TableSort = { key: string; direction: 'asc' | 'desc' };
export type TableColumn<Row> = {
  key: string;
  label: string;
  header?: ReactNode;
  width: number;
  numeric?: boolean;
  kind?: string;
  sortable?: boolean;
  render: (row: Row) => ReactNode;
  title?: (row: Row) => string;
};

/** Ordenação, filtros e regras de domínio pertencem ao consumidor. */
export function DataTable<Row>({
  label,
  rows,
  columns,
  rowKey,
  density = 'comfortable',
  sort,
  onSort,
  empty = 'Nenhum registro encontrado.',
}: {
  label: string;
  rows: Row[];
  columns: TableColumn<Row>[];
  rowKey: (row: Row) => string;
  density?: 'compact' | 'comfortable';
  sort?: TableSort;
  onSort?: (sort: TableSort) => void;
  empty?: ReactNode;
}) {
  return (
    <div
      className={t.tableScroll}
      role="region"
      tabIndex={0}
      aria-label={`Lista de ${label.toLowerCase()}`}
    >
      <table
        className={t.table}
        data-density={density}
        style={{ minWidth: columns.reduce((sum, column) => sum + column.width, 0) }}
      >
        <caption className={t.srOnly}>{label}</caption>
        <colgroup>
          {columns.map((column) => (
            <col key={column.key} style={{ width: column.width }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                data-numeric={column.numeric}
                aria-sort={
                  onSort && column.sortable !== false
                    ? sort?.key === column.key
                      ? sort.direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                    : undefined
                }
              >
                {onSort && column.sortable !== false ? (
                  <button
                    type="button"
                    className={t.sort}
                    aria-label={`Ordenar por ${column.label.toLowerCase()}`}
                    onClick={() =>
                      onSort({
                        key: column.key,
                        direction:
                          sort?.key === column.key && sort.direction === 'asc' ? 'desc' : 'asc',
                      })
                    }
                  >
                    {column.label}
                    {sort?.key === column.key &&
                      (sort.direction === 'asc' ? (
                        <ArrowUp size={12} aria-hidden="true" />
                      ) : (
                        <ArrowDown size={12} aria-hidden="true" />
                      ))}
                  </button>
                ) : (
                  (column.header ?? column.label)
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    data-numeric={column.numeric}
                    data-kind={column.kind}
                    title={column.title?.(row)}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length}>
                <div className={t.empty}>{empty}</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
