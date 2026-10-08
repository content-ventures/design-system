'use client';

import {
  memo,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  Button,
  Menu,
  SaveIndicator,
  type MenuItem,
  type MenuSection,
  type SaveStatus,
} from '@content-ventures/design-system/v3';
import { FloatingToolbar } from '@content-ventures/design-system/v3/floating-toolbar';
import { Prose } from '@content-ventures/design-system/v3/prose';
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarMenu,
  ToolbarSeparator,
  ToolbarToggle,
} from '@content-ventures/design-system/v3/toolbar';
import {
  Bold,
  Check,
  ChevronDown,
  Eraser,
  Heading2,
  Heading3,
  Highlighter,
  History as HistoryIcon,
  Italic,
  Link2,
  List as ListIcon,
  ListOrdered,
  Maximize2,
  MessageSquareText,
  Paperclip,
  Pilcrow,
  Quote,
  Redo2,
  Save,
  Scissors,
  Strikethrough,
  TextQuote,
  Underline,
  Undo2,
  Unlink,
  WandSparkles,
  X,
} from '@content-ventures/design-system/v3/icons';
import { Phone, Shot, Shots, State, States } from '../stage';
import x from './editor-toolbar.module.css';

/*
 * Editor — Toolbar e FloatingToolbar. Contexto: Reporter IA, uma jornalista transforma a
 * transcrição da entrevista com Clara Souto (Aurora Calçados) em artigo. A prancha só arruma o
 * palco e o texto de exemplo; a barra é a da biblioteca.
 */

/* ——————————————————————————— Dados ——————————————————————————— */

type Block = 'p' | 'h2' | 'h3' | 'blockquote';

const STYLES: { value: Block; label: string; icon: MenuItem['icon'] }[] = [
  { value: 'p', label: 'Texto', icon: Pilcrow },
  { value: 'h2', label: 'Intertítulo', icon: Heading2 },
  { value: 'h3', label: 'Subtítulo', icon: Heading3 },
  { value: 'blockquote', label: 'Citação', icon: TextQuote },
];

const STYLE_SECTIONS: MenuSection[] = [
  {
    items: STYLES.map((item) => ({
      label: item.label,
      icon: item.icon,
      checked: item.value === 'h2',
    })),
  },
];

const MARKS = [
  { tone: 'yellow', label: 'Amarelo' },
  { tone: 'green', label: 'Verde' },
  { tone: 'pink', label: 'Rosa' },
] as const;

const REWRITE: MenuItem[] = [{ label: 'Mais direto' }, { label: 'Didático' }, { label: 'Formal' }];

function aiSections(onPick: () => void = () => {}): MenuSection[] {
  return [
    {
      items: [
        {
          label: 'Reescrever',
          icon: WandSparkles,
          items: REWRITE.map((item) => ({ ...item, onSelect: onPick })),
        },
        { label: 'Encurtar', icon: Scissors, onSelect: onPick },
        { label: 'Expandir com a fonte', icon: Maximize2, onSelect: onPick },
        { label: 'Virar lista', icon: ListIcon, onSelect: onPick },
      ],
    },
    { items: [{ label: 'Gerar títulos alternativos', onSelect: onPick }] },
  ];
}

function markSections(onPick: (tone: string | null) => void = () => {}): MenuSection[] {
  return [
    {
      items: MARKS.map((mark) => ({
        label: mark.label,
        leading: <span className={x.swatch} data-tone={mark.tone} />,
        onSelect: () => onPick(mark.tone),
      })),
    },
    { items: [{ label: 'Remover marca-texto', icon: Eraser, onSelect: () => onPick(null) }] },
  ];
}

/* ——————————————————————————— Editor de exemplo ——————————————————————————— */

type EditorState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  ul: boolean;
  ol: boolean;
  block: Block;
  link: boolean;
  range: boolean;
};

const IDLE: EditorState = {
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  ul: false,
  ol: false,
  block: 'p',
  link: false,
  range: false,
};

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"]/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char] ?? char,
  );

/** Lê as marcas da seleção dentro do editor (o texto de exemplo usa a edição nativa do navegador). */
function useEditorState(ref: RefObject<HTMLElement | null>) {
  const [state, setState] = useState<EditorState>(IDLE);
  useEffect(() => {
    const read = () => {
      const editor = ref.current;
      const selection = document.getSelection();
      const node = selection?.anchorNode ?? null;
      if (!editor || !node || !editor.contains(node)) return;
      const element = node.nodeType === 1 ? (node as Element) : node.parentElement;
      const raw = document.queryCommandValue('formatBlock').toLowerCase();
      setState({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strike: document.queryCommandState('strikeThrough'),
        ul: document.queryCommandState('insertUnorderedList'),
        ol: document.queryCommandState('insertOrderedList'),
        block: raw === 'h2' || raw === 'h3' || raw === 'blockquote' ? raw : 'p',
        link: Boolean(element?.closest('a')),
        range: Boolean(selection && !selection.isCollapsed),
      });
    };
    document.addEventListener('selectionchange', read);
    return () => document.removeEventListener('selectionchange', read);
  }, [ref]);
  return state;
}

/** Texto editável que o React não redesenha (a edição nativa muda o DOM). */
const ArticleBody = memo(function ArticleBody({
  editorRef,
  editable,
}: {
  editorRef?: RefObject<HTMLDivElement | null>;
  editable: boolean;
}) {
  return (
    <div
      ref={editorRef}
      className={x.article}
      contentEditable={editable || undefined}
      suppressContentEditableWarning
      role={editable ? 'textbox' : undefined}
      aria-multiline={editable || undefined}
      aria-label={editable ? 'Texto do artigo' : undefined}
      spellCheck={false}
    >
      <h2>Rastreabilidade vira argumento de venda</h2>
      <p>
        Compradores querem saber de onde vem cada peça. O selo de origem já é exigência em contratos
        com redes da Alemanha e da Holanda, e quem não comprova a cadeia perde o pedido.
      </p>
      <blockquote>
        <p>Não é mais tendência, é condição para exportar.</p>
      </blockquote>
      <p>
        Segundo Clara Souto, diretora de produto da Aurora Calçados, a meta é chegar a{' '}
        <mark data-tone="yellow">30% do catálogo</mark> até o fim de 2027.
      </p>
    </div>
  );
});

/** Barra completa do editor. Com `exec`, os comandos agem no texto de exemplo. */
function EditorToolbar({
  state = IDLE,
  exec,
  variant = 'bar',
  label = 'Formatação do texto',
  end,
}: {
  state?: EditorState;
  exec?: (command: string, value?: string) => void;
  variant?: 'bar' | 'plain';
  label?: string;
  /** Estado do documento no fim da barra (`Toolbar end`). */
  end?: ReactNode;
}) {
  const run = (command: string, value?: string) => () => exec?.(command, value);
  const style = STYLES.find((item) => item.value === state.block) ?? STYLES[0];
  return (
    <Toolbar label={label} variant={variant} keepFocus end={end}>
      <ToolbarGroup label="Histórico">
        <ToolbarButton label="Desfazer" icon={Undo2} shortcut="⌘Z" keep onClick={run('undo')} />
        <ToolbarButton label="Refazer" icon={Redo2} shortcut="⇧⌘Z" keep onClick={run('redo')} />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarMenu
        label="Estilo do parágrafo"
        value={style?.label}
        width={124}
        keep
        sections={[
          {
            items: STYLES.map((item) => ({
              label: item.label,
              icon: item.icon,
              checked: item.value === state.block,
              onSelect: () => exec?.('formatBlock', item.value),
            })),
          },
        ]}
      />
      <ToolbarSeparator />
      <ToolbarGroup label="Marcas do texto">
        <ToolbarToggle
          label="Negrito"
          icon={Bold}
          shortcut="⌘B"
          pressed={state.bold}
          onPressedChange={run('bold')}
        />
        <ToolbarToggle
          label="Itálico"
          icon={Italic}
          shortcut="⌘I"
          pressed={state.italic}
          onPressedChange={run('italic')}
        />
        <ToolbarToggle
          label="Sublinhado"
          icon={Underline}
          shortcut="⌘U"
          pressed={state.underline}
          onPressedChange={run('underline')}
        />
        <ToolbarToggle
          label="Tachado"
          icon={Strikethrough}
          shortcut="⇧⌘X"
          pressed={state.strike}
          onPressedChange={run('strikeThrough')}
        />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup label="Blocos">
        <ToolbarToggle
          label="Lista"
          icon={ListIcon}
          shortcut="⇧⌘8"
          pressed={state.ul}
          onPressedChange={run('insertUnorderedList')}
        />
        <ToolbarToggle
          label="Lista numerada"
          icon={ListOrdered}
          shortcut="⇧⌘7"
          pressed={state.ol}
          onPressedChange={run('insertOrderedList')}
        />
        <ToolbarToggle
          label="Citação"
          icon={Quote}
          pressed={state.block === 'blockquote'}
          onPressedChange={(on) => exec?.('formatBlock', on ? 'blockquote' : 'p')}
        />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup label="Trecho">
        <ToolbarButton
          label={state.link ? 'Remover link' : 'Link'}
          icon={state.link ? Unlink : Link2}
          shortcut="⌘K"
          pressed={state.link}
          disabled={!state.range && !state.link}
          disabledReason="Selecione um trecho para criar link"
          onClick={() =>
            state.link
              ? exec?.('unlink')
              : exec?.('createLink', 'https://reporter.local/fontes/clara-souto')
          }
        />
        <ToolbarMenu
          label="Marca-texto"
          icon={Highlighter}
          disabled={!state.range}
          disabledReason="Selecione um trecho para marcar"
          sections={markSections((tone) => exec?.('mark', tone ?? ''))}
        />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarMenu
        label="IA"
        icon={WandSparkles}
        showLabel
        keep
        align="end"
        menuWidth={248}
        sections={aiSections()}
      />
    </Toolbar>
  );
}

/** Editor vivo: a barra age no texto pela edição nativa; a seleção sobrevive ao clique. */
function LiveEditor() {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const state = useEditorState(editorRef);
  const exec = (command: string, value?: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    if (document.activeElement !== editor) editor.focus();
    if (command === 'mark') {
      const selection = document.getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) return;
      const holder = document.createElement('div');
      holder.appendChild(selection.getRangeAt(0).cloneContents());
      holder
        .querySelectorAll('mark')
        .forEach((mark) => mark.replaceWith(...Array.from(mark.childNodes)));
      const html = holder.innerHTML || escapeHtml(selection.toString());
      document.execCommand(
        'insertHTML',
        false,
        value ? `<mark data-tone="${value}">${html}</mark>` : html,
      );
      return;
    }
    document.execCommand(command, false, value);
  };
  return (
    <div className={x.frame}>
      <EditorToolbar state={state} exec={exec} end={<DocumentState />} />
      <div className={x.scroll}>
        <ArticleBody editorRef={editorRef} editable />
      </div>
    </div>
  );
}

/* ——————————————————————————— Barra de ferramentas ——————————————————————————— */

const VERSIONS: MenuItem[] = [
  { label: 'v3 · rascunho', meta: 'há 2 min', checked: true },
  { label: 'v2 · enviada para aprovação', meta: 'ontem' },
  { label: 'v1 · gerada pela IA', meta: '12 out' },
];

/** Fim da barra (`Toolbar end`): o estado do documento — salvamento e versões, como no estúdio. */
function DocumentState({ status = 'saved' }: { status?: SaveStatus }) {
  return (
    <>
      <SaveIndicator
        status={status}
        label={status === 'saved' ? 'Salvo' : undefined}
        onRetry={() => undefined}
      />
      <Menu
        label="Versões do artigo"
        align="end"
        width={280}
        sections={[
          { items: [{ label: 'Salvar versão', icon: Save, shortcut: '⌘S' }] },
          { label: 'Versões', items: VERSIONS },
          { items: [{ label: 'Ver todas as versões', icon: HistoryIcon }] },
        ]}
        trigger={(props) => (
          <Button {...props} variant="ghost" size="sm" trailingIcon={ChevronDown}>
            v3
          </Button>
        )}
      />
    </>
  );
}

const END_STATES = [
  ['Salvo', 'saved'],
  ['Salvando', 'saving'],
  ['Não salvo', 'unsaved'],
  ['Erro', 'error'],
] as const;

/** A barra curta com o estado no fim; estreita, os itens saem para o “Mais” antes do estado. */
function EndStates() {
  return (
    <States min={400}>
      {END_STATES.map(([label, status]) => (
        <State key={label} label={label}>
          <div className={x.box}>
            <Toolbar
              label={`Formatação, estado ${label.toLowerCase()}`}
              end={<DocumentState status={status} />}
            >
              <ToolbarButton label="Desfazer" icon={Undo2} />
              <ToolbarButton label="Refazer" icon={Redo2} />
              <ToolbarSeparator />
              <ToolbarToggle
                label="Negrito"
                icon={Bold}
                pressed={false}
                onPressedChange={() => {}}
              />
              <ToolbarToggle
                label="Itálico"
                icon={Italic}
                pressed={false}
                onPressedChange={() => {}}
              />
            </Toolbar>
          </div>
        </State>
      ))}
      <State label="Estreita">
        <div className={x.narrow}>
          <EditorToolbar
            variant="plain"
            label="Formatação do texto, estreita"
            end={<DocumentState />}
          />
        </div>
      </State>
    </States>
  );
}

function ButtonStates() {
  return (
    <States min={120} align="center">
      <State label="Repouso">
        <ToolbarButton label="Negrito" icon={Bold} />
      </State>
      <State label="Hover">
        <ToolbarButton label="Negrito" icon={Bold} data-force="hover" />
      </State>
      <State label="Pressionado">
        <ToolbarButton label="Negrito" icon={Bold} data-force="active" />
      </State>
      <State label="Foco">
        <ToolbarButton label="Negrito" icon={Bold} data-force="focus" />
      </State>
      <State label="Ligado">
        <ToolbarButton label="Negrito" icon={Bold} pressed />
      </State>
      <State label="Ligado, hover">
        <ToolbarButton label="Negrito" icon={Bold} pressed data-force="hover" />
      </State>
      <State label="Indisponível">
        <ToolbarButton
          label="Link"
          icon={Link2}
          disabled
          disabledReason="Selecione um trecho para criar link"
        />
      </State>
      <State label="Carregando">
        <ToolbarButton label="Encurtar" icon={Scissors} showLabel loading />
      </State>
      <State label="Menu">
        <ToolbarMenu
          label="Estilo do parágrafo"
          value="Intertítulo"
          width={124}
          sections={STYLE_SECTIONS}
        />
      </State>
      <State label="Menu aberto">
        <ToolbarMenu
          label="Marca-texto"
          icon={Highlighter}
          sections={markSections()}
          data-force="open"
        />
      </State>
      <State label="Dica" span={2}>
        <ToolbarButton label="Negrito" icon={Bold} shortcut="⌘B" data-force="tip" />
      </State>
    </States>
  );
}

function ToolbarSpecimen() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="md">
        <LiveEditor />
      </Shot>

      <Shot title="Variantes" tone="white" align="stretch" pad="md">
        <States min={280}>
          <State label="Faixa">
            <div className={x.box}>
              <Toolbar label="Formatação" variant="bar">
                <ToolbarButton label="Desfazer" icon={Undo2} />
                <ToolbarButton label="Refazer" icon={Redo2} />
                <ToolbarSeparator />
                <ToolbarToggle label="Negrito" icon={Bold} pressed onPressedChange={() => {}} />
                <ToolbarToggle
                  label="Itálico"
                  icon={Italic}
                  pressed={false}
                  onPressedChange={() => {}}
                />
                <ToolbarButton label="Link" icon={Link2} />
              </Toolbar>
            </div>
          </State>
          <State label="Compacta">
            <Toolbar label="Formatação" size="sm">
              <ToolbarToggle label="Negrito" icon={Bold} pressed onPressedChange={() => {}} />
              <ToolbarToggle
                label="Itálico"
                icon={Italic}
                pressed={false}
                onPressedChange={() => {}}
              />
              <ToolbarButton label="Link" icon={Link2} />
              <ToolbarSeparator />
              <ToolbarMenu label="Marca-texto" icon={Highlighter} sections={markSections()} />
            </Toolbar>
          </State>
          <State label="Com rótulo">
            <Toolbar label="Ações de IA" size="sm">
              <ToolbarMenu
                label="Reescrever"
                icon={WandSparkles}
                showLabel
                sections={[{ items: REWRITE }]}
              />
              <ToolbarButton label="Encurtar" icon={Scissors} showLabel />
            </Toolbar>
          </State>
          <State label="Vertical">
            <Toolbar label="Histórico e marcas" orientation="vertical">
              <ToolbarButton label="Desfazer" icon={Undo2} />
              <ToolbarButton label="Refazer" icon={Redo2} />
              <ToolbarSeparator />
              <ToolbarToggle
                label="Negrito"
                icon={Bold}
                pressed={false}
                onPressedChange={() => {}}
              />
              <ToolbarToggle label="Itálico" icon={Italic} pressed onPressedChange={() => {}} />
            </Toolbar>
          </State>
        </States>
      </Shot>

      <Shot title="Estados" tone="white" align="stretch" pad="md">
        <ButtonStates />
      </Shot>

      <Shot title="Fim da barra" tone="white" align="stretch" pad="md">
        <EndStates />
      </Shot>

      <Shot title="Mais" tone="white" align="stretch" pad="md">
        <div className={x.resize}>
          <EditorToolbar variant="plain" label="Formatação do texto, largura livre" />
        </div>
      </Shot>

      <Shot title="Celular" align="center" pad="md">
        <Phone label="Celular, 390">
          <div className={x.phoneFrame}>
            <EditorToolbar label="Formatação do texto, celular" />
            <ArticleBody editable={false} />
          </div>
        </Phone>
      </Shot>
    </Shots>
  );
}

/* ——————————————————————————— Barra flutuante ——————————————————————————— */

/** Barra da seleção no artigo: formatação + ações de IA. `Encurtar` mostra o carregando. */
function SelectionTools({ busy, onShorten }: { busy?: boolean; onShorten?: () => void }) {
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  return (
    <>
      <ToolbarToggle
        label="Negrito"
        icon={Bold}
        shortcut="⌘B"
        pressed={bold}
        onPressedChange={setBold}
      />
      <ToolbarToggle
        label="Itálico"
        icon={Italic}
        shortcut="⌘I"
        pressed={italic}
        onPressedChange={setItalic}
      />
      <ToolbarButton label="Link" icon={Link2} shortcut="⌘K" />
      <ToolbarSeparator />
      <ToolbarMenu
        label="Reescrever"
        icon={WandSparkles}
        showLabel
        keep
        sections={[{ items: REWRITE }]}
      />
      <ToolbarButton
        label="Encurtar"
        icon={Scissors}
        showLabel
        loading={busy}
        onClick={onShorten}
      />
      <ToolbarButton label="Perguntar à IA" icon={MessageSquareText} showLabel />
    </>
  );
}

function SelectedParagraph({
  markRef,
  selected,
}: {
  markRef?: RefObject<HTMLSpanElement | null>;
  selected: boolean;
}) {
  return (
    <p>
      Para o varejo, a troca pesa pouco no preço final:{' '}
      <span ref={markRef} className={x.selection} data-active={selected || undefined}>
        a diferença fica entre 4% e 7% por par
      </span>
      , segundo a Ateliê Sul.
    </p>
  );
}

/** Seleção simulada no começo; selecionar outro trecho do texto move a barra para ele. */
function LiveSelection() {
  const articleRef = useRef<HTMLDivElement | null>(null);
  const markRef = useRef<HTMLSpanElement | null>(null);
  const [range, setRange] = useState<Range | null>(null);
  const [open, setOpen] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const read = () => {
      const selection = document.getSelection();
      const article = articleRef.current;
      if (!selection || selection.isCollapsed || !selection.rangeCount || !article) return;
      const next = selection.getRangeAt(0);
      if (!article.contains(next.commonAncestorContainer)) return;
      setRange(next.cloneRange());
      setOpen(true);
    };
    document.addEventListener('selectionchange', read);
    return () => document.removeEventListener('selectionchange', read);
  }, []);

  useEffect(() => {
    if (!busy) return;
    const timer = window.setTimeout(() => setBusy(false), 1600);
    return () => window.clearTimeout(timer);
  }, [busy]);

  return (
    <div className={x.frame}>
      <div ref={articleRef} className={`${x.article} ${x.reading}`}>
        <h2>O que muda para o lojista</h2>
        <SelectedParagraph markRef={markRef} selected={!range && open} />
        <p>
          A Aurora Calçados aposta que o selo de origem vai pesar mais que o preço nas negociações
          do segundo semestre.
        </p>
      </div>
      <FloatingToolbar
        open={open}
        label="Ações do trecho selecionado"
        anchor={() =>
          range?.getBoundingClientRect() ?? markRef.current?.getBoundingClientRect() ?? null
        }
        onDismiss={() => {
          setOpen(false);
          setRange(null);
        }}
      >
        <SelectionTools busy={busy} onShorten={() => setBusy(true)} />
      </FloatingToolbar>
    </div>
  );
}

function Pinned({
  children,
  label = 'Ações do trecho selecionado',
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <FloatingToolbar open pinned label={label} anchor={() => null}>
      {children}
    </FloatingToolbar>
  );
}

/**
 * A barra que decide sobre um bloco não cobre a linha seguinte: o bloco ganha
 * `data-bar-space="below"` e o `Prose` abre ali o vão; a barra (`follow`) fica nele.
 */
function BarRoom() {
  const block = useRef<HTMLParagraphElement>(null);
  return (
    <div className={x.frame}>
      <Prose variant="edit" size="sm" measure="wide" align="start" overscroll={false}>
        <p ref={block} data-bar-space="below">
          O limite ainda é o material. A resina é ótima para testar forma, mas não suporta o uso
          real, e os materiais mais resistentes seguem caros para estúdios pequenos.
        </p>
        <p>
          Para quem quer começar, o conselho é atacar o teste mais caro da fábrica, que na maioria
          dos casos é o salto.
        </p>
      </Prose>
      <FloatingToolbar
        open
        follow
        placement="bottom"
        label="Sugestão da IA"
        anchor={() => block.current?.getBoundingClientRect() ?? null}
      >
        <ToolbarButton label="Aceitar" icon={Check} showLabel shortcut="⌘↵" />
        <ToolbarButton label="Descartar" icon={X} showLabel shortcut="Esc" />
      </FloatingToolbar>
    </div>
  );
}

function FloatingToolbarSpecimen() {
  return (
    <Shots>
      <Shot title="Em contexto" tone="white" align="stretch" pad="md">
        <LiveSelection />
      </Shot>

      <Shot title="Vão da barra" tone="white" align="stretch" pad="md">
        <BarRoom />
      </Shot>

      <Shot title="Variantes" tone="white" align="stretch" pad="md">
        <States min={400}>
          <State label="Formatação">
            <Pinned label="Formatação do trecho">
              <ToolbarToggle label="Negrito" icon={Bold} pressed onPressedChange={() => {}} />
              <ToolbarToggle
                label="Itálico"
                icon={Italic}
                pressed={false}
                onPressedChange={() => {}}
              />
              <ToolbarToggle
                label="Sublinhado"
                icon={Underline}
                pressed={false}
                onPressedChange={() => {}}
              />
              <ToolbarButton label="Link" icon={Link2} />
              <ToolbarSeparator />
              <ToolbarMenu label="Marca-texto" icon={Highlighter} sections={markSections()} />
            </Pinned>
          </State>
          <State label="Transcrição">
            <Pinned label="Ações do trecho da transcrição">
              <ToolbarButton label="Inserir citação" icon={Quote} showLabel />
              <ToolbarButton label="Usar como contexto" icon={Paperclip} showLabel />
              <ToolbarButton label="Perguntar à IA" icon={MessageSquareText} showLabel />
            </Pinned>
          </State>
          <State label="Artigo">
            <Pinned>
              <SelectionTools />
            </Pinned>
          </State>
        </States>
      </Shot>

      <Shot title="Estados" tone="white" align="stretch" pad="md">
        <States min={300}>
          <State label="Hover">
            <Pinned>
              <ToolbarButton label="Negrito" icon={Bold} data-force="hover" />
              <ToolbarButton label="Itálico" icon={Italic} />
              <ToolbarSeparator />
              <ToolbarButton label="Encurtar" icon={Scissors} showLabel />
            </Pinned>
          </State>
          <State label="Foco">
            <Pinned>
              <ToolbarButton label="Negrito" icon={Bold} />
              <ToolbarButton label="Itálico" icon={Italic} />
              <ToolbarSeparator />
              <ToolbarButton label="Encurtar" icon={Scissors} showLabel data-force="focus" />
            </Pinned>
          </State>
          <State label="Carregando">
            <Pinned>
              <ToolbarButton label="Negrito" icon={Bold} />
              <ToolbarButton label="Itálico" icon={Italic} />
              <ToolbarSeparator />
              <ToolbarButton label="Encurtar" icon={Scissors} showLabel loading />
            </Pinned>
          </State>
          <State label="Indisponível">
            <Pinned>
              <ToolbarButton label="Negrito" icon={Bold} />
              <ToolbarButton label="Itálico" icon={Italic} />
              <ToolbarSeparator />
              <ToolbarButton
                label="Encurtar"
                icon={Scissors}
                showLabel
                disabled
                disabledReason="Selecione ao menos uma frase para encurtar"
              />
            </Pinned>
          </State>
        </States>
      </Shot>

      <Shot title="Celular" align="center" pad="md">
        <Phone label="Celular, 390">
          <div className={x.phoneReading}>
            <div className={`${x.article} ${x.reading}`}>
              <h2>O que muda para o lojista</h2>
              <div className={x.phoneBar}>
                <Pinned>
                  <SelectionTools />
                </Pinned>
              </div>
              <SelectedParagraph selected />
            </div>
          </div>
        </Phone>
      </Shot>
    </Shots>
  );
}

export const specimens: Record<string, ComponentType> = {
  'barra-ferramentas': ToolbarSpecimen,
  'barra-flutuante': FloatingToolbarSpecimen,
};
