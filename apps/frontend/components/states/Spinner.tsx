export default function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="glass-surface flex h-14 w-14 items-center justify-center rounded-full">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-white/55 border-t-blue-600" />
      </div>
    </div>
  );
}
