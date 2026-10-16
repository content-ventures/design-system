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

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileText, LayoutList, Newspaper, Radio } from 'lucide-react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import {
  AppShell,
  Breadcrumb,
  Sidebar,
  SidebarItem,
  TopBar,
  useShell,
  type Crumb,
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
