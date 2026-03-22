import { Card } from "@/app/components/card/Card";
import CardLabel from "@/app/components/card/CardLabel";
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
import { useEffect, useMemo, useState } from "react";
import statusColor from "./StatustColorMapper";
import actionsMapper, { UIACTIONKEYS, type UIActions } from "./ActionsMapper";
import { FetchCarryRequestsUseCase } from "../application/FetchCarryRequestsUseCase";
import { SupabaseCarryRequestRepository } from "../data/SupabaseCarryRequestRepository";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import type { CarryRequest } from "../domain/CarryRequest";
import {
  CARRY_REQUEST_STATUSES,
  ROLES,
  type CarryRequestStatus,
  type Role,
} from "../domain/CreateCarryRequest";
import type { TripSnapshot } from "../domain/TripSnapshot";
import type { ParcelSnapshot } from "../domain/ParcelSnapShot";
import { PerformCarryRequestActionUseCase } from "../application/PerformCarryRequestActionUseCase";
import { SupabasePerformActionRepository } from "../data/PerformCarryRequestActionRepository";
import type { HandoverConfirmationState } from "../handover confirmations/domain/HandoverConfirmationState";
import { namedCall } from "@/app/shared/Authentication/application/NamedCall";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import EmptyState from "@/app/components/EmptyState";
import {
  toEmptyStateForMapper,
  type EmptyStateConfig,
} from "../application/toEmptyStateForMapper";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { SupabaseTripsRepository } from "../../trips/data/SupabaseTripsRepository";
import { MoveRight, Package, PackageX } from "lucide-react";
import { dialogIconStyle } from "@/app/lib/cn";
import { SupabaseParcelRepository } from "../../parcels/data/SupabaseParcelRepository";
import { useToast } from "@/app/components/Toast";
import { format } from "date-fns";
import {
  SegmentedTabs,
  type TabItem,
} from "@/app/shared/Authentication/UI/SegmentedTabs";

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

export default function CarryRequestsPage() {
  const [carryRequestsList, setCarryRequestList] = useState<CarryRequest[]>([]);
  const [selectedTab, setSelectedTab] = useState<SelectedTab | null>(null);
  const carryRequestRepository = useMemo(
    () => new SupabaseCarryRequestRepository(),
    [],
  );
  const fetchCarryRequestUseCase = useMemo(
    () => new FetchCarryRequestsUseCase(carryRequestRepository),
    [carryRequestRepository],
  );

  const performActionRepository = useMemo(
    () => new SupabasePerformActionRepository(),
    [],
  );

  const parcelRepository = useMemo(() => new SupabaseParcelRepository(), []);
  const tripRepository = useMemo(() => new SupabaseTripsRepository(), []);
  const performRequestActions = useMemo(
    () =>
      new PerformCarryRequestActionUseCase(
        carryRequestRepository,
        performActionRepository,
        tripRepository,
        parcelRepository,
      ),
    [
      performActionRepository,
      carryRequestRepository,
      tripRepository,
      parcelRepository,
    ],
  );

  const { openInfo, showSupabaseError } = useUniversalModal();
  const [isRequestSent, setisRequestSent] = useState(false);
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [handoverState, setHandoverState] = useState<
    HandoverConfirmationState | undefined
  >(undefined);

  const [loading, setLoading] = useState(false);
  const [emptyStateMessage, setEmptyState] = useState<EmptyStateConfig | null>(
    null,
  );

  const [searchParams] = useSearchParams();

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

  useEffect(() => {
    async function fetchRequest() {
      if (!user || !selectedTab) return;
      setLoading(true);

      const { result } = await namedCall(
        "carryRequest",
        fetchCarryRequestUseCase.execute(user.id),
      );

      if (!result.success) {
        showSupabaseError(result.error, result.status);
        setLoading(false);
        return;
      }

      if (result.data.length === 0) {
        setEmptyState(toEmptyStateForMapper(selectedTab));
        setCarryRequestList([]);
      } else {
        setEmptyState(null);
        setCarryRequestList(result.data);
      }

      setLoading(false);
    }

    fetchRequest();
  }, [user?.id, selectedTab]);

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

    if (selectedTab === statusToTab.CANCELLED) {
      result = result.filter(
        (item) => item.status === CARRY_REQUEST_STATUSES.CANCELLED,
      );
    }

    if (selectedTab === "declined") {
      result = result.filter(
        (item) => item.status === CARRY_REQUEST_STATUSES.REJECTED,
      );
    }
    if (result.length === 0 && selectedTab) {
      setEmptyState(toEmptyStateForMapper(selectedTab));
    }
    return result;
  }, [carryRequestsList]);

  const [inputValue, setValue] = useState<string>("");
  const heightClass = "my-0";

  const checkTravelersWeight = async (carryRequest: CarryRequest) => {
    const { result } = await namedCall(
      "check space before accept",
      performRequestActions.isSpaceAvailable(
        carryRequest.tripId,
        carryRequest.parcelSnapshot.weight_kg,
      ),
    );

    if (!result.success) {
      showSupabaseError(result.error, result.status);
      return false;
    }

    if (result.success && result.data === false) {
      openInfo({
        icon: <Package className={dialogIconStyle} />,
        title: "Not enough space",
        message:
          "This parcel exceeds your available space. Try browsing documents, smaller parcels or adjust your weight.",
        label: "Adjust weight",
        secondaryLabel: "Browse parcels",
        onClick: () => navigate("/my/trips"),
        secondaryAction: () => navigate("/parcels"),
      });
      return false;
    }
    return true;
  };

  const isParcelAvailable = async (carryRequest: CarryRequest) => {
    const { result } = await namedCall(
      "is parcle available",
      performRequestActions.isParcelAvailable(carryRequest.parcelId),
    );

    if (!result.success && result.error) {
      showSupabaseError(result.error);
      return false;
    }

    if (result.success && !result.data) {
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
  };

  const handlePrimaryActions = async (
    actions: UIActions,
    carryRequest: CarryRequest,
  ) => {
    if (!actions.primary || isRequestSent || !user) return;

    // check weight and parcel availability before accepting a request
    if (actions.primary.key === UIACTIONKEYS.ACCEPT) {
      const weightResult = await checkTravelersWeight(carryRequest);
      if (!weightResult) return;

      const parcelAvailability = await isParcelAvailable(carryRequest);
      if (!parcelAvailability) return;
    }

    /// check if request has not expired
    if (actions.primary.key === UIACTIONKEYS.PAY) {
      const { result } = await namedCall(
        "isExpired",
        performRequestActions.isExpired(carryRequest.carryRequestId),
      );

      if (!result.success) {
        showSupabaseError(result.error);
      }

      if (result.success && !result.data) {
        openInfo({
          title: "Request Expired",
          message: "The request has expired, you can send another request.",
          label:
            carryRequest.initiatorRole === ROLES.SENDER
              ? "Browse trips"
              : "Browse parcels",
        });
      }
    }

    // process request
    const response = await performRequestActions.execute(
      actions.primary.key,
      carryRequest.carryRequestId,
    );

    if (!response.ok) {
      return;
    }

    if (response.ok) {
      const { result } = await namedCall(
        "reserve",
        performRequestActions.reserveWeight(
          carryRequest.tripId,
          carryRequest.parcelSnapshot.weight_kg,
        ),
      );

      if (!result.success) {
        showSupabaseError(result.error);
        return;
      }
    }

    setisRequestSent(true);
    refreshProfile();
    toast("Parcel accepted. Waiting for payment from the sender.", {
      variant: "success",
    });
  };

  const handleSecondaryAcion = async (
    actions: UIActions,
    carryRequest: CarryRequest,
  ) => {
    if (!actions.secondary?.key || !user) return;
    // process request
    const response = await performRequestActions.execute(
      actions.secondary.key,
      carryRequest.carryRequestId,
    );

    if (!response.ok) {
      return;
    }

    if (response.ok) {
      toast("Request cancelled. The traveler has been notified.", {
        variant: "success",
      });
    }
  };

  const pendingHandoverRequest = carryRequestsList?.find(
    (request) => request.status === CARRY_REQUEST_STATUSES.PENDING_HANDOVER,
  );

  useEffect(() => {
    if (pendingHandoverRequest?.handoverState) {
      setHandoverState(pendingHandoverRequest.handoverState);
      setIsStateLoaded(true);
    }
  }, [pendingHandoverRequest]);

  return (
    <>
      <PageSection>
        {selectedTab && (
          <SegmentedTabs
            tabs={tabs}
            selectedTab={selectedTab}
            setTab={setSelectedTab}
          />
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
                  <div className="flex items-center justify-around gap-3">
                    {emptyStateMessage.actions.map((action) => (
                      <Link key={action.href} to={action.href}>
                        <Button variant={action.variant} size="md">
                          {action.label}
                        </Button>
                      </Link>
                    ))}
                  </div>
                )
              }
            />
          )}

          {displayList?.map((request) => {
            const viewerRole =
              user?.id === request.senderUserId ? ROLES.SENDER : ROLES.TRAVELER;

            const requestUI = mapCarryRequestToUI(request, viewerRole);

            const actions = actionsMapper(
              viewerRole,
              request.status,
              request.initiatorRole,
              handoverState ?? undefined,
            );

            return (
              <Card
                key={request.carryRequestId}
                cornerRadiusClass="rounded-2xl"
                className="mx-auto w-full max-w-[1000px] px-6"
              >
                <div className="mx-2 flex flex-col gap-4">
                  <Header
                    title={requestUI.title}
                    description={requestUI.description}
                    requestId={request.carryRequestId.slice(-5)}
                    status={request.status}
                  />

                  <LineDivider heightClass={heightClass} />

                  <ProgressRow
                    currentStep={requestUI.currentStep}
                    isInitiator={viewerRole === request.initiatorRole}
                  />

                  <LineDivider heightClass={heightClass} />

                  <DetailsSection
                    trip={request.tripSnapshot}
                    parcel={request.parcelSnapshot}
                    viewerRole={viewerRole}
                  />

                  {requestUI.title !== "Request cancelled" && (
                    <LineDivider heightClass={heightClass} />
                  )}

                  {actions.infoBlock?.displayText ? (
                    <RequestCompleted actions={actions} />
                  ) : (
                    <RequestActions
                      actions={actions}
                      request={request}
                      inputValue={inputValue}
                      setValue={setValue}
                      onPrimaryAction={handlePrimaryActions}
                      onSecondaryAction={handleSecondaryAcion}
                    />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </DefaultContainer>
    </>
  );
}

function RequestActions({
  actions,
  request,
  inputValue,
  setValue,
  onPrimaryAction,
  onSecondaryAction,
}: {
  actions: UIActions;
  request: CarryRequest;
  inputValue: string;
  setValue: (value: string) => void;
  onPrimaryAction: (actions: UIActions, request: CarryRequest) => void;
  onSecondaryAction: (actions: UIActions, request: CarryRequest) => void;
}) {
  return (
    <div className="flex flex-wrap items-start justify-end gap-10">
      {actions.secondary && (
        <Button
          onClick={() => onSecondaryAction(actions, request)}
          variant="error"
          size="md"
          leadingIcon={undefined}
        >
          {actions.secondary.label}
        </Button>
      )}

      {actions.primary &&
        actions.primary.key !== UIACTIONKEYS.RELEASE_PAYMENT && (
          <Button
            onClick={() => onPrimaryAction(actions, request)}
            variant="primary"
            size="md"
            leadingIcon
          >
            {actions.primary.label}
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
          onChange={setValue}
          inputValue={inputValue}
        />
      )}
    </div>
  );
}

function RequestCompleted({ actions }: { actions: UIActions }) {
  return (
    <div className="flex flex-col items-center gap-2 py-2 text-center">
      <CustomText textVariant="primary">
        {actions.infoBlock?.displayText?.title}
      </CustomText>
      <CustomText textSize="xsm">
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
  carryRequest,
}: {
  inputValue: string;
  carryRequest: CarryRequest;
  actions: UIActions;
  onChange: (value: string) => void;
  handleActions: (actions: UIActions, request: CarryRequest) => void;
}) {
  return (
    <div className="inline-flex flex-col gap-3">
      <div className="inline-flex items-center gap-4">
        <CustomText textSize="xsm">{actions.infoBlock?.label}</CustomText>

        <input
          value={inputValue}
          maxLength={15}
          inputMode="numeric"
          className="w-[15ch] rounded-md border border-neutral-200 px-3 py-1 font-mono tracking-widest text-neutral-500 outline-none focus:border-primary-100 focus:ring-2 focus:ring-primary-100"
          onChange={(e) => onChange(e.target.value)}
        />

        <Button
          onClick={() => handleActions(actions, carryRequest)}
          variant="primary"
          size="sm"
          leadingIcon={undefined}
        >
          <CustomText textVariant="primary" className="text-white">
            Payout
          </CustomText>
        </Button>
      </div>

      <CustomText textVariant="primary" textSize="xsm">
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
          <CustomText textSize="xsm">{actions.infoBlock?.label}</CustomText>
          <CustomText
            className="rounded-md bg-secondary-100 px-3 py-1"
            textVariant="primary"
          >
            {actions.infoBlock?.value}
          </CustomText>
        </div>

        <CustomText textVariant="primary" textSize="xsm">
          {actions.infoBlock?.helperText}
        </CustomText>
      </div>
    </div>
  );
}

function DetailsSection({
  trip,
  parcel,
  viewerRole,
}: {
  trip: TripSnapshot;
  parcel: ParcelSnapshot;
  viewerRole: Role;
}) {
  const totalPrice = parcel.price_per_kg * parcel.weight_kg;

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[0.80fr_1fr_0.50fr]">
      <TripDetails trip={trip} viewerRole={viewerRole} />
      <ParcelDetails parcel={parcel} viewerRole={viewerRole} />
      <CostSummary parcel={parcel} totalPrice={totalPrice} />
    </div>
  );
}

function TripDetails({
  trip,
  viewerRole,
}: {
  trip: TripSnapshot;
  viewerRole: Role;
}) {
  const cardLabel =
    viewerRole === ROLES.TRAVELER ? "Trip details" : "Trip details";

  return (
    <section className="space-y-3">
      <CardLabel variant="trip" label={cardLabel} />

      <div className="space-y-2">
        <span className="flex gap-1 items-center">
          <SvgIcon size={"sm"} Icon={META_ICONS.ukFlag} />
          <CustomText
            textVariant="primary"
            textSize="md"
            className="font-medium"
          >
            {trip.origin.country}{" "}
          </CustomText>
          <MoveRight className="text-neutral-500 h-5 w-4" strokeWidth={1.5} />
          <SvgIcon size={"sm"} Icon={META_ICONS.zimFlag} />
          <CustomText
            textVariant="primary"
            textSize="md"
            className="font-medium"
          >
            {trip.destination.country}
          </CustomText>
        </span>

        <div className="grid grid-cols-[80px_1fr] gap-y-1">
          <CustomText textVariant="secondary" textSize="sm">
            Traveler
          </CustomText>
          <CustomText textVariant="primary" textSize="sm">
            {trip.travelerName}
          </CustomText>

          <CustomText textVariant="secondary" textSize="sm">
            Departs
          </CustomText>
          <CustomText textVariant="primary" textSize="sm">
            {format(new Date(trip.departureDate), dateFormat)}
          </CustomText>
        </div>
      </div>
    </section>
  );
}

function ParcelDetails({
  parcel,
  viewerRole,
}: {
  parcel: ParcelSnapshot;
  viewerRole: Role;
}) {
  const cardLabel = "Parcel details";
  const categories = parcel.goods_category.map((item) => item.name);

  return (
    <section className="space-y-3">
      <CardLabel variant="parcel" label={cardLabel} />

      <div className="space-y-2">
        <span className="flex gap-1 items-center">
          <SvgIcon size={"sm"} Icon={META_ICONS.ukFlag} />
          <CustomText
            textVariant="primary"
            textSize="md"
            className="font-medium"
          >
            {parcel.origin.country}
          </CustomText>
          <MoveRight className="text-neutral-600 h-5 w-4" strokeWidth={1.5} />
          <SvgIcon size={"sm"} Icon={META_ICONS.zimFlag} />
          <CustomText
            textVariant="primary"
            textSize="md"
            className="font-medium"
          >
            {parcel.destination.country}
          </CustomText>
        </span>
        <div className="grid grid-cols-[80px_1fr] gap-y-1">
          <CustomText textVariant="secondary" textSize="sm">
            Sender
          </CustomText>
          <CustomText textVariant="primary" textSize="sm">
            {parcel.sender_name}
          </CustomText>

          <CustomText textVariant="secondary" textSize="sm">
            Items
          </CustomText>
          <CustomText textVariant="primary" textSize="sm">
            {categories.join(", ")}
          </CustomText>
        </div>
      </div>
    </section>
  );
}

function CostSummary({
  parcel,
  totalPrice,
}: {
  parcel: ParcelSnapshot;
  totalPrice: number;
}) {
  return (
    <section className="space-y-3">
      <span className="inline-flex rounded-full border bg-neutral-100 px-3 py-1">
        <CustomText textVariant="primary" as="span" textSize="xsm">
          Cost summary
        </CustomText>
      </span>

      <div className="grid grid-cols-[1fr_auto] gap-y-1">
        <CustomText textVariant="secondary" textSize="sm">
          Parcel weight
        </CustomText>
        <CustomText textVariant="primary" textSize="sm" className="text-right">
          {parcel.weight_kg}kg
        </CustomText>

        <CustomText textVariant="secondary" textSize="sm">
          Price per kg
        </CustomText>
        <div className="grid grid-cols-[auto_auto] justify-end gap-1 tabular-nums">
          <CustomText textVariant="primary" textSize="sm">
            $
          </CustomText>
          <CustomText textVariant="primary" textSize="sm">
            {parcel.price_per_kg.toFixed(2)}
          </CustomText>
        </div>

        <CustomText textVariant="primary" textSize="md" className="font-medium">
          Total
        </CustomText>
        <div className="grid grid-cols-[auto_auto] justify-end gap-1 tabular-nums">
          <CustomText
            textVariant="primary"
            textSize="md"
            className="font-medium"
          >
            $
          </CustomText>
          <CustomText
            textVariant="primary"
            textSize="md"
            className="font-medium"
          >
            {totalPrice.toFixed(2)}
          </CustomText>
        </div>
      </div>
    </section>
  );
}
type HeaderProps = {
  title: string;
  description: string;
  requestId: string;
  status: CarryRequestStatus;
};

function Header({ title, description, requestId, status }: HeaderProps) {
  return (
    <SpaceBetweenRow>
      <CurrentStatus title={title} description={description} status={status} />
      <div className="inline-flex flex-col gap-1">
        <CustomText textSize="sm" textVariant="primary">
          Request
        </CustomText>
        <CustomText textSize="xsm">#{requestId}</CustomText>
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
        <CustomText textSize="sm">Status:</CustomText>

        <div className="inline-flex items-center gap-2">
          <span
            className={`inline-flex h-3 w-3 rounded-full ${statusColor(status)}`}
          />
          <CustomText
            textSize="lg"
            textVariant="primary"
            className="font-medium"
          >
            {title}
          </CustomText>
        </div>
      </div>

      <CustomText textSize="sm" as="span" className="pl-[60px]">
        {description}
      </CustomText>
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
      <CustomText textSize="xsm" textVariant={textColor}>
        {stage}
      </CustomText>
    </span>
  );
}
