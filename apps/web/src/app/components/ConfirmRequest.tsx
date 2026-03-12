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
import type { TripListing } from "../features/trips/domain/Trip";
import type { ParcelListing } from "../features/parcels/domain/Parcel";

import IconTextRow from "./card/IconTextRow";
import { useMemo, useState } from "react";
import { SupabaseCarryRequestRepository } from "../features/carry request/data/SupabaseCarryRequestRepository";
import { CreateCarryRequestUseCase } from "../features/carry request/application/CreateCarryReaquest";
import { SendCarryRequestUseCase } from "../features/carry request/application/SendCarryRequestUseCase";
import type { GoodsCategory } from "../features/goods/domain/GoodsCategory";

type ConfirmRequestProps = {
  loggedInUserId: string;
  trip: TripListing;
  parcel: ParcelListing;
  onSubmitted: () => void;
  isSenderRequesting: boolean;
};

export default function ConfirmRequest({
  loggedInUserId,
  trip,
  parcel,
  onSubmitted,
  isSenderRequesting,
}: ConfirmRequestProps) {
  const carryRequestRepository = useMemo(
    () => new SupabaseCarryRequestRepository(),
    [],
  );
  const createRequest = useMemo(
    () => new CreateCarryRequestUseCase(carryRequestRepository),
    [carryRequestRepository],
  );
  const [requestLoaded, setLoadRequest] = useState<boolean>(false);

  const sendCarryRequestUseCase = useMemo(
    () => new SendCarryRequestUseCase(createRequest),
    [],
  );

  const handleSendRequest = async () => {
    if (requestLoaded) return;

    const requestId = await sendCarryRequestUseCase.execute(
      loggedInUserId,
      parcel,
      trip,
    );
    if (requestId) {
      setLoadRequest(true);
      onSubmitted();
    }
  };

  return (
    <div className="flex flex-col px-5 py-2">
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
        buttonTextVariant="onDark"
        payLoad={undefined as never}
        primaryAction={handleSendRequest}
        secondaryAction={onSubmitted}
      />
    </div>
  );
}
function UITrip({
  trip,
  isSenderRequesting,
}: {
  trip: TripListing;
  isSenderRequesting: boolean;
}) {
  const label = isSenderRequesting ? "Traveler`s Trip" : "Your Trip";
  const items = trip.goodsCategory.map((item) => item.name);
  return (
    <Stack>
      <span>
        <CardLabel variant={"trip"} label={label} />
        <ButtomSpacer />
      </span>

      {trip.user?.fullName && <TravelerRow name={trip.user.fullName} />}
      <RouteRow
        origin={trip.route.originCountry}
        destination={trip.route.destinationCountry}
      />
      <DateRow date={trip.departDate} />
      <CategoryRow tag={"traveler"} category={items} />
    </Stack>
  );
}

function Parcel({
  parcel,
  isSenderRequesting,
  travelerPricePerKg,
}: {
  parcel: ParcelListing;
  isSenderRequesting: boolean;
  travelerPricePerKg: number;
}) {
  const label = isSenderRequesting ? "Your parcel" : "Sender`s Parcel";
  const items = parcel.goodsCategory.map((item: GoodsCategory) => item.name);
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
        <RouteRow
          origin={parcel.route.originCountry}
          destination={parcel.route.destinationCountry}
        />
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
