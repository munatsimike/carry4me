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
import {
  INFOMODES,
  progress,
  ROLES,
  type Parcel,
  type TestUITrip,
} from "@/types/Ui";
import { loggedInUserParcel, loggedInUserTrip } from "../../../Data";
import RouteRow from "@/app/components/RouteRow";
import DateRow from "@/app/components/DateRow";
import CategoryRow from "@/app/components/CategoryRow";
import WeightRow from "@/app/components/WeightRow";
import ButtomSpacer from "@/app/components/BottomSpacer";
import { Button } from "@/components/ui/Button";
import { Price } from "@/app/components/card/WeightAndPrice";
import { mapCarryRequestToUI } from "@/app/features/carry request/ui/CarryRequestMapper";
import PageSection from "@/app/components/PageSection";
import { useEffect, useMemo, useState } from "react";
import statusColor from "./StatustColorMapper";
import actionsMapper, { type UIActions } from "./ActionsMapper";
import { FetchCarryRequestsUseCase } from "../application/FetchCarryRequestsUseCase";
import { SupabaseCarryRequestRepository } from "../data/SupabaseCarryRequestRepository";
import { useAuthState } from "@/app/shared/supabase/AuthState";
import type { CarryRequest } from "../domain/CarryRequest";
import type { CarryRequestStatus } from "../domain/CreateCarryRequest";
import { toRoleMapper } from "./toRoleMapper";
import { toCarryRequestStatusMapper } from "./toCarryRequestStatusMapper";

export default function CarryRequestsPage() {
  const [carryRequests, setCarryRequests] = useState<CarryRequest[]>([]);
  const carryRequestRepository = useMemo(
    () => new SupabaseCarryRequestRepository(),
    [],
  );
  const fetchCarryRequestUseCase = useMemo(
    () => new FetchCarryRequestsUseCase(carryRequestRepository),
    [carryRequestRepository],
  );

  const [requestLoaded, setRequestLoaded] = useState(false);
  const { userId } = useAuthState();

  useEffect(() => {
    let cancelled = false;
    async function fetchRequest() {
      if (!userId || requestLoaded) return;
      const data = await fetchCarryRequestUseCase.execute(userId);
      if (!cancelled) {
        setCarryRequests(data);
        setRequestLoaded(true);
      }
    }

    fetchRequest();

    return () => {
      cancelled = true;
    };
  }, [userId, requestLoaded]);

  const [inputValue, setValue] = useState<string>("");

  const heightClass = "my-2";

  return (
    <>
      <PageTopSection />
      <DefaultContainer outerClassName="bg-canvas min-h-screen">
        {carryRequests.map((request) => {
          const viewerRole =
            userId === request.senderUserId ? ROLES.SENDER : ROLES.TRAVELER;
          const requestUI = mapCarryRequestToUI(request, viewerRole);
          const actions = actionsMapper(
            viewerRole,
            request.status,
            request.initiatorRole,
          );
          return (
            <Card
              hover={false}
              cornerRadiusClass="rounded-1xl"
              className="px-6 w-full max-w-[960px] mx-auto"
            >
              <div className="flex flex-col gap-2 mx-2">
                <Header
                  title={requestUI.title}
                  description={requestUI.description}
                  requestId={request.carryRequestId.substring(
                    request.carryRequestId.length - 5,
                  )}
                  status={toCarryRequestStatusMapper[request.status]}
                />
                <LineDivider heightClass={heightClass} />
                <ProgressRow
                  currentStep={requestUI.currentStep}
                  isInitiator={
                    viewerRole === toRoleMapper[request.initiatorRole]
                  }
                />
                <LineDivider heightClass={heightClass} />
                <Deails
                  trip={loggedInUserTrip}
                  parcel={loggedInUserParcel}
                  isSenderInitiator={
                    viewerRole === toRoleMapper[request.initiatorRole]
                  }
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
                    {actions.primary && (
                      <Button variant="primary" size="md" leadingIcon>
                        {actions.primary?.label}
                      </Button>
                    )}

                    {actions.infoBlock?.mode === INFOMODES.DISPLAY &&
                      actions.infoBlock.displayText === null && (
                        <InfoBlockDisplay actions={actions} />
                      )}

                    {actions.infoBlock?.mode === INFOMODES.INPUT && (
                      <InfoBlockInput
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
  actions,
  onChange,
  inputValue,
}: {
  inputValue: string;
  actions: UIActions;
  onChange: (value: string) => void;
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
        <Button variant={"primary"} size={"sm"} leadingIcon={undefined}>
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
      <span className="inline-flex bg-canvas rounded-full py-2 px-10">
        <div className="flex gap-6">
          {tabs.map((item) => (
            <span
              key={item.id}
              className={`relative cursor-pointer pb-2 ${item.id === selectedId ? "after:absolute after:bottom-0 after:left-0 after:h-1 after:w-full after:bg-primary-500 after:rounded-full" : ""} `}
              onClick={() => setSelected(item.id)}
            >
              <CustomText
                textSize="xsm"
                key={item.id}
                textVariant={`${item.id === selectedId ? "selected" : "secondary"}`}
              >
                {item.label}
              </CustomText>
            </span>
          ))}
        </div>
      </span>
    </PageSection>
  );
}

function Deails({
  trip,
  parcel,
  isSenderInitiator,
}: {
  trip: TestUITrip;
  parcel: Parcel;
  isSenderInitiator: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <UITrip trip={trip} isSenderInitiator={isSenderInitiator} />
        <Parcel parcel={parcel} isSenderInitiator={isSenderInitiator} />
      </span>
    </div>
  );
}

function Parcel({
  parcel,
  isSenderInitiator,
}: {
  parcel: Parcel;
  isSenderInitiator: boolean;
}) {
  const cardLabel = isSenderInitiator ? "Your parcel" : "Parcel";
  const totalPrice = parcel.details.pricePerKg * parcel.details.weight;
  return (
    <Stack>
      <span>
        <CardLabel variant={"parcel"} label={cardLabel} />
        <ButtomSpacer />
      </span>
      <CategoryRow
        tag={"sender"}
        category={parcel.details.category.join(" ")}
      />
      <RouteRow
        origin={parcel.details.origin}
        destination={parcel.details.destination}
      />
      <WeightRow weight={parcel.details.weight} />
      <Price
        unitPriceLabel={"Price per kg"}
        unitPrice={parcel.details.pricePerKg}
        totalPrice={totalPrice}
        location={parcel.details.origin}
      />
    </Stack>
  );
}
function UITrip({
  trip,
  isSenderInitiator,
}: {
  trip: TestUITrip;
  isSenderInitiator: boolean;
}) {
  const cardLabel = isSenderInitiator ? "Trip" : "Your trip";
  return (
    <Stack>
      <span>
        <CardLabel variant={"trip"} label={cardLabel} />
        <ButtomSpacer />
      </span>
      <TravelerRow name={trip.user.firstName} surname={trip.user.lastName} />
      <RouteRow
        origin={trip.route.origin}
        destination={trip.route.destination}
      />
      <DateRow date={trip.route.date.toDateString()} />
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
      <CustomText textSize="xsm" as="span">
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
    <div className="flex flex-wrap items-center gap-4 bg-neutral-50 py-4 px-3 shadow-sm">
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
