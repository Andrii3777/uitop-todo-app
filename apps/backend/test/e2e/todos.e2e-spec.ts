import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { CategoryModule } from '../../src/category/category.module';
import { Category } from '../../src/category/category.entity';
import { TodoModule } from '../../src/todo/todo.module';
import { Todo } from '../../src/todo/todo.entity';

describe('Todos API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [Category, Todo],
          synchronize: true,
          autoLoadEntities: true,
        }),
        CategoryModule,
        TodoModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ── categories ───────────────────────────────────────────

  describe('GET /categories', () => {
    it('returns 4 seeded categories', async () => {
      const res = await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      const categories = res.body as { name: string }[];
      expect(categories).toHaveLength(4);
      expect(categories.map((c) => c.name)).toEqual(
        expect.arrayContaining(['Work', 'Personal', 'Shopping', 'Health']),
      );
    });
  });

  // ── full CRUD flow ────────────────────────────────────────

  describe('POST /todos', () => {
    it('creates a todo and returns 201 with the created todo (R1)', async () => {
      const res = await request(app.getHttpServer())
        .post('/todos')
        .send({ text: 'Write tests', categoryId: 1 })
        .expect(201);

      const created = res.body as {
        id: number;
        text: string;
        categoryId: number;
        completed: boolean;
      };
      expect(created).toMatchObject({
        text: 'Write tests',
        categoryId: 1,
        completed: false,
      });
      expect(created.id).toBeDefined();
    });

    it('returns 400 for missing text', async () => {
      await request(app.getHttpServer())
        .post('/todos')
        .send({ categoryId: 1 })
        .expect(400);
    });

    it('returns 400 for blank text', async () => {
      await request(app.getHttpServer())
        .post('/todos')
        .send({ text: '', categoryId: 1 })
        .expect(400);
    });

    it('returns 400 for text over 200 chars', async () => {
      await request(app.getHttpServer())
        .post('/todos')
        .send({ text: 'a'.repeat(201), categoryId: 1 })
        .expect(400);
    });

    it('returns 400 for non-existent categoryId', async () => {
      await request(app.getHttpServer())
        .post('/todos')
        .send({ text: 'Ghost task', categoryId: 9999 })
        .expect(400);
    });
  });

  describe('GET /todos', () => {
    it('returns all todos (R2)', async () => {
      const res = await request(app.getHttpServer()).get('/todos').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('filters by category (R5)', async () => {
      const res = await request(app.getHttpServer())
        .get('/todos?category=1')
        .expect(200);

      const todos = res.body as { categoryId: number }[];
      expect(todos.every((t) => t.categoryId === 1)).toBe(true);
    });
  });

  describe('DELETE /todos/:id', () => {
    it('hard-deletes a todo (R4)', async () => {
      const create = await request(app.getHttpServer())
        .post('/todos')
        .send({ text: 'Delete me', categoryId: 3 })
        .expect(201);

      const id = (create.body as { id: number }).id;

      await request(app.getHttpServer()).delete(`/todos/${id}`).expect(204);

      const list = await request(app.getHttpServer()).get('/todos').expect(200);
      const allTodos = list.body as { id: number }[];
      expect(allTodos.find((t) => t.id === id)).toBeUndefined();
    });

    it('returns 404 for non-existent id', async () => {
      await request(app.getHttpServer()).delete('/todos/99999').expect(404);
    });
  });

  // ── 5-per-category limit (R6) ─────────────────────────────

  describe('5-task limit per category', () => {
    const CAT_ID = 4; // Health — fresh, no other tests touch this category
    const createdIds: number[] = [];

    afterAll(async () => {
      // Cleanup: delete all tasks created in this suite
      for (const id of createdIds) {
        await request(app.getHttpServer()).delete(`/todos/${id}`);
      }
    });

    it('allows up to 5 active tasks (R6 boundary)', async () => {
      for (let i = 1; i <= 5; i++) {
        const res = await request(app.getHttpServer())
          .post('/todos')
          .send({ text: `Task ${i}`, categoryId: CAT_ID })
          .expect(201);
        createdIds.push((res.body as { id: number }).id);
      }
    });

    it('returns 400 on 6th active task in same category', async () => {
      const res = await request(app.getHttpServer())
        .post('/todos')
        .send({ text: 'Task 6 — should fail', categoryId: CAT_ID })
        .expect(400);

      expect((res.body as { message: string }).message).toContain('5 active');
    });

    it('allows new task after deleting one active task', async () => {
      const firstId = createdIds[0];
      await request(app.getHttpServer())
        .delete(`/todos/${firstId}`)
        .expect(204);

      const res = await request(app.getHttpServer())
        .post('/todos')
        .send({ text: 'New task after deletion', categoryId: CAT_ID })
        .expect(201);

      createdIds.push((res.body as { id: number }).id);
    });
  });
});
