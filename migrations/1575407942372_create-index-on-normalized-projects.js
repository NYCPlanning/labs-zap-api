/* eslint-disable camelcase */

exports.shorthands = undefined;

function dropIndexes(pgm) {
  pgm.dropIndex(
    'normalized_projects',
    'dcp_name',
    {
      name: 'dcp_name_idx',
    },
  );
}

exports.up = (pgm) => {
  // If the first run of the migration complains about indexes already existing, uncomment the following line:
  // dropIndexes(pgm);

  pgm.createIndex(
    'normalized_projects',
    'dcp_name',
    {
      name: 'dcp_name_idx',
      method: 'btree',
    },
  )
};

exports.down = (pgm) => {
  dropIndexes(pgm);
};
