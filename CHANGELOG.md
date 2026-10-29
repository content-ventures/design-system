# Changelog

Todas as mudanças relevantes deste pacote serão registradas aqui.

O projeto segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [0.4.1] - 2026-10-29

### Fixed

- Shared select panels inside an open dialog use the native manual-popover top layer when available. This keeps viewport coordinates valid during modal entry and resizing, prevents the menu from scrolling the dialog sideways and disappearing before selection, and follows animated ancestors until they settle. Anchor visibility stops at native modal boundaries; clipping above a contained layer still applies. The public API, theme, keyboard/focus, outside-pointer and hidden-anchor dismissal, closing transition and nonmodal/unsupported-browser fallback remain intact. The responsive-dialog catalog includes an immediate-selection example.
- Modal layers ignore queued native close events after reopening and close events from nested dialogs. An actual current native close still synchronizes the controlled state.
- A menu opened by keyboard during sheet entry remains open while its anchor moves into view; normal hidden-anchor dismissal resumes when the finite ancestor animation ends. Contained-layer clipping remains authoritative.
- Native and contained modal layers both wrap Tab/Shift+Tab within their current controls, preserving the documented focus boundary instead of letting keyboard focus leave the dialog.
- Keyboard-focused immutable ProseMirror text has the shared focus ring, including the catalog force-state twin. The reading specimen exposes a named, focusable read-only text area.
- Sidebar identity, navigation and footer share a named complementary landmark; workspace/account text retains its word boundary in accessible names. Secondary identity text and the search action use readable existing foreground roles. Toast announcements have a valid named live-region role.

## [0.4.0] - 2026-10-19

### Added

- `TranscriptSpeaker` supports opt-in `description`, a short role and/or organization line (“Seafood Brasil”). It shows after the name in the speaker header, in `--t-body` and `--muted` after a `·`, and truncates before the name does. The first segment of each speaker's block also reads it to screen readers (“Clara Souto, Aurora Calçados: …”); the other segments keep the name only. Speakers without it render as before.

### Changed

- `TranscriptViewer` repeats the speaker header (avatar, name and description) above the active segment when it continues another segment's block, so the highlighted line always says who is speaking even when the block began far above. Only the active segment gains it; the row grows by the header's height and the windowed list re-measures it. Inactive segments and block starts are unchanged.

## [0.3.0] - 2026-10-16

### Added

- `KanbanBoard` supports opt-in `fill`: the board runs from its own top to the bottom of the window, every column takes that height and the cards scroll inside each column, with the column header fixed and the footer pinned. The board re-measures when the content above it or the window changes, and stops shrinking at 360 px. Dragging near the top or bottom of a scrolling column scrolls it. Without `fill` the board keeps growing with its content.
- `KanbanCard` supports opt-in `arrived` to point out a card that just moved (sent for approval, approved): it renders `data-arrived` and lights up with a `--b-300` border and `--b-25` background that fade back to rest over the new `--arrival-fade` token (2.4 s). On mount, or when `arrived` turns true, the card scrolls into view once with the least movement, inside its column body on a `fill` board, along the board's lanes and, without `fill`, on the page; where columns snap (≤640 px) its column lands at the start. Re-renders do not scroll again, focus does not move and `aria-current` stays reserved for `selected`. With reduced motion the scroll is instant and the tint is static until `arrived` turns false. While `arrived` is true the card's accessible description ends with “Acabou de chegar.”; the product still announces the move in text (its toast). `arrived` is for one arrival: clear it on the next move and when the person filters or switches views, because every new mount of the card (a drop or cancelled drag, a keyboard move between columns, a filter, a column collapsed and reopened) lights it and scrolls again; under reduced motion the static tint matches `selected` until it is cleared. A collapsed column draws no cards, so open it before marking one. `LeadCard` and `CampaignKanbanCard` pass it through; `data-force="arrived"` shows the state in the catalog.
- `ConfirmDialog` supports opt-in `acknowledge` for a block the person cannot resolve on the spot (“Você não tem permissão para isso”): a single primary button labelled “Entendi” by default (`confirmLabel` overrides it) that takes the initial focus, with no Cancel button, no danger tone and no type-to-confirm. `onConfirm` becomes optional and the button closes the dialog; Esc, the backdrop and the X still close it, and at ≤640 px the button spans the footer like the two buttons of a question. It opens as an `alertdialog` (the new `Dialog role` prop; the question keeps the native dialog role). A block that clears on the same screen (AI still working, a missing field) keeps its visible reason; the notice is for an attempt the role or the server refuses. `ConfirmFrame` takes `acknowledge` and a new `compact` (phone drawing) for the catalog, and the barrel exports `ConfirmDialogProps`.
- `Segmented` options support `disabled` and `disabledReason` for a choice that is not open yet (“Link” · “Em breve”): the option stays on the track with `aria-disabled`, `--disabled-ink` text and icon, no hover and a not-allowed cursor, and its reason shows in the DS `Tooltip` on hover (a tap shows it on touch) and becomes its accessible description. Clicking it does nothing and the arrow keys, Home and End skip it. `Segmented` also takes `disabled` and `disabledReason` to lock the whole group: the current choice stays visible and remains the Tab stop, with the group's reason in the tooltip on keyboard focus, and an option's own reason wins over the group's. Locking or unlocking the group or an option keeps focus on the same button, clicking an unavailable option leaves focus on the current choice, and the arrow keys never scroll the page or re-send the current value. Options without these props behave as before.

### Changed

- `TopBar` keeps a way up on phones: at ≤640 px of its container the trail shows the first crumb (a link) and the current one, with the separator between them, and hides only the middle levels (and the collapsed “…”). Both truncate with an ellipsis: a short crumb stays whole, the current one takes the rest and two long ones split the trail in half. Each `li` carries `data-crumb="first|middle|current"`. A single crumb, the desktop trail and `Breadcrumb variant="compact"` are unchanged. A two-crumb trail now shows both crumbs on phones (before, only the current one). If you cut the trail to one crumb on phones by hand, pass the full trail. In the default layout the trail is the way back; `PageHeader back` stays for `layout="immersive"`.

### Fixed

- A `Tooltip` with `disabled` no longer opens when a touch tap lands on an unavailable control.

## [0.2.1] - 2026-10-15

### Added

- `FilterBar` supports opt-in `spacing="comfortable"` using existing spacing tokens. The compact default, wrapping behavior and keyboard controls are preserved.

## [Não publicado]

### Adicionado

- `Prose`: imagem sugerida (`figure[data-slot] > img[data-missing] + figcaption`), o lugar que o texto
  reserva para uma imagem que ainda não existe — a moldura funda com ImagePlus e “Imagem sugerida”, o
  pedido na figcaption em `--muted` e cursor de clique na escrita; espécime “Sugerida” na prancha de
  imagem;
- ícone `ImagePlus` em `icons.ts`;
- estrutura: `ReadingColumn`, a coluna na medida do texto (68ch na fonte de leitura), centrada ou
  encostada no início, para a decisão, avisos, diferenças e imagens ficarem na mesma borda do `Prose`;
  espécime “Coluna de leitura” na prancha de layout;
- `ChoiceCard`: `media`, uma peça no topo do cartão (a miniatura de um modelo de carrossel) — empilha o
  cartão, entra na área clicável e leva o rádio para o canto da peça; indisponível, a peça esmaece;
  espécime “Com miniatura” na prancha de rádio;
- `AppShell`: `layout="immersive"`, a tela de trabalho de um documento sem o menu do app — nenhuma
  coluna de menu, gaveta ou botão de menu em qualquer largura; `sidebar` opcional (ignorado no
  imersivo) e `topbar` opcional; sem topo, a moldura encostada ocupa a janela até a borda de cima;
  `useShell().immersive`; espécime “Imersivo” na prancha de estrutura de aplicação;
- `PageHeader`: `back` (`{ label, href, onNavigate? }`), a volta discreta “← Produções” antes do
  título, fora do h1, com nome “Voltar para …” e só a seta em ≤640 px; espécimes “Volta” e
  “Volta · estados”;
- `PageHeader`: `actionsNote` (`{ id, text }`), o motivo visível de uma ação indisponível logo antes
  das ações — 12 px em `--muted`, corta com a dica e cede antes do título; em ≤640 px desce para a
  linha dele e quebra; espécime “Motivo do bloqueio”;
- `Prose`: imagem sugerida em linha (`figure[data-slot][data-display="line"]`), uma linha de 40 px com
  ImagePlus, “Imagem sugerida:” e o assunto, no ritmo de um parágrafo, em escrita, leitura e compacto;
  na escrita, hover, pressionado, arrasto (`[data-over]`, tracejado b-400) e foco, com os gêmeos
  `data-force`; prancha “Imagem em linha”;
- `ActionBar`: `detail` sem `status` é o motivo visível de uma ação indisponível, logo antes dos
  botões, com `detailId` para o `aria-describedby` do botão; quebra em vez de cortar e no celular
  ganha a linha dele; espécime “Barra · motivo do bloqueio”;
- tipos `PageHeaderBack` e `PageHeaderNote` exportados no índice.

### Alterado

- Contrato §1.7 (“Sem texto a mais”): duas exceções — o aviso de tarefa (1 frase e 1 verbo,
  `Banner variant="inline"`) e o motivo visível do bloqueio (`PageHeader actionsNote`,
  `ActionBar detail`);
- `Prose`: figura de tamanho conhecido (`img[width][height]`, inclusive a moldura de uma imagem que
  falta) abraça a imagem e fica no centro da coluna, com a legenda quebrando na largura dela — uma
  vertical ou quadrada não encosta mais na borda esquerda de uma coluna centrada; horizontal larga
  continua na largura da coluna;
- `Prose`: imagem sugerida diz como preencher na escrita (“Arraste a imagem aqui ou clique para
  escolher”, fundo que responde ao ponteiro) e, na leitura e no compacto, vira uma faixa baixa (3:1) na
  largura da coluna em vez da moldura do tamanho da foto;
- `MetaList`: um fato mais longo que a linha quebra dentro dele (o “·” fica pendurado no recuo), em vez
  de cortar com reticências; `wrap={false}` continua numa linha só;
- `Accordion`: numa lista em que alguma linha tem marcador, as linhas sem estado guardam o lugar dele
  (os títulos ficam na mesma borda);
- `Segmented`: esticado por quem o contém (barra de ações no celular), o trilho reparte a sobra entre as
  opções em vez de deixar um rabo vazio depois da última.

### Corrigido

- `PageHeader variant="frame"` sem `steps`: um título longo empurrava as ações para largura zero e os
  botões passavam por cima dele; agora a linha é uma só — o título corta (com a dica) antes das ações,
  que não encolhem;
- `Sidebar` recolhida (trilho): um grupo recolhível fechado (`collapsible`, `defaultOpen: false`, como
  “Em breve”) desenhava todos os ícones dele; agora o trilho mostra só os grupos abertos;
- `FilterBar`: numa barra de até 640 px com abas que quase enchem a linha (uma gaveta de 552), a busca
  ficava espremida no resto da linha e vazava; agora as ferramentas descem para a linha delas abaixo
  de 220 px.

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
