import { useEffect, useRef, useState } from 'react';
import type { Todo } from '@/lib/types';

interface Props {
  todo: Todo;
  selected: boolean;
  onToggleSelect: (id: number) => void;
  onComplete: (todo: Todo) => void;
  onUndoComplete: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
}

const DELETE_ANIMATION_MS = 220;

export default function TodoItem({
  todo,
  selected,
  onToggleSelect,
  onComplete,
  onUndoComplete,
  onDelete,
}: Props) {
  const deleteTimerRef = useRef<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isCompleting = todo.pendingAction === 'completing';
  const isBusy = isDeleting || isCompleting;

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current !== null) {
        window.clearTimeout(deleteTimerRef.current);
      }
    };
  }, []);

  const handleDelete = () => {
    if (isBusy) return;

    setIsDeleting(true);
    deleteTimerRef.current = window.setTimeout(() => {
      onDelete(todo);
    }, DELETE_ANIMATION_MS);
  };

  const handleComplete = () => {
    if (isDeleting) return;
    if (isCompleting) {
      onUndoComplete(todo);
      return;
    }
    if (todo.completed) return;
    onComplete(todo);
  };

  return (
    <li
      className={[
        'todo-item flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-[0_14px_40px_-32px_rgba(15,23,42,0.4)]',
        isDeleting ? 'todo-item--deleting' : '',
        isCompleting ? 'todo-item--completing' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelect(todo.id)}
        aria-label="Select task"
        disabled={isBusy || todo.completed}
        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <button
        type="button"
        onClick={handleComplete}
        aria-label={isCompleting ? 'Undo complete task' : 'Complete task'}
        aria-pressed={isCompleting || todo.completed}
        disabled={isDeleting}
        className="todo-complete-button flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-400 text-transparent transition-all duration-300 hover:border-emerald-500 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      >
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="todo-complete-icon h-3.5 w-3.5"
        >
          <path
            d="M3.5 8.5 6.5 11.5 12.5 4.5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </button>
      <div className="relative flex min-w-0 flex-1 items-center gap-3">
        <span className="todo-text min-w-0 flex-1 text-sm text-gray-900">{todo.text}</span>
        <span className="todo-badge rounded-full border border-transparent bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
          {todo.category?.name ?? todo.categoryId}
        </span>
        <span aria-hidden="true" className="todo-completion-line" />
      </div>
      <button
        type="button"
        onClick={handleDelete}
        aria-label="Delete task"
        disabled={isBusy}
        className="group inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-all duration-200 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-0"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.9"
        >
          <path d="M4 7h16" />
          <path d="M9 7V5.75A1.75 1.75 0 0 1 10.75 4h2.5A1.75 1.75 0 0 1 15 5.75V7" />
          <path d="M7.5 7 8.3 18.1A2 2 0 0 0 10.3 20h3.4a2 2 0 0 0 2-1.9L16.5 7" />
          <path d="M10 10.5v5" />
          <path d="M14 10.5v5" />
        </svg>
      </button>
    </li>
  );
}
