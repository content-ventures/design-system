'use client';

import {
  useId,
  useRef,
  useState,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from 'react';
import * as Popover from '@radix-ui/react-popover';
import { DayPicker } from 'react-day-picker';
import { ptBR } from 'react-day-picker/locale';
import * as Select from '@radix-ui/react-select';
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from 'lucide-react';
import c from './controls.module.css';

type SelectOption = { value: string; label: string; disabled?: boolean };
export function SelectControl({
  id,
  name,
  label,
  value,
  defaultValue,
  onValueChange,
  options,
  disabled,
  descriptionId,
  compact = false,
  className = '',
}: {
  id?: string;
  name?: string;
  label: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  descriptionId?: string;
  compact?: boolean;
  className?: string;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <Select.Root
      name={name}
      value={value}
      defaultValue={defaultValue ?? options[0]?.value}
      onValueChange={onValueChange}
      disabled={disabled}
      open={open}
      onOpenChange={setOpen}
    >
      <Select.Trigger
        ref={trigger}
        id={id}
        aria-label={label}
        aria-describedby={descriptionId}
        className={`${c.selectTrigger} ${className}`}
        data-compact={compact}
      >
        <Select.Value />
        <Select.Icon asChild>
          <ChevronDown size={14} aria-hidden="true" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal
        container={
          trigger.current?.closest<HTMLElement>('dialog, [data-controls-root]') ?? undefined
        }
      >
        <Select.Content
          position="popper"
          sideOffset={5}
          collisionPadding={12}
          className={c.selectMenu}
          onCloseAutoFocus={(event) => {
            if (!trigger.current?.isConnected) event.preventDefault();
          }}
        >
          <Select.ScrollUpButton className={c.scrollButton}>
            <ChevronUp size={14} />
          </Select.ScrollUpButton>
          <Select.Viewport className={c.selectViewport}>
            {options.map((option) => (
              <Select.Item
                className={c.selectOption}
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                textValue={option.label}
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className={c.selectedMark}>
                  <Check size={14} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton className={c.scrollButton}>
            <ChevronDown size={14} />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
export const selectOptions = (values: string[]): SelectOption[] =>
  values.map((value) => ({ value, label: value }));

type InputProps = ComponentProps<'input'> & {
  error?: string;
  prefix?: string;
  suffix?: string;
  icon?: ReactNode;
};
export function InputControl({
  error,
  prefix,
  suffix,
  icon,
  className = '',
  ...props
}: InputProps) {
  const errorId = useId();
  return (
    <span className={c.fieldControl}>
      <span className={c.inputBox} data-invalid={Boolean(error)}>
        {icon && (
          <span className={c.inputIcon} aria-hidden="true">
            {icon}
          </span>
        )}
        {prefix && (
          <span className={c.inputPrefix} aria-hidden="true">
            {prefix}
          </span>
        )}
        <input
          {...props}
          className={`${c.input} ${className}`}
          aria-invalid={error ? true : props['aria-invalid']}
          aria-describedby={error ? errorId : props['aria-describedby']}
        />
        {suffix && (
          <span className={c.inputSuffix} aria-hidden="true">
            {suffix}
          </span>
        )}
      </span>
      {error && (
        <span className={c.fieldError} id={errorId} aria-hidden="true">
          {error}
        </span>
      )}
    </span>
  );
}
export function TextareaControl({
  error,
  className = '',
  ...props
}: ComponentProps<'textarea'> & { error?: string }) {
  const errorId = useId();
  return (
    <span className={c.fieldControl}>
      <textarea
        {...props}
        className={`${c.textarea} ${className}`}
        aria-invalid={error ? true : props['aria-invalid']}
        aria-describedby={error ? errorId : props['aria-describedby']}
      />
      {error && (
        <span className={c.fieldError} id={errorId} aria-hidden="true">
          {error}
        </span>
      )}
    </span>
  );
}

// Valores de dinheiro aceitam digitação e colagem em pt-BR, sem perder centavos.
export function parseMoney(value: string): number {
  const text = value.trim().replace(/^R\$\s*/, '');
  if (!text) return NaN;
  if (/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(text) || /^\d+(?:,\d{1,2})?$/.test(text))
    return Number(text.replaceAll('.', '').replace(',', '.'));
  if (/^\d+\.\d{1,2}$/.test(text)) return Number(text);
  return NaN;
}
const formatMoney = (value: number) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    value,
  );

function maskMoney(value: string) {
  return value.replace(/[^\d.,]/g, '');
}

export function MoneyInput({
  defaultValue,
  ...props
}: Omit<InputProps, 'type' | 'value' | 'defaultValue' | 'prefix'> & { defaultValue?: number }) {
  const { onBlur, onChange, ...inputProps } = props;
  const [text, setText] = useState(() =>
    defaultValue === undefined ? '' : formatMoney(defaultValue),
  );

  return (
    <InputControl
      {...inputProps}
      type="text"
      inputMode="decimal"
      data-money="true"
      prefix="R$"
      placeholder="0,00"
      value={text}
      onChange={(event) => {
        const masked = maskMoney(event.currentTarget.value);
        event.currentTarget.value = masked;
        setText(masked);
        onChange?.(event);
      }}
      onBlur={(event) => {
        const candidate = text.endsWith(',') ? text.slice(0, -1) : text;
        const value = parseMoney(candidate);
        if (Number.isFinite(value)) {
          const formatted = formatMoney(value);
          event.currentTarget.value = formatted;
          setText(formatted);
        }
        onBlur?.(event);
      }}
    />
  );
}

export function parseDate(value: string): Date | undefined {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  const local = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!iso && !local) return;
  const [year, month, day] = iso
    ? [Number(iso[1]), Number(iso[2]), Number(iso[3])]
    : [Number(local![3]), Number(local![2]), Number(local![1])];
  const date = new Date(year, month - 1, day, 12);
  if (
    year >= 1000 &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
    return date;
}
export function isoDate(value: string) {
  const date = parseDate(value);
  return date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    : '';
}
const dateText = (date: Date) =>
  `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
export function DateInput({
  id,
  name,
  label,
  defaultValue = '',
  required,
  error,
  onValueChange,
  descriptionId,
}: {
  id?: string;
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
  error?: string;
  onValueChange?: (value: string) => void;
  descriptionId?: string;
}) {
  const [text, setText] = useState(() => {
    const date = parseDate(defaultValue);
    return date ? dateText(date) : defaultValue;
  });
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const selected = parseDate(text);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <span className={c.fieldControl}>
        <Popover.Anchor asChild>
          <span className={c.inputBox} data-invalid={Boolean(error)}>
            <input
              ref={input}
              id={id}
              className={c.input}
              name={name}
              aria-label={label}
              placeholder="dd/mm/aaaa"
              inputMode="numeric"
              autoComplete="off"
              data-date="true"
              required={required}
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                onValueChange?.(event.target.value);
              }}
              onBlur={() => {
                if (selected) setText(dateText(selected));
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : descriptionId}
            />
            <Popover.Trigger asChild>
              <button
                type="button"
                className={c.calendarTrigger}
                aria-label={`Abrir calendário de ${label.toLowerCase()}`}
              >
                <CalendarDays size={16} />
              </button>
            </Popover.Trigger>
          </span>
        </Popover.Anchor>
        {error && (
          <span className={c.fieldError} id={errorId} aria-hidden="true">
            {error}
          </span>
        )}
      </span>
      <Popover.Portal
        container={input.current?.closest<HTMLElement>('dialog, [data-controls-root]') ?? undefined}
      >
        <Popover.Content
          className={c.calendarMenu}
          sideOffset={5}
          align="start"
          collisionPadding={12}
          aria-label={`Calendário de ${label.toLowerCase()}`}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            input.current?.focus({ preventScroll: true });
          }}
        >
          <DayPicker
            mode="single"
            required
            locale={ptBR}
            selected={selected}
            defaultMonth={selected}
            autoFocus
            showOutsideDays
            onSelect={(date) => {
              if (date) {
                setText(dateText(date));
                onValueChange?.(dateText(date));
                setOpen(false);
              }
            }}
            classNames={{
              root: c.calendar,
              months: c.months,
              month_caption: c.monthCaption,
              caption_label: c.caption,
              nav: c.calendarNav,
              button_previous: c.previousMonth,
              button_next: c.nextMonth,
              month_grid: c.monthGrid,
              weekday: c.weekday,
              day: c.day,
              day_button: c.dayButton,
              selected: c.selectedDay,
              today: c.today,
              outside: c.outside,
            }}
            components={{
              Chevron: ({ orientation }) =>
                orientation === 'left' ? <ChevronLeft size={15} /> : <ChevronRight size={15} />,
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function useFormValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const clearError = (event: FormEvent<HTMLFormElement>) => {
    const target = event.target as HTMLInputElement;
    if (target.name && errors[target.name])
      setErrors((current) => {
        const next = { ...current };
        delete next[target.name];
        return next;
      });
  };
  const validate = (form: HTMLFormElement, requireAssets = false) => {
    const next: Record<string, string> = {};
    const fields = Array.from(form.elements).filter(
      (element): element is HTMLInputElement | HTMLTextAreaElement =>
        (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) &&
        element.type !== 'hidden' &&
        !element.disabled &&
        Boolean(element.name),
    );
    for (const field of fields) {
      const value = field.value.trim();
      if (field.required && !value) next[field.name] = 'Preencha este campo.';
      else if (
        field instanceof HTMLInputElement &&
        field.dataset.date &&
        value &&
        !parseDate(value)
      )
        next[field.name] = 'Informe uma data válida no formato dd/mm/aaaa.';
      else if (field.validity.typeMismatch) next[field.name] = 'Informe um e-mail válido.';
      else if (field.validity.rangeUnderflow && field instanceof HTMLInputElement)
        next[field.name] = `Use um valor maior ou igual a ${field.min}.`;
      else if (field.validity.stepMismatch) next[field.name] = 'Informe um número inteiro.';
      else if (!field.validity.valid) next[field.name] = 'Confira o valor informado.';
      if (field instanceof HTMLInputElement && field.dataset.money && value) {
        const amount = parseMoney(value);
        if (!Number.isFinite(amount)) next[field.name] = 'Use um valor como 1.234,56.';
        else if (amount < Number(field.min || 0))
          next[field.name] = `O valor mínimo é R$ ${formatMoney(Number(field.min || 0))}.`;
      }
    }
    const data = new FormData(form);
    if (
      data.get('start') &&
      data.get('end') &&
      isoDate(String(data.get('end'))) &&
      isoDate(String(data.get('start'))) &&
      isoDate(String(data.get('end'))) < isoDate(String(data.get('start')))
    )
      next.end = 'O término deve ser igual ou posterior ao início.';
    if (requireAssets && data.getAll('assets').length === 0)
      next.assets = 'Selecione ao menos um formato de mídia.';
    setErrors(next);
    const first = fields.find((field) => next[field.name]);
    if (first) {
      first.focus();
      first.scrollIntoView?.({ block: 'center', behavior: 'instant' });
    }
    return Object.keys(next).length === 0;
  };
  const clearField = (name: string) =>
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  return { errors, clearError, clearField, validate };
}
