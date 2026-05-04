// src/hooks/useRequestPasswordLogin.ts

import { useMutation } from "@tanstack/react-query";
import { requestPasswordLoginApi, verifyEmailOtpApi } from "../api/auth";

export const useRequestPasswordLogin = () => {
  return useMutation({
    mutationFn: ({
      email,
      password,
      intent = 'login',
    }: {
      email: string
      password?: string
      intent?: 'login' | 'signup'
    }) => requestPasswordLoginApi(email, password, intent),
  });
};

export const useVerifyEmailOtp = () =>
  useMutation({
    mutationFn: ({
      email,
      otp,
      password,
    }: {
      email: string;
      otp: string;
      password: string;
    }) => verifyEmailOtpApi(email, otp, password),
  });
