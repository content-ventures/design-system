'use client';

import {
  useId,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Check, ChevronRight, Minus, Pipette, Plus, type LucideIcon } from 'lucide-react';
import { Popover } from './overlays';
import { InputControl } from './controls';
import s from './refined-controls.module.css';

export type ActionMenuItem = {
  label: string;
  description?: string;
  icon?: LucideIcon;
  onSelect?: () => void;
  href?: string;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
  shortcut?: string;
};
export function ActionMenu({
  label,
  trigger,
  items,
  header,
  description,
  simple = false,
  align = 'end',
}: {
  label: string;
  trigger: ReactNode;
  items: ActionMenuItem[];
  header?: ReactNode;
  description?: string;
  simple?: boolean;
  align?: 'start' | 'end';
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  return (
    <Popover
      label={label}
      trigger={trigger}
      open={open}
      onOpenChange={setOpen}
      compact
      align={align}
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')?.focus();
      }}
    >
      {!simple && (
        <div className={s.menuHeader}>
          {header ?? (
            <>
              <span>Ações disponíveis</span>
              <strong>{label}</strong>
              {description && <p>{description}</p>}
            </>
          )}
        </div>
      )}
      <div
        ref={menuRef}
        role="menu"
        aria-label={label}
        className={s.menu}
        data-simple-menu={simple || undefined}
        onKeyDown={(event) => {
          if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          const entries = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)'),
          );
          const current = entries.indexOf(document.activeElement as HTMLElement);
          const next =
            event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? entries.length - 1
                : (current + (event.key === 'ArrowDown' ? 1 : -1) + entries.length) %
                  entries.length;
          entries[next]?.focus();
        }}
      >
        {items.map(
          ({
            label: title,
            description: itemDescription,
            icon: Icon,
            href,
            onSelect,
            danger,
            disabled,
            separator,
            shortcut,
          }) => (
            <div key={title} data-separator={separator || undefined}>
              {href && !disabled ? (
                <a role="menuitem" aria-label={title} href={href} onClick={() => setOpen(false)}>
                  {Icon && (
                    <span className={s.menuIcon} aria-hidden="true">
                      <Icon size={16} />
                    </span>
                  )}
                  <span className={s.menuItemText}>
                    <span>{title}</span>
                    {!simple && itemDescription && <small>{itemDescription}</small>}
                  </span>
                  {shortcut ? (
                    <kbd aria-hidden="true">{shortcut}</kbd>
                  ) : (
                    <ChevronRight className={s.menuTrailing} size={14} aria-hidden="true" />
                  )}
                </a>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  aria-label={title}
                  disabled={disabled}
                  data-danger={danger || undefined}
                  onClick={() => {
                    setOpen(false);
                    onSelect?.();
                  }}
                >
                  {Icon && (
                    <span className={s.menuIcon} aria-hidden="true">
                      <Icon size={16} />
                    </span>
                  )}
                  <span className={s.menuItemText}>
                    <span>{title}</span>
                    {!simple && itemDescription && <small>{itemDescription}</small>}
                  </span>
                  {shortcut && <kbd aria-hidden="true">{shortcut}</kbd>}
                </button>
              )}
            </div>
          ),
        )}
      </div>
    </Popover>
  );
}
export function LinkAction({
  icon: Icon,
  trailingIcon: Trailing,
  className = '',
  children,
  ...props
}: ComponentProps<'a'> & { icon?: LucideIcon; trailingIcon?: LucideIcon }) {
  return (
    <a {...props} className={`${s.link} ${className}`}>
      {Icon && <Icon size={15} aria-hidden="true" />}
      <span>{children}</span>
      {Trailing && <Trailing size={14} aria-hidden="true" />}
    </a>
  );
}
export function NumberInput({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  suffix,
  error,
  ...props
}: Omit<ComponentProps<'input'>, 'type' | 'value' | 'onChange' | 'min' | 'max' | 'step'> & {
  value: number | '';
  onValueChange: (value: number | '') => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  error?: string;
}) {
  const id = useId();
  const inputDigits = Math.min(
    8,
    Math.max(2, String(Math.trunc(Math.max(Math.abs(min), Math.abs(max)))).length),
  );
  const change = (delta: number) =>
    onValueChange(Math.min(max, Math.max(min, Number(value || min) + delta)));
  return (
    <div className={s.numberField}>
      <div
        className={s.number}
        data-disabled={props.disabled || undefined}
        data-invalid={!!error}
        style={{ '--number-input-width': `${inputDigits + 1.5}ch` } as CSSProperties}
      >
        <button
          type="button"
          aria-label="Diminuir quantidade"
          disabled={props.disabled || props.readOnly || (value !== '' && value <= min)}
          onClick={() => change(-step)}
        >
          <Minus size={14} />
        </button>
        <input
          {...props}
          type="number"
          inputMode="numeric"
          value={value}
          min={min}
          max={max}
          step={step}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? id : props['aria-describedby']}
          onChange={(event) => {
            if (event.target.value === '') {
              onValueChange('');
              return;
            }
            const nextValue = event.target.valueAsNumber;
            if (Number.isFinite(nextValue)) {
              onValueChange(Math.min(max, Math.max(min, nextValue)));
            }
          }}
        />
        {suffix && <span>{suffix}</span>}
        <button
          type="button"
          aria-label="Aumentar quantidade"
          disabled={props.disabled || props.readOnly || (value !== '' && value >= max)}
          onClick={() => change(step)}
        >
          <Plus size={14} />
        </button>
      </div>
      {error && (
        <span id={id} className={s.error}>
          {error}
        </span>
      )}
    </div>
  );
}
export function Slider({
  value,
  min = 0,
  max = 100,
  className = '',
  ...props
}: Omit<ComponentProps<'input'>, 'type' | 'value' | 'min' | 'max'> & {
  value: number;
  min?: number;
  max?: number;
}) {
  return (
    <input
      {...props}
      type="range"
      min={min}
      max={max}
      value={value}
      className={`${s.slider} ${className}`}
      style={
        {
          '--slider-fill': `${Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))}%`,
          ...props.style,
        } as CSSProperties
      }
    />
  );
}
export function VerificationCode({
  value,
  onChange,
  length = 6,
  label = 'Código de verificação',
  disabled = false,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  label?: string;
  disabled?: boolean;
  error?: string;
}) {
  const id = useId();
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const code = value.replace(/\D/g, '').slice(0, length);
  const focus = (index: number) =>
    inputs.current[Math.max(0, Math.min(length - 1, index))]?.focus();
  const apply = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      onChange(`${code.slice(0, index)}${code.slice(index + 1)}`);
      return;
    }
    const next = code.split('');
    digits.split('').forEach((digit, offset) => {
      if (index + offset < length) next[index + offset] = digit;
    });
    onChange(next.join('').slice(0, length));
    focus(Math.min(index + digits.length, length - 1));
  };
  return (
    <div className={s.verificationCode}>
      <div
        className={s.codeCells}
        role="group"
        aria-label={label}
        aria-describedby={error ? `${id}-error` : undefined}
        data-complete={code.length === length || undefined}
      >
        {Array.from({ length }, (_, index) => (
          <span className={s.codeCellSlot} key={index}>
            {index === Math.ceil(length / 2) && (
              <span className={s.codeSeparator} aria-hidden="true" />
            )}
            <input
              ref={(node) => {
                inputs.current[index] = node;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              pattern="[0-9]*"
              maxLength={1}
              value={code[index] ?? ''}
              disabled={disabled}
              data-filled={!!code[index] || undefined}
              aria-label={`Dígito ${index + 1} de ${length}`}
              aria-invalid={error ? 'true' : undefined}
              onFocus={(event) => event.currentTarget.select()}
              onChange={(event) => apply(index, event.target.value)}
              onPaste={(event) => {
                event.preventDefault();
                apply(index, event.clipboardData.getData('text'));
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft') {
                  event.preventDefault();
                  focus(index - 1);
                }
                if (event.key === 'ArrowRight') {
                  event.preventDefault();
                  focus(index + 1);
                }
                if (event.key === 'Home') {
                  event.preventDefault();
                  focus(0);
                }
                if (event.key === 'End') {
                  event.preventDefault();
                  focus(length - 1);
                }
                if (event.key === 'Backspace' && !code[index] && index > 0) {
                  event.preventDefault();
                  onChange(`${code.slice(0, index - 1)}${code.slice(index)}`);
                  focus(index - 1);
                }
              }}
            />
          </span>
        ))}
      </div>
      {error && (
        <span id={`${id}-error`} className={s.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
const swatches = [
  { name: 'Azul MediaOn', hex: '#0875db' },
  { name: 'Petróleo', hex: '#246878' },
  { name: 'Floresta', hex: '#357052' },
  { name: 'Âmbar', hex: '#9b6b25' },
  { name: 'Amora', hex: '#a23965' },
  { name: 'Grafite', hex: '#41474f' },
];
export function ColorPicker({
  value,
  onChange,
  label = 'Cor da marca',
  appearance = 'panel',
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  appearance?: 'panel' | 'plain';
}) {
  const id = useId();
  const picker = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(value);
  const [error, setError] = useState(false);
  function select(hex: string) {
    onChange(hex);
    setText(hex);
    setError(false);
  }
  const selectedName =
    swatches.find((color) => color.hex === value.toLowerCase())?.name ?? 'Personalizada';
  return (
    <div className={s.colorPicker} data-appearance={appearance}>
      <div className={s.colorPickerHeader}>
        <span className={s.label}>{label}</span>
        <output aria-live="polite">{selectedName}</output>
      </div>
      <div className={s.colorPanel}>
        <div role="group" aria-label="Cores sugeridas" className={s.swatches}>
          {swatches.map((color) => (
            <button
              type="button"
              key={color.hex}
              aria-label={color.name}
              title={color.name}
              aria-pressed={value.toLowerCase() === color.hex}
              style={{ '--swatch': color.hex } as CSSProperties}
              onClick={() => select(color.hex)}
            >
              {value.toLowerCase() === color.hex && <Check size={13} />}
            </button>
          ))}
        </div>
        <div className={s.colorValue}>
          <button
            type="button"
            aria-label="Escolher cor personalizada"
            title="Abrir seletor de cor"
            onClick={() => picker.current?.click()}
          >
            <i style={{ background: value }} />
            <Pipette size={14} aria-hidden="true" />
          </button>
          <div className={s.colorCode}>
            <label htmlFor={id}>Código hexadecimal</label>
            <InputControl
              id={id}
              value={text}
              maxLength={7}
              error={error ? 'Use # e 6 caracteres de 0–9 ou A–F.' : undefined}
              onChange={(event) => {
                const next = event.target.value;
                setText(next);
                if (/^#[0-9a-f]{6}$/i.test(next)) select(next);
              }}
              onBlur={() => setError(!/^#[0-9a-f]{6}$/i.test(text))}
            />
          </div>
          <input
            ref={picker}
            tabIndex={-1}
            aria-hidden="true"
            className={s.srOnly}
            type="color"
            value={value}
            onChange={(event) => select(event.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export function SearchField({
  id,
  label,
  options,
  onSelect,
}: {
  id?: string;
  label: string;
  options: { value: string; label: string; description?: string; disabled?: boolean }[];
  onSelect: (option: { value: string; label: string }) => void;
}) {
  const uid = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const found = options.filter((option) =>
    normalize(`${option.label} ${option.description ?? ''}`).includes(normalize(query)),
  );
  const choose = (option: (typeof options)[number]) => {
    if (option.disabled) return;
    setQuery(option.label);
    setOpen(false);
    setActive(-1);
    onSelect(option);
  };
  return (
    <div
      className={s.search}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <InputControl
        id={id}
        role="combobox"
        aria-label={label}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? uid : undefined}
        aria-activedescendant={open && active >= 0 ? `${uid}-${active}` : undefined}
        value={query}
        placeholder="Buscar portal…"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setOpen(false);
            return;
          }
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
            const enabled = found
              .map((item, index) => (item.disabled ? -1 : index))
              .filter((index) => index >= 0);
            const current = enabled.indexOf(active);
            setActive(
              enabled[
                current < 0
                  ? event.key === 'ArrowDown'
                    ? 0
                    : enabled.length - 1
                  : (current + (event.key === 'ArrowDown' ? 1 : -1) + enabled.length) %
                    enabled.length
              ] ?? -1,
            );
          }
          if (event.key === 'Enter' && open && found[active]) {
            event.preventDefault();
            choose(found[active]!);
          }
        }}
      />
      {open && (
        <div className={s.searchResults}>
          <div className={s.searchHeading}>
            {found.length} {found.length === 1 ? 'portal encontrado' : 'portais encontrados'}
          </div>
          <div id={uid} role="listbox" aria-label="Resultados de portais">
            {found.map((option, index) => (
              <button
                key={option.value}
                id={`${uid}-${index}`}
                role="option"
                type="button"
                aria-selected={active === index}
                aria-disabled={option.disabled}
                disabled={option.disabled}
                tabIndex={-1}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
              >
                <span>
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </span>
                {!option.disabled && <ChevronRight size={14} />}
              </button>
            ))}
          </div>
          {!found.length && <p role="status">Nenhum portal encontrado. Tente outro nome.</p>}
        </div>
      )}
    </div>
  );
}
