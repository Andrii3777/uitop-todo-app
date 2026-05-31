'use client';

import { useState, useRef, useEffect } from 'react';
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
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateTodoDto>({
    defaultValues: { text: '', categoryId: categories[0]?.id },
  });

  const currentCategoryId = watch('categoryId');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedCategory =
    categories.find((c) => c.id === Number(currentCategoryId)) || categories[0];

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
          err.response.data?.errorDetails?.message ?? 
          err.response.data?.message ?? 
          'Invalid request';
        toast.error(message);
        setError('text', { message });
      } else {
        toast.error('Failed to create task');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <input
            {...register('text', { required: 'Task text is required' })}
            placeholder="New task..."
            className="glass-control w-full rounded-2xl px-5 py-3 text-sm text-white placeholder:text-white/50 focus:border-white/90 focus:outline-none focus:ring-2 focus:ring-blue-400/35"
          />
          {errors.text && (
            <p className="mt-2 pl-2 text-xs font-medium text-red-300">{errors.text.message}</p>
          )}
        </div>

        <div className="relative min-w-[9.5rem]" ref={dropdownRef}>
          <input type="hidden" {...register('categoryId')} />
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="glass-control flex w-full items-center justify-between gap-2 rounded-2xl px-4 py-3 text-sm text-white focus:border-white/90 focus:outline-none focus:ring-2 focus:ring-blue-400/35 cursor-pointer hover:bg-white/10 active:scale-[0.98] transition-all"
          >
            <span className="truncate font-semibold">{selectedCategory?.name}</span>
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`h-4.5 w-4.5 text-white/70 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
            >
              <path d="M5 7.5L10 12.5L15 7.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {isDropdownOpen && (
            <ul className="glass-surface absolute left-0 right-0 z-50 mt-2 max-h-60 overflow-y-auto rounded-2xl p-1.5 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-150">
              {categories.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('categoryId', c.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`flex w-full items-center rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all cursor-pointer text-left ${
                      c.id === selectedCategory?.id
                        ? 'glass-button-primary text-white font-bold shadow-md'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="glass-button-primary rounded-2xl px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </form>
  );
}
