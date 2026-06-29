import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/app/lib/queryKeys";
import type { CarryRequest } from "../domain/CarryRequest";
import {
  CARRY_REQUEST_STATUSES,
  ROLES,
  type CarryRequestStatus,
} from "../domain/CreateCarryRequest";
import type { PerformActionResponse } from "../domain/performActionResponse";
import { UIACTIONKEYS } from "../ui/ActionsMapper";

export function patchCarryRequestInCache(
  queryClient: QueryClient,
  carryRequestId: string,
  updater: (request: CarryRequest) => CarryRequest,
): void {
  queryClient.setQueriesData<CarryRequest[]>(
    { queryKey: queryKeys.carryRequests.all },
    (current) => {
      if (!current) return current;

      return current.map((request) =>
        request.carryRequestId === carryRequestId
          ? updater(request)
          : request,
      );
    },
  );
}

export function patchCarryRequestFromActionResponse(
  request: CarryRequest,
  response: PerformActionResponse,
  actorUserId: string,
): CarryRequest {
  if (!response.ok) return request;

  let next = request;
  const newStatus = response.new_status as CarryRequestStatus | undefined;

  if (newStatus) {
    next = {
      ...next,
      status: newStatus,
      paymentExpiresAt:
        response.payment_expires_at !== undefined
          ? response.payment_expires_at
          : next.paymentExpiresAt,
    };
  } else if (response.action === UIACTIONKEYS.CANCEL) {
    next = { ...next, status: CARRY_REQUEST_STATUSES.CANCELLED };
  }

  if (
    response.action === UIACTIONKEYS.CONFIRM_HANDOVER &&
    response.progressed === false &&
    response.waiting_for
  ) {
    next = {
      ...next,
      handoverState: {
        senderConfirmed: response.waiting_for === ROLES.TRAVELER,
        travelerConfirmed: response.waiting_for === ROLES.SENDER,
        bothConfirmed: false,
      },
    };
  }

  if (response.event_type) {
    next = {
      ...next,
      events: {
        ...next.events,
        type: response.event_type as CarryRequest["events"]["type"],
        actorUserId,
      },
    };
  }

  return next;
}

export async function refreshAfterCarryRequestAction(
  queryClient: QueryClient,
  userId: string | undefined,
): Promise<void> {
  const tasks = [
    queryClient.refetchQueries({
      queryKey: queryKeys.carryRequests.all,
      type: "active",
    }),
  ];

  if (userId) {
    tasks.push(
      queryClient.refetchQueries({
        queryKey: queryKeys.notifications.list(userId),
        type: "active",
      }),
    );
  }

  await Promise.all(tasks);
}

export async function applyCarryRequestActionResult(
  queryClient: QueryClient,
  options: {
    userId: string | undefined;
    carryRequestId: string;
    actorUserId: string;
    response: PerformActionResponse;
  },
): Promise<void> {
  const { userId, carryRequestId, actorUserId, response } = options;

  if (response.ok) {
    patchCarryRequestInCache(queryClient, carryRequestId, (request) =>
      patchCarryRequestFromActionResponse(request, response, actorUserId),
    );
  }

  await refreshAfterCarryRequestAction(queryClient, userId);
}
