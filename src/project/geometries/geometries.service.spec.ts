import { Test, TestingModule } from '@nestjs/testing';
import { GeometriesService } from './geometries.service';

describe('GeometriesService', () => {
  let service: GeometriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeometriesService],
    }).compile();

    service = module.get<GeometriesService>(GeometriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
