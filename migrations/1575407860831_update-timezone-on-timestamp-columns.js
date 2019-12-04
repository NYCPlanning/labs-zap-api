/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql("SET TIME ZONE 'US/Eastern'");
  pgm.sql("SELECT pg_reload_conf();");

  // convert all timestamp columns to timestamptz colums. this forces them to include
  // the timezone offset
  // TODO: refactor this to javascript
  var convertToTimestamptzSQL =  "do $$\r\n";
      convertToTimestamptzSQL += "DECLARE t RECORD;\r\n";
      convertToTimestamptzSQL += "begin"
      convertToTimestamptzSQL += "  for t IN select column_name, table_name\r\n"
      convertToTimestamptzSQL += "    from information_schema.columns\r\n"
      // TODO: debug the errors "type `timestampz` does not exist", and "cannot alter type of column used by view or rule"
      convertToTimestamptzSQL += "    where data_type='timestamp'\r\n"
      convertToTimestamptzSQL += "  loop\r\n"
      convertToTimestamptzSQL += "    execute 'alter table ' || t.table_name || ' alter column ' || t.column_name || ' type timestampz';\r\n"
      convertToTimestamptzSQL += "  end loop;\r\n"
      convertToTimestamptzSQL += "end$$;\r\n"

  pgm.sql(convertToTimestamptzSQL);
};

exports.down = (pgm) => {

};