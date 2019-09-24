import * as pgp from 'pg-promise';

export function generateDynamicQuery(queryFile, values) {
  return {
    toPostgres() { return pgp.as.format(queryFile, values); },
    rawType: true,
  };
};
