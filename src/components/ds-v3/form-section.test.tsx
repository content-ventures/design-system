/**
 * `FormSection`: cartão de seção de um passo. O título é um heading de verdade (h3 por padrão) e
 * `titleAs` acerta o nível quando a seção vem logo abaixo do h1 da página, sem mudar o tamanho.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FormSection } from './stepper';

describe('FormSection', () => {
  it('título em h3 por padrão, com o estado para leitor de tela', () => {
    render(
      <FormSection title="Material" state="done" open>
        <p>Corpo</p>
      </FormSection>,
    );
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Material');
    expect(heading).toHaveTextContent('(preenchida)');
  });

  it('`titleAs` muda só o nível; o botão de abrir continua dentro do título', async () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <FormSection title="Falantes" open={false} onOpenChange={onOpenChange} titleAs="h2">
        <p>Corpo</p>
      </FormSection>,
    );
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.className).toBe((container.querySelector('h2') as HTMLElement).className);
    await userEvent.setup().click(screen.getByRole('button', { name: /Falantes/ }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(container.querySelector('h3')).toBeNull();
  });
});
