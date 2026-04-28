-- Ensure all columns selected by Drizzle `kyc.findFirst()` exist in the DB.
-- This migration is idempotent and safe to run multiple times.

BEGIN;

-- Keep the legacy malformed LLP column from breaking reads/writes.
ALTER TABLE "kyc"
ADD COLUMN IF NOT EXISTS "llpAgreementUrl" text;

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

ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "structure" "business_structure_enum" DEFAULT 'company';
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "gstin" varchar(20);
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "cin" varchar(25);

ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "selfieUrl" text;
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "panCardUrl" text;
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "aadhaarUrl" text;
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "cancelledChequeUrl" text;
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "boardResolutionUrl" text;
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "partnershipDeedUrl" text;

ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "selfieStatus" "kyc_doc_status" DEFAULT 'pending' NOT NULL;
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "selfieRejectionReason" text;
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "panCardStatus" "kyc_doc_status" DEFAULT 'pending' NOT NULL;
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "panCardRejectionReason" text;
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "aadhaarStatus" "kyc_doc_status" DEFAULT 'pending' NOT NULL;
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "aadhaarRejectionReason" text;
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "cancelledChequeStatus" "kyc_doc_status" DEFAULT 'pending' NOT NULL;
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "companyAddressProofStatus" "kyc_doc_status" DEFAULT 'pending' NOT NULL;
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "cancelledChequeRejectionReason" text;
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "boardResolutionStatus" "kyc_doc_status" DEFAULT 'pending' NOT NULL;
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "boardResolutionRejectionReason" text;
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "partnershipDeedStatus" "kyc_doc_status" DEFAULT 'pending' NOT NULL;
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "partnershipDeedRejectionReason" text;
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "cinStatus" "kyc_doc_status" DEFAULT 'pending' NOT NULL;
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "cinRejectionReason" text;
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "llpAgreementStatus" "kyc_doc_status" DEFAULT 'pending' NOT NULL;
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "llpAgreementRejectionReason" text;

ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "aadhaarMime" varchar(100);
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "panCardMime" varchar(100);
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "selfieMime" varchar(100);
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "cancelledChequeMime" varchar(100);
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "boardResolutionMime" varchar(100);
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "partnershipDeedMime" varchar(100);
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "llpAgreementMime" varchar(100);
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "companyAddressProofMime" varchar(100);

ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "status" "bank_account_status" DEFAULT 'pending' NOT NULL;
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "companyType" varchar(50);
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "businessPanUrl" text;
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "companyAddressProofUrl" text;
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "gstCertificateUrl" text;
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "businessPanMime" varchar(100);
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "gstCertificateMime" varchar(100);
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "businessPanStatus" "kyc_doc_status" DEFAULT 'pending' NOT NULL;
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "gstCertificateStatus" "kyc_doc_status" DEFAULT 'pending' NOT NULL;
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "businessPanRejectionReason" text;
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "gstCertificateRejectionReason" text;
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "rejectionReason" text;

ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "createdAt" timestamptz DEFAULT now();
ALTER TABLE "kyc" ADD COLUMN IF NOT EXISTS "updatedAt" timestamptz DEFAULT now();

-- Keep this field nullable (legacy drift had it as NOT NULL with a text default).
ALTER TABLE "kyc" ALTER COLUMN "cancelledChequeRejectionReason" DROP NOT NULL;
ALTER TABLE "kyc" ALTER COLUMN "cancelledChequeRejectionReason" DROP DEFAULT;

COMMIT;
