'use client';

import { useState, type CSSProperties } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  CircleHelp,
  Copy,
  FileText,
  Layers,
  LayoutGrid,
  Megaphone,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  Users,
  X,
} from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Field,
  Input,
  Section,
  Segmented,
  Switch,
} from '../components/ds/primitives';
import type { SampleKind } from './catalog';
import s from './showcase.module.css';

const palette = [
  { name: 'Grafite mineral', token: '--ds-ink', hex: '#1C2940', text: 'Conteúdo e hierarquia' },
  { name: 'Azul conexão', token: '--ds-brand', hex: '#3458DB', text: 'Marca, ações e seleção' },
  { name: 'Cinza de apoio', token: '--ds-muted', hex: '#606D82', text: 'Informação secundária' },
  { name: 'Plano de fundo', token: '--ds-canvas', hex: '#F0F2F6', text: 'Estrutura e repouso' },
  { name: 'Superfície', token: '--ds-surface', hex: '#FFFFFF', text: 'Conteúdo em primeiro plano' },
];
const semantics = [
  { name: 'Sucesso', token: '--ds-success', hex: '#236849' },
  { name: 'Atenção', token: '--ds-warning', hex: '#87580F' },
  { name: 'Erro', token: '--ds-danger', hex: '#AE373C' },
];
export function Foundation({
  kind,
  theme,
  setTheme,
  portal,
  setPortal,
  onNotify,
}: {
  kind: SampleKind;
  theme: string;
  setTheme: (value: string) => void;
  portal: string;
  setPortal: (value: string) => void;
  onNotify: (message: string) => void;
}) {
  const [motion, setMotion] = useState(false);
  const [demoText, setDemoText] = useState('Conexões que geram negócios.');
  const [direction, setDirection] = useState('operacional');
  async function copyToken(token: string) {
    try {
      await navigator.clipboard.writeText(`var(${token})`);
      onNotify('Token copiado.');
    } catch {
      onNotify(`Copie o token: var(${token})`);
    }
  }
  if (kind === 'colors')
    return (
      <>
        <Section
          title="Azul conexão. Neutros minerais."
          description="Valores abaixo são os tokens do tema claro padrão. As amostras acompanham o tema e o portal ativos."
        >
          <div className={s.swatches}>
            {palette.map((color) => (
              <button
                className={s.swatch}
                key={color.token}
                onClick={() => void copyToken(color.token)}
                aria-label={`Copiar token ${color.name}`}
              >
                <span style={{ background: `var(${color.token})` }} />
                <strong>{color.name}</strong>
                <code>{color.hex}</code>
                <small>{color.text}</small>
                <span className={s.copyToken}>
                  <Copy size={11} />
                  {color.token}
                </span>
              </button>
            ))}
          </div>
        </Section>
        <Section
          title="Estados têm significado"
          description="Cor nunca trabalha sozinha: sempre acompanhada de texto ou ícone."
        >
          <div className={s.threeColumns}>
            {semantics.map((color) => (
              <div className={s.semanticSample} key={color.name}>
                <i style={{ background: `var(${color.token})` }} />
                <div>
                  <strong>{color.name}</strong>
                  <code>
                    {color.hex} · {color.token}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </Section>
        <div className={s.ruleNote}>
          <ShieldCheck size={17} />
          <p>
            Texto principal e secundário com contraste AA sobre as superfícies definidas. Bordas de
            campos são mais fortes que divisórias decorativas.
          </p>
        </div>
      </>
    );
  if (kind === 'type')
    return (
      <>
        <Section
          title="Instrument Sans"
          description="Formas abertas e curvas presentes. Títulos com ritmo mais expressivo; interface com leitura tranquila."
        >
          <div className={s.typeHero}>
            <span>Aa</span>
            <div>
              <strong>
                O detalhe faz
                <br />a diferença.
              </strong>
              <p>Regular 400 · Medium 500 · Semibold 600</p>
            </div>
          </div>
          <Field label="Experimente a tipografia" htmlFor="type-preview">
            <Input
              id="type-preview"
              value={demoText}
              onChange={(e) => setDemoText(e.target.value)}
              maxLength={90}
            />
          </Field>
          <div className={s.typeScale}>
            {[
              { name: 'Display', size: 40, line: 48, weight: 500 },
              { name: 'Título de página', size: 32, line: 40, weight: 500 },
              { name: 'Título de seção', size: 20, line: 28, weight: 500 },
              { name: 'Corpo', size: 14, line: 22, weight: 400 },
              { name: 'Rótulo', size: 13, line: 20, weight: 500 },
              { name: 'Apoio', size: 12, line: 18, weight: 400 },
            ].map((row) => (
              <div key={row.name}>
                <code>
                  {row.name}
                  <small>
                    {row.size} / {row.line} · {row.weight}
                  </small>
                </code>
                <span
                  style={{
                    fontSize: row.size,
                    lineHeight: `${row.line}px`,
                    fontWeight: row.weight,
                  }}
                >
                  {demoText || 'MediaOn'}
                </span>
              </div>
            ))}
          </div>
        </Section>
        <Section
          title="IBM Plex Mono"
          description="Somente para tokens, especificações e identificação técnica."
        >
          <div className={s.monoSample}>
            0123456789
            <br />
            --ds-space-4: 16px;
          </div>
        </Section>
      </>
    );
  if (kind === 'themes')
    return (
      <>
        <Section
          title="A mesma linguagem, em diferentes contextos."
          description="Alternar aqui muda toda a biblioteca. Os portais abaixo são simulações, não identidades oficiais."
        >
          <div className={s.themeControls}>
            <div>
              <span className={s.controlLabel}>Aparência</span>
              <Segmented
                value={theme}
                onChange={setTheme}
                label="Tema da biblioteca"
                options={[
                  { value: 'light', label: 'Claro' },
                  { value: 'dark', label: 'Escuro' },
                ]}
              />
            </div>
            <div>
              <span className={s.controlLabel}>Marca do portal</span>
              <Segmented
                value={portal}
                onChange={setPortal}
                label="Marca de demonstração"
                options={[
                  { value: 'mediaon', label: 'MediaOn' },
                  { value: 'setorial', label: 'Setorial' },
                  { value: 'negocios', label: 'Negócios' },
                ]}
              />
            </div>
          </div>
          <div className={s.themePreview}>
            <div className={s.previewSidebar}>
              <span className={s.miniBrand}>media.on</span>
              <span>
                <LayoutGrid size={14} />
                Visão geral
              </span>
              <span className={s.miniActive}>
                <Megaphone size={14} />
                Campanhas
              </span>
              <span>
                <Users size={14} />
                Públicos
              </span>
              <span>
                <ChartNoAxesCombined size={14} />
                Resultados
              </span>
            </div>
            <div className={s.themePreviewMain}>
              <div className={s.rowBetween}>
                <span>Campanhas</span>
                <Badge tone="success">Em veiculação</Badge>
              </div>
              <h3>Sua marca, no lugar certo.</h3>
              <p>Uma estrutura familiar, com espaço para a identidade de cada feira.</p>
              <Field label="Nome da campanha" htmlFor="theme-campaign">
                <Input id="theme-campaign" defaultValue="Presença em destaque" />
              </Field>
              <div className={s.buttonRow}>
                <Button onClick={() => onNotify('Alteração demonstrada. Nenhum dado foi salvo.')}>
                  Salvar alterações
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => onNotify('Demonstração de ação secundária.')}
                >
                  Ver detalhes
                </Button>
              </div>
            </div>
          </div>
        </Section>
        <div className={s.ruleNote}>
          <Layers size={17} />
          <p>
            O portal pode variar o acento. Tipografia, escala, espaçamento, semântica dos estados e
            comportamento permanecem consistentes.
          </p>
        </div>
      </>
    );
  if (kind === 'principles')
    return (
      <>
        <Section
          title="Profissionalismo está nas decisões pequenas."
          description="Três direções estudadas. Conexão fluida é a proposta desta revisão; a escolha final continua em aberto."
        >
          <div className={s.threeColumns}>
            {[
              {
                id: 'operacional',
                title: 'Conexão fluida',
                text: 'Superfícies arredondadas, navegação flutuante e hierarquia por camadas. Movimento liga uma ação à próxima.',
                caption: 'Proposta R2 · Ad Manager e biblioteca',
              },
              {
                id: 'editorial',
                title: 'Estúdio editorial',
                text: 'Navegação superior, imagens maiores e composição assimétrica. Conteúdo tem prioridade sobre densidade operacional.',
                caption: 'Alternativa · Vitrine e descoberta',
              },
              {
                id: 'analitica',
                title: 'Console de performance',
                text: 'Navegação compacta, superfícies escuras e métricas em paralelo. Mais comparação; menos espaço de apresentação.',
                caption: 'Alternativa · Operação intensiva',
              },
            ].map((item, i) => (
              <button
                key={item.id}
                className={s.direction}
                aria-pressed={direction === item.id}
                onClick={() => setDirection(item.id)}
              >
                <div className={`${s.directionSketch} ${s[`sketch${i}`]}`} aria-hidden="true">
                  <aside />
                  <div>
                    <b />
                    {Array.from({ length: i === 2 ? 7 : i === 1 ? 2 : 4 }, (_, j) => (
                      <i key={j} />
                    ))}
                  </div>
                </div>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
                <small>{item.caption}</small>
              </button>
            ))}
          </div>
          <p className={s.selectionNote} role="status">
            Em estudo:{' '}
            {direction === 'operacional'
              ? 'Conexão fluida'
              : direction === 'editorial'
                ? 'Estúdio editorial'
                : 'Console de performance'}
            . A seleção compara conceitos; não altera os tokens desta proposta.
          </p>
        </Section>
        <Section title="Regras de composição">
          <div className={s.principleRows}>
            {[
              [
                'Identidade que chega aos detalhes',
                'A mesma família de curvas conecta marca, superfícies, controles e movimento.',
              ],
              [
                'Familiaridade nos fluxos',
                'Campanhas em páginas, etapas visíveis e resumo persistente.',
              ],
              [
                'Uma ação principal por contexto',
                'A cor de ação orienta o próximo passo. Não disputa atenção.',
              ],
              [
                'Detalhes que resistem ao uso',
                'Estados vazios, erros, foco, números e responsividade fazem parte do desenho.',
              ],
              [
                'Referência não é reprodução',
                'Os pins orientam ritmo e organização. Nenhum layout ou asset foi copiado.',
              ],
            ].map(([title, text]) => (
              <div key={title}>
                <Check size={16} />
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </Section>
      </>
    );
  if (kind === 'spacing' || kind === 'grid')
    return (
      <>
        <Section
          title={kind === 'grid' ? 'Uma estrutura que se adapta.' : 'Ritmo em múltiplos de quatro.'}
          description="A proximidade agrupa. O espaço separa decisões."
        >
          <div className={s.spacingScale}>
            {[4, 8, 12, 16, 24, 32, 48, 64].map((value) => (
              <div key={value}>
                <code>{value}px</code>
                <span style={{ width: `${value * 4}px` }} />
                <small>
                  {value <= 8
                    ? 'Detalhes'
                    : value <= 16
                      ? 'Componentes'
                      : value <= 32
                        ? 'Grupos'
                        : 'Seções'}
                </small>
              </div>
            ))}
          </div>
        </Section>
        <Section title="Grid e densidade">
          <div className={s.gridDemo}>
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i}>{i + 1}</span>
            ))}
          </div>
          <div className={s.threeColumns}>
            {[
              ['Compacto', 'Até 700px', '1 coluna · margem 20px · controles 44px'],
              ['Intermediário', '701–1100px', '2 colunas quando o conteúdo permitir'],
              ['Amplo', 'Acima de 1100px', 'Navegação flutuante 244px · conteúdo até 1440px'],
            ].map(([name, size, text]) => (
              <div className={s.ruleCard} key={name}>
                <strong>{name}</strong>
                <code>{size}</code>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </Section>
      </>
    );
  if (kind === 'radii' || kind === 'elevation')
    return (
      <Section
        title={
          kind === 'radii' ? 'Uma família de curvas.' : 'Camadas leves. Profundidade sem peso.'
        }
        description="12px nos campos, 20px nos painéis e 28px nas áreas de marca. Botões e status usam contorno cápsula."
      >
        <div className={s.threeColumns}>
          {(kind === 'radii'
            ? [
                ['12px', 'Campos e controles', 'var(--ds-radius-md)'],
                ['20px', 'Painéis e diálogos', 'var(--ds-radius-lg)'],
                ['28px', 'Áreas de marca', 'var(--ds-radius-xl)'],
              ]
            : [
                ['Superfície', 'Separação suave do plano de fundo', 'var(--ds-shadow-panel)'],
                ['Controle', 'Sombra de contato', 'var(--ds-shadow-control)'],
                ['Sobreposição', 'Apenas diálogos e menus', 'var(--ds-shadow-overlay)'],
              ]
          ).map(([value, label, token]) => (
            <div className={s.geometryCard} key={value}>
              <div style={kind === 'radii' ? { borderRadius: token } : { boxShadow: token }} />
              <strong>{value}</strong>
              <p>{label}</p>
              <code>{token}</code>
            </div>
          ))}
        </div>
      </Section>
    );
  if (kind === 'icons') {
    const icons = [
      ['Campanhas', Megaphone],
      ['Públicos', Users],
      ['Objetivo', Target],
      ['Métricas', ChartNoAxesCombined],
      ['Busca', Search],
      ['Filtros', SlidersHorizontal],
      ['Configurar', Settings2],
      ['Período', CalendarDays],
      ['Documento', FileText],
      ['Notificar', Bell],
      ['Ajuda', CircleHelp],
      ['Concluir', Check],
      ['Avançar', ArrowRight],
      ['Externo', ArrowUpRight],
      ['Expandir', ChevronDown],
      ['Fechar', X],
    ] as const;
    return (
      <Section
        title="Lucide. Um traço, uma linguagem."
        description="16px para controles, 20px para navegação e 24px para destaque. Traço de 1,5 a 1,75px."
      >
        <div className={s.iconGrid}>
          {icons.map(([name, Icon]) => (
            <div key={name}>
              <Icon size={22} strokeWidth={1.6} />
              <span>{name}</span>
            </div>
          ))}
        </div>
        <div className={s.ruleNote}>
          <CircleHelp size={17} />
          <p>
            Ícones de ação têm nome acessível. Ícones decorativos não repetem o texto para leitores
            de tela.
          </p>
        </div>
      </Section>
    );
  }
  if (kind === 'motion')
    return (
      <Section
        title="O movimento explica a mudança."
        description="200ms nos controles, 360ms na entrada de conteúdo e 650ms na assinatura da marca. Sem repetição contínua."
      >
        <div className={s.motionDemo}>
          <Switch
            label="Experimentar mudança de estado"
            description="A transição preserva posição e tamanho do controle."
            checked={motion}
            onChange={setMotion}
          />
          <div className={s.motionTrack}>
            <span style={{ transform: motion ? 'translateX(180px)' : 'translateX(0)' }}>
              <Check size={18} />
            </span>
          </div>
          <code>200ms · cubic-bezier(.22, 1, .36, 1)</code>
        </div>
        <Alert title="Movimento reduzido respeitado">
          Se o sistema operacional solicitar movimento reduzido, as transições são praticamente
          instantâneas.
        </Alert>
      </Section>
    );
  if (kind === 'accessibility')
    return (
      <>
        <Section title="Usar bem também é enxergar, entender e alcançar.">
          <div className={s.principleRows}>
            {[
              ['Contraste', 'Pares de texto claros e escuros, com objetivo mínimo AA.'],
              [
                'Teclado',
                'Foco visível, ordem lógica, Escape nos diálogos e retorno ao acionador.',
              ],
              ['Formulários', 'Rótulos permanentes, mensagens associadas e foco no erro.'],
              ['Dados', 'Status com texto, números alinhados e alternativa tabular para gráficos.'],
              [
                'Responsividade',
                'Alvos de 44px no celular e tabelas com rolagem restrita ao próprio bloco.',
              ],
            ].map(([title, text]) => (
              <div key={title}>
                <ShieldCheck size={17} />
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </Section>
        <div className={s.canvas}>
          <Button onClick={() => onNotify('Ação executada pelo teclado ou mouse.')}>
            Use Tab para testar o foco
          </Button>
        </div>
        <Alert title="Validação contínua">
          Esta proposta está em revisão. A aprovação final inclui testes com usuários e tecnologias
          assistivas.
        </Alert>
      </>
    );
  return (
    <Section
      title="Uma interface que fala a língua da operação."
      description="Português direto, verbos específicos e formatação brasileira."
    >
      <div className={s.copyRules}>
        {[
          ['Ação', 'Criar campanha', 'Evitar “Enviar” quando o destino não está claro.'],
          ['Erro', 'Informe um investimento maior que zero.', 'Explique o que precisa mudar.'],
          [
            'Vazio',
            'Nenhuma campanha encontrada.',
            'Ofereça limpar filtros ou criar o primeiro registro.',
          ],
          ['Dinheiro', 'R$ 18.400,00', 'Separadores locais e unidade explícita.'],
          ['Data', '29 set. 2026', 'Mantenha o padrão dentro do mesmo contexto.'],
          ['Status', 'Em veiculação', 'Use os nomes reconhecidos pela operação.'],
        ].map(([label, example, hint]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{example}</strong>
            <p>{hint}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function PaletteStrip() {
  return (
    <div className={s.paletteStrip}>
      {palette.map((color) => (
        <span
          key={color.token}
          title={`${color.name}: ${color.hex}`}
          style={{ background: `var(${color.token})` } as CSSProperties}
        />
      ))}
    </div>
  );
}
