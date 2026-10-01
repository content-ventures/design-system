'use client';
import { useId, useState } from 'react';
import { Check, ExternalLink, FileText } from 'lucide-react';
import {
  Avatar,
  Button,
  Dialog,
  FormField,
  InlineAlert,
  Input,
  Select,
  Status,
  Textarea,
  type Notify,
} from '../../components/ds-v2';
import { Segmented, Stage } from './specimen-ui';
import s from './workspace-patterns.module.css';

const initialHistory = [
  {
    title: 'Proposta enviada',
    time: '30 set, 09:40',
    text: 'Ana Lima · Display e e-mail dedicado.',
  },
  {
    title: 'Briefing recebido',
    time: '29 set, 16:20',
    text: 'Objetivo: divulgar a coleção primavera.',
  },
  {
    title: 'Lead qualificado',
    time: '28 set, 11:05',
    text: 'Interesse em 120 mil impressões no portal.',
  },
  {
    title: 'Contato criado',
    time: '27 set, 14:32',
    text: 'Origem: formulário da vitrine Francal.',
  },
];
function useRecordState() {
  const [history, setHistory] = useState(initialHistory);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('Em negociação');
  return { history, setHistory, note, setNote, status, setStatus };
}
export function RecordDetail({
  notify,
  state,
}: {
  notify: Notify;
  state?: ReturnType<typeof useRecordState>;
}) {
  const uid = useId();
  const localState = useRecordState();
  const { history, setHistory, note, setNote, status, setStatus } = state ?? localState;
  return (
    <div className={s.detail}>
      <aside className={s.history}>
        <h3>Histórico do relacionamento</h3>
        <ol className={s.timeline}>
          {history.map((item, index) => (
            <li key={`${item.title}-${index}`}>
              <time>{item.time}</time>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </li>
          ))}
        </ol>
      </aside>
      <div className={s.stack}>
        <div className={s.spread}>
          <div className={s.row}>
            <Avatar name="Mariana Torres" size={40} />
            <div>
              <h3 className={s.sectionHeading}>Mariana Torres</h3>
              <span className={s.muted}>Calçados Aurora · Marketing</span>
            </div>
          </div>
          <Status value={status} tone={status === 'Ganho' ? 'green' : 'blue'} variant="soft" />
        </div>
        <dl className={s.facts}>
          {[
            ['E-mail', 'mariana@aurora.example'],
            ['Telefone', '(11) 99999-2048'],
            ['Portal', 'Francal 2026'],
            ['Responsável', 'Ana Lima'],
            ['Oportunidade', 'Coleção Primavera'],
            ['Valor estimado', 'R$ 19.200,00'],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <Select
          label="Etapa da oportunidade"
          value={status}
          options={['Qualificado', 'Em negociação', 'Ganho'].map((value) => ({
            value,
            label: value,
          }))}
          onValueChange={(next) => {
            setStatus(next);
            setHistory((old) => [
              {
                title: `Etapa alterada para ${next}`,
                time: 'Agora',
                text: 'Ana Lima · Alteração local.',
              },
              ...old,
            ]);
          }}
        />
        <InlineAlert title="Próximo contato: 6 de outubro">
          Revisar a proposta e confirmar os formatos com a anunciante.
        </InlineAlert>
        <form
          className={s.stack}
          onSubmit={(event) => {
            event.preventDefault();
            if (!note.trim()) return;
            setHistory((old) => [
              { title: 'Nota registrada', time: 'Agora', text: note.trim() },
              ...old,
            ]);
            setNote('');
            notify('Nota adicionada ao histórico local.');
          }}
        >
          <FormField id={`${uid}-note`} label="Adicionar uma nota">
            <Textarea
              id={`${uid}-note`}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Registre o contexto da conversa…"
              maxLength={600}
              rows={3}
            />
          </FormField>
          <div className={s.spread}>
            <span className={s.muted}>Visível para a equipe neste exemplo.</span>
            <Button type="submit" disabled={!note.trim()}>
              Registrar nota
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
export function DetailLayerExample({ notify }: { notify: Notify }) {
  const [open, setOpen] = useState(false);
  const state = useRecordState();
  return (
    <Stage
      title="Detalhe com histórico lateral"
      footer="O painel mantém o contexto da lista. No celular, as seções ficam empilhadas."
    >
      <div className={s.spread}>
        <div className={s.row}>
          <Avatar name="Mariana Torres" />
          <div>
            <strong>Calçados Aurora</strong>
            <p className={s.muted}>Mariana Torres · {state.status}</p>
          </div>
        </div>
        <Button onClick={() => setOpen(true)}>Abrir detalhe do lead</Button>
      </div>
      <Dialog
        kind="drawer"
        size="wide"
        open={open}
        onClose={() => setOpen(false)}
        title="Oportunidade · Calçados Aurora"
        description="LEAD-0024 · Portal Francal 2026"
        footer={<Button onClick={() => setOpen(false)}>Fechar detalhe</Button>}
      >
        <RecordDetail notify={notify} state={state} />
      </Dialog>
    </Stage>
  );
}

const plans = [
  {
    name: 'Essencial',
    price: 890,
    description: 'Para uma operação de mídia enxuta.',
    benefits: ['1 portal', '3 mídias por campanha', '3 membros na equipe', 'Relatórios essenciais'],
  },
  {
    name: 'Profissional',
    price: 1490,
    description: 'Para equipes com campanhas recorrentes.',
    benefits: [
      '3 portais',
      '10 mídias por campanha',
      '10 membros na equipe',
      'Relatórios e exportações',
    ],
  },
  {
    name: 'Avançado',
    price: 2490,
    description: 'Para operações com múltiplos portais.',
    benefits: [
      '10 portais',
      '30 mídias por campanha',
      '30 membros na equipe',
      'Acompanhamento dedicado',
    ],
  },
];
const currency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
export function PlansExample() {
  const [period, setPeriod] = useState('Mensal');
  const [selected, setSelected] = useState('Essencial');
  const [pending, setPending] = useState<(typeof plans)[number] | null>(null);
  const [message, setMessage] = useState('');
  const price = (amount: number) => (period === 'Anual' ? amount * 0.8 : amount);
  return (
    <div className={s.stack}>
      <div className={s.spread}>
        <div>
          <h3 className={s.title}>Um plano para cada operação</h3>
          <span className={s.muted}>Valores ilustrativos para avaliar esta composição.</span>
        </div>
        <Segmented
          label="Periodicidade dos planos"
          values={['Mensal', 'Anual']}
          value={period}
          onChange={setPeriod}
        />
      </div>
      <div className={s.plans}>
        {plans.map((plan) => (
          <article className={s.plan} key={plan.name} data-featured={plan.name === 'Profissional'}>
            <span className={s.planBadge}>
              {plan.name === 'Profissional'
                ? 'Para equipes em crescimento'
                : selected === plan.name
                  ? 'Selecionado no exemplo'
                  : '\u00a0'}
            </span>
            <div>
              <h3>{plan.name}</h3>
              <p>{plan.description}</p>
            </div>
            <div>
              <strong className={s.price}>{currency(price(plan.price))}</strong>
              <p>/ mês {period === 'Anual' ? '· economia de 20%' : ''}</p>
              <p style={{ marginTop: 8 }}>
                {period === 'Anual'
                  ? `${currency(price(plan.price) * 12)} cobrados anualmente`
                  : 'Cobrança mensal'}
              </p>
            </div>
            <ul>
              {plan.benefits.map((benefit) => (
                <li key={benefit}>
                  <Check size={15} />
                  {benefit}
                </li>
              ))}
            </ul>
            <Button
              variant={plan.name === 'Profissional' ? 'primary' : 'secondary'}
              onClick={() => setPending(plan)}
            >
              {selected === plan.name ? 'Revisar plano' : `Escolher ${plan.name}`}
            </Button>
          </article>
        ))}
      </div>
      <span role="status" className={s.muted}>
        {message || `Plano selecionado: ${selected}. Nenhuma assinatura ativa nesta prévia.`}
      </span>
      <Dialog
        open={!!pending}
        onClose={() => setPending(null)}
        title="Revisar seleção"
        footer={
          <>
            <Button onClick={() => setPending(null)}>Voltar</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!pending) return;
                setSelected(pending.name);
                setMessage(
                  `${pending.name} · ${period.toLowerCase()} selecionado apenas no exemplo.`,
                );
                setPending(null);
              }}
            >
              Confirmar no exemplo
            </Button>
          </>
        }
      >
        {pending && (
          <div className={s.stack}>
            <div>
              <h3 className={s.title}>{pending.name}</h3>
              <p className={s.muted}>
                {period} · {currency(price(pending.price))} por mês
              </p>
            </div>
            <dl className={s.facts}>
              <div>
                <dt>Total por cobrança</dt>
                <dd>{currency(price(pending.price) * (period === 'Anual' ? 12 : 1))}</dd>
              </div>
              <div>
                <dt>Periodicidade</dt>
                <dd>{period}</dd>
              </div>
            </dl>
            <InlineAlert title="Seleção de demonstração">
              Nenhuma cobrança ou contratação será realizada.
            </InlineAlert>
          </div>
        )}
      </Dialog>
    </div>
  );
}

export function InlineNotices({ banner = false }: { banner?: boolean }) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [details, setDetails] = useState(false);
  const [valid, setValid] = useState(false);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('2026-10-08');
  const [savedDate, setSavedDate] = useState('2026-10-08');
  const uid = useId();
  const hide = (id: string) => setDismissed((old) => [...old, id]);
  return (
    <Stage title={banner ? 'Aviso persistente no fluxo' : 'Avisos com ações no contexto'}>
      <div className={s.stack} style={{ maxWidth: 740 }}>
        {!banner && !dismissed.includes('release') && (
          <InlineAlert
            title="Novos filtros disponíveis no inventário"
            placement={banner ? 'banner' : 'inline'}
            onDismiss={() => hide('release')}
            actions={
              <>
                <Button
                  icon={ExternalLink}
                  onClick={() => setDetails(!details)}
                  aria-expanded={details}
                >
                  {details ? 'Ocultar alterações' : 'Ver alterações'}
                </Button>
                <Button variant="ghost" onClick={() => hide('release')}>
                  Depois
                </Button>
              </>
            }
          >
            {details ? (
              <span>
                Agora é possível combinar canal, formato e período em uma mesma consulta. As
                escolhas aparecem como filtros removíveis acima da tabela.
              </span>
            ) : (
              'Organize as mídias por canal e disponibilidade.'
            )}
          </InlineAlert>
        )}
        {!banner && !dismissed.includes('file') && (
          <InlineAlert
            title={
              valid ? 'Arquivo validado no exemplo' : 'O arquivo ultrapassa o limite permitido'
            }
            tone={valid ? 'success' : 'error'}
            placement={banner ? 'banner' : 'inline'}
            onDismiss={() => hide('file')}
            actions={
              !valid && (
                <>
                  <Button onClick={() => setValid(true)}>Simular nova validação</Button>
                  <Button
                    icon={FileText}
                    variant="ghost"
                    onClick={() => {
                      window.location.hash = 'upload';
                    }}
                  >
                    Ver requisitos e enviar
                  </Button>
                </>
              )
            }
          >
            {valid
              ? 'A nova versão está pronta para revisão.'
              : 'Use um arquivo de até 10 MB em PNG, JPG, PDF ou CSV.'}
          </InlineAlert>
        )}
        {!dismissed.includes('period') && (
          <InlineAlert
            title="Confirme o prazo antes de reservar a mídia"
            tone="warning"
            placement={banner ? 'banner' : 'inline'}
            onDismiss={() => hide('period')}
            actions={
              <Button
                onClick={() => {
                  setDate(savedDate);
                  setOpen(true);
                }}
              >
                Revisar entrega
              </Button>
            }
          >
            Entrega do criativo: {new Date(`${savedDate}T12:00:00`).toLocaleDateString('pt-BR')}. A
            reserva depende da aprovação do pedido.
          </InlineAlert>
        )}
        {dismissed.length > 0 && (
          <Button
            variant="ghost"
            onClick={() => {
              setDismissed([]);
              setValid(false);
            }}
          >
            Restaurar avisos
          </Button>
        )}
      </div>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Prazo do criativo"
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" form={`${uid}-deadline`}>
              Salvar prazo
            </Button>
          </>
        }
      >
        <form
          id={`${uid}-deadline`}
          onSubmit={(event) => {
            event.preventDefault();
            setSavedDate(date);
            setOpen(false);
          }}
        >
          <FormField id={`${uid}-date`} label="Data de entrega" required>
            <Input
              type="date"
              id={`${uid}-date`}
              value={date}
              required
              onChange={(event) => setDate(event.target.value)}
            />
          </FormField>
        </form>
      </Dialog>
    </Stage>
  );
}
