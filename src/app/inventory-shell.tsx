'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Box,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileInput,
  Grid2X2,
  Image,
  Layers,
  LayoutTemplate,
  Menu,
  Moon,
  MousePointer2,
  PanelLeft,
  Search,
  SlidersHorizontal,
  Sun,
  Table2,
  X,
} from 'lucide-react';
import { inventory, inventoryCount, normalizeSearch } from './inventory';
import { sampleFor, sampleCount } from './catalog';
import { Showcase } from './showcase';
import { Button, Toast } from '../components/ds/primitives';
import { ConnectionMark } from '../components/ds/connection-mark';
import s from './inventory-shell.module.css';

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}
const readHash = () => window.location.hash.slice(1) || 'overview';
const serverHash = () => 'overview';
const groupIcons = [
  Box,
  MousePointer2,
  FileInput,
  PanelLeft,
  LayoutTemplate,
  Table2,
  ChartNoAxesCombined,
  CircleHelp,
  Layers,
  Image,
  SlidersHorizontal,
  Grid2X2,
];

export function InventoryShell() {
  const hash = useSyncExternalStore(subscribe, readHash, serverHash);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [portal, setPortal] = useState('mediaon');
  const [notification, setNotification] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const sideRef = useRef<HTMLElement>(null);
  const selectedGroup = inventory.find((g) => g.items.some((i) => i.id === hash));
  const selectedItem = selectedGroup?.items.find((i) => i.id === hash);
  const selection = selectedItem
    ? hash
    : ['overview', 'telas', 'nova-campanha', 'inventario'].includes(hash)
      ? hash
      : 'overview';
  const title =
    selectedItem?.label ??
    {
      overview: 'Design System',
      telas: 'Biblioteca de telas',
      'nova-campanha': 'Criação de campanha',
      inventario: 'Inventário da biblioteca',
    }[selection] ??
    'Design System';
  const description =
    selectedItem?.scope ??
    {
      overview: 'A biblioteca visual para a próxima experiência MediaOn.',
      telas: 'O espaço para testar, comparar e aprovar as próximas experiências.',
      inventario: 'O mapa completo da biblioteca, com o estágio real de cada item.',
      'nova-campanha': 'Um fluxo completo em página. Sem sobreposições, sem perder o contexto.',
    }[selection] ??
    '';
  const term = normalizeSearch(query);
  const visibleGroups = inventory
    .map((g) => ({
      ...g,
      items: g.items.filter((i) =>
        normalizeSearch(`${g.label} ${i.label} ${i.scope} ${i.keywords}`).includes(term),
      ),
    }))
    .filter((g) => g.items.length);
  const resultCount = visibleGroups.reduce((sum, g) => sum + g.items.length, 0);
  const notify = useCallback((message: string) => setNotification(message), []);
  const dismiss = useCallback(() => setNotification(''), []);
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    requestAnimationFrame(() => menuRef.current?.focus());
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    titleRef.current?.focus({ preventScroll: true });
  }, [hash]);
  useEffect(() => {
    if (menuOpen) searchRef.current?.focus();
  }, [menuOpen]);
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setMenuOpen(true);
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);
  function navigate() {
    setMenuOpen(false);
  }
  return (
    <div className={`ds-theme ${s.shell}`} data-theme={theme} data-portal={portal}>
      <a
        href="#conteudo-principal"
        className={s.skipLink}
        onClick={(e) => {
          e.preventDefault();
          titleRef.current?.focus();
        }}
      >
        Pular para o conteúdo
      </a>
      <header className={s.mobileHeader}>
        <a href="#overview" onClick={navigate}>
          media.on <span>Design System</span>
        </a>
        <Button
          ref={menuRef}
          variant="ghost"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
          aria-controls="ds-sidebar"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={19} /> : <Menu size={19} />}
        </Button>
      </header>
      {menuOpen && (
        <button
          className={s.menuBackdrop}
          aria-label="Fechar navegação"
          tabIndex={-1}
          onClick={closeMenu}
        />
      )}
      <aside
        ref={sideRef}
        id="ds-sidebar"
        className={`${s.sidebar} ${menuOpen ? s.sidebarOpen : ''}`}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && menuOpen) closeMenu();
          if (e.key === 'Tab' && menuOpen && window.matchMedia('(max-width: 800px)').matches) {
            const elements = Array.from(
              e.currentTarget.querySelectorAll<HTMLElement>('a,button,input'),
            ).filter((el) => el.offsetParent !== null);
            const first = elements[0];
            const last = elements.at(-1);
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last?.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <a
          className={s.brand}
          href="#overview"
          onClick={navigate}
          aria-label="MediaOn Design System v2 — início"
        >
          <ConnectionMark size={32} />
          <span className={s.wordmark}>
            media<span>.</span>on
          </span>
          <span className={s.brandVersion}>v2</span>
        </a>
        <span className={s.brandSubtitle}>Design System</span>
        <div className={s.search}>
          <Search size={14} />
          <input
            ref={searchRef}
            type="search"
            aria-label="Buscar na biblioteca"
            placeholder="Buscar componente"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query ? (
            <button aria-label="Limpar busca" onClick={() => setQuery('')}>
              <X size={12} />
            </button>
          ) : (
            <kbd>⌘ K</kbd>
          )}
        </div>
        <nav className={s.navigation} aria-label="Design System V2">
          <a
            className={s.navLink}
            href="#overview"
            onClick={navigate}
            aria-current={selection === 'overview' ? 'page' : undefined}
          >
            <Grid2X2 size={15} />
            <span>Visão geral</span>
          </a>
          <a
            className={s.navLink}
            href="#inventario"
            onClick={navigate}
            aria-current={selection === 'inventario' ? 'page' : undefined}
          >
            <BookOpen size={15} />
            <span>Inventário</span>
            <small>{inventoryCount}</small>
          </a>
          <div className={s.navLabel}>
            <span>BIBLIOTECA</span>
            <span className={s.navLegend} title="Ponto preenchido: amostra em revisão">
              ● Em revisão
            </span>
          </div>
          <span role="status" className={s.srOnly}>
            {term ? `${resultCount} itens encontrados` : ''}
          </span>
          {visibleGroups.map((group) => {
            const index = inventory.findIndex((g) => g.id === group.id);
            const Icon = groupIcons[index] ?? Box;
            const open = Boolean(term) || (expanded[group.id] ?? selectedGroup?.id === group.id);
            return (
              <div className={s.group} key={group.id}>
                <button
                  className={s.groupToggle}
                  aria-expanded={open}
                  aria-controls={`group-${group.id}`}
                  onClick={() => setExpanded({ ...expanded, [group.id]: !open })}
                >
                  <Icon size={15} />
                  <span>{group.label}</span>
                  {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                <ul id={`group-${group.id}`} hidden={!open}>
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        onClick={navigate}
                        aria-current={selection === item.id ? 'page' : undefined}
                      >
                        <span>{item.label}</span>
                        <i
                          data-ready={Boolean(sampleFor(item.id))}
                          title={sampleFor(item.id) ? 'Amostra em revisão' : 'Planejado'}
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {!visibleGroups.length && (
            <p className={s.noResults}>Nenhum componente encontrado. Tente outro nome.</p>
          )}
          <div className={s.navLabel}>EM CONTEXTO</div>
          <a
            className={s.navLink}
            href="#telas"
            onClick={navigate}
            aria-current={
              selection === 'telas' || selection === 'nova-campanha' ? 'page' : undefined
            }
          >
            <LayoutTemplate size={15} />
            <span>Biblioteca de telas</span>
            <ArrowUpRight size={13} />
          </a>
        </nav>
        <footer className={s.sidebarFooter}>
          <div className={s.progressHeader}>
            <span>Exploração visual · R2</span>
            <span>
              {sampleCount}/{inventoryCount}
            </span>
          </div>
          <div className={s.libraryProgress}>
            <span style={{ width: `${(sampleCount / inventoryCount) * 100}%` }} />
          </div>
          <p>Em revisão · Sem vínculo com produção</p>
        </footer>
      </aside>
      <div
        className={s.workspace}
        inert={
          menuOpen &&
          typeof window !== 'undefined' &&
          window.matchMedia('(max-width: 800px)').matches
            ? true
            : undefined
        }
      >
        <header className={s.topbar}>
          <div className={s.breadcrumb}>
            <span>MediaOn</span>
            <ChevronRight size={12} />
            <span>Design System</span>
            {selection !== 'overview' && (
              <>
                <ChevronRight size={12} />
                <strong>
                  {selectedGroup?.label ??
                    (selection === 'telas'
                      ? 'Telas'
                      : selection === 'inventario'
                        ? 'Inventário'
                        : 'Telas')}
                </strong>
              </>
            )}
          </div>
          <div className={s.topbarActions}>
            <span className={s.environment}>
              <i />
              Ambiente de criação
            </span>
            <span className={s.topbarDivider} />
            <Button
              size="sm"
              variant="ghost"
              aria-label={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
          </div>
        </header>
        <main id="conteudo-principal" className={s.content}>
          <header className={s.pageHeading}>
            <div>
              <div className={s.pageTitle}>
                <h1 ref={titleRef} tabIndex={-1}>
                  {title}
                </h1>
                {selection === 'overview' && <span>V2.0</span>}
                {selectedItem && (
                  <span className={sampleFor(selection) ? s.readyStatus : s.plannedStatus}>
                    {sampleFor(selection) ? 'Em revisão' : 'Planejado'}
                  </span>
                )}
              </div>
              <p>{description}</p>
            </div>
            {selection === 'overview' && (
              <a href="#telas" className={s.headerLink}>
                Explorar telas
                <ArrowUpRight size={14} />
              </a>
            )}
          </header>
          <div key={selection} className={s.view}>
            <Showcase
              key={selection}
              selection={selection}
              theme={theme}
              setTheme={setTheme}
              portal={portal}
              setPortal={setPortal}
              onNotify={notify}
            />
          </div>
        </main>
        <footer className={s.workspaceFooter}>
          <span>
            MEDIA.ON <span>/</span> Design System V2
          </span>
          <span>Exploração 0.2 · Em revisão</span>
        </footer>
      </div>
      {notification && <Toast message={notification} onClose={dismiss} />}
    </div>
  );
}
