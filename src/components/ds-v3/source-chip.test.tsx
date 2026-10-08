/**
 * `SourceChip`: nome acessível com tipo, rótulo, meta e estado; abrir por clique e teclado;
 * remover pelo X e por Delete/Backspace; “Falta” na citação que não bate; marca `inline` com
 * número; prévia no foco por teclado (HoverCard) e no toque (Popover com a ação de abrir).
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SourceChip } from './source-chip';

describe('SourceChip', () => {
  it('abre por clique e pelo teclado; remove pelo X e por Delete', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onRemove = vi.fn();
    render(
      <SourceChip
        kind="transcript"
        label="Clara Souto"
        meta="Entrevistada · 12:48"
        onOpen={onOpen}
        onRemove={onRemove}
      />,
    );

    const chip = screen.getByRole('button', {
      name: 'Transcrição: Clara Souto Entrevistada · 12:48',
    });
    await user.tab();
    expect(chip).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onOpen).toHaveBeenCalledTimes(1);
    await user.click(chip);
    expect(onOpen).toHaveBeenCalledTimes(2);

    await user.keyboard('{Delete}');
    expect(onRemove).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Remover Clara Souto' }));
    expect(onRemove).toHaveBeenCalledTimes(2);
  });

  it('usada ganha check e “(usada)”; faltante troca a meta por “Falta”', () => {
    const { rerender, container } = render(
      <SourceChip
        kind="excerpt"
        label="Trecho 14:02"
        meta="Clara Souto"
        state="used"
        onOpen={() => {}}
      />,
    );
    expect(screen.getByRole('button')).toHaveAccessibleName(
      'Trecho: Trecho 14:02 Clara Souto (usada)',
    );
    expect(container.querySelector('[data-icon="used"]')).not.toBeNull();

    rerender(
      <SourceChip kind="quote" label="“Não é mais tendência”" meta="Clara Souto" state="missing" />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-state', 'missing');
    expect(screen.getByText('Falta')).toBeInTheDocument();
    expect(screen.queryByText('Clara Souto')).toBeNull();
    // Sem onOpen e sem prévia: não é botão.
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('inline mostra só o número e diz a fonte inteira ao leitor de tela', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(
      <p>
        A meta é chegar a 30% do catálogo até 2027.
        <SourceChip
          variant="inline"
          index={2}
          kind="transcript"
          label="Clara Souto"
          meta="12:48"
          state="used"
          onOpen={onOpen}
          onRemove={() => {}}
        />
      </p>,
    );
    const mark = screen.getByRole('button', {
      name: 'Fonte 2, Transcrição: Clara Souto · 12:48 (usada)',
    });
    expect(mark).toHaveTextContent(/^2/);
    // `inline` não tem remover.
    expect(screen.queryByRole('button', { name: /Remover/ })).toBeNull();
    await user.click(mark);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('indisponível não abre nem remove', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onRemove = vi.fn();
    render(
      <SourceChip
        kind="url"
        label="valor.globo.com"
        disabled
        onOpen={onOpen}
        onRemove={onRemove}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Link: valor.globo.com' }));
    expect(onOpen).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Remover valor.globo.com' })).toBeDisabled();
  });

  it('prévia: foco por teclado abre o HoverCard', async () => {
    const user = userEvent.setup();
    render(
      <SourceChip
        kind="transcript"
        label="Clara Souto"
        meta="12:48"
        onOpen={() => {}}
        preview={<p>Não é mais tendência, é condição para exportar.</p>}
      />,
    );
    await user.tab();
    expect(
      await screen.findByText('Não é mais tendência, é condição para exportar.', undefined, {
        timeout: 1500,
      }),
    ).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByText('Não é mais tendência, é condição para exportar.')).toBeNull(),
    );
  });

  it('prévia no toque: abre o Popover com a ação de abrir, sem chamar onOpen direto', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(
      <SourceChip
        kind="transcript"
        label="Clara Souto"
        meta="12:48"
        onOpen={onOpen}
        preview={<p>Quem não rastreia a cadeia fica fora da conversa.</p>}
      />,
    );
    const chip = screen.getByRole('button', { name: /Clara Souto/ });
    await user.pointer({ keys: '[TouchA]', target: chip });
    expect(onOpen).not.toHaveBeenCalled();

    const panel = await screen.findByRole('dialog', { name: 'Prévia · Clara Souto' });
    expect(panel).toHaveTextContent('Quem não rastreia a cadeia fica fora da conversa.');
    expect(chip).toHaveAttribute('aria-expanded', 'true');
    await user.click(screen.getByRole('button', { name: 'Abrir na transcrição' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
