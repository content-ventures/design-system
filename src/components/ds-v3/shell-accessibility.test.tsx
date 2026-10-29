import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppShell, Sidebar } from './app-shell';
import { Toaster } from './toast';

describe('shared shell accessibility', () => {
  it('keeps sidebar identity, navigation and footer inside a named landmark', () => {
    render(<AppShell sidebar={<Sidebar groups={[]} product={<span>Reporter IA</span>} footer="Versões" />}><p>Conteúdo</p></AppShell>);
    const sidebar = screen.getByRole('complementary', { name: 'Área de navegação' });
    expect(within(sidebar).getByText('Reporter IA')).toBeVisible();
    expect(within(sidebar).getByRole('navigation', { name: 'Menu principal' })).toBeInTheDocument();
    expect(within(sidebar).getByText('Versões')).toBeVisible();
  });
  it('exposes the named toast container as a polite live region', () => {
    render(<Toaster />);
    expect(screen.getByRole('region', { name: 'Avisos (Alt+T)' })).toHaveAttribute('aria-live', 'polite');
  });
});
