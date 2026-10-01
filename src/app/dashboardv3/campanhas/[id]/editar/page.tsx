import { CampaignBuilder } from '../../../builder/builder';

export default async function EditarCampanhaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CampaignBuilder mode="edit" id={id} />;
}
