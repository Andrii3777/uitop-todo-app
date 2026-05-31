import { renderHook, act, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useOptimisticRemoval } from '@/hooks/useOptimisticRemoval';
import type { Todo } from '@/lib/types';
import type React from 'react';

vi.mock('react-toastify', () => ({
  toast: vi.fn(),
}));

import { toast } from 'react-toastify';

const mockTodo = (id: number): Todo => ({
  id,
  text: `Task ${id}`,
  completed: false,
  categoryId: 1,
  category: { id: 1, name: 'Work' },
  createdAt: new Date().toISOString(),
});

type SetTodos = React.Dispatch<React.SetStateAction<Todo[]>>;

describe('useOptimisticRemoval', () => {
  let setTodos: ReturnType<typeof vi.fn> & SetTodos;
  let commitFn: () => Promise<void>;

  beforeEach(() => {
    setTodos = vi.fn() as unknown as ReturnType<typeof vi.fn> & SetTodos;
    commitFn = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    vi.clearAllMocks();
  });

  it('removes items from state immediately on remove()', () => {
    const { result } = renderHook(() => useOptimisticRemoval(setTodos as SetTodos));
    const items = [mockTodo(1)];

    act(() => {
      result.current.remove(items, 'Task completed', commitFn);
    });

    expect(setTodos).toHaveBeenCalledOnce();
    const updaterFn = vi.mocked(setTodos).mock.calls[0]![0] as (prev: Todo[]) => Todo[];
    const prev = [mockTodo(1), mockTodo(2)];
    const next = updaterFn(prev);
    expect(next).toHaveLength(1);
    expect(next[0]!.id).toBe(2);
  });

  it('calls toast with autoClose: 5000', () => {
    const { result } = renderHook(() => useOptimisticRemoval(setTodos as SetTodos));

    act(() => {
      result.current.remove([mockTodo(1)], 'Task completed', commitFn);
    });

    expect(toast).toHaveBeenCalledOnce();
    const options = vi.mocked(toast).mock.calls[0]![1] as { autoClose: number };
    expect(options.autoClose).toBe(5000);
  });

  it('calls commitFn when toast closes without Undo', () => {
    const { result } = renderHook(() => useOptimisticRemoval(setTodos as SetTodos));

    act(() => {
      result.current.remove([mockTodo(1)], 'Task completed', commitFn);
    });

    const options = vi.mocked(toast).mock.calls[0]![1] as { onClose: () => void };
    act(() => { options.onClose(); });

    expect(commitFn).toHaveBeenCalledOnce();
  });

  it('does not call commitFn when Undo is clicked before close', async () => {
    const { result } = renderHook(() => useOptimisticRemoval(setTodos as SetTodos));
    const items = [mockTodo(1)];

    act(() => {
      result.current.remove(items, 'Task completed', commitFn);
    });

    const renderProp = vi.mocked(toast).mock.calls[0]![0] as (props: { closeToast: () => void }) => React.ReactElement;
    const closeToast = vi.fn();
    const { getByText } = render(renderProp({ closeToast }));
    await userEvent.click(getByText('Undo'));

    const options = vi.mocked(toast).mock.calls[0]![1] as { onClose: () => void };
    act(() => { options.onClose(); });

    expect(commitFn).not.toHaveBeenCalled();
    expect(closeToast).toHaveBeenCalled();
  });

  it('restores items when Undo is clicked', async () => {
    const { result } = renderHook(() => useOptimisticRemoval(setTodos as SetTodos));
    const items = [mockTodo(1)];

    act(() => {
      result.current.remove(items, 'Task completed', commitFn);
    });

    const renderProp = vi.mocked(toast).mock.calls[0]![0] as (props: { closeToast: () => void }) => React.ReactElement;
    const closeToast = vi.fn();
    const { getByText } = render(renderProp({ closeToast }));
    await userEvent.click(getByText('Undo'));

    // setTodos called twice: once for remove, once for restore
    expect(setTodos).toHaveBeenCalledTimes(2);
    const restoreUpdater = vi.mocked(setTodos).mock.calls[1]![0] as (prev: Todo[]) => Todo[];
    const prev: Todo[] = [mockTodo(2)];
    const restored = restoreUpdater(prev);
    expect(restored).toHaveLength(2);
    expect(restored.some((t) => t.id === 1)).toBe(true);
  });

  it('handles rapid removal of two items independently', () => {
    const { result } = renderHook(() => useOptimisticRemoval(setTodos as SetTodos));

    act(() => {
      result.current.remove([mockTodo(1)], 'Task 1 completed', commitFn);
      result.current.remove([mockTodo(2)], 'Task 2 completed', commitFn);
    });

    expect(toast).toHaveBeenCalledTimes(2);

    const onClose1 = (vi.mocked(toast).mock.calls[0]![1] as { onClose: () => void }).onClose;
    act(() => { onClose1(); });
    expect(commitFn).toHaveBeenCalledTimes(1);

    const onClose2 = (vi.mocked(toast).mock.calls[1]![1] as { onClose: () => void }).onClose;
    act(() => { onClose2(); });
    expect(commitFn).toHaveBeenCalledTimes(2);
  });

  it('handles bulk removal — single toast, all items removed, all committed on close', () => {
    const { result } = renderHook(() => useOptimisticRemoval(setTodos as SetTodos));
    const items = [mockTodo(1), mockTodo(2), mockTodo(3)];

    act(() => {
      result.current.remove(items, '3 tasks completed', commitFn);
    });

    expect(toast).toHaveBeenCalledOnce();

    const updaterFn = vi.mocked(setTodos).mock.calls[0]![0] as (prev: Todo[]) => Todo[];
    const prev = [mockTodo(1), mockTodo(2), mockTodo(3), mockTodo(4)];
    const next = updaterFn(prev);
    expect(next).toHaveLength(1);
    expect(next[0]!.id).toBe(4);

    const onClose = (vi.mocked(toast).mock.calls[0]![1] as { onClose: () => void }).onClose;
    act(() => { onClose(); });
    expect(commitFn).toHaveBeenCalledOnce();
  });
});
