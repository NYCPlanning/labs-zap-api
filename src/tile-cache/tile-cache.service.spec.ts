import { Test, TestingModule } from '@nestjs/testing';
import { TileCacheService } from './tile-cache.service';

describe('TileCacheService', () => {
  let service: TileCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TileCacheService],
    }).compile();

    service = module.get<TileCacheService>(TileCacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
