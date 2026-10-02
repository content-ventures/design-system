'use client';

import { ChevronDown, LoaderCircle, type LucideIcon } from 'lucide-react';
import type { ComponentProps, ElementType, MouseEvent, ReactNode } from 'react';
import { Menu, type MenuSection } from './overlays';
import s from './button.module.css';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'contrast'
  | 'soft'
  | 'ghost'
  | 'danger'
  | 'danger-soft';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = ComponentProps<'button'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: 'rounded' | 'pill';
  icon?: LucideIcon;
  trailingIcon?: LucideIcon;
  /**
   * Espera após o clique. O rótulo fica sempre. Nos primeiros 300 ms nada muda (ação rápida não
   * pisca); depois o spinner troca de lugar com o ícone (inicial, ou final se só houver ele), na
   * mesma largura. Sem ícone, o spinner abre um espaço de ícone antes do rótulo.
   * O botão continua focável (`aria-disabled` + `aria-busy`) e ignora novos cliques.
   */
  loading?: boolean;
  /** Fantasma destrutivo: neutro em repouso, vermelho só no hover (ex.: Excluir numa linha). */
  tone?: 'danger';
  /** Estado parado para pranchas (`hover`, `active`, `focus`). Nunca no produto. */
  'data-force'?: string;
};

const isTrue = (value: unknown) => value === true || value === 'true';

/**
 * Lugar do spinner: o ícone de origem fica por cima até 300 ms e então cede ao spinner (mesma
 * caixa, sem salto). Sem ícone de origem, o lugar nasce com largura 0 e abre junto com o spinner.
 */
function SpinSlot({ glyph: Glyph, trailing = false }: { glyph?: LucideIcon; trailing?: boolean }) {
  return (
    <span
      className={`${s.spinSlot}${trailing ? ` ${s.trailing}` : ''}`}
      data-glyph={Glyph ? '' : undefined}
      aria-hidden="true"
    >
      {Glyph && <Glyph className={s.spinGlyph} />}
      <LoaderCircle className={s.spinner} />
    </span>
  );
}

export function Button({
  variant = 'secondary',
  size = 'md',
  shape = 'rounded',
  icon: Icon,
  trailingIcon: Trailing,
  loading = false,
  tone,
  type = 'button',
  className = '',
  children,
  onClick,
  ...props
}: ButtonProps) {
  // Indisponível focável (motivo em Tooltip) e carregando não executam o clique.
  const blocked = loading || isTrue(props['aria-disabled']);
  // lead: no lugar do ícone inicial · trail: no do final · add: sem ícone, abre antes do rótulo.
  const spinSlot = !loading ? null : Icon ? 'lead' : Trailing ? 'trail' : 'add';
  return (
    <button
      {...props}
      type={type}
      aria-busy={loading || undefined}
      aria-disabled={loading || props['aria-disabled'] || undefined}
      className={`${s.button} ${className}`}
      data-variant={variant}
      data-size={size}
      data-shape={shape}
      data-tone={tone}
      data-spin={spinSlot ?? undefined}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        if (blocked) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    >
      {spinSlot === 'lead' || spinSlot === 'add' ? (
        <SpinSlot glyph={Icon} />
      ) : (
        Icon && <Icon aria-hidden="true" />
      )}
      {children}
      {Trailing &&
        (spinSlot === 'trail' ? (
          <SpinSlot glyph={Trailing} trailing />
        ) : (
          <Trailing className={s.trailing} aria-hidden="true" />
        ))}
    </button>
  );
}

/**
 * Navegação com cara de botão (“Voltar ao início”, “Baixar CSV”): é um link de verdade — abre em
 * outra aba, copia endereço, leitor de tela anuncia “link”. Ação que muda dado continua `Button`.
 * `as` recebe o link do framework (`next/link`) para navegar sem recarregar.
 */
export function ButtonLink({
  as: Component = 'a',
  variant = 'secondary',
  size = 'md',
  shape = 'rounded',
  icon: Icon,
  trailingIcon: Trailing,
  className = '',
  children,
  ...props
}: Omit<ComponentProps<'a'>, 'href'> & {
  href: string;
  as?: ElementType;
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: 'rounded' | 'pill';
  icon?: LucideIcon;
  trailingIcon?: LucideIcon;
  'data-force'?: string;
}) {
  return (
    <Component
      {...props}
      className={`${s.button} ${s.anchor} ${className}`}
      data-variant={variant}
      data-size={size}
      data-shape={shape}
    >
      {Icon && <Icon aria-hidden="true" />}
      {children}
      {Trailing && <Trailing className={s.trailing} aria-hidden="true" />}
    </Component>
  );
}

export function IconButton({
  label,
  icon: Icon,
  className = '',
  fillPressed = false,
  ...props
}: Omit<ButtonProps, 'children' | 'aria-label' | 'trailingIcon'> & {
  label: string;
  icon: LucideIcon;
  /** Alternável (`aria-pressed`): o ícone fica preenchido em azul quando ligado (ex.: Salvar). */
  fillPressed?: boolean;
}) {
  // O ícone vai como `icon` (não como filho): carregando, o spinner troca com ele na mesma caixa.
  return (
    <Button
      {...props}
      icon={Icon}
      aria-label={label}
      title={props.title ?? label}
      className={`${s.icon} ${className}`}
      data-fill={fillPressed || undefined}
    />
  );
}

/**
 * Botões colados que compartilham um contorno (ex.: anterior/próximo). Os filhos podem vir
 * envoltos em `Tooltip`: o fio entre os segmentos e os cantos seguem o grupo, não o filho.
 */
export function ButtonGroup({
  label,
  children,
  size,
}: {
  label: string;
  children: ReactNode;
  /** Raio do contorno. Padrão: o do tamanho dos filhos (sm → 6, demais → 8). */
  size?: ButtonSize;
}) {
  return (
    <div role="group" aria-label={label} className={s.group} data-size={size}>
      {children}
    </div>
  );
}

/**
 * Ação principal com alternativas: o botão executa a mais comum; a seta abre as demais num `Menu`
 * alinhado ao fim. Um contorno só, cantos internos retos, foco em cada segmento.
 */
export function SplitButton({
  label,
  icon,
  variant = 'secondary',
  size = 'md',
  onClick,
  menu,
  menuLabel,
  menuWidth,
  disabled,
  loading,
  force,
}: {
  label: string;
  icon?: LucideIcon;
  variant?: 'secondary' | 'primary';
  size?: ButtonSize;
  onClick?: () => void;
  menu: MenuSection[];
  /** Nome da seta e do menu (ex.: “Outras opções de P.I.”). */
  menuLabel: string;
  menuWidth?: number;
  disabled?: boolean;
  loading?: boolean;
  /** Pranchas: estado parado por segmento; `open` gira a seta. */
  force?: { main?: string; toggle?: string };
}) {
  return (
    <div role="group" aria-label={label} className={`${s.group} ${s.split}`} data-variant={variant} data-size={size}>
      <Button
        variant={variant}
        size={size}
        icon={icon}
        disabled={disabled}
        loading={loading}
        onClick={onClick}
        data-force={force?.main}
      >
        {label}
      </Button>
      <Menu
        label={menuLabel}
        align="end"
        width={menuWidth}
        sections={menu}
        trigger={(props) => (
          <IconButton
            {...props}
            label={menuLabel}
            icon={ChevronDown}
            variant={variant}
            size={size}
            disabled={disabled || loading}
            className={s.splitToggle}
            data-force={force?.toggle}
          />
        )}
      />
    </div>
  );
}
