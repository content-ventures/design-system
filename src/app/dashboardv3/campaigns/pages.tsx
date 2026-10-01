'use client';

import { SELF_ADVERTISER_ID } from '../domain';
import { Shell } from '../shell';
import { store, useStore } from '../store';
import { CampaignDetail } from './detail';
import { CampaignList } from './list';

export function CampaignsPage() {
  const { persona } = useStore();
  return (
    <Shell crumbs={[{ label: persona === 'anunciante' ? 'Anunciar' : 'Operação' }, { label: persona === 'anunciante' ? 'Minhas campanhas' : 'Campanhas' }]}>
      <CampaignList />
    </Shell>
  );
}

export function CampaignPage({ id }: { id: string }) {
  const { persona } = useStore();
  // Campanha de outro anunciante não existe para quem anuncia: nem o nome aparece no caminho.
  const c = store.get(id);
  const visible = c && (persona !== 'anunciante' || c.draft.advertiserId === SELF_ADVERTISER_ID);
  const name = visible ? c.draft.name : 'Campanha não encontrada';
  return (
    <Shell
      crumbs={[
        { label: persona === 'anunciante' ? 'Anunciar' : 'Operação' },
        { label: persona === 'anunciante' ? 'Minhas campanhas' : 'Campanhas', href: '/dashboardv3/campanhas' },
        { label: name },
      ]}
    >
      <CampaignDetail id={id} />
    </Shell>
  );
}
