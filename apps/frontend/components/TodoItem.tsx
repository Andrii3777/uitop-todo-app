import type { Todo } from '@/lib/types';

interface Props {
  todo: Todo;
}

export default function TodoItem({ todo }: Props) {
  return (
    <li className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-4 py-3">
      <span className="flex-1 text-sm text-gray-900">{todo.text}</span>
      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
        {todo.category?.name ?? todo.categoryId}
      </span>
    </li>
  );
}
