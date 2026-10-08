'use client';

/*
 * Estrutura (Contrato V3 · grupo estrutura): cabeçalho de página, seções e painéis, acordeão,
 * área de rolagem, painéis redimensionáveis, lista de descrição e moldura fixa.
 * Tudo chapado, fio de 1px, movimento curto e respeitando prefers-reduced-motion (tema).
 */

import { ArrowLeft, Check, ChevronDown, Copy, PanelLeftOpen } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
  type UIEvent,
} from 'react';
import { VisuallyHidden } from './a11y';
import { Tooltip, TruncatedText } from './overlays';
import { MetaList, type MetaItem } from './surfaces';
import s from './structure.module.css';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Largura de um elemento, observada. `undefined` antes da primeira medida (SSR). */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState<number | undefined>(undefined);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === 'function') ref(value);
  else (ref as { current: T | null }).current = value;
}

/**
 * Principal + lateral (contrato §12): `minmax(0,1fr) var(--aside-w)`, vão 24. Responde à própria
 * largura: abaixo de 1000 px a lateral desce para baixo do principal e os blocos dela dividem a
 * linha (mín. 320). Os dois lados empilham os filhos com o mesmo ritmo de 24.
 */
export function SplitLayout({
  main,
  aside,
  asideLabel = 'Resumo',
  className = '',
}: {
  main: ReactNode;
  aside: ReactNode;
  /** Nome da região lateral para leitor de tela. */
  asideLabel?: string;
  className?: string;
}) {
  return (
    <div className={`${s.mainAside} ${className}`} data-part="main-aside">
      <div className={s.mainAsideGrid}>
        <div className={s.mainAsideMain}>{main}</div>
        <aside className={s.mainAsideSide} aria-label={asideLabel}>
          {aside}
        </aside>
      </div>
    </div>
  );
}

/* ——————————————————————————— PageHeader ——————————————————————————— */

/** Composição de página do V3: ritmo de 24 px, sem somar a margem do cabeçalho ao gap. */
export function PageStack({ className = '', ...props }: ComponentProps<'div'>) {
  return <div className={`${s.pageStack} ${className}`} data-part="page-stack" {...props} />;
}

/** Volta discreta antes do título (“← Produções”). */
export type PageHeaderBack = {
  label: string;
  href: string;
  /** Clique na volta (navegação do cliente, guarda de saída); `preventDefault` fica com quem chama. */
  onNavigate?: (event: MouseEvent<HTMLAnchorElement>) => void;
  /** Estado parado para pranchas (`hover`, `active`, `focus`). Nunca no produto. */
  force?: string;
};

/** Motivo visível de uma ação indisponível; o botão leva `aria-describedby={id}`. */
export type PageHeaderNote = { id: string; text: string };

/**
 * Cabeçalho de página: título (24; 22 em ≤760), status na mesma linha, meta em “·” sem separador
 * pendurado, ações à direita (principal primeiro: principal, secundária, ⋯) e `toolbar` abaixo.
 * Em ≤640 as ações descem para baixo do título com a principal esticada; o `more` (⋯) fica na
 * linha do título. `variant="frame"` é o cabeçalho contido da moldura de criação (título 18).
 * Com `steps`, a moldura é uma linha só: título · status · régua · ações · ⋯ — o título cede
 * primeiro (até 10rem), depois a régua recolhe os nomes; em ≤640 a régua desce para a linha dela
 * (`stepsCompact` no lugar, quando houver). Responde à largura do próprio cabeçalho (container
 * query), não da janela: o servidor e a primeira pintura saem iguais.
 * `back` põe a volta (“← Produções”) antes do título, na mesma linha e fora do h1 — numa tela sem o
 * menu do app (`AppShell layout="immersive"`) é o caminho de volta; em ≤640 fica só a seta.
 * `actionsNote` é o motivo visível de uma ação indisponível, logo antes das ações: uma linha
 * discreta que corta com reticência (o texto inteiro na dica) e cede antes do título; em ≤640 desce
 * para a linha dela e quebra.
 */
export function PageHeader({
  title,
  description,
  actions,
  actionsNote,
  more,
  toolbar,
  steps,
  stepsCompact,
  notice,
  eyebrow,
  status,
  meta,
  back,
  variant = 'page',
  titleAs: Title = 'h1',
  className = '',
}: {
  title: ReactNode;
  description?: ReactNode;
  /** Principal primeiro, depois as secundárias. */
  actions?: ReactNode;
  /**
   * Motivo visível de uma ação indisponível (“Aguarde a IA terminar.”): 12 px em `--muted`, numa
   * linha logo antes das ações. Corta com reticência e mostra o texto inteiro na dica; em ≤640
   * desce para a linha dele e quebra. O botão indisponível leva `aria-describedby={id}` (e
   * `aria-disabled`): o motivo nunca fica só numa dica.
   */
  actionsNote?: PageHeaderNote;
  /**
   * Volta antes do título (“← Produções”), discreta e fora do h1. Em ≤640 vira só a seta; o nome
   * acessível é sempre “Voltar para {label}”. Não combine com `eyebrow`.
   */
  back?: PageHeaderBack;
  /** Menu “⋯”: fica na linha do título no celular. */
  more?: ReactNode;
  toolbar?: ReactNode;
  /**
   * `frame`: régua de etapas (`Stepper size="sm"`) na linha do título, entre o título e as ações.
   * Pede ~27rem (o `sm` com quatro nomes) e estica até o que sobra; sem espaço, o título trunca
   * antes, até 10rem, e só então a régua recolhe os nomes.
   */
  steps?: ReactNode;
  /** `frame` com `steps`: o que fica no lugar da régua em ≤640 (ex.: `StepperCompact`). */
  stepsCompact?: ReactNode;
  /**
   * Aviso da página dentro do cabeçalho (`Banner variant="inline"`), na largura toda, logo abaixo
   * da linha do título: numa moldura encostada (`WorkspaceLayout docked`), uma faixa acima dela
   * empurraria a moldura para fora da janela.
   */
  notice?: ReactNode;
  /** Compatibilidade. Evite: o título não precisa de selo acima. */
  eyebrow?: ReactNode;
  /** Status logo depois do título (Badge em texto). */
  status?: ReactNode;
  /** Fatos curtos separados por “·”. Número, data ou código: `{ value, numeric: true }`. */
  meta?: (ReactNode | MetaItem)[];
  variant?: 'page' | 'frame';
  titleAs?: 'h1' | 'h2';
  className?: string;
}) {
  /* Título que corta (2 linhas, ou uma na moldura) mostra o texto inteiro numa dica do DS. */
  const titleText = typeof title === 'string' ? title : undefined;
  return (
    <header className={`${s.ph} ${className}`} data-variant={variant} data-part="page-header">
      <div
        className={s.phMain}
        data-actions={actions || actionsNote ? true : undefined}
        data-more={more ? true : undefined}
        data-steps={steps ? true : undefined}
      >
        <div className={s.phText} data-back={back ? true : undefined}>
          {back && (
            <a
              className={s.phBack}
              href={back.href}
              onClick={back.onNavigate}
              aria-label={`Voltar para ${back.label}`}
              data-force={back.force}
              data-part="page-header-back"
            >
              <ArrowLeft aria-hidden="true" />
              <span className={s.phBackText}>{back.label}</span>
            </a>
          )}
          {eyebrow && <div className={s.phEyebrow}>{eyebrow}</div>}
          <div className={s.phTitleRow}>
            {titleText !== undefined ? (
              <TruncatedText as={Title} className={s.phTitle} text={titleText} />
            ) : (
              <Title className={s.phTitle}>{title}</Title>
            )}
            {status && <span className={s.phStatus}>{status}</span>}
          </div>
          {description && <p className={s.phDesc}>{description}</p>}
          {meta && meta.length > 0 && <MetaList items={meta} className={s.phMeta} />}
        </div>
        {steps && (
          <div
            className={s.phSteps}
            data-part="page-header-steps"
            data-compact={stepsCompact ? true : undefined}
          >
            {steps}
          </div>
        )}
        {steps && stepsCompact && (
          <div className={s.phStepsCompact} data-part="page-header-steps-compact">
            {stepsCompact}
          </div>
        )}
        {(actions || actionsNote) && (
          <div className={s.phActions}>
            {actionsNote && (
              <TruncatedText
                id={actionsNote.id}
                className={s.phNote}
                text={actionsNote.text}
                data-part="page-header-note"
              />
            )}
            {actions}
          </div>
        )}
        {more && <div className={s.phMore}>{more}</div>}
      </div>
      {notice && (
        <div className={s.phNotice} data-part="page-header-notice">
          {notice}
        </div>
      )}
      {toolbar && <div className={s.phToolbar}>{toolbar}</div>}
    </header>
  );
}

/* ——————————————————————————— Section · Panel ——————————————————————————— */

const PanelContext = createContext(false);

/**
 * Painel com fio e `--r-lg`: as `Section` de dentro viram blocos separados por 1px `--line`
 * (lateral do detalhe: P.I., Histórico, Vínculos).
 */
export function Panel({
  children,
  padding = 'md',
  as: Tag = 'div',
  className = '',
  label,
}: {
  children: ReactNode;
  /** `md` 14/16 (lateral de 320); `lg` 18/20 (painel largo). */
  padding?: 'md' | 'lg';
  as?: 'div' | 'aside' | 'section';
  className?: string;
  label?: string;
}) {
  return (
    <PanelContext.Provider value={true}>
      <Tag className={`${s.panel} ${className}`} data-pad={padding} aria-label={label}>
        {children}
      </Tag>
    </PanelContext.Provider>
  );
}

/**
 * Seção de página. `open`: título 14 + meta + ação à direita, sem caixa (seções irmãs ganham fio
 * entre si). `panel`: caixa com fio (dentro de `Panel`, vira bloco). `band`: faixa rebaixada de
 * filtros. Nada de número no título nem frase de descrição.
 */
export function Section({
  title,
  meta,
  metaTone = 'muted',
  action,
  children,
  variant = 'open',
  titleAs: Title = 'h2',
  id,
  className = '',
}: {
  title?: ReactNode;
  meta?: ReactNode;
  /** `missing` pinta a meta de vermelho (“2 obrigatórios faltando”). */
  metaTone?: 'muted' | 'missing';
  action?: ReactNode;
  children?: ReactNode;
  variant?: 'open' | 'panel' | 'band';
  titleAs?: 'h2' | 'h3' | 'h4';
  id?: string;
  className?: string;
}) {
  const inPanel = useContext(PanelContext);
  const headingId = useId();
  const mode = inPanel && variant !== 'band' ? 'block' : variant;
  const hasHead = Boolean(title || meta || action);
  if (mode === 'band') {
    return (
      <div
        id={id}
        className={`${s.band} ${className}`}
        role={title ? 'group' : undefined}
        aria-label={typeof title === 'string' ? title : undefined}
      >
        {title && <span className={s.bandTitle}>{title}</span>}
        {children}
      </div>
    );
  }
  return (
    <section
      id={id}
      className={`${s.section} ${className}`}
      data-variant={mode}
      aria-labelledby={title ? headingId : undefined}
    >
      {hasHead && (
        <div className={s.sectionHead}>
          {title && (
            <Title id={headingId} className={s.sectionTitle}>
              {title}
            </Title>
          )}
          {meta !== undefined && (
            <span className={s.sectionMeta} data-tone={metaTone}>
              {meta}
            </span>
          )}
          {action && <div className={s.sectionAction}>{action}</div>}
        </div>
      )}
      {children !== undefined && (
        // `data-part`: campos irmãos no corpo ganham o vão da pilha de campos (fields.module.css).
        <div className={s.sectionBody} data-part="section-body">
          {children}
        </div>
      )}
    </section>
  );
}

/* ——————————————————————————— Accordion · Disclosure ——————————————————————————— */

export type AccordionStatus = 'done' | 'error' | 'warning';

export type AccordionItem = {
  id: string;
  title: ReactNode;
  /** Informação curta à direita (“2 campos”, “R$ 18.000,00”). */
  meta?: ReactNode;
  /** `done` check azul claro; `error` “!” vermelho; `warning` “!” âmbar. */
  status?: AccordionStatus;
  content: ReactNode;
  disabled?: boolean;
  /** Só pranchas: estado parado no cabeçalho (`hover`, `focus`, `active`). */
  force?: string;
};

const statusText: Record<AccordionStatus, string> = {
  done: 'concluído',
  error: 'com pendência',
  warning: 'com aviso',
};

function StatusMark({ status }: { status: AccordionStatus }) {
  return (
    <span className={s.accMark} data-status={status} aria-hidden="true">
      {status === 'done' ? <Check /> : <b>!</b>}
    </span>
  );
}

function moveFocus(event: KeyboardEvent<HTMLElement>, root: HTMLElement | null) {
  const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
  if (!root || !keys.includes(event.key)) return;
  const triggers = Array.from(
    root.querySelectorAll<HTMLButtonElement>('[data-acc-trigger]:not(:disabled)'),
  );
  const index = triggers.indexOf(event.currentTarget as HTMLButtonElement);
  if (index < 0 || triggers.length === 0) return;
  event.preventDefault();
  const last = triggers.length - 1;
  const next =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? last
        : event.key === 'ArrowDown'
          ? (index + 1) % triggers.length
          : (index - 1 + triggers.length) % triggers.length;
  triggers[next]?.focus();
}

function AccordionRow({
  item,
  open,
  onToggle,
  headingLevel,
  onKeyDown,
  marked = false,
}: {
  item: AccordionItem;
  open: boolean;
  onToggle: () => void;
  headingLevel: 'h2' | 'h3' | 'h4';
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
  /** Outra linha tem marcador: esta, sem estado, guarda o lugar dele (os títulos alinham). */
  marked?: boolean;
}) {
  const base = useId();
  const triggerId = `${base}-trigger`;
  const panelId = `${base}-panel`;
  const Heading = headingLevel;
  return (
    <div
      className={s.accItem}
      data-open={open || undefined}
      data-disabled={item.disabled || undefined}
    >
      <Heading className={s.accHeading}>
        <button
          type="button"
          id={triggerId}
          className={s.accTrigger}
          aria-expanded={open}
          aria-controls={panelId}
          disabled={item.disabled}
          onClick={onToggle}
          onKeyDown={onKeyDown}
          data-acc-trigger=""
          data-status={item.status}
          data-force={item.force}
        >
          {item.status ? (
            <StatusMark status={item.status} />
          ) : marked ? (
            <span className={s.accMark} data-status="none" aria-hidden="true" />
          ) : null}
          <span className={s.accTitle}>
            {item.title}
            {item.status && <VisuallyHidden>{` (${statusText[item.status]})`}</VisuallyHidden>}
          </span>
          {item.meta !== undefined && <span className={s.accMeta}>{item.meta}</span>}
          <ChevronDown className={s.accChevron} aria-hidden="true" />
        </button>
      </Heading>
      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        className={s.accPanel}
        inert={!open}
      >
        <div className={s.accClip}>
          <div className={s.accBody}>{item.content}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Seções recolhíveis. `single` mantém uma aberta por vez (pode fechar a aberta); `multiple`
 * abre várias. Cabeçalho de 44, chevron gira 180°, altura anima por `grid-template-rows`.
 * Setas ↑/↓, Home e End percorrem os cabeçalhos. Sem ícones +/−, sem faixa cheia, sem aninhar.
 */
export function Accordion({
  items,
  type = 'single',
  variant = 'plain',
  defaultValue = [],
  value,
  onValueChange,
  headingLevel = 'h3',
  className = '',
}: {
  items: AccordionItem[];
  type?: 'single' | 'multiple';
  variant?: 'plain' | 'panel';
  defaultValue?: string[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
  headingLevel?: 'h2' | 'h3' | 'h4';
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [inner, setInner] = useState<string[]>(defaultValue);
  const current = value ?? inner;
  function toggle(id: string) {
    const isOpen = current.includes(id);
    const next = isOpen
      ? current.filter((entry) => entry !== id)
      : type === 'single'
        ? [id]
        : [...current, id];
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  }
  // Uma linha com marcador faz as outras guardarem o lugar dele: os títulos ficam na mesma borda.
  const marked = items.some((item) => item.status);
  return (
    <div ref={rootRef} className={`${s.accordion} ${className}`} data-variant={variant}>
      {items.map((item) => (
        <AccordionRow
          key={item.id}
          item={item}
          open={current.includes(item.id)}
          onToggle={() => toggle(item.id)}
          headingLevel={headingLevel}
          onKeyDown={(event) => moveFocus(event, rootRef.current)}
          marked={marked}
        />
      ))}
    </div>
  );
}

/**
 * Uma área recolhível só (resumo da criação no celular, detalhes de um bloco).
 * `summary` é a linha de 44 px; o conteúdo abre com a mesma animação do acordeão.
 */
export function Disclosure({
  summary,
  meta,
  children,
  defaultOpen = false,
  open: controlled,
  onOpenChange,
  variant = 'plain',
  headingLevel = 'h3',
  force,
  className = '',
}: {
  summary: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** `bar`: faixa de largura total com fio embaixo (topo de moldura no celular). */
  variant?: 'plain' | 'panel' | 'bar';
  /** Nível do título do resumo (o tamanho não muda). Padrão h3. */
  headingLevel?: 'h2' | 'h3' | 'h4';
  force?: string;
  className?: string;
}) {
  const [inner, setInner] = useState(defaultOpen);
  const open = controlled ?? inner;
  return (
    <div className={`${s.accordion} ${className}`} data-variant={variant}>
      <AccordionRow
        item={{ id: 'disclosure', title: summary, meta, content: children, force }}
        open={open}
        headingLevel={headingLevel}
        onToggle={() => {
          if (controlled === undefined) setInner(!open);
          onOpenChange?.(!open);
        }}
      />
    </div>
  );
}

/**
 * Texto longo cortado em `lines` linhas com “Ver tudo” / “Ver menos”. A altura anima nos dois
 * sentidos; o botão só aparece se o texto de fato passa do limite.
 */
export function ExpandableText({
  children,
  lines = 3,
  moreLabel = 'Ver tudo',
  lessLabel = 'Ver menos',
  className = '',
}: {
  children: ReactNode;
  lines?: number;
  moreLabel?: string;
  lessLabel?: string;
  className?: string;
}) {
  const textRef = useRef<HTMLDivElement>(null);
  const textId = useId();
  /* closed → opening → open → closing → closed */
  const [phase, setPhase] = useState<'closed' | 'open' | 'closing'>('closed');
  const [overflows, setOverflows] = useState(false);
  const [heights, setHeights] = useState<{ clamp: number; full: number } | null>(null);

  const measure = useCallback(() => {
    const el = textRef.current;
    if (!el) return;
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20;
    const clamp = Math.round(lineHeight * lines);
    const full = el.scrollHeight;
    setHeights({ clamp, full });
    setOverflows(full > clamp + 1);
  }, [lines]);

  useIsoLayoutEffect(() => {
    measure();
    const el = textRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  const expanded = phase === 'open';
  const clamped = phase === 'closed';
  const maxHeight = heights ? (phase === 'open' ? heights.full : heights.clamp) : undefined;
  return (
    <div className={`${s.expandable} ${className}`}>
      <div
        ref={textRef}
        id={textId}
        className={s.expandableText}
        data-clamped={(clamped && overflows) || undefined}
        style={{ '--lines': lines, maxHeight: overflows ? maxHeight : undefined } as CSSProperties}
        onTransitionEnd={(event) => {
          if (event.propertyName === 'max-height' && phase === 'closing') setPhase('closed');
        }}
      >
        {children}
      </div>
      {overflows && (
        <button
          type="button"
          className={s.textAction}
          aria-expanded={expanded}
          aria-controls={textId}
          onClick={() => {
            if (phase === 'open') {
              const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
              setPhase(reduce ? 'closed' : 'closing');
            } else {
              if (textRef.current)
                setHeights((h) =>
                  h ? { ...h, full: textRef.current?.scrollHeight ?? h.full } : h,
                );
              setPhase('open');
            }
          }}
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      )}
    </div>
  );
}

/* ——————————————————————————— ScrollArea ——————————————————————————— */

/**
 * Rolagem nativa com barra fina. Quando há excesso, vira região focável (Tab + setas) com anel
 * por dentro e esmaece 16 px só no lado que ainda tem conteúdo (`data-at-start`/`data-at-end`).
 * Máscara é a única exceção funcional ao “sem degradê”.
 */
export function ScrollArea({
  children,
  label,
  orientation = 'vertical',
  maxHeight,
  height,
  fade = true,
  className = '',
  viewportClassName = '',
  style,
  viewportRef,
  onScroll,
  force,
}: {
  children: ReactNode;
  /** Nome da região (obrigatório: a área recebe foco quando rola). */
  label: string;
  orientation?: 'vertical' | 'horizontal';
  maxHeight?: number | string;
  height?: number | string;
  /** Lados que esmaecem. `end` para tabela com primeira coluna fixa (o início nunca some). */
  fade?: boolean | 'start' | 'end';
  className?: string;
  viewportClassName?: string;
  style?: CSSProperties;
  viewportRef?: Ref<HTMLDivElement>;
  onScroll?: (event: UIEvent<HTMLDivElement>) => void;
  /** Só pranchas: `focus` desenha o anel parado. */
  force?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const vertical = orientation === 'vertical';
    const pos = vertical ? el.scrollTop : Math.abs(el.scrollLeft);
    const size = vertical ? el.clientHeight : el.clientWidth;
    const total = vertical ? el.scrollHeight : el.scrollWidth;
    const overflow = total > size + 1;
    const start = pos <= 1;
    const end = pos + size >= total - 1;
    const root = el.parentElement;
    if (!root) return;
    root.dataset.overflow = String(overflow);
    root.dataset.atStart = String(start);
    root.dataset.atEnd = String(end);
    if (overflow) el.tabIndex = 0;
    else el.removeAttribute('tabindex');
  }, [orientation]);

  useIsoLayoutEffect(() => {
    update();
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => update());
    observer.observe(el);
    Array.from(el.children).forEach((child) => observer.observe(child));
    const mutations = new MutationObserver(() => {
      Array.from(el.children).forEach((child) => observer.observe(child));
      update();
    });
    mutations.observe(el, { childList: true });
    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, [update]);

  return (
    <div
      className={`${s.scrollRoot} ${className}`}
      data-orientation={orientation}
      data-fade-start={fade === true || fade === 'start' || undefined}
      data-fade-end={fade === true || fade === 'end' || undefined}
      style={style}
    >
      <div
        ref={(node) => {
          ref.current = node;
          assignRef(viewportRef, node);
        }}
        className={`${s.viewport} ${viewportClassName}`}
        role="region"
        aria-label={label}
        style={{ maxHeight, height }}
        data-force={force}
        onScroll={(event) => {
          update();
          onScroll?.(event);
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ——————————————————————————— Alça de painel (interna) ——————————————————————————— */
/*
 * Peças compartilhadas por `ResizablePanels` e `WorkspaceLayout` (workspace-layout.tsx). Ficam fora
 * do barril: o produto usa os dois componentes, não a alça solta.
 */

/** Largura e recolhimento de um painel, como ficam guardados neste navegador. */
export type PaneMemory = { size: number; collapsed: boolean };

/** Interno. Lê a preferência guardada de um painel; `null` sem chave, sem registro ou sem acesso. */
export function readPaneMemory(key: string | undefined) {
  if (!key) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { size?: unknown; collapsed?: unknown };
    return {
      size: typeof parsed.size === 'number' ? parsed.size : undefined,
      collapsed: parsed.collapsed === true,
    };
  } catch {
    return null;
  }
}

/** Interno. Guarda a preferência de um painel (armazenamento indisponível: segue sem lembrar). */
export function writePaneMemory(key: string | undefined, value: PaneMemory) {
  if (!key) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* armazenamento indisponível: segue sem lembrar */
  }
}

/** Interno. Largura de um elemento, observada (`undefined` antes da primeira medida). */
export const useElementWidth = useWidth;

/** Interno. */
export const clampTo = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Abaixo de `min − 24` px o arrasto recolhe o painel (quando recolhível). */
const COLLAPSE_SLACK = 24;

export type PaneSeparatorProps = {
  /**
   * Onde está o painel que a alça mede: `start` vem antes dela (cresce para a direita) e `end`
   * vem depois (cresce para a esquerda). As setas seguem o arrasto.
   */
  side?: 'start' | 'end';
  /** Largura aberta lembrada, em px (continua valendo enquanto o painel está recolhido). */
  size: number;
  collapsed: boolean;
  min: number;
  /** Teto já descontado do espaço dos vizinhos. */
  max: number;
  /** Duplo clique volta a esta largura. */
  defaultSize: number;
  collapsible: boolean;
  /** Nome da alça (“Redimensionar Fonte”). */
  label: string;
  /** `id` do painel controlado. */
  controls: string;
  /** Durante o arrasto: desenha sem guardar. */
  onPreview: (size: number, collapsed: boolean) => void;
  /** Fim do arrasto, seta, Home/End, duplo clique ou Escape (desfaz o arrasto). */
  onCommit: (size: number, collapsed: boolean) => void;
  /** Enter, ou a seta de encolher já no mínimo: recolhe ou mostra o painel. */
  onToggle: (collapsed: boolean) => void;
  onDraggingChange?: (dragging: boolean) => void;
  /** Só pranchas: `hover`, `active` (= arrastando) ou `focus`. */
  force?: string;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

/**
 * Interno. Divisória arrastável (fio de 1px, alvo invisível de 12px) com o teclado do separador
 * ARIA: ←/→ 16px (Shift ×4), Home/End, Enter recolhe/mostra, Escape desfaz o arrasto e duplo
 * clique volta ao padrão. `aria-valuenow` é a largura do painel em px (0 recolhido).
 */
export function PaneSeparator({
  side = 'start',
  size,
  collapsed,
  min,
  max,
  defaultSize,
  collapsible,
  label,
  controls,
  onPreview,
  onCommit,
  onToggle,
  onDraggingChange,
  force,
  className = '',
  ref,
}: PaneSeparatorProps) {
  const ceiling = Math.max(min, max);
  const open = collapsed ? 0 : clampTo(size, min, ceiling);
  const direction = side === 'start' ? 1 : -1;
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; from: PaneMemory; last: PaneMemory } | null>(null);

  function setDrag(next: boolean) {
    setDragging(next);
    onDraggingChange?.(next);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const from = { size, collapsed };
    drag.current = { x: event.clientX, from, last: from };
    setDrag(true);
  }
  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current) return;
    const startWidth = current.from.collapsed ? 0 : clampTo(current.from.size, min, ceiling);
    const raw = startWidth + (event.clientX - current.x) * direction;
    // Recolhido pelo arrasto, o painel lembra a largura de antes: reabre como estava.
    const next =
      collapsible && raw < min - COLLAPSE_SLACK
        ? { size: current.from.size, collapsed: true }
        : { size: clampTo(raw, min, ceiling), collapsed: false };
    if (next.size === current.last.size && next.collapsed === current.last.collapsed) return;
    current.last = next;
    onPreview(next.size, next.collapsed);
  }
  function endDrag() {
    const current = drag.current;
    if (!current) return;
    drag.current = null;
    setDrag(false);
    onCommit(current.last.size, current.last.collapsed);
  }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && drag.current) {
      event.preventDefault();
      const { from } = drag.current;
      drag.current = null;
      setDrag(false);
      onCommit(from.size, from.collapsed);
      return;
    }
    const grow = side === 'start' ? 'ArrowRight' : 'ArrowLeft';
    const shrink = side === 'start' ? 'ArrowLeft' : 'ArrowRight';
    const step = event.shiftKey ? 64 : 16;
    let next: number | null = null;
    if (event.key === shrink) {
      if (collapsed) return;
      if (collapsible && open <= min) {
        event.preventDefault();
        onToggle(true);
        return;
      }
      next = open - step;
    } else if (event.key === grow) next = collapsed ? min : open + step;
    else if (event.key === 'Home') next = min;
    else if (event.key === 'End') next = ceiling;
    else if (event.key === 'Enter' && collapsible) {
      event.preventDefault();
      onToggle(!collapsed);
      return;
    }
    if (next === null) return;
    event.preventDefault();
    onCommit(clampTo(next, min, ceiling), false);
  }

  return (
    <div
      ref={ref}
      className={`${s.splitHandle} ${className}`}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-controls={controls}
      aria-valuenow={Math.round(open)}
      aria-valuemin={collapsible ? 0 : min}
      aria-valuemax={Math.round(ceiling)}
      aria-valuetext={collapsed ? 'Recolhido' : `${Math.round(open)} px`}
      tabIndex={0}
      data-side={side}
      data-dragging={dragging || undefined}
      data-force={force}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      onDoubleClick={() => onCommit(clampTo(defaultSize, min, ceiling), false)}
      onKeyDown={onKeyDown}
    />
  );
}

/* ——————————————————————————— ResizablePanels ——————————————————————————— */

/**
 * Dois painéis lado a lado com divisória arrastável (fio de 1px, alvo invisível de 12px).
 * Teclado: ←/→ 16px (Shift ×4), Home/End, Enter recolhe/mostra. Duplo clique volta ao tamanho
 * padrão. Arrastar abaixo de `min − 24` recolhe (se `collapsible`). Em ≤760 px empilha, sem alça.
 */
export function ResizablePanels({
  left,
  right,
  defaultSize = 320,
  min = 240,
  max = 560,
  collapsible = true,
  storageKey,
  label = 'Redimensionar painéis',
  showLabel = 'Mostrar lista',
  stackBelow = 760,
  onSizeChange,
  height,
  force,
  defaultCollapsed = false,
  stackedHeight,
  className = '',
}: {
  left: ReactNode;
  right: ReactNode;
  /** Largura inicial do painel esquerdo, em px. */
  defaultSize?: number;
  min?: number;
  max?: number;
  collapsible?: boolean;
  /** Lembra largura e recolhimento neste navegador. */
  storageKey?: string;
  label?: string;
  showLabel?: string;
  stackBelow?: number;
  onSizeChange?: (size: number, collapsed: boolean) => void;
  height?: number | string;
  /** Só pranchas: estado parado na alça (`hover`, `active` = arrastando, `focus`). */
  force?: string;
  defaultCollapsed?: boolean;
  /** Empilhado (≤ `stackBelow`): altura do painel de cima (a lista rola por dentro). Padrão: natural. */
  stackedHeight?: number | string;
  className?: string;
}) {
  const [rootRef, width] = useWidth<HTMLDivElement>();
  const leftId = useId();
  const [size, setSize] = useState(defaultSize);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [dragging, setDragging] = useState(false);
  const handleRef = useRef<HTMLDivElement>(null);
  const showRef = useRef<HTMLButtonElement>(null);

  /* O painel direito nunca fica abaixo de 280 px. */
  const ceiling = width ? Math.max(min, Math.min(max, width - 281)) : max;
  const stacked = width !== undefined && width <= stackBelow;

  useEffect(() => {
    const stored = readPaneMemory(storageKey);
    if (!stored) return;
    // Restaura a preferência salva depois da hidratação (o servidor não conhece o navegador).
    if (stored.size !== undefined) setSize(stored.size);
    setCollapsed(stored.collapsed);
  }, [storageKey]);

  function commit(nextSize: number, nextCollapsed: boolean) {
    setSize(nextSize);
    setCollapsed(nextCollapsed);
    writePaneMemory(storageKey, { size: nextSize, collapsed: nextCollapsed });
    onSizeChange?.(nextSize, nextCollapsed);
  }

  function setCollapse(next: boolean) {
    commit(size, next);
    // O foco segue a ação: recolhido → botão “Mostrar lista”; aberto → alça.
    window.requestAnimationFrame(() => (next ? showRef.current : handleRef.current)?.focus());
  }

  const leftWidth = collapsed ? 0 : clampTo(size, min, ceiling);
  return (
    <div
      ref={rootRef}
      className={`${s.split} ${className}`}
      data-stacked={stacked || undefined}
      data-dragging={dragging || undefined}
      data-collapsed={(collapsed && !stacked) || undefined}
      style={
        { '--split-left': `${leftWidth}px`, height: stacked ? undefined : height } as CSSProperties
      }
    >
      <div
        id={leftId}
        className={s.splitLeft}
        inert={collapsed && !stacked}
        style={stacked && stackedHeight !== undefined ? { height: stackedHeight } : undefined}
      >
        {left}
      </div>
      {!stacked && (
        <PaneSeparator
          ref={handleRef}
          size={size}
          collapsed={collapsed}
          min={min}
          max={ceiling}
          defaultSize={defaultSize}
          collapsible={collapsible}
          label={label}
          controls={leftId}
          force={force}
          onPreview={(nextSize, nextCollapsed) => {
            setSize(nextSize);
            setCollapsed(nextCollapsed);
          }}
          onCommit={commit}
          onToggle={setCollapse}
          onDraggingChange={setDragging}
        />
      )}
      <div className={s.splitRight}>
        {collapsed && !stacked && (
          <Tooltip content={showLabel} bare describe={false}>
            <button
              ref={showRef}
              type="button"
              className={s.splitShow}
              aria-label={showLabel}
              aria-controls={leftId}
              aria-expanded={false}
              onClick={() => setCollapse(false)}
            >
              <PanelLeftOpen aria-hidden="true" />
            </button>
          </Tooltip>
        )}
        {right}
      </div>
    </div>
  );
}

/* ——————————————————————————— DescriptionList ——————————————————————————— */

export type DescriptionItem = {
  label: string;
  value?: ReactNode;
  /** Marca ou ponto antes do valor (BrandMark xs soft, ponto de status). */
  leading?: ReactNode;
  hint?: ReactNode;
  /** Texto copiado pelo botão que aparece no hover/foco da linha. */
  copy?: string;
  /** `empty` → “Não informado” em --muted; `missing` → “Falta” em --red-ink (editável). */
  state?: 'empty' | 'missing';
  /** Dinheiro, data, contagem ou código: números tabulares. Texto comum fica proporcional. */
  numeric?: boolean;
  /** Atributos `data-*` da linha (`{ testid: 'x' }` → `data-testid="x"`). */
  data?: Record<string, string>;
};

/**
 * Copiar um texto: ícone 14 numa caixa de 24 (32 no toque), check por 1,2 s e aviso para leitor de
 * tela. `reveal="hover"` só aparece no hover ou foco da linha (como na `DescriptionList`); o padrão
 * fica sempre à vista. Sem permissão de área de transferência, nada muda (o retorno não mente).
 */
export function CopyButton({
  text,
  label,
  reveal = 'always',
  onCopy,
  className = '',
  'data-force': force,
}: {
  text: string;
  /** O que é copiado (“link da produção”): vira “Copiar link da produção” e “… copiado”. */
  label: string;
  reveal?: 'always' | 'hover';
  /** Depois de copiar com sucesso. */
  onCopy?: () => void;
  className?: string;
  /** Prancha: `hover`, `active`, `focus`. */
  'data-force'?: string;
}) {
  const [done, setDone] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <>
      <Tooltip content={done ? 'Copiado' : 'Copiar'} bare describe={false}>
        <button
          type="button"
          className={`${s.copy} ${className}`}
          aria-label={done ? `${label} copiado` : `Copiar ${label}`}
          data-done={done || undefined}
          data-reveal={reveal}
          data-force={force}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
            } catch {
              /* sem permissão de área de transferência: o retorno visual não mente */
              return;
            }
            onCopy?.();
            setDone(true);
            window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => setDone(false), 1200);
          }}
        >
          <Copy className={s.copyIcon} aria-hidden="true" />
          <Check className={s.copyDone} aria-hidden="true" />
        </button>
      </Tooltip>
      <VisuallyHidden role="status">{done ? `${label} copiado` : ''}</VisuallyHidden>
    </>
  );
}

const boneWidths = [
  ['38%', '62%'],
  ['30%', '48%'],
  ['44%', '70%'],
  ['26%', '40%'],
  ['36%', '56%'],
  ['32%', '66%'],
];

/**
 * Pares rótulo → valor. `rows`: coluna de rótulos (12 --muted) e valor 13 --ink, fio suave entre
 * linhas (≈37 px; no celular o rótulo sobe). `grid`: rótulo acima do valor em 2–3 colunas.
 * `strip`: faixa compacta com divisórias e reticências. Sem ícone por rótulo, sem dois-pontos.
 */
export function DescriptionList({
  items,
  layout = 'rows',
  columns,
  labelWidth = 196,
  emptyText = 'Não informado',
  missingText = 'Falta',
  loading = false,
  loadingRows = 4,
  className = '',
  label,
}: {
  items: DescriptionItem[];
  layout?: 'rows' | 'grid' | 'strip';
  /** Colunas de `grid` (2–3) e `strip` (padrão: número de itens). */
  columns?: number;
  /** Onde começa a coluna de valores em `rows` (rótulo + 16 de respiro). */
  labelWidth?: number;
  emptyText?: string;
  missingText?: string;
  loading?: boolean;
  loadingRows?: number;
  className?: string;
  label?: string;
}) {
  const cols = columns ?? (layout === 'strip' ? Math.max(1, items.length) : 2);
  const style = { '--dl-label': `${labelWidth}px`, '--dl-cols': cols } as CSSProperties;
  if (loading) {
    return (
      <div className={`${s.dlBox} ${className}`}>
        <div
          className={s.dl}
          data-layout={layout}
          data-cols={cols}
          style={style}
          aria-busy="true"
          aria-label={label}
          role="group"
        >
          {Array.from({ length: loadingRows }, (_, index) => {
            const [a, b] = boneWidths[index % boneWidths.length] ?? ['36%', '56%'];
            return (
              <div key={index} className={s.dlItem} aria-hidden="true">
                <span className={s.dlBoneCell}>
                  <i
                    className={s.bone}
                    style={{ width: layout === 'rows' ? `min(${a}, 120px)` : a }}
                  />
                </span>
                <span className={s.dlBoneCell}>
                  <i className={s.bone} style={{ width: b }} />
                </span>
              </div>
            );
          })}
          <VisuallyHidden>Carregando</VisuallyHidden>
        </div>
      </div>
    );
  }
  return (
    <div className={`${s.dlBox} ${className}`}>
      <dl className={s.dl} data-layout={layout} data-cols={cols} style={style} aria-label={label}>
        {items.map((item) => {
          const state =
            item.state ??
            (item.value === undefined || item.value === null || item.value === ''
              ? 'empty'
              : undefined);
          const text =
            state === 'empty' ? emptyText : state === 'missing' ? missingText : item.value;
          const titleText =
            layout === 'strip' && typeof item.value === 'string' && !state ? item.value : undefined;
          return (
            <div
              key={item.label}
              {...Object.fromEntries(
                Object.entries(item.data ?? {}).map(([key, value]) => [`data-${key}`, value]),
              )}
              className={s.dlItem}
              data-copy={item.copy ? true : undefined}
            >
              <dt>{item.label}</dt>
              <dd data-state={state} data-num={item.numeric && !state ? '' : undefined}>
                <span className={s.dlValue}>
                  {item.leading && !state && <span className={s.dlLead}>{item.leading}</span>}
                  {titleText !== undefined ? (
                    // Faixa: o valor corta numa linha; o inteiro vai na dica do DS, só quando cortou.
                    <TruncatedText className={s.dlText} text={titleText} />
                  ) : (
                    <span className={s.dlText}>{text}</span>
                  )}
                  {item.copy && !state && (
                    <CopyButton text={item.copy} label={item.label} reveal="hover" />
                  )}
                </span>
                {item.hint && <span className={s.dlHint}>{item.hint}</span>}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

/* ——————————————————————————— FixedFrame ——————————————————————————— */

/**
 * Moldura fixa da criação: cabeçalho, corpo que rola (miolo + lateral de 320 com rolagem
 * própria e esmaecimento) e rodapé de ações de 64. `overflow: clip`: a moldura nunca desliza.
 * Abaixo de `stackBelow`, a lateral vira um `Disclosure` de uma linha no topo do corpo, com o
 * resumo em h2 (vem logo depois do h1 do cabeçalho).
 */
export function FixedFrame({
  header,
  children,
  aside,
  asideLabel = 'Resumo',
  asideSummary,
  asideDefaultOpen = false,
  footer,
  height = '100%',
  docked = false,
  stackBelow = 760,
  mainLabel = 'Conteúdo da etapa',
  className = '',
}: {
  /** Conteúdo fixo ou função que recebe `narrow` (troca régua e botões no celular). */
  header: ReactNode | ((narrow: boolean) => ReactNode);
  children: ReactNode;
  aside?: ReactNode;
  asideLabel?: string;
  /** Linha do resumo recolhido (ex.: “Resumo · R$ 18.000,00 · 27 dias”). */
  asideSummary?: ReactNode;
  /** Resumo recolhido começa aberto (só no modo estreito). */
  asideDefaultOpen?: boolean;
  /** Rodapé de ações; como função, recebe `narrow` (≤640: [←] [Salvar rascunho] [Principal]). */
  footer?: ReactNode | ((narrow: boolean) => ReactNode);
  height?: number | string;
  /**
   * Página de criação no shell: a moldura ocupa a altura útil e encosta no fundo da janela — o
   * rodapé de ações fica colado embaixo, sem o respiro da área de conteúdo. Ignora `height`.
   */
  docked?: boolean;
  stackBelow?: number;
  mainLabel?: string;
  className?: string;
}) {
  const [rootRef, width] = useWidth<HTMLDivElement>();
  const narrow = width !== undefined && width <= stackBelow;
  return (
    <div
      ref={rootRef}
      className={`${s.frame} ${className}`}
      data-narrow={narrow || undefined}
      data-aside={aside ? true : undefined}
      data-docked={docked || undefined}
      style={docked ? undefined : { height }}
    >
      <div className={s.frameHead}>{typeof header === 'function' ? header(narrow) : header}</div>
      <div className={s.frameBody}>
        <ScrollArea
          label={mainLabel}
          className={s.frameMain}
          viewportClassName={s.frameMainViewport}
          fade={false}
        >
          {narrow && aside && (
            // Logo abaixo do h1 do cabeçalho: o resumo é um h2 (nenhum nível pulado no celular).
            <Disclosure
              summary={asideSummary ?? asideLabel}
              variant="bar"
              headingLevel="h2"
              defaultOpen={asideDefaultOpen}
            >
              <div className={s.frameAsideInline}>{aside}</div>
            </Disclosure>
          )}
          <div className={s.frameContent}>{children}</div>
        </ScrollArea>
        {!narrow && aside && (
          <ScrollArea
            label={asideLabel}
            className={s.frameAside}
            viewportClassName={s.frameAsideViewport}
          >
            {aside}
          </ScrollArea>
        )}
      </div>
      {footer && (
        <div className={s.frameFoot}>{typeof footer === 'function' ? footer(narrow) : footer}</div>
      )}
    </div>
  );
}
