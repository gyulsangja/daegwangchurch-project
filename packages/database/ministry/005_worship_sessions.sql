-- Add dated worship records without changing existing pastoral records or user grants.
BEGIN;
CREATE TABLE ministry.worship_sessions (
 church_id text NOT NULL REFERENCES ministry.churches(id), id uuid NOT NULL,
 worship_date date NOT NULL, name text NOT NULL CHECK(length(name) BETWEEN 1 AND 120),
 status text NOT NULL DEFAULT 'PREPARING' CHECK(status IN ('PREPARING','COMPLETED','CANCELLED','ARCHIVED')),
 notes text NOT NULL DEFAULT '' CHECK(length(notes)<=8000),
 resources jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(resources)='array' AND jsonb_array_length(resources)<=50),
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 created_by uuid NOT NULL, updated_by uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(church_id,id)
);
CREATE INDEX worship_sessions_month ON ministry.worship_sessions(church_id,worship_date DESC,id);
ALTER TABLE ministry.worship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry.worship_sessions FORCE ROW LEVEL SECURITY;
CREATE POLICY worship_admin_scope ON ministry.worship_sessions
 USING(church_id=current_setting('ministry.church_id',true) AND EXISTS(
  SELECT 1 FROM ministry.access_grants g WHERE g.church_id=worship_sessions.church_id
  AND g.user_id::text=current_setting('ministry.user_id',true) AND g.active AND g.role='ADMIN'))
 WITH CHECK(church_id=current_setting('ministry.church_id',true) AND EXISTS(
  SELECT 1 FROM ministry.access_grants g WHERE g.church_id=worship_sessions.church_id
  AND g.user_id::text=current_setting('ministry.user_id',true) AND g.active AND g.role='ADMIN'));
REVOKE ALL ON ministry.worship_sessions FROM PUBLIC;
DO $$ DECLARE r text; BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON ministry.worship_sessions FROM %I',r); END IF;
 END LOOP;
END $$;
GRANT SELECT,INSERT,UPDATE ON ministry.worship_sessions TO daegwang_ministry_runtime;
COMMIT;
