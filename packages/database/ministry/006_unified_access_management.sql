-- Apply separately with the migration owner. No existing users or grants are changed.
-- Both privilege stores remain compatible with old clients; this API writes them atomically.
BEGIN;
CREATE FUNCTION ministry.management_access_list() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,ministry AS $$
DECLARE result jsonb; can_cms boolean;
BEGIN
 result:=ministry.access_list();
 SELECT EXISTS(SELECT 1 FROM public.admin_profiles WHERE "authUserId"=nullif(current_setting('ministry.user_id',true),'')::uuid AND "isActive" AND role::text='SUPER_ADMIN') INTO can_cms;
 RETURN result || jsonb_build_object('canManageCms',can_cms,'users',coalesce((
  SELECT jsonb_agg(v || CASE WHEN can_cms THEN jsonb_build_object(
   'cmsRole',CASE WHEN a."isActive" THEN a.role::text ELSE 'NONE' END,
   'cmsVersion',CASE WHEN a.id IS NULL THEN NULL ELSE to_char(a."updatedAt",'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') END
  ) ELSE '{}'::jsonb END ORDER BY n)
  FROM jsonb_array_elements(result->'users') WITH ORDINALITY AS item(v,n)
  LEFT JOIN public.admin_profiles a ON a."authUserId"=(v->>'id')::uuid
 ),'[]'::jsonb));
END $$;

CREATE FUNCTION ministry.management_access_change(p jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,ministry AS $$
DECLARE u uuid:=nullif(current_setting('ministry.user_id',true),'')::uuid;
 c text:=current_setting('ministry.church_id',true); target uuid; old public.admin_profiles;
 old_role text; requested text; account_email text; result jsonb;
BEGIN
 PERFORM ministry.access_admin(); -- church lock first, then CMS global lock, then owner lock
 IF current_setting('ministry.aal',true) IS DISTINCT FROM 'aal2' AND current_setting('ministry.reauthenticated',true) IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'ACCESS_REAUTH'; END IF;
 IF NOT (p ? 'cmsRole') THEN RETURN ministry.access_change_verified(p); END IF;
 IF p->>'action' IS DISTINCT FROM 'UPDATE' OR NOT (p ? 'cmsVersion') OR p->>'cmsRole' IS NULL OR p->>'cmsRole' NOT IN ('NONE','ADMIN','SUPER_ADMIN') THEN RAISE EXCEPTION 'ACCESS_INVALID'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('admin-member-management',0));
 IF NOT EXISTS(SELECT 1 FROM public.admin_profiles WHERE "authUserId"=u AND "isActive" AND role::text='SUPER_ADMIN') THEN RAISE EXCEPTION 'ACCESS_CMS_FORBIDDEN'; END IF;
 target:=(p->>'id')::uuid;
 PERFORM pg_advisory_xact_lock(hashtextextended(target::text,0));
 IF EXISTS(SELECT 1 FROM public.member_deletions WHERE "ownerId"=target) THEN RAISE EXCEPTION 'ACCESS_INVALID'; END IF;
 SELECT email INTO account_email FROM auth.users WHERE id=target AND deleted_at IS NULL AND NOT coalesce(is_anonymous,false);
 IF account_email IS NULL THEN RAISE EXCEPTION 'ACCESS_INVALID'; END IF;
 SELECT * INTO old FROM public.admin_profiles WHERE "authUserId"=target FOR UPDATE;
 IF old.id IS NULL THEN
  IF p->>'cmsVersion' IS NOT NULL THEN RAISE EXCEPTION 'ACCESS_CONFLICT'; END IF;
 ELSIF p->>'cmsVersion' IS NULL OR old."updatedAt" IS DISTINCT FROM (p->>'cmsVersion')::timestamptz AT TIME ZONE 'UTC' THEN RAISE EXCEPTION 'ACCESS_CONFLICT'; END IF;
 old_role:=CASE WHEN old."isActive" THEN old.role::text ELSE 'NONE' END;
 requested:=p->>'cmsRole';
 IF target=u AND requested IS DISTINCT FROM old_role THEN RAISE EXCEPTION 'ACCESS_SELF'; END IF;
 IF old_role='SUPER_ADMIN' AND requested<>'SUPER_ADMIN' AND NOT EXISTS(SELECT 1 FROM public.admin_profiles WHERE "isActive" AND role::text='SUPER_ADMIN' AND "authUserId"<>target) THEN RAISE EXCEPTION 'ACCESS_LAST_ADMIN'; END IF;
 -- Validate and update the ministry grant before touching CMS data; any later failure rolls both back.
 result:=ministry.access_change_verified(p-'cmsRole'-'cmsVersion');
 IF requested IS DISTINCT FROM old_role THEN
  IF requested='NONE' THEN
   UPDATE public.admin_profiles SET "isActive"=false,"updatedAt"=clock_timestamp() AT TIME ZONE 'UTC' WHERE id=old.id;
   DELETE FROM public.group_managers WHERE "adminId"=old.id;
  ELSIF old.id IS NULL THEN
   INSERT INTO public.admin_profiles(id,"authUserId",email,"displayName",role,"isActive","createdAt","updatedAt")
   VALUES(gen_random_uuid()::text,target,account_email,p->>'name',requested::public."AdminRole",true,clock_timestamp() AT TIME ZONE 'UTC',clock_timestamp() AT TIME ZONE 'UTC');
  ELSE
   UPDATE public.admin_profiles SET role=requested::public."AdminRole","isActive"=true,"updatedAt"=clock_timestamp() AT TIME ZONE 'UTC' WHERE id=old.id;
  END IF;
  INSERT INTO ministry.access_events(church_id,actor_id,subject,action,before_value,after_value,reason)
   VALUES(c,u,target::text,'CONTENT_ACCESS',jsonb_build_object('cmsRole',old_role),jsonb_build_object('cmsRole',requested),p->>'reason');
 END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION ministry.management_access_list(),ministry.management_access_change(jsonb) FROM PUBLIC;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='daegwang_ministry_runtime') THEN
  GRANT EXECUTE ON FUNCTION ministry.management_access_list(),ministry.management_access_change(jsonb) TO daegwang_ministry_runtime;
 END IF;
END $$;
COMMIT;
