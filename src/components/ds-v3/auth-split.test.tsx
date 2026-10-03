/**
 * Página de acesso dividida: o formulário é o conteúdo principal; o painel da
 * marca mostra a chamada e uma prévia decorativa, fora da árvore de
 * acessibilidade e sem foco.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AuthScene } from './auth-scenes';
import { AuthShowcase, AuthSplit, ShowcaseLayer } from './auth-split';

describe('AuthSplit', () => {
  it('formulário no main; painel da marca ao lado, com a cena inerte', () => {
    const { container } = render(
      <AuthSplit
        brand={<span>MediaOn</span>}
        aside={
          <AuthShowcase
            eyebrow="MediaOn · Ad Manager"
            title="Campanhas, mídia e leads das suas feiras"
            highlight="em um só lugar."
          >
            <ShowcaseLayer top={0} left={0} float>
              <button type="button">Prévia</button>
            </ShowcaseLayer>
          </AuthShowcase>
        }
      >
        <h1>Entrar</h1>
      </AuthSplit>,
    );

    expect(screen.getByRole('main')).toContainElement(
      screen.getByRole('heading', { name: 'Entrar' }),
    );
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

  it('cada momento do acesso tem a sua chamada', () => {
    const { rerender } = render(<AuthScene variant="login" />);
    expect(screen.getByText('em um só lugar.')).toBeInTheDocument();

    rerender(<AuthScene variant="invite" />);
    expect(screen.getByText('Falta só a sua senha.')).toBeInTheDocument();

    rerender(<AuthScene variant="code" />);
    expect(screen.getByText('e você está dentro.')).toBeInTheDocument();

    rerender(<AuthScene variant="recover" />);
    expect(screen.getByText('em poucos minutos.')).toBeInTheDocument();
  });
});
