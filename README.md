# Content Ventures Design System

Fonte central do Design System usado pelos projetos da Content Ventures. Este repositório reúne a
biblioteca de componentes, os tokens visuais, as fontes e o catálogo navegável do DS V3.

O conteúdo foi extraído de `apps/design-system` da branch
`origin/claude/design-system-v2-unreviewed-a6cd9b` do MediaOn, no commit `5003644`, mantendo o histórico
dos arquivos do Design System.

## Conteúdo

- **Componentes e tokens:** `src/components/ds-v3`
- **Contrato visual:** [`src/components/ds-v3/README.md`](src/components/ds-v3/README.md)
- **Catálogo:** `src/app/design-system-v3`, publicado em `/design-system`
- **Ícones:** `src/components/ds-v3/icons.ts`
- **Fonte:** Inter local em `src/fonts`, com licença OFL

## Desenvolvimento

Requisitos: Node.js 24 e pnpm 10.

```sh
corepack enable
pnpm install
pnpm dev
```

Abra [http://localhost:3000/design-system](http://localhost:3000/design-system).

Antes de enviar mudanças:

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Uso em outro projeto

Enquanto o pacote não estiver publicado em um registry, ele pode ser instalado diretamente do GitHub:

```sh
pnpm add "git+ssh://git@github.com/content-ventures/design-system.git#main"
```

Em um projeto Next.js, habilite a transpilação do pacote:

```ts
const nextConfig = {
  transpilePackages: ['@content-ventures/design-system'],
};

export default nextConfig;
```

Use o tema como escopo raiz e importe os componentes pelo barril público:

```tsx
import { Button, ThemeV3 } from '@content-ventures/design-system/v3';

export function Example() {
  return (
    <ThemeV3>
      <Button>Continuar</Button>
    </ThemeV3>
  );
}
```

## Regras de evolução

1. Um componente novo entra primeiro na biblioteca, com prancha no catálogo e teste.
2. Cor, tipografia, espaçamento e movimento devem vir dos tokens do tema.
3. Ícones de produto entram por `src/components/ds-v3/icons.ts`.
4. Mudanças incompatíveis exigem nova versão e instruções de migração.
