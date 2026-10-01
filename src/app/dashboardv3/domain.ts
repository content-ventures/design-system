/**
 * Domínio fictício do Dashboard V3 (Ad Manager do portal da feira).
 * Espelha as entidades e regras da produção (apps/web) sem importar nada dela.
 * Nomes, CNPJs e números são inventados.
 */
import type { Tone } from '@/components/ds-v3';

/* ——— Status ——— */
export type CampaignStatus =
  | 'draft'
  | 'submitted'
  | 'adjustments_requested'
  | 'awaiting_pi_signature'
  | 'approved'
  | 'pi_rejected'
  | 'active'
  | 'paused'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export const STATUS: Record<CampaignStatus, { label: string; tone: Tone; live?: boolean }> = {
  draft: { label: 'Rascunho', tone: 'gray' },
  submitted: { label: 'Aguardando aprovação', tone: 'violet' },
  adjustments_requested: { label: 'Ajustes solicitados', tone: 'orange' },
  awaiting_pi_signature: { label: 'Aguardando assinatura do P.I.', tone: 'amber' },
  approved: { label: 'Aprovada', tone: 'teal' },
  pi_rejected: { label: 'P.I. rejeitado', tone: 'red' },
  active: { label: 'Veiculando', tone: 'green', live: true },
  paused: { label: 'Pausada', tone: 'gray' },
  completed: { label: 'Concluída', tone: 'gray' },
  rejected: { label: 'Rejeitada', tone: 'red' },
  cancelled: { label: 'Cancelada', tone: 'red' },
};
export const STATUS_ORDER = Object.keys(STATUS) as CampaignStatus[];

/** O que aconteceu ao entrar em cada status — verbo de conclusão para histórico e avisos. */
export const STATUS_DONE: Record<CampaignStatus, string> = {
  draft: 'Voltou para rascunho',
  submitted: 'Enviada para aprovação',
  adjustments_requested: 'Ajustes solicitados',
  awaiting_pi_signature: 'Aprovada · P.I. gerado',
  approved: 'P.I. assinado',
  pi_rejected: 'P.I. rejeitado',
  active: 'Veiculação iniciada',
  paused: 'Veiculação pausada',
  completed: 'Campanha concluída',
  rejected: 'Campanha rejeitada',
  cancelled: 'Campanha cancelada',
};

/** Transições da produção (CAMPAIGN_TRANSITIONS), com o verbo do botão no V3. */
export const TRANSITIONS: Record<CampaignStatus, { to: CampaignStatus; verb: string }[]> = {
  draft: [
    { to: 'submitted', verb: 'Enviar para aprovação' },
    { to: 'cancelled', verb: 'Cancelar campanha' },
  ],
  submitted: [
    { to: 'awaiting_pi_signature', verb: 'Aprovar e gerar P.I.' },
    { to: 'adjustments_requested', verb: 'Solicitar ajustes' },
    { to: 'rejected', verb: 'Rejeitar' },
    { to: 'cancelled', verb: 'Cancelar campanha' },
  ],
  adjustments_requested: [
    { to: 'submitted', verb: 'Reenviar para aprovação' },
    { to: 'cancelled', verb: 'Cancelar campanha' },
  ],
  awaiting_pi_signature: [
    { to: 'approved', verb: 'Registrar P.I. assinado' },
    { to: 'pi_rejected', verb: 'Rejeitar P.I.' },
    { to: 'cancelled', verb: 'Cancelar campanha' },
  ],
  approved: [
    { to: 'active', verb: 'Iniciar veiculação' },
    { to: 'paused', verb: 'Pausar' },
    { to: 'cancelled', verb: 'Cancelar campanha' },
  ],
  pi_rejected: [
    { to: 'adjustments_requested', verb: 'Solicitar ajustes' },
    { to: 'cancelled', verb: 'Cancelar campanha' },
  ],
  active: [
    { to: 'paused', verb: 'Pausar' },
    { to: 'completed', verb: 'Concluir' },
    { to: 'cancelled', verb: 'Cancelar campanha' },
  ],
  paused: [
    { to: 'active', verb: 'Retomar veiculação' },
    { to: 'completed', verb: 'Concluir' },
    { to: 'cancelled', verb: 'Cancelar campanha' },
  ],
  completed: [],
  rejected: [{ to: 'cancelled', verb: 'Cancelar campanha' }],
  cancelled: [],
};
export const REASON_REQUIRED: CampaignStatus[] = [
  'rejected',
  'adjustments_requested',
  'pi_rejected',
  'cancelled',
];
export const EDITABLE: CampaignStatus[] = ['draft', 'adjustments_requested'];

/* ——— Anunciantes ——— */
export type Advertiser = { id: string; name: string; cnpj: string; segment: string };
export const ADVERTISERS: Advertiser[] = [
  { id: 'adv-aurora', name: 'Aurora Calçados', cnpj: '12.345.678/0001-90', segment: 'Calçado feminino' },
  { id: 'adv-norte', name: 'Estúdio Norte', cnpj: '23.456.789/0001-01', segment: 'Design e acessórios' },
  { id: 'adv-lume', name: 'Lume Acessórios', cnpj: '34.567.890/0001-12', segment: 'Bolsas e cintos' },
  { id: 'adv-horizonte', name: 'Grupo Horizonte', cnpj: '45.678.901/0001-23', segment: 'Varejo multimarcas' },
  { id: 'adv-forma', name: 'Casa Forma', cnpj: '56.789.012/0001-34', segment: 'Calçado masculino' },
  { id: 'adv-sul', name: 'Ateliê Sul', cnpj: '67.890.123/0001-45', segment: 'Couro artesanal' },
  { id: 'adv-patio', name: 'Pátio Couro', cnpj: '78.901.234/0001-56', segment: 'Curtume' },
  { id: 'adv-nobre', name: 'Couro Nobre', cnpj: '89.012.345/0001-67', segment: 'Curtume' },
  { id: 'adv-passo', name: 'Bella Passo', cnpj: '90.123.456/0001-78', segment: 'Calçado infantil' },
];
/** Anunciante que o protótipo usa quando o papel é "Anunciante". */
export const SELF_ADVERTISER_ID = 'adv-aurora';

/* ——— Catálogo ——— */
export type Category = 'midia_online' | 'conteudo_organico' | 'midia_offline' | 'prospeccao_ativa';
export const CATEGORIES: { value: Category; label: string; hint: string }[] = [
  { value: 'midia_online', label: 'Mídia Online', hint: 'Portal, app, e-mail e redes da feira' },
  { value: 'conteudo_organico', label: 'Conteúdo Orgânico', hint: 'Posts, matérias e vídeos editoriais' },
  { value: 'midia_offline', label: 'Mídia Offline', hint: 'Painéis, totens e sinalização no pavilhão' },
  { value: 'prospeccao_ativa', label: 'Prospecção Ativa', hint: 'Listas qualificadas e rodadas de negócio' },
];

export type PricingModel = 'cpm' | 'cpc' | 'per_display' | 'fixed_package' | 'metric_package' | 'bonus';
export const PRICING: Record<PricingModel, { label: string; unit: string; unitPlural: string; needsBudget: boolean }> = {
  cpm: { label: 'CPM', unit: 'mil impressões', unitPlural: 'impressões', needsBudget: true },
  cpc: { label: 'CPC', unit: 'clique', unitPlural: 'cliques', needsBudget: true },
  per_display: { label: 'Por Disparo', unit: 'disparo', unitPlural: 'disparos', needsBudget: true },
  fixed_package: { label: 'Pacote Fixo', unit: 'pacote', unitPlural: 'pacotes', needsBudget: false },
  metric_package: { label: 'Pacote por Métrica', unit: 'pacote', unitPlural: 'pacotes', needsBudget: true },
  bonus: { label: 'Bônus', unit: 'bonificação', unitPlural: 'bonificações', needsBudget: false },
};

export type Channel = { id: string; name: string; kind: 'web' | 'app' | 'email' | 'social' | 'onsite' | 'list' };
export const CHANNELS: Channel[] = [
  { id: 'ch-portal', name: 'Portal da feira', kind: 'web' },
  { id: 'ch-app', name: 'App Francal', kind: 'app' },
  { id: 'ch-email', name: 'E-mail marketing', kind: 'email' },
  { id: 'ch-insta', name: 'Instagram oficial', kind: 'social' },
  { id: 'ch-linkedin', name: 'LinkedIn oficial', kind: 'social' },
  { id: 'ch-pavilhao', name: 'Pavilhão principal', kind: 'onsite' },
  { id: 'ch-rodada', name: 'Rodada de negócios', kind: 'list' },
];

export type AudienceLimits = {
  /** capacidade total na métrica, para a janela da feira */
  capacity: number;
  min: number;
  maxPerAdvertiser: number;
  /** já reservado por outras campanhas (reduz o disponível) */
  reserved: number;
};
export type Audience = {
  id: string;
  name: string;
  description: string;
  size: number;
  /** limites por métrica de precificação (audience_metrics); sem linha, sem limite */
  limits: Partial<Record<PricingModel, AudienceLimits>>;
};
export const AUDIENCES: Audience[] = [
  {
    id: 'aud-cred',
    name: 'Visitantes credenciados',
    description: 'Credenciados na Francal 2026',
    size: 48_200,
    limits: {
      cpm: { capacity: 1_400_000, min: 50_000, maxPerAdvertiser: 600_000, reserved: 520_000 },
      per_display: { capacity: 120_000, min: 2_000, maxPerAdvertiser: 40_000, reserved: 30_000 },
      cpc: { capacity: 30_000, min: 500, maxPerAdvertiser: 10_000, reserved: 6_000 },
    },
  },
  {
    id: 'aud-lojistas',
    name: 'Lojistas e compradores',
    description: 'Compradores com CNPJ de varejo',
    size: 21_600,
    limits: {
      cpm: { capacity: 760_000, min: 25_000, maxPerAdvertiser: 300_000, reserved: 410_000 },
      per_display: { capacity: 60_000, min: 1_000, maxPerAdvertiser: 20_000, reserved: 18_000 },
      cpc: { capacity: 14_000, min: 300, maxPerAdvertiser: 5_000, reserved: 4_000 },
    },
  },
  {
    id: 'aud-intl',
    name: 'Compradores internacionais',
    description: 'Delegações e importadores',
    size: 3_900,
    limits: {
      cpm: { capacity: 180_000, min: 10_000, maxPerAdvertiser: 80_000, reserved: 132_000 },
      per_display: { capacity: 9_000, min: 500, maxPerAdvertiser: 4_000, reserved: 5_500 },
    },
  },
  {
    id: 'aud-imprensa',
    name: 'Imprensa e influenciadores',
    description: 'Jornalistas e criadores credenciados',
    size: 1_150,
    limits: {
      per_display: { capacity: 2_300, min: 200, maxPerAdvertiser: 1_000, reserved: 400 },
    },
  },
];

export type BonusRule = {
  id: string;
  name: string;
  description: string;
  reward: 'Desconto (%)' | 'Impressões extras' | 'Disparos WhatsApp extras' | 'Bônus personalizado';
  conditions: { field: 'budget' | 'campaign_count'; op: '>=' | '>' | '<=' | '<' | '=='; value: number }[];
};

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'file_upload'
  | 'currency'
  | 'condition';
export const FIELD_TYPES: Record<FieldType, string> = {
  text: 'Texto',
  textarea: 'Texto longo',
  number: 'Número',
  date: 'Data',
  select: 'Seleção única',
  multiselect: 'Seleção múltipla',
  file_upload: 'Upload de criativo',
  currency: 'Moeda',
  condition: 'Condição',
};
export type BriefField = {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  placeholder?: string;
  options?: string[];
  min?: number;
  max?: number;
  accept?: string;
  allowLater?: boolean;
  /** Só aparece se o campo `field` satisfizer `op value`. */
  showIf?: { field: string; op: 'eq' | 'neq' | 'contains' | 'gt' | 'lt'; value: string };
  /** Grupo repetível (tipo condição). */
  children?: BriefField[];
};

export type Asset = {
  id: string;
  name: string;
  description: string;
  category: Category;
  pricing: PricingModel;
  basePrice: number;
  minPurchase?: number;
  recommended?: number;
  maxValue?: number;
  /** janela em que o ativo pode veicular */
  window: { start: string; end: string };
  channelIds: string[];
  audienceIds: string[];
  allowAllocation: boolean;
  bonuses: BonusRule[];
  fields: BriefField[];
  /** formato de prévia para o resumo */
  preview: 'banner' | 'email' | 'push' | 'post' | 'led' | 'list';
};

const creativeFields: BriefField[] = [
  {
    id: 'f-peca',
    label: 'Peça criativa',
    type: 'file_upload',
    required: true,
    accept: 'image/png,image/jpeg,image/webp',
    allowLater: true,
    help: 'PNG, JPG ou WEBP até 25 MB. Tamanho: 970 × 250 px.',
  },
  { id: 'f-url', label: 'URL de destino', type: 'text', required: true, placeholder: 'https://aurora.com.br/primavera' },
  { id: 'f-alt', label: 'Texto alternativo da peça', type: 'textarea', help: 'Descreve a imagem para leitores de tela.', max: 180 },
  { id: 'f-idioma', label: 'Idioma da peça', type: 'select', required: true, options: ['Português', 'Inglês', 'Espanhol', 'Bilíngue'] },
  {
    id: 'f-versoes',
    label: 'Versões por idioma',
    type: 'condition',
    showIf: { field: 'f-idioma', op: 'eq', value: 'Bilíngue' },
    children: [
      { id: 'f-v-idioma', label: 'Idioma', type: 'select', options: ['Inglês', 'Espanhol'] },
      { id: 'f-v-peca', label: 'Peça da versão', type: 'file_upload', accept: 'image/png,image/jpeg' },
    ],
  },
  { id: 'f-pracas', label: 'Pavilhões de interesse', type: 'multiselect', options: ['Pavilhão Azul', 'Pavilhão Verde', 'Pavilhão Laranja', 'Área internacional'] },
  { id: 'f-entrega', label: 'Entrega do criativo', type: 'date', required: true, help: 'Até 5 dias úteis antes do início da veiculação.' },
];

export const ASSETS: Asset[] = [
  {
    id: 'as-supertopo',
    name: 'Banner Super Topo — Portal',
    description: 'Formato 970 × 250 no topo de todas as páginas do portal durante a feira.',
    category: 'midia_online',
    pricing: 'cpm',
    basePrice: 45,
    minPurchase: 2_000,
    recommended: 9_000,
    maxValue: 45_000,
    window: { start: '2026-10-01', end: '2026-11-30' },
    channelIds: ['ch-portal', 'ch-app'],
    audienceIds: ['aud-cred', 'aud-lojistas', 'aud-intl'],
    allowAllocation: true,
    bonuses: [
      { id: 'b-imp', name: '+20% de impressões', description: 'Impressões extras sem custo durante a feira.', reward: 'Impressões extras', conditions: [{ field: 'budget', op: '>=', value: 15_000 }] },
      { id: 'b-news', name: 'Destaque na newsletter', description: 'Logo na newsletter diária dos credenciados.', reward: 'Bônus personalizado', conditions: [{ field: 'budget', op: '>=', value: 27_000 }] },
      { id: 'b-desc', name: 'Desconto de fidelidade', description: '5% de desconto a partir da terceira campanha.', reward: 'Desconto (%)', conditions: [{ field: 'campaign_count', op: '>=', value: 3 }] },
    ],
    fields: creativeFields,
    preview: 'banner',
  },
  {
    id: 'as-email',
    name: 'E-mail marketing dedicado',
    description: 'Disparo exclusivo para a base de credenciados, com segmentação por público.',
    category: 'midia_online',
    pricing: 'per_display',
    basePrice: 0.4,
    minPurchase: 2_000,
    recommended: 8_000,
    maxValue: 24_000,
    window: { start: '2026-09-15', end: '2026-11-30' },
    channelIds: ['ch-email'],
    audienceIds: ['aud-cred', 'aud-lojistas', 'aud-intl', 'aud-imprensa'],
    allowAllocation: true,
    bonuses: [
      { id: 'b-wpp', name: 'Disparo extra no WhatsApp', description: '2.000 mensagens para lojistas confirmados.', reward: 'Disparos WhatsApp extras', conditions: [{ field: 'budget', op: '>=', value: 10_000 }] },
    ],
    fields: [
      { id: 'e-assunto', label: 'Assunto do e-mail', type: 'text', required: true, max: 70, placeholder: 'Lançamento Primavera-Verão 2027' },
      { id: 'e-remetente', label: 'Nome do remetente', type: 'text', required: true, placeholder: 'Aurora Calçados' },
      { id: 'e-html', label: 'Arte do e-mail', type: 'file_upload', required: true, accept: 'text/html,image/png,image/jpeg', allowLater: true, help: 'HTML ou imagem de 600 px de largura.' },
      { id: 'e-data', label: 'Data do disparo', type: 'date', required: true },
      { id: 'e-cupom', label: 'Tem cupom de desconto?', type: 'select', options: ['Não', 'Sim'] },
      { id: 'e-cupom-valor', label: 'Valor do desconto', type: 'currency', showIf: { field: 'e-cupom', op: 'eq', value: 'Sim' }, min: 10 },
    ],
    preview: 'email',
  },
  {
    id: 'as-push',
    name: 'Push no app da feira',
    description: 'Notificação no app para quem está no pavilhão, com clique para o estande.',
    category: 'midia_online',
    pricing: 'cpc',
    basePrice: 1.8,
    minPurchase: 900,
    recommended: 3_600,
    maxValue: 18_000,
    window: { start: '2026-10-10', end: '2026-10-20' },
    channelIds: ['ch-app'],
    audienceIds: ['aud-cred', 'aud-lojistas'],
    allowAllocation: false,
    bonuses: [],
    fields: [
      { id: 'p-titulo', label: 'Título da notificação', type: 'text', required: true, max: 40 },
      { id: 'p-texto', label: 'Mensagem', type: 'textarea', required: true, max: 120 },
      { id: 'p-horario', label: 'Janelas de envio', type: 'multiselect', options: ['Abertura (9h)', 'Almoço (12h)', 'Tarde (15h)', 'Encerramento (18h)'], required: true },
      { id: 'p-cliques', label: 'Limite de cliques por dia', type: 'number', min: 100, max: 5_000 },
    ],
    preview: 'push',
  },
  {
    id: 'as-post',
    name: 'Post patrocinado no Instagram oficial',
    description: 'Carrossel produzido pela equipe da feira, publicado no perfil oficial.',
    category: 'conteudo_organico',
    pricing: 'fixed_package',
    basePrice: 6_500,
    window: { start: '2026-09-20', end: '2026-10-31' },
    channelIds: ['ch-insta'],
    audienceIds: ['aud-cred', 'aud-imprensa'],
    allowAllocation: false,
    bonuses: [
      { id: 'b-story', name: 'Stories de reforço', description: 'Dois stories no dia da publicação.', reward: 'Bônus personalizado', conditions: [] },
    ],
    fields: [
      { id: 'o-pauta', label: 'Pauta do conteúdo', type: 'textarea', required: true, help: 'O que o post deve contar sobre a sua marca.' },
      { id: 'o-fotos', label: 'Fotos de produto', type: 'file_upload', required: true, accept: 'image/png,image/jpeg', allowLater: true },
      { id: 'o-perfil', label: '@ da marca para marcação', type: 'text', placeholder: '@auroracalcados' },
    ],
    preview: 'post',
  },
  {
    id: 'as-materia',
    name: 'Matéria no blog da feira',
    description: 'Conteúdo editorial com entrevista e fotos do lançamento.',
    category: 'conteudo_organico',
    pricing: 'metric_package',
    basePrice: 1_800,
    minPurchase: 1_800,
    recommended: 3_600,
    maxValue: 9_000,
    window: { start: '2026-09-01', end: '2026-12-15' },
    channelIds: ['ch-portal', 'ch-linkedin'],
    audienceIds: ['aud-cred', 'aud-imprensa'],
    allowAllocation: true,
    bonuses: [],
    fields: [
      { id: 'm-tema', label: 'Tema da matéria', type: 'text', required: true },
      { id: 'm-porta-voz', label: 'Porta-voz para entrevista', type: 'text', required: true },
    ],
    preview: 'post',
  },
  {
    id: 'as-led',
    name: 'Painel de LED — Pavilhão Azul',
    description: 'Vídeo de 15 s em loop no painel da entrada principal, 10 h por dia.',
    category: 'midia_offline',
    pricing: 'fixed_package',
    basePrice: 18_000,
    window: { start: '2026-10-14', end: '2026-10-17' },
    channelIds: ['ch-pavilhao'],
    audienceIds: ['aud-cred'],
    allowAllocation: false,
    bonuses: [],
    fields: [
      { id: 'l-video', label: 'Vídeo de 15 segundos', type: 'file_upload', required: true, accept: 'video/mp4', help: 'MP4, 1920 × 1080, sem áudio.' },
      { id: 'l-cta', label: 'Chamada exibida no fim', type: 'text', placeholder: 'Visite o estande B-214' },
    ],
    preview: 'led',
  },
  {
    id: 'as-totem',
    name: 'Totens digitais nos corredores',
    description: '12 totens com rotação de anunciantes a cada 30 segundos.',
    category: 'midia_offline',
    pricing: 'cpm',
    basePrice: 28,
    minPurchase: 1_400,
    recommended: 5_600,
    maxValue: 16_800,
    window: { start: '2026-10-14', end: '2026-10-17' },
    channelIds: ['ch-pavilhao'],
    audienceIds: ['aud-cred', 'aud-lojistas'],
    allowAllocation: false,
    bonuses: [],
    fields: [{ id: 't-arte', label: 'Arte vertical', type: 'file_upload', required: true, accept: 'image/png,image/jpeg' }],
    preview: 'led',
  },
  {
    id: 'as-rodada',
    name: 'Rodada de negócios — lista qualificada',
    description: 'Convites para compradores do seu segmento com agenda no estande.',
    category: 'prospeccao_ativa',
    pricing: 'per_display',
    basePrice: 12,
    minPurchase: 1_200,
    recommended: 3_600,
    maxValue: 12_000,
    window: { start: '2026-09-25', end: '2026-10-17' },
    channelIds: ['ch-rodada', 'ch-email'],
    audienceIds: ['aud-lojistas', 'aud-intl'],
    allowAllocation: true,
    bonuses: [],
    fields: [
      { id: 'r-segmento', label: 'Segmentos de interesse', type: 'multiselect', required: true, options: ['Calçado feminino', 'Calçado masculino', 'Infantil', 'Bolsas', 'Couro'] },
      { id: 'r-agenda', label: 'Horários disponíveis no estande', type: 'textarea', required: true },
    ],
    preview: 'list',
  },
  {
    id: 'as-vitrine',
    name: 'Destaque na vitrine (bonificação)',
    description: 'Selo de destaque na vitrine de expositores durante a feira.',
    category: 'midia_online',
    pricing: 'bonus',
    basePrice: 0,
    window: { start: '2026-10-01', end: '2026-10-31' },
    channelIds: ['ch-portal'],
    audienceIds: ['aud-cred'],
    allowAllocation: false,
    bonuses: [
      { id: 'b-selo', name: 'Selo “Lançamento”', description: 'Selo no card do expositor.', reward: 'Bônus personalizado', conditions: [] },
    ],
    fields: [],
    preview: 'banner',
  },
];

export type Package = { id: string; name: string; description: string; assetIds: string[]; totalPrice?: number };
export const PACKAGES: Package[] = [
  { id: 'pk-lancamento', name: 'Pacote Lançamento', description: 'Super Topo + e-mail dedicado + push no app.', assetIds: ['as-supertopo', 'as-email', 'as-push'] },
  { id: 'pk-presenca', name: 'Pacote Presença no Pavilhão', description: 'Painel de LED + totens nos corredores.', assetIds: ['as-led', 'as-totem'], totalPrice: 21_500 },
  { id: 'pk-vazio', name: 'Pacote Imprensa (em montagem)', description: 'Ainda sem ativos vinculados.', assetIds: [] },
];

/** Contratação existente que bloqueia concorrentes (regra de exclusividade por CNPJ). */
export const EXCLUSIVITY = [
  {
    holder: 'adv-patio',
    blocked: ['adv-nobre'],
    category: 'midia_online' as Category,
    categoryLabel: 'Curtume',
    contract: 'P.I. 2026-0412',
    start: '2026-10-01',
    end: '2026-10-31',
  },
];

export const byId = <T extends { id: string }>(list: T[], id: string) => list.find((item) => item.id === id);
