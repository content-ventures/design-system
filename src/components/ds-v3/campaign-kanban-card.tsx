'use client';

import { BrandMark } from './identity';
import {
  KanbanCard,
  KanbanCardMeta,
  KanbanCardRow,
  KanbanCardValue,
  type KanbanCardProps,
} from './kanban';

/** Campanha no mesmo cartão do funil de leads; somente os dados do domínio mudam. */
export function CampaignKanbanCard({
  name,
  advertiser,
  portal,
  budget,
  period,
  ...props
}: Omit<KanbanCardProps, 'title' | 'leading' | 'children' | 'summary'> & {
  name: string;
  advertiser?: string | null;
  portal: string;
  budget?: number | null;
  /** Intervalo já formatado pelo consumidor, sem inferir datas ou status. */
  period: string;
}) {
  return (
    <KanbanCard
      {...props}
      title={name}
      leading={<BrandMark name={advertiser || name} size="xs" variant="soft" decorative />}
    >
      <KanbanCardRow start>
        <KanbanCardValue value={budget} emptyText="Verba a definir" />
        <KanbanCardMeta title={portal}>
          <span aria-hidden="true">·</span> {portal}
        </KanbanCardMeta>
      </KanbanCardRow>
      <KanbanCardRow start>
        <KanbanCardMeta title={advertiser || undefined}>
          {advertiser || 'Anunciante não informado'}
        </KanbanCardMeta>
      </KanbanCardRow>
      <KanbanCardRow start>
        <KanbanCardMeta caption aria-label={`Período de veiculação: ${period}`}>
          {period}
        </KanbanCardMeta>
      </KanbanCardRow>
    </KanbanCard>
  );
}
