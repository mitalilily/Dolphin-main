// src/hooks/useCompleteUserOnboarding.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { completeUserOnboarding } from "../api/user";
import { toast } from "../components/UI/Toast";
import type { IUserProfileDB } from "../types/user.types";

const mergeOnboardingProfile = (
  current: IUserProfileDB | undefined,
  incoming: IUserProfileDB
) => {
  if (!current) return incoming;

  // A slower background save from step 1/2 must never downgrade a profile
  // after the final onboarding submit has already marked it complete.
  if (current.onboardingComplete && !incoming.onboardingComplete) {
    return current;
  }

  return {
    ...current,
    ...incoming,
    onboardingStep: incoming.onboardingComplete
      ? incoming.onboardingStep
      : Math.max(current.onboardingStep ?? 0, incoming.onboardingStep ?? 0),
  };
};

export const useCompleteUserOnboarding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      step,
      data,
    }: {
      step: number;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: Record<string, any>;
    }) => completeUserOnboarding(step, data),

    onSuccess: (data, variables) => {
      if (data?.user) {
        queryClient.setQueryData<IUserProfileDB | undefined>(["userProfile"], (current) =>
          mergeOnboardingProfile(current, data.user)
        );
        queryClient.setQueryData<IUserProfileDB | undefined>(["userInfo"], (current) =>
          mergeOnboardingProfile(current, data.user)
        );
      }
      if (variables.step >= 3) {
        queryClient.invalidateQueries({ queryKey: ["userProfile"] });
        queryClient.invalidateQueries({ queryKey: ["userInfo"] });
      }
      return data;
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.open({
        message: error?.response?.data?.error ?? "Error saving details",
        severity: "error",
        duration: 8000,
      });
      console.error("Onboarding error", error);
    },
  });
};
