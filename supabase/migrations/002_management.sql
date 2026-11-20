-- Cardone's production administration. Run AFTER 001_orders.sql, in Supabase SQL Editor.
-- These tables are managed exclusively through authenticated server endpoints using a
-- service role key. Do not expose the service-role key to the browser.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.store_admins (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 active boolean NOT NULL DEFAULT true
);
ALTER TABLE public.store_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.store_admins FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.store_settings (
 id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
 business_phone text NOT NULL DEFAULT '',
 whatsapp_number text NOT NULL DEFAULT '',
 support_email text NOT NULL DEFAULT '',
 instagram_url text NOT NULL DEFAULT '',
 facebook_url text NOT NULL DEFAULT '',
 business_location text NOT NULL DEFAULT 'St. Elizabeth, Jamaica',
 contact_hours text NOT NULL DEFAULT '',
 delivery_text text NOT NULL DEFAULT 'Delivery and pickup arrangements are confirmed after receiving your request.',
 returns_text text NOT NULL DEFAULT 'Contact us about damaged or incorrect items before returning them.',
 bank_name text NOT NULL DEFAULT '',
 bank_holder text NOT NULL DEFAULT '',
 bank_account text NOT NULL DEFAULT '',
 bank_branch text NOT NULL DEFAULT '',
 bank_type text NOT NULL DEFAULT '',
 bank_instructions text NOT NULL DEFAULT '',
 bank_enabled boolean NOT NULL DEFAULT false,
 cod_enabled boolean NOT NULL DEFAULT false,
 whatsapp_enabled boolean NOT NULL DEFAULT false,
 pickup_enabled boolean NOT NULL DEFAULT true,
 delivery_enabled boolean NOT NULL DEFAULT true,
 store_open boolean NOT NULL DEFAULT false,
 delivery_fee_jmd integer CHECK (delivery_fee_jmd IS NULL OR delivery_fee_jmd >= 0),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.store_settings FROM anon, authenticated;
INSERT INTO public.store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.store_products (
 id text PRIMARY KEY CHECK (length(id) BETWEEN 2 AND 60),
 slug text UNIQUE NOT NULL,
 data jsonb NOT NULL,
 active boolean NOT NULL DEFAULT true,
 sort_order integer NOT NULL DEFAULT 0,
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.store_products FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.store_audit_log (
 id bigserial PRIMARY KEY,
 actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 action text NOT NULL,
 entity text NOT NULL,
 entity_id text NOT NULL,
 fields_changed jsonb NOT NULL DEFAULT '[]'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.store_audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.store_audit_log FROM anon, authenticated;

-- Change old status enum-like CHECK to allow the full payment and delivery lifecycle.
ALTER TABLE public.store_orders DROP CONSTRAINT IF EXISTS store_orders_status_check;
ALTER TABLE public.store_orders ADD CONSTRAINT store_orders_status_check
 CHECK (status IN ('new_request','quoted','confirmed','pending','awaiting_payment',
 'payment_submitted','payment_verified','processing','ready_for_pickup',
 'dispatched','completed','cancelled','fulfilled'));
ALTER TABLE public.store_orders
 ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'to_confirm'
 CHECK (payment_method IN ('to_confirm','bank_transfer','cash_on_delivery','whatsapp')),
 ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid'
 CHECK (payment_status IN ('unpaid','submitted','verified','not_required')),
 ADD COLUMN IF NOT EXISTS receipt_path text,
 ADD COLUMN IF NOT EXISTS receipt_token_hash text,
 ADD COLUMN IF NOT EXISTS delivery_fee_jmd integer,
 ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.store_orders FROM anon, authenticated;

-- Private payment receipts: only the authenticated server with service role can
-- upload and create expiring admin download links. Customers never get public URLs.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES ('cardones-receipts','cardones-receipts',false,3145728,
 ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES ('cardones-products','cardones-products',true,5242880,
 ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- No write policy is granted to anon or authenticated roles.
-- Public product images are intentionally readable only when the bucket is public.
-- To enable owner access, create a Supabase Auth user then run manually:
-- INSERT INTO public.store_admins (user_id) VALUES ('<AUTH-USER-UUID>');

-- Atomic request throttling, enforced by the production order API.
CREATE TABLE IF NOT EXISTS public.store_request_events(
 id bigserial PRIMARY KEY,
 client_hash text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS store_request_events_key_date ON public.store_request_events(client_hash,created_at DESC);
ALTER TABLE public.store_request_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.store_request_events FROM anon,authenticated;

CREATE OR REPLACE FUNCTION public.take_store_order_slot(p_hash text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE recent integer;
BEGIN
 IF length(p_hash)>150 OR length(p_hash)<20 THEN RETURN false; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(p_hash));
 SELECT count(*) INTO recent FROM public.store_request_events
 WHERE client_hash=p_hash AND created_at > now()-interval '1 hour';
 IF recent >= 5 THEN RETURN false; END IF;
 INSERT INTO public.store_request_events(client_hash) VALUES(p_hash);
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.take_store_order_slot(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.take_store_order_slot(text) TO service_role;
-- Explicit service-role privileges for production API calls.
GRANT ALL ON public.store_admins, public.store_settings, public.store_products,
 public.store_audit_log, public.store_orders, public.store_request_events TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- The following SECURITY DEFINER functions are callable only with the
-- service-role key (server-side), after the request has verified the owner.
-- They commit the settings/product/order change and its audit log atomically.
CREATE OR REPLACE FUNCTION public.save_cardones_settings(
 p_actor uuid, p_settings jsonb, p_changed text[]
) RETURNS public.store_settings LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result public.store_settings;
BEGIN
 UPDATE public.store_settings SET
  business_phone=coalesce(p_settings->>'business_phone',''),
  whatsapp_number=coalesce(p_settings->>'whatsapp_number',''),
  support_email=coalesce(p_settings->>'support_email',''),
  instagram_url=coalesce(p_settings->>'instagram_url',''),
  facebook_url=coalesce(p_settings->>'facebook_url',''),
  business_location=coalesce(p_settings->>'business_location',''),
  contact_hours=coalesce(p_settings->>'contact_hours',''),
  delivery_text=coalesce(p_settings->>'delivery_text',''),
  returns_text=coalesce(p_settings->>'returns_text',''),
  bank_name=coalesce(p_settings->>'bank_name',''),
  bank_holder=coalesce(p_settings->>'bank_holder',''),
  bank_account=coalesce(p_settings->>'bank_account',''),
  bank_branch=coalesce(p_settings->>'bank_branch',''),
  bank_type=coalesce(p_settings->>'bank_type',''),
  bank_instructions=coalesce(p_settings->>'bank_instructions',''),
  bank_enabled=coalesce((p_settings->>'bank_enabled')::boolean,false),
  cod_enabled=coalesce((p_settings->>'cod_enabled')::boolean,false),
  whatsapp_enabled=coalesce((p_settings->>'whatsapp_enabled')::boolean,false),
  pickup_enabled=coalesce((p_settings->>'pickup_enabled')::boolean,true),
  delivery_enabled=coalesce((p_settings->>'delivery_enabled')::boolean,true),
  store_open=coalesce((p_settings->>'store_open')::boolean,false),
  delivery_fee_jmd=(p_settings->>'delivery_fee_jmd')::integer,
  updated_at=now()
 WHERE id=1 RETURNING * INTO result;
 IF NOT FOUND THEN RAISE EXCEPTION 'Missing store settings'; END IF;
 INSERT INTO public.store_audit_log(actor_id,action,entity,entity_id,fields_changed)
 VALUES(p_actor,'settings_saved','store_settings','1',to_jsonb(p_changed));
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.save_cardones_settings(uuid,jsonb,text[]) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_cardones_settings(uuid,jsonb,text[]) TO service_role;

CREATE OR REPLACE FUNCTION public.save_cardones_product(
 p_actor uuid,p_id text,p_slug text,p_data jsonb,p_active boolean,p_sort_order integer
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 INSERT INTO public.store_products(id,slug,data,active,sort_order,updated_at)
 VALUES(p_id,p_slug,p_data,p_active,p_sort_order,now())
 ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,data=excluded.data,
 active=excluded.active,sort_order=excluded.sort_order,updated_at=now();
 INSERT INTO public.store_audit_log(actor_id,action,entity,entity_id,fields_changed)
 VALUES(p_actor,'product_saved','store_products',p_id,'["product","active","sort_order"]'::jsonb);
END $$;
REVOKE ALL ON FUNCTION public.save_cardones_product(uuid,text,text,jsonb,boolean,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_cardones_product(uuid,text,text,jsonb,boolean,integer) TO service_role;

CREATE OR REPLACE FUNCTION public.save_cardones_order_status(
 p_actor uuid,p_reference text,p_status text,p_payment_status text
) RETURNS public.store_orders LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result public.store_orders;
BEGIN
 UPDATE public.store_orders SET status=p_status,payment_status=p_payment_status,updated_at=now()
 WHERE reference=p_reference RETURNING * INTO result;
 IF NOT FOUND THEN RAISE EXCEPTION 'Order reference not found'; END IF;
 INSERT INTO public.store_audit_log(actor_id,action,entity,entity_id,fields_changed)
 VALUES(p_actor,'order_status_saved','store_orders',p_reference,'["status","payment_status"]'::jsonb);
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.save_cardones_order_status(uuid,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_cardones_order_status(uuid,text,text,text) TO service_role;
