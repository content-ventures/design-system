'use client';

import { useState, type ComponentType } from 'react';
import {
  Badge,
  Button,
  DialogFrame,
  List,
  ListItem,
  MetaList,
  PageHeader,
  Switch,
} from '@content-ventures/design-system/v3';
import { FileText, RotateCcw } from '@content-ventures/design-system/v3/icons';
import { DiffView, type DiffBlock } from '@content-ventures/design-system/v3/diff-view';
import { Seal } from '@content-ventures/design-system/v3/seal';
import { Phone, Shot, Shots, State, States } from '../stage';
import r from './revisao-diferencas.module.css';

/*
 * Revisão: DiffView (diferença entre versões, só apresentação) e Seal (selo de aprovação).
 * Contexto: Reporter IA — a v3 do artigo saiu da IA; Marina Lopes editou e João revisa a v4.
 * A prancha só arruma o palco; tudo o que aparece vem da biblioteca.
 */

const eq = (text: string) => ({ kind: 'equal' as const, text });
const ins = (text: string) => ({ kind: 'insert' as const, text });
const del = (text: string) => ({ kind: 'delete' as const, text });

/** Artigo v3 (IA) → v4 (João): blocos já comparados, como o produto entrega. */
const ARTICLE: DiffBlock[] = [
  {
    id: 'titulo',
    change: 'unchanged',
    type: 'title',
    hunks: [eq('Couro vegetal sai do nicho e chega às vitrines da Francal 2026')],
  },
  {
    id: 'fina',
    change: 'modified',
    type: 'lead',
    hunks: [
      eq('Fabricantes de médio porte '),
      del('dobram'),
      ins('ampliam em 40%'),
      eq(' a produção e usam a rastreabilidade para vender ao varejo europeu.'),
    ],
  },
  {
    id: 'p1',
    change: 'unchanged',
    hunks: [
      eq(
        'Na abertura da feira, a Aurora Calçados apresentou a primeira linha feita inteiramente com couro de cacto.',
      ),
    ],
  },
  {
    id: 'p2',
    change: 'modified',
    hunks: [
      del('Segundo Clara Souto, diretora de produto, a meta'),
      ins('A meta, diz Clara Souto, diretora de produto,'),
      eq(' é chegar a '),
      del('25%'),
      ins('30%'),
      eq(' do catálogo até o fim de 2027.'),
    ],
  },
  {
    id: 'p3',
    change: 'unchanged',
    hunks: [
      eq('O material vem de fazendas no interior de Pernambuco e passa por curtimento sem cromo.'),
    ],
  },
  {
    id: 'p4',
    change: 'unchanged',
    hunks: [eq('A produção mensal saiu de 4 mil para 9 mil pares em um ano.')],
  },
  {
    id: 'h2',
    change: 'unchanged',
    type: 'h2',
    hunks: [eq('Rastreabilidade vira argumento de venda')],
  },
  {
    id: 'p5',
    change: 'unchanged',
    hunks: [eq('Compradores querem saber de onde vem cada peça.')],
  },
  {
    id: 'p6',
    change: 'modified',
    hunks: [
      eq('O selo de origem já é exigência em contratos com redes da Alemanha e da Holanda'),
      del(', e quem'),
      ins('. Quem'),
      eq(' não comprova a cadeia perde o pedido.'),
    ],
  },
  {
    id: 'citacao',
    change: 'added',
    type: 'quote',
    hunks: [eq('Não é mais tendência, é condição para exportar.')],
  },
  {
    id: 'p7',
    change: 'removed',
    hunks: [eq('O couro vegetal ainda é caro para o varejo brasileiro.')],
  },
  {
    id: 'h3',
    change: 'unchanged',
    type: 'h3',
    hunks: [eq('O que muda para o lojista')],
  },
  {
    id: 'p8',
    change: 'unchanged',
    hunks: [
      eq(
        'Para o varejo, a troca pesa pouco no preço final: a diferença fica entre 4% e 7% por par.',
      ),
    ],
  },
];

const BEFORE = { label: 'v3 · IA' };
const AFTER = { label: 'v4 · João' };
const EXCERPT = ARTICLE.slice(1, 4);

/* ——————————————————————————— Diferenças ——————————————————————————— */

function Review() {
  const [collapse, setCollapse] = useState(true);
  return (
    <div className={r.review}>
      <PageHeader
        variant="frame"
        titleAs="h2"
        title="Revisão · Couro vegetal chega às vitrines"
        status={
          <Badge variant="text" tone="violet">
            Aguardando aprovação
          </Badge>
        }
        meta={['v4', { value: '812 palavras', numeric: true }, 'Marina Lopes']}
        actions={
          <Switch checked={collapse} onCheckedChange={setCollapse} label="Recolher sem alteração" />
        }
      />
      <DiffView
        blocks={ARTICLE}
        before={BEFORE}
        after={AFTER}
        collapseUnchanged={collapse}
        context={1}
      />
    </div>
  );
}

const UNCHANGED: DiffBlock[] = ARTICLE.filter((block) => block.change === 'unchanged').slice(0, 3);

function Diferencas() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="lg">
        <Review />
      </Shot>

      <Shot title="Lado a lado" tone="white" align="stretch" pad="lg">
        <DiffView blocks={EXCERPT} before={BEFORE} after={AFTER} mode="split" />
      </Shot>

      <Shot title="Compacto" align="center" pad="md">
        <div className={r.compact}>
          <DiffView blocks={EXCERPT} before={BEFORE} after={AFTER} size="compact" />
        </div>
      </Shot>

      <Shot title="Estados" align="stretch" pad="md">
        <States min={280}>
          <State label="Carregando">
            <DiffView blocks={[]} before={BEFORE} after={AFTER} size="compact" loading />
          </State>
          <State label="Sem alterações">
            <DiffView
              blocks={UNCHANGED}
              before={BEFORE}
              after={{ label: 'v3 · cópia' }}
              size="compact"
              collapseUnchanged
            />
          </State>
          <State label="Recolhido, hover">
            <DiffView
              blocks={UNCHANGED}
              size="compact"
              summary={false}
              collapseUnchanged
              data-force="hover"
            />
          </State>
          <State label="Recolhido, pressionado">
            <DiffView
              blocks={UNCHANGED}
              size="compact"
              summary={false}
              collapseUnchanged
              data-force="active"
            />
          </State>
          <State label="Recolhido, foco">
            <DiffView
              blocks={UNCHANGED}
              size="compact"
              summary={false}
              collapseUnchanged
              data-force="focus"
            />
          </State>
        </States>
      </Shot>

      <Shot title="Celular" align="center" pad="md">
        <Phone label="Celular, 390">
          <div className={r.phoneBody}>
            <DiffView
              blocks={ARTICLE}
              before={BEFORE}
              after={AFTER}
              collapseUnchanged
              context={1}
            />
          </div>
        </Phone>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Selo ——————————————————————————— */

/** O momento da aprovação: o botão dá lugar ao selo, que entra com mola. */
function ApproveRow() {
  const [approved, setApproved] = useState(false);
  return (
    <div className={r.decision}>
      <MetaList
        size="sm"
        items={['v4', { value: '812 palavras', numeric: true }, 'Revisão de João']}
      />
      {approved ? (
        <p className={r.approved}>
          <Seal label="" />
          <span>Versão 4 aprovada</span>
          <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => setApproved(false)}>
            Recomeçar
          </Button>
        </p>
      ) : (
        <Button variant="primary" onClick={() => setApproved(true)}>
          Aprovar versão 4
        </Button>
      )}
    </div>
  );
}

const FILES = [
  { name: 'artigo-v4.md', meta: 'v4 · aprovado por João · 09/10 14:32' },
  { name: 'artigo-v4.html', meta: 'v4 · aprovado por João · 09/10 14:32' },
  { name: 'carrossel-v2.json', meta: 'v2 · aprovado por João · 09/10 15:05' },
];

function Selo() {
  const [round, setRound] = useState(0);
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="lg">
        <ApproveRow />
      </Shot>

      <Shot title="Tamanhos" align="center" pad="md">
        <States columns={3} align="center">
          <State label="sm 16">
            <Seal label="Aprovado" size="sm" still />
          </State>
          <State label="md 20">
            <Seal label="Aprovado" still />
          </State>
          <State label="lg 40">
            <Seal label="Aprovado" size="lg" still />
          </State>
        </States>
      </Shot>

      <Shot
        title="Entrada"
        align="center"
        pad="md"
        aside={
          <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => setRound((n) => n + 1)}>
            Repetir
          </Button>
        }
      >
        <States columns={3} align="center">
          <State label="sm">
            <Seal key={`sm-${round}`} label="Aprovado" size="sm" />
          </State>
          <State label="md">
            <Seal key={`md-${round}`} label="Aprovado" />
          </State>
          <State label="lg">
            <Seal key={`lg-${round}`} label="Aprovado" size="lg" />
          </State>
        </States>
      </Shot>

      <Shot title="Confirmação" align="center" pad="md">
        <DialogFrame
          size="sm"
          divided={false}
          leading={<Seal label="" size="lg" still />}
          title="Versão 4 aprovada"
          description="O carrossel usará esta versão."
          footer={
            <>
              <Button>Fechar</Button>
              <Button variant="primary">Gerar carrossel</Button>
            </>
          }
        />
      </Shot>

      <Shot title="Entrega" align="center" pad="md">
        <div className={r.files}>
          <List label="Pacote">
            {FILES.map((file) => (
              <ListItem
                key={file.name}
                icon={FileText}
                title={file.name}
                description={file.meta}
                trailing={<Seal label="Aprovado" size="sm" still />}
              />
            ))}
          </List>
        </div>
      </Shot>
    </Shots>
  );
}

export const specimens: Record<string, ComponentType> = {
  diferencas: Diferencas,
  selo: Selo,
};
