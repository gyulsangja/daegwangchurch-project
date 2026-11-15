-- Protect ministry-only operators and serialize grants with account deletion.
BEGIN;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM ministry.access_grants g JOIN public.member_deletions d ON d."ownerId"=g.user_id WHERE g.active) THEN
  RAISE EXCEPTION 'Resolve active ministry access on pending or completed deletions first';
 END IF;
END $$;
CREATE FUNCTION ministry.guard_deleting_account_access() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE account_id uuid;
BEGIN
 IF TG_TABLE_SCHEMA='ministry' THEN
  account_id:=NEW.user_id;
  IF TG_OP='UPDATE' AND OLD.user_id<>NEW.user_id THEN
   RAISE EXCEPTION 'Member identity cannot change' USING ERRCODE='23514';
  END IF;
 ELSE
  account_id:=NEW."ownerId";
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(account_id::text,0));
 IF TG_TABLE_SCHEMA='ministry' THEN
  IF NEW.active AND EXISTS(SELECT 1 FROM public.member_deletions WHERE "ownerId"=account_id) THEN
   RAISE EXCEPTION 'Member unavailable' USING ERRCODE='23514';
  END IF;
 ELSE
  IF EXISTS(SELECT 1 FROM ministry.access_grants WHERE user_id=account_id AND active) THEN
   RAISE EXCEPTION 'Ministry access must be revoked before account deletion' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION ministry.guard_deleting_account_access() FROM PUBLIC;
CREATE TRIGGER protect_ministry_account BEFORE INSERT ON public.member_deletions
 FOR EACH ROW EXECUTE FUNCTION ministry.guard_deleting_account_access();
CREATE TRIGGER protect_deleting_account BEFORE INSERT OR UPDATE ON ministry.access_grants
 FOR EACH ROW EXECUTE FUNCTION ministry.guard_deleting_account_access();
COMMIT;
