import { Switch } from '../../components/ds-v2/selection';
import { statusLabels, type Campaign } from '../campanhas/campaign-data';

export function CampaignDeliveryToggle({
  campaign,
  onChange,
}: {
  campaign: Campaign;
  onChange: (campaign: Campaign, enabled: boolean) => void;
}) {
  const canToggle = campaign.status === 'active' || campaign.status === 'paused';
  const help = canToggle
    ? `${campaign.status === 'active' ? 'Pausar' : 'Retomar'} somente na demonstração. Nenhuma campanha real será alterada.`
    : `${statusLabels[campaign.status]}. Veiculação indisponível nesta etapa da demonstração.`;
  return (
    <Switch
      label={`Veiculação de ${campaign.name}`}
      checked={campaign.status === 'active'}
      disabled={!canToggle}
      description={help}
      onCheckedChange={(enabled) => onChange(campaign, enabled)}
    />
  );
}
