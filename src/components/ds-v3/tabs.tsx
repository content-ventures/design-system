'use client';

import type { LucideIcon } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Count } from './badge';
import s from './tabs.module.css';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export type TabItem<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
  count?: ReactNode;
  panelId?: string;
  disabled?: boolean;
  /** Estado parado para pranchas: `hover`, `active` ou `focus`. */
  force?: string;
};

/**
 * Abas sublinhadas para seções de uma mesma página. A barra de 2 px desliza até a aba ativa;
 * quando não cabem, o trilho rola, esmaece na borda e traz a ativa para a vista.
 * Setas, Home e End percorrem (ativação automática); abas indisponíveis são puladas.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  size = 'md',
  className = '',
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [bar, setBar] = useState<{ x: number; w: number } | null>(null);
  const [animate, setAnimate] = useState(false);
  const [fade, setFade] = useState<'start' | 'end' | 'both' | undefined>(undefined);
  const first = useRef(true);

  const updateFade = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const max = rail.scrollWidth - rail.clientWidth;
    const start = rail.scrollLeft > 1;
    const end = max > 1 && rail.scrollLeft < max - 1;
    setFade(start && end ? 'both' : start ? 'start' : end ? 'end' : undefined);
  }, []);

  useIsoLayoutEffect(() => {
    const measure = () => {
      const el = refs.current[value];
      if (el) setBar({ x: el.offsetLeft, w: el.offsetWidth });
      updateFade();
    };
    measure();
    const rail = railRef.current;
    const ro = typeof ResizeObserver === 'undefined' || !rail ? null : new ResizeObserver(measure);
    if (ro && rail) {
      ro.observe(rail);
      for (const child of rail.children) ro.observe(child);
    }
    return () => ro?.disconnect();
  }, [value, items.length, updateFade]);

  // A barra só desliza depois do primeiro desenho (não nasce correndo do zero).
  useEffect(() => {
    if (!bar || animate) return;
    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(frame);
  }, [bar, animate]);

  // Traz a aba ativa para a vista rolando só o próprio trilho (nunca scrollIntoView, que arrasta a página).
  useEffect(() => {
    const rail = railRef.current;
    const tab = refs.current[value];
    const instant = first.current;
    first.current = false;
    if (!rail || !tab || rail.scrollWidth <= rail.clientWidth + 1) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior: ScrollBehavior = instant || reduce ? 'auto' : 'smooth';
    const left = tab.offsetLeft;
    const right = left + tab.offsetWidth;
    const room = 40;
    if (right > rail.scrollLeft + rail.clientWidth - room) {
      rail.scrollTo({ left: right - rail.clientWidth + room, behavior });
    } else if (left < rail.scrollLeft + room / 2) {
      rail.scrollTo({ left: Math.max(0, left - room), behavior });
    }
  }, [value]);

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    const enabled = items.filter((item) => !item.disabled);
    const index = enabled.findIndex((item) => item.value === value);
    const last = enabled.length - 1;
    let next = -1;
    if (event.key === 'ArrowRight') next = index >= last ? 0 : index + 1;
    else if (event.key === 'ArrowLeft') next = index <= 0 ? last : index - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    const target = enabled[next];
    if (next < 0 || !target) return;
    event.preventDefault();
    onChange(target.value);
    refs.current[target.value]?.focus({ preventScroll: true });
  }

  return (
    <div
      ref={railRef}
      role="tablist"
      aria-label={label}
      className={`${s.tabs} ${className}`}
      data-size={size}
      data-fade={fade}
      onKeyDown={onKey}
      onScroll={updateFade}
    >
      {items.map(({ value: itemValue, label: itemLabel, icon: Icon, count, panelId, disabled, force }) => {
        const selected = itemValue === value;
        return (
          <button
            key={itemValue}
            ref={(node) => {
              refs.current[itemValue] = node;
            }}
            type="button"
            role="tab"
            // O painel nomeia-se pela aba (`aria-labelledby="{panelId}-tab"`). Só a aba ativa aponta
            // para um painel: os inativos não estão no DOM.
            id={panelId ? `${panelId}-tab` : undefined}
            aria-selected={selected}
            aria-controls={selected ? panelId : undefined}
            aria-disabled={disabled || undefined}
            tabIndex={selected ? 0 : -1}
            className={s.tab}
            data-force={force}
            onClick={() => {
              if (!disabled) onChange(itemValue);
            }}
          >
            {Icon && <Icon aria-hidden="true" />}
            <span className={s.label} data-label={itemLabel}>
              {itemLabel}
            </span>
            {count !== undefined && (
              <span className={s.count}>
                <Count tone={selected ? 'accent' : 'neutral'}>{count}</Count>
              </span>
            )}
          </button>
        );
      })}
      {bar && (
        <span
          className={s.bar}
          aria-hidden="true"
          data-animate={animate || undefined}
          style={{ width: bar.w, transform: `translateX(${bar.x}px)` }}
        />
      )}
    </div>
  );
}
