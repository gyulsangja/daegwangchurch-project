-- Separate deployment path; NEVER part of the CMS migration command.
BEGIN;
CREATE SCHEMA ministry;
REVOKE ALL ON SCHEMA ministry FROM PUBLIC;
CREATE TABLE ministry.churches (id text PRIMARY KEY, payload jsonb NOT NULL);
CREATE TABLE ministry.access_grants (
 church_id text NOT NULL REFERENCES ministry.churches(id), user_id uuid NOT NULL,
 role text NOT NULL CHECK(role IN ('ADMIN','OFFICE')), care boolean NOT NULL DEFAULT false,
 active boolean NOT NULL DEFAULT true, version integer NOT NULL DEFAULT 1,
 PRIMARY KEY(church_id,user_id)
);
CREATE TABLE ministry.members (church_id text NOT NULL REFERENCES ministry.churches(id), id text NOT NULL, payload jsonb NOT NULL, PRIMARY KEY(church_id,id));
CREATE TABLE ministry.organizations (church_id text NOT NULL REFERENCES ministry.churches(id), id text NOT NULL, payload jsonb NOT NULL, PRIMARY KEY(church_id,id));
CREATE TABLE ministry.families (church_id text NOT NULL REFERENCES ministry.churches(id), id text NOT NULL, payload jsonb NOT NULL, PRIMARY KEY(church_id,id));
CREATE TABLE ministry.years (church_id text NOT NULL REFERENCES ministry.churches(id), id text NOT NULL, payload jsonb NOT NULL, PRIMARY KEY(church_id,id));
CREATE TABLE ministry.records (church_id text NOT NULL, id text NOT NULL, member_id text NOT NULL, payload jsonb NOT NULL, PRIMARY KEY(church_id,id), FOREIGN KEY(church_id,member_id) REFERENCES ministry.members(church_id,id));
CREATE TABLE ministry.pastoral (church_id text NOT NULL REFERENCES ministry.churches(id), id text NOT NULL, member_id text, payload jsonb NOT NULL, PRIMARY KEY(church_id,id), FOREIGN KEY(church_id,member_id) REFERENCES ministry.members(church_id,id));
CREATE TABLE ministry.attendance_sessions (church_id text NOT NULL REFERENCES ministry.churches(id), id text NOT NULL, payload jsonb NOT NULL, PRIMARY KEY(church_id,id));
CREATE TABLE ministry.audits (church_id text NOT NULL REFERENCES ministry.churches(id), id text NOT NULL, payload jsonb NOT NULL, PRIMARY KEY(church_id,id));
CREATE TABLE ministry.account_links (
 church_id text NOT NULL, member_id text NOT NULL, user_id uuid NOT NULL,
 approved_by uuid NOT NULL, approved_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(church_id,member_id), UNIQUE(church_id,user_id),
 FOREIGN KEY(church_id,member_id) REFERENCES ministry.members(church_id,id)
);
CREATE TABLE ministry.care_intakes (
 church_id text NOT NULL, source_id text NOT NULL, member_id text NOT NULL, pastoral_id text NOT NULL,
 imported_by uuid NOT NULL, imported_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(church_id,source_id),
 FOREIGN KEY(church_id,member_id) REFERENCES ministry.members(church_id,id),
 FOREIGN KEY(church_id,pastoral_id) REFERENCES ministry.pastoral(church_id,id)
);
-- The runtime login must be separate from the migration owner and MUST NOT have BYPASSRLS.
ALTER TABLE ministry.access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry.access_grants FORCE ROW LEVEL SECURITY;
CREATE POLICY own_grant ON ministry.access_grants FOR SELECT USING(user_id::text=current_setting('ministry.user_id',true));
-- Row locks require an UPDATE visibility policy; WITH CHECK(false) prohibits every actual update.
CREATE POLICY lock_own_grant ON ministry.access_grants FOR UPDATE USING(user_id::text=current_setting('ministry.user_id',true)) WITH CHECK(false);
ALTER TABLE ministry.churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry.churches FORCE ROW LEVEL SECURITY;
CREATE POLICY own_church ON ministry.churches USING(id=current_setting('ministry.church_id',true) AND EXISTS(SELECT 1 FROM ministry.access_grants g WHERE g.church_id=id AND g.active AND g.user_id::text=current_setting('ministry.user_id',true)));
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['members','organizations','families','years','records','pastoral','attendance_sessions','audits','account_links','care_intakes'] LOOP
  EXECUTE format('ALTER TABLE ministry.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE ministry.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY tenant_scope ON ministry.%I USING (church_id=current_setting(''ministry.church_id'',true) AND EXISTS(SELECT 1 FROM ministry.access_grants g WHERE g.church_id=current_setting(''ministry.church_id'',true) AND g.active AND g.user_id::text=current_setting(''ministry.user_id'',true)))',t);
 END LOOP;
END $$;
REVOKE ALL ON ALL TABLES IN SCHEMA ministry FROM PUBLIC;
COMMIT;
