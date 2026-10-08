/**
 * `Grid`: proporção e vão por atributo, empilhamento declarado para a container query, `auto`
 * com largura mínima e lista sem `li` escrito à mão (cada filho vira item).
 */
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Grid, GridItem } from './grid';

describe('Grid', () => {
  it('proporção: blocos com vão de 16 e empilhamento em 760 por padrão', () => {
    render(
      <Grid columns="2:1" data-testid="grid">
        <div>Continue de onde parou</div>
        <div>Aguardando você</div>
      </Grid>,
    );
    const grid = screen.getByTestId('grid');
    expect(grid.tagName).toBe('DIV');
    expect(grid).toHaveAttribute('data-columns', '2:1');
    expect(grid).toHaveAttribute('data-gap', 'md');
    expect(grid).toHaveAttribute('data-collapse', '760');
    expect(grid).toHaveAttribute('data-align', 'stretch');
    expect(grid.parentElement).toHaveAttribute('data-part', 'grid');
  });

  it('auto: cartões com vão de 8, largura mínima em variável e sem empilhamento fixo', () => {
    render(
      <Grid columns="auto" min={240} collapseBelow={1024} data-testid="grid">
        <div>Modelo editorial</div>
      </Grid>,
    );
    const grid = screen.getByTestId('grid');
    expect(grid).toHaveAttribute('data-gap', 'sm');
    expect(grid).not.toHaveAttribute('data-collapse');
    expect(grid.style.getPropertyValue('--grid-min')).toBe('240px');
  });

  it('collapseBelow={false} nunca empilha; gap e align explícitos valem', () => {
    render(
      <Grid columns="1:1:1" gap="sm" align="start" collapseBelow={false} data-testid="grid">
        <div>A</div>
      </Grid>,
    );
    const grid = screen.getByTestId('grid');
    expect(grid).not.toHaveAttribute('data-collapse');
    expect(grid).toHaveAttribute('data-gap', 'sm');
    expect(grid).toHaveAttribute('data-align', 'start');
  });

  it('lista: cada filho vira item, GridItem não é embrulhado de novo e o nome chega à lista', () => {
    render(
      <Grid columns="auto" as="ul" label="Modelos de carrossel">
        <span>Capa e citação</span>
        {null}
        {false}
        <GridItem span="full">Todos os modelos</GridItem>
      </Grid>,
    );
    const list = screen.getByRole('list', { name: 'Modelos de carrossel' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Capa e citação');
    expect(items[1]).toHaveAttribute('data-span', 'full');
    expect(items[1]?.parentElement).toBe(list);
  });

  it('fora de lista, GridItem é um bloco e a seção nomeada vira região', () => {
    render(
      <Grid columns="1:1" as="section" label="Indicadores do texto">
        <GridItem span={2}>Palavras</GridItem>
      </Grid>,
    );
    const region = screen.getByRole('region', { name: 'Indicadores do texto' });
    const item = within(region).getByText('Palavras');
    expect(item.tagName).toBe('DIV');
    expect(item).toHaveAttribute('data-span', '2');
  });
});
