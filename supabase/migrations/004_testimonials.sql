CREATE TABLE IF NOT EXISTS public.store_testimonials (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 display_name text NOT NULL CHECK(length(display_name) BETWEEN 2 AND 60),
 email text NOT NULL,
 product_id text NOT NULL,
 product_name text NOT NULL,
 title text NOT NULL CHECK(length(title) BETWEEN 5 AND 100),
 story text NOT NULL CHECK(length(story) BETWEEN 30 AND 2500),
 duration text NOT NULL DEFAULT '',
 photos jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(photos)='array' AND jsonb_array_length(photos)<=3),
 consent_at timestamptz NOT NULL DEFAULT now(),
 consent_version text NOT NULL DEFAULT 'website-story-v1',
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','hidden')),
 created_at timestamptz NOT NULL DEFAULT now(),
 published_at timestamptz,
 reviewed_by uuid,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS store_testimonials_public ON public.store_testimonials(status,published_at DESC);
ALTER TABLE public.store_testimonials ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.store_testimonials FROM anon,authenticated;
GRANT ALL ON public.store_testimonials TO service_role;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('cardones-testimonials','cardones-testimonials',false,5242880,ARRAY['image/jpeg'])
ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=5242880,allowed_mime_types=ARRAY['image/jpeg'];

CREATE OR REPLACE FUNCTION public.moderate_cardones_testimonial(p_actor uuid,p_id uuid,p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE previous text;
BEGIN
 IF p_status NOT IN ('approved','rejected','hidden') THEN RAISE EXCEPTION 'Invalid moderation decision'; END IF;
 SELECT status INTO previous FROM store_testimonials WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Testimonial not found'; END IF;
 UPDATE store_testimonials SET status=p_status,reviewed_by=p_actor,updated_at=now(),
 published_at=CASE WHEN p_status='approved' THEN coalesce(published_at,now()) ELSE NULL END WHERE id=p_id;
 INSERT INTO store_admin_audit(admin_user_id,event,entity_id,before_data,after_data)
 VALUES(p_actor,'testimonial_moderated',p_id::text,jsonb_build_object('status',previous),jsonb_build_object('status',p_status));
END $$;
REVOKE ALL ON FUNCTION public.moderate_cardones_testimonial(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_cardones_testimonial(uuid,uuid,text) TO service_role;
