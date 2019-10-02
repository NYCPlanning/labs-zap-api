import { Req } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as nodeCache from 'node-cache';
import * as shortid from 'shortid';
import * as SphericalMercator from 'sphericalmercator';
import { InjectRepository } from '@nestjs/typeorm';
import * as pgp from 'pg-promise';
import { Project } from '../project.entity';
import { getQueryFile } from '../_utils/get-query-file';

const generateVectorTile = getQueryFile('/helpers/generate-vector-tile.sql');

@Injectable()
export class TilesService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>
  ) {}

  cache = new nodeCache({ stdTTL: 3600 });

  mercator = new SphericalMercator();

  get(key) {
    return this.cache.get(key);
  }

  set(key, value) {
    return this.cache.set(key, value);
  }

  generateTileId(tileSQL) {
    const tileId = shortid.generate();
    this.cache.set(tileId, tileSQL);

    return tileId;
  }

  async generateTile(type, tileId, x, y, z) {
    // retreive the projectids from the cache
    const tileQuery = await this.get(tileId);

    console.log(`TileID: ${tileId}; tileQuery: ${tileQuery}`);
    // calculate the bounding box for this tile
    const bbox = this.mercator.bbox(x, y, z, false, '900913');
    const geomColumn = (type === 'centroid') ? 'centroid_3857' : 'polygons_3857';
    const formattedQuery = pgp.as.format(generateVectorTile, [...bbox, tileQuery, geomColumn]);
    const [{ st_asmvt }] = await this.projectRepository.query(formattedQuery);

    return st_asmvt;
  }
}
