'use client';

import { useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { TOAST_AUTO_CLOSE_DURATION } from '@/lib/constants';
import type { Todo } from '@/lib/types';
import React from 'react';

type SetTodos = React.Dispatch<React.SetStateAction<Todo[]>>;
type PendingIds = React.MutableRefObject<Set<number>>;
type CompleteCommitFn = (items: Todo[]) => Promise<void>;
type PendingCompletionGroup = {
  items: Map<number, Todo>;
  toastId: number | string | null;
};

function undoToast(
  message: string,
  onUndo: (closeToast: () => void) => void,
  onClose: () => void,
) {
  return toast(
    ({ closeToast }: { closeToast: () => void }) =>
      React.createElement(
        'div',
        { className: 'flex items-center justify-between gap-4 w-full' },
        React.createElement('span', { className: 'text-sm font-semibold text-white' }, message),
        React.createElement(
          'button',
          {
            onClick: () => onUndo(closeToast),
            className: 'glass-button-primary rounded-xl px-4 py-1.5 text-xs font-bold text-white transition-all cursor-pointer hover:-translate-y-0.5 hover:scale-105 active:scale-95 shadow-md flex-shrink-0',
          },
          'Undo',
        ),
      ),
    { autoClose: TOAST_AUTO_CLOSE_DURATION, onClose },
  );
}

export function useOptimisticRemoval(setTodos: SetTodos, pendingIds: PendingIds) {
  const completionGroups = useRef(new Map<number, PendingCompletionGroup>());

  // Delete: remove from the list immediately; commit (or undo-restore) after 5s.
  const remove = useCallback(
    (items: Todo[], message: string, commitFn: () => Promise<void>) => {
      setTodos((prev) => prev.filter((t) => !items.some((r) => r.id === t.id)));
      items.forEach((i) => pendingIds.current.add(i.id));

      let undone = false;

      undoToast(
        message,
        (closeToast) => {
          undone = true;
          items.forEach((i) => pendingIds.current.delete(i.id));
          setTodos((prev) => {
            const existingIds = new Set(prev.map((t) => t.id));
            const toRestore = items.filter((t) => !existingIds.has(t.id));
            return [...toRestore, ...prev];
          });
          closeToast();
        },
        () => {
          if (!undone) {
            commitFn().finally(() => {
              items.forEach((i) => pendingIds.current.delete(i.id));
            });
          }
        },
      );
    },
    [setTodos, pendingIds],
  );

  // Complete: mark visually for 5s, then remove + DELETE. Undo keeps as active.
  const markDone = useCallback(
    (items: Todo[], message: string, commitFn: CompleteCommitFn) => {
      setTodos((prev) =>
        prev.map((todo) =>
          items.some((item) => item.id === todo.id)
            ? { ...todo, completed: true, pendingAction: 'completing' }
            : todo,
        ),
      );

      const group: PendingCompletionGroup = {
        items: new Map(items.map((item) => [item.id, item])),
        toastId: null,
      };

      items.forEach((item) => {
        completionGroups.current.set(item.id, group);
      });

      const undoGroup = (closeToast?: () => void) => {
        const remainingItems = Array.from(group.items.values());
        if (remainingItems.length === 0) {
          if (closeToast) closeToast();
          else if (group.toastId !== null) toast.dismiss(group.toastId);
          return;
        }

        remainingItems.forEach((item) => completionGroups.current.delete(item.id));
        group.items.clear();

        setTodos((prev) =>
          prev.map((todo) =>
            remainingItems.some((item) => item.id === todo.id)
              ? { ...todo, completed: false, pendingAction: undefined }
              : todo,
          ),
        );

        if (closeToast) closeToast();
        else if (group.toastId !== null) toast.dismiss(group.toastId);
      };

      group.toastId = undoToast(
        message,
        (closeToast) => {
          undoGroup(closeToast);
        },
        () => {
          const itemsToCommit = Array.from(group.items.values());
          if (itemsToCommit.length === 0) return;

          itemsToCommit.forEach((item) => pendingIds.current.add(item.id));
          commitFn(itemsToCommit).finally(() => {
            setTodos((prev) =>
              prev.filter((todo) => !itemsToCommit.some((item) => item.id === todo.id)),
            );
            itemsToCommit.forEach((item) => {
              pendingIds.current.delete(item.id);
              completionGroups.current.delete(item.id);
            });
          });
        },
      );
    },
    [pendingIds, setTodos],
  );

  const undoMarkDone = useCallback(
    (todoId: number) => {
      const group = completionGroups.current.get(todoId);
      const item = group?.items.get(todoId);

      if (!group || !item) return;

      group.items.delete(todoId);
      completionGroups.current.delete(todoId);

      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === todoId
            ? { ...todo, completed: false, pendingAction: undefined }
            : todo,
        ),
      );

      if (group.items.size === 0 && group.toastId !== null) {
        toast.dismiss(group.toastId);
      }
    },
    [setTodos],
  );

  return { remove, markDone, undoMarkDone };
}
