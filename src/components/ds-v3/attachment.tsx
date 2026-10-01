'use client';

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Ellipsis,
  LoaderCircle,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button, IconButton } from './button';
import { FileGlyph, MediaFrame, MiddleEllipsis, fileExt, fileKindOf, formatBytes } from './media';
import { Dialog, Menu, type MenuSection } from './overlays';
import s from './attachment.module.css';

export type AttachmentStatus = 'downloading' | 'done' | 'missing';

/**
 * Anexo em lista (52 px): glifo do tipo (ou miniatura 40 × 40 em imagem), nome cortado no meio
 * mantendo a extensão, “182 KB · PDF”, Baixar (→ spinner → check por 1,2 s) e ⋯.
 * A linha inteira abre a prévia. Removido: “Arquivo removido”, sem ações.
 */
export function AttachmentRow({
  name,
  size,
  type,
  href,
  preview,
  onDownload,
  onPreview,
  menu,
  status,
  force,
}: {
  name: string;
  /** Bytes. */
  size: number;
  type?: string;
  href?: string;
  /** Miniatura (imagens). */
  preview?: string;
  /** Devolva uma Promise para o spinner durar o download. */
  onDownload?: () => void | Promise<unknown>;
  onPreview?: () => void;
  menu?: MenuSection[];
  /** Controlado (pranchas) ou derivado do download. */
  status?: AttachmentStatus;
  /** Pranchas: `hover` ou `focus` na linha. */
  force?: string;
}) {
  const [local, setLocal] = useState<'idle' | 'downloading' | 'done'>('idle');
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const state = status ?? (local === 'idle' ? undefined : local);
  const missing = state === 'missing';
  const image = fileKindOf(name, type) === 'image';
  const meta = [formatBytes(size), fileExt(name)].filter(Boolean).join(' · ');

  const download = async () => {
    if (local === 'downloading') return;
    window.clearTimeout(timer.current);
    const result = onDownload?.();
    if (result instanceof Promise) {
      setLocal('downloading');
      try {
        await result;
      } catch {
        setLocal('idle');
        return;
      }
    }
    setLocal('done');
    timer.current = window.setTimeout(() => setLocal('idle'), 1200);
  };

  const nameNode = <MiddleEllipsis text={name} />;
  return (
    <div className={s.row} data-status={state} data-force={force}>
      {image && preview && !missing ? (
        <MediaFrame
          ratio="1/1"
          src={preview}
          alt=""
          radius="sm"
          fit="contain"
          className={s.thumb}
        />
      ) : (
        <FileGlyph name={name} type={type} className={s.glyph} />
      )}
      <span className={s.body}>
        {missing ? (
          <span className={s.name}>{nameNode}</span>
        ) : href && !onPreview ? (
          <a className={`${s.name} ${s.hit}`} href={href} data-force={force}>
            {nameNode}
          </a>
        ) : (
          <button
            type="button"
            className={`${s.name} ${s.hit}`}
            onClick={onPreview}
            aria-haspopup={onPreview ? 'dialog' : undefined}
            aria-label={`Abrir ${name}`}
            data-force={force}
          >
            {nameNode}
          </button>
        )}
        <span className={s.meta}>{missing ? 'Arquivo removido' : meta}</span>
      </span>
      {!missing && (
        <span className={s.actions}>
          <IconButton
            label={state === 'done' ? `${name} baixado` : `Baixar ${name}`}
            icon={state === 'done' ? Check : Download}
            variant="ghost"
            size="sm"
            loading={state === 'downloading'}
            className={s.download}
            data-done={state === 'done' || undefined}
            onClick={download}
          />
          {menu && (
            <Menu
              label={`Mais ações · ${name}`}
              align="end"
              width={200}
              sections={menu}
              trigger={(props) => (
                <IconButton
                  {...props}
                  label={`Mais ações · ${name}`}
                  icon={Ellipsis}
                  variant="ghost"
                  size="sm"
                />
              )}
            />
          )}
        </span>
      )}
    </div>
  );
}

/** Anexo no compositor de mensagem: 28 px, glifo 14, nome, tamanho e remover. `progress` = enviando. */
export function AttachmentChip({
  name,
  size,
  type,
  onRemove,
  progress,
  force,
}: {
  name: string;
  size: number;
  type?: string;
  onRemove?: () => void;
  /** 0–100 enquanto envia: spinner no lugar do glifo e linha de progresso embaixo. */
  progress?: number;
  /** Pranchas: `hover` no chip. */
  force?: string;
}) {
  const sending = progress !== undefined && progress < 100;
  return (
    <span className={s.chip} data-sending={sending || undefined} data-force={force}>
      {sending ? (
        <LoaderCircle className={s.chipSpin} aria-hidden="true" />
      ) : (
        <FileGlyph name={name} type={type} className={s.chipGlyph} />
      )}
      <span className={s.chipName}>
        <MiddleEllipsis text={name} tail={6} />
      </span>
      <span className={s.chipSize}>{sending ? `${Math.round(progress)}%` : formatBytes(size)}</span>
      {onRemove && (
        <button
          type="button"
          className={s.chipRemove}
          aria-label={sending ? `Cancelar envio de ${name}` : `Remover ${name}`}
          title={sending ? 'Cancelar envio' : 'Remover'}
          onClick={onRemove}
        >
          <X aria-hidden="true" />
        </button>
      )}
      {sending && (
        <span
          className={s.chipTrack}
          role="progressbar"
          aria-label={`Envio de ${name}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <i style={{ width: `${progress}%` }} />
        </span>
      )}
    </span>
  );
}

/**
 * Prévia de documento num diálogo grande: folha no centro, “1 de 2” com anterior/próximo e Baixar.
 * `children(page)` desenha a página.
 */
export function AttachmentPreview({
  open,
  onClose,
  name,
  meta,
  pages = 1,
  page,
  onPageChange,
  onDownload,
  children,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
  meta?: string;
  pages?: number;
  page: number;
  onPageChange: (page: number) => void;
  onDownload?: () => void;
  children: (page: number) => ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={name}
      description={meta}
      size="lg"
      footerStart={
        pages > 1 ? (
          <span className={s.pager}>
            <IconButton
              label="Página anterior"
              icon={ChevronLeft}
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            />
            <span className={s.pageCount} aria-live="polite">
              {page} de {pages}
            </span>
            <IconButton
              label="Próxima página"
              icon={ChevronRight}
              variant="ghost"
              size="sm"
              disabled={page >= pages}
              onClick={() => onPageChange(page + 1)}
            />
          </span>
        ) : undefined
      }
      footer={
        <Button icon={Download} onClick={onDownload}>
          Baixar
        </Button>
      }
    >
      <div className={s.well}>
        <div key={page} className={s.sheet}>
          {children(page)}
        </div>
      </div>
    </Dialog>
  );
}
