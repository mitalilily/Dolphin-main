import { useEffect } from "react";
import { Box, Button, Grid, Stack, Typography } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import type {
  BusinessStructure,
  CompanyType,
} from "../../../../types/generic.types";
import FileUploader from "../../../UI/uploader/FileUploader";
import CustomInput from "../../../UI/inputs/CustomInput";
import {
  requiredKycDetails,
  requiredKycFieldMap,
} from "../../../../utils/constants";
import React from "react";

export interface AdditionalKYCForm {
  gstin?: string;
  cin?: string;
  aadhaarUrl?: string;
  businessPanUrl?: string;
  companyAddressProofUrl?: string;
  gstCertificateUrl?: string;
  panCardUrl?: string;
  partnershipDeedUrl?: string;
  boardResolutionUrl?: string;
  llpAgreementUrl?: string;

  cancelledChequeUrl?: string;
}

interface Props {
  structure?: BusinessStructure;
  companyType?: CompanyType;
  defaultValue?: Partial<AdditionalKYCForm>;
  onComplete: (data?: AdditionalKYCForm) => void;
}

const fieldLabels: Record<keyof AdditionalKYCForm, string> = {
  panCardUrl: "Upload PAN Card",
  gstin: "GSTIN (Tax ID)",
  cin: "CIN (Corporate Identification Number)",
  gstCertificateUrl: "Upload GST Certificate",
  aadhaarUrl: "Upload Your Aadhaar Card",
  partnershipDeedUrl: "Upload Partnership Deed",
  businessPanUrl: "Upload Business PAN",
  companyAddressProofUrl: "Upload Company Address Proof",
  boardResolutionUrl: "Upload Board Resolution",
  cancelledChequeUrl: "Upload Cancelled Cheque",
  llpAgreementUrl: "Upload LLP Agreement",
};

const inputPlaceholders: Partial<Record<keyof AdditionalKYCForm, string>> = {
  gstin: "Enter your 15-digit GSTIN",
  cin: "Enter your 21-character CIN",
};

const allowedMimeTypes: Partial<Record<keyof AdditionalKYCForm, string>> = {
  aadhaarUrl: "image/jpeg,image/png,application/pdf",
  panCardUrl: "image/jpeg,image/png,application/pdf",
  cancelledChequeUrl: "image/jpeg,image/png,application/pdf",
  partnershipDeedUrl: "application/pdf",
  boardResolutionUrl: "application/pdf",
  companyAddressProofUrl: "application/pdf,image/jpeg,image/png",
  businessPanUrl: "image/jpeg,image/png,application/pdf",
};

const isFileField = (f: keyof AdditionalKYCForm) =>
  [
    "aadhaarUrl",
    "panCardUrl",
    "partnershipDeedUrl",
    "boardResolutionUrl",
    "llpAgreementUrl",
    "companyAddressProofUrl",
    "boardResolution",
    "cancelledChequeUrl",
    "businessPanUrl",
    "msmeCert",
    "gstCertificateUrl",
  ]?.includes(f);

export default function AdditionalDetailsStep({
  structure = "individual",
  defaultValue,
  companyType,
  onComplete,
}: Props) {
  const {
    control,
    setValue,
    handleSubmit,
    watch,
    formState: { isValid },
  } = useForm<AdditionalKYCForm>({
    defaultValues: defaultValue ?? {},
    mode: "onChange",
  });

  const requiredFields: (keyof AdditionalKYCForm)[] = React.useMemo(() => {
    const config = requiredKycDetails[structure];

    if (
      structure === "company" &&
      companyType &&
      typeof config === "object" &&
      !Array.isArray(config)
    ) {
      return config[companyType as CompanyType] ?? [];
    }

    if (Array.isArray(config)) {
      return config;
    }

    return [];
  }, [structure, companyType]);

  const filePlaceholder = (field: keyof AdditionalKYCForm) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    watch(`${field}_key` as any);

  useEffect(() => {
    // Populate _key fields from URL if available
    requiredFields.forEach((field) => {
      const url = defaultValue?.[field];
      const keyField = `${field}_key` as keyof AdditionalKYCForm;

      if (url && !watch(keyField)) {
        const originalName = decodeURIComponent(
          url.split("/").pop() ?? "Uploaded file"
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setValue(keyField as any, originalName);
      }
    });
  }, []);

  const getStatus = (field: keyof AdditionalKYCForm) =>
    defaultValue?.[
      `${field.replace("Url", "")}Status` as keyof typeof defaultValue
    ] as string | undefined;

  const getRejectionReason = (field: keyof AdditionalKYCForm) =>
    defaultValue?.[
      `${field.replace("Url", "")}RejectionReason` as keyof typeof defaultValue
    ] as string | undefined;

  return (
    <Box component="form" onSubmit={handleSubmit(onComplete)}>
      <Typography variant="h6" mb={2}>
        Enter Additional KYC Details
      </Typography>
      <Grid container spacing={3}>
        {requiredFields.map((field) => (
          <Grid key={field} size={{ md: 6, xs: 12 }}>
            {isFileField(field) ? (
              <Controller
                name={field}
                control={control}
                rules={{
                  required:
                    structure === "company" && companyType
                      ? (
                          requiredKycFieldMap[structure] as Record<
                            CompanyType,
                            Partial<Record<keyof AdditionalKYCForm, boolean>>
                          >
                        )[companyType]?.[field] ?? false
                      : (
                          requiredKycFieldMap[structure] as Partial<
                            Record<keyof AdditionalKYCForm, boolean>
                          >
                        )?.[field] ?? false
                      ? `${fieldLabels[field]} is required`
                      : false,
                  ...(field === "gstin"
                    ? {
                        pattern: {
                          value:
                            /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                          message:
                            "Invalid GSTIN format. Must be 15 characters (e.g., 22ABCDE1234F1Z5)",
                        },
                      }
                    : {}),
                }}
                render={({ field: ctrl, fieldState }) => {
                  const isRequired =
                    structure === "company" && companyType
                      ? (
                          requiredKycFieldMap[structure] as Record<
                            CompanyType,
                            Partial<Record<keyof AdditionalKYCForm, boolean>>
                          >
                        )[companyType]?.[field] ?? false
                      : (
                          requiredKycFieldMap[structure] as Partial<
                            Record<keyof AdditionalKYCForm, boolean>
                          >
                        )?.[field] ?? false;

                  return (
                    <Stack mt={1.5}>
                      <FileUploader
                        required={isRequired}
                        folderKey="kyc"
                        allowInlineFallback
                        forceInlineUpload
                        fullWidth
                        showAccept={Boolean(filePlaceholder(field)) === false}
                        accept={allowedMimeTypes[field]}
                        variant="button"
                        label={fieldLabels[field]}
                        placeholder={filePlaceholder(field) as string}
                        onUploaded={async (files) => {
                          const file = files?.[0];
                          const fileKey = file?.key;
                          setValue(field, fileKey);
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          setValue(`${field}_key` as any, file?.originalName);
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          setValue(`${field}_mime` as any, file?.mime);
                          ctrl.onChange(fileKey);
                        }}
                      />
                      {!watch(field) || watch(field) === defaultValue?.[field]
                        ? (() => {
                            const status = getStatus(field);
                            const reason = getRejectionReason(field);
                            if (status === "rejected") {
                              return (
                                <Typography
                                  variant="caption"
                                  color="error"
                                  mt={0.5}
                                >
                                  Rejected: {reason || "No reason provided"}
                                </Typography>
                              );
                            } else if (status === "verified") {
                              return (
                                <Typography
                                  variant="caption"
                                  color="success.main"
                                  mt={0.5}
                                >
                                  ✅ Verified
                                </Typography>
                              );
                            } else if (status === "verification_in_progress") {
                              return (
                                <Typography
                                  variant="caption"
                                  color="info.main"
                                  mt={0.5}
                                >
                                  ⏳ Verification in progress
                                </Typography>
                              );
                            }
                            return null;
                          })()
                        : null}
                      {fieldState.error && (
                        <Typography variant="caption" color="error">
                          {fieldState.error.message}
                        </Typography>
                      )}
                    </Stack>
                  );
                }}
              />
            ) : (
              <Controller
                name={field}
                control={control}
                rules={(() => {
                  const isRequired =
                    structure === "company" && companyType
                      ? (
                          requiredKycFieldMap[structure] as Record<
                            CompanyType,
                            Partial<Record<keyof AdditionalKYCForm, boolean>>
                          >
                        )[companyType]?.[field] ?? false
                      : (
                          requiredKycFieldMap[structure] as Partial<
                            Record<keyof AdditionalKYCForm, boolean>
                          >
                        )?.[field] ?? false;

                  return {
                    required: isRequired ? `${fieldLabels[field]} is required` : false,
                    ...(field === "gstin"
                      ? {
                          validate: (value?: string) =>
                            !value ||
                            /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
                              value
                            ) ||
                            "Invalid GSTIN format. Must be 15 characters (e.g., 22ABCDE1234F1Z5)",
                        }
                      : {}),
                  };
                })()}
                render={({ field: ctrl, fieldState }) => (
                  <CustomInput
                    {...ctrl}
                    required={
                      (structure === "company" && companyType
                        ? (
                            requiredKycFieldMap[structure] as Record<
                              CompanyType,
                              Partial<Record<keyof AdditionalKYCForm, boolean>>
                            >
                          )[companyType]?.[field] ?? false
                        : (
                            requiredKycFieldMap[structure] as Partial<
                              Record<keyof AdditionalKYCForm, boolean>
                            >
                          )?.[field] ?? false)
                    }
                    fullWidth
                    label={fieldLabels[field]}
                    placeholder={
                      inputPlaceholders[field] ?? `Enter ${fieldLabels[field]}`
                    }
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            )}
          </Grid>
        ))}
      </Grid>

      {/* Submit Button */}
      <Box mt={4} display="flex" justifyContent="flex-end">
        <Button variant="contained" type="submit" disabled={!isValid}>
          Submit KYC
        </Button>
      </Box>
    </Box>
  );
}
