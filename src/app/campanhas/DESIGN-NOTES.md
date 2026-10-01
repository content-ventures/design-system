# Campanhas — histórico do piloto anterior

**Atualização de 30/09/2026:** a base estética aprovada pelo usuário é `/dashboardv2`. Para novas telas, seguir [o padrão aprovado](../dashboardv2/DESIGN-NOTES.md). As direções e restrições estéticas abaixo documentam este piloto anterior e não substituem o padrão aprovado.

Pedido: desenhar primeiro uma tela de gestão de campanhas que sustente uma identidade própria; extrair o design system somente depois da validação. As versões anteriores foram rejeitadas. Em 29/09 o usuário escolheu os novos prints e o projeto do Dribbble como vertente visual. A biblioteca anterior está congelada; esta execução ainda requer validação.

## Direção vigente — pedido de fidelidade ao print

O último print (arquivo `codex-clipboard-7410b2e6-6246-476e-8744-338063869b3a.png`, 2048×1536) passa a ser a especificação de composição, não apenas inspiração. O usuário pediu proximidade de fonte, tamanho, peso, cor, botões e hierarquias. **A tela ainda não foi aprovada.** Os registros históricos abaixo não devem sobrepor esta revisão.

- Monitoramento é a entrada padrão de `/campanhas`: lista de cartões com cabeçalho e quatro métricas na faixa inferior. A tabela continua disponível em Operação; Portfólio e Veiculação são alternativas preservadas.
- Busca de campanhas no topo, faixa informativa, título e criação na mesma linha, quatro filtros alinhados (anunciante, status, formato e ordenação), abas planas, contagem/período e lista. Removido o resumo extra de indicadores que não existe no print.
- Sidebar clara, seleção violeta discreta e separadores sólidos. MediaOn no topo e identificação da equipe de demonstração no rodapé, conforme revisão abaixo; não copiar marcas de referência ou inventar contas/fotos.
- Fonte **Inter local**, escolha explícita do usuário, com arquivos estáticos reais 400/500/600. Origem oficial fixada e licença em `src/fonts/Inter-SOURCE.md`. Instrument Sans da marca e fontes da biblioteca congelada permanecem intactas. Fontes anteriores ficam preservadas em disco como histórico.
- Paleta tipográfica: título `#20232b`, secundário `#475467`, metadados `#667085`; canvas `#f8fafb`, bordas `#e2e6ea`, ação `#5339f3` e banner sólido `#5446ae` preservados. Sem chamada externa para carregar fontes.
- Busca e controles 40px; criação 42px; raios de 7px nos controles, 8px nos cartões e 12px na faixa. Cartões com intervalo de 12px e padding de 20px/22px; divisórias internas finas, sem sombra.

| Papel                 | Tamanho / peso   | Cor / tratamento                                         |
| --------------------- | ---------------- | -------------------------------------------------------- |
| Título da página      | 28px / 600       | entrelinha 36px; `#20232b`, tracking -0,025em            |
| Nome da campanha      | 16px / 600       | entrelinha 24px; `#20232b`, tracking -0,012em            |
| Anunciante / formatos | 13px / 500 e 400 | entrelinha 20px; `#475467` / `#667085`                   |
| Métricas              | 22px / 500       | entrelinha 28px; números tabulares sem tracking negativo |
| Rótulos das métricas  | 12px / 400       | entrelinha 18px; `#667085`, contraste mínimo 4,5:1       |
| Botão de criação      | 14px / 500       | entrelinha 20px; branco sobre violeta                    |
| Navegação             | 14px / 400       | secundário; ativo violeta sobre fundo claro              |

Exceções deliberadas à cópia visual: respeitar as restrições anteriores de **não usar verde, gradientes, textura abstrata, relevo/3D ou SVGs personalizados**. O banner é sólido, status continuam em texto e ícones funcionais são Lucide. Toggles de veiculação e seleção local permanecem, embora não apareçam nessa posição no print. Não há gráfico, taxa de abertura, clique ou conversão inventados: os cartões mostram impressões entregues, meta de impressões, meta cumprida e verba planejada dos mocks existentes. Rascunhos e campanhas ainda não iniciadas exibem traço no lugar de resultados.

As skills de front-end foram aplicadas para reproduzir a hierarquia da referência e verificar medidas/contraste, sem propor uma nova direção estética. 21st continua indisponível; não foi instalado nem houve envio de código a um gerador externo. A fonte foi obtida de fontes oficiais, sem dependência npm nova.

Responsividade: em 1024px, período passa para uma segunda linha sem desaparecer. Em 375px, filtros formam duas colunas, métricas 2×2 e cartões preservam todos os campos. Alvos móveis de 44px; busca em 16px para evitar zoom. Abas podem rolar dentro do próprio grupo, mas a página não apresenta overflow horizontal. Menu móvel mantém foco, Escape e retorno ao gatilho.

### Menus — quatro referências complementares

Revisão restrita à navegação lateral, a partir dos quatro prints enviados com o pedido “menus”. A composição da página de campanhas, filtros, cartões e dados não muda.

- Na primeira revisão dos menus, a identificação ficava no topo. O pedido seguinte reposiciona a marca MediaOn no topo e a equipe de demonstração no rodapé, conforme a seção abaixo. Busca local continua logo abaixo da marca.
- Lateral expandida de 248px (232px em telas intermediárias) e recolhida de 72px. O botão no cabeçalho alterna as duas versões somente em memória, sem alterar rota ou estado das campanhas.
- Superfície quase branca `#fdfdfe`, linhas `#eceef2`, navegação em Roboto 14px/400 e seleção 500 sobre `#f3f1fb`. Marcador lateral de 2px em violeta, sem relevo. Os grupos Workspace, Gestão e Sistema usam 11px/500 em `#697585`, com contraste de 4,6:1 sobre a superfície.
- Grupos separados por linhas sólidas; configurações em árvore com conectores finos. Ícones Lucide existentes em 18px, sem criar vetores ou instalar outro pacote.
- Na versão recolhida, nomes acessíveis e títulos continuam presentes. Buscar expande e leva o foco ao campo; Configurações expande e abre o submenu. Recolher limpa apenas a busca do menu para não ocultar destinos na faixa de ícones.
- No celular, o menu sempre abre completo, independentemente do estado recolhido no desktop. Mantém Escape, contenção de Tab e retorno do foco ao gatilho. Animação breve de largura no desktop, desativada com movimento reduzido.
- Não foram implementados dark mode, troca de conta, notificações, faturamento, upsell ou logout. As referências orientam anatomia e estados; não autorizam novas integrações. Rotas fora do laboratório permanecem desabilitadas.

As skills de front-end orientaram a hierarquia, o agrupamento e o comportamento acessível; a fidelidade às referências prevalece sobre recomendações estilísticas genéricas. 21st indisponível, sem instalação nem geração externa. Verificação visual em 1440px (expandido/recolhido), 1024px e 375px, sem overflow horizontal da página. Busca, foco e Escape conferidos no navegador; três testes novos cobrem recolhimento, expansão pela busca, configurações e transição para o menu móvel.

### Marca no topo e conta no rodapé — print das 12h38

Pedido explícito: MediaOn no topo da lateral; bloco do usuário no bottom, na linguagem do print de conta. Marca existente mantida, agora em 26px, ao lado do controle de recolhimento. O cartão da equipe ocupa o rodapé com avatar de 36px, nome 14px/500, apoio 12px/400, borda fria e raio de 10px. Não foram inventados nomes, emails ou uma segunda conta. A revisão seguinte substitui as iniciais por retrato fictício, a pedido do usuário.

O cartão abre um popover lateral de 292px no desktop e acima do próprio cartão no celular. Mostra a identidade atual, opções de perfil/conta/dispositivos/saída e o aviso de prévia sem autenticação. **Todas essas opções estão desabilitadas**: não há autenticação, consulta, troca de conta ou logout real. Não há sombra, gradiente ou cor quente; a borda/foco frio substitui o destaque quente do print.

O menu de conta fecha pelo botão, clique externo, saída por Tab ou Escape, com retorno de foco quando apropriado. No celular, o primeiro Escape fecha somente a conta, e o seguinte fecha a lateral. Nome acessível e acesso ao popover permanecem no estado recolhido. A rolagem fica nos grupos de navegação: marca, busca e cartão permanecem disponíveis mesmo em viewports baixos.

O indicador de desenvolvimento do Next foi ocultado somente em `apps/design-system/next.config.ts`, pois sobrepunha o avatar e interceptava cliques no estado recolhido. Diagnósticos de erro permanecem disponíveis; nenhuma configuração de produto/backend foi alterada.

As skills de front-end orientaram a anatomia do cartão, contraste, posição responsiva e sequência de foco. A revisão usa apenas React e Lucide já instalados; 21st segue indisponível. Cinco testes novos cobrem ordem estrutural, opções desabilitadas, fechamento, foco e Escape entre camadas. Conteúdo, filtros e dados de campanha preservados.

### Avatar fotográfico — sem iniciais

O usuário rejeitou explicitamente o monograma. Cartão e popover agora reutilizam a mesma fotografia de demonstração, inclusive na lateral recolhida. Retrato de uma pessoa fictícia criado com a ferramenta integrada da skill imagegen; não representa o usuário ou um funcionário real. Arquivo local `public/images/avatar-demo.png`; prompt completo e origem em `public/images/avatar-demo.source.md`. A skill de front-end orientou o enquadramento em 36px/32px, sem mudar dimensões ou layout do menu. A imagem usa `next/image`, texto alternativo explícito e cantos de 7px; nenhuma dependência externa em runtime, inicial ou fallback de letras foi adicionado.

### Revisão tipográfica — fonte, hierarquia e ritmo

O usuário rejeitou a fonte, os tamanhos e os espaçamentos. A revisão inicialmente trocou
Roboto por Geist Sans e centralizou seis tamanhos e cinco entrelinhas em tokens
locais do piloto. As skills de front-end orientaram diferenciação por papel,
contraste e ritmo; não foi redesenhada a composição nem criada decoração nova.
O CLI 21st continua indisponível, sem instalação ou geração externa.

Títulos usam 600; ações e números usam 500; texto de apoio usa 400. Anunciante
ganha peso 500 dentro da descrição, separado dos formatos por cor/peso. Números
tabulares ficam nos dados e períodos, sem forçar a mesma largura nos textos.
Rótulos da lateral sobem de 11px para 12px. Marca e avatar são preservados.

O espaço entre título, filtros e lista é revisto; labels têm 8px até o campo,
descrições 4px até o nome, e métricas 6px até seus rótulos. Até 1199px os filtros
formam duas colunas, e os botões de visualização passam para uma linha própria.
No celular, nomes continuam em 16px/24px e podem quebrar; valores usam 20px.
A fonte original dos prints segue não confirmada; esta proposta exige validação
visual do usuário antes de ser promovida para o design system.

### Inter — escolha explícita do usuário

Em seguida o usuário definiu **Inter com variações de peso** como nossa família.
A Inter substitui Geist no layout do piloto, com 400 para apoio e corpo, 500 para
controles/métricas/navegação ativa e 600 para títulos e nomes. A orientação das
skills de front-end foi preservar a hierarquia construída, sem refazer tamanho,
cor ou espaçamento nesta troca. A escolha explícita prevalece sobre preferências
genéricas das skills. Marca e biblioteca raiz continuam intactas.

Arquivos WOFF2 oficiais servidos localmente, com licença e commit de origem em
`Inter-SOURCE.md`; sem pacote novo ou chamada externa de fonte no navegador.
Decisão registrada em `.21st/design.json` do laboratório. CLI 21st indisponível,
sem instalação, geração ou publicação externa. A escolha da fonte não equivale
à aprovação visual de toda a tela.

## Histórico — direções anteriores, substituídas pela revisão acima

Diretrizes explícitas do usuário: **a base do MediaOn usa cores frias. Não usar verde/oliva. Não criar SVGs/vetores personalizados, gradientes ou acabamento com relevo/3D.** A paleta anterior foi descartada. A direção usa cinza frio, grafite azulado e azul contido, com cores sólidas. Isso não equivale à aprovação do desenho completo.

Interface plana: sem sombras, brilhos internos, botões elevados, cartões que levantam no hover ou ornamentos vetoriais. A nova estrutura elimina a grande moldura arredondada em torno do conteúdo e as linhas-cartão da tabela. Lateral clara, navegação agrupada, cabeçalho separado por linha, controles com raios de 8–9px, faixa informativa com 14px e ações principais arredondadas. Ícones funcionais somente da biblioteca Lucide já instalada; seleção usa checkbox nativo. Nenhuma biblioteca nova. Sem hero, loop de animação ou selo de IA.

Paleta vigente na estrutura: tinta `#202b3d`, secundário `#637086`, tela `#f6f8fc`, papel `#ffffff`, ação `#4867d6`, tinta azul `#3159b5`. Public Sans na interface e nos dados do piloto, servida localmente; a assinatura MediaOn mantém Instrument Sans. Ícones Lucide.

### Mescla das referências selecionadas

O endereço efetivo do link aponta para [Campaign Dashboard, Latiful Fajar](https://dribbble.com/shots/24445496-Campaign-Dashboard), cujas quatro imagens foram conferidas. O texto do link aponta para [List and Monitor, Faiz Muhammad Hermawan](https://dribbble.com/shots/24462617-Campaign-Management-System-List-and-Monitor), também conferido junto do print fornecido.

- Do projeto-base: lateral clara e agrupada, separação entre contexto/ações/dados e destaque funcional antes da lista. A faixa de revisão substitui o banner promocional, sem imagens abstratas ou gradientes.
- Do print de analytics: resumo integrado e hierarquia entre rótulo, número e apoio. Somente dados já presentes nos mocks; sem receita, crescimento, gráficos ou avatares inventados.
- Do recorte de sidebar: workspace com identificação clara, navegação discreta e agrupamentos. Sem upsell.
- Da tabela Ads: superfície contínua com divisórias horizontais, cabeçalho cinza-frio e leitura por colunas. Toggles e seleção preservados.
- Do print List and Monitor: azul na ação de criação, raios coerentes e separação entre filtros e registros. A seleção da sidebar passou a cinza na revisão abaixo. Sem tags pastel ou modelos de campanha fora do escopo.

A skill de front-end orientou a mescla pela função dos elementos e não pela cópia literal. O CLI 21st continua indisponível; a decisão fica registrada aqui, sem instalar dependências, publicar tema ou enviar código a um gerador externo.

### Sidebar — recorte enviado às 12h de 29/09

Revisão restrita à lateral do piloto, a partir do print com identificação no topo, busca e configurações em árvore. Conteúdo, tabela e cabeçalho da página foram preservados.

- Superfície branca, identificação compacta da equipe e busca logo abaixo. Iniciais de demonstração no lugar de uma foto, nome ou e-mail pessoal inventado. Sem seletor de conta fictício.
- Navegação em 13px, ícones discretos e seleção em cinza-frio; hierarquia pelo contraste e peso, sem títulos de grupo em caixa-alta. Separadores tracejados delimitam as áreas.
- Configurações expande e recolhe subitens, conectados por linhas finas em CSS. Rotas fora do piloto continuam desabilitadas e identificadas como fora do escopo.
- Busca local sem acentos filtra somente o menu, com estado vazio explícito; não modifica a busca de campanhas. Nenhuma chamada externa.
- Assinatura MediaOn e acesso ao Design System V2 no rodapé. Não reproduzir o upsell, o gradiente nem a profundidade do print.
- No celular, alvos de 44px, campo de 16px, foco inicial na busca, contenção de Tab e Escape com retorno ao gatilho. Desktop e celular compartilham os mesmos itens.

As skills de front-end orientaram a hierarquia e a preservação dos comportamentos acessíveis. A aparência continua sujeita à validação do usuário.

### Header informativo — prints enviados às 12h01 de 29/09

O usuário indicou as faixas de informação acima do título como referência. A aplicação adapta a anatomia (mensagem à esquerda, ação à direita, cantos arredondados), sem reproduzir os gradientes, imagens abstratas ou texto promocional.

- Faixa azul sólido `#304bad`, título branco em 16px/600 e apoio `#e1e8ff` em 13px/400; ação branca em 13px/500. Contraste dos três papéis coberto por teste automatizado.
- Conteúdo derivado dos mocks: “2 campanhas aguardam sua revisão”. Não anunciar novidades ou funcionalidades inexistentes. Contagem singular/plural e exibição apenas quando há pendências.
- “Ver pendências” reutiliza o filtro local de atenção, remove filtros que esconderiam registros, limpa seleção e leva o foco à aba de atenção. Não aprova, publica ou altera campanhas.
- Indicadores de veiculação e verba mantidos em um resumo compacto; o antigo aviso dentro do resumo foi removido para evitar repetição. Sidebar, tabela e demais rotas não mudam.
- No celular, texto e ação se empilham com alvo de 44px; sem corte de texto ou rolagem horizontal da página. Sem nova animação ou ícone decorativo.

As diretrizes de front-end orientaram a diferenciação entre título, apoio e ação e a reutilização do comportamento existente. 21st segue indisponível, sem instalação ou geração externa.

### Hierarquia de leitura

Pedido adicional explícito: diferenciar também cor, peso e lettering, não apenas tamanho. Valores conferidos no estilo computado do navegador:

| Papel              | Tamanho / peso | Cor e espaçamento                                         |
| ------------------ | -------------- | --------------------------------------------------------- |
| Título da página   | 28px / 600     | tinta principal; tracking -0,02em                         |
| Nome da campanha   | 14px / 600     | tinta principal; tracking neutro                          |
| Anunciante         | 12px / 400     | `#69758b`; tracking neutro                                |
| Status             | 13px / 400     | `#526078`; sem cápsula nem ícone                          |
| Valor e entrega    | 14px / 500     | tinta principal; numerais tabulares sem tracking negativo |
| Itens de navegação | 13px / 400–500 | secundário; ativo em tinta principal sobre cinza-frio     |

Rótulos, status e informação de apoio não competem com os nomes; o azul indica ação ou seleção. A densidade compacta diminui o espaço entre linhas, não a legibilidade dos textos. A escala não implica aprovação estética do usuário.

### Revisão tipográfica de 29/09

Primeiro ajuste tipográfico, preservado nesta reconstrução: Public Sans estática nos pesos reais 400/500/600, carregada apenas no layout de campanhas. A biblioteca congelada não muda. Arquivos oficiais e licenças preservados em `src/fonts`; origem registrada em `Public-Sans-SOURCE.md`.

- Escala da tabela: nomes e valores em 14px; status e controles em 13px; datas, percentuais e metadados em 12px. Removidos os textos de 10–11px da tabela.
- Uma família para texto e dados, sem alternar números para uma fonte monoespaçada. Algarismos de altura e largura uniformes (`lining-nums tabular-nums`); valores alinhados à direita, sem tracking negativo.
- Pesos 450/550 substituídos pelos arquivos disponíveis; síntese tipográfica desativada. A fonte anterior já oferecia numerais tabulares: a revisão corrige consistência, escala e escolha visual, não arquivos corrompidos.
- Separadores, arredondamento e valores continuam definidos pelos formatadores existentes; nenhuma alteração nos dados ou na lógica financeira.

As skills de frontend orientaram a escolha de uma única família, pesos reais e escala verificável. Não houve uso de gerador externo nem nova dependência de pacote; 21st permanece indisponível.

### Toggle de veiculação

Referência adicional enviada pelo usuário: controle antes do nome da campanha, separado do checkbox. Implementado em azul frio quando ligado, cinza quando pausado e cinza claro quando indisponível. Trilha plana de 30×18px em alvo de 44×44px; sem ícone, SVG, sombra ou gradiente. Deslocamento curto do indicador com movimento reduzido respeitado.

O controle é um botão com semântica de switch, nome acessível por campanha, estado anunciado, foco visível e operação por Espaço/Enter. No celular fica junto do status. **Pausa/retomada apenas em memória**: o exemplo alterna entre `active` e `paused`, atualiza contagem, filtros e detalhe e preserva entrega acumulada e seleção. Recarregar restaura os mocks. Rascunhos, etapas de aprovação/ajuste e campanhas concluídas não podem ser ativados pelo switch; a descrição informa o motivo. Esse comportamento ilustra a interação, não define um contrato de backend.

### Revisão da tabela — referência Orders e rejeição da versão anterior

O usuário voltou a rejeitar a tabela depois de enviar o print Orders. Nesta rodada, a referência orientou uma mudança de anatomia e densidade, restrita à tabela e aos seus controles. Header informativo e sidebar preservados.

- Busca e filtros agrupados numa faixa cinza-frio arredondada, antes das abas, também na ordem de teclado. Contagem e seletor de densidade ficam entre abas e tabela. Sem controles fictícios de paginação para os sete registros disponíveis.
- Densidade inicial compacta, com linhas de 52px; confortável disponível em 64px. Alturas podem crescer conforme conteúdo ou viewport. Tamanho das fontes preservado em 14/13/12px; dados não foram reduzidos para fazer caber.
- Nome da campanha em primeiro plano, formatos na linha de apoio e anunciante em coluna própria. Não esconder formatos nem substituir marcas por avatares inventados. No celular, todos os campos continuam presentes.
- Cabeçalho baixo e arredondado, sem grade pesada entre registros. Hover cinza discreto; seleção com fundo frio e contorno fino, sem sombra ou elevação.
- Entrega em duas linhas: valor/percentual e pequena barra/meta. Números tabulares e valores monetários alinhados à direita. Períodos e status ficam em tom secundário, sem tags pastel.
- Ação “Abrir” visível por registro, apontando ao detalhe local existente. A área do nome também abre o detalhe; seleção e toggle continuam separados. Nenhum menu de ações vazio ou nova mutação.

As skills de front-end orientaram hierarquia, contraste e ritmo das linhas; foram reutilizados fonte, ícones, estado local e componentes existentes. O CLI 21st permanece indisponível. Não houve instalação, geração externa ou promoção para a biblioteca congelada. Resultado ainda sujeito à validação estética do usuário.

### Histórico — primeiras revisões da tabela de 29/09

As imagens Freight (confortável e compacta), Arto e Meta fornecidas pelo usuário orientam **a organização operacional**, não cópia de marca, cores ou elementos. O usuário rejeitou a hierarquia anterior e a falta de identidade; esta revisão ainda depende de sua validação.

- Tabela como superfície principal. Resumo integrado de campanhas em veiculação, verba planejada e revisão de materiais; sem métricas fictícias adicionais.
- Linhas contínuas sobre branco e divisórias leves, sem sombra. Nomes clicáveis em tinta principal semibold, anunciante como informação secundária. Sem iniciais fictícias na tabela. A antiga apresentação de linhas-cartão foi substituída pela nova referência.
- Formatos escritos por extenso; datas alinhadas; verba com numerais tabulares. Entrega mostra impressões realizadas, meta e barra contínua simples, no lugar das faixas segmentadas.
- Densidades confortável e compacta preservam busca, filtros, seleção e ordenação. Preferência somente em memória, preservada ao navegar para o detalhe.
- Ações de seleção junto dos dados, sem barra flutuante. Rodapé soma a verba das campanhas exibidas pelos filtros; não inventa gasto real.
- No celular, linhas viram registros com os mesmos campos, seleção coletiva e ordenação acessíveis. Não ocultar formatos ou períodos para fazer caber.

Implementação experimental em `campaign-table.tsx` e `campaign-table.module.css`, separada dos estilos das páginas de detalhe/criação e da biblioteca congelada. Nenhuma dependência nova. A revisão de front-end priorizou hierarquia e ritmo das linhas; a ferramenta 21st permanece indisponível, então foram usados código local, fontes e ícones já instalados.

Status: o usuário rejeitou as tags pastel com bolinha/borda e, em seguida, os símbolos vetoriais personalizados. Agora a etapa é apresentada somente em texto, sem cápsula, fundo, borda ou ícone. A distinção não depende da cor. O componente `CampaignStatusLabel` permanece reutilizado na tabela, no portfólio, no detalhe e na criação. A nova anatomia continua em avaliação.

Entrada apenas por opacidade de 220–350ms; controles com transições de cor e borda de 180ms. Sem deslocamento ao clicar ou passar o mouse. Faixa de aba selecionada persistente. Sem esperas artificiais. Movimento reduzido desliga as transições.

## Histórico — três composições anteriores

| Estudo                        | Hierarquia e composição                                                                            | Indicado para                                | Risco / adaptação                                                                                                                              |
| ----------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Operação (proposta principal) | Tabela confortável/compacta, comparação de verba e impressões, seleção coletiva.                   | Trabalho diário da equipe de mídia.          | No celular, linhas viram registros verticais com todos os campos; em tablet há rolagem dentro da tabela.                                       |
| Portfólio                     | Mosaico, marcas em primeiro plano, leitura individual das campanhas; sem seleção coletiva visível. | Revisão de presença de marca e apresentação. | Mais rolagem e menor comparação numérica. Duas colunas no tablet e uma no celular. Composições ilustrativas, não criativos reais.              |
| Veiculação                    | Linha de tempo, espaço proporcional à duração, períodos e sobreposições como informação principal. | Conferência de calendário e ocupação.        | Campanhas curtas precisam de acesso ao detalhe; resumo textual acessível em cada faixa. No celular cada campanha tem a própria linha de tempo. |

Todos preservam os mesmos mocks, filtros, navegação e vocabulário. O seletor permanece junto das abas. Links anteriores: `/campanhas?visao=operacao`, `?visao=portfolio`, `?visao=veiculacao`. A revisão vigente acrescenta `?visao=monitoramento` como entrada padrão; Operação deixa de ser a composição principal.

Referências: Sales Analyzer fornecido pelo usuário (coerência de materiais e movimento, sem copiar tema escuro, verde ou componentes); pasta MediaOn do Pinterest já estudada (organização operacional); campos existentes em campaigns-table.tsx (somente inventário funcional, nunca visual). CLI 21st indisponível: nenhum componente externo foi buscado, instalado ou publicado. Skills de exploração e frontend orientaram a composição; UX orientou foco, filtros, alternativas textuais e responsividade. Recomendação genérica de liquid glass/Roboto foi descartada por não atender ao briefing.

## Fronteira técnica

- Tudo fica nesta rota do aplicativo isolado `apps/design-system`, porta 3002.
- Zero importações de `apps/web`, `apps/vitrine`, pacotes de backend ou UI de produção. Zero APIs, banco, autenticação, integrações, configuração externa ou publicação.
- Os exemplos usam estados em memória. Rascunhos sobrevivem à navegação local, mas não ao recarregamento. O CSV contém apenas os mocks filtrados/selecionados.
- Busca sem acentos, etapas, anunciante, formato, intervalo de datas por sobreposição, ordenação, seleção, CSV, quatro composições, detalhe e criação em página funcionam como demonstração.
- Datas limitadas a setembro/outubro de 2026; entrega, meta e pendências são hipóteses de apresentação fictícias, não novos contratos de backend.
- Menu de outras áreas desabilitado de forma explícita. Aprovar/rejeitar/publicar/pausar campanhas reais não faz parte da prévia.
- Primitivas experimentais estão colocalizadas por decisão expressa de validar a tela antes da biblioteca. Não promover para DS/Harness antes da aprovação.

## Verificação desta entrega

127 testes do laboratório em nove arquivos, incluindo nove testes da estrutura/menu e quatro do popover da conta. A foto tem cobertura de reutilização local, dimensões e ausência de monograma. Quatro testes de Monitoramento cobrem entrada padrão, métricas reais dos mocks, combinação de formato/status/ordenação, seleção independente do toggle, persistência ao alternar para tabela e ação de pendências com o novo filtro de formato. Seis proteções de tipografia verificam os três arquivos WOFF2 Inter, a escala centralizada, isolamento do layout, numerais, hierarquia/contraste dos cartões e preservação dos nomes no celular. Os testes existentes de criação, detalhe, tabela e estados continuam passando.

Verificação visual desta revisão no navegador em 1440px, 1024px e 375px. Tamanhos, pesos, cores e família foram conferidos nos estilos computados. Menu móvel e painel de período também foram verificados. Não foi feita comparação automatizada pixel a pixel nem confirmada a família da referência; a fidelidade estética depende da validação do usuário.

As verificações anteriores cobriram três composições, busca, seleção parcial, ordenação, total filtrado, menu com Escape e restauração de foco e criação/revisão de rascunho. Movimento reduzido está contemplado por CSS; não foi feita auditoria assistiva formal.

A sequência geral `pnpm lint && pnpm typecheck && pnpm test && pnpm build` passou pelas três primeiras etapas; o build geral segue interrompido pelo Turbopack em `apps/vitrine` ao tentar abrir uma porta (`EPERM`). Nenhum arquivo desse produto foi alterado. O build do laboratório foi executado separadamente e passou.
