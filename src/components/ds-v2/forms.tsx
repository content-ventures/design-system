'use client';

import { ArrowLeft, ArrowRight, Check, Circle, CircleCheck, type LucideIcon } from 'lucide-react';
import { useId, type ComponentProps, type ReactNode } from 'react';
import f from './creation.module.css';
import { Button as FormButton } from './button';

export function CreationField({
  id,
  label,
  required,
  hint,
  meta,
  wide,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  meta?: ReactNode;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={f.field} data-wide={wide}>
      <div className={f.fieldLabel}>
        <label htmlFor={id}>
          {label}
          {required && (
            <span aria-hidden="true" className={f.required}>
              *
            </span>
          )}
        </label>
        {meta && <span className={f.fieldMeta}>{meta}</span>}
      </div>
      {children}
      {hint && (
        <p className={f.hint} id={`${id}-hint`}>
          {hint}
        </p>
      )}
    </div>
  );
}

export function CreationSection({
  id,
  number,
  title,
  description,
  children,
}: {
  id: string;
  number: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className={f.section} aria-labelledby={`${id}-title`}>
      <header className={f.sectionHeader}>
        <span className={f.sectionNumber}>{number}</span>
        <div>
          <h2 id={id} tabIndex={-1}>
            <span id={`${id}-title`}>{title}</span>
          </h2>
          {description && <p>{description}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

export function CreationLayout({
  back,
  backLabel,
  aside,
  children,
  footer,
  ...props
}: ComponentProps<'form'> & {
  back: () => void;
  backLabel: string;
  aside: ReactNode;
  footer: ReactNode;
}) {
  return (
    <form {...props} noValidate className={f.form}>
      <div className={f.intro}>
        <FormButton variant="ghost" icon={ArrowLeft} onClick={back}>
          {backLabel}
        </FormButton>
        <span>
          <span aria-hidden="true">*</span> Campos obrigatórios
        </span>
      </div>
      <div className={f.layout}>
        <div className={f.sections}>{children}</div>
        {aside}
      </div>
      {footer}
    </form>
  );
}

export function CreationFooter({
  cancel,
  submitLabel = 'Salvar',
  dirty,
  errors,
}: {
  cancel: () => void;
  submitLabel?: string;
  dirty: boolean;
  errors: Record<string, string>;
}) {
  const count = Object.keys(errors).length;
  return (
    <footer className={f.footer}>
      {dirty && (
        <div className={f.saveState}>
          <span className={f.stateDot} aria-hidden="true" />
          <span>Alterações ainda não salvas</span>
        </div>
      )}
      {count > 0 && (
        <p role="alert" className={f.errorCount}>
          Revise {count === 1 ? 'o campo sinalizado' : `os ${count} campos sinalizados`}.
        </p>
      )}
      <div className={f.footerButtons}>
        <FormButton onClick={cancel}>Cancelar</FormButton>
        <FormButton type="submit" variant="primary" icon={Check}>
          {submitLabel}
        </FormButton>
      </div>
    </footer>
  );
}

export function CreationSummary({
  title,
  name,
  subtitle,
  rows,
  steps,
}: {
  title: string;
  name: string;
  subtitle: string;
  rows: { label: string; value: ReactNode }[];
  steps: { id: string; label: string; complete: boolean }[];
}) {
  const id = useId();
  return (
    <aside className={f.aside} aria-labelledby={id}>
      <div className={f.summary}>
        <div className={f.summaryHeading}>
          <h2 id={id}>{title}</h2>
        </div>
        <div className={f.summaryIdentity}>
          <div>
            <strong>{name}</strong>
            <span>{subtitle}</span>
          </div>
        </div>
        <dl className={f.summaryValues}>
          {rows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
        <div className={f.checklist}>
          {steps.map((step) => (
            <button
              type="button"
              key={step.id}
              onClick={() => {
                const heading = document.getElementById(step.id);
                heading?.focus({ preventScroll: true });
                heading?.scrollIntoView({ block: 'start', behavior: 'instant' });
              }}
            >
              {step.complete ? (
                <CircleCheck size={15} className={f.complete} />
              ) : (
                <Circle size={15} />
              )}
              <span>{step.label}</span>
              <span className={f.srOnly}>{step.complete ? 'Preenchido' : 'Pendente'}</span>
              <ArrowRight size={12} />
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

export function MediaChoices({
  label,
  name,
  type = 'checkbox',
  choices,
  selected,
  change,
  error,
}: {
  label: string;
  name: string;
  type?: 'checkbox' | 'radio';
  choices: {
    value: string;
    title: string;
    description: string;
    icon: LucideIcon;
  }[];
  selected: string[];
  change: (value: string) => void;
  error?: string;
}) {
  const id = useId();
  return (
    <fieldset
      className={f.mediaGroup}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined}
    >
      <legend className={f.srOnly}>{label}</legend>
      <div className={f.mediaChoices}>
        {choices.map((choice, index) => (
          <label
            key={choice.value}
            className={f.mediaChoice}
            data-selected={selected.includes(choice.value)}
          >
            <div className={f.choiceTop}>
              <span className={f.choiceIcon}>
                <choice.icon size={18} aria-hidden="true" />
              </span>
              <input
                type={type}
                name={name}
                value={choice.value}
                checked={selected.includes(choice.value)}
                onChange={() => change(choice.value)}
                aria-label={choice.title}
                aria-describedby={`${id}-${index}`}
              />
            </div>
            <strong>{choice.title}</strong>
            <span id={`${id}-${index}`}>{choice.description}</span>
          </label>
        ))}
      </div>
      {error && (
        <p id={`${id}-error`} className={f.choiceError}>
          {error}
        </p>
      )}
    </fieldset>
  );
}
