'use client';

import {
  ArrowLeft,
  ArrowRight,
  Ban,
  Bell,
  Bookmark,
  ChartColumn,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Copy,
  Download,
  Ellipsis,
  Eye,
  FileText,
  Handshake,
  LayoutList,
  Link2,
  ListFilter,
  Mail,
  Menu as MenuIcon,
  MonitorSmartphone,
  Newspaper,
  Pencil,
  Plus,
  Presentation,
  Rows3,
  Send,
  Trash2,
  UserPlus,
} from 'lucide-react';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import {
  Badge,
  Button,
  ButtonGroup,
  ChoiceCard,
  DataTable,
  DateRangePicker,
  Dialog,
  IconButton,
  Menu,
  MenuPanel,
  SearchField,
  Segmented,
  Tabs,
  Textarea,
  Tooltip,
  VisuallyHidden,
  type Column,
  type MenuSection,
  type Tone,
} from '@content-ventures/design-system/v3';
import { ButtonLink, SplitButton } from '@content-ventures/design-system/v3/button';
import { LinkButton, TextLink } from '@content-ventures/design-system/v3/link';
import { RowActions, type RowAction } from '@content-ventures/design-system/v3/row-actions';
import { Select } from '@content-ventures/design-system/v3/select';
import { Toaster, toast } from '@content-ventures/design-system/v3/toast';
import { ToggleButton, ToggleGroup } from '@content-ventures/design-system/v3/toggle';
import { Shot, Shots, State, States } from '../stage';
import x from './acoes.module.css';

/* ——————————————————————————— Dados fictícios ——————————————————————————— */

type StatusKey = 'live' | 'adjust' | 'done' | 'draft';
const STATUS: Record<StatusKey, { label: string; tone: Tone; live?: boolean }> = {
  live: { label: 'Veiculando', tone: 'green', live: true },
  adjust: { label: 'Ajustes solicitados', tone: 'orange' },
  done: { label: 'Concluída', tone: 'gray' },
  draft: { label: 'Rascunho', tone: 'gray' },
};
const EDITABLE: StatusKey[] = ['adjust', 'draft'];
const LIVE_DELETE = 'Campanha no ar não pode ser excluída';

type Campaign = {
  id: string;
  name: string;
  asset: string;
  advertiser: string;
  status: StatusKey;
  budget: string;
  period: string;
};
const CAMPAIGNS: Campaign[] = [
  {
    id: '2041',
    name: 'Coleção Primavera-Verão no portal',
    asset: 'Banner Super Topo — Portal',
    advertiser: 'Aurora Calçados',
    status: 'live',
    budget: 'R$ 18.000,00',
    period: '01/10 – 31/10',
  },
  {
    id: '2029',
    name: 'Retargeting de credenciados',
    asset: 'Banner Super Topo — Portal',
    advertiser: 'Grupo Horizonte',
    status: 'adjust',
    budget: 'R$ 13.500,00',
    period: '01/10 – 31/10',
  },
  {
    id: '2020',
    name: 'Guia oficial do visitante',
    asset: 'E-mail marketing dedicado',
    advertiser: 'Pátio Couro',
    status: 'done',
    budget: 'R$ 12.000,00',
    period: '15/09 – 30/09',
  },
  {
    id: '2014',
    name: 'Carrossel de tendências',
    asset: 'Post patrocinado no Instagram oficial',
    advertiser: 'Aurora Calçados',
    status: 'draft',
    budget: 'R$ 6.500,00',
    period: '05/10 – 12/10',
  },
];
const byId = (id: string) => CAMPAIGNS.find((campaign) => campaign.id === id) ?? CAMPAIGNS[0]!;

const noop = () => undefined;
type Force = Pick<ComponentProps<'button'>, 'disabled'> & { 'data-force'?: string; loading?: boolean };
const STATES: { label: string; props: Force }[] = [
  { label: 'Repouso', props: {} },
  { label: 'Hover', props: { 'data-force': 'hover' } },
  { label: 'Pressionado', props: { 'data-force': 'hover active' } },
  { label: 'Foco', props: { 'data-force': 'focus' } },
  { label: 'Carregando', props: { loading: true } },
  { label: 'Indisponível', props: { disabled: true } },
];

/* ——————————————————————————— Peças de prancha ——————————————————————————— */

type MatrixRow = { label: string; cells: ReactNode[] };

/**
 * Matriz de estados parados: colunas legendadas, linhas por variante. Inerte (nada de Tab
 * passando por 30 botões parados). No celular vira grade de 2 com legenda em cada célula.
 */
function Matrix({
  columns,
  rows,
  align = 'center',
  head = true,
  compact = false,
  colWidth,
}: {
  columns: string[];
  rows: MatrixRow[];
  align?: 'center' | 'start';
  head?: boolean;
  /** No celular, a linha vira uma fileira só, sem legenda por célula (amostras autoexplicativas). */
  compact?: boolean;
  /** Largura fixa das colunas: matrizes vizinhas com 2 e 3 colunas alinham no mesmo x. */
  colWidth?: number;
}) {
  return (
    <div
      className={x.matrix}
      data-align={align}
      data-head={head || undefined}
      data-compact={compact || undefined}
      style={{ '--cols': columns.length, '--col-w': colWidth ? `${colWidth}px` : undefined } as CSSProperties}
      inert
    >
      {head && (
        <div className={x.mRow} data-head>
          <span aria-hidden="true" />
          {columns.map((column) => (
            <span key={column} className={x.mHead}>
              {column}
            </span>
          ))}
        </div>
      )}
      {rows.map((row, index) => (
        <div key={row.label || index} className={x.mRow}>
          <span className={x.mLabel}>{row.label}</span>
          {row.cells.map((cell, cellIndex) => (
            <span key={columns[cellIndex] ?? cellIndex} className={x.mCell} data-caption={columns[cellIndex]}>
              {cell}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Nome da campanha + ativo e número na linha de apoio (igual à lista do dashboard). */
function NameCell({ campaign }: { campaign: Campaign }) {
  return (
    <span className={x.nameCell}>
      <span className={x.name} title={campaign.name}>
        {campaign.name}
      </span>
      <span className={x.sub}>
        <span className={x.subAsset}>{campaign.asset}</span>
        <span>#{campaign.id}</span>
      </span>
    </span>
  );
}

function StatusText({ status, size }: { status: StatusKey; size?: 'sm' }) {
  const item = STATUS[status];
  return (
    <Badge variant="text" size={size} tone={item.tone} live={item.live}>
      {item.label}
    </Badge>
  );
}

/** Corpo do cartão de campanha no celular: nome, status · anunciante, verba · período. */
function CardBody({ campaign }: { campaign: Campaign }) {
  return (
    <div className={x.cardMain}>
      <span className={x.cardName}>{campaign.name}</span>
      <span className={x.cardMeta}>
        <StatusText status={campaign.status} size="sm" />
        <span className={x.cardAdvertiser}>{campaign.advertiser}</span>
      </span>
      <span className={x.cardMeta}>
        <span>{campaign.budget}</span>
        <span>{campaign.period}</span>
      </span>
    </div>
  );
}

/** Ações fixas de uma campanha: Métricas, Editar (só se editável), Excluir (nunca no ar). */
function campaignActions(campaign: Campaign, onDelete: (campaign: Campaign) => void = noop): RowAction[] {
  const live = campaign.status === 'live';
  return [
    { id: 'metrics', label: 'Métricas', icon: ChartColumn, onSelect: noop },
    { id: 'edit', label: 'Editar', icon: Pencil, onSelect: noop, hidden: !EDITABLE.includes(campaign.status) },
    {
      id: 'delete',
      label: 'Excluir',
      icon: Trash2,
      danger: true,
      disabled: live,
      hint: LIVE_DELETE,
      onSelect: () => onDelete(campaign),
    },
  ];
}

type RowsView = 'table' | 'cards';

/**
 * Excluir com confirmação e “Desfazer”, para a tabela e para os cartões do celular (a mesma lista).
 * O foco nunca cai no vazio: depois de excluir vai para o “Excluir” de quem tomou o lugar (ou da
 * linha anterior, se era a última); depois de desfazer, para a primeira ação da linha restaurada.
 */
function useCampaignDelete(initial: Campaign[]) {
  const [rows, setRows] = useState(initial);
  const [target, setTarget] = useState<{ campaign: Campaign; view: RowsView } | null>(null);
  const [shown, setShown] = useState<Campaign | null>(null);
  const [exiting, setExiting] = useState<ReadonlySet<string>>(() => new Set());
  const [entering, setEntering] = useState<string | null>(null);
  const scope = useId();
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  function focusRow(view: RowsView, id: string | undefined, prefer: 'delete' | 'first', tries = 16) {
    if (!id) return;
    const row = document.querySelector(`[data-rows-scope="${scope}-${view}"] [data-key="${id}"]`);
    const actions = row?.querySelector('[data-row-actions]');
    const button =
      (prefer === 'delete' ? actions?.querySelector<HTMLElement>('button[aria-label="Excluir"]') : null) ??
      actions?.querySelector<HTMLElement>('button');
    button?.focus();
    // Enquanto a confirmação ainda fecha, o resto da página é inerte e o foco não pega: tenta de
    // novo no próximo quadro (só se o foco estiver solto ou ainda na camada).
    const now = document.activeElement;
    const loose = !now || now === document.body || Boolean(now.closest('dialog'));
    if (button && now !== button && loose && tries > 0) {
      requestAnimationFrame(() => focusRow(view, id, prefer, tries - 1));
    }
  }

  function ask(campaign: Campaign, view: RowsView) {
    setShown(campaign);
    setTarget({ campaign, view });
  }

  function restore(campaign: Campaign, view: RowsView) {
    const order = CAMPAIGNS.map((row) => row.id);
    flushSync(() => {
      setRows((list) =>
        list.some((row) => row.id === campaign.id)
          ? list
          : [...list, campaign].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)),
      );
      setEntering(campaign.id);
    });
    focusRow(view, campaign.id, 'first');
    later(() => setEntering((value) => (value === campaign.id ? null : value)), 320);
  }

  function confirm() {
    if (!target) return;
    const { campaign, view } = target;
    setTarget(null);
    setExiting((set) => new Set(set).add(campaign.id));
    later(() => {
      const index = rows.findIndex((row) => row.id === campaign.id);
      const rest = rows.filter((row) => row.id !== campaign.id);
      const next = (rest[index] ?? rest[index - 1])?.id;
      flushSync(() => {
        setRows((list) => list.filter((row) => row.id !== campaign.id));
        setExiting((set) => {
          const copy = new Set(set);
          copy.delete(campaign.id);
          return copy;
        });
      });
      focusRow(view, next, 'delete');
      toast('Campanha excluída', { action: { label: 'Desfazer', onClick: () => restore(campaign, view) } });
    }, 200);
  }

  const dialog = (
    <Dialog
      open={target !== null}
      onClose={() => setTarget(null)}
      size="sm"
      divided={false}
      title="Excluir campanha?"
      description={shown ? `${shown.name} · #${shown.id}` : undefined}
      footer={
        <>
          <Button onClick={() => setTarget(null)}>Cancelar</Button>
          <Button variant="danger" onClick={confirm}>
            Excluir campanha
          </Button>
        </>
      }
    />
  );

  return {
    rows,
    exiting,
    entering,
    ask,
    dialog,
    scopeOf: (view: RowsView) => ({ 'data-rows-scope': `${scope}-${view}` }),
  };
}

/** Colunas da lista: Campanha, Status, Verba e as ações. Status e Verba saem em ≤760 (CSS). */
function campaignColumns(
  onDelete: (campaign: Campaign) => void,
  wrap: (campaign: Campaign, node: ReactNode) => ReactNode = (_, node) => node,
): Column<Campaign>[] {
  return [
    { key: 'name', header: 'Campanha', render: (campaign) => wrap(campaign, <NameCell campaign={campaign} />) },
    {
      key: 'status',
      header: 'Status',
      width: 176,
      render: (campaign) => wrap(campaign, <StatusText status={campaign.status} />),
    },
    { key: 'budget', header: 'Verba', width: 128, numeric: true, render: (campaign) => wrap(campaign, campaign.budget) },
    {
      key: 'actions',
      header: <VisuallyHidden>Ações</VisuallyHidden>,
      align: 'end',
      width: 124,
      render: (campaign) =>
        wrap(campaign, <RowActions label={`Ações de ${campaign.name}`} actions={campaignActions(campaign, onDelete)} />),
    },
  ];
}

/** Sino do topo: fantasma 32 com ponto azul de 6 px quando há novidade. */
function NotificationsBell() {
  return (
    <Menu
      label="Notificações"
      align="end"
      width={312}
      sections={[
        {
          label: 'Hoje',
          items: [
            { label: 'P.I. 2026-0400 assinado', description: 'Aurora Calçados · há 2 h', icon: FileText },
            { label: 'Ajustes solicitados em #2029', description: 'Grupo Horizonte · há 5 h', icon: Pencil },
          ],
        },
      ]}
      trigger={(props) => (
        <span className={x.bell}>
          <Tooltip content="Notificações">
            <IconButton {...props} label="Notificações" icon={Bell} variant="ghost" size="sm" />
          </Tooltip>
          <i aria-hidden="true" />
        </span>
      )}
    />
  );
}

function Crumbs({ items }: { items: string[] }) {
  return (
    <nav className={x.crumbs} aria-label="Você está em">
      {items.map((item, index) => (
        <span key={item} aria-current={index === items.length - 1 ? 'page' : undefined}>
          {item}
        </span>
      ))}
    </nav>
  );
}

/* ——————————————————————————— Botão ——————————————————————————— */

const TOTAL_STEPS = 6;
const WAIT_MS = 800;

/** Rodapé fixo da criação: estado salvo à esquerda; quatro slots fixos à direita. */
function CreationFooter() {
  const [step, setStep] = useState(2);
  const [state, setState] = useState<'dirty' | 'saved' | 'sent'>('dirty');
  const [busy, setBusy] = useState<'next' | 'draft' | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const last = step === TOTAL_STEPS;

  function run(kind: 'next' | 'draft', after: () => void) {
    setBusy(kind);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setBusy(null);
      after();
    }, WAIT_MS);
  }

  return (
    <div className={x.footer} role="region" aria-label="Ações da campanha">
      <div className={x.footStatus} aria-live="polite">
        <span key={state} className={x.saveState} data-state={state}>
          {state === 'dirty' ? <i aria-hidden="true" /> : <Check aria-hidden="true" />}
          {state === 'dirty' ? 'Alterações não salvas' : state === 'saved' ? 'Rascunho salvo agora' : 'Enviada para aprovação'}
        </span>
        <span key={step} className={x.stepCount}>
          Etapa {step} de {TOTAL_STEPS}
        </span>
      </div>
      <div className={x.footButtons}>
        <Button
          variant="ghost"
          className={x.footCancel}
          onClick={() => {
            setStep(1);
            setState('dirty');
          }}
        >
          Cancelar
        </Button>
        <Button
          variant="ghost"
          className={x.footDraft}
          loading={busy === 'draft'}
          data-hidden={last || undefined}
          aria-hidden={last || undefined}
          tabIndex={last ? -1 : undefined}
          onClick={() => run('draft', () => setState('saved'))}
        >
          Salvar rascunho
        </Button>
        <Button
          icon={ArrowLeft}
          className={x.footBack}
          aria-label="Voltar"
          // Focável mesmo indisponível: voltar até a etapa 1 não derruba o foco no <body>.
          aria-disabled={step === 1 || busy === 'next' || undefined}
          onClick={() => {
            setStep((value) => Math.max(1, value - 1));
            setState((value) => (value === 'sent' ? 'saved' : value));
          }}
        >
          <span className={x.backText}>Voltar</span>
        </Button>
        <span className={x.primarySlot}>
          {last ? (
            <Button variant="primary" icon={Send} loading={busy === 'next'} onClick={() => run('next', () => setState('sent'))}>
              Enviar para aprovação
            </Button>
          ) : (
            <Button
              variant="primary"
              trailingIcon={ArrowRight}
              loading={busy === 'next'}
              onClick={() =>
                run('next', () => {
                  setStep((value) => Math.min(TOTAL_STEPS, value + 1));
                  setState('saved');
                })
              }
            >
              Continuar
            </Button>
          )}
        </span>
      </div>
    </div>
  );
}

const DETAIL_MENU: MenuSection[] = [
  {
    items: [
      { label: 'Duplicar campanha', icon: Copy },
      { label: 'Baixar P.I.', icon: Download },
    ],
  },
  { items: [{ label: 'Cancelar campanha', icon: Ban, danger: true }] },
];

/** Cabeçalho do detalhe: um primário (avanço), secundário sem ícone e “⋯” de 36. */
function DetailHeader() {
  const [paused, setPaused] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <header className={x.detailHead}>
      <div className={x.detailTitles}>
        <div className={x.titleRow}>
          <h4 className={x.pageTitle}>Coleção Primavera-Verão no portal</h4>
          <StatusText status={paused ? 'done' : 'live'} />
        </div>
        <p className={x.meta}>
          <span>#2041</span>
          <span>Aurora Calçados</span>
          <span>Banner Super Topo — Portal</span>
          <span>01/10 – 31/10</span>
        </p>
      </div>
      <div className={x.headActions}>
        <Button
          variant="primary"
          loading={busy}
          onClick={() => {
            setBusy(true);
            timer.current = window.setTimeout(() => {
              setBusy(false);
              setPaused((value) => !value);
            }, WAIT_MS);
          }}
        >
          {paused ? 'Retomar' : 'Pausar'}
        </Button>
        <Button>Concluir</Button>
        <Menu
          label="Mais ações"
          align="end"
          sections={DETAIL_MENU}
          trigger={(props) => (
            <Tooltip content="Mais ações">
              <IconButton {...props} label="Mais ações" icon={Ellipsis} />
            </Tooltip>
          )}
        />
      </div>
    </header>
  );
}

function Botoes() {
  return (
    <Shots>
      <Shot title="Em contexto" align="stretch">
        <div className={x.stack}>
          <div className={`${x.frame} ${x.footerFrame}`}>
            <CreationFooter />
          </div>
          <div className={x.frame}>
            <DetailHeader />
          </div>
        </div>
      </Shot>

      <Shot title="Variantes" tone="white" align="stretch">
        <div className={x.stackLg}>
          <Matrix
            align="start"
            compact
            colWidth={232}
            columns={['Texto', 'Com ícone']}
            rows={[
              {
                label: 'Principal',
                cells: [
                  <Button key="a" variant="primary">
                    Enviar para aprovação
                  </Button>,
                  <Button key="b" variant="primary" icon={Plus}>
                    Nova campanha
                  </Button>,
                ],
              },
              {
                label: 'Secundário',
                cells: [
                  <Button key="a">Concluir</Button>,
                  <Button key="b" icon={Download}>
                    Exportar CSV
                  </Button>,
                ],
              },
              {
                label: 'Fantasma',
                cells: [
                  <Button key="a" variant="ghost">
                    Cancelar
                  </Button>,
                  <Button key="b" variant="ghost" icon={Copy}>
                    Duplicar
                  </Button>,
                ],
              },
              {
                label: 'Suave',
                cells: [
                  <Button key="a" variant="soft">
                    Reenviar convite
                  </Button>,
                  <Button key="b" variant="soft" icon={UserPlus}>
                    Convidar anunciante
                  </Button>,
                ],
              },
              {
                label: 'Destrutivo',
                cells: [
                  <Button key="a" variant="danger">
                    Excluir campanha
                  </Button>,
                  <Button key="b" variant="danger" icon={Trash2}>
                    Excluir 2 campanhas
                  </Button>,
                ],
              },
              {
                label: 'Destrutivo suave',
                cells: [
                  <Button key="a" variant="danger-soft">
                    Rejeitar P.I.
                  </Button>,
                  <Button key="b" variant="danger-soft" icon={Ban}>
                    Cancelar campanha
                  </Button>,
                ],
              },
            ]}
          />
          <Matrix
            align="start"
            colWidth={232}
            columns={['sm · 32', 'md · 36', 'lg · 40']}
            rows={[
              {
                label: 'Tamanhos',
                cells: (['sm', 'md', 'lg'] as const).map((size) => (
                  <Button key={size} variant="primary" size={size} icon={Send}>
                    Enviar
                  </Button>
                )),
              },
              {
                label: '',
                cells: (['sm', 'md', 'lg'] as const).map((size) => (
                  <Button key={size} size={size} icon={Download}>
                    Exportar
                  </Button>
                )),
              },
            ]}
          />
        </div>
      </Shot>

      <Shot title="Estados" tone="white" align="stretch">
        <Matrix
          columns={STATES.map((state) => state.label)}
          rows={[
            {
              label: 'Principal',
              cells: STATES.map((state) => (
                <Button key={state.label} variant="primary" trailingIcon={ArrowRight} {...state.props}>
                  Continuar
                </Button>
              )),
            },
            {
              label: 'Secundário',
              cells: STATES.map((state) => (
                <Button key={state.label} icon={ArrowLeft} {...state.props}>
                  Voltar
                </Button>
              )),
            },
            {
              label: 'Fantasma',
              cells: STATES.map((state) => (
                <Button key={state.label} variant="ghost" {...state.props}>
                  Salvar rascunho
                </Button>
              )),
            },
            {
              label: 'Destrutivo',
              cells: STATES.map((state) => (
                <Button key={state.label} variant="danger" icon={Trash2} {...state.props}>
                  Excluir
                </Button>
              )),
            },
          ]}
        />
      </Shot>

      <Shot title="Celular" align="center">
        <div className={x.phone}>
          <div className={x.phoneTop}>
            <IconButton label="Abrir menu" icon={MenuIcon} variant="ghost" size="sm" className={x.phoneMenu} />
            <Crumbs items={['Operação', 'Campanhas']} />
            <NotificationsBell />
          </div>
          <div className={x.phoneBody}>
            <div className={x.phoneHead}>
              <h4 className={x.phoneTitle}>Campanhas</h4>
              <p className={x.phoneSub}>17 de 17 campanhas do portal.</p>
            </div>
            <Button variant="primary" icon={Plus} className={x.full}>
              Nova campanha
            </Button>
            <PhoneTabs />
          </div>
          <ul className={x.cards}>
            {[byId('2041'), byId('2029')].map((campaign) => (
              <li key={campaign.id} className={x.card} data-plain>
                <CardBody campaign={campaign} />
              </li>
            ))}
          </ul>
        </div>
      </Shot>
    </Shots>
  );
}

function PhoneTabs() {
  const [tab, setTab] = useState<'todas' | 'veiculacao' | 'aprovacao'>('todas');
  return (
    <Tabs
      label="Recortes por status"
      value={tab}
      onChange={setTab}
      items={[
        { value: 'todas', label: 'Todas', count: 17 },
        { value: 'veiculacao', label: 'Em veiculação', count: 6 },
        { value: 'aprovacao', label: 'Em aprovação', count: 5 },
      ]}
    />
  );
}

/* ——————————————————————————— Botão de ícone ——————————————————————————— */

function BotaoIcone() {
  const [saved, setSaved] = useState(true);
  const list = useCampaignDelete([byId('2041'), byId('2029'), byId('2020')]);
  return (
    <Shots>
      <Shot title="Em contexto" align="stretch">
        <div className={x.stack}>
          <div className={x.frame}>
            <div className={x.topbar}>
              <Crumbs items={['Operação', 'Campanhas']} />
              <NotificationsBell />
            </div>
            <div className={x.frameBody}>
              <div className={x.tableWrap} {...list.scopeOf('table')}>
                <DataTable
                  label="Campanhas"
                  rows={list.rows}
                  rowKey={(row) => row.id}
                  columns={campaignColumns((campaign) => list.ask(campaign, 'table'))}
                  density="compact"
                  fixed
                  exiting={list.exiting}
                />
              </div>
            </div>
          </div>
          <div className={x.frame}>
            <header className={x.detailHead}>
              <div className={x.detailTitles}>
                <div className={x.titleRow}>
                  <h4 className={x.pageTitle}>Guia oficial do visitante</h4>
                  <StatusText status="done" />
                </div>
                <p className={x.meta}>
                  <span>#2020</span>
                  <span>Pátio Couro</span>
                  <span>E-mail marketing dedicado</span>
                  <span>15/09 – 30/09</span>
                </p>
              </div>
              <div className={x.headActions}>
                <Button icon={Download}>Baixar relatório</Button>
                <Menu
                  label="Mais ações"
                  align="end"
                  sections={[
                    {
                      items: [
                        { label: 'Ver métricas', icon: ChartColumn },
                        { label: 'Duplicar campanha', icon: Copy },
                      ],
                    },
                    { items: [{ label: 'Excluir campanha', icon: Trash2, danger: true }] },
                  ]}
                  trigger={(props) => (
                    <Tooltip content="Mais ações">
                      <IconButton {...props} label="Mais ações" icon={Ellipsis} />
                    </Tooltip>
                  )}
                />
              </div>
            </header>
          </div>
        </div>
        {list.dialog}
        <Toaster />
      </Shot>

      <Shot title="Variantes" tone="white" align="stretch">
        <States columns={5} align="center">
          <State label="Fantasma · 32">
            <Tooltip content="Editar">
              <IconButton label="Editar" icon={Pencil} variant="ghost" size="sm" />
            </Tooltip>
          </State>
          <State label="Fantasma · 36">
            <Tooltip content="Duplicar">
              <IconButton label="Duplicar" icon={Copy} variant="ghost" />
            </Tooltip>
          </State>
          <State label="Contorno · 36">
            <Tooltip content="Mais ações">
              <IconButton label="Mais ações" icon={Ellipsis} />
            </Tooltip>
          </State>
          <State label="Destrutivo · 32">
            <Tooltip content="Excluir">
              <IconButton label="Excluir" icon={Trash2} variant="ghost" size="sm" tone="danger" />
            </Tooltip>
          </State>
          <State label="Alternável · 36">
            <Tooltip content={saved ? 'Salvo' : 'Salvar'}>
              <IconButton
                label="Salvar"
                icon={Bookmark}
                variant="ghost"
                aria-pressed={saved}
                fillPressed
                onClick={() => setSaved((value) => !value)}
              />
            </Tooltip>
          </State>
        </States>
      </Shot>

      <Shot title="Estados" tone="white" align="stretch">
        <div className={x.stackLg}>
          <Matrix
            columns={['Repouso', 'Linha em hover', 'Hover', 'Pressionado', 'Foco', 'Indisponível', 'Toque']}
            rows={[
              {
                label: 'Fantasma',
                cells: iconStateCells({ id: 'edit', label: 'Editar', icon: Pencil }),
              },
              {
                label: 'Destrutivo',
                cells: iconStateCells({ id: 'delete', label: 'Excluir', icon: Trash2, danger: true }),
              },
              {
                label: 'Contorno',
                cells: [
                  <IconButton key="r" label="Mais ações" icon={Ellipsis} />,
                  <span key="row" className={x.none}>
                    —
                  </span>,
                  <IconButton key="h" label="Mais ações" icon={Ellipsis} data-force="hover" />,
                  <IconButton key="a" label="Mais ações" icon={Ellipsis} data-force="hover active" />,
                  <IconButton key="f" label="Mais ações" icon={Ellipsis} data-force="focus" />,
                  <IconButton key="d" label="Mais ações" icon={Ellipsis} disabled />,
                  <span key="t" className={x.touch} data-size="md">
                    <IconButton label="Mais ações" icon={Ellipsis} />
                  </span>,
                ],
              },
            ]}
          />
          <div className={x.openRow} inert>
            <Tooltip open side="bottom" content={LIVE_DELETE}>
              <RowActions
                label="Excluir"
                actions={[
                  { id: 'delete', label: 'Excluir', icon: Trash2, danger: true, disabled: true, hint: LIVE_DELETE, onSelect: noop },
                ]}
              />
            </Tooltip>
            <span className={x.openCaption}>Motivo</span>
          </div>
        </div>
      </Shot>
    </Shots>
  );
}

/** Uma ação de linha em cada estado. */
function iconStateCells(base: Omit<RowAction, 'onSelect'>): ReactNode[] {
  const one = (extra: Partial<RowAction> = {}) => (
    <RowActions label={base.label} actions={[{ ...base, onSelect: noop, ...extra }]} />
  );
  return [
    <span key="r">{one()}</span>,
    <span key="row" className={x.rowBox} data-row data-force="hover">
      {one()}
    </span>,
    <span key="h">{one({ 'data-force': 'hover' })}</span>,
    <span key="a">{one({ 'data-force': 'hover active' })}</span>,
    <span key="f">{one({ 'data-force': 'focus' })}</span>,
    <span key="d">{one({ disabled: true })}</span>,
    <span key="t" className={x.touch} data-size="sm">
      {one()}
    </span>,
  ];
}

/* ——————————————————————————— Grupo de botões ——————————————————————————— */

const PI_MENU: MenuSection[] = [
  {
    items: [
      { label: 'PDF', icon: FileText },
      { label: 'Enviar por e-mail', icon: Mail },
      { label: 'Copiar link', icon: Link2 },
    ],
  },
];
const SEND_MENU: MenuSection[] = [
  {
    items: [
      { label: 'Enviar e avisar o anunciante', icon: Mail },
      { label: 'Salvar rascunho', icon: FileText },
    ],
  },
];
const ADJUST_NOTE = 'Trocar a peça 970 × 250 pela versão com o logotipo novo.';

function Pager({ force, disabledPrev = false }: { force?: string; disabledPrev?: boolean }) {
  return (
    <ButtonGroup label="Navegar entre campanhas">
      <Tooltip content="Campanha anterior">
        <IconButton label="Campanha anterior" icon={ChevronLeft} size="sm" disabled={disabledPrev} data-force={force} />
      </Tooltip>
      <Tooltip content="Próxima campanha">
        <IconButton label="Próxima campanha" icon={ChevronRight} size="sm" />
      </Tooltip>
    </ButtonGroup>
  );
}

function GrupoBotoes() {
  const [tab, setTab] = useState<'todas' | 'veiculacao' | 'rascunhos'>('todas');
  const [view, setView] = useState<'grupos' | 'lista'>('lista');
  const [filters, setFilters] = useState(false);
  const [position, setPosition] = useState(3);
  const [note, setNote] = useState(ADJUST_NOTE);
  const [asking, setAsking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  const empty = note.trim() === '';
  const askTitleId = useId();

  return (
    <Shots>
      <Shot title="Em contexto" align="stretch">
        <div className={x.groupBoard}>
          <div className={`${x.frame} ${x.span2}`}>
            <div className={x.listBar}>
              <Tabs
                label="Recortes por status"
                value={tab}
                onChange={setTab}
                items={[
                  { value: 'todas', label: 'Todas', count: 17 },
                  { value: 'veiculacao', label: 'Em veiculação', count: 6 },
                  { value: 'rascunhos', label: 'Rascunhos', count: 2 },
                ]}
              />
              <div className={x.barEnd}>
                <ToggleButton icon={ListFilter} variant="ghost" pressed={filters} onPressedChange={setFilters}>
                  Filtros
                </ToggleButton>
                <Segmented
                  size="sm"
                  label="Modo de exibição"
                  value={view}
                  onChange={setView}
                  options={[
                    { value: 'grupos', label: 'Agrupada por status', icon: Rows3, iconOnly: true },
                    { value: 'lista', label: 'Lista', icon: LayoutList, iconOnly: true },
                  ]}
                />
                <Tooltip content="Exportar CSV">
                  <IconButton label="Exportar" icon={Download} variant="ghost" size="sm" />
                </Tooltip>
              </div>
            </div>
          </div>

          <div className={`${x.frame} ${x.span2}`}>
            <div className={x.topbar}>
              <Crumbs items={['Campanhas', 'Coleção Primavera-Verão no portal']} />
              <div className={x.pagerEnd}>
                <span className={x.pagerText}>{position} de 17</span>
                <ButtonGroup label="Navegar entre campanhas">
                  <Tooltip content="Campanha anterior">
                    <IconButton
                      label="Campanha anterior"
                      icon={ChevronLeft}
                      size="sm"
                      aria-disabled={position === 1 || undefined}
                      onClick={() => setPosition((value) => Math.max(1, value - 1))}
                    />
                  </Tooltip>
                  <Tooltip content="Próxima campanha">
                    <IconButton
                      label="Próxima campanha"
                      icon={ChevronRight}
                      size="sm"
                      aria-disabled={position === 17 || undefined}
                      onClick={() => setPosition((value) => Math.min(17, value + 1))}
                    />
                  </Tooltip>
                </ButtonGroup>
              </div>
            </div>
          </div>

          <form
            className={`${x.frame} ${x.askPanel}`}
            aria-labelledby={askTitleId}
            onSubmit={(event) => {
              event.preventDefault();
              if (asking || empty) return;
              setAsking(true);
              later(() => {
                setAsking(false);
                setNote(ADJUST_NOTE);
                toast('Ajustes solicitados', { description: 'Retargeting de credenciados · #2029' });
              }, 900);
            }}
          >
            <div className={x.askHead}>
              <h4 id={askTitleId} className={x.panelTitle}>
                Pedir ajustes
              </h4>
              <span className={x.askMeta}>Retargeting de credenciados · #2029</span>
            </div>
            <Textarea
              aria-label="O que precisa mudar"
              placeholder="O que precisa mudar?"
              rows={3}
              value={note}
              readOnly={asking}
              onChange={(event) => setNote(event.target.value)}
            />
            <div className={x.askFoot}>
              <Button disabled={asking} onClick={() => setNote(ADJUST_NOTE)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" loading={asking} disabled={empty}>
                Pedir ajustes
              </Button>
            </div>
          </form>
          <div className={`${x.frame} ${x.piPanel}`}>
            <h4 className={x.panelTitle}>Pedido de inserção</h4>
            <div className={x.piRow}>
              <div className={x.piText}>
                <strong>P.I. 2026-0400</strong>
                <span>R$ 18.000,00</span>
              </div>
              <Badge variant="text" tone="green">
                Ativo
              </Badge>
            </div>
            <SplitButton
              label="Baixar P.I."
              icon={Download}
              menuLabel="Outras opções do P.I."
              menu={PI_MENU}
              loading={downloading}
              onClick={() => {
                setDownloading(true);
                later(() => setDownloading(false), 900);
              }}
            />
          </div>
        </div>
        <Toaster />
      </Shot>

      <Shot title="Variantes" tone="white" align="stretch">
        <States min={168} align="center">
          <State label="Colados">
            <ButtonGroup label="Peça criativa">
              <Button size="sm" icon={Eye}>
                Visualizar
              </Button>
              <Button size="sm" icon={Download}>
                Baixar
              </Button>
            </ButtonGroup>
          </State>
          <State label="Espaçados">
            <span className={x.pair}>
              <Button size="sm">Cancelar</Button>
              <Button size="sm" variant="primary">
                Salvar
              </Button>
            </span>
          </State>
          <State label="Dividido principal">
            <SplitButton variant="primary" size="sm" label="Enviar" icon={Send} menuLabel="Outras formas de envio" menu={SEND_MENU} />
          </State>
          <State label="Dividido secundário">
            <SplitButton size="sm" label="Baixar P.I." icon={Download} menuLabel="Outras opções do P.I." menu={PI_MENU} />
          </State>
          <State label="Ícones">
            <Pager />
          </State>
          <State label="Link com cara de botão">
            <ButtonLink size="sm" href="#" icon={Download} onClick={(event) => event.preventDefault()}>
              Baixar CSV
            </ButtonLink>
          </State>
        </States>
      </Shot>

      <Shot title="Estados" tone="white" align="stretch">
        <div className={x.stackLg} inert>
          <States min={150} align="center">
            <State label="Hover">
              <SplitButton size="sm" label="Baixar P.I." icon={Download} menuLabel="Opções" menu={PI_MENU} force={{ toggle: 'hover' }} />
            </State>
            <State label="Pressionado">
              <Pager force="hover active" />
            </State>
            <State label="Foco">
              <SplitButton size="sm" label="Baixar P.I." icon={Download} menuLabel="Opções" menu={PI_MENU} force={{ toggle: 'focus' }} />
            </State>
            <State label="Foco · principal">
              <SplitButton variant="primary" size="sm" label="Enviar" icon={Send} menuLabel="Opções" menu={SEND_MENU} force={{ main: 'focus' }} />
            </State>
            <State label="Indisponível">
              <Pager disabledPrev />
            </State>
          </States>
          <div className={x.openRow}>
            <span className={x.openMenu}>
              <SplitButton size="sm" label="Baixar P.I." icon={Download} menuLabel="Opções" menu={PI_MENU} force={{ toggle: 'open' }} />
              <MenuPanel label="Opções do P.I." width={200} sections={PI_MENU} />
            </span>
            <span className={x.openCaption}>Menu aberto</span>
          </div>
        </div>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Link ——————————————————————————— */

const ASSET_WINDOW = { start: '2026-10-01', end: '2026-11-30' };

function Links() {
  const [range, setRange] = useState({ start: '2026-10-05', end: '2026-10-31' });
  const whole = range.start === ASSET_WINDOW.start && range.end === ASSET_WINDOW.end;
  const [send, setSend] = useState('aprovacao');
  const startId = useId();
  const endId = useId();
  return (
    <Shots>
      <Shot title="Em contexto" align="stretch">
        <div className={x.linkBoard}>
          <div className={`${x.frame} ${x.span2}`}>
            <header className={x.detailHead}>
              <div className={x.detailTitles}>
                <div className={x.titleRow}>
                  <h4 className={x.pageTitle}>Coleção Primavera-Verão no portal</h4>
                  <StatusText status="live" />
                </div>
                <p className={x.meta}>
                  <span>#2041</span>
                  <span>
                    <TextLink href="#links" tone="text">
                      Aurora Calçados
                    </TextLink>
                  </span>
                  <span>Banner Super Topo — Portal</span>
                  <span>01/10 – 31/10</span>
                </p>
              </div>
              <TextLink href="https://example.com/francal-2026/vitrine" external size="sm" className={x.headLink}>
                Abrir no portal
              </TextLink>
            </header>
          </div>

          <div className={`${x.frame} ${x.reviewPanel}`}>
            <div className={x.sectionHead}>
              <h4 className={x.panelTitle}>Ativo</h4>
              <LinkButton tone="quiet">Editar</LinkButton>
            </div>
            <dl className={x.facts}>
              <dt>Ativo</dt>
              <dd>Banner Super Topo — Portal</dd>
              <dt>Categoria</dt>
              <dd>Mídia Online</dd>
              <dt>Janela do ativo</dt>
              <dd>
                <span className={x.nowrap}>01/10/2026 – 30/11/2026</span>
              </dd>
            </dl>
          </div>

          <div className={`${x.frame} ${x.sendPanel}`}>
            <h4 className={x.panelTitle}>Como salvar esta campanha?</h4>
            <div className={x.choices}>
              <ChoiceCard
                name="envio"
                value="rascunho"
                checked={send === 'rascunho'}
                onChange={setSend}
                title="Salvar como rascunho"
                description="Fica com você para continuar depois."
              />
              <ChoiceCard
                name="envio"
                value="aprovacao"
                checked={send === 'aprovacao'}
                onChange={setSend}
                title="Enviar para aprovação"
                description="O comercial do portal revisa e responde por aqui."
                footer={
                  send === 'aprovacao' ? (
                    <span className={x.blocked}>
                      <span className={x.blockedText}>
                        <CircleAlert aria-hidden="true" />
                        Faltam 2 campos do briefing
                      </span>
                      <LinkButton>Preencher</LinkButton>
                    </span>
                  ) : undefined
                }
              />
            </div>
          </div>

          <div className={`${x.frame} ${x.span2} ${x.periodPanel}`}>
            <span className={x.groupLabel}>
              Período de veiculação
              <span className={x.groupMeta}>{whole ? '61 dias' : '27 dias'}</span>
            </span>
            <div className={x.period}>
              <DateRangePicker
                labels
                required
                ids={{ start: startId, end: endId }}
                start={range.start}
                end={range.end}
                window={{ ...ASSET_WINDOW, label: 'Janela do ativo' }}
                onChange={(next) => setRange({ start: next.start, end: next.end })}
              />
            </div>
            <p className={x.hint}>
              <span>Janela do ativo</span>
              <b>01/10 – 30/11</b>
              {!whole && (
                <>
                  <span aria-hidden="true">·</span>
                  <LinkButton
                    onClick={() => {
                      // O link some ao aplicar: o foco vai antes para o campo que mudou.
                      document.getElementById(startId)?.focus();
                      setRange(ASSET_WINDOW);
                    }}
                  >
                    Usar inteira
                  </LinkButton>
                </>
              )}
            </p>
          </div>
        </div>
      </Shot>

      <Shot title="Variantes" tone="white" align="stretch">
        <States columns={4}>
          <State label="Em frase">
            <p className={x.sentence}>
              Siga o <TextLink href="#links">regulamento de mídia</TextLink>.
            </p>
          </State>
          <State label="Ação em texto">
            <LinkButton>Preencher</LinkButton>
          </State>
          <State label="Discreto">
            <LinkButton tone="quiet">Editar</LinkButton>
          </State>
          <State label="Externo">
            <TextLink href="https://example.com/francal-2026/vitrine" external size="sm">
              Abrir no portal
            </TextLink>
          </State>
        </States>
      </Shot>

      <Shot title="Estados" tone="white" align="stretch">
        <Matrix
          columns={['Repouso', 'Hover', 'Pressionado', 'Foco', 'Indisponível']}
          rows={[
            {
              label: 'Acento',
              cells: LINK_STATES.map((state) => (
                <LinkButton key={state.label} {...state.props}>
                  Preencher
                </LinkButton>
              )),
            },
            {
              label: 'Discreto',
              cells: LINK_STATES.map((state) => (
                <LinkButton key={state.label} tone="quiet" {...state.props}>
                  Editar
                </LinkButton>
              )),
            },
            {
              label: 'Externo',
              cells: LINK_STATES.map((state) => (
                <TextLink
                  key={state.label}
                  href="https://example.com/francal-2026/vitrine"
                  external
                  size="sm"
                  data-force={state.props['data-force']}
                  disabled={state.props.disabled}
                >
                  Abrir no portal
                </TextLink>
              )),
            },
          ]}
        />
      </Shot>
    </Shots>
  );
}
const LINK_STATES: { label: string; props: { 'data-force'?: string; disabled?: boolean } }[] = [
  { label: 'Repouso', props: {} },
  { label: 'Hover', props: { 'data-force': 'hover' } },
  { label: 'Pressionado', props: { 'data-force': 'hover active' } },
  { label: 'Foco', props: { 'data-force': 'focus' } },
  { label: 'Indisponível', props: { disabled: true } },
];

/* ——————————————————————————— Toggle ——————————————————————————— */

const CATEGORIES = [
  { value: 'online', label: 'Mídia Online', icon: MonitorSmartphone, count: 4 },
  { value: 'organico', label: 'Conteúdo Orgânico', icon: Newspaper, count: 2 },
  { value: 'offline', label: 'Mídia Offline', icon: Presentation, count: 2 },
  { value: 'prospeccao', label: 'Prospecção Ativa', icon: Handshake, count: 1 },
];
const PAVILIONS = [
  { value: 'azul', label: 'Pavilhão Azul' },
  { value: 'verde', label: 'Pavilhão Verde' },
  { value: 'laranja', label: 'Pavilhão Laranja' },
  { value: 'internacional', label: 'Área internacional' },
];
const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'live', label: 'Veiculando' },
  { value: 'adjust', label: 'Ajustes solicitados' },
  { value: 'draft', label: 'Rascunho' },
];
const ADVERTISER_OPTIONS = [
  { value: '', label: 'Todos os anunciantes' },
  { value: 'aurora', label: 'Aurora Calçados' },
  { value: 'norte', label: 'Estúdio Norte' },
  { value: 'horizonte', label: 'Grupo Horizonte' },
];

/** Lista de campanhas: “Filtros” abre a faixa; categoria (uma) e pavilhões (vários) filtram a lista. */
function Toggle() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(true);
  const [status, setStatus] = useState('');
  const [advertiser, setAdvertiser] = useState('');
  const [category, setCategory] = useState<string | null>('online');
  const [pavilions, setPavilions] = useState<string[]>(['azul', 'internacional']);
  const count = [status, advertiser, category, pavilions.length > 0].filter(Boolean).length;
  const base = CATEGORIES.find((item) => item.value === category)?.count ?? 17;
  const share = (pavilions.length || PAVILIONS.length) / PAVILIONS.length;
  const total = count === 0 ? 17 : Math.max(1, Math.round(base * share * (status ? 0.5 : 1) * (advertiser ? 0.5 : 1)));
  const bandId = useId();
  const filtersId = useId();
  const catId = useId();
  const pavId = useId();
  const invalidId = useId();

  return (
    <Shots>
      <Shot title="Em contexto" align="stretch">
        <div className={`${x.frame} ${x.filterFrame}`}>
          <div className={x.toolbar}>
            <span className={x.toolbarCount}>
              <b>{total}</b> de 17 campanhas
            </span>
            <div className={x.toolbarEnd}>
              <div className={x.toolbarSearch}>
                <SearchField
                  size="sm"
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Campanha, anunciante ou nº"
                  label="Buscar campanhas"
                />
              </div>
              <ToggleButton
                id={filtersId}
                icon={ListFilter}
                pressed={open}
                onPressedChange={setOpen}
                count={count}
                countLabel={`${count} ${count === 1 ? 'filtro aplicado' : 'filtros aplicados'}`}
                aria-expanded={open}
                aria-controls={bandId}
              >
                Filtros
              </ToggleButton>
            </div>
          </div>
          <div id={bandId} className={x.band} data-open={open || undefined}>
            <div className={x.bandClip} inert={!open}>
              <div className={x.bandInner} role="search" aria-label="Filtros de campanhas">
                <div className={x.bandSelects}>
                  <div className={x.bandField}>
                    <Select size="sm" label="Status" value={status} onChange={setStatus} placeholder="Todos os status" options={STATUS_OPTIONS} />
                  </div>
                  <div className={x.bandField}>
                    <Select
                      size="sm"
                      label="Anunciante"
                      value={advertiser}
                      onChange={setAdvertiser}
                      placeholder="Todos os anunciantes"
                      options={ADVERTISER_OPTIONS}
                    />
                  </div>
                </div>
                {count > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className={x.bandClear}
                    onClick={() => {
                      // O botão some com os filtros: o foco volta para “Filtros”, que perde a contagem.
                      document.getElementById(filtersId)?.focus();
                      setStatus('');
                      setAdvertiser('');
                      setCategory(null);
                      setPavilions([]);
                    }}
                  >
                    Limpar filtros
                  </Button>
                )}
                <div className={x.bandGroup}>
                  <span id={catId} className={x.bandLabel}>
                    Categoria
                  </span>
                  <ToggleGroup type="single" label="Categoria" labelledBy={catId} value={category} onChange={setCategory} items={CATEGORIES} />
                </div>
                <div className={x.bandGroup}>
                  <span id={pavId} className={x.bandLabel}>
                    Pavilhões
                  </span>
                  <ToggleGroup type="multiple" label="Pavilhões" labelledBy={pavId} value={pavilions} onChange={setPavilions} items={PAVILIONS} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Shot>

      <Shot title="Estados" tone="white" align="stretch">
        <div className={x.stackLg}>
          <Matrix
            columns={['Repouso', 'Hover', 'Pressionado', 'Foco', 'Ligado', 'Ligado · hover', 'Indisponível']}
            rows={[
              {
                label: 'Botão',
                cells: TOGGLE_STATES.map((state) => (
                  <ToggleButton
                    key={state.label}
                    icon={ListFilter}
                    pressed={state.on}
                    onPressedChange={noop}
                    disabled={state.disabled}
                    data-force={state.force}
                  >
                    Filtros
                  </ToggleButton>
                )),
              },
              {
                label: 'Pílula',
                cells: TOGGLE_STATES.map((state) => (
                  <ToggleGroup
                    key={state.label}
                    type="multiple"
                    label="Pavilhão"
                    value={state.on ? ['azul'] : []}
                    onChange={noop}
                    items={[{ value: 'azul', label: 'Pavilhão Azul', disabled: state.disabled, 'data-force': state.force }]}
                  />
                )),
              },
            ]}
          />
          <div className={x.invalidRow} inert>
            <span className={x.mLabel}>Inválido</span>
            <div className={x.fieldGroup}>
              <span id={invalidId} className={x.groupLabel}>
                Pavilhões de interesse
                <span className={x.req} aria-hidden="true">
                  *
                </span>
              </span>
              <ToggleGroup type="multiple" invalid label="Pavilhões de interesse" labelledBy={invalidId} value={[]} onChange={noop} items={PAVILIONS} />
              <span className={x.error}>
                <CircleAlert aria-hidden="true" />
                Escolha ao menos um pavilhão
              </span>
            </div>
          </div>
        </div>
      </Shot>
    </Shots>
  );
}
const TOGGLE_STATES: { label: string; on: boolean; force?: string; disabled?: boolean }[] = [
  { label: 'Repouso', on: false },
  { label: 'Hover', on: false, force: 'hover' },
  { label: 'Pressionado', on: false, force: 'hover active' },
  { label: 'Foco', on: false, force: 'focus' },
  { label: 'Ligado', on: true },
  { label: 'Ligado · hover', on: true, force: 'hover' },
  { label: 'Indisponível', on: false, disabled: true },
];

/* ——————————————————————————— Ações de linha ——————————————————————————— */

function AcoesLinha() {
  const list = useCampaignDelete(CAMPAIGNS);
  // O invólucro existe sempre (display: contents parado): marcar a entrada não remonta a célula,
  // então o foco dado à linha restaurada continua no lugar quando a animação termina.
  const enter = (campaign: Campaign, node: ReactNode) => (
    <span className={x.enterWrap} data-entering={list.entering === campaign.id || undefined}>
      <span>{node}</span>
    </span>
  );

  return (
    <Shots>
      <Shot title="Em contexto" align="stretch">
        <div className={x.tableWrap} {...list.scopeOf('table')}>
          <DataTable
            label="Campanhas"
            rows={list.rows}
            rowKey={(row) => row.id}
            columns={campaignColumns((campaign) => list.ask(campaign, 'table'), enter)}
            density="compact"
            fixed
            exiting={list.exiting}
          />
        </div>
        {list.dialog}
        <Toaster />
      </Shot>

      <Shot title="Estados" tone="white" align="stretch">
        <States columns={6} align="center">
          <State label="Repouso">
            <span className={x.rowBox}>
              <RowActions actions={stateActions()} />
            </span>
          </State>
          <State label="Linha em hover">
            <span className={x.rowBox} data-row data-force="hover">
              <RowActions actions={stateActions()} />
            </span>
          </State>
          <State label="Ícone em hover">
            <span className={x.rowBox}>
              <RowActions actions={stateActions({ edit: { 'data-force': 'hover' } })} />
            </span>
          </State>
          <State label="Foco">
            <span className={x.rowBox}>
              <RowActions actions={stateActions({ metrics: { 'data-force': 'focus' } })} />
            </span>
          </State>
          <State label="Indisponível">
            <span className={x.rowBox}>
              <RowActions actions={stateActions({ delete: { disabled: true, hint: LIVE_DELETE } })} />
            </span>
          </State>
          <State label="Slot vazio">
            <span className={`${x.rowBox} ${x.showSlot}`}>
              <RowActions actions={stateActions({ edit: { hidden: true } })} />
            </span>
          </State>
        </States>
      </Shot>

      <Shot title="Celular" align="center">
        <div className={x.phone}>
          <ul className={x.cards} {...list.scopeOf('cards')}>
            {list.rows.map((campaign) => (
              <li
                key={campaign.id}
                className={x.card}
                data-row
                data-key={campaign.id}
                data-exiting={list.exiting.has(campaign.id) || undefined}
                data-entering={list.entering === campaign.id || undefined}
              >
                <CardBody campaign={campaign} />
                <RowActions
                  compact
                  overflowLabel={`Ações de ${campaign.name}`}
                  actions={campaignActions(campaign, (target) => list.ask(target, 'cards'))}
                />
              </li>
            ))}
          </ul>
        </div>
      </Shot>
    </Shots>
  );
}

/** As três ações fixas, com ajustes por id (estado forçado, indisponível, slot vazio). */
function stateActions(patch: Partial<Record<'metrics' | 'edit' | 'delete', Partial<RowAction>>> = {}): RowAction[] {
  return [
    { id: 'metrics', label: 'Métricas', icon: ChartColumn, onSelect: noop, ...patch.metrics },
    { id: 'edit', label: 'Editar', icon: Pencil, onSelect: noop, ...patch.edit },
    { id: 'delete', label: 'Excluir', icon: Trash2, danger: true, onSelect: noop, ...patch.delete },
  ];
}

/* ——————————————————————————— Registro ——————————————————————————— */

/** Pranchas do grupo Ações, por id do inventário. */
export const specimens: Record<string, ComponentType> = {
  botoes: Botoes,
  'botao-icone': BotaoIcone,
  'grupo-botoes': GrupoBotoes,
  links: Links,
  toggle: Toggle,
  'acoes-linha': AcoesLinha,
};
