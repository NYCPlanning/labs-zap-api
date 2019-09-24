import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { UseInterceptors } from '@nestjs/common';
import { Request } from 'express';
import { ProjectService } from './project.service';

@Controller('projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  // Extract the raw Express instance and pass to the query method
  @Get()
  async index(@Req() request: Request) {
    return await this.projectService.queryProjects(request);
  }

  @Get(':id')
  async show(@Param() params) {
    return this.projectService.findOne(params.id);
  }
}
