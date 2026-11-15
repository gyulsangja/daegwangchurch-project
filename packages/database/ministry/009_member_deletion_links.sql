-- Local candidate only. Requires separate production approval and an orphan audit.
-- App account deletion does not delete the independently maintained church register.
BEGIN;

-- Validate existing rows too: do not silently discard pre-existing orphan records.
ALTER TABLE ministry.account_links ADD CONSTRAINT account_links_profile_fk
 FOREIGN KEY (user_id) REFERENCES public.member_profiles("ownerId") ON DELETE CASCADE;
ALTER TABLE ministry.care_intakes ADD CONSTRAINT care_intakes_request_fk
 FOREIGN KEY (source_id) REFERENCES public.member_care_requests(id) ON DELETE CASCADE;

CREATE FUNCTION ministry.remove_deleted_care_intake() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
BEGIN
 -- Use the same church lock as ministry mutations, so a saved snapshot cannot
 -- race cleanup and recreate a deleted imported appointment.
 PERFORM id FROM ministry.churches WHERE id=OLD.church_id FOR UPDATE;
 DELETE FROM ministry.pastoral
  WHERE church_id=OLD.church_id AND id=OLD.pastoral_id
    AND NOT EXISTS (SELECT 1 FROM ministry.care_intakes i
      WHERE i.church_id=OLD.church_id AND i.pastoral_id=OLD.pastoral_id);
 RETURN OLD;
END;
$$;
REVOKE ALL ON FUNCTION ministry.remove_deleted_care_intake() FROM PUBLIC;
CREATE TRIGGER remove_deleted_care_intake AFTER DELETE ON ministry.care_intakes
 FOR EACH ROW EXECUTE FUNCTION ministry.remove_deleted_care_intake();
COMMIT;
