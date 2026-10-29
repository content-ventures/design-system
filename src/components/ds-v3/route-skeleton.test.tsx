import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  CardsSkeleton,
  ChartSkeleton,
  FormSkeleton,
  PageSkeleton,
  TableSkeleton,
} from './route-skeleton';

/** Todo texto do esqueleto é o anúncio “Carregando”: nada de dado no HTML do carregamento. */
function texts(container: HTMLElement) {
  return [...container.querySelectorAll('*')]
    .flatMap((element) => [...element.childNodes])
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent?.trim())
    .filter(Boolean);
}

describe('esqueletos de rota', () => {
  it.each([
    ['página', <PageSkeleton key="p" />],
    ['tabela', <TableSkeleton key="t" />],
    ['cartões', <CardsSkeleton key="c" />],
    ['gráfico', <ChartSkeleton key="g" />],
    ['formulário', <FormSkeleton key="f" />],
  ])('%s anuncia a pendência e não traz dado', (_, element) => {
    const { container } = render(element);
    const root = container.firstElementChild;

    expect(root).toHaveAttribute('data-route-skeleton');
    expect(root).toHaveAttribute('role', 'status');
    expect(root).toHaveAttribute('aria-busy', 'true');
    expect(texts(container)).toEqual(['Carregando']);
  });

  it('respeita as contagens estruturais', () => {
    const table = render(<TableSkeleton rows={3} columns={4} />).container;
    // Cabeçalho + 3 linhas, cada uma com 4 colunas.
    const lines = table.querySelectorAll('[style*="grid-template-columns"]');
    expect(lines).toHaveLength(4);
    expect(lines[1]?.children).toHaveLength(4);

    const cards = render(<CardsSkeleton cards={2} />).container;
    expect(cards.querySelector('[data-route-skeleton] > div')?.children).toHaveLength(2);

    const form = render(<FormSkeleton fields={3} />).container;
    // 3 campos + o pé das ações.
    expect(form.querySelector('[data-route-skeleton] > div')?.children).toHaveLength(4);

    // Contagem negativa vira zero: só o cabeçalho, vazio.
    const empty = render(<TableSkeleton rows={-2} columns={0} />).container;
    expect(empty.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0);
    expect(empty.textContent).toBe('Carregando');
  });

  it('a página sem ações tira a barra e mantém o corpo', () => {
    const { container } = render(
      <PageSkeleton actions={false}>
        <ChartSkeleton height={120} />
      </PageSkeleton>,
    );
    const root = container.firstElementChild!;

    // Anúncio, cabeçalho e o corpo; sem a barra de busca, filtro e ação.
    expect(root.children).toHaveLength(3);
    expect(root.querySelectorAll('[data-route-skeleton]')).toHaveLength(1);
  });
});
