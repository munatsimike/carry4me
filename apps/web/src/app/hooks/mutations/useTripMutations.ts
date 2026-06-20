import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/app/lib/queryKeys";
import { deleteTripUseCase, updateTripStatusUseCase } from "@/app/lib/useCases";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";

export function useDeleteTripMutation() {
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();
  const { showSupabaseError } = useUniversalModal();

  return useMutation({
    mutationFn: (tripId: string) => deleteTripUseCase.execute(tripId),
    onSuccess: async () => {
      await refreshProfile();
      await queryClient.invalidateQueries({ queryKey: queryKeys.trips.all });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.all,
      });
    },
    onError: (err) => showSupabaseError(err),
  });
}

export function useUpdateTripStatusMutation() {
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();
  const { showSupabaseError } = useUniversalModal();

  return useMutation({
    mutationFn: ({ tripId, active }: { tripId: string; active: boolean }) =>
      updateTripStatusUseCase.execute(tripId, active),
    onSuccess: async () => {
      await refreshProfile();
      await queryClient.invalidateQueries({ queryKey: queryKeys.trips.all });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.all,
      });
    },
    onError: (err) => showSupabaseError(err),
  });
}

export function useInvalidateTrips() {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.trips.all });
    await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  };
}
