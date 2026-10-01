'use client';

import {
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import s from './slider.module.css';

export type SliderMark = { value: number; kind?: 'recommended' | 'default'; label: string };
/** Atalho rotulado sob o trilho; clicar leva o valor até ele (com animação). */
export type SliderTick = { value: number; label: string; kind?: 'recommended' };

/* ——— Geometria comum ———
 * O centro do polegar vai de `--inset` até 100% − `--inset`: marcas, preenchimento, atalhos e o
 * ponteiro usam a mesma conta. O desenho é próprio; o `input[type=range]` fica por baixo, invisível,
 * para teclado e leitores de tela. */

const clampTo = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

function snapTo(n: number, min: number, max: number, step: number) {
  const snapped = Math.round((n - min) / step) * step + min;
  // Evita 0,30000000000000004 em passos decimais.
  const decimals = (String(step).split('.')[1] ?? '').length;
  return clampTo(Number(snapped.toFixed(decimals)), min, max);
}

function pointerValue(event: PointerEvent, track: HTMLElement, min: number, max: number) {
  const rect = track.getBoundingClientRect();
  const inset = parseFloat(getComputedStyle(track).getPropertyValue('--inset')) || 10;
  const f = clampTo(
    (event.clientX - rect.left - inset) / Math.max(1, rect.width - inset * 2),
    0,
    1,
  );
  return min + f * (max - min);
}

function useDragging() {
  const [dragging, setDragging] = useState<null | string>(null);
  return [dragging, setDragging] as const;
}

const position = (f: number) => `calc(var(--inset) + (100% - 2 * var(--inset)) * ${f})`;

function Ticks({
  ticks,
  fraction,
  current,
  format,
  disabled,
  onPick,
}: {
  ticks: SliderTick[];
  fraction: (n: number) => number;
  current: number | null;
  format: (n: number) => string;
  disabled?: boolean;
  onPick: (n: number) => void;
}) {
  const last = ticks.length - 1;
  return (
    <div className={s.ticks} role="group" aria-label="Atalhos">
      {ticks.map((tick, index) => {
        const f = fraction(tick.value);
        const edge =
          index === 0 && f === 0 ? 'start' : index === last && f === 1 ? 'end' : undefined;
        return (
          <button
            key={`${tick.label}-${tick.value}`}
            type="button"
            className={s.tick}
            data-kind={tick.kind}
            data-edge={edge}
            data-flip={(!edge && f > 0.6) || undefined}
            style={{ '--f': f } as CSSProperties}
            aria-pressed={current === tick.value}
            disabled={disabled}
            onClick={() => onPick(tick.value)}
          >
            <span>{tick.label}</span> <b>{format(tick.value)}</b>
          </button>
        );
      })}
    </div>
  );
}

/* ——— Valor único ——— */

export type SliderProps = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label: string;
  valueText?: string;
  marks?: SliderMark[];
  start?: ReactNode;
  end?: ReactNode;
  onCommit?: () => void;
  /** Sem valor escolhido: polegar tracejado no início e trilho sem preenchimento. */
  empty?: boolean;
  disabled?: boolean;
  /** Texto do valor (bolha durante o arrasto, atalhos e leitor de tela). */
  format?: (value: number) => string;
  ticks?: SliderTick[];
  /** Pontos em cada passo (escalas curtas, até 20 passos). */
  dots?: boolean;
  id?: string;
  describedBy?: string;
  /** Prancha: `hover`, `active` (arrastando) ou `focus`. */
  'data-force'?: string;
};

/**
 * Controle deslizante de valor único. Polegar de 20 px em papel sobre trilho de 6 px; hover acende
 * um halo b-100 de 4 px, o arrasto o amplia para 6 px e mostra a bolha com o valor. Setas andam um passo, PageUp/PageDown
 * dez, Home/End vão às pontas. Mudanças que não vêm do arrasto (atalhos) animam em 280 ms.
 */
export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  valueText,
  marks = [],
  start,
  end,
  onCommit,
  empty,
  disabled,
  format,
  ticks,
  dots,
  id,
  describedBy,
  'data-force': force,
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useDragging();
  const internal = useRef(value);
  const current = clampTo(Number.isFinite(value) ? value : min, min, max);
  const fraction = (n: number) => (max > min ? (clampTo(n, min, max) - min) / (max - min) : 0);
  const text = (n: number) => (format ? format(n) : String(n));
  // O que não veio do ponteiro nem do teclado (atalho, campo ao lado) desliza até o novo valor.
  const animate = !dragging && value !== internal.current;
  const forced = force?.split(' ') ?? [];
  const showBubble = !empty && (dragging !== null || forced.includes('active'));

  function set(next: number) {
    const v = snapTo(next, min, max, step);
    internal.current = v;
    if (v !== value || empty) onChange(v);
  }
  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (disabled || event.button !== 0) return;
    event.preventDefault();
    inputRef.current?.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging('one');
    set(pointerValue(event, event.currentTarget, min, max));
  }
  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    set(pointerValue(event, event.currentTarget, min, max));
  }
  function onPointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    setDragging(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onCommit?.();
  }
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'PageUp' && event.key !== 'PageDown') return;
    event.preventDefault();
    set(current + (event.key === 'PageUp' ? 10 : -10) * step);
  }

  const steps = dots && step > 0 ? Math.round((max - min) / step) : 0;
  return (
    <div
      className={s.slider}
      data-empty={empty || undefined}
      data-disabled={disabled || undefined}
      data-dragging={dragging ? true : undefined}
      data-animate={animate || undefined}
    >
      <div
        ref={trackRef}
        className={s.track}
        style={{ '--f': empty ? 0 : fraction(current) } as CSSProperties}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <span className={s.rail} />
        <span className={s.fill} />
        {steps > 0 &&
          steps <= 20 &&
          Array.from({ length: steps + 1 }, (_, index) => {
            const n = min + index * step;
            return (
              <span
                key={n}
                className={s.dot}
                data-on={(!empty && n <= current) || undefined}
                style={{ left: position(fraction(n)) }}
                aria-hidden="true"
              />
            );
          })}
        {marks.map((mark) => (
          <span
            key={mark.label}
            className={s.mark}
            data-kind={mark.kind}
            title={mark.label}
            style={{ left: position(fraction(mark.value)) }}
            aria-hidden="true"
          />
        ))}
        <span className={s.thumb} data-force={force}>
          {showBubble && (
            <span className={s.bubble} aria-hidden="true">
              {text(current)}
            </span>
          )}
        </span>
        <input
          ref={inputRef}
          id={id}
          className={s.input}
          type="range"
          min={min}
          max={max}
          step={step}
          value={current}
          disabled={disabled}
          aria-label={label}
          aria-valuetext={valueText ?? (format && !empty ? format(current) : undefined)}
          aria-describedby={describedBy}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            const next = Number(event.target.value);
            internal.current = next;
            onChange(next);
          }}
          onKeyDown={onKeyDown}
          onKeyUp={onCommit}
        />
      </div>
      {(start || end) && (
        <div className={s.scale}>
          <span>{start}</span>
          <span>{end}</span>
        </div>
      )}
      {ticks && ticks.length > 0 && (
        <Ticks
          ticks={ticks}
          fraction={fraction}
          current={empty ? null : current}
          format={text}
          disabled={disabled}
          onPick={(n) => {
            onChange(n);
            onCommit?.();
          }}
        />
      )}
    </div>
  );
}

/* ——— Intervalo ——— */

export type RangeSliderProps = {
  value: [number, number];
  min: number;
  max: number;
  step?: number;
  /** Distância mínima entre as pontas. */
  minGap?: number;
  onChange: (value: [number, number]) => void;
  label: string;
  format?: (value: number) => string;
  onCommit?: () => void;
  disabled?: boolean;
  start?: ReactNode;
  end?: ReactNode;
  'data-force'?: string;
};

/**
 * Faixa com dois polegares e o trecho entre eles preenchido. O ponteiro pega o polegar mais perto;
 * quando se encontram, o último usado fica por cima (e o seguinte sai para o lado do movimento).
 */
export function RangeSlider({
  value,
  min,
  max,
  step = 1,
  minGap = 0,
  onChange,
  label,
  format,
  onCommit,
  disabled,
  start,
  end,
  'data-force': force,
}: RangeSliderProps) {
  const [low, high] = value;
  const lo = clampTo(Math.min(low, high), min, max);
  const hi = clampTo(Math.max(low, high), min, max);
  const [dragging, setDragging] = useDragging();
  const [top, setTop] = useState<'lo' | 'hi'>('hi');
  const internal = useRef<[number, number]>([lo, hi]);
  const loRef = useRef<HTMLInputElement>(null);
  const hiRef = useRef<HTMLInputElement>(null);
  const fraction = (n: number) => (max > min ? (clampTo(n, min, max) - min) / (max - min) : 0);
  const text = (n: number) => (format ? format(n) : String(n));
  const animate = !dragging && (lo !== internal.current[0] || hi !== internal.current[1]);
  const forced = force?.split(' ') ?? [];

  function set(which: 'lo' | 'hi', next: number) {
    const v = snapTo(next, min, max, step);
    const pair: [number, number] =
      which === 'lo' ? [Math.min(v, hi - minGap), hi] : [lo, Math.max(v, lo + minGap)];
    pair[0] = clampTo(pair[0], min, max);
    pair[1] = clampTo(pair[1], min, max);
    internal.current = pair;
    if (pair[0] !== lo || pair[1] !== hi) onChange(pair);
  }
  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (disabled || event.button !== 0) return;
    event.preventDefault();
    const v = pointerValue(event, event.currentTarget, min, max);
    const dLo = Math.abs(v - lo);
    const dHi = Math.abs(v - hi);
    const which: 'lo' | 'hi' = dLo < dHi ? 'lo' : dHi < dLo ? 'hi' : v < lo ? 'lo' : 'hi';
    (which === 'lo' ? loRef : hiRef).current?.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(which);
    setTop(which);
    set(which, v);
  }
  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (dragging !== 'lo' && dragging !== 'hi') return;
    set(dragging, pointerValue(event, event.currentTarget, min, max));
  }
  function onPointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    setDragging(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onCommit?.();
  }
  const input = (which: 'lo' | 'hi', ref: RefObject<HTMLInputElement | null>) => {
    const own = which === 'lo' ? lo : hi;
    return (
      <input
        ref={ref}
        className={s.input}
        type="range"
        min={min}
        max={max}
        step={step}
        value={own}
        disabled={disabled}
        aria-label={`${label}: ${which === 'lo' ? 'mínimo' : 'máximo'}`}
        aria-valuetext={format ? format(own) : undefined}
        onFocus={() => setTop(which)}
        onChange={(event) => set(which, Number(event.target.value))}
        onKeyDown={(event) => {
          if (event.key !== 'PageUp' && event.key !== 'PageDown') return;
          event.preventDefault();
          set(which, own + (event.key === 'PageUp' ? 10 : -10) * step);
        }}
        onKeyUp={onCommit}
      />
    );
  };
  const thumb = (which: 'lo' | 'hi') => {
    const own = which === 'lo' ? lo : hi;
    const active = dragging === which || (forced.includes('active') && which === 'hi');
    return (
      <span
        className={s.thumb}
        data-which={which}
        data-top={top === which || undefined}
        data-dragging={active || undefined}
        data-force={which === 'hi' ? force : undefined}
        style={{ '--f': fraction(own) } as CSSProperties}
      >
        {active && (
          <span className={s.bubble} aria-hidden="true">
            {text(own)}
          </span>
        )}
      </span>
    );
  };
  return (
    <div
      className={`${s.slider} ${s.range}`}
      data-disabled={disabled || undefined}
      data-dragging={dragging ? true : undefined}
      data-animate={animate || undefined}
    >
      <div
        className={s.track}
        style={{ '--a': fraction(lo), '--b': fraction(hi) } as CSSProperties}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <span className={s.rail} />
        <span className={s.fill} />
        {thumb('lo')}
        {thumb('hi')}
        <span className={s.inputs} data-top={top}>
          {input('lo', loRef)}
          {input('hi', hiRef)}
        </span>
      </div>
      {(start || end) && (
        <div className={s.scale}>
          <span>{start}</span>
          <span>{end}</span>
        </div>
      )}
    </div>
  );
}
