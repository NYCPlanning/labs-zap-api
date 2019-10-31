import { Test, TestingModule } from '@nestjs/testing';
import { Project } from '../project.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigModule } from '../../config/config.module';
import { GeometriesService } from './geometries.service';

describe('GeometriesService', () => {
  let service: GeometriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule,
      ],
      providers: [
        GeometriesService,
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(Project),
          // as a class value, Repository needs no generics
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<GeometriesService>(GeometriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
