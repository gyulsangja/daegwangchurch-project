-- Aggregate-only council role. No existing user assignment changes.
BEGIN;
ALTER TABLE ministry.access_grants DROP CONSTRAINT access_grants_role_check;
ALTER TABLE ministry.access_grants ADD CONSTRAINT access_grants_role_check CHECK(role IN ('ADMIN','OFFICE','LEADER','CONTENT','COUNCIL'));
ALTER TABLE ministry.access_invitations DROP CONSTRAINT access_invitations_role_check;
ALTER TABLE ministry.access_invitations ADD CONSTRAINT access_invitations_role_check CHECK(role IN ('ADMIN','OFFICE','LEADER','CONTENT','COUNCIL'));
ALTER TABLE ministry.access_grants ADD CONSTRAINT council_role_limits CHECK(role<>'COUNCIL' OR (NOT care AND NOT can_print AND NOT can_delete AND cardinality(organization_ids)=0 AND scope_year IS NULL));
ALTER TABLE ministry.access_invitations ADD CONSTRAINT council_invitation_limits CHECK(role<>'COUNCIL' OR (NOT care AND NOT can_print AND NOT can_delete AND cardinality(organization_ids)=0 AND scope_year IS NULL));
ALTER FUNCTION ministry.access_validate(jsonb) RENAME TO access_validate_before_council;
REVOKE ALL ON FUNCTION ministry.access_validate_before_council(jsonb) FROM PUBLIC;
CREATE FUNCTION ministry.access_validate(p jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,ministry AS $$
BEGIN
 IF p->>'role'='COUNCIL' THEN
  IF (p->>'delete')::boolean IS DISTINCT FROM false THEN RAISE EXCEPTION 'ACCESS_INVALID'; END IF;
  PERFORM ministry.access_validate_before_council(jsonb_set(p,'{role}','"CONTENT"'));
 ELSE PERFORM ministry.access_validate_before_council(p);
 END IF;
END $$;
REVOKE ALL ON FUNCTION ministry.access_validate(jsonb) FROM PUBLIC;
COMMIT;
