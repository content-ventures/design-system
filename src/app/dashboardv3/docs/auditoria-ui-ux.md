# Auditoria UI/UX — Dashboard V3 (lista, detalhe, criação e shell)

Escopo: `/dashboardv3/campanhas`, detalhe (`cmp-2041`, `2035`, `2029`, `2014`, `2008`), criação em 6 etapas, edição (`cmp-2026/editar`) e o shell. Medido em 390, 768, 1024, 1280, 1366, 1440, 1920 e 2560 px. Foram cinco lentes (diagramação, peso, consistência, responsividade, UX). Este documento consolida 112 apontamentos brutos em 72 itens.

## Veredito

A base do V2 está certa: 13 px de corpo, fios em vez de caixas e status como ponto + texto. A execução ainda não está no nível sênior. Há quatro falhas que quebram uso real:

- A tabela recorta tudo o que flutua: o popover de Vínculos nunca aparece e todo tooltip fica cortado.
- O "Excluir" em lote apaga a campanha errada.
- Abaixo de 960 px não existe navegação.
- No celular, o botão "Continuar" do builder fica fora da tela.

Abaixo disso, o produto ainda tem cara de montado, não de desenhado:

- A moldura "fixa" da criação pula entre etapas e desliza 4 px.
- O mesmo número aparece com e sem centavos, e a mesma data em seis formatos.
- A régua de etapas inverte a hierarquia: o feito pesa mais que o atual, e a jornada do detalhe usa o código oposto.
- A informação real está em cinza de placeholder.
- As contagens de "Em veiculação" mudam conforme a vista.
- Ações irreversíveis rodam com um clique.

Nada disso pede uma nova direção. Pede rigor: uma regra por decisão, aplicada em todas as telas.

## Decisões de arbitragem

Quando os auditores divergiram, valeu o seguinte:

- **Ações da linha.** Ficam três slots fixos: Métricas, Editar e Excluir. A regra de produção "Ver — sempre" continua cumprida pelo nome da campanha, que é o link para o detalhe, e pelo clique na linha. Não há menu "⋯" dentro da célula, porque a tabela recortaria o menu. Os ícones ficam sempre visíveis, sem hover-reveal, por causa do toque.
- **Régua de etapas.** A etapa atual é a única marca sólida. Etapa feita = fundo azul claro com check. O builder passa a usar o código da jornada do detalhe, não o contrário.
- **Status longo na tabela.** Quebra em até 2 linhas dentro da linha de 46 px. Não é truncado, porque "Aguardando assinatura…" perde a informação que importa.
- **Vínculos.** Mostra só o número, em texto sem borda, alinhado à direita. O cabeçalho já diz "Vínculos" e o nome acessível é "N vínculos".
- **Subtítulo da lista** ("{n} de {total} campanhas do portal."). Fica, porque é campo de produção. Sai só o ícone sólido do título.
- **Rodapé da criação no celular.** Uma linha só: [←] [Salvar rascunho] [Continuar]. "Cancelar" vira o X no topo. Foi descartada a grade 2×2, que gastava 100 px.
- **Escala numérica.**

  | Uso | Tamanho |
  |---|---|
  | Título da página | 24 |
  | Métrica viva | 22 |
  | Número herói (verba no resumo, estimativa) | 18 |
  | Faixa de números (previsão, KPIs da revisão, faixa da etapa 3) | 16 |
  | Título de seção | 14 |
  | Corpo | 13 |

- **Menu lateral.** Vira gaveta até 1199 px, e não só abaixo de 960.
- **Descartado.**
  - Linha "Desconto de fidelidade" na etapa 1: inventava regra.
  - Frase explicativa extra sob a faixa de previsão: enchimento.
  - Rótulo de checkbox por nome de linha: fica para a próxima rodada.

## Diagramação

- **A-04 · [crítica] Rodapé do builder no celular** — em 390 px o rodapé mede 454 px e "Continuar" fica 64 px fora da tela, sem como rolar até ele. → Em ≤640 px o rodapé tem uma linha só: Voltar só com ícone, "Salvar rascunho" e o botão principal. "Cancelar" vira X no topo da moldura. *Criação, etapas 2–6, 390 px.*
- **A-05 · [alta] Rodapé muda de lugar entre etapas** — "Cancelar" anda de x=1067 para 970, 1065 e 1028 conforme a etapa e o modo de envio. → O rodapé tem quatro slots fixos: Cancelar, Salvar rascunho, Voltar e o botão principal. Na etapa 1 o Voltar fica desabilitado. Na revisão o "Salvar rascunho" fantasma fica invisível, mas guarda o lugar. O botão principal tem largura mínima de 196 px. *Criação, todas as etapas.*
- **A-06 · [alta] A moldura desliza 4 px (20 px no celular)** — o tooltip escondido do "Salvar rascunho" vaza da moldura. O `overflow:hidden` ainda deixa rolar por script, e o `scrollIntoView` arrasta a moldura. → Usar `overflow: clip` nas duas molduras. O tooltip passa a usar `position: fixed` e só é renderizado quando aberto. A régua rola com `scrollTo` no próprio trilho. *Criação, ao escolher o anunciante; 390 px na etapa 5 e na revisão.*
- **A-07 · [alta] Áreas brancas no miolo fixo** — sobram 44% vazios na etapa 1, 64% no pacote da etapa 2 e 289–559 px em 1920. → Na etapa 1 vazia, a grade de 9 marcas coloridas vira um ranking de anunciantes em fios: marca discreta, campanhas, em veiculação, verba contratada e última campanha. Escolhido o anunciante, o histórico mostra 6 campanhas e ganha a coluna Ativo. No modo pacote, o Select vazio vira um grupo de cartões de pacote. *Criação, etapas 1–2.*
- **A-08 · [alta] Colunas da lista** — em 1280 a coluna "Campanha" é a mais estreita da tabela (163 px). O status é cortado no meio da palavra ("Aguardando assinatura d") e há 14 px de rolagem lateral. → Redistribuir as larguras para a Campanha passar de ~197 px em 1280 e ~314 px em 1440. Os status longos quebram em 2 linhas. A largura mínima da tabela passa a 940 px. *Lista.*
- **A-09 · [alta] Cromo da linha** — a coluna de ações tem 104 px para 4 botões. "Ver" fica cortado e Métricas/Editar trocam de lugar a cada linha. O "Vínculos" é um chip com borda em todas as 10 linhas. → Usar slots fixos (Métricas, Editar, Excluir) com espaço reservado quando a ação não se aplica. Os ícones ficam em cinza 400 em repouso e 600 no hover da linha. Vínculos vira um número em texto. *Lista, operador e anunciante.*
- **A-26 · [alta] A revisão não cabe e esconde o bloqueio** — a revisão estoura 14 px no miolo e 55 px na lateral em 1440×900. O "Formulário" com falha, que é o único bloqueio do envio, fica sob o rodapé. É a única etapa feita de cartões com borda. → Cartões passam a fios. A "Checagem" sobe para logo depois das opções de envio, e itens OK viram uma linha só. O bloqueio aparece dentro da opção "Enviar para aprovação", com o link "Preencher". A linha do tempo "Depois do envio" vira uma linha por item e some no modo rascunho. *Criação, etapa 6.*
- **A-27 · [média] Grade do briefing com buracos** — sobram 68 px sob a URL e 32 px sob o Idioma, e a "Entrega do criativo" fica órfã. O upload empurra os campos 19 px. → O textarea ocupa 2 linhas da grade quando o vizinho é de meia largura. A área de upload ganha altura estável (`min-height: 78px`). *Criação, etapa 5.*
- **A-28 · [média] Cartões de ativo** — as 9 descrições estão cortadas em ~30 caracteres, e descrição e preço flutuam em alturas diferentes. → `align-content: start`, descrição em 2 linhas com corte de linha, e o período sempre em linha própria. *Criação, etapa 2.*
- **A-29 · [média] Topo desalinhado** — o breadcrumb começa em x=264, mas o conteúdo começa em 268. O sino fica 12 px fora da coluna. O cartão do portal, com sombra, é cortado pelo fio do topo. → Topo com `padding: 0 25px 0 32px`. A identidade vira uma linha de 52 px sem borda nem sombra, com fio alinhado ao do topo. *Shell, todas as telas.*
- **A-30 · [média] Menu lateral cortado** — em 900 px de altura a "Auditoria" é cortada. Há 186 px de cromo antes do primeiro item, e "Francal 2026" se repete no topo. → O seletor "Visualização" vai para o topo, no lugar de "Francal 2026". Itens com 34 px e grupos 16 px mais juntos. Um fade no fim do menu quando houver rolagem. *Shell, 1440×900 e 1280×800.*
- **A-31 · [média] Larguras em telas largas** — o detalhe trava em 1120 px e deixa 500 px mortos em 1920. Em 2560 a lista abre um vazio de 680 px por linha e o builder uma faixa de 524 px. → O detalhe acompanha a lista e o builder (sem max-width e lateral de 320). A partir de 1600, Configuração e Briefing ficam lado a lado. O conteúdo do shell para em 1760 px, centralizado. O builder vira uma tela de 1840 px a partir de 2000. *Detalhe, lista e criação em 1920/2560.*
- **A-32 · [média] "01" nos títulos e etapa dita 3 vezes** — o número empurra o título 30 px para fora da grade dos campos e repete a aba e o "Etapa N de 6". → Tirar o número. O título da seção passa a ser igual ao da aba ("Ativo", "Briefing"). "Etapa N de 6" só aparece abaixo de 1024. *Criação, todas as etapas.*
- **A-33 · [média] Faixa do ativo na etapa 2** — 90–126 px de altura, Públicos em 4 linhas, e repete o preço do cartão. O Período cai sobre o rodapé em 1280×800. → Três colunas (Canais, Públicos, Briefing e bônus) em uma linha com reticências e `title`. *Criação, etapa 2.*
- **A-34 · [média] Abas de status cortadas** — em 1280, "Encerradas 4" fica sob a busca. → A busca usa `clamp(150px, 13vw, 220px)`, e a barra empilha abaixo de 1300 px. Critério: no tablist, `scrollWidth` igual a `clientWidth` em 1280, 1366 e 1440. *Lista.*
- **A-61 · [baixa] Vista agrupada** — 8 caixas para 4 grupos, faixas coloridas com ícone, e as colunas andam 44 px porque some o checkbox. → Cada grupo é um contêiner único com cabeçalho em fio, sem cor nem ícone, e com contagem em cinza. A tabela é a mesma da lista, com seleção. *Lista agrupada.*
- **A-62 · [baixa] Precificação estreita** — a verba do pacote fica presa em 240 px com dica em 2 linhas. O mínimo e o máximo aparecem duas vezes. → No pacote, a verba ocupa a coluna esquerda inteira e há um parágrafo só. No ativo único, saem os rótulos das pontas do slider. *Criação, etapa 3.*
- **A-63 · [baixa] Edição bloqueada** — uma nota solta no canto, com 85% da tela vazios. → Bloco centralizado com o botão principal "Ver a campanha" e o secundário "Voltar para campanhas". *`/editar` de status não editável.*

## Peso e hierarquia

- **A-14 · [alta] Leitura em 12 px** — nomes, valores e células estão um degrau abaixo do V2 (13 px), e o menu lateral pesa mais que os dados. → A tabela passa a 13 px, os nomes a 13/500 e os valores (`dd`) a 13/400 na cor ink. Os rótulos do detalhe ganham papéis coerentes: rótulos de métrica em `--muted` 12/400 e títulos da lateral em 13/600. *Lista, detalhe e cartões do builder.*
- **A-15 · [alta] Régua invertida** — no builder, as etapas feitas são discos azuis sólidos e a atual é um anel claro. A jornada do detalhe faz o oposto. → A atual vira o único disco sólido. Feita = azul 50 com check azul 600. O conector depois de uma etapa feita usa azul 200. O mesmo marcador de 20 px vale para a jornada, e a linha do tempo do envio usa o estilo de "próxima". *Criação (topo), detalhe (jornada), revisão (lateral).*
- **A-16 · [alta] Informação em cinza de placeholder** — `--subtle` (2,6:1) é usado em etapas futuras, legendas, limites do slider e "Não informado". O "R$ —" fica em g-300 (1,7:1). O resumo vazio parece desabilitado. → `--subtle` só em placeholder e em controle desabilitado; todo o resto passa a `--muted`. Sai o quadrado tracejado. Os textos de espera viram "A definir". *Criação (resumo), detalhe e controles do DS.*
- **A-17 · [alta] Números sem escala** — as métricas do detalhe têm o tamanho do H1, e os KPIs da revisão superam o nome da campanha. Há 4 implementações da faixa de números. → Seguir a escala da seção de decisões. Tokens `--t-figure` e `--t-page`. Uma única especificação para as faixas: rótulo caption-strong em `--muted`, valor 600 tabular e legenda caption. *Detalhe, revisão, etapa 3 e resumo.*
- **A-35 · [média] Ações do cabeçalho do detalhe** — as transições de cada status (aprovar, pedir ajustes, rejeitar, pausar, concluir…) disputam o cabeçalho sem hierarquia definida. No celular, o "⋯" das campanhas encerradas ganha uma linha só para ele. → Um único primário (a primeira ação de avanço). As demais ficam secundárias e sem ícone, e "Rejeitar" / "Rejeitar P.I." nunca são primários. O "⋯" só aparece quando guarda algo além de "Métricas" (cancelar ou excluir). Sem outras ações, ele fica na linha do título. *Detalhe, todos os status.*
- **A-36 · [média] Rótulo de grupo = rótulo de campo** — "Período de veiculação" e "Início" saem idênticos (12/500). → O grupo passa a 13/600 ink, formando os níveis seção 14 > grupo 13 > campo 12. *Criação, etapas 1–4.*
- **A-37 · [média] Cores de status sem sistema** — o azul de ação é usado como status (P.I.). "Pausada" (âmbar) e "Ajustes" (laranja) não se distinguem. O teal de "Encerradas" é a cor de "Aprovada". A jornada pinta todo status de azul. → Aguardando assinatura e P.I. "Enviado" ficam âmbar. "Pausada" fica cinza. O aviso de P.I. fica âmbar. O texto do status atual na jornada usa `--text`. O azul fica só para ação, seleção e etapa atual. *Lista, detalhe.*
- **A-38 · [média] Botão principal fino e com hover índigo** — peso 500 e hover em #2552dc, fora da rampa. → Peso 600, hover em b-700, ativo em b-800. Sombra e anel de foco no azul da marca. *Todas.*
- **A-39 · [média] "Falta" em vermelho onde ninguém pode agir** — campanha no ar mostra 4 linhas vermelhas "Falta: Peça criativa", repetindo o rótulo. → Se for editável, mostra "Falta" em `--red-ink` 400. Se não for, mostra "Não informado" em cinza. Na revisão em modo rascunho, o aviso fica âmbar e não vermelho. A contagem do cabeçalho vira "N obrigatórios faltando" quando editável. *Detalhe, revisão.*
- **A-40 · [média] Frases explicativas (cara de IA)** — "O nome da campanha e a marca…", "Aparece na lista, no P.I.…", "A categoria filtra o catálogo…" e "· sobem com a verba". → Remover. As descrições só carregam dado. A regra rascunho × envio do briefing fica no contador: "2 de 6 preenchidos · obrigatórios só no envio". *Criação, etapas 1, 2, 3 e 5.*
- **A-64 · [baixa] Ícone decorativo por cartão de modelo** — TV para CPM, presente para Bônus, cada cartão com 3 linhas. → Título + rádio na mesma linha, como nos cartões de ativo. *Criação, etapa 3 (pacote).*
- **A-65 · [baixa] Bônus e barras** — o bônus liberado é sinalizado 4 vezes. A barra do bônus bloqueado é azul, como se estivesse ativa. O total de 100% é uma barra verde de 1100 px. Existem 4 barras diferentes (3, 4 e 6 px). → Bônus liberado: só ponto verde + "Liberado". A barra aparece só no bloqueado e em cinza. Total OK: "✓ 100% distribuído" em texto; o Meter âmbar fica só quando falta. As barras do resumo e da janela usam um traço de 4 px em b-600. *Criação, etapas 3–4 e resumo.*
- **A-66 · [baixa] Traço de ícone misto** — há ícones com traço 1,5, 1,6, 1,75 e 2. → 1,75 como padrão do tema. O menu fica com 1,5. Check e traço de marcação seguem em 2,5–3. *Todas.*

## Consistência e repetições

- **A-18 · [alta] Contagens divergentes** — a aba diz "Veiculando 4", o grupo "Em veiculação 6", o rodapé "3 em veiculação", o menu lateral "2" e a etapa 1 "No ar ou aprovadas 1". → Um mapa único de recortes: Em veiculação = aprovada, veiculando e pausada; Em aprovação = enviada, ajustes e aguardando P.I.; Rascunhos; Encerradas. Abas, grupos, rodapé, contador do menu e etapa 1 derivam dele. Os rótulos ficam iguais nas duas vistas. *Lista, agrupada, shell, criação etapa 1.*
- **A-19 · [alta] O mesmo fato 2–3 vezes na tela** — na revisão, o período aparece 3 vezes em 3 formatos e o público 3 vezes. No detalhe, "Ajustes solicitados" aparece 3 vezes em 200 px. Na etapa 2, o preço aparece 3 vezes. → A Checagem mostra só o estado ("Sem pendências" ou a pendência). A descrição da etapa 4 vira instrução. O meta de Públicos passa a "mínimo e máximo por empresa". A jornada mostra a dica da fase, nunca o status. O título do aviso é só "Motivo". *Revisão, etapas 2 e 4, detalhe.*
- **A-20 · [alta] Dinheiro com e sem centavos** — "R$ 13.500" na faixa e "R$ 13.500,00" logo abaixo. → Valor exato sempre com 2 casas. 0 casas só para estimativa com "≈". *Todas.*
- **A-21 · [alta] Seis formatos de data** — "05/10 a 31/10", "05 out – 31 out", "De 05 out a 31 out." e outros, na mesma tela. → Intervalo compacto `dd/MM – dd/MM`, como na produção; definição completa `dd/MM/aaaa – dd/MM/aaaa`; frases com "de X a Y". Os intervalos não quebram linha. Sai o formatador de meses por extenso. O rodapé agrupado deixa de usar texto fixo. *Todas.*
- **A-42 · [média] Termos que variam** — "Verba" × "Investimento" (e "investimento" é um tipo de condição de bônus na produção). "Formulário" × "Briefing". "admin" × "admin do portal". → "Verba", "Briefing" e "Criada pelo admin". *Criação, revisão, detalhe.*
- **A-43 · [média] Vínculos: 10 na lista, 9 no detalhe** — o detalhe omite Métricas e conta os públicos do ativo sob o mesmo rótulo dos públicos da campanha. → O detalhe usa os mesmos 5 grupos do popover da lista, e o título vira "Vínculos do ativo". *Detalhe.*
- **A-44 · [média] Verba de modelo sem verba** — "—" na lista e no detalhe, mas "R$ 6.500,00" ou "Sem cobrança" no builder e no P.I. → Uma regra só: verba > 0 mostra o valor; bônus mostra "Sem cobrança"; preço fechado mostra o preço; o resto mostra "—". *Lista, detalhe, resumo, revisão.*
- **A-45 · [média] Etapa 5 "concluída" no topo e com alerta na Checagem** — os dois validam com regras diferentes. → Novo estado "warn" (marcador âmbar "!") quando só faltam obrigatórios do briefing em modo rascunho. *Criação, etapa 6.*
- **A-46 · [média] A mesma marca pálida e sólida** — a lista usa "soft" e o detalhe "solid" no mesmo tamanho xs. → xs ao lado de nome é sempre "soft"; sm ou maior, quando a marca é o assunto, é "solid". *Lista, detalhe, criação.*
- **A-47 · [média] Controles sm com 30 e 32 px** — busca, Segmented, Filtros e Exportar ficam em alturas diferentes na mesma linha. Os chips de categoria e de pavilhão são dois componentes. → `--h-sm: 32px` como fonte única; Segmented sm com raio sm. Os pavilhões usam os mesmos `.pill`. *Lista (barra), criação etapas 2, 4 e 5.*
- **A-41 · [média] Ação inline em 4 estilos** — "✎ Editar" azul com ícone, "Preencher" como botão ghost, "Trocar" em texto e "Dividir igualmente" como botão com ícone. A revisão tem seis "Editar" azuis. → Um estilo só, `.linkButton` (12/500, b-600, sem ícone, sublinhado no hover). Na revisão, "Editar" fica em `--muted` e azul no hover. O texto termina rente à borda da seção. *Revisão, detalhe, etapas 1–4.*
- **A-67 · [baixa] Tokens soltos** — 25 hexadecimais crus (#f4faff, #fcfdff, #fbfcfd…). A tabela é a única superfície com sombra e raio de 12 px. Há dois estilos de "selecionado". O rádio de 15 px foi desenhado à mão e duplicado. → Usar tokens (b-25, g-25, b-200, g-75, g-300, red-bg). Superfície usa `--r-lg` sem sombra. Selecionado = borda b-300 + fundo b-25, sem anel. Rádio de 18 px único, no canto superior direito. *Todas.*
- **A-68 · [baixa] Títulos de página** — 22 na lista, 24 no detalhe, ícone sólido só na lista. → 24/32 na lista e no detalhe (22 em ≤760 px). Sai o ícone do título e o do diálogo de exclusão da lista. O builder fica com 18 (título contido da moldura). *Lista, detalhe.*

## Responsividade

- **A-03 · [crítica] Sem navegação abaixo de 960 px** — o menu some (`display: none`) e nada o substitui. Não dá para trocar de persona, e o roteiro de captura trava. Entre 961 e 1199 px, o menu fixo de 236 px espreme tudo. → Gaveta lateral até 1199 px: botão de menu no topo, véu, Escape, fecha ao navegar e `inert` no conteúdo. O seletor de persona aparece também na gaveta. *Todas, ≤1199 px.*
- **A-10 · [alta] Lista com 991 px de largura no celular** — rótulos ocultos com `position: absolute` escapam do contêiner de rolagem. → `.scroll { position: relative }` e coluna do app em `minmax(0, 1fr)`. *Lista em 390, 768 e 1024.*
- **A-11 · [alta] Tabela espremida no celular e no tablet** — em 390, uma tabela de 980 px fica num rolo de 356 px. Em 1024, Período e ações ficam escondidos. → Em ≤760 px, cada campanha vira uma linha-cartão com seleção, interruptor, nome, uma linha de meta e um menu de ações. De 761 a 1279 px, Vínculos e Período saem da tabela e o período vai para a sublinha do nome. *Lista.*
- **A-12 · [alta] Coluna do builder estreita (laptop pequeno)** — com coluna de 437 px, o nome do público desenha sobre os números e os KPIs viram "R$ 18....". → Container queries no miolo, com níveis em 680 e 560 px: KPIs 2×2, faixa em 2 colunas, revisão em 1 coluna, grade de públicos sem Disponível/Frequência. *Criação, 1024–1280.*
- **A-13 · [alta] Barra de ações em lote abaixo da dobra** — selecionar uma linha não mostra nada em 1366×768, 1280×800 e no celular. → Barra `sticky` a 16 px do rodapé da janela. *Lista.*
- **A-48 · [média] Régua de etapas transborda** — de 641 a 1240 px, "6 Revisão" sai cortada pela metade. No celular aparecem só 3 de 6 etapas. → Conectores mais curtos até 1240. No celular, os 6 marcadores ficam visíveis, com título só na etapa atual e alvo de 40 px. *Criação.*
- **A-49 · [média] Envio no celular 1300 px abaixo** — o botão principal diz "Salvar rascunho" sem que a escolha esteja visível. → Em ≤1020 px, o painel de envio vem antes da revisão. *Criação, etapa 6, celular e tablet.*
- **A-50 · [média] Resumo inteiro empilhado em ≤1020 px** — 450–736 px de placeholders sob cada etapa. → Vira um `<details>` de uma linha ("Resumo · R$ 18.000,00 · 27 dias"), fechado por padrão. *Criação, tablet e celular.*
- **A-51 · [média] 228 px de cromo fixo no celular** — o topo do shell repete o título da moldura. → Na criação, em ≤640 px, sai o topo do shell, a moldura ocupa `100dvh` e o subtítulo some (152 px no total). *Criação, 390 px.*
- **A-52 · [média] Alvos de toque menores que 40 px** — interruptor de 30×17, checkbox de 18 e sino de 30. → Em `pointer: coarse`: `--h-sm` 36, `--h-md` 44, `--h-lg` 48. Checkbox e interruptor ganham área de toque de 40 px. Os "Editar" da revisão ganham 40 px. *Todas, toque.*
- **A-53 · [média] Detalhe de 761 a 1100 px** — P.I. e Histórico caem para o fim, e a jornada corta "Ajustes solicitad…". → A lateral sobe e vira 3 colunas (1 coluna em ≤760). Os rótulos da jornada quebram linha até 1180. *Detalhe, tablet.*
- **A-69 · [baixa] Lista no celular** — o Exportar fica cortado, os filtros têm largura fixa e a paginação quebra em 3 linhas. → A barra quebra linha, os filtros ficam em 2 colunas fluidas e o "Por página" some em ≤640. *Lista, 390 px.*

## UX premium

- **A-01 · [crítica] A tabela recorta o que flutua** — o popover de Vínculos (exigido pela produção) nunca aparece e todo tooltip fica cortado. O texto oculto do tooltip desenha "…" depois de cada interruptor. → O tooltip passa a `position: fixed`, renderizado só quando aberto, preso à janela e com `aria-describedby`. As células com controle deixam de cortar. O popover de Vínculos passa a `position: fixed`, ancorado ao botão, e vira para cima quando faltar espaço. Coluna de veiculação com 56 px. *Lista, lista agrupada, 390 a 2560 px.*
- **A-02 · [crítica] "Excluir" em lote apaga só a primeira** — o "Excluir" em lote também ignora a regra de veiculação: selecionando #2041 (no ar), #2035 e #2029, o diálogo oferece apagar #2041. → O diálogo vale para N campanhas ("Excluir 2 campanhas?"), com "1 em veiculação fica de fora." Se todas estiverem no ar, o botão fica desabilitado. O toast informa N. *Lista, seleção.*
- **A-22 · [alta] O detalhe envia rascunho com briefing obrigatório vazio** — #2014 vai para aprovação com "Falta" em vermelho. → Validar antes. Se houver bloqueio, abrir a edição na etapa certa (`?etapa=5`) e mostrar o toast de produção "Preencha os campos obrigatórios…". Em "Ajustes solicitados", o botão principal vira "Ajustar e reenviar", que abre o editor. *Detalhe, rascunho e ajustes.*
- **A-23 · [alta] Ações irreversíveis em um clique** — "Concluir" encerra a campanha no ar. "Aprovar e gerar P.I." reserva estoque. O interruptor de uma campanha "Aprovada" inicia a veiculação. → Diálogo de confirmação curto, sem ícone e com foco no botão de confirmar. O status do P.I. acompanha as transições (Pausado, Ativo, Concluído, Cancelado). *Detalhe, lista (interruptor).*
- **A-24 · [alta] A edição de "Ajustes solicitados" não mostra o pedido** — o motivo do comercial não aparece no editor. → É o primeiro bloco da lateral (ponto laranja, texto em 3 linhas com "ver tudo", autor e data). Aparece também no painel de envio. *Edição, cmp-2029.*
- **A-25 · [alta] Feedback raso** — não há desfazer. A lista diz "Veiculação pausada." e o detalhe diz "Campanha em “Pausada”." O histórico registra "Status alterado". → O toast ganha ação ("Desfazer" para pausar e retomar) e pausa no hover. Há um verbo de conclusão por status, usado no toast e no histórico. *Lista, detalhe.*
- **A-54 · [média] "Salvar rascunho" desabilitado nas etapas 1–2** — o motivo aparece só no hover, que no toque não existe. → Sempre habilitado. Ao salvar, valida e leva ao primeiro campo inválido, como na produção, com o mesmo carregamento de 400 ms do envio. *Criação.*
- **A-55 · [média] A persona anunciante vê e edita campanhas alheias** — o detalhe e o editor não filtram por anunciante. → Para campanha de outro anunciante, mostrar o estado "não encontrada". *Detalhe, edição.*
- **A-56 · [média] A busca não acha o número da linha** — "2041" não encontra nada. → Buscar também por número e por "#número". O placeholder vira "Campanha, anunciante ou nº". *Lista.*
- **A-57 · [média] O vazio culpa filtros que não existem** — aparece "0–0 de 0" na paginação, e o filtro de status contradiz a aba. → Texto conforme a causa: filtro, aba ou nenhuma campanha. A paginação some quando não há linhas. Um status de fora da aba leva para "Todas". *Lista.*
- **A-58 · [média] O erro do período cai no campo já preenchido** — e "Término" desalinha 19 px. → O erro vai para cada data vazia. Campos com `align-content: start` e grades com `align-items: start`. *Criação, etapa 2.*
- **A-59 · [média] Data e autor do motivo fixos no código** — "29/09/2026 às 16:42 · Marina Lopes" aparece mesmo depois de um novo motivo. → Gravar quem e quando, e formatar `dd/MM/aaaa às HH:mm`. O alerta do anunciante usa `role="status"`. *Detalhe, lista (anunciante).*
- **A-60 · [média] Diálogos com foco no "Fechar" e corpo vazio de 44 px** — → Foco no campo Motivo e no "Cancelar" das confirmações destrutivas. O corpo do diálogo some quando está vazio. *Detalhe, lista, criação.*
- **A-70 · [baixa] A verba muda em silêncio no blur** — digitar 100 vira R$ 2.025,00 sem explicação. → Dica "Ajustada para R$ 2.025,00 — mínimo deste ativo." até a próxima edição. *Criação, etapa 3.*
- **A-71 · [baixa] O "Exportar" do topo não faz nada** — → Exporta as linhas visíveis em CSV, com tooltip e toast. O "Exportar" em lote usa a mesma função. *Lista.*
- **A-72 · [baixa] O rodapé abre com "Nada alterado · Etapa 1 de 6"** — → Sem estado de salvamento enquanto não há mudança. Na edição com a verba ajustada, mostra "Verba ajustada — salve para manter". *Criação, edição.*

## Plano de correção

| Id | Severidade | Área | Arquivos |
|---|---|---|---|
| A-01 | crítica | Lista | ds-v3/overlays.tsx, overlays.module.css, table.module.css; campaigns/list.tsx, list.module.css |
| A-02 | crítica | Lista | campaigns/list.tsx |
| A-03 | crítica | Shell | shell.tsx, shell.module.css |
| A-04 | crítica | Criação | builder/builder.tsx, builder.module.css |
| A-05 | alta | Criação | builder/builder.tsx, builder.module.css |
| A-06 | alta | Criação | shell.module.css; builder/builder.tsx, builder.module.css; ds-v3/overlays.* |
| A-07 | alta | Criação | builder/steps-a.tsx, parts.module.css |
| A-08 | alta | Lista | campaigns/list.tsx, list.module.css; ds-v3/table.module.css |
| A-09 | alta | Lista | campaigns/list.tsx, list.module.css |
| A-10 | alta | Lista | ds-v3/table.module.css; shell.module.css |
| A-11 | alta | Lista | campaigns/list.tsx, list.module.css |
| A-12 | alta | Criação | builder/builder.module.css; parts.module.css, steps-b.tsx |
| A-13 | alta | Lista | campaigns/list.module.css |
| A-14 | alta | Global | ds-v3/table.module.css; list.module.css; detail.module.css; parts.module.css |
| A-15 | alta | Criação/Detalhe | builder/builder.module.css, summary.module.css; detail.module.css |
| A-16 | alta | Global | builder.module.css, summary.*, parts.module.css, detail.module.css, ds-v3/slider.module.css, fields.module.css |
| A-17 | alta | Global | ds-v3/theme.module.css; detail.*; parts.module.css; summary.module.css |
| A-18 | alta | Lista/Shell | campaigns/buckets.ts (novo), list.tsx, shell.tsx; steps-a.tsx |
| A-19 | alta | Global | summary.tsx; steps-a.tsx, steps-b.tsx; detail.tsx |
| A-20 | alta | Global | list.tsx; detail.tsx; summary.tsx, validation.ts; steps-a.tsx, pricing.ts |
| A-21 | alta | Global | list.tsx; detail.tsx; summary.*, validation.ts; steps-a.tsx, steps-b.tsx |
| A-22 | alta | Detalhe | detail.tsx; builder.tsx |
| A-23 | alta | Detalhe/Lista | detail.tsx, store.ts; list.tsx |
| A-24 | alta | Criação | builder.tsx, summary.tsx, summary.module.css |
| A-25 | alta | Global | ds-v3/toast.*; domain.ts, store.ts, detail.tsx; list.tsx |
| A-26 | alta | Criação | summary.tsx, summary.module.css; parts.module.css, steps-b.tsx |
| A-27 | média | Criação | briefing.tsx, parts.module.css |
| A-28 | média | Criação | parts.module.css |
| A-29 | média | Shell | shell.tsx, shell.module.css |
| A-30 | média | Shell | shell.tsx, shell.module.css |
| A-31 | média | Detalhe/Shell/Criação | detail.module.css; shell.module.css; builder.module.css |
| A-32 | média | Criação | ui.tsx, builder.module.css, builder.tsx; steps-a.tsx, steps-b.tsx |
| A-33 | média | Criação | steps-a.tsx, parts.module.css |
| A-34 | média | Lista | list.module.css |
| A-35 | média | Detalhe | detail.tsx, detail.module.css |
| A-36 | média | Criação | builder.module.css |
| A-37 | média | Global | domain.ts, detail.*; list.tsx, list.module.css |
| A-38 | média | DS | ds-v3/button.module.css, theme.module.css |
| A-39 | média | Detalhe/Criação | detail.*; steps-b.tsx, parts.module.css |
| A-40 | média | Criação | steps-a.tsx, steps-b.tsx |
| A-41 | média | Global | steps-a.tsx, steps-b.tsx, parts.module.css; detail.* |
| A-42 | média | Global | summary.tsx, validation.ts, builder.tsx; steps-a.tsx, steps-b.tsx |
| A-43 | média | Detalhe | detail.tsx |
| A-44 | média | Global | list.tsx; detail.tsx |
| A-45 | média | Criação | builder.tsx, builder.module.css, summary.tsx |
| A-46 | média | Global | detail.tsx; steps-a.tsx |
| A-47 | média | DS | ds-v3/theme.module.css, fields.module.css, select.module.css, selection.module.css; briefing.tsx, parts.module.css |
| A-48 | média | Criação | builder.module.css |
| A-49 | média | Criação | builder.tsx, builder.module.css |
| A-50 | média | Criação | summary.tsx, summary.module.css |
| A-51 | média | Criação | shell.module.css; builder.module.css |
| A-52 | média | DS | ds-v3/theme.module.css, fields.module.css, select.module.css, selection.module.css; parts.module.css |
| A-53 | média | Detalhe | detail.module.css |
| A-54 | média | Criação | builder.tsx |
| A-55 | média | Detalhe/Criação | detail.tsx; builder.tsx |
| A-56 | média | Lista | list.tsx |
| A-57 | média | Lista | list.tsx |
| A-58 | média | Criação | validation.ts, builder.module.css; ds-v3/fields.module.css |
| A-59 | média | Detalhe/Lista | store.ts, detail.tsx; list.tsx |
| A-60 | média | DS | ds-v3/overlays.*; detail.tsx; list.tsx; builder.tsx |
| A-61 | baixa | Lista | list.tsx, list.module.css |
| A-62 | baixa | Criação | steps-a.tsx |
| A-63 | baixa | Criação | builder.tsx, builder.module.css |
| A-64 | baixa | Criação | steps-a.tsx, parts.module.css |
| A-65 | baixa | Criação | steps-a.tsx, steps-b.tsx, parts.module.css; summary.* |
| A-66 | baixa | DS | ds-v3/theme.module.css, table.module.css, badge.module.css, fields.module.css; parts.module.css |
| A-67 | baixa | Global | ds-v3/table.module.css, selection.module.css; parts.module.css; summary.module.css, builder.module.css; list.module.css, shell.module.css; detail.module.css |
| A-68 | baixa | Global | list.tsx, list.module.css; detail.module.css |
| A-69 | baixa | Lista | list.module.css; ds-v3/table.module.css |
| A-70 | baixa | Criação | steps-a.tsx |
| A-71 | baixa | Lista | list.tsx |
| A-72 | baixa | Criação | builder.tsx, builder.module.css |

Ordem de execução: cinco frentes em paralelo, sem arquivo compartilhado. As frentes são DS, shell + lista, detalhe (com `domain.ts` e `store.ts`), moldura da criação (com `validation.ts`) e etapas da criação (com `pricing.ts`). Depois, recaptura em 390, 1280, 1440 e 1920.

## Execução

Rodada final em 01/10/2026. Esta rodada fecha os itens que não tinham entrado por inteiro e as regressões achadas na verificação. Ao final, `tsc --noEmit`, `eslint src/app/dashboardv3 src/components/ds-v3` e `vitest run` (225 testes) passam. As telas foram recapturadas em 1440×900, 1280×800 e 390×844 (`final-1440`, `final-1280`, `final-390`, sem erro de console).

| Id | Status | Observação |
|---|---|---|
| A-01 | corrigido | O popover de Vínculos e a dica ficam fixos à janela. O `aria-describedby` agora chega ao próprio `role="switch"` (prop `describedBy` no `Switch`), e não ao invólucro. No toque, tocar o interruptor indisponível mostra o motivo num aviso. |
| A-02 | corrigido | O diálogo vale para N campanhas e informa quantas no ar ficam de fora. Se todas as selecionadas estão no ar, o "Excluir" em lote fica desabilitado e mostra o motivo na dica (`BulkAction.disabled` / `hint`). |
| A-03 | corrigido | Até 1199 px o menu vira gaveta, com véu, Escape e `inert`. |
| A-04 | corrigido | No celular, o rodapé tem uma linha só: [←] [Salvar rascunho] [ação principal]. O Voltar tem `order: -1` e fica no mesmo x em todas as etapas, inclusive na revisão. |
| A-05 | corrigido | Quatro slots fixos. A linha de status do rodapé no celular sumiu, então o rodapé tem sempre a mesma altura (com ou sem erro, com ou sem "Enviar"). |
| A-06 | corrigido | `overflow: clip` nas molduras. A dica só existe enquanto aberta. |
| A-07 | parcial | Antes de escolher, a etapa 1 mostra o ranking. Agora os cartões de pacote listam os ativos de cada pacote com a janela, e o grupo "Ativos do pacote", que repetia o conteúdo, saiu. Preço fechado e bonificação ganharam a faixa "Preço fechado · Duração · Custo por dia · Bônus". Ainda sobra branco na etapa 1 quando o anunciante tem poucas campanhas: a decisão foi não pôr enchimento. |
| A-08 | corrigido | O conjunto de colunas do tablet (sem Vínculos e Período, que sobem para a linha de apoio) vale até 1439 px, então some o degrau entre 1279 e 1280. Campanha mede 306 px em 1280, 392 em 1366 e 284 em 1440, com a tabela completa e nenhum nome cortado. O status ocupa 160 px e quebra em 2 linhas dentro da linha de 46 px. |
| A-09 | corrigido | Slots fixos e Vínculos em texto. |
| A-10 | corrigido | Não há rolagem lateral em 390, 768 nem 1024. |
| A-11 | corrigido | Cartão com nome e duas linhas de meta fixas, sem quebra: status (+ anunciante) e verba · período. Todos os cartões medem 78–79 px. Uma linha só não cabia: em 390 px seriam necessários cerca de 290 px para 216 disponíveis. No celular, "N vínculos" fica no menu do cartão e abre o detalhamento num diálogo. No tablet, ele aparece na linha de apoio do nome e abre o popover. |
| A-12 | corrigido | O catálogo tem 3 colunas em 1280/1366 e descrição em 1 linha abaixo de 760 px. A rolagem da etapa 2 vazia caiu de 314 para 66 px em 1280×800 e de 346 para 78 px em 1366×768. As legendas dos KPIs da revisão vão até 2 linhas, sem reticências. |
| A-13 | corrigido | Barra fixa na base. Enquanto há seleção, `scroll-padding-bottom: 76px` faz o foco por teclado rolar o conteúdo para cima da barra. |
| A-14 | corrigido | O status da tabela também está em 13/20, igual às outras células. |
| A-15 | corrigido | Os marcadores de "Depois do envio" e da Checagem passaram a 20 px (600 11 px), como a régua. |
| A-16 | corrigido | O "—" da lista passou de `--subtle` para `--muted`. |
| A-17 | corrigido | A faixa de previsão do detalhe usa a mesma especificação das faixas do construtor: 12/16/13, rótulo caption-strong e `-0.012em`. |
| A-18 | corrigido | Um mapa único de recortes. |
| A-19 | corrigido | O título do aviso de P.I. é só o código. Na etapa 3, a frase do modelo sai quando não há verba a informar. Na etapa 4, saiu a dica que repetia a divisão igual. |
| A-20 | corrigido | Valores exatos sempre com 2 casas. |
| A-21 | corrigido | Datas em `dd/MM – dd/MM` / `dd/MM/aaaa`. |
| A-22 | corrigido | Validar antes de enviar abre `?etapa=5`. O aviso sobe acima do rodapé fixo da criação (`[data-fixed-footer]`) e não cobre mais os botões. |
| A-23 | corrigido | Confirmação nas ações irreversíveis. |
| A-24 | corrigido | O motivo abre a lateral. No resumo ele ocupa 2 linhas, e o texto inteiro fica no envio e em "ver tudo". |
| A-25 | corrigido | Desfazer (lista e detalhe) volta ao retrato anterior (`store.restore`) sem gravar uma transição falsa. Pausar uma aprovada diz "Campanha pausada antes de veicular." |
| A-26 | parcial | O bloqueio virou o rodapé da opção "Enviar para aprovação", e o rodapé geral não repete mais o aviso. O ritmo da revisão ficou mais apertado (notas das barras na linha do nome). A revisão cabe inteira em 1440×900. Ainda sobram 31 px em 1280×800 e 63 px em 1366×768 (eram 94 e 126). |
| A-27 | corrigido | Upload com altura estável (78 px). "Enviar depois" mostra uma linha. O erro aparece dentro da área, no lugar da especificação, e some ao marcar "Enviar depois" ou ao remover o arquivo. |
| A-28 | corrigido | Os cartões de ativo têm conteúdo alinhado ao topo e descrição com corte de linha. |
| A-29 | corrigido | Topo alinhado. O ícone do menu agora começa no x do conteúdo (−8 px; −12 px com alvo de 40 px). |
| A-30 | corrigido | Menu lateral compacto, com esmaecimento no fim. |
| A-31 | corrigido | Larguras em telas largas. |
| A-32 | corrigido | Sem número no título. |
| A-33 | corrigido | Faixa do ativo em 3 colunas. As faixas de 3 fatos não viram mais 2+1 em 600 px: só a de 4 números vira 2×2. |
| A-34 | corrigido | As abas não cortam. Com a barra empilhada, o fio acompanha as abas e as ferramentas ficam abaixo sem segundo fio. |
| A-35 | corrigido | Ver o novo item em "Peso e hierarquia". O "⋯" sai quando só teria "Métricas" e fica na linha do título nos status encerrados. |
| A-36 | corrigido | Níveis 14 > 13 > 12. |
| A-37 | corrigido | Cores de status com sistema. |
| A-38 | corrigido | Botão principal 600, b-700/b-800. |
| A-39 | corrigido | Uma redação só: o bloqueio diz "Faltam N campos do briefing" e a Checagem diz "N campos obrigatórios faltando". Saiu o aviso âmbar do rodapé. |
| A-40 | corrigido | Saiu a descrição explicativa da etapa 3 no pacote. O contador do briefing desce para baixo do título no celular. |
| A-41 | corrigido | Um estilo de ação em texto: o `.textButton` do envio segue o `.linkButton` (12/500, b-600). "usar" passou a "Usar". |
| A-42 | corrigido | Termos únicos. |
| A-43 | corrigido | Os mesmos 5 grupos de vínculos. |
| A-44 | corrigido | Uma regra de verba. |
| A-45 | corrigido | Estado "warn" na régua. |
| A-46 | corrigido | Marca xs soft, sm+ sólida. |
| A-47 | corrigido | `--h-sm` único. |
| A-48 | corrigido | Régua sem transbordo. |
| A-49 | corrigido | Envio antes da revisão em ≤1020 px. |
| A-50 | corrigido | Resumo recolhível. As barras da Distribuição têm uma linha por item e a lateral esmaece no fim quando não cabe. |
| A-51 | corrigido | Sem topo do shell na criação no celular. |
| A-52 | corrigido | Sino e menu com 40×40 quadrados (a regra vence `.button.icon`). Com toque, as linhas da Checagem e "Preencher" têm 40 px. |
| A-53 | corrigido | A jornada usa conectores flexíveis de mesmo comprimento. Abaixo de 900 px os conectores somem e as colunas ficam iguais. Na lateral do tablet, Vínculos usa 2 colunas. No celular, o prazo do P.I. desce para baixo do texto. |
| A-54 | corrigido | Salvar, enviar e "Continuar" focam o primeiro campo inválido: `reveal` aplica os erros com `flushSync`, prioriza `[aria-invalid]`, e `show` não tira mais o foco. "Preencher" e os itens da Checagem abrem a etapa já marcando o que falta. |
| A-55 | corrigido | O caminho (breadcrumb) também esconde a campanha de outro anunciante: aparece "Campanha não encontrada". |
| A-56 | corrigido | Busca por número. O placeholder do anunciante é "Campanha ou nº". |
| A-57 | corrigido | O vazio diz a causa: busca ("Nada encontrado para “…”" e "Limpar busca"), filtros, aba ou nenhuma campanha. "Por página" volta para a página 1, e a página é ajustada depois de excluir. |
| A-58 | corrigido | O erro fica na data vazia. |
| A-59 | corrigido | Cada motivo de exemplo tem data e autor próprios, e "Sistema" registra a expiração do P.I. O histórico de exemplo segue o status: enviada, decisão, P.I. gerado/assinado, veiculação. O prazo do P.I. em aberto é relativo ao dia de quem abre. |
| A-60 | corrigido | Foco nos diálogos. |
| A-61 | corrigido | Grupos com seleção. "Selecionar todos" soma à seleção existente em vez de substituí-la, entre grupos e entre páginas. A seleção perde o que sai do recorte (aba, busca, filtro). |
| A-62 | corrigido | Limites do controle numa linha. "Múltiplos de R$ X" foi para a dica do campo de verba. |
| A-63 | corrigido | Edição bloqueada com o texto "Status atual: …" e sem cadeado no estado "não encontrada". |
| A-64 | corrigido | Cartões de modelo sem ícone. |
| A-65 | corrigido | Barras em 4 px: a cobertura do pacote usa b-600 e o progresso do bônus tem 4 px. "Incluído" usa `--blue-dot` em todas as telas. |
| A-66 | corrigido | Traço 1,75. |
| A-67 | corrigido | "Janela do ativo" usa fio sólido sobre g-25 (sem tracejado). A especificação do upload virou uma legenda só, sem chips, e o quadro de proporção tem fio sólido. |
| A-68 | corrigido | Títulos 24/32. |
| A-69 | corrigido | Até 1100 px, os filtros ficam em 2 colunas fluidas. No celular, o valor do Select termina em reticências, as abas sangram até a borda com a próxima aparecendo, e o aviso do anunciante leva o botão para baixo do texto. |
| A-70 | corrigido | Aviso de verba ajustada. |
| A-71 | corrigido | Exportar CSV. |
| A-72 | corrigido | Estado de salvamento só com mudança. |

### Regressões da verificação, também corrigidas

| Área | Regressão | Correção |
|---|---|---|
| Lista | "Selecionar todos" substituía a seleção | Soma ou tira só as linhas da tabela (`ds-v3/table.tsx`). |
| Lista | Seleção sobrevivia a aba, busca e filtro | Poda pelo recorte visível. |
| Lista | Página 2 + "Por página 25" mostrava "Nenhuma campanha ainda" | Volta para a página 1 e ajusta a página quando ela passa da última. |
| Lista | Degrau de largura em 1279/1280 e anunciantes cortados | Conjunto do tablet até 1439 px e larguras revistas. |
| Lista | Abas sem trilho na barra empilhada; abas escondidas no celular | Fio nas abas; a lista de abas sangra até a borda e esmaece. |
| Detalhe | Título "Briefing" à direita sem campos | A margem automática fica só no link "Preencher". |
| Detalhe | Desfazer pausa gravava "P.I. assinado" | `store.restore` com o retrato anterior. |
| Detalhe | Cancelada marcava as fases como concluídas | O X fica na fase em que a campanha parou. |
| Detalhe | Conectores da jornada desiguais ou em toco | Conectores flexíveis; somem abaixo de 900 px. |
| Detalhe | Meta com "·" pendurado; Configuração e Briefing desalinhados em ≥1600 px | Separador em CSS recortado no começo da linha; cabeçalhos de seção com 24 px. |
| Criação 1–3 | Verba contratada somava campanhas em análise, rejeitadas ou canceladas; a campanha editada aparecia no próprio histórico | Só aprovada, no ar, pausada e concluída; a campanha em edição fica fora. |
| Criação 1–3 | Foco ia para `<body>` ao escolher ou trocar o anunciante | Foco em "Trocar" ou na primeira linha do ranking. |
| Criação 1–3 | Status da última campanha só por cor | Ponto + texto e período embaixo; o status também entra no nome acessível. |
| Criação 1–3 | Pacote sem ativos avançava | Erro "Este pacote ainda não tem ativos…". |
| Criação 1–3 | Período fora da janela passava calado | "Janela do ativo" fica âmbar com "Fora da janela" e "Usar inteira". |
| Criação 1–3 | "faltam" repetia o limite sem verba; "Este ativo" no pacote; bônus em meia largura em 1920 | Corrigido. |
| Criação 4–6 | Bloqueio dito 3–4 vezes com cores diferentes; o rodapé crescia no celular | Uma redação, sem aviso no rodapé, rodapé com altura fixa. |
| Criação 4–6 | "Preencher" não marcava os campos | `fix(index)` revela os erros da etapa e foca o primeiro. |
| Criação 4–6 | Nomes de bônus cortados na lateral | "Faltam R$ …" desce para baixo do nome. |
| Criação 4–6 | Upload em uma palavra por linha em 390 px; chips de especificação | Área em coluna e sem quadro abaixo de 560 px; especificação em legenda. |
| Criação 4–6 | Revisão omitia "Versões por idioma" | Cada repetição vira uma linha "Rótulo #N", fora da contagem. |
| Criação 4–6 | Estados do bônus em minúscula e cor diferente; meta de público com "·" pendurado | Rótulos iguais aos da lateral; cada fato em bloco sem quebra. |

### Ainda em aberto

- **A-07 (parcial).** A etapa 1 com anunciante escolhido ainda deixa branco quando ele tem 2–3 campanhas. Encher esse espaço pede um conteúdo novo de produto (por exemplo, a agenda do anunciante na feira). Não foi inventado aqui.
- **A-26 (parcial).** A revisão ainda rola 31 px em 1280×800 e 63 px em 1366×768. Fechar isso exige decidir se o "Briefing" da revisão passa a uma coluna de 3 itens ou se a faixa de KPIs perde a legenda nessas alturas.
- Em 1280×800 e 1366×768, a lateral do resumo nas etapas 4–5 rola de 89 a 121 px (na edição com motivo, 216–248 px). O fim esmaece, mas o bloco "Bônus" fica abaixo da dobra.
