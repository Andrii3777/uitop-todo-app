import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Category } from '../../src/category/category.entity';
import { CreateTodoDto } from '../../src/todo/dto/create-todo.dto';
import { Todo } from '../../src/todo/todo.entity';
import { TodoService } from '../../src/todo/todo.service';

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
      expect(em.count).toHaveBeenCalledWith(Todo, {
        where: { categoryId: 1, completed: false },
      });
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

    it('allows new task when category has 5 completed but 0 active', async () => {
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

      await expect(service.create(dto)).resolves.toMatchObject({ id: 1 });
      expect(em.count).toHaveBeenCalledWith(Todo, {
        where: { categoryId: 1, completed: false },
      });
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
