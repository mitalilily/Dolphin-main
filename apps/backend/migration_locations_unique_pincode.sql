BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'meracourierwala_locations'
  ) THEN
    DELETE FROM public.meracourierwala_locations a
    USING public.meracourierwala_locations b
    WHERE a.ctid < b.ctid
      AND a.pincode = b.pincode;

    CREATE UNIQUE INDEX IF NOT EXISTS locations_pincode_unique_idx
      ON public.meracourierwala_locations (pincode);
  END IF;
END $$;

COMMIT;
