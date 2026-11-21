CREATE TABLE public.store_page_views (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 event_id uuid UNIQUE NOT NULL,
 session_key text NOT NULL CHECK(length(session_key)=64),
 path text NOT NULL CHECK(length(path)<=180),
 viewed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX store_page_views_time ON public.store_page_views(viewed_at);
CREATE INDEX store_page_views_session ON public.store_page_views(session_key,viewed_at);
ALTER TABLE public.store_page_views ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.store_page_views FROM anon,authenticated;
GRANT ALL ON public.store_page_views TO service_role;
GRANT USAGE,SELECT ON SEQUENCE public.store_page_views_id_seq TO service_role;
CREATE FUNCTION public.record_cardones_view(p_event uuid,p_session text,p_path text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext(p_session));
 IF (SELECT count(*) FROM store_page_views WHERE session_key=p_session AND viewed_at>now()-interval '1 day')>=120 THEN RETURN; END IF;
 INSERT INTO store_page_views(event_id,session_key,path) VALUES(p_event,p_session,p_path) ON CONFLICT(event_id) DO NOTHING;
 DELETE FROM store_page_views WHERE viewed_at<now()-interval '90 days';
END $$;
CREATE FUNCTION public.cardones_traffic_report(p_days integer) RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
 WITH views AS (SELECT * FROM store_page_views WHERE viewed_at >= ((now() AT TIME ZONE 'America/Jamaica')::date - (least(greatest(p_days,1),90)-1))::timestamp AT TIME ZONE 'America/Jamaica'),
 daily AS (SELECT (viewed_at AT TIME ZONE 'America/Jamaica')::date AS day,count(*) views,count(DISTINCT session_key) visits FROM views GROUP BY 1 ORDER BY 1),
 pages AS (SELECT path,count(*) views FROM views GROUP BY path ORDER BY views DESC LIMIT 20)
 SELECT jsonb_build_object('pageViews',(SELECT count(*) FROM views),'visits',(SELECT count(DISTINCT session_key) FROM views),'daily',coalesce((SELECT jsonb_agg(daily) FROM daily),'[]'::jsonb),'pages',coalesce((SELECT jsonb_agg(pages) FROM pages),'[]'::jsonb));
$$;
REVOKE ALL ON FUNCTION public.record_cardones_view(uuid,text,text),public.cardones_traffic_report(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_cardones_view(uuid,text,text),public.cardones_traffic_report(integer) TO service_role;
