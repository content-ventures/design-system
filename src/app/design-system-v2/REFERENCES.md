# Refinamento a partir dos prints — 30/09/2026

O usuário forneceu 12 referências para melhorar partes do Design System V2. A base aprovada continua sendo o Dashboard V2: Inter 400/500/600, azul, controles compactos, superfícies claras e contornos discretos. Estes refinamentos ficam abertos à revisão individual; não significam aprovação automática de cada componente.

## Tradução das referências

| Referência                 | Aplicação no catálogo   | Decisão                                                                                                                     |
| -------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1 · upload                 | `#upload`, `#anexo`     | Área de seleção, arquivos separados, formato/tamanho, progresso, conclusão, falha, cancelamento, retomada e modal.          |
| 2 · avatares               | `#avatar`               | Foto local, iniciais, ícone, quadrado, presença, verificação, contagem, carregamento, identificação e grupo com excedentes. |
| 3 · pessoas com pendências | `#membros`              | Identidade e papel na linha principal; aviso contextual abaixo apenas quando há uma pendência, com ação relacionada.        |
| 4, 8 e 9 · etapas laterais | `#wizard`, `#stepper`   | Etapas com posição atual, concluídas e pendentes. Retorno preserva valores. No celular, as etapas ficam acima do conteúdo.  |
| 5 e 7 · seleção com prévia | `#wizard`               | Cartões de mídia com miniatura, capacidade, preço e seleção nativa. Prévia de contexto com alternância desktop/celular.     |
| 6 · opções em modal        | `#modal`                | Quatro escolhas por radio, miniaturas distintas, seleção azul e rodapé cancelar/salvar. Cancelar descarta o rascunho.       |
| 10 · checklist             | `#template-dashboard`   | Preparação do portal com progresso por tarefa e grupos recolhíveis. Conexões são apenas estados ilustrativos.               |
| 11 e 12 · kanban           | `#kanban`, `#card-lead` | Colunas neutras, marcador de etapa, contagem/valor, cards com origem, contato, valor, atividade, metadados e responsáveis.  |

Gradientes, roxo, sombras fortes e molduras externas das referências não fazem parte da linguagem aprovada. A incorporação é da organização do conteúdo e do comportamento dos componentes.

## Componentes e composições

As primitivas estão em `src/components/ds-v2`: `Avatar`, `AvatarGroup`, `Stepper`, `ChoiceCard`, `FileDropzone` e `FileItem`. `Status` ganhou a variante opcional `soft` para etiquetas contextuais; `dot` continua sendo o padrão. `Popover` aceita controle opcional de abertura, usado ao mover cards.

Os consumidores continuam responsáveis pelo domínio. O kanban, membros, wizard, checklist e fila simulada ficam em `lead-board.tsx`, `reference-flows.tsx`, `reference-media.tsx` e `product-specimens.tsx`. Não conhecem banco, autenticação, tenant ou APIs externas.

O kanban permite busca sem diferenciação de acentos, filtro por responsável, ordenação, novo lead validado, detalhe lateral e movimentação por arraste ou menu. Depois da movimentação, o foco retorna à ação do card na nova coluna. No celular o quadro tem rolagem própria, sem alargar a página.

Arquivos reais selecionados ficam somente em memória. Imagens têm prévia local; documentos podem ser baixados para consulta. URLs temporárias são revogadas ao fechar a prévia. O progresso é **simulado manualmente**, incluindo falha e retomada. A coluna de estados contém exemplos estáticos identificados; não representa uma fila conectada.

O retrato usado na família de avatares é o recurso fictício já existente em `public/images/avatar-demo.png`, com origem documentada ao lado do arquivo. Nenhuma imagem externa nova ou dependência foi adicionada.

## Continuidade

Os 126 IDs e as notas individuais continuam preservados. A visão geral tem atalhos para os itens refinados. Alterações futuras em medidas, peso, cor e estados devem ocorrer na primitiva compartilhada quando forem regras do componente. Conteúdo e organização de um fluxo ficam no consumidor.

Pesquisa complementar no catálogo 21st: [Stepper, Origin UI](https://21st.dev/@originui/components/stepper) e [Kanban Board](https://21st.dev/@arunjdass/components/kanban-board). Foram consultados metadados; nenhum código externo foi incorporado. O CLI `21st` não está instalado, portanto a revisão é feita pelo código, testes e navegador.

## Verificação

- `pnpm lint`, `pnpm typecheck` e `pnpm test` passaram no monorepo. A aplicação de design system tem 191 testes em 19 arquivos.
- Nove testes novos cobrem fallback de imagem, etapas por teclado, movimentação/filtro/criação de lead, validação de arquivo, cancelamento/retomada, prévia com liberação da URL, descarte da seleção no modal e progresso do checklist. A regressão do cadastro também verifica o foco na nova etapa.
- O build isolado `pnpm --filter @mediaon/design-system build` passou. O build geral foi executado com `SKIP_ENV_VALIDATION=1` e interrompido pela restrição de abertura de porta do Turbopack na Vitrine (`Operation not permitted`). Não há validação completa do build do monorepo.
- Conferência em desktop e celular: kanban e menu de movimentação com retorno de foco, upload, avatares, modal, cadastro com prévia e cards de membros. Nos exemplos móveis conferidos, o conteúdo não alarga a página; o kanban mantém rolagem interna. O Dashboard V2 também foi conferido visualmente.
- [Captura do kanban refinado](../../../references/mediaon-design-system-v2-references.png).

## Segunda rodada de referências

Novos 12 prints enviados em 30/09/2026. A implementação segue o mesmo tema aprovado e mantém os 126 IDs, as notas e as marcações individuais. As composições continuam abertas à revisão do usuário.

| Prints desta rodada                  | Onde avaliar                            | Adaptação                                                                                                                                                               |
| ------------------------------------ | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 e 8 · agenda e evento              | `#calendario`                           | Mês com indicadores de eventos, filtro por dia/mês, lista com data e contexto, tarefas, criação/edição com horário, dia inteiro, participantes e notas.                 |
| 2 · detalhe com histórico            | `#drawer`, `#detalhe-lead`              | Identidade, campos do registro, etapa, próximo contato e notas ao lado da linha do tempo; conteúdo empilhado no celular. Fechar/reabrir o painel conserva notas locais. |
| 3 · convites e membros               | `#membros`                              | Convites por e-mail ou link demonstrativo, múltiplos destinatários, papel, membros e uso de lugares. Validação de endereços, duplicatas e capacidade.                   |
| 4 · planos                           | `#planos`                               | Benefícios por plano, comparação mensal/anual, valor mensal e total anual, revisão antes da seleção local. Valores são fictícios.                                       |
| 5 · avisos acionáveis                | `#alerta`, `#banner`                    | Título, contexto, ações específicas e dispensa. A recuperação atualiza o aviso; o prazo pode ser editado. Os toasts permanecem compactos.                               |
| 6 · escolhas de privacidade          | `#privacidade`                          | Escolhas com prévia, idioma e métricas opcionais. Não altera cookies nem concede consentimentos.                                                                        |
| 7 · confirmação com etapas           | `#wizard`                               | Etapas concluídas ao lado da confirmação, resumo do período, mídias e investimento, com retorno à edição.                                                               |
| 9 · grupos e papéis                  | `#template-configuracoes` → Integrações | Linhas de grupo/papel, estado alterado, salvar/descartar. Nenhum diretório está conectado.                                                                              |
| 10, 11 e 12 · preferências e empresa | `#template-configuracoes`               | Seções com rótulos à esquerda, perfil, logo local, uso da marca, cidade/fuso, cor e densidade com prévia, equipe e notificações. Rascunho preservado entre abas.        |

Primitivas adicionadas em `components/ds-v2/contextual.tsx`: `MonthCalendar`, `InlineAlert`, `SettingsSection` e `SwitchField`. O calendário usa o `react-day-picker` já instalado, com navegação por teclado e rótulos de dias com eventos. `Dialog` aceita `size="wide"`, sem alterar o tamanho padrão. `SwitchField` compõe o switch existente com rótulo visível; switches de tabelas continuam compactos. Prefixos de input não quebram linha e atributos de invalidez do consumidor são preservados.

Pesquisa complementar de metadados no 21st: [Alert](https://21st.dev/@serafimcloud/components/alert), [Calendar](https://21st.dev/@designali-in/components/calendar) e [Calendar with Event Indicators](https://21st.dev/@cnippet-dev/components/v-calendar-10). Nenhum código externo ou dependência nova foi incorporado.

Os arquivos escolhidos como logo ficam em memória; URLs de prévia são revogadas na troca ou desmontagem. Os convites, papéis, eventos, preços e preferências são demonstrações locais. `apps/web`, `apps/vitrine`, `packages/ui`, autenticação e banco não foram alterados.

### Verificação da segunda rodada

- `pnpm lint`, `pnpm typecheck` e `pnpm test` passaram no monorepo. No design system: 201 testes em 20 arquivos. Dez testes novos cobrem calendário por teclado, evento inválido/dia inteiro, descarte de edição, convites e capacidade, rascunho de configurações, papéis de grupo, total anual dos planos, avisos e persistência de notas ao reabrir o painel.
- `pnpm --filter @mediaon/design-system build` passou. O build geral foi tentado com `SKIP_ENV_VALIDATION=1`; a Vitrine continua bloqueando a execução por `binding to a port` / `Operation not permitted`. O build completo do monorepo não está validado.
- Conferência visual em 1280 px e 375–390 px: agenda, evento com erro e foco, detalhe, configurações, planos e convites. Dropdown no modal mantém o foco e fecha com Escape sem fechar o diálogo. Agenda e detalhe não alargam a página no celular. Dashboard V2 conferido visualmente.
- [Captura da agenda refinada](../../../references/mediaon-design-system-v2-agenda.png).
