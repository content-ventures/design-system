'use client';

import Link from 'next/link';
import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { currency, delivery, number, statusLabels, type Campaign } from './campaign-data';
import { CampaignStatusLabel } from './campaign-status';
import t from './campaign-table.module.css';

export type TableDensity = 'comfortable' | 'compact';

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
    <>
      <button
        type="button"
        role="switch"
        className={t.deliverySwitch}
        aria-label={`Veiculação de ${campaign.name}`}
        aria-checked={campaign.status === 'active'}
        aria-describedby={`delivery-help-${campaign.id}`}
        disabled={!canToggle}
        title={help}
        onClick={() => onChange(campaign, campaign.status !== 'active')}
      >
        <span className={t.switchTrack} aria-hidden="true" />
      </button>
      <span id={`delivery-help-${campaign.id}`} className={t.srOnly}>
        {help}
      </span>
    </>
  );
}

const tableDate = (date: string) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' })
    .format(new Date(`${date}T12:00:00Z`))
    .replace(' de ', ' ')
    .replace('.', '');

/** Tabela experimental do laboratório; não importa componentes ou dados de produção. */
export function CampaignTable({
  rows,
  density,
  selected,
  setSelected,
  sort,
  onSort,
  onDeliveryChange,
}: {
  rows: Campaign[];
  density: TableDensity;
  selected: string[];
  setSelected: Dispatch<SetStateAction<string[]>>;
  sort: 'asc' | 'desc' | null;
  onSort: () => void;
  onDeliveryChange: (campaign: Campaign, enabled: boolean) => void;
}) {
  const selectAll = useRef<HTMLInputElement>(null);
  const selectedCount = rows.filter((row) => selected.includes(row.id)).length;
  useEffect(() => {
    if (selectAll.current)
      selectAll.current.indeterminate = selectedCount > 0 && selectedCount < rows.length;
  }, [selectedCount, rows.length]);

  return (
    <div className={t.scroll} role="region" aria-label="Tabela de campanhas" tabIndex={0}>
      <table className={t.table} data-density={density}>
        <caption className={t.srOnly}>
          Campanhas, veiculação, formatos, verba e entrega de impressões
        </caption>
        <colgroup>
          <col className={t.selectionColumn} />
          <col className={t.toggleColumn} />
          <col />
          <col className={t.advertiserColumn} />
          <col className={t.statusColumn} />
          <col className={t.periodColumn} />
          <col className={t.budgetColumn} />
          <col className={t.deliveryColumn} />
          <col className={t.actionColumn} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className={t.checkCell}>
              <label className={t.checkTarget}>
                <input
                  ref={selectAll}
                  type="checkbox"
                  aria-label="Selecionar campanhas visíveis"
                  checked={selectedCount === rows.length && rows.length > 0}
                  onChange={(event) =>
                    setSelected(event.target.checked ? rows.map((row) => row.id) : [])
                  }
                />
                <span className={t.mobileSelectText} aria-hidden="true">
                  Selecionar todas
                </span>
              </label>
            </th>
            <th scope="col" className={t.toggleCell}>
              <span className={t.srOnly}>Veiculação</span>
            </th>
            <th scope="col">Campanha</th>
            <th scope="col">Anunciante</th>
            <th scope="col">Status</th>
            <th scope="col">Período</th>
            <th
              scope="col"
              className={t.numeric}
              aria-sort={sort === 'asc' ? 'ascending' : sort === 'desc' ? 'descending' : 'none'}
            >
              <button onClick={onSort}>
                Verba {sort === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
              </button>
            </th>
            <th scope="col" className={t.deliveryHeading}>
              Impressões
            </th>
            <th scope="col">
              <span className={t.srOnly}>Detalhes</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const hasDelivery = ['active', 'paused', 'completed'].includes(row.status);
            const progress = delivery(row);
            return (
              <tr key={row.id} data-selected={selected.includes(row.id)}>
                <td className={t.checkCell}>
                  <label className={t.checkTarget}>
                    <input
                      type="checkbox"
                      aria-label={`Selecionar ${row.name}`}
                      checked={selected.includes(row.id)}
                      onChange={(event) =>
                        setSelected((current) =>
                          event.target.checked
                            ? [...current, row.id]
                            : current.filter((id) => id !== row.id),
                        )
                      }
                    />
                  </label>
                </td>
                <td className={t.toggleCell}>
                  <CampaignDeliveryToggle campaign={row} onChange={onDeliveryChange} />
                </td>
                <td className={t.nameCell}>
                  <Link
                    className={t.campaignLink}
                    href={`/campanhas/${row.id}`}
                    title={`${row.name} · ${row.advertiser}`}
                  >
                    <strong>{row.name}</strong>
                  </Link>
                  <div className={t.formats} aria-label="Formatos">
                    {row.assets.map((asset) => (
                      <span key={asset}>{asset}</span>
                    ))}
                  </div>
                </td>
                <td className={t.advertiserCell} data-label="Anunciante">
                  <span>{row.advertiser}</span>
                </td>
                <td className={t.statusCell}>
                  <CampaignStatusLabel status={row.status} />
                </td>
                <td className={t.periodCell} data-label="Período">
                  <div className={t.period}>
                    <span>
                      {tableDate(row.start)} — {tableDate(row.end)}
                    </span>
                    <small>
                      {row.start.slice(0, 4)}
                      {row.end.slice(0, 4) !== row.start.slice(0, 4)
                        ? ` / ${row.end.slice(0, 4)}`
                        : ''}
                    </small>
                  </div>
                </td>
                <td className={`${t.numeric} ${t.budgetCell}`} data-label="Verba planejada">
                  <span className={t.budget}>{currency(row.budget)}</span>
                </td>
                <td className={t.deliveryCell} data-label="Entrega · impressões">
                  {hasDelivery ? (
                    <div className={t.delivery}>
                      <div className={t.deliveryNumbers}>
                        <strong>{number(row.delivered)}</strong>
                        <span>{progress}%</span>
                      </div>
                      <div className={t.deliveryMeta}>
                        <div
                          className={t.progress}
                          role="progressbar"
                          aria-label={`Entrega de ${row.name}`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={progress}
                          aria-valuetext={`${number(row.delivered)} de ${number(row.target)} impressões, ${progress}% da meta`}
                        >
                          <span style={{ width: `${progress}%` }} />
                        </div>
                        <small>de {number(row.target)}</small>
                      </div>
                    </div>
                  ) : (
                    <span className={t.notStarted}>Não iniciada</span>
                  )}
                </td>
                <td className={t.actionCell}>
                  <Link href={`/campanhas/${row.id}`} aria-label={`Abrir ${row.name}`}>
                    Abrir
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
