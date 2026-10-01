'use client';

import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactElement,
} from 'react';
import { floatingHost, MenuSurface, type MenuSection } from './menu';
import s from './context-menu.module.css';

type TargetProps = {
  className?: string;
  onContextMenu?: (event: MouseEvent<HTMLElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
  onPointerDown?: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove?: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp?: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel?: (event: PointerEvent<HTMLElement>) => void;
  onClickCapture?: (event: MouseEvent<HTMLElement>) => void;
  'data-context-open'?: boolean;
};

const LONG_PRESS = 500;
const MOVE_TOLERANCE = 10;

/** Campo de texto, área editável ou texto selecionado dentro do alvo: o menu do navegador vale. */
function keepsNativeMenu(target: EventTarget | null, root: HTMLElement) {
  const el = target instanceof Element ? target : null;
  if (el?.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return true;
  const selection = window.getSelection();
  return Boolean(
    selection && !selection.isCollapsed && selection.anchorNode && root.contains(selection.anchorNode),
  );
}

/**
 * Menu de contexto sobre um alvo (cartão, linha). Abre com o botão direito, com toque longo
 * (500 ms) e com Shift+F10 ou a tecla Menu no alvo em foco. O painel nasce no ponteiro, fica a
 * 8 px da borda e vira perto dela. Escape ou clique fora fecham e devolvem o foco ao alvo; rolar fecha.
 * Campos de texto e texto selecionado mantêm o menu do navegador.
 */
export function ContextMenu({
  sections,
  children,
  label,
  onOpenChange,
  disabled = false,
}: {
  sections: MenuSection[];
  /** Um único elemento: recebe os eventos e o atributo `data-context-open` enquanto o menu está aberto. */
  children: ReactElement;
  label: string;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
}) {
  const [phase, setPhase] = useState<'closed' | 'open' | 'closing'>('closed');
  const [point, setPoint] = useState({ x: 0, y: 0 });
  const [host, setHost] = useState<Element | null>(null);
  const [session, setSession] = useState(0);
  const [focusMode, setFocusMode] = useState<'first' | 'panel'>('panel');
  const rootId = useId();
  const targetRef = useRef<HTMLElement | null>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const press = useRef<{ timer?: number; x: number; y: number; fired: boolean }>({ x: 0, y: 0, fired: false });
  const exitTimer = useRef<number | undefined>(undefined);
  const open = phase === 'open';

  function show(x: number, y: number, target: HTMLElement, viaKeyboard = false) {
    window.clearTimeout(exitTimer.current);
    setFocusMode(viaKeyboard ? 'first' : 'panel');
    targetRef.current = target;
    const active = document.activeElement;
    returnTo.current = active instanceof HTMLElement && target.contains(active) ? active : target;
    setHost(floatingHost(target));
    setPoint({ x, y });
    setSession((value) => value + 1);
    setPhase('open');
    onOpenChange?.(true);
  }
  function close(returnFocus: boolean) {
    setPhase((value) => (value === 'closed' ? value : 'closing'));
    onOpenChange?.(false);
    if (returnFocus) {
      const el = returnTo.current;
      if (el && (el.tabIndex >= 0 || el.matches('a[href], button, [tabindex]'))) el.focus({ preventScroll: true });
    }
    window.clearTimeout(exitTimer.current);
    exitTimer.current = window.setTimeout(() => setPhase((value) => (value === 'closing' ? 'closed' : value)), 120);
  }

  useEffect(() => {
    if (!open) return;
    function onDown(event: globalThis.PointerEvent) {
      const target = event.target as Element | null;
      if (target?.closest?.(`[data-menu-root="${CSS.escape(rootId)}"]`)) return;
      close(false);
    }
    // O painel nasce num ponto fixo da janela: se a página (ou a moldura do alvo) rola, ele fecharia
    // solto sobre outra linha. Como no menu nativo, rolar fecha. Rolagem dentro do próprio menu não conta.
    function onScroll(event: Event) {
      const target = event.target;
      if (target instanceof Element && target.closest(`[data-menu-root="${CSS.escape(rootId)}"]`)) return;
      window.removeEventListener('scroll', onScroll, { capture: true });
      close(false);
    }
    document.addEventListener('pointerdown', onDown, true);
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('scroll', onScroll, { capture: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rootId]);
  useEffect(
    () => () => {
      window.clearTimeout(exitTimer.current);
      window.clearTimeout(press.current.timer);
    },
    [],
  );

  if (!isValidElement<TargetProps>(children)) return children;
  const child = children as ReactElement<TargetProps>;
  const own = child.props;
  const cancelPress = () => {
    window.clearTimeout(press.current.timer);
    press.current.timer = undefined;
  };

  const target = cloneElement(child, {
    className: [own.className, s.target].filter(Boolean).join(' '),
    'data-context-open': open || undefined,
    onContextMenu: (event: MouseEvent<HTMLElement>) => {
      own.onContextMenu?.(event);
      if (disabled || event.defaultPrevented) return;
      if (keepsNativeMenu(event.target, event.currentTarget)) return;
      event.preventDefault();
      cancelPress();
      // Android dispara contextmenu no toque longo; o temporizador já pode ter aberto.
      if (press.current.fired && open) return;
      show(event.clientX, event.clientY, event.currentTarget);
    },
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      own.onKeyDown?.(event);
      if (disabled || event.defaultPrevented) return;
      const isMenuKey = event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10');
      if (!isMenuKey || keepsNativeMenu(event.target, event.currentTarget)) return;
      event.preventDefault();
      const from = event.target instanceof HTMLElement ? event.target : event.currentTarget;
      const rect = from.getBoundingClientRect();
      show(rect.left + 16, rect.top + Math.min(rect.height - 8, 36), event.currentTarget, true);
    },
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      own.onPointerDown?.(event);
      press.current.fired = false;
      if (disabled || event.pointerType !== 'touch') return;
      if (keepsNativeMenu(event.target, event.currentTarget)) return;
      const el = event.currentTarget;
      const { clientX, clientY } = event;
      press.current.x = clientX;
      press.current.y = clientY;
      cancelPress();
      press.current.timer = window.setTimeout(() => {
        press.current.fired = true;
        show(clientX, clientY, el);
      }, LONG_PRESS);
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      own.onPointerMove?.(event);
      if (press.current.timer === undefined) return;
      const dx = event.clientX - press.current.x;
      const dy = event.clientY - press.current.y;
      if (Math.hypot(dx, dy) > MOVE_TOLERANCE) cancelPress();
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      own.onPointerUp?.(event);
      cancelPress();
    },
    onPointerCancel: (event: PointerEvent<HTMLElement>) => {
      own.onPointerCancel?.(event);
      cancelPress();
    },
    // O toque longo que abriu o menu não vira clique no alvo.
    onClickCapture: (event: MouseEvent<HTMLElement>) => {
      own.onClickCapture?.(event);
      if (press.current.fired) {
        press.current.fired = false;
        event.preventDefault();
        event.stopPropagation();
      }
    },
  });

  return (
    <>
      {target}
      {phase !== 'closed' && host && (
        <MenuSurface
          key={session}
          sections={sections}
          label={label}
          rootId={rootId}
          host={host}
          anchor={() => ({ top: point.y, bottom: point.y, left: point.x, right: point.x })}
          side="bottom"
          align="start"
          gap={2}
          width={232}
          phase={phase === 'open' ? 'open' : 'closing'}
          initialFocus={focusMode}
          onDismiss={close}
        />
      )}
    </>
  );
}
