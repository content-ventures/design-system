'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, Layers3 } from 'lucide-react';
import { useCampaigns } from './campaign-context';
import { CampaignStatusLabel } from './campaign-status';
import { currency, shortDate, type Campaign } from './campaign-data';
import s from './pilot.module.css';

export function NewCampaign() {
  const router = useRouter();
  const { rows, addDraft } = useCampaigns();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [advertiser, setAdvertiser] = useState('Aurora');
  const [assets, setAssets] = useState(['Superbanner']);
  const [budget, setBudget] = useState('');
  const [start, setStart] = useState('2026-10-01');
  const [end, setEnd] = useState('2026-10-31');
  const [error, setError] = useState('');
  const title = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const initial = useRef(true);
  const advertisers = [...new Set(rows.map((row) => row.advertiser))].sort();
  const steps = ['Campanha', 'Veiculação', 'Revisão'];

  useEffect(() => {
    if (initial.current) {
      initial.current = false;
      return;
    }
    title.current?.focus();
  }, [step]);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  function goTo(next: number) {
    setStep(next);
    setError('');
  }
  function showError(message: string) {
    setError(message);
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (step === 0 && !name.trim()) return showError('Dê um nome para identificar esta campanha.');
    if (step === 1 && (!assets.length || Number(budget) <= 0 || !start || !end || end < start))
      return showError(
        'Escolha pelo menos um ativo, informe uma verba maior que zero e uma data final igual ou posterior à data inicial.',
      );
    if (step < 2) return goTo(step + 1);
    const reference = rows.find((row) => row.advertiser === advertiser)!;
    const draft: Campaign = {
      id: `rascunho-${Date.now()}`,
      name: name.trim(),
      advertiser,
      initials: reference.initials,
      identity: reference.identity,
      status: 'draft',
      assets,
      budget: Number(budget),
      delivered: 0,
      target: 50000,
      start,
      end,
    };
    addDraft(draft);
    router.push(`/campanhas/${draft.id}`);
  }

  return (
    <div className={s.newPage}>
      <Link href="/campanhas" className={s.backLink}>
        <ArrowLeft size={15} />
        Todas as campanhas
      </Link>
      <div className={s.newHeading}>
        <div>
          <h1>
            Uma nova campanha<span className={s.titlePeriod}>.</span>
          </h1>
          <p>Comece pelo essencial. Os detalhes encontram seu lugar.</p>
        </div>
        <CampaignStatusLabel status="draft" label="Rascunho demonstrativo" />
      </div>
      <ol className={s.steps} aria-label="Etapas de criação">
        {steps.map((label, index) => (
          <li key={label} aria-current={step === index ? 'step' : undefined}>
            <span>{step > index ? <Check size={12} /> : index + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <form onSubmit={submit}>
        <div className={s.formGrid}>
          <div className={s.formFields}>
            <h2 tabIndex={-1} ref={title}>
              {
                ['Qual é a campanha?', 'Onde e quando ela aparece?', 'Tudo certo para começar?'][
                  step
                ]
              }
            </h2>
            {error && (
              <p className={s.formError} role="alert" tabIndex={-1} ref={errorRef}>
                {error}
              </p>
            )}
            {step === 0 && (
              <>
                <label htmlFor="nome-campanha">
                  <span id="nome-label">Nome da campanha</span>
                  <input
                    id="nome-campanha"
                    aria-labelledby="nome-label"
                    aria-describedby="nome-ajuda"
                    value={name}
                    maxLength={100}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex.: Lançamento da coleção 2027"
                    required
                    autoComplete="off"
                  />
                  <small id="nome-ajuda">
                    Um nome que facilite reconhecer a campanha no dia a dia.
                  </small>
                </label>
                <label htmlFor="novo-anunciante">
                  <span id="anunciante-label">Anunciante</span>
                  <select
                    id="novo-anunciante"
                    aria-labelledby="anunciante-label"
                    aria-describedby="anunciante-ajuda"
                    value={advertiser}
                    onChange={(e) => setAdvertiser(e.target.value)}
                  >
                    {advertisers.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                  <small id="anunciante-ajuda">Os anunciantes desta prévia são fictícios.</small>
                </label>
              </>
            )}
            {step === 1 && (
              <>
                <fieldset>
                  <legend>Ativos de mídia</legend>
                  <div className={s.assetChoices}>
                    {['Superbanner', 'Newsletter', 'Redes sociais'].map((asset) => (
                      <label key={asset}>
                        <input
                          type="checkbox"
                          checked={assets.includes(asset)}
                          onChange={(e) =>
                            setAssets((current) =>
                              e.target.checked
                                ? [...current, asset]
                                : current.filter((item) => item !== asset),
                            )
                          }
                        />
                        {asset}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label htmlFor="verba">
                  Verba planejada (R$)
                  <input
                    id="verba"
                    type="number"
                    min="1"
                    max="10000000"
                    step="0.01"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="0,00"
                    required
                  />
                </label>
                <div className={s.formRow}>
                  <label htmlFor="inicio">
                    Data inicial
                    <input
                      id="inicio"
                      type="date"
                      min="2026-09-01"
                      max="2026-10-31"
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                      required
                    />
                  </label>
                  <label htmlFor="fim">
                    Data final
                    <input
                      id="fim"
                      type="date"
                      min={start || '2026-09-01'}
                      max="2026-10-31"
                      value={end}
                      onChange={(e) => setEnd(e.target.value)}
                      required
                    />
                  </label>
                </div>
                <span className={s.detailNote}>
                  Neste estudo, o calendário cobre setembro e outubro de 2026.
                </span>
              </>
            )}
            {step === 2 && (
              <dl className={s.reviewList}>
                <div>
                  <dt>Campanha</dt>
                  <dd>{name}</dd>
                </div>
                <div>
                  <dt>Anunciante</dt>
                  <dd>{advertiser}</dd>
                </div>
                <div>
                  <dt>Ativos</dt>
                  <dd>{assets.join(', ')}</dd>
                </div>
                <div>
                  <dt>Verba planejada</dt>
                  <dd>{currency(Number(budget))}</dd>
                </div>
                <div>
                  <dt>Veiculação</dt>
                  <dd>
                    {shortDate(start)} — {shortDate(end)} 2026
                  </dd>
                </div>
                <div>
                  <dt>Meta ilustrativa de impressões</dt>
                  <dd>50.000 · apenas para esta prévia</dd>
                </div>
              </dl>
            )}
          </div>
          <aside className={s.formAside}>
            <Layers3 size={27} strokeWidth={1.25} />
            <h3>Espaço para planejar.</h3>
            <p>Uma etapa por vez, em uma página própria. Sem tirar você do contexto da campanha.</p>
            <p style={{ marginTop: 20 }}>
              O rascunho fica somente na memória desta prévia. Recarregar a página descarta os
              dados. Nada será publicado ou enviado.
            </p>
          </aside>
        </div>
        <div className={s.formActions}>
          {step ? (
            <button type="button" className={s.secondaryButton} onClick={() => goTo(step - 1)}>
              <ArrowLeft size={15} />
              Voltar
            </button>
          ) : (
            <Link className={s.secondaryButton} href="/campanhas">
              Cancelar
            </Link>
          )}
          <button type="submit" className={s.primaryButton}>
            {step === 2 ? 'Criar rascunho' : 'Continuar'}
            {step === 2 ? <Check size={16} /> : <ArrowRight size={16} />}
          </button>
        </div>
        <p className={s.detailNote}>
          Protótipo local. Os campos preenchidos não são enviados a nenhum serviço.
        </p>
      </form>
    </div>
  );
}
