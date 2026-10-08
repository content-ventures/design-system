# Inter — família escolhida para a interface

Escolha explícita do usuário em 29/09/2026. Substitui Geist Sans no piloto.

Origem oficial: https://github.com/rsms/inter

Commit fixado: `353b61b9f4430d5f420d56605a6e7993e0941470`.
Diretório original: `docs/font-files`.

| Arquivo local               | Arquivo original           | Peso / uso                                       |
| --------------------------- | -------------------------- | ------------------------------------------------ |
| inter-regular.woff2         | Inter-Regular.woff2        | 400 — textos e informações de apoio              |
| inter-medium.woff2          | Inter-Medium.woff2         | 500 — controles, navegação ativa e métricas      |
| inter-semibold.woff2        | Inter-SemiBold.woff2       | 600 — títulos e nomes de campanhas               |
| inter-italic.woff2          | Inter-Italic.woff2         | 400 itálico — ênfase no texto corrido (`em`)     |
| inter-medium-italic.woff2   | Inter-MediumItalic.woff2   | 500 itálico — ênfase em rótulos e citações       |
| inter-semibold-italic.woff2 | Inter-SemiBoldItalic.woff2 | 600 itálico — ênfase dentro de títulos e negrito |

Arquivos oficiais apenas renomeados, sem alterações de glifos. A licença SIL Open
Font License 1.1 do mesmo commit está preservada em `Inter-OFL.txt`.

As faces itálicas entraram em 07/10/2026 para a tipografia de leitura (editor de
artigos): o tema usa `font-synthesis: none`, então sem elas o itálico sairia em pé.

Carregamento por `next/font/local` exclusivamente em `/campanhas`. Sem pacote novo
ou requisição externa de fonte em runtime. Pesos reais, sem negrito ou itálico
sintetizado. A marca MediaOn e a biblioteca raiz congelada permanecem intactas.
Tamanhos, entrelinhas, cores, espaçamentos e numerais tabulares existentes são
preservados.
