'use client';

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Chip } from './badge';
import { useAnchoredPanel, usePresence } from './filter-bar';
import s from './tag-input.module.css';

const fold = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
const tidy = (value: string) => value.replace(/\s+/g, ' ').trim();

/** Trecho que casa com a busca em peso 600, sem fundo. */
function Highlight({ text, query }: { text: string; query: string }): ReactNode {
  const q = fold(query.trim());
  const at = q ? fold(text).indexOf(q) : -1;
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <mark className={s.hl}>{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>
  );
}

/**
 * Campo de etiquetas: chips e o texto no mesmo contorno de um `Input`. Enter ou vírgula adicionam
 * (sem espaços sobrando, sem repetir — maiúsculas não contam); colar “a, b, c” vira três.
 * Backspace no campo vazio marca a última e, de novo, remove. Sugestões numa lista que filtra
 * enquanto digita (setas, Enter, Escape).
 */
export function TagInput({
  values,
  onChange,
  suggestions = [],
  placeholder = 'Adicionar',
  max,
  label,
  invalid = false,
  disabled = false,
  id,
  describedBy,
  'data-force': force,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  max?: number;
  /** Nome acessível quando não há `<label htmlFor>`. */
  label?: string;
  invalid?: boolean;
  disabled?: boolean;
  id?: string;
  describedBy?: string;
  /** Prancha: `hover`, `focus`. */
  'data-force'?: string;
}) {
  const auto = useId();
  const inputId = id ?? auto;
  const listId = `${inputId}-list`;
  const fieldRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [armed, setArmed] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const initial = useRef(new Set(values.map(fold)));
  const full = max !== undefined && values.length >= max;
  const present = usePresence(values, fold);

  const options = useMemo(() => {
    const taken = new Set(values.map(fold));
    const q = fold(text.trim());
    return suggestions.filter((item) => !taken.has(fold(item)) && (!q || fold(item).includes(q))).slice(0, 8);
  }, [suggestions, values, text]);
  const showList = open && !full && !disabled && options.length > 0;
  const { host, style, up } = useAnchoredPanel({ open: showList, anchor: fieldRef, panel: listRef, matchWidth: true, gap: 4 });

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 700);
    return () => window.clearTimeout(timer);
  }, [flash]);
  useEffect(() => {
    if (!showList) return;
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!fieldRef.current?.contains(target) && !listRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [showList]);

  function add(raw: string[]) {
    const next = [...values];
    let repeated: string | null = null;
    raw.map(tidy).forEach((value) => {
      if (!value) return;
      if (max !== undefined && next.length >= max) return;
      const existing = next.find((item) => fold(item) === fold(value));
      if (existing) {
        repeated = existing;
        return;
      }
      next.push(value);
    });
    if (repeated) setFlash(fold(repeated));
    if (next.length !== values.length) onChange(next);
    setText('');
    setActive(0);
    setArmed(false);
    // Adicionou: a lista fecha; ↓ ou digitar reabre.
    setOpen(false);
  }
  function remove(value: string) {
    initial.current.delete(fold(value));
    onChange(values.filter((item) => item !== value));
    setArmed(false);
    inputRef.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !text) {
      const last = values[values.length - 1];
      if (!last) return;
      event.preventDefault();
      if (armed) remove(last);
      else setArmed(true);
      return;
    }
    if (armed && event.key !== 'Shift') setArmed(false);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) setOpen(true);
      else setActive((index) => (options.length ? (index + 1) % options.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => (options.length ? (index - 1 + options.length) % options.length : 0));
    } else if (event.key === 'Enter' || event.key === ',') {
      const typed = text.trim();
      const choice = showList ? options[Math.min(active, options.length - 1)] : undefined;
      // Vírgula sempre leva o texto digitado; Enter com a lista aberta escolhe a sugestão marcada.
      const pick = event.key === 'Enter' && choice && (!typed || fold(choice).includes(fold(typed))) ? choice : typed;
      if (!pick) return;
      event.preventDefault();
      add([pick]);
    } else if (event.key === 'Escape') {
      if (showList) {
        event.preventDefault();
        setOpen(false);
      } else if (text) {
        event.preventDefault();
        setText('');
      }
    } else if (event.key === 'Tab' && showList) {
      setOpen(false);
    }
  }
  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData('text');
    if (!/[,;\n]/.test(pasted)) return;
    event.preventDefault();
    add(pasted.split(/[,;\n]+/));
  }

  const activeOption = showList ? options[Math.min(active, options.length - 1)] : undefined;
  const optionId = (index: number) => `${inputId}-opt-${index}`;
  return (
    <>
      <div
        ref={fieldRef}
        className={s.field}
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        data-full={full || undefined}
        data-force={force}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) {
            event.preventDefault();
            inputRef.current?.focus();
            setOpen(true);
          }
        }}
      >
        {present.map(({ item, key, leaving }) => (
          <Chip
            key={key}
            variant="neutral"
            size="sm"
            leaving={leaving}
            appear={!initial.current.has(key)}
            highlighted={(armed && item === values[values.length - 1]) || flash === key}
            onRemove={disabled ? undefined : () => remove(item)}
            removeLabel={`Remover ${item}`}
          >
            {item}
          </Chip>
        ))}
        <input
          ref={inputRef}
          id={inputId}
          className={s.input}
          role="combobox"
          aria-label={label}
          aria-expanded={showList}
          aria-controls={showList ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={activeOption ? optionId(options.indexOf(activeOption)) : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          value={text}
          placeholder={full ? `Máximo de ${max}` : placeholder}
          readOnly={full}
          size={1}
          onChange={(event) => {
            setText(event.target.value);
            setOpen(true);
            setActive(0);
            setArmed(false);
          }}
          onFocus={() => text && setOpen(true)}
          onBlur={() => setArmed(false)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
        />
      </div>
      {showList &&
        host &&
        createPortal(
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={label ? `Sugestões para ${label}` : 'Sugestões'}
            className={s.list}
            data-up={up || undefined}
            style={style}
          >
            {options.map((option, index) => (
              <div
                key={option}
                id={optionId(index)}
                role="option"
                aria-selected={option === activeOption}
                className={s.option}
                onPointerDown={(event) => event.preventDefault()}
                onPointerEnter={() => setActive(index)}
                onClick={() => {
                  add([option]);
                  inputRef.current?.focus();
                }}
              >
                <Highlight text={option} query={text} />
              </div>
            ))}
          </div>,
          host,
        )}
    </>
  );
}
