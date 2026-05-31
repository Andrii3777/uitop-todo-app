import type { Todo } from '@/lib/types';

interface Props {
  todo: Todo;
  selected: boolean;
  onToggleSelect: (id: number) => void;
  onComplete: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
}

export default function TodoItem({ todo, selected, onToggleSelect, onComplete, onDelete }: Props) {
  return (
    <li className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-4 py-3">
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelect(todo.id)}
        aria-label="Select task"
        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600"
      />
      <button
        onClick={() => onComplete(todo)}
        aria-label="Complete task"
        className="h-4 w-4 flex-shrink-0 rounded-full border-2 border-gray-400 hover:border-green-500 hover:bg-green-50"
      />
      <span className="flex-1 text-sm text-gray-900">{todo.text}</span>
      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
        {todo.category?.name ?? todo.categoryId}
      </span>
      <button
        onClick={() => onDelete(todo)}
        aria-label="Delete task"
        className="text-gray-400 hover:text-red-500"
      >
        ✕
      </button>
    </li>
  );
}
