'use client';

import type { LucideIcon } from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from 'react';
import type { Tone } from './badge';
import { Tooltip } from './overlays';
import s from './identity.module.css';

/** Hash estável e curto para escolher paleta e desenho a partir de um nome. */
export function seedOf(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // mistura final para espalhar os bits baixos (paletas vizinhas não repetem)
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

export function IconTile({
  icon: Icon,
  tone = 'gray',
  variant = 'soft',
  size = 'md',
  shape = 'rounded',
  label,
}: {
  icon: LucideIcon;
  tone?: Tone;
  variant?: 'soft' | 'paper' | 'solid' | 'dashed';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'rounded' | 'circle';
  /** Só quando o ícone carrega significado que o texto ao lado não comunica. */
  label?: string;
}) {
  return (
    <span
      className={s.tile}
      data-tone={tone}
      data-variant={variant}
      data-size={size}
      data-shape={shape}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <Icon aria-hidden="true" />
    </span>
  );
}

/* ——————————————————————————— Avatar ——————————————————————————— */

const orbs = [
  ['#a9c8ff', '#5b7cf6', '#d3c4ff'],
  ['#a5ecd6', '#23a98d', '#bfe4ff'],
  ['#ffcfb3', '#f5836c', '#ffd9ea'],
  ['#dccdff', '#8a6cf3', '#ffcdec'],
  ['#9fe3f1', '#2c8ed6', '#aef1d4'],
  ['#ffe29a', '#f1a228', '#ffc9ad'],
  ['#ffc0cf', '#df5a80', '#ffdcb6'],
  ['#cbd6e8', '#66799a', '#e3eaf6'],
] as const;

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarPresence = 'online' | 'away' | 'offline';
/** Ciclo da foto: `loading` mostra o orbe pulsando; `loaded` a foto por cima; `error` volta ao orbe. */
export type AvatarImageState = 'loading' | 'loaded' | 'error';

const presenceLabel: Record<AvatarPresence, string> = {
  online: 'disponível',
  away: 'ausente',
  offline: 'offline',
};

function orbStyle(name: string) {
  const [o1, o2, o3] = orbs[seedOf(name) % orbs.length] ?? orbs[0];
  return { '--o1': o1, '--o2': o2, '--o3': o3 } as CSSProperties;
}

/**
 * Pessoa. Sem foto, vira um orbe de cor derivado do nome — nunca iniciais.
 * Com `src`, a foto carrega por cima do orbe (entra em 180 ms) e, se falhar, o orbe fica.
 * O nome é o nome acessível; em listas com o nome visível ao lado, use `decorative`.
 */
export function Avatar({
  name,
  src,
  size = 'md',
  presence,
  decorative = false,
  imageState,
}: {
  name: string;
  src?: string;
  size?: AvatarSize;
  presence?: AvatarPresence;
  decorative?: boolean;
  /** Pranchas: estado parado da foto. No produto o próprio carregamento decide. */
  imageState?: AvatarImageState;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState<{ src: string; ok: boolean } | null>(null);
  const known = loaded && loaded.src === src ? loaded : null;
  const status: AvatarImageState | undefined = src
    ? (imageState ?? (known ? (known.ok ? 'loaded' : 'error') : 'loading'))
    : undefined;

  // Foto já em cache termina de carregar antes da hidratação: lê o estado direto do elemento.
  useEffect(() => {
    const img = imgRef.current;
    if (!src || !img || !img.complete) return;
    setLoaded({ src, ok: img.naturalWidth > 0 });
  }, [src]);

  const label = presence ? `${name}, ${presenceLabel[presence]}` : name;
  return (
    <span
      className={s.avatar}
      data-size={size}
      data-image={status}
      style={orbStyle(name)}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
    >
      {src && status !== 'error' && (
        // eslint-disable-next-line @next/next/no-img-element -- foto de perfil pequena, fora do otimizador
        <img
          ref={imgRef}
          src={src}
          alt=""
          draggable={false}
          onLoad={() => setLoaded({ src, ok: true })}
          onError={() => setLoaded({ src, ok: false })}
        />
      )}
      {presence && <i className={s.presence} data-state={presence} aria-hidden="true" />}
    </span>
  );
}

/**
 * Pilha de pessoas. Cada membro sobe 2 px no hover e mostra o nome; “+N” lista o restante.
 * `sources` liga nome → foto quando houver.
 */
export function AvatarGroup({
  names,
  max = 4,
  size = 'sm',
  label,
  sources,
  hoverIndex,
  moreForce,
}: {
  names: string[];
  max?: number;
  size?: AvatarSize;
  label?: string;
  sources?: Partial<Record<string, string>>;
  /** Pranchas: membro parado em hover (índice). */
  hoverIndex?: number;
  /** Pranchas: estado parado do “+N” (`hover`, `focus`). */
  moreForce?: string;
}) {
  const shown = names.slice(0, max);
  const hidden = names.slice(shown.length);
  const rest = hidden.length;
  const restList = listOf(hidden);
  return (
    <span className={s.group} data-size={size} role="group" aria-label={label ?? listOf(names)}>
      {shown.map((name, index) => (
        <Tooltip key={name} content={name}>
          <span className={s.member} data-force={hoverIndex === index ? 'hover' : undefined}>
            <Avatar name={name} src={sources?.[name]} size={size} decorative />
          </span>
        </Tooltip>
      ))}
      {rest > 0 && (
        <Tooltip content={restList}>
          <span
            className={s.more}
            tabIndex={0}
            role="img"
            aria-label={`Mais ${rest}: ${restList}`}
            data-force={moreForce}
          >
            +{rest}
          </span>
        </Tooltip>
      )}
    </span>
  );
}

function listOf(names: string[]) {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

/* ——————————————————————————— Marcas ——————————————————————————— */

const markColors = [
  '#0875db',
  '#1a1f2c',
  '#14976f',
  '#ee6428',
  '#7454ea',
  '#dc4789',
  '#0f9fb0',
  '#e39a0b',
];

const glyphs: ReactNode[] = [
  // arcos concêntricos
  <g key="a" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <path d="M5 19a14 14 0 0 1 14-14" />
    <path d="M10 19a9 9 0 0 1 9-9" />
    <circle cx="18.6" cy="18.6" r="1.6" fill="currentColor" stroke="none" />
  </g>,
  // pétalas
  <g key="b" fill="currentColor">
    <circle cx="12" cy="7.5" r="4.5" />
    <circle cx="12" cy="16.5" r="4.5" opacity="0.72" />
    <circle cx="7.5" cy="12" r="4.5" opacity="0.86" />
    <circle cx="16.5" cy="12" r="4.5" opacity="0.58" />
  </g>,
  // pilha
  <g key="c" fill="currentColor">
    <rect x="4" y="4.5" width="16" height="4" rx="2" />
    <rect x="4" y="10" width="11" height="4" rx="2" opacity="0.78" />
    <rect x="4" y="15.5" width="6" height="4" rx="2" opacity="0.56" />
  </g>,
  // órbita
  <g key="d" fill="none" stroke="currentColor" strokeWidth="2.2">
    <circle cx="12" cy="12" r="7.5" opacity="0.55" />
    <circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" />
    <circle cx="18.6" cy="8.4" r="1.9" fill="currentColor" stroke="none" />
  </g>,
  // meio a meio
  <g key="e" fill="currentColor">
    <path d="M4 12a8 8 0 0 1 8-8v16a8 8 0 0 1-8-8Z" />
    <rect x="13.5" y="4" width="6.5" height="16" rx="2" opacity="0.66" />
  </g>,
  // estrela de quatro pontas
  <path
    key="f"
    fill="currentColor"
    d="M12 3.5c.7 4.6 3.9 7.8 8.5 8.5-4.6.7-7.8 3.9-8.5 8.5-.7-4.6-3.9-7.8-8.5-8.5 4.6-.7 7.8-3.9 8.5-8.5Z"
  />,
  // onda
  <g key="g" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <path d="M3.5 9.5c2.8-3 5.7-3 8.5 0s5.7 3 8.5 0" />
    <path d="M3.5 15.5c2.8-3 5.7-3 8.5 0s5.7 3 8.5 0" opacity="0.6" />
  </g>,
  // grade
  <g key="h" fill="currentColor">
    <rect x="4" y="4" width="7" height="7" rx="2.2" />
    <rect x="13" y="4" width="7" height="7" rx="3.5" opacity="0.6" />
    <rect x="4" y="13" width="7" height="7" rx="3.5" opacity="0.6" />
    <rect x="13" y="13" width="7" height="7" rx="2.2" opacity="0.85" />
  </g>,
];

/**
 * Marca desenhada de uma organização (feira, expositor, anunciante). Derivada do nome,
 * estável entre telas. Nunca usa letras. xs ao lado de um nome = `soft`; sm ou maior, quando a
 * organização é o assunto = `solid`; sobre fundo escuro ou colorido = `paper`.
 */
export function BrandMark({
  name,
  src,
  size = 'md',
  variant = 'solid',
  decorative = false,
}: {
  name: string;
  /** Logo enviado pela organização. Some no erro de carga e o glifo volta. */
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'solid' | 'soft' | 'paper';
  decorative?: boolean;
}) {
  const seed = seedOf(name);
  const mark = markColors[seed % markColors.length] ?? '#0875db';
  const glyph = glyphs[Math.floor(seed / markColors.length) % glyphs.length] ?? glyphs[0];
  const [broken, setBroken] = useState<string | null>(null);
  if (src && broken !== src) {
    return (
      <span
        className={s.brand}
        data-size={size}
        data-variant="logo"
        role={decorative ? undefined : 'img'}
        aria-label={decorative ? undefined : name}
        aria-hidden={decorative || undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- logo de terceiro, tamanho fixo */}
        <img src={src} alt="" loading="lazy" decoding="async" onError={() => setBroken(src)} />
      </span>
    );
  }
  return (
    <span
      className={s.brand}
      data-size={size}
      data-variant={variant}
      style={{ '--mark': mark } as CSSProperties}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative || undefined}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {glyph}
      </svg>
    </span>
  );
}

/** Desenho da marca MediaOn (o mesmo do `ProductMark`): ponto e duas ondas. */
function ProductGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="7.6" cy="12" r="3.1" fill="currentColor" />
      <path
        d="M13 7.4a6.6 6.6 0 0 1 0 9.2"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M16.6 4.4a11 11 0 0 1 0 15.2"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

/**
 * Assinatura da plataforma: glifo em grafite + nome 15/600. `tone="accent"` usa o azul do app
 * (moldura do produto); `tone="paper"` vai sobre fundo escuro ou colorido.
 */
export function MediaOnMark({
  size = 'md',
  tone = 'graphite',
  wordmark = true,
}: {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  tone?: 'graphite' | 'accent' | 'paper';
  wordmark?: boolean;
}) {
  return (
    <span className={s.product} data-size={size} data-tone={tone} role="img" aria-label="MediaOn">
      <span className={s.productGlyph}>
        <ProductGlyph />
      </span>
      {wordmark && (
        <span className={s.wordmark} aria-hidden="true">
          MediaOn
        </span>
      )}
    </span>
  );
}

/** Rodapé público (Vitrine): “Feito com MediaOn”, legenda discreta que acende no hover. */
export function MadeWith({
  className = '',
  ...props
}: ComponentProps<'a'> & {
  /** Estado parado para pranchas (`hover`, `focus`). */
  'data-force'?: string;
}) {
  return (
    <a {...props} className={`${s.madeWith} ${className}`}>
      <span>Feito com</span>
      <span className={s.madeMark}>
        <span className={s.productGlyph}>
          <ProductGlyph />
        </span>
        MediaOn
      </span>
    </a>
  );
}

/**
 * Identidade de uma organização: marca + nome (+ papel). `cobrand` assina “com MediaOn” ao lado,
 * para o cabeçalho público da Vitrine.
 */
export function BrandLockup({
  name,
  detail,
  size = 'md',
  cobrand = false,
}: {
  name: string;
  detail?: string;
  size?: 'sm' | 'md' | 'lg';
  cobrand?: boolean;
}) {
  return (
    <span className={s.lockup} data-size={size}>
      <BrandMark name={name} size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md'} decorative />
      <span className={s.lockupText}>
        <strong>{name}</strong>
        {detail && <span>{detail}</span>}
      </span>
      {cobrand && (
        <>
          <i className={s.lockupRule} aria-hidden="true" />
          <span className={s.cobrand}>
            <span>com</span>
            <MediaOnMark size="xs" />
          </span>
        </>
      )}
    </span>
  );
}
