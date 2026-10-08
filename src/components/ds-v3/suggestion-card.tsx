'use client';

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { useAnnouncer, VisuallyHidden } from './a11y';
import { Badge, type Tone } from './badge';
import { Button, IconButton } from './button';
import { DiffView, type DiffBlock } from './diff-view';
import { Progress, Skeleton, SkeletonText, Spinner } from './feedback';
import { Input } from './fields';
import {
  ArrowDownToLine,
  CircleAlert,
  Pencil,
  RefreshCcw,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  type LucideIcon,
} from './icons';
import { Tooltip } from './overlays';
import { ChoiceCard } from './selection';
import { MetaList, type MetaItem } from './surfaces';
import s from './suggestion-card.module.css';

/* ——————————————————————————— Tipos ——————————————————————————— */

/**
 * Ciclo de uma sugestão da IA. `stale`: o trecho alvo mudou antes da decisão (pede “Reaplicar”).
 * `applied`/`discarded` são o registro depois da decisão.
 */
export type SuggestionState = 'streaming' | 'ready' | 'stale' | 'applied' | 'discarded' | 'error';
/** `replace` troca o trecho (Aceitar) · `insert` acrescenta depois dele (Inserir abaixo). */
export type SuggestionMode = 'replace' | 'insert';
export type SuggestionFeedback = 'up' | 'down';

type Callbacks = {
  /** Aplica a proposta (⌘↵ / Ctrl+↵ com o foco dentro do componente). */
  onAccept?: () => void;
  /** Acrescenta a proposta depois do trecho. Em `mode="insert"` é a ação principal. */
  onInsert?: () => void;
  /** Descarta a sugestão (Esc com o foco dentro do componente). Enquanto gera, também interrompe. */
  onDiscard?: () => void;
  /** Gera outra proposta com o mesmo pedido. */
  onRetry?: () => void;
  /** `stale`: gera de novo sobre o trecho atual. Sem ela, “Reaplicar” chama `onRetry`. */
  onReapply?: () => void;
};

const STATUS: Partial<Record<SuggestionState, { tone: Tone; label: string }>> = {
  stale: { tone: 'amber', label: 'Trecho mudou' },
  applied: { tone: 'teal', label: 'Aplicada' },
  discarded: { tone: 'gray', label: 'Descartada' },
  error: { tone: 'red', label: 'Falhou' },
};

const SPOKEN: Partial<Record<SuggestionState, string>> = {
  ready: 'Sugestão pronta',
  stale: 'O trecho mudou. Reaplique a sugestão.',
  applied: 'Sugestão aplicada',
  discarded: 'Sugestão descartada',
  error: 'Não foi possível gerar a sugestão',
};

const OPEN_STATES: SuggestionState[] = ['streaming', 'ready', 'stale', 'error'];

/* ——————————————————————————— Internos ——————————————————————————— */

const noop = () => () => {};
const isApple = () => /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

/** “⌘↵” no Mac (e no servidor), “Ctrl ↵” nos demais — sem divergir na hidratação. */
function useAcceptKeys() {
  const apple = useSyncExternalStore(noop, isApple, () => true);
  return apple ? '⌘↵' : 'Ctrl ↵';
}

/** Anuncia a troca de estado (pronta, falhou, trecho mudou…) sem mover o foco. */
function useStateAnnouncement(state: SuggestionState) {
  const { announce, region } = useAnnouncer();
  const last = useRef(state);
  useEffect(() => {
    if (last.current === state) return;
    last.current = state;
    const text = SPOKEN[state];
    if (text) announce(text);
  }, [state, announce]);
  return region;
}

/**
 * Quando a decisão tira o botão focado da tela (Aceitar, Descartar), o foco volta para a raiz do
 * componente em vez de cair no `body`.
 */
function useFocusKeeper<T extends HTMLElement>(state: SuggestionState, ref: Ref<T> | undefined) {
  const root = useRef<T | null>(null);
  const inside = useRef(false);
  useEffect(() => {
    const node = root.current;
    if (!inside.current || !node) return;
    if (!node.contains(document.activeElement)) node.focus({ preventScroll: true });
  }, [state]);
  return {
    setRef(node: T | null) {
      root.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as { current: T | null }).current = node;
    },
    onFocus() {
      inside.current = true;
    },
    onBlur(event: { currentTarget: T; relatedTarget: EventTarget | null }) {
      if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) {
        inside.current = false;
      }
    },
  };
}

type Primary = { label: string; run: () => void; icon?: LucideIcon; blocked?: string };

/** A ação principal de cada estado (a que ⌘↵ dispara). */
function primaryOf(
  state: SuggestionState,
  mode: SuggestionMode,
  { onAccept, onInsert, onReapply, onRetry }: Callbacks,
  acceptLabel: string | undefined,
  blocked: string | undefined,
): Primary | null {
  if (state === 'stale') {
    const run = onReapply ?? onRetry;
    return run ? { label: 'Reaplicar', run } : null;
  }
  if (state !== 'ready' && state !== 'streaming') return null;
  const waiting = state === 'streaming' ? 'Aguarde a sugestão terminar' : blocked;
  if (mode === 'insert') {
    const run = onInsert ?? onAccept;
    return run
      ? { label: acceptLabel ?? 'Inserir abaixo', run, icon: ArrowDownToLine, blocked: waiting }
      : null;
  }
  return onAccept ? { label: acceptLabel ?? 'Aceitar', run: onAccept, blocked: waiting } : null;
}

function handleShortcut(
  event: KeyboardEvent<HTMLElement>,
  primary: Primary | null,
  discard: (() => void) | undefined,
) {
  if (event.defaultPrevented || event.nativeEvent.isComposing) return;
  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
    if (!primary || primary.blocked) return;
    event.preventDefault();
    primary.run();
  } else if (event.key === 'Escape' && discard) {
    event.preventDefault();
    discard();
  }
}

/** Botões de decisão: principal (com atalho), Inserir abaixo, Tentar de novo (erro) e Descartar. */
function DecisionButtons({
  state,
  mode,
  primary,
  callbacks,
  hints,
  keys,
}: {
  state: SuggestionState;
  mode: SuggestionMode;
  primary: Primary | null;
  callbacks: Callbacks;
  hints: boolean;
  keys: string;
}) {
  const { onInsert, onDiscard, onRetry } = callbacks;
  const open = OPEN_STATES.includes(state);
  const primaryButton = primary && (
    <Button
      variant="primary"
      size="sm"
      icon={primary.icon}
      aria-disabled={primary.blocked ? true : undefined}
      aria-keyshortcuts={primary.blocked ? undefined : 'Meta+Enter Control+Enter'}
      onClick={primary.run}
    >
      {primary.label}
      {hints && !primary.blocked && (
        <kbd className={s.hint} aria-hidden="true">
          {keys}
        </kbd>
      )}
    </Button>
  );
  return (
    <>
      {primary?.blocked ? (
        <Tooltip content={primary.blocked}>{primaryButton}</Tooltip>
      ) : (
        primaryButton
      )}
      {state === 'ready' && mode === 'replace' && onInsert && (
        <Button size="sm" icon={ArrowDownToLine} onClick={onInsert}>
          Inserir abaixo
        </Button>
      )}
      {state === 'error' && onRetry && (
        <Button size="sm" icon={RefreshCcw} onClick={onRetry}>
          Tentar de novo
        </Button>
      )}
      {open && onDiscard && (
        <Button variant="ghost" size="sm" aria-keyshortcuts="Escape" onClick={onDiscard}>
          Descartar
          {hints && (
            <kbd className={s.hint} aria-hidden="true">
              Esc
            </kbd>
          )}
        </Button>
      )}
    </>
  );
}

function StateMark({ state }: { state: SuggestionState }) {
  if (state === 'streaming') {
    return (
      <span className={s.working}>
        <Spinner size={14} tone="muted" delay={0} />
        Gerando
      </span>
    );
  }
  const status = STATUS[state];
  if (!status) return null;
  return (
    <span className={s.status}>
      {/* O motivo de um erro já está escrito no corpo do cartão: o selo não repete (nem em `title`). */}
      <Badge variant="text" tone={status.tone}>
        {status.label}
      </Badge>
    </span>
  );
}

/* ——————————————————————————— Grupo de alternativas ——————————————————————————— */

type GroupContextValue = {
  name: string;
  value: string | null;
  onValueChange: (value: string) => void;
  disabled?: boolean;
};
const GroupContext = createContext<GroupContextValue | null>(null);

export type SuggestionGroupProps = Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue'> & {
  /** Nome do grupo (“Títulos alternativos”). */
  label: string;
  value: string | null;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  /** `name` dos rádios. Padrão: gerado. */
  name?: string;
};

/**
 * Alternativas para escolher uma (títulos, linhas finas). Os filhos são
 * `SuggestionCard variant="compact" value="…"`, desenhados como `ChoiceCard`: rádios nativos com o
 * mesmo `name` — setas percorrem e escolhem, Tab entra pela marcada. Ponha o grupo no corpo de um
 * `SuggestionCard` para ganhar cabeçalho, origem e as ações (Aceitar aplica a escolhida).
 */
export function SuggestionGroup({
  label,
  value,
  onValueChange,
  disabled = false,
  name,
  className = '',
  children,
  ...props
}: SuggestionGroupProps) {
  const auto = useId();
  return (
    <GroupContext.Provider
      value={{ name: name ?? `sugestao-${auto}`, value, onValueChange, disabled }}
    >
      <div
        {...props}
        role="radiogroup"
        aria-label={label}
        aria-disabled={disabled || undefined}
        className={`${s.group} ${className}`}
      >
        {children}
      </div>
    </GroupContext.Provider>
  );
}

function SuggestionOption({
  value,
  proposal,
  meta,
  state,
  force,
}: {
  value: string;
  proposal?: ReactNode;
  meta?: ReactNode;
  state: SuggestionState;
  force?: string;
}) {
  const group = useContext(GroupContext) as GroupContextValue;
  const streaming = state === 'streaming';
  return (
    <ChoiceCard
      name={group.name}
      value={value}
      checked={group.value === value}
      onChange={group.onValueChange}
      title={
        streaming ? (
          <>
            <Skeleton width="72%" height={10} className={s.optionSkeleton} />
            <VisuallyHidden>Gerando alternativa</VisuallyHidden>
          </>
        ) : (
          proposal
        )
      }
      description={streaming ? undefined : meta}
      disabled={streaming || group.disabled}
      data-force={force}
    />
  );
}

/* ——————————————————————————— Cartão ——————————————————————————— */

export type SuggestionCardProps = Omit<ComponentProps<'article'>, 'title' | 'children'> &
  Callbacks & {
    /** Pedido que gerou a proposta (“Reescrever · mais direto”). */
    title?: ReactNode;
    /** Origem em linha de fatos: prompt e versão, modelo, duração, custo (`MetaList`). */
    provenance?: (ReactNode | MetaItem)[];
    /** Texto proposto. Em `streaming`, o parcial (ganha o cursor no fim). */
    proposal?: ReactNode;
    /** Diferença pronta contra o trecho atual; tem precedência sobre `proposal`. */
    diff?: DiffBlock[];
    /** Corpo próprio (ex.: `SuggestionGroup` com alternativas); tem precedência sobre `diff`. */
    children?: ReactNode;
    mode?: SuggestionMode;
    state?: SuggestionState;
    /** Motivo da falha, abaixo do corpo em `error`. */
    error?: string;
    /**
     * `default`: cartão do copiloto. `compact`: denso, para listas; dentro de `SuggestionGroup`
     * vira uma opção escolhível (`value`, `proposal`, `meta`).
     */
    variant?: 'default' | 'compact';
    /** Opção dentro de `SuggestionGroup`. */
    value?: string;
    /** Fato curto sob a proposta na opção compacta (“58 caracteres”). */
    meta?: ReactNode;
    /** Rótulo da ação principal quando “Aceitar” não diz o resultado (“Usar título”). */
    acceptLabel?: string;
    /** Motivo de a ação principal estar indisponível (“Escolha um título”), mostrado em `Tooltip`. */
    acceptBlockedReason?: string;
    /** Mostra ⌘↵ / Esc nos botões (some no toque). Padrão: `true` no `default`. */
    shortcuts?: boolean;
    titleAs?: 'h2' | 'h3' | 'h4' | 'p';
    /** Avaliação atual (controlada). Sem a prop, o cartão guarda a própria. */
    feedback?: SuggestionFeedback | null;
    /** 👍/👎. Clicar no já marcado desmarca (`null`). Sem a prop, os botões não aparecem. */
    onFeedback?: (value: SuggestionFeedback | null) => void;
    /** Com a prop, 👎 abre um campo de nota opcional (“O que faltou?”). */
    onFeedbackNote?: (note: string) => void;
    /** Abre a proposta para editar antes de aplicar. */
    onEdit?: () => void;
    /** Estado parado para pranchas (opção compacta). Nunca no produto. */
    'data-force'?: string;
  };

/**
 * Proposta da IA que a pessoa aceita ou descarta (copiloto, IA inline, alternativas). Cabeçalho com
 * o pedido (✦), a origem em `MetaList` e o estado (ponto + palavra); corpo com a diferença
 * (`DiffView` compacta) ou o texto proposto; rodapé com a decisão.
 *
 * - `streaming`: esqueleto ou texto parcial com cursor; Aceitar indisponível com motivo.
 * - `ready`: Aceitar (⌘↵) · Inserir abaixo · Descartar (Esc) · Tentar de novo · Editar · 👍/👎.
 * - `stale`: “Trecho mudou” + Reaplicar. `error`: motivo + Tentar de novo.
 * - `applied`/`discarded`: registro quieto (descartada recolhe o corpo), só a avaliação fica.
 *
 * Atalhos valem com o foco dentro do cartão; no editor, o produto liga as mesmas funções ao teclado
 * do texto. Trocas de estado são anunciadas; se a decisão tira o botão focado da tela, o foco volta
 * para o cartão.
 */
export function SuggestionCard({
  title,
  provenance,
  proposal,
  diff,
  children,
  mode = 'replace',
  state = 'ready',
  error,
  variant = 'default',
  value,
  meta,
  acceptLabel,
  acceptBlockedReason,
  shortcuts,
  titleAs: TitleTag = 'h3',
  feedback,
  onFeedback,
  onFeedbackNote,
  onAccept,
  onInsert,
  onDiscard,
  onRetry,
  onReapply,
  onEdit,
  className = '',
  ref,
  onKeyDown,
  onFocus,
  onBlur,
  'data-force': force,
  ...props
}: SuggestionCardProps) {
  const group = useContext(GroupContext);
  const titleId = useId();
  const keys = useAcceptKeys();
  const region = useStateAnnouncement(state);
  const keeper = useFocusKeeper<HTMLElement>(state, ref);
  const [ownFeedback, setOwnFeedback] = useState<SuggestionFeedback | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const { announce, region: noteRegion } = useAnnouncer();

  if (variant === 'compact' && group && value !== undefined) {
    return (
      <SuggestionOption value={value} proposal={proposal} meta={meta} state={state} force={force} />
    );
  }

  const compact = variant === 'compact';
  const callbacks: Callbacks = { onAccept, onInsert, onDiscard, onRetry, onReapply };
  const primary = primaryOf(state, mode, callbacks, acceptLabel, acceptBlockedReason);
  const open = OPEN_STATES.includes(state);
  const discard = open ? onDiscard : undefined;
  const hints = (shortcuts ?? !compact) && open;
  const streaming = state === 'streaming';
  const rated = feedback === undefined ? ownFeedback : feedback;
  const showFeedback = Boolean(onFeedback) && !streaming && state !== 'error';
  const showRetryIcon =
    Boolean(onRetry) && (state === 'ready' || (state === 'stale' && Boolean(onReapply)));
  const showEdit = Boolean(onEdit) && state === 'ready';

  const rate = (choice: SuggestionFeedback) => {
    const next = rated === choice ? null : choice;
    if (feedback === undefined) setOwnFeedback(next);
    onFeedback?.(next);
    setNoteOpen(next === 'down' && Boolean(onFeedbackNote));
  };
  const sendNote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = note.trim();
    if (text) onFeedbackNote?.(text);
    setNote('');
    setNoteOpen(false);
    if (text) announce('Nota enviada');
  };

  const hasContent = proposal !== undefined && proposal !== null && proposal !== '';
  let body: ReactNode = null;
  if (state !== 'discarded') {
    if (children) body = children;
    else if (diff?.length)
      body = <DiffView blocks={diff} size="compact" summary={false} label="Proposta" />;
    else if (hasContent)
      body = (
        <div className={s.proposal}>
          {proposal}
          {streaming && <span className={s.caret} aria-hidden="true" />}
        </div>
      );
    else if (streaming) body = <SkeletonText lines={3} label="Gerando sugestão" />;
  }

  const decision = (primary || (open && onDiscard) || (state === 'error' && onRetry)) && (
    <DecisionButtons
      state={state}
      mode={mode}
      primary={primary}
      callbacks={callbacks}
      hints={hints}
      keys={keys}
    />
  );
  const tools = (showRetryIcon || showEdit || showFeedback) && (
    <div className={s.tools}>
      {showRetryIcon && (
        <Tooltip content="Tentar de novo">
          <IconButton
            label="Tentar de novo"
            icon={RefreshCcw}
            variant="ghost"
            size="sm"
            onClick={onRetry}
          />
        </Tooltip>
      )}
      {showEdit && (
        <Tooltip content="Editar sugestão">
          <IconButton
            label="Editar sugestão"
            icon={Pencil}
            variant="ghost"
            size="sm"
            onClick={onEdit}
          />
        </Tooltip>
      )}
      {showFeedback && (showRetryIcon || showEdit) && (
        <span className={s.divider} aria-hidden="true" />
      )}
      {showFeedback && (
        <div className={s.feedback} role="group" aria-label="Avaliar sugestão">
          <Tooltip content="Marcar como útil">
            <IconButton
              label="Marcar como útil"
              icon={ThumbsUp}
              variant="ghost"
              size="sm"
              fillPressed
              aria-pressed={rated === 'up'}
              onClick={() => rate('up')}
            />
          </Tooltip>
          <Tooltip content="Marcar como ruim">
            <IconButton
              label="Marcar como ruim"
              icon={ThumbsDown}
              variant="ghost"
              size="sm"
              fillPressed
              aria-pressed={rated === 'down'}
              onClick={() => rate('down')}
            />
          </Tooltip>
        </div>
      )}
    </div>
  );

  return (
    <article
      {...props}
      ref={keeper.setRef}
      tabIndex={-1}
      className={`${s.card} ${className}`}
      data-variant={variant}
      data-state={state}
      data-mode={mode}
      data-force={force}
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : (props['aria-label'] ?? 'Sugestão')}
      aria-busy={streaming || undefined}
      onFocus={(event) => {
        keeper.onFocus();
        onFocus?.(event);
      }}
      onBlur={(event) => {
        keeper.onBlur(event);
        onBlur?.(event);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        handleShortcut(event, primary, discard);
      }}
    >
      {(title || provenance || state !== 'ready') && (
        <header className={s.head}>
          <Sparkles className={s.spark} aria-hidden="true" />
          <div className={s.titles}>
            {title && (
              <TitleTag id={titleId} className={s.title}>
                <VisuallyHidden>Sugestão: </VisuallyHidden>
                {title}
              </TitleTag>
            )}
            {provenance && provenance.length > 0 && (
              <MetaList
                size="xs"
                items={provenance}
                label="Origem da sugestão"
                className={s.provenance}
              />
            )}
          </div>
          <StateMark state={state} />
        </header>
      )}
      {body && <div className={s.body}>{body}</div>}
      {state === 'error' && (
        <p className={s.error}>
          <CircleAlert aria-hidden="true" />
          {error ?? 'Não foi possível gerar a sugestão.'}
        </p>
      )}
      {(decision || tools) && (
        <footer className={s.foot}>
          {decision && <div className={s.decision}>{decision}</div>}
          {tools}
        </footer>
      )}
      {noteOpen && showFeedback && (
        <form className={s.note} onSubmit={sendNote}>
          <Input
            size="sm"
            aria-label="Nota sobre a sugestão"
            placeholder="O que faltou?"
            value={note}
            autoFocus
            maxLength={280}
            onChange={(event) => setNote(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Escape') return;
              // Esc fecha a nota; não descarta a sugestão.
              event.preventDefault();
              event.stopPropagation();
              setNoteOpen(false);
            }}
          />
          <Button size="sm" type="submit">
            Enviar nota
          </Button>
        </form>
      )}
      {region}
      {noteRegion}
    </article>
  );
}

/* ——————————————————————————— Barra ——————————————————————————— */

export type SuggestionBarProps = Omit<ComponentProps<'div'>, 'children'> &
  Callbacks & {
    /** Pedido em curso (“Reescrever · mais direto”). */
    label: ReactNode;
    state?: SuggestionState;
    mode?: SuggestionMode;
    /** Progresso da geração (0–100). Sem valor, a linha é indeterminada. Só em `streaming`. */
    progress?: number;
    /** Rótulo da ação principal quando “Aceitar” não diz o resultado. */
    acceptLabel?: string;
    /** Mostra ⌘↵ / Esc nos botões (some no toque). Padrão `true`. */
    shortcuts?: boolean;
  };

/**
 * Barra presa sob o trecho que a IA está reescrevendo no editor (decoração no fluxo do texto, não
 * camada flutuante): ✦ pedido · estado · Aceitar (⌘↵) · Descartar (Esc) · Tentar de novo. Enquanto
 * gera, uma linha de progresso corre no pé da barra e Aceitar fica indisponível com motivo. Em
 * telas estreitas as ações descem para a linha de baixo.
 */
export function SuggestionBar({
  label,
  state = 'ready',
  mode = 'replace',
  progress,
  acceptLabel,
  shortcuts = true,
  onAccept,
  onInsert,
  onDiscard,
  onRetry,
  onReapply,
  className = '',
  ref,
  onKeyDown,
  onFocus,
  onBlur,
  ...props
}: SuggestionBarProps) {
  const labelId = useId();
  const keys = useAcceptKeys();
  const region = useStateAnnouncement(state);
  const keeper = useFocusKeeper<HTMLDivElement>(state, ref);
  const callbacks: Callbacks = { onAccept, onInsert, onDiscard, onRetry, onReapply };
  const primary = primaryOf(state, mode, callbacks, acceptLabel, undefined);
  const open = OPEN_STATES.includes(state);
  const streaming = state === 'streaming';
  const hints = shortcuts && open;
  return (
    <div
      {...props}
      ref={keeper.setRef}
      tabIndex={-1}
      role="group"
      aria-labelledby={labelId}
      aria-busy={streaming || undefined}
      className={`${s.bar} ${className}`}
      data-state={state}
      onFocus={(event) => {
        keeper.onFocus();
        onFocus?.(event);
      }}
      onBlur={(event) => {
        keeper.onBlur(event);
        onBlur?.(event);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        handleShortcut(event, primary, open ? onDiscard : undefined);
      }}
    >
      <p className={s.barLabel}>
        <Sparkles className={s.spark} aria-hidden="true" />
        <span id={labelId} className={s.barText}>
          <VisuallyHidden>Sugestão: </VisuallyHidden>
          {label}
        </span>
      </p>
      <StateMark state={state} />
      <div className={s.barActions}>
        <DecisionButtons
          state={state}
          mode={mode}
          primary={primary}
          callbacks={callbacks}
          hints={hints}
          keys={keys}
        />
        {onRetry && (state === 'ready' || (state === 'stale' && onReapply)) && (
          <Tooltip content="Tentar de novo">
            <IconButton
              label="Tentar de novo"
              icon={RefreshCcw}
              variant="ghost"
              size="sm"
              onClick={onRetry}
            />
          </Tooltip>
        )}
      </div>
      {streaming && (
        <Progress
          size="sm"
          value={progress}
          aria-label="Progresso da sugestão"
          className={s.barProgress}
        />
      )}
      {region}
    </div>
  );
}
