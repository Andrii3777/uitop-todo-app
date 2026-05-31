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
        'todo-item glass-surface glass-surface--strong flex items-center gap-3 rounded-[28px] px-5 py-4 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.55)] hover:-translate-y-0.5',
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
        className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400/25 disabled:cursor-not-allowed"
      />
      <button
        type="button"
        onClick={handleComplete}
        aria-label={isCompleting ? 'Undo complete task' : 'Complete task'}
        aria-pressed={isCompleting || todo.completed}
        disabled={isDeleting}
        className="todo-complete-button flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-white/40 bg-white/10 text-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-sm transition-all duration-300 hover:border-emerald-400 hover:bg-white/20 disabled:cursor-not-allowed disabled:hover:bg-transparent"
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
        <span className="todo-text min-w-0 flex-1 text-sm font-medium text-white">{todo.text}</span>
        <span className="todo-badge glass-chip rounded-full px-2.5 py-1 text-xs text-white/80">
          {todo.category?.name ?? todo.categoryId}
        </span>
        <span aria-hidden="true" className="todo-completion-line" />
      </div>
      <button
        type="button"
        onClick={handleDelete}
        aria-label="Delete task"
        disabled={isBusy}
        className="group inline-flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-all duration-200 hover:bg-white/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-0"
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
