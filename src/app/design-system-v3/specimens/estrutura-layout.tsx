'use client';

import { useState, type ComponentType, type ReactNode } from 'react';
import {
  ActionBar,
  AgentTrace,
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  DescriptionList,
  DiffView,
  EditableTitle,
  Grid,
  GridItem,
  IconButton,
  List,
  ListItem,
  MetaList,
  PageHeader,
  PromptComposer,
  Prose,
  ReadingColumn,
  Seal,
  Section,
  SuggestionCard,
  Tabs,
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
  ToolbarToggle,
  Tooltip,
  TranscriptViewer,
  WorkspaceLayout,
  WorkspaceToggle,
  type AgentTraceStep,
  type DiffBlock,
  type GridColumns,
  type PromptPreset,
  type SuggestionState,
  type TranscriptSegment,
  type TranscriptSpeaker,
  type WorkspaceLayoutProps,
} from '@content-ventures/design-system/v3';
import {
  Bold,
  Italic,
  Link2,
  Maximize2,
  Minimize2,
  Redo2,
  Sparkles,
  TextQuote,
  Undo2,
  WandSparkles,
} from '@content-ventures/design-system/v3/icons';
import { Note, Phone, Shot, Shots, State, States } from '../stage';
import l from './estrutura-layout.module.css';

/*
 * Estrutura · layout: `Grid` (colunas em proporção ou automáticas) e `WorkspaceLayout` (a moldura
 * dos estúdios). Contexto: Reporter IA — Marina Lopes transforma a entrevista com Clara Souto
 * (Aurora Calçados) em artigo; o estúdio é montado só com componentes da biblioteca.
 */

/* ——————————————————————————— Dados ——————————————————————————— */

const SPEAKERS = {
  marina: { id: 'marina', name: 'Marina Lopes' },
  clara: { id: 'clara', name: 'Clara Souto' },
  rafael: { id: 'rafael', name: 'Rafael Dias' },
} satisfies Record<string, TranscriptSpeaker>;

const SEGMENTS: TranscriptSegment[] = [
  {
    id: 't1',
    speaker: SPEAKERS.marina,
    start: 12_000,
    text: 'Como a Aurora chegou ao couro de cacto?',
  },
  {
    id: 't2',
    speaker: SPEAKERS.clara,
    start: 41_000,
    text: 'Testamos três fornecedores em 2025. Só um entregou a mesma cor em todos os lotes.',
  },
  {
    id: 't3',
    speaker: SPEAKERS.clara,
    start: 185_000,
    text: 'Não é mais tendência, é condição para exportar.',
  },
  {
    id: 't4',
    speaker: SPEAKERS.marina,
    start: 322_000,
    text: 'E quanto isso pesa para o lojista?',
  },
  {
    id: 't5',
    speaker: SPEAKERS.clara,
    start: 340_000,
    text: 'A diferença fica entre 4% e 7% por par, dependendo do modelo.',
  },
  {
    id: 't6',
    speaker: SPEAKERS.rafael,
    start: 490_000,
    text: 'No varejo ninguém pergunta o material. Perguntam a origem.',
  },
  {
    id: 't7',
    speaker: SPEAKERS.clara,
    start: 768_000,
    text: 'A meta é chegar a 30% do catálogo até o fim de 2027.',
  },
];

const USED = ['t2', 't3', 't5', 't7'];

const TRACE: AgentTraceStep[] = [
  { id: 'ler', label: 'Lendo material', state: 'done', meta: '42 falas · 3 falantes' },
  { id: 'falas', label: 'Selecionando falas-chave', state: 'done', meta: '8 trechos' },
  { id: 'estrutura', label: 'Montando estrutura', state: 'done', meta: '3 seções' },
  { id: 'escrever', label: 'Escrevendo seção 2 de 3', state: 'current', meta: 'há 12 s' },
  { id: 'citacoes', label: 'Conferindo citações', state: 'upcoming' },
];

const LEAD_DIFF: DiffBlock[] = [
  {
    id: 'lide',
    change: 'modified',
    hunks: [
      { kind: 'delete', text: 'Na abertura da feira, a Aurora Calçados apresentou' },
      {
        kind: 'insert',
        text: 'A Aurora Calçados quer 30% do catálogo em couro de cacto até 2027 e já mostra',
      },
      { kind: 'equal', text: ' a primeira linha feita inteiramente com o material.' },
    ],
  },
];

const PRESETS: PromptPreset[] = [
  { id: 'direto', label: 'Mais direto', prompt: 'Deixe o trecho selecionado mais direto.' },
  { id: 'intertitulos', label: 'Sugerir intertítulos', prompt: 'Sugira três intertítulos.' },
];

/* ——————————————————————————— Peças do estúdio ——————————————————————————— */

/** Falas da entrevista: busca, filtro de falante, trechos usados e ações sobre a seleção. */
function Transcript({ onActive }: { onActive: (id: string | null) => void }) {
  const [query, setQuery] = useState('');
  const [speaker, setSpeaker] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>('t3');
  return (
    <TranscriptViewer
      label="Transcrição da entrevista"
      segments={SEGMENTS}
      query={query}
      onQueryChange={setQuery}
      speakerFilter={speaker}
      onSpeakerFilterChange={setSpeaker}
      activeId={active}
      usedIds={USED}
      onSegmentClick={(segment) => {
        setActive(segment.id);
        onActive(segment.id);
      }}
      selectionActions={[
        { id: 'citar', label: 'Inserir citação', icon: TextQuote, onSelect: () => undefined },
        { id: 'contexto', label: 'Usar como contexto', icon: Sparkles, onSelect: () => undefined },
      ]}
      height="100%"
    />
  );
}

function SourceHeader() {
  const [tab, setTab] = useState<'transcricao' | 'estrutura' | 'versoes'>('transcricao');
  return (
    <Tabs
      label="Fonte"
      value={tab}
      onChange={setTab}
      items={[
        { value: 'transcricao', label: 'Transcrição' },
        { value: 'estrutura', label: 'Estrutura' },
        { value: 'versoes', label: 'Versões' },
      ]}
    />
  );
}

function CopilotHeader() {
  const [tab, setTab] = useState<'ia' | 'checagem'>('ia');
  return (
    <Tabs
      label="Copiloto"
      value={tab}
      onChange={setTab}
      items={[
        { value: 'ia', label: 'IA' },
        { value: 'checagem', label: 'Checagem', count: 2 },
      ]}
    />
  );
}

function Copilot() {
  const [state, setState] = useState<SuggestionState>('ready');
  return (
    <div className={l.stack}>
      <AgentTrace label="Gerando o artigo" steps={TRACE} announce={false} />
      <SuggestionCard
        title="Reescrever · lide mais direto"
        provenance={['Simulação local', { value: '3 s', numeric: true }]}
        diff={LEAD_DIFF}
        state={state}
        onAccept={() => setState('applied')}
        onDiscard={() => setState('discarded')}
        onRetry={() => setState('ready')}
      />
    </div>
  );
}

function Composer() {
  const [value, setValue] = useState('');
  return (
    <PromptComposer
      value={value}
      onChange={setValue}
      onSubmit={() => setValue('')}
      presets={PRESETS}
      placeholder="Peça um ajuste ao texto"
      minRows={1}
    />
  );
}

function EditorBar() {
  const [marks, setMarks] = useState({ bold: false, italic: false });
  return (
    <Toolbar label="Formatação" keepFocus>
      <ToolbarGroup label="Histórico">
        <ToolbarButton label="Desfazer" icon={Undo2} shortcut="⌘Z" keep />
        <ToolbarButton label="Refazer" icon={Redo2} shortcut="⇧⌘Z" keep />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup label="Marcas do texto">
        <ToolbarToggle
          label="Negrito"
          icon={Bold}
          shortcut="⌘B"
          pressed={marks.bold}
          onPressedChange={(bold) => setMarks((m) => ({ ...m, bold }))}
        />
        <ToolbarToggle
          label="Itálico"
          icon={Italic}
          shortcut="⌘I"
          pressed={marks.italic}
          onPressedChange={(italic) => setMarks((m) => ({ ...m, italic }))}
        />
        <ToolbarButton
          label="Inserir link"
          icon={Link2}
          shortcut="⌘K"
          disabled
          disabledReason="Selecione um trecho para criar link"
        />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarButton label="Reescrever" icon={WandSparkles} showLabel />
    </Toolbar>
  );
}

function Article({ active }: { active: string | null }) {
  const [title, setTitle] = useState(
    'Couro vegetal sai do nicho e chega às vitrines da Francal 2026',
  );
  return (
    <Prose
      variant="edit"
      label="Artigo"
      as="article"
      header={
        <EditableTitle
          value={title}
          onCommit={setTitle}
          label="Título do artigo"
          size="document"
          maxLength={90}
        />
      }
    >
      <p data-lead="">
        Fabricantes de médio porte dobram a produção e usam a rastreabilidade para vender ao varejo
        europeu.
      </p>
      <p>
        <span data-source-active={active === 't7' || undefined}>
          Na abertura da feira, a Aurora Calçados apresentou a primeira linha feita inteiramente com
          couro de cacto. Segundo Clara Souto, diretora de produto, a meta é chegar a 30% do
          catálogo até o fim de 2027.
        </span>
      </p>
      <h2>Rastreabilidade vira argumento de venda</h2>
      <p data-ai="unreviewed">
        Compradores querem saber de onde vem cada peça. O selo de origem já é exigência em contratos
        com redes da Alemanha e da Holanda, e quem não comprova a cadeia perde o pedido.
      </p>
      <blockquote>
        <p>
          <span data-source-active={active === 't3' || undefined}>
            Não é mais tendência, é condição para exportar.
          </span>
        </p>
      </blockquote>
      <p>
        <span data-source-active={active === 't5' || undefined}>
          Para o varejo, a troca pesa pouco no preço final: a diferença fica entre 4% e 7% por par.
        </span>
      </p>
    </Prose>
  );
}

function StatusLine() {
  return (
    <MetaList
      size="xs"
      label="Indicadores do texto"
      items={[
        { value: '812 palavras', numeric: true },
        { value: '4 min de leitura', numeric: true },
        { value: '3 de 4 citações conferidas', numeric: true },
      ]}
    />
  );
}

/** O estúdio do artigo inteiro: o mesmo componente no desktop e no celular (abas). */
function ArticleStudio({
  height = 680,
  storageKey,
}: {
  height?: number | string;
  storageKey?: string;
}) {
  const [focus, setFocus] = useState(false);
  const [active, setActive] = useState<string | null>('t3');
  return (
    <WorkspaceLayout
      height={height}
      storageKey={storageKey}
      mainLabel="Texto"
      focus={focus}
      onFocusChange={setFocus}
      header={(narrow) => (
        <PageHeader
          variant="frame"
          titleAs="h2"
          title="Entrevista com Clara Souto"
          status={
            <Badge variant="text" tone="gray" dot>
              Rascunho
            </Badge>
          }
          meta={narrow ? ['v3'] : ['Aurora Calçados', 'v3', 'Salvo há 2 min']}
          actions={
            narrow ? (
              <Button variant="primary" size="sm">
                Enviar
              </Button>
            ) : (
              <>
                <Button variant="primary" size="sm">
                  Enviar para aprovação
                </Button>
                <WorkspaceToggle side="start" />
                <Tooltip
                  content={focus ? 'Sair do modo foco' : 'Entrar no modo foco'}
                  shortcut={focus ? 'Esc' : undefined}
                >
                  <IconButton
                    variant="ghost"
                    size="sm"
                    icon={focus ? Minimize2 : Maximize2}
                    label={focus ? 'Sair do modo foco' : 'Entrar no modo foco'}
                    aria-pressed={focus}
                    onClick={() => setFocus((on) => !on)}
                  />
                </Tooltip>
                <WorkspaceToggle side="end" />
              </>
            )
          }
        />
      )}
      start={{
        label: 'Fonte',
        defaultSize: 300,
        min: 240,
        max: 440,
        header: <SourceHeader />,
        content: <Transcript onActive={setActive} />,
        scroll: false,
      }}
      end={{
        label: 'Copiloto',
        defaultSize: 340,
        min: 300,
        max: 520,
        header: <CopilotHeader />,
        content: <Copilot />,
        footer: <Composer />,
      }}
      mainHeader={<EditorBar />}
      mainFooter={<StatusLine />}
    >
      <Article active={active} />
    </WorkspaceLayout>
  );
}

/* ——————————————————————————— Miniaturas (variantes e estados) ——————————————————————————— */

function Block({ children }: { children: ReactNode }) {
  return <div className={l.block}>{children}</div>;
}

function MiniStudio(props: Partial<WorkspaceLayoutProps>) {
  return (
    <div className={l.mini}>
      <WorkspaceLayout
        height={260}
        narrowBelow={0}
        mainMin={120}
        mainLabel="Texto"
        start={{
          label: 'Fonte',
          defaultSize: 132,
          min: 112,
          max: 200,
          content: <Block>Falas</Block>,
        }}
        end={{
          label: 'Copiloto',
          defaultSize: 132,
          min: 112,
          max: 200,
          content: <Block>IA</Block>,
        }}
        {...props}
      >
        <Block>Artigo</Block>
      </WorkspaceLayout>
    </div>
  );
}

/* ——————————————————————————— WorkspaceLayout ——————————————————————————— */

function WorkspaceSpecimen() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="none">
        <ArticleStudio storageKey="dsv3-estudio-artigo" />
      </Shot>

      <Shot title="Variantes" tone="white" align="stretch" pad="lg">
        <States min={300}>
          <State label="Fonte recolhida">
            <MiniStudio
              start={{
                label: 'Fonte',
                defaultSize: 132,
                min: 112,
                max: 200,
                defaultCollapsed: true,
                content: <Block>Falas</Block>,
              }}
            />
          </State>
          <State label="Modo foco">
            <MiniStudio focus />
          </State>
          <State label="Só painel de fim">
            <MiniStudio start={undefined} />
          </State>
          <State label="Com rodapé" span={2}>
            <MiniStudio
              end={undefined}
              footer={
                <ActionBar position="static" status="saved" statusLabel="Salvo">
                  <Button variant="primary" size="sm">
                    Aprovar
                  </Button>
                </ActionBar>
              }
            />
          </State>
        </States>
      </Shot>

      <Shot title="Estados" tone="white" align="stretch" pad="lg">
        <States min={300}>
          <State label="Repouso">
            <MiniStudio end={undefined} />
          </State>
          <State label="Hover na alça">
            <MiniStudio end={undefined} force="hover" />
          </State>
          <State label="Arrastando">
            <MiniStudio end={undefined} force="active" />
          </State>
          <State label="Foco na alça">
            <MiniStudio end={undefined} force="focus" />
          </State>
          <State label="Recolhido">
            <MiniStudio
              end={undefined}
              start={{
                label: 'Fonte',
                defaultCollapsed: true,
                min: 112,
                content: <Block>Falas</Block>,
              }}
            />
          </State>
          <State label="Estreito">
            <MiniStudio narrowBelow={4000} />
          </State>
          <State label="Tela única, estreita (sem abas)">
            <MiniStudio narrowBelow={4000} start={undefined} end={undefined} mainLabel="Material" />
          </State>
        </States>
      </Shot>

      <Shot title="Celular" tone="canvas" align="center" pad="lg">
        <Phone height={720} label="Celular, 390">
          <ArticleStudio height="100%" />
        </Phone>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Grid ——————————————————————————— */

const WAITING = [
  { id: 'w1', title: 'Entrevista com Clara Souto', who: 'Rafael Dias', when: 'há 2 h' },
  { id: 'w2', title: 'Painel sobre varejo de calçados', who: 'Juliana Prates', when: 'há 5 h' },
  { id: 'w3', title: 'Podcast Couro Nobre, episódio 12', who: 'Tiago Rezende', when: 'ontem' },
];

const TEMPLATES = [
  { id: 'm1', title: 'Capa e citação', meta: ['5 slides', '4:5'] },
  { id: 'm2', title: 'Dados em destaque', meta: ['6 slides', '4:5'] },
  { id: 'm3', title: 'Linha do tempo', meta: ['7 slides', '4:5'] },
  { id: 'm4', title: 'Perguntas e respostas', meta: ['5 slides', '1:1'] },
];

function Dashboard() {
  return (
    <div className={l.page}>
      <Grid columns="2:1" label="Hoje">
        <Section
          variant="panel"
          title="Continue de onde parou"
          action={
            <Button variant="primary" size="sm">
              Continuar artigo
            </Button>
          }
        >
          <DescriptionList
            labelWidth={168}
            items={[
              { label: 'Produção', value: 'Entrevista com Clara Souto' },
              { label: 'Etapa', value: 'Artigo · v3' },
              { label: 'Extensão', value: '812 de 800 palavras', numeric: true },
              { label: 'Citações conferidas', value: '3 de 4', numeric: true },
            ]}
          />
        </Section>
        <Section variant="panel" title="Aguardando você">
          <List label="Aguardando aprovação" framed={false}>
            {WAITING.map((item) => (
              <ListItem
                key={item.id}
                density="sm"
                leading={<Avatar name={item.who} size="sm" decorative />}
                title={item.title}
                description={`${item.who} · ${item.when}`}
                onClick={() => undefined}
              />
            ))}
          </List>
        </Section>
      </Grid>
      <Grid columns="auto" min={220} as="ul" label="Modelos de carrossel">
        {TEMPLATES.map((item) => (
          <Card key={item.id} as="article" padding="md">
            <CardHeader title={item.title} />
            <MetaList size="xs" items={item.meta} />
          </Card>
        ))}
      </Grid>
    </div>
  );
}

const RATIOS: { columns: GridColumns; cells: string[] }[] = [
  { columns: '1:1', cells: ['1', '1'] },
  { columns: '2:1', cells: ['2', '1'] },
  { columns: '1:2', cells: ['1', '2'] },
  { columns: '3:2', cells: ['3', '2'] },
  { columns: '1:1:1', cells: ['1', '1', '1'] },
  { columns: 'auto', cells: ['196', '196', '196', '196', '196'] },
];

function GridSpecimen() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="lg">
        <Dashboard />
      </Shot>

      <Shot title="Proporções" tone="white" align="stretch" pad="lg">
        <div className={l.rows}>
          {RATIOS.map((row) => (
            <div key={row.columns} className={l.ratioRow}>
              <Note>{row.columns}</Note>
              <Grid columns={row.columns} collapseBelow={false}>
                {row.cells.map((cell, index) => (
                  <Block key={index}>{cell}</Block>
                ))}
              </Grid>
            </div>
          ))}
        </div>
      </Shot>

      <Shot title="Vão e linha inteira" tone="white" align="stretch" pad="lg">
        <States min={300}>
          <State label="Vão 8 (sm)">
            <Grid columns="1:1:1" gap="sm" collapseBelow={false}>
              <Block>1</Block>
              <Block>2</Block>
              <Block>3</Block>
            </Grid>
          </State>
          <State label="Vão 16 (md)">
            <Grid columns="1:1:1" collapseBelow={false}>
              <Block>1</Block>
              <Block>2</Block>
              <Block>3</Block>
            </Grid>
          </State>
          <State label="Item na linha inteira">
            <Grid columns="1:1:1" collapseBelow={false}>
              <GridItem span="full">
                <Block>full</Block>
              </GridItem>
              <GridItem span={2}>
                <Block>2</Block>
              </GridItem>
              <Block>1</Block>
            </Grid>
          </State>
        </States>
      </Shot>

      <Shot title="Celular" tone="canvas" align="center" pad="lg">
        <Phone label="Celular, 390">
          <div className={l.phonePage}>
            <Dashboard />
          </div>
        </Phone>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Coluna de leitura ——————————————————————————— */

/** A revisão de um artigo: decisão, aviso e texto na mesma borda, centrados na área. */
function ReviewColumn({
  align = 'center',
  diff = false,
}: {
  align?: 'center' | 'start';
  diff?: boolean;
}) {
  return (
    <ReadingColumn align={align} label="Texto da versão 4">
      <List label="Decisão" framed={false} dividers={false}>
        <ListItem
          leading={<Seal label="" size="lg" still />}
          title="Versão 4 aprovada"
          description={<MetaList size="sm" items={['Pedro Alves', 'há 2 h']} />}
        />
      </List>
      <Alert tone="warning" title="O carrossel usa a versão 3" />
      {diff ? (
        <DiffView blocks={LEAD_DIFF} before={{ label: 'v3 · IA' }} after={{ label: 'v4' }} />
      ) : (
        <Prose
          variant="read"
          as="section"
          label="Texto final"
          header={
            <EditableTitle
              value="Couro vegetal sai do nicho e chega às vitrines da Francal 2026"
              onCommit={() => undefined}
              label="Título do artigo"
              size="document"
              readOnly
            />
          }
        >
          <p>
            Na abertura da feira, a Aurora Calçados apresentou a primeira linha feita inteiramente
            com couro de cacto. A meta é chegar a 30% do catálogo até o fim de 2027.
          </p>
        </Prose>
      )}
    </ReadingColumn>
  );
}

function ReadingColumnSpecimen() {
  return (
    <Shots>
      <Shot title="Centrada" tone="white" align="stretch" pad="lg">
        <ReviewColumn />
      </Shot>
      <Shot title="Diferenças" tone="white" align="stretch" pad="lg">
        <ReviewColumn diff />
      </Shot>
      <Shot title="Encostada no início" tone="white" align="stretch" pad="lg">
        <ReviewColumn align="start" />
      </Shot>
      <Shot title="Celular" tone="canvas" align="center" pad="lg">
        <Phone label="Celular, 390">
          <div className={l.phonePage}>
            <ReviewColumn />
          </div>
        </Phone>
      </Shot>
    </Shots>
  );
}

export const specimens: Record<string, ComponentType> = {
  grade: GridSpecimen,
  'area-de-trabalho': WorkspaceSpecimen,
  'coluna-de-leitura': ReadingColumnSpecimen,
};
