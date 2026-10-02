'use client';

import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ListChecks,
  Menu as MenuIcon,
  PenLine,
  Search,
} from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from 'react';
import { BrandMark, Button, ButtonGroup, Checkbox, IconButton, SearchField, Segmented } from '@mediaon/design-system/v3';
import { inventory, normalizeSearch } from '../inventory';
import { catalogItems, familyOf, type CatalogItem } from './families';
import { specimens } from './specimens';
import c from './catalog.module.css';

/* ——— Rotas por hash ——— */

const PAGES = { 'visao-geral': 'Visão geral', inventario: 'Inventário' } as const;
type Page = keyof typeof PAGES;
const isPage = (id: string): id is Page => id in PAGES;

function subscribeHash(callback: () => void) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}
function readHash() {
  let id = window.location.hash.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {
    /* hash malformado: cai na visão geral */
  }
  return isPage(id) || catalogItems.some((item) => item.id === id) ? id : 'visao-geral';
}
const go = (id: string) => {
  window.location.hash = id;
};

/* ——— Revisão (localStorage 'mediaon-dsv3-item-reviews': { [id]: { reviewed, note } }) ——— */

const REVIEW_KEY = 'mediaon-dsv3-item-reviews';
type Review = { reviewed: boolean; note: string };
type Reviews = Record<string, Review>;
const NO_REVIEWS: Reviews = {};
const reviewListeners = new Set<() => void>();
let memo: { raw: string | null; value: Reviews } = { raw: null, value: NO_REVIEWS };
/** Sem armazenamento (janela privada, bloqueio): a revisão vale só para esta aba. */
let volatile: string | null | undefined;

function parseReviews(raw: string | null): Reviews {
  try {
    const saved: unknown = JSON.parse(raw ?? '{}');
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return NO_REVIEWS;
    return Object.fromEntries(
      Object.entries(saved as Record<string, unknown>).filter(
        ([, value]) =>
          typeof value === 'object' &&
          value !== null &&
          typeof (value as Review).reviewed === 'boolean' &&
          typeof (value as Review).note === 'string',
      ),
    ) as Reviews;
  } catch {
    return NO_REVIEWS;
  }
}
function readRaw(): string | null {
  if (volatile !== undefined) return volatile;
  try {
    return localStorage.getItem(REVIEW_KEY);
  } catch {
    return null;
  }
}
function reviewSnapshot(): Reviews {
  const raw = readRaw();
  if (raw !== memo.raw) memo = { raw, value: parseReviews(raw) };
  return memo.value;
}
function subscribeReviews(callback: () => void) {
  reviewListeners.add(callback);
  const onStorage = (event: StorageEvent) => {
    if (event.key === REVIEW_KEY || event.key === null) callback();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    reviewListeners.delete(callback);
    window.removeEventListener('storage', onStorage);
  };
}
function saveReview(id: string, patch: Partial<Review>) {
  const current = reviewSnapshot();
  const next: Reviews = {
    ...current,
    [id]: { reviewed: current[id]?.reviewed ?? false, note: current[id]?.note ?? '', ...patch },
  };
  const raw = JSON.stringify(next);
  try {
    if (volatile !== undefined) throw new Error('volatile');
    localStorage.setItem(REVIEW_KEY, raw);
  } catch {
    volatile = raw;
  }
  reviewListeners.forEach((listener) => listener());
}
function useReviews() {
  return useSyncExternalStore(subscribeReviews, reviewSnapshot, () => NO_REVIEWS);
}

/* ——— Estado de cada item: revisado > pronto (tem prancha) > em desenho ——— */

type ItemState = 'revisado' | 'pronto' | 'desenho';
const stateOf = (id: string, reviews: Reviews): ItemState =>
  reviews[id]?.reviewed ? 'revisado' : specimens[id] ? 'pronto' : 'desenho';
const STATE_LABEL: Record<ItemState, string> = {
  revisado: 'Revisado',
  pronto: 'Pronto',
  desenho: 'Em desenho',
};

/** Marca de estado: aro (pronto), aro tracejado (em desenho), check verde (revisado). */
function Mark({ state, size = 14, label }: { state: ItemState; size?: number; label?: boolean }) {
  return (
    <svg
      className={c.mark}
      data-state={state}
      width={size}
      height={size}
      viewBox="0 0 14 14"
      role={label ? 'img' : undefined}
      aria-label={label ? STATE_LABEL[state] : undefined}
      aria-hidden={label ? undefined : true}
    >
      <circle cx="7" cy="7" r="5.25" />
      <path d="M4.6 7.1 6.3 8.8 9.5 5.3" pathLength={1} />
    </svg>
  );
}

/* ——— Teclado ——— */

const WIDGETS =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="slider"], [role="tablist"], [role="radiogroup"], [role="menu"], [role="listbox"], [role="grid"], [role="combobox"], [role="spinbutton"], [role="toolbar"], [data-specimen]';
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && Boolean(target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]'));

/* ——— Menu lateral ——— */

function Sidebar({
  active,
  reviews,
  query,
  onQuery,
  searchRef,
  navRef,
  onNavigate,
}: {
  active: string;
  reviews: Reviews;
  query: string;
  onQuery: (value: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  navRef: RefObject<HTMLElement | null>;
  onNavigate: () => void;
}) {
  const activeFamily = catalogItems.find((item) => item.id === active)?.groupId;
  // Família aberta pelo usuário fica aberta; a do item atual abre sozinha e fecha ao sair dela.
  const [pinned, setPinned] = useState<Record<string, boolean>>({});
  const [lastFamily, setLastFamily] = useState(activeFamily);
  if (activeFamily !== lastFamily) {
    setLastFamily(activeFamily);
    if (activeFamily && pinned[activeFamily] === false) {
      setPinned((value) => {
        const rest = { ...value };
        delete rest[activeFamily];
        return rest;
      });
    }
  }
  const term = normalizeSearch(query);
  const groups = inventory
    .map((group) => ({
      ...group,
      items: term
        ? group.items.filter((item) =>
            normalizeSearch(`${item.label} ${item.keywords} ${item.id}`).includes(term),
          )
        : group.items,
    }))
    .filter((group) => group.items.length > 0);
  const reviewed = catalogItems.filter((item) => reviews[item.id]?.reviewed).length;

  return (
    <>
      <div className={c.identity}>
        <a href="#visao-geral" className={c.brand} onClick={onNavigate}>
          {/* Semente que desenha os arcos em azul (marca decorativa: o nome não é anunciado). */}
          <BrandMark name="mediaon · DS" size="md" decorative />
          <span className={c.brandText}>
            <strong>MediaOn</strong>
            <span>Design System V3</span>
          </span>
        </a>
      </div>
      <label className={c.navSearch}>
        <Search aria-hidden="true" />
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && query) {
              event.preventDefault();
              event.stopPropagation();
              onQuery('');
            }
          }}
          placeholder="Buscar item…"
          aria-label="Buscar item na biblioteca"
        />
      </label>
      <nav ref={navRef} className={c.nav} aria-label="Biblioteca">
        <div className={c.group}>
          <a
            href="#visao-geral"
            className={c.item}
            aria-current={active === 'visao-geral' ? 'page' : undefined}
            onClick={onNavigate}
          >
            <LayoutDashboard aria-hidden="true" />
            <span className={c.itemText}>Visão geral</span>
          </a>
          <a
            href="#inventario"
            className={c.item}
            aria-current={active === 'inventario' ? 'page' : undefined}
            onClick={onNavigate}
          >
            <ListChecks aria-hidden="true" />
            <span className={c.itemText}>Inventário</span>
            <span className={c.count}>{catalogItems.length}</span>
          </a>
        </div>
        <div className={c.group}>
          <span className={c.groupLabel}>Biblioteca</span>
          {groups.length === 0 && <p className={c.navEmpty}>Nada encontrado</p>}
          {groups.map((group) => {
            const Icon = familyOf(group.id).icon;
            const expanded = Boolean(term) || (pinned[group.id] ?? group.id === activeFamily);
            const full = inventory.find((entry) => entry.id === group.id)?.items ?? group.items;
            const allReviewed = full.every((item) => reviews[item.id]?.reviewed);
            return (
              <div key={group.id} className={c.family}>
                <button
                  type="button"
                  className={c.item}
                  aria-expanded={expanded}
                  aria-controls={`familia-${group.id}`}
                  data-has-active={group.id === activeFamily && !expanded ? '' : undefined}
                  onClick={() => setPinned((value) => ({ ...value, [group.id]: !expanded }))}
                >
                  <Icon aria-hidden="true" />
                  <span className={c.itemText}>{familyOf(group.id).label}</span>
                  {allReviewed ? <Mark state="revisado" label /> : <span className={c.count}>{full.length}</span>}
                  <ChevronRight className={c.chevron} aria-hidden="true" />
                </button>
                <div id={`familia-${group.id}`} className={c.sub} data-open={expanded ? '' : undefined}>
                  <div className={c.subInner} inert={!expanded || undefined}>
                    {group.items.map((item) => {
                      const state = stateOf(item.id, reviews);
                      return (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          className={c.subItem}
                          data-nav-item={item.id}
                          aria-current={active === item.id ? 'page' : undefined}
                          onClick={onNavigate}
                        >
                          <span className={c.itemText}>{item.label}</span>
                          {state !== 'pronto' && <Mark state={state} label />}
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </nav>
      <div className={c.footer}>
        <div className={c.progressHead}>
          <span>Revisados</span>
          <span className={c.num}>
            <strong>{reviewed}</strong> de {catalogItems.length}
          </span>
        </div>
        <span
          className={c.meter}
          role="progressbar"
          aria-label="Itens revisados"
          aria-valuemin={0}
          aria-valuemax={catalogItems.length}
          aria-valuenow={reviewed}
        >
          <i style={{ width: `${(reviewed / catalogItems.length) * 100}%` }} />
        </span>
      </div>
    </>
  );
}

/* ——— Visão geral ——— */

function Overview({ reviews }: { reviews: Reviews }) {
  const counts = { revisado: 0, pronto: 0, desenho: 0 };
  for (const item of catalogItems) counts[stateOf(item.id, reviews)] += 1;
  const built = counts.revisado + counts.pronto;
  const total = catalogItems.length;
  const pct = (value: number) => `${Math.round((value / total) * 100)}%`;
  const nextUp = catalogItems.find((item) => stateOf(item.id, reviews) === 'pronto');
  return (
    <div className={c.content}>
      <header className={c.pageHead}>
        <h1 id="ds-content" tabIndex={-1} className={c.title}>
          Visão geral
        </h1>
        {nextUp && (
          <Button variant="primary" trailingIcon={ArrowRight} onClick={() => go(nextUp.id)}>
            Continuar revisão
          </Button>
        )}
      </header>
      <dl className={c.strip}>
        <div className={c.cell}>
          <dt>Itens</dt>
          <dd className={c.figure}>{total}</dd>
          <dd className={c.cellFoot}>{inventory.length} famílias</dd>
        </div>
        <div className={c.cell}>
          <dt>
            <Mark state="pronto" /> Prontos
          </dt>
          <dd className={c.figure}>{built}</dd>
          <dd className={c.cellFoot}>{pct(built)}</dd>
        </div>
        <div className={c.cell}>
          <dt>
            <Mark state="revisado" /> Revisados
          </dt>
          <dd className={c.figure}>{counts.revisado}</dd>
          <dd className={c.cellFoot}>
            <span className={c.meter} aria-hidden="true">
              <i style={{ width: `${(counts.revisado / total) * 100}%` }} />
            </span>
            {pct(counts.revisado)}
          </dd>
        </div>
        <div className={c.cell}>
          <dt>
            <Mark state="desenho" /> Em desenho
          </dt>
          <dd className={c.figure}>{counts.desenho}</dd>
          <dd className={c.cellFoot}>{pct(counts.desenho)}</dd>
        </div>
      </dl>
      <h2 className={c.sectionTitle}>Famílias</h2>
      <div className={c.families}>
        {inventory.map((group) => {
          const Icon = familyOf(group.id).icon;
          const states = group.items.map((item) => stateOf(item.id, reviews));
          const done = states.filter((state) => state === 'revisado').length;
          const target =
            group.items.find((item) => stateOf(item.id, reviews) === 'pronto') ?? group.items[0];
          return (
            <a key={group.id} href={`#${target?.id ?? ''}`} className={c.familyCard}>
              <span className={c.familyHead}>
                <Icon aria-hidden="true" />
                <strong>{familyOf(group.id).label}</strong>
                <span className={c.num}>
                  <b>{done}</b> de {group.items.length}
                </span>
              </span>
              <span className={c.segments} aria-hidden="true">
                {states.map((state, index) => (
                  <i key={group.items[index]?.id} data-state={state} />
                ))}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

/* ——— Inventário ——— */

type Filter = 'todos' | 'revisar' | 'revisados' | 'desenho';

function InventoryPage({ reviews }: { reviews: Reviews }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('todos');
  const term = normalizeSearch(query);
  const rows = catalogItems.filter((item) => {
    const state = stateOf(item.id, reviews);
    if (filter === 'revisar' && state !== 'pronto') return false;
    if (filter === 'revisados' && state !== 'revisado') return false;
    if (filter === 'desenho' && state !== 'desenho') return false;
    return (
      !term ||
      normalizeSearch(`${item.label} ${item.keywords} ${item.id} ${item.groupLabel}`).includes(term)
    );
  });
  const onRow = (event: ReactMouseEvent<HTMLTableRowElement>, id: string) => {
    if ((event.target as HTMLElement).closest('a, button, input, label')) return;
    go(id);
  };
  return (
    <div className={c.content}>
      <header className={c.pageHead}>
        <div className={c.pageHeadText}>
          <h1 id="ds-content" tabIndex={-1} className={c.title}>
            Inventário
          </h1>
          <p className={c.subtitle}>
            {rows.length === catalogItems.length
              ? `${catalogItems.length} itens em ${inventory.length} famílias`
              : `${rows.length} de ${catalogItems.length} itens`}
          </p>
        </div>
      </header>
      <div className={c.toolbar}>
        <div className={c.toolbarSearch}>
          <SearchField
            size="sm"
            value={query}
            onValueChange={setQuery}
            placeholder="Item ou família"
            label="Filtrar inventário"
          />
        </div>
        <Segmented
          size="sm"
          label="Recorte"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'todos', label: 'Todos' },
            { value: 'revisar', label: 'A revisar' },
            { value: 'revisados', label: 'Revisados' },
            { value: 'desenho', label: 'Em desenho' },
          ]}
        />
      </div>
      <div className={c.tableFrame}>
        <table className={c.table}>
          <colgroup>
            <col />
            <col className={c.colFamily} />
            <col className={c.colStatus} />
            <col className={c.checkCol} />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Família</th>
              <th scope="col">Status</th>
              <th scope="col" className={c.checkCol}>
                Revisado
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr className={c.emptyRow}>
                <td colSpan={4}>
                  <span>{term ? `Nada encontrado para “${query.trim()}”` : 'Nenhum item neste recorte'}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setQuery('');
                      setFilter('todos');
                    }}
                  >
                    Limpar filtros
                  </Button>
                </td>
              </tr>
            )}
            {rows.map((item) => {
              const built = Boolean(specimens[item.id]);
              const review = reviews[item.id];
              return (
                <tr key={item.id} onClick={(event) => onRow(event, item.id)}>
                  <td className={c.cellItem}>
                    <a href={`#${item.id}`}>{item.label}</a>
                  </td>
                  <td className={c.cellFamily}>{item.groupLabel}</td>
                  <td className={c.cellStatus}>
                    <span className={c.status} data-built={built ? '' : undefined}>
                      {built ? 'Pronto' : 'Em desenho'}
                    </span>
                  </td>
                  <td className={c.checkCol}>
                    <Checkbox
                      aria-label={`Revisado: ${item.label}`}
                      checked={Boolean(review?.reviewed)}
                      onChange={(event) => saveReview(item.id, { reviewed: event.target.checked })}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ——— Página do item ——— */

function NoteField({ value, onSave }: { value: string; onSave: (note: string) => void }) {
  const [draft, setDraft] = useState(value);
  const [base, setBase] = useState(value);
  const cancel = useRef(false);
  // A nota mudou fora daqui (outra aba): acompanha enquanto não há edição em curso.
  if (value !== base) {
    setBase(value);
    if (draft === base) setDraft(value);
  }
  const commit = () => {
    if (cancel.current) {
      cancel.current = false;
      setDraft(value);
      return;
    }
    const note = draft.trim();
    setDraft(note);
    if (note !== value) onSave(note);
  };
  return (
    <label className={c.note} data-filled={draft ? '' : undefined}>
      <PenLine aria-hidden="true" />
      <input
        value={draft}
        maxLength={200}
        placeholder="Adicionar nota"
        aria-label="Nota da revisão"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event: ReactKeyboardEvent<HTMLInputElement>) => {
          if (event.key === 'Enter') event.currentTarget.blur();
          if (event.key === 'Escape') {
            event.stopPropagation();
            cancel.current = true;
            event.currentTarget.blur();
          }
        }}
      />
    </label>
  );
}

function ItemPage({ item, review }: { item: CatalogItem; review?: Review }) {
  const Specimen = specimens[item.id];
  const index = catalogItems.findIndex((entry) => entry.id === item.id);
  const prev = catalogItems[index - 1];
  const next = catalogItems[index + 1];
  return (
    <div className={c.content}>
      <header className={c.itemHead}>
        <div className={c.itemTitleRow}>
          <h1 id="ds-content" tabIndex={-1} className={c.title}>
            {item.label}
          </h1>
          <Checkbox
            className={c.reviewToggle}
            label="Revisado"
            checked={Boolean(review?.reviewed)}
            onChange={(event) => saveReview(item.id, { reviewed: event.target.checked })}
          />
        </div>
        <NoteField value={review?.note ?? ''} onSave={(note) => saveReview(item.id, { note })} />
      </header>
      <div className={c.specimen} data-specimen>
        {Specimen ? (
          <Specimen />
        ) : (
          <div className={c.pending}>
            <Mark state="desenho" size={20} />
            <span>Em desenho</span>
          </div>
        )}
      </div>
      <nav className={c.pager} aria-label="Itens vizinhos">
        {prev ? (
          <a href={`#${prev.id}`} className={c.pagerLink} data-dir="prev">
            <ArrowLeft aria-hidden="true" />
            <span className={c.pagerText}>
              <span>Anterior</span>
              <strong>{prev.label}</strong>
            </span>
          </a>
        ) : (
          <span />
        )}
        {next ? (
          <a href={`#${next.id}`} className={c.pagerLink} data-dir="next">
            <span className={c.pagerText}>
              <span>Próximo</span>
              <strong>{next.label}</strong>
            </span>
            <ArrowRight aria-hidden="true" />
          </a>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}

/* ——— Catálogo ——— */

export function CatalogV3() {
  const active = useSyncExternalStore(subscribeHash, readHash, () => 'visao-geral');
  const reviews = useReviews();
  const [query, setQuery] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const side = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const focusSearch = useRef(false);

  const item = catalogItems.find((entry) => entry.id === active);
  const index = item ? catalogItems.findIndex((entry) => entry.id === item.id) : -1;
  const siblings = item ? catalogItems.filter((entry) => entry.groupId === item.groupId) : [];
  const position = item ? siblings.findIndex((entry) => entry.id === item.id) + 1 : 0;
  const prev = index > 0 ? catalogItems[index - 1] : undefined;
  const next = index >= 0 ? catalogItems[index + 1] : undefined;

  // Nova página: topo, título da aba e item ativo visível no menu.
  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.title = `${item?.label ?? (isPage(active) ? PAGES[active] : 'Visão geral')} · Design System V3`;
    const nav = navRef.current;
    const reveal = () => {
      const el = nav?.querySelector<HTMLElement>(`[data-nav-item="${active}"]`);
      if (!nav || !el) return;
      const top = el.getBoundingClientRect().top - nav.getBoundingClientRect().top + nav.scrollTop;
      const pad = 40;
      if (top < nav.scrollTop + pad) nav.scrollTop = top - pad;
      else if (top + el.offsetHeight > nav.scrollTop + nav.clientHeight - pad)
        nav.scrollTop = top + el.offsetHeight - nav.clientHeight + pad;
    };
    reveal();
    const timer = window.setTimeout(reveal, 320);
    return () => window.clearTimeout(timer);
  }, [active, item?.label]);

  // Gaveta do menu (até 1199px), no molde do /dashboardv3.
  useEffect(() => {
    if (!navOpen) {
      if (restoreFocus.current) menuButton.current?.focus();
      restoreFocus.current = false;
      return;
    }
    if (focusSearch.current) searchRef.current?.focus();
    else
      (
        side.current?.querySelector<HTMLElement>('[aria-current="page"]') ??
        side.current?.querySelector<HTMLElement>('a[href]')
      )?.focus();
    focusSearch.current = false;
    const wide = window.matchMedia('(min-width: 1200px)');
    const onWide = () => wide.matches && setNavOpen(false);
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      restoreFocus.current = true;
      setNavOpen(false);
    };
    wide.addEventListener('change', onWide);
    document.addEventListener('keydown', onKey);
    return () => {
      wide.removeEventListener('change', onWide);
      document.removeEventListener('keydown', onKey);
    };
  }, [navOpen]);

  // Atalhos: "/" busca no menu; ← → item anterior e próximo (fora de campos e das pranchas).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === '/' && !isTyping(event.target)) {
        event.preventDefault();
        if (navOpen || window.matchMedia('(min-width: 1200px)').matches) searchRef.current?.focus();
        else {
          focusSearch.current = true;
          setNavOpen(true);
        }
        return;
      }
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      if (event.shiftKey || !item || navOpen) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.closest(WIDGETS) || document.querySelector('[aria-modal="true"]')) return;
      const to = event.key === 'ArrowLeft' ? prev : next;
      if (to) {
        event.preventDefault();
        go(to.id);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [item, prev, next, navOpen]);

  const closeNav = () => {
    restoreFocus.current = true;
    setNavOpen(false);
  };
  const crumbs: { label: string; href?: string }[] = item
    ? [{ label: 'Design System', href: '#visao-geral' }, { label: item.groupLabel }, { label: item.label }]
    : [{ label: 'Design System', href: '#visao-geral' }, { label: isPage(active) ? PAGES[active] : 'Visão geral' }];

  return (
    <div className={c.app} data-nav-open={navOpen || undefined}>
      <button
        type="button"
        className={c.skip}
        onClick={() => document.getElementById('ds-content')?.focus()}
      >
        Pular para o conteúdo
      </button>
      <aside ref={side} id="ds-nav" className={c.side} aria-label="Navegação do catálogo">
        <Sidebar
          active={active}
          reviews={reviews}
          query={query}
          onQuery={setQuery}
          searchRef={searchRef}
          navRef={navRef}
          onNavigate={() => setNavOpen(false)}
        />
      </aside>
      {navOpen && <button type="button" className={c.scrim} aria-label="Fechar menu" onClick={closeNav} />}
      <div className={c.main} inert={navOpen || undefined}>
        <header className={c.top}>
          <IconButton
            ref={menuButton}
            className={c.menuButton}
            label="Abrir menu"
            icon={MenuIcon}
            variant="ghost"
            size="sm"
            aria-controls="ds-nav"
            aria-expanded={navOpen}
            onClick={() => setNavOpen(true)}
          />
          <nav className={c.crumbs} aria-label="Você está em">
            {crumbs.map((crumb, i) => (
              <span key={crumb.label} className={c.crumb}>
                {i > 0 && <ChevronRight aria-hidden="true" />}
                {crumb.href ? (
                  <a href={crumb.href}>{crumb.label}</a>
                ) : i === crumbs.length - 1 ? (
                  <strong aria-current="page">{crumb.label}</strong>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
          {item && (
            <div className={c.topEnd}>
              <span className={c.position}>
                <strong>{position}</strong> de {siblings.length}
              </span>
              <ButtonGroup label="Navegar entre itens">
                <IconButton
                  label="Item anterior (←)"
                  icon={ChevronLeft}
                  size="sm"
                  disabled={!prev}
                  onClick={() => prev && go(prev.id)}
                />
                <IconButton
                  label="Próximo item (→)"
                  icon={ChevronRight}
                  size="sm"
                  disabled={!next}
                  onClick={() => next && go(next.id)}
                />
              </ButtonGroup>
            </div>
          )}
        </header>
        <main className={c.page} data-paper>
          {active === 'visao-geral' && <Overview reviews={reviews} />}
          {active === 'inventario' && <InventoryPage reviews={reviews} />}
          {item && <ItemPage key={item.id} item={item} review={reviews[item.id]} />}
        </main>
      </div>
    </div>
  );
}
