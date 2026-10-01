'use client';

import { useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  FileText,
  Megaphone,
  MousePointer2,
  Target,
  Users,
} from 'lucide-react';
import { Alert, Badge, Button, Field, Input, Steps } from './primitives';
import { money } from './campaign-table';
import s from './patterns.module.css';

const steps = ['Objetivo', 'Público e canais', 'Investimento', 'Revisão'];
const initialDraft = {
  name: '',
  objective: 'leads',
  audience: 'Compradores do setor',
  channels: ['Vitrine'],
  budget: '5000',
  start: '2026-10-01',
  end: '2026-10-30',
};
export function CampaignWizard({ onNotify }: { onNotify: (message: string) => void }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(initialDraft);
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const budgetRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  function advance() {
    if (step === 0 && !draft.name.trim()) {
      setError('Dê um nome à campanha para continuar.');
      nameRef.current?.focus();
      return;
    }
    if (step === 1 && draft.channels.length === 0) {
      setError('Selecione pelo menos um canal.');
      return;
    }
    if (step === 2 && (!Number.isFinite(Number(draft.budget)) || Number(draft.budget) <= 0)) {
      setError('Informe um investimento maior que zero.');
      budgetRef.current?.focus();
      return;
    }
    if (step === 2 && (!draft.start || !draft.end || draft.end < draft.start)) {
      setError('A data final deve ser igual ou posterior à data de início.');
      return;
    }
    setError('');
    if (step === 3) {
      setComplete(true);
      onNotify('Demonstração concluída. Nenhuma campanha real foi criada.');
    } else setStep(step + 1);
    requestAnimationFrame(() => titleRef.current?.focus());
  }
  function saveDraft() {
    try {
      sessionStorage.setItem('mediaon-ds-v2-campaign-demo', JSON.stringify(draft));
      onNotify('Rascunho de demonstração salvo nesta aba.');
    } catch {
      onNotify('Armazenamento indisponível. Mantenha esta página aberta.');
    }
  }
  function restoreDraft() {
    try {
      const raw: unknown = JSON.parse(
        sessionStorage.getItem('mediaon-ds-v2-campaign-demo') || 'null',
      );
      if (!raw || typeof raw !== 'object') {
        onNotify('Nenhum rascunho salvo nesta aba.');
        return;
      }
      const value = raw as Record<string, unknown>;
      if (
        ['name', 'objective', 'audience', 'budget', 'start', 'end'].every(
          (key) => typeof value[key] === 'string',
        ) &&
        Array.isArray(value.channels) &&
        value.channels.every((channel) => typeof channel === 'string')
      ) {
        setDraft(value as typeof initialDraft);
        setError('');
        onNotify('Rascunho de demonstração recuperado.');
      } else onNotify('Rascunho incompatível. Comece uma nova demonstração.');
    } catch {
      onNotify('Não foi possível recuperar o rascunho desta aba.');
    }
  }
  return (
    <div className={s.wizard}>
      <div className={s.wizardTop}>
        <a href="#telas">
          <ArrowLeft size={15} />
          Biblioteca de telas
        </a>
        <Badge>Demonstração local</Badge>
      </div>
      <div className={s.wizardTitle}>
        <div>
          <h2>Nova campanha</h2>
          <p>Da intenção à veiculação, um passo de cada vez.</p>
        </div>
        <Button variant="secondary" onClick={saveDraft}>
          <FileText size={15} />
          Salvar rascunho local
        </Button>
      </div>
      <div className={s.wizardSteps}>
        <Steps
          steps={steps}
          current={complete ? 4 : step}
          onSelect={
            complete
              ? undefined
              : (i) => {
                  setStep(i);
                  setError('');
                }
          }
        />
      </div>
      {complete ? (
        <div className={s.completion}>
          <span>
            <Check size={30} />
          </span>
          <h3 ref={titleRef} tabIndex={-1}>
            Fluxo concluído.
          </h3>
          <p>
            Você percorreu a criação de campanha sem sair da página. Este é um protótipo: nada foi
            enviado, cobrado ou publicado.
          </p>
          <Button
            onClick={() => {
              setStep(0);
              setComplete(false);
              setError('');
            }}
          >
            Revisar demonstração
          </Button>
        </div>
      ) : (
        <>
          <div className={s.wizardBody}>
            <div key={step} className={s.wizardMain}>
              <span className={s.microLabel}>ETAPA {step + 1} DE 4</span>
              <h3 ref={titleRef} tabIndex={-1}>
                {
                  [
                    'O que você quer alcançar?',
                    'Encontre o público certo.',
                    'Defina o ritmo da campanha.',
                    'Tudo certo para continuar?',
                  ][step]
                }
              </h3>
              <p className={s.wizardIntro}>
                {
                  [
                    'Escolha um objetivo para orientar os próximos passos.',
                    'Combine o público e os canais de presença da sua marca.',
                    'Revise o período e o investimento total antes de continuar.',
                    'Confira as escolhas. Você pode voltar e ajustar qualquer etapa.',
                  ][step]
                }
              </p>
              {step === 0 && (
                <>
                  <Field
                    htmlFor="campaign-name"
                    label="Nome da campanha"
                    required
                    hint="Use um nome que sua equipe reconheça."
                    error={error}
                  >
                    <Input
                      id="campaign-name"
                      ref={nameRef}
                      aria-required="true"
                      aria-describedby="campaign-name-hint"
                      aria-invalid={Boolean(error)}
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      placeholder="Ex.: Lançamento coleção 2027"
                      maxLength={100}
                    />
                  </Field>
                  <fieldset className={s.objectives}>
                    <legend>Objetivo principal</legend>
                    {[
                      {
                        value: 'leads',
                        label: 'Gerar oportunidades',
                        description: 'Conecte sua marca a potenciais compradores.',
                        icon: Users,
                      },
                      {
                        value: 'alcance',
                        label: 'Ampliar a presença',
                        description: 'Coloque sua marca em evidência no setor.',
                        icon: Megaphone,
                      },
                      {
                        value: 'trafego',
                        label: 'Atrair visitas',
                        description: 'Leve pessoas à sua página na Vitrine.',
                        icon: MousePointer2,
                      },
                    ].map(({ value, label, description, icon: Icon }) => (
                      <label
                        key={value}
                        className={s.objective}
                        data-selected={draft.objective === value}
                      >
                        <Icon size={21} />
                        <span>
                          <strong>{label}</strong>
                          <small>{description}</small>
                        </span>
                        <input
                          type="radio"
                          name="objective"
                          value={value}
                          checked={draft.objective === value}
                          onChange={() => setDraft({ ...draft, objective: value })}
                        />
                      </label>
                    ))}
                  </fieldset>
                </>
              )}
              {step === 1 && (
                <>
                  <Field
                    htmlFor="campaign-audience"
                    label="Público da campanha"
                    hint="Públicos fictícios, apenas para explorar a interface."
                  >
                    <select
                      id="campaign-audience"
                      className={s.select}
                      value={draft.audience}
                      onChange={(e) => setDraft({ ...draft, audience: e.target.value })}
                    >
                      <option>Compradores do setor</option>
                      <option>Visitantes credenciados</option>
                      <option>Relacionamento com expositores</option>
                    </select>
                  </Field>
                  <fieldset className={s.objectives}>
                    <legend>Canais de veiculação</legend>
                    {['Vitrine', 'Mídia de performance', 'E-mail'].map((channel) => (
                      <label
                        className={s.objective}
                        key={channel}
                        data-selected={draft.channels.includes(channel)}
                      >
                        <Target size={18} />
                        <span>
                          <strong>{channel}</strong>
                          <small>
                            {channel === 'Vitrine'
                              ? 'Presença no portal da feira.'
                              : channel === 'E-mail'
                                ? 'Comunicação com audiência segmentada.'
                                : 'Alcance além do ambiente da feira.'}
                          </small>
                        </span>
                        <input
                          type="checkbox"
                          checked={draft.channels.includes(channel)}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              channels: e.target.checked
                                ? [...draft.channels, channel]
                                : draft.channels.filter((c) => c !== channel),
                            })
                          }
                        />
                      </label>
                    ))}
                  </fieldset>
                  {error && <Alert tone="danger" title={error} />}
                </>
              )}
              {step === 2 && (
                <div className={s.formStack}>
                  <Field htmlFor="campaign-budget" label="Investimento total (R$)" required>
                    <Input
                      ref={budgetRef}
                      id="campaign-budget"
                      type="number"
                      aria-required="true"
                      min="1"
                      step="100"
                      value={draft.budget}
                      onChange={(e) => setDraft({ ...draft, budget: e.target.value })}
                    />
                  </Field>
                  <div className={s.formGrid}>
                    <Field htmlFor="campaign-start" label="Início" required>
                      <Input
                        id="campaign-start"
                        type="date"
                        aria-required="true"
                        value={draft.start}
                        onChange={(e) => setDraft({ ...draft, start: e.target.value })}
                      />
                    </Field>
                    <Field htmlFor="campaign-end" label="Término" required>
                      <Input
                        id="campaign-end"
                        type="date"
                        aria-required="true"
                        value={draft.end}
                        min={draft.start}
                        onChange={(e) => setDraft({ ...draft, end: e.target.value })}
                      />
                    </Field>
                  </div>
                  <Alert title="Valores ilustrativos">
                    Esta prévia não consulta disponibilidade nem realiza reservas ou cobranças.
                  </Alert>
                  {error && <Alert tone="danger" title={error} />}
                </div>
              )}
              {step === 3 && (
                <div className={s.reviewRows}>
                  {[
                    ['Campanha', draft.name],
                    [
                      'Objetivo',
                      draft.objective === 'leads'
                        ? 'Gerar oportunidades'
                        : draft.objective === 'trafego'
                          ? 'Atrair visitas'
                          : 'Ampliar a presença',
                    ],
                    ['Público', draft.audience],
                    ['Canais', draft.channels.join(', ')],
                    ['Investimento', money(Number(draft.budget))],
                    [
                      'Período',
                      `${draft.start.split('-').reverse().join('/')} — ${draft.end.split('-').reverse().join('/')}`,
                    ],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <aside className={s.wizardAside}>
              <span className={s.microLabel}>RESUMO DA CAMPANHA</span>
              <h4>{draft.name || 'Sua próxima campanha'}</h4>
              <dl>
                <div>
                  <dt>Objetivo</dt>
                  <dd>
                    {draft.objective === 'leads'
                      ? 'Gerar oportunidades'
                      : draft.objective === 'trafego'
                        ? 'Atrair visitas'
                        : 'Ampliar a presença'}
                  </dd>
                </div>
                <div>
                  <dt>Canais</dt>
                  <dd>{draft.channels.join(', ') || 'Não selecionado'}</dd>
                </div>
                <div>
                  <dt>Investimento</dt>
                  <dd>{money(Number(draft.budget) || 0)}</dd>
                </div>
              </dl>
              <div className={s.helpNote}>
                <CircleHelp size={16} />
                <p>Seu contexto continua visível durante todo o fluxo. Sem janelas sobrepostas.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={restoreDraft}>
                Recuperar rascunho local
              </Button>
            </aside>
          </div>
          <div className={s.wizardFooter}>
            <Button
              variant="ghost"
              disabled={step === 0}
              onClick={() => {
                setStep(step - 1);
                setError('');
              }}
            >
              <ArrowLeft size={14} />
              Voltar
            </Button>
            <span>Nenhuma alteração no produto</span>
            <Button onClick={advance}>
              {step === 3 ? 'Concluir demonstração' : 'Continuar'}
              <ArrowRight size={14} />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
