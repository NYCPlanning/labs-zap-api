import { Test, TestingModule } from '@nestjs/testing';
import { TilesService } from './tiles/tiles.service';
import { ProjectService } from './project.service';
import { GeometriesService } from './geometries/geometries.service';
import { ProjectController } from './project.controller';

describe('Project Controller', () => {
  let controller: ProjectController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        {
          provide: TilesService,
          // how you provide the injection token in a test instance
          useValue: new (class TilesServiceMock { }),
        },
        {
          provide: GeometriesService,
          // how you provide the injection token in a test instance
          useValue: new (class GeometriesServiceMock { }),
        },
        {
          provide: ProjectService,
          // how you provide the injection token in a test instance
          useValue: new (class ProjectServiceMock { }),
        },
      ],
    }).compile();

    controller = module.get<ProjectController>(ProjectController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
