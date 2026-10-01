# Public Sans — fonte do piloto de campanhas

Fonte oficial: https://github.com/uswds/public-sans

Origem fixada no commit `62058987ce57f64e39a30adc8a512998a3110c70`, diretório `fonts/webfonts`. Arquivos estáticos originais, apenas renomeados localmente; nenhum glifo modificado.

| Arquivo local              | Original                  | Peso |
| -------------------------- | ------------------------- | ---- |
| public-sans-regular.woff2  | PublicSans-Regular.woff2  | 400  |
| public-sans-medium.woff2   | PublicSans-Medium.woff2   | 500  |
| public-sans-semibold.woff2 | PublicSans-SemiBold.woff2 | 600  |

Licença SIL Open Font License 1.1: `Public-Sans-OFL.txt` e esclarecimentos do projeto em `Public-Sans-LICENSE.md`, preservados do mesmo commit.

Carregamento por `next/font/local` somente no layout `/campanhas`; nenhuma requisição a provedores de fontes em tempo de execução. A biblioteca anterior continua com suas fontes originais.
