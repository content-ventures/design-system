# Design System V3 · MediaOn

A fonte do DS oficial da plataforma. O `apps/web` consome os componentes por `@mediaon/ui`
(que reexporta `@mediaon/design-system/v3`); este app existe para o catálogo e para os testes do DS.

- **Componentes e tokens:** `src/components/ds-v3` — contrato de uso em [ds-v3/README.md](src/components/ds-v3/README.md).
- **Catálogo:** `src/app/design-system-v3` — as pranchas de cada componente, servidas em `/design-system`
  (aqui e no `apps/web`).
- **Ícones:** `src/components/ds-v3/icons.ts` — a única porta de ícones das telas (`@mediaon/ui/icons`).
- **Fonte:** Inter local (`src/fonts`, licença OFL ao lado).

## Executar

`pnpm --filter @mediaon/design-system dev` → http://localhost:3002

`pnpm --filter @mediaon/design-system test`, `lint`, `typecheck`, `build`.

## Regras

1. Componente que falta entra primeiro aqui, com prancha no catálogo e teste, e só depois vai para a tela.
2. Tokens do tema, nada de cor solta; status é ponto + palavra; nunca iniciais.
3. O `apps/web` tem a trava `pnpm lint:ds` (medidor do resíduo do front antigo) e o ESLint recusa
   imports do front antigo.

As explorações anteriores (V1, V2, `/dashboardv2`, `/dashboardv3`, `/campanhas`) saíram do código em
03/10/2026 e continuam no histórico do git (branch local `arquivo/ds-prototipos`).
