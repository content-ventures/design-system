import { statusLabels, type CampaignStatus } from './campaign-data';
import s from './pilot.module.css';

/** Etapa em texto: sem cápsula, ilustração ou símbolo desenhado para o piloto. */
export function CampaignStatusLabel({ status, label }: { status: CampaignStatus; label?: string }) {
  return (
    <span className={s.status} data-status={status}>
      {label ?? statusLabels[status]}
    </span>
  );
}
