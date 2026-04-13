// hooks/useUpdateUserProfile.ts
import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { IUserProfileDB } from "../../types/user.types";
import { updateUserProfile } from "../../api/userProfile.api";
import { toast } from "../../components/UI/Toast";

/**
 * Update the current user's profile
 *
 * @example
 * const { mutate: saveProfile, isPending } = useUpdateUserProfile({
 *   onSuccess: () => toast.success("Profile updated!"),
 * });
 */
export const useUpdateUserProfile = (
  options?: UseMutationOptions<
    { message: string; user: IUserProfileDB },
    Error,
    Partial<IUserProfileDB>
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<
    { message: string; user: IUserProfileDB },
    Error,
    Partial<IUserProfileDB>
  >({
    mutationFn: updateUserProfile,
    onSuccess: (data, variables, context) => {
      // 1️⃣  Optimistically write the new profile into cache
      queryClient.setQueryData(["userProfile"], data?.user);

      toast.open({ message: data?.message, severity: "success" });

      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      // Forward to consumer‑supplied handler
      options?.onError?.(error, variables, context);
      toast.open({
        message: "Error saving profile details!",
        severity: "error",
      });
    },
    ...options,
  });
};
