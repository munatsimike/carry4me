import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/app/lib/queryKeys";
import { fetchCarryRequestsUseCase } from "@/app/lib/useCases";

export function useCarryRequests(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.carryRequests.list(userId ?? ""),
    queryFn: () => fetchCarryRequestsUseCase.execute(userId!),
    enabled: !!userId,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}
