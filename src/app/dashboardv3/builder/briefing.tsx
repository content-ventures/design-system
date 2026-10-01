'use client';

import { Check, Plus, Trash2, UploadCloud } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  Button,
  Checkbox,
  DatePicker,
  Field,
  IconButton,
  Input,
  Meter,
  Textarea,
} from '@/components/ds-v3';
import { Select } from '@/components/ds-v3/select';
import type { BriefField } from '../domain';
import { brl, fieldVisible, type FormValues } from '../pricing';
import p from './parts.module.css';

type UploadValue = {
  name?: string;
  size?: number;
  type?: string;
  url?: string;
  later?: boolean;
  width?: number;
  height?: number;
};

const DEFAULT_ACCEPT =
  'image/jpeg,image/png,image/gif,image/webp,image/svg+xml,video/mp4,video/webm,video/quicktime,application/pdf,.doc,.docx,.xls,.xlsx,.pptx,text/csv,application/zip';
const MAX = 25 * 1024 * 1024;
const kb = (size = 0) =>
  size > 1024 * 1024
    ? `${(size / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
    : `${Math.max(1, Math.round(size / 1024))} KB`;
const EXT: Record<string, string> = {
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'image/gif': 'GIF',
  'image/webp': 'WEBP',
  'image/svg+xml': 'SVG',
  'video/mp4': 'MP4',
  'video/webm': 'WEBM',
  'video/quicktime': 'MOV',
  'application/pdf': 'PDF',
  'application/zip': 'ZIP',
  'text/html': 'HTML',
  'text/csv': 'CSV',
};

/** Especificação do arquivo lida do campo: formatos, medidas e limite. */
function specOf(field: BriefField) {
  const accept = field.accept ?? DEFAULT_ACCEPT;
  const formats = [
    ...new Set(
      accept
        .split(',')
        .map((rule) => EXT[rule.trim()] ?? rule.trim().replace(/^\./, '').toUpperCase()),
    ),
  ];
  const match = /(\d+)\s*[×x]\s*(\d+)\s*px/.exec(field.help ?? '');
  const width = match ? Number(match[1]) : undefined;
  const height = match ? Number(match[2]) : undefined;
  const note = (field.help ?? '')
    .replace(/PNG, JPG ou WEBP até 25 MB\.?/i, '')
    .replace(/Tamanho:\s*\d+\s*[×x]\s*\d+\s*px\.?/i, '')
    .trim();
  return { accept, formats, width, height, note };
}

/** Quadro na proporção exata da peça. */
function Ratio({ width, height, url }: { width?: number; height?: number; url?: string }) {
  const ratio = width && height ? width / height : 4 / 3;
  const frameW = ratio >= 1 ? 120 : Math.max(36, 72 * ratio);
  const frameH = ratio >= 1 ? Math.max(24, 120 / ratio) : 72;
  return (
    <span className={p.ratio} style={{ width: frameW, height: frameH }} aria-hidden="true">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- prévia local de arquivo (blob:), fora do otimizador
        <img src={url} alt="" />
      ) : width && height ? (
        <span>{`${width} × ${height}`}</span>
      ) : (
        <UploadCloud />
      )}
    </span>
  );
}

function Upload({
  field,
  value,
  onChange,
  invalid,
  describedBy,
  inputId,
}: {
  field: BriefField;
  value: UploadValue | undefined;
  onChange: (value: UploadValue | undefined) => void;
  invalid?: boolean;
  describedBy?: string;
  inputId: string;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [pending, setPending] = useState<UploadValue | null>(null);
  const [error, setError] = useState<string>();
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const spec = specOf(field);

  useEffect(() => {
    if (progress === null || !pending) return;
    if (progress >= 100) {
      onChange(pending);
      setPending(null);
      setProgress(null);
      return;
    }
    const timer = window.setTimeout(
      () => setProgress((value) => Math.min(100, (value ?? 0) + 18)),
      120,
    );
    return () => window.clearTimeout(timer);
  }, [progress, pending, onChange]);

  function take(file: File | undefined) {
    if (!file) return setError('Selecione um arquivo para enviar.');
    const allowed = spec.accept.split(',').map((item) => item.trim());
    const ok = allowed.some((rule) =>
      rule.startsWith('.')
        ? file.name.toLowerCase().endsWith(rule)
        : rule.endsWith('/*')
          ? file.type.startsWith(rule.slice(0, -1))
          : file.type === rule,
    );
    if (!ok)
      return setError(
        `Formato não aceito para o arquivo do briefing: ${file.type || 'desconhecido'}. Envie ${spec.formats.join(', ')}.`,
      );
    if (file.size > MAX) return setError('O arquivo do briefing excede o limite de 25 MB.');
    setError(undefined);
    const url = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
    const next: UploadValue = { name: file.name, size: file.size, type: file.type, url };
    setPending(next);
    setProgress(0);
    if (url) {
      const image = new Image();
      image.onload = () =>
        setPending((current) =>
          current && current.url === url
            ? { ...current, width: image.naturalWidth, height: image.naturalHeight }
            : current,
        );
      image.src = url;
    }
  }

  /* Especificação numa legenda só (sem chips): formatos, medidas e limite. */
  const specRow = (
    <span className={p.specs}>
      {[
        spec.formats.join(' · '),
        spec.width && spec.height ? `${spec.width} × ${spec.height} px` : undefined,
        'até 25 MB',
      ]
        .filter(Boolean)
        .join(' · ')}
    </span>
  );
  /* "Enviar depois" fica visível em todos os estados: escolher o arquivo não move a grade. */
  const laterToggle = field.allowLater ? (
    <Checkbox
      checked={Boolean(value?.later)}
      disabled={progress !== null}
      onChange={(event) => {
        // Um erro de formato não vale para quem escolheu enviar depois.
        setError(undefined);
        onChange(event.target.checked ? { later: true } : undefined);
      }}
      label="Enviar depois da contratação"
    />
  ) : null;

  if (progress !== null && pending) {
    return (
      <div className={p.uploadWrap}>
        <div className={p.file} aria-live="polite">
          <Ratio width={spec.width} height={spec.height} url={pending.url} />
          <span className={p.fileText}>
            <strong>Enviando {pending.name}…</strong>
            <Meter value={progress} label={`Envio de ${pending.name}`} size="sm" />
          </span>
        </div>
        {laterToggle}
      </div>
    );
  }
  if (value?.name) {
    const checked = spec.width && spec.height && value.width && value.height;
    const matches = checked && value.width === spec.width && value.height === spec.height;
    return (
      <div className={p.uploadWrap}>
        <div className={p.file}>
          <Ratio
            width={value.width ?? spec.width}
            height={value.height ?? spec.height}
            url={value.url}
          />
          <span className={p.fileText}>
            <strong>{value.name}</strong>
            <span>
              {[
                value.width && value.height ? `${value.width} × ${value.height} px` : undefined,
                kb(value.size),
                EXT[value.type ?? ''] ?? value.type ?? 'arquivo',
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
            {checked ? (
              <span className={p.fileCheck} data-ok={matches || undefined}>
                {matches ? <Check aria-hidden="true" /> : null}
                {matches
                  ? 'Medidas conferem com o formato do ativo'
                  : `Esperado ${spec.width} × ${spec.height} px; o portal pode recusar a peça`}
              </span>
            ) : null}
          </span>
          <IconButton
            label={`Remover ${value.name}`}
            icon={Trash2}
            variant="ghost"
            size="sm"
            onClick={() => {
              setError(undefined);
              onChange(undefined);
            }}
          />
        </div>
        {laterToggle}
      </div>
    );
  }
  return (
    <div className={p.uploadWrap}>
      {value?.later ? (
        <div className={p.file}>
          <Ratio width={spec.width} height={spec.height} />
          <span className={p.fileText}>
            <span>Este arquivo foi marcado para envio depois da contratação.</span>
            {specRow}
          </span>
        </div>
      ) : (
        <div
          className={p.dropzone}
          data-over={over || undefined}
          data-invalid={invalid || undefined}
          onClick={(event) => {
            if (event.target === inputRef.current) return;
            inputRef.current?.click();
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setOver(false);
            take(event.dataTransfer.files[0]);
          }}
        >
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={spec.accept}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            onChange={(event) => take(event.target.files?.[0])}
          />
          <Ratio width={spec.width} height={spec.height} />
          <span className={p.dropText}>
            <strong>Arraste a peça aqui ou escolha um arquivo</strong>
            {/* O erro ocupa o lugar da especificação: a área não muda de altura. */}
            {error ? (
              <span role="alert" className={p.uploadError}>
                {error}
              </span>
            ) : (
              specRow
            )}
            {spec.note && <span className={p.dropNote}>{spec.note}</span>}
          </span>
          <span className={p.dropButton}>Escolher arquivo</span>
        </div>
      )}
      {laterToggle}
    </div>
  );
}

/** Período da campanha, para dar contexto às datas do briefing (ex.: entrega antes do início). */
type Period = { start: string; end: string };

function FieldControl({
  field,
  value,
  onChange,
  error,
  period,
}: {
  field: BriefField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  period?: Period;
}) {
  const hint =
    field.type === 'number' || field.type === 'currency'
      ? [
          field.help,
          field.min !== undefined
            ? `Mínimo ${field.type === 'currency' ? brl(field.min) : field.min.toLocaleString('pt-BR')}`
            : '',
          field.max !== undefined
            ? `máximo ${field.type === 'currency' ? brl(field.max) : field.max.toLocaleString('pt-BR')}`
            : '',
        ]
          .filter(Boolean)
          .join(' · ')
      : field.type === 'file_upload'
        ? undefined
        : field.help;
  return (
    <Field label={field.label} required={field.required} error={error} hint={hint || undefined}>
      {({ id, describedBy, invalid }) => {
        switch (field.type) {
          case 'textarea':
            return (
              <Textarea
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                maxLength={field.max}
                rows={2}
                value={String(value ?? '')}
                onChange={(event) => onChange(event.target.value)}
              />
            );
          case 'number':
            return (
              <Input
                id={id}
                type="number"
                inputMode="numeric"
                aria-describedby={describedBy}
                invalid={invalid}
                min={field.min}
                max={field.max}
                value={String(value ?? '')}
                onChange={(event) => onChange(event.target.value)}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              />
            );
          case 'currency':
            return (
              <Input
                id={id}
                prefix="R$"
                inputMode="decimal"
                placeholder="0,00"
                aria-describedby={describedBy}
                invalid={invalid}
                value={String(value ?? '')}
                onChange={(event) => onChange(event.target.value)}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              />
            );
          case 'date':
            return (
              <DatePicker
                id={id}
                describedBy={describedBy}
                invalid={invalid}
                value={String(value ?? '')}
                onChange={onChange}
                window={
                  period?.start && period.end
                    ? { start: period.start, end: period.end, label: 'Veiculação' }
                    : undefined
                }
              />
            );
          case 'select':
            return (
              <Select
                id={id}
                describedBy={describedBy}
                invalid={invalid}
                value={String(value ?? '')}
                onChange={onChange}
                options={(field.options ?? []).map((option) => ({ value: option, label: option }))}
              />
            );
          case 'multiselect': {
            const list = Array.isArray(value) ? (value as string[]) : [];
            return (
              <div
                className={p.pills}
                role="group"
                aria-label={field.label}
                aria-describedby={describedBy}
                id={id}
              >
                {(field.options ?? []).map((option) => {
                  const on = list.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      className={p.pill}
                      aria-pressed={on}
                      onClick={() =>
                        onChange(on ? list.filter((item) => item !== option) : [...list, option])
                      }
                    >
                      {on && <Check aria-hidden="true" />}
                      {option}
                    </button>
                  );
                })}
              </div>
            );
          }
          case 'file_upload':
            return (
              <Upload
                field={field}
                inputId={id}
                describedBy={describedBy}
                invalid={invalid}
                value={value as UploadValue | undefined}
                onChange={onChange}
              />
            );
          default:
            return (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                placeholder={field.placeholder}
                maxLength={field.max}
                value={String(value ?? '')}
                onChange={(event) => onChange(event.target.value)}
              />
            );
        }
      }}
    </Field>
  );
}

function ConditionGroup({
  field,
  value,
  onChange,
  period,
}: {
  field: BriefField;
  value: unknown;
  onChange: (value: unknown) => void;
  period?: Period;
}) {
  const rows = Array.isArray(value) ? (value as FormValues[]) : [{}];
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <span className={p.label}>{field.label}</span>
      {rows.map((row, index) => (
        <div key={index} className={p.group}>
          <div className={p.groupHead}>
            <span>#{index + 1}</span>
            {rows.length > 1 && (
              <IconButton
                label={`Remover ${field.label} #${index + 1}`}
                icon={Trash2}
                size="sm"
                variant="ghost"
                onClick={() => onChange(rows.filter((_, i) => i !== index))}
              />
            )}
          </div>
          {(field.children ?? []).map((child) => (
            <FieldControl
              key={child.id}
              field={child}
              value={row[child.id]}
              period={period}
              onChange={(next) =>
                onChange(
                  rows.map((item, i) => (i === index ? { ...item, [child.id]: next } : item)),
                )
              }
            />
          ))}
        </div>
      ))}
      <div>
        <Button size="sm" variant="ghost" icon={Plus} onClick={() => onChange([...rows, {}])}>
          Adicionar {field.label.toLowerCase()}
        </Button>
      </div>
    </div>
  );
}

export function BriefingFields({
  fields,
  values,
  onChange,
  errors,
  period,
}: {
  fields: BriefField[];
  values: FormValues;
  onChange: (id: string, value: unknown) => void;
  errors: Record<string, string>;
  /** Período de veiculação: os calendários do briefing o marcam (sem bloquear dias). */
  period?: Period;
}) {
  const visible = fields.filter((field) => fieldVisible(field, values));
  const isWide = (field: BriefField) => field.type === 'file_upload' || field.type === 'condition';
  return (
    <div className={p.fields}>
      {visible.map((field, index) => {
        const conditional = Boolean(field.showIf);
        const wide = isWide(field);
        /* Texto longo seguido de um campo de meia largura ocupa duas linhas: a grade não abre buraco. */
        const next = visible[index + 1];
        const tall = field.type === 'textarea' && next !== undefined && !isWide(next);
        return (
          <div
            key={field.id}
            className={conditional ? p.conditional : undefined}
            data-wide={wide || undefined}
            data-tall={tall || undefined}
          >
            {field.type === 'condition' ? (
              <ConditionGroup
                field={field}
                value={values[field.id]}
                period={period}
                onChange={(next) => onChange(field.id, next)}
              />
            ) : (
              <FieldControl
                field={field}
                value={values[field.id]}
                error={errors[`field-${field.id}`]}
                period={period}
                onChange={(next) => onChange(field.id, next)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
