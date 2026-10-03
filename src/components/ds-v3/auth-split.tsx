import type { CSSProperties, ReactNode } from 'react';

import s from './auth-split.module.css';

/**
 * Página de acesso dividida: à esquerda a marca e o formulário (centrado na altura, até 380 px);
 * à direita um painel da marca (`aside`, em geral um `AuthShowcase`). Moldura de 20 px de raio com
 * fio `--line` sobre `--canvas` — sem sombra (superfície parada). Responde à largura disponível
 * (container query): até 960 px o painel sai; até 560 px a coluna do formulário vira a página.
 * `footer` fica no pé da coluna (ajuda, termos).
 */
export function AuthSplit({
  brand,
  children,
  aside,
  footer,
  fill = 'viewport',
}: {
  brand: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
  footer?: ReactNode;
  /** `container`: ocupa a moldura em que está (catálogo), em vez da altura da janela. */
  fill?: 'viewport' | 'container';
}) {
  return (
    <main className={s.page} data-fill={fill}>
      <div className={s.pad}>
        <div className={s.frame} data-aside={aside ? '' : undefined}>
          <section className={s.main}>
            <div className={s.brand}>{brand}</div>
            <div className={s.body}>{children}</div>
            {footer ? <div className={s.footer}>{footer}</div> : <span aria-hidden="true" />}
          </section>
          {aside ? <aside className={s.aside}>{aside}</aside> : null}
        </div>
      </div>
    </main>
  );
}

/**
 * O painel da marca da página de acesso: uma chamada curta (sobretítulo e título com um trecho em
 * `--accent`) sobre um fundo de grade fina, e uma cena em camadas (`ShowcaseLayer`) que ilustra o
 * momento — entrar, convite, código, recuperação. A cena é decorativa: fica fora da árvore de
 * acessibilidade e não recebe foco nem clique (`inert`).
 */
export function AuthShowcase({
  eyebrow,
  title,
  highlight,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  /** Trecho final do título em cor de acento. */
  highlight?: ReactNode;
  /** A cena: camadas `ShowcaseLayer` posicionadas no painel. */
  children?: ReactNode;
}) {
  return (
    <div className={s.showcase}>
      <span className={s.backdrop} aria-hidden="true" />
      <div className={s.pitch}>
        {eyebrow ? <span className={s.eyebrow}>{eyebrow}</span> : null}
        <p className={s.headline}>
          {title}
          {highlight ? (
            <>
              {' '}
              <em>{highlight}</em>
            </>
          ) : null}
        </p>
      </div>
      {children ? (
        <div className={s.scene} aria-hidden="true" inert>
          {children}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Uma camada da cena do painel de acesso, posicionada em px ou % a partir das bordas da cena.
 * `float`: cartão elevado (papel, fio, `--shadow-lg`) — o que flutua sobre a janela de fundo.
 * `fade`: some no pé (a janela que sangra pela borda). Entra em cascata (`delay`, em ms); com
 * movimento reduzido, aparece parada.
 */
export function ShowcaseLayer({
  children,
  top,
  left,
  right,
  bottom,
  width,
  float = false,
  fade = false,
  delay = 0,
}: {
  children: ReactNode;
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  width?: number | string;
  float?: boolean;
  fade?: boolean;
  delay?: number;
}) {
  return (
    <div
      className={s.layer}
      data-float={float || undefined}
      data-fade={fade || undefined}
      style={{ top, left, right, bottom, width, '--delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
