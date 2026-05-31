import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../category/category.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { Todo } from './todo.entity';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(Todo)
    private readonly todoRepo: Repository<Todo>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async create(dto: CreateTodoDto): Promise<Todo> {
    const category = await this.categoryRepo.findOneBy({ id: dto.categoryId });
    if (!category) {
      throw new BadRequestException(
        `Category ${dto.categoryId} does not exist`,
      );
    }

    const activeCount = await this.todoRepo.count({
      where: { categoryId: dto.categoryId, completed: false },
    });
    if (activeCount >= 5) {
      throw new BadRequestException(
        `Category ${category.name} already has 5 active tasks`,
      );
    }

    const todo = this.todoRepo.create({
      text: dto.text,
      categoryId: dto.categoryId,
    });
    const saved = await this.todoRepo.save(todo);
    return this.todoRepo.findOneByOrFail({ id: saved.id });
  }

  findAll(categoryId?: number): Promise<Todo[]> {
    if (categoryId !== undefined) {
      return this.todoRepo.find({ where: { categoryId } });
    }
    return this.todoRepo.find();
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
    const todo = await this.todoRepo.findOneBy({ id });
    if (!todo) {
      throw new NotFoundException(`Todo ${id} not found`);
    }
    await this.todoRepo.delete(id);
  }
}
