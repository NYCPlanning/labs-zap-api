import {
  Controller,
  Header,
  Get,
  Param,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { UseInterceptors } from '@nestjs/common';
import { Request } from 'express';
import { ProjectService } from './project.service';
import { TilesService } from './tiles/tiles.service';
import { GeometriesService } from './geometries/geometries.service';

@Controller()
export class ProjectController {
  constructor(
    private projectService: ProjectService,
    private tilesService: TilesService,
    private geometriesService: GeometriesService,
  ) {}

  @Get('/projects/update-geometries/:id')
  async updateGeometries(@Param('id') id, @Query('API_KEY') apiKey) {
    const isValidKey = this.geometriesService.validateAPIKey(apiKey);
    const isValidID = this.geometriesService.validateProjectID(id);

    if (!isValidKey) return 'Invalid API_KEY';
    if (!isValidID) return 'Invalid Project ID';

    return await this.geometriesService.upsertGeoms(id);
  }

  @Get('/projects/new-filed')
  async synchronizeGeometries() {
    return await this.geometriesService.synchronizeGeoms();
  }

  // Extract the raw Express instance and pass to the query method
  @Get('/projects/')
  async index(@Req() request: Request) {
    return await this.projectService.queryProjects(request);
  }

  @Get('/projects/:id')
  async show(@Param() params) {
    return this.projectService.findOne(params.id);
  }

  @Get('/projects/tiles/:tileId/:z/:x/:y.mvt')
  async handleTileRequest(@Req() request: Request, @Res() response) {
    const { type } = request.query;
    const { tileId, x, y, z } = request.params;
    const tile = await this.tilesService.generateTile(type, tileId, x, y, z);

    response.setHeader('Content-Type', 'application/x-protobuf');

    if (tile.length === 0) {
      response.status(204);
    }
    response.send(tile);
  }

  @Get('/projects.csv')
  async download(@Param() params, @Req() request: Request, @Res() response) {
    // renable for now; enable other formats soon
    const filetype = 'csv';
    const csv = await this.projectService.handleDownload(request, filetype);

    response.setHeader('Content-type', 'text/csv');
    response.send(csv);
  }
}
