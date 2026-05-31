export interface Category {
  id: number;
  name: string;
}

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  categoryId: number;
  category: Category;
  createdAt: string;
}

export interface CreateTodoDto {
  text: string;
  categoryId: number;
}
