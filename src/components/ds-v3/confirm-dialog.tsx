'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from './button';
import { Field, Input } from './fields';
import { Dialog, DialogFrame } from './overlays';
import s from './overlays.module.css';

export type ConfirmTone = 'default' | 'danger';

/** Rótulo do botão único do aviso quando o consumidor não nomeia outro. */
const ACKNOWLEDGE_LABEL = 'Entendi';

/** Pergunta (padrão): Cancelar + o botão que nomeia a ação. */
type AskMode = {
  acknowledge?: false;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  /** Texto que a pessoa digita para liberar a ação (ex.: o número do P.I.). */
  typeToConfirm?: string;
};

/**
 * Só aviso: um bloqueio que a pessoa não resolve na hora (“Você não tem permissão para isso”).
 * Um botão primário, sem Cancelar, sem tom destrutivo e sem digitação.
 */
type AcknowledgeMode = {
  acknowledge: true;
  /** Padrão: “Entendi”. */
  confirmLabel?: string;
  cancelLabel?: never;
  tone?: never;
  typeToConfirm?: never;
};

type ConfirmRun = () => void | Promise<unknown>;

export type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  /** Conteúdo curto acima do campo (ex.: uma opção que acompanha a ação). */
  extra?: ReactNode;
  contained?: boolean;
} & ((AskMode & { onConfirm: ConfirmRun }) | (AcknowledgeMode & { onConfirm?: ConfirmRun }));

/**
 * Confirmação curta (A-23): pergunta a ação (“Excluir 2 campanhas?”), diz a consequência numa
 * frase e nomeia o resultado no botão. Sem ícone, sem “Tem certeza?”, sem Sim/Não.
 * Foco inicial: Cancelar quando destrutiva, o botão de confirmar quando não.
 * `typeToConfirm`: o botão destrutivo só libera quando o texto digitado bate — o único
 * indisponível-até-válido do sistema. `onConfirm` pode ser assíncrono: o botão carrega e a camada
 * fecha quando ele termina; se falhar, fica aberta para tentar de novo.
 * `acknowledge`: só avisa um bloqueio — um botão primário (“Entendi”) com o foco, sem Cancelar;
 * `onConfirm` é opcional e o botão fecha. Esc, véu e X fecham como sempre; no celular o botão
 * ocupa a largura toda, como os dois da pergunta.
 */
export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  acknowledge = false,
  confirmLabel = ACKNOWLEDGE_LABEL,
  cancelLabel = 'Cancelar',
  tone = 'default',
  onConfirm,
  typeToConfirm,
  extra,
  contained = false,
}: ConfirmDialogProps) {
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

  // O aviso ignora tom e digitação mesmo vindos de JS sem tipos: um botão só, sempre primário.
  const danger = !acknowledge && tone === 'danger';
  const code = acknowledge ? undefined : typeToConfirm;
  const locked = code !== undefined && typed.trim() !== code;

  async function confirm() {
    if (busy || locked) return;
    setBusy(true);
    try {
      await onConfirm?.();
      if (alive.current) onClose();
    } catch {
      /* falhou: continua aberta, o botão volta a responder */
    } finally {
      if (alive.current) setBusy(false);
    }
  }

  const body =
    extra || code !== undefined ? (
      <ConfirmBody
        extra={extra}
        code={code}
        typed={typed}
        onType={setTyped}
        onSubmit={confirm}
        disabled={busy}
      />
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
          {!acknowledge && (
            <Button
              data-autofocus={danger && code === undefined ? true : undefined}
              disabled={busy}
              onClick={onClose}
            >
              {cancelLabel}
            </Button>
          )}
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

/**
 * A confirmação parada, sem camada — para pranchas. `typed`/`busy` desenham os estados;
 * `acknowledge` desenha o aviso de um botão só e `compact`, o desenho do celular (≤ 640).
 */
export function ConfirmFrame({
  title,
  description,
  acknowledge = false,
  confirmLabel = ACKNOWLEDGE_LABEL,
  cancelLabel = 'Cancelar',
  tone = 'default',
  typeToConfirm,
  typed = '',
  busy = false,
  focus,
  extra,
  width,
  compact = false,
}: {
  title: ReactNode;
  description?: ReactNode;
  typed?: string;
  busy?: boolean;
  /** Onde o foco está: `cancel`, `confirm` ou `field`. */
  focus?: 'cancel' | 'confirm' | 'field';
  extra?: ReactNode;
  width?: number | string;
  /** Desenho do celular (≤ 640): os botões do rodapé dividem a largura. */
  compact?: boolean;
} & (AskMode | AcknowledgeMode)) {
  const danger = !acknowledge && tone === 'danger';
  const code = acknowledge ? undefined : typeToConfirm;
  const locked = code !== undefined && typed.trim() !== code;
  return (
    <DialogFrame
      size="sm"
      width={width}
      compact={compact}
      divided={false}
      title={title}
      description={description}
      footer={
        <>
          {!acknowledge && (
            <Button disabled={busy} data-force={focus === 'cancel' ? 'focus' : undefined}>
              {cancelLabel}
            </Button>
          )}
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
      {extra || code !== undefined ? (
        <ConfirmBody
          extra={extra}
          code={code}
          typed={typed}
          force={focus === 'field' ? 'focus' : undefined}
        />
      ) : null}
    </DialogFrame>
  );
}
