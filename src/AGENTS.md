# Continuidade visual do MediaOn

Em 30/09/2026, o usuário aprovou explicitamente a base estética de `/dashboardv2` e pediu que as próximas telas mantenham esse padrão.

Antes de criar ou alterar interfaces nesta aplicação:

1. Ler `app/dashboardv2/DESIGN-NOTES.md`, o contrato visual aprovado.
2. Usar `app/dashboardv2/dashboard-workspace.tsx` e `app/dashboardv2/dashboard.module.css` como referência de composição, componentes, medidas e estados. A captura aprovada está em `../references/dashboardv2-approved.png`.
3. Preservar Inter local, densidade compacta, lateral clara, azul de seleção, bordas suaves, ícones Lucide finos, abas sublinhadas e agrupamentos em tons suaves.
4. Reutilizar ou extrair os padrões aprovados conforme necessário, mantendo a aparência da referência. Novas telas não autorizam uma nova direção estética.
5. Considerar também `app/dashboardv2/application.module.css` e os componentes locais da rota. O usuário pediu uma aplicação em tela cheia, sem a moldura externa de mockup, com a estrutura do produto oficial. A biblioteca local `components/ds-v2` foi autorizada; a integração na aplicação oficial permanece separada.
6. Tratar a biblioteca antiga e o piloto de `/campanhas` como histórico visual. Seus estilos não sobrepõem a aprovação de `/dashboardv2`.
7. Após a autorização de criação do Design System V2, usar `components/ds-v2` como biblioteca. Consultar seu README e o catálogo `/design-system-v2`. As telas do Dashboard consomem essa mesma implementação; não voltar a duplicar componentes dentro das rotas.

A aprovação é da estética. Seguem válidos o escopo frontend isolado, os dados fictícios e os demais limites do `../README.md`. Instruções posteriores do usuário prevalecem.
