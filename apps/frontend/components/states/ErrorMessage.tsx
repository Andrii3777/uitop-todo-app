interface Props {
  message: string;
}

export default function ErrorMessage({ message }: Props) {
  return (
    <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
      {message}
    </div>
  );
}
