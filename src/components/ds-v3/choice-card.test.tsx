/**
 * `ChoiceCard media`: a miniatura no topo faz parte da área clicável (clicar nela escolhe), o cartão
 * empilha e o rádio continua nomeado só pelo texto (a peça vem com `alt=""`). O rodapé fica fora da
 * área clicável: a ação dele não escolhe a opção.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MediaFrame } from './media';
import { ChoiceCard } from './selection';

const THUMB = 'data:image/png;base64,iVBORw0KGgo=';

describe('ChoiceCard media', () => {
  it('a peça escolhe, o cartão empilha e o nome do rádio é o texto', () => {
    const onChange = vi.fn();
    const onPreview = vi.fn();
    const { container } = render(
      <ChoiceCard
        name="modelo"
        value="editorial"
        checked={false}
        onChange={onChange}
        title="Editorial"
        description="Editorial · Feed 4:5"
        media={<MediaFrame ratio="4/5" src={THUMB} alt="" radius="sm" />}
        footer={
          <button type="button" onClick={onPreview}>
            Ver modelo
          </button>
        }
      />,
    );
    const card = container.firstElementChild as HTMLElement;
    expect(card).toHaveAttribute('data-media', 'true');
    expect(card).toHaveAttribute('data-layout', 'stacked');

    const radio = screen.getByRole('radio', { name: /Editorial/ });
    expect(radio).toHaveAccessibleName('Editorial Editorial · Feed 4:5');

    const frame = container.querySelector('img')?.parentElement as HTMLElement;
    expect(frame.closest('label')).not.toBeNull();
    fireEvent.click(frame);
    expect(onChange).toHaveBeenCalledWith('editorial');

    fireEvent.click(screen.getByRole('button', { name: 'Ver modelo' }));
    expect(onPreview).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('sem peça, nada muda: segue o `layout` pedido', () => {
    const { container } = render(
      <ChoiceCard name="envio" value="draft" checked onChange={() => {}} title="Rascunho" />,
    );
    const card = container.firstElementChild as HTMLElement;
    expect(card).not.toHaveAttribute('data-media');
    expect(card).toHaveAttribute('data-layout', 'row');
  });
});
