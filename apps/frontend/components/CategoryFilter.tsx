import type { Category } from '@/lib/types';

interface Props {
  categories: Category[];
  selectedId: number | null;
  onChange: (id: number | null) => void;
}

export default function CategoryFilter({ categories, selectedId, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => onChange(null)}
        className={`rounded-full px-4 py-2 text-sm font-medium text-white transition-all ${
          selectedId === null
            ? 'glass-button-primary'
            : 'glass-chip hover:bg-white/15'
        }`}
      >
        All
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={`rounded-full px-4 py-2 text-sm font-medium text-white transition-all ${
            selectedId === c.id
              ? 'glass-button-primary'
              : 'glass-chip hover:bg-white/15'
          }`}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
