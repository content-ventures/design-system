'use client';

import type { ComponentProps } from 'react';
import s from './seal.module.css';

export type SealSize = 'sm' | 'md' | 'lg';

export type SealProps = Omit<ComponentProps<'span'>, 'children'> & {
  /**
   * Nome para leitor de tela (“Aprovado”, “Versão 4 aprovada”). Passe `""` quando o texto ao lado
   * já diz o mesmo: o selo vira decoração e não é lido duas vezes.
   */
  label: string;
  /** `sm` 16 (linha de lista, entrega) · `md` 20 (cabeçalho, histórico) · `lg` 40 (confirmação). */
  size?: SealSize;
  /**
   * Parado: sem animação de entrada. Use em tudo que já estava aprovado quando a tela abriu; a
   * entrada fica só para o momento da aprovação.
   */
  still?: boolean;
};

/**
 * Selo de aprovação (Revisão). Disco teal — o tom de “aprovado” (§2.4) — com check desenhado.
 * `sm`/`md` são sólidos (`--teal-dot` + `--on-accent`) para ler em 16–20 px; `lg` é suave
 * (`--teal-bg` com fio `--teal-line` + check `--teal-ink`), como a marca de sucesso das confirmações.
 *
 * Ao montar, o disco assenta com `--ease-spring` (único uso do token fora das marcas de seleção) e o
 * check se desenha em seguida. `still` e `prefers-reduced-motion` mostram o selo pronto.
 */
export function Seal({ label, size = 'md', still = false, className = '', ...props }: SealProps) {
  const decorative = label.trim() === '';
  return (
    <span
      {...props}
      className={`${s.seal} ${className}`}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
      data-size={size}
      data-still={still || undefined}
    >
      <svg className={s.svg} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <circle className={s.disc} cx="10" cy="10" r="9.75" />
        <path className={s.check} d="M5.8 10.3 8.6 13.1 14.2 7.3" pathLength={1} />
      </svg>
    </span>
  );
}
