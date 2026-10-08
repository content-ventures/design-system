'use client';

/*
 * EditableTitle (grupo editor): título que se edita no lugar — nome da produção, título do artigo,
 * do slide, do template. Em repouso é um título de verdade (h1–h4) com um botão dentro; hover mostra
 * o fio de campo (`--line-hover`) e o lápis. Clique, Enter ou Espaço abrem a edição com o texto todo
 * selecionado e o anel de campo; o texto não muda de lugar (mesmo tipo, mesmo respiro).
 *
 * Teclado: Enter salva · Esc desfaz e volta · sair do campo salva · o foco volta ao título depois de
 * Enter/Esc. Quebra de linha não existe (colar com quebras vira espaço). Vazio não salva: volta ao
 * valor anterior. Igual ao anterior não chama `onCommit`.
 *
 * Controlado: `value` é o título salvo; o rascunho vive aqui só enquanto edita (`onChange` acompanha
 * cada tecla, se precisar). `editing` + `onEditingChange` controlam a edição de fora;
 * `defaultEditing` abre já editando (com `autoFocus`, recebe o foco).
 * Estados: repouso, hover, pressionado, foco, editando, perto do limite (`Counter` a partir de 80% de
 * `maxLength`), inválido (`error`), salvando (`saving`: spinner no lugar do lápis, `aria-busy`),
 * vazio (`placeholder` em `--subtle`) e somente leitura (`readOnly`: só o título).
 * Tamanhos: `page` 24/32 (22 em ≤760) · `document` 28/36 do artigo (24/32 quando a coluna tem ≤560) ·
 * `card` 14/20.
 */

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type KeyboardEvent,
} from 'react';
import { VisuallyHidden } from './a11y';
import { Spinner } from './feedback';
import { Counter } from './fields';
import { CircleAlert, Pencil } from './icons';
import s from './editable-title.module.css';

export type EditableTitleSize = 'page' | 'document' | 'card';
export type EditableTitleLevel = 'h1' | 'h2' | 'h3' | 'h4';

export type EditableTitleProps = Omit<
  ComponentProps<'div'>,
  'onChange' | 'children' | 'defaultValue' | 'title' | 'autoFocus'
> & {
  /** Título salvo. */
  value: string;
  /** Enter ou saída do campo com texto novo (já sem espaços sobrando). */
  onCommit: (value: string) => void;
  /** Rascunho a cada tecla; no Esc recebe de volta o valor do início da edição. */
  onChange?: (draft: string) => void;
  /** Esc: a edição foi descartada. */
  onCancel?: () => void;
  /** Nome do campo para leitor de tela (“Título do artigo”). */
  label: string;
  size?: EditableTitleSize;
  /** Nível do título em repouso. Padrão: h1 em `page`/`document`, h3 em `card`. */
  as?: EditableTitleLevel;
  /** Texto em `--subtle` quando não há título. */
  placeholder?: string;
  /** Limite de caracteres; o contador aparece a partir de 80%. */
  maxLength?: number;
  readOnly?: boolean;
  /** Salvando: spinner depois do título e `aria-busy`. */
  saving?: boolean;
  /** Mensagem de erro sob o título; o campo fica inválido. */
  error?: string;
  /** Edição controlada. */
  editing?: boolean;
  defaultEditing?: boolean;
  onEditingChange?: (editing: boolean) => void;
  /** Com `defaultEditing`, recebe o foco ao montar. */
  autoFocus?: boolean;
  /** Estado parado para pranchas (`hover`, `active`, `focus`). Nunca no produto. */
  'data-force'?: string;
};

const SPINNER = { page: 16, document: 20, card: 14 } as const;
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Uma linha só: quebras viram espaço. */
const singleLine = (text: string) => text.replace(/[\r\n]+/g, ' ');
const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

/** Última palavra presa ao lápis/spinner: o ícone nunca desce sozinho para a linha de baixo. */
function splitTail(text: string) {
  const at = text.trimEnd().lastIndexOf(' ');
  return at < 0 ? ['', text] : [text.slice(0, at + 1), text.slice(at + 1)];
}

export function EditableTitle({
  value,
  onCommit,
  onChange,
  onCancel,
  label,
  size = 'page',
  as,
  placeholder = 'Sem título',
  maxLength,
  readOnly = false,
  saving = false,
  error,
  editing: editingProp,
  defaultEditing = false,
  onEditingChange,
  autoFocus = false,
  className = '',
  'data-force': force,
  ...props
}: EditableTitleProps) {
  const [innerEditing, setInnerEditing] = useState(defaultEditing);
  const editing = !readOnly && (editingProp ?? innerEditing);
  const [draft, setDraft] = useState(value);
  const [initial, setInitial] = useState(value);
  const [wasEditing, setWasEditing] = useState(editing);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const focusField = useRef(autoFocus);
  const focusTrigger = useRef(false);
  /** Enter/Esc já resolveram esta edição: o blur da saída não salva de novo. */
  const settled = useRef(false);
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const Heading = as ?? (size === 'card' ? 'h3' : 'h1');

  /* Abriu a edição (por dentro ou por fora): o rascunho parte do valor salvo. */
  if (editing !== wasEditing) {
    setWasEditing(editing);
    if (editing) {
      setDraft(value);
      setInitial(value);
    }
  }

  const setEditing = (next: boolean) => {
    if (editingProp === undefined) setInnerEditing(next);
    onEditingChange?.(next);
  };

  const start = () => {
    settled.current = false;
    focusField.current = true;
    setEditing(true);
  };

  const finish = (mode: 'commit' | 'cancel', refocus: boolean) => {
    if (settled.current) return;
    settled.current = true;
    if (mode === 'commit') {
      const next = draft.replace(/\s+/g, ' ').trim();
      if (next && next !== initial) onCommit(next);
      else if (!next && draft !== initial) onChange?.(initial);
    } else {
      if (draft !== initial) onChange?.(initial);
      onCancel?.();
    }
    focusTrigger.current = refocus;
    setEditing(false);
  };

  useIsoLayoutEffect(() => {
    if (editing) {
      settled.current = false;
      if (focusField.current) {
        focusField.current = false;
        fieldRef.current?.focus();
        fieldRef.current?.select();
      }
    } else if (focusTrigger.current) {
      focusTrigger.current = false;
      triggerRef.current?.focus();
    }
  }, [editing]);

  /* Altura acompanha o texto (o título quebra linha como em repouso); refaz se a largura mudar. */
  useIsoLayoutEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    const fit = () => {
      field.style.height = 'auto';
      field.style.height = `${field.scrollHeight + field.offsetHeight - field.clientHeight}px`;
    };
    fit();
    if (typeof ResizeObserver === 'undefined') return;
    let width = field.clientWidth;
    const observer = new ResizeObserver(() => {
      if (field.clientWidth === width) return;
      width = field.clientWidth;
      fit();
    });
    observer.observe(field);
    return () => observer.disconnect();
  }, [draft, editing]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    settled.current = false;
    const next = singleLine(event.target.value);
    setDraft(next);
    onChange?.(next);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      finish('commit', true);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      finish('cancel', true);
    }
  };

  const counterMax =
    editing && maxLength !== undefined && draft.length >= Math.ceil(maxLength * 0.8)
      ? maxLength
      : undefined;
  const shown = value || placeholder;
  const [head, tail] = splitTail(shown);
  const describedBy = [hintId, error ? errorId : ''].filter(Boolean).join(' ');

  const indicator = saving ? (
    <Spinner size={SPINNER[size]} tone="muted" label="Salvando" className={s.spinner} />
  ) : readOnly ? null : (
    <Pencil className={s.pencil} aria-hidden="true" />
  );

  const text = (
    <>
      {head && <span className={s.text}>{head}</span>}
      <span className={s.tail}>
        <span className={s.text}>{tail}</span>
        {indicator}
      </span>
    </>
  );

  return (
    <div
      {...props}
      className={`${s.root} ${className}`}
      data-size={size}
      data-editing={editing || undefined}
      data-readonly={readOnly || undefined}
      data-invalid={error ? true : undefined}
      data-empty={!value || undefined}
      aria-busy={saving || undefined}
    >
      {editing ? (
        <div className={s.field}>
          <textarea
            ref={fieldRef}
            className={s.input}
            rows={1}
            value={draft}
            maxLength={maxLength}
            placeholder={placeholder}
            aria-label={label}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            enterKeyHint="done"
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              settled.current = false;
            }}
            onBlur={() => finish('commit', false)}
          />
        </div>
      ) : readOnly ? (
        <Heading className={s.heading}>
          <span className={s.static}>{text}</span>
        </Heading>
      ) : (
        <Heading className={s.heading}>
          <button
            ref={triggerRef}
            type="button"
            className={s.trigger}
            onClick={start}
            aria-describedby={describedBy}
            data-force={force}
          >
            {text}
          </button>
        </Heading>
      )}
      {!readOnly && !editing && (
        <VisuallyHidden id={hintId}>{`Editar ${lowerFirst(label)}`}</VisuallyHidden>
      )}
      {(error || counterMax !== undefined) && (
        <div className={s.note}>
          {error && (
            <p id={errorId} className={s.error}>
              <CircleAlert aria-hidden="true" />
              <span>{error}</span>
            </p>
          )}
          {counterMax !== undefined && (
            <span className={s.counter}>
              <Counter value={draft.length} max={counterMax} />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
