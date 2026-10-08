import type { ComponentType } from 'react';
import { specimens as acoes } from './acoes';
import { specimens as camadas } from './camadas';
import { specimens as dados } from './dados';
import { specimens as editorProse } from './editor-prose';
import { specimens as editorToolbar } from './editor-toolbar';
import { specimens as estrutura } from './estrutura';
import { specimens as estruturaLayout } from './estrutura-layout';
import { specimens as feedback } from './feedback';
import { specimens as formulariosA } from './formularios-a';
import { specimens as formulariosB } from './formularios-b';
import { specimens as fundamentos } from './fundamentos';
import { specimens as fundamentosLeitura } from './fundamentos-leitura';
import { specimens as graficos } from './graficos';
import { specimens as iaAgent } from './ia-agent';
import { specimens as iaCopiloto } from './ia-copiloto';
import { specimens as iaSugestao } from './ia-sugestao';
import { specimens as midia } from './midia';
import { specimens as midiaSlides } from './midia-slides';
import { specimens as midiaTranscricao } from './midia-transcricao';
import { specimens as navegacao } from './navegacao';
import { specimens as padroesA } from './padroes-a';
import { specimens as padroesB } from './padroes-b';
import { specimens as pageBuilder } from './page-builder';
import { specimens as revisaoDiferencas } from './revisao-diferencas';
import { specimens as templates } from './templates';

/** Prancha de cada item do inventário (id → componente). Item sem prancha aparece como “Em desenho”. */
export const specimens: Record<string, ComponentType> = {
  ...fundamentos,
  ...fundamentosLeitura,
  ...acoes,
  ...formulariosA,
  ...formulariosB,
  ...navegacao,
  ...estrutura,
  ...estruturaLayout,
  ...dados,
  ...graficos,
  ...feedback,
  ...camadas,
  ...midia,
  ...midiaTranscricao,
  ...midiaSlides,
  ...editorProse,
  ...editorToolbar,
  ...iaCopiloto,
  ...iaAgent,
  ...iaSugestao,
  ...revisaoDiferencas,
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
