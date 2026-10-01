# Design System V2 · MediaOn

**Biblioteca V2 criada a partir da base aprovada:** abra [localhost:3002/design-system-v2](http://localhost:3002/design-system-v2). Componentes reutilizáveis em `src/components/ds-v2`, com [API e regras de uso](src/components/ds-v2/README.md). O catálogo apresenta fundamentos, componentes, estados, tabelas por contexto e formulários. O Dashboard V2 já consome essa biblioteca. A página inicial abre o catálogo; estudos anteriores ficam em `/exploracoes`.

**Base estética aprovada em 30/09/2026: `/dashboardv2`.** O usuário aprovou explicitamente essa composição e pediu que as próximas telas preservem seu padrão. O contrato visual está em [Dashboard v2 — padrão aprovado](src/app/dashboardv2/DESIGN-NOTES.md), com [captura de referência](references/dashboardv2-approved.png). Partir dessa base para as novas telas.

As duas primeiras explorações e o piloto anterior em `/campanhas` permanecem como histórico; não orientam a estética das próximas telas. Os registros do piloto estão em [DESIGN-NOTES.md](src/app/campanhas/DESIGN-NOTES.md). A aprovação estética de `/dashboardv2` não muda o escopo de demonstração: os dados são fictícios, e a integração no produto continua sendo uma etapa separada.

## Limites inegociáveis

- Somente frontend, nesta aplicação isolada e na branch `codex/design-system`.
- Não alterar `apps/web`, `apps/vitrine`, `packages/ui`, banco, backend, autenticação, permissões, integrações ou infraestrutura.
- Nenhuma importação do produto, consulta a APIs, uso de credenciais ou dados reais.
- Exemplos fictícios em memória em `/dashboardv2`, sem persistência no navegador ou banco. Somente o piloto histórico de `/campanhas` pode salvar um rascunho no `sessionStorage`, sob `mediaon-ds-v2-campaign-demo`, quando solicitado por seu botão.
- A criação da biblioteca local foi autorizada em 30/09/2026. Integração na aplicação oficial e no Harness continua sendo uma etapa separada.

## Executar

`pnpm --filter @mediaon/design-system dev` → http://localhost:3002

`pnpm --filter @mediaon/design-system test`, `lint`, `typecheck`, `build`.

A página `/dashboardv2` apresenta 30 áreas da estrutura do MediaOn no visual aprovado, em tela cheia. Inclui navegação de portal, anunciante e plataforma; públicos, inventário, canais, métricas, bônus, campanhas, P.I.s, leads, configurações e ferramentas complementares. Busca, filtros, cadastros de exemplo, detalhes, funil de leads e toggle de veiculação funcionam localmente. Todos os fluxos permanecem dentro do novo visual; recarregar reinicia os exemplos. A biblioteca local foi extraída em `src/components/ds-v2`; a integração na aplicação oficial permanece separada. Detalhes em [Dashboard v2](src/app/dashboardv2/DESIGN-NOTES.md).

## Direção anterior — congelada, não aprovada

Conexão fluida: azul conexão, grafite mineral, superfícies flutuantes e curvas generosas. A assinatura explora duas formas que se encontram; é um estudo, não a marca oficial. Instrument Sans ganha hierarquia mais expressiva nos títulos. IBM Plex Mono fica restrita a tokens e informação técnica. Fontes hospedadas localmente; licenças OFL em `src/fonts`.

A página de princípios compara três conceitos: Conexão fluida (camadas e navegação lateral, proposta para o Ad Manager), Estúdio editorial (navegação superior e conteúdo mais amplo, alternativa para a Vitrine) e Console de performance (densidade maior e métricas em paralelo, alternativa operacional). São estudos, não escolhas aprovadas. Nas duas primeiras, preservar densidade e leitura no celular; na terceira, cuidar do tamanho dos alvos e do contraste em superfícies escuras.

Raios semânticos: 8px nos detalhes, 12px nos campos, 20px nos painéis, 28px nas áreas de marca e cápsula nos botões/status. Profundidade leve separa planos sem depender de bordas fortes em todos os elementos. Movimento: 200ms nos controles, 360ms na entrada de conteúdo, 480ms nos gráficos e 650ms na assinatura (reproduzível sob comando, sem loop). `prefers-reduced-motion` elimina deslocamentos perceptíveis.

A revisão reutiliza as primitivas existentes e acrescenta `LeadCard` e `ConnectionMark`. O mesmo card de lead aparece na visão geral, na galeria e no kanban. Destaque, expansão de contato e registro são apenas estado local. As pessoas e empresas são fictícias; o contato usa domínio `.invalid` e nunca envia mensagens.

O CLI e os conectores 21st não estavam disponíveis nesta sessão; nenhum componente externo foi gerado ou instalado. A exploração foi implementada diretamente em React/CSS Modules, interpretando a pasta de referências e o feedback do usuário.

O produto anterior foi considerado apenas para o inventário funcional, nunca como referência estética. A aplicação V2 usa CSS Modules e tokens próprios; não duplica nem altera os estilos compartilhados do produto.

## Referências interpretadas

- [Painel Media.ON no Pinterest](https://br.pinterest.com/jvfagundesfs/mediaon/), consultado em 29/09/2026. A pasta mostrava 44 pins. Percurso visual até o fim da pasta; aprofundamento do pin Campaign Creation Flow 1/3.
- [Campaign Creation Flow 1/3](https://br.pinterest.com/pin/975451600589086148/): leitura da navegação em etapas e do contexto persistente, sem reproduzir layout.
- Referências da pasta sobre tabelas, project visibility, menus, campanhas e configurações: hierarquia discreta, seleção legível, baixa ornamentação.
- [Classificação por produto](https://claude.ai/code/artifact/e0ef7182-f041-4b55-b135-018819ebce44) e [Arquitetura MediaOn v2](https://claude.ai/artifact/7tiqagrhf5P3E8n7JQoiNp): contexto de personas e jornadas. Roadmap não equivale a funcionalidade entregue.

Nenhum asset, layout ou código dos pins foi incorporado. Ícones Lucide e fontes abertas mantêm suas licenças. A identidade tipográfica “media.on” no laboratório é uma proposta, não substitui a marca oficial.

## Organização dos estudos anteriores

- `src/components/ds/tokens.css`: tokens semânticos claros/escuros e três simulações de acento white-label.
- `src/components/ds/primitives.tsx`: controles reutilizáveis, diálogo nativo, abas com teclado, feedback e estados.
- `src/components/ds/{charts,campaign-table,campaign-wizard}.tsx`: composições interativas com mocks.
- `src/app/catalog.ts`: quais itens do inventário possuem amostras. Contagem é de itens cobertos, não de componentes únicos completos.
- `src/app/foundations.tsx` e `component-examples.tsx`: documentação e exemplos agrupados por família.
- `src/app/showcase.tsx`: visão geral, inventário e biblioteca de telas.

## Regras para as próximas telas

1. Usar `/dashboardv2` como referência estética aprovada. Reutilizar sua composição e, conforme novas telas precisarem, extrair seus componentes e tokens para a biblioteca local, preservando a aparência. Consultar o contrato visual e comparar com a captura aprovada antes de concluir cada tela.
2. Usar tokens semânticos; não depender de cores fixas de um portal.
3. Campanhas e formulários longos em páginas, com etapas e revisão. Diálogos só para confirmações ou ajustes pequenos.
4. Uma ação principal por contexto. Estados não dependem apenas de cor.
5. Preservar teclado, foco, responsividade, movimento reduzido e alternativas textuais para gráficos.
6. Mostrar explicitamente o que está em revisão ou ainda planejado. A primeira versão não implementa todos os estados de todos os 126 itens.
7. Validar telas e estados reais posteriormente, sem mudar regras de negócio nesta branch.

## Escopo dos estudos anteriores

Filtros, ordenação, paginação, seleção, arquivo CSV de mocks, tema, abas, preferências e confirmação funcionam localmente. Upload lê apenas nome/tamanho/tipo para prévia, sem transmissão. O fluxo de campanha conclui uma demonstração, não publica campanhas.

Calendário e seleção usam controles nativos nesta fase. Não há conexão com biblioteca corporativa, aprovação automática, teste de carga, auditoria formal de acessibilidade ou pesquisa com usuários. Componentes planejados permanecem sinalizados no menu.
