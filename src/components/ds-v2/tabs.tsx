'use client';
import { useRef } from 'react';
import n from './navigation.module.css';

export function Tabs({
  values,
  active,
  onChange,
  label = 'Visualizações',
}: {
  values: { id: string; label: string; count?: number; panelId?: string }[];
  active: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <div className={n.tabs} role="tablist" aria-label={label}>
      {values.map((value, index) => (
        <button
          key={value.id}
          ref={(node) => {
            refs.current[index] = node;
          }}
          role="tab"
          type="button"
          aria-controls={value.panelId}
          aria-selected={value.id === active}
          tabIndex={value.id === active ? 0 : -1}
          onClick={() => onChange(value.id)}
          onKeyDown={(event) => {
            const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
            if (!step && !['Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const next =
              event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? values.length - 1
                  : (index + step + values.length) % values.length;
            onChange(values[next]!.id);
            refs.current[next]?.focus();
          }}
        >
          <span>
            {value.label}
            {value.count !== undefined && <small className={n.tabCount}>{value.count}</small>}
          </span>
        </button>
      ))}
    </div>
  );
}
