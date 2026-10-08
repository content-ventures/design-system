# Changelog

Todas as mudanças relevantes deste pacote serão registradas aqui.

O projeto segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [0.2.0] - 2026-10-07

Famílias editoriais para o estúdio do Reporter IA. Nenhuma API foi removida nem renomeada; as mudanças
de aparência e de comportamento estão em “Alterado” e, quando pedem ação de quem consome, em “Migração”.

### Adicionado

- estrutura: `Grid`/`GridItem` (grade em proporção ou automática) e `WorkspaceLayout` com
  `WorkspaceToggle` e `useWorkspace` (moldura de estúdio com painéis redimensionáveis, trilho, foco, F6 e
  abas abaixo de 1024 px);
- editor: `Prose` (tipografia de leitura, figuras `figure > img + figcaption` e crédito de citação, e
  ganchos `data-*` para IA, fonte, diferença e marca-texto), `EditableTitle`, `Toolbar` (`ToolbarGroup`,
  `ToolbarButton`, `ToolbarToggle`, `ToolbarMenu`, `ToolbarSeparator`) e `FloatingToolbar`;
- IA: `PromptComposer` e `PromptModelMenu`, `Conversation`, `ConversationTurn` e `ConversationArtifact`,
  `AgentTrace`, `SourceChip` e `SuggestionCard`, `SuggestionBar` e `SuggestionGroup`;
- revisão: `DiffView` (com `diffStats` e `formatDiffSummary`) e `Seal`;
- mídia: `TranscriptViewer` (com `formatTimestamp`), `SlideStrip` e `SlideCanvas` (com `slideSlots`,
  `slideOverflowMessage` e `SLIDE_SLOT_LABELS`);
- `ProgressSteps`: estados `error` e `skipped`, campos `id` e `detail`, `variant="trace"`, `className` e tipo
  `ProgressStepState`;
- Inter itálico 400/500/600 (faces oficiais do mesmo commit) em `interV3`;
- tokens de leitura `--t-prose-*`, `--prose-measure`, `--prose-space-block` e `--prose-space-section`;
- papéis neutros de diferença `--diff-insert-*` e `--diff-delete-*` e marca-textos `--mark-*`;
- ícones do editor, da IA, de revisão e de mídia em `icons.ts` (nomes canônicos do lucide);
- auxiliares `formatRelative` e `textStats`;
- `Metric` com `href`, `linkAs` e `onClick`; `ListItem` com `icon`; `CopyButton` público com `reveal`;
- `AppShell bleed` (área de trabalho encostada de ponta a ponta, sem respiro nem largura máxima);
- `Prose size="sm"` e tokens `--t-prose-*-sm` (escala de trabalho do estúdio de escrita, corpo 15/25);
- `SaveIndicator` (o estado de salvamento da `ActionBar`, solto para linhas de status e barras);
- `Toolbar end` (estado do documento encostado à direita, fora do roving e do “Mais”);
- `proseWidgets` (subpath `v3/prose-widgets`, sem React e sem editor):
  `insertion(texto, { stale, streaming, label })`, `caret()`, `skeleton(linhas)` e
  `gutterMarker('ai', { label, onActivate, focusable })` devolvem DOM com `contenteditable="false"` para
  `Decoration.widget`; constante `PROSE_WIDGET_ATTR` e tipos `ProseWidgets`, `ProseWidgetKind`, `ProseWidgetOptions`,
  `ProseInsertionOptions`, `ProseGutterMarkerKind` e `ProseGutterMarkerOptions`;
- `Prose`: o bloco da IA não revisado leva o Sparkles de 12 px na calha (sem fio lateral), só na escrita
  (`read` e `compact` não marcam); ganchos `[data-ai="writing"]` (o bloco que a IA escreve agora),
  `[data-ai-marker]` (marcador clicável com dica e estados `data-force`),
  `[data-source-state="missing"]` (citação que não bate: ondulado `--red-dot` e “Falta:” para leitor de
  tela; `used` sem estilo), `figure > img[data-missing]` e `img[data-loading]` (moldura funda com
  “Imagem indisponível”, ou pulsando enquanto carrega);
- `Prose overscroll` (padrão em `edit`): 60% da altura da janela depois do fim, para o último bloco ou o
  alvo de um salto subir ao terço superior;
- `PageHeader` (`variant="frame"`): `steps` (régua na linha do título; o título trunca antes da régua
  perder os nomes), `stepsCompact` (no lugar da régua em ≤640 px, por container query) e `notice` (aviso
  `Banner inline` em bloco logo abaixo da linha, sem empurrar a moldura encostada);
- `StepState` `active` (“em andamento”): a etapa do trabalho quando a régua mostra outra — anel e
  número azuis, navegável por padrão; segmento `--b-400` no `StepperCompact`;
- `StepItem.reason`: motivo da etapa na dica do DS e em `aria-describedby`; numa régua navegável, a
  etapa fora de alcance com motivo fica focável (`aria-disabled`) e não navega; nomes escondidos pela
  largura ganham dica (`Stepper` e `StepList`; `force: 'tip'` nas pranchas);
- `Tooltip`: `bare` (o filho é a âncora, sem caixa própria) e `describe` (liga ou não a dica como
  `aria-describedby`);
- `MediaFrame` e `SlideCanvas`: `maxHeight` (teto de altura na proporção; o quadro estreita e centra) e
  `fitHeight` (cabe na altura visível da área que rola em volta, menos o que vem antes e a legenda; piso
  de 240 px);
- `Gallery fitHeight`: o palco para na altura visível da área que rola em volta (menos o que vem antes e a
  faixa de miniaturas, piso de 240 px) e a peça aparece inteira — um slide 4:5 num painel largo e baixo;
- `Metric`: `sparkline` opcional (`{ points, label }`, cinza, ao lado do valor ou em linha própria no
  celular) e `meter.tone`; `Sparkline fluid`; `Meter tone="neutral"` e o tipo `MeterTone`;
- subpaths `v3/format` e `v3/prose-widgets` (arquivos `.ts`, fora do padrão `v3/*` de `.tsx`);
- `ListItem titleLines` (`1 | 2`): título em até duas linhas antes das reticências;
- `List bleed` (sem contorno, dentro de seção): as linhas sangram o respiro e o texto alinha ao título;
- `AgentTrace` compacto com `preview` (o trecho sendo escrito, numa segunda linha) e `action` (no fim da
  linha, depois da contagem);
- `Conversation` segue o fim e só oferece “Ir para o fim” quando a pessoa rola para cima: o evento da
  própria ida ao fim, que chega depois de o conteúdo crescer, não solta mais o acompanhamento;
- famílias Editor, IA e Revisão no catálogo, e pranchas de grade, área de trabalho, transcrição e slides;
- `TruncatedText`: texto de uma linha que corta com reticência e, só quando cortou, mostra o inteiro numa
  `Tooltip` do DS (no lugar do `title` nativo); `Tooltip disabled` (mesma árvore e mesma referência, nada
  abre);
- `FloatingToolbar follow`: relê o trecho a cada quadro enquanto aberta e acompanha um trecho que cresce
  ou se move sem rolagem (um widget que entra no parágrafo);
- `Prose`: gancho `[data-bar-space="below"]` — o bloco abre embaixo o vão da `FloatingToolbar` que decide
  sobre ele (altura da barra mais 8 px de cada lado; anima em `--dur-2`, na hora sem movimento), e a barra
  nunca cobre a linha seguinte;
- `FormSection titleAs` (`h2 | h3 | h4`, padrão `h3`) e `Disclosure headingLevel`: o nível do título muda,
  o tamanho não;
- `Select autoFocus`: marca o gatilho com `[data-autofocus]`, e a gaveta ou o diálogo que abre leva o foco
  ao campo que pede a decisão;
- `Skeleton`: gancho estável `[data-skeleton]` em cada bloco (o produto confere “a tela carregou” por ele,
  não por `data-shape`, que outras peças também usam);
- `SaveIndicator data-force` (estados parados de “Tentar de novo”: `hover`, `focus`) e o anel de foco do
  botão;
- `NumberField fit`: largura do conteúdo — o campo reserva os dígitos do máximo (mais os botões) em vez de
  esticar na coluna;
- `NavItem.soon` (`true | { label?, reason? }`, tipo `NavSoon`): item do menu lateral que ainda não abre —
  ícone e nome esmaecidos, selo `Badge` “Em breve” no lugar da contagem, botão `aria-disabled` que não
  navega nem fecha a gaveta, motivo na dica do DS e em `aria-describedby` (recolhido: “Rótulo · Em breve”
  e o motivo na dica lateral); nunca é o ativo. `force: 'tip'` abre a dica nas pranchas.

### Alterado

- `WorkspaceLayout`: cabeçalho de uma linha com 48 px (era 56) — a altura vai para o texto.
- `WorkspaceLayout` estreito: a coluna lateral inativa some inteira e não captura toque sobre o texto.
- `Stepper size="sm"` mantém os rótulos até ~420 px de largura (os demais tamanhos seguem em 640).
- `Prose`: `[data-source-active]` é marca-texto de fundo em trecho (`span`), não mais faixa por
  sublinhado no bloco — sob a seleção de texto o navegador repintava a faixa na cor do texto.
- `Meter` e a barra do `Metric` são cinza (`neutral`) por padrão; antes eram azuis. Âmbar ou vermelho só
  quando o número pede atenção, verde quando completo, azul nunca.
- `MetricStrip`: a última linha reparte a largura entre as células que sobram (5 indicadores viram 3 + 2
  ou 2 + 2 + 1, sem célula vazia).
- Gráficos: a tabela para leitor de tela fica dentro de uma `div` visualmente oculta (a `table` não
  encolhia e abria rolagem lateral em 390 px). `Sparkline` sem pontos não desenha nada.
- `IconButton`: o nome aparece na dica do DS, nunca em `title` nativo; `title` troca o texto da dica e
  vira descrição, `title=""` desliga a dica (um `Tooltip` em volta já passa isso e vale o dele).
  `SplitButton` herda.
- `Tooltip`: clique de mouse fecha a dica, salvo num controle indisponível (lá a dica é o motivo).
- `title` nativo trocado pela dica do DS em `Stepper`, `Toast`, chip de anexo, botões de dispensar,
  “Marcar como lida” das notificações, controles de vídeo, segmentos só com ícone e miniaturas da
  galeria (e, entre os novos, `SlideStrip` e `SourceChip`; o ponto de problema do slide é lido pela
  descrição dele).
- Campos irmãos no corpo de `Section` e `Drawer` ganham 20 px entre si (o mesmo ritmo do `FieldGroup`);
  grades e pilhas com espaçamento próprio não mudam. O corpo do `Drawer` ganha `data-part="drawer-body"`.
- `AppShell` com `layout="auto"` e o ponto de quebra padrão (1200): gaveta fechada decidida no CSS
  (`@container shell`), igual no HTML do servidor e na primeira pintura; `layout="drawer"` já sai como
  gaveta do servidor; o shell expõe `data-layout`. Com `breakpoint` próprio a decisão continua medida
  no cliente.
- `FilterBar`: empilhar é decidido pela quebra de linha do CSS, igual no servidor e no cliente (sem
  medida no cliente e sem `data-stacked`); a busca parte de 220 px lado a lado e vai a 320 px empilhada.
- `Tooltip` e a dica do menu lateral recolhido ficam claros (papel, fio e `--shadow-md`), como manda o
  contrato §7;
- `ResizablePanels`: a alça é a mesma do `WorkspaceLayout`; reabrir um painel recolhido por arrasto volta
  à largura de antes, e Esc durante o arrasto não chega a outros atalhos;
- `FilterBar`: `filtersOpen` e `onFiltersOpenChange` ficam opcionais com `filters={false}`
  (retrocompatível; novo tipo `FilterBarProps`).
- `title` nativo trocado pela dica do DS também na trilha (`Breadcrumb`: nível que corta e “…” dos níveis
  ocultos), no título do `PageHeader` que corta, no `CopyButton`, na alça “Mostrar” do `SplitPane`, na
  célula `truncate` da `DataTable`, no valor da `DescriptionList` em faixa, no primeiro item do `MetaList`
  numa linha e no `MiddleEllipsis`. `Badge title` e `Chip title` passam a abrir a dica do DS quando o texto
  corta (nada de `title` no DOM). O selo de erro do `SuggestionCard` não repete o motivo, que já está no
  corpo.
- `FixedFrame` no celular: o resumo recolhível da lateral é um `h2` (vem logo depois do `h1` do
  cabeçalho; antes, `h3` pulava um nível).
- `WorkspaceLayout` sem painéis (só a tela principal): no modo estreito não ganha a linha de abas nem o
  papel de painel de aba — uma tela única (Material, Entrega) fica igual à larga, com a região nomeada.
- `Prose` em ≤ 560 px: calha de 24 px (era 16) — o glifo da IA fica a 6 px da borda da tela e 6 px do
  texto, e o alvo de 20 cabe inteiro na tela.
- `Conversation`: um pedido com a área já no fim não desliza (o deslize nunca terminava e prendia o
  acompanhamento), e pegar a barra de rolagem durante o deslize devolve o controle à pessoa.
- `AgentTrace`: as fontes de uma etapa cabem na coluna do passo (antes, o chip mais largo empurrava o
  grupo para fora do painel); cada `SourceChip` corta o próprio texto.
- `Tooltip`: a âncora nunca passa da largura da coluna, aberta ou não — um filho com reticência continua
  cortando (antes, a dica aberta da prancha esticava o texto por cima da coluna vizinha).
- Menu lateral: a coluna dos itens encolhe (`minmax(0, 1fr)`) — o nome longo corta com reticências em
  vez de empurrar a contagem ou o selo para fora da barra.

### Migração

- `Meter`/`Metric` que dependiam do azul padrão ficam cinza. Passe `tone` só quando o número pede
  atenção (`amber`, `red`) ou está completo (`green`).
- Seletores de produto em `[data-stacked]` da `FilterBar` deixam de casar: o layout empilhado é do CSS do
  componente.

## [0.1.0] - 2026-10-06

### Adicionado

- contrato obrigatório de contribuição orientado pelo design system;
- documentação de instalação e integração em aplicações Next.js;
- contexto visual para ferramentas de IA em `.21st/`;
- comando único `pnpm check` para lint, tipos, testes e build;
- metadados e limites do pacote para consumo por outros projetos.

### Alterado

- catálogo identificado como Content Ventures Design System;
- requisitos de Node.js alinhados ao mínimo suportado pelo Next.js 16;
- interações de tabela e multiselect aprimoradas para acessibilidade por teclado.
