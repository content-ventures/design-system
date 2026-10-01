'use client';

import {
  AtSign,
  Building2,
  Check,
  Globe,
  Info,
  ListChecks,
  Mail,
  ShieldAlert,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { BrandMark, Checkbox, Input, Meter } from '@/components/ds-v3';
import {
  ADVERTISERS,
  ASSETS,
  AUDIENCES,
  CATEGORIES,
  CHANNELS,
  PACKAGES,
  PRICING,
  byId,
  type BriefField,
  type Channel,
} from '../domain';
import {
  audienceAvailable,
  audienceLimits,
  audienceVolume,
  bonusConditionText,
  bonusState,
  brl,
  dateBR,
  equalSplit,
  estimateUnits,
  exclusivityBlock,
  fieldVisible,
  frequency,
  int,
  isFilled,
  missingRequired,
  parseMoney,
  pct,
  sum,
  unitsLabel,
  type FormValues,
} from '../pricing';
import { mainAsset, type CampaignDraft } from '../store';
import { BriefingFields } from './briefing';
import { ShortRange } from './steps-a';
import { Bars, days } from './summary';
import { Alert, ErrorText, Group, Help, Section, type StepProps } from './ui';
import { effectiveModel } from './validation';
import p from './parts.module.css';

const channelIcon: Record<Channel['kind'], LucideIcon> = {
  web: Globe,
  app: Smartphone,
  email: Mail,
  social: AtSign,
  onsite: Building2,
  list: ListChecks,
};

export function BlockAlert({ draft }: { draft: CampaignDraft }) {
  const asset = mainAsset(draft);
  const block = exclusivityBlock(
    draft.advertiserId,
    asset?.category ?? '',
    draft.startDate,
    draft.endDate,
  );
  if (!block) return null;
  const advertiser = byId(ADVERTISERS, draft.advertiserId);
  const category = CATEGORIES.find((item) => item.value === block.category)?.label;
  return (
    <Alert
      tone="red"
      icon={ShieldAlert}
      title="Contratação bloqueada"
      facts={[
        { label: 'CNPJ', value: advertiser?.cnpj },
        {
          label: 'Período',
          value: (
            <span className={p.nowrap}>{`${dateBR(block.start)} – ${dateBR(block.end)}`}</span>
          ),
        },
        { label: 'Categoria', value: category },
        { label: 'Contratação existente', value: block.contract },
      ]}
    >
      <span>
        O CNPJ {advertiser?.cnpj} já é impactado por um concorrente da categoria “
        {block.categoryLabel}” pela contratação {block.contract}, de {dateBR(block.start)} a{' '}
        {dateBR(block.end)}.
      </span>
    </Alert>
  );
}

function Total({ value, label }: { value: number; label: string }) {
  const ok = Math.abs(value - 100) <= 0.5;
  if (ok)
    return (
      <div className={p.allocFoot} data-ok>
        <span className={p.totalText} data-ok>
          <Check aria-hidden="true" />
          100% distribuído
        </span>
      </div>
    );
  return (
    <div className={p.allocFoot}>
      <Meter value={Math.min(value, 100)} label={label} tone="amber" size="sm" />
      <span className={p.totalText} data-off>
        {pct(value, 1)} de 100%
      </span>
    </div>
  );
}

function PctInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Input
      size="sm"
      type="number"
      suffix="%"
      min={0}
      max={100}
      aria-label={label}
      value={String(value)}
      onChange={(event) => onChange(Number(event.target.value))}
      style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}
    />
  );
}

/* ——— 4. Canal + Público ——— */
export function StepChannels({ draft, update, errors }: StepProps) {
  const asset = mainAsset(draft);
  const budget = parseMoney(draft.budget) || 0;
  if (!asset)
    return (
      <Alert title="Escolha o ativo primeiro" icon={Info}>
        Canais e públicos vêm do ativo escolhido na etapa 2.
      </Alert>
    );
  const allocation = asset.allowAllocation;
  const channelTotal = sum(draft.channelIds.map((id) => draft.channelAlloc[id] ?? 0));
  const audienceTotal = sum(draft.audienceIds.map((id) => draft.audienceAlloc[id] ?? 0));
  const hasPeriod = Boolean(draft.startDate && draft.endDate);

  function toggleChannel(id: string) {
    const channelIds = draft.channelIds.includes(id)
      ? draft.channelIds.filter((item) => item !== id)
      : [...draft.channelIds, id];
    update({ channelIds, channelAlloc: allocation ? equalSplit(channelIds) : {} });
  }
  function toggleAudience(id: string) {
    const audienceIds = draft.audienceIds.includes(id)
      ? draft.audienceIds.filter((item) => item !== id)
      : [...draft.audienceIds, id];
    update({ audienceIds, audienceAlloc: allocation ? equalSplit(audienceIds) : {} });
  }
  const splitButton = (onClick: () => void) => (
    <button type="button" className={p.linkButton} onClick={onClick}>
      Dividir igualmente
    </button>
  );

  return (
    <>
      <BlockAlert draft={draft} />
      <Section
        n="04"
        id="sec-distribuicao"
        title="Canal + Público"
        description={
          allocation
            ? '% da verba por canal e por público'
            : 'A verba se divide igualmente entre o que você marcar.'
        }
      >
        <Group
          label="Canais"
          meta={`${draft.channelIds.length} de ${asset.channelIds.length} marcados`}
          actions={
            allocation && draft.channelIds.length > 1
              ? splitButton(() => update({ channelAlloc: equalSplit(draft.channelIds) }))
              : undefined
          }
        >
          {asset.channelIds.length === 0 ? (
            <div className={p.empty}>O ativo escolhido não declara canais.</div>
          ) : (
            <div className={p.alloc} data-kind="channels">
              <div className={p.allocHead} aria-hidden="true">
                <span>Canal</span>
                <span>Valor</span>
                <span>Alocação</span>
              </div>
              {asset.channelIds.map((id) => {
                const channel = byId(CHANNELS, id);
                if (!channel) return null;
                const Icon = channelIcon[channel.kind];
                const on = draft.channelIds.includes(id);
                const share = allocation
                  ? (draft.channelAlloc[id] ?? 0)
                  : draft.channelIds.length
                    ? 100 / draft.channelIds.length
                    : 0;
                return (
                  <div key={id} className={p.allocRow} data-selected={on || undefined}>
                    <Checkbox
                      checked={on}
                      onChange={() => toggleChannel(id)}
                      label={
                        <span className={p.allocName}>
                          <Icon aria-hidden="true" />
                          {channel.name}
                        </span>
                      }
                    />
                    <span className={p.num}>
                      {on && budget > 0 && share > 0 ? `≈ ${brl((budget * share) / 100, 0)}` : '—'}
                    </span>
                    <span className={p.share}>
                      {on && allocation ? (
                        <PctInput
                          label={`Alocação de ${channel.name} em %`}
                          value={share}
                          onChange={(value) =>
                            update({ channelAlloc: { ...draft.channelAlloc, [id]: value } })
                          }
                        />
                      ) : on ? (
                        pct(share, 1)
                      ) : (
                        ''
                      )}
                    </span>
                  </div>
                );
              })}
              {allocation && draft.channelIds.length > 0 && (
                <Total value={channelTotal} label="Alocação de canais" />
              )}
            </div>
          )}
          <ErrorText>{errors.channels}</ErrorText>
        </Group>

        <Group
          label="Públicos"
          meta="mínimo e máximo por empresa"
          actions={
            allocation && draft.audienceIds.length > 1
              ? splitButton(() => update({ audienceAlloc: equalSplit(draft.audienceIds) }))
              : undefined
          }
        >
          {asset.audienceIds.length === 0 ? (
            <div className={p.empty}>O ativo escolhido não declara públicos.</div>
          ) : (
            <div className={p.alloc} data-kind="audiences">
              <div className={p.allocHead} aria-hidden="true">
                <span>Público</span>
                <span>Disponível</span>
                <span>Volume</span>
                <span>Frequência</span>
                <span>Alocação</span>
              </div>
              {asset.audienceIds.map((id) => {
                const audience = byId(AUDIENCES, id);
                if (!audience) return null;
                const on = draft.audienceIds.includes(id);
                const share = allocation
                  ? (draft.audienceAlloc[id] ?? 0)
                  : draft.audienceIds.length
                    ? 100 / draft.audienceIds.length
                    : 0;
                const volume = on ? audienceVolume(asset, budget, share) : 0;
                const limits = audienceLimits(id, asset.pricing);
                const available = audienceAvailable(id, asset.pricing);
                const over = on && available !== undefined && volume > available;
                const freq = on && volume ? frequency(id, volume) : undefined;
                const availText =
                  available === undefined ? 'sem limite' : hasPeriod ? int(available) : '—';
                const issue = errors[`aud-${id}`];
                return (
                  <div
                    key={id}
                    className={p.allocRow}
                    data-selected={on || undefined}
                    data-over={over || undefined}
                  >
                    <Checkbox
                      checked={on}
                      onChange={() => toggleAudience(id)}
                      label={
                        <span className={p.allocName}>
                          <span>
                            {audience.name}
                            {/* Cada fato é um bloco sem quebra; a linha só quebra antes do "·". */}
                            <small>
                              <span className={p.nowrap}>{int(audience.size)} pessoas</span>
                              {limits && (
                                <>
                                  {' '}
                                  <span className={p.nowrap}>· mín. {int(limits.min)}</span>{' '}
                                  <span className={p.nowrap}>
                                    · máx. {int(Math.min(limits.maxPerAdvertiser, available ?? Infinity))}
                                  </span>
                                </>
                              )}
                              {/* Repetidos aqui só quando as colunas somem (moldura estreita). */}
                              <span className={p.narrowOnly}>
                                {' '}
                                <span className={p.nowrap}>· disponível {availText}</span>
                              </span>
                              {freq && (
                                <span className={p.narrowOnly}>
                                  {' '}
                                  <span className={p.nowrap}>· frequência {freq}</span>
                                </span>
                              )}
                              {on && volume > 0 && (
                                <span className={p.narrowerOnly}>
                                  {' '}
                                  <span className={p.nowrap}>· volume {int(volume)}</span>
                                </span>
                              )}
                            </small>
                          </span>
                        </span>
                      }
                    />
                    <span className={`${p.num} ${p.numAvail}`}>{availText}</span>
                    <span className={p.num} data-over={over || undefined}>
                      {on && volume ? int(volume) : '—'}
                    </span>
                    <span className={`${p.num} ${p.numFreq}`}>{freq ?? '—'}</span>
                    <span className={p.share}>
                      {on && allocation ? (
                        <PctInput
                          label={`Alocação de ${audience.name} em %`}
                          value={share}
                          onChange={(value) =>
                            update({ audienceAlloc: { ...draft.audienceAlloc, [id]: value } })
                          }
                        />
                      ) : on ? (
                        pct(share, 1)
                      ) : (
                        ''
                      )}
                    </span>
                    {(over || issue) && (
                      <p className={p.rowIssue} role="alert">
                        {over && hasPeriod && available !== undefined
                          ? `${audience.name}: o volume pedido (${int(volume)}) passa do disponível de ${dateBR(draft.startDate)} a ${dateBR(draft.endDate)}, que é ${int(available)}.`
                          : issue}
                      </p>
                    )}
                  </div>
                );
              })}
              {allocation && draft.audienceIds.length > 0 && (
                <Total value={audienceTotal} label="Alocação de públicos" />
              )}
            </div>
          )}
          {!hasPeriod && (
            <Help>Defina o período na etapa 2 para ver o disponível de cada público.</Help>
          )}
          <ErrorText>{errors.audiences}</ErrorText>
        </Group>
      </Section>
    </>
  );
}

/* ——— 5. Formulário ——— */
export function StepForm({ draft, update, errors }: StepProps) {
  const asset = mainAsset(draft);
  if (!asset)
    return <Alert title="Escolha o ativo primeiro">O briefing é definido pelo ativo.</Alert>;
  /* Mesma contagem da revisão: campos visíveis, sem o grupo repetível. */
  const visible = asset.fields.filter(
    (field) => fieldVisible(field, draft.formValues) && field.type !== 'condition',
  );
  const filled = visible.filter((field) => isFilled(field, draft.formValues[field.id])).length;
  return (
    <Section
      n="05"
      id="sec-briefing"
      title="Briefing"
      description={asset.name}
      meta={
        visible.length > 0 ? (
          <span className={p.sectionMeta}>
            {filled} de {visible.length} preenchidos · obrigatórios só no envio
          </span>
        ) : undefined
      }
    >
      {asset.fields.length === 0 ? (
        <div className={p.empty}>
          O ativo escolhido não pede informações adicionais no briefing.
        </div>
      ) : (
        <>
          {errors.form && <ErrorText>{errors.form}</ErrorText>}
          <BriefingFields
            fields={asset.fields}
            values={draft.formValues}
            errors={errors}
            period={{ start: draft.startDate, end: draft.endDate }}
            onChange={(id, value) => update({ formValues: { ...draft.formValues, [id]: value } })}
          />
        </>
      )}
    </Section>
  );
}

/* ——— 6. Revisão ——— */
/** Valor de um campo do briefing como texto de leitura (lista, arquivo, data, moeda). */
function valueText(field: BriefField, value: unknown) {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object' && value)
    return (value as { later?: boolean }).later
      ? 'Envio depois da contratação'
      : ((value as { name?: string }).name ?? '');
  if (field.type === 'date') return dateBR(String(value ?? ''));
  if (field.type === 'currency' && value) return brl(parseMoney(String(value)));
  return String(value ?? '');
}

function ReviewCard({
  title,
  step,
  goTo,
  wide,
  meta,
  children,
}: {
  title: string;
  step: number;
  goTo: (index: number) => void;
  wide?: boolean;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={p.card} data-wide={wide || undefined} aria-label={title}>
      <header className={p.cardHead}>
        <h3>{title}</h3>
        {meta && <span className={p.cardMeta}>{meta}</span>}
        <button
          type="button"
          className={p.editLink}
          onClick={() => goTo(step)}
          aria-label={`Editar ${title}`}
        >
          Editar
        </button>
      </header>
      {children}
    </section>
  );
}
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd data-empty={!children || undefined}>{children || '—'}</dd>
    </div>
  );
}

export function StepReview({ draft, goTo, campaignCount }: StepProps) {
  const asset = mainAsset(draft);
  const advertiser = byId(ADVERTISERS, draft.advertiserId);
  const model = effectiveModel(draft);
  const budget = parseMoney(draft.budget);
  const hasBudget = Number.isFinite(budget) && budget > 0;
  const pack = byId(PACKAGES, draft.packageId);
  const visible = asset
    ? asset.fields.filter(
        (field) => fieldVisible(field, draft.formValues) && field.type !== 'condition',
      )
    : [];
  const filled = visible.filter((field) => isFilled(field, draft.formValues[field.id])).length;
  /* Grupos repetíveis (ex.: versões por idioma): cada repetição vira uma linha, fora da contagem. */
  const repeated = asset
    ? asset.fields
        .filter((field) => field.type === 'condition' && fieldVisible(field, draft.formValues))
        .flatMap((field) => {
          const rows = Array.isArray(draft.formValues[field.id])
            ? (draft.formValues[field.id] as FormValues[])
            : [];
          return rows.map((row, index) => ({
            key: `${field.id}-${index}`,
            label: `${field.label} #${index + 1}`,
            text: (field.children ?? [])
              .map((child) => (isFilled(child, row[child.id]) ? valueText(child, row[child.id]) : ''))
              .filter(Boolean)
              .join(' · '),
          }));
        })
    : [];
  const missing = asset ? missingRequired(asset.fields, draft.formValues) : [];
  const states = asset
    ? asset.bonuses.map((rule) => ({
        rule,
        state: bonusState(rule, asset, hasBudget ? budget : 0, campaignCount, model),
      }))
    : [];
  const unlocked = states.filter((item) => item.state !== 'bloqueado');
  const period = days(draft.startDate, draft.endDate);
  const allocation = Boolean(asset?.allowAllocation);
  const reach = draft.audienceIds.reduce(
    (total, id) => total + (byId(AUDIENCES, id)?.size ?? 0),
    0,
  );
  const isPackage = draft.selectionKind === 'package';
  const extraPct = unlocked
    .filter((item) => item.rule.reward === 'Impressões extras')
    .reduce(
      (total, item) =>
        total + Number(/(\d+)%/.exec(`${item.rule.name} ${item.rule.description}`)?.[1] ?? 0),
      0,
    );
  const fixedPrice = isPackage ? pack?.totalPrice : asset?.basePrice;
  const estimate =
    asset && !isPackage && hasBudget && asset.basePrice > 0 ? estimateUnits(asset, budget) : 0;
  const shareOf = (ids: string[], alloc: Record<string, number>, id: string) =>
    allocation ? (alloc[id] ?? 0) : ids.length ? 100 / ids.length : 0;

  return (
    <>
      <BlockAlert draft={draft} />
      <section className={p.overview} aria-labelledby="revisao-nome">
        <div className={p.overviewHead}>
          {advertiser ? <BrandMark name={advertiser.name} size="lg" decorative /> : null}
          <div>
            <h2 id="revisao-nome" tabIndex={-1}>
              {draft.name || 'Campanha sem nome'}
            </h2>
            <span>
              {advertiser ? `${advertiser.name} · CNPJ ${advertiser.cnpj}` : 'Anunciante a definir'}
            </span>
          </div>
          <button
            type="button"
            className={p.editLink}
            onClick={() => goTo(0)}
            aria-label="Editar identificação"
          >
            Editar
          </button>
        </div>
        <dl className={p.kpis}>
          <div>
            <dt>Verba</dt>
            <dd>
              {hasBudget
                ? brl(budget)
                : model && !PRICING[model].needsBudget
                  ? model === 'bonus'
                    ? 'Sem cobrança'
                    : fixedPrice
                      ? brl(fixedPrice)
                      : 'Preço fechado'
                  : '—'}
            </dd>
            <small>
              {model
                ? `${PRICING[model].label}${!isPackage && asset?.basePrice && PRICING[model].needsBudget ? ` · ${brl(asset.basePrice)} por ${PRICING[model].unit.replace(' impressões', '')}` : isPackage ? ' · pacote' : ''}`
                : 'Modelo a definir'}
            </small>
          </div>
          <div>
            <dt>Entrega estimada</dt>
            <dd>{estimate ? `≈ ${int(estimate)}` : '—'}</dd>
            <small>
              {asset ? `${unitsLabel(asset)}${extraPct ? ` · +${extraPct}% com bônus` : ''}` : '—'}
            </small>
          </div>
          <div>
            <dt>Duração</dt>
            <dd>{period ? `${period} ${period === 1 ? 'dia' : 'dias'}` : '—'}</dd>
            <small>
              {period ? (
                <ShortRange start={draft.startDate} end={draft.endDate} />
              ) : (
                'Datas a definir'
              )}
            </small>
          </div>
          <div>
            <dt>Público potencial</dt>
            <dd>{reach ? int(reach) : '—'}</dd>
            <small>
              {draft.audienceIds.length
                ? `pessoas em ${draft.audienceIds.length} ${draft.audienceIds.length === 1 ? 'público' : 'públicos'}`
                : 'Nenhum público'}
            </small>
          </div>
        </dl>
      </section>

      <div className={p.reviewGrid}>
        <ReviewCard title="Ativo" step={1} goTo={goTo}>
          <dl className={p.facts}>
            <Row label={draft.selectionKind === 'package' ? 'Pacote' : 'Ativo'}>
              {draft.selectionKind === 'package' ? pack?.name : byId(ASSETS, draft.assetId)?.name}
            </Row>
            <Row label="Categoria">
              {CATEGORIES.find((item) => item.value === draft.category)?.label}
            </Row>
            {asset && (
              <Row label="Janela do ativo">
                <span
                  className={p.nowrap}
                >{`${dateBR(asset.window.start)} – ${dateBR(asset.window.end)}`}</span>
              </Row>
            )}
          </dl>
        </ReviewCard>

        <ReviewCard
          title="Precificação"
          step={2}
          goTo={goTo}
          meta={states.length ? `${unlocked.length} de ${states.length} bônus` : undefined}
        >
          <dl className={p.facts}>
            <Row label="Modelo">{model ? PRICING[model].label : ''}</Row>
          </dl>
          {states.length > 0 && (
            <ul className={p.bonusList}>
              {states.map(({ rule, state }) => {
                // Mesma leitura da lateral: no bloqueado por verba, quanto falta.
                const budgetRule = rule.conditions.find((condition) => condition.field === 'budget');
                const short =
                  state === 'bloqueado' && budgetRule && hasBudget ? budgetRule.value - budget : 0;
                return (
                  <li key={rule.id} data-state={state}>
                    <i aria-hidden="true" />
                    {rule.name}
                    <small title={state === 'bloqueado' ? bonusConditionText(rule) : undefined}>
                      {state === 'bloqueado'
                        ? short > 0
                          ? `Faltam ${brl(short)}`
                          : 'Bloqueado'
                        : state === 'incluido'
                          ? 'Incluído'
                          : 'Liberado'}
                    </small>
                  </li>
                );
              })}
            </ul>
          )}
        </ReviewCard>

        <ReviewCard
          title="Canais"
          step={3}
          goTo={goTo}
          meta={
            draft.channelIds.length
              ? `${draft.channelIds.length} ${draft.channelIds.length === 1 ? 'canal' : 'canais'}`
              : undefined
          }
        >
          {draft.channelIds.length ? (
            <Bars
              layout="inline"
              items={draft.channelIds.map((id) => {
                const share = shareOf(draft.channelIds, draft.channelAlloc, id);
                return {
                  name: byId(CHANNELS, id)?.name ?? id,
                  share,
                  note: hasBudget ? `≈ ${brl((budget * share) / 100, 0)}` : undefined,
                };
              })}
            />
          ) : (
            <p className={p.cardEmpty}>Nenhum canal marcado.</p>
          )}
        </ReviewCard>

        <ReviewCard
          title="Públicos"
          step={3}
          goTo={goTo}
          meta={
            draft.audienceIds.length
              ? `${draft.audienceIds.length} ${draft.audienceIds.length === 1 ? 'público' : 'públicos'}`
              : undefined
          }
        >
          {draft.audienceIds.length && asset ? (
            <Bars
              layout="inline"
              items={draft.audienceIds.map((id) => {
                const share = shareOf(draft.audienceIds, draft.audienceAlloc, id);
                const available = audienceAvailable(id, asset.pricing);
                return {
                  name: byId(AUDIENCES, id)?.name ?? id,
                  share,
                  note: `${int(audienceVolume(asset, hasBudget ? budget : 0, share))} un · disponível ${available !== undefined ? int(available) : 'sem limite'}`,
                };
              })}
            />
          ) : (
            <p className={p.cardEmpty}>Nenhum público marcado.</p>
          )}
        </ReviewCard>

        <ReviewCard
          title="Briefing"
          step={4}
          goTo={goTo}
          wide
          meta={visible.length ? `${filled} de ${visible.length} preenchidos` : undefined}
        >
          {visible.length === 0 ? (
            <p className={p.cardEmpty}>O ativo não pede briefing.</p>
          ) : (
            <dl className={p.briefList}>
              {visible.map((field) => {
                const value = draft.formValues[field.id];
                const ok = isFilled(field, value);
                const text = valueText(field, value);
                /* Falta em âmbar no rascunho; vermelho só quando a campanha vai para aprovação. */
                const state = ok
                  ? 'ok'
                  : missing.includes(field)
                    ? draft.submitNow
                      ? 'missing'
                      : 'warn'
                    : 'empty';
                return (
                  <div key={field.id}>
                    <dt>{field.label}</dt>
                    <dd data-state={state}>
                      {state === 'ok' ? text : state === 'empty' ? 'Não informado' : 'Falta'}
                    </dd>
                  </div>
                );
              })}
              {repeated.map((row) => (
                <div key={row.key}>
                  <dt>{row.label}</dt>
                  <dd data-state={row.text ? 'ok' : 'empty'}>{row.text || 'Não informado'}</dd>
                </div>
              ))}
            </dl>
          )}
        </ReviewCard>
      </div>
    </>
  );
}
