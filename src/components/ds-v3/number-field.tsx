'use client';

import { Minus, Plus } from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type PointerEvent,
  type ReactNode,
} from 'react';
import f from './fields.module.css';
import s from './inputs.module.css';

/** Número no formato pt-BR (vírgula decimal, ponto de milhar). */
export const formatNumber = (value: number, decimals = 0) =>
  value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

/** Lê “1.250,5”, “1250,5” ou “-3”. Vazio ou inválido → null. */
export function parseNumber(text: string): number | null {
  const clean = text.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  if (!clean || clean === '-' || clean === '.') return null;
  const value = Number(clean);
  return Number.isFinite(value) ? value : null;
}

const editable = (value: number, decimals: number) =>
  decimals ? value.toFixed(decimals).replace('.', ',') : String(Math.round(value));

export type NumberFieldProps = Omit<
  ComponentProps<'input'>,
  'value' | 'onChange' | 'size' | 'prefix' | 'type' | 'min' | 'max' | 'step' | 'defaultValue'
> & {
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
  prefix?: ReactNode;
  suffix?: ReactNode;
  /** Botões − e + dentro do controle, com fio entre eles; desligam nos limites. */
  stepper?: boolean;
  size?: 'sm' | 'md' | 'lg';
  invalid?: boolean;
  /** Nome acessível quando não há <label for>. */
  label?: string;
  /** Ao sair do campo o valor foi trazido para o limite: diga isso perto do campo. */
  onAdjust?: (next: number, typed: number) => void;
};

/**
 * Número alinhado à direita, tabular, com vírgula decimal. Setas ±passo (Shift ×10), Home/End vão
 * aos limites. Digitar fora da faixa é permitido; ao sair, o valor volta ao limite e `onAdjust` avisa.
 */
export function NumberField({
  value,
  onChange,
  min,
  max,
  step = 1,
  decimals = 0,
  prefix,
  suffix,
  stepper = false,
  size = 'md',
  invalid,
  label,
  onAdjust,
  className = '',
  style,
  ...props
}: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const repeat = useRef<{ delay?: number; tick?: number }>({});
  useEffect(() => {
    const timers = repeat.current;
    return () => {
      window.clearTimeout(timers.delay);
      window.clearInterval(timers.tick);
    };
  }, []);

  const round = (n: number) => Number(n.toFixed(decimals));
  const clamp = (n: number) =>
    Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min ?? Number.NEGATIVE_INFINITY, n));
  const text = draft ?? (value === null ? '' : formatNumber(value, decimals));
  const atMin = min !== undefined && value !== null && value <= min;
  const atMax = max !== undefined && value !== null && value >= max;
  const locked = props.disabled || props.readOnly;

  function commit(next: number) {
    onChange(next);
    if (draft !== null) setDraft(editable(next, decimals));
  }
  function nudge(from: number | null, direction: 1 | -1, factor = 1) {
    const base = from ?? (direction > 0 ? (min ?? 0) - step : (max ?? 0) + step);
    return clamp(round(base + direction * step * factor));
  }

  function stopRepeat() {
    window.clearTimeout(repeat.current.delay);
    window.clearInterval(repeat.current.tick);
  }
  function startRepeat(direction: 1 | -1, event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 || locked) return;
    event.preventDefault();
    // Segurar repete: um passo agora, depois de 400 ms um a cada 80 ms, até o limite.
    let current = nudge(value, direction);
    commit(current);
    stopRepeat();
    repeat.current.delay = window.setTimeout(() => {
      repeat.current.tick = window.setInterval(() => {
        const next = nudge(current, direction);
        if (next === current) return stopRepeat();
        current = next;
        commit(current);
      }, 80);
    }, 400);
  }

  return (
    <div
      className={`${f.control} ${s.number} ${className}`}
      style={style}
      data-size={size}
      data-stepper={stepper || undefined}
      data-invalid={invalid || undefined}
      data-disabled={props.disabled || undefined}
      data-readonly={(props.readOnly && !props.disabled) || undefined}
    >
      {prefix && (
        <span className={f.affix} data-kind="prefix">
          {prefix}
        </span>
      )}
      <input
        {...props}
        type="text"
        inputMode={decimals ? 'decimal' : 'numeric'}
        autoComplete="off"
        role="spinbutton"
        aria-label={props['aria-label'] ?? label}
        aria-valuenow={value ?? undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={
          value === null
            ? undefined
            : `${formatNumber(value, decimals)}${typeof suffix === 'string' ? ` ${suffix}` : ''}`
        }
        aria-invalid={invalid || undefined}
        value={text}
        onFocus={(event) => {
          setDraft(value === null ? '' : editable(value, decimals));
          props.onFocus?.(event);
        }}
        onChange={(event) => {
          let raw = event.target.value;
          if (decimals) raw = raw.replace('.', ',');
          const negative = (min ?? 0) < 0 && raw.trim().startsWith('-');
          let clean = raw.replace(decimals ? /[^\d,]/g : /\D/g, '');
          const comma = clean.indexOf(',');
          if (comma !== -1)
            clean = `${clean.slice(0, comma + 1)}${clean
              .slice(comma + 1)
              .replace(/,/g, '')
              .slice(0, decimals)}`;
          clean = `${negative ? '-' : ''}${clean}`;
          setDraft(clean);
          onChange(parseNumber(clean));
        }}
        onBlur={(event) => {
          setDraft(null);
          if (value !== null) {
            const next = clamp(round(value));
            if (next !== value) {
              onChange(next);
              onAdjust?.(next, value);
            }
          }
          props.onBlur?.(event);
        }}
        onKeyDown={(event) => {
          props.onKeyDown?.(event);
          if (event.defaultPrevented || locked) return;
          if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
            commit(nudge(value, event.key === 'ArrowUp' ? 1 : -1, event.shiftKey ? 10 : 1));
          } else if (event.key === 'Home' && min !== undefined) {
            event.preventDefault();
            commit(min);
          } else if (event.key === 'End' && max !== undefined) {
            event.preventDefault();
            commit(max);
          }
        }}
      />
      {suffix && (
        <span className={f.affix} data-kind="suffix">
          {suffix}
        </span>
      )}
      {stepper && (
        <span className={s.steps}>
          <button
            type="button"
            className={s.step}
            tabIndex={-1}
            aria-label="Diminuir"
            disabled={props.disabled || atMin}
            onPointerDown={(event) => startRepeat(-1, event)}
            onPointerUp={stopRepeat}
            onPointerLeave={stopRepeat}
            onPointerCancel={stopRepeat}
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              // Clique de teclado/leitor de tela (sem ponteiro): um passo.
              if (event.detail === 0 && !locked) commit(nudge(value, -1));
            }}
          >
            <Minus aria-hidden="true" />
          </button>
          <button
            type="button"
            className={s.step}
            tabIndex={-1}
            aria-label="Aumentar"
            disabled={props.disabled || atMax}
            onPointerDown={(event) => startRepeat(1, event)}
            onPointerUp={stopRepeat}
            onPointerLeave={stopRepeat}
            onPointerCancel={stopRepeat}
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              if (event.detail === 0 && !locked) commit(nudge(value, 1));
            }}
          >
            <Plus aria-hidden="true" />
          </button>
        </span>
      )}
    </div>
  );
}
