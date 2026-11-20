-- Run AFTER 001_orders.sql. All mutable commerce data is server-side.
CREATE TABLE IF NOT EXISTS public.store_settings (
 id TEXT PRIMARY KEY DEFAULT 'main' CHECK (id = 'main'),
 business_name TEXT NOT NULL DEFAULT 'Cardone''s Products',
 phone TEXT, whatsapp TEXT, email TEXT, instagram TEXT, facebook TEXT,
 location TEXT DEFAULT 'St. Elizabeth, Jamaica', contact_hours TEXT,
 bank_enabled BOOLEAN NOT NULL DEFAULT FALSE,
 bank_name TEXT, bank_holder TEXT, bank_account TEXT, bank_branch TEXT, bank_type TEXT,
 bank_instructions TEXT,
 cod_enabled BOOLEAN NOT NULL DEFAULT FALSE,
 whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
 delivery_enabled BOOLEAN NOT NULL DEFAULT TRUE,
 pickup_enabled BOOLEAN NOT NULL DEFAULT TRUE,
 delivery_information TEXT,
 pickup_information TEXT,
 delivery_fee_jmd INTEGER CHECK (delivery_fee_jmd >= 0),
 store_paused BOOLEAN NOT NULL DEFAULT FALSE,
 policies TEXT,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.store_settings (id) VALUES ('main') ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS public.store_products (
 id TEXT PRIMARY KEY,
 slug TEXT NOT NULL UNIQUE,
 name TEXT NOT NULL,
 subtitle TEXT NOT NULL DEFAULT '',
 description TEXT NOT NULL DEFAULT '',
 image TEXT,
 label_image TEXT,
 benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
 how_to_use TEXT NOT NULL DEFAULT '',
 ingredients_note TEXT NOT NULL DEFAULT '',
 caution TEXT NOT NULL DEFAULT '',
 categories JSONB NOT NULL DEFAULT '[]'::jsonb,
 accent TEXT NOT NULL DEFAULT 'amber',
 badge TEXT,
 featured BOOLEAN NOT NULL DEFAULT FALSE,
 active BOOLEAN NOT NULL DEFAULT TRUE,
 sort_order INTEGER NOT NULL DEFAULT 100,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.store_variants (
 id TEXT PRIMARY KEY,
 product_id TEXT NOT NULL REFERENCES public.store_products(id) ON DELETE CASCADE,
 label TEXT NOT NULL,
 ml INTEGER NOT NULL CHECK (ml > 0),
 price_jmd INTEGER CHECK (price_jmd >= 0),
 available BOOLEAN NOT NULL DEFAULT FALSE,
 stock_count INTEGER CHECK (stock_count >= 0),
 sort_order INTEGER NOT NULL DEFAULT 100
);
ALTER TABLE public.store_orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.store_orders ADD COLUMN IF NOT EXISTS receipt_path TEXT;
ALTER TABLE public.store_orders ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ;
ALTER TABLE public.store_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.store_orders DROP CONSTRAINT IF EXISTS store_orders_status_check;
ALTER TABLE public.store_orders ADD CONSTRAINT store_orders_status_check CHECK (status IN
 ('new_request','pending','awaiting_payment','payment_submitted','payment_verified','processing','ready_for_pickup','dispatched','completed','cancelled','quoted','confirmed','fulfilled'));
CREATE TABLE IF NOT EXISTS public.store_admin_audit (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 admin_user_id UUID NOT NULL,
 event TEXT NOT NULL,
 entity_id TEXT,
 before_data JSONB,
 after_data JSONB,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_store_admin_audit_created ON public.store_admin_audit(created_at DESC);
CREATE TABLE IF NOT EXISTS public.store_request_limits (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 fingerprint TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_store_request_limits_recent ON public.store_request_limits(fingerprint, created_at DESC);
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_admin_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_request_limits ENABLE ROW LEVEL SECURITY;
-- These tables deliberately have no direct anon/authenticated policies. Only trusted
-- Next.js server routes with a service-role key may write/read them.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('cardones-receipts','cardones-receipts',FALSE,5242880,ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('cardones-products','cardones-products',TRUE,5242880,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;
-- No storage policies added for public uploads; only service-role uploads are allowed.