# Content Ventures DS V3 — Contrato visual

Biblioteca: `src/components/ds-v3`. Catálogo: rota `/design-system` (`pnpm dev`; item em `#<id>`).
**Fontes da verdade:** os tokens de `theme.module.css`, este contrato e as pranchas aprovadas no
catálogo. Se uma aplicação divergir deles, a correção começa aqui e depois chega ao produto pelo pacote.

---

## 1. Princípios

1. **Chapado.** Cor sólida. Nenhum degradê, 3D, brilho, chanfro, `text-shadow` ou glow.
   Exceções funcionais: orbe do `Avatar`; máscara de esmaecimento no fim de uma área com rolagem.
2. **Fio, não sombra.** Contorno é `border: 1px solid`. Sombra só no que flutua (§7).
3. **Um azul por área.** Azul = ação, foco, seleção e etapa atual. Nunca status, nunca decoração.
4. **Status = ponto + palavra.** Tons de status só para status (§2.4).
5. **Números tabulares**, alinhados à direita em colunas, no formato pt-BR (§11).
6. **Nunca iniciais nem monogramas.** Pessoa = `Avatar` (orbe). Organização = `BrandMark` (glifo).
7. **Sem texto a mais.** O componente aparece vivo; legenda de 1–3 palavras. Nada de parágrafo explicativo.
8. **Movimento curto e funcional** (120–280 ms, `ease-out`), sempre com `prefers-reduced-motion`.

## 2. Cor — papéis

Telas usam papéis; rampas (`--g-*`, `--b-*`) só compõem papéis e estados.

### 2.1 Superfícies

`ThemeV3` mantém o claro aprovado por padrão. `mode="dark"` remapeia os mesmos papéis com a
rampa V3; `mode="system"` acompanha o dispositivo. Escopos internos herdam o modo do escopo
externo, inclusive formulários e camadas. Preferências de usuário são responsabilidade da aplicação,
não do catálogo nem de um segundo tema legado.

| Papel                        | Token                         | Uso                                                                        |
| ---------------------------- | ----------------------------- | -------------------------------------------------------------------------- |
| Página e painéis             | `--paper` #fff                | conteúdo do app (branco direto, sem bandeja)                               |
| Menu lateral, faixas         | `--g-25`                      | barra lateral, rodapé de diálogo, faixa compacta                           |
| Rebaixado                    | `--g-50` / `--paper-sunken`   | barra de filtros, cabeçalho de tabela de dados, registro em diálogo, palco |
| Hover de item                | `--g-75`                      | item de menu/nav, trilho do segmentado, `Count` neutro                     |
| Pressionado                  | `--g-100` / `--paper-pressed` | item pressionado, esqueleto                                                |
| Fundo atrás de app flutuante | `--canvas`                    | só catálogo/palco; nunca dentro do produto                                 |

### 2.2 Texto

`--ink` títulos e valores · `--text` corpo · `--muted` rótulos, meta, legendas, eixos (mínimo para
informação) · `--subtle` **só** placeholder e controle indisponível · `--on-accent` sobre azul.

### 2.3 Fios

`--line` painéis e divisórias · `--line-soft` dentro de painel (entre linhas) · `--line-strong` controles
· `--line-hover` hover de controle. Sempre 1px. Tracejado só em “Solte aqui” e na zona de upload
**durante** o arrasto.

### 2.4 Ação, seleção e status

- Ação: `--b-600` → hover `--b-700` → pressionado `--b-800` (`--accent-pressed`). Suave: `--b-50` → `--b-100`.
- Foco: `--b-500` (§9).
- Seleção grande (cartão, linha, pílula): `--select-bg` (b-25) + `--select-line` (b-300) + texto `--select-ink`.
- Seleção pequena (item ativo do menu lateral, texto selecionado, faixa do calendário): `--b-100`/`--b-50`.
- Hover de algo escolhível: fio `--choice-hover-line` (b-200) + fundo `--g-25`.
- Status (cada tom tem `-bg`, `-line`, `-dot`, `-ink`):

| Tom    | Significa                       | Status do produto                                      |
| ------ | ------------------------------- | ------------------------------------------------------ |
| green  | no ar / ok / liberado           | Veiculando (`live`, único que pulsa), Liberado, Ativo  |
| teal   | aprovado                        | Aprovada                                               |
| violet | aguardando outra pessoa         | Aguardando aprovação                                   |
| amber  | prazo, atenção, assinatura      | Aguardando assinatura do P.I., Enviado, Fora da janela |
| orange | ação necessária agora           | Ajustes solicitados, prazo < 24 h                      |
| red    | erro, recusa, perda             | Rejeitada, Cancelada, P.I. rejeitado, Falta (editável) |
| gray   | parado, rascunho, encerrado     | Rascunho, Pausada, Concluída                           |
| blue   | **só informação** (alerta info) | — nunca status de registro                             |
| pink   | só série de gráfico             | —                                                      |

- **Medidor** (`Meter`, barra do `Metric`, prontidão): cinza (`neutral`) por padrão; âmbar ou vermelho só
  quando o número pede atenção, verde quando completo, azul nunca. A tendência (`Sparkline` de um KPI) é
  cinza e decorativa: quem diz se subiu ou caiu é o `Delta`.

### 2.5 Diferença e marca-texto (editor)

- **Diferença entre versões** usa papéis neutros, nunca tons de status: inserção `--diff-insert-bg` +
  `--diff-insert-ink` + **sublinhado** `--diff-insert-line`; remoção `--diff-delete-bg` + `--diff-delete-ink`
  - **tachado** `--diff-delete-line`. Cor nunca sozinha: texto para leitor de tela (“Inserido:”, “Removido:”).
- **Marca-texto:** `--mark-yellow-bg`, `--mark-green-bg`, `--mark-pink-bg`, texto `--mark-ink`. Sem azul
  (é a seleção de texto). Marca do autor, não status.

## 3. Tipografia

Inter 400/500/600 com itálico real nos três pesos (`font.ts`), `font-synthesis: none`. Títulos com
`--track-title`. Escala (auditoria):

| Token                        | Spec              | Uso                                                                      |
| ---------------------------- | ----------------- | ------------------------------------------------------------------------ |
| `--t-page`                   | 600 24/32         | título de página (22 em ≤760)                                            |
| `--t-kpi`                    | 600 22/28         | métrica viva (faixa de KPIs)                                             |
| `--t-figure-lg`              | 600 18/26         | número herói (verba no resumo, estimativa); título da moldura de criação |
| `--t-figure` / `--t-title-2` | 600 16/24         | faixa de números; título de diálogo e de gráfico                         |
| `--t-title-3`                | 600 14/20         | título de seção                                                          |
| grupo                        | 600 13/20 `--ink` | rótulo de grupo de campos (“Período de veiculação”)                      |
| `--t-body` / `-strong`       | 400·500 13/20     | corpo, células, valores (`dd`)                                           |
| `--t-small` / `-strong`      | 400·500 12/18     | rótulo de campo (500), rótulo de métrica (400 `--muted`), ação em texto  |
| `--t-caption` / `-strong`    | 400·500 11.5/16   | meta, ajuda, eixo, cabeçalho de tabela (500 `--muted`)                   |
| `--t-overline`               | 600 10.5/14       | única caixa alta; raríssimo                                              |

Hierarquia de formulário: seção 14 > grupo 13 > campo 12. Nada abaixo de 11.5. `--t-display` só no catálogo.

### 3.1 Leitura (texto corrido)

Artigo, revisão e prévia usam uma escala própria, maior que a da interface. Nunca em controle.

| Token               | Spec              | Uso                                                     |
| ------------------- | ----------------- | ------------------------------------------------------- |
| `--t-prose-title`   | 600 28/36         | título do artigo (`--t-page` no celular)                |
| `--t-prose-h2`      | 600 22/30         | intertítulo                                             |
| `--t-prose-h3`      | 600 18/26         | subtítulo                                               |
| `--t-prose-lead`    | 400 18/28         | linha fina, `--muted`                                   |
| `--t-prose-body`    | 400 16/28         | corpo, `--text`                                         |
| `--t-prose-quote`   | itálico 400 18/30 | citação: recuo `--s-6`, **sem fio lateral e sem caixa** |
| `--t-prose-caption` | 400 13/20         | legenda e crédito, `--muted`                            |

Medida `--prose-measure` (68ch) · entre blocos `--prose-space-block` (20) · antes de intertítulo
`--prose-space-section` (40).

## 4. Espaço, densidade e alturas

Base 4: `--s-1` 4 · `--s-2` 8 · `--s-3` 12 · `--s-4` 16 · `--s-5` 20 · `--s-6` 24 · `--s-8` 32 · `--s-10` 40 ·
`--s-12` 48 · `--s-14` 56 · `--s-16` 64. Valor fora da escala só para alinhar óptico (±1 px).

- Controles: `--h-sm` 32 (toolbar, filtros, segmentado, paginação) · `--h-md` 36 (padrão) · `--h-lg` 40.
  Toque (`pointer: coarse`): 36/44/48 e alvo mínimo de 40 px em checkbox, switch e ícones.
- Campo herói de dinheiro: 56. Linhas de tabela: 46 (compacta, padrão do produto) e 60 (confortável).
- Painel: padding 16/20. Grade de campos: colunas com gap 16, linhas 20, `align-items: start`.
- Ritmo vertical de página: título → abas 24 · seções 32 · cabeçalho de seção → conteúdo 12–16.

## 5. Raios e bordas

`--r-xs` 4 selo/checkbox · `--r-sm` 6 controle sm, item de menu, chip · **`--r-md` 8 controles** (botão,
campo, select, alerta) · **`--r-lg` 10 superfícies** (painel, tabela, cartão, menu, popover, toast) ·
`--r-xl` 12 palco do catálogo · `--r-2xl` 16 modal, gaveta, bottom sheet · `--r-full` switch, avatar, barras.
Raio interno = externo − padding (concêntrico). Barras de dado: raio só na ponta (3 px).

## 6. Iconografia

`lucide-react`, contorno, `stroke-width: var(--icon-stroke)` (1.75). Menu lateral e itens de menu 1.5;
marcas de check 2.5–3. Tamanhos: `--icon-xs` 12 (externo ↗, chip) · `--icon-sm` 14 (ajuda, erro, ordenação)
· `--icon-md` 16 (botão, campo) · 15 em controles sm · 17 no menu lateral · `--icon-lg` 18 (toast).
Cor: `--icon-quiet` (g-400) repouso calmo · `--icon-rest` (g-500) em botões · g-600 no hover da linha ·
`--ink` no hover do próprio ícone · b-600 ativo · `--red-ink` destrutivo.
Ícone acompanha texto; ícone sozinho só com nome acessível + `Tooltip` (o `IconButton` já mostra o
nome na dica; nunca `title` nativo, que aparece atrasado e por cima da dica). **Sem `IconTile` decorativo**:
`IconTile` só em estado vazio/erro/acesso (um por estado).
Só nomes canônicos do lucide em `icons.ts`. Os que colidem com componentes ou globais (`List`, `Menu`,
`Radio`, `Image`, `File`, `History`) entram com apelido (`List as ListIcon`).

## 7. Elevação e camadas

Superfície em repouso **não tem sombra**. Só flutuantes:

**Tudo é claro (decisão do designer em 01/10/2026).** Nenhuma camada usa fundo escuro (`--g-900`/`--g-950`): barra de lote, toast, tooltip, balão de gráfico, paleta e popovers são papel branco com fio e sombra suave. Fundo escuro só dentro de mídia (controles sobre vídeo).

| Camada                                   | Visual                                                        | z                |
| ---------------------------------------- | ------------------------------------------------------------- | ---------------- |
| Barra fixa (topo, rodapé de ações)       | fio + branco 94% com `blur(10px)`                             | `--z-sticky` 20  |
| Barra de lote                            | `--paper`, 1px `--line`, `--shadow-lg`, `--r-lg` (claro)      | `--z-dock` 30    |
| Menu, select, popover, datas, hover card | `--paper`, 1px `--line`, `--shadow-lg`, `--r-lg`              | `--z-popover` 40 |
| Gaveta                                   | `--shadow-xl`, véu `--overlay` + `blur(var(--overlay-blur))`  | `--z-drawer` 60  |
| Modal, bottom sheet                      | sem borda, `--shadow-xl`, `--r-2xl`, mesmo véu                | `--z-modal` 70   |
| Toast                                    | `--paper`, 1px `--line`, `--shadow-lg`, `--r-lg` (claro)      | `--z-toast` 90   |
| Tooltip, balão de gráfico                | `--paper`, 1px `--line`, `--shadow-md`, texto `--ink` (claro) | `--z-tooltip`    |
| Cartão em arrasto                        | `--shadow-drag`, `scale(1.02)`                                | acima da coluna  |

Flutuante é `position: fixed` ancorado ao gatilho, vira para cima/lado quando falta espaço e fica a 8 px
da borda da janela. Nunca é recortado por tabela ou moldura (`overflow: clip` nas molduras).

**Dica (`Tooltip`):** texto curto que o gatilho não mostra — nome de botão de ícone, nome de etapa
escondido pela largura, motivo de indisponível, aviso de um slide. `title` nativo não é usado em nenhum
controle do DS. `bare` faz do próprio filho a âncora (sem caixa extra no layout; o filho repassa `ref` e
eventos). `describe` decide se a dica vira `aria-describedby` (padrão: sim, salvo quando repetiria o
nome). Clique de mouse fecha a dica, salvo em controle indisponível, onde ela é o motivo. `disabled`
desliga a dica sem mudar a árvore (para a que existe só às vezes). A âncora nunca passa da largura
da coluna (`max-width: 100%`), aberta ou não: um filho que corta o texto continua cortando.

**Texto que corta (`TruncatedText`):** uma linha com reticência; só quando cortou, o texto inteiro abre
na dica do DS ao passar o ponteiro. O texto inteiro continua no DOM (o leitor de tela lê tudo), então a
dica não vira descrição. É o que a trilha, o título do `PageHeader`, a célula `truncate` da `DataTable`,
a `DescriptionList` em faixa, o primeiro item do `MetaList` numa linha, o `MiddleEllipsis`, `Badge title`
e `Chip title` usam — `title` nativo não aparece em nenhum texto do DS. Gancho `[data-clipped]` quando
cortou.

## 8. Movimento

| Token           | Valor                                                            | Uso                                                                                                    |
| --------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `--dur-1`       | 120 ms                                                           | cor, fundo, fio, ícone; pressionar (`scale(var(--press-scale))`)                                       |
| `--dur-2`       | 180 ms                                                           | abrir menu/popover/tooltip, marca de check, chevron, crossfade                                         |
| `--dur-3`       | 280 ms                                                           | entrar camada (modal, gaveta, toast), altura (acordeão, faixa de filtros), indicador de aba, reordenar |
| `--dur-exit`    | 160 ms                                                           | toda saída (sempre mais curta que a entrada)                                                           |
| `--ease-out`    | entrada e mudança de estado                                      |
| `--ease-in`     | saída                                                            |
| `--ease-move`   | o que já está na tela muda de lugar (indicador, FLIP, pilha)     |
| `--ease-spring` | **só** check, ponto do rádio, polegar do switch, selo de sucesso |
| `--stagger`     | 40 ms entre itens (máx. 6)                                       |

Coreografia: flutuante entra `opacity 0 → 1` + `translateY(∓4px) scale(.98)` a partir do lado do gatilho;
modal `translateY(8px) scale(.985)`; gaveta desliza da direita; bottom sheet sobe do fim; toast sobe 8 px.
Mudança de altura usa `grid-template-rows: 0fr → 1fr`. Valores numéricos trocam por crossfade (sem contagem
animada). Esqueleto pulsa (`--skeleton-pulse`), sem brilho correndo. Spinner só depois de 300 ms.
`prefers-reduced-motion`: o tema zera durações; nada pode depender de animação para fazer sentido.

## 9. Foco

`:focus-visible` = `outline: 2px solid var(--focus-color)` + `outline-offset: 2px`, em qualquer superfície.
Campos: borda b-500 + `--ring-field` (inválido: `--ring-invalid`). Dentro de tabela, menu, grupo colado ou
trilho com `overflow`: `outline-offset: -2px`. Foco nunca some sem substituto; só teclado mostra anel.
Camadas prendem o foco e devolvem ao gatilho. Destrutivas abrem com foco em “Cancelar”.

## 10. Modelo de estados (componentes interativos)

Só os estados que se aplicam. Transição `--dur-1` salvo indicação.

| Estado           | Regra visual                                                                                                                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Repouso**      | tokens de repouso; sombra só `--shadow-xs` em controle com borda (botão secundário, campo)                                                                                                                               |
| **Hover**        | um degrau: primário b-600→b-700; secundário fundo `--g-25` + `--line-hover`; fantasma `--paper-hover`; campo `--line-hover`; linha `--g-25`; item de menu/nav `--g-75`; escolhível fio b-200 + `--g-25`; ícone → `--ink` |
| **Pressionado**  | mais um degrau (b-800, `--g-75`, `--g-100`) + `scale(var(--press-scale))` em botões; sem escala em linhas e itens                                                                                                        |
| **Foco**         | §9                                                                                                                                                                                                                       |
| **Selecionado**  | grande: `--select-bg` + `--select-line` + marcador azul (rádio/check); nav: `--nav-active-bg` + barra; aba: barra 2 px b-600; segmentado: papel sobre trilho                                                             |
| **Indisponível** | `--disabled-bg`, `--disabled-line`, `--disabled-ink`, ícone `--disabled-icon`, sem sombra, `cursor: not-allowed`; fantasma/switch: `opacity .45`. Motivo em `Tooltip`/`describedBy` (toque: toque mostra o motivo)       |
| **Carregando**   | botão: spinner no lugar do ícone, largura travada, `aria-busy`, rótulo mantido; campo: spinner 14 à direita; região: esqueleto com a geometria final                                                                     |
| **Inválido**     | borda `--red-dot` + `--ring-invalid`; mensagem 11.5/500 `--red-ink` com `CircleAlert` 14 **no lugar** da ajuda; grupo: fio `--red-line`                                                                                  |

Somente leitura: fundo `--g-25`, fio `--line`, sem hover.

### 10.1 Convenção `data-force` (pranchas)

Para mostrar um estado parado, todo componente interativo aceita `data-force="hover" | "active" | "focus"`
(lista separada por espaço vale: `"hover focus"`).

- CSS: cada `:hover` ganha o gêmeo `[data-force~='hover']`, `:active` → `[data-force~='active']`,
  `:focus-visible` → `[data-force~='focus']`. Ex.:
  `.button[data-variant='primary']:is(:hover, [data-force~='hover']):not(:disabled)`.
- Quando o estado é desenhado num ancestral (campo, checkbox, cartão escolhível):
  `.control:is(:focus-within, :has([data-force~='focus']))`, `.choice:has(input[data-force~='hover']) .box`.
- O atributo chega ao elemento que recebe o estado: componentes que espalham `...props` já repassam;
  os que não espalham declaram `'data-force'?: string` e o aplicam no elemento estilizado.
- O tema já desenha o anel para `[data-force~='focus']`. `data-force` nunca aparece no produto.
- Selecionado, indisponível, carregando e inválido são props reais — não usam `data-force`.

## 11. Conteúdo

- pt-BR, frase em caixa normal. Botão começa por verbo e diz o resultado: “Enviar para aprovação”,
  “Salvar rascunho”, “Excluir 2 campanhas”. Nunca “OK”, “Sim”, “Clique aqui”.
- Destrutiva nomeia o objeto e a quantidade. Confirmação pergunta a ação (“Excluir campanha?”), sem “Tem certeza”.
- Ajuda carrega dado ou regra (“Múltiplos de R$ 45,00”), nunca explica a tela. Vazio: “A definir”,
  “Não informado”, “—”. Faltante editável: “Falta” em `--red-ink`.
- Termos únicos: Verba (não “investimento”), Briefing, P.I. (pedido de inserção), Anunciante, Ativo,
  Pacote, Canal, Público, Vínculos, Vitrine, Expositor, Portal, “Criada pelo admin”.
- Formatos: dinheiro exato `R$ 18.000,00` (sempre 2 casas) · estimativa `≈ 400.000` / `≈ R$ 9.000` ·
  compacto `1,24 mi`, `25 mil` · percentual `50,7%` · variação `3,8%` com seta, `4 p.p.` · data
  `05/10/2026` · intervalo `05/10 – 31/10` (sem quebra) · completo `01/10/2026 – 31/10/2026` · data e hora
  `29/09/2026 às 16:42` · lista `22/10 · 16:25` · duração `27 dias` · relativo `há 2 h`.
- Auxiliares (`format.ts`, no barril): `formatRelative(data, agora?)` → “agora”, “há 2 min”, “há 2 h”,
  “ontem”, “há 3 dias”, depois “12 out” (“12 out 2025” em outro ano); `textStats(texto)` →
  `{ words, characters, readingMinutes }` (200 palavras/min, mínimo 1 com texto).
- Dados fictícios: Francal 2026; anunciantes Aurora Calçados, Estúdio Norte, Casa Forma, Lume Acessórios,
  Grupo Horizonte, Ateliê Sul, Pátio Couro, Bella Passo, Couro Nobre; pessoas Marina Lopes, Rafael Dias,
  Clara Souto, Tiago Rezende, Juliana Prates; ativos Banner Super Topo — Portal, E-mail marketing dedicado,
  Push no app da feira, Painel de LED — Pavilhão Azul, Destaque na vitrine.

## 12. Layout

- **Moldura do app:** menu lateral `--sidebar-w` 236 em `--g-25` com fio à direita,
  encostado; topo `--topbar-h` 52 com fio, um único fio corre do menu ao conteúdo; conteúdo branco direto
  com `--page-gutter` 32 (24 em ≤1024, 16 em ≤640), limite `--content-max` 1760 centralizado.
- **Menu lateral:** item 34 px, `--r-md`; ativo = `--nav-active-bg` + texto 500 ink + ícone b-600 +
  **barra de 3 px `--nav-active-bar` à esquerda** (top/bottom 9 px, raio 3). **É o único lugar do sistema
  com barra de destaque lateral.** Até 1199 px vira gaveta (véu, Escape, `inert` no conteúdo). Com o
  ponto de quebra padrão, quem decide gaveta ou barra é o CSS (`@container shell`): o HTML do servidor e
  a primeira pintura no celular já saem com a gaveta fechada; o JS só abre, fecha e cuida do foco.
  `bleed` tira respiro e largura máxima do conteúdo para a área de trabalho encostada
  (`WorkspaceLayout docked`).
- **Item “Em breve” (`NavItem.soon`):** o menu mostra o mapa inteiro do produto; o que ainda não abre
  leva `soon: true` ou `soon: { label?, reason? }` (selo padrão “Em breve”). Ícone `--g-400` e nome
  `--muted`, `Badge` cinza `soft` `sm` no lugar da contagem (a contagem some). Não navega: vira botão sem
  ação (`href` e `onNavigate` ignorados), `aria-disabled`, nome “Rótulo, Em breve”; continua focável,
  Enter e Espaço não fazem nada, e na gaveta tocar nele não a fecha. O `reason` vai na dica do DS e em
  `aria-describedby` (toque mostra por 1,5 s); nome cortado entra na dica. Recolhido: ícone esmaecido e
  dica lateral “Rótulo · Em breve” com o motivo na linha de baixo. Nunca é o ativo, mesmo com `active`.
  Nada de `title` nativo. Nas pranchas, `force: 'tip'` abre a dica parada.
- **Breakpoints:** 390 celular · 640 (rodapé de ações em 1 linha, diálogo vira bottom sheet) · 760 (tabela →
  cartões, título 22) · 1024 · 1199 (menu gaveta) · 1280 · 1440 (referência) · 1600 (detalhe em 2 colunas)
  · 1920/2560 (para em 1760).
- **Grades:** principal + lateral `minmax(0,1fr) var(--aside-w)`; formulário 2 colunas gap 16; cartões
  `repeat(auto-fill, minmax(min(196px,100%),1fr))` gap 8; faixas de números com fio de 1 px entre células
  (`MetricStrip`: a última linha reparte a largura — 5 indicadores viram 3 + 2 ou 2 + 2 + 1, sem célula
  vazia).
- **Moldura fixa (criação):** altura `100dvh − topo`; cabeçalho (título 18 + régua de etapas); corpo rola
  (miolo + lateral 320 com rolagem própria e esmaecimento no fim); rodapé fixo `--action-bar-h` 64 com 4
  slots fixos — Cancelar, Salvar rascunho, Voltar, principal (mín. 196). `overflow: clip`. Em ≤640:
  X no topo, régua só com marcadores (rótulo só na atual), rodapé `[←] [Salvar rascunho] [Principal]`.
  Etapa fora de alcance leva `reason` (dica e `aria-describedby`; focável, indisponível, não navega);
  nome escondido pela largura aparece na dica.
- Lista com paginação sempre. Criação é página com etapas, nunca modal. Modal só confirma ou edita pouco.
- **`ListItem titleLines={2}`:** em coluna estreita com títulos longos (“Aguardando você”), o título quebra
  em até duas linhas antes das reticências e a linha cresce com ele. Padrão: uma linha.
- **`List framed={false} bleed`** dentro de `Section`/`Panel`: as linhas sangram o próprio respiro (16 px),
  o texto alinha ao título da seção e o hover vai de borda a borda do bloco.
- **`FilterBar`:** busca e ferramentas lado a lado enquanto cabem; empilha pela quebra de linha do CSS
  (busca com base de 220 px, até 320 px empilhada), igual no servidor e no cliente — contagens que chegam
  depois não mudam a altura.
- **Campos em `Section` e `Drawer`:** campos irmãos no corpo ganham 20 px entre si (o ritmo do
  `FieldGroup`); grade ou pilha com espaçamento próprio manda no próprio ritmo.
- **Mídia na altura do palco:** `MediaFrame`/`SlideCanvas` com `maxHeight` (teto) ou `fitHeight` (cabe na
  altura visível da área que rola, menos o que vem antes e a legenda; piso de 240 px). A altura define a
  largura; `fitHeight` mede no cliente, e antes disso vale `maxHeight` ou a altura da tela. Na
  `Gallery`, `fitHeight` faz o mesmo com o palco: a altura para na área visível (menos o que vem antes e
  as miniaturas), a largura segue o contêiner e a peça encolhe por dentro, inteira.
- **`Grid`** é a grade de produto (aplicação não escreve CSS): `columns` em proporção (`'2:1'`) ou `auto`
  (cartões, gap 8); empilha abaixo de `collapseBelow` (só breakpoints do contrato, padrão 760). Em lista
  (`as="ul"`), cada filho vira `li`; `GridItem` só para `span`.
- **Moldura de estúdio (`WorkspaceLayout`):** a página de uma peça (artigo, carrossel). Cabeçalho, painel de
  início, tela principal e painel de fim numa altura fixa; cada região rola por dentro. Painéis
  redimensionam pela alça (setas, Home/End, Enter recolhe) e recolhem num trilho; F6 percorre as regiões.
  Até 1024 px da própria moldura vira abas sem desmontar nada. `focus` recolhe os dois lados sem perder a
  preferência. Fios de 1 px, sem sombra; nenhum painel ganha barra de título própria. Sem painéis (só a
  tela principal: uma etapa que é página, como Material e Entrega) a moldura dá o mesmo cabeçalho no
  mesmo lugar e não ganha abas no estreito.
- **Níveis de título:** `FormSection titleAs` e `Disclosure headingLevel` acertam o nível sem mudar o
  tamanho (h2 logo abaixo do h1 da página). O resumo recolhível do `FixedFrame` no celular já é h2.
- **Carregando:** cada bloco de `Skeleton` leva `[data-skeleton]` e a `SkeletonRegion`, `aria-busy`; é o
  gancho estável para o produto conferir que a tela carregou (nunca `data-shape`, que outras peças usam).
- **Campo que pede a decisão:** `Select autoFocus` marca o gatilho com `[data-autofocus]`; a gaveta ou o
  diálogo que abre leva o foco a ele, e não ao primeiro campo de texto.
- **Número curto:** `NumberField fit` mede os dígitos do máximo (mais os botões) e não estica na coluna —
  uma quantidade de 3 a 10 não vira uma barra de largura inteira.
- **Cabeçalho de estúdio numa linha (`PageHeader variant="frame" steps`):** título · status · régua ·
  ações · ⋯, a mesma linha carregando ou carregada. A régua (`Stepper size="sm"`) pede 27rem e estica
  até 36rem (o resto fica antes das ações, no fim da linha); sem espaço, o título trunca antes (até
  10rem) e só então a régua recolhe os nomes (cada um com a dica).
  Em ≤640 px do cabeçalho, título e status empilham, a régua desce para a linha dela e `stepsCompact`
  (`StepperCompact`) toma o lugar — decidido em container query, igual no servidor. `notice` põe o aviso
  da página (`Banner variant="inline"`) logo abaixo da linha: numa moldura encostada, uma faixa acima
  dela a empurraria para fora da janela.
- **Etapa em andamento (`StepItem.state: 'active'`):** quando a régua mostra outra etapa (voltar ao
  material, ver a entrega), a etapa em que o trabalho está fica com anel e número azuis e “em andamento”
  para leitor de tela; navega como as feitas. O disco sólido continua só na atual (a que está na tela).

## 13. Pranchas do catálogo

Pipelines compartilham `KanbanBoard`, `KanbanColumn` e `KanbanCard`. `LeadCard` preserva
responsável, origem e atividades; `CampaignKanbanCard` usa a mesma base com campanha, anunciante,
portal, verba e período. Não duplicar CSS do cartão nas telas. Status de campanhas só avançam
pelas regras e ações do produto; o arrasto livre do exemplo de leads não substitui esse fluxo.

- **Página do item:** família (caption `--muted`) → título `--t-page` → pranchas → anterior/próximo.
  Sem lede, sem abas de uso, sem “Quando usar/Evitar”.
- **Ordem das pranchas:** 1) **Em contexto** (vivo, interativo, copy real); 2) **Variantes**; 3) **Estados** (matriz parada com `data-force`); 4) **Celular** quando o layout muda.
- `Shot` com `title` de 1–3 palavras e **sem `description`**. Legendas por `Note`/`SpecRows` de 1–3
  palavras: Repouso, Hover, Pressionado, Foco, Selecionado, Indisponível, Carregando, Inválido.
- Palco chapado: `--g-50`, 1px `--line`, `--r-xl`, padding 40 (16 no celular); `tone="white"` para
  composições em contexto. Sem pontilhado, sem degradê.
- Um arquivo por grupo em `src/app/design-system-v3/specimens/<grupo>.tsx` (+ `.module.css` só de
  layout), exportando `specimens: Record<string, ComponentType>`. Nada de `docs`. Dados fictícios no
  próprio arquivo ou em `<grupo>.data.ts`.
- Estilo local só de layout; cor, sombra, raio, tipo e movimento sempre por token.
- Componente novo vai para a biblioteca (`ds-v3/<arquivo>.tsx`) e é importado pelo caminho direto
  (`@/components/ds-v3/<arquivo>`); o `index.ts` é ligado depois pelo integrador.
- APIs existentes são retrocompatíveis: os produtos consumidores usam a biblioteca. Mudança visual de um
  componente que um produto usa exige conferir as telas dele (1440×900 e 390×844) antes de atualizar o
  pin.

## 14. Biblioteca e donos (fase de construção)

| Arquivo                                                                                                                                                                      | Dono                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `theme.module.css` (só acréscimo), `font.ts`, `a11y.tsx`; catálogo `stage.tsx`/`.module.css`                                                                                 | fundamentos          |
| `button.*` (+ `SplitButton`), novos `link.tsx`, `toggle.tsx`, `row-actions.tsx`                                                                                              | acoes                |
| `fields.*`, novos `password-field.tsx`, `number-field.tsx`, `money-field.tsx`, `code-input.tsx`, `error-summary.tsx`                                                         | formularios-a        |
| `select.*`, `selection.*`, `slider.*`, `date-picker.*`, novos `combobox.tsx`, `multiselect.tsx`, `time-field.tsx`, `color-picker.tsx`                                        | formularios-b        |
| `app-shell.*` (exceto bloco `PageHeader`), `tabs.*`, `stepper.*`; bloco `Pagination` de `table.*`; bloco Menu de `overlays.*`; novo `context-menu.tsx`                       | navegacao            |
| `surfaces.*`; bloco `PageHeader` de `app-shell.*`; novos `accordion.tsx`, `section.tsx`, `scroll-area.tsx`, `resizable.tsx`, `description-list.tsx`                          | estrutura            |
| `table.*` (exceto `Pagination`), `badge.*`, `stat.*`, `timeline.*`; novos `metric-strip.tsx`, `filter-bar.tsx`, `list-item.tsx`, `tag-input.tsx`; `design-system-v3/data.ts` | dados                |
| `charts.*`                                                                                                                                                                   | graficos             |
| `toast.*`, novos `alert.tsx`, `progress.tsx`, `spinner.tsx`, `skeleton.tsx`, `empty-state.tsx`, `notification.tsx`                                                           | feedback             |
| `overlays.*` (Dialog, DialogFrame, Tooltip), `drawer.*`, novos `popover.tsx`, `hover-card.tsx`, `bottom-sheet.tsx`, `responsive-dialog.tsx`, `confirm-dialog.tsx`            | camadas              |
| `identity.*`, novos `media.tsx`, `gallery.tsx`, `upload.tsx`, `attachment.tsx`, `video.tsx`                                                                                  | midia                |
| `kanban.*`; pranchas `wizard.tsx`, `kanban.tsx`, `detalhe.tsx`                                                                                                               | padroes-a            |
| `grid.*`, `workspace-layout.*`; `PaneSeparator` de `structure.*`                                                                                                             | estrutura            |
| `prose.*`, `editable-title.*`, `toolbar.*`, `floating-toolbar.*`                                                                                                             | editor               |
| `prompt-composer.*`, `conversation.*`, `agent-trace.*`, `source-chip.*`, `suggestion-card.*`                                                                                 | ia                   |
| `diff-view.*`, `seal.*`                                                                                                                                                      | revisao              |
| `transcript-viewer.*`, `slide-strip.*`, `slide-canvas.*`                                                                                                                     | midia                |
| composição (sem arquivo de biblioteca próprio)                                                                                                                               | padroes-b, templates |

Arquivo dividido em blocos: releia antes de cada edição e toque só no seu bloco. Use componente de outro
grupo pela API atual; se a melhoria dele ainda não chegou, a prancha continua válida.

## 15. Verificação

- `pnpm check` na raiz do repositório (lint, tipos, testes e build de produção — o mesmo da CI).
- Capturas das pranchas alteradas (`/design-system#<id>`) em 1440×900 e 390×844, claro e escuro
  (`ThemeV3 mode="dark"`; no catálogo, `data-color-scheme="dark"` no escopo do tema), sem erro de console
  e sem rolagem lateral; olhe cada PNG.
- `21st review` nos arquivos alterados quando o CLI estiver disponível (CONTRIBUTING).
- Critério de pronto: alinhamento em grade de 4, nenhum texto quebrando feio, números alinhados, nenhum
  degradê/sombra em repouso, todos os estados aplicáveis desenhados, teclado completo, celular sem
  rolagem lateral, produtos consumidores sem regressão.

## 16. Editor, IA, revisão e mídia editorial

Componentes controlados e neutros de domínio: recebem dados serializáveis e devolvem callbacks. O DS não
importa TipTap, AI SDK nem código de produto; o produto liga o editor e o modelo por fora.

### 16.1 Editor

- **`Prose`** veste todo texto corrido (o `EditorContent` do TipTap entra como filho; revisão e prévia
  também). Lê ganchos `data-*` nos nós: `mark[data-tone]` (marca-texto, sem azul), `[data-ai="unreviewed"]`
  (Sparkles de 12 px na calha, sem fio lateral; em trecho, sublinhado pontilhado), `[data-ai="writing"]`
  (o bloco que a IA escreve agora: o mesmo glifo, respirando; só ele, nunca o texto todo),
  `[data-source-active]` (em trecho `span`: marca-texto azul suave da fonte acesa; fundo, nunca
  sublinhado grosso, que escurece sob a seleção), `[data-source-state="missing"]` (citação que não bate
  com a fonte: ondulado `--red-dot` e “Falta:” para leitor de tela; `used` sem estilo),
  `ins`/`del`/`[data-suggestion]` (papéis `--diff-*`), `[data-stale]` (tracejado âmbar), `[data-block]`,
  `figure > img[data-missing]` (moldura funda no tamanho da imagem com “Imagem indisponível”; o `alt`
  continua) e `img[data-loading]` (a mesma moldura pulsando; com `src`, só o fundo pulsa).
  Parágrafo nunca vira caixa; citação é recuo + aspas. Marcador da IA só na escrita (`edit`): texto
  final (`read`) e `compact` não marcam. `overscroll` (padrão em `edit`) deixa 60% da altura da janela
  depois do fim, para o último bloco ou o alvo de um salto subir ao terço superior; desligue em editor
  embutido que não rola.
- **`proseWidgets`** (`v3/prose-widgets`, sem React e sem editor): o que não está no texto nasce na
  fábrica, nunca no produto — `insertion(texto, { stale, streaming })` (a proposta da IA lida como parte
  do parágrafo, depois do trecho riscado), `caret()` (cursor parado, não pisca), `skeleton(linhas)`
  (seção que ainda vai chegar) e `gutterMarker('ai', { onActivate })` (botão “Revisar texto da IA” na
  calha, com dica; não tira o foco nem a seleção do editor). No ProseMirror, cada um vai num
  `Decoration.widget`; o marcador na 1ª posição do bloco (`side: -1`).
- **`EditableTitle`**: título que vira campo no lugar (Enter salva, Esc desfaz). Vazio ou igual não salva.
  Fica no `header` do `Prose` ou abaixo do `PageHeader`, nunca dentro do título dele (h1 dentro de h1).
- **`Toolbar`** (`ToolbarGroup`, `ToolbarButton`, `ToolbarToggle`, `ToolbarMenu`, `ToolbarSeparator`): uma
  parada de Tab, setas entre itens; o que não cabe vai para “Mais”. `keepFocus` preserva a seleção do editor.
  Indisponível continua focável com o motivo na dica. No `mainHeader` do `WorkspaceLayout` vai sem
  `variant="bar"` (a faixa já tem o fio e os três fios ficam alinhados em 40 px).
- **`Toolbar end`**: estado do documento (ex.: `SaveIndicator` + menu de versões) encostado à direita da
  barra, fora do roving e do “Mais”; os itens saem para o “Mais” antes dele.
- **`Prose size="sm"`**: escala de trabalho (corpo 15/25, `--t-prose-*-sm`) para o estúdio de escrita;
  título com `EditableTitle size="page"`. Leitura longa e revisão seguem em `md`.
- **`AppShell bleed`**: tira respiro e largura máxima do conteúdo para áreas de trabalho encostadas
  (`WorkspaceLayout docked`); páginas comuns continuam com respiro.
- **`SaveIndicator`**: o estado de salvamento da `ActionBar` (ícone, texto, complemento e “Tentar de novo”),
  para quando as ações sobem ao cabeçalho e o estado fica numa barra ou linha de status. `data-force`
  (`hover`, `focus`) para “Tentar de novo” nas pranchas.
- **`FloatingToolbar`** sobre o trecho selecionado: `anchor()` devolve o retângulo; não rouba foco (Alt+F10
  entra, Tab/Esc volta ao texto). Declare dentro do painel que rola. `follow` relê o trecho a cada quadro
  enquanto aberta: para o trecho que cresce ou se move sem rolagem (um widget entrou no parágrafo).
- **A barra nunca cobre texto:** a barra que decide sobre um bloco (sugestão da IA, citação sem fonte)
  vai embaixo do bloco inteiro (`placement="bottom"`, âncora no retângulo do bloco) e o bloco recebe
  `[data-bar-space="below"]`: o `Prose` abre ali o vão da barra (altura dela mais 8 px de cada lado; a
  margem colapsa com a do bloco seguinte). O texto de baixo desce enquanto a barra está aberta.
- **Calha no celular:** em ≤ 560 px da coluna, o `Prose` de escrita tem 24 px de respiro lateral e a calha
  do marcador da IA, 12: o glifo fica a 6 px da borda da tela e do texto.

### 16.2 IA

- **Composição:** `Conversation` → `ConversationTurn` → dentro do turno, `AgentTrace` (passos), `Prose` (texto)
  e `SuggestionCard` (proposta). `ConversationArtifact` resume a peça gerada (“Rascunho v1”). O
  `PromptComposer` vai no `footer` da `Conversation`. A conversa precisa de altura do pai (painel do
  `WorkspaceLayout`). Dentro de um turno, voto e “Gerar de novo” ficam no turno; o `SuggestionCard` não
  os repete.
- **`Conversation`** abre no fim e acompanha o que cresce (turno chegando, trace que abre). Só a pessoa
  rolando para cima solta o acompanhamento e mostra “Ir para o fim”; a rolagem do próprio componente
  nunca mostra o botão sobre a última ação. Já no fim, um pedido novo não desliza; roda, toque, tecla ou
  a barra de rolagem interrompem um deslize em curso.
- **`PromptComposer`**: Enter envia, Shift+Enter quebra; durante a geração, Parar substitui Enviar e Esc para.
  O consumidor limpa `value`. `PromptModelMenu` é o chip de modelo.
- **`AgentTrace`**: passos visíveis de uma geração sobre `ProgressSteps variant="trace"`. Um spinner por vez;
  verde só no fim, vermelho só na falha. Não recolhe sozinho. `compact` é a linha de painel (“Gerando
  agora”): `action` no fim (“Abrir”) e `preview`, o trecho que a IA escreve agora, numa segunda linha
  `--muted` cortada com reticências e fora dos anúncios.
- **`SourceChip`**: fonte citada (chip ou marca numerada no texto) com prévia; `used` e `missing` são status.
- **`SuggestionCard`** / **`SuggestionBar`** / **`SuggestionGroup`**: aceitar, editar, descartar; ⌘↵ aplica e
  Esc descarta só com foco dentro (o editor chama os mesmos callbacks no próprio mapa de teclas).
  Alternativas são rádios num `SuggestionGroup`. Desatualizada = âmbar “Trecho mudou” + “Reaplicar”.
- Texto da IA não revisado é marcado (cinza), nunca azul nem tom de status. Ícone da família: `Sparkles`.

### 16.3 Revisão

- **`DiffView`** compara versões com os papéis neutros `--diff-*` (§2.5): inserção sublinhada, remoção
  tachada, texto para leitor de tela. Em linha ou lado a lado (empilha abaixo de 560 px); blocos sem
  alteração recolhem. Resumo calculado (“+42 −18 palavras · 3 blocos”).
- **`Seal`** só no momento de aprovação (peça aprovada, entrega liberada). Nunca como ícone de status em
  lista: lá é `Badge` teal “Aprovada”.

### 16.4 Mídia editorial

- **`TranscriptViewer`**: falas por falante com tempo; busca destaca (não filtra); filtro de falante; trecho
  usado marcado; seleção abre `FloatingToolbar` com as ações do produto (“Inserir citação”). Uma parada de
  Tab, ↑/↓ entre falas. Acima de 200 falas, só a janela visível renderiza (precisa de altura).
- **`SlideStrip`** + **`SlideCanvas`**: o carrossel. A faixa escolhe, reordena (arrastar ou Alt+setas),
  duplica e exclui com confirmação; o slide é desenhado por dados (`layout`, `theme`, `content`) e avisa
  transbordo por `onOverflow`. Slides fixam a própria paleta (o tema escuro do app não muda a peça).
