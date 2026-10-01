'use client';

import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { Check, Circle, Clock3, type LucideIcon } from 'lucide-react';
import s from './patterns.module.css';

export type TimelineState = 'complete' | 'current' | 'upcoming';

export type TimelineItem = {
  title: string;
  description?: string;
  date?: string;
  dateTime?: string;
  meta?: string;
  state?: TimelineState;
  icon?: LucideIcon;
};

export function Timeline({
  items,
  label = 'Linha do tempo',
}: {
  items: TimelineItem[];
  label?: string;
}) {
  return (
    <ol className={s.timeline} aria-label={label}>
      {items.map((item, index) => {
        const state = item.state ?? 'complete';
        const MarkerIcon =
          item.icon ?? (state === 'complete' ? Check : state === 'current' ? Clock3 : Circle);

        return (
          <li
            key={`${item.title}-${item.date ?? index}`}
            className={s.timelineItem}
            data-state={state}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span className={s.timelineMarker} aria-hidden="true">
              <MarkerIcon size={16} strokeWidth={2} />
            </span>
            <div className={s.timelineContent}>
              <div className={s.timelineHeading}>
                <strong>{item.title}</strong>
                {item.date && <time dateTime={item.dateTime}>{item.date}</time>}
              </div>
              {item.description && <p>{item.description}</p>}
              {item.meta && <small>{item.meta}</small>}
              <span className={s.srOnly}>
                {state === 'complete'
                  ? 'Concluído'
                  : state === 'current'
                    ? 'Etapa atual'
                    : 'Próximo'}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function Stepper({
  steps,
  current,
  orientation = 'horizontal',
  label = 'Etapas',
  onStepChange,
}: {
  steps: { label: string; description?: string }[];
  current: number;
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  onStepChange?: (step: number) => void;
}) {
  return (
    <ol className={s.stepper} data-orientation={orientation} aria-label={label}>
      {steps.map((step, index) => (
        <li
          key={step.label}
          data-complete={index < current || undefined}
          aria-current={index === current ? 'step' : undefined}
        >
          <span className={s.stepMarker} aria-hidden="true">
            {index < current ? <Check size={13} /> : index + 1}
          </span>
          <span className={s.stepText}>
            {onStepChange && index < current ? (
              <button type="button" onClick={() => onStepChange(index)}>
                {step.label}
              </button>
            ) : (
              <strong>{step.label}</strong>
            )}
            {step.description && <small>{step.description}</small>}
            <span className={s.srOnly}>
              {index < current ? 'Concluída' : index > current ? 'Pendente' : 'Atual'}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function ChoiceCard({
  title,
  description,
  preview,
  children,
  ...input
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'title' | 'children'> & {
  title: string;
  description?: string;
  preview?: ReactNode;
  children?: ReactNode;
}) {
  const uid = useId();
  return (
    <label className={s.choiceCard}>
      <input
        {...input}
        type={input.type ?? 'radio'}
        aria-labelledby={`${uid}-title`}
        aria-describedby={description ? `${uid}-description` : undefined}
      />
      {preview && (
        <span className={s.choicePreview} aria-hidden="true">
          {preview}
        </span>
      )}
      <span className={s.choiceContent}>
        <strong id={`${uid}-title`}>{title}</strong>
        {description && <small id={`${uid}-description`}>{description}</small>}
        {children}
      </span>
    </label>
  );
}
