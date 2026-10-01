'use client';

import { useId, useRef, useState } from 'react';
import { CalendarDays, Clock3, MapPin, Plus, UsersRound } from 'lucide-react';
import {
  Avatar,
  AvatarGroup,
  Button,
  Checkbox,
  Combobox,
  DateInput,
  Dialog,
  FormField,
  Input,
  MonthCalendar,
  Select,
  Status,
  SwitchField,
  Textarea,
} from '../../components/ds-v2';
import { Segmented, Stage } from './specimen-ui';
import s from './workspace-patterns.module.css';

type Event = {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  allDay: boolean;
  location: string;
  people: string[];
  note: string;
  status: string;
};
type CalendarScope = 'Mês' | 'Semana' | 'Dia' | 'Agenda';
const participants = [
  {
    name: 'Ana Lima',
    email: 'ana.lima@mediaon.com.br',
    tone: 'blue' as const,
  },
  {
    name: 'Pedro Costa',
    email: 'pedro.costa@mediaon.com.br',
    src: '/images/avatar-demo.png',
    tone: 'green' as const,
  },
  {
    name: 'Bia Souza',
    email: 'bia.souza@mediaon.com.br',
    tone: 'amber' as const,
  },
];
const people = participants.map((participant) => participant.name);
const initial: Event[] = [
  {
    id: '1',
    title: 'Revisão de criativos · Aurora',
    date: '2026-10-06',
    start: '09:00',
    end: '09:30',
    allDay: false,
    location: 'Google Meet',
    people: ['Ana Lima', 'Bia Souza'],
    note: 'Conferir as versões de desktop e celular.',
    status: 'Confirmado',
  },
  {
    id: '2',
    title: 'Aprovação do plano de mídia',
    date: '2026-10-06',
    start: '14:00',
    end: '15:00',
    allDay: false,
    location: 'Sala comercial',
    people: ['Pedro Costa'],
    note: '',
    status: 'Pendente',
  },
  {
    id: '3',
    title: 'Início da campanha Primavera',
    date: '2026-10-08',
    start: '08:00',
    end: '09:00',
    allDay: true,
    location: 'Portal Francal',
    people: ['Ana Lima'],
    note: '',
    status: 'Confirmado',
  },
  {
    id: '4',
    title: 'Relatório de performance',
    date: '2026-10-15',
    start: '10:00',
    end: '11:00',
    allDay: false,
    location: 'Google Meet',
    people,
    note: '',
    status: 'Pendente',
  },
];
const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const fromKey = (key: string) => new Date(`${key}T12:00:00`);
const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};
const startOfWeek = (date: Date) => addDays(date, -date.getDay());
const sameDay = (left: Date, right: Date) => dateKey(left) === dateKey(right);
const hours = Array.from({ length: 11 }, (_, index) => index + 8);
export function AgendaExample() {
  const uid = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);
  const [events, setEvents] = useState(initial);
  const [date, setDate] = useState(new Date(2026, 9, 6));
  const [month, setMonth] = useState(new Date(2026, 9, 1));
  const [scope, setScope] = useState<CalendarScope>('Mês');
  const [draft, setDraft] = useState<Event | null>(null);
  const [error, setError] = useState('');
  const [tasks, setTasks] = useState<string[]>(['Conferir formatos de mídia']);
  const [announcement, setAnnouncement] = useState('');
  const open = (event?: Event) => {
    setDraft(
      event
        ? { ...event }
        : {
            id: '',
            title: '',
            date: dateKey(date),
            start: '09:00',
            end: '10:00',
            allDay: false,
            location: '',
            people: [],
            note: '',
            status: 'Pendente',
          },
    );
    setError('');
  };
  const patch = (value: Partial<Event>) =>
    setDraft((previous) => previous && { ...previous, ...value });
  const sortedEvents = [...events].sort((a, b) =>
    `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`),
  );
  const weekStart = startOfWeek(date);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthDays = Array.from({ length: 42 }, (_, index) =>
    addDays(startOfWeek(monthStart), index),
  );
  const visible = sortedEvents.filter((event) => {
    if (scope === 'Agenda') return true;
    if (scope === 'Dia') return event.date === dateKey(date);
    if (scope === 'Semana') return weekDays.some((day) => event.date === dateKey(day));
    return event.date.startsWith(dateKey(month).slice(0, 7));
  });
  const eventsFor = (day: Date) => sortedEvents.filter((event) => event.date === dateKey(day));
  const viewTitle =
    scope === 'Dia'
      ? date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
      : scope === 'Semana'
        ? `${weekDays[0]!.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} – ${weekDays[6]!.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`
        : scope === 'Agenda'
          ? 'Próximos eventos'
          : month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const eventLabel = (event: Event) =>
    `${event.title} ${event.status}, ${event.allDay ? 'Dia inteiro' : `${event.start}–${event.end}`}`;
  const eventList = (items: Event[]) => (
    <div className={s.eventList}>
      {items.map((event) => (
        <button
          key={event.id}
          className={s.event}
          aria-label={eventLabel(event)}
          onClick={() => open(event)}
        >
          <span className={s.eventDate}>
            <strong>{fromKey(event.date).getDate()}</strong>
            {fromKey(event.date).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
          </span>
          <span className={s.eventContent}>
            <strong>{event.title}</strong>
            <span className={s.eventMeta}>
              <Status
                variant="soft"
                value={event.status}
                tone={event.status === 'Confirmado' ? 'green' : 'amber'}
              />
              <span>
                <Clock3 size={12} />
                {event.allDay ? 'Dia inteiro' : `${event.start}–${event.end}`}
              </span>
              {event.location && (
                <span>
                  <MapPin size={12} />
                  {event.location}
                </span>
              )}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
  return (
    <Stage
      title="Agenda de campanhas"
      footer="Eventos e participantes de demonstração. Nenhum convite é enviado."
    >
      <div className={s.stack}>
        <div className={s.spread}>
          <div>
            <h3 className={s.title}>Agenda do portal</h3>
            <span className={s.muted}>Aprovações, entregas e veiculações</span>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => open()}>
            Novo evento
          </Button>
        </div>
        <div className={s.agenda}>
          <div className={s.calendarPane}>
            <MonthCalendar
              selected={date}
              onSelect={(next) => {
                setDate(next);
                setMonth(next);
                setScope('Dia');
              }}
              month={month}
              onMonthChange={(next) => {
                setMonth(next);
                setScope('Mês');
              }}
              eventDates={events.map((event) => fromKey(event.date))}
            />
            <div className={s.row}>
              <Status value="Com eventos" tone="blue" />
              <Button
                variant="ghost"
                onClick={() => {
                  setScope('Mês');
                }}
              >
                Ver mês inteiro
              </Button>
            </div>
          </div>
          <div className={s.agendaContent}>
            <div className={s.agendaToolbar}>
              <h3 className={s.sectionHeading}>
                {viewTitle} <span className={s.muted}>· {visible.length}</span>
              </h3>
              <Segmented
                label="Visualização da agenda"
                values={['Mês', 'Semana', 'Dia', 'Agenda']}
                value={scope}
                onChange={(value) => setScope(value as CalendarScope)}
              />
            </div>

            {scope === 'Mês' && (
              <div className={s.monthView} aria-label={`Calendário de ${viewTitle}`}>
                <div className={s.monthWeekdays} aria-hidden="true">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((weekday) => (
                    <span key={weekday}>{weekday}</span>
                  ))}
                </div>
                <div className={s.monthCells}>
                  {monthDays.map((day) => {
                    const dayEvents = eventsFor(day);
                    return (
                      <div
                        className={s.monthCell}
                        data-outside={day.getMonth() !== month.getMonth() || undefined}
                        data-selected={sameDay(day, date) || undefined}
                        key={dateKey(day)}
                      >
                        <button
                          type="button"
                          className={s.monthDay}
                          aria-label={`Ver ${day.toLocaleDateString('pt-BR')}`}
                          onClick={() => {
                            setDate(day);
                            setMonth(day);
                            setScope('Dia');
                          }}
                        >
                          {day.getDate()}
                        </button>
                        {dayEvents.slice(0, 2).map((event) => (
                          <button
                            type="button"
                            key={event.id}
                            className={s.monthEvent}
                            data-status={event.status}
                            aria-label={eventLabel(event)}
                            onClick={() => open(event)}
                          >
                            <span>{event.allDay ? 'Dia' : event.start}</span>
                            {event.title}
                          </button>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className={s.moreEvents}>+{dayEvents.length - 2} eventos</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {scope === 'Semana' && (
              <div className={s.weekView}>
                {weekDays.map((day) => {
                  const dayEvents = eventsFor(day);
                  return (
                    <section
                      key={dateKey(day)}
                      className={s.weekDay}
                      data-selected={sameDay(day, date) || undefined}
                    >
                      <button
                        type="button"
                        className={s.weekDayHeader}
                        onClick={() => {
                          setDate(day);
                          setScope('Dia');
                        }}
                      >
                        <span>
                          {day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                        </span>
                        <strong>{day.getDate()}</strong>
                      </button>
                      <div className={s.weekEvents}>
                        {dayEvents.map((event) => (
                          <button
                            type="button"
                            key={event.id}
                            className={s.weekEvent}
                            data-status={event.status}
                            aria-label={eventLabel(event)}
                            onClick={() => open(event)}
                          >
                            <span>{event.allDay ? 'Dia inteiro' : event.start}</span>
                            <strong>{event.title}</strong>
                          </button>
                        ))}
                        {!dayEvents.length && <span className={s.freeDay}>Livre</span>}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}

            {scope === 'Dia' &&
              (visible.length ? (
                <div className={s.dayTimeline}>
                  {hours.map((hour) => {
                    const slotEvents = visible.filter((event) =>
                      event.allDay ? hour === 8 : Number(event.start.slice(0, 2)) === hour,
                    );
                    return (
                      <div className={s.timeSlot} key={hour}>
                        <time>{String(hour).padStart(2, '0')}:00</time>
                        <div>
                          {slotEvents.map((event) => (
                            <button
                              type="button"
                              key={event.id}
                              className={s.dayEvent}
                              data-status={event.status}
                              aria-label={eventLabel(event)}
                              onClick={() => open(event)}
                            >
                              <strong>{event.title}</strong>
                              <span>
                                {event.allDay ? 'Dia inteiro' : `${event.start}–${event.end}`}
                                {event.location ? ` · ${event.location}` : ''}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={s.empty}>
                  Nenhum evento neste período.
                  <br />
                  <Button variant="ghost" onClick={() => open()}>
                    Adicionar evento
                  </Button>
                </div>
              ))}

            {scope === 'Agenda' &&
              (visible.length ? (
                eventList(visible)
              ) : (
                <div className={s.empty}>Nenhum evento neste período.</div>
              ))}
          </div>
        </div>
        <div className={s.grid}>
          <section>
            <h3 className={s.sectionHeading}>Antes da veiculação</h3>
            <div className={s.taskList}>
              {[
                'Conferir formatos de mídia',
                'Revisar links dos criativos',
                'Validar pedido de inserção',
              ].map((task, index) => (
                <div className={s.taskRow} data-done={tasks.includes(task)} key={task}>
                  <Checkbox
                    label={task}
                    checked={tasks.includes(task)}
                    onChange={() =>
                      setTasks((old) =>
                        old.includes(task) ? old.filter((item) => item !== task) : [...old, task],
                      )
                    }
                  />
                  <small>{index === 0 ? '06 out' : '08 out'}</small>
                </div>
              ))}
            </div>
          </section>
          <section className={s.stack}>
            <h3 className={s.sectionHeading}>Selecionar data em um formulário</h3>
            <FormField id={`${uid}-date`} label="Entrega do criativo">
              <DateInput
                id={`${uid}-date`}
                name="delivery"
                label="Entrega do criativo"
                defaultValue="06/10/2026"
              />
            </FormField>
          </section>
        </div>
        <span role="status" className={s.muted}>
          {announcement}
        </span>
      </div>
      <Dialog
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Editar evento' : 'Novo evento'}
        density="compact"
        footer={
          <>
            <Button onClick={() => setDraft(null)}>Cancelar</Button>
            <Button variant="primary" type="submit" form={`${uid}-event`}>
              Salvar evento
            </Button>
          </>
        }
      >
        {draft && (
          <form
            id={`${uid}-event`}
            className={s.eventForm}
            onSubmit={(event) => {
              event.preventDefault();
              if (
                !draft.title.trim() ||
                !draft.date ||
                (!draft.allDay && (!draft.start || !draft.end || draft.end <= draft.start))
              ) {
                setError(
                  !draft.title.trim()
                    ? 'Informe o título do evento.'
                    : !draft.date
                      ? 'Informe a data do evento.'
                      : 'O término precisa ser depois do início.',
                );
                requestAnimationFrame(() =>
                  (!draft.title.trim()
                    ? titleRef
                    : !draft.date
                      ? dateRef
                      : endRef
                  ).current?.focus(),
                );
                return;
              }
              setEvents((old) =>
                draft.id
                  ? old.map((item) => (item.id === draft.id ? draft : item))
                  : [...old, { ...draft, id: crypto.randomUUID() }],
              );
              setMonth(fromKey(draft.date));
              setDate(fromKey(draft.date));
              setScope('Dia');
              setAnnouncement(`Evento ${draft.title} salvo na agenda local.`);
              setDraft(null);
            }}
          >
            <div className={s.eventFields}>
              <FormField id={`${uid}-title`} label="Título" required>
                <Input
                  ref={titleRef}
                  aria-invalid={!!error && !draft.title.trim()}
                  aria-describedby={error ? `${uid}-error` : undefined}
                  id={`${uid}-title`}
                  value={draft.title}
                  maxLength={100}
                  onChange={(event) => patch({ title: event.target.value })}
                />
              </FormField>
              <section className={s.eventSection}>
                <header className={s.eventSectionHeader}>
                  <span>
                    <CalendarDays size={15} aria-hidden="true" />
                    Quando
                  </span>
                  <div className={s.allDaySwitch}>
                    <SwitchField
                      variant="inline"
                      label="Dia inteiro"
                      stateLabel={draft.allDay ? 'Ativo' : undefined}
                      checked={draft.allDay}
                      onCheckedChange={(allDay) => patch({ allDay })}
                    />
                  </div>
                </header>
                <div className={s.scheduleGrid} data-all-day={draft.allDay || undefined}>
                  <FormField id={`${uid}-day`} label="Data" required>
                    <Input
                      ref={dateRef}
                      aria-invalid={!!error && !draft.date}
                      aria-describedby={error ? `${uid}-error` : undefined}
                      id={`${uid}-day`}
                      type="date"
                      value={draft.date}
                      onChange={(event) => patch({ date: event.target.value })}
                    />
                  </FormField>
                  {!draft.allDay && (
                    <>
                      <FormField id={`${uid}-start`} label="Início">
                        <Input
                          type="time"
                          id={`${uid}-start`}
                          value={draft.start}
                          onChange={(event) => patch({ start: event.target.value })}
                        />
                      </FormField>
                      <FormField id={`${uid}-end`} label="Término">
                        <Input
                          ref={endRef}
                          aria-invalid={!!error && draft.end <= draft.start}
                          aria-describedby={error ? `${uid}-error` : undefined}
                          type="time"
                          id={`${uid}-end`}
                          value={draft.end}
                          onChange={(event) => patch({ end: event.target.value })}
                        />
                      </FormField>
                    </>
                  )}
                </div>
              </section>
              <section className={s.eventSection}>
                <header className={s.eventSectionHeader}>
                  <span>
                    <UsersRound size={15} aria-hidden="true" />
                    Participantes
                  </span>
                  {draft.people.length > 0 && (
                    <AvatarGroup
                      people={draft.people.map((name) => {
                        const participant = participants.find((item) => item.name === name);
                        return {
                          name,
                          src: participant?.src,
                          tone: participant?.tone,
                        };
                      })}
                    />
                  )}
                </header>
                <Combobox
                  label="Participantes"
                  multiple
                  placement="bottom"
                  value={draft.people}
                  onChange={(next) => patch({ people: next })}
                  options={participants.map((participant) => ({
                    value: participant.name,
                    label: participant.name,
                    description: participant.email,
                    leading: (
                      <Avatar
                        name={participant.name}
                        src={participant.src}
                        tone={participant.tone}
                        size={32}
                      />
                    ),
                  }))}
                />
              </section>
              <div className={s.grid}>
                <FormField id={`${uid}-location`} label="Local ou plataforma">
                  <Input
                    id={`${uid}-location`}
                    value={draft.location}
                    placeholder="Ex.: Google Meet"
                    onChange={(event) => patch({ location: event.target.value })}
                  />
                </FormField>
                <FormField id={`${uid}-status`} label="Status">
                  <Select
                    id={`${uid}-status`}
                    label="Status do evento"
                    value={draft.status}
                    onValueChange={(status) => patch({ status })}
                    options={['Pendente', 'Confirmado'].map((value) => ({ value, label: value }))}
                  />
                </FormField>
              </div>
              <div className={s.eventNotes}>
                <FormField id={`${uid}-note`} label="Notas do evento">
                  <Textarea
                    id={`${uid}-note`}
                    value={draft.note}
                    onChange={(event) => patch({ note: event.target.value })}
                    rows={4}
                    maxLength={1000}
                  />
                </FormField>
              </div>
            </div>
            {error && (
              <p id={`${uid}-error`} role="alert" className={s.eventError}>
                {error}
              </p>
            )}
          </form>
        )}
      </Dialog>
    </Stage>
  );
}
