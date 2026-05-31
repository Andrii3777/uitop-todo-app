import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Category } from '../category/category.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { Todo } from './todo.entity';
import { TodoService } from './todo.service';

const mockTodoRepo = () => ({
  find: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

const mockDataSource = () => ({
  transaction: jest.fn(),
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

const makeTxEm = (overrides: Record<string, jest.Mock> = {}) => ({
  findOneBy: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  ...overrides,
});

describe('TodoService', () => {
  let service: TodoService;
  let todoRepo: jest.Mocked<ReturnType<typeof mockTodoRepo>>;
  let dataSource: jest.Mocked<ReturnType<typeof mockDataSource>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodoService,
        { provide: getRepositoryToken(Todo), useFactory: mockTodoRepo },
        { provide: getRepositoryToken(Category), useFactory: () => ({}) },
        { provide: DataSource, useFactory: mockDataSource },
      ],
    }).compile();

    service = module.get(TodoService);
    todoRepo = module.get(getRepositoryToken(Todo));
    dataSource = module.get(DataSource);
  });

  // ── create ───────────────────────────────────────────────

  describe('create', () => {
    const dto: CreateTodoDto = { text: 'Buy milk', categoryId: 1 };

    it('persists and returns todo for valid input (R1)', async () => {
      const todo = makeTodo();
      const em = makeTxEm({
        findOneBy: jest.fn().mockResolvedValue(makeCategory()),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockReturnValue(todo),
        save: jest.fn().mockResolvedValue(todo),
      });
      dataSource.transaction.mockImplementation(
        (cb: (em: any) => Promise<any>) => cb(em),
      );

      const result = await service.create(dto);

      expect(em.findOneBy).toHaveBeenCalledWith(Category, { id: 1 });
      expect(em.count).toHaveBeenCalledWith(Todo, { where: { categoryId: 1 } });
      expect(em.save).toHaveBeenCalled();
      expect(result).toEqual(todo);
    });

    it('throws 400 when category does not exist', async () => {
      const em = makeTxEm({
        findOneBy: jest.fn().mockResolvedValue(null),
      });
      dataSource.transaction.mockImplementation(
        (cb: (em: any) => Promise<any>) => cb(em),
      );

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('allows 5th task in category (R6 boundary)', async () => {
      const todo = makeTodo();
      const em = makeTxEm({
        findOneBy: jest.fn().mockResolvedValue(makeCategory()),
        count: jest.fn().mockResolvedValue(4),
        create: jest.fn().mockReturnValue(todo),
        save: jest.fn().mockResolvedValue(todo),
      });
      dataSource.transaction.mockImplementation(
        (cb: (em: any) => Promise<any>) => cb(em),
      );

      await expect(service.create(dto)).resolves.toMatchObject({ id: 1 });
    });

    it('throws 400 when category already has 5 tasks (R6)', async () => {
      const em = makeTxEm({
        findOneBy: jest.fn().mockResolvedValue(makeCategory()),
        count: jest.fn().mockResolvedValue(5),
      });
      dataSource.transaction.mockImplementation(
        (cb: (em: any) => Promise<any>) => cb(em),
      );

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('counts completed tasks toward limit (all tasks count)', async () => {
      const em = makeTxEm({
        findOneBy: jest.fn().mockResolvedValue(makeCategory()),
        count: jest.fn().mockResolvedValue(5),
      });
      dataSource.transaction.mockImplementation(
        (cb: (em: any) => Promise<any>) => cb(em),
      );

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(em.count).toHaveBeenCalledWith(Todo, { where: { categoryId: 1 } });
    });
  });

  // ── findAll ──────────────────────────────────────────────

  describe('findAll', () => {
    it('returns all todos sorted by createdAt when no categoryId (R2)', async () => {
      const todos = [makeTodo(), makeTodo({ id: 2 })];
      todoRepo.find.mockResolvedValue(todos);

      const result = await service.findAll();

      expect(todoRepo.find).toHaveBeenCalledWith({
        where: {},
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual(todos);
    });

    it('returns only todos for given category sorted by createdAt (R5)', async () => {
      const todos = [makeTodo()];
      todoRepo.find.mockResolvedValue(todos);

      const result = await service.findAll(1);

      expect(todoRepo.find).toHaveBeenCalledWith({
        where: { categoryId: 1 },
        order: { createdAt: 'ASC' },
      });
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
      todoRepo.delete.mockResolvedValue({ affected: 1, raw: [] });

      await service.remove(1);

      expect(todoRepo.delete).toHaveBeenCalledWith(1);
    });

    it('throws 404 for non-existent id', async () => {
      todoRepo.delete.mockResolvedValue({ affected: 0, raw: [] });

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });
});
