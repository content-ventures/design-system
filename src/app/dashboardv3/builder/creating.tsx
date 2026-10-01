'use client';

import { ArrowRight } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Button } from '@/components/ds-v3';
import c from './creating.module.css';

/**
 * Diálogo de criação: o salvamento vira uma sequência curta e legível ("conferindo → gerando →
 * notificando") e termina num estado de sucesso com as duas saídas possíveis. Não fecha com Escape nem
 * clicando fora: enquanto roda, há um salvamento em curso; depois, a campanha já existe e voltar ao
 * formulário convidaria a um segundo envio.
 */
export type CreationRun = {
  kind: 'submit' | 'draft';
  /** Campanha que já existia (edição). */
  edit: boolean;
  /** Já passou pelo comercial antes (ajustes solicitados): o envio é um reenvio. */
  resent: boolean;
  /** Pacote (e não ativo único): a conferência é das regras do pacote. */
  isPackage: boolean;
  name: string;
  /** Verba, período e anunciante (ou ativo), já formatados. */
  facts: string[];
  /** Grava a campanha e devolve o id. Chamado uma única vez, na etapa que gera/salva. */
  commit: () => string;
};

type Step = { label: string; commits?: boolean };

/**
 * Ritmo: perceptível sem fazer esperar. Envio ≈ 2,4 s; rascunho ≈ 1,7 s. O fim do progresso é uma
 * saída (as linhas esmaecem em --dur-2) e só então entra o sucesso: nunca um quadro vazio.
 */
const STEP_MS = 720;
const SETTLE_MS = 220;

function stepsOf(run: CreationRun): Step[] {
  if (run.kind === 'submit')
    return [
      { label: run.isPackage ? 'Conferindo regras do pacote' : 'Conferindo regras do ativo' },
      { label: run.edit ? 'Atualizando a campanha' : 'Gerando a campanha', commits: true },
      { label: 'Notificando o comercial do portal' },
    ];
  return [
    { label: 'Conferindo os dados' },
    { label: run.edit ? 'Salvando as alterações' : 'Salvando o rascunho', commits: true },
  ];
}

function outcomeOf(run: CreationRun) {
  if (run.kind === 'submit')
    return {
      working: run.resent ? 'Reenviando para aprovação' : 'Enviando para aprovação',
      title: run.resent ? 'Campanha reenviada para aprovação' : 'Campanha enviada para aprovação',
      note: 'O comercial do portal revisa e responde por aqui.',
    };
  return {
    working: run.edit ? 'Salvando as alterações' : 'Salvando o rascunho',
    title: run.edit ? 'Alterações salvas' : 'Rascunho salvo',
    note: 'Fica com você para continuar depois. Ninguém foi notificado.',
  };
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Altura medida do conteúdo, presa à execução em curso (uma nova execução mede do zero). */
type Size = { run: CreationRun; height: number; animate: boolean };

export function CreatingDialog({
  run,
  onView,
  onRestart,
  onList,
}: {
  run: CreationRun | null;
  onView: (id: string) => void;
  onRestart: () => void;
  /** Edição: a saída secundária volta para a lista (não há "outra" campanha a criar). */
  onList: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size | null>(null);
  const [settledRun, setSettledRun] = useState<CreationRun | null>(null);
  const titleId = useId();
  const descId = useId();
  const open = run !== null;
  const settled = open && settledRun === run;
  const openRef = useRef(open);
  const runRef = useRef(run);
  useLayoutEffect(() => {
    runRef.current = run;
  });

  useEffect(() => {
    openRef.current = open;
    const dialog = ref.current;
    if (!dialog) return;
    if (!open) {
      if (dialog.open) dialog.close();
      return;
    }
    // `closedby="none"`: nem Escape nem clique fora fecham (navegadores que já suportam).
    dialog.setAttribute('closedby', 'none');
    if (!dialog.open) dialog.showModal();
    // Enquanto roda não há controle: o foco fica no próprio diálogo, preso pelo modal.
    dialog.focus({ preventScroll: true });
  }, [open]);

  // A altura acompanha o conteúdo com uma transição curta: a troca progresso → sucesso não salta.
  // Medidas vazias (diálogo ainda fechado, `display: none`) são ignoradas: nada de abrir com 2 px.
  useLayoutEffect(() => {
    const inner = innerRef.current;
    if (!inner || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      const height = inner.offsetHeight;
      const current = runRef.current;
      if (!height || !current) return;
      setSize((prev) =>
        prev && prev.run === current
          ? prev.height === height
            ? prev
            : { ...prev, height }
          : { run: current, height, animate: false },
      );
    });
    observer.observe(inner);
    return () => observer.disconnect();
  }, []);

  // A transição de altura só liga um quadro depois da primeira medida: a abertura não anima a altura.
  const sized = open && size?.run === run ? size : null;
  useEffect(() => {
    if (!sized || sized.animate) return;
    const frame = requestAnimationFrame(() =>
      setSize((prev) => (prev && prev.run === sized.run ? { ...prev, animate: true } : prev)),
    );
    return () => cancelAnimationFrame(frame);
  }, [sized]);

  return (
    <dialog
      ref={ref}
      className={c.dialog}
      // Só enquanto roda o foco fica no próprio diálogo; no sucesso ele não toma o foco das ações.
      tabIndex={settled ? undefined : -1}
      data-animate={sized?.animate || undefined}
      style={sized ? { height: sized.height } : undefined}
      aria-labelledby={open ? titleId : undefined}
      aria-describedby={open ? descId : undefined}
      // Clique no véu não move o foco (ex.: tira-o de "Ver campanha").
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) event.preventDefault();
      }}
      onCancel={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        if (event.key === 'Escape') event.preventDefault();
      }}
      onClose={() => {
        // Rede de segurança: se o navegador forçar o fechamento (Escape repetido), o diálogo volta.
        if (openRef.current && ref.current && !ref.current.open) ref.current.showModal();
      }}
    >
      <div ref={innerRef} className={c.inner}>
        {run && (
          <Sequence
            run={run}
            titleId={titleId}
            descId={descId}
            onDone={() => setSettledRun(run)}
            onView={onView}
            onRestart={onRestart}
            onList={onList}
          />
        )}
      </div>
    </dialog>
  );
}

function Sequence({
  run,
  titleId,
  descId,
  onDone,
  onView,
  onRestart,
  onList,
}: {
  run: CreationRun;
  titleId: string;
  descId: string;
  onDone: () => void;
  onView: (id: string) => void;
  onRestart: () => void;
  onList: () => void;
}) {
  const steps = stepsOf(run);
  const outcome = outcomeOf(run);
  // Movimento reduzido: sem a sequência, o diálogo já abre no resultado.
  const [reduced] = useState(prefersReducedMotion);
  // Passo em andamento; `steps.length` = todos concluídos, aguardando o sucesso.
  const [active, setActive] = useState(0);
  const [done, setDone] = useState(reduced);
  const [id, setId] = useState<string | null>(null);
  const [leaving, setLeaving] = useState<'view' | 'secondary' | null>(null);
  const committed = useRef<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  /** Grava uma vez só (o modo estrito do React roda efeitos duas vezes em desenvolvimento). */
  const commit = () => {
    committed.current ??= run.commit();
    setId(committed.current);
  };

  // Sem sequência, grava antes da primeira pintura: o número já aparece no sucesso.
  useLayoutEffect(() => {
    if (reduced) commit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (done) return;
    const finished = active >= steps.length;
    const timer = window.setTimeout(
      () => {
        if (finished) return setDone(true);
        const next = active + 1;
        if (steps[next]?.commits) commit();
        setActive(next);
      },
      finished ? SETTLE_MS : STEP_MS,
    );
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, done]);

  // No sucesso, o foco vai para a ação principal.
  useEffect(() => {
    if (!done) return;
    onDone();
    const frame = requestAnimationFrame(() =>
      rootRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus(),
    );
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const number = id ? id.replace(/^cmp-/, '') : '';
  const current = steps[Math.min(active, steps.length - 1)];
  const live = done
    ? `${outcome.title}. ${outcome.note}`
    : `${current?.label ?? ''}, etapa ${Math.min(active + 1, steps.length)} de ${steps.length}`;

  return (
    <div ref={rootRef}>
      {done ? (
        <div className={c.success}>
          <div className={c.successHead}>
            <svg className={c.seal} viewBox="0 0 40 40" aria-hidden="true">
              <circle className={c.sealFill} cx="20" cy="20" r="20" />
              <path className={c.sealCheck} d="M12.5 20.5l5 5L28 15" pathLength={1} />
            </svg>
            <div className={c.reveal}>
              <h2 id={titleId} className={c.title}>
                {outcome.title}
              </h2>
              <p id={descId} className={c.note}>
                {outcome.note}
              </p>
            </div>
          </div>
          <div className={`${c.record} ${c.reveal}`} data-delay="1">
            <p className={c.recordHead}>
              <span className={c.recordName} title={run.name}>
                {run.name}
              </span>
              {number && <span className={c.recordId}>#{number}</span>}
            </p>
            {run.facts.length > 0 && <Facts facts={run.facts} />}
          </div>
          <div className={`${c.actions} ${c.reveal}`} data-delay="2">
            <Button
              loading={leaving === 'secondary'}
              disabled={leaving === 'view'}
              onClick={() => {
                setLeaving('secondary');
                if (run.edit) onList();
                else onRestart();
              }}
            >
              {run.edit ? 'Voltar para campanhas' : 'Criar outra campanha'}
            </Button>
            <Button
              variant="primary"
              trailingIcon={ArrowRight}
              data-autofocus
              loading={leaving === 'view'}
              disabled={!id || leaving === 'secondary'}
              onClick={() => {
                if (!id) return;
                setLeaving('view');
                onView(id);
              }}
            >
              Ver campanha
            </Button>
          </div>
        </div>
      ) : (
        <div className={c.progress} data-leaving={active >= steps.length || undefined}>
          <header className={c.head}>
            <h2 id={titleId} className={c.title} title={run.name}>
              {run.name}
            </h2>
            {run.facts.length > 0 && <Facts facts={run.facts} />}
            <p id={descId} className={c.srOnly}>
              {outcome.working}
            </p>
          </header>
          <ol className={c.steps} aria-label={outcome.working} aria-busy="true">
            {steps.map((step, index) => {
              const state = index < active ? 'done' : index === active ? 'running' : 'pending';
              return (
                <li key={step.label} className={c.step} data-state={state}>
                  <span className={c.marker} aria-hidden="true">
                    {state === 'pending' && index + 1}
                    {state === 'running' && (
                      <svg className={c.spinner} viewBox="0 0 20 20">
                        <circle className={c.spinnerTrack} cx="10" cy="10" r="9" />
                        <circle className={c.spinnerArc} cx="10" cy="10" r="9" pathLength={1} />
                      </svg>
                    )}
                    {state === 'done' && (
                      <svg className={c.tick} viewBox="0 0 24 24">
                        <path d="M4.5 12.5l5 5L19.5 7" pathLength={1} />
                      </svg>
                    )}
                  </span>
                  <span className={c.label}>{step.label}</span>
                  {state === 'done' && step.commits && number && (
                    <span className={c.stepRef}>#{number}</span>
                  )}
                  <span className={c.srOnly}>
                    {state === 'done' ? '(concluído)' : state === 'running' ? '(em andamento)' : ''}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
      <p className={c.srOnly} role="status" aria-live="polite">
        {live}
      </p>
    </div>
  );
}

/** Fatos numa linha; quebra entre fatos, nunca dentro, e o "·" do início da linha fica recortado. */
function Facts({ facts }: { facts: string[] }) {
  return (
    <p className={c.facts}>
      <span className={c.factsRow}>
        {facts.map((fact, index) => (
          <span key={`${index}-${fact}`}>{fact}</span>
        ))}
      </span>
    </p>
  );
}
