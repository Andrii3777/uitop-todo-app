import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TodoList from '@/components/TodoList';
import type { Todo } from '@/lib/types';

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: 1,
  text: 'Ship polished task animations',
  completed: false,
  categoryId: 1,
  category: { id: 1, name: 'Product' },
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe('TodoList', () => {
  it('keeps completing tasks visible during the undo window', () => {
    render(
      <TodoList
        todos={[
          makeTodo({ id: 1, completed: true, pendingAction: 'completing' }),
          makeTodo({ id: 2, text: 'Active task' }),
        ]}
        selectedIds={new Set()}
        onToggleSelect={vi.fn()}
        onSelectAll={vi.fn()}
        onComplete={vi.fn()}
        onUndoComplete={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('Ship polished task animations')).toBeInTheDocument();
    expect(screen.getByText('Active task')).toBeInTheDocument();
    expect(screen.getByLabelText('Select all tasks')).toBeInTheDocument();
  });

  it('hides select-all controls when only completing tasks remain', () => {
    render(
      <TodoList
        todos={[makeTodo({ completed: true, pendingAction: 'completing' })]}
        selectedIds={new Set()}
        onToggleSelect={vi.fn()}
        onSelectAll={vi.fn()}
        onComplete={vi.fn()}
        onUndoComplete={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('Ship polished task animations')).toBeInTheDocument();
    expect(screen.queryByLabelText('Select all tasks')).not.toBeInTheDocument();
  });

  it('lets the user undo a completing task from the same check button', async () => {
    const onUndoComplete = vi.fn();

    render(
      <TodoList
        todos={[makeTodo({ completed: true, pendingAction: 'completing' })]}
        selectedIds={new Set()}
        onToggleSelect={vi.fn()}
        onSelectAll={vi.fn()}
        onComplete={vi.fn()}
        onUndoComplete={onUndoComplete}
        onDelete={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByLabelText('Undo complete task'));

    expect(onUndoComplete).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, pendingAction: 'completing' }),
    );
  });
});
