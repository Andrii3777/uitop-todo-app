'use client';

import { useCallback } from 'react';
import { toast } from 'react-toastify';
import type { Todo } from '@/lib/types';
import React from 'react';

type SetTodos = React.Dispatch<React.SetStateAction<Todo[]>>;

export function useOptimisticRemoval(setTodos: SetTodos) {
  const remove = useCallback(
    (
      items: Todo[],
      message: string,
      commitFn: () => Promise<void>,
    ) => {
      setTodos((prev) => prev.filter((t) => !items.some((r) => r.id === t.id)));

      let undone = false;

      const handleUndo = (closeToast: () => void) => {
        undone = true;
        setTodos((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const toRestore = items.filter((t) => !existingIds.has(t.id));
          return [...toRestore, ...prev];
        });
        closeToast();
      };

      toast(
        ({ closeToast }: { closeToast: () => void }) =>
          React.createElement(
            'div',
            { className: 'flex items-center justify-between gap-4' },
            React.createElement('span', null, message),
            React.createElement(
              'button',
              {
                onClick: () => handleUndo(closeToast),
                className: 'text-sm font-medium underline',
              },
              'Undo',
            ),
          ),
        {
          autoClose: 5000,
          onClose: () => {
            if (!undone) commitFn();
          },
        },
      );
    },
    [setTodos],
  );

  return { remove };
}
