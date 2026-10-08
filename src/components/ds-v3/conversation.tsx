'use client';

import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type Ref,
} from 'react';
import { VisuallyHidden, useAnnouncer } from './a11y';
import { Button, IconButton } from './button';
import { Textarea } from './fields';
import {
  ArrowDown,
  Check,
  CircleAlert,
  Copy,
  FileText,
  RefreshCcw,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  type LucideIcon,
} from './icons';
import { LinkButton } from './link';
import { Tooltip } from './overlays';
import { Popover, reducedMotion, useIsoLayoutEffect } from './popover';
import s from './conversation.module.css';

/*
 * Conversa com a IA (copiloto). `Conversation` é a linha do tempo que rola: segura o fim enquanto
 * a resposta chega e, se a pessoa subir para reler, para de puxar e oferece “Ir para o fim”.
 * `ConversationTurn` é cada turno: o da pessoa é um balão discreto no fim da linha; o da IA ocupa a
 * largura, com cabeçalho (ícone, nome, meta), os blocos que o produto passa como filhos (passos,
 * texto, sugestões, artefato) e as ações Copiar, Gerar de novo e 👍/👎 com comentário opcional.
 * Nada aqui conhece modelo, editor ou SDK: tudo chega por props serializáveis e callbacks.
 */

/* ——————————————————————————— Conversa ——————————————————————————— */

/** Distância do fim (px) que ainda conta como “no fim”. */
const END_SLACK = 24;

/** Rola a área até o fim e guarda onde ela parou (o navegador limita o valor pedido). */
function placeAtEnd(el: HTMLElement, placed: { current: number | null }) {
  el.scrollTop = el.scrollHeight;
  placed.current = el.scrollTop;
}

export type ConversationHandle = {
  /** Rola até o fim e volta a acompanhar a resposta. */
  scrollToEnd: (options?: { smooth?: boolean }) => void;
};

export type ConversationProps = Omit<ComponentProps<'div'>, 'children' | 'ref'> & {
  /** Nome da conversa para leitor de tela (“Conversa com o copiloto”). */
  label: string;
  /** Turnos (`ConversationTurn`). Sem nenhum, aparece `empty`. */
  children?: ReactNode;
  /** Estado vazio, centralizado na área (ex.: `EmptyState` com pedidos prontos). */
  empty?: ReactNode;
  /** Preso embaixo, fora da rolagem (ex.: `PromptComposer`). */
  footer?: ReactNode;
  ref?: Ref<ConversationHandle>;
  /** Prancha: “Ir para o fim” visível e parado. Nunca no produto. */
  forceJump?: boolean;
};

type TurnLike = { role?: unknown };

/**
 * Linha do tempo da conversa. Ocupa a altura do contêiner (painel do copiloto): a área de turnos
 * rola e o `footer` fica embaixo. Segue o fim enquanto o conteúdo cresce; rolar para cima solta e
 * mostra “Ir para o fim”. Um turno novo da pessoa sempre volta ao fim. A área rolável é focável
 * (setas, Page Up/Down, Home/End) e é um `log`: turnos novos são anunciados; o turno da IA fica
 * `aria-busy` enquanto chega, para o leitor de tela não soletrar cada pedaço.
 */
export function Conversation({
  label,
  children,
  empty,
  footer,
  ref,
  forceJump = false,
  className = '',
  ...props
}: ConversationProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  /** Acompanha o fim? Vira falso quando a pessoa rola para cima. */
  const follow = useRef(true);
  /** Rolagem suave pedida por nós: os eventos intermediários não soltam o acompanhamento. */
  const gliding = useRef(false);
  /**
   * Onde a nossa última rolagem até o fim deixou a área. O evento dela chega no quadro seguinte,
   * às vezes depois de o conteúdo crescer: nessa posição ele não é a pessoa subindo para reler.
   */
  const placed = useRef<number | null>(null);
  const [away, setAway] = useState(false);

  const items = Children.toArray(children);
  const count = items.length;
  const last = items[count - 1];
  const lastRole = isValidElement<TurnLike>(last) ? last.props.role : undefined;

  const scrollToEnd = useCallback((options?: { smooth?: boolean }) => {
    const el = viewportRef.current;
    follow.current = true;
    setAway(false);
    if (!el) return;
    const top = el.scrollHeight;
    // Já no fim, nenhuma rolagem acontece (nem o evento que encerraria o deslize): não desliza.
    const atEnd = el.scrollHeight - el.scrollTop - el.clientHeight <= 1;
    if (options?.smooth && !atEnd && !reducedMotion() && typeof el.scrollTo === 'function') {
      gliding.current = true;
      el.scrollTo({ top, behavior: 'smooth' });
    } else {
      placeAtEnd(el, placed);
    }
  }, []);

  useImperativeHandle(ref, () => ({ scrollToEnd }), [scrollToEnd]);

  // Abre já no fim.
  useIsoLayoutEffect(() => {
    const el = viewportRef.current;
    if (el) placeAtEnd(el, placed);
  }, []);

  // Conteúdo (ou a própria área) mudou de altura: acompanhando, desce junto; solto, só avisa.
  useEffect(() => {
    const el = viewportRef.current;
    const content = contentRef.current;
    if (!el || !content || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      if (follow.current) {
        placeAtEnd(el, placed);
        return;
      }
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      setAway(distance > END_SLACK);
    });
    observer.observe(content);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // A pessoa mandou um pedido: volta ao fim, mesmo se estava relendo.
  const seen = useRef(count);
  useEffect(() => {
    const grew = count > seen.current;
    seen.current = count;
    if (grew && lastRole === 'user') scrollToEnd({ smooth: true });
  }, [count, lastRole, scrollToEnd]);

  const showJump = forceJump || (away && count > 0);

  return (
    <div {...props} className={`${s.conversation} ${className}`}>
      <div className={s.stage}>
        <div
          ref={viewportRef}
          className={s.viewport}
          role="log"
          aria-label={label}
          tabIndex={0}
          onScroll={(event) => {
            const el = event.currentTarget;
            const atEnd = el.scrollHeight - el.scrollTop - el.clientHeight <= END_SLACK;
            if (gliding.current) {
              if (atEnd) gliding.current = false;
              return;
            }
            // O evento da nossa própria ida ao fim: o conteúdo cresceu antes dele, a pessoa não rolou.
            if (
              follow.current &&
              placed.current !== null &&
              Math.abs(el.scrollTop - placed.current) <= 1
            ) {
              return;
            }
            placed.current = null;
            follow.current = atEnd;
            setAway(!atEnd);
          }}
          // Roda, toque, tecla ou a barra de rolagem (ponteiro na área) interrompem a rolagem suave:
          // quem manda é a pessoa.
          onWheel={() => {
            gliding.current = false;
          }}
          onTouchMove={() => {
            gliding.current = false;
          }}
          onKeyDown={() => {
            gliding.current = false;
          }}
          onPointerDown={() => {
            gliding.current = false;
          }}
        >
          <div ref={contentRef} className={s.content} data-empty={count === 0 || undefined}>
            {count === 0 ? <div className={s.empty}>{empty}</div> : children}
          </div>
        </div>
        {showJump && (
          <Button
            size="sm"
            shape="pill"
            variant="secondary"
            icon={ArrowDown}
            className={s.jump}
            onClick={() => {
              scrollToEnd({ smooth: true });
              viewportRef.current?.focus({ preventScroll: true });
            }}
          >
            Ir para o fim
          </Button>
        )}
      </div>
      {footer && <div className={s.footer}>{footer}</div>}
    </div>
  );
}

/* ——————————————————————————— Turno ——————————————————————————— */

export type ConversationRole = 'user' | 'assistant' | 'system-note';
/** `streaming`: chegando (cursor no fim) · `stopped`: interrompida · `error`: falhou. */
export type TurnStatus = 'done' | 'streaming' | 'stopped' | 'error';
export type TurnFeedback = 'up' | 'down';

export type ConversationTurnProps = Omit<ComponentProps<'article'>, 'role' | 'children'> & {
  role: ConversationRole;
  children?: ReactNode;
  /** Nome do autor. Padrão: “Você”, “Copiloto”, “Aviso”. Na IA aparece no cabeçalho. */
  label?: string;
  /** Ícone do cabeçalho da IA (padrão `Sparkles`) ou da nota do sistema. */
  icon?: LucideIcon;
  /** Meta do cabeçalho (“Simulação local · 12 s”) ou da nota. */
  meta?: ReactNode;
  /** Turno da pessoa: chips do que foi enviado junto (seleção, trecho), acima do balão. */
  context?: ReactNode;
  status?: TurnStatus;
  /** Mensagem de `status="error"`. */
  error?: ReactNode;
  /** Texto copiado por “Copiar resposta”. Sem ele, a ação não aparece. */
  copyText?: string;
  onCopy?: () => void;
  /** “Gerar de novo” nas ações e “Tentar de novo” no erro. */
  onRetry?: () => void;
  /** “Continuar” quando a resposta foi interrompida. */
  onContinue?: () => void;
  /** Voto atual (controlado). */
  feedback?: TurnFeedback | null;
  /**
   * Chamado no voto (`null` desfaz) e de novo, com `note`, se a pessoa mandar um comentário.
   * Sem callback, os botões de voto não aparecem.
   */
  onFeedback?: (value: TurnFeedback | null, note?: string) => void;
  /** Quais votos pedem comentário opcional num popover. */
  feedbackNote?: 'down' | 'both' | false;
  /** Ações extras no fim da linha de ações (ex.: “Inserir no texto”). */
  actions?: ReactNode;
  /** Prancha: `hover` ou `focus` nos controles do turno. */
  'data-force'?: string;
};

const DEFAULT_LABEL: Record<ConversationRole, string> = {
  user: 'Você',
  assistant: 'Copiloto',
  'system-note': 'Aviso',
};

/**
 * Um turno da conversa. Pessoa: balão `--g-50` encostado no fim, até 85% da largura, com os chips
 * de contexto acima. IA: largura cheia, sem caixa; cabeçalho 12/500 com meta, blocos com 12 de
 * respiro e ações fantasma 32 px depois que a resposta termina. Chegando, um cursor discreto pisca
 * no fim do último parágrafo (sem cursor com movimento reduzido); `[data-caret]` num elemento dos
 * filhos escolhe o lugar exato. Nota do sistema: legenda centralizada (“Rascunho v1 salvo”).
 */
export function ConversationTurn({
  role,
  children,
  label,
  icon,
  meta,
  context,
  status = 'done',
  error,
  copyText,
  onCopy,
  onRetry,
  onContinue,
  feedback = null,
  onFeedback,
  feedbackNote = 'down',
  actions,
  className = '',
  'data-force': force,
  ...props
}: ConversationTurnProps) {
  const name = label ?? DEFAULT_LABEL[role];
  // Texto solto vira parágrafo: o cursor de chegada precisa de um elemento para morar.
  const body = typeof children === 'string' ? <p className={s.plain}>{children}</p> : children;

  if (role === 'system-note') {
    const Icon = icon;
    return (
      <article
        {...props}
        className={`${s.turn} ${className}`}
        data-role="system-note"
        aria-label={name}
      >
        <p className={s.note}>
          {Icon && <Icon className={s.noteIcon} aria-hidden="true" />}
          <span className={s.noteText}>{children}</span>
          {meta && <span className={s.noteMeta}>{meta}</span>}
        </p>
      </article>
    );
  }

  if (role === 'user') {
    return (
      <article {...props} className={`${s.turn} ${className}`} data-role="user" aria-label={name}>
        {context && (
          <div className={s.userContext} role="group" aria-label="Enviado junto">
            {context}
          </div>
        )}
        <div className={s.bubble}>{body}</div>
      </article>
    );
  }

  const Icon = icon ?? Sparkles;
  const streaming = status === 'streaming';
  const hasActions = Boolean(copyText || onRetry || onFeedback || actions);
  return (
    <article
      {...props}
      className={`${s.turn} ${className}`}
      data-role="assistant"
      data-status={status}
      aria-label={name}
      aria-busy={streaming || undefined}
    >
      <header className={s.head}>
        <Icon className={s.headIcon} aria-hidden="true" />
        <span className={s.headLabel}>{name}</span>
        {meta && <span className={s.headMeta}>{meta}</span>}
        {streaming && <VisuallyHidden>, respondendo</VisuallyHidden>}
      </header>
      {body !== undefined && body !== null && (
        <div className={s.body} data-streaming={streaming || undefined}>
          {body}
        </div>
      )}
      {status === 'error' && (
        <p className={s.error} role="alert">
          <CircleAlert aria-hidden="true" />
          <span className={s.statusText}>{error ?? 'Não foi possível concluir a resposta.'}</span>
          {onRetry && <LinkButton onClick={onRetry}>Tentar de novo</LinkButton>}
        </p>
      )}
      {status === 'stopped' && (
        <p className={s.stopped}>
          <span className={s.statusText}>Resposta interrompida</span>
          {onContinue && <LinkButton onClick={onContinue}>Continuar</LinkButton>}
        </p>
      )}
      {!streaming && hasActions && (
        <TurnActions
          copyText={copyText}
          onCopy={onCopy}
          onRetry={status === 'error' ? undefined : onRetry}
          feedback={feedback}
          onFeedback={onFeedback}
          feedbackNote={feedbackNote}
          force={force}
        >
          {actions}
        </TurnActions>
      )}
    </article>
  );
}

/* ——— Ações da resposta ——— */

function TurnActions({
  copyText,
  onCopy,
  onRetry,
  feedback,
  onFeedback,
  feedbackNote,
  force,
  children,
}: {
  copyText?: string;
  onCopy?: () => void;
  onRetry?: () => void;
  feedback: TurnFeedback | null;
  onFeedback?: (value: TurnFeedback | null, note?: string) => void;
  feedbackNote: 'down' | 'both' | false;
  force?: string;
  children?: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const { announce, region } = useAnnouncer();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
    } catch {
      return; // sem permissão de área de transferência: o retorno visual não mente
    }
    onCopy?.();
    setCopied(true);
    announce('Resposta copiada');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1200);
  }

  const asksNote = (value: TurnFeedback) =>
    feedbackNote === 'both' || (feedbackNote === 'down' && value === 'down');

  return (
    <div className={s.actions} role="group" aria-label="Ações da resposta">
      {copyText && (
        <Tooltip content={copied ? 'Copiada' : 'Copiar resposta'}>
          <IconButton
            label={copied ? 'Resposta copiada' : 'Copiar resposta'}
            icon={copied ? Check : Copy}
            variant="ghost"
            size="sm"
            className={s.action}
            data-done={copied || undefined}
            data-force={force}
            onClick={copy}
          />
        </Tooltip>
      )}
      {onRetry && (
        <Tooltip content="Gerar de novo">
          <IconButton
            label="Gerar de novo"
            icon={RefreshCcw}
            variant="ghost"
            size="sm"
            className={s.action}
            onClick={onRetry}
          />
        </Tooltip>
      )}
      {onFeedback &&
        (['up', 'down'] as const).map((value) => (
          <FeedbackButton
            key={value}
            value={value}
            pressed={feedback === value}
            note={asksNote(value)}
            onVote={(next) => onFeedback(next)}
            onNote={(note) => {
              onFeedback(value, note);
              announce('Comentário enviado');
            }}
          />
        ))}
      {children}
      {region}
    </div>
  );
}

const VOTE = {
  up: { icon: ThumbsUp, label: 'Marcar como útil', ask: 'O que ajudou?' },
  down: { icon: ThumbsDown, label: 'Marcar como não útil', ask: 'O que faltou?' },
} as const;

/**
 * 👍/👎 alternável (`aria-pressed`, ícone preenchido em azul quando marcado). Com `note`, votar
 * abre um popover com comentário opcional; Enviar chama `onNote`, Escape ou “Agora não” fecham.
 */
function FeedbackButton({
  value,
  pressed,
  note,
  onVote,
  onNote,
}: {
  value: TurnFeedback;
  pressed: boolean;
  note: boolean;
  onVote: (value: TurnFeedback | null) => void;
  onNote: (note: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const fieldId = useId();
  const { icon, label, ask } = VOTE[value];

  function vote() {
    const next = pressed ? null : value;
    onVote(next);
    if (next && note) {
      setText('');
      setOpen(true);
    } else setOpen(false);
  }

  if (!note) {
    return (
      <Tooltip content={label}>
        <IconButton
          label={label}
          icon={icon}
          variant="ghost"
          size="sm"
          fillPressed
          aria-pressed={pressed}
          className={s.action}
          onClick={vote}
        />
      </Tooltip>
    );
  }

  return (
    <Popover
      label={ask}
      side="top"
      align="start"
      width={288}
      open={open}
      onOpenChange={setOpen}
      trigger={(trigger) => (
        <Tooltip content={label}>
          <IconButton
            {...trigger}
            label={label}
            icon={icon}
            variant="ghost"
            size="sm"
            fillPressed
            aria-pressed={pressed}
            className={s.action}
            onClick={vote}
          />
        </Tooltip>
      )}
    >
      {({ close }) => (
        <form
          className={s.noteForm}
          onSubmit={(event) => {
            event.preventDefault();
            const clean = text.trim();
            if (clean) onNote(clean);
            close();
          }}
        >
          <label htmlFor={fieldId} className={s.noteLabel}>
            {ask}
          </label>
          <Textarea
            id={fieldId}
            value={text}
            placeholder="Comentário opcional"
            autoSize={{ minRows: 2, maxRows: 5 }}
            data-autofocus=""
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <div className={s.noteActions}>
            <Button size="sm" variant="ghost" onClick={close}>
              Agora não
            </Button>
            <Button size="sm" variant="primary" type="submit">
              Enviar comentário
            </Button>
          </div>
        </form>
      )}
    </Popover>
  );
}

/* ——————————————————————————— Artefato ——————————————————————————— */

export type ConversationArtifactProps = Omit<ComponentProps<'div'>, 'title' | 'children'> & {
  /** Nome do artefato (“Rascunho v1”). Com `onOpen`/`href`, o cartão inteiro abre. */
  title: string;
  /** Uma linha de meta (“812 palavras · 4 min”). */
  meta?: ReactNode;
  icon?: LucideIcon;
  /** Botões à direita (“Ver diferenças”, “Restaurar”); continuam clicáveis por cima do cartão. */
  actions?: ReactNode;
  onOpen?: () => void;
  href?: string;
  /** Prancha: `hover` ou `focus` no cartão. */
  'data-force'?: string;
};

/**
 * O que a IA produziu, dentro do turno: ícone 16, título 13/500, meta 11.5 e ações. Fio `--line`,
 * raio 10, sem sombra. Com `onOpen` ou `href`, o título cobre o cartão (hover `--g-25` +
 * `--line-hover`, anel de foco no cartão); no celular as ações descem para a linha de baixo.
 */
export function ConversationArtifact({
  title,
  meta,
  icon: Icon = FileText,
  actions,
  onOpen,
  href,
  className = '',
  'data-force': force,
  ...props
}: ConversationArtifactProps) {
  const metaId = useId();
  const openable = Boolean(onOpen || href);
  const titleProps = {
    className: s.artifactTitle,
    'aria-describedby': meta ? metaId : undefined,
    'data-force': force,
  };
  return (
    <div {...props} className={`${s.artifact} ${className}`} data-openable={openable || undefined}>
      <Icon className={s.artifactIcon} aria-hidden="true" />
      <div className={s.artifactText}>
        {href ? (
          <a {...titleProps} href={href} onClick={onOpen}>
            {title}
          </a>
        ) : onOpen ? (
          <button {...titleProps} type="button" onClick={onOpen}>
            {title}
          </button>
        ) : (
          <span className={s.artifactTitle}>{title}</span>
        )}
        {meta && (
          <span id={metaId} className={s.artifactMeta}>
            {meta}
          </span>
        )}
      </div>
      {actions && <div className={s.artifactActions}>{actions}</div>}
    </div>
  );
}
