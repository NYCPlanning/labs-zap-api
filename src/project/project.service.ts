import * as pgp from 'pg-promise';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Serializer } from 'jsonapi-serializer';
import { Query } from '@nestjs/common';
import { paginate, Pagination, IPaginationOptions } from 'nestjs-typeorm-paginate';
import { Request } from 'express';
import { bbox, buffer, point } from '@turf/turf';
import { ConfigService } from '../config/config.service';
import { TilesService } from './tiles/tiles.service';
import { getQueryFile } from './_utils/get-query-file';
import { buildProjectsSQL } from './_utils/build-projects-sql';
import { Project } from './project.entity';

const boundingBoxQuery = getQueryFile('helpers/bounding-box-query.sql');
const tileQuery = getQueryFile('helpers/tile-query.sql');

function extractMeta(projects = []) {
  const [{ total_projects: total = 0 } = {}] = projects;
  const { length: pageTotal = 0 } = projects;

  return { total, pageTotal };
}

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly config: ConfigService,
    private readonly tiles: TilesService,
  ) {}

  async findOne(id: string): Promise<Project> {
    const record = await this.projectRepository.findOne({ dcp_name: id });

    return this.serialize(record);
  }

  // TODO: Use the ORM for this instead of buildProjectsSQL
  async queryProjects(request: Request) {
    const projects = await this.projectRepository.query(buildProjectsSQL(request));
    let meta = extractMeta(projects);

    const { query: { page = '1' } } = request;

    if (page === '1') {
      const metaForTiles = await this.generateTilesForQuery(projects, request);
      meta = { ...meta, ...metaForTiles };
    }

    return this.serialize(projects, meta);
  }

  async generateTilesForQuery(projects = [], request: Request) {
    let tileMeta = {};

    /*
     * ProjectIds query is extracted to enable a one-time generation of projectIds that meet the filter requirements.
     * These projectId strings are then injected into the tile query, which is later cached.
     * This speeds up tile generation by ensuring the expensive WHERE logic to determine matching projects is only run once.
     */
    const projectIds = await this.projectRepository.query(buildProjectsSQL(request, 'projectids'));
    const projectIdsString = projectIds.map(d => d.projectid).map(d => `'${d}'`).join(',');
    const tileSQL = pgp.as.format(tileQuery, { projectIds: projectIdsString });

    // create array of projects that have geometry
    const projectsWithGeometries = projects.filter(project => project.has_centroid);

    // get the bounds for projects with geometry
    // default to a bbox for the whole city
    // if project list has no geometries (projectsWithGeometries is 0) default to whole city
    let bounds = [[-74.2553345639348, 40.498580711525], [-73.7074928813077, 40.9141778017518]];

    if (projectsWithGeometries.length > 0) {
      let [computedBounds] = await this.projectRepository.query(
        pgp.as.format(boundingBoxQuery, { tileSQL })
      );
      bounds = computedBounds.bbox;
    }

    // if y coords are the same for both corners, the bbox is for a single point
    // to prevent fitBounds being lame, wrap a 600m buffer around the point
    if (bounds[0][0] === bounds[1][0]) {
      const turfPoint = point([
        bounds[0][0],
        bounds[0][1],
      ]);
      const tileBuffer = buffer(turfPoint, 0.4);
      const tileBbox = bbox(tileBuffer);

      bounds = [
        [tileBbox[0], tileBbox[1]],
        [tileBbox[2], tileBbox[3]],
      ];
    }

    const tileId = await this.tiles.generateTileId(tileSQL);

    return {
      tiles: [`${this.config.get('HOST')}/projects/tiles/${tileId}/{z}/{x}/{y}.mvt`],
      bounds,
    };
  }

  // Paginate a query. This isn't used yet, but should be in the future.
  // Currently, the raw query used in queryProjects is responsible for
  // pagination.
  async paginate(query): Promise<Pagination<Project>> {
    let { page, limit } = query;

    limit = limit > 100 ? 100 : limit;

    const {
      items,
      itemCount,
      totalItems,
      pageCount,
    } = await paginate<Project>(this.projectRepository, { page, limit });

    return this.serialize(items, {
      meta: {
        itemCount,
        totalItems,
        pageCount,
      },
    });
  }

  // Serializes an array of objects into a JSON:API document
  serialize(records, opts?: object): Serializer {
    const ProjectSerializer = new Serializer('projects', {
      id: 'dcp_name',
      attributes: this.projectRepository.metadata.columns.map(col => col.databaseName),
      meta: { ...opts },
    });

    return ProjectSerializer.serialize(records);
  }
}
