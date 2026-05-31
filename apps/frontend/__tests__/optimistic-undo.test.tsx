import { renderHook, act, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useOptimisticRemoval } from '@/hooks/useOptimisticRemoval';
import type { Todo } from '@/lib/types';
import type React from 'react';

vi.mock('react-toastify', () => ({
  toast: Object.assign(vi.fn(() => 'toast-id'), {
    dismiss: vi.fn(),
  }),
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
  let commitFn: (items: Todo[]) => Promise<void>;
  let pendingIds: React.MutableRefObject<Set<number>>;

  beforeEach(() => {
    setTodos = vi.fn() as unknown as ReturnType<typeof vi.fn> & SetTodos;
    commitFn = vi.fn<(items: Todo[]) => Promise<void>>().mockResolvedValue(undefined);
    pendingIds = { current: new Set<number>() };
    vi.clearAllMocks();
  });

  it('removes items from state immediately on remove()', () => {
    const { result } = renderHook(() => useOptimisticRemoval(setTodos as SetTodos, pendingIds));
    const items = [mockTodo(1)];

    act(() => {
      result.current.remove(items, 'Task completed', async () => commitFn(items));
    });

    expect(setTodos).toHaveBeenCalledOnce();
    const updaterFn = vi.mocked(setTodos).mock.calls[0]![0] as (prev: Todo[]) => Todo[];
    const prev = [mockTodo(1), mockTodo(2)];
    const next = updaterFn(prev);
    expect(next).toHaveLength(1);
    expect(next[0]!.id).toBe(2);
  });

  it('calls toast with autoClose: 5000', () => {
    const { result } = renderHook(() => useOptimisticRemoval(setTodos as SetTodos, pendingIds));

    act(() => {
      result.current.remove([mockTodo(1)], 'Task completed', async () => commitFn([mockTodo(1)]));
    });

    expect(toast).toHaveBeenCalledOnce();
    const options = vi.mocked(toast).mock.calls[0]![1] as { autoClose: number };
    expect(options.autoClose).toBe(5000);
  });

  it('calls commitFn when toast closes without Undo', () => {
    const { result } = renderHook(() => useOptimisticRemoval(setTodos as SetTodos, pendingIds));

    act(() => {
      result.current.remove([mockTodo(1)], 'Task completed', async () => commitFn([mockTodo(1)]));
    });

    const options = vi.mocked(toast).mock.calls[0]![1] as { onClose: () => void };
    act(() => { options.onClose(); });

    expect(commitFn).toHaveBeenCalledOnce();
  });

  it('does not call commitFn when Undo is clicked before close', async () => {
    const { result } = renderHook(() => useOptimisticRemoval(setTodos as SetTodos, pendingIds));
    const items = [mockTodo(1)];

    act(() => {
      result.current.remove(items, 'Task completed', async () => commitFn(items));
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
    const { result } = renderHook(() => useOptimisticRemoval(setTodos as SetTodos, pendingIds));
    const items = [mockTodo(1)];

    act(() => {
      result.current.remove(items, 'Task completed', async () => commitFn(items));
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
    const { result } = renderHook(() => useOptimisticRemoval(setTodos as SetTodos, pendingIds));

    act(() => {
      result.current.remove([mockTodo(1)], 'Task 1 completed', async () => commitFn([mockTodo(1)]));
      result.current.remove([mockTodo(2)], 'Task 2 completed', async () => commitFn([mockTodo(2)]));
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
    const { result } = renderHook(() => useOptimisticRemoval(setTodos as SetTodos, pendingIds));
    const items = [mockTodo(1), mockTodo(2), mockTodo(3)];

    act(() => {
      result.current.remove(items, '3 tasks completed', async () => commitFn(items));
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

  // ── markDone (complete: stays in list for the 5s window) ──

  it('markDone marks items as completing immediately', () => {
    const { result } = renderHook(() => useOptimisticRemoval(setTodos as SetTodos, pendingIds));

    act(() => {
      result.current.markDone([mockTodo(1)], 'Task completed', commitFn);
    });

    expect(setTodos).toHaveBeenCalledOnce();
    const updaterFn = vi.mocked(setTodos).mock.calls[0]![0] as (prev: Todo[]) => Todo[];
    const next = updaterFn([mockTodo(1), mockTodo(2)]);
    expect(next[0]).toMatchObject({ id: 1, completed: true, pendingAction: 'completing' });
    expect(next[1]).toMatchObject({ id: 2, completed: false });
    expect(toast).toHaveBeenCalledOnce();
    const options = vi.mocked(toast).mock.calls[0]![1] as { autoClose: number };
    expect(options.autoClose).toBe(5000);
  });

  it('markDone commits and removes from state on close without Undo', async () => {
    const { result } = renderHook(() => useOptimisticRemoval(setTodos as SetTodos, pendingIds));

    act(() => {
      result.current.markDone([mockTodo(1)], 'Task completed', commitFn);
    });

    const onClose = (vi.mocked(toast).mock.calls[0]![1] as { onClose: () => void }).onClose;
    await act(async () => { onClose(); });

    expect(commitFn).toHaveBeenCalledOnce();
    expect(commitFn).toHaveBeenCalledWith([expect.objectContaining({ id: 1 })]);
    expect(setTodos).toHaveBeenCalledTimes(2);
    const initialUpdater = vi.mocked(setTodos).mock.calls[0]![0] as (prev: Todo[]) => Todo[];
    const marked = initialUpdater([mockTodo(1), mockTodo(2)]);
    expect(marked[0]).toMatchObject({ id: 1, completed: true, pendingAction: 'completing' });

    const updaterFn = vi.mocked(setTodos).mock.calls[1]![0] as (prev: Todo[]) => Todo[];
    const next = updaterFn([mockTodo(1), mockTodo(2)]);
    expect(next).toHaveLength(1);
    expect(next[0]!.id).toBe(2);
  });

  it('markDone reverts the task when Undo is clicked', async () => {
    const { result } = renderHook(() => useOptimisticRemoval(setTodos as SetTodos, pendingIds));

    act(() => {
      result.current.markDone([mockTodo(1)], 'Task completed', commitFn);
    });

    const renderProp = vi.mocked(toast).mock.calls[0]![0] as (props: { closeToast: () => void }) => React.ReactElement;
    const closeToast = vi.fn();
    const { getByText } = render(renderProp({ closeToast }));
    await userEvent.click(getByText('Undo'));

    const onClose = (vi.mocked(toast).mock.calls[0]![1] as { onClose: () => void }).onClose;
    act(() => { onClose(); });

    expect(commitFn).not.toHaveBeenCalled();
    expect(setTodos).toHaveBeenCalledTimes(2);
    const undoUpdater = vi.mocked(setTodos).mock.calls[1]![0] as (prev: Todo[]) => Todo[];
    const reverted = undoUpdater([
      { ...mockTodo(1), completed: true, pendingAction: 'completing' },
      mockTodo(2),
    ]);
    expect(reverted[0]).toMatchObject({ id: 1, completed: false, pendingAction: undefined });
    expect(closeToast).toHaveBeenCalled();
  });

  it('undoMarkDone reverts a completing task and dismisses its toast', () => {
    const { result } = renderHook(() => useOptimisticRemoval(setTodos as SetTodos, pendingIds));

    act(() => {
      result.current.markDone([mockTodo(1)], 'Task completed', commitFn);
    });

    act(() => {
      result.current.undoMarkDone(1);
    });

    expect(setTodos).toHaveBeenCalledTimes(2);
    const undoUpdater = vi.mocked(setTodos).mock.calls[1]![0] as (prev: Todo[]) => Todo[];
    const reverted = undoUpdater([
      { ...mockTodo(1), completed: true, pendingAction: 'completing' },
      mockTodo(2),
    ]);
    expect(reverted[0]).toMatchObject({ id: 1, completed: false, pendingAction: undefined });
    expect(toast.dismiss).toHaveBeenCalledWith('toast-id');
  });

  it('undoMarkDone removes only one task from a bulk completion commit', async () => {
    const { result } = renderHook(() => useOptimisticRemoval(setTodos as SetTodos, pendingIds));
    const first = mockTodo(1);
    const second = mockTodo(2);

    act(() => {
      result.current.markDone([first, second], '2 tasks completed', commitFn);
    });

    act(() => {
      result.current.undoMarkDone(1);
    });

    const onClose = (vi.mocked(toast).mock.calls[0]![1] as { onClose: () => void }).onClose;
    await act(async () => { onClose(); });

    expect(commitFn).toHaveBeenCalledOnce();
    expect(commitFn).toHaveBeenCalledWith([expect.objectContaining({ id: 2 })]);
  });
});
