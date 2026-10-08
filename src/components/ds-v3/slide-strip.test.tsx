/**
 * Faixa de slides: escolha por setas (o foco acompanha), reordenação por Alt + seta, exclusão com
 * confirmação (Delete) que escolhe o vizinho, aviso em ponto + texto, limite no “Adicionar”.
 */
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { SlideStrip, type SlideStripItem, type SlideStripProps } from './slide-strip';

const ITEMS: SlideStripItem[] = [
  { id: 'capa', label: 'Capa' },
  { id: 'contexto', label: 'Contexto', state: 'warning', issue: 'Título excede 2 linhas' },
  { id: 'ponto', label: 'Ponto principal' },
  { id: 'citacao', label: 'Citação', state: 'error' },
  { id: 'conclusao', label: 'Conclusão', meta: '18 palavras' },
];

function Controlled(props: Partial<SlideStripProps> & { initial?: string }) {
  const { initial = 'capa', ...rest } = props;
  const [items, setItems] = useState(ITEMS);
  const [value, setValue] = useState<string | null>(initial);
  return (
    <SlideStrip
      label="Slides do carrossel"
      items={items}
      value={value}
      onChange={setValue}
      onReorder={(from, to) =>
        setItems((list) => {
          const next = [...list];
          const [moved] = next.splice(from, 1);
          if (moved) next.splice(to, 0, moved);
          return next;
        })
      }
      onRemove={(id) => setItems((list) => list.filter((item) => item.id !== id))}
      {...rest}
    />
  );
}

const tiles = () =>
  within(screen.getByRole('list', { name: 'Slides do carrossel' })).getAllByRole('button', {
    name: /^\d+\. /,
  });

describe('SlideStrip', () => {
  it('numera os slides, marca o escolhido e só ele entra no Tab', () => {
    render(<Controlled initial="ponto" />);
    const list = tiles();
    expect(list.map((tile) => tile.getAttribute('aria-label'))).toEqual([
      '1. Capa',
      '2. Contexto',
      '3. Ponto principal',
      '4. Citação',
      '5. Conclusão',
    ]);
    expect(list[2]).toHaveAttribute('aria-current', 'true');
    expect(list[2]).toHaveAttribute('tabindex', '0');
    expect(list[0]).toHaveAttribute('tabindex', '-1');
  });

  it('setas, Home e End escolhem e levam o foco', async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    tiles()[0]?.focus();
    await user.keyboard('{ArrowRight}');
    expect(tiles()[1]).toHaveAttribute('aria-current', 'true');
    expect(tiles()[1]).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(tiles()[2]).toHaveFocus();
    await user.keyboard('{End}');
    expect(tiles()[4]).toHaveAttribute('aria-current', 'true');
    await user.keyboard('{Home}');
    expect(tiles()[0]).toHaveFocus();
  });

  it('Alt + seta reordena, anuncia a posição e mantém o foco no slide movido', async () => {
    const user = userEvent.setup();
    const onReorder = vi.fn();
    render(<Controlled onReorder={onReorder} />);
    tiles()[0]?.focus();
    await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
    expect(onReorder).toHaveBeenCalledWith(0, 1);
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Capa: posição 2 de 5.'),
    );
  });

  it('Alt + seta move de verdade quando o produto reordena', async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    tiles()[0]?.focus();
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(tiles()[1]).toHaveAccessibleName('2. Capa');
    expect(tiles()[1]).toHaveFocus();
  });

  it('Delete pede confirmação; confirmar exclui e escolhe o vizinho', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    function Spy() {
      const [items, setItems] = useState(ITEMS);
      const [value, setValue] = useState<string | null>('contexto');
      return (
        <>
          <SlideStrip
            label="Slides do carrossel"
            items={items}
            value={value}
            onChange={setValue}
            onRemove={(id) => {
              onRemove(id);
              setItems((list) => list.filter((item) => item.id !== id));
            }}
          />
          <output data-testid="value">{value}</output>
        </>
      );
    }
    render(<Spy />);
    tiles()[1]?.focus();
    await user.keyboard('{Delete}');
    const dialog = screen.getByRole('dialog', { name: 'Excluir slide 2?' });
    expect(dialog).toHaveTextContent('“Contexto” sai da sequência.');
    await user.click(within(dialog).getByRole('button', { name: 'Excluir slide' }));
    expect(onRemove).toHaveBeenCalledWith('contexto');
    await waitFor(() => expect(screen.getByTestId('value')).toHaveTextContent('ponto'));
    expect(tiles()).toHaveLength(4);
  });

  it('confirmRemove={false} exclui direto; mínimo bloqueia o Delete', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const { rerender } = render(
      <SlideStrip
        label="Slides do carrossel"
        items={ITEMS.slice(0, 2)}
        value="capa"
        onChange={() => {}}
        onRemove={onRemove}
        confirmRemove={false}
      />,
    );
    tiles()[0]?.focus();
    await user.keyboard('{Delete}');
    expect(onRemove).toHaveBeenCalledWith('capa');
    expect(screen.queryByRole('dialog')).toBeNull();

    onRemove.mockClear();
    rerender(
      <SlideStrip
        label="Slides do carrossel"
        items={ITEMS.slice(0, 2)}
        value="capa"
        onChange={() => {}}
        onRemove={onRemove}
        minItems={2}
      />,
    );
    tiles()[0]?.focus();
    await user.keyboard('{Delete}');
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('aviso e erro viram ponto + texto (texto lido como descrição)', () => {
    render(<Controlled />);
    expect(tiles()[1]).toHaveAccessibleDescription(
      expect.stringContaining('Título excede 2 linhas'),
    );
    expect(tiles()[3]).toHaveAccessibleDescription(expect.stringContaining('Com erro'));
    expect(tiles()[4]).toHaveAccessibleDescription(expect.stringContaining('18 palavras'));
    expect(screen.getByText('Título excede 2 linhas').closest('[data-tone]')).toHaveAttribute(
      'data-tone',
      'amber',
    );
    const item = tiles()[3]?.closest('li');
    expect(item).toHaveAttribute('data-state', 'error');
  });

  it('horizontal: ponto sem texto visível, mesmo nome acessível', () => {
    render(<Controlled orientation="horizontal" />);
    const tile = tiles()[1] as HTMLElement;
    expect(tile.querySelector('[data-tone="amber"]')).not.toHaveAttribute('title');
    expect(tile).toHaveAccessibleDescription(expect.stringContaining('Título excede 2 linhas'));
  });

  it('horizontal: a dica do DS traz nome e aviso, sem title nativo nem descrição repetida', async () => {
    const user = userEvent.setup();
    render(<Controlled orientation="horizontal" />);
    const tile = tiles()[1] as HTMLElement;
    const describedBy = tile.getAttribute('aria-describedby');
    await user.hover(tile);
    expect(await screen.findByRole('tooltip', { hidden: true })).toHaveTextContent(
      'Contexto · Título excede 2 linhas',
    );
    // O leitor já ouve o aviso pela descrição do bloco: a dica não soma outra.
    expect(tile.getAttribute('aria-describedby')).toBe(describedBy);
    const titled = Array.from(document.querySelectorAll('[title]')).filter((node) =>
      node.getAttribute('title'),
    );
    expect(titled).toEqual([]);
  });

  it('vertical: nome e aviso já estão escritos, sem dica no bloco', async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    await user.hover(tiles()[1] as HTMLElement);
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
  });

  it('menu do slide duplica e move', async () => {
    const user = userEvent.setup();
    const onDuplicate = vi.fn();
    const onReorder = vi.fn();
    render(<Controlled onDuplicate={onDuplicate} onReorder={onReorder} />);
    await user.click(screen.getByRole('button', { name: 'Ações de Ponto principal' }));
    await user.click(await screen.findByRole('menuitem', { name: /Duplicar/ }));
    expect(onDuplicate).toHaveBeenCalledWith('ponto');
    await user.click(screen.getByRole('button', { name: 'Ações de Ponto principal' }));
    await user.click(await screen.findByRole('menuitem', { name: /Mover para cima/ }));
    expect(onReorder).toHaveBeenCalledWith(2, 1);
  });

  it('Adicionar chama onAdd; no limite fica indisponível e não chama', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const { rerender } = render(
      <SlideStrip
        label="Slides do carrossel"
        items={ITEMS}
        value="capa"
        onChange={() => {}}
        onAdd={onAdd}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Adicionar slide' }));
    expect(onAdd).toHaveBeenCalledTimes(1);

    rerender(
      <SlideStrip
        label="Slides do carrossel"
        items={ITEMS}
        value="capa"
        onChange={() => {}}
        onAdd={onAdd}
        maxItems={5}
      />,
    );
    const add = screen.getByRole('button', { name: 'Adicionar slide' });
    expect(add).toHaveAttribute('aria-disabled', 'true');
    await user.click(add);
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('carregando e vazio', () => {
    const { rerender } = render(
      <SlideStrip
        label="Slides do carrossel"
        items={[]}
        value={null}
        onChange={() => {}}
        loading
        loadingCount={3}
      />,
    );
    expect(screen.getByRole('list', { name: 'Slides do carrossel' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(screen.getByText('Carregando')).toHaveAttribute('role', 'status');
    rerender(
      <SlideStrip label="Slides do carrossel" items={[]} value={null} onChange={() => {}} />,
    );
    expect(screen.getByText('Nenhum slide')).toBeInTheDocument();
  });

  it('indisponível: nada responde', () => {
    const onChange = vi.fn();
    render(
      <SlideStrip
        label="Slides do carrossel"
        items={ITEMS}
        value="capa"
        onChange={onChange}
        disabled
      />,
    );
    const tile = tiles()[2] as HTMLElement;
    expect(tile).toBeDisabled();
    fireEvent.click(tile);
    act(() => {
      fireEvent.keyDown(tiles()[0] as HTMLElement, { key: 'ArrowRight' });
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /^Ações de/ })).toBeNull();
  });
});
