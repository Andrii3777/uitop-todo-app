import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import CategoryFilter from '@/components/CategoryFilter';
import type { Category } from '@/lib/types';

const categories: Category[] = [
  { id: 1, name: 'Work' },
  { id: 2, name: 'Personal' },
];

describe('CategoryFilter', () => {
  it('renders All button and all category buttons', () => {
    render(<CategoryFilter categories={categories} selectedId={null} onChange={() => {}} />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  it('calls onChange(null) when All is clicked', async () => {
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedId={1} onChange={onChange} />);
    await userEvent.click(screen.getByText('All'));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('calls onChange(id) when a category button is clicked', async () => {
    const onChange = vi.fn();
    render(<CategoryFilter categories={categories} selectedId={null} onChange={onChange} />);
    await userEvent.click(screen.getByText('Work'));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('highlights the selected category', () => {
    render(<CategoryFilter categories={categories} selectedId={2} onChange={() => {}} />);
    const personalBtn = screen.getByText('Personal');
    expect(personalBtn.className).toContain('bg-blue-600');
    const workBtn = screen.getByText('Work');
    expect(workBtn.className).not.toContain('bg-blue-600');
  });

  it('highlights All when selectedId is null', () => {
    render(<CategoryFilter categories={categories} selectedId={null} onChange={() => {}} />);
    const allBtn = screen.getByText('All');
    expect(allBtn.className).toContain('bg-blue-600');
  });
});
