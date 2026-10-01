'use client';

import { Check, ChevronDown, LoaderCircle, Search, X } from 'lucide-react';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import s from './select.module.css';

export type SelectOption = {
  value: string;
  label: string;
  /** Linha de apoio. Na opção indisponível, diz o motivo. */
  description?: string;
  leading?: ReactNode;
  disabled?: boolean;
};

/* ——————————————————————————————————————————————————————————————————————————
 * Camada flutuante compartilhada (Select, Combobox, MultiSelect, TimeField, ColorField).
 * Presa à janela num portal dentro do escopo do tema: nenhuma tabela ou moldura a recorta.
 * Abre abaixo do gatilho, vira para cima quando falta espaço, fica a 8 px da borda e acompanha
 * rolagem e redimensionamento. Entra em 180 ms a partir do lado do gatilho e sai em 120 ms.
 * —————————————————————————————————————————————————————————————————————————— */

const GAP = 6;
const EDGE = 8;
export const EXIT_MS = 120;

type Box = { top: number; bottom: number; left: number; right: number };
type Placement = {
  top: number;
  left: number;
  width?: number;
  maxHeight: number;
  side: 'below' | 'above';
};

/** Área visível do gatilho: o contêiner rolável mais próximo, limitado à janela. */
function scrollArea(anchor: Element): Box {
  const vh = window.innerHeight;
  const vw = document.documentElement.clientWidth;
  for (let node = anchor.parentElement; node && node !== document.body; node = node.parentElement) {
    const overflow = getComputedStyle(node).overflowY;
    if (overflow === 'auto' || overflow === 'scroll') {
      const box = node.getBoundingClientRect();
      return { top: Math.max(0, box.top), bottom: Math.min(vh, box.bottom), left: 0, right: vw };
    }
  }
  return { top: 0, bottom: vh, left: 0, right: vw };
}

/** O gatilho saiu de vista (rolou para fora da janela ou de um ancestral que recorta). */
function anchorHidden(anchor: Element) {
  const rect = anchor.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const outside = (box: { top: number; bottom: number; left: number; right: number }) =>
    y < box.top || y > box.bottom || x < box.left || x > box.right;
  if (outside({ top: 0, left: 0, bottom: window.innerHeight, right: window.innerWidth }))
    return true;
  for (let node = anchor.parentElement; node && node !== document.body; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (style.overflowX !== 'visible' || style.overflowY !== 'visible') {
      if (outside(node.getBoundingClientRect())) return true;
    }
  }
  return false;
}

/** Mantém a camada montada durante a saída: `open` → `closing` (120 ms) → `closed`. */
export function usePresence(open: boolean, exitMs = EXIT_MS) {
  const [state, setState] = useState<'open' | 'closing' | 'closed'>(open ? 'open' : 'closed');
  if (open && state !== 'open') setState('open');
  if (!open && state === 'open') setState('closing');
  useEffect(() => {
    if (state !== 'closing') return;
    const timer = window.setTimeout(() => setState('closed'), exitMs);
    return () => window.clearTimeout(timer);
  }, [state, exitMs]);
  return state;
}

export type FloatingProps = {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  /** Clique fora ou gatilho fora de vista. */
  onDismiss: () => void;
  children: ReactNode;
  className?: string;
  /**
   * `anchor`: mesma largura do gatilho (mínimo `minWidth`). `auto`: largura do conteúdo.
   * `fit`: no mínimo a largura do gatilho e, se as opções pedirem, cresce até `fitMax` (texto inteiro).
   */
  width?: 'anchor' | 'auto' | 'fit';
  minWidth?: number;
  /** Com `width="fit"`: largura máxima (padrão 320). */
  fitMax?: number;
  maxHeight?: number;
  /**
   * `false`: o painel fica no fluxo, logo depois do gatilho (ordem de leitura do leitor de tela), mas
   * continua `position: fixed` — nenhuma moldura o recorta. Padrão: portal no escopo do tema.
   */
  portal?: boolean;
  id?: string;
  role?: string;
  'aria-label'?: string;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  /** Prancha (`data-force="open"`): o painel aberto no fluxo, logo abaixo do gatilho, parado. */
  inline?: boolean;
};

/** `data-force` pede o painel aberto e parado (prancha)? */
export const forcedOpen = (force: string | undefined) =>
  Boolean(force?.split(' ').includes('open'));

export function Floating({
  anchorRef,
  open,
  onDismiss,
  children,
  className = '',
  width = 'anchor',
  minWidth = 0,
  fitMax = 320,
  maxHeight = 320,
  portal = true,
  id,
  role,
  'aria-label': ariaLabel,
  onKeyDown,
  inline = false,
}: FloatingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const presence = usePresence(open);
  const [place, setPlace] = useState<Placement | null>(null);
  const dismiss = useRef(onDismiss);
  useLayoutEffect(() => {
    dismiss.current = onDismiss;
  });

  const mounted = presence !== 'closed';
  // O hospedeiro sai no mesmo render da abertura: o conteúdo (busca, opção ativa) já existe quando
  // os efeitos de quem abriu rodam. Dentro de um diálogo, fica na camada do topo para aparecer.
  const anchorNow = mounted && !inline ? anchorRef.current : null;
  const host = anchorNow
    ? portal
      ? (anchorNow.closest('dialog[open]') ?? anchorNow.closest('[data-ds-v3]') ?? document.body)
      : anchorNow.parentElement
    : null;

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const pop = ref.current;
    if (!open || !host || !anchor || !pop) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (anchorHidden(anchor)) {
        dismiss.current();
        return;
      }
      const a = anchor.getBoundingClientRect();
      const box = scrollArea(anchor);
      const vw = box.right;
      const natural = Math.min(maxHeight, pop.scrollHeight);
      const below = box.bottom - a.bottom - GAP - EDGE;
      const above = a.top - box.top - GAP - EDGE;
      const side = natural <= below || below >= above ? 'below' : 'above';
      const room = Math.max(120, side === 'below' ? below : above);
      const height = Math.min(natural, room);
      const floor = Math.min(Math.max(a.width, minWidth), vw - EDGE * 2);
      if (width === 'fit') {
        // `width: max-content` no CSS, preso entre o gatilho e `fitMax` (o mínimo vence o máximo).
        pop.style.minWidth = `${floor}px`;
        pop.style.maxWidth = `${Math.max(floor, Math.min(fitMax, vw - EDGE * 2))}px`;
      }
      const w =
        width === 'anchor'
          ? floor
          : width === 'fit'
            ? pop.offsetWidth
            : Math.min(pop.offsetWidth, vw - EDGE * 2);
      // Mais largo que o gatilho e sem espaço à direita: alinha pela borda direita dele.
      const left = a.left + w > vw - EDGE ? Math.max(EDGE, a.right - w) : a.left;
      const next: Placement = {
        side,
        top: side === 'below' ? a.bottom + GAP : a.top - GAP - height,
        left: Math.max(EDGE, Math.min(left, vw - w - EDGE)),
        width: width === 'anchor' ? Math.round(w) : undefined,
        maxHeight: Math.floor(Math.min(maxHeight, room)),
      };
      // Já no lugar antes dos efeitos de quem abriu (foco na busca, rolar até a opção): um painel
      // ainda escondido não recebe foco.
      Object.assign(pop.style, {
        top: `${next.top}px`,
        left: `${next.left}px`,
        width: next.width ? `${next.width}px` : '',
        maxHeight: `${next.maxHeight}px`,
        visibility: '',
      });
      pop.dataset.side = next.side;
      setPlace((prev) =>
        prev &&
        prev.top === next.top &&
        prev.left === next.left &&
        prev.side === next.side &&
        prev.width === next.width &&
        prev.maxHeight === next.maxHeight
          ? prev
          : next,
      );
    };
    const schedule = (event?: Event) => {
      if (event?.target instanceof Node && pop.contains(event.target)) return;
      if (!frame) frame = requestAnimationFrame(update);
    };
    // O portal sai da camada do gatilho: dentro de uma camada fixa mais alta que o popover (a
    // gaveta do menu até 1199 px), o painel sobe um degrau acima dela em vez de abrir por baixo.
    const base = Number.parseInt(getComputedStyle(pop).zIndex, 10) || 0;
    let over = 0;
    for (let node = anchor.parentElement; node && node !== host; node = node.parentElement) {
      const z = Number.parseInt(getComputedStyle(node).zIndex, 10);
      if (z > over) over = z;
    }
    pop.style.zIndex = over >= base ? String(over + 1) : '';
    update();
    const observer = new ResizeObserver(() => schedule());
    observer.observe(pop);
    observer.observe(anchor);
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
    };
  }, [open, host, anchorRef, width, minWidth, fitMax, maxHeight]);

  useEffect(() => {
    // Painel parado de prancha: não fecha com clique fora.
    if (!open || inline) return;
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (ref.current?.contains(target) || anchorRef.current?.contains(target)) return;
      dismiss.current();
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [open, inline, anchorRef]);

  if (inline) {
    return (
      <div
        id={id}
        role={role}
        aria-label={ariaLabel}
        className={`${s.panel} ${className}`}
        data-inline
        style={{ maxHeight, minWidth }}
        onKeyDown={onKeyDown}
      >
        {children}
      </div>
    );
  }
  if (!mounted || !host) return null;
  const style: CSSProperties = place
    ? { top: place.top, left: place.left, width: place.width, maxHeight: place.maxHeight }
    : { top: -9999, left: -9999, visibility: 'hidden' };
  const panel = (
    <div
      ref={ref}
      id={id}
      role={role}
      aria-label={ariaLabel}
      className={`${s.panel} ${className}`}
      data-side={place?.side ?? 'below'}
      data-state={presence}
      data-fit={width === 'fit' || undefined}
      style={style}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  );
  return portal ? createPortal(panel, host) : panel;
}

/**
 * Ref de lista com rolagem: marca `data-more` enquanto há conteúdo abaixo — o CSS esmaece o fim
 * (a única máscara permitida). Acompanha rolagem, tamanho e troca de opções.
 */
export function fadeRef(el: HTMLElement | null) {
  if (!el) return;
  const sync = () =>
    el.toggleAttribute('data-more', el.scrollHeight - el.scrollTop - el.clientHeight > 2);
  sync();
  const resize = new ResizeObserver(sync);
  resize.observe(el);
  const mutation = new MutationObserver(sync);
  mutation.observe(el, { childList: true, subtree: true });
  el.addEventListener('scroll', sync, { passive: true });
  return () => {
    resize.disconnect();
    mutation.disconnect();
    el.removeEventListener('scroll', sync);
  };
}

/* ——— Peças compartilhadas do painel ——— */

/** Busca sem caixa no topo do painel: ícone, texto e limpar, com fio embaixo. */
export function PanelSearch({
  value,
  onValueChange,
  placeholder = 'Buscar…',
  label = 'Filtrar opções',
  inputRef,
  ...aria
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  'aria-controls'?: string;
  'aria-activedescendant'?: string;
}) {
  return (
    <div className={s.search}>
      <Search aria-hidden="true" />
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded="true"
        aria-autocomplete="list"
        aria-label={label}
        autoComplete="off"
        spellCheck={false}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onValueChange(event.target.value)}
        {...aria}
      />
      {value && (
        <button
          type="button"
          className={s.searchClear}
          aria-label="Limpar busca"
          tabIndex={-1}
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => {
            onValueChange('');
            inputRef?.current?.focus();
          }}
        >
          <X aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/** Três linhas de esqueleto com a geometria das opções. */
export function OptionSkeleton({ label = 'Carregando opções' }: { label?: string }) {
  return (
    <div className={s.skeleton} role="status" aria-label={label}>
      {[62, 44, 54].map((width) => (
        <span key={width} className={s.skeletonRow} aria-hidden="true">
          <span style={{ width: `${width}%` }} />
        </span>
      ))}
    </div>
  );
}

/** Spinner de campo (14 px), visível só depois de 300 ms. */
export function FieldSpinner() {
  return <LoaderCircle className={s.spinner} aria-hidden="true" />;
}

/** Destaca o trecho buscado no rótulo, sem diferenciar acentos nem caixa. */
export function Highlight({ text, query }: { text: string; query: string }) {
  const term = fold(query.trim());
  if (!term) return <>{text}</>;
  const index = fold(text).indexOf(term);
  if (index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className={s.mark}>{text.slice(index, index + term.length)}</mark>
      {text.slice(index + term.length)}
    </>
  );
}

/** Texto sem acento e em minúsculas, com o mesmo comprimento (para destacar por índice). */
export function fold(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function matches(option: SelectOption, query: string) {
  const term = fold(query.trim());
  return !term || fold(`${option.label} ${option.description ?? ''}`).includes(term);
}

/** Classes do painel para os outros seletores (opção, lista, rodapé, vazio). */
export const selectStyles = s;

/* ——— Select ——— */

export type SelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  /** Busca dentro do painel (listas longas). Para o campo que já é a busca, use `Combobox`. */
  searchable?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  /** Opções a caminho: spinner no campo e esqueleto no painel. */
  loading?: boolean;
  size?: 'sm' | 'md';
  describedBy?: string;
  /** Nome acessível quando não há <label for>. */
  label?: string;
  emptyText?: string;
  /** Prancha: estado parado (`hover`, `active`, `focus`). */
  'data-force'?: string;
};

/**
 * Seleção única em lista (combobox só-seleção do APG). O foco fica no gatilho; a opção ativa vem
 * por `aria-activedescendant`. ↑↓ percorrem, Home/End vão às pontas, digitar salta para a opção,
 * Enter escolhe, Escape fecha e devolve o foco. Com `searchable`, a busca recebe o foco.
 */
export function Select({
  id,
  value,
  onChange,
  options,
  placeholder = 'Selecione',
  searchable = false,
  invalid,
  disabled,
  loading = false,
  size = 'md',
  describedBy,
  label,
  emptyText = 'Nada encontrado.',
  'data-force': force,
}: SelectProps) {
  const pinned = forcedOpen(force);
  const [openState, setOpen] = useState(false);
  const open = openState || pinned;
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(() =>
    pinned
      ? Math.max(
          0,
          options.findIndex((option) => option.value === value),
        )
      : -1,
  );
  const baseId = useId();
  const listId = `${baseId}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const reveal = useRef(false);
  const typed = useRef({ text: '', at: 0 });

  const selected = options.find((option) => option.value === value);
  const visible = useMemo(
    () => (searchable ? options.filter((option) => matches(option, query)) : options),
    [options, query, searchable],
  );
  const optionId = (index: number) => `${baseId}-opt-${index}`;
  const activeId =
    open && !loading && active >= 0 && active < visible.length ? optionId(active) : undefined;

  useEffect(() => {
    if (!open || !reveal.current) return;
    reveal.current = false;
    if (activeId) document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' });
  }, [open, activeId]);

  useEffect(() => {
    if (openState && searchable) searchRef.current?.focus({ preventScroll: true });
  }, [openState, searchable]);

  function show(at?: number) {
    if (disabled) return;
    const current = options.findIndex((option) => option.value === value);
    reveal.current = true;
    setActive(at ?? (current >= 0 ? current : 0));
    setQuery('');
    setOpen(true);
  }
  function close(restore = true) {
    setOpen(false);
    if (restore) triggerRef.current?.focus({ preventScroll: true });
  }
  function choose(option: SelectOption | undefined) {
    if (!option || option.disabled) return;
    onChange(option.value);
    close();
  }
  function go(index: number) {
    if (!visible.length) return;
    reveal.current = true;
    setActive(Math.max(0, Math.min(visible.length - 1, index)));
  }
  /** Digitar salta para a próxima opção que começa pelo texto; repetir a letra percorre as iguais. */
  function typeahead(char: string) {
    const now = Date.now();
    const buffer = now - typed.current.at > 600 ? char : typed.current.text + char;
    typed.current = { text: buffer, at: now };
    const same = buffer.split('').every((letter) => letter === buffer[0]);
    const term = fold(same ? char : buffer);
    // Letra nova (ou repetida) procura a partir da próxima; palavra em curso pode ficar na atual.
    const start = open ? active + (same ? 1 : 0) : options.findIndex((o) => o.value === value) + 1;
    const list = open ? visible : options;
    for (let step = 0; step < list.length; step += 1) {
      const index = (Math.max(0, start) + step) % list.length;
      if (fold(list[index]?.label ?? '').startsWith(term)) {
        if (open) go(index);
        else show(index);
        return;
      }
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    const { key } = event;
    if (!open) {
      if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === ' ') {
        event.preventDefault();
        show();
      } else if (key === 'Home' || key === 'End') {
        event.preventDefault();
        show(key === 'Home' ? 0 : options.length - 1);
      } else if (key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
        typeahead(key);
      }
      return;
    }
    if (key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (key === 'ArrowDown') {
      event.preventDefault();
      go(active + 1);
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      go(active - 1);
    } else if ((key === 'Home' || key === 'End') && !searchable) {
      event.preventDefault();
      go(key === 'Home' ? 0 : visible.length - 1);
    } else if (key === 'PageDown' || key === 'PageUp') {
      event.preventDefault();
      go(active + (key === 'PageDown' ? 8 : -8));
    } else if (key === 'Enter' || (key === ' ' && !searchable)) {
      event.preventDefault();
      choose(visible[active]);
    } else if (key === 'Tab') {
      close(false);
    } else if (
      !searchable &&
      key.length === 1 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      typeahead(key);
    }
  }

  return (
    <div ref={rootRef} className={s.root} onKeyDown={onKeyDown}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={s.trigger}
        data-size={size}
        data-invalid={invalid || undefined}
        data-force={force}
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={searchable ? undefined : activeId}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-busy={loading || undefined}
        aria-label={label}
        onClick={() => (open ? close() : show())}
      >
        <span className={s.value}>
          {selected ? (
            <>
              {selected.leading && <span className={s.lead}>{selected.leading}</span>}
              <span className={s.valueText}>{selected.label}</span>
            </>
          ) : (
            <span className={`${s.valueText} ${s.placeholder}`}>{placeholder}</span>
          )}
        </span>
        {loading ? <FieldSpinner /> : <ChevronDown className={s.chevron} aria-hidden="true" />}
      </button>
      <Floating
        anchorRef={triggerRef}
        open={open}
        inline={pinned}
        onDismiss={() => close(false)}
        width="fit"
        minWidth={size === 'sm' ? 200 : 220}
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
        {loading ? (
          <OptionSkeleton />
        ) : (
          <ul
            ref={fadeRef}
            id={listId}
            role="listbox"
            className={s.list}
            data-size={size}
            aria-label={label}
            aria-labelledby={label ? undefined : id}
          >
            {visible.length === 0 && (
              <li className={s.empty} role="presentation">
                {emptyText}
              </li>
            )}
            {visible.map((option, index) => (
              <li
                key={option.value}
                id={optionId(index)}
                role="option"
                aria-selected={option.value === value}
                aria-disabled={option.disabled || undefined}
                data-active={index === active || undefined}
                className={s.option}
                onPointerMove={() => {
                  if (index !== active) setActive(index);
                }}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
              >
                {option.leading && <span className={s.lead}>{option.leading}</span>}
                <span className={s.optionText}>
                  <span className={s.optionLabel}>
                    {searchable ? <Highlight text={option.label} query={query} /> : option.label}
                  </span>
                  {option.description && <small>{option.description}</small>}
                </span>
                <Check className={s.check} aria-hidden="true" />
              </li>
            ))}
          </ul>
        )}
      </Floating>
    </div>
  );
}
