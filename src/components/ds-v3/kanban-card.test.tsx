import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CampaignKanbanCard } from './campaign-kanban-card';
import { KanbanCard, LeadCard } from './kanban';

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
