# Inventário — lista e detalhe de campanhas (produção, apps/web)

Fonte: `apps/web/src/app/p/[portalSlug]/campaigns/*` e `lib/campaigns/*`. Uso: inventário
funcional para o redesenho V3; o visual atual não é referência.

## Lista — "Campanhas" (operador) e "Minhas campanhas" (anunciante)

**Cabeçalho**
- Título "Campanhas"; subtítulo "{n} de {total} campanha(s) do portal."
- "Minhas campanhas": "{n} campanha(s) sua(s) neste portal."
- Botão "Nova campanha": o operador precisa de `campaign:create`; o anunciante sempre tem.

**Filtros** (estado na URL)
- "Status": Todos + os 11 status.
- "Anunciante": Todos + os anunciantes com campanha. Só o operador vê.
- "De" / "Até": regra de sobreposição de período.
- "Filtrar".
- Produção NÃO tem: busca, abas por status, ordenação, paginação, seleção, lote, toggle e
  contagem. O V3 pode propor, alinhado ao DS.

**Colunas** (ordem da produção)

| # | Coluna | Conteúdo |
|---|---|---|
| 1 | Nome | — |
| 2 | Anunciante | — |
| 3 | Ativo | Nomes dos ativos, ou "Pacote: <nome>", ou "—" |
| 4 | Status | Selo |
| 5 | Verba | R$. Oculta ("—") sem `financial:view` |
| 6 | Vínculos | "N vínculos", abre popover |
| 7 | Período | "dd/MM – dd/MM" |
| 8 | Ações | — |

- O popover de Vínculos agrupa "Ativos (n)", "Canais (n)", "Públicos (n)", "Métricas (n)" e
  "Bonificações (n)".

**Ações da linha**

| Ação | Quando aparece |
|---|---|
| Ver | Sempre |
| Métricas | Com `metrics:view`; o anunciante sempre vê as suas |
| Editar | Status `draft` ou `adjustments_requested` |
| Excluir | Só operador com `campaign:approve` |

- Diálogo de exclusão:
  - Título: "Excluir {nome}?"
  - Texto: "A exclusão apaga a campanha, as métricas entregues e os P.I., e devolve o estoque
    reservado — tudo na mesma transação. Não há como desfazer."
  - Ações: "Cancelar" / "Excluir".
  - Toast: "Campanha excluída e estoque liberado."
- PLANEJADO: bloquear a exclusão de campanha Veiculando ("Campanhas em veiculação não podem ser
  excluídas.").

**Anunciante**
- Alerta por campanha em Rejeitada, Ajustes solicitados, P.I. rejeitado ou Cancelada com motivo.
  Título "{nome} — {status}", texto com o motivo e "Em dd/MM/yyyy às HH:mm".

**Vazio:** "Nenhuma campanha" / "Nenhuma campanha do portal atende aos filtros escolhidos."

**Veiculação:** não há switch; ligar, pausar e concluir são transições no detalhe.

## Status e transições

| Status | Rótulo | Vai para |
|---|---|---|
| draft | Rascunho | Aguardando aprovação, Cancelada |
| submitted | Aguardando aprovação | Aguardando assinatura do P.I. (aprovar), Ajustes, Rejeitada, Cancelada |
| adjustments_requested | Ajustes solicitados | Aguardando aprovação, Cancelada |
| awaiting_pi_signature | Aguardando assinatura do P.I. | Aprovada, P.I. rejeitado, Cancelada (reserva de estoque por 72 h) |
| approved | Aprovada | Veiculando, Pausada, Cancelada |
| pi_rejected | P.I. rejeitado | Ajustes, Cancelada |
| active | Veiculando | Pausada, Concluída, Cancelada |
| paused | Pausada | Veiculando, Concluída, Cancelada |
| completed | Concluída | terminal |
| rejected | Rejeitada | Cancelada |
| cancelled | Cancelada | terminal |

**Motivo obrigatório** ao rejeitar, pedir ajustes, rejeitar o P.I. ou cancelar.
- Diálogo: "{ação} — {campanha}"
- Texto: "O motivo vai para o anunciante junto com a decisão e fica registrado na auditoria."
- Campo: "Escreva o motivo"
- Ações: "Cancelar" / "Confirmar".

**Verbos das decisões** (usar no V3; a produção usa o nome do status no botão): "Aprovar e gerar
P.I.", "Solicitar ajustes", "Rejeitar", "Iniciar veiculação", "Pausar", "Retomar", "Concluir",
"Cancelar campanha".

**Enviar para aprovação:** "Enviar para aprovação" → toast "Campanha enviada para aprovação."

**Efeito da aprovação:** aprovar gera o P.I. e reserva o estoque por 72 h; o P.I. assinado leva a
campanha a Aprovada; o P.I. expirado leva a P.I. rejeitado.

## Detalhe da campanha

**Produção:** título + "Detalhe da campanha"; um cartão "Dados da campanha" (Anunciante,
Ativo/Pacote, Status, Verba, Período); ações de transição. Sem métricas, P.I., briefing, canais,
públicos, histórico.

**V3 deve propor** (dados existem no domínio):
- métricas entregues (impressões, cliques, leads — "—" quando não coletado, nunca zero);
- o P.I. (status: Rascunho, Aguardando aprovação, Aprovado, Enviado, Assinado, Ativo, Pausado,
  Concluído, Cancelado);
- configuração (ativo, modelo, verba, canais e públicos com alocação, bônus);
- briefing preenchido e criativos;
- vínculos;
- histórico/auditoria (notificações, motivos);
- ações por papel.

## Domínio

- **Portal:** um por feira.
- **Anunciante/expositor:** dono da campanha.
- **Ativo:** produto de mídia, com categoria, preço-base, estoque, canais, públicos, métricas,
  bônus e campos de briefing.
- **Pacote:** conjunto de ativos.
- **Canal:** meio de veiculação.
- **Público:** audiência com estoque por período.
- **Métrica:** impressões, cliques, disparos…
- **Briefing:** campos do ativo.
- **P.I.:** pedido de inserção.
- **Bônus/Bonificação.**
- **Verba:** exige `financial:view`.
- **Leads:** contatos ligados à campanha.
