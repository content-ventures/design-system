'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Bell, ChevronDown, ChevronRight, Layers2, Menu, Plus, Search, X } from 'lucide-react';
import { SelectControl } from './controls';
import { FormButton } from './creation-ui';
import { CampaignScreen } from './campaign-screen';
import { TableExplorer } from './table-explorer';
import { ToastExplorer } from './toast-explorer';
import { ToastViewport, useToast } from './toasts';
import { CatalogScreen, RecordScreen } from './record-screens';
import { defaultPreferences, OverviewScreen, SettingsScreen } from './overview-settings';
import {
  modeLabels,
  navigate,
  navigation,
  normalize,
  parseLocation,
  screenHref,
  screens,
  type DemoRecord,
  type ScreenKey,
  type ViewMode,
} from './workspace-data';
import s from './dashboard.module.css';
import a from './application.module.css';

function subscribeLocation(listener: () => void) {
  window.addEventListener('popstate', listener);
  window.addEventListener('hashchange', listener);
  return () => {
    window.removeEventListener('popstate', listener);
    window.removeEventListener('hashchange', listener);
  };
}
const getLocation = () => window.location.hash;
const serverLocation = () => '';

export function DashboardWorkspace() {
  const hash = useSyncExternalStore(subscribeLocation, getLocation, serverLocation);
  const { screen, mode, recordId } = parseLocation(hash);
  const config = screens[screen];
  const creating = recordId === 'novo' && Boolean(config.create);
  const pageTitle = creating ? config.create : config.title;
  const [data, setData] = useState<Record<ScreenKey, DemoRecord[]>>(
    () =>
      Object.fromEntries(
        Object.entries(screens).map(([key, definition]) => [
          key,
          definition.records.map((record) => ({ ...record })),
        ]),
      ) as Record<ScreenKey, DemoRecord[]>,
  );
  const [preferences, setPreferences] = useState(defaultPreferences);
  const { toast, notify, dismiss } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navQuery, setNavQuery] = useState('');
  const [expandedTools, setExpandedTools] = useState(() =>
    navigation[mode].some((group) => group.expandable && group.items.includes(screen)),
  );
  const pageScroll = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const previousHash = useRef(hash);
  const returnMenuFocus = useRef(false);
  const section =
    navigation[mode].find((group) => group.items.includes(screen))?.label ?? 'Workspace';
  const unread = data.notificacoes.filter((record) => record.status === 'Não lida').length;

  useEffect(() => {
    // Alternar o modelo preserva a busca, a rolagem e o foco no seletor de comparação.
    if (screen === 'tabelas' && parseLocation(previousHash.current).screen === 'tabelas') {
      previousHash.current = hash;
      return;
    }
    if (pageScroll.current) pageScroll.current.scrollTop = 0;
    if (previousHash.current !== hash) heading.current?.focus({ preventScroll: true });
    previousHash.current = hash;
  }, [hash, screen]);
  useEffect(() => {
    if (!menuOpen) {
      if (returnMenuFocus.current) menuButton.current?.focus();
      returnMenuFocus.current = false;
      return;
    }
    const first = sidebar.current?.querySelector<HTMLButtonElement>('button');
    first?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        sidebar.current?.closest('[data-controls-root]')?.querySelector('[role="listbox"]')
      )
        return;
      if (event.key === 'Escape') {
        returnMenuFocus.current = true;
        setMenuOpen(false);
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(
        sidebar.current?.querySelectorAll<HTMLElement>('a[href],button,input,select') ?? [],
      ).filter((node) => node.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const media = window.matchMedia('(min-width: 761px)');
    const closeOnDesktop = () => {
      if (media.matches) setMenuOpen(false);
    };
    media.addEventListener('change', closeOnDesktop);
    return () => {
      document.removeEventListener('keydown', onKey);
      media.removeEventListener('change', closeOnDesktop);
    };
  }, [menuOpen]);

  const visit = (destination: ScreenKey, nextMode: ViewMode = mode) => {
    setMenuOpen(false);
    setNavQuery('');
    navigate(destination, nextMode);
  };
  const saveRecord = (record: DemoRecord) =>
    setData((current) => ({
      ...current,
      [screen]: current[screen].some((row) => row.id === record.id)
        ? current[screen].map((row) => (row.id === record.id ? record : row))
        : [...current[screen], record],
    }));
  const navGroups = navigation[mode].map((group) => ({
    ...group,
    items: group.items.filter((key) => normalize(screens[key].title).includes(normalize(navQuery))),
  }));
  const renderScreen = () => {
    if (config.kind === 'toasts') return <ToastExplorer mode={mode} notify={notify} />;
    if (config.kind === 'tables')
      return <TableExplorer mode={mode} variantId={recordId} notice={notify} />;
    if (config.kind === 'campaigns')
      return <CampaignScreen mode={mode} recordId={recordId} notice={notify} />;
    if (config.kind === 'overview') return <OverviewScreen mode={mode} data={data} />;
    if (config.kind === 'settings' || config.kind === 'brand')
      return (
        <SettingsScreen
          brand={config.kind === 'brand'}
          mode={mode}
          preferences={preferences}
          save={setPreferences}
        />
      );
    if (config.kind === 'catalog') return <CatalogScreen mode={mode} records={data.inventario} />;
    return (
      <RecordScreen
        screen={screen}
        records={data[screen]}
        recordId={recordId}
        mode={mode}
        save={saveRecord}
        notice={notify}
        choices={{
          channels: data.canais.map((row) => row.name),
          audiences: data.publicos.map((row) => row.name),
        }}
      />
    );
  };

  return (
    <div className={`${s.canvas} ${a.application}`} data-controls-root>
      <a
        className={s.skipLink}
        href="#workspace-content"
        onClick={(event) => {
          event.preventDefault();
          heading.current?.focus();
        }}
      >
        Pular para o conteúdo
      </a>
      <div className={`${s.workspace} ${a.appWorkspace}`}>
        {menuOpen && (
          <button
            className={a.scrim}
            aria-label="Fechar navegação"
            tabIndex={-1}
            onClick={() => {
              returnMenuFocus.current = true;
              setMenuOpen(false);
            }}
          />
        )}
        <aside
          ref={sidebar}
          className={`${s.sidebar} ${a.appSidebar}`}
          data-open={menuOpen}
          aria-label="Navegação do workspace"
          role={menuOpen ? 'dialog' : undefined}
          aria-modal={menuOpen || undefined}
        >
          <div className={`${s.workspaceIdentity} ${a.identity}`}>
            <span className={s.logo} aria-hidden="true">
              <Layers2 size={24} />
            </span>
            <div>
              <strong>MediaOn</strong>
              <small>{preferences.portalName} Workspace</small>
            </div>
            <button
              className={`${s.iconButton} ${a.closeMenu}`}
              aria-label="Fechar menu"
              onClick={() => {
                returnMenuFocus.current = true;
                setMenuOpen(false);
              }}
            >
              <X size={18} />
            </button>
          </div>
          <div className={a.modeSelector}>
            <label htmlFor="workspace-mode">Visualização</label>
            <SelectControl
              id="workspace-mode"
              label="Visualização"
              compact
              value={mode}
              onValueChange={(value) => visit('visao-geral', value as ViewMode)}
              options={Object.entries(modeLabels).map(([value, label]) => ({ value, label }))}
            />
          </div>
          <label className={a.navSearch}>
            <Search size={14} aria-hidden="true" />
            <input
              placeholder="Buscar no menu…"
              aria-label="Buscar no menu"
              value={navQuery}
              onChange={(event) => setNavQuery(event.target.value)}
            />
            {navQuery && (
              <button aria-label="Limpar busca do menu" onClick={() => setNavQuery('')}>
                <X size={12} />
              </button>
            )}
          </label>
          <nav className={`${s.navigation} ${a.appNav}`} aria-label="Menu principal">
            {navGroups.map((group) => {
              if (!group.items.length) return null;
              const expanded = !group.expandable || expandedTools || Boolean(navQuery);
              return (
                <div className={a.navGroup} key={group.label}>
                  {group.expandable ? (
                    <button
                      className={a.navGroupToggle}
                      aria-expanded={expanded}
                      aria-controls="extra-navigation"
                      onClick={() => setExpandedTools(!expandedTools)}
                    >
                      {group.label}
                      <ChevronDown size={13} />
                    </button>
                  ) : (
                    <p className={s.sectionLabel}>{group.label}</p>
                  )}
                  <div id={group.expandable ? 'extra-navigation' : undefined} hidden={!expanded}>
                    {group.items.map((key) => {
                      const item = screens[key];
                      const Icon = item.icon;
                      return (
                        <a
                          className={s.navItem}
                          href={screenHref(key, mode)}
                          key={key}
                          aria-current={key === screen ? 'page' : undefined}
                          onClick={(event) => {
                            event.preventDefault();
                            visit(key);
                          }}
                        >
                          <Icon size={17} aria-hidden="true" />
                          <span>{item.title}</span>
                          {key === 'leads' && (
                            <small className={s.navCount}>
                              {data.leads.filter((record) => record.status === 'Novo').length}
                            </small>
                          )}
                        </a>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {navGroups.every((group) => group.items.length === 0) && (
              <p className={a.navEmpty}>Nenhuma área encontrada.</p>
            )}
          </nav>
          <footer className={a.accountFooter}>
            <a href="/design-system-v2" className={a.libraryLink}>
              Design System V2 <ChevronRight size={13} />
            </a>
            <button onClick={() => visit('configuracoes')}>
              <span className={a.accountAvatar}>{mode === 'anunciante' ? 'AU' : 'EM'}</span>
              <span>
                <strong>{mode === 'anunciante' ? 'Aurora' : 'Equipe de mídia'}</strong>
                <small>{mode === 'plataforma' ? 'Administrador' : preferences.portalName}</small>
              </span>
              <ChevronRight size={14} />
            </button>
            <p>
              <span />
              Prévia · dados fictícios
            </p>
          </footer>
        </aside>
        <main className={`${s.main} ${a.appMain}`} inert={menuOpen || undefined}>
          <header className={`${s.topbar} ${a.appTopbar}`}>
            <button
              ref={menuButton}
              className={`${s.iconButton} ${a.openMenu}`}
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={19} />
            </button>
            <span className={s.breadcrumbArrow}>
              <ChevronRight size={13} />
            </span>
            <div className={`${s.breadcrumb} ${a.appBreadcrumb}`}>
              <span>{section}</span>
              <span>/</span>
              <span aria-current={creating ? undefined : 'page'}>{config.title}</span>
              {creating && (
                <>
                  <span>/</span>
                  <span aria-current="page">{config.create}</span>
                </>
              )}
            </div>
            <div className={a.topbarActions}>
              <button
                className={`${s.iconButton} ${a.notificationButton}`}
                aria-label={`Notificações, ${unread} não lidas`}
                onClick={() => visit('notificacoes')}
              >
                <Bell size={17} />
                {unread > 0 && <i />}
              </button>
            </div>
          </header>
          <div className={a.pageScroll} ref={pageScroll}>
            <div className={`${s.pageHeading} ${a.appPageHeading}`}>
              <h1 id="workspace-content" ref={heading} tabIndex={-1}>
                {pageTitle}
              </h1>
              {config.create && !recordId && (
                <FormButton
                  variant="primary"
                  icon={Plus}
                  onClick={() => navigate(screen, mode, 'novo')}
                >
                  {config.create}
                </FormButton>
              )}
            </div>
            <div key={`${mode}:${screen}:${config.kind === 'tables' ? '' : (recordId ?? '')}`}>
              {renderScreen()}
            </div>
          </div>
        </main>
      </div>
      <ToastViewport toast={toast} dismiss={dismiss} suspended={menuOpen} />
    </div>
  );
}
