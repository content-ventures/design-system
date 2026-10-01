'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from './button';
import { Field, Input } from './fields';
import { Dialog, DialogFrame } from './overlays';
import s from './overlays.module.css';

export type ConfirmTone = 'default' | 'danger';

/**
 * Confirmação curta (A-23): pergunta a ação (“Excluir 2 campanhas?”), diz a consequência numa
 * frase e nomeia o resultado no botão. Sem ícone, sem “Tem certeza?”, sem Sim/Não.
 * Foco inicial: Cancelar quando destrutiva, o botão de confirmar quando não.
 * `typeToConfirm`: o botão destrutivo só libera quando o texto digitado bate — o único
 * indisponível-até-válido do sistema. `onConfirm` pode ser assíncrono: o botão carrega e a camada
 * fecha quando ele termina; se falhar, fica aberta para tentar de novo.
 */
export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  tone = 'default',
  onConfirm,
  typeToConfirm,
  extra,
  contained = false,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  onConfirm: () => void | Promise<unknown>;
  /** Texto que a pessoa digita para liberar a ação (ex.: o número do P.I.). */
  typeToConfirm?: string;
  /** Conteúdo curto acima do campo (ex.: uma opção que acompanha a ação). */
  extra?: ReactNode;
  contained?: boolean;
}) {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  // Cada abertura começa do zero.
  const [session, setSession] = useState(open);
  if (open !== session) {
    setSession(open);
    if (open) {
      setTyped('');
      setBusy(false);
    }
  }

  const danger = tone === 'danger';
  const locked = typeToConfirm !== undefined && typed.trim() !== typeToConfirm;

  async function confirm() {
    if (busy || locked) return;
    setBusy(true);
    try {
      await onConfirm();
      if (alive.current) onClose();
    } catch {
      /* falhou: continua aberta, o botão volta a responder */
    } finally {
      if (alive.current) setBusy(false);
    }
  }

  const body =
    extra || typeToConfirm !== undefined ? (
      <ConfirmBody extra={extra} code={typeToConfirm} typed={typed} onType={setTyped} onSubmit={confirm} disabled={busy} />
    ) : null;

  return (
    <Dialog
      open={open}
      onClose={busy ? () => undefined : onClose}
      size="sm"
      divided={false}
      dismissible={!busy}
      dirty={typed.length > 0}
      contained={contained}
      title={title}
      description={description}
      footer={
        <>
          <Button data-autofocus={danger && typeToConfirm === undefined ? true : undefined} disabled={busy} onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            data-autofocus={!danger ? true : undefined}
            disabled={locked}
            loading={busy}
            onClick={confirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {body}
    </Dialog>
  );
}

function ConfirmBody({
  extra,
  code,
  typed,
  onType,
  onSubmit,
  disabled,
  force,
}: {
  extra?: ReactNode;
  code?: string;
  typed: string;
  onType?: (value: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  force?: string;
}) {
  return (
    <div className={s.confirmBody}>
      {extra}
      {code !== undefined && (
        <Field label={`Digite ${code} para confirmar`}>
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              value={typed}
              autoComplete="off"
              spellCheck={false}
              placeholder={code}
              disabled={disabled}
              data-autofocus
              data-force={force}
              readOnly={!onType}
              onChange={(event) => onType?.(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  onSubmit?.();
                }
              }}
            />
          )}
        </Field>
      )}
    </div>
  );
}

/** A confirmação parada, sem camada — para pranchas. `typed`/`busy` desenham os estados. */
export function ConfirmFrame({
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  tone = 'default',
  typeToConfirm,
  typed = '',
  busy = false,
  focus,
  extra,
  width,
}: {
  title: ReactNode;
  description?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  typeToConfirm?: string;
  typed?: string;
  busy?: boolean;
  /** Onde o foco está: `cancel`, `confirm` ou `field`. */
  focus?: 'cancel' | 'confirm' | 'field';
  extra?: ReactNode;
  width?: number | string;
}) {
  const danger = tone === 'danger';
  const locked = typeToConfirm !== undefined && typed.trim() !== typeToConfirm;
  return (
    <DialogFrame
      size="sm"
      width={width}
      divided={false}
      title={title}
      description={description}
      footer={
        <>
          <Button disabled={busy} data-force={focus === 'cancel' ? 'focus' : undefined}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            disabled={locked}
            loading={busy}
            data-force={focus === 'confirm' ? 'focus' : undefined}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {extra || typeToConfirm !== undefined ? (
        <ConfirmBody extra={extra} code={typeToConfirm} typed={typed} force={focus === 'field' ? 'focus' : undefined} />
      ) : null}
    </DialogFrame>
  );
}
