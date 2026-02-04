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

type ConfirmRequestProps = {
  trip: Trip;
  parcel: Parcel;
  onClose: () => void;
  isSenderRequesting?: boolean;
};

export default function ConfirmRequest({
  trip,
  parcel,
  onClose,
  isSenderRequesting = true,
}: ConfirmRequestProps) {
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
        payLoad={parcel}
        primaryAction={() => parcel}
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
  return (
    <Stack>
      <span>
        <CardLabel variant={"trip"} label={label} />
        <ButtomSpacer />
      </span>

      {trip.user.fullName && (
        <TravelerRow name={trip.user.fullName} surname={trip.user?.fullName} />
      )}
      <RouteRow
        origin={trip.route.originCountry}
        destination={trip.route.destinationCountry}
      />
      <DateRow date={""} />
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
  const pricePerKg = isSenderRequesting ? travelerPricePerKg : "";

  // const totalPrice = pricePerKg * parcel.details.weight;
  return (
    <>
      <Stack>
        <span>
          <CardLabel variant={"parcel"} label={label} />
          <ButtomSpacer />
        </span>
        <CategoryRow tag={"sender"} category={parcel.categories.join(" ")} />
        <WeightRow weight={parcel.weightKg} />
      </Stack>
      <LineDivider />
      <Price
        unitPriceLabel={"Price per kg"}
        unitPrice={0}
        totalPrice={0}
        location={"USA"}
      />
    </>
  );
}
