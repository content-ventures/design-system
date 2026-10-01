import type { ComponentType } from 'react';
import { specimens as acoes } from './acoes';
import { specimens as camadas } from './camadas';
import { specimens as dados } from './dados';
import { specimens as estrutura } from './estrutura';
import { specimens as feedback } from './feedback';
import { specimens as formulariosA } from './formularios-a';
import { specimens as formulariosB } from './formularios-b';
import { specimens as fundamentos } from './fundamentos';
import { specimens as graficos } from './graficos';
import { specimens as midia } from './midia';
import { specimens as navegacao } from './navegacao';
import { specimens as padroesA } from './padroes-a';
import { specimens as padroesB } from './padroes-b';
import { specimens as pageBuilder } from './page-builder';
import { specimens as templates } from './templates';

/** Prancha de cada item do inventário (id → componente). Item sem prancha aparece como “Em desenho”. */
export const specimens: Record<string, ComponentType> = {
  ...fundamentos,
  ...acoes,
  ...formulariosA,
  ...formulariosB,
  ...navegacao,
  ...estrutura,
  ...dados,
  ...graficos,
  ...feedback,
  ...camadas,
  ...midia,
  ...padroesA,
  ...padroesB,
  ...templates,
  // Editor da vitrine refeito como page builder por seções; substitui a prancha antiga de padroes-b.
  ...pageBuilder,
};

/**
 * @deprecated O catálogo não tem mais texto de apoio por item (lede, “Quando usar”, “Evite”).
 * O tipo fica só para pranchas antigas que ainda o importam; nenhum `docs` é lido.
 */
export type ItemDoc = {
  lede?: string;
  use?: string;
  states?: string;
  keyboard?: string;
  avoid?: string;
};
