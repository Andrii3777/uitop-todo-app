import type { Todo } from '@/lib/types';
import TodoItem from './TodoItem';
import EmptyState from '@/components/states/EmptyState';

interface Props {
  todos: Todo[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onSelectAll: () => void;
  onComplete: (todo: Todo) => void;
  onUndoComplete: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  onMarkDone?: () => void;
}

export default function TodoList({
  todos,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onComplete,
  onUndoComplete,
  onDelete,
  onMarkDone,
}: Props) {
  const visibleTodos = todos.filter((t) => !t.completed || t.pendingAction === 'completing');
  const selectableTodos = visibleTodos.filter((t) => !t.completed);

  if (visibleTodos.length === 0) return <EmptyState />;

  const allSelected =
    selectableTodos.length > 0 && selectableTodos.every((t) => selectedIds.has(t.id));

  return (
    <div>
      {selectableTodos.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 min-h-[38px]">
          <div className="glass-chip inline-flex items-center gap-2 rounded-full px-3 py-2">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onSelectAll}
              aria-label="Select all tasks"
              className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400/25"
            />
            <span className="text-sm font-medium text-white/90">Select all</span>
          </div>

          {onMarkDone && selectedIds.size > 0 && (
            <div className="glass-surface flex items-center gap-3 rounded-full px-3.5 py-1">
              <span className="text-xs font-semibold text-white/90">{selectedIds.size} selected</span>
              <button
                onClick={onMarkDone}
                className="glass-button-primary rounded-lg px-2.5 py-1 text-xs font-bold text-white cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm"
              >
                Mark done
              </button>
            </div>
          )}
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
