# Toasts do Dashboard V2

Adaptação da [referência enviada pelo usuário](../../../references/dashboardv2-toast-reference.png) em 30/09/2026, disponível para avaliação em `/dashboardv2#toasts`. A referência orienta este componente; a aplicação continua seguindo a base aprovada em `DESIGN-NOTES.md`.

## Aparência

- Após o pedido de compactação, a superfície mantém a tonalidade suave, borda e sombra discretas, com raio de 10px, padding de 12px e espaçamento de 10px.
- Informação azul, sucesso verde, atenção laranja e erro rosa. Ícone e descrição textual acompanham a cor.
- Ícones Lucide de 17px em uma superfície de 30px. Inter local: título 13/20px, peso 600; mensagem 13/20px, peso 400; ação 12/18px, peso 500.
- Versão compacta com mensagem; versão detalhada com título e ação opcional. A ação reutiliza `FormButton`, com contorno e formato arredondado da referência.
- Aviso flutuante de até 360px no canto superior direito, abaixo do cabeçalho. A galeria respeita a mesma largura por aviso. No celular, margem lateral de 16px e largura limitada à janela. A ação tem altura mínima de 28px no desktop e 32px no celular; mensagens longas continuam quebrando linha sem truncamento.

## Comportamento

`useToast`, `ToastCard` e `ToastViewport` ficam em `toasts.tsx`. Mensagens simples continuam aceitando uma string e recebem o estado de sucesso. Objetos permitem informar variante, título e ação.

- Um aviso por vez; uma nova mensagem substitui a anterior e reinicia seu tempo.
- Informação e sucesso sem ação desaparecem após seis segundos. A contagem pausa com ponteiro, foco, aba oculta ou menu móvel aberto.
- Atenção, erro e qualquer aviso com ação permanecem até fechar ou agir.
- Fechar por botão ou Escape dentro do aviso devolve o foco à origem, com o título da página como alternativa. Exibir o aviso não muda o foco.
- A ação dispensa o aviso e executa seu destino. Avisos comuns são anunciados com `status`; atenção e erro usam `alert`.
- O menu móvel suspende o aviso e o deixa inerte. Animação de entrada curta respeita redução de movimento.

Salvar um cadastro oferece “Ver cadastro”; criar uma campanha oferece “Ver campanha”. Toggles, exportação e movimentação de leads usam o formato compacto. Os quatro exemplos da galeria são ilustrativos, não indicam problemas reais na aplicação.

## Escopo e validação

Somente frontend em `apps/design-system`. Dados em memória; nenhum backend, componente oficial ou integração foi alterado. A extração para o design system oficial continua pendente da avaliação do usuário.

O catálogo 21st foi consultado como apoio: [Toast Notification](https://21st.dev/@framecn/components/toast-notification) e [Toast](https://21st.dev/@cnippet-dev/components/toast). Nenhum código ou dependência externa foi incorporado. O CLI `21st` não está instalado; as tentativas de inicialização/revisão não puderam rodar. A revisão utilizou código, testes e navegador.

Lint, tipos e testes do monorepo passaram, incluindo 159 testes na aplicação isolada e sete verificações novas de tempo, repetição, pausa, foco, ação e persistência. O build isolado passou. O build geral foi executado com `SKIP_ENV_VALIDATION=1` e interrompido pela restrição de abertura de porta no Turbopack da Vitrine (`Operation not permitted`), que também cancelou os builds paralelos.

Conferência visual em desktop e 390px: formatos compacto e detalhado, aviso flutuante, menu móvel, fechamento e navegação pela ação até o cadastro salvo. Sem rolagem horizontal da página em 390px.
