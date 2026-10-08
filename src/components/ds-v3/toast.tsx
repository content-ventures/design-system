'use client';

import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import { Tooltip } from './overlays';
import s from './toast.module.css';

export type ToastTone = 'success' | 'info' | 'error';
export type ToastAction = { label: string; onClick: () => void };
export type ToastOptions = {
  tone?: ToastTone;
  description?: string;
  action?: ToastAction;
  /** Fio de 2 px no pé que encolhe no tempo do aviso (para no hover/foco). */
  progress?: boolean;
  /** Tempo na tela em ms (padrão 5000). */
  duration?: number;
  /** Fica até ser dispensado. Padrão: só os erros. */
  persistent?: boolean;
};
type ToastItem = {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
  action?: ToastAction;
  progress: boolean;
  duration: number;
  persistent: boolean;
  leaving: boolean;
};

const DURATION = 5000;
/** Visíveis ao mesmo tempo; o mais antigo sai quando chega o quarto. */
const MAX_VISIBLE = 3;
/** Saída (--dur-exit). */
const EXIT_MS = 160;
/** Reacomodação da pilha (--dur-3, --ease-move). */
const MOVE_MS = 280;
const EASE_MOVE = 'cubic-bezier(0.65, 0, 0.35, 1)';

let items: ToastItem[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function remove(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

/** Tira o aviso: esmaece e desliza 8 px para a direita (160 ms) e só então sai da pilha. */
function dismiss(id: number) {
  const item = items.find((entry) => entry.id === id);
  if (!item || item.leaving) return;
  if (reducedMotion() || listeners.size === 0) {
    remove(id);
    return;
  }
  items = items.map((entry) => (entry.id === id ? { ...entry, leaving: true } : entry));
  emit();
  window.setTimeout(() => remove(id), EXIT_MS);
}

/**
 * Aviso temporário após uma ação. Some em 5 s (o tempo para enquanto o ponteiro ou o foco está
 * nele); erros ficam até serem dispensados. `action` oferece um passo imediato, como Desfazer.
 * Até 3 na tela: o quarto empurra o mais antigo para fora. Devolve o id (`toast.dismiss(id)`).
 */
export function toast(title: string, options: ToastOptions = {}) {
  seq += 1;
  const id = seq;
  const tone = options.tone ?? 'success';
  items = [
    ...items,
    {
      id,
      tone,
      title,
      description: options.description,
      action: options.action,
      progress: options.progress ?? false,
      duration: options.duration ?? DURATION,
      persistent: options.persistent ?? tone === 'error',
      leaving: false,
    },
  ];
  emit();
  const visible = items.filter((item) => !item.leaving);
  visible.slice(0, Math.max(0, visible.length - MAX_VISIBLE)).forEach((item) => dismiss(item.id));
  return id;
}
toast.dismiss = dismiss;

/**
 * O desenho do aviso, sem fila: cartão escuro g-900, ícone 18 na cor do tom, título 12/500 branco,
 * descrição 68% branco, uma ação em b-300 e o X. Usado pelo `Toaster` e pelas pranchas (`still`).
 */
export function ToastCard({
  tone = 'success',
  title,
  description,
  action,
  onDismiss,
  progress = false,
  duration = DURATION,
  paused = false,
  leaving = false,
  still = false,
  className = '',
  style,
  'data-force': force,
  ...handlers
}: {
  tone?: ToastTone;
  title: string;
  description?: string;
  action?: ToastAction;
  onDismiss?: () => void;
  progress?: boolean;
  duration?: number;
  paused?: boolean;
  leaving?: boolean;
  /** Prancha: sem entrada, sem região viva; o fio do tempo fica parado a 60%. */
  still?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Prancha: estado parado da ação e do X (`hover`, `active`, `focus`). */
  'data-force'?: string;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  onFocus?: () => void;
  onBlur?: (event: FocusEvent<HTMLDivElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
}) {
  const Icon = tone === 'success' ? CircleCheck : tone === 'error' ? CircleAlert : Info;
  return (
    <div
      {...handlers}
      className={`${s.toast} ${className}`}
      data-tone={tone}
      data-leaving={leaving || undefined}
      data-paused={paused || undefined}
      data-still={still || undefined}
      role={still ? undefined : tone === 'error' ? 'alert' : 'status'}
      style={{ '--toast-duration': `${duration}ms`, ...style } as CSSProperties}
    >
      <Icon className={s.icon} aria-hidden="true" />
      <div className={s.text}>
        <strong>{title}</strong>
        {description && <span>{description}</span>}
      </div>
      {action && (
        <button
          type="button"
          className={s.action}
          data-force={force}
          onClick={() => {
            action.onClick();
            onDismiss?.();
          }}
        >
          {action.label}
        </button>
      )}
      <Tooltip bare content="Dispensar aviso">
        <button
          type="button"
          className={s.close}
          aria-label="Dispensar aviso"
          data-force={action ? undefined : force}
          onClick={onDismiss}
        >
          <X aria-hidden="true" />
        </button>
      </Tooltip>
      {progress && <i className={s.progress} aria-hidden="true" />}
    </div>
  );
}

function Item({ item }: { item: ToastItem }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = hovered || focused;
  const remaining = useRef(item.duration);

  useEffect(() => {
    if (item.persistent || paused || item.leaving) return;
    const startedAt = Date.now();
    const timer = window.setTimeout(() => dismiss(item.id), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt));
    };
  }, [item.id, item.persistent, item.leaving, paused]);

  return (
    <ToastCard
      tone={item.tone}
      title={item.title}
      description={item.description}
      action={item.action}
      progress={item.progress && !item.persistent}
      duration={item.duration}
      paused={paused}
      leaving={item.leaving}
      onDismiss={() => dismiss(item.id)}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        event.stopPropagation();
        dismiss(item.id);
      }}
    />
  );
}

/** Coloque uma vez por página, dentro do ThemeV3. */
export function Toaster() {
  const list = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => items,
    () => items,
  );
  const ref = useRef<HTMLDivElement>(null);
  const tops = useRef(new Map<number, number>());
  /** Onde o foco estava antes de Alt+T: volta para lá quando o aviso focado sai. */
  const returnTo = useRef<HTMLElement | null>(null);

  // Alt+T leva o foco ao aviso mais recente (a ação, ou o X); Esc dentro dele dispensa.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (!event.altKey || event.code !== 'KeyT') return;
      const slots = ref.current?.querySelectorAll<HTMLElement>(
        '[data-toast-id]:not([data-leaving])',
      );
      const last = slots?.[slots.length - 1];
      const target = last?.querySelector<HTMLElement>('button');
      if (!target) return;
      event.preventDefault();
      if (!ref.current?.contains(document.activeElement))
        returnTo.current = document.activeElement as HTMLElement | null;
      target.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // O aviso com o foco começou a sair: o foco passa ao vizinho ou volta para onde estava.
  useLayoutEffect(() => {
    const root = ref.current;
    const active = document.activeElement;
    if (!root || !active || !root.contains(active)) return;
    const slot = active.closest<HTMLElement>('[data-toast-id]');
    if (!slot?.hasAttribute('data-leaving')) return;
    const next = [
      ...root.querySelectorAll<HTMLElement>('[data-toast-id]:not([data-leaving]) button'),
    ].pop();
    const back = returnTo.current?.isConnected ? returnTo.current : null;
    (next ?? back)?.focus({ preventScroll: true });
  }, [list]);

  // FLIP: quem já estava na pilha desliza até o novo lugar (entrou um, saiu um) em 280 ms.
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const base = root.getBoundingClientRect().top;
    const next = new Map<number, number>();
    const still = reducedMotion();
    root.querySelectorAll<HTMLElement>('[data-toast-id]').forEach((slot) => {
      const id = Number(slot.dataset.toastId);
      const top = base + slot.offsetTop;
      const before = tops.current.get(id);
      if (!still && before !== undefined && Math.abs(before - top) > 0.5 && slot.animate) {
        slot.animate([{ transform: `translateY(${before - top}px)` }, { transform: 'none' }], {
          duration: MOVE_MS,
          easing: EASE_MOVE,
        });
      }
      next.set(id, top);
    });
    tops.current = next;
  }, [list]);

  return (
    <div ref={ref} className={s.viewport} aria-live="polite" aria-label="Avisos (Alt+T)">
      {list.map((item) => (
        <div
          key={item.id}
          className={s.slot}
          data-toast-id={item.id}
          data-leaving={item.leaving || undefined}
        >
          <Item item={item} />
        </div>
      ))}
    </div>
  );
}
