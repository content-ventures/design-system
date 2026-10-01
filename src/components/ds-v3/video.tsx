'use client';

import {
  Captions,
  LoaderCircle,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  VideoOff,
  Volume2,
  VolumeX,
  type LucideIcon,
} from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { MediaFrame } from './media';
import s from './video.module.css';

export type VideoState = 'poster' | 'playing' | 'paused' | 'loading' | 'ended' | 'error';
export type VideoCue = { from: number; to: number; text: string };

const IDLE = 2000;
const SEEK = 5;

/** 75 → “1:15”. */
export function formatClock(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Player 16:9: pôster chapado, play central (52, papel 92%), barra sobre faixa escura chapada
 * que aparece no hover, no foco e na pausa e some após 2 s parado tocando. Sem `src`, a reprodução
 * é simulada (o catálogo mostra todos os estados). Espaço/K tocar, M som, F tela cheia, ←/→ 5 s.
 * Nunca toca sozinho.
 */
export function VideoPlayer({
  poster,
  title,
  duration,
  src,
  captions,
  state: frozen,
  time: frozenTime,
}: {
  poster?: string;
  title: string;
  /** Segundos. */
  duration: number;
  src?: string;
  /** Legendas (CC). */
  captions?: VideoCue[];
  /** Pranchas: estado parado (desliga a simulação). */
  state?: VideoState;
  /** Pranchas: tempo parado, em segundos. */
  time?: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const idleTimer = useRef<number | undefined>(undefined);
  const [phase, setPhase] = useState<VideoState>('poster');
  const [time, setTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cc, setCc] = useState(false);
  const [full, setFull] = useState(false);
  const [idle, setIdle] = useState(false);
  /** Foco de teclado dentro do player: a barra não some enquanto alguém navega nela. */
  const [focusIn, setFocusIn] = useState(false);
  /** Reinicia o relógio da simulação depois de um salto. */
  const [epoch, setEpoch] = useState(0);

  const current: VideoState = frozen ?? phase;
  const now = frozen
    ? (frozenTime ??
      (frozen === 'ended' ? duration : frozen === 'poster' ? 0 : Math.min(4, duration)))
    : time;
  const simulated = !src;

  /* Simulação: carrega 700 ms e avança em passos de 100 ms. */
  useEffect(() => {
    if (frozen || !simulated) return;
    if (phase === 'loading') {
      const timer = window.setTimeout(() => setPhase('playing'), 700);
      return () => window.clearTimeout(timer);
    }
    if (phase !== 'playing') return;
    const started = performance.now();
    const from = time;
    const timer = window.setInterval(() => {
      const next = from + (performance.now() - started) / 1000;
      if (next >= duration) {
        setTime(duration);
        setPhase('ended');
      } else setTime(next);
    }, 100);
    return () => window.clearInterval(timer);
    // `time` entra só como ponto de partida a cada play/seek: não reinicia o relógio a cada passo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, frozen, simulated, duration, epoch]);

  /* Vídeo real: o elemento manda no estado. */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || simulated || frozen) return;
    if (phase === 'playing' || phase === 'loading')
      void video.play().catch(() => setPhase('error'));
    else video.pause();
  }, [phase, simulated, frozen]);

  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === rootRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => () => window.clearTimeout(idleTimer.current), []);

  const wake = () => {
    setIdle(false);
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setIdle(true), IDLE);
  };

  const play = () => {
    if (frozen) return;
    if (current === 'ended') {
      seek(0);
      setPhase(simulated ? 'loading' : 'playing');
    } else if (current === 'poster') setPhase('loading');
    else setPhase('playing');
    wake();
  };
  const pause = () => {
    if (!frozen) setPhase('paused');
  };
  const toggle = () => (current === 'playing' || current === 'loading' ? pause() : play());
  function seek(to: number) {
    if (frozen) return;
    const next = Math.max(0, Math.min(duration, to));
    setTime(next);
    if (videoRef.current) videoRef.current.currentTime = next;
    if (next >= duration && simulated) setPhase('ended');
    else if (current === 'ended' || current === 'poster') setPhase('paused');
    else if (current === 'playing' && simulated) setEpoch((value) => value + 1);
  }
  const toggleFull = () => {
    const root = rootRef.current;
    if (!root) return;
    if (document.fullscreenElement) void document.exitFullscreen?.();
    else void root.requestFullscreen?.().catch(() => undefined);
  };

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (current === 'error') return;
    const key = event.key.toLowerCase();
    const onButton = (event.target as HTMLElement).closest('button');
    if (key === 'k' || (key === ' ' && !onButton)) {
      event.preventDefault();
      toggle();
    } else if (key === 'm') {
      event.preventDefault();
      setMuted((value) => !value);
    } else if (key === 'f') {
      event.preventDefault();
      toggleFull();
    } else if (
      (key === 'arrowleft' || key === 'arrowright') &&
      !(event.target as HTMLElement).closest('[role="slider"]')
    ) {
      event.preventDefault();
      seek(now + (key === 'arrowright' ? SEEK : -SEEK));
    }
    wake();
  };

  const cue =
    cc && captions ? captions.find((entry) => now >= entry.from && now < entry.to) : undefined;
  const hasControls = current !== 'poster' && current !== 'error';
  const showControls = hasControls && (frozen ? true : current !== 'playing' || !idle || focusIn);

  return (
    <div
      ref={rootRef}
      className={s.player}
      data-phase={current}
      data-controls={showControls || undefined}
      data-full={full || undefined}
      role="group"
      aria-roledescription="vídeo"
      aria-label={title}
      onKeyDown={onKey}
      onPointerMove={() => current === 'playing' && wake()}
      onPointerLeave={() => current === 'playing' && setIdle(true)}
      onFocus={(event) => {
        if ((event.target as HTMLElement).matches(':focus-visible')) setFocusIn(true);
        wake();
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusIn(false);
      }}
    >
      <MediaFrame
        ratio="16/9"
        src={src ? undefined : poster}
        alt={title}
        radius="lg"
        className={s.frame}
      >
        {current === 'error' ? (
          <span className={s.blank} />
        ) : src ? (
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            muted={muted}
            playsInline
            preload="metadata"
            onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
            onWaiting={() => setPhase('loading')}
            onPlaying={() => setPhase('playing')}
            onEnded={() => setPhase('ended')}
            onError={() => setPhase('error')}
          />
        ) : undefined}
      </MediaFrame>

      {current === 'error' ? (
        <span className={s.error} role="img" aria-label={`${title}: vídeo indisponível`}>
          <VideoOff aria-hidden="true" />
          <span aria-hidden="true">Vídeo indisponível</span>
        </span>
      ) : (
        <>
          {/* Superfície: clique toca/pausa (mouse). O teclado usa os botões. */}
          <span
            className={s.surface}
            aria-hidden="true"
            onClick={() => (current === 'poster' ? undefined : toggle())}
          />

          {(current === 'poster' || current === 'paused' || current === 'ended') && (
            <button
              type="button"
              className={s.center}
              aria-label={
                current === 'ended' ? `Assistir de novo: ${title}` : `Reproduzir ${title}`
              }
              onClick={play}
            >
              {current === 'ended' ? (
                <RotateCcw aria-hidden="true" />
              ) : (
                <Play aria-hidden="true" className={s.playGlyph} />
              )}
            </button>
          )}
          {current === 'loading' && (
            <span className={s.center} data-spinner="" role="status" aria-label="Carregando vídeo">
              <LoaderCircle aria-hidden="true" />
            </span>
          )}
          {current === 'poster' && <span className={s.duration}>{formatClock(duration)}</span>}

          {cue && (
            <span className={s.cue} aria-live="polite">
              {cue.text}
            </span>
          )}

          {hasControls && (
            <div className={s.bar}>
              <Ctrl
                label={
                  current === 'playing' || current === 'loading' ? 'Pausar (K)' : 'Reproduzir (K)'
                }
                icon={current === 'playing' || current === 'loading' ? Pause : Play}
                onClick={toggle}
              />
              <Scrubber time={now} duration={duration} onSeek={seek} onScrub={wake} />
              <span className={s.clock}>
                {formatClock(now)} / {formatClock(duration)}
              </span>
              <Ctrl
                label={muted ? 'Ativar som (M)' : 'Silenciar (M)'}
                icon={muted ? VolumeX : Volume2}
                onClick={() => setMuted(!muted)}
              />
              {captions && (
                <Ctrl label="Legendas" icon={Captions} pressed={cc} onClick={() => setCc(!cc)} />
              )}
              <Ctrl
                label={full ? 'Sair da tela cheia (F)' : 'Tela cheia (F)'}
                icon={full ? Minimize : Maximize}
                onClick={toggleFull}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Ctrl({
  label,
  icon: Icon,
  onClick,
  pressed,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      className={s.ctrl}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={onClick}
    >
      <Icon aria-hidden="true" />
    </button>
  );
}

/** Trilho de 4 px (branco 30%), preenchimento b-400, polegar de 12 px no hover/foco/arrasto. */
function Scrubber({
  time,
  duration,
  onSeek,
  onScrub,
}: {
  time: number;
  duration: number;
  onSeek: (time: number) => void;
  onScrub: () => void;
}) {
  const trackRef = useRef<HTMLSpanElement>(null);
  const [dragging, setDragging] = useState(false);
  const pct = duration > 0 ? (time / duration) * 100 : 0;
  const at = (event: ReactPointerEvent<HTMLSpanElement>) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return time;
    return ((event.clientX - rect.left) / rect.width) * duration;
  };
  return (
    <span
      className={s.scrub}
      role="slider"
      tabIndex={0}
      aria-label="Posição do vídeo"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(time)}
      aria-valuetext={`${formatClock(time)} de ${formatClock(duration)}`}
      data-dragging={dragging || undefined}
      onKeyDown={(event) => {
        const step =
          event.key === 'ArrowRight' || event.key === 'ArrowUp'
            ? SEEK
            : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
              ? -SEEK
              : 0;
        if (step) {
          event.preventDefault();
          onSeek(time + step);
        } else if (event.key === 'Home') {
          event.preventDefault();
          onSeek(0);
        } else if (event.key === 'End') {
          event.preventDefault();
          onSeek(duration);
        }
      }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
        onSeek(at(event));
      }}
      onPointerMove={(event) => {
        if (!dragging) return;
        onScrub();
        onSeek(at(event));
      }}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
    >
      <span ref={trackRef} className={s.rail}>
        <i className={s.fill} style={{ width: `${pct}%` }} />
        <i className={s.knob} style={{ left: `${pct}%` }} />
      </span>
    </span>
  );
}
