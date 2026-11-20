-- Canonical schema: 001_orders.sql -> 002_store_management.sql -> this file.
-- The alternate JSON-catalogue migration is archived, NOT part of this chain.
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS available_parishes jsonb NOT NULL DEFAULT '["Kingston","St. Andrew","St. Catherine","Clarendon","Manchester","St. Elizabeth","Westmoreland","Hanover","St. James","Trelawny","St. Ann","St. Mary","Portland","St. Thomas"]';
ALTER TABLE public.store_orders ADD COLUMN IF NOT EXISTS delivery_fee_jmd integer CHECK(delivery_fee_jmd >= 0);
REVOKE ALL ON public.store_settings,public.store_products,public.store_variants,public.store_orders,public.store_admin_audit,public.store_request_limits FROM anon,authenticated;
GRANT ALL ON public.store_settings,public.store_products,public.store_variants,public.store_orders,public.store_admin_audit,public.store_request_limits TO service_role;
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

CREATE OR REPLACE FUNCTION public.take_cardones_order_slot(p_fingerprint text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF length(p_fingerprint)<>64 THEN RETURN false; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(p_fingerprint));
 IF (SELECT count(*) FROM store_request_limits WHERE fingerprint=p_fingerprint AND created_at>now()-interval '1 hour')>=6 THEN RETURN false; END IF;
 INSERT INTO store_request_limits(fingerprint) VALUES(p_fingerprint);
 DELETE FROM store_request_limits WHERE created_at<now()-interval '2 days';
 RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.save_cardones_merchant(p_actor uuid,p_settings jsonb,p_fields text[]) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v store_settings;
BEGIN
 SELECT * INTO v FROM store_settings WHERE id='main' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Settings missing'; END IF;
 v:=jsonb_populate_record(v,p_settings);
 UPDATE store_settings SET phone=v.phone,whatsapp=v.whatsapp,email=v.email,instagram=v.instagram,facebook=v.facebook,
 location=v.location,contact_hours=v.contact_hours,bank_enabled=v.bank_enabled,bank_name=v.bank_name,bank_holder=v.bank_holder,
 bank_account=v.bank_account,bank_branch=v.bank_branch,bank_type=v.bank_type,bank_instructions=v.bank_instructions,
 cod_enabled=v.cod_enabled,whatsapp_enabled=v.whatsapp_enabled,delivery_enabled=v.delivery_enabled,pickup_enabled=v.pickup_enabled,
 delivery_information=v.delivery_information,pickup_information=v.pickup_information,delivery_fee_jmd=v.delivery_fee_jmd,
 store_paused=v.store_paused,policies=v.policies,available_parishes=v.available_parishes,updated_at=now() WHERE id='main';
 INSERT INTO store_admin_audit(admin_user_id,event,entity_id,after_data)
 VALUES(p_actor,'settings_saved','main',jsonb_build_object('fields',p_fields));
END $$;

CREATE OR REPLACE FUNCTION public.save_cardones_catalogue_product(p_actor uuid,p_product jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p jsonb:=p_product; v jsonb;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext('cardones-catalogue'));
 INSERT INTO store_products(id,slug,name,subtitle,description,image,label_image,benefits,how_to_use,ingredients_note,caution,categories,accent,featured,active,badge,sort_order)
 VALUES(p->>'id',p->>'slug',p->>'name',p->>'subtitle',p->>'description',nullif(p->>'image',''),nullif(p->>'labelImage',''),p->'benefits',p->>'howToUse',p->>'ingredientsNote',p->>'caution',p->'category',p->>'accent',(p->>'featured')::boolean,(p->>'active')::boolean,nullif(p->>'badge',''),(p->>'sortOrder')::integer)
 ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,name=excluded.name,subtitle=excluded.subtitle,description=excluded.description,
 image=excluded.image,label_image=excluded.label_image,benefits=excluded.benefits,how_to_use=excluded.how_to_use,ingredients_note=excluded.ingredients_note,
 caution=excluded.caution,categories=excluded.categories,accent=excluded.accent,featured=excluded.featured,active=excluded.active,badge=excluded.badge,sort_order=excluded.sort_order,updated_at=now();
 FOR v IN SELECT value FROM jsonb_array_elements(p->'variants') LOOP
  IF EXISTS(SELECT 1 FROM store_variants WHERE id=v->>'id' AND product_id<>p->>'id') THEN RAISE EXCEPTION 'Size ID belongs to another product'; END IF;
  INSERT INTO store_variants(id,product_id,label,ml,price_jmd,available,stock_count,sort_order)
  VALUES(v->>'id',p->>'id',v->>'label',(v->>'ml')::integer,(v->>'priceJmd')::integer,(v->>'available')::boolean,(v->>'stockCount')::integer,0)
  ON CONFLICT(id) DO UPDATE SET label=excluded.label,ml=excluded.ml,price_jmd=excluded.price_jmd,available=excluded.available,stock_count=excluded.stock_count;
 END LOOP;
 DELETE FROM store_variants WHERE product_id=p->>'id' AND id NOT IN(SELECT value->>'id' FROM jsonb_array_elements(p->'variants'));
 INSERT INTO store_admin_audit(admin_user_id,event,entity_id,after_data) VALUES(p_actor,'product_saved',p->>'id',jsonb_build_object('fields',ARRAY['product','variants']));
END $$;

CREATE OR REPLACE FUNCTION public.seed_cardones_catalogue(p_actor uuid,p_products jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p jsonb;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext('cardones-catalogue'));
 IF EXISTS(SELECT 1 FROM store_products) THEN RAISE EXCEPTION 'Catalogue already initialized'; END IF;
 FOR p IN SELECT value FROM jsonb_array_elements(p_products) LOOP
  PERFORM save_cardones_catalogue_product(p_actor,p);
 END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.update_cardones_order(p_actor uuid,p_id uuid,p_status text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE previous store_orders;
BEGIN
 SELECT * INTO previous FROM store_orders WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Order missing'; END IF;
 IF p_status='payment_verified' AND previous.payment_method<>'bank_transfer' THEN RAISE EXCEPTION 'Not a bank transfer'; END IF;
 UPDATE store_orders SET status=p_status,updated_at=now(),payment_verified_at=CASE WHEN p_status='payment_verified' THEN now() ELSE payment_verified_at END WHERE id=p_id;
 INSERT INTO store_admin_audit(admin_user_id,event,entity_id,before_data,after_data) VALUES(p_actor,'order_status_changed',p_id::text,jsonb_build_object('status',previous.status),jsonb_build_object('status',p_status));
END $$;

REVOKE ALL ON FUNCTION public.take_cardones_order_slot(text),public.save_cardones_merchant(uuid,jsonb,text[]),public.save_cardones_catalogue_product(uuid,jsonb),public.seed_cardones_catalogue(uuid,jsonb),public.update_cardones_order(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.take_cardones_order_slot(text),public.save_cardones_merchant(uuid,jsonb,text[]),public.save_cardones_catalogue_product(uuid,jsonb),public.seed_cardones_catalogue(uuid,jsonb),public.update_cardones_order(uuid,uuid,text) TO service_role;
