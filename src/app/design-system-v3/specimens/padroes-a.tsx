'use client';

import {
  AlignLeft,
  CalendarDays,
  CircleAlert,
  Clock,
  FileUp,
  Link2,
  ListChecks,
  MoreHorizontal,
  Plus,
  SquareCheckBig,
  Type,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Button, IconButton } from '@/components/ds-v3/button';
import { Input } from '@/components/ds-v3/fields';
import { LinkButton } from '@/components/ds-v3/link';
import { List, ListItem } from '@/components/ds-v3/list-item';
import { Menu } from '@/components/ds-v3/menu';
import { Tooltip } from '@/components/ds-v3/overlays';
import { Select } from '@/components/ds-v3/select';
import { Switch } from '@/components/ds-v3/selection';
import { Meter } from '@/components/ds-v3/stat';
import { toast } from '@/components/ds-v3/toast';
import { ToggleGroup } from '@/components/ds-v3/toggle';
import { Shot, Shots, State, States } from '../stage';
import { EnsureToaster, specimens as detalhe } from './detalhe';
import { specimens as kanban } from './kanban';
import {
  ASSETS,
  AssetChoices,
  PackageChoices,
  BRIEF_FIELDS,
  BRIEF_START,
  BriefForm,
  briefCount,
  brl,
  short,
  specimens as wizard,
  type Asset,
  type BriefField,
  type BriefKind,
  type BriefValues,
} from './wizard';
import p from './padroes-a.module.css';

/* ——————————————————————————— Formulário dinâmico ——————————————————————————— */

const KIND_META: Record<BriefKind, { label: string; icon: LucideIcon }> = {
  text: { label: 'Texto', icon: Type },
  url: { label: 'URL', icon: Link2 },
  date: { label: 'Data', icon: CalendarDays },
  file: { label: 'Arquivo', icon: FileUp },
  select: { label: 'Seleção', icon: ListChecks },
  multi: { label: 'Múltipla escolha', icon: SquareCheckBig },
  textarea: { label: 'Texto longo', icon: AlignLeft },
};
const ADDABLE: { kind: BriefKind; label: string; field: Omit<BriefField, 'id'> }[] = [
  { kind: 'text', label: 'Texto', field: { kind: 'text', label: 'Título da chamada' } },
  { kind: 'url', label: 'URL', field: { kind: 'url', label: 'Página da coleção', placeholder: 'https://' } },
  { kind: 'date', label: 'Data', field: { kind: 'date', label: 'Início da ação no estande' } },
  { kind: 'file', label: 'Arquivo', field: { kind: 'file', label: 'Logo em alta', hint: 'SVG ou PNG' } },
  { kind: 'select', label: 'Seleção', field: { kind: 'select', label: 'Público prioritário', options: ['Lojistas', 'Credenciados', 'Imprensa'] } },
  { kind: 'multi', label: 'Múltipla escolha', field: { kind: 'multi', label: 'Dias da feira', options: ['13/10', '14/10', '15/10', '16/10'] } },
];

type Version = { id: string; language: string; headline: string };

/** Grupo que se repete: “Versão #N” entra com altura e esmaecimento (280) e sai encolhendo. */
function Versions() {
  const [items, setItems] = useState<Version[]>([{ id: 'v1', language: 'Português', headline: 'Coleção Primavera-Verão 2027' }]);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const seq = useRef(1);
  const used = items.map((item) => item.language);
  return (
    <div className={p.versions}>
      <div className={p.versionsHead}>
        <span className={p.groupLabel}>Versões por idioma</span>
        <span className={p.groupMeta}>{items.length} de 3</span>
      </div>
      {items.map((item, index) => (
        <div key={item.id} className={p.version} data-leaving={leaving === item.id || undefined} data-fresh={fresh === item.id || undefined}>
          <div className={p.versionInner}>
            <div className={p.versionHead}>
              <strong>Versão #{index + 1}</strong>
              {items.length > 1 && (
                <IconButton
                  label={`Remover versão #${index + 1}`}
                  icon={X}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLeaving(item.id);
                    window.setTimeout(() => {
                      setItems((list) => list.filter((entry) => entry.id !== item.id));
                      setLeaving(null);
                    }, 200);
                  }}
                />
              )}
            </div>
            <div className={p.grid2}>
              <Select
                label={`Idioma da versão #${index + 1}`}
                value={item.language}
                onChange={(language) => setItems((list) => list.map((entry) => (entry.id === item.id ? { ...entry, language } : entry)))}
                options={['Português', 'Inglês', 'Espanhol'].map((option) => ({
                  value: option,
                  label: option,
                  disabled: option !== item.language && used.includes(option),
                  description: option !== item.language && used.includes(option) ? 'Já usado' : undefined,
                }))}
              />
              <Input
                aria-label={`Chamada da versão #${index + 1}`}
                placeholder="Chamada da peça"
                value={item.headline}
                onChange={(event) =>
                  setItems((list) => list.map((entry) => (entry.id === item.id ? { ...entry, headline: event.target.value } : entry)))
                }
              />
            </div>
          </div>
        </div>
      ))}
      <div>
        <Button
          size="sm"
          icon={Plus}
          disabled={items.length >= 3}
          onClick={() => {
            seq.current += 1;
            const id = `v${seq.current}`;
            const language = ['Português', 'Inglês', 'Espanhol'].find((option) => !used.includes(option)) ?? 'Inglês';
            setItems((list) => [...list, { id, language, headline: '' }]);
            setFresh(id);
          }}
        >
          Adicionar versão
        </Button>
      </div>
    </div>
  );
}

function BriefGenerated() {
  const [values, setValues] = useState<BriefValues>(BRIEF_START);
  const [sendLater, setSendLater] = useState(false);
  const count = briefCount(BRIEF_FIELDS, values, sendLater);
  return (
    <div className={p.brief}>
      <header className={p.briefHead}>
        <span className={p.briefTitles}>
          <h3>Briefing</h3>
          <small>Banner Super Topo — Portal</small>
        </span>
        <span className={p.counter} key={`${count.done}/${count.total}`}>
          {count.done} de {count.total} preenchidos · obrigatórios só no envio
        </span>
      </header>
      <BriefForm
        fields={BRIEF_FIELDS}
        values={values}
        sendLater={sendLater}
        onSendLater={setSendLater}
        onChange={(id, value) => setValues((current) => ({ ...current, [id]: value }))}
      />
      <Versions />
    </div>
  );
}

type SchemaRow = BriefField & { key: string };

function Composer() {
  const [rows, setRows] = useState<SchemaRow[]>(() => BRIEF_FIELDS.map((field) => ({ ...field, key: field.id })));
  const [values, setValues] = useState<BriefValues>({ ...BRIEF_START });
  const [fresh, setFresh] = useState<string | undefined>(undefined);
  const seq = useRef(0);
  const count = briefCount(rows, values);
  return (
    <div className={p.composer}>
      <section className={p.fieldsCol} aria-labelledby="composicao-campos">
        <header className={p.colHead}>
          <h3 id="composicao-campos">
            Campos do briefing <span className={p.groupMeta}>{rows.length}</span>
          </h3>
          <span className={p.reqHead} aria-hidden="true">
            Obrigatório
          </span>
        </header>
        <List
          label="Campos do briefing"
          onReorder={(from, to) =>
            setRows((list) => {
              const next = [...list];
              const [moved] = next.splice(from, 1);
              if (moved) next.splice(to, 0, moved);
              return next;
            })
          }
        >
          {rows.map((row) => {
            const meta = KIND_META[row.kind];
            const Icon = meta.icon;
            return (
              <ListItem
                key={row.key}
                draggable
                leading={<Icon className={p.kindIcon} aria-hidden="true" />}
                title={row.label}
                description={meta.label}
                trailing={
                  <span className={p.rowEnd}>
                    <Switch
                      size="sm"
                      hideLabel
                      label={`Obrigatório: ${row.label}`}
                      checked={Boolean(row.required)}
                      onCheckedChange={(required) =>
                        setRows((list) => list.map((item) => (item.key === row.key ? { ...item, required } : item)))
                      }
                    />
                    <Menu
                      label={`Ações de ${row.label}`}
                      align="end"
                      width={168}
                      sections={[
                        {
                          items: [
                            { label: 'Renomear', onSelect: () => toast('Renomear abre o campo para edição', { tone: 'info' }) },
                            {
                              label: 'Duplicar',
                              onSelect: () => {
                                seq.current += 1;
                                const key = `${row.id}-${seq.current}`;
                                setRows((list) => {
                                  const at = list.findIndex((item) => item.key === row.key);
                                  const next = [...list];
                                  next.splice(at + 1, 0, { ...row, id: key, key, label: `${row.label} (cópia)` });
                                  return next;
                                });
                                setFresh(key);
                              },
                            },
                          ],
                        },
                        {
                          items: [
                            {
                              label: 'Excluir campo',
                              danger: true,
                              onSelect: () => {
                                setRows((list) => list.filter((item) => item.key !== row.key));
                                toast(`“${row.label}” removido`, {
                                  action: {
                                    label: 'Desfazer',
                                    onClick: () => setRows((list) => (list.some((item) => item.key === row.key) ? list : [...list, row])),
                                  },
                                });
                              },
                            },
                          ],
                        },
                      ]}
                      trigger={(trigger) => <IconButton {...trigger} label={`Ações de ${row.label}`} icon={MoreHorizontal} variant="ghost" size="sm" />}
                    />
                  </span>
                }
              />
            );
          })}
        </List>
        <div>
          <Menu
            label="Tipo de campo"
            width={200}
            sections={[
              {
                items: ADDABLE.map((item) => ({
                  label: item.label,
                  icon: KIND_META[item.kind].icon,
                  onSelect: () => {
                    seq.current += 1;
                    const key = `novo-${seq.current}`;
                    setRows((list) => [...list, { ...item.field, id: key, key }]);
                    setFresh(key);
                  },
                })),
              },
            ]}
            trigger={(trigger) => (
              <Button {...trigger} size="sm" icon={Plus}>
                Adicionar campo
              </Button>
            )}
          />
        </div>
      </section>
      <section className={p.previewCol} aria-labelledby="composicao-previa">
        <header className={p.colHead}>
          <h3 id="composicao-previa">Prévia</h3>
          <span className={p.groupMeta} key={`${count.done}/${count.total}`}>
            {count.done} de {count.total} preenchidos
          </span>
        </header>
        <div className={p.preview}>
          <BriefForm
            fields={rows}
            values={values}
            sendLater={false}
            onSendLater={() => undefined}
            fresh={fresh}
            onChange={(id, value) => setValues((current) => ({ ...current, [id]: value }))}
          />
        </div>
      </section>
    </div>
  );
}

function FormularioDinamico() {
  return (
    <Shots>
      <Shot title="Briefing gerado" tone="white" align="center" pad="lg">
        <BriefGenerated />
      </Shot>
      <Shot title="Composição" tone="white" align="stretch" pad="lg">
        <Composer />
      </Shot>
      <EnsureToaster />
    </Shots>
  );
}

/* ——————————————————————————— Card de mídia e pacote ——————————————————————————— */

/** Recorte do formato da peça em escala, num quadro cinza (sem imagem). */
function FormatFrame({ format }: { format?: { w: number; h: number } }) {
  const ratio = format ? format.w / format.h : 16 / 9;
  const wide = ratio >= 1.4;
  return (
    <span className={p.mediaFrame} aria-hidden="true">
      <span
        className={p.mediaShape}
        style={{ aspectRatio: `${format?.w ?? 16} / ${format?.h ?? 9}`, width: wide ? '78%' : undefined, height: wide ? undefined : '72%' } as CSSProperties}
      />
      {format && (
        <span className={p.mediaSize}>
          {format.w} × {format.h}
        </span>
      )}
    </span>
  );
}

/** Cartão de catálogo (inventário, Vitrine): formato, alcance, disponibilidade e preço. */
export function MediaCard({
  asset,
  selected = false,
  onSelect,
  force,
}: {
  asset: Asset;
  selected?: boolean;
  onSelect?: () => void;
  force?: string;
}) {
  const sold = Boolean(asset.soldOut);
  return (
    <article className={p.media} data-selected={selected || undefined} data-sold={sold || undefined} data-force={force}>
      <FormatFrame format={asset.format} />
      <div className={p.mediaBody}>
        <h4 className={p.mediaName}>
          <button
            type="button"
            className={p.mediaHit}
            aria-pressed={selected}
            aria-disabled={sold || undefined}
            onClick={() => !sold && onSelect?.()}
          >
            {asset.name}
          </button>
        </h4>
        <span className={p.mediaReach}>
          {asset.channels} · {asset.reach}
        </span>
        {sold ? (
          <span className={p.soldText}>Esgotado no período</span>
        ) : (
          <span className={p.mediaMeter}>
            <Meter value={asset.reserved ?? 0} label={`${asset.reserved ?? 0}% reservado no período`} size="sm" />
            <small>{asset.reserved ?? 0}% reservado no período</small>
          </span>
        )}
        <span className={p.mediaPrice}>{asset.price}</span>
      </div>
    </article>
  );
}

function AtivoMidia() {
  const [assetId, setAssetId] = useState('banner');
  const [category, setCategory] = useState<string | null>('online');
  const [pack, setPack] = useState('lancamento');
  const [picked, setPicked] = useState('banner');
  const online = ASSETS.filter((asset) => asset.category === (category ?? 'online'));
  const catalog = ['banner', 'email', 'led', 'push'].map((id) => ASSETS.find((asset) => asset.id === id)).filter(Boolean) as Asset[];
  const banner = ASSETS[0]!;
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="lg">
        <div className={p.assetContext}>
          <ToggleGroup
            type="single"
            required
            label="Categoria"
            value={category}
            onChange={(value) => {
              setCategory(value);
              setAssetId('');
            }}
            items={[
              { value: 'online', label: 'Mídia Online', count: 4 },
              { value: 'organico', label: 'Conteúdo Orgânico', count: 2 },
              { value: 'offline', label: 'Mídia Offline', count: 2 },
              { value: 'prospeccao', label: 'Prospecção Ativa', count: 1 },
            ]}
          />
          <AssetChoices assets={online} value={assetId} onChange={setAssetId} name="ativo-contexto" />
        </div>
      </Shot>
      <Shot title="Pacotes" tone="white" align="stretch" pad="lg">
        <div className={p.assetContext}>
          <PackageChoices value={pack} onChange={setPack} />
        </div>
      </Shot>
      <Shot title="Catálogo" align="stretch" pad="lg">
        <div className={p.catalog}>
          {catalog.map((asset) => (
            <MediaCard key={asset.id} asset={asset} selected={picked === asset.id} onSelect={() => setPicked(asset.id)} />
          ))}
        </div>
      </Shot>
      <Shot title="Estados" align="stretch" pad="lg">
        <States min={200}>
          <State label="Repouso">
            <MediaCard asset={banner} />
          </State>
          <State label="Hover">
            <MediaCard asset={banner} force="hover" />
          </State>
          <State label="Selecionado">
            <MediaCard asset={banner} selected />
          </State>
          <State label="Foco">
            <MediaCard asset={banner} force="focus" />
          </State>
          <State label="Esgotado">
            <MediaCard asset={ASSETS.find((asset) => asset.id === 'push') ?? banner} />
          </State>
        </States>
      </Shot>
      <EnsureToaster />
    </Shots>
  );
}

/* ——————————————————————————— Disponibilidade e reserva ——————————————————————————— */

type Day = { iso: string; week: string; free: number; blocked?: string };
const CAPACITY = 6;
const PRICE = 300;
const DAYS: Day[] = [
  { iso: '2026-10-12', week: 'seg', free: 0, blocked: 'Montagem dos estandes · painel desligado' },
  { iso: '2026-10-13', week: 'ter', free: 4 },
  { iso: '2026-10-14', week: 'qua', free: 0 },
  { iso: '2026-10-15', week: 'qui', free: 6 },
  { iso: '2026-10-16', week: 'sex', free: 6 },
  { iso: '2026-10-17', week: 'sáb', free: 6 },
];
type DayState = 'free' | 'partial' | 'full' | 'blocked';
const stateOfDay = (day: Day): DayState => (day.blocked ? 'blocked' : day.free === 0 ? 'full' : day.free < CAPACITY ? 'partial' : 'free');
const dayLabel = (day: Day) => {
  const state = stateOfDay(day);
  if (state === 'blocked') return 'Montagem';
  if (state === 'full') return 'Esgotado';
  return `${day.free} de ${CAPACITY} livres`;
};
const dayTip = (day: Day) =>
  day.blocked ? `${short(day.iso)} · ${day.blocked}` : `${short(day.iso)} · ${day.free} de ${CAPACITY} inserções livres`;

/** Célula de um dia: preenchimento chapado de baixo para cima = parte já reservada. */
function DayCell({
  day,
  selected = false,
  conflict = false,
  edge,
  tabIndex = -1,
  force,
  onPointerDown,
  onPointerEnter,
  onKeyDown,
  onFocus,
  buttonRef,
}: {
  day: Day;
  selected?: boolean;
  conflict?: boolean;
  edge?: 'start' | 'end' | 'both';
  tabIndex?: number;
  force?: string;
  onPointerDown?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerEnter?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onFocus?: () => void;
  buttonRef?: (node: HTMLButtonElement | null) => void;
}) {
  const state = stateOfDay(day);
  const reserved = state === 'blocked' ? 0 : (CAPACITY - day.free) / CAPACITY;
  return (
    <Tooltip content={dayTip(day)}>
      <button
        ref={buttonRef}
        type="button"
        role="gridcell"
        className={p.day}
        data-state={state}
        data-selected={selected || undefined}
        data-conflict={conflict || undefined}
        data-edge={edge}
        data-force={force}
        aria-selected={selected}
        aria-label={`${day.week} ${short(day.iso)}, ${dayLabel(day)}`}
        tabIndex={tabIndex}
        onPointerDown={onPointerDown}
        onPointerEnter={onPointerEnter}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
      >
        <i className={p.dayFill} style={{ height: `${reserved * 100}%` }} aria-hidden="true" />
        <span className={p.dayHead}>
          <span>{day.week}</span>
          <b>{short(day.iso)}</b>
        </span>
        <span className={p.dayCount}>{dayLabel(day)}</span>
      </button>
    </Tooltip>
  );
}

function useCountdown(active: boolean, seconds: number) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (!active) {
      setLeft(seconds);
      return;
    }
    const timer = window.setInterval(() => setLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [active, seconds]);
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function AvailabilityGrid({ compact = false }: { compact?: boolean }) {
  const [range, setRange] = useState<[number, number] | null>([3, 5]);
  const [anchor, setAnchor] = useState(3);
  const [focusAt, setFocusAt] = useState(3);
  const [dragging, setDragging] = useState(false);
  const [held, setHeld] = useState<[number, number] | null>(null);
  const [busy, setBusy] = useState(false);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  const countdown = useCountdown(Boolean(held), 30 * 60);

  useEffect(() => {
    if (!dragging) return;
    const stop = () => setDragging(false);
    window.addEventListener('pointerup', stop);
    return () => window.removeEventListener('pointerup', stop);
  }, [dragging]);

  const [a, b] = range ? [Math.min(...range), Math.max(...range)] : [-1, -1];
  const rowRef = useRef<HTMLDivElement>(null);
  const [band, setBand] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  // Faixa contínua atrás do intervalo (só quando os dias estão na mesma linha da grade).
  useLayoutEffect(() => {
    const first = refs.current[a];
    const last = refs.current[b];
    const row = rowRef.current;
    if (!range || !first || !last || !row) return setBand(null);
    if (first.offsetTop !== last.offsetTop) return setBand(null);
    const host = row.getBoundingClientRect();
    const r1 = first.getBoundingClientRect();
    const r2 = last.getBoundingClientRect();
    setBand({ left: r1.left - host.left - 3, top: r1.top - host.top - 3, width: r2.right - r1.left + 6, height: r1.height + 6 });
  }, [a, b, range]);
  const picked = range ? DAYS.slice(a, b + 1) : [];
  const conflicts = picked.filter((day) => stateOfDay(day) === 'full' || stateOfDay(day) === 'blocked');
  const inserts = picked.reduce((total, day) => total + (day.blocked ? 0 : day.free), 0);
  const isHeld = held && range && held[0] === a && held[1] === b;

  function select(next: [number, number]) {
    setRange(next);
  }
  function onKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (step) {
      event.preventDefault();
      const next = Math.max(0, Math.min(DAYS.length - 1, index + step));
      setFocusAt(next);
      refs.current[next]?.focus();
      if (event.shiftKey) select([anchor, next]);
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : DAYS.length - 1;
      setFocusAt(next);
      refs.current[next]?.focus();
      if (event.shiftKey) select([anchor, next]);
      return;
    }
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      setAnchor(index);
      select([index, index]);
    }
  }

  return (
    <div className={p.avail} data-compact={compact || undefined}>
      <header className={p.availHead}>
        <span className={p.availTitles}>
          <h3 id={`${id}-title`}>Painel de LED — Pavilhão Azul</h3>
          <small>
            {CAPACITY} inserções por dia · {brl(PRICE)} por inserção
          </small>
        </span>
      </header>
      <div
        className={p.days}
        role="grid"
        aria-labelledby={`${id}-title`}
        aria-multiselectable="true"
        onPointerLeave={() => setDragging(false)}
      >
        <div role="row" className={p.daysRow} ref={rowRef} data-band={band ? '' : undefined}>
          {band && <i className={p.band} aria-hidden="true" style={band as CSSProperties} />}
          {DAYS.map((day, index) => {
            const inRange = index >= a && index <= b;
            const bad = inRange && (stateOfDay(day) === 'full' || stateOfDay(day) === 'blocked');
            return (
              <DayCell
                key={day.iso}
                day={day}
                selected={inRange}
                conflict={bad}
                edge={inRange ? (a === b ? 'both' : index === a ? 'start' : index === b ? 'end' : undefined) : undefined}
                tabIndex={index === focusAt ? 0 : -1}
                buttonRef={(node) => {
                  refs.current[index] = node;
                }}
                onFocus={() => setFocusAt(index)}
                onPointerDown={(event) => {
                  setFocusAt(index);
                  if (event.shiftKey && range) {
                    select([anchor, index]);
                    return;
                  }
                  setAnchor(index);
                  select([index, index]);
                  setDragging(true);
                }}
                onPointerEnter={() => {
                  if (dragging) select([anchor, index]);
                }}
                onKeyDown={(event) => onKey(event, index)}
              />
            );
          })}
        </div>
      </div>
      {conflicts.length > 0 && (
        <p className={p.alert} role="alert">
          <CircleAlert aria-hidden="true" />
          {conflicts.length === 1 ? '1 dia indisponível no período' : `${conflicts.length} dias indisponíveis no período`}
        </p>
      )}
      {range && (
        <div className={p.availFoot}>
          <span className={p.availSummary} key={`${a}-${b}`}>
            <b>
              {picked.length} {picked.length === 1 ? 'dia' : 'dias'}
            </b>
            <span aria-hidden="true">·</span>
            {inserts} inserções
            <span aria-hidden="true">·</span>
            <b>{brl(inserts * PRICE)}</b>
          </span>
          {isHeld ? (
            <LinkButton
              onClick={() => {
                setHeld(null);
                toast('Reserva liberada');
              }}
            >
              Liberar
            </LinkButton>
          ) : (
            <Button
              variant="primary"
              size="sm"
              loading={busy}
              disabled={conflicts.length > 0 || inserts === 0}
              onClick={() => {
                setBusy(true);
                window.setTimeout(() => {
                  setBusy(false);
                  setHeld([a, b]);
                  toast(`${inserts} inserções reservadas`);
                }, 400);
              }}
            >
              Reservar
            </Button>
          )}
        </div>
      )}
      {isHeld && (
        <p className={p.hold} role="status">
          <Clock aria-hidden="true" />
          <span>
            Reservado até <b>22/10 às 16:00</b>
          </span>
          <span className={p.holdTimer}>expira em {countdown}</span>
        </p>
      )}
    </div>
  );
}

const COVERAGE = [
  { name: 'Banner Super Topo — Portal', window: '01/10 – 30/11', days: 27 },
  { name: 'E-mail marketing dedicado', window: '15/09 – 30/11', days: 27 },
  { name: 'Push no app da feira', window: '10/10 – 20/10', days: 11 },
];

function Coverage() {
  return (
    <div className={p.coverage}>
      <div className={p.coverageHead} aria-hidden="true">
        <span>Ativo do pacote</span>
        <span>Dias do período dentro da janela</span>
      </div>
      <ul className={p.coverageList} aria-label="Cobertura do período por ativo">
        {COVERAGE.map((row) => {
          const partial = row.days < 27;
          return (
            <li key={row.name} data-partial={partial || undefined}>
              <span className={p.coverageName}>
                <b>{row.name}</b>
                <small>Janela {row.window}</small>
              </span>
              <span className={p.coverageBar}>
                <span className={p.coverageTrack} aria-hidden="true">
                  <i style={{ width: `${(row.days / 27) * 100}%` }} />
                </span>
                <span className={p.coverageCount}>
                  {row.days} de 27 dias
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Disponibilidade() {
  const day = (iso: string) => DAYS.find((item) => item.iso === iso) ?? DAYS[0]!;
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="lg">
        <AvailabilityGrid />
      </Shot>
      <Shot title="Cobertura" tone="white" align="stretch" pad="lg">
        <Coverage />
      </Shot>
      <Shot title="Estados" align="stretch" pad="lg">
        <States min={104}>
          <State label="Livre">
            <div className={p.dayCell}>
              <DayCell day={day('2026-10-15')} />
            </div>
          </State>
          <State label="Parcial">
            <div className={p.dayCell}>
              <DayCell day={day('2026-10-13')} />
            </div>
          </State>
          <State label="Esgotado">
            <div className={p.dayCell}>
              <DayCell day={day('2026-10-14')} />
            </div>
          </State>
          <State label="Bloqueado">
            <div className={p.dayCell}>
              <DayCell day={day('2026-10-12')} />
            </div>
          </State>
          <State label="Hover">
            <div className={p.dayCell}>
              <DayCell day={day('2026-10-16')} force="hover" />
            </div>
          </State>
          <State label="Selecionado">
            <div className={p.dayCell}>
              <DayCell day={day('2026-10-16')} selected edge="both" />
            </div>
          </State>
          <State label="Conflito">
            <div className={p.dayCell}>
              <DayCell day={day('2026-10-14')} selected conflict edge="both" />
            </div>
          </State>
          <State label="Foco">
            <div className={p.dayCell}>
              <DayCell day={day('2026-10-17')} force="focus" />
            </div>
          </State>
        </States>
      </Shot>
      <EnsureToaster />
    </Shots>
  );
}

/* ——————————————————————————— Registro ——————————————————————————— */

export const specimens: Record<string, ComponentType> = {
  ...wizard,
  ...kanban,
  ...detalhe,
  'formulario-dinamico': FormularioDinamico,
  'ativo-midia': AtivoMidia,
  disponibilidade: Disponibilidade,
};
