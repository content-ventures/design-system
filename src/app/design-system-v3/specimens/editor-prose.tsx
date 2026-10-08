'use client';

import {
  memo,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type FormEvent,
  type ReactNode,
} from 'react';
import { Badge, Card, MetaList, proseWidgets, textStats } from '@content-ventures/design-system/v3';
import { EditableTitle } from '@content-ventures/design-system/v3/editable-title';
import { Prose } from '@content-ventures/design-system/v3/prose';
import { Phone, Shot, Shots, State, States } from '../stage';
import r from './editor-prose.module.css';

/*
 * Editor (texto): `Prose` e `EditableTitle`. Contexto: Reporter IA — uma jornalista transforma a
 * transcrição de uma entrevista em artigo. O texto “em edição” imita o DOM que o TipTap entrega
 * (`.ProseMirror`, nós vazios com `is-empty` + `data-placeholder`); a prancha só arruma o palco.
 * Os widgets (proposta da IA, cursor parado, esqueleto, marcador da calha) vêm de `proseWidgets`,
 * montados como o `Decoration.widget` faz no editor.
 */

const TITLE = 'Ateliê Sul troca o couro novo pelo reaproveitado e mira a Europa';
const LEAD =
  'Em entrevista ao Reporter, a fundadora Juliana Prates conta como a marca gaúcha refez a cadeia de fornecedores em 18 meses.';
const P1 =
  'A Ateliê Sul nasceu em 2014 numa garagem de Novo Hamburgo, com três costureiras e uma máquina emprestada. Hoje são 42 pessoas e 1.800 pares por mês, metade feitos com sobras de curtumes da região.';
const H2 = 'Rastreio como argumento de venda';
const QUOTE =
  'Ninguém compra mais só o sapato. O cliente quer saber de onde veio o couro, quem costurou e quanto isso custou para a cidade.';
const CREDIT = 'Juliana Prates, fundadora da Ateliê Sul';
const P_AI =
  'Para responder a essa exigência, a empresa passou a registrar cada lote numa planilha compartilhada com os curtumes parceiros. O sistema é simples, mas permite responder a um comprador em menos de um dia.';
const LIST_INTRO = 'As mudanças que mais pesaram, segundo ela:';
const LIST = [
  'contrato de exclusividade com dois curtumes de Estância Velha;',
  'etiqueta com QR code em todos os pares desde março;',
  'treino das costureiras para separar as sobras por cor e espessura.',
];
const H3 = 'O que vem em 2027';

const PLAIN = [TITLE, P1, QUOTE, P_AI, LIST_INTRO, ...LIST, H2, H3].join('\n');
const STATS = textStats(PLAIN);

/* ——— Widgets da fábrica, montados como no editor ——— */

/**
 * Põe o nó de `make` antes de uma âncora vazia, como o `Decoration.widget` do ProseMirror: o nó não é
 * do React (não redesenha por cima) e sai quando a prancha desmonta.
 */
function Widget({ make }: { make: () => HTMLElement }) {
  const anchor = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = make();
    anchor.current?.before(node);
    return () => node.remove();
  }, [make]);
  return <span ref={anchor} hidden />;
}

/** Clicar no marcador revisa o bloco (no produto, abre “Marcar como revisado”). */
function markReviewed(event: Event) {
  const marker = event.currentTarget as HTMLElement;
  marker.closest('[data-ai]')?.setAttribute('data-ai', 'reviewed');
  marker.remove();
}

const forced = (node: HTMLElement, force?: string) => {
  if (force) node.setAttribute('data-force', force);
  return node;
};
const makeInsertion = () => proseWidgets.insertion('8\u00a0mil');
const makeStreaming = () => proseWidgets.insertion('chegar a lojas da Europa', { streaming: true });
const makeStaleInsertion = () => proseWidgets.insertion('8 mil', { stale: true });
const makeMarker = () => proseWidgets.gutterMarker('ai', { onActivate: markReviewed });
const makeSkeleton = () => proseWidgets.skeleton(3);
const MARKER_STATES = [
  ['Repouso', () => proseWidgets.gutterMarker('ai')],
  ['Hover (dica)', () => forced(proseWidgets.gutterMarker('ai'), 'hover')],
  ['Pressionado', () => forced(proseWidgets.gutterMarker('ai'), 'active')],
  ['Foco (dica)', () => forced(proseWidgets.gutterMarker('ai', { focusable: true }), 'focus')],
] as const;

/* ——— Texto em edição: DOM no formato do ProseMirror ——— */

/** Simula a extensão Placeholder: o nó vazio ganha `is-empty` (o TipTap faz isso no produto). */
function syncPlaceholders(event: FormEvent<HTMLDivElement>) {
  event.currentTarget.querySelectorAll<HTMLElement>('[data-placeholder]').forEach((node) => {
    node.classList.toggle('is-empty', !node.textContent);
  });
}

/**
 * Documento editável. Memorizado: o navegador muda o DOM enquanto se digita e o React não pode
 * redesenhar por cima (o editor de verdade cuida disso no produto).
 */
const EditableArticle = memo(function EditableArticle({ short = false }: { short?: boolean }) {
  return (
    <div
      className="ProseMirror"
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label="Texto do artigo"
      spellCheck={false}
      onInput={syncPlaceholders}
    >
      <p>{P1}</p>
      <p>
        A virada veio em 2024, quando um comprador holandês pediu a origem de cada lote. Sem
        rastreio, o pedido de <span data-suggestion="delete">6&nbsp;mil</span>
        <Widget make={makeInsertion} /> pares iria para outra marca. Foi ali, diz Juliana Prates,
        fundadora da empresa, que{' '}
        <mark data-tone="yellow">a cadeia de fornecedores virou parte do produto</mark>.
      </p>
      <h2>{H2}</h2>
      <blockquote>
        <p>{QUOTE}</p>
      </blockquote>
      <p data-ai="unreviewed" aria-description="Texto da IA, não revisado">
        <Widget make={makeMarker} />
        {P_AI}
      </p>
      {!short && (
        <>
          <p>{LIST_INTRO}</p>
          <ul>
            {LIST.map((item) => (
              <li key={item}>
                <p>{item}</p>
              </li>
            ))}
          </ul>
          <h3>{H3}</h3>
          <p>
            A meta é abrir uma loja em Lisboa e chegar a{' '}
            <mark data-tone="green">30% das vendas fora do Brasil</mark>. Segundo o{' '}
            <a href="#leitura">Observatório do Calçado</a>, só 4% das marcas gaúchas de pequeno
            porte exportam hoje.
          </p>
          <p className="is-empty" data-placeholder="Escreva o próximo parágrafo ou peça à IA">
            <br />
          </p>
        </>
      )}
    </div>
  );
});

/** Título do artigo vivo: Enter salva, Esc desfaz; “Salvando” por 900 ms depois de salvar. */
function useSavedTitle(initial: string) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const commit = (next: string) => {
    setValue(next);
    setSaving(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSaving(false), 900);
  };
  return { value, saving, commit };
}

function StudioHeader({ short = false }: { short?: boolean }) {
  const title = useSavedTitle(TITLE);
  return (
    <>
      <EditableTitle
        size="document"
        label="Título do artigo"
        value={title.value}
        saving={title.saving}
        maxLength={90}
        onCommit={title.commit}
      />
      <MetaList
        size="sm"
        label="Situação do texto"
        items={[
          <Badge key="s" variant="text" tone="gray" dot>
            Rascunho
          </Badge>,
          { value: `${STATS.words} palavras`, numeric: true },
          short ? null : { value: `${STATS.readingMinutes} min de leitura`, numeric: true },
          '1 bloco da IA a revisar',
        ]}
      />
    </>
  );
}

/* ——— Texto final (revisão, prévia) ——— */

function ReadArticle() {
  return (
    <>
      <h1>{TITLE}</h1>
      <p data-lead="">{LEAD}</p>
      <p>{P1}</p>
      <p>
        A virada veio em 2024, quando um comprador holandês pediu a origem de cada lote. Sem
        rastreio, o pedido de 8 mil pares iria para outra marca. Foi ali, diz Juliana Prates, que a
        cadeia de fornecedores virou <em>parte do produto</em>.
      </p>
      <h2>{H2}</h2>
      <figure>
        <blockquote>
          <p>{QUOTE}</p>
        </blockquote>
        <figcaption>{CREDIT}</figcaption>
      </figure>
      <p>{P_AI}</p>
      <p>{LIST_INTRO}</p>
      <ol>
        {LIST.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
      <h3>{H3}</h3>
      <p>
        A meta é abrir uma loja em Lisboa e chegar a <strong>30% das vendas fora do Brasil</strong>.
        Segundo o <a href="#leitura">Observatório do Calçado</a>, só 4% das marcas gaúchas de
        pequeno porte exportam hoje.
      </p>
    </>
  );
}

/* ——— Prancha: Texto corrido ——— */

function TextoCorrido() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="none">
        <div className={r.scroll}>
          <Prose variant="edit" label="Artigo" header={<StudioHeader />}>
            <EditableArticle />
          </Prose>
        </div>
      </Shot>

      <Shot title="Escrita com IA" tone="white" align="stretch" pad="none">
        <Prose variant="edit" label="Artigo em escrita" overscroll={false}>
          <WritingArticle />
        </Prose>
      </Shot>

      <Shot title="Marcador da IA" tone="white" align="stretch" pad="md">
        <States min={220}>
          {MARKER_STATES.map(([label, make]) => (
            <State key={label} label={label}>
              <Prose variant="edit" measure="wide" align="start" overscroll={false}>
                <p data-ai="unreviewed">
                  <Widget make={make} />
                  Texto da IA a revisar.
                </p>
              </Prose>
            </State>
          ))}
        </States>
      </Shot>

      <Shot title="Leitura" tone="white" align="stretch" pad="lg">
        <Prose variant="read" as="article" label="Texto final">
          <ReadArticle />
        </Prose>
      </Shot>

      <Shot title="Variantes" tone="white" align="stretch" pad="md">
        <States min={320}>
          <State label="Compacto">
            <Card padding="md" className={r.fill}>
              <Prose variant="compact" measure="wide">
                <h3>{H2}</h3>
                <p>Compradores europeus pedem a origem de cada lote antes de fechar o pedido.</p>
                <blockquote>
                  <p>Ninguém compra mais só o sapato.</p>
                </blockquote>
                <ul>
                  <li>contrato com dois curtumes;</li>
                  <li>QR code em todos os pares.</li>
                </ul>
              </Prose>
            </Card>
          </State>
          <State label="Trabalho (sm)">
            <Prose variant="read" size="sm" measure="wide">
              <h2>{H2}</h2>
              <p>Compradores europeus pedem a origem de cada lote antes de fechar o pedido.</p>
              <blockquote>
                <p>Ninguém compra mais só o sapato.</p>
              </blockquote>
            </Prose>
          </State>
          <State label="Ampliado">
            <Prose variant="read" size="lg" measure="wide">
              <h2>{H2}</h2>
              <p>Compradores europeus pedem a origem de cada lote antes de fechar o pedido.</p>
              <blockquote>
                <p>Ninguém compra mais só o sapato.</p>
              </blockquote>
            </Prose>
          </State>
        </States>
      </Shot>

      <Shot title="Ganchos" tone="white" align="stretch" pad="md">
        <States min={260}>
          <State label="Marca-texto">
            <Hook>
              <p>
                <mark>amarelo</mark>, <mark data-tone="green">verde</mark> e{' '}
                <mark data-tone="pink">rosa</mark> marcam trechos.
              </p>
            </Hook>
          </State>
          <State label="IA a revisar (leitura: nada)">
            <Hook>
              <p data-ai="unreviewed">
                O sistema permite responder a um comprador em menos de um dia.
              </p>
            </Hook>
          </State>
          <State label="Citação que não bate">
            <Hook>
              <p>
                “<span data-source-state="missing">Errar no protótipo virou algo barato</span>”, diz
                Helena.
              </p>
            </Hook>
          </State>
          <State label="Fonte acesa">
            <Hook>
              <p>
                <span data-source-active="">
                  Hoje são 42 pessoas e 1.800 pares por mês, metade com sobras de curtumes.
                </span>
              </p>
            </Hook>
          </State>
          <State label="Sugestão">
            <Hook>
              <p>
                O pedido de <del>6 mil</del>
                <ins>8 mil</ins> pares iria para outra marca.
              </p>
            </Hook>
          </State>
          <State label="Sugestão desatualizada">
            <Hook>
              <p>
                O pedido de{' '}
                <span data-suggestion="delete" data-stale="">
                  6 mil
                </span>
                <Widget make={makeStaleInsertion} /> pares iria para outra marca.
              </p>
            </Hook>
          </State>
          <State label="Fonte desatualizada">
            <Hook>
              <p>
                Segundo ela, <span data-stale="">a meta é chegar a 30% das vendas</span> fora do
                Brasil.
              </p>
            </Hook>
          </State>
          <State label="Placeholder">
            <Hook>
              <div className="ProseMirror">
                <h2 className="is-empty" data-placeholder="Intertítulo">
                  <br />
                </h2>
                <p className="is-empty" data-placeholder="Escreva o próximo parágrafo ou peça à IA">
                  <br />
                </p>
              </div>
            </Hook>
          </State>
          <State label="Nó selecionado">
            <Hook>
              <p>Fim da primeira parte.</p>
              <hr className="ProseMirror-selectednode" />
              <p>Começo da segunda.</p>
            </Hook>
          </State>
        </States>
      </Shot>

      <Shot title="Imagem" tone="white" align="stretch" pad="md">
        <States min={260}>
          <State label="Indisponível">
            <Hook>
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element -- figura sem arquivo: o Prose desenha o estado */}
                <img
                  data-missing=""
                  alt="Costureira separa sobras de couro"
                  width={640}
                  height={400}
                />
                <figcaption>Sobras separadas por cor — Foto: Ateliê Sul</figcaption>
              </figure>
            </Hook>
          </State>
          <State label="Carregando">
            <Hook>
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element -- figura sem arquivo: o Prose desenha o estado */}
                <img data-loading="" alt="Fachada da fábrica" width={640} height={400} />
                <figcaption>Fábrica em Novo Hamburgo — Foto: Ateliê Sul</figcaption>
              </figure>
            </Hook>
          </State>
          <State label="Sem tamanho conhecido">
            <Hook>
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element -- figura sem arquivo: o Prose desenha o estado */}
                <img data-missing="" alt="" />
              </figure>
            </Hook>
          </State>
          <State label="Sugerida">
            <Hook>
              <figure data-slot="" data-missing="" aria-roledescription="Sugestão de imagem">
                {/* eslint-disable-next-line @next/next/no-img-element -- imagem que ainda não existe: o Prose desenha o pedido */}
                <img data-missing="" alt="" />
                <figcaption>Esteira e sala de modelagem da fábrica</figcaption>
              </figure>
            </Hook>
          </State>
          <State label="Sugerida, vertical">
            <Hook>
              <figure
                data-slot=""
                data-missing=""
                data-orientation="portrait"
                aria-roledescription="Sugestão de imagem"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- imagem que ainda não existe: o Prose desenha o pedido */}
                <img data-missing="" alt="" width={448} height={560} />
                <figcaption>Tela do aplicativo com o estoque em tempo real</figcaption>
              </figure>
            </Hook>
          </State>
        </States>
      </Shot>

      <Shot title="Imagem em linha" tone="white" align="stretch" pad="md">
        <States min={300}>
          <State label="Entre parágrafos">
            <EditHook>
              <p>{P1}</p>
              <SlotLine subject="Peças impressas na bancada" />
              <p>{P_AI}</p>
            </EditHook>
          </State>
          {(
            [
              ['Repouso', undefined],
              ['Hover', 'hover'],
              ['Pressionado', 'active'],
              ['Arrastando um arquivo', 'over'],
              ['Foco', 'focus'],
            ] as const
          ).map(([label, force]) => (
            <State key={label} label={label}>
              <EditHook>
                <SlotLine subject="Esteira e sala de modelagem da fábrica" force={force} />
              </EditHook>
            </State>
          ))}
          <State label="Selecionada">
            <EditHook>
              <SlotLine subject="Esteira e sala de modelagem da fábrica" selected />
            </EditHook>
          </State>
          <State label="Assunto longo">
            <EditHook>
              <SlotLine subject="Juliana Prates na sala de corte, separando as sobras de couro por cor e espessura antes da costura" />
            </EditHook>
          </State>
          <State label="Leitura">
            <Hook>
              <SlotLine subject="Esteira e sala de modelagem da fábrica" />
            </Hook>
          </State>
          <State label="Compacto">
            <Card padding="md" className={r.fill}>
              <Prose variant="compact" measure="wide">
                <p>{LIST_INTRO}</p>
                <SlotLine subject="Etiqueta com QR code no forro" />
              </Prose>
            </Card>
          </State>
        </States>
      </Shot>

      <Shot title="Link" tone="white" align="stretch" pad="md">
        <States min={180}>
          {(
            [
              ['Repouso', undefined],
              ['Hover', 'hover'],
              ['Pressionado', 'active'],
              ['Foco', 'focus'],
            ] as const
          ).map(([label, force]) => (
            <State key={label} label={label}>
              <Hook>
                <p>
                  Dados do{' '}
                  <a href="#leitura" data-force={force}>
                    Observatório do Calçado
                  </a>
                  .
                </p>
              </Hook>
            </State>
          ))}
        </States>
      </Shot>

      <Shot title="Celular" align="center" pad="md">
        <Phone label="Celular, 390">
          <div className={r.phoneScroll}>
            <Prose variant="edit" label="Artigo" header={<StudioHeader short />}>
              <EditableArticle short />
            </Prose>
          </div>
        </Phone>
      </Shot>
    </Shots>
  );
}

/**
 * Escrita com a IA: proposta em linha depois do trecho riscado, bloco a revisar (glifo do atributo e
 * marcador clicável), seção sendo escrita com esqueleto, proposta chegando com o cursor parado,
 * citação que não bate e figura sem arquivo.
 */
const WritingArticle = memo(function WritingArticle() {
  return (
    <div
      className="ProseMirror"
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label="Texto do artigo"
      spellCheck={false}
    >
      <p>
        Sem rastreio, o pedido de <span data-suggestion="delete">6&nbsp;mil</span>
        <Widget make={makeInsertion} /> pares iria para outra marca.
      </p>
      <p data-ai="unreviewed" aria-description="Texto da IA, não revisado">
        A empresa passou a registrar cada lote numa planilha compartilhada com os curtumes.
      </p>
      <p data-ai="unreviewed" aria-description="Texto da IA, não revisado">
        <Widget make={makeMarker} />O sistema é simples, mas permite responder a um comprador em
        menos de um dia. Clique no marcador para revisar.
      </p>
      <p>
        “<span data-source-state="missing">Errar no protótipo virou algo barato</span>”, diz
        Juliana, sobre os primeiros pares.
      </p>
      <h2 data-ai="writing">{H3}</h2>
      <Widget make={makeSkeleton} />
      <p>
        A meta é <span data-suggestion="delete">abrir uma loja em Lisboa</span>
        <Widget make={makeStreaming} /> até o fim de 2027.
      </p>
      <figure>
        {/* eslint-disable-next-line @next/next/no-img-element -- figura sem arquivo: o Prose desenha o estado */}
        <img
          data-missing=""
          alt="Etiqueta com QR code costurada no forro"
          width={640}
          height={320}
        />
        <figcaption>Etiqueta com QR code — Foto: Ateliê Sul</figcaption>
      </figure>
    </div>
  );
});

/** Trecho de gancho: texto de leitura, com margem à esquerda como a calha da escrita. */
function Hook({ children }: { children: ReactNode }) {
  return (
    <div className={r.hook}>
      <Prose variant="read" measure="wide" align="start">
        {children}
      </Prose>
    </div>
  );
}

/** Trecho de gancho na escrita (`edit`, escala de trabalho): os estados que respondem ao ponteiro. */
function EditHook({ children }: { children: ReactNode }) {
  return (
    <div className={r.fill}>
      <Prose variant="edit" size="sm" measure="wide" align="start" overscroll={false}>
        {children}
      </Prose>
    </div>
  );
}

/**
 * Imagem sugerida em linha, como o editor a desenha (`figure[data-slot][data-display="line"]`): o
 * `img` vazio continua (o arquivo cai nele), o assunto vai na figcaption. `force` e `selected` são os
 * estados parados da prancha; no produto, `[data-over]` vem do arrasto e a seleção do ProseMirror.
 */
function SlotLine({
  subject,
  force,
  selected = false,
}: {
  subject: string;
  force?: 'hover' | 'active' | 'over' | 'focus';
  selected?: boolean;
}) {
  return (
    <figure
      data-slot=""
      data-missing=""
      data-display="line"
      data-force={force}
      className={selected ? 'ProseMirror-selectednode' : undefined}
      aria-roledescription="Sugestão de imagem"
      aria-label={`Imagem sugerida: ${subject}. Arraste uma imagem ou pressione Enter para escolher.`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- imagem que ainda não existe: o Prose desenha o pedido */}
      <img data-missing="" alt="" />
      <figcaption>{subject}</figcaption>
    </figure>
  );
}

/* ——— Prancha: Título editável ——— */

const SLIDES = [
  { id: 's1', title: 'Capa · Ateliê Sul', meta: 'Slide 1 de 6' },
  { id: 's2', title: '42 pessoas, 1.800 pares', meta: 'Slide 2 de 6' },
];

function SlideCard({ initial, meta }: { initial: string; meta: string }) {
  const title = useSavedTitle(initial);
  return (
    <Card padding="md" className={r.slide}>
      <EditableTitle
        size="card"
        label="Nome do slide"
        value={title.value}
        saving={title.saving}
        maxLength={40}
        onCommit={title.commit}
      />
      <MetaList size="xs" items={[{ value: meta, numeric: true }]} />
    </Card>
  );
}

function ProductionHead() {
  const title = useSavedTitle('Entrevista Ateliê Sul');
  return (
    <div className={r.head}>
      <EditableTitle
        size="page"
        label="Nome da produção"
        value={title.value}
        saving={title.saving}
        maxLength={60}
        onCommit={title.commit}
      />
      <MetaList items={['Artigo + carrossel', 'Juliana Prates', 'Editado há 2 h']} />
    </div>
  );
}

const noop = () => undefined;
const LONG = 'Ateliê Sul troca o couro novo pelo reaproveitado e mira o varejo da Europa em 2027';

function TituloEditavel() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="lg">
        <div className={r.context}>
          <ProductionHead />
          <div className={r.slides}>
            {SLIDES.map((slide) => (
              <SlideCard key={slide.id} initial={slide.title} meta={slide.meta} />
            ))}
          </div>
        </div>
      </Shot>

      <Shot title="Tamanhos" tone="white" align="stretch" pad="md">
        <States min={260} captions="end">
          <State label="Página">
            <EditableTitle
              size="page"
              label="Nome da produção"
              value="Entrevista Ateliê Sul"
              onCommit={noop}
            />
          </State>
          <State label="Documento">
            <EditableTitle
              size="document"
              label="Título do artigo"
              value="Couro reaproveitado"
              onCommit={noop}
            />
          </State>
          <State label="Cartão">
            <EditableTitle
              size="card"
              label="Nome do slide"
              value="Capa · Ateliê Sul"
              onCommit={noop}
            />
          </State>
        </States>
      </Shot>

      <Shot title="Estados" tone="white" align="stretch" pad="md">
        <States min={280}>
          <State label="Repouso">
            <EditableTitle label="Nome da produção" value="Entrevista Ateliê Sul" onCommit={noop} />
          </State>
          <State label="Hover">
            <EditableTitle
              label="Nome da produção"
              value="Entrevista Ateliê Sul"
              onCommit={noop}
              data-force="hover"
            />
          </State>
          <State label="Pressionado">
            <EditableTitle
              label="Nome da produção"
              value="Entrevista Ateliê Sul"
              onCommit={noop}
              data-force="active"
            />
          </State>
          <State label="Foco">
            <EditableTitle
              label="Nome da produção"
              value="Entrevista Ateliê Sul"
              onCommit={noop}
              data-force="focus"
            />
          </State>
          <State label="Editando">
            <EditableTitle
              label="Nome da produção"
              value="Entrevista Ateliê Sul"
              onCommit={noop}
              defaultEditing
            />
          </State>
          <State label="Perto do limite">
            <EditableTitle
              label="Nome da produção"
              value="Entrevista com a fundadora"
              maxLength={28}
              onCommit={noop}
              defaultEditing
            />
          </State>
          <State label="Inválido">
            <EditableTitle
              label="Nome da produção"
              value="Entrevista Ateliê Sul"
              error="Já existe uma produção com este nome"
              onCommit={noop}
              defaultEditing
            />
          </State>
          <State label="Salvando">
            <EditableTitle
              label="Nome da produção"
              value="Entrevista Ateliê Sul"
              onCommit={noop}
              saving
            />
          </State>
          <State label="Vazio">
            <EditableTitle label="Nome da produção" value="" onCommit={noop} />
          </State>
          <State label="Somente leitura">
            <EditableTitle
              label="Nome da produção"
              value="Entrevista Ateliê Sul"
              onCommit={noop}
              readOnly
            />
          </State>
        </States>
      </Shot>

      <Shot title="Celular" align="center" pad="md">
        <Phone label="Celular, 390">
          <div className={r.phoneBody}>
            <EditableTitle size="document" label="Título do artigo" value={LONG} onCommit={noop} />
            <EditableTitle
              size="document"
              label="Título do artigo"
              value={LONG}
              maxLength={90}
              onCommit={noop}
              defaultEditing
            />
          </div>
        </Phone>
      </Shot>
    </Shots>
  );
}

export const specimens: Record<string, ComponentType> = {
  'texto-corrido': TextoCorrido,
  'titulo-editavel': TituloEditavel,
};
