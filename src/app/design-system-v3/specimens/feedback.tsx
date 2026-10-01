'use client';

import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  ChartColumn,
  Check,
  Download,
  Eye,
  FileImage,
  FilePen,
  Megaphone,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Save,
  Send,
  Trash2,
  WifiOff,
  Wrench,
  X,
} from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  Avatar,
  Badge,
  BrandMark,
  Button,
  Checkbox,
  Field,
  IconButton,
  Input,
  SearchField,
  Segmented,
  Switch,
  Tabs,
  VisuallyHidden,
  type Tone,
} from '@/components/ds-v3';
import { TopBar, type Crumb } from '@/components/ds-v3/app-shell';
import { BarChart, ChartCard, ChartSwap } from '@/components/ds-v3/charts';
import {
  AccessState,
  Alert,
  Banner,
  EmptyState,
  ErrorState,
  LoadingSwap,
  NotificationDot,
  NotificationItem,
  NotificationList,
  Progress,
  ProgressSteps,
  Skeleton,
  SkeletonRegion,
  SkeletonRows,
  SkeletonText,
  Spinner,
  type AccessKind,
  type NotificationEntry,
  type ProgressStep,
} from '@/components/ds-v3/feedback';
import { LinkButton } from '@/components/ds-v3/link';
import { ToastCard, Toaster, toast } from '@/components/ds-v3/toast';
import toastStyles from '@/components/ds-v3/toast.module.css';
import { Shot, Shots, State, States } from '../stage';
import x from './feedback.module.css';

/* ——————————————————————————— Dados fictícios ——————————————————————————— */

type Row = {
  id: number;
  name: string;
  asset: string;
  advertiser: string;
  status: string;
  tone: Tone;
  live?: boolean;
  budget: number;
  period: string;
};

const ROWS: Row[] = [
  {
    id: 2041,
    name: 'Coleção Primavera-Verão no portal',
    asset: 'Banner Super Topo — Portal',
    advertiser: 'Aurora Calçados',
    status: 'Veiculando',
    tone: 'green',
    live: true,
    budget: 18000,
    period: '01/10 – 31/10',
  },
  {
    id: 2038,
    name: 'Newsletter dos expositores',
    asset: 'E-mail marketing dedicado',
    advertiser: 'Estúdio Norte',
    status: 'Veiculando',
    tone: 'green',
    live: true,
    budget: 8000,
    period: '05/10 – 25/10',
  },
  {
    id: 2035,
    name: 'Convite para o estande B-214',
    asset: 'Push no app da feira',
    advertiser: 'Casa Forma',
    status: 'Aguardando assinatura',
    tone: 'amber',
    budget: 3600,
    period: '14/10 – 17/10',
  },
  {
    id: 2032,
    name: 'Destaque couro vegetal',
    asset: 'Banner Super Topo — Portal',
    advertiser: 'Lume Acessórios',
    status: 'Em aprovação',
    tone: 'violet',
    budget: 9000,
    period: '10/10 – 30/10',
  },
  {
    id: 2029,
    name: 'Retargeting de credenciados',
    asset: 'Banner Super Topo — Portal',
    advertiser: 'Grupo Horizonte',
    status: 'Ajustes solicitados',
    tone: 'orange',
    budget: 13500,
    period: '01/10 – 31/10',
  },
];
const MORE: Row[] = [
  {
    id: 2026,
    name: 'Vitrine de lançamentos Aurora',
    asset: 'Destaque na vitrine',
    advertiser: 'Aurora Calçados',
    status: 'Ajustes solicitados',
    tone: 'orange',
    budget: 11230,
    period: '12/10 – 30/10',
  },
  {
    id: 2023,
    name: 'Rodada de negócios — segunda edição',
    asset: 'E-mail marketing dedicado',
    advertiser: 'Ateliê Sul',
    status: 'Pausada',
    tone: 'gray',
    budget: 3600,
    period: '25/09 – 17/10',
  },
  {
    id: 2017,
    name: 'Painel de LED — lançamento',
    asset: 'Painel de LED — Pavilhão Azul',
    advertiser: 'Bella Passo',
    status: 'Aprovada',
    tone: 'teal',
    budget: 18000,
    period: '14/10 – 17/10',
  },
];

const money = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/* ——————————————————————————— Peças de composição ——————————————————————————— */

/** O catálogo pode já ter um Toaster; só monta outro se não houver. */
function EnsureToaster() {
  const [needed, setNeeded] = useState(false);
  useEffect(() => {
    const cls = toastStyles.viewport;
    setNeeded(!cls || !document.querySelector(`.${CSS.escape(cls)}`));
  }, []);
  return needed ? <Toaster /> : null;
}

function Frame({
  children,
  className = '',
  body = true,
}: {
  children: ReactNode;
  className?: string;
  body?: boolean;
}) {
  return (
    <div className={`${x.frame} ${className}`}>
      {body ? <div className={x.frameBody}>{children}</div> : children}
    </div>
  );
}

function PanelHead({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className={x.panelHead}>
      <div className={x.stackTight} style={{ gap: 0 }}>
        <h4 className={x.panelTitle}>{title}</h4>
        {meta && <span className={x.panelMeta}>{meta}</span>}
      </div>
      {children}
    </div>
  );
}

function Status({ row }: { row: Pick<Row, 'status' | 'tone' | 'live'> }) {
  return (
    <Badge variant="text" tone={row.tone} live={row.live} wrap>
      {row.status}
    </Badge>
  );
}

function Bell24({ unread = false }: { unread?: boolean }) {
  return (
    <span className={x.bellWrap}>
      <IconButton
        label={unread ? 'Notificações: há novidades' : 'Notificações'}
        icon={Bell}
        variant="ghost"
        size="sm"
      />
      {unread && <i className={x.bellDot} aria-hidden="true" />}
    </span>
  );
}

/** Topo + conteúdo, como o /dashboardv3 (sem o menu lateral). */
function ShellFrame({
  crumbs,
  banner,
  children,
  minHeight,
  center = false,
  bell,
  overlay,
  bodyClass = '',
}: {
  crumbs: Crumb[];
  banner?: ReactNode;
  children: ReactNode;
  minHeight?: number;
  center?: boolean;
  bell?: ReactNode;
  overlay?: ReactNode;
  bodyClass?: string;
}) {
  return (
    <div className={x.shell} style={minHeight ? { minHeight } : undefined}>
      <TopBar
        breadcrumb={crumbs}
        sticky={false}
        menuButton="never"
        notifications={bell ?? <Bell24 unread />}
      />
      {banner}
      <div className={`${x.shellBody} ${bodyClass}`} data-center={center || undefined}>
        {children}
      </div>
      {overlay}
    </div>
  );
}

const CRUMBS_LIST: Crumb[] = [{ label: 'Operação', href: '#' }, { label: 'Campanhas' }];

function PageHead({
  title = 'Campanhas',
  sub = '17 de 17 campanhas do portal.',
  action,
}: {
  title?: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className={x.pageHead}>
      <div>
        <h3 className={x.pageTitle}>{title}</h3>
        {sub && <p className={x.pageSub}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function MiniList({ rows = ROWS.slice(0, 3) }: { rows?: Row[] }) {
  return (
    <div className={x.mini}>
      {rows.map((row) => (
        <div key={row.id} className={x.miniRow}>
          <div className={x.recordText}>
            <span className={x.recordName}>{row.name}</span>
            <span className={x.recordMeta}>
              {row.asset} · #{row.id}
            </span>
          </div>
          <Status row={row} />
          <span className={x.miniMoney}>{money(row.budget)}</span>
        </div>
      ))}
    </div>
  );
}

function DetailHead({
  title,
  status,
  facts,
  actions,
}: {
  title: string;
  status: Pick<Row, 'status' | 'tone' | 'live'>;
  facts: string[];
  actions?: ReactNode;
}) {
  return (
    <div className={x.detailHead}>
      <div className={x.detailTitles}>
        <div className={x.detailTitleRow}>
          <h3 className={x.detailTitle}>{title}</h3>
          <Status row={status} />
        </div>
        <div className={x.factsClip}>
          <p className={x.detailFacts}>
            {facts.map((fact) => (
              <span key={fact}>{fact}</span>
            ))}
          </p>
        </div>
      </div>
      {actions && <div className={x.rowEnd}>{actions}</div>}
    </div>
  );
}

/** Matriz rótulo × colunas (tamanhos e tons). */
function Matrix({
  head,
  rows,
}: {
  head: string[];
  rows: { label: string; cells: ReactNode[]; ink?: boolean }[];
}) {
  const style = { '--cols': head.length } as CSSProperties;
  return (
    <div className={x.matrix} style={style}>
      <div className={x.mRow} style={style}>
        <span />
        {head.map((label) => (
          <span key={label} className={x.mHead}>
            {label}
          </span>
        ))}
      </div>
      {rows.map((row) => (
        <div key={row.label} className={x.mRow} style={style}>
          <span className={x.mLabel}>{row.label}</span>
          {row.cells.map((cell, index) => (
            <span key={index} className={x.mCell} data-ink={row.ink || undefined}>
              {cell}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ——————————————————————————— Alerta ——————————————————————————— */

function Alerta() {
  const [outside, setOutside] = useState(false);
  return (
    <Shots>
      <Shot
        title="Em contexto"
        align="stretch"
        aside={
          <Button size="sm" icon={CalendarDays} onClick={() => setOutside((value) => !value)}>
            Simular
          </Button>
        }
      >
        <div className={x.slices}>
          <Frame>
            <DetailHead
              title="Retargeting de credenciados"
              status={{ status: 'Ajustes solicitados', tone: 'orange' }}
              facts={['#2029', 'Grupo Horizonte', 'Banner Super Topo — Portal', '01/10 – 31/10']}
            />
            <Alert tone="attention" title="Motivo" meta="Em 26/09/2026 às 11:12 · Marina Lopes">
              A peça 970 × 250 está com o logotipo cortado. Ajuste o respiro e reenvie.
            </Alert>
          </Frame>
          <div className={x.split}>
            <Frame>
              <div className={x.record}>
                <BrandMark name="Casa Forma" size="sm" decorative />
                <div className={x.recordText}>
                  <span className={x.recordName}>Convite para o estande B-214</span>
                  <span className={x.recordMeta}>Casa Forma · {money(3600)}</span>
                </div>
              </div>
              <Alert
                tone="info"
                icon={FilePen}
                title="P.I. 2026-0400 aguarda assinatura"
                end="Assinatura em 72 h"
              />
            </Frame>
            <Frame>
              <div className={x.record}>
                <BrandMark name="Aurora Calçados" size="sm" decorative />
                <div className={x.recordText}>
                  <span className={x.recordName}>Coleção Primavera-Verão no portal</span>
                  <span className={x.recordMeta}>Aurora Calçados · {money(18000)}</span>
                </div>
              </div>
              <Alert
                tone="success"
                title="P.I. assinado por Aurora Calçados"
                meta="Hoje às 09:40"
              />
            </Frame>
          </div>
          <Frame>
            <div className={x.stack} style={{ gap: 0 }}>
              <div style={{ maxWidth: 360 }}>
                <Field label="Período de veiculação" hint="Janela do ativo: 01/10 – 31/10">
                  {({ id, describedBy }) => (
                    <Input
                      id={id}
                      aria-describedby={describedBy}
                      icon={CalendarDays}
                      readOnly
                      value={outside ? '28/09/2026 – 31/10/2026' : '01/10/2026 – 31/10/2026'}
                    />
                  )}
                </Field>
              </div>
              <Alert
                tone="warning"
                open={outside}
                gap={12}
                title="Período fora da janela do ativo"
                action={<LinkButton onClick={() => setOutside(false)}>Usar inteira</LinkButton>}
              >
                O ativo abre em 01/10; o período começa em 28/09.
              </Alert>
            </div>
          </Frame>
          <Frame body={false}>
            <div className={x.footBar} style={{ borderTop: 0, borderRadius: 'inherit' }}>
              <div>
                <Alert
                  tone="danger"
                  compact
                  role="none"
                  action={<LinkButton>Preencher</LinkButton>}
                  className={x.cellFill}
                >
                  Faltam 2 campos do briefing
                </Alert>
              </div>
              <Button icon={ArrowLeft} className={x.hideSm}>
                Voltar
              </Button>
              <IconButton label="Voltar" icon={ArrowLeft} className={x.showSm} />
              <Button variant="primary" icon={Send} aria-disabled="true">
                Enviar para aprovação
              </Button>
            </div>
          </Frame>
        </div>
      </Shot>

      <Shot title="Variantes" tone="white" align="stretch">
        <States min={320}>
          <State label="Com título">
            <div className={x.cellFill}>
              <Alert tone="info" title="P.I. 2026-0400 aguarda assinatura">
                O estoque fica reservado até a assinatura.
              </Alert>
            </div>
          </State>
          <State label="Sem título">
            <div className={x.cellFill}>
              <Alert tone="success">Campanha enviada para aprovação.</Alert>
            </div>
          </State>
          <State label="Com ação">
            <div className={x.cellFill}>
              <Alert
                tone="warning"
                title="Período fora da janela do ativo"
                action={<LinkButton>Usar inteira</LinkButton>}
              />
            </div>
          </State>
          <State label="Com prazo">
            <div className={x.cellFill}>
              <Alert tone="warning" icon={FilePen} title="P.I. 2026-0402" end="Expira em 48 h" />
            </div>
          </State>
          <State label="Dispensável">
            <DismissibleSample />
          </State>
          <State label="Compacto">
            <div className={x.cellFill}>
              <Alert tone="danger" compact role="none" action={<LinkButton>Preencher</LinkButton>}>
                Faltam 2 campos do briefing
              </Alert>
            </div>
          </State>
        </States>
      </Shot>

      <Shot title="Tons" tone="white" align="stretch">
        <States columns={5}>
          <State label="Informação">
            <div className={x.cellFill}>
              <Alert tone="info" title="Janela aberta" />
            </div>
          </State>
          <State label="Sucesso">
            <div className={x.cellFill}>
              <Alert tone="success" title="P.I. assinado" />
            </div>
          </State>
          <State label="Prazo">
            <div className={x.cellFill}>
              <Alert tone="warning" title="Expira em 48 h" />
            </div>
          </State>
          <State label="Ação agora">
            <div className={x.cellFill}>
              <Alert tone="attention" title="Ajuste a peça" />
            </div>
          </State>
          <State label="Erro">
            <div className={x.cellFill}>
              <Alert tone="danger" role="none" title="P.I. rejeitado" />
            </div>
          </State>
        </States>
      </Shot>

      <Shot title="Estados" tone="white" align="stretch">
        <States min={200}>
          {(['Repouso', 'Hover', 'Pressionado', 'Foco'] as const).map((label, index) => (
            <State key={label} label={label}>
              <div className={x.cellFill}>
                <Alert
                  tone="info"
                  title="CSV exportado"
                  onDismiss={() => undefined}
                  data-force={[undefined, 'hover', 'active', 'focus'][index]}
                />
              </div>
            </State>
          ))}
        </States>
      </Shot>

      <Shot title="Celular" align="center">
        <div className={x.phone}>
          <div className={x.phoneBody}>
            <div className={x.detailTitles}>
              <h3 className={x.phoneTitle}>Retargeting de credenciados</h3>
              <Status row={{ status: 'Ajustes solicitados', tone: 'orange' }} />
            </div>
            <Alert tone="attention" title="Motivo" meta="Em 26/09/2026 às 11:12 · Marina Lopes">
              A peça 970 × 250 está com o logotipo cortado. Ajuste o respiro e reenvie.
            </Alert>
            <Alert
              tone="info"
              icon={FilePen}
              title="P.I. 2026-0400 aguarda assinatura"
              end="Assinatura em 72 h"
            />
          </div>
        </div>
      </Shot>
    </Shots>
  );
}

/** Dispensável que volta depois de sair (a prancha não fica vazia). */
function DismissibleSample() {
  const [round, setRound] = useState(0);
  const [open, setOpen] = useState(true);
  useEffect(() => {
    if (open) return;
    const timer = window.setTimeout(() => {
      setRound((value) => value + 1);
      setOpen(true);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [open]);
  return (
    <div className={x.cellFill} style={{ minHeight: 42 }}>
      <Alert
        key={round}
        tone="info"
        title="CSV exportado"
        appear={round > 0}
        onDismiss={() => setOpen(false)}
      >
        17 campanhas · campanhas-francal.csv
      </Alert>
    </div>
  );
}

/* ——————————————————————————— Toast ——————————————————————————— */

function ToastSpecimen() {
  const [live, setLive] = useState(true);
  const [saving, setSaving] = useState(false);

  const togglePause = () => {
    const next = !live;
    setLive(next);
    toast(next ? 'Veiculação retomada' : 'Veiculação pausada', {
      description: 'Coleção Primavera-Verão no portal',
      action: { label: 'Desfazer', onClick: () => setLive(!next) },
      progress: true,
    });
  };
  const save = async (attempt = 1) => {
    setSaving(true);
    await wait(700);
    setSaving(false);
    if (attempt % 2 === 1) {
      toast('Não foi possível salvar', {
        tone: 'error',
        description: 'Sem resposta do servidor.',
        action: { label: 'Tentar de novo', onClick: () => void save(attempt + 1) },
      });
    } else {
      toast('Alterações salvas', { progress: true });
    }
  };

  return (
    <Shots>
      <Shot title="Em contexto" align="stretch">
        <Frame>
          <DetailHead
            title="Coleção Primavera-Verão no portal"
            status={
              live
                ? { status: 'Veiculando', tone: 'green', live: true }
                : { status: 'Pausada', tone: 'gray' }
            }
            facts={['#2041', 'Aurora Calçados', 'Banner Super Topo — Portal', '01/10 – 31/10']}
            actions={
              <>
                <Button
                  icon={Download}
                  onClick={() =>
                    toast('17 campanhas exportadas', {
                      tone: 'info',
                      description: 'campanhas-francal-2026.csv',
                      progress: true,
                    })
                  }
                >
                  Exportar CSV
                </Button>
                <Button icon={live ? Pause : Play} onClick={togglePause}>
                  {live ? 'Pausar veiculação' : 'Retomar veiculação'}
                </Button>
                <Button variant="primary" icon={Save} loading={saving} onClick={() => void save()}>
                  Salvar
                </Button>
              </>
            }
          />
          <MiniList rows={ROWS.slice(0, 2)} />
        </Frame>
      </Shot>

      <Shot title="Estados" align="stretch">
        <div className={x.toastGrid}>
          <figure>
            <ToastCard still tone="success" title="Veiculação pausada" />
            <figcaption className={x.caption}>Sucesso</figcaption>
          </figure>
          <figure>
            <ToastCard still tone="info" title="17 campanhas exportadas" />
            <figcaption className={x.caption}>Informação</figcaption>
          </figure>
          <figure>
            <ToastCard
              still
              tone="error"
              title="Não foi possível salvar"
              action={{ label: 'Tentar de novo', onClick: () => undefined }}
            />
            <figcaption className={x.caption}>Erro</figcaption>
          </figure>
          <figure>
            <ToastCard
              still
              title="Campanha excluída"
              action={{ label: 'Desfazer', onClick: () => undefined }}
            />
            <figcaption className={x.caption}>Com ação</figcaption>
          </figure>
          <figure>
            <ToastCard
              still
              tone="info"
              title="CSV exportado"
              description="31 dias · Coleção Primavera-Verão"
            />
            <figcaption className={x.caption}>Com descrição</figcaption>
          </figure>
          <figure>
            <ToastCard still progress title="Alterações salvas" />
            <figcaption className={x.caption}>Com tempo</figcaption>
          </figure>
          {(['Hover', 'Pressionado', 'Foco'] as const).map((label, index) => (
            <figure key={label}>
              <ToastCard
                still
                title="Campanha excluída"
                action={{ label: 'Desfazer', onClick: () => undefined }}
                data-force={['hover', 'active', 'focus'][index]}
              />
              <figcaption className={x.caption}>{label}</figcaption>
            </figure>
          ))}
        </div>
      </Shot>

      <Shot title="Celular" align="center">
        <div className={x.phone} style={{ height: 560 }}>
          <TopBar
            breadcrumb={[{ label: 'Campanhas', href: '#' }, { label: 'Nova campanha' }]}
            sticky={false}
            menuButton="never"
          />
          <div className={x.phoneBody}>
            <h3 className={x.phoneTitle}>Nova campanha</h3>
            <Field label="Nome da campanha">
              {({ id }) => <Input id={id} readOnly value="Coleção Primavera-Verão 2027" />}
            </Field>
            <Field label="Verba" hint="Múltiplos de R$ 45,00">
              {({ id, describedBy }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  readOnly
                  prefix="R$"
                  value="18.000,00"
                />
              )}
            </Field>
          </div>
          <div className={x.phoneToast}>
            <ToastCard
              still
              progress
              title="Rascunho salvo"
              action={{ label: 'Desfazer', onClick: () => undefined }}
            />
          </div>
          <div className={x.phoneFoot}>
            <IconButton label="Voltar" icon={ArrowLeft} />
            <Button variant="ghost">Salvar rascunho</Button>
            <Button variant="primary" trailingIcon={ArrowRight}>
              Continuar
            </Button>
          </div>
        </div>
      </Shot>
      <EnsureToaster />
    </Shots>
  );
}

/* ——————————————————————————— Banner ——————————————————————————— */

type BannerKind = 'previa' | 'prazo' | 'sessao' | 'manutencao';

function BannerSample({
  kind,
  open = true,
  appear = false,
  deadline,
  onClose,
  variant = 'band',
}: {
  kind: BannerKind;
  open?: boolean;
  appear?: boolean;
  deadline?: Date | null;
  onClose?: () => void;
  variant?: 'band' | 'inline';
}) {
  const common = { open, appear, variant, className: x.swapIn };
  if (kind === 'previa')
    return (
      <Banner
        {...common}
        tone="info"
        icon={Eye}
        title="Prévia do anunciante Aurora Calçados"
        action={<LinkButton onClick={onClose}>Sair da prévia</LinkButton>}
      />
    );
  if (kind === 'prazo')
    return (
      <Banner
        {...common}
        tone="warning"
        title="Inscrições da Francal 2026 encerram em 3 dias"
        onDismiss={onClose}
      />
    );
  if (kind === 'sessao')
    return (
      <Banner
        {...common}
        tone="attention"
        title="Sessão expira em"
        countdown={deadline ? { to: deadline } : undefined}
        action={<LinkButton onClick={onClose}>Continuar conectado</LinkButton>}
      />
    );
  return (
    <Banner
      {...common}
      tone="neutral"
      icon={Wrench}
      title="Manutenção em 22/10 às 23:00"
      onDismiss={onClose}
    >
      Portal fora do ar por até 30 min
    </Banner>
  );
}

function BannerSpecimen() {
  const [kind, setKind] = useState<BannerKind>('previa');
  const [open, setOpen] = useState(true);
  const [shown, setShown] = useState(0);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const pick = (next: BannerKind) => {
    setKind(next);
    setOpen(true);
    if (next === 'sessao') setDeadline(new Date(Date.now() + 299_000));
  };
  const controls = (
    <div className={x.rowEnd}>
      <IconButton
        label="Mostrar de novo"
        icon={RotateCcw}
        variant="ghost"
        size="sm"
        disabled={open}
        onClick={() => {
          setShown((value) => value + 1);
          pick(kind);
        }}
      />
      <Segmented
        size="sm"
        label="Aviso"
        value={kind}
        onChange={pick}
        options={[
          { value: 'previa', label: 'Prévia' },
          { value: 'prazo', label: 'Prazo' },
          { value: 'sessao', label: 'Sessão' },
          { value: 'manutencao', label: 'Manutenção' },
        ]}
      />
    </div>
  );
  return (
    <Shots>
      <Shot
        title="Em contexto"
        align="stretch"
        aside={<div className={x.asideWide}>{controls}</div>}
      >
        <div className={x.slices}>
          <div className={x.stageCtl}>{controls}</div>
          <ShellFrame
            crumbs={CRUMBS_LIST}
            minHeight={420}
            banner={
              <BannerSample
                key={`${kind}-${shown}`}
                kind={kind}
                open={open}
                appear={shown > 0}
                deadline={deadline}
                onClose={() => setOpen(false)}
              />
            }
          >
            <PageHead
              action={
                <Button variant="primary" icon={Megaphone}>
                  Nova campanha
                </Button>
              }
            />
            <MiniList />
          </ShellFrame>
        </div>
      </Shot>

      <Shot title="Variantes" tone="white" align="stretch">
        <States min={360}>
          <State label="Faixa">
            <div className={`${x.shell} ${x.cellFill}`}>
              <TopBar breadcrumb={CRUMBS_LIST} sticky={false} menuButton="never" />
              <BannerSample kind="prazo" onClose={() => undefined} />
              <div className={x.frameBody} style={{ padding: '20px' }}>
                <Skeleton width="42%" height={14} />
                <Skeleton width="68%" height={10} />
              </div>
            </div>
          </State>
          <State label="Interno">
            <div className={`${x.frame} ${x.cellFill}`}>
              <div className={x.frameBody} style={{ padding: '20px' }}>
                <BannerSample kind="manutencao" variant="inline" onClose={() => undefined} />
                <Skeleton width="68%" height={10} />
              </div>
            </div>
          </State>
        </States>
      </Shot>

      <Shot title="Celular" align="center">
        <div className={x.phone}>
          <TopBar
            breadcrumb={CRUMBS_LIST}
            sticky={false}
            menuButton="never"
            notifications={<Bell24 unread />}
          />
          <BannerSample kind="previa" />
          <div className={x.phoneBody}>
            <div>
              <h3 className={x.phoneTitle}>Campanhas</h3>
              <p className={x.pageSub}>4 campanhas da Aurora Calçados.</p>
            </div>
            <MiniList rows={ROWS.slice(0, 2)} />
          </div>
        </div>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Progresso ——————————————————————————— */

const IMPORT_TOTAL = 1240;
const STEP_LABELS = [
  'Conferindo regras do ativo',
  'Gerando a campanha',
  'Notificando o comercial do portal',
];

function useTicker(active: boolean, ms: number, tick: () => void) {
  const saved = useRef(tick);
  useEffect(() => {
    saved.current = tick;
  });
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => saved.current(), ms);
    return () => window.clearInterval(timer);
  }, [active, ms]);
}

function Progresso() {
  const [round, setRound] = useState(0);
  const [upload, setUpload] = useState(62);
  const [canceled, setCanceled] = useState(false);
  const [imported, setImported] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  useTicker(!canceled && upload < 100, 420, () => setUpload((value) => Math.min(100, value + 5)));
  useTicker(imported < IMPORT_TOTAL, 160, () =>
    setImported((value) => Math.min(IMPORT_TOTAL, value + 31)),
  );
  useTicker(stepIndex < STEP_LABELS.length, 720, () => setStepIndex((value) => value + 1));

  const restart = () => {
    setRound((value) => value + 1);
    setUpload(0);
    setCanceled(false);
    setImported(0);
    setStepIndex(0);
  };
  const mb = (pct: number) =>
    (1.9 * (pct / 100)).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  const steps: ProgressStep[] = STEP_LABELS.map((label, index) => ({
    label,
    state: index < stepIndex ? 'done' : index === stepIndex ? 'current' : 'upcoming',
    meta: index === 1 ? '#2041' : undefined,
  }));
  const importCaption =
    imported >= IMPORT_TOTAL
      ? '1.240 leads importados'
      : imported < IMPORT_TOTAL / 2
        ? 'Validando linhas…'
        : 'Gravando leads…';

  return (
    <Shots>
      <Shot
        title="Em contexto"
        align="stretch"
        aside={
          <Button size="sm" variant="ghost" icon={RotateCcw} onClick={restart}>
            Repetir
          </Button>
        }
      >
        <div className={x.split}>
          <Frame>
            <PanelHead title="Peça criativa" meta="970 × 250 · até 2 MB" />
            {canceled ? (
              <EmptyState
                size="inline"
                title="Envio cancelado"
                actions={
                  <LinkButton
                    onClick={() => {
                      setCanceled(false);
                      setUpload(0);
                    }}
                  >
                    Enviar de novo
                  </LinkButton>
                }
              />
            ) : (
              <div className={x.upload}>
                <FileImage aria-hidden="true" />
                <Progress
                  key={round}
                  size="sm"
                  label="peca-970x250.png"
                  value={upload}
                  valueText={`${mb(upload)} de 1,9 MB`}
                />
                <IconButton
                  className={x.uploadClose}
                  label={upload >= 100 ? 'Remover arquivo' : 'Cancelar envio'}
                  icon={upload >= 100 ? Trash2 : X}
                  variant="ghost"
                  size="sm"
                  tone={upload >= 100 ? 'danger' : undefined}
                  style={{ width: 24, height: 24 }}
                  onClick={() => setCanceled(true)}
                />
              </div>
            )}
          </Frame>
          <Frame>
            <PanelHead title="Importar leads" meta="leads-francal-2026.csv" />
            <div className={x.stackTight}>
              <Progress
                key={round}
                label={`Importando ${IMPORT_TOTAL.toLocaleString('pt-BR')} leads`}
                value={imported}
                max={IMPORT_TOTAL}
                valueText={`${imported.toLocaleString('pt-BR')} de ${IMPORT_TOTAL.toLocaleString('pt-BR')}`}
              />
              <span className={x.stepCaption} role="status">
                {importCaption}
              </span>
            </div>
          </Frame>
          <Frame>
            <PanelHead title="Entrega" meta="01/10 – 31/10" />
            <div className={x.stack} style={{ gap: 20 }}>
              <Progress
                label="Coleção Primavera-Verão no portal"
                value={68}
                valueText="68% de ≈ 400.000 impressões"
              />
              <Progress
                label="Newsletter dos expositores"
                value={56}
                valueText="56% de ≈ 120.000 envios"
              />
            </div>
          </Frame>
          <Frame>
            <div className={x.dialogMock}>
              <h4 className={x.dialogTitle}>Coleção Primavera-Verão 2027</h4>
              <div className={x.factsClip}>
                <p className={x.detailFacts} data-size="sm">
                  <span>{money(18000)}</span>
                  <span>01/10 – 31/10</span>
                  <span>Aurora Calçados</span>
                </p>
              </div>
            </div>
            <ProgressSteps key={round} label="Enviando para aprovação" steps={steps} />
          </Frame>
        </div>
      </Shot>

      <Shot title="Estados" tone="white" align="stretch">
        <States min={240}>
          <State label="0%">
            <div className={x.cellFill}>
              <Progress label="Importando leads" value={0} valueText="0 de 1.240" />
            </div>
          </State>
          <State label="Em andamento">
            <div className={x.cellFill}>
              <Progress label="Importando leads" value={62} valueText="770 de 1.240" />
            </div>
          </State>
          <State label="Indeterminado">
            <div className={x.cellFill}>
              <Progress label="Preparando o arquivo" />
            </div>
          </State>
          <State label="Concluído">
            <div className={x.cellFill}>
              <Progress label="Importando leads" value={100} />
            </div>
          </State>
          <State label="Atenção">
            <div className={x.cellFill}>
              <Progress
                label="Entrega abaixo do ritmo"
                tone="warning"
                value={34}
                valueText="34% · meta 50%"
              />
            </div>
          </State>
          <State label="Falhou">
            <div className={x.cellFill}>
              <Progress
                label="Importando leads"
                tone="danger"
                value={48}
                end={<LinkButton>Tentar de novo</LinkButton>}
              />
            </div>
          </State>
        </States>
      </Shot>

      <Shot title="Tamanhos" tone="white" align="stretch">
        <States min={280}>
          <State label="Médio · 4 px">
            <div className={x.cellFill}>
              <Progress label="Impressões entregues" value={68} />
            </div>
          </State>
          <State label="Pequeno · 3 px">
            <div className={x.cellFill}>
              <Progress label="peca-970x250.png" size="sm" value={62} valueText="1,2 de 1,9 MB" />
            </div>
          </State>
        </States>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Spinner ——————————————————————————— */

const LEADS = [
  { name: 'Juliana Prates', company: 'Couro Nobre', when: 'há 5 min' },
  { name: 'Tiago Rezende', company: 'Pátio Couro', when: 'há 18 min' },
  { name: 'Clara Souto', company: 'Bella Passo', when: 'há 1 h' },
];

function SpinnerSpecimen() {
  const [sending, setSending] = useState(false);
  const [url, setUrl] = useState('https://auroracalcados.com.br/primavera');
  const [checking, setChecking] = useState(false);
  const [speed, setSpeed] = useState<'fast' | 'slow'>('slow');
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [round, setRound] = useState(0);
  const check = useRef<number | undefined>(undefined);
  const load = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(check.current), []);
  useEffect(() => () => window.clearTimeout(load.current), []);

  const reload = (next: 'fast' | 'slow') => {
    setSpeed(next);
    setLoadingLeads(true);
    window.clearTimeout(load.current);
    load.current = window.setTimeout(
      () => {
        setLoadingLeads(false);
        setRound((value) => value + 1);
      },
      next === 'fast' ? 200 : 2000,
    );
  };

  return (
    <Shots>
      <Shot title="Em contexto" align="stretch">
        <div className={x.slices}>
          <Frame body={false} className={x.frameClip}>
            <div className={x.frameBody}>
              <PanelHead title="Briefing" meta="Etapa 5 de 6" />
              <div style={{ maxWidth: 480 }}>
                <Field label="URL de destino" hint="https:// · validada ao digitar">
                  {({ id, describedBy }) => (
                    <Input
                      id={id}
                      aria-describedby={describedBy}
                      value={url}
                      status={checking ? undefined : 'valid'}
                      trailing={
                        checking ? (
                          <span className={x.slot16}>
                            <Spinner size={14} tone="muted" label="Validando o endereço" />
                          </span>
                        ) : undefined
                      }
                      aria-busy={checking || undefined}
                      onChange={(event) => {
                        setUrl(event.target.value);
                        setChecking(true);
                        window.clearTimeout(check.current);
                        check.current = window.setTimeout(() => setChecking(false), 1100);
                      }}
                    />
                  )}
                </Field>
              </div>
            </div>
            <div className={x.footBar}>
              <span />
              <Button variant="ghost" className={x.hideSm}>
                Salvar rascunho
              </Button>
              <Button
                variant="primary"
                icon={Send}
                loading={sending}
                onClick={async () => {
                  setSending(true);
                  await wait(1800);
                  setSending(false);
                }}
              >
                Enviar para aprovação
              </Button>
            </div>
          </Frame>
          <div className={x.split}>
            <Frame>
              <PanelHead title="Leads recentes">
                <Segmented
                  size="sm"
                  label="Tempo de resposta"
                  value={speed}
                  onChange={reload}
                  options={[
                    { value: 'fast', label: 'Rápido · 200 ms' },
                    { value: 'slow', label: 'Lento · 2 s' },
                  ]}
                />
              </PanelHead>
              <div className={x.leadBody} aria-busy={loadingLeads || undefined}>
                {loadingLeads ? (
                  <div className={x.leadWait}>
                    <Spinner size={20} tone="accent" label="Carregando leads" />
                  </div>
                ) : (
                  <div key={round} className={`${x.leadList} ${round > 0 ? x.fadeIn : ''}`}>
                    {LEADS.map((lead) => (
                      <div key={lead.name} className={x.lead}>
                        <Avatar name={lead.name} size="sm" decorative />
                        <div className={`${x.recordText} ${x.grow}`}>
                          <span className={x.recordName}>{lead.name}</span>
                          <span className={x.recordMeta}>
                            {lead.company} · Formulário da vitrine
                          </span>
                        </div>
                        <span className={x.recordMeta}>{lead.when}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Frame>
            <Frame body={false} className={x.frameClip}>
              <div className={x.frameBody} style={{ paddingBottom: 12 }}>
                <PanelHead title="Campanhas" meta="1–3 de 17" />
              </div>
              <MiniListFlat />
              <div className={x.tableFoot}>
                <Spinner size={16} tone="muted" delay={0} />
                Carregando mais
              </div>
            </Frame>
          </div>
        </div>
      </Shot>

      <Shot title="Tamanhos" tone="white" align="stretch">
        <Matrix
          head={['14', '16', '20', '24']}
          rows={[
            {
              label: 'Atual',
              ink: true,
              cells: ([14, 16, 20, 24] as const).map((size) => (
                <Spinner key={size} size={size} delay={0} />
              )),
            },
            {
              label: 'Acento',
              cells: ([14, 16, 20, 24] as const).map((size) => (
                <Spinner key={size} size={size} tone="accent" delay={0} />
              )),
            },
            {
              label: 'Discreto',
              cells: ([14, 16, 20, 24] as const).map((size) => (
                <Spinner key={size} size={size} tone="muted" delay={0} />
              )),
            },
          ]}
        />
      </Shot>
    </Shots>
  );
}

function MiniListFlat() {
  return (
    <div className={`${x.mini} ${x.flatRows}`} style={{ border: 0, borderRadius: 0 }}>
      {ROWS.slice(0, 3).map((row) => (
        <div key={row.id} className={x.miniRow}>
          <div className={x.recordText}>
            <span className={x.recordName}>{row.name}</span>
            <span className={x.recordMeta}>{row.advertiser}</span>
          </div>
          <Status row={row} />
          <span className={x.miniMoney}>{money(row.budget)}</span>
        </div>
      ))}
    </div>
  );
}

/* ——————————————————————————— Esqueleto ——————————————————————————— */

function ListHead() {
  return (
    <div className={`${x.lRow} ${x.lHead}`} aria-hidden="true">
      <span />
      <span />
      <span>Campanha</span>
      <span>Anunciante</span>
      <span>Status</span>
      <span className={x.lEnd}>Verba</span>
      <span>Período</span>
      <span />
    </div>
  );
}

function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }, (_, index) => {
        const delay = index * 80;
        const nameW = ['62%', '54%', '66%', '48%', '58%'][index % 5];
        return (
          <div key={index} className={x.lRow}>
            <Skeleton width={18} height={18} radius={4.5} delay={delay} />
            <Skeleton width={30} height={17} radius="var(--r-full)" delay={delay} />
            <span className={x.lName}>
              <Skeleton width={nameW} height={12} delay={delay} />
              <Skeleton width="40%" height={10} delay={delay} />
            </span>
            <span className={x.lCell}>
              <Skeleton shape="circle" width={20} delay={delay} />
              <Skeleton width="60%" height={12} delay={delay} />
            </span>
            <span className={x.lCell}>
              <Skeleton shape="circle" width={6} delay={delay} />
              <Skeleton width={72} height={12} delay={delay} />
            </span>
            <Skeleton width={72} height={12} delay={delay} className={x.lEnd} />
            <Skeleton width={64} height={12} delay={delay} />
            <span className={x.lActsSkel}>
              {[0, 1, 2].map((key) => (
                <span key={key}>
                  <Skeleton width={16} height={16} radius={4} delay={delay} />
                </span>
              ))}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ListRows() {
  const [on, setOn] = useState<Record<number, boolean>>({ 2041: true, 2038: true });
  return (
    <div>
      {ROWS.map((row) => (
        <div key={row.id} className={x.lRow}>
          <Checkbox aria-label={`Selecionar ${row.name}`} />
          <Switch
            size="sm"
            hideLabel
            label={`Veiculação de ${row.name}`}
            checked={Boolean(on[row.id])}
            onCheckedChange={(value) => setOn((prev) => ({ ...prev, [row.id]: value }))}
          />
          <span className={x.recordText}>
            <span className={x.recordName}>{row.name}</span>
            <span className={x.recordMeta}>
              {row.asset} · #{row.id}
            </span>
          </span>
          <span className={x.lCell}>
            <BrandMark name={row.advertiser} size="xs" decorative />
            <span className={x.lText}>{row.advertiser}</span>
          </span>
          <Status row={row} />
          <span className={x.lMoney}>{money(row.budget)}</span>
          <span className={x.lPeriod}>{row.period}</span>
          <span className={x.lActs}>
            <IconButton label="Métricas" icon={ChartColumn} variant="ghost" size="sm" />
            <IconButton label="Editar" icon={Pencil} variant="ghost" size="sm" />
            <IconButton label="Excluir" icon={Trash2} variant="ghost" size="sm" tone="danger" />
          </span>
        </div>
      ))}
    </div>
  );
}

const KPIS = [
  { label: 'Entrega estimada', value: '≈ 300.000', sub: 'impressões' },
  { label: 'Verba', value: money(13500), sub: 'CPM' },
  { label: 'Duração', value: '31 dias', sub: 'de veiculação' },
  { label: 'Público potencial', value: '69.800', sub: 'pessoas em 2 públicos' },
];
const PROPS: { label: string; value: ReactNode; bar: string }[] = [
  {
    label: 'Anunciante',
    value: (
      <>
        <BrandMark name="Grupo Horizonte" size="xs" decorative />
        Grupo Horizonte
      </>
    ),
    bar: '32%',
  },
  { label: 'Ativo', value: 'Banner Super Topo — Portal', bar: '44%' },
  { label: 'Modelo de precificação', value: 'CPM · R$ 45,00 / mil impressões', bar: '52%' },
  { label: 'Período', value: '01/10/2026 – 31/10/2026 · 31 dias', bar: '48%' },
];

function KpiStrip({ loading }: { loading: boolean }) {
  return (
    <div className={x.kpis}>
      {KPIS.map((kpi, index) =>
        loading ? (
          <div key={kpi.label} className={x.kpi}>
            <Skeleton width={88} height={10} />
            <Skeleton width={[96, 120, 64, 72][index]} height={16} />
            <Skeleton width={64} height={9} />
          </div>
        ) : (
          <div key={kpi.label} className={x.kpi}>
            <span className={x.kpiLabel}>{kpi.label}</span>
            <span className={x.kpiValue}>{kpi.value}</span>
            <span className={x.kpiSub}>{kpi.sub}</span>
          </div>
        ),
      )}
    </div>
  );
}

function Props({ loading }: { loading: boolean }) {
  return (
    <div className={x.props}>
      {PROPS.map((prop, index) => (
        <div key={prop.label} className={x.prop}>
          {loading ? (
            <>
              <span className={x.propLabel}>
                <Skeleton width={[72, 40, 120, 56][index]} height={10} delay={index * 80} />
              </span>
              <span className={x.propValue}>
                <Skeleton width={prop.bar} height={12} delay={index * 80} />
              </span>
            </>
          ) : (
            <>
              <span className={x.propLabel}>{prop.label}</span>
              <span className={x.propValue}>{prop.value}</span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function SkeletonSpecimen() {
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const trigger = () => {
    if (!loaded) {
      setLoading(false);
      setLoaded(true);
      return;
    }
    setLoading(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setLoading(false), 1400);
  };
  return (
    <Shots>
      <Shot
        title="Em contexto"
        align="stretch"
        aside={
          <Button
            size="sm"
            icon={loaded ? RotateCcw : Download}
            loading={loaded && loading}
            onClick={trigger}
          >
            {loaded ? 'Recarregar' : 'Carregar'}
          </Button>
        }
      >
        <div className={x.slices}>
          <Frame body={false} className={`${x.list} ${x.frameClip}`}>
            <ListHead />
            <LoadingSwap loading={loading} label="Carregando campanhas" skeleton={<ListSkeleton />}>
              <ListRows />
            </LoadingSwap>
            <div className={x.lFoot}>
              {loading ? <Skeleton width={132} height={10} /> : <span>1–5 de 17 campanhas</span>}
            </div>
          </Frame>
          <Frame>
            <LoadingSwap
              loading={loading}
              label="Carregando resumo"
              skeleton={<KpiStrip loading />}
            >
              <KpiStrip loading={false} />
            </LoadingSwap>
            <PanelHead title="Configuração" />
            <LoadingSwap
              loading={loading}
              label="Carregando configuração"
              skeleton={<Props loading />}
            >
              <Props loading={false} />
            </LoadingSwap>
          </Frame>
        </div>
      </Shot>

      <Shot title="Formas" tone="white" align="stretch">
        <States min={200}>
          <State label="Texto">
            <div className={x.cellFill} style={{ maxWidth: 240 }}>
              <SkeletonText lines={3} />
            </div>
          </State>
          <State label="Círculo">
            <SkeletonRegion>
              <div className={x.record}>
                <Skeleton shape="circle" width={32} />
                <Skeleton shape="circle" width={20} />
              </div>
            </SkeletonRegion>
          </State>
          <State label="Bloco">
            <SkeletonRegion>
              <Skeleton shape="block" width={176} height={88} />
            </SkeletonRegion>
          </State>
          <State label="Linhas">
            <div className={x.cellFill}>
              <SkeletonRows
                rows={3}
                rowHeight={40}
                columns={[
                  { lead: true, bar: '70%' },
                  { width: 72, bar: 56, align: 'end' },
                ]}
              />
            </div>
          </State>
        </States>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Estado vazio ——————————————————————————— */

function TableShell({ children, rows = false }: { children: ReactNode; rows?: boolean }) {
  return (
    <div className={x.tableShell}>
      <div className={x.tableHead} aria-hidden="true">
        <span>Campanha</span>
        <span>Anunciante</span>
        <span>Status</span>
        <span>Verba</span>
      </div>
      <div className={x.tableBody} data-rows={rows || undefined}>
        {children}
      </div>
    </div>
  );
}

function PlainRows({ rows, flat = false }: { rows: Row[]; flat?: boolean }) {
  return (
    <div className={`${x.mini} ${flat ? x.flatRows : ''}`} style={{ border: 0, borderRadius: 0 }}>
      {rows.map((row) => (
        <div key={row.id} className={x.miniRow} style={{ gridTemplateColumns: undefined }}>
          <div className={x.recordText}>
            <span className={x.recordName}>{row.name}</span>
            <span className={x.recordMeta}>{row.advertiser}</span>
          </div>
          <Status row={row} />
          <span className={x.miniMoney}>{money(row.budget)}</span>
        </div>
      ))}
    </div>
  );
}

function EstadoVazio() {
  const [query, setQuery] = useState('couro azul');
  const [tab, setTab] = useState<'todas' | 'aprovacao'>('aprovacao');
  const matches = [...ROWS, ...MORE].filter((row) =>
    `${row.name} ${row.advertiser}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <Shots>
      <Shot title="Em contexto" align="stretch">
        <div className={x.slices}>
          <TableShell>
            <EmptyState
              size="page"
              icon={Megaphone}
              title="Nenhuma campanha ainda"
              actions={
                <Button variant="primary" icon={Megaphone}>
                  Nova campanha
                </Button>
              }
            />
          </TableShell>
          <div className={x.split}>
            <Frame>
              <SearchField
                value={query}
                onValueChange={setQuery}
                label="Buscar campanha"
                placeholder="Campanha ou anunciante"
              />
              <div style={{ minHeight: 188, display: 'grid' }}>
                {matches.length === 0 ? (
                  <EmptyState
                    title={`Nada encontrado para “${query.trim()}”`}
                    actions={
                      <Button size="sm" onClick={() => setQuery('')}>
                        Limpar busca
                      </Button>
                    }
                  />
                ) : (
                  <div className={x.fadeIn}>
                    <PlainRows rows={matches.slice(0, 4)} />
                  </div>
                )}
              </div>
            </Frame>
            <Frame>
              <Tabs
                label="Recorte"
                value={tab}
                onChange={setTab}
                items={[
                  { value: 'todas', label: 'Todas', count: 17 },
                  { value: 'aprovacao', label: 'Em aprovação', count: 0 },
                ]}
              />
              <div style={{ minHeight: 188, display: 'grid' }}>
                {tab === 'aprovacao' ? (
                  <EmptyState
                    title="Nenhuma campanha em aprovação"
                    actions={<LinkButton onClick={() => setTab('todas')}>Ver todas</LinkButton>}
                  />
                ) : (
                  <div className={x.fadeIn}>
                    <PlainRows rows={ROWS.slice(0, 4)} />
                  </div>
                )}
              </div>
            </Frame>
          </div>
          <div className={x.splitAside}>
            <Frame>
              <PanelHead title="Leads recentes" />
              <EmptyState size="inline" title="Nenhum lead ainda" />
            </Frame>
            <Frame>
              <div className={x.kanban}>
                <div className={x.kCol}>
                  <div className={x.kHead}>
                    <Badge variant="text" tone="orange">
                      Ajustes solicitados
                    </Badge>
                    <span className={x.kCount}>2</span>
                  </div>
                  <div className={x.kCards}>
                    {[ROWS[4], MORE[0]].map(
                      (row) =>
                        row && (
                          <div key={row.id} className={x.kCard}>
                            <span className={x.recordName}>{row.name}</span>
                            <span className={x.recordMeta}>
                              {row.advertiser} · {money(row.budget)}
                            </span>
                          </div>
                        ),
                    )}
                  </div>
                </div>
                <div className={x.kCol}>
                  <div className={x.kHead}>
                    <Badge variant="text" tone="violet">
                      Em aprovação
                    </Badge>
                    <span className={x.kCount}>0</span>
                  </div>
                  <div className={x.kDrop}>Solte aqui</div>
                </div>
              </div>
            </Frame>
          </div>
        </div>
      </Shot>

      <Shot title="Tamanhos" tone="white" align="stretch">
        <States min={260}>
          <State label="Página">
            <Frame className={x.cellFill} body={false}>
              <EmptyState
                size="page"
                icon={Megaphone}
                title="Nenhuma campanha ainda"
                actions={
                  <Button variant="primary" icon={Megaphone}>
                    Nova campanha
                  </Button>
                }
              />
            </Frame>
          </State>
          <State label="Painel">
            <Frame className={x.cellFill} body={false}>
              <EmptyState
                title="Nenhuma campanha em aprovação"
                actions={<LinkButton>Ver todas</LinkButton>}
              />
            </Frame>
          </State>
          <State label="Linha">
            <Frame className={x.cellFill}>
              <EmptyState
                size="inline"
                title="Nenhum lead ainda"
                actions={<LinkButton>Compartilhar vitrine</LinkButton>}
              />
            </Frame>
          </State>
        </States>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Estado de erro ——————————————————————————— */

const DAYS = [
  { label: '16', value: 12_400 },
  { label: '17', value: 14_100 },
  { label: '18', value: 13_200 },
  { label: '19', value: 15_800 },
  { label: '20', value: 16_900 },
  { label: '21', value: 11_300 },
  { label: '22', value: 9_600 },
];

function ChartBody() {
  return (
    <BarChart
      label="Impressões por dia"
      height={180}
      data={DAYS.map((day) => ({
        label: day.label,
        title: `${day.label}/10/2026`,
        values: { imp: day.value },
      }))}
      series={[{ key: 'imp', label: 'Impressões' }]}
      highlight={DAYS.length - 1}
      format={(value) => value.toLocaleString('pt-BR')}
    />
  );
}

type Load = 'error' | 'retrying' | 'ok';

function EstadoErro() {
  const [chart, setChart] = useState<Load>('error');
  const [table, setTable] = useState<Load>('error');
  const [page, setPage] = useState<Load>('error');
  const [left, setLeft] = useState(5);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    if (reconnecting) {
      const timer = window.setTimeout(() => {
        setReconnecting(false);
        setLeft(5);
      }, 1200);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      if (left <= 1) setReconnecting(true);
      else setLeft(left - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [left, reconnecting]);

  const retry = (set: (value: Load) => void) => async () => {
    set('retrying');
    await wait(800);
    set('ok');
  };

  return (
    <Shots>
      <Shot
        title="Em contexto"
        align="stretch"
        aside={
          <Button
            size="sm"
            variant="ghost"
            icon={RotateCcw}
            onClick={() => {
              setChart('error');
              setTable('error');
              setPage('error');
            }}
          >
            Simular falha
          </Button>
        }
      >
        <div className={x.slices}>
          <div className={x.split}>
            <ChartCard title="Impressões por dia" description="16/10 – 22/10">
              <ChartSwap id={chart === 'ok' ? 'ok' : 'err'} minHeight={180}>
                {chart === 'ok' ? (
                  <ChartBody />
                ) : (
                  <ErrorState
                    title="Não foi possível carregar o gráfico"
                    code={503}
                    time="22/10 16:40"
                    retrying={chart === 'retrying'}
                    onRetry={retry(setChart)}
                  />
                )}
              </ChartSwap>
            </ChartCard>
            <Frame body={false} className={x.frameClip}>
              <div className={x.frameBody} style={{ paddingBottom: 12 }}>
                <PanelHead title="Campanhas" meta={table === 'ok' ? '6 de 6' : '3 de 6'} />
              </div>
              <PlainRows
                flat
                rows={table === 'ok' ? [...ROWS.slice(0, 3), ...MORE] : ROWS.slice(0, 3)}
              />
              {table !== 'ok' && (
                <div
                  className={x.tableFoot}
                  style={{ justifyContent: 'flex-start', padding: '0 20px' }}
                >
                  {table === 'retrying' ? (
                    <EmptyState
                      size="inline"
                      title={
                        <span className={x.record} style={{ gap: 8 }}>
                          <Spinner size={14} tone="muted" delay={0} />
                          Carregando 3 campanhas
                        </span>
                      }
                    />
                  ) : (
                    <ErrorState
                      size="inline"
                      title="Não foi possível carregar 3 campanhas"
                      onRetry={retry(setTable)}
                    />
                  )}
                </div>
              )}
            </Frame>
          </div>
          <ShellFrame crumbs={CRUMBS_LIST} minHeight={360} center>
            {page === 'ok' ? (
              <div className={`${x.stack} ${x.fadeIn}`} style={{ alignSelf: 'start', gap: 24 }}>
                <PageHead />
                <MiniList />
              </div>
            ) : (
              <ErrorState
                size="page"
                heading="h3"
                title="Algo deu errado"
                description="A página não carregou. Seus dados estão salvos."
                code={500}
                time="22/10 16:42"
                retrying={page === 'retrying'}
                onRetry={retry(setPage)}
                actions={<Button icon={ArrowLeft}>Voltar para campanhas</Button>}
              />
            )}
          </ShellFrame>
          <ShellFrame
            crumbs={CRUMBS_LIST}
            banner={
              <Banner
                tone="warning"
                icon={WifiOff}
                title="Sem conexão"
                action={
                  <LinkButton onClick={() => setReconnecting(true)} disabled={reconnecting}>
                    Tentar agora
                  </LinkButton>
                }
              >
                {/* A contagem muda a cada segundo: fora da região viva, para não ser lida em voz alta. */}
                <span aria-live="off">
                  {reconnecting ? (
                    'Tentando de novo…'
                  ) : (
                    <>
                      Tentando de novo em <span className="num">{left}</span> s
                    </>
                  )}
                </span>
              </Banner>
            }
          >
            <PageHead />
            <MiniList rows={ROWS.slice(0, 2)} />
          </ShellFrame>
        </div>
      </Shot>

      <Shot title="Estados" tone="white" align="stretch">
        <States min={260}>
          <State label="Erro">
            <div className={x.cellFill}>
              <ChartCard title="Impressões por dia">
                <ErrorState
                  title="Não foi possível carregar o gráfico"
                  code={503}
                  time="22/10 16:40"
                  onRetry={() => undefined}
                />
              </ChartCard>
            </div>
          </State>
          <State label="Tentando">
            <div className={x.cellFill}>
              <ChartCard title="Impressões por dia">
                <ErrorState
                  title="Não foi possível carregar o gráfico"
                  code={503}
                  time="22/10 16:40"
                  retrying
                  onRetry={() => undefined}
                />
              </ChartCard>
            </div>
          </State>
          <State label="Recuperado">
            <div className={x.cellFill}>
              <ChartCard title="Impressões por dia">
                <ChartBody />
              </ChartCard>
            </div>
          </State>
        </States>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Estados de acesso ——————————————————————————— */

type AccessView = 'restrito' | 'sessao' | 'nao-encontrada' | 'bloqueada';

const ACCESS_CRUMBS: Record<AccessView, Crumb[]> = {
  restrito: [{ label: 'Operação', href: '#' }, { label: 'Pedidos de Inserção' }],
  sessao: [
    { label: 'Campanhas', href: '#' },
    { label: 'Coleção Primavera-Verão no portal', href: '#' },
    { label: 'Editar' },
  ],
  'nao-encontrada': [
    { label: 'Operação', href: '#' },
    { label: 'Campanhas', href: '#' },
    { label: 'Campanha não encontrada' },
  ],
  bloqueada: [
    { label: 'Operação', href: '#' },
    { label: 'Campanhas', href: '#' },
    { label: 'Coleção Primavera-Verão no portal' },
  ],
};

/** Um botão só do começo ao fim: o foco fica nele quando vira “Pedido enviado”. */
function RequestAccess() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const sent = state === 'sent';
  return (
    <>
      <Button
        variant={sent ? 'secondary' : 'primary'}
        icon={sent ? Check : Send}
        loading={state === 'sending'}
        aria-disabled={sent || undefined}
        onClick={async () => {
          setState('sending');
          await wait(900);
          setState('sent');
        }}
      >
        {sent ? 'Pedido enviado' : 'Pedir acesso'}
      </Button>
      <VisuallyHidden role="status">
        {sent ? 'Pedido de acesso enviado ao admin do portal' : ''}
      </VisuallyHidden>
    </>
  );
}

function AccessBlock({ view }: { view: Exclude<AccessView, 'sessao'> }) {
  const kind: Record<typeof view, AccessKind> = {
    restrito: 'restricted',
    'nao-encontrada': 'not-found',
    bloqueada: 'locked',
  };
  if (view === 'restrito')
    return (
      <AccessState
        kind={kind[view]}
        heading="h3"
        title="Você não tem acesso a Pedidos de inserção"
        description="Peça acesso ao admin do portal."
        actions={<RequestAccess />}
      />
    );
  if (view === 'nao-encontrada')
    return (
      <AccessState
        kind={kind[view]}
        heading="h3"
        title="Campanha não encontrada"
        actions={
          <Button variant="primary" icon={ArrowLeft}>
            Voltar para campanhas
          </Button>
        }
      />
    );
  return (
    <AccessState
      kind={kind[view]}
      heading="h3"
      title="Esta campanha não pode ser editada"
      meta="Status atual: Veiculando"
      actions={
        <>
          <Button variant="primary">Ver a campanha</Button>
          <Button>Voltar para campanhas</Button>
        </>
      }
    />
  );
}

function FormMock() {
  return (
    <div className={x.formMock}>
      <Field label="Nome da campanha">
        {({ id }) => <Input id={id} readOnly value="Coleção Primavera-Verão no portal" />}
      </Field>
      <Field label="Verba">
        {({ id }) => <Input id={id} readOnly prefix="R$" value="18.000,00" />}
      </Field>
      <Field label="Período">
        {({ id }) => <Input id={id} readOnly icon={CalendarDays} value="01/10 – 31/10" />}
      </Field>
    </div>
  );
}

function SessionDialog({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    button.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div className={x.veil}>
      <div
        className={x.sessionDialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dsv3-session-title"
        aria-describedby="dsv3-session-text"
      >
        <div className={x.sessionBody}>
          <h3 id="dsv3-session-title" className={x.sessionTitle}>
            Sua sessão expirou
          </h3>
          <p id="dsv3-session-text" className={x.sessionText}>
            O que você preencheu fica salvo.
          </p>
        </div>
        <div className={x.sessionFoot}>
          <Button
            ref={button}
            variant="primary"
            trailingIcon={ArrowRight}
            loading={busy}
            onClick={async () => {
              setBusy(true);
              await wait(900);
              onDone();
            }}
          >
            Entrar de novo
          </Button>
        </div>
      </div>
    </div>
  );
}

function EstadosAcesso() {
  const [view, setView] = useState<AccessView>('restrito');
  const [expired, setExpired] = useState(true);
  const [round, setRound] = useState(0);
  const controls = (
    <div className={x.rowEnd}>
      <Segmented
        size="sm"
        label="Situação"
        value={view}
        onChange={(next) => {
          setView(next);
          setExpired(true);
          setRound((value) => value + 1);
        }}
        options={[
          { value: 'restrito', label: 'Restrito' },
          { value: 'sessao', label: 'Sessão' },
          { value: 'nao-encontrada', label: 'Não encontrada' },
          { value: 'bloqueada', label: 'Bloqueada' },
        ]}
      />
    </div>
  );
  return (
    <Shots>
      <Shot
        title="Em contexto"
        align="stretch"
        aside={<div className={x.asideWide}>{controls}</div>}
      >
        <div className={x.slices}>
          <div className={x.stageCtl}>{controls}</div>
          <ShellFrame
            key={round}
            crumbs={ACCESS_CRUMBS[view]}
            minHeight={440}
            center={view !== 'sessao'}
            overlay={
              view === 'sessao' && expired ? (
                <SessionDialog
                  onDone={() => {
                    setExpired(false);
                    toast('Sessão renovada', { progress: true });
                  }}
                />
              ) : undefined
            }
          >
            {view === 'sessao' ? (
              <div
                className={`${x.stack} ${expired ? x.blurred : x.unblurred}`}
                style={{ gap: 24 }}
                aria-hidden={expired || undefined}
              >
                <PageHead title="Editar campanha" sub="#2041 · Aurora Calçados" />
                <FormMock />
              </div>
            ) : (
              <AccessBlock view={view} />
            )}
          </ShellFrame>
        </div>
      </Shot>

      <Shot title="Variantes" tone="white" align="stretch">
        <States min={360}>
          <State label="Restrito">
            <Frame className={`${x.cellFill} ${x.accessCell}`} body={false}>
              <AccessState
                kind="restricted"
                title="Você não tem acesso a Pedidos de inserção"
                description="Peça acesso ao admin do portal."
                actions={
                  <Button variant="primary" icon={Send}>
                    Pedir acesso
                  </Button>
                }
              />
            </Frame>
          </State>
          <State label="Sessão expirada">
            <Frame className={`${x.cellFill} ${x.accessCell}`} body={false}>
              <AccessState
                kind="expired"
                title="Sua sessão expirou"
                description="O que você preencheu fica salvo."
                actions={
                  <Button variant="primary" trailingIcon={ArrowRight}>
                    Entrar de novo
                  </Button>
                }
              />
            </Frame>
          </State>
          <State label="Não encontrada">
            <Frame className={`${x.cellFill} ${x.accessCell}`} body={false}>
              <AccessState
                kind="not-found"
                title="Campanha não encontrada"
                actions={
                  <Button variant="primary" icon={ArrowLeft}>
                    Voltar para campanhas
                  </Button>
                }
              />
            </Frame>
          </State>
          <State label="Edição bloqueada">
            <Frame className={`${x.cellFill} ${x.accessCell}`} body={false}>
              <AccessState
                kind="locked"
                title="Esta campanha não pode ser editada"
                meta="Status atual: Veiculando"
                actions={
                  <>
                    <Button variant="primary">Ver a campanha</Button>
                    <Button>Voltar para campanhas</Button>
                  </>
                }
              />
            </Frame>
          </State>
        </States>
      </Shot>

      <Shot title="Celular" align="center">
        <div className={x.phone} style={{ minHeight: 520 }}>
          <TopBar
            breadcrumb={ACCESS_CRUMBS['nao-encontrada']}
            sticky={false}
            menuButton="never"
            notifications={<Bell24 />}
          />
          <div className={x.center} style={{ flex: 1 }}>
            <AccessState
              kind="not-found"
              title="Campanha não encontrada"
              actions={
                <Button variant="primary" icon={ArrowLeft}>
                  Voltar para campanhas
                </Button>
              }
            />
          </div>
        </div>
      </Shot>
      <EnsureToaster />
    </Shots>
  );
}

/* ——————————————————————————— Notificações ——————————————————————————— */

const NOTIFS: { group: string; entry: NotificationEntry }[] = [
  {
    group: 'Hoje',
    entry: {
      id: 'n1',
      leading: <BrandMark name="Aurora Calçados" size="xs" decorative />,
      title: 'Aurora Calçados assinou o P.I. 2026-0400',
      meta: 'há 12 min · Coleção Primavera-Verão',
      unread: true,
    },
  },
  {
    group: 'Hoje',
    entry: {
      id: 'n2',
      leading: <Avatar name="Marina Lopes" size="xs" decorative />,
      title: 'Marina Lopes pediu ajustes em Retargeting de credenciados',
      meta: 'há 1 h · Grupo Horizonte',
      unread: true,
    },
  },
  {
    group: 'Hoje',
    entry: {
      id: 'n3',
      leading: <NotificationDot tone="green" />,
      title: 'Coleção Primavera-Verão começou a veicular',
      meta: 'há 3 h · Banner Super Topo — Portal',
      unread: true,
    },
  },
  {
    group: 'Anteriores',
    entry: {
      id: 'n4',
      leading: <NotificationDot tone="violet" />,
      title: 'Destaque couro vegetal aguarda aprovação',
      meta: 'ontem · Lume Acessórios',
    },
  },
];

function Notificacao() {
  const [mode, setMode] = useState<'lista' | 'vazio'>('lista');
  const [read, setRead] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(true);
  const entries = mode === 'vazio' ? [] : NOTIFS;
  const groups = ['Hoje', 'Anteriores'].map((label) => ({
    label,
    items: entries
      .filter((item) => item.group === label)
      .map(({ entry }) => ({ ...entry, unread: entry.unread && !read.has(entry.id) })),
  }));
  const unread = groups.some((group) => group.items.some((item) => item.unread));
  const markRead = (id: string) => setRead((prev) => new Set(prev).add(id));

  return (
    <Shots>
      <Shot
        title="Em contexto"
        align="stretch"
        aside={
          <Segmented
            size="sm"
            label="Conteúdo"
            value={mode}
            onChange={(next) => {
              setMode(next);
              setRead(new Set());
              setOpen(true);
            }}
            options={[
              { value: 'lista', label: 'Lista' },
              { value: 'vazio', label: 'Vazio' },
            ]}
          />
        }
      >
        <ShellFrame
          crumbs={CRUMBS_LIST}
          minHeight={580}
          bell={
            <span className={x.bellWrap}>
              <IconButton
                label={unread ? 'Notificações: há novidades' : 'Notificações'}
                icon={Bell}
                variant="ghost"
                size="sm"
                aria-expanded={open}
                aria-controls="dsv3-notif-panel"
                data-force={open ? 'active' : undefined}
                onClick={() => setOpen((value) => !value)}
              />
              {unread && <i className={x.bellDot} aria-hidden="true" />}
            </span>
          }
          overlay={
            open ? (
              <div className={x.notifPanel}>
                <NotificationList
                  id="dsv3-notif-panel"
                  groups={groups}
                  onOpen={markRead}
                  onMarkRead={markRead}
                  onMarkAll={() => setRead(new Set(NOTIFS.map(({ entry }) => entry.id)))}
                  onViewAll={() =>
                    toast('Abrindo todas as notificações', { tone: 'info', progress: true })
                  }
                />
              </div>
            ) : undefined
          }
        >
          <PageHead />
          <MiniList />
        </ShellFrame>
      </Shot>

      <Shot title="Estados" align="stretch">
        <States min={300}>
          <State label="Não lida">
            <NotifSample unread />
          </State>
          <State label="Lida">
            <NotifSample />
          </State>
          <State label="Hover">
            <NotifSample unread force="hover" />
          </State>
          <State label="Foco">
            <NotifSample unread force="focus" />
          </State>
          <State label="Vazio">
            <NotificationList groups={[]} elevated={false} onMarkAll={() => undefined} />
          </State>
        </States>
      </Shot>
      <EnsureToaster />
    </Shots>
  );
}

function NotifSample({ unread = false, force }: { unread?: boolean; force?: string }) {
  return (
    <div className={x.notifBox}>
      <ul>
        <NotificationItem
          leading={<Avatar name="Marina Lopes" size="xs" decorative />}
          title="Marina Lopes pediu ajustes em Retargeting de credenciados"
          meta="há 1 h · Grupo Horizonte"
          unread={unread}
          onMarkRead={() => undefined}
          data-force={force}
        />
      </ul>
    </div>
  );
}

/* ——————————————————————————— Registro ——————————————————————————— */

export const specimens: Record<string, ComponentType> = {
  alerta: Alerta,
  toast: ToastSpecimen,
  banner: BannerSpecimen,
  progresso: Progresso,
  spinner: SpinnerSpecimen,
  skeleton: SkeletonSpecimen,
  'estado-vazio': EstadoVazio,
  'estado-erro': EstadoErro,
  'estados-acesso': EstadosAcesso,
  notificacao: Notificacao,
};
