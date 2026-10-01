import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { CatalogSpecimen, DesignSystemCatalog } from './catalog';
import { DesignSystemTheme } from '../../components/ds-v2';
import { catalogItems } from './registry';

function setup(hash: string) {
  window.history.replaceState(null, '', `/design-system-v2#${hash}`);
  return render(
    <DesignSystemTheme>
      <DesignSystemCatalog />
    </DesignSystemTheme>,
  );
}
beforeEach(() => localStorage.clear());
describe('catálogo do inventário V2', () => {
  it('não força texto auxiliar abaixo do título de cada item', () => {
    setup('cabecalho-app');

    expect(
      screen.queryByText('Contexto do portal, identidade, acesso à conta e notificações.'),
    ).not.toBeInTheDocument();
  });

  it('mantém os links anteriores e acompanha o histórico', () => {
    setup('tipografia');
    expect(screen.getByRole('heading', { level: 1, name: 'Tipografia' })).toBeInTheDocument();
    act(() => {
      window.history.pushState(null, '', '#tabelas');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(screen.getByRole('table', { name: 'Campanhas de demonstração' })).toBeInTheDocument();
  });
  it('busca itens por acentos, palavra-chave e família e mostra ausência de resultados', async () => {
    setup('visao-geral');
    const user = userEvent.setup();
    const search = screen.getByRole('textbox', { name: 'Buscar componentes' });
    const nav = within(screen.getByRole('navigation', { name: 'Biblioteca de componentes' }));
    await user.type(search, 'selecao');
    expect(nav.getByRole('link', { name: 'Seleção múltipla' })).toBeInTheDocument();
    expect(nav.queryByRole('link', { name: 'Cores' })).not.toBeInTheDocument();
    await user.clear(search);
    await user.type(search, 'funnel');
    expect(nav.getByRole('link', { name: 'Funil' })).toBeInTheDocument();
    await user.type(search, ' inexistente');
    expect(screen.getByText('Nenhum componente encontrado.')).toBeInTheDocument();
  });
  it('valida o formulário e conserva o preenchimento', async () => {
    setup('formularios');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
    const input = screen.getByRole('textbox', { name: 'Nome da campanha' });
    expect(input).toHaveFocus();
    expect(input).toHaveAccessibleDescription('Informe o nome da campanha.');
    await user.type(input, 'Campanha exemplo');
    await user.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
    expect(screen.getByRole('status')).toHaveTextContent(
      'Campanha exemplo foi salvo neste exemplo.',
    );
  });
  it('salva notas e marcações por item sem marcar os demais como revisados', async () => {
    const user = userEvent.setup();
    const view = setup('campo');
    await user.click(screen.getByRole('tab', { name: 'Minha revisão' }));
    await user.type(
      screen.getByRole('textbox', { name: 'O que você quer ajustar neste item?' }),
      'Rever o espaço entre rótulo e controle.',
    );
    await user.click(screen.getByRole('button', { name: 'Salvar nota' }));
    await user.click(screen.getByRole('button', { name: 'Marcar revisado' }));
    view.unmount();
    setup('campo');
    expect(screen.getByRole('button', { name: 'Revisado por você' })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Minha revisão' }));
    expect(
      screen.getByRole('textbox', { name: 'O que você quer ajustar neste item?' }),
    ).toHaveValue('Rever o espaço entre rótulo e controle.');
    act(() => {
      window.location.hash = 'senha';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(screen.getByRole('button', { name: 'Marcar revisado' })).toBeInTheDocument();
  });
  it('oferece uma demonstração renderizável para cada um dos 126 itens sem fallback genérico', () => {
    expect(catalogItems).toHaveLength(126);
    expect(new Set(catalogItems.map((item) => item.id)).size).toBe(126);
    for (const item of catalogItems) {
      const view = render(
        <DesignSystemTheme>
          <CatalogSpecimen item={item} notify={() => {}} />
        </DesignSystemTheme>,
      );
      expect(view.container.textContent?.trim().length, item.id).toBeGreaterThan(40);
      expect(
        view.container.querySelector('section,table,form,svg,ul,dl,div'),
        item.id,
      ).not.toBeNull();
      view.unmount();
    }
  });
  it('o wizard exige nome e mídia antes da revisão e mantém a seleção ao voltar', async () => {
    setup('wizard');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    const name = screen.getByRole('textbox', { name: 'Nome da campanha' });
    expect(name).toHaveFocus();
    await user.type(name, 'Campanha Francal');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('heading', { name: 'Escolha as mídias' })).toHaveFocus();
    await user.click(screen.getByRole('checkbox', { name: /Display no portal/ }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Selecione pelo menos uma mídia.');
    await user.click(screen.getByRole('checkbox', { name: /E-mail dedicado/ }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByText('Campanha Francal')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(screen.getByRole('checkbox', { name: /E-mail dedicado/ })).toBeChecked();
  });
  it('filtra a tabela, seleciona apenas as linhas visíveis e aplica a ação em lote', async () => {
    setup('data-table');
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox', { name: 'Buscar campanhas' }), 'primavera');
    const table = within(screen.getByRole('table', { name: 'Campanhas de demonstração' }));
    expect(table.getAllByRole('row')).toHaveLength(2);
    await user.click(table.getByRole('checkbox', { name: 'Selecionar campanhas visíveis' }));
    await user.click(screen.getByRole('button', { name: 'Mover para rascunho' }));
    expect(table.getByText('Rascunho')).toBeInTheDocument();
    await user.clear(screen.getByRole('textbox', { name: 'Buscar campanhas' }));
    expect(table.getAllByRole('row')).toHaveLength(5);
    expect(table.getByText('Em veiculação')).toBeInTheDocument();
  });
  it('usa tags e badges atuais e abre as camadas corretas pelas ações da linha', async () => {
    setup('barra-filtros');
    const user = userEvent.setup();
    const table = within(screen.getByRole('table', { name: 'Campanhas de demonstração' }));
    const campaignRow = within(table.getByText('Lançamento primavera').closest('tr')!);
    expect(campaignRow.getByText('Em veiculação').closest('[data-variant="soft"]')).not.toBeNull();
    expect(campaignRow.getByText('Primavera').closest('[data-tone="amber"]')).not.toBeNull();

    await user.click(table.getByRole('button', { name: 'Ações de Lançamento primavera' }));
    await user.click(screen.getByRole('menuitem', { name: 'Ver detalhes' }));
    const detail = within(screen.getByRole('dialog', { name: 'Lançamento primavera' }));
    expect(detail.getByText(/24\.800,00/)).toBeInTheDocument();
    await user.click(detail.getByRole('button', { name: 'Fechar' }));

    await user.click(table.getByRole('button', { name: 'Ações de Lançamento primavera' }));
    await user.click(screen.getByRole('menuitem', { name: 'Remover' }));
    const confirmation = within(screen.getByRole('dialog', { name: 'Remover campanha?' }));
    await user.click(confirmation.getByRole('button', { name: 'Remover do exemplo' }));
    expect(table.queryByText('Lançamento primavera')).not.toBeInTheDocument();
  });
  it('adapta estados vazios e erros ao contexto e oferece recuperação', async () => {
    const user = userEvent.setup();
    const emptyView = setup('estado-vazio');
    await user.click(screen.getByRole('button', { name: 'Sem resultados' }));
    expect(screen.getByRole('status', { name: /Nenhum resultado para/ })).toHaveAttribute(
      'data-placement',
      'table',
    );

    emptyView.unmount();
    setup('estado-erro');
    await user.click(screen.getByRole('button', { name: 'Página' }));
    const pageError = screen.getByRole('alert', { name: 'Não foi possível abrir esta área' });
    expect(pageError).toHaveAttribute('data-placement', 'page');
    await user.click(within(pageError).getByRole('button', { name: 'Tentar novamente' }));
    expect(screen.getByRole('status', { name: 'Conexão restabelecida' })).toBeInTheDocument();
  });
});
