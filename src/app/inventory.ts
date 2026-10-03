/**
 * Inventário de produção do Design System v2, não um registro de componentes prontos.
 * Base: packages/ui, telas de apps/web e blocos públicos de apps/vitrine.
 * As entradas consolidam variações do legado e reservam padrões a desenhar.
 * Nenhuma implementação ou regra de negócio do produto é importada aqui.
 */
export interface InventoryItem {
  id: string;
  label: string;
  scope: string;
  keywords: string;
}

export interface InventoryGroup {
  id: string;
  label: string;
  items: readonly InventoryItem[];
}

const item = (id: string, label: string, scope: string, keywords = ''): InventoryItem => ({
  id,
  label,
  scope,
  keywords,
});

export const inventory: readonly InventoryGroup[] = [
  {
    id: 'fundamentos',
    label: 'Fundamentos',
    items: [
      item(
        'principios',
        'Princípios de design',
        'Direção visual, hierarquia, consistência e critérios para aprovar a biblioteca.',
      ),
      item(
        'cores',
        'Cores',
        'Paleta, cores semânticas, contraste e uso de cor por estado.',
        'palette tokens',
      ),
      item(
        'tipografia',
        'Tipografia',
        'Famílias, pesos, tamanhos, entrelinhas e hierarquia de texto.',
        'fontes texto',
      ),
      item(
        'espacamento',
        'Espaçamento',
        'Escala de distâncias, alinhamentos e densidade das interfaces.',
        'spacing tokens',
      ),
      item(
        'grid',
        'Grid e breakpoints',
        'Colunas, containers, larguras e adaptação a diferentes tamanhos de tela.',
        'responsivo mobile',
      ),
      item(
        'bordas',
        'Bordas e raios',
        'Espessuras, contornos e arredondamento dos elementos.',
        'radius tokens',
      ),
      item(
        'elevacao',
        'Sombras e camadas',
        'Elevação de superfícies e ordem de sobreposição.',
        'shadow z-index',
      ),
      item('iconografia', 'Iconografia', 'Família de ícones, tamanhos, traços e uso com texto.'),
      item(
        'movimento',
        'Movimento',
        'Transições, duração, animação funcional e movimento reduzido.',
        'motion animation',
      ),
      item(
        'temas',
        'Temas e white-label',
        'Tema claro, escuro e adaptação visual da marca de cada portal.',
        'branding dark tokens',
      ),
      item(
        'acessibilidade',
        'Acessibilidade',
        'Foco, teclado, leitores de tela, contraste e áreas de interação.',
        'a11y',
      ),
      item(
        'conteudo',
        'Linguagem e formatação',
        'Rótulos, mensagens, datas, valores, unidades e tom de voz.',
        'microcopy moeda',
      ),
    ],
  },
  {
    id: 'acoes',
    label: 'Botões e ações',
    items: [
      item(
        'botoes',
        'Botão',
        'Hierarquias, tamanhos, ícones e estados de interação, carregamento e desabilitado.',
        'button',
      ),
      item(
        'botao-icone',
        'Botão de ícone',
        'Ações compactas com nome acessível e dica contextual.',
        'icon button',
      ),
      item(
        'grupo-botoes',
        'Grupo de botões',
        'Ações relacionadas, ação principal com opções e segmentos.',
        'button group split',
      ),
      item('links', 'Link', 'Navegação textual, links externos e estados de visita e foco.'),
      item(
        'toggle',
        'Toggle',
        'Ações alternáveis, seleção única ou múltipla e grupos de alternância.',
      ),
      item(
        'acoes-linha',
        'Ações de linha',
        'Editar, duplicar, arquivar e excluir em listagens.',
        'row action',
      ),
    ],
  },
  {
    id: 'formularios',
    label: 'Formulários',
    items: [
      item(
        'campo',
        'Anatomia de campo',
        'Rótulo, indicação de obrigatório, ajuda, erro e contagem de caracteres.',
        'label form field',
      ),
      item(
        'input',
        'Campo de texto',
        'Texto, e-mail, telefone, URL e variações com prefixo e sufixo.',
        'input',
      ),
      item(
        'textarea',
        'Área de texto',
        'Entrada multilinha, tamanho e limites de conteúdo.',
        'textarea',
      ),
      item(
        'senha',
        'Campo de senha',
        'Mostrar e ocultar senha, requisitos e orientação de preenchimento.',
        'password',
      ),
      item(
        'numero',
        'Campo numérico',
        'Quantidades, percentuais, decimais, limites e incrementos.',
        'number stepper',
      ),
      item(
        'moeda',
        'Campo monetário',
        'Valores em reais, máscara, edição e leitura de preço.',
        'currency input',
      ),
      item('busca', 'Campo de busca', 'Busca, limpeza do termo e estados de resultado.', 'search'),
      item(
        'select',
        'Seleção simples',
        'Escolha de uma opção, placeholder e opção indisponível.',
        'select native',
      ),
      item(
        'combobox',
        'Seleção com busca',
        'Lista pesquisável, seleção e ausência de opções.',
        'combobox autocomplete',
      ),
      item(
        'multiselect',
        'Seleção múltipla',
        'Escolha de várias opções e remoção de seleções.',
        'multi select',
      ),
      item(
        'checkbox',
        'Checkbox',
        'Escolha independente, grupos e estado parcialmente selecionado.',
      ),
      item('radio', 'Radio', 'Escolha exclusiva entre opções visíveis.', 'radio group'),
      item('switch', 'Switch', 'Ativar e desativar uma preferência.'),
      item(
        'slider',
        'Slider',
        'Seleção de um valor ou intervalo por controle deslizante.',
        'range',
      ),
      item(
        'calendario',
        'Calendário e data',
        'Agenda com eventos, entrada de data e navegação mensal.',
        'date picker agenda eventos participantes',
      ),
      item(
        'periodo',
        'Período e horário',
        'Intervalos de datas, início, término e entrada de horário.',
        'date range time',
      ),
      item(
        'seletor-cor',
        'Seletor de cor',
        'Escolha de cores e entrada hexadecimal para personalização.',
        'color picker branding',
      ),
      item(
        'codigo',
        'Código de verificação',
        'Entrada segmentada, colagem e estados de código.',
        'otp input',
      ),
      item(
        'validacao',
        'Validação de formulário',
        'Erros por campo, resumo de erros e confirmação visual do envio.',
        'form validation',
      ),
    ],
  },
  {
    id: 'navegacao',
    label: 'Navegação',
    items: [
      item(
        'sidebar',
        'Menu lateral',
        'Grupos, subitens, estado ativo e navegação expandida ou recolhida.',
        'sidebar',
      ),
      item(
        'cabecalho-app',
        'Cabeçalho do aplicativo',
        'Contexto do portal, identidade, acesso à conta e notificações.',
        'header topbar',
      ),
      item('breadcrumbs', 'Breadcrumbs', 'Localização e retorno entre níveis da aplicação.'),
      item('tabs', 'Abas', 'Alternância entre seções de uma mesma página.', 'tabs'),
      item(
        'paginacao',
        'Paginação',
        'Página atual, anterior, próxima e quantidade por página.',
        'pagination',
      ),
      item(
        'stepper',
        'Etapas e progresso',
        'Etapa atual, concluída, bloqueada e navegação entre passos.',
        'stepper',
      ),
      item(
        'menu-dropdown',
        'Menu de opções',
        'Ações agrupadas em menu suspenso.',
        'dropdown menubar',
      ),
      item(
        'menu-contexto',
        'Menu de contexto',
        'Ações sobre um item com suporte a teclado.',
        'context menu',
      ),
      item('comandos', 'Paleta de comandos', 'Busca rápida de destinos e ações.', 'command'),
      item(
        'troca-portal',
        'Seletor de portal',
        'Troca visual entre portais e identificação do contexto atual.',
      ),
    ],
  },
  {
    id: 'estrutura',
    label: 'Estrutura e conteúdo',
    items: [
      item(
        'shell',
        'Estrutura de aplicação',
        'Composição do menu, cabeçalho e área principal.',
        'app shell layout',
      ),
      item(
        'cabecalho-pagina',
        'Cabeçalho de página',
        'Título, descrição, contexto e ações da página.',
        'page header',
      ),
      item('card', 'Card', 'Superfície com cabeçalho, conteúdo, ações e variações de densidade.'),
      item(
        'secoes',
        'Seções e painéis',
        'Agrupamento de conteúdo, cabeçalhos de seção e divisões internas.',
        'section band panel',
      ),
      item(
        'accordion',
        'Accordion e expansão',
        'Conteúdo recolhível em uma ou várias seções.',
        'collapsible',
      ),
      item('separador', 'Separador', 'Divisão horizontal e vertical entre blocos.', 'separator'),
      item(
        'scroll',
        'Área de rolagem',
        'Regiões com rolagem própria e indicação de conteúdo excedente.',
        'scroll area',
      ),
      item(
        'paineis',
        'Painéis redimensionáveis',
        'Divisão de áreas com ajuste acessível de largura.',
        'resizable',
      ),
      item(
        'descricao',
        'Lista de informações',
        'Pares de rótulo e valor, metadados e leitura de detalhes.',
        'description list',
      ),
    ],
  },
  {
    id: 'dados',
    label: 'Dados e tabelas',
    items: [
      item('tabela', 'Tabela', 'Cabeçalhos, células, alinhamentos e densidade.', 'table'),
      item(
        'data-table',
        'Tabela de dados',
        'Ordenação, seleção, paginação e configuração de colunas.',
        'data table',
      ),
      item(
        'barra-filtros',
        'Barra de filtros',
        'Busca, filtros combinados, período e limpeza de critérios.',
        'toolbar filter',
      ),
      item(
        'filtros-ativos',
        'Filtros ativos',
        'Pílulas selecionadas, contadores e remoção de filtros.',
        'filter pill chip',
      ),
      item(
        'acoes-lote',
        'Seleção e ações em lote',
        'Contagem da seleção e ações para vários registros.',
        'bulk actions',
      ),
      item(
        'lista',
        'Lista e item de lista',
        'Linhas com ícone, título, descrição, metadados e ações.',
      ),
      item(
        'badge',
        'Badge e status',
        'Estados de campanhas, pedidos e outros registros.',
        'badge status',
      ),
      item('tags', 'Tags', 'Etiquetas, categorias, cores e remoção.', 'tag chip'),
      item(
        'kpi',
        'Indicadores e KPI',
        'Valor, unidade, comparação e indisponibilidade de métricas.',
        'stat metric',
      ),
      item(
        'timeline',
        'Linha do tempo',
        'Histórico de eventos, autoria, data e registros de atividade.',
        'timeline',
      ),
    ],
  },
  {
    id: 'graficos',
    label: 'Gráficos',
    items: [
      item(
        'grafico-barras',
        'Barras e colunas',
        'Comparação entre categorias, na horizontal ou vertical.',
        'bar chart',
      ),
      item(
        'grafico-linhas',
        'Linhas',
        'Evolução de métricas e comparação de séries ao longo do tempo.',
        'line chart',
      ),
      item('grafico-area', 'Área', 'Volume e evolução acumulada no período.', 'area chart'),
      item(
        'grafico-rosca',
        'Pizza e rosca',
        'Distribuição de um total entre categorias.',
        'pie donut chart',
      ),
      item(
        'grafico-empilhado',
        'Barras empilhadas',
        'Composição e proporção de categorias por período.',
        'stacked chart',
      ),
      item('grafico-funil', 'Funil', 'Volume e conversão entre etapas comerciais.', 'funnel chart'),
      item(
        'grafico-sankey',
        'Sankey',
        'Fluxos entre origens, etapas e destinos, com o volume de cada caminho.',
        'sankey diagram flow',
      ),
      item(
        'grafico-legenda',
        'Legendas e tooltips',
        'Identificação das séries, valores e contexto ao explorar dados.',
      ),
      item('grafico-eixos', 'Eixos e formatação', 'Escalas, unidades, datas, moeda e rótulos.'),
      item(
        'grafico-estados',
        'Estados dos gráficos',
        'Carregamento, ausência de dados, erro e adaptação de tamanho.',
      ),
    ],
  },
  {
    id: 'feedback',
    label: 'Feedback e estados',
    items: [
      item('alerta', 'Alerta', 'Informação, sucesso, atenção e erro dentro da página.', 'alert'),
      item(
        'toast',
        'Toast',
        'Feedback temporário após uma ação, com ou sem desfazer.',
        'sonner notification',
      ),
      item('banner', 'Banner de aviso', 'Comunicados persistentes e avisos que exigem atenção.'),
      item('progresso', 'Barra de progresso', 'Andamento de etapas e operações.', 'progress'),
      item(
        'spinner',
        'Indicador de carregamento',
        'Espera localizada em ações e regiões da interface.',
        'loading spinner',
      ),
      item('skeleton', 'Skeleton', 'Estrutura visual provisória durante o carregamento.'),
      item(
        'estado-vazio',
        'Estado vazio',
        'Primeiro uso, lista vazia e ausência de resultados.',
        'empty state',
      ),
      item(
        'estado-erro',
        'Estado de erro',
        'Falha de carregamento, orientação e tentativa novamente.',
        'error state',
      ),
      item(
        'estados-acesso',
        'Estados de acesso',
        'Apresentação de acesso restrito, sessão expirada e página não encontrada.',
        '403 404',
      ),
      item('notificacao', 'Item de notificação', 'Aviso lido ou não lido, data, contexto e ação.'),
    ],
  },
  {
    id: 'camadas',
    label: 'Modais e camadas',
    items: [
      item(
        'modal',
        'Modal',
        'Janela de diálogo, tamanhos, conteúdo, rodapé e fechamento.',
        'dialog',
      ),
      item(
        'confirmacao',
        'Confirmação de ação',
        'Confirmações comuns, destrutivas e com digitação de segurança.',
        'alert dialog confirm',
      ),
      item('drawer', 'Painel lateral', 'Detalhes ou edição em uma gaveta lateral.', 'drawer sheet'),
      item(
        'bottom-sheet',
        'Gaveta inferior',
        'Conteúdo e ações em uma camada adaptada ao celular.',
        'bottom sheet',
      ),
      item(
        'dialogo-responsivo',
        'Diálogo responsivo',
        'Adaptação do mesmo diálogo entre desktop e celular.',
        'responsive dialog',
      ),
      item('popover', 'Popover', 'Conteúdo contextual próximo ao elemento que o abriu.'),
      item('tooltip', 'Tooltip', 'Ajuda curta associada a um controle com mouse e teclado.'),
      item(
        'hover-card',
        'Prévia contextual',
        'Resumo de uma entidade antes de abrir seus detalhes.',
        'hover card',
      ),
    ],
  },
  {
    id: 'midia',
    label: 'Mídia e arquivos',
    items: [
      item('avatar', 'Avatar', 'Pessoas e empresas com foto, iniciais e fallback.'),
      item(
        'marca',
        'Marca e assinatura',
        'Logo, assinatura da plataforma e composição com marca do portal.',
        'branding cobrand',
      ),
      item(
        'imagem',
        'Imagem e proporção',
        'Enquadramento, descrição acessível e imagem indisponível.',
        'aspect ratio',
      ),
      item(
        'galeria',
        'Galeria e carrossel',
        'Navegação entre imagens e peças de mídia.',
        'carousel',
      ),
      item(
        'upload',
        'Upload de arquivo',
        'Seleção, arrastar arquivos, prévia, progresso e validação visual.',
        'dropzone',
      ),
      item(
        'anexo',
        'Anexo e prévia',
        'Identificação de arquivo, tamanho, tipo e ações de download.',
      ),
      item('video', 'Vídeo', 'Apresentação e controles para conteúdo audiovisual.'),
    ],
  },
  {
    id: 'padroes',
    label: 'Padrões do MediaOn',
    items: [
      item(
        'wizard',
        'Assistente de cadastro',
        'Fluxos em etapas, revisão, resumo e confirmação.',
        'wizard campanha ativo',
      ),
      item(
        'formulario-dinamico',
        'Formulário dinâmico',
        'Composição visual de campos de ativos e briefings.',
      ),
      item(
        'kanban',
        'Quadro kanban',
        'Colunas, contagem, movimentação e leitura das etapas.',
        'leads drag drop',
      ),
      item(
        'card-lead',
        'Card de lead',
        'Contato, origem, responsável, etiquetas e tempo na etapa.',
      ),
      item(
        'detalhe-lead',
        'Detalhe de lead',
        'Dados de contato, atividades e histórico em painel.',
      ),
      item(
        'registro-atividade',
        'Registro de atividade',
        'Apresentação de contato realizado, notas e próxima ação.',
      ),
      item(
        'ativo-midia',
        'Card de mídia e pacote',
        'Formato, canal, público, disponibilidade e preço no catálogo.',
      ),
      item(
        'disponibilidade',
        'Disponibilidade e reserva',
        'Leitura visual de capacidade, período e motivo de bloqueio.',
      ),
      item(
        'resumo-campanha',
        'Resumo de campanha',
        'Status, período, ativos selecionados e valores.',
      ),
      item(
        'pedido-insercao',
        'Pedido de inserção',
        'Resumo comercial, itens, totais e estados de assinatura.',
        'PI pedido',
      ),
      item(
        'aprovacao',
        'Revisão e aprovação',
        'Estados visuais de envio, ajustes, aprovação e rejeição.',
      ),
      item('preco-bonus', 'Preço, desconto e bônus', 'Composição de valores, benefícios e totais.'),
      item(
        'importar-exportar',
        'Importação e exportação',
        'Passos de arquivo, mapeamento, prévia e estado da operação.',
        'csv',
      ),
      item(
        'membros',
        'Membros e permissões',
        'Apresentação de participantes, papéis e opções de acesso.',
      ),
      item(
        'editor-vitrine',
        'Editor de blocos',
        'Organização visual dos blocos, edição e prévia da Vitrine.',
      ),
      item(
        'produto-vitrine',
        'Expositor e produto',
        'Cabeçalho da marca, informações do produto e ações de conversão.',
      ),
      item(
        'planos',
        'Planos e benefícios',
        'Comparação de ofertas, benefícios e estado de assinatura.',
        'tier',
      ),
      item(
        'privacidade',
        'Preferências e consentimento',
        'Avisos de privacidade e escolhas de comunicação e rastreamento.',
      ),
    ],
  },
  {
    id: 'templates',
    label: 'Templates de página',
    items: [
      item(
        'template-acesso',
        'Acesso e autenticação',
        'Estrutura visual para login, convite e recuperação de senha.',
      ),
      item('template-dashboard', 'Dashboard', 'Composição de indicadores, gráficos e atividades.'),
      item('template-listagem', 'Listagem', 'Cabeçalho, filtros, tabela, paginação e estados.'),
      item('template-detalhe', 'Detalhe', 'Resumo, abas, metadados, histórico e ações.'),
      item(
        'template-cadastro',
        'Cadastro e edição',
        'Formulário, seções, ações e revisão de alterações.',
      ),
      item(
        'template-configuracoes',
        'Configurações',
        'Navegação de preferências, seções e áreas de edição.',
      ),
      item('template-catalogo', 'Catálogo', 'Busca, categorias, grade de ofertas e detalhes.'),
      item(
        'template-vitrine',
        'Vitrine pública',
        'Estrutura de página da marca, produto e conversão.',
      ),
    ],
  },
];

export const inventoryCount = inventory.reduce((total, group) => total + group.items.length, 0);

export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
