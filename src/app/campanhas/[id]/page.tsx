import { CampaignDetail } from '../campaign-detail';

export default async function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CampaignDetail id={id} />;
}
