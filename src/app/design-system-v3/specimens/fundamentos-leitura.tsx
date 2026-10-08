'use client';

import type { ComponentType, ReactNode } from 'react';
import {
  Badge,
  DescriptionList,
  MetaList,
  VisuallyHidden,
  formatRelative,
  textStats,
} from '@content-ventures/design-system/v3';
import { Phone, Shot, Shots, State, States } from '../stage';
import r from './fundamentos-leitura.module.css';

/*
 * Leitura (fundamentos): a escala de texto corrido, o itálico real, os papéis neutros de diferença
 * e os marca-textos do editor. A prancha só aplica tokens; o componente de texto vem da biblioteca.
 * Contexto: Reporter IA — uma jornalista transforma a transcrição de uma entrevista em artigo.
 */

/** Relógio fixo: a mesma string no servidor e no navegador. */
const NOW = new Date(2026, 9, 7, 15, 30);
const EDITED = new Date(2026, 9, 7, 13, 12);

const ARTICLE = {
  title: 'Couro vegetal sai do nicho e chega às vitrines da Francal 2026',
  lead: 'Fabricantes de médio porte dobram a produção e usam a rastreabilidade para vender ao varejo europeu.',
  p1: 'Na abertura da feira, a Aurora Calçados apresentou a primeira linha feita inteiramente com couro de cacto. Segundo Clara Souto, diretora de produto, a meta é chegar a 30% do catálogo até o fim de 2027.',
  h2: 'Rastreabilidade vira argumento de venda',
  p2: 'Compradores querem saber de onde vem cada peça. O selo de origem já é exigência em contratos com redes da Alemanha e da Holanda, e quem não comprova a cadeia perde o pedido.',
  quote:
    'Não é mais tendência, é condição para exportar. Quem não rastreia a cadeia fica fora da conversa.',
  cite: 'Clara Souto, diretora de produto da Aurora Calçados',
  h3: 'O que muda para o lojista',
  p3: 'Para o varejo, a troca pesa pouco no preço final: a diferença fica entre 4% e 7% por par, segundo a Ateliê Sul.',
};

const PLAIN = Object.values(ARTICLE).join('\n');
const STATS = textStats(PLAIN);

/** O artigo com a escala de leitura (em coluna estreita, o título desce para 24/32). */
function Article() {
  return (
    <article className={r.article}>
      <MetaList
        size="sm"
        label="Situação do texto"
        items={[
          <Badge key="s" variant="text" tone="gray" dot>
            Rascunho
          </Badge>,
          `Editado ${formatRelative(EDITED, NOW)}`,
          { value: `${STATS.words} palavras`, numeric: true },
          { value: `${STATS.readingMinutes} min de leitura`, numeric: true },
        ]}
      />
      <h1 className={r.title}>{ARTICLE.title}</h1>
      <p className={r.lead}>{ARTICLE.lead}</p>
      <p className={r.body}>
        Na abertura da feira, a Aurora Calçados apresentou a primeira linha feita{' '}
        <em>inteiramente</em> com couro de cacto. Segundo Clara Souto, diretora de produto, a meta é
        chegar a{' '}
        <mark className={r.mark} data-tone="yellow">
          <strong>30% do catálogo</strong>
        </mark>{' '}
        até o fim de 2027.
      </p>
      <h2 className={r.h2}>{ARTICLE.h2}</h2>
      <p className={r.body}>{ARTICLE.p2}</p>
      <figure className={r.quote}>
        <blockquote>
          <p>{ARTICLE.quote}</p>
        </blockquote>
        <figcaption className={r.caption}>{ARTICLE.cite}</figcaption>
      </figure>
      <h3 className={r.h3}>{ARTICLE.h3}</h3>
      <p className={r.body}>
        Para o varejo, a troca pesa pouco no preço final: a diferença fica entre 4% e 7% por par,
        segundo a <em>Ateliê Sul</em>.
      </p>
    </article>
  );
}

type ProseRow = { role: string; token: string; spec: string; sample: ReactNode; kind: string };

const PROSE_ROWS: ProseRow[] = [
  {
    role: 'Título',
    token: '--t-prose-title',
    spec: '600 28/36',
    sample: 'Couro vegetal chega às vitrines',
    kind: 'title',
  },
  { role: 'Intertítulo', token: '--t-prose-h2', spec: '600 22/30', sample: ARTICLE.h2, kind: 'h2' },
  { role: 'Subtítulo', token: '--t-prose-h3', spec: '600 18/26', sample: ARTICLE.h3, kind: 'h3' },
  {
    role: 'Linha fina',
    token: '--t-prose-lead',
    spec: '400 18/28',
    sample: 'Fabricantes dobram a produção',
    kind: 'lead',
  },
  {
    role: 'Corpo',
    token: '--t-prose-body',
    spec: '400 16/28',
    sample: 'Compradores querem saber de onde vem cada peça.',
    kind: 'body',
  },
  {
    role: 'Citação',
    token: '--t-prose-quote',
    spec: 'itálico 400 18/30',
    sample: 'Não é mais tendência, é condição.',
    kind: 'quote',
  },
  {
    role: 'Legenda',
    token: '--t-prose-caption',
    spec: '400 13/20',
    sample: 'Estande da Aurora Calçados. Foto: Tiago Rezende',
    kind: 'caption',
  },
];

const ITALIC_ROWS = [
  { weight: '400', label: 'Regular' },
  { weight: '500', label: 'Médio' },
  { weight: '600', label: 'Semibold' },
] as const;

const MARKS = [
  { tone: 'yellow', label: 'Amarelo', token: '--mark-yellow-bg' },
  { tone: 'green', label: 'Verde', token: '--mark-green-bg' },
  { tone: 'pink', label: 'Rosa', token: '--mark-pink-bg' },
] as const;

const RELATIVE = [
  { label: '40 segundos antes', at: new Date(NOW.getTime() - 40_000) },
  { label: '2 minutos antes', at: new Date(NOW.getTime() - 2 * 60_000) },
  { label: '2 horas antes', at: new Date(NOW.getTime() - 2 * 3_600_000) },
  { label: 'Ontem, 09:00', at: new Date(2026, 9, 6, 9, 0) },
  { label: '3 dias antes', at: new Date(2026, 9, 4, 11, 0) },
  { label: '30/09/2026', at: new Date(2026, 8, 30, 10, 0) },
  { label: '12/10/2025', at: new Date(2025, 9, 12, 10, 0) },
];

function Leitura() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="lg">
        <Article />
      </Shot>

      <Shot title="Escala" tone="white" align="stretch" pad="md">
        <div className={r.scale}>
          {PROSE_ROWS.map((row) => (
            <div key={row.token} className={r.scaleRow}>
              <div className={r.scaleMeta}>
                <span className={r.scaleRole}>{row.role}</span>
                <span className={r.scaleSpec}>
                  <span>{row.token}</span>
                  <span>{row.spec}</span>
                </span>
              </div>
              <span className={r.scaleSample} data-kind={row.kind}>
                {row.sample}
              </span>
            </div>
          ))}
        </div>
      </Shot>

      <Shot title="Itálico" tone="white" align="stretch" pad="md">
        <States min={220}>
          {ITALIC_ROWS.map((row) => (
            <State key={row.weight} label={`${row.label} ${row.weight}`}>
              <span className={r.italic} data-weight={row.weight}>
                <span>Entrevista com Clara Souto</span>
                <em>Entrevista com Clara Souto</em>
              </span>
            </State>
          ))}
        </States>
      </Shot>

      <Shot title="Diferença" tone="white" align="stretch" pad="md">
        <States min={260}>
          <State label="Inserção e remoção">
            <p className={r.diff}>
              A meta é chegar a{' '}
              <del>
                <VisuallyHidden>Removido: </VisuallyHidden>25%
              </del>
              <ins>
                <VisuallyHidden>Inserido: </VisuallyHidden>30%
              </ins>{' '}
              do catálogo até o fim de{' '}
              <del>
                <VisuallyHidden>Removido: </VisuallyHidden>2026
              </del>
              <ins>
                <VisuallyHidden>Inserido: </VisuallyHidden>2027
              </ins>
              .
            </p>
          </State>
          <State label="Inserção">
            <p className={r.diff}>
              <ins>
                <VisuallyHidden>Inserido: </VisuallyHidden>Quem não comprova a cadeia perde o
                pedido.
              </ins>
            </p>
          </State>
          <State label="Remoção">
            <p className={r.diff}>
              <del>
                <VisuallyHidden>Removido: </VisuallyHidden>O couro vegetal ainda é caro.
              </del>
            </p>
          </State>
        </States>
      </Shot>

      <Shot title="Marca-texto" tone="white" align="stretch" pad="md">
        <States min={200}>
          {MARKS.map((mark) => (
            <State key={mark.tone} label={mark.label}>
              <p className={r.diff}>
                meta de{' '}
                <mark className={r.mark} data-tone={mark.tone}>
                  30% do catálogo
                </mark>
              </p>
            </State>
          ))}
        </States>
      </Shot>

      <Shot title="Tempo e contagem" tone="white" align="stretch" pad="md">
        <div className={r.pair}>
          <DescriptionList
            label="Tempo relativo"
            labelWidth={160}
            items={RELATIVE.map((row) => ({
              label: row.label,
              value: formatRelative(row.at, NOW),
              numeric: true,
            }))}
          />
          <DescriptionList
            label="Contagem do artigo"
            labelWidth={160}
            items={[
              { label: 'Palavras', value: String(STATS.words), numeric: true },
              {
                label: 'Caracteres',
                value: STATS.characters.toLocaleString('pt-BR'),
                numeric: true,
              },
              { label: 'Leitura', value: `${STATS.readingMinutes} min`, numeric: true },
            ]}
          />
        </div>
      </Shot>

      <Shot title="Celular" align="center" pad="md">
        <Phone label="Celular, 390">
          <div className={r.phoneBody}>
            <Article />
          </div>
        </Phone>
      </Shot>
    </Shots>
  );
}

export const specimens: Record<string, ComponentType> = {
  leitura: Leitura,
};
