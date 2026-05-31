interface Props {
  message: string;
}

export default function ErrorMessage({ message }: Props) {
  return (
    <div className="glass-surface rounded-[28px] border-red-500/50 bg-red-950/40 p-4 text-sm font-medium text-red-200">
      {message}
    </div>
  );
}
