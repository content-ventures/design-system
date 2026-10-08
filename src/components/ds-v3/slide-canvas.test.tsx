/**
 * Slide desenhado por dados: resumo acessível na leitura, lugares escolhíveis na edição (clique,
 * Enter, Escape), transbordo medido no lugar real (título acima de 2 linhas) e informado por
 * `onOverflow`, escala pela largura do contêiner, estados carregando/erro e miniatura decorativa.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi, type MockInstance } from 'vitest';

import { SlideCanvas, slideOverflowMessage, slideSlots, type SlideContent } from './slide-canvas';

const CONTEXTO: SlideContent = {
  eyebrow: 'Contexto',
  title: 'Seis em cada dez redações já testam IA',
  body: 'O uso começou pela transcrição de entrevistas.',
  footer: 'Portal Horizonte',
};

// Só os espiões deste arquivo: o `matchMedia` do setup continua valendo.
const spies: MockInstance[] = [];
afterEach(() => {
  spies.splice(0).forEach((spy) => spy.mockRestore());
});

describe('SlideCanvas', () => {
  it('leitura: imagem com resumo do conteúdo e posição', () => {
    render(<SlideCanvas layout="text" content={CONTEXTO} page={{ current: 2, total: 5 }} />);
    const slide = screen.getByRole('img', {
      name: 'Slide 2 de 5. Contexto. Seis em cada dez redações já testam IA. O uso começou pela transcrição de entrevistas. Portal Horizonte.',
    });
    expect(slide).toHaveAttribute('aria-roledescription', 'slide');
    expect(slide).toHaveTextContent('2/5');
  });

  it('citação ganha aspas no resumo; lista junta os itens', () => {
    const { rerender } = render(
      <SlideCanvas
        layout="quote"
        content={{ quote: 'A apuração continua humana.', attribution: 'Rafael Dias' }}
      />,
    );
    expect(screen.getByRole('img')).toHaveAccessibleName(
      'Slide. “A apuração continua humana”. Rafael Dias.',
    );
    rerender(
      <SlideCanvas
        layout="list"
        content={{ title: 'Onde a IA ajuda', items: ['Transcrever', 'Revisar'] }}
      />,
    );
    expect(screen.getByRole('img')).toHaveAccessibleName(
      'Slide. Onde a IA ajuda. Transcrever; Revisar.',
    );
  });

  it('edição: clique e Enter escolhem o lugar; Escape limpa', async () => {
    const user = userEvent.setup();
    const onSlotSelect = vi.fn();
    const { rerender } = render(
      <SlideCanvas
        layout="text"
        content={CONTEXTO}
        mode="edit"
        selectedSlot={null}
        onSlotSelect={onSlotSelect}
      />,
    );
    expect(screen.getByRole('group', { name: 'Slide' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Título:/ }));
    expect(onSlotSelect).toHaveBeenLastCalledWith('title');

    screen.getByRole('button', { name: /^Texto:/ }).focus();
    await user.keyboard('{Enter}');
    expect(onSlotSelect).toHaveBeenLastCalledWith('body');

    rerender(
      <SlideCanvas
        layout="text"
        content={CONTEXTO}
        mode="edit"
        selectedSlot="body"
        onSlotSelect={onSlotSelect}
      />,
    );
    expect(screen.getByRole('button', { name: /^Texto:/ })).toHaveAttribute('aria-pressed', 'true');
    await user.keyboard('{Escape}');
    expect(onSlotSelect).toHaveBeenLastCalledWith(null);
  });

  it('edição: lugar obrigatório vazio aparece com o nome; opcional vazio some', () => {
    render(
      <SlideCanvas
        layout="text"
        content={{ title: 'Só o título' }}
        mode="edit"
        onSlotSelect={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: 'Texto: vazio' })).toHaveTextContent('Texto');
    expect(screen.queryByRole('button', { name: /^Chapéu/ })).toBeNull();
  });

  it('edição sem onSlotSelect só desenha: nenhum lugar vira botão', () => {
    render(<SlideCanvas layout="text" content={CONTEXTO} mode="edit" selectedSlot="title" />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(
      screen.getByText('Seis em cada dez redações já testam IA').closest('[data-slot]'),
    ).toHaveAttribute('data-selected');
  });

  it('título acima do limite: marca o lugar, corta e chama onOverflow', () => {
    // jsdom não faz layout: o título “mede” 3 linhas de 30 px; o resto, nada.
    spies.push(
      vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function (
        this: HTMLElement,
      ) {
        return this.closest('[data-slot="title"]') && this.hasAttribute('data-text') ? 90 : 0;
      }),
    );
    const real = window.getComputedStyle.bind(window);
    spies.push(
      vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) => {
        const style = real(el, pseudo);
        return new Proxy(style, {
          get: (target, key) => {
            if (key === 'lineHeight') return '30px';
            const value: unknown = Reflect.get(target, key, target);
            return typeof value === 'function' ? value.bind(target) : value;
          },
        });
      }),
    );
    const onOverflow = vi.fn();
    render(
      <SlideCanvas
        layout="text"
        content={CONTEXTO}
        mode="edit"
        onOverflow={onOverflow}
        onSlotSelect={() => {}}
      />,
    );

    expect(onOverflow).toHaveBeenCalledWith('title', true);
    expect(onOverflow).toHaveBeenCalledWith('body', false);
    const title = screen.getByRole('button', { name: /^Título:/ });
    expect(title).toHaveAttribute('data-overflow');
    expect(title).toHaveAccessibleDescription('Título excede 2 linhas');
    const text = title.querySelector('[data-text]') as HTMLElement;
    expect(text).toHaveAttribute('data-clamped');
    expect(text.style.getPropertyValue('--clamp')).toBe('2');
  });

  it('mensagens e lugares por layout', () => {
    expect(slideOverflowMessage('text', 'title')).toBe('Título excede 2 linhas');
    expect(slideOverflowMessage('cover', 'title', { title: 3 })).toBe('Título excede 3 linhas');
    expect(slideOverflowMessage('text', 'body')).toBe('Texto não cabe no slide');
    expect(slideOverflowMessage('list', 'items')).toBe('Lista não cabe no slide');
    expect(slideSlots('quote')).toEqual(['quote', 'attribution', 'footer']);
  });

  it('escala o desenho de 360 px para a largura do quadro', () => {
    spies.push(
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
        this: HTMLElement,
      ) {
        return this.getAttribute('aria-roledescription') === 'slide' ? 720 : 0;
      }),
    );
    render(<SlideCanvas layout="cover" content={{ title: 'Capa' }} ratio="1/1" />);
    const slide = screen.getByRole('img');
    expect(slide).toHaveAttribute('data-scaled');
    expect(slide.style.aspectRatio).toBe('1080 / 1080');
    const scaler = slide.firstElementChild as HTMLElement;
    expect(scaler.style.transform).toBe('scale(2)');
    expect(scaler.style.height).toBe('360px');
  });

  it('altura que limita: teto na proporção do desenho e sem limite por padrão', () => {
    const { rerender } = render(<SlideCanvas layout="cover" content={{ title: 'Capa' }} />);
    expect(screen.getByRole('img')).not.toHaveAttribute('data-bound');

    rerender(<SlideCanvas layout="cover" content={{ title: 'Capa' }} maxHeight={500} />);
    const slide = screen.getByRole('img');
    expect(slide).toHaveAttribute('data-bound');
    expect(slide.style.getPropertyValue('--media-ar')).toBe('0.8');
    expect(slide.style.getPropertyValue('--media-max-h')).toBe('500px');
    // O tamanho final continua dando a proporção do quadro.
    expect(slide.style.aspectRatio).toBe('1080 / 1350');
  });

  it('carregando, erro com nova tentativa e miniatura decorativa', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { rerender, container } = render(
      <SlideCanvas layout="text" content={CONTEXTO} state="loading" />,
    );
    expect(screen.getByRole('img', { name: 'Carregando slide' })).toHaveAttribute(
      'aria-busy',
      'true',
    );

    rerender(<SlideCanvas layout="text" content={CONTEXTO} state="error" onRetry={onRetry} />);
    expect(screen.getByText('Prévia indisponível')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    rerender(<SlideCanvas layout="text" content={CONTEXTO} mode="thumb" />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});
