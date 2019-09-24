import { Controller, Header, Get, Param, Query, Req } from '@nestjs/common';
import { UseInterceptors } from '@nestjs/common';
import { Request } from 'express';
import { ProjectService } from './project.service';
import { TilesService } from './tiles/tiles.service';

@Controller('projects')
export class ProjectController {
  constructor(
    private projectService: ProjectService,
    private tilesService: TilesService,
  ) {}

  // Extract the raw Express instance and pass to the query method
  @Get()
  async index(@Req() request: Request) {
    return await this.projectService.queryProjects(request);
  }

  @Get(':id')
  async show(@Param() params) {
    return this.projectService.findOne(params.id);
  }

  @Get('/tiles/:tileId/:x/:y/:z')
  @Header('Content-Type', 'application/x-protobuf')
  async handleTileRequest(
    @Query('type') type,
    @Param('tileId') tileId,
    @Param('x') x,
    @Param('y') y,
    @Param('z') z,
  ) {
    return this.tilesService.generateTile(type, tileId, x, y, z);
  }
}
