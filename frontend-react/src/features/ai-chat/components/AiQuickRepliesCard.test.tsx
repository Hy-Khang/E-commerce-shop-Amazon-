import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AiQuickRepliesCard } from './AiQuickRepliesCard';

describe('AiQuickRepliesCard', () => {
  const options = [
    { label: 'Đen', value: 'Màu Đen' },
    { label: 'Trắng', value: 'Màu Trắng' },
  ];

  it('sends the option value on click, then locks the row (no double send)', () => {
    const onPick = vi.fn();
    render(<AiQuickRepliesCard prompt="Pick a colour" options={options} onPick={onPick} />);

    expect(screen.getByText('Pick a colour')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Đen' }));
    expect(onPick).toHaveBeenCalledWith('Màu Đen');

    // A second tap is ignored once a choice was made.
    fireEvent.click(screen.getByRole('button', { name: 'Trắng' }));
    expect(onPick).toHaveBeenCalledTimes(1);
  });

  it('is inert when not interactive (a superseded question) — no send, chips disabled', () => {
    const onPick = vi.fn();
    render(
      <AiQuickRepliesCard
        prompt="Pick a colour"
        options={options}
        onPick={onPick}
        interactive={false}
      />,
    );

    const chip = screen.getByRole('button', { name: 'Đen' });
    expect(chip).toBeDisabled();
    fireEvent.click(chip);
    expect(onPick).not.toHaveBeenCalled();
  });

  it('renders nothing when there are no options', () => {
    const { container } = render(<AiQuickRepliesCard options={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
