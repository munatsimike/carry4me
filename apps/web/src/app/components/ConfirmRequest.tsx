import CustomText from "@/components/ui/CustomText";
import SvgIcon from "@/components/ui/SvgIcon";
import type { Parcel, UITrip } from "@/types/Ui";
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

type ConfirmRequestProps = {
  trip: UITrip;
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
        travelerPricePerKg={trip.route.pricePerKg}
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
  trip: UITrip;
  isSenderRequesting: boolean;
}) {
  const label = isSenderRequesting ? "Traveler`s Trip" : "Your Trip";
  return (
    <Stack>
      <span>
        <CardLabel variant={"trip"} label={label} />
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
  const pricePerKg = isSenderRequesting
    ? travelerPricePerKg
    : parcel.details.pricePerKg;

  const totalPrice = pricePerKg * parcel.details.weight;
  return (
    <>
      <Stack>
        <span>
          <CardLabel variant={"parcel"} label={label} />
          <ButtomSpacer />
        </span>
        <CategoryRow tag={"sender"} category={parcel.details.category} />
        <WeightRow weight={parcel.details.weight} />
      </Stack>
      <LineDivider />
      <Price
        unitPriceLabel={"Price per kg"}
        unitPrice={pricePerKg}
        totalPrice={totalPrice}
        location={parcel.details.origin}
      />
    </>
  );
}
