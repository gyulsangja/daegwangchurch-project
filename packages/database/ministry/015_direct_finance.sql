-- Keep existing drafts intact. New recorded transactions use the same locks and balance checks.
BEGIN;
ALTER TABLE finance.paper_issuers ADD COLUMN IF NOT EXISTS recipient text, ADD COLUMN IF NOT EXISTS seal text;
ALTER TABLE finance.receipt_shares ALTER COLUMN entry_id DROP NOT NULL;
CREATE OR REPLACE FUNCTION finance.command(p jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,finance AS $$
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
 ELSIF r IS NULL OR r NOT IN ('MANAGER','BOOKKEEPER') OR (r='BOOKKEEPER' AND a NOT IN ('ENTRY_SAVE','ENTRY_RECORD')) THEN RAISE EXCEPTION 'FINANCE_FORBIDDEN'; END IF;
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
   ELSIF a IN ('ENTRY_SAVE','ENTRY_RECORD') THEN
    item:=(p->>'id')::uuid;
    SELECT * INTO old_entry FROM finance.entries WHERE church_id=c AND year=y AND id=item;
    IF FOUND AND (old_entry.status<>'DRAFT' OR (r='BOOKKEEPER' AND old_entry.created_by<>u)) THEN RAISE EXCEPTION 'FINANCE_ENTRY_LOCKED'; END IF;
    IF p->>'kind'<>'TRANSFER' AND NOT EXISTS(SELECT 1 FROM finance.categories WHERE church_id=c AND year=y AND id=(p->>'categoryId')::uuid AND kind=p->>'kind') THEN RAISE EXCEPTION 'FINANCE_CATEGORY_KIND'; END IF;
    INSERT INTO finance.entries(church_id,year,id,date,kind,account_id,destination_id,category_id,amount,member_id,party,memo,receipt,created_by)
     VALUES(c,y,item,(p->>'date')::date,p->>'kind',(p->>'accountId')::uuid,(p->>'destinationId')::uuid,(p->>'categoryId')::uuid,(p->>'amount')::bigint,nullif(p->>'memberId',''),trim(p->>'party'),trim(p->>'memo'),trim(p->>'receipt'),u)
     ON CONFLICT(church_id,year,id) DO UPDATE SET date=excluded.date,kind=excluded.kind,account_id=excluded.account_id,destination_id=excluded.destination_id,category_id=excluded.category_id,amount=excluded.amount,member_id=excluded.member_id,party=excluded.party,memo=excluded.memo,receipt=excluded.receipt;
   IF a='ENTRY_RECORD' THEN
    UPDATE finance.entries SET status='POSTED',approved_by=u WHERE church_id=c AND year=y AND id=item;
   END IF;
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
CREATE OR REPLACE FUNCTION finance.receipt_command(p jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,finance AS $$
DECLARE c text:=current_setting('ministry.church_id',true); u uuid:=current_setting('ministry.user_id',true)::uuid;
 y int:=(p->>'year')::int; req uuid:=(p->>'requestId')::uuid; a text:=p->>'action'; prior text;
 entry finance.entries; issuer finance.paper_issuers; donor text; n bigint:=(p->>'amount')::bigint; used bigint; ref text:=trim(p->>'reason');
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('finance:'||c,0));
 IF finance.context()->>'role' IS DISTINCT FROM 'MANAGER' THEN RAISE EXCEPTION 'FINANCE_FORBIDDEN'; END IF;
 SELECT fingerprint INTO prior FROM finance.commands WHERE church_id=c AND actor=u AND id=req;
 IF FOUND THEN IF prior<>md5(p::text) THEN RAISE EXCEPTION 'FINANCE_CONFLICT'; END IF; RETURN '{"saved":true}'; END IF;
 IF NOT EXISTS(SELECT FROM finance.years WHERE church_id=c AND year=y AND version=(p->>'version')::int) THEN RAISE EXCEPTION 'FINANCE_CONFLICT'; END IF;
 IF coalesce(length(ref),0) NOT BETWEEN 1 AND 300 THEN RAISE EXCEPTION 'FINANCE_REASON'; END IF;
 IF a='ISSUER_SETUP' THEN
   IF (p->>'confirmed')::boolean IS DISTINCT FROM true OR p->>'registration' !~ '^[0-9]{10}$' THEN RAISE EXCEPTION 'FINANCE_INVALID'; END IF;
   IF p->>'seal' IS NOT NULL AND (length(p->>'seal')>90000 OR p->>'seal' !~ '^data:image/png;base64,iVBORw0KGgo[A-Za-z0-9+/]*={0,2}$') THEN RAISE EXCEPTION 'FINANCE_INVALID'; END IF;
   INSERT INTO finance.paper_issuers(church_id,year,name,address,registration,legal_basis,gift_code,verification_reference,recipient,seal) VALUES(c,y,trim(p->>'name'),trim(p->>'address'),p->>'registration',trim(p->>'legalBasis'),trim(p->>'giftCode'),ref,trim(p->>'recipient'),p->>'seal')
   ON CONFLICT(church_id,year) DO UPDATE SET name=excluded.name,address=excluded.address,registration=excluded.registration,legal_basis=excluded.legal_basis,gift_code=excluded.gift_code,verification_reference=excluded.verification_reference, recipient=coalesce(excluded.recipient,finance.paper_issuers.recipient), seal=CASE WHEN p ? 'seal' THEN excluded.seal ELSE finance.paper_issuers.seal END;
 ELSIF a IN ('RECEIPT_SHARE','RECEIPT_WRITE') THEN
   SELECT * INTO issuer FROM finance.paper_issuers WHERE church_id=c AND year=y;
   IF NOT FOUND THEN RAISE EXCEPTION 'PAPER_DISABLED'; END IF;
   IF a='RECEIPT_WRITE' AND (extract(year FROM (p->>'date')::date) IS DISTINCT FROM y OR nullif(trim(p->>'description'),'') IS NULL) THEN RAISE EXCEPTION 'FINANCE_INVALID'; END IF;
   IF p ? 'goods' AND (a<>'RECEIPT_WRITE' OR p->>'id' IS NOT NULL OR coalesce((p#>>'{goods,quantity}')::bigint,0)<=0 OR coalesce((p#>>'{goods,unitPrice}')::bigint,0)<=0 OR (p#>>'{goods,quantity}')::numeric*(p#>>'{goods,unitPrice}')::numeric IS DISTINCT FROM n::numeric) THEN RAISE EXCEPTION 'FINANCE_INVALID'; END IF;
   IF a='RECEIPT_SHARE' OR p->>'id' IS NOT NULL THEN
   SELECT e.* INTO entry FROM finance.entries e JOIN finance.categories k ON (k.church_id,k.year,k.id)=(e.church_id,e.year,e.category_id)
   WHERE e.church_id=c AND e.year=y AND e.id=(p->>'id')::uuid AND e.status='POSTED' AND e.kind='INCOME' AND k.offering;
   IF NOT FOUND OR EXISTS(SELECT FROM finance.paper_receipts WHERE church_id=c AND year=y AND entry_id=entry.id) THEN RAISE EXCEPTION 'FINANCE_INVALID'; END IF;
   END IF;
   IF nullif(p->>'memberId','') IS NULL THEN donor:=trim(p->>'donorName');
   ELSE SELECT payload->>'name' INTO donor FROM ministry.members WHERE church_id=c AND id=p->>'memberId'; END IF;
   IF nullif(trim(donor),'') IS NULL OR length(donor)>100 THEN RAISE EXCEPTION 'FINANCE_INVALID'; END IF;
   SELECT coalesce(sum(amount),0) INTO used FROM finance.receipt_shares WHERE church_id=c AND year=y AND entry_id=entry.id AND void_reason IS NULL;
   IF n IS NULL OR n<1 OR (entry.id IS NOT NULL AND used+n>entry.amount) OR n>1000000000000 THEN RAISE EXCEPTION 'SHARE_AMOUNT'; END IF;
   INSERT INTO finance.receipt_shares(church_id,year,entry_id,amount,snapshot) VALUES(c,y,entry.id,n,jsonb_build_object('issuer',to_jsonb(issuer)-'verification_reference'-'church_id'-'year','issued',timezone('Asia/Seoul',now())::date,'goods',p->'goods','description',trim(p->>'description'),'date',coalesce((p->>'date')::date,entry.date),'memberId',p->>'memberId','name',donor,'amount',n));
 ELSIF a='RECEIPT_CANCEL' THEN
   UPDATE finance.receipt_shares SET void_reason=ref WHERE church_id=c AND year=y AND serial=(p->>'serial')::bigint AND void_reason IS NULL;
   IF NOT FOUND THEN RAISE EXCEPTION 'FINANCE_CONFLICT'; END IF;
 ELSE RAISE EXCEPTION 'FINANCE_INVALID'; END IF;
 UPDATE finance.years SET version=version+1 WHERE church_id=c AND year=y;
 INSERT INTO finance.commands VALUES(c,u,req,md5(p::text));
 INSERT INTO finance.events(church_id,year,actor,action,reason,metadata) VALUES(c,y,u,a,ref,jsonb_build_object('entry',p->>'id','serial',p->>'serial'));
 RETURN '{"saved":true}';
END $$;
CREATE OR REPLACE FUNCTION finance.giving_workspace(y int,f date,t date) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,finance AS $$
DECLARE s jsonb:=finance.workspace(y,f,t); c text:=current_setting('ministry.church_id',true);
BEGIN
 IF coalesce(s->>'role','') NOT IN ('MANAGER','BOOKKEEPER','AUDITOR') THEN RETURN s; END IF;
 s:=s||jsonb_build_object('families',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'name',payload->>'name','memberIds',coalesce((SELECT jsonb_agg(m->>'memberId') FROM jsonb_array_elements(payload->'members') m),'[]')) ORDER BY payload->>'name') FROM ministry.families WHERE church_id=c AND coalesce(payload->>'archived','false')<>'true'),'[]'),
 'organizations',coalesce((SELECT jsonb_agg(DISTINCT payload->>'name') FROM ministry.organizations WHERE church_id=c AND payload->>'name' IS NOT NULL),'[]'));
 IF s->>'role'='MANAGER' THEN
 s:=s||jsonb_build_object('issuer',(SELECT to_jsonb(i)-'verification_reference'-'church_id'-'year' FROM finance.paper_issuers i WHERE church_id=c AND year=y),'receipts',(s->'receipts')||coalesce((SELECT jsonb_agg(snapshot||jsonb_build_object('serial',serial::text,'id',entry_id,'share',true,'voided',void_reason IS NOT NULL) ORDER BY serial DESC) FROM finance.receipt_shares WHERE church_id=c AND year=y),'[]'::jsonb));
 END IF; RETURN s;
END $$;
COMMIT;
