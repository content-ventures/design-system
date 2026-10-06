<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Content Ventures Design System

Este repositório é a fonte única da verdade visual para os produtos da Content Ventures. Estas regras
valem para qualquer agente de código — Codex, Claude ou outra ferramenta — e para qualquer pessoa que
contribua no projeto.

## Regra inegociável: design system primeiro

- Nenhum projeto consumidor cria um componente visual ou padrão de interação do zero.
- Antes de implementar uma necessidade numa aplicação, procure a solução no barril público
  `@content-ventures/design-system/v3` e no catálogo em `/design-system`.
- Se a solução não existir, implemente-a primeiro em `src/components/ds-v3`, documente-a no catálogo,
  teste-a e exporte-a em `src/components/ds-v3/index.ts`. Só depois consuma-a na aplicação.
- Aplicações importam o pacote; não copiam componentes, CSS Modules, tokens, fontes ou ícones para o
  próprio código.
- CSS de produto usa os papéis e escalas de `src/components/ds-v3/theme.module.css`. Não introduza
  cores, fontes, espaçamentos, raios, sombras ou movimento arbitrários.
- Código do catálogo pode ter CSS de apresentação próprio, mas seus exemplos de produto devem ser
  compostos com componentes públicos do design system.

## Contrato de uma mudança

1. Leia `src/components/ds-v3/README.md` e o componente mais próximo antes de editar.
2. Prefira ampliar uma primitive existente a criar uma variante paralela.
3. Um componente novo precisa de API tipada, estados aplicáveis, teclado, foco visível, movimento
   reduzido, responsividade, exportação pública, prancha no catálogo e teste.
4. Mudanças incompatíveis exigem versão nova, changelog e instruções de migração.
5. Antes de concluir, rode `pnpm check` e revise os arquivos alterados com `21st review` quando o CLI
   estiver disponível.
