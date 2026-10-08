'use client';

import { useMemo, useState, type ComponentType } from 'react';
import { Paperclip, Quote, Sparkles } from '@content-ventures/design-system/v3/icons';
import { Prose } from '@content-ventures/design-system/v3/prose';
import { SourceChip } from '@content-ventures/design-system/v3/source-chip';
import {
  TranscriptViewer,
  formatTimestamp,
  type TranscriptAction,
  type TranscriptSegment,
  type TranscriptSelection,
} from '@content-ventures/design-system/v3/transcript-viewer';
import { Phone, Shot, Shots, State, States } from '../stage';
import x from './midia-transcricao.module.css';

/*
 * Transcrição (mídia): `TranscriptViewer` como painel “Fonte” do estúdio. Reporter IA — Marina Lopes
 * entrevistou Clara Souto (Aurora Calçados) e Tiago Rezende (Ateliê Sul) na Francal 2026 e
 * transforma a conversa em reportagem. Parágrafo do texto ⇄ fala de origem; seleção vira citação
 * ou contexto da IA.
 */

const MARINA = { id: 'marina', name: 'Marina Lopes' };
const CLARA = { id: 'clara', name: 'Clara Souto' };
const TIAGO = { id: 'tiago', name: 'Tiago Rezende' };

const at = (minutes: number, seconds: number) => (minutes * 60 + seconds) * 1000;

const SEGMENTS: TranscriptSegment[] = [
  {
    id: 't01',
    speaker: MARINA,
    start: at(0, 0),
    text: 'Obrigada por receberem a gente no estande. Para começar: quando a Aurora decidiu apostar no couro vegetal?',
  },
  {
    id: 't02',
    speaker: CLARA,
    start: at(0, 9),
    text: 'Foi em 2023, meio por acaso. Um cliente da Alemanha pediu uma amostra sem couro animal e a gente não tinha nada para mostrar.',
  },
  {
    id: 't03',
    speaker: CLARA,
    start: at(0, 24),
    text: 'Fizemos um teste pequeno com couro de cacto, umas 300 peças, e esgotou em duas semanas.',
  },
  {
    id: 't04',
    speaker: MARINA,
    start: at(0, 41),
    text: 'E hoje, qual é o tamanho dessa linha dentro do catálogo?',
  },
  {
    id: 't05',
    speaker: CLARA,
    start: at(0, 47),
    text: 'Hoje são 18% do catálogo. A meta é chegar a 30% até o fim de 2027.',
  },
  {
    id: 't06',
    speaker: CLARA,
    start: at(1, 2),
    text: 'Não é mais tendência, é condição para exportar. Quem não rastreia a cadeia fica fora da conversa.',
  },
  {
    id: 't07',
    speaker: MARINA,
    start: at(1, 15),
    text: 'Tiago, o Ateliê Sul é bem menor. Como essa mudança chega para quem produz em escala menor?',
  },
  {
    id: 't08',
    speaker: TIAGO,
    start: at(1, 23),
    text: 'Chega pelo custo, primeiro. O couro de cacto ainda sai uns 20% mais caro que o bovino na compra.',
  },
  {
    id: 't09',
    speaker: TIAGO,
    start: at(1, 38),
    text: 'Mas o desperdício é menor. A placa vem no tamanho que a gente pede, então o corte aproveita quase tudo.',
  },
  {
    id: 't10',
    speaker: TIAGO,
    start: at(1, 52),
    text: 'No fim, a diferença no preço final fica entre 4% e 7% por par.',
  },
  { id: 't11', speaker: MARINA, start: at(2, 6), text: 'O consumidor percebe essa diferença?' },
  {
    id: 't12',
    speaker: TIAGO,
    start: at(2, 10),
    text: 'Percebe pouco. O que ele percebe é a etiqueta de origem. Isso vende mais do que o material em si.',
  },
  {
    id: 't13',
    speaker: MARINA,
    start: at(2, 24),
    text: 'Clara, vocês falaram em rastreabilidade. Como funciona na prática?',
  },
  {
    id: 't14',
    speaker: CLARA,
    start: at(2, 31),
    text: 'Cada lote tem um código. O lojista escaneia e vê a fazenda, o curtume e a fábrica.',
  },
  {
    id: 't15',
    speaker: CLARA,
    start: at(2, 45),
    text: 'Começamos por exigência de duas redes da Holanda. Agora todos os contratos novos pedem isso.',
  },
  {
    id: 't16',
    speaker: CLARA,
    start: at(3, 2),
    text: 'O selo de origem virou cláusula. Sem ele, a gente simplesmente perde o pedido.',
  },
  { id: 't17', speaker: MARINA, start: at(3, 14), text: 'Isso pesa no prazo de entrega?' },
  {
    id: 't18',
    speaker: CLARA,
    start: at(3, 18),
    text: 'No começo pesou. A primeira coleção atrasou três semanas porque o fornecedor não tinha o sistema pronto.',
  },
  {
    id: 't19',
    speaker: CLARA,
    start: at(3, 35),
    text: 'Hoje o prazo é o mesmo da linha tradicional: 45 dias da aprovação até o embarque.',
  },
  { id: 't20', speaker: MARINA, start: at(3, 48), text: 'Tiago, o Ateliê Sul também rastreia?' },
  {
    id: 't21',
    speaker: TIAGO,
    start: at(3, 52),
    text: 'Ainda não com código por lote. A gente mostra o certificado do fornecedor na loja e no site.',
  },
  {
    id: 't22',
    speaker: TIAGO,
    start: at(4, 6),
    text: 'Para nós, um sistema próprio não fecha a conta antes de 2027.',
  },
  { id: 't23', speaker: MARINA, start: at(4, 18), text: 'Vocês dividem fornecedor?' },
  {
    id: 't24',
    speaker: TIAGO,
    start: at(4, 21),
    text: 'Dividimos um, de Franca. Quando a Aurora fecha um volume grande, o preço melhora para todo mundo.',
  },
  {
    id: 't25',
    speaker: CLARA,
    start: at(4, 37),
    text: 'É verdade. Esse fornecedor triplicou a produção desde 2024.',
  },
  {
    id: 't26',
    speaker: MARINA,
    start: at(4, 48),
    text: 'O que vocês esperam da Francal deste ano?',
  },
  {
    id: 't27',
    speaker: CLARA,
    start: at(4, 53),
    text: 'Fechar com dois compradores europeus que vieram só para ver a linha vegetal.',
  },
  {
    id: 't28',
    speaker: TIAGO,
    start: at(5, 5),
    text: 'Eu quero sair daqui com três lojas novas no Sul. Já tenho duas conversas boas.',
  },
  {
    id: 't29',
    speaker: MARINA,
    start: at(5, 16),
    text: 'Última pergunta: o couro bovino vai sumir?',
  },
  {
    id: 't30',
    speaker: CLARA,
    start: at(5, 20),
    text: 'Não. Vai continuar existindo, mas vai ter que provar de onde vem, como o vegetal já prova.',
  },
];

const byId = new Map(SEGMENTS.map((segment) => [segment.id, segment]));
const seg = (id: string) => byId.get(id) as TranscriptSegment;

/** Texto colado sem marcas de tempo (R1: “Nome:” vira falante). */
const UNTIMED = SEGMENTS.slice(0, 8).map(({ start: _start, ...segment }) => segment);
/** Texto corrido sem falantes nem tempo. */
const PLAIN = SEGMENTS.slice(1, 4).map(({ id, text }) => ({ id: `p-${id}`, text }));

/** Transcrição longa (≈ 3 h de evento): a lista renderiza só a janela visível. */
const LONG: TranscriptSegment[] = Array.from({ length: 1200 }, (_, i) => {
  const base = SEGMENTS[i % SEGMENTS.length] as TranscriptSegment;
  return { ...base, id: `l${i}`, start: i * 9_000 };
});

type Block =
  | { id: string; kind: 'p'; text: string; sources: string[] }
  | { id: string; kind: 'h2'; text: string }
  | { id: string; kind: 'quote'; text: string; credit: string; sources: string[] };

const ARTICLE: Block[] = [
  {
    id: 'b1',
    kind: 'p',
    sources: ['t02', 't03'],
    text: 'A Aurora Calçados começou a testar o couro vegetal em 2023, depois que um cliente alemão pediu amostras sem couro animal. O primeiro lote, de 300 peças de couro de cacto, esgotou em duas semanas.',
  },
  {
    id: 'b2',
    kind: 'p',
    sources: ['t05'],
    text: 'Hoje a linha responde por 18% do catálogo, e a meta é chegar a 30% até o fim de 2027.',
  },
  {
    id: 'b3',
    kind: 'p',
    sources: ['t08', 't10'],
    text: 'Para fabricantes menores, a conta é outra. No Ateliê Sul, o material sai cerca de 20% mais caro na compra, mas a diferença no preço final fica entre 4% e 7% por par.',
  },
  { id: 'b4', kind: 'h2', text: 'Rastreabilidade vira argumento de venda' },
  {
    id: 'b5',
    kind: 'p',
    sources: ['t14', 't16'],
    text: 'Cada lote da Aurora tem um código que mostra a fazenda, o curtume e a fábrica. O selo de origem já é cláusula em contratos com redes da Holanda.',
  },
];

type ContextItem = { key: string; selection: TranscriptSelection; ask: boolean };

const excerptLabel = (selection: TranscriptSelection) => {
  const start = seg(selection.segmentId)?.start;
  return start === undefined ? 'Trecho' : `Trecho ${formatTimestamp(start)}`;
};

/** Estúdio em miniatura: Fonte (transcrição) ⇄ Texto (reportagem) e contexto do copiloto. */
function Studio() {
  const [blocks, setBlocks] = useState<Block[]>(ARTICLE);
  const [query, setQuery] = useState('');
  const [speaker, setSpeaker] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [context, setContext] = useState<ContextItem[]>([]);

  const usedIds = useMemo(
    () => [...new Set(blocks.flatMap((block) => ('sources' in block ? block.sources : [])))],
    [blocks],
  );
  const addContext = (selection: TranscriptSelection, ask: boolean) =>
    setContext((items) => [
      ...items.filter((item) => item.ask !== ask || !ask),
      { key: `${selection.segmentId}-${selection.start}-${Date.now()}`, selection, ask },
    ]);

  const actions: TranscriptAction[] = [
    {
      id: 'quote',
      label: 'Inserir citação',
      icon: Quote,
      onSelect: (selection) =>
        setBlocks((list) => [
          ...list,
          {
            id: `q-${selection.segmentId}-${selection.start}`,
            kind: 'quote',
            text: selection.text.trim(),
            credit: seg(selection.segmentId)?.speaker?.name ?? '',
            sources: [selection.segmentId],
          },
        ]),
    },
    {
      id: 'context',
      label: 'Usar como contexto',
      icon: Paperclip,
      onSelect: (selection) => addContext(selection, false),
    },
    {
      id: 'ask',
      label: 'Perguntar à IA',
      icon: Sparkles,
      onSelect: (selection) => addContext(selection, true),
    },
  ];

  const activeBlock = blocks.find(
    (block) => 'sources' in block && activeId && block.sources.includes(activeId),
  );

  return (
    <div className={x.studio}>
      <div className={x.source}>
        <TranscriptViewer
          label="Transcrição da entrevista"
          segments={SEGMENTS}
          query={query}
          onQueryChange={setQuery}
          speakerFilter={speaker}
          onSpeakerFilterChange={setSpeaker}
          activeId={activeId}
          usedIds={usedIds}
          onSegmentClick={(segment) => setActiveId(segment.id)}
          selectionActions={actions}
          height="100%"
        />
      </div>
      <div className={x.text}>
        <Prose variant="read" measure="wide" align="start" label="Texto da reportagem">
          {blocks.map((block) => {
            if (block.kind === 'h2') return <h2 key={block.id}>{block.text}</h2>;
            const lit = activeBlock?.id === block.id || undefined;
            const onPointerEnter = () => setActiveId(block.sources[0] ?? null);
            if (block.kind === 'quote')
              return (
                <figure key={block.id} onPointerEnter={onPointerEnter}>
                  <blockquote>
                    <p>
                      <span data-source-active={lit}>{block.text}</span>
                    </p>
                  </blockquote>
                  <figcaption>{block.credit}</figcaption>
                </figure>
              );
            return (
              <p key={block.id} onPointerEnter={onPointerEnter}>
                <span data-source-active={lit}>{block.text}</span>
              </p>
            );
          })}
        </Prose>
        {context.length > 0 && (
          <div className={x.context} role="group" aria-label="Contexto do copiloto">
            {context.map((item) => (
              <SourceChip
                key={item.key}
                kind="excerpt"
                label={excerptLabel(item.selection)}
                meta={seg(item.selection.segmentId)?.speaker?.name}
                state={item.ask ? 'selected' : 'default'}
                preview={`“${item.selection.text.trim()}”`}
                onRemove={() =>
                  setContext((items) => items.filter((other) => other.key !== item.key))
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const noop = () => {};
const ACTIONS: TranscriptAction[] = [
  { id: 'quote', label: 'Inserir citação', icon: Quote, onSelect: noop },
  { id: 'context', label: 'Usar como contexto', icon: Paperclip, onSelect: noop },
  { id: 'ask', label: 'Perguntar à IA', icon: Sparkles, onSelect: noop },
];
const PAIR = [seg('t05'), seg('t06')];
const one = (force?: string) => [{ ...seg('t05'), force }];

/** Uma fala parada por célula (prévia compacta, clicável). */
function Still({
  force,
  activeId,
  usedIds,
}: {
  force?: string;
  activeId?: string;
  usedIds?: string[];
}) {
  return (
    <TranscriptViewer
      label="Fala"
      variant="compact"
      segments={one(force)}
      activeId={activeId}
      usedIds={usedIds}
      onSegmentClick={noop}
    />
  );
}

function SearchState() {
  const [query, setQuery] = useState('couro');
  return (
    <TranscriptViewer
      label="Busca na transcrição"
      segments={SEGMENTS.slice(1, 4)}
      query={query}
      onQueryChange={setQuery}
      height={300}
    />
  );
}

function FilterState() {
  const [speaker, setSpeaker] = useState<string | null>('clara');
  return (
    <TranscriptViewer
      label="Falas de Clara Souto"
      segments={SEGMENTS.slice(0, 6)}
      speakerFilter={speaker}
      onSpeakerFilterChange={setSpeaker}
      height={300}
    />
  );
}

function LongTranscript() {
  const [query, setQuery] = useState('');
  return (
    <TranscriptViewer
      label="Transcrição longa"
      segments={LONG}
      query={query}
      onQueryChange={setQuery}
      height={360}
    />
  );
}

function Transcricao() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="md">
        <Studio />
      </Shot>

      <Shot title="Variantes" tone="white" align="stretch" pad="md">
        <States min={300}>
          <State label="Com tempo">
            <div className={x.frame}>
              <TranscriptViewer label="Com tempo" segments={SEGMENTS.slice(0, 8)} height={360} />
            </div>
          </State>
          <State label="Sem tempo">
            <div className={x.frame}>
              <TranscriptViewer label="Sem tempo" segments={UNTIMED} height={360} />
            </div>
          </State>
          <State label="Sem falantes">
            <div className={x.frame}>
              <TranscriptViewer label="Texto colado" segments={PLAIN} height={360} />
            </div>
          </State>
          <State label="Prévia">
            <TranscriptViewer
              label="Prévia da transcrição"
              variant="compact"
              segments={SEGMENTS}
              limit={3}
              onExpand={noop}
            />
          </State>
          <State label="Longa, 1.200 falas">
            <div className={x.frame}>
              <LongTranscript />
            </div>
          </State>
        </States>
      </Shot>

      <Shot title="Estados" tone="white" align="stretch" pad="md">
        <States min={260}>
          <State label="Repouso">
            <Still />
          </State>
          <State label="Hover">
            <Still force="hover" />
          </State>
          <State label="Pressionado">
            <Still force="active" />
          </State>
          <State label="Foco">
            <Still force="focus" />
          </State>
          <State label="Ativa">
            <Still activeId="t05" />
          </State>
          <State label="Usada">
            <Still usedIds={['t05']} />
          </State>
          <State label="Seleção" span={2}>
            <TranscriptViewer
              label="Seleção"
              variant="compact"
              segments={PAIR}
              selectionActions={ACTIONS}
              pinnedSelection={{
                segmentId: 't06',
                start: 0,
                end: 47,
                text: seg('t06').text.slice(0, 47),
              }}
            />
          </State>
        </States>
      </Shot>

      <Shot title="Estados do painel" tone="white" align="stretch" pad="md">
        <States min={300}>
          <State label="Busca">
            <div className={x.frame}>
              <SearchState />
            </div>
          </State>
          <State label="Filtro">
            <div className={x.frame}>
              <FilterState />
            </div>
          </State>
          <State label="Carregando">
            <div className={x.frame}>
              <TranscriptViewer label="Transcrição" segments={[]} loading height={300} />
            </div>
          </State>
          <State label="Vazia">
            <div className={x.frame}>
              <TranscriptViewer label="Transcrição" segments={[]} height={300} />
            </div>
          </State>
          <State label="Erro">
            <div className={x.frame}>
              <TranscriptViewer
                label="Transcrição"
                segments={[]}
                error="Não foi possível abrir a transcrição"
                onRetry={noop}
                height={300}
              />
            </div>
          </State>
        </States>
      </Shot>

      <Shot title="Celular" align="center" pad="md">
        <Phone label="Celular, 390" height={680}>
          <TranscriptViewer
            label="Transcrição da entrevista"
            segments={SEGMENTS}
            usedIds={['t02', 't03', 't05']}
            activeId="t05"
            selectionActions={ACTIONS}
            onSegmentClick={noop}
            height="100%"
          />
        </Phone>
      </Shot>
    </Shots>
  );
}

export const specimens: Record<string, ComponentType> = {
  transcricao: Transcricao,
};
