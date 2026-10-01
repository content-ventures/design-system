# Hierarquia tipográfica do Dashboard V2

Revisão solicitada em 30/09/2026: padronizar variação, cor e peso da fonte, com atenção ao texto fino nos botões. A família Inter local, a densidade do aplicativo e sua identidade visual foram preservadas. Estes padrões pertencem à prévia isolada, sem alteração no produto oficial.

## Diagnóstico e correção

A regra `.canvas button { font-weight: 400 }` tinha mais especificidade que a classe de botão. O navegador confirmava peso 400 em “Nova métrica”, embora o componente declarasse 500. O padrão passou a `:where(.canvas) button`, com peso médio e especificidade menor que as classes dos componentes. Ações principais declaram 600; secundárias e ações discretas declaram 500. Seletores de formulário mantêm o peso regular do valor, enquanto filtros compactos usam 500.

Havia textos auxiliares de 9–10px, diversos cinzas claros e títulos similares definidos com pesos e tamanhos diferentes. A revisão concentrou os papéis em variáveis locais na raiz `.canvas` de `dashboard.module.css`, herdadas também pelos popovers. Os módulos de aplicação, controles, criação e exploração de tabelas passaram a consumir essa escala.

## Papéis de leitura

| Token             | Tamanho / entrelinha | Peso | Uso                                                |
| ----------------- | -------------------- | ---- | -------------------------------------------------- |
| `--type-page`     | 24 / 32px            | 600  | Título da página; 22 / 30px no celular             |
| `--type-heading`  | 18 / 26px            | 600  | Título de detalhe e introdução do dashboard        |
| `--type-section`  | 14 / 20px            | 600  | Seções, grupos e painéis                           |
| `--type-body`     | 13 / 20px            | 400  | Conteúdo, valores de input e células               |
| `--type-entity`   | 13 / 20px            | 500  | Nome do registro e item principal                  |
| `--type-label`    | 12 / 18px            | 500  | Rótulos de campo e filtros                         |
| `--type-caption`  | 11 / 16px            | 400  | Instruções, metadados e estado auxiliar            |
| `--type-overline` | 11 / 16px            | 500  | Cabeçalhos de tabela e agrupamentos do menu        |
| `--type-button`   | 12 / 18px            | 500  | Ações secundárias e discretas                      |
| `--type-primary`  | 12 / 18px            | 600  | Criar, salvar e demais ações principais            |
| `--type-stat`     | 24 / 30px            | 600  | Indicadores; tamanho reduzido em espaços estreitos |

Tamanhos especiais ficam limitados a adaptações de espaço, iniciais de avatares e campos editáveis no celular (16px para evitar zoom automático). Não reduzir instruções abaixo de 11px. As alternativas de tabela preservam sua composição; nenhuma foi promovida ao padrão definitivo.

## Cor e ênfase

- `--ink: #151719`: títulos, nomes e valores destacados.
- `--text: #41474f`: conteúdo e rótulos.
- `--muted: #686f78`: descrições, metadados e instruções.
- O azul de seleção continua `#0783f8`. O fundo da ação principal usa `--action: #0875db`, mantendo a mesma família de cor e melhorando a leitura do branco.
- Cores de erro e estado preservam seus significados. Evitar cores avulsas para criar níveis de texto neutro.
- Usar peso 600 para hierarquia e ação principal, 500 para identificação/controle e 400 para leitura contínua. Os três arquivos locais da Inter já fornecem esses pesos; não há nova fonte ou dependência.

Os pares centrais foram calculados: título sobre branco 17,97:1; conteúdo sobre branco 9,38:1; apoio sobre a lateral `#fafafa` 4,87:1; branco sobre o botão principal 4,59:1. Isso descreve esses pares, não uma certificação de acessibilidade de todos os estados da aplicação.

Valores tabulares preservam `font-variant-numeric: tabular-nums` depois da declaração abreviada `font`, evitando que ela redefina o alinhamento numérico.

## Verificação

- Navegador confirmou título 600, botão principal 600, secundário 500 e instruções 400; revisão visual de Métricas, Nova campanha, seletor de anunciante, tabela compacta e Dashboard.
- Celular de 390px: conteúdo sem overflow horizontal, títulos e rótulos sem cortes e ações fixas legíveis. O viewport de teste foi restaurado.
- `pnpm lint`, `pnpm typecheck` e `pnpm test` passaram, com 152 testes na aplicação isolada.
- O build geral foi tentado com `SKIP_ENV_VALIDATION=1`; a Vitrine foi interrompida pela restrição de abertura de porta do Turbopack no ambiente. O build isolado da prévia passou.
- O CLI `21st review` segue indisponível neste ambiente; revisão feita no código e nos estilos computados no navegador.

Capturas: [Métricas](../../../references/dashboardv2-typography-metrics.png) e [formulário no celular](../../../references/dashboardv2-typography-mobile.png).
