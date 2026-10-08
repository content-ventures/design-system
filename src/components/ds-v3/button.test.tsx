/**
 * `IconButton` e `SplitButton`: o nome do botão de ícone aparece na dica do DS (nunca no `title`
 * nativo), sem caixa extra em volta e sem repetir o nome como descrição. Um `Tooltip` em volta
 * manda: só a dica dele aparece.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Bell, Trash2 } from 'lucide-react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { IconButton, SplitButton } from './button';
import { Tooltip } from './overlays';

const nativeTitles = () =>
  Array.from(document.querySelectorAll('[title]')).filter((node) => node.getAttribute('title'));

describe('IconButton', () => {
  it('nome no aria-label e na dica do DS; sem title nativo e sem caixa em volta', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <div>
        <IconButton label="Notificações" icon={Bell} />
      </div>,
    );
    const button = screen.getByRole('button', { name: 'Notificações' });
    // O botão continua sendo o item do layout (gaveta, cabeçalho, posição absoluta).
    expect(container.firstElementChild?.firstElementChild).toBe(button);
    expect(button).not.toHaveAttribute('aria-describedby');
    expect(nativeTitles()).toEqual([]);

    await user.hover(button);
    expect(await screen.findByRole('tooltip', { hidden: true })).toHaveTextContent('Notificações');
    await user.unhover(button);
    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
  });

  it('a referência e os eventos do consumidor seguem no botão', async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLButtonElement>();
    const onPointerEnter = vi.fn();
    const { unmount } = render(
      <IconButton ref={ref} label="Notificações" icon={Bell} onPointerEnter={onPointerEnter} />,
    );
    expect(ref.current).toBe(screen.getByRole('button', { name: 'Notificações' }));
    await user.hover(ref.current as HTMLButtonElement);
    expect(onPointerEnter).toHaveBeenCalled();
    unmount();
    expect(ref.current).toBeNull();
  });

  it('a dica abre com o foco do teclado e fecha no clique', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<IconButton label="Excluir" icon={Trash2} onClick={onClick} />);
    await user.tab();
    expect(await screen.findByRole('tooltip', { hidden: true })).toHaveTextContent('Excluir');
    await user.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
  });

  it('`title` troca o texto da dica e vira descrição; nunca vai para o DOM', async () => {
    const user = userEvent.setup();
    render(<IconButton label="Excluir" title="Excluir slide 3" icon={Trash2} />);
    const button = screen.getByRole('button', { name: 'Excluir' });
    expect(button).toHaveAccessibleDescription('Excluir slide 3');
    expect(nativeTitles()).toEqual([]);
    await user.hover(button);
    expect(await screen.findByRole('tooltip', { hidden: true })).toHaveTextContent(
      'Excluir slide 3',
    );
  });

  it('dentro de um Tooltip, só a dica de fora aparece', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Excluir indisponível: versão aprovada">
        <IconButton label="Excluir" icon={Trash2} aria-disabled />
      </Tooltip>,
    );
    const button = screen.getByRole('button', { name: 'Excluir' });
    expect(button).toHaveAccessibleDescription('Excluir indisponível: versão aprovada');
    await user.hover(button);
    const tips = await screen.findAllByRole('tooltip', { hidden: true });
    expect(tips).toHaveLength(1);
    expect(tips[0]).toHaveTextContent('Excluir indisponível: versão aprovada');
    expect(nativeTitles()).toEqual([]);
  });
});

describe('SplitButton', () => {
  it('a seta tem dica do DS com o nome do menu e continua abrindo o menu', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <SplitButton
        label="Exportar"
        menuLabel="Outras opções de exportação"
        onClick={() => {}}
        menu={[{ items: [{ label: 'Baixar PDF', onSelect }] }]}
      />,
    );
    const toggle = screen.getByRole('button', { name: 'Outras opções de exportação' });
    expect(nativeTitles()).toEqual([]);
    await user.hover(toggle);
    expect(await screen.findByRole('tooltip', { hidden: true })).toHaveTextContent(
      'Outras opções de exportação',
    );
    await user.click(toggle);
    // A referência do menu continua no botão: o menu abre ancorado e a dica sai da frente.
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
    await user.click(await screen.findByRole('menuitem', { name: 'Baixar PDF' }));
    expect(onSelect).toHaveBeenCalledOnce();
  });
});
