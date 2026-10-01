'use client';

import Link from 'next/link';
import { CalendarDays, ChevronRight, Image as ImageIcon, Mail, Megaphone } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { currency, delivery, number, shortDate, type Campaign } from './campaign-data';
import { CampaignDeliveryToggle } from './campaign-table';
import { CampaignStatusLabel } from './campaign-status';
import r from './campaign-reference.module.css';

/** Lista de monitoramento experimental. Todos os valores vêm dos mocks locais. */
export function CampaignMonitor({
  rows,
  selected,
  setSelected,
  onDeliveryChange,
}: {
  rows: Campaign[];
  selected: string[];
  setSelected: Dispatch<SetStateAction<string[]>>;
  onDeliveryChange: (campaign: Campaign, enabled: boolean) => void;
}) {
  return (
    <ul className={r.campaignList} aria-label="Monitoramento de campanhas">
      {rows.map((campaign) => {
        const started = ['active', 'paused', 'completed'].includes(campaign.status);
        const Icon = campaign.assets.includes('Superbanner')
          ? ImageIcon
          : campaign.assets.includes('Newsletter')
            ? Mail
            : Megaphone;
        return (
          <li key={campaign.id}>
            <article
              className={r.campaignCard}
              data-selected={selected.includes(campaign.id)}
              aria-labelledby={`campaign-title-${campaign.id}`}
            >
              <div className={r.cardHeading}>
                <label className={r.cardSelect}>
                  <input
                    type="checkbox"
                    aria-label={`Selecionar ${campaign.name}`}
                    checked={selected.includes(campaign.id)}
                    onChange={(event) =>
                      setSelected((current) =>
                        event.target.checked
                          ? [...current, campaign.id]
                          : current.filter((id) => id !== campaign.id),
                      )
                    }
                  />
                </label>
                <span className={r.formatIcon} data-tone={campaign.identity} aria-hidden="true">
                  <Icon size={18} />
                </span>
                <div className={r.cardTitle}>
                  <h2 id={`campaign-title-${campaign.id}`}>
                    <Link href={`/campanhas/${campaign.id}`} title={campaign.name}>
                      {campaign.name}
                    </Link>
                  </h2>
                  <p>
                    <strong>{campaign.advertiser}</strong>
                    <span aria-hidden="true"> · </span>
                    {campaign.assets.join(' · ')}
                  </p>
                </div>
                <div className={r.cardSchedule}>
                  <CalendarDays size={16} aria-hidden="true" />
                  <span>
                    {shortDate(campaign.start)} — {shortDate(campaign.end)}
                  </span>
                </div>
                <div className={r.cardStatus}>
                  <CampaignDeliveryToggle campaign={campaign} onChange={onDeliveryChange} />
                  <CampaignStatusLabel status={campaign.status} />
                </div>
                <Link
                  className={r.cardOpen}
                  href={`/campanhas/${campaign.id}`}
                  aria-label={`Abrir ${campaign.name}`}
                >
                  <ChevronRight size={18} />
                </Link>
              </div>
              <dl className={r.cardMetrics}>
                <div>
                  <dt>Impressões entregues</dt>
                  <dd>{started ? number(campaign.delivered) : '—'}</dd>
                </div>
                <div>
                  <dt>Meta de impressões</dt>
                  <dd>{number(campaign.target)}</dd>
                </div>
                <div>
                  <dt>Meta cumprida</dt>
                  <dd>{started ? `${delivery(campaign)}%` : '—'}</dd>
                </div>
                <div>
                  <dt>Verba planejada</dt>
                  <dd>{currency(campaign.budget)}</dd>
                </div>
              </dl>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
