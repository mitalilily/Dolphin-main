-- Fix b2c_orders column widths to prevent runtime varchar overflow
-- Root cause observed: large base64 label payload failing against varchar(100)
-- This migration is intentionally idempotent/safe to run multiple times.

ALTER TABLE IF EXISTS public.b2c_orders
  ALTER COLUMN label TYPE text,
  ALTER COLUMN manifest TYPE text,
  ALTER COLUMN sort_code TYPE text,
  ALTER COLUMN shipment_id TYPE text,
  ALTER COLUMN awb_number TYPE text,
  ALTER COLUMN pickup_location_id TYPE text,
  ALTER COLUMN invoice_link TYPE text,
  ALTER COLUMN delivery_message TYPE text,
  ALTER COLUMN delivery_location TYPE text,
  ALTER COLUMN courier_partner TYPE text,
  ALTER COLUMN integration_type TYPE text,
  ALTER COLUMN tags TYPE text,
  ALTER COLUMN pickup_error TYPE text,
  ALTER COLUMN manifest_error TYPE text;

