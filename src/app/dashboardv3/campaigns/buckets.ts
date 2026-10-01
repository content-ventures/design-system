/**
 * Recortes de status usados em todo o app: abas da lista, grupos da vista agrupada,
 * rodapé e contador do menu. Um único mapa para que os números batam em todo lugar.
 */
import type { CampaignStatus } from '../domain';

export type BucketKey = 'veiculacao' | 'aprovacao' | 'rascunhos' | 'encerradas';

export const BUCKETS: readonly { key: BucketKey; label: string; statuses: CampaignStatus[] }[] = [
  { key: 'veiculacao', label: 'Em veiculação', statuses: ['approved', 'active', 'paused'] },
  { key: 'aprovacao', label: 'Em aprovação', statuses: ['submitted', 'adjustments_requested', 'awaiting_pi_signature'] },
  { key: 'rascunhos', label: 'Rascunhos', statuses: ['draft'] },
  { key: 'encerradas', label: 'Encerradas', statuses: ['completed', 'rejected', 'cancelled', 'pi_rejected'] },
];

/** Recorte a que o status pertence. Todo status cai em exatamente um. */
export function bucketOf(status: CampaignStatus): BucketKey {
  return BUCKETS.find((bucket) => bucket.statuses.includes(status))?.key ?? 'encerradas';
}
