'use client';

import {
  Bell,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Ellipsis,
  LoaderCircle,
  Menu as MenuIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { VisuallyHidden } from './a11y';
import { Badge, Kbd, type Tone } from './badge';
import { IconButton } from './button';
import { Avatar, BrandMark } from './identity';
import { floatingHost, Menu, type MenuItem, type MenuSection } from './menu';
import { Tooltip, useClipped } from './overlays';
import s from './app-shell.module.css';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Compara sem acento e sem caixa. */
const fold = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\u2060/g, '')
    .toLowerCase();

/* ——————————————————————————— Contexto ——————————————————————————— */

type ShellState = {
  /** Barra recolhida (só ícones). Nunca vale no modo gaveta. */
  collapsed: boolean;
  /** Largura até 1199 px: a barra vira gaveta. */
  drawer: boolean;
  /** `layout="immersive"`: sem menu do app; o topo não mostra botão de menu nem de recolher. */
  immersive: boolean;
  navOpen: boolean;
  openNav: () => void;
  closeNav: () => void;
  navId: string;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
};

const noop = () => undefined;
const ShellContext = createContext<ShellState>({
  collapsed: false,
  drawer: false,
  immersive: false,
  navOpen: false,
  openNav: noop,
  closeNav: noop,
  navId: '',
  menuButtonRef: { current: null },
});

/** Estado do shell para as peças da barra lateral e do topo. */
export function useShell() {
  return useContext(ShellContext);
}

/* ——————————————————————————— AppShell ——————————————————————————— */

/** Largura padrão do shell abaixo da qual o menu vira gaveta (a do `@container shell` no CSS). */
const SHELL_BREAKPOINT = 1200;

/**
 * Moldura do app (igual ao /dashboardv3): menu lateral de 236 px em g-25 encostado, com fio à
 * direita; topo de 52 px com fio — um único fio corre do menu ao conteúdo; conteúdo branco direto.
 * Até 1199 px de largura o menu vira gaveta (véu, Escape, conteúdo `inert`). Quem decide gaveta ou
 * barra é o CSS (`@container shell`): o HTML do servidor e a primeira pintura no celular já saem com
 * a gaveta fechada, sem a barra espremendo a página; o JS só abre, fecha e cuida do foco. Com
 * `breakpoint` fora do padrão a decisão é medida no cliente. `fill` ocupa a
 * altura do contêiner (o conteúdo rola por dentro); sem `fill`, a página cresce com o conteúdo.
 * `bleed` tira o respiro e a largura máxima do conteúdo: para áreas de trabalho encostadas
 * (`WorkspaceLayout docked`, `FixedFrame docked`) que ocupam a tela de ponta a ponta.
 * `layout="immersive"` é a tela de trabalho sem o menu do app (o texto de uma produção, o
 * documento de um editor): nenhuma coluna de menu, nenhuma gaveta, nenhum botão de menu, em qualquer
 * largura — o `sidebar` nem é desenhado (pode ser `null`) e o `topbar` é opcional. A volta fica no
 * cabeçalho da página (`PageHeader back`). Sem `topbar`, a moldura encostada ocupa a altura toda.
 */
export function AppShell({
  sidebar,
  topbar,
  children,
  collapsed = false,
  fill = false,
  bleed = false,
  contentAs: Content = 'main',
  className = '',
  style,
  defaultNavOpen = false,
  navOpen: navOpenProp,
  onNavOpenChange,
  layout = 'auto',
  breakpoint = SHELL_BREAKPOINT,
}: {
  /** O menu lateral. Ignorado em `layout="immersive"` (passe `null`). */
  sidebar?: ReactNode;
  topbar?: ReactNode;
  children: ReactNode;
  collapsed?: boolean;
  fill?: boolean;
  /** Conteúdo sem respiro nem largura máxima (áreas de trabalho encostadas). */
  bleed?: boolean;
  /** Use `div` quando o shell é exibido dentro de outra página que já tem `<main>`. */
  contentAs?: 'main' | 'div';
  className?: string;
  style?: CSSProperties;
  /** Gaveta aberta ao montar (só tem efeito até 1199 px). */
  defaultNavOpen?: boolean;
  navOpen?: boolean;
  onNavOpenChange?: (open: boolean) => void;
  /**
   * `auto`: gaveta até 1199 px de largura. `desktop`/`drawer` fixam o modo (pranchas, molduras
   * pequenas). `immersive`: sem menu do app em nenhuma largura (tela de trabalho de um documento).
   */
  layout?: 'auto' | 'desktop' | 'drawer' | 'immersive';
  /**
   * Largura do shell abaixo da qual, em `auto`, o menu vira gaveta. O padrão (1200) é decidido no
   * CSS; outro valor é medido no cliente (a primeira pintura do servidor sai com a barra).
   */
  breakpoint?: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  // Modo fixo já vale no servidor; em `auto` o CSS desenha a gaveta antes desta medida chegar.
  const [drawer, setDrawer] = useState(layout === 'drawer');
  const [navOpenState, setNavOpenState] = useState(defaultNavOpen);
  const navOpen = navOpenProp ?? navOpenState;
  const navId = useId();
  const restoreFocus = useRef(false);
  const focusOnOpen = useRef(false);
  const open = drawer && navOpen;
  // Imersivo: nenhum menu do app — nem coluna, nem gaveta, nem botão. A volta fica na página.
  const immersive = layout === 'immersive';
  const hasTopbar = topbar !== undefined && topbar !== null && topbar !== false;

  const setNavOpen = useCallback(
    (value: boolean) => {
      if (navOpenProp === undefined) setNavOpenState(value);
      onNavOpenChange?.(value);
    },
    [navOpenProp, onNavOpenChange],
  );

  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (layout !== 'auto') {
      setDrawer(layout === 'drawer');
      return;
    }
    const measure = () => setDrawer(root.clientWidth < breakpoint);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [layout, breakpoint]);

  useEffect(() => {
    if (!open) {
      // O conteúdo só deixa de ser inerte depois do commit: o foco volta aqui, não no clique.
      if (restoreFocus.current) menuButtonRef.current?.focus();
      restoreFocus.current = false;
      return;
    }
    if (focusOnOpen.current) {
      focusOnOpen.current = false;
      rootRef.current
        ?.querySelector<HTMLElement>(
          `[data-part='sidebar'] :is(a[href], button:not(:disabled, [aria-disabled='true']), input)`,
        )
        ?.focus();
    }
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      restoreFocus.current = true;
      setNavOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, setNavOpen]);

  const value = useMemo<ShellState>(
    () => ({
      collapsed: collapsed && !drawer && !immersive,
      drawer,
      immersive,
      navOpen: open,
      // Sem menu, nada para o topo abrir ou controlar.
      navId: immersive ? '' : navId,
      menuButtonRef,
      openNav: () => {
        focusOnOpen.current = true;
        setNavOpen(true);
      },
      closeNav: () => {
        if (!open) return;
        restoreFocus.current = true;
        setNavOpen(false);
      },
    }),
    [collapsed, drawer, immersive, open, navId, setNavOpen],
  );

  return (
    <ShellContext.Provider value={value}>
      <div
        ref={rootRef}
        className={`${s.shell} ${className}`}
        style={style}
        data-collapsed={(collapsed && !drawer && !immersive) || undefined}
        data-drawer={drawer || undefined}
        data-layout={layout === 'auto' && breakpoint !== SHELL_BREAKPOINT ? 'measured' : layout}
        data-fill={fill || undefined}
        data-bleed={bleed || undefined}
        data-nav-open={open || undefined}
        data-no-topbar={!hasTopbar || undefined}
        data-part="shell"
      >
        <div className={s.frame}>
          {!immersive && sidebar}
          {!immersive && (
            <button
              type="button"
              className={s.veil}
              aria-label="Fechar menu"
              tabIndex={-1}
              aria-hidden={!open || undefined}
              onClick={value.closeNav}
            />
          )}
          <div className={s.main} inert={open || undefined} data-part="main">
            {topbar}
            <Content className={s.content} data-part="content">
              {children}
            </Content>
          </div>
        </div>
      </div>
    </ShellContext.Provider>
  );
}

/* ——————————————————————————— Destaque de busca ——————————————————————————— */

function matchRange(text: string, query: string): [number, number] | null {
  const term = fold(query.trim());
  if (!term) return null;
  let folded = '';
  const map: number[] = [];
  for (let index = 0; index < text.length; index += 1) {
    for (const char of fold(text.charAt(index))) {
      folded += char;
      map.push(index);
    }
  }
  const at = folded.indexOf(term);
  if (at < 0) return null;
  const start = map[at];
  const end = map[at + term.length - 1];
  return start === undefined || end === undefined ? null : [start, end + 1];
}

/** Trecho que casa com a busca, em fundo azul 100 (sem acento, sem caixa). */
export function Highlight({ text, query }: { text: string; query: string }) {
  const range = matchRange(text, query);
  if (!range) return <>{text}</>;
  return (
    <>
      {text.slice(0, range[0])}
      <mark className={s.mark}>{text.slice(range[0], range[1])}</mark>
      {text.slice(range[1])}
    </>
  );
}

/* ——————————————————————————— Dica lateral ——————————————————————————— */

/*
 * Uma dica lateral por vez: a que o ponteiro ou o foco abriu vence a mantida aberta (`peek`).
 * Estado de módulo, compartilhado por todas as barras da página.
 */
let liveTip: string | null = null;
const tipListeners = new Set<() => void>();
function setLiveTip(id: string | null) {
  if (liveTip === id) return;
  liveTip = id;
  tipListeners.forEach((listener) => listener());
}
function subscribeTip(listener: () => void) {
  tipListeners.add(listener);
  return () => {
    tipListeners.delete(listener);
  };
}
const readTip = () => liveTip;
const readNoTip = () => null;

/** Dica à direita para itens só-ícone da barra recolhida. Fixa na janela; o nome acessível fica no controle. */
function SideTip({
  content,
  detail,
  shortcut,
  stack = false,
  open: forced = false,
  children,
}: {
  content: string;
  detail?: ReactNode;
  shortcut?: string;
  /** Detalhe numa linha própria, com quebra até 240 px (um motivo, não um número). */
  stack?: boolean;
  open?: boolean;
  children: ReactNode;
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [hover, setHover] = useState(false);
  const [place, setPlace] = useState<{ top: number; left: number; host: Element } | null>(null);
  const tipId = useId();
  const live = useSyncExternalStore(subscribeTip, readTip, readNoTip);
  const visible = hover || (forced && (live === null || live === tipId));

  useEffect(() => {
    if (!hover) return;
    setLiveTip(tipId);
    return () => {
      if (liveTip === tipId) setLiveTip(null);
    };
  }, [hover, tipId]);

  useIsoLayoutEffect(() => {
    if (!visible) {
      setPlace(null);
      return;
    }
    const update = () => {
      const anchor = anchorRef.current;
      const host = floatingHost(anchor);
      if (!anchor || !host) return;
      const rect = anchor.getBoundingClientRect();
      setPlace({ top: rect.top + rect.height / 2, left: rect.right + 10, host });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [visible]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <span
      ref={anchorRef}
      className={s.tipAnchor}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'mouse') return;
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setHover(true), 150);
      }}
      onPointerLeave={() => {
        window.clearTimeout(timer.current);
        setHover(false);
      }}
      onFocus={(event) => {
        if (event.target instanceof HTMLElement && event.target.matches(':focus-visible'))
          setHover(true);
      }}
      onBlur={() => setHover(false)}
    >
      {children}
      {place &&
        createPortal(
          <span
            className={s.tip}
            style={{ top: place.top, left: place.left }}
            data-stack={stack || undefined}
            aria-hidden="true"
          >
            {content}
            {detail !== undefined && <span className={s.tipDetail}>{detail}</span>}
            {shortcut && <kbd>{shortcut}</kbd>}
          </span>,
          place.host,
        )}
    </span>
  );
}

/* ——————————————————————————— Barra lateral ——————————————————————————— */

export type NavItem = {
  id: string;
  label: string;
  icon?: LucideIcon;
  /** Ponto de cor no lugar do ícone (itens fixados, projetos). */
  dot?: Tone;
  count?: number | string;
  /** `accent` para o que pede ação (aprovações pendentes); recolhida, vira um ponto azul. */
  countTone?: 'neutral' | 'accent';
  href?: string;
  /**
   * Está no mapa do produto, mas ainda não abre (roadmap). Ícone e nome esmaecidos, selo “Em breve”
   * no lugar da contagem; não navega (`href` e `onNavigate` ficam de fora), nunca é o ativo e, na
   * gaveta, tocar não a fecha. Focável, com `aria-disabled`; o `reason` vai na dica do DS e em
   * `aria-describedby`.
   */
  soon?: NavSoon;
  /** Estado parado para pranchas: `hover`, `active`, `focus`; `tip` abre a dica de um item `soon`. */
  force?: string;
};

/** `true` ou o texto do selo (padrão “Em breve”) e o motivo (“Chega com a R2.”). */
export type NavSoon = boolean | { label?: string; reason?: string };

export type NavGroup = {
  id: string;
  label?: string;
  items: NavItem[];
  /** Rótulo vira botão que recolhe o grupo. */
  collapsible?: boolean;
  defaultOpen?: boolean;
};

type SoonText = { label: string; reason?: string };

function soonOf(soon: NavSoon | undefined): SoonText | null {
  if (!soon) return null;
  const options = soon === true ? {} : soon;
  return { label: options.label || 'Em breve', reason: options.reason || undefined };
}

const forcedTip = (force: string | undefined) => Boolean(force?.split(/\s+/).includes('tip'));

function NavGlyph({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <span className={s.navIcon} aria-hidden="true">
      {Icon ? (
        <Icon />
      ) : item.dot ? (
        <i className={s.dot} style={{ '--dot': `var(--${item.dot}-dot)` } as CSSProperties} />
      ) : null}
    </span>
  );
}

/**
 * Item que ainda não abre. Botão sem ação (`aria-disabled`): o teclado chega nele para ler o motivo,
 * mas Enter, Espaço e clique não navegam nem fecham a gaveta. Nome “Rótulo, Em breve”; o motivo é a
 * descrição e aparece na dica do DS (aberta, recolhida, e por 1,5 s no toque). Quando o nome corta,
 * a dica também o traz.
 */
function SoonEntry({
  item,
  soon,
  peek,
  query,
}: {
  item: NavItem;
  soon: SoonText;
  peek?: string;
  query: string;
}) {
  const { collapsed } = useShell();
  const reasonId = useId();
  const [labelRef, clipped] = useClipped<HTMLSpanElement>([item.label, collapsed]);
  const control = (
    <button
      type="button"
      className={s.navItem}
      aria-label={`${item.label}, ${soon.label}`}
      aria-disabled="true"
      aria-describedby={soon.reason ? reasonId : undefined}
      data-soon=""
      data-plain={item.icon ? undefined : true}
      data-force={item.force}
    >
      <NavGlyph item={item} />
      {!collapsed && (
        <>
          <span ref={labelRef} className={s.navLabel}>
            <Highlight text={item.label} query={query} />
          </span>
          <span className={s.navSoon}>
            <Badge tone="gray" size="sm">
              {soon.label}
            </Badge>
          </span>
        </>
      )}
    </button>
  );
  const tip =
    [clipped ? item.label : undefined, soon.reason].filter(Boolean).join(' · ') || undefined;
  return (
    <li>
      {collapsed ? (
        <SideTip
          content={`${item.label} · ${soon.label}`}
          detail={soon.reason}
          stack
          open={peek === item.id}
        >
          {control}
        </SideTip>
      ) : (
        <Tooltip
          bare
          describe={false}
          content={tip ?? ''}
          disabled={!tip}
          open={Boolean(tip) && forcedTip(item.force)}
        >
          {control}
        </Tooltip>
      )}
      {soon.reason && (
        <span id={reasonId} hidden>
          {soon.reason}
        </span>
      )}
    </li>
  );
}

function NavEntry({
  item,
  active,
  onNavigate,
  peek,
  query = '',
}: {
  item: NavItem;
  active?: string;
  onNavigate?: (id: string, event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
  peek?: string;
  query?: string;
}) {
  const { collapsed, closeNav } = useShell();
  const soon = soonOf(item.soon);
  if (soon) return <SoonEntry item={item} soon={soon} peek={peek} query={query} />;
  const current = item.id === active;
  const accent = item.countTone === 'accent';
  const countText = item.count !== undefined ? String(item.count) : undefined;
  const inner = (
    <>
      <NavGlyph item={item} />
      {collapsed ? (
        <>
          <VisuallyHidden>
            {item.label}
            {countText ? `, ${countText}` : ''}
          </VisuallyHidden>
          {accent && countText && <i className={s.pip} aria-hidden="true" />}
        </>
      ) : (
        <>
          <span className={s.navLabel}>
            <Highlight text={item.label} query={query} />
          </span>
          {countText && (
            <span className={s.navCount} data-tone={accent ? 'accent' : undefined}>
              {countText}
            </span>
          )}
        </>
      )}
    </>
  );
  const shared = {
    className: s.navItem,
    'aria-current': current ? ('page' as const) : undefined,
    title: !collapsed && item.label.length > 24 ? item.label : undefined,
    'data-plain': item.icon ? undefined : true,
    'data-force': item.force,
    onClick: (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
      onNavigate?.(item.id, event);
      closeNav();
    },
  };
  const control = item.href ? (
    <a {...shared} href={item.href}>
      {inner}
    </a>
  ) : (
    <button {...shared} type="button">
      {inner}
    </button>
  );
  return (
    <li>
      {collapsed ? (
        <SideTip content={item.label} detail={countText} open={peek === item.id}>
          {control}
        </SideTip>
      ) : (
        control
      )}
    </li>
  );
}

/** Um item do menu lateral fora da barra — para pranchas de estado e composições. */
export function SidebarItem({ item, active = false }: { item: NavItem; active?: boolean }) {
  return (
    <ul className={s.list}>
      <NavEntry item={item} active={active ? item.id : undefined} />
    </ul>
  );
}

function NavSection({
  group,
  active,
  onNavigate,
  peek,
  query,
}: {
  group: NavGroup;
  active?: string;
  onNavigate?: (id: string, event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
  peek?: string;
  query: string;
}) {
  const { collapsed } = useShell();
  const [open, setOpen] = useState(group.defaultOpen ?? true);
  const listId = useId();
  const labelId = `${listId}-label`;
  // Recolhida, um grupo recolhível fechado (“Em breve”) não desenha os ícones dele: o trilho não
  // abre grupos, e a fileira de ícones de um grupo fechado encheria o trilho de itens que a barra
  // larga esconde.
  const showItems = open || Boolean(query) || (collapsed && !group.collapsible);
  return (
    <div className={s.group}>
      {group.label &&
        (collapsed ? (
          showItems && <hr className={s.groupRule} aria-hidden="true" />
        ) : group.collapsible ? (
          <button
            type="button"
            id={labelId}
            className={s.groupLabel}
            aria-expanded={showItems}
            aria-controls={listId}
            onClick={() => setOpen((value) => !value)}
            data-part="group-label"
          >
            {group.label}
            <ChevronDown aria-hidden="true" />
          </button>
        ) : (
          <span id={labelId} className={s.groupLabel} data-part="group-label">
            {group.label}
          </span>
        ))}
      {showItems && (
        <ul
          id={listId}
          className={s.list}
          aria-labelledby={group.label && !collapsed ? labelId : undefined}
          aria-label={group.label && collapsed ? group.label : undefined}
        >
          {group.items.map((item) => (
            <NavEntry
              key={item.id}
              item={item}
              active={active}
              onNavigate={onNavigate}
              peek={peek}
              query={query}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

/** Busca discreta que filtra o próprio menu, com o trecho encontrado em destaque. Escape limpa. */
function SidebarFilter({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <label className={s.filter} data-part="filter">
      <Search aria-hidden="true" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && value) {
            event.preventDefault();
            onChange('');
          }
        }}
        placeholder={placeholder}
        aria-label={label}
        type="search"
        autoComplete="off"
        spellCheck={false}
      />
      {value && (
        <button
          type="button"
          className={s.filterClear}
          aria-label="Limpar busca"
          onClick={() => onChange('')}
        >
          <X aria-hidden="true" />
        </button>
      )}
    </label>
  );
}

/**
 * Menu lateral encostado: identidade (portal ou marca) numa linha de 52 px alinhada ao fio do topo,
 * busca discreta, grupos e conta no rodapé. O ativo é o único item com barra lateral azul.
 */
export function Sidebar({
  label = 'Menu principal',
  product,
  switcher,
  search,
  filter,
  groups,
  active,
  onNavigate,
  utilities,
  account,
  footer,
  peek,
}: {
  label?: string;
  product?: ReactNode;
  switcher?: ReactNode;
  /** Botão que abre a busca rápida (`SidebarSearch`). */
  search?: ReactNode;
  /** Campo que filtra os itens do próprio menu. */
  filter?: boolean | { placeholder?: string; label?: string };
  groups: NavGroup[];
  active?: string;
  onNavigate?: (id: string, event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
  /** Itens do rodapé (configurações, ajuda). */
  utilities?: NavItem[];
  account?: ReactNode;
  /** Linha discreta abaixo da conta (ex.: “Prévia · dados fictícios”). */
  footer?: ReactNode;
  /** Mantém a dica de um item aberta — só para documentação da barra recolhida. */
  peek?: string;
}) {
  const { collapsed, navId } = useShell();
  const [query, setQuery] = useState('');
  const term = collapsed ? '' : fold(query.trim());
  const visibleGroups = term
    ? groups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => fold(item.label).includes(term)),
        }))
        .filter((group) => group.items.length > 0)
    : groups;
  const filterOptions = typeof filter === 'object' ? filter : {};
  const identity = product ?? switcher;
  return (
    <div id={navId || undefined} className={s.sidebar} data-part="sidebar">
      {identity && <div className={s.identity}>{identity}</div>}
      {product && switcher && <div className={s.sideTools}>{switcher}</div>}
      {search && <div className={s.searchSlot}>{search}</div>}
      {filter && !collapsed && (
        <SidebarFilter
          value={query}
          onChange={setQuery}
          placeholder={filterOptions.placeholder ?? 'Buscar no menu…'}
          label={filterOptions.label ?? 'Buscar no menu'}
        />
      )}
      <nav aria-label={label} className={s.nav}>
        {visibleGroups.map((group) => (
          <NavSection
            key={group.id}
            group={group}
            active={active}
            onNavigate={onNavigate}
            peek={peek}
            query={term ? query.trim() : ''}
          />
        ))}
        {term && visibleGroups.length === 0 && (
          <p className={s.navEmpty} role="status">
            Nada para “{query.trim()}”
          </p>
        )}
      </nav>
      {(utilities?.length || account || footer) && (
        <div className={s.sideFoot}>
          {utilities && utilities.length > 0 && (
            <ul className={s.list} aria-label="Utilidades">
              {utilities.map((item) => (
                <NavEntry
                  key={item.id}
                  item={item}
                  active={active}
                  onNavigate={onNavigate}
                  peek={peek}
                />
              ))}
            </ul>
          )}
          {account}
          {footer && !collapsed && <div className={s.footNote}>{footer}</div>}
        </div>
      )}
    </div>
  );
}

/** Marca do produto na linha de identidade. Desenho próprio, sem letras. */
export function ProductMark({ name = 'MediaOn', caption }: { name?: string; caption?: string }) {
  const { collapsed } = useShell();
  return (
    <div className={s.product} data-part="product">
      <span className={s.logo} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
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
      </span>
      {collapsed ? (
        <VisuallyHidden>{name}</VisuallyHidden>
      ) : (
        <span className={s.productText}>
          <strong>{name}</strong>
          {caption && <span>{caption}</span>}
        </span>
      )}
    </div>
  );
}

export type Portal = {
  id: string;
  name: string;
  /** Papel no portal, mostrado no gatilho (“Portal do organizador”). */
  detail: string;
  /** Período da feira, mostrado no menu no lugar do papel. */
  period?: string;
  /** `archived`: feira encerrada (esmaecida, “Encerrado”); `draft`: em montagem. */
  status?: 'active' | 'archived' | 'draft';
  /** Texto do status à direita no menu. Padrão: “Encerrado” para `archived`. */
  statusLabel?: string;
};

/**
 * Seletor de portal: linha chapada (sem cartão, fio ou sombra) com a marca, o nome e o papel.
 * Abre um menu de 260 px com os portais, o atual marcado e uma ação no fim. Recolhida: só a marca.
 */
export function PortalSwitcher({
  portals,
  value,
  onChange,
  action,
  label = 'Trocar de portal',
  markSize = 'md',
  force,
  peek = false,
}: {
  portals: Portal[];
  value: string;
  onChange: (id: string) => void;
  action?: MenuItem;
  label?: string;
  markSize?: 'sm' | 'md';
  /** Estado parado para pranchas: `hover`, `active` ou `focus`. */
  force?: string;
  /** Recolhida: mantém a dica aberta (documentação). */
  peek?: boolean;
}) {
  const { collapsed } = useShell();
  const current = portals.find((portal) => portal.id === value) ?? portals[0];
  if (!current) return null;
  const sections: MenuSection[] = [
    {
      label: 'Portais',
      items: portals.map((portal) => ({
        label: portal.name,
        description: portal.period ?? portal.detail,
        leading: <BrandMark name={portal.name} size="xs" variant="soft" decorative />,
        checked: portal.id === value,
        muted: portal.status === 'archived' || undefined,
        meta: portal.statusLabel ?? (portal.status === 'archived' ? 'Encerrado' : undefined),
        onSelect: () => onChange(portal.id),
      })),
    },
    ...(action ? [{ items: [action] }] : []),
  ];
  const trigger = (
    <Menu
      label={label}
      width={260}
      sections={sections}
      trigger={(props) => (
        <button
          {...props}
          type="button"
          className={s.portal}
          aria-label={`${current.name}, ${current.detail}. ${label}`}
          data-force={force}
          data-part="switcher"
        >
          <BrandMark name={current.name} size={collapsed ? 'md' : markSize} decorative />
          {!collapsed && (
            <>
              <span className={s.portalText}>
                <strong>{current.name}</strong>
                <span>{current.detail}</span>
              </span>
              <ChevronsUpDown className={s.portalIcon} aria-hidden="true" />
            </>
          )}
        </button>
      )}
    />
  );
  return (
    <div className={s.menuWrap}>
      {collapsed ? (
        <SideTip content={current.name} detail={current.detail} open={peek}>
          {trigger}
        </SideTip>
      ) : (
        trigger
      )}
    </div>
  );
}

/**
 * Botão de busca rápida na barra lateral (abre o `CommandPalette`). Com `bindShortcut`, escuta
 * ⌘K / Ctrl+K na janela — ligue em um único shell por página.
 */
export function SidebarSearch({
  onOpen,
  label = 'Buscar',
  shortcut = '⌘K',
  bindShortcut = false,
}: {
  onOpen: () => void;
  label?: string;
  shortcut?: string;
  bindShortcut?: boolean;
}) {
  const { collapsed } = useShell();
  const openRef = useRef(onOpen);
  useEffect(() => {
    openRef.current = onOpen;
  }, [onOpen]);
  useEffect(() => {
    if (!bindShortcut) return;
    function onKey(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openRef.current();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [bindShortcut]);
  const button = (
    <button
      type="button"
      className={s.search}
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-keyshortcuts="Meta+K Control+K"
      data-part="search"
    >
      <Search aria-hidden="true" />
      {collapsed ? (
        <VisuallyHidden>{label}</VisuallyHidden>
      ) : (
        <>
          <span className={s.searchText}>{label}</span>
          <Kbd>{shortcut}</Kbd>
        </>
      )}
    </button>
  );
  return collapsed ? (
    <SideTip content={label} shortcut={shortcut}>
      {button}
    </SideTip>
  ) : (
    button
  );
}

/** Conta no rodapé da barra lateral: orbe, nome e papel. O menu abre para cima. */
export function SidebarAccount({
  name,
  src,
  detail,
  sections,
  presence,
}: {
  name: string;
  src?: string;
  detail: string;
  sections: MenuSection[];
  presence?: 'online' | 'away' | 'offline';
}) {
  const { collapsed } = useShell();
  const trigger = (
    <Menu
      label="Conta"
      width={248}
      side="top"
      sections={sections}
      trigger={(props) => (
        <button
          {...props}
          type="button"
          className={s.account}
          aria-label={`${name}, ${detail}. Menu da conta`}
          data-part="account"
        >
          <Avatar name={name} src={src} size="md" presence={presence} decorative />
          {!collapsed && (
            <>
              <span className={s.accountText}>
                <strong>{name}</strong>
                <span>{detail}</span>
              </span>
              <ChevronsUpDown className={s.portalIcon} aria-hidden="true" />
            </>
          )}
        </button>
      )}
    />
  );
  return (
    <div className={s.menuWrap}>
      {collapsed ? <SideTip content={name}>{trigger}</SideTip> : trigger}
    </div>
  );
}

/* ——————————————————————————— Trilha ——————————————————————————— */

export type Crumb = {
  label: string;
  href?: string;
  onClick?: () => void;
  /** Marca da entidade (BrandMark xs) antes do nome. */
  leading?: ReactNode;
  /** Estado parado para pranchas: `hover` ou `focus`. */
  force?: string;
};

const LONG_CRUMB = 34;

/** Nome completo numa `Tooltip` do DS quando o nível é longo ou quando a reticência corta o texto. */
function useClippedTitle(label: string) {
  const ref = useRef<HTMLSpanElement>(null);
  const [clipped, setClipped] = useState(false);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setClipped(el.scrollWidth > el.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [label]);
  return { ref, title: clipped || label.length > LONG_CRUMB ? label : undefined };
}

function CrumbNode({ item, current }: { item: Crumb; current: boolean }) {
  const { ref: textRef, title } = useClippedTitle(item.label);
  const body = (
    <>
      {item.leading && (
        <span className={s.crumbLead} aria-hidden="true">
          {item.leading}
        </span>
      )}
      <span ref={textRef} className={s.crumbText}>
        {item.label}
      </span>
    </>
  );
  const node = current ? (
    <span className={s.crumbCurrent} aria-current="page">
      {body}
    </span>
  ) : item.href ? (
    <a className={s.crumbLink} href={item.href} onClick={item.onClick} data-force={item.force}>
      {body}
    </a>
  ) : (
    <button type="button" className={s.crumbLink} onClick={item.onClick} data-force={item.force}>
      {body}
    </button>
  );
  // O nome inteiro na dica do DS (nunca o `title` nativo), só quando o nível corta.
  return (
    <Tooltip content={item.label} bare side="bottom" describe={false} disabled={!title}>
      {node}
    </Tooltip>
  );
}

/** Um nível da trilha fora da `Breadcrumb` — para pranchas de estado. */
export function BreadcrumbItem({ item, current = false }: { item: Crumb; current?: boolean }) {
  return (
    <span className={s.crumbs}>
      <CrumbNode item={item} current={current} />
    </span>
  );
}

function goTo(item: Crumb) {
  if (item.onClick) item.onClick();
  else if (item.href) window.location.assign(item.href);
}

/**
 * Trilha de navegação. O último item é a página atual (texto, não link). Com `maxItems`, os níveis
 * do meio recolhem num “…” que abre um menu. `compact` mostra só “‹ nível acima” (celular).
 */
export function Breadcrumb({
  items,
  label = 'Trilha de navegação',
  maxItems,
  variant = 'default',
  moreOpenForce,
}: {
  items: Crumb[];
  label?: string;
  /** A partir de quantos níveis o meio recolhe (mín. 3). */
  maxItems?: number;
  variant?: 'default' | 'compact';
  /** Prancha: força um estado no botão “…”. */
  moreOpenForce?: string;
}) {
  if (variant === 'compact') {
    const parent = items[items.length - 2];
    const current = items[items.length - 1];
    return (
      <nav aria-label={label} className={s.crumbs} data-variant="compact">
        {parent ? (
          parent.href ? (
            <a
              className={s.crumbBack}
              href={parent.href}
              onClick={parent.onClick}
              data-force={parent.force}
            >
              <ChevronLeft aria-hidden="true" />
              <span className={s.crumbText}>{parent.label}</span>
            </a>
          ) : (
            <button
              type="button"
              className={s.crumbBack}
              onClick={parent.onClick}
              data-force={parent.force}
            >
              <ChevronLeft aria-hidden="true" />
              <span className={s.crumbText}>{parent.label}</span>
            </button>
          )
        ) : (
          current && <CrumbNode item={current} current />
        )}
      </nav>
    );
  }
  const limit = maxItems && maxItems >= 3 ? maxItems : undefined;
  const collapse = limit !== undefined && items.length > limit;
  const tailCount = limit ? limit - 2 : 0;
  const head = collapse ? items.slice(0, 1) : items;
  const hidden = collapse ? items.slice(1, items.length - tailCount) : [];
  const tail = collapse ? items.slice(items.length - tailCount) : [];
  const lastIndex = items.length - 1;
  const sep = <ChevronRight className={s.crumbSep} aria-hidden="true" />;
  return (
    <nav aria-label={label} className={s.crumbs}>
      <ol>
        {head.map((item, index) => (
          <li key={`h-${item.label}-${index}`}>
            {index > 0 && sep}
            <CrumbNode item={item} current={!collapse && index === lastIndex} />
          </li>
        ))}
        {collapse && (
          <li>
            {sep}
            <Menu
              label="Níveis ocultos"
              width={240}
              sections={[
                {
                  items: hidden.map((item) => ({ label: item.label, onSelect: () => goTo(item) })),
                },
              ]}
              trigger={(props) => (
                <Tooltip content={hidden.map((item) => item.label).join(' › ')} bare side="bottom">
                  <button
                    {...props}
                    type="button"
                    className={s.crumbMore}
                    aria-label={`Mostrar ${hidden.length} ${hidden.length === 1 ? 'nível oculto' : 'níveis ocultos'}`}
                    data-force={moreOpenForce}
                  >
                    <Ellipsis aria-hidden="true" />
                  </button>
                </Tooltip>
              )}
            />
          </li>
        )}
        {tail.map((item, index) => (
          <li key={`t-${item.label}-${index}`}>
            {sep}
            <CrumbNode item={item} current={index === tail.length - 1} />
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ——————————————————————————— Topo ——————————————————————————— */

/**
 * Barra do topo: 52 px, branco 94% com desfoque e fio inferior, presa ao rolar. Trilha à
 * esquerda, ações à direita. Até 1199 px mostra o botão do menu, alinhado ao x do conteúdo.
 */
export function TopBar({
  breadcrumb,
  onToggleSidebar,
  actions,
  notifications,
  account,
  onOpenMenu,
  menuButton = 'auto',
  maxCrumbs,
  sticky = true,
}: {
  breadcrumb: Crumb[];
  /** Recolher/expandir a barra lateral (desktop). */
  onToggleSidebar?: () => void;
  actions?: ReactNode;
  notifications?: ReactNode;
  account?: ReactNode;
  /** Abre a navegação em gaveta. Dentro do `AppShell`, já vem do shell. */
  onOpenMenu?: () => void;
  /** `auto`: só em gaveta (até 1199 px); `always`: sempre; `never`: nunca. */
  menuButton?: 'auto' | 'always' | 'never';
  maxCrumbs?: number;
  sticky?: boolean;
}) {
  const shell = useShell();
  const openMenu = shell.immersive
    ? undefined
    : (onOpenMenu ?? (shell.navId ? shell.openNav : undefined));
  return (
    <header
      className={s.topbar}
      data-menu={menuButton}
      data-sticky={sticky || undefined}
      data-part="topbar"
    >
      <div className={s.topInner}>
        {openMenu && menuButton !== 'never' && (
          <IconButton
            ref={shell.menuButtonRef}
            className={s.menuButton}
            label="Abrir menu"
            icon={MenuIcon}
            variant="ghost"
            size="sm"
            aria-controls={shell.navId || undefined}
            aria-expanded={shell.navOpen}
            onClick={openMenu}
          />
        )}
        {onToggleSidebar && !shell.immersive && (
          <>
            <IconButton
              className={s.toggle}
              label={shell.collapsed ? 'Expandir menu' : 'Recolher menu'}
              icon={shell.collapsed ? PanelLeftOpen : PanelLeftClose}
              variant="ghost"
              size="sm"
              aria-expanded={!shell.collapsed}
              onClick={onToggleSidebar}
            />
            <span className={s.topRule} aria-hidden="true" />
          </>
        )}
        <Breadcrumb items={breadcrumb} maxItems={maxCrumbs} />
        {(actions || notifications || account) && (
          <div className={s.topActions}>
            {actions}
            {notifications}
            {account}
          </div>
        )}
      </div>
    </header>
  );
}

/** Item das ações do topo que sai no celular (o seletor de papel desce para a gaveta). */
export function TopBarItem({
  children,
  phone = 'show',
}: {
  children: ReactNode;
  phone?: 'show' | 'hide';
}) {
  return (
    <span className={s.topItem} data-phone={phone}>
      {children}
    </span>
  );
}

/** Sino das notificações. Com novidade, um ponto azul de 6 px (nunca número). Abre um menu de 344 px. */
export function NotificationsButton({
  count = 0,
  unread,
  sections,
  label = 'Notificações',
  width = 344,
  force,
}: {
  count?: number;
  /** Há novidade. Padrão: `count > 0`. */
  unread?: boolean;
  sections: MenuSection[];
  label?: string;
  width?: number;
  /** Estado parado para pranchas. */
  force?: string;
}) {
  const fresh = unread ?? count > 0;
  const name = fresh
    ? `${label}: ${count > 0 ? `${count} ${count === 1 ? 'nova' : 'novas'}` : 'há novidades'}`
    : label;
  return (
    <Menu
      label={label}
      align="end"
      width={width}
      sections={sections}
      trigger={(props) => (
        <span className={s.bell} data-unread={fresh || undefined}>
          <IconButton
            {...props}
            label={name}
            icon={Bell}
            variant="ghost"
            size="sm"
            data-force={force}
          />
          {fresh && <i className={s.bellDot} aria-hidden="true" />}
        </span>
      )}
    />
  );
}

/** Conta no topo (quando a barra lateral não mostra a conta). */
export function TopBarAccount({ name, sections }: { name: string; sections: MenuSection[] }) {
  return (
    <Menu
      label="Conta"
      align="end"
      width={240}
      sections={sections}
      trigger={(props) => (
        <button
          {...props}
          type="button"
          className={s.topAccount}
          aria-label={`${name}. Menu da conta`}
        >
          <Avatar name={name} size="sm" decorative />
        </button>
      )}
    />
  );
}

/* ——————————————————————————— Cabeçalho da página ——————————————————————————— */

/**
 * Bloco do grupo estrutura: o `PageHeader` (título, status, meta em “·”, ações, toolbar; responde
 * à própria largura) vive em `structure.tsx` e é reexportado aqui com a mesma API.
 */
export { PageHeader } from './structure';

/* ——————————————————————————— Busca rápida (⌘K) ——————————————————————————— */

export type CommandItem = {
  id: string;
  label: string;
  /** Complemento na mesma linha, em cinza (código, anunciante). */
  description?: string;
  icon?: LucideIcon;
  leading?: ReactNode;
  /** Status ou dado curto à direita (ponto + palavra). */
  trailing?: ReactNode;
  /** Termos extras para a busca (sinônimos, código da campanha). */
  keywords?: string;
  /** Atalho à direita (ex.: “⌘N”). */
  hint?: string;
  onSelect?: () => void;
};
export type CommandGroup = {
  label: string;
  items: CommandItem[];
  /** Aparece com a busca vazia. Padrão: sim, quando não há `recent`. */
  showWhenEmpty?: boolean;
};

/**
 * Conteúdo da busca rápida: campo de 48 px e resultados agrupados (linhas de 40 px). Busca vazia
 * mostra “Recentes”. Setas percorrem, Enter abre; a altura dos resultados acompanha em 180 ms.
 * Use dentro de `CommandPalette`; sozinho, serve para pranchas.
 */
export function CommandPanel({
  groups,
  onChoose,
  placeholder = 'Buscar páginas, campanhas e anunciantes',
  label = 'Busca rápida',
  defaultQuery = '',
  autoFocus = false,
  recent,
  loading = false,
  onQueryChange,
}: {
  groups: CommandGroup[];
  onChoose?: (item: CommandItem) => void;
  placeholder?: string;
  label?: string;
  defaultQuery?: string;
  autoFocus?: boolean;
  recent?: CommandItem[];
  loading?: boolean;
  onQueryChange?: (query: string) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(defaultQuery);
  const [cursor, setCursor] = useState(0);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const baseId = useId();
  // Foco ao abrir a paleta, sem o atributo autoFocus (que a regra de acessibilidade veta).
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);
  const term = fold(query.trim()).replace(/^#/, '');
  const shown: CommandGroup[] = term
    ? groups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) =>
            fold(`${item.label} ${item.description ?? ''} ${item.keywords ?? ''}`).includes(term),
          ),
        }))
        .filter((group) => group.items.length > 0)
    : [
        ...(recent?.length ? [{ label: 'Recentes', items: recent }] : []),
        ...groups.filter((group) => group.showWhenEmpty ?? !recent?.length),
      ];
  const flat = shown.flatMap((group) => group.items);
  const active = flat.length ? Math.min(cursor, flat.length - 1) : -1;
  const activeItem = active >= 0 ? flat[active] : undefined;
  const optionId = (index: number) => `${baseId}-opt-${index}`;

  // A altura dos resultados acompanha o conteúdo (sem pulo seco).
  useIsoLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => setHeight(list.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  // Mantém a linha ativa visível rolando só a lista.
  useEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    if (!list || !el) return;
    const top = el.offsetTop - 6;
    const bottom = el.offsetTop + el.offsetHeight + 6;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight)
      list.scrollTop = bottom - list.clientHeight;
  }, [active]);

  function choose(item: CommandItem) {
    item.onSelect?.();
    onChoose?.(item);
  }
  function update(value: string) {
    setQuery(value);
    setCursor(0);
    onQueryChange?.(value);
  }
  function onKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape' && query && !onChoose) {
      event.preventDefault();
      update('');
      return;
    }
    if (!flat.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setCursor((active + 1) % flat.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setCursor((active - 1 + flat.length) % flat.length);
    } else if (event.key === 'Enter' && activeItem) {
      event.preventDefault();
      choose(activeItem);
    }
  }
  let running = -1;
  return (
    <div className={s.command}>
      <div className={s.cmdField}>
        <Search aria-hidden="true" />
        <input
          ref={inputRef}
          value={query}
          placeholder={placeholder}
          role="combobox"
          aria-label={label}
          aria-expanded={flat.length > 0}
          aria-controls={`${baseId}-list`}
          aria-autocomplete="list"
          aria-activedescendant={activeItem ? optionId(active) : undefined}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => update(event.target.value)}
          onKeyDown={onKey}
        />
        <Kbd>Esc</Kbd>
      </div>
      <div className={s.cmdResults} style={{ height }}>
        <div
          ref={listRef}
          id={`${baseId}-list`}
          role="listbox"
          aria-label="Resultados"
          className={s.cmdList}
        >
          {shown.map((group) => {
            const groupId = `${baseId}-${group.label}`;
            return (
              <div key={group.label} role="group" aria-labelledby={groupId} className={s.cmdGroup}>
                <div id={groupId} className={s.cmdGroupLabel}>
                  {group.label}
                </div>
                {group.items.map((item) => {
                  running += 1;
                  const index = running;
                  const Icon = item.icon;
                  const isActive = index === active;
                  return (
                    <div
                      key={`${group.label}-${item.id}`}
                      id={optionId(index)}
                      role="option"
                      aria-selected={isActive}
                      data-index={index}
                      className={s.cmdItem}
                      onPointerMove={() => {
                        if (!isActive) setCursor(index);
                      }}
                      onClick={() => choose(item)}
                    >
                      <span className={s.cmdLead} aria-hidden="true">
                        {item.leading ?? (Icon && <Icon />)}
                      </span>
                      <span className={s.cmdText}>
                        <span className={s.cmdLabel}>
                          <Highlight
                            text={item.label}
                            query={term ? query.trim().replace(/^#/, '') : ''}
                          />
                        </span>
                        {item.description && (
                          <span className={s.cmdDesc}>
                            <Highlight
                              text={item.description}
                              query={term ? query.trim().replace(/^#/, '') : ''}
                            />
                          </span>
                        )}
                      </span>
                      {item.trailing && <span className={s.cmdTrail}>{item.trailing}</span>}
                      {item.hint ? (
                        <Kbd>{item.hint}</Kbd>
                      ) : (
                        <span className={s.cmdEnter} aria-hidden="true">
                          <Kbd>↵</Kbd>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
          {loading && (
            <div className={s.cmdLoading} role="status">
              <LoaderCircle aria-hidden="true" />
              Buscando…
            </div>
          )}
          {!loading && flat.length === 0 && (
            <p className={s.cmdEmpty} role="status">
              Nada encontrado para “{query.trim()}”
            </p>
          )}
        </div>
      </div>
      <VisuallyHidden role="status" aria-live="polite">
        {term ? `${flat.length} ${flat.length === 1 ? 'resultado' : 'resultados'}` : ''}
      </VisuallyHidden>
    </div>
  );
}

/**
 * Busca rápida em diálogo nativo (`showModal`): véu com desfoque, painel a 18% do topo, foco preso,
 * Escape fecha e o foco volta a quem abriu. Entra em 180 ms e sai em 120 ms.
 */
export function CommandPalette({
  open,
  onClose,
  groups,
  placeholder,
  label = 'Busca rápida',
  recent,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  groups: CommandGroup[];
  placeholder?: string;
  label?: string;
  recent?: CommandItem[];
  loading?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      delete dialog.dataset.closing;
      if (!dialog.open) dialog.showModal?.();
      setMounted(true);
      return;
    }
    if (!dialog.open) return;
    dialog.dataset.closing = 'true';
    const timer = window.setTimeout(() => {
      delete dialog.dataset.closing;
      dialog.close?.();
      setMounted(false);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={s.palette}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      {(open || mounted) && (
        <CommandPanel
          groups={groups}
          placeholder={placeholder}
          label={label}
          onChoose={onClose}
          recent={recent}
          loading={loading}
          autoFocus
        />
      )}
    </dialog>
  );
}
