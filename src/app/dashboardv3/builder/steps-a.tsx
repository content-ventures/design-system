'use client';

import {
  BellRing,
  Handshake,
  Image as ImageIcon,
  Lock,
  Mail,
  MonitorSmartphone,
  Newspaper,
  PanelTop,
  Presentation,
  ShieldAlert,
  Tv,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import {
  Badge,
  BrandMark,
  DateRangePicker,
  Field,
  Input,
  Segmented,
  VisuallyHidden,
} from '@/components/ds-v3';
import { Select } from '@/components/ds-v3/select';
import { Slider } from '@/components/ds-v3/slider';
import {
  ADVERTISERS,
  ASSETS,
  AUDIENCES,
  CATEGORIES,
  CHANNELS,
  EXCLUSIVITY,
  PACKAGES,
  PRICING,
  SELF_ADVERTISER_ID,
  STATUS,
  byId,
  type Asset,
  type CampaignStatus,
  type Category,
  type PricingModel,
} from '../domain';
import { bucketOf } from '../campaigns/buckets';
import {
  bonusConditionText,
  bonusState,
  brl,
  budgetBounds,
  dateBR,
  dateShort,
  estimateUnits,
  int,
  parseMoney,
  snapBudget,
  unitsLabel,
} from '../pricing';
import { mainAsset, useStore, type Campaign, type CampaignDraft } from '../store';
import { days } from './summary';
import { ErrorText, Group, Section, onRadioKeys, rovingTab, type StepProps } from './ui';
import { effectiveModel } from './validation';
import b from './builder.module.css';
import p from './parts.module.css';

export const categoryIcon: Record<Category, LucideIcon> = {
  midia_online: MonitorSmartphone,
  conteudo_organico: Newspaper,
  midia_offline: Presentation,
  prospeccao_ativa: Handshake,
};
export const previewIcon: Record<Asset['preview'], LucideIcon> = {
  banner: PanelTop,
  email: Mail,
  push: BellRing,
  post: ImageIcon,
  led: Tv,
  list: Users,
};

export function unitPrice(asset: Asset) {
  if (!asset.basePrice) return 'Sem cobrança';
  return `${brl(asset.basePrice)} / ${PRICING[asset.pricing].unit}`;
}

const money = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

/** Período curto (dd/MM – dd/MM) que nunca quebra no meio. */
export function ShortRange({ start, end }: { start: string; end: string }) {
  return <span className={p.nowrap}>{`${dateShort(start)} – ${dateShort(end)}`}</span>;
}

/* ——— 1. Identificação ——— */
/** Contratado = P.I. assinado: aprovada, no ar, pausada ou concluída. Em análise, rejeitada e cancelada não contam. */
const CONTRACTED: CampaignStatus[] = ['approved', 'active', 'paused', 'completed'];
/**
 * Números de um anunciante no portal: campanhas, em veiculação, verba contratada e a mais recente.
 * A campanha em edição (`excludeId`) não entra no próprio histórico.
 */
function advertiserStats(campaigns: Campaign[], advertiserId: string, excludeId?: string) {
  const own = campaigns.filter(
    (campaign) => campaign.draft.advertiserId === advertiserId && campaign.id !== excludeId,
  );
  /* Mesmo recorte da lista: aprovada, veiculando ou pausada. */
  const live = own.filter((campaign) => bucketOf(campaign.status) === 'veiculacao').length;
  const invested = own
    .filter((campaign) => CONTRACTED.includes(campaign.status))
    .reduce((total, campaign) => total + (parseMoney(campaign.draft.budget) || 0), 0);
  const byStart = [...own].sort((a, b2) =>
    (b2.draft.startDate || '').localeCompare(a.draft.startDate || ''),
  );
  return { own, live, invested, byStart };
}

/** O que a campanha contratou: o pacote ou os ativos. */
function campaignAssets(campaign: Campaign) {
  const { draft } = campaign;
  if (draft.selectionKind === 'package') {
    const name = byId(PACKAGES, draft.packageId)?.name ?? '';
    return name && !/^pacote\b/i.test(name) ? `Pacote ${name}` : name;
  }
  return byId(ASSETS, draft.assetId)?.name ?? '';
}

function AdvertiserPanel({
  advertiserId,
  onPick,
  onClear,
  fixed,
  excludeId,
}: {
  advertiserId: string;
  onPick: (id: string) => void;
  onClear: () => void;
  fixed: boolean;
  excludeId?: string;
}) {
  const { campaigns } = useStore();
  const advertiser = byId(ADVERTISERS, advertiserId);
  const rootRef = useRef<HTMLDivElement>(null);
  const shown = useRef(advertiserId);
  // O botão clicado (linha do ranking ou "Trocar") some com a troca de estado: o foco vai para o
  // controle equivalente do novo estado, nunca para o <body>. Só reage a uma troca de verdade.
  useEffect(() => {
    if (shown.current === advertiserId) return;
    shown.current = advertiserId;
    const root = rootRef.current;
    if (!root || (!root.contains(document.activeElement) && document.activeElement !== document.body)) return;
    const target = advertiserId
      ? root.querySelector<HTMLElement>('[data-swap]')
      : root.querySelector<HTMLElement>('[data-rank-row]');
    target?.focus({ preventScroll: true });
  }, [advertiserId]);
  if (!advertiser) {
    const ranked = ADVERTISERS.map((item) => ({
      item,
      ...advertiserStats(campaigns, item.id, excludeId),
    })).sort((a, b2) => b2.own.length - a.own.length);
    return (
      <div className={p.rank} ref={rootRef}>
        <div className={p.rankHead} aria-hidden="true">
          <span>Anunciante</span>
          <span>Campanhas</span>
          <span>Em veiculação</span>
          <span>Verba contratada</span>
          <span>Última campanha</span>
        </div>
        {ranked.map(({ item, own, live, invested, byStart }, index) => {
          const latest = byStart[0];
          const count = own.length;
          const lastText = latest
            ? `, última campanha ${STATUS[latest.status].label}${latest.draft.startDate ? ` de ${dateShort(latest.draft.startDate)} a ${dateShort(latest.draft.endDate)}` : ''}`
            : '';
          return (
            <button
              key={item.id}
              type="button"
              className={p.rankRow}
              data-rank-row={index === 0 || undefined}
              onClick={() => onPick(item.id)}
              aria-label={`${item.name}, ${item.segment}: ${count} ${count === 1 ? 'campanha' : 'campanhas'}, ${live} em veiculação, verba contratada ${invested ? brl(invested) : 'nenhuma'}${lastText}`}
            >
              <span className={p.rankName}>
                <BrandMark name={item.name} size="xs" variant="soft" decorative />
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.segment}</small>
                </span>
              </span>
              <span className={p.rankNum}>{count}</span>
              <span className={p.rankNum}>{live}</span>
              <span className={p.rankNum}>{invested ? brl(invested) : '—'}</span>
              <span className={p.rankLast}>
                {latest ? (
                  <>
                    <Badge variant="text" tone={STATUS[latest.status].tone}>
                      {STATUS[latest.status].label}
                    </Badge>
                    <small>
                      {latest.draft.startDate ? (
                        <ShortRange start={latest.draft.startDate} end={latest.draft.endDate} />
                      ) : (
                        'Sem período'
                      )}
                    </small>
                  </>
                ) : (
                  '—'
                )}
              </span>
            </button>
          );
        })}
      </div>
    );
  }
  const { own, live, invested, byStart } = advertiserStats(campaigns, advertiser.id, excludeId);
  const recent = byStart.slice(0, 6);
  const rules = EXCLUSIVITY.filter(
    (rule) => rule.blocked.includes(advertiser.id) || rule.holder === advertiser.id,
  );
  return (
    <div className={p.advertiser} ref={rootRef}>
      <div className={p.advertiserHead}>
        <BrandMark name={advertiser.name} size="md" decorative />
        <div>
          <strong>{advertiser.name}</strong>
          <span>
            CNPJ {advertiser.cnpj} · {advertiser.segment}
          </span>
        </div>
        {!fixed && (
          <button
            type="button"
            className={p.linkButton}
            data-swap
            onClick={onClear}
            aria-label="Trocar anunciante"
          >
            Trocar
          </button>
        )}
      </div>
      <dl className={p.strip}>
        <div>
          <dt>Campanhas no portal</dt>
          <dd>{own.length}</dd>
        </div>
        <div>
          <dt>Em veiculação</dt>
          <dd>{live}</dd>
        </div>
        <div>
          <dt>Verba contratada</dt>
          <dd>{invested ? brl(invested) : '—'}</dd>
        </div>
      </dl>
      {recent.length > 0 && (
        <ul className={p.recent} aria-label="Campanhas recentes deste anunciante">
          {recent.map((campaign) => (
            <li key={campaign.id}>
              <span className={p.recentName}>{campaign.draft.name}</span>
              <span className={p.recentAsset}>{campaignAssets(campaign) || '—'}</span>
              <Badge variant="text" size="sm" tone={STATUS[campaign.status].tone}>
                {STATUS[campaign.status].label}
              </Badge>
              <span className={p.recentMeta}>
                {campaign.draft.startDate ? (
                  <ShortRange start={campaign.draft.startDate} end={campaign.draft.endDate} />
                ) : (
                  '—'
                )}
              </span>
              <span className={p.recentMeta}>
                {parseMoney(campaign.draft.budget) > 0
                  ? brl(parseMoney(campaign.draft.budget))
                  : '—'}
              </span>
            </li>
          ))}
        </ul>
      )}
      {rules.map((rule) => (
        <p key={rule.contract} className={p.exclusive}>
          <ShieldAlert aria-hidden="true" />
          {rule.holder === advertiser.id
            ? `Tem exclusividade na categoria “${rule.categoryLabel}” de ${dateBR(rule.start)} a ${dateBR(rule.end)} (${rule.contract}).`
            : `Um concorrente tem exclusividade na categoria “${rule.categoryLabel}” de ${dateBR(rule.start)} a ${dateBR(rule.end)}. Campanhas de ${CATEGORIES.find((item) => item.value === rule.category)?.label ?? ''} nesse período serão bloqueadas.`}
        </p>
      ))}
    </div>
  );
}

export function StepIdentification({ draft, update, errors, persona, campaignId }: StepProps) {
  const self = byId(ADVERTISERS, SELF_ADVERTISER_ID);
  return (
    <>
      <Section n="01" id="sec-identificacao" title="Identificação">
        <div className={b.grid2}>
          <Field
            label="Nome da campanha"
            required
            error={errors.name}
            meta={draft.name.length >= 96 ? `${draft.name.length}/120` : undefined}
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                maxLength={120}
                placeholder="Ex.: Lançamento coleção verão"
                value={draft.name}
                onChange={(event) => update({ name: event.target.value })}
              />
            )}
          </Field>
          {persona === 'operador' ? (
            <Field label="Anunciante" required error={errors.advertiserId}>
              {({ id, describedBy, invalid }) => (
                <Select
                  id={id}
                  describedBy={describedBy}
                  invalid={invalid}
                  searchable
                  placeholder="Selecione o anunciante"
                  value={draft.advertiserId}
                  onChange={(advertiserId) => update({ advertiserId })}
                  options={ADVERTISERS.map((advertiser) => ({
                    value: advertiser.id,
                    label: advertiser.name,
                    description: `CNPJ ${advertiser.cnpj} · ${advertiser.segment}`,
                    leading: <BrandMark name={advertiser.name} size="sm" decorative />,
                  }))}
                />
              )}
            </Field>
          ) : (
            <div className={p.fieldLike}>
              <span className={p.label}>Anunciante</span>
              <div className={p.fixedAdvertiser}>
                <BrandMark name={self?.name ?? ''} size="xs" variant="soft" decorative />
                {self?.name}
                <Lock aria-label="Não editável" />
              </div>
            </div>
          )}
        </div>
        <Group label={draft.advertiserId ? 'Histórico no portal' : 'Anunciantes do portal'}>
          <AdvertiserPanel
            advertiserId={draft.advertiserId}
            excludeId={campaignId}
            fixed={persona === 'anunciante'}
            onPick={(advertiserId) => update({ advertiserId })}
            onClear={() => update({ advertiserId: '' })}
          />
        </Group>
      </Section>
    </>
  );
}

/* ——— 2. Ativo ——— */
/** Corpo comum dos cartões de ativo: descrição em até duas linhas, modelo e preço, janela. */
function AssetCardBody({ asset }: { asset: Asset }) {
  return (
    <>
      <span className={p.assetDesc}>{asset.description}</span>
      <span className={p.assetMeta}>
        <b>{PRICING[asset.pricing].label}</b>
        <span>{unitPrice(asset)}</span>
        <span>
          <ShortRange start={asset.window.start} end={asset.window.end} />
        </span>
      </span>
    </>
  );
}

/** O que o ativo que governa a campanha traz para as próximas etapas. */
function AssetFacts({ asset }: { asset: Asset }) {
  const channels = asset.channelIds.map((id) => byId(CHANNELS, id)?.name).join(', ') || '—';
  const audiences = asset.audienceIds.map((id) => byId(AUDIENCES, id)?.name).join(', ') || '—';
  const extras = `${asset.fields.length} ${asset.fields.length === 1 ? 'campo' : 'campos'} · ${asset.bonuses.length} bônus`;
  return (
    <dl className={p.strip} data-cols="3" data-compact aria-label="Detalhes do ativo escolhido">
      <div>
        <dt>Canais</dt>
        <dd title={channels}>{channels}</dd>
      </div>
      <div>
        <dt>Públicos</dt>
        <dd title={audiences}>{audiences}</dd>
      </div>
      <div>
        <dt>Briefing e bônus</dt>
        <dd title={extras}>{extras}</dd>
      </div>
    </dl>
  );
}

export function StepAsset({ draft, update, errors }: StepProps) {
  const catId = useId();
  const assetGroup = useId();
  const packGroup = useId();
  const visibleAssets = ASSETS.filter(
    (asset) => !draft.category || asset.category === draft.category,
  );
  const asset = mainAsset(draft);
  const pack = byId(PACKAGES, draft.packageId);
  const reset = {
    budget: '',
    channelIds: [],
    channelAlloc: {},
    audienceIds: [],
    audienceAlloc: {},
    formValues: {},
  };
  const period =
    draft.startDate && draft.endDate && draft.endDate >= draft.startDate
      ? days(draft.startDate, draft.endDate)
      : 0;
  // Datas herdadas de outra escolha (ativo, pacote, categoria) podem ter ficado fora da nova janela.
  const outside = Boolean(
    asset &&
      ((draft.startDate && draft.startDate < asset.window.start) ||
        (draft.endDate && draft.endDate > asset.window.end)),
  );
  return (
    <>
      <Section
        n="02"
        id="sec-ativo"
        title="Ativo"
        actions={
          <Segmented<'asset' | 'package'>
            size="sm"
            label="Tipo de contratação"
            value={draft.selectionKind}
            onChange={(kind) =>
              update(
                kind === 'asset'
                  ? { selectionKind: 'asset', packageId: '', pricingModel: '', ...reset }
                  : {
                      selectionKind: 'package',
                      assetId: '',
                      category: '',
                      pricingModel: '',
                      ...reset,
                    },
              )
            }
            options={[
              { value: 'asset', label: 'Ativo' },
              { value: 'package', label: 'Pacote' },
            ]}
          />
        }
      >
        {draft.selectionKind === 'asset' ? (
          <>
            <Group label="Categoria" required labelId={catId}>
              <div
                className={p.pills}
                role="group"
                aria-labelledby={catId}
                aria-invalid={Boolean(errors.category) || undefined}
              >
                {CATEGORIES.map((category) => {
                  const Icon = categoryIcon[category.value];
                  const count = ASSETS.filter((item) => item.category === category.value).length;
                  return (
                    <button
                      key={category.value}
                      type="button"
                      className={p.pill}
                      aria-pressed={draft.category === category.value}
                      title={category.hint}
                      onClick={() =>
                        update({
                          category: draft.category === category.value ? '' : category.value,
                          assetId:
                            draft.category === category.value ||
                            (asset && asset.category !== category.value)
                              ? ''
                              : draft.assetId,
                        })
                      }
                    >
                      <Icon aria-hidden="true" />
                      {category.label}
                      <span>{count}</span>
                    </button>
                  );
                })}
              </div>
              <ErrorText>{errors.category}</ErrorText>
            </Group>
            <Group
              label="Ativo"
              required
              labelId={assetGroup}
              meta={`${visibleAssets.length} ${visibleAssets.length === 1 ? 'disponível' : 'disponíveis'}`}
            >
              {visibleAssets.length === 0 ? (
                <div className={p.empty}>Nenhum ativo nesta categoria.</div>
              ) : (
                <div
                  className={p.assets}
                  role="radiogroup"
                  aria-labelledby={assetGroup}
                  aria-invalid={Boolean(errors.assetId) || undefined}
                  onKeyDown={onRadioKeys}
                >
                  {visibleAssets.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={draft.assetId === item.id}
                      tabIndex={rovingTab(
                        draft.assetId === item.id,
                        index,
                        visibleAssets.some((entry) => entry.id === draft.assetId),
                      )}
                      className={p.asset}
                      title={item.description}
                      onClick={() =>
                        update({
                          assetId: item.id,
                          category: item.category,
                          pricingModel: item.pricing,
                          ...reset,
                        })
                      }
                    >
                      <span className={p.assetTop}>
                        <strong>{item.name}</strong>
                        <span className={p.radio} aria-hidden="true" />
                      </span>
                      <AssetCardBody asset={item} />
                    </button>
                  ))}
                </div>
              )}
              <ErrorText>{errors.assetId}</ErrorText>
              {asset && <AssetFacts asset={asset} />}
            </Group>
          </>
        ) : (
          <>
            <Group label="Pacote" required labelId={packGroup}>
              <div
                className={p.assets}
                data-row
                role="radiogroup"
                aria-labelledby={packGroup}
                aria-invalid={Boolean(errors.packageId) || undefined}
                onKeyDown={onRadioKeys}
              >
                {PACKAGES.map((item, index) => {
                  const members = item.assetIds.flatMap((id) => byId(ASSETS, id) ?? []);
                  const checked = draft.packageId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      tabIndex={rovingTab(checked, index, Boolean(pack))}
                      className={p.asset}
                      title={item.description}
                      onClick={() => {
                        const first = byId(ASSETS, item.assetIds[0] ?? '');
                        update({
                          packageId: item.id,
                          category: first?.category ?? '',
                          pricingModel: '',
                          ...reset,
                        });
                      }}
                    >
                      <span className={p.assetTop}>
                        <strong>{item.name}</strong>
                        <span className={p.radio} aria-hidden="true" />
                      </span>
                      <span className={p.assetDesc} data-lines="1">
                        {item.description}
                      </span>
                      {/* O que vem no pacote, com a janela de cada ativo: é o que decide a escolha. */}
                      {members.length > 0 ? (
                        <span className={p.packList}>
                          {members.map((member, at) => (
                            <span key={member.id}>
                              <span>
                                {member.name}
                                {at === 0 && <small> · principal</small>}
                              </span>
                              <ShortRange start={member.window.start} end={member.window.end} />
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className={p.packList} data-empty>
                          <span>Em montagem: nenhum ativo vinculado.</span>
                        </span>
                      )}
                      <span className={p.packPrice}>
                        {item.totalPrice ? (
                          <>
                            <b>{brl(item.totalPrice)}</b> preço fechado
                          </>
                        ) : (
                          'Sem preço fechado'
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
              <ErrorText>{errors.packageId}</ErrorText>
              {/* Canais, públicos e briefing vêm do ativo principal do pacote. */}
              {pack && asset && <AssetFacts asset={asset} />}
            </Group>
            {pack && pack.assetIds.length === 0 && !errors.packageId && (
              <p className={p.inlineNote}>
                Este pacote ainda não tem ativos. Escolha outro ou fale com o comercial do portal.
              </p>
            )}
          </>
        )}
        <Group
          label="Período de veiculação"
          meta={period > 0 ? `${period} ${period === 1 ? 'dia' : 'dias'}` : undefined}
        >
          <div className={b.grid3}>
            <PeriodField draft={draft} update={update} errors={errors} outside={outside} />
          </div>
          {draft.selectionKind === 'package' && pack && pack.assetIds.length > 1 && period > 0 && (
            <PackageCoverage
              assets={pack.assetIds.flatMap((id) => byId(ASSETS, id) ?? [])}
              start={draft.startDate}
              end={draft.endDate}
            />
          )}
        </Group>
      </Section>
    </>
  );
}

/**
 * Período de veiculação: "Início" e "Término" como duas caixas da grade (duas colunas), com um
 * calendário de período só. Os dias escolhíveis são a janela do ativo, e "Janela inteira" preenche
 * as duas pontas. Abaixo fica a janela como dica; ela vira aviso âmbar quando datas herdadas de
 * outra escolha (ativo, pacote, categoria) caem fora dela. O erro marca a ponta vazia e é dito uma
 * vez só. A duração fica no cabeçalho do grupo.
 */
function PeriodField({
  draft,
  update,
  errors,
  outside,
}: Pick<StepProps, 'draft' | 'update' | 'errors'> & { outside: boolean }) {
  const noteId = useId();
  const span = mainAsset(draft)?.window;
  const messages = [...new Set([errors.startDate, errors.endDate])].filter(
    (message): message is string => Boolean(message),
  );
  const errorId = (message?: string) =>
    message ? `${noteId}-e${messages.indexOf(message)}` : undefined;
  const showNote = Boolean(span) && (outside || messages.length === 0);
  const describe = (message?: string) => errorId(message) ?? (showNote ? noteId : undefined);
  return (
    <div className={p.period}>
      <DateRangePicker
        labels
        required
        aria-label="Período de veiculação"
        start={draft.startDate}
        end={draft.endDate}
        onChange={({ start, end }) => update({ startDate: start, endDate: end })}
        min={span?.start}
        max={span?.end}
        window={span ? { start: span.start, end: span.end } : undefined}
        presets={span ? [{ label: 'Janela inteira', start: span.start, end: span.end }] : undefined}
        invalid={{ start: Boolean(errors.startDate), end: Boolean(errors.endDate) }}
        describedBy={{ start: describe(errors.startDate), end: describe(errors.endDate) }}
      />
      {messages.length > 0 && (
        // Cada erro fica sob a própria caixa (A-58); o mesmo erro nas duas ocupa a linha inteira.
        <div className={p.periodErrors}>
          {messages.map((message, index) => {
            const both = errors.startDate === message && errors.endDate === message;
            return (
              <div
                key={message}
                style={{ gridColumn: both ? '1 / -1' : errors.startDate === message ? 1 : 2 }}
              >
                <ErrorText id={`${noteId}-e${index}`}>{message}</ErrorText>
              </div>
            );
          })}
        </div>
      )}
      {showNote && span && (
        <p id={noteId} className={p.periodNote} data-state={outside ? 'out' : undefined}>
          {/* O espaço final separa as palavras na descrição lida pelo leitor de tela. */}
          {outside ? 'Fora da janela do ativo ' : 'Janela do ativo '}
          <ShortRange start={span.start} end={span.end} />{' '}
          {outside && (
            <button
              type="button"
              className={p.linkButton}
              onClick={() => update({ startDate: span.start, endDate: span.end })}
            >
              Usar a janela inteira
            </button>
          )}
        </p>
      )}
    </div>
  );
}

/**
 * No pacote, as datas seguem a janela do ativo principal; os outros ativos podem ter janelas
 * menores. Cada linha mostra quantos dias do período caem dentro da janela do ativo.
 */
function PackageCoverage({ assets, start, end }: { assets: Asset[]; start: string; end: string }) {
  const total = days(start, end);
  return (
    <div className={p.coverage}>
      <div className={p.coverHead} aria-hidden="true">
        <span>Ativo do pacote</span>
        <span>Dias do período dentro da janela do ativo</span>
      </div>
      <ul aria-label="Dias do período dentro da janela de cada ativo">
        {assets.map((item) => {
          const from = start > item.window.start ? start : item.window.start;
          const to = end < item.window.end ? end : item.window.end;
          const inside = to >= from ? days(from, to) : 0;
          const partial = inside < total;
          return (
            <li key={item.id} data-partial={partial || undefined}>
              <span className={p.coverName}>{item.name}</span>
              <span className={p.coverBar} aria-hidden="true">
                <i style={{ width: `${total ? (inside / total) * 100 : 0}%` }} />
              </span>
              <span className={p.coverDays}>
                {inside} de {total} {total === 1 ? 'dia' : 'dias'}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ——— 3. Precificação ——— */
/** Mesmo sinal da lateral: ponto verde liberado, azul incluído, anel vazio bloqueado. */
const BONUS_LABEL = {
  liberado: 'Liberado',
  bloqueado: 'Bloqueado',
  incluido: 'Incluído',
} as const;

/**
 * Projeção da entrega, como rodapé do bloco da verba: ritmo por dia, o bônus de entrega e o custo
 * efetivo. Nada aqui repete o bloco: sem bônus liberado, "Com bônus" mostra o próximo a liberar e
 * "Custo efetivo" diz que é o próprio preço. As três células ficam sempre montadas, com a mesma
 * altura, para a barra não fazer o layout pular ao cruzar um limite.
 */
function Projection({
  asset,
  budget,
  start,
  end,
  campaignCount,
}: {
  asset: Asset;
  budget: number;
  start: string;
  end: string;
  campaignCount: number;
}) {
  const units = estimateUnits(asset, budget);
  const span = days(start, end);
  const blocked = (rule: Asset['bonuses'][number]) =>
    bonusState(rule, asset, budget, campaignCount, asset.pricing) === 'bloqueado';
  const percentOf = (rule: Asset['bonuses'][number]) =>
    Number(/(\d+)%/.exec(`${rule.name} ${rule.description}`)?.[1] ?? 0);
  const percent = (reward: string) =>
    asset.bonuses
      .filter((rule) => rule.reward === reward && !blocked(rule))
      .reduce((total, rule) => total + percentOf(rule), 0);
  const extra = percent('Impressões extras');
  const discount = percent('Desconto (%)');
  const total = units * (1 + extra / 100);
  const perUnit = asset.pricing === 'cpm' ? 1000 : 1;
  const effective = total > 0 ? ((budget * (1 - discount / 100)) / total) * perUnit : 0;
  const unit = PRICING[asset.pricing].unit;
  // Próximo bônus de entrega a liberar: o que a verba ainda pode destravar.
  const nextRule = asset.bonuses.find(
    (rule) => rule.reward === 'Impressões extras' && blocked(rule),
  );
  const nextCondition = nextRule?.conditions.find((condition) => condition.field === 'budget');
  const nextText = nextRule
    ? nextCondition
      ? `+${percentOf(nextRule)}% a partir de ${brl(nextCondition.value)}`
      : `+${percentOf(nextRule)}% · ${bonusConditionText(nextRule)}`
    : 'nenhum bônus de entrega';
  const perDay = units && span ? units / span : 0;
  const daysLabel = `${span} ${span === 1 ? 'dia' : 'dias'}`;
  return (
    <dl className={`${p.strip} ${p.budgetStrip}`} data-cols="3" aria-label="Projeção da entrega">
      <div>
        <dt>Por dia</dt>
        <dd>
          {!perDay
            ? '—'
            : perDay < 1
              ? `1 a cada ${Math.round(span / units)} dias`
              : `≈ ${int(perDay)}`}
        </dd>
        <small>
          {!span
            ? 'defina o período'
            : perDay && perDay < 1
              ? `${unit} · ${daysLabel}`
              : `${unitsLabel(asset)} por dia · ${daysLabel}`}
        </small>
      </div>
      <div>
        <dt>Com bônus</dt>
        <dd>{units && extra > 0 ? `≈ ${int(total)}` : '—'}</dd>
        <small>{units && extra > 0 ? `+${extra}% liberado` : nextText}</small>
      </div>
      <div>
        <dt>Custo efetivo</dt>
        <dd>{effective && (discount > 0 || extra > 0) ? brl(effective) : '—'}</dd>
        <small>
          {effective && !discount && !extra
            ? 'igual ao preço do ativo'
            : `por ${unit}${discount ? ` · −${discount}%` : ''}`}
        </small>
      </div>
    </dl>
  );
}

/** Preço fechado ou bonificação: preço, duração, custo por dia (ou ativos) e bônus, na régua das faixas. */
function ClosedFacts({
  draft,
  bonus,
  price,
  campaignCount,
}: {
  draft: CampaignDraft;
  bonus: boolean;
  price?: number;
  campaignCount: number;
}) {
  const isPackage = draft.selectionKind === 'package';
  const asset = mainAsset(draft);
  const members = isPackage
    ? (byId(PACKAGES, draft.packageId)?.assetIds ?? []).flatMap((id) => byId(ASSETS, id) ?? [])
    : asset
      ? [asset]
      : [];
  const span = draft.startDate && draft.endDate ? days(draft.startDate, draft.endDate) : 0;
  const model = effectiveModel(draft);
  const rules = asset?.bonuses ?? [];
  const liberated = asset
    ? rules.filter((rule) => bonusState(rule, asset, 0, campaignCount, model) !== 'bloqueado').length
    : 0;
  return (
    <dl className={p.strip} data-cols="4">
      <div>
        <dt>{bonus ? 'Cobrança' : 'Preço fechado'}</dt>
        <dd>{bonus ? 'Sem cobrança' : price ? brl(price) : '—'}</dd>
        <small>{bonus ? 'entra como bonificação' : isPackage ? 'pelo pacote' : 'pelo ativo'}</small>
      </div>
      <div>
        <dt>Duração</dt>
        <dd>{span ? `${span} ${span === 1 ? 'dia' : 'dias'}` : '—'}</dd>
        <small>
          {span ? <ShortRange start={draft.startDate} end={draft.endDate} /> : 'defina o período'}
        </small>
      </div>
      {bonus ? (
        <div>
          <dt>Ativos</dt>
          <dd>{members.length || '—'}</dd>
          <small title={members.map((item) => item.name).join(', ')}>
            {members.map((item) => item.name.split(' — ')[0]).join(', ') || 'nenhum ativo'}
          </small>
        </div>
      ) : (
        <div>
          <dt>Custo por dia</dt>
          <dd>{price && span ? `≈ ${brl(price / span, 0)}` : '—'}</dd>
          <small>no período contratado</small>
        </div>
      )}
      <div>
        <dt>Bônus</dt>
        <dd>{rules.length ? `${liberated} de ${rules.length}` : '—'}</dd>
        <small>{rules.length ? 'liberados' : 'nenhum vinculado'}</small>
      </div>
    </dl>
  );
}

type Preset = { key: 'min' | 'rec' | 'max'; label: string; value: number };

/** Verba igual ao atalho, com a folga do arredondamento em centavos. */
const sameMoney = (left: number, right: number) =>
  Number.isFinite(left) && Math.abs(left - right) < 0.005;

export function StepPricing({ draft, update, errors, campaignCount, adjustedBudget }: StepProps) {
  const [adjusted, setAdjusted] = useState<string>();
  // Aviso ao leitor de tela só ao sair do campo: digitar e arrastar não falam a cada passo.
  const [announce, setAnnounce] = useState('');
  const asset = mainAsset(draft);
  const isPackage = draft.selectionKind === 'package';
  const model: PricingModel | '' = isPackage ? draft.pricingModel : (asset?.pricing ?? '');
  const budget = parseMoney(draft.budget);
  const needsBudget = isPackage
    ? !model || PRICING[model].needsBudget
    : Boolean(model && PRICING[model].needsBudget);
  const bounds = asset && !isPackage ? budgetBounds(asset) : undefined;
  const pack = isPackage ? byId(PACKAGES, draft.packageId) : undefined;
  const fixedPrice = isPackage ? pack?.totalPrice : asset?.basePrice;
  const memberCount = pack?.assetIds.length ?? 0;
  // Preço fechado e bônus: modelo e preço ficam na descrição da seção. Com verba a informar, eles
  // vão para o bloco da verba, ao lado da entrega estimada (um lugar só).
  const lockedModel =
    !isPackage && asset && !PRICING[asset.pricing].needsBudget ? (
      <span className={p.modelLine}>
        <span>
          <span>
            <b>{PRICING[asset.pricing].label}</b>
            {asset.basePrice > 0 && <span className={p.nowrap}>{`\u00a0· ${unitPrice(asset)}`}</span>}
            <Lock aria-label="Definido pelo ativo" />
          </span>
        </span>
      </span>
    ) : undefined;
  const setBudget = (value: string) => {
    setAdjusted(undefined);
    update({ budget: value });
  };
  /* Atalhos da barra: mínimo, recomendado e máximo do ativo, na posição de cada um no trilho. */
  const presets: Preset[] = [];
  if (bounds) {
    presets.push({ key: 'min', label: 'Mínimo', value: bounds.min });
    if (bounds.recommended)
      presets.push({ key: 'rec', label: 'Recomendado', value: bounds.recommended });
    if (bounds.max) presets.push({ key: 'max', label: 'Máximo', value: bounds.max });
  }
  const at = (value: number) =>
    bounds && bounds.sliderMax > bounds.min
      ? Math.min(100, Math.max(0, ((value - bounds.min) / (bounds.sliderMax - bounds.min)) * 100))
      : 0;
  const units = asset && bounds ? estimateUnits(asset, Number.isFinite(budget) ? budget : 0) : 0;
  const hasBudget = Number.isFinite(budget) && budget > 0;
  const estimateText = (value: number) =>
    asset ? `≈ ${int(estimateUnits(asset, value))} ${unitsLabel(asset)}` : '';

  /** Motivo do ajuste da verba, igual no blur e na abertura da edição (A-70). */
  const adjustReason = (value: number) =>
    !bounds
      ? ''
      : value < bounds.min
        ? 'mínimo deste ativo'
        : bounds.max && value > bounds.max
          ? 'máximo deste ativo'
          : bounds.step
            ? `múltiplos de ${brl(bounds.step)}`
            : 'faixa deste ativo';
  // Edição: a verba gravada fora da regra foi ajustada na abertura; o campo diz isso até a próxima mudança.
  const openingNote =
    adjustedBudget && bounds && sameMoney(budget, adjustedBudget.to)
      ? `Ajustada de ${brl(adjustedBudget.from)} — ${adjustReason(adjustedBudget.from)}.`
      : undefined;
  const budgetField = (
    <Field
      label="Verba planejada"
      required
      error={errors.budget}
      hint={
        adjusted ??
        openingNote ??
        (bounds ? (
          <span className={p.hintLines}>
            <span>Digite o valor ou arraste a barra.</span>
            {bounds.step && (
              <span>Múltiplos de {brl(bounds.step)} — ajustamos ao sair do campo.</span>
            )}
          </span>
        ) : memberCount > 1 ? (
          `A verba se divide entre os ${memberCount} ativos do pacote.`
        ) : undefined)
      }
    >
      {({ id, describedBy, invalid }) => (
        <Input
          id={id}
          className={p.money}
          aria-describedby={describedBy}
          invalid={invalid}
          prefix="R$"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0,00"
          value={draft.budget}
          onChange={(event) => setBudget(event.target.value)}
          onBlur={() => {
            const value = parseMoney(draft.budget);
            if (!Number.isFinite(value) || value <= 0) return;
            const snapped = bounds ? snapBudget(value, bounds) : value;
            if (bounds && Math.abs(snapped - value) > 0.005) {
              setAdjusted(`Ajustada para ${brl(snapped)} — ${adjustReason(value)}.`);
            }
            update({ budget: money(snapped) });
            if (bounds && asset) setAnnounce(`Entrega estimada ${estimateText(snapped)}`);
          }}
        />
      )}
    </Field>
  );

  return (
    <>
      <Section
        n="03"
        id="sec-precificacao"
        title="Precificação"
        description={lockedModel}
      >
        {isPackage && (
          <Group label="Modelo de precificação" required>
            <div
              className={p.choices}
              role="radiogroup"
              aria-label="Modelo de precificação"
              aria-invalid={Boolean(errors.pricingModel) || undefined}
              onKeyDown={onRadioKeys}
            >
              {(Object.keys(PRICING) as PricingModel[]).map((key, index) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={draft.pricingModel === key}
                  tabIndex={rovingTab(
                    draft.pricingModel === key,
                    index,
                    Boolean(draft.pricingModel),
                  )}
                  className={p.choice}
                  onClick={() => {
                    setAdjusted(undefined);
                    update(
                      PRICING[key].needsBudget
                        ? { pricingModel: key }
                        : { pricingModel: key, budget: '' },
                    );
                  }}
                >
                  <span className={p.assetTop}>
                    <strong>{PRICING[key].label}</strong>
                    <span className={p.radio} aria-hidden="true" />
                  </span>
                  <span className={p.choiceDesc}>
                    {PRICING[key].needsBudget
                      ? `Cobrança por ${PRICING[key].unit}`
                      : 'Sem verba a informar'}
                  </span>
                </button>
              ))}
            </div>
            <ErrorText>{errors.pricingModel}</ErrorText>
          </Group>
        )}

        {model === 'bonus' || !needsBudget ? (
          <>
            <p className={p.note}>
              {model === 'bonus'
                ? `Este ${isPackage ? 'pacote' : 'ativo'} não tem cobrança: ele entra na campanha só como bonificação.`
                : `O preço é fechado ${isPackage ? 'no pacote' : 'no ativo'}, então não há verba a informar.`}
            </p>
            {/* Sem verba a digitar, a etapa mostra o que a campanha leva pelo preço fechado. */}
            <ClosedFacts
              draft={draft}
              bonus={model === 'bonus'}
              price={fixedPrice}
              campaignCount={campaignCount}
            />
          </>
        ) : (
          <>
            {/* A verba é o bloco focal da etapa: valor grande, o que ele compra e a barra. */}
            <div
              className={p.budget}
              role="group"
              aria-label="Verba"
              data-scale={bounds ? true : undefined}
            >
              <div className={p.budgetCols}>
                <div className={p.budgetMain}>{budgetField}</div>
                {bounds && asset ? (
                  <div className={p.outcome}>
                    <div className={p.outcomeFig}>
                      <span className={p.outcomeLabel}>Entrega estimada</span>
                      <span className={p.outcomeValue}>
                        <span>
                          <b>{units ? `≈ ${int(units)}` : '—'}</b>
                          {units > 0 && <span> {unitsLabel(asset)}</span>}
                        </span>
                      </span>
                    </div>
                    {/* Cada fato sem quebra; o "·" é do fato seguinte e some no começo de linha. */}
                    <span className={p.priceLine}>
                      <span>
                        <span>
                          <b>{PRICING[asset.pricing].label}</b>
                        </span>
                        <span>
                          <em>{brl(asset.basePrice)}</em>&nbsp;por {PRICING[asset.pricing].unit}
                          <Lock aria-label="Definido pelo ativo" />
                        </span>
                      </span>
                    </span>
                    <VisuallyHidden role="status">{announce}</VisuallyHidden>
                  </div>
                ) : (
                  // Pacote: o mínimo é uma referência (não o preço), em tinta normal, com atalho.
                  <div className={p.outcome} data-kind="minimum">
                    <div className={p.outcomeFig}>
                      <span className={p.outcomeLabel}>Mínimo do pacote</span>
                      <span className={p.outcomeValue}>
                        <span>
                          <b>{asset?.minPurchase ? brl(asset.minPurchase) : '—'}</b>
                        </span>
                      </span>
                    </div>
                    <span className={p.minLine}>
                      {!asset ? (
                        'sem ativo principal'
                      ) : asset.minPurchase ? (
                        <>
                          <span>pelo ativo principal</span>
                          <button
                            type="button"
                            className={p.linkButton}
                            onClick={() => setBudget(money(asset.minPurchase ?? 0))}
                          >
                            Usar o mínimo
                          </button>
                        </>
                      ) : (
                        'sem mínimo de compra'
                      )}
                    </span>
                  </div>
                )}
              </div>
              {bounds && (
                <div className={p.scale}>
                  <Slider
                    label="Ajuste da verba"
                    value={hasBudget ? budget : bounds.min}
                    min={bounds.min}
                    max={bounds.sliderMax}
                    step={bounds.step}
                    empty={!hasBudget}
                    // O valor e o que ele compra numa fala só: a estimativa não tem área viva própria.
                    valueText={
                      hasBudget ? `${brl(budget)} · ${estimateText(budget)}` : 'Sem verba definida'
                    }
                    onChange={(value) => setBudget(money(value))}
                    marks={
                      bounds.recommended
                        ? [
                            {
                              value: bounds.recommended,
                              kind: 'recommended',
                              label: `Recomendado: ${brl(bounds.recommended)}`,
                            },
                          ]
                        : []
                    }
                  />
                  {/* Marcas rotuladas sob o trilho; cada uma é também o atalho para o valor. */}
                  <div className={p.ticks} role="group" aria-label="Atalhos de verba">
                    {presets.map((preset) => (
                      <button
                        key={preset.key}
                        type="button"
                        className={p.tick}
                        data-key={preset.key}
                        data-flip={(preset.key === 'rec' && at(preset.value) > 60) || undefined}
                        style={{ '--f': at(preset.value) / 100 } as CSSProperties}
                        aria-pressed={sameMoney(budget, preset.value)}
                        onClick={() => setBudget(money(preset.value))}
                      >
                        <span>{preset.label}</span> <b>{brl(preset.value)}</b>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Rodapé do bloco: uma superfície focal só, e não um segundo cartão empilhado. */}
              {bounds && asset && asset.basePrice > 0 && (
                <Projection
                  asset={asset}
                  budget={Number.isFinite(budget) ? budget : 0}
                  start={draft.startDate}
                  end={draft.endDate}
                  campaignCount={campaignCount}
                />
              )}
            </div>
          </>
        )}

        {asset && asset.bonuses.length > 0 && (
          <Group
            label={model === 'bonus' ? 'Bônus vinculados' : 'Bônus'}
            meta={
              model === 'bonus'
                ? undefined
                : `${asset.bonuses.filter((rule) => bonusState(rule, asset, Number.isFinite(budget) ? budget : 0, campaignCount, model) !== 'bloqueado').length} de ${asset.bonuses.length} liberados`
            }
          >
            <div className={p.bonusGrid}>
              {asset.bonuses.map((rule) => {
                const state = bonusState(
                  rule,
                  asset,
                  Number.isFinite(budget) ? budget : 0,
                  campaignCount,
                  model,
                );
                const budgetRule = rule.conditions.find(
                  (condition) => condition.field === 'budget',
                );
                // Sem verba digitada, "faltam" repetiria o próprio limite: só aparece com verba > 0.
                const missing =
                  budgetRule && state === 'bloqueado' && Number.isFinite(budget) && budget > 0
                    ? budgetRule.value - budget
                    : 0;
                return (
                  <div key={rule.id} className={p.bonusCard} data-state={state}>
                    <span className={p.bonusState} data-state={state}>
                      <i aria-hidden="true" />
                      {BONUS_LABEL[state]}
                    </span>
                    <strong>{rule.name}</strong>
                    <span>{rule.description}</span>
                    <span className={p.bonusFoot}>
                      {budgetRule && state === 'bloqueado' && (
                        <span className={p.bonusProgress} aria-hidden="true">
                          <i
                            style={{
                              width: `${Math.min(100, ((Number.isFinite(budget) ? budget : 0) / budgetRule.value) * 100)}%`,
                            }}
                          />
                        </span>
                      )}
                      <small>
                        <span className={p.nowrap}>{bonusConditionText(rule)}</span>
                        {missing > 0 && (
                          <>
                            {' · '}
                            <span className={p.nowrap}>faltam {brl(missing)}</span>
                          </>
                        )}
                      </small>
                    </span>
                  </div>
                );
              })}
            </div>
          </Group>
        )}
      </Section>
    </>
  );
}
