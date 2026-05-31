interface Props {
  selectedCount: number;
  onMarkDone: () => void;
}

export default function BulkActions({ selectedCount, onMarkDone }: Props) {
  if (selectedCount === 0) return null;

  return (
    <div className="glass-surface flex items-center gap-3 rounded-2xl px-4 py-3">
      <span className="text-sm font-medium text-white/90">{selectedCount} selected</span>
      <button
        onClick={onMarkDone}
        className="glass-button-primary rounded-xl px-3.5 py-1.5 text-sm font-medium text-white"
      >
        Mark done
      </button>
    </div>
  );
}
