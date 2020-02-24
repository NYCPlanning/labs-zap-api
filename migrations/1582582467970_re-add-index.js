/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createIndex(
    'normalized_projects',
    'dcp_name',
    {
      name: 'dcp_name_idx',
      method: 'btree',
    },
  );
};

exports.down = (pgm) => {
  pgm.dropIndex(
    'normalized_projects',
    'dcp_name',
    {
      name: 'dcp_name_idx',
    },
  );
};
