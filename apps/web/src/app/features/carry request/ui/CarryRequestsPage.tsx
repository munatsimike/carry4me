import { Card } from "@/app/components/card/Card";
import CardLabel from "@/app/components/card/CardLabel";
import LineDivider from "@/app/components/LineDivider";
import SpaceBetweenRow from "@/app/components/SpaceBetweenRow";
import Stack from "@/app/components/Stack";
import TravelerRow from "@/app/components/TravelerRow";
import { META_ICONS } from "@/app/icons/MetaIcon";
import CustomText from "@/components/ui/CustomText";
import DefaultContainer from "@/components/ui/DefualtContianer";
import SvgIcon from "@/components/ui/SvgIcon";
import { INFOMODES, progress, type Parcel as ParcelDetails } from "@/types/Ui";
import RouteRow from "@/app/components/RouteRow";
import DateRow from "@/app/components/DateRow";
import CategoryRow from "@/app/components/CategoryRow";

import ButtomSpacer from "@/app/components/BottomSpacer";
import { Button } from "@/components/ui/Button";

import { mapCarryRequestToUI } from "@/app/features/carry request/ui/CarryRequestMapper";
import PageSection from "@/app/components/PageSection";
import { useEffect, useMemo, useState } from "react";
import statusColor from "./StatustColorMapper";
import actionsMapper, { UIACTIONKEYS, type UIActions } from "./ActionsMapper";
import { FetchCarryRequestsUseCase } from "../application/FetchCarryRequestsUseCase";
import { SupabaseCarryRequestRepository } from "../data/SupabaseCarryRequestRepository";
import { useAuthState } from "@/app/shared/supabase/AuthState";
import type { CarryRequest } from "../domain/CarryRequest";
import {
  CARRY_REQUEST_STATUSES,
  ROLES,
  type CarryRequestStatus,
  type Role,
} from "../domain/CreateCarryRequest";

import type { TripSnapshot } from "../domain/TripSnapshot";
import type { ParcelSnapshot } from "../domain/ParcelSnapShot";
import IconTextRow from "@/app/components/card/IconTextRow";

import { PerformCarryRequestActionUseCase } from "../application/PerformCarryRequestActionUseCase";
import { SupabasePerformActionRepository } from "../data/PerformCarryRequestActionRepository";
import type { HandoverConfirmationState } from "../handover confirmations/domain/HandoverConfirmationState";
import { namedCall } from "@/app/shared/Authentication/application/NamedCall";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import { color, motion } from "framer-motion";

export default function CarryRequestsPage() {
  const [carryRequestsList, setCarryRequestList] = useState<CarryRequest[]>([]);
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
  const performRequestActions = useMemo(
    () => new PerformCarryRequestActionUseCase(performActionRepository),
    [performActionRepository],
  );

  const { showSupabaseError } = useUniversalModal();
  const [isRequestSent, setisRequestSent] = useState(false);
  const [isListLoaded, setIsListLoaded] = useState(false);
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const { userId } = useAuthState();
  const [handoverState, setHandoverState] = useState<
    HandoverConfirmationState | undefined
  >(undefined);

  //fetch carry requests
  useEffect(() => {
    let cancelled = false;

    if (cancelled) return;
    async function fetchRequest() {
      if (!userId || isListLoaded) return;
      const { result } = await namedCall(
        "carryRequest",
        fetchCarryRequestUseCase.execute(userId),
      );

      if (!result.success) {
        showSupabaseError(result.error, result.status);
        return;
      }
      if (result.success) {
        setCarryRequestList(result.data);
        setIsListLoaded(true);
      }
    }

    fetchRequest();
    return () => {
      cancelled = true;
    };
  }, [userId, isListLoaded]);

  const [inputValue, setValue] = useState<string>("");
  const heightClass = "my-2";

  const handleActions = async (
    actions: UIActions,
    carryRequest: CarryRequest,
  ) => {
    if (!actions.primary || isRequestSent || !userId) return;

    const result = await performRequestActions.execute(
      actions.primary.key,
      carryRequest.carryRequestId,
    );

    if (result) {
      setIsListLoaded(false);
      setisRequestSent(true);
    }
  };

  return (
    <>
      <PageTopSection />
      <DefaultContainer outerClassName="bg-canvas min-h-screen">
        {carryRequestsList.map((request) => {
          if (
            request.status == CARRY_REQUEST_STATUSES.PENDING_HANDOVER &&
            !isStateLoaded
          ) {
            ``;
            setHandoverState(request.handoverState);
            setIsStateLoaded(true);
          }
          const viewerRole =
            userId === request.senderUserId ? ROLES.SENDER : ROLES.TRAVELER;
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
              className="px-6 w-full max-w-[1000px] mx-auto shadow-sm"
            >
              <div className="flex flex-col gap-2 mx-2">
                <Header
                  title={requestUI.title}
                  description={requestUI.description}
                  requestId={request.carryRequestId.substring(
                    request.carryRequestId.length - 5,
                  )}
                  status={request.status}
                />
                <LineDivider heightClass={heightClass} />
                <ProgressRow
                  currentStep={requestUI.currentStep}
                  isInitiator={viewerRole === request.initiatorRole}
                />
                <LineDivider heightClass={heightClass} />
                <Deails
                  trip={request.tripSnapshot}
                  parcel={request.parcelSnapshot}
                  viewerRole={viewerRole}
                />
                <LineDivider heightClass={heightClass} />
                {actions.infoBlock?.displayText ? (
                  <RequestCompleted actions={actions} />
                ) : (
                  <SpaceBetweenRow>
                    {actions.secondary ? (
                      <Button
                        variant={"error"}
                        size={"md"}
                        leadingIcon={undefined}
                      >
                        {actions.secondary?.label}
                      </Button>
                    ) : (
                      <span /> // place holder to push primary button to the right
                    )}
                    {actions.primary &&
                      actions.primary.key !== UIACTIONKEYS.RELEASE_PAYMENT && (
                        <Button
                          onClick={() => handleActions(actions, request)}
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
                        handleActions={handleActions}
                        carryRequest={request}
                        actions={actions}
                        onChange={setValue}
                        inputValue={inputValue}
                      />
                    )}
                  </SpaceBetweenRow>
                )}
              </div>
            </Card>
          );
        })}
      </DefaultContainer>
    </>
  );
}

function RequestCompleted({ actions }: { actions: UIActions }) {
  return (
    <span className="flex flex-col gap-2 items-center">
      <CustomText textVariant="primary">
        {actions.infoBlock?.displayText?.title}
      </CustomText>
      <CustomText textSize="xsm">
        {actions.infoBlock?.displayText?.description}
      </CustomText>
    </span>
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
    <span className="inline-flex flex-col gap-2">
      <span className="inline-flex items-center gap-6">
        <CustomText textSize="xsm">{actions.infoBlock?.label}</CustomText>
        <input
          value={inputValue}
          maxLength={15}
          inputMode="numeric"
          className="rounded-md w-[15ch] tracking-widest ... px-3 py-1 border border-neutral-200 text-md focus:ring-2  focus:ring-primary-100 font-mono text-neutral-500 focus:border-primary-100 focus:outline-none"
          onChange={(e) => onChange(e.target.value)}
        />
        <Button
          onClick={() => handleActions(actions, carryRequest)}
          variant={"primary"}
          size={"sm"}
          leadingIcon={undefined}
        >
          <CustomText textVariant="primary" className="text-white">
            {"Payout"}
          </CustomText>
        </Button>
      </span>
      <CustomText textVariant="primary" textSize="xsm">
        {actions.infoBlock?.helperText}
      </CustomText>
    </span>
  );
}

function InfoBlockDisplay({ actions }: { actions: UIActions }) {
  return (
    <span className="flex justify-end bg-grey">
      <span className="inline-flex flex-col gap-2">
        <span className="inline-flex gap-4 items-center">
          <CustomText textSize="xsm">{actions.infoBlock?.label}</CustomText>{" "}
          <CustomText
            className="bg-secondary-100 px-3 py-1 rounded-md"
            textVariant="primary"
          >
            {actions.infoBlock?.value}
          </CustomText>
        </span>
        <CustomText textVariant="primary" textSize="xsm">
          {actions.infoBlock?.helperText}
        </CustomText>
      </span>
    </span>
  );
}

function PageTopSection() {
  const [selectedId, setSelected] = useState<string>("ongoing");
  const tabs = [
    { id: "ongoing", label: "Ongoing", count: 1 },
    { id: "completed", label: "Completed", count: 0 },
    { id: "cancelled", label: "Cancelled", count: 0 },
    { id: "declined", label: "Declined", count: 0 },
  ];
  return (
    <PageSection>
      <span className="inline-flex bg-neutral-100 rounded-full py-2 px-10 shadow-sm  border border-neutral-200">
        <div className="flex gap-6 relative">
          {tabs.map((item) => {
            const isActive = item.id === selectedId;

            return (
              <motion.span
                key={item.id}
                className="relative cursor-pointer pb-2"
                onClick={() => setSelected(item.id)}
                whileTap={{
                  y: 0,
                  scale: 0.95,
                }}
                whileHover={{
                  y: -2,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                animate={{ y: item.id === selectedId ? -3 : 0 }}
              >
                <CustomText
                  textSize="xsm"
                  textVariant={isActive ? "selected" : "secondary"}
                >
                  {item.label}
                </CustomText>

                {/* Animated underline */}
                {isActive && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 h-1 w-full rounded-full bg-primary-500"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.span>
            );
          })}
        </div>
      </span>
    </PageSection>
  );
}

function Deails({
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
    <div className="flex flex-col">
      <span className="grid grid-cols-1 md:grid-cols-[1fr_1fr_0.7fr] gap-10">
        <TripDetails trip={trip} viewerRole={viewerRole} />
        <ParcelDetails parcel={parcel} viewerRole={viewerRole} />
        <Stack>
          <span className="pb-1">
            <CustomText
              as="span"
              textSize="xsm"
              className="inline-flex bg-neutral-100 rounded-full py-1 px-3 border"
            >
              {"Cost summary"}
            </CustomText>
          </span>
          <div className="grid grid-cols-2 gap-y-2">
            <CustomText
              textSize="xsm"
              textVariant="neutral"
              as="span"
              className="text-right"
            >
              {"Parcel weight :"}
            </CustomText>
            <CustomText
              className="pl-1"
              textSize="xsm"
              as="span"
              textVariant="primary"
            >{`${parcel.weight_kg.toString()}kg`}</CustomText>

            <CustomText
              textSize="xsm"
              as="span"
              textVariant="neutral"
              className="text-right"
            >
              {"Price :"}
            </CustomText>
            <CustomText
              textSize="xsm"
              as="span"
              textVariant="primary"
              className="leading-1 pl-1"
            >
              {`${parcel.price_per_kg.toString()}`}/kg
            </CustomText>

            <CustomText
              textSize="xsm"
              as="span"
              textVariant="neutral"
              className="text-right "
            >
              {"Total price :"}
            </CustomText>
            <CustomText
              textSize="xsm"
              as="span"
              className="pl-1"
              textVariant="primary"
            >
              {`${totalPrice.toString()}`}
            </CustomText>
          </div>
        </Stack>
      </span>
    </div>
  );
}

function ParcelDetails({
  parcel,
  viewerRole,
}: {
  parcel: ParcelSnapshot;
  viewerRole: Role;
}) {
  const cardLabel =
    viewerRole === ROLES.SENDER ? "Your parcel details" : "Parcel details";
  const categories = parcel.categories.map((item) => item.name);
  return (
    <Stack>
      <span className="pb-1">
        <CardLabel variant={"parcel"} label={cardLabel} />
        <ButtomSpacer />
      </span>
      <IconTextRow
        iconSize="md"
        Icon={META_ICONS.userIconOutlined}
        label={parcel.sender_name}
      />
      <RouteRow
        origin={parcel.origin.country}
        destination={parcel.destination.country}
      />
      <CategoryRow tag={"sender"} category={categories} />
    </Stack>
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
    viewerRole === ROLES.TRAVELER ? "Your trip details" : "Trip details";
  return (
    <Stack>
      <span className="pb-1">
        <CardLabel variant={"trip"} label={cardLabel} />
        <ButtomSpacer />
      </span>
      <TravelerRow name={trip.traveler_name} />
      <RouteRow
        origin={trip.origin.country}
        destination={trip.destination.country}
      />
      <DateRow date={trip.departure_date} />
    </Stack>
  );
}

type HeaaderProps = {
  title: string;
  description: string;
  requestId: string;
  status: CarryRequestStatus;
};
function Header({ title, description, requestId, status }: HeaaderProps) {
  return (
    <SpaceBetweenRow>
      <CurrentStatus title={title} description={description} status={status} />
      <span className="inline-flex flex-col gap-1">
        <CustomText textSize="xsm"> {"Request"}</CustomText>
        <CustomText textSize="xsm"> {`#${requestId}`}</CustomText>
      </span>
    </SpaceBetweenRow>
  );
}

type StatusProps = {
  title: string;
  description: string;
  status: CarryRequestStatus;
};

function CurrentStatus({ title, description, status }: StatusProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="inline-flex items-center gap-2">
        <CustomText textSize="xsm"> {"Status : "}</CustomText>
        <div className="inline-flex items-center gap-2">
          <span
            className={`inline-flex rounded-full h-3 w-3 ${statusColor(status)}`}
          />
          <CustomText textSize={"md"} textVariant="primary">
            {" "}
            {title}
          </CustomText>
        </div>
      </span>
      <CustomText textSize="xsm" as="span" className="pl-[77px]">
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
    <div className="flex flex-wrap items-center gap-6 bg-neutral-50 py-4 px-3 rounded-lg">
      {isInitiator && <Step isCompleted={isInitiator} stage={progress[1]} />}

      {steps.map((step) => {
        return (
          <Step
            key={step}
            isCompleted={step - 1 < currentStep && currentStep !== 1}
            stage={progress[step]}
          />
        );
      })}
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
    <span className="inline-flex gap-2 items-center">
      <SvgIcon color={iconColor} size={"md"} Icon={META_ICONS.checkedIcon} />
      <CustomText textSize="xsm" textVariant={textColor}>
        {stage}
      </CustomText>
    </span>
  );
}
