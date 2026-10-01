'use client';

import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Code2,
  Layers,
  LayoutGrid,
  Megaphone,
  Plus,
} from 'lucide-react';
import { Badge, Section } from '../components/ds/primitives';
import { CampaignTable } from '../components/ds/campaign-table';
import { PerformanceChart, ChannelChart } from '../components/ds/charts';
import { CampaignWizard } from '../components/ds/campaign-wizard';
import { Foundation } from './foundations';
import { IdentityOverview } from './identity-overview';
import { LeadCard, exampleLeads } from '../components/ds/lead-card';
import { ButtonExamples, ComponentExamples, FormExamples } from './component-examples';
import { inventory, inventoryCount } from './inventory';
import { sampleFor, sampleCount } from './catalog';
import s from './showcase.module.css';

type Props = {
  selection: string;
  theme: string;
  setTheme: (value: string) => void;
  portal: string;
  setPortal: (value: string) => void;
  onNotify: (message: string) => void;
};
export function Showcase(props: Props) {
  const { selection, onNotify } = props;
  if (selection === 'overview') return <IdentityOverview onNotify={onNotify} />;
  if (selection === 'inventario')
    return (
      <Section
        title={`${sampleCount} itens com amostra · ${inventoryCount - sampleCount} próximos itens`}
        description="Amostras estão em revisão. Ter um exemplo não significa estar aprovado para o produto."
      >
        <div className={s.inventoryCards}>
          {inventory.map((group) => (
            <div key={group.id}>
              <h2>
                {group.label}
                <span>{group.items.length}</span>
              </h2>
              {group.items.map((item) => (
                <a href={`#${item.id}`} key={item.id}>
                  <span>{item.label}</span>
                  <small>{sampleFor(item.id) ? 'Em revisão' : 'Planejado'}</small>
                  <ChevronRight size={12} />
                </a>
              ))}
            </div>
          ))}
        </div>
      </Section>
    );
  if (selection === 'nova-campanha') return <CampaignWizard onNotify={onNotify} />;
  if (selection === 'telas')
    return (
      <>
        <div className={s.screenCards}>
          {[
            {
              id: 'template-dashboard',
              title: 'Visão geral da operação',
              label: 'Dashboard',
              icon: LayoutGrid,
              desc: 'Indicadores, evolução e campanhas no mesmo contexto.',
            },
            {
              id: 'template-listagem',
              title: 'Gestão de campanhas',
              label: 'Listagem',
              icon: Megaphone,
              desc: 'Busca, filtros, seleção e leitura clara da entrega.',
            },
            {
              id: 'nova-campanha',
              title: 'Criação de campanha',
              label: 'Fluxo em página',
              icon: Plus,
              desc: 'Quatro etapas, resumo persistente e revisão final.',
            },
          ].map(({ id, title, label, icon: Icon, desc }) => (
            <a href={`#${id}`} key={id}>
              <div className={s.screenMiniature}>
                <aside />
                <div>
                  <span />
                  <b />
                  {id === 'nova-campanha' ? (
                    <>
                      <i />
                      <i />
                      <i />
                    </>
                  ) : (
                    <>
                      <em />
                      <em />
                      <em />
                      <em />
                    </>
                  )}
                </div>
              </div>
              <span className={s.miniLabel}>{label}</span>
              <h2>
                {title}
                <ArrowUpRight size={16} />
              </h2>
              <p>{desc}</p>
              <Badge tone="brand">
                <Icon size={11} />
                Protótipo navegável
              </Badge>
            </a>
          ))}
        </div>
        <div className={s.ruleNote}>
          <Layers size={17} />
          <p>
            Estas são composições para validar o sistema visual. Não substituem as telas atuais e
            não consultam dados reais. As demais jornadas entrarão aqui progressivamente.
          </p>
        </div>
      </>
    );
  const kind = sampleFor(selection);
  if (!kind) {
    const group = inventory.find((g) => g.items.some((i) => i.id === selection));
    const related = group?.items.find((i) => sampleFor(i.id));
    return (
      <div className={s.planned}>
        <span className={s.plannedIcon}>
          <Layers size={24} />
        </span>
        <Badge>Planejado</Badge>
        <h2>Um lugar reservado na biblioteca.</h2>
        <p>
          Este componente ainda não foi desenvolvido. Vamos aplicar a direção visual e validar seu
          comportamento antes de considerá-lo parte da biblioteca.
        </p>
        {related && (
          <a href={`#${related.id}`} className={s.textLink}>
            Ver uma amostra de {group?.label.toLowerCase()}
            <ArrowRight size={14} />
          </a>
        )}
      </div>
    );
  }
  let content;
  if (
    [
      'principles',
      'colors',
      'type',
      'spacing',
      'grid',
      'radii',
      'elevation',
      'icons',
      'motion',
      'themes',
      'accessibility',
      'content',
    ].includes(kind)
  )
    content = <Foundation {...props} kind={kind} />;
  else if (kind === 'buttons') content = <ButtonExamples onNotify={onNotify} />;
  else if (kind === 'forms') content = <FormExamples selectedId={selection} onNotify={onNotify} />;
  else if (kind === 'lead')
    content = (
      <Section
        title="Cada oportunidade tem uma pessoa."
        description="Identidade, interesse e próxima ação. Contatos fictícios para experimentar a interface."
      >
        <div className={s.leadGallery}>
          {exampleLeads.map((lead) => (
            <LeadCard key={lead.company} lead={lead} />
          ))}
        </div>
      </Section>
    );
  else if (kind === 'table')
    content = (
      <Section
        title="Campanhas em contexto"
        description="Experimente buscar, filtrar, ordenar por investimento, selecionar e exportar os exemplos."
      >
        <CampaignTable onNotify={onNotify} />
      </Section>
    );
  else if (kind === 'wizard')
    content = (
      <Section
        title="Fluxos longos merecem uma página."
        description="Objetivo, público, investimento e revisão. Os dados permanecem visíveis e editáveis."
      >
        <CampaignWizard onNotify={onNotify} />
      </Section>
    );
  else if (kind === 'charts' || kind === 'area' || kind === 'bars')
    content = (
      <Section
        title="Dados que ajudam a decidir."
        description="Mude a métrica e o período. Os valores do gráfico também estão disponíveis em tabela."
      >
        <PerformanceChart kind={kind === 'area' ? 'area' : kind === 'bars' ? 'bar' : 'line'} />
        <div className={s.sectionGap}>
          <ChannelChart />
        </div>
      </Section>
    );
  else if (kind === 'dashboard')
    content = (
      <>
        <div className={s.demoNotice}>
          Portal de demonstração · 16–29 set. 2026 · Dados fictícios
        </div>
        <div className={s.dashboardGrid}>
          <PerformanceChart />
          <ChannelChart />
        </div>
        <div className={s.sectionGap}>
          <CampaignTable onNotify={onNotify} />
        </div>
      </>
    );
  else content = <ComponentExamples kind={kind} onNotify={onNotify} />;
  return (
    <>
      {content}
      <ImplementationNote kind={kind} />
    </>
  );
}

function ImplementationNote({ kind }: { kind: string }) {
  const primitive = [
    'buttons',
    'forms',
    'dialog',
    'feedback',
    'status',
    'navigation',
    'structure',
  ].includes(kind);
  const file = primitive
    ? 'src/components/ds/primitives.tsx'
    : ['charts', 'area', 'bars', 'dashboard'].includes(kind)
      ? 'src/components/ds/charts.tsx'
      : kind === 'table'
        ? 'src/components/ds/campaign-table.tsx'
        : kind === 'lead'
          ? 'src/components/ds/lead-card.tsx'
          : kind === 'wizard'
            ? 'src/components/ds/campaign-wizard.tsx'
            : ['kanban', 'timeline', 'media'].includes(kind)
              ? 'src/app/component-examples.tsx'
              : 'src/components/ds/tokens.css';
  return (
    <details className={s.implementation}>
      <summary>
        <Code2 size={14} />
        Implementação e regras de uso
      </summary>
      <p>
        Proposta isolada em <code>apps/design-system</code>. Ainda não aprovada para integrar ao
        produto.
      </p>
      <code className={s.filePath}>{file}</code>
      <p>
        Reutilize os componentes e os tokens desta biblioteca. Não redesenhe controles em cada tela.
        Demonstrações usam somente estado local; contratos, permissões e regras de negócio
        permanecem fora deste laboratório.
      </p>
      {kind === 'buttons' && (
        <pre>
          {
            '<Button variant="primary">Criar campanha</Button>\n<Button variant="secondary">Ver detalhes</Button>\n<Badge tone="success">Em veiculação</Badge>'
          }
        </pre>
      )}
    </details>
  );
}
