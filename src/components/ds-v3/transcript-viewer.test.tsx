/**
 * `TranscriptViewer`: falas agrupadas por falante, tempo só quando existe, busca sem acento com
 * navegação entre ocorrências, filtro de falante, fala ativa/usada, teclado (↑/↓, Home/End,
 * Enter, ⇧Enter), seleção dentro de uma fala com barra de ações, prévia compacta, estados e
 * lista em janela acima de 200 falas.
 */
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Quote } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { TranscriptViewer, formatTimestamp, type TranscriptSegment } from './transcript-viewer';

const marina = { id: 'marina', name: 'Marina Lopes' };
const clara = { id: 'clara', name: 'Clara Souto' };
const tiago = { id: 'tiago', name: 'Tiago Rezende' };

const SEGMENTS: TranscriptSegment[] = [
  { id: 's1', speaker: marina, start: 12_000, text: 'Como começou a linha de couro vegetal?' },
  {
    id: 's2',
    speaker: clara,
    start: 18_000,
    text: 'Começou com um teste pequeno de couro de cacto.',
  },
  { id: 's3', speaker: clara, start: 31_000, text: 'Hoje o couro vegetal já é 12% do catálogo.' },
  { id: 's4', speaker: tiago, start: 3_725_000, text: 'No Ateliê Sul, o custo subiu 4% por par.' },
  { id: 's5', speaker: tiago, text: 'Sem marca de tempo nesta fala.' },
];

const segmentEl = (container: HTMLElement, id: string) =>
  container.querySelector<HTMLElement>(`[data-segment="${id}"]`) as HTMLElement;
const textEl = (container: HTMLElement, id: string) =>
  container.querySelector<HTMLElement>(`[data-segment-text="${id}"]`) as HTMLElement;

describe('formatTimestamp', () => {
  it('usa mm:ss e passa a h:mm:ss a partir de 1 h', () => {
    expect(formatTimestamp(0)).toBe('00:00');
    expect(formatTimestamp(59_999)).toBe('00:59');
    expect(formatTimestamp(754_000)).toBe('12:34');
    expect(formatTimestamp(3_600_000)).toBe('1:00:00');
    expect(formatTimestamp(3_725_000)).toBe('1:02:05');
  });
});

describe('TranscriptViewer', () => {
  it('agrupa falas seguidas do mesmo falante e só mostra tempo quando existe', () => {
    const { container } = render(<TranscriptViewer label="Transcrição" segments={SEGMENTS} />);
    expect(screen.getByRole('region', { name: 'Transcrição' })).toBeInTheDocument();
    // Cabeçalho visual uma vez por grupo; o nome também vai, oculto, em cada fala.
    expect(screen.getAllByText('Clara Souto')).toHaveLength(1);
    expect(screen.getAllByText('Tiago Rezende')).toHaveLength(1);
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getByText('00:12')).toBeInTheDocument();
    expect(screen.getByText('1:02:05')).toBeInTheDocument();
    expect(segmentEl(container, 's5').querySelector('time')).toBeNull();
  });

  it('busca sem acento, conta e navega entre ocorrências', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    const { container } = render(
      <TranscriptViewer label="Transcrição" segments={SEGMENTS} onQueryChange={onQueryChange} />,
    );
    const field = screen.getByRole('searchbox', { name: 'Buscar na transcrição' });
    await user.type(field, 'couro');
    expect(onQueryChange).toHaveBeenLastCalledWith('couro');
    expect(screen.getByText('1 de 3')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Ocorrência 1 de 3');
    const marks = () => Array.from(container.querySelectorAll('mark'));
    expect(marks()).toHaveLength(3);
    expect(marks()[0]).toHaveAttribute('data-current');

    await user.keyboard('{Enter}');
    expect(screen.getByText('2 de 3')).toBeInTheDocument();
    expect(marks()[1]).toHaveAttribute('data-current');
    expect(marks()[0]).not.toHaveAttribute('data-current');

    await user.keyboard('{Shift>}{Enter}{/Shift}');
    expect(screen.getByText('1 de 3')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ocorrência anterior' }));
    expect(screen.getByText('3 de 3')).toBeInTheDocument();

    await user.clear(field);
    await user.type(field, 'catalogo');
    expect(screen.getByText('1 de 1')).toBeInTheDocument();
    expect(marks()[0]).toHaveTextContent('catálogo');

    await user.clear(field);
    await user.type(field, 'inexistente');
    expect(screen.getByRole('status')).toHaveTextContent('Nenhuma ocorrência');
    expect(screen.getByRole('button', { name: 'Próxima ocorrência' })).toBeDisabled();
  });

  it('filtra por falante pelo menu de orbes', async () => {
    const user = userEvent.setup();
    const onSpeakerFilterChange = vi.fn();
    render(
      <TranscriptViewer
        label="Transcrição"
        segments={SEGMENTS}
        onSpeakerFilterChange={onSpeakerFilterChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Falante: todos' }));
    const menu = await screen.findByRole('menu', { name: 'Filtrar por falante' });
    await user.click(within(menu).getByRole('menuitemradio', { name: /Tiago Rezende/ }));
    expect(onSpeakerFilterChange).toHaveBeenCalledWith('tiago');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Falante: Tiago Rezende' })).toBeInTheDocument();
  });

  it('marca falas usadas e a ativa, que entra em vista ao mudar', () => {
    const reveal = vi.mocked(HTMLElement.prototype.scrollIntoView);
    const { container, rerender } = render(
      <TranscriptViewer label="Transcrição" segments={SEGMENTS} usedIds={['s2']} activeId="s3" />,
    );
    expect(within(segmentEl(container, 's2')).getByText('Usado')).toBeInTheDocument();
    expect(within(segmentEl(container, 's1')).queryByText('Usado')).toBeNull();
    expect(segmentEl(container, 's3')).toHaveAttribute('aria-current', 'true');

    reveal.mockClear();
    rerender(
      <TranscriptViewer label="Transcrição" segments={SEGMENTS} usedIds={['s2']} activeId="s1" />,
    );
    expect(segmentEl(container, 's1')).toHaveAttribute('aria-current', 'true');
    expect(segmentEl(container, 's3')).not.toHaveAttribute('aria-current');
    expect(reveal).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' });
  });

  it('teclado: uma parada de Tab, setas, Home/End e Enter abre a fala', async () => {
    const user = userEvent.setup();
    const onSegmentClick = vi.fn();
    const { container } = render(
      <TranscriptViewer label="Transcrição" segments={SEGMENTS} onSegmentClick={onSegmentClick} />,
    );
    const first = segmentEl(container, 's1');
    expect(first).toHaveAttribute('tabindex', '0');
    expect(segmentEl(container, 's2')).toHaveAttribute('tabindex', '-1');

    act(() => first.focus());
    await user.keyboard('{ArrowDown}');
    expect(segmentEl(container, 's2')).toHaveFocus();
    expect(segmentEl(container, 's2')).toHaveAttribute('tabindex', '0');
    await user.keyboard('{End}');
    expect(segmentEl(container, 's5')).toHaveFocus();
    await user.keyboard('{Home}');
    expect(first).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onSegmentClick).toHaveBeenCalledWith(SEGMENTS[0]);

    await user.click(textEl(container, 's4'));
    expect(onSegmentClick).toHaveBeenLastCalledWith(SEGMENTS[3]);
  });

  it('seleção dentro de uma fala avisa os índices e abre a barra de ações', async () => {
    const user = userEvent.setup();
    const onSelectText = vi.fn();
    const quote = vi.fn();
    const { container } = render(
      <TranscriptViewer
        label="Transcrição"
        segments={SEGMENTS}
        onSelectText={onSelectText}
        selectionActions={[{ id: 'quote', label: 'Inserir citação', icon: Quote, onSelect: quote }]}
      />,
    );
    const text = textEl(container, 's3');
    const node = text.firstChild as Text;
    const range = document.createRange();
    range.setStart(node, 5);
    range.setEnd(node, 18);
    fireEvent.pointerDown(text);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
    fireEvent.pointerUp(text);

    const expected = { segmentId: 's3', start: 5, end: 18, text: SEGMENTS[2]!.text.slice(5, 18) };
    await waitFor(() => expect(onSelectText).toHaveBeenLastCalledWith(expected));
    const bar = await screen.findByRole('toolbar', { name: 'Ações do trecho' });
    await user.click(within(bar).getByRole('button', { name: 'Inserir citação' }));
    expect(quote).toHaveBeenCalledWith(expected);
    expect(onSelectText).toHaveBeenLastCalledWith(null);
  });

  it('⇧Enter seleciona a fala inteira e leva o foco às ações; Esc volta à fala', async () => {
    const user = userEvent.setup();
    const onSelectText = vi.fn();
    const { container } = render(
      <TranscriptViewer
        label="Transcrição"
        segments={SEGMENTS}
        onSelectText={onSelectText}
        selectionActions={[
          { id: 'quote', label: 'Inserir citação', icon: Quote, onSelect: () => {} },
        ]}
      />,
    );
    const segment = segmentEl(container, 's2');
    act(() => segment.focus());
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    const whole = SEGMENTS[1]!.text;
    expect(onSelectText).toHaveBeenLastCalledWith({
      segmentId: 's2',
      start: 0,
      end: whole.length,
      text: whole,
    });
    const action = await screen.findByRole('button', { name: 'Inserir citação' });
    await waitFor(() => expect(action).toHaveFocus());

    await user.keyboard('{Escape}');
    expect(onSelectText).toHaveBeenLastCalledWith(null);
    await waitFor(() => expect(segment).toHaveFocus());
  });

  it('com tempo atual, a fala que o contém fica ativa; a marca de tempo busca o ponto', async () => {
    const user = userEvent.setup();
    const onSeek = vi.fn();
    const { container } = render(
      <TranscriptViewer
        label="Transcrição"
        segments={SEGMENTS}
        currentTime={20_000}
        onSeek={onSeek}
      />,
    );
    expect(segmentEl(container, 's2')).toHaveAttribute('aria-current', 'true');
    await user.click(screen.getByRole('button', { name: 'Ir para 00:31' }));
    expect(onSeek).toHaveBeenCalledWith(31_000);
  });

  it('prévia compacta mostra só as primeiras falas e leva à transcrição completa', async () => {
    const user = userEvent.setup();
    const onExpand = vi.fn();
    render(
      <TranscriptViewer
        label="Prévia da transcrição"
        segments={SEGMENTS}
        variant="compact"
        limit={2}
        onExpand={onExpand}
      />,
    );
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('2 de 5 falas')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ver transcrição completa' }));
    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it('estados: carregando, vazio e erro com nova tentativa', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { rerender } = render(<TranscriptViewer label="Transcrição" segments={[]} loading />);
    expect(screen.getByRole('region', { name: 'Transcrição' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(screen.getByText('Carregando transcrição')).toBeInTheDocument();

    rerender(<TranscriptViewer label="Transcrição" segments={[]} />);
    expect(screen.getByText('Nenhuma fala')).toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).toBeNull();

    rerender(
      <TranscriptViewer
        label="Transcrição"
        segments={SEGMENTS}
        error="Não foi possível abrir a transcrição"
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText('Não foi possível abrir a transcrição')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Tentar de novo/ }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('acima de 200 falas renderiza só a janela, com posição e total para leitor de tela', () => {
    const many: TranscriptSegment[] = Array.from({ length: 500 }, (_, i) => ({
      id: `f${i}`,
      speaker: i % 3 === 0 ? marina : clara,
      start: i * 7_000,
      text: `Fala ${i + 1} da entrevista sobre couro vegetal.`,
    }));
    render(<TranscriptViewer label="Transcrição" segments={many} height={480} />);
    const items = screen.getAllByRole('listitem');
    expect(items.length).toBeLessThan(60);
    expect(items[0]).toHaveAttribute('aria-posinset', '1');
    expect(items[0]).toHaveAttribute('aria-setsize', '500');
  });
});
