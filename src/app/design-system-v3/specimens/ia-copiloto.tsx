'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import {
  AgentTrace,
  Button,
  Conversation,
  ConversationArtifact,
  ConversationTurn,
  EmptyState,
  IconButton,
  PromptComposer,
  PromptModelMenu,
  SourceChip,
  SuggestionCard,
  Tooltip,
  type AgentTraceStep,
  type DiffBlock,
  type PromptComposerProps,
  type PromptModelOption,
  type PromptPreset,
  type PromptStatus,
  type SourceKind,
  type SuggestionState,
  type TurnFeedback,
  type TurnStatus,
} from '@content-ventures/design-system/v3';
import {
  AtSign,
  GitCompareArrows,
  History as HistoryIcon,
  Paperclip,
  Sparkles,
} from '@content-ventures/design-system/v3/icons';
import { Phone, Shot, Shots, State, States } from '../stage';
import c from './ia-copiloto.module.css';

/*
 * IA (copiloto): `PromptComposer`, `Conversation` e `ConversationTurn`, compostos como no estúdio:
 * turno da IA = `AgentTrace` (passos) + texto + `SuggestionCard` (proposta); contexto do pedido em
 * `SourceChip`.
 * Contexto: Reporter IA — Marina Lopes transforma a entrevista com Clara Souto (Aurora Calçados)
 * num artigo e pede ajustes ao copiloto. Tudo é simulação local; nenhum modelo é chamado.
 */

/* ——— Dados ——— */

const PRESETS: PromptPreset[] = [
  {
    id: 'direto',
    label: 'Mais direto',
    prompt: 'Deixe o trecho selecionado mais direto, sem perder as citações.',
  },
  {
    id: 'intertitulos',
    label: 'Sugerir intertítulos',
    prompt: 'Sugira três intertítulos para o artigo.',
  },
  {
    id: 'encurtar',
    label: 'Encurtar para 600 palavras',
    prompt: 'Encurte o artigo para 600 palavras e mantenha as falas da Clara Souto.',
  },
];

const MODELS: PromptModelOption[] = [
  { value: 'local', label: 'Simulação local', description: 'Respostas de exemplo, sem custo' },
  { value: 'rapido', label: 'Modelo rápido', description: 'Em breve', disabled: true },
  { value: 'preciso', label: 'Modelo preciso', description: 'Em breve', disabled: true },
];

type ContextItem = { id: string; kind: SourceKind; label: string; meta: string };

const CONTEXT: ContextItem[] = [
  { id: 'selecao', kind: 'quote', label: 'Seleção', meta: '§3' },
  { id: 'trecho', kind: 'excerpt', label: 'Trecho 12:48', meta: 'Clara Souto' },
];

const DRAFT_STEPS: AgentTraceStep[] = [
  { id: 'ler', label: 'Lendo material', state: 'done', meta: '42 falas' },
  { id: 'falas', label: 'Selecionando falas-chave', state: 'done', meta: '5 trechos' },
  { id: 'estrutura', label: 'Montando estrutura', state: 'done', meta: '4 seções' },
  { id: 'texto', label: 'Escrevendo o texto', state: 'done', meta: '812 palavras' },
];

const REWRITE_STEPS = ['Lendo a seleção', 'Reescrevendo', 'Conferindo citações'];

const ANSWER =
  'Cortei a contextualização da feira e abri com o dado principal: a Aurora Calçados quer 30% do catálogo em couro de cacto até 2027. A introdução caiu de 86 para 54 palavras.';

const ANSWERS: Record<string, string> = {
  direto: ANSWER,
  intertitulos:
    'Três opções, na ordem do texto: “Rastreabilidade vira argumento de venda”, “O que muda para o lojista” e “A conta do couro de cacto”.',
  encurtar:
    'Cheguei a 604 palavras: juntei as duas seções sobre exportação e tirei a lista de expositores. As cinco falas da Clara Souto continuam.',
};

/** Proposta que acompanha cada resposta (o texto do turno explica; o cartão aplica). */
type Proposal = {
  title: string;
  diff?: DiffBlock[];
  proposal?: string;
  mode?: 'replace' | 'insert';
};

const PROPOSALS: Record<string, Proposal> = {
  direto: {
    title: 'Reescrever · mais direto',
    diff: [
      {
        id: 'intro',
        change: 'modified',
        hunks: [
          {
            kind: 'delete',
            text: 'Entre os 1.200 expositores da Francal 2026, um assunto dominou os corredores: ',
          },
          {
            kind: 'insert',
            text: 'A Aurora Calçados quer 30% do catálogo em couro de cacto até 2027. ',
          },
          { kind: 'equal', text: 'A rastreabilidade virou argumento de venda' },
          { kind: 'delete', text: ' para quem pretende exportar.' },
          { kind: 'insert', text: ' e condição para exportar.' },
        ],
      },
    ],
  },
  intertitulos: {
    title: 'Sugerir intertítulos',
    mode: 'insert',
    proposal:
      'Rastreabilidade vira argumento de venda · O que muda para o lojista · A conta do couro de cacto',
  },
  encurtar: {
    title: 'Encurtar para 600 palavras',
    proposal:
      'Versão com 604 palavras: seções de exportação unidas, lista de expositores removida.',
  },
};

/** Passos do rastro conforme a fração do texto que já chegou. */
function stepsAt(progress: number, status: TurnStatus): AgentTraceStep[] {
  const current = status === 'done' ? REWRITE_STEPS.length : Math.min(2, Math.floor(progress * 3));
  // Interrompida: o passo em curso volta a “por fazer” (nada gira parado).
  const running = status === 'streaming';
  return REWRITE_STEPS.map((label, index) => ({
    id: `passo-${index}`,
    label,
    state: index < current ? 'done' : index === current && running ? 'current' : 'upcoming',
    meta: index === 0 ? '86 palavras' : index === 2 ? '1 de 1' : undefined,
  }));
}

type UserTurn = { id: string; role: 'user'; text: string; context: ContextItem[] };
type NoteTurn = { id: string; role: 'system-note'; text: string; meta: string };
type AiTurn = {
  id: string;
  role: 'assistant';
  answer: string;
  /** Palavras que já chegaram. */
  shown: number;
  status: TurnStatus;
  seconds: number;
  draft?: boolean;
  /** Chave de `PROPOSALS`. */
  proposal?: string;
  feedback: TurnFeedback | null;
};
type Turn = UserTurn | NoteTurn | AiTurn;

const words = (text: string) => text.split(' ');

const INITIAL: Turn[] = [
  {
    id: 'v1',
    role: 'assistant',
    answer: 'Pronto. O rascunho tem 4 seções e 5 falas da Clara Souto.',
    shown: Infinity,
    status: 'done',
    seconds: 38,
    draft: true,
    feedback: null,
  },
  { id: 'salvo', role: 'system-note', text: 'Rascunho v1 salvo', meta: '14:02' },
  {
    id: 'pedido',
    role: 'user',
    text: 'Deixe a introdução mais direta',
    context: [{ id: 'selecao-1', kind: 'quote', label: 'Seleção', meta: '§1' }],
  },
  {
    id: 'resposta',
    role: 'assistant',
    answer: ANSWER,
    shown: 0,
    status: 'streaming',
    seconds: 12,
    proposal: 'direto',
    feedback: null,
  },
];

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ——— Peças da prancha ——— */

function ContextChips({
  items,
  onRemove,
}: {
  items: ContextItem[];
  onRemove?: (id: string) => void;
}) {
  return items.map((item) => (
    <SourceChip
      key={item.id}
      kind={item.kind}
      label={item.label}
      meta={item.meta}
      state="selected"
      onRemove={onRemove ? () => onRemove(item.id) : undefined}
    />
  ));
}

function Tools() {
  return (
    <>
      <Tooltip content="Anexar arquivo">
        <IconButton label="Anexar arquivo" icon={Paperclip} variant="ghost" size="sm" />
      </Tooltip>
      <Tooltip content="Citar trecho da transcrição">
        <IconButton label="Citar trecho da transcrição" icon={AtSign} variant="ghost" size="sm" />
      </Tooltip>
    </>
  );
}

function Model({ force }: { force?: string }) {
  const [model, setModel] = useState('local');
  return <PromptModelMenu value={model} options={MODELS} onChange={setModel} data-force={force} />;
}

function Draft() {
  return (
    <ConversationArtifact
      title="Rascunho v1"
      meta="812 palavras · 4 min de leitura"
      onOpen={() => undefined}
      actions={
        <>
          <Button size="sm" variant="ghost" icon={GitCompareArrows}>
            Ver diferenças
          </Button>
          <Button size="sm" variant="secondary" icon={HistoryIcon}>
            Restaurar
          </Button>
        </>
      }
    />
  );
}

/** Turno da IA desenhado a partir do estado da simulação. */
function AiTurnView({
  turn,
  onRetry,
  onContinue,
  onFeedback,
}: {
  turn: AiTurn;
  onRetry?: () => void;
  onContinue?: () => void;
  onFeedback?: (value: TurnFeedback | null) => void;
}) {
  const all = words(turn.answer);
  const text = all.slice(0, turn.shown).join(' ');
  const progress = Math.min(1, turn.shown / all.length);
  const streaming = turn.status === 'streaming';
  const proposal = turn.proposal ? PROPOSALS[turn.proposal] : undefined;
  const seconds = streaming ? Math.max(1, Math.round(turn.seconds * progress)) : turn.seconds;
  return (
    <ConversationTurn
      role="assistant"
      meta={`Simulação local · ${seconds} s`}
      status={turn.status}
      copyText={text}
      onRetry={onRetry}
      onContinue={onContinue}
      feedback={turn.feedback}
      onFeedback={onFeedback}
    >
      <AgentTrace
        label={turn.draft ? 'Gerando o rascunho' : 'Ajustando o texto'}
        steps={turn.draft ? DRAFT_STEPS : stepsAt(progress, turn.status)}
        status={turn.status === 'stopped' ? 'stopped' : undefined}
        summary={turn.status === 'done' ? `Concluído em ${turn.seconds} s` : undefined}
        defaultCollapsed={turn.draft}
        announce={!turn.draft}
      />
      {/* `data-caret`: o cursor de chegada fica no fim deste parágrafo, não na proposta. */}
      {text && <p data-caret="">{text}</p>}
      {proposal && (turn.status === 'streaming' || turn.status === 'done') && (
        <TurnProposal key={turn.id} proposal={proposal} streaming={streaming} />
      )}
      {turn.draft && <Draft />}
    </ConversationTurn>
  );
}

/**
 * Proposta do turno: aceitar ou descartar muda só o cartão (o texto do artigo é do editor). Voto e
 * “Gerar de novo” ficam no turno; o cartão não os repete.
 */
function TurnProposal({ proposal, streaming }: { proposal: Proposal; streaming: boolean }) {
  const [decision, setDecision] = useState<SuggestionState>('ready');
  const apply = () => setDecision('applied');
  return (
    <SuggestionCard
      title={proposal.title}
      provenance={['Simulação local']}
      diff={streaming ? undefined : proposal.diff}
      proposal={streaming ? undefined : proposal.proposal}
      mode={proposal.mode}
      state={streaming ? 'streaming' : decision}
      onAccept={proposal.mode === 'insert' ? undefined : apply}
      onInsert={proposal.mode === 'insert' ? apply : undefined}
      onDiscard={() => setDecision('discarded')}
    />
  );
}

/* ——— Copiloto vivo ——— */

function Copilot({ height = 680, bare = false }: { height?: number; bare?: boolean }) {
  const [turns, setTurns] = useState<Turn[]>(INITIAL);
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<PromptStatus>('idle');
  const [context, setContext] = useState<ContextItem[]>(CONTEXT);
  const timer = useRef<number | undefined>(undefined);

  function patch(id: string, change: Partial<AiTurn>) {
    setTurns((list) =>
      list.map((turn) =>
        turn.id === id && turn.role === 'assistant' ? { ...turn, ...change } : turn,
      ),
    );
  }

  function stream(id: string, from: number, total: number) {
    window.clearInterval(timer.current);
    setStatus('streaming');
    patch(id, { status: 'streaming', shown: from });
    let shown = from;
    const step = reduced() ? total : 1;
    timer.current = window.setInterval(
      () => {
        shown = Math.min(total, shown + step);
        const done = shown >= total;
        patch(id, { shown, status: done ? 'done' : 'streaming' });
        if (done) {
          window.clearInterval(timer.current);
          setStatus('idle');
        }
      },
      reduced() ? 400 : 90,
    );
  }

  useEffect(() => {
    stream('resposta', 0, words(ANSWER).length);
    return () => window.clearInterval(timer.current);
    // A primeira resposta chega sozinha ao abrir a prancha.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stop() {
    window.clearInterval(timer.current);
    setStatus('idle');
    setTurns((list) =>
      list.map((turn) =>
        turn.role === 'assistant' && turn.status === 'streaming'
          ? { ...turn, status: 'stopped' }
          : turn,
      ),
    );
  }

  function submit(text: string, presetId?: string) {
    const id = `t${Date.now()}`;
    const key = presetId ?? PRESETS.find((preset) => preset.prompt === text)?.id ?? '';
    const answer =
      ANSWERS[key] ??
      'Feito. A mudança está na sugestão abaixo; nada muda no texto até você aceitar.';
    setTurns((list) => [...list, { id: `${id}-u`, role: 'user', text, context }]);
    setValue('');
    setContext([]);
    setStatus('submitting');
    window.clearInterval(timer.current);
    timer.current = window.setTimeout(() => {
      setTurns((list) => [
        ...list,
        {
          id,
          role: 'assistant',
          answer,
          shown: 0,
          status: 'streaming',
          seconds: 9,
          proposal: PROPOSALS[key] ? key : 'direto',
          feedback: null,
        },
      ]);
      stream(id, 0, words(answer).length);
    }, 500);
  }

  return (
    <div className={c.pane} data-bare={bare || undefined} style={{ height }}>
      <div className={c.paneHead}>
        <Sparkles aria-hidden="true" className={c.paneIcon} />
        Copiloto
      </div>
      <Conversation
        className={c.paneBody}
        label="Conversa com o copiloto"
        footer={
          <PromptComposer
            value={value}
            onChange={setValue}
            onSubmit={({ text, presetId }) => submit(text, presetId)}
            status={status}
            onStop={stop}
            presets={PRESETS}
            context={
              context.length > 0 ? (
                <ContextChips
                  items={context}
                  onRemove={(id) => setContext((list) => list.filter((item) => item.id !== id))}
                />
              ) : undefined
            }
            tools={<Tools />}
            model={<Model />}
            maxLength={2000}
          />
        }
      >
        {turns.map((turn) => {
          if (turn.role === 'user')
            return (
              <ConversationTurn
                key={turn.id}
                role="user"
                context={
                  turn.context.length > 0 ? <ContextChips items={turn.context} /> : undefined
                }
              >
                {turn.text}
              </ConversationTurn>
            );
          if (turn.role === 'system-note')
            return (
              <ConversationTurn
                key={turn.id}
                role="system-note"
                icon={HistoryIcon}
                meta={turn.meta}
              >
                {turn.text}
              </ConversationTurn>
            );
          const total = words(turn.answer).length;
          return (
            <AiTurnView
              key={turn.id}
              turn={turn}
              onRetry={status === 'idle' ? () => stream(turn.id, 0, total) : undefined}
              onContinue={status === 'idle' ? () => stream(turn.id, turn.shown, total) : undefined}
              onFeedback={(feedback) => patch(turn.id, { feedback })}
            />
          );
        })}
      </Conversation>
    </div>
  );
}

/* ——— Compositor parado (estados e variantes) ——— */

function Still(props: Partial<PromptComposerProps> & { initial?: string }) {
  const { initial = '', ...rest } = props;
  const [value, setValue] = useState(initial);
  return (
    <PromptComposer
      value={value}
      onChange={setValue}
      onSubmit={() => undefined}
      onStop={() => undefined}
      {...rest}
    />
  );
}

const FILLED = 'Deixe a introdução mais direta, sem perder a fala da Clara Souto.';
const LONG =
  'Reescreva a introdução para abrir com o dado da Aurora Calçados (30% do catálogo em couro de cacto até 2027), cite a Clara Souto logo no segundo parágrafo e corte a contextualização sobre a história da feira, que já aparece na seção seguinte. Mantenha o tom informativo.';

function ComposerPage() {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<PromptStatus>('idle');
  const [context, setContext] = useState<ContextItem[]>(CONTEXT);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  function send() {
    setValue('');
    setStatus('submitting');
    timer.current = window.setTimeout(() => {
      setStatus('streaming');
      timer.current = window.setTimeout(() => setStatus('idle'), 2600);
    }, 500);
  }

  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="center">
        <div className={c.column}>
          <PromptComposer
            value={value}
            onChange={setValue}
            onSubmit={send}
            status={status}
            onStop={() => {
              window.clearTimeout(timer.current);
              setStatus('idle');
            }}
            presets={PRESETS}
            context={
              context.length > 0 ? (
                <ContextChips
                  items={context}
                  onRemove={(id) => setContext((list) => list.filter((item) => item.id !== id))}
                />
              ) : undefined
            }
            tools={<Tools />}
            model={<Model />}
            maxLength={2000}
          />
        </div>
      </Shot>

      <Shot title="Variantes" tone="white" align="stretch">
        <States min={300}>
          <State label="Mínimo">
            <Still />
          </State>
          <State label="⌘↵ envia">
            <Still submitKey="mod-enter" initial={FILLED} tools={<Tools />} />
          </State>
          <State label="Perto do limite">
            <Still maxLength={280} initial={LONG} model={<Model />} />
          </State>
        </States>
      </Shot>

      <Shot title="Estados" tone="white" align="stretch">
        <States min={300}>
          <State label="Repouso">
            <Still model={<Model />} />
          </State>
          <State label="Hover">
            <Still model={<Model />} data-force="hover" />
          </State>
          <State label="Foco">
            <Still model={<Model />} data-force="focus" />
          </State>
          <State label="Preenchido">
            <Still model={<Model />} initial={FILLED} context={<ContextChips items={CONTEXT} />} />
          </State>
          <State label="Enviando">
            <Still model={<Model />} initial={FILLED} status="submitting" />
          </State>
          <State label="Gerando">
            <Still model={<Model />} status="streaming" />
          </State>
          <State label="Erro">
            <Still
              model={<Model />}
              initial={FILLED}
              status="error"
              error="Não foi possível gerar a resposta."
              onRetry={() => undefined}
            />
          </State>
          <State label="Acima do limite">
            <Still model={<Model />} maxLength={240} initial={LONG} />
          </State>
          <State label="Indisponível">
            <Still model={<Model />} disabled />
          </State>
        </States>
      </Shot>

      <Shot title="Modelo" tone="white" align="stretch">
        <States min={160} align="center">
          {(['Repouso', 'Hover', 'Pressionado', 'Foco'] as const).map((label, index) => (
            <State key={label} label={label}>
              <Model force={[undefined, 'hover', 'active', 'focus'][index]} />
            </State>
          ))}
        </States>
      </Shot>

      <Shot title="Celular" align="center" pad="md">
        <Phone label="Celular, 390">
          <div className={c.phoneBody}>
            <Still
              presets={PRESETS}
              context={<ContextChips items={CONTEXT} onRemove={() => undefined} />}
              tools={<Tools />}
              model={<Model />}
            />
          </div>
        </Phone>
      </Shot>
    </Shots>
  );
}

/* ——— Conversa ——— */

const STREAM_TURN: AiTurn = {
  id: 'parado',
  role: 'assistant',
  answer: ANSWER,
  shown: 18,
  status: 'streaming',
  seconds: 12,
  proposal: 'direto',
  feedback: null,
};

function ConversationPage() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="center">
        <Copilot />
      </Shot>

      <Shot title="Turnos" tone="white" align="stretch">
        <div className={c.thread}>
          <ConversationTurn role="user" context={<ContextChips items={CONTEXT} />}>
            Use a fala das 12:48 para fechar a terceira seção.
          </ConversationTurn>
          <ConversationTurn
            role="assistant"
            meta="Simulação local · 7 s"
            copyText="Fechei a seção com a fala da Clara Souto."
            onRetry={() => undefined}
            onFeedback={() => undefined}
          >
            Fechei a seção com a fala da Clara Souto: “Não é mais tendência, é condição para
            exportar.”
          </ConversationTurn>
          <ConversationTurn role="system-note" icon={HistoryIcon} meta="14:02">
            Rascunho v1 salvo
          </ConversationTurn>
          <Draft />
        </div>
      </Shot>

      <Shot title="Estados" tone="white" align="stretch">
        <States min={320}>
          <State label="Gerando">
            <AiTurnView turn={STREAM_TURN} />
          </State>
          <State label="Interrompida">
            <AiTurnView
              turn={{ ...STREAM_TURN, status: 'stopped' }}
              onRetry={() => undefined}
              onContinue={() => undefined}
              onFeedback={() => undefined}
            />
          </State>
          <State label="Erro">
            <ConversationTurn
              role="assistant"
              meta="Simulação local · 4 s"
              status="error"
              error="Não foi possível concluir a resposta."
              onRetry={() => undefined}
            >
              <AgentTrace
                label="Ajustando o texto"
                announce={false}
                steps={[
                  { id: 'ler', label: 'Lendo a seleção', state: 'done', meta: '86 palavras' },
                  {
                    id: 'reescrever',
                    label: 'Reescrevendo',
                    state: 'error',
                    detail: 'O modelo não respondeu a tempo.',
                  },
                ]}
              />
            </ConversationTurn>
          </State>
          <State label="Avaliada">
            <ConversationTurn
              role="assistant"
              meta="Simulação local · 7 s"
              copyText="Fechei a seção com a fala da Clara Souto."
              onRetry={() => undefined}
              feedback="up"
              onFeedback={() => undefined}
            >
              Fechei a seção com a fala da Clara Souto.
            </ConversationTurn>
          </State>
          <State label="Ações em hover">
            <ConversationTurn
              role="assistant"
              meta="Simulação local · 7 s"
              copyText="Fechei a seção com a fala da Clara Souto."
              onRetry={() => undefined}
              onFeedback={() => undefined}
              data-force="hover"
            >
              Fechei a seção com a fala da Clara Souto.
            </ConversationTurn>
          </State>
          <State label="Artefato em foco">
            <ConversationArtifact
              title="Rascunho v1"
              meta="812 palavras · 4 min de leitura"
              onOpen={() => undefined}
              data-force="focus"
            />
          </State>
          <State label="Vazia">
            <div className={c.frame}>
              <Conversation
                label="Conversa com o copiloto"
                empty={
                  <EmptyState
                    icon={Sparkles}
                    title="Peça um ajuste ao texto"
                    description="Selecione um trecho ou use um pedido pronto."
                  />
                }
              />
            </div>
          </State>
          <State label="Rolou para cima">
            <div className={c.frame}>
              <Conversation label="Conversa com o copiloto" forceJump>
                <ConversationTurn role="user">Deixe a introdução mais direta</ConversationTurn>
                <AiTurnView turn={{ ...STREAM_TURN, shown: Infinity, status: 'done' }} />
              </Conversation>
            </div>
          </State>
        </States>
      </Shot>

      <Shot title="Celular" align="center" pad="md">
        <Phone label="Celular, 390" height={720}>
          <Copilot height={720} bare />
        </Phone>
      </Shot>
    </Shots>
  );
}

export const specimens: Record<string, ComponentType> = {
  compositor: ComposerPage,
  conversa: ConversationPage,
};
