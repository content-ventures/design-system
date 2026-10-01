'use client';

import { useState } from 'react';
import { FormButton } from './creation-ui';
import { ToastCard, type Notify, type ToastInput, type ToastVariant } from './toasts';
import { Tabs } from './workspace-ui';
import { navigate, type ScreenKey, type ViewMode } from './workspace-data';
import a from './application.module.css';
import s from './dashboard.module.css';
import t from '../../components/ds-v2/toasts.module.css';

const examples: {
  variant: ToastVariant;
  label: string;
  title: string;
  message: string;
  action: string;
  destination: ScreenKey;
  recordId?: string;
}[] = [
  {
    variant: 'info',
    label: 'Informação',
    title: 'Campanha em rascunho',
    message: 'Edite a campanha antes de enviar para aprovação.',
    action: 'Abrir campanhas',
    destination: 'campanhas',
  },
  {
    variant: 'warning',
    label: 'Atenção',
    title: 'Estoque limitado',
    message: 'Poucas unidades disponíveis para contratação.',
    action: 'Ver inventário',
    destination: 'inventario',
  },
  {
    variant: 'success',
    label: 'Sucesso',
    title: 'Cadastro salvo',
    message: 'Público disponível na sua lista.',
    action: 'Ver públicos',
    destination: 'publicos',
  },
  {
    variant: 'error',
    label: 'Erro',
    title: 'Não foi possível salvar',
    message: 'Revise os dados e tente novamente.',
    action: 'Abrir cadastro',
    destination: 'publicos',
    recordId: 'novo',
  },
];

export function ToastExplorer({ mode, notify }: { mode: ViewMode; notify: Notify }) {
  const [format, setFormat] = useState('detailed');
  const [closed, setClosed] = useState<ToastVariant[]>([]);
  return (
    <>
      <div className={`${s.toolbar} ${a.screenToolbar}`}>
        <Tabs
          label="Formato dos toasts"
          active={format}
          onChange={setFormat}
          values={[
            { id: 'compact', label: 'Compactos' },
            { id: 'detailed', label: 'Título e ação' },
          ]}
        />
      </div>
      <div className={t.gallery}>
        <div className={t.galleryIntro}>
          <p>Experimente os avisos no canto da tela. Os exemplos abaixo são ilustrativos.</p>
        </div>
        <div className={t.samples}>
          {examples.map((example) => {
            const toast: ToastInput = {
              variant: example.variant,
              message:
                format === 'compact' && example.variant === 'success'
                  ? 'Cadastro salvo com sucesso.'
                  : example.message,
              ...(format === 'detailed'
                ? {
                    title: example.title,
                    action: {
                      label: example.action,
                      onClick: () => navigate(example.destination, mode, example.recordId),
                    },
                  }
                : {}),
            };
            return (
              <section
                key={example.variant}
                className={t.sample}
                aria-label={`Exemplo de ${example.label.toLowerCase()}`}
              >
                <div className={t.sampleHeader}>
                  <h2>{example.label}</h2>
                  <FormButton
                    variant="ghost"
                    aria-label={`Disparar aviso de ${example.label.toLowerCase()}`}
                    onClick={() => notify(toast)}
                  >
                    Disparar
                  </FormButton>
                </div>
                {closed.includes(example.variant) ? (
                  <div className={t.empty}>
                    Exemplo fechado
                    <FormButton
                      variant="ghost"
                      onClick={() => setClosed(closed.filter((item) => item !== example.variant))}
                    >
                      Restaurar
                    </FormButton>
                  </div>
                ) : (
                  <ToastCard
                    toast={toast}
                    dismiss={() => setClosed([...closed, example.variant])}
                  />
                )}
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
