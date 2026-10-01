'use client';

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { campaigns, type Campaign, type Direction } from './campaign-data';
import type { TableDensity } from './campaign-table';

export type WorkspaceState = {
  query: string;
  status: string;
  advertiser: string;
  format: string;
  period: string;
  sort: 'asc' | 'desc' | null;
  direction: Direction | null;
  selected: string[];
  extraFilters: boolean;
  density: TableDensity;
};

const CampaignContext = createContext<{
  rows: Campaign[];
  addDraft: (campaign: Campaign) => void;
  setDeliveryEnabled: (id: string, enabled: boolean) => void;
  workspace: WorkspaceState;
  setWorkspace: Dispatch<SetStateAction<WorkspaceState>>;
} | null>(null);

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState(campaigns);
  const [workspace, setWorkspace] = useState<WorkspaceState>({
    query: '',
    status: 'all',
    advertiser: 'all',
    format: 'all',
    period: 'all',
    sort: null,
    direction: null,
    selected: [],
    extraFilters: false,
    density: 'compact',
  });
  return (
    <CampaignContext.Provider
      value={{
        rows,
        addDraft: (campaign) => setRows((current) => [campaign, ...current]),
        setDeliveryEnabled: (id, enabled) =>
          setRows((current) =>
            current.map((row) =>
              row.id === id && (row.status === 'active' || row.status === 'paused')
                ? { ...row, status: enabled ? 'active' : 'paused' }
                : row,
            ),
          ),
        workspace,
        setWorkspace,
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaigns() {
  const context = useContext(CampaignContext);
  if (!context) throw new Error('CampaignProvider necessário para a tela-piloto.');
  return context;
}
