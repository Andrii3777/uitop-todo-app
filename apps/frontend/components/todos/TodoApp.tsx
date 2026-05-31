'use client';

import { useState, useCallback, useRef } from 'react';
import { useTodos } from '@/hooks/useTodos';
import { useOptimisticRemoval } from '@/hooks/useOptimisticRemoval';
import { deleteTodo } from '@/lib/api';
import type { Todo, Category } from '@/lib/types';
import CreateTodoForm from './CreateTodoForm';
import TodoList from './TodoList';
import CategoryFilter from '@/components/categories/CategoryFilter';
import Spinner from '@/components/states/Spinner';
import ErrorMessage from '@/components/states/ErrorMessage';

interface Props {
  initialTodos: Todo[];
  initialCategories: Category[];
}

export default function TodoApp({ initialTodos, initialCategories }: Props) {
  const pendingIds = useRef<Set<number>>(new Set());
  const { todos, categories, loading, error, setTodos, fetchByCategory } = useTodos(
    pendingIds,
    initialTodos,
    initialCategories
  );
  const { remove, markDone, undoMarkDone } = useOptimisticRemoval(setTodos, pendingIds);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const handleCreated = (todo: Todo) => {
    if (selectedCategoryId !== null && todo.categoryId !== selectedCategoryId) {
      return;
    }
    setTodos((prev) => [todo, ...prev]);
  };

  const handleCategoryChange = async (id: number | null) => {
    setSelectedCategoryId(id);
    setSelectedIds(new Set());
    await fetchByCategory(id);
  };

  const handleComplete = useCallback((todo: Todo) => {
    markDone([todo], 'Task completed', async (items) => {
      await Promise.all(items.map((item) => deleteTodo(item.id)));
    });
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(todo.id);
      return next;
    });
  }, [markDone]);

  const handleUndoComplete = useCallback((todo: Todo) => {
    undoMarkDone(todo.id);
  }, [undoMarkDone]);

  const handleDelete = useCallback((todo: Todo) => {
    remove([todo], 'Task deleted', async () => {
      await deleteTodo(todo.id);
    });
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(todo.id);
      return next;
    });
  }, [remove]);

  const handleToggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const activeTodos = todos.filter((t) => !t.completed);

  const handleSelectAll = useCallback(() => {
    const allIds = activeTodos.map((t) => t.id);
    const allSelected = allIds.every((id) => selectedIds.has(id));
    setSelectedIds(allSelected ? new Set() : new Set(allIds));
  }, [activeTodos, selectedIds]);

  const handleBulkMarkDone = useCallback(() => {
    const selected = activeTodos.filter((t) => selectedIds.has(t.id));
    if (selected.length === 0) return;
    const count = selected.length;
    markDone(selected, `${count} task${count === 1 ? '' : 's'} completed`, async (items) => {
      await Promise.all(items.map((item) => deleteTodo(item.id)));
    });
    setSelectedIds(new Set());
  }, [activeTodos, selectedIds, markDone]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] text-center">
        Todo List
      </h1>

      {categories.length > 0 && (
        <div className="mb-4 space-y-4">
          <CreateTodoForm categories={categories} onCreated={handleCreated} />
          <CategoryFilter
            categories={categories}
            selectedId={selectedCategoryId}
            onChange={handleCategoryChange}
          />
        </div>
      )}

      {loading && <Spinner />}
      {!loading && error && <ErrorMessage message={error} />}
      {!loading && !error && (
        <TodoList
          todos={todos}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onComplete={handleComplete}
          onUndoComplete={handleUndoComplete}
          onDelete={handleDelete}
          onMarkDone={handleBulkMarkDone}
        />
      )}
    </div>
  );
}
