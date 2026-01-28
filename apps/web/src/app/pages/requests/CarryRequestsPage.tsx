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
  type UITrip,
} from "@/types/Ui";
import {
  carryRequests,
  loggedInUserParcel,
  loggedInUserTrip,
} from "../../Data";
import RouteRow from "@/app/components/RouteRow";
import DateRow from "@/app/components/DateRow";
import CategoryRow from "@/app/components/CategoryRow";
import WeightRow from "@/app/components/WeightRow";
import ButtomSpacer from "@/app/components/BottomSpacer";
import { Button } from "@/components/ui/Button";
import { Price } from "@/app/components/card/WeightAndPrice";
import {
  mapCarryRequestToUI,
  type Status,
} from "@/app/pages/requests/CarryRequestMapper";
import PageSection from "@/app/components/PageSection";
import { useState } from "react";
import statusColor from "./StatustColorMapper";
import actionsMapper, { type UIActions } from "./ActionsMapper";

export default function CarryRequestsPage() {
  const [inputValue, setValue] = useState<string>("");
  const viewerRole = ROLES.SENDER;
  const heightClass = "my-2";
  const requestUI = mapCarryRequestToUI(carryRequests, viewerRole);
  const actions = actionsMapper(
    viewerRole,
    carryRequests.status,
    carryRequests.initiatorRole,
  );
  return (
    <>
      <PageTopSection />
      <DefaultContainer outerClassName="bg-canvas min-h-screen">
        <Card
          hover={false}
          cornerRadiusClass="rounded-1xl"
          className="px-6 w-full max-w-[950px] mx-auto"
        >
          <div className="flex flex-col gap-3 mx-2">
            <Header
              title={requestUI.title}
              description={requestUI.description}
              requestId={carryRequests.id}
              status={carryRequests.status}
            />
            <LineDivider heightClass={heightClass} />
            <ProgressRow
              currentStep={requestUI.currentStep}
              isInitiator={viewerRole === carryRequests.initiatorRole}
            />
            <LineDivider heightClass={heightClass} />
            <Deails
              trip={loggedInUserTrip}
              parcel={loggedInUserParcel}
              isSenderInitiator={viewerRole === carryRequests.initiatorRole}
            />
            <LineDivider heightClass={heightClass} />
            {actions.infoBlock?.displayText ? (
              <RequestCompleted actions={actions} />
            ) : (
              <SpaceBetweenRow>
                {actions.secondary ? (
                  <Button variant={"error"} size={"md"} leadingIcon={undefined}>
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
  const [selectedId, setSelected] = useState<string>("Ongoing(1)");
  const tabs = ["Ongoing(1)", "Completed(0)", "Cancelled(0)", "Declined(0)"];
  return (
    <PageSection>
      <span className="inline-flex bg-canvas rounded-full py-2 px-10">
        <div className="flex gap-6">
          {tabs.map((item) => (
            <span
              className={`relative cursor-pointer pb-2 ${item === selectedId ? "after:absolute after:bottom-0 after:left-0 after:h-1 after:w-full after:bg-primary-500 after:rounded-full" : ""} `}
              onClick={() => setSelected(item)}
            >
              <CustomText
                textSize="xsm"
                key={item}
                textVariant={`${item === selectedId ? "selected" : "secondary"}`}
              >
                {item}
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
  trip: UITrip;
  parcel: Parcel;
  isSenderInitiator: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="grid grid-cols-2 gap-6">
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
      <CategoryRow tag={"sender"} category={parcel.details.category} />
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
  trip: UITrip;
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
  requestId: number;
  status: Status;
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
  status: Status;
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
    <div className="flex items-center gap-4">
      {isInitiator && <Step isCompleted={isInitiator} stage={progress[1]} />}

      {steps.map((step) => {
        return (
          <Step
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
  const iconColor = isCompleted ? "trip" : "grey";
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
