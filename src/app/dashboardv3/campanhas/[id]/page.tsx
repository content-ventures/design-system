import { CampaignPage } from '../../campaigns/pages';

export default async function CampanhaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CampaignPage id={id} />;
}
