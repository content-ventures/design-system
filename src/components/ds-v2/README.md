# MediaOn Design System V2

Biblioteca local extraída da base aprovada de `/dashboardv2`, autorizada pelo usuário em 30/09/2026. Catálogo navegável: `/design-system-v2`, porta 3002. A página inicial da aplicação aponta para esse catálogo. Os estudos anteriores permanecem em `/exploracoes` e `/campanhas`.

## Usar em uma tela

```tsx
import { DesignSystemTheme, Button, FormField, Input } from '@/components/ds-v2';
import { inter } from '@/components/ds-v2/font';

export default function ExamplePage() {
  return (
    <div className={inter.variable}>
      <DesignSystemTheme>
        <FormField id="name" label="Nome" required>
          <Input id="name" name="name" required />
        </FormField>
        <Button variant="primary">Salvar</Button>
      </DesignSystemTheme>
    </div>
  );
}
```

Importar `font.ts` apenas no contexto Next da página/layout. Ele não faz parte do barrel `index.ts`; componentes e testes podem usar a biblioteca sem depender do carregador de fontes do Next.

`DesignSystemTheme` limita os tokens, resets e portais de dropdown/calendário ao seu escopo. O Dashboard V2 compõe a mesma classe de tema no seu canvas para preservar a estrutura de layout. Não há tema escuro ou alteração white-label nova nesta versão: a referência aprovada é clara e azul.

## API pública

| Exportação                                                               | Contrato principal                                                                                                                                                                   |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Button`                                                                 | Props nativas de botão; `variant`: `primary`, `secondary` ou `ghost`; `icon`, `loading`. `type="button"` por padrão. Carregamento desabilita e anuncia `aria-busy`.                  |
| `IconButton`                                                             | Exige `label` e ícone. Nome acessível e área consistente.                                                                                                                            |
| `Input`, `Textarea`                                                      | Props nativas, `error`. Input também aceita prefixo, sufixo e ícone funcional. Rótulos são responsabilidade do consumidor.                                                           |
| `Select`                                                                 | `label`, `options`, valor controlado ou inicial, `onValueChange`, `disabled`, `compact`, `descriptionId`. Opções por teclado e retorno de foco.                                      |
| `MoneyInput`                                                             | Valor inicial numérico, digitação brasileira e formatação ao sair. `parseMoney` permite validar e obter o valor sem perder centavos.                                                 |
| `DateInput`                                                              | `name`, `label`, valor inicial, `onValueChange`, `required`, `error`, `descriptionId`. Calendário em português; `parseDate` e `isoDate` recusam datas inexistentes.                  |
| `Checkbox`                                                               | Input nativo com rótulo; aceita seleção controlada ou inicial e estado desabilitado.                                                                                                 |
| `Switch`                                                                 | `label`, `checked`, `onCheckedChange`, `disabled`, descrição opcional. Trilho de 36×20px; alvo de 44×44px. Não conhece campanhas ou permissões.                                      |
| `Tabs`                                                                   | `values`, `active`, `onChange`, rótulo do tablist. Cada opção pode indicar `panelId`. Setas, Home e End com foco móvel.                                                              |
| `Breadcrumbs`                                                            | `items`, rótulo acessível, separador em chevron ou seta e `maxItems` para recolher níveis intermediários. O último item representa a página atual.                                   |
| `Status`                                                                 | `value`, `tone` explícito, `variant` em ponto ou suave e ícone opcional. Não infere regras de negócio a partir do texto.                                                             |
| `Timeline`                                                               | `items` com título, data, descrição, metadado, ícone e estado `complete`, `current` ou `upcoming`. A etapa atual usa `aria-current` e datas podem fornecer valor semântico.          |
| `DataTable<Row>`                                                         | `label`, `rows`, `rowKey`, `columns`, `density`, `sort`, `onSort`, conteúdo vazio opcional. Colunas definem renderização, largura, alinhamento, título e possibilidade de ordenação. |
| `FormField`                                                              | Rótulo associado por `id`, indicação de obrigatório, metadado e orientação opcionais. Associe a orientação ao controle com `aria-describedby`.                                       |
| `FormSection`, `FormLayout`, `FormFooter`, `FormSummary`, `MediaChoices` | Composições extraídas dos cadastros aprovados. Mantêm seções, resumo, validação, seleção e ações responsivas.                                                                        |
| `useFormValidation`                                                      | Erros locais e foco no primeiro campo inválido; sem envio ou persistência.                                                                                                           |
| `useToast`, `ToastViewport`, `ToastCard`                                 | Avisos compactos de informação, sucesso, atenção e erro. Mensagem obrigatória, título e ação opcionais. `fallbackFocusId` é configurado pelo consumidor.                             |

As interfaces completas e os tipos auxiliares estão em `index.ts` e nas implementações. Props de componentes nativos preservam atributos acessíveis e handlers do React.

## Fontes de verdade

- `theme.module.css`: cores, papéis tipográficos, pesos, espaçamento, raios, foco e movimento.
- `font.ts`: Inter local 400/500/600 e a variável de família.
- `controls.tsx`, `button.tsx`, `selection.tsx`, `tabs.tsx`, `status.tsx`, `patterns.tsx`, `data-table.tsx`, `forms.tsx`, `toasts.tsx`: implementações compartilhadas.
- `src/app/design-system-v2`: documentação visual e exemplos em memória. Não é uma segunda implementação dos componentes.

As fachadas `dashboardv2/controls.tsx`, `creation-ui.tsx` e `toasts.tsx` preservam os imports existentes. O adaptador de status mantém o mapeamento de estados na aplicação. As definições de tabela por domínio ficam em `dashboardv2/record-table-model.ts`; a biblioteca renderiza as colunas, mas não filtra nem ordena os dados por conta própria. O toggle de campanha também mantém sua regra de habilitação no adaptador da aplicação.

## Comportamento e acessibilidade

- Botões secundários usam peso 500 e principais 600, sem override global de peso.
- Dropdowns e calendários ficam no escopo do tema. Escape e seleção devolvem o foco ao controle.
- Erros identificam o campo; o formulário preserva o preenchimento.
- Tabelas têm caption, cabeçalhos semânticos, `aria-sort` e rolagem própria. `onSort` só comunica a intenção ao consumidor.
- Toasts simples duram 6 segundos; hover, foco e aba oculta pausam a contagem. Atenção, erro e ação exigem dispensa explícita. Escape restaura o foco quando necessário.
- Animações respeitam movimento reduzido. Estado nunca depende só de cor.

## Limites

Somente frontend em `apps/design-system`. O pacote `@mediaon/ui`, aplicações oficiais, backend, autenticação, credenciais e banco permanecem fora desta entrega. Esta biblioteca ainda não foi publicada como pacote nem integrada ao produto oficial. O inventário diferencia primitivas compartilhadas de composições demonstrativas. Consultar a seção de revisão contínua abaixo para a cobertura atual e seus limites.

Antes de ampliar a biblioteca, ler `src/app/dashboardv2/DESIGN-NOTES.md`. Reutilizar os componentes existentes e documentar apenas variantes com necessidade concreta. A separação dos contextos de tabela permanece parte do contrato.

## Verificação

Os testes existentes do Dashboard V2 exercitam as implementações extraídas. `library.test.tsx` verifica o contrato público fora da rota: botões em formulário, carregamento, seleção e retorno de foco, switch, associação de erro, tabelas e abas. `catalog.test.tsx` verifica links diretos, busca e cadastro de exemplo.

Validação desta entrega: `pnpm lint`, `pnpm typecheck` e `pnpm test` passaram no monorepo (175 testes na aplicação isolada). O build isolado também passou. O build geral foi executado com `SKIP_ENV_VALIDATION=1`, mas o Turbopack da Vitrine encontrou a restrição de abertura de porta do ambiente (`Operation not permitted`), cancelando as tarefas paralelas.

Conferência visual em 1280px e 390px: biblioteca, dropdown com teclado e retorno de foco, tabelas com rolagem interna, botões com pesos 600/500, aviso compacto com fechamento e retorno ao gatilho, e regressão visual em Importações. [Captura do catálogo](../../../references/mediaon-design-system-v2.png).

Consulta ao catálogo 21st apenas para metadados de navegação/documentação: [SidebarShowcase](https://21st.dev/@ruixen.ui/components/sidebar-showcase). Nenhum código externo ou dependência foi instalado. O CLI 21st não está disponível neste ambiente; a revisão usa testes, código e navegador.

## Inventário para revisão contínua — 30/09/2026

O catálogo passou a consumir o inventário canônico de `src/app/inventory.ts`: **126 referências em 12 famílias**, todas com exemplo navegável. Isso representa cobertura visual do inventário, não 126 componentes publicados ou aprovados. A identidade do Dashboard V2 continua sendo a base; os exemplos adicionados estão abertos à revisão do usuário.

- `catalog.tsx`: navegação por família, busca normalizada, links diretos, histórico, menu móvel e revisão individual.
- `registry.ts`: classificação entre fundamento, componente, composição e template; orientações, limites e receitas.
- `*-specimens.tsx`: exemplos específicos de formulários, ações, navegação, estrutura, dados, gráficos, feedback, camadas, mídia, fluxos comerciais e templates.
- Cada item oferece **Exemplo**, **Uso e estados** e **Minha revisão**, além de anterior/próximo. Notas e marcações voluntárias ficam em `localStorage` neste navegador; não alteram o componente nem são enviadas a terceiros. Uma marcação de revisão não implica aprovação global do design system.
- Os aliases `#campos`, `#tabelas`, `#formularios`, `#selecao`, `#navegacao` e `#feedback` continuam funcionando.

### Novas primitivas compartilhadas

| Exportação      | Contrato                                                                                                                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PasswordInput` | Props de `Input`, preservando valor ao alternar mostrar/ocultar.                                                                                                                                     |
| `Combobox`      | `label`, `options`, `value: string[]`, `onChange`; seleção simples ou `multiple`, busca, teclado, opções desabilitadas e remoção individual dentro do campo.                                         |
| `Dialog`        | `open`, `onClose`, `title`, descrição, conteúdo e rodapé; `kind`: modal, drawer, sheet ou responsive; `density`: default ou compact. Usa diálogo nativo, foco contido, Escape e restauração de foco. |
| `Popover`       | Gatilho, rótulo e conteúdo contextual com Radix. Portal permanece no tema ou no diálogo que o contém.                                                                                                |
| `Tooltip`       | Ajuda curta por hover ou foco, dispensável com Escape.                                                                                                                                               |

`IconButton` também aceita as variantes de `Button`. Colunas de `DataTable` podem definir `header` para controles como selecionar todas as linhas; `label` permanece texto para a ordenação acessível.

### Limites explícitos da cobertura

As composições demonstram os padrões visualmente e em memória: wizard, kanban com movimentação local, revisão comercial, PI com assinatura simulada, cálculo ilustrativo de desconto, mapeamento de CSV simples, papéis, editor de blocos e preferências. Não executam regras de autorização, assinatura, upload, envio de e-mail, compra ou qualquer integração real.

Tema escuro, abertura de prévia apenas por hover, menu contextual posicionado no cursor e parsing completo de CSV não estão implementados; os respectivos exemplos explicam seu alcance. Gráficos usam SVG, legendas acionáveis e tabelas de valores. Arquivos usam URLs locais revogadas ao trocar ou remover a seleção. Nenhuma dependência foi adicionada nesta ampliação.

### Ajustes posteriores

Preservar IDs e links durante a revisão. Alterar a implementação compartilhada quando o ajuste for do controle; alterar o `specimen` quando for da composição. Não reconstruir a biblioteca nem substituir a identidade aprovada a cada ajuste pontual. O usuário informou explicitamente que passará por cada parte e fará novas rodadas de ajustes.

### Verificação desta ampliação

- `pnpm lint`, `pnpm typecheck` e `pnpm test` passaram no monorepo. A aplicação isolada tem 182 testes em 18 arquivos; o catálogo também percorre as 126 referências e cobre busca, histórico, revisão persistida, wizard e ação em lote. Os controles novos verificam senha, seleção por teclado e fechamento/restauração de foco do diálogo.
- `pnpm --filter @mediaon/design-system build` passou. O build geral continua interrompido pela restrição de abertura de porta do Turbopack ao processar CSS da Vitrine (`Operation not permitted`); não representa validação completa do build do monorepo.
- Um teste preexistente de criação excedeu 15 s durante execução concorrente com build. Passou na repetição isolada e na repetição completa, sem alterar teste ou timeout.
- Conferência no navegador em desktop e celular: navegação, busca por família, estado de erro, seleção múltipla sem recorte da camada, diálogo responsivo/Escape, wizard, legenda do gráfico e preservação do Dashboard V2. A prévia móvel conferida não apresentou overflow horizontal da página.
- O catálogo 21st foi consultado como referência; nenhum componente externo foi incorporado. `21st review` não executou porque o CLI não está instalado. A revisão foi feita com código, testes e navegador.
- Captura: [Inventário ampliado](../../../references/mediaon-design-system-v2-inventario.png).

## Refinamento com referências do usuário

Mapeamento dos 12 prints, decisões e limites: [Referências aplicadas](../../app/design-system-v2/REFERENCES.md). Os novos exemplos permanecem em revisão; não substituem a aprovação da base visual por uma aprovação de todos os itens.

| Exportação     | Contrato                                                                                                                                                       |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Avatar`       | Nome acessível, imagem opcional com fallback, tamanhos 24/32/40/48, forma circular/quadrada, tonalidade, presença, verificação, contagem ou carregamento.      |
| `AvatarGroup`  | Pessoas, tamanho e máximo visível. O excedente expõe a quantidade e os nomes.                                                                                  |
| `Stepper`      | Lista de etapas, índice atual, orientação horizontal/vertical e retorno opcional às concluídas. Validação fica no consumidor.                                  |
| `Timeline`     | Marcos cronológicos com ícone, conector, data, descrição e autoria. Os estados distinguem o que foi concluído, o marco atual e o que ainda virá.               |
| `ChoiceCard`   | Input nativo radio/checkbox com título, descrição, miniatura e conteúdo. Valores, seleção e desabilitação seguem as props nativas. Exemplos no wizard e modal. |
| `FileDropzone` | Seleção múltipla ou simples por botão/arraste, `accept`, orientação e callback com arquivos. Validação e envio ficam no consumidor.                            |
| `FileItem`     | Nome, tamanho, estado, progresso, mensagem e callbacks opcionais para remover, cancelar, retomar e abrir prévia. Não executa envio.                            |

`Status` aceita `variant="soft"` para etiquetas; o padrão `dot` permanece igual. `Popover` aceita `open` e `onOpenChange` opcionais. O cadastro direciona o foco ao título da etapa ao avançar/voltar e mantém o preenchimento. O modo de seleção visual é compartilhado com o modal de aparência.

Verificação desta rodada: lint, tipos e testes do monorepo passaram (191 testes em 19 arquivos na aplicação isolada). O build isolado passou; o build geral permanece limitado pela restrição de porta da Vitrine. Detalhes da conferência visual e captura estão no documento de referências acima.

### Agenda, contexto e configurações

A segunda rodada de prints acrescenta primitivas sem alterar a identidade aprovada:

| Exportação           | Contrato                                                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `MonthCalendar`      | `selected`, `onSelect`, `month`, `onMonthChange` e `eventDates` opcionais. Mês controlado, locale pt-BR, navegação por teclado e marcação acessível de dias com eventos. |
| `InlineAlert`        | `title`, conteúdo, `tone`, `actions`, `onDismiss` e `placement` (`inline`, `section`, `banner`). Aviso contextual; não possui temporizador nem substitui o toast.        |
| `EmptyState`         | Estado vazio ou falha estrutural com `placement` (`table`, `section`, `page`), ícone, texto, metadado e ações. A escala acompanha a região substituída.                  |
| `SettingsSection`    | Título, descrição opcional e controles. Duas colunas no desktop, uma no celular.                                                                                         |
| `SwitchField`        | Props de `Switch`, com rótulo e descrição visíveis. `variant="surface"` cria uma preferência destacada; `variant="inline"` integra o controle a formulários compactos.   |
| `Dialog size="wide"` | Largura ampliada opcional, usada para detalhe com histórico. `kind` e tamanho padrão preservados.                                                                        |

A agenda oferece visualizações interativas de mês, semana, dia e lista, com criação e edição em um `Dialog density="compact"`. Os convites, planos, detalhes e configurações são consumidores do catálogo. Não são APIs de domínio da biblioteca. Ver [a segunda rodada de referências](../../app/design-system-v2/REFERENCES.md).

## Ajustes de Minha revisão

As 25 notas do usuário receberam ajustes no catálogo e na biblioteca. [Mapa por item](../../app/design-system-v2/REVISAO-2026-09-30.md).

- `Button`: variantes `primary`, `secondary`, `ghost`, `soft`, `danger` e `danger-ghost`; tamanhos `small`, `default` e `large`. A variante destrutiva exige contexto no consumidor, sem impor confirmação para toda ação.
- `ActionMenu`: menus acionados por três pontos usam `simple`, exibindo somente ícone e rótulo. Cabeçalho, descrição, atalho e texto auxiliar ficam reservados a menus de conta ou contextos explícitos; setas, Home/End, Escape e retorno ao gatilho permanecem disponíveis. `Popover` resolve o contêiner após montagem e preserva o tema.
- `LinkAction`: âncora com ícone inicial e/ou final; preserva atributos de navegação e download.
- `NumberInput`: valor controlado, limites aplicados também à digitação, incremento e decremento; largura calculada pelo maior valor, limitada visualmente a oito dígitos, e entrada numérica em teclados móveis.
- `Slider`: input range compacto com trilho preenchido, thumb responsivo e foco visível; o consumidor organiza título, valor atual, limites e estimativa com hierarquia tipográfica clara. Teclado nativo e `aria-valuetext` permanecem definidos pelo consumidor.
- `ColorPicker`: paleta compacta, nome da seleção, preview acionável e hexadecimal validado na mesma superfície. Não substitui os tokens semânticos da interface.
- `VerificationCode`: entrada segmentada, quantidade configurável, colagem do código completo, filtragem numérica e navegação por setas, Home e End.
- `SearchField`: resultados com busca sem acentos, seleção por setas/Enter, bloqueios, vazio e Escape.
- `Checkbox`: estado `indeterminate`, seleção e teclado nativos com desenho próprio; linha compacta de 24 px e agrupamentos com intervalo de 2 px.
- `SwitchField`: compõe título, descrição, estado textual opcional e switch em uma superfície compacta; mantém foco, hover e bloqueio perceptíveis.
- `FileDropzone`: variante `compact` para contextos auxiliares; validação continua no consumidor.

Rótulo, entrada e ajuda usam 2 px de intervalo. Dinheiro tem máscara brasileira durante a digitação, números tabulares e leitura contínua entre `R$` e preço em uma largura compacta. A galeria, o vídeo e a revisão comercial são composições em memória; não constituem serviços de mídia ou integrações reais.
