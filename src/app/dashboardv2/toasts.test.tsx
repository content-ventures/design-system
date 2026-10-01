import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastViewport, useToast, type ToastInput } from './toasts';

function Preview({
  input = { message: 'Alteração salva.' },
  suspended = false,
}: {
  input?: ToastInput;
  suspended?: boolean;
}) {
  const { toast, notify, dismiss } = useToast();
  return (
    <>
      <button onClick={() => notify(input)}>Salvar</button>
      <ToastViewport toast={toast} dismiss={dismiss} suspended={suspended} />
    </>
  );
}
const advance = (milliseconds: number) => act(() => vi.advanceTimersByTime(milliseconds));
const show = () => {
  const trigger = screen.getByRole('button', { name: 'Salvar' });
  trigger.focus();
  fireEvent.click(trigger);
  return trigger;
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('toasts — tempo, ação e foco', () => {
  it('renova o tempo ao repetir a mesma confirmação e dispensa após seis segundos', () => {
    render(<Preview />);
    show();
    expect(screen.getByRole('status')).toHaveTextContent('Alteração salva.');
    advance(5000);
    show();
    advance(5000);
    expect(screen.getByRole('status')).toBeInTheDocument();
    advance(1000);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('pausa durante leitura por ponteiro, foco e aba oculta, mantendo o tempo restante', () => {
    render(<Preview />);
    show();
    advance(2000);
    const region = screen.getByRole('status');
    const close = within(region).getByRole('button', { name: 'Fechar aviso' });
    fireEvent.pointerEnter(close);
    advance(10000);
    expect(region).toBeInTheDocument();
    act(() => close.focus());
    fireEvent.pointerLeave(close);
    advance(10000);
    expect(region).toBeInTheDocument();
    act(() => screen.getByRole('button', { name: 'Salvar' }).focus());
    advance(1000);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    fireEvent(document, new Event('visibilitychange'));
    advance(10000);
    expect(region).toBeInTheDocument();
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    fireEvent(document, new Event('visibilitychange'));
    advance(2999);
    expect(region).toBeInTheDocument();
    advance(1);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it.each(['error', 'warning'] as const)(
    'mantém %s visível até a dispensa explícita',
    (variant) => {
      render(<Preview input={{ variant, message: 'Revise as informações.' }} />);
      show();
      advance(60000);
      expect(screen.getByRole('alert')).toHaveTextContent('Revise as informações.');
      fireEvent.click(screen.getByRole('button', { name: 'Fechar aviso' }));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    },
  );

  it('preserva o foco ao aparecer e retorna à origem quando fechado por Escape', () => {
    render(<Preview />);
    const trigger = show();
    expect(trigger).toHaveFocus();
    const close = screen.getByRole('button', { name: 'Fechar aviso' });
    act(() => close.focus());
    fireEvent.keyDown(close, { key: 'Escape' });
    expect(trigger).toHaveFocus();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('mantém uma ação disponível e a executa uma única vez, dispensando o aviso', () => {
    const open = vi.fn();
    render(
      <Preview
        input={{ message: 'Cadastro salvo.', action: { label: 'Ver cadastro', onClick: open } }}
      />,
    );
    show();
    advance(60000);
    fireEvent.click(screen.getByRole('button', { name: 'Ver cadastro' }));
    expect(open).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('suspende a contagem enquanto o menu móvel está aberto', () => {
    const { rerender } = render(<Preview />);
    show();
    advance(2000);
    rerender(<Preview suspended />);
    advance(10000);
    rerender(<Preview />);
    advance(3999);
    expect(screen.getByRole('status')).toBeInTheDocument();
    advance(1);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
