BEGIN;
CREATE TABLE finance.receipt_counters(
 church_id text NOT NULL, issue_year int NOT NULL, last_number bigint NOT NULL,
 PRIMARY KEY(church_id,issue_year)
);
CREATE TABLE finance.legacy_receipt_voids(
 serial bigint PRIMARY KEY REFERENCES finance.paper_receipts(serial),
 reason text NOT NULL, actor uuid NOT NULL, cancelled_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE finance.receipt_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.legacy_receipt_voids ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON finance.receipt_counters,finance.legacy_receipt_voids FROM PUBLIC,anon,authenticated,service_role,daegwang_ministry_runtime;

CREATE FUNCTION finance.stamp_receipt() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,finance AS $$
DECLARE y int; n bigint;
BEGIN
 IF TG_OP='INSERT' THEN
  y:=extract(year FROM (NEW.snapshot->>'issued')::date);
  INSERT INTO finance.receipt_counters VALUES(NEW.church_id,y,1)
   ON CONFLICT(church_id,issue_year) DO UPDATE SET last_number=finance.receipt_counters.last_number+1
   RETURNING last_number INTO n;
  NEW.snapshot:=NEW.snapshot||jsonb_build_object('documentNo',y::text||'-'||lpad(n::text,greatest(5,length(n::text)),'0'));
 ELSIF NEW.void_reason IS NOT NULL AND OLD.void_reason IS NULL THEN
  NEW.snapshot:=NEW.snapshot||jsonb_build_object('voidAt',now(),'voidBy',current_setting('ministry.user_id',true),'voidReason',NEW.void_reason);
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER stamp_new_receipt BEFORE INSERT OR UPDATE OF void_reason ON finance.receipt_shares FOR EACH ROW EXECUTE FUNCTION finance.stamp_receipt();
CREATE TRIGGER stamp_new_legacy_receipt BEFORE INSERT ON finance.paper_receipts FOR EACH ROW EXECUTE FUNCTION finance.stamp_receipt();

CREATE FUNCTION finance.cancel_receipt(p jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,finance AS $$
DECLARE c text:=current_setting('ministry.church_id',true); u uuid:=current_setting('ministry.user_id',true)::uuid;
 y int:=(p->>'year')::int; n bigint:=(p->>'serial')::bigint; why text:=trim(p->>'reason'); prior text; req uuid:=(p->>'requestId')::uuid;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('finance:'||c,0));
 IF finance.context()->>'role' IS DISTINCT FROM 'MANAGER' OR p->>'action' IS DISTINCT FROM 'RECEIPT_CANCEL' THEN RAISE EXCEPTION 'FINANCE_FORBIDDEN'; END IF;
 IF NOT EXISTS(SELECT FROM finance.paper_receipts WHERE serial=n AND year=y AND church_id=c) THEN RETURN finance.receipt_command(p); END IF;
 SELECT fingerprint INTO prior FROM finance.commands WHERE church_id=c AND actor=u AND id=req;
 IF FOUND THEN IF prior<>md5(p::text) THEN RAISE EXCEPTION 'FINANCE_CONFLICT'; END IF; RETURN '{"saved":true}'; END IF;
 IF coalesce(length(why),0) NOT BETWEEN 1 AND 300 THEN RAISE EXCEPTION 'FINANCE_REASON'; END IF;
 UPDATE finance.years SET version=version+1 WHERE church_id=c AND year=y AND version=(p->>'version')::int;
 IF NOT FOUND OR EXISTS(SELECT FROM finance.legacy_receipt_voids WHERE serial=n) THEN RAISE EXCEPTION 'FINANCE_CONFLICT'; END IF;
 INSERT INTO finance.legacy_receipt_voids(serial,reason,actor) VALUES(n,why,u);
 INSERT INTO finance.events(church_id,year,actor,action,reason,metadata) VALUES(c,y,u,'RECEIPT_CANCEL',why,jsonb_build_object('serial',n::text));
 INSERT INTO finance.commands VALUES(c,u,req,md5(p::text));
 RETURN '{"saved":true}';
END $$;

CREATE FUNCTION finance.receipt_register(y int,by_issue boolean) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,finance AS $$
DECLARE c text:=current_setting('ministry.church_id',true);
BEGIN
 IF finance.context()->>'role' IS DISTINCT FROM 'MANAGER' THEN RAISE EXCEPTION 'FINANCE_FORBIDDEN'; END IF;
 RETURN (SELECT coalesce(jsonb_agg(doc ORDER BY serial DESC),'[]') FROM (
 SELECT r.serial,r.snapshot||jsonb_build_object('serial',r.serial::text,'ledgerYear',r.year,'id',r.entry_id,'share',true,'voided',r.void_reason IS NOT NULL,'voidReason',r.void_reason) AS doc
 FROM finance.receipt_shares r WHERE r.church_id=c AND CASE WHEN by_issue THEN left(r.snapshot->>'issued',4)=y::text ELSE r.year=y END
 UNION ALL
 SELECT r.serial,r.snapshot||jsonb_build_object('serial',r.serial::text,'ledgerYear',r.year,'id',r.entry_id,'voided',v.serial IS NOT NULL,'voidAt',v.cancelled_at,'voidBy',v.actor,'voidReason',v.reason)
 FROM finance.paper_receipts r LEFT JOIN finance.legacy_receipt_voids v USING(serial) WHERE r.church_id=c AND CASE WHEN by_issue THEN left(r.snapshot->>'issued',4)=y::text ELSE r.year=y END
 ) rows);
END $$;
REVOKE ALL ON FUNCTION finance.stamp_receipt(),finance.cancel_receipt(jsonb),finance.receipt_register(int,boolean) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION finance.cancel_receipt(jsonb),finance.receipt_register(int,boolean) TO daegwang_ministry_runtime;
COMMIT;
