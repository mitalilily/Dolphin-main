import { Stack, Typography, TextField } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "../../UI/Toast";
import {
  useRequestProfilePhoneVerify,
  useVerifyProfilePhoneOtp,
} from "../../../hooks/User/useVerifyProfilePhone";
import CustomDialog from "../../UI/modal/CustomModal";
import CustomIconLoadingButton from "../../UI/button/CustomLoadingButton";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  open: boolean;
  onClose: () => void;
  phone: string;
}

export default function PhoneVerificationModal({
  open,
  onClose,
  phone,
}: Props) {
  const queryClient = useQueryClient();
  /* ---------- react‑hook‑form ---------- */
  const { handleSubmit, setValue, clearErrors, formState } = useForm<{
    otp: string;
  }>({
    defaultValues: { otp: "" },
  });
  const { errors } = formState;

  /* ---------- local state ---------- */
  const [otpArr, setOtpArr] = useState<string[]>(Array(6).fill(""));

  /* ---------- refs for auto‑focus ---------- */
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  /* ---------- query hooks ---------- */
  const { mutateAsync: sendOTP } = useRequestProfilePhoneVerify();
  const { mutateAsync: verifyOTP, isPending: verifying } =
    useVerifyProfilePhoneOtp();

  /* ---------- send OTP on open ---------- */
  useEffect(() => {
    if (open && phone) {
      sendOTP({ phone }).then(() =>
        toast.open({ message: "OTP sent to phone", severity: "info" })
      );
      // reset any previous OTP UI
      setOtpArr(Array(6).fill(""));
      setValue("otp", "");
      clearErrors("otp");
    }
  }, [open, phone, sendOTP, setValue, clearErrors]);

  /* ---------- OTP handlers ---------- */
  const handleBoxChange = (idx: number, char: string) => {
    if (!/^\d?$/.test(char)) return; // digits only, 0/1 char
    const next = [...otpArr];
    next[idx] = char;
    setOtpArr(next);

    const otpStr = next.join("");
    setValue("otp", otpStr, { shouldValidate: true });

    // auto‑focus forward
    if (char && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleBoxKeyDown = (
    idx: number,
    e: React.KeyboardEvent<HTMLDivElement>
  ) => {
    if (e.key === "Backspace" && !otpArr[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  /* ---------- verify submit ---------- */
  const onVerify = async ({ otp }: { otp: string }) => {
    try {
      await verifyOTP({ phone, otp });
      toast.open({ message: "Phone verified!", severity: "success" });
      onClose();
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.open({
        message: error?.response?.data?.message || "Invalid OTP",
        severity: "error",
      });
    }
  };

  /* ---------- UI ---------- */
  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Verify Your Phone"
      footer={
        <CustomIconLoadingButton
          onClick={handleSubmit(onVerify)}
          loading={verifying}
          text="Verify"
          loadingText="Verifying..."
        />
      }
    >
      <Stack spacing={2} mt={1}>
        <Typography variant="body2" color="text.secondary">
          Enter the 6‑digit code sent to&nbsp;
          <strong>{phone}</strong>
        </Typography>

        {/* OTP boxes */}
        <Stack direction="row" spacing={1} justifyContent="center">
          {Array.from({ length: 6 }).map((_, i) => (
            <TextField
              key={i}
              inputRef={(el) => (refs.current[i] = el)}
              value={otpArr[i]}
              onChange={(e) => handleBoxChange(i, e.target.value)}
              onKeyDown={(e) => handleBoxKeyDown(i, e)}
              inputProps={{
                maxLength: 1,
                style: {
                  width: 42,
                  textAlign: "center",
                  fontSize: 18,
                  padding: 12,
                },
              }}
              error={!!errors.otp}
              variant="outlined"
              size="small"
            />
          ))}
        </Stack>

        {errors.otp && (
          <Typography variant="caption" color="error">
            {errors.otp.message}
          </Typography>
        )}
      </Stack>
    </CustomDialog>
  );
}
