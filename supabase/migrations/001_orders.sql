-- Run this in Supabase > SQL Editor, then add the server-only credentials to Vercel.
-- The browser must NEVER receive your Supabase service_role key.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS public.store_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  parish TEXT NOT NULL,
  address TEXT,
  fulfillment TEXT NOT NULL CHECK (fulfillment IN ('delivery', 'pickup')),
  notes TEXT,
  lines JSONB NOT NULL,
  priced_subtotal_jmd INTEGER NOT NULL DEFAULT 0 CHECK (priced_subtotal_jmd >= 0),
  has_unpriced BOOLEAN NOT NULL,
  status TEXT NOT NULL DEFAULT 'new_request' CHECK (status IN ('new_request','quoted','confirmed','fulfilled','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_store_orders_created_at ON public.store_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_orders_status ON public.store_orders(status);
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
-- No anonymous/user INSERT/SELECT grants: only the server (service role) can handle orders.