'use client';

import { X } from 'lucide-react';
import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
  type SyntheticEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from './button';
import {
  layerHost,
  reducedMotion,
  trapTab,
  useIsoLayoutEffect,
  usePresence,
} from './popover';
import s from './overlays.module.css';

/* ——— Menu ——— O desenho e o comportamento vivem em `menu.tsx` (dono: navegação). */
export { Menu, MenuPanel, type MenuItem, type MenuSection } from './menu';

/* ——————————————————————————————————————————————————————————————————————————
 * Camada modal (Dialog, Drawer, BottomSheet)
 * `<dialog>` nativo com `showModal`: foco preso e fundo inerte pelo navegador, Escape fecha.
 * `contained`: a mesma camada presa a um contêiner posicionado (palco do catálogo, moldura de
 * celular) — véu próprio, foco preso por Tab e irmãos `inert`.
 * Entrada e saída por `data-state` (`open` → `closing` → `closed`); a camada só desmonta o
 * conteúdo depois da saída.
 * —————————————————————————————————————————————————————————————————————————— */

let scrollLocks = 0;
let savedScroll: { overflow: string; paddingRight: string } | null = null;

/** Trava a rolagem da página (contagem para camadas empilhadas) sem o salto da barra de rolagem. */
function lockScroll() {
  const root = document.documentElement;
  if (scrollLocks === 0) {
    const gap = window.innerWidth - root.clientWidth;
    savedScroll = { overflow: root.style.overflow, paddingRight: root.style.paddingRight };
    root.style.overflow = 'hidden';
    if (gap > 0) root.style.paddingRight = `${gap}px`;
  }
  scrollLocks += 1;
  return () => {
    scrollLocks = Math.max(0, scrollLocks - 1);
    if (scrollLocks === 0 && savedScroll) {
      root.style.overflow = savedScroll.overflow;
      root.style.paddingRight = savedScroll.paddingRight;
      savedScroll = null;
    }
  };
}

export type ModalLayerOptions = {
  open: boolean;
  onClose: () => void;
  /** Clique no véu fecha. Falso: a camada dá um empurrão curto e fica. */
  dismissible: boolean;
  exitMs: number;
  contained?: boolean;
  /** Foco inicial; `null` foca a própria camada (o leitor de tela lê o título). */
  initialFocus?: (root: HTMLElement) => HTMLElement | null;
  /** Empurrão quando o clique no véu é ignorado. */
  nudge?: Keyframe[];
};

const NUDGE: Keyframe[] = [
  { transform: 'scale(1)' },
  { transform: 'scale(1.012)' },
  { transform: 'scale(1)' },
];

export function useModalLayer({
  open,
  onClose,
  dismissible,
  exitMs,
  contained = false,
  initialFocus,
  nudge = NUDGE,
}: ModalLayerOptions) {
  const ref = useRef<HTMLDialogElement | null>(null);
  const presence = usePresence(open, exitMs);
  const latest = useRef({ open, onClose, dismissible, initialFocus, nudge });
  const returnTo = useRef<HTMLElement | null>(null);
  const downOnBackdrop = useRef(false);
  const inerted = useRef<Element[]>([]);
  useIsoLayoutEffect(() => {
    latest.current = { open, onClose, dismissible, initialFocus, nudge };
  });

  useIsoLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (presence === 'open' && !dialog.open) {
      const active = document.activeElement;
      returnTo.current = active instanceof HTMLElement ? active : null;
      if (contained) {
        dialog.show?.();
        const root = dialog.closest('[data-layer-root]');
        const siblings = root?.parentElement ? Array.from(root.parentElement.children) : [];
        inerted.current = siblings.filter((node) => node !== root && !node.hasAttribute('inert'));
        inerted.current.forEach((node) => node.setAttribute('inert', ''));
      } else {
        dialog.showModal?.();
      }
      const focus = () => {
        const chosen = latest.current.initialFocus?.(dialog);
        (chosen ?? dialog).focus({ preventScroll: true });
      };
      focus();
      // Filhos que ajustam o foco depois do primeiro commit (ex.: autoFocus) ganham um quadro.
      const frame = requestAnimationFrame(() => {
        const active = document.activeElement;
        if (!active || !dialog.contains(active)) focus();
      });
      return () => cancelAnimationFrame(frame);
    }
    if (presence === 'closed' && dialog.open) {
      dialog.close?.();
    }
    if (presence === 'closed') {
      inerted.current.forEach((node) => node.removeAttribute('inert'));
      inerted.current = [];
      const back = returnTo.current;
      returnTo.current = null;
      const active = document.activeElement;
      if (back && back.isConnected && (!active || active === document.body || dialog.contains(active))) {
        back.focus({ preventScroll: true });
      }
    }
  }, [presence, contained]);

  const locked = presence !== 'closed' && !contained;
  useEffect(() => {
    if (!locked) return;
    return lockScroll();
  }, [locked]);

  useEffect(
    () => () => {
      inerted.current.forEach((node) => node.removeAttribute('inert'));
    },
    [],
  );

  const fromBackdrop = () => {
    if (latest.current.dismissible) {
      latest.current.onClose();
      return;
    }
    if (!reducedMotion()) {
      ref.current?.animate(latest.current.nudge, { duration: 260, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    }
  };

  const dialogProps = {
    ref,
    'data-state': presence,
    'data-contained': contained || undefined,
    onCancel: (event: SyntheticEvent<HTMLDialogElement>) => {
      event.preventDefault();
      latest.current.onClose();
    },
    onClose: () => {
      // Fechou pelo navegador (Escape repetido) sem passar pelo estado do consumidor.
      if (latest.current.open) latest.current.onClose();
    },
    onPointerDown: (event: ReactPointerEvent<HTMLDialogElement>) => {
      downOnBackdrop.current = !contained && event.target === event.currentTarget;
    },
    onClick: (event: ReactMouseEvent<HTMLDialogElement>) => {
      if (downOnBackdrop.current && event.target === event.currentTarget) fromBackdrop();
      downOnBackdrop.current = false;
    },
    onKeyDown: (event: ReactKeyboardEvent<HTMLDialogElement>) => {
      if (!contained || event.defaultPrevented) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        latest.current.onClose();
        return;
      }
      trapTab(event, event.currentTarget);
    },
  };
  const scrimProps = {
    'aria-hidden': true as const,
    onPointerDown: () => {
      downOnBackdrop.current = true;
    },
    onClick: () => {
      if (downOnBackdrop.current) fromBackdrop();
      downOnBackdrop.current = false;
    },
  };
  return { ref, presence, mounted: presence !== 'closed', dialogProps, scrimProps };
}

/** Raiz da camada presa a um contêiner: véu + camada, por cima do conteúdo do contêiner. */
export function ContainedLayer({
  presence,
  scrimProps,
  children,
  className = '',
}: {
  presence: 'open' | 'closing' | 'closed';
  scrimProps: HTMLAttributes<HTMLDivElement>;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${s.layerRoot} ${className}`} data-layer-root data-state={presence} hidden={presence === 'closed'}>
      <div className={s.scrim} {...scrimProps} />
      {children}
    </div>
  );
}

/* ——————————————————————————— Dialog ——————————————————————————— */

export type DialogSize = 'sm' | 'md' | 'lg';

type DialogLayoutProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Mantido por compatibilidade. Diálogo não leva ícone no cabeçalho. */
  leading?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Estado à esquerda do rodapé (contagem, salvamento). */
  footerStart?: ReactNode;
  /** Fio sob o cabeçalho, para corpos longos. Confirmações e formulários curtos: `false`. */
  divided?: boolean;
};

/** Corpo só existe quando há conteúdo: confirmações curtas vivem no título e na descrição. */
function hasBody(children: ReactNode) {
  return children != null && children !== false;
}

function DialogLayout({
  title,
  description,
  leading,
  children,
  footer,
  footerStart,
  divided = true,
  titleId,
  descId,
  onClose,
}: DialogLayoutProps & { titleId: string; descId: string; onClose?: () => void }) {
  return (
    <>
      <header className={s.dialogHead} data-divided={divided || undefined}>
        {leading}
        <div className={s.dialogTitles}>
          <h2 id={titleId} className={s.dialogTitle}>
            {title}
          </h2>
          {description && (
            <p id={descId} className={s.dialogDesc}>
              {description}
            </p>
          )}
        </div>
        <IconButton label="Fechar" icon={X} variant="ghost" size="sm" className={s.close} onClick={onClose} />
      </header>
      {hasBody(children) && (
        <div className={s.dialogBody}>
          <div className={s.dialogBodyInner} data-measure>
            {children}
          </div>
        </div>
      )}
      {footer && (
        <footer className={s.dialogFoot} data-measure>
          {footerStart && <div className={s.dialogFootStart}>{footerStart}</div>}
          {footer}
        </footer>
      )}
    </>
  );
}

/** Moldura de diálogo sem camada — para mostrar o desenho aberto numa prancha. */
export function DialogFrame({
  size = 'md',
  compact = false,
  width,
  className = '',
  style,
  ...layout
}: DialogLayoutProps & {
  size?: DialogSize;
  /** Desenho do celular (≤ 640): botões do rodapé dividem a largura. */
  compact?: boolean;
  /** Largura exata (px ou CSS) quando a prancha pede outra que não a do tamanho. */
  width?: number | string;
  className?: string;
  style?: CSSProperties;
}) {
  const titleId = useId();
  const descId = useId();
  return (
    <section
      className={`${s.dialog} ${s.frame} ${className}`}
      data-size={size}
      data-compact={compact || undefined}
      aria-labelledby={titleId}
      style={{ width, ...style }}
    >
      <DialogLayout {...layout} titleId={titleId} descId={descId} />
    </section>
  );
}

const ENABLED_CONTROL =
  'input:not(:disabled):not([type="hidden"]), textarea:not(:disabled), select:not(:disabled), button:not(:disabled)';

/**
 * Foco inicial: `[data-autofocus]`, depois o primeiro controle do corpo, depois o primeiro botão do
 * rodapé. Nunca o X do cabeçalho — confirmações destrutivas abrem em Cancelar.
 */
function dialogFocus(dialog: HTMLElement) {
  return (
    dialog.querySelector<HTMLElement>('[data-autofocus]') ??
    dialog.querySelector<HTMLElement>(`.${CSS.escape(s.dialogBody ?? '')} :is(${ENABLED_CONTROL})`) ??
    dialog.querySelector<HTMLElement>(`.${CSS.escape(s.dialogFoot ?? '')} button:not(:disabled)`)
  );
}

/**
 * A altura acompanha o conteúdo (erro que aparece, alerta, troca de passo) com uma transição de
 * 280 ms em vez de saltar. Mede só o conteúdo (corpo e rodapé), nunca a própria camada.
 */
function useAutoHeight(ref: RefObject<HTMLElement | null>, active: boolean) {
  useIsoLayoutEffect(() => {
    const box = ref.current;
    if (!active || !box || typeof ResizeObserver === 'undefined') return;
    let last = box.offsetHeight;
    let running: Animation | null = null;
    const observer = new ResizeObserver(() => {
      const from = box.offsetHeight;
      running?.cancel();
      const to = box.offsetHeight;
      const start = running ? from : last;
      running = null;
      last = to;
      if (Math.abs(to - start) < 1 || reducedMotion()) return;
      box.dataset.resizing = '';
      const animation = box.animate([{ height: `${start}px` }, { height: `${to}px` }], {
        duration: 280,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      });
      running = animation;
      animation.onfinish = () => {
        if (running === animation) running = null;
        delete box.dataset.resizing;
      };
      animation.oncancel = () => delete box.dataset.resizing;
    });
    box.querySelectorAll('[data-measure]').forEach((node) => observer.observe(node));
    const mutations = new MutationObserver(() => {
      observer.disconnect();
      box.querySelectorAll('[data-measure]').forEach((node) => observer.observe(node));
    });
    mutations.observe(box, { childList: true });
    return () => {
      observer.disconnect();
      mutations.disconnect();
      running?.cancel();
    };
  }, [active]);
}

/**
 * Diálogo modal: confirmações e edições pequenas. Fluxos longos são páginas com etapas.
 * Entra subindo 8 px com escala .985 (280 ms) e sai descendo 4 px (160 ms); a altura acompanha o
 * conteúdo. Com dados digitados (`dirty`), o clique no véu não fecha — a camada só dá um empurrão.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  leading,
  children,
  footer,
  footerStart,
  size = 'md',
  divided = true,
  dismissible = true,
  dirty = false,
  contained = false,
  className = '',
}: DialogLayoutProps & {
  open: boolean;
  onClose: () => void;
  size?: DialogSize;
  /** Clique no véu fecha (padrão). */
  dismissible?: boolean;
  /** Há dado digitado e não enviado: o véu deixa de fechar. */
  dirty?: boolean;
  /** Preso ao contêiner posicionado mais próximo, em vez da janela (pranchas, simuladores). */
  contained?: boolean;
  className?: string;
}) {
  const layer = useModalLayer({
    open,
    onClose,
    dismissible: dismissible && !dirty,
    exitMs: 160,
    contained,
    initialFocus: dialogFocus,
  });
  const titleId = useId();
  const descId = useId();
  // Durante a saída o conteúdo é o último aberto: o título não some antes da camada.
  const content = { title, description, leading, children, footer, footerStart, divided };
  const frozen = useRef(content);
  if (open) frozen.current = content;
  const shown = open ? content : frozen.current;
  useAutoHeight(layer.ref, layer.presence === 'open');

  const dialog = (
    <dialog
      {...layer.dialogProps}
      className={`${s.dialog} ${className}`}
      data-size={size}
      aria-labelledby={titleId}
      aria-describedby={shown.description ? descId : undefined}
      tabIndex={-1}
    >
      {layer.mounted && <DialogLayout {...shown} titleId={titleId} descId={descId} onClose={onClose} />}
    </dialog>
  );
  if (!contained) return dialog;
  return (
    <ContainedLayer presence={layer.presence} scrimProps={layer.scrimProps}>
      {dialog}
    </ContainedLayer>
  );
}

/* ——————————————————————————— Tooltip ——————————————————————————— */

type TipPosition = { top: number; left: number; arrow: number; below: boolean };
type Describable = {
  'aria-describedby'?: string;
  'aria-label'?: string;
  label?: string;
  title?: string;
};

const TIP_GAP = 8;
const TIP_EDGE = 8;
/** Janela em que a próxima dica abre sem espera (passar o ponteiro por ícones vizinhos). */
const SKIP_MS = 300;
/** Toque num controle indisponível mostra o motivo por 1,5 s. */
const TOUCH_MS = 1500;
let lastTipHide = -Infinity;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function tipDelay(anchor: Element | null) {
  if (!anchor) return 250;
  const raw = getComputedStyle(anchor).getPropertyValue('--tip-delay').trim();
  const value = parseFloat(raw);
  return Number.isFinite(value) ? (raw.endsWith('s') && !raw.endsWith('ms') ? value * 1000 : value) : 250;
}

/**
 * Dica curta sobre um controle com nome próprio. Não substitui rótulo nem repete o que já está
 * escrito. Abre depois de `--tip-delay` (250 ms) no hover e na hora com foco de teclado; entre
 * gatilhos vizinhos (300 ms) a segunda abre sem espera. Fixa na janela, vira para baixo perto do
 * topo, 240 px no máximo. No toque, tocar um controle indisponível mostra o motivo por 1,5 s.
 */
export function Tooltip({
  content,
  shortcut,
  children,
  open: pinned = false,
  side = 'top',
}: {
  content: string;
  shortcut?: string;
  children: ReactNode;
  /** Prancha: dica aberta e parada, no fluxo. Nunca no produto. */
  open?: boolean;
  /** Lado preferido. Vira sozinho quando não cabe. */
  side?: 'top' | 'bottom';
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [instant, setInstant] = useState(false);
  const [host, setHost] = useState<Element | null>(null);
  const [pos, setPos] = useState<TipPosition | null>(null);
  const openRef = useRef(false);
  const id = useId();
  useIsoLayoutEffect(() => {
    openRef.current = open;
  });

  function reveal(immediate: boolean) {
    const anchor = anchorRef.current;
    if (!anchor) return;
    // Dentro de um diálogo, a bolha precisa estar na mesma camada do topo para aparecer.
    setHost(layerHost(anchor));
    setInstant(immediate);
    setOpen(true);
  }
  function show(source: 'pointer' | 'keyboard') {
    window.clearTimeout(timer.current);
    const skip = performance.now() - lastTipHide < SKIP_MS;
    if (skip || source === 'keyboard') {
      reveal(skip);
      return;
    }
    timer.current = window.setTimeout(() => reveal(false), tipDelay(anchorRef.current));
  }
  function hide() {
    window.clearTimeout(timer.current);
    if (openRef.current) lastTipHide = performance.now();
    setOpen(false);
    setPos(null);
  }

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (!open) return;
    const close = () => {
      window.clearTimeout(timer.current);
      setOpen(false);
      setPos(null);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  useIsoLayoutEffect(() => {
    const anchor = anchorRef.current;
    const tip = tipRef.current;
    if (!open || !anchor || !tip) return;
    const a = anchor.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    const viewport = document.documentElement.clientWidth;
    const center = a.left + a.width / 2;
    const left = clamp(center - t.width / 2, TIP_EDGE, viewport - t.width - TIP_EDGE);
    const above = a.top - TIP_GAP - t.height;
    const belowTop = a.bottom + TIP_GAP;
    const fitsAbove = above >= TIP_EDGE;
    const fitsBelow = belowTop + t.height <= window.innerHeight - TIP_EDGE;
    const below = side === 'bottom' ? fitsBelow || !fitsAbove : !fitsAbove;
    setPos({
      top: below ? belowTop : above,
      left,
      arrow: clamp(center - left, 10, t.width - 10),
      below,
    });
  }, [open, host, content, shortcut, side]);

  const child = isValidElement<Describable>(children) ? (children as ReactElement<Describable>) : null;
  // Botão de ícone que já tem esse nome: repetir a dica como descrição faria o leitor falar duas vezes.
  const describe = child !== null && child.props['aria-label'] !== content && child.props.label !== content;
  const trigger = child
    ? cloneElement(child, {
        // A bolha substitui o `title` nativo, que apareceria por cima dela um segundo depois.
        title: '',
        ...(describe && {
          'aria-describedby': [child.props['aria-describedby'], id].filter(Boolean).join(' '),
        }),
      })
    : children;
  const description = describe && (
    <span id={id} hidden>
      {content}
    </span>
  );
  const bubble = (style: CSSProperties, below: boolean | undefined, extra: Record<string, unknown>) => (
    <span
      ref={pinned ? undefined : tipRef}
      className={s.tip}
      role="tooltip"
      aria-hidden="true"
      data-below={below || undefined}
      style={style}
      {...extra}
    >
      {content}
      {shortcut && <kbd>{shortcut}</kbd>}
    </span>
  );

  if (pinned) {
    return (
      <span className={s.tipPinned} data-side={side}>
        <span className={s.tipAnchor}>
          {trigger}
          {description}
        </span>
        {bubble({ '--arrow-x': '50%' } as CSSProperties, side === 'bottom', { 'data-static': '' })}
      </span>
    );
  }

  const style = {
    top: pos?.top ?? -9999,
    left: pos?.left ?? -9999,
    '--arrow-x': pos ? `${pos.arrow}px` : undefined,
  } as CSSProperties;

  return (
    <span
      ref={anchorRef}
      className={s.tipAnchor}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'touch') show('pointer');
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== 'touch') hide();
      }}
      onPointerDown={(event) => {
        if (event.pointerType !== 'touch') {
          // Clicar não deve deixar a dica pendurada sobre o que o clique abriu.
          window.clearTimeout(timer.current);
          return;
        }
        if (!anchorRef.current?.querySelector(':disabled, [aria-disabled="true"]')) return;
        reveal(false);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(hide, TOUCH_MS);
      }}
      onFocus={(event) => {
        // Só foco de teclado: o clique já mostrou a dica pelo hover.
        if (event.target instanceof HTMLElement && event.target.matches(':focus-visible')) show('keyboard');
      }}
      onBlur={hide}
    >
      {trigger}
      {description}
      {open &&
        host &&
        createPortal(bubble(style, pos?.below, { 'data-instant': instant || undefined }), host)}
    </span>
  );
}
