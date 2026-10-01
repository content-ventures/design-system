'use client';

import type { Notify } from './toasts';
import { useState } from 'react';
import { SelectControl, selectOptions } from './controls';
import { CampaignEditor } from './campaign-editor';
import {
  ArrowLeft,
  CalendarDays,
  CircleDot,
  ClipboardList,
  Layers2,
  SlidersHorizontal,
  Target,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useCampaigns } from '../campanhas/campaign-context';
import { CampaignDeliveryToggle } from './campaign-toggle';
import {
  campaignCsv,
  delivery,
  filterCampaigns,
  shortDate,
  statusLabels,
  type Campaign,
  type CampaignStatus,
} from '../campanhas/campaign-data';
import { Empty, Group, SummaryStrip, Tabs, Toolbar, type Tone } from './workspace-ui';
import { navigate, type ViewMode } from './workspace-data';
import { formatCurrency as currency } from './workspace-ui';
import s from './dashboard.module.css';
import a from './application.module.css';
function Column({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className={s.columnHeading}>
      <Icon size={15} aria-hidden="true" />
      {children}
    </span>
  );
}
export function CampaignRows({
  rows,
  onToggle,
  onOpen,
}: {
  rows: Campaign[];
  onOpen: (campaign: Campaign) => void;
  onToggle: (row: Campaign, enabled: boolean) => void;
}) {
  return (
    <div className={s.tableScroll} tabIndex={0} role="region" aria-label="Lista de campanhas">
      <table className={s.table}>
        <caption className={s.srOnly}>
          Campanhas, ativação, anunciante, período, verba e entrega
        </caption>
        <colgroup>
          <col className={s.toggleColumn} />
          <col className={s.nameColumn} />
          <col className={s.advertiserColumn} />
          <col className={s.statusColumn} />
          <col className={s.dateColumn} />
          <col className={s.budgetColumn} />
          <col className={s.deliveryColumn} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className={s.toggleCell}>
              <span title="Ativar ou desativar veiculação">
                <SlidersHorizontal size={15} aria-hidden="true" />
                <span className={s.srOnly}>Ativação</span>
              </span>
            </th>
            <th scope="col">
              <Column icon={Target}>Nome da campanha</Column>
            </th>
            <th scope="col">
              <Column icon={UsersRound}>Anunciante</Column>
            </th>
            <th scope="col">
              <Column icon={CircleDot}>Status</Column>
            </th>
            <th scope="col">
              <Column icon={CalendarDays}>Período</Column>
            </th>
            <th scope="col">
              <Column icon={ClipboardList}>Verba</Column>
            </th>
            <th scope="col">
              <Column icon={Layers2}>Entrega</Column>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className={s.toggleCell}>
                <CampaignDeliveryToggle campaign={row} onChange={onToggle} />
              </td>
              <td>
                <button className={a.recordLink} onClick={() => onOpen(row)} title={row.name}>
                  {row.name}
                </button>
              </td>
              <td>
                <span className={s.advertiser}>
                  <span className={s.avatar} data-identity={row.identity} aria-hidden="true">
                    {row.initials}
                  </span>
                  <span>{row.advertiser}</span>
                </span>
              </td>
              <td>
                <span className={s.status} data-status={row.status}>
                  <i aria-hidden="true" />
                  {statusLabels[row.status]}
                </span>
              </td>
              <td className={s.muted}>
                {shortDate(row.start)} – {shortDate(row.end)}
              </td>
              <td className={s.numeric}>{currency(row.budget)}</td>
              <td>
                {['active', 'paused', 'completed'].includes(row.status) ? (
                  <span
                    className={s.progress}
                    aria-label={`${delivery(row)}% da meta de impressões`}
                  >
                    <span>
                      <i style={{ width: `${delivery(row)}%` }} />
                    </span>
                    <span>{delivery(row)}%</span>
                  </span>
                ) : (
                  <span className={s.muted}>Não iniciada</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const campaignGroups: {
  id: string;
  label: string;
  tone: Tone;
  statuses: CampaignStatus[];
}[] = [
  { id: 'delivery', label: 'Veiculação', tone: 'blue', statuses: ['active', 'paused'] },
  { id: 'planning', label: 'Em planejamento', tone: 'amber', statuses: ['draft'] },
  { id: 'review', label: 'Em aprovação', tone: 'pink', statuses: ['submitted', 'adjustments'] },
  { id: 'done', label: 'Concluídas', tone: 'green', statuses: ['completed'] },
];
export function CampaignScreen({
  mode,
  recordId,
  notice,
}: {
  mode: ViewMode;
  recordId: string | null;
  notice: Notify;
}) {
  const { rows, setDeliveryEnabled, addDraft } = useCampaigns();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [advertiser, setAdvertiser] = useState('all');
  const [order, setOrder] = useState<'default' | 'asc' | 'desc'>('default');
  const scoped = mode === 'anunciante' ? rows.filter((row) => row.advertiser === 'Aurora') : rows;
  const visible = filterCampaigns(scoped, { query, status, advertiser, period: 'all' }).sort(
    (left, right) =>
      order === 'default'
        ? 0
        : left.name.localeCompare(right.name, 'pt-BR') * (order === 'asc' ? 1 : -1),
  );
  const toggle = (row: Campaign, enabled: boolean) => {
    setDeliveryEnabled(row.id, enabled);
    notice(`${row.name}: veiculação ${enabled ? 'ativada' : 'desativada'}.`);
  };
  if (recordId === 'novo')
    return (
      <CampaignEditor
        mode={mode}
        onSave={(campaign) => {
          addDraft(campaign);
          navigate('campanhas', mode);
          notice({
            title: 'Rascunho criado',
            message: 'A campanha foi salva com a veiculação desligada.',
            action: {
              label: 'Ver campanha',
              onClick: () => navigate('campanhas', mode, campaign.id),
            },
          });
        }}
      />
    );
  if (recordId) {
    const row = scoped.find((row) => row.id === recordId);
    if (!row) return <Empty reset={() => navigate('campanhas', mode)} />;
    return (
      <div className={a.screenBody}>
        <button className={a.backButton} onClick={() => navigate('campanhas', mode)}>
          <ArrowLeft size={15} />
          Todas as campanhas
        </button>
        <div className={a.detailHeading}>
          <div>
            <span className={a.eyebrow}>{row.advertiser}</span>
            <h2>{row.name}</h2>
            <p>{statusLabels[row.status]}</p>
          </div>
          <CampaignDeliveryToggle campaign={row} onChange={toggle} />
        </div>
        <SummaryStrip
          items={[
            { label: 'Verba planejada', value: currency(row.budget) },
            { label: 'Impressões entregues', value: row.delivered.toLocaleString('pt-BR') },
            { label: 'Meta', value: row.target.toLocaleString('pt-BR') },
            { label: 'Entrega', value: `${delivery(row)}%` },
          ]}
        />
        <div className={a.detailGrid}>
          <section className={a.detailSection}>
            <h3>Planejamento</h3>
            <dl>
              <div>
                <dt>Período</dt>
                <dd>
                  {shortDate(row.start)} de {row.start.slice(0, 4)} – {shortDate(row.end)} de{' '}
                  {row.end.slice(0, 4)}
                </dd>
              </div>
              <div>
                <dt>Anunciante</dt>
                <dd>{row.advertiser}</dd>
              </div>
              <div>
                <dt>Ativos de mídia</dt>
                <dd>{row.assets.join(' · ')}</dd>
              </div>
            </dl>
          </section>
          <section className={a.detailSection}>
            <h3>Próximos passos</h3>
            <p>Acompanhe o pedido de inserção e os materiais da campanha.</p>
            <div className={a.relatedLinks}>
              <button onClick={() => navigate('pedidos', mode)}>Pedidos de Inserção</button>
              <button onClick={() => navigate('criativos', mode)}>Criativos</button>
              <button onClick={() => navigate('performance', mode)}>Performance</button>
            </div>
          </section>
        </div>
      </div>
    );
  }
  return (
    <>
      <Toolbar
        title="Campanhas"
        query={query}
        setQuery={setQuery}
        onSort={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
        sort={order === 'asc'}
        exportAction={() => {
          const url = URL.createObjectURL(
            new Blob([campaignCsv(visible)], { type: 'text/csv;charset=utf-8;' }),
          );
          const link = document.createElement('a');
          link.href = url;
          link.download = 'mediaon-campanhas-demo.csv';
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          notice('Arquivo CSV exportado.');
        }}
      >
        <Tabs
          active={status}
          onChange={setStatus}
          values={[
            { id: 'all', label: 'Todas', count: scoped.length },
            { id: 'active', label: 'Em veiculação' },
            { id: 'paused', label: 'Pausadas' },
            { id: 'attention', label: 'Em aprovação' },
            { id: 'draft', label: 'Rascunhos' },
          ]}
        />
      </Toolbar>
      <div className={a.screenBody}>
        <div className={a.contextBar}>
          <span>
            {visible.length} campanhas<span className={s.footerDot}>·</span>Setembro – Outubro, 2026
          </span>
          <label>
            Anunciante
            <SelectControl
              label="Filtrar por anunciante"
              compact
              value={advertiser}
              onValueChange={setAdvertiser}
              options={[
                { value: 'all', label: 'Todos os anunciantes' },
                ...selectOptions([...new Set(scoped.map((row) => row.advertiser))]),
              ]}
            />
          </label>
        </div>
        {visible.length === 0 ? (
          <Empty
            reset={() => {
              setQuery('');
              setStatus('all');
              setAdvertiser('all');
            }}
          />
        ) : (
          campaignGroups.map((group) => {
            const groupRows = visible.filter((row) => group.statuses.includes(row.status));
            return (
              groupRows.length > 0 && (
                <Group key={group.id} {...group} count={groupRows.length}>
                  <CampaignRows
                    rows={groupRows}
                    onToggle={toggle}
                    onOpen={(row) => navigate('campanhas', mode, row.id)}
                  />
                </Group>
              )
            );
          })
        )}
        <footer className={s.resultsFooter}>
          <span>{scoped.filter((row) => row.status === 'active').length} campanhas ativas</span>
          <span>Verba total {currency(visible.reduce((sum, row) => sum + row.budget, 0))}</span>
        </footer>
      </div>
    </>
  );
}
