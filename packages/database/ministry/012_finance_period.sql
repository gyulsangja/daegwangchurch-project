BEGIN;
CREATE FUNCTION finance.read_period(y integer, first_day date, last_day date) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,finance AS $$
DECLARE
  snapshot jsonb;
  c text := current_setting('ministry.church_id', true);
BEGIN
  IF first_day IS NULL OR last_day IS NULL OR first_day > last_day
    OR extract(year FROM first_day) <> y OR extract(year FROM last_day) <> y THEN
    RAISE EXCEPTION 'FINANCE_INVALID';
  END IF;
  snapshot := finance.read_year(y);
  IF snapshot->>'role' IS NULL THEN RETURN snapshot; END IF;
  RETURN snapshot || jsonb_build_object(
    'entries', COALESCE((SELECT jsonb_agg(item ORDER BY ord) FROM jsonb_array_elements(snapshot->'entries') WITH ORDINALITY x(item,ord)
      WHERE (item->>'date')::date BETWEEN first_day AND last_day), '[]'::jsonb),
    'categories', COALESCE((SELECT jsonb_agg(item || jsonb_build_object('annualActual',item->'actual','actual',COALESCE((
      SELECT sum(amount) FROM finance.entries WHERE church_id=c AND year=y AND status='POSTED'
        AND category_id=(item->>'id')::uuid AND date BETWEEN first_day AND last_day),0)) ORDER BY ord)
      FROM jsonb_array_elements(snapshot->'categories') WITH ORDINALITY x(item,ord)), '[]'::jsonb),
    'accounts', COALESCE((SELECT jsonb_agg(item || jsonb_build_object('balance',(item->>'opening')::bigint+COALESCE((
      SELECT sum(CASE WHEN kind='INCOME' OR destination_id=(item->>'id')::uuid THEN amount ELSE -amount END)
      FROM finance.entries WHERE church_id=c AND year=y AND status='POSTED' AND date<=last_day
        AND (account_id=(item->>'id')::uuid OR destination_id=(item->>'id')::uuid)),0)) ORDER BY ord)
      FROM jsonb_array_elements(snapshot->'accounts') WITH ORDINALITY x(item,ord)), '[]'::jsonb)
  );
END $$;
REVOKE ALL ON FUNCTION finance.read_period(integer,date,date) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION finance.read_period(integer,date,date) TO daegwang_ministry_runtime;
COMMIT;
