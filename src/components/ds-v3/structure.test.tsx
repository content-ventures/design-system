/**
 * `PageHeader back` e `PageHeader actionsNote` (estrutura.tsx): a volta discreta antes do título — o
 * caminho de volta numa tela sem o menu do app — e o motivo visível de uma ação indisponível, logo
 * antes das ações. O jsdom não calcula CSS: o que depende da largura (só a seta e o motivo na linha
 * dele em ≤640) é conferido no texto do CSS, decidido por container query, igual no servidor.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './button';
import { Stepper, type StepItem } from './stepper';
import { PageHeader } from './structure';

const css = readFileSync(resolve(__dirname, 'structure.module.css'), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
);

/** O bloco de uma container query (até a próxima `@container` ou o fim). */
function containerBlock(query: string) {
  const start = css.indexOf(query);
  const next = css.indexOf('@container', start + query.length);
  return css.slice(start, next < 0 ? undefined : next);
}

const STEPS: StepItem[] = [
  { id: 'material', label: 'Material', state: 'done' },
  { id: 'artigo', label: 'Artigo' },
  { id: 'aprovacao', label: 'Aprovação', state: 'blocked' },
];

const REASON = 'Aguarde a IA terminar.';

describe('PageHeader back', () => {
  it('link antes do título, fora do h1, com nome “Voltar para …”', () => {
    const { container } = render(
      <PageHeader
        variant="frame"
        title="Estúdio Norte: impressão 3D no protótipo"
        back={{ label: 'Produções', href: '/productions' }}
      />,
    );
    const link = screen.getByRole('link', { name: 'Voltar para Produções' });
    expect(link).toHaveAttribute('href', '/productions');
    expect(link).toHaveTextContent('Produções');
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).not.toContainElement(link);
    // Ordem de leitura e de tabulação: a volta, depois o título.
    const text = container.querySelector('[data-part="page-header"] > div > div');
    expect(text).toHaveAttribute('data-back', 'true');
    expect(text?.firstElementChild).toBe(link);
    expect(link.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('`onNavigate` recebe o clique (navegação do cliente, guarda de saída)', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <PageHeader
        title="Casa Forma"
        back={{ label: 'Aprovações', href: '/approvals', onNavigate }}
      />,
    );
    await user.click(screen.getByRole('link', { name: 'Voltar para Aprovações' }));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('sem `back`, nada muda (nenhum link, nenhuma coluna a mais)', () => {
    const { container } = render(<PageHeader title="Produções" />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(container.querySelector('[data-back]')).toBeNull();
  });

  it('servidor: a volta já sai no HTML, com a seta escondida do leitor de tela', () => {
    const html = renderToString(
      <PageHeader variant="frame" title="Ateliê Sul" back={{ label: 'Produções', href: '/p' }} />,
    );
    const host = document.createElement('div');
    host.innerHTML = html;
    const link = host.querySelector('[data-part="page-header-back"]');
    expect(link).toHaveAttribute('aria-label', 'Voltar para Produções');
    expect(link?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('o CSS: discreta (fantasma), centrada na linha do título e só a seta em ≤640', () => {
    expect(css).toMatch(/\.phBack \{[^}]*color: var\(--muted\);/);
    expect(css).toMatch(
      /\.phBack:is\(:hover, \[data-force~='hover'\]\) \{[^}]*background: var\(--paper-hover\);/,
    );
    expect(css).toMatch(
      /\.phText\[data-back\] > \.phBack \{[^}]*margin-block: calc\(\(var\(--ph-title-lh\) - var\(--h-sm\)\) \/ 2\);/,
    );
    const phone = containerBlock('@container dsv3-page-header (max-width: 640px)');
    expect(phone).toMatch(/\.phBack \{[^}]*width: var\(--h-sm\);[^}]*padding: 0;/);
    expect(phone).toMatch(/\.phBackText \{[^}]*clip-path: inset\(50%\);/);
  });
});

describe('PageHeader actionsNote', () => {
  it('motivo visível logo antes das ações, com o id que o botão indisponível aponta', () => {
    render(
      <PageHeader
        variant="frame"
        title="Ateliê Sul"
        actionsNote={{ id: 'motivo-enviar', text: REASON }}
        actions={
          <Button size="sm" variant="primary" aria-disabled="true" aria-describedby="motivo-enviar">
            Enviar para aprovação
          </Button>
        }
      />,
    );
    const button = screen.getByRole('button', { name: 'Enviar para aprovação' });
    expect(button).toHaveAccessibleDescription(REASON);
    const note = document.getElementById('motivo-enviar');
    expect(note).toHaveTextContent(REASON);
    expect(note).toHaveAttribute('data-part', 'page-header-note');
    // Na mesma caixa das ações, antes do botão: lido antes dele e nunca separado dele.
    expect(note?.nextElementSibling).toBe(button);
  });

  it('com régua de etapas: título, régua, motivo e ações nessa ordem', () => {
    const { container } = render(
      <PageHeader
        variant="frame"
        title="Grupo Horizonte"
        steps={<Stepper label="Etapas da produção" steps={STEPS} current={1} size="sm" />}
        actionsNote={{ id: 'motivo', text: REASON }}
        actions={<Button size="sm">Enviar para aprovação</Button>}
      />,
    );
    const main = container.querySelector('[data-part="page-header"] > div');
    expect(main).toHaveAttribute('data-actions', 'true');
    const parts = Array.from(main?.children ?? []).map(
      (child) => child.getAttribute('data-part') ?? child.textContent,
    );
    expect(parts[1]).toBe('page-header-steps');
    expect(parts[2]).toBe(`${REASON}Enviar para aprovação`);
  });

  it('o motivo sozinho (o botão mora noutra barra no celular) ainda ocupa a linha das ações', () => {
    const { container } = render(
      <PageHeader title="Produções" actionsNote={{ id: 'n', text: REASON }} />,
    );
    expect(container.querySelector('[data-part="page-header"] > div')).toHaveAttribute(
      'data-actions',
      'true',
    );
    expect(screen.getByText(REASON)).toBeInTheDocument();
  });

  it('o CSS: 12 px em `--muted`, uma linha que corta; em ≤640 desce para a linha dele e quebra', () => {
    expect(css).toMatch(/\.phNote \{[^}]*font: var\(--t-small\);[^}]*color: var\(--muted\);/);
    expect(css).toMatch(/\.phNote \{[^}]*white-space: nowrap;[^}]*text-overflow: ellipsis;/);
    // Na linha de etapas, as ações com motivo cedem antes do título (que cede 1000×).
    expect(css).toMatch(
      /\.ph\[data-variant='frame'\] \.phMain\[data-steps\] \.phActions:has\(> \.phNote\) \{\s*flex: 0 100000 auto;/,
    );
    const phone = containerBlock('@container dsv3-page-header (max-width: 640px)');
    expect(phone).toMatch(/\.phNote \{[^}]*flex: 1 1 100%;[^}]*white-space: normal;/);
    // A principal estica no celular — a primeira ação, não o motivo.
    expect(phone).toMatch(
      /\.phActions > :first-child:not\(\.phNote\),\s*\.phActions > \.phNote \+ \* \{/,
    );
  });
});

describe('PageHeader frame sem `steps`', () => {
  it('o CSS: uma linha só; o título corta antes das ações, que não encolhem', () => {
    const wide = containerBlock('@container dsv3-page-header (min-width: 641px)');
    expect(wide).toMatch(/\.phMain:not\(\[data-steps\]\) \{[^}]*display: flex;/);
    expect(wide).toMatch(/\.phMain:not\(\[data-steps\]\) \.phText \{[^}]*flex: 0 1000 auto;/);
    expect(wide).toMatch(
      /\.phMain:not\(\[data-steps\]\) \.phTitle \{[^}]*min-width: min\(10rem, 40cqi\);/,
    );
    expect(wide).toMatch(
      /\.phMain:not\(\[data-steps\]\) :is\(\.phActions, \.phMore\) \{\s*flex: none;/,
    );
    // O celular continua com o arranjo dele (título e ⋯ em cima, ações embaixo).
    expect(containerBlock('@container dsv3-page-header (max-width: 640px)')).toMatch(/'text more'/);
  });
});
