import type { Category } from '@/lib/types';

interface Props {
  categories: Category[];
  selectedId: number | null;
  onChange: (id: number | null) => void;
}

export default function CategoryFilter({ categories, selectedId, onChange }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => onChange(null)}
        className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
          selectedId === null
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        All
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            selectedId === c.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
