'use client';

import { Bell, Check, ChevronRight, CircleAlert, Globe, Smartphone } from 'lucide-react';
import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Badge, type Tone } from '@mediaon/design-system/v3/badge';
import { Button, IconButton } from '@mediaon/design-system/v3/button';
import { ColorField } from '@mediaon/design-system/v3/color-picker';
import { Combobox, searchOptions } from '@mediaon/design-system/v3/combobox';
import {
  Calendar,
  DatePicker,
  DateRangePicker,
  DayPreview,
  type CalendarEvent,
  type DateRange,
} from '@mediaon/design-system/v3/date-picker';
import { Field, FieldGroup, Input, SearchField, useNotice } from '@mediaon/design-system/v3/fields';
import f from '@mediaon/design-system/v3/fields.module.css';
import { BrandMark } from '@mediaon/design-system/v3/identity';
import { LinkButton } from '@mediaon/design-system/v3/link';
import { MoneyField, moneyBRL } from '@mediaon/design-system/v3/money-field';
import { MultiSelect } from '@mediaon/design-system/v3/multiselect';
import { Dialog, Tooltip } from '@mediaon/design-system/v3/overlays';
import { Select, type SelectOption } from '@mediaon/design-system/v3/select';
import {
  Checkbox,
  CheckboxGroup,
  ChoiceCard,
  Radio,
  RadioGroup,
  Switch,
} from '@mediaon/design-system/v3/selection';
import { RangeSlider, Slider } from '@mediaon/design-system/v3/slider';
import { TimeField } from '@mediaon/design-system/v3/time-field';
import { Toaster, toast } from '@mediaon/design-system/v3/toast';
import { Shot, Shots, State, States } from '../stage';
import x from './formularios-b.module.css';

/* ——————————————————————————————— Dados ——————————————————————————————— */

const noop = () => {};

const ADVERTISERS: [string, string, string][] = [
  ['aurora', 'Aurora Calçados', 'Calçado feminino'],
  ['estudio-norte', 'Estúdio Norte', 'Design e acessórios'],
  ['casa-forma', 'Casa Forma', 'Componentes e solados'],
  ['lume', 'Lume Acessórios', 'Bijuteria e acessórios'],
  ['horizonte', 'Grupo Horizonte', 'Varejo multimarcas'],
  ['atelie-sul', 'Ateliê Sul', 'Calçado artesanal'],
  ['patio-couro', 'Pátio Couro', 'Bolsas em couro'],
  ['bella-passo', 'Bella Passo', 'Calçado infantil'],
  ['couro-nobre', 'Couro Nobre', 'Curtume'],
];
const ADVERTISER_OPTIONS: SelectOption[] = ADVERTISERS.map(([value, label, description]) => ({
  value,
  label,
  description,
  leading: <BrandMark name={label} size="xs" variant="soft" decorative />,
}));

const LANGUAGES: SelectOption[] = [
  { value: 'pt', label: 'Português' },
  { value: 'en', label: 'Inglês' },
  { value: 'es', label: 'Espanhol' },
];

const STATUS_FILTER: SelectOption[] = [
  { value: '', label: 'Todos os status' },
  { value: 'live', label: 'Veiculando' },
  { value: 'review', label: 'Aguardando aprovação' },
  { value: 'signature', label: 'Aguardando assinatura do P.I.' },
  { value: 'changes', label: 'Ajustes solicitados' },
  { value: 'draft', label: 'Rascunho' },
];

const PERSONAS: SelectOption[] = [
  { value: 'portal', label: 'Gestão do portal' },
  { value: 'advertiser', label: 'Área do anunciante' },
];

const ASSETS: SelectOption[] = [
  { value: 'banner-topo', label: 'Banner Super Topo — Portal', description: 'Mídia Online' },
  { value: 'banner-lateral', label: 'Banner lateral — Portal', description: 'Mídia Online' },
  { value: 'email', label: 'E-mail marketing dedicado', description: 'Mídia Online' },
  { value: 'push', label: 'Push no app da feira', description: 'Mídia Online' },
  {
    value: 'instagram',
    label: 'Post patrocinado no Instagram oficial',
    description: 'Conteúdo Orgânico',
  },
  { value: 'vitrine', label: 'Destaque na vitrine', description: 'Conteúdo Orgânico' },
  { value: 'led', label: 'Painel de LED — Pavilhão Azul', description: 'Mídia Offline' },
  { value: 'totem', label: 'Totem digital — Entrada principal', description: 'Mídia Offline' },
  {
    value: 'rodada',
    label: 'Rodada de negócios — lista qualificada',
    description: 'Prospecção Ativa',
  },
];

const AUDIENCES = [
  { value: 'credenciados', label: 'Visitantes credenciados', people: 48200 },
  { value: 'lojistas', label: 'Lojistas e compradores', people: 21600 },
  { value: 'internacionais', label: 'Compradores internacionais', people: 3900 },
  { value: 'imprensa', label: 'Imprensa', people: 640 },
];
const int = (n: number) => n.toLocaleString('pt-BR');
const AUDIENCE_OPTIONS: SelectOption[] = AUDIENCES.map(({ value, label, people }) => ({
  value,
  label,
  description: `${int(people)} pessoas`,
}));

const CATEGORIES: SelectOption[] = [
  'Calçado feminino',
  'Calçado masculino',
  'Calçado infantil',
  'Bolsas e couro',
  'Acessórios',
  'Componentes',
  'Máquinas e tecnologia',
  'Serviços para varejo',
].map((label) => ({ value: label, label }));

/* ——————————————————————————————— Peças da prancha ——————————————————————————————— */

/** Erro de campo no lugar da ajuda (mesmo desenho do `Field`). */
function ErrorLine({ children }: { children: string }) {
  return (
    <p className={f.error}>
      <CircleAlert aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/** Coluna que ocupa a célula inteira (campos medem a célula, não o texto). */
function Fill({ children, top = false }: { children: ReactNode; top?: boolean }) {
  return (
    <div className={x.fill} data-top={top || undefined}>
      {children}
    </div>
  );
}

/** Seção de tela, como no construtor: título 14/600 (e um dado curto ao lado). */
function Section({ title, meta, children }: { title: string; meta?: string; children: ReactNode }) {
  return (
    <section className={x.section}>
      <h4 className={x.sectionTitle}>
        {title}
        {meta && <span>{meta}</span>}
      </h4>
      {children}
    </section>
  );
}

/**
 * Matriz de estados: linhas × colunas, legendas de 1 palavra. No celular, `transpose` vira a
 * matriz de lado para caber (estados em linhas).
 */
function Matrix({
  rows,
  cols,
  render,
  transpose = false,
}: {
  rows: string[];
  cols: string[];
  render: (row: number, col: number) => ReactNode;
  transpose?: boolean;
}) {
  return (
    <div
      className={x.matrix}
      data-transpose={transpose || undefined}
      style={{ '--cols': cols.length, '--rows': rows.length } as CSSProperties}
    >
      {cols.map((col, c) => (
        <span
          key={col}
          className={x.matrixHead}
          style={{ '--r': 1, '--c': c + 2 } as CSSProperties}
        >
          {col}
        </span>
      ))}
      {rows.map((row, r) => (
        <Fragment key={row}>
          <span className={x.matrixRow} style={{ '--r': r + 2, '--c': 1 } as CSSProperties}>
            {row}
          </span>
          {cols.map((col, c) => (
            <span
              key={col}
              className={x.matrixCell}
              style={{ '--r': r + 2, '--c': c + 2 } as CSSProperties}
            >
              {render(r, c)}
            </span>
          ))}
        </Fragment>
      ))}
    </div>
  );
}

/** Linha de painéis abertos e parados: 3 colunas largas com vão de 24 (as sombras não se tocam). */
function OpenRow({ children }: { children: ReactNode }) {
  return (
    <div className={x.openRow}>
      <States min={300}>{children}</States>
    </div>
  );
}

/* ——————————————————————————————— Seleção simples ——————————————————————————————— */

function SelectSpecimen() {
  const [language, setLanguage] = useState('');
  const [advertiser, setAdvertiser] = useState('aurora');
  const [status, setStatus] = useState('');
  const [persona, setPersona] = useState('portal');
  const [query, setQuery] = useState('');
  const [name, setName] = useState('Coleção Primavera-Verão 2027');
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="start" minHeight={1}>
        <Section title="Identificação">
          <div className={x.form}>
            <Field label="Nome da campanha" required>
              {(props) => (
                <Input
                  id={props.id}
                  aria-describedby={props.describedBy}
                  invalid={props.invalid}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              )}
            </Field>
            <Field label="Anunciante" required>
              {(props) => (
                <Select
                  {...props}
                  value={advertiser}
                  onChange={setAdvertiser}
                  options={ADVERTISER_OPTIONS}
                />
              )}
            </Field>
            <Field label="Idioma da peça" required>
              {(props) => (
                <Select {...props} value={language} onChange={setLanguage} options={LANGUAGES} />
              )}
            </Field>
          </div>
        </Section>
      </Shot>

      <Shot title="Barra e filtros" tone="white" align="stretch" pad="none" minHeight={1}>
        <div className={x.app}>
          <div className={x.topbar}>
            <nav className={x.crumbs} aria-label="Caminho">
              <span>Operação</span>
              <ChevronRight aria-hidden="true" />
              <b>Campanhas</b>
            </nav>
            <div className={x.topbarEnd}>
              <div className={x.persona}>
                <Select
                  size="sm"
                  label="Visualização"
                  value={persona}
                  onChange={setPersona}
                  options={PERSONAS}
                />
              </div>
              <IconButton label="Notificações" icon={Bell} variant="ghost" size="sm" />
            </div>
          </div>
          <div className={x.filterBand}>
            <div className={x.filterSearch}>
              <SearchField
                size="sm"
                value={query}
                onValueChange={setQuery}
                placeholder="Campanha ou nº"
              />
            </div>
            <div className={x.filterSelect}>
              <Select
                size="sm"
                label="Status"
                value={status}
                onChange={setStatus}
                options={STATUS_FILTER}
              />
            </div>
          </div>
        </div>
      </Shot>

      <Shot title="Estados" align="stretch">
        <div className={x.stack}>
          <States min={176}>
            <State label="Repouso">
              <Fill>
                <Select label="Idioma da peça" value="" onChange={noop} options={LANGUAGES} />
              </Fill>
            </State>
            <State label="Hover">
              <Fill>
                <Select
                  label="Idioma da peça"
                  value=""
                  onChange={noop}
                  options={LANGUAGES}
                  data-force="hover"
                />
              </Fill>
            </State>
            <State label="Selecionado">
              <Fill>
                <Select label="Idioma da peça" value="pt" onChange={noop} options={LANGUAGES} />
              </Fill>
            </State>
            <State label="Indisponível">
              <Fill>
                <Select
                  label="Idioma da peça"
                  value="pt"
                  onChange={noop}
                  options={LANGUAGES}
                  disabled
                />
              </Fill>
            </State>
            <State label="Inválido">
              <Fill>
                <Select
                  label="Idioma da peça"
                  value=""
                  onChange={noop}
                  options={LANGUAGES}
                  invalid
                />
                <ErrorLine>Escolha o idioma</ErrorLine>
              </Fill>
            </State>
          </States>
          <OpenRow>
            <State label="Carregando opções">
              <Fill top>
                <Select
                  label="Anunciante"
                  value=""
                  onChange={noop}
                  options={[]}
                  loading
                  data-force="open"
                />
              </Fill>
            </State>
            <State label="Aberto">
              <Fill top>
                <Select
                  label="Idioma da peça"
                  value="pt"
                  onChange={noop}
                  options={LANGUAGES}
                  data-force="open"
                />
              </Fill>
            </State>
            <State label="Opção indisponível">
              <Fill top>
                <Select
                  label="Idioma da peça"
                  value="pt"
                  onChange={noop}
                  data-force="open"
                  options={[
                    ...LANGUAGES.slice(0, 2),
                    {
                      value: 'es',
                      label: 'Espanhol',
                      disabled: true,
                      description: 'Fora deste ativo',
                    },
                  ]}
                />
              </Fill>
            </State>
          </OpenRow>
        </div>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————————— Seleção com busca ——————————————————————————————— */

function useAdvertiserSearch() {
  const [results, setResults] = useState(ADVERTISER_OPTIONS);
  const [loading, setLoading] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  function search(query: string) {
    window.clearTimeout(timer.current);
    if (!query.trim()) {
      setLoading(false);
      setResults(ADVERTISER_OPTIONS);
      return;
    }
    setLoading(true);
    timer.current = window.setTimeout(() => {
      setResults(searchOptions(ADVERTISER_OPTIONS, query));
      setLoading(false);
    }, 400);
  }
  return { results, loading, search };
}

const noAdvertiser = (query: string) => `Nenhum anunciante com “${query}”`;

function ComboboxSpecimen() {
  const [advertiser, setAdvertiser] = useState('');
  const [asset, setAsset] = useState('');
  const { results, loading, search } = useAdvertiserSearch();
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="start" minHeight={1}>
        <Section title="Identificação">
          <div className={x.form}>
            <Field label="Anunciante" required>
              {(props) => (
                <Combobox
                  {...props}
                  value={advertiser}
                  onChange={setAdvertiser}
                  options={results}
                  onQuery={search}
                  loading={loading}
                  placeholder="Buscar anunciante"
                  emptyText={noAdvertiser}
                />
              )}
            </Field>
            <Field label="Ativo" required>
              {(props) => (
                <Select
                  {...props}
                  searchable
                  value={asset}
                  onChange={setAsset}
                  options={ASSETS}
                  placeholder="Selecione o ativo"
                />
              )}
            </Field>
          </div>
        </Section>
      </Shot>

      <Shot title="Estados" align="stretch">
        <div className={x.stack}>
          <States min={180}>
            <State label="Vazio">
              <Fill>
                <Combobox
                  label="Anunciante"
                  value=""
                  onChange={noop}
                  options={ADVERTISER_OPTIONS}
                  placeholder="Buscar anunciante"
                />
              </Fill>
            </State>
            <State label="Digitando">
              <Fill>
                <Combobox
                  label="Anunciante"
                  value=""
                  onChange={noop}
                  options={ADVERTISER_OPTIONS}
                  defaultQuery="cou"
                  data-force="focus"
                />
              </Fill>
            </State>
            <State label="Selecionado">
              <Fill>
                <Combobox
                  label="Anunciante"
                  value="couro-nobre"
                  onChange={noop}
                  options={ADVERTISER_OPTIONS}
                />
              </Fill>
            </State>
            <State label="Inválido">
              <Fill>
                <Combobox
                  label="Anunciante"
                  value=""
                  onChange={noop}
                  options={ADVERTISER_OPTIONS}
                  placeholder="Buscar anunciante"
                  invalid
                />
                <ErrorLine>Escolha o anunciante</ErrorLine>
              </Fill>
            </State>
            <State label="Indisponível">
              <Fill>
                <Combobox
                  label="Anunciante"
                  value="aurora"
                  onChange={noop}
                  options={ADVERTISER_OPTIONS}
                  disabled
                />
              </Fill>
            </State>
          </States>
          <OpenRow>
            <State label="Resultados">
              <Fill top>
                <Combobox
                  label="Anunciante"
                  value=""
                  onChange={noop}
                  options={ADVERTISER_OPTIONS}
                  defaultQuery="cou"
                  data-force="open"
                />
              </Fill>
            </State>
            <State label="Sem resultados">
              <Fill top>
                <Combobox
                  label="Anunciante"
                  value=""
                  onChange={noop}
                  options={ADVERTISER_OPTIONS}
                  defaultQuery="xyz"
                  emptyText={noAdvertiser}
                  data-force="open"
                />
              </Fill>
            </State>
            <State label="Carregando">
              <Fill top>
                <Combobox
                  label="Anunciante"
                  value=""
                  onChange={noop}
                  options={ADVERTISER_OPTIONS}
                  onQuery={noop}
                  defaultQuery="cou"
                  loading
                  data-force="open"
                />
              </Fill>
            </State>
          </OpenRow>
        </div>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————————— Seleção múltipla ——————————————————————————————— */

function audienceSummary(values: string[]) {
  const chosen = AUDIENCES.filter((audience) => values.includes(audience.value));
  if (!chosen.length) return 'Nenhum público';
  const people = chosen.reduce((sum, audience) => sum + audience.people, 0);
  return `${chosen.length} ${chosen.length === 1 ? 'público' : 'públicos'} · ${int(people)} pessoas`;
}

function MultiselectSpecimen() {
  const [audiences, setAudiences] = useState(['credenciados', 'lojistas']);
  const [categories, setCategories] = useState([
    'Calçado feminino',
    'Bolsas e couro',
    'Acessórios',
  ]);
  const summary = audienceSummary(audiences);
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="start" minHeight={1}>
        <Section title="Canal + Público">
          <div className={x.form}>
            <Field
              label="Públicos"
              required
              hint={
                <span key={summary} className={x.fade}>
                  {summary}
                </span>
              }
            >
              {(props) => (
                <MultiSelect
                  {...props}
                  values={audiences}
                  onChange={setAudiences}
                  options={AUDIENCE_OPTIONS}
                  max={3}
                  label="Públicos"
                  placeholder="Escolha os públicos"
                  countLabel={(n) => `${n} de 3 públicos`}
                />
              )}
            </Field>
            <Field label="Categorias da vitrine">
              {(props) => (
                <MultiSelect
                  {...props}
                  values={categories}
                  onChange={setCategories}
                  options={CATEGORIES}
                  searchable
                  label="Categorias da vitrine"
                  placeholder="Todas as categorias"
                />
              )}
            </Field>
          </div>
        </Section>
      </Shot>

      <Shot title="Estados" align="stretch">
        <div className={x.stack}>
          <States min={180}>
            <State label="Vazio">
              <Fill>
                <MultiSelect
                  label="Públicos"
                  values={[]}
                  onChange={noop}
                  options={AUDIENCE_OPTIONS}
                  placeholder="Escolha os públicos"
                />
              </Fill>
            </State>
            <State label="Alguns">
              <Fill>
                <MultiSelect
                  label="Públicos"
                  values={['imprensa', 'internacionais']}
                  onChange={noop}
                  options={AUDIENCE_OPTIONS}
                />
              </Fill>
            </State>
            <State label="Muitos">
              <Fill>
                <MultiSelect
                  label="Públicos"
                  values={['imprensa', 'credenciados', 'lojistas', 'internacionais']}
                  onChange={noop}
                  options={AUDIENCE_OPTIONS}
                />
              </Fill>
            </State>
            <State label="Inválido">
              <Fill>
                <MultiSelect
                  label="Públicos"
                  values={[]}
                  onChange={noop}
                  options={AUDIENCE_OPTIONS}
                  placeholder="Escolha os públicos"
                  invalid
                />
                <ErrorLine>Escolha ao menos 1 público</ErrorLine>
              </Fill>
            </State>
            <State label="Indisponível">
              <Fill>
                <MultiSelect
                  label="Públicos"
                  values={['credenciados', 'lojistas']}
                  onChange={noop}
                  options={AUDIENCE_OPTIONS}
                  disabled
                />
              </Fill>
            </State>
          </States>
          <OpenRow>
            <State label="Aberto">
              <Fill top>
                <MultiSelect
                  label="Públicos"
                  values={['credenciados', 'imprensa']}
                  onChange={noop}
                  options={AUDIENCE_OPTIONS}
                  data-force="open"
                />
              </Fill>
            </State>
            <State label="Máximo atingido">
              <Fill top>
                <MultiSelect
                  label="Públicos"
                  values={['credenciados', 'lojistas', 'internacionais']}
                  onChange={noop}
                  options={AUDIENCE_OPTIONS}
                  max={3}
                  countLabel={(n) => `${n} de 3 públicos`}
                  data-force="open"
                />
              </Fill>
            </State>
            <State label="Com busca">
              <Fill top>
                <MultiSelect
                  label="Categorias da vitrine"
                  values={['Calçado feminino', 'Bolsas e couro']}
                  onChange={noop}
                  options={CATEGORIES.slice(0, 5)}
                  searchable
                  data-force="open"
                />
              </Fill>
            </State>
          </OpenRow>
        </div>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————————— Checkbox ——————————————————————————————— */

const CHANNELS = [
  { id: 'portal', name: 'Portal da feira', icon: Globe },
  { id: 'app', name: 'App Francal', icon: Smartphone },
];
const BUDGET = 18000;

function ChannelsTable() {
  const [on, setOn] = useState<Record<string, boolean>>({ portal: true, app: true });
  const [alloc, setAlloc] = useState<Record<string, string>>({ portal: '50', app: '50' });
  const active = CHANNELS.filter((channel) => on[channel.id]);
  const total = active.reduce((sum, channel) => sum + (Number(alloc[channel.id]) || 0), 0);
  function apply(next: Record<string, boolean>) {
    const ids = CHANNELS.filter((channel) => next[channel.id]).map((channel) => channel.id);
    const share = ids.length ? String(Math.round(100 / ids.length)) : '';
    setOn(next);
    setAlloc(
      Object.fromEntries(CHANNELS.map((channel) => [channel.id, next[channel.id] ? share : ''])),
    );
  }
  return (
    <div className={x.table} role="group" aria-label="Canais">
      <div className={x.tableHead}>
        <span className={x.headFirst}>
          <Checkbox
            aria-label="Selecionar todos os canais"
            checked={active.length === CHANNELS.length}
            indeterminate={active.length > 0 && active.length < CHANNELS.length}
            onChange={() =>
              apply(
                Object.fromEntries(
                  CHANNELS.map((channel) => [channel.id, active.length < CHANNELS.length]),
                ),
              )
            }
          />
          Canal
        </span>
        <span className={x.num}>Valor</span>
        <span className={x.num}>Alocação</span>
      </div>
      {CHANNELS.map(({ id, name, icon: Icon }) => {
        const checked = Boolean(on[id]);
        const value = checked ? (BUDGET * (Number(alloc[id]) || 0)) / 100 : 0;
        return (
          <div key={id} className={x.tableRow} data-on={checked || undefined}>
            <Checkbox
              checked={checked}
              onChange={() => apply({ ...on, [id]: !checked })}
              label={
                <span className={x.channel}>
                  <Icon aria-hidden="true" />
                  {name}
                </span>
              }
            />
            <span className={x.num}>{checked ? `≈ R$ ${int(Math.round(value))}` : '—'}</span>
            <span className={x.alloc}>
              <Input
                size="sm"
                inputMode="numeric"
                aria-label={`Alocação de ${name}`}
                suffix="%"
                value={alloc[id] ?? ''}
                disabled={!checked}
                onChange={(event) =>
                  setAlloc({ ...alloc, [id]: event.target.value.replace(/\D/g, '').slice(0, 3) })
                }
              />
            </span>
          </div>
        );
      })}
      <div className={x.tableFoot} data-ok={total === 100 || undefined}>
        {active.length === 0 ? (
          <span>Nenhum canal</span>
        ) : total === 100 ? (
          <>
            <Check aria-hidden="true" />
            100% distribuído
          </>
        ) : (
          <span>{total}% de 100%</span>
        )}
      </div>
    </div>
  );
}

function UploadLater() {
  const [later, setLater] = useState(false);
  return (
    <div className={x.upload}>
      <div className={x.collapse} data-open={!later || undefined}>
        <div className={x.collapseInner}>
          <div className={x.dropzone}>
            <span className={x.ratio}>970 × 250</span>
            <span className={x.dropText}>
              <b>Arraste a peça aqui ou escolha um arquivo</b>
              <span>PNG · JPG · WEBP · até 25 MB</span>
            </span>
            <Button size="sm">Escolher arquivo</Button>
          </div>
        </div>
      </div>
      <Checkbox
        label="Enviar depois da contratação"
        checked={later}
        onChange={(event) => setLater(event.target.checked)}
      />
    </div>
  );
}

function NotifyGroup() {
  const [values, setValues] = useState({ email: true, whatsapp: false, push: true });
  const toggle = (key: keyof typeof values) => setValues({ ...values, [key]: !values[key] });
  return (
    <CheckboxGroup legend="Notificar por">
      <Checkbox
        label="E-mail"
        description="marina.lopes@francal.com.br"
        checked={values.email}
        onChange={() => toggle('email')}
      />
      <Checkbox
        label="WhatsApp"
        description="(11) 98765-4321"
        checked={values.whatsapp}
        onChange={() => toggle('whatsapp')}
      />
      <Checkbox
        label="Push"
        description="App Francal 2026"
        checked={values.push}
        onChange={() => toggle('push')}
      />
    </CheckboxGroup>
  );
}

const CHECK_ROWS = ['Desmarcado', 'Marcado', 'Parcial'];
const PRESS_COLS = ['Repouso', 'Hover', 'Pressionado', 'Foco', 'Indisponível'];
/** Pressionado vem com o hover (o dedo/ponteiro está em cima). */
const PRESS_FORCE = [undefined, 'hover', 'hover active', 'focus', undefined];

function CheckboxSpecimen() {
  const [accepted, setAccepted] = useState(false);
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch">
        <div className={x.checkContext}>
          <section className={x.block}>
            <h4 className={x.blockTitle}>
              Canais <span>{`R$ ${int(BUDGET)},00`}</span>
            </h4>
            <ChannelsTable />
          </section>
          <div className={x.twoCols}>
            <section className={x.block}>
              <h4 className={x.blockTitle}>Peça criativa</h4>
              <UploadLater />
            </section>
            <NotifyGroup />
          </div>
        </div>
      </Shot>

      <Shot title="Estados" align="stretch">
        <div className={x.stack}>
          <Matrix
            transpose
            rows={CHECK_ROWS}
            cols={PRESS_COLS}
            render={(row, col) => (
              <Checkbox
                aria-label={`${CHECK_ROWS[row]} · ${PRESS_COLS[col]}`}
                checked={row === 1}
                indeterminate={row === 2}
                disabled={col === 4}
                data-force={PRESS_FORCE[col]}
                onChange={noop}
              />
            )}
          />
          <div className={x.matrixFoot}>
            <States min={260}>
              <State label="Inválido">
                <Fill>
                  <Checkbox
                    label="Li e aceito as condições do P.I."
                    invalid={!accepted}
                    checked={accepted}
                    onChange={(event) => setAccepted(event.target.checked)}
                  />
                  {!accepted && <ErrorLine>Aceite as condições para enviar</ErrorLine>}
                </Fill>
              </State>
              <State label="Com descrição">
                <Fill>
                  <Checkbox label="Push" description="App Francal 2026" checked onChange={noop} />
                </Fill>
              </State>
            </States>
          </div>
        </div>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————————— Radio ——————————————————————————————— */

const ASSET_CARDS = [
  {
    value: 'banner',
    title: 'Banner Super Topo — Portal',
    description: 'Formato 970 × 250 no topo de todas as páginas do portal.',
    model: 'CPM',
    price: 'R$ 45,00 / mil impressões',
    window: '01/10 – 30/11',
  },
  {
    value: 'email',
    title: 'E-mail marketing dedicado',
    description: 'Disparo exclusivo para a base de credenciados.',
    model: 'Por disparo',
    price: 'R$ 0,40 / disparo',
    window: '15/09 – 30/11',
  },
  {
    value: 'push',
    title: 'Push no app da feira',
    description: 'Notificação para quem está no pavilhão.',
    model: 'CPC',
    price: 'R$ 1,80 / clique',
    window: '10/10 – 20/10',
  },
  {
    value: 'vitrine',
    title: 'Destaque na vitrine',
    description: 'Selo de destaque na vitrine de expositores.',
    model: 'Bônus',
    price: 'Sem cobrança',
    window: '01/10 – 31/10',
  },
];

function AssetMeta({ model, price, window }: { model: string; price: string; window: string }) {
  return (
    <span className={x.assetMeta}>
      <span>
        <b>{model}</b> {price}
      </span>
      <span>{window}</span>
    </span>
  );
}

function SendChoice() {
  const [mode, setMode] = useState('submit');
  const name = useId();
  return (
    <section className={x.send} aria-labelledby={`${name}-title`}>
      <div className={x.sendHead}>
        <span>Envio</span>
        <strong id={`${name}-title`}>Como salvar esta campanha?</strong>
      </div>
      <div className={x.sendOptions} role="radiogroup" aria-labelledby={`${name}-title`}>
        <ChoiceCard
          name={name}
          value="draft"
          checked={mode === 'draft'}
          onChange={setMode}
          title="Salvar como rascunho"
          description="Fica com você para continuar depois. Ninguém é notificado."
        />
        <ChoiceCard
          name={name}
          value="submit"
          checked={mode === 'submit'}
          onChange={setMode}
          title="Enviar para aprovação"
          description="O comercial do portal revisa e responde por aqui."
          footer={
            mode === 'submit' ? (
              <>
                <CircleAlert className={x.blockerIcon} aria-hidden="true" />
                <span className={x.blocker}>Faltam 2 campos do briefing</span>
                <LinkButton className={x.footAction}>Preencher</LinkButton>
              </>
            ) : undefined
          }
        />
      </div>
    </section>
  );
}

const RADIO_ROWS = ['Desmarcado', 'Marcado'];

/** Grupo sem escolha ao enviar: fio vermelho nos rádios e o erro do grupo no lugar da ajuda. */
function InvalidModel() {
  const [model, setModel] = useState('');
  const name = useId();
  const options = [
    ['cpm', 'CPM'],
    ['cpc', 'CPC'],
    ['fixed', 'Preço fechado'],
  ] as const;
  return (
    <RadioGroup
      legend="Modelo de precificação"
      orientation="horizontal"
      required
      error={model ? undefined : 'Escolha o modelo'}
    >
      {options.map(([value, label]) => (
        <Radio
          key={value}
          name={name}
          label={label}
          checked={model === value}
          invalid={!model}
          onChange={() => setModel(value)}
        />
      ))}
    </RadioGroup>
  );
}

function RadioSpecimen() {
  const [asset, setAsset] = useState('banner');
  const [model, setModel] = useState('cpm');
  const assetName = useId();
  const modelName = useId();
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch">
        <div className={x.radioContext}>
          <div className={x.stack}>
            <RadioGroup legend="Ativo" required>
              <div className={x.assets}>
                {ASSET_CARDS.map((card) => (
                  <ChoiceCard
                    key={card.value}
                    name={assetName}
                    value={card.value}
                    checked={asset === card.value}
                    onChange={setAsset}
                    title={card.title}
                    description={card.description}
                    extra={<AssetMeta model={card.model} price={card.price} window={card.window} />}
                  />
                ))}
              </div>
            </RadioGroup>
            <RadioGroup legend="Modelo de precificação" orientation="horizontal">
              <Radio
                name={modelName}
                label="CPM"
                checked={model === 'cpm'}
                onChange={() => setModel('cpm')}
              />
              <Radio
                name={modelName}
                label="CPC"
                checked={model === 'cpc'}
                onChange={() => setModel('cpc')}
              />
              <Radio
                name={modelName}
                label="Preço fechado"
                checked={model === 'fixed'}
                onChange={() => setModel('fixed')}
              />
            </RadioGroup>
          </div>
          <SendChoice />
        </div>
      </Shot>

      <Shot title="Estados" align="stretch">
        <div className={x.stack}>
          <States min={230}>
            {(
              [
                ['Repouso', {}],
                ['Hover', { 'data-force': 'hover' }],
                ['Selecionado', { checked: true }],
                ['Hover no selecionado', { checked: true, 'data-force': 'hover' }],
                ['Foco', { 'data-force': 'focus' }],
                ['Indisponível', { disabled: true, description: 'Indisponível neste ativo' }],
                ['Inválido', { invalid: true }],
              ] as const
            ).map(([label, props]) => (
              <State key={label} label={label}>
                <Fill>
                  <ChoiceCard
                    name={`estado-${label}`}
                    value="push"
                    onChange={noop}
                    title="Push no app da feira"
                    description="Notificação para quem está no pavilhão."
                    checked={false}
                    {...props}
                  />
                </Fill>
              </State>
            ))}
          </States>
          <Matrix
            transpose
            rows={RADIO_ROWS}
            cols={PRESS_COLS}
            render={(row, col) => (
              <Radio
                name={`estado-radio-${row}-${col}`}
                aria-label={`${RADIO_ROWS[row]} · ${PRESS_COLS[col]}`}
                checked={row === 1}
                disabled={col === 4}
                data-force={PRESS_FORCE[col]}
                onChange={noop}
              />
            )}
          />
          <div className={x.matrixFoot}>
            <States min={260}>
              <State label="Inválido">
                <InvalidModel />
              </State>
            </States>
          </div>
        </div>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————————— Switch ——————————————————————————————— */

type Delivery = 'live' | 'approved' | 'paused' | 'draft';
const DELIVERY: Record<Delivery, { label: string; tone: Tone; live?: boolean }> = {
  live: { label: 'Veiculando', tone: 'green', live: true },
  approved: { label: 'Aprovada', tone: 'teal' },
  paused: { label: 'Pausada', tone: 'gray' },
  draft: { label: 'Rascunho', tone: 'gray' },
};
const CAMPAIGNS: {
  id: string;
  name: string;
  asset: string;
  advertiser: string;
  status: Delivery;
}[] = [
  {
    id: '2041',
    name: 'Coleção Primavera-Verão no portal',
    asset: 'Banner Super Topo — Portal',
    advertiser: 'Aurora Calçados',
    status: 'live',
  },
  {
    id: '2032',
    name: 'Destaque couro vegetal',
    asset: 'Banner Super Topo — Portal',
    advertiser: 'Lume Acessórios',
    status: 'approved',
  },
  {
    id: '2038',
    name: 'Newsletter dos expositores',
    asset: 'E-mail marketing dedicado',
    advertiser: 'Estúdio Norte',
    status: 'live',
  },
  {
    id: '2014',
    name: 'Carrossel de tendências',
    asset: 'Post patrocinado no Instagram oficial',
    advertiser: 'Aurora Calçados',
    status: 'draft',
  },
];

/** O Tooltip entrega `aria-describedby` ao filho; aqui ele chega ao `role="switch"`. */
function DescribedSwitch({
  'aria-describedby': describedBy,
  title: _title,
  ...props
}: Omit<Parameters<typeof Switch>[0], 'describedBy'> & {
  'aria-describedby'?: string;
  title?: string;
}) {
  return <Switch {...props} describedBy={describedBy} />;
}

function DeliveryTable() {
  const [rows, setRows] = useState(CAMPAIGNS);
  const [saving, setSaving] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const pending = rows.find((row) => row.id === confirm);

  function set(id: string, status: Delivery) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status } : row)));
  }
  function run(id: string, status: Delivery, message: string) {
    const before = rows.find((row) => row.id === id)?.status;
    const name = rows.find((row) => row.id === id)?.name;
    setSaving(id);
    timer.current = window.setTimeout(() => {
      set(id, status);
      setSaving(null);
      toast(message, {
        description: name,
        action: before ? { label: 'Desfazer', onClick: () => set(id, before) } : undefined,
      });
    }, 600);
  }
  return (
    <>
      <div className={x.campaigns} role="table" aria-label="Campanhas">
        <div className={x.campaignHead} role="row">
          <span role="columnheader">
            <span className={x.srOnly}>Veiculação</span>
          </span>
          <span role="columnheader">Campanha</span>
          <span role="columnheader" className={x.hideNarrow}>
            Anunciante
          </span>
          <span role="columnheader">Status</span>
        </div>
        {rows.map((row) => {
          const meta = DELIVERY[row.status];
          const can = row.status !== 'draft';
          const help = 'Disponível depois da aprovação';
          return (
            <div key={row.id} className={x.campaignRow} role="row">
              <span
                role="cell"
                className={x.toggleCell}
                onClick={() => {
                  if (!can && window.matchMedia('(pointer: coarse)').matches)
                    toast(help, { tone: 'info' });
                }}
              >
                {can ? (
                  <Switch
                    size="sm"
                    hideLabel
                    label={`Veiculação de ${row.name}`}
                    checked={row.status === 'live'}
                    loading={saving === row.id}
                    onCheckedChange={(checked) => {
                      if (checked && row.status === 'approved') setConfirm(row.id);
                      else if (checked) run(row.id, 'live', 'Veiculação retomada');
                      else run(row.id, 'paused', 'Veiculação pausada');
                    }}
                  />
                ) : (
                  <Tooltip content={help}>
                    <DescribedSwitch
                      size="sm"
                      hideLabel
                      label={`Veiculação de ${row.name}`}
                      checked={false}
                      disabled
                      onCheckedChange={noop}
                    />
                  </Tooltip>
                )}
              </span>
              <span role="cell" className={x.campaignName}>
                <b>{row.name}</b>
                <small>
                  {row.asset} · #{row.id}
                </small>
              </span>
              <span role="cell" className={`${x.campaignAdv} ${x.hideNarrow}`}>
                <BrandMark name={row.advertiser} size="xs" variant="soft" decorative />
                {row.advertiser}
              </span>
              <span role="cell">
                <Badge variant="text" tone={meta.tone} live={meta.live}>
                  {meta.label}
                </Badge>
              </span>
            </div>
          );
        })}
      </div>
      <Dialog
        open={Boolean(pending)}
        onClose={() => setConfirm(null)}
        size="sm"
        title="Iniciar veiculação?"
        description="A campanha entra no ar agora."
        footer={
          <>
            <Button onClick={() => setConfirm(null)}>Cancelar</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (pending) run(pending.id, 'live', 'Veiculação iniciada');
                setConfirm(null);
              }}
            >
              Iniciar veiculação
            </Button>
          </>
        }
      />
    </>
  );
}

const SETTINGS = [
  {
    key: 'pi',
    label: 'Notificar por e-mail quando o P.I. for assinado',
    description: 'marina.lopes@francal.com.br',
  },
  { key: 'weekly', label: 'Resumo semanal de veiculação', description: 'Segunda-feira, às 08:00' },
  { key: 'deadline', label: 'Aviso de prazo do criativo', description: '2 dias antes da entrega' },
];

function SettingsList() {
  const [values, setValues] = useState<Record<string, boolean>>({
    pi: true,
    weekly: false,
    deadline: true,
  });
  const [saving, setSaving] = useState<string | null>(null);
  const id = useId();
  return (
    <div className={x.settings}>
      {SETTINGS.map((setting) => (
        <div key={setting.key} className={x.setting}>
          <span className={x.settingText}>
            <label htmlFor={`${id}-${setting.key}`}>{setting.label}</label>
            <span id={`${id}-${setting.key}-d`}>{setting.description}</span>
          </span>
          <Switch
            id={`${id}-${setting.key}`}
            hideLabel
            label={setting.label}
            describedBy={`${id}-${setting.key}-d`}
            checked={Boolean(values[setting.key])}
            loading={saving === setting.key}
            onCheckedChange={(checked) => {
              setSaving(setting.key);
              window.setTimeout(() => {
                setValues((current) => ({ ...current, [setting.key]: checked }));
                setSaving(null);
              }, 500);
            }}
          />
        </div>
      ))}
    </div>
  );
}

function SwitchSpecimen() {
  const cols = ['Repouso', 'Hover', 'Pressionado', 'Foco', 'Indisponível', 'Salvando'];
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch">
        <div className={x.switchContext}>
          <DeliveryTable />
          <SettingsList />
        </div>
      </Shot>
      <Shot title="Estados" align="stretch">
        <Matrix
          transpose
          rows={['Desligado', 'Ligado']}
          cols={cols}
          render={(row, col) => (
            <Switch
              hideLabel
              label={`${row ? 'Ligado' : 'Desligado'} · ${cols[col]}`}
              checked={row === 1}
              onCheckedChange={noop}
              disabled={col === 4}
              loading={col === 5}
              data-force={['', 'hover', 'hover active', 'focus', '', ''][col] || undefined}
            />
          )}
        />
      </Shot>
      <Toaster />
    </Shots>
  );
}

/* ——————————————————————————————— Slider ——————————————————————————————— */

const BUDGET_MIN = 2025;
const BUDGET_MAX = 45000;
const BUDGET_REC = 9000;

function BudgetSlider() {
  const [budget, setBudget] = useState(18000);
  return (
    <div className={x.budget}>
      <div className={x.budgetHead}>
        <span className={x.groupLabel}>Verba planejada</span>
        <span className={x.figure}>{moneyBRL(budget)}</span>
        <span className={x.muted}>≈ {int(Math.round((budget / 45) * 1000))} impressões</span>
      </div>
      <Slider
        label="Ajuste da verba"
        value={budget}
        min={BUDGET_MIN}
        max={BUDGET_MAX}
        step={45}
        onChange={setBudget}
        format={moneyBRL}
        marks={[
          { value: BUDGET_REC, kind: 'recommended', label: `Recomendado: ${moneyBRL(BUDGET_REC)}` },
        ]}
        ticks={[
          { value: BUDGET_MIN, label: 'Mínimo' },
          { value: BUDGET_REC, label: 'Recomendado', kind: 'recommended' },
          { value: BUDGET_MAX, label: 'Máximo' },
        ]}
      />
    </div>
  );
}

const RANGE_MIN = 0;
const RANGE_MAX = 50000;
const RANGE_GAP = 500;

function BudgetRange() {
  const [from, setFrom] = useState<number | null>(2000);
  const [to, setTo] = useState<number | null>(20000);
  const [fromNote, flashFrom] = useNotice(4000);
  const [toNote, flashTo] = useNotice(4000);
  const hi = to ?? RANGE_MAX;
  const lo = Math.min(from ?? RANGE_MIN, hi - RANGE_GAP);
  return (
    <FieldGroup label="Faixa de verba" columns={2}>
      <Field label="De" notice={fromNote}>
        {(props) => (
          <MoneyField
            id={props.id}
            aria-describedby={props.describedBy}
            size="sm"
            value={from}
            min={RANGE_MIN}
            max={hi - RANGE_GAP}
            onChange={(value) => {
              setFrom(value);
              flashFrom(null);
            }}
            onAdjust={(next) => flashFrom(`Ajustado para ${moneyBRL(next)}`)}
          />
        )}
      </Field>
      <Field label="Até" notice={toNote}>
        {(props) => (
          <MoneyField
            id={props.id}
            aria-describedby={props.describedBy}
            size="sm"
            value={to}
            min={lo + RANGE_GAP}
            max={RANGE_MAX}
            onChange={(value) => {
              setTo(value);
              flashTo(null);
            }}
            onAdjust={(next) => flashTo(`Ajustado para ${moneyBRL(next)}`)}
          />
        )}
      </Field>
      <div className={x.spanAll}>
        <RangeSlider
          label="Faixa de verba"
          value={[lo, hi]}
          min={RANGE_MIN}
          max={RANGE_MAX}
          step={RANGE_GAP}
          minGap={RANGE_GAP}
          onChange={([nextFrom, nextTo]) => {
            setFrom(nextFrom);
            setTo(nextTo);
            flashFrom(null);
            flashTo(null);
          }}
          format={moneyBRL}
        />
      </div>
    </FieldGroup>
  );
}

function FrequencySlider() {
  const [frequency, setFrequency] = useState(3);
  return (
    <div className={x.frequency}>
      <div className={x.sliderHead}>
        <span className={x.groupLabel}>Frequência máxima</span>
        <span className={x.value}>{frequency}× por pessoa</span>
      </div>
      <Slider
        label="Frequência máxima"
        value={frequency}
        min={1}
        max={5}
        step={1}
        dots
        onChange={setFrequency}
        format={(n) => `${n}×`}
        start="1×"
        end="5×"
      />
    </div>
  );
}

function SliderSpecimen() {
  const base = {
    label: 'Verba',
    value: 18000,
    min: BUDGET_MIN,
    max: BUDGET_MAX,
    step: 45,
    onChange: noop,
    format: moneyBRL,
    marks: [{ value: BUDGET_REC, kind: 'recommended' as const, label: 'Recomendado' }],
  };
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="start" minHeight={1}>
        <div className={`${x.frame} ${x.sliderContext}`}>
          <BudgetSlider />
          <div className={x.twoCols}>
            <BudgetRange />
            <FrequencySlider />
          </div>
        </div>
      </Shot>
      <Shot title="Estados" align="stretch">
        <States min={220}>
          <State label="Repouso">
            <Fill>
              <div className={x.bubbleRoom}>
                <Slider {...base} />
              </div>
            </Fill>
          </State>
          <State label="Hover">
            <Fill>
              <div className={x.bubbleRoom}>
                <Slider {...base} data-force="hover" />
              </div>
            </Fill>
          </State>
          <State label="Arrastando">
            <Fill>
              <div className={x.bubbleRoom}>
                <Slider {...base} data-force="active" />
              </div>
            </Fill>
          </State>
          <State label="Foco">
            <Fill>
              <div className={x.bubbleRoom}>
                <Slider {...base} data-force="focus" />
              </div>
            </Fill>
          </State>
          <State label="Vazio">
            <Fill>
              <div className={x.bubbleRoom}>
                <Slider {...base} value={BUDGET_MIN} empty />
              </div>
            </Fill>
          </State>
          <State label="Indisponível">
            <Fill>
              <div className={x.bubbleRoom}>
                <Slider {...base} disabled />
              </div>
            </Fill>
          </State>
        </States>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————————— Calendário ——————————————————————————————— */

const pad2 = (n: number) => String(n).padStart(2, '0');
function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}
const AGENDA: (CalendarEvent & { time: string })[] = [
  { date: '2026-10-09', label: 'Entrega dos criativos', tone: 'amber', time: 'Até 18:00' },
  { date: '2026-10-12', label: 'Montagem dos estandes', time: '08:00 – 22:00' },
  { date: '2026-10-14', label: 'Francal 2026 · 1º dia', time: '10:00 – 20:00' },
  { date: '2026-10-15', label: 'Francal 2026 · 2º dia', time: '10:00 – 20:00' },
  { date: '2026-10-15', label: 'Rodada de negócios', time: '14:00 – 17:00' },
  { date: '2026-10-16', label: 'Francal 2026 · 3º dia', time: '10:00 – 20:00' },
  { date: '2026-10-17', label: 'Francal 2026 · 4º dia', time: '10:00 – 18:00' },
  { date: '2026-10-20', label: 'Fechamento de relatórios', tone: 'amber', time: 'Até 18:00' },
];
/** Evento comum = ponto neutro; âmbar só para prazo. Azul fica para a seleção. */
const DOTS: Record<NonNullable<CalendarEvent['tone']>, string> = {
  accent: 'var(--g-500)',
  gray: 'var(--g-500)',
  green: 'var(--green-dot)',
  amber: 'var(--amber-dot)',
  orange: 'var(--orange-dot)',
  red: 'var(--red-dot)',
  violet: 'var(--violet-dot)',
  teal: 'var(--teal-dot)',
};
const WEEKDAY = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
function dayTitle(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const weekday = WEEKDAY[new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1)).getUTCDay()] ?? '';
  return `${pad2(d ?? 0)}/${pad2(m ?? 0)} · ${weekday}`;
}

function FairAgenda() {
  const [day, setDay] = useState('2026-10-14');
  const events = AGENDA.filter((event) => event.date === day);
  return (
    <section className={x.agenda} aria-label="Agenda da feira">
      <header className={x.agendaHead}>Agenda da feira</header>
      <Calendar value={day} onChange={setDay} events={AGENDA} aria-label="Agenda da feira" />
      <div className={x.agendaDay} aria-live="polite">
        <span className={x.agendaDate}>{dayTitle(day)}</span>
        <ul key={day} className={x.agendaList}>
          {events.length === 0 && <li className={x.agendaEmpty}>Sem eventos</li>}
          {events.map((event) => (
            <li key={event.label}>
              <i
                style={{ '--dot': DOTS[event.tone ?? 'gray'] } as CSSProperties}
                aria-hidden="true"
              />
              <b>{event.label}</b>
              <span>{event.time}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function CalendarioSpecimen() {
  const [delivery, setDelivery] = useState('');
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [today] = useState(todayISO);
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="start" minHeight={1}>
        <div className={`${x.frame} ${x.calContext}`}>
          <div className={x.form}>
            <Field label="Entrega do criativo" required hint="Até 5 dias úteis antes da veiculação">
              {(props) => (
                <DatePicker
                  {...props}
                  value={delivery}
                  onChange={setDelivery}
                  min={today}
                  window={{ start: '2026-10-05', end: '2026-10-31', label: 'Veiculação' }}
                />
              )}
            </Field>
          </div>
          <FairAgenda />
        </div>
      </Shot>
      <Shot title="Variantes" align="stretch" minHeight={1}>
        <States min={260}>
          <State label="Seletor">
            <Fill>
              <DatePicker value="" onChange={noop} aria-label="Entrega do criativo" />
            </Fill>
          </State>
          <State label="Digitável">
            <Fill>
              <DatePicker
                editable
                value={typed}
                onChange={setTyped}
                onInputError={setError}
                invalid={Boolean(error)}
                aria-label="Entrega do criativo"
              />
              {error && <ErrorLine>{error}</ErrorLine>}
            </Fill>
          </State>
        </States>
      </Shot>
      <Shot title="Estados" align="stretch">
        <div className={x.stack}>
          <States min={96} align="center">
            <State label="Hoje">
              <DayPreview days={[{ day: 1, today: true }]} />
            </State>
            <State label="Selecionado">
              <DayPreview days={[{ day: 14, selected: true }]} />
            </State>
            <State label="Hover">
              <DayPreview days={[{ day: 15, force: 'hover' }]} />
            </State>
            <State label="Foco">
              <DayPreview days={[{ day: 16, force: 'focus' }]} />
            </State>
            <State label="Fora do mês">
              <DayPreview days={[{ day: 30, outside: true }]} />
            </State>
            <State label="Indisponível">
              <DayPreview days={[{ day: 28, disabled: true }]} />
            </State>
            <State label="Com evento">
              <DayPreview days={[{ day: 12, events: ['amber'] }]} />
            </State>
            <State label="Janela">
              <DayPreview
                days={[
                  { day: 5, band: true },
                  { day: 6, band: true },
                  { day: 7, band: true },
                ]}
              />
            </State>
          </States>
          <States min={260}>
            <State label="Campo inválido">
              <Fill>
                <DatePicker
                  editable
                  value="31/02/2026"
                  onChange={noop}
                  invalid
                  aria-label="Entrega do criativo"
                />
                <ErrorLine>Data inválida</ErrorLine>
              </Fill>
            </State>
            <State label="Indisponível">
              <Fill>
                <DatePicker
                  value="2026-10-05"
                  onChange={noop}
                  disabled
                  aria-label="Entrega do criativo"
                />
              </Fill>
            </State>
          </States>
        </div>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————————— Período e horário ——————————————————————————————— */

const ASSET_WINDOW = { start: '2026-10-01', end: '2026-11-30', label: 'Janela do ativo' };
function days(start: string, end: string) {
  if (!start || !end || end < start) return 0;
  const toUTC = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1);
  };
  return Math.round((toUTC(end) - toUTC(start)) / 86_400_000) + 1;
}
const short = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

function WindowNote({ range, onUse }: { range: DateRange; onUse?: () => void }) {
  const outside =
    Boolean(range.start && range.end) &&
    (range.start < ASSET_WINDOW.start || range.end > ASSET_WINDOW.end);
  return (
    <p className={x.windowNote} data-out={outside || undefined}>
      {outside ? 'Fora da janela ' : 'Janela do ativo '}
      <b>
        {short(ASSET_WINDOW.start)} – {short(ASSET_WINDOW.end)}
      </b>
      {outside && (
        <LinkButton className={x.noteAction} onClick={onUse}>
          Usar inteira
        </LinkButton>
      )}
    </p>
  );
}

function PeriodField({
  initial,
  invalidEnd = false,
  disabled = false,
}: {
  initial: DateRange;
  invalidEnd?: boolean;
  disabled?: boolean;
}) {
  const [range, setRange] = useState(initial);
  const span = days(range.start, range.end);
  const showError = invalidEnd && !range.end;
  return (
    <div className={x.period}>
      <div className={x.periodHead}>
        <span className={x.groupLabel}>Período de veiculação</span>
        {span > 0 && <span className={x.muted}>{span} dias</span>}
      </div>
      <DateRangePicker
        labels
        required
        aria-label="Período de veiculação"
        start={range.start}
        end={range.end}
        onChange={setRange}
        min="2026-09-01"
        max="2026-12-31"
        window={ASSET_WINDOW}
        presets={[{ label: 'Janela inteira', start: ASSET_WINDOW.start, end: ASSET_WINDOW.end }]}
        invalid={{ end: showError }}
        disabled={disabled}
      />
      {showError && (
        <div className={x.periodErrors}>
          <div style={{ gridColumn: 2 }}>
            <ErrorLine>Informe o término</ErrorLine>
          </div>
        </div>
      )}
      {!showError && (
        <WindowNote
          range={range}
          onUse={() => setRange({ start: ASSET_WINDOW.start, end: ASSET_WINDOW.end })}
        />
      )}
    </div>
  );
}

function presetsFrom(today: string) {
  const [y, m] = today.split('-').map(Number);
  const back = new Date(`${today}T12:00:00`);
  back.setDate(back.getDate() - 6);
  const weekAgo = `${back.getFullYear()}-${pad2(back.getMonth() + 1)}-${pad2(back.getDate())}`;
  const last = new Date(Date.UTC(y ?? 0, m ?? 1, 0)).getUTCDate();
  return [
    { label: 'Últimos 7 dias', start: weekAgo, end: today },
    {
      label: 'Este mês',
      start: `${y}-${pad2(m ?? 1)}-01`,
      end: `${y}-${pad2(m ?? 1)}-${pad2(last)}`,
    },
    { label: 'Período da feira', start: '2026-10-14', end: '2026-10-17' },
  ];
}

function PeriodoSpecimen() {
  const [today] = useState(todayISO);
  const [filter, setFilter] = useState<DateRange>({ start: '', end: '' });
  const [status, setStatus] = useState('');
  const [sendDate, setSendDate] = useState('2026-10-14');
  const [sendTime, setSendTime] = useState('09:30');
  const [timeError, setTimeError] = useState<string | null>(null);
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="start" minHeight={1}>
        <div className={`${x.frame} ${x.periodContext}`}>
          <PeriodField initial={{ start: '2026-10-05', end: '2026-10-31' }} />
          <FieldGroup label="Horário de envio" columns={2}>
            <Field label="Data">
              {(props) => (
                <DatePicker {...props} value={sendDate} onChange={setSendDate} min={today} />
              )}
            </Field>
            <Field label="Hora" error={timeError ?? undefined}>
              {(props) => (
                <TimeField
                  {...props}
                  value={sendTime}
                  onChange={setSendTime}
                  onInputError={setTimeError}
                />
              )}
            </Field>
          </FieldGroup>
        </div>
      </Shot>

      <Shot title="Filtro" align="start" pad="sm" minHeight={1}>
        <div className={x.filterRow}>
          <div className={x.filterSelect}>
            <Select
              size="sm"
              label="Status"
              value={status}
              onChange={setStatus}
              options={STATUS_FILTER}
            />
          </div>
          <div className={x.filterPeriod}>
            <DateRangePicker
              size="sm"
              aria-label="Período"
              placeholder="Qualquer período"
              clearable
              duration={false}
              start={filter.start}
              end={filter.end}
              onChange={setFilter}
              presets={presetsFrom(today)}
            />
          </div>
        </div>
      </Shot>

      <Shot title="Estados" align="stretch">
        <div className={x.stack}>
          <States min={300}>
            <State label="Vazio">
              <Fill top>
                <PeriodField initial={{ start: '', end: '' }} />
              </Fill>
            </State>
            <State label="Completo">
              <Fill top>
                <PeriodField initial={{ start: '2026-10-05', end: '2026-10-31' }} />
              </Fill>
            </State>
            <State label="Fora da janela">
              <Fill top>
                <PeriodField initial={{ start: '2026-11-20', end: '2026-12-15' }} />
              </Fill>
            </State>
            <State label="Erro na data vazia">
              <Fill top>
                <PeriodField initial={{ start: '2026-10-05', end: '' }} invalidEnd />
              </Fill>
            </State>
            <State label="Indisponível">
              <Fill top>
                <PeriodField initial={{ start: '2026-10-05', end: '2026-10-31' }} disabled />
              </Fill>
            </State>
          </States>
          <States min={300}>
            <State label="Início escolhido">
              <Fill top>
                <div className={x.calendarCard}>
                  <Calendar
                    mode="range"
                    start="2026-10-05"
                    hoverDate="2026-10-16"
                    window={ASSET_WINDOW}
                    today="2026-10-01"
                    aria-label="Período de veiculação"
                  />
                </div>
              </Fill>
            </State>
            <State label="Período escolhido">
              <Fill top>
                <div className={x.calendarCard}>
                  <Calendar
                    mode="range"
                    start="2026-10-05"
                    end="2026-10-31"
                    window={ASSET_WINDOW}
                    today="2026-10-01"
                    aria-label="Período de veiculação"
                  />
                </div>
              </Fill>
            </State>
          </States>
        </div>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————————— Seletor de cor ——————————————————————————————— */

function PortalMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="6" width="14" height="2.6" rx="1.3" fill="currentColor" />
      <rect x="5" y="10.7" width="10" height="2.6" rx="1.3" fill="currentColor" opacity="0.85" />
      <rect x="5" y="15.4" width="6" height="2.6" rx="1.3" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

function BrandingPreview({ color }: { color: string }) {
  return (
    <div className={x.preview} style={{ '--brand': color } as CSSProperties}>
      <div className={x.previewIdentity}>
        <span className={x.previewMark}>
          <PortalMark />
        </span>
        <span className={x.previewName}>
          <b>Francal 2026</b>
          <span>Portal do organizador</span>
        </span>
      </div>
      <div className={x.previewCta}>
        <Button variant="primary" size="sm">
          Agendar visita
        </Button>
      </div>
    </div>
  );
}

function ColorSpecimen() {
  const [color, setColor] = useState('#F28C28');
  const [error, setError] = useState<string | null>(null);
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="start" minHeight={1}>
        <div className={`${x.frame} ${x.colorContext}`}>
          <Field label="Cor da marca do portal" error={error ?? undefined}>
            {(props) => (
              <ColorField {...props} value={color} onChange={setColor} onInputError={setError} />
            )}
          </Field>
          <BrandingPreview color={color} />
        </div>
      </Shot>
      <Shot title="Estados" align="stretch">
        <div className={x.stack}>
          <States min={200}>
            <State label="Repouso">
              <Fill>
                <ColorField label="Cor da marca" value="#F28C28" onChange={noop} />
              </Fill>
            </State>
            <State label="Hover">
              <Fill>
                <ColorField
                  label="Cor da marca"
                  value="#F28C28"
                  onChange={noop}
                  data-force="hover"
                />
              </Fill>
            </State>
            <State label="Inválido">
              <Fill>
                <ColorField label="Cor da marca" value="#F28C2" onChange={noop} invalid />
                <ErrorLine>Use o formato #RRGGBB</ErrorLine>
              </Fill>
            </State>
            <State label="Indisponível">
              <Fill>
                <ColorField label="Cor da marca" value="#F28C28" onChange={noop} disabled />
              </Fill>
            </State>
          </States>
          <States min={250}>
            <State label="Aberto">
              <Fill top>
                <ColorField
                  label="Cor da marca"
                  value="#E8762D"
                  onChange={noop}
                  data-force="open"
                />
              </Fill>
            </State>
            <State label="Hover de cor">
              <Fill top>
                <ColorField
                  label="Cor da marca"
                  value="#E8762D"
                  onChange={noop}
                  data-force="open"
                  hoverColor="#3E63DD"
                />
              </Fill>
            </State>
            <State label="Selecionada">
              <Fill top>
                <ColorField
                  label="Cor da marca"
                  value="#0875DB"
                  onChange={noop}
                  data-force="open"
                />
              </Fill>
            </State>
          </States>
        </div>
      </Shot>
    </Shots>
  );
}

/** Pranchas do grupo formularios-b (id do inventário → componente). */
export const specimens: Record<string, ComponentType> = {
  select: SelectSpecimen,
  combobox: ComboboxSpecimen,
  multiselect: MultiselectSpecimen,
  checkbox: CheckboxSpecimen,
  radio: RadioSpecimen,
  switch: SwitchSpecimen,
  slider: SliderSpecimen,
  calendario: CalendarioSpecimen,
  periodo: PeriodoSpecimen,
  'seletor-cor': ColorSpecimen,
};
