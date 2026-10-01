'use client';

import { useState } from 'react';
import { Mail, Megaphone, Monitor } from 'lucide-react';
import { campaigns, shortDate, type Campaign } from '../campanhas/campaign-data';
import {
  DateInput,
  InputControl,
  MoneyInput,
  SelectControl,
  isoDate,
  parseMoney,
  selectOptions,
  useFormValidation,
} from './controls';
import {
  CreationField,
  CreationFooter,
  CreationLayout,
  CreationSection,
  CreationSummary,
  MediaChoices,
} from './creation-ui';
import { navigate, type ViewMode } from './workspace-data';
import { formatCurrency } from './workspace-ui';
import f from '../../components/ds-v2/creation.module.css';

const media = [
  {
    value: 'Superbanner',
    title: 'Superbanner',
    description: 'Banner nas páginas do portal.',
    icon: Monitor,
  },
  {
    value: 'Newsletter',
    title: 'Newsletter',
    description: 'Envio de e-mail para a base.',
    icon: Mail,
  },
  {
    value: 'Redes sociais',
    title: 'Redes sociais',
    description: 'Publicações nos perfis sociais.',
    icon: Megaphone,
  },
];

export function CampaignEditor({
  mode,
  onSave,
}: {
  mode: ViewMode;
  onSave: (campaign: Campaign) => void;
}) {
  const { errors, validate, clearError, clearField } = useFormValidation();
  const [dirty, setDirty] = useState(false);
  const [draft, setDraft] = useState({
    name: '',
    advertiser: 'Aurora',
    budget: '',
    target: '50000',
    start: '2026-10-01',
    end: '2026-10-31',
    assets: [] as string[],
  });
  const update = (key: Exclude<keyof typeof draft, 'assets'>, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setDirty(true);
    clearField(key);
  };
  const cancel = () => navigate('campanhas', mode);
  const start = isoDate(draft.start);
  const end = isoDate(draft.end);
  const validPeriod = Boolean(start && end && end >= start);
  const days = validPeriod
    ? Math.round((Date.parse(`${end}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) / 86400000) + 1
    : 0;
  const budget = parseMoney(draft.budget);
  const target = Number(draft.target);
  const validBudget = Number.isFinite(budget) && budget >= 1;

  return (
    <CreationLayout
      aria-label="Criar campanha"
      back={cancel}
      backLabel="Voltar às campanhas"
      onInput={(event) => {
        clearError(event);
        const input = event.target as HTMLInputElement;
        if (input.name !== 'assets' && Object.hasOwn(draft, input.name))
          update(input.name as Exclude<keyof typeof draft, 'assets'>, input.value);
      }}
      onSubmit={(event) => {
        event.preventDefault();
        if (!validate(event.currentTarget, true)) return;
        const data = new FormData(event.currentTarget);
        const advertiser = String(data.get('advertiser'));
        const brand = campaigns.find((row) => row.advertiser === advertiser)!;
        onSave({
          id: `demo-${Date.now()}`,
          name: String(data.get('name')).trim(),
          advertiser,
          initials: brand.initials,
          identity: brand.identity,
          status: 'draft',
          assets: data.getAll('assets').map(String),
          budget: parseMoney(String(data.get('budget'))),
          delivered: 0,
          target: Number(data.get('target')),
          start: isoDate(String(data.get('start'))),
          end: isoDate(String(data.get('end'))),
        });
      }}
      aside={
        <CreationSummary
          title="Resumo da campanha"
          name={draft.name.trim() || 'Nova campanha'}
          subtitle={`${draft.advertiser} · Rascunho`}
          rows={[
            { label: 'Investimento', value: validBudget ? formatCurrency(budget) : 'A definir' },
            {
              label: 'Período',
              value: validPeriod ? `${shortDate(start)} – ${shortDate(end)}` : 'A definir',
            },
            { label: 'Duração', value: days ? `${days} ${days === 1 ? 'dia' : 'dias'}` : '—' },
            {
              label: 'Meta de impressões',
              value:
                Number.isInteger(target) && target > 0
                  ? target.toLocaleString('pt-BR')
                  : 'A definir',
            },
            {
              label: 'Mídias',
              value: draft.assets.length ? (
                <span className={f.summaryChips}>
                  {draft.assets.map((asset) => (
                    <span key={asset}>{asset}</span>
                  ))}
                </span>
              ) : (
                'Nenhuma selecionada'
              ),
            },
          ]}
          steps={[
            {
              id: 'campaign-identity',
              label: 'Informações da campanha',
              complete: Boolean(draft.name.trim()),
            },
            {
              id: 'campaign-planning',
              label: 'Investimento e período',
              complete: validBudget && validPeriod && Number.isInteger(target) && target > 0,
            },
            {
              id: 'campaign-media',
              label: 'Mídias selecionadas',
              complete: draft.assets.length > 0,
            },
          ]}
        />
      }
      footer={
        <CreationFooter
          cancel={cancel}
          submitLabel="Criar rascunho"
          dirty={dirty}
          errors={errors}
        />
      }
    >
      <CreationSection id="campaign-identity" number="01" title="Informações da campanha">
        <div className={f.grid}>
          <CreationField
            id="campaign-name"
            label="Nome da campanha"
            required
            wide
            meta={draft.name.length >= 96 ? `${draft.name.length}/120` : undefined}
          >
            <InputControl
              id="campaign-name"
              name="name"
              error={errors.name}
              required
              maxLength={120}
              placeholder="Ex.: Francal · Outubro 2026"
            />
          </CreationField>
          <CreationField id="campaign-advertiser" label="Anunciante" required wide>
            <SelectControl
              id="campaign-advertiser"
              name="advertiser"
              label="Anunciante"
              value={draft.advertiser}
              onValueChange={(value) => update('advertiser', value)}
              options={selectOptions(
                [...new Set(campaigns.map((row) => row.advertiser))].filter(
                  (name) => mode !== 'anunciante' || name === 'Aurora',
                ),
              )}
            />
          </CreationField>
        </div>
      </CreationSection>
      <CreationSection id="campaign-planning" number="02" title="Investimento e período">
        <div className={f.grid}>
          <CreationField id="campaign-budget" label="Verba planejada (R$)" required>
            <MoneyInput id="campaign-budget" name="budget" error={errors.budget} required min="1" />
          </CreationField>
          <CreationField id="campaign-target" label="Meta de impressões" required>
            <InputControl
              id="campaign-target"
              name="target"
              type="number"
              error={errors.target}
              required
              min="1"
              step="1"
              defaultValue="50000"
            />
          </CreationField>
          <CreationField id="campaign-start" label="Início" required>
            <DateInput
              id="campaign-start"
              name="start"
              label="Início"
              error={errors.start}
              required
              defaultValue="2026-10-01"
              onValueChange={(value) => update('start', value)}
            />
          </CreationField>
          <CreationField id="campaign-end" label="Término" required>
            <DateInput
              id="campaign-end"
              name="end"
              label="Término"
              error={errors.end}
              required
              defaultValue="2026-10-31"
              onValueChange={(value) => update('end', value)}
            />
          </CreationField>
        </div>
      </CreationSection>
      <CreationSection
        id="campaign-media"
        number="03"
        title="Mídia e entrega"
        description="Selecione uma ou mais mídias."
      >
        <MediaChoices
          label="Ativos de mídia"
          name="assets"
          choices={media}
          selected={draft.assets}
          error={errors.assets}
          change={(value) => {
            setDraft((current) => ({
              ...current,
              assets: current.assets.includes(value)
                ? current.assets.filter((asset) => asset !== value)
                : [...current.assets, value],
            }));
            clearField('assets');
            setDirty(true);
          }}
        />
      </CreationSection>
    </CreationLayout>
  );
}
