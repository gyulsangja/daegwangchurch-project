-- Authentication apps are opt-in. Permission writes require either AAL2 or fresh password verification.
BEGIN;
CREATE OR REPLACE FUNCTION ministry.access_admin() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,ministry AS $$
DECLARE c text:=current_setting('ministry.church_id',true); u uuid:=nullif(current_setting('ministry.user_id',true),'')::uuid;
BEGIN
 PERFORM 1 FROM ministry.churches WHERE id=c FOR UPDATE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM ministry.access_grants WHERE church_id=c AND user_id=u AND active AND role='ADMIN') THEN RAISE EXCEPTION 'ACCESS_FORBIDDEN'; END IF;
END $$;
-- Keep the implementation private; the public-to-runtime wrapper adds fresh authentication for every write.
ALTER FUNCTION ministry.access_change(jsonb) RENAME TO access_change_verified;
REVOKE ALL ON FUNCTION ministry.access_change_verified(jsonb) FROM PUBLIC;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='daegwang_ministry_runtime') THEN
  REVOKE ALL ON FUNCTION ministry.access_change_verified(jsonb) FROM daegwang_ministry_runtime;
 END IF;
END $$;
CREATE FUNCTION ministry.access_change(p jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,ministry AS $$
BEGIN
 PERFORM ministry.access_admin();
 IF current_setting('ministry.aal',true) IS DISTINCT FROM 'aal2' AND current_setting('ministry.reauthenticated',true) IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'ACCESS_REAUTH'; END IF;
 RETURN ministry.access_change_verified(p);
END $$;
REVOKE ALL ON FUNCTION ministry.access_change(jsonb) FROM PUBLIC;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='daegwang_ministry_runtime') THEN
  GRANT EXECUTE ON FUNCTION ministry.access_change(jsonb) TO daegwang_ministry_runtime;
 END IF;
END $$;
COMMIT;
