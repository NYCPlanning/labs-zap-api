import {
  Controller,
  Header,
  Get,
  Post,
  Param,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { UseInterceptors } from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '../config/config.service';
import { ProjectService } from './project.service';
import { TilesService } from './tiles/tiles.service';
import { GeometriesService } from './geometries/geometries.service';
import { RecaptchaV2 } from 'express-recaptcha';


@Controller()
export class ProjectController {
  constructor(
    private projectService: ProjectService,
    private readonly config: ConfigService,
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

  @Post('/projects/feedback')
  async receiveFeedback(@Req() request: Request, @Res() response) {
    const recaptcha = new RecaptchaV2(this.config.get('RECAPTCHA_SITE_KEY'), this.config.get('RECAPTCHA_SECRET_KEY'));

    recaptcha.verify(request, async (error, data) => {
      if (!error) {
        const { projectid, projectname, text } = request.body;
        try {
          // sendFeedbackToGithubIssue uses octokit to create issues on our dcp-zap-data-feedback repository
          await this.projectService.sendFeedbackToGithubIssue(projectid, projectname, text);
            response.status(201).send({
              status: 'success',
          });
        } catch(error) {
          console.log('Error submitting feedback', error);
          response.status(500).send({
            status: 'error',
            error,
          });
        };
      } else {
        response.status(403).send({
          status: 'captcha invalid',
        });
      }
    });
  }
}
