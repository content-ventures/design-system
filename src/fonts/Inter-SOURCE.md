# Inter — família escolhida para a interface

Escolha explícita do usuário em 29/09/2026. Substitui Geist Sans no piloto.

Origem oficial: https://github.com/rsms/inter

Commit fixado: `353b61b9f4430d5f420d56605a6e7993e0941470`.
Diretório original: `docs/font-files`.

| Arquivo local        | Arquivo original     | Peso / uso                                  |
| -------------------- | -------------------- | ------------------------------------------- |
| inter-regular.woff2  | Inter-Regular.woff2  | 400 — textos e informações de apoio         |
| inter-medium.woff2   | Inter-Medium.woff2   | 500 — controles, navegação ativa e métricas |
| inter-semibold.woff2 | Inter-SemiBold.woff2 | 600 — títulos e nomes de campanhas          |

Arquivos oficiais apenas renomeados, sem alterações de glifos. A licença SIL Open
Font License 1.1 do mesmo commit está preservada em `Inter-OFL.txt`.

Carregamento por `next/font/local` exclusivamente em `/campanhas`. Sem pacote novo
ou requisição externa de fonte em runtime. Pesos reais, sem negrito sintetizado.
A marca MediaOn e a biblioteca raiz congelada permanecem intactas. Tamanhos,
entrelinhas, cores, espaçamentos e numerais tabulares existentes são preservados.
