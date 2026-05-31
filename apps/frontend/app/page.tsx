import TodoApp from '@/components/todos/TodoApp';
import type { Todo, Category } from '@/lib/types';
import { getApiUrl } from '@/lib/api';

async function fetchInitialData() {
  try {
    const [todosRes, categoriesRes] = await Promise.all([
      fetch(getApiUrl('/todos'), { cache: 'no-store' }),
      fetch(getApiUrl('/categories'), { cache: 'no-store' }),
    ]);

    if (!todosRes.ok || !categoriesRes.ok) {
      throw new Error('Failed to fetch initial data');
    }

    const todos: Todo[] = await todosRes.json();
    const categories: Category[] = await categoriesRes.json();

    return { todos, categories };
  } catch {
    return { todos: [], categories: [] };
  }
}

export default async function Home() {
  const { todos, categories } = await fetchInitialData();

  return <TodoApp initialTodos={todos} initialCategories={categories} />;
}
