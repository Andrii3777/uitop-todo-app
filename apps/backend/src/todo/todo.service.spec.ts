import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from '../category/category.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { Todo } from './todo.entity';
import { TodoService } from './todo.service';

const mockTodoRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
  findOneByOrFail: jest.fn(),
  count: jest.fn(),
  delete: jest.fn(),
});

const mockCategoryRepo = () => ({
  findOneBy: jest.fn(),
});

const makeCategory = (id = 1, name = 'Work'): Category =>
  ({ id, name }) as Category;

const makeTodo = (overrides: Partial<Todo> = {}): Todo =>
  ({
    id: 1,
    text: 'Buy milk',
    completed: false,
    categoryId: 1,
    category: makeCategory(),
    createdAt: new Date(),
    ...overrides,
  }) as Todo;

describe('TodoService', () => {
  let service: TodoService;
  let todoRepo: jest.Mocked<ReturnType<typeof mockTodoRepo>>;
  let categoryRepo: jest.Mocked<ReturnType<typeof mockCategoryRepo>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodoService,
        { provide: getRepositoryToken(Todo), useFactory: mockTodoRepo },
        { provide: getRepositoryToken(Category), useFactory: mockCategoryRepo },
      ],
    }).compile();

    service = module.get(TodoService);
    todoRepo = module.get(getRepositoryToken(Todo));
    categoryRepo = module.get(getRepositoryToken(Category));
  });

  // ── create ───────────────────────────────────────────────

  describe('create', () => {
    const dto: CreateTodoDto = { text: 'Buy milk', categoryId: 1 };

    it('persists and returns todo for valid input (R1)', async () => {
      categoryRepo.findOneBy.mockResolvedValue(makeCategory());
      todoRepo.count.mockResolvedValue(0);
      const todo = makeTodo();
      todoRepo.create.mockReturnValue(todo);
      todoRepo.save.mockResolvedValue(todo);
      todoRepo.findOneByOrFail.mockResolvedValue(todo);

      const result = await service.create(dto);

      expect(categoryRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(todoRepo.count).toHaveBeenCalledWith({
        where: { categoryId: 1, completed: false },
      });
      expect(todoRepo.save).toHaveBeenCalled();
      expect(result).toEqual(todo);
    });

    it('throws 400 when category does not exist', async () => {
      categoryRepo.findOneBy.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('allows 5th active task in category (R6 boundary)', async () => {
      categoryRepo.findOneBy.mockResolvedValue(makeCategory());
      todoRepo.count.mockResolvedValue(4);
      const todo = makeTodo();
      todoRepo.create.mockReturnValue(todo);
      todoRepo.save.mockResolvedValue(todo);
      todoRepo.findOneByOrFail.mockResolvedValue(todo);

      await expect(service.create(dto)).resolves.toEqual(todo);
    });

    it('throws 400 when 6th active task in category (R6)', async () => {
      categoryRepo.findOneBy.mockResolvedValue(makeCategory());
      todoRepo.count.mockResolvedValue(5);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('allows new task when category has 5 completed + 0 active (KTD3)', async () => {
      categoryRepo.findOneBy.mockResolvedValue(makeCategory());
      // completed=false count is 0 — completed rows are ignored
      todoRepo.count.mockResolvedValue(0);
      const todo = makeTodo();
      todoRepo.create.mockReturnValue(todo);
      todoRepo.save.mockResolvedValue(todo);
      todoRepo.findOneByOrFail.mockResolvedValue(todo);

      await expect(service.create(dto)).resolves.toEqual(todo);
      expect(todoRepo.count).toHaveBeenCalledWith({
        where: { categoryId: 1, completed: false },
      });
    });
  });

  // ── findAll ──────────────────────────────────────────────

  describe('findAll', () => {
    it('returns all todos when no categoryId (R2)', async () => {
      const todos = [makeTodo(), makeTodo({ id: 2 })];
      todoRepo.find.mockResolvedValue(todos);

      const result = await service.findAll();

      expect(todoRepo.find).toHaveBeenCalledWith();
      expect(result).toEqual(todos);
    });

    it('returns only todos for given category (R5)', async () => {
      const todos = [makeTodo()];
      todoRepo.find.mockResolvedValue(todos);

      const result = await service.findAll(1);

      expect(todoRepo.find).toHaveBeenCalledWith({ where: { categoryId: 1 } });
      expect(result).toEqual(todos);
    });
  });

  // ── update ───────────────────────────────────────────────

  describe('update', () => {
    it('toggles completed to true and returns updated todo (R3)', async () => {
      const todo = makeTodo({ completed: false });
      todoRepo.findOneBy.mockResolvedValue(todo);
      const updated = { ...todo, completed: true } as Todo;
      todoRepo.save.mockResolvedValue(updated);

      const dto: UpdateTodoDto = { completed: true };
      const result = await service.update(1, dto);

      expect(todoRepo.save).toHaveBeenCalledWith({ ...todo, completed: true });
      expect(result.completed).toBe(true);
    });

    it('toggles completed back to false', async () => {
      const todo = makeTodo({ completed: true });
      todoRepo.findOneBy.mockResolvedValue(todo);
      const updated = { ...todo, completed: false } as Todo;
      todoRepo.save.mockResolvedValue(updated);

      const result = await service.update(1, { completed: false });

      expect(result.completed).toBe(false);
    });

    it('throws 404 for non-existent id', async () => {
      todoRepo.findOneBy.mockResolvedValue(null);

      await expect(service.update(99, { completed: true })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── remove ───────────────────────────────────────────────

  describe('remove', () => {
    it('hard-deletes existing todo (R4)', async () => {
      const todo = makeTodo();
      todoRepo.findOneBy.mockResolvedValue(todo);
      todoRepo.delete.mockResolvedValue({ affected: 1, raw: [] });

      await service.remove(1);

      expect(todoRepo.delete).toHaveBeenCalledWith(1);
    });

    it('throws 404 for non-existent id', async () => {
      todoRepo.findOneBy.mockResolvedValue(null);

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });
});
