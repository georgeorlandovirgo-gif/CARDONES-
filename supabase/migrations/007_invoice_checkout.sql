ALTER TABLE public.store_orders ADD COLUMN billing_address text;
ALTER TABLE public.store_orders ADD COLUMN invoice_upload_hash text;
ALTER TABLE public.store_orders ADD COLUMN submitted_at timestamptz;
ALTER TABLE public.store_orders ADD COLUMN transfer_reference text;
CREATE OR REPLACE FUNCTION public.submit_cardones_invoice(p_reference text,p_hash text,p_receipt text,p_transfer text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE current_order store_orders;
BEGIN
 SELECT * INTO current_order FROM store_orders WHERE reference=p_reference AND invoice_upload_hash=p_hash FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Invalid invoice access'; END IF;
 IF current_order.submitted_at IS NOT NULL THEN RETURN false; END IF;
 IF current_order.status<>'awaiting_payment' OR current_order.payment_method<>'bank_transfer' OR current_order.has_unpriced THEN RAISE EXCEPTION 'Invoice cannot accept proof'; END IF;
 IF p_receipt IS NULL OR length(p_receipt)<10 THEN RAISE EXCEPTION 'Payment proof required'; END IF;
 UPDATE store_orders SET receipt_path=p_receipt,transfer_reference=p_transfer,submitted_at=now(),status='payment_submitted',updated_at=now() WHERE id=current_order.id;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.submit_cardones_invoice(text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_cardones_invoice(text,text,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.guard_cardones_invoice_processing() RETURNS trigger
LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.invoice_upload_hash IS NOT NULL AND
    (NEW.payment_verified_at IS NOT NULL OR NEW.status IN ('payment_verified','processing','ready_for_pickup','dispatched','completed','fulfilled')) AND
    (NEW.submitted_at IS NULL OR NEW.receipt_path IS NULL) THEN
  RAISE EXCEPTION 'Customer must submit payment proof before verification or processing';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_invoice_processing BEFORE INSERT OR UPDATE ON public.store_orders
FOR EACH ROW EXECUTE FUNCTION public.guard_cardones_invoice_processing();
