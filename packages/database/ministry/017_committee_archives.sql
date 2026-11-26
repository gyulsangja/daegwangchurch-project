BEGIN;
CREATE TABLE finance.committee_archives(
 church_id text NOT NULL REFERENCES ministry.churches(id), year integer NOT NULL,
 id uuid NOT NULL, revision integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid NOT NULL, meeting_date date NOT NULL, reference text NOT NULL, note text NOT NULL,
 fingerprint text NOT NULL, reports jsonb NOT NULL,
 PRIMARY KEY(church_id,year,id), UNIQUE(church_id,year,revision)
);
ALTER TABLE finance.committee_archives ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON finance.committee_archives FROM PUBLIC,anon,authenticated,service_role,daegwang_ministry_runtime;

CREATE FUNCTION finance.committee_report(y int) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,finance AS $$
 WITH scope AS (SELECT current_setting('ministry.church_id',true) AS c),
 totals AS (SELECT e.category_id,sum(e.amount) AS amount FROM finance.entries e,scope WHERE e.church_id=c AND e.year=y AND e.status='POSTED' AND e.category_id IS NOT NULL GROUP BY e.category_id),
 cats AS (SELECT k.id,k.name,k.kind,k.offering,coalesce(s.section,'') AS section,coalesce(s.active,true) AS active,coalesce(b.amount,0) AS budget,coalesce(t.amount,0) AS actual
 FROM scope JOIN finance.categories k ON k.church_id=c AND k.year=y LEFT JOIN finance.category_settings s ON (s.church_id,s.year,s.id)=(k.church_id,k.year,k.id)
 LEFT JOIN finance.budgets b ON (b.church_id,b.year,b.category_id)=(k.church_id,k.year,k.id) LEFT JOIN totals t ON t.category_id=k.id)
 SELECT jsonb_build_object('year',y,'available',v.year IS NOT NULL,'closed',coalesce(v.closed,false),'version',coalesce(v.version,0),'categories',coalesce((SELECT jsonb_agg(to_jsonb(cats) ORDER BY kind,section,name,id) FROM cats),'[]'))
 FROM scope LEFT JOIN finance.years v ON v.church_id=c AND v.year=y;
$$;
CREATE FUNCTION finance.committee_files(y int,selected uuid DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,finance AS $$
DECLARE c text:=current_setting('ministry.church_id',true); row_data jsonb;
BEGIN
 IF finance.context()->>'role' IS NULL THEN RAISE EXCEPTION 'FINANCE_FORBIDDEN'; END IF;
 IF selected IS NOT NULL THEN
   SELECT jsonb_build_object('id',id,'revision',revision,'meetingDate',meeting_date,'reference',reference,'note',note,'reports',reports) INTO row_data
   FROM finance.committee_archives WHERE church_id=c AND year=y AND id=selected;
   IF NOT FOUND THEN RAISE EXCEPTION 'FINANCE_CONFLICT'; END IF;
   RETURN row_data;
 END IF;
 RETURN jsonb_build_object('reports',jsonb_build_array(finance.committee_report(y),finance.committee_report(y+1)),
  'archives',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'revision',revision,'meetingDate',meeting_date,'reference',reference) ORDER BY revision DESC) FROM finance.committee_archives WHERE church_id=c AND year=y),'[]'));
END $$;

CREATE FUNCTION finance.archive_committee(p jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,finance AS $$
DECLARE c text:=current_setting('ministry.church_id',true); u uuid:=current_setting('ministry.user_id',true)::uuid;
 y int:=(p->>'year')::int; rid uuid:=(p->>'requestId')::uuid; ref text:=trim(p->>'reference'); details text:=coalesce(trim(p->>'note'),''); meeting date:=(p->>'meetingDate')::date;
 first_report jsonb; second_report jsonb; previous text; revision_no int;
BEGIN
 IF finance.context()->>'role' IS DISTINCT FROM 'MANAGER' THEN RAISE EXCEPTION 'FINANCE_FORBIDDEN'; END IF;
 IF y NOT BETWEEN 2000 AND 2199 OR coalesce(length(ref),0) NOT BETWEEN 1 AND 150 OR length(details)>2000 OR meeting IS NULL THEN RAISE EXCEPTION 'FINANCE_INVALID'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('finance:'||c,0));
 SELECT fingerprint INTO previous FROM finance.committee_archives WHERE church_id=c AND year=y AND id=rid;
 IF FOUND THEN IF previous<>md5(p::text) THEN RAISE EXCEPTION 'FINANCE_CONFLICT'; END IF; RETURN jsonb_build_object('id',rid); END IF;
 first_report:=finance.committee_report(y);second_report:=finance.committee_report(y+1);
 IF coalesce((first_report->>'version')::int,0) IS DISTINCT FROM (p->>'version')::int OR coalesce((second_report->>'version')::int,0) IS DISTINCT FROM (p->>'nextVersion')::int
 OR (first_report->>'version'='0' AND second_report->>'version'='0') THEN RAISE EXCEPTION 'FINANCE_CONFLICT'; END IF;
 SELECT coalesce(max(revision),0)+1 INTO revision_no FROM finance.committee_archives WHERE church_id=c AND year=y;
 INSERT INTO finance.committee_archives(church_id,year,id,revision,created_by,meeting_date,reference,note,fingerprint,reports)
 VALUES(c,y,rid,revision_no,u,meeting,ref,details,md5(p::text),jsonb_build_array(first_report,second_report));
 INSERT INTO finance.events(church_id,year,actor,action,reason,metadata) VALUES(c,y,u,'COMMITTEE_ARCHIVE',ref,jsonb_build_object('id',rid,'revision',revision_no));
 RETURN jsonb_build_object('id',rid);
END $$;
REVOKE ALL ON FUNCTION finance.committee_report(int),finance.committee_files(int,uuid),finance.archive_committee(jsonb) FROM PUBLIC,anon,authenticated,service_role,daegwang_ministry_runtime;
GRANT EXECUTE ON FUNCTION finance.committee_files(int,uuid),finance.archive_committee(jsonb) TO daegwang_ministry_runtime;
COMMIT;

