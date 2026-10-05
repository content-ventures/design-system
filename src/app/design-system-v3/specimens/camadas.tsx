'use client';

import {
  ArrowLeft,
  ArrowRight,
  ChartColumn,
  Check,
  ChevronLeft,
  CircleAlert,
  Copy,
  Ellipsis,
  Info,
  ListFilter,
  Monitor,
  Pencil,
  Plus,
  Smartphone,
  Trash2,
  UserRound,
  Archive,
} from 'lucide-react';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import { CreatingDialog, type CreationRun } from './creating';
import {
  Avatar,
  Badge,
  BrandMark,
  Button,
  Checkbox,
  Chip,
  Count,
  DataTable,
  Dialog,
  DialogFrame,
  Field,
  IconButton,
  Menu,
  Segmented,
  Switch,
  Textarea,
  Timeline,
  Tooltip,
  type Column,
  type Tone,
} from '@content-ventures/design-system/v3';
import { BottomSheet, BottomSheetFrame } from '@content-ventures/design-system/v3/bottom-sheet';
import { ConfirmDialog, ConfirmFrame } from '@content-ventures/design-system/v3/confirm-dialog';
import { Drawer, DrawerFrame } from '@content-ventures/design-system/v3/drawer';
import { HoverCard } from '@content-ventures/design-system/v3/hover-card';
import { LinkButton, TextLink } from '@content-ventures/design-system/v3/link';
import { NumberField } from '@content-ventures/design-system/v3/number-field';
import { Popover, PopoverHeader } from '@content-ventures/design-system/v3/popover';
import { ResponsiveDialog } from '@content-ventures/design-system/v3/responsive-dialog';
import { Select } from '@content-ventures/design-system/v3/select';
import { DescriptionList } from '@content-ventures/design-system/v3/structure';
import { Toaster, toast } from '@content-ventures/design-system/v3/toast';
import toastStyles from '@content-ventures/design-system/v3/toast.module.css';
import { Shot, Shots, State } from '../stage';
import x from './camadas.module.css';

/* ——————————————————————————— Dados fictícios ——————————————————————————— */

type StatusKey = 'live' | 'approved' | 'waiting' | 'adjust' | 'paused' | 'pi' | 'cancelled';
const STATUS: Record<StatusKey, { label: string; tone: Tone; live?: boolean }> = {
  live: { label: 'Veiculando', tone: 'green', live: true },
  approved: { label: 'Aprovada', tone: 'teal' },
  waiting: { label: 'Aguardando aprovação', tone: 'violet' },
  adjust: { label: 'Ajustes solicitados', tone: 'orange' },
  paused: { label: 'Pausada', tone: 'gray' },
  pi: { label: 'Aguardando assinatura do P.I.', tone: 'amber' },
  cancelled: { label: 'Cancelado', tone: 'red' },
};

type Campaign = {
  id: number;
  name: string;
  advertiser: string;
  asset: string;
  status: StatusKey;
  budget: number;
  period: string;
  links: number;
  frequency?: number;
};

const CAMPAIGNS: Campaign[] = [
  { id: 2041, name: 'Coleção Primavera-Verão no portal', advertiser: 'Aurora Calçados', asset: 'Banner Super Topo — Portal', status: 'live', budget: 18000, period: '01/10 – 31/10', links: 10, frequency: 2.4 },
  { id: 2038, name: 'Newsletter dos expositores', advertiser: 'Estúdio Norte', asset: 'E-mail marketing dedicado', status: 'live', budget: 8000, period: '05/10 – 25/10', links: 8, frequency: 1.6 },
  { id: 2035, name: 'Convite para o estande B-214', advertiser: 'Casa Forma', asset: 'Push no app da feira', status: 'pi', budget: 3600, period: '14/10 – 17/10', links: 5 },
  { id: 2032, name: 'Destaque couro vegetal', advertiser: 'Lume Acessórios', asset: 'Banner Super Topo — Portal', status: 'waiting', budget: 9000, period: '10/10 – 30/10', links: 10 },
  { id: 2029, name: 'Retargeting de credenciados', advertiser: 'Grupo Horizonte', asset: 'Banner Super Topo — Portal', status: 'adjust', budget: 13500, period: '01/10 – 31/10', links: 10 },
  { id: 2023, name: 'Rodada de negócios — segunda edição', advertiser: 'Ateliê Sul', asset: 'Rodada de negócios', status: 'paused', budget: 3600, period: '25/09 – 17/10', links: 6, frequency: 1.8 },
  { id: 2017, name: 'Painel de LED — lançamento', advertiser: 'Bella Passo', asset: 'Painel de LED — Pavilhão Azul', status: 'approved', budget: 18000, period: '14/10 – 17/10', links: 4 },
  { id: 2011, name: 'Mapa do pavilhão patrocinado', advertiser: 'Couro Nobre', asset: 'Painel de LED — Pavilhão Azul', status: 'live', budget: 15000, period: '01/10 – 20/10', links: 6, frequency: 3.1 },
  { id: 2009, name: 'Agenda de lançamentos', advertiser: 'Pátio Couro', asset: 'Push no app da feira', status: 'live', budget: 4500, period: '16/10 – 18/10', links: 5, frequency: 1.2 },
];

/** Os cinco grupos de vínculos do ativo, como no detalhe aprovado. */
const LINK_ROWS: Record<number, number[]> = {
  10: [1, 2, 3, 1, 3],
  8: [1, 2, 2, 1, 2],
  6: [1, 2, 2, 1, 0],
  5: [1, 1, 2, 1, 0],
  4: [1, 1, 1, 1, 0],
};
const LINK_LABELS = ['Ativos', 'Canais', 'Públicos', 'Métricas', 'Bonificações'];
const linksOf = (total: number) =>
  LINK_LABELS.map((label, index) => ({ label, count: (LINK_ROWS[total] ?? LINK_ROWS[10] ?? [])[index] ?? 0 }));

const money = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

/* ——————————————————————————— Peças compartilhadas ——————————————————————————— */

/** Os avisos precisam de um Toaster na página; o catálogo pode já ter o seu. */
function EnsureToaster() {
  const [needed, setNeeded] = useState(false);
  useEffect(() => {
    const cls = toastStyles.viewport;
    setNeeded(!cls || !document.querySelector(`.${CSS.escape(cls)}`));
  }, []);
  return needed ? <Toaster /> : null;
}

/** Espera fictícia (envio, salvamento). */
function useLater() {
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);
  return (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
}

function Status({ status }: { status: StatusKey }) {
  const meta = STATUS[status];
  return (
    <Badge variant="text" tone={meta.tone} live={meta.live}>
      {meta.label}
    </Badge>
  );
}

function Meta({ items }: { items: ReactNode[] }) {
  return (
    <p className={x.meta}>
      <span className={x.metaRow}>
        {items.map((item, index) => (
          <span key={index}>{item}</span>
        ))}
      </span>
    </p>
  );
}

/** Pares rótulo → número dos vínculos (13 --muted / tabular à direita, fios finos). */
function LinksRows({ total = 10 }: { total?: number }) {
  return (
    <dl className={x.links}>
      {linksOf(total)
        .filter((row) => row.count > 0)
        .map((row) => (
        <div key={row.label}>
          <dt>{row.label}</dt>
          <dd>{row.count}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Moldura de tela de celular (390). Flutuantes dentro dela usam `contained`. */
function Phone({
  children,
  height = 720,
  className = '',
  label,
}: {
  children: ReactNode;
  height?: number | string;
  className?: string;
  label?: string;
}) {
  return (
    <div className={`${x.phone} ${className}`} style={{ height }} role={label ? 'group' : undefined} aria-label={label}>
      {children}
    </div>
  );
}

/** Erro de envio dentro do corpo do diálogo (alerta de perigo, compacto). */
function SendError() {
  return (
    <div className={x.sendError} role="alert">
      <CircleAlert aria-hidden="true" />
      <span>Não foi possível enviar. Tente de novo.</span>
    </div>
  );
}

const noop = () => undefined;

/* ——————————————————————————— Modal ——————————————————————————— */

function AdjustField({
  value,
  onChange,
  error,
  force,
  disabled,
  autoFocus,
  onSubmit,
}: {
  value: string;
  onChange?: (value: string) => void;
  error?: string;
  force?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  onSubmit?: () => void;
}) {
  return (
    <Field label="Motivo" required error={error}>
      {({ id, describedBy, invalid }) => (
        <Textarea
          id={id}
          aria-describedby={describedBy}
          invalid={invalid}
          rows={4}
          maxLength={280}
          placeholder="O que o anunciante precisa ajustar"
          value={value}
          disabled={disabled}
          data-autofocus={autoFocus || undefined}
          data-force={force}
          onChange={(event) => onChange?.(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              onSubmit?.();
            }
          }}
        />
      )}
    </Field>
  );
}

/** “Pedir ajustes”: motivo obrigatório, erro no lugar (sem botão desabilitado), envio de 600 ms. */
function useAdjustForm(onSent: (reason: string) => void, onClose: () => void) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const later = useLater();
  const submit = () => {
    if (busy) return;
    if (!text.trim()) {
      setError('Escreva o motivo.');
      document.querySelector<HTMLTextAreaElement>('[data-adjust-open] textarea')?.focus();
      return;
    }
    setBusy(true);
    later(() => {
      setBusy(false);
      onSent(text.trim());
      onClose();
    }, 600);
  };
  const reset = () => {
    setText('');
    setError(undefined);
    setBusy(false);
  };
  const footer = (
    <>
      <Button disabled={busy} onClick={onClose}>
        Cancelar
      </Button>
      <Button variant="primary" loading={busy} onClick={submit}>
        Pedir ajustes
      </Button>
    </>
  );
  const body = (
    <div data-adjust-open>
      <AdjustField
        value={text}
        error={error}
        autoFocus
        onSubmit={submit}
        onChange={(value) => {
          setText(value);
          if (error && value.trim()) setError(undefined);
        }}
      />
    </div>
  );
  return { text, busy, footer, body, reset, dirty: text.trim().length > 0 };
}

function AdjustDialog({
  open,
  onClose,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  onSent: (reason: string) => void;
}) {
  const form = useAdjustForm(onSent, onClose);
  const [was, setWas] = useState(open);
  if (was !== open) {
    setWas(open);
    if (open) form.reset();
  }
  return (
    <Dialog
      open={open}
      onClose={form.busy ? noop : onClose}
      dirty={form.dirty}
      divided={false}
      title="Pedir ajustes"
      description={ADJUST_FACTS}
      footer={form.footer}
    >
      {form.body}
    </Dialog>
  );
}

function creationRun(): CreationRun {
  return {
    kind: 'submit',
    edit: false,
    resent: false,
    isPackage: false,
    name: 'Coleção Primavera-Verão 2027',
    facts: [money(18000), '05/10 – 31/10', 'Aurora Calçados'],
    commit: () => 'cmp-3017',
  };
}

function DetailHeader({
  status,
  onAdjust,
  onApprove,
}: {
  status: StatusKey;
  onAdjust: () => void;
  onApprove: () => void;
}) {
  return (
    <div className={x.detailHead}>
      <div className={x.detailTitles}>
        <div className={x.titleRow}>
          <h4 className={x.pageTitle}>Retargeting de credenciados</h4>
          <Status status={status} />
        </div>
        <Meta items={['#2029', 'Grupo Horizonte', 'Banner Super Topo — Portal', '01/10 – 31/10']} />
      </div>
      <div className={x.detailActions}>
        <Button onClick={onAdjust}>Pedir ajustes</Button>
        <Button variant="primary" onClick={onApprove}>
          Aprovar e gerar P.I.
        </Button>
      </div>
    </div>
  );
}

function CreationBar({ onSend }: { onSend: () => void }) {
  return (
    <div className={x.creationBar}>
      <span className={x.creationStep}>Etapa 6 de 6</span>
      <div className={x.creationActions}>
        <Button variant="ghost">Cancelar</Button>
        <Button variant="ghost">Salvar rascunho</Button>
        <Button icon={ArrowLeft}>Voltar</Button>
        <Button variant="primary" className={x.mainAction} onClick={onSend}>
          Enviar para aprovação
        </Button>
      </div>
    </div>
  );
}

const CHANNEL_SPLIT = [
  { name: 'Portal da feira', share: 50 },
  { name: 'App Francal', share: 30 },
  { name: 'E-mail Francal', share: 20 },
];

function SplitRows() {
  return (
    <div className={x.splitRows}>
      {CHANNEL_SPLIT.map((row) => (
        <div key={row.name} className={x.splitRow}>
          <span className={x.splitName}>{row.name}</span>
          <NumberField
            value={row.share}
            onChange={noop}
            min={0}
            max={100}
            suffix="%"
            size="sm"
            label={`Parcela de ${row.name}`}
            className={x.splitInput}
          />
          <span className={x.splitValue}>{money((13500 * row.share) / 100)}</span>
        </div>
      ))}
    </div>
  );
}

function adjustFooter(opts: { busy?: boolean } = {}) {
  return (
    <>
      <Button disabled={opts.busy}>Cancelar</Button>
      <Button variant="primary" loading={opts.busy}>
        Pedir ajustes
      </Button>
    </>
  );
}

const ADJUST_FACTS = 'Retargeting de credenciados\u00a0·\u00a0#2029';
const FILLED = 'A peça 970 × 250 está com o logotipo cortado. Ajuste o respiro e reenvie.';

function ModalSpecimen() {
  const [status, setStatus] = useState<StatusKey>('waiting');
  const [adjust, setAdjust] = useState(false);
  const [approve, setApprove] = useState(false);
  const [run, setRun] = useState<CreationRun | null>(null);
  const reset = () => setStatus('waiting');
  return (
    <Shots>
      <EnsureToaster />
      <Shot title="Em contexto" align="stretch">
        <div className={x.stack}>
          <section className={x.panel}>
            <DetailHeader status={status} onAdjust={() => setAdjust(true)} onApprove={() => setApprove(true)} />
          </section>
          <section className={`${x.panel} ${x.barPanel}`}>
            <CreationBar onSend={() => setRun(creationRun())} />
          </section>
        </div>
        <AdjustDialog
          open={adjust}
          onClose={() => setAdjust(false)}
          onSent={() => {
            setStatus('adjust');
            toast('Ajustes pedidos', {
              description: 'Retargeting de credenciados',
              action: { label: 'Desfazer', onClick: reset },
            });
          }}
        />
        <ConfirmDialog
          open={approve}
          onClose={() => setApprove(false)}
          title="Aprovar e gerar P.I.?"
          description="Reserva o estoque do período."
          confirmLabel="Aprovar e gerar P.I."
          onConfirm={() =>
            new Promise<void>((resolve) =>
              window.setTimeout(() => {
                setStatus('pi');
                toast('P.I. 2026-0412 gerado', { action: { label: 'Desfazer', onClick: reset } });
                resolve();
              }, 600),
            )
          }
        />
        <CreatingDialog run={run} onView={() => setRun(null)} onRestart={() => setRun(null)} onList={() => setRun(null)} />
      </Shot>

      <Shot title="Tamanhos" align="stretch">
        <div className={x.sizes}>
          <figure className={x.figure}>
            <DialogFrame
              size="sm"
              divided={false}
              title="Iniciar veiculação?"
              description="A campanha entra no ar agora."
              footer={
                <>
                  <Button>Cancelar</Button>
                  <Button variant="primary">Iniciar veiculação</Button>
                </>
              }
            />
            <figcaption>sm · 400</figcaption>
          </figure>
          <figure className={x.figure}>
            <DialogFrame
              size="md"
              divided={false}
              title="Pedir ajustes"
              description={ADJUST_FACTS}
              footer={adjustFooter()}
            >
              <AdjustField value="" />
            </DialogFrame>
            <figcaption>md · 480</figcaption>
          </figure>
          <figure className={x.figure}>
            <DialogFrame
              size="lg"
              title="Distribuição por canal"
              description={`Banner Super Topo — Portal\u00a0·\u00a0${money(13500)}`}
              footer={
                <>
                  <Button>Cancelar</Button>
                  <Button variant="primary">Salvar distribuição</Button>
                </>
              }
            >
              <SplitRows />
            </DialogFrame>
            <figcaption>lg · 640</figcaption>
          </figure>
        </div>
      </Shot>

      <Shot title="Estados" align="stretch">
        <div className={x.stateGrid}>
          <figure className={x.figure}>
            <DialogFrame divided={false} title="Pedir ajustes" description={ADJUST_FACTS} footer={adjustFooter()} width="100%">
              <AdjustField value="" force="focus" />
            </DialogFrame>
            <figcaption>Aberto</figcaption>
          </figure>
          <figure className={x.figure}>
            <DialogFrame divided={false} title="Pedir ajustes" description={ADJUST_FACTS} footer={adjustFooter()} width="100%">
              <AdjustField value="" error="Escreva o motivo." force="focus" />
            </DialogFrame>
            <figcaption>Sem motivo</figcaption>
          </figure>
          <figure className={x.figure}>
            <DialogFrame divided={false} title="Pedir ajustes" description={ADJUST_FACTS} footer={adjustFooter()} width="100%">
              <AdjustField value={FILLED} />
            </DialogFrame>
            <figcaption>Com dados</figcaption>
          </figure>
          <figure className={x.figure}>
            <DialogFrame divided={false} title="Pedir ajustes" description={ADJUST_FACTS} footer={adjustFooter({ busy: true })} width="100%">
              <AdjustField value={FILLED} disabled />
            </DialogFrame>
            <figcaption>Enviando</figcaption>
          </figure>
          <figure className={x.figure}>
            <DialogFrame divided={false} title="Pedir ajustes" description={ADJUST_FACTS} footer={adjustFooter()} width="100%">
              <div className={x.formStack}>
                <SendError />
                <AdjustField value={FILLED} />
              </div>
            </DialogFrame>
            <figcaption>Erro no envio</figcaption>
          </figure>
        </div>
      </Shot>

      <Shot title="Celular" align="center">
        <Phone height={640} label="Celular, 390">
          <PhoneDetail />
          <div className={x.phoneScrim} />
          <div className={x.phoneCenter}>
            <DialogFrame compact divided={false} title="Pedir ajustes" description={ADJUST_FACTS} footer={adjustFooter()}>
              <AdjustField value="" force="focus" />
            </DialogFrame>
          </div>
        </Phone>
      </Shot>
    </Shots>
  );
}

/** Tela de detalhe simplificada, atrás do véu no celular. */
function PhoneDetail() {
  return (
    <div className={x.phoneScreen} aria-hidden="true" inert>
      <div className={x.phoneBar}>
        <ChevronLeft aria-hidden="true" />
        <span>Campanhas</span>
      </div>
      <div className={x.phoneBody}>
        <h4 className={x.phoneTitle}>Retargeting de credenciados</h4>
        <Status status="waiting" />
        <Meta items={['#2029', 'Grupo Horizonte']} />
        <DescriptionList
          items={[
            { label: 'Ativo', value: 'Banner Super Topo — Portal' },
            { label: 'Verba', value: money(13500) },
            { label: 'Período', value: '01/10 – 31/10' },
            { label: 'Canais', value: 'Portal da feira, App Francal' },
          ]}
        />
      </div>
    </div>
  );
}

/* ——————————————————————————— Confirmação ——————————————————————————— */

type ConfirmKind = 'start' | 'delete' | 'cancel-pi' | 'approve';

const SELECTED = [CAMPAIGNS[0]!, CAMPAIGNS[2]!, CAMPAIGNS[3]!];

function ConfirmacaoSpecimen() {
  const [open, setOpen] = useState<ConfirmKind | null>(null);
  const [live, setLive] = useState(false);
  const [rows, setRows] = useState(SELECTED);
  const [pi, setPi] = useState<'signed' | 'cancelled'>('signed');
  const [approved, setApproved] = useState(false);
  const close = () => setOpen(null);
  const wait = (fn: () => void) =>
    new Promise<void>((resolve) =>
      window.setTimeout(() => {
        fn();
        resolve();
      }, 600),
    );
  const deletable = rows.filter((row) => row.status !== 'live');
  const skipped = rows.length - deletable.length;

  return (
    <Shots>
      <EnsureToaster />
      <Shot title="Em contexto" align="stretch">
        <div className={x.confirmGrid}>
          <figure className={x.figure}>
            <div className={`${x.panel} ${x.confirmCard}`}>
              <div className={x.rowLine}>
                <BrandMark name="Bella Passo" size="xs" variant="soft" decorative />
                <div className={x.rowText}>
                  <strong>Painel de LED — lançamento</strong>
                  <Meta items={['Bella Passo', '14/10 – 17/10']} />
                </div>
                <Status status={live ? 'live' : 'approved'} />
                <Switch
                  size="sm"
                  hideLabel
                  label="Veiculação de Painel de LED — lançamento"
                  checked={live}
                  onCheckedChange={(checked) => {
                    if (checked) setOpen('start');
                    else setLive(false);
                  }}
                />
              </div>
            </div>
            <figcaption>Padrão</figcaption>
          </figure>
          <figure className={x.figure}>
            <div className={`${x.panel} ${x.confirmCard}`}>
              <div className={x.selectionBar}>
                <span className={x.selectionCount}>
                  <Count tone="solid">{rows.length}</Count> selecionadas
                </span>
                <Button size="sm" variant="danger-soft" icon={Trash2} disabled={!deletable.length} onClick={() => setOpen('delete')}>
                  Excluir
                </Button>
              </div>
              <ul className={x.miniList}>
                {rows.map((row) => (
                  <li key={row.id}>
                    <Checkbox checked readOnly aria-label={`Selecionar ${row.name}`} />
                    <span className={x.miniName}>{row.name}</span>
                    <Status status={row.status} />
                  </li>
                ))}
                {!rows.length && <li className={x.miniEmpty}>Nenhuma selecionada</li>}
              </ul>
            </div>
            <figcaption>Destrutiva</figcaption>
          </figure>
          <figure className={x.figure}>
            <div className={`${x.panel} ${x.confirmCard}`}>
              <div className={x.rowLine}>
                <div className={x.rowText}>
                  <strong>P.I. 2026-0400</strong>
                  <Meta items={['Aurora Calçados', money(18000)]} />
                </div>
                <Badge variant="text" tone={pi === 'signed' ? 'green' : 'red'}>
                  {pi === 'signed' ? 'Assinado' : 'Cancelado'}
                </Badge>
                <Button size="sm" variant="danger-soft" disabled={pi === 'cancelled'} onClick={() => setOpen('cancel-pi')}>
                  Cancelar P.I.
                </Button>
              </div>
            </div>
            <figcaption>Com digitação</figcaption>
          </figure>
          <figure className={x.figure}>
            <div className={`${x.panel} ${x.confirmCard}`}>
              <div className={x.rowLine}>
                <div className={x.rowText}>
                  <strong>Destaque couro vegetal</strong>
                  <Meta items={['#2032', 'Lume Acessórios']} />
                </div>
                <Status status={approved ? 'pi' : 'waiting'} />
                <Button size="sm" variant="primary" disabled={approved} onClick={() => setOpen('approve')}>
                  Aprovar e gerar P.I.
                </Button>
              </div>
            </div>
            <figcaption>Padrão</figcaption>
          </figure>
        </div>

        <ConfirmDialog
          open={open === 'start'}
          onClose={close}
          title="Iniciar veiculação?"
          description="A campanha entra no ar agora."
          confirmLabel="Iniciar veiculação"
          onConfirm={() =>
            wait(() => {
              setLive(true);
              toast('Veiculação iniciada', {
                description: 'Painel de LED — lançamento',
                action: { label: 'Desfazer', onClick: () => setLive(false) },
              });
            })
          }
        />
        <ConfirmDialog
          open={open === 'delete'}
          onClose={close}
          tone="danger"
          title={`Excluir ${deletable.length} ${deletable.length === 1 ? 'campanha' : 'campanhas'}?`}
          description={skipped ? `${skipped} em veiculação fica de fora.` : undefined}
          confirmLabel={`Excluir ${deletable.length} ${deletable.length === 1 ? 'campanha' : 'campanhas'}`}
          onConfirm={() =>
            wait(() => {
              const before = rows;
              setRows(rows.filter((row) => row.status === 'live'));
              toast(`${deletable.length} campanhas excluídas`, {
                description: 'Estoque liberado.',
                action: { label: 'Desfazer', onClick: () => setRows(before) },
              });
            })
          }
        />
        <ConfirmDialog
          open={open === 'cancel-pi'}
          onClose={close}
          tone="danger"
          title="Cancelar P.I. 2026-0400?"
          description="O estoque reservado é liberado."
          confirmLabel="Cancelar P.I."
          cancelLabel="Voltar"
          typeToConfirm="2026-0400"
          onConfirm={() =>
            wait(() => {
              setPi('cancelled');
              toast('P.I. cancelado', { action: { label: 'Desfazer', onClick: () => setPi('signed') } });
            })
          }
        />
        <ConfirmDialog
          open={open === 'approve'}
          onClose={close}
          title="Aprovar e gerar P.I.?"
          description="Reserva o estoque do período."
          confirmLabel="Aprovar e gerar P.I."
          onConfirm={() =>
            wait(() => {
              setApproved(true);
              toast('P.I. 2026-0412 gerado', { action: { label: 'Desfazer', onClick: () => setApproved(false) } });
            })
          }
        />
      </Shot>

      <Shot title="Variantes" align="stretch">
        <div className={x.triple}>
          <figure className={x.figure}>
            <ConfirmFrame
              width="100%"
              title="Iniciar veiculação?"
              description="A campanha entra no ar agora."
              confirmLabel="Iniciar veiculação"
            />
            <figcaption>Padrão</figcaption>
          </figure>
          <figure className={x.figure}>
            <ConfirmFrame
              width="100%"
              tone="danger"
              title="Excluir 2 campanhas?"
              description="1 em veiculação fica de fora."
              confirmLabel="Excluir 2 campanhas"
            />
            <figcaption>Destrutiva</figcaption>
          </figure>
          <figure className={x.figure}>
            <ConfirmFrame
              width="100%"
              tone="danger"
              title="Cancelar P.I. 2026-0400?"
              description="O estoque reservado é liberado."
              confirmLabel="Cancelar P.I."
              cancelLabel="Voltar"
              typeToConfirm="2026-0400"
              typed="2026-04"
            />
            <figcaption>Com digitação</figcaption>
          </figure>
        </div>
      </Shot>

      <Shot title="Estados" align="stretch">
        <div className={x.quad}>
          <figure className={x.figure}>
            <ConfirmFrame
              width="100%"
              title="Iniciar veiculação?"
              description="A campanha entra no ar agora."
              confirmLabel="Iniciar veiculação"
              focus="confirm"
            />
            <figcaption>Foco no confirmar</figcaption>
          </figure>
          <figure className={x.figure}>
            <ConfirmFrame
              width="100%"
              tone="danger"
              title="Excluir 2 campanhas?"
              description="1 em veiculação fica de fora."
              confirmLabel="Excluir 2 campanhas"
              focus="cancel"
            />
            <figcaption>Foco em Cancelar</figcaption>
          </figure>
          <figure className={x.figure}>
            <ConfirmFrame
              width="100%"
              tone="danger"
              title="Cancelar P.I. 2026-0400?"
              description="O estoque reservado é liberado."
              confirmLabel="Cancelar P.I."
              cancelLabel="Voltar"
              typeToConfirm="2026-0400"
              typed="2026-0400"
              focus="field"
            />
            <figcaption>Código certo</figcaption>
          </figure>
          <figure className={x.figure}>
            <ConfirmFrame
              width="100%"
              tone="danger"
              title="Excluir 2 campanhas?"
              description="1 em veiculação fica de fora."
              confirmLabel="Excluir 2 campanhas"
              busy
            />
            <figcaption>Confirmando</figcaption>
          </figure>
        </div>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Gaveta ——————————————————————————— */

type Lead = {
  name: string;
  place: string;
  contact: string;
  email: string;
  phone: string;
  origin: string;
  when: string;
  interests: string[];
};

const LEADS: Lead[] = [
  {
    name: 'Sapataria Ladeira',
    place: 'Salvador, BA · Loja de calçados',
    contact: 'Juliana Prates',
    email: 'juliana@sapatarialadeira.com.br',
    phone: '(71) 98842-1937',
    origin: 'Vitrine · Coleção Primavera-Verão',
    when: 'há 2 h',
    interests: ['Calçado feminino', 'Couro legítimo', 'Pronta entrega', 'Linha conforto'],
  },
  {
    name: 'Calçados Rio Doce',
    place: 'Vitória, ES · Rede de lojas',
    contact: 'Tiago Rezende',
    email: 'tiago@riodoce.com.br',
    phone: '(27) 99613-2208',
    origin: 'Vitrine · Destaque couro vegetal',
    when: 'ontem',
    interests: ['Couro vegetal', 'Atacado'],
  },
  {
    name: 'Pé de Valsa Kids',
    place: 'Curitiba, PR · Loja infantil',
    contact: 'Clara Souto',
    email: 'clara@pedevalsa.com.br',
    phone: '(41) 98120-4471',
    origin: 'E-mail marketing dedicado',
    when: '28/09',
    interests: ['Infantil', 'Pronta entrega'],
  },
  {
    name: 'Boutique Passarela',
    place: 'Recife, PE · Multimarcas',
    contact: 'Rafael Dias',
    email: 'rafael@passarela.com.br',
    phone: '(81) 99702-5530',
    origin: 'Push no app da feira',
    when: '27/09',
    interests: ['Acessórios', 'Bolsas', 'Calçado feminino'],
  },
];

function leadActivities(lead: Lead) {
  return [
    {
      id: 'a1',
      title: 'Abriu o e-mail “Lançamentos de verão”',
      date: lead.when,
      marker: <Avatar name={lead.contact} size="xs" decorative />,
      state: 'current' as const,
    },
    {
      id: 'a2',
      title: `Visitou a vitrine`,
      description: lead.origin,
      date: '28/09',
      marker: <Avatar name={lead.contact} size="xs" decorative />,
    },
    {
      id: 'a3',
      title: 'Lead criado pela vitrine',
      date: '28/09',
      marker: <BrandMark name="Francal 2026" size="xs" variant="soft" decorative />,
    },
  ];
}

function LeadBody({ lead }: { lead: Lead }) {
  return (
    <div className={x.drawerBody}>
      <DescriptionList
        labelWidth={112}
        items={[
          { label: 'Contato', value: lead.contact, leading: <Avatar name={lead.contact} size="xs" decorative /> },
          {
            label: 'E-mail',
            value: (
              <TextLink href={`mailto:${lead.email}`} onClick={(event) => event.preventDefault()}>
                {lead.email}
              </TextLink>
            ),
            copy: lead.email,
          },
          { label: 'Telefone', value: lead.phone },
          { label: 'Origem', value: lead.origin },
        ]}
      />
      <section className={x.drawerSection}>
        <h3 className={x.sectionTitle}>Interesses</h3>
        <div className={x.chips}>
          {lead.interests.map((item) => (
            <Chip key={item} size="sm" variant="soft">
              {item}
            </Chip>
          ))}
        </div>
      </section>
      <section className={x.drawerSection}>
        <h3 className={x.sectionTitle}>Atividades</h3>
        <Timeline variant="activity" label={`Atividades de ${lead.name}`} items={leadActivities(lead)} />
      </section>
    </div>
  );
}

function LeadMenu() {
  return (
    <Menu
      label="Mais ações do lead"
      align="end"
      sections={[
        {
          items: [
            { label: 'Copiar e-mail', icon: Copy, onSelect: () => toast('E-mail copiado', { tone: 'info' }) },
            { label: 'Atribuir a mim', icon: UserRound, onSelect: () => toast('Lead atribuído a você') },
          ],
        },
        { items: [{ label: 'Arquivar lead', icon: Archive, onSelect: () => toast('Lead arquivado') }] },
      ]}
      trigger={(props) => <IconButton {...props} label="Mais ações" icon={Ellipsis} variant="ghost" size="sm" />}
    />
  );
}

type ChannelRow = { id: string; name: string; reach: string; on: boolean; share: number | null };
const CHANNELS: ChannelRow[] = [
  { id: 'portal', name: 'Portal da feira', reach: '≈ 120.000 visitas', on: true, share: 50 },
  { id: 'app', name: 'App Francal', reach: '≈ 48.000 usuários', on: true, share: 50 },
  { id: 'email', name: 'E-mail Francal', reach: '≈ 32.000 contatos', on: false, share: null },
  { id: 'led', name: 'Painel de LED — Pavilhão Azul', reach: '≈ 9.000 por dia', on: false, share: null },
];

function ChannelForm({
  rows,
  onChange,
  disabled,
}: {
  rows: ChannelRow[];
  onChange?: (rows: ChannelRow[]) => void;
  disabled?: boolean;
}) {
  const total = rows.reduce((sum, row) => sum + (row.on ? (row.share ?? 0) : 0), 0);
  const update = (id: string, patch: Partial<ChannelRow>) =>
    onChange?.(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  return (
    <div className={x.channelForm}>
      {rows.map((row) => (
        <div key={row.id} className={x.channelRow} data-on={row.on || undefined}>
          <Checkbox
            label={row.name}
            description={row.reach}
            checked={row.on}
            disabled={disabled}
            onChange={(event) =>
              update(row.id, { on: event.target.checked, share: event.target.checked ? (row.share ?? 0) : null })
            }
          />
          <NumberField
            value={row.on ? row.share : null}
            onChange={(value) => update(row.id, { share: value })}
            min={0}
            max={100}
            suffix="%"
            size="sm"
            disabled={!row.on || disabled}
            placeholder="—"
            label={`Parcela de ${row.name}`}
            className={x.shareInput}
          />
        </div>
      ))}
      <div className={x.channelTotal} data-off={total !== 100 || undefined}>
        <span>Total</span>
        <strong>{total}%</strong>
      </div>
    </div>
  );
}

const sameChannels = (a: ChannelRow[], b: ChannelRow[]) =>
  a.every((row, index) => row.on === b[index]?.on && (row.share ?? 0) === (b[index]?.share ?? 0));

function UnsavedNote() {
  return (
    <span className={x.unsaved}>
      <i aria-hidden="true" />
      Alterações não salvas
    </span>
  );
}

function DrawerSpecimen() {
  const [lead, setLead] = useState<Lead | null>(null);
  const [won, setWon] = useState<Record<string, 'saving' | 'won'>>({});
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(CHANNELS);
  const [draft, setDraft] = useState(CHANNELS);
  const [saving, setSaving] = useState(false);
  const later = useLater();
  const dirty = !sameChannels(draft, saved);
  const shown = lead ?? LEADS[0]!;
  const wonState = won[shown.name];

  return (
    <Shots>
      <EnsureToaster />
      <Shot title="Em contexto" align="stretch">
        <div className={x.drawerContext}>
          <section className={x.panel}>
            <header className={x.panelHead}>
              <h4 className={x.panelTitle}>Leads</h4>
              <Count>{LEADS.length}</Count>
            </header>
            <ul className={x.leadList}>
              {LEADS.map((item) => (
                <li key={item.name}>
                  <button
                    type="button"
                    className={x.leadRow}
                    aria-haspopup="dialog"
                    data-current={lead?.name === item.name || undefined}
                    onClick={() => setLead(item)}
                  >
                    <BrandMark name={item.name} size="sm" variant="soft" decorative />
                    <span className={x.rowText}>
                      <strong>{item.name}</strong>
                      <span>{item.place}</span>
                    </span>
                    <span className={x.leadOrigin}>{item.origin.split(' · ')[0]}</span>
                    <span className={x.leadWhen}>{won[item.name] === 'won' ? <Badge variant="text" tone="green">Ganho</Badge> : item.when}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section className={x.panel}>
            <header className={x.panelHead}>
              <h4 className={x.panelTitle}>Canais</h4>
              <LinkButton onClick={() => {
                setDraft(saved);
                setEditing(true);
              }}>Editar</LinkButton>
            </header>
            <dl className={x.links}>
              {saved
                .filter((row) => row.on)
                .map((row) => (
                  <div key={row.id}>
                    <dt>{row.name}</dt>
                    <dd>{row.share ?? 0}%</dd>
                  </div>
                ))}
            </dl>
          </section>
        </div>

        <Drawer
          open={lead !== null}
          onClose={() => setLead(null)}
          size="md"
          leading={<BrandMark name={shown.name} size="md" />}
          title={shown.name}
          description={shown.place}
          actions={<LeadMenu />}
          toolbar={
            wonState === 'won' ? (
              <Badge variant="soft" tone="green" icon={Check}>
                Ganho
              </Badge>
            ) : (
              <Button
                size="sm"
                icon={Check}
                loading={wonState === 'saving'}
                onClick={() => {
                  const name = shown.name;
                  setWon((current) => ({ ...current, [name]: 'saving' }));
                  later(() => {
                    setWon((current) => ({ ...current, [name]: 'won' }));
                    toast('Lead marcado como ganho', {
                      description: name,
                      action: {
                        label: 'Desfazer',
                        onClick: () =>
                          setWon((current) => {
                            const next = { ...current };
                            delete next[name];
                            return next;
                          }),
                      },
                    });
                  }, 600);
                }}
              >
                Marcar como ganho
              </Button>
            )
          }
          footer={
            <Button variant="primary" icon={Plus} onClick={() => toast('Atividade registrada', { description: shown.name })}>
              Registrar atividade
            </Button>
          }
        >
          <LeadBody lead={shown} />
        </Drawer>

        <Drawer
          open={editing}
          onClose={() => !saving && setEditing(false)}
          dismissible={!dirty}
          size="md"
          title="Editar canais"
          description={ADJUST_FACTS}
          footerStart={dirty ? <UnsavedNote /> : undefined}
          footer={
            <>
              <Button disabled={saving} onClick={() => setEditing(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                loading={saving}
                onClick={() => {
                  setSaving(true);
                  later(() => {
                    setSaving(false);
                    setSaved(draft);
                    setEditing(false);
                    toast('Canais atualizados', { description: 'Retargeting de credenciados' });
                  }, 600);
                }}
              >
                Salvar alterações
              </Button>
            </>
          }
        >
          <ChannelForm rows={draft} onChange={setDraft} disabled={saving} />
        </Drawer>
      </Shot>

      <Shot title="Molduras" align="stretch" pad="sm">
        <div className={x.drawerPair}>
          <LeadFrame height={640} />
          <EditFrame height={640} />
        </div>
      </Shot>

      <Shot title="Estados" align="stretch" pad="sm">
        <div className={x.drawerPair}>
          <figure className={x.figure}>
            <LeadFrame height={480} />
            <figcaption>Aberto</figcaption>
          </figure>
          <figure className={x.figure}>
            <LeadFrame height={480} scrollTop={170} />
            <figcaption>Rolado</figcaption>
          </figure>
          <figure className={x.figure}>
            <EditFrame height={480} rows={EDITED} saving />
            <figcaption>Salvando</figcaption>
          </figure>
          <figure className={x.figure}>
            <EditFrame height={480} rows={EDITED} />
            <figcaption>Com alterações</figcaption>
          </figure>
        </div>
      </Shot>

      <Shot title="Celular" align="center">
        <Phone height={720} label="Celular, 390">
          <DrawerFrame
            fullscreen
            height="100%"
            leading={<BrandMark name={LEADS[0]!.name} size="md" />}
            title={LEADS[0]!.name}
            description={LEADS[0]!.place}
            actions={<IconButton label="Mais ações" icon={Ellipsis} variant="ghost" size="sm" />}
            toolbar={
              <Button size="sm" icon={Check}>
                Marcar como ganho
              </Button>
            }
            footer={
              <Button variant="primary" icon={Plus} className={x.grow}>
                Registrar atividade
              </Button>
            }
          >
            <LeadBody lead={LEADS[0]!} />
          </DrawerFrame>
        </Phone>
      </Shot>
    </Shots>
  );
}

const EDITED: ChannelRow[] = CHANNELS.map((row) =>
  row.id === 'portal' ? { ...row, share: 40 } : row.id === 'email' ? { ...row, on: true, share: 10 } : row,
);

function LeadFrame({ height, scrollTop }: { height: number; scrollTop?: number }) {
  const lead = LEADS[0]!;
  return (
    <DrawerFrame
      height={height}
      scrollTop={scrollTop}
      leading={<BrandMark name={lead.name} size="md" />}
      title={lead.name}
      description={lead.place}
      actions={<IconButton label="Mais ações" icon={Ellipsis} variant="ghost" size="sm" />}
      toolbar={
        <Button size="sm" icon={Check}>
          Marcar como ganho
        </Button>
      }
      footer={
        <Button variant="primary" icon={Plus}>
          Registrar atividade
        </Button>
      }
    >
      <LeadBody lead={lead} />
    </DrawerFrame>
  );
}

function EditFrame({ height, rows = CHANNELS, saving = false }: { height: number; rows?: ChannelRow[]; saving?: boolean }) {
  const dirty = !sameChannels(rows, CHANNELS);
  return (
    <DrawerFrame
      height={height}
      title="Editar canais"
      description={ADJUST_FACTS}
      footerStart={dirty ? <UnsavedNote /> : undefined}
      footer={
        <>
          <Button disabled={saving}>Cancelar</Button>
          <Button variant="primary" loading={saving}>
            Salvar alterações
          </Button>
        </>
      }
    >
      <ChannelForm rows={rows} disabled={saving} />
    </DrawerFrame>
  );
}

/* ——————————————————————————— Bottom sheet ——————————————————————————— */

type SheetKind = 'actions' | 'filters' | 'links';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'live', label: 'Veiculando' },
  { value: 'approved', label: 'Aprovada' },
  { value: 'waiting', label: 'Aguardando aprovação' },
  { value: 'adjust', label: 'Ajustes solicitados' },
  { value: 'pi', label: 'Aguardando assinatura do P.I.' },
  { value: 'paused', label: 'Pausada' },
];
const ADVERTISER_OPTIONS = [
  { value: '', label: 'Todos os anunciantes' },
  ...Array.from(new Set(CAMPAIGNS.map((campaign) => campaign.advertiser))).map((name) => ({
    value: name,
    label: name,
    leading: <BrandMark name={name} size="xs" variant="soft" decorative />,
  })),
];
type Period = 'todos' | 'outubro' | 'setembro';
const PERIODS: { value: Period; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'setembro', label: 'Setembro' },
  { value: 'outubro', label: 'Outubro' },
];

type Filters = { status: string; advertiser: string; period: Period };
const NO_FILTERS: Filters = { status: '', advertiser: '', period: 'todos' };
const matchFilters = (campaign: Campaign, filters: Filters) =>
  (!filters.status || campaign.status === filters.status) &&
  (!filters.advertiser || campaign.advertiser === filters.advertiser) &&
  (filters.period === 'todos' ||
    (filters.period === 'setembro' ? campaign.period.includes('/09') : campaign.period.includes('/10')));

function FiltersForm({ value, onChange }: { value: Filters; onChange?: (value: Filters) => void }) {
  return (
    <div className={x.filtersForm}>
      <Field label="Status">
        {({ id, describedBy }) => (
          <Select
            id={id}
            describedBy={describedBy}
            value={value.status}
            onChange={(status) => onChange?.({ ...value, status })}
            options={STATUS_OPTIONS}
          />
        )}
      </Field>
      <Field label="Anunciante">
        {({ id, describedBy }) => (
          <Select
            id={id}
            describedBy={describedBy}
            value={value.advertiser}
            onChange={(advertiser) => onChange?.({ ...value, advertiser })}
            options={ADVERTISER_OPTIONS}
          />
        )}
      </Field>
      <div className={x.fieldLike}>
        <span className={x.fieldLabel}>Período</span>
        <Segmented
          label="Período"
          full
          options={PERIODS}
          value={value.period}
          onChange={(period) => onChange?.({ ...value, period })}
        />
      </div>
    </div>
  );
}

const SHEET_ACTIONS = [
  { label: 'Métricas', icon: ChartColumn },
  { label: 'Editar', icon: Pencil },
  { label: 'Duplicar', icon: Copy },
  { label: 'Excluir', icon: Trash2, danger: true },
];

/** Os cinco grupos de vínculos em etiquetas, como no cartão do celular aprovado. */
const LINK_GROUPS: { label: string; items: string[] }[] = [
  { label: 'Ativos', items: ['Banner Super Topo — Portal'] },
  { label: 'Canais', items: ['Portal da feira', 'App Francal'] },
  { label: 'Públicos', items: ['Visitantes credenciados', 'Lojistas e compradores', 'Expositores 2025'] },
  { label: 'Métricas', items: ['Impressões'] },
  { label: 'Bonificações', items: ['Destaque na vitrine', 'Post no Instagram oficial', 'Push de lembrete'] },
];

function LinkGroups() {
  return (
    <div className={x.linkGroups}>
      {LINK_GROUPS.map((group) => (
        <div key={group.label} className={x.linkGroup}>
          <span>
            {group.label} <em>{group.items.length}</em>
          </span>
          <div className={x.chips}>
            {group.items.map((item) => (
              <Chip key={item} size="sm" variant="soft">
                {item}
              </Chip>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ActionList({ onPick, force }: { onPick?: (label: string) => void; force?: string }) {
  return (
    <ul className={x.actionList}>
      {SHEET_ACTIONS.map((action, index) => (
        <li key={action.label}>
          <button
            type="button"
            className={x.actionItem}
            data-danger={action.danger || undefined}
            data-force={index === 0 ? force : undefined}
            onClick={() => onPick?.(action.label)}
          >
            <action.icon aria-hidden="true" />
            {action.label}
          </button>
        </li>
      ))}
    </ul>
  );
}

function PhoneList({
  campaigns,
  onMore,
  onLinks,
  onFilters,
  filterCount = 0,
  decorative = false,
}: {
  campaigns: Campaign[];
  onMore?: (campaign: Campaign) => void;
  onLinks?: (campaign: Campaign) => void;
  onFilters?: () => void;
  filterCount?: number;
  /** Atrás de uma folha parada (prancha): fora do foco e do leitor de tela. */
  decorative?: boolean;
}) {
  return (
    <div className={x.phoneScreen} inert={decorative} aria-hidden={decorative || undefined}>
      <div className={x.phoneHeader}>
        <h4 className={x.phoneTitle}>Campanhas</h4>
        <Button size="sm" icon={ListFilter} onClick={onFilters}>
          Filtros
          {filterCount > 0 && <Count tone="accent">{filterCount}</Count>}
        </Button>
      </div>
      <ul className={x.cardList}>
        {campaigns.map((campaign) => (
          <li key={campaign.id} className={x.campaignCard}>
            <div className={x.cardTop}>
              <strong className={x.cardName}>{campaign.name}</strong>
              <IconButton
                label={`Ações de ${campaign.name}`}
                icon={Ellipsis}
                variant="ghost"
                size="sm"
                onClick={() => onMore?.(campaign)}
              />
            </div>
            <Meta
              items={[
                campaign.period,
                <button key="links" type="button" className={x.inlineLink} onClick={() => onLinks?.(campaign)}>
                  {campaign.links} vínculos
                </button>,
              ]}
            />
            <div className={x.cardBottom}>
              <Status status={campaign.status} />
              <span className={x.cardMoney}>{money(campaign.budget)}</span>
            </div>
          </li>
        ))}
        {!campaigns.length && <li className={x.miniEmpty}>Nenhuma campanha com esses filtros</li>}
      </ul>
    </div>
  );
}

function BottomSheetSpecimen() {
  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const [target, setTarget] = useState<Campaign>(CAMPAIGNS[0]!);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [draft, setDraft] = useState<Filters>(NO_FILTERS);
  const close = () => setSheet(null);
  const list = CAMPAIGNS.filter((campaign) => matchFilters(campaign, filters));
  const preview = CAMPAIGNS.filter((campaign) => matchFilters(campaign, draft)).length;
  const active = Number(Boolean(filters.status)) + Number(Boolean(filters.advertiser)) + Number(filters.period !== 'todos');

  return (
    <Shots>
      <EnsureToaster />
      <Shot title="Em contexto" align="center">
        <Phone height={720} label="Celular, 390">
          <PhoneList
            campaigns={list}
            filterCount={active}
            onFilters={() => {
              setDraft(filters);
              setSheet('filters');
            }}
            onMore={(campaign) => {
              setTarget(campaign);
              setSheet('actions');
            }}
            onLinks={(campaign) => {
              setTarget(campaign);
              setSheet('links');
            }}
          />
          <BottomSheet
            contained
            open={sheet === 'actions'}
            onClose={close}
            title={target.name}
            description={`#${target.id} · ${target.advertiser}`}
            footer={<Button onClick={close}>Cancelar</Button>}
          >
            <ActionList
              onPick={(label) => {
                close();
                toast(
                  label === 'Excluir' ? 'Campanha excluída' : label === 'Duplicar' ? 'Campanha duplicada' : `${label}: ${target.name}`,
                  { description: label === 'Excluir' || label === 'Duplicar' ? target.name : undefined },
                );
              }}
            />
          </BottomSheet>
          <BottomSheet
            contained
            snap="half"
            open={sheet === 'filters'}
            onClose={close}
            title="Filtros"
            footer={
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDraft(NO_FILTERS);
                  }}
                >
                  Limpar filtros
                </Button>
                <Button
                  variant="primary"
                  disabled={!preview}
                  onClick={() => {
                    setFilters(draft);
                    close();
                  }}
                >
                  {preview ? `Ver ${preview} ${preview === 1 ? 'campanha' : 'campanhas'}` : 'Nenhuma campanha'}
                </Button>
              </>
            }
          >
            <FiltersForm value={draft} onChange={setDraft} />
          </BottomSheet>
          <BottomSheet
            contained
            open={sheet === 'links'}
            onClose={close}
            title="Vínculos do ativo"
            description={target.asset}
          >
            <LinksRows total={target.links} />
          </BottomSheet>
        </Phone>
      </Shot>

      <Shot title="Estados" align="stretch" pad="sm">
        <div className={x.sheetStates}>
          <figure className={x.figure}>
            <Phone height={540} className={x.phoneSm}>
              <PhoneList campaigns={CAMPAIGNS} decorative />
              <BottomSheetFrame snap="half" title="Filtros" footer={<Button variant="primary">Ver 9 campanhas</Button>}>
                <FiltersForm value={NO_FILTERS} />
              </BottomSheetFrame>
            </Phone>
            <figcaption>Meia altura</figcaption>
          </figure>
          <figure className={x.figure}>
            <Phone height={540} className={x.phoneSm}>
              <PhoneList campaigns={CAMPAIGNS} decorative />
              <BottomSheetFrame snap="half" expanded title="Filtros" footer={<Button variant="primary">Ver 9 campanhas</Button>}>
                <FiltersForm value={NO_FILTERS} />
              </BottomSheetFrame>
            </Phone>
            <figcaption>Altura total</figcaption>
          </figure>
          <figure className={x.figure}>
            <Phone height={540} className={x.phoneSm}>
              <PhoneList campaigns={CAMPAIGNS} decorative />
              <BottomSheetFrame
                drag={64}
                title={CAMPAIGNS[0]!.name}
                description={`#2041 · ${CAMPAIGNS[0]!.advertiser}`}
                footer={<Button>Cancelar</Button>}
              >
                <ActionList />
              </BottomSheetFrame>
            </Phone>
            <figcaption>Arrastando</figcaption>
          </figure>
          <figure className={x.figure}>
            <Phone height={540} className={x.phoneSm}>
              <PhoneList campaigns={CAMPAIGNS} decorative />
              <BottomSheetFrame snap="half" title="10 vínculos" description={CAMPAIGNS[0]!.name} scrollTop={96}>
                <LinkGroups />
              </BottomSheetFrame>
            </Phone>
            <figcaption>Rolado</figcaption>
          </figure>
        </div>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Diálogo responsivo ——————————————————————————— */

type Device = 'desktop' | 'celular';

/** Detalhe da campanha resumido: o que fica atrás da camada no palco do diálogo responsivo. */
function DetailScreen({
  phone = false,
  onAdjust,
  onLinks,
}: {
  phone?: boolean;
  onAdjust?: () => void;
  onLinks?: () => void;
}) {
  return (
    <div className={x.deviceScreen} data-phone={phone || undefined}>
      <div className={x.deviceHead}>
        <div className={x.detailTitles}>
          <div className={x.titleRow}>
            <h4 className={x.deviceTitle}>Retargeting de credenciados</h4>
            <Status status="waiting" />
          </div>
          <Meta items={['#2029', 'Grupo Horizonte', '01/10 – 31/10']} />
        </div>
        <div className={x.deviceActions}>
          <Button onClick={onAdjust}>Pedir ajustes</Button>
          <Button variant="primary">Aprovar e gerar P.I.</Button>
        </div>
      </div>
      <div className={x.deviceGrid}>
        <section className={x.deviceMain}>
          <h5 className={x.sectionTitle}>Configuração</h5>
          <DescriptionList
            labelWidth={phone ? 92 : 128}
            items={[
              { label: 'Ativo', value: 'Banner Super Topo — Portal' },
              { label: 'Verba', value: money(13500) },
              { label: 'Período', value: '01/10/2026 – 31/10/2026' },
              { label: 'Canais', value: 'Portal da feira, App Francal' },
            ]}
          />
        </section>
        <section className={x.deviceAside}>
          <h5 className={x.sectionTitle}>Vínculos do ativo</h5>
          <p className={x.asideFigure}>
            10 <span>em 5 grupos</span>
          </p>
          <Button size="sm" onClick={onLinks}>
            Ver vínculos
          </Button>
        </section>
      </div>
    </div>
  );
}

function DialogoResponsivoSpecimen() {
  const [device, setDevice] = useState<Device>('desktop');
  const [open, setOpen] = useState<'links' | 'adjust' | null>(null);
  const close = () => setOpen(null);
  const form = useAdjustForm(
    () =>
      toast('Ajustes pedidos', {
        description: 'Retargeting de credenciados',
      }),
    close,
  );
  const variant = device === 'celular' ? 'sheet' : 'dialog';
  return (
    <Shots>
      <EnsureToaster />
      <Shot
        title="Em contexto"
        align="center"
        aside={
          <Segmented
            label="Largura da tela"
            size="sm"
            value={device}
            onChange={setDevice}
            options={[
              { value: 'desktop', label: 'Desktop', icon: Monitor },
              { value: 'celular', label: 'Celular', icon: Smartphone },
            ]}
          />
        }
      >
        <div className={x.device} data-device={device}>
          <DetailScreen
            phone={device === 'celular'}
            onAdjust={() => {
              form.reset();
              setOpen('adjust');
            }}
            onLinks={() => setOpen('links')}
          />
          <ResponsiveDialog
            contained
            variant={variant}
            open={open === 'links'}
            onClose={close}
            size="sm"
            title="Vínculos do ativo"
            description="Banner Super Topo — Portal"
          >
            <LinksRows />
          </ResponsiveDialog>
          <ResponsiveDialog
            contained
            variant={variant}
            open={open === 'adjust'}
            onClose={form.busy ? noop : close}
            dirty={form.dirty}
            title="Pedir ajustes"
            description={ADJUST_FACTS}
            footer={form.footer}
          >
            {form.body}
          </ResponsiveDialog>
        </div>
      </Shot>

      <Shot title="Lado a lado" align="stretch">
        <div className={x.sideBySide}>
          <figure className={x.figure}>
            <div className={x.desktopStage}>
              <div className={x.desktopBg} aria-hidden="true" inert>
                <DetailScreen />
              </div>
              <div className={x.phoneScrim} />
              <DialogFrame
                size="md"
                className={x.desktopDialog}
                divided={false}
                title="Pedir ajustes"
                description={ADJUST_FACTS}
                footer={adjustFooter()}
              >
                <AdjustField value="" />
              </DialogFrame>
            </div>
            <figcaption>Acima de 640 · diálogo</figcaption>
          </figure>
          <figure className={x.figure}>
            <Phone height={560} className={x.phoneMd}>
              <PhoneDetail />
              <BottomSheetFrame
                title="Pedir ajustes"
                description={ADJUST_FACTS}
                footer={
                  <>
                    <Button>Cancelar</Button>
                    <Button variant="primary">Pedir ajustes</Button>
                  </>
                }
              >
                <AdjustField value="" />
              </BottomSheetFrame>
            </Phone>
            <figcaption>Até 640 · folha</figcaption>
          </figure>
        </div>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Popover ——————————————————————————— */

function LinksPanel({ campaign }: { campaign: Campaign }) {
  return (
    <>
      <PopoverHeader title="Vínculos do ativo" meta={campaign.links} />
      <LinksRows total={campaign.links} />
    </>
  );
}

function LinksTrigger({
  campaign,
  pinned,
  side = 'bottom',
  row = false,
}: {
  campaign: Campaign;
  pinned?: boolean;
  side?: 'top' | 'bottom';
  /** Prancha: o número dentro de uma linha da tabela (nome à esquerda). */
  row?: boolean;
}) {
  return (
    <Popover
      label={`Vínculos de ${campaign.name}`}
      width={280}
      align="end"
      side={side}
      pinned={pinned}
      trigger={(props) => {
        const button = (
          <button {...props} type="button" className={x.linksButton} aria-label={`${campaign.links} vínculos`}>
            {campaign.links}
          </button>
        );
        return row ? <MiniRow name={campaign.name}>{button}</MiniRow> : button;
      }}
    >
      <LinksPanel campaign={campaign} />
    </Popover>
  );
}

/** Linha de tabela resumida, para as pranchas de estado. */
function MiniRow({ name, children }: { name: string; children: ReactNode }) {
  return (
    <span className={x.miniRow}>
      <span className={x.miniRowName}>{name}</span>
      {children}
    </span>
  );
}

function WindowPanel() {
  return (
    <>
      <PopoverHeader title="Janela do ativo" />
      <dl className={x.links}>
        <div>
          <dt>Disponível</dt>
          <dd>01/10 – 31/10</dd>
        </div>
        <div>
          <dt>Campanha</dt>
          <dd>05/10 – 31/10</dd>
        </div>
      </dl>
      <div className={x.coverage}>
        <div className={x.coverageTrack} aria-hidden="true">
          <span style={{ left: `${(4 / 31) * 100}%`, right: 0 }} />
        </div>
        <span className={x.coverageNote}>27 de 31 dias</span>
      </div>
    </>
  );
}

const STATUS_FILTERS: StatusKey[] = ['live', 'approved', 'waiting', 'adjust', 'pi', 'paused'];

function StatusPanel({
  value,
  onChange,
  force,
}: {
  value: StatusKey[];
  onChange?: (value: StatusKey[]) => void;
  force?: StatusKey;
}) {
  return (
    <>
      <PopoverHeader
        title="Status"
        meta={
          value.length > 0 && onChange ? (
            <LinkButton onClick={() => onChange([])}>Limpar</LinkButton>
          ) : undefined
        }
      />
      <div className={x.statusList}>
        {STATUS_FILTERS.map((key, index) => (
          <div key={key} className={x.statusOption}>
            <Checkbox
              label={STATUS[key].label}
              checked={value.includes(key)}
              data-autofocus={index === 0 || undefined}
              data-force={force === key ? 'focus' : undefined}
              onChange={(event) =>
                onChange?.(event.target.checked ? [...value, key] : value.filter((item) => item !== key))
              }
            />
            <span className={x.statusCount}>{CAMPAIGNS.filter((campaign) => campaign.status === key).length}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function statusChipText(value: StatusKey[]) {
  const [first] = value;
  if (!first) return 'Todos';
  return value.length === 1 ? STATUS[first].label : `${STATUS[first].label} +${value.length - 1}`;
}

function PopoverSpecimen() {
  const [statuses, setStatuses] = useState<StatusKey[]>(['live']);
  const rows = CAMPAIGNS.filter((campaign) => !statuses.length || statuses.includes(campaign.status)).slice(0, 6);
  const columns: Column<Campaign>[] = [
    {
      key: 'name',
      header: 'Campanha',
      render: (campaign) => (
        <span className={x.cellName}>
          <strong>{campaign.name}</strong>
          <span>
            {campaign.asset} · #{campaign.id}
          </span>
        </span>
      ),
    },
    {
      key: 'advertiser',
      header: 'Anunciante',
      render: (campaign) => (
        <span className={x.cellBrand}>
          <BrandMark name={campaign.advertiser} size="xs" variant="soft" decorative />
          {campaign.advertiser}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (campaign) => <Status status={campaign.status} /> },
    {
      key: 'period',
      header: (
        <span className={x.headWithInfo}>
          Período
          <Popover
            label="Janela do ativo"
            width={260}
            align="start"
            trigger={(props) => (
              <IconButton {...props} label="Janela do ativo" icon={Info} variant="ghost" size="sm" className={x.infoButton} />
            )}
          >
            <WindowPanel />
          </Popover>
        </span>
      ),
      width: 150,
      render: (campaign) => <span className={x.num}>{campaign.period}</span>,
    },
    {
      key: 'links',
      header: 'Vínculos',
      align: 'end',
      width: 96,
      render: (campaign) => <LinksTrigger campaign={campaign} />,
    },
  ];

  return (
    <Shots>
      <Shot title="Em contexto" align="stretch" tone="white">
        <section className={x.listLayout}>
          <div className={x.filterBar}>
            <Popover
              label="Filtrar por status"
              width={300}
              trigger={(props) => (
                <Chip
                  ref={props.ref}
                  label="Status:"
                  icon={ListFilter}
                  expanded={props['aria-expanded']}
                  onClick={props.onClick}
                >
                  {statusChipText(statuses)}
                </Chip>
              )}
            >
              <StatusPanel value={statuses} onChange={setStatuses} />
            </Popover>
            <span className={x.filterCount}>
              {rows.length} {rows.length === 1 ? 'campanha' : 'campanhas'}
            </span>
          </div>
          <div className={x.tableScroll}>
            <div style={{ minWidth: 760 }}>
              <DataTable
                label="Campanhas"
                rows={rows}
                rowKey={(campaign) => String(campaign.id)}
                columns={columns}
                density="compact"
                transitionKey={statuses.join()}
                empty={<span className={x.miniEmpty}>Nenhuma campanha com esses status</span>}
              />
            </div>
          </div>
        </section>
      </Shot>

      <Shot title="Estados" align="stretch">
        <div className={x.popStates}>
          <div className={x.popPair}>
            <figure className={x.figure}>
              <div className={x.popCell}>
                <MiniRow name={CAMPAIGNS[0]!.name}>
                  <button type="button" className={x.linksButton} aria-label="10 vínculos">
                    10
                  </button>
                </MiniRow>
              </div>
              <figcaption>Fechado</figcaption>
            </figure>
            <figure className={x.figure}>
              <div className={x.popCell}>
                <MiniRow name={CAMPAIGNS[0]!.name}>
                  <button type="button" className={x.linksButton} aria-label="10 vínculos" data-force="hover">
                    10
                  </button>
                </MiniRow>
              </div>
              <figcaption>Hover</figcaption>
            </figure>
          </div>
          <figure className={x.figure}>
            <div className={x.popCell}>
              <LinksTrigger campaign={CAMPAIGNS[0]!} pinned row />
            </div>
            <figcaption>Aberto</figcaption>
          </figure>
          <figure className={x.figure}>
            <div className={x.popCell}>
              <LinksTrigger campaign={CAMPAIGNS[4]!} pinned row side="top" />
            </div>
            <figcaption>Virado para cima</figcaption>
          </figure>
          <figure className={x.figure}>
            <div className={x.popCell}>
              <Popover
                pinned
                label="Filtrar por status"
                width={300}
                trigger={(props) => (
                  <Chip label="Status:" icon={ListFilter} expanded onClick={props.onClick}>
                    Veiculando
                  </Chip>
                )}
              >
                <StatusPanel value={['live']} force="approved" />
              </Popover>
            </div>
            <figcaption>Foco interno</figcaption>
          </figure>
        </div>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Tooltip ——————————————————————————— */

/** Invólucro do interruptor: recebe a descrição da dica e a repassa ao `role="switch"`. */
function SwitchAnchor({
  'aria-describedby': describedBy,
  children,
}: {
  'aria-describedby'?: string;
  title?: string;
  children: (describedBy?: string) => ReactNode;
}) {
  return <span className={x.switchHit}>{children(describedBy)}</span>;
}

/** Nome numa linha só; a dica com o nome inteiro só existe quando o texto foi cortado. */
function TruncatedName({ text, width }: { text: string; width: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [cut, setCut] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) setCut(el.scrollWidth > el.clientWidth + 1);
  }, [text, width]);
  const link = (
    <TextLink
      ref={ref}
      href="#tooltip"
      tone="text"
      className={x.truncate}
      style={{ maxWidth: width }}
      onClick={(event) => event.preventDefault()}
    >
      {text}
    </TextLink>
  );
  return cut ? <Tooltip content={text}>{link}</Tooltip> : link;
}

const LIVE_DELETE = 'Campanha no ar não pode ser excluída';

function RowIcons({ campaign }: { campaign: Campaign }) {
  const live = campaign.status === 'live';
  return (
    <span className={x.rowIcons}>
      <Tooltip content="Métricas">
        <IconButton label="Métricas" icon={ChartColumn} variant="ghost" size="sm" />
      </Tooltip>
      <Tooltip content="Editar">
        <IconButton label="Editar" icon={Pencil} variant="ghost" size="sm" />
      </Tooltip>
      <Tooltip content={live ? LIVE_DELETE : 'Excluir'}>
        <IconButton label="Excluir" icon={Trash2} variant="ghost" size="sm" tone="danger" aria-disabled={live || undefined} />
      </Tooltip>
    </span>
  );
}

function DeliverySwitch({ campaign }: { campaign: Campaign }) {
  const [on, setOn] = useState(campaign.status === 'live');
  const can = campaign.status === 'live' || campaign.status === 'approved' || campaign.status === 'paused';
  const help = can ? (on ? 'Pausar a veiculação' : 'Iniciar a veiculação') : 'Disponível depois da aprovação';
  return (
    <Tooltip content={help}>
      <SwitchAnchor>
        {(describedBy) => (
          <Switch
            size="sm"
            hideLabel
            label={`Veiculação de ${campaign.name}`}
            describedBy={describedBy}
            checked={on}
            disabled={!can}
            onCheckedChange={setOn}
          />
        )}
      </SwitchAnchor>
    </Tooltip>
  );
}

const TIP_ROWS = [CAMPAIGNS[1]!, CAMPAIGNS[5]!, CAMPAIGNS[3]!];

function TooltipSpecimen() {
  const columns: Column<Campaign>[] = [
    { key: 'on', header: '', width: 56, render: (campaign) => <DeliverySwitch campaign={campaign} /> },
    {
      key: 'name',
      header: 'Campanha',
      width: 220,
      render: (campaign) => <TruncatedName text={campaign.name} width={200} />,
    },
    { key: 'status', header: 'Status', render: (campaign) => <Status status={campaign.status} /> },
    {
      key: 'frequency',
      header: 'Frequência',
      hint: 'Média de exibições por pessoa',
      align: 'end',
      numeric: true,
      width: 120,
      render: (campaign) => (campaign.frequency ? campaign.frequency.toLocaleString('pt-BR') : undefined),
      fallback: '—',
    },
    { key: 'actions', header: '', align: 'end', width: 124, render: (campaign) => <RowIcons campaign={campaign} /> },
  ];
  return (
    <Shots>
      <Shot title="Em contexto" align="stretch" tone="white">
        <section className={x.listLayout}>
          <div className={x.tipHead}>
            <h4 className={x.panelTitle}>Campanhas</h4>
            <Tooltip content="Atalho" shortcut="⌘ N">
              <Button variant="primary" icon={Plus} size="sm">
                Nova campanha
              </Button>
            </Tooltip>
          </div>
          <div className={x.tableScroll}>
            <div style={{ minWidth: 640 }}>
              <DataTable
                label="Campanhas"
                rows={TIP_ROWS}
                rowKey={(campaign) => String(campaign.id)}
                columns={columns}
                density="compact"
              />
            </div>
          </div>
        </section>
      </Shot>

      <Shot title="Fixadas" align="stretch">
        <div className={x.tipStates}>
          <State label="Ícone">
            <Tooltip open content="Métricas">
              <IconButton label="Métricas" icon={ChartColumn} variant="ghost" size="sm" data-force="hover" />
            </Tooltip>
          </State>
          <State label="Indisponível">
            <Tooltip open content={LIVE_DELETE}>
              <IconButton label="Excluir" icon={Trash2} variant="ghost" size="sm" tone="danger" aria-disabled />
            </Tooltip>
          </State>
          <State label="Com atalho">
            <Tooltip open content="Atalho" shortcut="⌘ N">
              <Button variant="primary" icon={Plus} size="sm">
                Nova campanha
              </Button>
            </Tooltip>
          </State>
          <State label="Texto cortado">
            <Tooltip open side="bottom" content="Rodada de negócios — segunda edição">
              <span className={x.truncate} style={{ maxWidth: 150 }}>
                Rodada de negócios — segunda edição
              </span>
            </Tooltip>
          </State>
          <State label="Termo">
            <Tooltip open side="bottom" content="Média de exibições por pessoa">
              <span className={x.term}>Frequência</span>
            </Tooltip>
          </State>
          <State label="Indisponível">
            <Tooltip open side="bottom" content="Disponível depois da aprovação">
              <span className={x.switchHit}>
                <Switch size="sm" hideLabel label="Veiculação" checked={false} disabled onCheckedChange={noop} />
              </span>
            </Tooltip>
          </State>
        </div>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Hover card ——————————————————————————— */

type Advertiser = {
  name: string;
  segment: string;
  campaigns: number;
  live: number;
  budget: number;
  last: Campaign;
};

const ADVERTISERS: Record<string, Advertiser> = {
  'Aurora Calçados': {
    name: 'Aurora Calçados',
    segment: 'Calçado feminino · Novo Hamburgo, RS',
    campaigns: 3,
    live: 1,
    budget: 18000,
    last: CAMPAIGNS[0]!,
  },
  'Estúdio Norte': {
    name: 'Estúdio Norte',
    segment: 'Design de estandes · São Paulo, SP',
    campaigns: 2,
    live: 1,
    budget: 8000,
    last: CAMPAIGNS[1]!,
  },
  'Casa Forma': {
    name: 'Casa Forma',
    segment: 'Mobiliário · Bento Gonçalves, RS',
    campaigns: 1,
    live: 0,
    budget: 3600,
    last: CAMPAIGNS[2]!,
  },
};

function AdvertiserCard({ advertiser }: { advertiser: Advertiser }) {
  return (
    <div className={x.hoverCard}>
      <div className={x.cardIdentity}>
        <BrandMark name={advertiser.name} size="md" decorative />
        <span className={x.rowText}>
          <strong>{advertiser.name}</strong>
          <span>{advertiser.segment}</span>
        </span>
      </div>
      <dl className={x.facts}>
        <div>
          <dt>Campanhas</dt>
          <dd>{advertiser.campaigns}</dd>
        </div>
        <div>
          <dt>Em veiculação</dt>
          <dd>{advertiser.live}</dd>
        </div>
        <div>
          <dt>Verba contratada</dt>
          <dd>{money(advertiser.budget)}</dd>
        </div>
      </dl>
      <div className={x.lastCampaign}>
        <i data-tone={STATUS[advertiser.last.status].tone} aria-hidden="true" />
        <span className={x.lastName}>{advertiser.last.name}</span>
        <span className={x.num}>{advertiser.last.period}</span>
      </div>
      <LinkButton className={x.cardLink}>
        Ver anunciante
        <ArrowRight aria-hidden="true" />
      </LinkButton>
    </div>
  );
}

function PersonCard() {
  return (
    <div className={x.cardIdentity}>
      <Avatar name="Marina Lopes" size="md" decorative />
      <span className={x.rowText}>
        <strong>Marina Lopes</strong>
        <span>Operação · Francal</span>
        <TextLink href="mailto:marina.lopes@francal.com.br" size="sm" onClick={(event) => event.preventDefault()}>
          marina.lopes@francal.com.br
        </TextLink>
      </span>
    </div>
  );
}

function AdvertiserLink({ name, pinned }: { name: string; pinned?: boolean }) {
  const advertiser = ADVERTISERS[name];
  const link = (
    <span className={x.cellBrand}>
      <BrandMark name={name} size="xs" variant="soft" decorative />
      <TextLink href="#hover-card" tone="text" onClick={(event) => event.preventDefault()}>
        {name}
      </TextLink>
    </span>
  );
  if (!advertiser) return link;
  return (
    <HoverCard trigger={link} pinned={pinned} width={320}>
      <AdvertiserCard advertiser={advertiser} />
    </HoverCard>
  );
}

function PersonLink({ pinned }: { pinned?: boolean }) {
  return (
    <HoverCard
      pinned={pinned}
      width={280}
      trigger={
        <TextLink href="#hover-card" tone="inherit" onClick={(event) => event.preventDefault()}>
          Marina Lopes
        </TextLink>
      }
    >
      <PersonCard />
    </HoverCard>
  );
}

const HC_ROWS = [CAMPAIGNS[0]!, CAMPAIGNS[1]!, CAMPAIGNS[2]!];

function HoverCardSpecimen() {
  const columns: Column<Campaign>[] = [
    {
      key: 'name',
      header: 'Campanha',
      render: (campaign) => (
        <span className={x.cellName}>
          <strong>{campaign.name}</strong>
          <span>#{campaign.id}</span>
        </span>
      ),
    },
    { key: 'advertiser', header: 'Anunciante', render: (campaign) => <AdvertiserLink name={campaign.advertiser} /> },
    { key: 'status', header: 'Status', render: (campaign) => <Status status={campaign.status} /> },
  ];
  return (
    <Shots>
      <Shot title="Em contexto" align="stretch" tone="white">
        <div className={x.hoverContext}>
          <section className={x.listLayout}>
            <div className={x.tableScroll}>
              <div style={{ minWidth: 560 }}>
                <DataTable
                  label="Campanhas"
                  rows={HC_ROWS}
                  rowKey={(campaign) => String(campaign.id)}
                  columns={columns}
                  density="compact"
                />
              </div>
            </div>
          </section>
          <section className={x.panel}>
            <header className={x.panelHead}>
              <h4 className={x.panelTitle}>Histórico</h4>
            </header>
            <div className={x.historyBody}>
              <Timeline
                variant="dots"
                label="Histórico da campanha"
                items={[
                  {
                    id: 'h1',
                    title: 'Ajustes solicitados',
                    description: (
                      <>
                        <PersonLink /> · 26/09
                      </>
                    ),
                    state: 'current',
                  },
                  { id: 'h2', title: 'Enviada para aprovação', description: 'Grupo Horizonte · 24/09' },
                  { id: 'h3', title: 'Campanha criada', description: 'Grupo Horizonte · 24/09' },
                ]}
              />
            </div>
          </section>
        </div>
      </Shot>

      <Shot title="Fixados" align="stretch">
        <div className={x.hoverStates}>
          <State label="Anunciante">
            <AdvertiserLink name="Aurora Calçados" pinned />
          </State>
          <State label="Pessoa">
            <span className={x.personLine}>
              <PersonLink pinned />
            </span>
          </State>
        </div>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Registro ——————————————————————————— */

export const specimens: Record<string, ComponentType> = {
  modal: ModalSpecimen,
  confirmacao: ConfirmacaoSpecimen,
  drawer: DrawerSpecimen,
  'bottom-sheet': BottomSheetSpecimen,
  'dialogo-responsivo': DialogoResponsivoSpecimen,
  popover: PopoverSpecimen,
  tooltip: TooltipSpecimen,
  'hover-card': HoverCardSpecimen,
};
