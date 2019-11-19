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

import { transform } from '../_utils/transform-actions';
import { buildProjectsSQL } from '../_utils/build-projects-sql';
const { parse: json2csv } = require('json2csv');
const ogr2ogr = require('ogr2ogr');

// queries db and returns a FeatureCollection of the results
const getProjectsFeatureCollection = async (app, SQL) => {
  // const projects = await this.projectRepository.query(buildProjectsSQL(request)); ?
  // executes a query that can return any number of rows
  const projects = await app.db.any(SQL); // ERROR HERE "property db does not exist on type application"
  // rebuild as geojson FeatureCollection
  return {
    type: 'FeatureCollection',
    features: projects.map((project) => {
      const { geom } = project;
      const properties = { ...project };
      delete properties.geom;

      return {
        type: 'Feature',
        geometry: JSON.parse(geom),
        properties,
      };
    }),
  };
};

const createShapefile = FeatureCollection => ogr2ogr(FeatureCollection)
  .format('ESRI Shapefile')
  .skipfailures()
  .timeout(60000)
  .options(['-nln', 'projects']) // sets name of individual files in shapefile
  .stream();

@Controller('download')
export class DownloadController {
  @Get('/')
  // need to issue some kind of response by making a call on the response object (e.g. res.json() or res.send())
  async download(@Req() request: Request, @Res() response) {
    const { app, params } = request;
    const { filetype } = params;

    try {
      if (filetype === 'csv') {
        const SQL = buildProjectsSQL(request, 'csv_download');
        // executes a query that can return any number of rows
        const data = await app.db.any(SQL); // ERROR HERE "property db does not exist on type application"
        response.setHeader('Content-type', 'text/csv');

      if (data.length) {
        data.map(row => transform(row));
        const csv = json2csv(data, { highWaterMark: 16384, encoding: 'utf-8' });
        response.send(csv);
      } else {
        response.status(204).send();
      }
      } else { // spatial download
        const SQL = buildProjectsSQL(request, 'spatial_download');
        const FeatureCollection = await getProjectsFeatureCollection(app, SQL);
        if (filetype === 'shp') { // zipped shapefile
          response.setHeader('Content-disposition', 'attachment; filename=projects.zip');
          response.setHeader('Content-Type', 'application/zip');

          createShapefile(FeatureCollection).pipe(response);
        }
        if (filetype === 'geojson') { // geojson
          response.setHeader('Content-disposition', 'attachment; filename=projects.geojson');
          response.json(FeatureCollection);
        }
      }
    } catch (error) {
      console.log('Error downloading project data:', error); // eslint-disable-line
      response.status(500).json({ error: 'Unable to complete download' });
    }
  }
}
