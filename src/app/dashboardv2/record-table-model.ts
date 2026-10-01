import { normalize, screens, type DemoRecord, type ScreenKey } from './workspace-data';

export type RecordColumn = {
  key: string;
  label: string;
  width: number;
  secondary?: string[];
  kind?: 'text' | 'status' | 'number' | 'money' | 'date' | 'code' | 'stock' | 'price' | 'metric';
};
export type RecordSort = { key: string; direction: 'asc' | 'desc' };
type TableDefinition = {
  columns: RecordColumn[];
  density?: 'compact' | 'comfortable';
  filters?: string[];
  tabs?: boolean;
  sort?: RecordSort;
  inbox?: boolean;
};
const col = (
  key: string,
  label: string,
  width: number,
  kind?: RecordColumn['kind'],
  secondary?: string[],
): RecordColumn => ({ key, label, width, kind, secondary });
const state = (label = 'Status', width = 125) => col('status', label, width, 'status');
const recent: RecordSort = { key: 'date', direction: 'desc' };

// A organização pertence ao domínio; status não determina automaticamente grupos de tabelas.
const definitions: Partial<Record<ScreenKey, TableDefinition>> = {
  importacoes: {
    density: 'compact',
    filters: ['status', 'type'],
    sort: recent,
    columns: [
      col('name', 'Arquivo', 300),
      col('type', 'Tipo de importação', 160),
      col('total', 'Registros', 110, 'number'),
      col('date', 'Recebido em', 170, 'date'),
      state('Situação', 130),
    ],
  },
  auditoria: {
    density: 'compact',
    filters: ['actor'],
    sort: recent,
    columns: [
      col('date', 'Data e hora', 170, 'date'),
      col('name', 'Evento', 230),
      col('entity', 'Registro alterado', 270),
      col('actor', 'Responsável', 170),
      state('Resultado', 120),
    ],
  },
  'fila-leads': {
    density: 'compact',
    filters: ['status', 'portal'],
    sort: recent,
    columns: [
      col('name', 'Evento recebido', 340),
      col('portal', 'Portal', 160),
      col('date', 'Recebido em', 180, 'date'),
      state('Processamento', 160),
    ],
  },
  'fila-email': {
    density: 'compact',
    filters: ['status'],
    sort: recent,
    columns: [
      col('name', 'Assunto', 260),
      col('recipient', 'Destinatário', 270),
      col('date', 'Criado em', 180, 'date'),
      state('Entrega', 120),
    ],
  },
  webhooks: {
    density: 'compact',
    filters: ['status'],
    sort: { key: 'last', direction: 'desc' },
    columns: [
      col('name', 'Integração', 220),
      col('event', 'Evento', 190, 'code'),
      col('destination', 'Endpoint', 280, 'code'),
      col('last', 'Última entrega', 170, 'date'),
      state(),
    ],
  },
  operacoes: {
    filters: ['status', 'owner'],
    sort: { key: 'deadline', direction: 'asc' },
    columns: [
      col('name', 'Pendência', 370, 'text', ['entity']),
      col('owner', 'Responsável', 180),
      col('deadline', 'Prazo', 125, 'date'),
      state('Situação', 150),
    ],
  },
  pedidos: {
    tabs: true,
    filters: ['advertiser'],
    sort: { key: 'deadline', direction: 'asc' },
    columns: [
      col('name', 'Pedido de inserção', 330, 'text', ['campaign']),
      col('advertiser', 'Anunciante', 150),
      col('value', 'Valor', 140, 'money'),
      col('deadline', 'Prazo', 120, 'date'),
      state('Situação', 200),
    ],
  },
  inventario: {
    tabs: true,
    filters: ['format'],
    columns: [
      col('name', 'Ativo de mídia', 290, 'text', ['format', 'channel']),
      col('audience', 'Público', 185),
      col('remaining', 'Estoque disponível', 150, 'stock'),
      col('price', 'Preço-base', 140, 'price'),
      state('Disponibilidade', 185),
    ],
  },
  publicos: {
    tabs: true,
    filters: ['origin'],
    columns: [
      col('name', 'Público', 280, 'text', ['category']),
      col('size', 'Pessoas na base', 135, 'number'),
      col('origin', 'Origem', 180),
      col('assets', 'Ativos vinculados', 140, 'number'),
      state(),
    ],
  },
  metricas: {
    filters: ['category', 'status'],
    columns: [
      col('name', 'Métrica', 240, 'text', ['category']),
      col('valueType', 'Tipo de valor', 140),
      col('pricing', 'Precificação', 150),
      col('visibility', 'Visível ao anunciante', 175),
      state(),
    ],
  },
  canais: {
    filters: ['category', 'status'],
    columns: [
      col('name', 'Canal', 250, 'text', ['category']),
      col('metrics', 'Métricas de entrega', 280),
      col('assets', 'Ativos', 120, 'number'),
      state(),
    ],
  },
  bonus: {
    filters: ['status'],
    columns: [
      col('name', 'Regra de bônus', 220),
      col('criterion', 'Quando se aplica', 280),
      col('benefit', 'Benefício', 280),
      col('earned', 'Conquistas', 110, 'number'),
      state(),
    ],
  },
  fornecedores: {
    filters: ['status'],
    columns: [
      col('name', 'Fornecedor', 240, 'text', ['slug']),
      col('contact', 'Contato', 260),
      col('advertisers', 'Anunciantes', 150, 'number'),
      state(),
    ],
  },
  categorias: {
    filters: ['sector', 'status'],
    columns: [
      col('name', 'Categoria', 260, 'text', ['slug']),
      col('sector', 'Setor', 220),
      col('brands', 'Marcas', 120, 'number'),
      state(),
    ],
  },
  pacotes: {
    filters: ['status'],
    columns: [
      col('name', 'Pacote', 320, 'text', ['assets']),
      col('audience', 'Público', 260),
      col('price', 'Preço do pacote', 150, 'money'),
      state(),
    ],
  },
  performance: {
    density: 'compact',
    filters: ['metric'],
    sort: recent,
    columns: [
      col('name', 'Campanha', 330),
      col('metric', 'Métrica', 140),
      col('value', 'Resultado', 150, 'metric'),
      col('date', 'Data do resultado', 155, 'date'),
      col('status', 'Origem', 100),
    ],
  },
  'data-on': {
    density: 'compact',
    sort: { key: 'profiles', direction: 'desc' },
    columns: [
      col('name', 'Segmento', 270),
      col('profiles', 'Perfis interessados', 180, 'metric'),
      col('visits', 'Visitas', 120, 'number'),
      col('conversions', 'Pedidos de contato', 180, 'number'),
      col('status', 'Período', 150),
    ],
  },
  prospecta: {
    filters: ['status', 'sector'],
    columns: [
      col('name', 'Conta-alvo', 260, 'text', ['sector']),
      col('contacts', 'Contatos', 120, 'number'),
      col('interest', 'Sinal de interesse', 210),
      state('Etapa', 145),
    ],
  },
  cs: {
    filters: ['stage', 'status'],
    sort: { key: 'deadline', direction: 'asc' },
    columns: [
      col('name', 'Cliente', 220),
      col('stage', 'Etapa do atendimento', 200),
      col('owner', 'Responsável', 200),
      col('deadline', 'Prazo', 120, 'date'),
      state('Situação', 140),
    ],
  },
  vitrine: {
    filters: ['category', 'status'],
    columns: [
      col('name', 'Marca', 280, 'text', ['category']),
      col('visits', 'Visitas', 150, 'number'),
      col('products', 'Produtos publicados', 180, 'number'),
      state('Publicação'),
    ],
  },
  criativos: {
    tabs: true,
    filters: ['format'],
    columns: [
      col('name', 'Peça', 260, 'text', ['dimensions']),
      col('campaign', 'Campanha', 300),
      col('format', 'Formato', 130),
      state('Aprovação', 180),
    ],
  },
  notificacoes: {
    inbox: true,
    tabs: true,
    sort: recent,
    columns: [
      col('name', 'Notificação', 340, 'text', ['description']),
      col('date', 'Recebida em', 180, 'date'),
      state('Leitura'),
    ],
  },
  portais: {
    filters: ['status'],
    columns: [
      col('name', 'Portal', 280, 'text', ['slug']),
      col('company', 'Empresa', 250),
      col('members', 'Membros', 130, 'number'),
      state(),
    ],
  },
  usuarios: {
    filters: ['role', 'portal'],
    columns: [
      col('name', 'Pessoa', 290, 'text', ['email']),
      col('role', 'Papel', 250),
      col('portal', 'Portal', 160),
      state('Acesso'),
    ],
  },
  leads: {
    filters: ['status', 'origin'],
    columns: [
      col('name', 'Contato', 260, 'text', ['email']),
      col('company', 'Empresa', 200),
      col('origin', 'Origem', 120),
      col('owner', 'Responsável', 180),
      state('Etapa', 140),
    ],
  },
};

export function recordTableDefinition(screen: ScreenKey): TableDefinition {
  return (
    definitions[screen] ?? {
      columns: screens[screen].fields
        .filter((field) => !field.hidden)
        .map((field) =>
          col(
            field.key,
            field.label,
            field.key === 'name' ? 260 : 150,
            field.key === 'status'
              ? 'status'
              : field.type === 'currency'
                ? 'money'
                : field.type === 'number'
                  ? 'number'
                  : 'text',
          ),
        ),
    }
  );
}
export function selectRecords(
  records: DemoRecord[],
  query: string,
  filters: Record<string, string>,
  sort: RecordSort,
) {
  return records
    .filter(
      (record) =>
        Object.entries(filters).every(
          ([key, value]) => value === 'all' || String(record[key]) === value,
        ) && normalize(Object.values(record).join(' ')).includes(normalize(query)),
    )
    .sort((left, right) => {
      const a = left[sort.key];
      const b = right[sort.key];
      if (a === undefined || a === '') return b === undefined || b === '' ? 0 : 1;
      if (b === undefined || b === '') return -1;
      const comparison =
        typeof a === 'number' && typeof b === 'number'
          ? a - b
          : String(a).localeCompare(String(b), 'pt-BR', { numeric: true });
      return comparison * (sort.direction === 'asc' ? 1 : -1);
    });
}
export function stockUnit(record: DemoRecord) {
  const quantity = Number(record.capacity) || Number(record.remaining);
  const units: Record<string, [string, string]> = {
    CPM: ['impressão', 'impressões'],
    'por envio': ['envio', 'envios'],
    'por publicação': ['publicação', 'publicações'],
    'por mês': ['cota', 'cotas'],
  };
  const unit = units[String(record.unit)] ?? ['unidade', 'unidades'];
  return unit[quantity === 1 ? 0 : 1];
}
