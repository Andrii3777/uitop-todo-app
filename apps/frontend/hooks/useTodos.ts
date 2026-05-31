'use client';

import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/api';
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
): UseTodosResult {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchByCategory = useCallback(
    async (categoryId: number | null) => {
      setLoading(true);
      setError(null);
      try {
        const params = categoryId ? { category: categoryId } : {};
        const res = await api.get<Todo[]>('/todos', { params });
        setTodos(res.data.filter((t) => !pendingIds.current.has(t.id)));
      } catch {
        setError('Failed to load data. Please try again.');
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
      const [todosRes, categoriesRes] = await Promise.all([
        api.get<Todo[]>('/todos'),
        api.get<Category[]>('/categories'),
      ]);
      setTodos(todosRes.data.filter((t) => !pendingIds.current.has(t.id)));
      setCategories(categoriesRes.data);
    } catch {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [pendingIds]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { todos, categories, loading, error, setTodos, refetch: fetchAll, fetchByCategory };
}
