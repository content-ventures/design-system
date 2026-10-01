# Exploração de tabelas · Dashboard V2

Pedido de 30/09/2026: comparar outras organizações de tabela para encontrar o encaixe no fluxo do MediaOn. As alternativas são experimentos, sem substituir a tabela aprovada nem definir o design system oficial.

Entrada: **Workspace → Explorar tabelas**, em `/dashboardv2#tabelas`. O seletor oferece três alternativas e o botão “Comparar com a atual” exibe os agrupamentos existentes com os mesmos filtros.

## Contrato comum

- Inter local, cores, lateral, ícones Lucide, bordas suaves e controles de `DESIGN-NOTES.md`.
- Mesmos sete exemplos de campanhas, contexto de veiculação, busca, filtros e ordenação. Esses estados permanecem ao trocar de modelo e usar o histórico do navegador.
- Dados e alterações apenas em memória. Recarregar restaura os exemplos. Nenhuma integração, alteração de backend ou arquivo do produto oficial.
- Filtros Radix já corrigidos na prévia; busca sem distinção de acentos; ordenação numérica; exportação dos resultados visíveis; estado vazio recuperável.
- Status sempre com texto, tabelas HTML com cabeçalhos, `aria-sort`, controles nomeados e foco visível. A ativação permanece bloqueada para campanhas não aprovadas ou concluídas.
- Rolagem horizontal restrita à tabela. No celular, filtros em duas colunas e seletor de modelos compacto. A primeira coluna deixa de ser fixa para não cobrir os demais dados. Em Revisão, a seta de expansão permanece à direita e o detalhe cabe na largura disponível.

## Direções

| Modelo e link local                                                             | Ideia e efeito                                            | Diferenças relevantes                                                                                                                                                       | Melhor encaixe                                                          | Custo e cuidados                                                                                                                                                                 |
| ------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Operação compacta](http://localhost:3002/dashboardv2#tabelas/compacta)         | Percorrer e operar muitos registros com poucas ações.     | Lista contínua com linhas de 44px; seleção por checkbox com pausa/ativação em lote; nome fixo no desktop; separação de anunciante em coluna.                                | Campanhas, inventário e cadastros frequentes.                           | Nomes longos são truncados, disponíveis completos no link e no detalhe. Lotes abrangem apenas campanhas elegíveis visíveis; mudar filtro limpa a seleção.                        |
| [Leitura de performance](http://localhost:3002/dashboardv2#tabelas/performance) | Comparar números e identificar diferenças de entrega.     | Hierarquia numérica com impressões, meta e saldo; barras em coluna destacada; totais e resumo recalculados pelos filtros; identidade e status agrupados na primeira célula. | Entrega de mídia e, adaptando os campos, disponibilidade de inventário. | Exige mais largura. Barras têm percentual textual e nome acessível. Entrega total é calculada pela soma entregue/meta, não pela média dos percentuais.                           |
| [Revisão com contexto](http://localhost:3002/dashboardv2#tabelas/contexto)      | Inspecionar uma campanha sem perder sua posição na lista. | Linhas de 68px; formatos e período visíveis; painel expansível na própria linha com planejamento e entrega; apenas uma linha aberta por vez.                                | Aprovações, planejamento e pedidos de inserção.                         | Menos registros por tela. Expansão é um botão próprio com `aria-expanded`/`aria-controls`, independente do link e do toggle. Detalhes fechados saem da árvore de acessibilidade. |

**Recomendação de partida:** Operação compacta como candidata ao padrão das listas operacionais. Performance e Revisão podem ser visualizações especializadas quando os campos e a tarefa justificarem. Isso é uma recomendação, não uma aprovação do usuário.

## Referências utilizadas

Base visual e de comportamento: `dashboard.module.css`, `workspace-ui.tsx`, `controls.tsx`, `campaign-screen.tsx` e os exemplos locais em `campanhas/campaign-data.ts`. A tabela atual reutiliza `CampaignRows` e `campaignGroups` diretamente; seus estilos não foram alterados.

Pesquisa de padrões via catálogo 21st, usando metadados públicos como inspiração de interação, sem copiar código ou adicionar dependências:

- Compacta: [Data Table Row Selection](https://21st.dev/@felipemenezes098/components/table-row-selection), seleção de linhas e faixa de ações; [Data Table](https://21st.dev/@ephraimduncan/components/table-05), busca e ordenação.
- Performance: [InlineAnalyticsTable](https://21st.dev/@ruixen.ui/components/inline-analytics-table), leitura de métricas com visualização dentro das células. A implementação usa somente os números disponíveis e barras de entrega, sem inventar séries históricas.
- Revisão: [Interactive Logs Table](https://21st.dev/@moumensoliman/components/interactive-logs-table-shadcnui), detalhes expansíveis dentro da lista.

O CLI `21st` não está instalado e `.21st/design.json` não existe neste checkout. A pesquisa usou o conector e este documento registra o contexto dentro da aplicação isolada. Após a escolha do usuário, consolidar apenas as direções aceitas.

## Validação

`table-explorer.test.tsx` cobre persistência de filtros e foco entre modelos, navegação por hash, pausa em lote com elegibilidade, totais filtrados, ordenação numérica, recuperação de busca vazia e expansão por teclado com acesso ao detalhe existente. Inspeção no navegador em desktop e 390px verifica os controles e a composição responsiva.

Verificação final: lint, typecheck e testes do monorepo passaram (149 testes na aplicação isolada). O build geral encontrou a restrição de ambiente já existente no processamento de CSS de `@mediaon/vitrine`: `binding to a port / Operation not permitted`. O build direto de `@mediaon/design-system` passou. Nenhum ajuste foi feito no produto oficial para contornar essa limitação.
