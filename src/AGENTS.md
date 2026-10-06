# DS V3 · instruções para agentes

- O contrato de uso dos componentes está em `components/ds-v3/README.md`. Leia antes de criar ou alterar um componente.
- Componente novo: implementação em `components/ds-v3`, exportação em `components/ds-v3/index.ts`, prancha no catálogo (`app/design-system-v3/specimens`) e teste ao lado do componente.
- Nada de cor solta, fonte ou ícone fora do tema: tokens de `components/ds-v3/theme.module.css`, Inter de `components/ds-v3/font.ts`, ícones de `components/ds-v3/icons.ts`.
- O catálogo deve consumir a mesma API pública usada pelos projetos (`@content-ventures/design-system/v3`); não crie uma implementação local para simular um componente ausente.
- Quando uma necessidade de uma aplicação ainda não existe aqui, a ordem é biblioteca → catálogo/teste → exportação → aplicação consumidora.
- Verificação mínima: `pnpm check`. Mudança visual também exige inspeção do catálogo em 1440×900 e 390×844.
