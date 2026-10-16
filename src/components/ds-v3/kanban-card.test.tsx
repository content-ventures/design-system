import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CampaignKanbanCard } from './campaign-kanban-card';
import { KanbanCard, KanbanColumn, LeadCard } from './kanban';

describe('Cartão compartilhado dos pipelines V3', () => {
  it('campanhas e leads usam a mesma base visual, com dados próprios', () => {
    render(
      <>
        <LeadCard company="Aurora" code="1200" owner="Marina" value={1500} origin="Vitrine" />
        <CampaignKanbanCard
          name="Francal 2026"
          advertiser="Aurora"
          portal="Francal"
          budget={2000}
          period="01/10 – 31/10"
        />
      </>,
    );
    const lead = screen.getByRole('listitem', { name: 'Aurora' });
    const campaign = screen.getByRole('listitem', { name: 'Francal 2026' });
    expect(campaign.className).toBe(lead.className);
    expect(lead).toHaveAccessibleDescription(
      /Lead 1200\. Responsável Marina\. Valor R\$\s1\.500,00\. Origem Vitrine\./,
    );
    expect(campaign).not.toHaveTextContent('Responsável');
    expect(campaign).not.toHaveTextContent('Lead 1200');
    expect(campaign).toHaveTextContent('01/10 – 31/10');
  });

  it('preserva seleção, estados de arrasto e abertura por Enter do lead', async () => {
    const open = vi.fn();
    const user = userEvent.setup();
    render(
      <LeadCard company="Aurora" code="1200" owner="Marina" selected lifted ghost onOpen={open} />,
    );
    const card = screen.getByRole('listitem', { name: 'Aurora' });
    expect(card).toHaveAttribute('data-selected', 'true');
    expect(card).toHaveAttribute('data-lifted', 'true');
    expect(card).toHaveAttribute('data-ghost', 'true');
    expect(card).toHaveAttribute('aria-current', 'true');
    await user.tab();
    expect(card).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('ações internas não abrem o cartão nem interceptam Enter', async () => {
    const open = vi.fn();
    const menu = vi.fn();
    const user = userEvent.setup();
    render(
      <KanbanCard title="Campanha" onOpen={open} menu={<button onClick={menu}>Ações</button>} />,
    );
    await user.click(screen.getByRole('button', { name: 'Ações' }));
    expect(menu).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(menu).toHaveBeenCalledTimes(2);
    expect(open).not.toHaveBeenCalled();
  });

  it('dados ausentes não inventam anunciante, verba ou período', () => {
    render(<CampaignKanbanCard name="Campanha" portal="Francal" period="Período a definir" />);
    expect(screen.getByText('Verba a definir')).toBeInTheDocument();
    expect(screen.getByText('Anunciante não informado')).toBeInTheDocument();
    expect(screen.getByLabelText('Período de veiculação: Período a definir')).toBeInTheDocument();
  });
});

describe('Cartão que acabou de chegar', () => {
  const scroll = vi.mocked(HTMLElement.prototype.scrollIntoView);
  beforeEach(() => scroll.mockClear());

  it('marca o cartão e o revela uma vez, sem foco e sem virar seleção', () => {
    const { rerender } = render(
      <KanbanCard title="Tendências do verão" arrived onOpen={vi.fn()} />,
    );
    const card = screen.getByRole('listitem', { name: 'Tendências do verão' });
    expect(card).toHaveAttribute('data-arrived', 'true');
    expect(card).not.toHaveAttribute('aria-current');
    expect(card).not.toHaveFocus();
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(scroll.mock.contexts[0]).toBe(card);
    expect(scroll).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'smooth',
    });

    rerender(<KanbanCard title="Tendências do verão" code="12" arrived onOpen={vi.fn()} />);
    expect(scroll).toHaveBeenCalledTimes(1);
  });

  it('sem `arrived` não marca nem rola; quando vira `true`, revela de novo', () => {
    const { rerender } = render(<KanbanCard title="Guia de viagem" />);
    const card = screen.getByRole('listitem', { name: 'Guia de viagem' });
    expect(card).not.toHaveAttribute('data-arrived');
    expect(scroll).not.toHaveBeenCalled();

    rerender(<KanbanCard title="Guia de viagem" arrived />);
    expect(card).toHaveAttribute('data-arrived', 'true');
    expect(scroll).toHaveBeenCalledTimes(1);

    rerender(<KanbanCard title="Guia de viagem" arrived={false} />);
    expect(card).not.toHaveAttribute('data-arrived');
    rerender(<KanbanCard title="Guia de viagem" arrived />);
    expect(scroll).toHaveBeenCalledTimes(2);
  });

  it('chega pelo cartão de lead e pelo de campanha', () => {
    render(
      <>
        <LeadCard company="Aurora" code="1200" owner="Marina" arrived />
        <CampaignKanbanCard name="Francal 2026" portal="Francal" period="01/10 – 31/10" arrived />
      </>,
    );
    expect(screen.getByRole('listitem', { name: 'Aurora' })).toHaveAttribute('data-arrived');
    expect(screen.getByRole('listitem', { name: 'Francal 2026' })).toHaveAttribute('data-arrived');
    expect(scroll).toHaveBeenCalledTimes(2);
  });

  it('com movimento reduzido salta; onde a coluna encaixa, encosta no início', () => {
    vi.mocked(window.matchMedia).mockImplementationOnce(
      (query) =>
        ({
          matches: query === '(prefers-reduced-motion: reduce)',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }) as unknown as MediaQueryList,
    );
    const real = window.getComputedStyle.bind(window);
    const computed = vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
      const style = real(element, pseudo);
      // Celular: a coluna encaixa no início (container query do quadro em ≤640 px).
      if (element.tagName === 'SECTION')
        Object.defineProperty(style, 'scrollSnapAlign', { value: 'start' });
      return style;
    });
    render(
      <KanbanColumn title="Aprovação" count={1}>
        <KanbanCard title="Tendências do verão" arrived />
      </KanbanColumn>,
    );
    computed.mockRestore();
    expect(scroll).toHaveBeenCalledWith({ block: 'nearest', inline: 'start', behavior: 'instant' });
  });
});
