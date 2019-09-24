import * as path from 'path';
import * as pgp from 'pg-promise';

// imports a pgp SQL Queryfile
export function getQueryFile(file) {
  const fullPath = path.join(__dirname, '../_queries', file);
  return new pgp.QueryFile(fullPath, { minify: true });
};
