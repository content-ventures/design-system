# Dashboard v2 — padrão estético aprovado

Rota: `/dashboardv2`, na aplicação isolada `@mediaon/design-system`, porta 3002.

## Aprovação e continuidade

**Aprovado explicitamente pelo usuário em 30/09/2026:** “Eu gostei bastante dessa base do design, super aprovado.” O pedido seguinte é preservar esse padrão nas novas telas. Esta é a referência vigente para a evolução visual do MediaOn nesta aplicação.

Referências persistentes:

- [Captura aprovada de Campanhas](../../../references/dashboardv2-approved.png).
- [Composição e interações](dashboard-workspace.tsx).
- [Base visual aprovada](dashboard.module.css) e [composição de aplicativo](application.module.css).
- [Fonte local e configuração da página](page.tsx).

O contrato abaixo registra a implementação aprovada. Novas funções devem adaptar seu conteúdo a essa linguagem. Mudanças de identidade visual dependem de um novo pedido do usuário; pedidos comuns de novas telas preservam a base. Ajustes de acessibilidade e responsividade devem manter a linguagem visual.

## Contrato visual para as próximas telas

| Elemento              | Padrão aprovado                                                                                                                                                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Composição            | Aplicativo em tela cheia, lateral quase branca `#fafafa` de 230px e conteúdo branco. Sem moldura externa, margem de apresentação ou canto de mockup, conforme pedido posterior do usuário.                                                                                           |
| Tipografia            | Inter local. Após o refinamento solicitado: página 24/32px, peso 600; seções 14/20px, peso 600; conteúdo 13/20px, peso 400; nomes 13/20px, peso 500; rótulos 12/18px, peso 500; apoio 11/16px, peso 400. Botões principais 600, secundários 500. Ver [TYPOGRAPHY.md](TYPOGRAPHY.md). |
| Cores principais      | Títulos `#151719`, conteúdo `#41474f`, apoio `#686f78`, bordas `#ededf0`. Azul `#0783f8` para acento e estado ligado; botão principal `#0875db` para contraste com texto branco; seleção `#dfeeff`.                                                                                  |
| Navegação             | Menu com ícones Lucide finos, agrupamentos e espaçamento da base. Item ativo em azul claro com marcador lateral de 3px. Cabeçalho com breadcrumb, título acompanhado por ícone e descrição curta.                                                                                    |
| Abas                  | Contorno discreto na aba selecionada, sublinhado azul de 2px; ícone e texto. Mesma escala dos controles ao redor.                                                                                                                                                                    |
| Grupos                | Cabeçalhos de fundo suave: azul `#eef8ff`, amarelo `#fff8ee`, rosa `#fff0f6` e verde `#eefaf3`. Ícone, nome e contador; expansão pelo cabeçalho. Cores complementam os rótulos.                                                                                                      |
| Tabelas               | Cabeçalho de 39px e linhas de 48px, divisórias finas, cantos de 9px. Texto alinhado, números tabulares, nomes longos com truncamento e acesso ao nome completo.                                                                                                                      |
| Ritmo e raios         | Conteúdo com 24px nas laterais no desktop e 16px no celular. Grupos separados por 22px, sem contorno externo duplicado. Controles e ícone do título com raio de 7px.                                                                                                                 |
| Controles             | Botões pequenos e discretos, uma ação principal por contexto. Toggle de veiculação azul ligado, cinza pausado, trilho de 32×19px e alvo de 44px. Estados desabilitados explícitos.                                                                                                   |
| Ícones e profundidade | Lucide, traço fino de 1,5px. Bordas leves e sombras mínimas apenas onde já aparecem; superfícies lisas.                                                                                                                                                                              |
| Responsividade        | Manter a densidade e a hierarquia, adaptando o espaço disponível. Menu recolhível em telas pequenas, rolagem horizontal dentro das tabelas e controles acessíveis por teclado.                                                                                                       |

## Como evoluir sem perder o padrão

Em 30/09/2026, o usuário autorizou criar o Design System V2 a partir desta base. A biblioteca reutilizável está em [`src/components/ds-v2`](../../components/ds-v2/README.md) e o catálogo em `/design-system-v2`. Tokens, controles, botões, abas, status, toggle, tabelas, composições de formulário e toasts foram extraídos e são consumidos pelo Dashboard V2. As fachadas de compatibilidade da rota não são novas implementações. Integração no produto oficial continua separada.

Exploração solicitada de alternativas para tabelas: ver [TABLE-EXPLORATION.md](TABLE-EXPLORATION.md). A área “Explorar tabelas” mantém a identidade e permite comparar três organizações com a tabela de campanhas.

Adequação solicitada das tabelas a cada seção: ver [TABLE-PATTERNS.md](TABLE-PATTERNS.md). Listas de registros não são mais agrupadas automaticamente por status. Históricos usam linhas compactas de 44px; cadastros com informação secundária usam 62px. Colunas, filtros e ordenação seguem o domínio. Campanhas preservam grupos; leads preservam o funil; notificações usam lista de mensagens. Essas variações autorizadas prevalecem sobre a medida inicial de tabela do contrato acima.

Refinamento solicitado dos cadastros, inputs e botões: ver [CREATION-PATTERNS.md](CREATION-PATTERNS.md). As telas de campanha, inventário e públicos compartilham seções, resumo ao vivo e ações persistentes, dentro da mesma identidade visual.

Refinamento solicitado da hierarquia tipográfica: ver [TYPOGRAPHY.md](TYPOGRAPHY.md). As próximas telas devem reutilizar os papéis `--type-*` de `dashboard.module.css`, evitando novas combinações avulsas de tamanho, peso e cinza.

Referência enviada para toasts: ver [TOASTS.md](TOASTS.md). A área “Toasts” permite experimentar avisos compactos ou com título e ação. A tonalidade suave, o ícone em uma superfície própria e o botão arredondado seguem a referência específica deste componente, preservando a tipografia da aplicação.

### Limpeza visual autorizada em 30/09/2026

O usuário pediu explicitamente retirar o “T” dos inputs, reduzir ícones em caixas, eliminar bordas internas redundantes e diminuir textos auxiliares. A aplicação desse refinamento mantém Inter, hierarquia, cores, densidade, navegação e estados da base aprovada.

- Campos de texto sem ícones decorativos. Prefixo monetário e unidades continuam visíveis, sem divisória dentro do input.
- Numeração de seção e ícones de mídia/atividade sem caixas. Resumo de cadastro sem ícone repetido. Ícone principal da página, sinais de navegação e ícones dos toasts mantêm suas funções e aparência.
- Tabelas compartilhadas preservam contorno, cabeçalho e separadores de linha, retirando a grade vertical. Indicadores e valores do resumo usam espaçamento em vez de linhas internas. Bordas de controles, seleção e foco permanecem.
- Formulários usam rótulos diretos, orientação apenas quando necessária, erros associados e contador próximo ao limite. Mensagens repetidas de prévia, instruções que repetiam os campos, texto de próximo passo e progresso duplicado saíram. Os atalhos do resumo e o estado de alterações continuam funcionais.
- Dashboard com título descritivo e menos legendas repetidas. Detalhes de registros exibem contexto específico e vínculos, sem repetir a descrição geral da página.

Reutilizados `CreationField`, `CreationSection`, `CreationSummary`, `MediaChoices`, `FormButton`, os controles locais e os estilos das tabelas. Nenhuma dependência nova. Escopo restrito ao frontend em `apps/design-system`; toasts da referência e produto oficial preservados.

Validação: lint, tipos e testes do monorepo passaram (159 testes na prévia), assim como o build isolado de `@mediaon/design-system`. Conferência visual em 1280px e 390px, com criação de métrica, dropdown pelo teclado, erro/foco no nome obrigatório, seleção de mídia e resumo. Sem rolagem horizontal externa ou descrições acessíveis apontando para elementos removidos no formulário conferido. O build geral foi tentado e interrompido pela mesma restrição de porta do Turbopack na Vitrine. O CLI `21st review` permanece indisponível; a revisão utilizou código, testes e navegador.

### Continuidade

1. Começar pela composição e pelo CSS de `/dashboardv2`, escolhendo os padrões adequados à nova função: menu, cabeçalho, abas, agrupamentos, tabela e controles.
2. Reutilizar componentes existentes. Quando a repetição justificar extração, mover os padrões aprovados para componentes e tokens locais sem alterar o resultado visual da página de referência.
3. Manter a mesma família tipográfica, escala, densidade, espaçamentos, bordas e linguagem de cores. Formulários, detalhes e outras telas devem parecer parte do mesmo workspace.
4. Não retomar as direções congeladas, a seleção violeta do piloto anterior, fontes alternativas, títulos grandes, sombras fortes, gradientes decorativos ou novos estilos de cartões em pedidos comuns de tela.
5. Verificar a nova tela e `/dashboardv2` em desktop e celular quando compartilhar estilos ou componentes. Conferir também seleção, foco, estado vazio, conteúdo longo e controles habilitados/desabilitados.

## Evolução autorizada: estrutura do produto

Após aprovar a estética, o usuário pediu a estrutura do MediaOn oficial nesta linguagem, somente frontend, com navegação utilizável e sem a moldura de mockup. O layout agora ocupa a janela inteira; cabeçalho, menu e conteúdo possuem rolagem independente. Essa adaptação preserva a estética aprovada. A captura original permanece intacta como referência histórica.

As áreas funcionais foram mapeadas por leitura dos arquivos `packages/ui/src/components/layouts/portal-nav.ts`, `admin-nav.ts` e páginas existentes em `apps/web/src/app`. Nenhum arquivo desses diretórios foi alterado. A referência funcional é o código do produto; a referência estética é exclusivamente `/dashboardv2`.

O menu replica Configuração, Operação e Portal. “Mais ferramentas” reúne as áreas complementares. Um seletor de visualização permite avaliar também o anunciante e a administração da plataforma. É uma demonstração de navegação, sem autenticação ou troca real de permissões.

| Área na prévia                                          | Origem funcional no produto                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------- |
| Dashboard                                               | `dashboard`                                                         |
| Métricas, Canais, Públicos, Inventário, Bônus           | `metrics`, `channels`, `audiences`, `inventory`, `bonus-rules`      |
| Campanhas, Pedidos de Inserção, Leads                   | `campaigns`, `orders`, `leads`                                      |
| Fornecedores, Empresa & Branding, Categorias da Vitrine | `suppliers`, `settings/company`, `settings/categories`              |
| Auditoria, Operações, Configurações                     | `audit`, `ops`, `settings`                                          |
| Pacotes de mídia, Performance                           | `packages`, `performance`                                           |
| DATA.ON, Prospecta, Customer Success                    | `data-on`, `prospecta/contas`, `cs`                                 |
| Vitrine, Catálogo de Mídia, Criativos, Notificações     | `vitrine/painel`, `catalog`, `my-creatives`, `notifications`        |
| Portais, Usuários, Webhooks                             | `/admin/portals`, `/admin/users`, `/admin/webhooks`                 |
| Importações, Entrada de leads, Fila de e-mails          | `/admin/imports`, `/admin/lead-inbox`, `/admin/notification-emails` |

São 30 áreas de avaliação estrutural, com profundidade reduzida. Subfluxos especializados (editor público da Vitrine, upload de peças, assinatura de P.I., integrações, disponibilidade real e permissões) ficam para etapas futuras. As listas compartilham a composição visual, mas os campos e exemplos refletem cada domínio.

### Interações disponíveis

- Navegação por hash, links diretos, voltar/avançar do navegador, busca no menu e seleção de área. Todos os fluxos permanecem em `/dashboardv2`.
- Busca sem diferenciação de acentos, filtros por domínio, ordenação por coluna e exportação CSV. Campanhas mantêm grupos recolhíveis.
- Cadastro e edição de exemplos, detalhes e atalhos para as áreas relacionadas. As visões operacionais de leitura não oferecem mutações reais.
- Criação de rascunhos de campanha, validação básica de formulário, seleção de mídia e detalhes no novo visual.
- Toggle de campanha por clique ou teclado. Somente campanhas aprovadas em veiculação ou pausadas permitem alternância. Rascunhos, aprovação e encerradas permanecem bloqueadas.
- Leads em funil e lista; mudança de etapa pelo seletor de cada cartão.
- Catálogo por formato, dashboard com indicadores do cenário fictício e navegação para os registros.
- Branding, preferências e papéis de exemplo alteráveis localmente. Nenhuma mudança de acesso real, envio de mensagem ou conexão externa.
- Menu móvel com foco contido, fechamento por Escape, retorno de foco e fundo inerte; tabelas com rolagem própria e abas navegáveis por teclado.

Todos os dados são fictícios. Campanhas, registros, preferências e papéis permanecem em memória durante a navegação. Recarregar a página reinicia o cenário. A indicação “Prévia · dados fictícios” permanece visível no menu.

### Organização local

- `workspace-data.ts`: navegação, definições de campos, exemplos e URLs locais.
- `dashboard-workspace.tsx`: estrutura da aplicação, roteamento de hash e estado da sessão.
- `workspace-ui.tsx`: agrupamentos, listas, controles e indicadores locais.
- `campaign-screen.tsx`: lista e detalhe de campanhas; `campaign-editor.tsx`: criação de rascunhos.
- `record-screens.tsx`: listas, detalhes, funil e catálogo; `record-editor.tsx`: criação e edição dos cadastros.
- `record-table-model.ts`, `record-table.tsx` e `record-table.module.css`: organização e apresentação das listas por domínio.
- `creation-ui.tsx` e `creation.module.css`: composição dos formulários, seções, resumo, seleção de mídia e botões.
- `controls.tsx` e `controls.module.css`: inputs, seletores, dinheiro, datas e validação junto aos campos.
- `overview-settings.tsx`: dashboard e configurações.
- `application.module.css`: extensão da base aprovada para a composição em tela cheia.

A biblioteca local foi extraída para `src/components/ds-v2` após autorização do usuário. A integração no produto oficial permanece separada. O piloto anterior em `/campanhas` é reutilizado somente pelos dados de exemplo, contexto e toggle; sua aparência e rotas não são expostas como continuação do novo fluxo.

O catálogo 21st foi consultado como apoio. Nenhum código do catálogo foi incorporado. O CLI `21st` não está instalado neste ambiente; a revisão foi feita pelo código, testes e navegador.

### Verificação

`dashboard-workspace.test.tsx` cobre alternância de campanhas e bloqueio por etapa, estado preservado entre áreas, busca combinada com filtros, recuperação de estado vazio, criação e detalhe de campanha, links diretos/histórico, cadastro e edição de público, abas pelo teclado, grupos recolhíveis, movimentação de leads e mudança de visualização.

A inspeção visual cobre desktop e celular, incluindo ausência de rolagem horizontal da página, rolagem interna das tabelas, menu móvel e formulário. A captura original aprovada permanece em `references/dashboardv2-approved.png`; a nova composição está em `references/dashboardv2-workspace.png`.

Validação desta ampliação: `pnpm lint`, `pnpm typecheck` e `pnpm test` passaram (136 testes na aplicação isolada; avisos de lint preexistentes nos pacotes oficiais). `pnpm --filter @mediaon/design-system build` passou. O build geral foi executado com `SKIP_ENV_VALIDATION=1` e interrompido pela restrição do ambiente ao abrir uma porta no processamento de CSS da Vitrine (`Operation not permitted` no Turbopack); isso cancelou os outros builds paralelos. A compilação isolada valida a prévia, sem declarar o monorepo inteiro compilado.

## Revisão dos controles

Após o feedback sobre dropdowns e inputs, os controles da prévia foram padronizados em `controls.tsx` e `controls.module.css`, sem alterar o produto oficial.

- Seletores de perfil, anunciante, filtros, cadastros, papéis e etapas de leads usam Radix Select, com opções visíveis na página, foco, teclado, Escape e fechamento externo. A camada de opções fica no escopo visual do Dashboard V2 e respeita os limites da janela.
- Inputs e textareas compartilham altura, padding, borda, foco e erro. Campos de busca têm área clicável delimitada e foco visível; checkboxes preservam o azul aprovado.
- Dinheiro aceita valores brasileiros (`1.234,56`), valida entradas inválidas e preserva centavos ao salvar e exibir os dados.
- Datas aceitam digitação em `dd/mm/aaaa` e seleção em calendário localizado em português, com Radix Popover e React Day Picker. Datas inexistentes e períodos invertidos são recusados.
- Mensagens ficam junto aos campos, são associadas por `aria-describedby` e o primeiro campo inválido recebe foco, preservando o restante do formulário.
- O seletor móvel fecha antes do menu lateral quando Escape é pressionado. A movimentação de um lead devolve o foco ao seletor na nova coluna.

As versões das três dependências já estavam presentes no monorepo e foram adicionadas diretamente apenas à aplicação isolada. Não há importação de componentes do produto oficial.

Verificação: 144 testes da aplicação passaram, incluindo 8 regressões específicas para teclado, fechamento, formulários, dinheiro e datas. Lint, tipos e testes do repositório passaram; o build geral mantém a restrição de abertura de porta no Turbopack da Vitrine. Conferência visual e de uso no desktop e em viewport móvel de 390px.

O build isolado após a revisão passou (`pnpm --filter @mediaon/design-system build`). Captura dos seletores e campos revisados: [controles do Dashboard V2](../../../references/dashboardv2-controls.png).
