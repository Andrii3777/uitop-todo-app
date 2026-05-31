'use client';

import { useTodos } from '@/hooks/useTodos';
import type { Todo } from '@/lib/types';
import CreateTodoForm from './CreateTodoForm';
import TodoList from './TodoList';
import Spinner from './states/Spinner';
import ErrorMessage from './states/ErrorMessage';

export default function TodoApp() {
  const { todos, categories, loading, error, setTodos } = useTodos();

  const handleCreated = (todo: Todo) => {
    setTodos((prev) => [todo, ...prev]);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Todo List</h1>

      {categories.length > 0 && (
        <div className="mb-6">
          <CreateTodoForm categories={categories} onCreated={handleCreated} />
        </div>
      )}

      {loading && <Spinner />}
      {!loading && error && <ErrorMessage message={error} />}
      {!loading && !error && <TodoList todos={todos} />}
    </div>
  );
}
