import { inventory } from '../inventory';

export const catalogItems = inventory.flatMap((group) =>
  group.items.map((item) => ({ ...item, groupId: group.id, groupLabel: group.label })),
);
export type CatalogItem = (typeof catalogItems)[number];
export const aliases: Record<string, string> = {
  campos: 'campo',
  tabelas: 'tabela',
  formularios: 'validacao',
  feedback: 'toast',
  selecao: 'checkbox',
  navegacao: 'tabs',
};
export const publicComponents: Record<string, string> = {
  botoes: 'Button',
  'botao-icone': 'IconButton',
  campo: 'FormField',
  input: 'Input',
  textarea: 'Textarea',
  senha: 'PasswordInput',
  numero: 'NumberInput',
  moeda: 'MoneyInput',
  busca: 'SearchField',
  slider: 'Slider',
  'seletor-cor': 'ColorPicker',
  codigo: 'VerificationCode',
  links: 'LinkAction',
  'grupo-botoes': 'Button, ActionMenu',
  'acoes-linha': 'IconButton, ActionMenu',
  select: 'Select',
  combobox: 'Combobox',
  multiselect: 'Combobox',
  checkbox: 'Checkbox',
  switch: 'Switch, SwitchField',
  calendario: 'DateInput, MonthCalendar',
  tabs: 'Tabs',
  breadcrumbs: 'Breadcrumbs',
  tabela: 'DataTable, Status, Tag, ActionMenu, Dialog',
  'barra-filtros': 'DataTable, Status, Tag, ActionMenu, Dialog',
  'data-table': 'DataTable, Status, Tag, ActionMenu, Dialog',
  badge: 'Status',
  tags: 'Tag, Combobox',
  alerta: 'InlineAlert',
  banner: 'InlineAlert',
  'estado-vazio': 'EmptyState',
  'estado-erro': 'EmptyState, InlineAlert',
  toast: 'ToastCard, ToastViewport, useToast',
  modal: 'Dialog',
  confirmacao: 'Dialog',
  drawer: 'Dialog',
  'bottom-sheet': 'Dialog',
  'dialogo-responsivo': 'Dialog',
  popover: 'Popover',
  tooltip: 'Tooltip',
  'hover-card': 'Popover',
  validacao: 'useFormValidation',
  avatar: 'Avatar, AvatarGroup, ActionMenu',
  stepper: 'Stepper',
  timeline: 'Timeline',
  upload: 'FileDropzone, FileItem',
  anexo: 'FileItem',
};
export function itemKind(item: CatalogItem) {
  return item.groupId === 'fundamentos'
    ? 'Fundamento'
    : publicComponents[item.id]
      ? 'Componente'
      : item.groupId === 'templates'
        ? 'Template'
        : 'Composição';
}
export const familyGuides: Record<
  string,
  { usage: string; keyboard: string; states: string; avoid: string }
> = {
  fundamentos: {
    usage: 'Use os tokens do tema. Inter 400, 500 e 600 sustentam a hierarquia aprovada.',
    keyboard: 'O foco precisa permanecer visível em qualquer composição.',
    states: 'Contraste, leitura, densidade e adaptação ao celular.',
    avoid: 'Novos pesos, tons e raios para resolver casos que já têm um papel definido.',
  },
  acoes: {
    usage: 'Uma ação principal por contexto. Rótulos começam com o verbo que descreve o resultado.',
    keyboard: 'Tab encontra a ação. Enter ou Espaço executam botões; Enter segue links.',
    states: 'Padrão, hover, foco, indisponível, carregamento e selecionado quando aplicável.',
    avoid: 'Ícones sem nome, ações destrutivas ambíguas e vários botões principais lado a lado.',
  },
  formularios: {
    usage:
      'Rótulo acima do campo. Orientação apenas quando ajuda a preencher; erro junto ao controle.',
    keyboard: 'Tab percorre campos. Seletores aceitam setas e Enter; Escape fecha a lista.',
    states: 'Vazio, preenchido, obrigatório, inválido, indisponível e leitura conforme o controle.',
    avoid: 'Placeholder como único rótulo, “T” decorativo e erro comunicado apenas por cor.',
  },
  navegacao: {
    usage: 'Mostre o contexto atual e preserve a orientação ao mudar de área ou portal.',
    keyboard: 'Links usam Enter. Abas aceitam setas, Home e End. Camadas fecham com Escape.',
    states: 'Atual, disponível, expandido, recolhido e limite de navegação.',
    avoid: 'Usar abas para jornadas independentes ou esconder a área ativa apenas em um ícone.',
  },
  estrutura: {
    usage:
      'Combine espaços e hierarquia antes de adicionar contornos. O conteúdo define a estrutura.',
    keyboard: 'Regiões com rolagem recebem foco. Acordeões funcionam com Enter e Espaço.',
    states: 'Conteúdo curto e longo, uma ou duas colunas, desktop e celular.',
    avoid:
      'Cartão dentro de cartão, divisórias em cada metadado e altura fixa para conteúdo variável.',
  },
  dados: {
    usage:
      'Escolha a organização pelo domínio: cadastros, históricos, campanhas e métricas têm densidades distintas.',
    keyboard:
      'Cabeçalhos ordenáveis são botões. Seleção tem nome próprio. A tabela rola dentro da região.',
    states: 'Dados, seleção, ordenação, filtros combinados e ausência de resultados.',
    avoid:
      'Agrupar por status todos os registros, misturar alinhamento numérico ou repetir cabeçalhos sem necessidade.',
  },
  graficos: {
    usage:
      'Escolha o gráfico pela pergunta. Identifique unidade, período e séries; mantenha a tabela de valores acessível.',
    keyboard: 'Botões de legenda alternam séries. Os valores não dependem do hover.',
    states: 'Dados, série oculta, carregamento, vazio e erro na página de estados.',
    avoid: 'Cor como única identificação, escalas sem unidade e efeitos que distorcem a leitura.',
  },
  feedback: {
    usage:
      'A mensagem explica o que aconteceu e a ação possível. Feedback persistente fica no contexto.',
    keyboard:
      'Ações e dispensa são alcançáveis por Tab. Avisos não capturam o foco sem necessidade.',
    states: 'Informação, sucesso, atenção, erro e recuperação.',
    avoid: 'Toasts enormes, avisos duplicados e mensagens vagas como “algo deu errado”.',
  },
  camadas: {
    usage:
      'Use popover para contexto curto, diálogo para decisão e painel lateral para detalhe mais longo.',
    keyboard: 'Diálogos mantêm o foco na camada. Escape fecha e restaura o foco ao gatilho.',
    states: 'Fechada, aberta, confirmação pendente e ação concluída.',
    avoid:
      'Modais empilhados, botões de fechamento sem nome e confirmação sem explicar a consequência.',
  },
  midia: {
    usage:
      'Mostre tipo, tamanho, proporção e ação do arquivo. Preserve o contexto quando a mídia não estiver disponível.',
    keyboard:
      'A seleção de arquivos também funciona por botão. Galeria tem anterior e próxima identificados.',
    states: 'Sem arquivo, selecionado, formato inválido e limite excedido.',
    avoid: 'Depender só de arrastar, abrir mídia sem descrição ou esconder limite de tamanho.',
  },
  padroes: {
    usage:
      'Componha os controles da biblioteca com o vocabulário do MediaOn. Regras de negócio ficam no consumidor.',
    keyboard:
      'Etapas têm ações explícitas. Leads podem mudar de coluna por seletor; edição não depende de arrastar.',
    states: 'Em edição, revisão, resultado e condições específicas de cada fluxo.',
    avoid: 'Apresentar a simulação local como persistência, aprovação, assinatura ou acesso real.',
  },
  templates: {
    usage:
      'Use a composição como ponto de partida para uma tela. Campos, ações e densidade seguem o objetivo da página.',
    keyboard:
      'Ordem de leitura acompanha a visual. Navegação, formulários e tabelas mantêm seus contratos.',
    states:
      'Estrutura preenchida com exemplos, ações locais e variações dos componentes que a compõem.',
    avoid: 'Copiar todas as seções de um template quando a tarefa do usuário exige uma tela menor.',
  },
};
export const specificGuides: Record<string, string> = {
  botoes:
    'Hierarquia principal, secundária, discreta, contextual e destrutiva. Três tamanhos, carregamento, seleção e confirmação no contexto de campanhas.',
  'grupo-botoes':
    'A ação principal permanece direta; alternativas relacionadas ficam em um menu compacto, com rótulos curtos e ícones reconhecíveis.',
  'acoes-linha':
    'Menus de três pontos mostram somente ícone e rótulo da ação. Setas percorrem os itens e Escape devolve o foco ao gatilho.',
  links:
    'Navegação com ícone funcional, hover e indicação de destino externo. Use âncoras reais para conservar os comportamentos do navegador.',
  galeria:
    'Biblioteca responsiva com cartões em camadas, seleção direta e prévia ampliada com painel de metadados. Busca, filtro e navegação preservam o contexto da campanha.',
  slider:
    'Trilho preenchido, valor atual em destaque e hierarquia clara entre título, limites e estimativa. O controle nativo preserva setas e limites por teclado.',
  campo:
    'O campo reúne rótulo, controle, ajuda opcional e erro. O contador fica próximo da entrada, sem competir com o valor.',
  input:
    'Nome de campanha usa texto simples. E-mail, telefone e URL usam o mesmo controle com tipo e teclado apropriados. Em pares de busca e filtro, input e select compartilham 38 px de altura e colunas equivalentes; no celular, ocupam a largura total.',
  numero:
    'Quantidade usa limites e incrementos explícitos. A largura acompanha até oito dígitos e a digitação respeita o teto de 99.999.999; não use máscara monetária para contagem.',
  moeda:
    'R$ acompanha imediatamente o preço em uma largura compacta. A digitação usa pt-BR, formata ao sair e produz valor numérico por parseMoney; o componente não calcula regras comerciais.',
  senha:
    'Mostrar e ocultar preserva o valor digitado. O exemplo não envia ou armazena credenciais.',
  combobox:
    'Adequado quando a lista precisa de busca. O exemplo mantém o foco no input e anuncia a opção ativa.',
  multiselect:
    'Seleções permanecem visíveis e podem ser removidas individualmente. Buscar não limpa o que já foi escolhido.',
  switch:
    'Alterna uma configuração imediatamente. Campanhas pendentes de aprovação continuam bloqueadas no adaptador do produto.',
  periodo:
    'Datas de início e fim formam uma única decisão em campos compactos, dimensionados para dd/mm/aaaa. Um fim anterior ao início bloqueia a aplicação.',
  'seletor-cor':
    'Amostras sugeridas e código hexadecimal compartilham a mesma seleção. A pinça usa uma superfície clara sobre a prévia da cor para manter contraste sem escurecer o controle.',
  codigo:
    'Código segmentado em seis dígitos, com colagem completa, avanço automático e navegação por teclado. O envio e o reenvio pertencem ao consumidor.',
  breadcrumbs:
    'Ancestrais discretos, página atual em destaque e separadores semânticos. Caminhos longos podem recolher níveis intermediários; use ícones apenas quando ajudam a reconhecer a área.',
  badge:
    'Use texto, tom e ícone para comunicar o estado. A variante suave funciona em listas e resumos; a variante com ponto preserva a leitura mais discreta em tabelas densas.',
  tags: 'Seleções múltiplas permanecem dentro do campo, podem ser removidas individualmente e não apagam o que já foi escolhido durante a busca.',
  tabela:
    'Históricos podem usar linhas compactas; cadastros com contexto secundário precisam de maior altura. Não agrupe tudo por status.',
  'barra-filtros':
    'Busca e filtros contextualizam a tabela. Estados usam Status, classificações usam Tag e cada linha usa ActionMenu; detalhes e confirmações abrem em Dialog.',
  'data-table':
    'DataTable cuida da estrutura, seleção e ordenação. O consumidor compõe estados com Status, classificações com Tag e ações por linha com ActionMenu e Dialog.',
  'acoes-lote':
    'A ação deixa claro quantos registros serão afetados. A seleção visível pode ser cancelada sem modificar os dados.',
  toast:
    'Largura de até 360 px, padding de 12 px e ícone de 30 px. Avisos simples duram 6 s; erro, atenção e ação exigem dispensa.',
  alerta:
    'Alertas variam por local: inline acompanha uma ação, section substitui ou explica uma região e banner comunica algo persistente no fluxo. O tom de erro sempre traz causa e recuperação.',
  'estado-vazio':
    'Primeiro uso ocupa a página e orienta a criação; lista vazia explica o recorte; busca sem resultado permanece compacta dentro da tabela e oferece limpeza dos filtros.',
  'estado-erro':
    'Falhas locais usam InlineAlert, falhas de seção preservam o contexto ao redor e falhas que impedem a página usam EmptyState com tentativa, saída segura e código de referência.',
  confirmacao:
    'Uma ação destrutiva pede contexto e verbo explícito. Digitação de confirmação só faz sentido para consequências relevantes.',
  'hover-card':
    'Nesta revisão, a prévia abre por clique ou teclado em Popover; abertura apenas por hover não está implementada.',
  'menu-contexto':
    'O exemplo usa uma camada de ações acessível, aberta por botão direito, Shift + F10 ou botão visível. Posicionamento no cursor ainda não faz parte desta composição.',
  temas:
    'O tema claro azul é a referência aprovada. A marca aparece em uma prévia sem molduras decorativas; superfície, espaço e profundidade organizam o conteúdo. Tema escuro ainda precisa de revisão própria.',
  'grafico-legenda':
    'As séries podem ser desligadas e os valores têm alternativa em tabela. O hover mostra informações nativas do SVG.',
  'importar-exportar':
    'Amostra CSV simples com mapeamento e download local. Parsing completo, importação e validação de negócio não fazem parte desta prévia.',
  video:
    'Player local de MP4 ou WebM até 50 MB com frame 16:9, contexto de revisão, metadados e painel lateral para envio, download e remoção. URLs temporárias são liberadas ao trocar ou remover o arquivo. Legendas de produção dependem do arquivo final.',
  upload:
    'Seleção múltipla e arraste, até 10 MB por arquivo. A fila valida formato, mostra progresso, conclusão, cancelamento e retomada. Prévia e seleção usam modal médio, com metadados no corpo e ações no rodapé. O avanço é uma simulação manual; não envia arquivos.',
  avatar:
    'Iniciais, fotografia com fallback, ícone, forma quadrada, presença, verificação, notificações, carregamento e grupos. O gatilho de conta preserva respiro ao redor do avatar, nome e chevron. Use no máximo um sinal de estado por avatar.',
  stepper:
    'Etapas horizontais para jornadas curtas e verticais ao lado do formulário. O passo atual tem aria-current; passos concluídos podem permitir retorno sem perder os dados.',
  timeline:
    'Marcos cronológicos usam ícones, conector e estados concluído, atual ou futuro. Data, título, descrição e autoria permanecem separados para facilitar a leitura e a adaptação ao celular.',
  kanban:
    'Colunas com contagem e valor; cards mostram empresa, contato, origem, atividade e responsáveis. Mova por arraste ou pelo menu acessível, filtre e adicione oportunidades locais.',
  'card-lead':
    'O título abre o detalhe; o menu concentra as mudanças de etapa. Metadados ficam no rodapé, com rótulos acessíveis. O mesmo card é usado no quadro.',
  wizard:
    'Etapas laterais, validação e seleção visual. A revisão reúne período, capacidade e preço por mídia, total do plano e edição por seção sem perder o preenchimento. O envio final é apenas local.',
  calendario:
    'Calendário mensal com dias sinalizados, navegação por teclado e eventos por mês ou dia. A agenda compõe o controle com criação e edição local de eventos, validação de horário e participantes. O formulário usa contraste reforçado e superfícies frias para separar os grupos sem pesar a interface.',
  drawer:
    'Painel ampliado para detalhes com histórico. Informações e ações ficam à direita; atividades ficam à esquerda e se empilham no celular. Escape fecha e devolve o foco.',
  banner:
    'Um aviso junto ao fluxo, com revisão de prazo em modal. Cancelar mantém a data anterior; salvar atualiza somente a demonstração.',
  planos:
    'Comparação mensal/anual com benefícios, total do período e revisão da seleção. Preços fictícios; a confirmação não contrata nem cobra.',
  'template-configuracoes':
    'Seções com explicação à esquerda e controles à direita. Empresa, aparência e notificações compartilham rascunho, salvar e descartar. Equipe e mapeamento de grupos usam exemplos locais próprios.',
  privacidade:
    'Escolha visual de aviso, idioma e métricas opcionais. Prévia sem cookies, consentimento real ou texto jurídico definitivo.',
  membros:
    'Identidade e papel ficam na linha principal. Pendências têm faixa contextual e ação específica. Convites por múltiplos e-mails validam endereços, duplicatas e lugares disponíveis. Link demonstrativo copiável, sem concessão real de acesso.',
  modal:
    'Cabeçalho traz título, contexto e fechamento; o corpo concentra a tarefa; o rodapé reúne ações. Use small para confirmação breve, default para formulários curtos, medium para upload ou prévia e wide para conteúdo comparativo. Escape fecha e devolve o foco.',
  'template-dashboard':
    'Checklist de preparação com progresso por tarefa e grupos recolhíveis. Exemplifica onboarding do portal sem executar integrações, convites ou publicação.',
};
export const snippets: Record<string, string> = {
  calendario:
    '<MonthCalendar selected={date} onSelect={setDate}\n  month={month} onMonthChange={setMonth}\n  eventDates={eventDates} />',
  alerta:
    '<InlineAlert title="Confira o prazo" tone="warning"\n  onDismiss={dismiss} actions={<Button onClick={review}>Revisar</Button>}>\n  A entrega vence amanhã.\n</InlineAlert>',
  banner:
    '<InlineAlert title="Revise a reserva" actions={actions}>\n  O pedido ainda aguarda aprovação.\n</InlineAlert>',
  'estado-vazio':
    '<EmptyState placement="table" icon={SearchX}\n  title="Nenhum resultado" description="Revise sua busca."\n  actions={<Button>Limpar filtros</Button>} />',
  'estado-erro':
    '<InlineAlert tone="error" placement="section"\n  title="Não foi possível atualizar" actions={<Button>Tentar novamente</Button>}>\n  Seus filtros foram preservados.\n</InlineAlert>',

  avatar:
    '<Avatar name="Ana Lima" size={32} presence="online" />\n<AvatarGroup people={responsaveis} max={3} />',
  stepper:
    '<Stepper current={step} orientation="vertical"\n  steps={[{ label: "Informações" }, { label: "Mídias" }, { label: "Revisão" }]}\n  onStepChange={setStep} />',
  timeline:
    '<Timeline label="Histórico da campanha"\n  items={[\n    { title: "Campanha criada", date: "29 set, 15:55", state: "complete" },\n    { title: "Em revisão", date: "Hoje, 09:40", state: "current" },\n  ]}\n/>',
  upload:
    '<FileDropzone accept=".png,.jpg,.pdf"\n  hint="Até 10 MB por arquivo" onFiles={validateFiles} />\n<FileItem name={file.name} size={file.size}\n  status="uploading" progress={42} onCancel={cancel} />',
  anexo: '<FileItem name="briefing.pdf" size={245760}\n  status="complete" onRemove={remove} />',
  botoes: '<Button variant="primary" loading={saving}>\n  Salvar rascunho\n</Button>',
  input:
    '<FormField id="name" label="Nome da campanha">\n  <Input id="name" value={name}\n    onChange={e => setName(e.target.value)}\n    error={errors.name} />\n</FormField>',
  campo:
    '<FormField id="name" label="Nome" required\n  hint="Use um nome fácil de encontrar.">\n  <Input id="name" required\n    aria-describedby="name-hint" />\n</FormField>',
  select:
    '<Select label="Portal" value={portal}\n  onValueChange={setPortal}\n  options={[{ value: "francal", label: "Francal 2026" }]} />',
  combobox:
    '<Combobox label="Selecionar portal"\n  options={portals} value={selected}\n  onChange={setSelected} />',
  multiselect:
    '<Combobox label="Selecionar portais" multiple\n  options={portals} value={selected}\n  onChange={setSelected} />',
  switch:
    '<Switch label="Veiculação" checked={enabled}\n  onCheckedChange={setEnabled} disabled={pending} />',
  breadcrumbs:
    '<Breadcrumbs maxItems={4}\n  items={[\n    { label: "Portal Francal", href: "/portal" },\n    { label: "Campanhas", href: "/campanhas" },\n    { label: "Lançamento primavera" },\n  ]}\n/>',
  badge: '<Status value="Em revisão" tone="amber"\n  icon={Clock3} variant="soft" />',
  tags: '<Combobox multiple label="Classificações"\n  value={tags} onChange={setTags}\n  options={classificacoes} />',
  senha: '<PasswordInput id="password"\n  autoComplete="new-password" />',
  modal:
    '<Dialog size="medium" open={open}\n  onClose={() => setOpen(false)}\n  title="Adicionar arquivos" description="Criativos da campanha"\n  footer={actions}>\n  {content}\n</Dialog>',
  drawer:
    '<Dialog kind="drawer" size="wide" open={open}\n  onClose={() => setOpen(false)} title="Campanha">\n  {details}\n</Dialog>',
  toast:
    'const { toast, notify, dismiss } = useToast();\nnotify({ variant: "success", message: "Campanha salva." });\n<ToastViewport toast={toast} dismiss={dismiss} />',
  tabela:
    '<DataTable label="Campanhas" rows={campaigns}\n  columns={columns} rowKey={row => row.id}\n  density="comfortable" sort={sort} onSort={setSort} />',
};
