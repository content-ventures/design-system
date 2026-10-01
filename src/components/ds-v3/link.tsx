'use client';

import { ArrowUpRight } from 'lucide-react';
import type { ComponentProps, MouseEvent } from 'react';
import { VisuallyHidden } from './a11y';
import s from './link.module.css';

export type LinkTone = 'accent' | 'quiet' | 'text' | 'inherit';
export type LinkSize = 'inherit' | 'sm';

type LinkLook = {
  /**
   * `accent` azul de ação · `quiet` cinza de meta (--muted) · `text` cor de corpo (--text), ex.: o
   * anunciante numa linha de meta · `inherit` a cor ao redor. Os três últimos acendem em b-600.
   */
  tone?: LinkTone;
  /** `inherit` acompanha a frase; `sm` é a ação em texto (12/500). */
  size?: LinkSize;
  /** Estado parado para pranchas (`hover`, `active`, `focus`). Nunca no produto. */
  'data-force'?: string;
};

/**
 * Navegação em texto: leva a outro lugar (detalhe, portal). Visitado não muda de cor.
 * `external` abre em outra aba e mostra a seta ↗ logo depois do texto.
 */
export function TextLink({
  tone = 'accent',
  size = 'inherit',
  external = false,
  disabled = false,
  className = '',
  children,
  onClick,
  ...props
}: ComponentProps<'a'> &
  LinkLook & {
    href: string;
    external?: boolean;
    /** Sem destino agora: perde a cor e o sublinhado, sai da ordem de foco. */
    disabled?: boolean;
  }) {
  return (
    <a
      {...props}
      href={disabled ? undefined : props.href}
      className={`${s.link} ${className}`}
      data-tone={tone}
      data-size={size}
      aria-disabled={disabled || undefined}
      target={external ? '_blank' : props.target}
      rel={external ? 'noopener noreferrer' : props.rel}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        if (disabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    >
      {children}
      {external && (
        <>
          <ArrowUpRight className={s.external} aria-hidden="true" />
          <VisuallyHidden> (abre em nova aba)</VisuallyHidden>
        </>
      )}
    </a>
  );
}

/**
 * Ação em texto dentro do conteúdo (“Editar”, “Preencher”, “Usar inteira”): faz algo aqui,
 * com a mesma aparência do link. Sem ícone, sem caixa.
 */
export function LinkButton({
  tone = 'accent',
  size = 'sm',
  type = 'button',
  className = '',
  ...props
}: ComponentProps<'button'> & LinkLook) {
  return (
    <button {...props} type={type} className={`${s.link} ${className}`} data-tone={tone} data-size={size} />
  );
}
