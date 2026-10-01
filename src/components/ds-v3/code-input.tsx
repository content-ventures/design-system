'use client';

import { CircleAlert, CircleCheck, LoaderCircle } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import s from './inputs.module.css';

export type CodeStatus = 'idle' | 'verifying' | 'invalid' | 'valid';

const DEFAULT_MESSAGE: Record<Exclude<CodeStatus, 'idle'>, string> = {
  verifying: 'Verificando…',
  invalid: 'Código incorreto',
  valid: 'Código confirmado',
};

/**
 * Código de verificação em caixas (6 por padrão, respiro maior no meio). Avança sozinho, Backspace
 * volta, ←/→ andam, colar preenche tudo e o teclado do celular sugere o código do SMS/e-mail
 * (`one-time-code`). Um nome acessível só, no grupo; cada caixa diz “Dígito N de 6”.
 */
export function CodeInput({
  length = 6,
  value,
  onChange,
  onComplete,
  status = 'idle',
  disabled,
  label = 'Código de verificação',
  message,
  describedBy,
  autoFocus,
  'data-force': force,
}: {
  length?: number;
  /** Só dígitos, contíguos (“4829”). */
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  status?: CodeStatus;
  disabled?: boolean;
  label?: string;
  /** Troca o texto padrão da linha de estado. */
  message?: string;
  describedBy?: string;
  autoFocus?: boolean;
  /** Pranchas: desenha o foco parado na próxima caixa. */
  'data-force'?: string;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  // Comprimento já pedido ao pai: o foco anda antes de o novo valor voltar por props.
  const filled = useRef(value.length);
  useEffect(() => {
    filled.current = value.length;
  }, [value]);
  const statusId = useId();
  const locked = disabled || status === 'verifying';
  const chars = Array.from({ length }, (_, index) => value[index] ?? '');
  // Código errado: o código inteiro fica “selecionado” — o próximo dígito substitui tudo e
  // Backspace limpa tudo. Clicar numa caixa ou andar com as setas volta à edição dígito a dígito.
  const [armed, setArmed] = useState(false);
  const [seen, setSeen] = useState(status);
  if (seen !== status) {
    setSeen(status);
    setArmed(status === 'invalid' && value.length > 0);
  }
  const cursor = armed ? 0 : Math.min(value.length, length - 1);

  const focusAt = (index: number) => {
    const el = refs.current[Math.max(0, Math.min(index, length - 1))];
    el?.focus();
    el?.select();
  };

  // Código errado: o foco volta à primeira caixa, pronto para digitar de novo. Só quando o estado
  // muda — nunca ao montar (nem na segunda passada do modo estrito).
  const lastStatus = useRef(status);
  useEffect(() => {
    if (lastStatus.current === status) return;
    lastStatus.current = status;
    if (status === 'invalid') focusAt(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function update(next: string, focus: number) {
    const clean = next.replace(/\D/g, '').slice(0, length);
    setArmed(false);
    filled.current = clean.length;
    onChange(clean);
    focusAt(focus);
    if (clean.length === length && clean !== value) onComplete?.(clean);
  }

  function onType(index: number, raw: string) {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return;
    // Preenchimento automático ou colagem pelo teclado: o código inteiro chega numa caixa só.
    if (digits.length > 2) {
      update(digits, digits.length);
      return;
    }
    const old = chars[index] ?? '';
    const digit = digits.length === 2 ? (digits[0] === old ? digits[1] : digits[0]) : digits;
    if (armed) {
      update(digit ?? '', 1);
      return;
    }
    const at = Math.min(index, value.length);
    update(`${value.slice(0, at)}${digit ?? ''}${value.slice(at + 1)}`, at + 1);
  }

  function onKey(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (armed && (event.key === 'Backspace' || event.key === 'Delete')) {
      event.preventDefault();
      update('', 0);
    } else if (event.key === 'Backspace') {
      event.preventDefault();
      if (chars[index]) update(`${value.slice(0, index)}${value.slice(index + 1)}`, index);
      else if (index > 0) update(value.slice(0, index - 1), index - 1);
    } else if (event.key === 'Delete') {
      event.preventDefault();
      update(`${value.slice(0, index)}${value.slice(index + 1)}`, index);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setArmed(false);
      focusAt(index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      setArmed(false);
      focusAt(Math.min(index + 1, value.length));
    } else if (event.key === 'Home') {
      event.preventDefault();
      setArmed(false);
      focusAt(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setArmed(false);
      focusAt(value.length);
    }
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    const digits = event.clipboardData.getData('text').replace(/\D/g, '');
    if (!digits) return;
    event.preventDefault();
    update(digits, digits.length);
  }

  const line = status === 'idle' ? undefined : (message ?? DEFAULT_MESSAGE[status]);

  return (
    <div className={s.code} data-status={status}>
      <div
        role="group"
        aria-label={label}
        aria-describedby={
          [describedBy, line ? statusId : undefined].filter(Boolean).join(' ') || undefined
        }
        className={s.boxes}
        data-status={status}
        data-disabled={disabled || undefined}
        data-armed={armed || undefined}
      >
        {chars.map((char, index) => (
          <span key={index} className={s.box} data-filled={char ? true : undefined}>
            <input
              ref={(node) => {
                refs.current[index] = node;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              aria-label={`Dígito ${index + 1} de ${length}`}
              aria-invalid={status === 'invalid' || undefined}
              autoFocus={autoFocus && index === 0}
              disabled={locked}
              // Só a próxima caixa vazia (e as preenchidas) recebem o foco: o código fica contíguo.
              tabIndex={index === cursor ? 0 : -1}
              value={char}
              placeholder=" "
              data-force={force && index === cursor ? force : undefined}
              onFocus={(event) => {
                if (index > filled.current) focusAt(filled.current);
                else event.target.select();
              }}
              onMouseDown={(event) => {
                setArmed(false);
                if (index > value.length) {
                  event.preventDefault();
                  focusAt(value.length);
                }
              }}
              onChange={(event) => onType(index, event.target.value)}
              onKeyDown={(event) => onKey(index, event)}
              onPaste={onPaste}
            />
          </span>
        ))}
      </div>
      <p id={statusId} className={s.codeLine} data-status={status} aria-live="polite">
        {status === 'verifying' && <LoaderCircle className={s.codeSpin} aria-hidden="true" />}
        {status === 'invalid' && <CircleAlert aria-hidden="true" />}
        {status === 'valid' && <CircleCheck aria-hidden="true" />}
        {line}
      </p>
    </div>
  );
}
