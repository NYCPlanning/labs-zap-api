import { Controller, Get, Param, Query } from '@nestjs/common';
import { UseInterceptors } from '@nestjs/common';
import { ProjectService } from './project.service';

@Controller('projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Get()
  async index(@Query() query: object) {
    return await this.projectService.queryProjects(query);
  }

  @Get(':id')
  async show(@Param() params) {
    return this.projectService.findOne(params.id);
  }
}
