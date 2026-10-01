# Dashboard V2 — criação, campos e botões

Refinamento solicitado em 30/09/2026: trabalhar as telas de criação, inputs e botões depois da exploração de tabelas. A referência estética continua sendo [DESIGN-NOTES.md](DESIGN-NOTES.md). Não houve mudança na identidade nem extração para o design system oficial.

## Composição e fluxos

- `/dashboardv2#campanhas/novo`: informações da campanha; investimento e período; seleção de mídia.
- `/dashboardv2#inventario/novo`: identidade e formato; canal e público; disponibilidade e preço.
- `/dashboardv2#publicos/novo`: identidade; composição da base; situação.
- Os demais cadastros e edições reutilizam a composição de identidade e detalhes, respeitando os campos já definidos em `workspace-data.ts`.

O formulário usa seções numeradas sem caixas, títulos diretos e divisórias leves. Descrições aparecem apenas quando esclarecem uma escolha, como a seleção de várias mídias. O resumo lateral acompanha o preenchimento e permite voltar às seções por botões que movem o foco ao título correspondente. Esses atalhos distinguem seções preenchidas e pendentes; o contador e a barra de progresso redundantes foram retirados. No celular, o resumo passa para depois dos campos.

A barra inferior mantém Cancelar e a ação principal acessíveis durante a rolagem. Ela indica alterações ainda não salvas e resume os erros depois de uma tentativa de envio. Não há atraso artificial para simular salvamento: os dados são atualizados imediatamente em memória.

O nome exibe o contador a partir de 80% do limite. Campos de texto não levam o ícone “T”; valores monetários usam o prefixo `R$` sem divisória interna; números podem ter unidade. Rótulos, orientações úteis e erros permanecem associados aos campos. Datas permitem digitação e calendário. Seletores usam os controles Radix existentes. Botões compartilham variantes principal, secundária e discreta, com estados de foco, hover, pressionado e desabilitado.

Campanhas permitem escolher várias mídias por checkboxes em cartões compactos. O inventário oferece seleção exclusiva de formato por rádios. Canal e público usam os registros presentes na sessão da prévia, incluindo públicos recém-criados. Cancelar uma edição retorna ao detalhe sem aplicar o rascunho.

Na limpeza visual autorizada em 30/09/2026, os ícones das opções de mídia passaram a aparecer sem caixas internas. O resumo perdeu o ícone duplicado, o selo “Prévia”, as linhas entre valores e o bloco “O que acontece depois?”. A barra inferior mostra o estado de alterações quando há preenchimento e mantém os erros e as ações. A criação de campanha informa uma única vez que será salva como rascunho. A indicação de dados fictícios continua no menu.

## Escopo e manutenção

- Apenas `apps/design-system`, com dados fictícios em memória; recarregar reinicia a sessão.
- Nenhuma mudança em backend, autenticação, banco, `apps/web`, `apps/vitrine` ou `packages/ui`.
- `creation-ui.tsx` concentra composição e elementos compartilhados; `campaign-editor.tsx` e `record-editor.tsx` preservam os fluxos específicos.
- Os controles de `controls.tsx` mantêm a validação e a navegação por teclado existentes.
- A moldura usa `overflow: clip` para impedir que foco ou `scrollIntoView` desloquem o aplicativo inteiro. A região de conteúdo continua tendo rolagem própria.

## Referências de apoio

A base aprovada do projeto foi a referência principal. O catálogo 21st foi consultado para organização de rótulos, descrições e grupos de escolha:

- [Field Components](https://21st.dev/@anubra266/components/field-components).
- [Form Fields with Tooltip Hints](https://21st.dev/@cnippet-dev/components/v-tooltip-13).
- [Textarea With Helper Text](https://21st.dev/@shadcnspace/components/textarea-08).
- [Multi-Select Questionnaire](https://21st.dev/@sean0205/components/c-questionnaire-2).
- [Checkbox Group Form](https://21st.dev/@cnippet-dev/components/v-checkbox-group-5).
- [Data Export Checkbox Group](https://21st.dev/@cnippet-dev/components/v-checkbox-group-14).

Nenhum código externo foi copiado e nenhuma dependência foi adicionada neste refinamento. O CLI `21st` não está instalado; as tentativas de `21st init --design-context` e `21st review` retornaram comando inexistente. A revisão usou os componentes locais, testes e navegador.

## Verificação

`pnpm lint`, `pnpm typecheck` e `pnpm test` passaram no monorepo. A aplicação isolada tem 152 testes passando, incluindo três novas regressões em `creation-forms.test.tsx`: resumo e foco de seção; criação de público seguida de inventário, edição e cancelamento; validação com preservação dos campos.

`pnpm --filter @mediaon/design-system build` passou. A sequência geral de CI também foi executada; o build geral, com `SKIP_ENV_VALIDATION=1`, foi interrompido na Vitrine pela restrição do ambiente ao abrir uma porta durante o processamento de CSS pelo Turbopack (`Operation not permitted`). Não se declara o build completo do monorepo validado.

No navegador, foram verificados criação de rascunho, atualização do resumo, seleção de mídias, anunciante, calendário, canal do inventário e validação de preço. A revisão visual cobriu desktop de 1280px e celular de 390px, sem rolagem horizontal externa e com botões de ação acessíveis. O preenchimento e a navegação entre seções mantêm cabeçalho e lateral estáveis.

Capturas: [campanha](../../../references/dashboardv2-creation-campaign.png), [público](../../../references/dashboardv2-creation-public.png) e [seleção de mídia](../../../references/dashboardv2-creation-media.png).
