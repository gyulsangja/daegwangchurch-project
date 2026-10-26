-- Apply separately with the migration owner. Runtime retains NO direct grant-write policy.
BEGIN;
ALTER TABLE ministry.access_grants DROP CONSTRAINT access_grants_role_check;
ALTER TABLE ministry.access_grants ADD CONSTRAINT access_grants_role_check CHECK(role IN ('ADMIN','OFFICE','LEADER'));
ALTER TABLE ministry.access_grants ADD COLUMN display_name text NOT NULL DEFAULT '',
 ADD COLUMN organization_ids text[] NOT NULL DEFAULT '{}', ADD COLUMN scope_year integer,
 ADD COLUMN can_print boolean NOT NULL DEFAULT false, ADD COLUMN can_delete boolean NOT NULL DEFAULT false;
-- Preserve existing administrators' operational abilities; subsequent invites start explicitly configured.
UPDATE ministry.access_grants SET can_print=true,can_delete=true WHERE role='ADMIN';
CREATE TABLE ministry.access_invitations (
 id uuid PRIMARY KEY, church_id text NOT NULL REFERENCES ministry.churches(id), email text NOT NULL,
 display_name text NOT NULL, role text NOT NULL CHECK(role IN ('ADMIN','OFFICE','LEADER')),
 care boolean NOT NULL, can_print boolean NOT NULL, can_delete boolean NOT NULL,
 organization_ids text[] NOT NULL DEFAULT '{}', scope_year integer,
 token_hash text NOT NULL UNIQUE, expires_at timestamptz NOT NULL,
 status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','ACCEPTED','CANCELLED')),
 version integer NOT NULL DEFAULT 1, created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 accepted_by uuid, last_sent_at timestamptz, send_count integer NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX access_invitation_pending ON ministry.access_invitations(church_id,email) WHERE status='PENDING';
CREATE TABLE ministry.access_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, church_id text NOT NULL REFERENCES ministry.churches(id),
 actor_id uuid NOT NULL, subject text NOT NULL, action text NOT NULL,
 before_value jsonb, after_value jsonb, reason text NOT NULL, at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE ministry.access_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry.access_invitations FORCE ROW LEVEL SECURITY;
ALTER TABLE ministry.access_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry.access_events FORCE ROW LEVEL SECURITY;
REVOKE ALL ON ministry.access_invitations,ministry.access_events FROM PUBLIC;

CREATE FUNCTION ministry.access_admin() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,ministry AS $$
DECLARE c text:=current_setting('ministry.church_id',true); u uuid:=nullif(current_setting('ministry.user_id',true),'')::uuid;
BEGIN
 -- All access/domain writes lock the church first, avoiding grant/church lock-order inversion.
 PERFORM 1 FROM ministry.churches WHERE id=c FOR UPDATE;
 IF NOT FOUND OR current_setting('ministry.aal',true) IS DISTINCT FROM 'aal2' OR NOT EXISTS(
  SELECT 1 FROM ministry.access_grants WHERE church_id=c AND user_id=u AND active AND role='ADMIN'
 ) THEN RAISE EXCEPTION 'ACCESS_FORBIDDEN'; END IF;
END $$;

CREATE FUNCTION ministry.access_validate(p jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,ministry AS $$
DECLARE c text:=current_setting('ministry.church_id',true); org text; y integer; n integer;
BEGIN
 IF p->>'role' NOT IN ('ADMIN','OFFICE','LEADER') OR p->>'role' IS NULL OR p->>'name' IS NULL OR length(p->>'name') NOT BETWEEN 1 AND 80
 OR jsonb_typeof(p->'organizations') IS DISTINCT FROM 'array' OR jsonb_array_length(p->'organizations')>100
 OR jsonb_typeof(p->'care') IS DISTINCT FROM 'boolean' OR jsonb_typeof(p->'print') IS DISTINCT FROM 'boolean'
 OR jsonb_typeof(p->'delete') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'ACCESS_INVALID'; END IF;
 SELECT count(DISTINCT value) INTO n FROM jsonb_array_elements_text(p->'organizations');
 IF n<>jsonb_array_length(p->'organizations') THEN RAISE EXCEPTION 'ACCESS_INVALID'; END IF;
 IF p->>'role'='LEADER' THEN
  IF (p->>'care')::boolean OR (p->>'delete')::boolean OR (p->>'print')::boolean OR n=0 THEN RAISE EXCEPTION 'ACCESS_INVALID'; END IF;
  SELECT (payload->>'year')::integer INTO y FROM ministry.years WHERE church_id=c AND payload->>'state'='ACTIVE';
  IF (p->>'year')::integer IS DISTINCT FROM y THEN RAISE EXCEPTION 'ACCESS_YEAR'; END IF;
  FOR org IN SELECT jsonb_array_elements_text(p->'organizations') LOOP
   IF NOT EXISTS(SELECT 1 FROM ministry.organizations WHERE church_id=c AND id=org) THEN RAISE EXCEPTION 'ACCESS_INVALID'; END IF;
  END LOOP;
 ELSIF n<>0 THEN RAISE EXCEPTION 'ACCESS_INVALID'; END IF;
END $$;

CREATE FUNCTION ministry.access_list() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,ministry AS $$
DECLARE c text:=current_setting('ministry.church_id',true); result jsonb;
BEGIN
 PERFORM ministry.access_admin();
 SELECT jsonb_build_object(
 'users',coalesce((SELECT jsonb_agg(jsonb_build_object('id',g.user_id,'name',g.display_name,'email',u.email,'role',g.role,'care',g.care,'print',g.can_print,'delete',g.can_delete,'organizations',g.organization_ids,'year',g.scope_year,'active',g.active,'version',g.version) ORDER BY g.active DESC,g.display_name,g.user_id) FROM ministry.access_grants g LEFT JOIN auth.users u ON u.id=g.user_id WHERE g.church_id=c),'[]'::jsonb),
 'invitations',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'name',display_name,'email',email,'role',role,'care',care,'print',can_print,'delete',can_delete,'organizations',organization_ids,'year',scope_year,'status',CASE WHEN status='PENDING' AND expires_at<now() THEN 'EXPIRED' ELSE status END,'expiresAt',expires_at,'version',version) ORDER BY created_at DESC) FROM ministry.access_invitations WHERE church_id=c),'[]'::jsonb),
 'events',coalesce((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.at DESC) FROM (SELECT actor_id,subject,action,before_value,after_value,reason,at FROM ministry.access_events WHERE church_id=c ORDER BY at DESC,id DESC LIMIT 100) e),'[]'::jsonb)) INTO result;
 RETURN result;
END $$;

CREATE FUNCTION ministry.access_change(p jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,ministry AS $$
DECLARE c text:=current_setting('ministry.church_id',true); u uuid:=nullif(current_setting('ministry.user_id',true),'')::uuid;
 old ministry.access_grants; target uuid; before_data jsonb; action text:=p->>'action'; iid uuid;
BEGIN
 PERFORM ministry.access_admin();
 IF length(trim(p->>'reason')) NOT BETWEEN 1 AND 300 OR p->>'reason' IS NULL THEN RAISE EXCEPTION 'ACCESS_REASON'; END IF;
 IF action='UPDATE' THEN
  IF p->>'id' IS NULL OR p->>'version' IS NULL THEN RAISE EXCEPTION 'ACCESS_INVALID'; END IF;
  PERFORM ministry.access_validate(p);target:=(p->>'id')::uuid;
  SELECT * INTO old FROM ministry.access_grants WHERE church_id=c AND user_id=target FOR UPDATE;
  IF NOT FOUND OR old.version<>(p->>'version')::integer THEN RAISE EXCEPTION 'ACCESS_CONFLICT'; END IF;
  IF jsonb_typeof(p->'active') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'ACCESS_INVALID'; END IF;
  IF old.active AND old.role='ADMIN' AND (p->>'role'<>'ADMIN' OR NOT (p->>'active')::boolean)
   AND NOT EXISTS(SELECT 1 FROM ministry.access_grants WHERE church_id=c AND active AND role='ADMIN' AND user_id<>target) THEN RAISE EXCEPTION 'ACCESS_LAST_ADMIN'; END IF;
  IF target=u AND (p->>'role'<>'ADMIN' OR NOT (p->>'active')::boolean) THEN RAISE EXCEPTION 'ACCESS_SELF'; END IF;
  before_data:=to_jsonb(old)-'church_id';
  UPDATE ministry.access_grants SET display_name=p->>'name',role=p->>'role',care=(p->>'care')::boolean,can_print=(p->>'print')::boolean,can_delete=(p->>'delete')::boolean,
    active=(p->>'active')::boolean,organization_ids=ARRAY(SELECT jsonb_array_elements_text(p->'organizations')),scope_year=CASE WHEN p->>'role'='LEADER' THEN (p->>'year')::integer ELSE NULL END,version=version+1 WHERE church_id=c AND user_id=target;
  INSERT INTO ministry.access_events(church_id,actor_id,subject,action,before_value,after_value,reason) VALUES(c,u,target::text,'UPDATE',before_data,p-'reason',p->>'reason');
  RETURN jsonb_build_object('ok',true);
 ELSIF action='INVITE' THEN
  IF p->>'id' IS NULL THEN RAISE EXCEPTION 'ACCESS_INVALID'; END IF;
  PERFORM ministry.access_validate(p);iid:=(p->>'id')::uuid;
  IF p->>'hash' IS NULL OR p->>'email' IS NULL OR p->>'hash' !~ '^[a-f0-9]{64}$' OR length(p->>'email')>254 OR p->>'email' !~ '^[^ @]+@[^ @]+\.[^ @]+$' THEN RAISE EXCEPTION 'ACCESS_INVALID'; END IF;
  IF EXISTS(SELECT 1 FROM ministry.access_grants g JOIN auth.users a ON a.id=g.user_id WHERE g.church_id=c AND lower(a.email)=lower(p->>'email')) THEN RAISE EXCEPTION 'ACCESS_EXISTS'; END IF;
  UPDATE ministry.access_invitations SET status='CANCELLED',version=version+1 WHERE church_id=c AND email=lower(p->>'email') AND status='PENDING' AND expires_at<now();
  INSERT INTO ministry.access_invitations(id,church_id,email,display_name,role,care,can_print,can_delete,organization_ids,scope_year,token_hash,expires_at,created_by)
   VALUES(iid,c,lower(p->>'email'),p->>'name',p->>'role',(p->>'care')::boolean,(p->>'print')::boolean,(p->>'delete')::boolean,ARRAY(SELECT jsonb_array_elements_text(p->'organizations')),CASE WHEN p->>'role'='LEADER' THEN (p->>'year')::integer ELSE NULL END,p->>'hash',now()+interval '7 days',u);
  INSERT INTO ministry.access_events(church_id,actor_id,subject,action,after_value,reason) VALUES(c,u,iid::text,'INVITE',p-'hash'-'reason',p->>'reason');
  RETURN jsonb_build_object('ok',true);
 ELSIF action IN ('CANCEL','REISSUE') THEN
  IF p->>'id' IS NULL OR p->>'version' IS NULL THEN RAISE EXCEPTION 'ACCESS_INVALID'; END IF;
  iid:=(p->>'id')::uuid;
  IF action='REISSUE' AND (p->>'hash' IS NULL OR p->>'hash' !~ '^[a-f0-9]{64}$') THEN RAISE EXCEPTION 'ACCESS_INVALID'; END IF;
  UPDATE ministry.access_invitations SET status=CASE WHEN action='CANCEL' THEN 'CANCELLED' ELSE 'PENDING' END,
   token_hash=CASE WHEN action='REISSUE' THEN p->>'hash' ELSE token_hash END,
   created_by=CASE WHEN action='REISSUE' THEN u ELSE created_by END,
   expires_at=CASE WHEN action='REISSUE' THEN now()+interval '7 days' ELSE expires_at END,version=version+1
   WHERE church_id=c AND id=iid AND version=(p->>'version')::integer AND status='PENDING';
  IF NOT FOUND THEN RAISE EXCEPTION 'ACCESS_CONFLICT'; END IF;
  INSERT INTO ministry.access_events(church_id,actor_id,subject,action,reason) VALUES(c,u,iid::text,action,p->>'reason');
  RETURN jsonb_build_object('ok',true);
 END IF;
 RAISE EXCEPTION 'ACCESS_INVALID';
END $$;

CREATE FUNCTION ministry.invitation_action(p_hash text,p_email text,p_send boolean,p_accept boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,ministry AS $$
DECLARE inv ministry.access_invitations; u uuid:=nullif(current_setting('ministry.user_id',true),'')::uuid; c text:=current_setting('ministry.church_id',true);
BEGIN
 -- No auth grants are needed to verify a high entropy invitation. Only this configured church is considered.
 PERFORM 1 FROM ministry.churches WHERE id=c FOR UPDATE;
 SELECT * INTO inv FROM ministry.access_invitations WHERE church_id=c AND token_hash=p_hash AND status='PENDING' AND expires_at>now() FOR UPDATE;
 IF NOT FOUND OR inv.email<>lower(trim(p_email)) THEN RAISE EXCEPTION 'INVITATION_INVALID'; END IF;
 -- Revoking/demoting the inviter also invalidates their unaccepted invitations.
 IF NOT EXISTS(SELECT 1 FROM ministry.access_grants WHERE church_id=c AND user_id=inv.created_by AND active AND role='ADMIN') THEN RAISE EXCEPTION 'INVITATION_INVALID'; END IF;
 IF p_send THEN
  IF inv.last_sent_at>now()-interval '60 seconds' OR (inv.send_count>=5 AND inv.last_sent_at>now()-interval '1 day') THEN RAISE EXCEPTION 'INVITATION_RATE'; END IF;
  UPDATE ministry.access_invitations SET last_sent_at=now(),send_count=CASE WHEN last_sent_at<now()-interval '1 day' THEN 1 ELSE send_count+1 END WHERE id=inv.id;
 END IF;
 IF p_accept THEN
  IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=u AND lower(email)=inv.email AND email_confirmed_at IS NOT NULL) THEN RAISE EXCEPTION 'INVITATION_IDENTITY'; END IF;
  IF EXISTS(SELECT 1 FROM ministry.access_grants WHERE church_id=c AND user_id=u) THEN RAISE EXCEPTION 'ACCESS_EXISTS'; END IF;
  IF inv.role='LEADER' AND NOT EXISTS(SELECT 1 FROM ministry.years WHERE church_id=c AND (payload->>'year')::integer=inv.scope_year AND payload->>'state'='ACTIVE') THEN RAISE EXCEPTION 'ACCESS_YEAR'; END IF;
  IF inv.role='LEADER' AND EXISTS(SELECT 1 FROM unnest(inv.organization_ids) org WHERE NOT EXISTS(SELECT 1 FROM ministry.organizations WHERE church_id=c AND id=org)) THEN RAISE EXCEPTION 'ACCESS_INVALID'; END IF;
  INSERT INTO ministry.access_grants(church_id,user_id,role,care,display_name,organization_ids,scope_year,can_print,can_delete) VALUES(c,u,inv.role,inv.care,inv.display_name,inv.organization_ids,inv.scope_year,inv.can_print,inv.can_delete);
  UPDATE ministry.access_invitations SET status='ACCEPTED',accepted_by=u,version=version+1 WHERE id=inv.id;
  INSERT INTO ministry.access_events(church_id,actor_id,subject,action,after_value,reason) VALUES(c,u,u::text,'ACCEPT',jsonb_build_object('invitation',inv.id,'role',inv.role),'초대 대상 이메일 확인 및 수락');
 END IF;
 RETURN jsonb_build_object('ok',true,'name',inv.display_name,'role',inv.role);
END $$;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA ministry FROM PUBLIC;
DO $$ DECLARE r text; BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN
   EXECUTE format('REVOKE ALL ON ministry.access_invitations,ministry.access_events FROM %I',r);
   EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA ministry FROM %I',r);
  END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='daegwang_ministry_runtime') THEN
  GRANT EXECUTE ON FUNCTION ministry.access_list(),ministry.access_change(jsonb),ministry.invitation_action(text,text,boolean,boolean) TO daegwang_ministry_runtime;
 END IF;
END $$;
COMMIT;
