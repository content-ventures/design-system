'use client';

/*
 * Padrões B — composição da biblioteca ds-v3 (sem arquivo de biblioteca próprio).
 * Pedido de inserção · Revisão e aprovação · Preço, desconto e bônus · Importação e exportação ·
 * Membros e permissões · Editor de blocos · Expositor e produto · Planos e benefícios ·
 * Preferências e consentimento.
 *
 * Peças locais (a biblioteca ainda não tem): ConfirmDialog (Dialog sm sem divisória, como o
 * /dashboardv3), StatusText (ponto + palavra com troca animada), Seal (selo de assinatura),
 * SignSteps (régua horizontal de assinatura), Dropzone, Gallery e Swatches.
 */

import {
  type LucideIcon,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  Clock3,
  CloudUpload,
  Download,
  Ellipsis,
  FileDown,
  FileSpreadsheet,
  Lock,
  Mail,
  RotateCcw,
  Send,
  Trash2,
  Upload,
  X,
  Contact,
  Copy,
  Eye,
  EyeOff,
  GalleryHorizontal,
  LayoutGrid,
  Monitor,
  PanelTop,
  Play,
  Plus,
  Redo2,
  Smartphone,
  SquarePlay,
  Type,
  Undo2,
  Bookmark,
  CalendarClock,
  MapPin,
  Phone,
  Cookie,
  Search,
} from 'lucide-react';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  Avatar,
  BrandMark,
  Button,
  ButtonGroup,
  Checkbox,
  Chip,
  ChoiceCard,
  Dialog,
  DialogFrame,
  Field,
  IconButton,
  Input,
  Menu,
  MenuPanel,
  Radio,
  Segmented,
  Switch,
  Textarea,
  Timeline,
  Tooltip,
  VisuallyHidden,
  type MenuSection,
  type TimelineEntry,
  type Tone,
} from '@content-ventures/design-system/v3';
import { List, ListItem } from '@content-ventures/design-system/v3/list-item';
import { TagInput } from '@content-ventures/design-system/v3/tag-input';
import { Slider } from '@content-ventures/design-system/v3/slider';
import { Alert, Progress } from '@content-ventures/design-system/v3/feedback';
import { Popover, PopoverHeader } from '@content-ventures/design-system/v3/popover';
import { Select, type SelectOption } from '@content-ventures/design-system/v3/select';
import { CheckboxMark, RadioGroup } from '@content-ventures/design-system/v3/selection';
import { LinkButton, TextLink } from '@content-ventures/design-system/v3/link';
import { NumberField } from '@content-ventures/design-system/v3/number-field';
import { ToggleGroup } from '@content-ventures/design-system/v3/toggle';
import { SplitButton } from '@content-ventures/design-system/v3/button';
import { StepMarker, StepperCompact, type StepItem, type StepState } from '@content-ventures/design-system/v3/stepper';
import { Accordion, DescriptionList, Disclosure, ExpandableText, type AccordionItem } from '@content-ventures/design-system/v3/structure';
import { Toaster, toast } from '@content-ventures/design-system/v3/toast';
import toastStyles from '@content-ventures/design-system/v3/toast.module.css';
import { Shot, Shots, SpecRows, State, States } from '../stage';
import { createPortal } from 'react-dom';
import p from './padroes-b.module.css';

/* ——————————————————————————— Formatos e peças locais ——————————————————————————— */

const brl = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
const int = (value: number) => value.toLocaleString('pt-BR');
/** Intervalo que não quebra: “05/10 – 31/10”. */
const range = (from: string, to: string) => `${from}\u00a0–\u00a0${to}`;
const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

/** Os avisos precisam de um Toaster na página; o catálogo pode já ter o seu. */
function EnsureToaster() {
  const [needed, setNeeded] = useState(false);
  useEffect(() => {
    const cls = toastStyles.viewport;
    setNeeded(!cls || !document.querySelector(`.${CSS.escape(cls)}`));
  }, []);
  return needed ? <Toaster /> : null;
}

function withToaster(Component: ComponentType) {
  function Wrapped() {
    return (
      <>
        <Component />
        <EnsureToaster />
      </>
    );
  }
  Wrapped.displayName = Component.displayName ?? Component.name;
  return Wrapped;
}

/** Status = ponto + palavra. A cor do ponto atravessa em 180 ms e a palavra troca por crossfade. */
function StatusText({ tone, children, size = 'md' }: { tone: Tone; children: string; size?: 'sm' | 'md' }) {
  return (
    <span className={p.status} data-tone={tone} data-size={size}>
      <i className={p.statusDot} aria-hidden="true" />
      <span key={children} className={p.statusLabel}>
        {children}
      </span>
    </span>
  );
}

/** Selo de assinatura: o disco entra com mola e o check se desenha (só ao assinar). */
function Seal({ label, still = false, size = 'md' }: { label: string; still?: boolean; size?: 'md' | 'lg' }) {
  return (
    <span className={p.seal} role="img" aria-label={label} data-still={still || undefined} data-size={size}>
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="10" />
        <path d="M5.8 10.3 8.6 13.1 14.2 7.3" pathLength={1} />
      </svg>
    </span>
  );
}

/** Confirmação curta (Dialog sm, sem divisória). Destrutiva abre com o foco em Cancelar. */
function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  onConfirm,
  tone = 'primary',
  loading = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  tone?: 'primary' | 'danger';
  loading?: boolean;
  children?: ReactNode;
}) {
  const danger = tone === 'danger';
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      divided={false}
      title={title}
      description={description}
      footer={
        <>
          <Button onClick={onClose} data-autofocus={danger ? '' : undefined}>
            Cancelar
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            loading={loading}
            onClick={onConfirm}
            data-autofocus={danger ? undefined : ''}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children ?? null}
    </Dialog>
  );
}

/** Moldura de celular (390) para pranchas: a composição responde ao próprio contêiner. */
function PhoneFrame({ children, height }: { children: ReactNode; height?: number }) {
  return (
    <div className={p.phone} style={height ? { height } : undefined}>
      {children}
    </div>
  );
}

/**
 * Monta a camada (Dialog) no escopo do tema, fora do palco da prancha. O palco recorta
 * (`overflow: clip`) e o Select dentro de um diálogo descendente dele se acha escondido e fecha.
 */
function LayerPortal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [host, setHost] = useState<Element | null>(null);
  useEffect(() => {
    setHost(ref.current?.closest('[data-ds-v3]') ?? document.body);
  }, []);
  return (
    <>
      <span ref={ref} hidden />
      {host && createPortal(children, host)}
    </>
  );
}

/** Reinício discreto de uma prancha interativa (fica no canto do título). */
function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <Button size="sm" variant="ghost" icon={RotateCcw} onClick={onClick}>
      Reiniciar
    </Button>
  );
}

/* ———————————————————————————————————————————————————————————————————————————
 * Pedido de inserção
 * ——————————————————————————————————————————————————————————————————————————— */

type PiStatus = 'enviado' | 'ativo' | 'expirado' | 'cancelado';
type PiView = 'operador' | 'anunciante';

const PI_STATUS: Record<PiStatus, { label: string; tone: Tone }> = {
  enviado: { label: 'Enviado', tone: 'amber' },
  ativo: { label: 'Ativo', tone: 'green' },
  expirado: { label: 'Expirado', tone: 'red' },
  cancelado: { label: 'Cancelado', tone: 'red' },
};

const PI_SUBTOTAL = 18000;
const PI_DISCOUNT = PI_SUBTOTAL * 0.05;

type SignStep = { id: string; label: string; meta: string; state: StepState };

function signSteps(status: PiStatus, signedAt: string | null): SignStep[] {
  const head: SignStep[] = [
    { id: 'gerado', label: 'Gerado', meta: '29/09 · Marina Lopes', state: 'done' },
    { id: 'enviado', label: 'Enviado', meta: '29/09 · Aurora Calçados', state: 'done' },
  ];
  if (status === 'expirado')
    return [...head, { id: 'fim', label: 'Expirado', meta: '02/10 · sem assinatura', state: 'error' }];
  if (status === 'cancelado')
    return [...head, { id: 'fim', label: 'Cancelado', meta: '30/09 · Marina Lopes', state: 'error' }];
  return [
    ...head,
    {
      id: 'fim',
      label: 'Assinado',
      meta: signedAt ? `${signedAt} · Tiago Rezende` : '—',
      state: status === 'ativo' ? 'done' : 'upcoming',
    },
  ];
}

/** Régua horizontal da assinatura: marcador de 18 px do Stepper, rótulo e meta. */
function SignSteps({ steps }: { steps: SignStep[] }) {
  return (
    <ol className={p.signSteps} aria-label="Assinatura">
      {steps.map((step, index) => (
        <li key={step.id} className={p.signStep} data-state={step.state}>
          <StepMarker state={step.state} index={index} size="xs" />
          <span className={p.signText}>
            <span className={p.signLabel}>{step.label}</span>
            <span className={p.signMeta}>{step.meta}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function PiDeadline({ status, hours }: { status: PiStatus; hours: number }) {
  if (status === 'enviado')
    return (
      <span className={p.deadline} data-tone={hours < 24 ? 'orange' : 'amber'}>
        <Clock3 aria-hidden="true" />
        Assinatura em {hours} h
      </span>
    );
  if (status === 'expirado')
    return (
      <span className={p.deadline} data-tone="red">
        Expirou em 02/10
      </span>
    );
  return null;
}

function PiHead({
  code,
  status,
  hours = 72,
  sealed = false,
  sealStill = false,
  actions,
  bare = false,
}: {
  code: string;
  status: PiStatus;
  hours?: number;
  sealed?: boolean;
  sealStill?: boolean;
  actions?: ReactNode;
  /** Sem respiro do documento (faixas de estado). */
  bare?: boolean;
}) {
  const s = PI_STATUS[status];
  return (
    <header className={p.piHead} data-bare={bare || undefined}>
      <div className={p.piTitles}>
        <div className={p.piTitleRow}>
          <h3 className={p.piTitle}>P.I. {code}</h3>
          {sealed && <Seal label="Assinado" still={sealStill} />}
          <StatusText tone={s.tone}>{s.label}</StatusText>
        </div>
        <p className={p.piMeta}>
          <span>Coleção Primavera-Verão 2027</span>
          <span>Gerado em 29/09/2026</span>
          <PiDeadline status={status} hours={hours} />
        </p>
      </div>
      {actions && <div className={p.piActions}>{actions}</div>}
    </header>
  );
}

function PiBody({ status, signedAt }: { status: PiStatus; signedAt: string | null }) {
  return (
    <>
      <section className={p.piSection} aria-label="Partes">
        <DescriptionList
          layout="grid"
          columns={2}
          items={[
            {
              label: 'Portal',
              value: 'Francal 2026',
              leading: <BrandMark name="Francal 2026" size="xs" variant="soft" decorative />,
              hint: 'CNPJ 45.112.908/0001-37',
            },
            {
              label: 'Anunciante',
              value: 'Aurora Calçados',
              leading: <BrandMark name="Aurora Calçados" size="xs" variant="soft" decorative />,
              hint: 'CNPJ 12.345.678/0001-90',
            },
          ]}
        />
      </section>
      <section className={p.piSection} aria-label="Itens">
        <table className={p.plain}>
          <thead>
            <tr>
              <th scope="col">Ativo</th>
              <th scope="col">Período</th>
              <th scope="col">Modelo</th>
              <th scope="col" data-num="">
                Quantidade
              </th>
              <th scope="col" data-num="">
                Valor
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td data-label="Ativo">
                <strong>Banner Super Topo — Portal</strong>
              </td>
              <td data-label="Período" className={p.nowrap}>
                05/10 – 31/10
              </td>
              <td data-label="Modelo" className={p.nowrap}>
                CPM · R$ 45,00
              </td>
              <td data-label="Quantidade" data-num="">
                ≈ 400.000 imp.
              </td>
              <td data-label="Valor" data-num="">
                {brl(PI_SUBTOTAL)}
              </td>
            </tr>
          </tbody>
        </table>
        <dl className={p.totals}>
          <div>
            <dt>Subtotal</dt>
            <dd>{brl(PI_SUBTOTAL)}</dd>
          </div>
          <div>
            <dt>Desconto de fidelidade −5%</dt>
            <dd data-tone="green">− {brl(PI_DISCOUNT)}</dd>
          </div>
          <div>
            <dt>Bônus</dt>
            <dd data-tone="muted">+20% de impressões · Sem cobrança</dd>
          </div>
          <div data-total="">
            <dt>Total</dt>
            <dd>{brl(PI_SUBTOTAL - PI_DISCOUNT)}</dd>
          </div>
        </dl>
      </section>
      <footer className={p.piFoot}>
        <SignSteps steps={signSteps(status, signedAt)} />
      </footer>
    </>
  );
}

function PiDocument({
  view,
  status: initial,
  onStatus,
}: {
  view: PiView;
  status: PiStatus;
  onStatus?: (status: PiStatus) => void;
}) {
  const [status, setStatus] = useState<PiStatus>(initial);
  const [code, setCode] = useState('2026-0400');
  const [signedAt, setSignedAt] = useState<string | null>(initial === 'ativo' ? '30/09' : null);
  const [sealFresh, setSealFresh] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState<'sign' | 'resend' | 'download' | 'new' | null>(null);
  const [seenInitial, setSeenInitial] = useState(initial);
  if (seenInitial !== initial) {
    setSeenInitial(initial);
    setStatus(initial);
    setCode('2026-0400');
    setSignedAt(initial === 'ativo' ? '30/09' : null);
    setSealFresh(false);
  }

  const move = (next: PiStatus) => {
    setStatus(next);
    // A prancha acompanha a mudança no preset sem reiniciar o documento.
    setSeenInitial(next);
    onStatus?.(next);
  };

  async function download(kind: 'pdf' | 'email') {
    if (kind === 'email') {
      toast(`P.I. ${code} enviado por e-mail`, { description: 'financeiro@auroracalcados.com.br' });
      return;
    }
    setBusy('download');
    await wait(700);
    setBusy(null);
    toast(`P.I. ${code}.pdf baixado`);
  }

  const baixar = (
    <SplitButton
      label="Baixar P.I."
      icon={FileDown}
      loading={busy === 'download'}
      onClick={() => download('pdf')}
      menuLabel="Outras opções do P.I."
      menuWidth={220}
      menu={[
        {
          items: [
            { label: 'Baixar PDF', icon: FileDown, onSelect: () => download('pdf') },
            { label: 'Enviar por e-mail', icon: Mail, onSelect: () => download('email') },
          ],
        },
      ]}
    />
  );

  let actions: ReactNode = baixar;
  if (status === 'enviado' && view === 'operador')
    actions = (
      <>
        {baixar}
        <Button
          variant="ghost"
          icon={Send}
          loading={busy === 'resend'}
          onClick={async () => {
            setBusy('resend');
            await wait(800);
            setBusy(null);
            toast('P.I. reenviado para Aurora Calçados');
          }}
        >
          Reenviar
        </Button>
      </>
    );
  if (status === 'enviado' && view === 'anunciante')
    actions = (
      <>
        {baixar}
        <Button variant="primary" onClick={() => setConfirm(true)}>
          Assinar P.I.
        </Button>
      </>
    );
  if (status === 'expirado' && view === 'operador')
    actions = (
      <>
        {baixar}
        <Button
          variant="primary"
          loading={busy === 'new'}
          onClick={async () => {
            setBusy('new');
            await wait(900);
            setBusy(null);
            setCode('2026-0413');
            move('enviado');
            toast('P.I. 2026-0413 enviado para Aurora Calçados');
          }}
        >
          Gerar novo P.I.
        </Button>
      </>
    );

  return (
    <article className={p.piDoc} aria-label={`Pedido de inserção ${code}`}>
      <PiHead code={code} status={status} sealed={status === 'ativo'} sealStill={!sealFresh} actions={actions} />
      <PiBody status={status} signedAt={signedAt} />
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title={`Assinar P.I. ${code}?`}
        description={`${brl(PI_SUBTOTAL - PI_DISCOUNT)} · ${range('05/10', '31/10')}`}
        confirmLabel="Assinar P.I."
        loading={busy === 'sign'}
        onConfirm={async () => {
          setBusy('sign');
          await wait(700);
          setBusy(null);
          setConfirm(false);
          setSignedAt('01/10');
          setSealFresh(true);
          move('ativo');
          toast(`P.I. ${code} assinado`);
        }}
      />
    </article>
  );
}

function PedidoInsercao() {
  const [view, setView] = useState<PiView>('anunciante');
  const [status, setStatus] = useState<PiStatus>('enviado');
  const [run, setRun] = useState(0);
  return (
    <Shots>
      <Shot
        title="Em contexto"
        align="stretch"
        aside={<ResetButton onClick={() => { setStatus('enviado'); setRun((n) => n + 1); }} />}
      >
        <div className={p.piStage}>
          <div className={p.toolbar}>
            <Segmented
              size="sm"
              label="Visão"
              value={view}
              onChange={setView}
              options={[
                { value: 'operador', label: 'Operador' },
                { value: 'anunciante', label: 'Anunciante' },
              ]}
            />
            <Segmented
              size="sm"
              label="Status do P.I."
              value={status}
              onChange={setStatus}
              options={[
                { value: 'enviado', label: 'Enviado' },
                { value: 'ativo', label: 'Ativo' },
                { value: 'expirado', label: 'Expirado' },
                { value: 'cancelado', label: 'Cancelado' },
              ]}
            />
          </div>
          <PiDocument key={run} view={view} status={status} onStatus={setStatus} />
        </div>
      </Shot>
      <Shot title="Estados" tone="white" align="stretch">
        <SpecRows
          rows={[
            { label: 'Enviado', content: <PiHead bare code="2026-0400" status="enviado" /> },
            { label: 'Prazo < 24 h', content: <PiHead bare code="2026-0398" status="enviado" hours={18} /> },
            { label: 'Ativo', content: <PiHead bare code="2026-0391" status="ativo" sealed sealStill /> },
            { label: 'Expirado', content: <PiHead bare code="2026-0377" status="expirado" /> },
            { label: 'Cancelado', content: <PiHead bare code="2026-0369" status="cancelado" /> },
          ]}
        />
      </Shot>
      <Shot title="Celular" align="center">
        <PhoneFrame>
          <PiDocument view="anunciante" status="enviado" />
        </PhoneFrame>
      </Shot>
    </Shots>
  );
}

/* ———————————————————————————————————————————————————————————————————————————
 * Revisão e aprovação
 * ——————————————————————————————————————————————————————————————————————————— */

type ReviewStatus = 'aguardando' | 'aprovada' | 'ajustes' | 'rejeitada';

const REVIEW_STATUS: Record<ReviewStatus, { label: string; tone: Tone }> = {
  aguardando: { label: 'Aguardando aprovação', tone: 'violet' },
  aprovada: { label: 'Aprovada', tone: 'teal' },
  ajustes: { label: 'Ajustes solicitados', tone: 'orange' },
  rejeitada: { label: 'Rejeitada', tone: 'red' },
};

const REVIEW_HISTORY: TimelineEntry[] = [
  { id: 'enviada', title: 'Enviada para aprovação', description: 'Aurora Calçados', date: '30/09', state: 'current' },
  { id: 'criada', title: 'Campanha criada', description: 'Tiago Rezende', date: '28/09' },
];

function ReviewHead({ status, bare = false }: { status: ReviewStatus; bare?: boolean }) {
  const s = REVIEW_STATUS[status];
  return (
    <div className={p.reviewHead} data-bare={bare || undefined}>
      <div className={p.piTitleRow}>
        <h3 className={p.reviewTitle}>Coleção Primavera-Verão 2027</h3>
        <StatusText tone={s.tone}>{s.label}</StatusText>
      </div>
      <p className={p.piMeta}>
        <span>#2041</span>
        <span>Aurora Calçados</span>
        <span>Banner Super Topo — Portal</span>
        <span className={p.nowrap}>{range('05/10', '31/10')}</span>
        <span className={p.num}>{brl(18000)}</span>
      </p>
    </div>
  );
}

function ReasonAlert({ status, text, appear = false }: { status: ReviewStatus; text: string; appear?: boolean }) {
  if (status !== 'ajustes' && status !== 'rejeitada') return null;
  return (
    <Alert
      tone={status === 'ajustes' ? 'attention' : 'danger'}
      title="Motivo"
      meta="Em 01/10/2026 às 10:42 · Marina Lopes"
      appear={appear}
    >
      {text}
    </Alert>
  );
}

const CHECKS: AccordionItem[] = [
  {
    id: 'identificacao',
    title: 'Identificação',
    status: 'done',
    meta: 'Aurora Calçados',
    content: (
      <DescriptionList
        labelWidth={148}
        items={[
          { label: 'Campanha', value: 'Coleção Primavera-Verão 2027' },
          { label: 'Anunciante', value: 'Aurora Calçados' },
        ]}
      />
    ),
  },
  {
    id: 'ativo',
    title: 'Ativo',
    status: 'done',
    meta: 'Banner Super Topo — Portal',
    content: (
      <DescriptionList
        labelWidth={148}
        items={[
          { label: 'Categoria', value: 'Mídia Online' },
          { label: 'Janela do ativo', value: '01/10/2026 – 30/11/2026' },
        ]}
      />
    ),
  },
  {
    id: 'precificacao',
    title: 'Precificação',
    status: 'done',
    meta: brl(18000),
    content: (
      <DescriptionList
        labelWidth={148}
        items={[
          { label: 'Modelo', value: 'CPM · R$ 45,00 por mil' },
          { label: 'Entrega estimada', value: '≈ 400.000 impressões' },
        ]}
      />
    ),
  },
  {
    id: 'canal',
    title: 'Canal + Público',
    status: 'done',
    meta: '2 canais · 2 públicos',
    content: (
      <DescriptionList
        labelWidth={148}
        items={[
          { label: 'Canais', value: 'Portal da feira (50%), App Francal (50%)' },
          { label: 'Públicos', value: 'Visitantes credenciados, Lojistas e compradores' },
        ]}
      />
    ),
  },
  {
    id: 'briefing',
    title: 'Briefing',
    status: 'warning',
    meta: <span className={p.metaWarn}>2 campos obrigatórios faltando</span>,
    content: (
      <DescriptionList
        labelWidth={148}
        items={[
          { label: 'Peça criativa', value: 'peca-970x250.png' },
          { label: 'Idioma da peça', state: 'empty' },
          { label: 'Entrega do criativo', state: 'empty' },
        ]}
      />
    ),
  },
];

function ReasonDialog({
  kind,
  onClose,
  onConfirm,
}: {
  kind: 'ajustes' | 'rejeitada' | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [seen, setSeen] = useState(kind);
  if (seen !== kind) {
    setSeen(kind);
    setText(kind === 'ajustes' ? 'Incluir o idioma da peça e a data de entrega do criativo.' : '');
    setError(undefined);
  }
  const reject = kind === 'rejeitada';
  return (
    <Dialog
      open={kind !== null}
      onClose={onClose}
      title={reject ? 'Rejeitar campanha' : 'Pedir ajustes'}
      description="Coleção Primavera-Verão 2027 · Aurora Calçados"
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            variant={reject ? 'danger' : 'primary'}
            loading={busy}
            onClick={async () => {
              if (!text.trim()) {
                setError('Escreva o motivo');
                return;
              }
              setBusy(true);
              await wait(700);
              setBusy(false);
              onConfirm(text.trim());
            }}
          >
            {reject ? 'Rejeitar campanha' : 'Pedir ajustes'}
          </Button>
        </>
      }
    >
      <Field label="Motivo" required error={error} hint="Vai para o anunciante com a decisão">
        {({ id, describedBy, invalid }) => (
          <Textarea
            id={id}
            aria-describedby={describedBy}
            invalid={invalid}
            rows={4}
            placeholder={reject ? 'Por que a campanha não pode seguir' : 'O que precisa mudar'}
            value={text}
            data-autofocus=""
            onChange={(event) => {
              setText(event.target.value);
              if (error) setError(undefined);
            }}
          />
        )}
      </Field>
    </Dialog>
  );
}

function ReviewPanel() {
  const [status, setStatus] = useState<ReviewStatus>('aguardando');
  const [history, setHistory] = useState<TimelineEntry[]>(REVIEW_HISTORY);
  const [reason, setReason] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [approving, setApproving] = useState(false);
  const [asking, setAsking] = useState<'ajustes' | 'rejeitada' | null>(null);
  const [open, setOpen] = useState<string[]>(['briefing']);

  function decide(next: ReviewStatus, entry: Omit<TimelineEntry, 'state' | 'date'>) {
    setStatus(next);
    setHistory((list) => [
      { ...entry, date: '01/10', state: 'current' },
      ...list.map((item) => ({ ...item, state: 'done' as const })),
    ]);
  }

  return (
    <section className={p.review} aria-label="Revisão comercial">
      <header className={p.reviewTop}>
        <ReviewHead status={status} />
        <ReasonAlert key={status} status={status} text={reason} appear />
      </header>
      <div className={p.reviewGrid}>
        <div className={p.reviewMain}>
          <div className={p.blockHead}>
            <h4>Checagem</h4>
            <span>4 de 5</span>
          </div>
          <Accordion items={CHECKS} type="multiple" value={open} onValueChange={setOpen} headingLevel="h4" />
        </div>
        <aside className={p.reviewAside} aria-label="Histórico">
          <div className={p.blockHead}>
            <h4>Histórico</h4>
          </div>
          <Timeline variant="dots" label="Histórico da campanha" items={history} />
        </aside>
      </div>
      {status === 'aguardando' ? (
        <footer className={p.decision}>
          <Button onClick={() => setAsking('rejeitada')}>Rejeitar</Button>
          <Button onClick={() => setAsking('ajustes')}>Pedir ajustes</Button>
          <Button variant="primary" onClick={() => setConfirm(true)}>
            Aprovar e gerar P.I.
          </Button>
        </footer>
      ) : (
        <footer className={p.decision} data-done="">
          <span className={p.decided}>
            Decidido por Marina Lopes · 01/10 às 10:42
          </span>
          <Button
            size="sm"
            variant="ghost"
            icon={RotateCcw}
            onClick={() => {
              setStatus('aguardando');
              setHistory(REVIEW_HISTORY);
              setReason('');
            }}
          >
            Reiniciar
          </Button>
        </footer>
      )}
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Aprovar e gerar P.I.?"
        description="Reserva o estoque do período."
        confirmLabel="Aprovar e gerar P.I."
        loading={approving}
        onConfirm={async () => {
          setApproving(true);
          await wait(800);
          setApproving(false);
          setConfirm(false);
          decide('aprovada', { id: 'aprovada', title: 'Campanha aprovada', description: 'P.I. 2026-0412 gerado · Marina Lopes' });
          toast('Campanha aprovada', { description: 'P.I. 2026-0412 enviado para assinatura' });
        }}
      />
      <ReasonDialog
        kind={asking}
        onClose={() => setAsking(null)}
        onConfirm={(text) => {
          const kind = asking;
          setAsking(null);
          setReason(text);
          if (kind === 'ajustes') {
            decide('ajustes', { id: 'ajustes', title: 'Ajustes solicitados', description: 'Marina Lopes' });
            toast('Ajustes pedidos para Aurora Calçados');
          } else {
            decide('rejeitada', { id: 'rejeitada', title: 'Campanha rejeitada', description: 'Marina Lopes' });
            toast('Campanha rejeitada');
          }
        }}
      />
    </section>
  );
}

const SEND_CHECKS = [
  { id: 'identificacao', label: 'Identificação' },
  { id: 'ativo', label: 'Ativo' },
  { id: 'precificacao', label: 'Precificação' },
  { id: 'canal', label: 'Canal + Público' },
];

function SendPanel() {
  const [mode, setMode] = useState('enviar');
  const [filled, setFilled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const blocked = mode === 'enviar' && !filled;
  const primary = mode === 'enviar' ? 'Enviar para aprovação' : 'Salvar rascunho';
  const button = (
    <Button
      variant="primary"
      className={p.sendButton}
      loading={busy}
      aria-disabled={blocked || undefined}
      onClick={async () => {
        if (blocked) return;
        setBusy(true);
        await wait(900);
        setBusy(false);
        if (mode === 'enviar') setDone(true);
        else toast('Rascunho salvo');
      }}
    >
      {primary}
    </Button>
  );
  return (
    <section className={p.send} aria-label="Envio">
      <div className={p.sendBody}>
        <div className={p.sendGroup} role="radiogroup" aria-label="Como salvar a campanha">
          <span className={p.overline}>Envio</span>
          <ChoiceCard
            name="envio"
            value="rascunho"
            checked={mode === 'rascunho'}
            onChange={setMode}
            title="Salvar como rascunho"
            description="Fica com você para continuar depois."
          />
          <ChoiceCard
            name="envio"
            value="enviar"
            checked={mode === 'enviar'}
            onChange={setMode}
            title="Enviar para aprovação"
            description="O comercial do portal revisa e responde por aqui."
            footer={
              filled ? undefined : (
                <span className={p.blockedFoot}>
                  <span>Faltam 2 campos do briefing</span>
                  <LinkButton
                    onClick={() => {
                      setFilled(true);
                      toast('Briefing preenchido');
                    }}
                  >
                    Preencher
                  </LinkButton>
                </span>
              )
            }
          />
        </div>
        <div className={p.sendGroup}>
          <div className={p.blockHead}>
            <h4>Checagem</h4>
            <span>{filled ? '5 de 5' : '4 de 5'}</span>
          </div>
          <ul className={p.checkList}>
            {SEND_CHECKS.map((item) => (
              <li key={item.id}>
                <StepMarker state="done" index={0} size="xs" />
                <span>{item.label}</span>
              </li>
            ))}
            <li data-warn={filled ? undefined : ''}>
              <StepMarker state={filled ? 'done' : 'warn'} index={4} size="xs" />
              <span>
                Briefing
                {!filled && <small>2 campos obrigatórios faltando</small>}
              </span>
            </li>
          </ul>
        </div>
      </div>
      <footer className={p.sendFoot}>
        {blocked ? <Tooltip content="Preencha o briefing para enviar">{button}</Tooltip> : button}
      </footer>
      <Dialog
        open={done}
        onClose={() => setDone(false)}
        size="sm"
        divided={false}
        leading={<Seal label="Enviada" size="lg" />}
        title="Enviada para aprovação"
        description="Coleção Primavera-Verão 2027 · #2041"
        footer={
          <>
            <Button onClick={() => setDone(false)}>Fechar</Button>
            <Button variant="primary" data-autofocus="" onClick={() => setDone(false)}>
              Ver campanha
            </Button>
          </>
        }
      >
        <Timeline
          variant="steps"
          label="Próximos passos"
          items={[
            { id: 'aprovacao', title: 'Aprovação', description: 'Comercial da Francal 2026', state: 'current' },
            { id: 'pi', title: 'P.I.', description: 'Assinatura em 72 h', state: 'upcoming' },
            { id: 'veiculacao', title: 'Veiculação', description: range('05/10', '31/10'), state: 'upcoming' },
          ]}
        />
      </Dialog>
    </section>
  );
}

function Aprovacao() {
  return (
    <Shots>
      <Shot title="Em contexto" align="stretch">
        <ReviewPanel />
      </Shot>
      <Shot title="Envio" align="center">
        <SendPanel />
      </Shot>
      <Shot title="Estados" tone="white" align="stretch">
        <SpecRows
          rows={[
            { label: 'Enviada', content: <ReviewHead bare status="aguardando" /> },
            {
              label: 'Ajustes solicitados',
              content: (
                <div className={p.stateStack}>
                  <ReviewHead bare status="ajustes" />
                  <ReasonAlert status="ajustes" text="Incluir o idioma da peça e a data de entrega do criativo." />
                </div>
              ),
            },
            { label: 'Aprovada', content: <ReviewHead bare status="aprovada" /> },
            {
              label: 'Rejeitada',
              content: (
                <div className={p.stateStack}>
                  <ReviewHead bare status="rejeitada" />
                  <ReasonAlert status="rejeitada" text="Tema já contratado por outro expositor no mesmo período." />
                </div>
              ),
            },
          ]}
        />
      </Shot>
    </Shots>
  );
}

/* ———————————————————————————————————————————————————————————————————————————
 * Preço, desconto e bônus
 * ——————————————————————————————————————————————————————————————————————————— */

type BonusState = 'liberado' | 'bloqueado' | 'incluido';
const BONUS_LABEL: Record<BonusState, string> = {
  liberado: 'Liberado',
  bloqueado: 'Bloqueado',
  incluido: 'Incluído',
};

/** Guarda o estado anterior para animar só a mudança (nunca a primeira pintura). */
function useChanged<T>(value: T) {
  const [seen, setSeen] = useState(value);
  const [changed, setChanged] = useState(false);
  if (seen !== value) {
    setSeen(value);
    setChanged(true);
  }
  return changed;
}

function BonusCard({
  title,
  description,
  state,
  threshold,
  budget,
  condition,
}: {
  title: string;
  description: string;
  state: BonusState;
  /** Verba mínima: mostra a barra e o “faltam” enquanto bloqueado. */
  threshold?: number;
  budget?: number;
  /** Rodapé quando a regra não é de verba. */
  condition?: string;
}) {
  const changed = useChanged(state);
  const blocked = state === 'bloqueado';
  const missing = threshold !== undefined && budget !== undefined ? Math.max(0, threshold - budget) : 0;
  const foot = threshold !== undefined ? `Verba ≥ ${brl(threshold)}` : (condition ?? '');
  return (
    <div className={p.bonusCard} data-state={state}>
      <span className={p.bonusState} data-state={state} data-changed={changed || undefined}>
        <i aria-hidden="true" />
        <span key={state} className={p.statusLabel}>
          {BONUS_LABEL[state]}
        </span>
      </span>
      <strong className={p.bonusTitle}>{title}</strong>
      <span className={p.bonusDesc}>{description}</span>
      <span className={p.bonusFoot}>
        {threshold !== undefined && budget !== undefined && (
          <span className={p.collapse} data-open={blocked || undefined} aria-hidden="true">
            <span className={p.collapseInner}>
              <span className={p.bonusBar}>
                <i style={{ width: `${Math.min(100, (budget / threshold) * 100)}%` }} />
              </span>
            </span>
          </span>
        )}
        <small key={blocked && missing > 0 ? 'faltam' : 'ok'} className={p.bonusCondition}>
          <span className={p.nowrap}>{foot}</span>
          {blocked && missing > 0 && (
            <>
              {' · '}
              <span className={p.nowrap}>faltam {brl(missing)}</span>
            </>
          )}
        </small>
      </span>
    </div>
  );
}

/** Preço com desconto: base riscada, preço final e o percentual sobre a base. */
function PriceWas({ was, now, unit }: { was: number; now: number; unit?: string }) {
  const pct = Math.round((1 - now / was) * 100);
  return (
    <span className={p.priceWas}>
      <s>
        <VisuallyHidden>De </VisuallyHidden>
        {brl(was)}
      </s>
      <span className={p.priceNow}>
        <VisuallyHidden>por </VisuallyHidden>
        {brl(now)}
        {unit && <small>{unit}</small>}
      </span>
      <span className={p.pricePct}>−{pct}%</span>
    </span>
  );
}

function ModelLine() {
  return (
    <p className={p.modelLine}>
      <span className={p.modelName}>CPM</span>
      <span>
        <b>R$ 45,00</b> por mil impressões
      </span>
      <Tooltip content="Preço definido pelo portal">
        <button type="button" className={p.lockButton} aria-label="Preço travado">
          <Lock aria-hidden="true" />
        </button>
      </Tooltip>
    </p>
  );
}

const BONUS_RULES = [
  { id: 'impressoes', title: '+20% de impressões', description: 'Impressões extras sem custo durante a feira.', threshold: 15000 },
  { id: 'newsletter', title: 'Destaque na newsletter', description: 'Logo na newsletter diária dos credenciados.', threshold: 27000 },
];

function PricingPanel() {
  const [budget, setBudget] = useState(18000);
  const free = budget >= 15000;
  const discount = budget * 0.05;
  const effective = (45 * 0.95) / (free ? 1.2 : 1);
  const released = 1 + BONUS_RULES.filter((rule) => budget >= rule.threshold).length;
  return (
    <section className={p.pricing} aria-label="Precificação">
      <div className={p.pricingTop}>
        <div className={p.pricingBudget}>
          <div className={p.figureBlock}>
            <span className={p.figureLabel}>Verba planejada</span>
            <span key={budget} className={p.figure}>
              {brl(budget)}
            </span>
          </div>
          <Slider
            label="Verba planejada"
            value={budget}
            min={2025}
            max={45000}
            step={45}
            onChange={setBudget}
            format={brl}
            marks={BONUS_RULES.map((rule) => ({ value: rule.threshold, label: rule.title }))}
            ticks={[
              { value: 2025, label: 'Mínimo' },
              { value: 27000, label: 'Newsletter' },
              { value: 45000, label: 'Máximo' },
            ]}
          />
          <ModelLine />
        </div>
        <dl className={p.composition} aria-label="Composição do preço">
          <div>
            <dt>Verba</dt>
            <dd>{brl(budget)}</dd>
          </div>
          <div>
            <dt>Desconto de fidelidade −5%</dt>
            <dd data-tone="green">− {brl(discount)}</dd>
          </div>
          <div>
            <dt>Custo efetivo</dt>
            <dd>
              <span key={effective}>{brl(effective)}</span> <small>por mil</small>
            </dd>
          </div>
          <div data-total="">
            <dt>Total</dt>
            <dd>{brl(budget - discount)}</dd>
          </div>
        </dl>
      </div>
      <div className={p.pricingBonus}>
        <div className={p.blockHead}>
          <h4>Bônus</h4>
          <span key={released} className={p.statusLabel}>
            {released} de 3 liberados
          </span>
        </div>
        <div className={p.bonusGrid}>
          {BONUS_RULES.map((rule) => (
            <BonusCard
              key={rule.id}
              title={rule.title}
              description={rule.description}
              state={budget >= rule.threshold ? 'liberado' : 'bloqueado'}
              threshold={rule.threshold}
              budget={budget}
            />
          ))}
          <BonusCard
            title="Desconto de fidelidade"
            description="5% de desconto a partir da terceira campanha."
            state="liberado"
            condition="A partir da 3ª campanha"
          />
        </div>
      </div>
    </section>
  );
}

function PrecoBonus() {
  return (
    <Shots>
      <Shot title="Em contexto" align="stretch">
        <PricingPanel />
      </Shot>
      <Shot title="Estados" tone="white" align="stretch">
        <States min={232}>
          <State label="Liberado">
            <BonusCard
              title="+20% de impressões"
              description="Impressões extras sem custo durante a feira."
              state="liberado"
              threshold={15000}
              budget={18000}
            />
          </State>
          <State label="Bloqueado">
            <BonusCard
              title="Destaque na newsletter"
              description="Logo na newsletter diária dos credenciados."
              state="bloqueado"
              threshold={27000}
              budget={18000}
            />
          </State>
          <State label="Com desconto">
            <div className={p.priceCard}>
              <span className={p.figureLabel}>Pacote Vitrine · Francal 2026</span>
              <PriceWas was={24000} now={21600} />
              <span className={p.priceCaption}>Até 10/10 para expositores</span>
            </div>
          </State>
          <State label="Sem cobrança">
            <div className={p.priceCard}>
              <span className={p.figureLabel}>Cobrança</span>
              <span className={p.figureMd}>Sem cobrança</span>
              <span className={p.priceCaption}>Bônus · E-mail marketing dedicado</span>
            </div>
          </State>
        </States>
      </Shot>
    </Shots>
  );
}

/* ———————————————————————————————————————————————————————————————————————————
 * Importação e exportação
 * ——————————————————————————————————————————————————————————————————————————— */

const IMPORT_STEPS: StepItem[] = [
  { id: 'arquivo', label: 'Arquivo' },
  { id: 'mapeamento', label: 'Mapeamento' },
  { id: 'previa', label: 'Prévia' },
  { id: 'importar', label: 'Importar' },
];
const IMPORT_TOTAL = 1240;
const IMPORT_ERRORS = 12;

const LEAD_FIELDS: SelectOption[] = [
  { value: 'nome', label: 'Nome' },
  { value: 'email', label: 'E-mail' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'cargo', label: 'Cargo' },
  { value: 'pavilhao', label: 'Pavilhão de interesse' },
  { value: 'ignorar', label: 'Não importar' },
];

type MapRow = { column: string; sample: string; field: string; auto: boolean };
const MAP_ROWS: MapRow[] = [
  { column: 'nome', sample: 'Juliana Prates', field: 'nome', auto: true },
  { column: 'email', sample: 'juliana@bellapasso.com.br', field: 'email', auto: true },
  { column: 'empresa', sample: 'Bella Passo', field: 'empresa', auto: true },
  { column: 'telefone', sample: '(11) 98765-4321', field: 'telefone', auto: true },
  { column: 'cargo_contato', sample: 'Compradora', field: '', auto: false },
  { column: 'pavilhao', sample: 'Pavilhão Azul', field: '', auto: false },
];

const PREVIEW_ROWS = [
  ['Juliana Prates', 'juliana@bellapasso.com.br', 'Bella Passo', 'Pavilhão Azul'],
  ['Tiago Rezende', 'tiago@patiocouro.com.br', 'Pátio Couro', 'Pavilhão Verde'],
  ['Clara Souto', 'clara@casaforma.com.br', 'Casa Forma', 'Pavilhão Azul'],
  ['Rafael Dias', 'rafael@couronobre.com.br', 'Couro Nobre', 'Área internacional'],
  ['Marina Lopes', 'marina@lumeacessorios.com.br', 'Lume Acessórios', 'Pavilhão Laranja'],
];
const ERROR_ROWS = [
  ['Linha 214', 'E-mail inválido'],
  ['Linha 389', 'Telefone incompleto'],
  ['Linha 702', 'E-mail repetido'],
];

function MappingStatus({ row, attempted }: { row: MapRow; attempted: boolean }) {
  if (row.field && row.auto)
    return (
      <span className={p.mapState} data-tone="green">
        <Check aria-hidden="true" />
        Automático
      </span>
    );
  if (row.field) return <span className={p.mapState} />;
  return (
    <span className={p.mapState} data-tone={attempted ? 'red' : 'amber'}>
      <CircleAlert aria-hidden="true" />
      Pendente
    </span>
  );
}

/** Seletor do campo + situação, sem a tabela (faixas de estado). */
function MappingLine({ row, attempted }: { row: MapRow; attempted: boolean }) {
  return (
    <div className={p.mapLine}>
      <code className={p.column}>{row.column}</code>
      <div className={p.mapCell}>
        <div className={p.mapSelect}>
          <Select
            size="sm"
            label={`Campo para ${row.column}`}
            value={row.field}
            placeholder="Escolha um campo"
            invalid={attempted && !row.field}
            options={LEAD_FIELDS}
            onChange={() => undefined}
          />
        </div>
        <MappingStatus row={row} attempted={attempted} />
      </div>
    </div>
  );
}

function MappingRow({
  row,
  attempted,
  onChange,
}: {
  row: MapRow;
  attempted: boolean;
  onChange?: (field: string) => void;
}) {
  return (
    <tr>
      <td>
        <code className={p.column}>{row.column}</code>
      </td>
      <td className={p.sample}>{row.sample}</td>
      <td>
        <div className={p.mapCell}>
          <div className={p.mapSelect}>
            <Select
              size="sm"
              label={`Campo para ${row.column}`}
              value={row.field}
              placeholder="Escolha um campo"
              invalid={attempted && !row.field}
              options={LEAD_FIELDS}
              onChange={(value) => onChange?.(value)}
            />
          </div>
          <MappingStatus row={row} attempted={attempted} />
        </div>
      </td>
    </tr>
  );
}

function MappingTable({ rows, attempted, onChange }: { rows: MapRow[]; attempted: boolean; onChange?: (index: number, field: string) => void }) {
  return (
    <table className={`${p.plain} ${p.mapTable}`}>
      <thead>
        <tr>
          <th scope="col">Coluna do arquivo</th>
          <th scope="col">Exemplo</th>
          <th scope="col">Campo do MediaOn</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <MappingRow key={row.column} row={row} attempted={attempted} onChange={(field) => onChange?.(index, field)} />
        ))}
      </tbody>
    </table>
  );
}

function Dropzone({ onFile }: { onFile: (name: string, size: number) => void }) {
  const [over, setOver] = useState(false);
  return (
    <div
      className={p.dropzone}
      data-over={over || undefined}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        const file = event.dataTransfer.files[0];
        if (file) onFile(file.name, file.size);
      }}
    >
      <CloudUpload className={p.dropIcon} aria-hidden="true" />
      <span className={p.dropText}>
        <strong>{over ? 'Solte para enviar' : 'Arraste o CSV aqui ou escolha um arquivo'}</strong>
        <span>CSV · até 10 MB · até 5.000 linhas</span>
      </span>
      <Button size="sm" onClick={() => onFile('leads-francal.csv', 186 * 1024)}>
        Escolher arquivo
      </Button>
    </div>
  );
}

function FileRow({ name, size, onRemove }: { name: string; size: number; onRemove?: () => void }) {
  return (
    <div className={p.fileRow}>
      <FileSpreadsheet className={p.fileIcon} aria-hidden="true" />
      <span className={p.fileText}>
        <strong>{name}</strong>
        <span>
          {int(IMPORT_TOTAL)} linhas · {Math.round(size / 1024)} KB
        </span>
      </span>
      {onRemove && <IconButton label="Remover arquivo" icon={X} variant="ghost" size="sm" onClick={onRemove} />}
    </div>
  );
}

function ImportDone({ onReport }: { onReport?: () => void }) {
  return (
    <div className={p.importDone} role="status">
      <CircleCheck aria-hidden="true" />
      <span>
        <strong>{int(IMPORT_TOTAL - IMPORT_ERRORS)} leads importados</strong>
        <span> · {IMPORT_ERRORS} ignorados</span>
      </span>
      <LinkButton onClick={onReport}>Baixar relatório</LinkButton>
    </div>
  );
}

function ImportDialog({ open, onClose, onImported }: { open: boolean; onClose: () => void; onImported: (count: number) => void }) {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [rows, setRows] = useState(MAP_ROWS);
  const [attempted, setAttempted] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [done, setDone] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  const missing = rows.filter((row) => !row.field).length;
  const importing = step === 3 && done < IMPORT_TOTAL;

  useEffect(() => () => window.clearInterval(timer.current), []);
  const reset = () => {
    window.clearInterval(timer.current);
    setStep(0);
    setFile(null);
    setRows(MAP_ROWS);
    setAttempted(false);
    setShowErrors(false);
    setDone(0);
  };
  const close = () => {
    onClose();
    window.setTimeout(reset, 200);
  };

  function start() {
    setStep(3);
    setDone(0);
    window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      setDone((value) => {
        const next = Math.min(IMPORT_TOTAL, value + 124);
        if (next >= IMPORT_TOTAL) window.clearInterval(timer.current);
        return next;
      });
    }, 220);
  }

  function next() {
    if (step === 0 && file) setStep(1);
    else if (step === 1) {
      if (missing) {
        setAttempted(true);
        return;
      }
      setStep(2);
    } else if (step === 2) start();
    else if (step === 3 && !importing) {
      onImported(IMPORT_TOTAL - IMPORT_ERRORS);
      toast(`${int(IMPORT_TOTAL - IMPORT_ERRORS)} leads importados`, { description: `${IMPORT_ERRORS} linhas ignoradas` });
      close();
    }
  }

  const primary =
    step === 2 ? `Importar ${int(IMPORT_TOTAL - IMPORT_ERRORS)} leads` : step === 3 ? 'Concluir' : 'Continuar';
  const footStart =
    step === 1
      ? `${rows.length - missing} de ${rows.length} colunas com campo`
      : step === 2
        ? `${int(IMPORT_TOTAL - IMPORT_ERRORS)} prontas · ${IMPORT_ERRORS} com erro`
        : undefined;

  return (
    <Dialog
      open={open}
      onClose={close}
      size="lg"
      title="Importar leads"
      description="Francal 2026"
      footerStart={footStart ? <span className={p.num}>{footStart}</span> : undefined}
      footer={
        <>
          <Button icon={ArrowLeft} disabled={step === 0 || step === 3} onClick={() => setStep((value) => value - 1)}>
            Voltar
          </Button>
          <Button
            variant="primary"
            className={p.importPrimary}
            disabled={(step === 0 && !file) || importing}
            trailingIcon={step < 2 ? ArrowRight : undefined}
            onClick={next}
          >
            {primary}
          </Button>
        </>
      }
    >
      <div className={p.importBody}>
        <StepperCompact steps={IMPORT_STEPS} current={step} label="Importação" showNext={false} />
        <div key={step} className={p.stepPane}>
          {step === 0 &&
            (file ? (
              <FileRow name={file.name} size={file.size} onRemove={() => setFile(null)} />
            ) : (
              <Dropzone onFile={(name, size) => setFile({ name, size })} />
            ))}
          {step === 0 && (
            <div className={p.templateLink}>
              <LinkButton tone="quiet" onClick={() => toast('modelo-leads.csv baixado')}>
                Baixar modelo CSV
              </LinkButton>
            </div>
          )}
          {step === 1 && (
            <MappingTable
              rows={rows}
              attempted={attempted}
              onChange={(index, field) =>
                setRows((list) => list.map((row, at) => (at === index ? { ...row, field, auto: false } : row)))
              }
            />
          )}
          {step === 2 && (
            <div className={p.previewPane}>
              <Alert
                tone="warning"
                title={`${IMPORT_ERRORS} linhas com erro`}
                action={
                  <LinkButton aria-expanded={showErrors} onClick={() => setShowErrors((value) => !value)}>
                    {showErrors ? 'Ocultar' : 'Ver linhas'}
                  </LinkButton>
                }
              >
                {showErrors && (
                  <ul className={p.errorRows}>
                    {ERROR_ROWS.map(([line, reason]) => (
                      <li key={line}>
                        <span>{line}</span>
                        {reason}
                      </li>
                    ))}
                    <li>
                      <span>+ {IMPORT_ERRORS - ERROR_ROWS.length} linhas</span>
                    </li>
                  </ul>
                )}
              </Alert>
              <div className={p.tableScroll}>
                <table className={p.plain}>
                  <thead>
                    <tr>
                      <th scope="col">Nome</th>
                      <th scope="col">E-mail</th>
                      <th scope="col">Empresa</th>
                      <th scope="col">Pavilhão de interesse</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PREVIEW_ROWS.map((row) => (
                      <tr key={row[1]}>
                        {row.map((cell, index) => (
                          <td key={cell} className={index === 1 ? p.cellMuted : undefined}>
                            {index === 0 ? <strong>{cell}</strong> : cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className={p.importPane}>
              <Progress
                value={done}
                max={IMPORT_TOTAL}
                label={done >= IMPORT_TOTAL ? 'Importação concluída' : 'Importando'}
                valueText={`${int(done)} de ${int(IMPORT_TOTAL)}`}
              />
              <dl className={p.importFigures}>
                {[
                  { label: 'Novos', value: Math.round((done / IMPORT_TOTAL) * 1104) },
                  { label: 'Atualizados', value: Math.round((done / IMPORT_TOTAL) * 124) },
                  { label: 'Ignorados', value: Math.round((done / IMPORT_TOTAL) * IMPORT_ERRORS) },
                ].map((item) => (
                  <div key={item.label}>
                    <dt>{item.label}</dt>
                    <dd>{int(item.value)}</dd>
                  </div>
                ))}
              </dl>
              <div className={p.collapse} data-open={done >= IMPORT_TOTAL || undefined}>
                <div className={p.collapseInner}>
                  <ImportDone onReport={() => toast('relatorio-importacao.csv baixado')} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}

const LEADS = [
  { name: 'Juliana Prates', company: 'Bella Passo', origin: 'Estande B-214', date: 'há 2 h' },
  { name: 'Tiago Rezende', company: 'Pátio Couro', origin: 'Vitrine', date: 'há 5 h' },
  { name: 'Clara Souto', company: 'Casa Forma', origin: 'Formulário', date: 'ontem' },
];

function ImportContext() {
  const [open, setOpen] = useState(false);
  const [total, setTotal] = useState(214);
  return (
    <section className={p.listPanel} aria-label="Leads">
      <header className={p.listHead}>
        <div className={p.listTitle}>
          <h4>Leads</h4>
          <span key={total} className={`${p.statusLabel} ${p.num}`}>
            {int(total)}
          </span>
        </div>
        <Button icon={Upload} onClick={() => setOpen(true)}>
          Importar leads
        </Button>
      </header>
      <ul className={p.leadRows}>
        {LEADS.map((lead) => (
          <li key={lead.name}>
            <Avatar name={lead.name} size="sm" decorative />
            <span className={p.leadName}>{lead.name}</span>
            <span className={p.leadMeta}>{lead.company}</span>
            <span className={p.leadMeta}>{lead.origin}</span>
            <span className={p.leadDate}>{lead.date}</span>
          </li>
        ))}
      </ul>
      <LayerPortal>
        <ImportDialog open={open} onClose={() => setOpen(false)} onImported={(count) => setTotal((value) => value + count)} />
      </LayerPortal>
    </section>
  );
}

const EXPORT_COLUMNS = ['Campanha', 'Anunciante', 'Status', 'Período', 'Verba', 'Entrega'];

function ExportPanel({ close }: { close: () => void }) {
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');
  const [scope, setScope] = useState<'visiveis' | 'selecionadas'>('visiveis');
  const [columns, setColumns] = useState<string[]>(EXPORT_COLUMNS.slice(0, 5));
  const [busy, setBusy] = useState(false);
  const count = scope === 'visiveis' ? 17 : 3;
  const all = columns.length === EXPORT_COLUMNS.length;
  return (
    <div className={p.exportPanel}>
      <PopoverHeader title="Exportar campanhas" />
      <Segmented
        size="sm"
        full
        label="Formato"
        value={format}
        onChange={setFormat}
        options={[
          { value: 'csv', label: 'CSV' },
          { value: 'xlsx', label: 'XLSX' },
        ]}
      />
      <RadioGroup legend="Campanhas">
        <Radio name="escopo" label="17 campanhas visíveis" checked={scope === 'visiveis'} onChange={() => setScope('visiveis')} />
        <Radio name="escopo" label="Selecionadas (3)" checked={scope === 'selecionadas'} onChange={() => setScope('selecionadas')} />
      </RadioGroup>
      <fieldset className={p.exportColumns}>
        <legend>
          Colunas
          <span className={p.num}>
            {columns.length} de {EXPORT_COLUMNS.length}
          </span>
        </legend>
        <Checkbox
          label="Todas"
          checked={all}
          indeterminate={!all && columns.length > 0}
          onChange={() => setColumns(all ? [] : EXPORT_COLUMNS)}
        />
        <div className={p.exportGrid}>
          {EXPORT_COLUMNS.map((column) => (
            <Checkbox
              key={column}
              label={column}
              checked={columns.includes(column)}
              onChange={() =>
                setColumns((list) =>
                  list.includes(column)
                    ? list.filter((item) => item !== column)
                    : EXPORT_COLUMNS.filter((item) => item === column || list.includes(item)),
                )
              }
            />
          ))}
        </div>
      </fieldset>
      <div className={p.exportFoot}>
        <Button
          variant="primary"
          size="sm"
          icon={Download}
          loading={busy}
          aria-disabled={columns.length === 0 || undefined}
          onClick={async () => {
            if (!columns.length) return;
            setBusy(true);
            await wait(900);
            setBusy(false);
            close();
            toast(`${count} campanhas exportadas`, { description: `campanhas-francal-2026.${format}` });
          }}
        >
          Exportar
        </Button>
      </div>
    </div>
  );
}

const EXPORT_ROWS = [
  { id: 2041, name: 'Coleção Primavera-Verão 2027', advertiser: 'Aurora Calçados', tone: 'green' as Tone, status: 'Veiculando', selected: true },
  { id: 2038, name: 'Newsletter dos expositores', advertiser: 'Estúdio Norte', tone: 'green' as Tone, status: 'Veiculando', selected: true },
  { id: 2036, name: 'Destaque na vitrine — couro vegetal', advertiser: 'Lume Acessórios', tone: 'violet' as Tone, status: 'Aguardando aprovação', selected: true },
  { id: 2031, name: 'Retargeting de credenciados', advertiser: 'Grupo Horizonte', tone: 'gray' as Tone, status: 'Rascunho', selected: false },
];

function ExportContext() {
  return (
    <section className={p.listPanel} aria-label="Campanhas">
      <header className={p.listHead}>
        <div className={p.listTitle}>
          <h4>Campanhas</h4>
          <span className={p.num}>17</span>
          <span className={p.selectedCount}>3 selecionadas</span>
        </div>
        <Popover
          label="Exportar campanhas"
          align="end"
          width={300}
          trigger={(props) => (
            <Button {...props} icon={Download} trailingIcon={ChevronDown}>
              Exportar
            </Button>
          )}
        >
          {({ close }) => <ExportPanel close={close} />}
        </Popover>
      </header>
      <ul className={p.leadRows} data-kind="campaigns">
        {EXPORT_ROWS.map((row) => (
          <li key={row.id} data-selected={row.selected || undefined}>
            <CheckboxMark checked={row.selected} />
            <span className={p.leadName}>{row.name}</span>
            <span className={p.leadMeta}>{row.advertiser}</span>
            <span className={p.leadStatus}>
              <StatusText tone={row.tone} size="sm">
                {row.status}
              </StatusText>
            </span>
            <span className={p.leadDate}>#{row.id}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ImportarExportar() {
  return (
    <Shots>
      <Shot title="Importar" align="stretch">
        <ImportContext />
      </Shot>
      <Shot title="Exportar" align="stretch">
        <ExportContext />
      </Shot>
      <Shot title="Estados" tone="white" align="stretch">
        <States min={300}>
          <State label="Mapeado">
            <MappingLine row={MAP_ROWS[1] ?? MAP_ROWS[0]!} attempted={false} />
          </State>
          <State label="Faltando">
            <MappingLine row={MAP_ROWS[4] ?? MAP_ROWS[0]!} attempted />
          </State>
          <State label="Com erros">
            <div className={p.fill}>
              <Alert tone="warning" title={`${IMPORT_ERRORS} linhas com erro`} action={<LinkButton>Ver linhas</LinkButton>} />
            </div>
          </State>
          <State label="Importando">
            <div className={p.fill}>
              <Progress value={860} max={IMPORT_TOTAL} label="Importando" valueText={`860 de ${int(IMPORT_TOTAL)}`} />
            </div>
          </State>
          <State label="Concluído">
            <div className={p.fill}>
              <ImportDone />
            </div>
          </State>
          <State label="Falhou">
            <div className={p.fill}>
              <Progress
                value={860}
                max={IMPORT_TOTAL}
                tone="danger"
                label="Conexão interrompida em 860 de 1.240"
                end={<LinkButton>Tentar de novo</LinkButton>}
              />
            </div>
          </State>
        </States>
      </Shot>
    </Shots>
  );
}

/* ———————————————————————————————————————————————————————————————————————————
 * Membros e permissões
 * ——————————————————————————————————————————————————————————————————————————— */

const ROLES: SelectOption[] = [
  { value: 'admin', label: 'Admin do portal' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'operacao', label: 'Operação' },
  { value: 'anunciante', label: 'Anunciante' },
];
const roleLabel = (value: string) => ROLES.find((role) => role.value === value)?.label ?? value;

type Member = {
  id: string;
  name?: string;
  email: string;
  role: string;
  me?: boolean;
  pending?: string;
  phase?: 'enter' | 'leave';
};

const MEMBERS: Member[] = [
  { id: 'marina', name: 'Marina Lopes', email: 'marina.lopes@francal.com.br', role: 'admin', me: true },
  { id: 'rafael', name: 'Rafael Dias', email: 'rafael.dias@francal.com.br', role: 'comercial' },
  { id: 'clara', name: 'Clara Souto', email: 'clara.souto@francal.com.br', role: 'operacao' },
  { id: 'tiago', name: 'Tiago Rezende', email: 'tiago@auroracalcados.com.br', role: 'anunciante' },
  { id: 'juliana', email: 'juliana.prates@bellapasso.com.br', role: 'anunciante', pending: 'há 2 d' },
];

/** Convite pendente: orbe vazio com envelope (nunca iniciais). */
function PendingOrb() {
  return (
    <span className={p.pendingOrb} aria-hidden="true">
      <Mail />
    </span>
  );
}

function MemberRow({
  member,
  lastAdmin = false,
  onRole,
  onRemove,
  onResend,
  menuForce,
}: {
  member: Member;
  lastAdmin?: boolean;
  onRole?: (role: string) => void;
  onRemove?: () => void;
  onResend?: () => void;
  menuForce?: string;
}) {
  const who = member.name ?? member.email;
  const select = (
    <div className={p.roleSelect}>
      <Select
        size="sm"
        label={`Papel de ${who}`}
        value={member.role}
        options={ROLES}
        disabled={member.me}
        onChange={(value) => onRole?.(value)}
      />
    </div>
  );
  const sections: MenuSection[] = [
    {
      items: [
        ...(member.pending ? [{ label: 'Reenviar convite', icon: Send, onSelect: onResend }] : []),
        {
          label: member.pending ? 'Cancelar convite' : 'Remover do portal',
          icon: Trash2,
          danger: true,
          disabled: lastAdmin,
          description: lastAdmin ? 'O portal precisa de um admin' : undefined,
          onSelect: onRemove,
        },
      ],
    },
  ];
  return (
    <ListItem
      leading={member.pending ? <PendingOrb /> : <Avatar name={who} size="md" decorative />}
      title={
        <span className={p.memberName} data-row={member.phase}>
          {member.pending ? member.email : who}
          {member.me && <span className={p.youTag}>Você</span>}
        </span>
      }
      description={
        member.pending ? (
          <span className={p.pendingLine}>
            <StatusText tone="amber" size="sm">{`Convite enviado · ${member.pending}`}</StatusText>
            <LinkButton onClick={onResend}>Reenviar</LinkButton>
          </span>
        ) : (
          member.email
        )
      }
      trailing={
        <>
          {member.me ? <Tooltip content="Você não pode mudar o próprio papel">{select}</Tooltip> : select}
          {member.me ? (
            <span className={p.menuSlot} aria-hidden="true" />
          ) : (
            <Menu
              label={`Ações de ${who}`}
              align="end"
              width={232}
              sections={sections}
              trigger={(props) => (
                <IconButton {...props} label={`Ações de ${who}`} icon={Ellipsis} variant="ghost" size="sm" data-force={menuForce} />
              )}
            />
          )}
        </>
      }
    />
  );
}

const PERMISSIONS: { label: string; values: (boolean | string)[] }[] = [
  { label: 'Criar campanha', values: [true, true, true, true] },
  { label: 'Aprovar', values: [true, true, false, false] },
  { label: 'Gerar P.I.', values: [true, true, false, false] },
  { label: 'Ver Analytics', values: [true, true, true, 'Próprias'] },
  { label: 'Gerenciar membros', values: [true, false, false, false] },
];

function PermissionMatrix() {
  return (
    <div className={p.matrixScroll} tabIndex={0} role="region" aria-label="Permissões por papel">
      <table className={`${p.plain} ${p.matrix}`}>
        <thead>
          <tr>
            <th scope="col">Permissão</th>
            {ROLES.map((role) => (
              <th key={role.value} scope="col" data-center="">
                {role.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERMISSIONS.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              {row.values.map((value, index) => (
                <td key={ROLES[index]?.value ?? index} data-center="">
                  {value === true ? (
                    <Check className={p.yes} aria-label="Sim" />
                  ) : value === false ? (
                    <span className={p.no} aria-label="Não">
                      —
                    </span>
                  ) : (
                    <span className={p.partial}>{value}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MembersPanel() {
  const [members, setMembers] = useState<Member[]>(MEMBERS);
  const [emails, setEmails] = useState<string[]>(['lucas@estudionorte.com.br', 'ana@casaforma.com.br']);
  const [role, setRole] = useState('anunciante');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<Member | null>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  async function invite() {
    const bad = emails.find((email) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email));
    if (!emails.length) return setError('Adicione um e-mail');
    if (bad) return setError(`${bad} não é um e-mail`);
    setBusy(true);
    await wait(700);
    setBusy(false);
    const added = emails.map((email) => ({ id: email, email, role, pending: 'agora', phase: 'enter' as const }));
    setMembers((list) => [...list, ...added]);
    later(() => setMembers((list) => list.map((m) => (m.phase === 'enter' ? { ...m, phase: undefined } : m))), 320);
    toast(`${added.length} ${added.length === 1 ? 'convite enviado' : 'convites enviados'}`);
    setEmails([]);
  }

  function remove(member: Member) {
    setMembers((list) => list.map((m) => (m.id === member.id ? { ...m, phase: 'leave' } : m)));
    later(() => setMembers((list) => list.filter((m) => m.id !== member.id)), 300);
    toast(member.pending ? 'Convite cancelado' : `Acesso de ${member.name ?? member.email} removido`);
  }

  const active = members.filter((m) => m.phase !== 'leave');
  return (
    <section className={p.membersPanel} aria-label="Membros do portal">
      <header className={p.listHead}>
        <div className={p.listTitle}>
          <h4>Membros do portal</h4>
          <span key={active.length} className={`${p.statusLabel} ${p.num}`}>
            {active.length}
          </span>
        </div>
        <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => setMembers(MEMBERS)}>
          Reiniciar
        </Button>
      </header>
      <div className={p.composer}>
        <div className={p.composerField}>
          <TagInput
            label="E-mails para convidar"
            values={emails}
            onChange={(next) => {
              setEmails(next);
              if (error) setError(undefined);
            }}
            placeholder="nome@empresa.com.br"
            invalid={Boolean(error)}
          />
          {error && (
            <p className={p.inlineError} role="alert">
              <CircleAlert aria-hidden="true" />
              {error}
            </p>
          )}
        </div>
        <div className={p.composerRole}>
          <Select label="Papel dos convidados" value={role} options={ROLES} onChange={setRole} />
        </div>
        <Button variant="primary" icon={Send} loading={busy} onClick={invite}>
          Convidar
        </Button>
      </div>
      <div className={p.membersList}>
        <List label="Membros" framed={false}>
          {members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              onRole={(next) => {
                setMembers((list) => list.map((m) => (m.id === member.id ? { ...m, role: next } : m)));
                toast(`${member.name ?? member.email} agora é ${roleLabel(next)}`);
              }}
              onResend={() => toast(`Convite reenviado para ${member.email}`)}
              onRemove={() => setRemoving(member)}
            />
          ))}
        </List>
      </div>
      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        tone="danger"
        title={removing?.pending ? 'Cancelar convite?' : `Remover ${removing?.name ?? ''}?`}
        description={
          removing?.pending ? removing.email : `Perde o acesso ao portal Francal 2026 · ${removing ? roleLabel(removing.role) : ''}`
        }
        confirmLabel={removing?.pending ? 'Cancelar convite' : 'Remover'}
        onConfirm={() => {
          if (removing) remove(removing);
          setRemoving(null);
        }}
      />
    </section>
  );
}

function Membros() {
  const one = (member: Member, extra?: ReactNode, lastAdmin = false) => (
    <div className={p.memberState}>
      <List label={member.name ?? member.email}>
        <MemberRow member={member} lastAdmin={lastAdmin} />
      </List>
      {extra}
    </div>
  );
  return (
    <Shots>
      <Shot title="Em contexto" align="stretch">
        <MembersPanel />
      </Shot>
      <Shot title="Permissões" tone="white" align="stretch">
        <PermissionMatrix />
      </Shot>
      <Shot title="Estados" tone="white" align="stretch">
        <States min={400}>
          <State label="Membro">{one(MEMBERS[1] ?? MEMBERS[0]!)}</State>
          <State label="Você">{one(MEMBERS[0]!)}</State>
          <State label="Convite pendente">{one(MEMBERS[4] ?? MEMBERS[0]!)}</State>
          <State label="Último admin">
            {one(
              { id: 'rafael-admin', name: 'Rafael Dias', email: 'rafael.dias@francal.com.br', role: 'admin' },
              <div className={p.menuPreview}>
                <MenuPanel
                  label="Ações de Rafael Dias"
                  width={232}
                  sections={[
                    {
                      items: [
                        {
                          label: 'Remover do portal',
                          icon: Trash2,
                          danger: true,
                          disabled: true,
                          description: 'O portal precisa de um admin',
                        },
                      ],
                    },
                  ]}
                />
              </div>,
              true,
            )}
          </State>
        </States>
      </Shot>
    </Shots>
  );
}

/* ———————————————————————————————————————————————————————————————————————————
 * Arte de produto (SVG em linha, chapada): scarpin em três cores e quatro vistas
 * ——————————————————————————————————————————————————————————————————————————— */

type Colorway = { id: string; label: string; body: string; heel: string; sole: string };
const COLORWAYS: Colorway[] = [
  { id: 'caramelo', label: 'Caramelo', body: '#c28457', heel: '#9a6440', sole: '#7c4f32' },
  { id: 'areia', label: 'Areia', body: '#e2d6c6', heel: '#c9b9a4', sole: '#a8957f' },
  { id: 'preto', label: 'Preto', body: '#2b2d33', heel: '#1b1c20', sole: '#111215' },
];
const colorwayOf = (id: string) => COLORWAYS.find((item) => item.id === id) ?? COLORWAYS[0]!;

function Pump({ c }: { c: Colorway }) {
  return (
    <g>
      <path d="M38 61 46.5 63 41.6 100 38.4 100Z" fill={c.heel} />
      <path
        d="M38 40c-3 8-3 16 0 20 18 6 36 28 58 37 16 3 30 3 38 0 4-2 3-7-1-9-11-4-27-8-39-11-14-4-36-19-50-36-2-2-4-2-6-1Z"
        fill={c.body}
      />
      <path d="M44 42c14 17 36 31 50 35" fill="none" stroke={c.heel} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
      <path d="M38.5 61c18 6 36 28 57.5 37 16 3 30 3 38 0" fill="none" stroke={c.sole} strokeWidth="2.2" strokeLinecap="round" />
    </g>
  );
}

/** Foto fictícia do produto. `view`: 0 lateral · 1 espelhada · 2 detalhe · 3 par. */
function ShoeArt({ colorway, view = 0, label }: { colorway: string; view?: number; label?: string }) {
  const c = colorwayOf(colorway);
  return (
    <svg
      className={p.art}
      viewBox="0 0 160 120"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="160" height="120" fill="var(--art-bg, #eef0f3)" />
      {view !== 2 && <ellipse cx="80" cy="101" rx={view === 3 ? 60 : 50} ry="4" fill="var(--art-floor, #e3e6eb)" />}
      {view === 0 && (
        <g transform="translate(-6 0)">
          <Pump c={c} />
        </g>
      )}
      {view === 1 && (
        <g transform="translate(166 0) scale(-1 1)">
          <Pump c={c} />
        </g>
      )}
      {view === 2 && (
        <g transform="translate(-125 -93) scale(1.8)">
          <Pump c={c} />
        </g>
      )}
      {view === 3 && (
        <>
          <g transform="translate(14 -10) scale(0.92)">
            <Pump c={c} />
          </g>
          <g transform="translate(-14 4)">
            <Pump c={c} />
          </g>
        </>
      )}
    </svg>
  );
}

/* ———————————————————————————————————————————————————————————————————————————
 * Editor de blocos (Vitrine)
 * ——————————————————————————————————————————————————————————————————————————— */

type BlockKind = 'marca' | 'destaque' | 'grade' | 'video' | 'contato' | 'texto';
type Block = {
  id: string;
  kind: BlockKind;
  heading: string;
  hidden: boolean;
  columns: '2' | '3' | '4';
  showPrice: boolean;
  sort: string;
  extra: boolean;
};

const BLOCK_META: Record<BlockKind, { label: string; icon: LucideIcon; heading: string }> = {
  marca: { label: 'Cabeçalho da marca', icon: PanelTop, heading: 'Aurora Calçados' },
  destaque: { label: 'Destaque', icon: GalleryHorizontal, heading: 'Coleção Primavera-Verão 2027' },
  grade: { label: 'Grade de produtos', icon: LayoutGrid, heading: 'Lançamentos' },
  video: { label: 'Vídeo', icon: SquarePlay, heading: 'Bastidores da coleção' },
  contato: { label: 'Contato', icon: Contact, heading: 'Fale com a Aurora' },
  texto: { label: 'Texto', icon: Type, heading: 'Sobre a marca' },
};

const makeBlock = (kind: BlockKind, id: string): Block => ({
  id,
  kind,
  heading: BLOCK_META[kind].heading,
  hidden: false,
  columns: '3',
  showPrice: true,
  sort: 'recentes',
  extra: true,
});

const START_BLOCKS: Block[] = [
  makeBlock('marca', 'b-marca'),
  makeBlock('destaque', 'b-destaque'),
  makeBlock('grade', 'b-grade'),
  { ...makeBlock('video', 'b-video'), hidden: true },
  makeBlock('contato', 'b-contato'),
];

const PRODUCTS = [
  { name: 'Scarpin Couro Vegetal', price: 189.9, colorway: 'caramelo', view: 0 },
  { name: 'Scarpin Bico Fino', price: 214.9, colorway: 'preto', view: 1 },
  { name: 'Slingback Areia', price: 199.9, colorway: 'areia', view: 0 },
  { name: 'Mule Salto Bloco', price: 179.9, colorway: 'caramelo', view: 1 },
  { name: 'Scarpin Verniz', price: 229.9, colorway: 'preto', view: 0 },
  { name: 'Peep Toe Areia', price: 194.9, colorway: 'areia', view: 1 },
  { name: 'Scarpin Salto Médio', price: 184.9, colorway: 'caramelo', view: 1 },
  { name: 'Slingback Verniz', price: 219.9, colorway: 'preto', view: 0 },
];

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * FLIP: `capture()` fotografa a posição dos `[data-flip]` antes da mudança; quando `signature`
 * muda, cada elemento desliza do lugar antigo para o novo (280 ms, ease-move).
 */
function useFlip(root: RefObject<HTMLElement | null>, signature: string, selector = '[data-flip]', keyOf = (el: HTMLElement) => el.dataset.flip ?? '') {
  const snap = useRef<Map<string, DOMRect> | null>(null);
  const capture = () => {
    const map = new Map<string, DOMRect>();
    root.current?.querySelectorAll<HTMLElement>(selector).forEach((el) => map.set(keyOf(el), el.getBoundingClientRect()));
    snap.current = map;
  };
  useLayoutEffect(() => {
    const before = snap.current;
    snap.current = null;
    if (!before || reducedMotion()) return;
    root.current?.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      const from = before.get(keyOf(el));
      if (!from) return;
      const to = el.getBoundingClientRect();
      const dx = from.left - to.left;
      const dy = from.top - to.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
        duration: 280,
        easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);
  return capture;
}

function BlockPreview({ block, narrow }: { block: Block; narrow: boolean }) {
  switch (block.kind) {
    case 'marca':
      return (
        <div className={p.pvBrand}>
          <BrandMark name="Aurora Calçados" size="md" />
          <span className={p.pvBrandText}>
            <strong>{block.heading}</strong>
            {block.extra && <span>Pavilhão Azul · Estande B-214</span>}
          </span>
          <span className={p.pvButton} data-variant="secondary">
            Agendar visita
          </span>
        </div>
      );
    case 'destaque':
      return (
        <div className={p.pvHero}>
          <div className={p.pvHeroArt}>
            <ShoeArt colorway="caramelo" view={3} />
          </div>
          <div className={p.pvHeroText}>
            <span className={p.pvEyebrow}>Lançamento</span>
            <strong>{block.heading}</strong>
            {block.extra && (
              <span className={p.pvButton} data-variant="primary">
                Ver coleção
              </span>
            )}
          </div>
        </div>
      );
    case 'grade': {
      const sorted = [...PRODUCTS].sort((a, b) =>
        block.sort === 'nome' ? a.name.localeCompare(b.name) : block.sort === 'preco' ? a.price - b.price : 0,
      );
      const columns = narrow ? Math.min(2, Number(block.columns)) : Number(block.columns);
      return (
        <div className={p.pvSection}>
          <strong className={p.pvHeading}>{block.heading}</strong>
          <div className={p.pvGrid} style={{ '--cols': columns } as CSSProperties}>
            {sorted.slice(0, columns * 2).map((product) => (
              <div key={product.name} className={p.pvProduct} data-flip={product.name}>
                <span className={p.pvThumb}>
                  <ShoeArt colorway={product.colorway} view={product.view} />
                </span>
                <span className={p.pvName}>{product.name}</span>
                <span className={p.pvPrice} data-shown={block.showPrice || undefined}>
                  {brl(product.price)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case 'video':
      return (
        <div className={p.pvSection}>
          <strong className={p.pvHeading}>{block.heading}</strong>
          <div className={p.pvVideo}>
            <span className={p.pvPlay}>
              <Play aria-hidden="true" />
            </span>
            <span className={p.pvDuration}>1:42</span>
          </div>
        </div>
      );
    case 'contato':
      return (
        <div className={p.pvContact}>
          <span className={p.pvBrandText}>
            <strong>{block.heading}</strong>
            <span>comercial@auroracalcados.com.br{block.extra ? ' · (11) 98765-4321' : ''}</span>
          </span>
          <span className={p.pvButton} data-variant="secondary">
            Enviar mensagem
          </span>
        </div>
      );
    default:
      return (
        <div className={p.pvSection}>
          <strong className={p.pvHeading}>{block.heading}</strong>
          <p className={p.pvText}>
            Calçados femininos em couro vegetal, produzidos em Franca desde 1998. Atendimento a lojistas
            com pedido mínimo de 12 pares.
          </p>
        </div>
      );
  }
}

type EditorDoc = Block[];
type Publish = 'dirty' | 'publishing' | 'published';

function BlockInspector({ block, onChange }: { block: Block; onChange: (patch: Partial<Block>, field: string) => void }) {
  const meta = BLOCK_META[block.kind];
  const extraLabel: Partial<Record<BlockKind, string>> = {
    marca: 'Mostrar estande',
    destaque: 'Mostrar botão',
    video: 'Reproduzir sem som',
    contato: 'Mostrar WhatsApp',
  };
  return (
    <div key={block.id} className={p.inspectorBody}>
      <div className={p.inspectorHead}>
        <meta.icon aria-hidden="true" />
        <strong>{meta.label}</strong>
        {block.hidden && <span className={p.hiddenTag}>Oculto</span>}
      </div>
      <Field label="Título">
        {({ id }) => (
          <Input id={id} value={block.heading} onChange={(event) => onChange({ heading: event.target.value }, `heading-${block.id}`)} />
        )}
      </Field>
      {block.kind === 'grade' && (
        <>
          <div className={p.inspectorField}>
            <span className={p.inspectorLabel}>Colunas</span>
            <Segmented
              size="sm"
              full
              label="Colunas"
              value={block.columns}
              onChange={(columns) => onChange({ columns }, 'columns')}
              options={[
                { value: '2', label: '2' },
                { value: '3', label: '3' },
                { value: '4', label: '4' },
              ]}
            />
          </div>
          <Switch checked={block.showPrice} onCheckedChange={(showPrice) => onChange({ showPrice }, 'price')} label="Mostrar preço" />
          <Field label="Ordenar por">
            {({ id }) => (
              <Select
                id={id}
                value={block.sort}
                onChange={(sort) => onChange({ sort }, 'sort')}
                options={[
                  { value: 'recentes', label: 'Mais recentes' },
                  { value: 'nome', label: 'Nome' },
                  { value: 'preco', label: 'Menor preço' },
                ]}
              />
            )}
          </Field>
        </>
      )}
      {extraLabel[block.kind] && (
        <Switch checked={block.extra} onCheckedChange={(extra) => onChange({ extra }, 'extra')} label={extraLabel[block.kind] ?? ''} />
      )}
    </div>
  );
}

function BlockEditor() {
  const [doc, setDoc] = useState<EditorDoc>(START_BLOCKS);
  const [past, setPast] = useState<EditorDoc[]>([]);
  const [future, setFuture] = useState<EditorDoc[]>([]);
  const [selected, setSelected] = useState('b-grade');
  const [device, setDevice] = useState<'desktop' | 'celular'>('desktop');
  const [publish, setPublish] = useState<Publish>('dirty');
  const [leaving, setLeaving] = useState<string[]>([]);
  const [fresh, setFresh] = useState<string | null>(null);
  const [width, setWidth] = useState(720);
  const lastField = useRef<{ key: string; at: number } | null>(null);
  const seq = useRef(0);
  const railRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const order = doc.map((block) => `${block.id}:${block.hidden ? 0 : 1}`).join('|');
  // Bloco que acabou de aparecer ou sumir: recorta só durante a animação de altura.
  const [seenOrder, setSeenOrder] = useState(order);
  const [anim, setAnim] = useState<string[]>([]);
  if (seenOrder !== order) {
    const before = new Map(seenOrder.split('|').map((entry) => entry.split(':') as [string, string]));
    const changed = doc.filter((block) => before.has(block.id) && before.get(block.id) !== (block.hidden ? '0' : '1'));
    setSeenOrder(order);
    if (changed.length) setAnim(changed.map((block) => block.id));
  }
  useEffect(() => {
    if (!anim.length) return;
    const timer = window.setTimeout(() => setAnim([]), 320);
    return () => window.clearTimeout(timer);
  }, [anim]);
  const grid = doc.find((block) => block.kind === 'grade');
  const captureCanvas = useFlip(pageRef, `${order}#${grid?.columns}#${grid?.sort}`);
  const captureRail = useFlip(railRef, order, 'li[data-item]', (el) => el.dataset.title ?? '');

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(280, el.clientWidth - 48));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function commit(next: EditorDoc, field?: string) {
    const now = Date.now();
    const coalesce = field && lastField.current?.key === field && now - lastField.current.at < 800;
    if (!coalesce) setPast((list) => [...list.slice(-30), doc]);
    lastField.current = field ? { key: field, at: now } : null;
    setFuture([]);
    setDoc(next);
    setPublish('dirty');
  }
  function undo() {
    const prev = past[past.length - 1];
    if (!prev) return;
    captureCanvas();
    captureRail();
    setPast((list) => list.slice(0, -1));
    setFuture((list) => [doc, ...list]);
    setDoc(prev);
    setPublish('dirty');
    lastField.current = null;
  }
  function redo() {
    const next = future[0];
    if (!next) return;
    captureCanvas();
    captureRail();
    setFuture((list) => list.slice(1));
    setPast((list) => [...list, doc]);
    setDoc(next);
    setPublish('dirty');
    lastField.current = null;
  }
  const patch = (id: string, change: Partial<Block>, field?: string) =>
    commit(
      doc.map((block) => (block.id === id ? { ...block, ...change } : block)),
      field,
    );
  function move(id: string, delta: -1 | 1, fromRail = false) {
    const from = doc.findIndex((block) => block.id === id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= doc.length) return;
    captureCanvas();
    if (!fromRail) captureRail();
    const next = [...doc];
    const [item] = next.splice(from, 1);
    if (item) next.splice(to, 0, item);
    commit(next);
  }
  function duplicate(id: string) {
    const at = doc.findIndex((block) => block.id === id);
    const source = doc[at];
    if (!source) return;
    seq.current += 1;
    const copy = { ...source, id: `${source.id}-c${seq.current}` };
    captureCanvas();
    captureRail();
    commit([...doc.slice(0, at + 1), copy, ...doc.slice(at + 1)]);
    setSelected(copy.id);
    setFresh(copy.id);
  }
  function remove(id: string) {
    setLeaving((list) => [...list, id]);
    window.setTimeout(() => {
      captureCanvas();
      captureRail();
      setDoc((current) => {
        setPast((list) => [...list, current]);
        setFuture([]);
        return current.filter((block) => block.id !== id);
      });
      setLeaving((list) => list.filter((item) => item !== id));
      setPublish('dirty');
      setSelected((current) => (current === id ? '' : current));
    }, 280);
  }
  function add(kind: BlockKind) {
    seq.current += 1;
    const block = makeBlock(kind, `b-${kind}-${seq.current}`);
    captureRail();
    commit([...doc, block]);
    setSelected(block.id);
    setFresh(block.id);
    window.setTimeout(() => {
      pageRef.current?.querySelector(`[data-flip="${block.id}"]`)?.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
    }, 60);
  }

  const current = doc.find((block) => block.id === selected);
  const canvasWidth = device === 'desktop' ? Math.min(720, width) : Math.min(390, width);
  const narrow = canvasWidth < 480;

  return (
    <section
      className={p.editor}
      aria-label="Editor da Vitrine"
      onKeyDown={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest('input, textarea, [contenteditable]')) return;
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
          event.preventDefault();
          if (event.shiftKey) redo();
          else undo();
        }
      }}
    >
      <header className={p.editorTop}>
        <div className={p.editorTitle}>
          <strong>Vitrine</strong>
          <span>Aurora Calçados</span>
        </div>
        <div className={p.editorTools}>
          <Segmented
            size="sm"
            label="Dispositivo"
            value={device}
            onChange={setDevice}
            options={[
              { value: 'desktop', label: 'Desktop', icon: Monitor },
              { value: 'celular', label: 'Celular', icon: Smartphone },
            ]}
          />
        </div>
        <div className={p.editorActions}>
          <ButtonGroup label="Histórico">
            <Tooltip content="Desfazer" shortcut="⌘Z">
              <IconButton label="Desfazer" icon={Undo2} size="sm" disabled={!past.length} onClick={undo} />
            </Tooltip>
            <Tooltip content="Refazer" shortcut="⇧⌘Z">
              <IconButton label="Refazer" icon={Redo2} size="sm" disabled={!future.length} onClick={redo} />
            </Tooltip>
          </ButtonGroup>
          <span className={p.publishState} data-state={publish}>
            {publish === 'published' ? (
              <span key="ok" className={p.publishedText}>
                <Check aria-hidden="true" />
                Publicado agora
              </span>
            ) : (
              <StatusText tone="amber" size="sm">
                Alterações não publicadas
              </StatusText>
            )}
          </span>
          {publish === 'published' ? (
            <Tooltip content="Nada novo para publicar">
              <Button variant="primary" size="sm" aria-disabled>
                Publicar
              </Button>
            </Tooltip>
          ) : (
            <Button
              variant="primary"
              size="sm"
              loading={publish === 'publishing'}
              onClick={async () => {
                if (publish !== 'dirty') return;
                setPublish('publishing');
                await wait(900);
                setPublish('published');
                toast('Vitrine publicada', { description: 'vitrine.francal.com.br/aurora-calcados' });
              }}
            >
              Publicar
            </Button>
          )}
        </div>
      </header>
      <div className={p.editorBody}>
        <aside className={p.rail} aria-label="Blocos">
          <div className={p.paneHead}>
            <span>Blocos</span>
            <span className={p.num}>{doc.length}</span>
          </div>
          <div ref={railRef} className={p.railList}>
            <List
              label="Blocos da página"
              framed={false}
              dividers={false}
              onReorder={(from, to) => {
                captureCanvas();
                const next = [...doc];
                const [item] = next.splice(from, 1);
                if (item) next.splice(to, 0, item);
                commit(next);
              }}
            >
              {doc.map((block) => {
                const meta = BLOCK_META[block.kind];
                return (
                  <ListItem
                    key={block.id}
                    draggable
                    density="sm"
                    selected={block.id === selected}
                    leading={
                      <button
                        type="button"
                        className={p.railHit}
                        data-hidden={block.hidden || undefined}
                        data-leaving={leaving.includes(block.id) || undefined}
                        aria-label={meta.label}
                        aria-pressed={block.id === selected}
                        onClick={() => setSelected(block.id)}
                      >
                        <meta.icon className={p.railIcon} aria-hidden="true" />
                      </button>
                    }
                    title={meta.label}
                    trailing={
                      <IconButton
                        className={p.railEye}
                        label={block.hidden ? `Mostrar ${meta.label}` : `Ocultar ${meta.label}`}
                        icon={block.hidden ? EyeOff : Eye}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          captureCanvas();
                          patch(block.id, { hidden: !block.hidden });
                        }}
                      />
                    }
                  />
                );
              })}
            </List>
          </div>
          <div className={p.railFoot}>
            <Menu
              label="Adicionar bloco"
              width={232}
              side="top"
              sections={[
                {
                  items: (Object.keys(BLOCK_META) as BlockKind[]).map((kind) => ({
                    label: BLOCK_META[kind].label,
                    icon: BLOCK_META[kind].icon,
                    onSelect: () => add(kind),
                  })),
                },
              ]}
              trigger={(props) => (
                <Button {...props} size="sm" icon={Plus}>
                  Adicionar bloco
                </Button>
              )}
            />
          </div>
        </aside>
        <div ref={stageRef} className={p.canvas} onClick={(event) => event.target === event.currentTarget && setSelected('')}>
          <div ref={pageRef} className={p.page} style={{ width: canvasWidth }} data-narrow={narrow || undefined}>
            {doc.map((block) => {
              const meta = BLOCK_META[block.kind];
              const isSelected = block.id === selected;
              const collapsed = block.hidden || leaving.includes(block.id);
              return (
                <div
                  key={block.id}
                  className={p.cBlock}
                  data-flip={block.id}
                  data-collapsed={collapsed || undefined}
                  data-anim={anim.includes(block.id) || undefined}
                  data-fresh={fresh === block.id || undefined}
                  onAnimationEnd={() => fresh === block.id && setFresh(null)}
                >
                  <div className={p.cClip}>
                    <div className={p.cInner} data-selected={isSelected || undefined}>
                      <button
                        type="button"
                        className={p.cHit}
                        aria-label={`Selecionar ${meta.label}`}
                        aria-pressed={isSelected}
                        tabIndex={collapsed ? -1 : undefined}
                        onClick={() => setSelected(block.id)}
                      />
                      <div className={p.cContent} inert>
                        <BlockPreview block={block} narrow={narrow} />
                      </div>
                      {isSelected && !collapsed && (
                        <>
                          <span className={p.cLabel}>{meta.label}</span>
                          <div className={p.cTools}>
                            <ButtonGroup label={`Ações de ${meta.label}`} size="sm">
                              <IconButton label="Mover para cima" icon={ArrowUp} size="sm" disabled={doc[0]?.id === block.id} onClick={() => move(block.id, -1)} />
                              <IconButton label="Mover para baixo" icon={ArrowDown} size="sm" disabled={doc[doc.length - 1]?.id === block.id} onClick={() => move(block.id, 1)} />
                              <IconButton label="Duplicar" icon={Copy} size="sm" onClick={() => duplicate(block.id)} />
                              <IconButton label="Remover" icon={Trash2} size="sm" tone="danger" onClick={() => remove(block.id)} />
                            </ButtonGroup>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <aside className={p.inspector} aria-label="Ajustes do bloco">
          <div className={p.paneHead}>
            <span>Ajustes</span>
          </div>
          {current ? (
            <BlockInspector
              block={current}
              onChange={(change, field) => {
                if ('columns' in change || 'sort' in change) captureCanvas();
                patch(current.id, change, field === `heading-${current.id}` ? field : undefined);
              }}
            />
          ) : (
            <p className={p.inspectorEmpty}>Nenhum bloco selecionado</p>
          )}
        </aside>
      </div>
    </section>
  );
}

function EditorVitrine() {
  const [run, setRun] = useState(0);
  return (
    <Shots>
      <Shot title="Em contexto" align="stretch" pad="none" aside={<ResetButton onClick={() => setRun((n) => n + 1)} />}>
        <div className={p.editorHost}>
          <BlockEditor key={run} />
        </div>
      </Shot>
    </Shots>
  );
}

/* ———————————————————————————————————————————————————————————————————————————
 * Expositor e produto (Vitrine pública)
 * ——————————————————————————————————————————————————————————————————————————— */

/** Tema do portal: a cor de ação da Vitrine vem do portal (white-label), sempre com contraste AA. */
const PORTAL_THEMES: Record<string, CSSProperties> = {
  mediaon: {},
  francal: {
    '--b-25': '#fef9f4',
    '--b-50': '#fef6ee',
    '--b-100': '#fdeedf',
    '--b-200': '#fbdfc3',
    '--b-300': '#f9cb9e',
    '--b-500': '#c97420',
    '--b-600': '#a9621c',
    '--b-700': '#955619',
    '--b-800': '#804a15',
    '--accent-pressed': '#804a15',
    '--focus-color': '#c97420',
    '--select-bg': '#fef9f4',
    '--select-line': '#f9cb9e',
    '--select-ink': '#955619',
  } as CSSProperties,
  couro: {
    '--b-25': '#f3fafa',
    '--b-50': '#ecf8f8',
    '--b-100': '#dcf1f2',
    '--b-200': '#bde5e6',
    '--b-300': '#95d6d6',
    '--b-500': '#13a3a5',
    '--b-600': '#0f8284',
    '--b-700': '#0d7274',
    '--b-800': '#0b6364',
    '--accent-pressed': '#0b6364',
    '--focus-color': '#13a3a5',
    '--select-bg': '#f3fafa',
    '--select-line': '#95d6d6',
    '--select-ink': '#0d7274',
  } as CSSProperties,
};

const SIZES = ['34', '35', '36', '37', '38', '39'];

function Gallery({ colorway, name }: { colorway: string; name: string }) {
  const [view, setView] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const views = ['Lateral', 'Lateral oposta', 'Bico', 'Par'];
  return (
    <div className={p.gallery}>
      <div className={p.galleryMain}>
        <div key={`${colorway}-${view}`} className={p.galleryImage}>
          <ShoeArt colorway={colorway} view={view} label={`${name}, ${colorwayOf(colorway).label}, vista ${views[view]?.toLowerCase()}`} />
        </div>
        <span className={p.galleryCount}>
          {view + 1} / {views.length}
        </span>
      </div>
      <div
        className={p.thumbs}
        role="radiogroup"
        aria-label="Fotos do produto"
        onKeyDown={(event) => {
          const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
          if (!delta) return;
          event.preventDefault();
          const next = (view + delta + views.length) % views.length;
          setView(next);
          refs.current[next]?.focus();
        }}
      >
        {views.map((label, index) => (
          <button
            key={label}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={view === index}
            aria-label={label}
            tabIndex={view === index ? 0 : -1}
            className={p.thumb}
            onClick={() => setView(index)}
          >
            <ShoeArt colorway={colorway} view={index} />
          </button>
        ))}
      </div>
    </div>
  );
}

function Swatches({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className={p.swatches} role="radiogroup" aria-label="Cor">
      {COLORWAYS.map((item) => (
        <label key={item.id} className={p.swatch} title={item.label}>
          <input
            type="radio"
            name="cor-produto"
            value={item.id}
            checked={value === item.id}
            onChange={() => onChange(item.id)}
            aria-label={item.label}
          />
          <span style={{ background: item.body }} />
        </label>
      ))}
    </div>
  );
}

function QuoteDialog({
  open,
  onClose,
  sizes,
  colorway,
}: {
  open: boolean;
  onClose: () => void;
  sizes: string[];
  colorway: string;
}) {
  const [form, setForm] = useState({ nome: '', empresa: '', cnpj: '' });
  const [qty, setQty] = useState<number | null>(24);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const field = (key: keyof typeof form, label: string, placeholder: string, autoComplete?: string) => (
    <Field label={label} required error={errors[key]}>
      {({ id, describedBy, invalid }) => (
        <Input
          id={id}
          aria-describedby={describedBy}
          invalid={invalid}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={form[key]}
          onChange={(event) => {
            setForm((current) => ({ ...current, [key]: event.target.value }));
            if (errors[key]) setErrors((current) => ({ ...current, [key]: '' }));
          }}
        />
      )}
    </Field>
  );
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Solicitar orçamento"
      description="Aurora Calçados · Estande B-214"
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            variant="primary"
            loading={busy}
            onClick={async () => {
              const next: Record<string, string> = {};
              if (!form.nome.trim()) next.nome = 'Informe seu nome';
              if (!form.empresa.trim()) next.empresa = 'Informe a empresa';
              if (form.cnpj.replace(/\D/g, '').length !== 14) next.cnpj = 'CNPJ com 14 números';
              setErrors(next);
              if (Object.keys(next).length) return;
              setBusy(true);
              await wait(900);
              setBusy(false);
              onClose();
              toast('Orçamento solicitado', { description: 'Aurora Calçados responde em até 2 dias úteis' });
            }}
          >
            Enviar pedido
          </Button>
        </>
      }
    >
      <div className={p.quote}>
        <div className={p.quoteItem}>
          <span className={p.quoteThumb}>
            <ShoeArt colorway={colorway} />
          </span>
          <span className={p.quoteText}>
            <strong>Scarpin Couro Vegetal Primavera</strong>
            <span>
              {colorwayOf(colorway).label} · {sizes.length ? `Tam. ${sizes.join(', ')}` : 'Tamanhos a definir'}
            </span>
          </span>
        </div>
        <div className={p.quoteGrid}>
          {field('nome', 'Nome', 'Seu nome', 'name')}
          {field('empresa', 'Empresa', 'Razão social ou fantasia', 'organization')}
          {field('cnpj', 'CNPJ', '00.000.000/0000-00')}
          <Field label="Quantidade" hint="Múltiplos de 12 pares">
            {({ id, describedBy }) => (
              <NumberField id={id} aria-describedby={describedBy} value={qty} onChange={setQty} min={12} step={12} stepper suffix="pares" />
            )}
          </Field>
        </div>
      </div>
    </Dialog>
  );
}

function ProductPage({ theme = 'mediaon' }: { theme?: string }) {
  const [sizes, setSizes] = useState<string[]>(['36', '37']);
  const [colorway, setColorway] = useState('caramelo');
  const [saved, setSaved] = useState(false);
  const [quote, setQuote] = useState(false);
  const name = 'Scarpin Couro Vegetal Primavera';
  const cta = (
    <Button variant="primary" size="lg" className={p.ctaMain} onClick={() => setQuote(true)}>
      Solicitar orçamento
    </Button>
  );
  return (
    <article className={p.product} style={PORTAL_THEMES[theme]} aria-label={name}>
      <header className={p.exhibitorBar}>
        <BrandMark name="Aurora Calçados" size="lg" variant="solid" />
        <span className={p.exhibitorText}>
          <strong>Aurora Calçados</strong>
          <span>Pavilhão Azul · Estande B-214</span>
        </span>
        <Button icon={CalendarClock} onClick={() => toast('Visita agendada para 19/10 às 14:30')}>
          Agendar visita
        </Button>
      </header>
      <div className={p.productGrid}>
        <Gallery colorway={colorway} name={name} />
        <div className={p.productInfo}>
          <div className={p.productHead}>
            <div className={p.productTitles}>
              <h3 className={p.productName}>{name}</h3>
              <span className={p.productRef}>Ref. AC-2041</span>
            </div>
            <IconButton
              label={saved ? 'Remover dos salvos' : 'Salvar'}
              icon={Bookmark}
              fillPressed
              aria-pressed={saved}
              onClick={() => {
                setSaved((value) => !value);
                toast(saved ? 'Removido dos salvos' : 'Produto salvo');
              }}
            />
          </div>
          <div className={p.tags}>
            <Chip variant="neutral" size="sm">Couro vegetal</Chip>
            <Chip variant="neutral" size="sm">Feminino</Chip>
            <Chip variant="neutral" size="sm">Lançamento</Chip>
          </div>
          <div className={p.priceBlock}>
            <span className={p.priceLine}>
              <small>A partir de</small> {brl(189.9)} <small>/ par</small>
            </span>
            <span className={p.productRef}>Pedido mínimo 12 pares</span>
          </div>
          <div className={p.optionGroup}>
            <span className={p.optionLabel}>
              Tamanhos <span>{sizes.length ? sizes.join(', ') : 'Escolha um ou mais'}</span>
            </span>
            <ToggleGroup
              type="multiple"
              label="Tamanhos"
              value={sizes}
              onChange={setSizes}
              items={SIZES.map((size) => ({ value: size, label: size, disabled: size === '39' }))}
            />
          </div>
          <div className={p.optionGroup}>
            <span className={p.optionLabel}>
              Cor <span key={colorway} className={p.statusLabel}>{colorwayOf(colorway).label}</span>
            </span>
            <Swatches value={colorway} onChange={setColorway} />
          </div>
          <div className={p.ctaRow}>{cta}</div>
        </div>
        <div className={p.productDesc}>
          <h4 className={p.descTitle}>Descrição</h4>
          <ExpandableText lines={3}>
            Scarpin de bico fino em couro vegetal curtido sem cromo, com palmilha acolchoada e salto de 7 cm
            revestido. Forro em microfibra respirável e solado de borracha antiderrapante. Produzido em Franca
            (SP) em lotes de 12 pares por grade, com entrega em até 30 dias após a confirmação do pedido.
            Embalagem individual em caixa reciclada com a marca do lojista sob consulta.
          </ExpandableText>
        </div>
        <aside className={p.exhibitorCard} aria-label="Expositor">
          <div className={p.exhibitorCardHead}>
            <BrandMark name="Aurora Calçados" size="sm" variant="soft" decorative />
            <span className={p.exhibitorText}>
              <strong>Aurora Calçados</strong>
              <span>Expositor desde 2019</span>
            </span>
          </div>
          <ul className={p.contactList}>
            <li>
              <MapPin aria-hidden="true" />
              Pavilhão Azul · Estande B-214
            </li>
            <li>
              <Mail aria-hidden="true" />
              <TextLink href="mailto:comercial@auroracalcados.com.br" tone="text">
                comercial@auroracalcados.com.br
              </TextLink>
            </li>
            <li>
              <Phone aria-hidden="true" />
              (16) 3721-4580
            </li>
          </ul>
          <Button className={p.ctaWide} onClick={() => toast('Reunião marcada no estande B-214')}>
            Agendar reunião no estande
          </Button>
        </aside>
      </div>
      <div className={p.stickyBar}>
        <span className={p.stickyPrice}>
          <small>A partir de</small>
          <strong>{brl(189.9)}</strong>
        </span>
        <Button variant="primary" onClick={() => setQuote(true)}>
          Solicitar orçamento
        </Button>
      </div>
      <LayerPortal>
        <div className={p.contents} style={PORTAL_THEMES[theme]}>
          <QuoteDialog open={quote} onClose={() => setQuote(false)} sizes={sizes} colorway={colorway} />
        </div>
      </LayerPortal>
    </article>
  );
}

function ProdutoVitrine() {
  const [theme, setTheme] = useState('mediaon');
  return (
    <Shots>
      <Shot
        title="Em contexto"
        align="stretch"
        aside={
          <Segmented
            size="sm"
            label="Tema do portal"
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'mediaon', label: 'MediaOn' },
              { value: 'francal', label: 'Francal 2026' },
              { value: 'couro', label: 'Couro Sul' },
            ]}
          />
        }
      >
        <ProductPage theme={theme} />
      </Shot>
      <Shot title="Celular" align="center">
        <PhoneFrame height={760}>
          <div className={p.phoneScroll}>
            <ProductPage />
          </div>
        </PhoneFrame>
      </Shot>
    </Shots>
  );
}

/* ———————————————————————————————————————————————————————————————————————————
 * Planos e benefícios
 * ——————————————————————————————————————————————————————————————————————————— */

type PlanId = 'essencial' | 'destaque' | 'premium';
type Billing = 'feira' | 'anual';
const PLANS: { id: PlanId; name: string; price: number; description: string; rank: number }[] = [
  { id: 'essencial', name: 'Essencial', price: 1200, description: 'Vitrine com catálogo enxuto', rank: 0 },
  { id: 'destaque', name: 'Destaque', price: 2400, description: 'Mais alcance na home da feira', rank: 1 },
  { id: 'premium', name: 'Premium', price: 4800, description: 'Catálogo completo e atendimento dedicado', rank: 2 },
];
const BENEFITS: { label: string; values: (string | boolean)[] }[] = [
  { label: 'Produtos na vitrine', values: ['10', '50', 'Ilimitado'] },
  { label: 'Destaque na home', values: [false, true, true] },
  { label: 'Relatório de leads', values: [false, true, true] },
  { label: 'Vídeo', values: [false, false, true] },
  { label: 'Página da marca', values: [true, true, true] },
  { label: 'Suporte', values: ['E-mail', 'E-mail e chat', 'Gerente dedicado'] },
];
const RECOMMENDED: PlanId = 'destaque';
const planPrice = (price: number, billing: Billing) => (billing === 'anual' ? price * 0.85 : price);

function BenefitValue({ value }: { value: string | boolean }) {
  if (value === true) return <Check className={p.yes} aria-label="Incluído" />;
  if (value === false)
    return (
      <span className={p.no} aria-label="Não incluído">
        —
      </span>
    );
  return <span className={p.benefitText}>{value}</span>;
}

function PlanCard({
  plan,
  billing,
  current,
  unavailable = false,
  force,
  onChoose,
  benefits = false,
}: {
  plan: (typeof PLANS)[number];
  billing: Billing;
  current: boolean;
  unavailable?: boolean;
  force?: string;
  onChoose?: () => void;
  /** Celular: benefícios dentro do cartão, recolhidos. */
  benefits?: boolean;
}) {
  const index = PLANS.findIndex((item) => item.id === plan.id);
  const price = planPrice(plan.price, billing);
  const recommended = plan.id === RECOMMENDED;
  return (
    <div
      className={p.planCard}
      data-current={current || undefined}
      data-unavailable={unavailable || undefined}
      data-force={force}
    >
      <div className={p.planHead}>
        <span className={p.recommended} aria-hidden={!recommended || undefined}>
          {recommended ? 'Recomendado' : ''}
        </span>
        <strong className={p.planName}>{plan.name}</strong>
      </div>
      <div key={billing} className={p.planPrice}>
        {billing === 'anual' && !unavailable && <s className={p.planWas}>{brl(plan.price)}</s>}
        <span className={p.planNow}>
          {brl(price)}
          <small>/ feira</small>
        </span>
      </div>
      <span className={p.planDesc}>{unavailable ? 'Esgotado para Francal 2026' : plan.description}</span>
      {current ? (
        <Button icon={Check} className={p.planCta} aria-disabled data-current="">
          Plano atual
        </Button>
      ) : (
        <Button
          variant={recommended ? 'primary' : 'secondary'}
          className={p.planCta}
          disabled={unavailable}
          data-force={force?.includes('cta') ? 'hover' : undefined}
          onClick={onChoose}
        >
          {unavailable ? 'Esgotado' : `Mudar para ${plan.name}`}
        </Button>
      )}
      {benefits && (
        <Disclosure summary="Ver benefícios" className={p.planDisclosure}>
          <dl className={p.planBenefits}>
            {BENEFITS.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>
                  <BenefitValue value={row.values[index] ?? false} />
                </dd>
              </div>
            ))}
          </dl>
        </Disclosure>
      )}
    </div>
  );
}

function PlansBoard() {
  const [billing, setBilling] = useState<Billing>('feira');
  const [current, setCurrent] = useState<PlanId>('essencial');
  const [target, setTarget] = useState<PlanId | null>(null);
  const [busy, setBusy] = useState(false);
  const currentPlan = PLANS.find((plan) => plan.id === current) ?? PLANS[0]!;
  const targetPlan = PLANS.find((plan) => plan.id === target);
  const downgrade = targetPlan ? targetPlan.rank < currentPlan.rank : false;
  const segmented = (
    <Segmented
      size="sm"
      label="Cobrança"
      value={billing}
      onChange={setBilling}
      options={[
        { value: 'feira', label: 'Por feira' },
        { value: 'anual', label: 'Anual −15%' },
      ]}
    />
  );
  return (
    <section className={p.plans} aria-label="Planos da Vitrine">
      <div className={p.plansMobileHead}>{segmented}</div>
      <div className={p.plansTable} role="table" aria-label="Comparação de planos">
        <div className={p.plansRow} role="row" data-head="">
          <div className={p.plansCorner} role="columnheader">
            {segmented}
          </div>
          {PLANS.map((plan) => (
            <div key={plan.id} role="columnheader" className={p.plansCell}>
              <PlanCard plan={plan} billing={billing} current={plan.id === current} onChoose={() => setTarget(plan.id)} />
            </div>
          ))}
        </div>
        {BENEFITS.map((row) => (
          <div key={row.label} className={p.plansRow} role="row">
            <div role="rowheader" className={p.benefitLabel}>
              {row.label}
            </div>
            {row.values.map((value, index) => (
              <div key={PLANS[index]?.id ?? index} role="cell" className={p.benefitCell} data-current={PLANS[index]?.id === current || undefined}>
                <BenefitValue value={value} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className={p.plansStack}>
        {PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} billing={billing} current={plan.id === current} onChoose={() => setTarget(plan.id)} benefits />
        ))}
      </div>
      <ConfirmDialog
        open={target !== null}
        onClose={() => setTarget(null)}
        title={`Mudar para ${targetPlan?.name ?? ''}?`}
        description={
          downgrade
            ? `Produtos acima de ${targetPlan?.id === 'essencial' ? '10' : '50'} ficam ocultos na vitrine.`
            : `${brl(planPrice(targetPlan?.price ?? 0, billing))} por feira a partir de Francal 2026.`
        }
        confirmLabel={`Mudar para ${targetPlan?.name ?? ''}`}
        loading={busy}
        onConfirm={async () => {
          if (!targetPlan) return;
          setBusy(true);
          await wait(800);
          setBusy(false);
          setCurrent(targetPlan.id);
          setTarget(null);
          toast(`Plano ${targetPlan.name} ativo`, { description: 'Vale a partir de Francal 2026' });
        }}
      />
    </section>
  );
}

function Planos() {
  const [essencial, destaque, premium] = PLANS;
  return (
    <Shots>
      <Shot title="Em contexto" align="stretch">
        <PlansBoard />
      </Shot>
      <Shot title="Estados" tone="white" align="stretch">
        <States min={220}>
          <State label="Atual">
            <PlanCard plan={essencial!} billing="feira" current />
          </State>
          <State label="Recomendado">
            <PlanCard plan={destaque!} billing="feira" current={false} />
          </State>
          <State label="Hover">
            <PlanCard plan={premium!} billing="feira" current={false} force="hover cta" />
          </State>
          <State label="Indisponível">
            <PlanCard plan={premium!} billing="feira" current={false} unavailable />
          </State>
        </States>
      </Shot>
    </Shots>
  );
}

/* ———————————————————————————————————————————————————————————————————————————
 * Preferências e consentimento
 * ——————————————————————————————————————————————————————————————————————————— */

type Consent = { medicao: boolean; personalizacao: boolean };
const COOKIE_ROWS: { id: keyof Consent | 'essenciais'; title: string; caption: string }[] = [
  { id: 'essenciais', title: 'Essenciais', caption: 'Sempre ativos' },
  { id: 'medicao', title: 'Medição', caption: 'Visitas e cliques na Vitrine' },
  { id: 'personalizacao', title: 'Personalização', caption: 'Produtos sugeridos pelo histórico' },
];

function CookieRows({ value, onChange }: { value: Consent; onChange?: (next: Consent) => void }) {
  const base = useId();
  return (
    <ul className={p.cookieRows}>
      {COOKIE_ROWS.map((row) => {
        const id = `${base}-${row.id}`;
        const essential = row.id === 'essenciais';
        const checked = essential ? true : value[row.id as keyof Consent];
        return (
          <li key={row.id}>
            <span className={p.cookieText}>
              <label htmlFor={id}>{row.title}</label>
              <span id={`${id}-desc`}>{row.caption}</span>
            </span>
            <Switch
              id={id}
              label={row.title}
              hideLabel
              checked={checked}
              disabled={essential}
              describedBy={`${id}-desc`}
              onCheckedChange={(next) => {
                if (!essential) onChange?.({ ...value, [row.id]: next });
              }}
            />
          </li>
        );
      })}
    </ul>
  );
}

function ConsentBanner({
  leaving = false,
  onPrefs,
  onChoice,
  still = false,
}: {
  leaving?: boolean;
  onPrefs?: () => void;
  onChoice?: (accept: boolean) => void;
  still?: boolean;
}) {
  return (
    <div className={p.banner} data-leaving={leaving || undefined} data-still={still || undefined} role="region" aria-label="Cookies">
      <p className={p.bannerText}>
        Usamos cookies para medir visitas e melhorar a Vitrine.{' '}
        <TextLink href="#privacidade">Política de privacidade</TextLink>
      </p>
      <div className={p.bannerActions}>
        <Button variant="ghost" onClick={onPrefs}>
          Preferências
        </Button>
        <span className={p.bannerChoice}>
          <Button onClick={() => onChoice?.(false)}>Recusar</Button>
          <Button onClick={() => onChoice?.(true)}>Aceitar</Button>
        </span>
      </div>
    </div>
  );
}

function VitrineMock() {
  return (
    <div className={p.mock} aria-hidden="true">
      <div className={p.mockTop}>
        <BrandMark name="Francal 2026" size="sm" decorative />
        <strong>Vitrine Francal 2026</strong>
        <span className={p.mockSearch}>
          <Search />
          Buscar produtos
        </span>
      </div>
      <div className={p.mockBody}>
        <strong className={p.pvHeading}>Lançamentos de calçados</strong>
        <div className={p.mockGrid}>
          {PRODUCTS.slice(0, 4).map((product) => (
            <div key={product.name} className={p.pvProduct}>
              <span className={p.pvThumb}>
                <ShoeArt colorway={product.colorway} view={product.view} />
              </span>
              <span className={p.pvName}>{product.name}</span>
              <span className={p.pvPrice} data-shown="">
                {brl(product.price)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConsentDemo() {
  const [phase, setPhase] = useState<'shown' | 'leaving' | 'gone'>('shown');
  const [prefs, setPrefs] = useState(false);
  const [consent, setConsent] = useState<Consent>({ medicao: false, personalizacao: false });
  const close = (message: string) => {
    setPhase('leaving');
    window.setTimeout(() => setPhase('gone'), 160);
    toast(message);
  };
  return (
    <div className={p.consentStage}>
      <VitrineMock />
      {phase !== 'gone' && (
        <ConsentBanner
          leaving={phase === 'leaving'}
          onPrefs={() => setPrefs(true)}
          onChoice={(accept) => {
            setConsent({ medicao: accept, personalizacao: accept });
            close(accept ? 'Cookies aceitos' : 'Cookies opcionais recusados');
          }}
        />
      )}
      {phase === 'gone' && (
        <button type="button" className={p.cookieReopen} onClick={() => setPhase('shown')}>
          <Cookie aria-hidden="true" />
          Cookies
        </button>
      )}
      <Dialog
        open={prefs}
        onClose={() => setPrefs(false)}
        title="Preferências de cookies"
        footer={
          <Button
            variant="primary"
            onClick={() => {
              setPrefs(false);
              close('Preferências de cookies salvas');
            }}
          >
            Salvar preferências
          </Button>
        }
      >
        <CookieRows value={consent} onChange={setConsent} />
      </Dialog>
    </div>
  );
}

const CHANNELS = ['E-mail', 'WhatsApp', 'Push'] as const;
const TOPICS = ['Campanhas', 'Pedidos de inserção', 'Leads'] as const;
type Matrix = Record<string, boolean>;
const START_MATRIX: Matrix = {
  'Campanhas|E-mail': true,
  'Campanhas|WhatsApp': false,
  'Campanhas|Push': true,
  'Pedidos de inserção|E-mail': true,
  'Pedidos de inserção|WhatsApp': true,
  'Pedidos de inserção|Push': true,
  'Leads|E-mail': true,
  'Leads|WhatsApp': false,
  'Leads|Push': false,
};

function SaveState({ state }: { state: 'clean' | 'dirty' | 'saved' }) {
  if (state === 'dirty')
    return (
      <StatusText tone="amber" size="sm">
        Alterações não salvas
      </StatusText>
    );
  if (state === 'saved')
    return (
      <span className={p.publishedText}>
        <Check aria-hidden="true" />
        Salvo agora
      </span>
    );
  return null;
}

function Communications({
  initial = START_MATRIX,
  state: forced,
}: {
  initial?: Matrix;
  state?: 'clean' | 'dirty' | 'saved';
}) {
  const [matrix, setMatrix] = useState(initial);
  const [state, setState] = useState<'clean' | 'dirty' | 'saved'>(forced ?? 'clean');
  const [busy, setBusy] = useState(false);
  const toggle = (key: string, value: boolean) => {
    setMatrix((current) => ({ ...current, [key]: value }));
    setState('dirty');
  };
  return (
    <section className={p.comms} aria-label="Comunicações">
      <header className={p.commsHead}>
        <h4>Comunicações</h4>
        <div className={p.commsStatus}>
          <SaveState state={state} />
          {state === 'dirty' && (
            <Button
              variant="primary"
              size="sm"
              loading={busy}
              onClick={async () => {
                setBusy(true);
                await wait(700);
                setBusy(false);
                setState('saved');
                toast('Preferências salvas');
              }}
            >
              Salvar
            </Button>
          )}
        </div>
      </header>
      <div className={p.matrixScroll}>
        <table className={`${p.plain} ${p.commsTable}`}>
          <thead>
            <tr>
              <th scope="col">Avisos</th>
              {CHANNELS.map((channel) => {
                const on = TOPICS.filter((topic) => matrix[`${topic}|${channel}`]).length;
                return (
                  <th key={channel} scope="col" data-center="">
                    <Checkbox
                      label={channel}
                      checked={on === TOPICS.length}
                      indeterminate={on > 0 && on < TOPICS.length}
                      onChange={() => {
                        const value = on !== TOPICS.length;
                        setMatrix((current) => {
                          const next = { ...current };
                          TOPICS.forEach((topic) => {
                            next[`${topic}|${channel}`] = value;
                          });
                          return next;
                        });
                        setState('dirty');
                      }}
                    />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {TOPICS.map((topic) => (
              <tr key={topic}>
                <th scope="row">{topic}</th>
                {CHANNELS.map((channel) => {
                  const key = `${topic}|${channel}`;
                  return (
                    <td key={channel} data-center="">
                      <Checkbox
                        aria-label={`${topic} por ${channel}`}
                        checked={Boolean(matrix[key])}
                        onChange={(event) => toggle(key, event.target.checked)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Privacidade() {
  const [run, setRun] = useState(0);
  return (
    <Shots>
      <Shot title="Em contexto" align="stretch" pad="none" aside={<ResetButton onClick={() => setRun((n) => n + 1)} />}>
        <ConsentDemo key={run} />
      </Shot>
      <Shot title="Configurações" tone="white" align="stretch">
        <Communications />
      </Shot>
      <Shot title="Estados" tone="white" align="stretch">
        <States min={360}>
          <State label="Banner">
            <ConsentBanner still />
          </State>
          <State label="Preferências">
            <div className={p.frameFit}>
              <DialogFrame title="Preferências de cookies" footer={<Button variant="primary">Salvar preferências</Button>}>
                <CookieRows value={{ medicao: true, personalizacao: false }} />
              </DialogFrame>
            </div>
          </State>
          <State label="Salvo">
            <div className={p.savedPreview}>
              <header className={p.commsHead}>
                <h4>Comunicações</h4>
                <div className={p.commsStatus}>
                  <SaveState state="saved" />
                </div>
              </header>
              <header className={p.commsHead}>
                <h4>Comunicações</h4>
                <div className={p.commsStatus}>
                  <SaveState state="dirty" />
                  <Button variant="primary" size="sm">
                    Salvar
                  </Button>
                </div>
              </header>
            </div>
          </State>
        </States>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Registro ——————————————————————————— */

export const specimens: Record<string, ComponentType> = {
  'pedido-insercao': withToaster(PedidoInsercao),
  aprovacao: withToaster(Aprovacao),
  'preco-bonus': PrecoBonus,
  'importar-exportar': withToaster(ImportarExportar),
  membros: withToaster(Membros),
  'editor-vitrine': withToaster(EditorVitrine),
  'produto-vitrine': withToaster(ProdutoVitrine),
  planos: withToaster(Planos),
  privacidade: withToaster(Privacidade),
};
