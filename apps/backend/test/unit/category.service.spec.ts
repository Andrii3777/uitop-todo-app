import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from '../../src/category/category.entity';
import { CategoryService } from '../../src/category/category.service';

const mockCategoryRepo = () => ({
  count: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
});

describe('CategoryService', () => {
  let service: CategoryService;
  let repo: jest.Mocked<ReturnType<typeof mockCategoryRepo>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: getRepositoryToken(Category), useFactory: mockCategoryRepo },
      ],
    }).compile();

    service = module.get(CategoryService);
    repo = module.get(getRepositoryToken(Category));
  });

  describe('onModuleInit (seed)', () => {
    it('seeds 4 categories on fresh database', async () => {
      repo.count.mockResolvedValue(0);
      repo.save.mockResolvedValue([]);

      await service.onModuleInit();

      expect(repo.save).toHaveBeenCalledTimes(1);
      const [saved] = repo.save.mock.calls[0] as [{ name: string }[]];
      expect(saved).toHaveLength(4);
      expect(saved.map((c) => c.name)).toEqual([
        'Work',
        'Personal',
        'Shopping',
        'Health',
      ]);
    });

    it('skips seed when categories already exist (idempotent)', async () => {
      repo.count.mockResolvedValue(4);

      await service.onModuleInit();

      expect(repo.save).not.toHaveBeenCalled();
    });

    it('calling onModuleInit twice keeps count at 4 (idempotent restart)', async () => {
      // First call: fresh DB
      repo.count.mockResolvedValueOnce(0);
      repo.save.mockResolvedValueOnce([]);
      await service.onModuleInit();

      // Second call: DB now has data
      repo.count.mockResolvedValueOnce(4);
      await service.onModuleInit();

      expect(repo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('returns all categories', async () => {
      const categories = [
        { id: 1, name: 'Work' },
        { id: 2, name: 'Personal' },
      ] as Category[];
      repo.find.mockResolvedValue(categories);

      const result = await service.findAll();

      expect(result).toEqual(categories);
    });
  });
});
