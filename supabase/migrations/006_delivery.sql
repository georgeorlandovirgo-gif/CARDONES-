ALTER TABLE public.store_orders ADD COLUMN shipping_service text CHECK(shipping_service IN ('free_dropoff','knutsford','tara_address','tara_office','zip_mail'));
ALTER TABLE public.store_orders ADD COLUMN shipping_town text;
ALTER TABLE public.store_orders ADD COLUMN shipping_destination text;
ALTER TABLE public.store_orders ADD COLUMN courier_fee_collect boolean NOT NULL DEFAULT false;
ALTER TABLE public.store_orders ADD COLUMN dispatched_at timestamptz;
-- The former generic delivery rate is now explicitly a Zip Mail prepaid rate.
-- Require the owner to confirm it rather than reuse an unrelated legacy fee.
UPDATE public.store_settings SET delivery_fee_jmd=NULL WHERE id='main';
CREATE OR REPLACE FUNCTION public.update_cardones_order(p_actor uuid,p_id uuid,p_status text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE previous store_orders;
BEGIN
 SELECT * INTO previous FROM store_orders WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Order missing'; END IF;
 IF previous.shipping_service IS NOT NULL THEN
  IF previous.status='cancelled' AND p_status<>'cancelled' THEN RAISE EXCEPTION 'Cancelled orders cannot be reopened'; END IF;
  IF p_status='payment_verified' AND (previous.has_unpriced OR previous.delivery_fee_jmd IS NULL) THEN RAISE EXCEPTION 'Confirm all product prices and prepaid postage before verifying payment'; END IF;
  IF p_status IN ('processing','ready_for_pickup','dispatched','completed','fulfilled') AND previous.payment_verified_at IS NULL THEN RAISE EXCEPTION 'Verify product payment and prepaid postage before fulfilment'; END IF;
  IF p_status='dispatched' AND previous.dispatched_at IS NULL AND extract(dow FROM now() AT TIME ZONE 'America/Jamaica') NOT IN (3,6) THEN RAISE EXCEPTION 'Dispatch is permitted on Wednesday and Saturday only (Jamaica time)'; END IF;
  IF p_status IN ('completed','fulfilled') AND previous.dispatched_at IS NULL THEN RAISE EXCEPTION 'Record dispatch before completing the order'; END IF;
 ELSE
  IF p_status='payment_verified' AND previous.payment_method<>'bank_transfer' THEN RAISE EXCEPTION 'Not a bank transfer'; END IF;
 END IF;
 UPDATE store_orders SET status=p_status,updated_at=now(),
 payment_verified_at=CASE WHEN p_status='payment_verified' THEN coalesce(payment_verified_at,now()) WHEN p_status IN ('new_request','pending','awaiting_payment','payment_submitted','quoted','cancelled') THEN NULL ELSE payment_verified_at END,
 dispatched_at=CASE WHEN p_status='dispatched' THEN coalesce(dispatched_at,now()) ELSE dispatched_at END WHERE id=p_id;
 INSERT INTO store_admin_audit(admin_user_id,event,entity_id,before_data,after_data) VALUES(p_actor,'order_status_changed',p_id::text,jsonb_build_object('status',previous.status),jsonb_build_object('status',p_status));
END $$;
REVOKE ALL ON FUNCTION public.update_cardones_order(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.update_cardones_order(uuid,uuid,text) TO service_role;
