/**
 * `CopyButton` público: copia, troca o nome para “… copiado”, avisa o leitor de tela e chama
 * `onCopy`. Fora da lista de descrição fica sempre visível; `reveal="hover"` só no hover da linha.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CopyButton } from './structure';

describe('CopyButton', () => {
  it('copia pelo teclado, avisa e chama onCopy', async () => {
    const user = userEvent.setup();
    const copied = vi.fn();
    render(
      <CopyButton text="https://reporter.local/p/42" label="link da produção" onCopy={copied} />,
    );
    const button = screen.getByRole('button', { name: 'Copiar link da produção' });
    expect(button).toHaveAttribute('data-reveal', 'always');

    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(await navigator.clipboard.readText()).toBe('https://reporter.local/p/42');
    expect(copied).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('button', { name: 'link da produção copiado' })).toHaveAttribute(
      'data-done',
    );
    expect(screen.getByRole('status')).toHaveTextContent('link da produção copiado');
  });

  it('reveal="hover" marca o botão para aparecer só com a linha', () => {
    render(<CopyButton text="PI-2026-0142" label="código" reveal="hover" />);
    expect(screen.getByRole('button', { name: 'Copiar código' })).toHaveAttribute(
      'data-reveal',
      'hover',
    );
  });
});
