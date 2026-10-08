'use client';

import { ChevronDown, Ellipsis, LoaderCircle, type LucideIcon } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { Menu, type MenuItem, type MenuSection, type MenuTriggerProps } from './menu';
import { Tooltip } from './overlays';
import { useIsoLayoutEffect } from './popover';
import s from './toolbar.module.css';

/* ——————————————————————————————————————————————————————————————————————————
 * Toolbar — barra de ferramentas de editor (família C2).
 * Uma parada de Tab só (tabindex itinerante): ←/→ (↑/↓ na vertical), Home e End andam entre os
 * botões; Tab sai da barra. O que não cabe na largura vai para o menu “Mais” no fim da barra.
 * `keepFocus` impede que o clique tire o foco (e a seleção) do editor.
 * —————————————————————————————————————————————————————————————————————————— */

export type ToolbarSize = 'sm' | 'md';
export type ToolbarOrientation = 'horizontal' | 'vertical';

type Leaf = { kind: 'item' | 'separator'; toMenu: () => MenuItem | null };

type ToolbarContextValue = {
  size: ToolbarSize;
  orientation: ToolbarOrientation;
  keepFocus: boolean;
  /** Item com a parada de Tab. */
  active: string | null;
  hidden: ReadonlySet<string>;
  register: (key: string, leaf: Leaf) => () => void;
};

const ToolbarContext = createContext<ToolbarContextValue | null>(null);

const MORE_KEY = 'toolbar-more';
const NONE: ReadonlySet<string> = new Set();

/** Itens e separadores desta barra (não os de uma barra aninhada), na ordem do documento. */
function leavesOf(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-toolbar-leaf]')).filter(
    (el) => el.closest('[role="toolbar"]') === root,
  );
}

/** Botões que recebem foco pelas setas: itens visíveis e o “Mais”, se aparecer. */
function stopsOf(root: HTMLElement) {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      '[data-toolbar-leaf="item"]:not([data-overflowed]), [data-toolbar-more]:not([data-overflowed])',
    ),
  ).filter((el) => el.closest('[role="toolbar"]') === root);
}

const buttonOf = (el: Element | null | undefined) =>
  el?.querySelector<HTMLElement>('button') ?? null;

/**
 * Separador só aparece entre dois itens visíveis: nunca no começo, no fim ou dobrado.
 * Aplica o resultado no DOM (`data-overflowed`).
 */
function applyHidden(leaves: HTMLElement[], hiddenItems: Set<HTMLElement>) {
  let seen = false;
  let pending: HTMLElement | null = null;
  for (const el of leaves) {
    if (el.dataset.toolbarLeaf === 'separator') {
      if (pending) pending.toggleAttribute('data-overflowed', true);
      pending = seen ? el : null;
      if (!seen) el.toggleAttribute('data-overflowed', true);
      continue;
    }
    const hide = hiddenItems.has(el);
    el.toggleAttribute('data-overflowed', hide);
    if (hide) continue;
    if (pending) {
      pending.toggleAttribute('data-overflowed', false);
      pending = null;
    }
    seen = true;
  }
  if (pending) pending.toggleAttribute('data-overflowed', true);
}

function sameSet(a: ReadonlySet<string>, b: string[]) {
  return a.size === b.length && b.every((key) => a.has(key));
}

/**
 * Menu aberto a partir da barra com `keepFocus`: ao fechar escolhendo um item, o `Menu` devolve o
 * foco ao gatilho; aqui ele volta para onde estava antes (o editor), sem perder a seleção.
 */
function useMenuFocusReturn(keepFocus: boolean, trigger: () => HTMLElement | null) {
  const before = useRef<Element | null>(null);
  return (open: boolean) => {
    if (open) {
      before.current = document.activeElement;
      return;
    }
    const previous = before.current;
    before.current = null;
    if (!keepFocus) return;
    queueMicrotask(() => {
      const button = trigger();
      if (!(previous instanceof HTMLElement) || previous === button || !previous.isConnected)
        return;
      if (document.activeElement !== button) return;
      previous.focus({ preventScroll: true });
    });
  };
}

/** Registra um item ou separador na barra e devolve a chave, a parada de Tab e se está no “Mais”. */
function useLeaf(kind: Leaf['kind'], toMenu?: () => MenuItem | null) {
  const ctx = useContext(ToolbarContext);
  const key = useId();
  const latest = useRef(toMenu);
  useIsoLayoutEffect(() => {
    latest.current = toMenu;
  });
  const register = ctx?.register;
  useIsoLayoutEffect(() => {
    if (!register) return;
    return register(key, { kind, toMenu: () => latest.current?.() ?? null });
  }, [register, key, kind]);
  return {
    ctx,
    key,
    hidden: ctx?.hidden.has(key) ?? false,
    tabIndex: ctx ? (ctx.active === key ? 0 : -1) : undefined,
  };
}

function mergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as { current: T | null }).current = node;
    }
  };
}

/* ——————————————————————————— Toolbar ——————————————————————————— */

export type ToolbarProps = Omit<ComponentProps<'div'>, 'role' | 'aria-label' | 'children'> & {
  /** Nome acessível da barra (ex.: “Formatação do texto”). */
  label: string;
  children: ReactNode;
  orientation?: ToolbarOrientation;
  /** `md` 32 px (barra do editor) · `sm` 28 px (barras flutuantes e compactas). */
  size?: ToolbarSize;
  /** `plain` sem moldura · `bar` faixa com fio embaixo, para o topo do editor. */
  variant?: 'plain' | 'bar';
  /** Com `variant="bar"`: fica presa no topo da área com rolagem (fio + papel 94% com desfoque). */
  sticky?: boolean;
  /** `menu`: o que não cabe vai para “Mais” (horizontal) · `wrap`: quebra a linha. */
  overflow?: 'menu' | 'wrap';
  /** Nome do botão que recolhe os itens que não cabem. */
  overflowLabel?: string;
  /** Padrão dos itens: o clique não tira o foco do editor (a seleção continua). */
  keepFocus?: boolean;
  /**
   * Conteúdo encostado à direita, fora do roving e do “Mais” (horizontal): estado do documento,
   * como “Salvo · v2”. Entra na conta da largura — os itens saem para o “Mais” antes dele.
   */
  end?: ReactNode;
};

/**
 * Barra de ferramentas (`role="toolbar"`). Componha com `ToolbarButton`, `ToolbarToggle`,
 * `ToolbarMenu`, `ToolbarGroup` e `ToolbarSeparator`. Na horizontal, os itens que não cabem saem
 * do fim para o menu “Mais” (os marcados com `keep` ficam); a barra mede a si mesma a cada mudança
 * de largura.
 */
export function Toolbar({
  label,
  children,
  orientation = 'horizontal',
  size = 'md',
  variant = 'plain',
  sticky = false,
  overflow = 'menu',
  overflowLabel = 'Mais',
  keepFocus = false,
  end,
  className = '',
  ref,
  onKeyDown,
  onFocus,
  ...props
}: ToolbarProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const registry = useRef(new Map<string, Leaf>());
  const [version, setVersion] = useState(0);
  const [overflowed, setOverflowed] = useState<{ hidden: ReadonlySet<string>; more: boolean }>({
    hidden: NONE,
    more: false,
  });
  const hidden = overflowed.hidden;
  const [active, setActive] = useState<string | null>(null);
  const [moreSections, setMoreSections] = useState<MenuSection[]>([]);
  const menuMode = overflow === 'menu' && orientation === 'horizontal';

  const register = useCallback((key: string, leaf: Leaf) => {
    registry.current.set(key, leaf);
    setVersion((value) => value + 1);
    return () => {
      registry.current.delete(key);
      setVersion((value) => value + 1);
    };
  }, []);

  /*
   * Mede pelo próprio layout: mostra tudo; se transborda, mostra o “Mais” e esconde do fim para o
   * começo até caber. Grupos, separadores e conteúdo livre entram na conta sem caso especial.
   */
  const measure = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const leaves = leavesOf(root);
    const moreEl = Array.from(root.querySelectorAll<HTMLElement>('[data-toolbar-more]')).find(
      (el) => el.closest('[role="toolbar"]') === root,
    );
    const hiddenItems = new Set<HTMLElement>();
    applyHidden(leaves, hiddenItems);
    moreEl?.toggleAttribute('data-overflowed', true);
    const fits = () => root.scrollWidth <= root.clientWidth;
    if (menuMode && !fits()) {
      moreEl?.toggleAttribute('data-overflowed', false);
      // Saem do fim para o começo: primeiro os comuns; se nem assim couber, os marcados com
      // `keep` (o “Mais” nunca fica cortado).
      const items = leaves.filter((el) => el.dataset.toolbarLeaf === 'item');
      const candidates = [
        ...items.filter((el) => el.hasAttribute('data-keep')),
        ...items.filter((el) => !el.hasAttribute('data-keep')),
      ];
      for (let index = candidates.length - 1; index >= 0; index -= 1) {
        const el = candidates[index];
        if (!el) continue;
        hiddenItems.add(el);
        applyHidden(leaves, hiddenItems);
        if (fits()) break;
      }
    }
    const next = leaves
      .filter((el) => el.hasAttribute('data-overflowed'))
      .map((el) => el.dataset.key ?? '');
    const more = hiddenItems.size > 0;
    setOverflowed((current) =>
      sameSet(current.hidden, next) && current.more === more
        ? current
        : { hidden: new Set(next), more },
    );
  }, [menuMode]);

  const measureRef = useRef(measure);
  useIsoLayoutEffect(() => {
    measureRef.current = measure;
  });

  // Antes da pintura: nada pisca cortado na primeira montagem nem quando itens entram ou saem.
  useIsoLayoutEffect(() => {
    measure();
  }, [measure, version, size]);

  // Largura da barra e de cada item (rótulo que muda, fonte que carrega) remedem no próximo quadro.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !menuMode || typeof ResizeObserver === 'undefined') return;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        measureRef.current();
      });
    });
    observer.observe(root);
    leavesOf(root).forEach((el) => observer.observe(el));
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [menuMode, version]);

  // A parada de Tab fica num item que existe e está visível; senão, no primeiro.
  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const keys = stopsOf(root).map((el) => el.dataset.key ?? '');
    if (!keys.length) return;
    if (active && keys.includes(active)) return;
    setActive(keys[0] ?? null);
  }, [version, hidden, active]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    const root = rootRef.current;
    if (event.defaultPrevented || !root) return;
    const back = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
    const forward = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
    if (![back, forward, 'Home', 'End'].includes(event.key)) return;
    const target = event.target as HTMLElement;
    // Campo dentro da barra (endereço do link): as setas andam no texto.
    if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
    const stops = stopsOf(root);
    const current = stops.findIndex((el) => el.contains(target));
    if (current < 0 || !stops.length) return;
    const last = stops.length - 1;
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? last
          : event.key === forward
            ? current === last
              ? 0
              : current + 1
            : current === 0
              ? last
              : current - 1;
    event.preventDefault();
    buttonOf(stops[next])?.focus();
  };

  const handleFocus = (event: ReactFocusEvent<HTMLDivElement>) => {
    onFocus?.(event);
    const root = rootRef.current;
    const stop = (event.target as HTMLElement).closest<HTMLElement>(
      '[data-toolbar-leaf], [data-toolbar-more]',
    );
    if (!root || !stop || stop.closest('[role="toolbar"]') !== root) return;
    const key = stop.dataset.key;
    if (key) setActive(key);
  };

  const moreButton = useRef<HTMLButtonElement | null>(null);
  const returnFocus = useMenuFocusReturn(keepFocus, () => moreButton.current);

  /** Itens escondidos viram o menu “Mais”; um separador escondido abre uma nova seção. */
  const buildMore = () => {
    const root = rootRef.current;
    if (!root) return [];
    const sections: MenuSection[] = [];
    let items: MenuItem[] = [];
    for (const el of leavesOf(root)) {
      if (!el.hasAttribute('data-overflowed')) continue;
      const leaf = registry.current.get(el.dataset.key ?? '');
      if (!leaf) continue;
      if (leaf.kind === 'separator') {
        if (items.length) sections.push({ items });
        items = [];
        continue;
      }
      const item = leaf.toMenu();
      if (item) items.push(item);
    }
    if (items.length) sections.push({ items });
    return sections;
  };

  const value = useMemo<ToolbarContextValue>(
    () => ({ size, orientation, keepFocus, active, hidden, register }),
    [size, orientation, keepFocus, active, hidden, register],
  );

  return (
    <ToolbarContext.Provider value={value}>
      <div
        {...props}
        ref={mergeRefs(rootRef, ref)}
        role="toolbar"
        aria-label={label}
        aria-orientation={orientation === 'vertical' ? 'vertical' : undefined}
        className={`${s.toolbar} ${className}`}
        data-size={size}
        data-variant={variant}
        data-orientation={orientation}
        data-overflow={menuMode ? 'menu' : overflow === 'wrap' ? 'wrap' : undefined}
        data-sticky={(variant === 'bar' && sticky) || undefined}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
      >
        {children}
        {menuMode && (
          <span
            className={s.more}
            data-toolbar-more=""
            data-key={MORE_KEY}
            data-overflowed={!overflowed.more || undefined}
          >
            <Menu
              label={overflowLabel}
              align="end"
              sections={moreSections}
              onOpenChange={(open) => {
                if (open) setMoreSections(buildMore());
                returnFocus(open);
              }}
              trigger={(trigger) => (
                <Tooltip content={overflowLabel}>
                  <button
                    {...trigger}
                    ref={(node) => {
                      trigger.ref(node);
                      moreButton.current = node;
                    }}
                    type="button"
                    className={s.button}
                    data-size={size}
                    aria-label={overflowLabel}
                    tabIndex={active === MORE_KEY ? 0 : -1}
                    onMouseDown={keepFocus ? (event) => event.preventDefault() : undefined}
                  >
                    <Ellipsis className={s.icon} aria-hidden="true" />
                  </button>
                </Tooltip>
              )}
            />
          </span>
        )}
        {end && orientation === 'horizontal' ? (
          <div className={s.end} data-toolbar-end="">
            {end}
          </div>
        ) : null}
      </div>
    </ToolbarContext.Provider>
  );
}

/* ——————————————————————————— Grupo e separador ——————————————————————————— */

/** Grupo de itens relacionados (B I U S). Some sozinho quando todos os seus itens vão para “Mais”. */
export function ToolbarGroup({
  label,
  className = '',
  children,
  ...props
}: Omit<ComponentProps<'div'>, 'role' | 'aria-label'> & {
  /** Nome do grupo para leitor de tela (ex.: “Estilo do texto”). */
  label?: string;
}) {
  return (
    <div {...props} role="group" aria-label={label} className={`${s.group} ${className}`}>
      {children}
    </div>
  );
}

/** Fio de 1 px entre grupos. Some quando ficaria no começo, no fim ou ao lado de outro fio. */
export function ToolbarSeparator({ className = '' }: { className?: string }) {
  const leaf = useLeaf('separator');
  const vertical = leaf.ctx?.orientation === 'vertical';
  return (
    <span
      role="separator"
      aria-orientation={vertical ? 'horizontal' : 'vertical'}
      className={`${s.separator} ${className}`}
      data-toolbar-leaf="separator"
      data-key={leaf.key}
      data-overflowed={leaf.hidden || undefined}
    />
  );
}

/* ——————————————————————————— Botões ——————————————————————————— */

/** Ícone, ou o lugar do spinner: o ícone fica até 300 ms e então cede ao spinner na mesma caixa. */
function Glyph({ icon: Icon, loading }: { icon?: LucideIcon; loading: boolean }) {
  if (!loading) return Icon ? <Icon className={s.icon} aria-hidden="true" /> : null;
  return (
    <span className={s.spin} data-glyph={Icon ? '' : undefined} aria-hidden="true">
      {Icon && <Icon className={`${s.icon} ${s.spinGlyph}`} />}
      <LoaderCircle className={`${s.icon} ${s.spinner}`} />
    </span>
  );
}

const forced = (force: string | undefined, state: string) =>
  Boolean(force?.split(/\s+/).includes(state));

export type ToolbarButtonProps = Omit<
  ComponentProps<'button'>,
  'children' | 'aria-label' | 'aria-pressed' | 'type' | 'disabled'
> & {
  /** Nome do comando: vira o nome acessível e a dica (“Negrito”). */
  label: string;
  icon?: LucideIcon;
  /** Mostra o nome ao lado do ícone (ações de IA: “Encurtar”). */
  showLabel?: boolean;
  /** Atalho mostrado na dica (“⌘B”). */
  shortcut?: string;
  /** Alternável (`aria-pressed`): ligado fica em azul suave. Prefira `ToolbarToggle`. */
  pressed?: boolean;
  /**
   * Indisponível, mas alcançável pelas setas (`aria-disabled`): o clique não executa.
   * Diga o motivo em `disabledReason`.
   */
  disabled?: boolean;
  /** Motivo de estar indisponível, nomeando a ação (“Selecione um trecho para criar link”). */
  disabledReason?: string;
  /** Espera após o clique: o ícone vira spinner depois de 300 ms; o botão ignora novos cliques. */
  loading?: boolean;
  /** O clique não tira o foco do editor. Padrão: o da barra. */
  keepFocus?: boolean;
  /** Destrutivo: neutro em repouso, vermelho só no hover. */
  tone?: 'danger';
  /** Fica fora do “Mais” enquanto houver outro item para recolher. */
  keep?: boolean;
  /** Estado parado para pranchas (`hover`, `active`, `focus`; `tip` abre a dica). Nunca no produto. */
  'data-force'?: string;
};

/**
 * Botão de barra: fantasma, só ícone por padrão, com o nome na dica (e o atalho). Fora de uma
 * `Toolbar` funciona sozinho, sem tabindex itinerante.
 */
export function ToolbarButton({
  label,
  icon,
  showLabel = false,
  shortcut,
  pressed,
  disabled = false,
  disabledReason,
  loading = false,
  keepFocus,
  tone,
  keep = false,
  className = '',
  onClick,
  onMouseDown,
  ref,
  'data-force': force,
  ...props
}: ToolbarButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const blocked = disabled || loading;
  const leaf = useLeaf('item', () => ({
    label,
    icon,
    shortcut,
    checked: pressed,
    disabled: blocked,
    description: disabled ? disabledReason : undefined,
    onSelect: () => buttonRef.current?.click(),
  }));
  const size = leaf.ctx?.size ?? 'md';
  const keepsFocus = keepFocus ?? leaf.ctx?.keepFocus ?? false;
  // Rótulo visível sem atalho: a dica só repetiria o que está escrito.
  const tip = disabled && disabledReason ? disabledReason : !showLabel || shortcut ? label : null;

  const button = (
    <button
      {...props}
      ref={mergeRefs(buttonRef, ref)}
      type="button"
      className={`${s.button} ${className}`}
      aria-label={label}
      aria-pressed={pressed}
      aria-disabled={blocked || undefined}
      aria-busy={loading || undefined}
      data-size={size}
      data-tone={tone}
      data-label={showLabel || undefined}
      data-force={force}
      tabIndex={leaf.tabIndex}
      onMouseDown={(event: ReactMouseEvent<HTMLButtonElement>) => {
        onMouseDown?.(event);
        if (keepsFocus) event.preventDefault();
      }}
      onClick={(event: ReactMouseEvent<HTMLButtonElement>) => {
        if (blocked) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    >
      <Glyph icon={icon} loading={loading} />
      {showLabel && <span className={s.label}>{label}</span>}
    </button>
  );

  return (
    <span
      className={s.leaf}
      data-toolbar-leaf="item"
      data-key={leaf.key}
      data-keep={keep || undefined}
      data-overflowed={leaf.hidden || undefined}
    >
      {tip ? (
        <Tooltip
          content={tip}
          shortcut={blocked ? undefined : shortcut}
          open={forced(force, 'tip')}
        >
          {button}
        </Tooltip>
      ) : (
        button
      )}
    </span>
  );
}

export type ToolbarToggleProps = Omit<ToolbarButtonProps, 'pressed'> & {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
};

/** Liga e desliga uma marca do texto (Negrito, Itálico): `aria-pressed`, azul suave quando ligado. */
export function ToolbarToggle({ pressed, onPressedChange, onClick, ...props }: ToolbarToggleProps) {
  return (
    <ToolbarButton
      {...props}
      pressed={pressed}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onPressedChange(!pressed);
      }}
    />
  );
}

export type ToolbarMenuProps = {
  /** Nome do comando e do menu (“Estilo do parágrafo”, “Marca-texto”). */
  label: string;
  icon?: LucideIcon;
  /** Valor atual, escrito no botão (“Intertítulo”). */
  value?: string;
  /** Sem `value`: escreve o nome ao lado do ícone (“Reescrever”). */
  showLabel?: boolean;
  sections: MenuSection[];
  shortcut?: string;
  disabled?: boolean;
  disabledReason?: string;
  keepFocus?: boolean;
  /** Fica fora do “Mais” enquanto houver outro item para recolher. */
  keep?: boolean;
  /** Largura fixa do botão: o valor muda sem empurrar a barra. */
  width?: number;
  menuWidth?: number;
  align?: 'start' | 'end';
  /** Lado preferido do menu. Vira sozinho quando não cabe. */
  side?: 'bottom' | 'top';
  onOpenChange?: (open: boolean) => void;
  className?: string;
  /** Estado parado para pranchas (`hover`, `active`, `focus`, `open`, `tip`). Nunca no produto. */
  'data-force'?: string;
};

/**
 * Botão de barra que abre um `Menu` (estilo do parágrafo, marca-texto, ações de IA). Mostra o
 * valor atual quando há um. No “Mais”, vira submenu com o valor à direita.
 */
export function ToolbarMenu({
  label,
  icon,
  value,
  showLabel = false,
  sections,
  shortcut,
  disabled = false,
  disabledReason,
  keepFocus,
  keep = false,
  width,
  menuWidth,
  align = 'start',
  side = 'bottom',
  onOpenChange,
  className = '',
  'data-force': force,
}: ToolbarMenuProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const leaf = useLeaf('item', () => ({
    label,
    icon,
    meta: value,
    disabled,
    description: disabled ? disabledReason : undefined,
    items: sections.flatMap((section) => section.items),
  }));
  const ctx = leaf.ctx;
  const size = ctx?.size ?? 'md';
  const vertical = ctx?.orientation === 'vertical';
  const keepsFocus = keepFocus ?? ctx?.keepFocus ?? false;
  const returnFocus = useMenuFocusReturn(keepsFocus, () => triggerRef.current);
  const text = value ?? (showLabel ? label : undefined);
  // Com valor, o nome inclui o valor; a dica diz o mesmo (o leitor não ouve duas vezes).
  const name = value ? `${label}: ${value}` : label;
  const tip = disabled && disabledReason ? disabledReason : name;

  const renderTrigger = (trigger: MenuTriggerProps) => (
    <Tooltip content={tip} shortcut={disabled ? undefined : shortcut} open={forced(force, 'tip')}>
      <button
        {...trigger}
        ref={(node) => {
          trigger.ref(node);
          triggerRef.current = node;
        }}
        type="button"
        className={`${s.button} ${className}`}
        aria-label={name}
        aria-disabled={disabled || undefined}
        data-size={size}
        data-menu=""
        data-label={text ? '' : undefined}
        data-force={force}
        style={width ? { width } : undefined}
        tabIndex={leaf.tabIndex}
        onMouseDown={keepsFocus ? (event) => event.preventDefault() : undefined}
        onClick={(event) => {
          if (disabled) return;
          trigger.onClick(event);
        }}
        onKeyDown={(event) => {
          if (disabled) return;
          // Na vertical, ↑/↓ andam pela barra; o menu abre com Enter ou Espaço.
          if (vertical && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) return;
          trigger.onKeyDown(event);
        }}
      >
        <Glyph icon={icon} loading={false} />
        {text && <span className={s.label}>{text}</span>}
        <ChevronDown className={s.chevron} aria-hidden="true" />
      </button>
    </Tooltip>
  );

  return (
    <span
      className={s.leaf}
      data-toolbar-leaf="item"
      data-key={leaf.key}
      data-keep={keep || undefined}
      data-overflowed={leaf.hidden || undefined}
    >
      <Menu
        label={label}
        sections={sections}
        align={align}
        side={side}
        width={menuWidth}
        onOpenChange={(open) => {
          returnFocus(open);
          onOpenChange?.(open);
        }}
        trigger={renderTrigger}
      />
    </span>
  );
}
