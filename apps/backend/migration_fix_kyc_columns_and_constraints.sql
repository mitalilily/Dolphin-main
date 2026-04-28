-- Fix KYC schema drift issues that can block/dirty document saves.
-- 1) Rename malformed LLP column that was created with leading spaces.
-- 2) Make cancelledChequeRejectionReason nullable (no fake "pending" default).

BEGIN;

-- Ensure correct LLP column exists
ALTER TABLE "kyc"
ADD COLUMN IF NOT EXISTS "llpAgreementUrl" text;

-- Copy legacy malformed column data if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'kyc'
      AND column_name = '  llpAgreementUrl'
  ) THEN
    EXECUTE '
      UPDATE "kyc"
      SET "llpAgreementUrl" = COALESCE("llpAgreementUrl", "  llpAgreementUrl")
      WHERE "  llpAgreementUrl" IS NOT NULL
    ';

    EXECUTE 'ALTER TABLE "kyc" DROP COLUMN "  llpAgreementUrl"';
  END IF;
END $$;

-- Drop incorrect default + NOT NULL restriction for rejection reason
ALTER TABLE "kyc"
ALTER COLUMN "cancelledChequeRejectionReason" DROP DEFAULT;

ALTER TABLE "kyc"
ALTER COLUMN "cancelledChequeRejectionReason" DROP NOT NULL;

COMMIT;

