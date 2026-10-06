'use client';

import { ChevronDown, X } from 'lucide-react';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { Count } from './badge';
import f from './fields.module.css';
import { LinkButton } from './link';
import { Tooltip } from './overlays';
import {
  fadeRef,
  Floating,
  forcedOpen,
  Highlight,
  matches,
  PanelSearch,
  selectStyles as p,
  type SelectOption,
} from './select';
import { CheckboxMark } from './selection';
import s from './multiselect.module.css';

const CHIP_EXIT_MS = 180;
/** Espaço depois de cada ficha (margem da `.chipWrap`). */
const CHIP_GAP = 4;
const ALL = '__all__';

export type MultiSelectProps = {
  id?: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: SelectOption[];
  /** Limite de escolhas: atingido, as demais opções ficam indisponíveis ("Máximo 3"). */
  max?: number;
  searchable?: boolean;
  placeholder?: string;
  /** Nome acessível (e prefixo do resumo lido pelo leitor de tela). */
  label?: string;
  invalid?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md';
  describedBy?: string;
  /** Plural do rodapé: "3 selecionados". */
  countLabel?: (count: number) => string;
  /** Prancha: `hover`, `focus` ou `open` (painel aberto e parado). */
  'data-force'?: string;
};

type ChipItem = { value: string; leaving?: boolean };

/**
 * Seleção múltipla. O campo mostra as fichas removíveis que cabem inteiras e "+N" (a dica lista o
 * resto) — numa linha só. O painel tem "Selecionar todos", opções com caixa e um rodapé com a
 * contagem e "Limpar".
 * Com o campo em foco: ↓/Enter/Espaço abrem, Backspace remove a última ficha. No painel: ↑↓
 * percorrem, Espaço/Enter marcam sem fechar, Escape fecha.
 */
export function MultiSelect({
  id,
  values,
  onChange,
  options,
  max,
  searchable = false,
  placeholder = 'Selecione',
  label,
  invalid,
  disabled,
  size = 'md',
  describedBy,
  countLabel = (count) => `${count} ${count === 1 ? 'selecionado' : 'selecionados'}`,
  'data-force': force,
}: MultiSelectProps) {
  const auto = useId();
  const triggerId = id ?? `${auto}-trigger`;
  const listId = `${auto}-list`;
  const boxRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const pinned = forcedOpen(force);
  const [openState, setOpen] = useState(false);
  const open = openState || pinned;
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(pinned ? -1 : 0);
  const reveal = useRef(false);

  const chosen = useMemo(
    () => values.filter((value) => options.some((option) => option.value === value)),
    [values, options],
  );
  const full = max !== undefined && chosen.length >= max;
  const visible = useMemo(
    () => (searchable ? options.filter((option) => matches(option, query)) : options),
    [options, query, searchable],
  );
  const selectable = options.filter((option) => !option.disabled);
  const showAll =
    !query && selectable.length > 1 && (max === undefined || max >= selectable.length);
  const allChecked =
    selectable.length > 0 && selectable.every((option) => chosen.includes(option.value));
  const someChecked = !allChecked && chosen.length > 0;
  // Linhas navegáveis: "Selecionar todos" (quando existe) e as opções visíveis.
  const rows = showAll
    ? [ALL, ...visible.map((option) => option.value)]
    : visible.map((o) => o.value);
  const rowId = (value: string) =>
    `${auto}-${value === ALL ? 'all' : `opt-${rows.indexOf(value)}`}`;
  const activeValue = open ? rows[active] : undefined;
  const activeId = activeValue !== undefined ? rowId(activeValue) : undefined;
  const labelOf = (value: string) =>
    options.find((option) => option.value === value)?.label ?? value;
  const lockedOut = (option: SelectOption) => Boolean(full && !chosen.includes(option.value));

  useEffect(() => {
    if (!open || !reveal.current || !activeId) return;
    reveal.current = false;
    document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' });
  }, [open, activeId]);
  useEffect(() => {
    if (openState && searchable) searchRef.current?.focus({ preventScroll: true });
  }, [openState, searchable]);

  /* Fichas: entram em escala; ao sair, encolhem a largura e somem em 180 ms. */
  const [chips, setChips] = useState<ChipItem[]>(() => chosen.map((value) => ({ value })));
  const timers = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    setChips((current) => {
      const next: ChipItem[] = [];
      const kept = new Set(chosen);
      current.forEach((chip) => {
        if (kept.has(chip.value)) next.push({ value: chip.value });
        else next.push({ value: chip.value, leaving: true });
      });
      chosen.forEach((value) => {
        if (!current.some((chip) => chip.value === value)) next.push({ value });
      });
      // A ordem segue a escolha; as que saem ficam no lugar até sumir.
      return next.sort((a, b) => {
        const ia = chosen.indexOf(a.value);
        const ib = chosen.indexOf(b.value);
        if (ia < 0 || ib < 0) return 0;
        return ia - ib;
      });
    });
  }, [chosen]);
  useEffect(() => {
    const map = timers.current;
    chips
      .filter((chip) => chip.leaving && !map.has(chip.value))
      .forEach((chip) => {
        map.set(
          chip.value,
          window.setTimeout(() => {
            map.delete(chip.value);
            setChips((current) =>
              current.filter((item) => !(item.value === chip.value && item.leaving)),
            );
          }, CHIP_EXIT_MS),
        );
      });
  }, [chips]);
  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((timer) => window.clearTimeout(timer));
  }, []);

  /* Quantas fichas cabem inteiras: mede a régua (largura natural) contra a área das fichas. */
  const chipsRef = useRef<HTMLSpanElement>(null);
  const rulerRef = useRef<HTMLSpanElement>(null);
  const [fit, setFit] = useState(2);
  const chosenKey = chosen.join('\u0000');
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const measure = () => {
      const area = chipsRef.current;
      const ruler = rulerRef.current;
      if (!area || !ruler) return;
      const items = [...ruler.children] as HTMLElement[];
      const more = items.pop()?.getBoundingClientRect().width ?? 0;
      const avail = area.getBoundingClientRect().width + 0.5;
      let next = 1;
      let used = 0;
      // Cada ficha leva a margem de 4 depois dela, inclusive a última.
      items.forEach((item, index) => {
        used += item.getBoundingClientRect().width + CHIP_GAP;
        const last = index === items.length - 1;
        if ((last ? used : used + more) <= avail) next = index + 1;
      });
      setFit(next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    if (rulerRef.current) observer.observe(rulerRef.current);
    return () => observer.disconnect();
  }, [chosenKey, disabled, size]);

  function show() {
    if (disabled) return;
    reveal.current = true;
    setActive(0);
    setQuery('');
    setOpen(true);
  }
  function close(restore = true) {
    setOpen(false);
    if (restore) triggerRef.current?.focus({ preventScroll: true });
  }
  function toggle(value: string | undefined) {
    if (value === undefined) return;
    if (value === ALL) {
      onChange(allChecked ? [] : selectable.map((option) => option.value));
      return;
    }
    const option = options.find((item) => item.value === value);
    if (!option || option.disabled) return;
    if (chosen.includes(value)) onChange(chosen.filter((item) => item !== value));
    else if (!full) onChange([...chosen, value]);
  }
  function go(index: number) {
    if (!rows.length) return;
    reveal.current = true;
    setActive(Math.max(0, Math.min(rows.length - 1, index)));
  }
  function onKeyDown(event: KeyboardEvent) {
    const { key } = event;
    if (!open) {
      if (event.target !== triggerRef.current) return;
      if (key === 'ArrowDown' || key === 'Enter' || key === ' ') {
        event.preventDefault();
        show();
      } else if (key === 'Backspace' && chosen.length) {
        event.preventDefault();
        onChange(chosen.slice(0, -1));
      }
      return;
    }
    if (key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      go(active + (key === 'ArrowDown' ? 1 : -1));
    } else if ((key === 'Home' || key === 'End') && !searchable) {
      event.preventDefault();
      go(key === 'Home' ? 0 : rows.length - 1);
    } else if (key === 'Enter' || (key === ' ' && !searchable)) {
      event.preventDefault();
      toggle(rows[active]);
    } else if (key === 'Tab') {
      close(false);
    }
  }

  // Fichas inteiras enquanto cabem; as que não cabem viram "+N". Só a primeira pode encurtar,
  // e só quando ela sozinha (com a contagem) já passa da largura do campo.
  const shown: ChipItem[] = [];
  let kept = 0;
  for (const chip of chips) {
    if (kept >= fit) break;
    shown.push(chip);
    if (!chip.leaving) kept += 1;
  }
  const rest = chosen.slice(kept);
  const summary = chosen.map(labelOf).join(', ');

  return (
    <div className={s.root} onKeyDown={onKeyDown}>
      <div
        ref={boxRef}
        className={`${f.control} ${s.box}`}
        data-size={size}
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        data-open={open || undefined}
        data-force={force}
      >
        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          className={s.trigger}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={searchable ? undefined : activeId}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          aria-label={label ? `${label}: ${summary || placeholder}` : undefined}
          disabled={disabled}
          onClick={() => (open ? close() : show())}
        >
          {chosen.length === 0 && <span className={s.placeholder}>{placeholder}</span>}
        </button>
        {chips.length > 0 && (
          <span ref={chipsRef} className={s.chips}>
            {shown.map((chip) => (
              <span
                key={chip.value}
                className={s.chipWrap}
                data-leaving={chip.leaving || undefined}
              >
                <span className={s.chip}>
                  <span className={s.chipText}>{labelOf(chip.value)}</span>
                  {!disabled && (
                    <button
                      type="button"
                      className={s.chipRemove}
                      tabIndex={-1}
                      aria-label={`Remover ${labelOf(chip.value)}`}
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={() => onChange(chosen.filter((value) => value !== chip.value))}
                    >
                      <X aria-hidden="true" />
                    </button>
                  )}
                </span>
              </span>
            ))}
            {rest.length > 0 && (
              <Tooltip content={rest.map(labelOf).join(', ')}>
                <button
                  type="button"
                  className={s.more}
                  aria-label={`Mostrar mais ${rest.length}: ${rest.map(labelOf).join(', ')}`}
                  onClick={() => (open ? close() : show())}
                >
                  <Count label={`Mais ${rest.length}: ${rest.map(labelOf).join(', ')}`}>
                    +{rest.length}
                  </Count>
                </button>
              </Tooltip>
            )}
          </span>
        )}
        {/* Régua invisível: a largura natural de cada ficha e da contagem. */}
        {chosen.length > 0 && (
          <span ref={rulerRef} className={s.ruler} aria-hidden="true">
            {chosen.map((value) => (
              <span key={value} className={s.chipWrap}>
                <span className={s.chip}>
                  <span className={s.chipText}>{labelOf(value)}</span>
                  {!disabled && <span className={s.chipRemove} />}
                </span>
              </span>
            ))}
            <span className={s.more}>
              <Count>+{chosen.length}</Count>
            </span>
          </span>
        )}
        <ChevronDown className={s.chevron} aria-hidden="true" />
      </div>
      <Floating
        anchorRef={boxRef}
        open={open}
        inline={pinned}
        onDismiss={() => close(false)}
        minWidth={260}
        maxHeight={360}
      >
        {searchable && (
          <PanelSearch
            inputRef={searchRef}
            value={query}
            onValueChange={(next) => {
              setQuery(next);
              setActive(0);
            }}
            aria-controls={listId}
            aria-activedescendant={activeId}
          />
        )}
        <ul
          ref={fadeRef}
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          aria-label={label}
          className={`${p.list} ${s.list}`}
          data-size={size}
        >
          {showAll && (
            <li
              id={rowId(ALL)}
              role="option"
              aria-selected={allChecked}
              data-active={activeValue === ALL || undefined}
              className={`${p.option} ${s.option} ${s.all}`}
              onPointerMove={() => {
                if (active !== 0) setActive(0);
              }}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => toggle(ALL)}
            >
              <CheckboxMark checked={allChecked} indeterminate={someChecked} />
              <span className={p.optionText}>Selecionar todos</span>
            </li>
          )}
          {visible.length === 0 && (
            <li className={p.empty} role="presentation">
              {query ? `Nada encontrado para “${query}”` : 'Nada encontrado.'}
            </li>
          )}
          {visible.map((option) => {
            const checked = chosen.includes(option.value);
            const locked = option.disabled || lockedOut(option);
            const description =
              lockedOut(option) && !option.disabled ? `Máximo ${max}` : option.description;
            return (
              <li
                key={option.value}
                id={rowId(option.value)}
                role="option"
                aria-selected={checked}
                aria-disabled={locked || undefined}
                data-active={activeValue === option.value || undefined}
                className={`${p.option} ${s.option}`}
                onPointerMove={() => {
                  const index = rows.indexOf(option.value);
                  if (index !== active) setActive(index);
                }}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => toggle(option.value)}
              >
                <CheckboxMark checked={checked} disabled={locked} />
                <span className={p.optionText}>
                  <span className={p.optionLabel}>
                    {searchable ? <Highlight text={option.label} query={query} /> : option.label}
                  </span>
                  {description && <small>{description}</small>}
                </span>
              </li>
            );
          })}
        </ul>
        <div className={p.foot}>
          <span aria-live="polite">
            {chosen.length ? countLabel(chosen.length) : 'Nenhum selecionado'}
          </span>
          <LinkButton
            disabled={!chosen.length}
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => onChange([])}
          >
            Limpar
          </LinkButton>
        </div>
      </Floating>
    </div>
  );
}
