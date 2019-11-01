import { Test, TestingModule } from '@nestjs/testing';
import { TilesService } from './tiles.service';
import { Project } from '../project.entity';

import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('TilesService', () => {
  let service: TilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TilesService,
        {
          // how you provide the injection token in a test instance
          provide: getRepositoryToken(Project),
          // as a class value, Repository needs no generics
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<TilesService>(TilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
