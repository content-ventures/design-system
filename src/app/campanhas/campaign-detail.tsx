'use client';

import Link from 'next/link';
import { ArrowLeft, Check, CircleCheck, Clock3, Info, Monitor } from 'lucide-react';
import { useCampaigns } from './campaign-context';
import { BrandTile, Delivery, Status } from './campaign-workspace';
import { currency, number, shortDate } from './campaign-data';
import s from './pilot.module.css';

export function CampaignDetail({ id }: { id: string }) {
  const { rows } = useCampaigns();
  const row = rows.find((item) => item.id === id);
  if (!row)
    return (
      <div className={s.detailPage}>
        <Link className={s.backLink} href="/campanhas">
          <ArrowLeft size={15} />
          Voltar para campanhas
        </Link>
        <div className={s.empty}>
          <h1>Campanha não disponível nesta prévia</h1>
          <p>Os rascunhos demonstrativos existem apenas enquanto esta sessão está aberta.</p>
          <Link className={s.primaryButton} href="/campanhas">
            Ver campanhas de exemplo
          </Link>
        </div>
      </div>
    );
  const pending = row.status === 'submitted' || row.status === 'adjustments';
  return (
    <div className={s.detailPage}>
      <Link className={s.backLink} href="/campanhas">
        <ArrowLeft size={15} />
        Todas as campanhas
      </Link>
      <div className={s.detailHeading}>
        <BrandTile campaign={row} large />
        <div>
          <Status campaign={row} />
          <h1>{row.name}</h1>
          <p>
            {row.advertiser} <span>·</span> Workspace Francal
          </p>
        </div>
      </div>
      <div className={s.detailGrid}>
        <div>
          <section className={s.detailPanel}>
            <h2>Visão da campanha</h2>
            <dl>
              <div>
                <dt>Anunciante</dt>
                <dd>{row.advertiser}</dd>
              </div>
              <div>
                <dt>Verba planejada</dt>
                <dd>{currency(row.budget)}</dd>
              </div>
              <div>
                <dt>Período de veiculação</dt>
                <dd>
                  {shortDate(row.start)} — {shortDate(row.end)} 2026
                </dd>
              </div>
              <div>
                <dt>Entrega de impressões</dt>
                <dd>
                  <Delivery campaign={row} />
                </dd>
              </div>
              <div>
                <dt>Impressões entregues</dt>
                <dd>{number(row.delivered)}</dd>
              </div>
              <div>
                <dt>Meta de impressões</dt>
                <dd>{number(row.target)}</dd>
              </div>
            </dl>
          </section>
          <section className={s.detailPanel} style={{ marginTop: 20 }}>
            <h2>Ativos desta campanha</h2>
            {row.assets.map((asset) => (
              <div className={s.detailAsset} key={asset}>
                <Monitor size={18} />
                <span>{asset}</span>
                <Check size={15} />
              </div>
            ))}
          </section>
        </div>
        <aside className={s.detailAside}>
          <h2>{pending ? 'Próximo passo' : 'Etapa da campanha'}</h2>
          <p>
            {row.status === 'adjustments' ? (
              <>
                O material está em ajuste. Neste cenário fictício, o anunciante precisa{' '}
                <strong>revisar o formato do criativo</strong> antes de reenviar.
              </>
            ) : row.status === 'submitted' ? (
              <>
                O material foi enviado. O próximo passo é <strong>revisar a campanha</strong> e o
                pedido de inserção.
              </>
            ) : row.status === 'draft' ? (
              <>
                O rascunho está pronto para continuar depois.{' '}
                <strong>Nenhuma campanha foi publicada.</strong>
              </>
            ) : row.status === 'paused' ? (
              <>
                A campanha está pausada somente nesta demonstração. A entrega acumulada foi
                preservada. Use o toggle da tabela para retomar o exemplo.
              </>
            ) : row.status === 'completed' ? (
              <>
                A veiculação deste exemplo foi concluída. Os dados permanecem disponíveis para
                consulta.
              </>
            ) : (
              <>
                A campanha está em veiculação neste cenário de demonstração. Acompanhe período,
                ativos e entrega em um só lugar.
              </>
            )}
          </p>
          <ol>
            <li>
              <CircleCheck size={16} />
              Planejamento
            </li>
            <li>
              {row.status === 'draft' || pending ? <Clock3 size={16} /> : <CircleCheck size={16} />}
              Revisão e aprovação
            </li>
            <li>
              {['active', 'paused', 'completed'].includes(row.status) ? (
                <CircleCheck size={16} />
              ) : (
                <Clock3 size={16} />
              )}
              Veiculação
            </li>
          </ol>
        </aside>
      </div>
      <p className={s.detailNote}>
        <Info size={15} />
        Dados e etapas ilustrativos. Aprovação, publicação e alterações em campanhas reais não estão
        conectadas a esta prévia.
      </p>
    </div>
  );
}
