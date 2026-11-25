BEGIN;
CREATE TABLE finance.closed_months (
 church_id text NOT NULL, year int NOT NULL, month int NOT NULL CHECK(month BETWEEN 1 AND 12),
 PRIMARY KEY(church_id,year,month), FOREIGN KEY(church_id,year) REFERENCES finance.years
);
CREATE TABLE finance.category_settings (
 church_id text NOT NULL, year int NOT NULL, id uuid NOT NULL, section text NOT NULL CHECK(length(section)<=80), active boolean NOT NULL,
 PRIMARY KEY(church_id,year,id), FOREIGN KEY(church_id,year,id) REFERENCES finance.categories
);
ALTER TABLE finance.closed_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.category_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON finance.closed_months,finance.category_settings FROM PUBLIC,anon,authenticated,service_role,daegwang_ministry_runtime;

-- An operator provisions a year only after checking documentary eligibility and paper issuance.
CREATE TABLE finance.paper_issuers (
 church_id text NOT NULL, year integer NOT NULL, name text NOT NULL, address text NOT NULL,
 registration text NOT NULL, legal_basis text NOT NULL, gift_code text NOT NULL, verification_reference text NOT NULL,
 CHECK (least(length(trim(name)),length(trim(address)),length(trim(registration)),length(trim(legal_basis)),length(trim(gift_code)),length(trim(verification_reference)))>0),
 PRIMARY KEY(church_id,year), FOREIGN KEY(church_id,year) REFERENCES finance.years
);
CREATE TABLE finance.paper_receipts (
 serial bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, church_id text NOT NULL, year int NOT NULL, entry_id uuid NOT NULL,
 snapshot jsonb NOT NULL, UNIQUE(church_id,year,entry_id), FOREIGN KEY(church_id,year,entry_id) REFERENCES finance.entries
);
ALTER TABLE finance.paper_issuers ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.paper_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON finance.paper_issuers,finance.paper_receipts FROM PUBLIC,anon,authenticated,service_role,daegwang_ministry_runtime;
REVOKE ALL ON SEQUENCE finance.paper_receipts_serial_seq FROM PUBLIC,anon,authenticated,service_role,daegwang_ministry_runtime;
CREATE FUNCTION finance.entry_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,finance AS $$
BEGIN
 IF EXISTS(SELECT FROM finance.closed_months m WHERE m.church_id=NEW.church_id AND m.year=NEW.year
 AND (m.month=extract(month FROM NEW.date) OR (TG_OP='UPDATE' AND m.month=extract(month FROM OLD.date)))) THEN
 RAISE EXCEPTION 'MONTH_LOCKED'; END IF;
 IF NEW.status='VOID' AND EXISTS(SELECT FROM finance.paper_receipts WHERE church_id=NEW.church_id AND year=NEW.year AND entry_id=NEW.id) THEN RAISE EXCEPTION 'RECEIPT_ISSUED'; END IF;
 IF NEW.status='DRAFT' AND EXISTS(SELECT FROM finance.category_settings s WHERE (s.church_id,s.year,s.id)=(NEW.church_id,NEW.year,NEW.category_id) AND NOT s.active) THEN RAISE EXCEPTION 'CATEGORY_INACTIVE'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER protect_month BEFORE INSERT OR UPDATE ON finance.entries FOR EACH ROW EXECUTE FUNCTION finance.entry_guard();

CREATE FUNCTION finance.copy_category_settings() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,finance AS $$
BEGIN
 INSERT INTO finance.category_settings(church_id,year,id,section,active)
 SELECT NEW.church_id,NEW.year,NEW.id,s.section,s.active FROM finance.category_settings s JOIN finance.years y
 ON y.church_id=s.church_id AND y.carried_from=s.year
 WHERE y.church_id=NEW.church_id AND y.year=NEW.year AND s.id=NEW.id;
 RETURN NEW;
END $$;
CREATE TRIGGER carry_category AFTER INSERT ON finance.categories FOR EACH ROW EXECUTE FUNCTION finance.copy_category_settings();
REVOKE ALL ON FUNCTION finance.copy_category_settings() FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION finance.manage(p jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,finance AS $$
DECLARE c text:=current_setting('ministry.church_id',true); u uuid:=current_setting('ministry.user_id',true)::uuid;
 y int:=(p->>'year')::int; a text:=p->>'action'; m int:=(p->>'month')::int; yr finance.years; prior text; req uuid:=(p->>'requestId')::uuid;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('finance:'||c,0));
 IF finance.context()->>'role' IS DISTINCT FROM 'MANAGER' THEN RAISE EXCEPTION 'FINANCE_FORBIDDEN'; END IF;
 SELECT fingerprint INTO prior FROM finance.commands WHERE church_id=c AND actor=u AND id=req;
 IF FOUND THEN IF prior<>md5(p::text) THEN RAISE EXCEPTION 'FINANCE_CONFLICT'; END IF; RETURN '{"saved":true}'::jsonb; END IF;
 SELECT * INTO STRICT yr FROM finance.years WHERE church_id=c AND year=y FOR UPDATE;
 IF yr.closed AND a<>'ISSUE_PAPER' THEN RAISE EXCEPTION 'FINANCE_CLOSED'; END IF;
 IF yr.version IS DISTINCT FROM (p->>'version')::int THEN RAISE EXCEPTION 'FINANCE_CONFLICT'; END IF;
 IF a='ISSUE_PAPER' THEN
   IF NOT EXISTS(SELECT FROM finance.paper_issuers WHERE church_id=c AND year=y) THEN RAISE EXCEPTION 'PAPER_DISABLED'; END IF;
   INSERT INTO finance.paper_receipts(church_id,year,entry_id,snapshot)
   SELECT c,y,e.id,jsonb_build_object('issuer',to_jsonb(i)-'verification_reference'-'church_id'-'year',
     'issued',timezone('Asia/Seoul',now())::date,'name',m.payload->>'name','date',e.date,'amount',e.amount,'memberId',m.id)
   FROM finance.entries e JOIN finance.categories k ON (k.church_id,k.year,k.id)=(e.church_id,e.year,e.category_id)
   JOIN ministry.members m ON (m.church_id,m.id)=(e.church_id,e.member_id)
   JOIN finance.paper_issuers i ON (i.church_id,i.year)=(e.church_id,e.year)
   WHERE e.church_id=c AND e.year=y AND e.id=(p->>'id')::uuid AND e.status='POSTED' AND e.kind='INCOME' AND k.offering;
   IF NOT FOUND THEN RAISE EXCEPTION 'FINANCE_INVALID'; END IF;
 ELSIF a='CATEGORY_CONFIG' THEN
   PERFORM finance.command((p-'section'-'active')||jsonb_build_object('requestId',gen_random_uuid(),'action','CATEGORY_SAVE'));
   INSERT INTO finance.category_settings VALUES(c,y,(p->>'id')::uuid,trim(p->>'section'),(p->>'active')::boolean)
   ON CONFLICT(church_id,year,id) DO UPDATE SET section=excluded.section,active=excluded.active;
 ELSIF a IN ('MONTH_CLOSE','MONTH_REOPEN') THEN
   IF m IS NULL OR m NOT BETWEEN 1 AND 12 OR coalesce(length(trim(p->>'reason')),0)=0 THEN RAISE EXCEPTION 'FINANCE_INVALID'; END IF;
   IF a='MONTH_CLOSE' THEN
     IF EXISTS(SELECT FROM finance.entries WHERE church_id=c AND year=y AND extract(month FROM date)=m AND status='DRAFT') THEN RAISE EXCEPTION 'FINANCE_DRAFTS'; END IF;
     INSERT INTO finance.closed_months VALUES(c,y,m);
   ELSE
     DELETE FROM finance.closed_months WHERE church_id=c AND year=y AND month=m;
     IF NOT FOUND THEN RAISE EXCEPTION 'FINANCE_CONFLICT'; END IF;
   END IF;
   UPDATE finance.years SET version=version+1 WHERE church_id=c AND year=y;
 ELSE RAISE EXCEPTION 'FINANCE_INVALID'; END IF;
 INSERT INTO finance.events(church_id,year,actor,action,reason,metadata) VALUES(c,y,u,a,coalesce(p->>'reason','항목 설정'),p-'requestId'-'reason');
 INSERT INTO finance.commands(church_id,actor,id,fingerprint) VALUES(c,u,req,md5(p::text));
 RETURN '{"saved":true}'::jsonb;
END $$;
CREATE FUNCTION finance.workspace(y int,f date,t date) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,finance AS $$
DECLARE s jsonb; c text:=current_setting('ministry.church_id',true);
BEGIN
 s:=CASE WHEN f IS NULL AND t IS NULL THEN finance.read_year(y) ELSE finance.read_period(y,f,t) END;
 IF s->>'role' IS NULL THEN RETURN s; END IF;
 IF s->>'role'='MANAGER' THEN
 s:=s||jsonb_build_object('paperEnabled',EXISTS(SELECT FROM finance.paper_issuers WHERE church_id=c AND year=y),
 'receipts',coalesce((SELECT jsonb_agg(snapshot||jsonb_build_object('serial',serial::text,'id',entry_id)) FROM finance.paper_receipts WHERE church_id=c AND year=y),'[]'::jsonb));
 END IF;
 RETURN s||jsonb_build_object('months',coalesce((SELECT jsonb_agg(month ORDER BY month) FROM finance.closed_months WHERE church_id=c AND year=y),'[]'::jsonb),
 'categories',coalesce((SELECT jsonb_agg(v||jsonb_build_object('section',coalesce(cs.section,''),'active',coalesce(cs.active,true)) ORDER BY ord)
 FROM jsonb_array_elements(s->'categories') WITH ORDINALITY x(v,ord) LEFT JOIN finance.category_settings cs ON cs.church_id=c AND cs.year=y AND cs.id=(v->>'id')::uuid),'[]'::jsonb));
END $$;
REVOKE ALL ON FUNCTION finance.workspace(int,date,date),finance.manage(jsonb),finance.entry_guard() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION finance.workspace(int,date,date),finance.manage(jsonb) TO daegwang_ministry_runtime;
COMMIT;
