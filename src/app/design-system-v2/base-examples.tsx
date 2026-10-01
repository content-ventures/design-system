'use client';

import { useId, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  Clock3,
  Code2,
  Copy,
  Download,
  Plus,
  Settings2,
  Pencil,
  Send,
  Archive,
  Trash2,
} from 'lucide-react';
import {
  Button,
  Dialog,
  IconButton,
  Input,
  Textarea,
  Select,
  MoneyInput,
  DateInput,
  Checkbox,
  Switch,
  FormField,
  Tabs,
  Status,
  DataTable,
  ToastCard,
  useToast,
  type ToastVariant,
  type TableSort,
} from '../../components/ds-v2';
import c from './catalog.module.css';

function Example({
  title,
  note,
  children,
  code,
}: {
  title: string;
  note?: string;
  children: ReactNode;
  code?: string;
}) {
  return (
    <section className={c.example}>
      <div className={c.exampleHeading}>
        <h2>{title}</h2>
        {note && <p>{note}</p>}
      </div>
      <div className={c.preview}>{children}</div>
      {code && (
        <details className={c.code}>
          <summary>
            <Code2 size={14} aria-hidden="true" /> Ver código
          </summary>
          <pre>
            <code>{code}</code>
          </pre>
        </details>
      )}
    </section>
  );
}
function ComponentLine({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className={c.componentLine}>
      <span>{name}</span>
      <div>{children}</div>
    </div>
  );
}

type Notice = ReturnType<typeof useToast>['notify'];
export function LegacyOverview() {
  return (
    <>
      <div className={c.intro}>
        <div>
          <p className={c.eyebrow}>Referência vigente</p>
          <h2>Uma base, em todas as telas.</h2>
          <p>
            Os componentes desta biblioteca são os mesmos usados no Dashboard V2. A evolução
            acontece aqui e chega às telas sem duplicar estilos.
          </p>
          <a href="/dashboardv2">
            Abrir a aplicação de referência <ArrowRight size={15} />
          </a>
        </div>
        <div className={c.identitySample}>
          <span className={c.letter}>Aa</span>
          <div>
            <strong>Inter</strong>
            <span>400 · 500 · 600</span>
          </div>
          <div className={c.colorDots}>
            <i style={{ background: 'var(--ink)' }} />
            <i style={{ background: 'var(--accent)' }} />
            <i style={{ background: 'var(--selected)' }} />
            <i style={{ background: 'var(--sidebar)' }} />
          </div>
        </div>
      </div>
      <div className={c.quickLinks}>
        {[
          { id: 'tipografia', title: 'Fundamentos', text: 'Cores, hierarquia e medidas.' },
          { id: 'botoes', title: 'Componentes', text: 'Variantes e estados interativos.' },
          { id: 'formularios', title: 'Composições', text: 'Padrões aplicados aos fluxos.' },
        ].map((item) => (
          <a key={item.id} href={`#${item.id}`}>
            <div>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </div>
            <ArrowRight size={16} />
          </a>
        ))}
      </div>
      <Example
        title="A linguagem do produto"
        note="Azul na ação principal, controles discretos e informação com hierarquia."
      >
        <div className={c.overviewDemo}>
          <div>
            <strong>Campanha de lançamento</strong>
            <span>Display · Portal Francal</span>
          </div>
          <Status value="Em veiculação" tone="blue" />
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              window.location.hash = 'formularios';
            }}
          >
            Nova campanha
          </Button>
        </div>
      </Example>
      <div className={c.rules}>
        <h2>O que guia as próximas telas</h2>
        <ul>
          <li>Preservar a base clara, a densidade e os pesos de fonte aprovados.</li>
          <li>Escolher a tabela pelo conteúdo: histórico, cadastro ou resultado.</li>
          <li>Usar texto auxiliar apenas quando ele ajuda a concluir a tarefa.</li>
          <li>Manter foco visível, teclado e comportamento em telas pequenas.</li>
        </ul>
      </div>
    </>
  );
}
function Usage({ notify }: { notify: Notice }) {
  const snippet = `import {\n  DesignSystemTheme, Button, FormField, Input,\n} from '@/components/ds-v2';\nimport { inter } from '@/components/ds-v2/font';\n\nexport default function Example() {\n  return (\n    <div className={inter.variable}>\n      <DesignSystemTheme>\n        <FormField id="name" label="Nome">\n          <Input id="name" name="name" />\n        </FormField>\n        <Button variant="primary">Salvar</Button>\n      </DesignSystemTheme>\n    </div>\n  );\n}`;
  return (
    <>
      <Example
        title="Importação e tema"
        note="O escopo do tema mantém fontes, tokens e portais de seleção na mesma base."
      >
        <div className={c.codeBar}>
          <span>React + TypeScript</span>
          <Button
            icon={Copy}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(snippet);
                notify('Código copiado.');
              } catch {
                notify({
                  variant: 'error',
                  message: 'Não foi possível copiar. Selecione o código abaixo.',
                });
              }
            }}
          >
            Copiar código
          </Button>
        </div>
        <pre className={c.source}>
          <code>{snippet}</code>
        </pre>
      </Example>
      <div className={c.rules}>
        <h2>Contrato de uso</h2>
        <ul>
          <li>
            Importe componentes de <code>@/components/ds-v2</code>. Carregue a fonte no componente
            de página.
          </li>
          <li>
            Use <code>DesignSystemTheme</code> ao redor da interface. Não dependa do CSS de uma
            rota.
          </li>
          <li>Prefira os tokens semânticos a novas cores, pesos e medidas.</li>
          <li>
            Tabelas recebem colunas e linhas do consumidor. Regras de negócio, filtros e ordenação
            de dados ficam na aplicação.
          </li>
          <li>
            Formulários usam rótulos associados e validação junto aos campos. A biblioteca não envia
            dados.
          </li>
        </ul>
        <p>
          Versão inicial local. Integração com o produto oficial e publicação como pacote são etapas
          separadas.
        </p>
      </div>
    </>
  );
}
const paletteGroups = [
  {
    name: 'Azul MediaOn',
    use: 'Ação, foco e seleção',
    colors: [
      ['Seleção', '#dfeeff'],
      ['Acento', '#0783f8'],
      ['Ação', '#0875db'],
      ['Texto', '#0969b5'],
    ],
  },
  {
    name: 'Neutros',
    use: 'Estrutura e hierarquia de leitura',
    colors: [
      ['Navegação', '#fafafa'],
      ['Divisória', '#ededf0'],
      ['Apoio', '#686f78'],
      ['Conteúdo', '#41474f'],
      ['Título', '#151719'],
    ],
  },
  {
    name: 'Verde',
    use: 'Concluído e disponível',
    colors: [
      ['Superfície', '#edf8f1'],
      ['Sinal', '#399369'],
      ['Texto', '#357052'],
    ],
  },
  {
    name: 'Âmbar',
    use: 'Pendência e atenção',
    colors: [
      ['Superfície', '#fcf4e6'],
      ['Sinal', '#ba8324'],
      ['Texto', '#8a671f'],
    ],
  },
  {
    name: 'Rosa',
    use: 'Revisão e ajuste',
    colors: [
      ['Superfície', '#fcf0f5'],
      ['Sinal', '#d84785'],
      ['Texto', '#a23965'],
    ],
  },
];
function Colors() {
  return (
    <div className={c.paletteGroups}>
      {paletteGroups.map((group) => (
        <section key={group.name}>
          <header>
            <h2>{group.name}</h2>
            <p>{group.use}</p>
          </header>
          <div className={c.colorRamp}>
            {group.colors.map(([name, hex]) => (
              <div key={hex}>
                <i style={{ background: hex }} />
                <strong>{name}</strong>
                <code>{hex}</code>
              </div>
            ))}
          </div>
        </section>
      ))}
      <Example title="Aplicação semântica">
        <div className={c.row}>
          <Status value="Em veiculação" tone="blue" variant="soft" />
          <Status value="Concluído" tone="green" variant="soft" />
          <Status value="Em revisão" tone="amber" variant="soft" />
          <Status value="Ajustes necessários" tone="pink" variant="soft" />
        </div>
      </Example>
    </div>
  );
}
const typography = [
  ['page', 'Título da página', '24 / 32 · 600'],
  ['heading', 'Título de bloco', '18 / 26 · 600'],
  ['section', 'Título de seção', '14 / 20 · 600'],
  ['entity', 'Nome de campanha', '13 / 20 · 500'],
  ['body', 'Informação para leitura contínua.', '13 / 20 · 400'],
  ['label', 'Rótulo do campo', '12 / 18 · 500'],
  ['caption', 'Informação complementar', '11 / 16 · 400'],
  ['button', 'Ação secundária', '12 / 18 · 500'],
  ['primary', 'Ação principal', '12 / 18 · 600'],
  ['stat', '24.800', '24 / 30 · 600'],
] as const;
function Typography() {
  return (
    <>
      <Example
        title="Inter · família tipográfica do MediaOn"
        note="Fonte local. Regular 400, Medium 500 e Semibold 600."
      >
        <div className={c.fontSpecimen}>
          <span>Aa</span>
          <div>
            <strong>Inter</strong>
            <p>
              ABCDEFGHIJKLMNOPQRSTUVWXYZ
              <br />
              abcdefghijklmnopqrstuvwxyz
              <br />
              0123456789 · R$ 24.800,00
            </p>
            <code>font-family: Inter, sans-serif</code>
          </div>
        </div>
      </Example>
      <div className={c.typeList}>
        {typography.map(([token, text, size]) => (
          <div key={token}>
            <code>--type-{token}</code>
            <span
              style={{
                font: `var(--type-${token})`,
                color: ['caption', 'label'].includes(token) ? 'var(--muted)' : 'var(--ink)',
              }}
            >
              {text}
            </span>
            <small>{size}</small>
          </div>
        ))}
      </div>
      <div className={c.rules}>
        <h2>Hierarquia sem excesso</h2>
        <p>
          Peso 600 para títulos e ações principais, 500 para nomes e controles, 400 para leitura.
          Números de tabelas usam algarismos tabulares. Evite pesos e tons diferentes para
          informações com a mesma função.
        </p>
      </div>
    </>
  );
}
function Spacing() {
  return (
    <>
      <Example title="Escala de espaçamento">
        <div className={c.spacing}>
          {[1, 2, 3, 4, 6, 8].map((n) => (
            <div key={n}>
              <code>--space-{n}</code>
              <i style={{ width: `var(--space-${n})` }} />
              <span>{n * 4}px</span>
            </div>
          ))}
        </div>
      </Example>
      <Example title="Medidas de interface">
        <div className={c.measurements}>
          {[
            ['Controles', '7px de raio'],
            ['Tabelas', '9px de raio'],
            ['Toasts', '10px de raio'],
            ['Botões', '36px · 40px no celular'],
            ['Campos', '38px de altura'],
            ['Tabelas operacionais', '44px por linha'],
            ['Cadastros', '62px por linha'],
            ['Toggle', '44px de área clicável'],
          ].map(([name, value]) => (
            <div key={name}>
              <span>{name}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </Example>
    </>
  );
}
function Buttons({ notify }: { notify: Notice }) {
  const [confirm, setConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <>
      <Example title="Ações no fluxo" note="Variações por intenção e posição na interface.">
        <ComponentLine name="Criação">
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              window.location.hash = 'wizard';
            }}
          >
            Nova campanha
          </Button>
          <Button
            icon={Pencil}
            onClick={() => {
              window.location.hash = 'template-cadastro';
            }}
          >
            Editar rascunho
          </Button>
        </ComponentLine>
        <ComponentLine name="Aprovação">
          <Button
            variant="primary"
            icon={Send}
            onClick={() => notify('Enviado para revisão neste exemplo.')}
          >
            Enviar para revisão
          </Button>
          <Button
            variant="soft"
            icon={Check}
            onClick={() => {
              setSaved(!saved);
              notify(saved ? 'Aprovação retirada no exemplo.' : 'Aprovado no exemplo.');
            }}
          >
            {saved ? 'Aprovação registrada' : 'Aprovar campanha'}
          </Button>
        </ComponentLine>
        <ComponentLine name="Destrutiva">
          <Button variant="danger" icon={Trash2} onClick={() => setConfirm(true)}>
            Excluir rascunho
          </Button>
          <Button
            variant="danger-ghost"
            icon={Archive}
            onClick={() => notify('Campanha arquivada neste exemplo.')}
          >
            Arquivar
          </Button>
        </ComponentLine>
        <ComponentLine name="Densidade">
          <Button size="small" onClick={() => notify('Detalhe compacto aberto no exemplo.')}>
            Ver detalhes
          </Button>
          <Button>Salvar alterações</Button>
          <Button
            variant="primary"
            size="large"
            icon={ArrowRight}
            onClick={() => {
              window.location.hash = 'wizard';
            }}
          >
            Continuar
          </Button>
        </ComponentLine>
      </Example>
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Excluir este rascunho?"
        description="Exemplo de confirmação para uma ação destrutiva."
        footer={
          <>
            <Button onClick={() => setConfirm(false)}>Manter rascunho</Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirm(false);
                notify('Exclusão demonstrada. Nenhum registro real foi alterado.');
              }}
            >
              Excluir rascunho
            </Button>
          </>
        }
      >
        <p>A exclusão fica restrita a esta demonstração.</p>
      </Dialog>
      <Example
        title="Hierarquia"
        code={
          '<Button variant="primary" icon={Plus}>Nova campanha</Button>\n<Button>Cancelar</Button>\n<Button variant="ghost">Voltar</Button>'
        }
      >
        <ComponentLine name="Principal">
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => notify('Ação de exemplo concluída.')}
          >
            Nova campanha
          </Button>
        </ComponentLine>
        <ComponentLine name="Secundário">
          <Button onClick={() => notify('Arquivo de exemplo preparado.')} icon={Download}>
            Exportar
          </Button>
          <Button>Cancelar</Button>
        </ComponentLine>
        <ComponentLine name="Discreto">
          <Button variant="ghost" icon={ArrowLeft}>
            Voltar
          </Button>
        </ComponentLine>
      </Example>
      <Example
        title="Estados e ícones"
        note="O estado de carregamento bloqueia um segundo envio, mantendo o nome da ação."
      >
        <ComponentLine name="Desabilitado">
          <Button variant="primary" disabled>
            Salvar
          </Button>
          <Button disabled>Cancelar</Button>
        </ComponentLine>
        <ComponentLine name="Carregando">
          <Button variant="primary" loading>
            Salvando…
          </Button>
        </ComponentLine>
        <ComponentLine name="Apenas ícone">
          <IconButton
            label="Configurar visualização"
            icon={Settings2}
            onClick={() => notify('Configuração de exemplo aberta.')}
          />
          <IconButton label="Remover exemplo" icon={Trash2} disabled />
        </ComponentLine>
      </Example>
      <p className={c.help}>
        Use Tab para conferir o foco. Botões principais têm peso 600; secundários, 500.
      </p>
    </>
  );
}
function Fields() {
  const [format, setFormat] = useState('display');
  return (
    <>
      <Example
        title="Texto e validação"
        code={
          '<FormField id="name" label="Nome" required>\n  <Input id="name" required error={error} />\n</FormField>'
        }
      >
        <div className={c.fieldGrid}>
          <FormField id="field-name" label="Nome da campanha" required>
            <Input id="field-name" placeholder="Ex.: Lançamento de coleção" required />
          </FormField>
          <FormField id="field-error" label="Nome do público" required>
            <Input id="field-error" required error="Informe um nome para o público." />
          </FormField>
          <FormField id="field-disabled" label="Portal">
            <Input id="field-disabled" defaultValue="Francal" disabled />
          </FormField>
          <FormField id="field-desc" label="Descrição">
            <Textarea id="field-desc" placeholder="Contexto para a equipe" rows={3} />
          </FormField>
        </div>
      </Example>
      <Example
        title="Seletores, valores e datas"
        note="Abra as opções por clique ou teclado. Datas e valores aceitam digitação em português."
      >
        <div className={c.fieldGrid}>
          <FormField id="field-format" label="Formato">
            <Select
              id="field-format"
              label="Formato"
              value={format}
              onValueChange={setFormat}
              options={[
                { value: 'display', label: 'Display' },
                { value: 'email', label: 'E-mail' },
                { value: 'social', label: 'Redes sociais' },
              ]}
            />
          </FormField>
          <FormField id="field-price" label="Preço-base">
            <MoneyInput id="field-price" name="price" defaultValue={1250.5} />
          </FormField>
          <FormField id="field-date" label="Início da campanha">
            <DateInput
              id="field-date"
              name="date"
              label="Início da campanha"
              defaultValue="2026-10-15"
            />
          </FormField>
          <FormField id="field-fixed" label="Disponibilidade">
            <Select
              id="field-fixed"
              label="Disponibilidade"
              disabled
              options={[{ value: 'reserved', label: 'Reservado' }]}
            />
          </FormField>
        </div>
      </Example>
    </>
  );
}
function Selection() {
  const [enabled, setEnabled] = useState(true);
  return (
    <>
      <Example
        title="Toggle de estado"
        note="Ligar e desligar uma configuração. Na campanha, a aplicação define quando a veiculação pode mudar."
        code={'<Switch label="Veiculação" checked={enabled}\n  onCheckedChange={setEnabled} />'}
      >
        <ComponentLine name="Interativo">
          <Switch label="Veiculação de exemplo" checked={enabled} onCheckedChange={setEnabled} />
          <Status value={enabled ? 'Em veiculação' : 'Pausada'} tone={enabled ? 'blue' : 'amber'} />
        </ComponentLine>
        <ComponentLine name="Desabilitado">
          <Switch
            label="Veiculação indisponível"
            checked={false}
            onCheckedChange={() => {}}
            disabled
            description="A campanha precisa de aprovação."
          />
          <span>Aguardando aprovação</span>
        </ComponentLine>
      </Example>
      <Example title="Seleção de opções">
        <div className={c.stack}>
          <Checkbox label="Incluir campanhas pausadas" defaultChecked />
          <Checkbox label="Receber resumo semanal" />
          <Checkbox label="Configuração indisponível" disabled />
        </div>
      </Example>
    </>
  );
}
function Navigation() {
  const [tab, setTab] = useState('all');
  const id = useId();
  return (
    <>
      <Example
        title="Abas"
        note="Setas, Home e End navegam pelas opções. A seleção preserva o contexto da página."
        code={'<Tabs values={views} active={view} onChange={setView} />'}
      >
        <Tabs
          label="Exemplo de visualizações"
          values={[
            { id: 'all', label: 'Todas', count: 12, panelId: id },
            { id: 'active', label: 'Em veiculação', count: 8, panelId: id },
            { id: 'paused', label: 'Pausadas', count: 4, panelId: id },
          ]}
          active={tab}
          onChange={setTab}
        />
        <div
          className={c.tabPanel}
          id={id}
          role="tabpanel"
          aria-label={
            tab === 'all'
              ? 'Todas as campanhas'
              : tab === 'active'
                ? 'Campanhas em veiculação'
                : 'Campanhas pausadas'
          }
        >
          <Status
            value={
              tab === 'all'
                ? '12 campanhas'
                : tab === 'active'
                  ? '8 campanhas em veiculação'
                  : '4 campanhas pausadas'
            }
            tone={tab === 'paused' ? 'amber' : 'blue'}
          />
        </div>
      </Example>
      <Example title="Troca de contexto">
        <div className={c.linkExamples}>
          <a href="/dashboardv2#campanhas">
            Ver campanhas <ArrowRight size={14} />
          </a>
          <a href="/dashboardv2#inventario">
            Ver inventário <ArrowRight size={14} />
          </a>
        </div>
      </Example>
    </>
  );
}
const tableRows = [
  {
    id: '1',
    name: 'Credenciados setembro.csv',
    detail: 'Públicos',
    count: 18400,
    date: '29 set, 14:00',
    status: 'Concluído',
  },
  {
    id: '2',
    name: 'Anunciantes outubro.csv',
    detail: 'Anunciantes',
    count: 24,
    date: '30 set, 09:00',
    status: 'Em revisão',
  },
];
function Tables() {
  const [density, setDensity] = useState('compact');
  const [sort, setSort] = useState<TableSort>({ key: 'name', direction: 'asc' });
  const rows = [...tableRows].sort((a, b) => {
    const key = sort.key as keyof typeof a;
    const result =
      key === 'count'
        ? Number(a[key]) - Number(b[key])
        : String(a[key]).localeCompare(String(b[key]), 'pt-BR');
    return sort.direction === 'asc' ? result : -result;
  });
  return (
    <>
      <Example
        title="Tabela por contexto"
        note="Uma lista contínua para históricos. Mais espaço quando o cadastro precisa de uma segunda linha."
        code={
          '<DataTable label="Importações" rows={rows} rowKey={row => row.id}\n  columns={columns} density="compact" sort={sort} onSort={setSort} />'
        }
      >
        <Tabs
          label="Densidade de tabela"
          values={[
            { id: 'compact', label: 'Histórico compacto' },
            { id: 'comfortable', label: 'Cadastro com contexto' },
          ]}
          active={density}
          onChange={setDensity}
        />
        <div className={c.tablePreview}>
          <DataTable
            label="Exemplo de importações"
            rows={rows}
            rowKey={(row) => row.id}
            density={density as 'compact' | 'comfortable'}
            sort={sort}
            onSort={setSort}
            columns={[
              {
                key: 'name',
                label: 'Arquivo',
                width: 300,
                render: (row) => (
                  <>
                    <strong className={c.entity}>{row.name}</strong>
                    {density === 'comfortable' && <span className={c.secondary}>{row.detail}</span>}
                  </>
                ),
              },
              {
                key: 'count',
                label: 'Registros',
                width: 115,
                numeric: true,
                render: (row) => row.count.toLocaleString('pt-BR'),
              },
              {
                key: 'date',
                label: 'Recebido em',
                width: 160,
                sortable: false,
                render: (row) => row.date,
              },
              {
                key: 'status',
                label: 'Situação',
                width: 135,
                render: (row) => (
                  <Status
                    value={row.status}
                    tone={row.status === 'Concluído' ? 'green' : 'amber'}
                    variant="soft"
                    icon={row.status === 'Concluído' ? CircleCheck : Clock3}
                  />
                ),
              },
            ]}
          />
        </div>
      </Example>
      <div className={c.patternList}>
        {[
          {
            title: 'Históricos e filas',
            text: 'Data, evento e situação por linha. Densidade compacta.',
            href: '/dashboardv2#plataforma/importacoes',
          },
          {
            title: 'Estoque e inventário',
            text: 'Capacidade, unidade de mídia e preço-base.',
            href: '/dashboardv2#inventario',
          },
          {
            title: 'Diretórios e pessoas',
            text: 'Nome e e-mail juntos; papel e vínculo em colunas próprias.',
            href: '/dashboardv2#plataforma/usuarios',
          },
          {
            title: 'Campanhas',
            text: 'Agrupamento por etapa e toggle de veiculação.',
            href: '/dashboardv2#campanhas',
          },
        ].map((item) => (
          <a href={item.href} key={item.title}>
            <div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
            <ArrowRight size={15} />
          </a>
        ))}
      </div>
    </>
  );
}
function Feedback({ notify }: { notify: Notice }) {
  const variants: ToastVariant[] = ['info', 'success', 'warning', 'error'];
  const labels = { info: 'Informação', success: 'Sucesso', warning: 'Atenção', error: 'Erro' };
  const messages = {
    info: 'A exportação está sendo preparada.',
    success: 'As alterações foram salvas.',
    warning: 'A campanha precisa de revisão.',
    error: 'Não foi possível salvar as alterações.',
  };
  const [details, setDetails] = useState(false);
  const [hidden, setHidden] = useState<ToastVariant[]>([]);
  return (
    <>
      <Example title="Status">
        <div className={c.row}>
          <Status value="Em veiculação" tone="blue" />
          <Status value="Concluído" tone="green" />
          <Status value="Em revisão" tone="amber" />
          <Status value="Ajustes necessários" tone="pink" />
          <Status value="Rascunho" />
        </div>
      </Example>
      <div className={c.feedbackToolbar}>
        <h2>Toasts compactos</h2>
        <Checkbox
          label="Com título e ação"
          checked={details}
          onChange={(event) => setDetails(event.target.checked)}
        />
      </div>
      <div className={c.toastGrid}>
        {variants.map((variant) => (
          <section key={variant}>
            <header>
              <h3>{labels[variant]}</h3>
              <Button
                variant="ghost"
                onClick={() =>
                  notify({
                    variant,
                    message: messages[variant],
                    ...(details
                      ? { title: labels[variant], action: { label: 'Entendi', onClick: () => {} } }
                      : {}),
                  })
                }
              >
                Disparar {labels[variant].toLowerCase()}
              </Button>
            </header>
            {hidden.includes(variant) ? (
              <Button onClick={() => setHidden(hidden.filter((item) => item !== variant))}>
                Restaurar {labels[variant].toLowerCase()}
              </Button>
            ) : (
              <ToastCard
                toast={{
                  variant,
                  message: messages[variant],
                  ...(details
                    ? {
                        title: labels[variant],
                        action: {
                          label: 'Entendi',
                          onClick: () => setHidden([...hidden, variant]),
                        },
                      }
                    : {}),
                }}
                dismiss={() => setHidden([...hidden, variant])}
              />
            )}
          </section>
        ))}
      </div>
      <p className={c.help}>
        Avisos simples duram 6 segundos e pausam durante foco ou hover. Atenção, erro e avisos com
        ação ficam disponíveis até serem dispensados.
      </p>
    </>
  );
}
function FormExample({ notify }: { notify: Notice }) {
  const [name, setName] = useState('');
  const [format, setFormat] = useState('display');
  const [error, setError] = useState('');
  return (
    <>
      <Example
        title="Cadastro com validação"
        note="Experimente salvar sem preencher o nome. A validação conserva os demais campos."
      >
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) {
              setError('Informe o nome da campanha.');
              event.currentTarget.querySelector<HTMLInputElement>('#example-name')?.focus();
              return;
            }
            setError('');
            notify({
              variant: 'success',
              title: 'Rascunho salvo',
              message: `${name} foi salvo neste exemplo.`,
            });
          }}
        >
          <div className={c.fieldGrid}>
            <FormField id="example-name" label="Nome da campanha" required>
              <Input
                id="example-name"
                name="name"
                required
                value={name}
                error={error}
                onChange={(event) => {
                  setName(event.target.value);
                  setError('');
                }}
              />
            </FormField>
            <FormField id="example-format" label="Formato">
              <Select
                id="example-format"
                label="Formato da campanha"
                value={format}
                onValueChange={setFormat}
                options={[
                  { value: 'display', label: 'Display' },
                  { value: 'email', label: 'E-mail' },
                ]}
              />
            </FormField>
            <FormField id="example-budget" label="Investimento">
              <MoneyInput id="example-budget" name="budget" defaultValue={5000} />
            </FormField>
            <FormField id="example-start" label="Data de início">
              <DateInput
                id="example-start"
                name="start"
                label="Data de início"
                defaultValue="2026-10-15"
              />
            </FormField>
          </div>
          <footer className={c.formFooter}>
            <Button
              onClick={() => {
                setName('');
                setFormat('display');
                setError('');
              }}
            >
              Limpar nome
            </Button>
            <Button variant="primary" icon={Check} type="submit">
              Salvar rascunho
            </Button>
          </footer>
        </form>
      </Example>
      <div className={c.patternList}>
        {[
          {
            label: 'Criação de campanha',
            url: '/dashboardv2#campanhas/novo',
            text: 'Seções, seleção de mídia e resumo.',
          },
          {
            label: 'Cadastro de público',
            url: '/dashboardv2#publicos/novo',
            text: 'Campos e ações no contexto do cadastro.',
          },
          {
            label: 'Cadastro de ativo',
            url: '/dashboardv2#inventario/novo',
            text: 'Formato, preço, unidade e disponibilidade.',
          },
        ].map((item) => (
          <a key={item.label} href={item.url}>
            <div>
              <h3>{item.label}</h3>
              <p>{item.text}</p>
            </div>
            <ArrowRight size={15} />
          </a>
        ))}
      </div>
    </>
  );
}

export {
  Example,
  ComponentLine,
  Usage,
  Colors,
  Typography,
  Spacing,
  Buttons,
  Fields,
  Selection,
  Navigation,
  Tables,
  Feedback,
  FormExample,
};
