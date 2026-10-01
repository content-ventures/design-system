'use client';

import { useId, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileText,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Button, IconButton } from './button';
import s from './files.module.css';

export function FileDropzone({
  onFiles,
  accept,
  hint,
  disabled = false,
  multiple = true,
  compact = false,
}: {
  onFiles: (files: File[]) => void;
  accept: string;
  hint: string;
  disabled?: boolean;
  multiple?: boolean;
  compact?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const uid = useId();
  const [dragging, setDragging] = useState(false);
  return (
    <div
      className={s.dropzone}
      data-compact={compact || undefined}
      data-dragging={dragging || undefined}
      data-disabled={disabled || undefined}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!disabled)
          onFiles(Array.from(event.dataTransfer.files).slice(0, multiple ? undefined : 1));
      }}
    >
      <span className={s.uploadMark}>
        <Upload size={22} aria-hidden="true" />
      </span>
      <strong>Arraste seus arquivos para cá</strong>
      <p id={uid}>{hint}</p>
      <Button disabled={disabled} onClick={() => ref.current?.click()}>
        Selecionar arquivos
      </Button>
      <input
        ref={ref}
        className={s.hidden}
        aria-hidden="true"
        tabIndex={-1}
        type="file"
        aria-label="Selecionar arquivos"
        aria-describedby={uid}
        multiple={multiple}
        accept={accept}
        disabled={disabled}
        onChange={(event) => {
          onFiles(Array.from(event.target.files ?? []));
          event.target.value = '';
        }}
      />
    </div>
  );
}

export type FileItemProps = {
  name: string;
  size: number;
  status: 'ready' | 'uploading' | 'complete' | 'error' | 'cancelled';
  progress?: number;
  message?: string;
  onRemove?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  onPreview?: () => void;
};
export function formatFileSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`;
}
export function FileItem({
  name,
  size,
  status,
  progress = 0,
  message,
  onRemove,
  onCancel,
  onRetry,
  onPreview,
}: FileItemProps) {
  const percent = Math.min(100, Math.max(0, progress));
  const extension = name.includes('.') ? name.split('.').pop()?.slice(0, 4).toUpperCase() : 'ARQ';
  const text =
    message ??
    {
      ready: 'Pronto para envio',
      uploading: 'Enviando',
      complete: 'Concluído',
      error: 'Falha no envio',
      cancelled: 'Cancelado',
    }[status];
  return (
    <article className={s.file} data-status={status} data-extension={extension} aria-label={name}>
      <span className={s.fileIcon} aria-hidden="true">
        <FileText size={30} />
        <b>{extension}</b>
      </span>
      <div className={s.fileContent}>
        <strong title={name}>{name}</strong>
        <span className={s.fileMeta}>
          {formatFileSize(size)}
          <span>·</span>
          <span className={s.fileState}>
            {status === 'complete' ? (
              <CheckCircle2 size={12} />
            ) : status === 'error' ? (
              <AlertCircle size={12} />
            ) : null}
            {text}
          </span>
        </span>
      </div>
      <div className={s.actions}>
        {onPreview && (
          <IconButton label={`Ver ${name}`} icon={Eye} variant="ghost" onClick={onPreview} />
        )}
        {onRetry && (status === 'error' || status === 'cancelled') && (
          <IconButton
            label={`Tentar novamente ${name}`}
            icon={RotateCcw}
            variant="ghost"
            onClick={onRetry}
          />
        )}
        {status === 'uploading' && onCancel ? (
          <IconButton label={`Cancelar ${name}`} icon={X} variant="ghost" onClick={onCancel} />
        ) : onRemove ? (
          <IconButton label={`Remover ${name}`} icon={Trash2} variant="ghost" onClick={onRemove} />
        ) : null}
      </div>
      {status === 'uploading' && (
        <div className={s.progressRow}>
          <div
            className={s.progress}
            role="progressbar"
            aria-label={`Envio de ${name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <span style={{ width: `${percent}%` }} />
          </div>
          <small>{percent}%</small>
        </div>
      )}
    </article>
  );
}
