'use client';

import {
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  File as FileIcon,
  ImageOff,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import s from './media.module.css';

/* ——————————————————————————— Arquivos ——————————————————————————— */

export type FileKind = 'image' | 'pdf' | 'doc' | 'sheet' | 'video' | 'archive' | 'other';

const kindByExt: Record<string, FileKind> = {
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  webp: 'image',
  gif: 'image',
  svg: 'image',
  pdf: 'pdf',
  doc: 'doc',
  docx: 'doc',
  txt: 'doc',
  odt: 'doc',
  xls: 'sheet',
  xlsx: 'sheet',
  csv: 'sheet',
  mp4: 'video',
  mov: 'video',
  webm: 'video',
  zip: 'archive',
  rar: 'archive',
};

/** Extensão em caixa alta, sem ponto (“PDF”). */
export function fileExt(name: string) {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toUpperCase() : '';
}

export function fileKindOf(name: string, type?: string): FileKind {
  if (type?.startsWith('image/')) return 'image';
  if (type?.startsWith('video/')) return 'video';
  if (type === 'application/pdf') return 'pdf';
  return kindByExt[fileExt(name).toLowerCase()] ?? 'other';
}

const glyphByKind: Record<FileKind, LucideIcon> = {
  image: FileImage,
  pdf: FileText,
  doc: FileText,
  sheet: FileSpreadsheet,
  video: FileVideo,
  archive: FileArchive,
  other: FileIcon,
};

/** Glifo do tipo de arquivo: contorno, sem bloco colorido. */
export function FileGlyph({
  name,
  type,
  className,
}: {
  name: string;
  type?: string;
  className?: string;
}) {
  const Icon = glyphByKind[fileKindOf(name, type)];
  return <Icon className={className} aria-hidden="true" />;
}

/** Tamanho em pt-BR: “24 KB”, “1,9 MB”. Abaixo de 1 KB arredonda para 1 KB. */
export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024)
    return `${Math.max(1, Math.round(bytes / 1024)).toLocaleString('pt-BR')} KB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toLocaleString('pt-BR', { maximumFractionDigits: mb < 10 ? 1 : 0, minimumFractionDigits: mb < 10 ? 1 : 0 })} MB`;
}

/**
 * Nome longo cortado no meio: o começo some em “…”, o fim e a extensão ficam
 * (“briefing-colecao-pri…-final.pdf”). O nome inteiro vai no `title`.
 */
export function MiddleEllipsis({
  text,
  tail = 8,
  className = '',
}: {
  text: string;
  tail?: number;
  className?: string;
}) {
  const dot = text.lastIndexOf('.');
  const keep = Math.min(text.length, (dot > 0 ? text.length - dot : 0) + tail);
  const head = text.slice(0, text.length - keep);
  const end = text.slice(text.length - keep);
  return (
    <span className={`${s.middle} ${className}`} title={text}>
      {head && <span className={s.middleHead}>{head}</span>}
      <span className={s.middleTail}>{end}</span>
    </span>
  );
}

/* ——————————————————————————— MediaFrame ——————————————————————————— */

export type MediaState = 'loading' | 'loaded' | 'error';
export type MediaRatio = '970/250' | '300/250' | '1/1' | '4/3' | '16/9' | (string & {});

/** “970/250” → “970 / 250” (aspect-ratio). */
export function ratioOf(ratio: MediaRatio) {
  return ratio.replace(/\s*[/:x×]\s*/, ' / ');
}

/**
 * Moldura de imagem na proporção exata: fundo g-50, fio interno de 1px, raio 8, recorte.
 * Carregando = bloco chapado que pulsa; carregada = entra em 180 ms; sem arquivo ou com erro =
 * `ImageOff` + “Imagem indisponível”. `children` substitui a imagem (desenho inline, vídeo).
 */
export function MediaFrame({
  ratio = '16/9',
  src,
  alt,
  fit = 'cover',
  caption,
  state,
  radius = 'md',
  className = '',
  style,
  children,
}: {
  ratio?: MediaRatio;
  src?: string;
  alt: string;
  fit?: 'cover' | 'contain';
  /** Legenda curta embaixo, 12 muted tabular (“970 × 250 px · PNG”). */
  caption?: ReactNode;
  /** Pranchas: estado parado. No produto o carregamento decide. */
  state?: MediaState;
  radius?: 'sm' | 'md' | 'lg' | 'none';
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState<{ src: string; ok: boolean } | null>(null);
  const known = loaded && loaded.src === src ? loaded : null;
  const status: MediaState =
    state ??
    (children ? 'loaded' : !src ? 'error' : known ? (known.ok ? 'loaded' : 'error') : 'loading');

  useEffect(() => {
    const img = imgRef.current;
    if (!src || !img || !img.complete) return;
    setLoaded({ src, ok: img.naturalWidth > 0 });
  }, [src]);

  const frame = (
    <span
      className={`${s.frame} ${caption ? '' : className}`}
      data-state={status}
      data-radius={radius}
      style={{ aspectRatio: ratioOf(ratio), ...(caption ? undefined : style) }}
      role={status === 'error' ? 'img' : undefined}
      aria-label={status === 'error' ? `${alt}: imagem indisponível` : undefined}
      aria-busy={status === 'loading' || undefined}
    >
      {children && status !== 'error' && status !== 'loading' ? (
        <span className={s.content}>{children}</span>
      ) : src && status !== 'error' ? (
        // eslint-disable-next-line @next/next/no-img-element -- peça enviada (blob: ou data:), fora do otimizador
        <img
          key={fit}
          ref={imgRef}
          src={src}
          alt={alt}
          draggable={false}
          style={{ objectFit: fit }}
          onLoad={() => setLoaded({ src, ok: true })}
          onError={() => setLoaded({ src, ok: false })}
        />
      ) : null}
      {status === 'error' && (
        <span className={s.missing} aria-hidden="true">
          <ImageOff />
          <span>Imagem indisponível</span>
        </span>
      )}
    </span>
  );
  if (!caption) return frame;
  return (
    <figure className={`${s.figure} ${className}`} style={style}>
      {frame}
      <figcaption className={s.caption}>{caption}</figcaption>
    </figure>
  );
}
