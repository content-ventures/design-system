'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { Button } from '@content-ventures/design-system/v3';
import { RotateCcw } from '@content-ventures/design-system/v3/icons';
import { DiffView, type DiffBlock } from '@content-ventures/design-system/v3/diff-view';
import {
  SuggestionBar,
  SuggestionCard,
  SuggestionGroup,
  type SuggestionState,
} from '@content-ventures/design-system/v3/suggestion-card';
import { Phone, Shot, Shots, State, States } from '../stage';
import x from './ia-sugestao.module.css';

/*
 * IA · Sugestão: SuggestionCard (copiloto), SuggestionBar (presa ao trecho no editor) e
 * SuggestionGroup (alternativas). Contexto: Reporter IA — Marina Lopes transforma a entrevista com
 * Clara Souto (Aurora Calçados) num artigo e pede à IA para reescrever um parágrafo.
 * A prancha só arruma o palco; tudo o que aparece vem da biblioteca.
 */

const noop = () => {};

const OLD =
  'Segundo Clara Souto, diretora de produto, a meta é chegar a 25% do catálogo até o fim de 2027.';
const NEW =
  'A meta, diz Clara Souto, diretora de produto, é chegar a 30% do catálogo até o fim de 2027.';
const NEW_WORDS = NEW.split(' ');

const TARGET: DiffBlock = {
  id: 'p2',
  change: 'modified',
  hunks: [
    { kind: 'delete', text: 'Segundo Clara Souto, diretora de produto, a meta' },
    { kind: 'insert', text: 'A meta, diz Clara Souto, diretora de produto,' },
    { kind: 'equal', text: ' é chegar a ' },
    { kind: 'delete', text: '25%' },
    { kind: 'insert', text: '30%' },
    { kind: 'equal', text: ' do catálogo até o fim de 2027.' },
  ],
};

const PROVENANCE = ['Prompt edição v2', 'Simulação local', { value: '3 s', numeric: true }];

const TITLES = [
  { id: 't1', text: 'Couro de cacto sai do nicho e chega às vitrines da Francal' },
  { id: 't2', text: 'Rastrear a cadeia virou condição para exportar calçado' },
  { id: 't3', text: 'Aurora Calçados aposta em couro vegetal para 30% do catálogo' },
];

/* ——————————————————————————— Em contexto ——————————————————————————— */

/** Geração simulada: o texto chega por palavra e a barra mostra o progresso. */
function useSimulatedRun() {
  const [state, setState] = useState<SuggestionState>('streaming');
  const [progress, setProgress] = useState(0);
  const [round, setRound] = useState(0);
  useEffect(() => {
    if (state !== 'streaming') return;
    let value = 0;
    const timer = window.setInterval(() => {
      value = Math.min(100, value + 6);
      setProgress(value);
      if (value >= 100) {
        window.clearInterval(timer);
        setState('ready');
      }
    }, 120);
    return () => window.clearInterval(timer);
  }, [state, round]);
  const restart = () => {
    setProgress(0);
    setState('streaming');
    setRound((n) => n + 1);
  };
  return { state, setState, progress, restart };
}

function Studio() {
  const run = useSimulatedRun();
  const { state, progress } = run;
  const partial = NEW_WORDS.slice(0, Math.ceil((NEW_WORDS.length * progress) / 100)).join(' ');
  const streamingBlock: DiffBlock = {
    id: 'p2',
    change: 'modified',
    hunks: [
      { kind: 'delete', text: OLD },
      ...(partial ? [{ kind: 'insert' as const, text: partial }] : []),
    ],
  };
  const deciding = state === 'streaming' || state === 'ready';
  const callbacks = {
    onAccept: () => run.setState('applied'),
    onDiscard: () => run.setState('discarded'),
    onRetry: run.restart,
  };

  return (
    <div className={x.studio}>
      <article className={x.text} aria-label="Texto do artigo">
        <h2 className={x.h2}>Couro vegetal sai do nicho e chega às vitrines da Francal 2026</h2>
        <p>
          Na abertura da feira, a Aurora Calçados apresentou a primeira linha feita inteiramente com
          couro de cacto.
        </p>
        {deciding ? (
          <div className={x.target}>
            <DiffView
              blocks={[state === 'streaming' ? streamingBlock : TARGET]}
              summary={false}
              label="Proposta no texto"
            />
            <SuggestionBar
              label="Reescrever · mais direto"
              state={state}
              progress={progress}
              {...callbacks}
            />
          </div>
        ) : (
          <p>{state === 'applied' ? NEW : OLD}</p>
        )}
        <p>
          Compradores querem saber de onde vem cada peça. O selo de origem já é exigência em
          contratos com redes da Alemanha e da Holanda.
        </p>
      </article>
      <aside className={x.copilot} aria-label="Copiloto">
        <p className={x.paneTitle}>Copiloto</p>
        <SuggestionCard
          title="Reescrever · mais direto"
          provenance={state === 'streaming' ? PROVENANCE.slice(0, 2) : PROVENANCE}
          proposal={state === 'streaming' ? partial : undefined}
          diff={state === 'streaming' ? undefined : [TARGET]}
          state={state}
          onInsert={() => run.setState('applied')}
          onEdit={noop}
          onFeedback={noop}
          onFeedbackNote={noop}
          {...callbacks}
        />
      </aside>
    </div>
  );
}

/* ——————————————————————————— Alternativas ——————————————————————————— */

function Titulos() {
  const [picked, setPicked] = useState<string | null>(null);
  const [state, setState] = useState<SuggestionState>('ready');
  return (
    <div className={x.narrow}>
      <SuggestionCard
        title="Títulos alternativos"
        provenance={['Prompt títulos v1', 'Simulação local', { value: '2 s', numeric: true }]}
        acceptLabel="Usar título"
        acceptBlockedReason={picked ? undefined : 'Escolha um título'}
        state={state}
        onAccept={() => setState('applied')}
        onDiscard={() => setState('discarded')}
        onRetry={() => {
          setPicked(null);
          setState('ready');
        }}
        onFeedback={noop}
      >
        <SuggestionGroup
          label="Títulos alternativos"
          value={picked}
          onValueChange={setPicked}
          disabled={state !== 'ready'}
        >
          {TITLES.map((title) => (
            <SuggestionCard
              key={title.id}
              variant="compact"
              value={title.id}
              proposal={title.text}
              meta={`${title.text.length} caracteres`}
            />
          ))}
        </SuggestionGroup>
      </SuggestionCard>
    </div>
  );
}

function Option({
  force,
  selected,
  streaming,
}: {
  force?: string;
  selected?: boolean;
  streaming?: boolean;
}) {
  return (
    <SuggestionGroup label="Título alternativo" value={selected ? 'a' : null} onValueChange={noop}>
      <SuggestionCard
        variant="compact"
        value="a"
        state={streaming ? 'streaming' : 'ready'}
        proposal={TITLES[1]?.text}
        meta="54 caracteres"
        data-force={force}
      />
    </SuggestionGroup>
  );
}

/* ——————————————————————————— Prancha ——————————————————————————— */

function Sugestao() {
  const [round, setRound] = useState(0);
  return (
    <Shots>
      <Shot
        title="Em contexto"
        tone="white"
        align="stretch"
        pad="lg"
        aside={
          <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => setRound((n) => n + 1)}>
            Recomeçar
          </Button>
        }
      >
        <Studio key={round} />
      </Shot>

      <Shot title="Estados" align="stretch" pad="md">
        <States min={320}>
          <State label="Gerando">
            <SuggestionCard
              title="Reescrever · didático"
              provenance={['Prompt edição v2', 'Simulação local']}
              state="streaming"
              onAccept={noop}
              onDiscard={noop}
            />
          </State>
          <State label="Gerando, parcial">
            <SuggestionCard
              title="Reescrever · mais direto"
              provenance={['Prompt edição v2', 'Simulação local']}
              state="streaming"
              proposal="A meta, diz Clara Souto, diretora de produto, é chegar"
              onAccept={noop}
              onDiscard={noop}
            />
          </State>
          <State label="Pronta">
            <SuggestionCard
              title="Reescrever · mais direto"
              provenance={PROVENANCE}
              diff={[TARGET]}
              onAccept={noop}
              onInsert={noop}
              onDiscard={noop}
              onRetry={noop}
              onEdit={noop}
              onFeedback={noop}
            />
          </State>
          <State label="Inserir abaixo">
            <SuggestionCard
              title="Expandir com a fonte"
              provenance={['Prompt edição v2', 'Simulação local', { value: '4 s', numeric: true }]}
              mode="insert"
              proposal="Segundo a Ateliê Sul, a troca pesa pouco no preço final: a diferença fica entre 4% e 7% por par."
              onInsert={noop}
              onDiscard={noop}
              onRetry={noop}
              onFeedback={noop}
            />
          </State>
          <State label="Trecho mudou">
            <SuggestionCard
              title="Encurtar"
              provenance={['Prompt edição v2', 'Simulação local', { value: '2 s', numeric: true }]}
              state="stale"
              proposal="A Aurora quer 30% do catálogo em couro vegetal até 2027."
              onReapply={noop}
              onDiscard={noop}
            />
          </State>
          <State label="Falhou">
            <SuggestionCard
              title="Reescrever · formal"
              provenance={['Prompt edição v2', 'Simulação local']}
              state="error"
              error="A geração parou no meio. O texto não mudou."
              onRetry={noop}
              onDiscard={noop}
            />
          </State>
          <State label="Aplicada">
            <SuggestionCard
              title="Reescrever · mais direto"
              provenance={PROVENANCE}
              state="applied"
              diff={[TARGET]}
              feedback="up"
              onFeedback={noop}
            />
          </State>
          <State label="Descartada">
            <SuggestionCard
              title="Virar lista"
              provenance={['Prompt edição v2', 'Simulação local', { value: '3 s', numeric: true }]}
              state="discarded"
              onFeedback={noop}
            />
          </State>
        </States>
      </Shot>

      <Shot title="Títulos alternativos" align="center" pad="md">
        <Titulos />
      </Shot>

      <Shot title="Alternativa" align="stretch" pad="md">
        <States min={220}>
          <State label="Repouso">
            <Option />
          </State>
          <State label="Hover">
            <Option force="hover" />
          </State>
          <State label="Pressionado">
            <Option force="active" />
          </State>
          <State label="Foco">
            <Option force="focus" />
          </State>
          <State label="Selecionado">
            <Option selected />
          </State>
          <State label="Carregando">
            <Option streaming />
          </State>
        </States>
      </Shot>

      <Shot title="Compacto" align="center" pad="md">
        <div className={x.narrow}>
          <SuggestionCard
            variant="compact"
            title="Slide 3 · Citação"
            proposal="“Não é mais tendência, é condição para exportar.”"
            onAccept={noop}
            onDiscard={noop}
            onRetry={noop}
          />
        </div>
      </Shot>

      <Shot title="Barra no texto" align="stretch" pad="md">
        <div className={x.bars}>
          <SuggestionBar
            label="Reescrever · mais direto"
            state="streaming"
            progress={40}
            onAccept={noop}
            onDiscard={noop}
          />
          <SuggestionBar
            label="Reescrever · mais direto"
            onAccept={noop}
            onDiscard={noop}
            onRetry={noop}
          />
          <SuggestionBar
            label="Expandir com a fonte"
            mode="insert"
            onInsert={noop}
            onDiscard={noop}
            onRetry={noop}
          />
          <SuggestionBar label="Encurtar" state="stale" onReapply={noop} onDiscard={noop} />
          <SuggestionBar
            label="Reescrever · formal"
            state="error"
            onRetry={noop}
            onDiscard={noop}
          />
        </div>
      </Shot>

      <Shot title="Celular" align="center" pad="md">
        <Phone label="Celular, 390">
          <div className={x.phoneBody}>
            <DiffView blocks={[TARGET]} summary={false} label="Proposta no texto" />
            <SuggestionBar
              label="Reescrever · mais direto"
              onAccept={noop}
              onDiscard={noop}
              onRetry={noop}
            />
            <SuggestionCard
              title="Reescrever · mais direto"
              provenance={PROVENANCE}
              diff={[TARGET]}
              onAccept={noop}
              onInsert={noop}
              onDiscard={noop}
              onRetry={noop}
              onFeedback={noop}
            />
          </div>
        </Phone>
      </Shot>
    </Shots>
  );
}

export const specimens: Record<string, ComponentType> = {
  sugestao: Sugestao,
};
