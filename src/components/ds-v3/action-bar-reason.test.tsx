/**
 * `ActionBar detail` sem `status`: o motivo visível de uma ação indisponível (README §1.7), logo
 * antes dos botões e ligado ao botão por `aria-describedby`. O jsdom não calcula CSS: o que depende
 * da largura (o motivo na linha dele no celular) é conferido no texto do CSS.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ActionBar } from './stepper';

const css = readFileSync(resolve(__dirname, 'stepper.module.css'), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
);

const REASON = 'Quem enviou não aprova o próprio envio.';

describe('ActionBar detail (motivo do bloqueio)', () => {
  it('sem `status`, o motivo aparece antes dos botões, com o id que o botão aponta', () => {
    const { container } = render(
      <ActionBar
        position="static"
        start="Artigo · 1,4 de 2 laudas"
        detail={REASON}
        detailId="motivo-aprovar"
      >
        <button type="button">Pedir ajustes</button>
        <button type="button" aria-disabled="true" aria-describedby="motivo-aprovar">
          Aprovar artigo
        </button>
      </ActionBar>,
    );
    const reason = screen.getByText(REASON);
    expect(reason).toHaveAttribute('id', 'motivo-aprovar');
    expect(reason).toHaveAttribute('data-part', 'action-bar-reason');
    expect(screen.getByRole('button', { name: 'Aprovar artigo' })).toHaveAccessibleDescription(
      REASON,
    );
    // Na ordem de leitura: fatos, motivo, botões. Nenhum estado de salvamento.
    const bar = container.firstElementChild as HTMLElement;
    expect([...bar.children].map((child) => child.textContent)).toEqual([
      'Artigo · 1,4 de 2 laudas',
      REASON,
      'Pedir ajustesAprovar artigo',
    ]);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('com `status`, `detail` continua o complemento do estado (sem motivo)', () => {
    render(
      <ActionBar status="saved" detail="às 14:32">
        <button type="button">Continuar</button>
      </ActionBar>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('às 14:32');
    expect(document.querySelector('[data-part="action-bar-reason"]')).toBeNull();
  });

  it('o CSS: `--muted`, quebra em vez de cortar; no celular ganha a linha dele acima dos botões', () => {
    expect(css).toMatch(/\.barReason \{[^}]*font: var\(--t-small\);[^}]*color: var\(--muted\);/);
    expect(css).toMatch(/\.bar:has\(> \.barReason\) \{[^}]*flex-wrap: wrap;/);
    const phone = css.slice(css.indexOf('@container (max-width: 400px)'));
    expect(phone).toMatch(/\.barReason \{[^}]*flex-basis: 100%;/);
  });
});
