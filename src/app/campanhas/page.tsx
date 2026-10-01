import { CampaignWorkspace } from './campaign-workspace';
import type { Direction } from './campaign-data';

export default async function CampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ visao?: string }>;
}) {
  const { visao } = await searchParams;
  const direction: Direction =
    visao === 'portfolio' || visao === 'veiculacao' || visao === 'operacao'
      ? visao
      : 'monitoramento';
  return <CampaignWorkspace initialDirection={direction} />;
}
