# MediaOn DS V3 — Contrato

Biblioteca: `src/components/ds-v3`. Catálogo: `http://localhost:3002/design-system`.
**Fonte da verdade visual: o `/dashboardv3` aprovado** (lista, detalhe com Analytics, criação em 6 etapas,
seletores de data, bloco de verba, diálogo de criação) e `src/app/dashboardv3/docs/auditoria-ui-ux.md`.
Se este contrato e o dashboard divergirem, vale o dashboard — e o contrato é corrigido.

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

## 3. Tipografia

Inter 400/500/600, `font-synthesis: none`. Títulos com `--track-title`. Escala (auditoria):

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
Ícone acompanha texto; ícone sozinho só com nome acessível + `Tooltip`. **Sem `IconTile` decorativo**:
`IconTile` só em estado vazio/erro/acesso (um por estado).

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
- Dados fictícios: Francal 2026; anunciantes Aurora Calçados, Estúdio Norte, Casa Forma, Lume Acessórios,
  Grupo Horizonte, Ateliê Sul, Pátio Couro, Bella Passo, Couro Nobre; pessoas Marina Lopes, Rafael Dias,
  Clara Souto, Tiago Rezende, Juliana Prates; ativos Banner Super Topo — Portal, E-mail marketing dedicado,
  Push no app da feira, Painel de LED — Pavilhão Azul, Destaque na vitrine.

## 12. Layout

- **Moldura do app** (igual ao dashboard): menu lateral `--sidebar-w` 236 em `--g-25` com fio à direita,
  encostado; topo `--topbar-h` 52 com fio, um único fio corre do menu ao conteúdo; conteúdo branco direto
  com `--page-gutter` 32 (24 em ≤1024, 16 em ≤640), limite `--content-max` 1760 centralizado.
- **Menu lateral:** item 34 px, `--r-md`; ativo = `--nav-active-bg` + texto 500 ink + ícone b-600 +
  **barra de 3 px `--nav-active-bar` à esquerda** (top/bottom 9 px, raio 3). **É o único lugar do sistema
  com barra de destaque lateral.** Até 1199 px vira gaveta (véu, Escape, `inert` no conteúdo).
- **Breakpoints:** 390 celular · 640 (rodapé de ações em 1 linha, diálogo vira bottom sheet) · 760 (tabela →
  cartões, título 22) · 1024 · 1199 (menu gaveta) · 1280 · 1440 (referência) · 1600 (detalhe em 2 colunas)
  · 1920/2560 (para em 1760).
- **Grades:** principal + lateral `minmax(0,1fr) var(--aside-w)`; formulário 2 colunas gap 16; cartões
  `repeat(auto-fill, minmax(min(196px,100%),1fr))` gap 8; faixas de números com fio de 1 px entre células.
- **Moldura fixa (criação):** altura `100dvh − topo`; cabeçalho (título 18 + régua de etapas); corpo rola
  (miolo + lateral 320 com rolagem própria e esmaecimento no fim); rodapé fixo `--action-bar-h` 64 com 4
  slots fixos — Cancelar, Salvar rascunho, Voltar, principal (mín. 196). `overflow: clip`. Em ≤640:
  X no topo, régua só com marcadores (rótulo só na atual), rodapé `[←] [Salvar rascunho] [Principal]`.
- Lista com paginação sempre. Criação é página com etapas, nunca modal. Modal só confirma ou edita pouco.

## 13. Pranchas do catálogo

Pipelines compartilham `KanbanBoard`, `KanbanColumn` e `KanbanCard`. `LeadCard` preserva
responsável, origem e atividades; `CampaignKanbanCard` usa a mesma base com campanha, anunciante,
portal, verba e período. Não duplicar CSS do cartão nas telas. Status de campanhas só avançam
pelas regras e ações do produto; o arrasto livre do exemplo de leads não substitui esse fluxo.

- **Página do item:** família (caption `--muted`) → título `--t-page` → à direita, `Checkbox` “Revisado”
  (chave `mediaon-dsv3-item-reviews`) → pranchas → anterior/próximo. Sem lede, sem abas de uso, sem
  “Quando usar/Evitar”.
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
- APIs existentes são retrocompatíveis: o dashboard usa a biblioteca. Mudança visual de um componente que
  o dashboard usa exige recaptura do dashboard (`capture-all.mjs`) sem regressão.

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
| composição (sem arquivo de biblioteca próprio)                                                                                                                               | padroes-b, templates |

Arquivo dividido em blocos: releia antes de cada edição e toque só no seu bloco. Use componente de outro
grupo pela API atual; se a melhoria dele ainda não chegou, a prancha continua válida.

## 15. Verificação

- `npx tsc --noEmit -p apps/design-system` e `npx eslint <seus arquivos>` (a partir de `apps/design-system`).
- Capturas em 1440×900 e 390×844 (`shoot.mjs`, `WAIT=1400`), sem erro de console; olhe cada PNG.
- Critério de pronto: alinhamento em grade de 4, nenhum texto quebrando feio, números alinhados, nenhum
  degradê/sombra em repouso, todos os estados aplicáveis desenhados, teclado completo, celular sem
  rolagem lateral, dashboard sem regressão.
