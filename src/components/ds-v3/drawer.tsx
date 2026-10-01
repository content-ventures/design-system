'use client';

import { X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { IconButton } from './button';
import { ContainedLayer, useModalLayer } from './overlays';
import { useIsoLayoutEffect } from './popover';
import s from './drawer.module.css';

export type DrawerSize = 'sm' | 'md' | 'lg';

type DrawerLayoutProps = {
  /** Título da gaveta. Vira o nome acessível da camada. */
  title: ReactNode;
  /** Linha(s) abaixo do título: contexto, metadados. */
  description?: ReactNode;
  /** Marca, ícone ou avatar à esquerda do título. */
  leading?: ReactNode;
  /**
   * Ação contextual no topo, à esquerda (ex.: “Marcar como ganho”). Quando presente, a gaveta
   * ganha a barra de ações e o título passa a rolar com o corpo — como um documento. Quando o
   * título sai de vista, a barra mostra o nome em linha, para ninguém perder o contexto.
   */
  toolbar?: ReactNode;
  /** Botões só-ícone antes do fechar (expandir, favoritar, mais). */
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Texto de apoio à esquerda do rodapé (contagem, estado de salvamento). */
  footerStart?: ReactNode;
  /** Margem interna do corpo. `none` para conteúdo que vai de borda a borda. */
  padding?: 'md' | 'none';
  closeLabel?: string;
};

function DrawerLayout({
  title,
  description,
  leading,
  toolbar,
  actions,
  children,
  footer,
  footerStart,
  padding = 'md',
  closeLabel = 'Fechar painel',
  titleId,
  descId,
  onClose,
  initialScroll,
}: DrawerLayoutProps & {
  titleId: string;
  descId: string;
  onClose?: () => void;
  initialScroll?: number;
}) {
  const hasToolbar = toolbar !== undefined;
  const bodyRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  // Com barra de ações, o título rola com o corpo; quando some, a barra mostra o nome em linha.
  const [condensed, setCondensed] = useState(false);
  // O fio sob o topo só aparece quando há conteúdo rolado por baixo dele.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const body = bodyRef.current;
    const title = introRef.current?.querySelector('h2');
    if (!hasToolbar || !body || !title || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // gaveta fechada (sem caixa) não conta como rolada
        if (entry && entry.rootBounds && entry.rootBounds.height > 0) setCondensed(!entry.isIntersecting);
      },
      { root: body, threshold: 0 },
    );
    observer.observe(title);
    return () => observer.disconnect();
  }, [hasToolbar]);
  useIsoLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body || !initialScroll) return;
    body.scrollTop = initialScroll;
    setScrolled(body.scrollTop > 0);
  }, [initialScroll]);

  const heading = (
    <div className={s.heading} data-size={hasToolbar ? 'lg' : 'md'}>
      {leading && <div className={s.leading}>{leading}</div>}
      <div className={s.titles}>
        <h2 id={titleId} className={s.title}>
          {title}
        </h2>
        {description && (
          <div id={descId} className={s.description}>
            {description}
          </div>
        )}
      </div>
    </div>
  );
  const end = (
    <div className={s.actions}>
      {actions}
      <IconButton label={closeLabel} icon={X} variant="ghost" size="sm" onClick={onClose} />
    </div>
  );
  return (
    <>
      {hasToolbar ? (
        <div className={s.toolbar} data-condensed={condensed || undefined} data-scrolled={scrolled || undefined}>
          <div className={s.toolbarStart}>
            {toolbar}
            <span className={s.condensed} aria-hidden="true">
              <span className={s.condensedText}>{title}</span>
            </span>
          </div>
          {end}
        </div>
      ) : (
        <header className={s.head} data-scrolled={scrolled || undefined}>
          {heading}
          {end}
        </header>
      )}
      <div
        ref={bodyRef}
        className={s.body}
        data-padding={padding}
        onScroll={(event) => {
          const next = event.currentTarget.scrollTop > 0;
          if (next !== scrolled) setScrolled(next);
        }}
      >
        {hasToolbar && (
          <div ref={introRef} className={s.intro}>
            {heading}
          </div>
        )}
        {children}
      </div>
      {footer && (
        <footer className={s.foot}>
          {footerStart && <div className={s.footStart}>{footerStart}</div>}
          {footer}
        </footer>
      )}
    </>
  );
}

const widths: Record<DrawerSize, number> = { sm: 440, md: 520, lg: 600 };

const NUDGE: Keyframe[] = [
  { transform: 'translateX(0)' },
  { transform: 'translateX(-6px)' },
  { transform: 'translateX(0)' },
];

/** Foco inicial: `[data-autofocus]`, depois o primeiro campo do corpo; senão, a própria gaveta. */
function drawerFocus(root: HTMLElement) {
  return (
    root.querySelector<HTMLElement>('[data-autofocus]') ??
    root.querySelector<HTMLElement>(
      `.${CSS.escape(s.body ?? '')} :is(input:not(:disabled):not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea:not(:disabled), select:not(:disabled))`,
    )
  );
}

/**
 * Gaveta lateral: `<dialog>` ancorado à direita. Entra deslizando 24 px com esmaecimento (280 ms)
 * e sai em 200 ms; o véu esmaece em 180 ms. Foco preso, Escape fecha, o foco volta ao gatilho.
 * Para detalhe de um item e edições médias sem sair da lista. Fluxos longos são páginas.
 * Em ≤ 640 px ocupa a tela toda e entra pela direita.
 */
export function Drawer({
  open,
  onClose,
  size = 'md',
  dismissible = true,
  contained = false,
  ...layout
}: DrawerLayoutProps & {
  open: boolean;
  onClose: () => void;
  size?: DrawerSize;
  /** Clique no fundo fecha. Desligue quando houver dado digitado e não salvo. */
  dismissible?: boolean;
  /** Presa ao contêiner posicionado mais próximo, em vez da janela (pranchas, simuladores). */
  contained?: boolean;
}) {
  const layer = useModalLayer({
    open,
    onClose,
    dismissible,
    exitMs: 200,
    contained,
    initialFocus: drawerFocus,
    nudge: NUDGE,
  });
  const titleId = useId();
  const descId = useId();
  // Durante a saída o conteúdo é o último aberto.
  const frozen = useRef(layout);
  if (open) frozen.current = layout;
  const shown = open ? layout : frozen.current;

  const dialog = (
    <dialog
      {...layer.dialogProps}
      className={s.drawer}
      style={{ '--drawer-w': `${widths[size]}px` } as CSSProperties}
      data-size={size}
      aria-labelledby={titleId}
      aria-describedby={shown.description ? descId : undefined}
      tabIndex={-1}
    >
      {layer.mounted && (
        <div className={s.inner}>
          <DrawerLayout {...shown} titleId={titleId} descId={descId} onClose={onClose} />
        </div>
      )}
    </dialog>
  );
  if (!contained) return dialog;
  return (
    <ContainedLayer presence={layer.presence} scrimProps={layer.scrimProps} className={s.containedRoot}>
      {dialog}
    </ContainedLayer>
  );
}

/** A mesma gaveta, estática e sem camada — para pranchas e composições. */
export function DrawerFrame({
  size = 'md',
  width,
  height,
  onClose,
  className = '',
  style,
  scrollTop,
  fullscreen = false,
  ...layout
}: DrawerLayoutProps & {
  size?: DrawerSize;
  /** Largura exata em px, quando a prancha pede outra que não a do tamanho. */
  width?: number;
  /** Altura fixa: o corpo rola dentro dela, como na tela real. */
  height?: number | string;
  onClose?: () => void;
  className?: string;
  style?: CSSProperties;
  /** Prancha: corpo já rolado (mostra o fio do topo e o título na barra). */
  scrollTop?: number;
  /** Prancha: desenho do celular (≤ 640), tela inteira e sem raio. */
  fullscreen?: boolean;
}) {
  const titleId = useId();
  const descId = useId();
  return (
    <section
      className={`${s.drawer} ${s.frame} ${className}`}
      data-size={size}
      data-fullscreen={fullscreen || undefined}
      aria-labelledby={titleId}
      style={
        {
          '--drawer-w': `${width ?? widths[size]}px`,
          height,
          ...style,
        } as CSSProperties
      }
    >
      <div className={s.inner}>
        <DrawerLayout {...layout} titleId={titleId} descId={descId} onClose={onClose} initialScroll={scrollTop} />
      </div>
    </section>
  );
}
