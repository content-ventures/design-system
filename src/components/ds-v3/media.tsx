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
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { Tooltip, useClipped } from './overlays';
import { useIsoLayoutEffect } from './popover';
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
 * (“briefing-colecao-pri…-final.pdf”). O nome inteiro vai numa dica do DS quando cortou.
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
  const [headRef, clipped] = useClipped<HTMLSpanElement>([text]);
  const dot = text.lastIndexOf('.');
  const keep = Math.min(text.length, (dot > 0 ? text.length - dot : 0) + tail);
  const head = text.slice(0, text.length - keep);
  const end = text.slice(text.length - keep);
  // O nome inteiro numa dica do DS, só quando o começo cortou (nunca o `title` nativo).
  return (
    <Tooltip content={text} bare describe={false} disabled={!clipped}>
      <span className={`${s.middle} ${className}`}>
        {head && (
          <span ref={headRef} className={s.middleHead}>
            {head}
          </span>
        )}
        <span className={s.middleTail}>{end}</span>
      </span>
    </Tooltip>
  );
}

/* ——————————————————————————— MediaFrame ——————————————————————————— */

export type MediaState = 'loading' | 'loaded' | 'error';
export type MediaRatio = '970/250' | '300/250' | '1/1' | '4/3' | '16/9' | (string & {});

/** “970/250” → “970 / 250” (aspect-ratio). */
export function ratioOf(ratio: MediaRatio) {
  return ratio.replace(/\s*[/:x×]\s*/, ' / ');
}

/** “4/5” → 0,8 (largura ÷ altura). Proporção ilegível vale 1. */
export function ratioValue(ratio: MediaRatio) {
  const [w, h] = ratioOf(ratio)
    .split('/')
    .map((part) => Number(part.trim()));
  if (!w || !h || !Number.isFinite(w) || !Number.isFinite(h)) return 1;
  return w / h;
}

/* ——————————————————————————— Altura do palco ——————————————————————————— */

/** Piso da altura medida: abaixo disso a peça rola junto com a página em vez de encolher. */
export const FIT_HEIGHT_MIN = 240;

/** Medida CSS de `maxHeight`: número vira px. */
export function cssLength(value: number | string) {
  return typeof value === 'number' ? `${value}px` : value;
}

/** Área que rola em volta do elemento (o palco); sem nenhuma, a janela. */
function scrollParentOf(el: HTMLElement): HTMLElement | null {
  for (let node = el.parentElement; node; node = node.parentElement) {
    if (node === document.body || node === document.documentElement) return null;
    if (/(auto|scroll|overlay)/.test(getComputedStyle(node).overflowY)) return node;
  }
  return null;
}

/**
 * Altura que sobra para a peça na área que rola em volta: a altura visível dela (sem o respiro),
 * menos o que vem antes da peça nessa área e menos o que a peça carrega embaixo (legenda). Nunca
 * abaixo de `FIT_HEIGHT_MIN`. Escreve `--media-fit-h` no próprio `outer`: sem renderizar de novo e
 * sem laço (a largura da peça não muda o que vem antes dela).
 */
export function useFitHeight(
  outerRef: RefObject<HTMLElement | null>,
  innerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  /** Muda quando o elemento de fora troca (ex.: a legenda entra e a figura passa a ser o de fora). */
  shape?: string,
) {
  useIsoLayoutEffect(() => {
    const outer = outerRef.current;
    if (!enabled || !outer) return;
    const scroller = scrollParentOf(outer);
    let frame = 0;
    const measure = () => {
      frame = 0;
      const inner = innerRef.current ?? outer;
      const box = outer.getBoundingClientRect();
      let visible = window.innerHeight;
      let before = box.top + window.scrollY;
      if (scroller) {
        const styles = getComputedStyle(scroller);
        const padTop = parseFloat(styles.paddingTop) || 0;
        const padBottom = parseFloat(styles.paddingBottom) || 0;
        const top = scroller.getBoundingClientRect().top + scroller.clientTop + padTop;
        visible = scroller.clientHeight - padTop - padBottom;
        before = box.top - top + scroller.scrollTop;
      }
      const below = box.height - inner.getBoundingClientRect().height;
      const fit = Math.max(FIT_HEIGHT_MIN, Math.floor(visible - Math.max(0, before) - below));
      outer.style.setProperty('--media-fit-h', `${fit}px`);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    // Medidas seguintes no próximo quadro: escrever dentro do observador encadearia avisos de laço.
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(outer);
    // O que vem antes da peça cresce (aviso, rastro aberto): o conteúdo da área muda de altura.
    const watchChildren = () => {
      if (scroller) Array.from(scroller.children).forEach((child) => observer.observe(child));
      schedule();
    };
    const mutations = scroller ? new MutationObserver(watchChildren) : null;
    if (scroller) {
      observer.observe(scroller);
      Array.from(scroller.children).forEach((child) => observer.observe(child));
      mutations?.observe(scroller, { childList: true });
    } else {
      window.addEventListener('resize', schedule);
    }
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      mutations?.disconnect();
      window.removeEventListener('resize', schedule);
      outer.style.removeProperty('--media-fit-h');
    };
  }, [enabled, shape, outerRef, innerRef]);
}

/**
 * Variáveis do limite de altura: proporção numérica e teto (`maxHeight`). A largura sai de
 * `min(100%, teto × proporção)` no CSS do componente.
 */
export function boundVars(ratio: number, maxHeight?: number | string): CSSProperties {
  return {
    '--media-ar': String(ratio),
    ...(maxHeight !== undefined ? { '--media-max-h': cssLength(maxHeight) } : null),
  } as CSSProperties;
}

/**
 * Moldura de imagem na proporção exata: fundo g-50, fio interno de 1px, raio 8, recorte.
 * Carregando = bloco chapado que pulsa; carregada = entra em 180 ms; sem arquivo ou com erro =
 * `ImageOff` + “Imagem indisponível”. `children` substitui a imagem (desenho inline, vídeo).
 * Com `maxHeight` ou `fitHeight`, a altura também limita: a moldura (com a legenda) estreita na
 * proporção e fica centrada — um slide 4:5 cabe inteiro num palco largo e baixo.
 */
export function MediaFrame({
  ratio = '16/9',
  src,
  alt,
  fit = 'cover',
  caption,
  state,
  radius = 'md',
  maxHeight,
  fitHeight = false,
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
  /**
   * Teto da altura da moldura (sem a legenda). Número = px; texto = medida CSS (`'60dvh'`). A
   * proporção fica: a moldura estreita e centra.
   */
  maxHeight?: number | string;
  /**
   * Cabe no palco: a altura visível da área que rola em volta, menos o que vem antes da peça nela e
   * a legenda (piso de 240 px). Mede no cliente; antes da medida vale `maxHeight` ou a altura da
   * janela.
   */
  fitHeight?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const outerRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLSpanElement>(null);
  const bound = fitHeight || maxHeight !== undefined;
  useFitHeight(outerRef, frameRef, fitHeight, caption ? 'figure' : 'frame');
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

  // O limite vai no elemento de fora: com legenda, a figura inteira estreita junto com a moldura.
  const outerVars = bound ? boundVars(ratioValue(ratio), maxHeight) : undefined;
  const frame = (
    <span
      ref={(node) => {
        frameRef.current = node;
        if (!caption) outerRef.current = node;
      }}
      className={`${s.frame} ${caption ? '' : className}`}
      data-state={status}
      data-radius={radius}
      data-bound={(bound && !caption) || undefined}
      style={{
        aspectRatio: ratioOf(ratio),
        ...(caption ? undefined : { ...outerVars, ...style }),
      }}
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
    <figure
      ref={(node) => {
        outerRef.current = node;
      }}
      className={`${s.figure} ${className}`}
      data-bound={bound || undefined}
      style={{ ...outerVars, ...style }}
    >
      {frame}
      <figcaption className={s.caption}>{caption}</figcaption>
    </figure>
  );
}
