'use client';

import {
  Activity,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  ChevronRight,
  ChevronsUpDown,
  FileText,
  Gift,
  Image as ImageIcon,
  LayoutDashboard,
  Megaphone,
  Menu as MenuIcon,
  Radio,
  Search,
  Settings,
  Shield,
  Store,
  Tags,
  UsersRound,
  Users,
  ChartNoAxesColumn,
  type LucideIcon,
} from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { Avatar, BrandMark, IconButton } from '@/components/ds-v3';
import { Select } from '@/components/ds-v3/select';
import { BUCKETS } from './campaigns/buckets';
import { store, useStore, type Persona } from './store';
import s from './shell.module.css';

const PERSONAS = [
  { value: 'operador', label: 'Gestão do portal', description: 'Operador da feira' },
  { value: 'anunciante', label: 'Área do anunciante', description: 'Aurora Calçados' },
];
/** Mesmo recorte da aba "Em aprovação" da lista: o número do menu bate com o da aba. */
const PENDING = BUCKETS.find((bucket) => bucket.key === 'aprovacao')?.statuses ?? [];

type NavItem = { label: string; icon: LucideIcon; href?: string; count?: number };

function navFor(persona: Persona, pending: number): { label: string; items: NavItem[] }[] {
  if (persona === 'anunciante')
    return [
      { label: 'Workspace', items: [{ label: 'Visão geral', icon: LayoutDashboard }] },
      {
        label: 'Anunciar',
        items: [
          { label: 'Minhas campanhas', icon: Megaphone, href: '/dashboardv3/campanhas' },
          { label: 'Catálogo de mídia', icon: Boxes },
          { label: 'Meus pedidos', icon: FileText },
          { label: 'Criativos', icon: ImageIcon },
        ],
      },
      {
        label: 'Resultados',
        items: [
          { label: 'Performance', icon: BarChart3 },
          { label: 'Meus leads', icon: UsersRound, count: 4 },
        ],
      },
    ];
  return [
    { label: 'Workspace', items: [{ label: 'Visão geral', icon: LayoutDashboard }] },
    {
      label: 'Configuração',
      items: [
        { label: 'Métricas', icon: ChartNoAxesColumn },
        { label: 'Canais', icon: Radio },
        { label: 'Públicos', icon: Users },
        { label: 'Inventário', icon: Boxes },
        { label: 'Bônus', icon: Gift },
      ],
    },
    {
      label: 'Operação',
      items: [
        { label: 'Campanhas', icon: Megaphone, href: '/dashboardv3/campanhas', count: pending || undefined },
        { label: 'Pedidos de Inserção', icon: FileText },
        { label: 'Leads', icon: UsersRound, count: 2 },
      ],
    },
    {
      label: 'Portal',
      items: [
        { label: 'Fornecedores', icon: Store },
        { label: 'Empresa & Branding', icon: Building2 },
        { label: 'Categorias da Vitrine', icon: Tags },
        { label: 'Auditoria', icon: Shield },
        { label: 'Operações', icon: Activity },
        { label: 'Configurações', icon: Settings },
      ],
    },
  ];
}

export function Shell({
  crumbs,
  frame = false,
  onNavigate,
  children,
}: {
  crumbs: { label: string; href?: string }[];
  /** Conteúdo ocupa exatamente a altura da tela, sem rolar a página (fluxos com cabeçalho e rodapé fixos). */
  frame?: boolean;
  /** Intercepta a navegação pelo menu e pelo caminho; devolve `false` para segurar (ex.: alterações não salvas). */
  onNavigate?: (href: string) => boolean;
  children: ReactNode;
}) {
  const guard = (href: string) => (event: MouseEvent) => {
    if (onNavigate && !onNavigate(href)) event.preventDefault();
  };
  const pathname = usePathname();
  const { persona, campaigns } = useStore();
  const [query, setQuery] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const side = useRef<HTMLElement>(null);
  const restoreFocus = useRef(false);
  const pending = campaigns.filter((campaign) => PENDING.includes(campaign.status)).length;
  const closeNav = () => {
    restoreFocus.current = true;
    setNavOpen(false);
  };
  // Gaveta do menu (até 1199px): fecha ao trocar de página ou de papel.
  useEffect(() => setNavOpen(false), [pathname, persona]);
  useEffect(() => {
    if (!navOpen) {
      // O conteúdo só deixa de ser inerte depois do commit: devolve o foco aqui, não no clique.
      if (restoreFocus.current) menuButton.current?.focus();
      restoreFocus.current = false;
      return;
    }
    side.current?.querySelector<HTMLElement>('a[href], button:not(:disabled), input')?.focus();
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
  const personaSelect = (
    <Select size="sm" label="Visualização" value={persona} onChange={(value) => store.setPersona(value as Persona)} options={PERSONAS} />
  );
  const term = query.trim().toLowerCase();
  const groups = navFor(persona, pending)
    .map((group) => ({ ...group, items: group.items.filter((item) => !term || item.label.toLowerCase().includes(term)) }))
    .filter((group) => group.items.length);
  return (
    <div className={s.app} data-nav-open={navOpen || undefined}>
      <aside ref={side} id="portal-nav" className={s.side} aria-label="Navegação do portal">
        <div className={s.identity}>
          <button type="button" className={s.portal} aria-label="Trocar de portal">
            <BrandMark name="Francal 2026" size="md" decorative />
            <span className={s.portalText}>
              <strong>Francal 2026</strong>
              <span>{persona === 'anunciante' ? 'Aurora Calçados' : 'Portal do organizador'}</span>
            </span>
            <ChevronsUpDown aria-hidden="true" />
          </button>
        </div>
        {/* No celular o seletor de papel sai do topo e vem para a gaveta. */}
        <div className={s.mode}>
          <span>Visualização</span>
          {personaSelect}
        </div>
        <label className={s.navSearch}>
          <Search aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar no menu…" aria-label="Buscar no menu" />
        </label>
        <nav className={s.nav}>
          {groups.map((group) => (
            <div key={group.label} className={s.group}>
              <span className={s.groupLabel}>{group.label}</span>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = item.href ? pathname.startsWith(item.href) : false;
                const inner = (
                  <>
                    <Icon aria-hidden="true" />
                    <span className={s.itemText}>{item.label}</span>
                    {item.count ? <span className={s.count}>{item.count}</span> : null}
                  </>
                );
                return item.href ? (
                  <Link key={item.label} href={item.href as Route} className={s.item} aria-current={active ? 'page' : undefined} onClick={guard(item.href)}>
                    {inner}
                  </Link>
                ) : (
                  <span key={item.label} className={s.item} aria-disabled="true" title="Fora do escopo deste protótipo">
                    {inner}
                  </span>
                );
              })}
            </div>
          ))}
        </nav>
        <div className={s.footer}>
          <button type="button" className={s.account}>
            <Avatar name={persona === 'anunciante' ? 'Paula Aurora' : 'Marina Lopes'} size="md" decorative />
            <span className={s.accountText}>
              <strong>{persona === 'anunciante' ? 'Paula Mendes' : 'Marina Lopes'}</strong>
              <span>{persona === 'anunciante' ? 'Aurora Calçados' : 'Operação · Francal'}</span>
            </span>
            <ChevronsUpDown aria-hidden="true" />
          </button>
          <p className={s.preview}>
            <i aria-hidden="true" />
            Prévia · dados fictícios
          </p>
        </div>
      </aside>
      {navOpen && <button type="button" className={s.scrim} aria-label="Fechar menu" onClick={closeNav} />}
      <div className={s.main} inert={navOpen || undefined}>
        <header className={s.top}>
          <IconButton
            ref={menuButton}
            className={s.menuButton}
            label="Abrir menu"
            icon={MenuIcon}
            variant="ghost"
            size="sm"
            aria-controls="portal-nav"
            aria-expanded={navOpen}
            onClick={() => setNavOpen(true)}
          />
          <nav className={s.crumbs} aria-label="Você está em">
            {crumbs.map((crumb, index) => (
              <span key={crumb.label} className={s.crumb}>
                {index > 0 && <ChevronRight aria-hidden="true" />}
                {crumb.href ? (
                  <Link href={crumb.href as Route} onClick={guard(crumb.href)}>
                    {crumb.label}
                  </Link>
                ) : index === crumbs.length - 1 ? (
                  <strong aria-current="page">{crumb.label}</strong>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
          <div className={s.topEnd}>
            <span className={s.persona}>{personaSelect}</span>
            <span className={s.bell}>
              <IconButton label="Notificações" icon={Bell} variant="ghost" size="sm" />
              <i aria-hidden="true" />
            </span>
          </div>
        </header>
        <div className={frame ? s.frame : s.content}>{children}</div>
      </div>
    </div>
  );
}
