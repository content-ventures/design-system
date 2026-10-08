/**
 * Texto cortado sem `title` nativo: `TruncatedText` (e as peças que o usam — Badge, Chip, célula
 * da tabela, nível da trilha, título do cabeçalho) mostra o texto inteiro numa `Tooltip` do DS só
 * quando a reticência cortou; sem corte, nada abre. Nenhum `title` nativo fica no DOM.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Breadcrumb } from './app-shell';
import { Badge, Chip } from './badge';
import { TruncatedText } from './overlays';
import { PageHeader } from './structure';
import { DataTable } from './table';

const LONG = 'Lume Acessórios: bijuteria brasileira na Europa sem perder a identidade';

/** O jsdom não mede: tudo “corta” (largura de conteúdo maior que a da caixa) ou nada corta. */
function clipEverything(clip: boolean) {
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(clip ? 400 : 100);
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(100);
}

const nativeTitles = (root: HTMLElement) =>
  [...root.querySelectorAll('[title]')].filter((node) => node.getAttribute('title') !== '');
const tooltip = () => screen.findByRole('tooltip', { hidden: true });

afterEach(() => vi.restoreAllMocks());

describe('TruncatedText', () => {
  it('cortou: a dica do DS mostra o texto inteiro ao passar o ponteiro', async () => {
    clipEverything(true);
    const user = userEvent.setup();
    const { container } = render(<TruncatedText text={LONG} />);
    const text = screen.getByText(LONG);
    expect(text).toHaveAttribute('data-clipped');
    await user.hover(text);
    expect(await tooltip()).toHaveTextContent(LONG);
    expect(nativeTitles(container)).toEqual([]);
  });

  it('sem corte, nenhuma dica (o texto já está inteiro à vista)', async () => {
    clipEverything(false);
    const user = userEvent.setup();
    render(<TruncatedText text="Curto" />);
    await user.hover(screen.getByText('Curto'));
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
  });
});

describe('peças sem title nativo', () => {
  it('Badge, Chip, célula da tabela, trilha e cabeçalho', () => {
    clipEverything(true);
    const { container } = render(
      <>
        <Badge title="Gerando · introdução">Gerando · introdução</Badge>
        <Chip label="Status:" title="Status: Aguardando aprovação" onRemove={() => {}}>
          Aguardando aprovação
        </Chip>
        <DataTable
          label="Eventos"
          rows={[{ id: 'e1', action: LONG }]}
          rowKey={(row) => row.id}
          columns={[{ key: 'action', header: 'Ação', truncate: true, render: (row) => row.action }]}
        />
        <Breadcrumb items={[{ label: 'Produções', href: '/p' }, { label: LONG }]} />
        <PageHeader title={LONG} />
      </>,
    );
    expect(nativeTitles(container)).toEqual([]);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(LONG);
  });
});

describe('âncora da dica (contrato do CSS)', () => {
  it('nunca passa da coluna: o filho que corta o texto continua cortando, aberta ou não', () => {
    const css = readFileSync(
      join(process.cwd(), 'src/components/ds-v3/overlays.module.css'),
      'utf8',
    );
    const anchor = css.match(/\.tipAnchor \{([^}]*)\}/)?.[1] ?? '';
    const pinned = css.match(/\.tipPinned \{([^}]*)\}/)?.[1] ?? '';
    expect(anchor).toMatch(/max-width:\s*100%/);
    expect(anchor).toMatch(/min-width:\s*0/);
    expect(pinned).toMatch(/max-width:\s*100%/);
  });
});
