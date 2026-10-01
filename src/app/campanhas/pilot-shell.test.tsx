import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PilotShell } from './pilot-shell';

beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe('estrutura clara do laboratório', () => {
  it('agrupa navegação sem habilitar áreas do produto real', () => {
    render(
      <PilotShell>
        <h1>Campanhas</h1>
      </PilotShell>,
    );
    expect(
      within(screen.getByRole('navigation', { name: 'Workspace' })).getByRole('link', {
        name: 'Campanhas',
      }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      within(screen.getByRole('navigation', { name: 'Gestão' })).getByRole('button', {
        name: 'Relatórios',
      }),
    ).toBeDisabled();
    expect(screen.getByText('Prévia de interface. Nenhuma operação real.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Design System V2' })).toHaveAttribute('href', '/');
  });

  it('mantém foco no menu móvel e o devolve ao gatilho com Escape', async () => {
    render(
      <PilotShell>
        <h1>Campanhas</h1>
      </PilotShell>,
    );
    const trigger = screen.getByRole('button', { name: 'Abrir menu' });
    await userEvent.click(trigger);
    const menu = screen.getByRole('dialog', { name: 'Menu principal' });
    expect(menu).toHaveAttribute('aria-modal', 'true');
    expect(within(menu).getByRole('searchbox', { name: 'Buscar no menu' })).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(within(menu).getByRole('button', { name: 'Fechar menu' })).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(within(menu).getByRole('link', { name: 'MediaOn — Campanhas' })).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(within(menu).getByRole('button', { name: 'Conta: Equipe de mídia' })).toHaveFocus();
    await userEvent.tab();
    expect(within(menu).getByRole('link', { name: 'MediaOn — Campanhas' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('filtra o menu sem depender de acentos nem alterar o conteúdo da página', async () => {
    render(
      <PilotShell>
        <input aria-label="Buscar campanhas" defaultValue="Francal" />
      </PilotShell>,
    );
    const search = screen.getByRole('searchbox', { name: 'Buscar no menu' });
    await userEvent.type(search, 'relatorios');
    expect(screen.getByRole('button', { name: 'Relatórios' })).toBeDisabled();
    expect(screen.queryByRole('link', { name: 'Campanhas' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Buscar campanhas' })).toHaveValue('Francal');

    await userEvent.clear(search);
    await userEvent.type(search, 'zzz');
    expect(screen.getByRole('status')).toHaveTextContent('Nenhum item encontrado.');
    await userEvent.clear(search);
    expect(screen.getByRole('link', { name: 'Campanhas' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('expande configurações localmente e mantém as futuras rotas desabilitadas', async () => {
    render(
      <PilotShell>
        <h1>Campanhas</h1>
      </PilotShell>,
    );
    const settings = screen.getByRole('button', { name: 'Configurações' });
    expect(settings).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Preferências' })).toBeDisabled();
    await userEvent.click(settings);
    expect(settings).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: 'Preferências' })).not.toBeInTheDocument();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar no menu' }), 'permissoes');
    expect(settings).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Equipe e permissões' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Preferências' })).not.toBeInTheDocument();
  });

  it('recolhe para ícones preservando nomes acessíveis e o estado do submenu', async () => {
    const { container } = render(
      <PilotShell>
        <h1>Campanhas</h1>
      </PilotShell>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Recolher menu lateral' }));
    expect(container.querySelector('[data-menu-collapsed]')).toHaveAttribute(
      'data-menu-collapsed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Expandir menu lateral' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('link', { name: 'Campanhas' })).toHaveAttribute('title', 'Campanhas');
    expect(screen.getByRole('link', { name: 'Design System V2' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('button', { name: 'Relatórios' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Preferências' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Expandir menu lateral' }));
    expect(screen.getByRole('button', { name: 'Configurações' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Preferências' })).toBeDisabled();
  });

  it('abre a busca a partir da faixa de ícones e devolve o foco ao campo', async () => {
    render(
      <PilotShell>
        <input aria-label="Buscar campanhas" defaultValue="Aurora" />
      </PilotShell>,
    );
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar no menu' }), 'relatorios');
    await userEvent.click(screen.getByRole('button', { name: 'Recolher menu lateral' }));
    expect(screen.getByRole('link', { name: 'Campanhas' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Buscar no menu' }));
    expect(screen.getByRole('searchbox', { name: 'Buscar no menu' })).toHaveFocus();
    expect(screen.getByRole('searchbox', { name: 'Buscar no menu' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Buscar campanhas' })).toHaveValue('Aurora');
  });

  it('expande a lateral para mostrar configurações e usa menu completo no celular', async () => {
    render(
      <PilotShell>
        <h1>Campanhas</h1>
      </PilotShell>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Configurações' }));
    await userEvent.click(screen.getByRole('button', { name: 'Recolher menu lateral' }));
    await userEvent.click(screen.getByRole('button', { name: 'Configurações' }));
    expect(screen.getByRole('button', { name: 'Recolher menu lateral' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preferências' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Recolher menu lateral' }));
    await userEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    const menu = screen.getByRole('dialog', { name: 'Menu principal' });
    expect(within(menu).getByRole('searchbox', { name: 'Buscar no menu' })).toHaveFocus();
    expect(
      within(menu).queryByRole('button', { name: 'Recolher menu lateral' }),
    ).not.toBeInTheDocument();
    expect(within(menu).getByRole('button', { name: 'Preferências' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Expandir menu lateral' })).toBeInTheDocument();
  });

  it('coloca a marca antes da navegação e a conta depois da biblioteca', () => {
    render(
      <PilotShell>
        <h1>Campanhas</h1>
      </PilotShell>,
    );
    const brand = screen.getByRole('link', { name: 'MediaOn — Campanhas' });
    const navigation = screen.getByRole('navigation', { name: 'Workspace' });
    const library = screen.getByRole('link', { name: 'Design System V2' });
    const account = screen.getByRole('button', { name: 'Conta: Equipe de mídia' });
    expect(
      brand.compareDocumentPosition(navigation) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      library.compareDocumentPosition(account) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('fecha primeiro as opções da conta com Escape sem dispensar o menu móvel', async () => {
    render(
      <PilotShell>
        <h1>Campanhas</h1>
      </PilotShell>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    const trigger = screen.getByRole('button', { name: 'Conta: Equipe de mídia' });
    await userEvent.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Conta de demonstração' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Conta de demonstração' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Menu principal' })).toBeInTheDocument();
    expect(trigger).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Menu principal' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveFocus();
  });
});
