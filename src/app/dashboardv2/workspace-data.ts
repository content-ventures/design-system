import {
  Activity,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  CircleDollarSign,
  Database,
  FileInput,
  FileText,
  Gift,
  Globe,
  Image,
  Kanban,
  LayoutDashboard,
  LifeBuoy,
  Mail,
  Megaphone,
  Package,
  Radio,
  Settings,
  Shield,
  ShoppingBag,
  Tags,
  Table2,
  Target,
  UsersRound,
  Webhook,
  type LucideIcon,
} from 'lucide-react';
import { inventoryAssets } from './inventory-data';

// Somente estrutura e exemplos locais. Nenhuma importação ou acesso ao produto oficial.
export type DemoRecord = {
  id: string;
  name: string;
  status: string;
  [key: string]: string | number;
};
export type Field = {
  key: string;
  label: string;
  type?: 'number' | 'currency' | 'email' | 'date' | 'textarea';
  options?: string[];
  hidden?: boolean;
};
export type ScreenDefinition = {
  title: string;
  description: string;
  icon: LucideIcon;
  source: string;
  fields: Field[];
  records: DemoRecord[];
  create?: string;
  readonly?: boolean;
  kind?:
    | 'overview'
    | 'campaigns'
    | 'leads'
    | 'settings'
    | 'brand'
    | 'analytics'
    | 'catalog'
    | 'vitrine'
    | 'tables'
    | 'toasts';
};
const f = (key: string, label: string, type?: Field['type'], options?: string[]): Field => ({
  key,
  label,
  type,
  options,
});
const name = f('name', 'Nome');
const status = f('status', 'Status', undefined, ['Ativo', 'Rascunho', 'Arquivado']);
const fieldRows = (prefix: string, fields: Field[], values: (string | number)[][]): DemoRecord[] =>
  values.map((values, index) => ({
    id: `${prefix}-${index + 1}`,
    name: '',
    status: 'Ativo',
    ...Object.fromEntries(fields.map((field, i) => [field.key, values[i] ?? '—'])),
  }));
function table(
  title: string,
  description: string,
  icon: LucideIcon,
  source: string,
  fields: Field[],
  values: (string | number)[][],
  extra: Partial<ScreenDefinition> = {},
): ScreenDefinition {
  return {
    title,
    description,
    icon,
    source,
    fields,
    records: fieldRows(source.replaceAll('/', '-'), fields, values),
    ...extra,
  };
}
const audienceFields = [
  name,
  f('category', 'Categoria', undefined, ['Digital', 'Presencial', 'Híbrido']),
  f('size', 'Tamanho da base', 'number'),
  f('origin', 'Origem', undefined, ['Credenciamento CDP', 'Base própria', 'Importação']),
  f('assets', 'Ativos vinculados', 'number'),
  status,
];
const channelFields = [
  name,
  f('category', 'Categoria', undefined, ['Digital', 'Presencial']),
  f('assets', 'Ativos', 'number'),
  f('metrics', 'Métricas elegíveis'),
  status,
];
const metricFields = [
  name,
  f('valueType', 'Tipo de valor', undefined, ['Inteiro', 'Percentual', 'Monetário']),
  f('category', 'Categoria', undefined, ['Entrega', 'Engajamento', 'Conversão']),
  f('pricing', 'Precificação', undefined, ['Elegível', 'Não elegível']),
  f('visibility', 'Visível ao anunciante', undefined, ['Sim', 'Não']),
  status,
];
export const screens = {
  toasts: table(
    'Toasts',
    'Avisos de informação, sucesso, atenção e erro.',
    Bell,
    'toast-exploration',
    [],
    [],
    { kind: 'toasts', readonly: true },
  ),
  tabelas: table(
    'Explorar tabelas',
    'Os mesmos dados. Três maneiras de trabalhar com eles.',
    Table2,
    'table-exploration',
    [],
    [],
    { kind: 'tables', readonly: true },
  ),
  'visao-geral': table(
    'Dashboard',
    'Uma visão do seu portal, da disponibilidade aos resultados.',
    LayoutDashboard,
    'dashboard',
    [],
    [],
    { kind: 'overview' },
  ),
  campanhas: table(
    'Campanhas',
    'Todas as suas campanhas, em um só lugar.',
    Megaphone,
    'campaigns',
    [],
    [],
    { kind: 'campaigns', create: 'Nova campanha' },
  ),
  inventario: table(
    'Inventário',
    'Organize os ativos, seus públicos e a disponibilidade de mídia.',
    Boxes,
    'inventory',
    [
      name,
      f('format', 'Formato', undefined, ['Display', 'E-mail', 'Social']),
      f('channel', 'Canal'),
      f('audience', 'Público'),
      f('remaining', 'Disponível', 'number'),
      f('price', 'Preço-base', 'currency'),
      f('status', 'Disponibilidade', undefined, [
        'Disponível',
        'Parcialmente reservado',
        'Indisponível',
      ]),
    ],
    [],
    {
      create: 'Novo ativo',
      records: inventoryAssets.map((asset) => ({
        ...asset,
        channel:
          asset.format === 'E-mail'
            ? 'Newsletter Francal'
            : asset.format === 'Social'
              ? 'Redes sociais'
              : 'Portal Francal',
        audience: asset.format === 'E-mail' ? 'Comunidade de negócios' : 'Visitantes do portal',
        status: {
          available: 'Disponível',
          reserved: 'Parcialmente reservado',
          unavailable: 'Indisponível',
        }[asset.status],
      })),
    },
  ),
  publicos: table(
    'Públicos',
    'As pessoas que seus ativos alcançam e o estoque disponível por métrica.',
    UsersRound,
    'audiences',
    audienceFields,
    [
      ['Visitantes do portal', 'Digital', 85000, 'Base própria', 3, 'Ativo'],
      ['Comunidade de negócios', 'Digital', 42000, 'Base própria', 2, 'Ativo'],
      ['Credenciados · Francal 2026', 'Presencial', 18400, 'Credenciamento CDP', 4, 'Ativo'],
      ['Compradores e lojistas', 'Híbrido', 12600, 'Credenciamento CDP', 3, 'Ativo'],
      ['Arquitetura e design', 'Digital', 8200, 'Importação', 2, 'Rascunho'],
      ['Visitantes · Edição anterior', 'Presencial', 15700, 'Importação', 0, 'Arquivado'],
    ],
    { create: 'Novo público' },
  ),
  canais: table(
    'Canais',
    'Os pontos de contato que conectam marcas e públicos.',
    Radio,
    'channels',
    channelFields,
    [
      ['Portal Francal', 'Digital', 3, 'Impressões, cliques', 'Ativo'],
      ['Newsletter Francal', 'Digital', 2, 'Envios, aberturas', 'Ativo'],
      ['Redes sociais', 'Digital', 1, 'Alcance, engajamento', 'Ativo'],
      ['Mídia no evento', 'Presencial', 4, 'Exibições', 'Rascunho'],
    ],
    { create: 'Novo canal' },
  ),
  metricas: table(
    'Métricas',
    'Defina como medir a entrega, o engajamento e o valor da mídia.',
    BarChart3,
    'metrics',
    metricFields,
    [
      ['Impressões', 'Inteiro', 'Entrega', 'Elegível', 'Sim', 'Ativo'],
      ['Cliques', 'Inteiro', 'Engajamento', 'Elegível', 'Sim', 'Ativo'],
      ['Taxa de cliques', 'Percentual', 'Engajamento', 'Não elegível', 'Sim', 'Ativo'],
      ['Envios', 'Inteiro', 'Entrega', 'Elegível', 'Sim', 'Ativo'],
      ['Aberturas', 'Inteiro', 'Engajamento', 'Não elegível', 'Sim', 'Ativo'],
      ['Conversões', 'Inteiro', 'Conversão', 'Não elegível', 'Sim', 'Rascunho'],
    ],
    { create: 'Nova métrica' },
  ),
  bonus: table(
    'Bônus',
    'Regras e benefícios para valorizar cada contratação.',
    Gift,
    'bonus-rules',
    [
      name,
      f('criterion', 'Critério'),
      f('benefit', 'Benefício'),
      f('earned', 'Conquistas', 'number'),
      status,
    ],
    [
      [
        'Presença ampliada',
        'Contratação acima de R$ 15.000',
        '10.000 impressões adicionais',
        3,
        'Ativo',
      ],
      ['Conexão multicanal', 'Display + newsletter', '1 publicação em redes sociais', 2, 'Ativo'],
      [
        'Parceiro recorrente',
        '3 campanhas no período',
        'Destaque na próxima newsletter',
        0,
        'Rascunho',
      ],
    ],
    { create: 'Nova regra' },
  ),
  pedidos: table(
    'Pedidos de Inserção',
    'Acompanhe aprovações, assinaturas e prazos de cada P.I.',
    FileText,
    'orders',
    [
      name,
      f('advertiser', 'Anunciante'),
      f('campaign', 'Campanha'),
      f('value', 'Valor', 'currency'),
      f('deadline', 'Prazo', 'date'),
      f('status', 'Status', undefined, [
        'Aguardando aprovação',
        'Enviado',
        'Assinado',
        'Cancelado',
      ]),
    ],
    [
      [
        'PI-2026-0042',
        'Aurora',
        'Novas conexões, grandes negócios',
        18400,
        '2026-10-05',
        'Assinado',
      ],
      [
        'PI-2026-0043',
        'Estúdio Norte',
        'O próximo capítulo do design',
        12600,
        '2026-10-08',
        'Assinado',
      ],
      [
        'PI-2026-0044',
        'Grupo Horizonte',
        'Sua marca em primeiro plano',
        8200,
        '2026-10-02',
        'Aguardando aprovação',
      ],
      ['PI-2026-0045', 'Casa Forma', 'Design para novos encontros', 9500, '2026-10-03', 'Enviado'],
    ],
    { readonly: true },
  ),
  leads: table(
    'Leads',
    'Acompanhe cada oportunidade, do primeiro contato à conversão.',
    Kanban,
    'leads',
    [
      name,
      f('company', 'Empresa'),
      f('email', 'E-mail', 'email'),
      f('origin', 'Origem', undefined, ['Vitrine', 'Catálogo', 'Evento']),
      f('owner', 'Responsável'),
      f('status', 'Etapa', undefined, [
        'Novo',
        'Em Contato',
        'Qualificado',
        'Convertido',
        'Perdido',
      ]),
    ],
    [
      [
        'Marina Costa',
        'Casa Forma',
        'marina@example.invalid',
        'Vitrine',
        'Equipe comercial',
        'Novo',
      ],
      [
        'Pedro Lima',
        'Estúdio Norte',
        'pedro@example.invalid',
        'Evento',
        'Equipe comercial',
        'Novo',
      ],
      [
        'Ana Ribeiro',
        'Aurora',
        'ana@example.invalid',
        'Catálogo',
        'Equipe comercial',
        'Em Contato',
      ],
      [
        'Lucas Alves',
        'Grupo Horizonte',
        'lucas@example.invalid',
        'Vitrine',
        'Equipe comercial',
        'Qualificado',
      ],
      [
        'Beatriz Santos',
        'Ateliê Sul',
        'beatriz@example.invalid',
        'Evento',
        'Equipe comercial',
        'Convertido',
      ],
    ],
    { kind: 'leads', create: 'Novo lead' },
  ),
  fornecedores: table(
    'Fornecedores',
    'Organize os parceiros e os anunciantes de cada fornecedor.',
    Building2,
    'suppliers',
    [
      name,
      f('slug', 'Identificador'),
      f('advertisers', 'Anunciantes', 'number'),
      f('contact', 'Contato', 'email'),
      status,
    ],
    [
      ['Francal', 'francal', 6, 'midia@example.invalid', 'Ativo'],
      ['Conecta Mídia', 'conecta', 4, 'conecta@example.invalid', 'Ativo'],
      ['Estúdio Parceiro', 'estudio-parceiro', 2, 'estudio@example.invalid', 'Rascunho'],
    ],
    { create: 'Novo fornecedor' },
  ),
  empresa: table(
    'Empresa & Branding',
    'A identidade e as informações do seu portal.',
    Building2,
    'settings/company',
    [],
    [],
    { kind: 'brand' },
  ),
  categorias: table(
    'Categorias da Vitrine',
    'Organize os segmentos que conectam visitantes e expositores.',
    Tags,
    'settings/categories',
    [
      name,
      f('slug', 'Identificador'),
      f('sector', 'Setor'),
      f('brands', 'Marcas', 'number'),
      status,
    ],
    [
      ['Design e decoração', 'design-decoracao', 'Casa e interiores', 18, 'Ativo'],
      ['Moda e acessórios', 'moda-acessorios', 'Moda', 24, 'Ativo'],
      ['Tecnologia e serviços', 'tecnologia-servicos', 'Serviços', 12, 'Ativo'],
      ['Novos negócios', 'novos-negocios', 'Negócios', 0, 'Rascunho'],
    ],
    { create: 'Nova categoria' },
  ),
  auditoria: table(
    'Auditoria',
    'O histórico de atividades e alterações do portal.',
    Shield,
    'audit',
    [
      name,
      f('entity', 'Registro'),
      f('actor', 'Responsável'),
      f('date', 'Data'),
      f('status', 'Resultado'),
    ],
    [
      [
        'Campanha atualizada',
        'Novas conexões, grandes negócios',
        'Equipe de mídia',
        '2026-09-30T10:42:00-03:00',
        'Concluído',
      ],
      [
        'Público cadastrado',
        'Compradores e lojistas',
        'Equipe de mídia',
        '2026-09-30T09:18:00-03:00',
        'Concluído',
      ],
      [
        'P.I. emitido',
        'PI-2026-0044',
        'Equipe comercial',
        '2026-09-29T16:30:00-03:00',
        'Concluído',
      ],
    ],
    { readonly: true },
  ),
  operacoes: table(
    'Operações',
    'Pendências que precisam de atenção para manter tudo em dia.',
    Activity,
    'ops',
    [
      name,
      f('entity', 'Referência'),
      f('owner', 'Responsável'),
      f('deadline', 'Prazo'),
      f('status', 'Prioridade'),
    ],
    [
      [
        'P.I. aguardando aprovação',
        'PI-2026-0044 · Grupo Horizonte',
        'Equipe comercial',
        '2026-10-02',
        'Atenção',
      ],
      [
        'Assinatura pendente',
        'PI-2026-0045 · Casa Forma',
        'Equipe comercial',
        '2026-10-03',
        'Atenção',
      ],
      [
        'Atualizar métricas',
        'O próximo capítulo do design',
        'Equipe de mídia',
        '2026-09-30',
        'Em andamento',
      ],
    ],
    { readonly: true },
  ),
  configuracoes: table(
    'Configurações',
    'Equipe, preferências e notificações do portal.',
    Settings,
    'settings',
    [],
    [],
    { kind: 'settings' },
  ),
  pacotes: table(
    'Pacotes de mídia',
    'Combine ativos para criar ofertas completas.',
    Package,
    'packages',
    [
      name,
      f('assets', 'Ativos incluídos'),
      f('audience', 'Público'),
      f('price', 'Preço', 'currency'),
      status,
    ],
    [
      ['Presença essencial', 'Superbanner + newsletter', 'Comunidade de negócios', 8500, 'Ativo'],
      ['Conexão completa', 'Display + newsletter + social', 'Visitantes do portal', 14900, 'Ativo'],
      [
        'Destaque no evento',
        'Patrocínio + mídia presencial',
        'Credenciados · Francal 2026',
        22000,
        'Rascunho',
      ],
    ],
    { create: 'Novo pacote' },
  ),
  performance: table(
    'Performance',
    'Entregas e resultados das campanhas, por período.',
    BarChart3,
    'performance',
    [
      name,
      f('metric', 'Métrica'),
      f('value', 'Valor', 'number'),
      f('date', 'Data', 'date'),
      f('status', 'Origem'),
    ],
    [
      ['Novas conexões, grandes negócios', 'Impressões', 68400, '2026-09-30', 'Manual'],
      ['O próximo capítulo do design', 'Impressões', 42300, '2026-09-30', 'Manual'],
      ['Ideias que merecem ser vistas', 'Impressões', 32400, '2026-09-30', 'Manual'],
    ],
    { create: 'Lançar resultado' },
  ),
  'data-on': table(
    'DATA.ON',
    'Interesse, comportamento e intenção da sua audiência.',
    Database,
    'data-on',
    [
      name,
      f('profiles', 'Perfis interessados', 'number'),
      f('visits', 'Visitas', 'number'),
      f('conversions', 'Pedidos de contato', 'number'),
      f('status', 'Período'),
    ],
    [
      ['Design e decoração', 8200, 1340, 42, 'Últimos 30 dias'],
      ['Moda e acessórios', 12600, 2160, 67, 'Últimos 30 dias'],
      ['Tecnologia e serviços', 5400, 890, 23, 'Últimos 30 dias'],
    ],
    { kind: 'analytics', readonly: true },
  ),
  prospecta: table(
    'Prospecta',
    'Contas-alvo e oportunidades de conexão com a sua marca.',
    Target,
    'prospecta/contas',
    [
      name,
      f('sector', 'Setor'),
      f('contacts', 'Contatos', 'number'),
      f('interest', 'Interesse'),
      f('status', 'Etapa'),
    ],
    [
      ['Casa Forma', 'Design e decoração', 3, 'Alta afinidade', 'A explorar'],
      ['Grupo Horizonte', 'Serviços', 5, 'Visitou sua página', 'Em análise'],
      ['Ateliê Sul', 'Moda', 2, 'Solicitou contato', 'Em contato'],
    ],
    { readonly: true },
  ),
  cs: table(
    'Customer Success',
    'O ciclo de atendimento de cada cliente, com responsáveis e prazos.',
    LifeBuoy,
    'cs',
    [
      name,
      f('stage', 'Etapa', undefined, [
        'Onboarding',
        'Planejamento',
        'Produção',
        'Aprovação',
        'Veiculação',
        'Encerramento',
      ]),
      f('owner', 'Responsável'),
      f('deadline', 'Prazo', 'date'),
      f('status', 'Situação', undefined, ['Em andamento', 'Concluído', 'Atrasado']),
    ],
    [
      ['Aurora', 'Veiculação', 'Equipe de sucesso', '2026-10-05', 'Em andamento'],
      ['Estúdio Norte', 'Veiculação', 'Equipe de sucesso', '2026-10-15', 'Em andamento'],
      ['Grupo Horizonte', 'Aprovação', 'Equipe de sucesso', '2026-10-02', 'Atrasado'],
    ],
  ),
  vitrine: table(
    'Vitrine',
    'A presença das marcas no catálogo de expositores.',
    ShoppingBag,
    'vitrine/painel',
    [
      name,
      f('category', 'Categoria'),
      f('visits', 'Visitas', 'number'),
      f('products', 'Produtos', 'number'),
      status,
    ],
    [
      ['Aurora', 'Design e decoração', 1240, 8, 'Ativo'],
      ['Estúdio Norte', 'Design e decoração', 860, 5, 'Ativo'],
      ['Casa Forma', 'Casa e interiores', 420, 4, 'Rascunho'],
    ],
    { kind: 'vitrine' },
  ),
  catalogo: table(
    'Catálogo de Mídia',
    'Encontre os melhores espaços para a sua próxima campanha.',
    ShoppingBag,
    'catalog',
    [],
    [],
    { kind: 'catalog' },
  ),
  criativos: table(
    'Criativos',
    'As peças e os materiais das suas campanhas.',
    Image,
    'my-creatives',
    [
      name,
      f('campaign', 'Campanha'),
      f('format', 'Formato', undefined, ['Imagem', 'Vídeo', 'HTML']),
      f('dimensions', 'Dimensões'),
      f('status', 'Etapa', undefined, ['Em aprovação', 'Aprovado', 'Ajustes solicitados']),
    ],
    [
      [
        'Superbanner · Aurora',
        'Novas conexões, grandes negócios',
        'Imagem',
        '970 × 250',
        'Aprovado',
      ],
      ['Stories · Norte', 'O próximo capítulo do design', 'Vídeo', '1080 × 1920', 'Aprovado'],
      ['Banner · Horizonte', 'Sua marca em primeiro plano', 'Imagem', '970 × 250', 'Em aprovação'],
    ],
    { create: 'Novo criativo' },
  ),
  notificacoes: table(
    'Notificações',
    'As atualizações mais recentes do seu workspace.',
    Bell,
    'notifications',
    [
      name,
      f('description', 'Descrição'),
      f('date', 'Recebida'),
      f('status', 'Leitura', undefined, ['Não lida', 'Lida']),
    ],
    [
      [
        'Campanha aprovada',
        'Novas conexões, grandes negócios está pronta para veicular.',
        '2026-09-30T10:42:00-03:00',
        'Não lida',
      ],
      [
        'Novo pedido de inserção',
        'PI-2026-0044 aguarda revisão.',
        '2026-09-30T09:30:00-03:00',
        'Não lida',
      ],
      [
        'Novo lead na Vitrine',
        'Uma nova oportunidade foi adicionada ao funil.',
        '2026-09-29T16:20:00-03:00',
        'Lida',
      ],
    ],
  ),
  portais: table(
    'Portais',
    'Os espaços de mídia da plataforma.',
    Globe,
    '/admin/portals',
    [
      name,
      f('slug', 'Identificador'),
      f('company', 'Empresa'),
      f('members', 'Membros', 'number'),
      status,
    ],
    [
      ['Francal', 'francal', 'Francal', 12, 'Ativo'],
      ['Portal Conexões', 'conexoes', 'Conecta Eventos', 8, 'Ativo'],
      ['Espaço Design', 'design', 'Estúdio Parceiro', 4, 'Rascunho'],
    ],
    { create: 'Novo portal' },
  ),
  usuarios: table(
    'Usuários',
    'Pessoas e papéis na plataforma.',
    UsersRound,
    '/admin/users',
    [
      name,
      f('email', 'E-mail', 'email'),
      f('role', 'Papel', undefined, [
        'Administrador da plataforma',
        'Gestor do portal',
        'Anunciante',
      ]),
      f('portal', 'Portal'),
      status,
    ],
    [
      ['Equipe de mídia', 'midia@example.invalid', 'Gestor do portal', 'Francal', 'Ativo'],
      ['Equipe comercial', 'comercial@example.invalid', 'Gestor do portal', 'Francal', 'Ativo'],
      ['Aurora', 'aurora@example.invalid', 'Anunciante', 'Francal', 'Ativo'],
    ],
    { create: 'Novo usuário' },
  ),
  webhooks: table(
    'Webhooks',
    'Destinos e eventos das integrações da plataforma.',
    Webhook,
    '/admin/webhooks',
    [name, f('event', 'Evento'), f('destination', 'Destino'), f('last', 'Última entrega'), status],
    [
      [
        'CRM comercial',
        'lead.created',
        'https://crm.example.invalid/events',
        '2026-09-30T10:30:00-03:00',
        'Ativo',
      ],
      [
        'Operação de mídia',
        'campaign.approved',
        'https://media.example.invalid/events',
        '2026-09-30T09:42:00-03:00',
        'Ativo',
      ],
    ],
    { create: 'Novo webhook' },
  ),
  importacoes: table(
    'Importações',
    'Acompanhe arquivos e lotes de dados recebidos.',
    FileInput,
    '/admin/imports',
    [
      name,
      f('type', 'Tipo'),
      f('total', 'Registros', 'number'),
      f('date', 'Data'),
      f('status', 'Situação'),
    ],
    [
      ['Credenciados setembro.csv', 'Públicos', 18400, '2026-09-29T14:00:00-03:00', 'Concluído'],
      ['Anunciantes outubro.csv', 'Anunciantes', 24, '2026-09-30T09:00:00-03:00', 'Em revisão'],
    ],
    { readonly: true },
  ),
  'fila-leads': table(
    'Entrada de leads',
    'Acompanhe o recebimento dos eventos de oportunidades.',
    Kanban,
    '/admin/lead-inbox',
    [name, f('portal', 'Portal'), f('date', 'Recebido'), f('status', 'Processamento')],
    [
      ['Evento de contato · Casa Forma', 'Francal', '2026-09-30T10:32:00-03:00', 'Concluído'],
      ['Evento de contato · Aurora', 'Francal', '2026-09-30T10:28:00-03:00', 'Pendente'],
    ],
    { readonly: true },
  ),
  'fila-email': table(
    'Fila de e-mails',
    'O andamento das notificações por e-mail.',
    Mail,
    '/admin/notification-emails',
    [name, f('recipient', 'Destinatário', 'email'), f('date', 'Data'), f('status', 'Entrega')],
    [
      ['Campanha aprovada', 'aurora@example.invalid', '2026-09-30T10:42:00-03:00', 'Enviado'],
      [
        'P.I. aguardando assinatura',
        'forma@example.invalid',
        '2026-09-30T09:30:00-03:00',
        'Pendente',
      ],
    ],
    { readonly: true },
  ),
} satisfies Record<string, ScreenDefinition>;
export type ScreenKey = keyof typeof screens;
export type ViewMode = 'portal' | 'anunciante' | 'plataforma';
export const modeLabels: Record<ViewMode, string> = {
  portal: 'Gestão do portal',
  anunciante: 'Visão do anunciante',
  plataforma: 'Administração',
};
export type NavGroup = { label: string; items: ScreenKey[]; expandable?: boolean };
export const navigation: Record<ViewMode, NavGroup[]> = {
  portal: [
    { label: 'Workspace', items: ['visao-geral', 'tabelas', 'toasts'] },
    { label: 'Configuração', items: ['metricas', 'canais', 'publicos', 'inventario', 'bonus'] },
    { label: 'Operação', items: ['campanhas', 'pedidos', 'leads'] },
    {
      label: 'Portal',
      items: ['fornecedores', 'empresa', 'categorias', 'auditoria', 'operacoes', 'configuracoes'],
    },
    {
      label: 'Mais ferramentas',
      items: [
        'pacotes',
        'performance',
        'data-on',
        'prospecta',
        'cs',
        'vitrine',
        'catalogo',
        'criativos',
        'notificacoes',
      ],
      expandable: true,
    },
  ],
  anunciante: [
    {
      label: 'Meu workspace',
      items: ['visao-geral', 'catalogo', 'campanhas', 'pedidos', 'leads', 'configuracoes'],
    },
    {
      label: 'Minha marca',
      items: ['criativos', 'performance', 'data-on', 'prospecta', 'vitrine', 'notificacoes'],
    },
  ],
  plataforma: [
    {
      label: 'Plataforma',
      items: ['visao-geral', 'portais', 'usuarios', 'webhooks', 'auditoria', 'configuracoes'],
    },
    { label: 'Monitoramento', items: ['importacoes', 'fila-leads', 'fila-email'] },
  ],
};
export const overviewIcon = CircleDollarSign;
export const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
export function parseLocation(hash: string) {
  const parts = hash.replace(/^#/, '').split('/');
  const mode: ViewMode =
    parts[0] === 'anunciante' || parts[0] === 'plataforma' ? (parts.shift() as ViewMode) : 'portal';
  const candidate = parts.shift() || 'campanhas';
  const screen: ScreenKey = Object.hasOwn(screens, candidate)
    ? (candidate as ScreenKey)
    : 'visao-geral';
  return { mode, screen, recordId: parts[0] || null };
}
export function screenHref(screen: ScreenKey, mode: ViewMode = 'portal', recordId?: string) {
  return `#${mode === 'portal' ? '' : `${mode}/`}${screen}${recordId ? `/${encodeURIComponent(recordId)}` : ''}`;
}
export function navigate(screen: ScreenKey, mode: ViewMode = 'portal', recordId?: string) {
  window.history.pushState(null, '', screenHref(screen, mode, recordId));
  window.dispatchEvent(new PopStateEvent('popstate'));
}
