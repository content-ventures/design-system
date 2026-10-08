/**
 * Fábrica de widgets do `Prose` (grupo editor). O documento editável só leva marcas por atributo; o
 * que não está no texto — a proposta da IA ao lado do trecho riscado, o cursor parado da escrita, o
 * esqueleto da seção que ainda vai chegar e o marcador da calha — nasce aqui, como DOM simples, sem
 * React e sem depender de editor. O consumidor chama a fábrica dentro do próprio editor (no
 * ProseMirror/TipTap, em `Decoration.widget(pos, () => proseWidgets.insertion(texto))`) e o
 * aplicativo nunca cria DOM. A aparência vem toda do CSS do `Prose` (ganchos `data-*`): fora de um
 * `Prose`, os elementos não têm estilo.
 *
 * Contrato dos elementos:
 * - `insertion(texto)` → `span[data-prose-widget="insertion"][data-suggestion="insert"]`: a proposta
 *   lida como parte do parágrafo (papéis neutros `--diff-insert-*`, sublinhado). “Inserido:” vai no
 *   DOM, só para leitor de tela. `stale` (âncora perdida) e `streaming` (cursor parado no fim).
 * - `caret()` → `span[data-prose-widget="caret"]`: cursor estático (não pisca), decorativo.
 * - `skeleton(linhas)` → `div[data-prose-widget="skeleton"][data-block]`: barras na altura da linha
 *   do texto, a última mais curta; entra no ritmo vertical como um parágrafo. Decorativo: o progresso
 *   é anunciado por quem gera (ex.: `AgentTrace`).
 * - `gutterMarker('ai')` → `button[data-prose-widget="gutter-marker"][data-ai-marker]`: Sparkles de
 *   12 px na calha do bloco da IA não revisado, com dica no hover/foco. Vai dentro do bloco marcado
 *   com `data-ai="unreviewed"` (no ProseMirror, na 1ª posição do bloco, `side: -1`); com ele, o
 *   marcador só de atributo do bloco não se desenha. Só aparece no `Prose variant="edit"`.
 *
 * Todos saem com `contenteditable="false"`. `document` é opcional (padrão: o global) para quem cria
 * os widgets em outra janela ou num iframe.
 */

/** Atributo que identifica cada widget da fábrica (e que o CSS do `Prose` estiliza). */
export const PROSE_WIDGET_ATTR = 'data-prose-widget';

export type ProseWidgetKind = 'insertion' | 'caret' | 'skeleton' | 'gutter-marker';

export type ProseWidgetOptions = {
  /** Documento onde os nós nascem. Padrão: `globalThis.document`. */
  document?: Document;
};

export type ProseInsertionOptions = ProseWidgetOptions & {
  /** O alvo mudou depois da proposta: tracejado, sem fundo, texto apagado. */
  stale?: boolean;
  /** A proposta ainda está chegando: cursor parado no fim do texto. */
  streaming?: boolean;
  /** Prefixo para leitor de tela. Padrão “Inserido:”. */
  label?: string;
};

export type ProseGutterMarkerKind = 'ai';

export type ProseGutterMarkerOptions = ProseWidgetOptions & {
  /** Nome acessível e texto da dica (começa por verbo). Padrão “Revisar texto da IA”. */
  label?: string;
  /** Clique, Enter ou Espaço no marcador. O editor não perde o foco nem a seleção. */
  onActivate?: (event: Event) => void;
  /** Entra na ordem do Tab. Padrão `false`: o caminho por teclado é a linha de status. */
  focusable?: boolean;
};

const INSERTION_LABEL = 'Inserido:';
const AI_MARKER_LABEL = 'Revisar texto da IA';
const SKELETON_MAX_LINES = 12;

function documentOf(options?: ProseWidgetOptions): Document {
  const doc = options?.document ?? globalThis.document;
  if (!doc) {
    throw new Error(
      'proseWidgets: sem `document`. Crie os widgets no navegador ou passe `document`.',
    );
  }
  return doc;
}

function widget<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tag: K,
  kind: ProseWidgetKind,
): HTMLElementTagNameMap[K] {
  const node = doc.createElement(tag);
  node.setAttribute(PROSE_WIDGET_ATTR, kind);
  node.setAttribute('contenteditable', 'false');
  return node;
}

/** Texto só para leitor de tela, dentro do widget (o `Prose` o esconde da tela). */
function srText(doc: Document, text: string): HTMLSpanElement {
  const node = doc.createElement('span');
  node.setAttribute('data-prose-sr', '');
  node.textContent = `${text} `;
  return node;
}

/** Cursor parado (não pisca): marca onde o texto da IA está entrando. */
function caret(options?: ProseWidgetOptions): HTMLSpanElement {
  const node = widget(documentOf(options), 'span', 'caret');
  node.setAttribute('aria-hidden', 'true');
  return node;
}

/** Proposta da IA como inserção no parágrafo, logo depois do trecho riscado. */
function insertion(text: string, options?: ProseInsertionOptions): HTMLSpanElement {
  const doc = documentOf(options);
  const node = widget(doc, 'span', 'insertion');
  node.setAttribute('data-suggestion', 'insert');
  if (options?.stale) node.setAttribute('data-stale', '');
  node.append(srText(doc, options?.label ?? INSERTION_LABEL), doc.createTextNode(text));
  if (options?.streaming) {
    node.setAttribute('data-streaming', '');
    node.append(caret({ document: doc }));
  }
  return node;
}

/** Esqueleto de bloco (seção que ainda vai chegar): `lines` barras, de 1 a 12. */
function skeleton(lines = 3, options?: ProseWidgetOptions): HTMLDivElement {
  const doc = documentOf(options);
  const node = widget(doc, 'div', 'skeleton');
  node.setAttribute('data-block', '');
  node.setAttribute('aria-hidden', 'true');
  const count = Number.isFinite(lines)
    ? Math.min(SKELETON_MAX_LINES, Math.max(1, Math.round(lines)))
    : 3;
  for (let index = 0; index < count; index += 1) node.append(doc.createElement('span'));
  return node;
}

/** Marcador da calha. `ai`: bloco da IA não revisado (Sparkles 12 px, dica, clicável). */
function gutterMarker(
  kind: ProseGutterMarkerKind = 'ai',
  options?: ProseGutterMarkerOptions,
): HTMLButtonElement {
  const node = widget(documentOf(options), 'button', 'gutter-marker');
  node.type = 'button';
  node.setAttribute('data-ai-marker', kind);
  node.setAttribute('aria-label', options?.label ?? AI_MARKER_LABEL);
  if (!options?.focusable) node.tabIndex = -1;
  const activate = options?.onActivate;
  // Clicar não tira o foco nem a seleção do editor; evento já cancelado o editor ignora.
  node.addEventListener('mousedown', (event) => event.preventDefault());
  // Enter/Espaço tratados aqui: o editor não recebe a tecla (nada de quebrar o parágrafo) e o
  // clique sintético que alguns navegadores ainda disparam não ativa duas vezes.
  let keyed = false;
  node.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    keyed = true;
    if (!event.repeat) activate?.(event);
  });
  node.addEventListener('keyup', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    setTimeout(() => {
      keyed = false;
    }, 0);
  });
  node.addEventListener('click', (event) => {
    event.preventDefault();
    if (keyed) return;
    activate?.(event);
  });
  return node;
}

/**
 * Fábrica de widgets do `Prose`, sem framework: cada função devolve um elemento novo, pronto para
 * um `Decoration.widget` (ou qualquer outro editor). Estilo e estados vêm do CSS do `Prose`.
 */
export const proseWidgets = {
  insertion,
  caret,
  skeleton,
  gutterMarker,
} as const;

export type ProseWidgets = typeof proseWidgets;
