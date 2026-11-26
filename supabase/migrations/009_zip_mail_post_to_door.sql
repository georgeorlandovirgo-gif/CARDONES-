-- Cardone’s drops all Zip Mail parcels at Jamaica Post.
-- Extend the original 006_delivery.sql service constraint to allow
-- Post Office-to-Door (zip_mail_door), alongside Post Office-to-Post Office (zip_mail).
ALTER TABLE public.store_orders
 DROP CONSTRAINT IF EXISTS store_orders_shipping_service_check;

ALTER TABLE public.store_orders
 ADD CONSTRAINT store_orders_shipping_service_check
 CHECK (shipping_service IS NULL OR shipping_service IN (
  'free_dropoff','knutsford','tara_address','tara_office',
  'zip_mail','zip_mail_door'
 ));
