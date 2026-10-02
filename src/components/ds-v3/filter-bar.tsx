'use client';

import { ListFilter, X } from 'lucide-react';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { Chip } from './badge';
import { LinkButton } from './link';
import { Menu } from './overlays';
import { ToggleButton } from './toggle';
import s from './filter-bar.module.css';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/* ——————————————————————————— Presença ——————————————————————————— */

/**
 * Mantém montado por `duration` o que saiu da lista, no lugar onde estava, marcado `leaving` —
 * para a saída animar (chip encolhendo, linha recolhendo) antes de sumir do DOM.
 */
export function usePresence<T>(items: T[], keyOf: (item: T) => string, duration = 180) {
  const sig = items.map(keyOf).join('\u0000');
  const latest = useRef(items);
  const [state, setState] = useState<{
    sig: string;
    leaving: Map<string, { item: T; index: number }>;
  }>(() => ({
    sig,
    leaving: new Map(),
  }));
  if (state.sig !== sig) {
    const next = new Set(items.map(keyOf));
    const leaving = new Map(state.leaving);
    latest.current.forEach((item, index) => {
      const key = keyOf(item);
      if (!next.has(key)) leaving.set(key, { item, index });
    });
    next.forEach((key) => leaving.delete(key));
    setState({ sig, leaving });
  }
  useEffect(() => {
    latest.current = items;
  });
  useEffect(() => {
    if (!state.leaving.size) return;
    const timer = window.setTimeout(
      () => setState((current) => ({ ...current, leaving: new Map() })),
      duration + 20,
    );
    return () => window.clearTimeout(timer);
  }, [state.leaving, duration]);
  const out = items.map((item) => ({ item, key: keyOf(item), leaving: false }));
  [...state.leaving.entries()]
    .sort((a, b) => a[1].index - b[1].index)
    .forEach(([key, { item, index }]) =>
      out.splice(Math.min(index, out.length), 0, { item, key, leaving: true }),
    );
  return out;
}

/* ——————————————————————————— Flutuante ancorado ——————————————————————————— */

/** Onde o flutuante mora: no diálogo aberto (camada do topo) ou no escopo do tema. */
export function floatingHostOf(from: Element | null): Element | null {
  if (!from) return null;
  return from.closest('dialog[open]') ?? from.closest('[data-ds-v3]') ?? document.body;
}

/**
 * Posição fixa na janela, ancorada a um elemento: abre embaixo (ou em cima, quando falta espaço),
 * alinhada ao início ou ao fim, a 8 px da borda. Segue a âncora na rolagem e no redimensionamento.
 */
export function useAnchoredPanel({
  open,
  anchor,
  panel,
  align = 'start',
  gap = 6,
  matchWidth = false,
}: {
  open: boolean;
  anchor: RefObject<HTMLElement | null>;
  panel: RefObject<HTMLElement | null>;
  align?: 'start' | 'end';
  gap?: number;
  matchWidth?: boolean;
}) {
  const [host, setHost] = useState<Element | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width?: number; up: boolean } | null>(
    null,
  );
  useIsoLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    if (!host) {
      setHost(floatingHostOf(anchor.current));
      return;
    }
    const update = () => {
      const a = anchor.current?.getBoundingClientRect();
      const p = panel.current;
      if (!a || !p) return;
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;
      const w = matchWidth ? a.width : p.offsetWidth;
      const h = p.offsetHeight;
      const left = Math.min(
        Math.max(align === 'end' ? a.right - w : a.left, 8),
        Math.max(8, vw - w - 8),
      );
      const below = vh - a.bottom - gap - 8;
      const above = a.top - gap - 8;
      const up = h > below && above > below;
      setPos({
        top: up ? a.top - gap - h : a.bottom + gap,
        left,
        width: matchWidth ? a.width : undefined,
        up,
      });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, host, align, gap, matchWidth]);
  const style: CSSProperties = {
    top: pos?.top ?? -9999,
    left: pos?.left ?? -9999,
    width: pos?.width,
    visibility: pos ? undefined : 'hidden',
  };
  return { host: open ? host : null, style, up: pos?.up ?? false, placed: Boolean(pos) };
}

/* ——————————————————————————— Barra ——————————————————————————— */

/**
 * Largura natural das abas (da borda da primeira à da última), sem depender da largura da faixa:
 * empilhada, a lista de abas estica até a borda e `scrollWidth` nunca mais deixaria desempilhar.
 */
function tabsContentWidth(list: HTMLElement | null) {
  if (!list) return 0;
  const items = list.querySelectorAll<HTMLElement>('[role="tab"]');
  const first = items[0];
  const last = items[items.length - 1];
  if (!first || !last) return list.scrollWidth;
  return Math.ceil(last.getBoundingClientRect().right - first.getBoundingClientRect().left);
}

/**
 * Barra de lista: recortes (abas) à esquerda; busca, “Filtros”, modo de exibição e exportar à
 * direita. Quando as duas partes não cabem lado a lado, as ferramentas descem para baixo das abas
 * (medido, não por largura fixa). Até 640 px a busca ocupa a linha.
 */
export function FilterBar({
  tabs,
  search,
  filtersOpen,
  onFiltersOpenChange,
  filterCount = 0,
  actions,
  bandId,
  filtersLabel = 'Filtros',
  filters = true,
  'data-force': force,
}: {
  tabs?: ReactNode;
  /** Normalmente `SearchField size="sm"`; a largura é da barra (clamp 220–260 px; sem abas, até 320). */
  search?: ReactNode;
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  filterCount?: number;
  /** Modo de exibição (Segmented) e exportar (IconButton). */
  actions?: ReactNode;
  /** Id da `FilterBand` controlada pelo botão. */
  bandId?: string;
  filtersLabel?: string;
  /** Sem faixa de filtros na tela: o botão “Filtros” não aparece (abas e busca bastam). */
  filters?: boolean;
  /** Prancha: estado do botão “Filtros”. */
  'data-force'?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const [stacked, setStacked] = useState(false);
  const toolsWidth = useRef(0);
  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => {
      const tabsEl = tabsRef.current?.firstElementChild as HTMLElement | null;
      const tools = toolsRef.current;
      if (!tools) return;
      // As ferramentas só são medidas lado a lado; empilhadas, a busca estica e a medida mentiria.
      if (root.dataset.stacked === undefined) toolsWidth.current = tools.scrollWidth;
      const need = tabsContentWidth(tabsEl) + 24 + toolsWidth.current;
      setStacked(Boolean(tabs) && need > root.clientWidth);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    // A fonte muda a largura das abas: mede de novo quando ela chega.
    document.fonts?.ready.then(measure).catch(() => undefined);
    return () => observer.disconnect();
  }, [tabs]);
  return (
    <div
      ref={rootRef}
      className={s.root}
      data-stacked={stacked ? '' : undefined}
      data-tabs={tabs ? '' : undefined}
    >
      <div className={s.bar}>
        {tabs && (
          <div ref={tabsRef} className={s.tabs}>
            {tabs}
          </div>
        )}
        <div ref={toolsRef} className={s.tools}>
          {search && <div className={s.search}>{search}</div>}
          {filters && (
            <ToggleButton
              variant="ghost"
              size="sm"
              icon={ListFilter}
              pressed={filtersOpen}
              onPressedChange={onFiltersOpenChange}
              aria-expanded={filtersOpen}
              aria-controls={bandId}
              count={filterCount || undefined}
              countLabel={`${filterCount} ${filterCount === 1 ? 'filtro aplicado' : 'filtros aplicados'}`}
              data-force={force}
            >
              {filtersLabel}
            </ToggleButton>
          )}
          {actions}
        </div>
      </div>
    </div>
  );
}

/**
 * Faixa de filtros (`--g-50`, raio 8, respiro 10, vão 8). Abre por altura (0fr → 1fr, 280 ms) sem
 * “Aplicar”: cada escolha vale na hora. “Limpar” aparece no fim quando há filtro aplicado.
 * Até 640 px vira duas colunas fluidas.
 */
export function FilterBand({
  open = true,
  children,
  onClear,
  clearLabel = 'Limpar',
  id,
  label = 'Filtros',
}: {
  open?: boolean;
  children: ReactNode;
  /** Com filtro aplicado: mostra “Limpar” no fim da faixa. */
  onClear?: () => void;
  clearLabel?: string;
  id?: string;
  label?: string;
}) {
  // Aberta e assentada, a faixa deixa de recortar: listas e calendários dos filtros transbordam.
  const [settled, setSettled] = useState(open);
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    setSettled(false);
  }
  return (
    <div
      id={id}
      className={s.bandWrap}
      data-open={open || undefined}
      data-settled={(open && settled) || undefined}
      inert={!open}
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget && open) setSettled(true);
      }}
    >
      <div className={s.bandClip}>
        <div className={s.band} role="group" aria-label={label}>
          {children}
          {onClear && (
            <span className={s.clear}>
              <LinkButton tone="quiet" onClick={onClear}>
                {clearLabel}
              </LinkButton>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Célula da faixa: 196 px (selects) ou 264 px (`wide`, período). Fluida nas duas colunas do celular. */
export function FilterField({ wide = false, children }: { wide?: boolean; children: ReactNode }) {
  return (
    <div className={s.field} data-wide={wide || undefined}>
      {children}
    </div>
  );
}

/* ——————————————————————————— Filtros aplicados ——————————————————————————— */

export type ActiveFilter = {
  id: string;
  /** Nome do filtro (“Status”). Aparece como prefixo “Status:”. */
  label: string;
  value: ReactNode;
  /** Texto do valor, quando `value` não é texto (menu “+2”, nome acessível). */
  valueText?: string;
  /** Marca do anunciante, orbe da pessoa. */
  leading?: ReactNode;
  onRemove: () => void;
  /** Clique no corpo do chip: reabre o filtro (ex.: abre a faixa). */
  onEdit?: () => void;
  /** Ou: conteúdo do painel que o corpo do chip abre, ancorado a ele. */
  edit?: ReactNode;
};

/**
 * Chips dos filtros aplicados, para quando a faixa está fechada. Até `max` chips; o resto vai para
 * um “+N” que abre um menu. Backspace ou Delete no chip em foco remove e passa o foco ao próximo.
 * O chip removido encolhe (largura e opacidade, 180 ms).
 */
export function ActiveFilters({
  filters,
  onClearAll,
  max = 4,
  clearLabel = 'Limpar filtros',
  label = 'Filtros aplicados',
  children,
}: {
  filters: ActiveFilter[];
  onClearAll: () => void;
  max?: number;
  clearLabel?: string;
  label?: string;
  /** Resumo à direita (“3 de 17 campanhas”). */
  children?: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const clearRef = useRef<HTMLButtonElement>(null);
  const focusAfter = useRef<number | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const shown = filters.slice(0, filters.length > max ? max : filters.length);
  const rest = filters.slice(shown.length);
  const present = usePresence(shown, (filter) => filter.id);
  const sig = filters.map((filter) => filter.id).join('|');

  useIsoLayoutEffect(() => {
    const index = focusAfter.current;
    if (index === null) return;
    focusAfter.current = null;
    const chips = [
      ...(rootRef.current?.querySelectorAll<HTMLElement>(
        ':scope > [data-chips] > span[data-kind]:not([data-leaving])',
      ) ?? []),
    ];
    const target = chips[Math.min(index, chips.length - 1)];
    (target?.querySelector<HTMLElement>('button') ?? clearRef.current)?.focus();
  }, [sig]);

  function remove(filter: ActiveFilter) {
    const index = shown.findIndex((item) => item.id === filter.id);
    // Foco segue para o próximo chip (o atual sai); sem próximo, o anterior; sem nenhum, “Limpar”.
    focusAfter.current = index;
    if (editing === filter.id) setEditing(null);
    filter.onRemove();
  }

  return (
    <div ref={rootRef} className={s.active} role="group" aria-label={label}>
      <span className={s.chips} data-chips="">
        {present.map(({ item: filter, key, leaving }) => (
          <FilterChip
            key={key}
            filter={filter}
            leaving={leaving}
            open={editing === key}
            onOpenChange={(value) => setEditing(value ? key : null)}
            onRemove={() => remove(filter)}
          />
        ))}
        {rest.length > 0 && (
          <Menu
            label="Outros filtros aplicados"
            align="start"
            sections={[
              {
                label: 'Remover',
                items: rest.map((filter) => ({
                  label: `${filter.label}: ${filter.valueText ?? (typeof filter.value === 'string' ? filter.value : '')}`,
                  icon: X,
                  onSelect: () => {
                    focusAfter.current = shown.length;
                    filter.onRemove();
                  },
                })),
              },
            ]}
            trigger={(props) => (
              <button
                {...props}
                type="button"
                className={s.more}
                aria-label={`Mais ${rest.length} ${rest.length === 1 ? 'filtro' : 'filtros'}`}
              >
                +{rest.length}
              </button>
            )}
          />
        )}
      </span>
      {filters.length > 0 && (
        <LinkButton ref={clearRef} tone="quiet" className={s.clearAll} onClick={onClearAll}>
          {clearLabel}
        </LinkButton>
      )}
      {children && <span className={s.summary}>{children}</span>}
    </div>
  );
}

function FilterChip({
  filter,
  leaving,
  open,
  onOpenChange,
  onRemove,
}: {
  filter: ActiveFilter;
  leaving: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: () => void;
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const { host, style, up, placed } = useAnchoredPanel({
    open,
    anchor: anchorRef,
    panel: panelRef,
  });
  const text = filter.valueText ?? (typeof filter.value === 'string' ? filter.value : '');
  // Foco entra no painel só depois de posicionado (antes disso ele está invisível e não aceita foco).
  useEffect(() => {
    if (!open || !placed) return;
    const panel = panelRef.current;
    const chosen = panel?.querySelector<HTMLElement>(
      '[aria-pressed="true"], [aria-selected="true"]',
    );
    (
      chosen ??
      panel?.querySelector<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])')
    )?.focus();
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !anchorRef.current?.contains(target))
        onOpenChange(false);
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, placed]);
  // Escolheu outro valor no painel: fecha e devolve o foco ao chip.
  const lastText = useRef(text);
  useEffect(() => {
    if (lastText.current === text) return;
    lastText.current = text;
    if (!open) return;
    onOpenChange(false);
    anchorRef.current?.querySelector<HTMLElement>('button')?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  const editable = Boolean(filter.edit || filter.onEdit);
  return (
    <>
      <Chip
        ref={anchorRef}
        variant="paper"
        label={`${filter.label}:`}
        leading={filter.leading}
        leaving={leaving}
        title={text ? `${filter.label}: ${text}` : undefined}
        removeLabel={`Remover filtro ${filter.label}${text ? `: ${text}` : ''}`}
        onRemove={onRemove}
        expanded={filter.edit ? open : undefined}
        onClick={
          editable
            ? () => {
                if (filter.edit) onOpenChange(!open);
                else filter.onEdit?.();
              }
            : undefined
        }
      >
        {filter.value}
      </Chip>
      {open &&
        host &&
        filter.edit &&
        createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label={`Filtro ${filter.label}`}
            className={s.popover}
            data-up={up || undefined}
            style={style}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                onOpenChange(false);
                anchorRef.current?.querySelector<HTMLElement>('button')?.focus();
              }
            }}
          >
            {filter.edit}
          </div>,
          host,
        )}
    </>
  );
}
