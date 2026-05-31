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
}

export function useTodos(): UseTodosResult {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [todosRes, categoriesRes] = await Promise.all([
        api.get<Todo[]>('/todos'),
        api.get<Category[]>('/categories'),
      ]);
      setTodos(todosRes.data);
      setCategories(categoriesRes.data);
    } catch {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { todos, categories, loading, error, setTodos, refetch: fetchAll };
}
