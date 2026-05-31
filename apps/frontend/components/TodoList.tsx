import type { Todo } from '@/lib/types';
import TodoItem from './TodoItem';
import EmptyState from './states/EmptyState';

interface Props {
  todos: Todo[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onSelectAll: () => void;
  onComplete: (todo: Todo) => void;
  onUndoComplete: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
}

export default function TodoList({
  todos,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onComplete,
  onUndoComplete,
  onDelete,
}: Props) {
  const visibleTodos = todos.filter((t) => !t.completed || t.pendingAction === 'completing');
  const selectableTodos = visibleTodos.filter((t) => !t.completed);

  if (visibleTodos.length === 0) return <EmptyState />;

  const allSelected =
    selectableTodos.length > 0 && selectableTodos.every((t) => selectedIds.has(t.id));

  return (
    <div>
      {selectableTodos.length > 0 && (
        <div className="mb-2 flex items-center gap-2">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onSelectAll}
            aria-label="Select all tasks"
            className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600"
          />
          <span className="text-sm text-gray-500">Select all</span>
        </div>
      )}
      <ul className="space-y-2">
        {visibleTodos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            selected={selectedIds.has(todo.id)}
            onToggleSelect={onToggleSelect}
            onComplete={onComplete}
            onUndoComplete={onUndoComplete}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </div>
  );
}
