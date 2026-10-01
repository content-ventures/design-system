'use client';

import { CircleAlert, CircleCheck } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import s from './inputs.module.css';

export type FormError = {
  /** `id` do controle (o mesmo do `<label for>`): o link leva o foco até ele. */
  id: string;
  label: string;
  message: string;
  /** Corrigido depois do envio: fica no lugar, riscado. Com `focusKey` é calculado sozinho. */
  resolved?: boolean;
};

/** Leva foco e rolagem até o controle do erro (respiro de 96 px para barras fixas). */
export function focusField(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const target = el.matches('input, textarea, select, button, [tabindex]')
    ? el
    : (el.querySelector<HTMLElement>('input, textarea, select, button, [tabindex]') ?? el);
  if (!target.style.scrollMarginBlock) target.style.scrollMarginBlock = '96px';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.focus({ preventScroll: true });
  target.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
}

const listKey = (errors: FormError[]) =>
  errors.map((error) => `${error.id}:${error.message}`).join('|');

/**
 * Resumo dos campos a revisar, acima do formulário, ao tentar enviar. Cada linha leva ao campo.
 *
 * Com `focusKey` (mude a cada envio), o resumo é a foto do último envio: recebe o foco, e até o
 * próximo envio a lista não muda de tamanho — o campo corrigido fica no lugar, riscado e apagado,
 * e só o título conta o que falta. Nada pula entre um envio e outro (o clique seguinte não se
 * perde). Um envio sem erros fecha o bloco. Sem `focusKey`, mostra `errors` como vierem.
 */
export function ErrorSummary({
  errors,
  title,
  focusKey,
  className = '',
}: {
  errors: FormError[];
  /** Padrão: “Revise N campos”; recebe quantos ainda faltam. */
  title?: (count: number) => string;
  /** Mude a cada envio: tira a foto dos erros e manda o foco ao resumo. */
  focusKey?: number | string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const frozen = focusKey !== undefined;
  const [snapshot, setSnapshot] = useState({ at: focusKey, errors });
  if (frozen && snapshot.at !== focusKey) setSnapshot({ at: focusKey, errors });
  const source = frozen ? snapshot.errors : errors;
  // Ao fechar, a lista anterior fica no lugar enquanto o bloco recolhe.
  const key = listKey(source);
  const [last, setLast] = useState({ key, errors: source });
  if (source.length && key !== last.key) setLast({ key, errors: source });
  const open = source.length > 0;
  const list = open ? source : last.errors;
  const live = new Set(errors.map((error) => error.id));
  const isOpen = (error: FormError) => !error.resolved && (!frozen || live.has(error.id));
  const count = list.filter(isOpen).length;
  const done = list.length > 0 && count === 0;

  useEffect(() => {
    if (focusKey !== undefined && open) ref.current?.focus({ preventScroll: false });
    // Só o envio (focusKey) chama o foco; a contagem mudar não rouba o foco do campo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey]);

  return (
    <div
      className={`${s.summaryWrap} ${className}`}
      data-open={open || undefined}
      aria-hidden={!open || undefined}
    >
      <div>
        <div
          ref={ref}
          className={s.summary}
          data-done={done || undefined}
          role="group"
          aria-labelledby={titleId}
          tabIndex={-1}
          inert={!open || undefined}
        >
          {done ? <CircleCheck aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
          <div className={s.summaryBody}>
            <p id={titleId} className={s.summaryTitle}>
              <span key={count}>
                {done
                  ? 'Campos revisados'
                  : title
                    ? title(count)
                    : `Revise ${count} ${count === 1 ? 'campo' : 'campos'}`}
              </span>
            </p>
            <ul className={s.summaryList}>
              {list.map((error) => {
                const pending = isOpen(error);
                return (
                  <li key={error.id} data-resolved={!pending || undefined}>
                    <button type="button" onClick={() => focusField(error.id)}>
                      <b>{error.label}</b> — {error.message}
                      {!pending && <span className={s.srOnly}>, corrigido</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Contagem curta para o rodapé de uma etapa (“Revise os 2 campos sinalizados”), igual à criação de
 * campanha: os erros ficam no próprio campo e nada entra acima do formulário. Coloque dentro de
 * uma região `role="status"` que já exista na tela.
 */
export function ErrorCount({ count, className = '' }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span className={`${s.errorCount} ${className}`}>
      <CircleAlert aria-hidden="true" />
      <span key={count} className={s.errorCountText}>
        Revise {count === 1 ? 'o campo sinalizado' : `os ${count} campos sinalizados`}
      </span>
    </span>
  );
}
