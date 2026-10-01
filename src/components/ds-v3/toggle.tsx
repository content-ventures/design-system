'use client';

import type { LucideIcon } from 'lucide-react';
import { useRef, type ComponentProps, type KeyboardEvent, type MouseEvent } from 'react';
import { VisuallyHidden } from './a11y';
import s from './toggle.module.css';

/**
 * Botão que liga e desliga uma condição da tela (ex.: “Filtros” abre a faixa de filtros).
 * Desligado parece secundário; ligado fica em azul suave. `count` mostra quantos itens a
 * condição carrega (filtros aplicados) e troca por crossfade.
 */
export function ToggleButton({
  pressed,
  onPressedChange,
  icon: Icon,
  children,
  size = 'sm',
  variant = 'secondary',
  count,
  countLabel,
  className = '',
  onClick,
  ...props
}: Omit<ComponentProps<'button'>, 'onChange' | 'type'> & {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  icon?: LucideIcon;
  size?: 'sm' | 'md';
  /** `secondary` com fio (padrão) · `ghost` sem fio, para barras com busca e segmentado. */
  variant?: 'secondary' | 'ghost';
  count?: number;
  /** Leitura do contador (ex.: “2 filtros aplicados”). */
  countLabel?: string;
  /** Estado parado para pranchas (`hover`, `active`, `focus`). Nunca no produto. */
  'data-force'?: string;
}) {
  return (
    <button
      {...props}
      type="button"
      aria-pressed={pressed}
      className={`${s.toggle} ${className}`}
      data-size={size}
      data-variant={variant}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) onPressedChange(!pressed);
      }}
    >
      {Icon && <Icon aria-hidden="true" />}
      {children}
      {count ? (
        <>
          <span key={count} className={s.count} aria-hidden="true">
            {count}
          </span>
          <VisuallyHidden>{countLabel ?? String(count)}</VisuallyHidden>
        </>
      ) : null}
    </button>
  );
}

export type ToggleItem = {
  value: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
  disabled?: boolean;
  /** Estado parado para pranchas. */
  'data-force'?: string;
};

type ToggleGroupBase = {
  items: ToggleItem[];
  /** Nome do grupo. Com rótulo visível, prefira `labelledBy`. */
  label: string;
  labelledBy?: string;
  describedBy?: string;
  /** Nenhuma escolha quando era obrigatória: fio vermelho suave em todas as opções. */
  invalid?: boolean;
  size?: 'sm' | 'md';
};
export type ToggleGroupProps = ToggleGroupBase &
  (
    | {
        type: 'single';
        value: string | null;
        onChange: (value: string | null) => void;
        /** Impede desmarcar a opção ligada. */
        required?: boolean;
      }
    | { type: 'multiple'; value: string[]; onChange: (value: string[]) => void }
  );

/**
 * Pílulas de escolha (categoria do ativo, pavilhões de interesse). `single` liga uma e permite
 * desligar; `multiple` liga várias. Espaço/Enter alternam; setas, Home e End movem o foco.
 * No `single` o grupo é uma parada de Tab só.
 */
export function ToggleGroup(props: ToggleGroupProps) {
  const { items, label, labelledBy, describedBy, invalid = false, size = 'sm' } = props;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const isOn = (value: string) =>
    props.type === 'single' ? props.value === value : props.value.includes(value);

  function toggle(value: string) {
    if (props.type === 'single') {
      props.onChange(props.value === value ? (props.required ? value : null) : value);
    } else {
      const next = new Set(props.value);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      props.onChange(items.map((item) => item.value).filter((item) => next.has(item)));
    }
  }

  const enabled = items.map((item, index) => (item.disabled ? -1 : index)).filter((index) => index >= 0);
  const onIndex = items.findIndex((item) => !item.disabled && isOn(item.value));
  const stop = props.type === 'single' ? (onIndex >= 0 ? onIndex : (enabled[0] ?? -1)) : -1;

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = refs.current.indexOf(document.activeElement as HTMLButtonElement);
    const at = enabled.indexOf(current);
    if (at < 0) return;
    const last = enabled.length - 1;
    const next =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? at === last
          ? 0
          : at + 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? at === 0
            ? last
            : at - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : -1;
    if (next < 0) return;
    event.preventDefault();
    refs.current[enabled[next] ?? -1]?.focus();
  }

  return (
    <div
      role="group"
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      className={s.group}
      data-size={size}
      onKeyDown={onKeyDown}
    >
      {items.map((item, index) => {
        const Icon = item.icon;
        const on = isOn(item.value);
        return (
          <button
            key={item.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            className={s.pill}
            aria-pressed={on}
            disabled={item.disabled}
            tabIndex={stop < 0 || index === stop ? undefined : -1}
            data-force={item['data-force']}
            onClick={() => toggle(item.value)}
          >
            {Icon && <Icon aria-hidden="true" />}
            {item.label}
            {item.count !== undefined && <span className={s.count}>{item.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
