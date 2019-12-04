import {
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { parse } from 'json2csv';
// const ogr2ogr = require('ogr2ogr');

// const buildProjectsSQL = require('../../utils/build-projects-sql');
import { transform } from './transform-actions';

// // queries db and returns a FeatureCollection of the results
// const getProjectsFeatureCollection = async (app, SQL) => {
//   const projects = await app.db.any(SQL);
//   // rebuild as geojson FeatureCollection
//   return {
//     type: 'FeatureCollection',
//     features: projects.map((project) => {
//       const { geom } = project;
//       const properties = { ...project };
//       delete properties.geom;

//       return {
//         type: 'Feature',
//         geometry: JSON.parse(geom),
//         properties,
//       };
//     }),
//   };
// };

// const createShapefile = FeatureCollection => ogr2ogr(FeatureCollection)
//   .format('ESRI Shapefile')
//   .skipfailures()
//   .timeout(60000)
//   .options(['-nln', 'projects']) // sets name of individual files in shapefile
//   .stream();


/* GET /projects/download.:filetype */
/* Downloads a file of projects that match the current query params and filetype */
export async function handleDownload(filetype, data) {
  try {
    if (filetype === 'csv') {
      // const SQL = buildProjectsSQL(req, 'csv_download');
      // const data = await app.db.any(SQL);
      // res.setHeader('Content-type', 'text/csv');

      if (data.length) {
        data.map(row => transform(row));

        return parse(data, { highWaterMark: 16384, encoding: 'utf-8' });
        // res.send(csv);
      } else {
        throw new HttpException({ error: 'No results' }, HttpStatus.NO_CONTENT);
        // res.status(204).send();
      }
    } 
  } catch (error) {
    console.log('Error downloading project data:', error); // eslint-disable-line
    throw new HttpException({ error }, HttpStatus.INTERNAL_SERVER_ERROR);
    // res.status(500).json({ error: 'Unable to complete download' });
  }
};
