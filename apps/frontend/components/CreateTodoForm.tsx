'use client';

import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import axios from 'axios';
import api from '@/lib/api';
import type { Category, Todo, CreateTodoDto } from '@/lib/types';

interface Props {
  categories: Category[];
  onCreated: (todo: Todo) => void;
}

export default function CreateTodoForm({ categories, onCreated }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateTodoDto>({
    defaultValues: { text: '', categoryId: categories[0]?.id },
  });

  const onSubmit = async (data: CreateTodoDto) => {
    try {
      const res = await api.post<Todo>('/todos', {
        ...data,
        categoryId: Number(data.categoryId),
      });
      onCreated(res.data);
      reset({ text: '', categoryId: data.categoryId });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        const message: string =
          err.response.data?.message ?? 'Invalid request';
        toast.error(message);
        setError('text', { message });
      } else {
        toast.error('Failed to create task');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <input
            {...register('text', { required: 'Task text is required' })}
            placeholder="New task…"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.text && (
            <p className="mt-1 text-xs text-red-600">{errors.text.message}</p>
          )}
        </div>

        <select
          {...register('categoryId')}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </form>
  );
}
