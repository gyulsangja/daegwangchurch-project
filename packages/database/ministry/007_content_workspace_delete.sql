-- CONTENT deletion applies only to public CMS sources. All pastoral domain operations stay denied.
BEGIN;
ALTER TABLE ministry.access_grants DROP CONSTRAINT content_role_limits;
ALTER TABLE ministry.access_grants ADD CONSTRAINT content_role_limits CHECK(role<>'CONTENT' OR (NOT care AND NOT can_print AND cardinality(organization_ids)=0 AND scope_year IS NULL));
ALTER TABLE ministry.access_invitations DROP CONSTRAINT content_invitation_limits;
ALTER TABLE ministry.access_invitations ADD CONSTRAINT content_invitation_limits CHECK(role<>'CONTENT' OR (NOT care AND NOT can_print AND cardinality(organization_ids)=0 AND scope_year IS NULL));
CREATE OR REPLACE FUNCTION ministry.access_validate(p jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,ministry AS $$
DECLARE c text:=current_setting('ministry.church_id',true); org text; y integer; n integer;
BEGIN
 IF p->>'role' NOT IN ('ADMIN','OFFICE','LEADER','CONTENT') OR p->>'role' IS NULL OR p->>'name' IS NULL OR length(p->>'name') NOT BETWEEN 1 AND 80
 OR jsonb_typeof(p->'organizations') IS DISTINCT FROM 'array' OR jsonb_array_length(p->'organizations')>100
 OR jsonb_typeof(p->'care') IS DISTINCT FROM 'boolean' OR jsonb_typeof(p->'print') IS DISTINCT FROM 'boolean'
 OR jsonb_typeof(p->'delete') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'ACCESS_INVALID'; END IF;
 SELECT count(DISTINCT value) INTO n FROM jsonb_array_elements_text(p->'organizations');
 IF n<>jsonb_array_length(p->'organizations') THEN RAISE EXCEPTION 'ACCESS_INVALID'; END IF;
 IF p->>'role'='CONTENT' THEN
  IF (p->>'care')::boolean OR (p->>'print')::boolean OR n<>0 OR p->>'year' IS NOT NULL THEN RAISE EXCEPTION 'ACCESS_INVALID'; END IF;
 ELSIF p->>'role'='LEADER' THEN
  IF (p->>'care')::boolean OR (p->>'delete')::boolean OR (p->>'print')::boolean OR n=0 THEN RAISE EXCEPTION 'ACCESS_INVALID'; END IF;
  SELECT (payload->>'year')::integer INTO y FROM ministry.years WHERE church_id=c AND payload->>'state'='ACTIVE';
  IF (p->>'year')::integer IS DISTINCT FROM y THEN RAISE EXCEPTION 'ACCESS_YEAR'; END IF;
  FOR org IN SELECT jsonb_array_elements_text(p->'organizations') LOOP
   IF NOT EXISTS(SELECT 1 FROM ministry.organizations WHERE church_id=c AND id=org) THEN RAISE EXCEPTION 'ACCESS_INVALID'; END IF;
  END LOOP;
 ELSIF n<>0 THEN RAISE EXCEPTION 'ACCESS_INVALID'; END IF;
END $$;
COMMIT;
