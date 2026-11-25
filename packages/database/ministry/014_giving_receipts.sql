BEGIN;
CREATE TABLE finance.receipt_shares (
 serial bigint PRIMARY KEY DEFAULT nextval('finance.paper_receipts_serial_seq'), church_id text NOT NULL, year int NOT NULL,
 entry_id uuid NOT NULL, amount bigint NOT NULL CHECK(amount>0), snapshot jsonb NOT NULL, void_reason text,
 FOREIGN KEY(church_id,year,entry_id) REFERENCES finance.entries
);
CREATE INDEX receipt_share_entry ON finance.receipt_shares(church_id,year,entry_id);
ALTER TABLE finance.receipt_shares ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON finance.receipt_shares FROM PUBLIC,anon,authenticated,service_role,daegwang_ministry_runtime;

CREATE FUNCTION finance.protect_receipt_shares() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,finance AS $$
DECLARE eid uuid;
BEGIN
 IF TG_TABLE_NAME='entries' THEN
   IF NEW.status<>'VOID' THEN RETURN NEW; END IF;
   eid:=NEW.id;
 ELSE eid:=NEW.entry_id; END IF;
 IF EXISTS(SELECT FROM finance.receipt_shares WHERE church_id=NEW.church_id AND year=NEW.year AND entry_id=eid AND void_reason IS NULL)
 THEN RAISE EXCEPTION 'RECEIPT_ISSUED'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER protect_allocated_income BEFORE UPDATE ON finance.entries FOR EACH ROW EXECUTE FUNCTION finance.protect_receipt_shares();
CREATE TRIGGER protect_legacy_issue BEFORE INSERT ON finance.paper_receipts FOR EACH ROW EXECUTE FUNCTION finance.protect_receipt_shares();

CREATE FUNCTION finance.receipt_command(p jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,finance AS $$
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
   INSERT INTO finance.paper_issuers VALUES(c,y,trim(p->>'name'),trim(p->>'address'),p->>'registration',trim(p->>'legalBasis'),trim(p->>'giftCode'),ref)
   ON CONFLICT(church_id,year) DO UPDATE SET name=excluded.name,address=excluded.address,registration=excluded.registration,legal_basis=excluded.legal_basis,gift_code=excluded.gift_code,verification_reference=excluded.verification_reference;
 ELSIF a='RECEIPT_SHARE' THEN
   SELECT * INTO issuer FROM finance.paper_issuers WHERE church_id=c AND year=y;
   IF NOT FOUND THEN RAISE EXCEPTION 'PAPER_DISABLED'; END IF;
   SELECT e.* INTO entry FROM finance.entries e JOIN finance.categories k ON (k.church_id,k.year,k.id)=(e.church_id,e.year,e.category_id)
   WHERE e.church_id=c AND e.year=y AND e.id=(p->>'id')::uuid AND e.status='POSTED' AND e.kind='INCOME' AND k.offering;
   IF NOT FOUND OR EXISTS(SELECT FROM finance.paper_receipts WHERE church_id=c AND year=y AND entry_id=entry.id) THEN RAISE EXCEPTION 'FINANCE_INVALID'; END IF;
   IF nullif(p->>'memberId','') IS NULL THEN donor:=trim(p->>'donorName');
   ELSE SELECT payload->>'name' INTO donor FROM ministry.members WHERE church_id=c AND id=p->>'memberId'; END IF;
   IF nullif(trim(donor),'') IS NULL OR length(donor)>100 THEN RAISE EXCEPTION 'FINANCE_INVALID'; END IF;
   SELECT coalesce(sum(amount),0) INTO used FROM finance.receipt_shares WHERE church_id=c AND year=y AND entry_id=entry.id AND void_reason IS NULL;
   IF n IS NULL OR n<1 OR used+n>entry.amount THEN RAISE EXCEPTION 'SHARE_AMOUNT'; END IF;
   INSERT INTO finance.receipt_shares(church_id,year,entry_id,amount,snapshot) VALUES(c,y,entry.id,n,jsonb_build_object('issuer',to_jsonb(issuer)-'verification_reference'-'church_id'-'year','issued',timezone('Asia/Seoul',now())::date,'date',entry.date,'memberId',p->>'memberId','name',donor,'amount',n));
 ELSIF a='RECEIPT_CANCEL' THEN
   UPDATE finance.receipt_shares SET void_reason=ref WHERE church_id=c AND year=y AND serial=(p->>'serial')::bigint AND void_reason IS NULL;
   IF NOT FOUND THEN RAISE EXCEPTION 'FINANCE_CONFLICT'; END IF;
 ELSE RAISE EXCEPTION 'FINANCE_INVALID'; END IF;
 UPDATE finance.years SET version=version+1 WHERE church_id=c AND year=y;
 INSERT INTO finance.commands VALUES(c,u,req,md5(p::text));
 INSERT INTO finance.events(church_id,year,actor,action,reason,metadata) VALUES(c,y,u,a,ref,jsonb_build_object('entry',p->>'id','serial',p->>'serial'));
 RETURN '{"saved":true}';
END $$;
CREATE FUNCTION finance.giving_workspace(y int,f date,t date) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,finance AS $$
DECLARE s jsonb:=finance.workspace(y,f,t); c text:=current_setting('ministry.church_id',true);
BEGIN
 IF coalesce(s->>'role','') NOT IN ('MANAGER','BOOKKEEPER','AUDITOR') THEN RETURN s; END IF;
 s:=s||jsonb_build_object('families',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'name',payload->>'name','memberIds',coalesce((SELECT jsonb_agg(m->>'memberId') FROM jsonb_array_elements(payload->'members') m),'[]')) ORDER BY payload->>'name') FROM ministry.families WHERE church_id=c AND coalesce(payload->>'archived','false')<>'true'),'[]'),
 'organizations',coalesce((SELECT jsonb_agg(DISTINCT payload->>'name') FROM ministry.organizations WHERE church_id=c AND payload->>'name' IS NOT NULL),'[]'));
 IF s->>'role'='MANAGER' THEN
 s:=s||jsonb_build_object('receipts',(s->'receipts')||coalesce((SELECT jsonb_agg(snapshot||jsonb_build_object('serial',serial::text,'id',entry_id,'share',true,'voided',void_reason IS NOT NULL) ORDER BY serial DESC) FROM finance.receipt_shares WHERE church_id=c AND year=y),'[]'::jsonb));
 END IF; RETURN s;
END $$;
REVOKE ALL ON FUNCTION finance.protect_receipt_shares(),finance.receipt_command(jsonb),finance.giving_workspace(int,date,date) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION finance.receipt_command(jsonb),finance.giving_workspace(int,date,date) TO daegwang_ministry_runtime;
COMMIT;
