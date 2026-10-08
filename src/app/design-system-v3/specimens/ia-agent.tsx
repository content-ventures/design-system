'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import {
  AgentTrace,
  Avatar,
  Button,
  LinkButton,
  MetaList,
  Panel,
  ProgressSteps,
  Section,
  SourceChip,
  TextLink,
  type AgentTraceStep,
  type AgentTraceStepState,
  type SourceKind,
} from '@content-ventures/design-system/v3';
import { CircleAlert, RotateCcw } from '@content-ventures/design-system/v3/icons';
import { Phone, Shot, Shots, State, States } from '../stage';
import x from './ia-agent.module.css';

/*
 * IA (agente): `AgentTrace` (etapas visíveis de uma geração) e `SourceChip` (fonte citada).
 * Contexto: Reporter IA — Marina Lopes transforma a entrevista com Clara Souto (Aurora Calçados)
 * num artigo sobre couro vegetal na Francal 2026. Nomes e falas fictícios.
 */

/* ——————————————————————————— Falas da transcrição ——————————————————————————— */

type Fala = { id: string; speaker: string; role: string; time: string; text: string };

const FALAS: Fala[] = [
  {
    id: 'f1',
    speaker: 'Clara Souto',
    role: 'Entrevistada',
    time: '03:12',
    text: 'A linha nova é toda em couro de cacto. A meta é chegar a 30% do catálogo até o fim de 2027.',
  },
  {
    id: 'f2',
    speaker: 'Clara Souto',
    role: 'Entrevistada',
    time: '07:40',
    text: 'O selo de origem já é exigência nos contratos com redes da Alemanha e da Holanda.',
  },
  {
    id: 'f3',
    speaker: 'Clara Souto',
    role: 'Entrevistada',
    time: '12:48',
    text: 'Não é mais tendência, é condição para exportar. Quem não rastreia a cadeia fica fora da conversa.',
  },
  {
    id: 'f4',
    speaker: 'Marina Lopes',
    role: 'Entrevistadora',
    time: '18:05',
    text: 'E para o lojista, quanto isso pesa no preço final do par?',
  },
  {
    id: 'f5',
    speaker: 'Clara Souto',
    role: 'Entrevistada',
    time: '24:31',
    text: 'Entre 4% e 7% por par, segundo a conta que fizemos com a Ateliê Sul.',
  },
];

/** Prévia de uma fala: orbe + nome, papel e minuto, e o texto. Só composição. */
function FalaPreview({ fala }: { fala: Fala }) {
  return (
    <div className={x.fala}>
      <div className={x.falaHead}>
        <Avatar name={fala.speaker} size="xs" decorative />
        <span className={x.falaName}>{fala.speaker}</span>
        <MetaList size="xs" items={[fala.role, { value: fala.time, numeric: true }]} />
      </div>
      <p className={x.falaText}>{fala.text}</p>
    </div>
  );
}

function falaChip(fala: Fala, extra?: { state?: 'used' | 'selected'; onOpen?: () => void }) {
  return (
    <SourceChip
      key={fala.id}
      kind="excerpt"
      label={fala.speaker}
      meta={fala.time}
      state={extra?.state}
      preview={<FalaPreview fala={fala} />}
      onOpen={extra?.onOpen ?? (() => {})}
    />
  );
}

/* ——————————————————————————— Receita da geração ——————————————————————————— */

type Recipe = { id: string; label: string; done: string };

const RECIPE: Recipe[] = [
  { id: 'ler', label: 'Lendo material', done: '42 falas' },
  { id: 'falas', label: 'Selecionando falas-chave', done: '5 trechos' },
  { id: 'estrutura', label: 'Montando estrutura', done: '3 intertítulos' },
  { id: 'intro', label: 'Escrevendo introdução', done: '6 s' },
  { id: 'secoes', label: 'Escrevendo seções', done: '3 de 3' },
  { id: 'citacoes', label: 'Conferindo citações', done: '4 de 4' },
];

const FAIL_DETAIL = 'O modelo não respondeu em 60 s. O que já foi escrito ficou salvo.';

/** Etapas paradas num ponto do run (`at` = índice da atual; `fail` = a atual falhou). */
function runAt(at: number, opts: { section?: number; fail?: boolean; sources?: boolean } = {}) {
  const { section = 2, fail = false, sources = true } = opts;
  return RECIPE.map((step, index): AgentTraceStep => {
    const state: AgentTraceStepState =
      index < at ? 'done' : index === at ? (fail ? 'error' : 'current') : 'upcoming';
    const label =
      step.id === 'secoes' && index >= at ? `Escrevendo seção ${section} de 3` : step.label;
    const picked = step.id === 'falas' && index <= at && sources;
    return {
      id: step.id,
      label,
      state,
      meta: state === 'done' ? step.done : undefined,
      detail: state === 'error' ? FAIL_DETAIL : undefined,
      sources: picked
        ? FALAS.slice(0, index < at ? 5 : 3).map((fala) => falaChip(fala))
        : undefined,
    };
  });
}

/* ——————————————————————————— Prancha: AgentTrace ——————————————————————————— */

type Sim = { at: number; section: number; failed: boolean };
const SIM_START: Sim = { at: 0, section: 1, failed: false };

function useInterval(active: boolean, ms: number, tick: () => void) {
  const saved = useRef(tick);
  useEffect(() => {
    saved.current = tick;
  });
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => saved.current(), ms);
    return () => window.clearInterval(timer);
  }, [active, ms]);
}

/** Run ao vivo no copiloto: avança sozinho, recolhe no fim, falha e retoma da etapa. */
function LiveRun() {
  const [sim, setSim] = useState<Sim>(SIM_START);
  const [collapsed, setCollapsed] = useState(false);
  const finished = sim.at >= RECIPE.length;
  useInterval(!finished && !sim.failed, 1100, () => {
    if (sim.at === 4 && sim.section < 3) {
      setSim({ ...sim, section: sim.section + 1 });
      return;
    }
    const at = sim.at + 1;
    setSim({ ...sim, at });
    // No fim, o rastro recolhe no resumo (controlado por quem renderiza).
    if (at >= RECIPE.length) setCollapsed(true);
  });
  const steps = runAt(sim.at, { section: sim.section, fail: sim.failed });

  return (
    <div className={x.live}>
      <div className={x.liveActions}>
        <Button
          size="sm"
          variant="ghost"
          icon={RotateCcw}
          onClick={() => {
            setSim(SIM_START);
            setCollapsed(false);
          }}
        >
          Repetir
        </Button>
        <Button
          size="sm"
          variant="ghost"
          icon={CircleAlert}
          disabled={finished || sim.failed}
          onClick={() => setSim((prev) => ({ ...prev, failed: true }))}
        >
          Simular falha
        </Button>
      </div>
      <AgentTrace
        label={finished ? 'Artigo gerado' : 'Gerando artigo'}
        steps={steps}
        summary={finished ? 'Concluído em 38 s · 6 etapas' : undefined}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        onRetry={() => setSim((prev) => ({ ...prev, failed: false }))}
      />
      {finished && (
        <MetaList
          size="sm"
          items={['Rascunho v1', { value: '812 palavras', numeric: true }, '4 citações conferidas']}
        />
      )}
    </div>
  );
}

type Row = {
  id: string;
  title: string;
  label: string;
  steps: AgentTraceStep[];
  summary?: string;
  preview?: string;
};

const NOW_ROWS: Row[] = [
  {
    id: 'couro',
    title: 'Couro vegetal chega às vitrines',
    label: 'Gerando artigo',
    steps: runAt(4, { sources: false }),
    preview: '…o selo de origem já é exigência nos contratos com redes da Alemanha e da Holanda.',
  },
  {
    id: 'carrossel',
    title: 'Ateliê Sul na Francal 2026',
    label: 'Carrossel gerado',
    steps: runAt(6, { sources: false }),
    summary: 'Concluído em 52 s',
  },
  {
    id: 'bella',
    title: 'Entrevista Bella Passo',
    label: 'Gerando artigo',
    steps: runAt(0, { fail: true, sources: false }),
  },
];

/**
 * “Gerando agora” da Visão geral: um run por linha, na versão compacta, com “Abrir” no fim e o
 * trecho sendo escrito na segunda linha (`preview`).
 */
function NowList({ announce = true }: { announce?: boolean }) {
  const [retried, setRetried] = useState<string[]>([]);
  return (
    <ul className={x.rows}>
      {NOW_ROWS.map((row) => {
        const again = retried.includes(row.id);
        return (
          <li key={row.id} className={x.row}>
            <span className={x.rowTitle}>{row.title}</span>
            <AgentTrace
              variant="compact"
              label={row.label}
              steps={again ? runAt(0, { sources: false }) : row.steps}
              summary={row.summary}
              announce={announce}
              onRetry={() => setRetried((list) => [...list, row.id])}
              preview={row.preview}
              action={
                <TextLink size="sm" href="#gerando-agora">
                  Abrir
                </TextLink>
              }
            />
          </li>
        );
      })}
    </ul>
  );
}

const STEP_STATES: { label: string; state: AgentTraceStepState; meta?: string; text: string }[] = [
  { label: 'A seguir', state: 'upcoming', text: 'Conferindo citações' },
  { label: 'Atual', state: 'current', text: 'Escrevendo seção 2 de 3' },
  { label: 'Concluída', state: 'done', meta: '5 trechos', text: 'Selecionando falas-chave' },
  { label: 'Pulada', state: 'skipped', meta: 'Sem acervo', text: 'Buscando no acervo' },
  { label: 'Falha', state: 'error', meta: 'após 60 s', text: 'Escrevendo seção 2 de 3' },
];

function AgentTraceSpecimen() {
  const noop = () => {};
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch">
        <div className={x.split}>
          <Panel label="Copiloto">
            <Section title="Copiloto">
              <LiveRun />
            </Section>
          </Panel>
          <Panel label="Gerando agora">
            <Section title="Gerando agora" meta="3 runs">
              <NowList />
            </Section>
          </Panel>
        </div>
      </Shot>

      <Shot title="Variantes" tone="white" align="stretch">
        <States min={300}>
          <State label="Rodando">
            <div className={x.cell}>
              <AgentTrace label="Gerando artigo" steps={runAt(2)} announce={false} />
            </div>
          </State>
          <State label="Falha">
            <div className={x.cell}>
              <AgentTrace
                label="Gerando artigo"
                steps={runAt(4, { fail: true })}
                onRetry={noop}
                announce={false}
              />
            </div>
          </State>
          <State label="Concluído, recolhido">
            <div className={x.cell}>
              <AgentTrace
                label="Artigo gerado"
                steps={runAt(6)}
                summary="Concluído em 38 s · 6 etapas"
                defaultCollapsed
                announce={false}
              />
            </div>
          </State>
          <State label="Rodando, recolhido">
            <div className={x.cell}>
              <AgentTrace
                label="Gerando artigo"
                steps={runAt(4)}
                defaultCollapsed
                announce={false}
              />
            </div>
          </State>
          <State label="Interrompido">
            <div className={x.cell}>
              <AgentTrace
                label="Gerando artigo"
                status="stopped"
                steps={runAt(3).map((step) =>
                  step.state === 'current' ? { ...step, state: 'upcoming' } : step,
                )}
                summary="Interrompido · v1 guardada"
                defaultCollapsed
                announce={false}
              />
            </div>
          </State>
          <State label="Na fila">
            <div className={x.cell}>
              <AgentTrace
                label="Gerando carrossel"
                steps={RECIPE.map((step) => ({
                  id: step.id,
                  label: step.label,
                  state: 'upcoming',
                }))}
                defaultCollapsed
                announce={false}
              />
            </div>
          </State>
          <State label="Compacto">
            <div className={x.cell}>
              <NowList announce={false} />
            </div>
          </State>
        </States>
      </Shot>

      <Shot title="Estados" tone="white" align="stretch">
        <div className={x.sections}>
          <States min={220}>
            {(
              [
                ['Repouso', undefined],
                ['Hover', 'hover'],
                ['Pressionado', 'active'],
                ['Foco', 'focus'],
              ] as const
            ).map(([label, force]) => (
              <State key={label} label={label}>
                <div className={x.cell}>
                  <AgentTrace
                    label="Artigo gerado"
                    steps={runAt(6)}
                    summary="Concluído em 38 s"
                    defaultCollapsed
                    announce={false}
                    data-force={force}
                  />
                </div>
              </State>
            ))}
          </States>
          <States min={220}>
            {STEP_STATES.map((step) => (
              <State key={step.label} label={step.label}>
                <div className={x.cell}>
                  <ProgressSteps
                    variant="trace"
                    label={step.label}
                    steps={[
                      { id: step.label, label: step.text, state: step.state, meta: step.meta },
                    ]}
                  />
                </div>
              </State>
            ))}
          </States>
        </div>
      </Shot>

      <Shot title="Celular" align="center">
        <Phone label="Celular, 390">
          <div className={x.phoneBody}>
            <AgentTrace
              label="Gerando artigo"
              steps={runAt(4, { fail: true })}
              onRetry={noop}
              announce={false}
            />
            <NowList announce={false} />
          </div>
        </Phone>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Prancha: SourceChip ——————————————————————————— */

const KINDS: { kind: SourceKind; label: string; meta: string }[] = [
  { kind: 'transcript', label: 'Entrevista Clara Souto', meta: '1 h 12 min' },
  { kind: 'excerpt', label: 'Clara Souto', meta: '12:48' },
  { kind: 'quote', label: '“Não é mais tendência”', meta: 'Clara Souto' },
  { kind: 'url', label: 'valor.globo.com', meta: '03/10/2026' },
  { kind: 'archive', label: 'Acervo Francal 2025', meta: '4 matérias' },
  { kind: 'media', label: 'estande-aurora.jpg', meta: 'Tiago Rezende' },
  { kind: 'file', label: 'release-aurora.pdf', meta: '182 KB' },
];

const [F1, F2, F3, , F5] = FALAS as [Fala, Fala, Fala, Fala, Fala];

/** Trecho de artigo com citações no texto: 1 e 2 conferidas, 3 não bate com a transcrição. */
function CitedParagraph({ onOpen }: { onOpen?: (fala: Fala) => void }) {
  const open = (fala: Fala) => () => onOpen?.(fala);
  return (
    <div className={x.prose}>
      <p>
        Na abertura da feira, a Aurora Calçados apresentou a primeira linha feita inteiramente com
        couro de cacto. A meta é chegar a 30% do catálogo até o fim de 2027.
        <SourceChip
          variant="inline"
          index={1}
          kind="excerpt"
          label={F1.speaker}
          meta={F1.time}
          state="used"
          preview={<FalaPreview fala={F1} />}
          onOpen={open(F1)}
        />
      </p>
      <p>
        O selo de origem já é exigência em contratos com redes da Alemanha e da Holanda.
        <SourceChip
          variant="inline"
          index={2}
          kind="excerpt"
          label={F2.speaker}
          meta={F2.time}
          state="used"
          preview={<FalaPreview fala={F2} />}
          onOpen={open(F2)}
        />{' '}
        Para o varejo, a troca pesa pouco: entre 3% e 5% por par.
        <SourceChip
          variant="inline"
          index={3}
          kind="excerpt"
          label={F5.speaker}
          meta={F5.time}
          state="missing"
          preview={<FalaPreview fala={F5} />}
          onOpen={open(F5)}
        />
      </p>
    </div>
  );
}

/** Contexto do compositor: trechos escolhidos, removíveis, com volta. */
function ContextChips() {
  const [ids, setIds] = useState(['f3', 'f2']);
  const chosen = FALAS.filter((fala) => ids.includes(fala.id));
  const next = FALAS.find((fala) => fala.speaker === 'Clara Souto' && !ids.includes(fala.id));
  return (
    <div className={x.chips} role="group" aria-label="Contexto do pedido">
      <SourceChip kind="quote" label="Seleção" meta="§3" state="selected" onRemove={() => {}} />
      {chosen.map((fala) => (
        <SourceChip
          key={fala.id}
          kind="excerpt"
          label={`Trecho ${fala.time}`}
          meta={fala.speaker}
          state="selected"
          preview={<FalaPreview fala={fala} />}
          onOpen={() => {}}
          onRemove={() => setIds((list) => list.filter((id) => id !== fala.id))}
        />
      ))}
      {next && (
        <LinkButton onClick={() => setIds((list) => [...list, next.id])}>
          Adicionar trecho
        </LinkButton>
      )}
    </div>
  );
}

function SourceChipSpecimen() {
  const [opened, setOpened] = useState<string>('—');
  const noop = () => {};
  const preview = <FalaPreview fala={F3} />;
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch">
        <div className={x.split}>
          <div className={x.stack}>
            <CitedParagraph onOpen={(fala) => setOpened(`${fala.speaker} · ${fala.time}`)} />
            <MetaList
              size="xs"
              items={['Aberto na transcrição', { value: opened, numeric: true }]}
            />
          </div>
          <Panel label="Fontes do artigo">
            <Section title="Fonte" meta="2 de 3 conferidas" metaTone="missing">
              <div className={x.chips}>
                {falaChip(F1, { state: 'used' })}
                {falaChip(F2, { state: 'used' })}
                <SourceChip
                  kind="excerpt"
                  label={F5.speaker}
                  meta={F5.time}
                  state="missing"
                  preview={<FalaPreview fala={F5} />}
                  onOpen={noop}
                />
              </div>
            </Section>
            <Section title="Contexto">
              <ContextChips />
            </Section>
          </Panel>
        </div>
      </Shot>

      <Shot title="Variantes" tone="white" align="stretch">
        <div className={x.stack}>
          <div className={x.chips}>
            {KINDS.map((item) => (
              <SourceChip key={item.kind} {...item} onOpen={noop} />
            ))}
          </div>
          <div className={x.chips}>
            <SourceChip kind="excerpt" label="Clara Souto" meta="12:48" index={3} onOpen={noop} />
            <SourceChip kind="url" label="valor.globo.com" onOpen={noop} onRemove={noop} />
            <SourceChip kind="file" label="release-aurora.pdf" meta="182 KB" />
          </div>
          <div className={x.prose}>
            <p>
              Marca numerada
              <SourceChip
                variant="inline"
                index={1}
                kind="excerpt"
                label="Clara Souto"
                onOpen={noop}
              />
              , marca com rótulo
              <SourceChip
                variant="inline"
                kind="excerpt"
                label="12:48"
                meta="Clara Souto"
                onOpen={noop}
              />{' '}
              e link
              <SourceChip variant="inline" kind="url" label="valor.globo.com" onOpen={noop} />.
            </p>
          </div>
        </div>
      </Shot>

      <Shot title="Estados" tone="white" align="stretch">
        <div className={x.sections}>
          <States min={200}>
            <State label="Repouso">
              <SourceChip kind="excerpt" label="Clara Souto" meta="12:48" onOpen={noop} />
            </State>
            <State label="Hover">
              <SourceChip
                kind="excerpt"
                label="Clara Souto"
                meta="12:48"
                onOpen={noop}
                data-force="hover"
              />
            </State>
            <State label="Pressionado">
              <SourceChip
                kind="excerpt"
                label="Clara Souto"
                meta="12:48"
                onOpen={noop}
                data-force="active"
              />
            </State>
            <State label="Foco">
              <SourceChip
                kind="excerpt"
                label="Clara Souto"
                meta="12:48"
                onOpen={noop}
                data-force="focus"
              />
            </State>
            <State label="Selecionada">
              <SourceChip
                kind="excerpt"
                label="Trecho 12:48"
                meta="Clara Souto"
                state="selected"
                onOpen={noop}
                onRemove={noop}
              />
            </State>
            <State label="Usada">
              <SourceChip
                kind="excerpt"
                label="Clara Souto"
                meta="12:48"
                state="used"
                onOpen={noop}
              />
            </State>
            <State label="Falta">
              <SourceChip
                kind="quote"
                label="“Entre 3% e 5%”"
                meta="Clara Souto"
                state="missing"
                onOpen={noop}
              />
            </State>
            <State label="Indisponível">
              <SourceChip
                kind="url"
                label="valor.globo.com"
                meta="03/10"
                disabled
                onOpen={noop}
                onRemove={noop}
              />
            </State>
            <State label="Carregando">
              <SourceChip kind="url" label="valor.globo.com" loading onOpen={noop} />
            </State>
          </States>
          <States min={140}>
            {(
              [
                ['Repouso', 'default', undefined],
                ['Hover', 'default', 'hover'],
                ['Pressionado', 'default', 'active'],
                ['Foco', 'default', 'focus'],
                ['Selecionada', 'selected', undefined],
                ['Falta', 'missing', undefined],
              ] as const
            ).map(([label, state, force]) => (
              <State key={label} label={label}>
                <p className={x.prose}>
                  <span>
                    da conversa
                    <SourceChip
                      variant="inline"
                      index={2}
                      kind="excerpt"
                      label="Clara Souto"
                      meta="12:48"
                      state={state}
                      onOpen={noop}
                      data-force={force}
                    />
                  </span>
                </p>
              </State>
            ))}
          </States>
        </div>
      </Shot>

      <Shot title="Prévia" tone="white" align="start">
        <div className={x.pinned}>
          <SourceChip
            kind="excerpt"
            label={F3.speaker}
            meta={F3.time}
            state="used"
            preview={preview}
            previewPinned
            onOpen={noop}
          />
        </div>
      </Shot>

      <Shot title="Celular" align="center">
        <Phone label="Celular, 390">
          <div className={x.phoneBody}>
            <CitedParagraph />
            <div className={x.chips}>
              {falaChip(F1, { state: 'used' })}
              {falaChip(F2, { state: 'used' })}
              <SourceChip
                kind="url"
                label="Reportagem sobre rastreabilidade no varejo europeu"
                meta="valor.globo.com"
                onOpen={noop}
                onRemove={noop}
              />
            </div>
          </div>
        </Phone>
      </Shot>
    </Shots>
  );
}

export const specimens: Record<string, ComponentType> = {
  'etapas-ia': AgentTraceSpecimen,
  fonte: SourceChipSpecimen,
};
