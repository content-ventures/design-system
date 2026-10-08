/**
 * `Prose`: casca de leitura em volta de HTML arbitrário (ou do `EditorContent`). Repassa atributos,
 * marca variante/tamanho/medida em `data-*`, nomeia a região e mantém o cabeçalho fora do ritmo do
 * texto. O conteúdo continua navegável por teclado (links do texto entram na ordem de foco).
 * O contrato dos ganchos visuais (o jsdom não calcula CSS) é conferido no texto do CSS: citação que
 * não bate, marcador da IA só na escrita, glifos do lucide, respiro do fim, figura sem arquivo,
 * espaço para a barra flutuante e nenhum fio lateral.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Prose } from './prose';
import { proseWidgets } from './prose-widgets';

// Raiz do projeto (o vitest roda dela); no jsdom, `import.meta.url` não é um caminho de arquivo.
const ROOT = process.cwd();
const CSS = readFileSync(join(ROOT, 'src/components/ds-v3/prose.module.css'), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
);

/** Regras folha (`seletor { declarações }`), inclusive as de dentro de @media/@container. */
function rules(css: string) {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector = '', body = '']) => ({
    selector: selector.replace(/\s+/g, ' ').trim(),
    body,
  }));
}

/** Traços de um ícone do lucide (o que `icons.ts` exporta), lidos do pacote instalado. */
function lucideShapes(file: string) {
  const entry = createRequire(join(ROOT, 'package.json')).resolve('lucide-react');
  const source = readFileSync(join(dirname(entry), '../esm/icons', file), 'utf8');
  return [...source.matchAll(/\[\s*"(path|line)",\s*\{([^}]*)\}/g)].map(([, tag, attrs = '']) => {
    const pairs = [...attrs.matchAll(/(\w+): "([^"]*)"/g)].filter(([, name]) => name !== 'key');
    return { tag, attrs: pairs.map(([, name, value]) => `${name}='${value}'`) };
  });
}

/** O SVG de um glifo-máscara declarado como `--p-glyph-*: url("data:image/svg+xml,…")`. */
function glyph(name: string) {
  const match = CSS.match(new RegExp(`--p-glyph-${name}: url\\("data:image/svg\\+xml,([^"]+)"\\)`));
  return match?.[1] ? decodeURIComponent(match[1]) : '';
}

describe('Prose', () => {
  it('marca variante, tamanho, medida e alinhamento e repassa className e props', () => {
    const { container } = render(
      <Prose variant="read" size="lg" measure="wide" align="start" className="extra" id="texto">
        <p>Corpo</p>
      </Prose>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('id', 'texto');
    expect(root.className).toContain('extra');
    expect(root).toHaveAttribute('data-variant', 'read');
    expect(root).toHaveAttribute('data-size', 'lg');
    expect(root).toHaveAttribute('data-measure', 'wide');
    expect(root).toHaveAttribute('data-align', 'start');
  });

  it('usa os padrões de escrita e ignora o tamanho no compacto', () => {
    const { container, rerender } = render(<Prose>texto</Prose>);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-variant', 'edit');
    expect(root).toHaveAttribute('data-size', 'md');
    expect(root).toHaveAttribute('data-measure', 'article');
    expect(root).toHaveAttribute('data-align', 'center');
    expect(root).toHaveAttribute('data-overscroll', '');

    rerender(
      <Prose variant="compact" size="lg">
        texto
      </Prose>,
    );
    expect(root).toHaveAttribute('data-variant', 'compact');
    expect(root).not.toHaveAttribute('data-size');
    expect(root).not.toHaveAttribute('data-overscroll');
  });

  it('rola além do fim só na escrita, salvo quando desligado ou pedido', () => {
    const { container, rerender } = render(
      <Prose variant="edit" overscroll={false}>
        texto
      </Prose>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).not.toHaveAttribute('data-overscroll');
    rerender(
      <Prose variant="read" overscroll>
        texto
      </Prose>,
    );
    expect(root).toHaveAttribute('data-overscroll', '');
  });

  it('escala de trabalho (sm): marca o tamanho e troca toda a escala pelos tokens --t-prose-*-sm', () => {
    const { container, rerender } = render(
      <Prose variant="edit" size="sm">
        <p>Corpo</p>
      </Prose>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-size', 'sm');
    rerender(
      <Prose variant="read" size="sm">
        <p>Corpo</p>
      </Prose>,
    );
    expect(root).toHaveAttribute('data-size', 'sm');

    const theme = readFileSync(join(ROOT, 'src/components/ds-v3/theme.module.css'), 'utf8');
    const sm = rules(CSS).find((rule) => rule.selector === ".prose[data-size='sm']")?.body ?? '';
    for (const [role, token] of [
      ['body', 'body'],
      ['lead', 'lead'],
      ['h1', 'title'],
      ['h2', 'h2'],
      ['h3', 'h3'],
      ['quote', 'quote'],
    ] as const) {
      expect(sm).toContain(`--p-${role}: var(--t-prose-${token}-sm)`);
      expect(theme).toMatch(new RegExp(`--t-prose-${token}-sm:`));
    }
    // Corpo 15/25: um degrau abaixo do md (16/28), ainda acima da escala da interface (13/20).
    expect(theme).toMatch(/--t-prose-body-sm: 400 15px\/25px/);
    // Na escrita, o respiro em volta também diminui.
    expect(
      rules(CSS).some(
        (rule) =>
          rule.selector === ".prose[data-size='sm'][data-variant='edit']" &&
          rule.body.includes('--p-pad-x'),
      ),
    ).toBe(true);
  });

  it('vira região nomeada com label; como article mantém o papel nativo', () => {
    const { rerender } = render(
      <Prose label="Texto do artigo">
        <p>Corpo</p>
      </Prose>,
    );
    expect(screen.getByRole('region', { name: 'Texto do artigo' })).toBeInTheDocument();

    rerender(
      <Prose as="article" label="Texto final">
        <h1>Ateliê Sul mira a Europa</h1>
      </Prose>,
    );
    const article = screen.getByRole('article', { name: 'Texto final' });
    expect(article.tagName).toBe('ARTICLE');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Ateliê Sul mira a Europa' }),
    ).toBeVisible();
  });

  it('põe o cabeçalho antes do texto, fora do bloco que recebe a tipografia', () => {
    render(
      <Prose header={<span data-testid="cabecalho">Título</span>}>
        <p data-testid="corpo">Corpo</p>
      </Prose>,
    );
    const header = screen.getByTestId('cabecalho');
    const body = screen.getByTestId('corpo');
    expect(header.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(header.parentElement?.contains(body)).toBe(false);
  });

  it('preserva os ganchos do conteúdo e deixa os links na ordem de foco', async () => {
    const user = userEvent.setup();
    render(
      <Prose variant="read">
        <p data-ai="unreviewed">Texto da IA</p>
        <p>
          <span data-source-active="">
            Fonte <mark data-tone="green">marcada</mark> com{' '}
            <a href="#observatorio">Observatório do Calçado</a>
          </span>
        </p>
        <p>
          <del>6 mil</del>
          <ins>8 mil</ins>
        </p>
      </Prose>,
    );
    expect(screen.getByText('Texto da IA')).toHaveAttribute('data-ai', 'unreviewed');
    expect(screen.getByText('marcada')).toHaveAttribute('data-tone', 'green');
    expect(screen.getByText('marcada').parentElement).toHaveAttribute('data-source-active', '');
    expect(screen.getByText('8 mil').tagName).toBe('INS');

    await user.tab();
    expect(screen.getByRole('link', { name: 'Observatório do Calçado' })).toHaveFocus();
  });
});

describe('Prose: ganchos visuais (contrato do CSS)', () => {
  const all = rules(CSS);

  it('citação que não bate: ondulado vermelho e “Falta:” para leitor de tela; “usada” sem estilo', () => {
    const missing = all.find(
      (rule) =>
        rule.selector.includes("[data-source-state='missing']") && !rule.selector.includes('::'),
    );
    expect(missing?.body).toMatch(/text-decoration:\s*underline wavy [^;]*var\(--red-dot\)/);
    const label = all.find(
      (rule) => rule.selector === ".flow :where([data-source-state='missing'])::before",
    );
    expect(label?.body).toContain("content: 'Falta: '");
    expect(CSS).not.toMatch(/data-source-state='used'/);
  });

  it('marcador da IA e marcador clicável só na escrita; fora dela o botão some', () => {
    const drawn = all.filter(
      (rule) =>
        /\[data-ai(='unreviewed'|='writing'|-marker)/.test(rule.selector) &&
        /content:|text-decoration:/.test(rule.body) &&
        !/content: none/.test(rule.body),
    );
    expect(drawn.length).toBeGreaterThan(0);
    for (const rule of drawn) expect(rule.selector).toContain(".prose[data-variant='edit']");
    const hidden = all.find((rule) => rule.selector === '.flow [data-ai-marker]');
    expect(hidden?.body).toMatch(/display:\s*none/);
  });

  it('marcador da IA é o Sparkles de 12 px por máscara (sem ponto) e a figura usa o ImageOff', () => {
    expect(CSS).toMatch(/--p-marker:\s*var\(--icon-xs\)/);
    expect(CSS).not.toMatch(/--p-dot/);
    const sparkles = glyph('ai');
    const imageOff = glyph('image-off');
    for (const [svg, file] of [
      [sparkles, 'sparkles.js'],
      [imageOff, 'image-off.js'],
    ] as const) {
      const shapes = lucideShapes(file);
      expect(shapes.length).toBeGreaterThan(0);
      for (const shape of shapes) expect(svg).toContain(`<${shape.tag} ${shape.attrs.join(' ')}`);
    }
    const marker = all.find((rule) => rule.selector.includes('[data-ai-marker]::before'));
    expect(marker?.body).toMatch(/mask: var\(--p-glyph-ai\)/);
  });

  it('nenhum fio lateral (marcadores, citação e figura são desenhados sem borda de um lado só)', () => {
    expect(CSS).not.toMatch(
      /border-(left|right|inline-start|inline-end)(-width|-color|-style)?\s*:/,
    );
  });

  it('escrita tem respiro no fim para o último bloco subir ao terço superior', () => {
    const tail = all.find((rule) => rule.selector === '.prose[data-overscroll]');
    expect(tail?.body).toMatch(/--p-tail:\s*60svh/);
    const column = all.find((rule) => rule.selector === '.column');
    expect(column?.body).toContain('max(var(--p-pad-bottom), var(--p-tail))');
  });

  it('figura sem arquivo vira moldura com “Imagem indisponível”; carregando pulsa', () => {
    expect(CSS).toContain("content: 'Imagem indisponível'");
    const frame = all.find((rule) =>
      rule.selector.includes(':where(img:is([data-missing], [data-loading]:not([src])))'),
    );
    expect(frame?.body).toMatch(/opacity:\s*0/);
    const loading = all.find((rule) =>
      rule.selector.includes('figure:has(> img[data-loading]:not([src])))::before'),
    );
    expect(loading?.body).toMatch(/animation: pulse/);
    expect(CSS).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
  });

  it('imagem sugerida (`figure[data-slot]`) troca o rótulo e o glifo da moldura; o pedido fica em `--muted`', () => {
    const slot = all.find((rule) =>
      rule.selector.includes('figure[data-slot]:has(> img[data-missing]))::after'),
    );
    expect(slot?.body).toContain("content: 'Imagem sugerida'");
    expect(slot?.body).toMatch(/mask:\s*var\(--p-glyph-image-plus\)/);
    const shapes = lucideShapes('image-plus.js');
    expect(shapes.length).toBeGreaterThan(0);
    for (const shape of shapes)
      expect(glyph('image-plus')).toContain(`<${shape.tag} ${shape.attrs.join(' ')}`);
    const caption = all.find(
      (rule) => rule.selector === '.flow :where(figure[data-slot] > figcaption)',
    );
    expect(caption?.body).toMatch(/color:\s*var\(--muted\)/);
    const pointer = all.find((rule) =>
      rule.selector.includes("[data-variant='edit'] .flow :where(figure[data-slot])"),
    );
    expect(pointer?.body).toMatch(/cursor:\s*pointer/);
    // Na escrita, a moldura diz como preencher; na leitura, é uma faixa baixa na largura da coluna.
    const action = all.find(
      (rule) =>
        rule.selector.startsWith(".prose[data-variant='edit']") &&
        rule.selector.endsWith('figure[data-slot]:has(> img[data-missing]))::after'),
    );
    expect(action?.body).toContain('Arraste a imagem aqui ou clique para escolher');
    expect(action?.body).toMatch(/white-space:\s*pre-line/);
    const band = all.find(
      (rule) =>
        rule.selector.includes("[data-variant='read'], [data-variant='compact']") &&
        rule.selector.includes('> :where(img[data-missing])'),
    );
    expect(band?.body).toMatch(/aspect-ratio:\s*3 \/ 1/);
    expect(band?.body).toMatch(/width:\s*100%/);
  });

  it('figura de tamanho conhecido abraça a imagem no centro da coluna; a legenda quebra na largura dela', () => {
    const sized = all.find(
      (rule) => rule.selector === '.flow :where(figure:has(> img[width][height]))',
    );
    expect(sized?.body).toMatch(/width:\s*fit-content/);
    expect(sized?.body).toMatch(/max-width:\s*100%/);
    expect(sized?.body).toMatch(/margin-inline:\s*auto/);
    const caption = all.find(
      (rule) => rule.selector === '.flow :where(figure:has(> img[width][height]) > figcaption)',
    );
    expect(caption?.body).toMatch(/contain:\s*inline-size/);
  });

  it('imagem sugerida em linha (`data-display="line"`): uma linha de 40 px com ImagePlus, “Imagem sugerida:” e o assunto', () => {
    const LINE = "figure[data-slot][data-display='line']";
    const rule = (selector: string) => all.find((entry) => entry.selector === selector);
    const row = rule(`.prose .flow ${LINE}`);
    expect(row?.body).toMatch(/display:\s*flex/);
    expect(row?.body).toMatch(/min-height:\s*var\(--s-10\)/);
    expect(row?.body).toMatch(/border:\s*1px solid var\(--line\)/);
    // A moldura sai: o `img` some, o `::after` (rótulo da moldura) também; o ícone é o `::before`.
    expect(rule(`.prose .flow ${LINE} > img`)?.body).toMatch(/display:\s*none/);
    expect(rule(`.prose .flow ${LINE}::after`)?.body).toMatch(/content:\s*none/);
    expect(rule(`.prose .flow ${LINE}::before`)?.body).toMatch(/mask: var\(--p-glyph-image-plus\)/);
    expect(rule(`.prose .flow ${LINE} > figcaption::before`)?.body).toContain(
      "content: 'Imagem sugerida: '",
    );
    expect(rule(`.prose .flow ${LINE} > figcaption:empty::before`)?.body).toContain(
      "content: 'Imagem sugerida'",
    );
    // No ritmo de um parágrafo, inclusive o bloco seguinte (menos intertítulo).
    const rhythm = all.find((entry) => entry.selector.includes(`+ ${LINE}`));
    expect(rhythm?.selector).toContain(`${LINE} + :where(:not(h1, h2, h3))`);
    expect(rhythm?.body).toMatch(/margin-top:\s*var\(--p-block\)/);
  });

  it('imagem sugerida em linha só é escolhível na escrita: hover, pressionado, arrasto e os gêmeos `data-force`', () => {
    const EDIT = ".prose[data-variant='edit'] .flow figure[data-slot][data-display='line']";
    const rule = (selector: string) => all.find((entry) => entry.selector === selector);
    expect(rule(EDIT)?.body).toMatch(/cursor:\s*pointer/);
    const hover = rule(`${EDIT}:is(:hover, [data-force~='hover'])`);
    expect(hover?.body).toMatch(/border-color:\s*var\(--choice-hover-line\)/);
    expect(hover?.body).toMatch(/background:\s*var\(--g-25\)/);
    expect(rule(`${EDIT}:is(:active, [data-force~='active'])`)?.body).toMatch(
      /background:\s*var\(--paper-sunken\)/,
    );
    // Tracejado só durante o arrasto (`[data-over]`), como no Dropzone.
    const over = rule(`${EDIT}:is([data-over], [data-force~='over'])`);
    expect(over?.body).toMatch(/border-style:\s*dashed/);
    expect(over?.body).toMatch(/border-color:\s*var\(--b-400\)/);
    expect(rule(`${EDIT}:is([data-over], [data-force~='over'])::before`)?.body).toMatch(
      /background:\s*var\(--b-600\)/,
    );
    // Fora da escrita nada responde ao ponteiro.
    const outside = all.filter(
      (entry) =>
        entry.selector.includes("[data-display='line']") &&
        /:hover|data-over|cursor/.test(entry.selector + entry.body) &&
        !entry.selector.startsWith(".prose[data-variant='edit']"),
    );
    expect(outside).toEqual([]);
  });

  it('imagem sugerida em linha: o assunto quebra em até duas linhas na figura real', () => {
    const { container } = render(
      <Prose variant="edit">
        <p>Antes.</p>
        <figure
          data-slot=""
          data-missing=""
          data-display="line"
          aria-roledescription="Sugestão de imagem"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- moldura vazia: o Prose desenha o pedido */}
          <img data-missing="" alt="" />
          <figcaption>Peças impressas na bancada</figcaption>
        </figure>
      </Prose>,
    );
    const figure = container.querySelector('figure[data-display="line"]');
    expect(figure).toHaveAttribute('aria-roledescription', 'Sugestão de imagem');
    expect(figure?.querySelector('figcaption')).toHaveTextContent('Peças impressas na bancada');
    const caption = all.find(
      (entry) =>
        entry.selector === ".prose .flow figure[data-slot][data-display='line'] > figcaption",
    );
    expect(caption?.body).toMatch(/-webkit-line-clamp:\s*2/);
    expect(caption?.body).toMatch(/font:\s*var\(--t-body\)/);
  });

  it('`data-bar-space="below"` abre embaixo do bloco o vão da barra flutuante, sem movimento reduzido', () => {
    const space = all.find((rule) => rule.selector === ".flow :where(*)[data-bar-space='below']");
    // Altura da FloatingToolbar (controle sm + padding 4 + fio) com 8 px de cada lado: só tokens.
    expect(space?.body).toMatch(
      /margin-bottom:\s*calc\(var\(--h-sm\) \+ 2 \* var\(--s-1\) \+ 2px \+ 2 \* var\(--s-2\)\)/,
    );
    expect(space?.body).toMatch(/transition: margin-bottom var\(--dur-2\)/);
    const still = all.find((rule) => rule.selector === '.flow :where(*)[data-bar-space]');
    expect(still?.body).toMatch(/transition:\s*none/);
  });

  it('no celular (≤ 560) a calha cabe na tela: glifo a 6 px da borda e do texto', () => {
    const narrow = CSS.slice(CSS.indexOf('@container prose (max-width: 560px)'));
    const column = rules(narrow).find(
      (rule) => rule.selector === ".prose[data-variant='edit'] .column",
    );
    expect(column?.body).toMatch(/--p-pad-x:\s*var\(--s-6\)/);
    expect(column?.body).toMatch(/--p-gutter:\s*var\(--s-3\)/);
  });

  it('cada widget da fábrica tem regra no Prose', () => {
    for (const kind of ['insertion', 'caret', 'skeleton']) {
      expect(CSS).toContain(`[data-prose-widget='${kind}']`);
    }
    expect(CSS).toContain('[data-ai-marker]');
    expect(CSS).toContain('[data-prose-sr]');
  });
});

describe('Prose + proseWidgets', () => {
  it('a inserção entra no parágrafo depois do trecho riscado e é lida como proposta', () => {
    render(
      <Prose variant="edit" label="Texto do artigo">
        <p data-testid="p">
          O pedido de <span data-suggestion="delete">6 mil</span> pares.
        </p>
      </Prose>,
    );
    const paragraph = screen.getByTestId('p');
    paragraph.querySelector('[data-suggestion="delete"]')?.after(proseWidgets.insertion('8 mil'));
    expect(paragraph).toHaveTextContent('O pedido de 6 milInserido: 8 mil pares.');
    expect(screen.getByRole('region', { name: 'Texto do artigo' })).toContainElement(
      paragraph.querySelector('[data-prose-widget="insertion"]') as HTMLElement,
    );
  });

  it('o marcador da calha é um botão com nome dentro do bloco da IA', async () => {
    const user = userEvent.setup();
    let activated = 0;
    render(
      <Prose variant="edit">
        <p data-ai="unreviewed" data-testid="ai">
          Texto da IA
        </p>
      </Prose>,
    );
    screen
      .getByTestId('ai')
      .prepend(proseWidgets.gutterMarker('ai', { onActivate: () => (activated += 1) }));
    await user.click(screen.getByRole('button', { name: 'Revisar texto da IA' }));
    expect(activated).toBe(1);
  });
});
