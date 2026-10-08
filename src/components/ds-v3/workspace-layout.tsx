'use client';

/*
 * Área de trabalho (Contrato V3 · estrutura · §12): a moldura de todo estúdio de peça. Cabeçalho,
 * painel de início, tela principal, painel de fim e rodapé numa altura fixa em que cada região rola
 * por dentro. Os painéis laterais redimensionam pela borda de dentro (alça `role="separator"`:
 * setas, Home/End, Enter recolhe, duplo clique volta ao padrão) e recolhem num trilho com botão
 * para reabrir; largura e recolhimento ficam neste navegador (`storageKey`). F6/Shift+F6 percorrem
 * as regiões. Com 1024 px ou menos (largura da própria moldura) vira abas, uma região por vez, sem
 * desmontar nenhuma. Chapado: papel, fio de 1px, sem sombra; recolher em --dur-3.
 */

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { IconButton } from './button';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from './icons';
import { Tooltip } from './overlays';
import {
  PaneSeparator,
  ScrollArea,
  clampTo,
  readPaneMemory,
  useElementWidth,
  writePaneMemory,
  type PaneMemory,
} from './structure';
import { Tabs, type TabItem } from './tabs';
import s from './workspace-layout.module.css';

export type WorkspaceSide = 'start' | 'end';
export type WorkspaceView = 'start' | 'main' | 'end';

/** Um painel lateral. Só `label` e `content` são obrigatórios. */
export type WorkspacePane = {
  /** Nome curto: região, aba no modo estreito, trilho e alça (“Fonte”, “Copiloto”). */
  label: string;
  /** Corpo do painel. Rola por dentro (ou não, com `scroll={false}`). */
  content: ReactNode;
  /** Faixa fixa no topo (abas, busca). Abas no topo encostam nas bordas e fecham a faixa. */
  header?: ReactNode;
  /** Faixa fixa no pé (compositor). */
  footer?: ReactNode;
  /** Largura inicial, em px. Padrão 320. */
  defaultSize?: number;
  /** Padrão 240. */
  min?: number;
  /** Padrão 560. */
  max?: number;
  /** Recolhe num trilho (Enter na alça, arrastar até o fim, `WorkspaceToggle`). Padrão `true`. */
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  /** Controlado: recolhido. Use com `onCollapsedChange`. */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Largura guardada depois de cada ajuste, em px. */
  onSizeChange?: (size: number) => void;
  /** Sem respiro interno: o conteúdo encosta nas bordas (lista com linhas próprias). */
  flush?: boolean;
  /** `false`: o conteúdo ocupa a altura e cuida da própria rolagem. Padrão `true`. */
  scroll?: boolean;
};

export type WorkspaceLayoutProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  /** Tela principal (o artigo, o slide). */
  children: ReactNode;
  /** Cabeçalho do estúdio; como função, recebe `narrow` (troca botões no celular). */
  header?: ReactNode | ((narrow: boolean) => ReactNode);
  /** Rodapé sem respiro próprio: feito para `ActionBar position="static"`. */
  footer?: ReactNode | ((narrow: boolean) => ReactNode);
  start?: WorkspacePane;
  end?: WorkspacePane;
  /** Nome da tela principal: região e aba do meio. Padrão “Conteúdo”. */
  mainLabel?: string;
  /** Faixa fixa no topo da tela principal (barra de ferramentas). */
  mainHeader?: ReactNode;
  /** Faixa fixa no pé da tela principal (linha de status: palavras, leitura). */
  mainFooter?: ReactNode;
  mainFlush?: boolean;
  mainScroll?: boolean;
  /** A tela principal não fica mais estreita que isto ao redimensionar. Padrão 400. */
  mainMin?: number;
  /** Ocupa a altura útil do `AppShell` e encosta no fundo da janela (como `FixedFrame docked`). */
  docked?: boolean;
  /** Altura fora do `docked`. Padrão `100%`. */
  height?: number | string;
  /** Lembra largura e recolhimento de cada painel neste navegador (`<chave>:start`, `<chave>:end`). */
  storageKey?: string;
  /** Largura da moldura (≤) em que vira abas. Padrão 1024. */
  narrowBelow?: number;
  /** Nome das abas do modo estreito. */
  viewsLabel?: string;
  /** Modo estreito: região à vista. Controlado com `onViewChange`; padrão `main`. */
  view?: WorkspaceView;
  defaultView?: WorkspaceView;
  onViewChange?: (view: WorkspaceView) => void;
  /**
   * Modo foco: os dois painéis recolhem no trilho (sem mudar a preferência guardada). Reabrir um
   * painel vale só até o modo sair. Com `onFocusChange`, Escape sai — quem usa Escape dentro do
   * estúdio (descartar sugestão) chama `preventDefault()`.
   */
  focus?: boolean;
  onFocusChange?: (focus: boolean) => void;
  /** Só pranchas: estado parado nas alças (`hover`, `active` = arrastando, `focus`). */
  force?: string;
};

/** O que o cabeçalho e os painéis podem ler e pedir à moldura (`useWorkspace`). */
export type WorkspaceState = {
  /** Modo estreito (abas). */
  narrow: boolean;
  /** Região à vista no modo estreito. */
  view: WorkspaceView;
  setView: (view: WorkspaceView) => void;
  panes: Partial<
    Record<WorkspaceSide, { id: string; label: string; collapsed: boolean; collapsible: boolean }>
  >;
  /** Recolhe ou mostra um painel (no modo foco, só espia). */
  setCollapsed: (side: WorkspaceSide, collapsed: boolean) => void;
};

const WorkspaceContext = createContext<WorkspaceState | null>(null);

/** Estado da `WorkspaceLayout` mais próxima; `null` fora dela. */
export function useWorkspace() {
  return useContext(WorkspaceContext);
}

/** Largura do trilho recolhido (botão sm de 32 com 4 de cada lado). */
const RAIL = 40;
/** O tempo de `--dur-3` com folga: depois disso a grade para de animar (redimensionar a janela não pula). */
const MOTION_MS = 400;

type ResolvedPane = WorkspacePane & {
  defaultSize: number;
  min: number;
  max: number;
  collapsible: boolean;
};

function resolve(pane: WorkspacePane | undefined): ResolvedPane | undefined {
  if (!pane) return undefined;
  const min = pane.min ?? 240;
  return {
    ...pane,
    defaultSize: pane.defaultSize ?? 320,
    min,
    max: Math.max(min, pane.max ?? 560),
    collapsible: pane.collapsible ?? true,
  };
}

type Geometry = {
  /** Coluna da grade (trilho quando recolhido). */
  width: number;
  /** Largura do conteúdo do painel (fica a mesma enquanto a coluna anima ao recolher). */
  open: number;
  /** Teto da alça, já descontados o vizinho e a tela principal. */
  ceiling: number;
};

/**
 * Larguras efetivas. Sem espaço para todos, o painel de fim cede primeiro e depois o de início,
 * cada um até o próprio mínimo; a preferência guardada não muda.
 */
function measurePanes(
  width: number | undefined,
  mainMin: number,
  start: (ResolvedPane & { size: number; collapsed: boolean }) | undefined,
  end: (ResolvedPane & { size: number; collapsed: boolean }) | undefined,
) {
  const separators = (start ? 1 : 0) + (end ? 1 : 0);
  const openOf = (pane: ResolvedPane & { size: number }) => clampTo(pane.size, pane.min, pane.max);
  let startWidth = start ? (start.collapsed ? RAIL : openOf(start)) : 0;
  let endWidth = end ? (end.collapsed ? RAIL : openOf(end)) : 0;
  if (width !== undefined) {
    let over = startWidth + endWidth + separators + mainMin - width;
    if (over > 0 && end && !end.collapsed) {
      const cut = Math.min(over, endWidth - end.min);
      endWidth -= cut;
      over -= cut;
    }
    if (over > 0 && start && !start.collapsed) {
      startWidth -= Math.min(over, startWidth - start.min);
    }
  }
  const ceilingOf = (pane: ResolvedPane, other: number) =>
    width === undefined
      ? pane.max
      : Math.max(pane.min, Math.min(pane.max, width - other - separators - mainMin));
  const geometry = (
    pane: (ResolvedPane & { size: number; collapsed: boolean }) | undefined,
    own: number,
    other: number,
  ): Geometry | undefined => {
    if (!pane) return undefined;
    const ceiling = ceilingOf(pane, other);
    return {
      width: own,
      open: pane.collapsed ? clampTo(pane.size, pane.min, ceiling) : own,
      ceiling,
    };
  };
  return {
    start: geometry(start, startWidth, endWidth),
    end: geometry(end, endWidth, startWidth),
  };
}

/** Uma região (painel ou tela principal): faixa fixa em cima, corpo que rola, faixa fixa embaixo. */
function Region({
  id,
  kind,
  label,
  narrow,
  inactive,
  inert,
  header,
  footer,
  flush,
  scroll,
  width,
  children,
  regionRef,
}: {
  id: string;
  kind: WorkspaceView;
  label: string;
  narrow: boolean;
  inactive: boolean;
  inert: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  flush?: boolean;
  scroll: boolean;
  width?: number;
  children: ReactNode;
  regionRef: (node: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={regionRef}
      id={id}
      className={s.region}
      // Estreito: painel da aba. Largo: grupo nomeado (a área de rolagem dentro é a região).
      role={narrow ? 'tabpanel' : scroll ? 'group' : 'region'}
      aria-label={narrow ? undefined : label}
      aria-labelledby={narrow ? `${id}-tab` : undefined}
      tabIndex={-1}
      inert={inert}
      data-kind={kind}
      data-flush={flush || undefined}
      data-inactive={inactive || undefined}
      data-ws-stop={kind}
      style={width !== undefined ? ({ '--ws-pane-w': `${width}px` } as CSSProperties) : undefined}
    >
      {header ? <div className={s.regionHead}>{header}</div> : null}
      {scroll ? (
        <ScrollArea label={label} className={s.scroll} viewportClassName={s.viewport}>
          {children}
        </ScrollArea>
      ) : (
        <div className={s.fill}>{children}</div>
      )}
      {footer ? <div className={s.regionFoot}>{footer}</div> : null}
    </div>
  );
}

/**
 * Moldura de três regiões dos estúdios (artigo, carrossel, dossiê…). Componha o cabeçalho com
 * `PageHeader variant="frame"`, as ações com `WorkspaceToggle` e o rodapé com `ActionBar`.
 */
export function WorkspaceLayout({
  children,
  header,
  footer,
  start: startPane,
  end: endPane,
  mainLabel = 'Conteúdo',
  mainHeader,
  mainFooter,
  mainFlush = false,
  mainScroll = true,
  mainMin = 400,
  docked = false,
  height = '100%',
  storageKey,
  narrowBelow = 1024,
  viewsLabel = 'Painéis',
  view,
  defaultView = 'main',
  onViewChange,
  focus = false,
  onFocusChange,
  force,
  className = '',
  style,
  onKeyDown,
  ...props
}: WorkspaceLayoutProps) {
  const [rootRef, width] = useElementWidth<HTMLDivElement>();
  // Largura 0 = ainda escondida (aba, painel fechado): vale a prévia por container query até medir.
  const measured = width !== undefined && width > 0;
  const narrow = measured && width <= narrowBelow;
  const ids = { start: useId(), main: useId(), end: useId() };
  const regions = useRef<Partial<Record<WorkspaceView, HTMLDivElement | null>>>({});
  const rails = useRef<Partial<Record<WorkspaceSide, HTMLDivElement | null>>>({});
  const panes = { start: resolve(startPane), end: resolve(endPane) };

  const [memory, setMemory] = useState<Record<WorkspaceSide, PaneMemory>>(() => ({
    start: {
      size: startPane?.defaultSize ?? 320,
      collapsed: startPane?.defaultCollapsed ?? false,
    },
    end: { size: endPane?.defaultSize ?? 320, collapsed: endPane?.defaultCollapsed ?? false },
  }));
  const [dragging, setDragging] = useState<WorkspaceSide | null>(null);
  const [innerView, setInnerView] = useState<WorkspaceView>(defaultView);
  const [ready, setReady] = useState(false);

  /* Modo foco: reabrir um painel é uma espiada que acaba quando o modo muda. */
  const [peek, setPeek] = useState({ focus, start: false, end: false });
  if (peek.focus !== focus) setPeek({ focus, start: false, end: false });
  const peeking = peek.focus === focus ? peek : { start: false, end: false };

  useEffect(() => {
    if (!storageKey) return;
    const saved = {
      start: readPaneMemory(`${storageKey}:start`),
      end: readPaneMemory(`${storageKey}:end`),
    };
    if (!saved.start && !saved.end) return;
    // Restaura a preferência depois da hidratação (o servidor não conhece o navegador).
    setMemory((prev) => ({
      start: saved.start
        ? { size: saved.start.size ?? prev.start.size, collapsed: saved.start.collapsed }
        : prev.start,
      end: saved.end
        ? { size: saved.end.size ?? prev.end.size, collapsed: saved.end.collapsed }
        : prev.end,
    }));
  }, [storageKey]);

  // A grade só anima depois do primeiro desenho: a preferência restaurada não “desliza” ao abrir.
  useEffect(() => {
    let second = 0;
    const first = window.requestAnimationFrame(() => {
      second = window.requestAnimationFrame(() => setReady(true));
    });
    return () => {
      window.cancelAnimationFrame(first);
      window.cancelAnimationFrame(second);
    };
  }, []);

  function collapsedOf(side: WorkspaceSide) {
    const pane = panes[side];
    if (!pane) return false;
    if (focus) return !peeking[side];
    return pane.collapsed ?? memory[side].collapsed;
  }
  const collapsed = { start: collapsedOf('start'), end: collapsedOf('end') };

  /* Anima só quando um painel recolhe ou abre (não a cada pixel de redimensionar a janela). */
  const shape = `${collapsed.start ? 1 : 0}${collapsed.end ? 1 : 0}`;
  const [motion, setMotion] = useState({ shape, on: false });
  if (motion.shape !== shape) setMotion({ shape, on: true });
  useEffect(() => {
    if (!motion.on) return;
    const timer = window.setTimeout(() => setMotion((m) => ({ ...m, on: false })), MOTION_MS);
    return () => window.clearTimeout(timer);
  }, [motion]);

  const geometry = measurePanes(
    measured ? width : undefined,
    mainMin,
    panes.start && { ...panes.start, ...memory.start, collapsed: collapsed.start },
    panes.end && { ...panes.end, ...memory.end, collapsed: collapsed.end },
  );

  let current: WorkspaceView = view ?? innerView;
  if ((current === 'start' && !panes.start) || (current === 'end' && !panes.end) || focus) {
    current = 'main';
  }
  function changeView(next: WorkspaceView) {
    if (view === undefined) setInnerView(next);
    onViewChange?.(next);
  }

  function apply(side: WorkspaceSide, next: PaneMemory, persist: boolean) {
    const pane = panes[side];
    if (!pane) return;
    const before = { ...memory[side], collapsed: collapsed[side] };
    if (focus) {
      // No modo foco, abrir ou recolher é só espiar: a preferência guardada fica como estava.
      setPeek((p) => ({ ...p, focus, [side]: !next.collapsed }));
    }
    const kept: PaneMemory = focus ? { size: next.size, collapsed: memory[side].collapsed } : next;
    setMemory((prev) => ({ ...prev, [side]: kept }));
    if (!persist) return;
    writePaneMemory(storageKey && `${storageKey}:${side}`, kept);
    if (!focus && next.collapsed !== before.collapsed) pane.onCollapsedChange?.(next.collapsed);
    if (next.size !== before.size) pane.onSizeChange?.(next.size);
  }

  function setPaneCollapsed(side: WorkspaceSide, next: boolean, from: 'rail' | 'other' = 'other') {
    const region = regions.current[side];
    const hadFocus = Boolean(region && region.contains(document.activeElement));
    apply(side, { size: memory[side].size, collapsed: next }, true);
    // O foco segue a ação: recolhido com o foco dentro → botão do trilho; aberto pelo trilho → painel.
    window.requestAnimationFrame(() => {
      if (next && hadFocus) rails.current[side]?.querySelector('button')?.focus();
      else if (!next && from === 'rail') regions.current[side]?.focus({ preventScroll: true });
    });
  }

  /** F6 / Shift+F6: próxima região visível (cabeçalho, painéis, tela, rodapé), em círculo. */
  function cycle(direction: 1 | -1) {
    const root = rootRef.current;
    if (!root) return false;
    const stops = Array.from(root.querySelectorAll<HTMLElement>('[data-ws-stop]')).filter(
      (el) => el.closest('[data-ws-root]') === root && !el.closest('[inert]'),
    );
    if (stops.length === 0) return false;
    const active = document.activeElement;
    const at = stops.findIndex((el) => el.contains(active));
    let index: number;
    if (at >= 0) index = (at + direction + stops.length) % stops.length;
    else {
      // Foco fora de uma parada (numa alça, por exemplo): segue a ordem do documento a partir dele.
      const after = (el: HTMLElement) =>
        Boolean(active && active.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
      if (direction > 0) {
        const next = stops.findIndex(after);
        index = next < 0 ? 0 : next;
      } else {
        let next = -1;
        stops.forEach((el, i) => {
          if (!after(el)) next = i;
        });
        index = next < 0 ? stops.length - 1 : next;
      }
    }
    const stop = stops[index];
    if (!stop) return false;
    const kind = stop.dataset.wsStop;
    const target =
      kind === 'views'
        ? stop.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
        : kind === 'rail'
          ? stop.querySelector<HTMLElement>('button')
          : stop;
    (target ?? stop).focus({ preventScroll: true });
    return true;
  }

  function onRootKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === 'F6' && !event.altKey && !event.ctrlKey && !event.metaKey) {
      if (cycle(event.shiftKey ? -1 : 1)) event.preventDefault();
      return;
    }
    if (event.key === 'Escape' && focus && onFocusChange) {
      event.preventDefault();
      onFocusChange(false);
    }
  }

  const paneState: WorkspaceState['panes'] = {};
  for (const which of ['start', 'end'] as const) {
    const pane = panes[which];
    if (pane) {
      paneState[which] = {
        id: ids[which],
        label: pane.label,
        collapsed: collapsed[which],
        collapsible: pane.collapsible,
      };
    }
  }
  const state: WorkspaceState = {
    narrow,
    view: current,
    setView: changeView,
    panes: paneState,
    setCollapsed: (side, next) => setPaneCollapsed(side, next),
  };

  function side(which: WorkspaceSide) {
    const pane = panes[which];
    const geo = geometry[which];
    if (!pane || !geo) return null;
    const folded = !narrow && collapsed[which];
    const show = `Mostrar ${pane.label}`;
    return (
      <div className={s.side} data-side={which} data-collapsed={folded || undefined}>
        {folded ? (
          <div
            ref={(node) => {
              rails.current[which] = node;
            }}
            className={s.rail}
            data-ws-stop="rail"
          >
            <Tooltip content={show} side="bottom">
              <IconButton
                variant="ghost"
                size="sm"
                icon={which === 'start' ? PanelLeftOpen : PanelRightOpen}
                label={show}
                aria-expanded={false}
                aria-controls={ids[which]}
                onClick={() => setPaneCollapsed(which, false, 'rail')}
              />
            </Tooltip>
          </div>
        ) : null}
        <Region
          id={ids[which]}
          kind={which}
          label={pane.label}
          narrow={narrow}
          inactive={narrow && current !== which}
          inert={folded || (narrow && current !== which)}
          header={pane.header}
          footer={pane.footer}
          flush={pane.flush}
          scroll={pane.scroll ?? true}
          width={narrow ? undefined : geo.open}
          regionRef={(node) => {
            regions.current[which] = node;
          }}
        >
          {pane.content}
        </Region>
      </div>
    );
  }

  function separator(which: WorkspaceSide) {
    const pane = panes[which];
    const geo = geometry[which];
    if (narrow || !pane || !geo) return null;
    return (
      <PaneSeparator
        side={which}
        className={s.handle}
        size={collapsed[which] ? memory[which].size : geo.width}
        collapsed={collapsed[which]}
        min={pane.min}
        max={geo.ceiling}
        defaultSize={pane.defaultSize}
        collapsible={pane.collapsible}
        label={`Redimensionar ${pane.label}`}
        controls={ids[which]}
        force={force}
        onPreview={(size, folded) => apply(which, { size, collapsed: folded }, false)}
        onCommit={(size, folded) => apply(which, { size, collapsed: folded }, true)}
        onToggle={(folded) => setPaneCollapsed(which, folded)}
        onDraggingChange={(on) => setDragging(on ? which : null)}
      />
    );
  }

  const columns = narrow
    ? 'minmax(0, 1fr)'
    : [
        geometry.start && `${geometry.start.width}px 1px`,
        'minmax(0, 1fr)',
        geometry.end && `1px ${geometry.end.width}px`,
      ]
        .filter(Boolean)
        .join(' ');

  const tabs: TabItem<WorkspaceView>[] = [
    ...(panes.start
      ? [{ value: 'start' as const, label: panes.start.label, panelId: ids.start }]
      : []),
    { value: 'main', label: mainLabel, panelId: ids.main },
    ...(panes.end ? [{ value: 'end' as const, label: panes.end.label, panelId: ids.end }] : []),
  ];

  // Só há abas com um painel ao lado: uma tela única (Material, Entrega) fica sem a linha de abas.
  const tabbed = narrow && tabs.length > 1;
  const headNode = typeof header === 'function' ? header(narrow) : header;
  const footNode = typeof footer === 'function' ? footer(narrow) : footer;

  return (
    <WorkspaceContext.Provider value={state}>
      <div
        {...props}
        ref={rootRef}
        className={`${s.root} ${className}`}
        data-ws-root=""
        data-narrow={narrow || undefined}
        data-measured={measured || undefined}
        data-docked={docked || undefined}
        data-focus={focus || undefined}
        data-animate={(ready && motion.on && !dragging) || undefined}
        style={{ ...(docked ? null : { height }), ...style }}
        onKeyDown={onRootKeyDown}
      >
        {headNode ? (
          <div className={s.head} data-ws-stop="header" tabIndex={-1}>
            {headNode}
          </div>
        ) : null}
        {tabbed && !focus ? (
          <div className={s.views} data-ws-stop="views">
            <Tabs label={viewsLabel} items={tabs} value={current} onChange={changeView} />
          </div>
        ) : null}
        <div
          className={s.body}
          data-dragging={dragging ?? undefined}
          style={{ '--ws-cols': columns, '--ws-rail': `${RAIL}px` } as CSSProperties}
        >
          {side('start')}
          {separator('start')}
          <Region
            id={ids.main}
            kind="main"
            label={mainLabel}
            narrow={tabbed}
            inactive={narrow && current !== 'main'}
            inert={narrow && current !== 'main'}
            header={mainHeader}
            footer={mainFooter}
            flush={mainFlush}
            scroll={mainScroll}
            regionRef={(node) => {
              regions.current.main = node;
            }}
          >
            {children}
          </Region>
          {separator('end')}
          {side('end')}
        </div>
        {footNode ? (
          <div className={s.foot} data-ws-stop="footer" tabIndex={-1}>
            {footNode}
          </div>
        ) : null}
      </div>
    </WorkspaceContext.Provider>
  );
}

export type WorkspaceToggleProps = {
  side: WorkspaceSide;
  /** Atalho mostrado na dica (ex.: “⌘\\”). */
  shortcut?: string;
  /** Só pranchas: `hover`, `active`, `focus`. */
  'data-force'?: string;
};

/**
 * Botão de recolher/mostrar um painel, para o cabeçalho do estúdio. Fica fora no modo estreito
 * (as abas já trocam a região) e quando o painel não recolhe.
 */
export function WorkspaceToggle({ side, shortcut, 'data-force': force }: WorkspaceToggleProps) {
  const workspace = useContext(WorkspaceContext);
  const pane = workspace?.panes[side];
  if (!workspace || !pane || workspace.narrow || !pane.collapsible) return null;
  const open = !pane.collapsed;
  const label = `${open ? 'Recolher' : 'Mostrar'} ${pane.label}`;
  const icon =
    side === 'start'
      ? open
        ? PanelLeftClose
        : PanelLeftOpen
      : open
        ? PanelRightClose
        : PanelRightOpen;
  return (
    <Tooltip content={label} shortcut={shortcut}>
      <IconButton
        variant="ghost"
        size="sm"
        icon={icon}
        label={label}
        aria-expanded={open}
        aria-controls={pane.id}
        data-force={force}
        onClick={() => workspace.setCollapsed(side, open)}
      />
    </Tooltip>
  );
}
