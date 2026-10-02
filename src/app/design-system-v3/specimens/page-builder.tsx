'use client';

/*
 * Editor da Vitrine — page builder por seções (substitui a prancha 'editor-vitrine' de padroes-b).
 * Como um Wix, não um Figma: a página é uma pilha de seções. Seleciona, edita conteúdo no lugar,
 * troca layout, imagem, fundo e tema; reordena pela lista; nada de arrastar livre na tela.
 *
 *   Topo        voltar · nome + status + salvamento · dispositivo · desfazer/refazer · tela cheia ·
 *               pré-visualizar · publicar (confirmação → aviso)
 *   Esquerda    Seções (lista ordenável, olho, biblioteca com miniaturas) | Tema (cor, tipo, cantos, botões)
 *   Centro      bandeja --g-50 com a página na largura do dispositivo; camada de seleção por cima
 *               (contorno, aba, barra de ações, “+” entre seções, barra de texto B/I/link)
 *   Direita     inspetor por contexto: página · seção (layout, conteúdo, imagem, estilo, visibilidade) · imagem
 *   Celular     um painel por vez (Seções · Página · Ajustes)
 */

import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bold,
  Check,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Italic,
  Link2,
  Lock,
  Maximize2,
  Minimize2,
  Monitor,
  Plus,
  Redo2,
  RemoveFormatting,
  RotateCcw,
  SlidersHorizontal,
  Smartphone,
  Tablet,
  Trash2,
  Undo2,
  Unlink,
  Upload,
  X,
  AlignLeft,
  AlignCenter,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import {
  Button,
  ColorField,
  ConfirmDialog,
  Field,
  IconButton,
  Input,
  Popover,
  SearchField,
  Segmented,
  Select,
  Switch,
  Tabs,
  Textarea,
  Toaster,
  Tooltip,
  VisuallyHidden,
  toast,
} from '@mediaon/design-system/v3';
import toastStyles from '@mediaon/design-system/v3/toast.module.css';
import { Shot, Shots } from '../stage';
import { Art, Wireframe } from './page-builder-art';
import {
  ARTS,
  BRAND_SWATCHES,
  KINDS,
  LIBRARY,
  LIBRARY_GROUPS,
  SITE_HOST,
  START_DOC,
  TYPE_PAIRS,
  type Align,
  type ArtId,
  type Bg,
  type Device,
  type Doc,
  type Img,
  type Kind,
  type PageMeta,
  type Screen,
  type Section,
  type Spacing,
  type Theme,
  artOf,
  escapeHtml,
  makeSection,
  plain,
  readPath,
  writePath,
} from './page-builder-data';
import { ImageView, SectionBackdrop, SectionBody, siteStyles as site, themeVars, type SiteApi } from './page-builder-site';
import css from './page-builder.module.css';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const EASE_MOVE = 'cubic-bezier(0.65, 0, 0.35, 1)';
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

/* ——— Avisos: o catálogo pode já ter um Toaster ——— */

function EnsureToaster() {
  const [needed, setNeeded] = useState(false);
  useEffect(() => {
    const cls = toastStyles.viewport;
    setNeeded(!cls || !document.querySelector(`.${CSS.escape(cls)}`));
  }, []);
  return needed ? <Toaster /> : null;
}

/* ——— Geometria da camada de seleção ——— */

type Box = { x: number; y: number; w: number; h: number };
const sameBox = (a?: Box | null, b?: Box | null) =>
  a === b || (!!a && !!b && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h);

/** Posição de `el` dentro de `root` somando offsets (ignora transformações das animações FLIP). */
function boxIn(el: HTMLElement, root: HTMLElement): Box {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    const parent = node.offsetParent as HTMLElement | null;
    if (parent && parent !== root) {
      x += parent.clientLeft;
      y += parent.clientTop;
    }
    node = parent;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

type Boxes = { sel: Box | null; hover: Box | null; img: Box | null; text: Box | null; sections: Record<string, Box> };
const EMPTY_BOXES: Boxes = { sel: null, hover: null, img: null, text: null, sections: {} };

/* ——— Histórico ——— */

type History = { past: Doc[]; present: Doc; future: Doc[] };
type Selection = { id: string | null; img: number | null };
type Status = 'rascunho' | 'publicada' | 'pendente';
type View = 'secoes' | 'pagina' | 'ajustes';

const kindLabel = (section: Section) => KINDS[section.kind].label;
const isLocked = (section?: Section) => Boolean(section && KINDS[section.kind].locked);

let seq = 0;
const nextId = (kind: Kind) => {
  seq += 1;
  return `s-${kind}-${Date.now().toString(36)}-${seq}`;
};

/* ———————————————————————————————————————————————————————————————————————————
 * Editor
 * ——————————————————————————————————————————————————————————————————————————— */

function PageBuilder({ startSelected = 's-hero' }: { startSelected?: string | null }) {
  const [hist, setHist] = useState<History>({ past: [], present: START_DOC, future: [] });
  const doc = hist.present;
  const sections = doc.sections;
  const [sel, setSel] = useState<Selection>({ id: startSelected, img: null });
  const [hover, setHover] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; path: string; el: HTMLElement } | null>(null);
  const [device, setDevice] = useState<Device>('desktop');
  const [leftTab, setLeftTab] = useState<'secoes' | 'tema'>('secoes');
  const [library, setLibrary] = useState<{ at: number } | null>(null);
  const [preview, setPreview] = useState(false);
  const [full, setFull] = useState(false);
  const [compact, setCompact] = useState(false);
  const [view, setView] = useState<View>('pagina');
  const [status, setStatus] = useState<Status>('rascunho');
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [canvasW, setCanvasW] = useState(560);
  const [boxes, setBoxes] = useState<Boxes>(EMPTY_BOXES);
  const [glide, setGlide] = useState(false);
  const [announce, setAnnounce] = useState('');

  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const siteRef = useRef<HTMLDivElement>(null);
  const lastEdit = useRef<{ key: string; at: number } | null>(null);
  const saveTimer = useRef<number | undefined>(undefined);
  const glideTimer = useRef<number | undefined>(undefined);
  const flipSnap = useRef<Map<string, number> | null>(null);
  const morphSnap = useRef<Map<string, number> | null>(null);
  const enterId = useRef<string | null>(null);
  const scrollTo = useRef<string | null>(null);

  const selected = sections.find((section) => section.id === sel.id) ?? null;

  /* ——— Medidas: largura útil do palco e modo compacto ——— */
  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const measure = () => {
      setCompact(root.clientWidth < 760);
      const style = getComputedStyle(canvas);
      const pad = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      setCanvasW(Math.max(260, Math.floor(canvas.clientWidth - pad)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  const frameW = Math.min(canvasW, device === 'desktop' ? 1120 : device === 'tablet' ? 768 : 390);
  const screen: Screen =
    device === 'desktop' && frameW >= 500 ? 'desktop' : device !== 'celular' && frameW >= 470 ? 'tablet' : 'mobile';
  const wide = screen === 'desktop' && frameW >= 900;

  /* ——— Histórico ——— */
  const touch = useCallback(() => {
    setSaving(true);
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => setSaving(false), 700);
    setStatus((current) => (current === 'publicada' ? 'pendente' : current));
  }, []);
  useEffect(() => () => window.clearTimeout(saveTimer.current), []);

  function commit(producer: (doc: Doc) => Doc, key?: string) {
    const now = Date.now();
    const coalesce = Boolean(key) && lastEdit.current?.key === key && now - (lastEdit.current?.at ?? 0) < 900;
    lastEdit.current = key ? { key, at: now } : null;
    setHist((h) => {
      const next = producer(h.present);
      if (next === h.present) return h;
      return { past: coalesce ? h.past : [...h.past.slice(-60), h.present], present: next, future: [] };
    });
    touch();
  }
  const patchSection = (id: string, change: Partial<Section> | ((s: Section) => Section), key?: string) =>
    commit(
      (d) => ({
        ...d,
        sections: d.sections.map((s) => (s.id === id ? (typeof change === 'function' ? change(s) : { ...s, ...change }) : s)),
      }),
      key,
    );
  const patchTheme = (change: Partial<Theme>, key?: string) => commit((d) => ({ ...d, theme: { ...d.theme, ...change } }), key);
  const patchPage = (change: Partial<PageMeta>, key?: string) => commit((d) => ({ ...d, page: { ...d.page, ...change } }), key);

  /* ——— Animações da página ——— */
  const sectionEls = () => [...(siteRef.current?.querySelectorAll<HTMLElement>(':scope > [data-sec]') ?? [])];
  const captureFlip = () => {
    flipSnap.current = new Map(sectionEls().map((el) => [el.dataset.sec ?? '', el.offsetTop]));
  };
  const captureMorph = (id: string) => {
    const el = sectionEls().find((node) => node.dataset.sec === id);
    if (el) morphSnap.current = new Map([[id, el.offsetHeight]]);
  };
  const startGlide = () => {
    setGlide(true);
    window.clearTimeout(glideTimer.current);
    glideTimer.current = window.setTimeout(() => setGlide(false), 260);
  };
  useEffect(() => () => window.clearTimeout(glideTimer.current), []);

  useIsoLayoutEffect(() => {
    const els = sectionEls();
    const flip = flipSnap.current;
    const morph = morphSnap.current;
    const entering = enterId.current;
    flipSnap.current = null;
    morphSnap.current = null;
    enterId.current = null;
    const calm = reduced();
    if (flip && !calm)
      els.forEach((el) => {
        const before = flip.get(el.dataset.sec ?? '');
        if (before === undefined) return;
        const dy = before - el.offsetTop;
        if (Math.abs(dy) < 1) return;
        el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 220, easing: EASE_MOVE });
      });
    if (morph && !calm)
      morph.forEach((from, id) => {
        const el = els.find((node) => node.dataset.sec === id);
        if (!el || Math.abs(from - el.offsetHeight) < 1) return;
        el.style.overflow = 'clip';
        const anim = el.animate([{ height: `${from}px` }, { height: `${el.offsetHeight}px` }], { duration: 220, easing: EASE_OUT });
        anim.onfinish = anim.oncancel = () => {
          el.style.overflow = '';
        };
      });
    if (entering) {
      const el = els.find((node) => node.dataset.sec === entering);
      if (el && !calm) {
        el.style.overflow = 'clip';
        const anim = el.animate(
          [
            { height: '0px', opacity: 0 },
            { height: `${el.offsetHeight}px`, opacity: 1 },
          ],
          { duration: 280, easing: EASE_OUT },
        );
        anim.onfinish = anim.oncancel = () => {
          el.style.overflow = '';
        };
      }
    }
    const target = scrollTo.current;
    scrollTo.current = null;
    if (target) {
      const el = els.find((node) => node.dataset.sec === target);
      const canvas = canvasRef.current;
      const stage = stageRef.current;
      if (el && canvas && stage) {
        const top = boxIn(el, stage).y + stage.offsetTop - 48;
        const visible = top + 48 >= canvas.scrollTop && top + 48 + Math.min(el.offsetHeight, 240) <= canvas.scrollTop + canvas.clientHeight;
        if (!visible) canvas.scrollTo({ top: Math.max(0, top), behavior: calm ? 'auto' : 'smooth' });
      }
    }
  }, [sections]);

  /* ——— Camada de seleção: mede contorno, hover, imagem e texto ——— */
  const measure = useCallback(() => {
    const stage = stageRef.current;
    const root = siteRef.current;
    if (!stage || !root) return;
    const all: Record<string, Box> = {};
    root.querySelectorAll<HTMLElement>(':scope > [data-sec]').forEach((el) => {
      all[el.dataset.sec ?? ''] = boxIn(el, stage);
    });
    const selBox = sel.id ? (all[sel.id] ?? null) : null;
    const hoverBox = hover && hover !== sel.id ? (all[hover] ?? null) : null;
    let imgBox: Box | null = null;
    if (sel.id && sel.img !== null) {
      const el = root.querySelector<HTMLElement>(`[data-sec="${sel.id}"] [data-img="${sel.img}"]`);
      if (el) imgBox = boxIn(el, stage);
    }
    const textBox = editing && editing.el.isConnected ? boxIn(editing.el, stage) : null;
    setBoxes((prev) => {
      const sameAll =
        Object.keys(prev.sections).length === Object.keys(all).length &&
        Object.entries(all).every(([id, box]) => sameBox(prev.sections[id], box));
      if (sameAll && sameBox(prev.sel, selBox) && sameBox(prev.hover, hoverBox) && sameBox(prev.img, imgBox) && sameBox(prev.text, textBox)) return prev;
      return { sel: selBox, hover: hoverBox, img: imgBox, text: textBox, sections: all };
    });
  }, [sel, hover, editing]);

  useIsoLayoutEffect(() => {
    measure();
  });
  useEffect(() => {
    const root = siteRef.current;
    if (!root) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(root);
    return () => ro.disconnect();
  }, [measure]);

  /* ——— Ações de seção ——— */
  const indexOf = (id: string) => sections.findIndex((s) => s.id === id);
  const movable = (id: string, delta: -1 | 1) => {
    const from = indexOf(id);
    const to = from + delta;
    return from >= 0 && !isLocked(sections[from]) && to >= 0 && to < sections.length && !isLocked(sections[to]);
  };
  function reorder(from: number, to: number, animateCanvas = true) {
    if (from === to) return;
    if (animateCanvas) captureFlip();
    startGlide();
    commit((d) => {
      const next = [...d.sections];
      const [item] = next.splice(from, 1);
      if (item) next.splice(to, 0, item);
      return { ...d, sections: next };
    });
    const item = sections[from];
    if (item) setAnnounce(`${kindLabel(item)} movida para a posição ${to + 1} de ${sections.length}.`);
  }
  function move(id: string, delta: -1 | 1) {
    if (!movable(id, delta)) return;
    const from = indexOf(id);
    reorder(from, from + delta);
  }
  function duplicate(id: string) {
    const at = indexOf(id);
    const source = sections[at];
    if (!source || isLocked(source)) return;
    const copy: Section = { ...structuredClone(source), id: nextId(source.kind) };
    enterId.current = copy.id;
    scrollTo.current = copy.id;
    commit((d) => ({ ...d, sections: [...d.sections.slice(0, at + 1), copy, ...d.sections.slice(at + 1)] }));
    setSel({ id: copy.id, img: null });
  }
  function toggleHidden(id: string) {
    captureMorph(id);
    const section = sections.find((s) => s.id === id);
    if (!section) return;
    patchSection(id, { hidden: !section.hidden });
  }
  function insert(kind: Kind, at: number) {
    const section = makeSection(kind, nextId(kind));
    enterId.current = section.id;
    scrollTo.current = section.id;
    commit((d) => {
      const index = Math.max(1, Math.min(at, d.sections.length - (isLocked(d.sections[d.sections.length - 1]) ? 1 : 0)));
      return { ...d, sections: [...d.sections.slice(0, index), section, ...d.sections.slice(index)] };
    });
    setSel({ id: section.id, img: null });
    setLibrary(null);
    setLeftTab('secoes');
    if (compact) setView('pagina');
  }
  function restore(section: Section, at: number) {
    enterId.current = section.id;
    scrollTo.current = section.id;
    commit((d) =>
      d.sections.some((s) => s.id === section.id)
        ? d
        : { ...d, sections: [...d.sections.slice(0, at), section, ...d.sections.slice(at)] },
    );
    setSel({ id: section.id, img: null });
  }
  function remove(id: string) {
    const at = indexOf(id);
    const section = sections[at];
    if (!section || isLocked(section)) return;
    setSel({ id: null, img: null });
    setEditing(null);
    const finish = () => {
      commit((d) => ({ ...d, sections: d.sections.filter((s) => s.id !== id) }));
      toast('Seção excluída', {
        description: kindLabel(section),
        action: { label: 'Desfazer', onClick: () => restore(section, at) },
      });
    };
    const el = sectionEls().find((node) => node.dataset.sec === id);
    if (!el || reduced()) return finish();
    el.style.overflow = 'clip';
    el.style.pointerEvents = 'none';
    const anim = el.animate(
      [
        { height: `${el.offsetHeight}px`, opacity: 1 },
        { height: '0px', opacity: 0 },
      ],
      { duration: 200, easing: EASE_MOVE, fill: 'forwards' },
    );
    anim.onfinish = () => {
      finish();
      requestAnimationFrame(() => anim.cancel());
    };
  }
  function undo() {
    const prev = hist.past[hist.past.length - 1];
    if (!prev) return;
    captureFlip();
    startGlide();
    lastEdit.current = null;
    setHist((h) => ({ past: h.past.slice(0, -1), present: prev, future: [h.present, ...h.future] }));
    touch();
    if (sel.id && !prev.sections.some((s) => s.id === sel.id)) setSel({ id: null, img: null });
  }
  function redo() {
    const next = hist.future[0];
    if (!next) return;
    captureFlip();
    startGlide();
    lastEdit.current = null;
    setHist((h) => ({ past: [...h.past, h.present], present: next, future: h.future.slice(1) }));
    touch();
    if (sel.id && !next.sections.some((s) => s.id === sel.id)) setSel({ id: null, img: null });
  }

  function select(id: string | null, img: number | null = null) {
    setSel((current) => (current.id === id && current.img === img ? current : { id, img }));
  }
  function selectFromList(id: string) {
    select(id);
    scrollTo.current = id;
    if (compact) setView('pagina');
    // A rolagem acontece no efeito de layout; força um render mesmo sem mudança de seleção.
    setHover(null);
    requestAnimationFrame(() => {
      const el = sectionEls().find((node) => node.dataset.sec === id);
      const canvas = canvasRef.current;
      const stage = stageRef.current;
      if (!el || !canvas || !stage) return;
      const top = boxIn(el, stage).y + stage.offsetTop - 48;
      canvas.scrollTo({ top: Math.max(0, top), behavior: reduced() ? 'auto' : 'smooth' });
    });
  }
  function openLibrary(at?: number) {
    const index = at ?? (sel.id ? indexOf(sel.id) + 1 : sections.length - 1);
    setLibrary({ at: Math.max(1, Math.min(index, sections.length - 1)) });
    setLeftTab('secoes');
    if (compact) setView('secoes');
  }

  /* ——— Texto no lugar ——— */
  const api = (section: Section): SiteApi => ({
    editable: !preview && sel.id === section.id,
    onText: (path, html) => patchSection(section.id, (s) => writePath(s, path, html), `${section.id}:${path}`),
    onTextFocus: (el, path) => {
      setEditing({ id: section.id, path, el });
      select(section.id);
    },
    onTextBlur: (event: FocusEvent<HTMLElement>) => {
      const next = event.relatedTarget as HTMLElement | null;
      if (next?.closest('[data-text-toolbar]')) return;
      setEditing(null);
    },
  });

  /* ——— Teclado ——— */
  function onKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.defaultPrevented) return;
    const target = event.target as HTMLElement;
    if (!rootRef.current?.contains(target)) return;
    const field = target.closest('input, textarea, select');
    const typing = Boolean(field) || target.isContentEditable;
    const mod = event.metaKey || event.ctrlKey;
    const key = event.key.toLowerCase();
    if (mod && (key === 'z' || key === 'y')) {
      if (field) return;
      event.preventDefault();
      if (key === 'y' || event.shiftKey) redo();
      else undo();
      return;
    }
    if (typing) return;
    if (event.key === 'Escape') {
      if (sel.img !== null && sel.id) {
        event.preventDefault();
        select(sel.id);
      } else if (sel.id) {
        event.preventDefault();
        select(null);
      } else if (library) {
        event.preventDefault();
        setLibrary(null);
      } else if (preview) {
        event.preventDefault();
        setPreview(false);
      } else if (full) {
        event.preventDefault();
        setFull(false);
      }
      return;
    }
    if ((event.key === 'Delete' || event.key === 'Backspace') && sel.id && sel.img === null && !preview) {
      if (target.closest('[role="tab"], [role="radio"]')) return;
      event.preventDefault();
      remove(sel.id);
      return;
    }
    if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown') && sel.id && !target.closest('[data-list]')) {
      event.preventDefault();
      move(sel.id, event.key === 'ArrowUp' ? -1 : 1);
    }
  }

  /* ——— Tela cheia: trava a rolagem da página de fundo ——— */
  useEffect(() => {
    if (!full) return;
    const html = document.documentElement;
    const before = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => {
      html.style.overflow = before;
    };
  }, [full]);

  /* ——— Publicar ——— */
  const canPublish = status !== 'publicada';
  const url = `${SITE_HOST}${doc.page.slug}`;

  /* ——— Render ——— */
  const hiddenCount = sections.filter((s) => s.hidden).length;
  const selIndex = sel.id ? indexOf(sel.id) : -1;
  const hoverIndex = hover ? indexOf(hover) : -1;
  const insertAfter = hoverIndex >= 0 && hoverIndex < sections.length - 1 && !preview ? hoverIndex : -1;
  const insertBox = insertAfter >= 0 ? boxes.sections[sections[insertAfter]?.id ?? ''] : undefined;
  const libraryLine = (() => {
    if (!library) return null;
    const after = sections[library.at - 1];
    const box = after ? boxes.sections[after.id] : undefined;
    return box ? box.y + box.h : null;
  })();

  return (
    <section
      ref={rootRef}
      className={css.editor}
      aria-label="Editor da vitrine"
      data-full={full || undefined}
      data-preview={preview || undefined}
      data-compact={compact || undefined}
      data-view={view}
      onKeyDown={onKeyDown}
    >
      <TopBar
        compact={compact}
        device={device}
        onDevice={(next) => setDevice(next)}
        canUndo={hist.past.length > 0}
        canRedo={hist.future.length > 0}
        onUndo={undo}
        onRedo={redo}
        status={status}
        saving={saving}
        full={full}
        onFull={() => setFull((value) => !value)}
        preview={preview}
        onPreview={() => {
          setPreview((value) => !value);
          setEditing(null);
          setLibrary(null);
        }}
        canPublish={canPublish}
        onPublish={() => setConfirm(true)}
      />
      {compact && (
        <div className={css.viewBar}>
          <Segmented<View>
            size="sm"
            full
            label="Painel"
            value={view}
            onChange={setView}
            options={[
              { value: 'secoes', label: 'Seções' },
              { value: 'pagina', label: 'Página' },
              { value: 'ajustes', label: 'Ajustes' },
            ]}
          />
        </div>
      )}
      <div className={css.body}>
        {/* ——— Esquerda ——— */}
        <aside className={css.left} aria-label="Seções e tema">
          {library ? (
            <LibraryPanel
              after={sections[library.at - 1]}
              onClose={() => setLibrary(null)}
              onPick={(kind) => insert(kind, library.at)}
            />
          ) : (
            <>
              <div className={css.paneTabs}>
                <Tabs
                  size="sm"
                  label="Painel"
                  value={leftTab}
                  onChange={setLeftTab}
                  items={[
                    { value: 'secoes', label: 'Seções', count: sections.length, panelId: 'pb-left-secoes' },
                    { value: 'tema', label: 'Tema', panelId: 'pb-left-tema' },
                  ]}
                />
              </div>
              {leftTab === 'secoes' ? (
                <div className={css.paneBody} id="pb-left-secoes" role="tabpanel" aria-labelledby="pb-left-secoes-tab">
                  <SectionList
                    sections={sections}
                    selected={sel.id}
                    onSelect={selectFromList}
                    onToggle={toggleHidden}
                    onReorder={(from, to) => reorder(from, to)}
                  />
                  <div className={css.paneFoot}>
                    <Button size="sm" icon={Plus} onClick={() => openLibrary()} className={css.addButton}>
                      Adicionar seção
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={css.paneBody} id="pb-left-tema" role="tabpanel" aria-labelledby="pb-left-tema-tab">
                  <ThemePanel theme={doc.theme} onChange={patchTheme} />
                </div>
              )}
            </>
          )}
        </aside>

        {/* ——— Centro ——— */}
        <div
          ref={canvasRef}
          className={css.canvas}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              select(null);
              setLibrary(null);
            }
          }}
        >
          <div
            ref={stageRef}
            className={css.stage}
            style={{ width: frameW }}
            onPointerMove={(event) => {
              const target = event.target as HTMLElement;
              if (!siteRef.current?.contains(target)) return;
              const id = target.closest<HTMLElement>('[data-sec]')?.dataset.sec ?? null;
              setHover(id);
            }}
            onPointerLeave={() => setHover(null)}
          >
            <div className={css.frame} data-device={device}>
              <div className={css.chrome} aria-hidden="true">
                <span className={css.address}>
                  <Lock />
                  {url}
                </span>
              </div>
              <div
                ref={siteRef}
                className={site.site}
                style={themeVars(doc.theme)}
                data-screen={screen}
                data-wide={wide || undefined}
                data-type={doc.theme.type}
                data-corners={doc.theme.corners}
                data-buttons={doc.theme.buttons}
                onClick={(event) => {
                  const target = event.target as HTMLElement;
                  if (target.closest('a')) event.preventDefault();
                  if (preview) return;
                  const secEl = target.closest<HTMLElement>('[data-sec]');
                  const id = secEl?.dataset.sec;
                  if (!id) return;
                  const imgEl = target.closest<HTMLElement>('[data-img]');
                  if (sel.id === id && imgEl) {
                    select(id, Number(imgEl.dataset.img));
                    return;
                  }
                  select(id);
                }}
              >
                {sections.map((section) => {
                  const label = kindLabel(section);
                  const offMobile = device === 'celular' && !section.mobile;
                  if (preview && (section.hidden || offMobile)) return null;
                  const collapsed = section.hidden || offMobile;
                  return (
                    <section
                      key={section.id}
                      className={site.sec}
                      data-sec={section.id}
                      data-kind={section.kind}
                      data-layout={section.layout}
                      data-bg={section.bg}
                      data-align={section.align}
                      data-spacing={section.spacing}
                      data-collapsed={collapsed || undefined}
                      tabIndex={preview ? undefined : 0}
                      aria-label={label}
                      aria-current={sel.id === section.id || undefined}
                      onKeyDown={(event) => {
                        if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                          event.preventDefault();
                          select(section.id);
                        }
                      }}
                    >
                      {collapsed ? (
                        <span className={css.strip}>
                          <EyeOff aria-hidden="true" />
                          <strong>{label}</strong>
                          <span>{section.hidden ? 'Oculta' : 'Oculta no celular'}</span>
                        </span>
                      ) : (
                        <>
                          <SectionBackdrop s={section} />
                          <SectionBody s={section} api={api(section)} screen={screen} />
                        </>
                      )}
                    </section>
                  );
                })}
              </div>
            </div>

            {/* Camada de seleção (não recorta, não rola sozinha) */}
            {!preview && (
              <div className={css.overlay}>
                {boxes.hover && hover && (
                  <div className={css.hoverBox} style={boxStyle(boxes.hover)}>
                    <span className={css.tab} data-tone="hover" data-inside={boxes.hover.y < 24 || undefined}>
                      {kindLabel(sections[hoverIndex] ?? sections[0]!)}
                    </span>
                  </div>
                )}
                {insertBox && libraryLine === null && (
                  <div className={css.insert} style={{ transform: `translate(0px, ${insertBox.y + insertBox.h}px)`, width: frameW }}>
                    <i aria-hidden="true" />
                    <Tooltip content="Adicionar seção">
                      <button
                        type="button"
                        className={css.insertButton}
                        aria-label={`Adicionar seção depois de ${kindLabel(sections[insertAfter]!)}`}
                        tabIndex={-1}
                        onClick={() => openLibrary(insertAfter + 1)}
                      >
                        <Plus aria-hidden="true" />
                      </button>
                    </Tooltip>
                  </div>
                )}
                {libraryLine !== null && (
                  <div className={css.insert} data-active="" style={{ transform: `translate(0px, ${libraryLine}px)`, width: frameW }}>
                    <i aria-hidden="true" />
                    <span className={css.insertButton} aria-hidden="true">
                      <Plus />
                    </span>
                  </div>
                )}
                {boxes.sel && selected && (
                  <div
                    key={selected.id}
                    className={css.selBox}
                    style={boxStyle(boxes.sel)}
                    data-glide={glide || undefined}
                    data-child={sel.img !== null || undefined}
                    data-typing={editing ? '' : undefined}
                  >
                    <span className={css.tab} data-inside={boxes.sel.y < 24 || undefined}>
                      {kindLabel(selected)}
                      {selected.hidden && <EyeOff aria-hidden="true" />}
                    </span>
                    <SectionToolbar
                      section={selected}
                      canUp={movable(selected.id, -1)}
                      canDown={movable(selected.id, 1)}
                      compact={compact}
                      onUp={() => move(selected.id, -1)}
                      onDown={() => move(selected.id, 1)}
                      onDuplicate={() => duplicate(selected.id)}
                      onToggle={() => toggleHidden(selected.id)}
                      onDelete={() => remove(selected.id)}
                      onSettings={() => setView('ajustes')}
                    />
                  </div>
                )}
                {boxes.img && sel.img !== null && (
                  <div className={css.imgBox} style={boxStyle(boxes.img)}>
                    <span className={css.tab} data-inside="">
                      Imagem
                    </span>
                  </div>
                )}
                {editing && boxes.text && <TextToolbar box={boxes.text} frameW={frameW} target={editing.el} />}
              </div>
            )}
          </div>
        </div>

        {/* ——— Direita ——— */}
        <aside className={css.right} aria-label="Ajustes">
          {selected ? (
            sel.img !== null && selected.images[sel.img] ? (
              <ImageInspector
                key={`${selected.id}-${sel.img}`}
                section={selected}
                index={sel.img}
                onBack={() => select(selected.id)}
                onChange={(img, key) =>
                  patchSection(selected.id, (s) => ({ ...s, images: s.images.map((item, i) => (i === sel.img ? { ...item, ...img } : item)) }), key)
                }
              />
            ) : (
              <SectionInspector
                key={selected.id}
                section={selected}
                brand={doc.theme.brand}
                position={selIndex + 1}
                total={sections.length}
                onClose={() => select(null)}
                onPatch={(change, key) => {
                  if ('layout' in change || 'spacing' in change || 'hidden' in change) captureMorph(selected.id);
                  patchSection(selected.id, change, key);
                }}
                onText={(field, value) =>
                  patchSection(selected.id, (s) => writePath(s, `text.${field}`, escapeHtml(value)), `${selected.id}:text.${field}`)
                }
                onImage={(index, img) =>
                  patchSection(selected.id, (s) => ({ ...s, images: s.images.map((item, i) => (i === index ? { ...item, ...img } : item)) }))
                }
                onSelectImage={(index) => select(selected.id, index)}
              />
            )
          ) : (
            <PageInspector page={doc.page} sectionsCount={sections.length} hiddenCount={hiddenCount} onChange={patchPage} />
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Publicar vitrine?"
        description={`A página fica visível em ${url} para os visitantes da Francal 2026.`}
        confirmLabel="Publicar vitrine"
        onConfirm={async () => {
          await wait(900);
          setStatus('publicada');
          toast('Vitrine publicada', { description: url });
        }}
      />
      <VisuallyHidden>
        <span role="status" aria-live="polite">
          {announce}
        </span>
      </VisuallyHidden>
    </section>
  );
}

const boxStyle = (box: Box): CSSProperties => ({
  transform: `translate(${box.x}px, ${box.y}px)`,
  width: box.w,
  height: box.h,
});

/* ———————————————————————————————————————————————————————————————————————————
 * Topo
 * ——————————————————————————————————————————————————————————————————————————— */

const STATUS_TEXT: Record<Status, { label: string; tone: 'gray' | 'green' | 'amber' }> = {
  rascunho: { label: 'Rascunho', tone: 'gray' },
  publicada: { label: 'Publicada', tone: 'green' },
  pendente: { label: 'Alterações não publicadas', tone: 'amber' },
};

function TopBar({
  compact,
  device,
  onDevice,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  status,
  saving,
  full,
  onFull,
  preview,
  onPreview,
  canPublish,
  onPublish,
}: {
  compact: boolean;
  device: Device;
  onDevice: (device: Device) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  status: Status;
  saving: boolean;
  full: boolean;
  onFull: () => void;
  preview: boolean;
  onPreview: () => void;
  canPublish: boolean;
  onPublish: () => void;
}) {
  const state = STATUS_TEXT[status];
  return (
    <header className={css.top}>
      <div className={css.topStart}>
        <Tooltip content="Voltar para Vitrines">
          <IconButton label="Voltar para Vitrines" icon={ArrowLeft} variant="ghost" size="sm" />
        </Tooltip>
        <span className={css.topRule} aria-hidden="true" />
        <div className={css.title}>
          <strong>
            Vitrine <span aria-hidden="true">·</span> Aurora Calçados
          </strong>
          <span className={css.meta}>
            <span className={css.status} data-tone={state.tone}>
              <i aria-hidden="true" />
              <span key={state.label}>{state.label}</span>
            </span>
            <span className={css.metaRule} aria-hidden="true" />
            <span className={css.save} data-saving={saving || undefined} aria-live="polite">
              {saving ? 'Salvando…' : 'Salvo'}
            </span>
          </span>
        </div>
      </div>
      {!compact && (
        <div className={css.topCenter}>
          <Segmented<Device>
            size="sm"
            label="Dispositivo"
            value={device}
            onChange={onDevice}
            options={[
              { value: 'desktop', label: 'Desktop', icon: Monitor },
              { value: 'tablet', label: 'Tablet', icon: Tablet },
              { value: 'celular', label: 'Celular', icon: Smartphone },
            ]}
          />
        </div>
      )}
      <div className={css.topEnd}>
        {!preview && (
          <div className={css.history} role="group" aria-label="Histórico">
            <Tooltip content="Desfazer" shortcut="⌘Z">
              <IconButton label="Desfazer" icon={Undo2} variant="ghost" size="sm" disabled={!canUndo} onClick={onUndo} />
            </Tooltip>
            <Tooltip content="Refazer" shortcut="⇧⌘Z">
              <IconButton label="Refazer" icon={Redo2} variant="ghost" size="sm" disabled={!canRedo} onClick={onRedo} />
            </Tooltip>
          </div>
        )}
        {!compact && (
          <>
            <span className={css.topRule} aria-hidden="true" />
            <Tooltip content={full ? 'Sair da tela cheia' : 'Tela cheia'}>
              <IconButton
                label={full ? 'Sair da tela cheia' : 'Tela cheia'}
                icon={full ? Minimize2 : Maximize2}
                variant="ghost"
                size="sm"
                onClick={onFull}
              />
            </Tooltip>
            <Button size="sm" icon={preview ? X : Eye} onClick={onPreview} aria-pressed={preview}>
              {preview ? 'Sair da prévia' : 'Pré-visualizar'}
            </Button>
          </>
        )}
        {canPublish ? (
          <Button size="sm" variant="primary" onClick={onPublish}>
            Publicar
          </Button>
        ) : (
          <Tooltip content="Nada novo para publicar">
            <Button size="sm" variant="primary" aria-disabled>
              Publicar
            </Button>
          </Tooltip>
        )}
      </div>
    </header>
  );
}

/* ———————————————————————————————————————————————————————————————————————————
 * Barra da seção selecionada e barra de texto
 * ——————————————————————————————————————————————————————————————————————————— */

/** Botão de 28 px das barras flutuantes (fantasma; vermelho só no hover do Excluir). */
function ToolButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  tone,
  shortcut,
  pressed,
  keepFocus = false,
}: {
  label: string;
  icon: ComponentType<{ 'aria-hidden'?: boolean | 'true' }>;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'danger';
  shortcut?: string;
  pressed?: boolean;
  /** Barra de texto: o clique não tira o foco do texto em edição. */
  keepFocus?: boolean;
}) {
  return (
    <Tooltip content={label} shortcut={shortcut}>
      <button
        type="button"
        className={css.toolButton}
        aria-label={label}
        aria-pressed={pressed}
        disabled={disabled}
        data-tone={tone}
        onMouseDown={keepFocus ? (event) => event.preventDefault() : undefined}
        onClick={onClick}
      >
        <Icon aria-hidden="true" />
      </button>
    </Tooltip>
  );
}

function SectionToolbar({
  section,
  canUp,
  canDown,
  compact,
  onUp,
  onDown,
  onDuplicate,
  onToggle,
  onDelete,
  onSettings,
}: {
  section: Section;
  canUp: boolean;
  canDown: boolean;
  compact: boolean;
  onUp: () => void;
  onDown: () => void;
  onDuplicate: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onSettings: () => void;
}) {
  const locked = isLocked(section);
  const label = kindLabel(section);
  return (
    <div
      className={css.toolbar}
      role="toolbar"
      aria-label={`Ações de ${label}`}
    >
      {locked ? (
        <Tooltip content="Posição fixa">
          <span className={css.lockTag} tabIndex={0} aria-label="Posição fixa">
            <Lock aria-hidden="true" />
          </span>
        </Tooltip>
      ) : (
        <>
          <ToolButton label="Mover acima" shortcut="⌥↑" icon={ArrowUp} disabled={!canUp} onClick={onUp} />
          <ToolButton label="Mover abaixo" shortcut="⌥↓" icon={ArrowDown} disabled={!canDown} onClick={onDown} />
          <ToolButton label="Duplicar" icon={Copy} onClick={onDuplicate} />
        </>
      )}
      <ToolButton label={section.hidden ? 'Mostrar' : 'Ocultar'} icon={section.hidden ? Eye : EyeOff} onClick={onToggle} />
      {compact && <ToolButton label="Ajustes" icon={SlidersHorizontal} onClick={onSettings} />}
      {!locked && (
        <>
          <span className={css.toolRule} aria-hidden="true" />
          <ToolButton label="Excluir" shortcut="⌫" icon={Trash2} tone="danger" onClick={onDelete} />
        </>
      )}
    </div>
  );
}

/** Negrito, itálico e link sobre o texto em edição. O foco fica no texto (mousedown não rouba). */
function TextToolbar({ box, frameW, target }: { box: Box; frameW: number; target: HTMLElement }) {
  const [state, setState] = useState({ bold: false, italic: false, link: false });
  const [linking, setLinking] = useState(false);
  const [href, setHref] = useState('https://');
  const range = useRef<Range | null>(null);
  const width = linking ? 252 : 136;

  useEffect(() => {
    const read = () => {
      const selection = document.getSelection();
      const node = selection?.anchorNode ?? null;
      if (!node || !target.contains(node)) return;
      const element = node.nodeType === 1 ? (node as Element) : node.parentElement;
      setState({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        link: Boolean(element?.closest('a')),
      });
    };
    read();
    document.addEventListener('selectionchange', read);
    return () => document.removeEventListener('selectionchange', read);
  }, [target]);

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    target.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const left = Math.max(0, Math.min(box.x, frameW - width));
  const top = box.y - 42;

  function applyLink() {
    const saved = range.current;
    target.focus();
    const selection = document.getSelection();
    if (saved && selection) {
      selection.removeAllRanges();
      selection.addRange(saved);
    }
    const value = href.trim();
    if (value && value !== 'https://') {
      if (saved && !saved.collapsed) exec('createLink', value);
      else exec('insertHTML', `<a href="${value.replace(/"/g, '%22')}">${escapeHtml(value)}</a>`);
    }
    setLinking(false);
  }

  return (
    <div
      className={css.textBar}
      data-text-toolbar=""
      role="toolbar"
      aria-label="Formatação do texto"
      style={{ transform: `translate(${left}px, ${Math.max(-8, top)}px)` }}
      onMouseDown={(event) => {
        if (!(event.target as HTMLElement).closest('input')) event.preventDefault();
      }}
    >
      {linking ? (
        <>
          <Link2 className={css.textBarIcon} aria-hidden="true" />
          <input
            className={css.linkInput}
            value={href}
            aria-label="Endereço do link"
            autoFocus
            onChange={(event) => setHref(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                applyLink();
              }
              if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                setLinking(false);
                target.focus();
              }
            }}
            onBlur={(event) => {
              if (!(event.relatedTarget as HTMLElement | null)?.closest('[data-text-toolbar]')) setLinking(false);
            }}
          />
          <ToolButton label="Aplicar link" icon={Check} keepFocus onClick={applyLink} />
          <ToolButton
            label="Cancelar"
            icon={X}
            keepFocus
            onClick={() => {
              setLinking(false);
              target.focus();
            }}
          />
        </>
      ) : (
        <>
          <ToolButton label="Negrito" shortcut="⌘B" icon={Bold} keepFocus pressed={state.bold} onClick={() => exec('bold')} />
          <ToolButton label="Itálico" shortcut="⌘I" icon={Italic} keepFocus pressed={state.italic} onClick={() => exec('italic')} />
          <ToolButton
            label={state.link ? 'Remover link' : 'Link'}
            icon={state.link ? Unlink : Link2}
            keepFocus
            pressed={state.link}
            onClick={() => {
              if (state.link) {
                exec('unlink');
                return;
              }
              const selection = document.getSelection();
              range.current = selection && selection.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
              setHref('https://');
              setLinking(true);
            }}
          />
          <span className={css.toolRule} aria-hidden="true" />
          <ToolButton label="Limpar formatação" icon={RemoveFormatting} keepFocus onClick={() => exec('removeFormat')} />
        </>
      )}
    </div>
  );
}

/* ———————————————————————————————————————————————————————————————————————————
 * Lista de seções (reordenar pela alça ou Alt + ↑/↓)
 * ——————————————————————————————————————————————————————————————————————————— */

type Drag = { id: string; from: number; to: number; startY: number; rows: HTMLLIElement[]; tops: number[]; heights: number[]; min: number; max: number };

function SectionList({
  sections,
  selected,
  onSelect,
  onToggle,
  onReorder,
}: {
  sections: Section[];
  selected: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onReorder: (from: number, to: number) => void;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const hintId = useId();
  const positions = useRef(new Map<string, number>());
  const settledByDrag = useRef(false);
  const refocus = useRef<{ id: string; part: 'handle' | 'main' } | null>(null);
  const drag = useRef<Drag | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  const rows = () => [...(listRef.current?.querySelectorAll<HTMLLIElement>(':scope > li[data-id]') ?? [])];
  const first = sections.findIndex((s) => !isLocked(s));
  const last = sections.length - 1 - [...sections].reverse().findIndex((s) => !isLocked(s));

  // Depois de cada mudança de ordem: arrasto já está no lugar; o resto desliza (FLIP, 200 ms).
  useIsoLayoutEffect(() => {
    const items = rows();
    if (settledByDrag.current) {
      items.forEach((li) => {
        li.style.transition = '';
        li.style.transform = '';
      });
    } else if (!reduced()) {
      items.forEach((li) => {
        const before = positions.current.get(li.dataset.id ?? '');
        const delta = before === undefined ? 0 : before - li.offsetTop;
        if (Math.abs(delta) > 0.5) li.animate([{ transform: `translateY(${delta}px)` }, { transform: 'none' }], { duration: 200, easing: EASE_MOVE });
      });
    }
    settledByDrag.current = false;
    positions.current = new Map(items.map((li) => [li.dataset.id ?? '', li.offsetTop]));
    const want = refocus.current;
    refocus.current = null;
    if (want) listRef.current?.querySelector<HTMLElement>(`li[data-id="${want.id}"] [data-part="${want.part}"]`)?.focus();
  });

  function keyMove(event: ReactKeyboardEvent<HTMLElement>, index: number, part: 'handle' | 'main') {
    if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
    event.preventDefault();
    const to = index + (event.key === 'ArrowUp' ? -1 : 1);
    const section = sections[index];
    if (!section || isLocked(section) || to < first || to > last) return;
    refocus.current = { id: section.id, part };
    onReorder(index, to);
  }

  function start(event: ReactPointerEvent<HTMLButtonElement>, index: number) {
    const items = rows();
    const li = items[index];
    const section = sections[index];
    if (!li || !section || event.button !== 0) return;
    event.preventDefault();
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    drag.current = {
      id: section.id,
      from: index,
      to: index,
      startY: event.clientY,
      rows: items,
      tops: items.map((item) => item.offsetTop),
      heights: items.map((item) => item.offsetHeight),
      min: first,
      max: last,
    };
    setDragging(section.id);
    items.forEach((item) => {
      if (item !== li) item.style.transition = `transform 200ms ${EASE_MOVE}`;
    });
    const onMove = (moveEvent: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const h = d.heights[d.from] ?? 0;
      const top0 = d.tops[d.from] ?? 0;
      const lo = (d.tops[d.min] ?? 0) - top0;
      const hi = (d.tops[d.max] ?? 0) + (d.heights[d.max] ?? 0) - h - top0;
      const dy = Math.min(Math.max(moveEvent.clientY - d.startY, lo), hi);
      li.style.transform = `translateY(${dy}px)`;
      const center = top0 + dy + h / 2;
      let to = d.from;
      d.rows.forEach((item, i) => {
        if (i === d.from || i < d.min || i > d.max) return;
        const mid = (d.tops[i] ?? 0) + (d.heights[i] ?? 0) / 2;
        let shift = 0;
        if (i > d.from && center > mid) {
          shift = -h;
          to = Math.max(to, i);
        } else if (i < d.from && center < mid) {
          shift = h;
          to = Math.min(to, i);
        }
        item.style.transform = shift ? `translateY(${shift}px)` : '';
      });
      d.to = to;
    };
    const onUp = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', onUp);
      const d = drag.current;
      drag.current = null;
      if (!d) return;
      const slot =
        d.to > d.from
          ? d.heights.slice(d.from + 1, d.to + 1).reduce((sum, value) => sum + value, 0)
          : -d.heights.slice(d.to, d.from).reduce((sum, value) => sum + value, 0);
      const finish = () => {
        setDragging(null);
        if (d.to === d.from) {
          d.rows.forEach((item) => {
            item.style.transition = '';
            item.style.transform = '';
          });
          return;
        }
        settledByDrag.current = true;
        onReorder(d.from, d.to);
      };
      if (reduced()) return finish();
      li.style.transition = `transform 160ms ${EASE_MOVE}`;
      li.style.transform = `translateY(${slot}px)`;
      window.setTimeout(finish, 170);
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onUp);
  }

  return (
    <>
      <ul ref={listRef} className={css.list} aria-label="Seções da página" data-list="">
        {sections.map((section, index) => {
          const meta = KINDS[section.kind];
          const Icon = meta.icon;
          const label = meta.label;
          const locked = isLocked(section);
          const isSelected = selected === section.id;
          return (
            <li
              key={section.id}
              className={css.row}
              data-id={section.id}
              data-selected={isSelected || undefined}
              data-hidden={section.hidden || undefined}
              data-dragging={dragging === section.id || undefined}
            >
              {locked ? (
                <span className={css.rowLock} aria-hidden="true">
                  <Lock />
                </span>
              ) : (
                <button
                  type="button"
                  className={css.handle}
                  data-part="handle"
                  aria-label={`Reordenar ${label}`}
                  aria-describedby={hintId}
                  onPointerDown={(event) => start(event, index)}
                  onKeyDown={(event) => keyMove(event, index, 'handle')}
                >
                  <GripVertical aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                className={css.rowMain}
                data-part="main"
                aria-pressed={isSelected}
                onClick={() => onSelect(section.id)}
                onKeyDown={(event) => keyMove(event, index, 'main')}
              >
                <Icon className={css.rowIcon} aria-hidden="true" />
                <span className={css.rowName}>{label}</span>
                {!section.mobile && (
                  <span className={css.rowFlag} title="Oculta no celular">
                    <Smartphone aria-hidden="true" />
                    <VisuallyHidden>Oculta no celular</VisuallyHidden>
                  </span>
                )}
              </button>
              <Tooltip content={section.hidden ? 'Mostrar' : 'Ocultar'}>
                <IconButton
                  className={css.eye}
                  label={section.hidden ? `Mostrar ${label}` : `Ocultar ${label}`}
                  icon={section.hidden ? EyeOff : Eye}
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggle(section.id)}
                />
              </Tooltip>
            </li>
          );
        })}
      </ul>
      <VisuallyHidden>
        <span id={hintId}>Alt mais seta para cima ou para baixo muda a posição.</span>
      </VisuallyHidden>
    </>
  );
}

/* ——— Biblioteca de seções ——— */

function LibraryPanel({ after, onClose, onPick }: { after?: Section; onClose: () => void; onPick: (kind: Kind) => void }) {
  const [query, setQuery] = useState('');
  const fold = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const matches = LIBRARY.filter((kind) => fold(KINDS[kind].label).includes(fold(query.trim())));
  const firstRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    firstRef.current?.focus({ preventScroll: true });
  }, []);
  let firstAssigned = false;
  return (
    <div className={css.library}>
      <div className={css.libraryHead}>
        <Tooltip content="Voltar às seções">
          <IconButton label="Voltar às seções" icon={ArrowLeft} variant="ghost" size="sm" onClick={onClose} />
        </Tooltip>
        <div className={css.libraryTitle}>
          <strong>Adicionar seção</strong>
          {after && <span>Depois de {kindLabel(after)}</span>}
        </div>
      </div>
      <div className={css.librarySearch}>
        <SearchField size="sm" value={query} onValueChange={setQuery} label="Buscar seção" placeholder="Buscar seção" />
      </div>
      <div className={css.libraryBody}>
        {LIBRARY_GROUPS.map((group) => {
          const kinds = matches.filter((kind) => KINDS[kind].group === group);
          if (!kinds.length) return null;
          return (
            <div key={group} className={css.libraryGroup} role="group" aria-label={group}>
              <span className={css.groupLabel}>{group}</span>
              <div className={css.cards}>
                {kinds.map((kind) => {
                  const meta = KINDS[kind];
                  const isFirst = !firstAssigned;
                  firstAssigned = true;
                  return (
                    <button
                      key={kind}
                      ref={isFirst ? firstRef : undefined}
                      type="button"
                      className={css.card}
                      onClick={() => onPick(kind)}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                          event.preventDefault();
                          event.stopPropagation();
                          onClose();
                        }
                      }}
                    >
                      <span className={css.cardArt}>
                        <Wireframe kind={kind} layout={meta.layouts[0]?.id ?? ''} />
                      </span>
                      <span className={css.cardLabel}>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {!matches.length && <p className={css.empty}>Nenhuma seção encontrada</p>}
      </div>
    </div>
  );
}

/* ——— Tema ——— */

function ThemePanel({ theme, onChange }: { theme: Theme; onChange: (change: Partial<Theme>, key?: string) => void }) {
  return (
    <div className={css.theme}>
      <div className={css.group}>
        <span className={css.groupTitle}>Cor da marca</span>
        <div className={css.swatches} role="radiogroup" aria-label="Cor da marca">
          {BRAND_SWATCHES.map((swatch) => {
            const checked = theme.brand.toUpperCase() === swatch.hex;
            return (
              <Tooltip key={swatch.hex} content={swatch.label}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  aria-label={swatch.label}
                  className={css.swatch}
                  style={{ '--swatch': swatch.hex } as CSSProperties}
                  onClick={() => onChange({ brand: swatch.hex })}
                >
                  {checked && <Check aria-hidden="true" />}
                </button>
              </Tooltip>
            );
          })}
        </div>
        <ColorField label="Cor da marca em hexadecimal" value={theme.brand} onChange={(brand) => onChange({ brand }, 'theme:brand')} />
      </div>
      <div className={css.group}>
        <span className={css.groupTitle}>Tipografia</span>
        <div className={css.typeList} role="radiogroup" aria-label="Tipografia">
          {TYPE_PAIRS.map((pair) => (
            <button
              key={pair.id}
              type="button"
              role="radio"
              aria-checked={theme.type === pair.id}
              className={css.typeOption}
              data-type={pair.id}
              onClick={() => onChange({ type: pair.id })}
            >
              <span className={css.typeSample} aria-hidden="true">
                Aa
              </span>
              <span className={css.typeText}>
                <strong>{pair.label}</strong>
                <span>{pair.fonts}</span>
              </span>
              <span className={css.radioDot} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
      <div className={css.group}>
        <span className={css.groupTitle}>Cantos</span>
        <div className={css.tiles} role="radiogroup" aria-label="Cantos">
          {(
            [
              ['reto', 'Reto', 0],
              ['suave', 'Suave', 5],
              ['arredondado', 'Redondo', 11],
            ] as const
          ).map(([value, label, radius]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={theme.corners === value}
              className={css.tile}
              onClick={() => onChange({ corners: value })}
            >
              <svg viewBox="0 0 28 20" aria-hidden="true" className={css.cornerGlyph}>
                <path d={`M5 18V${4 + radius} ${radius ? `Q5 4 ${5 + radius} 4` : ''}H24`} fill="none" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className={css.group}>
        <span className={css.groupTitle}>Botões</span>
        <div className={css.tiles} data-cols="2" role="radiogroup" aria-label="Botões">
          {(
            [
              ['solido', 'Sólido'],
              ['contorno', 'Contorno'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={theme.buttons === value}
              className={css.tile}
              onClick={() => onChange({ buttons: value })}
            >
              <span
                className={css.buttonGlyph}
                data-style={value}
                data-corners={theme.corners}
                style={{ '--swatch': theme.brand } as CSSProperties}
                aria-hidden="true"
              />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ———————————————————————————————————————————————————————————————————————————
 * Inspetor
 * ——————————————————————————————————————————————————————————————————————————— */

function Group({ title, children, defaultOpen = true, meta }: { title: string; children: ReactNode; defaultOpen?: boolean; meta?: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={css.igroup} data-open={open || undefined}>
      <button type="button" className={css.igroupHead} aria-expanded={open} aria-controls={id} onClick={() => setOpen((value) => !value)}>
        <span>{title}</span>
        {meta && <span className={css.igroupMeta}>{meta}</span>}
        <ChevronDown aria-hidden="true" />
      </button>
      <div className={css.igroupBody} id={id} inert={!open || undefined}>
        <div className={css.igroupClip}>
          <div className={css.igroupInner}>{children}</div>
        </div>
      </div>
    </div>
  );
}

/** Grupo de rádios com setas (roving tabindex). */
function useRoving<T extends string>(values: readonly T[], value: T, onChange: (value: T) => void) {
  return (event: ReactKeyboardEvent<HTMLElement>) => {
    const index = values.indexOf(value);
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = values[(index + delta + values.length) % values.length];
    if (next === undefined) return;
    onChange(next);
    const group = event.currentTarget;
    requestAnimationFrame(() => group.querySelector<HTMLElement>('[aria-checked="true"]')?.focus());
  };
}

function LayoutPicker({ section, onChange }: { section: Section; onChange: (layout: string) => void }) {
  const layouts = KINDS[section.kind].layouts;
  const ids = layouts.map((layout) => layout.id);
  const onKey = useRoving(ids, section.layout, onChange);
  return (
    <div className={css.layouts} role="radiogroup" aria-label="Layout" data-count={layouts.length} onKeyDown={onKey}>
      {layouts.map((layout) => {
        const checked = section.layout === layout.id;
        return (
          <button
            key={layout.id}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            className={css.layout}
            onClick={() => onChange(layout.id)}
          >
            <span className={css.layoutArt}>
              <Wireframe kind={section.kind} layout={layout.id} />
            </span>
            <span className={css.layoutLabel}>{layout.label}</span>
          </button>
        );
      })}
    </div>
  );
}

const BG_OPTIONS: { value: Bg; label: string }[] = [
  { value: 'branco', label: 'Branco' },
  { value: 'suave', label: 'Suave' },
  { value: 'marca', label: 'Marca' },
  { value: 'imagem', label: 'Imagem' },
];

function BgPicker({ value, bgArt, brand, onChange }: { value: Bg; bgArt: ArtId; brand: string; onChange: (bg: Bg) => void }) {
  const onKey = useRoving(
    BG_OPTIONS.map((option) => option.value),
    value,
    onChange,
  );
  return (
    <div className={css.bgs} role="radiogroup" aria-label="Fundo" onKeyDown={onKey} style={{ '--brand': brand } as CSSProperties}>
      {BG_OPTIONS.map((option) => {
        const checked = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            className={css.bg}
            onClick={() => onChange(option.value)}
          >
            <span className={css.bgSwatch} data-bg={option.value}>
              {option.value === 'imagem' && <Art id={bgArt} />}
            </span>
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Miniatura + nome do arquivo + Trocar (biblioteca da vitrine ou arquivo do computador). */
function ImageCard({ img, onChange, onOpen, large = false }: { img: Img; onChange: (img: Partial<Img>) => void; onOpen?: () => void; large?: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const name = img.file ?? artOf(img.art).file;
  return (
    <div className={css.imageCard} data-large={large || undefined}>
      {onOpen ? (
        <button type="button" className={css.imageThumb} onClick={onOpen} aria-label="Editar imagem">
          <ImageView img={img} />
        </button>
      ) : (
        <span className={css.imageThumb}>
          <ImageView img={img} />
        </span>
      )}
      <div className={css.imageRow}>
        <span className={css.fileName} title={name}>
          {name}
        </span>
        <Popover
          label="Trocar imagem"
          side="bottom"
          align="end"
          width={272}
          trigger={(props) => (
            <Button {...props} size="sm">
              Trocar
            </Button>
          )}
        >
          {({ close }) => (
            <div className={css.picker}>
              <span className={css.pickerTitle}>Biblioteca da vitrine</span>
              <div className={css.pickerGrid}>
                {ARTS.map((art) => {
                  const current = !img.src && img.art === art.id;
                  return (
                    <button
                      key={art.id}
                      type="button"
                      className={css.pickerItem}
                      aria-pressed={current}
                      aria-label={art.label}
                      title={art.label}
                      onClick={() => {
                        onChange({ art: art.id, src: undefined, file: undefined });
                        close();
                      }}
                    >
                      <Art id={art.id} />
                    </button>
                  );
                })}
              </div>
              <Button size="sm" icon={Upload} className={css.pickerUpload} onClick={() => fileRef.current?.click()}>
                Enviar do computador
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  onChange({ src: URL.createObjectURL(file), file: file.name });
                  event.target.value = '';
                  close();
                }}
              />
            </div>
          )}
        </Popover>
      </div>
    </div>
  );
}

function SectionInspector({
  section,
  brand,
  position,
  total,
  onClose,
  onPatch,
  onText,
  onImage,
  onSelectImage,
}: {
  section: Section;
  brand: string;
  position: number;
  total: number;
  onClose: () => void;
  onPatch: (change: Partial<Section>, key?: string) => void;
  onText: (field: string, value: string) => void;
  onImage: (index: number, img: Partial<Img>) => void;
  onSelectImage: (index: number) => void;
}) {
  const meta = KINDS[section.kind];
  const Icon = meta.icon;
  const hero = section.kind === 'hero';
  return (
    <div className={css.inspector}>
      <div className={css.ihead}>
        <Icon className={css.iheadIcon} aria-hidden="true" />
        <div className={css.iheadText}>
          <strong>{meta.label}</strong>
          <span>
            {position} de {total}
            {section.hidden && ' · Oculta'}
          </span>
        </div>
        <Tooltip content="Ajustes da página">
          <IconButton label="Ajustes da página" icon={X} variant="ghost" size="sm" onClick={onClose} />
        </Tooltip>
      </div>
      <div className={css.ibody}>
        <Group title="Layout" meta={meta.layouts.find((l) => l.id === section.layout)?.label}>
          <LayoutPicker section={section} onChange={(layout) => onPatch({ layout })} />
        </Group>
        <Group title="Conteúdo">
          {meta.fields.map((field) => {
            const value = plain(readPath(section, `text.${field.key}`));
            return (
              <Field key={field.key} label={field.label}>
                {({ id, describedBy }) =>
                  field.multiline ? (
                    <Textarea id={id} aria-describedby={describedBy} value={value} autoSize={{ minRows: 2, maxRows: 5 }} onChange={(event) => onText(field.key, event.target.value)} />
                  ) : (
                    <Input id={id} size="sm" aria-describedby={describedBy} value={value} onChange={(event) => onText(field.key, event.target.value)} />
                  )
                }
              </Field>
            );
          })}
          {meta.options?.map((option) => {
            if (option.kind === 'switch')
              return (
                <Switch
                  key={option.key}
                  size="sm"
                  label={option.label}
                  checked={Boolean(section.flags[option.key])}
                  onCheckedChange={(checked) => onPatch({ flags: { ...section.flags, [option.key]: checked } })}
                />
              );
            if (option.kind === 'segmented')
              return (
                <div key={option.key} className={css.inline}>
                  <span className={css.inlineLabel}>{option.label}</span>
                  <Segmented
                    size="sm"
                    label={option.label}
                    value={section.opts[option.key] ?? option.options[0]?.value ?? ''}
                    onChange={(value) => onPatch({ opts: { ...section.opts, [option.key]: value } })}
                    options={option.options}
                  />
                </div>
              );
            return (
              <Field key={option.key} label={option.label}>
                {({ id }) => (
                  <Select
                    id={id}
                    size="sm"
                    value={section.opts[option.key] ?? ''}
                    onChange={(value) => onPatch({ opts: { ...section.opts, [option.key]: value } })}
                    options={option.options}
                  />
                )}
              </Field>
            );
          })}
        </Group>
        {meta.images && section.images.length > 0 && (
          <Group title={hero ? 'Imagem' : 'Imagens'} meta={hero ? undefined : section.images.length}>
            {hero && section.images[0] ? (
              <>
                <ImageCard img={section.images[0]} onChange={(img) => onImage(0, img)} onOpen={() => onSelectImage(0)} />
                <Field label="Texto alternativo">
                  {({ id }) => (
                    <Input
                      id={id}
                      size="sm"
                      value={section.images[0]?.alt ?? ''}
                      onChange={(event) => onImage(0, { alt: event.target.value })}
                    />
                  )}
                </Field>
              </>
            ) : (
              <div className={css.thumbs}>
                {section.images.map((img, index) => (
                  <button key={index} type="button" className={css.thumb} aria-label={`Editar imagem ${index + 1}: ${img.alt}`} onClick={() => onSelectImage(index)}>
                    <ImageView img={img} />
                  </button>
                ))}
              </div>
            )}
          </Group>
        )}
        <Group title="Estilo">
          <div className={css.stack}>
            <span className={css.inlineLabel}>Fundo</span>
            <BgPicker value={section.bg} bgArt={section.bgArt} brand={brand} onChange={(bg) => onPatch({ bg })} />
            {section.bg === 'imagem' && (
              <ImageCard
                img={{ art: section.bgArt, alt: '', fit: 'preencher' }}
                onChange={(img) => {
                  if (img.art) onPatch({ bgArt: img.art });
                }}
              />
            )}
          </div>
          <div className={css.stack}>
            <span className={css.inlineLabel}>Alinhamento</span>
            <Segmented<Align>
              size="sm"
              full
              label="Alinhamento"
              value={section.align}
              onChange={(align) => onPatch({ align })}
              options={[
                { value: 'esquerda', label: 'Esquerda', icon: AlignLeft },
                { value: 'centro', label: 'Centro', icon: AlignCenter },
              ]}
            />
          </div>
          <div className={css.stack}>
            <span className={css.inlineLabel}>Espaçamento</span>
            <Segmented<Spacing>
              size="sm"
              full
              label="Espaçamento"
              value={section.spacing}
              onChange={(spacing) => onPatch({ spacing })}
              options={[
                { value: 'compacto', label: 'Compacto' },
                { value: 'medio', label: 'Médio' },
                { value: 'amplo', label: 'Amplo' },
              ]}
            />
          </div>
        </Group>
        <Group title="Visibilidade">
          <Switch size="sm" label="Mostrar na página" checked={!section.hidden} onCheckedChange={(checked) => onPatch({ hidden: !checked })} />
          <Switch size="sm" label="Mostrar no celular" checked={section.mobile} disabled={section.hidden} onCheckedChange={(mobile) => onPatch({ mobile })} />
        </Group>
      </div>
    </div>
  );
}

function ImageInspector({
  section,
  index,
  onBack,
  onChange,
}: {
  section: Section;
  index: number;
  onBack: () => void;
  onChange: (img: Partial<Img>, key?: string) => void;
}) {
  const img = section.images[index];
  if (!img) return null;
  const many = section.images.length > 1;
  return (
    <div className={css.inspector}>
      <div className={css.ihead}>
        <Tooltip content={`Voltar a ${kindLabel(section)}`}>
          <IconButton label={`Voltar a ${kindLabel(section)}`} icon={ArrowLeft} variant="ghost" size="sm" onClick={onBack} />
        </Tooltip>
        <div className={css.iheadText}>
          <strong>Imagem</strong>
          <span>
            {kindLabel(section)}
            {many && ` · ${index + 1} de ${section.images.length}`}
          </span>
        </div>
      </div>
      <div className={css.ibody} data-pad="">
        <ImageCard img={img} onChange={(change) => onChange(change)} large />
        <Field label="Texto alternativo">
          {({ id }) => (
            <Textarea
              id={id}
              value={img.alt}
              autoSize={{ minRows: 2, maxRows: 4 }}
              onChange={(event) => onChange({ alt: event.target.value }, `${section.id}:img${index}:alt`)}
            />
          )}
        </Field>
        <div className={css.stack}>
          <span className={css.inlineLabel}>Enquadramento</span>
          <Segmented<Img['fit']>
            size="sm"
            full
            label="Enquadramento"
            value={img.fit}
            onChange={(fit) => onChange({ fit })}
            options={[
              { value: 'preencher', label: 'Preencher' },
              { value: 'ajustar', label: 'Ajustar' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function PageInspector({
  page,
  sectionsCount,
  hiddenCount,
  onChange,
}: {
  page: PageMeta;
  sectionsCount: number;
  hiddenCount: number;
  onChange: (change: Partial<PageMeta>, key?: string) => void;
}) {
  return (
    <div className={css.inspector}>
      <div className={css.ihead}>
        <Monitor className={css.iheadIcon} aria-hidden="true" />
        <div className={css.iheadText}>
          <strong>Página</strong>
          <span>
            {sectionsCount} seções{hiddenCount ? ` · ${hiddenCount} oculta${hiddenCount > 1 ? 's' : ''}` : ''}
          </span>
        </div>
      </div>
      <div className={css.ibody} data-pad="">
        <Field label="Título da página">
          {({ id }) => <Input id={id} size="sm" value={page.title} onChange={(event) => onChange({ title: event.target.value }, 'page:title')} />}
        </Field>
        <Field label="Endereço">
          {({ id }) => (
            <Input
              id={id}
              size="sm"
              prefix={SITE_HOST}
              value={page.slug}
              onChange={(event) => onChange({ slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }, 'page:slug')}
            />
          )}
        </Field>
        <Field label="Descrição" meta={<span className={css.counter}>{page.description.length}/160</span>}>
          {({ id }) => (
            <Textarea
              id={id}
              value={page.description}
              maxLength={160}
              autoSize={{ minRows: 3, maxRows: 5 }}
              onChange={(event) => onChange({ description: event.target.value }, 'page:description')}
            />
          )}
        </Field>
        <div className={css.stack}>
          <span className={css.inlineLabel}>Prévia na busca</span>
          <div className={css.serp}>
            <span className={css.serpUrl}>
              {SITE_HOST}
              {page.slug}
            </span>
            <strong className={css.serpTitle}>{page.title || 'Sem título'}</strong>
            <span className={css.serpText}>{page.description}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ———————————————————————————————————————————————————————————————————————————
 * Prancha
 * ——————————————————————————————————————————————————————————————————————————— */

function EditorVitrine() {
  const [run, setRun] = useState(0);
  return (
    <>
      <Shots>
        <Shot
          title="Em contexto"
          align="stretch"
          pad="none"
          aside={
            <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => setRun((n) => n + 1)}>
              Reiniciar
            </Button>
          }
        >
          <PageBuilder key={run} />
        </Shot>
        <Shot title="Celular" align="center" pad="md">
          <div className={css.phone}>
            <PageBuilder key={`phone-${run}`} startSelected={null} />
          </div>
        </Shot>
      </Shots>
      <EnsureToaster />
    </>
  );
}

export const specimens: Record<string, ComponentType> = {
  'editor-vitrine': EditorVitrine,
};
