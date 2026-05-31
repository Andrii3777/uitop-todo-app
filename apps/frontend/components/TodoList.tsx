import type { Todo } from '@/lib/types';
import TodoItem from './TodoItem';
import EmptyState from './states/EmptyState';

interface Props {
  todos: Todo[];
}

export default function TodoList({ todos }: Props) {
  const active = todos.filter((t) => !t.completed);

  if (active.length === 0) return <EmptyState />;

  return (
    <ul className="space-y-2">
      {active.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}
