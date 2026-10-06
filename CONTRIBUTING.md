# Contribuindo

## Fluxo design-system first

Toda demanda visual começa pela biblioteca, mesmo quando nasceu dentro de uma página de produto.

1. Procure o componente ou padrão no catálogo em `/design-system` e no barril público
   `src/components/ds-v3/index.ts`.
2. Se já existir, amplie sua API apenas quando a necessidade for reutilizável.
3. Se não existir, crie o contrato em `src/components/ds-v3` antes de compor a página consumidora.
4. Adicione ou atualize a prancha em `src/app/design-system-v3/specimens`.
5. Exporte a API pública e escreva um teste de comportamento.
6. Valide a biblioteca e só então atualize a aplicação consumidora.

Não copie um componente para acelerar uma entrega. Duplicação quebra acessibilidade, consistência e a
capacidade de corrigir todos os produtos de uma vez.

## Critério de pronto

Uma mudança de componente deve incluir, quando aplicável:

- API tipada e nomes estáveis;
- estados de repouso, hover, pressionado, foco, selecionado, indisponível, carregando e inválido;
- semântica, nome acessível e operação completa por teclado;
- responsividade a partir de 390 px;
- `prefers-reduced-motion`;
- tokens existentes para cor, tipografia, espaço, raio, sombra e movimento;
- exemplo real no catálogo;
- teste do comportamento principal e das regressões corrigidas;
- exportação em `src/components/ds-v3/index.ts`;
- changelog e migração se houver incompatibilidade.

## Verificação local

```sh
pnpm install --frozen-lockfile
pnpm check
```

Mudanças visuais também devem ser inspecionadas em 1440×900 e 390×844, com foco por teclado, tema
claro/escuro e estados de carregamento, vazio e erro relevantes. Quando disponível:

```sh
21st review src/components/ds-v3
21st review src/app/design-system-v3
```

## Imports e CSS

- O catálogo e os projetos consumidores usam `@content-ventures/design-system/v3` ou um subpath
  público `@content-ventures/design-system/v3/<componente>`.
- Caminhos internos `src/...` não fazem parte do contrato público.
- CSS de produto usa os tokens do `ThemeV3`; valores soltos exigem justificativa no contrato.
- CSS do catálogo pode organizar a prancha, mas não pode virar uma segunda implementação do
  componente exibido.

## Compatibilidade

Não remova ou renomeie exports silenciosamente. Uma mudança incompatível requer versão major, entrada
de changelog e exemplo de migração. Para uso estável via Git, os consumidores devem fixar tag ou SHA.
