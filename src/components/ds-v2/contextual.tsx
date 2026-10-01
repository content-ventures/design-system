'use client';

import { useId, type ReactNode } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Info,
  X,
  type LucideIcon,
} from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { ptBR } from 'react-day-picker/locale';
import { IconButton } from './button';
import { Switch, type SwitchProps } from './selection';
import s from './contextual.module.css';

export type SwitchFieldProps = SwitchProps & {
  stateLabel?: string;
  variant?: 'surface' | 'inline';
};

export function SwitchField({
  label,
  description,
  stateLabel,
  variant = 'surface',
  ...props
}: SwitchFieldProps) {
  const generatedId = useId();
  const id = props.id ?? generatedId;
  return (
    <div
      className={s.switchField}
      data-checked={props.checked}
      data-disabled={props.disabled || undefined}
      data-variant={variant}
    >
      <div>
        <label htmlFor={id}>{label}</label>
        {description && <p>{description}</p>}
      </div>
      <div className={s.switchFieldAction}>
        {stateLabel && (
          <span className={s.switchState} aria-hidden="true">
            {stateLabel}
          </span>
        )}
        <Switch {...props} id={id} label={label} description={description} />
      </div>
    </div>
  );
}

export function InlineAlert({
  title,
  children,
  tone = 'info',
  placement = 'inline',
  actions,
  onDismiss,
}: {
  title: string;
  children?: ReactNode;
  tone?: 'info' | 'success' | 'warning' | 'error';
  placement?: 'inline' | 'section' | 'banner';
  actions?: ReactNode;
  onDismiss?: () => void;
}) {
  const titleId = useId();
  const Icon = { info: Info, success: CheckCircle2, warning: AlertTriangle, error: AlertCircle }[
    tone
  ];
  return (
    <div
      className={s.alert}
      data-tone={tone}
      data-placement={placement}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-labelledby={titleId}
    >
      <span className={s.alertIcon} aria-hidden="true">
        <Icon size={17} />
      </span>
      <div className={s.alertContent}>
        <strong id={titleId}>{title}</strong>
        {children && <div className={s.alertDescription}>{children}</div>}
        {actions && <div className={s.alertActions}>{actions}</div>}
      </div>
      {onDismiss && (
        <IconButton variant="ghost" label={`Dispensar: ${title}`} icon={X} onClick={onDismiss} />
      )}
    </div>
  );
}

export type EmptyStatePlacement = 'table' | 'section' | 'page';

export function EmptyState({
  title,
  description,
  eyebrow,
  meta,
  icon: Icon = Inbox,
  tone = 'neutral',
  placement = 'section',
  actions,
}: {
  title: string;
  description: ReactNode;
  eyebrow?: string;
  meta?: ReactNode;
  icon?: LucideIcon;
  tone?: 'neutral' | 'error';
  placement?: EmptyStatePlacement;
  actions?: ReactNode;
}) {
  const titleId = useId();
  const descriptionId = useId();
  return (
    <section
      className={s.emptyState}
      data-placement={placement}
      data-tone={tone}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className={s.emptyVisual} aria-hidden="true">
        <i />
        <i />
        <span className={s.emptyIcon}>
          <Icon size={placement === 'table' ? 19 : 22} />
        </span>
      </div>
      <div className={s.emptyCopy}>
        {eyebrow && <span className={s.emptyEyebrow}>{eyebrow}</span>}
        <h3 id={titleId}>{title}</h3>
        <p id={descriptionId}>{description}</p>
        {meta && <div className={s.emptyMeta}>{meta}</div>}
      </div>
      {actions && <div className={s.emptyActions}>{actions}</div>}
    </section>
  );
}

export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section className={s.settingsSection} aria-labelledby={id}>
      <div>
        <h3 id={id}>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      <div className={s.settingsControls}>{children}</div>
    </section>
  );
}

export function MonthCalendar({
  selected,
  onSelect,
  month,
  onMonthChange,
  eventDates = [],
}: {
  selected: Date;
  onSelect: (date: Date) => void;
  month: Date;
  onMonthChange: (date: Date) => void;
  eventDates?: Date[];
}) {
  return (
    <DayPicker
      mode="single"
      required
      locale={ptBR}
      selected={selected}
      onSelect={onSelect}
      month={month}
      onMonthChange={onMonthChange}
      showOutsideDays
      fixedWeeks
      labels={{
        labelDayButton: (date, modifiers) =>
          `${date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}${modifiers.selected ? ', selecionado' : ''}${modifiers.today ? ', hoje' : ''}${modifiers.event ? ', com eventos' : ''}`,
      }}
      modifiers={{ event: eventDates }}
      modifiersClassNames={{ event: s.eventDay! }}
      classNames={{
        root: s.calendar,
        months: s.months,
        month_caption: s.monthCaption,
        caption_label: s.caption,
        nav: s.nav,
        button_previous: s.navButton,
        button_next: s.navButton,
        month_grid: s.monthGrid,
        weekday: s.weekday,
        day: s.day,
        day_button: s.dayButton,
        selected: s.selected,
        today: s.today,
        outside: s.outside,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />,
      }}
    />
  );
}
