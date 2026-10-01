'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  CircleHelp,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FileCheck2,
  FolderOpen,
  LayoutDashboard,
  Library,
  Megaphone,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings2,
  Users2,
  X,
} from 'lucide-react';
import s from './pilot.module.css';
import c from './campaign-shell.module.css';
import { PilotAccountMenu } from './pilot-account-menu';

export function PilotShell({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [navQuery, setNavQuery] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(true);
  const sidebar = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menuSearch = useRef<HTMLInputElement>(null);
  const focusSearchOnExpand = useRef(false);
  const isCollapsed = collapsed && !menu;
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const query = normalize(navQuery.trim());
  const matches = (label: string) => normalize(label).includes(query);
  const workspaceItems = [
    { label: 'Visão geral', Icon: LayoutDashboard },
    { label: 'Campanhas', Icon: Megaphone },
    { label: 'Inventário de mídia', Icon: FolderOpen },
    { label: 'Anunciantes', Icon: Users2 },
  ].filter((item) => matches(item.label));
  const managementItems = [
    { label: 'Pedidos de inserção', Icon: FileCheck2 },
    { label: 'Relatórios', Icon: BarChart3 },
  ].filter((item) => matches(item.label));
  const settingsItems = ['Preferências', 'Equipe e permissões'].filter(
    (label) => matches('Configurações') || matches(label),
  );
  const showSettings = matches('Configurações') || settingsItems.length > 0;
  const showHelp = matches('Central de ajuda');
  const noResults = !workspaceItems.length && !managementItems.length && !showSettings && !showHelp;
  const expandedSettings = settingsOpen && !isCollapsed;
  useEffect(() => {
    if (!collapsed && focusSearchOnExpand.current) {
      menuSearch.current?.focus();
      focusSearchOnExpand.current = false;
    }
  }, [collapsed]);
  useEffect(() => {
    if (!menu) return;
    const trigger = menuButton.current;
    sidebar.current?.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenu(false);
      if (event.key !== 'Tab') return;
      const targets = sidebar.current?.querySelectorAll<HTMLElement>(
        'a[href],button:not(:disabled):not([hidden]),input:not(:disabled)',
      );
      const first = targets?.[0];
      const last = targets?.[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    const media = window.matchMedia('(min-width: 768px)');
    const resize = () => {
      if (media.matches) setMenu(false);
    };
    document.addEventListener('keydown', keydown);
    media.addEventListener('change', resize);
    return () => {
      document.removeEventListener('keydown', keydown);
      media.removeEventListener('change', resize);
      trigger?.focus();
    };
  }, [menu]);
  return (
    <div className={`${s.app} ${c.frame}`} data-menu-collapsed={isCollapsed}>
      <a className={s.skip} href="#conteudo">
        Ir para o conteúdo
      </a>
      <aside
        ref={sidebar}
        className={`${c.sidebar} ${menu ? c.sidebarOpen : ''}`}
        aria-label="Menu principal"
        role={menu ? 'dialog' : undefined}
        aria-modal={menu || undefined}
        id="menu-principal"
      >
        <div className={c.brandHeader}>
          <Link
            href="/campanhas"
            className={c.brand}
            aria-label="MediaOn — Campanhas"
            title={isCollapsed ? 'MediaOn — Campanhas' : undefined}
            onClick={() => setMenu(false)}
          >
            <span className={c.wordmark}>
              media<strong>on</strong>
            </span>
            <span className={c.brandInitial} aria-hidden="true">
              m
            </span>
            <i aria-hidden />
          </Link>
          <button
            className={c.collapseMenu}
            hidden={menu}
            aria-label={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            aria-expanded={!isCollapsed}
            aria-controls="navegacao-principal"
            title={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            onClick={() => {
              setCollapsed(!collapsed);
              setNavQuery('');
            }}
          >
            {isCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
          <button className={c.mobileClose} aria-label="Fechar menu" onClick={() => setMenu(false)}>
            <X size={20} />
          </button>
        </div>
        {isCollapsed ? (
          <button
            className={c.collapsedSearch}
            aria-label="Buscar no menu"
            title="Buscar no menu"
            onClick={() => {
              focusSearchOnExpand.current = true;
              setCollapsed(false);
            }}
          >
            <Search size={18} aria-hidden="true" />
          </button>
        ) : (
          <label className={c.menuSearch}>
            <Search size={14} aria-hidden="true" />
            <span className={s.srOnly}>Buscar no menu</span>
            <input
              ref={menuSearch}
              type="search"
              placeholder="Buscar..."
              value={navQuery}
              onChange={(event) => {
                setNavQuery(event.target.value);
                if (event.target.value.trim()) setSettingsOpen(true);
              }}
            />
          </label>
        )}
        <div className={c.navGroups} id="navegacao-principal">
          {workspaceItems.length > 0 && (
            <nav className={c.navigation} aria-label="Workspace">
              <p className={c.groupLabel} hidden={isCollapsed}>
                Workspace
              </p>
              {workspaceItems.map(({ label, Icon }) =>
                label === 'Campanhas' ? (
                  <Link
                    key={label}
                    href="/campanhas"
                    aria-current="page"
                    className={c.navActive}
                    aria-label={label}
                    title={isCollapsed ? label : undefined}
                    onClick={() => setMenu(false)}
                  >
                    <Icon aria-hidden="true" />
                    <span className={c.navLabel}>Campanhas</span>
                  </Link>
                ) : (
                  <button
                    key={label}
                    disabled
                    aria-label={label}
                    title={`${label} · Fora do escopo desta tela-piloto`}
                  >
                    <Icon aria-hidden="true" />
                    <span className={c.navLabel}>{label}</span>
                  </button>
                ),
              )}
            </nav>
          )}
          {managementItems.length > 0 && (
            <nav className={c.navigation} aria-label="Gestão">
              <p className={c.groupLabel} hidden={isCollapsed}>
                Gestão
              </p>
              {managementItems.map(({ label, Icon }) => (
                <button
                  key={label}
                  disabled
                  aria-label={label}
                  title={`${label} · Fora do escopo desta tela-piloto`}
                >
                  <Icon aria-hidden="true" />
                  <span className={c.navLabel}>{label}</span>
                </button>
              ))}
            </nav>
          )}
          {(showSettings || showHelp) && (
            <nav className={c.navigation} aria-label="Configurações">
              <p className={c.groupLabel} hidden={isCollapsed}>
                Sistema
              </p>
              {showSettings && (
                <>
                  <button
                    className={c.settingsTrigger}
                    aria-expanded={expandedSettings}
                    aria-controls="configuracoes-menu"
                    aria-label="Configurações"
                    title={isCollapsed ? 'Configurações' : undefined}
                    onClick={() => {
                      if (isCollapsed) {
                        setCollapsed(false);
                        setSettingsOpen(true);
                      } else setSettingsOpen(!expandedSettings);
                    }}
                  >
                    <Settings2 aria-hidden="true" />
                    <span className={c.navLabel}>Configurações</span>
                    {expandedSettings ? (
                      <ChevronUp className={c.disclosureIcon} />
                    ) : (
                      <ChevronDown className={c.disclosureIcon} />
                    )}
                  </button>
                  {expandedSettings && (
                    <div className={c.submenu} id="configuracoes-menu">
                      {settingsItems.map((label) => (
                        <button key={label} disabled title="Fora do escopo desta tela-piloto">
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
              {showHelp && (
                <button
                  disabled
                  aria-label="Central de ajuda"
                  title="Central de ajuda · Fora do escopo desta tela-piloto"
                >
                  <CircleHelp aria-hidden="true" />
                  <span className={c.navLabel}>Central de ajuda</span>
                </button>
              )}
            </nav>
          )}
          {noResults && (
            <p className={c.noResults} role="status">
              Nenhum item encontrado.
            </p>
          )}
        </div>
        <div className={c.sidebarBottom}>
          <Link
            href="/"
            className={c.libraryLink}
            aria-label="Design System V2"
            title={isCollapsed ? 'Design System V2' : undefined}
          >
            <Library className={c.libraryIcon} size={18} aria-hidden="true" />
            <span className={c.navLabel}>Design System V2</span>
            <ArrowUpRight className={c.libraryArrow} size={14} aria-hidden="true" />
          </Link>
          <PilotAccountMenu collapsed={isCollapsed} />
        </div>
      </aside>
      {menu && (
        <button
          className={c.menuScrim}
          aria-label="Fechar navegação"
          onClick={() => setMenu(false)}
        />
      )}
      <div className={c.stage} inert={menu}>
        <header className={c.topbar}>
          <button
            className={c.mobileMenu}
            ref={menuButton}
            aria-label="Abrir menu"
            aria-expanded={menu}
            aria-controls="menu-principal"
            onClick={() => setMenu(true)}
          >
            <Menu size={20} />
          </button>
          <div className={c.breadcrumb}>
            <span>Francal</span>
            <ChevronRight size={13} aria-hidden="true" />
            <strong>Gestão de campanhas</strong>
          </div>
          <span className={c.demoBadge}>
            Laboratório <span>Dados demonstrativos</span>
          </span>
        </header>
        <main className={c.main} id="conteudo">
          {children}
        </main>
        <footer className={c.footer}>
          <span>MediaOn · Francal</span>
          <span>Prévia de interface. Nenhuma operação real.</span>
        </footer>
      </div>
    </div>
  );
}
