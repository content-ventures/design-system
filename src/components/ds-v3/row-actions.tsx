'use client';

import { Ellipsis, type LucideIcon } from 'lucide-react';
import { IconButton } from './button';
import { Menu, Tooltip, type MenuItem, type MenuSection } from './overlays';
import s from './row-actions.module.css';

export type RowAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  /** Indisponível focável: o motivo (`hint`) aparece na dica e é lido pelo leitor de tela. */
  disabled?: boolean;
  hint?: string;
  /** Destrutiva: vermelho só no hover; no menu, vai por último e separada. */
  danger?: boolean;
  /** Não se aplica a esta linha: o slot fica vazio, mas guarda o lugar. */
  hidden?: boolean;
  /** Estado parado para pranchas. */
  'data-force'?: string;
};

function toItem(action: RowAction): MenuItem {
  return {
    label: action.label,
    icon: action.icon,
    danger: action.danger && !action.disabled,
    disabled: action.disabled,
    description: action.disabled ? action.hint : undefined,
    onSelect: action.onSelect,
  };
}
function sectionsOf(actions: RowAction[]): MenuSection[] {
  const visible = actions.filter((action) => !action.hidden);
  const safe = visible.filter((action) => !action.danger).map(toItem);
  const danger = visible.filter((action) => action.danger).map(toItem);
  return [...(safe.length ? [{ items: safe }] : []), ...(danger.length ? [{ items: danger }] : [])];
}

/**
 * Ações de uma linha em slots fixos de 32 × 32: cada ação fica no mesmo x em todas as linhas,
 * sempre visível (nada de aparecer só no hover). Ícones em g-400; a linha em hover ou com foco
 * sobe para g-600 (`[data-row-actions]` dentro de `tr` ou `[data-row]`). Além de `max`, as demais
 * vão para “⋯”. `compact` põe tudo no “⋯” (cartões no celular).
 */
export function RowActions({
  actions,
  max = 3,
  overflowLabel = 'Mais ações',
  label = 'Ações',
  compact = false,
}: {
  actions: RowAction[];
  max?: number;
  overflowLabel?: string;
  /** Nome do grupo (ex.: “Ações de Carrossel de tendências”). */
  label?: string;
  compact?: boolean;
}) {
  const overflow = compact || actions.length > max;
  const inline = compact ? [] : overflow ? actions.slice(0, Math.max(0, max - 1)) : actions;
  const rest = compact ? actions : overflow ? actions.slice(Math.max(0, max - 1)) : [];
  const menu = sectionsOf(rest);
  return (
    <span role="group" aria-label={label} className={s.slots} data-row-actions>
      {inline.map((action) =>
        action.hidden ? (
          <span key={action.id} className={s.slot} data-slot="empty" aria-hidden="true" />
        ) : (
          <Tooltip key={action.id} content={action.disabled && action.hint ? action.hint : action.label}>
            <IconButton
              label={action.label}
              icon={action.icon}
              variant="ghost"
              size="sm"
              tone={action.danger ? 'danger' : undefined}
              aria-disabled={action.disabled || undefined}
              onClick={action.onSelect}
              data-force={action['data-force']}
            />
          </Tooltip>
        ),
      )}
      {menu.length > 0 && (
        <Menu
          label={overflowLabel}
          align="end"
          sections={menu}
          trigger={(props) => (
            <IconButton {...props} label={overflowLabel} icon={Ellipsis} variant="ghost" size="sm" />
          )}
        />
      )}
    </span>
  );
}
