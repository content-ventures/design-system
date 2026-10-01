/*
 * Page builder da Vitrine — modelo, conteúdo fictício e biblioteca de seções.
 * Página = lista ordenada de seções; cada seção tem layout (variante), conteúdo, estilo e visibilidade.
 * Cabeçalho e rodapé têm posição fixa (como no Wix): editáveis, mas não se movem nem se excluem.
 */

import {
  type LucideIcon,
  CalendarClock,
  Contact,
  GalleryHorizontal,
  Handshake,
  LayoutGrid,
  Map as MapIcon,
  MessageSquareQuote,
  PanelBottom,
  PanelTop,
  CircleHelp,
  Sparkle,
  Star,
} from 'lucide-react';

export type Kind =
  | 'cabecalho'
  | 'hero'
  | 'destaques'
  | 'produtos'
  | 'programacao'
  | 'galeria'
  | 'depoimentos'
  | 'marcas'
  | 'mapa'
  | 'faq'
  | 'contato'
  | 'rodape';

export type Bg = 'branco' | 'suave' | 'marca' | 'imagem';
export type Align = 'esquerda' | 'centro';
export type Spacing = 'compacto' | 'medio' | 'amplo';
export type Device = 'desktop' | 'tablet' | 'celular';
export type Screen = 'desktop' | 'tablet' | 'mobile';

export type ArtId =
  | 'par-caramelo'
  | 'scarpin-caramelo'
  | 'scarpin-preto'
  | 'slingback-areia'
  | 'detalhe-caramelo'
  | 'bolsa-caramelo'
  | 'clutch-preto'
  | 'mule-preto'
  | 'estande';

export type Img = { art: ArtId; src?: string; file?: string; alt: string; fit: 'preencher' | 'ajustar' };
export type Item = Record<string, string>;

export type Section = {
  id: string;
  kind: Kind;
  layout: string;
  hidden: boolean;
  mobile: boolean;
  bg: Bg;
  bgArt: ArtId;
  align: Align;
  spacing: Spacing;
  text: Record<string, string>;
  items: Item[];
  images: Img[];
  flags: Record<string, boolean>;
  opts: Record<string, string>;
};

export type TypePair = 'moderna' | 'classica' | 'geometrica';
export type Corners = 'reto' | 'suave' | 'arredondado';
export type ButtonStyle = 'solido' | 'contorno';
export type Theme = { brand: string; type: TypePair; corners: Corners; buttons: ButtonStyle };
export type PageMeta = { title: string; slug: string; description: string };
export type Doc = { sections: Section[]; theme: Theme; page: PageMeta };

export const SITE_HOST = 'francal.mediaon.app/';

/* ——— Arte (rótulo e nome de arquivo fictício) ——— */

export const ARTS: { id: ArtId; label: string; file: string }[] = [
  { id: 'par-caramelo', label: 'Par caramelo', file: 'colecao-pv27.jpg' },
  { id: 'scarpin-caramelo', label: 'Scarpin caramelo', file: 'scarpin-couro-vegetal.jpg' },
  { id: 'scarpin-preto', label: 'Scarpin preto', file: 'scarpin-bico-fino.jpg' },
  { id: 'slingback-areia', label: 'Slingback areia', file: 'slingback-areia.jpg' },
  { id: 'detalhe-caramelo', label: 'Detalhe do couro', file: 'detalhe-couro.jpg' },
  { id: 'bolsa-caramelo', label: 'Bolsa tote', file: 'bolsa-tote.jpg' },
  { id: 'clutch-preto', label: 'Clutch verniz', file: 'clutch-verniz.jpg' },
  { id: 'mule-preto', label: 'Mule preto', file: 'mule-salto-bloco.jpg' },
  { id: 'estande', label: 'Estande B-214', file: 'estande-b214.jpg' },
];
export const artOf = (id: ArtId) => ARTS.find((art) => art.id === id) ?? ARTS[0]!;

/* ——— Catálogo (vem da Vitrine; aqui só se escolhe a coleção) ——— */

export type Product = { name: string; price: number; art: ArtId; isNew?: boolean; tag: 'calcado' | 'bolsa' };
export const PRODUCTS: Product[] = [
  { name: 'Scarpin Couro Vegetal', price: 189.9, art: 'scarpin-caramelo', isNew: true, tag: 'calcado' },
  { name: 'Scarpin Bico Fino', price: 214.9, art: 'scarpin-preto', tag: 'calcado' },
  { name: 'Slingback Areia', price: 199.9, art: 'slingback-areia', isNew: true, tag: 'calcado' },
  { name: 'Bolsa Tote Couro', price: 349.9, art: 'bolsa-caramelo', tag: 'bolsa' },
  { name: 'Mule Salto Bloco', price: 179.9, art: 'mule-preto', isNew: true, tag: 'calcado' },
  { name: 'Clutch Verniz', price: 229.9, art: 'clutch-preto', tag: 'bolsa' },
  { name: 'Scarpin Salto Médio', price: 184.9, art: 'par-caramelo', tag: 'calcado' },
  { name: 'Bolsa Tote Areia', price: 339.9, art: 'bolsa-caramelo', isNew: true, tag: 'bolsa' },
];
export const COLLECTIONS = [
  { value: 'lancamentos', label: 'Lançamentos' },
  { value: 'mais-vendidos', label: 'Mais vendidos' },
  { value: 'bolsas', label: 'Bolsas e acessórios' },
] as const;

export function productsFor(collection: string): Product[] {
  if (collection === 'bolsas') return [...PRODUCTS.filter((p) => p.tag === 'bolsa'), ...PRODUCTS.filter((p) => p.tag !== 'bolsa')];
  if (collection === 'mais-vendidos') return [...PRODUCTS].sort((a, b) => a.price - b.price);
  return [...PRODUCTS].sort((a, b) => Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)));
}

/* ——— Biblioteca de seções ——— */

export type FieldDef = { key: string; label: string; multiline?: boolean };
export type OptionDef =
  | { kind: 'switch'; key: string; label: string }
  | { kind: 'segmented'; key: string; label: string; options: { value: string; label: string }[] }
  | { kind: 'select'; key: string; label: string; options: { value: string; label: string }[] };

export type KindMeta = {
  label: string;
  short: string;
  icon: LucideIcon;
  group?: 'Abertura' | 'Catálogo' | 'Estande' | 'Confiança' | 'Conversa';
  locked?: 'top' | 'bottom';
  layouts: { id: string; label: string }[];
  fields: FieldDef[];
  options?: OptionDef[];
  /** Imagens editáveis pela seção (hero: 1, galeria: várias). */
  images?: boolean;
};

export const KINDS: Record<Kind, KindMeta> = {
  cabecalho: {
    label: 'Cabeçalho',
    short: 'Cabeçalho',
    icon: PanelTop,
    locked: 'top',
    layouts: [
      { id: 'classico', label: 'Clássico' },
      { id: 'centralizado', label: 'Centralizado' },
    ],
    fields: [
      { key: 'brand', label: 'Nome da marca' },
      { key: 'cta', label: 'Botão' },
    ],
    options: [{ kind: 'switch', key: 'menu', label: 'Mostrar menu' }],
  },
  hero: {
    label: 'Hero',
    short: 'Hero',
    icon: Star,
    group: 'Abertura',
    layouts: [
      { id: 'dividido', label: 'Dividido' },
      { id: 'centralizado', label: 'Centralizado' },
      { id: 'fundo', label: 'Fundo' },
    ],
    fields: [
      { key: 'eyebrow', label: 'Selo' },
      { key: 'title', label: 'Título' },
      { key: 'subtitle', label: 'Texto', multiline: true },
      { key: 'cta1', label: 'Botão principal' },
      { key: 'cta2', label: 'Botão secundário' },
    ],
    images: true,
  },
  destaques: {
    label: 'Destaques',
    short: 'Destaques',
    icon: Sparkle,
    group: 'Abertura',
    layouts: [
      { id: 'colunas', label: 'Colunas' },
      { id: 'numeros', label: 'Números' },
      { id: 'lista', label: 'Lista' },
    ],
    fields: [{ key: 'title', label: 'Título' }],
  },
  produtos: {
    label: 'Produtos',
    short: 'Produtos',
    icon: LayoutGrid,
    group: 'Catálogo',
    layouts: [
      { id: 'grade', label: 'Grade' },
      { id: 'carrossel', label: 'Carrossel' },
      { id: 'destaque', label: 'Destaque' },
    ],
    fields: [
      { key: 'title', label: 'Título' },
      { key: 'link', label: 'Link' },
    ],
    options: [
      { kind: 'select', key: 'collection', label: 'Coleção', options: [...COLLECTIONS] },
      {
        kind: 'segmented',
        key: 'count',
        label: 'Quantidade',
        options: [
          { value: '3', label: '3' },
          { value: '6', label: '6' },
          { value: '8', label: '8' },
        ],
      },
      { kind: 'switch', key: 'price', label: 'Mostrar preço' },
      { kind: 'switch', key: 'badge', label: 'Selo “Novo”' },
    ],
  },
  programacao: {
    label: 'Programação no estande',
    short: 'Programação',
    icon: CalendarClock,
    group: 'Estande',
    layouts: [
      { id: 'lista', label: 'Lista' },
      { id: 'cartoes', label: 'Cartões' },
    ],
    fields: [
      { key: 'title', label: 'Título' },
      { key: 'subtitle', label: 'Subtítulo' },
    ],
    options: [{ kind: 'switch', key: 'place', label: 'Mostrar local' }],
  },
  galeria: {
    label: 'Galeria',
    short: 'Galeria',
    icon: GalleryHorizontal,
    group: 'Catálogo',
    layouts: [
      { id: 'mosaico', label: 'Mosaico' },
      { id: 'grade', label: 'Grade' },
      { id: 'faixa', label: 'Faixa' },
    ],
    fields: [{ key: 'title', label: 'Título' }],
    images: true,
  },
  depoimentos: {
    label: 'Depoimentos',
    short: 'Depoimentos',
    icon: MessageSquareQuote,
    group: 'Confiança',
    layouts: [
      { id: 'cartoes', label: 'Cartões' },
      { id: 'destaque', label: 'Destaque' },
    ],
    fields: [{ key: 'title', label: 'Título' }],
  },
  marcas: {
    label: 'Marcas e parceiros',
    short: 'Parceiros',
    icon: Handshake,
    group: 'Confiança',
    layouts: [
      { id: 'faixa', label: 'Faixa' },
      { id: 'grade', label: 'Grade' },
    ],
    fields: [{ key: 'title', label: 'Título' }],
  },
  mapa: {
    label: 'Mapa do estande',
    short: 'Mapa do estande',
    icon: MapIcon,
    group: 'Estande',
    layouts: [
      { id: 'planta', label: 'Planta' },
      { id: 'compacto', label: 'Compacto' },
    ],
    fields: [
      { key: 'title', label: 'Título' },
      { key: 'subtitle', label: 'Local' },
      { key: 'address', label: 'Endereço' },
      { key: 'hours', label: 'Horário' },
      { key: 'cta', label: 'Botão' },
    ],
  },
  faq: {
    label: 'Perguntas frequentes',
    short: 'Perguntas frequentes',
    icon: CircleHelp,
    group: 'Conversa',
    layouts: [
      { id: 'acordeao', label: 'Acordeão' },
      { id: 'colunas', label: 'Duas colunas' },
    ],
    fields: [{ key: 'title', label: 'Título' }],
    options: [{ kind: 'switch', key: 'first', label: 'Primeira aberta' }],
  },
  contato: {
    label: 'Contato',
    short: 'Contato',
    icon: Contact,
    group: 'Conversa',
    layouts: [
      { id: 'faixa', label: 'Faixa' },
      { id: 'formulario', label: 'Formulário' },
    ],
    fields: [
      { key: 'title', label: 'Título' },
      { key: 'subtitle', label: 'Texto', multiline: true },
      { key: 'cta', label: 'Botão' },
      { key: 'email', label: 'E-mail' },
      { key: 'phone', label: 'Telefone' },
    ],
  },
  rodape: {
    label: 'Rodapé',
    short: 'Rodapé',
    icon: PanelBottom,
    locked: 'bottom',
    layouts: [
      { id: 'simples', label: 'Simples' },
      { id: 'colunas', label: 'Colunas' },
    ],
    fields: [
      { key: 'brand', label: 'Nome da marca' },
      { key: 'note', label: 'Assinatura' },
    ],
    options: [{ kind: 'switch', key: 'madeWith', label: 'Feito com MediaOn' }],
  },
};

export const LIBRARY_GROUPS = ['Abertura', 'Catálogo', 'Estande', 'Confiança', 'Conversa'] as const;
export const LIBRARY: Kind[] = ['hero', 'destaques', 'produtos', 'galeria', 'programacao', 'mapa', 'depoimentos', 'marcas', 'faq', 'contato'];

/* ——— Conteúdo inicial de cada tipo ——— */

type Seed = Omit<Section, 'id' | 'kind'>;
const base = (over: Partial<Seed>): Seed => ({
  layout: '',
  hidden: false,
  mobile: true,
  bg: 'branco',
  bgArt: 'estande',
  align: 'esquerda',
  spacing: 'medio',
  text: {},
  items: [],
  images: [],
  flags: {},
  opts: {},
  ...over,
});

const SEEDS: Record<Kind, () => Seed> = {
  cabecalho: () =>
    base({
      layout: 'classico',
      spacing: 'compacto',
      text: { brand: 'Aurora Calçados', cta: 'Agendar visita' },
      flags: { menu: true },
    }),
  hero: () =>
    base({
      layout: 'dividido',
      text: {
        eyebrow: 'Francal 2026 · Estande B-214',
        title: 'Coleção Primavera-Verão 2027',
        subtitle:
          'Scarpins, mules e slingbacks em couro vegetal, feitos em Franca. Conheça a coleção no estande e feche seu pedido com condições de feira.',
        cta1: 'Ver coleção',
        cta2: 'Agendar visita',
      },
      images: [{ art: 'par-caramelo', alt: 'Par de scarpins caramelo da coleção Primavera-Verão 2027', fit: 'preencher' }],
    }),
  destaques: () =>
    base({
      layout: 'colunas',
      bg: 'suave',
      text: { title: 'Por que visitar o estande' },
      items: [
        { value: '28 anos', title: 'Fábrica própria em Franca', text: 'Do corte ao acabamento, cada par passa por 42 etapas na nossa fábrica.' },
        { value: '12 pares', title: 'Pedido mínimo flexível', text: 'Grade de numeração livre do 33 ao 40, por modelo.' },
        { value: '30 dias', title: 'Entrega rápida', text: 'Pedidos fechados na feira saem da fábrica em até 30 dias.' },
      ],
    }),
  produtos: () =>
    base({
      layout: 'grade',
      text: { title: 'Lançamentos', link: 'Ver catálogo completo' },
      flags: { price: true, badge: true },
      opts: { collection: 'lancamentos', count: '6' },
    }),
  programacao: () =>
    base({
      layout: 'lista',
      bg: 'suave',
      text: { title: 'Programação no estande', subtitle: '14 a 17 de outubro · Pavilhão Azul, estande B-214' },
      items: [
        { day: '14', month: 'out', time: '10:00', title: 'Lançamento da coleção Primavera-Verão 2027', place: 'Estande B-214' },
        { day: '14', month: 'out', time: '15:30', title: 'Desfile com as novas formas de salto', place: 'Passarela do Pavilhão Azul' },
        { day: '15', month: 'out', time: '11:00', title: 'Rodada de negócios com lojistas', place: 'Sala 3 · Mezanino' },
        { day: '16', month: 'out', time: '14:00', title: 'Oficina de cuidados com couro vegetal', place: 'Estande B-214' },
      ],
      flags: { place: true },
    }),
  galeria: () =>
    base({
      layout: 'mosaico',
      text: { title: 'Bastidores do estande' },
      images: [
        { art: 'estande', alt: 'Estande B-214 da Aurora Calçados no Pavilhão Azul', fit: 'preencher' },
        { art: 'scarpin-preto', alt: 'Scarpin bico fino preto', fit: 'preencher' },
        { art: 'bolsa-caramelo', alt: 'Bolsa tote em couro caramelo', fit: 'preencher' },
        { art: 'detalhe-caramelo', alt: 'Detalhe do couro vegetal', fit: 'preencher' },
        { art: 'clutch-preto', alt: 'Clutch em verniz preto', fit: 'preencher' },
      ],
    }),
  depoimentos: () =>
    base({
      layout: 'cartoes',
      bg: 'suave',
      text: { title: 'O que dizem os lojistas' },
      items: [
        {
          quote: 'Os scarpins da Aurora giram em duas semanas na loja. Fechamos o pedido de verão ainda no estande.',
          name: 'Juliana Prates',
          role: 'Sapataria Ladeira · Salvador, BA',
        },
        {
          quote: 'Grade completa de numeração e reposição rápida. É a marca que mais vende na nossa vitrine.',
          name: 'Rafael Dias',
          role: 'Bottega Jardins · São Paulo, SP',
        },
        {
          quote: 'O couro vegetal virou argumento de venda. As clientes perguntam a origem e a Aurora tem a resposta.',
          name: 'Clara Souto',
          role: 'Calçados Vila Rica · Novo Hamburgo, RS',
        },
      ],
    }),
  marcas: () =>
    base({
      layout: 'faixa',
      align: 'centro',
      spacing: 'compacto',
      text: { title: 'Lojas parceiras' },
      items: [
        { name: 'Pátio Couro' },
        { name: 'Bella Passo' },
        { name: 'Couro Nobre' },
        { name: 'Ateliê Sul' },
        { name: 'Lume Acessórios' },
        { name: 'Casa Forma' },
      ],
    }),
  mapa: () =>
    base({
      layout: 'planta',
      text: {
        title: 'Como chegar ao estande',
        subtitle: 'Pavilhão Azul · Rua B · Estande 214',
        address: 'Expo Center Norte · São Paulo, SP',
        hours: '14 a 17/10 · 10h às 19h',
        cta: 'Abrir mapa da feira',
      },
    }),
  faq: () =>
    base({
      layout: 'acordeao',
      text: { title: 'Perguntas frequentes' },
      items: [
        { q: 'Qual o pedido mínimo?', a: '12 pares por modelo, com grade de numeração livre do 33 ao 40.' },
        { q: 'Há condições especiais na Francal?', a: 'Pedidos fechados no estande têm 8% de desconto e frete grátis acima de 60 pares.' },
        { q: 'Qual o prazo de entrega?', a: 'Até 30 dias após a confirmação do pedido, para todo o Brasil.' },
        { q: 'Vocês atendem fora da feira?', a: 'Sim. Nossos representantes visitam lojistas em 18 estados.' },
      ],
      flags: { first: true },
    }),
  contato: () =>
    base({
      layout: 'faixa',
      bg: 'marca',
      text: {
        title: 'Agende sua visita ao estande',
        subtitle: 'Reserve um horário com a equipe comercial durante a Francal 2026.',
        cta: 'Agendar visita',
        email: 'comercial@auroracalcados.com.br',
        phone: '(16) 3712-4500',
      },
    }),
  rodape: () =>
    base({
      layout: 'simples',
      spacing: 'compacto',
      text: { brand: 'Aurora Calçados', note: '© 2026 Aurora Calçados · Franca, SP' },
      flags: { madeWith: true },
    }),
};

export const makeSection = (kind: Kind, id: string): Section => ({ id, kind, ...SEEDS[kind]() });

export const START_DOC: Doc = {
  sections: [
    makeSection('cabecalho', 's-cabecalho'),
    makeSection('hero', 's-hero'),
    makeSection('destaques', 's-destaques'),
    makeSection('produtos', 's-produtos'),
    makeSection('programacao', 's-programacao'),
    makeSection('galeria', 's-galeria'),
    { ...makeSection('depoimentos', 's-depoimentos'), hidden: true },
    makeSection('contato', 's-contato'),
    makeSection('rodape', 's-rodape'),
  ],
  theme: { brand: '#0B7285', type: 'moderna', corners: 'suave', buttons: 'solido' },
  page: {
    title: 'Aurora Calçados · Francal 2026',
    slug: 'aurora',
    description: 'Coleção Primavera-Verão 2027 em couro vegetal. Visite o estande B-214 no Pavilhão Azul, de 14 a 17 de outubro.',
  },
};

/* ——— Tema ——— */

export const BRAND_SWATCHES = [
  { hex: '#0B7285', label: 'Petróleo' },
  { hex: '#2F7A55', label: 'Verde' },
  { hex: '#9A5B34', label: 'Couro' },
  { hex: '#B23A48', label: 'Vinho' },
  { hex: '#3E5BA9', label: 'Índigo' },
  { hex: '#2B303B', label: 'Grafite' },
];

export const TYPE_PAIRS: { id: TypePair; label: string; fonts: string }[] = [
  { id: 'moderna', label: 'Moderna', fonts: 'Inter' },
  { id: 'classica', label: 'Clássica', fonts: 'Palatino · Inter' },
  { id: 'geometrica', label: 'Geométrica', fonts: 'Avenir · Inter' },
];

/* ——— Caminhos de texto (seção.text.chave / seção.items.i.chave) ——— */

export function readPath(section: Section, path: string): string {
  const [root, a, b] = path.split('.');
  if (root === 'text' && a) return section.text[a] ?? '';
  if (root === 'items' && a !== undefined && b) return section.items[Number(a)]?.[b] ?? '';
  return '';
}

export function writePath(section: Section, path: string, value: string): Section {
  const [root, a, b] = path.split('.');
  if (root === 'text' && a) return { ...section, text: { ...section.text, [a]: value } };
  if (root === 'items' && a !== undefined && b) {
    const index = Number(a);
    return { ...section, items: section.items.map((item, i) => (i === index ? { ...item, [b]: value } : item)) };
  }
  return section;
}

/* ——— Texto rico mínimo: negrito, itálico e link ——— */

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };

/** HTML do texto editável → texto puro (para os campos do painel). */
export function plain(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (match) => ENTITIES[match] ?? match);
}

export function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const safeHref = (href: string) => (/^(https?:|mailto:|tel:|#|\/)/i.test(href.trim()) ? href.trim().replace(/"/g, '%22') : '#');

/** Mantém só <b>, <strong>, <i>, <em>, <a href> e <br>. */
export function cleanHtml(html: string) {
  return html
    .replace(/<a\s[^>]*?href="([^"]*)"[^>]*>/gi, (_match, href: string) => `<a href="${safeHref(href)}">`)
    .replace(/<(?!\/?(?:b|strong|i|em|a|br)\b)[^>]*>/gi, '')
    .replace(/<(b|strong|i|em|br)\s[^>]*>/gi, '<$1>')
    .replace(/&nbsp;/g, ' ')
    .replace(/<br>$/i, '');
}

/* ——— Cor ——— */

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}
export function contrast(a: string, b: string) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/* ——— Moldes de miniatura (wireframe chapado) ———
 * Cada forma: [tipo, x, y, w, h]. Tipos: h título · l linha · b bloco/imagem · a botão (acento) ·
 * s botão em contorno · p cartão de papel · o círculo (x, y = centro; w = raio). viewBox 120×76.
 */
export type Shape = ['h' | 'l' | 'b' | 'a' | 's' | 'p' | 'o', number, number, number, number?];

const cols3 = (y: number, h: number, kind: Shape[0] = 'b'): Shape[] => [
  [kind, 10, y, 30, h],
  [kind, 45, y, 30, h],
  [kind, 80, y, 30, h],
];

export const WIREFRAMES: Record<string, Shape[]> = {
  'cabecalho/classico': [
    ['o', 16, 38, 5],
    ['h', 25, 36, 22, 4],
    ['l', 54, 37, 10, 3],
    ['l', 67, 37, 10, 3],
    ['l', 80, 37, 8, 3],
    ['a', 93, 33, 19, 9],
  ],
  'cabecalho/centralizado': [
    ['o', 50, 28, 5],
    ['h', 58, 26, 20, 4],
    ['l', 34, 44, 10, 3],
    ['l', 48, 44, 10, 3],
    ['l', 62, 44, 10, 3],
    ['l', 76, 44, 10, 3],
  ],
  'hero/dividido': [
    ['l', 10, 14, 26, 3],
    ['h', 10, 22, 44, 5],
    ['h', 10, 30, 34, 5],
    ['l', 10, 40, 44, 3],
    ['l', 10, 46, 38, 3],
    ['a', 10, 55, 20, 8],
    ['s', 33, 55, 20, 8],
    ['b', 64, 10, 46, 56],
  ],
  'hero/centralizado': [
    ['h', 28, 10, 64, 5],
    ['h', 38, 18, 44, 5],
    ['l', 32, 28, 56, 3],
    ['a', 39, 35, 20, 7],
    ['s', 62, 35, 20, 7],
    ['b', 10, 48, 100, 22],
  ],
  'hero/fundo': [
    ['b', 0, 0, 120, 76],
    ['p', 10, 14, 56, 48],
    ['h', 16, 22, 40, 5],
    ['h', 16, 30, 30, 5],
    ['l', 16, 40, 42, 3],
    ['a', 16, 48, 20, 7],
  ],
  'destaques/colunas': [
    ['h', 10, 10, 44, 5],
    ['o', 15, 30, 4],
    ['o', 50, 30, 4],
    ['o', 85, 30, 4],
    ...cols3(39, 4, 'h'),
    ...cols3(47, 3, 'l'),
    ...cols3(53, 3, 'l'),
  ],
  'destaques/numeros': [
    ['h', 10, 10, 44, 5],
    ['a', 10, 28, 20, 9],
    ['a', 45, 28, 20, 9],
    ['a', 80, 28, 20, 9],
    ...cols3(44, 4, 'h'),
    ...cols3(52, 3, 'l'),
  ],
  'destaques/lista': [
    ['h', 10, 10, 44, 5],
    ['o', 15, 28, 4],
    ['h', 24, 26, 40, 4],
    ['l', 24, 32, 60, 3],
    ['o', 15, 45, 4],
    ['h', 24, 43, 36, 4],
    ['l', 24, 49, 64, 3],
    ['o', 15, 62, 4],
    ['h', 24, 60, 44, 4],
    ['l', 24, 66, 56, 3],
  ],
  'produtos/grade': [
    ['h', 10, 9, 34, 5],
    ['l', 86, 10, 24, 3],
    ...cols3(20, 24),
    ...cols3(47, 3, 'l'),
    ...cols3(54, 3, 'h'),
  ],
  'produtos/carrossel': [
    ['h', 10, 9, 34, 5],
    ['o', 98, 11, 3],
    ['o', 106, 11, 3],
    ['b', 10, 20, 38, 30],
    ['b', 52, 20, 38, 30],
    ['b', 94, 20, 26, 30],
    ['l', 10, 54, 28, 3],
    ['l', 52, 54, 28, 3],
    ['l', 94, 54, 20, 3],
  ],
  'produtos/destaque': [
    ['h', 10, 9, 34, 5],
    ['b', 10, 20, 48, 48],
    ['b', 62, 20, 23, 22],
    ['b', 88, 20, 22, 22],
    ['b', 62, 46, 23, 22],
    ['b', 88, 46, 22, 22],
  ],
  'programacao/lista': [
    ['h', 10, 9, 50, 5],
    ['a', 10, 22, 12, 12],
    ['h', 27, 23, 50, 4],
    ['l', 27, 30, 34, 3],
    ['a', 10, 40, 12, 12],
    ['h', 27, 41, 44, 4],
    ['l', 27, 48, 30, 3],
    ['a', 10, 58, 12, 12],
    ['h', 27, 59, 56, 4],
    ['l', 27, 66, 34, 3],
  ],
  'programacao/cartoes': [
    ['h', 10, 9, 50, 5],
    ['p', 10, 20, 48, 23],
    ['p', 62, 20, 48, 23],
    ['p', 10, 47, 48, 23],
    ['p', 62, 47, 48, 23],
    ['a', 15, 25, 12, 4],
    ['a', 67, 25, 12, 4],
    ['a', 15, 52, 12, 4],
    ['a', 67, 52, 12, 4],
    ['l', 15, 33, 34, 3],
    ['l', 67, 33, 34, 3],
    ['l', 15, 60, 34, 3],
    ['l', 67, 60, 34, 3],
  ],
  'galeria/mosaico': [
    ['h', 10, 9, 40, 5],
    ['b', 10, 20, 50, 48],
    ['b', 63, 20, 22, 22],
    ['b', 88, 20, 22, 22],
    ['b', 63, 46, 22, 22],
    ['b', 88, 46, 22, 22],
  ],
  'galeria/grade': [['h', 10, 9, 40, 5], ...cols3(20, 22), ...cols3(46, 22)],
  'galeria/faixa': [
    ['h', 10, 12, 40, 5],
    ['b', 10, 26, 24, 36],
    ['b', 37, 26, 24, 36],
    ['b', 64, 26, 24, 36],
    ['b', 91, 26, 29, 36],
  ],
  'depoimentos/cartoes': [
    ['h', 10, 9, 44, 5],
    ['p', 10, 20, 30, 48],
    ['p', 45, 20, 30, 48],
    ['p', 80, 20, 30, 48],
    ...cols3(27, 3, 'l'),
    ...cols3(33, 3, 'l'),
    ['o', 18, 56, 4],
    ['o', 53, 56, 4],
    ['o', 88, 56, 4],
  ],
  'depoimentos/destaque': [
    ['l', 52, 14, 16, 4],
    ['h', 22, 24, 76, 5],
    ['h', 30, 32, 60, 5],
    ['h', 40, 40, 40, 5],
    ['o', 60, 56, 5],
    ['l', 48, 65, 24, 3],
  ],
  'marcas/faixa': [
    ['h', 40, 18, 40, 4],
    ['b', 10, 36, 18, 10],
    ['b', 30, 36, 18, 10],
    ['b', 51, 36, 18, 10],
    ['b', 72, 36, 18, 10],
    ['b', 92, 36, 18, 10],
  ],
  'marcas/grade': [
    ['h', 10, 9, 40, 5],
    ['p', 10, 20, 30, 22],
    ['p', 45, 20, 30, 22],
    ['p', 80, 20, 30, 22],
    ['p', 10, 46, 30, 22],
    ['p', 45, 46, 30, 22],
    ['p', 80, 46, 30, 22],
  ],
  'mapa/planta': [
    ['b', 10, 10, 64, 56],
    ['a', 46, 30, 10, 8],
    ['h', 80, 14, 30, 5],
    ['l', 80, 24, 28, 3],
    ['l', 80, 30, 24, 3],
    ['s', 80, 40, 28, 8],
  ],
  'mapa/compacto': [
    ['p', 10, 14, 100, 48],
    ['b', 16, 20, 36, 36],
    ['a', 30, 34, 8, 6],
    ['h', 58, 22, 40, 5],
    ['l', 58, 32, 36, 3],
    ['l', 58, 38, 30, 3],
    ['s', 58, 46, 26, 7],
  ],
  'faq/acordeao': [
    ['h', 10, 9, 44, 5],
    ['h', 10, 22, 70, 4],
    ['l', 10, 29, 90, 3],
    ['l', 10, 34, 70, 3],
    ['b', 10, 41, 100, 1],
    ['h', 10, 47, 60, 4],
    ['b', 10, 56, 100, 1],
    ['h', 10, 62, 66, 4],
  ],
  'faq/colunas': [
    ['h', 10, 9, 44, 5],
    ['h', 10, 24, 44, 4],
    ['l', 10, 31, 44, 3],
    ['l', 10, 36, 34, 3],
    ['h', 64, 24, 44, 4],
    ['l', 64, 31, 44, 3],
    ['l', 64, 36, 30, 3],
    ['h', 10, 50, 40, 4],
    ['l', 10, 57, 44, 3],
    ['h', 64, 50, 40, 4],
    ['l', 64, 57, 40, 3],
  ],
  'contato/faixa': [
    ['b', 6, 18, 108, 40],
    ['h', 14, 28, 50, 5],
    ['l', 14, 37, 40, 3],
    ['l', 14, 43, 30, 3],
    ['a', 82, 32, 24, 9],
  ],
  'contato/formulario': [
    ['h', 10, 12, 40, 5],
    ['l', 10, 22, 36, 3],
    ['l', 10, 30, 30, 3],
    ['l', 10, 36, 34, 3],
    ['p', 60, 10, 50, 10],
    ['p', 60, 24, 50, 10],
    ['p', 60, 38, 50, 16],
    ['a', 60, 58, 22, 8],
  ],
  'rodape/simples': [
    ['o', 15, 38, 4],
    ['h', 22, 36, 24, 4],
    ['l', 54, 37, 30, 3],
    ['o', 96, 38, 3],
    ['o', 105, 38, 3],
  ],
  'rodape/colunas': [
    ['o', 14, 18, 4],
    ['h', 21, 16, 22, 4],
    ['l', 10, 26, 34, 3],
    ['h', 56, 16, 14, 3],
    ['l', 56, 24, 14, 3],
    ['l', 56, 30, 12, 3],
    ['h', 76, 16, 14, 3],
    ['l', 76, 24, 14, 3],
    ['l', 76, 30, 12, 3],
    ['h', 96, 16, 14, 3],
    ['l', 96, 24, 12, 3],
    ['b', 10, 48, 100, 1],
    ['l', 10, 56, 40, 3],
  ],
};
