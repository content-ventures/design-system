'use client';

import {
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { VisuallyHidden, useAnnouncer } from './a11y';
import { Button, IconButton } from './button';
import { Counter, Textarea } from './fields';
import { ArrowUp, ChevronDown, CircleAlert, CircleStop } from './icons';
import { LinkButton } from './link';
import { Menu, type MenuSection } from './menu';
import { Tooltip } from './overlays';
import s from './prompt-composer.module.css';

/*
 * Compositor de pedido à IA (copiloto). Um formulário controlado: o texto vem de `value`, o envio
 * sai por `onSubmit({ text })` e quem consome limpa o campo. Moldura de controle (fio forte,
 * `--shadow-xs` em repouso, anel de campo no foco) com três faixas: contexto (chips), texto que
 * cresce sozinho e rodapé com ferramentas à esquerda, modelo e Enviar à direita. Gerando, Enviar
 * vira Parar (`CircleStop`, Esc). Pedidos prontos ficam acima, em pílulas discretas.
 * Não conhece modelo, provedor nem documento: tudo chega por props serializáveis e callbacks.
 */

export type PromptStatus = 'idle' | 'submitting' | 'streaming' | 'error';
/** `enter`: Enter envia e Shift+Enter quebra linha. `mod-enter`: ⌘/Ctrl+Enter envia. */
export type PromptSubmitKey = 'enter' | 'mod-enter';

export type PromptPreset = {
  id: string;
  /** Rótulo curto da pílula (“Mais direto”). */
  label: string;
  /** Texto que vai para o campo ou é enviado. */
  prompt: string;
};

export type PromptSubmission = {
  text: string;
  /** Presente quando o envio veio de um pedido pronto com `presetAction="submit"`. */
  presetId?: string;
};

/** API por `ref`: o produto liga ⌘J em `focus()`. */
export type PromptComposerHandle = {
  /** Foca o texto com o cursor no fim. */
  focus: () => void;
};

export type PromptComposerProps = Omit<
  ComponentProps<'form'>,
  'onSubmit' | 'onChange' | 'children' | 'ref'
> & {
  value: string;
  onChange: (value: string) => void;
  /** Recebe o texto sem espaços nas pontas. Limpe `value` depois de aceitar o pedido. */
  onSubmit: (submission: PromptSubmission) => void;
  /** `submitting`: Enviar carregando · `streaming`: Parar no lugar de Enviar · `error`: aviso. */
  status?: PromptStatus;
  /** Sem `onStop`, gerando mostra Enviar indisponível com o motivo. */
  onStop?: () => void;
  /** Mensagem do erro (`status="error"`). */
  error?: ReactNode;
  /** “Tentar de novo” ao lado do erro. */
  onRetry?: () => void;
  /** Chips acima do texto (seleção, trecho da transcrição, anexo), cada um com seu “Remover”. */
  context?: ReactNode;
  /** Nome do grupo de chips para leitor de tela. */
  contextLabel?: string;
  /** Pedidos prontos em pílulas acima da moldura. */
  presets?: PromptPreset[];
  /** `fill` põe o texto no campo e foca · `submit` envia direto. */
  presetAction?: 'fill' | 'submit';
  /** Ferramentas à esquerda do rodapé (ex.: `IconButton` Anexar). */
  tools?: ReactNode;
  /** À direita, antes de Enviar (ex.: `PromptModelMenu`). */
  model?: ReactNode;
  submitKey?: PromptSubmitKey;
  /** Limite de caracteres: contador a partir de 80%; acima do limite, Enviar fica indisponível. */
  maxLength?: number;
  placeholder?: string;
  /** Nome do formulário. */
  label?: string;
  /** Nome do campo de texto. */
  inputLabel?: string;
  disabled?: boolean;
  /** Linhas do texto: começa em `minRows` e cresce até `maxRows`, depois rola. */
  minRows?: number;
  maxRows?: number;
  ref?: Ref<PromptComposerHandle>;
  /** Prancha: `hover` ou `focus` na moldura. */
  'data-force'?: string;
};

const STATUS_TEXT: Partial<Record<PromptStatus, string>> = {
  submitting: 'Enviando pedido',
  streaming: 'Gerando resposta',
};

export function PromptComposer({
  value,
  onChange,
  onSubmit,
  status = 'idle',
  onStop,
  error,
  onRetry,
  context,
  contextLabel = 'Contexto do pedido',
  presets,
  presetAction = 'fill',
  tools,
  model,
  submitKey = 'enter',
  maxLength,
  placeholder = 'Peça uma mudança ao texto…',
  label = 'Pedido ao copiloto',
  inputLabel = 'Pedido',
  disabled = false,
  minRows = 2,
  maxRows = 10,
  ref,
  className = '',
  'data-force': force,
  ...props
}: PromptComposerProps) {
  const id = useId();
  const textRef = useRef<HTMLTextAreaElement | null>(null);
  const { announce, region } = useAnnouncer();
  const previous = useRef(status);

  const busy = status === 'submitting' || status === 'streaming';
  const length = value.length;
  const over = maxLength !== undefined && length > maxLength;
  const empty = value.trim() === '';
  const showCounter = maxLength !== undefined && length >= maxLength * 0.8;

  // Anuncia a mudança de etapa; o erro tem `role="alert"` próprio.
  useEffect(() => {
    const from = previous.current;
    previous.current = status;
    if (from === status) return;
    const text = STATUS_TEXT[status];
    if (text) announce(text);
    else if (status === 'idle' && (from === 'submitting' || from === 'streaming'))
      announce('Resposta concluída');
  }, [status, announce]);

  function focusEnd() {
    const el = textRef.current;
    if (!el) return;
    el.focus();
    const end = el.value.length;
    el.setSelectionRange(end, end);
  }

  useImperativeHandle(ref, () => ({ focus: focusEnd }), []);

  /** Motivo de Enviar indisponível (vai para a dica e para `aria-describedby`). */
  const reason = disabled
    ? undefined
    : busy && !onStop
      ? 'Aguarde a resposta'
      : over
        ? `Encurte para até ${maxLength?.toLocaleString('pt-BR')} caracteres`
        : empty
          ? 'Escreva um pedido'
          : undefined;

  function submit() {
    if (disabled || busy || empty || over) return;
    onSubmit({ text: value.trim() });
  }

  function choose(preset: PromptPreset) {
    if (disabled || busy) return;
    if (presetAction === 'submit') {
      onSubmit({ text: preset.prompt, presetId: preset.id });
      return;
    }
    onChange(preset.prompt);
    // O valor novo chega no próximo render: o cursor vai para o fim depois dele.
    requestAnimationFrame(focusEnd);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Escape' && status === 'streaming' && onStop) {
      event.preventDefault();
      onStop();
      return;
    }
    // Composição de IME (acentos, japonês): Enter confirma a sílaba, não envia.
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
    const mod = event.metaKey || event.ctrlKey;
    const sends = submitKey === 'enter' ? !event.shiftKey : mod;
    if (!sends) return;
    event.preventDefault();
    submit();
  }

  function onFrameDown(event: MouseEvent<HTMLDivElement>) {
    // Clique no respiro da moldura leva ao texto; controles internos seguem com o próprio clique.
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select, [tabindex], [role="menu"]')) return;
    event.preventDefault();
    focusEnd();
  }

  const counterId = `${id}-counter`;
  const errorId = `${id}-error`;
  const describedBy =
    [showCounter ? counterId : undefined, status === 'error' ? errorId : undefined]
      .filter(Boolean)
      .join(' ') || undefined;
  const keyHint = submitKey === 'enter' ? '↵' : '⌘↵';

  return (
    <form
      {...props}
      className={`${s.root} ${className}`}
      aria-label={label}
      aria-busy={busy || undefined}
      data-status={status}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {presets && presets.length > 0 && (
        <PresetRow>
          {presets.map((preset) => (
            <Button
              key={preset.id}
              size="sm"
              shape="pill"
              variant="secondary"
              className={s.preset}
              disabled={disabled || busy}
              onClick={() => choose(preset)}
            >
              {preset.label}
            </Button>
          ))}
        </PresetRow>
      )}

      <div
        className={s.frame}
        data-invalid={over || undefined}
        data-disabled={disabled || undefined}
        onMouseDown={onFrameDown}
      >
        {context && (
          <div className={s.context} role="group" aria-label={contextLabel}>
            {context}
          </div>
        )}
        <Textarea
          ref={textRef}
          className={s.input}
          aria-label={inputLabel}
          aria-describedby={describedBy}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          invalid={over}
          rows={minRows}
          autoSize={{ minRows, maxRows }}
          enterKeyHint="send"
          data-force={force}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
        />
        <div className={s.footer}>
          {tools && <div className={s.tools}>{tools}</div>}
          <div className={s.end}>
            {showCounter && maxLength !== undefined && (
              <span id={counterId} className={s.counter}>
                <Counter value={length} max={maxLength} />
                <VisuallyHidden> caracteres</VisuallyHidden>
              </span>
            )}
            {model}
            {status === 'streaming' && onStop ? (
              <Tooltip key="stop" content="Parar" shortcut="Esc">
                <IconButton
                  label="Parar"
                  icon={CircleStop}
                  variant="secondary"
                  size="sm"
                  className={s.send}
                  onClick={onStop}
                />
              </Tooltip>
            ) : (
              <Tooltip
                key="send"
                content={reason ?? 'Enviar'}
                shortcut={reason ? undefined : keyHint}
              >
                <IconButton
                  type="submit"
                  label="Enviar"
                  icon={ArrowUp}
                  variant="primary"
                  size="sm"
                  className={s.send}
                  disabled={disabled}
                  loading={status === 'submitting'}
                  aria-disabled={reason ? true : undefined}
                />
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      {status === 'error' && (
        <p id={errorId} className={s.error} role="alert">
          <CircleAlert aria-hidden="true" />
          <span className={s.errorText}>{error ?? 'Não foi possível enviar o pedido.'}</span>
          {onRetry && (
            <LinkButton className={s.retry} onClick={onRetry}>
              Tentar de novo
            </LinkButton>
          )}
        </p>
      )}
      {region}
    </form>
  );
}

/**
 * Pedidos prontos numa linha só: no painel estreito a linha rola na horizontal (sem barra) e o fim
 * esmaece enquanto houver pílula escondida — a altura do compositor não cresce com os pedidos.
 */
function PresetRow({ children }: { children: ReactNode }) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const row = rowRef.current;
    if (!row || typeof ResizeObserver === 'undefined') return;
    const mark = () => {
      row.toggleAttribute('data-overflow', row.scrollWidth > row.clientWidth + 1);
      row.toggleAttribute('data-end', row.scrollLeft + row.clientWidth >= row.scrollWidth - 2);
    };
    mark();
    const observer = new ResizeObserver(mark);
    observer.observe(row);
    row.addEventListener('scroll', mark, { passive: true });
    return () => {
      observer.disconnect();
      row.removeEventListener('scroll', mark);
    };
  }, []);
  return (
    <div ref={rowRef} className={s.presets} role="group" aria-label="Pedidos prontos">
      {children}
    </div>
  );
}

/* ——— Modelo: chip discreto que abre um `Menu` ——— */

export type PromptModelOption = {
  value: string;
  label: string;
  /** Segunda linha do item (“Rápido, sem custo”). */
  description?: string;
  /** À direita do item (“Padrão”). */
  meta?: string;
  /** Agrupa itens sob um título (provedor). */
  group?: string;
  disabled?: boolean;
};

/**
 * Escolha do modelo no rodapé do compositor: botão fantasma com o nome e a seta; o `Menu` abre
 * para cima, agrupado por `group`, com o atual marcado. Nome longo corta com reticências.
 */
export function PromptModelMenu({
  value,
  options,
  onChange,
  label = 'Modelo',
  disabled = false,
  'data-force': force,
}: {
  value: string;
  options: PromptModelOption[];
  onChange: (value: string) => void;
  /** Nome do menu (“Modelo”): o botão diz “Modelo: Simulação local”. */
  label?: string;
  disabled?: boolean;
  /** Prancha: `hover`, `active` ou `focus` no botão. */
  'data-force'?: string;
}) {
  const current = options.find((option) => option.value === value);
  const sections: MenuSection[] = [];
  for (const option of options) {
    let section = sections.find((item) => item.label === option.group);
    if (!section) {
      section = { label: option.group, items: [] };
      sections.push(section);
    }
    section.items.push({
      label: option.label,
      description: option.description,
      meta: option.meta,
      disabled: option.disabled,
      checked: option.value === value,
      onSelect: () => onChange(option.value),
    });
  }
  return (
    <Menu
      label={label}
      align="end"
      side="top"
      width={260}
      sections={sections}
      trigger={(trigger) => (
        <Button
          {...trigger}
          variant="ghost"
          size="sm"
          trailingIcon={ChevronDown}
          className={s.model}
          disabled={disabled}
          aria-label={`${label}: ${current?.label ?? 'nenhum'}`}
          data-force={force}
        >
          <span className={s.modelLabel}>{current?.label ?? 'Escolher modelo'}</span>
        </Button>
      )}
    />
  );
}
