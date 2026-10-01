'use client';

import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  Building2,
  Download,
  FileText,
  Gift,
  LayoutGrid,
  LayoutList,
  Megaphone,
  MoreHorizontal,
  Plus,
  Radio as RadioIcon,
  Settings,
  ShieldCheck,
  Store,
  Tags,
  UserRound,
  Users,
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
  Badge,
  BrandMark,
  Button,
  DataTable,
  Field,
  IconButton,
  Input,
  SearchField,
  Segmented,
  Tabs,
  type Column,
} from '@/components/ds-v3';
import { Pagination } from '@/components/ds-v3/pagination';
import { LinkButton } from '@/components/ds-v3/link';
import { Menu } from '@/components/ds-v3/menu';
import { ActionBar, Stepper, StepperCompact, type StepItem } from '@/components/ds-v3/stepper';
import {
  Accordion,
  DescriptionList,
  ExpandableText,
  FixedFrame,
  PageHeader,
  Panel,
  ResizablePanels,
  ScrollArea,
  Section,
  type AccordionItem,
  type DescriptionItem,
} from '@/components/ds-v3/structure';
import {
  AppShell,
  PortalSwitcher,
  Sidebar,
  SidebarAccount,
  TopBar,
  type NavGroup,
} from '@/components/ds-v3/app-shell';
import {
  Card,
  CardHeader,
  CardLink,
  Divider,
  MetaList,
  type MetaItem,
} from '@/components/ds-v3/surfaces';
import { Shot, Shots, State, States } from '../stage';
import x from './estrutura.module.css';

/* ——————————————————————————— Dados fictícios ——————————————————————————— */

const steps: StepItem[] = [
  { id: 'identificacao', label: 'Identificação' },
  { id: 'ativo', label: 'Ativo' },
  { id: 'precificacao', label: 'Precificação' },
  { id: 'canal', label: 'Canal + Público' },
  { id: 'briefing', label: 'Briefing' },
  { id: 'revisao', label: 'Revisão' },
];

const configItems: DescriptionItem[] = [
  {
    label: 'Anunciante',
    value: 'Aurora Calçados',
    leading: <BrandMark name="Aurora Calçados" size="xs" variant="soft" decorative />,
  },
  { label: 'Ativo', value: 'Banner Super Topo — Portal' },
  { label: 'Categoria', value: 'Mídia Online' },
  { label: 'Modelo de precificação', value: 'CPM · R$ 45,00 / mil impressões', numeric: true },
  { label: 'Verba', value: 'R$ 18.000,00', numeric: true },
  { label: 'Período', value: '01/10/2026 – 31/10/2026 · 31 dias', numeric: true },
  { label: 'Canais', value: 'Portal da feira (50%), App Francal (50%)' },
  { label: 'Públicos', value: 'Visitantes credenciados (50%), Lojistas e compradores (50%)' },
  { label: 'Bônus liberados', value: '+20% de impressões', numeric: true },
];

const briefingDraft: DescriptionItem[] = [
  { label: 'Peça criativa', state: 'missing' },
  { label: 'URL de destino', state: 'missing' },
  { label: 'Texto alternativo da peça', state: 'empty' },
  { label: 'Idioma da peça', state: 'missing' },
  { label: 'Pavilhões de interesse', state: 'empty' },
  { label: 'Entrega do criativo', state: 'empty' },
];

const briefingReview: DescriptionItem[] = [
  { label: 'Peça criativa', value: 'peca-970x250.png' },
  { label: 'URL de destino', value: 'https://aurora.com.br/primavera' },
  { label: 'Texto alternativo da peça', state: 'empty' },
  { label: 'Idioma da peça', state: 'missing' },
  { label: 'Pavilhões de interesse', value: 'Pavilhão Azul, Pavilhão Verde' },
  { label: 'Entrega do criativo', state: 'missing' },
];

const history = [
  { title: 'Veiculação iniciada', meta: 'Marina Lopes · 29/09', current: true },
  { title: 'P.I. assinado', meta: 'Aurora Calçados · 29/09' },
  { title: 'Aprovada · P.I. gerado', meta: 'Marina Lopes · 29/09' },
  { title: 'Enviada para aprovação', meta: 'Marina Lopes · 28/09' },
  { title: 'Campanha criada', meta: 'Marina Lopes · 28/09' },
];

const links = [
  { label: 'Ativos', value: 1 },
  { label: 'Canais', value: 2 },
  { label: 'Públicos', value: 3 },
  { label: 'Métricas', value: 1 },
  { label: 'Bonificações', value: 3 },
];

const detailMeta: (string | MetaItem)[] = [
  { value: '#2041', numeric: true },
  'Aurora Calçados',
  'Banner Super Topo — Portal',
  { value: '01/10 – 31/10', numeric: true },
  'Criada pelo admin',
];

const reason =
  'A peça 970 × 250 está com o logotipo da Francal cortado na versão para celular e o texto do botão ' +
  '(“Conheça a coleção”) fica abaixo de 11 px. Pedimos também a troca da URL de destino para a página ' +
  'da coleção, com os parâmetros de campanha do portal, e a versão em inglês para o público internacional ' +
  'credenciado no Pavilhão Azul. Depois do ajuste, a campanha volta para a fila de aprovação do comercial.';

/* ——————————————————————————— Peças compartilhadas ——————————————————————————— */

function MoreActions({ label = 'Mais ações' }: { label?: string }) {
  return (
    <Menu
      label={label}
      align="end"
      width={220}
      sections={[
        { items: [{ label: 'Duplicar campanha' }, { label: 'Baixar P.I.' }] },
        { items: [{ label: 'Cancelar campanha', danger: true }] },
      ]}
      trigger={(props) => <IconButton {...props} label={label} icon={MoreHorizontal} />}
    />
  );
}

function PiBlock() {
  return (
    <div className={x.pi}>
      <div className={x.piText}>
        <strong>P.I. 2026-0400</strong>
        <span className="num">R$ 18.000,00</span>
      </div>
      <Badge variant="text" tone="green">
        Ativo
      </Badge>
    </div>
  );
}

function HistoryList({ items = history }: { items?: typeof history }) {
  return (
    <ol className={x.history}>
      {items.map((entry) => (
        <li key={entry.title} data-current={entry.current || undefined}>
          <strong>{entry.title}</strong>
          <span className="num">{entry.meta}</span>
        </li>
      ))}
    </ol>
  );
}

function LinksList() {
  return (
    <dl className={x.links}>
      {links.map((entry) => (
        <div key={entry.label}>
          <dt>{entry.label}</dt>
          <dd className="num">{entry.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Lateral do detalhe: um painel, três blocos separados por fio. */
function DetailAside() {
  return (
    <Panel as="aside" label="Resumo da campanha">
      <Section title="Pedido de inserção">
        <PiBlock />
      </Section>
      <Section title="Histórico">
        <HistoryList />
      </Section>
      <Section title="Vínculos do ativo">
        <LinksList />
      </Section>
    </Panel>
  );
}

/** Moldura de celular (390) — a prancha mostra o layout real, sem escala. */
function Phone({
  children,
  height,
  label,
}: {
  children: ReactNode;
  height?: number;
  label?: string;
}) {
  return (
    <div
      className={x.phone}
      style={{ height }}
      role={label ? 'group' : undefined}
      aria-label={label}
    >
      {children}
    </div>
  );
}

function Caption({ children }: { children: ReactNode }) {
  return <span className={x.caption}>{children}</span>;
}

/* ——————————————————————————— Cabeçalho de página ——————————————————————————— */

function ListHeader() {
  const [tab, setTab] = useState('todas');
  return (
    <PageHeader
      className={x.flush}
      title="Campanhas"
      description="17 de 17 campanhas do portal."
      actions={
        <Button variant="primary" icon={Plus}>
          Nova campanha
        </Button>
      }
      toolbar={
        <Tabs
          label="Recortes de campanhas"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'todas', label: 'Todas', count: 17 },
            { value: 'veiculacao', label: 'Em veiculação', count: 6 },
            { value: 'aprovacao', label: 'Em aprovação', count: 5 },
            { value: 'rascunhos', label: 'Rascunhos', count: 2 },
            { value: 'encerradas', label: 'Encerradas', count: 4 },
          ]}
        />
      }
    />
  );
}

function DetailHeader({ title = 'Coleção Primavera-Verão no portal' }: { title?: string }) {
  return (
    <PageHeader
      className={x.flush}
      title={title}
      status={
        <Badge variant="text" tone="green" live>
          Veiculando
        </Badge>
      }
      meta={detailMeta}
      actions={
        <>
          <Button variant="primary">Pausar</Button>
          <Button>Concluir</Button>
        </>
      }
      more={<MoreActions />}
    />
  );
}

/** Largura disponível para a moldura (no celular, a prancha mostra o layout de celular). */
function useAvailable() {
  const ref = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(1200);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setAvailable(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, available] as const;
}

function FrameHeader({
  current = 1,
  close = false,
  compact: forceCompact = false,
}: {
  current?: number;
  close?: boolean;
  compact?: boolean;
}) {
  /* A régua com marcadores pede ~340 px; abaixo disso, “Etapa N de 6” com barra segmentada. */
  const [ref, available] = useAvailable();
  const compact = forceCompact || available < 340;
  return (
    <div ref={ref} className={x.fill}>
      <PageHeader
        variant="frame"
        title="Nova campanha"
        description="Criada pelo admin"
        actions={
          compact ? (
            <StepperCompact
              steps={steps}
              current={current}
              label="Etapas da criação"
              showNext={false}
            />
          ) : (
            <Stepper
              steps={steps}
              current={current}
              size={close ? 'sm' : 'md'}
              label="Etapas da criação"
            />
          )
        }
        more={
          close ? (
            <IconButton label="Cancelar criação" icon={X} variant="ghost" size="sm" />
          ) : undefined
        }
      />
    </div>
  );
}

/** Rodapé da moldura: quatro slots fixos; no celular, [←] [Salvar rascunho] [Principal]. */
function FrameFooter({ narrow }: { narrow: boolean }) {
  if (narrow) {
    return (
      <div className={x.phoneFoot}>
        <IconButton label="Voltar" icon={ArrowLeft} />
        <Button variant="ghost">Salvar rascunho</Button>
        <Button variant="primary" trailingIcon={ArrowRight}>
          Continuar
        </Button>
      </div>
    );
  }
  return (
    <ActionBar position="static" status="unsaved">
      <Button variant="ghost">Cancelar</Button>
      <Button variant="ghost">Salvar rascunho</Button>
      <Button icon={ArrowLeft}>Voltar</Button>
      <Button variant="primary" trailingIcon={ArrowRight} className={x.primarySlot}>
        Continuar
      </Button>
    </ActionBar>
  );
}

function PageHeaders() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="none">
        <div className={x.cases}>
          <div className={x.case}>
            <Caption>Lista</Caption>
            <ListHeader />
          </div>
          <div className={x.case}>
            <Caption>Detalhe</Caption>
            <DetailHeader />
          </div>
          <div className={x.case} data-flush="">
            <Caption>Moldura de criação</Caption>
            <div className={x.frameHead}>
              <FrameHeader current={2} />
            </div>
          </div>
        </div>
      </Shot>
      <Shot title="Título longo" align="stretch" pad="lg">
        <div className={x.sheet} style={{ maxWidth: 760 }}>
          <DetailHeader title="Retargeting de visitantes credenciados no portal e no app oficial da Francal 2026 — segunda onda de lançamentos de calçados femininos" />
        </div>
      </Shot>
      <Shot title="Celular" pad="lg">
        <div className={x.phones}>
          <Phone label="Lista no celular">
            <div className={x.phonePad}>
              <ListHeader />
            </div>
          </Phone>
          <Phone label="Detalhe no celular">
            <div className={x.phonePad}>
              <DetailHeader />
            </div>
          </Phone>
          <Phone label="Moldura no celular">
            <div className={x.frameHead} data-narrow="">
              <FrameHeader current={2} close />
            </div>
          </Phone>
        </div>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Card ——————————————————————————— */

function BonusCard({
  state,
  title,
  text,
  foot,
  progress,
}: {
  state: 'liberado' | 'bloqueado';
  title: string;
  text: string;
  foot: string[];
  progress?: number;
}) {
  return (
    <Card padding="sm" className={x.bonus} as="article">
      <span className={x.bonusState} data-state={state}>
        <i aria-hidden="true" />
        {state === 'liberado' ? 'Liberado' : 'Bloqueado'}
      </span>
      <strong className={x.bonusTitle}>{title}</strong>
      <span className={x.bonusText}>{text}</span>
      <span className={x.bonusFoot}>
        {progress !== undefined && (
          <span
            className={x.bonusBar}
            role="progressbar"
            aria-label={`Progresso de ${title}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <i style={{ width: `${progress}%` }} />
          </span>
        )}
        <MetaList size="xs" items={foot} className={x.bonusMeta} />
      </span>
    </Card>
  );
}

function LeadsCard({
  force,
  selected,
  disabled,
  loading,
  compact = false,
}: {
  force?: string;
  selected?: boolean;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
}) {
  if (loading) {
    return (
      <Card loading className={x.linkCard} aria-label="Leads recentes">
        <span className={x.boneRow} data-row="head">
          <span className={x.bone} style={{ width: '46%' }} />
        </span>
        <span className={x.boneRow} data-row="value">
          <span className={x.bone} data-size="lg" style={{ width: '28%' }} />
        </span>
        <span className={x.boneRow} data-row="meta">
          <span className={x.bone} style={{ width: '62%' }} />
        </span>
      </Card>
    );
  }
  return (
    <Card
      interactive
      selected={selected}
      disabled={disabled}
      data-force={force}
      className={x.linkCard}
    >
      <CardHeader
        title={
          <CardLink disabled={disabled} aria-current={selected ? 'true' : undefined}>
            Leads recentes
          </CardLink>
        }
        actions={<ArrowUpRight className={x.linkArrow} aria-hidden="true" />}
      />
      <span className={x.linkValue}>{disabled ? '—' : '214'}</span>
      <span className={x.linkMeta}>
        {disabled ? 'Disponível na veiculação' : 'Campanha + vitrine · 7 dias'}
      </span>
      {!compact && (
        <ul className={x.leadMini}>
          {[
            ['Calçados Vitória', 'há 2 h'],
            ['Rede Passo Firme', 'há 5 h'],
            ['Sapataria Central', 'ontem'],
          ].map(([name, when]) => (
            <li key={name}>
              <BrandMark name={name ?? ''} size="xs" variant="soft" decorative />
              <span>{name}</span>
              <span className="num">{when}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function DeliveryCard() {
  return (
    <Card interactive className={x.linkCard}>
      <CardHeader
        title={<CardLink>Analytics</CardLink>}
        actions={<ArrowUpRight className={x.linkArrow} aria-hidden="true" />}
      />
      <span className={x.linkValue}>271.400</span>
      <span className={x.linkMeta}>Impressões entregues · 68% da meta</span>
      <ul className={x.leadMini}>
        {[
          ['Cliques', '6.120'],
          ['CTR', '2,25%'],
          ['Leads', '214'],
        ].map(([label, value]) => (
          <li key={label}>
            <span className={x.miniLabel}>{label}</span>
            <span className="num">{value}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Cards() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="lg">
        <div className={x.cardScene}>
          <DetailAside />
          <div className={x.cardMain}>
            <Section title="Bônus" meta="2 de 3 liberados">
              <div className={x.bonusRow}>
                <BonusCard
                  state="liberado"
                  title="+20% de impressões"
                  text="Impressões extras sem custo durante a feira."
                  foot={['Verba ≥ R$ 15.000,00']}
                />
                <BonusCard
                  state="bloqueado"
                  title="Destaque na newsletter"
                  text="Logo na newsletter diária dos credenciados."
                  foot={['Verba ≥ R$ 27.000,00', 'faltam R$ 9.000,00']}
                  progress={67}
                />
                <BonusCard
                  state="liberado"
                  title="Desconto de fidelidade"
                  text="5% de desconto a partir da terceira campanha."
                  foot={['A partir da 3ª campanha']}
                />
              </div>
            </Section>
            <Section title="Desempenho">
              <div className={x.linkRow}>
                <LeadsCard />
                <DeliveryCard />
              </div>
            </Section>
          </div>
        </div>
      </Shot>
      <Shot title="Estados" tone="white" align="stretch" pad="lg">
        <States
          min={196}
          items={[
            {
              label: 'Repouso',
              children: (
                <div className={x.fill}>
                  <LeadsCard compact />
                </div>
              ),
            },
            {
              label: 'Hover',
              children: (
                <div className={x.fill}>
                  <LeadsCard compact force="hover" />
                </div>
              ),
            },
            {
              label: 'Pressionado',
              children: (
                <div className={x.fill}>
                  <LeadsCard compact force="active" />
                </div>
              ),
            },
            {
              label: 'Foco',
              children: (
                <div className={x.fill}>
                  <LeadsCard compact force="focus" />
                </div>
              ),
            },
            {
              label: 'Selecionado',
              children: (
                <div className={x.fill}>
                  <LeadsCard compact selected />
                </div>
              ),
            },
            {
              label: 'Indisponível',
              children: (
                <div className={x.fill}>
                  <LeadsCard compact disabled />
                </div>
              ),
            },
            {
              label: 'Carregando',
              children: (
                <div className={x.fill}>
                  <LeadsCard compact loading />
                </div>
              ),
            },
          ]}
        />
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Seções ——————————————————————————— */

function DetailExcerpt() {
  return (
    <div className={x.detail}>
      <div className={x.detailMain}>
        <Section title="Configuração">
          <DescriptionList items={configItems} />
        </Section>
        <Section
          title="Briefing"
          meta="0 de 6 preenchidos"
          action={<LinkButton>Preencher</LinkButton>}
        >
          <DescriptionList items={briefingDraft} />
        </Section>
      </div>
      <DetailAside />
    </div>
  );
}

function Sections() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="lg">
        <DetailExcerpt />
      </Shot>
      <Shot title="Variantes" tone="white" align="stretch" pad="lg">
        <SectionVariants
          items={[
            {
              label: 'Aberta',
              children: (
                <div className={x.fill}>
                  <Section
                    title="Canais"
                    meta="2 canais"
                    action={<LinkButton tone="quiet">Editar</LinkButton>}
                  >
                    <DescriptionList
                      labelWidth={156}
                      items={[
                        { label: 'Portal da feira', value: '50% · ≈ R$ 9.000', numeric: true },
                        { label: 'App Francal', value: '50% · ≈ R$ 9.000', numeric: true },
                      ]}
                    />
                  </Section>
                </div>
              ),
            },
            {
              label: 'Painel',
              children: (
                <div className={x.fill}>
                  <Section variant="panel" title="Pedido de inserção">
                    <PiBlock />
                  </Section>
                </div>
              ),
            },
            {
              label: 'Faixa',
              children: (
                <div className={x.fill}>
                  <BandDemo />
                </div>
              ),
            },
          ]}
        />
      </Shot>
      <Shot title="Celular" pad="lg">
        <div className={x.phones}>
          <Phone label="Detalhe no celular">
            <div className={x.phonePad}>
              {/* Seções irmãs fora da pilha com gap: o fio entre elas já traz 28 px de cada lado. */}
              <div className={x.asideLead}>
                <DetailAside />
              </div>
              <Section title="Configuração">
                <DescriptionList items={configItems.slice(0, 6)} />
              </Section>
              <Section
                title="Briefing"
                meta="0 de 6 preenchidos"
                action={<LinkButton>Preencher</LinkButton>}
              >
                <DescriptionList items={briefingDraft.slice(0, 3)} />
              </Section>
            </div>
          </Phone>
        </div>
      </Shot>
    </Shots>
  );
}

function BandDemo() {
  const [query, setQuery] = useState('');
  return (
    <Section variant="band">
      <SearchField
        size="sm"
        value={query}
        onValueChange={setQuery}
        label="Buscar campanha"
        placeholder="Campanha ou nº"
        className={x.bandSearch}
      />
      <Button size="sm">Filtros</Button>
    </Section>
  );
}

function SectionVariants({ items }: { items: { label: string; children: ReactNode }[] }) {
  return (
    <div className={x.sectionVariants}>
      {items.map((item) => (
        <State key={item.label} label={item.label}>
          {item.children}
        </State>
      ))}
    </div>
  );
}

/* ——————————————————————————— Acordeão ——————————————————————————— */

function reviewItems(open?: boolean): AccordionItem[] {
  return [
    {
      id: 'identificacao',
      title: 'Identificação',
      status: 'done',
      meta: 'Coleção Primavera-Verão 2027',
      content: (
        <DescriptionList
          labelWidth={132}
          items={[
            { label: 'Anunciante', value: 'Aurora Calçados' },
            { label: 'Criada por', value: 'Admin do portal' },
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
          labelWidth={132}
          items={[
            { label: 'Categoria', value: 'Mídia Online' },
            { label: 'Período', value: '05/10/2026 – 31/10/2026 · 27 dias', numeric: true },
          ]}
        />
      ),
    },
    {
      id: 'precificacao',
      title: 'Precificação',
      status: 'done',
      meta: <span className="num">R$ 18.000,00</span>,
      content: (
        <DescriptionList
          labelWidth={132}
          items={[
            { label: 'Modelo', value: 'CPM · R$ 45,00 / mil impressões', numeric: true },
            { label: 'Entrega', value: '≈ 400.000 impressões', numeric: true },
          ]}
        />
      ),
    },
    {
      id: 'briefing',
      title: 'Briefing',
      status: 'error',
      meta: open === false ? '2 faltando' : '2 campos obrigatórios faltando',
      content: (
        <ul className={x.missing}>
          {['Idioma da peça', 'Entrega do criativo'].map((field) => (
            <li key={field}>
              <span>{field}</span>
              <span className={x.missingTag}>Falta</span>
              <LinkButton>Preencher</LinkButton>
            </li>
          ))}
        </ul>
      ),
    },
  ];
}

function SummaryContent() {
  return (
    <div className={x.summary}>
      <div className={x.summaryHead}>
        <BrandMark name="Aurora Calçados" size="sm" decorative />
        <div>
          <strong>Coleção Primavera-Verão 2027</strong>
          <span>Aurora Calçados</span>
        </div>
      </div>
      <DescriptionList
        labelWidth={104}
        items={[
          { label: 'Verba', value: 'R$ 18.000,00', hint: '≈ 400.000 impressões', numeric: true },
          { label: 'Ativo', value: 'Banner Super Topo — Portal' },
          { label: 'Período', value: '05/10 – 31/10', hint: '27 dias', numeric: true },
          { label: 'Bônus', value: '2 de 3 liberados', numeric: true },
        ]}
      />
    </div>
  );
}

function CreationPhone({ open = false }: { open?: boolean }) {
  return (
    <Phone label="Criação no celular" height={600}>
      <FixedFrame
        height="100%"
        header={<FrameHeader current={2} close />}
        aside={<SummaryContent />}
        asideSummary="Resumo · R$ 18.000,00 · 27 dias"
        asideDefaultOpen={open}
        footer={<FrameFooter narrow />}
      >
        <Section title="Precificação">
          <div className={x.stack}>
            <Field label="Verba planejada" required hint="Múltiplos de R$ 45,00">
              {(props) => (
                <Input
                  id={props.id}
                  aria-describedby={props.describedBy}
                  prefix="R$"
                  defaultValue="18.000,00"
                  inputMode="decimal"
                />
              )}
            </Field>
            <DescriptionList
              layout="strip"
              items={[
                { label: 'Por dia', value: '≈ 14.815', numeric: true },
                { label: 'Com bônus', value: '≈ 480.000', numeric: true },
              ]}
            />
          </div>
        </Section>
      </FixedFrame>
    </Phone>
  );
}

function ReasonBlock() {
  return (
    <Section
      variant="panel"
      title="Motivo"
      meta={
        <Badge variant="text" tone="orange" size="sm">
          Ajustes solicitados
        </Badge>
      }
    >
      <div className={x.reason}>
        <ExpandableText lines={3}>{reason}</ExpandableText>
        <MetaList
          size="xs"
          items={['Marina Lopes', { value: '29/09/2026 às 16:42', numeric: true }]}
        />
      </div>
    </Section>
  );
}

function single(item: Partial<AccordionItem> & { id: string }, open = false) {
  const base: AccordionItem = {
    id: item.id,
    title: 'Briefing',
    meta: '6 campos',
    content: <MetaList size="sm" items={['peca-970x250.png', 'Português', 'Pavilhão Azul']} />,
  };
  return (
    <Accordion
      variant="panel"
      items={[{ ...base, ...item }]}
      defaultValue={open ? [item.id] : []}
    />
  );
}

function Accordions() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="lg">
        <div className={x.accScene}>
          <CreationPhone />
          <div className={x.stack} data-gap="lg">
            <Section title="Checagem" meta="3 de 4">
              <Accordion
                variant="panel"
                type="multiple"
                defaultValue={['briefing']}
                items={reviewItems()}
              />
            </Section>
            <ReasonBlock />
          </div>
        </div>
      </Shot>
      <Shot title="Estados" tone="white" align="stretch" pad="lg">
        <States
          min={300}
          items={[
            { label: 'Fechado', children: <div className={x.fill}>{single({ id: 'a' })}</div> },
            {
              label: 'Hover',
              children: <div className={x.fill}>{single({ id: 'b', force: 'hover' })}</div>,
            },
            {
              label: 'Aberto',
              children: <div className={x.fill}>{single({ id: 'c' }, true)}</div>,
            },
            {
              label: 'Foco',
              children: <div className={x.fill}>{single({ id: 'd', force: 'focus' })}</div>,
            },
            {
              label: 'Com pendência',
              children: (
                <div className={x.fill}>
                  {single({ id: 'e', status: 'error', meta: '2 faltando' })}
                </div>
              ),
            },
            {
              label: 'Indisponível',
              children: (
                <div className={x.fill}>
                  {single({
                    id: 'f',
                    title: 'Relatório final',
                    meta: 'após 31/10',
                    disabled: true,
                  })}
                </div>
              ),
            },
          ]}
        />
      </Shot>
      <Shot title="Celular" pad="lg">
        <div className={x.phones}>
          <CreationPhone open />
        </div>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Separador ——————————————————————————— */

function ViewSwitch() {
  const [view, setView] = useState<'lista' | 'grupos'>('lista');
  return (
    <Segmented
      size="sm"
      label="Visualização"
      value={view}
      onChange={setView}
      options={[
        { value: 'lista', label: 'Lista', icon: LayoutList, iconOnly: true },
        { value: 'grupos', label: 'Agrupada', icon: LayoutGrid, iconOnly: true },
      ]}
    />
  );
}

function ToolbarDemo() {
  const [query, setQuery] = useState('');
  return (
    <div className={x.toolbar}>
      <SearchField
        size="sm"
        value={query}
        onValueChange={setQuery}
        label="Buscar campanha"
        placeholder="Campanha, anunciante ou nº"
        className={x.toolbarSearch}
      />
      <Divider orientation="vertical" />
      <ViewSwitch />
      <IconButton label="Exportar CSV" icon={Download} variant="ghost" size="sm" />
    </div>
  );
}

function Separators() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="lg">
        <div className={x.sepScene} data-areas="">
          <div className={x.sepCase} data-area="" style={{ '--area': 'meta' } as CSSProperties}>
            <Caption>Meta</Caption>
            <div className={x.metaBox}>
              <h3 className={x.metaTitle}>Coleção Primavera-Verão no portal</h3>
              <MetaList items={[...detailMeta, 'P.I. 2026-0400', 'Atualizada há 2 h']} />
            </div>
          </div>
          <div className={x.sepCase} data-area="" style={{ '--area': 'bar' } as CSSProperties}>
            <Caption>Barra</Caption>
            <ToolbarDemo />
          </div>
          <div className={x.sepCase} data-area="" style={{ '--area': 'panel' } as CSSProperties}>
            <Caption>Painel</Caption>
            <Panel>
              <Section title="Canais" meta="2">
                <DescriptionList
                  items={[
                    { label: 'Portal da feira', value: '50%', numeric: true },
                    { label: 'App Francal', value: '50%', numeric: true },
                  ]}
                />
              </Section>
              <Section title="Públicos" meta="2">
                <DescriptionList
                  items={[
                    { label: 'Visitantes credenciados', value: '200.000 un', numeric: true },
                    { label: 'Lojistas e compradores', value: '200.000 un', numeric: true },
                  ]}
                />
              </Section>
            </Panel>
          </div>
          <div className={x.sepCase} data-area="" style={{ '--area': 'label' } as CSSProperties}>
            <Caption>Rótulo</Caption>
            <Card padding="lg" className={x.login}>
              <div className={x.stack}>
                <Field label="E-mail">
                  {(props) => (
                    <Input
                      id={props.id}
                      aria-describedby={props.describedBy}
                      type="email"
                      defaultValue="marina.lopes@francal.com.br"
                    />
                  )}
                </Field>
                <Button variant="primary">Entrar</Button>
                <Divider label="ou" />
                <Button>Entrar com código</Button>
              </div>
            </Card>
          </div>
        </div>
      </Shot>
      <Shot title="Variantes" tone="white" align="stretch" pad="lg">
        {/* Cada amostra numa faixa de 64: os fios ficam no mesmo eixo e as legendas na mesma linha. */}
        <States
          min={176}
          items={[
            {
              label: 'Horizontal',
              children: (
                <div className={x.varCell}>
                  <div className={x.varBox}>
                    <span>Configuração</span>
                    <Divider />
                    <span>Briefing</span>
                  </div>
                </div>
              ),
            },
            {
              label: 'Recuado',
              children: (
                <div className={x.varCell}>
                  <div className={x.varBox}>
                    <span className={x.varRow}>
                      <BrandMark name="Pátio Couro" size="xs" variant="soft" decorative />
                      Pátio Couro
                    </span>
                    <Divider inset={28} tone="soft" />
                    <span className={x.varRow}>
                      <BrandMark name="Bella Passo" size="xs" variant="soft" decorative />
                      Bella Passo
                    </span>
                  </div>
                </div>
              ),
            },
            {
              label: 'Vertical',
              children: (
                <div className={x.varCell}>
                  <div className={x.varInline}>
                    <span>Filtros</span>
                    <Divider orientation="vertical" />
                    <span>Exportar</span>
                  </div>
                </div>
              ),
            },
            {
              label: 'Rótulo',
              children: (
                <div className={x.varCell}>
                  <div className={x.varBox}>
                    <Divider label="ou" />
                  </div>
                </div>
              ),
            },
            {
              label: 'Ponto',
              children: (
                <div className={x.varCell}>
                  <MetaList items={['Portal', 'App', 'Vitrine']} size="sm" />
                </div>
              ),
            },
          ]}
        />
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Rolagem ——————————————————————————— */

function AsideSummary() {
  return (
    <div className={x.asideSummary}>
      <div className={x.summaryHead}>
        <BrandMark name="Aurora Calçados" size="sm" decorative />
        <div>
          <strong>Coleção Primavera-Verão 2027</strong>
          <span>Aurora Calçados</span>
        </div>
      </div>
      {[
        ['Verba', 'R$ 18.000,00', '≈ 400.000 impressões · CPM R$ 45,00'],
        ['Ativo', 'Banner Super Topo — Portal', '2 canais · 3 públicos disponíveis'],
        ['Período', '05/10 – 31/10', '27 dias · janela 01/10 – 30/11'],
        ['Distribuição', 'Portal da feira 50% · App 50%', 'Visitantes e lojistas'],
        ['Bônus', '2 de 3 liberados', 'Destaque na newsletter: faltam R$ 9.000,00'],
        ['Briefing', '4 de 6 preenchidos', 'Idioma e entrega do criativo'],
      ].map(([label, value, hint]) => (
        <div key={label} className={x.summaryBlock}>
          <span>{label}</span>
          <strong className="num">{value}</strong>
          <small className="num">{hint}</small>
        </div>
      ))}
    </div>
  );
}

/** Rola a área para uma posição fixa depois de montar (pranchas de estado). */
function useScrollAt(where: 'start' | 'middle' | 'end', axis: 'x' | 'y' = 'y') {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const max = axis === 'y' ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
    const to = where === 'start' ? 0 : where === 'middle' ? max / 2 : max;
    if (axis === 'y') el.scrollTop = to;
    else el.scrollLeft = to;
    el.dispatchEvent(new Event('scroll'));
  }, [where, axis]);
  return ref;
}

function SummaryScroll({ at = 'start' }: { at?: 'start' | 'middle' | 'end' }) {
  const ref = useScrollAt(at);
  return (
    <div className={x.asideBox}>
      <ScrollArea label="Resumo da campanha" maxHeight={420} viewportRef={ref}>
        <AsideSummary />
      </ScrollArea>
    </div>
  );
}

type WideRow = {
  name: string;
  advertiser: string;
  status: string;
  tone: 'green' | 'amber' | 'violet' | 'orange';
  budget: string;
  count: string;
  period: string;
};

const tableRows: WideRow[] = [
  {
    name: 'Coleção Primavera-Verão no portal',
    advertiser: 'Aurora Calçados',
    status: 'Veiculando',
    tone: 'green',
    budget: 'R$ 18.000,00',
    count: '10',
    period: '01/10 – 31/10',
  },
  {
    name: 'Newsletter dos expositores',
    advertiser: 'Estúdio Norte',
    status: 'Veiculando',
    tone: 'green',
    budget: 'R$ 8.000,00',
    count: '8',
    period: '05/10 – 25/10',
  },
  {
    name: 'Convite para o estande B-214',
    advertiser: 'Casa Forma',
    status: 'Aguardando assinatura do P.I.',
    tone: 'amber',
    budget: 'R$ 3.600,00',
    count: '5',
    period: '14/10 – 17/10',
  },
  {
    name: 'Destaque couro vegetal',
    advertiser: 'Lume Acessórios',
    status: 'Aguardando aprovação',
    tone: 'violet',
    budget: 'R$ 9.000,00',
    count: '10',
    period: '10/10 – 30/10',
  },
  {
    name: 'Retargeting de credenciados',
    advertiser: 'Grupo Horizonte',
    status: 'Ajustes solicitados',
    tone: 'orange',
    budget: 'R$ 13.500,00',
    count: '10',
    period: '01/10 – 31/10',
  },
];

function WideTable() {
  return (
    <div className={x.tableBox}>
      <ScrollArea label="Campanhas" orientation="horizontal" fade="end">
        <table className={x.table}>
          <thead>
            <tr>
              <th scope="col">Campanha</th>
              <th scope="col">Anunciante</th>
              <th scope="col">Status</th>
              <th scope="col" data-num="">
                Verba
              </th>
              <th scope="col" data-num="">
                Vínculos
              </th>
              <th scope="col">Período</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => (
              <tr key={row.name}>
                <th scope="row">{row.name}</th>
                <td>{row.advertiser}</td>
                <td>
                  <Badge variant="text" tone={row.tone} live={row.status === 'Veiculando'}>
                    {row.status}
                  </Badge>
                </td>
                <td data-num="">{row.budget}</td>
                <td data-num="">{row.count}</td>
                <td className="num">{row.period}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
}

function CategoryPills() {
  const [active, setActive] = useState('online');
  const items = [
    ['online', 'Mídia Online', 4],
    ['organico', 'Conteúdo Orgânico', 2],
    ['offline', 'Mídia Offline', 2],
    ['prospeccao', 'Prospecção Ativa', 1],
  ] as const;
  return (
    <ScrollArea label="Categorias" orientation="horizontal">
      <div className={x.pills} role="group" aria-label="Categoria">
        {items.map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            className={x.pill}
            aria-pressed={active === id}
            onClick={() => setActive(id)}
          >
            {label}
            <span className="num">{count}</span>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}

const navGroups = [
  {
    label: 'Configuração',
    items: [
      ['Métricas', BarChart3],
      ['Canais', RadioIcon],
      ['Públicos', Users],
      ['Bônus', Gift],
    ],
  },
  {
    label: 'Operação',
    items: [
      ['Campanhas', Megaphone],
      ['Pedidos de Inserção', LayoutList],
      ['Leads', Users],
    ],
  },
  {
    label: 'Portal',
    items: [
      ['Fornecedores', LayoutGrid],
      ['Empresa & Branding', LayoutGrid],
      ['Categorias da Vitrine', LayoutGrid],
      ['Auditoria', LayoutGrid],
    ],
  },
] as const;

function NavScroll() {
  return (
    <div className={x.navBox}>
      <ScrollArea label="Menu principal" maxHeight={300}>
        <nav aria-label="Menu principal (prancha)" className={x.nav}>
          {navGroups.map((group) => (
            <div key={group.label} className={x.navGroup}>
              <span className={x.navLabel}>{group.label}</span>
              {group.items.map(([label, Icon]) => (
                <a
                  key={label}
                  href="#scroll"
                  className={x.navItem}
                  aria-current={label === 'Campanhas' ? 'page' : undefined}
                  onClick={(event) => event.preventDefault()}
                >
                  <Icon aria-hidden="true" />
                  {label}
                </a>
              ))}
            </div>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
}

function ShortList({ count = 8 }: { count?: number }) {
  return (
    <ol className={x.history} data-dense="">
      {[...history, ...history].slice(0, count).map((entry, index) => (
        <li key={`${entry.title}-${index}`}>
          <strong>{entry.title}</strong>
          <span className="num">{entry.meta}</span>
        </li>
      ))}
    </ol>
  );
}

function ScrollState({
  at,
  count = 9,
  force,
}: {
  at: 'start' | 'middle' | 'end';
  count?: number;
  force?: string;
}) {
  const ref = useScrollAt(at);
  return (
    <div className={x.stateScroll}>
      <ScrollArea label="Histórico" maxHeight={176} viewportRef={ref} force={force}>
        <div className={x.stateScrollPad}>
          <ShortList count={count} />
        </div>
      </ScrollArea>
    </div>
  );
}

function Scrolls() {
  return (
    <Shots>
      <Shot title="Em contexto" align="stretch" pad="lg">
        <div className={x.scrollScene}>
          <div className={x.sepCase}>
            <Caption>Resumo · início</Caption>
            <SummaryScroll />
          </div>
          <div className={x.sepCase}>
            <Caption>Resumo · meio</Caption>
            <SummaryScroll at="middle" />
          </div>
          <div className={x.sepCase}>
            <Caption>Menu lateral</Caption>
            <NavScroll />
          </div>
        </div>
      </Shot>
      <Shot title="Horizontal" align="stretch" pad="lg">
        <div className={x.hScene}>
          <div className={x.sepCase}>
            <Caption>Tabela larga</Caption>
            <WideTable />
          </div>
          <div className={x.sepCase}>
            <Caption>Categorias no celular</Caption>
            <Phone label="Categorias no celular">
              <div className={x.phonePad}>
                <CategoryPills />
              </div>
            </Phone>
          </div>
        </div>
      </Shot>
      <Shot title="Estados" tone="white" align="stretch" pad="lg">
        <States
          min={176}
          items={[
            { label: 'Sem excesso', children: <ScrollState at="start" count={3} /> },
            { label: 'No início', children: <ScrollState at="start" /> },
            { label: 'No meio', children: <ScrollState at="middle" /> },
            { label: 'No fim', children: <ScrollState at="end" /> },
            { label: 'Foco', children: <ScrollState at="start" force="focus" /> },
          ]}
        />
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Painéis redimensionáveis ——————————————————————————— */

const leads = [
  {
    id: 'l1',
    company: 'Calçados Vitória',
    person: 'Renata Albuquerque',
    when: '22/10 · 16:25',
    origin: 'Banner Super Topo — Portal',
    interest: 'Linha Primavera-Verão, couro vegetal',
  },
  {
    id: 'l2',
    company: 'Rede Passo Firme',
    person: 'Otávio Mendes',
    when: '22/10 · 14:02',
    origin: 'Push no app da feira',
    interest: 'Tênis casual, grade infantil',
  },
  {
    id: 'l3',
    company: 'Sapataria Central de Franca',
    person: 'Lívia Carvalho',
    when: '22/10 · 11:48',
    origin: 'Destaque na vitrine',
    interest: 'Botas femininas',
  },
  {
    id: 'l4',
    company: 'Boutique Lírio',
    person: 'Helena Saraiva',
    when: '21/10 · 18:30',
    origin: 'E-mail marketing dedicado',
    interest: 'Acessórios em couro',
  },
  {
    id: 'l5',
    company: 'Magazine Trilha',
    person: 'Caio Fontana',
    when: '21/10 · 10:12',
    origin: 'Banner Super Topo — Portal',
    interest: 'Sandálias, linha verão',
  },
  {
    id: 'l6',
    company: 'Empório Bossa Calçados',
    person: 'Débora Vilela',
    when: '20/10 · 17:55',
    origin: 'Painel de LED — Pavilhão Azul',
    interest: 'Mocassins masculinos',
  },
  {
    id: 'l7',
    company: 'Loja Ponto Chic',
    person: 'Sérgio Amaral',
    when: '20/10 · 09:40',
    origin: 'Push no app da feira',
    interest: 'Bolsas e cintos',
  },
  {
    id: 'l8',
    company: 'Casa do Sapato Sul',
    person: 'Aline Prado',
    when: '19/10 · 15:21',
    origin: 'Destaque na vitrine',
    interest: 'Calçados ortopédicos',
  },
];

function LeadsSplit() {
  const [current, setCurrent] = useState('l1');
  const lead = leads.find((entry) => entry.id === current) ?? leads[0];
  if (!lead) return null;
  const email = `${(lead.person.split(' ')[0] ?? 'contato').toLowerCase()}@${lead.company
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, '')}.com.br`;
  return (
    <ResizablePanels
      height={520}
      defaultSize={320}
      min={240}
      max={480}
      storageKey="mediaon-dsv3-split-leads"
      stackedHeight={292}
      label="Largura da lista de leads"
      left={
        <div className={x.leadList}>
          <div className={x.leadListHead}>
            <strong>Leads</strong>
            <span className="num">214</span>
          </div>
          <ScrollArea label="Lista de leads" className={x.leadScroll}>
            <ul className={x.leadRows}>
              {leads.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    className={x.leadRow}
                    aria-pressed={entry.id === current}
                    onClick={() => setCurrent(entry.id)}
                  >
                    <BrandMark name={entry.company} size="xs" variant="soft" decorative />
                    <span className={x.leadName}>
                      <strong>{entry.company}</strong>
                      <span>{entry.person}</span>
                    </span>
                    <span className={`${x.leadWhen} num`}>{entry.when}</span>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      }
      right={
        <div className={x.leadDetail}>
          <div className={x.leadDetailHead}>
            <BrandMark name={lead.company} size="md" decorative />
            <div className={x.leadDetailTitle}>
              <h3>{lead.company}</h3>
              <MetaList size="sm" items={[lead.person, { value: lead.when, numeric: true }]} />
            </div>
            <Button size="sm" icon={Download}>
              Exportar
            </Button>
          </div>
          <DescriptionList
            labelWidth={148}
            items={[
              { label: 'Contato', value: lead.person },
              { label: 'E-mail', value: email, copy: email },
              { label: 'Telefone', value: '(16) 99812-4410' },
              { label: 'Origem', value: lead.origin },
              { label: 'Campanha', value: 'Coleção Primavera-Verão no portal · #2041' },
              { label: 'Interesse', value: lead.interest },
              {
                label: 'Capturado em',
                value: lead.when.replace(' · ', '/2026 às '),
                numeric: true,
              },
            ]}
          />
        </div>
      }
    />
  );
}

function PiSplit() {
  return (
    <ResizablePanels
      height={460}
      defaultSize={360}
      min={280}
      max={520}
      storageKey="mediaon-dsv3-split-pi"
      label="Largura do formulário"
      showLabel="Mostrar formulário"
      left={
        <ScrollArea label="Dados do P.I." className={x.fillHeight}>
          <div className={x.piForm}>
            <Section title="Dados do P.I.">
              <div className={x.stack}>
                <Field label="Contato do anunciante" required>
                  {(props) => (
                    <Input
                      id={props.id}
                      aria-describedby={props.describedBy}
                      defaultValue="Juliana Prates"
                    />
                  )}
                </Field>
                <Field label="E-mail para assinatura" required>
                  {(props) => (
                    <Input
                      id={props.id}
                      aria-describedby={props.describedBy}
                      type="email"
                      defaultValue="juliana@auroracalcados.com.br"
                    />
                  )}
                </Field>
                <Field label="Condição de pagamento">
                  {(props) => (
                    <Input
                      id={props.id}
                      aria-describedby={props.describedBy}
                      defaultValue="30 dias após a veiculação"
                    />
                  )}
                </Field>
              </div>
            </Section>
          </div>
        </ScrollArea>
      }
      right={
        <ScrollArea label="Prévia do P.I." className={x.fillHeight} viewportClassName={x.docStage}>
          <article className={x.doc} aria-label="Prévia do pedido de inserção">
            <header className={x.docHead}>
              <BrandMark name="Francal 2026" size="sm" decorative />
              <div>
                <strong>Pedido de inserção</strong>
                <MetaList
                  size="xs"
                  items={['P.I. 2026-0400', { value: '29/09/2026', numeric: true }]}
                />
              </div>
            </header>
            <DescriptionList
              labelWidth={128}
              items={[
                { label: 'Anunciante', value: 'Aurora Calçados' },
                { label: 'Contato', value: 'Juliana Prates' },
                { label: 'Campanha', value: 'Coleção Primavera-Verão no portal' },
                { label: 'Ativo', value: 'Banner Super Topo — Portal' },
                { label: 'Período', value: '01/10/2026 – 31/10/2026', numeric: true },
                { label: 'Verba', value: 'R$ 18.000,00', numeric: true },
                { label: 'Pagamento', value: '30 dias após a veiculação' },
              ]}
            />
            <div className={x.docSign}>
              <span>Francal Feiras</span>
              <span>Aurora Calçados</span>
            </div>
          </article>
        </ScrollArea>
      }
    />
  );
}

function MiniSplit({ force, collapsed = false }: { force?: string; collapsed?: boolean }) {
  return (
    <div className={x.miniSplit}>
      <ResizablePanels
        height={132}
        defaultSize={84}
        min={64}
        max={140}
        stackBelow={0}
        defaultCollapsed={collapsed}
        force={force}
        label="Largura da lista"
        left={
          <ul className={x.miniList}>
            {['Vitória', 'Lírio', 'Trilha', 'Bossa'].map((name, index) => (
              <li key={name} data-current={index === 0 || undefined}>
                {name}
              </li>
            ))}
          </ul>
        }
        right={
          <div className={x.miniDetail}>
            <strong>Calçados Vitória</strong>
            <span className="num">há 2 h</span>
          </div>
        }
      />
    </div>
  );
}

function Splits() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="none">
        <LeadsSplit />
      </Shot>
      <Shot title="Prévia e formulário" tone="white" align="stretch" pad="none">
        <PiSplit />
      </Shot>
      <Shot title="Estados" tone="white" align="stretch" pad="lg">
        <States
          min={176}
          items={[
            { label: 'Repouso', children: <MiniSplit /> },
            { label: 'Hover', children: <MiniSplit force="hover" /> },
            { label: 'Arrastando', children: <MiniSplit force="active" /> },
            { label: 'Foco', children: <MiniSplit force="focus" /> },
            { label: 'Recolhido', children: <MiniSplit collapsed /> },
          ]}
        />
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Lista de descrição ——————————————————————————— */

function Descriptions() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="lg">
        <div className={x.detail}>
          <div className={x.detailMain}>
            <Section title="Configuração">
              <DescriptionList items={configItems} />
            </Section>
            <Section
              title="Briefing"
              meta="4 de 6 preenchidos"
              action={<LinkButton tone="quiet">Editar</LinkButton>}
            >
              <DescriptionList layout="grid" items={briefingReview} />
            </Section>
          </div>
          <Panel as="aside" label="Pedido de inserção">
            <Section title="Pedido de inserção">
              <DescriptionList
                labelWidth={96}
                items={[
                  { label: 'Código', value: '2026-0400', copy: '2026-0400' },
                  {
                    label: 'Status',
                    value: (
                      <Badge variant="text" tone="green">
                        Ativo
                      </Badge>
                    ),
                  },
                  { label: 'Valor', value: 'R$ 18.000,00', numeric: true },
                  { label: 'Assinado', value: '29/09/2026 às 16:42', numeric: true },
                ]}
              />
            </Section>
          </Panel>
        </div>
      </Shot>
      <Shot title="Variantes" tone="white" align="stretch" pad="lg">
        <div className={x.variants}>
          <State label="Linhas">
            <div className={x.fill}>
              <DescriptionList items={configItems.slice(0, 4)} />
            </div>
          </State>
          <State label="Grade">
            <div className={x.fill}>
              <DescriptionList layout="grid" columns={3} items={briefingReview} />
            </div>
          </State>
          <State label="Faixa">
            <div className={x.fill}>
              <DescriptionList
                layout="strip"
                items={[
                  { label: 'Canais', value: 'Portal da feira, App Francal' },
                  {
                    label: 'Públicos',
                    value: 'Visitantes credenciados, Lojistas e compradores, Imprensa',
                  },
                  { label: 'Briefing e bônus', value: '7 campos · 3 bônus' },
                ]}
              />
            </div>
          </State>
        </div>
      </Shot>
      <Shot title="Estados" tone="white" align="stretch" pad="lg">
        <States
          min={300}
          items={[
            {
              label: 'Valor longo',
              children: (
                <div className={x.fill}>
                  <DescriptionList
                    labelWidth={120}
                    items={[
                      {
                        label: 'Públicos',
                        value: 'Visitantes credenciados (50%), Lojistas e compradores (50%)',
                      },
                    ]}
                  />
                </div>
              ),
            },
            {
              label: 'Vazio',
              children: (
                <div className={x.fill}>
                  <DescriptionList
                    labelWidth={120}
                    items={[{ label: 'Texto alternativo', state: 'empty' }]}
                  />
                </div>
              ),
            },
            {
              label: 'Faltando',
              children: (
                <div className={x.fill}>
                  <DescriptionList
                    labelWidth={120}
                    items={[{ label: 'Idioma da peça', state: 'missing' }]}
                  />
                </div>
              ),
            },
            {
              label: 'Carregando',
              children: (
                <div className={x.fill}>
                  <DescriptionList labelWidth={120} items={[]} loading loadingRows={2} />
                </div>
              ),
            },
          ]}
        />
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Shell ——————————————————————————— */

const shellNav: NavGroup[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    items: [{ id: 'visao', label: 'Visão geral', icon: LayoutGrid }],
  },
  {
    id: 'config',
    label: 'Configuração',
    items: [
      { id: 'metricas', label: 'Métricas', icon: BarChart3 },
      { id: 'canais', label: 'Canais', icon: RadioIcon },
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
      { id: 'pis', label: 'Pedidos de Inserção', icon: FileText },
      { id: 'leads', label: 'Leads', icon: UserRound, count: 2 },
    ],
  },
  {
    id: 'portal',
    label: 'Portal',
    items: [
      { id: 'fornecedores', label: 'Fornecedores', icon: Store },
      { id: 'branding', label: 'Empresa & Branding', icon: Building2 },
      { id: 'vitrine', label: 'Categorias da Vitrine', icon: Tags },
      { id: 'auditoria', label: 'Auditoria', icon: ShieldCheck },
      { id: 'configuracoes', label: 'Configurações', icon: Settings },
    ],
  },
];

const portals = [
  { id: 'francal', name: 'Francal 2026', detail: 'Portal do organizador' },
  { id: 'couromoda', name: 'Salão do Couro 2027', detail: 'Portal do organizador' },
];

type ShellCampaign = {
  id: string;
  name: string;
  asset: string;
  advertiser: string;
  status: string;
  tone: 'green' | 'amber' | 'violet' | 'orange' | 'gray';
  budget: string;
  period: string;
};

const shellCampaigns: ShellCampaign[] = [
  {
    id: '2041',
    name: 'Coleção Primavera-Verão no portal',
    asset: 'Banner Super Topo — Portal',
    advertiser: 'Aurora Calçados',
    status: 'Veiculando',
    tone: 'green',
    budget: 'R$ 18.000,00',
    period: '01/10 – 31/10',
  },
  {
    id: '2038',
    name: 'Newsletter dos expositores',
    asset: 'E-mail marketing dedicado',
    advertiser: 'Estúdio Norte',
    status: 'Veiculando',
    tone: 'green',
    budget: 'R$ 8.000,00',
    period: '05/10 – 25/10',
  },
  {
    id: '2035',
    name: 'Convite para o estande B-214',
    asset: 'Push no app da feira',
    advertiser: 'Casa Forma',
    status: 'Aguardando assinatura do P.I.',
    tone: 'amber',
    budget: 'R$ 3.600,00',
    period: '14/10 – 17/10',
  },
  {
    id: '2032',
    name: 'Destaque couro vegetal',
    asset: 'Banner Super Topo — Portal',
    advertiser: 'Lume Acessórios',
    status: 'Aguardando aprovação',
    tone: 'violet',
    budget: 'R$ 9.000,00',
    period: '10/10 – 30/10',
  },
  {
    id: '2029',
    name: 'Retargeting de credenciados',
    asset: 'Banner Super Topo — Portal',
    advertiser: 'Grupo Horizonte',
    status: 'Ajustes solicitados',
    tone: 'orange',
    budget: 'R$ 13.500,00',
    period: '01/10 – 31/10',
  },
];

const shellColumns: Column<ShellCampaign>[] = [
  {
    key: 'name',
    header: 'Campanha',
    render: (row) => (
      <span className={x.cellName}>
        <strong title={row.name}>{row.name}</strong>
        <MetaList
          size="xs"
          wrap={false}
          items={[row.asset, { value: `#${row.id}`, numeric: true }]}
        />
      </span>
    ),
  },
  {
    key: 'advertiser',
    header: 'Anunciante',
    width: 160,
    render: (row) => (
      <span className={x.cellBrand}>
        <BrandMark name={row.advertiser} size="xs" variant="soft" decorative />
        {row.advertiser}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    width: 160,
    render: (row) => (
      <Badge variant="text" wrap tone={row.tone} live={row.status === 'Veiculando'}>
        {row.status}
      </Badge>
    ),
  },
  {
    key: 'budget',
    header: 'Verba',
    numeric: true,
    width: 128,
    render: (row) => <span className={x.nowrap}>{row.budget}</span>,
  },
];

function ShellSidebar({
  active,
  onNavigate,
}: {
  active: string;
  onNavigate: (id: string) => void;
}) {
  const [portal, setPortal] = useState('francal');
  return (
    <Sidebar
      groups={shellNav}
      active={active}
      onNavigate={onNavigate}
      switcher={<PortalSwitcher portals={portals} value={portal} onChange={setPortal} />}
      account={
        <SidebarAccount
          name="Marina Lopes"
          detail="Operação · Francal"
          sections={[{ items: [{ label: 'Meu perfil' }, { label: 'Sair' }] }]}
        />
      }
    />
  );
}

function CampaignCards({
  page,
  onPageChange,
}: {
  page: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className={x.cardsList}>
      <ul>
        {shellCampaigns.map((row) => (
          <li key={row.id} className={x.campaignCard}>
            <strong>{row.name}</strong>
            <MetaList
              size="sm"
              items={[
                <Badge
                  key="s"
                  variant="text"
                  tone={row.tone}
                  size="sm"
                  live={row.status === 'Veiculando'}
                >
                  {row.status}
                </Badge>,
                row.advertiser,
              ]}
            />
            <MetaList
              size="sm"
              items={[
                { value: row.budget, numeric: true },
                { value: row.period, numeric: true },
              ]}
            />
          </li>
        ))}
      </ul>
      <Pagination
        page={page}
        pageSize={5}
        total={17}
        onPageChange={onPageChange}
        noun="campanhas"
      />
    </div>
  );
}

type ShellDevice = 'desktop' | 'tablet' | 'phone';

/** Largura da moldura por aparelho. Desktop ocupa o palco inteiro (menu lateral fixo). */
const deviceWidth: Record<ShellDevice, number> = { desktop: Infinity, tablet: 1024, phone: 390 };

function ShellSpecimen() {
  const [stageRef, available] = useAvailable();
  const [device, setDevice] = useState<ShellDevice>('desktop');
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [active, setActive] = useState('campanhas');
  const [tab, setTab] = useState('todas');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  /* Palco estreito (celular): só a moldura de celular, sem seletor. */
  const narrowStage = available < 760;
  const current: ShellDevice = narrowStage ? 'phone' : device;
  const frameWidth = Math.min(available, deviceWidth[current]);
  const drawerMode = current !== 'desktop';
  const phone = current === 'phone' || frameWidth < 640;
  /* Palco de notebook (< 1000): o desktop abre com o menu recolhido para a tabela caber inteira. */
  const tight = available < 1000;
  const [wasTight, setWasTight] = useState(tight);
  if (tight !== wasTight) {
    setWasTight(tight);
    if (tight) setCollapsed(true);
  }
  const crumbs = [{ label: 'Operação', onClick: () => undefined }, { label: 'Campanhas' }];
  return (
    <Shots>
      <Shot
        title="Em contexto"
        align="stretch"
        pad="sm"
        aside={
          narrowStage ? undefined : (
            <Segmented
              size="sm"
              label="Aparelho"
              value={device}
              onChange={(next) => {
                setDevice(next);
                setDrawer(false);
              }}
              options={[
                { value: 'desktop', label: 'Desktop' },
                { value: 'tablet', label: 'Tablet' },
                { value: 'phone', label: 'Celular' },
              ]}
            />
          )
        }
      >
        <div className={x.shellStage} ref={stageRef}>
          <div
            className={x.shellFrame}
            data-device={current}
            style={{ width: current === 'desktop' ? '100%' : `${deviceWidth[current]}px` }}
          >
            <AppShell
              fill
              contentAs="div"
              layout={drawerMode ? 'drawer' : 'desktop'}
              collapsed={collapsed}
              navOpen={drawer}
              onNavOpenChange={setDrawer}
              sidebar={
                <ShellSidebar
                  active={active}
                  onNavigate={(id) => {
                    setActive(id);
                    setDrawer(false);
                  }}
                />
              }
              topbar={
                <TopBar
                  breadcrumb={phone ? [{ label: 'Campanhas' }] : crumbs}
                  onToggleSidebar={drawerMode ? undefined : () => setCollapsed((value) => !value)}
                />
              }
            >
              <PageHeader
                title="Campanhas"
                description="17 de 17 campanhas do portal."
                actions={
                  <Button variant="primary" icon={Plus}>
                    Nova campanha
                  </Button>
                }
                toolbar={
                  <Tabs
                    label="Recortes de campanhas"
                    value={tab}
                    onChange={setTab}
                    items={[
                      { value: 'todas', label: 'Todas', count: 17 },
                      { value: 'veiculacao', label: 'Em veiculação', count: 6 },
                      { value: 'aprovacao', label: 'Em aprovação', count: 5 },
                      { value: 'rascunhos', label: 'Rascunhos', count: 2 },
                    ]}
                  />
                }
              />
              {phone ? (
                <CampaignCards page={page} onPageChange={setPage} />
              ) : (
                <DataTable
                  label="Campanhas"
                  rows={shellCampaigns}
                  rowKey={(row) => row.id}
                  columns={shellColumns}
                  density="compact"
                  selectable
                  selected={selected}
                  onSelectedChange={setSelected}
                  footer={
                    <Pagination
                      page={page}
                      pageSize={5}
                      total={17}
                      onPageChange={setPage}
                      noun="campanhas"
                    />
                  }
                />
              )}
            </AppShell>
          </div>
        </div>
      </Shot>
      <Shot title="Moldura fixa" align="stretch" pad="none">
        <div className={x.fixedStage}>
          <FixedFrame
            height={640}
            header={(narrow) => <FrameHeader current={2} close={narrow} compact={narrow} />}
            aside={<AsideSummary />}
            asideSummary="Resumo · R$ 18.000,00 · 27 dias"
            footer={(narrow) => <FrameFooter narrow={narrow} />}
          >
            <div className={x.stack} data-gap="xl">
              <Section title="Precificação">
                <div className={x.stack}>
                  <Field label="Verba planejada" required hint="Múltiplos de R$ 45,00">
                    {(props) => (
                      <Input
                        id={props.id}
                        aria-describedby={props.describedBy}
                        prefix="R$"
                        defaultValue="18.000,00"
                        inputMode="decimal"
                        className={x.moneyInput}
                      />
                    )}
                  </Field>
                  <DescriptionList
                    layout="strip"
                    items={[
                      { label: 'Por dia', value: '≈ 14.815 impressões', numeric: true },
                      { label: 'Com bônus', value: '≈ 480.000 impressões', numeric: true },
                      { label: 'Custo efetivo', value: 'R$ 35,63 por mil', numeric: true },
                    ]}
                  />
                </div>
              </Section>
              <Section title="Bônus" meta="2 de 3 liberados">
                <div className={x.bonusRow}>
                  <BonusCard
                    state="liberado"
                    title="+20% de impressões"
                    text="Impressões extras sem custo durante a feira."
                    foot={['Verba ≥ R$ 15.000,00']}
                  />
                  <BonusCard
                    state="bloqueado"
                    title="Destaque na newsletter"
                    text="Logo na newsletter diária dos credenciados."
                    foot={['Verba ≥ R$ 27.000,00', 'faltam R$ 9.000,00']}
                    progress={67}
                  />
                  <BonusCard
                    state="liberado"
                    title="Desconto de fidelidade"
                    text="5% de desconto a partir da terceira campanha."
                    foot={['A partir da 3ª campanha']}
                  />
                </div>
              </Section>
              <Section title="Condições">
                <DescriptionList
                  items={[
                    { label: 'Faturamento', value: 'Francal Feiras e Empreendimentos' },
                    { label: 'Pagamento', value: '30 dias após a veiculação' },
                    { label: 'Cancelamento', value: 'Sem custo até 72 h antes do início' },
                  ]}
                />
              </Section>
            </div>
          </FixedFrame>
        </div>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Registro ——————————————————————————— */

export const specimens: Record<string, ComponentType> = {
  shell: ShellSpecimen,
  'cabecalho-pagina': PageHeaders,
  card: Cards,
  secoes: Sections,
  accordion: Accordions,
  separador: Separators,
  scroll: Scrolls,
  paineis: Splits,
  descricao: Descriptions,
};
