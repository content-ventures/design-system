'use client';

/*
 * Prose (grupo editor): dá tipografia de LEITURA ao HTML que vier dentro dele — o artigo no estúdio
 * (o `EditorContent` do TipTap renderizado como filho), a revisão e a prévia. O componente não conhece
 * o editor: estiliza o DOM que chega (inclusive o do ProseMirror) e lê ganchos `data-*` que o
 * consumidor escreve nos nós. Escala `--t-prose-*`, medida `--prose-measure`, respiros
 * `--prose-space-*` (contrato §3.1). Chapado: citação com recuo e aspas, sem fio lateral e sem caixa;
 * parágrafo nunca vira cartão.
 *
 * Elementos estilizados: h1 (título, quando o texto é só leitura), h2 (intertítulo), h3 (subtítulo),
 * h4, p, `p[data-lead]` (linha fina), ul/ol/li aninhados, a (aparência do `TextLink`, sublinhado
 * suave em repouso), strong/b, em/i (itálico real; dentro da citação volta ao redondo), u, s, hr,
 * blockquote (+ `figure > blockquote + figcaption` para o crédito), figure/img/figcaption, code em
 * linha (do tema), pre, mark.
 *
 * Ganchos (atributos que o consumidor põe nos nós; com TipTap, via `addGlobalAttributes`/
 * `renderHTML` ou decorações):
 * - `mark[data-tone="yellow" | "green" | "pink"]` — marca-texto nomeado (`--mark-*-bg`, texto
 *   `--mark-ink`); sem tom = amarelo. Sem azul: azul é a seleção de texto (§2.5).
 * - `[data-ai="unreviewed"]` — texto da IA ainda não revisado. Em bloco (p, li, h2, h3, blockquote,
 *   ul/ol): Sparkles de 12 px (`--icon-quiet`) na calha, à altura da 1ª linha, sem fio lateral. Em
 *   trecho (`span`): sublinhado pontilhado. `[data-ai="writing"]` — o bloco que a IA escreve agora: o
 *   mesmo glifo, respirando. Só na escrita (`edit`); leitura e compacto não desenham nada. Para leitor
 *   de tela, ponha `aria-description` no nó. `reviewed` não desenha nada. Clicável: o widget
 *   `proseWidgets.gutterMarker('ai')` (`button[data-ai-marker]`) dentro do bloco substitui o glifo do
 *   atributo, com dica no hover/foco.
 * - `[data-source-state="missing" | "used"]` — citação conferida com a fonte. `missing` (não bate):
 *   ondulado `--red-dot` e “Falta:” para leitor de tela; `used` não desenha nada.
 * - `[data-source-active]` — o texto ligado ao trecho da transcrição que está aceso agora (hover ou
 *   foco de um dos lados): marca-texto azul suave (`--b-50`) que acompanha as linhas, sem caixa.
 *   Vai num trecho (`span`, `mark`, `a`) que envolve o texto do bloco — no editor, uma decoração
 *   inline do bloco inteiro. Em bloco (`p`, `blockquote`…) não desenha nada: o realce é fundo, não
 *   sublinhado grosso, porque sob a seleção o navegador repinta sublinhados na cor do texto.
 * - `ins`/`del` e `[data-suggestion="insert" | "delete"]` — diferença e sugestão com papéis neutros
 *   (`--diff-*`): inserção sublinhada, remoção tachada; em trecho ganham fundo, em bloco só cor e
 *   fio (nada de caixa). O Prose anuncia “Inserido:”/“Removido:” por conteúdo gerado: não repita
 *   esse texto no documento.
 * - `[data-stale]` — o trecho perdeu a âncora (o alvo da sugestão mudou, a fonte foi editada):
 *   sublinhado tracejado `--amber-dot`; numa sugestão, o fundo sai, o texto vai a `--muted` e o fio
 *   fica tracejado.
 * - `[data-placeholder]` + `.is-empty`/`.is-editor-empty` (extensão Placeholder do TipTap) ou nó
 *   `:empty` — mostra `attr(data-placeholder)` em `--subtle`.
 * - `[data-block]` — bloco próprio do consumidor (node view, esqueleto em streaming): entra no ritmo
 *   vertical como um parágrafo.
 * - `[data-bar-space="below"]` — o bloco abre espaço embaixo para a `FloatingToolbar` que decide
 *   sobre ele (sugestão da IA, citação sem fonte): o texto seguinte desce a altura da barra mais os
 *   respiros, e a barra nunca cobre uma linha. Anima em `--dur-2` (sem movimento reduzido: na hora).
 * - `figure > img[data-missing]` (sem `src`) — moldura funda no tamanho da imagem (atributos
 *   `width`/`height`; sem eles, 16:9), com ImageOff e “Imagem indisponível”; o `alt` continua para
 *   leitor de tela. `img[data-loading]` — carregando: sem `src`, a mesma moldura pulsando; com `src`,
 *   o fundo pulsa até a imagem cobrir (tire o atributo no `load`).
 * - Widgets da fábrica `proseWidgets` (prose-widgets.ts, sem framework): `[data-prose-widget=
 *   "insertion" | "caret" | "skeleton" | "gutter-marker"]` e `[data-prose-sr]` (texto só para leitor
 *   de tela). O consumidor nunca cria DOM: pede o nó à fábrica (ex.: `Decoration.widget`).
 * - DOM do ProseMirror: `.ProseMirror` sem anel em volta do documento (o cursor b-600 é o foco),
 *   `.ProseMirror-selectednode` com o anel de foco, `.ProseMirror-hideselection`, gap cursor em
 *   `--ink`; `::selection` em `--b-100`.
 * - `a[data-force]` — estados parados do link nas pranchas (`hover`, `active`, `focus`).
 *
 * `variant`: `edit` (tela de escrita: respiro em volta, cursor de texto, sem `text-wrap` que
 * reflui enquanto se digita) · `read` (revisão, prévia, aprovação) · `compact` (cartão, copiloto,
 * gaveta: escala da interface, 13/20, e `size` é ignorado). `size="lg"` sobe o corpo para 18/28 e
 * abre os respiros; `size="sm"` (escala de trabalho, `--t-prose-*-sm`) desce para 15/25 com respiros
 * menores — o estúdio de escrita mostra mais texto por tela (título: `EditableTitle size="page"`). `measure`: `article` (68ch) ou `wide` (a largura do contêiner). `header` fica
 * na mesma medida, acima do texto e fora do ritmo dele (ex.: `EditableTitle size="document"`).
 * `overscroll` (padrão em `edit`): 60% da altura da janela depois do fim, para o último bloco (ou o
 * alvo de um salto) subir até o terço superior da área de rolagem.
 */

import type { ComponentProps, ReactNode } from 'react';
import s from './prose.module.css';

export type ProseVariant = 'edit' | 'read' | 'compact';
export type ProseSize = 'sm' | 'md' | 'lg';
export type ProseMeasure = 'article' | 'wide';
export type ProseAlign = 'center' | 'start';

export type ProseProps = Omit<ComponentProps<'div'>, 'children'> & {
  /** O HTML do texto, ou o `EditorContent` do editor. */
  children?: ReactNode;
  /** `edit` tela de escrita · `read` revisão e prévia · `compact` cartão e painel lateral. */
  variant?: ProseVariant;
  /** `sm` corpo 15/25 (trabalho) · `md` corpo 16/28 · `lg` corpo 18/28 com respiros maiores. Ignorado em `compact`. */
  size?: ProseSize;
  /** `article` limita a ≈68 caracteres · `wide` ocupa o contêiner. */
  measure?: ProseMeasure;
  /** Coluna centralizada (padrão) ou encostada no início. */
  align?: ProseAlign;
  /** Cabeçalho na mesma medida, acima do texto (título editável, meta). */
  header?: ReactNode;
  /** Nome da região para leitor de tela (ex.: “Texto do artigo”). */
  label?: string;
  /** `article` para texto final; `section` quando a página já tem um artigo. */
  as?: 'div' | 'article' | 'section';
  /**
   * Respiro depois do fim (60% da altura da janela): o último bloco, ou o alvo de um salto, sobe até
   * o terço superior da área de rolagem. Padrão: ligado em `edit`. Desligue num editor embutido
   * (campo, diálogo) que não rola sozinho.
   */
  overscroll?: boolean;
};

export function Prose({
  variant = 'edit',
  size = 'md',
  measure = 'article',
  align = 'center',
  header,
  label,
  as: Tag = 'div',
  overscroll = variant === 'edit',
  className = '',
  children,
  ...props
}: ProseProps) {
  return (
    <Tag
      {...props}
      className={`${s.prose} ${className}`}
      data-variant={variant}
      data-size={variant === 'compact' ? undefined : size}
      data-measure={measure}
      data-align={align}
      data-overscroll={overscroll ? '' : undefined}
      role={Tag === 'div' && label ? 'region' : props.role}
      aria-label={label ?? props['aria-label']}
    >
      <div className={s.column}>
        {header && <div className={s.header}>{header}</div>}
        <div className={s.flow}>{children}</div>
      </div>
    </Tag>
  );
}
