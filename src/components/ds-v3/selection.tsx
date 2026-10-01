'use client';

import { CircleAlert, LoaderCircle, type LucideIcon } from 'lucide-react';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import s from './selection.module.css';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function CheckMarks() {
  return (
    <>
      <svg data-mark="check" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path
          d="M2.5 6.2 5 8.6l4.6-5.2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <svg data-mark="dash" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M3 6h6" stroke="currentColor" strokeLinecap="round" />
      </svg>
    </>
  );
}

/* ——— Checkbox ——— */

export type CheckboxProps = Omit<ComponentProps<'input'>, 'type'> & {
  label?: ReactNode;
  description?: ReactNode;
  indeterminate?: boolean;
  invalid?: boolean;
  /** Prancha: estado parado (`hover`, `active`, `focus`). */
  'data-force'?: string;
};

export function Checkbox({
  label,
  description,
  indeterminate = false,
  invalid,
  className = '',
  ...props
}: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <label
      className={`${s.choice} ${className}`}
      data-disabled={props.disabled || undefined}
      data-invalid={invalid || undefined}
    >
      <input ref={ref} type="checkbox" aria-invalid={invalid || undefined} {...props} />
      <span className={s.box}>
        <CheckMarks />
      </span>
      {(label || description) && (
        <span className={s.text}>
          {label && <span className={s.title}>{label}</span>}
          {description && <span className={s.description}>{description}</span>}
        </span>
      )}
    </label>
  );
}

/**
 * Só o desenho da caixa (sem input), para listas que já têm o próprio papel de seleção — opções de
 * `MultiSelect`, linhas de tabela com `aria-selected`.
 */
export function CheckboxMark({
  checked,
  indeterminate,
  disabled,
}: {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
}) {
  return (
    <span
      className={`${s.box} ${s.mark}`}
      data-checked={(checked && !indeterminate) || undefined}
      data-mixed={indeterminate || undefined}
      data-disabled={disabled || undefined}
      aria-hidden="true"
    >
      <CheckMarks />
    </span>
  );
}

/** Grupo de escolhas com legenda (13/600) e erro do grupo no lugar da ajuda. */
function ChoiceGroup({
  legend,
  hint,
  error,
  orientation = 'vertical',
  children,
  required,
  role,
}: {
  legend: ReactNode;
  hint?: ReactNode;
  error?: string;
  orientation?: 'vertical' | 'horizontal';
  children: ReactNode;
  required?: boolean;
  role?: string;
}) {
  const id = useId();
  return (
    <fieldset
      className={s.group}
      data-invalid={error ? true : undefined}
      aria-describedby={error || hint ? `${id}-desc` : undefined}
      aria-invalid={error ? true : undefined}
      role={role}
    >
      <legend className={s.legend}>
        {legend}
        {required && (
          <span className={s.required} aria-hidden="true">
            *
          </span>
        )}
      </legend>
      <div className={s.groupItems} data-orientation={orientation}>
        {children}
      </div>
      {error ? (
        <p id={`${id}-desc`} className={s.groupError}>
          <CircleAlert aria-hidden="true" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-desc`} className={s.groupHint}>
            {hint}
          </p>
        )
      )}
    </fieldset>
  );
}

export function CheckboxGroup(props: {
  legend: ReactNode;
  hint?: ReactNode;
  error?: string;
  orientation?: 'vertical' | 'horizontal';
  required?: boolean;
  children: ReactNode;
}) {
  return <ChoiceGroup {...props} />;
}

/* ——— Radio ——— */

export type RadioProps = Omit<ComponentProps<'input'>, 'type'> & {
  label?: ReactNode;
  description?: ReactNode;
  invalid?: boolean;
  'data-force'?: string;
};

export function Radio({ label, description, invalid, className = '', ...props }: RadioProps) {
  return (
    <label
      className={`${s.choice} ${s.radio} ${className}`}
      data-disabled={props.disabled || undefined}
      data-invalid={invalid || undefined}
    >
      <input type="radio" aria-invalid={invalid || undefined} {...props} />
      <span className={s.box} />
      {(label || description) && (
        <span className={s.text}>
          {label && <span className={s.title}>{label}</span>}
          {description && <span className={s.description}>{description}</span>}
        </span>
      )}
    </label>
  );
}

/**
 * Rádios (ou `ChoiceCard`s) com legenda. As setas percorrem e escolhem, Tab entra pela opção marcada
 * e sai do grupo — o comportamento nativo do mesmo `name`, inclusive na grade de cartões.
 */
export function RadioGroup({
  legend,
  hint,
  error,
  orientation = 'vertical',
  required,
  children,
}: {
  legend: ReactNode;
  hint?: ReactNode;
  error?: string;
  orientation?: 'vertical' | 'horizontal';
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <ChoiceGroup
      legend={legend}
      hint={hint}
      error={error}
      orientation={orientation}
      required={required}
      role="radiogroup"
    >
      {children}
    </ChoiceGroup>
  );
}

/* ——— Switch ——— */

export function Switch({
  checked,
  onCheckedChange,
  label,
  hideLabel = false,
  disabled,
  loading = false,
  size = 'md',
  describedBy,
  id: idProp,
  'data-force': force,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  hideLabel?: boolean;
  disabled?: boolean;
  /** Salvando: o polegar gira, o trilho mantém a cor do estado e o clique espera. */
  loading?: boolean;
  size?: 'sm' | 'md';
  /** Id do texto que explica o estado (por exemplo, o motivo de estar indisponível). */
  describedBy?: string;
  /** Para um `<label htmlFor>` externo (linha de configuração com descrição). */
  id?: string;
  'data-force'?: string;
}) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <span
      className={s.switch}
      data-size={size}
      data-disabled={disabled || undefined}
      data-loading={loading || undefined}
    >
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={hideLabel ? label : undefined}
        aria-describedby={describedBy}
        aria-busy={loading || undefined}
        disabled={disabled}
        data-force={force}
        onClick={() => {
          if (!loading) onCheckedChange(!checked);
        }}
      >
        <span className={s.track}>
          <span className={s.thumb}>
            {loading && <LoaderCircle className={s.thumbSpin} aria-hidden="true" />}
          </span>
        </span>
      </button>
      {!hideLabel && (
        <label htmlFor={id} className={s.title}>
          {label}
        </label>
      )}
    </span>
  );
}

/* ——— Segmentado ——— */

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
  /** Esconde o texto e usa o rótulo só como nome acessível. */
  iconOnly?: boolean;
};

/**
 * Escolha exclusiva entre poucas visões. O ativo é papel sobre trilho cinza e desliza entre as
 * opções. Setas, Home e End movem a seleção.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
  full = false,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  full?: boolean;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [box, setBox] = useState<{ x: number; w: number } | null>(null);
  useIsoLayoutEffect(() => {
    const measure = () => {
      const el = refs.current[value];
      if (el) setBox({ x: el.offsetLeft, w: el.offsetWidth });
    };
    measure();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    const parent = refs.current[value]?.parentElement;
    if (ro && parent) ro.observe(parent);
    return () => ro?.disconnect();
  }, [value, options.length]);
  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    const index = options.findIndex((option) => option.value === value);
    const last = options.length - 1;
    const next =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? index === last
          ? 0
          : index + 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? index === 0
            ? last
            : index - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : -1;
    if (next < 0) return;
    const target = options[next];
    if (!target) return;
    event.preventDefault();
    onChange(target.value);
    refs.current[target.value]?.focus();
  }
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={s.segmented}
      data-size={size}
      data-full={full || undefined}
      onKeyDown={onKey}
    >
      {box && (
        <span
          className={s.indicator}
          aria-hidden="true"
          style={{ width: box.w, transform: `translateX(${box.x}px)` }}
        />
      )}
      {options.map(({ value: optionValue, label: optionLabel, icon: Icon, iconOnly }) => (
        <button
          key={optionValue}
          ref={(node) => {
            refs.current[optionValue] = node;
          }}
          type="button"
          role="radio"
          aria-checked={optionValue === value}
          aria-label={iconOnly ? optionLabel : undefined}
          title={iconOnly ? optionLabel : undefined}
          tabIndex={optionValue === value ? 0 : -1}
          className={s.segment}
          onClick={() => onChange(optionValue)}
        >
          {Icon && <Icon aria-hidden="true" />}
          {!iconOnly && optionLabel}
        </button>
      ))}
    </div>
  );
}

/* ——— Cartão de escolha ——— */

/**
 * Opção rica (título, descrição) com rádio de 18 px no canto superior direito — o cartão de ativo e
 * de envio do construtor. Sem ícone (A-64). `footer` é a nota presa ao cartão (ex.: o que impede
 * a escolha), separada por um fio, fora da área clicável.
 */
export function ChoiceCard({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  leading,
  extra,
  footer,
  disabled,
  invalid,
  layout = 'row',
  'data-force': force,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  title: ReactNode;
  description?: ReactNode;
  /** Mantido por compatibilidade; o cartão do produto não leva ícone. */
  leading?: ReactNode;
  extra?: ReactNode;
  footer?: ReactNode;
  disabled?: boolean;
  invalid?: boolean;
  layout?: 'row' | 'stacked';
  'data-force'?: string;
}) {
  return (
    <div
      className={s.card}
      data-layout={layout}
      data-disabled={disabled || undefined}
      data-invalid={invalid || undefined}
      data-footer={footer ? true : undefined}
      data-force={force}
    >
      <label className={s.cardMain}>
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          onChange={() => onChange(value)}
        />
        {leading}
        <span className={s.cardBody}>
          <span className={s.cardTitle}>{title}</span>
          {description && <span className={s.cardDesc}>{description}</span>}
          {extra && <span className={s.cardExtra}>{extra}</span>}
        </span>
        <span className={s.radioDot} aria-hidden="true" />
      </label>
      {footer && <div className={s.cardFoot}>{footer}</div>}
    </div>
  );
}
