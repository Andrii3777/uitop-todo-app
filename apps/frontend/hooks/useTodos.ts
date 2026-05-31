'use client';

import { useState, useCallback, useEffect } from 'react';
import { getCategories, getTodos } from '@/lib/api';
import { handleApiError } from '@/lib/apiErrorHandler';
import { ERROR_MESSAGES } from '@/lib/errorMessages';
import type { Todo, Category } from '@/lib/types';

interface UseTodosResult {
  todos: Todo[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  setTodos: React.Dispatch<React.SetStateAction<Todo[]>>;
  refetch: () => void;
  fetchByCategory: (categoryId: number | null) => Promise<void>;
}

export function useTodos(
  pendingIds: React.MutableRefObject<Set<number>>,
  initialTodos: Todo[] = [],
  initialCategories: Category[] = [],
): UseTodosResult {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(initialTodos.length === 0 && initialCategories.length === 0);
  const [error, setError] = useState<string | null>(null);

  const fetchByCategory = useCallback(
    async (categoryId: number | null) => {
      setLoading(true);
      setError(null);
      try {
        const todos = await getTodos(categoryId);
        setTodos(todos.filter((t) => !pendingIds.current.has(t.id)));
      } catch (err) {
        setError(ERROR_MESSAGES.FETCH_FAILED);
        handleApiError(err);
      } finally {
        setLoading(false);
      }
    },
    [pendingIds],
  );

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [todos, categories] = await Promise.all([
        getTodos(),
        getCategories(),
      ]);
      setTodos(todos.filter((t) => !pendingIds.current.has(t.id)));
      setCategories(categories);
    } catch (err) {
      setError(ERROR_MESSAGES.FETCH_FAILED);
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, [pendingIds]);

  useEffect(() => {
    // Only fetch if no initial data was provided
    if (initialTodos.length === 0 && initialCategories.length === 0) {
      fetchAll();
    }
  }, [fetchAll, initialTodos.length, initialCategories.length]);

  return { todos, categories, loading, error, setTodos, refetch: fetchAll, fetchByCategory };
}
