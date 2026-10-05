'use client';

/*
 * Fundamentos — pranchas do grupo (princípios, cor, tipo, espaço, grade, bordas, elevação, ícones,
 * movimento, temas, acessibilidade e conteúdo). Cada prancha mostra o fundamento vivo, com legenda
 * de 1–3 palavras. Valores de cor e contraste são lidos do tema em tempo real (nada declarado à mão).
 */

import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Boxes,
  CalendarDays,
  ChartColumn,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Copy,
  Download,
  Ellipsis,
  FileText,
  Gift,
  Info,
  ListFilter,
  Megaphone,
  Menu as MenuGlyph,
  Paperclip,
  Pause,
  Pencil,
  Play,
  Plus,
  RadioTower,
  RotateCcw,
  Search,
  Send,
  Settings,
  Store,
  Trash2,
  Upload,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  Avatar,
  Badge,
  BrandMark,
  BulkBar,
  Button,
  Checkbox,
  ChoiceCard,
  Dialog,
  Field,
  IconButton,
  Input,
  Kbd,
  MenuPanel,
  Segmented,
  Switch,
  Tabs,
  ToastCard,
  type Tone,
} from '@content-ventures/design-system/v3';
import { useAnnouncer } from '@content-ventures/design-system/v3/a11y';
import { Drawer } from '@content-ventures/design-system/v3/drawer';
import { KanbanPlaceholder, LeadCard } from '@content-ventures/design-system/v3/kanban';
import { Select } from '@content-ventures/design-system/v3/select';
import { Phone } from '../stage';
import f from './fundamentos.module.css';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/* ————————————————————————————————————————————————————————————————
 * Moldura das pranchas (local: palco chapado, título curto, legendas curtas)
 * ———————————————————————————————————————————————————————————————— */

function Board({ children, boardRef }: { children: ReactNode; boardRef?: RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={boardRef} className={f.board} data-fund="">
      {children}
    </div>
  );
}

function Shot({
  title,
  aside,
  tone = 'canvas',
  pad = 'md',
  children,
}: {
  title: string;
  aside?: ReactNode;
  tone?: 'canvas' | 'white';
  pad?: 'md' | 'sm' | 'none';
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section className={f.shot} aria-labelledby={id}>
      <header className={f.shotHead}>
        <h2 id={id} className={f.shotTitle}>
          {title}
        </h2>
        {aside && <div className={f.shotAside}>{aside}</div>}
      </header>
      <div className={f.stage} data-tone={tone} data-pad={pad}>
        {children}
      </div>
    </section>
  );
}

/** Amostra + legenda de 1–3 palavras embaixo. */
function Sample({
  caption,
  children,
  align = 'center',
  className = '',
}: {
  caption: ReactNode;
  children: ReactNode;
  align?: 'center' | 'start';
  className?: string;
}) {
  return (
    <figure className={`${f.sample} ${className}`} data-align={align}>
      <div className={f.sampleBody}>{children}</div>
      <figcaption className={f.cap}>{caption}</figcaption>
    </figure>
  );
}

/** Marcador certo/errado: só o sinal, 14 px, tinta de status. */
function Verdict({ ok, size = 14 }: { ok: boolean; size?: number }) {
  const Icon = ok ? Check : X;
  return (
    <Icon
      className={f.verdict}
      data-ok={ok || undefined}
      width={size}
      height={size}
      role="img"
      aria-label={ok ? 'Certo' : 'Evitar'}
    />
  );
}

/** Rótulo de medida (px) sobre desenho técnico. */
function Dim({ children, tone = 'line', className = '' }: { children: ReactNode; tone?: 'line' | 'blue'; className?: string }) {
  return (
    <span className={`${f.dim} ${className}`} data-tone={tone}>
      {children}
    </span>
  );
}

/* ————————————————————————————————————————————————————————————————
 * Cor: valores reais do tema e contraste calculado
 * ———————————————————————————————————————————————————————————————— */

/** Espelho do tema para a primeira pintura; ao montar, cada valor é relido do CSS. */
const HEX: Record<string, string> = {
  'g-0': '#ffffff',
  'g-25': '#fafbfc',
  'g-50': '#f6f7f9',
  'g-75': '#f1f3f6',
  'g-100': '#ebedf1',
  'g-150': '#e3e6eb',
  'g-200': '#d8dce3',
  'g-300': '#c0c6d0',
  'g-400': '#9aa1ae',
  'g-500': '#747c8b',
  'g-600': '#5a6272',
  'g-700': '#424958',
  'g-800': '#2c323e',
  'g-900': '#191d27',
  'g-950': '#10131a',
  'b-25': '#f5faff',
  'b-50': '#eef6ff',
  'b-100': '#dfeeff',
  'b-200': '#c4e0fb',
  'b-300': '#94c9fa',
  'b-400': '#4fa6f7',
  'b-500': '#1a8cf5',
  'b-600': '#0875db',
  'b-700': '#0869c4',
  'b-800': '#0a559c',
  'b-900': '#0c4477',
  'green-bg': '#ecf8f1',
  'green-line': '#cdeedb',
  'green-dot': '#1fa463',
  'green-ink': '#137046',
  'teal-bg': '#eaf8f8',
  'teal-line': '#c9ecee',
  'teal-dot': '#14a3ad',
  'teal-ink': '#0b7178',
  'violet-bg': '#f4f1ff',
  'violet-line': '#e2dafd',
  'violet-dot': '#7c5cf0',
  'violet-ink': '#5d3fcf',
  'amber-bg': '#fff5e3',
  'amber-line': '#fbe3b4',
  'amber-dot': '#e8950f',
  'amber-ink': '#935700',
  'orange-bg': '#fff1ea',
  'orange-line': '#fdd9c6',
  'orange-dot': '#f0662a',
  'orange-ink': '#b1421a',
  'red-bg': '#fdeff0',
  'red-line': '#f8d3d6',
  'red-dot': '#e0444f',
  'red-ink': '#b92a36',
  'gray-bg': '#f1f3f6',
  'gray-line': '#e3e6eb',
  'gray-dot': '#9aa1ae',
  'gray-ink': '#5a6272',
  'blue-bg': '#eef6ff',
  'blue-line': '#dfeeff',
  'blue-dot': '#1a8cf5',
  'blue-ink': '#0869c4',
  canvas: '#f3f4f7',
  paper: '#ffffff',
  'paper-sunken': '#f6f7f9',
  line: '#e7e9ed',
  'line-soft': '#f0f1f4',
  'line-strong': '#dfe2e7',
  'line-hover': '#d2d6dd',
  ink: '#141824',
  text: '#3a4151',
  muted: '#697181',
  subtle: '#99a0ad',
  accent: '#0875db',
  'accent-hover': '#0869c4',
  'accent-pressed': '#0a559c',
  'accent-ink': '#0869c4',
  'focus-color': '#1a8cf5',
  'select-bg': '#f5faff',
  'select-line': '#94c9fa',
  'nav-active-bg': '#dfeeff',
};

function toHex(value: string): string | null {
  const v = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(v)) return v;
  if (/^#[0-9a-f]{3}$/.test(v)) return `#${[...v.slice(1)].map((c) => c + c).join('')}`;
  const m = v.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/);
  if (!m) return null;
  return `#${[m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('')}`;
}

/** Valores de cor do tema, relidos do CSS ao montar (o que está na tela é o que a prancha diz). */
function useLiveHex() {
  const ref = useRef<HTMLDivElement>(null);
  const [hex, setHex] = useState(HEX);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const style = getComputedStyle(el);
    const next: Record<string, string> = {};
    let changed = false;
    for (const [token, fallback] of Object.entries(HEX)) {
      const live = toHex(style.getPropertyValue(`--${token}`)) ?? fallback;
      next[token] = live;
      if (live !== fallback) changed = true;
    }
    if (changed) setHex(next);
  }, []);
  return { ref, hex };
}

function channel(c: number) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
function luminance(hex: string) {
  const n = toHex(hex) ?? '#000000';
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => channel(parseInt(n.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
const ratioText = (ratio: number) => `${(Math.floor(ratio * 10) / 10).toFixed(1).replace('.', ',')}:1`;
const levelOf = (ratio: number) => (ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA grande' : 'Falha');

/* Cópia com retorno no próprio controle (sem toast) e aviso para leitor de tela. */
async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
}
function useCopy(ms = 1200) {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const { announce, region } = useAnnouncer();
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = useCallback(
    async (key: string, text: string) => {
      await writeClipboard(text);
      setCopied(key);
      announce(`${text} copiado`);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(null), ms);
    },
    [announce, ms],
  );
  return { copied, copy, region };
}

/* ————————————————————————————————————————————————————————————————
 * Princípios
 * ———————————————————————————————————————————————————————————————— */

function Principle({ caption, children }: { caption: ReactNode; children: ReactNode }) {
  return (
    <figure className={f.principle}>
      <div className={f.principleBody}>{children}</div>
      <figcaption className={f.principleCap}>{caption}</figcaption>
    </figure>
  );
}

function Principios() {
  return (
    <Board>
      <Shot title="Seis decisões">
        <div className={f.principleGrid}>
          <Principle caption="Chapado">
            <div className={f.inline}>
              <Button icon={Download}>Exportar</Button>
              <Button variant="primary" icon={Plus}>
                Nova campanha
              </Button>
            </div>
          </Principle>
          <Principle caption="Fio, não sombra">
            <div className={f.miniTable}>
              <div className={f.miniHead}>
                <span>Campanha</span>
                <span>Verba</span>
              </div>
              <div className={f.miniRow}>
                <span>Coleção Primavera</span>
                <span className={f.num}>R$ 18.000,00</span>
              </div>
              <div className={f.miniRow}>
                <span>Guia do visitante</span>
                <span className={f.num}>R$ 12.000,00</span>
              </div>
            </div>
          </Principle>
          <Principle caption="Um azul por área">
            <div className={f.inline}>
              <Button icon={ArrowLeft}>Voltar</Button>
              <Button variant="primary" trailingIcon={ArrowRight}>
                Continuar
              </Button>
            </div>
          </Principle>
          <Principle caption="Ponto + palavra">
            <div className={f.stack}>
              <Badge variant="text" tone="green" live>
                Veiculando
              </Badge>
              <Badge variant="text" tone="orange">
                Ajustes solicitados
              </Badge>
              <Badge variant="text" tone="gray">
                Rascunho
              </Badge>
            </div>
          </Principle>
          <Principle caption="Números tabulares">
            <div className={f.sumColumn}>
              <span>R$ 18.000,00</span>
              <span>R$ 3.600,00</span>
              <span>R$ 13.500,00</span>
              <span data-total="">R$ 35.100,00</span>
            </div>
          </Principle>
          <Principle caption="Sem iniciais">
            <div className={f.stack} data-gap="10">
              <span className={f.who}>
                <Avatar name="Marina Lopes" size="sm" decorative />
                Marina Lopes
              </span>
              <span className={f.who}>
                <BrandMark name="Aurora Calçados" size="sm" variant="soft" decorative />
                Aurora Calçados
              </span>
            </div>
          </Principle>
        </div>
      </Shot>

      <Shot title="Não">
        <div className={f.dontGrid}>
          <Principle
            caption={
              <span className={f.verdictCap}>
                <Verdict ok={false} size={12} />
                Degradê e volume
              </span>
            }
          >
            <span className={f.badButton} role="img" aria-label="Botão com degradê e brilho">
              Nova campanha
            </span>
          </Principle>
          <Principle
            caption={
              <span className={f.verdictCap}>
                <Verdict ok={false} size={12} />
                Iniciais
              </span>
            }
          >
            <span className={f.who}>
              <span className={f.badInitials} role="img" aria-label="Círculo com iniciais">
                ML
              </span>
              Marina Lopes
            </span>
          </Principle>
          <Principle
            caption={
              <span className={f.verdictCap}>
                <Verdict ok={false} size={12} />
                Sombra em repouso
              </span>
            }
          >
            <div className={f.badShadow} role="img" aria-label="Painel com sombra e sem fio">
              <span>Impressões</span>
              <strong className={f.num}>271.400</strong>
            </div>
          </Principle>
        </div>
      </Shot>
    </Board>
  );
}

/* ————————————————————————————————————————————————————————————————
 * Cores
 * ———————————————————————————————————————————————————————————————— */

type Role = { token: string; alias?: string };
const ROLE_GROUPS: { label: string; roles: Role[] }[] = [
  {
    label: 'Superfície',
    roles: [
      { token: 'paper' },
      { token: 'g-25' },
      { token: 'paper-sunken', alias: 'g-50' },
      { token: 'g-75' },
      { token: 'canvas' },
    ],
  },
  { label: 'Fio', roles: [{ token: 'line' }, { token: 'line-soft' }, { token: 'line-strong' }, { token: 'line-hover' }] },
  { label: 'Texto', roles: [{ token: 'ink' }, { token: 'text' }, { token: 'muted' }, { token: 'subtle' }] },
  {
    label: 'Ação',
    roles: [
      { token: 'accent', alias: 'b-600' },
      { token: 'accent-hover', alias: 'b-700' },
      { token: 'accent-pressed', alias: 'b-800' },
      { token: 'focus-color', alias: 'b-500' },
    ],
  },
];

function RoleChip({
  role,
  hex,
  copied,
  onCopy,
}: {
  role: Role;
  hex: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <button
      type="button"
      className={f.roleChip}
      data-copied={copied || undefined}
      onClick={onCopy}
      aria-label={`${role.token}, ${hex}. Copiar var(--${role.token})`}
    >
      <span className={f.roleSwatch} style={{ background: `var(--${role.token})` }} />
      <span className={f.roleText}>
        <span className={f.roleName}>
          {copied ? (
            <>
              <Check aria-hidden="true" />
              Copiado
            </>
          ) : (
            role.token
          )}
        </span>
        <span className={f.roleHex}>
          {role.alias && `${role.alias} · `}
          {hex}
        </span>
      </span>
      <Copy className={f.copyHint} aria-hidden="true" />
    </button>
  );
}

const NEUTRAL_STEPS = ['0', '25', '50', '75', '100', '150', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
const BLUE_STEPS = ['25', '50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

function Ramp({
  label,
  prefix,
  steps,
  hex,
  mark,
  copied,
  onCopy,
}: {
  label: string;
  prefix: string;
  steps: string[];
  hex: Record<string, string>;
  mark?: { step: string; label: string };
  copied: string | null;
  onCopy: (token: string) => void;
}) {
  return (
    <div className={f.rampBlock}>
      <span className={f.groupLabel}>{label}</span>
      <div className={f.ramp} role="list" style={{ '--steps': steps.length } as CSSProperties}>
        {steps.map((step) => {
          const token = `${prefix}-${step}`;
          const value = hex[token] ?? '';
          const isCopied = copied === token;
          return (
            <div key={step} role="listitem" className={f.rampItem}>
              <span className={f.rampMark}>{mark?.step === step ? mark.label : ''}</span>
              <button
                type="button"
                className={f.rampCell}
                data-dark={luminance(value) < 0.3 || undefined}
                data-copied={isCopied || undefined}
                style={{ background: `var(--${token})` }}
                onClick={() => onCopy(token)}
                aria-label={`${token}, ${value}. Copiar var(--${token})`}
              >
                {isCopied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              </button>
              <span className={f.rampStep}>{step}</span>
              <span className={f.rampHex}>{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const TONE_COLUMNS: { tone: Tone; label: string }[] = [
  { tone: 'green', label: 'Veiculando' },
  { tone: 'teal', label: 'Aprovada' },
  { tone: 'violet', label: 'Aguardando' },
  { tone: 'amber', label: 'Assinatura' },
  { tone: 'orange', label: 'Ajustes' },
  { tone: 'red', label: 'Rejeitada' },
  { tone: 'gray', label: 'Rascunho' },
  /* Azul nunca é status de registro: só o alerta informativo. */
  { tone: 'blue', label: 'Alerta info' },
];
const TONE_PARTS = ['bg', 'line', 'dot', 'ink'] as const;

const PRODUCT_STATUS: { label: string; tone: Tone; live?: boolean }[] = [
  { label: 'Rascunho', tone: 'gray' },
  { label: 'Aguardando aprovação', tone: 'violet' },
  { label: 'Ajustes solicitados', tone: 'orange' },
  { label: 'Aguardando assinatura do P.I.', tone: 'amber' },
  { label: 'Aprovada', tone: 'teal' },
  { label: 'Veiculando', tone: 'green', live: true },
  { label: 'Pausada', tone: 'gray' },
  { label: 'Concluída', tone: 'gray' },
  { label: 'Rejeitada', tone: 'red' },
  { label: 'Cancelada', tone: 'red' },
  { label: 'P.I. rejeitado', tone: 'red' },
];

/** `swap`: papel que substitui este quando o contraste cai abaixo de AA (texto de 13 px). */
const TEXT_ROLES: { token: string; note?: string; swap?: string }[] = [
  { token: 'ink' },
  { token: 'text' },
  { token: 'muted' },
  { token: 'subtle', note: 'só placeholder' },
  { token: 'accent', swap: 'accent-ink' },
  { token: 'accent-ink' },
];

function ContrastTable({ surface, label, hex }: { surface: string; label: string; hex: Record<string, string> }) {
  const bg = hex[surface] ?? '#ffffff';
  return (
    <div
      className={f.contrastPanel}
      data-sunken={surface !== 'paper' || undefined}
      style={{ background: `var(--${surface})` }}
    >
      <span className={f.groupLabel}>{label}</span>
      {TEXT_ROLES.map(({ token, note, swap }) => {
        const ratio = contrast(hex[token] ?? '#000000', bg);
        const swapped = swap && ratio < 4.5 ? swap : undefined;
        return (
          <div
            key={token}
            className={f.contrastRow}
            data-weak={note ? true : undefined}
            data-swap={swapped ? true : undefined}
          >
            <span className={f.contrastSample} style={{ color: `var(--${token})` }}>
              Verba planejada
            </span>
            <span className={f.contrastToken}>{token}</span>
            <span className={f.contrastRatio}>{ratioText(ratio)}</span>
            <span className={f.contrastLevel}>
              {note ?? (swapped ? <>Use {swapped}</> : levelOf(ratio))}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const WEEK = [
  { day: 12, dow: 'S' },
  { day: 13, dow: 'T' },
  { day: 14, dow: 'Q' },
  { day: 15, dow: 'Q' },
  { day: 16, dow: 'S' },
  { day: 17, dow: 'S' },
  { day: 18, dow: 'D' },
];

function RangeWeek() {
  const [range, setRange] = useState<[number, number]>([14, 17]);
  const [start, end] = range;
  return (
    <div className={f.week} role="group" aria-label="Período em outubro de 2026">
      {WEEK.map(({ dow }, i) => (
        <span key={`dow-${i}`} className={f.weekDow} aria-hidden="true">
          {dow}
        </span>
      ))}
      {WEEK.map(({ day }) => {
        const edge = day === start || day === end;
        const inside = day > start && day < end;
        return (
          <button
            key={day}
            type="button"
            className={f.weekDay}
            data-edge={edge || undefined}
            data-start={day === start || undefined}
            data-end={day === end || undefined}
            data-inside={inside || undefined}
            aria-pressed={edge || inside}
            aria-label={`${day} de outubro de 2026`}
            onClick={() =>
              setRange(([s, e]) => (day < s ? [day, e] : day > e ? [s, day] : day - s <= e - day ? [day, e] : [s, day]))
            }
          >
            <span>{day}</span>
          </button>
        );
      })}
    </div>
  );
}

function NavSample() {
  const items: { id: string; label: string; icon: LucideIcon; count?: number }[] = [
    { id: 'campanhas', label: 'Campanhas', icon: Megaphone, count: 5 },
    { id: 'pedidos', label: 'Pedidos de Inserção', icon: FileText },
    { id: 'leads', label: 'Leads', icon: UserRound, count: 2 },
  ];
  const [active, setActive] = useState('campanhas');
  return (
    <nav className={f.navSample} aria-label="Menu lateral (amostra)">
      {items.map(({ id, label, icon: Icon, count }) => (
        <button
          key={id}
          type="button"
          className={f.navItem}
          aria-current={active === id ? 'page' : undefined}
          onClick={() => setActive(id)}
        >
          <Icon aria-hidden="true" />
          <span className={f.navLabel}>{label}</span>
          {count !== undefined && <span className={f.navCount}>{count}</span>}
        </button>
      ))}
    </nav>
  );
}

function Cores() {
  const { ref, hex } = useLiveHex();
  const { copied, copy, region } = useCopy();
  const [asset, setAsset] = useState('banner');
  return (
    <Board boardRef={ref}>
      {region}
      <Shot title="Papéis" tone="white">
        <div className={f.roleGroups}>
          {ROLE_GROUPS.map((group) => (
            <div key={group.label} className={f.roleGroup}>
              <span className={f.groupLabel}>{group.label}</span>
              <div className={f.roleGrid}>
                {group.roles.map((role) => (
                  <RoleChip
                    key={role.token}
                    role={role}
                    hex={hex[role.token] ?? ''}
                    copied={copied === role.token}
                    onCopy={() => copy(role.token, `var(--${role.token})`)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Shot>

      <Shot title="Rampas" tone="white">
        <div className={f.ramps}>
          <Ramp
            label="Neutros"
            prefix="g"
            steps={NEUTRAL_STEPS}
            hex={hex}
            copied={copied}
            onCopy={(token) => copy(token, `var(--${token})`)}
          />
          <Ramp
            label="Azul"
            prefix="b"
            steps={BLUE_STEPS}
            hex={hex}
            mark={{ step: '600', label: 'Ação' }}
            copied={copied}
            onCopy={(token) => copy(token, `var(--${token})`)}
          />
        </div>
      </Shot>

      <Shot title="Status" tone="white">
        <div className={f.toneGrid}>
          {TONE_COLUMNS.map(({ tone, label }) => (
            <div key={tone} className={f.toneColumn}>
              <span className={f.toneName}>{tone}</span>
              <div className={f.toneStack}>
                {TONE_PARTS.map((part) => {
                  const token = `${tone}-${part}`;
                  const value = hex[token] ?? '';
                  return (
                    <button
                      key={part}
                      type="button"
                      className={f.toneChip}
                      data-dark={luminance(value) < 0.3 || undefined}
                      data-copied={copied === token || undefined}
                      style={{ background: `var(--${token})` }}
                      onClick={() => copy(token, `var(--${token})`)}
                      aria-label={`${token}, ${value}. Copiar var(--${token})`}
                    >
                      <span>{copied === token ? <Check aria-hidden="true" /> : part}</span>
                      <span className={f.num}>{value.replace('#', '')}</span>
                    </button>
                  );
                })}
              </div>
              <div className={f.toneBadges}>
                {tone === 'blue' ? (
                  <span className={f.toneNote}>{label}</span>
                ) : (
                  <Badge variant="text" tone={tone} live={tone === 'green'}>
                    {label}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className={f.statusMap}>
          {PRODUCT_STATUS.map(({ label, tone, live }) => (
            <div key={label} className={f.statusRow}>
              <Badge variant="text" tone={tone} live={live}>
                {label}
              </Badge>
              <span className={f.statusTone}>{tone}</span>
            </div>
          ))}
        </div>
      </Shot>

      <Shot title="Contraste">
        <div className={f.contrastGrid}>
          <ContrastTable surface="paper" label="Papel" hex={hex} />
          <ContrastTable surface="g-50" label="Rebaixado" hex={hex} />
        </div>
      </Shot>

      <Shot title="Seleção">
        <div className={f.selectGrid}>
          <Sample caption="Cartão · b-25 + b-300">
            <div className={f.choiceStack} role="radiogroup" aria-label="Ativo">
              <ChoiceCard
                name="dsv3-cores-ativo"
                value="banner"
                checked={asset === 'banner'}
                onChange={setAsset}
                title="Banner Super Topo — Portal"
                description="CPM · R$ 45,00"
              />
              <ChoiceCard
                name="dsv3-cores-ativo"
                value="email"
                checked={asset === 'email'}
                onChange={setAsset}
                title="E-mail marketing dedicado"
                description="Preço fechado · R$ 6.500,00"
              />
            </div>
          </Sample>
          <Sample caption="Menu lateral · b-100 + barra">
            <NavSample />
          </Sample>
          <Sample caption="Período · b-50">
            <RangeWeek />
          </Sample>
        </div>
      </Shot>
    </Board>
  );
}

/* ————————————————————————————————————————————————————————————————
 * Tipografia
 * ———————————————————————————————————————————————————————————————— */

type TypeRow = {
  role: string;
  token: string;
  spec: string;
  sample: string;
  ink?: 'ink' | 'text' | 'muted';
  num?: boolean;
  track?: boolean;
  overline?: boolean;
  /** Como a linha muda no celular (≤760). */
  phone?: { token: string; spec: string };
};

const TYPE_ROWS: TypeRow[] = [
  {
    role: 'Página',
    token: '--t-page',
    spec: '600 24/32',
    sample: 'Campanhas',
    track: true,
    phone: { token: '--t-page-sm', spec: '600 22/30' },
  },
  { role: 'Métrica', token: '--t-kpi', spec: '600 22/28', sample: '271.400', num: true, track: true },
  { role: 'Número herói', token: '--t-figure-lg', spec: '600 18/26', sample: 'R$ 18.000,00', num: true },
  { role: 'Faixa de números', token: '--t-figure', spec: '600 16/24', sample: '≈ 14.815', num: true },
  { role: 'Diálogo e gráfico', token: '--t-title-2', spec: '600 16/24', sample: 'Entrega diária', track: true },
  { role: 'Seção', token: '--t-title-3', spec: '600 14/20', sample: 'Configuração' },
  { role: 'Grupo', token: '--t-group', spec: '600 13/20', sample: 'Período de veiculação' },
  { role: 'Corpo', token: '--t-body', spec: '400 13/20', sample: 'Banner Super Topo — Portal', ink: 'text' },
  { role: 'Corpo forte', token: '--t-body-strong', spec: '500 13/20', sample: 'Coleção Primavera-Verão no portal' },
  { role: 'Rótulo', token: '--t-small-strong', spec: '500 12/18', sample: 'Verba planejada' },
  { role: 'Pequeno', token: '--t-small', spec: '400 12/18', sample: 'Impressões', ink: 'muted' },
  { role: 'Legenda', token: '--t-caption', spec: '400 11,5/16', sample: '1.026 cliques · CTR 2,08%', ink: 'muted', num: true },
  { role: 'Cabeçalho', token: '--t-caption-strong', spec: '500 11,5/16', sample: 'Campanha', ink: 'muted' },
  { role: 'Sobrelinha', token: '--t-overline', spec: '600 10,5/14', sample: 'Prévia', ink: 'muted', overline: true },
];

const DETAIL_META = ['#2041', 'Aurora Calçados', 'Banner Super Topo — Portal', '01/10 – 31/10', 'Criada pelo admin'];
const MONEY_COLUMN = ['R$ 18.000,00', 'R$ 11.230,00', 'R$ 3.600,00', 'R$ 12.000,00', 'R$ 6.500,00'];

function SizeLine({ size, phone, children }: { size: string; phone?: string; children: ReactNode }) {
  return (
    <div className={f.sizeLine}>
      <div className={f.sizeContent}>{children}</div>
      {phone ? (
        <span className={f.sizeTag}>
          <span data-desk="">{size}</span>
          <span data-phone="">{phone}</span>
        </span>
      ) : (
        <span className={f.sizeTag}>{size}</span>
      )}
    </div>
  );
}

function Tipografia() {
  const [view, setView] = useState<'1440' | '390'>('1440');
  return (
    <Board>
      <Shot
        title="Escala"
        tone="white"
        aside={
          <Segmented
            size="sm"
            label="Largura de tela"
            value={view}
            onChange={setView}
            options={[
              { value: '1440', label: '1440' },
              { value: '390', label: '390' },
            ]}
          />
        }
      >
        <div className={f.typeTable}>
          {TYPE_ROWS.map((row) => {
            const phone = view === '390' ? row.phone : undefined;
            const token = phone?.token ?? row.token;
            return (
              <div key={row.token} className={f.typeRow} data-changed={phone ? true : undefined}>
                <div className={f.typeMeta}>
                  <span className={f.typeRole}>{row.role}</span>
                  <span className={f.typeSpec}>
                    <span>{token}</span>
                    <span className={f.num}>{phone?.spec ?? row.spec}</span>
                  </span>
                </div>
                <span
                  className={f.typeSample}
                  data-ink={row.ink ?? 'ink'}
                  data-num={row.num || undefined}
                  data-track={row.track || undefined}
                  data-overline={row.overline || undefined}
                  style={{ font: `var(${token})` }}
                >
                  {row.sample}
                </span>
              </div>
            );
          })}
        </div>
      </Shot>

      <Shot title="Hierarquia" tone="white">
        <div className={f.hierGrid}>
          <Sample caption="Cabeçalho do detalhe" align="start">
            <div className={f.hierBlock}>
              <SizeLine size="24" phone="22">
                <div className={f.hierTitleRow}>
                  <span className={f.hierTitle}>Coleção Primavera-Verão no portal</span>
                  <Badge variant="text" tone="green" live>
                    Veiculando
                  </Badge>
                </div>
              </SizeLine>
              <SizeLine size="13">
                <p className={f.hierMeta}>
                  <span>
                    {DETAIL_META.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </span>
                </p>
              </SizeLine>
            </div>
          </Sample>
          <Sample caption="Seção › grupo › campo" align="start">
            <div className={f.hierBlock} data-form="">
              <SizeLine size="14">
                <span className={f.hierSection}>Período</span>
              </SizeLine>
              <SizeLine size="13">
                <span className={f.hierGroup}>Período de veiculação</span>
              </SizeLine>
              <SizeLine size="12">
                <div className={f.fieldPair}>
                  <Field label="Início">
                    {({ id }) => <Input id={id} icon={CalendarDays} defaultValue="05/10/2026" />}
                  </Field>
                  <Field label="Término">
                    {({ id }) => <Input id={id} icon={CalendarDays} defaultValue="31/10/2026" />}
                  </Field>
                </div>
              </SizeLine>
            </div>
          </Sample>
        </div>
      </Shot>

      <Shot title="Números">
        <div className={f.numCompare}>
          <Sample caption="Proporcional">
            <div className={f.numColumn} data-mode="proportional">
              {MONEY_COLUMN.map((value) => (
                <span key={value}>{value}</span>
              ))}
            </div>
          </Sample>
          <Sample caption="Tabular">
            <div className={f.numColumn} data-mode="tabular">
              {MONEY_COLUMN.map((value) => (
                <span key={value}>{value}</span>
              ))}
            </div>
          </Sample>
        </div>
      </Shot>

      <Shot title="Celular">
        <Sample caption="390">
          <Phone label="Celular, 390">
            <div className={f.phoneTop}>
              <IconButton variant="ghost" size="sm" icon={MenuGlyph} label="Abrir menu" />
              <span className={f.phoneCrumb}>
                <span>Operação</span>
                <ChevronRight aria-hidden="true" />
                <strong>Campanhas</strong>
              </span>
              <IconButton variant="ghost" size="sm" icon={Bell} label="Notificações" />
            </div>
            <div className={f.phoneBody}>
              <SizeLine size="22">
                <span className={f.phoneTitle}>Campanhas</span>
              </SizeLine>
              <p className={f.phoneSub}>17 de 17 campanhas do portal.</p>
              <Button variant="primary" icon={Plus} className={f.phoneCta}>
                Nova campanha
              </Button>
              <div className={f.phoneList}>
                {[
                  { name: 'Coleção Primavera-Verão no portal', tone: 'green' as Tone, status: 'Veiculando', live: true, who: 'Aurora Calçados', money: 'R$ 18.000,00', when: '01/10 – 31/10' },
                  { name: 'Destaque couro vegetal', tone: 'violet' as Tone, status: 'Aguardando aprovação', who: 'Lume Acessórios', money: 'R$ 9.000,00', when: '10/10 – 30/10' },
                ].map((row) => (
                  <div key={row.name} className={f.phoneRow}>
                    <strong>{row.name}</strong>
                    <span className={f.phoneMeta}>
                      <Badge variant="text" tone={row.tone} live={row.live}>
                        {row.status}
                      </Badge>
                      <span>{row.who}</span>
                    </span>
                    <span className={`${f.phoneMeta} ${f.num}`}>
                      <span>{row.money}</span>
                      <span>{row.when}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Phone>
        </Sample>
      </Shot>
    </Board>
  );
}

/* ————————————————————————————————————————————————————————————————
 * Medidas sobre a tela: padding e gaps medidos do layout real
 * ———————————————————————————————————————————————————————————————— */

type SpaceBox = {
  key: string;
  owner: number;
  kind: 'pad' | 'gap-x' | 'gap-y';
  /** Padding (t, r, b, l): vira a largura da moldura. */
  pad?: [number, number, number, number];
  /** Raio interno (raio do elemento − fio): a moldura acompanha o canto real. */
  radius?: number;
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  /** Rótulo fora da caixa (à direita) quando a faixa é mais fina que a cota (16). */
  outside?: boolean;
};

function measureSpacing(root: HTMLElement): SpaceBox[] {
  const base = root.getBoundingClientRect();
  const out: SpaceBox[] = [];
  const px = (value: string) => Math.round(parseFloat(value) || 0);
  root.querySelectorAll<HTMLElement>('[data-space]').forEach((el, owner) => {
    el.dataset.spaceOwner = String(owner);
    const kinds = (el.dataset.space ?? '').split(' ');
    const rect = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (kinds.includes('pad')) {
      const t = px(cs.paddingTop);
      const r = px(cs.paddingRight);
      const b = px(cs.paddingBottom);
      const l = px(cs.paddingLeft);
      const bt = px(cs.borderTopWidth);
      const bl = px(cs.borderLeftWidth);
      const x = rect.left - base.left + bl;
      const y = rect.top - base.top + bt;
      const w = rect.width - bl - px(cs.borderRightWidth);
      const h = rect.height - bt - px(cs.borderBottomWidth);
      const uniform = t === r && r === b && b === l;
      if (t || r || b || l) {
        const labels = uniform ? [`${t}`] : [...new Set([t, r, b, l].filter(Boolean).map(String))];
        const radius = Math.max(0, px(cs.borderTopLeftRadius) - bt);
        out.push({
          key: `${owner}p`,
          owner,
          kind: 'pad',
          x,
          y,
          w,
          h,
          pad: [t, r, b, l],
          radius,
          label: labels.join(' · '),
          outside: t < 16,
        });
      }
    }
    if (kinds.includes('gap')) {
      const kids = Array.from(el.children)
        .filter((child): child is HTMLElement => child instanceof HTMLElement && !child.hasAttribute('data-space-skip'))
        .map((child) => child.getBoundingClientRect())
        .filter((box) => box.width > 0 && box.height > 0);
      kids.forEach((next, index) => {
        const prev = kids[index - 1];
        if (!prev) return;
        if (next.top >= prev.bottom - 0.5) {
          const gap = next.top - prev.bottom;
          if (gap < 1) return;
          const left = Math.min(prev.left, next.left);
          const right = Math.max(prev.right, next.right);
          out.push({
            key: `${owner}g${index}`,
            owner,
            x: left - base.left,
            y: prev.bottom - base.top,
            w: right - left,
            h: gap,
            kind: 'gap-y',
            label: String(Math.round(gap)),
            outside: gap < 12,
          });
        } else if (next.left >= prev.right - 0.5) {
          const gap = next.left - prev.right;
          if (gap < 1) return;
          const top = Math.min(prev.top, next.top);
          const bottom = Math.max(prev.bottom, next.bottom);
          out.push({
            key: `${owner}g${index}`,
            owner,
            x: prev.right - base.left,
            y: top - base.top,
            w: gap,
            h: bottom - top,
            kind: 'gap-x',
            label: String(Math.round(gap)),
            /* Faixa mais estreita que a cota: a cota desce para baixo da faixa, sem cobrir os fios. */
            outside: gap < 24,
          });
        }
      });
    }
  });
  return out;
}

/** Envolve um trecho real e desenha por cima o padding e os gaps de quem tem `data-space`. */
function Measured({ on, children, className = '' }: { on: boolean; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [boxes, setBoxes] = useState<SpaceBox[]>([]);
  const [hover, setHover] = useState<number | null>(null);
  useIsoLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const run = () => setBoxes(measureSpacing(root));
    run();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(run);
    observer?.observe(root);
    document.fonts?.ready.then(run).catch(() => undefined);
    return () => observer?.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`${f.measured} ${className}`}
      data-on={on || undefined}
      onPointerMove={(event) => {
        const target = (event.target as HTMLElement).closest<HTMLElement>('[data-space]');
        setHover(target && ref.current?.contains(target) ? Number(target.dataset.spaceOwner) : null);
      }}
      onPointerLeave={() => setHover(null)}
    >
      {children}
      <div className={f.spaceLayer} aria-hidden="true">
        {boxes.map((box) => (
          <span
            key={box.key}
            className={f.spaceBox}
            data-kind={box.kind}
            data-dim={(hover !== null && hover !== box.owner) || undefined}
            style={{
              left: box.x,
              top: box.y,
              width: box.w,
              height: box.h,
              borderWidth: box.pad ? box.pad.map((v) => `${v}px`).join(' ') : undefined,
              borderRadius: box.radius || undefined,
            }}
          >
            {box.label && (
              <span
                className={f.spaceChip}
                data-outside={box.outside || undefined}
                data-at={box.kind === 'pad' ? 'top' : undefined}
                style={
                  box.pad
                    ? box.outside
                      ? { top: -box.pad[0] / 2, left: `calc(100% + ${box.pad[1] + 7}px)` }
                      : { top: -box.pad[0] / 2 }
                    : undefined
                }
              >
                {box.label}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

const SPACE_SCALE = [
  ['--s-1', 4],
  ['--s-2', 8],
  ['--s-3', 12],
  ['--s-4', 16],
  ['--s-5', 20],
  ['--s-6', 24],
  ['--s-8', 32],
  ['--s-10', 40],
  ['--s-12', 48],
  ['--s-14', 56],
  ['--s-16', 64],
] as const;

const DENSITY_ROWS: { name: string; sub: string; status: string; tone: Tone; live?: boolean; money: string }[] = [
  {
    name: 'Coleção Primavera-Verão no portal',
    sub: 'Banner Super Topo — Portal · #2041',
    status: 'Veiculando',
    tone: 'green',
    live: true,
    money: 'R$ 18.000,00',
  },
  {
    name: 'Newsletter dos expositores',
    sub: 'E-mail marketing dedicado · #2038',
    status: 'Rascunho',
    tone: 'gray',
    money: 'R$ 8.000,00',
  },
];

function DensityTable({ height }: { height: number }) {
  return (
    <div className={f.densityTable} style={{ '--row-h': `${height}px` } as CSSProperties}>
      <div className={f.densityHead}>
        <span />
        <span>Campanha</span>
        <span>Status</span>
        <span className={f.alignEnd}>Verba</span>
        <span />
      </div>
      {DENSITY_ROWS.map((row, index) => (
        <div key={row.name} className={f.densityRow}>
          <Checkbox aria-label={`Selecionar ${row.name}`} />
          <span className={f.densityName}>
            <strong>{row.name}</strong>
            <small>{row.sub}</small>
          </span>
          <Badge variant="text" tone={row.tone} live={row.live}>
            {row.status}
          </Badge>
          <span className={`${f.num} ${f.alignEnd}`}>{row.money}</span>
          <span className={f.densityRule} aria-hidden="true">
            {index === 0 && <Dim tone="blue">{height}</Dim>}
          </span>
        </div>
      ))}
    </div>
  );
}

function Espacamento() {
  const [measures, setMeasures] = useState(false);
  return (
    <Board>
      <Shot title="Escala" tone="white">
        <div className={f.spaceScale}>
          {SPACE_SCALE.map(([token, value]) => (
            <div key={token} className={f.spaceRow}>
              <span className={f.spaceToken}>{token}</span>
              <span className={f.spacePx}>{value}</span>
              <span className={f.spaceBarTrack}>
                <span className={f.spaceBar} style={{ width: value }} />
              </span>
            </div>
          ))}
        </div>
      </Shot>

      <Shot
        title="Em uso"
        aside={<Switch label="Medidas" checked={measures} onCheckedChange={setMeasures} size="sm" />}
      >
        <Measured on={measures} className={f.inUse}>
          <div className={f.inUsePanel} data-space="pad gap">
            <span className={f.groupTitle}>Período de veiculação</span>
            <div className={f.fieldPair} data-space="gap">
              <Field label="Início">{({ id }) => <Input id={id} icon={CalendarDays} defaultValue="05/10/2026" />}</Field>
              <Field label="Término">{({ id }) => <Input id={id} icon={CalendarDays} defaultValue="31/10/2026" />}</Field>
            </div>
          </div>
          <div className={f.bonusCard} data-space="pad">
            <span className={f.bonusState}>
              <i aria-hidden="true" />
              Liberado
            </span>
            <strong>+20% de impressões</strong>
            <span className={f.bonusDesc}>Impressões extras sem custo durante a feira.</span>
            <small className={f.bonusFoot}>Verba ≥ R$ 15.000,00</small>
          </div>
        </Measured>
      </Shot>

      <Shot title="Densidade">
        <div className={f.densityGrid}>
          <Sample caption="Compacta">
            <DensityTable height={46} />
          </Sample>
          <Sample caption="Confortável">
            <DensityTable height={60} />
          </Sample>
        </div>
      </Shot>

      <Shot title="Ritmo" tone="white">
        <Measured on className={f.rhythm}>
          <div className={f.rhythmPage} data-space="gap">
            <div className={f.rhythmTitle}>
              <i data-w="title" />
              <i data-w="sub" />
            </div>
            <div className={f.rhythmTabs}>
              <i data-active="" />
              <i />
              <i />
            </div>
            <div className={f.rhythmStrip}>
              <i />
              <i />
              <i />
            </div>
            <div className={f.rhythmSection} data-space="gap" data-gap="12">
              <i className={f.rhythmHeading} />
              <div className={f.rhythmBlock}>
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className={f.rhythmSection} data-space="gap" data-gap="16">
              <i className={f.rhythmHeading} />
              <div className={f.rhythmBlock}>
                <i />
                <i />
              </div>
            </div>
          </div>
        </Measured>
      </Shot>
    </Board>
  );
}

/* ————————————————————————————————————————————————————————————————
 * Grid e breakpoints
 * ———————————————————————————————————————————————————————————————— */

function frameModel(w: number) {
  const drawer = w <= 1199;
  const gutter = w <= 640 ? 16 : w <= 1024 ? 24 : 32;
  const side = drawer ? 0 : 236;
  const area = w - side;
  const inner = Math.min(area - gutter * 2, 1760);
  const left = side + (area - inner) / 2;
  const capped = area - gutter * 2 > 1760;
  const asideBeside = w > 1100;
  const split = w >= 1600;
  const cards = w <= 760;
  return { drawer, gutter, side, inner, left, capped, asideBeside, split, cards };
}

/** Largura disponível de um contêiner, acompanhando redimensionamento. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setWidth(el.clientWidth);
    read();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(read);
    observer?.observe(el);
    return () => observer?.disconnect();
  }, []);
  return { ref, width };
}

function AppFrame({ w }: { w: number }) {
  const { ref, width } = useWidth<HTMLDivElement>();
  const m = frameModel(w);
  const narrow = width > 0 && width < 560;
  const s = width ? width / (narrow ? w : Math.max(w, 1440)) : 0;
  const v = narrow ? 0.5 : Math.min(0.7, width / 1440 || 0.6);
  const fw = w * s;
  const H = 520 * v;
  const top = 52 * v;
  const titleY = top + 24 * v;
  const bodyY = titleY + 24 * v + 28 * v;
  const bottom = H - 20 * v;
  const asideW = 320;
  const mainW = m.asideBeside ? m.inner - asideW - 32 : m.inner;
  const asideTop = m.asideBeside ? bodyY : bodyY;
  const asideH = m.asideBeside ? bottom - bodyY : 64 * v;
  const mainTop = m.asideBeside ? bodyY : bodyY + asideH + 16 * v;
  const x = (value: number) => value * s;
  const show = (pxWide: number) => pxWide * s >= 26;
  const frameLeft = (width - fw) / 2;
  /* Gaveta: o menu sai da moldura e fica ao lado, em fantasma, encostando na borda esquerda. */
  const drawerW = 280 * (width / 1440);
  const drawerLeft = Math.max(0, frameLeft + 24 - drawerW);
  return (
    <div ref={ref} className={f.frameStage} style={{ height: H }} data-ready={width ? true : undefined}>
      {width > 0 && !narrow && (
        <div
          className={f.fDrawer}
          data-on={m.drawer || undefined}
          style={{ left: drawerLeft, width: drawerW, height: H }}
          aria-hidden="true"
        >
          {Array.from({ length: 7 }, (_, i) => (
            <i key={i} data-active={i === 2 || undefined} />
          ))}
          <Dim className={f.fSideDim}>Gaveta</Dim>
        </div>
      )}
      {width > 0 && (
        <div className={f.frame} style={{ width: fw, height: H, left: frameLeft }}>
          {/* Menu lateral fixo; até 1199 ele recolhe e vira gaveta (ao lado). */}
          <div className={f.fSide} data-drawer={m.drawer || undefined} style={{ width: x(m.side) }}>
            {Array.from({ length: 7 }, (_, i) => (
              <i key={i} data-active={i === 2 || undefined} />
            ))}
            {show(120) && <Dim className={f.fSideDim}>236</Dim>}
          </div>
          {/* Topo */}
          <div className={f.fTop} style={{ left: x(m.side), height: top }}>
            <span className={f.fMenu} data-on={m.drawer || undefined} style={{ marginLeft: x(m.gutter) }}>
              <MenuGlyph aria-hidden="true" />
            </span>
            <i className={f.fCrumb} style={{ width: x(160) }} />
            {!narrow && <Dim className={f.fTopDim}>52</Dim>}
          </div>
          {/* Calhas */}
          <span className={f.fGutter} style={{ left: x(m.left - m.gutter), width: x(m.gutter), top }}>
            {x(m.gutter) >= 8 && <Dim tone="blue">{m.gutter}</Dim>}
          </span>
          <span className={f.fGutter} style={{ left: x(m.left + m.inner), width: x(m.gutter), top }} />
          {/* Título */}
          <i className={f.fTitle} style={{ left: x(m.left), top: titleY, width: x(Math.min(220, m.inner * 0.5)) }} />
          {m.capped && (
            <span className={f.fCap} style={{ left: x(m.left), width: x(m.inner), top: titleY + 20 * v }}>
              <Dim>1760</Dim>
            </span>
          )}
          {/* Lateral */}
          <div
            className={f.fAside}
            style={{ left: x(m.asideBeside ? m.left + m.inner - asideW : m.left), width: x(m.asideBeside ? asideW : m.inner), top: asideTop, height: asideH }}
          >
            {show(80) && <Dim>{m.asideBeside ? '320' : 'Lateral'}</Dim>}
          </div>
          {/* Miolo */}
          <div
            className={f.fMain}
            data-cards={m.cards || undefined}
            data-split={m.split || undefined}
            style={{ left: x(m.left), width: x(mainW), top: mainTop, height: bottom - mainTop }}
          >
            <span className={f.fPane}>
              {Array.from({ length: 6 }, (_, i) => (
                <i key={i} />
              ))}
            </span>
            {m.split && (
              <span className={f.fPane}>
                {Array.from({ length: 6 }, (_, i) => (
                  <i key={i} />
                ))}
              </span>
            )}
            {show(60) && <Dim className={f.fMainDim}>1fr</Dim>}
          </div>
        </div>
      )}
    </div>
  );
}

const BREAKPOINTS: { at: number; change?: string }[] = [
  { at: 390 },
  { at: 640, change: 'Rodapé 1 linha · bottom sheet' },
  { at: 760, change: 'Tabela → cartões' },
  { at: 1024 },
  { at: 1199, change: 'Menu gaveta' },
  { at: 1440, change: 'Referência' },
  { at: 1600, change: 'Detalhe 2 colunas' },
  { at: 1920, change: 'Para em 1760' },
  { at: 2560 },
];
const LOG_MIN = Math.log(390);
const LOG_MAX = Math.log(2560);
const rulerPos = (at: number) => ((Math.log(at) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100;

function Ruler({ active, onPreview }: { active: number; onPreview: (at: number | null) => void }) {
  let labelled = 0;
  return (
    <div className={f.ruler} onPointerLeave={() => onPreview(null)}>
      <div className={f.rulerLine} aria-hidden="true" />
      <ul className={f.rulerTicks}>
        {BREAKPOINTS.map(({ at, change }) => {
          const row = change ? labelled++ % 2 : 0;
          return (
            <li key={at} className={f.rulerTick} style={{ '--x': `${rulerPos(at)}%` } as CSSProperties} data-row={row}>
              <button
                type="button"
                className={f.rulerButton}
                data-active={active === at || undefined}
                data-edge={at === 2560 ? 'end' : at === 390 ? 'start' : undefined}
                onPointerEnter={() => onPreview(at)}
                onFocus={() => onPreview(at)}
                onBlur={() => onPreview(null)}
                aria-label={change ? `${at} px: ${change}` : `${at} px`}
              >
                <span className={f.rulerNum}>{at}</span>
                {change && <span className={f.rulerChange}>{change}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const ASSETS = [
  { name: 'Banner Super Topo — Portal', kind: 'Mídia Online', price: 'CPM · R$ 45,00' },
  { name: 'E-mail marketing dedicado', kind: 'E-mail', price: 'R$ 6.500,00' },
  { name: 'Push no app da feira', kind: 'App', price: 'R$ 3.600,00' },
  { name: 'Painel de LED — Pavilhão Azul', kind: 'Mídia física', price: 'R$ 18.000,00' },
  { name: 'Destaque na vitrine', kind: 'Vitrine', price: 'R$ 2.400,00' },
];

/** Encaixa um desenho de largura natural na largura disponível (zoom), sem rolagem lateral. */
function Fit({ natural, children }: { natural: number; children: ReactNode }) {
  const { ref, width } = useWidth<HTMLDivElement>();
  const zoom = width ? Math.min(1, width / natural) : 1;
  return (
    <div ref={ref} className={f.fit}>
      <div style={{ width: natural, zoom }}>{children}</div>
    </div>
  );
}

function CreationFrame() {
  return (
    <div className={f.cf}>
      <div className={f.cfHead}>
        <div className={f.cfTitles}>
          <strong>Nova campanha</strong>
          <span>Criada pelo admin</span>
        </div>
        <ol className={f.cfSteps} aria-label="Etapas">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <li key={n} data-state={n < 3 ? 'done' : n === 3 ? 'current' : 'next'}>
              <span className={f.cfMarker}>{n < 3 ? <Check aria-hidden="true" /> : n}</span>
              {n === 3 && <span className={f.cfStepLabel}>Precificação</span>}
            </li>
          ))}
        </ol>
      </div>
      <div className={f.cfBody}>
        <div className={f.cfMain}>
          <i className={f.cfHeading} />
          <span className={f.cfPanel}>
            <i />
            <i />
            <i />
          </span>
          <span className={f.cfCards}>
            <i />
            <i />
            <i />
          </span>
        </div>
        <div className={f.cfAside}>
          <Dim className={f.cfDimAside}>320</Dim>
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className={f.cfAsideRow}>
              <i />
              <i />
            </span>
          ))}
        </div>
      </div>
      <div className={f.cfFoot}>
        <Button variant="ghost">Cancelar</Button>
        <Button variant="ghost">Salvar rascunho</Button>
        <Button icon={ArrowLeft}>Voltar</Button>
        <span className={f.cfPrimary}>
          <Button variant="primary" trailingIcon={ArrowRight}>
            Continuar
          </Button>
        </span>
      </div>
    </div>
  );
}

/** Moldura fixa com cotas: altura do cabeçalho e do rodapé à direita, largura mínima do principal embaixo. */
function CreationDiagram() {
  return (
    <div className={f.cfWrap}>
      <CreationFrame />
      <div className={f.cfDims} aria-hidden="true">
        <span data-h="68">
          <Dim>68</Dim>
        </span>
        <span data-h="body" />
        <span data-h="64">
          <Dim>64</Dim>
        </span>
      </div>
      <div className={f.cfRedline} aria-hidden="true">
        <span>
          <Dim tone="blue">≥ 196</Dim>
        </span>
      </div>
    </div>
  );
}

function GridItem() {
  const { ref: probe, width: probeWidth } = useWidth<HTMLDivElement>();
  const [mode, setMode] = useState<'1440' | '1024' | '390'>('1440');
  const [preview, setPreview] = useState<number | null>(null);
  const narrowStage = probeWidth > 0 && probeWidth < 560;
  useEffect(() => {
    if (narrowStage) setMode('390');
  }, [narrowStage]);
  const w = preview ?? Number(mode);
  return (
    <Board>
      <Shot
        title="Moldura"
        aside={
          <Segmented
            size="sm"
            label="Largura de tela"
            value={mode}
            onChange={setMode}
            options={[
              { value: '1440', label: '1440' },
              { value: '1024', label: '1024' },
              { value: '390', label: '390' },
            ]}
          />
        }
      >
        <div ref={probe}>
          <AppFrame w={w} />
        </div>
      </Shot>

      <Shot title="Breakpoints" tone="white">
        <Ruler active={w} onPreview={setPreview} />
      </Shot>

      <Shot title="Moldura fixa">
        <div className={f.cfGrid}>
          <Sample caption="1440" className={f.cfWide}>
            <Fit natural={812}>
              <CreationDiagram />
            </Fit>
          </Sample>
          <Sample caption="390">
            <div className={f.cfPhoneFoot}>
              <IconButton icon={ArrowLeft} label="Voltar" />
              <Button variant="ghost">Salvar rascunho</Button>
              <Button variant="primary" trailingIcon={ArrowRight} className={f.grow}>
                Continuar
              </Button>
            </div>
          </Sample>
        </div>
      </Shot>

      <Shot title="Grades" tone="white">
        <div className={f.gridDemos}>
          <Sample caption="Formulário · 2 colunas · 16" align="start">
            <div className={f.formGrid}>
              <div className={f.span2}>
                <Field label="Nome da campanha" required>
                  {({ id }) => <Input id={id} defaultValue="Coleção Primavera-Verão 2027" />}
                </Field>
              </div>
              <Field label="Início">{({ id }) => <Input id={id} icon={CalendarDays} defaultValue="05/10/2026" />}</Field>
              <Field label="Término">{({ id }) => <Input id={id} icon={CalendarDays} defaultValue="31/10/2026" />}</Field>
            </div>
          </Sample>
          <Sample caption="Faixa · fio de 1 px" align="start">
            <div className={f.figureStrip}>
              <div>
                <span>Por dia</span>
                <strong>≈ 14.815</strong>
                <small>impressões · 27 dias</small>
              </div>
              <div>
                <span>Com bônus</span>
                <strong>≈ 480.000</strong>
                <small>+20% liberado</small>
              </div>
              <div>
                <span>Custo efetivo</span>
                <strong>R$ 35,63</strong>
                <small>por mil · −5%</small>
              </div>
            </div>
          </Sample>
          <Sample caption="Cartões · auto-fill 196 · 8" align="start" className={f.span2}>
            <div className={f.cardGrid}>
              {ASSETS.map((asset) => (
                <div key={asset.name} className={f.assetCard}>
                  <strong>{asset.name}</strong>
                  <span>{asset.kind}</span>
                  <small className={f.num}>{asset.price}</small>
                </div>
              ))}
            </div>
          </Sample>
        </div>
      </Shot>
    </Board>
  );
}

/* ————————————————————————————————————————————————————————————————
 * Bordas e raios
 * ———————————————————————————————————————————————————————————————— */

function TokenCap({ token, use }: { token: string; use: string }) {
  return (
    <>
      <span className={f.capToken}>{token.replace(/^--/, '')}</span> · {use}
    </>
  );
}

const RADII = [
  { token: 'xs', px: '4', use: 'Selo' },
  { token: 'sm', px: '6', use: 'Chip' },
  { token: 'md', px: '8', use: 'Controle' },
  { token: 'lg', px: '10', use: 'Superfície' },
  { token: 'xl', px: '12', use: 'Palco' },
  { token: '2xl', px: '16', use: 'Modal' },
  { token: 'full', px: '', use: 'Avatar' },
];

function SegmentMock({ variant }: { variant: 'ok' | 'bad' }) {
  return (
    <div className={f.segShell} data-variant={variant} aria-hidden="true">
      <div className={f.segTrack}>
        <span className={f.segThumb} />
        <span className={f.segOption} />
      </div>
    </div>
  );
}

function Bordas() {
  const [radius, setRadius] = useState<string | null>(null);
  const { copied, copy, region } = useCopy();
  const active = radius ?? 'md';
  return (
    <Board>
      {region}
      <Shot title="Fios" tone="white">
        <div className={f.wireGrid}>
          <Sample caption={<TokenCap token="--line" use="Painel" />}>
            <div className={f.wirePanel}>
              <span className={f.wireTitle}>Pedido de inserção</span>
              <span className={f.wireMeta}>
                <span>P.I. 2026-0400</span>
                <Badge variant="text" tone="green">
                  Ativo
                </Badge>
              </span>
            </div>
          </Sample>
          <Sample caption={<TokenCap token="--line-soft" use="Entre linhas" />}>
            <dl className={f.propList}>
              <div>
                <dt>Anunciante</dt>
                <dd>Aurora Calçados</dd>
              </div>
              <div>
                <dt>Verba</dt>
                <dd className={f.num}>R$ 18.000,00</dd>
              </div>
              <div>
                <dt>Período</dt>
                <dd className={f.num}>01/10 – 31/10</dd>
              </div>
            </dl>
          </Sample>
          <Sample caption={<TokenCap token="--line-strong" use="Controle" />}>
            <Input aria-label="Nome da campanha" defaultValue="Coleção Primavera-Verão" />
          </Sample>
          <Sample caption={<TokenCap token="--line-hover" use="Hover" />}>
            <Input aria-label="Nome da campanha, em hover" defaultValue="Coleção Primavera-Verão" data-force="hover" />
          </Sample>
        </div>
      </Shot>

      <Shot title="Raios" tone="white">
        <div className={f.radiusLayout}>
          <div className={f.radiusRow} onPointerLeave={() => setRadius(null)}>
            {RADII.map((r) => {
              const key = `r-${r.token}`;
              return (
                <button
                  key={r.token}
                  type="button"
                  className={f.radiusItem}
                  data-active={active === r.token || undefined}
                  onPointerEnter={() => setRadius(r.token)}
                  onFocus={() => setRadius(r.token)}
                  onBlur={() => setRadius(null)}
                  onClick={() => copy(key, `var(--${key})`)}
                  aria-label={`--${key}${r.px ? `, ${r.px} px` : ''}: ${r.use}. Copiar`}
                >
                  <span className={f.radiusSquare} style={{ borderRadius: `var(--${key})` }} />
                  <span className={f.radiusName}>
                    {copied === key ? (
                      <Check aria-hidden="true" />
                    ) : (
                      <>
                        {r.token}
                        {r.px && <span className={f.num}>{r.px}</span>}
                      </>
                    )}
                  </span>
                  <span className={f.cap}>{r.use}</span>
                </button>
              );
            })}
          </div>
          <div className={f.radiusPreview}>
            <Button
              variant="primary"
              icon={Plus}
              className={f.morph}
              style={{ '--btn-radius': `var(--r-${active})` } as CSSProperties}
            >
              Nova campanha
            </Button>
            <span className={f.cap}>r-{active}</span>
          </div>
        </div>
      </Shot>

      <Shot title="Concêntrico">
        <div className={f.pairGrid}>
          <Sample
            caption={
              <span className={f.verdictCap}>
                <Verdict ok size={12} />
                <span className={f.num}>12 · 8 · 6</span>
              </span>
            }
          >
            <div className={f.zoom2}>
              <SegmentMock variant="ok" />
            </div>
          </Sample>
          <Sample
            caption={
              <span className={f.verdictCap}>
                <Verdict ok={false} size={12} />
                <span className={f.num}>12 · 12 · 12</span>
              </span>
            }
          >
            <div className={f.zoom2}>
              <SegmentMock variant="bad" />
            </div>
          </Sample>
        </div>
      </Shot>

      <Shot title="Tracejado">
        <div className={f.pairGrid}>
          <Sample caption="Kanban">
            <div className={f.kanbanCol}>
              <div className={f.kanbanHead}>
                <span>Proposta</span>
                <span className={f.num}>3</span>
              </div>
              <KanbanPlaceholder height={88} />
            </div>
          </Sample>
          <Sample caption="Upload em arrasto">
            <div className={f.dropzone} data-dragging="">
              <Upload aria-hidden="true" />
              <strong>Solte para anexar</strong>
              <span>PNG, JPG ou PDF · até 10 MB</span>
            </div>
          </Sample>
        </div>
      </Shot>
    </Board>
  );
}

/* ————————————————————————————————————————————————————————————————
 * Sombras e camadas
 * ———————————————————————————————————————————————————————————————— */

type LayerKey = 'painel' | 'sticky' | 'lote' | 'menu' | 'gaveta' | 'modal' | 'toast' | 'tooltip';
const LAYERS: { key: LayerKey; label: string; z: string; look: string; inScene: boolean }[] = [
  { key: 'painel', label: 'Painel', z: '—', look: 'Sem sombra', inScene: true },
  { key: 'sticky', label: 'Barra fixa', z: '20', look: 'Fio + blur', inScene: true },
  { key: 'lote', label: 'Lote', z: '30', look: '--shadow-lg', inScene: true },
  { key: 'menu', label: 'Menu e popover', z: '40', look: '--shadow-lg', inScene: true },
  { key: 'gaveta', label: 'Gaveta', z: '60', look: '--shadow-xl', inScene: false },
  { key: 'modal', label: 'Modal', z: '70', look: '--shadow-xl', inScene: false },
  { key: 'toast', label: 'Toast', z: '90', look: '--shadow-lg', inScene: true },
  { key: 'tooltip', label: 'Tooltip', z: '1000', look: '--shadow-md', inScene: true },
];

const SCENE_ROWS = [
  { id: 2041, name: 'Coleção Primavera-Verão no portal', sub: 'Banner Super Topo — Portal', status: 'Veiculando', tone: 'green' as Tone, live: true, money: 'R$ 18.000,00' },
  { id: 2032, name: 'Destaque couro vegetal', sub: 'Banner Super Topo — Portal', status: 'Aguardando aprovação', tone: 'violet' as Tone, money: 'R$ 9.000,00' },
  { id: 2029, name: 'Retargeting de credenciados', sub: 'Banner Super Topo — Portal', status: 'Ajustes solicitados', tone: 'orange' as Tone, money: 'R$ 13.500,00' },
  { id: 2014, name: 'Carrossel de tendências', sub: 'Post patrocinado no Instagram', status: 'Rascunho', tone: 'gray' as Tone, money: 'R$ 6.500,00' },
];

function LayerScene({ focus }: { focus: LayerKey | null }) {
  const [selected, setSelected] = useState<number[]>([2032, 2029]);
  const dim = (key: LayerKey) => (focus !== null && focus !== key) || undefined;
  return (
    <div className={f.scene}>
      <div className={f.sceneBar} data-dim={dim('sticky')}>
        <strong>Campanhas</strong>
        <span className={f.sceneTools}>
          <Input size="sm" icon={Search} placeholder="Buscar" aria-label="Buscar campanha" className={f.sceneSearch} />
          <IconButton variant="ghost" size="sm" icon={Download} label="Exportar" title="" />
        </span>
      </div>
      <span className={f.tipStatic} data-dim={dim('tooltip')} role="tooltip">
        Exportar visíveis
      </span>
      <div className={f.scenePanel} data-dim={dim('painel')}>
        {SCENE_ROWS.map((row, index) => (
          <div key={row.id} className={f.sceneRow} data-selected={selected.includes(row.id) || undefined}>
            <Checkbox
              aria-label={`Selecionar ${row.name}`}
              checked={selected.includes(row.id)}
              onChange={(event) =>
                setSelected((list) => (event.target.checked ? [...list, row.id] : list.filter((id) => id !== row.id)))
              }
            />
            <span className={f.sceneName}>
              <strong>{row.name}</strong>
              <small>
                {row.sub} · #{row.id}
              </small>
            </span>
            <span className={f.sceneStatus}>
              <Badge variant="text" tone={row.tone} live={row.live}>
                {row.status}
              </Badge>
            </span>
            <span className={`${f.num} ${f.sceneMoney}`}>{row.money}</span>
            <IconButton
              variant="ghost"
              size="sm"
              icon={Ellipsis}
              label={`Ações de ${row.name}`}
              aria-expanded={index === 0}
              data-force={index === 0 ? 'active' : undefined}
              className={f.sceneMore}
            />
          </div>
        ))}
      </div>
      <div className={f.sceneMenu} data-dim={dim('menu')}>
        <MenuPanel
          label="Ações da campanha"
          width={212}
          sections={[
            {
              items: [
                { label: 'Ver métricas', icon: ChartColumn },
                { label: 'Editar', icon: Pencil },
                { label: 'Pausar', icon: Pause },
              ],
            },
            { items: [{ label: 'Excluir campanha', icon: Trash2, danger: true }] },
          ]}
        />
      </div>
      <div className={f.sceneToast} data-dim={dim('toast')}>
        <ToastCard still tone="success" title="Campanha pausada" action={{ label: 'Desfazer', onClick: () => undefined }} />
      </div>
      <div className={f.sceneBulk} data-dim={dim('lote')}>
        <BulkBar
          count={selected.length}
          noun={selected.length === 1 ? 'selecionada' : 'selecionadas'}
          actions={[
            { label: 'Pausar', icon: Pause, onSelect: () => undefined },
            { label: 'Excluir', icon: Trash2, danger: true, onSelect: () => setSelected([]) },
          ]}
          onClear={() => setSelected([])}
        />
      </div>
    </div>
  );
}

function MiniPage({ children }: { children?: ReactNode }) {
  return (
    <div className={f.miniPage} aria-hidden="true">
      <span className={f.miniSide}>
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className={f.miniTop} />
      <span className={f.miniContent}>
        <i data-w="title" />
        <i />
        <i />
        <i />
        <i />
      </span>
      {children}
    </div>
  );
}

const LIFT_LEAD = {
  company: 'Aurora Calçados',
  code: '1042',
  owner: 'Marina Lopes',
  source: { label: 'Vitrine', icon: Store },
  value: 18000,
  contact: 'Juliana Prates',
  interests: [{ label: 'Painel de LED', tone: 'gray' as Tone }],
  nextStep: { label: 'Enviar proposta', date: '22/10' },
  attachments: 2,
  comments: 3,
  activity: 'há 2 h',
};

/** Coluna do kanban; `lifted` mostra o cartão em arrasto sobre o encaixe “Solte aqui” de onde saiu. */
function LiftColumn({ initial, interactive = false }: { initial: boolean; interactive?: boolean }) {
  const [lifted, setLifted] = useState(initial);
  return (
    <div className={f.dragColumn}>
      <div className={f.kanbanHead}>
        <span>Proposta</span>
        <span className={f.num}>2</span>
      </div>
      <div className={f.liftSlot} data-lifted={lifted || undefined}>
        <span className={f.liftPlace} aria-hidden="true">
          <KanbanPlaceholder height="auto" />
        </span>
        <div
          className={f.lift}
          data-lifted={lifted || undefined}
          {...(interactive
            ? {
                role: 'button',
                tabIndex: 0,
                'aria-pressed': lifted,
                'aria-label': 'Erguer cartão de Aurora Calçados',
                onClick: () => setLifted((value) => !value),
                onKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => {
                  if (event.key === ' ' || event.key === 'Enter') {
                    event.preventDefault();
                    setLifted((value) => !value);
                  }
                  if (event.key === 'Escape') setLifted(false);
                },
              }
            : { 'aria-hidden': true, inert: true })}
        >
          <LeadCard {...LIFT_LEAD} density="compact" />
        </div>
      </div>
      <LeadCard
        company="Estúdio Norte"
        code="1038"
        owner="Rafael Dias"
        value={8000}
        interests={[{ label: 'E-mail marketing', tone: 'gray' }]}
        activity="ontem"
        density="compact"
      />
    </div>
  );
}

function Elevacao() {
  const [focus, setFocus] = useState<LayerKey | null>(null);
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  return (
    <Board>
      <Shot title="Camadas" tone="white">
        <div className={f.layersLayout}>
          <LayerScene focus={focus} />
          <ol className={f.ladder} onPointerLeave={() => setFocus(null)}>
            {LAYERS.map((layer) => (
              <li
                key={layer.key}
                className={f.ladderRow}
                data-active={focus === layer.key || undefined}
                onPointerEnter={() => setFocus(layer.inScene ? layer.key : null)}
              >
                <span className={f.ladderSample} data-layer={layer.key} aria-hidden="true">
                  <i />
                </span>
                <span className={f.ladderText}>
                  <strong>{layer.label}</strong>
                  <span>{layer.look}</span>
                </span>
                <span className={f.ladderZ}>{layer.z}</span>
              </li>
            ))}
          </ol>
        </div>
      </Shot>

      <Shot
        title="Véu"
        aside={
          <span className={f.inline} data-gap="8">
            <Button size="sm" onClick={() => setDrawer(true)}>
              Abrir gaveta
            </Button>
            <Button size="sm" onClick={() => setModal(true)}>
              Abrir modal
            </Button>
          </span>
        }
      >
        <div className={f.pairGrid}>
          <Sample caption="Modal · 70">
            <MiniPage>
              <span className={f.miniVeil} />
              <span className={f.miniModal}>
                <i data-w="title" />
                <i />
                <span className={f.miniModalFoot}>
                  <i />
                  <i data-primary="" />
                </span>
              </span>
            </MiniPage>
          </Sample>
          <Sample caption="Gaveta · 60">
            <MiniPage>
              <span className={f.miniVeil} />
              <span className={f.miniDrawer}>
                <i data-w="title" />
                <i />
                <i />
                <i />
              </span>
            </MiniPage>
          </Sample>
        </div>
        <Dialog
          open={modal}
          onClose={() => setModal(false)}
          size="sm"
          title="Pausar veiculação?"
          description="Coleção Primavera-Verão no portal"
          footer={
            <>
              <Button onClick={() => setModal(false)}>Cancelar</Button>
              <Button variant="primary" onClick={() => setModal(false)}>
                Pausar campanha
              </Button>
            </>
          }
        />
        <Drawer
          open={drawer}
          onClose={() => setDrawer(false)}
          size="sm"
          title="Coleção Primavera-Verão no portal"
          description="#2041 · Aurora Calçados"
          footer={
            <Button variant="primary" onClick={() => setDrawer(false)}>
              Ver campanha
            </Button>
          }
        >
          <dl className={f.propList} data-plain="">
            <div>
              <dt>Verba</dt>
              <dd className={f.num}>R$ 18.000,00</dd>
            </div>
            <div>
              <dt>Período</dt>
              <dd className={f.num}>01/10 – 31/10</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <Badge variant="text" tone="green" live>
                  Veiculando
                </Badge>
              </dd>
            </div>
          </dl>
        </Drawer>
      </Shot>

      <Shot title="Arrasto">
        <div className={f.dragPair}>
          <Sample caption="Repouso">
            <LiftColumn initial={false} />
          </Sample>
          <Sample caption="Em arrasto">
            <LiftColumn initial interactive />
          </Sample>
        </div>
      </Shot>

      <Shot title="Repouso">
        <Sample caption="Sem sombra">
          <div className={f.restRow}>
            <div className={f.restStat}>
              <span>Impressões</span>
              <strong className={f.num}>271.400</strong>
              <small>Entregues no período</small>
            </div>
            <div className={f.miniTable} data-wide="">
              <div className={f.miniHead}>
                <span>Campanha</span>
                <span>Verba</span>
              </div>
              <div className={f.miniRow}>
                <span>Coleção Primavera-Verão</span>
                <span className={f.num}>R$ 18.000,00</span>
              </div>
              <div className={f.miniRow}>
                <span>Convite para o estande</span>
                <span className={f.num}>R$ 3.600,00</span>
              </div>
            </div>
            <div className={f.assetCard} data-rest="">
              <strong>Painel de LED — Pavilhão Azul</strong>
              <span>Mídia física</span>
              <small className={f.num}>R$ 18.000,00</small>
            </div>
          </div>
        </Sample>
      </Shot>
    </Board>
  );
}

/* ————————————————————————————————————————————————————————————————
 * Iconografia
 * ———————————————————————————————————————————————————————————————— */

const ICON_SET: { icon: LucideIcon; name: string; use: string }[] = [
  { icon: Megaphone, name: 'Megaphone', use: 'Campanhas' },
  { icon: FileText, name: 'FileText', use: 'Pedidos' },
  { icon: Users, name: 'Users', use: 'Públicos' },
  { icon: RadioTower, name: 'RadioTower', use: 'Canais' },
  { icon: Boxes, name: 'Boxes', use: 'Inventário' },
  { icon: Gift, name: 'Gift', use: 'Bônus' },
  { icon: ChartColumn, name: 'ChartColumn', use: 'Métricas' },
  { icon: Store, name: 'Store', use: 'Vitrine' },
  { icon: CalendarDays, name: 'CalendarDays', use: 'Período' },
  { icon: Search, name: 'Search', use: 'Busca' },
  { icon: ListFilter, name: 'ListFilter', use: 'Filtros' },
  { icon: Download, name: 'Download', use: 'Exportar' },
  { icon: Pencil, name: 'Pencil', use: 'Editar' },
  { icon: Trash2, name: 'Trash2', use: 'Excluir' },
  { icon: Pause, name: 'Pause', use: 'Pausar' },
  { icon: Play, name: 'Play', use: 'Retomar' },
  { icon: Send, name: 'Send', use: 'Enviar' },
  { icon: Check, name: 'Check', use: 'Feito' },
  { icon: X, name: 'X', use: 'Fechar' },
  { icon: ChevronDown, name: 'ChevronDown', use: 'Abrir' },
  { icon: ArrowUpRight, name: 'ArrowUpRight', use: 'Externo' },
  { icon: Bell, name: 'Bell', use: 'Avisos' },
  { icon: Settings, name: 'Settings', use: 'Ajustes' },
  { icon: Paperclip, name: 'Paperclip', use: 'Anexo' },
];

const ICON_SIZES: [number, string][] = [
  [12, 'Chip'],
  [14, 'Ajuda'],
  [15, 'Controle sm'],
  [16, 'Controle'],
  [17, 'Menu lateral'],
  [18, 'Toast'],
  [20, 'Vazio'],
];

const ICON_STROKES: [number, string][] = [
  [1.5, 'Menu'],
  [1.75, 'Padrão'],
  [2.5, 'Check'],
];

function ActionRow({ force, hoverIcon }: { force?: string; hoverIcon?: boolean }) {
  return (
    <div className={f.actionRow} data-force={force}>
      <span className={f.actionName}>
        <strong>Guia do visitante</strong>
        <small>#2020</small>
      </span>
      <span className={f.actionIcons}>
        <button type="button" className={f.actionIcon} aria-label="Métricas">
          <ChartColumn aria-hidden="true" />
        </button>
        <button type="button" className={f.actionIcon} aria-label="Editar" data-force={hoverIcon ? 'hover' : undefined}>
          <Pencil aria-hidden="true" />
        </button>
        <button type="button" className={f.actionIcon} aria-label="Excluir">
          <Trash2 aria-hidden="true" />
        </button>
      </span>
    </div>
  );
}

function Iconografia() {
  const { copied, copy, region } = useCopy();
  return (
    <Board>
      {region}
      <Shot title="Conjunto" tone="white" pad="none">
        <div className={f.iconGrid}>
          {ICON_SET.map(({ icon: Icon, name, use }) => (
            <button
              key={name}
              type="button"
              className={f.iconCell}
              data-copied={copied === name || undefined}
              onClick={() => copy(name, name)}
              aria-label={`${name}, ${use}. Copiar nome`}
            >
              {copied === name ? <Check aria-hidden="true" data-check="" /> : <Icon aria-hidden="true" />}
              <span className={f.iconName}>{copied === name ? 'Copiado' : name}</span>
              <span className={f.iconUse}>{use}</span>
            </button>
          ))}
        </div>
      </Shot>

      <Shot title="Tamanhos" tone="white">
        <div className={f.sizeRow}>
          {ICON_SIZES.map(([size, use]) => (
            <div key={size} className={f.sizeItem}>
              <span className={f.sizeBox}>
                <CalendarDays aria-hidden="true" width={size} height={size} />
              </span>
              <span className={f.sizeNum}>{size}</span>
              <span className={f.cap}>{use}</span>
            </div>
          ))}
        </div>
      </Shot>

      <Shot title="Traço" tone="white">
        <div className={f.strokeRow}>
          {ICON_STROKES.map(([stroke, use]) => (
            <div key={stroke} className={f.strokeItem}>
              <span className={f.strokeBig}>
                <Megaphone aria-hidden="true" style={{ strokeWidth: stroke }} />
              </span>
              <span className={f.sizeNum}>{String(stroke).replace('.', ',')}</span>
              <span className={f.cap}>{use}</span>
            </div>
          ))}
        </div>
      </Shot>

      <Shot title="Cor por estado">
        <div className={f.iconStates}>
          <Sample caption="Repouso · g-400">
            <ActionRow />
          </Sample>
          <Sample caption="Linha em hover · g-600">
            <ActionRow force="hover" />
          </Sample>
          <Sample caption="Ícone em hover · ink">
            <ActionRow force="hover" hoverIcon />
          </Sample>
          <Sample caption="Ativo · b-600">
            <div className={f.navSample} data-single="">
              <span className={f.navItem} aria-current="page">
                <Megaphone aria-hidden="true" />
                <span className={f.navLabel}>Campanhas</span>
                <span className={f.navCount}>5</span>
              </span>
            </div>
          </Sample>
          <Sample caption="Destrutivo · red-ink">
            <MenuPanel
              label="Ações"
              width={196}
              sections={[{ items: [{ label: 'Excluir campanha', icon: Trash2, danger: true }] }]}
            />
          </Sample>
        </div>
      </Shot>

      <Shot title="Com texto">
        <div className={f.withText}>
          <Sample caption="Botão · 16 · 7">
            <Button variant="primary" icon={Plus}>
              Nova campanha
            </Button>
          </Sample>
          <Sample caption="Menu lateral · 17 · 11">
            <div className={f.navSample} data-single="">
              <span className={f.navItem}>
                <RadioTower aria-hidden="true" />
                <span className={f.navLabel}>Canais</span>
              </span>
            </div>
          </Sample>
          <Sample caption="Campo · 16 · 8">
            <Input icon={Search} placeholder="Campanha ou nº" aria-label="Buscar campanha" className={f.fieldWide} />
          </Sample>
          <Sample caption="Ajuda · 14">
            <p className={f.hintLine}>
              <Info aria-hidden="true" />
              Múltiplos de R$ 45,00
            </p>
          </Sample>
        </div>
      </Shot>
    </Board>
  );
}

/* ————————————————————————————————————————————————————————————————
 * Movimento
 * ———————————————————————————————————————————————————————————————— */

type Bezier = [number, number, number, number];
const MOTION_TOKENS: { token: string; value: string; use: string; ms?: number; curve?: Bezier }[] = [
  { token: '--dur-1', value: '120 ms', use: 'Cor e hover', ms: 120 },
  { token: '--dur-2', value: '180 ms', use: 'Abrir e marcar', ms: 180 },
  { token: '--dur-3', value: '280 ms', use: 'Camada e altura', ms: 280 },
  { token: '--dur-exit', value: '160 ms', use: 'Saída', ms: 160 },
  { token: '--ease-out', value: '.22 1 .36 1', use: 'Entrada', curve: [0.22, 1, 0.36, 1] },
  { token: '--ease-in', value: '.4 0 1 1', use: 'Saída', curve: [0.4, 0, 1, 1] },
  { token: '--ease-move', value: '.65 0 .35 1', use: 'Mudar de lugar', curve: [0.65, 0, 0.35, 1] },
  { token: '--ease-spring', value: '.34 1.36 .64 1', use: 'Só marcas', curve: [0.34, 1.36, 0.64, 1] },
];

function CurvePlot({ curve }: { curve: Bezier }) {
  const [x1, y1, x2, y2] = curve;
  const px = (t: number) => 6 + t * 52;
  const py = (t: number) => 34 - t * 24;
  return (
    <svg className={f.curve} viewBox="0 0 64 40" aria-hidden="true">
      <path className={f.curveAxis} d="M6.5 4v30.5H60" />
      <path
        className={f.curveLine}
        d={`M${px(0)} ${py(0)}C${px(x1)} ${py(y1)} ${px(x2)} ${py(y2)} ${px(1)} ${py(1)}`}
      />
    </svg>
  );
}

/** Repete uma coreografia quando `run` muda (montar não toca; o modo estrito não repete). */
function useReplay(run: number, play: () => void | (() => void)) {
  const last = useRef(run);
  const playRef = useRef(play);
  useEffect(() => {
    playRef.current = play;
  });
  useEffect(() => {
    if (last.current === run) return;
    last.current = run;
    return playRef.current() ?? undefined;
  }, [run]);
}

/** Sequência de passos com atraso (ms). Limpa os temporizadores ao repetir. */
function sequence(steps: [number, () => void][]) {
  const timers = steps.map(([delay, fn]) => window.setTimeout(fn, delay));
  return () => timers.forEach((timer) => window.clearTimeout(timer));
}

function PressDemo({ run }: { run: number }) {
  const [pressed, setPressed] = useState(false);
  useReplay(run, () => sequence([[0, () => setPressed(true)], [220, () => setPressed(false)]]));
  return (
    <span className={f.pressWrap} data-pressed={pressed || undefined}>
      <Button variant="primary" data-force={pressed ? 'active' : undefined}>
        Enviar para aprovação
      </Button>
    </span>
  );
}

function MenuDemo({ run }: { run: number }) {
  const [open, setOpen] = useState(true);
  useReplay(run, () => sequence([[0, () => setOpen(false)], [260, () => setOpen(true)]]));
  return (
    <div className={f.menuDemo}>
      <Button size="sm" trailingIcon={ChevronDown} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        Ações
      </Button>
      <div className={f.pop} data-open={open || undefined} inert={!open}>
        <MenuPanel
          label="Ações da campanha"
          width={184}
          sections={[
            {
              items: [
                { label: 'Editar', icon: Pencil },
                { label: 'Pausar', icon: Pause },
              ],
            },
            { items: [{ label: 'Excluir campanha', icon: Trash2, danger: true }] },
          ]}
        />
      </div>
    </div>
  );
}

function ModalDemo({ run }: { run: number }) {
  const [open, setOpen] = useState(true);
  useReplay(run, () => sequence([[0, () => setOpen(false)], [320, () => setOpen(true)]]));
  return (
    <div className={f.layerDemo}>
      <MiniPage />
      <span className={f.demoVeil} data-open={open || undefined} />
      <div className={f.demoModal} data-open={open || undefined} aria-hidden="true">
        <strong>Excluir campanha?</strong>
        <span className={f.demoModalFoot}>
          <i />
          <i data-danger="" />
        </span>
      </div>
    </div>
  );
}

function DrawerDemo({ run }: { run: number }) {
  const [open, setOpen] = useState(true);
  useReplay(run, () => sequence([[0, () => setOpen(false)], [320, () => setOpen(true)]]));
  return (
    <div className={f.layerDemo}>
      <MiniPage />
      <span className={f.demoVeil} data-open={open || undefined} />
      <div className={f.demoDrawer} data-open={open || undefined} aria-hidden="true">
        <strong>Aurora Calçados</strong>
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}

/** O Toast real: sai (desliza 8 px, --dur-exit) e volta a entrar (sobe 8 px, --dur-3). */
function ToastDemo({ run }: { run: number }) {
  const [phase, setPhase] = useState<'open' | 'leaving' | 'closed'>('open');
  const [mount, setMount] = useState(0);
  useReplay(run, () =>
    sequence([
      [0, () => setPhase('leaving')],
      [200, () => setPhase('closed')],
      [360, () => {
        setMount((n) => n + 1);
        setPhase('open');
      }],
    ]),
  );
  return (
    <div className={f.toastDemo} inert>
      {phase !== 'closed' && (
        <ToastCard
          key={mount}
          still={mount === 0}
          leaving={phase === 'leaving'}
          tone="success"
          title="Campanha pausada"
          action={{ label: 'Desfazer', onClick: () => undefined }}
          className={f.demoToast}
        />
      )}
    </div>
  );
}

function AccordionDemo({ run }: { run: number }) {
  const [open, setOpen] = useState(true);
  const id = useId();
  useReplay(run, () => sequence([[0, () => setOpen(false)], [380, () => setOpen(true)]]));
  return (
    <div className={f.accordion} data-open={open || undefined}>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((value) => !value)}>
        <span>Bônus liberados</span>
        <span className={f.num}>2</span>
        <ChevronDown aria-hidden="true" />
      </button>
      <div id={id} className={f.accordionBody} inert={!open}>
        <div>
          <div className={f.accordionInner}>
            <span>
              <i /> +20% de impressões
            </span>
            <span>
              <i /> Desconto de fidelidade
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckDemo({ run }: { run: number }) {
  const [checked, setChecked] = useState(true);
  useReplay(run, () => sequence([[0, () => setChecked(false)], [260, () => setChecked(true)]]));
  return <Checkbox label="Incluir bônus" checked={checked} onChange={(event) => setChecked(event.target.checked)} />;
}

const TAB_ITEMS = [
  { value: 'geral', label: 'Visão geral' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'historico', label: 'Histórico' },
] as const;
type TabValue = (typeof TAB_ITEMS)[number]['value'];

function TabsDemo({ run }: { run: number }) {
  const [tab, setTab] = useState<TabValue>('geral');
  useReplay(run, () => {
    setTab((current) => {
      const index = TAB_ITEMS.findIndex((item) => item.value === current);
      return TAB_ITEMS[(index + 1) % TAB_ITEMS.length]?.value ?? 'geral';
    });
  });
  return (
    <div className={f.tabsDemo}>
      <Tabs label="Seções da campanha" value={tab} onChange={setTab} items={TAB_ITEMS.map((item) => ({ ...item }))} />
    </div>
  );
}

const RANKING = [
  { name: 'Aurora Calçados', money: 'R$ 52.400,00' },
  { name: 'Estúdio Norte', money: 'R$ 31.000,00' },
  { name: 'Casa Forma', money: 'R$ 18.600,00' },
];

function ReorderDemo({ run }: { run: number }) {
  const [order, setOrder] = useState(RANKING.map((row) => row.name));
  const nodes = useRef(new Map<string, HTMLElement>());
  const before = useRef(new Map<string, number>());
  useReplay(run, () => {
    nodes.current.forEach((node, key) => before.current.set(key, node.getBoundingClientRect().top));
    setOrder((list) => {
      const last = list[list.length - 1];
      return last ? [last, ...list.slice(0, -1)] : list;
    });
  });
  useIsoLayoutEffect(() => {
    if (before.current.size === 0) return;
    nodes.current.forEach((node, key) => {
      const top = before.current.get(key);
      if (top === undefined) return;
      const delta = top - node.getBoundingClientRect().top;
      if (!delta) return;
      node.style.transition = 'none';
      node.style.transform = `translateY(${delta}px)`;
      void node.offsetHeight;
      node.style.transition = '';
      node.style.transform = '';
    });
    before.current.clear();
  }, [order]);
  return (
    <ol className={f.rank}>
      {order.map((name, index) => {
        const row = RANKING.find((item) => item.name === name);
        return (
          <li
            key={name}
            ref={(node) => {
              if (node) nodes.current.set(name, node);
              else nodes.current.delete(name);
            }}
          >
            <span className={f.rankPos}>{index + 1}</span>
            <BrandMark name={name} size="xs" variant="soft" decorative />
            <span className={f.rankName}>{name}</span>
            <span className={f.num}>{row?.money}</span>
          </li>
        );
      })}
    </ol>
  );
}

const LIVE_DEMOS: { name: string; Demo: ComponentType<{ run: number }> }[] = [
  { name: 'Botão', Demo: PressDemo },
  { name: 'Menu', Demo: MenuDemo },
  { name: 'Modal', Demo: ModalDemo },
  { name: 'Gaveta', Demo: DrawerDemo },
  { name: 'Toast', Demo: ToastDemo },
  { name: 'Acordeão', Demo: AccordionDemo },
  { name: 'Check', Demo: CheckDemo },
  { name: 'Abas', Demo: TabsDemo },
  { name: 'Reordenar', Demo: ReorderDemo },
];

function LiveCell({ name, Demo }: { name: string; Demo: ComponentType<{ run: number }> }) {
  const [run, setRun] = useState(0);
  return (
    <figure className={f.liveCell}>
      <div className={f.liveStage}>
        <Demo run={run} />
      </div>
      <figcaption className={f.liveFoot}>
        <span>{name}</span>
        <IconButton variant="ghost" size="sm" icon={RotateCcw} label={`Repetir ${name.toLowerCase()}`} onClick={() => setRun((n) => n + 1)} />
      </figcaption>
    </figure>
  );
}

const CREATION_STEPS = ['Conferindo regras do ativo', 'Gerando a campanha', 'Notificando o comercial do portal'];

function CreationRhythm({ run }: { run: number }) {
  const [active, setActive] = useState(0);
  const [done, setDone] = useState(false);
  const [cycle, setCycle] = useState(0);
  useReplay(run, () => {
    setActive(0);
    setDone(false);
    setCycle((n) => n + 1);
  });
  useEffect(() => {
    if (done) return;
    const finished = active >= CREATION_STEPS.length;
    const timer = window.setTimeout(
      () => (finished ? setDone(true) : setActive((n) => n + 1)),
      finished ? 220 : 720,
    );
    return () => window.clearTimeout(timer);
  }, [active, done, cycle]);
  return (
    <div className={f.creation} aria-live="polite">
      {done ? (
        <div className={f.creationSuccess}>
          <div className={f.creationDone}>
            <svg className={f.seal} viewBox="0 0 40 40" aria-hidden="true">
              <circle className={f.sealFill} cx="20" cy="20" r="20" />
              <path className={f.sealCheck} d="M12.5 20.5l5 5L28 15" pathLength={1} />
            </svg>
            <div>
              <strong>Campanha enviada para aprovação</strong>
              <span>O comercial do portal responde por aqui.</span>
            </div>
          </div>
          <div className={f.creationRecord}>
            <p>
              <strong>Coleção Primavera-Verão 2027</strong>
              <span className={f.num}>#2047</span>
            </p>
            <span className={f.factsClip}>
              <span className={f.creationFacts}>
                <span>R$ 18.000,00</span>
                <span>05/10 – 31/10</span>
                <span>Aurora Calçados</span>
              </span>
            </span>
          </div>
          <div className={f.creationActions}>
            <Button>Criar outra campanha</Button>
            <Button variant="primary" trailingIcon={ArrowRight}>
              Ver campanha
            </Button>
          </div>
        </div>
      ) : (
        <div className={f.creationRun} data-leaving={active >= CREATION_STEPS.length || undefined}>
          <strong>Coleção Primavera-Verão 2027</strong>
          <span className={f.creationFacts}>
            <span>R$ 18.000,00</span>
            <span>05/10 – 31/10</span>
            <span>Aurora Calçados</span>
          </span>
          <ol className={f.creationSteps}>
            {CREATION_STEPS.map((label, index) => {
              const state = index < active ? 'done' : index === active ? 'running' : 'pending';
              return (
                <li key={label} data-state={state}>
                  <span className={f.creationMarker} aria-hidden="true">
                    {state === 'pending' && index + 1}
                    {state === 'running' && (
                      <svg className={f.spinner} viewBox="0 0 20 20">
                        <circle className={f.spinnerTrack} cx="10" cy="10" r="8" />
                        <circle className={f.spinnerArc} cx="10" cy="10" r="8" pathLength={1} />
                      </svg>
                    )}
                    {state === 'done' && (
                      <svg className={f.tick} viewBox="0 0 12 12">
                        <path d="M2.5 6.2 5 8.6l4.6-5.2" pathLength={1} />
                      </svg>
                    )}
                  </span>
                  {label}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}

type MotionToken = (typeof MOTION_TOKENS)[number];

/**
 * Linha de token: o ponto percorre o trilho com a duração/curva do token e volta com a saída
 * (--dur-exit, --ease-in). Toca no clique, Enter/Espaço, e uma vez quando a tabela entra na tela.
 */
function MotionRow({ row, cue }: { row: MotionToken; cue: number }) {
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const play = useCallback(() => {
    window.clearTimeout(timer.current);
    setPlaying(false);
    requestAnimationFrame(() => {
      setPlaying(true);
      timer.current = window.setTimeout(() => setPlaying(false), (row.ms ?? 280) + 520);
    });
  }, [row.ms]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useReplay(cue, play);
  return (
    <button
      type="button"
      className={f.motionRow}
      data-playing={playing || undefined}
      aria-label={`Reproduzir ${row.token}, ${row.value}`}
      onClick={play}
      style={
        {
          '--play-d': row.ms ? `${row.ms}ms` : 'var(--dur-3)',
          '--play-e': row.curve ? `cubic-bezier(${row.curve.join(',')})` : 'var(--ease-out)',
        } as CSSProperties
      }
    >
      <span className={f.motionToken}>{row.token}</span>
      <span className={f.motionValue}>{row.value}</span>
      <span className={f.motionUse}>{row.use}</span>
      <span className={f.motionViz}>
        {row.curve ? (
          <CurvePlot curve={row.curve} />
        ) : (
          <span className={f.durTrack}>
            <span style={{ width: `${((row.ms ?? 0) / 280) * 100}%` }} />
          </span>
        )}
      </span>
      <span className={f.playTrack} aria-hidden="true">
        <i />
      </span>
    </button>
  );
}

/** Toca todas as linhas juntas, uma vez, quando a tabela aparece: a largada comum compara os tempos. */
function MotionTable() {
  const ref = useRef<HTMLDivElement>(null);
  const [cue, setCue] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    let timer: number | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        timer = window.setTimeout(() => setCue(1), 240);
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);
  return (
    <div ref={ref} className={f.motionTable}>
      {MOTION_TOKENS.map((row) => (
        <MotionRow key={row.token} row={row} cue={cue} />
      ))}
    </div>
  );
}

function Movimento() {
  const [reduced, setReduced] = useState(false);
  const [compare, setCompare] = useState(0);
  const [rhythm, setRhythm] = useState(0);
  return (
    <Board>
      <Shot title="Tokens" tone="white">
        <MotionTable />
      </Shot>

      <Shot
        title="Ao vivo"
        aside={<Switch label="Movimento reduzido" size="sm" checked={reduced} onCheckedChange={setReduced} />}
      >
        <div className={f.liveGrid} data-motion={reduced ? 'reduced' : undefined}>
          {LIVE_DEMOS.map(({ name, Demo }) => (
            <LiveCell key={name} name={name} Demo={Demo} />
          ))}
        </div>
      </Shot>

      <Shot
        title="Reduzido"
        aside={<IconButton variant="ghost" size="sm" icon={RotateCcw} label="Repetir comparação" onClick={() => setCompare((n) => n + 1)} />}
      >
        <div className={f.pairGrid}>
          <Sample caption="Padrão">
            <div className={f.compareCell}>
              <ModalDemo run={compare} />
            </div>
          </Sample>
          <Sample caption="Reduzido">
            <div className={f.compareCell} data-motion="reduced">
              <ModalDemo run={compare} />
            </div>
          </Sample>
        </div>
      </Shot>

      <Shot
        title="Ritmo"
        aside={<IconButton variant="ghost" size="sm" icon={RotateCcw} label="Repetir criação" onClick={() => setRhythm((n) => n + 1)} />}
      >
        <CreationRhythm run={rhythm} />
      </Shot>
    </Board>
  );
}

/* ————————————————————————————————————————————————————————————————
 * Temas e white-label
 * ———————————————————————————————————————————————————————————————— */

const THEME_ROWS = [
  { name: 'Coleção Primavera-Verão no portal', sub: 'Aurora Calçados', status: 'Veiculando', tone: 'green' as Tone, live: true, money: 'R$ 18.000,00' },
  { name: 'Destaque couro vegetal', sub: 'Lume Acessórios', status: 'Aguardando aprovação', tone: 'violet' as Tone, money: 'R$ 9.000,00' },
  { name: 'Carrossel de tendências', sub: 'Aurora Calçados', status: 'Rascunho', tone: 'gray' as Tone, money: 'R$ 6.500,00' },
];

function mix(hex: string, target: string, t: number) {
  const a = toHex(hex) ?? '#000000';
  const b = toHex(target) ?? '#000000';
  const out = [1, 3, 5].map((i) => {
    const ca = parseInt(a.slice(i, i + 2), 16);
    const cb = parseInt(b.slice(i, i + 2), 16);
    return Math.round(ca + (cb - ca) * t)
      .toString(16)
      .padStart(2, '0');
  });
  return `#${out.join('')}`;
}

/** Cor do portal → texto sobre ela (branco ou tinta) e versão escura para links em papel (≥ 4,5:1). */
function portalPalette(hex: string, ink: string) {
  const onWhite = contrast(hex, '#ffffff');
  const onInk = contrast(hex, ink);
  const on = onWhite >= 4.5 || onWhite >= onInk ? '#ffffff' : ink;
  let text = hex;
  for (let t = 0.04; contrast(text, '#ffffff') < 4.5 && t <= 1; t += 0.04) text = mix(hex, '#000000', t);
  return { on, onRatio: Math.max(onWhite, onInk), text, textRatio: contrast(text, '#ffffff') };
}

const PORTALS = [
  { id: 'francal', name: 'Francal 2026', color: '#f28c28' },
  { id: 'couro', name: 'Couro Sul', color: '#13a3a5' },
  { id: 'textil', name: 'Feira Têxtil', color: '#7454ea' },
];

function PortalGlyph({ color, on, size = 32 }: { color: string; on: string; size?: number }) {
  return (
    <span className={f.portalMark} style={{ width: size, height: size, background: color, color: on }} aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M5 19a14 14 0 0 1 14-14" />
          <path d="M10 19a9 9 0 0 1 9-9" />
        </g>
        <circle cx="18.6" cy="18.6" r="1.6" fill="currentColor" />
      </svg>
    </span>
  );
}

function Temas() {
  const { ref, hex } = useLiveHex();
  const [portalId, setPortalId] = useState('francal');
  const portal = PORTALS.find((p) => p.id === portalId) ?? PORTALS[0]!;
  const palette = portalPalette(portal.color, hex.ink ?? '#141824');
  const portalVars = {
    '--portal': portal.color,
    '--portal-on': palette.on,
    '--portal-text': palette.text,
  } as CSSProperties;
  return (
    <Board boardRef={ref}>
      <Shot title="Papéis em uso">
        <div className={f.schemeFrame}>
          <div className={f.schemeTop}>
            <span className={f.schemeMenu}>
              <IconButton variant="ghost" size="sm" icon={MenuGlyph} label="Abrir menu" />
            </span>
            <span className={f.schemeCrumb}>
              <span>Operação</span>
              <ChevronRight aria-hidden="true" />
              <strong>Campanhas</strong>
            </span>
            <IconButton variant="ghost" size="sm" icon={Bell} label="Notificações" />
          </div>
          <div className={f.schemeBody}>
            <div className={f.schemeHead}>
              <strong>Campanhas</strong>
              <Button variant="primary" size="sm" icon={Plus}>
                Nova campanha
              </Button>
            </div>
            <div className={f.schemeTools}>
              <Input size="sm" icon={Search} placeholder="Campanha, anunciante ou nº" aria-label="Buscar campanha" className={f.schemeSearch} />
              <Button size="sm" variant="ghost" icon={ListFilter}>
                Filtros
              </Button>
            </div>
            <div className={f.schemeTable}>
              {THEME_ROWS.map((row) => (
                <div key={row.name} className={f.schemeRow}>
                  <strong className={f.schemeName}>{row.name}</strong>
                  <small className={f.schemeSub}>{row.sub}</small>
                  <span className={f.schemeStatus}>
                    <Badge variant="text" tone={row.tone} live={row.live}>
                      {row.status}
                    </Badge>
                  </span>
                  <span className={`${f.num} ${f.schemeMoney}`}>{row.money}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Shot>

      <Shot title="Marca do portal">
        <div className={f.wlLayout} style={portalVars}>
          <div className={f.wlPicker} role="radiogroup" aria-label="Portal">
            {PORTALS.map((p) => (
              <label key={p.id} className={f.wlOption} data-checked={p.id === portalId || undefined}>
                <input
                  type="radio"
                  name="dsv3-portal"
                  value={p.id}
                  checked={p.id === portalId}
                  onChange={() => setPortalId(p.id)}
                />
                <i style={{ background: p.color }} aria-hidden="true" />
                {p.name}
              </label>
            ))}
          </div>
          <div className={f.wlGrid}>
            <Sample caption="Admin: azul fixo" align="start">
              <div className={f.wlAdmin}>
                <div className={f.wlIdentity}>
                  <PortalGlyph color={portal.color} on={palette.on} />
                  <span>
                    <strong>{portal.name}</strong>
                    <small>Portal do organizador</small>
                  </span>
                  <ChevronsUpDown aria-hidden="true" />
                </div>
                <div className={f.wlNav}>
                  <span className={f.navItem} aria-current="page">
                    <Megaphone aria-hidden="true" />
                    <span className={f.navLabel}>Campanhas</span>
                  </span>
                  <span className={f.navItem}>
                    <Store aria-hidden="true" />
                    <span className={f.navLabel}>Vitrine</span>
                  </span>
                </div>
                <div className={f.wlAdminFoot}>
                  <Button variant="primary">Salvar marca</Button>
                </div>
              </div>
            </Sample>
            <Sample
              caption={
                <span className={f.wlRatios}>
                  <span>
                    Botão <b className={f.num}>{ratioText(palette.onRatio)}</b> {levelOf(palette.onRatio)}
                  </span>
                  <span>
                    Link <b className={f.num}>{ratioText(palette.textRatio)}</b> {levelOf(palette.textRatio)}
                  </span>
                </span>
              }
              align="start"
            >
              <div className={f.vitrine}>
                <div className={f.vitrineHead}>
                  <span className={f.vitrineBrand}>
                    <PortalGlyph color={portal.color} on={palette.on} size={24} />
                    <strong>{portal.name}</strong>
                  </span>
                  <nav className={f.vitrineLinks} aria-label="Vitrine (amostra)">
                    <a href="#temas">Expositores</a>
                    <a href="#temas">Programação</a>
                  </nav>
                  <a href="#temas" className={f.vitrineCta}>
                    Agendar visita
                  </a>
                </div>
                <div className={f.vitrineBody}>
                  {[
                    { name: 'Bella Passo', place: 'Pavilhão Azul · B-214' },
                    { name: 'Couro Nobre', place: 'Pavilhão Verde · C-031' },
                  ].map((ex) => (
                    <div key={ex.name} className={f.vitrineCard}>
                      <BrandMark name={ex.name} size="sm" variant="soft" decorative />
                      <span>
                        <strong>{ex.name}</strong>
                        <small>{ex.place}</small>
                      </span>
                      <a href="#temas">Ver estande</a>
                    </div>
                  ))}
                </div>
              </div>
            </Sample>
          </div>
        </div>
      </Shot>
    </Board>
  );
}

/* ————————————————————————————————————————————————————————————————
 * Acessibilidade
 * ———————————————————————————————————————————————————————————————— */

/** Marca um descendente com `data-force="focus"` (para componentes sem a prop por item). */
function ForceFocus({ selector, children }: { selector: string; children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>(selector);
    el?.setAttribute('data-force', 'focus');
    return () => el?.removeAttribute('data-force');
  }, [selector]);
  return (
    <span ref={ref} className={f.forceWrap}>
      {children}
    </span>
  );
}

function TargetBar({ touch = false }: { touch?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [boxes, setBoxes] = useState<{ x: number; y: number; w: number; h: number }[]>([]);
  const [live, setLive] = useState(true);
  useIsoLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const measure = () => {
      const base = root.getBoundingClientRect();
      const next = Array.from(root.querySelectorAll<HTMLElement>('[data-target]')).map((el) => {
        const r = el.getBoundingClientRect();
        const w = touch ? Math.max(r.width, 40) : r.width;
        const h = touch ? Math.max(r.height, 40) : r.height;
        return { x: r.left - base.left + (r.width - w) / 2, y: r.top - base.top + (r.height - h) / 2, w, h };
      });
      setBoxes(next);
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(root);
    return () => observer?.disconnect();
  }, [touch]);
  return (
    <div ref={ref} className={f.targetBar} data-touch={touch || undefined}>
      <span data-target="" className={f.targetBox}>
        <Checkbox aria-label="Selecionar todas" />
      </span>
      <span data-target="" className={f.targetBox}>
        <Switch label="Veiculação" hideLabel size="sm" checked={live} onCheckedChange={setLive} />
      </span>
      <span className={f.targetSep} aria-hidden="true" />
      <Button size="sm" icon={ListFilter} data-target="">
        Filtros
      </Button>
      <IconButton size="sm" variant="ghost" icon={Download} label="Exportar" data-target="" />
      <IconButton size="sm" variant="ghost" icon={Trash2} label="Excluir" data-target="" />
      <span className={f.targetLayer} aria-hidden="true">
        {boxes.map((box, index) => (
          <i key={index} style={{ left: box.x, top: box.y, width: box.w, height: box.h }} />
        ))}
      </span>
    </div>
  );
}

const KEYMAP: { name: string; keys: string[]; note?: string }[] = [
  { name: 'Menu', keys: ['↑', '↓', 'Home', 'End', 'Esc'] },
  { name: 'Abas', keys: ['←', '→', 'Home', 'End'] },
  { name: 'Select', keys: ['↑', '↓', 'Enter', 'Esc'] },
  { name: 'Modal', keys: ['Tab', 'Esc'] },
  { name: 'Tabela', keys: ['Espaço'], note: 'seleção' },
  { name: 'Kanban', keys: ['Espaço', '←', '→', 'Esc'] },
  { name: 'Calendário', keys: ['←', '→', '↑', '↓', 'PgUp', 'PgDn'] },
];

/** Mostra, embaixo da amostra, o nome que o leitor de tela ouve. */
function SpokenName({ selector, children }: { selector: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [name, setName] = useState('');
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>(selector);
    if (!el) return;
    const labelledBy = el.getAttribute('aria-labelledby');
    const label = labelledBy ? document.getElementById(labelledBy)?.textContent : null;
    setName((el.getAttribute('aria-label') ?? label ?? el.textContent ?? '').trim());
  }, [selector]);
  return (
    <figure className={f.spoken}>
      <div ref={ref} className={f.spokenLive}>
        {children}
      </div>
      <figcaption>
        <code>{name || '—'}</code>
      </figcaption>
    </figure>
  );
}

function Acessibilidade() {
  const { ref, hex } = useLiveHex();
  const [advertiser, setAdvertiser] = useState('');
  const [paused, setPaused] = useState(false);
  const [said, setSaid] = useState('');
  const [veiculacao, setVeiculacao] = useState(true);
  const { announce, region } = useAnnouncer();
  const mutedRatio = contrast(hex.muted ?? '#697181', hex.paper ?? '#ffffff');
  const subtleRatio = contrast(hex.subtle ?? '#99a0ad', hex.paper ?? '#ffffff');
  return (
    <Board boardRef={ref}>
      {region}
      <Shot title="Foco" tone="white">
        <div className={f.focusRow}>
          <Sample caption="Botão">
            <Button variant="primary" data-force="focus">
              Continuar
            </Button>
          </Sample>
          <Sample caption="Campo" className={f.fieldSample}>
            <Input aria-label="Nome da campanha" defaultValue="Coleção Primavera" data-force="focus" />
          </Sample>
          <Sample caption="Checkbox">
            <Checkbox aria-label="Selecionar campanha" defaultChecked data-force="focus" />
          </Sample>
          <Sample caption="Aba">
            <ForceFocus selector="[role='tab'][aria-selected='true']">
              <Tabs
                label="Seções (amostra)"
                value="geral"
                onChange={() => undefined}
                items={[
                  { value: 'geral', label: 'Visão geral' },
                  { value: 'analytics', label: 'Analytics' },
                ]}
              />
            </ForceFocus>
          </Sample>
          <Sample caption="Linha · −2" className={f.focusWide}>
            <div className={f.focusTable}>
              <div className={f.focusTableRow} tabIndex={-1} data-force="focus">
                <span>Retargeting</span>
                <span className={f.num}>R$ 13.500,00</span>
              </div>
              <div className={f.focusTableRow}>
                <span>Guia do visitante</span>
                <span className={f.num}>R$ 12.000,00</span>
              </div>
            </div>
          </Sample>
          <Sample caption="Switch">
            <ForceFocus selector="[role='switch']">
              <Switch label="Veiculação" hideLabel checked={veiculacao} onCheckedChange={setVeiculacao} />
            </ForceFocus>
          </Sample>
          <Sample caption="Menu lateral">
            <div className={f.navSample} data-single="">
              <span className={f.navItem} aria-current="page" data-force="focus">
                <Megaphone aria-hidden="true" />
                <span className={f.navLabel}>Campanhas</span>
              </span>
            </div>
          </Sample>
        </div>
        <div className={f.tabForm}>
          <span className={f.tabKeys} aria-hidden="true">
            <Kbd>Tab</Kbd>
            <Kbd>⇧ Tab</Kbd>
          </span>
          <Field label="Nome da campanha">{({ id }) => <Input id={id} placeholder="Coleção Primavera-Verão 2027" />}</Field>
          <Field label="Anunciante">
            {({ id }) => (
              <Select
                id={id}
                value={advertiser}
                onChange={setAdvertiser}
                placeholder="Selecione"
                options={['Aurora Calçados', 'Estúdio Norte', 'Casa Forma'].map((name) => ({
                  value: name,
                  label: name,
                  leading: <BrandMark name={name} size="xs" variant="soft" decorative />,
                }))}
              />
            )}
          </Field>
          <Button variant="primary" trailingIcon={ArrowRight} className={f.tabFormCta}>
            Continuar
          </Button>
        </div>
      </Shot>

      <Shot title="Alvos">
        <div className={f.pairGrid}>
          <Sample caption="Mouse · 18–32">
            <TargetBar />
          </Sample>
          <Sample caption="Toque · ≥ 40">
            <TargetBar touch />
          </Sample>
        </div>
      </Shot>

      <Shot title="Teclado" tone="white">
        <div className={f.keyTable}>
          {KEYMAP.map((row) => (
            <div key={row.name} className={f.keyRow}>
              <span className={f.keyName}>{row.name}</span>
              <span className={f.keyKeys}>
                {row.keys.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
                {row.note && <span className={f.cap}>{row.note}</span>}
              </span>
            </div>
          ))}
        </div>
      </Shot>

      <Shot title="Leitor de tela" tone="white">
        <div className={f.spokenGrid}>
          <SpokenName selector="button">
            <IconButton variant="ghost" icon={Trash2} label="Excluir campanha" />
          </SpokenName>
          <SpokenName selector="[data-tone]">
            <Badge variant="text" tone="green" live>
              Veiculando
            </Badge>
          </SpokenName>
          <SpokenName selector="[role='switch']">
            <div className={f.spokenRow}>
              <Switch
                label="Veiculação de Coleção Primavera-Verão"
                hideLabel
                checked={veiculacao}
                onCheckedChange={setVeiculacao}
              />
              <span>Coleção Primavera-Verão</span>
            </div>
          </SpokenName>
          <figure className={f.spoken}>
            <div className={f.spokenLive}>
              <Button
                icon={paused ? Play : Pause}
                onClick={() => {
                  const next = !paused;
                  const text = next ? 'Campanha pausada' : 'Campanha retomada';
                  setPaused(next);
                  setSaid(text);
                  announce(text);
                }}
              >
                {paused ? 'Retomar' : 'Pausar'}
              </Button>
            </div>
            <figcaption>
              <code key={said} className={f.announced} data-empty={said ? undefined : true}>
                {said || '—'}
              </code>
            </figcaption>
          </figure>
        </div>
      </Shot>

      <Shot title="Contraste">
        <div className={f.pairGrid}>
          <Sample caption={`muted · ${ratioText(mutedRatio)} · ${levelOf(mutedRatio)}`}>
            <p className={f.contrastDemo}>
              <strong className={f.num}>271.400</strong>
              <span>Entregues no período</span>
            </p>
          </Sample>
          <Sample caption={`subtle · ${ratioText(subtleRatio)} · só placeholder`}>
            <Input
              icon={Search}
              placeholder="Campanha, anunciante ou nº"
              aria-label="Buscar campanha"
              className={f.fieldWide}
            />
          </Sample>
        </div>
      </Shot>
    </Board>
  );
}

/* ————————————————————————————————————————————————————————————————
 * Linguagem e formatação
 * ———————————————————————————————————————————————————————————————— */

function Change({ dir, children }: { dir: 'up' | 'down'; children: ReactNode }) {
  const Icon = dir === 'up' ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={f.change} data-dir={dir}>
      <Icon aria-hidden="true" />
      {children}
    </span>
  );
}

const FORMATS: { kind: string; values: ReactNode[] }[] = [
  { kind: 'Dinheiro exato', values: ['R$ 18.000,00'] },
  { kind: 'Estimativa', values: ['≈ 400.000', '≈ R$ 9.000'] },
  { kind: 'Compacto', values: ['1,24 mi', '25 mil'] },
  { kind: 'Percentual', values: ['50,7%'] },
  {
    kind: 'Variação',
    values: [
      <Change key="up" dir="up">
        3,8%
      </Change>,
      <Change key="down" dir="down">
        14,5%
      </Change>,
      '4 p.p.',
    ],
  },
  { kind: 'Data', values: ['05/10/2026'] },
  { kind: 'Intervalo', values: ['05/10 – 31/10'] },
  { kind: 'Completo', values: ['01/10/2026 – 31/10/2026'] },
  { kind: 'Data e hora', values: ['29/09/2026 às 16:42'] },
  { kind: 'Lista', values: ['22/10 · 16:25'] },
  { kind: 'Duração', values: ['27 dias'] },
  { kind: 'Relativo', values: ['há 2 h'] },
  { kind: 'Ausente', values: ['—', 'A definir', 'Não informado'] },
  {
    kind: 'Faltante',
    values: [
      <span key="falta" className={f.missing}>
        Falta
      </span>,
    ],
  },
];

function FormatTable({ rows }: { rows: typeof FORMATS }) {
  return (
    <div className={f.formatTable} role="table" aria-label="Formatos">
      <div className={f.formatHead} role="row">
        <span role="columnheader">Tipo</span>
        <span role="columnheader">Exemplo</span>
      </div>
      {rows.map((row) => (
        <div key={row.kind} className={f.formatRow} role="row">
          <span role="cell">{row.kind}</span>
          <span role="cell" className={f.formatValues}>
            {row.values.map((value, index) => (
              <span key={index}>{value}</span>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

const brl = (value: number, digits = 2) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

function estimate(value: number) {
  if (value <= 0) return '0';
  const magnitude = 10 ** Math.max(0, Math.floor(Math.log10(value)) - 2);
  return brl(Math.round(value / magnitude) * magnitude, 0);
}

function compact(value: number) {
  if (value >= 1e6) return `${(value / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} mi`;
  if (value >= 1e3) return `${(value / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: value < 1e5 ? 1 : 0 })} mil`;
  return brl(value, 0);
}

function MoneyLive() {
  const [cents, setCents] = useState('1800000');
  const value = Number(cents || '0') / 100;
  const outputs = [
    { label: 'Exato', text: `R$ ${brl(value)}` },
    { label: 'Estimativa', text: `≈ R$ ${estimate(value)}` },
    { label: 'Compacto', text: `R$ ${compact(value)}` },
  ];
  return (
    <div className={f.moneyLive}>
      <Field label="Verba">
        {({ id }) => (
          <Input
            id={id}
            prefix="R$"
            inputMode="numeric"
            value={brl(value)}
            onChange={(event) => setCents(event.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 11))}
            className={f.moneyInput}
          />
        )}
      </Field>
      <div className={f.moneyOut} aria-live="polite">
        {outputs.map((out) => (
          <span key={out.label} className={f.moneyChip}>
            <span>{out.label}</span>
            <strong key={out.text} className={f.num}>
              {out.text}
            </strong>
          </span>
        ))}
      </div>
    </div>
  );
}

const BUTTON_PAIRS: { variant: 'primary' | 'danger' | 'secondary'; good: string; bad: string }[] = [
  { variant: 'primary', good: 'Enviar para aprovação', bad: 'OK' },
  { variant: 'danger', good: 'Excluir 2 campanhas', bad: 'Sim' },
  { variant: 'secondary', good: 'Salvar rascunho', bad: 'Clique aqui para salvar' },
];

const TERMS: { use: string; avoid?: string; note?: string }[] = [
  { use: 'Verba', avoid: 'Investimento' },
  { use: 'Briefing', avoid: 'Formulário' },
  { use: 'P.I.', note: 'pedido de inserção' },
  { use: 'Criada pelo admin', avoid: 'admin do portal' },
];

function Conteudo() {
  const half = Math.ceil(FORMATS.length / 2);
  return (
    <Board>
      <Shot title="Formatos">
        <div className={f.formatGrid}>
          <FormatTable rows={FORMATS.slice(0, half)} />
          <FormatTable rows={FORMATS.slice(half)} />
        </div>
      </Shot>

      <Shot title="Ao vivo" tone="white">
        <MoneyLive />
      </Shot>

      <Shot title="Botões" tone="white">
        <div className={f.buttonPairs}>
          {BUTTON_PAIRS.map((pair) => (
            <div key={pair.good} className={f.buttonPair}>
              <span className={f.verdictItem}>
                <Verdict ok />
                <Button variant={pair.variant}>{pair.good}</Button>
              </span>
              <span className={f.verdictItem}>
                <Verdict ok={false} />
                <Button variant={pair.variant}>{pair.bad}</Button>
              </span>
            </div>
          ))}
        </div>
      </Shot>

      <Shot title="Termos" tone="white">
        <ul className={f.terms}>
          {TERMS.map((term) => (
            <li key={term.use} className={f.term}>
              <strong>{term.use}</strong>
              {term.avoid && (
                <>
                  <span className={f.termNe} aria-label="e não">
                    ≠
                  </span>
                  <s>{term.avoid}</s>
                </>
              )}
              {term.note && <span className={f.termNote}>{term.note}</span>}
            </li>
          ))}
        </ul>
      </Shot>
    </Board>
  );
}

/** Pranchas dos fundamentos, por id do inventário. */
export const specimens: Record<string, ComponentType> = {
  principios: Principios,
  cores: Cores,
  tipografia: Tipografia,
  espacamento: Espacamento,
  grid: GridItem,
  bordas: Bordas,
  elevacao: Elevacao,
  iconografia: Iconografia,
  movimento: Movimento,
  temas: Temas,
  acessibilidade: Acessibilidade,
  conteudo: Conteudo,
};

/* Compatibilidade: o índice antigo importa estas três por nome até o integrador religar. */
export { Cores, Principios, Tipografia };
