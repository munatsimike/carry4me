import { Card } from "@/app/components/card/Card";
import LineDivider from "@/app/components/LineDivider";
import SpaceBetweenRow from "@/app/components/SpaceBetweenRow";
import { META_ICONS } from "@/app/icons/MetaIcon";
import CustomText from "@/components/ui/CustomText";
import DefaultContainer from "@/components/ui/DefualtContianer";
import SvgIcon from "@/components/ui/SvgIcon";
import { dateFormat, INFOMODES, progress } from "@/types/Ui";
import { Button } from "@/components/ui/Button";
import { mapCarryRequestToUI } from "@/app/features/carry request/ui/CarryRequestMapper";
import PageSection from "@/app/components/PageSection";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/app/lib/queryKeys";
import { useCarryRequests } from "@/app/hooks/queries/useCarryRequestsQueries";
import { useQueryErrorEffect } from "@/app/hooks/useQueryErrorEffect";
import { performCarryRequestActionUseCase } from "@/app/lib/useCases";
import { processActionEmailQueue } from "../application/processActionEmailQueue";
import { ensureTravelerStripeReady } from "../application/travelerStripeVerification";
import {
  deliveryOtpFailureMessage,
  resendDeliveryOtp,
  verifyDeliveryOtp,
} from "../application/deliveryOtp";
import {
  cancelCarryRequest,
  type CancelCarryRequestResponse,
} from "../application/cancelCarryRequest";
import PayCarryRequestModal from "./PayCarryRequestModal";
import { invokeStripeFunction } from "@/app/shared/stripe/invokeStripeFunction";
import statusColor from "./StatustColorMapper";
import actionsMapper, {
  UIACTIONKEYS,
  type UIActionKey,
  type UIActions,
} from "./ActionsMapper";
import type { PerformActionResponse } from "../domain/performActionResponse";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { useMarketplaceActionGuard } from "@/app/shared/Authentication/UI/hooks/useMarketplaceActionGuard";
import type { CarryRequest } from "../domain/CarryRequest";
import {
  CARRY_REQUEST_STATUSES,
  ROLES,
  type CarryRequestStatus,
  type Role,
} from "../domain/CreateCarryRequest";
import type { TripSnapshot } from "../domain/TripSnapshot";
import type { ParcelSnapshot } from "../domain/ParcelSnapShot";
import type { HandoverConfirmationState } from "../handover confirmations/domain/HandoverConfirmationState";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import EmptyState from "@/app/components/EmptyState";
import {
  toEmptyStateForMapper,
  type EmptyStateConfig,
} from "../application/toEmptyStateForMapper";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Package, PackageX } from "lucide-react";
import { dialogIconStyle } from "@/app/lib/cn";
import { useToast } from "@/app/components/Toast";
import { format } from "date-fns";
import {
  HorizontalMenu,
  type TabItem,
} from "@/app/shared/Authentication/UI/SegmentedTabs";
import {
  MobileDetailsSection,
  MobileFirstHeader,
  MobileProgressSection,
  type MobileSection,
} from "./CarryRequestPageMobile";
import {
  RequestCostSummarySection,
  RequestDetailsGrid,
  RequestParcelDetailsSection,
  RequestTripDetailsSection,
} from "./RequestDetailsLayout";

export type SelectedTab = "ongoing" | "completed" | "declined" | "cancelled";

const statusToTab: Record<CarryRequestStatus, SelectedTab> = {
  PENDING_ACCEPTANCE: "ongoing",
  PENDING_PAYMENT: "ongoing",
  PENDING_HANDOVER: "ongoing",
  IN_TRANSIT: "ongoing",
  PENDING_PAYOUT: "ongoing",
  PAID_OUT: "completed",
  CANCELLED: "cancelled",
  EXPIRED: "cancelled",
  REJECTED: "declined",
};

const EMPTY_CARRY_REQUESTS: CarryRequest[] = [];

type PendingActionSlot = "primary" | "secondary";

function actionButtonLabel(label: string, isPending: boolean): string {
  return isPending ? "Processing..." : label;
}

function primaryActionSuccessMessage(
  actionKey: UIActionKey,
  response: PerformActionResponse,
): string {
  if (
    actionKey === UIACTIONKEYS.RELEASE_PAYMENT &&
    response.reason === "ALREADY_PAID_OUT"
  ) {
    return "Payment was already released for this request.";
  }

  if (
    actionKey === UIACTIONKEYS.CONFIRM_HANDOVER &&
    response.progressed === false
  ) {
    return "Handover confirmation recorded. Waiting for the other party to confirm.";
  }

  const messages: Partial<Record<UIActionKey, string>> = {
    [UIACTIONKEYS.ACCEPT]:
      "Parcel accepted. Waiting for payment from the sender.",
    [UIACTIONKEYS.PAY]: "Payment completed. You can now proceed to handover.",
    [UIACTIONKEYS.CONFIRM_HANDOVER]:
      "Handover confirmed successfully. The parcel is now in transit.",
    [UIACTIONKEYS.MARK_DELIVERED]: "Delivery confirmed successfully.",
    [UIACTIONKEYS.RELEASE_PAYMENT]: "Payment released successfully.",
  };

  return messages[actionKey] ?? "Action completed.";
}

function secondaryActionSuccessMessage(actionKey: UIActionKey): string {
  if (actionKey === UIACTIONKEYS.REJECT) {
    return "Request rejected successfully.";
  }

  if (actionKey === UIACTIONKEYS.CANCEL) {
    return "Request cancelled successfully.";
  }

  return "Action completed.";
}

export default function CarryRequestsPage() {
  const { user, refreshProfile } = useAuth();
  const { guardAction } = useMarketplaceActionGuard();
  const [selectedTab, setSelectedTab] = useState<SelectedTab | null>(null);
  const queryClient = useQueryClient();
  const performRequestActions = performCarryRequestActionUseCase;

  const {
    data: carryRequestsData,
    error,
    isPending: carryRequestsPending,
  } = useCarryRequests(user?.id);
  const carryRequestsList = carryRequestsData ?? EMPTY_CARRY_REQUESTS;
  useQueryErrorEffect(error, !!user?.id);

  const { openInfo, showSupabaseError, confirm } = useUniversalModal();
 
  const navigate = useNavigate();
  const { toast } = useToast();

  const [handoverState, setHandoverState] = useState<
    HandoverConfirmationState | undefined
  >(undefined);


  const [emptyStateMessage, setEmptyState] = useState<EmptyStateConfig | null>(
    null,
  );

  const [searchParams] = useSearchParams();
  const stripeParamHandledRef = useRef<string | null>(null);

  const tabCounts = useMemo<Record<SelectedTab, number>>(() => {
    const counts: Record<SelectedTab, number> = {
      ongoing: 0,
      completed: 0,
      cancelled: 0,
      declined: 0,
    };

    for (const request of carryRequestsList) {
      const tab = statusToTab[request.status as CarryRequestStatus];
      if (tab) counts[tab]++;
    }

    return counts;
  }, [carryRequestsList]);

  useEffect(() => {
    const tab = searchParams.get("tab") ?? "ongoing";
    setSelectedTab(tab as SelectedTab);
  }, [searchParams]);

  const tabs: TabItem<SelectedTab>[] = [
    { id: "ongoing", label: "Ongoing", count: tabCounts.ongoing },
    { id: "completed", label: "Completed", count: tabCounts.completed },
    { id: "cancelled", label: "Cancelled", count: tabCounts.cancelled },
    { id: "declined", label: "Declined", count: tabCounts.declined },
  ];

  const displayList = useMemo(() => {
    let result = carryRequestsList;

    if (selectedTab === statusToTab.IN_TRANSIT) {
      result = result.filter((item) =>
        new Set([
          "PENDING_ACCEPTANCE",
          "PENDING_PAYMENT",
          "PENDING_HANDOVER",
          "IN_TRANSIT",
          "PENDING_PAYOUT",
        ]).has(item.status),
      );
    }

    if (selectedTab === statusToTab.PAID_OUT) {
      result = result.filter(
        (item) => item.status === CARRY_REQUEST_STATUSES.PAID_OUT,
      );
    }

    if (selectedTab === "cancelled") {
      result = result.filter(
        (item) =>
          item.status === CARRY_REQUEST_STATUSES.CANCELLED ||
          item.status === CARRY_REQUEST_STATUSES.EXPIRED,
      );
    }

    if (selectedTab === "declined") {
      result = result.filter(
        (item) => item.status === CARRY_REQUEST_STATUSES.REJECTED,
      );
    }

    return result;
  }, [carryRequestsList, selectedTab]);

  useEffect(() => {
    if (!selectedTab || carryRequestsPending) return;

    if (displayList.length === 0) {
      setEmptyState(toEmptyStateForMapper(selectedTab));
    } else {
      setEmptyState(null);
    }
  }, [displayList.length, selectedTab, carryRequestsPending]);

  const [inputValue, setValue] = useState<string>("");
  const [otpErrorRequestId, setOtpErrorRequestId] = useState<string | null>(null);


  const checkTravelersWeight = async (carryRequest: CarryRequest) => {
    try {
      const hasSpace = await performRequestActions.isSpaceAvailable(
        carryRequest.tripId,
        carryRequest.parcelSnapshot.weight_kg,
      );

      if (!hasSpace) {
        openInfo({
          icon: <Package className={dialogIconStyle} />,
          title: "Not enough space",
          message:
            "This parcel exceeds your available space. Try a smaller parcel or update your trip capacity.",
          label: "Adjust weight",
          secondaryLabel: "Browse parcels",
          onClick: () => navigate("/my/trips"),
          secondaryAction: () => navigate("/parcels"),
        });
        return false;
      }
      return true;
    } catch (err) {
      showSupabaseError(err);
      return false;
    }
  };

  const isParcelAvailable = async (carryRequest: CarryRequest) => {
    try {
      const available = await performRequestActions.isParcelAvailable(
        carryRequest.parcelId,
      );

      if (!available) {
        openInfo({
          icon: <PackageX className={dialogIconStyle} />,
          title: "Parcel no longer available",
          message: "This parcel is no longer available. Browse other parcels.",
          label: "Browse parcels",
          onClick: () => navigate("/parcels"),
        });
        return false;
      }
      return true;
    } catch (err) {
      showSupabaseError(err);
      return false;
    }
  };

  const [pendingAction, setPendingAction] = useState<{
    requestId: string;
    slot: PendingActionSlot;
  } | null>(null);
  const [paymentRequest, setPaymentRequest] = useState<CarryRequest | null>(null);

  const completePaymentAfterStripe = async (carryRequest: CarryRequest) => {
    setPendingAction({
      requestId: carryRequest.carryRequestId,
      slot: "primary",
    });

    try {
      const response = await performRequestActions.execute(
        UIACTIONKEYS.PAY,
        carryRequest.carryRequestId,
      );

      if (!response.ok) {
        if (response.reason === "PAYMENT_NOT_CONFIRMED") {
          openInfo({
            title: "Payment not confirmed",
            message:
              "Stripe payment is still processing. Wait a moment and try again.",
            label: "Close",
          });
        }
        return;
      }

      processActionEmailQueue(response, carryRequest.carryRequestId);

      await queryClient.refetchQueries({
        queryKey: queryKeys.carryRequests.all,
      });

      refreshProfile();

      toast(primaryActionSuccessMessage(UIACTIONKEYS.PAY, response), {
        variant: "success",
      });
    } finally {
      setPendingAction(null);
    }
  };

  useEffect(() => {
    const stripeParam = searchParams.get("stripe");
    if (stripeParam !== "return" && stripeParam !== "refresh") return;

    // Prevent repeated calls when the page re-renders (common after refreshProfile).
    if (stripeParamHandledRef.current === stripeParam) return;
    stripeParamHandledRef.current = stripeParam;

    void (async () => {
      try {
        await invokeStripeFunction("stripe-connect-status", {});
        refreshProfile();
      } catch (err) {
        showSupabaseError(err);
      } finally {
        // Remove the stripe param so we don't re-run this effect forever.
        const params = new URLSearchParams(searchParams.toString());
        params.delete("stripe");
        const nextSearch = params.toString();
        navigate({ search: nextSearch ? `?${nextSearch}` : "" }, { replace: true });
      }
    })();
  }, [searchParams, refreshProfile, showSupabaseError, navigate]);

  const handlePrimaryActions = async (
    actions: UIActions,
    carryRequest: CarryRequest,
  ) => {
    if (!actions.primary || pendingAction || !user) return;

    setPendingAction({
      requestId: carryRequest.carryRequestId,
      slot: "primary",
    });

    try {
      // ACCEPT checks
      if (actions.primary.key === UIACTIONKEYS.ACCEPT) {
        if (!guardAction(() => undefined, "send_request")) {
          return;
        }

        try {
          const stripeReady = await ensureTravelerStripeReady({ openInfo });
          if (!stripeReady) {
            return;
          }
        } catch (err) {
          showSupabaseError(err);
          return;
        }

        const weightResult = await checkTravelersWeight(carryRequest);
        if (!weightResult) return;

        const parcelAvailability = await isParcelAvailable(carryRequest);
        if (!parcelAvailability) return;
      }

      if (actions.primary.key === UIACTIONKEYS.RELEASE_PAYMENT) {
        const otp = inputValue.trim();
        if (!/^\d{6}$/.test(otp)) {
          setOtpErrorRequestId(carryRequest.carryRequestId);
          toast("Enter the 6-digit code from the sender.", { variant: "error" });
          return;
        }

        try {
          const verifyResult = await verifyDeliveryOtp(
            carryRequest.carryRequestId,
            otp,
          );
          if (!verifyResult.ok) {
            setOtpErrorRequestId(carryRequest.carryRequestId);
            toast(deliveryOtpFailureMessage(verifyResult), { variant: "error" });
            return;
          }
          setOtpErrorRequestId(null);
        } catch (err) {
          setOtpErrorRequestId(carryRequest.carryRequestId);
          showSupabaseError(err);
          return;
        }
      }

      if (actions.primary.key === UIACTIONKEYS.PAY) {
        try {
          const paymentExpired = await performRequestActions.isPaymentExpired(
            carryRequest.carryRequestId,
          );

          if (paymentExpired) {
            openInfo({
              title: "Request expired",
              message: "This request has expired. You can send a new one.",
              label:
                carryRequest.initiatorRole === ROLES.SENDER
                  ? "Browse trips"
                  : "Browse parcels",
            });

            return;
          }
        } catch (err) {
          showSupabaseError(err);
          return;
        }

        setPendingAction(null);
        setPaymentRequest(carryRequest);
        return;
      }

      const response = await performRequestActions.execute(
        actions.primary.key,
        carryRequest.carryRequestId,
      );

      if (!response.ok) {
        if (response.reason === "OTP_NOT_VERIFIED") {
          openInfo({
            title: "Delivery code required",
            message:
              "Verify the sender's 6-digit code before releasing payment.",
            label: "Close",
          });
        }
        return;
      }

      if (actions.primary.key === UIACTIONKEYS.RELEASE_PAYMENT) {
        setValue("");
        setOtpErrorRequestId(null);
      }

      processActionEmailQueue(response, carryRequest.carryRequestId);

      await queryClient.refetchQueries({
        queryKey: queryKeys.carryRequests.all,
      });

      refreshProfile();

      toast(
        primaryActionSuccessMessage(actions.primary.key, response),
        { variant: "success" },
      );
    } finally {
      setPendingAction(null);
    }
  };
  const handleSecondaryAcion = async (
    actions: UIActions,
    carryRequest: CarryRequest,
  ) => {
    if (!actions.secondary?.key || pendingAction || !user) return;
    const viewerRole =
      user.id === carryRequest.senderUserId ? ROLES.SENDER : ROLES.TRAVELER;

    if (actions.secondary.key === UIACTIONKEYS.CANCEL) {
      const senderPaidCancellation = viewerRole === ROLES.SENDER &&
        carryRequest.status === CARRY_REQUEST_STATUSES.PENDING_HANDOVER;
      const shouldCancel = await confirm({
        title: "Cancel this request?",
        message: senderPaidCancellation
          ? "This will cancel the request and process a partial refund. The service fee is non-refundable. Continue?"
          : "This action cancels the carry request and cannot be undone. You can send a new request later.",
        confirmText: "Yes, cancel request",
        cancelText: "Keep request",
        destructive: true,
      });
      if (!shouldCancel) return;
    }

    if (actions.secondary.key === UIACTIONKEYS.RESEND_DELIVERY_OTP) {
      setPendingAction({
        requestId: carryRequest.carryRequestId,
        slot: "secondary",
      });
      try {
        await resendDeliveryOtp(carryRequest.carryRequestId);
        toast("A new 6-digit code was sent to your email.", {
          variant: "success",
        });
      } catch (err) {
        showSupabaseError(err);
      } finally {
        setPendingAction(null);
      }
      return;
    }

    setPendingAction({
      requestId: carryRequest.carryRequestId,
      slot: "secondary",
    });

    try {
      const response: PerformActionResponse = actions.secondary.key === UIACTIONKEYS.CANCEL
        ? await cancelCarryRequest(carryRequest.carryRequestId)
        : await performRequestActions.execute(
          actions.secondary.key,
          carryRequest.carryRequestId,
        );

      if (!response.ok) {
        return;
      }

      processActionEmailQueue(response, carryRequest.carryRequestId);

      if (actions.secondary.key === UIACTIONKEYS.CANCEL) {
        const senderCanceled = viewerRole === ROLES.SENDER;
        const cancelResponse = response as CancelCarryRequestResponse;
        const refundNote = cancelResponse.refund?.applied
          ? cancelResponse.refund!.refund_status === "FULL"
            ? "Refund: full amount returned to sender."
            : "Refund: partial amount returned. Service fee retained."
          : senderCanceled
            ? "Refund is being processed with retained service fee."
            : "Refund is being processed for the sender.";
        openInfo({
          title: "Request cancelled",
          message: senderCanceled
            ? "Traveler notified. Your refund is being processed with a retained service fee."
            : "Request cancelled. The sender will be refunded in full.",
          messageDetail: refundNote,
          label: senderCanceled ? "Browse other parcels" : "Browse other trips",
          onClick: () => navigate(senderCanceled ? "/parcels" : "/travelers"),
        });
      }

      void queryClient.invalidateQueries({
        queryKey: queryKeys.carryRequests.all,
      });
      toast(secondaryActionSuccessMessage(actions.secondary.key), {
        variant: "success",
      });
    } finally {
      setPendingAction(null);
    }
  };

  const pendingHandoverRequest = useMemo(
    () =>
      carryRequestsList.find(
        (request) => request.status === CARRY_REQUEST_STATUSES.PENDING_HANDOVER,
      ),
    [carryRequestsList],
  );

  useEffect(() => {
    const state = pendingHandoverRequest?.handoverState;
    if (!state) return;

    setHandoverState((prev) =>
      prev?.senderConfirmed === state.senderConfirmed &&
      prev?.travelerConfirmed === state.travelerConfirmed
        ? prev
        : state,
    );
  }, [
    pendingHandoverRequest?.carryRequestId,
    pendingHandoverRequest?.handoverState?.senderConfirmed,
    pendingHandoverRequest?.handoverState?.travelerConfirmed,
  ]);

  return (
    <>
      <PageSection>
        {selectedTab && (
          <div className="flex py-2">
            <HorizontalMenu
              tabs={tabs}
              selectedTab={selectedTab}
              setTab={setSelectedTab}
            />
          </div>
        )}
      </PageSection>

      <DefaultContainer outerClassName="bg-canvas min-h-screen">
        <div className="flex flex-col gap-6">
          {emptyStateMessage && (
            <EmptyState
              title={emptyStateMessage.title}
              description={emptyStateMessage.body}
              action={
                emptyStateMessage.actions && (
                  <div className="flex flex-wrap items-center justify-around gap-4">
                    {emptyStateMessage.actions.map((action) => (
                      <Link
                        key={action.href}
                        to={action.href}
                        className="w-full sm:flex-1"
                      >
                        <Button
                          variant={action.variant}
                          size="sm"
                          className="w-full whitespace-nowrap"
                        >
                          {action.label}
                        </Button>
                      </Link>
                    ))}
                  </div>
                )
              }
            />
          )}
          {displayList?.map((request) => (
            <CarryRequestCard
              key={request.carryRequestId}
              request={request}
              user={user}
              handoverState={handoverState}
              inputValue={inputValue}
              setValue={setValue}
              onInputValueChange={(value) => {
                setValue(value);
                if (otpErrorRequestId === request.carryRequestId) {
                  setOtpErrorRequestId(null);
                }
              }}
              otpInputInvalid={otpErrorRequestId === request.carryRequestId}
              onPrimaryAction={handlePrimaryActions}
              onSecondaryAction={handleSecondaryAcion}
              pendingActionSlot={
                pendingAction?.requestId === request.carryRequestId
                  ? pendingAction.slot
                  : null
              }
            />
          ))}
        </div>
      </DefaultContainer>

      {paymentRequest ? (
        <PayCarryRequestModal
          carryRequestId={paymentRequest.carryRequestId}
          originCountry={paymentRequest.parcelSnapshot.origin.country}
          onClose={() => setPaymentRequest(null)}
          onPaymentComplete={async () => {
            await completePaymentAfterStripe(paymentRequest);
            setPaymentRequest(null);
          }}
        />
      ) : null}
    </>
  );
}

function CarryRequestCard({
  request,
  user,
  handoverState,
  inputValue,
  setValue,
  onInputValueChange,
  otpInputInvalid,
  onPrimaryAction,
  onSecondaryAction,
  pendingActionSlot,
}: {
  request: CarryRequest;
  user: { id: string } | null;
  handoverState?: HandoverConfirmationState;
  inputValue: string;
  setValue: (value: string) => void;
  onInputValueChange: (value: string) => void;
  otpInputInvalid: boolean;
  onPrimaryAction: (actions: UIActions, request: CarryRequest) => void;
  onSecondaryAction: (actions: UIActions, request: CarryRequest) => void;
  pendingActionSlot: PendingActionSlot | null;
}) {
  const [openSection, setOpenSection] = useState<MobileSection | null>(null);

  const viewerRole =
    user?.id === request.senderUserId ? ROLES.SENDER : ROLES.TRAVELER;

  const requestUI = mapCarryRequestToUI(request, viewerRole);

  const actions = actionsMapper(
    viewerRole,
    request.status,
    request.initiatorRole,
    handoverState ?? undefined,
  );

  const toggleSection = (section: MobileSection) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const totalPrice =
    request.parcelSnapshot.price_per_kg * request.parcelSnapshot.weight_kg;

  return (
    <>
      <Card
        sizeClass="max-w-5xl"
        key={request.carryRequestId}
        className="mx-auto w-full px-4 sm:px-6 flex flex-col gap-3"
      >
        <div className="flex flex-col gap-4">
          <Header
            title={requestUI.title}
            description={requestUI.description}
            requestId={request.carryRequestId.slice(-5)}
            status={request.status}
          />
          <LineDivider heightClass="my-0" />

          <div className="block md:hidden">
            <MobileFirstHeader
              toggleSection={toggleSection}
              trip={request.tripSnapshot}
              parcel={request.parcelSnapshot}
              totalPrice={totalPrice}
            />
          </div>
        </div>

        <div className="hidden md:block md:flex md:flex-col gap-4">
          <ProgressRow
            currentStep={requestUI.currentStep}
            isInitiator={viewerRole === request.initiatorRole}
          />

          <LineDivider heightClass="my-0" />

          <DetailsSection
            trip={request.tripSnapshot}
            parcel={request.parcelSnapshot}
            viewerRole={viewerRole}
          />
        </div>
        {/**requestUI.title !== "Request cancelled" && (
          <LineDivider heightClass="my-0" />
        )*/}
        <LineDivider heightClass="my-0" />
        {actions.infoBlock?.displayText ? (
          <RequestCompleted actions={actions} />
        ) : (
          <RequestActions
            actions={actions}
            request={request}
            inputValue={inputValue}
            setValue={setValue}
            onInputValueChange={onInputValueChange}
            otpInputInvalid={otpInputInvalid}
            onPrimaryAction={onPrimaryAction}
            onSecondaryAction={onSecondaryAction}
            pendingActionSlot={pendingActionSlot}
          />
        )}
      </Card>
      {openSection === "details" && (
        <MobileDetailsSection
          setOpenSection={() => setOpenSection(null)}
          trip={request.tripSnapshot}
          parcel={request.parcelSnapshot}
          viewerRole={viewerRole}
        />
      )}

      {openSection === "timeline" && (
        <MobileProgressSection
          setOpenSection={() => setOpenSection(null)}
          currentStep={requestUI.currentStep}
          isInitiator={viewerRole === request.initiatorRole}
        />
      )}
    </>
  );
}

function RequestActions({
  actions,
  request,
  inputValue,
  onInputValueChange,
  otpInputInvalid,
  onPrimaryAction,
  onSecondaryAction,
  pendingActionSlot,
}: {
  actions: UIActions;
  request: CarryRequest;
  inputValue: string;
  setValue: (value: string) => void;
  onInputValueChange: (value: string) => void;
  otpInputInvalid: boolean;
  onPrimaryAction: (actions: UIActions, request: CarryRequest) => void;
  onSecondaryAction: (actions: UIActions, request: CarryRequest) => void;
  pendingActionSlot: PendingActionSlot | null;
}) {
  const isActionPending = pendingActionSlot !== null;
  const isPrimaryPending = pendingActionSlot === "primary";
  const isSecondaryPending = pendingActionSlot === "secondary";

  return (
    <div className="flex flex-col sm:flex-row items-start justify-end gap-4 sm:gap-4">
      {actions.secondary && (
        <Button
          className="w-full sm:w-auto"
          onClick={() => onSecondaryAction(actions, request)}
          variant="outline"
          size="md"
          leadingIcon={undefined}
          disabled={isActionPending}
          isBusy={isSecondaryPending}
        >
          {actionButtonLabel(actions.secondary.label, isSecondaryPending)}
        </Button>
      )}

      {actions.primary &&
        actions.primary.key !== UIACTIONKEYS.RELEASE_PAYMENT && (
          <Button
            className="w-full sm:w-auto"
            onClick={() => onPrimaryAction(actions, request)}
            variant="primary"
            size="md"
            leadingIcon
            disabled={isActionPending}
            isBusy={isPrimaryPending}
          >
            {actionButtonLabel(actions.primary.label, isPrimaryPending)}
          </Button>
        )}

      {actions.infoBlock?.mode === INFOMODES.DISPLAY &&
        actions.infoBlock.displayText !== null && (
          <InfoBlockDisplay actions={actions} />
        )}

      {actions.infoBlock?.mode === INFOMODES.INPUT && (
        <InfoBlockInput
          handleActions={onPrimaryAction}
          carryRequest={request}
          actions={actions}
          onChange={onInputValueChange}
          inputValue={inputValue}
          otpInputInvalid={otpInputInvalid}
          isActionPending={isActionPending}
          isPrimaryPending={isPrimaryPending}
        />
      )}
    </div>
  );
}

function RequestCompleted({ actions }: { actions: UIActions }) {
  return (
    <div className="flex flex-col items-center gap-2 pb-2 text-center">
      <CustomText textVariant="primary">
        {actions.infoBlock?.displayText?.title}
      </CustomText>
      <CustomText textSize="xs">
        {actions.infoBlock?.displayText?.description}
      </CustomText>
    </div>
  );
}

function InfoBlockInput({
  handleActions,
  actions,
  onChange,
  inputValue,
  otpInputInvalid,
  carryRequest,
  isActionPending,
  isPrimaryPending,
}: {
  inputValue: string;
  carryRequest: CarryRequest;
  actions: UIActions;
  onChange: (value: string) => void;
  otpInputInvalid: boolean;
  handleActions: (actions: UIActions, request: CarryRequest) => void;
  isActionPending: boolean;
  isPrimaryPending: boolean;
}) {
  const releaseLabel =
    actions.primary?.label ?? "Release payout";

  return (
    <div className="inline-flex flex-col gap-3">
      <div className="inline-flex items-center gap-4">
        <CustomText textSize="xs">{actions.infoBlock?.label}</CustomText>

        <input
          value={inputValue}
          maxLength={6}
          inputMode="numeric"
          disabled={isActionPending}
          className={`w-[15ch] rounded-md border px-3 py-1 font-mono tracking-widest text-neutral-500 outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
            otpInputInvalid
              ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
              : "border-neutral-200 focus:border-primary-100 focus:ring-2 focus:ring-primary-100"
          }`}
          onChange={(e) => onChange(e.target.value)}
        />

        <Button
          onClick={() => handleActions(actions, carryRequest)}
          variant="primary"
          size="sm"
          leadingIcon={undefined}
          disabled={isActionPending}
          isBusy={isPrimaryPending}
        >
          <CustomText textVariant="primary" className="text-white">
            {actionButtonLabel(releaseLabel, isPrimaryPending)}
          </CustomText>
        </Button>
      </div>

      <CustomText textVariant="primary" textSize="xs">
        {actions.infoBlock?.helperText}
      </CustomText>
    </div>
  );
}

function InfoBlockDisplay({ actions }: { actions: UIActions }) {
  return (
    <div className="flex justify-end">
      <div className="inline-flex flex-col gap-2">
        <div className="inline-flex items-center gap-3">
          <CustomText textSize="xs">{actions.infoBlock?.label}</CustomText>
          {actions.infoBlock?.value ? (
            <CustomText
              className="rounded-md bg-secondary-100 px-3 py-1"
              textVariant="primary"
            >
              {actions.infoBlock.value}
            </CustomText>
          ) : null}
        </div>

        <CustomText textVariant="primary" textSize="xs">
          {actions.infoBlock?.helperText}
        </CustomText>
      </div>
    </div>
  );
}

function DetailsSection({
  trip,
  parcel,
}: {
  trip: TripSnapshot;
  parcel: ParcelSnapshot;
  viewerRole: Role;
}) {
  const totalPrice = parcel.price_per_kg * parcel.weight_kg;
  const categories = parcel.goods_category.map((item) => item.name).join(", ");

  return (
    <RequestDetailsGrid>
      <RequestTripDetailsSection
        route={{
          originCountry: trip.origin.country,
          destinationCountry: trip.destination.country,
          originCity: trip.origin.city,
          destinationCity: trip.destination.city,
        }}
        travelerName={trip.traveler_name}
        departsLabel={format(new Date(trip.departure_date), dateFormat)}
      />
      <RequestParcelDetailsSection
        route={{
          originCountry: parcel.origin.country,
          destinationCountry: parcel.destination.country,
          originCity: parcel.origin.city,
          destinationCity: parcel.destination.city,
        }}
        senderName={parcel.sender_name}
        itemsLabel={categories}
      />
      <RequestCostSummarySection
        weightKg={parcel.weight_kg}
        pricePerKg={parcel.price_per_kg}
        totalPrice={totalPrice}
        priceCountry={parcel.origin.country}
      />
    </RequestDetailsGrid>
  );
}
type HeaderProps = {
  title: string;
  description: string;
  requestId: string;
  status: CarryRequestStatus;
};

function Header({ title, description, status }: HeaderProps) {
  return (
    <SpaceBetweenRow>
      <CurrentStatus title={title} description={description} status={status} />
      <div className="inline-flex flex-col gap-1">
        {/* <CustomText textSize="xs">#{requestId}</CustomText> */}
      </div>
    </SpaceBetweenRow>
  );
}
function CurrentStatus({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status: CarryRequestStatus;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="inline-flex items-center gap-2">
        <span
          className={`inline-flex h-3 w-3 rounded-full ${statusColor(status)}`}
        />
        <span className="font-medium font-heading text-ink-primary text-lg sm:text-xl">
          {title}
        </span>
      </div>

      <span className="text-ink-secondary whitespace-normal text-base">
        {description}
      </span>
    </div>
  );
}
function ProgressRow({
  currentStep,
  isInitiator,
}: {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6;
  isInitiator: boolean;
}) {
  const steps = [2, 3, 4, 5, 6] as const;

  return (
    <div className="flex flex-wrap items-center gap-6 rounded-lg px-3 bg-neutral-50 border py-4">
      {isInitiator && <Step isCompleted stage={progress[1]} />}

      {steps.map((step) => (
        <Step
          key={step}
          isCompleted={step - 1 < currentStep && currentStep !== 1}
          stage={progress[step]}
        />
      ))}
    </div>
  );
}

function Step({
  isCompleted = false,
  stage,
}: {
  isCompleted?: boolean;
  stage: string;
}) {
  const iconColor = isCompleted ? "success" : "grey";
  const textColor = isCompleted ? "primary" : "secondary";

  return (
    <span className="inline-flex items-center gap-2">
      <SvgIcon color={iconColor} size="md" Icon={META_ICONS.checkedIcon} />
      <CustomText
        textSize="xs"
        textVariant={textColor}
        className="whitespace-nowrap"
      >
        {stage}
      </CustomText>
    </span>
  );
}
