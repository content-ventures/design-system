'use client';

import {
  ArrowRight,
  BarChart3,
  Boxes,
  Check,
  CircleCheck,
  Copy,
  FileSignature,
  Gift,
  Globe,
  Lock,
  Mail,
  Megaphone,
  Radio,
  Smartphone,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from 'react';
import {
  Badge,
  BrandMark,
  Button,
  Checkbox,
  DatePicker,
  DialogFrame,
  type Tone,
} from '@content-ventures/design-system/v3';
import { CodeInput, type CodeStatus } from '@content-ventures/design-system/v3/code-input';
import {
  ErrorCount,
  ErrorSummary,
  focusField,
  type FormError,
} from '@content-ventures/design-system/v3/error-summary';
import {
  ControlButton,
  Counter,
  Field,
  FieldGroup,
  Highlight,
  Input,
  SearchField,
  Textarea,
  useNotice,
} from '@content-ventures/design-system/v3/fields';
import { LinkButton } from '@content-ventures/design-system/v3/link';
import { MoneyField, moneyBRL, type MoneyAdjustReason } from '@content-ventures/design-system/v3/money-field';
import { NumberField } from '@content-ventures/design-system/v3/number-field';
import { PasswordField, type PasswordRequirement } from '@content-ventures/design-system/v3/password-field';
import { Select } from '@content-ventures/design-system/v3/select';
import { Slider } from '@content-ventures/design-system/v3/slider';
import { FormRow } from '@content-ventures/design-system/v3/stepper';
import { Shot, Shots, State } from '../stage';
import x from './formularios-a.module.css';

/* ——— Utilidades locais ——— */

const int = (value: number) => Math.round(value).toLocaleString('pt-BR');
const fold = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const DAY = 86_400_000;
const daysBetween = (start: string, end: string) =>
  start && end ? Math.round((Date.parse(end) - Date.parse(start)) / DAY) + 1 : 0;
const dateBR = (iso: string) => iso.split('-').reverse().join('/');
const shortBR = (iso: string) => dateBR(iso).slice(0, 5);
const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

/** Grade de estados: 3 colunas no desktop (2 no tablet), 1 no celular. */
function Grid({ children, cols = 3 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  return (
    <div className={x.grid} data-cols={cols}>
      {children}
    </div>
  );
}

/* ═══════════════ Campo ═══════════════ */

const PIN_LABELS = ['Rótulo', 'Obrigatório', 'Contagem', 'Controle', 'Ajuda'];

function Pin({ n, style }: { n: number; style?: CSSProperties }) {
  return (
    <span className={x.pin} style={style} aria-hidden="true">
      {n}
    </span>
  );
}

function AnatomyField() {
  const [name, setName] = useState('Coleção verão 2027');
  const root = useRef<HTMLDivElement>(null);
  const [pins, setPins] = useState<{ x: number; y: number }[]>([]);

  // Os marcadores seguem a geometria real do campo (mede no ResizeObserver, sem número mágico).
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const measure = () => {
      const base = el.getBoundingClientRect();
      const rect = (selector: string) => el.querySelector(selector)?.getBoundingClientRect();
      const label = rect('label');
      const star = rect('label > span[aria-hidden]');
      const meta = rect('[data-pin="meta"]');
      const control = el.querySelector('input')?.parentElement?.getBoundingClientRect();
      const hint = rect('[data-pin="hint"]');
      if (!label || !star || !meta || !control || !hint) return;
      const left = control.left - base.left - 20;
      const right = control.right - base.left + 20;
      const cy = (r: DOMRect) => r.top - base.top + r.height / 2;
      setPins([
        { x: left, y: cy(label) },
        { x: star.left - base.left + star.width / 2, y: star.top - base.top - 10 },
        { x: right, y: cy(meta) },
        { x: left, y: cy(control) },
        { x: left, y: cy(hint) },
      ]);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={root} className={x.anatomyField}>
      <Field
        label="Nome da campanha"
        required
        meta={
          <span data-pin="meta">
            <Counter value={name.length} max={80} />
          </span>
        }
        hint={<span data-pin="hint">Único por anunciante</span>}
      >
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            aria-describedby={describedBy}
            invalid={invalid}
            maxLength={80}
            placeholder="Ex.: Lançamento coleção verão"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        )}
      </Field>
      {pins.map((pin, index) => (
        <Pin key={index} n={index + 1} style={{ left: pin.x, top: pin.y }} />
      ))}
    </div>
  );
}

function Legend() {
  return (
    <ol className={x.legend}>
      {PIN_LABELS.map((label, index) => (
        <li key={label}>
          <span className={x.pinInline} aria-hidden="true">
            {index + 1}
          </span>
          {label}
        </li>
      ))}
    </ol>
  );
}

function CampoInvalido() {
  const [name, setName] = useState('');
  const [error, setError] = useState('Informe o nome da campanha');
  return (
    <Field
      label="Nome da campanha"
      required
      error={error}
      meta={<Counter value={name.length} max={80} />}
    >
      {({ id, describedBy, invalid }) => (
        <Input
          id={id}
          aria-describedby={describedBy}
          invalid={invalid}
          maxLength={80}
          placeholder="Ex.: Lançamento coleção verão"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={() => setError(name.trim() ? '' : 'Informe o nome da campanha')}
        />
      )}
    </Field>
  );
}

function PeriodGroup() {
  const [start, setStart] = useState('2026-10-05');
  const [end, setEnd] = useState('2026-10-31');
  const window_ = { start: '2026-10-01', end: '2026-11-30', label: 'Janela do ativo' };
  const days = daysBetween(start, end);
  const backwards = Boolean(start && end && end < start);
  return (
    <FieldGroup
      label="Período de veiculação"
      meta={days > 0 && !backwards ? `${days} dias` : undefined}
      columns={2}
      error={backwards ? 'Término antes do início' : undefined}
      hint={
        <>
          Janela do ativo <b>{`${shortBR(window_.start)} – ${shortBR(window_.end)}`}</b>
        </>
      }
    >
      <Field label="Início" required>
        {({ id, describedBy }) => (
          <DatePicker
            id={id}
            describedBy={describedBy}
            value={start}
            onChange={setStart}
            min={window_.start}
            max={window_.end}
            window={window_}
            invalid={backwards}
          />
        )}
      </Field>
      <Field label="Término" required>
        {({ id, describedBy }) => (
          <DatePicker
            id={id}
            describedBy={describedBy}
            value={end}
            onChange={setEnd}
            min={window_.start}
            max={window_.end}
            window={window_}
            invalid={backwards}
          />
        )}
      </Field>
    </FieldGroup>
  );
}

function NameField({
  value = '',
  error,
  ...props
}: {
  value?: string;
  error?: string;
  'data-force'?: string;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  return (
    <Field label="Nome da campanha" required error={error}>
      {({ id, describedBy, invalid }) => (
        <Input
          {...props}
          id={id}
          aria-describedby={describedBy}
          invalid={invalid}
          placeholder="Ex.: Lançamento coleção verão"
          defaultValue={value}
        />
      )}
    </Field>
  );
}

function Campo() {
  const [portal, setPortal] = useState('Francal 2026');
  const [site, setSite] = useState('francal.com.br/expositores');
  const [mail, setMail] = useState('comercial@francal.com.br');
  return (
    <Shots>
      <Shot title="Anatomia" tone="white" pad="lg">
        <div className={x.pair}>
          <AnatomyField />
          <CampoInvalido />
          <Legend />
          <span className={x.pairCaption}>Inválido</span>
        </div>
      </Shot>

      <Shot title="Grupo" tone="white" pad="lg">
        <div className={x.w520}>
          <PeriodGroup />
        </div>
      </Shot>

      <Shot title="Estados" align="stretch">
        <Grid cols={4}>
          <State label="Vazio">
            <NameField />
          </State>
          <State label="Hover">
            <NameField data-force="hover" />
          </State>
          <State label="Preenchido">
            <NameField value="Coleção verão 2027" />
          </State>
          <State label="Foco">
            <NameField value="Coleção verão 2027" data-force="focus" />
          </State>
          <State label="Inválido">
            <NameField error="Informe o nome da campanha" />
          </State>
          <State label="Indisponível">
            <NameField value="Coleção verão 2027" disabled />
          </State>
          <State label="Somente leitura">
            <NameField value="Coleção verão 2027" readOnly />
          </State>
        </Grid>
      </Shot>

      <Shot title="Linha" tone="white" align="stretch">
        <div className={x.rows}>
          <FormRow label="Nome do portal" hint={<Counter value={portal.length} max={60} />}>
            {({ id, describedBy }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                maxLength={60}
                value={portal}
                onChange={(event) => setPortal(event.target.value)}
              />
            )}
          </FormRow>
          <FormRow label="Endereço da vitrine">
            {({ id, describedBy }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                prefix="https://"
                value={site}
                onChange={(event) => setSite(event.target.value)}
              />
            )}
          </FormRow>
          <FormRow label="E-mail comercial" hint="Recebe os P.I. assinados">
            {({ id, describedBy }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                type="email"
                icon={Mail}
                value={mail}
                onChange={(event) => setMail(event.target.value)}
              />
            )}
          </FormRow>
        </div>
      </Shot>
    </Shots>
  );
}

/* ═══════════════ Campo de texto ═══════════════ */

const URL_RE = /^[\w-]+(\.[\w-]+)+(\/\S*)?$/;

/** (51) 99999-0000 enquanto digita. */
function maskPhone(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (!d) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function Identificacao() {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('aurora.com.br/verao');
  const [urlState, setUrlState] = useState<{ status?: 'loading' | 'valid'; error?: string }>({
    status: 'valid',
  });
  const [mail, setMail] = useState('');
  const [phone, setPhone] = useState('(51) 99812-4410');
  const run = useRef(0);

  async function checkUrl() {
    const value = url.trim().replace(/^https?:\/\//, '');
    if (!value) return setUrlState({});
    const ticket = ++run.current;
    setUrlState({ status: 'loading' });
    await wait(600);
    if (ticket !== run.current) return;
    setUrlState(URL_RE.test(value) ? { status: 'valid' } : { error: 'URL inválida' });
  }

  return (
    <section className={x.panel} aria-labelledby="fa-ident">
      <h3 id="fa-ident" className={x.panelTitle}>
        Identificação
      </h3>
      <div className={x.form2}>
        <Field label="Nome da campanha" required>
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              maxLength={80}
              placeholder="Ex.: Lançamento coleção verão"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          )}
        </Field>
        <Field label="URL de destino" required error={urlState.error}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              prefix="https://"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              placeholder="aurora.com.br/verao"
              status={urlState.status}
              value={url}
              onChange={(event) => {
                run.current += 1;
                setUrl(event.target.value);
                if (urlState.status || urlState.error) setUrlState({});
              }}
              onBlur={checkUrl}
            />
          )}
        </Field>
        <Field label="E-mail do contato">
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              type="email"
              icon={Mail}
              autoComplete="off"
              placeholder="nome@empresa.com.br"
              value={mail}
              onChange={(event) => setMail(event.target.value)}
            />
          )}
        </Field>
        <Field label="Telefone">
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              type="tel"
              inputMode="tel"
              autoComplete="off"
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={(event) => setPhone(maskPhone(event.target.value))}
            />
          )}
        </Field>
      </div>
    </section>
  );
}

function CopyLink() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <Input
      readOnly
      aria-label="Link da campanha"
      value="mediaon.app/c/2041"
      prefix="https://"
      trailing={
        <ControlButton
          label={copied ? 'Link copiado' : 'Copiar link'}
          icon={copied ? Check : Copy}
          onClick={() => {
            void navigator.clipboard
              ?.writeText('https://mediaon.app/c/2041')
              .catch(() => undefined);
            setCopied(true);
            window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => setCopied(false), 1200);
          }}
        />
      }
    />
  );
}

/** Filtro rebaixado da barra: “Limpar” só vale com termo, e devolve o foco ao campo. */
function WellFilter() {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className={x.toolbar}>
      <div className={x.w240}>
        <Input
          ref={ref}
          variant="well"
          size="sm"
          aria-label="Filtrar ativos"
          placeholder="Filtrar ativos"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </div>
      <Button
        size="sm"
        variant="ghost"
        disabled={!value}
        onClick={() => {
          setValue('');
          ref.current?.focus();
        }}
      >
        Limpar
      </Button>
    </div>
  );
}

function Spec({ rows }: { rows: { label: string; content: ReactNode }[] }) {
  return (
    <div className={x.spec}>
      {rows.map((row) => (
        <div key={row.label} className={x.specRow}>
          <span className={x.specLabel}>{row.label}</span>
          <div className={x.specBody}>{row.content}</div>
        </div>
      ))}
    </div>
  );
}

function UrlField({
  value = '',
  error,
  status,
  ...props
}: {
  value?: string;
  error?: string;
  status?: 'loading' | 'valid';
  'data-force'?: string;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  return (
    <Field label="URL de destino" required error={error}>
      {({ id, describedBy, invalid }) => (
        <Input
          {...props}
          id={id}
          aria-describedby={describedBy}
          invalid={invalid}
          status={status}
          prefix="https://"
          placeholder="aurora.com.br/verao"
          defaultValue={value}
        />
      )}
    </Field>
  );
}

function CampoTexto() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch">
        <Identificacao />
      </Shot>

      <Shot title="Variantes" tone="white" align="stretch">
        <Spec
          rows={[
            {
              label: 'Simples',
              content: (
                <div className={x.w320}>
                  <Input aria-label="Nome do expositor" placeholder="Nome do expositor" />
                </div>
              ),
            },
            {
              label: 'Ícone',
              content: (
                <div className={x.w320}>
                  <Input aria-label="E-mail" icon={Mail} defaultValue="contato@aurora.com.br" />
                </div>
              ),
            },
            {
              label: 'Prefixo',
              content: (
                <div className={x.w320}>
                  <Input
                    aria-label="Site"
                    prefix="https://"
                    defaultValue="francal.com.br/expositores"
                  />
                </div>
              ),
            },
            {
              label: 'Sufixo',
              content: (
                <>
                  <div className={x.w120}>
                    <Input aria-label="Desconto" suffix="%" defaultValue="5" className={x.right} />
                  </div>
                  <div className={x.w140}>
                    <Input
                      aria-label="Duração"
                      suffix="dias"
                      defaultValue="27"
                      className={x.right}
                    />
                  </div>
                </>
              ),
            },
            {
              label: 'Ação',
              content: (
                <div className={x.w320}>
                  <CopyLink />
                </div>
              ),
            },
            {
              label: 'Tamanhos',
              content: (
                <div className={x.sizes}>
                  {(['sm', 'md', 'lg'] as const).map((size) => (
                    <figure key={size} className={x.figure}>
                      <Input
                        size={size}
                        aria-label={`Campo ${size}`}
                        placeholder="Nome do expositor"
                      />
                      <figcaption>{size === 'sm' ? '32' : size === 'md' ? '36' : '40'}</figcaption>
                    </figure>
                  ))}
                </div>
              ),
            },
            {
              label: 'Rebaixado',
              content: <WellFilter />,
            },
          ]}
        />
      </Shot>

      <Shot title="Estados" align="stretch">
        <Grid cols={4}>
          <State label="Repouso">
            <UrlField />
          </State>
          <State label="Hover">
            <UrlField data-force="hover" />
          </State>
          <State label="Foco">
            <UrlField value="aurora.com.br/verao" data-force="focus" />
          </State>
          <State label="Preenchido">
            <UrlField value="aurora.com.br/verao" />
          </State>
          <State label="Inválido">
            <UrlField value="aurora calçados" error="URL inválida" />
          </State>
          <State label="Indisponível">
            <UrlField value="aurora.com.br/verao" disabled />
          </State>
          <State label="Somente leitura">
            <UrlField value="aurora.com.br/verao" readOnly />
          </State>
          <State label="Validando">
            <UrlField value="aurora.com.br/verao" status="loading" />
          </State>
        </Grid>
      </Shot>
    </Shots>
  );
}

/* ═══════════════ Área de texto ═══════════════ */

const ADJUST_TEXT = 'A peça 970 × 250 está com o logotipo cortado. Ajuste o respiro e reenvie.';
const LONG =
  'A peça 970 × 250 está com o logotipo cortado na versão para celular. Ajuste o respiro lateral, ' +
  'troque a foto do sapato por uma com fundo claro e revise o preço do lançamento, que difere do P.I. ' +
  'assinado. Reenvie as duas versões até sexta-feira, 09/10, para manter a data de início.';
const fill = (length: number) => LONG.padEnd(length, ' ').slice(0, length);

function PedirAjustes() {
  const [open, setOpen] = useState(true);
  const [reason, setReason] = useState(ADJUST_TEXT);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const was = useRef(open);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Abrir leva o foco ao motivo (cursor no fim); fechar devolve ao gatilho. Nunca ao carregar.
  useEffect(() => {
    if (was.current === open) return;
    was.current = open;
    if (!open) {
      trigger.current?.focus({ preventScroll: true });
      return;
    }
    const el = ref.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    el.setSelectionRange(el.value.length, el.value.length);
  }, [open]);

  function reopen() {
    window.clearTimeout(timer.current);
    setReason('');
    setError('');
    setSent(false);
    setOpen(true);
  }

  async function submit() {
    if (!reason.trim()) {
      setError('Descreva o motivo');
      ref.current?.focus();
      return;
    }
    setSending(true);
    await wait(600);
    setSending(false);
    setOpen(false);
    setSent(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSent(false), 2400);
  }

  return (
    <div
      className={x.dialogHost}
      data-open={open || undefined}
      onClick={(event) => {
        // O X da moldura fecha como no diálogo de verdade.
        if ((event.target as Element).closest('button[aria-label="Fechar"]')) setOpen(false);
      }}
    >
      <div className={x.dialogSlot} inert={!open || undefined}>
        <DialogFrame
          size="sm"
          title="Pedir ajustes"
          description="Coleção Primavera-Verão 2027 · Aurora Calçados"
          footerStart={
            reason ? (
              <LinkButton
                tone="quiet"
                onClick={() => {
                  setReason('');
                  ref.current?.focus();
                }}
              >
                Limpar
              </LinkButton>
            ) : undefined
          }
          footer={
            <>
              <Button onClick={() => setOpen(false)}>Cancelar</Button>
              <Button variant="primary" loading={sending} onClick={submit}>
                Pedir ajustes
              </Button>
            </>
          }
        >
          <Field label="Motivo" required error={error}>
            {({ id, describedBy, invalid }) => (
              <Textarea
                ref={ref}
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                autoSize={{ minRows: 3, maxRows: 8 }}
                maxLength={280}
                placeholder="Escreva o motivo"
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  if (error && event.target.value.trim()) setError('');
                }}
              />
            )}
          </Field>
        </DialogFrame>
      </div>
      <div className={x.dialogTrigger} inert={open || undefined}>
        <Button ref={trigger} onClick={reopen}>
          Pedir ajustes
        </Button>
        <span className={x.doneSlot} role="status">
          {sent && (
            <span className={x.done}>
              <CircleCheck aria-hidden="true" />
              Pedido enviado
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

function Briefing() {
  const [title, setTitle] = useState('Banner Super Topo — Coleção verão');
  const [alt, setAlt] = useState('');
  return (
    <section className={x.panel} aria-labelledby="fa-brief">
      <h3 id="fa-brief" className={x.panelTitle}>
        Briefing
      </h3>
      <div className={x.form2}>
        <Field label="Título da peça" required>
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          )}
        </Field>
        <Field label="Texto alternativo da peça" hint="Descreve a imagem para leitores de tela.">
          {({ id, describedBy }) => (
            <Textarea
              id={id}
              aria-describedby={describedBy}
              autoSize={{ minRows: 2, maxRows: 5 }}
              maxLength={180}
              placeholder="Ex.: Sandália de couro caramelo sobre fundo areia"
              value={alt}
              onChange={(event) => setAlt(event.target.value)}
            />
          )}
        </Field>
      </div>
    </section>
  );
}

function ReasonField({
  value = '',
  error,
  ...props
}: {
  value?: string;
  error?: string;
  'data-force'?: string;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  return (
    <Field label="Motivo" required error={error}>
      {({ id, describedBy, invalid }) => (
        <Textarea
          {...props}
          id={id}
          aria-describedby={describedBy}
          invalid={invalid}
          autoSize={{ minRows: 3, maxRows: 5 }}
          maxLength={280}
          placeholder="Escreva o motivo"
          defaultValue={value}
        />
      )}
    </Field>
  );
}

function AreaTexto() {
  return (
    <Shots>
      <Shot title="Pedir ajustes" pad="lg">
        <PedirAjustes />
      </Shot>
      <Shot title="Briefing" tone="white" align="stretch">
        <Briefing />
      </Shot>
      <Shot title="Estados" align="stretch">
        <Grid>
          <State label="Repouso">
            <ReasonField />
          </State>
          <State label="Hover">
            <ReasonField data-force="hover" />
          </State>
          <State label="Foco">
            <ReasonField value={ADJUST_TEXT} data-force="focus" />
          </State>
          <State label="Preenchido">
            <ReasonField value={ADJUST_TEXT} />
          </State>
          <State label="Somente leitura">
            <ReasonField value={ADJUST_TEXT} readOnly />
          </State>
          <State label="Inválido">
            <ReasonField error="Descreva o motivo" />
          </State>
          <State label="Indisponível">
            <ReasonField value={ADJUST_TEXT} disabled />
          </State>
          <State label="Perto do limite">
            <ReasonField value={fill(252)} />
          </State>
          <State label="No limite">
            <ReasonField value={fill(280)} />
          </State>
        </Grid>
      </Shot>
    </Shots>
  );
}

/* ═══════════════ Senha ═══════════════ */

const RULES: PasswordRequirement[] = [
  { label: '8 caracteres', test: (value) => value.length >= 8 },
  { label: '1 letra maiúscula', test: (value) => /\p{Lu}/u.test(value) },
  { label: '1 número', test: (value) => /\d/.test(value) },
  { label: '1 símbolo', test: (value) => /[^\p{L}\d\s]/u.test(value) },
];

function Login() {
  const [email, setEmail] = useState('marina.lopes@francal.com.br');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const field = useRef<HTMLInputElement>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!password) {
      setError('Informe a senha');
      field.current?.focus();
      return;
    }
    setBusy(true);
    await wait(700);
    setBusy(false);
    setError('Senha incorreta');
    field.current?.focus();
    field.current?.select();
  }

  return (
    <form className={x.card} onSubmit={submit} noValidate aria-labelledby="fa-login">
      <header className={x.cardHead}>
        <h3 id="fa-login" className={x.cardTitle}>
          Entrar
        </h3>
        <p className={x.cardMeta}>Francal 2026 · Portal do organizador</p>
      </header>
      <Field label="E-mail">
        {({ id, describedBy }) => (
          <Input
            id={id}
            aria-describedby={describedBy}
            type="email"
            autoComplete="off"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        )}
      </Field>
      <Field label="Senha" error={error} meta={<LinkButton>Esqueci a senha</LinkButton>}>
        {({ id, describedBy, invalid }) => (
          <PasswordField
            ref={field}
            id={id}
            aria-describedby={describedBy}
            invalid={invalid}
            autoComplete="off"
            value={password}
            onValueChange={(next) => {
              setPassword(next);
              if (error) setError('');
            }}
          />
        )}
      </Field>
      <Button type="submit" variant="primary" loading={busy} className={x.block}>
        Entrar
      </Button>
    </form>
  );
}

function Convite() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const field = useRef<HTMLInputElement>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!RULES.every((rule) => rule.test(password))) {
      setError(password ? 'Atenda aos 4 requisitos' : 'Crie uma senha');
      field.current?.focus();
      return;
    }
    setState('busy');
    await wait(700);
    setState('done');
  }

  return (
    <form className={x.card} onSubmit={submit} noValidate aria-labelledby="fa-invite">
      <header className={x.cardHead}>
        <h3 id="fa-invite" className={x.cardTitle}>
          Crie sua senha
        </h3>
        <p className={x.cardMeta}>Convite de Aurora Calçados</p>
      </header>
      <Field label="Nova senha" error={error}>
        {({ id, describedBy, invalid }) => (
          <PasswordField
            ref={field}
            id={id}
            aria-describedby={describedBy}
            invalid={invalid}
            autoComplete="off"
            requirements={RULES}
            value={password}
            onValueChange={(next) => {
              setPassword(next);
              if (error) setError('');
              if (state === 'done') setState('idle');
            }}
          />
        )}
      </Field>
      <Button
        type="submit"
        variant="primary"
        loading={state === 'busy'}
        icon={state === 'done' ? Check : undefined}
        className={x.block}
      >
        {state === 'done' ? 'Senha criada' : 'Criar senha'}
      </Button>
    </form>
  );
}

function SenhaState(props: {
  value?: string;
  error?: string;
  visible?: boolean;
  capsLock?: boolean;
  disabled?: boolean;
  'data-force'?: string;
}) {
  const { value = '', error, ...rest } = props;
  const [current, setCurrent] = useState(value);
  return (
    <Field label="Senha" error={error}>
      {({ id, describedBy, invalid }) => (
        <PasswordField
          {...rest}
          id={id}
          aria-describedby={describedBy}
          invalid={invalid}
          autoComplete="off"
          value={current}
          onValueChange={setCurrent}
        />
      )}
    </Field>
  );
}

function Senha() {
  return (
    <Shots>
      <Shot title="Em contexto" pad="lg">
        <div className={x.cards}>
          <Login />
          <Convite />
        </div>
      </Shot>
      <Shot title="Estados" align="stretch">
        <Grid cols={4}>
          <State label="Repouso">
            <SenhaState />
          </State>
          <State label="Hover">
            <SenhaState data-force="hover" />
          </State>
          <State label="Foco">
            <SenhaState value="feira-teste" data-force="focus" />
          </State>
          <State label="Visível">
            <SenhaState value="feira-teste" visible />
          </State>
          <State label="Caps Lock">
            <SenhaState value="FEIRA" capsLock data-force="focus" />
          </State>
          <State label="Inválido">
            <SenhaState value="feira-teste" error="Senha incorreta" />
          </State>
          <State label="Indisponível">
            <SenhaState value="feira-teste" disabled />
          </State>
        </Grid>
      </Shot>
    </Shots>
  );
}

/* ═══════════════ Número ═══════════════ */

type Channel = { id: string; name: string; icon: LucideIcon; on: boolean; pct: number | null };
const BUDGET = 18_000;

function Canais() {
  const [rows, setRows] = useState<Channel[]>([
    { id: 'portal', name: 'Portal da feira', icon: Globe, on: true, pct: 50 },
    { id: 'app', name: 'App Francal', icon: Smartphone, on: true, pct: 30 },
    { id: 'mail', name: 'E-mail dos credenciados', icon: Mail, on: true, pct: 20 },
  ]);
  const [notice, flash] = useNotice(3000);
  const active = rows.filter((row) => row.on);
  const total = active.reduce((sum, row) => sum + (row.pct ?? 0), 0);
  const rest = Math.round((100 - total) * 10) / 10;
  const set = (id: string, patch: Partial<Channel>) =>
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  const split = () => {
    const share = Math.floor(100 / active.length);
    let left = 100 - share * active.length;
    setRows((current) =>
      current.map((row) => {
        if (!row.on) return row;
        const extra = left > 0 ? 1 : 0;
        left -= extra;
        return { ...row, pct: share + extra };
      }),
    );
  };

  return (
    <div className={x.channels}>
      <div className={x.groupHead}>
        <span className={x.groupLabel}>Canais</span>
        <span className={x.groupMeta}>
          {active.length} de {rows.length} marcados
        </span>
        <LinkButton className={x.push} onClick={split} disabled={!active.length}>
          Dividir igualmente
        </LinkButton>
      </div>
      <div className={x.table} role="table" aria-label="Alocação por canal">
        <div className={x.thead} role="row">
          <span role="columnheader">Canal</span>
          <span role="columnheader" className={x.num}>
            Valor
          </span>
          <span role="columnheader" className={x.num}>
            Alocação
          </span>
        </div>
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.id} className={x.tr} role="row" data-off={!row.on || undefined}>
              <span role="cell" className={x.channel}>
                <Checkbox
                  aria-label={row.name}
                  checked={row.on}
                  onChange={(event) => set(row.id, { on: event.target.checked })}
                />
                <Icon aria-hidden="true" />
                <span>{row.name}</span>
              </span>
              <span role="cell" className={x.num}>
                {row.on && row.pct ? `≈ R$ ${int((BUDGET * row.pct) / 100)}` : '—'}
              </span>
              <span role="cell" className={x.alloc}>
                <NumberField
                  size="sm"
                  label={`Alocação de ${row.name}`}
                  min={0}
                  max={100}
                  suffix="%"
                  disabled={!row.on}
                  value={row.on ? row.pct : null}
                  onChange={(pct) => {
                    set(row.id, { pct });
                    flash(null);
                  }}
                  onAdjust={(next) => flash(`Ajustado para ${next}%`)}
                />
              </span>
            </div>
          );
        })}
        <div className={x.tfoot}>
          <span className={x.footNote} role="status">
            {notice}
          </span>
          {active.length > 0 && total === 100 ? (
            <span className={x.ok} key="ok">
              <Check aria-hidden="true" />
              100% distribuído
            </span>
          ) : (
            <span className={x.missing} key="missing" data-over={rest < 0 || undefined}>
              <span className={x.track} aria-hidden="true">
                <i style={{ width: `${Math.min(100, Math.max(0, total))}%` }} />
              </span>
              {rest > 0
                ? `Faltam ${String(rest).replace('.', ',')}%`
                : `Excede ${String(-rest).replace('.', ',')}%`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Frequencia() {
  const [per, setPer] = useState<number | null>(4);
  const [cap, setCap] = useState<number | null>(1.5);
  const [perNote, flashPer] = useNotice();
  const [capNote, flashCap] = useNotice();
  return (
    <div className={x.form2}>
      <Field label="Inserções por dia" hint="Entre 1 e 12" notice={perNote}>
        {({ id, describedBy }) => (
          <NumberField
            id={id}
            aria-describedby={describedBy}
            className={x.w180}
            stepper
            min={1}
            max={12}
            value={per}
            onChange={(next) => {
              setPer(next);
              flashPer(null);
            }}
            onAdjust={(next) => flashPer(`Ajustado para ${next}`)}
          />
        )}
      </Field>
      <Field label="Frequência máxima" hint="Por pessoa, por dia" notice={capNote}>
        {({ id, describedBy }) => (
          <NumberField
            id={id}
            aria-describedby={describedBy}
            className={x.w180}
            decimals={1}
            step={0.5}
            min={1}
            max={5}
            suffix="×"
            value={cap}
            onChange={(next) => {
              setCap(next);
              flashCap(null);
            }}
            onAdjust={(next) => flashCap(`Ajustado para ${String(next).replace('.', ',')} ×`)}
          />
        )}
      </Field>
    </div>
  );
}

function NumState({
  label,
  value,
  error,
  stepper,
  ...props
}: {
  label: string;
  value: number;
  error?: string;
  stepper?: boolean;
  disabled?: boolean;
  'data-force'?: string;
}) {
  const [current, setCurrent] = useState<number | null>(value);
  return (
    <Field label={label} error={error}>
      {({ id, describedBy, invalid }) =>
        stepper ? (
          <NumberField
            {...props}
            id={id}
            aria-describedby={describedBy}
            invalid={invalid}
            className={x.w180}
            stepper
            min={1}
            max={12}
            value={current}
            onChange={setCurrent}
          />
        ) : (
          <NumberField
            {...props}
            id={id}
            aria-describedby={describedBy}
            invalid={invalid}
            className={x.w180}
            suffix="%"
            min={0}
            max={100}
            value={current}
            onChange={setCurrent}
          />
        )
      }
    </Field>
  );
}

function Numero() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch">
        <div className={x.stack}>
          <Canais />
          <Frequencia />
        </div>
      </Shot>
      <Shot title="Estados" align="stretch">
        <Grid cols={4}>
          <State label="Repouso">
            <NumState label="Alocação" value={50} />
          </State>
          <State label="Hover">
            <NumState label="Alocação" value={50} data-force="hover" />
          </State>
          <State label="Foco">
            <NumState label="Alocação" value={50} data-force="focus" />
          </State>
          <State label="Inválido">
            <NumState label="Alocação" value={120} error="Máximo 100%" />
          </State>
          <State label="No mínimo">
            <NumState label="Inserções por dia" value={1} stepper />
          </State>
          <State label="No máximo">
            <NumState label="Inserções por dia" value={12} stepper />
          </State>
          <State label="Indisponível">
            <NumState label="Alocação" value={50} disabled />
          </State>
        </Grid>
      </Shot>
    </Shots>
  );
}

/* ═══════════════ Moeda ═══════════════ */

const CPM = 45;
const MIN = 2_025;
const MAX = 45_000;
const REC = 9_000;
const DAYS = 27;
const adjustText = (next: number, reason: MoneyAdjustReason) =>
  `Ajustada para ${moneyBRL(next)} — ${
    reason === 'min'
      ? 'mínimo deste ativo'
      : reason === 'max'
        ? 'máximo deste ativo'
        : `múltiplos de ${moneyBRL(CPM)}`
  }.`;

/** Número que troca por esmaecimento (sem contagem animada). */
function Fade({ children, k }: { children: ReactNode; k: string }) {
  return (
    <span key={k} className={x.fade}>
      {children}
    </span>
  );
}

function Verba() {
  const [budget, setValue] = useState<number | null>(18_000);
  const [notice, flash] = useNotice(4000);
  // Qualquer mudança (digitar, barra, atalho) tira o aviso de ajuste anterior.
  const setBudget = (next: number | null) => {
    setValue(next);
    flash(null);
  };
  const value = budget ?? 0;
  const units = Math.floor(value / CPM + 1e-9) * 1000;
  const bonus = value >= 15_000;
  const withBonus = bonus ? units * 1.2 : units;
  const effective = withBonus ? (value * 0.95) / (withBonus / 1000) : 0;
  const below = budget !== null && budget > 0 && budget < MIN;
  return (
    <div className={x.budget} role="group" aria-label="Verba">
      <div className={x.budgetCols}>
        <div className={x.budgetMain}>
          <Field
            label="Verba planejada"
            required
            notice={notice}
            error={below ? `Abaixo do mínimo ${moneyBRL(MIN)}` : undefined}
            hint={
              <span className={x.hintLines}>
                <span>Digite o valor ou arraste a barra.</span>
                <span>Múltiplos de {moneyBRL(CPM)} — ajustamos ao sair do campo.</span>
              </span>
            }
          >
            {({ id, describedBy, invalid }) => (
              <MoneyField
                id={id}
                aria-describedby={describedBy}
                size="hero"
                invalid={invalid}
                min={MIN}
                max={MAX}
                multiple={CPM}
                value={budget}
                onChange={setBudget}
                onAdjust={(next, _typed, reason) => flash(adjustText(next, reason))}
              />
            )}
          </Field>
        </div>
        <div className={x.outcome}>
          <span className={x.outcomeLabel}>Entrega estimada</span>
          <span className={x.outcomeValue}>
            <Fade k={String(units)}>
              <b>{units ? `≈ ${int(units)}` : '—'}</b>
              {units > 0 && <span> impressões</span>}
            </Fade>
          </span>
          <span className={x.priceLine}>
            <b>CPM</b>
            <em>{moneyBRL(CPM)}</em> por mil impressões
            <Lock aria-label="Definido pelo ativo" />
          </span>
        </div>
      </div>
      <Slider
        label="Ajuste da verba"
        value={budget ?? MIN}
        min={MIN}
        max={MAX}
        step={CPM}
        empty={budget === null}
        format={moneyBRL}
        valueText={
          budget ? `${moneyBRL(budget)} · ≈ ${int(units)} impressões` : 'Sem verba definida'
        }
        marks={[{ value: REC, kind: 'recommended', label: `Recomendado: ${moneyBRL(REC)}` }]}
        ticks={[
          { value: MIN, label: 'Mínimo' },
          { value: REC, label: 'Recomendado', kind: 'recommended' },
          { value: MAX, label: 'Máximo' },
        ]}
        onChange={setBudget}
      />
      <dl className={x.strip}>
        <div>
          <dt>Por dia</dt>
          <dd>
            <Fade k={String(units)}>{units ? `≈ ${int(units / DAYS)}` : '—'}</Fade>
          </dd>
          <small>impressões por dia · {DAYS} dias</small>
        </div>
        <div>
          <dt>Com bônus</dt>
          <dd>
            <Fade k={String(withBonus)}>{withBonus ? `≈ ${int(withBonus)}` : '—'}</Fade>
          </dd>
          <small>{bonus ? '+20% liberado' : `+20% a partir de ${moneyBRL(15_000)}`}</small>
        </div>
        <div>
          <dt>Custo efetivo</dt>
          <dd>
            <Fade k={effective.toFixed(2)}>{effective ? moneyBRL(effective) : '—'}</Fade>
          </dd>
          <small>por mil impressões · −5%</small>
        </div>
      </dl>
    </div>
  );
}

function MoneyState({
  value,
  notice,
  error,
  ...props
}: {
  value: number | null;
  notice?: string;
  error?: string;
  disabled?: boolean;
  'data-force'?: string;
}) {
  const [current, setCurrent] = useState(value);
  return (
    <Field label="Verba planejada" required notice={notice} error={error}>
      {({ id, describedBy, invalid }) => (
        <MoneyField
          {...props}
          id={id}
          aria-describedby={describedBy}
          invalid={invalid}
          value={current}
          onChange={setCurrent}
        />
      )}
    </Field>
  );
}

function Moeda() {
  const [hero, setHero] = useState<number | null>(18_000);
  const [md, setMd] = useState<number | null>(9_000);
  const [sm, setSm] = useState<number | null>(5_000);
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch">
        <Verba />
      </Shot>
      <Shot title="Tamanhos" tone="white" align="stretch">
        <div className={x.moneySizes}>
          <figure className={x.figure}>
            <div className={x.w320}>
              <MoneyField
                size="hero"
                aria-label="Verba planejada"
                value={hero}
                onChange={setHero}
              />
            </div>
            <figcaption>Herói · 56</figcaption>
          </figure>
          <figure className={x.figure}>
            <div className={x.w240}>
              <MoneyField aria-label="Verba do canal" value={md} onChange={setMd} />
            </div>
            <figcaption>Padrão · 36</figcaption>
          </figure>
          <figure className={x.figure}>
            <div className={x.toolbar}>
              <span className={x.toolLabel} id="fa-min">
                Verba mín.
              </span>
              <div className={x.w160}>
                <MoneyField size="sm" aria-labelledby="fa-min" value={sm} onChange={setSm} />
              </div>
            </div>
            <figcaption>Filtro · 32</figcaption>
          </figure>
        </div>
      </Shot>
      <Shot title="Estados" align="stretch">
        <Grid cols={4}>
          <State label="Vazio">
            <MoneyState value={null} />
          </State>
          <State label="Hover">
            <MoneyState value={null} data-force="hover" />
          </State>
          <State label="Foco">
            <MoneyState value={18_000} data-force="focus" />
          </State>
          <State label="Preenchido">
            <MoneyState value={18_000} />
          </State>
          <State label="Ajustado">
            <MoneyState value={2_025} notice={adjustText(2_025, 'min')} />
          </State>
          <State label="Inválido">
            <MoneyState value={1_800} error={`Abaixo do mínimo ${moneyBRL(MIN)}`} />
          </State>
          <State label="Indisponível">
            <MoneyState value={9_000} disabled />
          </State>
        </Grid>
      </Shot>
    </Shots>
  );
}

/* ═══════════════ Busca ═══════════════ */

type Row = { n: string; name: string; advertiser: string; status: string; tone: Tone };
const LIST: Row[] = [
  {
    n: '2041',
    name: 'Coleção Primavera-Verão 2027',
    advertiser: 'Aurora Calçados',
    status: 'Veiculando',
    tone: 'green',
  },
  {
    n: '2038',
    name: 'Newsletter dos expositores',
    advertiser: 'Estúdio Norte',
    status: 'Aprovada',
    tone: 'teal',
  },
  {
    n: '2035',
    name: 'Linha couro natural',
    advertiser: 'Pátio Couro',
    status: 'Aguardando aprovação',
    tone: 'violet',
  },
  {
    n: '2029',
    name: 'Lançamento bolsas inverno',
    advertiser: 'Lume Acessórios',
    status: 'Ajustes solicitados',
    tone: 'orange',
  },
  {
    n: '2014',
    name: 'Vitrine Casa Forma',
    advertiser: 'Casa Forma',
    status: 'Rascunho',
    tone: 'gray',
  },
  {
    n: '2008',
    name: 'Calçado infantil na feira',
    advertiser: 'Bella Passo',
    status: 'Aguardando assinatura do P.I.',
    tone: 'amber',
  },
];

function ListaBusca() {
  const [query, setQuery] = useState('');
  const [applied, setApplied] = useState('');
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  // Digitar → 200 ms de espera → “consulta” de 550 ms. A lupa só vira spinner depois de 300 ms.
  useEffect(() => {
    if (query === applied) return;
    const timer = window.setTimeout(() => {
      setLoading(true);
      window.setTimeout(() => {
        setApplied(query);
        setLoading(false);
      }, 550);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [query, applied]);

  const term = applied.trim().replace(/^#/, '');
  const needle = fold(term);
  const rows = needle
    ? LIST.filter((row) => fold(`${row.name} ${row.advertiser} ${row.n}`).includes(needle))
    : LIST;
  const clear = () => {
    setQuery('');
    setApplied('');
    ref.current?.focus();
  };

  return (
    <div className={x.list}>
      <div className={x.listBar}>
        <span className={x.listTitle}>
          Campanhas <span className={x.listCount}>{rows.length}</span>
        </span>
        <div className={x.searchSlot}>
          <SearchField
            ref={ref}
            size="sm"
            value={query}
            onValueChange={setQuery}
            loading={loading}
            shortcut="/"
            hotkey="/"
            placeholder="Campanha, anunciante ou nº"
            label="Buscar por nome, anunciante ou número"
          />
        </div>
      </div>
      <ul className={x.rows2} key={applied} aria-live="polite">
        {rows.map((row, index) => (
          <li key={row.n} className={x.li} style={{ '--i': Math.min(index, 5) } as CSSProperties}>
            <BrandMark name={row.advertiser} variant="soft" size="sm" decorative />
            <span className={x.liMain}>
              <span className={x.liName}>
                <Highlight text={row.name} query={term} />
              </span>
              <span className={x.liMeta}>
                <span className={x.liNum}>
                  #<Highlight text={row.n} query={term} />
                </span>
                {' · '}
                <Highlight text={row.advertiser} query={term} />
              </span>
            </span>
            <Badge tone={row.tone} variant="text" size="sm">
              {row.status}
            </Badge>
          </li>
        ))}
        {!rows.length && (
          <li className={x.empty}>
            <span>Nada encontrado para “{applied.trim()}”</span>
            <LinkButton onClick={clear}>Limpar busca</LinkButton>
          </li>
        )}
      </ul>
    </div>
  );
}

const NAV: { group: string; items: { label: string; icon: LucideIcon; count?: number }[] }[] = [
  {
    group: 'Operação',
    items: [
      { label: 'Campanhas', icon: Megaphone, count: 5 },
      { label: 'Pedidos de Inserção', icon: FileSignature },
      { label: 'Leads', icon: UsersRound, count: 2 },
    ],
  },
  {
    group: 'Configuração',
    items: [
      { label: 'Métricas', icon: BarChart3 },
      { label: 'Canais', icon: Radio },
      { label: 'Públicos', icon: UsersRound },
      { label: 'Inventário', icon: Boxes },
      { label: 'Bônus', icon: Gift },
    ],
  },
];

function MenuBusca() {
  const [query, setQuery] = useState('');
  const needle = fold(query.trim());
  const groups = NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => !needle || fold(item.label).includes(needle)),
  })).filter((group) => group.items.length);
  return (
    <nav className={x.side} aria-label="Menu">
      <SearchField
        variant="quiet"
        size="sm"
        value={query}
        onValueChange={setQuery}
        placeholder="Buscar no menu…"
        label="Buscar no menu"
      />
      <div className={x.sideGroups}>
        {groups.map((group) => (
          <div key={group.group} className={x.sideGroup}>
            <span className={x.sideLabel}>{group.group}</span>
            {group.items.map((item) => {
              const Icon = item.icon;
              const current = item.label === 'Campanhas';
              return (
                <a
                  key={item.label}
                  href="#busca"
                  className={x.navItem}
                  aria-current={current ? 'page' : undefined}
                  onClick={(event) => event.preventDefault()}
                >
                  <Icon aria-hidden="true" />
                  <span>
                    <Highlight text={item.label} query={query} />
                  </span>
                  {item.count && <span className={x.navCount}>{item.count}</span>}
                </a>
              );
            })}
          </div>
        ))}
        {!groups.length && <p className={x.sideEmpty}>Nada encontrado</p>}
      </div>
    </nav>
  );
}

function SearchState({
  value = '',
  loading,
  empty,
  disabled,
  ...props
}: {
  value?: string;
  loading?: boolean;
  empty?: boolean;
  disabled?: boolean;
  'data-force'?: string;
}) {
  const [current, setCurrent] = useState(value);
  return (
    <div className={x.searchState}>
      <SearchField
        {...props}
        value={current}
        onValueChange={setCurrent}
        loading={loading}
        disabled={disabled}
        shortcut="/"
        placeholder="Campanha ou anunciante"
        label="Buscar campanhas"
      />
      {empty && <span className={x.searchEmpty}>Nada encontrado</span>}
    </div>
  );
}

function Busca() {
  return (
    <Shots>
      <Shot title="Lista" tone="white" align="stretch">
        <ListaBusca />
      </Shot>
      <Shot title="Menu lateral" pad="lg">
        <MenuBusca />
      </Shot>
      <Shot title="Estados" align="stretch">
        <Grid cols={4}>
          <State label="Vazio">
            <SearchState />
          </State>
          <State label="Hover">
            <SearchState data-force="hover" />
          </State>
          <State label="Foco">
            <SearchState data-force="focus" />
          </State>
          <State label="Com termo">
            <SearchState value="aurora" />
          </State>
          <State label="Buscando">
            <SearchState value="aurora" loading />
          </State>
          <State label="Sem resultado">
            <SearchState value="couro azul" empty />
          </State>
          <State label="Indisponível">
            <SearchState disabled />
          </State>
        </Grid>
      </Shot>
    </Shots>
  );
}

/* ═══════════════ Código ═══════════════ */

const RIGHT_CODE = '482915';

function Confirmar() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<CodeStatus>('idle');
  const [left, setLeft] = useState(42);

  useEffect(() => {
    if (left <= 0) return;
    const timer = window.setTimeout(() => setLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [left]);

  async function verify(value: string) {
    setStatus('verifying');
    await wait(900);
    setStatus(value === RIGHT_CODE ? 'valid' : 'invalid');
  }

  return (
    <div className={`${x.card} ${x.cardWide}`} aria-labelledby="fa-verify" role="group">
      <header className={x.cardHead}>
        <h3 id="fa-verify" className={x.cardTitle}>
          Confirme seu e-mail
        </h3>
        <p className={x.cardMeta}>
          Enviamos um código para <b>m***@aurora.com.br</b>
        </p>
      </header>
      <CodeInput
        value={code}
        status={status}
        message={status === 'valid' ? 'E-mail confirmado' : undefined}
        onChange={(next) => {
          setCode(next);
          if (status === 'invalid' || status === 'valid') setStatus('idle');
        }}
        onComplete={verify}
      />
      {status !== 'valid' && (
        <LinkButton
          disabled={left > 0}
          className={x.resend}
          onClick={() => {
            setLeft(59);
            setCode('');
            setStatus('idle');
          }}
        >
          {left > 0 ? `Reenviar em 0:${String(left).padStart(2, '0')}` : 'Reenviar código'}
        </LinkButton>
      )}
    </div>
  );
}

function CodeState({
  value = '',
  status,
  disabled,
  force,
}: {
  value?: string;
  status?: CodeStatus;
  disabled?: boolean;
  force?: string;
}) {
  const [current, setCurrent] = useState(value);
  return (
    <CodeInput
      value={current}
      onChange={setCurrent}
      status={status}
      disabled={disabled}
      data-force={force}
      label="Código de verificação"
    />
  );
}

function Codigo() {
  return (
    <Shots>
      <Shot title="Em contexto" pad="lg">
        <Confirmar />
      </Shot>
      <Shot title="Estados" align="stretch">
        <div className={x.codeGrid}>
          <State label="Vazio">
            <CodeState />
          </State>
          <State label="Hover">
            <CodeState force="hover" />
          </State>
          <State label="Foco">
            <CodeState force="focus" />
          </State>
          <State label="Preenchido">
            <CodeState value="4829" force="focus" />
          </State>
          <State label="Verificando">
            <CodeState value={RIGHT_CODE} status="verifying" />
          </State>
          <State label="Inválido">
            <CodeState value="123456" status="invalid" />
          </State>
          <State label="Válido">
            <CodeState value={RIGHT_CODE} status="valid" />
          </State>
          <State label="Indisponível">
            <CodeState disabled />
          </State>
        </div>
      </Shot>
    </Shots>
  );
}

/* ═══════════════ Validação ═══════════════ */

const ADVERTISERS = [
  'Aurora Calçados',
  'Estúdio Norte',
  'Casa Forma',
  'Lume Acessórios',
  'Pátio Couro',
].map((name) => ({
  value: name,
  label: name,
  leading: <BrandMark name={name} size="xs" variant="soft" decorative />,
}));

type IdForm = { name: string; advertiser: string; start: string; end: string };
const MESSAGES: Record<keyof IdForm, string> = {
  name: 'Informe o nome',
  advertiser: 'Selecione o anunciante',
  start: 'Escolha o início',
  end: 'Escolha o término',
};
const check = (form: IdForm, key: keyof IdForm) => {
  if (!form[key].trim()) return MESSAGES[key];
  if (key === 'end' && form.start && form.end < form.start) return 'Término antes do início';
  return '';
};

function useValidated<F extends Record<string, string>>(
  form: F,
  validate: (key: keyof F, form: F) => string,
) {
  type K = keyof F;
  const [errors, setErrors] = useState<Partial<Record<K, string>>>({});
  // Campos sinalizados no último envio: guardam a linha do erro até o próximo envio (nada pula).
  const [flagged, setFlagged] = useState<K[]>([]);
  const [submits, setSubmits] = useState(0);
  const update = (key: K, latest: F, onlyClear: boolean) =>
    setErrors((current) => {
      if (!current[key]) return current;
      const message = validate(key, latest);
      if (message === current[key] || (message && onlyClear)) return current;
      const next = { ...current };
      if (message) next[key] = message;
      else delete next[key];
      return next;
    });
  return {
    errors,
    submits,
    count: Object.keys(errors).length,
    reserved: (key: K) => flagged.includes(key),
    /** Envio: revela tudo de uma vez e conta mais um envio. Retorna a primeira chave inválida. */
    reveal() {
      const next: Partial<Record<K, string>> = {};
      (Object.keys(form) as K[]).forEach((key) => {
        const message = validate(key, form);
        if (message) next[key] = message;
      });
      setErrors(next);
      setFlagged(Object.keys(next) as K[]);
      setSubmits((value) => value + 1);
      return (Object.keys(next) as K[])[0];
    },
    /** Ao sair do campo (ou ao escolher): o erro deste campo some ou troca. Nunca acusa antes do envio. */
    settle(key: K, latest: F = form) {
      update(key, latest, false);
    },
    /** Enquanto digita: só tira o erro quando o valor passa a valer (não troca a mensagem no meio). */
    clear(key: K, latest: F) {
      update(key, latest, true);
    },
  };
}

/** Situação à esquerda do rodapé: erros da etapa (como na criação de campanha) ou rascunho salvo. */
function FootStatus({ errors = 0, saved }: { errors?: number; saved: boolean }) {
  return (
    <span className={x.saveStatus} role="status">
      {errors > 0 ? (
        <ErrorCount count={errors} />
      ) : (
        saved && (
          <span className={x.saved} key="saved">
            <CircleCheck aria-hidden="true" />
            Rascunho salvo agora
          </span>
        )
      )}
    </span>
  );
}

function Etapa() {
  const [form, setForm] = useState<IdForm>({ name: '', advertiser: '', start: '', end: '' });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const v = useValidated(form, (key, latest) => check(latest, key));
  const ids = { name: 'fa-v-name', advertiser: 'fa-v-adv', start: 'fa-v-start', end: 'fa-v-end' };
  const days = daysBetween(form.start, form.end);

  async function next() {
    setSaved(false);
    const first = v.reveal();
    // Igual à criação: o foco vai ao primeiro campo sinalizado; a contagem fica no rodapé.
    if (first) return focusField(ids[first]);
    setBusy(true);
    await wait(400);
    setBusy(false);
    setSaved(true);
  }

  const patch = (change: Partial<IdForm>, settle?: (keyof IdForm)[], clear?: keyof IdForm) => {
    const next = { ...form, ...change };
    setForm(next);
    setSaved(false);
    // Select e datas não têm “sair do campo” útil: a correção vale ao escolher.
    settle?.forEach((key) => v.settle(key, next));
    if (clear) v.clear(clear, next);
  };

  return (
    <div className={x.frame}>
      <div className={x.frameBody}>
        <h3 className={x.panelTitle}>Identificação</h3>
        <div className={x.form2}>
          <Field
            label="Nome da campanha"
            required
            error={v.errors.name}
            reserveHint={v.reserved('name')}
            id={ids.name}
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                placeholder="Ex.: Lançamento coleção verão"
                value={form.name}
                onChange={(event) => patch({ name: event.target.value }, undefined, 'name')}
                onBlur={() => v.settle('name')}
              />
            )}
          </Field>
          <Field
            label="Anunciante"
            required
            error={v.errors.advertiser}
            reserveHint={v.reserved('advertiser')}
            id={ids.advertiser}
          >
            {({ id, describedBy, invalid }) => (
              <Select
                id={id}
                describedBy={describedBy}
                invalid={invalid}
                searchable
                placeholder="Selecione o anunciante"
                value={form.advertiser}
                onChange={(advertiser) => patch({ advertiser }, ['advertiser'])}
                options={ADVERTISERS}
              />
            )}
          </Field>
        </div>
        <FieldGroup
          label="Período de veiculação"
          meta={days > 0 ? `${days} dias` : undefined}
          columns={2}
        >
          <Field
            label="Início"
            required
            error={v.errors.start}
            reserveHint={v.reserved('start')}
            id={ids.start}
          >
            {({ id, describedBy, invalid }) => (
              <DatePicker
                id={id}
                describedBy={describedBy}
                invalid={invalid}
                value={form.start}
                onChange={(start) => patch({ start }, ['start', 'end'])}
              />
            )}
          </Field>
          <Field
            label="Término"
            required
            error={v.errors.end}
            reserveHint={v.reserved('end')}
            id={ids.end}
          >
            {({ id, describedBy, invalid }) => (
              <DatePicker
                id={id}
                describedBy={describedBy}
                invalid={invalid}
                value={form.end}
                min={form.start || undefined}
                onChange={(end) => patch({ end }, ['end'])}
              />
            )}
          </Field>
        </FieldGroup>
      </div>
      <footer className={x.frameFoot}>
        <FootStatus errors={v.count} saved={saved} />
        <Button
          variant="primary"
          trailingIcon={ArrowRight}
          loading={busy}
          onClick={next}
          className={x.main}
        >
          Continuar
        </Button>
      </footer>
    </div>
  );
}

type DraftForm = { title: string; url: string };
const DRAFT_LABELS: Record<keyof DraftForm, string> = {
  title: 'Título da peça',
  url: 'URL de destino',
};

function Rascunho() {
  const [form, setForm] = useState<DraftForm>({ title: '', url: '' });
  const [busy, setBusy] = useState<'save' | 'send' | null>(null);
  const [saved, setSaved] = useState(false);
  const keys = Object.keys(DRAFT_LABELS) as (keyof DraftForm)[];
  const v = useValidated(form, (key, latest) =>
    !latest[key].trim()
      ? key === 'title'
        ? 'Informe o título'
        : 'Informe a URL'
      : key === 'url' && !URL_RE.test(latest.url.trim().replace(/^https?:\/\//, ''))
        ? 'URL inválida'
        : '',
  );
  const ids = { title: 'fa-d-title', url: 'fa-d-url' };
  const list: FormError[] = keys
    .filter((key) => v.errors[key])
    .map((key) => ({ id: ids[key], label: DRAFT_LABELS[key], message: v.errors[key] ?? '' }));

  async function save() {
    setBusy('save');
    await wait(400);
    setBusy(null);
    setSaved(true);
  }
  async function send() {
    setSaved(false);
    if (v.reveal()) return;
    setBusy('send');
    await wait(600);
    setBusy(null);
    setSaved(true);
  }
  const patch = (key: keyof DraftForm, value: string) => {
    const next = { ...form, [key]: value };
    setForm(next);
    setSaved(false);
    v.clear(key, next);
  };

  return (
    <div className={x.frame}>
      <div className={x.frameBody}>
        <h3 className={x.panelTitle}>Briefing</h3>
        {/* Foto do último envio: corrigir um campo risca a linha, mas o bloco não muda de altura. */}
        <ErrorSummary errors={list} focusKey={v.submits || undefined} />
        <div className={x.form2}>
          <Field
            label="Título da peça"
            required
            error={v.errors.title}
            reserveHint={v.reserved('title')}
            id={ids.title}
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                value={form.title}
                onChange={(event) => patch('title', event.target.value)}
                onBlur={() => v.settle('title')}
              />
            )}
          </Field>
          <Field
            label="URL de destino"
            required
            error={v.errors.url}
            reserveHint={v.reserved('url')}
            id={ids.url}
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                prefix="https://"
                placeholder="aurora.com.br/verao"
                value={form.url}
                onChange={(event) => patch('url', event.target.value)}
                onBlur={() => v.settle('url')}
              />
            )}
          </Field>
        </div>
      </div>
      <footer className={x.frameFoot}>
        <FootStatus saved={saved} />
        <Button loading={busy === 'save'} onClick={save}>
          Salvar rascunho
        </Button>
        <Button variant="primary" loading={busy === 'send'} onClick={send} className={x.main}>
          Enviar para aprovação
        </Button>
      </footer>
    </div>
  );
}

const SAMPLE_ERRORS: FormError[] = [
  { id: 'fa-x-adv', label: 'Anunciante', message: 'Selecione o anunciante' },
  { id: 'fa-x-end', label: 'Término', message: 'Escolha o término' },
];

function Validacao() {
  return (
    <Shots>
      <Shot title="Etapa" tone="white" align="stretch" pad="none">
        <Etapa />
      </Shot>
      <Shot title="Rascunho" tone="white" align="stretch" pad="none">
        <Rascunho />
      </Shot>
      <Shot title="Estados" align="stretch">
        <Grid cols={2}>
          <State label="Campo inválido">
            <NameField error="Informe o nome" />
          </State>
          <State label="Campo corrigido">
            <NameField value="Coleção verão 2027" />
          </State>
          <State label="Resumo">
            <div className={x.fill}>
              <ErrorSummary errors={SAMPLE_ERRORS} />
            </div>
          </State>
          <State label="Resumo em revisão">
            <div className={x.fill}>
              <ErrorSummary
                errors={SAMPLE_ERRORS.map((error, index) => ({ ...error, resolved: index === 0 }))}
              />
            </div>
          </State>
          <State label="Rodapé com erros">
            <div className={x.footSample}>
              <FootStatus errors={2} saved={false} />
              <Button variant="primary" trailingIcon={ArrowRight} className={x.main}>
                Continuar
              </Button>
            </div>
          </State>
          <State label="Salvo">
            <div className={x.footSample}>
              <FootStatus saved />
              <Button variant="primary" trailingIcon={ArrowRight} className={x.main}>
                Continuar
              </Button>
            </div>
          </State>
        </Grid>
      </Shot>
    </Shots>
  );
}

export const specimens: Record<string, ComponentType> = {
  campo: Campo,
  input: CampoTexto,
  textarea: AreaTexto,
  senha: Senha,
  numero: Numero,
  moeda: Moeda,
  busca: Busca,
  codigo: Codigo,
  validacao: Validacao,
};
