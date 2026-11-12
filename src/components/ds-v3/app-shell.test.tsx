/**
 * `AppShell`: gaveta ou barra decidida no CSS. O HTML do servidor já diz o modo (`data-layout`), a
 * gaveta forçada sai como gaveta desde a primeira pintura e o `@container shell` desenha a gaveta
 * fechada em `auto` — no celular, a barra nunca espreme a página antes de o JS medir.
 *
 * `NavItem.soon`: o item do roadmap aparece no menu, mas não navega — botão `aria-disabled`, selo
 * “Em breve”, motivo na dica do DS e na descrição; recolhido, a dica lateral diz nome, selo e motivo.
 *
 * Trilha do `TopBar` no celular: a volta é a trilha, então em ≤640 px ficam o primeiro nível e o
 * atual. O jsdom não avalia container query; o teste confere a estrutura em que o CSS se apoia.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileText, LayoutList, Newspaper, Radio } from 'lucide-react';
import { renderToString } from 'react-dom/server';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AppShell,
  Breadcrumb,
  Sidebar,
  SidebarAccount,
  SidebarItem,
  TopBar,
  useShell,
  type Crumb,
  NotificationsButton,
  ProductMark,
  type NavGroup,
} from './app-shell';

const css = readFileSync(resolve(__dirname, 'app-shell.module.css'), 'utf8');

const groups = [
  {
    id: 'producao',
    label: 'Produção',
    items: [{ id: 'producoes', label: 'Produções', href: '#' }],
  },
];

function shell(props: Partial<Parameters<typeof AppShell>[0]> = {}) {
  return (
    <AppShell sidebar={<Sidebar groups={groups} />} {...props}>
      <p>Conteúdo</p>
    </AppShell>
  );
}

const root = (html: string) => {
  const host = document.createElement('div');
  host.innerHTML = html;
  return host.querySelector('[data-part="shell"]') as HTMLElement;
};

describe('AppShell · gaveta decidida no CSS', () => {
  it('servidor: `auto` sai com o modo do CSS e sem gaveta medida', () => {
    const html = root(renderToString(shell()));
    expect(html).toHaveAttribute('data-layout', 'auto');
    expect(html).not.toHaveAttribute('data-drawer');
  });

  it('servidor: gaveta forçada já sai como gaveta', () => {
    const html = root(renderToString(shell({ layout: 'drawer', collapsed: true })));
    expect(html).toHaveAttribute('data-layout', 'drawer');
    expect(html).toHaveAttribute('data-drawer');
    // Recolhida não vale na gaveta.
    expect(html).not.toHaveAttribute('data-collapsed');
  });

  it('largura fora do padrão é medida no cliente', () => {
    const { container } = render(shell({ breakpoint: 960 }));
    expect(container.querySelector('[data-part="shell"]')).toHaveAttribute(
      'data-layout',
      'measured',
    );
  });

  it('o CSS desenha a gaveta fechada em `auto` até 1199 px', () => {
    const block = css.slice(css.indexOf('@container shell (max-width: 1199px)'));
    expect(block).toMatch(
      /\.shell\[data-layout='auto'\] \.frame \{\s*grid-template-columns: minmax\(0, 1fr\);/,
    );
    expect(block).toMatch(
      /\.shell\[data-layout='auto'\] \.sidebar \{[^}]*position: fixed;[^}]*visibility: hidden;/,
    );
    expect(block).toMatch(
      /\.shell\[data-layout='auto'\] \.topbar\[data-menu='auto'\] \.menuButton \{\s*display: inline-flex;/,
    );
  });
});

const REASON = 'Chega com a R2, junto da entrada de notícias.';

const ROADMAP: NavGroup[] = [
  {
    id: 'producao',
    label: 'Produção',
    items: [
      { id: 'producoes', label: 'Produções', icon: LayoutList, href: '#producoes', count: 3 },
    ],
  },
  {
    id: 'entrada',
    label: 'Entrada',
    collapsible: true,
    items: [
      {
        id: 'noticias',
        label: 'Notícias',
        icon: Newspaper,
        href: '#noticias',
        soon: { reason: REASON },
      },
      { id: 'canais', label: 'Canais', icon: Radio, href: '#canais', count: 4, soon: true },
    ],
  },
];

const nav = () => screen.getByRole('navigation', { name: 'Menu principal' });
const soonItem = (name: RegExp | string = /Notícias/) =>
  within(nav()).getByRole('button', { name });
const nativeTitles = () =>
  Array.from(document.querySelectorAll('[title]')).filter((node) => node.getAttribute('title'));

function roadmapShell(
  props: Partial<Parameters<typeof AppShell>[0]> = {},
  sidebar: Partial<Parameters<typeof Sidebar>[0]> = {},
) {
  return (
    <AppShell sidebar={<Sidebar groups={ROADMAP} {...sidebar} />} {...props}>
      <p>Conteúdo</p>
    </AppShell>
  );
}

describe('AppShell · imersivo (sem menu do app)', () => {
  it('servidor: nenhuma coluna de menu, nenhuma gaveta, nenhum véu — mesmo com `sidebar` e `collapsed`', () => {
    const html = root(renderToString(shell({ layout: 'immersive', collapsed: true })));
    expect(html).toHaveAttribute('data-layout', 'immersive');
    expect(html).not.toHaveAttribute('data-drawer');
    expect(html).not.toHaveAttribute('data-collapsed');
    expect(html.querySelector('[data-part="sidebar"]')).toBeNull();
    expect(html.querySelector('button[aria-label="Fechar menu"]')).toBeNull();
    expect(html.querySelector('[data-part="content"]')).toHaveTextContent('Conteúdo');
  });

  it('`sidebar` pode ser `null`; sem topo, a moldura encostada sabe que não há topo', () => {
    const { container, rerender } = render(
      <AppShell layout="immersive" sidebar={null} bleed>
        <p>Texto do artigo</p>
      </AppShell>,
    );
    const host = container.querySelector('[data-part="shell"]');
    expect(host).toHaveAttribute('data-no-topbar');
    expect(screen.getByRole('main')).toHaveTextContent('Texto do artigo');
    rerender(
      <AppShell layout="immersive" topbar={<TopBar breadcrumb={[{ label: 'Produções' }]} />}>
        <p>Texto do artigo</p>
      </AppShell>,
    );
    expect(host).not.toHaveAttribute('data-no-topbar');
  });

  it('o topo não oferece abrir nem recolher o menu (nem com `menuButton="always"`)', () => {
    render(
      <AppShell
        layout="immersive"
        topbar={
          <TopBar
            breadcrumb={[{ label: 'Produções' }]}
            menuButton="always"
            onToggleSidebar={() => undefined}
          />
        }
      >
        <p>Conteúdo</p>
      </AppShell>,
    );
    expect(screen.queryByRole('button', { name: 'Abrir menu' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Recolher menu|Expandir menu/ })).toBeNull();
  });

  it('`useShell` diz imersivo, sem gaveta e sem menu aberto', () => {
    let state: ReturnType<typeof useShell> | undefined;
    function Probe() {
      state = useShell();
      return null;
    }
    render(
      <AppShell layout="immersive" defaultNavOpen collapsed>
        <Probe />
      </AppShell>,
    );
    expect(state).toMatchObject({
      immersive: true,
      drawer: false,
      navOpen: false,
      collapsed: false,
    });
    expect(state?.navId).toBe('');
  });

  it('o CSS: uma coluna só, sem botões de menu, e o topo vale 0 quando não há topo', () => {
    expect(css).toMatch(
      /\.shell\[data-layout='immersive'\] \.frame \{\s*grid-template-columns: minmax\(0, 1fr\);/,
    );
    expect(css).toMatch(
      /\.shell\[data-layout='immersive'\] \.topbar \.menuButton,[^{]*\{\s*display: none;/,
    );
    expect(css).toMatch(/\.shell\[data-no-topbar\] \.main \{\s*--topbar-h: 0px;/);
    // As regras da gaveta em `auto` não alcançam o imersivo.
    const narrow = css.slice(css.indexOf('@container shell (max-width: 1199px)'));
    expect(narrow.slice(0, narrow.indexOf('@container shell (max-width: 640px)'))).not.toContain(
      'immersive',
    );
  });
});

describe('Sidebar · item “Em breve”', () => {
  it('não é link: botão indisponível com selo, nome e motivo na descrição', () => {
    render(roadmapShell({ layout: 'desktop' }));
    const item = soonItem();
    expect(item.tagName).toBe('BUTTON');
    expect(item).not.toHaveAttribute('href');
    expect(within(nav()).queryByRole('link', { name: /Notícias/ })).toBeNull();
    expect(item).toHaveAttribute('aria-disabled', 'true');
    expect(item).toHaveAccessibleName('Notícias, Em breve');
    expect(item).toHaveAccessibleDescription(REASON);
    expect(within(item).getByText('Em breve')).toBeInTheDocument();
    expect(nativeTitles()).toEqual([]);
    // O que já existe continua link.
    expect(within(nav()).getByRole('link', { name: /Produções/ })).toHaveAttribute(
      'href',
      '#producoes',
    );
  });

  it('selo no lugar da contagem; sem motivo, sem descrição; rótulo próprio', () => {
    render(
      <ul>
        <SidebarItem item={{ id: 'canais', label: 'Canais', count: 4, soon: { label: 'Na R6' } }} />
      </ul>,
    );
    const item = screen.getByRole('button', { name: 'Canais, Na R6' });
    expect(within(item).getByText('Na R6')).toBeInTheDocument();
    expect(within(item).queryByText('4')).toBeNull();
    expect(item).not.toHaveAttribute('aria-describedby');
  });

  it('clique, Enter e Espaço não navegam; o item disponível navega', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(roadmapShell({ layout: 'desktop' }, { onNavigate }));
    const item = soonItem();
    await user.click(item);
    item.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onNavigate).not.toHaveBeenCalled();

    await user.click(within(nav()).getByRole('link', { name: /Produções/ }));
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate.mock.calls[0]?.[0]).toBe('producoes');
  });

  it('nunca é o ativo', () => {
    render(roadmapShell({ layout: 'desktop' }, { active: 'noticias' }));
    expect(soonItem()).not.toHaveAttribute('aria-current');
    expect(nav().querySelector('[aria-current]')).toBeNull();
  });

  it('o motivo abre na dica do DS no hover e no foco de teclado', async () => {
    const user = userEvent.setup();
    render(roadmapShell({ layout: 'desktop' }));
    await user.hover(soonItem());
    expect(await screen.findByRole('tooltip', { hidden: true })).toHaveTextContent(REASON);
    await user.unhover(soonItem());
    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();

    // O teclado chega ao item (focável) e a dica abre na hora.
    await user.tab(); // Produções
    await user.tab(); // grupo Entrada
    await user.tab(); // Notícias
    expect(soonItem()).toHaveFocus();
    expect(await screen.findByRole('tooltip', { hidden: true })).toHaveTextContent(REASON);
    expect(nativeTitles()).toEqual([]);
  });

  it('sem motivo e com o nome inteiro, nenhuma dica abre', async () => {
    const user = userEvent.setup();
    render(roadmapShell({ layout: 'desktop' }));
    await user.hover(soonItem(/Canais/));
    await new Promise((done) => setTimeout(done, 400));
    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
  });

  it('recolhida: ícone com a dica lateral “Nome · Em breve” e o motivo', async () => {
    const user = userEvent.setup();
    render(roadmapShell({ layout: 'desktop', collapsed: true }));
    const item = soonItem();
    expect(item).toHaveAccessibleName('Notícias, Em breve');
    expect(item).toHaveAccessibleDescription(REASON);
    expect(within(item).queryByText('Em breve')).toBeNull();

    await user.hover(item);
    const tip = await screen.findByText('Notícias · Em breve');
    expect(tip.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(tip).toHaveTextContent(`Notícias · Em breve${REASON}`);
  });

  it('`peek` mantém a dica do item recolhido aberta (prancha)', () => {
    render(roadmapShell({ layout: 'desktop', collapsed: true }, { peek: 'canais' }));
    expect(screen.getByText('Canais · Em breve')).toBeInTheDocument();
  });

  it('gaveta: tocar no item “Em breve” não fecha; o disponível fecha', async () => {
    const user = userEvent.setup();
    const onNavOpenChange = vi.fn();
    const { container } = render(
      roadmapShell({ layout: 'drawer', defaultNavOpen: true, onNavOpenChange }),
    );
    const shellRoot = container.querySelector('[data-part="shell"]');
    expect(shellRoot).toHaveAttribute('data-nav-open');
    await user.click(soonItem());
    expect(shellRoot).toHaveAttribute('data-nav-open');
    expect(onNavOpenChange).not.toHaveBeenCalled();

    await user.click(within(nav()).getByRole('link', { name: /Produções/ }));
    expect(onNavOpenChange).toHaveBeenCalledWith(false);
  });

  it('a gaveta abre com o foco no primeiro item disponível, não no “Em breve”', async () => {
    const user = userEvent.setup();
    render(
      <AppShell
        layout="drawer"
        sidebar={
          <Sidebar
            groups={[
              {
                id: 'g',
                items: [
                  { id: 'a', label: 'Pautas', icon: FileText, soon: true },
                  { id: 'b', label: 'Produções', icon: LayoutList, href: '#' },
                ],
              },
            ]}
          />
        }
        topbar={<TopBar breadcrumb={[{ label: 'Produções' }]} />}
      >
        <p>Conteúdo</p>
      </AppShell>,
    );
    await user.click(screen.getByRole('button', { name: 'Abrir menu' }));
    expect(screen.getByRole('link', { name: 'Produções' })).toHaveFocus();
  });

  it('recolhida: grupo recolhível fechado não desenha os ícones (nem a régua); aberto, desenha', () => {
    const main: NavGroup = {
      id: 'main',
      items: [{ id: 'producoes', label: 'Produções', icon: LayoutList, href: '#' }],
    };
    const soon: NavGroup = {
      id: 'soon',
      label: 'Em breve',
      collapsible: true,
      defaultOpen: false,
      items: [{ id: 'pautas', label: 'Pautas', icon: FileText, soon: true }],
    };
    const closed = [main, soon];
    const { container, unmount } = render(
      <AppShell layout="desktop" collapsed sidebar={<Sidebar groups={closed} />}>
        <p>Conteúdo</p>
      </AppShell>,
    );
    expect(within(nav()).getByRole('link', { name: 'Produções' })).toBeInTheDocument();
    expect(within(nav()).queryByRole('button', { name: /Pautas/ })).toBeNull();
    expect(container.querySelectorAll('hr')).toHaveLength(0);
    unmount();
    render(
      <AppShell
        layout="desktop"
        collapsed
        sidebar={<Sidebar groups={[main, { ...soon, defaultOpen: true }]} />}
      >
        <p>Conteúdo</p>
      </AppShell>,
    );
    expect(within(nav()).getByRole('button', { name: /Pautas/ })).toBeInTheDocument();
  });

  it('funciona dentro de grupo recolhível', async () => {
    const user = userEvent.setup();
    render(roadmapShell({ layout: 'desktop' }));
    const group = within(nav()).getByRole('button', { name: 'Entrada' });
    await user.click(group);
    expect(within(nav()).queryByRole('button', { name: /Notícias/ })).toBeNull();
    await user.click(group);
    expect(soonItem()).toHaveAttribute('aria-disabled', 'true');
  });
});

/* ——— TopBar · trilha no celular ——— */

/** A trilha que o Reporter passa: Produções › produção › etapa. */
const TRAIL: Crumb[] = [
  { label: 'Produções', href: '/productions' },
  { label: 'Tendências do verão 2027', href: '/productions/tendencias-do-verao-2027' },
  { label: 'Artigo' },
];

const trail = () => screen.getByRole('navigation', { name: 'Trilha de navegação' });
const levels = () => Array.from(trail().querySelectorAll('li'));
const parts = () => levels().map((li) => li.getAttribute('data-crumb'));

/** Regras da trilha a ≤640 px do topo: o bloco que vem depois das regras da trilha (o `flex` delas). */
const trailBase = () => css.search(/^\.crumbs ol \{/m);
const phoneBlock = () => {
  const start = css.indexOf('@container topbar (max-width: 640px)', trailBase());
  return start < 0 ? '' : css.slice(start, css.indexOf('\n}\n', start));
};
/** Todos os blocos do topo a ≤640 px, em qualquer ponto do arquivo. */
const phoneBlocks = () => {
  const query = '@container topbar (max-width: 640px)';
  const blocks: string[] = [];
  for (let at = css.indexOf(query); at >= 0; at = css.indexOf(query, at + 1))
    blocks.push(css.slice(at, css.indexOf('\n}\n', at)));
  return blocks;
};

describe('TopBar · trilha no celular', () => {
  it('três níveis: o primeiro é o link de volta, o do meio sai, o atual leva o separador', () => {
    render(<TopBar breadcrumb={TRAIL} />);
    expect(parts()).toEqual(['first', 'middle', 'current']);
    const [first, , current] = levels();
    expect(within(first!).getByRole('link', { name: 'Produções' })).toHaveAttribute(
      'href',
      '/productions',
    );
    // Nada antes do primeiro; o atual começa pelo separador, que fica entre os dois no celular.
    expect(first!.querySelector('svg')).toBeNull();
    expect(current!.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(current!.firstElementChild?.tagName.toLowerCase()).toBe('svg');
    expect(within(current!).getByText('Artigo').closest('[aria-current="page"]')).not.toBeNull();
    expect(within(current!).queryByRole('link')).toBeNull();
  });

  it('um nível é só o atual; dois mostram os dois', () => {
    const { rerender } = render(<TopBar breadcrumb={[{ label: 'Produções' }]} />);
    expect(parts()).toEqual(['current']);
    rerender(<TopBar breadcrumb={[TRAIL[0]!, TRAIL[2]!]} />);
    expect(parts()).toEqual(['first', 'current']);
    expect(within(trail()).getByRole('link', { name: 'Produções' })).toBeInTheDocument();
  });

  it('recolhida: o “…” e os níveis da cauda antes do atual são meio', () => {
    render(
      <TopBar
        maxCrumbs={4}
        breadcrumb={[
          { label: 'Portal', href: '/portal' },
          { label: 'Vitrine', href: '/vitrine' },
          { label: 'Categorias', href: '/categorias' },
          { label: 'Calçados femininos', href: '/calcados-femininos' },
          { label: 'Scarpin Couro Vegetal Primavera' },
        ]}
      />,
    );
    expect(parts()).toEqual(['first', 'middle', 'middle', 'current']);
    expect(
      within(trail()).getByRole('button', { name: 'Mostrar 2 níveis ocultos' }).closest('li'),
    ).toHaveAttribute('data-crumb', 'middle');
  });

  it('o CSS do celular esconde só o meio e reparte a largura entre o primeiro e o atual', () => {
    // A grade só vale sobre o `flex` da trilha se vier depois dele no arquivo.
    expect(trailBase()).toBeGreaterThan(0);
    const block = phoneBlock();
    expect(block).toMatch(/\.crumbs li\[data-crumb='middle'\] \{\s*display: none;\s*\}/);
    expect(block).toMatch(
      /\.crumbs ol \{[^}]*display: grid;[^}]*grid-auto-flow: column;[^}]*grid-auto-columns: minmax\(0, max-content\);/,
    );
    // Nem o primeiro nível nem o separador do atual somem mais, em nenhum bloco do celular.
    expect(css).not.toContain('.crumbs li:not(:last-child)');
    expect(css).not.toMatch(/\.crumbs li:last-child > \.crumbSep/);
    expect(block).not.toContain('crumbSep');
    expect(block).not.toMatch(/data-crumb='(first|current)'/);
    // Em todos os blocos do celular, a única regra sobre os níveis é a que esconde o meio.
    const crumbRules = phoneBlocks()
      .flatMap((text) => text.match(/\.crumbs li[^{,]*/g) ?? [])
      .map((selector) => selector.trim());
    expect(crumbRules).toEqual([".crumbs li[data-crumb='middle']"]);
    // Cada nível corta com reticência, e o link tem 3 px acima e abaixo da linha de 20 px (26 px).
    expect(css).toMatch(/\.crumbText \{[^}]*overflow: hidden;[^}]*text-overflow: ellipsis;/);
    expect(css).toMatch(/\.crumbLink,\n\.crumbBack \{\s*padding: 3px 4px;/);
  });

  it('`compact` continua só com “‹ nível acima”, sem níveis marcados', () => {
    render(<Breadcrumb variant="compact" items={TRAIL} />);
    expect(trail().querySelector('li, [data-crumb]')).toBeNull();
    expect(within(trail()).getByRole('link', { name: 'Tendências do verão 2027' })).toBeVisible();
  });
});

/** Corpo de cada `@container <nome> (max-width: <px>)`, com as chaves balanceadas. */
function containerBlocks(name: string, maxWidth: number): string[] {
  const head = `@container ${name} (max-width: ${maxWidth}px)`;
  const blocks: string[] = [];
  for (let at = css.indexOf(head); at !== -1; at = css.indexOf(head, at + 1)) {
    const open = css.indexOf('{', at);
    let depth = 0;
    for (let i = open; i < css.length; i += 1) {
      if (css[i] === '{') depth += 1;
      if (css[i] === '}' && --depth === 0) {
        blocks.push(css.slice(open + 1, i));
        break;
      }
    }
  }
  return blocks;
}

/** A regra que começa pelo seletor (sozinho ou o primeiro de uma lista), até o `}`. */
function rule(blocks: string[], selector: string): string {
  for (const block of blocks) {
    const start = block.search(
      new RegExp(`(^|\\n)\\s*${selector.replace(/[.[\]]/g, '\\$&')}\\s*[,{]`),
    );
    if (start >= 0) return block.slice(start, block.indexOf('}', start));
  }
  return '';
}

describe('AppShell no celular: alvos de 44 px', () => {
  const topbar = containerBlocks('topbar', 640);
  const shell = containerBlocks('shell', 640);

  it('botão Menu e sino medem 44 × 44 px e não encolhem', () => {
    const targets = rule(topbar, '.topbar .menuButton');
    expect(targets).toContain('.topbar .bell button');
    expect(targets).toMatch(/width:\s*44px/);
    expect(targets).toMatch(/height:\s*44px/);
    expect(targets).toMatch(/flex-shrink:\s*0/);
  });

  it('itens, busca e limpar a busca da gaveta medem 44 px', () => {
    expect(rule(shell, '.shell[data-drawer] .navItem')).toMatch(/min-height:\s*44px/);
    expect(rule(shell, '.shell[data-drawer] .filter')).toMatch(/height:\s*44px/);
    const clear = rule(shell, '.shell[data-drawer] .filterClear');
    expect(clear).toMatch(/width:\s*44px/);
    expect(clear).toMatch(/height:\s*44px/);
  });

  it('no computador os itens continuam com ao menos 24 px', () => {
    const base = css.slice(css.indexOf('.navItem {'), css.indexOf('}', css.indexOf('.navItem {')));
    expect(Number(/min-height:\s*(\d+)px/.exec(base)?.[1])).toBeGreaterThanOrEqual(24);
  });
});

describe('NotificationsButton: painel de avisos', () => {
  const menuCss = readFileSync(resolve(__dirname, 'menu.module.css'), 'utf8');
  const notices = [
    {
      label: 'Hoje',
      items: [
        {
          texto: 'Sua página saiu do ar. A organização a inativou. Motivo: correção em andamento.',
          tempo: 'há 20 min',
          naoLida: true,
          tom: 'alerta' as const,
        },
      ],
    },
    {
      label: 'Anteriores',
      items: [
        {
          texto: 'Sua página está no ar. 5 de 5 seções aprovadas.',
          tempo: 'há 3 dias',
          naoLida: false,
          tom: 'sucesso' as const,
        },
      ],
    },
  ];
  const sections = [{ items: [{ label: 'P.I. 2026-0400 assinado', description: 'há 12 min' }] }];

  afterEach(cleanup);

  async function open(node: ReactNode) {
    const user = userEvent.setup();
    render(<div data-ds-v3>{node}</div>);
    await user.click(screen.getByRole('button', { name: /Notificações/ }));
    return { user, menu: screen.getByRole('menu', { name: 'Notificações' }) };
  }

  it('com `onViewAll` há o rodapé `Ver todas`, que o chama', async () => {
    const onViewAll = vi.fn();
    const { user } = await open(<NotificationsButton sections={sections} onViewAll={onViewAll} />);
    await user.click(screen.getByRole('menuitem', { name: 'Ver todas' }));
    expect(onViewAll).toHaveBeenCalledTimes(1);
  });

  it('sem `onViewAll` nenhum `Ver todas`, com `notices` ou com `sections`', async () => {
    await open(<NotificationsButton title="Notificações" width={420} notices={notices} />);
    expect(screen.queryByText('Ver todas')).toBeNull();
    cleanup();
    await open(<NotificationsButton sections={sections} />);
    expect(screen.queryByText('Ver todas')).toBeNull();
    expect(screen.getByRole('menuitem', { name: /P\.I\. 2026-0400 assinado/ })).toBeTruthy();
  });

  it('título, 420 px e os grupos', async () => {
    const { menu } = await open(
      <NotificationsButton title="Notificações" width={420} notices={notices} />,
    );
    expect(menu.style.width).toBe('420px');
    expect(within(menu).getByText('Notificações')).toBeTruthy();
    expect(within(menu).getByRole('group', { name: 'Hoje' })).toBeTruthy();
    expect(within(menu).getByRole('group', { name: 'Anteriores' })).toBeTruthy();
  });

  it('não lido tem "Não lida" no nome acessível, com caixa visível nula; lido não tem', async () => {
    const { menu } = await open(<NotificationsButton notices={notices} />);
    const [unread, read] = within(menu).getAllByRole('menuitem');
    expect(unread).toHaveProperty(
      'textContent',
      expect.stringContaining('correção em andamento.há 20 minNão lida'),
    );
    expect(read?.textContent).not.toContain('Não lida');
    const hidden = within(unread as HTMLElement).getByText('Não lida');
    expect(hidden.className).toMatch(/srOnly/);
    const srOnly = menuCss.slice(
      menuCss.indexOf('.srOnly {'),
      menuCss.indexOf('}', menuCss.indexOf('.srOnly {')),
    );
    expect(srOnly).toMatch(/width:\s*1px/);
    expect(srOnly).toMatch(/height:\s*1px/);
    expect(srOnly).toMatch(/clip:\s*rect\(0 0 0 0\)/);
    expect(srOnly).toMatch(/overflow:\s*hidden/);
  });

  it('os dois pontos são `aria-hidden` e o texto vai inteiro, sem reticências', async () => {
    const { menu } = await open(<NotificationsButton notices={notices} />);
    const [unread] = within(menu).getAllByRole('menuitem');
    const dots = (unread as HTMLElement).querySelectorAll('i');
    expect(dots).toHaveLength(2);
    for (const dot of dots) expect(dot.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(dots[0]?.className).toMatch(/unreadDot/);
    expect(dots[1]?.getAttribute('data-tone')).toBe('alerta');
    expect(unread?.textContent).not.toContain('…');
    expect(
      within(unread as HTMLElement).getByText(/Motivo: correção em andamento\.$/),
    ).toBeTruthy();
    const notice = menuCss.slice(
      menuCss.indexOf('.item[data-notice] .label {'),
      menuCss.indexOf('}', menuCss.indexOf('.item[data-notice] .label {')),
    );
    expect(notice).toMatch(/white-space:\s*normal/);
    expect(notice).toMatch(/text-overflow:\s*clip/);
  });

  it('clique no aviso chama o `onSelect` dele e fecha devolvendo o foco ao sino', async () => {
    const onSelect = vi.fn();
    const { user, menu } = await open(
      <NotificationsButton
        notices={[{ label: 'Hoje', items: [{ ...notices[0]!.items[0]!, onSelect }] }]}
      />,
    );
    await user.click(within(menu).getByRole('menuitem'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Notificações/ }));
  });
});

describe('ProductMark · marca com letra', () => {
  it('`mark` desenha a letra no quadrado e o nome ao lado', () => {
    const { container } = render(
      <AppShell
        sidebar={<Sidebar product={<ProductMark mark="M" name="MEDIA.ON" />} groups={groups} />}
      >
        <p>Conteúdo</p>
      </AppShell>,
    );
    const product = container.querySelector('[data-part="product"]') as HTMLElement;
    expect(product).toHaveAttribute('data-mark', '');
    expect(within(product).getByText('M').closest('[aria-hidden="true"]')).not.toBeNull();
    expect(within(product).getByText('MEDIA.ON')).toBeInTheDocument();
    expect(product.querySelector('svg')).toBeNull();
  });

  it('sem `mark`, o desenho de hoje: o símbolo em SVG e nenhuma letra', () => {
    const { container } = render(
      <AppShell sidebar={<Sidebar product={<ProductMark name="Redação" />} groups={groups} />}>
        <p>Conteúdo</p>
      </AppShell>,
    );
    const product = container.querySelector('[data-part="product"]') as HTMLElement;
    expect(product).not.toHaveAttribute('data-mark');
    expect(product.querySelector('svg')).not.toBeNull();
    expect(within(product).getByText('Redação')).toBeInTheDocument();
  });

  it('o CSS: letra branca e nome em peso 600 só com `mark`; topo de 52 px com o fio do topo', () => {
    expect(css).toMatch(/\.product\[data-mark\] \.productText strong \{[^}]*font-weight: 600;/);
    expect(css).toMatch(/\.logoLetter \{[^}]*color: var\(--on-accent\);/);
    expect(css).toMatch(
      /\.identity \{[^}]*min-height: var\(--topbar-h\);[^}]*border-bottom: 1px solid var\(--line\);/,
    );
    expect(css).toMatch(/\.account \{[^}]*min-height: 44px;/);
  });
});

describe('AppShell · gaveta abaixo de 900 px (`drawerBelow`)', () => {
  it('sem a prop: nenhum atributo novo e o véu de sempre', () => {
    const html = root(renderToString(shell()));
    expect(html).toHaveAttribute('data-layout', 'auto');
    expect(html).not.toHaveAttribute('data-drawer-below');
    expect(html).not.toHaveAttribute('data-veil');
  });

  it('servidor: `drawerBelow={900}` marca o corte e sai do bloco de 1199 px', () => {
    const html = root(renderToString(shell({ drawerBelow: 900, veil: 'dim' })));
    expect(html).toHaveAttribute('data-drawer-below', '900');
    expect(html).toHaveAttribute('data-veil', 'dim');
    expect(html).not.toHaveAttribute('data-layout', 'auto');
  });

  it('o CSS desenha a gaveta fechada até 899,98 px no modo 900', () => {
    const block = css.slice(css.indexOf('@container shell (max-width: 899.98px)'));
    expect(block).toMatch(
      /\.shell\[data-drawer-below='900'\] \.frame \{\s*grid-template-columns: minmax\(0, 1fr\);/,
    );
    expect(block).toMatch(
      /\.shell\[data-drawer-below='900'\] \.sidebar \{[^}]*position: fixed;[^}]*visibility: hidden;/,
    );
    expect(block).toMatch(
      /\.shell\[data-drawer-below='900'\] \.topbar\[data-menu='auto'\] \.menuButton \{\s*display: inline-flex;/,
    );
  });

  it('véu `dim`: `--foreground` a 35%', () => {
    expect(css).toMatch(
      /\.shell\[data-veil='dim'\] \.veil \{[^}]*background: color-mix\(in srgb, var\(--foreground\) 35%, transparent\);/,
    );
  });

  it('movimento reduzido: gaveta, véu e item ativo com transição e animação de 0,01 ms', () => {
    const theme = readFileSync(resolve(__dirname, 'theme.module.css'), 'utf8');
    const block = theme.slice(theme.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(block).toMatch(/\.theme \*,\s*\.theme \*::before,\s*\.theme \*::after \{/);
    expect(block).toMatch(/transition-duration: 0\.01ms !important;/);
    expect(block).toMatch(/animation-duration: 0\.01ms !important;/);
    expect(theme).toMatch(/--foreground: var\(--ink\);/);
  });

  it('o botão do menu abre a gaveta; tocar no véu fecha e devolve o foco ao botão', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AppShell
        drawerBelow={900}
        veil="dim"
        sidebar={<Sidebar groups={groups} />}
        topbar={<TopBar breadcrumb={[{ label: 'Produções' }]} />}
      >
        <p>Conteúdo</p>
      </AppShell>,
    );
    const shellRoot = container.querySelector('[data-part="shell"]');
    const menuButton = screen.getByRole('button', { name: 'Abrir menu' });
    await user.click(menuButton);
    expect(shellRoot).toHaveAttribute('data-nav-open');
    await user.click(screen.getByRole('button', { name: 'Fechar menu' }));
    expect(shellRoot).not.toHaveAttribute('data-nav-open');
    expect(menuButton).toHaveFocus();
  });
});

describe('Moldura do protótipo v21: rótulo do grupo e menu da conta', () => {
  it('rótulo do grupo em 11 px, peso 500, `--muted` (UI-03)', () => {
    const rule = css.match(/\n\.groupLabel \{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toMatch(/font: 500 11px\/16px var\(--font\);/);
    expect(rule).toMatch(/color: var\(--muted\);/);
  });

  it('o menu da conta abre na largura do rodapé (o gatilho), não mais largo que o menu', async () => {
    const user = userEvent.setup();
    const width = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockImplementation(function (this: HTMLElement) {
        return this.dataset.part === 'account' ? 211 : 0;
      });
    render(
      <SidebarAccount
        name="Marina Costa"
        detail="Naturaltech"
        sections={[{ items: [{ label: 'Sair', onSelect: () => undefined }] }]}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Menu da conta/ }));
    expect(screen.getByRole('menu', { name: 'Conta' })).toHaveStyle({ width: '211px' });
    width.mockRestore();
  });
});
