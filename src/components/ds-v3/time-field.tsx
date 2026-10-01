'use client';

import { Check, Clock } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import f from './fields.module.css';
import { Floating, selectStyles as p } from './select';
import s from './time-field.module.css';

const pad = (n: number) => String(n).padStart(2, '0');
const toMinutes = (value: string | undefined) => {
  const match = value ? /^(\d{2}):(\d{2})$/.exec(value) : null;
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  return h < 24 && m < 60 ? h * 60 + m : null;
};
const fromMinutes = (n: number) => `${pad(Math.floor(n / 60))}:${pad(n % 60)}`;

/** "930" → 09:30 · "9" → 09:00 · "21h" → 21:00 · "9:5" → 09:05. `null` quando não é horário. */
export function parseTime(text: string) {
  const raw = text.trim().toLowerCase();
  if (!raw) return null;
  let h: number;
  let m: number;
  const split = /^(\d{1,2})\s*[:h.]\s*(\d{0,2})$/.exec(raw);
  if (split) {
    h = Number(split[1]);
    m = Number(split[2] || 0);
  } else if (/^\d{1,4}$/.test(raw)) {
    if (raw.length <= 2) {
      h = Number(raw);
      m = 0;
    } else {
      h = Number(raw.slice(0, raw.length - 2));
      m = Number(raw.slice(-2));
    }
  } else {
    return null;
  }
  return h < 24 && m < 60 ? fromMinutes(h * 60 + m) : null;
}

export type TimeFieldProps = {
  id?: string;
  /** `HH:mm`; vazio = sem horário. */
  value: string;
  onChange: (value: string) => void;
  /** Intervalo da lista e das setas, em minutos. */
  step?: number;
  min?: string;
  max?: string;
  size?: 'sm' | 'md';
  invalid?: boolean;
  disabled?: boolean;
  /** Nome acessível quando não há <label for>. */
  label?: string;
  describedBy?: string;
  placeholder?: string;
  /** Mensagem do que foi digitado ("Horário inválido") ou `null` quando vale. */
  onInputError?: (message: string | null) => void;
  'data-force'?: string;
};

/**
 * Horário em 24 h. Digitar aceita "930", "9h30" ou "21:05"; ↑↓ andam um passo (15 min) com a lista
 * fechada; a lista abre no clique ou em Alt+↓ e já rola até o horário escolhido. Sem fuso e sem
 * segundos.
 */
export function TimeField({
  id,
  value,
  onChange,
  step = 15,
  min = '00:00',
  max = '23:59',
  size = 'md',
  invalid,
  disabled,
  label,
  describedBy,
  placeholder = '--:--',
  onInputError,
  'data-force': force,
}: TimeFieldProps) {
  const auto = useId();
  const inputId = id ?? `${auto}-input`;
  const listId = `${auto}-list`;
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const reveal = useRef<'center' | 'nearest' | null>(null);
  const current = toMinutes(value);
  const lo = toMinutes(min) ?? 0;
  const hi = toMinutes(max) ?? 24 * 60 - 1;
  const times = useMemo(() => {
    const list: string[] = [];
    for (let n = Math.ceil(lo / step) * step; n <= hi; n += step) list.push(fromMinutes(n));
    return list;
  }, [lo, hi, step]);
  const [text, setText] = useState(value);
  const [synced, setSynced] = useState(value);
  if (synced !== value) {
    setSynced(value);
    setText(value);
  }
  const optionId = (index: number) => `${auto}-opt-${index}`;
  const activeId = open && active >= 0 && active < times.length ? optionId(active) : undefined;

  useEffect(() => {
    if (!open || !reveal.current || !activeId) return;
    const block = reveal.current;
    reveal.current = null;
    document.getElementById(activeId)?.scrollIntoView({ block });
  }, [open, activeId]);

  /** Índice do horário escolhido, ou do primeiro depois dele. */
  function nearest(minutes: number | null) {
    if (minutes === null) {
      const nine = times.indexOf('09:00');
      return nine >= 0 ? nine : 0;
    }
    const index = times.findIndex((time) => (toMinutes(time) ?? 0) >= minutes);
    return index >= 0 ? index : times.length - 1;
  }
  function show() {
    if (disabled) return;
    reveal.current = 'center';
    setActive(nearest(current));
    setOpen(true);
  }
  function commit(next: string) {
    onInputError?.(null);
    setText(next);
    if (next !== value) onChange(next);
  }
  function commitText() {
    if (!text.trim()) {
      onInputError?.(null);
      if (value) onChange('');
      return;
    }
    const parsed = parseTime(text);
    if (!parsed) {
      onInputError?.('Horário inválido');
      return;
    }
    const n = toMinutes(parsed) ?? 0;
    if (n < lo || n > hi) {
      onInputError?.(`Entre ${min} e ${max}`);
      return;
    }
    commit(parsed);
  }
  function nudge(direction: 1 | -1) {
    const base = toMinutes(parseTime(text) ?? '') ?? current;
    const next =
      base === null
        ? (toMinutes(times[nearest(null)]) ?? lo)
        : direction > 0
          ? Math.floor(base / step) * step + step
          : Math.ceil(base / step) * step - step;
    commit(fromMinutes(Math.min(hi, Math.max(lo, next))));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const { key } = event;
    if (!open) {
      if (key === 'ArrowDown' && event.altKey) {
        event.preventDefault();
        show();
      } else if (key === 'ArrowUp' || key === 'ArrowDown') {
        event.preventDefault();
        nudge(key === 'ArrowUp' ? 1 : -1);
      } else if (key === 'Enter') {
        commitText();
      }
      return;
    }
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      reveal.current = 'nearest';
      setActive((index) =>
        Math.max(0, Math.min(times.length - 1, index + (key === 'ArrowDown' ? 1 : -1))),
      );
    } else if (key === 'PageDown' || key === 'PageUp') {
      event.preventDefault();
      reveal.current = 'nearest';
      setActive((index) =>
        Math.max(0, Math.min(times.length - 1, index + (key === 'PageDown' ? 4 : -4))),
      );
    } else if (key === 'Enter') {
      event.preventDefault();
      const time = times[active];
      if (time) commit(time);
      setOpen(false);
    } else if (key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    } else if (key === 'Tab') {
      setOpen(false);
    }
  }

  return (
    <>
      <div
        ref={boxRef}
        className={`${f.control} ${s.box}`}
        data-size={size}
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        data-open={open || undefined}
        data-force={force}
      >
        <Clock aria-hidden="true" />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          inputMode="numeric"
          role="combobox"
          aria-autocomplete="none"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={activeId}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          aria-label={label}
          autoComplete="off"
          spellCheck={false}
          maxLength={5}
          disabled={disabled}
          placeholder={placeholder}
          value={text}
          onChange={(event) => {
            const next = event.target.value.replace(/[^\d:h.]/gi, '');
            setText(next);
            const parsed = parseTime(next);
            if (open && parsed) {
              reveal.current = 'nearest';
              setActive(nearest(toMinutes(parsed)));
            }
          }}
          onClick={() => {
            if (!open) show();
          }}
          onBlur={(event) => {
            if (boxRef.current?.contains(event.relatedTarget)) return;
            setOpen(false);
            commitText();
          }}
          onKeyDown={onKeyDown}
        />
      </div>
      <Floating
        anchorRef={boxRef}
        open={open}
        onDismiss={() => setOpen(false)}
        minWidth={132}
        maxHeight={244}
      >
        <ul
          id={listId}
          role="listbox"
          aria-label={label ?? 'Horários'}
          className={`${p.list} ${s.list}`}
          data-size={size}
        >
          {times.map((time, index) => (
            <li
              key={time}
              id={optionId(index)}
              role="option"
              aria-selected={time === value}
              data-active={index === active || undefined}
              className={`${p.option} ${s.option}`}
              onPointerMove={() => {
                if (index !== active) setActive(index);
              }}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => {
                commit(time);
                setOpen(false);
              }}
            >
              <span className={p.optionText}>{time}</span>
              <Check className={p.check} aria-hidden="true" />
            </li>
          ))}
        </ul>
      </Floating>
    </>
  );
}
