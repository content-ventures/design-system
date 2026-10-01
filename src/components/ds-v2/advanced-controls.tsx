'use client';
import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Check, Eye, EyeOff, Search, X } from 'lucide-react';
import { InputControl } from './controls';
import { IconButton } from './button';
import s from './extensions.module.css';

export function PasswordInput(props: Omit<ComponentProps<typeof InputControl>, 'type' | 'suffix'>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={s.password}>
      <InputControl {...props} type={visible ? 'text' : 'password'} />
      <IconButton
        variant="ghost"
        label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visible}
        icon={visible ? EyeOff : Eye}
        onClick={() => setVisible(!visible)}
      />
    </div>
  );
}
export type ComboboxOption = {
  value: string;
  label: string;
  description?: string;
  leading?: ReactNode;
  disabled?: boolean;
};
export function Combobox({
  label,
  options,
  value,
  onChange,
  multiple = false,
  disabled = false,
  placeholder = 'Buscar e selecionar…',
  placement = 'bottom',
}: {
  label: string;
  options: ComboboxOption[];
  value: string[];
  onChange: (value: string[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  placeholder?: string;
  placement?: 'top' | 'bottom';
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const filtered = options.filter((option) =>
    option.label
      .toLocaleLowerCase('pt-BR')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .includes(
        query
          .toLocaleLowerCase('pt-BR')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, ''),
      ),
  );
  const enabled = filtered.filter((option) => !option.disabled);
  const selected = options.filter((option) => value.includes(option.value));
  function choose(option: ComboboxOption) {
    if (option.disabled) return;
    onChange(
      multiple
        ? value.includes(option.value)
          ? value.filter((item) => item !== option.value)
          : [...value, option.value]
        : [option.value],
    );
    setQuery('');
    setHighlight(0);
    if (!multiple) setOpen(false);
  }
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      setOpen(false);
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setHighlight((index) =>
        Math.max(0, Math.min(enabled.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1))),
      );
    }
    if (event.key === 'Enter' && open) {
      event.preventDefault();
      if (enabled[highlight]) choose(enabled[highlight]);
    }
    if (event.key === 'Home' && open) setHighlight(0);
    if (event.key === 'End' && open) setHighlight(enabled.length - 1);
    if (event.key === 'Backspace' && multiple && !query && value.length) {
      onChange(value.slice(0, -1));
    }
  }
  const comboboxProps = {
    role: 'combobox' as const,
    'aria-label': label,
    'aria-expanded': open,
    'aria-autocomplete': 'list' as const,
    'aria-controls': `${id}-list`,
    'aria-activedescendant':
      open && enabled[highlight] ? `${id}-${enabled[highlight]!.value}` : undefined,
    disabled,
    value: !open && !multiple ? (selected[0]?.label ?? '') : query,
    onFocus: () => setOpen(true),
    onClick: () => setOpen(true),
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      setQuery(event.target.value);
      setHighlight(0);
      setOpen(true);
    },
    onKeyDown: handleKeyDown,
  };
  return (
    <div
      className={s.combobox}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      {multiple ? (
        <div
          className={s.multiControl}
          data-disabled={disabled || undefined}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              event.preventDefault();
              inputRef.current?.focus();
            }
          }}
        >
          {selected.map((option) => (
            <span className={s.chip} key={option.value}>
              <span>{option.label}</span>
              <button
                type="button"
                disabled={disabled}
                aria-label={`Remover ${option.label}`}
                onClick={() => onChange(value.filter((item) => item !== option.value))}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            {...comboboxProps}
            ref={inputRef}
            className={s.multiInput}
            placeholder={placeholder}
          />
        </div>
      ) : (
        <InputControl
          {...comboboxProps}
          placeholder={selected.length ? selected[0]?.label : placeholder}
          icon={<Search size={14} />}
        />
      )}
      {open && (
        <div
          className={s.options}
          data-placement={placement}
          role="listbox"
          id={`${id}-list`}
          aria-label={label}
          aria-multiselectable={multiple || undefined}
        >
          {filtered.map((option) => (
            <div
              role="option"
              key={option.value}
              id={`${id}-${option.value}`}
              aria-selected={value.includes(option.value)}
              aria-disabled={option.disabled || undefined}
              data-highlighted={option.value === enabled[highlight]?.value}
              data-rich={!!(option.leading || option.description) || undefined}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(option)}
            >
              <span className={s.optionMain}>
                {option.leading && (
                  <span className={s.optionVisual} data-option-visual aria-hidden="true">
                    {option.leading}
                  </span>
                )}
                <span className={s.optionCopy}>
                  <strong>{option.label}</strong>
                  {option.description && <small>{option.description}</small>}
                </span>
              </span>
              {value.includes(option.value) && <Check size={14} />}
            </div>
          ))}
          {!filtered.length && <p role="status">Nenhum resultado para “{query}”.</p>}
        </div>
      )}
    </div>
  );
}
