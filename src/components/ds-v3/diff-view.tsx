'use client';

import { useId, useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import { VisuallyHidden } from './a11y';
import { SkeletonText } from './feedback';
import { ArrowRight, FoldVertical, UnfoldVertical } from './icons';
import s from './diff-view.module.css';

/** Trecho de um bloco: igual nas duas versões, inserido na nova ou removido da antiga. */
export type DiffHunkKind = 'equal' | 'insert' | 'delete';
export type DiffHunk = { kind: DiffHunkKind; text: string };

/** O que aconteceu com o bloco inteiro. `added`/`removed` tratam trechos `equal` como inserção/remoção. */
export type DiffChange = 'added' | 'removed' | 'modified' | 'unchanged';

/** Papel do bloco no texto: decide só a tipografia de leitura (§3.1). Padrão `paragraph`. */
export type DiffBlockType =
  'title' | 'lead' | 'h2' | 'h3' | 'paragraph' | 'quote' | 'item' | 'caption';

export type DiffBlock = {
  id: string;
  change: DiffChange;
  hunks: DiffHunk[];
  type?: DiffBlockType;
};

/** Rótulo de uma versão no cabeçalho (“v3 · IA”, “v4 · João”). */
export type DiffVersion = { label: string };

export type DiffStats = {
  /** Palavras inseridas. */
  inserted: number;
  /** Palavras removidas. */
  deleted: number;
  /** Blocos com alguma mudança. */
  changed: number;
};

export type DiffViewProps = Omit<ComponentProps<'section'>, 'children'> & {
  /** Blocos já comparados pelo consumidor (o DS não calcula diferença). */
  blocks: DiffBlock[];
  before?: DiffVersion;
  after?: DiffVersion;
  /** `inline` (padrão): uma coluna com inserções e remoções no lugar. `split`: antes | depois. */
  mode?: 'inline' | 'split';
  /** Recolhe as sequências de blocos sem mudança num botão “Mostrar N blocos sem alteração”. */
  collapseUnchanged?: boolean;
  /** Blocos sem mudança que ficam visíveis ao lado de cada mudança quando recolhido. Padrão 0. */
  context?: number;
  /**
   * Resumo à direita do cabeçalho. Sem a prop, calcula “+42 −18 palavras · 3 blocos” a partir dos
   * trechos. `false` esconde.
   */
  summary?: ReactNode | false;
  /** `reading`: escala de leitura (16/28, ≈68ch). `compact`: corpo da interface (13/20), para cartões. */
  size?: 'reading' | 'compact';
  /** Esqueleto de texto no lugar dos blocos. */
  loading?: boolean;
  /** Nome da região. Padrão: “Diferenças entre <antes> e <depois>”. */
  label?: string;
  /** Prancha: estado parado dos botões de sequência recolhida (`hover`, `active`, `focus`). */
  'data-force'?: string;
};

const wordsIn = (text: string) => {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
};

/** Trechos efetivos: bloco inteiro inserido/removido marca também o que veio como `equal`. */
function hunksOf(block: DiffBlock): DiffHunk[] {
  const whole = block.change === 'added' ? 'insert' : block.change === 'removed' ? 'delete' : null;
  if (!whole) return block.hunks;
  return block.hunks.map((h): DiffHunk => (h.kind === 'equal' ? { kind: whole, text: h.text } : h));
}

const isChanged = (block: DiffBlock) =>
  block.change !== 'unchanged' || block.hunks.some((h) => h.kind !== 'equal');

/** Contagem de palavras inseridas/removidas e de blocos alterados. */
export function diffStats(blocks: DiffBlock[]): DiffStats {
  let inserted = 0;
  let deleted = 0;
  let changed = 0;
  for (const block of blocks) {
    if (isChanged(block)) changed += 1;
    for (const hunk of hunksOf(block)) {
      if (hunk.kind === 'insert') inserted += wordsIn(hunk.text);
      else if (hunk.kind === 'delete') deleted += wordsIn(hunk.text);
    }
  }
  return { inserted, deleted, changed };
}

const num = new Intl.NumberFormat('pt-BR');
const plural = (n: number, one: string, many: string) => `${num.format(n)} ${n === 1 ? one : many}`;

/**
 * Resumo curto (“+42 −18 palavras · 3 blocos”) e a leitura por extenso para leitor de tela
 * (“42 palavras inseridas, 18 removidas, 3 blocos alterados”).
 */
export function formatDiffSummary({ inserted, deleted, changed }: DiffStats): {
  text: string;
  spoken: string;
} {
  if (!changed && !inserted && !deleted)
    return { text: 'Sem alterações', spoken: 'Sem alterações' };
  const marks = [
    inserted ? `+${num.format(inserted)}` : '',
    deleted ? `−${num.format(deleted)}` : '',
  ]
    .filter(Boolean)
    .join(' ');
  const words = inserted + deleted === 1 ? 'palavra' : 'palavras';
  const blocks = plural(changed, 'bloco', 'blocos');
  const text = marks ? `${marks} ${words} · ${blocks}` : blocks;
  const spoken = [
    plural(inserted, 'palavra inserida', 'palavras inseridas'),
    `${num.format(deleted)} ${deleted === 1 ? 'removida' : 'removidas'}`,
    plural(changed, 'bloco alterado', 'blocos alterados'),
  ].join(', ');
  return { text, spoken };
}

type Segment =
  { kind: 'block'; block: DiffBlock } | { kind: 'run'; key: string; blocks: DiffBlock[] };

/** Agrupa as sequências sem mudança, mantendo `context` blocos colados a cada mudança. */
function segment(blocks: DiffBlock[], collapse: boolean, context: number): Segment[] {
  if (!collapse) return blocks.map((block) => ({ kind: 'block', block }));
  const out: Segment[] = [];
  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i] as DiffBlock;
    if (isChanged(block)) {
      out.push({ kind: 'block', block });
      i += 1;
      continue;
    }
    let j = i;
    while (j < blocks.length && !isChanged(blocks[j] as DiffBlock)) j += 1;
    const run = blocks.slice(i, j);
    const lead = i > 0 ? Math.min(context, run.length) : 0;
    const trail = j < blocks.length ? Math.min(context, run.length - lead) : 0;
    const hidden = run.slice(lead, run.length - trail);
    run.slice(0, lead).forEach((b) => out.push({ kind: 'block', block: b }));
    if (hidden.length)
      out.push({ kind: 'run', key: `run-${(hidden[0] as DiffBlock).id}`, blocks: hidden });
    run.slice(run.length - trail).forEach((b) => out.push({ kind: 'block', block: b }));
    i = j;
  }
  return out;
}

function Hunk({ hunk, side }: { hunk: DiffHunk; side?: 'before' | 'after' }) {
  if (hunk.kind === 'equal') return <>{hunk.text}</>;
  if (hunk.kind === 'insert') {
    if (side === 'before') return null;
    return (
      <ins className={s.ins}>
        <VisuallyHidden>Inserido: </VisuallyHidden>
        {hunk.text}
      </ins>
    );
  }
  if (side === 'after') return null;
  return (
    <del className={s.del}>
      <VisuallyHidden>Removido: </VisuallyHidden>
      {hunk.text}
    </del>
  );
}

function Block({ block, side }: { block: DiffBlock; side?: 'before' | 'after' }) {
  const Tag = block.type === 'quote' ? 'blockquote' : 'p';
  const hunks = hunksOf(block);
  // Lado sem conteúdo (bloco novo à esquerda, removido à direita): célula vazia que guarda o par.
  const empty =
    (side === 'before' && block.change === 'added') ||
    (side === 'after' && block.change === 'removed');
  if (empty) return <div className={s.blank} aria-hidden="true" />;
  return (
    <Tag
      className={s.block}
      data-type={block.type ?? 'paragraph'}
      data-change={block.change}
      // Em `split`, o lado de antes de um bloco igual repete o depois: o leitor de tela lê uma vez.
      aria-hidden={side === 'before' && !isChanged(block) ? true : undefined}
    >
      {hunks.map((hunk, index) => (
        <Hunk key={index} hunk={hunk} side={side} />
      ))}
    </Tag>
  );
}

function Row({ block, split }: { block: DiffBlock; split: boolean }) {
  if (!split) return <Block block={block} />;
  return (
    <div className={s.pair} data-type={block.type ?? 'paragraph'}>
      <Block block={block} side="before" />
      <Block block={block} side="after" />
    </div>
  );
}

function Run({
  blocks,
  open,
  split,
  force,
  onToggle,
}: {
  blocks: DiffBlock[];
  open: boolean;
  split: boolean;
  force?: string;
  onToggle: () => void;
}) {
  const bodyId = useId();
  const count = blocks.length;
  const noun = count === 1 ? 'bloco' : 'blocos';
  const Icon = open ? FoldVertical : UnfoldVertical;
  return (
    <div className={s.run} data-open={open || undefined}>
      <button
        type="button"
        className={s.runToggle}
        aria-expanded={open}
        aria-controls={bodyId}
        data-force={force}
        onClick={onToggle}
      >
        <Icon aria-hidden="true" />
        {open ? `Recolher ${count} ${noun}` : `Mostrar ${count} ${noun} sem alteração`}
      </button>
      <div id={bodyId} className={s.runBody} data-open={open || undefined} inert={!open}>
        <div className={s.runClip}>
          <div className={s.runInner}>
            {blocks.map((block) => (
              <Row key={block.id} block={block} split={split} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Diferença entre duas versões de um texto (Revisão). Só apresentação: o consumidor entrega os
 * blocos já comparados. Papéis neutros `--diff-*` (§2.5), nunca tons de status; inserção é
 * sublinhada, remoção é tachada e cada trecho leva “Inserido:”/“Removido:” para leitor de tela —
 * cor nunca sozinha. Sem fio lateral e sem caixa em volta do parágrafo.
 *
 * `collapseUnchanged` troca cada sequência sem mudança por “Mostrar N blocos sem alteração”; o
 * botão fica no lugar como “Recolher” depois de aberto (o foco não se perde) e a altura anima em
 * `--dur-3`. `split` mostra antes | depois e empilha abaixo de 560 px de largura.
 */
export function DiffView({
  blocks,
  before,
  after,
  mode = 'inline',
  collapseUnchanged = false,
  context = 0,
  summary,
  size = 'reading',
  loading = false,
  label,
  className = '',
  'data-force': force,
  ...props
}: DiffViewProps) {
  const [opened, setOpened] = useState<ReadonlySet<string>>(() => new Set());
  const split = mode === 'split';
  const segments = useMemo(
    () => segment(blocks, collapseUnchanged, Math.max(0, context)),
    [blocks, collapseUnchanged, context],
  );
  const stats = useMemo(() => diffStats(blocks), [blocks]);
  const auto = summary === undefined ? formatDiffSummary(stats) : null;
  const summaryNode = summary === false ? null : (summary ?? null);
  const hasSummary = Boolean(auto) || summaryNode !== null;
  const hasVersions = Boolean(before || after);
  const name =
    label ??
    (before && after
      ? `Diferenças entre ${before.label} e ${after.label}`
      : 'Diferenças entre versões');

  const toggle = (key: string) =>
    setOpened((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <section
      {...props}
      className={`${s.diff} ${className}`}
      data-size={size}
      data-mode={mode}
      aria-label={name}
      aria-busy={loading || undefined}
    >
      {((hasVersions && !split) || hasSummary) && (
        <header className={s.head}>
          {hasVersions && !split && (
            <p className={s.versions}>
              {before && (
                <span className={s.version} data-side="before">
                  {before.label}
                </span>
              )}
              {before && after && (
                <>
                  <ArrowRight className={s.arrow} aria-hidden="true" />
                  <VisuallyHidden> para </VisuallyHidden>
                </>
              )}
              {after && (
                <span className={s.version} data-side="after">
                  {after.label}
                </span>
              )}
            </p>
          )}
          {hasSummary && !loading && (
            <p className={s.summary} data-num="">
              {auto ? (
                <>
                  <span aria-hidden="true">{auto.text}</span>
                  <VisuallyHidden>{auto.spoken}</VisuallyHidden>
                </>
              ) : (
                summaryNode
              )}
            </p>
          )}
        </header>
      )}
      {split && hasVersions && !loading && (
        <div className={s.columns} aria-hidden="true">
          <span>{before?.label}</span>
          <span>{after?.label}</span>
        </div>
      )}
      <div className={s.body}>
        {loading ? (
          <SkeletonText
            lines={4}
            lineHeight={size === 'reading' ? 28 : 20}
            label="Carregando diferenças"
          />
        ) : blocks.length === 0 ? (
          <p className={s.empty}>Sem alterações</p>
        ) : (
          segments.map((seg) =>
            seg.kind === 'block' ? (
              <Row key={seg.block.id} block={seg.block} split={split} />
            ) : (
              <Run
                key={seg.key}
                blocks={seg.blocks}
                split={split}
                force={force}
                open={opened.has(seg.key)}
                onToggle={() => toggle(seg.key)}
              />
            ),
          )
        )}
      </div>
    </section>
  );
}
