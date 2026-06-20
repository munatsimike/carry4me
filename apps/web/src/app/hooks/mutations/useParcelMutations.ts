import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/app/lib/queryKeys";
import { deleteParcelUseCase, updateParcelStatusUseCase } from "@/app/lib/useCases";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";

export function useDeleteParcelMutation() {
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();
  const { showSupabaseError } = useUniversalModal();

  return useMutation({
    mutationFn: (parcelId: string) => deleteParcelUseCase.execute(parcelId),
    onSuccess: async () => {
      await refreshProfile();
      await queryClient.invalidateQueries({ queryKey: queryKeys.parcels.all });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.all,
      });
    },
    onError: (err) => showSupabaseError(err),
  });
}

export function useUpdateParcelStatusMutation() {
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();
  const { showSupabaseError } = useUniversalModal();

  return useMutation({
    mutationFn: ({ parcelId, active }: { parcelId: string; active: boolean }) =>
      updateParcelStatusUseCase.execute(parcelId, active),
    onSuccess: async () => {
      await refreshProfile();
      await queryClient.invalidateQueries({ queryKey: queryKeys.parcels.all });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.all,
      });
    },
    onError: (err) => showSupabaseError(err),
  });
}

export function useInvalidateParcels() {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.parcels.all });
    await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  };
}
