import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CreateTodoForm from '@/components/CreateTodoForm';
import type { Category, Todo } from '@/lib/types';

vi.mock('@/lib/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock('react-toastify', () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

import api from '@/lib/api';
import { toast } from 'react-toastify';

const categories: Category[] = [
  { id: 1, name: 'Work' },
  { id: 2, name: 'Personal' },
];

const mockTodo: Todo = {
  id: 1,
  text: 'New task',
  completed: false,
  categoryId: 1,
  category: { id: 1, name: 'Work' },
  createdAt: new Date().toISOString(),
};

// Helper so TypeScript accepts the mock as the prop type
const asTodoCb = (fn: ReturnType<typeof vi.fn>) => fn as unknown as (todo: Todo) => void;

describe('CreateTodoForm', () => {
  let onCreated: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onCreated = vi.fn();
    vi.clearAllMocks();
  });

  it('renders text input, category select, and Add button', () => {
    render(<CreateTodoForm categories={categories} onCreated={asTodoCb(onCreated)} />);
    expect(screen.getByPlaceholderText('New task…')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('submitting empty text shows validation error, no API call', async () => {
    render(<CreateTodoForm categories={categories} onCreated={asTodoCb(onCreated)} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => {
      expect(screen.getByText('Task text is required')).toBeInTheDocument();
    });
    expect(api.post).not.toHaveBeenCalled();
  });

  it('successful submit calls onCreated and resets the form', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockTodo });
    render(<CreateTodoForm categories={categories} onCreated={asTodoCb(onCreated)} />);

    await userEvent.type(screen.getByPlaceholderText('New task…'), 'New task');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith(mockTodo);
    });
    expect(screen.getByPlaceholderText('New task…')).toHaveValue('');
  });

  it('400 response shows backend error via toast and inline error', async () => {
    const axiosError = {
      isAxiosError: true,
      response: { status: 400, data: { message: 'Category is full' } },
    };
    vi.mocked(api.post).mockRejectedValueOnce(axiosError);

    const axiosMod = await import('axios');
    vi.spyOn(axiosMod.default, 'isAxiosError').mockReturnValueOnce(true);

    render(<CreateTodoForm categories={categories} onCreated={asTodoCb(onCreated)} />);
    await userEvent.type(screen.getByPlaceholderText('New task…'), 'New task');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Category is full');
    });
    expect(onCreated).not.toHaveBeenCalled();
  });
});
