'use client';

import {
  Activity,
  Archive,
  ArrowRightLeft,
  Bell,
  Boxes,
  Building2,
  ChartColumn,
  ChartNoAxesColumn,
  ChevronDown,
  Copy,
  Download,
  Ellipsis,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Gift,
  LayoutDashboard,
  Link2,
  LogOut,
  Megaphone,
  Pencil,
  Pin,
  Plus,
  Radio,
  Search,
  Settings,
  Shield,
  SlidersHorizontal,
  Store,
  Tags,
  Trash2,
  UserPlus,
  UserRound,
  Users,
  UsersRound,
  X,
} from 'lucide-react';
import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  Avatar,
  BrandMark,
  Button,
  Count,
  IconButton,
  Kbd,
  type Tone,
} from '@content-ventures/design-system/v3';
import {
  AppShell,
  Breadcrumb,
  BreadcrumbItem,
  CommandPalette,
  CommandPanel,
  NotificationsButton,
  PortalSwitcher,
  Sidebar,
  SidebarAccount,
  SidebarItem,
  TopBar,
  TopBarItem,
  type CommandGroup,
  type CommandItem,
  type Crumb,
  type NavGroup,
  type Portal,
} from '@content-ventures/design-system/v3/app-shell';
import { ContextMenu } from '@content-ventures/design-system/v3/context-menu';
import {
  Menu,
  MenuPanel,
  type MenuItem,
  type MenuSection,
} from '@content-ventures/design-system/v3/menu';
import { PageArrow, PageButton, Pagination } from '@content-ventures/design-system/v3/pagination';
import { Tooltip } from '@content-ventures/design-system/v3/overlays';
import { Select } from '@content-ventures/design-system/v3/select';
import {
  ActionBar,
  SaveIndicator,
  StepList,
  StepMarker,
  StepPipeline,
  Stepper,
  StepperCompact,
  type PipelineStage,
  type StepItem,
  type StepState,
} from '@content-ventures/design-system/v3/stepper';
import { Tabs, type TabItem } from '@content-ventures/design-system/v3/tabs';
import { toast, Toaster } from '@content-ventures/design-system/v3/toast';
import toastStyles from '@content-ventures/design-system/v3/toast.module.css';
import { Phone, Row, Shot, Shots, State, States } from '../stage';
import x from './navegacao.module.css';

/* ——————————————————————————— Dados fictícios ——————————————————————————— */

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    items: [{ id: 'visao-geral', label: 'Visão geral', icon: LayoutDashboard }],
  },
  {
    id: 'configuracao',
    label: 'Configuração',
    items: [
      { id: 'metricas', label: 'Métricas', icon: ChartNoAxesColumn },
      { id: 'canais', label: 'Canais', icon: Radio },
      { id: 'publicos', label: 'Públicos', icon: Users },
      { id: 'inventario', label: 'Inventário', icon: Boxes },
      { id: 'bonus', label: 'Bônus', icon: Gift },
    ],
  },
  {
    id: 'operacao',
    label: 'Operação',
    items: [
      { id: 'campanhas', label: 'Campanhas', icon: Megaphone, count: 5 },
      { id: 'pedidos', label: 'Pedidos de Inserção', icon: FileText },
      { id: 'leads', label: 'Leads', icon: UsersRound, count: 2, countTone: 'accent' },
    ],
  },
  {
    id: 'portal',
    label: 'Portal',
    items: [
      { id: 'fornecedores', label: 'Fornecedores', icon: Store },
      { id: 'empresa', label: 'Empresa & Branding', icon: Building2 },
      { id: 'categorias', label: 'Categorias da Vitrine', icon: Tags },
      { id: 'auditoria', label: 'Auditoria', icon: Shield },
      { id: 'operacoes', label: 'Operações', icon: Activity },
      { id: 'configuracoes', label: 'Configurações', icon: Settings },
    ],
  },
];

const SHORT_GROUPS: NavGroup[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    items: [{ id: 'visao-geral', label: 'Visão geral', icon: LayoutDashboard }],
  },
  {
    id: 'operacao',
    label: 'Operação',
    items: [
      { id: 'campanhas', label: 'Campanhas', icon: Megaphone, count: 5 },
      { id: 'pedidos', label: 'Pedidos de Inserção', icon: FileText },
      { id: 'leads', label: 'Leads', icon: UsersRound, count: 2, countTone: 'accent' },
    ],
  },
];

const PORTALS: Portal[] = [
  {
    id: 'francal-2026',
    name: 'Francal 2026',
    detail: 'Portal do organizador',
    period: '06/07 – 09/07',
  },
  {
    id: 'francal-2025',
    name: 'Francal 2025',
    detail: 'Portal do organizador',
    period: '07/07 – 10/07',
    status: 'archived',
  },
  {
    id: 'couro-sul-2027',
    name: 'Couro Sul 2027',
    detail: 'Portal do organizador',
    period: '16/03 – 18/03',
    status: 'draft',
    statusLabel: 'Em montagem',
  },
];
const MANAGE_PORTALS: MenuItem = { label: 'Gerenciar portais', icon: Settings };

const ACCOUNT_SECTIONS: MenuSection[] = [
  {
    label: 'Conta',
    items: [
      { label: 'Meu perfil', icon: UserRound },
      { label: 'Notificações', icon: Bell },
    ],
  },
  {
    label: 'Portal',
    items: [
      { label: 'Configurações do portal', icon: Settings },
      { label: 'Equipe do portal', icon: Users },
    ],
  },
  { items: [{ label: 'Sair', icon: LogOut }] },
];

const PERSONAS = [
  { value: 'operador', label: 'Gestão do portal' },
  { value: 'anunciante', label: 'Anunciante' },
];

type Bucket = 'veiculacao' | 'aprovacao' | 'rascunhos' | 'encerradas';
type Campaign = {
  id: number;
  name: string;
  advertiser: string;
  asset: string;
  status: string;
  tone: Tone;
  bucket: Bucket;
  budget: number;
  period: string;
};

/**
 * 17 campanhas: Em veiculação 6 · Em aprovação 5 · Rascunhos 2 · Encerradas 4 (mesmo mapa do dashboard).
 * Códigos de estande levam um “word joiner” (U+2060) depois do hífen: “B-214” nunca quebra.
 */
const CAMPAIGNS: Campaign[] = [
  {
    id: 2041,
    name: 'Coleção Primavera-Verão no portal',
    advertiser: 'Aurora Calçados',
    asset: 'Banner Super Topo — Portal',
    status: 'Veiculando',
    tone: 'green',
    bucket: 'veiculacao',
    budget: 18000,
    period: '01/10 – 31/10',
  },
  {
    id: 2038,
    name: 'Newsletter dos expositores',
    advertiser: 'Estúdio Norte',
    asset: 'E-mail marketing dedicado',
    status: 'Veiculando',
    tone: 'green',
    bucket: 'veiculacao',
    budget: 8000,
    period: '05/10 – 25/10',
  },
  {
    id: 2035,
    name: 'Convite para o estande B-\u2060214',
    advertiser: 'Casa Forma',
    asset: 'Push no app da feira',
    status: 'Aguardando assinatura do P.I.',
    tone: 'amber',
    bucket: 'aprovacao',
    budget: 3600,
    period: '14/10 – 17/10',
  },
  {
    id: 2032,
    name: 'Destaque couro vegetal',
    advertiser: 'Lume Acessórios',
    asset: 'Banner Super Topo — Portal',
    status: 'Aguardando aprovação',
    tone: 'violet',
    bucket: 'aprovacao',
    budget: 9000,
    period: '10/10 – 30/10',
  },
  {
    id: 2029,
    name: 'Retargeting de credenciados',
    advertiser: 'Grupo Horizonte',
    asset: 'Banner Super Topo — Portal',
    status: 'Ajustes solicitados',
    tone: 'orange',
    bucket: 'aprovacao',
    budget: 13500,
    period: '01/10 – 31/10',
  },
  {
    id: 2026,
    name: 'Vitrine de lançamentos Aurora',
    advertiser: 'Aurora Calçados',
    asset: 'Destaque na vitrine',
    status: 'Ajustes solicitados',
    tone: 'orange',
    bucket: 'aprovacao',
    budget: 11230,
    period: '12/10 – 30/10',
  },
  {
    id: 2023,
    name: 'Rodada de negócios — segunda edição',
    advertiser: 'Ateliê Sul',
    asset: 'Painel de LED — Pavilhão Azul',
    status: 'Pausada',
    tone: 'gray',
    bucket: 'veiculacao',
    budget: 3600,
    period: '25/09 – 17/10',
  },
  {
    id: 2020,
    name: 'Guia oficial do visitante',
    advertiser: 'Pátio Couro',
    asset: 'E-mail marketing dedicado',
    status: 'Concluída',
    tone: 'gray',
    bucket: 'encerradas',
    budget: 12000,
    period: '15/09 – 30/09',
  },
  {
    id: 2017,
    name: 'Painel de LED — lançamento',
    advertiser: 'Bella Passo',
    asset: 'Painel de LED — Pavilhão Azul',
    status: 'Aprovada',
    tone: 'teal',
    bucket: 'veiculacao',
    budget: 18000,
    period: '14/10 – 17/10',
  },
  {
    id: 2014,
    name: 'Carrossel de tendências',
    advertiser: 'Aurora Calçados',
    asset: 'Destaque na vitrine',
    status: 'Rascunho',
    tone: 'gray',
    bucket: 'rascunhos',
    budget: 6500,
    period: '05/10 – 12/10',
  },
  {
    id: 2011,
    name: 'Mapa do pavilhão patrocinado',
    advertiser: 'Couro Nobre',
    asset: 'Painel de LED — Pavilhão Azul',
    status: 'Veiculando',
    tone: 'green',
    bucket: 'veiculacao',
    budget: 15000,
    period: '01/10 – 20/10',
  },
  {
    id: 2009,
    name: 'Agenda de lançamentos',
    advertiser: 'Estúdio Norte',
    asset: 'Push no app da feira',
    status: 'Aprovada',
    tone: 'teal',
    bucket: 'veiculacao',
    budget: 4500,
    period: '16/10 – 18/10',
  },
  {
    id: 2005,
    name: 'Vitrine de verão',
    advertiser: 'Casa Forma',
    asset: 'Destaque na vitrine',
    status: 'Aguardando aprovação',
    tone: 'violet',
    bucket: 'aprovacao',
    budget: 7200,
    period: '20/10 – 31/10',
  },
  {
    id: 2003,
    name: 'Lançamento linha infantil',
    advertiser: 'Bella Passo',
    asset: 'Banner Super Topo — Portal',
    status: 'Rascunho',
    tone: 'gray',
    bucket: 'rascunhos',
    budget: 9000,
    period: '22/10 – 31/10',
  },
  {
    id: 2002,
    name: 'Esquenta Francal',
    advertiser: 'Lume Acessórios',
    asset: 'E-mail marketing dedicado',
    status: 'Concluída',
    tone: 'gray',
    bucket: 'encerradas',
    budget: 5400,
    period: '01/09 – 15/09',
  },
  {
    id: 2001,
    name: 'Credenciamento antecipado',
    advertiser: 'Grupo Horizonte',
    asset: 'Push no app da feira',
    status: 'Cancelada',
    tone: 'red',
    bucket: 'encerradas',
    budget: 2700,
    period: '05/09 – 10/09',
  },
  {
    id: 1998,
    name: 'Pré-venda de estandes',
    advertiser: 'Pátio Couro',
    asset: 'Banner Super Topo — Portal',
    status: 'Rejeitada',
    tone: 'red',
    bucket: 'encerradas',
    budget: 6000,
    period: '01/09 – 30/09',
  },
];

const money = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

/** Os avisos precisam de um Toaster na página; o catálogo pode já ter o seu. */
function EnsureToaster() {
  const [needed, setNeeded] = useState(false);
  useEffect(() => {
    const cls = toastStyles.viewport;
    setNeeded(!cls || !document.querySelector(`.${CSS.escape(cls)}`));
  }, []);
  return needed ? <Toaster /> : null;
}

/* ——————————————————————————— Peças de composição ——————————————————————————— */

/** Encosta o conteúdo da célula no topo (células de alturas diferentes na mesma linha). */
function Top({ children, end = false }: { children: ReactNode; end?: boolean }) {
  return (
    <div className={x.top} data-end={end || undefined}>
      {children}
    </div>
  );
}

function StatusDot({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={x.status} style={{ '--dot': `var(--${tone}-dot)` } as CSSProperties}>
      <i aria-hidden="true" />
      {children}
    </span>
  );
}

function CampaignTable({
  rows,
  swapKey,
  compact = false,
  rowProps,
}: {
  rows: Campaign[];
  /** Muda quando o recorte muda: as linhas entram em fade de 120 ms. */
  swapKey: string;
  compact?: boolean;
  rowProps?: (row: Campaign) => { wrap?: (row: ReactElement) => ReactNode };
}) {
  return (
    <div className={x.tableWrap} data-compact={compact || undefined}>
      <table className={x.table}>
        <thead>
          <tr>
            <th scope="col">Campanha</th>
            <th scope="col" className={x.colAdvertiser}>
              Anunciante
            </th>
            <th scope="col" className={x.colStatus}>
              Status
            </th>
            <th scope="col" className={x.colMoney}>
              Verba
            </th>
          </tr>
        </thead>
        <tbody key={swapKey} className={x.rowsIn}>
          {rows.map((row) => {
            const tr = (
              <tr
                key={row.id}
                tabIndex={rowProps ? 0 : undefined}
                aria-label={rowProps ? `${row.name}, #${row.id}` : undefined}
              >
                <td>
                  <span className={x.cellName}>{row.name}</span>
                  <span className={x.cellSub}>
                    <span className={x.subAsset}>{row.asset}</span>
                    <span className={x.subId}>· #{row.id}</span>
                  </span>
                </td>
                <td className={x.colAdvertiser}>
                  <span className={x.cellBrand}>
                    <BrandMark name={row.advertiser} size="xs" variant="soft" decorative />
                    {row.advertiser}
                  </span>
                </td>
                <td className={x.colStatus}>
                  <StatusDot tone={row.tone}>{row.status}</StatusDot>
                </td>
                <td className={x.colMoney}>{money(row.budget)}</td>
              </tr>
            );
            const wrap = rowProps?.(row).wrap;
            return wrap ? <Fragment key={row.id}>{wrap(tr)}</Fragment> : tr;
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Miolo de página usado dentro das molduras do app. */
function PagePreview({
  title = 'Campanhas',
  rows = CAMPAIGNS.slice(0, 4),
}: {
  title?: string;
  rows?: Campaign[];
}) {
  return (
    <div className={x.page}>
      <div className={x.pageHead}>
        <div>
          <h2 className={x.pageTitle}>{title}</h2>
          <p className={x.pageSub}>17 de 17 campanhas do portal.</p>
        </div>
        <Button variant="primary" icon={Plus} className={x.pageAction}>
          Nova campanha
        </Button>
      </div>
      <CampaignTable rows={rows} swapKey="preview" compact />
    </div>
  );
}

/* ——————————————————————————— Menu lateral ——————————————————————————— */

function SidebarReplica() {
  const [active, setActive] = useState('campanhas');
  const [portal, setPortal] = useState('francal-2026');
  return (
    <div className={x.sideFrame}>
      <Sidebar
        label="Navegação do portal"
        switcher={
          <PortalSwitcher
            portals={PORTALS}
            value={portal}
            onChange={setPortal}
            action={MANAGE_PORTALS}
          />
        }
        filter
        groups={NAV_GROUPS}
        active={active}
        onNavigate={setActive}
        account={
          <SidebarAccount
            name="Marina Lopes"
            detail="Operação · Francal"
            sections={ACCOUNT_SECTIONS}
          />
        }
      />
    </div>
  );
}

function CollapsedShell() {
  return (
    <div className={x.shellFrame} style={{ height: 560 }}>
      <AppShell
        fill
        collapsed
        layout="desktop"
        contentAs="div"
        sidebar={
          <Sidebar
            switcher={
              <PortalSwitcher portals={PORTALS} value="francal-2026" onChange={() => undefined} />
            }
            groups={NAV_GROUPS}
            active="campanhas"
            account={
              <SidebarAccount
                name="Marina Lopes"
                detail="Operação · Francal"
                sections={ACCOUNT_SECTIONS}
              />
            }
          />
        }
        topbar={<TopBar breadcrumb={[{ label: 'Operação' }, { label: 'Campanhas' }]} />}
      >
        <PagePreview />
      </AppShell>
    </div>
  );
}

function PhoneShell({ open = false }: { open?: boolean }) {
  return (
    <Phone height={700} className={x.phoneFill} label="Celular, 390">
      <AppShell
        fill
        defaultNavOpen={open}
        contentAs="div"
        sidebar={
          <Sidebar
            label="Navegação do portal"
            switcher={
              <PortalSwitcher
                portals={PORTALS}
                value="francal-2026"
                onChange={() => undefined}
                action={MANAGE_PORTALS}
              />
            }
            filter
            groups={NAV_GROUPS}
            active="campanhas"
            account={
              <SidebarAccount
                name="Marina Lopes"
                detail="Operação · Francal"
                sections={ACCOUNT_SECTIONS}
              />
            }
          />
        }
        topbar={
          <TopBar
            breadcrumb={[{ label: 'Operação' }, { label: 'Campanhas' }]}
            notifications={<NotificationsButton count={3} sections={NOTIFICATIONS} />}
          />
        }
      >
        <PagePreview rows={CAMPAIGNS.slice(0, 3)} />
      </AppShell>
    </Phone>
  );
}

/* ——— Em breve: o mapa inteiro do produto no menu ——— */

const LEADS_SOON = 'Chega em novembro, com o funil de vendas.';

/** O que já existe navega; o que ainda não abre leva “Em breve” e o motivo na dica. */
const ROADMAP_GROUPS: NavGroup[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    items: [{ id: 'visao-geral', label: 'Visão geral', icon: LayoutDashboard }],
  },
  {
    id: 'operacao',
    label: 'Operação',
    items: [
      { id: 'campanhas', label: 'Campanhas', icon: Megaphone, count: 5 },
      { id: 'pedidos', label: 'Pedidos de Inserção', icon: FileText },
      { id: 'leads', label: 'Leads', icon: UsersRound, soon: { reason: LEADS_SOON } },
    ],
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    collapsible: true,
    items: [
      {
        id: 'desempenho',
        label: 'Desempenho',
        icon: ChartColumn,
        soon: { reason: 'Chega em dezembro, com os números do portal e do app.' },
      },
      { id: 'exportacoes', label: 'Exportações', icon: FileSpreadsheet, soon: true },
    ],
  },
  {
    id: 'portal',
    label: 'Portal',
    items: [
      { id: 'fornecedores', label: 'Fornecedores', icon: Store },
      {
        id: 'categorias',
        label: 'Categorias da Vitrine',
        icon: Tags,
        soon: { reason: 'Chega com a nova vitrine do app.' },
      },
      { id: 'configuracoes', label: 'Configurações', icon: Settings },
    ],
  },
];

function RoadmapSidebar() {
  const [active, setActive] = useState('campanhas');
  return (
    <div className={x.sideFrame}>
      <Sidebar
        label="Navegação do portal"
        switcher={
          <PortalSwitcher
            portals={PORTALS}
            value="francal-2026"
            onChange={() => undefined}
            action={MANAGE_PORTALS}
          />
        }
        groups={ROADMAP_GROUPS}
        active={active}
        onNavigate={setActive}
        account={
          <SidebarAccount
            name="Marina Lopes"
            detail="Operação · Francal"
            sections={ACCOUNT_SECTIONS}
          />
        }
      />
    </div>
  );
}

function RoadmapCollapsed() {
  return (
    <div className={x.shellFrame} style={{ height: 600 }}>
      <AppShell
        fill
        collapsed
        layout="desktop"
        contentAs="div"
        sidebar={
          <Sidebar
            switcher={
              <PortalSwitcher portals={PORTALS} value="francal-2026" onChange={() => undefined} />
            }
            groups={ROADMAP_GROUPS}
            active="campanhas"
            peek="desempenho"
            account={
              <SidebarAccount
                name="Marina Lopes"
                detail="Operação · Francal"
                sections={ACCOUNT_SECTIONS}
              />
            }
          />
        }
        topbar={<TopBar breadcrumb={[{ label: 'Operação' }, { label: 'Campanhas' }]} />}
      >
        <PagePreview />
      </AppShell>
    </div>
  );
}

function RoadmapPhone() {
  return (
    <Phone height={700} className={x.phoneFill} label="Celular, 390">
      <AppShell
        fill
        defaultNavOpen
        contentAs="div"
        sidebar={
          <Sidebar
            label="Navegação do portal"
            switcher={
              <PortalSwitcher
                portals={PORTALS}
                value="francal-2026"
                onChange={() => undefined}
                action={MANAGE_PORTALS}
              />
            }
            groups={ROADMAP_GROUPS}
            active="campanhas"
            account={
              <SidebarAccount
                name="Marina Lopes"
                detail="Operação · Francal"
                sections={ACCOUNT_SECTIONS}
              />
            }
          />
        }
        topbar={<TopBar breadcrumb={[{ label: 'Operação' }, { label: 'Campanhas' }]} />}
      >
        <PagePreview rows={CAMPAIGNS.slice(0, 3)} />
      </AppShell>
    </Phone>
  );
}

/** Prancha que só faz sentido em telas largas (o produto não mostra esse layout no celular). */
function WideOnly({ below, children }: { below: 640 | 760; children: ReactNode }) {
  return (
    <div className={x.wideOnly} data-below={below}>
      {children}
    </div>
  );
}

function NavStrip({ children }: { children: ReactNode }) {
  return <div className={x.navStrip}>{children}</div>;
}

function SidebarSpecimen() {
  return (
    <Shots>
      <Shot title="Em contexto" pad="lg">
        <SidebarReplica />
      </Shot>
      <WideOnly below={640}>
        <Shot title="Recolhido" align="stretch" pad="sm">
          <CollapsedShell />
        </Shot>
      </WideOnly>
      <Shot title="Em breve" pad="lg">
        <RoadmapSidebar />
      </Shot>
      <WideOnly below={640}>
        <Shot title="Em breve · recolhido" align="stretch" pad="sm">
          <RoadmapCollapsed />
        </Shot>
      </WideOnly>
      <Shot title="Estados" tone="white" align="stretch">
        <States min={200}>
          <State label="Repouso">
            <NavStrip>
              <SidebarItem item={{ id: 'pedidos', label: 'Pedidos de Inserção', icon: FileText }} />
            </NavStrip>
          </State>
          <State label="Hover">
            <NavStrip>
              <SidebarItem
                item={{
                  id: 'pedidos',
                  label: 'Pedidos de Inserção',
                  icon: FileText,
                  force: 'hover',
                }}
              />
            </NavStrip>
          </State>
          <State label="Pressionado">
            <NavStrip>
              <SidebarItem
                item={{
                  id: 'pedidos',
                  label: 'Pedidos de Inserção',
                  icon: FileText,
                  force: 'active',
                }}
              />
            </NavStrip>
          </State>
          <State label="Ativo">
            <NavStrip>
              <SidebarItem
                item={{ id: 'campanhas', label: 'Campanhas', icon: Megaphone, count: 5 }}
                active
              />
            </NavStrip>
          </State>
          <State label="Foco">
            <NavStrip>
              <SidebarItem
                item={{
                  id: 'pedidos',
                  label: 'Pedidos de Inserção',
                  icon: FileText,
                  force: 'focus',
                }}
              />
            </NavStrip>
          </State>
          <State label="Com contagem">
            <NavStrip>
              <SidebarItem
                item={{
                  id: 'leads',
                  label: 'Leads',
                  icon: UsersRound,
                  count: 2,
                  countTone: 'accent',
                }}
              />
            </NavStrip>
          </State>
          <State label="Em breve">
            <NavStrip>
              <SidebarItem
                item={{
                  id: 'leads',
                  label: 'Leads',
                  icon: UsersRound,
                  soon: { reason: LEADS_SOON },
                }}
              />
            </NavStrip>
          </State>
          <State label="Em breve · hover">
            <NavStrip>
              <SidebarItem
                item={{
                  id: 'leads',
                  label: 'Leads',
                  icon: UsersRound,
                  soon: { reason: LEADS_SOON },
                  force: 'hover',
                }}
              />
            </NavStrip>
          </State>
          <State label="Em breve · foco e dica">
            <NavStrip>
              <SidebarItem
                item={{
                  id: 'leads',
                  label: 'Leads',
                  icon: UsersRound,
                  soon: { reason: LEADS_SOON },
                  force: 'focus tip',
                }}
              />
            </NavStrip>
          </State>
        </States>
      </Shot>
      <Shot title="Celular">
        <div className={x.phones}>
          {/* Fechada é do CSS (`@container shell`): o HTML do servidor já sai assim, sem a barra
              espremendo a página; o JS só abre e fecha. */}
          <State label="Fechada, desde a primeira pintura">
            <PhoneShell />
          </State>
          <State label="Aberta">
            <PhoneShell open />
          </State>
          <State label="Aberta, com itens em breve">
            <RoadmapPhone />
          </State>
        </div>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Cabeçalho do aplicativo ——————————————————————————— */

const NOTIFICATIONS: MenuSection[] = [
  {
    label: 'Novas',
    items: [
      {
        label: 'P.I. 2026-0400 assinado',
        description: 'Aurora Calçados · há 12 min',
        leading: <BrandMark name="Aurora Calçados" size="xs" variant="soft" decorative />,
      },
      {
        label: 'Ajustes solicitados em #2029',
        description: 'Grupo Horizonte · há 1 h',
        leading: <BrandMark name="Grupo Horizonte" size="xs" variant="soft" decorative />,
      },
      {
        label: 'Clara Souto comentou em #2035',
        description: 'Convite para o estande B-\u2060214 · há 3 h',
        leading: <Avatar name="Clara Souto" size="xs" decorative />,
      },
    ],
  },
];

const DETAIL_ROWS: [string, string][] = [
  ['Anunciante', 'Aurora Calçados'],
  ['Ativo', 'Banner Super Topo — Portal'],
  ['Categoria', 'Mídia Online'],
  ['Modelo de precificação', 'CPM · R$ 45,00 / mil impressões'],
  ['Verba', 'R$ 18.000,00'],
  ['Período', '01/10/2026 – 31/10/2026 · 31 dias'],
  ['Canais', 'Portal da feira (50%), App Francal (50%)'],
  ['Públicos', 'Visitantes credenciados (50%), Lojistas e compradores (50%)'],
  ['Bônus liberados', '+20% de impressões'],
];

/** Linha de meta: o “·” que cairia no começo de uma linha quebrada fica recortado. */
function Meta({ items }: { items: string[] }) {
  return (
    <p className={x.detailMeta}>
      <span className={x.metaLine}>
        {items.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </span>
    </p>
  );
}

function DetailPreview() {
  return (
    <div className={x.detail}>
      <div className={x.detailHead}>
        <h2 className={x.pageTitle}>Coleção Primavera-Verão no portal</h2>
        <StatusDot tone="green">Veiculando</StatusDot>
      </div>
      <Meta items={['#2041', 'Aurora Calçados', 'Banner Super Topo — Portal', '01/10 – 31/10']} />
      <h3 className={x.sectionTitle}>Configuração</h3>
      <dl className={x.props}>
        {DETAIL_ROWS.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function PersonaSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <TopBarItem phone="hide">
      <span className={x.persona}>
        <Select
          size="sm"
          label="Visualização"
          value={value}
          onChange={onChange}
          options={PERSONAS}
        />
      </span>
    </TopBarItem>
  );
}

const crumbsFor = (persona: string): Crumb[] =>
  persona === 'anunciante'
    ? [{ label: 'Campanhas' }, { label: 'Coleção Primavera-Verão no portal' }]
    : [
        { label: 'Operação' },
        { label: 'Campanhas' },
        { label: 'Coleção Primavera-Verão no portal' },
      ];

function HeaderContext() {
  const [persona, setPersona] = useState('operador');
  return (
    <div className={x.scrollFrame}>
      <div className={x.scrollInner}>
        <TopBar
          breadcrumb={crumbsFor(persona)}
          actions={<PersonaSelect value={persona} onChange={setPersona} />}
          notifications={<NotificationsButton count={3} sections={NOTIFICATIONS} />}
        />
        <DetailPreview />
      </div>
    </div>
  );
}

function FramedShell({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: ReactNode;
}) {
  if (width <= 390)
    return (
      <Phone height={height} className={`${x.phoneFill} ${x.fadeMain}`} label="Celular, 390">
        {children}
      </Phone>
    );
  return (
    <div className={`${x.shellFrame} ${x.fadeMain}`} style={{ width, height, maxWidth: '100%' }}>
      {children}
    </div>
  );
}

function ResponsiveHeader({ width, height }: { width: number; height: number }) {
  const [persona, setPersona] = useState('operador');
  return (
    <FramedShell width={width} height={height}>
      <AppShell
        fill
        contentAs="div"
        sidebar={
          <Sidebar
            switcher={
              <PortalSwitcher portals={PORTALS} value="francal-2026" onChange={() => undefined} />
            }
            filter
            groups={NAV_GROUPS}
            active="campanhas"
            account={
              <SidebarAccount
                name="Marina Lopes"
                detail="Operação · Francal"
                sections={ACCOUNT_SECTIONS}
              />
            }
          />
        }
        topbar={
          <TopBar
            breadcrumb={crumbsFor(persona)}
            actions={<PersonaSelect value={persona} onChange={setPersona} />}
            notifications={<NotificationsButton count={3} sections={NOTIFICATIONS} />}
          />
        }
      >
        <div className={x.detailInset}>
          <DetailPreview />
        </div>
      </AppShell>
    </FramedShell>
  );
}

function BellState({ unread = false, force }: { unread?: boolean; force?: string }) {
  return (
    <NotificationsButton
      unread={unread}
      count={unread ? 3 : 0}
      sections={NOTIFICATIONS}
      force={force}
    />
  );
}

function HeaderSpecimen() {
  return (
    <Shots>
      <Shot title="Em contexto" align="stretch" pad="sm">
        <HeaderContext />
      </Shot>
      <WideOnly below={760}>
        <Shot title="Tablet" pad="sm">
          <ResponsiveHeader width={1024} height={320} />
        </Shot>
      </WideOnly>
      <Shot title="Estados" tone="white" align="stretch">
        <div className={x.bellStates}>
          <States columns={4} align="center">
            <State label="Sem novidade">
              <BellState />
            </State>
            <State label="Com novidade">
              <BellState unread />
            </State>
            <State label="Hover">
              <BellState force="hover" />
            </State>
            <State label="Foco">
              <BellState force="focus" />
            </State>
          </States>
          <States columns={1} align="center">
            <State label="Aberto">
              <div className={x.bellOpen}>
                <BellState unread force="hover" />
                <MenuPanel label="Notificações" width={344} sections={NOTIFICATIONS} />
              </div>
            </State>
          </States>
        </div>
      </Shot>
      <Shot title="Celular">
        <ResponsiveHeader width={390} height={360} />
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Breadcrumbs ——————————————————————————— */

const DEEP_PATH: Crumb[] = [
  { label: 'Portal' },
  { label: 'Vitrine' },
  { label: 'Categorias' },
  { label: 'Calçados femininos' },
  { label: 'Scarpin Couro Vegetal Primavera' },
];

function BreadcrumbsSpecimen() {
  return (
    <Shots>
      <Shot title="Em contexto" align="stretch" pad="sm">
        <div className={x.barFrame}>
          <TopBar
            sticky={false}
            breadcrumb={[
              { label: 'Operação' },
              { label: 'Campanhas' },
              { label: 'Coleção Primavera-Verão no portal' },
            ]}
            actions={<PersonaSelect value="operador" onChange={() => undefined} />}
            notifications={<NotificationsButton count={3} sections={NOTIFICATIONS} />}
          />
          <div className={x.barPage}>
            <div className={x.detailHead}>
              <h2 className={x.pageTitle}>Coleção Primavera-Verão no portal</h2>
              <StatusDot tone="green">Veiculando</StatusDot>
            </div>
            <Meta
              items={['#2041', 'Aurora Calçados', 'Banner Super Topo — Portal', '01/10 – 31/10']}
            />
          </div>
        </div>
      </Shot>
      <Shot title="Variantes" tone="white" align="stretch">
        <States min={260}>
          <State label="Recolhido">
            <div className={x.narrowCrumbs}>
              <Breadcrumb items={DEEP_PATH} maxItems={4} label="Caminho da categoria" />
            </div>
          </State>
          <State label="Com marca">
            <Breadcrumb
              label="Caminho do anunciante"
              items={[
                { label: 'Anunciantes' },
                {
                  label: 'Aurora Calçados',
                  leading: <BrandMark name="Aurora Calçados" size="xs" variant="soft" decorative />,
                },
                { label: 'Campanhas' },
              ]}
            />
          </State>
          <State label="Compacto">
            <Breadcrumb
              variant="compact"
              items={[{ label: 'Campanhas' }, { label: 'Coleção Primavera-Verão no portal' }]}
            />
          </State>
        </States>
      </Shot>
      <Shot title="Estados" tone="white" align="stretch">
        <States min={150}>
          <State label="Link">
            <Top>
              <BreadcrumbItem item={{ label: 'Campanhas' }} />
            </Top>
          </State>
          <State label="Hover">
            <Top>
              <BreadcrumbItem item={{ label: 'Campanhas', force: 'hover' }} />
            </Top>
          </State>
          <State label="Atual">
            <Top>
              <BreadcrumbItem item={{ label: 'Coleção Primavera-Verão' }} current />
            </Top>
          </State>
          <State label="Foco">
            <Top>
              <BreadcrumbItem item={{ label: 'Campanhas', force: 'focus' }} />
            </Top>
          </State>
          <State label="Recolhido aberto" span={2}>
            <div className={x.moreOpen} data-top>
              <Breadcrumb
                label="Caminho da categoria"
                maxItems={3}
                moreOpenForce="hover"
                items={DEEP_PATH.slice(0, 4)}
              />
              <MenuPanel
                label="Níveis ocultos"
                width={200}
                sections={[
                  { items: [{ label: 'Vitrine', force: 'hover' }, { label: 'Categorias' }] },
                ]}
              />
            </div>
          </State>
        </States>
      </Shot>
      <Shot title="Celular">
        <Phone label="Celular, 390">
          <div className={x.phoneBar}>
            <Breadcrumb
              variant="compact"
              items={[{ label: 'Campanhas' }, { label: 'Coleção Primavera-Verão no portal' }]}
            />
            <IconButton
              label="Mais ações"
              icon={Ellipsis}
              variant="ghost"
              size="sm"
              className={x.phoneBarAction}
            />
          </div>
          <div className={x.phoneBody}>
            <h2 className={x.pageTitle}>Coleção Primavera-Verão no portal</h2>
            <Meta items={['#2041', 'Aurora Calçados']} />
            <StatusDot tone="green">Veiculando</StatusDot>
          </div>
        </Phone>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Abas ——————————————————————————— */

type TabKey = 'todas' | Bucket;
const BUCKET_TABS: { value: TabKey; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'veiculacao', label: 'Em veiculação' },
  { value: 'aprovacao', label: 'Em aprovação' },
  { value: 'rascunhos', label: 'Rascunhos' },
  { value: 'encerradas', label: 'Encerradas' },
];
const inBucket = (tab: TabKey) => CAMPAIGNS.filter((row) => tab === 'todas' || row.bucket === tab);
const STATUS_TABS: TabItem<TabKey>[] = BUCKET_TABS.map((tab) => ({
  ...tab,
  count: inBucket(tab.value).length,
}));

function ListTabs() {
  const [tab, setTab] = useState<TabKey>('todas');
  return (
    <div className={x.listCard}>
      <Tabs label="Recortes por status" items={STATUS_TABS} value={tab} onChange={setTab} />
      <CampaignTable rows={inBucket(tab).slice(0, 5)} swapKey={tab} />
    </div>
  );
}

const DAILY = [8.2, 9.1, 10.4, 9.8, 12.1, 13.6, 11.9, 12.8, 14.2, 15.1, 13.9, 16.4, 17.2, 18.1];

function DetailTabs() {
  const [tab, setTab] = useState<'geral' | 'analytics'>('geral');
  return (
    <div className={x.detailTabs}>
      <Tabs
        label="Seções da campanha"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'geral', label: 'Visão geral', panelId: 'nav-aba-geral' },
          { value: 'analytics', label: 'Analytics', panelId: 'nav-aba-analytics' },
        ]}
      />
      {tab === 'geral' ? (
        <div
          role="tabpanel"
          id="nav-aba-geral"
          aria-labelledby="nav-aba-geral-tab"
          className={x.tabPanel}
        >
          <dl className={x.metrics}>
            {[
              ['Impressões', '271.400', 'Entregues no período'],
              ['Cliques', '6.120', 'CTR 2,25%'],
              ['Leads', '214', 'Campanha + vitrine'],
              ['Entrega', '68%', 'de ≈ 400.000 impressões'],
            ].map(([label, value, note]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
                <span>{note}</span>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <div
          role="tabpanel"
          id="nav-aba-analytics"
          aria-labelledby="nav-aba-analytics-tab"
          className={x.tabPanel}
        >
          <div className={x.chartHead}>
            <span>Impressões por dia</span>
            <strong>18,1 mil</strong>
          </div>
          <div className={x.bars} aria-label="Impressões por dia, de 01/10 a 14/10" role="img">
            {DAILY.map((value, index) => (
              <i
                key={index}
                style={{ height: `${(value / 18.1) * 100}%` }}
                data-last={index === DAILY.length - 1 || undefined}
              />
            ))}
          </div>
          <div className={x.chartAxis}>
            <span>01/10</span>
            <span>14/10</span>
          </div>
        </div>
      )}
    </div>
  );
}

function TabsSizes() {
  const [md, setMd] = useState<TabKey>('aprovacao');
  const [sm, setSm] = useState<'canais' | 'publicos' | 'briefing'>('publicos');
  return (
    <div className={x.sizes}>
      <State label="Padrão">
        <div className={x.sizeTabs} data-top>
          <Tabs
            label="Recortes por status, médio"
            items={STATUS_TABS.slice(0, 4)}
            value={md}
            onChange={setMd}
          />
          <ul className={x.panelList} key={md}>
            {inBucket(md)
              .slice(0, 3)
              .map((row) => (
                <li key={row.id}>
                  <span>{row.name}</span>
                  <span>{money(row.budget)}</span>
                </li>
              ))}
          </ul>
        </div>
      </State>
      <State label="Compacta">
        <div className={x.panel} data-top>
          <div className={x.panelHead}>
            <strong>Banner Super Topo — Portal</strong>
          </div>
          <Tabs
            size="sm"
            label="Vínculos do ativo"
            value={sm}
            onChange={setSm}
            items={[
              { value: 'canais', label: 'Canais', count: 2 },
              { value: 'publicos', label: 'Públicos', count: 3 },
              { value: 'briefing', label: 'Briefing' },
            ]}
          />
          <ul className={x.panelList} key={sm}>
            {(sm === 'canais'
              ? [
                  ['Portal da feira', '50%'],
                  ['App Francal', '50%'],
                ]
              : sm === 'publicos'
                ? [
                    ['Visitantes credenciados', '50%'],
                    ['Lojistas e compradores', '30%'],
                    ['Imprensa', '20%'],
                  ]
                : [
                    ['Peça criativa', 'Falta'],
                    ['URL de destino', 'Falta'],
                  ]
            ).map(([name, value]) => (
              <li key={name}>
                <span>{name}</span>
                <span data-missing={value === 'Falta' || undefined}>{value}</span>
              </li>
            ))}
          </ul>
        </div>
      </State>
    </div>
  );
}

function PhoneTabs() {
  const [tab, setTab] = useState<TabKey>('todas');
  return (
    <Phone label="Celular, 390">
      <div className={x.phoneBody}>
        <h2 className={x.pageTitle}>Campanhas</h2>
        <p className={x.pageSub}>17 de 17 campanhas do portal.</p>
      </div>
      <div className={x.bleedTabs}>
        <Tabs
          label="Recortes por status, celular"
          items={STATUS_TABS}
          value={tab}
          onChange={setTab}
        />
      </div>
      <ul className={x.cardList} key={tab}>
        {inBucket(tab)
          .slice(0, 3)
          .map((row) => (
            <li key={row.id}>
              <strong>{row.name}</strong>
              <span>
                <StatusDot tone={row.tone}>{row.status}</StatusDot>
              </span>
              <span className={x.cardMeta}>
                {money(row.budget)} · {row.period}
              </span>
            </li>
          ))}
      </ul>
    </Phone>
  );
}

function TabState({
  label,
  selected,
  force,
  disabled,
  count,
}: {
  label: string;
  selected?: boolean;
  force?: string;
  disabled?: boolean;
  count?: number;
}) {
  return (
    <div className={x.tabCell}>
      <Tabs
        label={label}
        items={[{ value: 'a', label, force, disabled, count }]}
        value={(selected ? 'a' : 'b') as 'a'}
        onChange={() => undefined}
      />
    </div>
  );
}

function TabsSpecimen() {
  return (
    <Shots>
      <Shot title="Lista" tone="white" align="stretch">
        <ListTabs />
      </Shot>
      <Shot title="Detalhe" tone="white" align="stretch">
        <DetailTabs />
      </Shot>
      <Shot title="Tamanhos" align="stretch">
        <TabsSizes />
      </Shot>
      <Shot title="Estados" tone="white" align="stretch">
        <States min={140}>
          <State label="Repouso">
            <TabState label="Rascunhos" count={2} />
          </State>
          <State label="Hover">
            <TabState label="Rascunhos" count={2} force="hover" />
          </State>
          <State label="Selecionada">
            <TabState label="Rascunhos" count={2} selected />
          </State>
          <State label="Foco">
            <TabState label="Rascunhos" count={2} selected force="focus" />
          </State>
          <State label="Indisponível">
            <TabState label="Arquivadas" disabled />
          </State>
        </States>
      </Shot>
      <Shot title="Celular">
        <PhoneTabs />
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Paginação ——————————————————————————— */

function PagedList() {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const rows = CAMPAIGNS.slice((page - 1) * size, page * size);
  return (
    <div className={x.listCard} data-framed>
      <CampaignTable rows={rows} swapKey={`${page}-${size}`} />
      <Pagination
        page={page}
        pageSize={size}
        total={CAMPAIGNS.length}
        noun="campanhas"
        onPageChange={setPage}
        onPageSizeChange={(value) => {
          setSize(value);
          setPage(1);
        }}
      />
    </div>
  );
}

function LongPagination() {
  const [page, setPage] = useState(5);
  return (
    <div className={x.footFrame}>
      <Pagination
        page={page}
        pageSize={10}
        total={120}
        noun="leads"
        onPageChange={setPage}
        onPageSizeChange={() => undefined}
      />
    </div>
  );
}

function PhonePagination() {
  const [page, setPage] = useState(2);
  return (
    <Phone label="Celular, 390">
      <ul className={x.cardList}>
        {CAMPAIGNS.slice((page - 1) * 10, (page - 1) * 10 + 3).map((row) => (
          <li key={row.id}>
            <strong>{row.name}</strong>
            <span>
              <StatusDot tone={row.tone}>{row.status}</StatusDot>
            </span>
            <span className={x.cardMeta}>
              {money(row.budget)} · {row.period}
            </span>
          </li>
        ))}
      </ul>
      <Pagination
        page={page}
        pageSize={10}
        total={120}
        noun="campanhas"
        onPageChange={setPage}
        onPageSizeChange={() => undefined}
      />
    </Phone>
  );
}

function PaginationSpecimen() {
  return (
    <Shots>
      <Shot title="Em contexto" align="stretch" pad="sm">
        <PagedList />
      </Shot>
      <Shot title="Lista longa" tone="white" align="stretch">
        <LongPagination />
      </Shot>
      <Shot title="Estados" tone="white" align="stretch">
        <States min={130} align="center">
          <State label="Página atual">
            <span className={x.arrows}>
              <PageButton page={4} current />
            </span>
          </State>
          <State label="Hover">
            <span className={x.arrows}>
              <PageButton page={5} force="hover" />
            </span>
          </State>
          <State label="Pressionado">
            <span className={x.arrows}>
              <PageButton page={5} force="active" />
            </span>
          </State>
          <State label="Foco">
            <span className={x.arrows}>
              <PageButton page={5} force="focus" />
            </span>
          </State>
          <State label="Anterior indisponível">
            <span className={x.arrows}>
              <PageArrow direction="prev" disabled />
              <PageArrow direction="next" />
            </span>
          </State>
        </States>
      </Shot>
      <Shot title="Celular">
        <PhonePagination />
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Etapas ——————————————————————————— */

const CREATION_STEPS = [
  { id: 'identificacao', label: 'Identificação' },
  { id: 'ativo', label: 'Ativo' },
  { id: 'precificacao', label: 'Precificação' },
  { id: 'canal', label: 'Canal + Público' },
  { id: 'briefing', label: 'Briefing' },
  { id: 'revisao', label: 'Revisão' },
] as const;

/** Etapas já preenchidas nesta campanha: voltar a uma delas não apaga as seguintes. */
const CREATION_REACHED = 2;
/** Motivo da etapa bloqueada: dica do DS no hover, no foco e no toque; descrição no leitor. */
const REVIEW_REASON = 'Libera com o briefing completo';

/** Jornada de uma produção vista no Material (feito): o Artigo segue “em andamento”. */
const VIEWING_STEPS: StepItem[] = [
  { id: 'material', label: 'Material' },
  { id: 'artigo', label: 'Artigo', state: 'active' },
  {
    id: 'carrossel',
    label: 'Carrossel',
    state: 'blocked',
    reason: 'Libera quando o artigo for aprovado',
  },
  {
    id: 'entrega',
    label: 'Entrega',
    state: 'blocked',
    reason: 'Libera quando o carrossel for aprovado',
  },
];

function CreationHeader() {
  const [current, setCurrent] = useState(CREATION_REACHED);
  const steps: StepItem[] = CREATION_STEPS.map((step, index) =>
    step.id === 'revisao'
      ? { ...step, state: 'blocked', reason: REVIEW_REASON }
      : { ...step, state: index <= CREATION_REACHED && index !== current ? 'done' : undefined },
  );
  return (
    <div className={x.barFrame}>
      <TopBar
        sticky={false}
        breadcrumb={[{ label: 'Operação' }, { label: 'Campanhas' }, { label: 'Nova campanha' }]}
        actions={<PersonaSelect value="operador" onChange={() => undefined} />}
        notifications={<NotificationsButton count={3} sections={NOTIFICATIONS} />}
      />
      <div className={x.creationHead}>
        <div className={x.creationTitle}>
          <h3>Nova campanha</h3>
          <span>Criada pelo admin</span>
        </div>
        <div className={x.creationSteps}>
          <Stepper
            steps={steps}
            current={current}
            size="sm"
            fit="content"
            align="end"
            label="Etapas da campanha"
            onStepSelect={setCurrent}
          />
        </div>
      </div>
    </div>
  );
}

const JOURNEY: PipelineStage[] = [
  { id: 'rascunho', label: 'Rascunho', state: 'done', detail: 'Montagem da campanha' },
  { id: 'aprovacao', label: 'Aprovação', state: 'done', detail: 'Comercial do portal' },
  { id: 'pi', label: 'P.I.', state: 'done', detail: 'Assinatura em 72 h' },
  { id: 'veiculacao', label: 'Veiculação', state: 'current', detail: 'No ar no período' },
  { id: 'concluida', label: 'Concluída', state: 'upcoming', detail: 'Relatório final' },
];

const SIDE_STEPS: StepItem[] = [
  { id: 'identificacao', label: 'Identificação', description: 'Coleção Primavera-Verão 2027' },
  { id: 'ativo', label: 'Ativo', description: 'Banner Super Topo — Portal' },
  { id: 'precificacao', label: 'Precificação', description: 'R$ 18.000,00 · CPM' },
  { id: 'canal', label: 'Canal + Público', description: '2 canais · 3 públicos' },
  { id: 'briefing', label: 'Briefing', description: '2 de 6 preenchidos', state: 'warn' },
  {
    id: 'revisao',
    label: 'Revisão',
    description: 'Checagem e envio',
    state: 'blocked',
    reason: REVIEW_REASON,
  },
];

function SideList() {
  const [current, setCurrent] = useState(3);
  return (
    <div className={x.sideColumn}>
      <StepList
        steps={SIDE_STEPS}
        current={current}
        onStepSelect={setCurrent}
        label="Etapas da campanha"
        tone="plain"
      />
    </div>
  );
}

function StepChip({ state, index, label }: { state: StepState; index: number; label: string }) {
  return (
    <span className={x.stepChip} data-state={state}>
      <StepMarker state={state} index={index} />
      <span>{label}</span>
    </span>
  );
}

function StepperSpecimen() {
  const phoneSteps: StepItem[] = CREATION_STEPS.map((step) =>
    step.id === 'revisao' ? { ...step, state: 'blocked', reason: REVIEW_REASON } : { ...step },
  );
  return (
    <Shots>
      <Shot title="Criação" align="stretch" pad="sm">
        <CreationHeader />
      </Shot>
      <Shot title="Jornada" tone="white" align="stretch">
        <StepPipeline variant="journey" label="Jornada da campanha" stages={JOURNEY} />
      </Shot>
      <Shot title="Lista lateral">
        <SideList />
      </Shot>
      <Shot title="Vendo uma etapa feita" tone="white" align="stretch">
        <Stepper
          steps={VIEWING_STEPS}
          current={0}
          size="sm"
          label="Etapas da produção, vendo o material"
          onStepSelect={() => undefined}
        />
      </Shot>
      <Shot title="Estados" tone="white" align="stretch">
        <States min={150}>
          <State label="Feita">
            <StepChip state="done" index={1} label="Ativo" />
          </State>
          <State label="Atual">
            <StepChip state="current" index={2} label="Precificação" />
          </State>
          <State label="Em andamento">
            <StepChip state="active" index={2} label="Precificação" />
          </State>
          <State label="A seguir">
            <StepChip state="upcoming" index={3} label="Canal + Público" />
          </State>
          <State label="Pendência">
            <StepChip state="warn" index={4} label="Briefing" />
          </State>
          <State label="Erro">
            <StepChip state="error" index={4} label="Briefing" />
          </State>
          <State label="Bloqueada">
            <StepChip state="blocked" index={5} label="Revisão" />
          </State>
        </States>
      </Shot>
      <Shot title="Dica" tone="white" align="stretch">
        <States min={240} align="center">
          <State label="Bloqueada com motivo">
            <Tooltip open side="bottom" content={REVIEW_REASON}>
              <StepChip state="blocked" index={5} label="Revisão" />
            </Tooltip>
          </State>
          <State label="Nome escondido pela largura">
            <Tooltip open side="bottom" content="Canal + Público">
              <span className={x.stepChip} data-state="upcoming">
                <StepMarker state="upcoming" index={3} />
              </span>
            </Tooltip>
          </State>
          <State label="Nome escondido e motivo">
            <Tooltip open side="bottom" content={`Revisão · ${REVIEW_REASON}`}>
              <span className={x.stepChip} data-state="blocked">
                <StepMarker state="blocked" index={5} />
              </span>
            </Tooltip>
          </State>
        </States>
      </Shot>
      <Shot title="Salvamento" tone="white" align="stretch">
        <States min={200}>
          <State label="Salvo">
            <SaveIndicator status="saved" label="Salvo" detail="há 2 min" />
          </State>
          <State label="Salvando">
            <SaveIndicator status="saving" />
          </State>
          <State label="Não salvo">
            <SaveIndicator status="unsaved" />
          </State>
          <State label="Erro">
            <Row gap={12} wrap={false}>
              <SaveIndicator status="error" onRetry={() => undefined} />
            </Row>
          </State>
          <State label="Erro · hover">
            <Row gap={12} wrap={false}>
              <SaveIndicator status="error" onRetry={() => undefined} data-force="hover" />
            </Row>
          </State>
          <State label="Erro · foco">
            <Row gap={12} wrap={false}>
              <SaveIndicator status="error" onRetry={() => undefined} data-force="focus" />
            </Row>
          </State>
        </States>
      </Shot>
      <Shot title="Barra · motivo do bloqueio" tone="white" align="stretch">
        <States min={360}>
          <State label="Motivo antes dos botões">
            <ActionBar
              position="static"
              start="Artigo · 1,4 de 2 laudas · enviado por Juliana"
              detail="Quem enviou não aprova o próprio envio."
              detailId="motivo-barra"
            >
              <Button>Pedir ajustes</Button>
              <Button variant="primary" aria-disabled="true" aria-describedby="motivo-barra">
                Aprovar artigo
              </Button>
            </ActionBar>
          </State>
          <State label="Celular, 390">
            <Phone label="Celular, 390">
              <ActionBar
                position="static"
                detail="Aguarde a IA terminar."
                detailId="motivo-barra-celular"
              >
                <Button
                  variant="primary"
                  aria-disabled="true"
                  aria-describedby="motivo-barra-celular"
                >
                  Enviar para aprovação
                </Button>
              </ActionBar>
            </Phone>
          </State>
        </States>
      </Shot>
      <Shot title="Celular">
        <div className={x.phones}>
          <State label="Régua">
            <Phone label="Celular, 390">
              <div className={x.phoneCreation}>
                <div className={x.phoneCreationTitle}>
                  <h3>Nova campanha</h3>
                  <IconButton label="Cancelar" icon={X} variant="ghost" size="sm" />
                </div>
                <Stepper
                  steps={phoneSteps}
                  current={2}
                  size="sm"
                  label="Etapas da campanha, celular"
                  onStepSelect={() => undefined}
                />
              </div>
            </Phone>
          </State>
          <State label="Compacto">
            <Phone label="Celular, 390">
              <div className={x.phoneCreation}>
                <StepperCompact
                  steps={phoneSteps}
                  current={2}
                  showNext={false}
                  label="Progresso da campanha"
                  actions={<IconButton label="Cancelar" icon={X} variant="ghost" size="sm" />}
                />
              </div>
            </Phone>
          </State>
        </div>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Menu de opções ——————————————————————————— */

const DETAIL_MENU: MenuSection[] = [
  {
    items: [
      { label: 'Métricas', icon: ChartColumn },
      { label: 'Duplicar', icon: Copy },
    ],
  },
  {
    items: [
      { label: 'Cancelar campanha', icon: X },
      {
        label: 'Excluir',
        icon: Trash2,
        danger: true,
        onSelect: () =>
          toast('Campanha excluída', { action: { label: 'Desfazer', onClick: () => undefined } }),
      },
    ],
  },
];

const EXPORT_MENU: MenuSection[] = [
  {
    items: [
      { label: 'CSV', icon: FileText, onSelect: () => toast('17 campanhas exportadas em CSV') },
      {
        label: 'XLSX',
        icon: FileSpreadsheet,
        onSelect: () => toast('17 campanhas exportadas em XLSX'),
      },
    ],
  },
  {
    items: [
      {
        label: 'Copiar link da lista',
        icon: Link2,
        shortcut: '⌘L',
        onSelect: () => toast('Link copiado'),
      },
    ],
  },
];

const STATE_MENU: MenuSection[] = [
  {
    items: [
      { label: 'Editar', icon: Pencil },
      { label: 'Duplicar', icon: Copy, force: 'hover' },
      { label: 'Métricas', icon: ChartColumn, force: 'active' },
      { label: 'Fixar na lista', icon: Pin, checked: true },
      { label: 'Copiar link', icon: Link2, shortcut: '⌘L' },
      { label: 'Arquivar', icon: Archive, disabled: true, description: 'Campanha no ar' },
    ],
  },
  { items: [{ label: 'Excluir', icon: Trash2, danger: true }] },
];
const STATE_CAPTIONS = [
  'Repouso',
  'Hover',
  'Pressionado',
  'Marcado',
  'Com atalho',
  'Indisponível',
  'Destrutivo',
];

/** Painel parado com a legenda de cada linha alinhada ao centro do item (medido). */
function CaptionedMenu({ sections, captions }: { sections: MenuSection[]; captions: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tops, setTops] = useState<number[]>([]);
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const measure = () => {
      const base = root.getBoundingClientRect().top;
      setTops(
        [...root.querySelectorAll<HTMLElement>('[role^="menuitem"]')].map((el) => {
          const rect = el.getBoundingClientRect();
          return rect.top - base + rect.height / 2;
        }),
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={x.menuStates}>
      <MenuPanel label="Ações da campanha" width={248} sections={sections} />
      <ol className={x.menuCaptions} aria-hidden="true">
        {captions.map((caption, index) => (
          <li key={caption} style={{ top: tops[index] ?? 0, opacity: tops.length ? 1 : 0 }}>
            {caption}
          </li>
        ))}
      </ol>
    </div>
  );
}

function MenuSpecimen() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch">
        <div className={x.menuContexts}>
          <State label="Ações da campanha">
            <div className={x.menuHead}>
              <Button variant="primary">Pausar</Button>
              <Button>Concluir</Button>
              <Menu
                label="Mais ações"
                align="end"
                width={220}
                sections={DETAIL_MENU}
                trigger={(props) => <IconButton {...props} label="Mais ações" icon={Ellipsis} />}
              />
            </div>
          </State>
          <State label="Exportar">
            <div className={x.menuHead}>
              <Button variant="ghost" size="sm" icon={SlidersHorizontal}>
                Filtros
              </Button>
              <Menu
                label="Exportar"
                align="end"
                width={232}
                sections={EXPORT_MENU}
                trigger={(props) => (
                  <Button {...props} size="sm" icon={Download} trailingIcon={ChevronDown}>
                    Exportar
                  </Button>
                )}
              />
            </div>
          </State>
          <State label="Conta">
            <div className={x.accountStrip}>
              <SidebarAccount
                name="Marina Lopes"
                detail="Operação · Francal"
                sections={ACCOUNT_SECTIONS}
              />
            </div>
          </State>
        </div>
      </Shot>
      <Shot title="Estados">
        <CaptionedMenu sections={STATE_MENU} captions={STATE_CAPTIONS} />
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Menu de contexto ——————————————————————————— */

const LEAD_STAGES = ['Novo', 'Em contato', 'Qualificado', 'Proposta', 'Ganho'] as const;
type LeadStage = (typeof LEAD_STAGES)[number];
type Lead = {
  id: string;
  name: string;
  company: string;
  meta: string;
  when: string;
  stage: LeadStage;
};

const LEADS: Lead[] = [
  {
    id: 'l1',
    name: 'Juliana Prates',
    company: 'Bella Passo',
    meta: 'Estande B-\u2060214',
    when: 'há 2 h',
    stage: 'Em contato',
  },
  {
    id: 'l2',
    name: 'Tiago Rezende',
    company: 'Couro Nobre',
    meta: 'Rodada de negócios',
    when: 'há 5 h',
    stage: 'Em contato',
  },
  {
    id: 'l3',
    name: 'Clara Souto',
    company: 'Ateliê Sul',
    meta: 'Vitrine · Scarpin',
    when: 'ontem',
    stage: 'Qualificado',
  },
];
const BOARD: LeadStage[] = ['Em contato', 'Qualificado', 'Proposta'];

function leadMenu(lead: Lead, move: (stage: LeadStage) => void): MenuSection[] {
  return [
    {
      items: [
        { label: 'Abrir', icon: ExternalLink },
        {
          label: 'Mover para',
          icon: ArrowRightLeft,
          items: LEAD_STAGES.map((stage) => ({
            label: stage,
            checked: stage === lead.stage,
            onSelect: () => move(stage),
          })),
        },
        { label: 'Atribuir a…', icon: UserPlus },
        { label: 'Copiar link', icon: Link2, onSelect: () => toast('Link do lead copiado') },
      ],
    },
    {
      items: [
        {
          label: 'Arquivar',
          icon: Archive,
          danger: true,
          onSelect: () => toast(`Lead de ${lead.name} arquivado`),
        },
      ],
    },
  ];
}

/** Cartão de lead. Repassa eventos e classe (o `ContextMenu` injeta os dele no elemento). */
function LeadCard({
  lead,
  forceOpen = false,
  className = '',
  ...rest
}: { lead: Lead; forceOpen?: boolean } & HTMLAttributes<HTMLElement>) {
  return (
    <article
      {...rest}
      className={`${x.leadCard} ${className}`}
      tabIndex={0}
      aria-label={`${lead.name}, ${lead.company}`}
      data-force-open={forceOpen || undefined}
    >
      <div className={x.leadHead}>
        <Avatar name={lead.name} size="sm" decorative />
        <strong>{lead.name}</strong>
      </div>
      <span className={x.leadCompany}>
        <BrandMark name={lead.company} size="xs" variant="soft" decorative />
        {lead.company}
      </span>
      <span className={x.leadMeta}>
        <span>{lead.meta}</span>
        <span>{lead.when}</span>
      </span>
    </article>
  );
}

function LeadBoard() {
  const [leads, setLeads] = useState(LEADS);
  function move(lead: Lead, stage: LeadStage) {
    if (stage === lead.stage) return;
    const before = leads;
    setLeads((list) => list.map((item) => (item.id === lead.id ? { ...item, stage } : item)));
    toast(`Lead movido para ${stage}`, {
      action: { label: 'Desfazer', onClick: () => setLeads(before) },
    });
  }
  return (
    <div className={x.board}>
      {BOARD.map((column) => {
        const items = leads.filter((lead) => lead.stage === column);
        return (
          <section key={column} className={x.column} aria-label={column}>
            <header className={x.columnHead}>
              <strong>{column}</strong>
              <Count>{items.length}</Count>
            </header>
            <div className={x.columnBody}>
              {items.map((lead) => (
                <ContextMenu
                  key={lead.id}
                  label={`Ações do lead ${lead.name}`}
                  sections={leadMenu(lead, (stage) => move(lead, stage))}
                >
                  <LeadCard lead={lead} />
                </ContextMenu>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

const rowMenu = (row: Campaign): MenuSection[] => [
  {
    items: [
      { label: 'Abrir', icon: ExternalLink },
      { label: 'Métricas', icon: ChartColumn },
      {
        label: 'Duplicar',
        icon: Copy,
        onSelect: () => toast(`Cópia de #${row.id} criada como rascunho`),
      },
      { label: 'Copiar link', icon: Link2, onSelect: () => toast('Link da campanha copiado') },
    ],
  },
  {
    items: [
      row.bucket === 'veiculacao'
        ? {
            label: 'Excluir',
            icon: Trash2,
            danger: true,
            disabled: true,
            description: 'Campanha em veiculação',
          }
        : { label: 'Excluir', icon: Trash2, danger: true },
    ],
  },
];

function ContextSpecimen() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch">
        <div className={x.contextStack}>
          <LeadBoard />
          <div className={x.listCard} data-framed>
            <CampaignTable
              rows={CAMPAIGNS.slice(0, 3)}
              swapKey="ctx"
              rowProps={(row) => ({
                wrap: (tr) => (
                  <ContextMenu label={`Ações de ${row.name}`} sections={rowMenu(row)}>
                    {tr}
                  </ContextMenu>
                ),
              })}
            />
          </div>
        </div>
      </Shot>
      <Shot title="Celular">
        <Phone label="Celular, 390">
          <div className={x.phoneBody}>
            <header className={x.columnHead}>
              <strong>Em contato</strong>
              <Count>2</Count>
            </header>
            <div className={x.phoneLongPress}>
              <ContextMenu
                label="Ações do lead Juliana Prates"
                sections={leadMenu(LEADS[0] as Lead, () => undefined)}
              >
                <LeadCard lead={LEADS[0] as Lead} forceOpen />
              </ContextMenu>
              <div className={x.pressPanel}>
                <MenuPanel
                  label="Ações do lead"
                  width={232}
                  sections={leadMenu(LEADS[0] as Lead, () => undefined)}
                />
              </div>
            </div>
          </div>
        </Phone>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Paleta de comandos ——————————————————————————— */

const CAMPAIGN_ITEMS: CommandItem[] = CAMPAIGNS.filter((row) =>
  [2041, 2026, 2035, 2014].includes(row.id),
).map((row) => ({
  id: `c-${row.id}`,
  label: row.name,
  description: `#${row.id} · ${row.advertiser}`,
  keywords: `${row.id} ${row.asset}`,
  icon: Megaphone,
  trailing: <StatusDot tone={row.tone}>{row.status}</StatusDot>,
}));

const ADVERTISERS = ['Aurora Calçados', 'Estúdio Norte', 'Casa Forma', 'Lume Acessórios'];
const ADVERTISER_ITEMS: CommandItem[] = ADVERTISERS.map((name) => ({
  id: `a-${name}`,
  label: name,
  description: `${CAMPAIGNS.filter((row) => row.advertiser === name).length} campanhas`,
  leading: <BrandMark name={name} size="xs" variant="soft" decorative />,
}));

const PAGE_ITEMS: CommandItem[] = [
  { id: 'p-campanhas', label: 'Campanhas', description: 'Operação', icon: Megaphone },
  { id: 'p-pis', label: 'Pedidos de Inserção', description: 'Operação', icon: FileText },
  { id: 'p-leads', label: 'Leads', description: 'Operação', icon: UsersRound },
];

const COMMAND_GROUPS: CommandGroup[] = [
  { label: 'Páginas', items: PAGE_ITEMS },
  { label: 'Campanhas', items: CAMPAIGN_ITEMS },
  { label: 'Anunciantes', items: ADVERTISER_ITEMS },
  {
    label: 'Ações',
    showWhenEmpty: true,
    items: [
      {
        id: 'x-nova',
        label: 'Nova campanha',
        icon: Plus,
        hint: '⌘N',
        onSelect: () => toast('Nova campanha'),
      },
      { id: 'x-exportar', label: 'Exportar lista de campanhas', icon: Download },
    ],
  },
];
const RECENT: CommandItem[] = [CAMPAIGN_ITEMS[0], PAGE_ITEMS[2], ADVERTISER_ITEMS[0]].filter(
  (item): item is CommandItem => Boolean(item),
);

function CommandContext() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const trigger = (
    <>
      <Button
        size="sm"
        icon={Search}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-keyshortcuts="Meta+K Control+K"
        className={x.quickSearch}
      >
        Busca rápida
        <Kbd>⌘K</Kbd>
      </Button>
      <IconButton
        label="Busca rápida"
        icon={Search}
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={x.quickSearchIcon}
      />
    </>
  );
  return (
    <div className={x.barFrame}>
      <TopBar
        sticky={false}
        breadcrumb={[{ label: 'Operação' }, { label: 'Campanhas' }]}
        actions={trigger}
        notifications={<NotificationsButton count={3} sections={NOTIFICATIONS} />}
      />
      <div className={x.barPage}>
        <h2 className={x.pageTitle}>Campanhas</h2>
        <p className={x.pageSub}>17 de 17 campanhas do portal.</p>
      </div>
      <CommandPalette
        open={open}
        onClose={() => setOpen(false)}
        groups={COMMAND_GROUPS}
        recent={RECENT}
        placeholder="Buscar páginas, campanhas e anunciantes"
      />
    </div>
  );
}

function PaletteFrame({ children }: { children: ReactNode }) {
  return <div className={x.paletteFrame}>{children}</div>;
}

function CommandSpecimen() {
  return (
    <Shots>
      <Shot title="Em contexto" align="stretch" pad="sm">
        <CommandContext />
      </Shot>
      <Shot title="Busca “aurora”" pad="lg">
        <PaletteFrame>
          <CommandPanel
            groups={COMMAND_GROUPS}
            recent={RECENT}
            defaultQuery="aurora"
            label="Busca rápida, exemplo"
          />
        </PaletteFrame>
      </Shot>
      <Shot title="Estados" align="stretch">
        <States min={300}>
          <State label="Recentes">
            <Top>
              <PaletteFrame>
                <CommandPanel
                  groups={COMMAND_GROUPS}
                  recent={RECENT}
                  placeholder="Buscar no portal"
                  label="Busca rápida, recentes"
                />
              </PaletteFrame>
            </Top>
          </State>
          <State label="Sem resultado">
            <Top>
              <PaletteFrame>
                <CommandPanel
                  groups={COMMAND_GROUPS}
                  defaultQuery="pavilhão verde"
                  label="Busca rápida, sem resultado"
                />
              </PaletteFrame>
            </Top>
          </State>
          <State label="Buscando">
            <Top>
              <PaletteFrame>
                <CommandPanel
                  groups={COMMAND_GROUPS}
                  defaultQuery="2041"
                  loading
                  label="Busca rápida, buscando"
                />
              </PaletteFrame>
            </Top>
          </State>
        </States>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Seletor de portal ——————————————————————————— */

const PORTAL_ROWS: Record<string, Campaign[]> = {
  'francal-2026': CAMPAIGNS.slice(0, 3),
  'francal-2025': [
    {
      id: 1876,
      name: 'Coleção Outono-Inverno no portal',
      advertiser: 'Aurora Calçados',
      asset: 'Banner Super Topo — Portal',
      status: 'Concluída',
      tone: 'gray',
      bucket: 'encerradas',
      budget: 16000,
      period: '01/07 – 31/07',
    },
    {
      id: 1862,
      name: 'Newsletter de lançamentos',
      advertiser: 'Estúdio Norte',
      asset: 'E-mail marketing dedicado',
      status: 'Concluída',
      tone: 'gray',
      bucket: 'encerradas',
      budget: 7500,
      period: '05/07 – 20/07',
    },
    {
      id: 1840,
      name: 'Painel de LED — abertura',
      advertiser: 'Bella Passo',
      asset: 'Painel de LED — Pavilhão Azul',
      status: 'Concluída',
      tone: 'gray',
      bucket: 'encerradas',
      budget: 18000,
      period: '14/07 – 17/07',
    },
  ],
  'couro-sul-2027': [],
};

/** Pendências por portal no menu: o portal encerrado e o em montagem não têm nada a tratar. */
const PORTAL_COUNTS: Record<string, { campanhas?: number; leads?: number }> = {
  'francal-2026': { campanhas: 5, leads: 2 },
  'francal-2025': {},
  'couro-sul-2027': {},
};

function navFor(portal: string): NavGroup[] {
  const counts = PORTAL_COUNTS[portal] ?? {};
  return SHORT_GROUPS.map((group) => ({
    ...group,
    items: group.items.map((item) =>
      item.id === 'campanhas' || item.id === 'leads'
        ? { ...item, count: counts[item.id] || undefined }
        : item,
    ),
  }));
}

function PortalContext() {
  const [portal, setPortal] = useState('francal-2026');
  const [persona, setPersona] = useState('operador');
  const portals = PORTALS.map((item) =>
    persona === 'anunciante' ? { ...item, detail: 'Aurora Calçados' } : item,
  );
  const rows = PORTAL_ROWS[portal] ?? [];
  const fair = (PORTALS.find((item) => item.id === portal)?.name ?? 'Francal').replace(
    /\s\d{4}$/,
    '',
  );
  return (
    <div className={x.shellFrame} style={{ height: 460 }}>
      <AppShell
        fill
        breakpoint={720}
        defaultNavOpen
        contentAs="div"
        sidebar={
          <Sidebar
            switcher={
              <PortalSwitcher
                portals={portals}
                value={portal}
                onChange={setPortal}
                action={MANAGE_PORTALS}
              />
            }
            groups={navFor(portal)}
            active="campanhas"
            account={
              <SidebarAccount
                name="Marina Lopes"
                detail={`Operação · ${fair}`}
                sections={ACCOUNT_SECTIONS}
              />
            }
          />
        }
        topbar={
          <TopBar
            breadcrumb={
              persona === 'anunciante'
                ? [{ label: 'Campanhas' }]
                : [{ label: 'Operação' }, { label: 'Campanhas' }]
            }
            actions={<PersonaSelect value={persona} onChange={setPersona} />}
          />
        }
      >
        <div key={portal} className={x.portalSwap}>
          <h2 className={x.pageTitle}>Campanhas</h2>
          {rows.length ? (
            <CampaignTable rows={rows} swapKey={portal} compact />
          ) : (
            <div className={x.emptyPortal}>
              <strong>Nenhuma campanha ainda</strong>
              <Button variant="primary" size="sm" icon={Plus}>
                Nova campanha
              </Button>
            </div>
          )}
        </div>
      </AppShell>
    </div>
  );
}

function IdentityStrip({ children, width = 236 }: { children: ReactNode; width?: number }) {
  return (
    <div className={x.identityStrip} style={{ width }}>
      {children}
    </div>
  );
}

function PortalSpecimen() {
  const noop = () => undefined;
  return (
    <Shots>
      <Shot title="Em contexto" align="stretch" pad="sm">
        <PortalContext />
      </Shot>
      <Shot title="Estados" tone="white" align="stretch">
        <States min={400}>
          <State label="Repouso">
            <IdentityStrip>
              <PortalSwitcher portals={PORTALS} value="francal-2026" onChange={noop} />
            </IdentityStrip>
          </State>
          <State label="Hover">
            <IdentityStrip>
              <PortalSwitcher
                portals={PORTALS}
                value="francal-2026"
                onChange={noop}
                force="hover"
              />
            </IdentityStrip>
          </State>
          <State label="Aberto">
            <div className={x.portalOpen}>
              <IdentityStrip>
                <PortalSwitcher
                  portals={PORTALS}
                  value="francal-2026"
                  onChange={noop}
                  force="hover"
                />
              </IdentityStrip>
              <MenuPanel
                label="Trocar de portal"
                width={260}
                sections={[
                  {
                    label: 'Portais',
                    items: PORTALS.map((portal) => ({
                      label: portal.name,
                      description: portal.period,
                      leading: <BrandMark name={portal.name} size="xs" variant="soft" decorative />,
                      checked: portal.id === 'francal-2026',
                      muted: portal.status === 'archived' || undefined,
                      meta:
                        portal.statusLabel ??
                        (portal.status === 'archived' ? 'Encerrado' : undefined),
                    })),
                  },
                  { items: [MANAGE_PORTALS] },
                ]}
              />
            </div>
          </State>
          <State label="Recolhido">
            <div className={x.railStrip} data-top>
              <AppShell
                fill
                collapsed
                layout="desktop"
                contentAs="div"
                sidebar={
                  <Sidebar
                    switcher={
                      <PortalSwitcher portals={PORTALS} value="francal-2026" onChange={noop} peek />
                    }
                    groups={[]}
                  />
                }
              >
                {null}
              </AppShell>
            </div>
          </State>
        </States>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Registro ——————————————————————————— */

function withToaster(Component: ComponentType) {
  function Specimen() {
    return (
      <>
        <Component />
        <EnsureToaster />
      </>
    );
  }
  Specimen.displayName = `Navegacao(${Component.name})`;
  return Specimen;
}

/** Pranchas do grupo Navegação (id do inventário → componente). */
export const specimens: Record<string, ComponentType> = {
  sidebar: withToaster(SidebarSpecimen),
  'cabecalho-app': withToaster(HeaderSpecimen),
  breadcrumbs: withToaster(BreadcrumbsSpecimen),
  tabs: withToaster(TabsSpecimen),
  paginacao: withToaster(PaginationSpecimen),
  stepper: withToaster(StepperSpecimen),
  'menu-dropdown': withToaster(MenuSpecimen),
  'menu-contexto': withToaster(ContextSpecimen),
  comandos: withToaster(CommandSpecimen),
  'troca-portal': withToaster(PortalSpecimen),
};

/** Compatibilidade com o índice antigo do catálogo. */
export const MenuOpcoes = specimens['menu-dropdown'] as ComponentType;
