'use client';

import {
  CircleAlert,
  CircleCheck,
  Info,
  LoaderCircle,
  Search,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type ChangeEvent,
  type Ref,
} from 'react';
import { Kbd } from './badge';
import { Tooltip } from './overlays';
import s from './fields.module.css';

/** Liga um nó a uma ref recebida por prop (função ou objeto). */
export function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === 'function') ref(node);
  else if (ref) (ref as { current: T | null }).current = node;
}

/* ——— Nota do campo: ajuda, aviso ou erro, sempre no mesmo lugar ——— */

/**
 * Uma linha sob o controle. Prioridade: erro > aviso > ajuda. Entra crescendo (altura + opacidade,
 * 180 ms); trocar ajuda por erro acontece no lugar, sem pulo. `reserve` guarda uma linha mesmo vazia.
 */
function FieldNote({
  id,
  error,
  notice,
  hint,
  reserve,
}: {
  id: string;
  error?: ReactNode;
  notice?: ReactNode;
  hint?: ReactNode;
  reserve?: boolean;
}) {
  const kind = error ? 'error' : notice ? 'notice' : hint ? 'hint' : undefined;
  return (
    <div className={s.note} data-open={kind ? true : undefined} data-reserve={reserve || undefined}>
      <div className={s.noteInner}>
        {kind === 'error' && (
          <p key="error" id={id} className={s.error}>
            <CircleAlert aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}
        {kind === 'notice' && (
          <p key="notice" id={id} className={s.notice} role="status">
            {notice}
          </p>
        )}
        {kind === 'hint' && (
          <p key="hint" id={id} className={s.hint}>
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Rótulo acima, ajuda abaixo, erro no lugar da ajuda. O `id` do controle vem de `children` como
 * função, para associar rótulo e descrição sem adivinhação.
 */
export function Field({
  label,
  required,
  optional,
  meta,
  hint,
  notice,
  error,
  reserveHint,
  className = '',
  children,
  id: idProp,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  /** À direita do rótulo: contagem, ação curta. */
  meta?: ReactNode;
  /** Regra ou dado (“Múltiplos de R$ 45,00”), nunca explicação da tela. */
  hint?: ReactNode;
  /** Aviso passageiro em âmbar (“Ajustado para 100%”); substitui a ajuda. */
  notice?: ReactNode;
  error?: string;
  /** Guarda uma linha para ajuda/erro: o erro chega sem empurrar o que vem embaixo. */
  reserveHint?: boolean;
  className?: string;
  id?: string;
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}) {
  const auto = useId();
  const id = idProp ?? auto;
  const descId = `${id}-desc`;
  const describedBy = error || notice || hint ? descId : undefined;
  return (
    <div className={`${s.field} ${className}`} data-invalid={error ? true : undefined}>
      <div className={s.labelRow}>
        <label htmlFor={id} className={s.label}>
          {label}
          {required && (
            <span className={s.required} aria-hidden="true">
              *
            </span>
          )}
          {optional && <span className={s.optional}>Opcional</span>}
        </label>
        {meta && <span className={s.meta}>{meta}</span>}
      </div>
      {children({ id, describedBy, invalid: Boolean(error) })}
      <FieldNote id={descId} error={error} notice={notice} hint={hint} reserve={reserveHint} />
    </div>
  );
}

/**
 * Grupo de campos com um rótulo só (“Período de veiculação · 27 dias”). Nível 13/600 acima do
 * rótulo de campo (12/500). A ajuda e o erro do grupo ficam embaixo de todos os campos.
 */
export function FieldGroup({
  label,
  meta,
  required,
  hint,
  notice,
  error,
  columns,
  className = '',
  children,
}: {
  label: string;
  meta?: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  notice?: ReactNode;
  error?: string;
  /** Grade dos campos do grupo (gap 16). Sem valor, os filhos se arrumam sozinhos. */
  columns?: 1 | 2 | 3;
  className?: string;
  children: ReactNode;
}) {
  const id = useId();
  const labelId = `${id}-label`;
  const descId = `${id}-desc`;
  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-describedby={error || notice || hint ? descId : undefined}
      className={`${s.group} ${className}`}
      data-invalid={error ? true : undefined}
    >
      <div className={s.groupHead}>
        <span id={labelId} className={s.groupLabel}>
          {label}
          {required && (
            <span className={s.required} aria-hidden="true">
              *
            </span>
          )}
        </span>
        {meta && <span className={s.groupMeta}>{meta}</span>}
      </div>
      <div className={s.groupBody} data-columns={columns}>
        {children}
      </div>
      <FieldNote id={descId} error={error} notice={notice} hint={hint} />
    </div>
  );
}

/** Contagem de caracteres: cinza → âmbar a partir de 90% → vermelho no limite. */
export function Counter({ value, max }: { value: number; max: number }) {
  const tone = value >= max ? 'limit' : value >= max * 0.9 ? 'warn' : undefined;
  return (
    <span className={s.counter} data-tone={tone}>
      {value}/{max}
    </span>
  );
}

/** Aviso que some sozinho (padrão 3 s): `[aviso, mostrar]`. Para “Ajustado para 100%”. */
export function useNotice(duration = 3000) {
  const [notice, setNotice] = useState<ReactNode>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const show = useCallback(
    (next: ReactNode) => {
      window.clearTimeout(timer.current);
      setNotice(next);
      if (next) timer.current = window.setTimeout(() => setNotice(null), duration);
    },
    [duration],
  );
  return [notice, show] as const;
}

/* ——— Controle ——— */

export type InputProps = Omit<ComponentProps<'input'>, 'size' | 'prefix'> & {
  icon?: LucideIcon;
  /** Nó à esquerda no lugar do ícone (ex.: lupa que vira spinner). */
  leading?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  trailing?: ReactNode;
  invalid?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** `quiet`: sem fio, para busca do menu lateral. `well`: rebaixado, só sobre faixa cinza. */
  variant?: 'paper' | 'well' | 'quiet';
  /** Validação assíncrona: spinner à direita, depois o check verde. */
  status?: 'loading' | 'valid';
};

export function Input({
  icon: Icon,
  leading,
  prefix,
  suffix,
  trailing,
  invalid,
  status,
  size = 'md',
  variant = 'paper',
  className = '',
  ...props
}: InputProps) {
  return (
    <div
      className={`${s.control} ${className}`}
      data-size={size}
      data-variant={variant}
      data-invalid={invalid || undefined}
      data-disabled={props.disabled || undefined}
      data-readonly={(props.readOnly && !props.disabled) || undefined}
    >
      {leading ?? (Icon && <Icon className={s.lead} aria-hidden="true" />)}
      {prefix && (
        <span className={s.affix} data-kind="prefix">
          {prefix}
        </span>
      )}
      <input
        {...props}
        aria-invalid={invalid || undefined}
        aria-busy={status === 'loading' || props['aria-busy'] || undefined}
      />
      {suffix && (
        <span className={s.affix} data-kind="suffix">
          {suffix}
        </span>
      )}
      {status && (
        <span className={s.status} data-status={status} role="status">
          {status === 'loading' ? (
            <LoaderCircle key="loading" className={s.spin} aria-hidden="true" />
          ) : (
            <CircleCheck key="valid" aria-hidden="true" />
          )}
          <span className={s.srOnly}>{status === 'loading' ? 'Validando' : 'Válido'}</span>
        </span>
      )}
      {trailing}
    </div>
  );
}

/**
 * Botão de ícone dentro do controle (mostrar senha, copiar, ±). Ocupa a altura do campo menos 8 px,
 * fica a 4 px da borda e herda o raio concêntrico. Ícone troca com um esmaecer curto.
 */
export function ControlButton({
  label,
  tip,
  icon: Icon,
  className = '',
  ...props
}: Omit<ComponentProps<'button'>, 'children' | 'aria-label'> & {
  label: string;
  /** Texto da dica quando difere do nome (ex.: alternância “Ocultar senha”). `false` tira a dica. */
  tip?: string | false;
  icon: LucideIcon;
}) {
  // O ícone só anima quando troca (olho ↔ olho cortado, copiar → check), nunca ao montar.
  const iconKey = Icon.displayName ?? label;
  const [seen, setSeen] = useState(iconKey);
  const [swapped, setSwapped] = useState(false);
  if (seen !== iconKey) {
    setSeen(iconKey);
    setSwapped(true);
  }
  const button = (
    <button
      type="button"
      {...props}
      aria-label={label}
      className={`${s.ctlBtn} ${className}`}
      data-swapped={swapped || undefined}
      onMouseDown={(event) => {
        // O clique não tira o foco do campo (mostrar senha, ±, copiar).
        event.preventDefault();
        props.onMouseDown?.(event);
      }}
    >
      <Icon key={iconKey} aria-hidden="true" />
    </button>
  );
  if (tip === false) return button;
  return <Tooltip content={tip ?? label}>{button}</Tooltip>;
}

/** Marca quando a área com rolagem chegou ao fim (o esmaecimento some). */
function markEnd(el: HTMLTextAreaElement) {
  el.parentElement?.toggleAttribute(
    'data-end',
    el.scrollTop + el.clientHeight >= el.scrollHeight - 2,
  );
}

export type TextareaProps = ComponentProps<'textarea'> & {
  invalid?: boolean;
  /** Altura acompanha o texto (entre `minRows` e `maxRows`, padrão 3–8); depois rola. */
  autoSize?: boolean | { minRows?: number; maxRows?: number };
};

export function Textarea({
  invalid,
  maxLength,
  value,
  defaultValue,
  onChange,
  rows = 4,
  autoSize,
  ref,
  className = '',
  ...props
}: TextareaProps) {
  const inner = useRef<HTMLTextAreaElement | null>(null);
  const [typed, setTyped] = useState(String(defaultValue ?? '').length);
  const length = value !== undefined ? String(value ?? '').length : typed;
  const sizing = Boolean(autoSize);
  const bounds = typeof autoSize === 'object' ? autoSize : undefined;
  const minRows = sizing ? (bounds?.minRows ?? Math.min(rows, 3)) : rows;
  const maxRows = sizing ? Math.max(minRows, bounds?.maxRows ?? 8) : rows;

  const fit = useCallback(() => {
    const el = inner.current;
    if (!el || !sizing) return;
    const style = getComputedStyle(el);
    const line = parseFloat(style.lineHeight) || 20;
    const pad = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const min = minRows * line + pad;
    const max = maxRows * line + pad;
    const from = el.style.height;
    // Mede sem transição e volta à altura atual; só então anima até a nova (120 ms).
    el.style.transition = 'none';
    el.style.height = '0px';
    const natural = el.scrollHeight;
    const next = Math.min(max, Math.max(min, natural));
    el.style.overflowY = natural > max ? 'auto' : 'hidden';
    // Passou do máximo: esmaece o fim enquanto houver texto abaixo (única exceção ao chapado).
    el.parentElement?.toggleAttribute('data-overflow', natural > max);
    markEnd(el);
    el.style.height = from || `${next}px`;
    void el.offsetHeight;
    el.style.transition = '';
    el.style.height = `${next}px`;
    // Crescendo, o navegador rola para mostrar o cursor durante a transição; no fim, volta ao topo.
    if (natural <= max) {
      el.addEventListener(
        'transitionend',
        () => {
          if (el.scrollHeight <= el.clientHeight + 1) el.scrollTop = 0;
        },
        { once: true },
      );
    }
  }, [sizing, minRows, maxRows]);

  useLayoutEffect(() => {
    fit();
  }, [fit, value]);

  const tone = maxLength
    ? length >= maxLength
      ? 'limit'
      : length >= maxLength * 0.9
        ? 'warn'
        : undefined
    : undefined;

  return (
    <div
      className={`${s.control} ${s.area} ${className}`}
      data-invalid={invalid || undefined}
      data-disabled={props.disabled || undefined}
      data-readonly={(props.readOnly && !props.disabled) || undefined}
      data-autosize={sizing ? true : undefined}
    >
      <textarea
        {...props}
        ref={(node) => {
          inner.current = node;
          assignRef(ref, node);
        }}
        rows={minRows}
        value={value}
        defaultValue={defaultValue}
        maxLength={maxLength}
        aria-invalid={invalid || undefined}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
          setTyped(event.target.value.length);
          onChange?.(event);
          if (value === undefined) fit();
        }}
        onScroll={(event) => {
          if (sizing) markEnd(event.currentTarget);
          props.onScroll?.(event);
        }}
      />
      {maxLength && (
        <span className={s.areaFoot} data-tone={tone} aria-hidden="true">
          {length}/{maxLength}
        </span>
      )}
    </div>
  );
}

/** Busca com atalho visível, limpeza do termo e estado de busca em andamento. */
export function SearchField({
  value,
  onValueChange,
  shortcut,
  hotkey,
  loading = false,
  label = 'Buscar',
  placeholder = 'Buscar…',
  size = 'md',
  ref,
  ...props
}: Omit<InputProps, 'value' | 'onChange' | 'icon' | 'leading' | 'status'> & {
  value: string;
  onValueChange: (value: string) => void;
  /** Tecla mostrada no campo vazio (ex.: “/”). */
  shortcut?: string;
  /** Tecla que leva o foco à busca quando ninguém está digitando (ex.: “/”). */
  hotkey?: string;
  /** Resultado a caminho: a lupa vira spinner depois de 300 ms. */
  loading?: boolean;
  label?: string;
}) {
  const inner = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (!hotkey) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== hotkey || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || target?.closest('input, textarea, select, [role="textbox"]'))
        return;
      const input = inner.current;
      if (!input || input.disabled) return;
      event.preventDefault();
      input.focus();
      input.select();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hotkey]);

  return (
    <Input
      {...props}
      ref={(node) => {
        inner.current = node;
        assignRef(ref, node);
      }}
      size={size}
      type="search"
      leading={
        <span className={s.glyph} data-loading={loading || undefined} aria-hidden="true">
          <Search className={s.glyphIdle} />
          {loading && <LoaderCircle className={s.glyphBusy} />}
        </span>
      }
      value={value}
      aria-label={label}
      aria-busy={loading || undefined}
      placeholder={placeholder}
      onChange={(event) => onValueChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && value) {
          event.preventDefault();
          onValueChange('');
        }
        props.onKeyDown?.(event);
      }}
      trailing={
        value
          ? !props.disabled && (
              <button
                type="button"
                className={s.clear}
                aria-label="Limpar busca"
                onClick={() => {
                  onValueChange('');
                  inner.current?.focus();
                }}
              >
                <X aria-hidden="true" />
              </button>
            )
          : shortcut &&
            !props.disabled && (
              <span className={s.kbdSlot}>
                <Kbd>{shortcut}</Kbd>
              </span>
            )
      }
    />
  );
}

/* ——— Destaque do termo buscado ——— */

const fold = (char: string) => char.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/**
 * Marca as ocorrências de `query` em `text`, sem diferenciar maiúsculas nem acentos
 * (“calcados” acha “Calçados”). Fundo b-100, tinta ink.
 */
export function Highlight({ text, query }: { text: string; query: string }) {
  const needle = fold(query.trim());
  if (!needle) return <>{text}</>;
  // Texto dobrado + mapa de volta para o índice original (acentos podem mudar o comprimento).
  let folded = '';
  const map: number[] = [];
  Array.from(text).forEach((char, index) => {
    const piece = fold(char);
    for (let i = 0; i < piece.length; i += 1) map.push(index);
    folded += piece;
  });
  const chars = Array.from(text);
  const parts: ReactNode[] = [];
  let cursor = 0;
  let from = folded.indexOf(needle);
  while (from !== -1) {
    const start = map[from] ?? 0;
    const end = (map[from + needle.length - 1] ?? start) + 1;
    if (start > cursor) parts.push(chars.slice(cursor, start).join(''));
    parts.push(
      <mark key={start} className={s.mark}>
        {chars.slice(start, end).join('')}
      </mark>,
    );
    cursor = end;
    from = folded.indexOf(needle, from + needle.length);
  }
  if (cursor < chars.length) parts.push(chars.slice(cursor).join(''));
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>{part}</Fragment>
      ))}
    </>
  );
}

export function HintIcon() {
  return <Info aria-hidden="true" />;
}
