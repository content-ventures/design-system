'use client';

import { ArrowLeft, BarChart3, Check, CircleAlert, Ellipsis, FileSignature, Trash2, X } from 'lucide-react';
import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Badge,
  BrandMark,
  Button,
  Dialog,
  Field,
  IconButton,
  Menu,
  Meter,
  Tabs,
  Textarea,
  type ButtonVariant,
  type MenuItem,
  type MenuSection,
  type TabItem,
  type Tone,
} from '@/components/ds-v3';
import { toast } from '@/components/ds-v3/toast';
import {
  ADVERTISERS,
  AUDIENCES,
  CATEGORIES,
  CHANNELS,
  EDITABLE,
  PACKAGES,
  PRICING,
  REASON_REQUIRED,
  SELF_ADVERTISER_ID,
  STATUS,
  STATUS_DONE,
  TRANSITIONS,
  byId,
  type CampaignStatus,
  type PricingModel,
} from '../domain';
import { bonusState, brl, dateBR, dateShort, estimateUnits, fieldVisible, int, isFilled, missingRequired, parseMoney, pct, unitsLabel } from '../pricing';
import { assetsOf, mainAsset, store, useStore, type Campaign } from '../store';
import { effectiveModel, validateAll } from '../builder/validation';
import { CampaignAnalytics, type ForecastItem } from './analytics';
import d from './detail.module.css';

/** Abas do detalhe. A aba aberta vive na URL (?aba=analytics) para que links abram direto nela. */
type DetailTab = 'geral' | 'analytics';
const TAB_ITEMS: TabItem<DetailTab>[] = [
  { value: 'geral', label: 'Visão geral', panelId: 'aba-geral' },
  { value: 'analytics', label: 'Analytics', panelId: 'aba-analytics' },
];
const TAB_PARAM = 'aba';

const PHASES = [
  { key: 'draft', label: 'Rascunho', hint: 'Montagem da campanha' },
  { key: 'review', label: 'Aprovação', hint: 'Comercial do portal' },
  { key: 'pi', label: 'P.I.', hint: 'Assinatura em 72 h' },
  { key: 'live', label: 'Veiculação', hint: 'No ar no período' },
  { key: 'done', label: 'Concluída', hint: 'Relatório final' },
];
function phaseIndex(c: Campaign) {
  const status = c.status;
  if (status === 'draft') return 0;
  if (['submitted', 'adjustments_requested', 'rejected'].includes(status)) return 1;
  if (['awaiting_pi_signature', 'pi_rejected'].includes(status)) return 2;
  if (['approved', 'active', 'paused'].includes(status)) return 3;
  // Cancelada: o X fica na fase em que ela parou, não no fim da jornada.
  if (status === 'cancelled') return c.metrics ? 3 : c.pi ? 2 : c.draft.submitNow ? 1 : 0;
  return 4;
}
const STOPPED: CampaignStatus[] = ['rejected', 'pi_rejected', 'cancelled'];
const REASON_SHOWN: CampaignStatus[] = ['rejected', 'adjustments_requested', 'pi_rejected', 'cancelled'];
/** Situação do P.I. com o mesmo código de cor do status da campanha. */
const PI_TONE: Record<string, Tone> = { Enviado: 'amber', Assinado: 'green', Ativo: 'green', Pausado: 'gray', Concluído: 'gray', Cancelado: 'red' };
/** Métrica que cada modelo entrega — o mesmo agrupamento do popover de vínculos da lista. */
const METRIC_OF: Partial<Record<PricingModel, string>> = { cpm: 'Impressões', cpc: 'Cliques', per_display: 'Disparos' };

function hoursLeft(iso?: string) {
  if (!iso) return undefined;
  return Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 3600_000));
}
const uniqueCount = <T,>(list: T[]) => new Set(list).size;

type Confirm = { title: string; text: string; confirm: string };
type HeaderAction = { key: string; label: string; variant: ButtonVariant; onClick: () => void };

export function CampaignDetail({ id }: { id: string }) {
  const router = useRouter();
  const { persona } = useStore();
  const campaign = store.get(id);
  const [reasonFor, setReasonFor] = useState<{ to: CampaignStatus; verb: string } | null>(null);
  const [reason, setReason] = useState('');
  const [confirmFor, setConfirmFor] = useState<CampaignStatus | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab: DetailTab = searchParams.get(TAB_PARAM) === 'analytics' ? 'analytics' : 'geral';

  /** Troca de aba sem navegação: o History API do navegador já sincroniza com useSearchParams. */
  function selectTab(next: DetailTab) {
    const params = new URLSearchParams(window.location.search);
    if (next === 'analytics') params.set(TAB_PARAM, 'analytics');
    else params.delete(TAB_PARAM);
    const query = params.toString();
    window.history.replaceState(null, '', `${pathname}${query ? `?${query}` : ''}`);
  }
  // Links com âncora (#analytics, ou o antigo #metricas) abrem a aba Analytics. Aqui vai pelo
  // roteador: no primeiro efeito o History API ainda não está ligado ao useSearchParams.
  useEffect(() => {
    const hash = window.location.hash;
    if (hash !== '#analytics' && hash !== '#metricas') return;
    const params = new URLSearchParams(window.location.search);
    params.set(TAB_PARAM, 'analytics');
    router.replace(`${window.location.pathname}?${params.toString()}` as Route, { scroll: false });
  }, [router]);

  if (!campaign || (persona === 'anunciante' && campaign.draft.advertiserId !== SELF_ADVERTISER_ID))
    return (
      <div className={d.missing}>
        <h1>Campanha não encontrada neste portal.</h1>
        <p>Ela pode ter sido excluída. Volte à lista de campanhas.</p>
        <Button icon={ArrowLeft} onClick={() => router.push('/dashboardv3/campanhas' as Route)}>
          Voltar para campanhas
        </Button>
      </div>
    );

  const c: Campaign = campaign;
  const draft = c.draft;
  const operator = persona === 'operador';
  const who = operator ? 'Marina Lopes' : 'Paula Mendes';
  const advertiser = byId(ADVERTISERS, draft.advertiserId);
  const assets = assetsOf(draft);
  const asset = mainAsset(draft);
  const model = effectiveModel(draft);
  const budget = parseMoney(draft.budget);
  const pack = byId(PACKAGES, draft.packageId);
  const editable = EDITABLE.includes(c.status);
  const current = phaseIndex(c);
  const stopped = STOPPED.includes(c.status);
  const transitions = operator ? TRANSITIONS[c.status].filter((item) => !(item.to === 'submitted' && c.status === 'draft')) : [];
  const left = hoursLeft(c.pi?.expiresAt);
  /** Primeiro bloqueio do envio, com as mesmas regras do construtor. */
  const blocked = editable ? validateAll({ ...draft, submitNow: true }) : undefined;
  const editHref = (step?: number) => `/dashboardv3/campanhas/${c.id}/editar${step ? `?etapa=${step}` : ''}` as Route;

  const CONFIRM: Partial<Record<CampaignStatus, Confirm>> = {
    completed: {
      title: 'Concluir a campanha?',
      text: 'A veiculação para agora e o relatório final é gerado. Não dá para retomar.',
      confirm: 'Concluir campanha',
    },
    awaiting_pi_signature: {
      title: 'Aprovar e gerar o P.I.?',
      text: 'O P.I. vai para assinatura e o estoque fica reservado por 72 h.',
      confirm: 'Aprovar e gerar P.I.',
    },
    ...(c.status === 'approved'
      ? {
          active: {
            title: 'Iniciar a veiculação agora?',
            text: `O período contratado começa em ${dateBR(draft.startDate)}.`,
            confirm: 'Iniciar veiculação',
          },
        }
      : {}),
  };
  const confirming = confirmFor ? CONFIRM[confirmFor] : undefined;

  function apply(to: CampaignStatus, text?: string) {
    const from = c.status;
    // Retrato de antes: o "Desfazer" devolve status, P.I. e histórico exatos, sem registrar uma transição falsa.
    const before = c;
    const resumed = to === 'active' && from === 'paused';
    store.transition(c.id, to, text, who);
    const title =
      to === 'submitted'
        ? 'Campanha enviada para aprovação.'
        : to === 'paused' && from === 'approved'
          ? 'Campanha pausada antes de veicular.'
          : `${resumed ? 'Veiculação retomada' : STATUS_DONE[to]}.`;
    const options = {
      description: to === 'awaiting_pi_signature' ? 'Estoque reservado por 72 h até a assinatura.' : text ? 'O motivo foi enviado ao anunciante.' : draft.name,
      ...(to === 'paused' || resumed ? { action: { label: 'Desfazer', onClick: () => store.restore(before) } } : {}),
    };
    toast(title, options);
  }
  function onTransition(to: CampaignStatus, verb: string) {
    if (REASON_REQUIRED.includes(to)) {
      setReason('');
      setReasonFor({ to, verb });
      return;
    }
    if (CONFIRM[to]) {
      setConfirmFor(to);
      return;
    }
    apply(to);
  }
  function submit() {
    if (blocked) {
      router.push(editHref(blocked.index + 1));
      toast(blocked.errors.form ?? 'Revise os campos sinalizados antes de enviar.', { tone: 'error' });
      return;
    }
    apply('submitted');
  }

  /* Cabeçalho: um único primário (a primeira ação); as demais são secundárias e sem ícone. */
  const actions: HeaderAction[] = [];
  if (c.status === 'draft') actions.push({ key: 'submit', label: 'Enviar para aprovação', variant: 'secondary', onClick: submit });
  if (c.status === 'adjustments_requested')
    actions.push({ key: 'adjust', label: 'Ajustar e reenviar', variant: 'secondary', onClick: () => router.push(editHref()) });
  if (c.status === 'draft') actions.push({ key: 'edit', label: 'Editar', variant: 'secondary', onClick: () => router.push(editHref()) });
  transitions
    .filter((item) => item.to !== 'cancelled' && !(editable && item.to === 'submitted'))
    .forEach((item) => actions.push({ key: item.to, label: item.verb, variant: 'secondary', onClick: () => onTransition(item.to, item.verb) }));
  const variantFor = (key: string, index: number): ButtonVariant =>
    key === 'rejected' || key === 'pi_rejected' ? 'secondary' : index === 0 ? 'primary' : 'secondary';
  /* Menu "Mais ações": só existe quando guarda algo além de "Analytics" (a aba já está na tela). */
  const cancelItems: MenuItem[] = transitions.some((item) => item.to === 'cancelled')
    ? [{ label: 'Cancelar campanha', icon: X, onSelect: () => onTransition('cancelled', 'Cancelar campanha') }]
    : [];
  const deleteSections: MenuSection[] = operator
    ? [
        {
          items: [
            {
              label: 'Excluir',
              icon: Trash2,
              danger: true,
              disabled: c.status === 'active',
              description: c.status === 'active' ? 'Campanhas em veiculação não podem ser excluídas.' : undefined,
              onSelect: () => setConfirmDelete(true),
            },
          ],
        },
      ]
    : [];
  /* "Analytics" no menu: abre a aba, rola até ela e leva o foco junto (o menu devolveria o foco ao
     gatilho, que saiu da tela). Some quando a aba já está aberta. */
  const analyticsItems: MenuItem[] =
    tab === 'analytics'
      ? []
      : [
          {
            label: 'Analytics',
            icon: BarChart3,
            onSelect: () => {
              selectTab('analytics');
              const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
              requestAnimationFrame(() => {
                document.getElementById('abas')?.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
                document.getElementById('aba-analytics-tab')?.focus({ preventScroll: true });
              });
            },
          },
        ];
  const menuSections: MenuSection[] = [{ items: [...analyticsItems, ...cancelItems] }, ...deleteSections].filter(
    (section) => section.items.length > 0,
  );
  const showMenu = cancelItems.length > 0 || deleteSections.length > 0;
  const solo = actions.length === 0;

  const visibleFields = asset ? asset.fields.filter((field) => fieldVisible(field, draft.formValues)) : [];
  const filled = visibleFields.filter((field) => isFilled(field, draft.formValues[field.id])).length;
  const missing = asset ? missingRequired(asset.fields, draft.formValues) : [];
  const liberated = asset ? asset.bonuses.filter((rule) => bonusState(rule, asset, Number.isFinite(budget) ? budget : 0, 1, model) !== 'bloqueado') : [];
  const briefingBlocked = Boolean(blocked?.errors.form) && missing.length > 0;

  function budgetText() {
    if (Number.isFinite(budget) && budget > 0) return brl(budget);
    if (model === 'bonus') return 'Sem cobrança';
    if (model === 'fixed_package') {
      const price = draft.selectionKind === 'package' ? pack?.totalPrice : asset?.basePrice;
      return price ? brl(price) : undefined;
    }
    return undefined;
  }
  const budgetLabel = budgetText();

  const days = draft.startDate && draft.endDate ? Math.round((new Date(draft.endDate).getTime() - new Date(draft.startDate).getTime()) / 86_400_000) + 1 : 0;
  const share = (name: string | undefined, value: number) => `${name ?? ''}${asset?.allowAllocation ? ` (${pct(value, 0)})` : ''}`;
  const config: { label: string; value: ReactNode }[] = [
    {
      label: 'Anunciante',
      value: advertiser ? (
        <span className={d.inline}>
          <BrandMark name={advertiser.name} size="xs" variant="soft" decorative />
          {advertiser.name}
        </span>
      ) : undefined,
    },
    { label: draft.selectionKind === 'package' ? 'Pacote' : 'Ativo', value: draft.selectionKind === 'package' ? pack?.name : asset?.name },
    { label: 'Categoria', value: CATEGORIES.find((item) => item.value === draft.category)?.label },
    { label: 'Modelo de precificação', value: model ? `${PRICING[model].label}${asset?.basePrice ? ` · ${brl(asset.basePrice)} / ${PRICING[model].unit}` : ''}` : undefined },
    { label: 'Verba', value: budgetLabel },
    {
      label: 'Período',
      value: draft.startDate ? `${dateBR(draft.startDate)} – ${dateBR(draft.endDate)}${days ? ` · ${days} ${days === 1 ? 'dia' : 'dias'}` : ''}` : undefined,
    },
    { label: 'Canais', value: draft.channelIds.map((cid) => share(byId(CHANNELS, cid)?.name, draft.channelAlloc[cid] ?? 0)).join(', ') },
    { label: 'Públicos', value: draft.audienceIds.map((aid) => share(byId(AUDIENCES, aid)?.name, draft.audienceAlloc[aid] ?? 0)).join(', ') },
    { label: 'Bônus liberados', value: liberated.map((rule) => rule.name).join(', ') },
  ];
  /** Pacote fixo: entrega um pacote pelo preço fechado, sem estimativa nem ritmo diário. */
  const fixed = model === 'fixed_package';
  const units = !fixed && asset && Number.isFinite(budget) && budget > 0 && asset.basePrice > 0 ? estimateUnits(asset, budget) : 0;
  const estimate = units ? int(units) : undefined;
  const fixedPackage = fixed && Boolean(budgetLabel);
  /** Métrica contratada (impressões, cliques ou disparos), o mesmo nome da aba Analytics. */
  const metricName = (model && METRIC_OF[model]) || 'Impressões';
  /** Previsão da aba Analytics enquanto não há veiculação: as mesmas regras da faixa de previsão. */
  const forecast: ForecastItem[] = [
    {
      label: 'Entrega estimada',
      value: estimate ? `≈ ${estimate}` : fixedPackage ? '1' : undefined,
      hint: fixedPackage && !estimate ? 'pacote fechado' : asset ? unitsLabel(asset) : 'Sem ativo',
    },
    { label: 'Verba', value: budgetLabel, hint: model ? PRICING[model].label : 'Modelo a definir' },
    {
      label: 'Duração',
      value: days ? `${days} ${days === 1 ? 'dia' : 'dias'}` : undefined,
      hint: days ? `${dateShort(draft.startDate)} – ${dateShort(draft.endDate)}` : 'A definir',
    },
    // O ritmo só existe para métrica por unidade com ao menos uma unidade por dia (pacote fechado, pacote
    // por métrica e bonificação não têm ritmo diário).
    ...(units && days && asset && model && METRIC_OF[model] && units / days >= 1
      ? [{ label: 'Ritmo planejado', value: `≈ ${int(units / days)}`, hint: `${unitsLabel(asset)} por dia` }]
      : []),
  ];
  const reach = draft.audienceIds.reduce((total, aid) => total + (byId(AUDIENCES, aid)?.size ?? 0), 0);

  /* Vínculos do ativo: os mesmos cinco grupos (e o mesmo total) do popover da lista. */
  const links = [
    { label: 'Ativos', count: assets.length },
    { label: 'Canais', count: uniqueCount(assets.flatMap((item) => item.channelIds)) },
    { label: 'Públicos', count: uniqueCount(assets.flatMap((item) => item.audienceIds)) },
    { label: 'Métricas', count: uniqueCount(assets.map((item) => METRIC_OF[item.pricing] ?? 'Entregas')) },
    { label: 'Bonificações', count: uniqueCount(assets.flatMap((item) => item.bonuses.map((bonus) => bonus.name))) },
  ];

  const meta = [
    c.id.replace('cmp-', '#'),
    advertiser?.name,
    draft.selectionKind === 'package' ? `Pacote ${pack?.name ?? ''}` : asset?.name,
    draft.startDate ? `${dateShort(draft.startDate)} – ${dateShort(draft.endDate)}` : undefined,
    c.createdByAdmin ? 'Criada pelo admin' : 'Criada pelo anunciante',
  ].filter(Boolean);

  const reasonAt = c.reason ? new Date(c.reason.at) : undefined;
  const reasonMeta =
    c.reason && reasonAt
      ? `Em ${reasonAt.toLocaleDateString('pt-BR')} às ${reasonAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · ${c.reason.who ?? 'Marina Lopes'}`
      : '';

  return (
    <div className={d.page}>
      <header className={d.head} data-solo={solo || undefined}>
        <div className={d.headText}>
          <div className={d.titleRow}>
            <h1>{draft.name}</h1>
            <Badge variant="text" size="sm" tone={STATUS[c.status].tone} live={STATUS[c.status].live}>
              {STATUS[c.status].label}
            </Badge>
          </div>
          {/* Cada item fica inteiro; o separador "·" é desenhado antes de cada item e o do início de linha fica fora do recorte. */}
          <p className={d.meta}>
            <span>
              {meta.map((item, index) => (
                <span key={index}>{item}</span>
              ))}
            </span>
          </p>
        </div>
        {(actions.length > 0 || showMenu) && (
          <div className={d.headSide}>
            <div className={d.actions}>
              {actions.map((action, index) => (
                <Button key={action.key} variant={variantFor(action.key, index)} onClick={action.onClick}>
                  {action.label}
                </Button>
              ))}
              {showMenu && (
                <Menu
                  label="Mais ações"
                  align="end"
                  sections={menuSections}
                  trigger={(props) => <IconButton {...props} label="Mais ações" icon={Ellipsis} />}
                />
              )}
            </div>
            {briefingBlocked && (
              <span className={d.actionHint}>
                {missing.length === 1 ? '1 campo do briefing falta para enviar' : `${missing.length} campos do briefing faltam para enviar`}
              </span>
            )}
          </div>
        )}
      </header>

      <ol className={d.journey} aria-label="Jornada da campanha">
        {PHASES.map((phase, index) => {
          const state = stopped && index === current ? 'stopped' : index < current || (index === 4 && c.status === 'completed') ? 'done' : index === current ? 'current' : 'upcoming';
          return (
            <li key={phase.key} className={d.phase} data-state={state} aria-current={index === current ? 'step' : undefined}>
              <span className={d.phaseDot} aria-hidden="true">
                {state === 'done' ? <Check /> : state === 'stopped' ? <X /> : index + 1}
              </span>
              <span className={d.phaseText}>
                <strong>{phase.label}</strong>
                <span>{phase.hint}</span>
              </span>
            </li>
          );
        })}
      </ol>

      {c.reason && REASON_SHOWN.includes(c.status) && (
        <div className={d.notice} data-tone={c.status === 'adjustments_requested' ? 'orange' : 'red'} role="status">
          <CircleAlert aria-hidden="true" />
          <div>
            <strong>Motivo</strong>
            <p>{c.reason.text}</p>
            <span>{reasonMeta}</span>
          </div>
        </div>
      )}

      {c.status === 'awaiting_pi_signature' && (
        <div className={d.notice} data-tone="amber" role="status">
          <FileSignature aria-hidden="true" />
          <div>
            <strong>{c.pi?.code}</strong>
            <p>O estoque está reservado até a assinatura. Sem assinatura em 72 h, o P.I. expira e a campanha vai para “P.I. rejeitado”.</p>
          </div>
          <span className={d.noticeEnd} data-urgent={left !== undefined && left < 24 ? true : undefined}>
            {left !== undefined ? `Expira em ${left} h` : 'Prazo de 72 h'}
          </span>
        </div>
      )}

      <div className={d.tabs} id="abas">
        <Tabs label="Seções da campanha" items={TAB_ITEMS} value={tab} onChange={selectTab} />
      </div>

      {tab === 'analytics' ? (
        <div role="tabpanel" id="aba-analytics" aria-labelledby="aba-analytics-tab" className={d.panel}>
          <CampaignAnalytics campaign={c} forecast={forecast} />
        </div>
      ) : (
        <div role="tabpanel" id="aba-geral" aria-labelledby="aba-geral-tab" className={d.panel}>
          {c.metrics ? (
            <section className={d.stats} id="metricas" aria-label="Métricas da campanha">
              <div>
                <span>{metricName}</span>
                <b data-empty={c.metrics.impressions === undefined || undefined}>{c.metrics.impressions !== undefined ? int(c.metrics.impressions) : '—'}</b>
                <small>Entregues no período</small>
              </div>
              <div>
                <span>Cliques</span>
                <b data-empty={c.metrics.clicks === undefined || undefined}>{c.metrics.clicks !== undefined ? int(c.metrics.clicks) : '—'}</b>
                <small>{c.metrics.impressions ? `CTR ${pct(((c.metrics.clicks ?? 0) / c.metrics.impressions) * 100, 2)}` : 'Sem coleta'}</small>
              </div>
              <div>
                <span>Leads</span>
                <b data-empty={c.metrics.leads === undefined || undefined}>{c.metrics.leads !== undefined ? int(c.metrics.leads) : '—'}</b>
                <small>Campanha + vitrine</small>
              </div>
              <div>
                <span>Entrega</span>
                <b>
                  {c.metrics.delivered}
                  <em>%</em>
                </b>
                <Meter value={c.metrics.delivered} label="Entrega" tone={c.metrics.delivered === 100 ? 'green' : 'blue'} size="sm" />
                <small>{estimate ? `de ≈ ${estimate} ${asset ? unitsLabel(asset) : ''}` : 'Contratado'}</small>
              </div>
            </section>
          ) : (
            <section className={d.stats} id="metricas" aria-label="Previsão da campanha" data-forecast>
              <div>
                <span>Entrega estimada</span>
                <b data-empty={!(estimate || fixedPackage) || undefined}>{estimate ? `≈ ${estimate}` : fixedPackage ? '1' : '—'}</b>
                <small>{fixedPackage && !estimate ? 'pacote fechado' : asset ? unitsLabel(asset) : 'Sem ativo'}</small>
              </div>
              <div>
                <span>Verba</span>
                <b data-empty={!budgetLabel || undefined}>{budgetLabel ?? '—'}</b>
                <small>{model ? PRICING[model].label : 'Modelo a definir'}</small>
              </div>
              <div>
                <span>Duração</span>
                <b data-empty={!days || undefined}>{days ? `${days} ${days === 1 ? 'dia' : 'dias'}` : '—'}</b>
                <small>{days ? 'de veiculação' : 'A definir'}</small>
              </div>
              <div>
                <span>Público potencial</span>
                <b data-empty={!reach || undefined}>{reach ? int(reach) : '—'}</b>
                <small>
                  {draft.audienceIds.length
                    ? `pessoas em ${draft.audienceIds.length} ${draft.audienceIds.length === 1 ? 'público' : 'públicos'}`
                    : 'Nenhum público'}
                </small>
              </div>
            </section>
          )}

          <div className={d.grid}>
            <div className={d.main}>
              <section className={d.section} aria-labelledby="sec-config">
                <div className={d.sectionHead}>
                  <h2 id="sec-config">Configuração</h2>
                </div>
                <dl className={d.rows}>
                  {config.map((row) => (
                    <div key={row.label}>
                      <dt>{row.label}</dt>
                      <dd data-empty={!row.value || undefined}>{row.value || '—'}</dd>
                    </div>
                  ))}
                </dl>
              </section>
              <section className={d.section} aria-labelledby="sec-briefing">
                <div className={d.sectionHead}>
                  <h2 id="sec-briefing">Briefing</h2>
                  {visibleFields.length > 0 && (
                    <span className={d.count} data-missing={(editable && missing.length > 0) || undefined}>
                      {editable && missing.length > 0
                        ? `${missing.length} ${missing.length === 1 ? 'obrigatório faltando' : 'obrigatórios faltando'}`
                        : `${filled} de ${visibleFields.length} preenchidos`}
                    </span>
                  )}
                  {editable && (
                    <button type="button" className={d.linkButton} onClick={() => router.push(editHref(5))}>
                      Preencher
                    </button>
                  )}
                </div>
                {visibleFields.length === 0 ? (
                  <p className={d.empty}>{asset ? 'O ativo desta campanha não define campos de briefing.' : 'Sem ativo vinculado.'}</p>
                ) : (
                  <dl className={d.rows}>
                    {visibleFields.map((field) => {
                      const value = draft.formValues[field.id];
                      const ok = isFilled(field, value);
                      const need = !ok && editable && missing.includes(field);
                      const text = Array.isArray(value)
                        ? value.join(', ')
                        : typeof value === 'object' && value
                          ? ((value as { name?: string }).name ?? 'Envio depois da contratação')
                          : field.type === 'date'
                            ? dateBR(String(value ?? ''))
                            : field.type === 'currency' && value
                              ? brl(parseMoney(String(value)))
                              : String(value ?? '');
                      return (
                        <div key={field.id}>
                          <dt>{field.label}</dt>
                          <dd data-empty={!ok || undefined} data-missing={need || undefined}>
                            {ok ? text : need ? 'Falta' : 'Não informado'}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                )}
              </section>
            </div>

            <aside className={d.aside}>
              <section className={d.block} aria-labelledby="sec-pi">
                <h2 id="sec-pi">Pedido de inserção</h2>
                {c.pi ? (
                  <div className={d.pi}>
                    <div>
                      <strong>{c.pi.code}</strong>
                      <span>{budgetLabel ?? '—'}</span>
                    </div>
                    <Badge variant="text" size="sm" tone={PI_TONE[c.pi.status] ?? 'gray'}>
                      {c.pi.status}
                    </Badge>
                  </div>
                ) : (
                  <p className={d.empty}>O P.I. é gerado quando o portal aprova a campanha.</p>
                )}
              </section>
              <section className={d.block} aria-labelledby="sec-hist">
                <h2 id="sec-hist">Histórico</h2>
                <ol className={d.history}>
                  {c.history.slice(0, 6).map((entry, index) => (
                    <li key={`${entry.at}-${index}`} data-current={index === 0 || undefined}>
                      <strong>{entry.text}</strong>
                      <span>
                        {entry.who} · {new Date(entry.at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
              <section className={d.block} aria-labelledby="sec-links">
                <h2 id="sec-links">Vínculos do ativo</h2>
                <dl className={d.compact}>
                  {links.map((link) => (
                    <div key={link.label}>
                      <dt>{link.label}</dt>
                      <dd>{link.count}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            </aside>
          </div>
        </div>
      )}

      <Dialog
        open={Boolean(confirming)}
        onClose={() => setConfirmFor(null)}
        size="sm"
        divided={false}
        title={confirming?.title ?? ''}
        description={confirming?.text}
        footer={
          <>
            <Button onClick={() => setConfirmFor(null)}>Cancelar</Button>
            <Button
              variant="primary"
              data-autofocus
              onClick={() => {
                if (confirmFor) apply(confirmFor);
                setConfirmFor(null);
              }}
            >
              {confirming?.confirm}
            </Button>
          </>
        }
      >
        {null}
      </Dialog>

      <Dialog
        open={Boolean(reasonFor)}
        onClose={() => setReasonFor(null)}
        title={`${reasonFor?.verb ?? ''} — ${draft.name}`}
        description="O motivo vai para o anunciante junto com a decisão e fica registrado na auditoria."
        footer={
          <>
            <Button onClick={() => setReasonFor(null)}>Cancelar</Button>
            <Button
              variant={reasonFor?.to === 'rejected' || reasonFor?.to === 'cancelled' ? 'danger' : 'primary'}
              disabled={!reason.trim()}
              onClick={() => {
                if (reasonFor) apply(reasonFor.to, reason.trim());
                setReasonFor(null);
              }}
            >
              Confirmar
            </Button>
          </>
        }
      >
        <div className={d.reasonField}>
          <Field label="Motivo" required hint="Seja específico: o anunciante usa este texto para ajustar a campanha.">
            {({ id, describedBy }) => (
              <Textarea
                id={id}
                aria-describedby={describedBy}
                rows={4}
                placeholder="Escreva o motivo"
                value={reason}
                data-autofocus
                onChange={(event) => setReason(event.target.value)}
              />
            )}
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        size="sm"
        divided={false}
        title={`Excluir ${draft.name}?`}
        description="A exclusão apaga a campanha, as métricas entregues e os P.I., e devolve o estoque reservado — tudo na mesma transação. Não há como desfazer."
        footer={
          <>
            <Button data-autofocus onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                store.remove(c.id);
                toast('Campanha excluída e estoque liberado.');
                router.push('/dashboardv3/campanhas' as Route);
              }}
            >
              Excluir
            </Button>
          </>
        }
      >
        {null}
      </Dialog>
    </div>
  );
}
