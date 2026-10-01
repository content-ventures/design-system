# Inventário — criação de campanha (produção, apps/web)

Fonte: leitura do código em `apps/web` (campaign-wizard-dialog.tsx, campaign-wizard-steps.tsx,
lib/campaigns/*). Uso: **inventário funcional** para o redesenho V3. O visual atual não é referência.
Na produção o fluxo é um modal com 6 passos; no V3 ele vira **página** (estilo Meta/Google Ads).
Todo campo abaixo precisa existir no redesenho. Itens marcados PLANEJADO são correções previstas
(spec `campanhas-paridade-legado-correcoes`) — podem entrar como melhoria.

## Quem cria

- **Operador/Admin do portal** (tela "Campanhas"): escolhe o anunciante. Selo "Criada pelo Admin".
- **Anunciante** (tela "Minhas campanhas"): anunciante fixo, texto "A campanha é montada em seu
  próprio nome." Selo "Criada pelo Anunciante".
- Entradas: botão "Nova campanha"; edição pelo ícone "Editar" da tabela (só para `draft` e
  `adjustments_requested`). Título: "Nova campanha" / "Editar campanha".

## Estrutura

6 passos fixos, sempre na mesma ordem:

| # | Passo | Chave |
|---|---|---|
| 1 | Identificação | identification |
| 2 | Ativo | asset |
| 3 | Precificação | pricing |
| 4 | Canal + Público | channels_audiences |
| 5 | Formulário (briefing) | form |
| 6 | Revisão | review |

O conteúdo muda conforme três fatores: Ativo × Pacote, o modelo de precificação (com ou sem verba) e
`allow_advertiser_allocation` do ativo.

**Navegação entre passos**
- Avançar valida só o passo atual; Voltar não valida.
- Os passos concluídos são clicáveis.
- Salvar valida tudo e volta ao 1º passo inválido.

**Sair com alterações**
- Título: "Descartar a campanha?"
- Texto: "O que você preencheu ainda não foi salvo e será perdido."
- Ações: "Continuar editando" / "Descartar".

**Alertas no topo**
- "Verba ajustada": "A verba foi ajustada de R$ X para R$ Y para seguir a regra do ativo." (só em
  edição).
- "Não foi possível salvar" (erro do envio).

**Rodapé:** Cancelar · Voltar · Avançar. No último passo, o botão vira "Salvar campanha".

**Salvamento:** não há autosave. Rascunho = salvar com o envio desligado.

## Passo 1 — Identificação

| Rótulo | Chave | Tipo | Regras |
|---|---|---|---|
| Nome da campanha | name | texto | Placeholder "Campanha de lançamento". Obrigatório: "Informe o nome da campanha." |
| Anunciante | advertiser_id | select (operador) ou texto fixo (anunciante) | Placeholder "Selecione o anunciante". Obrigatório: "Selecione o anunciante." |

## Passo 2 — Ativo

**Tipo de contratação** (`selection_kind`)
- Alternância "Ativo" | "Pacote", padrão Ativo.
- Trocar o tipo limpa a seleção do outro.

**Se Pacote**
- "Pacote" (`package_id`): select, placeholder "Selecione o pacote".
- Obrigatório: "Selecione o pacote."
- Ajuda: "{N} ativo(s) neste pacote."
- PLANEJADO: resumo do pacote e o aviso "Pacote sem ativos".

**Se Ativo**
- "Categoria" (`category`): 4 cartões, obrigatório ("Selecione a categoria.").
  - Mídia Online (`midia_online`)
  - Conteúdo Orgânico (`conteudo_organico`)
  - Mídia Offline (`midia_offline`)
  - Prospecção Ativa (`prospeccao_ativa`)
- "Ativo" (`media_asset_id`): cartões com nome e descrição, filtrados pela categoria.
  - Vazio: "Nenhum ativo nesta categoria."
  - Obrigatório: "Selecione o ativo."
- "Resumo do ativo": Modelo de precificação, Preço base (R$), Canais (selos), Públicos (selos).

**Período** (sempre visível)
- "Início da veiculação" (`start_date`) e "Fim da veiculação" (`end_date`).
- Obrigatórios: "Defina o período de veiculação da campanha."
- Fim ≥ início: "A data final não pode ser anterior à inicial."
- Ajuda: "O período define a disponibilidade de estoque: mudá-lo recalcula o disponível de todos os
  públicos e canais já escolhidos."
- PLANEJADO: pré-preencher com a janela do ativo (selo "Datas do ativo"/"Datas do pacote") e
  bloquear datas passadas.

## Passo 3 — Precificação

**Modelo**
- Com ativo: só leitura, selo do modelo + "· R$ X / unidade".
- Com pacote: select "Modelo de precificação" com CPM, CPC, Por Disparo, Pacote Fixo, Pacote por
  Métrica e Bônus.

**Verba**
- Modelo Bônus: "Este ativo não tem cobrança: ele entra na campanha só como bonificação."
- Pacote Fixo/Pacote: "Este modelo tem o preço fechado no ativo — não há verba a informar."
- Demais modelos, com ativo:
  - "Verba" (`budget`): input R$ (placeholder "0,00") + slider "Ajuste da verba", do mínimo ao
    máximo, com passo = preço base.
  - Chips: "Mínimo: R$ X" · "Recomendado: R$ X" (clicável, preenche) · "Máximo: R$ X" ·
    "Múltiplos de R$ X".
  - Estimativa: "≈ N impressões" (CPM, unidades × 1000) ou "≈ N unidades".
  - Ao sair do campo, a verba é arredondada ao múltiplo e limitada à faixa.
- Com pacote: "Verba", ajuda "Mínimo de compra deste ativo: R$ X."
- Erros:
  - "Informe a verba da campanha."
  - "Verba mínima deste ativo: R$ X."
  - "Verba máxima deste ativo: R$ X."
  - "A verba deve ser múltipla de R$ X (preço base do ativo)."
- Cálculo da faixa:
  - mín = max(ceil(min_purchase/base)×base, base);
  - recomendado = round(recommended/base)×base;
  - máx = floor(max/base)×base.

**Bônus** (se o ativo tem bônus visíveis)
- Título "Bônus disponíveis" ("Bônus vinculados" no modelo Bônus). Ajuda: "Bônus desbloqueiam
  conforme a verba aumenta."
- Cartões com nome, descrição e selo Liberado / Bloqueado (esmaecido) / Incluído.
- A liberação é automática: todas as condições precisam passar, com operadores >=, >, <=, <, ==.
- Condições possíveis: total gasto, verba mínima da campanha, verba, investimento, número de
  campanhas.
- Recompensas possíveis: Desconto (%), Impressões extras, Disparos WhatsApp extras, Bônus
  personalizado.
- PLANEJADO: mostrar a condição ("Libera com verba ≥ R$ 20.000").

## Passo 4 — Canal + Público

**Topo**
- Alerta "Contratação bloqueada" (exclusividade por CNPJ): "O CNPJ XX já é impactado por um
  concorrente da categoria "Y" pela contratação Z, de dd/MM/yyyy a dd/MM/yyyy." Campos: CNPJ,
  Período, Categoria, Contratação existente.
- Faixa de resumo da compra: "R$ 1.000,00 = 100 unidades".

**Canais** (`selected_channel_ids`)
- Checkbox por canal do ativo.
- Vazio: "O ativo escolhido não declara canais."
- Com alocação permitida: input % por canal + "≈ R$ X".
- Total: "Somam X% de 100%."
- Erro: "As alocações de canal somam X% — devem somar 100%."

**Públicos** (`selected_audience_ids`)
- Checkbox por público.
- Vazio: "O ativo escolhido não declara públicos."
- Com alocação: input %.
- Limites: "Mín: N un", "Máx/empresa: N un" (ou "Máx: {disponível} un").
- Frequência: "Frequência: 2,00×".
- Disponibilidade por público:
  - "{Público}: disponível de dd/MM/yyyy a dd/MM/yyyy: 12.345."
  - Excedido, em vermelho: "{Público}: o volume pedido (N) passa do disponível de … a …, que é M."
- Total: "Somam X% de 100%."
- Erros:
  - soma ≠ 100%;
  - `Público "X": o mínimo é N un (alocado: M un).`;
  - `Público "X": o máximo por empresa é N un (alocado: M un).`;
  - estoque excedido.
- Sem alocação permitida: a verba se divide igualmente.

**PLANEJADO**
- Pré-selecionar tudo com divisão igual.
- Unidade de alocação: Percentual / Valor / Unidade.
- Limites por canal.
- Rebalancear e "Alocação habilitada".
- Segmentações e "+R$/un" por público.
- Barra "Total alocado".

## Passo 5 — Formulário (briefing do ativo)

São os campos que o ativo pede no seu Form Builder ("Campos do briefing"). Aparecem em ordem;
campos condicionais somem se a condição não é atendida. Cada campo tem rótulo e o selo
"Obrigatório".

Vazio: "O ativo escolhido não pede informações adicionais no briefing."

| Tipo | Detalhes |
|---|---|
| Texto (text) | — |
| Texto longo (textarea) | — |
| Número (number) | Com mín/máx |
| Data (date) | — |
| Seleção única (select) | — |
| Seleção múltipla (multiselect) | — |
| Upload de criativo (file_upload) | Tipos aceitos, limite 25 MB, "Permitir enviar depois" |
| Moeda (currency) | Com mín/máx |
| Condição (condition) | Grupo de campos filhos, repetível "#1", "#2" |

**Visibilidade condicional:** "Só aparece se {campo} {igual a | diferente de | contém | maior que |
menor que} {valor}".

**Upload**
- Estados: "Enviando {arquivo}…", "Arquivo enviado: {nome}", "Este arquivo foi marcado para envio
  depois da contratação."
- PLANEJADO: prévia e botão de remover.

**Validação:** só quando a campanha vai para aprovação. Mensagens: "Preencha o campo obrigatório do
formulário: X." / "Preencha os campos obrigatórios do formulário: A, B, C…"

**Erros de upload**
- "Formato não aceito para o arquivo do briefing: {tipo}. Envie {lista}."
- "O arquivo do briefing excede o limite de 25 MB."
- "Selecione um arquivo para enviar."
- "Escolha o ativo antes de enviar arquivos."

## Passo 6 — Revisão

**Alerta:** "Contratação bloqueada", se houver.

**Seções**, cada uma com "Editar" que leva ao passo sem perder dados:
- **Identificação:** Campanha, Anunciante.
- **Ativo:** Ativo ou Pacote, Período.
- **Precificação:** Modelo, Verba.
- **Canal + Público:** canais, públicos e linhas de disponibilidade.
- **Formulário:** "Campos preenchidos X/Y" + selos "Falta: {rótulo}".

**Envio**
- Switch "Enviar para aprovação agora?" (padrão desligado) + selo "Rascunho" / "Aguardando
  aprovação".
- Ajuda: "Desligado, a campanha fica gravada como rascunho e pode ser retomada depois."
- Botão "Salvar campanha". Toasts: "Campanha enviada para aprovação." / "Rascunho salvo."

**PLANEJADO:** mostrar na Revisão os bônus, as alocações e a categoria.

## Status (11)

| Status | Rótulo |
|---|---|
| draft | Rascunho |
| submitted | Aguardando aprovação |
| adjustments_requested | Ajustes solicitados |
| awaiting_pi_signature | Aguardando assinatura do P.I. |
| approved | Aprovada |
| pi_rejected | P.I. rejeitado |
| active | Veiculando |
| paused | Pausada |
| completed | Concluída |
| rejected | Rejeitada |
| cancelled | Cancelada |

- Motivo obrigatório para: rejeitar, pedir ajustes, P.I. rejeitado e cancelar ("Escreva o motivo"
  → "Confirmar").
- Ao enviar, notifica os administradores de inventário ("Nova campanha aguardando aprovação" /
  "Campanha reenviada após ajustes") e o anunciante ("Campanha enviada").

## Erros do servidor

- "O ativo escolhido não existe neste portal. Volte ao passo do ativo e escolha outro."
- "Não foi possível gravar a campanha. Nada foi enviado — revise e tente de novo."
- "Não foi possível validar as alocações. Nada foi salvo — tente de novo."
- "Há passos incompletos. Revise os campos."
