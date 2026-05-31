import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Category } from '../category/category.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { Todo } from './todo.entity';

const MAX_TODOS_PER_CATEGORY = 5;

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(Todo)
    private readonly todoRepo: Repository<Todo>,
    private readonly dataSource: DataSource,
  ) { }

  async create(dto: CreateTodoDto): Promise<Todo> {
    return this.dataSource.transaction(async (em) => {
      const category = await em.findOneBy(Category, { id: dto.categoryId });
      if (!category) {
        throw new BadRequestException(
          `Category ${dto.categoryId} does not exist`,
        );
      }

      const totalCount = await em.count(Todo, {
        where: { categoryId: dto.categoryId },
      });
      if (totalCount >= MAX_TODOS_PER_CATEGORY) {
        throw new BadRequestException(
          `Category ${category.name} already has ${MAX_TODOS_PER_CATEGORY} tasks`,
        );
      }

      const todo = em.create(Todo, {
        text: dto.text,
        categoryId: dto.categoryId,
      });
      const saved = await em.save(todo);
      return { ...saved, category } as Todo;
    });
  }

  findAll(categoryId?: number): Promise<Todo[]> {
    const where = categoryId !== undefined ? { categoryId } : {};
    return this.todoRepo.find({ where, order: { createdAt: 'ASC' } });
  }

  async update(id: number, dto: UpdateTodoDto): Promise<Todo> {
    const todo = await this.todoRepo.findOneBy({ id });
    if (!todo) {
      throw new NotFoundException(`Todo ${id} not found`);
    }
    todo.completed = dto.completed;
    return this.todoRepo.save(todo);
  }

  async remove(id: number): Promise<void> {
    const result = await this.todoRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Todo ${id} not found`);
    }
  }
}
