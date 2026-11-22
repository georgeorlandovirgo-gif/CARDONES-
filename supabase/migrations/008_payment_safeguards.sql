ALTER TABLE public.store_orders ADD COLUMN proof_sha256 text CHECK(proof_sha256 IS NULL OR proof_sha256 ~ '^[a-f0-9]{64}$');
ALTER TABLE public.store_orders ADD COLUMN review_flags text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.store_orders ADD COLUMN bank_credit_reference text;
ALTER TABLE public.store_orders ADD COLUMN bank_received_jmd numeric;
ALTER TABLE public.store_orders ADD COLUMN bank_review_note text;
ALTER TABLE public.store_orders ADD COLUMN bank_checked_by uuid;
CREATE INDEX order_proof_hash_idx ON public.store_orders(proof_sha256) WHERE proof_sha256 IS NOT NULL;
-- Owner-entered bank credit IDs, unlike customer-entered IDs, cannot be reused.
CREATE UNIQUE INDEX unique_verified_bank_credit ON public.store_orders (upper(regexp_replace(bank_credit_reference,'[^a-zA-Z0-9]','','g'))) WHERE bank_credit_reference IS NOT NULL;

DROP FUNCTION public.submit_cardones_invoice(text,text,text,text);
CREATE FUNCTION public.submit_cardones_invoice(p_reference text,p_hash text,p_receipt text,p_transfer text,p_proof_hash text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE current_order store_orders; flags text[] := '{}'; normalized text;
BEGIN
 -- Serialize duplicate checks and submissions, including across different invoices.
 PERFORM pg_advisory_xact_lock(827409);
 SELECT * INTO current_order FROM store_orders WHERE reference=p_reference AND invoice_upload_hash=p_hash FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Invalid invoice access'; END IF;
 IF current_order.submitted_at IS NOT NULL THEN RETURN false; END IF;
 IF current_order.status<>'awaiting_payment' OR current_order.payment_method<>'bank_transfer' OR current_order.has_unpriced THEN RAISE EXCEPTION 'Invoice cannot accept proof'; END IF;
 IF p_receipt IS NULL OR length(p_receipt)<10 OR p_proof_hash IS NULL OR p_proof_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Valid payment proof required'; END IF;
 normalized:=upper(regexp_replace(p_transfer,'[^a-zA-Z0-9]','','g'));
 IF normalized IS NULL OR length(normalized)<4 OR length(p_transfer)>100 THEN RAISE EXCEPTION 'Bank transaction reference required'; END IF;
 IF EXISTS(SELECT 1 FROM store_orders WHERE proof_sha256=p_proof_hash AND id<>current_order.id) THEN flags:=array_append(flags,'Receipt file also submitted for another order'); END IF;
 IF EXISTS(SELECT 1 FROM store_orders WHERE upper(regexp_replace(transfer_reference,'[^a-zA-Z0-9]','','g'))=normalized AND id<>current_order.id) THEN flags:=array_append(flags,'Customer transaction reference also used on another order'); END IF;
 UPDATE store_orders SET receipt_path=p_receipt,proof_sha256=p_proof_hash,review_flags=flags,transfer_reference=p_transfer,submitted_at=now(),status='payment_submitted',updated_at=now() WHERE id=current_order.id;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.submit_cardones_invoice(text,text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_cardones_invoice(text,text,text,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.guard_cardones_invoice_processing() RETURNS trigger
LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.invoice_upload_hash IS NOT NULL AND
    (NEW.payment_verified_at IS NOT NULL OR NEW.status IN ('payment_verified','processing','ready_for_pickup','dispatched','completed','fulfilled','confirmed')) THEN
  IF NEW.submitted_at IS NULL OR NEW.receipt_path IS NULL THEN RAISE EXCEPTION 'Customer must submit payment proof before verification or processing'; END IF;
  IF NEW.bank_credit_reference IS NULL OR NEW.bank_checked_by IS NULL OR NEW.bank_received_jmd IS NULL OR NEW.delivery_fee_jmd IS NULL OR NEW.bank_received_jmd<>NEW.priced_subtotal_jmd+NEW.delivery_fee_jmd THEN RAISE EXCEPTION 'Independently match the bank credit and invoice total first'; END IF;
  IF cardinality(NEW.review_flags)>0 AND length(trim(coalesce(NEW.bank_review_note,'')))<10 THEN RAISE EXCEPTION 'Explain how duplicate warnings were resolved against bank records'; END IF;
 END IF;
 RETURN NEW;
END $$;

CREATE FUNCTION public.verify_cardones_bank_credit(p_actor uuid,p_id uuid,p_credit text,p_amount numeric,p_note text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE current_order store_orders;
BEGIN
 SELECT * INTO current_order FROM store_orders WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR current_order.status<>'payment_submitted' OR current_order.payment_method<>'bank_transfer' THEN RAISE EXCEPTION 'Only submitted bank transfers can be reviewed'; END IF;
 IF p_actor IS NULL OR p_credit IS NULL OR length(regexp_replace(p_credit,'[^a-zA-Z0-9]','','g'))<4 OR length(p_credit)>100 THEN RAISE EXCEPTION 'Enter the unique credit reference from your bank account'; END IF;
 IF p_amount IS NULL OR current_order.has_unpriced OR current_order.delivery_fee_jmd IS NULL OR p_amount<>current_order.priced_subtotal_jmd+current_order.delivery_fee_jmd THEN RAISE EXCEPTION 'Received amount must match the complete invoice total'; END IF;
 IF length(coalesce(p_note,''))>600 THEN RAISE EXCEPTION 'Review note too long'; END IF;
 UPDATE store_orders SET bank_credit_reference=trim(p_credit),bank_received_jmd=p_amount,bank_review_note=p_note,bank_checked_by=p_actor WHERE id=p_id;
 PERFORM update_cardones_order(p_actor,p_id,'payment_verified');
 INSERT INTO store_admin_audit(admin_user_id,event,entity_id,after_data)
 VALUES(p_actor,'bank_credit_independently_checked',p_id::text,jsonb_build_object('amount_jmd',p_amount,'duplicate_flags_reviewed',cardinality(current_order.review_flags)>0));
END $$;
REVOKE ALL ON FUNCTION public.verify_cardones_bank_credit(uuid,uuid,text,numeric,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.verify_cardones_bank_credit(uuid,uuid,text,numeric,text) TO service_role;

-- Enforce one-use tokens locally as well as at the bot-check provider.
CREATE TABLE public.store_bot_tokens(token_hash text PRIMARY KEY CHECK(token_hash ~ '^[a-f0-9]{64}$'),created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.store_bot_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.store_bot_tokens FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.consume_cardones_bot_token(p_hash text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE inserted_count int;
BEGIN
 DELETE FROM store_bot_tokens WHERE created_at<now()-interval '1 day';
 INSERT INTO store_bot_tokens(token_hash) VALUES(p_hash) ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS inserted_count=ROW_COUNT;
 RETURN inserted_count=1;
END $$;
REVOKE ALL ON FUNCTION public.consume_cardones_bot_token(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.consume_cardones_bot_token(text) TO service_role;
