'use client';
import { useId, useState } from 'react';
import { CalendarDays, MailCheck } from 'lucide-react';
import {
  Button,
  Input,
  Textarea,
  Select,
  MoneyInput,
  DateInput,
  Checkbox,
  SwitchField,
  NumberInput,
  Slider,
  ColorPicker,
  VerificationCode,
  SearchField,
  FormField,
  PasswordInput,
  Combobox,
  parseDate,
} from '../../components/ds-v2';
import { FormExample } from './base-examples';
import { AgendaExample } from './agenda-specimen';
import { Stage, Segmented } from './specimen-ui';
import { useToast } from '../../components/ds-v2';
import s from './specimen.module.css';

const options = [
  { value: 'francal', label: 'Francal 2026', description: 'Calçados e acessórios' },
  { value: 'beauty', label: 'Beauty Fair', description: 'Beleza e negócios' },
  { value: 'abf', label: 'ABF Franchising', description: 'Franquias' },
  { value: 'pet', label: 'Pet South America', description: 'Portal indisponível', disabled: true },
];
export function FieldSpecimen({
  id,
  notify,
}: {
  id: string;
  notify: ReturnType<typeof useToast>['notify'];
}) {
  const uid = useId();
  const [state, setState] = useState('Padrão');
  const [value, setValue] = useState('');
  const [chosen, setChosen] = useState<string[]>(id === 'checkbox' ? ['Display'] : ['francal']);
  const [enabled, setEnabled] = useState(true);
  const [number, setNumber] = useState(35);
  const [quantity, setQuantity] = useState<number | ''>(12);
  const [start, setStart] = useState('01/10/2026');
  const [end, setEnd] = useState('31/10/2026');
  const [channel, setChannel] = useState('Display');
  const error =
    state === 'Erro'
      ? ({
          numero: 'Informe uma quantidade entre 1 e 99.999.999.',
          moeda: 'Informe um investimento maior que zero.',
          senha: 'Use pelo menos 8 caracteres.',
          textarea: 'Descreva o objetivo da campanha.',
        }[id] ?? 'Informe um nome com pelo menos 3 caracteres.')
      : undefined;
  const disabled = state === 'Desabilitado';
  const fieldProps = {
    id: uid,
    disabled,
    readOnly: state === 'Leitura',
    required: state === 'Obrigatório',
    error,
  };
  const periodInvalid =
    !!parseDate(start) && !!parseDate(end) && parseDate(start)! > parseDate(end)!;
  if (id === 'calendario') return <AgendaExample />;
  if (id === 'validacao') return <FormExample notify={notify} />;
  return (
    <Stage
      title={id === 'campo' ? 'Anatomia de um campo' : 'Configuração de campanha'}
      tools={
        ['campo', 'input', 'textarea', 'senha', 'numero', 'moeda'].includes(id) ? (
          <Select
            compact
            label="Estado do campo"
            value={state}
            onValueChange={setState}
            options={['Padrão', 'Obrigatório', 'Erro', 'Desabilitado', 'Leitura'].map((value) => ({
              value,
              label: value,
            }))}
          />
        ) : undefined
      }
      footer="Dados de exemplo. Alterações ficam apenas nesta demonstração."
    >
      <div className={s.form}>
        {(id === 'campo' || id === 'input') && (
          <>
            <FormField
              id={uid}
              label="Nome da campanha"
              required={fieldProps.required}
              meta={`${value.length}/80`}
              hint={
                id === 'campo' ? 'Use um nome que facilite encontrar a campanha depois.' : undefined
              }
            >
              <Input
                {...fieldProps}
                placeholder="Ex.: Lançamento primavera 2026"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                maxLength={80}
                aria-describedby={id === 'campo' ? `${uid}-hint` : undefined}
              />
            </FormField>
          </>
        )}
        {id === 'textarea' && (
          <FormField id={uid} label="Briefing" meta={`${value.length}/280`}>
            <Textarea
              {...fieldProps}
              rows={4}
              maxLength={280}
              placeholder="Objetivo, público e mensagem da campanha…"
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </FormField>
        )}
        {id === 'senha' && (
          <>
            <FormField
              id={uid}
              label="Senha de acesso"
              hint={
                value.length >= 8 ? 'Comprimento mínimo atendido.' : 'Use pelo menos 8 caracteres.'
              }
            >
              <PasswordInput
                {...fieldProps}
                aria-describedby={`${uid}-hint`}
                autoComplete="new-password"
                value={value}
                onChange={(event) => setValue(event.target.value)}
              />
            </FormField>
          </>
        )}
        {id === 'numero' && (
          <FormField id={uid} label="Quantidade de inserções">
            <NumberInput
              {...fieldProps}
              value={quantity}
              onValueChange={setQuantity}
              min={1}
              max={99_999_999}
              step={1}
              suffix="inserções"
            />
          </FormField>
        )}
        {id === 'moeda' && (
          <FormField id={uid} label="Investimento previsto">
            <MoneyInput
              id={uid}
              name="budget"
              defaultValue={24800}
              disabled={disabled}
              error={error}
              readOnly={fieldProps.readOnly}
              required={fieldProps.required}
            />
          </FormField>
        )}
        {id === 'busca' && (
          <FormField id={uid} label="Buscar portal">
            <SearchField
              id={uid}
              label="Buscar portais"
              options={options}
              onSelect={(option) => notify(`${option.label} selecionado no exemplo.`)}
            />
          </FormField>
        )}
        {id === 'select' && (
          <>
            <FormField id={uid} label="Portal">
              <Select
                id={uid}
                label="Portal"
                options={options}
                value={chosen[0]}
                onValueChange={(value) => setChosen([value])}
              />
            </FormField>
            <FormField id={`${uid}-disabled`} label="Canal indisponível">
              <Select
                id={`${uid}-disabled`}
                label="Canal indisponível"
                options={[{ value: 'pending', label: 'Aguardando aprovação' }]}
                disabled
              />
            </FormField>
          </>
        )}
        {(id === 'combobox' || id === 'multiselect') && (
          <>
            <span className={s.muted}>
              {id === 'multiselect' ? 'Portais participantes' : 'Portal da campanha'}
            </span>
            <Combobox
              label={id === 'multiselect' ? 'Selecionar portais' : 'Selecionar portal'}
              options={options}
              value={chosen}
              onChange={setChosen}
              multiple={id === 'multiselect'}
            />
            <output>
              {chosen.length} {chosen.length === 1 ? 'portal selecionado' : 'portais selecionados'}
            </output>
          </>
        )}
        {id === 'checkbox' && (
          <div className={s.checklist}>
            <Checkbox
              label="Selecionar todos os canais"
              checked={chosen.length === 3}
              indeterminate={chosen.length > 0 && chosen.length < 3}
              onChange={(event) =>
                setChosen(event.target.checked ? ['Display', 'E-mail', 'Social'] : [])
              }
            />
            {['Display', 'E-mail', 'Social'].map((item) => (
              <Checkbox
                key={item}
                label={item}
                checked={chosen.includes(item)}
                onChange={(event) =>
                  setChosen(
                    event.target.checked
                      ? [...chosen, item]
                      : chosen.filter((value) => value !== item),
                  )
                }
              />
            ))}
            <Checkbox label="Canal bloqueado pelo portal" disabled />
          </div>
        )}
        {id === 'radio' && (
          <fieldset className={s.choiceGroup}>
            <legend>Objetivo da campanha</legend>
            <div className={s.choiceList}>
              {[
                ['Display', 'Reconhecimento', 'Ampliar a presença da marca.'],
                ['Leads', 'Geração de leads', 'Capturar contatos interessados.'],
                ['Vendas', 'Conversão', 'Levar o público até a oferta.'],
              ].map(([key, label, description]) => (
                <label key={key} className={s.choice}>
                  <input
                    type="radio"
                    name={uid}
                    value={key}
                    checked={channel === key}
                    onChange={() => setChannel(key!)}
                  />
                  <span>
                    <strong>{label}</strong>
                    <small>{description}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        {id === 'switch' && (
          <>
            <SwitchField
              label="Veiculação da campanha"
              description="Controla a entrega em todos os canais contratados."
              stateLabel={enabled ? 'Ativa' : 'Pausada'}
              checked={enabled}
              onCheckedChange={setEnabled}
            />
            <SwitchField
              label="Campanha em aprovação"
              description="Disponível após a aprovação."
              stateLabel="Indisponível"
              checked={false}
              disabled
              onCheckedChange={() => {}}
            />
          </>
        )}
        {id === 'slider' && (
          <div className={s.sliderField}>
            <div className={s.sliderHeading}>
              <label htmlFor={uid}>Limite diário de investimento</label>
              <output htmlFor={uid}>R$ {number * 10}</output>
            </div>
            <div className={s.sliderTrack}>
              <Slider
                id={uid}
                min={10}
                max={100}
                step={5}
                value={number}
                aria-valuetext={`R$ ${number * 10} por dia`}
                onChange={(event) => setNumber(Number(event.target.value))}
              />
              <div className={s.sliderScale} aria-hidden="true">
                <span>R$ 100</span>
                <span>R$ 1.000</span>
              </div>
            </div>
            <div className={s.sliderEstimate}>
              <CalendarDays size={14} aria-hidden="true" />
              <span>Saldo estimado</span>
              <strong>{Math.floor(24800 / (number * 10))} dias</strong>
            </div>
          </div>
        )}
        {id === 'periodo' && (
          <div className={s.periodForm}>
            <Segmented
              label="Período"
              values={['Outubro', 'Novembro']}
              value={channel === 'Novembro' ? 'Novembro' : 'Outubro'}
              onChange={(month) => {
                setChannel(month);
                setStart(month === 'Outubro' ? '01/10/2026' : '01/11/2026');
                setEnd(month === 'Outubro' ? '31/10/2026' : '30/11/2026');
              }}
            />
            <div className={s.periodFields} key={channel}>
              <FormField id={uid} label="Início">
                <DateInput
                  id={uid}
                  name="from"
                  label="Início"
                  defaultValue={start}
                  onValueChange={setStart}
                />
              </FormField>
              <FormField id={`${uid}-end`} label="Fim">
                <DateInput
                  id={`${uid}-end`}
                  name="to"
                  label="Fim"
                  defaultValue={end}
                  onValueChange={setEnd}
                  error={periodInvalid ? 'O fim precisa ser posterior ao início.' : undefined}
                />
              </FormField>
            </div>
            <Button disabled={periodInvalid} onClick={() => notify('Período aplicado ao exemplo.')}>
              Aplicar período
            </Button>
          </div>
        )}
        {id === 'seletor-cor' && <ColorPicker value={value || '#0875db'} onChange={setValue} />}
        {id === 'codigo' && (
          <div className={s.verification}>
            <span className={s.verificationIcon}>
              <MailCheck size={23} aria-hidden="true" />
            </span>
            <div className={s.verificationIntro}>
              <h3>Verifique seu e-mail</h3>
              <p>
                Digite o código de seis dígitos enviado para <strong>jo•••@mediaon.com</strong>.
              </p>
            </div>
            <VerificationCode value={value} onChange={setValue} />
            <Button
              variant="primary"
              disabled={value.length !== 6}
              onClick={() => notify('Código de demonstração confirmado.')}
            >
              Confirmar código
            </Button>
            <div className={s.verificationResend}>
              <span>Não recebeu o código?</span>
              <Button
                size="small"
                variant="ghost"
                onClick={() => notify('Reenvio simulado. Nenhum e-mail foi enviado.')}
              >
                Reenviar
              </Button>
            </div>
          </div>
        )}
      </div>
    </Stage>
  );
}
