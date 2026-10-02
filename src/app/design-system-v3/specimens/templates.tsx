'use client';

/*
 * Templates (Contrato V3 · família Templates): páginas inteiras compostas só com a biblioteca ds-v3.
 * Cada template vive numa moldura de página (100% × 820, rolagem interna) com o seletor “1440 · 390”,
 * que troca a moldura por um celular de 390 × 780 — sem escala por CSS: o layout responde à largura
 * real do contêiner (container queries e medidas), como no produto.
 * Peças locais (não existem na biblioteca): ver `LOCAL` no fim do arquivo.
 */

import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Boxes,
  CalendarPlus,
  Check,
  ChevronRight,
  Building2,
  ChartNoAxesColumn,
  CircleX,
  Copy,
  Ellipsis,
  FileText,
  Gift,
  LayoutDashboard,
  ListFilter,
  LogOut,
  Mail,
  MailCheck,
  Megaphone,
  Download,
  Pencil,
  Plus,
  Radio as ChannelIcon,
  Search,
  SearchX,
  Settings,
  SlidersHorizontal,
  Shield,
  Store,
  Tags,
  Trash2,
  UserPlus,
  UserRound,
  Users,
  UsersRound,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from 'react';
import {
  Avatar,
  Badge,
  BrandMark,
  Button,
  Checkbox,
  Dialog,
  Divider,
  IconButton,
  Segmented,
  Switch,
  Tabs,
  Tooltip,
  VisuallyHidden,
  type SegmentOption,
  type Tone,
} from '@mediaon/design-system/v3';
import {
  AppShell,
  Breadcrumb,
  NotificationsButton,
  PortalSwitcher,
  Sidebar,
  SidebarAccount,
  TopBar,
  type Crumb,
  type NavGroup,
  type Portal,
} from '@mediaon/design-system/v3/app-shell';
import {
  BarChart,
  ChartCard,
  ChartState,
  DonutChart,
  formatCompact,
  formatInt,
  Legend,
  LineChart,
  MeterList,
  type ChartDatum,
  type DonutDatum,
  type MeterItem,
} from '@mediaon/design-system/v3/charts';
import { CodeInput, type CodeStatus } from '@mediaon/design-system/v3/code-input';
import { ColorField, contrastRatio } from '@mediaon/design-system/v3/color-picker';
import { DateRangePicker, type DateRange } from '@mediaon/design-system/v3/date-picker';
import { AccessState, Alert, EmptyState, ErrorState, Skeleton } from '@mediaon/design-system/v3/feedback';
import { Field, FieldGroup, Input, SearchField, Textarea } from '@mediaon/design-system/v3/fields';
import { ActiveFilters, FilterBand, FilterBar, FilterField, type ActiveFilter } from '@mediaon/design-system/v3/filter-bar';
import { BottomSheet } from '@mediaon/design-system/v3/bottom-sheet';
import { Drawer } from '@mediaon/design-system/v3/drawer';
import { Carousel } from '@mediaon/design-system/v3/gallery';
import { BrandLockup, IconTile, MadeWith } from '@mediaon/design-system/v3/identity';
import { LinkButton, TextLink } from '@mediaon/design-system/v3/link';
import { List, ListItem } from '@mediaon/design-system/v3/list-item';
import { Menu, type MenuItem, type MenuSection } from '@mediaon/design-system/v3/menu';
import { MediaFrame } from '@mediaon/design-system/v3/media';
import { Metric, MetricStrip, type MetricProps } from '@mediaon/design-system/v3/metric-strip';
import { MoneyField } from '@mediaon/design-system/v3/money-field';
import { NumberField } from '@mediaon/design-system/v3/number-field';
import { Pagination } from '@mediaon/design-system/v3/pagination';
import { PasswordField, type PasswordRequirement } from '@mediaon/design-system/v3/password-field';
import { RowActions, type RowAction } from '@mediaon/design-system/v3/row-actions';
import { Select } from '@mediaon/design-system/v3/select';
import { Radio, RadioGroup } from '@mediaon/design-system/v3/selection';
import { Meter } from '@mediaon/design-system/v3/stat';
import { ActionBar, FormRow, StepPipeline, type PipelineStage } from '@mediaon/design-system/v3/stepper';
import { DescriptionList, PageHeader, Panel, Section, type DescriptionItem } from '@mediaon/design-system/v3/structure';
import { BulkBar, DataTable, type Column, type SortState } from '@mediaon/design-system/v3/table';
import { Timeline, type TimelineEntry } from '@mediaon/design-system/v3/timeline';
import { toast, Toaster } from '@mediaon/design-system/v3/toast';
import { ToggleGroup } from '@mediaon/design-system/v3/toggle';
import { Dropzone, FileRow } from '@mediaon/design-system/v3/upload';
import { VideoPlayer } from '@mediaon/design-system/v3/video';
import toastStyles from '@mediaon/design-system/v3/toast.module.css';
import t from './templates.module.css';

/* ——————————————————————————— Utilidades ——————————————————————————— */

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const noop = () => undefined;

/** Largura observada de um elemento (0 antes da primeira medida). */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/**
 * Rola só a área de conteúdo do shell até o elemento (nunca a página do catálogo em volta):
 * `scrollIntoView` arrastaria a janela junto.
 */
function scrollWithin(el: HTMLElement | null, offset = 72) {
  const scroller = el?.closest<HTMLElement>('[data-part="main"]');
  if (!el || !scroller) return;
  const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - offset;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  scroller.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
}

/** Contagem regressiva em segundos (reenvio de link e código). */
function useCountdown(seconds: number) {
  const [left, setLeft] = useState(seconds);
  const [round, setRound] = useState(0);
  useEffect(() => {
    setLeft(seconds);
    const timer = window.setInterval(() => {
      setLeft((value) => {
        if (value <= 1) window.clearInterval(timer);
        return Math.max(0, value - 1);
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [seconds, round]);
  const restart = useCallback(() => setRound((value) => value + 1), []);
  return [left, restart] as const;
}
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/** Os avisos precisam de um Toaster na página; o catálogo pode já ter o seu. */
function EnsureToaster() {
  const [needed, setNeeded] = useState(false);
  useEffect(() => {
    const cls = toastStyles.viewport;
    setNeeded(!cls || !document.querySelector(`.${CSS.escape(cls)}`));
  }, []);
  return needed ? <Toaster /> : null;
}

/* ——————————————————————————— Moldura de página ——————————————————————————— */

type Device = 'desktop' | 'phone';
const DEVICES: SegmentOption<Device>[] = [
  { value: 'desktop', label: '1440' },
  { value: 'phone', label: '390' },
];

type Presets<P extends string> = {
  label: string;
  value: P;
  onChange: (value: P) => void;
  options: SegmentOption<P>[];
};

/**
 * Moldura do template: 820 de altura com rolagem interna. “390” troca a moldura por um celular de
 * 390 × 780 centrado. O conteúdo continua montado (o estado fica) e reage à largura nova.
 * `scroll`: a própria tela rola (páginas sem o AppShell, que rola por dentro).
 */
function TemplateFrame<P extends string>({
  presets,
  scroll = false,
  children,
}: {
  presets?: Presets<P>;
  scroll?: boolean;
  children: ReactNode;
}) {
  const [device, setDevice] = useState<Device>('desktop');
  return (
    <figure className={t.tpl}>
      <figcaption className={t.tplHead}>
        <h3 className={t.tplTitle}>Em contexto</h3>
        {presets && (
          <div className={t.tplPresets}>
            <Segmented
              size="sm"
              label={presets.label}
              value={presets.value}
              onChange={presets.onChange}
              options={presets.options}
            />
          </div>
        )}
        <div className={t.tplDevice}>
          <Segmented size="sm" label="Largura da moldura" value={device} onChange={setDevice} options={DEVICES} />
        </div>
      </figcaption>
      <div className={t.tplStage} data-device={device}>
        <div className={t.tplScreen} data-device={device} data-template-screen="">
          {scroll ? <div className={t.tplScroll}>{children}</div> : children}
        </div>
      </div>
      <EnsureToaster />
    </figure>
  );
}

/* ——————————————————————————— Moldura do app ——————————————————————————— */

const NAV_GROUPS: NavGroup[] = [
  { id: 'workspace', label: 'Workspace', items: [{ id: 'visao-geral', label: 'Visão geral', icon: LayoutDashboard }] },
  {
    id: 'configuracao',
    label: 'Configuração',
    items: [
      { id: 'metricas', label: 'Métricas', icon: ChartNoAxesColumn },
      { id: 'canais', label: 'Canais', icon: ChannelIcon },
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

const PORTALS: Portal[] = [
  { id: 'francal-2026', name: 'Francal 2026', detail: 'Portal do organizador', period: '06/07 – 09/07' },
  { id: 'francal-2025', name: 'Francal 2025', detail: 'Portal do organizador', period: '07/07 – 10/07', status: 'archived' },
];
const MANAGE_PORTALS: MenuItem = { label: 'Gerenciar portais', icon: Settings };
const ACCOUNT_SECTIONS: MenuSection[] = [
  {
    items: [
      { label: 'Meu perfil', icon: UserRound },
      { label: 'Configurações do portal', icon: Settings },
    ],
  },
  { items: [{ label: 'Sair', icon: LogOut }] },
];
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
        description: 'Convite para o estande B-214 · há 3 h',
        leading: <Avatar name="Clara Souto" size="xs" decorative />,
      },
    ],
  },
];

const crumb = (label: string): Crumb => ({ label, onClick: noop });

/** O shell do portal (igual ao /dashboardv3): menu lateral, topo com trilha e o conteúdo que rola. */
function PortalShell({ active, crumbs, children }: { active: string; crumbs: string[]; children: ReactNode }) {
  const items = crumbs.map((label, index) => (index === crumbs.length - 1 ? { label } : crumb(label)));
  return (
    <AppShell
      fill
      contentAs="div"
      breakpoint={960}
      sidebar={
        <Sidebar
          label="Navegação do portal"
          switcher={
            <PortalSwitcher portals={PORTALS} value="francal-2026" onChange={noop} action={MANAGE_PORTALS} />
          }
          filter
          groups={NAV_GROUPS}
          active={active}
          account={<SidebarAccount name="Marina Lopes" detail="Operação · Francal" sections={ACCOUNT_SECTIONS} />}
        />
      }
      topbar={<TopBar breadcrumb={items} notifications={<NotificationsButton count={3} sections={NOTIFICATIONS} />} />}
    >
      {children}
    </AppShell>
  );
}

/* ═══════════════════════════ Acesso e autenticação ═══════════════════════════ */

type AccessFlow = 'entrar' | 'convite' | 'recuperar' | 'codigo';
const ACCESS_FLOWS: SegmentOption<AccessFlow>[] = [
  { value: 'entrar', label: 'Entrar' },
  { value: 'convite', label: 'Convite' },
  { value: 'recuperar', label: 'Recuperar' },
  { value: 'codigo', label: 'Código' },
];
const MASKED_EMAIL = 'm***@aurora.com.br';
const PASSWORD_RULES: PasswordRequirement[] = [
  { label: '8 caracteres ou mais', test: (value) => value.length >= 8 },
  { label: 'Uma letra maiúscula', test: (value) => /[A-ZÀ-Ý]/.test(value) },
  { label: 'Um número', test: (value) => /\d/.test(value) },
];

function AuthTitle({ children, lead }: { children: ReactNode; lead?: ReactNode }) {
  return (
    <div className={t.authHead}>
      <h2 className={t.authTitle}>{children}</h2>
      {lead && <p className={t.authLead}>{lead}</p>}
    </div>
  );
}

/** Reenvio com espera: “Reenviar em 0:24” parado; depois vira ação. */
function Resend({ label, onResend }: { label: string; onResend: () => void }) {
  const [left, restart] = useCountdown(30);
  return (
    <p className={t.authResend} aria-live="polite">
      {left > 0 ? (
        <span>
          {label} em <span className={t.tabular}>{clock(left)}</span>
        </span>
      ) : (
        <LinkButton
          onClick={() => {
            onResend();
            restart();
          }}
        >
          {label}
        </LinkButton>
      )}
    </p>
  );
}

function SignIn({ onFlow }: { onFlow: (flow: AccessFlow) => void }) {
  const [email, setEmail] = useState('marina@aurora.com.br');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const attempts = useRef(0);
  const passwordRef = useRef<HTMLInputElement>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    const next = {
      email: email.trim() ? undefined : 'Informe o e-mail',
      password: password ? undefined : 'Informe a senha',
    };
    setErrors(next);
    if (next.email || next.password) return;
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      attempts.current += 1;
      // Demonstração: a primeira tentativa erra a senha; a segunda entra.
      if (attempts.current % 2 === 1) {
        setErrors({ password: 'E-mail ou senha incorretos' });
        passwordRef.current?.focus();
        passwordRef.current?.select();
        return;
      }
      setPassword('');
      toast('Você entrou como Marina Lopes', { description: 'Francal 2026 · Portal do organizador' });
    }, 600);
  }

  return (
    <>
      <AuthTitle>Entrar</AuthTitle>
      <form className={t.authForm} onSubmit={submit} noValidate>
        <Field label="E-mail" error={errors.email}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              value={email}
              invalid={invalid}
              aria-describedby={describedBy}
              onChange={(event) => {
                setEmail(event.target.value);
                if (errors.email) setErrors((value) => ({ ...value, email: undefined }));
              }}
            />
          )}
        </Field>
        <Field
          label="Senha"
          error={errors.password}
          meta={<LinkButton onClick={() => onFlow('recuperar')}>Esqueci a senha</LinkButton>}
        >
          {({ id, describedBy, invalid }) => (
            <PasswordField
              ref={passwordRef}
              id={id}
              value={password}
              invalid={invalid}
              aria-describedby={describedBy}
              onValueChange={(value) => {
                setPassword(value);
                if (errors.password) setErrors((current) => ({ ...current, password: undefined }));
              }}
            />
          )}
        </Field>
        <Button type="submit" variant="primary" loading={loading} className={t.full}>
          Entrar
        </Button>
      </form>
      <Divider label="ou" />
      <Button className={t.full} onClick={() => onFlow('codigo')}>
        Entrar com código por e-mail
      </Button>
    </>
  );
}

function Invite() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const met = PASSWORD_RULES.every((rule) => rule.test(password));
  return (
    <>
      <p className={t.authInvite}>
        <Avatar name="Marina Lopes" size="xs" decorative />
        <span>
          <strong>Marina Lopes</strong> convidou você para Francal 2026
        </span>
      </p>
      <AuthTitle>Criar sua senha</AuthTitle>
      <form
        className={t.authForm}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (loading) return;
          if (!met) {
            setError('A senha ainda não atende aos requisitos');
            return;
          }
          setLoading(true);
          window.setTimeout(() => {
            setLoading(false);
            setPassword('');
            toast('Acesso criado', { description: 'Rafael Dias · Estúdio Norte' });
          }, 600);
        }}
      >
        <Field label="E-mail">
          {({ id }) => <Input id={id} value="rafael@estudionorte.com.br" readOnly />}
        </Field>
        <Field label="Senha" error={error}>
          {({ id, describedBy, invalid }) => (
            <PasswordField
              id={id}
              value={password}
              invalid={invalid}
              aria-describedby={describedBy}
              requirements={PASSWORD_RULES}
              onValueChange={(value) => {
                setPassword(value);
                if (error) setError(undefined);
              }}
            />
          )}
        </Field>
        <Button type="submit" variant="primary" loading={loading} className={t.full}>
          Aceitar convite
        </Button>
      </form>
    </>
  );
}

function Recover({ onFlow }: { onFlow: (flow: AccessFlow) => void }) {
  const [email, setEmail] = useState('marina@aurora.com.br');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  if (sent)
    return (
      <div className={t.authSent} key="sent">
        <IconTile icon={MailCheck} tone="blue" size="lg" />
        <AuthTitle lead={`Enviamos um link para ${MASKED_EMAIL}.`}>Verifique seu e-mail</AuthTitle>
        <Resend label="Reenviar link" onResend={() => toast('Link reenviado', { tone: 'info', description: MASKED_EMAIL })} />
        <Button className={t.full} icon={ArrowLeft} onClick={() => onFlow('entrar')}>
          Voltar para o login
        </Button>
      </div>
    );
  return (
    <>
      <AuthTitle>Recuperar senha</AuthTitle>
      <form
        className={t.authForm}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (loading) return;
          if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
            setError(email.trim() ? 'E-mail inválido' : 'Informe o e-mail');
            return;
          }
          setLoading(true);
          window.setTimeout(() => {
            setLoading(false);
            setSent(true);
          }, 600);
        }}
      >
        <Field label="E-mail" error={error}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              value={email}
              invalid={invalid}
              aria-describedby={describedBy}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError(undefined);
              }}
            />
          )}
        </Field>
        <Button type="submit" variant="primary" loading={loading} className={t.full}>
          Enviar link
        </Button>
      </form>
      <p className={t.authBack}>
        <LinkButton tone="quiet" onClick={() => onFlow('entrar')}>
          Voltar para o login
        </LinkButton>
      </p>
    </>
  );
}

function CodeSignIn({ onFlow }: { onFlow: (flow: AccessFlow) => void }) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<CodeStatus>('idle');
  const attempts = useRef(0);
  return (
    <>
      <AuthTitle lead={`Enviamos 6 dígitos para ${MASKED_EMAIL}.`}>Digite o código</AuthTitle>
      <div className={t.authForm}>
        <CodeInput
          value={code}
          status={status}
          onChange={(value) => {
            setCode(value);
            if (status === 'invalid') setStatus('idle');
          }}
          onComplete={() => {
            setStatus('verifying');
            window.setTimeout(() => {
              attempts.current += 1;
              // Demonstração: o primeiro código erra; o segundo entra.
              if (attempts.current % 2 === 1) {
                setStatus('invalid');
                return;
              }
              setStatus('valid');
              toast('Você entrou como Marina Lopes', { description: 'Francal 2026 · Portal do organizador' });
            }, 600);
          }}
        />
        <Resend
          label="Reenviar código"
          onResend={() => {
            setCode('');
            setStatus('idle');
            toast('Código reenviado', { tone: 'info', description: MASKED_EMAIL });
          }}
        />
      </div>
      <Divider label="ou" />
      <Button className={t.full} onClick={() => onFlow('entrar')}>
        Entrar com senha
      </Button>
    </>
  );
}

function AccessScreen({ flow, onFlow }: { flow: AccessFlow; onFlow: (flow: AccessFlow) => void }) {
  return (
    <div className={t.auth}>
      <div className={t.authCard}>
        <BrandLockup name="Francal 2026" detail="Portal do organizador" size="sm" cobrand />
        <div className={t.authBody} key={flow}>
          {flow === 'entrar' && <SignIn onFlow={onFlow} />}
          {flow === 'convite' && <Invite />}
          {flow === 'recuperar' && <Recover onFlow={onFlow} />}
          {flow === 'codigo' && <CodeSignIn onFlow={onFlow} />}
        </div>
      </div>
    </div>
  );
}

function AcessoTemplate() {
  const [flow, setFlow] = useState<AccessFlow>('entrar');
  return (
    <TemplateFrame scroll presets={{ label: 'Fluxo', value: flow, onChange: setFlow, options: ACCESS_FLOWS }}>
      <AccessScreen flow={flow} onFlow={setFlow} />
    </TemplateFrame>
  );
}

/* ═══════════════════════════ Campanhas (dados) ═══════════════════════════ */

type StatusKey =
  | 'draft'
  | 'submitted'
  | 'adjustments_requested'
  | 'awaiting_pi_signature'
  | 'approved'
  | 'active'
  | 'paused'
  | 'completed'
  | 'rejected'
  | 'cancelled';

/** O mesmo mapa de status do /dashboardv3 (rótulo, tom e pulso). */
const STATUS: Record<StatusKey, { label: string; tone: Tone; live?: boolean }> = {
  draft: { label: 'Rascunho', tone: 'gray' },
  submitted: { label: 'Aguardando aprovação', tone: 'violet' },
  adjustments_requested: { label: 'Ajustes solicitados', tone: 'orange' },
  awaiting_pi_signature: { label: 'Aguardando assinatura do P.I.', tone: 'amber' },
  approved: { label: 'Aprovada', tone: 'teal' },
  active: { label: 'Veiculando', tone: 'green', live: true },
  paused: { label: 'Pausada', tone: 'gray' },
  completed: { label: 'Concluída', tone: 'gray' },
  rejected: { label: 'Rejeitada', tone: 'red' },
  cancelled: { label: 'Cancelada', tone: 'red' },
};
const BUCKETS: { value: string; label: string; phrase?: string; statuses?: StatusKey[] }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'veiculacao', label: 'Em veiculação', phrase: 'em veiculação', statuses: ['approved', 'active', 'paused'] },
  {
    value: 'aprovacao',
    label: 'Em aprovação',
    phrase: 'em aprovação',
    statuses: ['submitted', 'adjustments_requested', 'awaiting_pi_signature'],
  },
  { value: 'rascunhos', label: 'Rascunhos', phrase: 'em rascunho', statuses: ['draft'] },
  { value: 'encerradas', label: 'Encerradas', phrase: 'encerrada', statuses: ['completed', 'rejected', 'cancelled'] },
];
const EDITABLE: StatusKey[] = ['draft', 'adjustments_requested'];

type Campaign = {
  id: number;
  name: string;
  asset: string;
  advertiser: string;
  status: StatusKey;
  budget: number;
  links: number;
  /** ISO, sem fuso. */
  start: string;
  end: string;
};

const iso = (day: number, month = 10) => `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
/** 17 campanhas: Em veiculação 6 · Em aprovação 5 · Rascunhos 2 · Encerradas 4 (o mapa do dashboard). */
const CAMPAIGNS: Campaign[] = [
  { id: 2041, name: 'Coleção Primavera-Verão no portal', asset: 'Banner Super Topo — Portal', advertiser: 'Aurora Calçados', status: 'active', budget: 18000, links: 10, start: iso(1), end: iso(31) },
  { id: 2038, name: 'Newsletter dos expositores', asset: 'E-mail marketing dedicado', advertiser: 'Estúdio Norte', status: 'active', budget: 8000, links: 8, start: iso(5), end: iso(25) },
  { id: 2035, name: 'Convite para o estande B-214', asset: 'Push no app da feira', advertiser: 'Casa Forma', status: 'awaiting_pi_signature', budget: 3600, links: 5, start: iso(14), end: iso(17) },
  { id: 2032, name: 'Destaque couro vegetal', asset: 'Banner Super Topo — Portal', advertiser: 'Lume Acessórios', status: 'submitted', budget: 9000, links: 10, start: iso(10), end: iso(30) },
  { id: 2029, name: 'Retargeting de credenciados', asset: 'Banner Super Topo — Portal', advertiser: 'Grupo Horizonte', status: 'adjustments_requested', budget: 13500, links: 10, start: iso(1), end: iso(31) },
  { id: 2026, name: 'Vitrine de lançamentos Aurora', asset: 'Destaque na vitrine', advertiser: 'Aurora Calçados', status: 'adjustments_requested', budget: 11230, links: 10, start: iso(12), end: iso(30) },
  { id: 2023, name: 'Rodada de negócios — segunda edição', asset: 'Rodada de negócios — lista qualificada', advertiser: 'Ateliê Sul', status: 'paused', budget: 3600, links: 6, start: iso(25, 9), end: iso(17) },
  { id: 2020, name: 'Guia oficial do visitante', asset: 'E-mail marketing dedicado', advertiser: 'Pátio Couro', status: 'completed', budget: 12000, links: 8, start: iso(15, 9), end: iso(30, 9) },
  { id: 2017, name: 'Painel de LED — lançamento', asset: 'Painel de LED — Pavilhão Azul', advertiser: 'Bella Passo', status: 'approved', budget: 18000, links: 4, start: iso(14), end: iso(17) },
  { id: 2014, name: 'Carrossel de tendências', asset: 'Post patrocinado no Instagram oficial', advertiser: 'Aurora Calçados', status: 'draft', budget: 6500, links: 6, start: iso(5), end: iso(12) },
  { id: 2011, name: 'Lançamento linha couro nobre', asset: 'Destaque na vitrine', advertiser: 'Couro Nobre', status: 'active', budget: 7200, links: 7, start: iso(3), end: iso(24) },
  { id: 2008, name: 'Café com lojistas', asset: 'Push no app da feira', advertiser: 'Bella Passo', status: 'active', budget: 2400, links: 4, start: iso(8), end: iso(9) },
  { id: 2005, name: 'Mapa do pavilhão patrocinado', asset: 'Painel de LED — Pavilhão Azul', advertiser: 'Casa Forma', status: 'submitted', budget: 15000, links: 6, start: iso(20), end: iso(31) },
  { id: 2002, name: 'Kit de imprensa digital', asset: 'E-mail marketing dedicado', advertiser: 'Estúdio Norte', status: 'draft', budget: 4500, links: 5, start: '', end: '' },
  { id: 1999, name: 'Esquenta Francal', asset: 'E-mail marketing dedicado', advertiser: 'Lume Acessórios', status: 'completed', budget: 5400, links: 8, start: iso(1, 9), end: iso(15, 9) },
  { id: 1996, name: 'Credenciamento antecipado', asset: 'Push no app da feira', advertiser: 'Grupo Horizonte', status: 'cancelled', budget: 2700, links: 5, start: iso(5, 9), end: iso(10, 9) },
  { id: 1993, name: 'Pré-venda de estandes', asset: 'Banner Super Topo — Portal', advertiser: 'Pátio Couro', status: 'rejected', budget: 6000, links: 10, start: iso(1, 9), end: iso(30, 9) },
];
const ADVERTISERS = [...new Set(CAMPAIGNS.map((row) => row.advertiser))].sort((a, b) => a.localeCompare(b, 'pt-BR'));

const money = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
const int = (value: number) => value.toLocaleString('pt-BR');
const short = (date: string) => (date ? `${date.slice(8, 10)}/${date.slice(5, 7)}` : '');
const periodOf = (row: { start: string; end: string }) => (row.start ? `${short(row.start)} – ${short(row.end)}` : '');
const plural = (count: number, one: string, many: string) => `${int(count)} ${count === 1 ? one : many}`;

/* ═══════════════════════════ Listagem ═══════════════════════════ */

type ListState = 'dados' | 'carregando' | 'vazio' | 'sem-resultado' | 'erro';
const LIST_STATES: SegmentOption<ListState>[] = [
  { value: 'dados', label: 'Dados' },
  { value: 'carregando', label: 'Carregando' },
  { value: 'vazio', label: 'Vazio' },
  { value: 'sem-resultado', label: 'Sem resultado' },
  { value: 'erro', label: 'Erro' },
];
const NO_RESULT_QUERY = 'sapatilha';
const LIVE_DELETE = 'Campanhas no ar não podem ser excluídas';

function CampaignName({ row, narrow, compact = false }: { row: Campaign; narrow: boolean; compact?: boolean }) {
  const period = narrow ? periodOf(row) : '';
  return (
    <span className={t.nameCell}>
      <a
        className={t.nameLink}
        href="#template-detalhe"
        title={`${row.name} · #${row.id}`}
        onClick={(event) => event.stopPropagation()}
      >
        {row.name}
      </a>
      <span className={t.sub}>
        {compact ? (
          <span className={t.subAsset} title={row.advertiser}>
            {row.advertiser}
          </span>
        ) : (
          <span className={t.subAsset} title={row.asset}>
            {row.asset}
          </span>
        )}
        {period && <span>{period}</span>}
        {compact ? null : narrow ? <span>{plural(row.links, 'vínculo', 'vínculos')}</span> : <span>#{row.id}</span>}
      </span>
    </span>
  );
}

function DeliverySwitch({ row, onChange }: { row: Campaign; onChange: (status: StatusKey) => void }) {
  const can = row.status === 'active' || row.status === 'paused' || row.status === 'approved';
  const on = row.status === 'active';
  const help = can
    ? on
      ? 'Pausar a veiculação'
      : row.status === 'approved'
        ? 'Iniciar a veiculação'
        : 'Retomar a veiculação'
    : `${STATUS[row.status].label}: veiculação indisponível`;
  return (
    <span className={t.switchCell} onClick={(event) => event.stopPropagation()}>
      <Tooltip content={help}>
        <span className={t.switchHit}>
          <Switch
            size="sm"
            hideLabel
            label={`Veiculação de ${row.name}`}
            checked={on}
            disabled={!can}
            onCheckedChange={(checked) => onChange(checked ? 'active' : 'paused')}
          />
        </span>
      </Tooltip>
    </span>
  );
}

function rowActionsOf(row: Campaign, onDelete: (id: number) => void): RowAction[] {
  const live = row.status === 'active';
  return [
    { id: 'analytics', label: 'Analytics', icon: BarChart3, onSelect: () => (window.location.hash = 'template-detalhe') },
    {
      id: 'edit',
      label: 'Editar',
      icon: Pencil,
      hidden: !EDITABLE.includes(row.status),
      onSelect: () => (window.location.hash = 'template-cadastro'),
    },
    {
      id: 'delete',
      label: 'Excluir',
      icon: Trash2,
      danger: true,
      disabled: live,
      hint: live ? LIVE_DELETE : undefined,
      onSelect: () => onDelete(row.id),
    },
  ];
}

/** Celular: cada campanha vira uma linha de cartão (seleção, chave, nome, duas linhas de meta, ⋯). */
function CampaignCards({
  rows,
  selected,
  onToggle,
  onStatus,
  onDelete,
}: {
  rows: Campaign[];
  selected: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onStatus: (id: number, status: StatusKey) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <ul className={t.cards} aria-label="Campanhas">
      {rows.map((row) => {
        const key = String(row.id);
        const isSelected = selected.has(key);
        return (
          <li key={row.id} className={t.card} data-selected={isSelected || undefined}>
            <span className={t.cardCheck}>
              <Checkbox aria-label={`Selecionar ${row.name}`} checked={isSelected} onChange={() => onToggle(key)} />
            </span>
            <DeliverySwitch row={row} onChange={(status) => onStatus(row.id, status)} />
            <span className={t.cardMain}>
              <a className={t.cardName} href="#template-detalhe">
                {row.name}
              </a>
              <span className={t.cardMeta}>
                <span className={t.cardStatus}>
                  <Badge variant="text" size="sm" tone={STATUS[row.status].tone} live={STATUS[row.status].live}>
                    {STATUS[row.status].label}
                  </Badge>
                </span>
                <span className={t.cardMore}>{row.advertiser}</span>
              </span>
              <span className={t.cardMeta}>
                <span>{money(row.budget)}</span>
                {row.start && <span>{periodOf(row)}</span>}
              </span>
            </span>
            <span className={t.cardMenu}>
              <RowActions compact label={`Ações de ${row.name}`} overflowLabel={`Ações de ${row.name}`} actions={rowActionsOf(row, onDelete)} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function CardSkeletons({ count }: { count: number }) {
  return (
    <ul className={t.cards} aria-busy="true" aria-label="Carregando campanhas">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className={t.card} aria-hidden="true">
          <span className={t.cardCheck}>
            <Skeleton width={18} height={18} radius={4} shape="block" />
          </span>
          <Skeleton width={30} height={17} radius={999} shape="block" />
          <span className={t.cardMain}>
            <Skeleton width={`${58 + ((index * 17) % 30)}%`} height={10} />
            <Skeleton width={`${40 + ((index * 23) % 26)}%`} height={8} />
            <Skeleton width={`${34 + ((index * 13) % 20)}%`} height={8} />
          </span>
          <span />
        </li>
      ))}
    </ul>
  );
}

function CampaignListing({
  state,
  query,
  onQuery,
}: {
  state: ListState;
  query: string;
  onQuery: (value: string, empty: boolean) => void;
}) {
  const [rootRef, width] = useWidth<HTMLDivElement>();
  const phone = width > 0 && width < 640;
  /* Três larguras: completa (≥ 1120), tablet (sem Vínculos e Período, que sobem para a linha de apoio)
     e compacta (< 960: o anunciante também sobe, a Campanha fica legível). */
  const narrow = width > 0 && width < 1120;
  const compact = width > 0 && width < 960;
  const [rows, setRows] = useState(CAMPAIGNS);
  const [tab, setTab] = useState('todas');
  const [status, setStatus] = useState('');
  const [advertiser, setAdvertiser] = useState('');
  const [range, setRange] = useState<DateRange>({ start: '', end: '' });
  const [open, setOpen] = useState(false);
  const [sort, setSort] = useState<SortState>({ key: 'created', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exiting, setExiting] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<number[] | null>(null);
  const [retrying, setRetrying] = useState(false);

  const source = state === 'vazio' ? [] : rows;
  const filtersOn = Boolean(status || advertiser || range.start || range.end);
  const term = query.trim().replace(/^#/, '').toLowerCase();
  const matches = (row: Campaign, ignoreTab = false) => {
    const bucket = BUCKETS.find((item) => item.value === tab)?.statuses;
    if (!ignoreTab && bucket && !bucket.includes(row.status)) return false;
    if (status && row.status !== status) return false;
    if (advertiser && row.advertiser !== advertiser) return false;
    if (range.start && row.end && row.end < range.start) return false;
    if (range.end && row.start && row.start > range.end) return false;
    if (term && !`${row.name} ${row.id} ${row.advertiser} ${row.asset}`.toLowerCase().includes(term)) return false;
    return true;
  };
  const filtered = source.filter((row) => matches(row));
  const dir = sort.direction === 'asc' ? 1 : -1;
  const sorted = [...filtered].sort((a, b) => {
    if (sort.key === 'budget') return (a.budget - b.budget) * dir;
    if (sort.key === 'name') return a.name.localeCompare(b.name, 'pt-BR') * dir;
    if (sort.key === 'period') return (a.start || '9').localeCompare(b.start || '9') * dir;
    return (a.id - b.id) * dir;
  });
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pages);
  const pageRows = sorted.slice((current - 1) * pageSize, current * pageSize);
  const counts = Object.fromEntries(
    BUCKETS.map((item) => [
      item.value,
      item.statuses ? source.filter((row) => item.statuses?.includes(row.status)).length : source.length,
    ]),
  );
  const chosen = rows.filter((row) => selected.has(String(row.id)));
  const live = chosen.filter((row) => row.status === 'active');
  const mode = state === 'carregando' ? 'loading' : state === 'erro' ? 'error' : 'rows';

  /* Mesma altura em todos os estados: o vazio e o erro ocupam a altura que a página cheia ocupava. */
  const wrapRef = useRef<HTMLDivElement>(null);
  const fullHeight = useRef(0);
  const [fill, setFill] = useState(0);
  const filling = mode === 'error' || (mode === 'rows' && pageRows.length === 0);
  useIsoLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (mode === 'rows' && pageRows.length === pageSize) {
      fullHeight.current = wrap.offsetHeight;
      return;
    }
    if (!filling || !fullHeight.current) return;
    const diff = fullHeight.current - wrap.offsetHeight;
    if (Math.abs(diff) > 1) setFill((value) => Math.max(0, value + diff));
  });

  const clearFilters = () => {
    setStatus('');
    setAdvertiser('');
    setRange({ start: '', end: '' });
  };
  const setStatusOf = (id: number, next: StatusKey) => {
    const before = rows;
    setRows((list) => list.map((row) => (row.id === id ? { ...row, status: next } : row)));
    const row = rows.find((item) => item.id === id);
    toast(next === 'active' ? 'Veiculação retomada' : 'Veiculação pausada', {
      description: row?.name,
      action: { label: 'Desfazer', onClick: () => setRows(before) },
    });
  };
  const remove = (ids: number[]) => {
    const before = rows;
    setConfirm(null);
    setExiting(new Set(ids.map(String)));
    window.setTimeout(() => {
      setRows((list) => list.filter((row) => !ids.includes(row.id)));
      setSelected((value) => new Set([...value].filter((id) => !ids.includes(Number(id)))));
      setExiting(new Set());
      toast(ids.length === 1 ? 'Campanha excluída' : `${ids.length} campanhas excluídas`, {
        description: 'Estoque reservado liberado.',
        action: { label: 'Desfazer', onClick: () => setRows(before) },
      });
    }, 200);
  };
  const toggleOne = (id: string) =>
    setSelected((value) => {
      const next = new Set(value);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const filterCount = [status, advertiser, range.start || range.end].filter(Boolean).length;
  const activeFilters: ActiveFilter[] = [];
  if (status)
    activeFilters.push({ id: 'status', label: 'Status', value: STATUS[status as StatusKey].label, onRemove: () => setStatus(''), onEdit: () => setOpen(true) });
  if (advertiser)
    activeFilters.push({
      id: 'advertiser',
      label: 'Anunciante',
      value: advertiser,
      leading: <BrandMark name={advertiser} size="xs" variant="soft" decorative />,
      onRemove: () => setAdvertiser(''),
      onEdit: () => setOpen(true),
    });
  if (range.start || range.end)
    activeFilters.push({
      id: 'period',
      label: 'Período',
      value: `${short(range.start) || '…'} – ${short(range.end) || '…'}`,
      onRemove: () => setRange({ start: '', end: '' }),
      onEdit: () => setOpen(true),
    });

  const emptyBlock =
    source.length === 0 ? (
      <EmptyState
        icon={Megaphone}
        title="Nenhuma campanha ainda"
        actions={
          <Button size="sm" icon={Plus}>
            Nova campanha
          </Button>
        }
      />
    ) : term && !filtersOn ? (
      <EmptyState
        icon={SearchX}
        title={`Nada encontrado para “${query.trim()}”`}
        description="Busque pelo nome, anunciante, ativo ou número."
        actions={
          <Button size="sm" onClick={() => onQuery('', false)}>
            Limpar busca
          </Button>
        }
      />
    ) : filtersOn ? (
      <EmptyState
        icon={ListFilter}
        title="Nenhuma campanha para esses filtros"
        actions={
          <Button
            size="sm"
            onClick={() => {
              clearFilters();
              onQuery('', false);
            }}
          >
            Limpar filtros
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={Megaphone}
        title={`Nenhuma campanha ${BUCKETS.find((item) => item.value === tab)?.phrase ?? ''}`}
        actions={
          <Button size="sm" variant="ghost" onClick={() => setTab('todas')}>
            Ver todas
          </Button>
        }
      />
    );
  const errorBlock = (
    <ErrorState
      title="Não foi possível carregar as campanhas"
      code="503"
      time="há 1 min"
      retrying={retrying}
      onRetry={() => {
        setRetrying(true);
        window.setTimeout(() => setRetrying(false), 1200);
      }}
    />
  );
  const fillBox = (node: ReactNode) => (
    <div className={t.fill} style={fill ? { minHeight: fill } : undefined}>
      {node}
    </div>
  );

  const columns: Column<Campaign>[] = [
    {
      key: 'delivery',
      header: <VisuallyHidden>Veiculação</VisuallyHidden>,
      name: 'Veiculação',
      width: 52,
      skeleton: 'control',
      render: (row) => <DeliverySwitch row={row} onChange={(next) => setStatusOf(row.id, next)} />,
    },
    {
      key: 'name',
      header: 'Campanha',
      sortable: true,
      skeleton: 'lines',
      render: (row) => <CampaignName row={row} narrow={narrow} compact={compact} />,
    },
    ...(compact
      ? []
      : [
          {
            key: 'advertiser',
            header: 'Anunciante',
            width: narrow ? 168 : '14.6%',
            render: (row: Campaign) => (
              <span className={t.advertiser} title={row.advertiser}>
                <BrandMark name={row.advertiser} size="xs" variant="soft" decorative />
                <span>{row.advertiser}</span>
              </span>
            ),
          } satisfies Column<Campaign>,
        ]),
    {
      key: 'status',
      header: 'Status',
      width: narrow ? 160 : '14%',
      render: (row) => (
        <span className={t.status}>
          <Badge variant="text" tone={STATUS[row.status].tone} live={STATUS[row.status].live} wrap>
            {STATUS[row.status].label}
          </Badge>
        </span>
      ),
    },
    { key: 'budget', header: 'Verba', width: 118, numeric: true, sortable: true, render: (row) => money(row.budget) },
    ...(narrow
      ? []
      : [
          {
            key: 'links',
            header: 'Vínculos',
            width: 72,
            align: 'end' as const,
            skeleton: 'short' as const,
            render: (row: Campaign) => <span className={t.tabular}>{row.links}</span>,
          },
          {
            key: 'period',
            header: 'Período',
            width: 116,
            sortable: true,
            fallback: '—',
            render: (row: Campaign) => (row.start ? <span className={t.period}>{periodOf(row)}</span> : null),
          },
        ]),
    {
      key: 'actions',
      header: <VisuallyHidden>Ações</VisuallyHidden>,
      name: 'Ações',
      align: 'end',
      width: 118,
      skeleton: 'none',
      render: (row) => (
        <span onClick={(event) => event.stopPropagation()}>
          <RowActions label={`Ações de ${row.name}`} actions={rowActionsOf(row, (id) => setConfirm([id]))} />
        </span>
      ),
    },
  ];

  const pagination =
    sorted.length > 0 ? (
      <Pagination
        page={current}
        pageSize={pageSize}
        total={sorted.length}
        noun="campanhas"
        variant={phone ? 'compact' : 'auto'}
        onPageChange={setPage}
        onPageSizeChange={
          phone
            ? undefined
            : (size) => {
                setPageSize(size);
                setPage(1);
              }
        }
      />
    ) : undefined;

  const confirmName = confirm?.length === 1 ? rows.find((row) => row.id === confirm[0])?.name : undefined;

  return (
    <div ref={rootRef} className={t.listing}>
      <PageHeader
        title="Campanhas"
        description={
          state === 'carregando' ? (
            <LineSkeleton width={168} />
          ) : (
            `${sorted.length} de ${plural(source.length, 'campanha', 'campanhas')} do portal.`
          )
        }
        actions={
          <Button variant="primary" icon={Plus} onClick={() => (window.location.hash = 'template-cadastro')}>
            Nova campanha
          </Button>
        }
      />
      <FilterBar
        tabs={
          <Tabs
            label="Recortes por status"
            value={tab}
            onChange={(next) => {
              setTab(next);
              setPage(1);
            }}
            items={BUCKETS.map((item) => ({ value: item.value, label: item.label, count: counts[item.value] }))}
          />
        }
        search={
          <SearchField
            size="sm"
            value={query}
            onValueChange={(value) => {
              onQuery(value, false);
              setPage(1);
            }}
            placeholder="Campanha, anunciante ou nº"
            label="Buscar por nome, anunciante, ativo ou número"
          />
        }
        filtersOpen={open}
        onFiltersOpenChange={setOpen}
        filterCount={filterCount}
        bandId="tpl-list-band"
        actions={
          <Tooltip content="Exportar CSV">
            <IconButton
              label="Exportar CSV"
              icon={Download}
              variant="ghost"
              size="sm"
              disabled={!sorted.length || mode !== 'rows'}
              onClick={() => toast(plural(sorted.length, 'campanha exportada', 'campanhas exportadas'), { tone: 'info' })}
            />
          </Tooltip>
        }
      />
      <div className={t.afterBar}>
        <FilterBand id="tpl-list-band" open={open} onClear={filtersOn ? clearFilters : undefined}>
          <FilterField>
            <Select
              size="sm"
              label="Status"
              value={status}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
                const bucket = BUCKETS.find((item) => item.value === tab)?.statuses;
                if (value && bucket && !bucket.includes(value as StatusKey)) setTab('todas');
              }}
              placeholder="Todos os status"
              options={[
                { value: '', label: 'Todos os status' },
                ...(Object.keys(STATUS) as StatusKey[]).map((key) => ({ value: key, label: STATUS[key].label })),
              ]}
            />
          </FilterField>
          <FilterField>
            <Select
              size="sm"
              label="Anunciante"
              value={advertiser}
              searchable
              onChange={(value) => {
                setAdvertiser(value);
                setPage(1);
              }}
              placeholder="Todos os anunciantes"
              options={[
                { value: '', label: 'Todos os anunciantes' },
                ...ADVERTISERS.map((name) => ({
                  value: name,
                  label: name,
                  leading: <BrandMark name={name} size="xs" variant="soft" decorative />,
                })),
              ]}
            />
          </FilterField>
          <FilterField wide>
            <DateRangePicker
              size="sm"
              aria-label="Período"
              placeholder="Qualquer período"
              clearable
              duration={false}
              start={range.start}
              end={range.end}
              onChange={(next) => {
                setRange(next);
                setPage(1);
              }}
            />
          </FilterField>
        </FilterBand>
        {!open && activeFilters.length > 0 && (
          <div className={t.activeRow}>
            <ActiveFilters filters={activeFilters} onClearAll={clearFilters}>
              {sorted.length} de {plural(source.length, 'campanha', 'campanhas')}
            </ActiveFilters>
          </div>
        )}
        <div ref={wrapRef} className={t.tableWrap}>
          {phone ? (
            <div className={t.cardsFrame}>
              {mode === 'loading' ? (
                <CardSkeletons count={pageSize} />
              ) : mode === 'error' ? (
                fillBox(errorBlock)
              ) : pageRows.length ? (
                <CampaignCards
                  rows={pageRows}
                  selected={selected}
                  onToggle={toggleOne}
                  onStatus={setStatusOf}
                  onDelete={(id) => setConfirm([id])}
                />
              ) : (
                fillBox(emptyBlock)
              )}
              {mode !== 'error' && pagination}
            </div>
          ) : (
            <DataTable
              label="Campanhas do portal"
              rows={pageRows}
              rowKey={(row) => String(row.id)}
              rowLabel={(row) => row.name}
              columns={columns}
              density="compact"
              fixed
              selectable
              selected={selected}
              onSelectedChange={setSelected}
              sort={sort}
              onSort={(next) => {
                setSort(next);
                setPage(1);
              }}
              loading={mode === 'loading'}
              loadingRows={pageSize}
              error={mode === 'error' ? fillBox(errorBlock) : undefined}
              empty={fillBox(emptyBlock)}
              exiting={exiting}
              transitionKey={`${tab}:${status}:${advertiser}:${range.start}:${range.end}:${term}:${current}:${state}`}
              footer={mode === 'error' ? undefined : pagination}
            />
          )}
        </div>
        <BulkBar
          dock
          count={selected.size}
          noun={selected.size === 1 ? 'selecionada' : 'selecionadas'}
          onClear={() => setSelected(new Set())}
          actions={[
            {
              label: 'Exportar',
              icon: Download,
              onSelect: () => toast(plural(chosen.length, 'campanha exportada', 'campanhas exportadas'), { tone: 'info' }),
            },
            {
              label: 'Excluir',
              icon: Trash2,
              danger: true,
              disabled: chosen.length > 0 && live.length === chosen.length,
              hint: chosen.length > 0 && live.length === chosen.length ? LIVE_DELETE : undefined,
              onSelect: () => setConfirm(chosen.filter((row) => row.status !== 'active').map((row) => row.id)),
            },
          ]}
        />
      </div>
      <Dialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        size="sm"
        divided={false}
        title={confirmName ? `Excluir ${confirmName}?` : `Excluir ${confirm?.length ?? 0} campanhas?`}
        description={
          live.length && !confirmName
            ? `${plural(live.length, 'campanha em veiculação fica', 'campanhas em veiculação ficam')} de fora.`
            : 'As métricas e os P.I. saem junto, e o estoque reservado volta para o inventário.'
        }
        footer={
          <>
            <Button data-autofocus onClick={() => setConfirm(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={() => confirm && remove(confirm)}>
              {confirm && confirm.length > 1 ? `Excluir ${confirm.length}` : 'Excluir'}
            </Button>
          </>
        }
      >
        {null}
      </Dialog>
    </div>
  );
}

function ListagemTemplate() {
  const [state, setState] = useState<ListState>('dados');
  const [query, setQuery] = useState('');
  return (
    <TemplateFrame
      presets={{
        label: 'Estado da lista',
        value: state,
        onChange: (next) => {
          setState(next);
          if (next === 'sem-resultado') setQuery(NO_RESULT_QUERY);
          else if (state === 'sem-resultado') setQuery('');
        },
        options: LIST_STATES,
      }}
    >
      <PortalShell active="campanhas" crumbs={['Operação', 'Campanhas']}>
        <CampaignListing
          state={state}
          query={query}
          onQuery={(value) => {
            setQuery(value);
            if (state === 'sem-resultado' && value !== NO_RESULT_QUERY) setState('dados');
          }}
        />
      </PortalShell>
    </TemplateFrame>
  );
}

/* ═══════════════════════════ Dashboard ═══════════════════════════ */

type LoadState = 'dados' | 'carregando';
const LOAD_STATES: SegmentOption<LoadState>[] = [
  { value: 'dados', label: 'Dados' },
  { value: 'carregando', label: 'Carregando' },
];

/** Outubro: impressões por dia de todas as campanhas do portal (real até 22/10, previsão depois). */
const FAIR_DAYS = Array.from({ length: 31 }, (_, index) => index + 1);
/* Soma real até 22/10 ≈ 1,24 mi (a mesma da faixa). */
const FAIR_REAL = [
  44000, 47700, 49500, 48200, 42000, 51300, 54800, 56500, 55300, 53000, 54700, 58100, 57000, 55100, 59600, 73000, 62900,
  59100, 65100, 64000, 62200, 66100,
];
const FAIR_FORECAST = [67400, 68500, 70400, 71100, 73000, 74200, 76000, 77800, 79100];
const TODAY = FAIR_REAL.length - 1;
const WEEKDAY = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const dayTitle = (day: number, month = 10) => {
  const date = new Date(Date.UTC(2026, month - 1, day));
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/2026 · ${WEEKDAY[date.getUTCDay()] ?? ''}`;
};
const dayLabel = (day: number, month = 10) => `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
const FAIR_DATA: ChartDatum[] = FAIR_DAYS.map((day, index) => ({
  label: dayLabel(day),
  title: dayTitle(day),
  values: { imp: index <= TODAY ? (FAIR_REAL[index] ?? null) : (FAIR_FORECAST[index - TODAY - 1] ?? null) },
}));
const FAIR_TOTAL = FAIR_REAL.reduce((sum, value) => sum + value, 0);
const FAIR_PROJECTED = FAIR_TOTAL + FAIR_FORECAST.reduce((sum, value) => sum + value, 0);

const APPROVALS = [
  { id: 2032, name: 'Destaque couro vegetal', advertiser: 'Lume Acessórios', when: 'há 2 h' },
  { id: 2005, name: 'Mapa do pavilhão patrocinado', advertiser: 'Casa Forma', when: 'há 3 h' },
  { id: 2026, name: 'Vitrine de lançamentos Aurora', advertiser: 'Aurora Calçados', when: 'há 6 h' },
  { id: 2029, name: 'Retargeting de credenciados', advertiser: 'Grupo Horizonte', when: 'ontem' },
  { id: 2035, name: 'Convite para o estande B-214', advertiser: 'Casa Forma', when: 'ontem' },
];
const BUDGET_BY_CATEGORY: ChartDatum[] = [
  { label: 'Mídia Online', detail: '4 ativos', values: { budget: 48600 } },
  { label: 'Mídia Offline', detail: '2 ativos', values: { budget: 33600 } },
  { label: 'Conteúdo Orgânico', detail: '2 ativos', values: { budget: 21800 } },
  { label: 'Prospecção Ativa', detail: '1 ativo', values: { budget: 8400 } },
];
const LEADS_BY_SOURCE: DonutDatum[] = [
  { key: 'portal', label: 'Portal da feira', value: 96, color: 'blue' },
  { key: 'app', label: 'App Francal', value: 71, color: 'teal' },
  { key: 'vitrine', label: 'Vitrine', value: 32, color: 'violet' },
  { key: 'email', label: 'E-mail', value: 15, color: 'amber' },
];
const ACTIVITY: TimelineEntry[] = [
  { id: 'a1', title: 'P.I. 2026-0400 assinado', description: 'Coleção Primavera-Verão no portal · Aurora Calçados', date: 'há 12 min', state: 'current' },
  { id: 'a2', title: 'Ajustes solicitados', description: 'Retargeting de credenciados · Marina Lopes', date: 'há 1 h' },
  { id: 'a3', title: 'Enviada para aprovação', description: 'Destaque couro vegetal · Lume Acessórios', date: 'há 2 h' },
  { id: 'a4', title: 'Veiculação iniciada', description: 'Newsletter dos expositores · Estúdio Norte', date: 'há 5 h' },
  { id: 'a5', title: 'Anunciante cadastrado', description: 'Couro Nobre · Rafael Dias', date: 'ontem' },
];
const brlCompact = (value: number) =>
  value >= 1000 ? `R$ ${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : `R$ ${int(value)}`;

/** Linha de esqueleto com a altura da linha de texto (o bloco não pula ao carregar). */
function LineSkeleton({ width, height = 10, line = 20 }: { width: number | string; height?: number; line?: number }) {
  return (
    <span className={t.lineSkel} style={{ height: line }}>
      <Skeleton width={width} height={height} />
    </span>
  );
}

/** Célula-link da faixa: a métrica inteira leva à fila de aprovações. */
function ApprovalsMetric({ loading, onOpen }: { loading: boolean; onOpen: () => void }) {
  return (
    <a
      className={t.metricLink}
      href="#aprovacoes"
      aria-label="Aprovações pendentes: 5. Revisar"
      onClick={(event) => {
        event.preventDefault();
        onOpen();
      }}
    >
      <Metric
        label="Aprovações pendentes"
        value="5"
        loading={loading}
        hint={
          <span className={t.metricCta}>
            Revisar
            <ArrowRight aria-hidden="true" />
          </span>
        }
      />
    </a>
  );
}

function ActivitySkeleton({ rows }: { rows: number }) {
  return (
    <ul className={t.activitySkel} aria-busy="true" aria-label="Carregando atividade">
      {Array.from({ length: rows }, (_, index) => (
        <li key={index} aria-hidden="true">
          <Skeleton width={8} height={8} shape="circle" />
          <span>
            <LineSkeleton width={`${46 + ((index * 19) % 30)}%`} />
            <LineSkeleton width={`${30 + ((index * 23) % 24)}%`} height={8} />
          </span>
          <LineSkeleton width={48} height={8} />
        </li>
      ))}
    </ul>
  );
}

function Overview({ loading }: { loading: boolean }) {
  const [range, setRange] = useState<DateRange>({ start: iso(1), end: iso(31) });
  const approvalsRef = useRef<HTMLElement>(null);
  return (
    <div className={t.overview}>
      <PageHeader
        title="Visão geral"
        actions={
          <>
            <span className={t.headDate}>
              <DateRangePicker
                size="sm"
                aria-label="Período"
                start={range.start}
                end={range.end}
                duration={false}
                onChange={setRange}
              />
            </span>
            <Button
              size="sm"
              icon={Download}
              onClick={() => toast('Relatório exportado', { tone: 'info', description: 'Visão geral · 01/10 – 31/10' })}
            >
              Exportar
            </Button>
          </>
        }
      />
      <MetricStrip
        label="Indicadores do portal"
        columns={5}
        items={[
          { label: 'Campanhas em veiculação', value: '6', hint: 'de 17 no portal', loading },
          { label: 'Verba contratada', value: money(112400), hint: '14 P.I. assinados', loading },
          {
            label: 'Impressões',
            value: '1,24 mi',
            delta: { value: '12,4%', trend: 'up', label: 'alta de 12,4% contra setembro' },
            hint: 'contra setembro',
            loading,
          },
          {
            label: 'Leads',
            value: '214',
            delta: { value: '8,1%', trend: 'up', label: 'alta de 8,1% contra setembro' },
            hint: '32 nesta semana',
            loading,
          },
        ]}
      >
        <ApprovalsMetric
          loading={loading}
          onOpen={() => {
            scrollWithin(approvalsRef.current, 88);
            approvalsRef.current?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
          }}
        />
      </MetricStrip>
      <div className={t.dashGrid}>
        <ChartCard
          title="Entrega da feira"
          legend={
            <Legend
              items={[
                { key: 'imp', label: 'Impressões', color: 'blue', shape: 'line', value: loading ? '—' : formatCompact(FAIR_TOTAL) },
                {
                  key: 'forecast',
                  label: 'Previsão',
                  color: 'blue',
                  shape: 'dashed',
                  value: loading ? '—' : formatCompact(FAIR_PROJECTED),
                  detail: 'em 31/10',
                },
              ]}
            />
          }
        >
          {loading ? (
            <ChartState kind="loading" skeleton="line" height={248} />
          ) : (
            <LineChart
              label="Impressões por dia em outubro, todas as campanhas"
              data={FAIR_DATA}
              series={[{ key: 'imp', label: 'Impressões', color: 'blue' }]}
              area
              height={248}
              format={formatInt}
              axisFormat={formatCompact}
              forecastFrom={TODAY}
              marker={{ index: TODAY, label: 'Hoje' }}
              xTicks={[0, 4, 9, 14, 19, 24, 30]}
            />
          )}
        </ChartCard>
        <section ref={approvalsRef} id="aprovacoes" className={t.dashPanel} aria-labelledby="tpl-approvals">
          <header className={t.dashPanelHead}>
            <h3 id="tpl-approvals">Aprovações pendentes</h3>
            <LinkButton tone="quiet" onClick={() => (window.location.hash = 'template-listagem')}>
              Ver todas
            </LinkButton>
          </header>
          <List label="Campanhas aguardando revisão" framed={false}>
            {loading
              ? APPROVALS.map((item, index) => (
                  <ListItem
                    key={item.id}
                    density="sm"
                    leading={<Skeleton width={20} height={20} shape="block" radius={5} />}
                    title={<LineSkeleton width={`${52 + ((index * 17) % 30)}%`} />}
                    description={<LineSkeleton width={`${34 + ((index * 13) % 20)}%`} height={8} line={18} />}
                    trailing={<LineSkeleton width={48} height={8} />}
                  />
                ))
              : APPROVALS.map((item) => (
                  <ListItem
                    key={item.id}
                    density="sm"
                    leading={<BrandMark name={item.advertiser} size="xs" variant="soft" decorative />}
                    title={item.name}
                    description={`${item.advertiser} · ${item.when}`}
                    trailing={
                      <LinkButton onClick={() => (window.location.hash = 'template-detalhe')}>Revisar</LinkButton>
                    }
                  />
                ))}
          </List>
        </section>
      </div>
      <div className={t.dashGrid} data-row="charts">
        <ChartCard title="Verba por categoria" description="P.I. assinados em outubro">
          {loading ? (
            <ChartState kind="loading" skeleton="bars" height={214} />
          ) : (
            <BarChart
              orientation="horizontal"
              label="Verba contratada por categoria de ativo"
              data={BUDGET_BY_CATEGORY}
              series={[{ key: 'budget', label: 'Verba', color: 'blue' }]}
              format={money}
              axisFormat={brlCompact}
              labelWidth={148}
              values="all"
              labelFormat={brlCompact}
            />
          )}
        </ChartCard>
        <ChartCard title="Leads por origem" description="214 leads desde 01/10">
          {loading ? (
            <ChartState kind="loading" skeleton="donut" height={214} />
          ) : (
            <DonutChart
              label="Leads por origem"
              data={LEADS_BY_SOURCE}
              variant="duo"
              size={132}
              thickness={14}
              gap={2}
              centerLabel="Leads"
              centerValue="214"
              legend="right"
              legendColumns="share"
            />
          )}
        </ChartCard>
      </div>
      <Section variant="panel" title="Atividade recente" action={<LinkButton tone="quiet">Ver auditoria</LinkButton>}>
        {loading ? <ActivitySkeleton rows={ACTIVITY.length} /> : <Timeline label="Atividade recente do portal" variant="dots" items={ACTIVITY} />}
      </Section>
    </div>
  );
}

function DashboardTemplate() {
  const [state, setState] = useState<LoadState>('dados');
  return (
    <TemplateFrame presets={{ label: 'Estado da página', value: state, onChange: setState, options: LOAD_STATES }}>
      <PortalShell active="visao-geral" crumbs={['Workspace', 'Visão geral']}>
        <Overview loading={state === 'carregando'} />
      </PortalShell>
    </TemplateFrame>
  );
}

/* ═══════════════════════════ Detalhe ═══════════════════════════ */

type DetailPreset = 'veiculando' | 'ajustes' | 'rascunho';
const DETAIL_PRESETS: SegmentOption<DetailPreset>[] = [
  { value: 'veiculando', label: 'Veiculando' },
  { value: 'ajustes', label: 'Ajustes solicitados' },
  { value: 'rascunho', label: 'Rascunho' },
];
type DetailTab = 'visao' | 'analytics';

type DetailData = {
  id: number;
  name: string;
  advertiser: string;
  asset: string;
  period: string;
  origin: string;
  status: StatusKey;
  current: number;
  metrics: MetricProps[];
  config: DescriptionItem[];
  briefing: DescriptionItem[];
  history: TimelineEntry[];
  links: [string, number][];
  pi?: { code: string; value: string };
  reason?: { text: string; meta: string };
};

const JOURNEY: { id: string; label: string; detail: string }[] = [
  { id: 'rascunho', label: 'Rascunho', detail: 'Montagem da campanha' },
  { id: 'aprovacao', label: 'Aprovação', detail: 'Comercial do portal' },
  { id: 'pi', label: 'P.I.', detail: 'Assinatura em 72 h' },
  { id: 'veiculacao', label: 'Veiculação', detail: 'No ar no período' },
  { id: 'concluida', label: 'Concluída', detail: 'Relatório final' },
];

const DETAILS: Record<DetailPreset, DetailData> = {
  veiculando: {
    id: 2041,
    name: 'Coleção Primavera-Verão no portal',
    advertiser: 'Aurora Calçados',
    asset: 'Banner Super Topo — Portal',
    period: '01/10 – 31/10',
    origin: 'Criada pelo admin',
    status: 'active',
    current: 3,
    metrics: [
      { label: 'Impressões', value: '271.400', hint: 'Entregues no período' },
      { label: 'Cliques', value: '6.120', hint: 'CTR 2,25%' },
      { label: 'Leads', value: '214', hint: 'Campanha + vitrine' },
      { label: 'Entrega', value: '68', unit: '%', meter: { value: 68, label: 'Entrega do contratado' }, hint: 'de ≈ 400.000 impressões' },
    ],
    config: [
      { label: 'Anunciante', value: 'Aurora Calçados', leading: <BrandMark name="Aurora Calçados" size="xs" variant="soft" decorative /> },
      { label: 'Ativo', value: 'Banner Super Topo — Portal' },
      { label: 'Categoria', value: 'Mídia Online' },
      { label: 'Modelo de precificação', value: 'CPM · R$ 45,00 / mil impressões' },
      { label: 'Verba', value: 'R$ 18.000,00' },
      { label: 'Período', value: '01/10/2026 – 31/10/2026 · 31 dias' },
      { label: 'Canais', value: 'Portal da feira (50%), App Francal (50%)' },
      { label: 'Públicos', value: 'Visitantes credenciados (50%), Lojistas e compradores (50%)' },
      { label: 'Bônus liberados', value: '+20% de impressões' },
    ],
    briefing: [
      { label: 'Peça criativa', state: 'empty' },
      { label: 'URL de destino', state: 'empty' },
      { label: 'Texto alternativo da peça', state: 'empty' },
      { label: 'Idioma da peça', state: 'empty' },
      { label: 'Pavilhões de interesse', state: 'empty' },
      { label: 'Entrega do criativo', state: 'empty' },
    ],
    history: [
      { id: 'h1', title: 'Veiculação iniciada', description: 'Marina Lopes · 29/09', state: 'current' },
      { id: 'h2', title: 'P.I. assinado', description: 'Aurora Calçados · 29/09' },
      { id: 'h3', title: 'Aprovada · P.I. gerado', description: 'Marina Lopes · 29/09' },
      { id: 'h4', title: 'Enviada para aprovação', description: 'Marina Lopes · 28/09' },
      { id: 'h5', title: 'Campanha criada', description: 'Marina Lopes · 28/09' },
    ],
    links: [
      ['Ativos', 1],
      ['Canais', 2],
      ['Públicos', 3],
      ['Métricas', 1],
      ['Bonificações', 3],
    ],
    pi: { code: 'P.I. 2026-0400', value: 'R$ 18.000,00' },
  },
  ajustes: {
    id: 2029,
    name: 'Retargeting de credenciados',
    advertiser: 'Grupo Horizonte',
    asset: 'Banner Super Topo — Portal',
    period: '01/10 – 31/10',
    origin: 'Criada pelo anunciante',
    status: 'adjustments_requested',
    current: 1,
    metrics: [
      { label: 'Entrega estimada', value: '≈ 300.000', hint: 'impressões' },
      { label: 'Verba', value: 'R$ 13.500,00', hint: 'CPM' },
      { label: 'Duração', value: '31 dias', hint: 'de veiculação' },
      { label: 'Público potencial', value: '69.800', hint: 'pessoas em 2 públicos' },
    ],
    config: [
      { label: 'Anunciante', value: 'Grupo Horizonte', leading: <BrandMark name="Grupo Horizonte" size="xs" variant="soft" decorative /> },
      { label: 'Ativo', value: 'Banner Super Topo — Portal' },
      { label: 'Categoria', value: 'Mídia Online' },
      { label: 'Modelo de precificação', value: 'CPM · R$ 45,00 / mil impressões' },
      { label: 'Verba', value: 'R$ 13.500,00' },
      { label: 'Período', value: '01/10/2026 – 31/10/2026 · 31 dias' },
      { label: 'Canais', value: 'Portal da feira (50%), App Francal (50%)' },
      { label: 'Públicos', value: 'Visitantes credenciados (50%), Lojistas e compradores (50%)' },
      { label: 'Bônus liberados', value: '—' },
    ],
    briefing: [
      { label: 'Peça criativa', state: 'missing' },
      { label: 'URL de destino', state: 'missing' },
      { label: 'Texto alternativo da peça', state: 'empty' },
      { label: 'Idioma da peça', state: 'missing' },
      { label: 'Pavilhões de interesse', state: 'empty' },
      { label: 'Entrega do criativo', state: 'missing' },
    ],
    history: [
      { id: 'h1', title: 'Ajustes solicitados', description: 'Marina Lopes · 26/09', state: 'current' },
      { id: 'h2', title: 'Enviada para aprovação', description: 'Grupo Horizonte · 24/09' },
      { id: 'h3', title: 'Campanha criada', description: 'Grupo Horizonte · 24/09' },
    ],
    links: [
      ['Ativos', 1],
      ['Canais', 2],
      ['Públicos', 3],
      ['Métricas', 1],
      ['Bonificações', 3],
    ],
    reason: {
      text: 'A peça 970 × 250 está com o logotipo cortado. Ajuste o respiro e reenvie.',
      meta: 'Em 26/09/2026 às 11:12 · Marina Lopes',
    },
  },
  rascunho: {
    id: 2014,
    name: 'Carrossel de tendências',
    advertiser: 'Aurora Calçados',
    asset: 'Post patrocinado no Instagram oficial',
    period: '05/10 – 12/10',
    origin: 'Criada pelo anunciante',
    status: 'draft',
    current: 0,
    metrics: [
      { label: 'Entrega estimada', value: '1', hint: 'pacote fechado' },
      { label: 'Verba', value: 'R$ 6.500,00', hint: 'Pacote Fixo' },
      { label: 'Duração', value: '8 dias', hint: 'de veiculação' },
      { label: 'Público potencial', value: '49.350', hint: 'pessoas em 2 públicos' },
    ],
    config: [
      { label: 'Anunciante', value: 'Aurora Calçados', leading: <BrandMark name="Aurora Calçados" size="xs" variant="soft" decorative /> },
      { label: 'Ativo', value: 'Post patrocinado no Instagram oficial' },
      { label: 'Categoria', value: 'Conteúdo Orgânico' },
      { label: 'Modelo de precificação', value: 'Pacote Fixo · R$ 6.500,00 / pacote' },
      { label: 'Verba', value: 'R$ 6.500,00' },
      { label: 'Período', value: '05/10/2026 – 12/10/2026 · 8 dias' },
      { label: 'Canais', value: 'Instagram oficial' },
      { label: 'Públicos', value: 'Visitantes credenciados, Imprensa e influenciadores' },
      { label: 'Bônus liberados', value: 'Stories de reforço' },
    ],
    briefing: [
      { label: 'Pauta do conteúdo', state: 'missing' },
      { label: 'Fotos de produto', state: 'missing' },
      { label: '@ da marca para marcação', state: 'empty' },
    ],
    history: [{ id: 'h1', title: 'Campanha criada', description: 'Aurora Calçados · 19/09', state: 'current' }],
    links: [
      ['Ativos', 1],
      ['Canais', 1],
      ['Públicos', 2],
      ['Métricas', 1],
      ['Bonificações', 1],
    ],
  },
};

/* ——— Analytics (16/10 – 22/10 e janelas maiores) ——— */

type AnalyticsRange = '7' | '14' | 'all';
const RANGES: SegmentOption<AnalyticsRange>[] = [
  { value: '7', label: '7 dias' },
  { value: '14', label: '14 dias' },
  { value: 'all', label: 'Todo o período' },
];
type ReadMode = 'daily' | 'cumulative';
const READ_MODES: SegmentOption<ReadMode>[] = [
  { value: 'daily', label: 'Por dia' },
  { value: 'cumulative', label: 'Acumulado' },
];
const AN_IMP = [
  11020, 12340, 11860, 10450, 9320, 12010, 12680, 12950, 11730, 10980, 11240, 12120, 11560, 11020, 12792, 23950, 12480,
  9010, 14420, 13180, 12290, 11998,
];
const AN_CLICKS = [238, 270, 262, 230, 205, 265, 280, 286, 258, 242, 248, 267, 255, 243, 275, 663, 280, 205, 320, 300, 270, 258];
const AN_LEADS = [8, 10, 9, 11, 7, 9, 10, 12, 9, 8, 10, 11, 9, 9, 11, 14, 9, 7, 11, 10, 9, 11];
const PLANNED_DAILY = Math.round(400000 / 31);
const CPM = 45;
const sum = (list: number[]) => list.reduce((total, value) => total + value, 0);
const pctText = (value: number, digits = 1) =>
  `${value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
const brl2 = (value: number) => money(Math.round(value * 100) / 100);
const LEADS_RECENT = [
  { id: 'l1', company: 'Sapataria Ladeira', place: 'Salvador, BA', segment: 'Loja de calçados', audience: 'Visitantes credenciados', channel: 'Portal da feira', at: '22/10 · 16:25' },
  { id: 'l2', company: 'Trilha Norte Outdoor', place: 'Florianópolis, SC', segment: 'Esportivo', audience: 'Lojistas e compradores', channel: 'Portal da feira', at: '22/10 · 15:48' },
  { id: 'l3', company: 'Calçados Vila Rica', place: 'Novo Hamburgo, RS', segment: 'Loja de calçados', audience: 'Visitantes credenciados', channel: 'Portal da feira', at: '22/10 · 15:39' },
  { id: 'l4', company: 'Pequenos Passos Kids', place: 'Curitiba, PR', segment: 'Calçado infantil', audience: 'Lojistas e compradores', channel: 'App Francal', at: '22/10 · 14:59' },
  { id: 'l5', company: 'Bottega Jardins', place: 'São Paulo, SP', segment: 'Multimarcas', audience: 'Visitantes credenciados', channel: 'App Francal', at: '22/10 · 13:39' },
];
type LeadRow = (typeof LEADS_RECENT)[number];
type AudienceRow = { id: string; name: string; imp: number; clicks: number; leads: number; size: number };

function deltaOf(now: number, before: number | undefined, bad = false): MetricProps['delta'] {
  if (before === undefined || before === 0) return undefined;
  const change = (now / before - 1) * 100;
  const trend = Math.abs(change) < 0.05 ? 'flat' : change > 0 ? 'up' : 'down';
  const good = trend === 'flat' ? 'flat' : (trend === 'up') !== bad ? 'good' : 'bad';
  return { value: pctText(Math.abs(change)), trend, tone: good, label: `${change >= 0 ? 'alta' : 'queda'} de ${pctText(Math.abs(change))}` };
}

function CampaignAnalytics() {
  const [rootRef, width] = useWidth<HTMLDivElement>();
  const phone = width > 0 && width < 560;
  const [range, setRange] = useState<AnalyticsRange>('7');
  const [mode, setMode] = useState<ReadMode>('daily');
  const days = range === 'all' ? AN_IMP.length : Number(range);
  const from = AN_IMP.length - days;
  const slice = (list: number[], start: number, length: number) => list.slice(Math.max(0, start), start + length);
  const imp = slice(AN_IMP, from, days);
  const clicks = slice(AN_CLICKS, from, days);
  const leads = slice(AN_LEADS, from, days);
  const prevFrom = from - days;
  const hasPrev = range !== 'all' && prevFrom >= 0;
  const prev = hasPrev
    ? { imp: sum(slice(AN_IMP, prevFrom, days)), clicks: sum(slice(AN_CLICKS, prevFrom, days)), leads: sum(slice(AN_LEADS, prevFrom, days)) }
    : undefined;
  const totalImp = sum(imp);
  const totalClicks = sum(clicks);
  const totalLeads = sum(leads);
  const spend = (totalImp / 1000) * CPM;
  const prevSpend = prev ? (prev.imp / 1000) * CPM : undefined;
  const ctr = (totalClicks / totalImp) * 100;
  const peak = imp.reduce((best, value, index) => {
    const rate = (clicks[index] ?? 0) / value;
    return rate > best.rate ? { rate, index } : best;
  }, { rate: 0, index: 0 });
  const planned = PLANNED_DAILY * days;
  const firstDay = from + 1;
  const lastDay = AN_IMP.length;
  const kpis: MetricProps[] = [
    { label: 'Impressões', value: int(totalImp), delta: deltaOf(totalImp, prev?.imp), hint: `${pctText((totalImp / 400000) * 100)} do contratado` },
    { label: 'Cliques', value: int(totalClicks), delta: deltaOf(totalClicks, prev?.clicks), hint: `média de ${int(Math.round(totalClicks / days))} por dia` },
    {
      label: 'CTR',
      value: pctText(ctr, 2),
      delta: prev ? deltaOf(ctr, (prev.clicks / prev.imp) * 100) : undefined,
      hint: `pico de ${pctText(peak.rate * 100, 2)} em ${dayLabel(from + peak.index + 1)}`,
    },
    { label: 'Leads', value: int(totalLeads), delta: deltaOf(totalLeads, prev?.leads), hint: `${pctText((totalLeads / totalClicks) * 100)} dos cliques` },
    {
      label: 'Custo por lead',
      value: brl2(spend / totalLeads),
      delta: prev && prevSpend !== undefined ? deltaOf(spend / totalLeads, prevSpend / prev.leads, true) : undefined,
      hint: `${brl2(spend)} gastos`,
    },
    {
      label: 'Entrega vs. plano',
      value: `${Math.round((totalImp / planned) * 100)}%`,
      hint: `plano de ${int(planned)}`,
    },
  ];
  let running = 0;
  const data: ChartDatum[] = imp.map((value, index) => {
    running += value;
    const day = from + index + 1;
    return {
      label: dayLabel(day),
      title: dayTitle(day),
      values: { real: mode === 'daily' ? value : running, plan: mode === 'daily' ? PLANNED_DAILY : PLANNED_DAILY * (index + 1) },
    };
  });
  const portalShare = 0.507;
  const channel = (share: number, plan: number, name: string, key: string): MeterItem => {
    const value = Math.round(totalImp * share);
    const c = Math.round(totalClicks * (share + (key === 'app' ? 0.03 : -0.03)));
    const l = Math.round(totalLeads * share);
    return {
      key,
      label: name,
      value,
      share: share * 100,
      plan,
      caption: `${int(c)} cliques · CTR ${pctText((c / value) * 100, 2)} · ${plural(l, 'lead', 'leads')} · plano ${plan}%`,
    };
  };
  const audiences: AudienceRow[] = [
    { id: 'cred', name: 'Visitantes credenciados', imp: Math.round(totalImp * 0.504), clicks: Math.round(totalClicks * 0.42), leads: Math.round(totalLeads * 0.25), size: 48000 },
    { id: 'lojistas', name: 'Lojistas e compradores', imp: Math.round(totalImp * 0.496), clicks: Math.round(totalClicks * 0.58), leads: Math.round(totalLeads * 0.75), size: 21800 },
  ];
  const times = (value: number, size: number) => `${(value / size).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}×`;
  const audienceColumns: Column<AudienceRow>[] = [
    { key: 'name', header: 'Público', render: (row) => <span className={t.strong}>{row.name}</span> },
    { key: 'imp', header: 'Impressões', numeric: true, render: (row) => int(row.imp) },
    { key: 'clicks', header: 'Cliques', numeric: true, render: (row) => int(row.clicks) },
    { key: 'ctr', header: 'CTR', numeric: true, render: (row) => pctText((row.clicks / row.imp) * 100, 2) },
    { key: 'leads', header: 'Leads', numeric: true, render: (row) => int(row.leads) },
    { key: 'freq', header: 'Frequência', numeric: true, hint: 'Impressões por pessoa do público', render: (row) => times(row.imp, row.size) },
  ];
  const leadColumns: Column<LeadRow>[] = [
    {
      key: 'company',
      header: 'Empresa',
      render: (row) => (
        <span className={t.nameCell}>
          <span className={t.strong}>{row.company}</span>
          <span className={t.sub}>{phone ? `${row.segment} · ${row.channel}` : row.place}</span>
        </span>
      ),
    },
    { key: 'segment', header: 'Segmento', render: (row) => row.segment },
    { key: 'audience', header: 'Público', render: (row) => row.audience },
    { key: 'channel', header: 'Canal', render: (row) => row.channel },
    { key: 'at', header: 'Recebido', align: 'end', width: 120, render: (row) => <span className={t.tabular}>{row.at}</span> },
  ];
  return (
    <div ref={rootRef} className={t.analytics}>
      <div className={t.anToolbar}>
        <Segmented size="sm" label="Janela" options={RANGES} value={range} onChange={setRange} />
        <span className={t.anWindow}>
          <strong>
            {dayLabel(firstDay)} – {dayLabel(lastDay)}
          </strong>
          {range !== 'all' && <span>Variação contra os {days} dias anteriores</span>}
          <span>Atualizado em 22/10</span>
        </span>
        <Button
          variant="ghost"
          size="sm"
          icon={Download}
          className={t.anExport}
          onClick={() => toast('CSV exportado', { tone: 'info', description: `${plural(days, 'dia', 'dias')} · Coleção Primavera-Verão no portal` })}
        >
          Exportar CSV
        </Button>
      </div>
      <MetricStrip label="Indicadores da janela" items={kpis} />
      <ChartCard
        title={mode === 'daily' ? 'Entrega diária' : 'Entrega acumulada'}
        legend={
          <Legend
            items={[
              { key: 'real', label: 'Impressões', color: 'blue', shape: 'line' },
              {
                key: 'plan',
                label: 'Ritmo planejado',
                color: 'var(--g-400)',
                shape: 'dashed',
                detail: mode === 'daily' ? `${int(PLANNED_DAILY)} por dia` : `${int(planned)} até ${dayLabel(lastDay)}`,
              },
            ]}
          />
        }
        actions={<Segmented size="sm" label="Leitura do gráfico" options={READ_MODES} value={mode} onChange={setMode} />}
      >
        <LineChart
          label={mode === 'daily' ? 'Entrega diária de impressões' : 'Entrega acumulada de impressões'}
          data={data}
          series={[
            { key: 'real', label: 'Impressões', color: 'blue' },
            { key: 'plan', label: 'Ritmo planejado', color: 'gray', dashed: true },
          ]}
          area
          height={256}
          format={formatInt}
          axisFormat={formatCompact}
          markLast
        />
      </ChartCard>
      <div className={t.anSplit}>
        <ChartCard title="Por canal" description="Impressões no período">
          <MeterList
            label="Impressões por canal"
            items={[channel(portalShare, 50, 'Portal da feira', 'portal'), channel(1 - portalShare, 50, 'App Francal', 'app')]}
          />
        </ChartCard>
        <ChartCard title="Por público" description="Impressões no período">
          <DataTable
            label="Impressões por público"
            variant="plain"
            density="compact"
            rows={audiences}
            rowKey={(row) => row.id}
            columns={audienceColumns}
            hiddenColumns={phone ? ['leads', 'freq'] : undefined}
            totalRow={{
              name: 'Total',
              imp: int(totalImp),
              clicks: int(totalClicks),
              ctr: pctText(ctr, 2),
              leads: int(totalLeads),
              freq: times(totalImp, 69800),
            }}
          />
        </ChartCard>
      </div>
      <ChartCard title="Leads recentes" description={`${plural(sum(AN_LEADS), 'lead', 'leads')} desde 01/10`}>
        <DataTable
          label="Leads recentes"
          variant="plain"
          density="compact"
          rows={LEADS_RECENT}
          rowKey={(row) => row.id}
          columns={leadColumns}
          hiddenColumns={phone ? ['segment', 'audience', 'channel'] : undefined}
        />
      </ChartCard>
    </div>
  );
}

function CampaignDetail({ preset }: { preset: DetailPreset }) {
  const data = DETAILS[preset];
  const [tab, setTab] = useState<DetailTab>('visao');
  const [paused, setPaused] = useState(false);
  const [sending, setSending] = useState(false);
  const briefingRef = useRef<HTMLDivElement>(null);
  const status: StatusKey = preset === 'veiculando' && paused ? 'paused' : data.status;
  const missing = data.briefing.filter((item) => item.state === 'missing').length;
  const filled = data.briefing.filter((item) => !item.state).length;
  const stages: PipelineStage[] = JOURNEY.map((stage, index) => ({
    ...stage,
    state: index < data.current ? 'done' : index === data.current ? 'current' : 'upcoming',
  }));
  const more = (
    <Menu
      align="end"
      label="Mais ações"
      sections={[
        {
          items: [
            { label: 'Exportar relatório', icon: Download, onSelect: () => toast('Relatório exportado', { tone: 'info' }) },
            { label: 'Duplicar campanha', icon: Copy, onSelect: () => toast('Campanha duplicada', { description: `${data.name} (cópia)` }) },
          ],
        },
        { items: [{ label: preset === 'rascunho' ? 'Excluir rascunho' : 'Cancelar campanha', icon: preset === 'rascunho' ? Trash2 : CircleX, danger: true }] },
      ]}
      trigger={(props) => <IconButton {...props} label="Mais ações" icon={Ellipsis} />}
    />
  );
  const actions =
    preset === 'veiculando' ? (
      <>
        <Button
          variant="primary"
          onClick={() => {
            setPaused((value) => !value);
            toast(paused ? 'Veiculação retomada' : 'Veiculação pausada', {
              description: data.name,
              action: { label: 'Desfazer', onClick: () => setPaused(paused) },
            });
          }}
        >
          {paused ? 'Retomar' : 'Pausar'}
        </Button>
        <Button onClick={() => toast('Campanha concluída', { description: 'O relatório final fica pronto em até 24 h.' })}>Concluir</Button>
      </>
    ) : preset === 'ajustes' ? (
      <Button variant="primary" onClick={() => (window.location.hash = 'template-cadastro')}>
        Ajustar e reenviar
      </Button>
    ) : (
      <>
        <Button
          variant="primary"
          loading={sending}
          onClick={() => {
            setSending(true);
            window.setTimeout(() => {
              setSending(false);
              setTab('visao');
              scrollWithin(briefingRef.current);
              toast(`${plural(missing, 'campo do briefing falta', 'campos do briefing faltam')} para enviar`, {
                tone: 'info',
                description: data.briefing.filter((item) => item.state === 'missing').map((item) => item.label).join(' · '),
              });
            }, 500);
          }}
        >
          Enviar para aprovação
        </Button>
        <Button onClick={() => (window.location.hash = 'template-cadastro')}>Editar</Button>
      </>
    );
  return (
    <div className={t.detail}>
      <PageHeader
        title={data.name}
        status={
          <Badge variant="text" tone={STATUS[status].tone} live={STATUS[status].live}>
            {STATUS[status].label}
          </Badge>
        }
        meta={[`#${data.id}`, data.advertiser, data.asset, data.period, data.origin]}
        actions={actions}
        more={more}
      />
      <div className={t.journey}>
        <StepPipeline variant="journey" label="Jornada da campanha" stages={stages} />
      </div>
      {data.reason && (
        <Alert tone="attention" title="Motivo" meta={data.reason.meta} className={t.reason}>
          {data.reason.text}
        </Alert>
      )}
      <Tabs
        label="Seções da campanha"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'visao', label: 'Visão geral' },
          { value: 'analytics', label: 'Analytics' },
        ]}
      />
      <div className={t.tabPanel} key={tab}>
        {tab === 'analytics' ? (
          preset === 'veiculando' ? (
            <CampaignAnalytics />
          ) : (
            <EmptyState
              icon={ChartNoAxesColumn}
              title="Sem dados de veiculação"
              description={`Os números aparecem a partir de ${data.period.slice(0, 5)}.`}
              size="page"
            />
          )
        ) : (
          <>
            <MetricStrip label={preset === 'veiculando' ? 'Entrega' : 'Previsão'} items={data.metrics} />
            <div className={t.detailGrid}>
              <div className={t.detailMain}>
                <Section title="Configuração">
                  <DescriptionList label="Configuração" items={data.config} labelWidth={180} />
                </Section>
                <div ref={briefingRef} className={t.anchor}>
                  <Section
                    title="Briefing"
                    meta={missing ? plural(missing, 'obrigatório faltando', 'obrigatórios faltando') : `${filled} de ${data.briefing.length} preenchidos`}
                    metaTone={missing ? 'missing' : 'muted'}
                    action={
                      preset !== 'veiculando' ? (
                        <LinkButton onClick={() => (window.location.hash = 'template-cadastro')}>Preencher</LinkButton>
                      ) : undefined
                    }
                  >
                    <DescriptionList label="Briefing" items={data.briefing} labelWidth={180} />
                  </Section>
                </div>
              </div>
              <Panel as="aside" label="Resumo da campanha" className={t.detailAside}>
                <Section title="Pedido de inserção">
                  {data.pi ? (
                    <div className={t.pi}>
                      <div className={t.piText}>
                        <strong>{data.pi.code}</strong>
                        <span>{data.pi.value}</span>
                      </div>
                      <Badge variant="text" tone="green">
                        Ativo
                      </Badge>
                    </div>
                  ) : (
                    <p className={t.asideNote}>Gerado na aprovação.</p>
                  )}
                </Section>
                <Section title="Histórico">
                  <Timeline label="Histórico da campanha" variant="dots" items={data.history} />
                </Section>
                <Section title="Vínculos do ativo">
                  <dl className={t.linkList}>
                    {data.links.map(([label, count]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{count}</dd>
                      </div>
                    ))}
                  </dl>
                </Section>
              </Panel>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DetalheTemplate() {
  const [preset, setPreset] = useState<DetailPreset>('veiculando');
  const data = DETAILS[preset];
  return (
    <TemplateFrame presets={{ label: 'Status da campanha', value: preset, onChange: setPreset, options: DETAIL_PRESETS }}>
      <PortalShell active="campanhas" crumbs={['Operação', 'Campanhas', data.name]}>
        <CampaignDetail key={preset} preset={preset} />
      </PortalShell>
    </TemplateFrame>
  );
}

/* ═══════════════════════════ Cadastro e edição ═══════════════════════════ */

type EditPreset = 'edicao' | 'bloqueada';
const EDIT_PRESETS: SegmentOption<EditPreset>[] = [
  { value: 'edicao', label: 'Edição' },
  { value: 'bloqueada', label: 'Edição bloqueada' },
];
type AssetForm = {
  name: string;
  category: string;
  description: string;
  width: number | null;
  height: number | null;
  model: string;
  price: number | null;
  multiple: number | null;
  start: string;
  end: string;
};
const CATEGORIES = [
  { value: 'online', label: 'Mídia Online' },
  { value: 'organico', label: 'Conteúdo Orgânico' },
  { value: 'offline', label: 'Mídia Offline' },
  { value: 'prospeccao', label: 'Prospecção Ativa' },
];
const MODELS = [
  { value: 'cpm', label: 'CPM', unit: 'por mil impressões', multiple: 'impressões' },
  { value: 'cpc', label: 'CPC', unit: 'por clique', multiple: 'cliques' },
  { value: 'fixo', label: 'Pacote fixo', unit: 'por pacote', multiple: 'pacotes' },
];
const CPM_MODEL = { value: 'cpm', label: 'CPM', unit: 'por mil impressões', multiple: 'impressões' };
const ASSET_SAVED: AssetForm = {
  name: 'Banner Super Topo — Portal',
  category: 'online',
  description: 'Faixa no topo de todas as páginas do portal da feira, acima do menu.',
  width: 970,
  height: 250,
  model: 'cpm',
  price: 45,
  multiple: 1000,
  start: iso(1, 9),
  end: iso(31),
};
const BRIEFING_FIELDS = [
  { id: 'peca', title: 'Peça criativa', meta: 'Arquivo · obrigatório' },
  { id: 'url', title: 'URL de destino', meta: 'Link · obrigatório' },
  { id: 'alt', title: 'Texto alternativo da peça', meta: 'Texto curto' },
  { id: 'idioma', title: 'Idioma da peça', meta: 'Escolha única · obrigatório' },
  { id: 'pavilhoes', title: 'Pavilhões de interesse', meta: 'Várias escolhas' },
];
const fullDate = (date: string) => (date ? `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}` : '—');
const formText: Record<keyof AssetForm, { label: string; show: (form: AssetForm) => string }> = {
  name: { label: 'Nome', show: (form) => form.name || '—' },
  category: { label: 'Categoria', show: (form) => CATEGORIES.find((item) => item.value === form.category)?.label ?? '—' },
  description: { label: 'Descrição', show: (form) => form.description || '—' },
  width: { label: 'Largura', show: (form) => (form.width ? `${int(form.width)} px` : '—') },
  height: { label: 'Altura', show: (form) => (form.height ? `${int(form.height)} px` : '—') },
  model: { label: 'Modelo', show: (form) => MODELS.find((item) => item.value === form.model)?.label ?? '—' },
  price: { label: 'Preço', show: (form) => (form.price !== null ? money(form.price) : '—') },
  multiple: { label: 'Múltiplo de venda', show: (form) => (form.multiple ? int(form.multiple) : '—') },
  start: { label: 'Início da venda', show: (form) => fullDate(form.start) },
  end: { label: 'Fim da venda', show: (form) => fullDate(form.end) },
};

function AssetEditor() {
  const [saved, setSaved] = useState<AssetForm>(ASSET_SAVED);
  const [form, setForm] = useState<AssetForm>(ASSET_SAVED);
  const [nameError, setNameError] = useState<string>();
  const [reviewing, setReviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedLabel, setSavedLabel] = useState('Salvo em 21/10 às 16:42');
  const nameRef = useRef<HTMLInputElement>(null);
  const changed = (Object.keys(formText) as (keyof AssetForm)[]).filter((key) => form[key] !== saved[key]);
  const dirty = changed.length > 0;
  const set = <K extends keyof AssetForm>(key: K, value: AssetForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  const model = MODELS.find((item) => item.value === form.model) ?? CPM_MODEL;

  function review() {
    if (!form.name.trim()) {
      setNameError('Informe o nome do ativo');
      nameRef.current?.focus();
      return;
    }
    setReviewing(true);
  }
  function confirm() {
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      setReviewing(false);
      setSaved(form);
      setSavedLabel('Salvo agora');
      toast('Ativo atualizado', { description: `${plural(changed.length, 'campo alterado', 'campos alterados')} · ${form.name}` });
    }, 700);
  }

  return (
    <div className={t.editor}>
      <PageHeader title="Editar ativo" meta={['#A-014', 'Mídia Online']} />
      <div className={t.editorBody}>
        <Section title="Identificação">
          <div className={t.formGrid}>
            <Field label="Nome" required error={nameError}>
              {({ id, describedBy, invalid }) => (
                <Input
                  ref={nameRef}
                  id={id}
                  value={form.name}
                  invalid={invalid}
                  aria-describedby={describedBy}
                  onChange={(event) => {
                    set('name', event.target.value);
                    if (nameError) setNameError(undefined);
                  }}
                />
              )}
            </Field>
            <Field label="Categoria" required>
              {({ id, describedBy }) => (
                <Select id={id} describedBy={describedBy} value={form.category} onChange={(value) => set('category', value)} options={CATEGORIES} />
              )}
            </Field>
            <Field label="Descrição" optional className={t.span2}>
              {({ id, describedBy }) => (
                <Textarea
                  id={id}
                  aria-describedby={describedBy}
                  rows={3}
                  maxLength={280}
                  value={form.description}
                  onChange={(event) => set('description', event.target.value)}
                />
              )}
            </Field>
          </div>
        </Section>
        <Section title="Formato e preço">
          <div className={t.formGrid}>
            <FieldGroup label="Dimensões" required>
              <div className={t.dims}>
                <NumberField
                  label="Largura"
                  value={form.width}
                  onChange={(value) => set('width', value)}
                  min={1}
                  max={4000}
                  suffix="px"
                />
                <span className={t.times} aria-hidden="true">
                  ×
                </span>
                <NumberField
                  label="Altura"
                  value={form.height}
                  onChange={(value) => set('height', value)}
                  min={1}
                  max={4000}
                  suffix="px"
                />
              </div>
            </FieldGroup>
            <RadioGroup legend="Modelo" orientation="horizontal" required>
              {MODELS.map((item) => (
                <Radio
                  key={item.value}
                  name="tpl-asset-model"
                  value={item.value}
                  label={item.label}
                  checked={form.model === item.value}
                  onChange={() => set('model', item.value)}
                />
              ))}
            </RadioGroup>
            <Field label="Preço" required hint={model.unit}>
              {({ id, describedBy, invalid }) => (
                <MoneyField
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  value={form.price}
                  min={0}
                  onChange={(value) => set('price', value)}
                />
              )}
            </Field>
            <Field label="Múltiplo de venda" hint={`Venda em blocos de ${int(form.multiple ?? 1)} ${model.multiple}`}>
              {({ id, describedBy }) => (
                <NumberField
                  id={id}
                  aria-describedby={describedBy}
                  value={form.multiple}
                  onChange={(value) => set('multiple', value)}
                  min={1}
                  step={500}
                  suffix={model.multiple}
                />
              )}
            </Field>
          </div>
        </Section>
        <Section title="Janela de venda">
          <div className={t.formGridHalf}>
            <DateRangePicker
              labels
              required
              aria-label="Janela de venda"
              start={form.start}
              end={form.end}
              onChange={(range) => setForm((current) => ({ ...current, start: range.start, end: range.end }))}
            />
          </div>
        </Section>
        <Section
          title="Briefing"
          meta={plural(BRIEFING_FIELDS.length, 'campo', 'campos')}
          action={<LinkButton onClick={() => (window.location.hash = 'formulario-dinamico')}>Editar formulário</LinkButton>}
        >
          <List label="Campos do briefing">
            {BRIEFING_FIELDS.map((field) => (
              <ListItem key={field.id} density="sm" title={field.title} description={field.meta} />
            ))}
          </List>
        </Section>
      </div>
      <div className={t.dock}>
        <ActionBar
          status={dirty ? 'unsaved' : 'saved'}
          statusLabel={dirty ? 'Alterações não salvas' : savedLabel}
        >
          <Button
            variant="ghost"
            disabled={!dirty}
            onClick={() => {
              setForm(saved);
              setNameError(undefined);
              toast('Alterações descartadas', { tone: 'info' });
            }}
          >
            Cancelar
          </Button>
          <Button variant="primary" disabled={!dirty} onClick={review}>
            Salvar alterações
          </Button>
        </ActionBar>
      </div>
      <Dialog
        open={reviewing}
        onClose={() => !saving && setReviewing(false)}
        title="Revisar alterações"
        description={`${plural(changed.length, 'campo muda', 'campos mudam')} em ${saved.name}.`}
        footer={
          <>
            <Button disabled={saving} onClick={() => setReviewing(false)}>
              Voltar
            </Button>
            <Button variant="primary" loading={saving} data-autofocus onClick={confirm}>
              Salvar alterações
            </Button>
          </>
        }
      >
        <dl className={t.changes}>
          {changed.map((key) => (
            <div key={key}>
              <dt>{formText[key].label}</dt>
              <dd>
                <s>{formText[key].show(saved)}</s>
                <ArrowRight aria-hidden="true" />
                <span>{formText[key].show(form)}</span>
              </dd>
            </div>
          ))}
        </dl>
      </Dialog>
    </div>
  );
}

function CadastroTemplate() {
  const [preset, setPreset] = useState<EditPreset>('edicao');
  return (
    <TemplateFrame presets={{ label: 'Situação do ativo', value: preset, onChange: setPreset, options: EDIT_PRESETS }}>
      <PortalShell active="inventario" crumbs={['Configuração', 'Inventário', 'Banner Super Topo — Portal']}>
        {preset === 'edicao' ? (
          <AssetEditor />
        ) : (
          <div className={t.locked}>
            <AccessState
              kind="locked"
              title="Edição bloqueada"
              description="Banner Super Topo — Portal tem 3 campanhas em veiculação. A edição volta em 01/11."
              actions={
                <>
                  <Button variant="primary" onClick={() => (window.location.hash = 'template-listagem')}>
                    Ver campanhas
                  </Button>
                  <Button onClick={() => toast('Pedido enviado para Marina Lopes', { tone: 'info' })}>
                    Pedir liberação
                  </Button>
                </>
              }
            />
          </div>
        )}
      </PortalShell>
    </TemplateFrame>
  );
}

/* ═══════════════════════════ Configurações ═══════════════════════════ */

type SettingsPage = 'geral' | 'empresa' | 'membros' | 'notificacoes' | 'privacidade' | 'integracoes';
const SETTINGS_NAV: { id: SettingsPage; label: string }[] = [
  { id: 'geral', label: 'Geral' },
  { id: 'empresa', label: 'Empresa & Branding' },
  { id: 'membros', label: 'Membros' },
  { id: 'notificacoes', label: 'Notificações' },
  { id: 'privacidade', label: 'Privacidade' },
  { id: 'integracoes', label: 'Integrações' },
];

/** Estado de uma seção que salva sozinha: valor, salvo, sujo e o ciclo salvar → “Salvo”. */
function useSection<T>(initial: T) {
  const [saved, setSaved] = useState(initial);
  const [value, setValue] = useState(initial);
  const [phase, setPhase] = useState<'idle' | 'saving' | 'saved'>('idle');
  const dirty = JSON.stringify(value) !== JSON.stringify(saved);
  useEffect(() => {
    if (phase !== 'saved') return;
    const timer = window.setTimeout(() => setPhase('idle'), 2000);
    return () => window.clearTimeout(timer);
  }, [phase]);
  const save = () => {
    setPhase('saving');
    window.setTimeout(() => {
      setSaved(value);
      setPhase('saved');
    }, 700);
  };
  return { value, setValue, dirty, phase, save, reset: () => setValue(saved) };
}

/** Seção de configuração: título 14/600 e, à direita, “Alterações não salvas” + Salvar (ou “Salvo”). */
function SettingsSection({
  title,
  dirty,
  phase,
  onSave,
  action,
  children,
}: {
  title: string;
  dirty: boolean;
  phase: 'idle' | 'saving' | 'saved';
  onSave: () => void;
  action?: ReactNode;
  children: ReactNode;
}) {
  const show = dirty || phase === 'saving';
  return (
    <section className={t.setSection} aria-label={title}>
      <header className={t.setHead}>
        <h2>{title}</h2>
        <div className={t.setSave} aria-live="polite">
          {show ? (
            <span className={t.setDirty} key="dirty">
              <span className={t.setDirtyText}>
                <i aria-hidden="true" />
                Alterações não salvas
              </span>
              <Button size="sm" variant="primary" loading={phase === 'saving'} onClick={onSave}>
                Salvar
              </Button>
            </span>
          ) : phase === 'saved' ? (
            <span className={t.setSaved} key="saved">
              <Check aria-hidden="true" />
              Salvo
            </span>
          ) : (
            action
          )}
        </div>
      </header>
      <div className={t.setBody}>{children}</div>
    </section>
  );
}

function GeneralSettings() {
  const section = useSection({ name: 'Francal 2026', email: 'comercial@francal.com.br' });
  return (
    <SettingsSection title="Portal" dirty={section.dirty} phase={section.phase} onSave={section.save}>
      <FormRow label="Nome do portal" description="Aparece no topo e nos e-mails.">
        {({ id, describedBy }) => (
          <Input
            id={id}
            aria-describedby={describedBy}
            value={section.value.name}
            onChange={(event) => section.setValue({ ...section.value, name: event.target.value })}
          />
        )}
      </FormRow>
      <FormRow label="E-mail comercial" description="Recebe os P.I. assinados.">
        {({ id, describedBy }) => (
          <Input
            id={id}
            type="email"
            aria-describedby={describedBy}
            value={section.value.email}
            onChange={(event) => section.setValue({ ...section.value, email: event.target.value })}
          />
        )}
      </FormRow>
      <FormRow label="Fuso horário" description="Fixo para todos os portais.">
        {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value="Horário de Brasília (UTC−3)" readOnly />}
      </FormRow>
    </SettingsSection>
  );
}

function BrandingSettings() {
  const section = useSection({ color: '#f28c28', logo: '' });
  const [colorError, setColorError] = useState<string | null>(null);
  const on = contrastRatio(section.value.color, '#ffffff') >= 4.5 ? '#ffffff' : 'var(--ink)';
  return (
    <SettingsSection title="Marca" dirty={section.dirty} phase={section.phase} onSave={section.save}>
      <FormRow label="Cor do portal" description="Botões e links da Vitrine." error={colorError ?? undefined}>
        {({ id, describedBy, invalid }) => (
          <ColorField
            id={id}
            describedBy={describedBy}
            invalid={invalid}
            value={section.value.color}
            onChange={(color) => section.setValue({ ...section.value, color })}
            onInputError={setColorError}
          />
        )}
      </FormRow>
      <FormRow label="Logo" description="Quadrada, fundo transparente.">
        {section.value.logo ? (
          <FileRow
            name="francal-2026.png"
            size={48_200}
            type="image/png"
            status="done"
            preview={section.value.logo}
            format={{ w: 512, h: 512 }}
            onRemove={() => section.setValue({ ...section.value, logo: '' })}
          />
        ) : (
          <Dropzone
            accept="image/png,image/svg+xml"
            maxSize={2 * 1024 * 1024}
            spec="PNG ou SVG · 512 × 512 px · até 2 MB"
            format={{ w: 512, h: 512 }}
            onFiles={(files) => {
              const file = files[0];
              if (file) section.setValue({ ...section.value, logo: URL.createObjectURL(file) });
            }}
          />
        )}
      </FormRow>
      <FormRow label="Prévia" description="Menu lateral e Vitrine.">
        <div className={t.brandPreview} style={{ '--portal': section.value.color, '--portal-on': on } as CSSProperties}>
          <span className={t.brandMark} aria-hidden="true">
            {section.value.logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- prévia local (blob:)
              <img src={section.value.logo} alt="" />
            ) : (
              <svg viewBox="0 0 24 24">
                <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M5 19a14 14 0 0 1 14-14" />
                  <path d="M10 19a9 9 0 0 1 9-9" />
                </g>
                <circle cx="18.6" cy="18.6" r="1.6" fill="currentColor" />
              </svg>
            )}
          </span>
          <span className={t.brandText}>
            <strong>Francal 2026</strong>
            <span>Portal do organizador</span>
          </span>
          <span className={t.brandCta}>Agendar visita</span>
        </div>
      </FormRow>
    </SettingsSection>
  );
}

const MEMBERS = [
  { id: 'm1', name: 'Marina Lopes', email: 'marina@francal.com.br', role: 'admin' },
  { id: 'm2', name: 'Rafael Dias', email: 'rafael@francal.com.br', role: 'comercial' },
  { id: 'm3', name: 'Clara Souto', email: 'clara@francal.com.br', role: 'operacao' },
  { id: 'm4', name: 'Tiago Rezende', email: 'tiago@francal.com.br', role: 'comercial', pending: true },
];
const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'operacao', label: 'Operação' },
];

function MembersSettings() {
  const section = useSection(Object.fromEntries(MEMBERS.map((member) => [member.id, member.role])) as Record<string, string>);
  return (
    <SettingsSection
      title="Equipe do portal"
      dirty={section.dirty}
      phase={section.phase}
      onSave={section.save}
      action={
        <Button size="sm" icon={UserPlus} onClick={() => toast('Convite enviado', { tone: 'info', description: 'juliana@francal.com.br' })}>
          Convidar
        </Button>
      }
    >
      <ul className={t.members}>
        {MEMBERS.map((member) => (
          <li key={member.id}>
            <Avatar name={member.name} size="sm" decorative />
            <span className={t.memberText}>
              <strong>
                {member.name}
                {member.pending && (
                  <Badge size="sm" tone="amber" variant="text">
                    Convite pendente
                  </Badge>
                )}
              </strong>
              <span>{member.email}</span>
            </span>
            <span className={t.memberRole}>
              <Select
                size="sm"
                label={`Papel de ${member.name}`}
                value={section.value[member.id] ?? 'comercial'}
                disabled={member.id === 'm1'}
                onChange={(role) => section.setValue({ ...section.value, [member.id]: role })}
                options={ROLES}
              />
            </span>
            <span className={t.memberMenu}>
              <Menu
                align="end"
                label={`Ações de ${member.name}`}
                sections={[
                  {
                    items: member.pending
                      ? [{ label: 'Reenviar convite', icon: Mail, onSelect: () => toast('Convite reenviado', { tone: 'info', description: member.email }) }]
                      : [{ label: 'Copiar e-mail', icon: Copy }],
                  },
                  { items: [{ label: member.pending ? 'Cancelar convite' : 'Remover do portal', icon: Trash2, danger: true, disabled: member.id === 'm1' }] },
                ]}
                trigger={(props) => <IconButton {...props} label={`Ações de ${member.name}`} icon={Ellipsis} variant="ghost" size="sm" />}
              />
            </span>
          </li>
        ))}
      </ul>
    </SettingsSection>
  );
}

const NOTIFY = [
  { id: 'aprovacao', label: 'Campanha para aprovar', description: 'Quando um anunciante envia.' },
  { id: 'pi', label: 'P.I. assinado', description: 'Com o PDF anexo.' },
  { id: 'lead', label: 'Novo lead', description: 'Resumo a cada hora.' },
  { id: 'semanal', label: 'Resumo semanal', description: 'Segunda, às 8:00.' },
];

function NotificationSettings() {
  const section = useSection<Record<string, boolean>>({ aprovacao: true, pi: true, lead: false, semanal: true });
  return (
    <SettingsSection title="E-mails" dirty={section.dirty} phase={section.phase} onSave={section.save}>
      {NOTIFY.map((item) => (
        <div key={item.id} className={t.switchRow}>
          <span>
            <strong id={`tpl-notify-${item.id}`}>{item.label}</strong>
            <span>{item.description}</span>
          </span>
          <Switch
            label={item.label}
            hideLabel
            checked={section.value[item.id] ?? false}
            onCheckedChange={(checked) => section.setValue({ ...section.value, [item.id]: checked })}
          />
        </div>
      ))}
    </SettingsSection>
  );
}

const COMMS = [
  { id: 'novidades', label: 'Novidades da feira' },
  { id: 'ofertas', label: 'Ofertas de expositores' },
  { id: 'pesquisas', label: 'Pesquisas de satisfação' },
];
const CHANNELS_COMM = [
  { id: 'email', label: 'E-mail' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'push', label: 'Push no app' },
];

function PrivacySettings() {
  const section = useSection<Record<string, boolean>>({
    'novidades:email': true,
    'novidades:whatsapp': false,
    'novidades:push': true,
    'ofertas:email': true,
    'ofertas:whatsapp': false,
    'ofertas:push': false,
    'pesquisas:email': true,
    'pesquisas:whatsapp': false,
    'pesquisas:push': false,
  });
  return (
    <SettingsSection title="Comunicações aos visitantes" dirty={section.dirty} phase={section.phase} onSave={section.save}>
      <table className={t.matrix}>
        <caption className={t.srOnly}>Canais permitidos por tipo de comunicação</caption>
        <thead>
          <tr>
            <th scope="col">Comunicação</th>
            {CHANNELS_COMM.map((channel) => (
              <th key={channel.id} scope="col">
                {channel.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMMS.map((comm) => (
            <tr key={comm.id}>
              <th scope="row">{comm.label}</th>
              {CHANNELS_COMM.map((channel) => {
                const key = `${comm.id}:${channel.id}`;
                return (
                  <td key={channel.id}>
                    <Checkbox
                      aria-label={`${comm.label} por ${channel.label}`}
                      checked={section.value[key] ?? false}
                      onChange={(event) => section.setValue({ ...section.value, [key]: event.target.checked })}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </SettingsSection>
  );
}

function IntegrationSettings() {
  const section = useSection<Record<string, boolean>>({ webhook: true, csv: false, api: true });
  const rows = [
    { id: 'webhook', label: 'Webhook de leads', description: 'https://crm.francal.com.br/leads' },
    { id: 'csv', label: 'Planilha diária de leads', description: 'Por e-mail, às 7:00.' },
    { id: 'api', label: 'API de inventário', description: 'Chave final …9f3a' },
  ];
  return (
    <SettingsSection title="Conexões" dirty={section.dirty} phase={section.phase} onSave={section.save}>
      {rows.map((item) => (
        <div key={item.id} className={t.switchRow}>
          <span>
            <strong>{item.label}</strong>
            <span>{item.description}</span>
          </span>
          <Switch
            label={item.label}
            hideLabel
            checked={section.value[item.id] ?? false}
            onCheckedChange={(checked) => section.setValue({ ...section.value, [item.id]: checked })}
          />
        </div>
      ))}
    </SettingsSection>
  );
}

const SETTINGS_PAGES: Record<SettingsPage, ComponentType> = {
  geral: GeneralSettings,
  empresa: BrandingSettings,
  membros: MembersSettings,
  notificacoes: NotificationSettings,
  privacidade: PrivacySettings,
  integracoes: IntegrationSettings,
};

function SettingsScreen() {
  const [rootRef, width] = useWidth<HTMLDivElement>();
  const phone = width > 0 && width < 640;
  const [page, setPage] = useState<SettingsPage>('geral');
  const [phonePage, setPhonePage] = useState<SettingsPage | null>(null);
  const current = phone ? phonePage : page;
  const label = SETTINGS_NAV.find((item) => item.id === current)?.label ?? 'Configurações';
  const Page = current ? SETTINGS_PAGES[current] : null;
  return (
    <div ref={rootRef} className={t.settings}>
      {phone && current ? (
        <div className={t.setBack}>
          <Breadcrumb variant="compact" items={[{ label: 'Configurações', onClick: () => setPhonePage(null) }, { label }]} />
        </div>
      ) : null}
      <PageHeader title={phone && current ? label : 'Configurações'} />
      {phone && !current ? (
        <List label="Seções das configurações">
          {SETTINGS_NAV.map((item) => (
            <ListItem key={item.id} title={item.label} trailing={<ChevronRight className={t.chev} aria-hidden="true" />} onClick={() => setPhonePage(item.id)} />
          ))}
        </List>
      ) : (
        <div className={t.setLayout}>
          {!phone && (
            <nav className={t.subnav} aria-label="Seções das configurações">
              <ul>
                {SETTINGS_NAV.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={t.subnavItem}
                      aria-current={item.id === page ? 'page' : undefined}
                      onClick={() => setPage(item.id)}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <div className={t.setContent} key={current ?? 'lista'}>
            {Page && <Page />}
          </div>
        </div>
      )}
    </div>
  );
}

function ConfiguracoesTemplate() {
  return (
    <TemplateFrame>
      <PortalShell active="configuracoes" crumbs={['Portal', 'Configurações']}>
        <SettingsScreen />
      </PortalShell>
    </TemplateFrame>
  );
}

/* ═══════════════════════════ Catálogo ═══════════════════════════ */

type AssetCategory = 'online' | 'organico' | 'offline' | 'prospeccao';
type Asset = {
  id: string;
  code: string;
  name: string;
  category: AssetCategory;
  channel: string;
  audience: string;
  format: { w: number; h: number };
  /** Desenho do formato no cartão: peça na proporção, notificação ou lista. */
  kind: 'peca' | 'push' | 'lista';
  formatText: string;
  model: string;
  price: number;
  unit: string;
  multiple: string;
  /** Livre, em % do estoque da janela. */
  free: number;
  sold: number;
  start: string;
  end: string;
  weeks: ('livre' | 'reservado' | 'vendido')[];
};
const CATEGORY_LABEL: Record<AssetCategory, string> = {
  online: 'Mídia Online',
  organico: 'Conteúdo Orgânico',
  offline: 'Mídia Offline',
  prospeccao: 'Prospecção Ativa',
};
const W = (pattern: string) =>
  pattern.split('').map((char) => (char === 'v' ? 'vendido' : char === 'r' ? 'reservado' : 'livre')) as Asset['weeks'];
const ASSETS: Asset[] = [
  { id: 'a14', code: '#A-014', name: 'Banner Super Topo — Portal', category: 'online', channel: 'Portal da feira', audience: 'Visitantes credenciados', format: { w: 970, h: 250 }, kind: 'peca', formatText: '970 × 250 px', model: 'CPM', price: 45, unit: '/ mil impressões', multiple: '1.000 impressões', free: 32, sold: 11, start: iso(1, 9), end: iso(31), weeks: W('vvvrrlll') },
  { id: 'a09', code: '#A-009', name: 'E-mail marketing dedicado', category: 'online', channel: 'Newsletter', audience: 'Lojistas e compradores', format: { w: 600, h: 1000 }, kind: 'peca', formatText: '600 × 1000 px', model: 'Por disparo', price: 4500, unit: '/ disparo', multiple: '1 disparo', free: 50, sold: 8, start: iso(1, 9), end: iso(31), weeks: W('vrvlvlll') },
  { id: 'a11', code: '#A-011', name: 'Push no app da feira', category: 'online', channel: 'App Francal', audience: 'Visitantes credenciados', format: { w: 4, h: 1 }, kind: 'push', formatText: 'Texto · 120 caracteres', model: 'Por disparo', price: 1200, unit: '/ disparo', multiple: '1 disparo', free: 64, sold: 6, start: iso(1, 10), end: iso(31), weeks: W('rvlllrll') },
  { id: 'a17', code: '#A-017', name: 'Destaque na vitrine', category: 'online', channel: 'Vitrine', audience: 'Lojistas e compradores', format: { w: 1200, h: 900 }, kind: 'peca', formatText: '1200 × 900 px', model: 'Pacote fixo', price: 2800, unit: '/ semana', multiple: '1 semana', free: 18, sold: 9, start: iso(15, 9), end: iso(31), weeks: W('vvvvrvll') },
  { id: 'a21', code: '#A-021', name: 'Post patrocinado no Instagram oficial', category: 'organico', channel: 'Instagram oficial', audience: 'Imprensa e influenciadores', format: { w: 1080, h: 1080 }, kind: 'peca', formatText: '1080 × 1080 px', model: 'Pacote fixo', price: 6500, unit: '/ pacote', multiple: '1 pacote', free: 40, sold: 5, start: iso(1, 10), end: iso(30, 11), weeks: W('vlrlvlll') },
  { id: 'a22', code: '#A-022', name: 'Matéria no blog da feira', category: 'organico', channel: 'Portal da feira', audience: 'Visitantes credenciados', format: { w: 1600, h: 900 }, kind: 'peca', formatText: 'Capa 1600 × 900 px', model: 'Pacote fixo', price: 3200, unit: '/ matéria', multiple: '1 matéria', free: 75, sold: 2, start: iso(1, 10), end: iso(30, 11), weeks: W('lvllllrl') },
  { id: 'a05', code: '#A-005', name: 'Painel de LED — Pavilhão Azul', category: 'offline', channel: 'Pavilhões', audience: 'Visitantes credenciados', format: { w: 1920, h: 1080 }, kind: 'peca', formatText: '1920 × 1080 px · 15 s', model: 'Pacote fixo', price: 18000, unit: '/ dia de feira', multiple: '1 dia', free: 25, sold: 3, start: iso(6, 11), end: iso(9, 11), weeks: W('llllvvrl') },
  { id: 'a06', code: '#A-006', name: 'Totem na entrada principal', category: 'offline', channel: 'Pavilhões', audience: 'Visitantes credenciados', format: { w: 1080, h: 1920 }, kind: 'peca', formatText: '1080 × 1920 px', model: 'Pacote fixo', price: 7500, unit: '/ dia de feira', multiple: '1 dia', free: 50, sold: 2, start: iso(6, 11), end: iso(9, 11), weeks: W('llllrvll') },
  { id: 'a30', code: '#A-030', name: 'Rodada de negócios — lista qualificada', category: 'prospeccao', channel: 'Lista qualificada', audience: 'Lojistas e compradores', format: { w: 4, h: 3 }, kind: 'lista', formatText: 'Lista · 80 contatos', model: 'Por lista', price: 3600, unit: '/ lista', multiple: '1 lista', free: 60, sold: 4, start: iso(1, 10), end: iso(9, 11), weeks: W('vlrlllll') },
];
const WEEK_LABELS = ['06/10', '13/10', '20/10', '27/10', '03/11', '10/11', '17/11', '24/11'];
const ASSET_CHANNELS = [...new Set(ASSETS.map((asset) => asset.channel))];
type SortKey = 'vendidos' | 'preco' | 'livre' | 'nome';
const SORTS: { value: SortKey; label: string }[] = [
  { value: 'vendidos', label: 'Ordenar: Mais vendidos' },
  { value: 'preco', label: 'Ordenar: Menor preço' },
  { value: 'livre', label: 'Ordenar: Mais disponível' },
  { value: 'nome', label: 'Ordenar: Nome' },
];
const priceText = (asset: Asset) => money(asset.price);

/** Miniatura do formato: a peça na proporção (até 168 × 72), a notificação ou a lista, e a medida embaixo. */
function FormatThumb({ asset }: { asset: Asset }) {
  const ratio = asset.format.w / asset.format.h;
  const box = ratio >= 168 / 72 ? { width: 168, height: Math.round(168 / ratio) } : { width: Math.round(72 * ratio), height: 72 };
  return (
    <span className={t.formatThumb} aria-hidden="true">
      {asset.kind === 'push' ? (
        <span className={t.formatPush}>
          <i />
          <span>
            <b />
            <b />
          </span>
        </span>
      ) : asset.kind === 'lista' ? (
        <span className={t.formatList}>
          {[0, 1, 2].map((index) => (
            <span key={index}>
              <i />
              <b />
            </span>
          ))}
        </span>
      ) : (
        <span className={t.formatBox} style={box} />
      )}
      <span className={t.formatLabel}>{asset.formatText}</span>
    </span>
  );
}

/** Esboço da peça dentro da moldura do formato: marca, duas linhas e o botão — chapado, em b-25. */
function AdMock({ asset }: { asset: Asset }) {
  if (asset.kind !== 'peca')
    return (
      <span className={t.formatMock}>
        <FormatThumb asset={{ ...asset, formatText: '' }} />
      </span>
    );
  const wide = asset.format.w / asset.format.h >= 1.6;
  return (
    <span className={t.adMock} data-wide={wide || undefined}>
      <BrandMark name="Aurora Calçados" size={wide ? 'md' : 'lg'} variant="paper" decorative />
      <span className={t.adLines}>
        <b />
        <b />
      </span>
      <i className={t.adCta} />
    </span>
  );
}

function AssetCard({ asset, selected, onOpen }: { asset: Asset; selected: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      className={t.assetCard}
      aria-pressed={selected}
      aria-label={`${asset.name}, ${CATEGORY_LABEL[asset.category]}, ${priceText(asset)} ${asset.unit}, ${asset.free}% livre`}
      onClick={onOpen}
    >
      <span className={t.assetFrame} aria-hidden="true">
        <FormatThumb asset={asset} />
      </span>
      <span className={t.assetBody}>
        <span className={t.assetName}>{asset.name}</span>
        <span className={t.assetMeta}>
          <span>{asset.channel}</span>
          <span>{asset.audience}</span>
        </span>
        <span className={t.assetMeter}>
          <Meter
            value={asset.free}
            label={`${asset.free}% livre`}
            size="sm"
            tone={asset.free < 20 ? 'amber' : 'blue'}
            start="Disponível"
            end={`${asset.free}%`}
          />
        </span>
        <span className={t.assetPrice}>
          <strong>{priceText(asset)}</strong>
          <span>{asset.unit}</span>
        </span>
      </span>
    </button>
  );
}

function AvailabilityGrid({ weeks }: { weeks: Asset['weeks'] }) {
  const text = { livre: 'Livre', reservado: 'Reservado', vendido: 'Vendido' } as const;
  return (
    <div className={t.avail}>
      <ol className={t.availGrid} aria-label="Disponibilidade por semana">
        {weeks.map((state, index) => (
          <li key={WEEK_LABELS[index] ?? index} data-state={state} title={`Semana de ${WEEK_LABELS[index] ?? ''}: ${text[state]}`}>
            <i aria-hidden="true" />
            <span>{WEEK_LABELS[index]}</span>
            <VisuallyHidden>{text[state]}</VisuallyHidden>
          </li>
        ))}
      </ol>
      <ul className={t.availKey} aria-hidden="true">
        {(['livre', 'reservado', 'vendido'] as const).map((state) => (
          <li key={state} data-state={state}>
            <i />
            {text[state]}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CatalogFilters({
  channel,
  onChannel,
  range,
  onRange,
  sort,
  onSort,
  stacked = false,
}: {
  channel: string;
  onChannel: (value: string) => void;
  range: DateRange;
  onRange: (value: DateRange) => void;
  sort: SortKey;
  onSort: (value: SortKey) => void;
  stacked?: boolean;
}) {
  const channelSelect = (
    <Select
      size={stacked ? 'md' : 'sm'}
      label="Canal"
      value={channel}
      onChange={onChannel}
      placeholder="Canal"
      options={[{ value: '', label: 'Todos os canais' }, ...ASSET_CHANNELS.map((name) => ({ value: name, label: name }))]}
    />
  );
  const period = (
    <DateRangePicker
      size={stacked ? 'md' : 'sm'}
      aria-label="Período"
      placeholder="Período"
      clearable
      duration={false}
      start={range.start}
      end={range.end}
      onChange={onRange}
    />
  );
  const order = (
    <Select size={stacked ? 'md' : 'sm'} label="Ordenar" value={sort} onChange={(value) => onSort(value as SortKey)} options={SORTS} />
  );
  if (stacked)
    return (
      <div className={t.sheetFields}>
        <Field label="Canal">{() => channelSelect}</Field>
        <Field label="Período">{() => period}</Field>
        <Field label="Ordem">{() => order}</Field>
      </div>
    );
  return (
    <>
      <span className={t.catSelect}>{channelSelect}</span>
      <span className={t.catDate}>{period}</span>
      <span className={t.catSort}>{order}</span>
    </>
  );
}

function Catalog() {
  const [rootRef, width] = useWidth<HTMLDivElement>();
  const phone = width > 0 && width < 640;
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [channel, setChannel] = useState('');
  const [range, setRange] = useState<DateRange>({ start: '', end: '' });
  const [sort, setSort] = useState<SortKey>('vendidos');
  const [openId, setOpenId] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const term = query.trim().toLowerCase();
  const list = ASSETS.filter((asset) => {
    if (category && asset.category !== category) return false;
    if (channel && asset.channel !== channel) return false;
    if (range.start && asset.end < range.start) return false;
    if (range.end && asset.start > range.end) return false;
    if (term && !`${asset.name} ${asset.channel} ${asset.audience} ${asset.code}`.toLowerCase().includes(term)) return false;
    return true;
  }).sort((a, b) =>
    sort === 'preco' ? a.price - b.price : sort === 'livre' ? b.free - a.free : sort === 'nome' ? a.name.localeCompare(b.name, 'pt-BR') : b.sold - a.sold,
  );
  const counts = (key: AssetCategory) => ASSETS.filter((asset) => asset.category === key).length;
  const sheetCount = [channel, range.start || range.end].filter(Boolean).length;
  const filtersOn = Boolean(category || channel || range.start || range.end || term);
  const clear = () => {
    setQuery('');
    setCategory(null);
    setChannel('');
    setRange({ start: '', end: '' });
  };
  const open = ASSETS.find((asset) => asset.id === openId);
  const signature = `${category}:${channel}:${range.start}:${range.end}:${term}:${sort}`;
  const toggles = (
    <ToggleGroup
      type="single"
      label="Categoria"
      value={category}
      onChange={setCategory}
      items={(Object.keys(CATEGORY_LABEL) as AssetCategory[]).map((key) => ({ value: key, label: CATEGORY_LABEL[key], count: counts(key) }))}
    />
  );
  return (
    <div ref={rootRef} className={t.catalog}>
      <PageHeader
        title="Inventário"
        description="9 ativos · Francal 2026"
        actions={
          <Button variant="primary" icon={Plus} onClick={() => (window.location.hash = 'template-cadastro')}>
            Novo ativo
          </Button>
        }
      />
      <div className={t.catToolbar}>
        <span className={t.catSearch}>
          <SearchField size="sm" value={query} onValueChange={setQuery} placeholder="Ativo, canal ou código" label="Buscar ativo" />
        </span>
        {phone ? (
          <Button size="sm" icon={SlidersHorizontal} onClick={() => setSheet(true)} aria-haspopup="dialog">
            {sheetCount ? `Filtros ${sheetCount}` : 'Filtros'}
          </Button>
        ) : (
          <CatalogFilters channel={channel} onChannel={setChannel} range={range} onRange={setRange} sort={sort} onSort={setSort} />
        )}
      </div>
      <div className={t.catToggles}>{toggles}</div>
      <div className={t.catResult} key={signature}>
        {list.length ? (
          <>
            {filtersOn && (
              <p className={t.catCount} aria-live="polite">
                {list.length} de {plural(ASSETS.length, 'ativo', 'ativos')}
              </p>
            )}
            <ul className={t.catGrid}>
              {list.map((asset) => (
                <li key={asset.id}>
                  <AssetCard asset={asset} selected={asset.id === openId} onOpen={() => setOpenId(asset.id)} />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className={t.catEmpty}>
            <EmptyState
              icon={SearchX}
              title="Nenhum ativo para esses filtros"
              actions={
                <Button size="sm" onClick={clear}>
                  Limpar filtros
                </Button>
              }
            />
          </div>
        )}
      </div>
      <Drawer
        open={Boolean(open)}
        onClose={() => setOpenId(null)}
        size="md"
        title={open?.name ?? ''}
        description={open ? `${CATEGORY_LABEL[open.category]} · ${open.code}` : undefined}
        footer={
          <>
            <Button onClick={() => (window.location.hash = 'template-cadastro')}>Editar ativo</Button>
            <Button
              variant="primary"
              onClick={() => {
                setOpenId(null);
                toast('Nova campanha iniciada', { tone: 'info', description: open?.name });
              }}
            >
              Usar em nova campanha
            </Button>
          </>
        }
      >
        {open && (
          <div className={t.drawerBody}>
            <div className={t.drawerFrame}>
              <MediaFrame
                ratio={open.kind === 'peca' ? `${open.format.w}/${open.format.h}` : '16/9'}
                alt={`Formato de ${open.name}`}
                caption={open.formatText}
                style={{ maxWidth: open.format.w >= open.format.h || open.kind !== 'peca' ? '100%' : `${Math.round(220 * (open.format.w / open.format.h))}px` }}
              >
                <AdMock asset={open} />
              </MediaFrame>
            </div>
            <DescriptionList
              label="Ficha do ativo"
              labelWidth={140}
              items={[
                { label: 'Canal', value: open.channel },
                { label: 'Público', value: open.audience },
                { label: 'Modelo', value: open.model },
                { label: 'Preço', value: `${priceText(open)} ${open.unit}` },
                { label: 'Múltiplo de venda', value: open.multiple },
                { label: 'Janela de venda', value: `${fullDate(open.start)} – ${fullDate(open.end)}` },
              ]}
            />
            <section className={t.drawerSection} aria-label="Disponibilidade">
              <h3>Disponibilidade</h3>
              <AvailabilityGrid weeks={open.weeks} />
            </section>
          </div>
        )}
      </Drawer>
      <BottomSheet
        open={sheet}
        onClose={() => setSheet(false)}
        contained
        title="Filtros"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setChannel('');
                setRange({ start: '', end: '' });
                setSort('vendidos');
              }}
            >
              Limpar
            </Button>
            <Button variant="primary" onClick={() => setSheet(false)}>
              {`Ver ${plural(list.length, 'ativo', 'ativos')}`}
            </Button>
          </>
        }
      >
        <CatalogFilters stacked channel={channel} onChannel={setChannel} range={range} onRange={setRange} sort={sort} onSort={setSort} />
      </BottomSheet>
    </div>
  );
}

function CatalogoTemplate() {
  return (
    <TemplateFrame>
      <PortalShell active="inventario" crumbs={['Configuração', 'Inventário']}>
        <Catalog />
      </PortalShell>
    </TemplateFrame>
  );
}

/* ═══════════════════════════ Vitrine pública ═══════════════════════════ */

type VisitPreset = 'primeira' | 'recorrente';
const VISIT_PRESETS: SegmentOption<VisitPreset>[] = [
  { value: 'primeira', label: 'Primeira visita' },
  { value: 'recorrente', label: 'Recorrente' },
];
const PORTAL_COLOR = '#f28c28';

function mixHex(a: string, b: string, amount: number) {
  const channel = (hex: string, index: number) => parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16);
  return `#${[0, 1, 2]
    .map((index) => Math.round(channel(a, index) + (channel(b, index) - channel(a, index)) * amount).toString(16).padStart(2, '0'))
    .join('')}`;
}
/** Paleta do portal: CTA na cor do portal (texto pelo contraste), links e seleção numa versão ≥ 4,5:1. */
function portalVars(color: string): CSSProperties {
  const on = contrastRatio(color, '#ffffff') >= 4.5 ? '#ffffff' : '#141824';
  let text = color;
  for (let amount = 0.04; contrastRatio(text, '#ffffff') < 4.5 && amount <= 1; amount += 0.04) text = mixHex(color, '#000000', amount);
  return {
    '--portal': color,
    '--portal-on': on,
    '--portal-hover': mixHex(color, '#000000', 0.08),
    '--portal-pressed': mixHex(color, '#000000', 0.16),
    '--b-600': text,
    '--b-700': mixHex(text, '#000000', 0.12),
    '--accent-pressed': mixHex(text, '#000000', 0.22),
    '--b-25': mixHex(color, '#ffffff', 0.95),
    '--b-50': mixHex(color, '#ffffff', 0.9),
    '--b-100': mixHex(color, '#ffffff', 0.82),
    '--b-200': mixHex(color, '#ffffff', 0.68),
    '--b-300': mixHex(color, '#ffffff', 0.5),
    '--select-bg': mixHex(color, '#ffffff', 0.94),
    '--select-line': mixHex(color, '#ffffff', 0.5),
    '--select-ink': text,
    '--choice-hover-line': mixHex(color, '#ffffff', 0.68),
    '--accent': text,
    '--accent-ink': text,
  } as CSSProperties;
}

type ProductShape = 'tenis' | 'sandalia' | 'bota' | 'bolsa';
const PRODUCTS: {
  id: string;
  name: string;
  material: string;
  sizes: string;
  category: string;
  shape: ProductShape;
  colors: string[];
  tone: string;
  isNew: boolean;
}[] = [
  { id: 'p1', name: 'Sandália Lia', material: 'Couro caramelo', sizes: '34–40', category: 'sandalias', shape: 'sandalia', colors: ['#c98a4b', '#2b2420', '#e9dfd2'], tone: '#f1e4d4', isNew: true },
  { id: 'p2', name: 'Tênis Brisa', material: 'Couro e tela reciclada', sizes: '34–41', category: 'tenis', shape: 'tenis', colors: ['#f6f4ee', '#7d8a6a'], tone: '#dfe3dc', isNew: true },
  { id: 'p3', name: 'Mule Aurora', material: 'Camurça oliva', sizes: '34–39', category: 'sandalias', shape: 'sandalia', colors: ['#7d8a6a', '#b8754a'], tone: '#e6e8de', isNew: true },
  { id: 'p4', name: 'Bota Serra', material: 'Couro café', sizes: '35–40', category: 'botas', shape: 'bota', colors: ['#5a3d2b', '#1c1a19'], tone: '#ece3da', isNew: true },
  { id: 'p5', name: 'Bolsa Feira', material: 'Couro vegetal', sizes: 'Única', category: 'bolsas', shape: 'bolsa', colors: ['#b8754a', '#e9dfd2'], tone: '#f1e6dc', isNew: true },
  { id: 'p6', name: 'Rasteira Mar', material: 'Couro off-white', sizes: '34–40', category: 'sandalias', shape: 'sandalia', colors: ['#e9dcc8', '#c98a4b'], tone: '#e4e8ec', isNew: false },
  { id: 'p7', name: 'Tênis Pista', material: 'Couro branco', sizes: '35–42', category: 'tenis', shape: 'tenis', colors: ['#fbfaf8', '#1c1a19'], tone: '#e2e5ea', isNew: false },
  { id: 'p8', name: 'Coturno Vale', material: 'Couro preto', sizes: '35–40', category: 'botas', shape: 'bota', colors: ['#25221f'], tone: '#e6e6e8', isNew: false },
];

/** Silhueta chapada do produto na cor principal (no lugar de foto de banco). */
function ProductSilhouette({ shape, color }: { shape: ProductShape; color: string }) {
  const sole = 'rgb(20 24 36 / 0.16)';
  const edge = 'rgb(20 24 36 / 0.1)';
  return (
    <svg viewBox="0 0 120 72" aria-hidden="true">
      {shape === 'tenis' && (
        <>
          <path d="M10 53V31c0-6 4-9 10-9l12 2c8 1 14-4 20-10l10-2c4 8 12 14 26 18l16 4c8 2 12 8 12 14v5z" fill={color} stroke={edge} />
          <rect x="8" y="53" width="104" height="7" rx="3.5" fill={sole} />
        </>
      )}
      {shape === 'sandalia' && (
        <>
          <path d="M8 55c0-5 20-8 52-8s52 3 52 8-20 6-52 6S8 60 8 55z" fill={sole} />
          <path d="M30 50c5-15 16-24 30-24s25 9 30 24" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
          <path d="M52 49c1-7 4-11 8-11s7 4 8 11" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" />
        </>
      )}
      {shape === 'bota' && (
        <>
          <path d="M34 6h26l3 31c12 2 30 5 40 9 6 2 9 6 9 11v1H34z" fill={color} stroke={edge} />
          <rect x="32" y="56" width="82" height="7" rx="3.5" fill={sole} />
        </>
      )}
      {shape === 'bolsa' && (
        <>
          <path d="M44 30c0-9 7-15 16-15s16 6 16 15" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
          <rect x="30" y="28" width="60" height="36" rx="6" fill={color} stroke={edge} />
          <rect x="30" y="40" width="60" height="3" fill={sole} />
        </>
      )}
    </svg>
  );
}

const POSTER = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect width="640" height="360" fill="#efe3d6"/><rect y="250" width="640" height="110" fill="#e6d6c5"/><g transform="translate(70 150) scale(1.7)"><path d="M10 53V31c0-6 4-9 10-9l12 2c8 1 14-4 20-10l10-2c4 8 12 14 26 18l16 4c8 2 12 8 12 14v5z" fill="#f6f4ee"/><rect x="8" y="53" width="104" height="7" rx="3.5" fill="#cdbfb1"/></g><g transform="translate(250 162) scale(1.6)"><path d="M8 55c0-5 20-8 52-8s52 3 52 8-20 6-52 6S8 60 8 55z" fill="#cdbfb1"/><path d="M30 50c5-15 16-24 30-24s25 9 30 24" fill="none" stroke="#c98a4b" stroke-width="8" stroke-linecap="round"/></g><g transform="translate(420 140) scale(1.7)"><path d="M34 6h26l3 31c12 2 30 5 40 9 6 2 9 6 9 11v1H34z" fill="#5a3d2b"/><rect x="32" y="56" width="82" height="7" rx="3.5" fill="#cdbfb1"/></g></svg>`,
)}`;
const PRODUCT_CATS = [
  { value: 'sandalias', label: 'Sandálias' },
  { value: 'tenis', label: 'Tênis' },
  { value: 'botas', label: 'Botas' },
  { value: 'bolsas', label: 'Bolsas' },
];

function ProductCard({ product }: { product: (typeof PRODUCTS)[number] }) {
  return (
    <a className={t.product} href="#template-vitrine" onClick={(event) => event.preventDefault()}>
      <MediaFrame ratio="4/3" alt={product.name} radius="md">
        <span className={t.productShot} style={{ background: product.tone }}>
          <ProductSilhouette shape={product.shape} color={product.colors[0] ?? '#c98a4b'} />
        </span>
      </MediaFrame>
      <span className={t.productName}>{product.name}</span>
      <span className={t.productMeta}>
        {product.material} · {product.sizes}
      </span>
      <span className={t.productColors} aria-label={`${plural(product.colors.length, 'cor', 'cores')}`}>
        {product.colors.map((color) => (
          <i key={color} style={{ background: color }} />
        ))}
      </span>
    </a>
  );
}

/** Planta do pavilhão: estandes em blocos chapados, o do expositor na cor do portal. */
function StandMap() {
  const stands = ['B-208', 'B-210', 'B-212', 'B-214', 'B-216', 'B-218', 'C-201', 'C-203', 'C-205', 'C-207', 'C-209', 'C-211'];
  return (
    <figure className={t.standMap}>
      <div className={t.standGrid} role="img" aria-label="Pavilhão Azul, estande B-214 em destaque, perto da entrada leste">
        {stands.map((stand) => (
          <span key={stand} data-on={stand === 'B-214' || undefined}>
            {stand === 'B-214' ? stand : ''}
          </span>
        ))}
        <span className={t.standAisle} aria-hidden="true" />
      </div>
      <figcaption>Pavilhão Azul · entrada leste</figcaption>
    </figure>
  );
}

function Vitrine({ firstVisit }: { firstVisit: boolean }) {
  const [rootRef, width] = useWidth<HTMLDivElement>();
  const phone = width > 0 && width < 640;
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [consent, setConsent] = useState<'pending' | 'done'>(firstVisit ? 'pending' : 'done');
  const products = PRODUCTS.filter((product) => !category || product.category === category);
  const schedule = () => toast('Visita agendada', { description: 'Aurora Calçados · 07/07 às 10:30 · Estande B-214' });
  return (
    <div ref={rootRef} className={t.vitrine} style={portalVars(PORTAL_COLOR)}>
      <header className={t.vTop}>
        <BrandLockup name="Francal 2026" detail="Vitrine" size="sm" />
        {phone ? (
          <IconButton className={t.vSearchIcon} label="Buscar produtos e expositores" icon={Search} variant="ghost" size="sm" />
        ) : (
          <span className={t.vSearch}>
            <SearchField size="sm" value={query} onValueChange={setQuery} placeholder="Produtos e expositores" label="Buscar produtos e expositores" />
          </span>
        )}
        <Button variant="ghost" size="sm">
          Entrar
        </Button>
      </header>
      <section className={t.vBand} aria-label="Expositor">
        <div className={t.vBandInner}>
          <BrandMark name="Aurora Calçados" size="xl" variant="paper" decorative />
          <div className={t.vBandText}>
            <h2>Aurora Calçados</h2>
            <p>Pavilhão Azul · Estande B-214</p>
          </div>
          {!phone && (
            <Button variant="contrast" icon={CalendarPlus} onClick={schedule}>
              Agendar visita
            </Button>
          )}
        </div>
      </section>
      <main className={t.vMain}>
        <Carousel label="Lançamentos" title="Lançamentos" perView={phone ? 1 : 4}>
          {PRODUCTS.filter((product) => product.isNew).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </Carousel>
        <section className={t.vSection} aria-labelledby="tpl-v-produtos">
          <header className={t.vHead}>
            <h3 id="tpl-v-produtos">Produtos</h3>
            <ToggleGroup type="single" label="Categoria de produto" value={category} onChange={setCategory} items={PRODUCT_CATS} />
          </header>
          <ul className={t.vGrid} key={category ?? 'todos'}>
            {products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </section>
        <section className={t.vSection} aria-labelledby="tpl-v-video">
          <header className={t.vHead}>
            <h3 id="tpl-v-video">Coleção Primavera-Verão 2027</h3>
          </header>
          <div className={t.vVideo}>
            <VideoPlayer title="Coleção Primavera-Verão 2027 · Aurora Calçados" duration={94} poster={POSTER} />
          </div>
        </section>
        <section className={t.vSection} aria-labelledby="tpl-v-contato">
          <header className={t.vHead}>
            <h3 id="tpl-v-contato">Contato</h3>
          </header>
          <div className={t.vContact}>
            <DescriptionList
              label="Contato do expositor"
              labelWidth={120}
              items={[
                { label: 'Responsável', value: 'Paula Mendes' },
                { label: 'E-mail', value: 'comercial@auroracalcados.com.br', copy: 'comercial@auroracalcados.com.br' },
                { label: 'Telefone', value: '(51) 3594-2210', copy: '(51) 3594-2210' },
                { label: 'Site', value: <TextLink href="#template-vitrine" external>auroracalcados.com.br</TextLink> },
                { label: 'Estande', value: 'Pavilhão Azul · B-214' },
              ]}
            />
            <StandMap />
          </div>
        </section>
      </main>
      <footer className={t.vFoot}>
        <span className={t.vFootLinks}>
          <TextLink href="#template-vitrine" tone="quiet" size="sm">
            Privacidade
          </TextLink>
          <TextLink href="#template-vitrine" tone="quiet" size="sm">
            Termos de uso
          </TextLink>
        </span>
        <MadeWith href="#template-vitrine" />
      </footer>
      {phone && (
        <div className={t.vCtaBar}>
          <Button variant="primary" icon={CalendarPlus} className={t.full} onClick={schedule}>
            Agendar visita
          </Button>
        </div>
      )}
      {consent === 'pending' && (
        <div className={t.vConsent} role="region" aria-label="Privacidade">
          <p>Usamos cookies para medir as visitas a esta Vitrine.</p>
          <span className={t.vConsentActions}>
            <Button size="sm" onClick={() => setConsent('done')}>
              Só essenciais
            </Button>
            <Button size="sm" variant="primary" onClick={() => setConsent('done')}>
              Aceitar
            </Button>
          </span>
        </div>
      )}
    </div>
  );
}

function VitrineTemplate() {
  const [preset, setPreset] = useState<VisitPreset>('primeira');
  return (
    <TemplateFrame scroll presets={{ label: 'Visita', value: preset, onChange: setPreset, options: VISIT_PRESETS }}>
      <Vitrine key={preset} firstVisit={preset === 'primeira'} />
    </TemplateFrame>
  );
}

/* ——————————————————————————— Registro ——————————————————————————— */

/** Pranchas da família Templates (id do inventário → componente). */
export const specimens: Record<string, ComponentType> = {
  'template-acesso': AcessoTemplate,
  'template-dashboard': DashboardTemplate,
  'template-listagem': ListagemTemplate,
  'template-detalhe': DetalheTemplate,
  'template-cadastro': CadastroTemplate,
  'template-configuracoes': ConfiguracoesTemplate,
  'template-catalogo': CatalogoTemplate,
  'template-vitrine': VitrineTemplate,
};

/**
 * LOCAL — peças montadas aqui porque a biblioteca não tem (ou não cobre) o caso:
 * - TemplateFrame: moldura 1440 · 390 do catálogo (só prancha).
 * - ApprovalsMetric: célula-link da MetricStrip (`Metric` não aceita `href`).
 * - CampaignCards / DeliverySwitch / CardSkeletons: linha-cartão da lista no celular (como no dashboard).
 * - FormatThumb / AdMock: miniatura do formato no cartão do ativo (`FormatFrame` corta a medida em peças
 *   em pé estreitas, ex.: 1080 × 1920) e esboço da peça dentro do `MediaFrame` da gaveta.
 * - AvailabilityGrid: grade de 8 semanas (livre · reservado · vendido) da gaveta do ativo.
 * - SettingsSection / useSection: seção de configuração que salva sozinha (“Alterações não salvas” → Salvo).
 * - Sub-menu das configurações, lista de membros e matriz de comunicações (padrões ainda sem componente).
 * - ProductSilhouette / StandMap: imagem de produto e planta do pavilhão chapadas, sem foto de banco.
 */
