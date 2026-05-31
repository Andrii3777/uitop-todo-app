import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';

const SEED_CATEGORIES = ['Work', 'Personal', 'Shopping', 'Health'];

@Injectable()
export class CategoryService implements OnModuleInit {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
  ) {}

  async onModuleInit() {
    const count = await this.repo.count();
    if (count === 0) {
      await this.repo.save(SEED_CATEGORIES.map((name) => ({ name })));
    }
  }

  findAll(): Promise<Category[]> {
    return this.repo.find();
  }
}
