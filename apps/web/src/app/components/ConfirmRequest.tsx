import CustomText from "@/components/ui/CustomText";
import SvgIcon from "@/components/ui/SvgIcon";
import LineDivider from "./LineDivider";
import CardLabel from "./card/CardLabel";
import { META_ICONS } from "../icons/MetaIcon";
import Stack from "./Stack";
import SendRequestBtn from "./card/SendRequestBtn";
import { Price } from "./card/WeightAndPrice";
import WeightRow from "./WeightRow";
import CategoryRow from "./CategoryRow";
import DateRow from "./DateRow";
import RouteRow from "./RouteRow";
import TravelerRow from "./TravelerRow";
import ButtomSpacer from "./BottomSpacer";
import type { Trip } from "../features/trips/domain/Trip";
import type { Parcel } from "../features/parcels/domain/Parcel";
import LableTextRow from "./LabelTextRow";
import IconTextRow from "./card/IconTextRow";
import { useMemo, useState } from "react";
import { SupabaseCarryRequestRepository } from "../features/carry request/data/SupabaseCarryRequestRepository";
import { toCreateCarryRequestMapper } from "../features/carry request/domain/toCreateCarryRequestMapper";
import { CreateCarryRequestEventUseCase } from "../features/carry request/application/CreateCarryRequestEventUseCase";
import { SupabaseCarryRequestEventRepository } from "../features/carry request/data/SupabaseCarryRequestEventsRepository";
import { toCarryRequestEventMapper } from "../features/carry request/domain/toCarryRequestEventMapper";
import {
  CARRY_REQUEST_STATUSES,
  ROLES,
} from "../features/carry request/domain/CreateCarryRequest";
import { CreateCarryRequestUseCase } from "../features/carry request/application/CreateCarryReaquest";

type ConfirmRequestProps = {
  loggedInUserId: string;
  trip: Trip;
  parcel: Parcel;
  onClose: () => void;
  isSenderRequesting: boolean;
};

export default function ConfirmRequest({
  loggedInUserId,
  trip,
  parcel,
  onClose,
  isSenderRequesting,
}: ConfirmRequestProps) {
  const requestEventRepo = useMemo(
    () => new SupabaseCarryRequestEventRepository(),
    [],
  );
  const createEventUseCase = useMemo(
    () => new CreateCarryRequestEventUseCase(requestEventRepo),
    [requestEventRepo],
  );
  const carryRequestRepository = useMemo(
    () => new SupabaseCarryRequestRepository(),
    [],
  );
  const createRequest = useMemo(
    () => new CreateCarryRequestUseCase(carryRequestRepository),
    [carryRequestRepository],
  );
  const [requestLoaded, setLoadRequest] = useState<boolean>(false);

  const handleRequest = async () => {
    if (requestLoaded) return;
    const userId =
      loggedInUserId === parcel.user.id ? ROLES.SENDER : ROLES.TRAVELER;
    const actorId =
      loggedInUserId === parcel.user.id ? parcel.user.id : trip.user.id;

    const requestId = await createRequest.execute(
      toCreateCarryRequestMapper(
        parcel,
        trip,
        userId,
        CARRY_REQUEST_STATUSES.PENDING_ACCEPTANCE,
      ),
    );
    createEventUseCase.execute(
      toCarryRequestEventMapper(requestId, "request_sent", actorId),
    );
    setLoadRequest(true);
    onClose();
  };

  return (
    <div className="flex flex-col px-5">
      <div className="flex justify-center mb-1">
        <SvgIcon color="primary" size={"lg"} Icon={META_ICONS.sendArrow} />
      </div>
      <div className="flex flex-col items-center">
        <CustomText textSize="lg" textVariant="primary">
          {"Send a carry parcel request"}
        </CustomText>
        <CustomText textSize="xsm" textVariant="secondary">
          {isSenderRequesting
            ? "You're requesting this traveler to carry your parcel on their trip."
            : "You're requesting  to carry this parcel on your upcoming trip."}
        </CustomText>
      </div>
      <LineDivider />
      <UITrip trip={trip} isSenderRequesting={isSenderRequesting} />
      <LineDivider />
      <Parcel
        parcel={parcel}
        isSenderRequesting={isSenderRequesting}
        travelerPricePerKg={trip.pricePerKg}
      />
      <LineDivider />
      <SendRequestBtn
        payLoad={undefined as never}
        primaryAction={handleRequest}
        secondaryAction={onClose}
      />
    </div>
  );
}
function UITrip({
  trip,
  isSenderRequesting,
}: {
  trip: Trip;
  isSenderRequesting: boolean;
}) {
  const label = isSenderRequesting ? "Traveler`s Trip" : "Your Trip";
  const items = trip.acceptedGoods.map((item) => item.name).join("-");
  return (
    <Stack>
      <span>
        <CardLabel variant={"trip"} label={label} />
        <ButtomSpacer />
      </span>

      {<TravelerRow name={trip.user.fullName} />}
      <RouteRow
        origin={trip.route.originCountry}
        destination={trip.route.destinationCountry}
      />
      <DateRow date={trip.departDate} />
      <LableTextRow label={"Accepted Items:"} text={items} />
    </Stack>
  );
}

function Parcel({
  parcel,
  isSenderRequesting,
  travelerPricePerKg,
}: {
  parcel: Parcel;
  isSenderRequesting: boolean;
  travelerPricePerKg: number;
}) {
  const label = isSenderRequesting ? "Your parcel" : "Sender`s Parcel";
  const items = parcel.categories.map((item) => item.name).join("-");
  const pricePerKg = isSenderRequesting
    ? travelerPricePerKg
    : parcel.pricePerKg;

  const totalPrice = pricePerKg * parcel.weightKg;
  return (
    <>
      <Stack>
        <span>
          <CardLabel variant={"parcel"} label={label} />
          <ButtomSpacer />
        </span>
        <IconTextRow
          iconSize="md"
          Icon={META_ICONS.userIconOutlined}
          label={parcel.user.fullName}
        />
        <CategoryRow tag={"sender"} category={items} />
        <WeightRow weight={parcel.weightKg} />
      </Stack>
      <LineDivider />
      <Price
        unitPriceLabel={"Price per kg"}
        unitPrice={pricePerKg}
        totalPrice={totalPrice}
        location={"USA"}
      />
    </>
  );
}
