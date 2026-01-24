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
import { progress, type Parcel, type Trip } from "@/types/Ui";
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
  statusColor,
  type Status,
} from "@/app/CarryRequestMapper";
import PageSection from "@/app/components/PageSection";
import { useState } from "react";

export default function CarryRequestsPage() {
  const heightClass = "my-2";
  const requestUI = mapCarryRequestToUI(carryRequests, "SENDER");

  return (
    <>
      <PageTopSection />

      <DefaultContainer outerClassName="bg-canvas min-h-screen">
        <Card
          hover={false}
          cornerRadiusClass="rounded-1xl"
          className="px-6 w-full max-w-[964px] mx-auto"
        >
          <div className="flex flex-col gap-3">
            <Header
              title={requestUI.title}
              description={requestUI.description}
              requestId={carryRequests.id}
              status={carryRequests.status}
            />
            <LineDivider heightClass={heightClass} />
            <ProgressRow
              currentStep={requestUI.currentStep}
              isInitiator={true}
            />
            <LineDivider heightClass={heightClass} />
            <Deails trip={loggedInUserTrip} parcel={loggedInUserParcel} />
            <LineDivider heightClass={heightClass} />
            {requestUI.canCancel && (
              <SpaceBetweenRow>
                <Button variant={"error"} size={"md"} leadingIcon={undefined}>
                  Cancel request
                </Button>
                <Button variant="primary" size="md" leadingIcon>
                  Make Payment
                </Button>
              </SpaceBetweenRow>
            )}
          </div>
        </Card>
      </DefaultContainer>
    </>
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

function Deails({ trip, parcel }: { trip: Trip; parcel: Parcel }) {
  const totalPrice = parcel.details.pricePerKg * parcel.details.weight;
  return (
    <div className="flex flex-col">
      <SpaceBetweenRow>
        <Parcel parcel={parcel} />
        <Trip trip={trip} />
      </SpaceBetweenRow>
      <LineDivider />
      <Price
        unitPriceLabel={"Price per kg"}
        unitPrice={parcel.details.pricePerKg}
        totalPrice={totalPrice}
        location={parcel.details.origin}
      />
    </div>
  );
}

function Parcel({ parcel }: { parcel: Parcel }) {
  return (
    <Stack>
      <span>
        <CardLabel variant={"parcel"} label={"Your parcel"} />
        <ButtomSpacer />
      </span>
      <CategoryRow tag={"sender"} category={parcel.details.category} />
      <RouteRow
        origin={parcel.details.origin}
        destination={parcel.details.destination}
      />
      <WeightRow weight={parcel.details.weight} />
    </Stack>
  );
}
function Trip({ trip }: { trip: Trip }) {
  return (
    <Stack>
      <span>
        <CardLabel variant={"trip"} label={"Trip"} />
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
      <CustomText textSize="xsm" as="span" className="pl-[78px]">
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
    <div className="flex items-center gap-4 justify-center">
      {isInitiator && <Step isCompleted={true} stage={progress[1]} />}

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
