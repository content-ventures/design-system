# Content Ventures Design System

Fonte única da verdade visual para os produtos da Content Ventures. O repositório tem duas partes que
evoluem juntas:

- **biblioteca:** componentes React, tokens, fontes, ícones e padrões reutilizáveis;
- **harness visual:** catálogo navegável onde cada contrato é documentado e validado antes de chegar
  às aplicações.

## Regra principal

Uma aplicação consumidora não cria componentes visuais do zero. Primeiro procura a solução no design
system. Se ela não existir, a ordem obrigatória é:

**necessidade da aplicação → biblioteca → catálogo e teste → exportação pública → aplicação**

Essa regra vale para pessoas e para qualquer agente de código, incluindo Codex/OpenAI, Claude/Anthropic
e outras ferramentas. Aplicações importam o pacote; não copiam componentes, CSS, tokens ou fontes.

## O que existe aqui

- Componentes e API pública: `src/components/ds-v3`
- Tokens e tema: `src/components/ds-v3/theme.module.css`
- Contrato visual: [`src/components/ds-v3/README.md`](src/components/ds-v3/README.md)
- Catálogo: `src/app/design-system-v3`, publicado localmente em `/design-system`
- Ícones: `src/components/ds-v3/icons.ts`
- Fonte Inter local: `src/fonts`, com licença OFL
- Regras para agentes: [`AGENTS.md`](AGENTS.md) e [`CLAUDE.md`](CLAUDE.md)

## Desenvolvimento

Requisitos: Node.js 20.9 ou superior e pnpm 10.

```sh
corepack enable
pnpm install
pnpm dev
```

Abra [http://localhost:3000/design-system](http://localhost:3000/design-system).

Antes de enviar mudanças:

```sh
pnpm check
```

O comando executa lint, TypeScript, testes e o build de produção. Consulte também o
[`CONTRIBUTING.md`](CONTRIBUTING.md).

## Usar em outro projeto Next.js

Enquanto não houver um registry privado, instale pelo GitHub. Fixe um tag ou commit em produção; use
`#main` apenas durante desenvolvimento.

```sh
pnpm add "git+ssh://git@github.com/content-ventures/design-system.git#main"
```

Transpile o pacote no `next.config.ts`:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@content-ventures/design-system'],
};

export default nextConfig;
```

No layout raiz, aplique a fonte e o escopo do tema:

```tsx
import type { ReactNode } from 'react';
import { interV3, ThemeV3 } from '@content-ventures/design-system/v3';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={interV3.variable}>
      <body>
        <ThemeV3>{children}</ThemeV3>
      </body>
    </html>
  );
}
```

Depois, consuma apenas a API pública:

```tsx
import { Button } from '@content-ventures/design-system/v3';

export function Example() {
  return <Button>Continuar</Button>;
}
```

Imports profundos documentados, como `@content-ventures/design-system/v3/charts`, continuam disponíveis
para reduzir o grafo importado. Não importe arquivos por caminhos internos de `src/`.

## Versionamento

- Correção compatível: patch.
- Componente ou variante compatível: minor.
- Remoção, renomeação ou mudança de contrato: major, com migração documentada.

O pacote permanece `private` para impedir publicação pública acidental. O consumo via Git continua
funcionando; quando houver um registry privado, a publicação deve ser liberada de forma explícita.
