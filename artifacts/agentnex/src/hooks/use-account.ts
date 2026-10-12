import { useAuth } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMe, useGetDashboard, useUpdateProfile, useUpdatePreferences,
  getGetMeQueryKey, getGetDashboardQueryKey,
} from "@workspace/api-client-react";

export function useMe() {
  const { isSignedIn, isLoaded } = useAuth();
  return useGetMe({ query: { enabled: isLoaded && !!isSignedIn, queryKey: getGetMeQueryKey(), staleTime: 30_000 } });
}

export function useDashboardData() {
  const { isSignedIn, isLoaded } = useAuth();
  return useGetDashboard({ query: { enabled: isLoaded && !!isSignedIn, queryKey: getGetDashboardQueryKey() } });
}

function useInvalidateAccount() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
    qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
  };
}

export function useSaveProfile() {
  const invalidate = useInvalidateAccount();
  return useUpdateProfile({ mutation: { onSuccess: invalidate } });
}

export function useSavePreferences() {
  const invalidate = useInvalidateAccount();
  return useUpdatePreferences({ mutation: { onSuccess: invalidate } });
}

export function errorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string") {
    return (err as { message: string }).message;
  }
  return "Something went wrong. Please try again.";
}
