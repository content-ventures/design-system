import { CircleAlert, Info, type LucideIcon } from 'lucide-react';
import type { KeyboardEvent, ReactNode } from 'react';
import type { CampaignDraft, Persona } from '../store';
import type { Errors } from './validation';
import b from './builder.module.css';

export type StepProps = {
  draft: CampaignDraft;
  update: (patch: Partial<CampaignDraft>) => void;
  errors: Errors;
  persona: Persona;
  goTo: (index: number) => void;
  campaignCount: number;
  /** Campanha em edição: fica fora do próprio histórico do anunciante. */
  campaignId?: string;
  /** Edição: verba gravada fora da regra do ativo, ajustada na abertura (dita no campo da etapa 3). */
  adjustedBudget?: { from: number; to: number };
};

/**
 * Seção do formulário (padrão V2): sem caixa, separada da próxima por um fio.
 * O título alinha com a grade dos campos; a numeração já está na régua de etapas.
 */
export function Section({
  id,
  title,
  description,
  actions,
  meta,
  badge,
  children,
}: {
  /** Mantido por compatibilidade; a seção não exibe mais número. */
  n?: string;
  id?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  /** Contador à direita do título; no celular desce para baixo do título. */
  meta?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={b.section} aria-labelledby={id ? `${id}-title` : undefined}>
      <header className={b.sectionHead}>
        <div className={b.sectionTitles}>
          <h2 id={id ? `${id}-title` : undefined} className={b.sectionTitle} tabIndex={-1}>
            {title}
            {badge}
          </h2>
          {description && <p className={b.sectionDesc}>{description}</p>}
        </div>
        {actions && <div className={b.sectionActions}>{actions}</div>}
        {meta && (
          <div className={b.sectionActions} data-meta>
            {meta}
          </div>
        )}
      </header>
      <div className={b.sectionBody}>{children}</div>
    </section>
  );
}

/** Setas, Home e End movem a escolha entre os rádios do grupo (padrão WAI-ARIA de radiogroup). */
export function onRadioKeys(event: KeyboardEvent<HTMLElement>) {
  const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
  const back = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
  if (!forward && !back && event.key !== 'Home' && event.key !== 'End') return;
  const radios = [...event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')];
  const index = radios.indexOf(document.activeElement as HTMLElement);
  if (index < 0 || !radios.length) return;
  event.preventDefault();
  const next =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? radios.length - 1
        : (index + (forward ? 1 : -1) + radios.length) % radios.length;
  radios[next]?.focus();
  radios[next]?.click();
}
/** Só o rádio marcado (ou o primeiro, se nenhum) entra na ordem de tabulação. */
export const rovingTab = (checked: boolean, index: number, anyChecked: boolean) =>
  checked || (!anyChecked && index === 0) ? 0 : -1;

/** Subgrupo dentro de uma seção: rótulo curto, sem número nem fio, para concatenar blocos de uma etapa. */
export function Group({
  label,
  required,
  meta,
  actions,
  labelId,
  children,
}: {
  label: string;
  required?: boolean;
  meta?: ReactNode;
  actions?: ReactNode;
  labelId?: string;
  children: ReactNode;
}) {
  return (
    <div className={b.group}>
      <div className={b.groupHead}>
        <span className={b.groupLabel} id={labelId}>
          {label}
          {required && (
            <span className={b.groupReq} aria-hidden="true">
              *
            </span>
          )}
        </span>
        {meta && <span className={b.groupMeta}>{meta}</span>}
        {actions && <div className={b.groupActions}>{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function ErrorText({ id, children }: { id?: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} className={b.fieldError} role="alert">
      <CircleAlert aria-hidden="true" />
      {children}
    </p>
  );
}

export function Help({ children }: { children: ReactNode }) {
  return (
    <p className={b.help}>
      <Info aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export function Alert({
  tone = 'blue',
  icon: Icon = Info,
  title,
  children,
  facts,
}: {
  tone?: 'blue' | 'red' | 'amber';
  icon?: LucideIcon;
  title: string;
  children?: ReactNode;
  facts?: { label: string; value: ReactNode }[];
}) {
  return (
    <div className={b.alert} data-tone={tone} role={tone === 'red' ? 'alert' : 'status'}>
      <Icon aria-hidden="true" />
      <div className={b.alertBody}>
        <strong>{title}</strong>
        {children}
        {facts && (
          <div className={b.alertFacts}>
            {facts.map((fact) => (
              <span key={fact.label}>
                {fact.label}: <b>{fact.value}</b>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
