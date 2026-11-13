import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Breadcrumb, TopBar } from './app-shell';

const css = readFileSync(join(import.meta.dirname, 'app-shell.module.css'), 'utf8');

describe('trilha com níveis de contexto', () => {
  it('apresenta níveis sem destino como texto e reserva aria-current à página atual', () => {
    const go = vi.fn();
    const { container } = render(
      <Breadcrumb
        items={[
          { label: 'Organizadora: Açucena' },
          { label: 'Portal: Feira A', onClick: go },
          { label: 'Campanhas' },
        ]}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Organizadora: Açucena' })).toBeNull();
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(container.querySelector('[aria-current="page"]')).toHaveTextContent('Campanhas');
    fireEvent.click(screen.getByRole('button', { name: 'Portal: Feira A' }));
    expect(go).toHaveBeenCalledOnce();
  });

  it('nível sem destino antes do atual fica como os anteriores (muted, 400), não como o atual', () => {
    const { container } = render(
      <Breadcrumb
        items={[
          { label: 'Anunciar' },
          { label: 'Minhas campanhas', href: '/c' },
          { label: 'Linha' },
        ]}
      />,
    );
    const group = screen.getByText('Anunciar').parentElement!;
    expect(group).not.toHaveAttribute('aria-current');
    expect(group.className).toMatch(/crumbStatic/);
    expect(group.className).not.toMatch(/crumbCurrent/);
    expect(container.querySelectorAll('[class*="crumbCurrent"]')).toHaveLength(1);
    const rule = css.match(/\.crumbStatic\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toMatch(/color:\s*var\(--muted\)/);
    expect(rule).not.toMatch(/font-weight:\s*500/);
  });

  it('a trilha compacta retorna ao ancestral com destino, ignorando rótulos de contexto', () => {
    const go = vi.fn();
    render(
      <Breadcrumb
        variant="compact"
        items={[
          { label: 'Organizadora: Açucena' },
          { label: 'Portal: Feira A', onClick: go },
          { label: 'Operação' },
          { label: 'Campanhas' },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Portal: Feira A' }));
    expect(go).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Operação' })).toBeNull();
  });
});

describe('trilha curta de dois níveis (`compactTrail`)', () => {
  const trail = [
    { label: 'Visão geral', href: '/p/x/dashboard' },
    { label: 'Minhas campanhas', href: '/p/x/campanhas' },
    { label: 'Linha Calêndula' },
  ];

  it('sem a prop: nenhum nível marcado como `parent`', () => {
    const { container } = render(<Breadcrumb items={trail} />);
    expect(container.querySelector('nav')).not.toHaveAttribute('data-trail');
    expect(container.querySelector('[data-crumb="parent"]')).toBeNull();
    expect(container.querySelector('[data-crumb="first"]')).toHaveTextContent('Visão geral');
  });

  it('`last-two` marca o penúltimo nível como `parent` e o último como `current`', () => {
    const { container } = render(<TopBar breadcrumb={trail} compactTrail="last-two" />);
    expect(container.querySelector('nav')).toHaveAttribute('data-trail', 'last-two');
    const parent = container.querySelectorAll('[data-crumb="parent"]');
    expect(parent).toHaveLength(1);
    expect(parent[0]).toHaveTextContent('Minhas campanhas');
    expect(container.querySelector('[data-crumb="current"]')).toHaveTextContent('Linha Calêndula');
    expect(container.querySelector('[data-crumb="first"]')).toHaveTextContent('Visão geral');
  });

  it('o CSS esconde os outros níveis e o separador do `parent` abaixo do corte', () => {
    const block = css.slice(css.indexOf('@container shell (max-width: 899.98px)'));
    expect(block).toMatch(
      /\.shell\[data-drawer-below='900'\]\s+\.crumbs\[data-trail='last-two'\]\s+li:not\(\[data-crumb='parent'\], \[data-crumb='current'\]\) \{\s*display: none;/,
    );
    expect(block).toMatch(
      /\.crumbs\[data-trail='last-two'\] li\[data-crumb='parent'\] \.crumbSep \{\s*display: none;/,
    );
  });
});
