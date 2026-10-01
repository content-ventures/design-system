// Inventário fictício e independente do banco compartilhado com o produto.
export type InventoryStatus = 'available' | 'reserved' | 'unavailable';
export type InventoryAsset = {
  id: string;
  name: string;
  description: string;
  format: string;
  status: InventoryStatus;
  capacity: number;
  remaining: number;
  price: number;
  unit: string;
};

export const inventoryAssets: InventoryAsset[] = [
  {
    id: 'home',
    name: 'Superbanner · Página inicial',
    description: 'Sua marca na entrada do portal',
    format: 'Display',
    status: 'available',
    capacity: 200000,
    remaining: 200000,
    price: 85,
    unit: 'CPM',
  },
  {
    id: 'newsletter',
    name: 'Newsletter · Destaque da semana',
    description: 'Conexão direta com nossa audiência',
    format: 'E-mail',
    status: 'available',
    capacity: 4,
    remaining: 4,
    price: 2400,
    unit: 'por envio',
  },
  {
    id: 'content',
    name: 'Superbanner · Conteúdo',
    description: 'Presença nas páginas de conteúdo',
    format: 'Display',
    status: 'reserved',
    capacity: 150000,
    remaining: 65000,
    price: 65,
    unit: 'CPM',
  },
  {
    id: 'social',
    name: 'Redes sociais · Feed + Stories',
    description: 'Conteúdo para ampliar seu alcance',
    format: 'Social',
    status: 'reserved',
    capacity: 12,
    remaining: 5,
    price: 1800,
    unit: 'por publicação',
  },
  {
    id: 'exclusive',
    name: 'Newsletter · Edição exclusiva',
    description: 'Uma edição inteiramente da sua marca',
    format: 'E-mail',
    status: 'unavailable',
    capacity: 2,
    remaining: 0,
    price: 6800,
    unit: 'por envio',
  },
  {
    id: 'portal',
    name: 'Portal · Patrocínio de categoria',
    description: 'Destaque exclusivo no seu segmento',
    format: 'Display',
    status: 'unavailable',
    capacity: 1,
    remaining: 0,
    price: 12500,
    unit: 'por mês',
  },
];
