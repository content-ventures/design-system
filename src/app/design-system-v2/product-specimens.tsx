'use client';
import { useEffect, useId, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Check,
  Download,
  Layers,
  LockKeyhole,
  Megaphone,
  Plus,
  Search,
  TrendingUp,
} from 'lucide-react';
import {
  Button,
  IconButton,
  Input,
  Textarea,
  Select,
  FormField,
  Switch,
  Status,
  Tabs,
  DateInput,
  PasswordInput,
  parseDate,
  Stepper,
  ChoiceCard,
  type useToast,
} from '../../components/ds-v2';
import { Stage, Steps, Description, Metrics, Activity, Segmented } from './specimen-ui';
import { ChartSpecimen } from './chart-specimens';
import { DataSpecimen } from './data-specimens';
import { FormExample } from './base-examples';
import s from './specimen.module.css';
import { LeadBoard } from './lead-board';
import { SettingsExample, PrivacyExample } from './settings-specimen';
import { PlansExample, RecordDetail } from './context-specimens';
import { MiniPreview, MemberCards, SetupChecklist } from './reference-flows';
import r from './reference-patterns.module.css';
import review from './campaign-review.module.css';
type Notify = ReturnType<typeof useToast>['notify'];
const options = (values: string[]) => values.map((value) => ({ value, label: value }));
const money = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const offers = [
  {
    name: 'Display no portal',
    format: 'Banner · 1.200 × 628 px',
    channel: 'Display',
    capacity: '120.000 impressões',
    price: 12400,
  },
  {
    name: 'E-mail dedicado',
    format: 'Disparo · base segmentada',
    channel: 'E-mail',
    capacity: '18.400 contatos',
    price: 6800,
  },
  {
    name: 'Conteúdo patrocinado',
    format: 'Editorial · conteúdo de marca',
    channel: 'Social',
    capacity: '2 publicações',
    price: 5600,
  },
];

export function MediaCatalog({ notify, compact = false }: { notify: Notify; compact?: boolean }) {
  const [query, setQuery] = useState('');
  const [channel, setChannel] = useState('Todos');
  const [selected, setSelected] = useState<string[]>([]);
  const filtered = offers.filter(
    (item) =>
      (channel === 'Todos' || item.channel === channel) &&
      item.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className={s.stack}>
      {!compact && (
        <div className={s.toolbar}>
          <Input
            aria-label="Buscar mídias"
            icon={<Search size={14} />}
            placeholder="Buscar mídia ou formato…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Segmented
            label="Canais de mídia"
            values={['Todos', 'Display', 'E-mail', 'Social']}
            value={channel}
            onChange={setChannel}
          />
        </div>
      )}
      <div className={compact ? s.two : s.three}>
        {filtered.slice(0, compact ? 2 : 3).map((item, index) => (
          <article key={item.name} className={s.mediaTile}>
            <div
              className={s.mediaArtwork}
              style={{ background: ['#edf5fb', '#f1f6f0', '#fcf5eb'][index], minHeight: 110 }}
            >
              <small>FRANCAL 2026</small>
              <strong>{item.channel}</strong>
            </div>
            <div>
              <div>
                <h3>{item.name}</h3>
                <p className={s.muted}>{item.format}</p>
              </div>
              <Status value="Disponível em outubro" tone="green" />
              <span className={s.muted}>{item.capacity}</span>
              <div className={s.spread}>
                <strong>{money(item.price)}</strong>
                <Button
                  aria-pressed={selected.includes(item.name)}
                  icon={selected.includes(item.name) ? Check : Plus}
                  onClick={() =>
                    setSelected((previous) =>
                      previous.includes(item.name)
                        ? previous.filter((name) => name !== item.name)
                        : [...previous, item.name],
                    )
                  }
                >
                  {selected.includes(item.name) ? 'Adicionado' : 'Adicionar'}
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <div className={s.empty}>
          <h3>Nenhuma mídia encontrada</h3>
          <Button
            onClick={() => {
              setQuery('');
              setChannel('Todos');
            }}
          >
            Limpar filtros
          </Button>
        </div>
      )}
      {selected.length > 0 && (
        <div className={s.spread}>
          <span>
            {selected.length} mídias ·{' '}
            {money(
              offers
                .filter((item) => selected.includes(item.name))
                .reduce((sum, item) => sum + item.price, 0),
            )}
          </span>
          <Button
            variant="primary"
            onClick={() => notify('Seleção adicionada ao plano desta demonstração.')}
          >
            Adicionar ao plano
          </Button>
        </div>
      )}
    </div>
  );
}

export function CampaignWizard({ notify }: { notify: Notify }) {
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousScreen = useRef(`${step}-${finished}`);
  useEffect(() => {
    const screen = `${step}-${finished}`;
    if (previousScreen.current !== screen) heading.current?.focus();
    previousScreen.current = screen;
  }, [step, finished]);
  const [name, setName] = useState('');
  const [advertiser, setAdvertiser] = useState('Calçados Aurora');
  const [start, setStart] = useState('01/10/2026');
  const [end, setEnd] = useState('31/10/2026');
  const [dateError, setDateError] = useState('');
  const [error, setError] = useState('');
  const [chosen, setChosen] = useState(['Display no portal']);
  const [device, setDevice] = useState('Desktop');
  const uid = useId();
  const total = offers
    .filter((item) => chosen.includes(item.name))
    .reduce((sum, item) => sum + item.price, 0);
  function next() {
    if (step === 0 && name.trim().length < 3) {
      setError('Informe um nome com pelo menos 3 caracteres.');
      document.getElementById(uid)?.focus();
      return;
    }
    if (
      step === 0 &&
      (!parseDate(start) || !parseDate(end) || parseDate(start)! > parseDate(end)!)
    ) {
      setDateError('Informe um período válido, com o fim após o início.');
      document.getElementById(`${uid}-to`)?.focus();
      return;
    }
    setDateError('');
    if (step === 1 && !chosen.length) {
      setError('Selecione pelo menos uma mídia.');
      return;
    }
    setError('');
    setStep(Math.min(2, step + 1));
  }
  if (finished)
    return (
      <div className={r.wizardLayout}>
        <aside className={r.wizardRail}>
          <small>Nova campanha</small>
          <Stepper
            current={3}
            orientation="vertical"
            steps={[
              { label: 'Informações', description: 'Anunciante e período' },
              { label: 'Mídias', description: 'Formatos e investimento' },
              { label: 'Revisão', description: 'Conferência do plano' },
            ]}
            onStepChange={(nextStep) => {
              setFinished(false);
              setStep(nextStep);
            }}
          />
        </aside>
        <section className={r.wizardContent}>
          <div className={s.stack}>
            <Check size={28} style={{ color: '#278252' }} />
            <div>
              <h3 ref={heading} tabIndex={-1}>
                Campanha pronta para revisão
              </h3>
              <p className={s.muted}>O rascunho foi concluído nesta demonstração.</p>
            </div>
            <Description
              entries={[
                ['Campanha', name],
                ['Anunciante', advertiser],
                ['Veiculação', `${start} a ${end}`],
                ['Mídias', chosen.join(', ')],
                ['Investimento', money(total)],
              ]}
            />
            <div>
              <Button
                onClick={() => {
                  setFinished(false);
                  setStep(0);
                }}
              >
                Editar novamente
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  return (
    <div className={r.wizardLayout}>
      <aside className={r.wizardRail}>
        <small>Nova campanha</small>
        <Stepper
          current={step}
          orientation="vertical"
          onStepChange={setStep}
          steps={[
            { label: 'Informações', description: 'Anunciante e período' },
            { label: 'Mídias', description: 'Formatos e investimento' },
            { label: 'Revisão', description: 'Conferência do plano' },
          ]}
        />
      </aside>
      <section className={r.wizardContent}>
        <div className={r.wizardHeading}>
          <h3 ref={heading} tabIndex={-1}>
            {['Informações da campanha', 'Escolha as mídias', 'Revisão da campanha'][step]}
          </h3>
          <p>
            {
              [
                'Defina o anunciante e o período da veiculação.',
                'Combine os formatos que fazem sentido para a campanha.',
                'Confira os dados antes de enviar.',
              ][step]
            }
          </p>
        </div>
        {step === 0 && (
          <div className={s.two}>
            <div className={s.stack}>
              <FormField id={uid} label="Nome da campanha" required>
                <Input
                  id={uid}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  error={error || undefined}
                  placeholder="Ex.: Lançamento primavera"
                />
              </FormField>
              <FormField id={`${uid}-advertiser`} label="Anunciante">
                <Select
                  id={`${uid}-advertiser`}
                  label="Anunciante"
                  value={advertiser}
                  onValueChange={setAdvertiser}
                  options={options(['Calçados Aurora', 'Studio Forma', 'Grupo Horizonte'])}
                />
              </FormField>
              <div className={s.two}>
                <FormField id={`${uid}-from`} label="Início">
                  <DateInput
                    id={`${uid}-from`}
                    name="from"
                    label="Início"
                    defaultValue={start}
                    onValueChange={setStart}
                  />
                </FormField>
                <FormField id={`${uid}-to`} label="Fim">
                  <DateInput
                    id={`${uid}-to`}
                    name="to"
                    label="Fim"
                    defaultValue={end}
                    onValueChange={setEnd}
                    error={dateError || undefined}
                  />
                </FormField>
              </div>
            </div>
            <aside style={{ padding: 20, background: 'var(--sidebar)', borderRadius: 8 }}>
              <h3 style={{ marginBottom: 16 }}>Resumo do plano</h3>
              <Description
                entries={[
                  ['Portal', 'Francal 2026'],
                  ['Status', <Status key="draft" value="Rascunho" />],
                  ['Mídias', String(chosen.length)],
                  ['Total', money(total)],
                ]}
              />
            </aside>
          </div>
        )}
        {step === 1 && (
          <div className={r.selectionLayout}>
            <div className={s.stack}>
              <div className={r.choiceGrid} role="group" aria-label="Mídias da campanha">
                {offers.map((item) => (
                  <ChoiceCard
                    key={item.name}
                    type="checkbox"
                    title={item.name}
                    description={item.capacity}
                    preview={<MiniPreview type={item.channel} />}
                    checked={chosen.includes(item.name)}
                    onChange={(event) =>
                      setChosen(
                        event.target.checked
                          ? [...chosen, item.name]
                          : chosen.filter((name) => name !== item.name),
                      )
                    }
                  >
                    <span style={{ font: 'var(--type-label)', marginTop: 6 }}>
                      {money(item.price)}
                    </span>
                  </ChoiceCard>
                ))}
              </div>
              {error && (
                <p role="alert" style={{ color: 'var(--status-pink)' }}>
                  {error}
                </p>
              )}
              <span className={s.muted}>
                {chosen.length} {chosen.length === 1 ? 'mídia selecionada' : 'mídias selecionadas'}{' '}
                · {money(total)}
              </span>
            </div>
            <aside className={r.selectionPreview}>
              <strong>Prévia de contexto</strong>
              <Segmented
                label="Dispositivo da prévia"
                values={['Desktop', 'Celular']}
                value={device}
                onChange={setDevice}
              />
              <div className={r.previewScreen} data-device={device}>
                <strong>{advertiser}</strong>
                <div className={r.previewArtwork}>
                  <small>FRANCAL 2026</small>
                  <strong>{name || 'Sua campanha'}</strong>
                </div>
                <p>
                  {chosen.length ? chosen.join(' · ') : 'Selecione uma mídia para compor o plano.'}
                </p>
              </div>
              <small>Composição ilustrativa dos formatos selecionados.</small>
            </aside>
          </div>
        )}
        {step === 2 && (
          <div className={review.layout}>
            <div className={review.sections}>
              <section>
                <header>
                  <h4>Informações da campanha</h4>
                  <Button size="small" variant="ghost" onClick={() => setStep(0)}>
                    Editar informações
                  </Button>
                </header>
                <h3>{name}</h3>
                <p>{advertiser} · Portal Francal 2026</p>
                <dl className={review.facts}>
                  <div>
                    <dt>Início da veiculação</dt>
                    <dd>{start}</dd>
                  </div>
                  <div>
                    <dt>Fim da veiculação</dt>
                    <dd>{end}</dd>
                  </div>
                </dl>
              </section>
              <section>
                <header>
                  <h4>
                    Plano de mídia <span>{chosen.length}</span>
                  </h4>
                  <Button size="small" variant="ghost" onClick={() => setStep(1)}>
                    Editar mídias
                  </Button>
                </header>
                <ul className={review.mediaList}>
                  {offers
                    .filter((item) => chosen.includes(item.name))
                    .map((item) => (
                      <li key={item.name}>
                        <div className={review.thumbnail}>
                          <MiniPreview type={item.channel} />
                        </div>
                        <div>
                          <strong>{item.name}</strong>
                          <p>{item.format}</p>
                          <span>{item.capacity}</span>
                        </div>
                        <strong className={review.price}>{money(item.price)}</strong>
                      </li>
                    ))}
                </ul>
              </section>
              <div className={review.ready}>
                <Check size={16} />
                <span>
                  Informações preenchidas e{' '}
                  {chosen.length === 1 ? 'mídia selecionada' : 'mídias selecionadas'}. Pronto para
                  revisão.
                </span>
              </div>
            </div>
            <aside className={review.summary}>
              <span>Resumo do investimento</span>
              <strong className={review.total}>{money(total)}</strong>
              <p>
                Período completo · {chosen.length} {chosen.length === 1 ? 'mídia' : 'mídias'}
              </p>
              <dl>
                {offers
                  .filter((item) => chosen.includes(item.name))
                  .map((item) => (
                    <div key={item.name}>
                      <dt>{item.channel}</dt>
                      <dd>{money(item.price)}</dd>
                    </div>
                  ))}
                <div className={review.totalLine}>
                  <dt>Total previsto</dt>
                  <dd>{money(total)}</dd>
                </div>
              </dl>
              <Status value="Rascunho · aguardando revisão" tone="amber" />
              <small>O envio conclui este exemplo. Nenhuma campanha é publicada.</small>
            </aside>
          </div>
        )}
        <div
          className={s.spread}
          style={{ borderTop: '1px solid var(--line)', paddingTop: 20, marginTop: 8 }}
        >
          <Button disabled={step === 0} onClick={() => setStep(step - 1)}>
            Voltar
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (step < 2) next();
              else {
                setFinished(true);
                notify('Campanha enviada para revisão na demonstração.');
              }
            }}
          >
            {step === 2 ? 'Enviar para revisão' : 'Continuar'}
          </Button>
        </div>
      </section>
    </div>
  );
}

function ImportFlow({ notify }: { notify: Notify }) {
  const [step, setStep] = useState(0);
  const [source, setSource] = useState(
    'nome,email,empresa\nAna Lima,ana@example.com,Aurora\nPedro Costa,pedro@example.com,Forma',
  );
  const [mapping, setMapping] = useState('email');
  const [error, setError] = useState('');
  const rows = source
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(','));
  function exportFile() {
    const blob = new Blob([source], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'publicos-exemplo.csv';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className={s.stack}>
      <Steps current={step} labels={['Arquivo', 'Mapeamento', 'Resultado']} />
      {step === 0 && (
        <>
          <FormField id="csv-source" label="Conteúdo do CSV">
            <Textarea
              id="csv-source"
              rows={5}
              value={source}
              onChange={(event) => setSource(event.target.value)}
            />
          </FormField>
          <span className={s.muted}>
            Amostra simples separada por vírgulas, sem campos com aspas. Dados de demonstração.
          </span>
          <Button
            onClick={() => {
              if (rows.length < 2 || !rows[0]?.includes('email')) {
                setError('Inclua um cabeçalho email e pelo menos um registro.');
                return;
              }
              setError('');
              setStep(1);
            }}
          >
            Validar amostra
          </Button>
          {error && <p role="alert">{error}</p>}
        </>
      )}
      {step === 1 && (
        <>
          <Description
            entries={[
              ['Registros', String(rows.length - 1)],
              ['Colunas', rows[0]?.join(', ')],
            ]}
          />
          <Select
            label="Coluna de e-mail"
            value={mapping}
            onValueChange={setMapping}
            options={options(rows[0] ?? [])}
          />
          <ul className={s.list}>
            {rows.slice(1, 4).map((row, index) => (
              <li key={index}>
                <strong>{row[0]}</strong>
                <span>{row[rows[0]?.indexOf(mapping) ?? 1]}</span>
              </li>
            ))}
          </ul>
          <div className={s.spread}>
            <Button onClick={() => setStep(0)}>Voltar</Button>
            <Button
              variant="primary"
              onClick={() => {
                setStep(2);
                notify('Validação concluída. Nenhum registro foi enviado.');
              }}
            >
              Concluir simulação
            </Button>
          </div>
        </>
      )}
      {step === 2 && (
        <div className={s.empty}>
          <Check size={26} />
          <h3>{rows.length - 1} registros na amostra</h3>
          <p>Prévia concluída. Nenhum público foi alterado.</p>
          <Button icon={Download} onClick={exportFile}>
            Baixar CSV de exemplo
          </Button>
          <Button variant="ghost" onClick={() => setStep(0)}>
            Revisar amostra
          </Button>
        </div>
      )}
    </div>
  );
}
function MemberList({ notify }: { notify: Notify }) {
  return <MemberCards notify={notify} />;
}
function VitrineEditor({ notify }: { notify: Notify }) {
  const [blocks, setBlocks] = useState(['Apresentação', 'Produtos', 'Contato']);
  const [selected, setSelected] = useState('Apresentação');
  const [title, setTitle] = useState('Calçados Aurora');
  function move(index: number, offset: number) {
    setBlocks((previous) => {
      const next = [...previous];
      const [block] = next.splice(index, 1);
      if (block) next.splice(index + offset, 0, block);
      return next;
    });
  }
  return (
    <div className={s.two}>
      <div className={s.stack}>
        <h3>Blocos da página</h3>
        {blocks.map((block, index) => (
          <div key={block} className={s.spread}>
            <Button
              variant={selected === block ? 'secondary' : 'ghost'}
              onClick={() => setSelected(block)}
            >
              {block}
            </Button>
            <div className={s.row}>
              <IconButton
                label={`Subir ${block}`}
                icon={ArrowUp}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              />
              <IconButton
                label={`Descer ${block}`}
                icon={ArrowDown}
                disabled={index === blocks.length - 1}
                onClick={() => move(index, 1)}
              />
            </div>
          </div>
        ))}
        <Input
          aria-label="Nome da marca"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Button onClick={() => notify('Organização salva na prévia local.')}>
          Salvar organização
        </Button>
      </div>
      <div
        className={s.stack}
        style={{ background: 'var(--sidebar)', padding: 20, borderRadius: 7 }}
      >
        <span className={s.muted}>Prévia · bloco {selected}</span>
        {blocks.map((block) => (
          <section key={block} style={{ padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
            <h3>{block === 'Apresentação' ? title : block}</h3>
            <p className={s.muted}>
              {block === 'Apresentação'
                ? 'Design e conforto para cada passo.'
                : block === 'Produtos'
                  ? 'Coleção primavera · Linha Essencial'
                  : 'Fale com a equipe comercial.'}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}

export function ProductSpecimen({
  id,
  notify,
  embedded = false,
}: {
  id: string;
  notify: Notify;
  embedded?: boolean;
}) {
  const [value, setValue] = useState('Display');
  const [note, setNote] = useState('');
  const [entries, setEntries] = useState<string[]>([]);
  const [checked, setChecked] = useState(true);
  const [amount, setAmount] = useState(10);
  const [status, setStatus] = useState('Em revisão');
  const uid = useId();
  let content;
  switch (id) {
    case 'wizard':
      content = <CampaignWizard notify={notify} />;
      break;
    case 'formulario-dinamico':
      content = (
        <div className={s.form}>
          <FormField id={uid} label="Tipo de mídia">
            <Select
              id={uid}
              label="Tipo de mídia"
              value={value}
              onValueChange={setValue}
              options={options(['Display', 'E-mail', 'Social'])}
            />
          </FormField>
          <FormField
            id={`${uid}-title`}
            label={
              value === 'E-mail'
                ? 'Assunto do e-mail'
                : value === 'Social'
                  ? 'Título da publicação'
                  : 'Nome do criativo'
            }
          >
            <Input id={`${uid}-title`} maxLength={80} />
          </FormField>
          {value === 'Display' ? (
            <Select
              label="Formato do banner"
              options={options(['1.200 × 628 px', '970 × 250 px', '300 × 250 px'])}
            />
          ) : (
            <Textarea
              aria-label={value === 'E-mail' ? 'Corpo do e-mail' : 'Legenda da publicação'}
              rows={4}
              placeholder={
                value === 'E-mail' ? 'Mensagem para a base segmentada…' : 'Mensagem da publicação…'
              }
            />
          )}
          <Input aria-label="URL de destino" type="url" placeholder="https://sua-marca.com.br" />
          <Button variant="primary" onClick={() => notify('Briefing salvo neste exemplo.')}>
            Salvar briefing
          </Button>
        </div>
      );
      break;
    case 'kanban':
      content = <LeadBoard />;
      break;
    case 'card-lead':
      content = <LeadBoard single />;
      break;
    case 'detalhe-lead':
      content = <RecordDetail notify={notify} />;
      break;
    case 'registro-atividade':
      content = (
        <div className={s.two}>
          <form
            className={s.stack}
            onSubmit={(event) => {
              event.preventDefault();
              if (note.trim()) {
                setEntries((previous) => [note.trim(), ...previous]);
                setNote('');
              }
            }}
          >
            <Select
              label="Tipo de atividade"
              options={options(['Ligação', 'Reunião', 'E-mail', 'Nota interna'])}
            />
            <FormField id={uid} label="Resumo do contato">
              <Textarea
                id={uid}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={4}
                required
              />
            </FormField>
            <Button type="submit" variant="primary" disabled={!note.trim()}>
              Registrar atividade
            </Button>
          </form>
          <Activity extra={entries} />
        </div>
      );
      break;
    case 'ativo-midia':
      content = <MediaCatalog notify={notify} />;
      break;
    case 'disponibilidade':
      content = (
        <div className={s.stack}>
          <Select
            compact
            label="Mês de disponibilidade"
            value={value === 'Novembro' ? 'Novembro' : 'Outubro'}
            onValueChange={setValue}
            options={options(['Outubro', 'Novembro'])}
          />
          {offers.map((offer, index) => (
            <div key={offer.name} className={s.stack} style={{ gap: 10, padding: '14px 0' }}>
              <div className={s.spread}>
                <strong>{offer.name}</strong>
                <Status
                  value={index === 2 && value !== 'Novembro' ? 'Esgotado' : 'Disponível'}
                  tone={index === 2 && value !== 'Novembro' ? 'neutral' : 'green'}
                />
              </div>
              <div className={s.progress}>
                <span
                  style={{
                    width: `${index === 2 && value !== 'Novembro' ? 100 : (index + 1) * 22}%`,
                  }}
                />
              </div>
              <span className={s.muted}>
                {index === 2 && value !== 'Novembro'
                  ? '2 de 2 publicações reservadas'
                  : `${(index + 1) * 22}% da capacidade reservada`}
              </span>
            </div>
          ))}
        </div>
      );
      break;
    case 'resumo-campanha':
      content = (
        <div className={s.stack}>
          <div className={s.spread}>
            <h3>Lançamento primavera</h3>
            <Status value="Em veiculação" tone="blue" />
          </div>
          <Description
            entries={[
              ['Anunciante', 'Calçados Aurora'],
              ['Período', '01 a 31 out, 2026'],
              ['Mídias', 'Display, E-mail e Social'],
              ['Investimento', 'R$ 24.800,00'],
            ]}
          />
          <Metrics />
        </div>
      );
      break;
    case 'pedido-insercao':
      content = (
        <div className={s.stack}>
          <div className={s.spread}>
            <div>
              <h3>PI-2026-048</h3>
              <p>Calçados Aurora · Lançamento primavera</p>
            </div>
            <Status
              value={checked ? 'Aguardando assinatura' : 'Assinado'}
              tone={checked ? 'amber' : 'green'}
            />
          </div>
          <ul className={s.list}>
            {offers.map((item) => (
              <li key={item.name}>
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.capacity}</small>
                </div>
                <strong>{money(item.price)}</strong>
              </li>
            ))}
          </ul>
          <Description
            entries={[
              ['Total', 'R$ 24.800,00'],
              ['Pagamento', '30 dias após emissão'],
              ['Veiculação', '01 a 31 out, 2026'],
            ]}
          />
          <Button
            disabled={!checked}
            onClick={() => {
              setChecked(false);
              notify('Assinatura simulada. Nenhum documento foi assinado.');
            }}
          >
            {checked ? 'Simular assinatura' : 'Simulação concluída'}
          </Button>
        </div>
      );
      break;
    case 'aprovacao':
      content = (
        <div className={s.stack}>
          <div className={s.spread}>
            <h3>Revisão do plano de mídia</h3>
            <Status
              value={status}
              tone={
                status === 'Aprovado'
                  ? 'green'
                  : status === 'Ajustes solicitados'
                    ? 'pink'
                    : 'amber'
              }
            />
          </div>
          <Description
            entries={[
              ['Campanha', 'Lançamento primavera'],
              ['Solicitante', 'Ana Lima'],
              ['Total', 'R$ 24.800,00'],
            ]}
          />
          <FormField id={uid} label="Observação da revisão">
            <Textarea
              id={uid}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
            />
          </FormField>
          <div className={s.row}>
            <Button disabled={!note.trim()} onClick={() => setStatus('Ajustes solicitados')}>
              Solicitar ajustes
            </Button>
            <Button variant="primary" onClick={() => setStatus('Aprovado')}>
              Aprovar plano
            </Button>
          </div>
          <p className={s.muted}>
            Solicitar ajustes exige uma observação. Aprovação apenas visual.
          </p>
        </div>
      );
      break;
    case 'preco-bonus':
      content = (
        <div className={s.two}>
          <div className={s.stack}>
            <FormField id={uid} label="Desconto comercial">
              <Input
                id={uid}
                type="number"
                min={0}
                max={20}
                value={amount}
                onChange={(event) =>
                  setAmount(Math.max(0, Math.min(20, Number(event.target.value))))
                }
                suffix="%"
              />
            </FormField>
            <Switch
              label="Adicionar bonificação de mídia"
              checked={checked}
              onCheckedChange={setChecked}
            />
            <p>Faixa do exemplo: até 20%. A regra comercial real pertence ao produto.</p>
          </div>
          <Description
            entries={[
              ['Subtotal', money(24800)],
              ['Desconto', `− ${money((24800 * amount) / 100)}`],
              ['Bônus', checked ? '1 publicação adicional' : 'Sem bonificação'],
              ['Total', money(24800 * (1 - amount / 100))],
            ]}
          />
        </div>
      );
      break;
    case 'importar-exportar':
      content = <ImportFlow notify={notify} />;
      break;
    case 'membros':
      content = <MemberList notify={notify} />;
      break;
    case 'editor-vitrine':
      content = <VitrineEditor notify={notify} />;
      break;
    case 'produto-vitrine':
      content = (
        <div className={s.two}>
          <div className={s.mediaArtwork} style={{ minHeight: 270 }}>
            <small>CALÇADOS AURORA</small>
            <strong>Linha Essencial</strong>
            <p>Conforto para todos os dias.</p>
          </div>
          <div className={s.stack}>
            <Status value="Coleção primavera" tone="blue" />
            <h3>Linha Essencial · Aurora</h3>
            <p>Design leve, acabamento natural e conforto para acompanhar a rotina.</p>
            <Description
              entries={[
                ['Categoria', 'Calçados femininos'],
                ['Numeração', '34 a 39'],
                ['Expositor', 'Calçados Aurora'],
              ]}
            />
            <Button
              variant="primary"
              onClick={() => notify('Interesse registrado apenas nesta demonstração.')}
            >
              Tenho interesse
            </Button>
          </div>
        </div>
      );
      break;
    case 'planos':
      content = <PlansExample />;
      break;
    case 'privacidade':
      content = <PrivacyExample notify={notify} />;
      break;
    default:
      throw new Error(`Padrão sem exemplo: ${id}`);
  }
  return embedded ? (
    content
  ) : (
    <Stage
      title="Padrão aplicado ao MediaOn"
      footer="Composição para revisão visual. Dados fictícios e interações locais."
    >
      {content}
    </Stage>
  );
}

export function TemplateSpecimen({ id, notify }: { id: string; notify: Notify }) {
  const [tab, setTab] = useState('Resumo');
  const [submitted, setSubmitted] = useState(false);
  const uid = useId();
  if (id === 'template-acesso')
    return (
      <Stage
        title="Entrada no portal"
        footer="Interface de acesso sem autenticação ou envio de credenciais."
      >
        <div className={s.authShell}>
          <section className={s.authPanel}>
            <div className={s.authBrand}>
              <span aria-hidden="true">
                <Layers size={19} />
              </span>
              <div>
                <strong>MediaOn</strong>
                <small>Gestão de mídia</small>
              </div>
            </div>
            <form
              className={s.authForm}
              onSubmit={(event) => {
                event.preventDefault();
                setSubmitted(true);
              }}
            >
              <div className={s.authHeading}>
                <span>
                  <LockKeyhole size={13} aria-hidden="true" /> Acesso ao portal
                </span>
                <h3>Bem-vindo de volta</h3>
                <p>Entre para acompanhar campanhas, aprovações e resultados.</p>
              </div>
              <div className={s.authFields}>
                <FormField id={`${uid}-email`} label="E-mail profissional">
                  <Input
                    id={`${uid}-email`}
                    type="email"
                    autoComplete="off"
                    placeholder="voce@empresa.com.br"
                    required
                  />
                </FormField>
                <FormField id={`${uid}-password`} label="Senha">
                  <PasswordInput id={`${uid}-password`} autoComplete="off" required />
                </FormField>
              </div>
              <Button variant="primary" type="submit" icon={ArrowRight}>
                Entrar no portal
              </Button>
              {submitted && (
                <output role="status">Exemplo validado. Nenhuma credencial foi enviada.</output>
              )}
              <Button
                className={s.authRecovery}
                variant="ghost"
                type="button"
                onClick={() => notify('Recuperação ilustrativa, sem envio de e-mail.')}
              >
                Esqueci minha senha
              </Button>
            </form>
            <p className={s.authSupport}>
              Precisa de ajuda? <button type="button">Fale com o suporte</button>
            </p>
          </section>
          <aside className={s.authVisual} aria-label="Visão geral do portal MediaOn">
            <div className={s.authVisualCopy}>
              <span>Visão do portal</span>
              <h3>Mídia, campanhas e resultados no mesmo lugar.</h3>
              <p>Uma operação clara para o time comercial avançar com segurança.</p>
            </div>
            <div className={s.authPreview}>
              <div className={s.authPreviewHeader}>
                <div>
                  <span aria-hidden="true">
                    <Layers size={14} />
                  </span>
                  <strong>Francal 2026</strong>
                </div>
                <span>Outubro</span>
              </div>
              <div className={s.authPreviewBody}>
                <div className={s.authPreviewTitle}>
                  <div>
                    <small>Visão geral</small>
                    <strong>Bom dia, Ana</strong>
                  </div>
                  <span>
                    <TrendingUp size={12} /> 12,8%
                  </span>
                </div>
                <div className={s.authMetrics}>
                  <article>
                    <Megaphone size={15} />
                    <span>Campanhas</span>
                    <strong>24</strong>
                  </article>
                  <article>
                    <BarChart3 size={15} />
                    <span>Entrega média</span>
                    <strong>87%</strong>
                  </article>
                  <article>
                    <Check size={15} />
                    <span>Aprovadas</span>
                    <strong>18</strong>
                  </article>
                </div>
                <div className={s.authChart} aria-hidden="true">
                  <div>
                    <span>Ritmo de veiculação</span>
                    <small>Últimos 7 dias</small>
                  </div>
                  <div>
                    {[38, 54, 46, 70, 62, 83, 76].map((height, index) => (
                      <i key={index} style={{ height: `${height}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </Stage>
    );
  if (id === 'template-configuracoes') return <SettingsExample notify={notify} />;
  if (id === 'template-cadastro') return <FormExample notify={notify} />;
  return (
    <Stage
      title={
        {
          'template-dashboard': 'Dashboard do portal',
          'template-listagem': 'Operação de campanhas',
          'template-detalhe': 'Detalhe da campanha',
          'template-configuracoes': 'Preferências do portal',
          'template-catalogo': 'Catálogo de mídia',
          'template-vitrine': 'Página do expositor',
        }[id] ?? 'Template'
      }
      footer="Template de referência para revisão. As composições compartilham a biblioteca V2."
    >
      <div className={s.stack}>
        {id === 'template-dashboard' && (
          <>
            <div className={s.spread}>
              <div>
                <h3>Visão geral</h3>
                <p>Francal 2026 · Outubro</p>
              </div>
              <Button
                onClick={() => {
                  window.location.hash = 'wizard';
                }}
                icon={Plus}
              >
                Nova campanha
              </Button>
            </div>
            <SetupChecklist />
            <Metrics />
            <ChartSpecimen id="grafico-linhas" embedded />
            <Activity />
          </>
        )}
        {id === 'template-listagem' && (
          <>
            <div className={s.spread}>
              <h3>Campanhas</h3>
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => {
                  window.location.hash = 'wizard';
                }}
              >
                Nova campanha
              </Button>
            </div>
            <DataSpecimen id="data-table" notify={notify} embedded />
          </>
        )}
        {id === 'template-detalhe' && (
          <>
            <div className={s.spread}>
              <h3>Lançamento primavera</h3>
              <Button
                onClick={() => {
                  window.location.hash = 'template-cadastro';
                }}
              >
                Editar
              </Button>
            </div>
            <Tabs
              label="Seções da campanha"
              values={['Resumo', 'Atividades', 'Pedidos'].map((label) => ({ id: label, label }))}
              active={tab}
              onChange={setTab}
            />
            {tab === 'Resumo' ? (
              <ProductSpecimen id="resumo-campanha" notify={notify} embedded />
            ) : tab === 'Atividades' ? (
              <Activity />
            ) : (
              <ProductSpecimen id="pedido-insercao" notify={notify} embedded />
            )}
          </>
        )}
        {id === 'template-catalogo' && (
          <>
            <div>
              <h3>Mídias para a sua próxima campanha</h3>
              <p>Explore os canais disponíveis no portal Francal.</p>
            </div>
            <MediaCatalog notify={notify} />
          </>
        )}
        {id === 'template-vitrine' && (
          <>
            <div className={s.spread}>
              <strong>francal.</strong>
              <span className={s.muted}>Expositores / Calçados Aurora</span>
            </div>
            <ProductSpecimen id="produto-vitrine" notify={notify} embedded />
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 20 }}>
              <h3>Sobre a marca</h3>
              <p>Uma coleção pensada para combinar design, conforto e versatilidade.</p>
            </div>
          </>
        )}
      </div>
    </Stage>
  );
}
