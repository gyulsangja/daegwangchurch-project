BEGIN;
CREATE FUNCTION finance.giving_directory(y integer) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,finance AS $$
DECLARE period jsonb;
BEGIN
 IF coalesce(finance.context()->>'role','') NOT IN ('MANAGER','BOOKKEEPER','AUDITOR') THEN
   RAISE EXCEPTION 'FINANCE_FORBIDDEN';
 END IF;
 SELECT payload INTO period FROM ministry.years
 WHERE church_id=current_setting('ministry.church_id') AND id=y::text;
 RETURN jsonb_build_object(
   'positions', ARRAY(SELECT jsonb_build_object('id',p->>'code','label',p->>'label') FROM jsonb_array_elements(period->'positions') p),
   'organizations', ARRAY(SELECT jsonb_build_object('id',o->>'id','label',o->>'name') FROM jsonb_array_elements(period->'organizations') o),
   'members', ARRAY(SELECT jsonb_build_object('id',a->>'memberId','position',a->>'position','organizations',
     ARRAY(SELECT DISTINCT f->>'organizationId' FROM jsonb_array_elements(a->'affiliations') f))
     FROM jsonb_array_elements(period->'assignments') a));
END $$;
REVOKE ALL ON FUNCTION finance.giving_directory(integer) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION finance.giving_directory(integer) TO daegwang_ministry_runtime;
COMMIT;
