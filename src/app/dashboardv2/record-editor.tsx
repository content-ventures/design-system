'use client';

import { useState } from 'react';
import { Mail, Megaphone, Monitor } from 'lucide-react';
import {
  DateInput,
  InputControl,
  MoneyInput,
  SelectControl,
  TextareaControl,
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
import {
  navigate,
  screens,
  type DemoRecord,
  type Field,
  type ScreenKey,
  type ViewMode,
} from './workspace-data';
import { displayValue } from './workspace-ui';
import f from '../../components/ds-v2/creation.module.css';

export type RecordChoices = { channels: string[]; audiences: string[] };
const hints: Partial<Record<ScreenKey, Record<string, string>>> = {
  inventario: {
    audience: 'Selecione uma base cadastrada em Públicos.',
    remaining: 'Quantidade ainda disponível para contratação.',
  },
  publicos: {
    size: 'Informe o número de pessoas, não de impressões.',
  },
  metricas: {
    pricing: 'Permite usar esta métrica no cálculo de preços.',
  },
};
const namePlaceholders: Partial<Record<ScreenKey, string>> = {
  inventario: 'Ex.: Superbanner · Página inicial',
  publicos: 'Ex.: Comunidade de arquitetura',
  canais: 'Ex.: Newsletter Francal',
  metricas: 'Ex.: Impressões qualificadas',
};
const formats = [
  {
    value: 'Display',
    title: 'Display',
    description: 'Banners no portal.',
    icon: Monitor,
  },
  { value: 'E-mail', title: 'E-mail', description: 'Newsletters e envios à base.', icon: Mail },
  {
    value: 'Social',
    title: 'Social',
    description: 'Publicações nas redes sociais.',
    icon: Megaphone,
  },
];

export function RecordEditor({
  screen,
  initial,
  mode,
  save,
  cancel,
  choices,
}: {
  screen: ScreenKey;
  initial?: DemoRecord;
  mode: ViewMode;
  save: (record: DemoRecord) => void;
  cancel?: () => void;
  choices?: RecordChoices;
}) {
  const config = screens[screen];
  const { errors, validate, clearError, clearField } = useFormValidation();
  const optionsFor = (field: Field) => {
    const linked =
      screen === 'inventario'
        ? field.key === 'channel'
          ? choices?.channels
          : field.key === 'audience'
            ? choices?.audiences
            : undefined
        : undefined;
    const options = linked?.length ? linked : field.options;
    const existing = initial?.[field.key];
    return options && existing && !options.includes(String(existing))
      ? [String(existing), ...options]
      : options;
  };
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      config.fields.map((field) => [
        field.key,
        String(
          initial?.[field.key] ?? optionsFor(field)?.[0] ?? (field.type === 'number' ? 0 : ''),
        ),
      ]),
    ),
  );
  const [dirty, setDirty] = useState(false);
  const update = (name: string, value: string) => {
    setDraft((current) => ({ ...current, [name]: value }));
    clearField(name);
    setDirty(true);
  };
  const back = cancel ?? (() => navigate(screen, mode));
  const sections =
    screen === 'inventario'
      ? [
          {
            id: 'record-identity',
            title: 'Identidade do ativo',
            keys: ['name', 'format'],
          },
          {
            id: 'record-reach',
            title: 'Canal e público',
            keys: ['channel', 'audience'],
          },
          {
            id: 'record-availability',
            title: 'Disponibilidade e valor',
            keys: ['remaining', 'price', 'status'],
          },
        ]
      : screen === 'publicos'
        ? [
            {
              id: 'record-identity',
              title: 'Identidade do público',
              keys: ['name', 'category'],
            },
            {
              id: 'record-reach',
              title: 'Composição da base',
              keys: ['size', 'origin', 'assets'],
            },
            {
              id: 'record-availability',
              title: 'Situação do público',
              keys: ['status'],
            },
          ]
        : [
            {
              id: 'record-identity',
              title: 'Informações principais',
              keys: ['name'],
            },
            {
              id: 'record-details',
              title: 'Detalhes do cadastro',
              keys: config.fields.filter((field) => field.key !== 'name').map((field) => field.key),
            },
          ];
  const fieldComplete = (field: Field) => {
    const value = draft[field.key]?.trim() ?? '';
    if (field.key === 'name') return Boolean(value);
    if (field.type === 'number')
      return value !== '' && Number.isInteger(Number(value)) && Number(value) >= 0;
    if (field.type === 'currency')
      return Number.isFinite(parseMoney(value)) && parseMoney(value) >= 0;
    if (field.type === 'date') return !value || Boolean(isoDate(value));
    if (field.type === 'email') return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return optionsFor(field) ? Boolean(value) : true;
  };
  const preview = (field: Field) => {
    const value = draft[field.key];
    if (!value?.trim()) return 'A definir';
    if ((field.type === 'currency' || field.type === 'number') && !fieldComplete(field))
      return 'A revisar';
    return displayValue(
      field.type === 'currency'
        ? parseMoney(value)
        : field.type === 'date'
          ? isoDate(value)
          : value,
      field,
    );
  };
  const summaryKeys =
    screen === 'inventario'
      ? ['format', 'channel', 'audience', 'remaining', 'price']
      : screen === 'publicos'
        ? ['category', 'size', 'origin', 'assets']
        : config.fields
            .filter((field) => field.key !== 'name' && field.key !== 'status')
            .slice(0, 4)
            .map((field) => field.key);

  const renderField = (field: Field) => {
    const id = `record-${field.key}`;
    const hint = hints[screen]?.[field.key];
    const descriptionId = hint ? `${id}-hint` : undefined;
    const options = optionsFor(field);
    if (screen === 'inventario' && field.key === 'format')
      return (
        <div key={field.key} className={f.field} data-wide>
          <p className={f.groupLabel}>
            Formato de mídia
            <span className={f.required} aria-hidden="true">
              *
            </span>
          </p>
          <MediaChoices
            type="radio"
            name="format"
            label="Formato de mídia"
            choices={formats}
            selected={[draft.format!]}
            change={(value) => update('format', value)}
          />
        </div>
      );
    const required = field.key === 'name' || field.type === 'number' || field.type === 'currency';
    return (
      <CreationField
        key={field.key}
        id={id}
        label={field.label}
        required={required}
        wide={field.key === 'name' || field.type === 'textarea'}
        hint={hint}
        meta={
          field.key === 'name' && (draft.name?.length ?? 0) >= 160
            ? `${draft.name?.length ?? 0}/200`
            : undefined
        }
      >
        {options ? (
          <SelectControl
            id={id}
            label={field.label}
            name={field.key}
            value={draft[field.key]}
            options={selectOptions(options)}
            onValueChange={(value) => update(field.key, value)}
            descriptionId={descriptionId}
          />
        ) : field.type === 'textarea' ? (
          <TextareaControl
            id={id}
            name={field.key}
            rows={4}
            error={errors[field.key]}
            defaultValue={initial?.[field.key] ?? ''}
            aria-describedby={descriptionId}
          />
        ) : field.type === 'date' ? (
          <DateInput
            id={id}
            name={field.key}
            label={field.label}
            defaultValue={draft[field.key]}
            error={errors[field.key]}
            onValueChange={(value) => update(field.key, value)}
            descriptionId={descriptionId}
          />
        ) : field.type === 'currency' ? (
          <MoneyInput
            id={id}
            name={field.key}
            error={errors[field.key]}
            required
            min={0}
            defaultValue={
              initial?.[field.key] === undefined ? undefined : Number(initial[field.key])
            }
            aria-describedby={descriptionId}
          />
        ) : (
          <InputControl
            id={id}
            name={field.key}
            type={field.type ?? 'text'}
            error={errors[field.key]}
            required={required}
            min={field.type === 'number' ? 0 : undefined}
            step={field.type === 'number' ? 1 : undefined}
            maxLength={field.type ? undefined : 200}
            defaultValue={draft[field.key]}
            placeholder={
              field.key === 'name'
                ? namePlaceholders[screen]
                : field.type === 'email'
                  ? 'nome@empresa.com.br'
                  : undefined
            }
            suffix={field.key === 'size' ? 'pessoas' : undefined}
            aria-describedby={descriptionId}
          />
        )}
      </CreationField>
    );
  };

  return (
    <CreationLayout
      aria-label={initial ? `Editar ${initial.name}` : config.create}
      back={back}
      backLabel={initial ? 'Voltar ao registro' : `Voltar para ${config.title.toLowerCase()}`}
      onInput={(event) => {
        clearError(event);
        const input = event.target as HTMLInputElement;
        if (input.name && input.type !== 'radio') update(input.name, input.value);
      }}
      onSubmit={(event) => {
        event.preventDefault();
        if (!validate(event.currentTarget)) return;
        const data = new FormData(event.currentTarget);
        const values = Object.fromEntries(
          config.fields.map((field) => [
            field.key,
            field.type === 'date'
              ? isoDate(String(data.get(field.key)))
              : field.type === 'currency'
                ? parseMoney(String(data.get(field.key)))
                : field.type === 'number'
                  ? Number(data.get(field.key))
                  : String(data.get(field.key) ?? '').trim(),
          ]),
        );
        save({
          ...initial,
          ...values,
          id: initial?.id ?? `demo-${Date.now()}`,
          name: String(values.name),
          status: String(values.status ?? initial?.status ?? 'Ativo'),
        });
      }}
      aside={
        <CreationSummary
          title={
            screen === 'inventario'
              ? 'Resumo do ativo'
              : screen === 'publicos'
                ? 'Resumo do público'
                : 'Resumo do cadastro'
          }
          name={draft.name?.trim() || config.create || 'Novo registro'}
          subtitle={draft.status ?? config.title}
          rows={summaryKeys
            .map((key) => config.fields.find((field) => field.key === key))
            .filter((field): field is Field => Boolean(field))
            .map((field) => ({ label: field.label, value: preview(field) }))}
          steps={sections
            .filter((section) => section.keys.length)
            .map((section) => ({
              id: section.id,
              label: section.title,
              complete: config.fields
                .filter((field) => section.keys.includes(field.key))
                .every(fieldComplete),
            }))}
        />
      }
      footer={<CreationFooter cancel={back} dirty={dirty} errors={errors} />}
    >
      {initial && <p className={f.sectionHint}>Editando {initial.name}</p>}
      {sections
        .filter((section) => section.keys.length)
        .map((section, index) => (
          <CreationSection
            key={section.id}
            id={section.id}
            number={String(index + 1).padStart(2, '0')}
            title={section.title}
          >
            <div className={f.grid}>
              {section.keys
                .map((key) => config.fields.find((field) => field.key === key))
                .filter((field): field is Field => Boolean(field))
                .map(renderField)}
            </div>
          </CreationSection>
        ))}
    </CreationLayout>
  );
}
