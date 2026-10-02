'use client';

import { Check, CircleAlert, FileUp, Trash2, X } from 'lucide-react';
import { useId, useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode } from 'react';
import { IconButton } from './button';
import { LinkButton } from './link';
import { FileGlyph, MiddleEllipsis, fileExt, formatBytes } from './media';
import s from './upload.module.css';

export type UploadFormat = { w: number; h: number };
export type RejectedFile = { file: File; reason: 'type' | 'size' };

function accepts(file: File, accept?: string) {
  if (!accept) return true;
  return accept
    .split(',')
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) =>
      rule.startsWith('.')
        ? file.name.toLowerCase().endsWith(rule)
        : rule.endsWith('/*')
          ? file.type.startsWith(rule.slice(0, -1))
          : file.type === rule,
    );
}

/** Quadro do formato na proporção exata (“970 × 250”), fio b-300. Com `src`, mostra a peça. */
export function FormatFrame({
  format,
  src,
  max = 120,
}: {
  format?: UploadFormat;
  src?: string;
  /** Lado maior do quadro, em px. */
  max?: number;
}) {
  const ratio = format ? format.w / format.h : 4 / 3;
  const w = ratio >= 1 ? max : Math.max(30, Math.round(max * 0.6 * ratio));
  const h = ratio >= 1 ? Math.max(24, Math.round(max / ratio)) : Math.round(max * 0.6);
  return (
    <span
      className={s.format}
      style={{ width: w, height: h, aspectRatio: `${w} / ${h}` }}
      data-image={src ? '' : undefined}
      aria-hidden="true"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- prévia local (blob: ou data:), fora do otimizador
        <img src={src} alt="" draggable={false} />
      ) : format ? (
        <span>{`${format.w} × ${format.h}`}</span>
      ) : null}
    </span>
  );
}

/**
 * Área de envio. Repouso com fio sólido; o tracejado só aparece **durante** o arrasto.
 * A área inteira é um botão: clique, Enter ou Espaço abrem o seletor. Altura estável (78).
 * `disabled` (ex.: “Enviar depois”) recolhe para uma linha.
 */
export function Dropzone({
  accept,
  maxSize = 25 * 1024 * 1024,
  spec,
  format,
  onFiles,
  disabled = false,
  invalid = false,
  error,
  multiple = false,
  title,
  disabledText = 'Peça pendente',
  id,
  describedBy,
  dragging,
  force,
}: {
  accept?: string;
  /** Limite por arquivo, em bytes (padrão 25 MB). */
  maxSize?: number;
  /** Legenda única: formatos · medidas · limite (“PNG, JPG ou WEBP · 970 × 250 px · até 25 MB”). */
  spec: string;
  /** Medidas da peça: desenha o quadro na proporção. */
  format?: UploadFormat;
  onFiles: (files: File[], rejected: RejectedFile[]) => void;
  disabled?: boolean;
  invalid?: boolean;
  /** Mensagem no lugar da especificação quando `invalid`. */
  error?: ReactNode;
  multiple?: boolean;
  title?: string;
  disabledText?: string;
  id?: string;
  describedBy?: string;
  /** Pranchas: arrasto parado. */
  dragging?: boolean;
  /** Pranchas: `hover`, `active` ou `focus`. */
  force?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const specId = useId();
  const isOver = !disabled && (dragging ?? over);
  const heading =
    title ??
    (multiple ? 'Arraste arquivos aqui ou escolha' : 'Arraste a peça aqui ou escolha um arquivo');

  const take = (list: FileList | null) => {
    if (!list || disabled) return;
    const files = Array.from(list).slice(0, multiple ? undefined : 1);
    const ok: File[] = [];
    const rejected: RejectedFile[] = [];
    for (const file of files) {
      if (!accepts(file, accept)) rejected.push({ file, reason: 'type' });
      else if (file.size > maxSize) rejected.push({ file, reason: 'size' });
      else ok.push(file);
    }
    onFiles(ok, rejected);
  };
  const open = () => {
    if (!disabled) inputRef.current?.click();
  };
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open();
    }
  };
  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    if (!over) setOver(true);
  };
  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setOver(false);
  };

  return (
    <div className={s.dropzone}>
      <div
        id={id ? `${id}-dropzone` : undefined}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-describedby={[specId, describedBy].filter(Boolean).join(' ')}
        className={s.zone}
        data-over={isOver || undefined}
        data-invalid={(invalid && !disabled) || undefined}
        data-disabled={disabled || undefined}
        data-force={force}
        onClick={open}
        onKeyDown={onKey}
        onDragEnter={onDragOver}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={(event) => {
          if (disabled) return;
          event.preventDefault();
          setOver(false);
          take(event.dataTransfer.files);
        }}
      >
        <input
          id={id}
          ref={inputRef}
          type="file"
          tabIndex={-1}
          aria-hidden="true"
          className={s.input}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(event) => {
            take(event.target.files);
            event.target.value = '';
          }}
        />
        {disabled ? (
          <span className={s.line}>
            <span className={s.lineText}>{disabledText}</span>
            <span id={specId} className={s.lineSpec}>
              {spec}
            </span>
          </span>
        ) : (
          <>
            {format ? (
              <span className={s.formatSlot}>
                <FormatFrame format={format} />
              </span>
            ) : (
              <FileUp className={s.glyph} aria-hidden="true" />
            )}
            <span className={s.text}>
              <span className={s.title} aria-live="polite">
                <span className={s.titleRest}>{heading}</span>
                <span className={s.titleOver} aria-hidden={!isOver}>
                  Solte para enviar
                </span>
              </span>
              {invalid && error ? (
                <span id={specId} className={s.error}>
                  <CircleAlert aria-hidden="true" />
                  {error}
                </span>
              ) : (
                <span id={specId} className={s.spec}>
                  {spec}
                </span>
              )}
            </span>
            <span className={s.pick} aria-hidden="true">
              Escolher arquivo
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Arquivo na área de envio: enviando (barra de 4 px, %, “1,2 de 1,9 MB”, cancelar), concluído
 * (miniatura, medidas, conferência) ou com erro (mensagem vermelha + “Escolher outro”).
 */
export function FileRow({
  name,
  size,
  type,
  progress = 0,
  status,
  preview,
  format,
  meta,
  message,
  compact = false,
  onRemove,
  onRetry,
  onCancel,
  retryLabel = 'Escolher outro',
}: {
  name: string;
  /** Bytes. */
  size: number;
  type?: string;
  /** 0–100, enquanto `uploading`. */
  progress?: number;
  status: 'uploading' | 'done' | 'error';
  /** Prévia da imagem (blob: ou data:). */
  preview?: string;
  /** Medidas da peça: o quadro da miniatura segue a proporção. */
  format?: UploadFormat;
  /** Linha de meta. Padrão: “182 KB · PDF”. */
  meta?: string;
  /** Conferência (concluído) ou motivo do erro. */
  message?: ReactNode;
  /** Linha de 52 em listas de vários arquivos (sem miniatura grande). */
  compact?: boolean;
  onRemove?: () => void;
  onRetry?: () => void;
  onCancel?: () => void;
  retryLabel?: string;
}) {
  const pct = Math.round(Math.max(0, Math.min(100, progress)));
  const sent = (size * pct) / 100;
  const ext = fileExt(name);
  const metaLine = meta ?? [formatBytes(size), ext].filter(Boolean).join(' · ');
  const showThumb = !compact && (preview || format);
  return (
    <div className={s.row} data-status={status} data-compact={compact || undefined}>
      {showThumb ? (
        <span className={s.thumbSlot}>
          <FormatFrame format={format} src={preview} />
        </span>
      ) : (
        <FileGlyph name={name} type={type} className={s.rowGlyph} />
      )}
      <span className={s.body}>
        <span className={s.name}>
          <MiddleEllipsis text={name} />
        </span>
        {status === 'uploading' ? (
          <span className={s.progressLine}>
            <span
              className={s.track}
              role="progressbar"
              aria-label={`Envio de ${name}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
            >
              <i style={{ width: `${pct}%` }} />
            </span>
            <span className={s.pct}>{pct}%</span>
          </span>
        ) : null}
        <span className={s.meta}>
          {status === 'uploading' ? `${formatMb(sent, size)} de ${formatBytes(size)}` : metaLine}
        </span>
        {status === 'done' && message && (
          <span className={s.ok}>
            <Check aria-hidden="true" />
            <span className={s.msg}>{message}</span>
          </span>
        )}
        {status === 'error' && message && (
          <span className={s.fail} role="alert">
            <CircleAlert aria-hidden="true" />
            <span className={s.msg}>
              {message}
              {onRetry && (
                <>
                  {' '}
                  <LinkButton className={s.retry} onClick={onRetry}>
                    {retryLabel}
                  </LinkButton>
                </>
              )}
            </span>
          </span>
        )}
      </span>
      <span className={s.actions}>
        {status === 'uploading' ? (
          <IconButton
            label={`Cancelar envio de ${name}`}
            icon={X}
            variant="ghost"
            size="sm"
            onClick={onCancel}
          />
        ) : (
          <>
            {onRemove && (
              <IconButton
                label={`Remover ${name}`}
                icon={Trash2}
                variant="ghost"
                size="sm"
                tone="danger"
                onClick={onRemove}
              />
            )}
          </>
        )}
      </span>
    </div>
  );
}

/** Parte enviada na mesma unidade do total (“1,2 de 1,9 MB”, “96 de 182 KB”). */
function formatMb(sent: number, total: number) {
  if (total < 1024 * 1024) return `${Math.round(sent / 1024).toLocaleString('pt-BR')}`;
  const mb = sent / (1024 * 1024);
  return mb.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
