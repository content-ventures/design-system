/**
 * Página de acesso dividida: o formulário é o conteúdo principal; o painel da
 * marca mostra a chamada e uma prévia decorativa, fora da árvore de
 * acessibilidade e sem foco.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AuthShowcase, AuthSplit } from './auth-split';

describe('AuthSplit', () => {
  it('formulário no main; painel da marca ao lado, com a prévia inerte', () => {
    const { container } = render(
      <AuthSplit
        brand={<span>MediaOn</span>}
        aside={
          <AuthShowcase
            eyebrow="MediaOn · Ad Manager"
            title="Campanhas, mídia e leads das suas feiras"
            highlight="em um só lugar."
            preview={<button type="button">Prévia</button>}
          />
        }
      >
        <h1>Entrar</h1>
      </AuthSplit>,
    );

    expect(screen.getByRole('main')).toContainElement(screen.getByRole('heading', { name: 'Entrar' }));
    expect(screen.getByRole('complementary')).toHaveTextContent('em um só lugar.');
    expect(container.querySelector('em')).toHaveTextContent('em um só lugar.');

    const preview = container.querySelector('[inert]');
    expect(preview).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('button', { name: 'Prévia' })).toBeNull();
  });

  it('sem painel, a moldura fica numa coluna só', () => {
    const { container } = render(
      <AuthSplit brand={<span>MediaOn</span>}>
        <h1>Entrar</h1>
      </AuthSplit>,
    );

    expect(screen.queryByRole('complementary')).toBeNull();
    expect(container.querySelector('[data-aside]')).toBeNull();
  });
});
