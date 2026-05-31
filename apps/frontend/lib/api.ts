import axios from 'axios';
import axiosRetry from 'axios-retry';
import type { Category, CreateTodoDto, Todo } from './types';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export function getApiUrl(path: string): string {
  return new URL(path, API_BASE_URL).toString();
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

axiosRetry(api, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) &&
      error.config?.method === 'get'
    );
  },
});

export async function getTodos(categoryId?: number | null): Promise<Todo[]> {
  const response = await api.get<Todo[]>('/todos', {
    params: categoryId ? { category: categoryId } : undefined,
  });
  return response.data;
}

export async function getCategories(): Promise<Category[]> {
  const response = await api.get<Category[]>('/categories');
  return response.data;
}

export async function createTodo(dto: CreateTodoDto): Promise<Todo> {
  const response = await api.post<Todo>('/todos', dto);
  return response.data;
}

export async function deleteTodo(id: number): Promise<void> {
  await api.delete(`/todos/${id}`);
}

export default api;
