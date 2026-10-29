import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Dropzone } from './upload';

describe('accessible original-file selection', () => {
  it('exposes one keyboard control without nesting its native input', () => {
    const { container } = render(
      <Dropzone title="Choose original" spec="TXT" accept=".txt" onFiles={vi.fn()} />,
    );
    const button = screen.getByRole('button', { name: /Choose original/ });
    const input = container.querySelector('input[type=file]') as HTMLInputElement;
    expect(input.closest('button,[role=button],a[href]')).toBeNull();
    expect(input).toHaveAttribute('hidden');
    expect(input).toHaveAttribute('tabindex', '-1');
    const click = vi.spyOn(input, 'click').mockImplementation(() => {});
    button.focus();
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.keyDown(button, { key: ' ' });
    fireEvent.click(button);
    expect(click).toHaveBeenCalledTimes(3);
    expect(button).toHaveFocus();
  });
  it('retains extension and byte validation for native selections and drops', () => {
    const onFiles = vi.fn();
    const { container } = render(
      <Dropzone
        title="Choose original"
        spec="TXT"
        accept=".txt"
        maxSize={5}
        multiple
        onFiles={onFiles}
      />,
    );
    const input = container.querySelector('input[type=file]') as HTMLInputElement;
    const accepted = new File(['abc'], 'original.txt'),
      wrong = new File(['abc'], 'scan.pdf'),
      large = new File(['123456'], 'large.txt');
    const files = [accepted, wrong, large];
    fireEvent.change(input, { target: { files } });
    expect(onFiles).toHaveBeenLastCalledWith(
      [accepted],
      [
        { file: wrong, reason: 'type' },
        { file: large, reason: 'size' },
      ],
    );
    fireEvent.drop(screen.getByRole('button'), { dataTransfer: { files } });
    expect(onFiles).toHaveBeenCalledTimes(2);
    expect(onFiles).toHaveBeenLastCalledWith(
      [accepted],
      [
        { file: wrong, reason: 'type' },
        { file: large, reason: 'size' },
      ],
    );
  });
  it('does not open or accept files while disabled', () => {
    const onFiles = vi.fn(),
      { container } = render(<Dropzone spec="TXT" disabled onFiles={onFiles} />);
    const button = screen.getByRole('button'),
      input = container.querySelector('input') as HTMLInputElement;
    const click = vi.spyOn(input, 'click').mockImplementation(() => {});
    fireEvent.click(button);
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.drop(button, { dataTransfer: { files: [new File(['abc'], 'a.txt')] } });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(input).toBeDisabled();
    expect(click).not.toHaveBeenCalled();
    expect(onFiles).not.toHaveBeenCalled();
  });
});
