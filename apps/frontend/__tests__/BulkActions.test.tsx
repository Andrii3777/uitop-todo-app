import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import BulkActions from '@/components/todos/BulkActions';

describe('BulkActions', () => {
  it('renders nothing when selectedCount is 0', () => {
    const { container } = render(<BulkActions selectedCount={0} onMarkDone={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows selected count and Mark done button when items selected', () => {
    render(<BulkActions selectedCount={3} onMarkDone={() => {}} />);
    expect(screen.getByText('3 selected')).toBeInTheDocument();
    expect(screen.getByText('Mark done')).toBeInTheDocument();
  });

  it('calls onMarkDone when Mark done is clicked', async () => {
    const onMarkDone = vi.fn();
    render(<BulkActions selectedCount={2} onMarkDone={onMarkDone} />);
    await userEvent.click(screen.getByText('Mark done'));
    expect(onMarkDone).toHaveBeenCalledOnce();
  });

  it('shows singular count for 1 selected', () => {
    render(<BulkActions selectedCount={1} onMarkDone={() => {}} />);
    expect(screen.getByText('1 selected')).toBeInTheDocument();
  });
});
