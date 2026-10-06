# Content Ventures · contexto de design

## Produto

Este é um design system: biblioteca reutilizável e harness visual dos produtos da Content Ventures.
Stack principal: Next.js, React e CSS Modules. O catálogo roda em `/design-system`.

## Fontes da verdade

- Tokens e temas: `src/components/ds-v3/theme.module.css`
- API pública: `src/components/ds-v3/index.ts`
- Contrato visual: `src/components/ds-v3/README.md`
- Pranchas e templates: `src/app/design-system-v3`
- Regras de contribuição: `AGENTS.md` e `CONTRIBUTING.md`

## Direção

- Tema claro por padrão, com modos escuro e sistema no mesmo conjunto de papéis semânticos.
- Inter 400/500/600; densidade compacta; escala espacial de 4 px.
- Controles com raio de 8 px, superfícies com 10 px e camadas com 16 px.
- Interfaces chapadas: borda antes de sombra; sombra apenas em elementos flutuantes.
- Azul representa ação, foco e seleção. Cores de status têm significado semântico próprio.
- Movimento curto e funcional, sempre respeitando `prefers-reduced-motion`.

## Restrições

### Obrigatório

- Procurar e reutilizar a API pública antes de criar UI.
- Criar necessidades novas na biblioteca, com teste e prancha, antes de usá-las numa aplicação.
- Consumir tokens semânticos do `ThemeV3`.
- Preservar teclado, foco visível, acessibilidade, responsividade e estados relevantes.
- Importar o pacote em aplicações; nunca copiar componentes ou CSS.

### Evitar

- Primitives visuais locais nas aplicações.
- Valores visuais arbitrários fora dos tokens.
- Implementações paralelas entre catálogo e biblioteca.
- Gradientes decorativos, glow, vidro ou sombras em superfícies de repouso.
- Imports internos não documentados.

## Decisões duráveis

- Em 06/10/2026, o design system foi definido como fonte única da verdade visual para todos os
  produtos e para qualquer agente de programação usado pela Content Ventures.
- Biblioteca e catálogo permanecem juntos: uma mudança só está pronta depois de validada no harness e
  disponibilizada pela API pública.
- O catálogo navega diretamente por busca e famílias, sem inventário separado, notas ou marcação de
  revisão. Aprovações são tratadas fora da interface do design system.
