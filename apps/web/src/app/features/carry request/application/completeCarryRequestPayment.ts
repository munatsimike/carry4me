import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/app/lib/queryKeys";
import { performCarryRequestActionUseCase } from "@/app/lib/useCases";
import type { CarryRequest } from "../domain/CarryRequest";
import { CARRY_REQUEST_STATUSES } from "../domain/CreateCarryRequest";
import { processActionEmailQueue } from "./processActionEmailQueue";
import { UIACTIONKEYS } from "../ui/ActionsMapper";

export type CompleteCarryRequestPaymentResult =
  | { status: "success"; carryRequestId: string }
  | { status: "already_paid"; carryRequestId: string }
  | { status: "payment_not_confirmed" }
  | { status: "expired"; request: CarryRequest };

type CompleteCarryRequestPaymentDeps = {
  performRequestActions?: typeof performCarryRequestActionUseCase;
  queryClient: QueryClient;
  refreshProfile: () => void;
};

export async function completeCarryRequestPayment(
  carryRequestId: string,
  {
    performRequestActions = performCarryRequestActionUseCase,
    queryClient,
    refreshProfile,
  }: CompleteCarryRequestPaymentDeps,
): Promise<CompleteCarryRequestPaymentResult> {
  const findLatestRequest = () => {
    const cachedLists = queryClient.getQueriesData<CarryRequest[]>({
      queryKey: queryKeys.carryRequests.all,
    });

    return cachedLists
      .flatMap(([, data]) => data ?? [])
      .find((request) => request.carryRequestId === carryRequestId);
  };

  const response = await performRequestActions.execute(
    UIACTIONKEYS.PAY,
    carryRequestId,
  );

  if (response.ok) {
    processActionEmailQueue(response, carryRequestId);
    await queryClient.refetchQueries({
      queryKey: queryKeys.carryRequests.all,
    });
    refreshProfile();
    return { status: "success", carryRequestId };
  }

  if (response.reason === "PAYMENT_NOT_CONFIRMED") {
    return { status: "payment_not_confirmed" };
  }

  await queryClient.refetchQueries({
    queryKey: queryKeys.carryRequests.all,
  });

  const latestRequest = findLatestRequest();
  if (latestRequest?.status === CARRY_REQUEST_STATUSES.PENDING_HANDOVER) {
    refreshProfile();
    return { status: "already_paid", carryRequestId };
  }

  if (response.reason === "PAYMENT_EXPIRED" && latestRequest) {
    return { status: "expired", request: latestRequest };
  }

  return { status: "payment_not_confirmed" };
}
