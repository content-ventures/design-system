'use client';

import { Check, ChevronDown, Search, X } from 'lucide-react';
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import f from './fields.module.css';
import {
  fadeRef,
  FieldSpinner,
  Floating,
  fold,
  forcedOpen,
  Highlight,
  matches,
  selectStyles as p,
  type SelectOption,
} from './select';
import s from './combobox.module.css';

export type ComboboxProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /**
   * Busca no servidor: recebe o texto a cada tecla e devolve as opções já filtradas por `options`.
   * Sem ela, o filtro é local (rótulo e descrição, sem acento nem caixa).
   */
  onQuery?: (query: string) => void;
  /** Busca a caminho: spinner no campo e a linha "Buscando…" no painel. */
  loading?: boolean;
  placeholder?: string;
  /** Linha do painel sem resultado; a função recebe o texto digitado. */
  emptyText?: ReactNode | ((query: string) => ReactNode);
  invalid?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md';
  describedBy?: string;
  /** Nome acessível quando não há <label for>. */
  label?: string;
  /** Texto já digitado ao montar (busca vinda de outra tela; pranchas). */
  defaultQuery?: string;
  /** Prancha: estado parado (`hover`, `focus`, `open`). */
  'data-force'?: string;
};

/** Filtra e ordena: começa pelo texto, depois começa uma palavra, depois contém; por fim, a descrição. */
export function searchOptions(options: SelectOption[], query: string) {
  const needle = fold(query.trim());
  if (!needle) return options;
  const rank = (option: SelectOption) => {
    const label = fold(option.label);
    const at = label.indexOf(needle);
    return at === 0 ? 0 : at > 0 ? (label.includes(` ${needle}`) ? 1 : 2) : 3;
  };
  return options
    .filter((option) => matches(option, query))
    .map((option, index) => ({ option, index, rank: rank(option) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ option }) => option);
}

/**
 * Seleção com busca: o campo é o gatilho. Digitar filtra e destaca o trecho; ↑↓ percorrem, Enter
 * escolhe, Escape fecha (e, de novo, limpa). A opção escolhida mostra a marca dela dentro do campo.
 * Não cria registros novos nem junta vários valores — para isso, `MultiSelect`.
 */
export function Combobox({
  id,
  value,
  onChange,
  options,
  onQuery,
  loading = false,
  placeholder = 'Buscar…',
  emptyText,
  invalid,
  disabled,
  size = 'md',
  describedBy,
  label,
  defaultQuery,
  'data-force': force,
}: ComboboxProps) {
  const auto = useId();
  const inputId = id ?? `${auto}-input`;
  const listId = `${auto}-list`;
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pinned = forcedOpen(force);
  const [openState, setOpen] = useState(false);
  const open = openState || pinned;
  /** `null`: não está digitando — o campo mostra a opção escolhida e a lista inteira. */
  const [query, setQuery] = useState<string | null>(defaultQuery ?? null);
  const [active, setActive] = useState(pinned ? 0 : -1);
  const reveal = useRef(false);

  // Na busca do servidor, a opção escolhida pode não estar na página atual de resultados.
  const lastSelected = useRef<SelectOption | undefined>(undefined);
  const found = options.find((option) => option.value === value);
  if (found) lastSelected.current = found;
  const selected =
    found ?? (lastSelected.current?.value === value ? lastSelected.current : undefined);
  const term = query ?? '';
  // Filtro local (sem `onQuery`): quem começa pelo texto vem antes.
  const visible = useMemo(
    () => (onQuery || !term ? options : searchOptions(options, term)),
    [options, term, onQuery],
  );
  const optionId = (index: number) => `${auto}-opt-${index}`;
  const activeId =
    open && !loading && active >= 0 && active < visible.length ? optionId(active) : undefined;

  useEffect(() => {
    if (!open || !reveal.current || !activeId) return;
    reveal.current = false;
    document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' });
  }, [open, activeId]);

  function show(at?: number) {
    if (disabled) return;
    const current = visible.findIndex((option) => option.value === value);
    reveal.current = true;
    setActive(at ?? (current >= 0 ? current : 0));
    setOpen(true);
  }
  function close() {
    setOpen(false);
    // Busca no servidor: sem texto, a lista volta inteira para a próxima abertura.
    if (query) onQuery?.('');
    setQuery(null);
  }
  function choose(option: SelectOption | undefined) {
    if (!option || option.disabled) return;
    onChange(option.value);
    close();
    inputRef.current?.focus({ preventScroll: true });
  }
  function type(next: string) {
    setQuery(next);
    onQuery?.(next);
    reveal.current = true;
    setActive(0);
    if (!open) setOpen(true);
  }
  function clear() {
    onChange('');
    setQuery(null);
    onQuery?.('');
    inputRef.current?.focus({ preventScroll: true });
  }
  function go(index: number) {
    if (!visible.length) return;
    reveal.current = true;
    setActive(Math.max(0, Math.min(visible.length - 1, index)));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const { key } = event;
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      if (!open) show(key === 'ArrowUp' ? visible.length - 1 : undefined);
      else go(active + (key === 'ArrowDown' ? 1 : -1));
    } else if ((key === 'PageDown' || key === 'PageUp') && open) {
      event.preventDefault();
      go(active + (key === 'PageDown' ? 8 : -8));
    } else if (key === 'Enter' && open) {
      event.preventDefault();
      choose(visible[active]);
    } else if (key === 'Escape') {
      // Primeiro fecha (e desfaz o que foi digitado); com a lista fechada, limpa.
      if (open || query !== null) {
        event.preventDefault();
        event.stopPropagation();
        close();
      } else if (value) {
        event.preventDefault();
        event.stopPropagation();
        clear();
      }
    } else if (key === 'Tab' && open) {
      close();
    }
  }

  const typing = query !== null;
  const showLead = !typing && selected?.leading;
  const empty =
    typeof emptyText === 'function'
      ? emptyText(term)
      : (emptyText ?? (term ? `Nada encontrado para “${term}”` : 'Nada encontrado.'));

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
        onPointerDown={(event) => {
          // Clique fora do texto (ícone, margem) também foca e abre.
          if (disabled || event.target === inputRef.current) return;
          if (!(event.target as Element).closest('button')) {
            event.preventDefault();
            inputRef.current?.focus();
            if (!open) show();
          }
        }}
      >
        <span className={s.lead} data-kind={showLead ? 'mark' : 'search'} aria-hidden="true">
          {showLead ? selected?.leading : <Search />}
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={activeId}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          aria-busy={loading || undefined}
          aria-label={label}
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          placeholder={placeholder}
          value={typing ? term : (selected?.label ?? '')}
          onChange={(event) => type(event.target.value)}
          onClick={() => {
            if (!open) show();
          }}
          onKeyDown={onKeyDown}
          onBlur={(event) => {
            // Saiu digitando: texto vazio limpa a escolha; o resto volta à opção escolhida.
            if (boxRef.current?.contains(event.relatedTarget)) return;
            if (query === '') onChange('');
            if (query !== null) setQuery(null);
          }}
        />
        {loading ? (
          <FieldSpinner />
        ) : (
          value &&
          !disabled && (
            <button
              type="button"
              className={f.clear}
              aria-label={label ? `Limpar ${label.toLowerCase()}` : 'Limpar'}
              tabIndex={-1}
              onPointerDown={(event) => event.preventDefault()}
              onClick={clear}
            >
              <X aria-hidden="true" />
            </button>
          )
        )}
        <button
          type="button"
          className={s.toggle}
          tabIndex={-1}
          aria-hidden="true"
          disabled={disabled}
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => {
            inputRef.current?.focus({ preventScroll: true });
            if (open) close();
            else show();
          }}
        >
          <ChevronDown />
        </button>
      </div>
      <Floating
        anchorRef={boxRef}
        open={open}
        inline={pinned}
        onDismiss={close}
        width="fit"
        minWidth={240}
      >
        <ul
          ref={fadeRef}
          id={listId}
          role="listbox"
          className={p.list}
          data-size={size}
          aria-label={label}
          aria-busy={loading || undefined}
        >
          {loading ? (
            <li className={p.status} role="presentation">
              Buscando…
            </li>
          ) : (
            visible.length === 0 && (
              <li className={p.empty} role="presentation">
                {empty}
              </li>
            )
          )}
          {!loading &&
            visible.map((option, index) => (
              <li
                key={option.value}
                id={optionId(index)}
                role="option"
                aria-selected={option.value === value}
                aria-disabled={option.disabled || undefined}
                data-active={index === active || undefined}
                className={p.option}
                onPointerMove={() => {
                  if (index !== active) setActive(index);
                }}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
              >
                {option.leading && <span className={p.lead}>{option.leading}</span>}
                <span className={p.optionText}>
                  <span className={p.optionLabel}>
                    <Highlight text={option.label} query={term} />
                  </span>
                  {option.description && <small>{option.description}</small>}
                </span>
                <Check className={p.check} aria-hidden="true" />
              </li>
            ))}
        </ul>
      </Floating>
    </>
  );
}
