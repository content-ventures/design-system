'use client';
import { useId, useState, type CSSProperties } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  CalendarDays,
  List,
  Bookmark,
  ArrowRight,
  Activity,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  Check,
  ChevronDown,
  ClipboardList,
  Copy,
  Download,
  FileText,
  Gift,
  Home,
  Info,
  Layers2,
  LayoutGrid,
  Megaphone,
  MoreHorizontal,
  Pencil,
  Plus,
  RadioTower,
  Search,
  Settings2,
  ShieldCheck,
  Table2,
  Tags,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';
import {
  Button,
  ActionMenu,
  Breadcrumbs,
  LinkAction,
  ColorPicker,
  IconButton,
  Input,
  Select,
  Switch,
  Status,
  Dialog,
  Popover,
  Tooltip,
  Tabs,
  type useToast,
} from '../../components/ds-v2';
import { Colors, Typography, Spacing, Buttons, Navigation } from './base-examples';
import { Stage, Segmented, Description, Metrics, Steps } from './specimen-ui';
import s from './specimen.module.css';
import { inventory, normalizeSearch } from '../inventory';
type Notify = ReturnType<typeof useToast>['notify'];

export function FoundationSpecimen({ id }: { id: string }) {
  const [value, setValue] = useState('Desktop');
  const [on, setOn] = useState(true);
  const [color, setColor] = useState('#0875db');
  if (id === 'cores') return <Colors />;
  if (id === 'tipografia') return <Typography />;
  if (id === 'espacamento') return <Spacing />;
  if (id === 'principios')
    return (
      <Stage title="A linguagem aprovada em contexto">
        <div className={s.stack}>
          <div className={s.spread}>
            <div>
              <h3>Lançamento primavera</h3>
              <p>Calçados Aurora · 01 a 31 out, 2026</p>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                window.location.hash = 'wizard';
              }}
            >
              Editar campanha
            </Button>
          </div>
          <Metrics />
          <div className={s.matrix}>
            {[
              [
                'Hierarquia antes de decoração',
                'Título, dado principal e contexto usam papéis tipográficos distintos.',
              ],
              [
                'Densidade de aplicativo',
                'Controles de 36–38 px, espaçamento de 4 px e tabelas próprias para cada domínio.',
              ],
              [
                'Cor com função',
                'Azul para ação e seleção; tons semânticos acompanhados de texto.',
              ],
              ['Conteúdo direto', 'Uma ação principal. Ajuda somente onde existe uma dúvida real.'],
            ].map(([title, text]) => (
              <div key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </Stage>
    );
  if (id === 'grid')
    return (
      <Stage
        title="Composição responsiva"
        tools={
          <Segmented
            label="Largura da composição"
            values={['Desktop', 'Tablet', 'Celular']}
            value={value}
            onChange={setValue}
          />
        }
      >
        <div
          style={{
            maxWidth: value === 'Celular' ? 320 : value === 'Tablet' ? 600 : '100%',
            margin: 'auto',
            display: 'grid',
            gap: 12,
            gridTemplateColumns: `repeat(${value === 'Celular' ? 2 : value === 'Tablet' ? 6 : 12},1fr)`,
          }}
        >
          {Array.from(
            { length: value === 'Celular' ? 2 : value === 'Tablet' ? 6 : 12 },
            (_, index) => (
              <div
                key={index}
                style={{
                  height: 160,
                  background: '#eef6fd',
                  borderRadius: 4,
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--accent-ink)',
                  font: 'var(--type-caption)',
                }}
              >
                {index + 1}
              </div>
            ),
          )}
        </div>
        <div className={s.matrix}>
          <div>
            <h3>Conteúdo fluido</h3>
            <p>
              24 px nas laterais em desktop; 16 px no celular. A lateral de 230 px recolhe em telas
              pequenas.
            </p>
          </div>
          <div>
            <h3>Quebra pelo conteúdo</h3>
            <p>
              Formulários passam a uma coluna. Tabelas preservam a largura e rolam dentro da região.
            </p>
          </div>
        </div>
      </Stage>
    );
  if (id === 'bordas' || id === 'elevacao')
    return (
      <Stage title={id === 'bordas' ? 'Raios por função' : 'Profundidade funcional'}>
        <div className={s.three}>
          {(id === 'bordas'
            ? [
                ['Controle', '7 px', '7'],
                ['Superfície', '9 px', '9'],
                ['Toast', '10 px', '10'],
              ]
            : [
                ['Página', 'Sem sombra', '0'],
                ['Popover', 'Elevação contextual', '1'],
                ['Diálogo', 'Sobreposição modal', '2'],
              ]
          ).map(([label, measure, radius]) => (
            <div
              key={label}
              style={{
                padding: 24,
                border: '1px solid var(--line)',
                borderRadius: id === 'bordas' ? Number(radius) : 9,
                boxShadow:
                  id === 'elevacao'
                    ? radius === '2'
                      ? '0 16px 45px #14223420'
                      : radius === '1'
                        ? '0 6px 22px #14223414'
                        : 'none'
                    : 'none',
              }}
            >
              <strong>{label}</strong>
              <p className={s.muted}>{measure}</p>
            </div>
          ))}
        </div>
      </Stage>
    );
  if (id === 'iconografia')
    return (
      <Stage title="Lucide · traço de 1,5 px">
        <div className={s.three}>
          {[Search, Plus, Settings2, Bell, Users, FileText, Home, LayoutGrid, Download].map(
            (Icon, index) => (
              <div key={index} className={s.row}>
                <Icon size={18} />
                <span>
                  {
                    [
                      'Buscar',
                      'Adicionar',
                      'Configurar',
                      'Notificações',
                      'Públicos',
                      'Documento',
                      'Início',
                      'Inventário',
                      'Exportar',
                    ][index]
                  }
                </span>
              </div>
            ),
          )}
        </div>
        <div className={s.matrix}>
          <div>
            <h3>15–16 px</h3>
            <p>
              Ações e controles compactos. Ícones funcionais acompanhados por texto ou nome
              acessível.
            </p>
          </div>
          <div>
            <h3>18–24 px</h3>
            <p>Navegação e título de página. Sem caixas decorativas em todos os ícones.</p>
          </div>
        </div>
      </Stage>
    );
  if (id === 'movimento')
    return (
      <Stage title="Transições de estado">
        <div className={s.row}>
          <Switch label="Veiculação" checked={on} onCheckedChange={setOn} />
          <Status value={on ? 'Em veiculação' : 'Pausada'} tone={on ? 'blue' : 'neutral'} />
        </div>
        <div className={s.matrix}>
          <div>
            <h3>120 ms · ease</h3>
            <p>Foco, seleção e hover respondem sem atrasar a ação.</p>
          </div>
          <div>
            <h3>Movimento reduzido</h3>
            <p>
              O tema respeita prefers-reduced-motion. Mudanças de estado mantêm texto e contraste.
            </p>
          </div>
        </div>
      </Stage>
    );
  if (id === 'temas')
    return (
      <Stage
        title="Tema vigente e marca do portal"
        footer="Tema claro aprovado. Tema escuro ainda depende de desenho e revisão específicos."
        appearance="plain"
      >
        <div className={s.themeWorkbench}>
          <div className={s.themeControls}>
            <ColorPicker
              value={color}
              onChange={setColor}
              label="Acento da marca na prévia"
              appearance="plain"
            />
            <p>A cor adapta a marca e as ações da prévia sem criar novas molduras na interface.</p>
          </div>
          <div
            className={s.themePreview}
            style={{ '--portal-accent': color, '--action': color } as CSSProperties}
          >
            <div className={s.themePreviewHeader}>
              <span className={s.themePreviewMark} aria-hidden="true">
                F
              </span>
              <span className={s.themePreviewIdentity}>
                <strong>Portal Francal</strong>
                <span>Ambiente do anunciante</span>
              </span>
              <span className={s.themeMode}>Tema claro</span>
            </div>
            <div className={s.themePreviewBody}>
              <small>Campanha em destaque</small>
              <h3>Lançamento primavera</h3>
              <p>Interface clara · Inter 400 / 500 / 600</p>
              <div className={s.themePreviewActions}>
                <Button variant="primary">Abrir campanha</Button>
                <span>Acento aplicado em marca, foco e ação.</span>
              </div>
            </div>
          </div>
        </div>
      </Stage>
    );
  if (id === 'acessibilidade')
    return (
      <Stage title="Percurso por teclado">
        <div className={s.form}>
          <Input aria-label="Nome da campanha" placeholder="Nome da campanha" />
          <Select
            label="Portal acessível"
            options={[
              { value: 'francal', label: 'Francal 2026' },
              { value: 'beauty', label: 'Beauty Fair' },
            ]}
          />
          <Switch label="Receber notificações" checked={on} onCheckedChange={setOn} />
          <Button variant="primary" onClick={() => setOn(!on)}>
            Alternar preferência
          </Button>
        </div>
        <div className={s.matrix}>
          <div>
            <h3>Tab, setas e Escape</h3>
            <p>Foco visível, ordem lógica, rótulos associados e retorno ao gatilho de camadas.</p>
          </div>
          <div>
            <h3>Nome e estado</h3>
            <p>
              Ícones com nome acessível, erros junto ao campo e cor sempre acompanhada de texto.
            </p>
          </div>
        </div>
      </Stage>
    );
  return (
    <Stage title="Escrever para a operação">
      <Description
        entries={[
          ['Ação', 'Salvar rascunho'],
          ['Sucesso', 'Campanha enviada para revisão.'],
          ['Erro', 'Informe uma data posterior ao início.'],
          ['Moeda', 'R$ 24.800,00'],
          ['Quantidade', '18.400 contatos'],
          ['Data', '30 set, 2026 · 09:40'],
          ['Vazio', 'Nenhuma campanha para este período.'],
        ]}
      />
    </Stage>
  );
}

export function ActionSpecimen({ id, notify }: { id: string; notify: Notify }) {
  const [view, setView] = useState('Lista');
  const [selected, setSelected] = useState(false);
  const [duplicated, setDuplicated] = useState(false);
  if (id === 'botoes') return <Buttons notify={notify} />;
  if (id === 'botao-icone')
    return (
      <Stage title="Ações compactas com nome acessível">
        <div className={s.row}>
          {[
            { icon: Pencil, label: 'Editar campanha' },
            { icon: Copy, label: 'Duplicar campanha' },
            { icon: Download, label: 'Exportar relatório' },
          ].map(({ icon, label }) => (
            <Tooltip key={label} text={label}>
              <IconButton
                icon={icon}
                label={label}
                onClick={() => notify(`${label}: ação demonstrada.`)}
              />
            </Tooltip>
          ))}
          <IconButton icon={Trash2} label="Excluir campanha bloqueada" disabled />
        </div>
      </Stage>
    );
  if (id === 'grupo-botoes' || id === 'toggle')
    return (
      <Stage title={id === 'toggle' ? 'Alternância de apresentação' : 'Ações relacionadas'}>
        <div className={s.stack}>
          <Segmented
            label="Visualização dos registros"
            values={['Lista', 'Grade', 'Calendário']}
            value={view}
            onChange={setView}
          />
          <div className={s.row}>
            <Button
              aria-pressed={selected}
              onClick={() => setSelected(!selected)}
              icon={selected ? Check : Plus}
            >
              {selected ? 'Adicionado ao plano' : 'Adicionar ao plano'}
            </Button>
            <Button variant="primary" onClick={() => notify('Rascunho salvo na demonstração.')}>
              Salvar rascunho
            </Button>
            <ActionMenu
              label="Outras opções de salvamento"
              simple
              trigger={<IconButton label="Outras opções" icon={MoreHorizontal} />}
              items={[
                {
                  label: 'Salvar como cópia',
                  icon: Copy,
                  onSelect: () => notify('Cópia salva no exemplo.'),
                },
                {
                  label: 'Salvar como modelo',
                  icon: Bookmark,
                  onSelect: () => notify('Modelo salvo no exemplo.'),
                },
              ]}
            />
          </div>
          <div className={s.viewPreview} aria-live="polite">
            {view === 'Lista' ? (
              <List size={18} />
            ) : view === 'Grade' ? (
              <LayoutGrid size={18} />
            ) : (
              <CalendarDays size={18} />
            )}
            <div>
              <strong>{view}</strong>
              <span>
                {view === 'Lista'
                  ? 'Registros alinhados para comparação.'
                  : view === 'Grade'
                    ? 'Peças agrupadas por formato.'
                    : 'Veiculações organizadas por data.'}
              </span>
            </div>
          </div>
        </div>
      </Stage>
    );
  if (id === 'links')
    return (
      <Stage title="Navegação textual">
        <div className={s.stack}>
          <LinkAction href="#template-dashboard" icon={ArrowLeft}>
            Voltar ao dashboard
          </LinkAction>
          <LinkAction href="#wizard" trailingIcon={ArrowRight}>
            Continuar criação da campanha
          </LinkAction>
          <LinkAction
            href="/dashboardv2"
            icon={LayoutGrid}
            trailingIcon={ExternalLink}
            target="_blank"
            rel="noreferrer"
          >
            Abrir Dashboard V2 em outra aba
          </LinkAction>
          <span className={s.muted}>Links mudam de contexto; botões executam ações.</span>
        </div>
      </Stage>
    );
  return (
    <Stage title="Ações no contexto do registro">
      <ul className={s.list}>
        {['Lançamento primavera', ...(duplicated ? ['Lançamento primavera (cópia)'] : [])].map(
          (name) => (
            <li key={name}>
              <div>
                <strong>{name}</strong>
                <small>Calçados Aurora · rascunho</small>
              </div>
              <div className={s.row}>
                <IconButton
                  label={`Editar ${name}`}
                  icon={Pencil}
                  variant="ghost"
                  onClick={() => {
                    window.location.hash = 'template-cadastro';
                  }}
                />
                <ActionMenu
                  label={`Mais ações de ${name}`}
                  simple
                  trigger={
                    <IconButton
                      label={`Mais ações de ${name}`}
                      icon={MoreHorizontal}
                      variant="ghost"
                    />
                  }
                  items={[
                    {
                      label: 'Duplicar',
                      icon: Copy,
                      onSelect: () => {
                        setDuplicated(true);
                        notify('Campanha duplicada neste exemplo.');
                      },
                    },
                    {
                      label: 'Excluir',
                      icon: Trash2,
                      danger: true,
                      onSelect: () => {
                        window.location.hash = 'confirmacao';
                      },
                    },
                  ]}
                />
              </div>
            </li>
          ),
        )}
      </ul>
    </Stage>
  );
}

export function NavigationSpecimen({ id, notify }: { id: string; notify: Notify }) {
  const [active, setActive] = useState('Campanhas');
  const [sidebarActive, setSidebarActive] = useState('Dashboard');
  const [sidebarQuery, setSidebarQuery] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const uid = useId();
  const sidebarGroups = [
    {
      label: 'Workspace',
      items: [
        { name: 'Dashboard', icon: LayoutGrid },
        { name: 'Explorar tabelas', icon: Table2 },
        { name: 'Toasts', icon: Bell },
      ],
    },
    {
      label: 'Configuração',
      items: [
        { name: 'Métricas', icon: BarChart3 },
        { name: 'Canais', icon: RadioTower },
        { name: 'Públicos', icon: Users },
        { name: 'Inventário', icon: Boxes },
        { name: 'Bônus', icon: Gift },
      ],
    },
    {
      label: 'Operação',
      items: [
        { name: 'Campanhas', icon: Megaphone },
        { name: 'Pedidos de Inserção', icon: ClipboardList },
        { name: 'Leads', icon: UserRound, count: '1' },
      ],
    },
    {
      label: 'Portal',
      items: [
        { name: 'Fornecedores', icon: Building2 },
        { name: 'Empresa & Branding', icon: Layers2 },
        { name: 'Categorias da Vitrine', icon: Tags },
        { name: 'Auditoria', icon: ShieldCheck },
        { name: 'Operações', icon: Activity },
        { name: 'Configurações', icon: Settings2 },
      ],
    },
  ];
  const visibleSidebarGroups = sidebarGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        normalizeSearch(item.name).includes(normalizeSearch(sidebarQuery)),
      ),
    }))
    .filter((group) => group.items.length > 0);
  const commands = inventory
    .flatMap((group) => group.items)
    .filter((item) =>
      normalizeSearch(`${item.label} ${item.keywords}`).includes(normalizeSearch(query)),
    )
    .slice(0, 6);
  if (id === 'tabs') return <Navigation />;
  return (
    <Stage
      title={
        {
          sidebar: 'Navegação do portal',
          'cabecalho-app': 'Contexto global',
          breadcrumbs: 'Hierarquia da página',
          paginacao: 'Navegação entre resultados',
          stepper: 'Etapas do cadastro',
          'menu-dropdown': 'Menu de ações da campanha',
          'menu-contexto': 'Ações contextuais',
          comandos: 'Busca de comandos',
          'troca-portal': 'Troca de contexto',
        }[id] ?? 'Navegação'
      }
    >
      {(id === 'sidebar' || id === 'cabecalho-app') && (
        <div className={s.dashboardMockShell}>
          <aside className={s.dashboardMockSidebar}>
            <div className={s.dashboardMockIdentity}>
              <span className={s.dashboardMockLogo} aria-hidden="true">
                <Layers2 size={19} strokeWidth={1.8} />
              </span>
              <span>
                <strong>MediaOn</strong>
                <small>Francal Workspace</small>
              </span>
            </div>
            <div className={s.dashboardMockMode}>
              <span>Visualização</span>
              <button type="button">
                Gestão do portal
                <ChevronDown size={14} aria-hidden="true" />
              </button>
            </div>
            <label className={s.dashboardMockSearch}>
              <Search size={15} aria-hidden="true" />
              <input
                value={sidebarQuery}
                onChange={(event) => setSidebarQuery(event.target.value)}
                placeholder="Buscar no menu…"
                aria-label="Buscar no menu"
              />
            </label>
            <nav className={s.dashboardMockNav} aria-label="Navegação de exemplo">
              {visibleSidebarGroups.map((group) => (
                <div className={s.dashboardMockGroup} key={group.label}>
                  <span>{group.label}</span>
                  {group.items.map(({ name, icon: Icon, count }) => (
                    <button
                      key={name}
                      aria-pressed={sidebarActive === name}
                      onClick={() => setSidebarActive(name)}
                    >
                      <Icon size={16} strokeWidth={1.55} aria-hidden="true" />
                      <span>{name}</span>
                      {count && <small>{count}</small>}
                    </button>
                  ))}
                </div>
              ))}
              {visibleSidebarGroups.length === 0 && (
                <p className={s.dashboardMockEmpty}>Nenhum item encontrado.</p>
              )}
            </nav>
          </aside>
          <div className={s.dashboardMockMain}>
            <div className={s.dashboardMockTopbar}>
              <span className={s.dashboardMockBreadcrumb}>
                Workspace <b>/</b> <strong>{sidebarActive}</strong>
              </span>
              <Popover
                label="Avisos do portal"
                trigger={<IconButton label="Ver notificações" icon={Bell} variant="ghost" />}
              >
                <strong>Nenhuma nova notificação.</strong>
              </Popover>
            </div>
            <div className={s.dashboardMockContent}>
              <div className={s.dashboardMockHeading}>
                <h3>{sidebarActive}</h3>
              </div>
              {sidebarActive === 'Dashboard' ? (
                <div className={s.dashboardMockOverview}>
                  <section>
                    <h4>Resumo do portal</h4>
                    <div className={s.dashboardMockMetric}>
                      <span>Campanhas ativas</span>
                      <strong>3</strong>
                      <small>7 campanhas no total</small>
                    </div>
                  </section>
                  <section>
                    <h4>Entrega por campanha</h4>
                    {[
                      ['Aurora', 78],
                      ['Estúdio Norte', 61],
                      ['Lume', 45],
                    ].map(([label, value]) => (
                      <div className={s.dashboardMockProgress} key={label}>
                        <span>{label}</span>
                        <i>
                          <b style={{ width: `${value}%` }} />
                        </i>
                      </div>
                    ))}
                  </section>
                  <section className={s.dashboardMockCampaigns}>
                    <h4>Campanhas em destaque</h4>
                    {['Novas conexões, grandes negócios', 'O próximo capítulo do design'].map(
                      (campaign) => (
                        <div key={campaign}>
                          <Megaphone size={14} aria-hidden="true" />
                          <span>
                            <strong>{campaign}</strong>
                            <small>Aurora · Superbanner, Newsletter</small>
                          </span>
                        </div>
                      ),
                    )}
                  </section>
                </div>
              ) : (
                <div className={s.dashboardMockSection}>
                  <div>
                    <h4>{sidebarActive}</h4>
                    <p>Consulte registros, acompanhe status e execute as ações desta área.</p>
                  </div>
                  <Button
                    icon={Plus}
                    onClick={() => notify(`Ação de ${sidebarActive.toLowerCase()} demonstrada.`)}
                  >
                    Adicionar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {id === 'breadcrumbs' && (
        <div className={s.breadcrumbShowcase}>
          <div className={s.breadcrumbExample}>
            <span className={s.breadcrumbLabel}>Padrão</span>
            <Breadcrumbs
              items={[
                { label: 'Portal Francal', href: '#template-dashboard' },
                { label: 'Campanhas', href: '#template-listagem' },
                { label: 'Lançamento primavera' },
              ]}
            />
          </div>
          <div className={s.breadcrumbExample}>
            <span className={s.breadcrumbLabel}>Caminho longo</span>
            <Breadcrumbs
              maxItems={4}
              items={[
                { label: 'Portal Francal', href: '#template-dashboard' },
                { label: 'Planejamento', href: '#template-listagem' },
                { label: 'Marketing', href: '#template-listagem' },
                { label: 'Campanhas', href: '#template-listagem' },
                { label: 'Lançamento primavera' },
              ]}
            />
          </div>
          <div className={s.breadcrumbExample}>
            <span className={s.breadcrumbLabel}>Continuidade</span>
            <Breadcrumbs
              separator="arrow"
              items={[
                { label: 'Dashboard', href: '#template-dashboard' },
                { label: 'Relatórios', href: '#graficos' },
                { label: 'Exportar' },
              ]}
            />
          </div>
          <div className={s.breadcrumbExample}>
            <span className={s.breadcrumbLabel}>Com ícones</span>
            <Breadcrumbs
              items={[
                { label: 'Início', href: '#template-dashboard', icon: Home },
                { label: 'Campanhas', href: '#template-listagem', icon: LayoutGrid },
                { label: 'Lançamento primavera', icon: Bookmark },
              ]}
            />
          </div>
        </div>
      )}
      {id === 'paginacao' && (
        <div className={s.stack}>
          <ul className={s.list}>
            {Array.from({ length: 3 }, (_, index) => (
              <li key={index}>
                <strong>Campanha {(page - 1) * 3 + index + 1}</strong>
                <Status value="Rascunho" />
              </li>
            ))}
          </ul>
          <div className={s.spread}>
            <span className={s.muted}>
              {(page - 1) * 3 + 1}–{page * 3} de 15 campanhas
            </span>
            <div className={s.row}>
              <IconButton
                label="Página anterior"
                icon={ArrowLeft}
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              />
              {[1, 2, 3, 4, 5].map((number) => (
                <Button
                  key={number}
                  aria-current={page === number ? 'page' : undefined}
                  variant={page === number ? 'primary' : 'ghost'}
                  onClick={() => setPage(number)}
                >
                  {number}
                </Button>
              ))}
              <IconButton
                label="Próxima página"
                icon={ArrowRight}
                disabled={page === 5}
                onClick={() => setPage(page + 1)}
              />
            </div>
          </div>
        </div>
      )}
      {id === 'stepper' && (
        <div className={s.stepperFrame}>
          <Steps current={page - 1} />
          <div className={s.stepperActions}>
            <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
              Voltar
            </Button>
            <span>
              Etapa <strong>{page}</strong> de 3
            </span>
            <Button variant="primary" disabled={page === 3} onClick={() => setPage(page + 1)}>
              Continuar
            </Button>
          </div>
        </div>
      )}
      {id === 'menu-dropdown' && (
        <ActionMenu
          label="Ações da campanha"
          simple
          trigger={<IconButton label="Abrir ações da campanha" icon={MoreHorizontal} />}
          items={[
            {
              label: 'Editar',
              icon: Pencil,
              onSelect: () => {
                window.location.hash = 'template-cadastro';
              },
            },
            {
              label: 'Duplicar',
              icon: Copy,
              onSelect: () => notify('Cópia criada na demonstração.'),
            },
            {
              label: 'Exportar',
              icon: Download,
              onSelect: () => notify('Exportação iniciada na demonstração.'),
            },
            {
              label: 'Excluir',
              icon: Trash2,
              danger: true,
              onSelect: () => {
                window.location.hash = 'confirmacao';
              },
            },
          ]}
        />
      )}
      {id === 'menu-contexto' && (
        <div className={s.contextFile}>
          <span className={s.contextFileIcon} aria-hidden="true">
            <FileText size={20} />
          </span>
          <div>
            <strong>Plano de mídia — Outubro.pdf</strong>
            <small>PDF · 2,4 MB · atualizado hoje</small>
          </div>
          <ActionMenu
            label="Ações do arquivo"
            simple
            align="end"
            trigger={<IconButton label="Abrir ações do arquivo" icon={MoreHorizontal} />}
            items={[
              {
                label: 'Copiar nome',
                icon: Copy,
                onSelect: () => notify('Nome copiado na demonstração.'),
              },
              {
                label: 'Ver detalhes',
                icon: Info,
                onSelect: () => notify('Detalhes: PDF · 2,4 MB · adicionado hoje.'),
              },
              {
                label: 'Baixar arquivo',
                icon: Download,
                onSelect: () => notify('Download iniciado na demonstração.'),
              },
            ]}
          />
        </div>
      )}
      {id === 'comandos' && (
        <>
          <Button icon={Search} onClick={() => setOpen(true)}>
            Buscar na biblioteca
          </Button>
          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            title="Ir para um componente"
            description="Busque por nome, função ou padrão do produto."
            size="medium"
          >
            <div className={s.stack}>
              <Input
                id={uid}
                aria-label="Buscar comando"
                autoFocus
                placeholder="Digite um componente ou padrão…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <div className={s.menu}>
                {commands.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      window.location.hash = item.id;
                      setOpen(false);
                    }}
                  >
                    {item.label}
                    <ArrowRight size={14} style={{ marginLeft: 'auto' }} />
                  </button>
                ))}
                {!commands.length && <p>Nenhum componente encontrado.</p>}
              </div>
            </div>
          </Dialog>
        </>
      )}
      {id === 'troca-portal' && (
        <div className={s.portalSwitcher}>
          <div>
            <span className={s.portalMark}>F</span>
            <div>
              <small>Contexto atual</small>
              <strong>{active === 'Campanhas' ? 'Francal 2026' : active}</strong>
            </div>
            <Status value="Administrador" tone="blue" variant="soft" />
          </div>
          <Select
            label="Portal ativo"
            value={active}
            onValueChange={setActive}
            options={['Campanhas', 'Beauty Fair', 'ABF Franchising'].map((value) => ({
              value,
              label: value === 'Campanhas' ? 'Francal 2026' : value,
            }))}
          />
          <div className={s.portalHint}>
            <Info size={17} />
            <div>
              <strong>A troca preserva a sessão</strong>
              <p>Dados, permissões e identidade acompanham o portal selecionado.</p>
            </div>
          </div>
        </div>
      )}
    </Stage>
  );
}

export function StructureSpecimen({ id, notify }: { id: string; notify: Notify }) {
  const [selected, setSelected] = useState('Visão geral');
  const [width, setWidth] = useState(45);
  const body = (
    <div className={s.stack}>
      <div className={s.spread}>
        <div>
          <h3>Lançamento primavera</h3>
          <p className={s.muted}>Calçados Aurora · Portal Francal</p>
        </div>
        <Button variant="primary" onClick={() => notify('Alterações salvas neste exemplo.')}>
          Salvar alterações
        </Button>
      </div>
      <Description
        entries={[
          ['Status', <Status key="status" value="Em veiculação" tone="blue" />],
          ['Período', '01 a 31 out, 2026'],
          ['Investimento', 'R$ 24.800,00'],
          ['Responsável', 'Ana Lima'],
        ]}
      />
    </div>
  );
  if (id === 'descricao') return <Stage title="Metadados do registro">{body}</Stage>;
  if (id === 'shell')
    return (
      <Stage title="Estrutura do aplicativo">
        <div className={s.mockShell}>
          <aside className={s.mockSidebar}>
            <strong>MediaOn</strong>
            {['Visão geral', 'Campanhas', 'Inventário'].map((label) => (
              <button
                key={label}
                aria-pressed={selected === label}
                onClick={() => setSelected(label)}
              >
                {label}
              </button>
            ))}
          </aside>
          <div className={s.mockMain}>
            <h3>{selected}</h3>
            <p className={s.muted}>Portal Francal / {selected}</p>
            <Metrics />
          </div>
        </div>
      </Stage>
    );
  if (id === 'cabecalho-pagina')
    return (
      <Stage title="Cabeçalho de listagem">
        <div className={s.stack}>
          <div className={s.pageHeading}>
            <div>
              <span>Operação de mídia</span>
              <h3>Campanhas</h3>
              <p>Acompanhe a veiculação e os pedidos do portal.</p>
            </div>
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
          <Tabs
            values={['Visão geral', 'Ativas', 'Rascunhos'].map((label) => ({ id: label, label }))}
            active={selected}
            onChange={setSelected}
          />
          <p>
            {selected === 'Visão geral'
              ? 'Todas as campanhas do portal.'
              : `Campanhas ${selected.toLowerCase()}.`}
          </p>
        </div>
      </Stage>
    );
  if (id === 'accordion')
    return (
      <Stage title="Requisitos do criativo">
        {[
          [
            'Formato e dimensões',
            'Imagem JPG ou PNG em 1.200 × 628 px. Evite texto pequeno e preserve a área de leitura.',
          ],
          [
            'Peso e qualidade',
            'Arquivo de até 10 MB. Confira a prévia antes de enviar para aprovação.',
          ],
          ['Prazo de envio', 'Envie a peça com antecedência ao início da veiculação.'],
        ].map(([title, text]) => (
          <details className={s.accordion} key={title}>
            <summary>{title}</summary>
            <div>{text}</div>
          </details>
        ))}
      </Stage>
    );
  if (id === 'scroll')
    return (
      <Stage title="Região com rolagem própria">
        <div className={s.scrollRegion} tabIndex={0} role="region" aria-label="Histórico completo">
          <ul className={s.list}>
            {Array.from({ length: 12 }, (_, index) => (
              <li key={index}>
                <div>
                  <strong>
                    {index % 2 ? 'Campanha atualizada' : 'Pedido de inserção revisado'}
                  </strong>
                  <small>30 set, {9 + index}:00 · Ana Lima</small>
                </div>
                <Status value="Registrado" />
              </li>
            ))}
          </ul>
        </div>
      </Stage>
    );
  if (id === 'paineis')
    return (
      <Stage title="Lista e detalhe ajustáveis">
        <label htmlFor="panel-width" className={s.muted}>
          Largura do painel de lista: {width}%
        </label>
        <input
          id="panel-width"
          className={s.range}
          type="range"
          min={30}
          max={65}
          value={width}
          onChange={(event) => setWidth(Number(event.target.value))}
        />
        <div
          className={s.two}
          style={
            {
              gridTemplateColumns: `minmax(0,${width}fr) minmax(0,${100 - width}fr)`,
            } as CSSProperties
          }
        >
          <ul className={s.list}>
            {['Lançamento primavera', 'Novos caminhos', 'Conexões'].map((label) => (
              <li key={label}>
                <Button variant="ghost" onClick={() => setSelected(label)}>
                  {label}
                </Button>
              </li>
            ))}
          </ul>
          <div>
            <h3 style={{ font: 'var(--type-section)' }}>
              {selected === 'Visão geral' ? 'Lançamento primavera' : selected}
            </h3>
            <p className={s.muted}>Calçados Aurora</p>
            <Status value="Rascunho" />
          </div>
        </div>
      </Stage>
    );
  if (id === 'separador')
    return (
      <Stage title="Separação por contexto">
        <div className={s.sectionCollection}>
          <section>
            <span>Identificação</span>
            <Description
              entries={[
                ['Campanha', 'Lançamento primavera'],
                ['Anunciante', 'Calçados Aurora'],
              ]}
            />
          </section>
          <section>
            <span>Condições comerciais</span>
            <Description
              entries={[
                ['Investimento', 'R$ 24.800,00'],
                ['Vencimento', '10 out, 2026'],
              ]}
            />
          </section>
        </div>
      </Stage>
    );
  if (id === 'secoes')
    return (
      <Stage title="Seções de uma página de detalhe">
        <div className={s.sectionCollection}>
          <section>
            <span>01</span>
            <h3>Informações da campanha</h3>
            <Description
              entries={[
                ['Nome', 'Lançamento primavera'],
                ['Responsável', 'Ana Lima'],
              ]}
            />
          </section>
          <section>
            <span>02</span>
            <h3>Plano de mídia</h3>
            <Description
              entries={[
                ['Display', '120.000 impressões'],
                ['E-mail', '18.400 contatos'],
              ]}
            />
          </section>
        </div>
      </Stage>
    );
  return (
    <Stage title="Superfície com propósito">
      <div className={s.surfaceCard}>{body}</div>
    </Stage>
  );
}
