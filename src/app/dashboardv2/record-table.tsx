'use client';

import { DataTable } from '../../components/ds-v2/data-table';
import { Status, displayValue, formatCurrency } from './workspace-ui';
import { screens, type DemoRecord, type ScreenKey } from './workspace-data';
import {
  recordTableDefinition,
  stockUnit,
  type RecordColumn,
  type RecordSort,
} from './record-table-model';
import a from './application.module.css';
import t from './record-table.module.css';

export function RecordTable({
  screen,
  records,
  sort,
  onSort,
  onOpen,
}: {
  screen: ScreenKey;
  records: DemoRecord[];
  sort: RecordSort;
  onSort: (sort: RecordSort) => void;
  onOpen: (record: DemoRecord) => void;
}) {
  const config = screens[screen];
  const definition = recordTableDefinition(screen);
  const value = (record: DemoRecord, key: string) =>
    displayValue(
      record[key],
      config.fields.find((field) => field.key === key) ?? { key, label: key },
    );
  if (definition.inbox)
    return (
      <ul className={t.inbox} aria-label="Lista de notificações">
        {records.map((record) => (
          <li key={record.id} data-unread={record.status === 'Não lida'}>
            <span className={t.unreadDot} aria-hidden="true" />
            <div className={t.notificationCopy}>
              <button className={a.recordLink} onClick={() => onOpen(record)}>
                {record.name}
              </button>
              <p>{record.description}</p>
            </div>
            <div className={t.notificationMeta}>
              <time dateTime={String(record.date)}>{value(record, 'date')}</time>
              <Status value={record.status} />
            </div>
          </li>
        ))}
      </ul>
    );
  const numeric = (column: RecordColumn) =>
    ['number', 'money', 'price', 'stock', 'metric'].includes(column.kind ?? '');
  const cell = (record: DemoRecord, column: RecordColumn) => {
    const raw = record[column.key];
    if (column.key === 'name')
      return (
        <>
          <button className={a.recordLink} title={record.name} onClick={() => onOpen(record)}>
            {record.name}
          </button>
          {column.secondary?.some((key) => record[key]) && (
            <span className={t.secondary}>
              {column.secondary
                .map((key) => record[key])
                .filter(Boolean)
                .join(' · ')}
            </span>
          )}
        </>
      );
    if (column.kind === 'status') return <Status value={String(raw ?? '—')} />;
    if (raw === undefined || raw === '') return '—';
    if (column.kind === 'price')
      return (
        <>
          <span>{formatCurrency(Number(raw))}</span>
          <span className={t.secondary}>{record.unit || 'Unidade não informada'}</span>
        </>
      );
    if (column.kind === 'money') return formatCurrency(Number(raw));
    if (column.kind === 'stock') {
      const remaining = Number(raw);
      const capacity = Number(record.capacity);
      return (
        <>
          <span>{remaining.toLocaleString('pt-BR')}</span>
          <span className={t.secondary}>
            {capacity > 0 ? `de ${capacity.toLocaleString('pt-BR')} ` : ''}
            {stockUnit(record)}
          </span>
          {capacity > 0 && (
            <span className={t.bar} aria-hidden="true">
              <i
                style={{ width: `${Math.max(0, Math.min(100, (remaining / capacity) * 100))}%` }}
              />
            </span>
          )}
        </>
      );
    }
    if (column.kind === 'metric') {
      const max = Math.max(
        ...records
          .filter((row) => row.metric === record.metric)
          .map((row) => Number(row[column.key]) || 0),
      );
      return (
        <>
          <span>{Number(raw).toLocaleString('pt-BR')}</span>
          {max > 0 && (
            <span className={t.bar} aria-hidden="true">
              <i style={{ width: `${Math.max(0, (Number(raw) / max) * 100)}%` }} />
            </span>
          )}
        </>
      );
    }
    if (column.kind === 'date')
      return <time dateTime={String(raw)}>{value(record, column.key)}</time>;
    return value(record, column.key);
  };
  return (
    <DataTable
      label={config.title}
      rows={records}
      rowKey={(record) => record.id}
      density={definition.density}
      sort={sort}
      onSort={onSort}
      columns={definition.columns.map((column) => ({
        ...column,
        numeric: numeric(column),
        title: (record: DemoRecord) => value(record, column.key),
        render: (record: DemoRecord) => cell(record, column),
      }))}
    />
  );
}
