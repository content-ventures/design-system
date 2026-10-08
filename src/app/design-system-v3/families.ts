import {
  Blocks,
  ChartColumnBig,
  Compass,
  GitCompareArrows,
  Images,
  LayoutPanelLeft,
  LayoutTemplate,
  Layers,
  MessageSquareDot,
  MousePointerClick,
  Palette,
  PenLine,
  Sparkles,
  Table2,
  TextCursorInput,
  type LucideIcon,
} from 'lucide-react';
import { inventory } from '../inventory';

/** Família do inventário no catálogo: ícone do menu e nome curto (cabe no menu sem reticências). */
export type FamilyMeta = { icon: LucideIcon; label: string };

export const families: Record<string, FamilyMeta> = {
  fundamentos: { icon: Palette, label: 'Fundamentos' },
  acoes: { icon: MousePointerClick, label: 'Botões e ações' },
  formularios: { icon: TextCursorInput, label: 'Formulários' },
  navegacao: { icon: Compass, label: 'Navegação' },
  estrutura: { icon: LayoutPanelLeft, label: 'Estrutura' },
  dados: { icon: Table2, label: 'Dados e tabelas' },
  graficos: { icon: ChartColumnBig, label: 'Gráficos' },
  feedback: { icon: MessageSquareDot, label: 'Feedback' },
  camadas: { icon: Layers, label: 'Modais e camadas' },
  midia: { icon: Images, label: 'Mídia e arquivos' },
  editor: { icon: PenLine, label: 'Editor' },
  ia: { icon: Sparkles, label: 'IA' },
  revisao: { icon: GitCompareArrows, label: 'Revisão' },
  padroes: { icon: Blocks, label: 'Padrões' },
  templates: { icon: LayoutTemplate, label: 'Templates' },
};

export function familyOf(groupId: string): FamilyMeta {
  return (
    families[groupId] ?? {
      icon: Blocks,
      label: inventory.find((group) => group.id === groupId)?.label ?? groupId,
    }
  );
}

/** Os itens em ordem de leitura, com a família de cada um (`groupLabel` = nome curto). */
export const catalogItems = inventory.flatMap((group) =>
  group.items.map((item) => ({
    ...item,
    groupId: group.id,
    groupLabel: familyOf(group.id).label,
  })),
);
export type CatalogItem = (typeof catalogItems)[number];
