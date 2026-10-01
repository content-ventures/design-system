'use client';

/**
 * Estado em memória do Dashboard V3: campanhas e papel de quem está vendo.
 * Sem persistência: recarregar a página volta aos dados de exemplo.
 */
import { useSyncExternalStore } from 'react';
import {
  ADVERTISERS,
  ASSETS,
  PACKAGES,
  SELF_ADVERTISER_ID,
  STATUS_DONE,
  byId,
  type CampaignStatus,
  type Category,
  type PricingModel,
} from './domain';
import { equalSplit, type FormValues } from './pricing';

export type Persona = 'operador' | 'anunciante';

export type CampaignDraft = {
  name: string;
  advertiserId: string;
  startDate: string;
  endDate: string;
  selectionKind: 'asset' | 'package';
  category: Category | '';
  assetId: string;
  packageId: string;
  pricingModel: PricingModel | '';
  budget: string;
  channelIds: string[];
  channelAlloc: Record<string, number>;
  audienceIds: string[];
  audienceAlloc: Record<string, number>;
  formValues: FormValues;
  submitNow: boolean;
};

export const emptyDraft = (persona: Persona): CampaignDraft => ({
  name: '',
  advertiserId: persona === 'anunciante' ? SELF_ADVERTISER_ID : '',
  startDate: '',
  endDate: '',
  selectionKind: 'asset',
  category: '',
  assetId: '',
  packageId: '',
  pricingModel: '',
  budget: '',
  channelIds: [],
  channelAlloc: {},
  audienceIds: [],
  audienceAlloc: {},
  formValues: {},
  submitNow: false,
});

export type HistoryEntry = { at: string; who: string; text: string; kind: 'create' | 'status' | 'edit' | 'pi' | 'metric' };
export type Campaign = {
  id: string;
  status: CampaignStatus;
  createdByAdmin: boolean;
  createdAt: string;
  draft: CampaignDraft;
  metrics?: { impressions?: number; clicks?: number; leads?: number; delivered: number };
  reason?: { text: string; at: string; who?: string };
  pi?: { code: string; status: string; expiresAt?: string };
  history: HistoryEntry[];
};

type State = { campaigns: Campaign[]; persona: Persona };

function seed(): Campaign[] {
  const rows: [string, string, string, CampaignStatus, string, string, number, boolean, Campaign['metrics']?, string?][] = [
    ['Coleção Primavera-Verão no portal', 'adv-aurora', 'as-supertopo', 'active', '2026-10-01', '2026-10-31', 18_000, true, { impressions: 271_400, clicks: 6_120, leads: 214, delivered: 68 }],
    ['Newsletter dos expositores', 'adv-norte', 'as-email', 'active', '2026-10-05', '2026-10-25', 8_000, true, { impressions: 11_240, clicks: 1_830, leads: 96, delivered: 56 }],
    ['Convite para o estande B-214', 'adv-forma', 'as-push', 'awaiting_pi_signature', '2026-10-14', '2026-10-17', 3_600, true],
    ['Destaque couro vegetal', 'adv-lume', 'as-supertopo', 'submitted', '2026-10-10', '2026-10-30', 9_000, false],
    ['Retargeting de credenciados', 'adv-horizonte', 'as-supertopo', 'adjustments_requested', '2026-10-01', '2026-10-31', 13_500, false, undefined, 'A peça 970 × 250 está com o logotipo cortado. Ajuste o respiro e reenvie.'],
    ['Vitrine de lançamentos Aurora', 'adv-aurora', 'as-supertopo', 'adjustments_requested', '2026-10-12', '2026-10-30', 11_230, false, undefined, 'A verba não segue o múltiplo do ativo e a URL de destino está fora do ar. Revise e reenvie.'],
    ['Rodada de negócios — segunda edição', 'adv-sul', 'as-rodada', 'paused', '2026-09-25', '2026-10-17', 3_600, true, { impressions: 180, clicks: 64, leads: 38, delivered: 60 }],
    ['Guia oficial do visitante', 'adv-patio', 'as-email', 'completed', '2026-09-15', '2026-09-30', 12_000, true, { impressions: 30_000, clicks: 4_906, leads: 312, delivered: 100 }],
    ['Painel de LED — lançamento', 'adv-passo', 'as-led', 'approved', '2026-10-14', '2026-10-17', 18_000, true],
    ['Carrossel de tendências', 'adv-aurora', 'as-post', 'draft', '2026-10-05', '2026-10-12', 0, false],
    ['Totens — coleção infantil', 'adv-passo', 'as-totem', 'pi_rejected', '2026-10-14', '2026-10-17', 5_600, true, undefined, 'O P.I. expirou sem assinatura em 72 h.'],
    ['Matéria: couro sustentável', 'adv-nobre', 'as-materia', 'rejected', '2026-10-01', '2026-10-20', 3_600, false, undefined, 'Tema já contratado por outro expositor no mesmo período.'],
    ['Pré-feira internacional', 'adv-horizonte', 'as-email', 'cancelled', '2026-09-20', '2026-09-30', 6_000, true, undefined, 'Cancelada a pedido do anunciante.'],
    ['Lançamento masculino outono', 'adv-forma', 'as-supertopo', 'active', '2026-10-08', '2026-11-08', 22_500, false, { impressions: 198_000, clicks: 3_960, leads: 121, delivered: 39 }],
    ['Agenda de compradores latinos', 'adv-sul', 'as-rodada', 'submitted', '2026-10-01', '2026-10-17', 2_400, false],
    ['Push — happy hour no estande', 'adv-norte', 'as-push', 'draft', '2026-10-15', '2026-10-15', 1_800, false],
    ['Cintos artesanais — vitrine', 'adv-lume', 'as-vitrine', 'approved', '2026-10-01', '2026-10-31', 0, true],
  ];
  return rows.map(([name, advertiserId, assetId, status, startDate, endDate, budget, byAdmin, metrics, reason], index) => {
    const asset = byId(ASSETS, assetId);
    const channelIds = asset?.channelIds ?? [];
    const audienceIds = asset?.audienceIds.slice(0, 2) ?? [];
    const id = `cmp-${2041 - index * 3}`;
    const created = `2026-09-${String(28 - (index % 20)).padStart(2, '0')}`;
    // Pausada: a pausa cai no dia em que a entrega bate o percentual entregue (o Analytics para nela).
    const totalDays = Math.round((Date.parse(endDate) - Date.parse(startDate)) / 86_400_000) + 1;
    const pausedOn =
      status === 'paused' && metrics
        ? new Date(Date.parse(startDate) + (Math.round((totalDays * metrics.delivered) / 100) - 1) * 86_400_000)
            .toISOString()
            .slice(0, 10)
        : undefined;
    const { history, reasonAt, reasonWho, expiresAt } = seedTimeline({
      index,
      status,
      created,
      pausedOn,
      creator: byAdmin ? COMMERCIAL : (byId(ADVERTISERS, advertiserId)?.name ?? ''),
      advertiser: byId(ADVERTISERS, advertiserId)?.name ?? '',
      reason,
    });
    return {
      id,
      status,
      createdByAdmin: byAdmin,
      createdAt: created,
      draft: {
        name,
        advertiserId,
        startDate,
        endDate,
        selectionKind: 'asset',
        category: asset?.category ?? '',
        assetId,
        packageId: '',
        pricingModel: asset?.pricing ?? '',
        // Mesmo formato que o campo grava (A-20: valor exato com 2 casas), também na edição.
        budget: budget
          ? budget.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : '',
        channelIds,
        channelAlloc: equalSplit(channelIds),
        audienceIds,
        audienceAlloc: equalSplit(audienceIds),
        formValues: {},
        submitNow: status !== 'draft',
      },
      metrics,
      reason: reason ? { text: reason, at: reasonAt, who: reasonWho } : undefined,
      pi: ['awaiting_pi_signature', 'approved', 'active', 'paused', 'completed', 'pi_rejected'].includes(status)
        ? {
            code: `P.I. 2026-0${400 + index}`,
            status:
              status === 'awaiting_pi_signature'
                ? 'Enviado'
                : status === 'pi_rejected'
                  ? 'Cancelado'
                  : status === 'completed'
                    ? 'Concluído'
                    : status === 'paused'
                      ? 'Pausado'
                      : status === 'active'
                        ? 'Ativo'
                        : 'Assinado',
            expiresAt,
          }
        : undefined,
      history,
    };
  });
}

const COMMERCIAL = 'Marina Lopes';
const pad = (value: number) => String(value).padStart(2, '0');
/** Data local sem fuso ("2026-09-26T14:05:00"), como o resto dos dados de exemplo. */
const localIso = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
/** Soma horas e cai no horário comercial (9h–18h): decisões de pessoas não acontecem de madrugada. */
function later(from: Date, hours: number) {
  const next = new Date(from.getTime() + hours * 3600_000);
  if (next.getHours() < 9) next.setHours(9);
  if (next.getHours() >= 18) {
    next.setDate(next.getDate() + 1);
    next.setHours(9 + (next.getMinutes() % 3));
  }
  return next;
}

/**
 * Trilha de auditoria coerente com o status de cada campanha de exemplo: quem enviou, quem decidiu e quando.
 * O motivo exibido no detalhe e na lista usa a mesma data e o mesmo autor da entrada de decisão.
 */
function seedTimeline({
  index,
  status,
  created,
  creator,
  advertiser,
  reason,
  pausedOn,
}: {
  index: number;
  status: CampaignStatus;
  created: string;
  pausedOn?: string;
  creator: string;
  advertiser: string;
  reason?: string;
}) {
  const entries: HistoryEntry[] = [];
  const push = (at: Date, who: string, text: string, kind: HistoryEntry['kind']) => entries.unshift({ at: localIso(at), who, text, kind });
  const start = new Date(`${created}T10:12:00`);
  push(start, creator, 'Campanha criada', 'create');
  let reasonAt = '';
  let reasonWho = COMMERCIAL;
  let expiresAt: string | undefined;
  if (status === 'draft') return { history: entries, reasonAt, reasonWho, expiresAt };

  const sent = later(start, 2 + (index % 3));
  push(sent, creator, 'Enviada para aprovação', 'status');
  // O P.I. em aberto conta 72 h a partir da aprovação, ancorada em "ontem, 9h40" de quem abre a página:
  // o prazo nunca vence nos dados de exemplo e servidor e navegador concordam (só a data entra na conta).
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(9, 40, 0, 0);
  const decided = status === 'awaiting_pi_signature' ? yesterday : later(sent, 18 + ((index * 7) % 30));
  const decision = (text: string) => {
    push(decided, COMMERCIAL, reason ? `${text} · ${reason}` : text, 'status');
    reasonAt = localIso(decided);
  };

  if (status === 'submitted') return { history: entries, reasonAt, reasonWho, expiresAt };
  if (status === 'adjustments_requested') decision(STATUS_DONE.adjustments_requested);
  else if (status === 'rejected') decision(STATUS_DONE.rejected);
  else if (status === 'cancelled') decision(STATUS_DONE.cancelled);
  else {
    push(decided, COMMERCIAL, STATUS_DONE.awaiting_pi_signature, 'pi');
    if (status === 'awaiting_pi_signature') {
      expiresAt = localIso(new Date(decided.getTime() + 72 * 3600_000));
    } else if (status === 'pi_rejected') {
      // Expiração automática: quem registra é o sistema, exatamente 72 h depois da aprovação.
      const expired = new Date(decided.getTime() + 72 * 3600_000);
      push(expired, 'Sistema', reason ? `${STATUS_DONE.pi_rejected} · ${reason}` : STATUS_DONE.pi_rejected, 'pi');
      reasonAt = localIso(expired);
      reasonWho = 'Sistema';
    } else {
      const signed = later(decided, 4 + (index % 4));
      push(signed, advertiser, STATUS_DONE.approved, 'pi');
      if (status !== 'approved') {
        const live = later(signed, 3);
        push(live, COMMERCIAL, STATUS_DONE.active, 'status');
        if (status === 'paused')
          push(pausedOn ? new Date(`${pausedOn}T16:20:00`) : later(live, 26), COMMERCIAL, STATUS_DONE.paused, 'status');
        if (status === 'completed') push(later(live, 30), 'Sistema', STATUS_DONE.completed, 'status');
      }
    }
  }
  return { history: entries, reasonAt, reasonWho, expiresAt };
}

/** Situação do P.I. que acompanha cada transição depois que ele existe. */
const PI_SYNC: Partial<Record<CampaignStatus, string>> = {
  pi_rejected: 'Cancelado',
  paused: 'Pausado',
  active: 'Ativo',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

let state: State = { campaigns: seed(), persona: 'operador' };
const listeners = new Set<() => void>();
function emit(next: State) {
  state = next;
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
const getState = () => state;

export function useStore() {
  return useSyncExternalStore(subscribe, getState, getState);
}

export const store = {
  setPersona(persona: Persona) {
    emit({ ...state, persona });
  },
  get(id: string) {
    return state.campaigns.find((campaign) => campaign.id === id);
  },
  save(draft: CampaignDraft, options: { id?: string; persona: Persona }) {
    const status: CampaignStatus = draft.submitNow ? 'submitted' : 'draft';
    const now = new Date().toISOString();
    if (options.id) {
      emit({
        ...state,
        campaigns: state.campaigns.map((campaign) =>
          campaign.id === options.id
            ? {
                ...campaign,
                draft,
                status,
                reason: undefined,
                history: [
                  {
                    at: now,
                    who: 'Você',
                    // "Reenviada" só quando volta de ajustes; um rascunho nunca enviado é "Enviada".
                    text: draft.submitNow
                      ? campaign.status === 'adjustments_requested'
                        ? 'Reenviada para aprovação'
                        : 'Enviada para aprovação'
                      : 'Rascunho atualizado',
                    kind: 'edit',
                  },
                  ...campaign.history,
                ],
              }
            : campaign,
        ),
      });
      return options.id;
    }
    const id = `cmp-${3000 + state.campaigns.length}`;
    const campaign: Campaign = {
      id,
      status,
      createdByAdmin: options.persona === 'operador',
      createdAt: now.slice(0, 10),
      draft,
      history: [
        { at: now, who: 'Você', text: draft.submitNow ? 'Campanha criada e enviada para aprovação' : 'Rascunho criado', kind: 'create' },
      ],
    };
    emit({ ...state, campaigns: [campaign, ...state.campaigns] });
    return id;
  },
  transition(id: string, to: CampaignStatus, reason?: string, who?: string) {
    const now = new Date().toISOString();
    const author = who ?? 'Você';
    emit({
      ...state,
      campaigns: state.campaigns.map((campaign) => {
        if (campaign.id !== id) return campaign;
        const done = to === 'active' && campaign.status === 'paused' ? 'Veiculação retomada' : STATUS_DONE[to];
        const synced = PI_SYNC[to];
        return {
          ...campaign,
          status: to,
          reason: reason ? { text: reason, at: now, who: author } : campaign.reason,
          pi:
            to === 'awaiting_pi_signature'
              ? { code: `P.I. 2026-0${500 + state.campaigns.length}`, status: 'Enviado', expiresAt: new Date(Date.now() + 72 * 3600_000).toISOString() }
              : to === 'approved' && campaign.pi
                ? { ...campaign.pi, status: 'Assinado', expiresAt: undefined }
                : synced && campaign.pi
                  ? { ...campaign.pi, status: synced }
                  : campaign.pi,
          history: [{ at: now, who: author, text: reason ? `${done} · ${reason}` : done, kind: 'status' }, ...campaign.history],
        };
      }),
    });
  },
  /** Volta a campanha exatamente ao retrato anterior (status, P.I., motivo e histórico): o "Desfazer" não inventa auditoria. */
  restore(snapshot: Campaign) {
    emit({ ...state, campaigns: state.campaigns.map((campaign) => (campaign.id === snapshot.id ? snapshot : campaign)) });
  },
  remove(id: string) {
    emit({ ...state, campaigns: state.campaigns.filter((campaign) => campaign.id !== id) });
  },
};

export function assetsOf(draft: CampaignDraft) {
  if (draft.selectionKind === 'package') {
    const pack = byId(PACKAGES, draft.packageId);
    return (pack?.assetIds ?? []).map((id) => byId(ASSETS, id)).filter((asset) => asset !== undefined);
  }
  const asset = byId(ASSETS, draft.assetId);
  return asset ? [asset] : [];
}
/** Ativo que governa preço, canais, públicos e briefing (no pacote, o primeiro). */
export function mainAsset(draft: CampaignDraft) {
  return assetsOf(draft)[0];
}
