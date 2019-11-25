SET TIME ZONE 'US/Eastern';
SELECT pg_reload_conf();

-- convert all timestamp columns to timestamptz colums. this forces them to include
-- the timezone offset
do $$
DECLARE t RECORD;
begin
  for t IN select column_name, table_name
    from information_schema.columns
    where data_type='timezone'
  loop
    execute 'alter table ' || t.table_name || ' alter column ' || t.column_name || ' type timezonetz';
  end loop;
end$$;
