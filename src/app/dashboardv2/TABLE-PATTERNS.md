# Tabelas por contexto

Em 30/09/2026, o usuário pediu que cada seção tivesse uma estrutura adequada ao conteúdo. O exemplo de Importações mostrava duas tabelas de uma linha, separadas por status, com cabeçalhos repetidos. O agrupamento automático por status foi removido das listas de registros. A identidade visual de `/dashboardv2` permanece a referência.

## Composição por domínio

| Contexto                                                         | Estrutura aplicada                                                                                                                                                                                                 |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Importações, auditoria e filas                                   | Histórico contínuo e compacto, datas e situações na própria linha. Entradas mais recentes primeiro. Filtros específicos para tipo, responsável ou portal.                                                          |
| Webhooks                                                         | Lista compacta de integrações com evento, destino, última entrega e situação.                                                                                                                                      |
| Inventário                                                       | Nome, formato e canal juntos; público, estoque com capacidade e unidade, preço com unidade de cobrança e disponibilidade. Não soma estoques de unidades diferentes.                                                |
| Públicos                                                         | Nome e categoria juntos, pessoas na base, origem, ativos vinculados e status.                                                                                                                                      |
| Métricas e canais                                                | Colunas de configuração: tipo de valor, precificação, visibilidade, métricas de entrega ou ativos.                                                                                                                 |
| Usuários, fornecedores, categorias e portais                     | Identidade principal e informação secundária na mesma célula. Papel, vínculo e contagens ocupam colunas próprias.                                                                                                  |
| Operações e pedidos de inserção                                  | Pendência ou pedido com contexto secundário, responsável ou anunciante, prazo e situação; pedidos incluem valor. Prazo crescente por padrão.                                                                       |
| Performance e DATA.ON                                            | Números alinhados à direita, barras discretas e contexto de métrica ou período. Origem e período aparecem como texto, sem tratamento de status. Barras de performance comparam apenas resultados da mesma métrica. |
| Prospecta, Customer Success, Vitrine, pacotes, bônus e criativos | Colunas, filtros e rótulos definidos para cada atividade.                                                                                                                                                          |
| Notificações                                                     | Lista de mensagens com título, descrição, data e indicação de leitura. Abrir marca como lida apenas na sessão da prévia.                                                                                           |
| Campanhas e leads                                                | Campanhas preservam agrupamentos e toggles. Leads preservam o funil e usam tabela contínua no modo Lista.                                                                                                          |

As linhas operacionais têm 44px; cadastros com informação secundária usam 62px. Tipografia, bordas horizontais, cores e controles vêm da base aprovada. Abas por situação permanecem somente onde ajudam a navegação; os demais recortes usam seletores. Cada cabeçalho permite ordenar sua coluna e anuncia a direção com `aria-sort`.

## Implementação e continuidade

- `record-table-model.ts`: colunas, larguras, densidade, filtros, ordenação inicial e apresentação por domínio. Novas áreas devem declarar uma organização própria nesse arquivo.
- `record-table.tsx` e `record-table.module.css`: apresentação compartilhada das células e da lista de notificações. Reutilizam `Status`, os formatadores, links, tokens e contorno de tabela existentes.
- `record-screens.tsx`: combina busca e filtros, mantém estados vazios, detalhes e exportação. O CSV de inventário inclui unidade de preço e capacidade.
- `workspace-data.ts`: datas fictícias em ISO para ordenação cronológica; `workspace-ui.tsx` apresenta datas e horários em português, no fuso de São Paulo.

Continua sendo uma prévia de frontend com dados em memória. Nenhuma alteração em backend, produto oficial, permissões ou integrações. Nenhuma dependência adicionada.

## Verificação

`record-table.test.tsx` cobre o histórico único de importações, ordenação numérica e cronológica, combinação de filtros e busca, estado vazio, unidades do inventário, filtro de pessoas, leitura de notificações e consistência das definições de todos os domínios. Os testes existentes de inventário e leads foram ajustados à nova organização.

Conferência no navegador em desktop de 1280px e celular de 390px, incluindo importações, inventário, usuários, performance e notificações. No inventário móvel, a página mantém 390px e a tabela rola dentro da própria região. Filtros funcionam pelo teclado e os registros abrem os detalhes.

Lint, tipos e testes do monorepo passaram; a prévia tem 166 testes. O build isolado (`pnpm --filter @mediaon/design-system build`) passou. O build geral foi tentado, mas o Turbopack da Vitrine encontrou a restrição do ambiente ao abrir uma porta (`Operation not permitted`), cancelando os builds paralelos.

Consulta de inspiração 21st limitada a metadados: [Interactive Logs Table](https://21st.dev/@moumensoliman/components/interactive-logs-table-shadcnui) e [Audit Log Table](https://21st.dev/@arihantcodes_1f7b8c4d/audit-log-table). Nenhum código copiado. O CLI `21st review` não está disponível; revisão realizada pelo código, testes e navegador.
