-- Separate private finance records. Existing accounts receive no automatic financial access.
BEGIN;
CREATE SCHEMA finance;
REVOKE ALL ON SCHEMA finance FROM PUBLIC;
CREATE TABLE finance.grants (
 church_id text NOT NULL REFERENCES ministry.churches(id), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 role text NOT NULL CHECK(role IN ('MANAGER','BOOKKEEPER','AUDITOR','REPORTER')),
 active boolean NOT NULL DEFAULT true, version integer NOT NULL DEFAULT 1, PRIMARY KEY(church_id,user_id)
);
CREATE TABLE finance.years (
 church_id text NOT NULL REFERENCES ministry.churches(id), year integer NOT NULL CHECK(year BETWEEN 2000 AND 2200),
 version integer NOT NULL DEFAULT 1, closed boolean NOT NULL DEFAULT false, carried_from integer, PRIMARY KEY(church_id,year)
);
CREATE TABLE finance.categories (
 church_id text NOT NULL, year integer NOT NULL, id uuid NOT NULL, name text NOT NULL CHECK(length(name) BETWEEN 1 AND 100),
 kind text NOT NULL CHECK(kind IN ('INCOME','EXPENSE')), offering boolean NOT NULL DEFAULT false,
 PRIMARY KEY(church_id,year,id), UNIQUE(church_id,year,kind,name),
 FOREIGN KEY(church_id,year) REFERENCES finance.years(church_id,year), CHECK(NOT offering OR kind='INCOME')
);
CREATE TABLE finance.accounts (
 church_id text NOT NULL, year integer NOT NULL, id uuid NOT NULL, name text NOT NULL CHECK(length(name) BETWEEN 1 AND 100),
 opening bigint NOT NULL CHECK(opening BETWEEN 0 AND 1000000000000), PRIMARY KEY(church_id,year,id),
 UNIQUE(church_id,year,name), FOREIGN KEY(church_id,year) REFERENCES finance.years(church_id,year)
);
CREATE TABLE finance.budgets (
 church_id text NOT NULL, year integer NOT NULL, category_id uuid NOT NULL, amount bigint NOT NULL CHECK(amount BETWEEN 0 AND 1000000000000),
 PRIMARY KEY(church_id,year,category_id), FOREIGN KEY(church_id,year,category_id) REFERENCES finance.categories(church_id,year,id)
);
CREATE TABLE finance.entries (
 church_id text NOT NULL, year integer NOT NULL, id uuid NOT NULL, date date NOT NULL,
 kind text NOT NULL CHECK(kind IN ('INCOME','EXPENSE','TRANSFER')), account_id uuid NOT NULL, destination_id uuid, category_id uuid,
 amount bigint NOT NULL CHECK(amount BETWEEN 1 AND 1000000000000), member_id text, party text NOT NULL DEFAULT '' CHECK(length(party)<=100),
 memo text NOT NULL CHECK(length(memo) BETWEEN 1 AND 1000), receipt text NOT NULL DEFAULT '' CHECK(length(receipt)<=300),
 status text NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','POSTED','VOID')), created_by uuid NOT NULL, approved_by uuid,
 PRIMARY KEY(church_id,year,id), FOREIGN KEY(church_id,year,account_id) REFERENCES finance.accounts(church_id,year,id),
 FOREIGN KEY(church_id,year,destination_id) REFERENCES finance.accounts(church_id,year,id),
 FOREIGN KEY(church_id,year,category_id) REFERENCES finance.categories(church_id,year,id),
 FOREIGN KEY(church_id,member_id) REFERENCES ministry.members(church_id,id), CHECK(EXTRACT(YEAR FROM date)=year),
 CHECK((kind='TRANSFER' AND destination_id IS NOT NULL AND destination_id<>account_id AND category_id IS NULL AND member_id IS NULL)
    OR (kind IN ('INCOME','EXPENSE') AND destination_id IS NULL AND category_id IS NOT NULL)),
 CHECK(member_id IS NULL OR kind='INCOME')
);
CREATE INDEX finance_entries_date ON finance.entries(church_id,year,date,id);
CREATE TABLE finance.events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, church_id text NOT NULL, year integer, actor uuid NOT NULL,
 action text NOT NULL, reason text NOT NULL DEFAULT '', metadata jsonb NOT NULL DEFAULT '{}', at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE finance.commands (
 church_id text NOT NULL, actor uuid NOT NULL, id uuid NOT NULL, fingerprint text NOT NULL, PRIMARY KEY(church_id,actor,id)
);
DO $$ DECLARE t text; r text; BEGIN
 FOREACH t IN ARRAY ARRAY['grants','years','categories','accounts','budgets','entries','events','commands'] LOOP
  EXECUTE format('ALTER TABLE finance.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE finance.%I FORCE ROW LEVEL SECURITY',t);
 END LOOP;
 REVOKE ALL ON ALL TABLES IN SCHEMA finance FROM PUBLIC;
 REVOKE ALL ON ALL SEQUENCES IN SCHEMA finance FROM PUBLIC;
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN
   EXECUTE format('REVOKE ALL ON SCHEMA finance FROM %I',r);
   EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA finance FROM %I',r);
   EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA finance FROM %I',r);
  END IF;
 END LOOP;
END $$;

CREATE FUNCTION finance.context() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,finance AS $$
DECLARE c text:=current_setting('ministry.church_id',true); u uuid:=nullif(current_setting('ministry.user_id',true),'')::uuid; r text; a boolean;
BEGIN
 IF u IS NULL OR c IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=u AND deleted_at IS NULL) THEN RAISE EXCEPTION 'FINANCE_FORBIDDEN'; END IF;
 SELECT role INTO r FROM finance.grants WHERE church_id=c AND user_id=u AND active;
 SELECT EXISTS(SELECT 1 FROM ministry.access_grants WHERE church_id=c AND user_id=u AND active AND role='ADMIN') INTO a;
 IF r IS NULL AND NOT a THEN RAISE EXCEPTION 'FINANCE_FORBIDDEN'; END IF;
 RETURN jsonb_build_object('role',r,'canManageAccess',a);
END $$;

CREATE FUNCTION finance.read_year(y integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,finance AS $$
DECLARE c text:=current_setting('ministry.church_id',true); ctx jsonb; result jsonb; r text;
BEGIN
 IF y NOT BETWEEN 2000 AND 2200 THEN RAISE EXCEPTION 'FINANCE_INVALID'; END IF;
 PERFORM pg_advisory_xact_lock_shared(hashtextextended('finance:'||c,0));
 ctx:=finance.context(); r:=ctx->>'role';
 result:=ctx||jsonb_build_object('year',y,'version',0,'closed',false,'years','[]'::jsonb,'accounts','[]'::jsonb,'categories','[]'::jsonb,'entries','[]'::jsonb,'members','[]'::jsonb,'grants','[]'::jsonb,'events','[]'::jsonb);
 IF (ctx->>'canManageAccess')::boolean THEN
  result:=result||jsonb_build_object('grants',coalesce((SELECT jsonb_agg(jsonb_build_object('email',u.email,'role',g.role,'active',g.active,'version',g.version) ORDER BY u.email) FROM finance.grants g JOIN auth.users u ON u.id=g.user_id WHERE g.church_id=c),'[]'::jsonb));
 END IF;
 IF r IS NULL THEN RETURN result; END IF;
 result:=result||jsonb_build_object('years',coalesce((SELECT jsonb_agg(year ORDER BY year DESC) FROM finance.years WHERE church_id=c),'[]'::jsonb));
 result:=result||coalesce((SELECT jsonb_build_object('version',version,'closed',closed) FROM finance.years WHERE church_id=c AND year=y),'{}'::jsonb);
 result:=result||jsonb_build_object('accounts',coalesce((SELECT jsonb_agg(jsonb_build_object('id',a.id,'name',a.name,'opening',a.opening,'balance',a.opening+coalesce((SELECT sum(CASE WHEN e.kind='INCOME' OR e.destination_id=a.id THEN e.amount ELSE -e.amount END) FROM finance.entries e WHERE e.church_id=c AND e.year=y AND e.status='POSTED' AND (e.account_id=a.id OR e.destination_id=a.id)),0)) ORDER BY a.name) FROM finance.accounts a WHERE a.church_id=c AND a.year=y),'[]'::jsonb));
 result:=result||jsonb_build_object('categories',coalesce((SELECT jsonb_agg(jsonb_build_object('id',k.id,'name',k.name,'kind',k.kind,'offering',k.offering,'budget',coalesce(b.amount,0),'actual',coalesce((SELECT sum(e.amount) FROM finance.entries e WHERE e.church_id=c AND e.year=y AND e.category_id=k.id AND e.status='POSTED'),0)) ORDER BY k.kind,k.name) FROM finance.categories k LEFT JOIN finance.budgets b ON (b.church_id,b.year,b.category_id)=(k.church_id,k.year,k.id) WHERE k.church_id=c AND k.year=y),'[]'::jsonb));
 IF r<>'REPORTER' THEN
  result:=result||jsonb_build_object('entries',coalesce((SELECT jsonb_agg(jsonb_build_object('id',e.id,'date',e.date,'kind',e.kind,'accountId',e.account_id,'destinationId',e.destination_id,'categoryId',e.category_id,'amount',e.amount,'memberId',e.member_id,'party',e.party,'memo',e.memo,'receipt',e.receipt,'status',e.status,'createdBy',e.created_by,'approvedBy',e.approved_by) ORDER BY e.date DESC,e.id) FROM finance.entries e WHERE e.church_id=c AND e.year=y),'[]'::jsonb));
  result:=result||jsonb_build_object('members',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'name',payload->>'name') ORDER BY payload->>'name',id) FROM ministry.members WHERE church_id=c),'[]'::jsonb));
  result:=result||jsonb_build_object('events',coalesce((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.at DESC) FROM (SELECT action,at,actor,reason FROM finance.events WHERE church_id=c AND (year=y OR year IS NULL) ORDER BY id DESC LIMIT 100) e),'[]'::jsonb));
 END IF;
 RETURN result;
END $$;

CREATE FUNCTION finance.command(p jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,finance AS $$
DECLARE c text:=current_setting('ministry.church_id',true); u uuid:=nullif(current_setting('ministry.user_id',true),'')::uuid;
 ctx jsonb; r text; a text:=p->>'action'; y integer:=(p->>'year')::integer; old_year finance.years; old_entry finance.entries;
 target uuid; item uuid; request_id uuid:=(p->>'requestId')::uuid; prior text; old_grant finance.grants; before_value jsonb;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('finance:'||c,0));
 ctx:=finance.context();r:=ctx->>'role';
 IF request_id IS NULL THEN RAISE EXCEPTION 'FINANCE_INVALID'; END IF;
 IF a='ACCESS_SAVE' THEN
  IF NOT (ctx->>'canManageAccess')::boolean THEN RAISE EXCEPTION 'FINANCE_FORBIDDEN'; END IF;
  IF current_setting('ministry.aal',true) IS DISTINCT FROM 'aal2' AND current_setting('ministry.reauthenticated',true) IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'ACCESS_REAUTH'; END IF;
 ELSIF r IS NULL OR r NOT IN ('MANAGER','BOOKKEEPER') OR (r='BOOKKEEPER' AND a<>'ENTRY_SAVE') THEN RAISE EXCEPTION 'FINANCE_FORBIDDEN'; END IF;
 SELECT fingerprint INTO prior FROM finance.commands WHERE church_id=c AND actor=u AND id=request_id;
 IF FOUND THEN
  IF prior<>md5(p::text) THEN RAISE EXCEPTION 'FINANCE_CONFLICT'; END IF;
  RETURN jsonb_build_object('saved',true,'duplicate',true);
 END IF;
 IF a='ACCESS_SAVE' THEN
  SELECT id INTO target FROM auth.users WHERE lower(email)=lower(trim(p->>'email')) AND deleted_at IS NULL AND NOT coalesce(is_anonymous,false);
  IF target IS NULL THEN RAISE EXCEPTION 'FINANCE_ACCOUNT_MISSING'; END IF;
  SELECT * INTO old_grant FROM finance.grants WHERE church_id=c AND user_id=target;
  IF coalesce(old_grant.version,0) IS DISTINCT FROM (p->>'version')::integer THEN RAISE EXCEPTION 'FINANCE_CONFLICT'; END IF;
  IF p->>'role' NOT IN ('MANAGER','BOOKKEEPER','AUDITOR','REPORTER') OR jsonb_typeof(p->'active')<>'boolean' THEN RAISE EXCEPTION 'FINANCE_INVALID'; END IF;
  IF old_grant.active AND old_grant.role='MANAGER' AND (p->>'role'<>'MANAGER' OR NOT (p->>'active')::boolean) AND NOT EXISTS(SELECT 1 FROM finance.grants WHERE church_id=c AND active AND role='MANAGER' AND user_id<>target) THEN RAISE EXCEPTION 'FINANCE_LAST_MANAGER'; END IF;
  before_value:=jsonb_build_object('user',target,'role',old_grant.role,'active',old_grant.active);
  INSERT INTO finance.grants(church_id,user_id,role,active) VALUES(c,target,p->>'role',(p->>'active')::boolean)
   ON CONFLICT(church_id,user_id) DO UPDATE SET role=excluded.role,active=excluded.active,version=finance.grants.version+1;
 ELSE
  IF y IS NULL OR y NOT BETWEEN 2000 AND 2200 THEN RAISE EXCEPTION 'FINANCE_INVALID'; END IF;
  SELECT * INTO old_year FROM finance.years WHERE church_id=c AND year=y FOR UPDATE;
  IF coalesce(old_year.version,0) IS DISTINCT FROM (p->>'version')::integer THEN RAISE EXCEPTION 'FINANCE_CONFLICT'; END IF;
  IF a='YEAR_CREATE' THEN
   IF old_year.year IS NOT NULL THEN RAISE EXCEPTION 'FINANCE_CONFLICT'; END IF;
   IF (p->>'carry')::boolean AND NOT EXISTS(SELECT 1 FROM finance.years WHERE church_id=c AND year=y-1 AND closed) THEN RAISE EXCEPTION 'FINANCE_PREVIOUS_OPEN'; END IF;
   INSERT INTO finance.years(church_id,year,carried_from) VALUES(c,y,CASE WHEN (p->>'carry')::boolean THEN y-1 END);
   IF (p->>'carry')::boolean THEN
    INSERT INTO finance.accounts(church_id,year,id,name,opening)
     SELECT c,y,a.id,a.name,a.opening+coalesce((SELECT sum(CASE WHEN e.kind='INCOME' OR e.destination_id=a.id THEN e.amount ELSE -e.amount END) FROM finance.entries e WHERE e.church_id=c AND e.year=y-1 AND e.status='POSTED' AND (e.account_id=a.id OR e.destination_id=a.id)),0) FROM finance.accounts a WHERE a.church_id=c AND a.year=y-1;
    INSERT INTO finance.categories SELECT church_id,y,id,name,kind,offering FROM finance.categories WHERE church_id=c AND year=y-1;
    INSERT INTO finance.budgets SELECT church_id,y,category_id,amount FROM finance.budgets WHERE church_id=c AND year=y-1;
   ELSE
    INSERT INTO finance.categories(church_id,year,id,name,kind,offering) VALUES
     (c,y,gen_random_uuid(),'십일조','INCOME',true),(c,y,gen_random_uuid(),'주일헌금','INCOME',true),(c,y,gen_random_uuid(),'감사헌금','INCOME',true),(c,y,gen_random_uuid(),'기타수입','INCOME',false),
     (c,y,gen_random_uuid(),'예배·교육','EXPENSE',false),(c,y,gen_random_uuid(),'선교·구제','EXPENSE',false),(c,y,gen_random_uuid(),'인건비','EXPENSE',false),(c,y,gen_random_uuid(),'시설·운영','EXPENSE',false);
   END IF;
  ELSE
   IF old_year.year IS NULL THEN RAISE EXCEPTION 'FINANCE_YEAR_MISSING'; END IF;
   IF old_year.closed AND a<>'YEAR_REOPEN' THEN RAISE EXCEPTION 'FINANCE_CLOSED'; END IF;
   IF a='YEAR_CLOSE' THEN
    IF EXISTS(SELECT 1 FROM finance.entries WHERE church_id=c AND year=y AND status='DRAFT') THEN RAISE EXCEPTION 'FINANCE_DRAFTS'; END IF;
    UPDATE finance.years SET closed=true WHERE church_id=c AND year=y;
   ELSIF a='YEAR_REOPEN' THEN
    IF EXISTS(SELECT 1 FROM finance.years WHERE church_id=c AND carried_from=y) THEN RAISE EXCEPTION 'FINANCE_CARRY_LOCKED'; END IF;
    UPDATE finance.years SET closed=false WHERE church_id=c AND year=y;
   ELSIF a='CATEGORY_SAVE' THEN
    item:=(p->>'id')::uuid;
    IF EXISTS(SELECT 1 FROM finance.categories WHERE church_id=c AND year=y AND id=item AND (kind<>p->>'kind' OR offering<>(p->>'offering')::boolean)) THEN RAISE EXCEPTION 'FINANCE_CATEGORY_KIND'; END IF;
    INSERT INTO finance.categories VALUES(c,y,item,trim(p->>'name'),p->>'kind',(p->>'offering')::boolean)
     ON CONFLICT(church_id,year,id) DO UPDATE SET name=excluded.name;
   ELSIF a='ACCOUNT_SAVE' THEN
    item:=(p->>'id')::uuid;
    IF EXISTS(SELECT 1 FROM finance.entries WHERE church_id=c AND year=y AND (account_id=item OR destination_id=item) AND status<>'DRAFT') AND EXISTS(SELECT 1 FROM finance.accounts WHERE church_id=c AND year=y AND id=item AND opening<>(p->>'opening')::bigint) THEN RAISE EXCEPTION 'FINANCE_OPENING_LOCKED'; END IF;
    INSERT INTO finance.accounts VALUES(c,y,item,trim(p->>'name'),(p->>'opening')::bigint) ON CONFLICT(church_id,year,id) DO UPDATE SET name=excluded.name,opening=excluded.opening;
   ELSIF a='BUDGET_SAVE' THEN
    before_value:=(SELECT to_jsonb(b) FROM finance.budgets b WHERE church_id=c AND year=y AND category_id=(p->>'categoryId')::uuid);
    INSERT INTO finance.budgets VALUES(c,y,(p->>'categoryId')::uuid,(p->>'amount')::bigint) ON CONFLICT(church_id,year,category_id) DO UPDATE SET amount=excluded.amount;
   ELSIF a='ENTRY_SAVE' THEN
    item:=(p->>'id')::uuid;
    SELECT * INTO old_entry FROM finance.entries WHERE church_id=c AND year=y AND id=item;
    IF FOUND AND (old_entry.status<>'DRAFT' OR (r='BOOKKEEPER' AND old_entry.created_by<>u)) THEN RAISE EXCEPTION 'FINANCE_ENTRY_LOCKED'; END IF;
    IF p->>'kind'<>'TRANSFER' AND NOT EXISTS(SELECT 1 FROM finance.categories WHERE church_id=c AND year=y AND id=(p->>'categoryId')::uuid AND kind=p->>'kind') THEN RAISE EXCEPTION 'FINANCE_CATEGORY_KIND'; END IF;
    INSERT INTO finance.entries(church_id,year,id,date,kind,account_id,destination_id,category_id,amount,member_id,party,memo,receipt,created_by)
     VALUES(c,y,item,(p->>'date')::date,p->>'kind',(p->>'accountId')::uuid,(p->>'destinationId')::uuid,(p->>'categoryId')::uuid,(p->>'amount')::bigint,nullif(p->>'memberId',''),trim(p->>'party'),trim(p->>'memo'),trim(p->>'receipt'),u)
     ON CONFLICT(church_id,year,id) DO UPDATE SET date=excluded.date,kind=excluded.kind,account_id=excluded.account_id,destination_id=excluded.destination_id,category_id=excluded.category_id,amount=excluded.amount,member_id=excluded.member_id,party=excluded.party,memo=excluded.memo,receipt=excluded.receipt;
   ELSIF a IN ('ENTRY_POST','ENTRY_VOID') THEN
    item:=(p->>'id')::uuid;
    SELECT * INTO old_entry FROM finance.entries WHERE church_id=c AND year=y AND id=item;
    IF NOT FOUND OR (a='ENTRY_POST' AND old_entry.status<>'DRAFT') OR old_entry.status='VOID' THEN RAISE EXCEPTION 'FINANCE_ENTRY_LOCKED'; END IF;
    UPDATE finance.entries SET status=CASE WHEN a='ENTRY_POST' THEN 'POSTED' ELSE 'VOID' END,approved_by=u WHERE church_id=c AND year=y AND id=item;
   ELSE RAISE EXCEPTION 'FINANCE_INVALID'; END IF;
   -- No account can become overdrawn, including by voiding an earlier income.
   IF EXISTS(SELECT 1 FROM finance.accounts a WHERE a.church_id=c AND a.year=y AND a.opening+coalesce((SELECT sum(CASE WHEN e.kind='INCOME' OR e.destination_id=a.id THEN e.amount ELSE -e.amount END) FROM finance.entries e WHERE e.church_id=c AND e.year=y AND e.status='POSTED' AND (e.account_id=a.id OR e.destination_id=a.id)),0)<0) THEN RAISE EXCEPTION 'FINANCE_BALANCE'; END IF;
   UPDATE finance.years SET version=version+1 WHERE church_id=c AND year=y;
  END IF;
 END IF;
 IF a IN ('ACCESS_SAVE','BUDGET_SAVE','ENTRY_POST','ENTRY_VOID','YEAR_CLOSE','YEAR_REOPEN') AND coalesce(length(trim(p->>'reason')),0) NOT BETWEEN 1 AND 300 THEN RAISE EXCEPTION 'FINANCE_REASON'; END IF;
 INSERT INTO finance.events(church_id,year,actor,action,reason,metadata) VALUES(c,y,u,a,coalesce(p->>'reason',''),jsonb_build_object('id',p->>'id','before',before_value,'amount',p->'amount','role',p->'role','active',p->'active'));
 INSERT INTO finance.commands VALUES(c,u,request_id,md5(p::text));
 RETURN jsonb_build_object('saved',true);
END $$;
CREATE FUNCTION finance.guard_deletion() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE target uuid;
BEGIN
 IF TG_TABLE_SCHEMA='finance' THEN target:=NEW.user_id; ELSE target:=NEW."ownerId"; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(target::text,0));
 IF TG_TABLE_SCHEMA='finance' THEN
  IF NEW.active AND EXISTS(SELECT 1 FROM public.member_deletions WHERE "ownerId"=target) THEN RAISE EXCEPTION 'FINANCE_ACCOUNT_DELETING' USING ERRCODE='23514'; END IF;
 ELSE
  IF EXISTS(SELECT 1 FROM finance.grants WHERE user_id=target AND active) THEN RAISE EXCEPTION 'FINANCE_REVOKE_BEFORE_DELETION' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER protect_finance_account BEFORE INSERT ON public.member_deletions FOR EACH ROW EXECUTE FUNCTION finance.guard_deletion();
CREATE TRIGGER protect_deleting_account BEFORE INSERT OR UPDATE ON finance.grants FOR EACH ROW EXECUTE FUNCTION finance.guard_deletion();
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA finance FROM PUBLIC;
DO $$ DECLARE r text; BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA finance FROM %I',r); END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='daegwang_ministry_runtime') THEN
  GRANT USAGE ON SCHEMA finance TO daegwang_ministry_runtime;
  GRANT EXECUTE ON FUNCTION finance.context(),finance.read_year(integer),finance.command(jsonb) TO daegwang_ministry_runtime;
 END IF;
END $$;
COMMIT;
