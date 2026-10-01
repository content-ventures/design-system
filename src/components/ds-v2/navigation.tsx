'use client';

import { Fragment, useState } from 'react';
import { ArrowRight, ChevronRight, MoreHorizontal, type LucideIcon } from 'lucide-react';
import n from './navigation.module.css';

export type BreadcrumbItem = {
  label: string;
  href?: string;
  icon?: LucideIcon;
};

export type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  label?: string;
  maxItems?: number;
  separator?: 'chevron' | 'arrow';
};

type VisibleBreadcrumb = {
  item: BreadcrumbItem;
  index: number;
};

export function Breadcrumbs({
  items,
  label = 'Trilha de navegação',
  maxItems,
  separator = 'chevron',
}: BreadcrumbsProps) {
  const [expanded, setExpanded] = useState(false);
  const firstItem = items[0];

  if (!firstItem) return null;

  const normalizedMax = maxItems ? Math.max(2, maxItems) : undefined;
  const shouldCollapse = Boolean(!expanded && normalizedMax && items.length > normalizedMax);
  const tailSize = normalizedMax ? normalizedMax - 1 : items.length;
  const hiddenCount = shouldCollapse ? items.length - tailSize - 1 : 0;
  const visibleItems: VisibleBreadcrumb[] = shouldCollapse
    ? [
        { item: firstItem, index: 0 },
        ...items.slice(-tailSize).map((item, index) => ({
          item,
          index: items.length - tailSize + index,
        })),
      ]
    : items.map((item, index) => ({ item, index }));
  const Separator = separator === 'arrow' ? ArrowRight : ChevronRight;

  return (
    <nav aria-label={label} className={n.breadcrumbs}>
      <ol className={n.breadcrumbList}>
        {visibleItems.map(({ item, index }, visibleIndex) => {
          const isCurrent = index === items.length - 1;
          const Icon = item.icon;
          const addCollapse = shouldCollapse && visibleIndex === 1;

          return (
            <Fragment key={`${item.label}-${index}`}>
              {addCollapse && (
                <>
                  <li aria-hidden="true" className={n.breadcrumbSeparator}>
                    <Separator size={14} />
                  </li>
                  <li className={n.breadcrumbItem}>
                    <button
                      type="button"
                      className={n.breadcrumbMore}
                      aria-label={`Mostrar ${hiddenCount} ${hiddenCount === 1 ? 'nível oculto' : 'níveis ocultos'}`}
                      onClick={() => setExpanded(true)}
                    >
                      <MoreHorizontal size={16} aria-hidden="true" />
                    </button>
                  </li>
                </>
              )}
              {visibleIndex > 0 && (
                <li aria-hidden="true" className={n.breadcrumbSeparator}>
                  <Separator size={14} />
                </li>
              )}
              <li className={n.breadcrumbItem}>
                {isCurrent ? (
                  <span className={n.breadcrumbCurrent} aria-current="page">
                    {Icon && <Icon size={15} aria-hidden="true" />}
                    <span>{item.label}</span>
                  </span>
                ) : item.href ? (
                  <a className={n.breadcrumbLink} href={item.href}>
                    {Icon && <Icon size={15} aria-hidden="true" />}
                    <span>{item.label}</span>
                  </a>
                ) : (
                  <span className={n.breadcrumbAncestor}>
                    {Icon && <Icon size={15} aria-hidden="true" />}
                    <span>{item.label}</span>
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
