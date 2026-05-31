interface Props {
  selectedCount: number;
  onMarkDone: () => void;
}

export default function BulkActions({ selectedCount, onMarkDone }: Props) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-2">
      <span className="text-sm text-blue-700">{selectedCount} selected</span>
      <button
        onClick={onMarkDone}
        className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
      >
        Mark done
      </button>
    </div>
  );
}
