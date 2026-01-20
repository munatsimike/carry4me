import CustomText from "@/components/ui/CustomText";
import SvgIcon from "@/components/ui/SvgIcon";
import type { Parcel, Trip } from "@/types/Ui";
import LineDivider from "./LineDivider";
import IconTextRow from "./card/IconTextRow";
import CardLabel from "./card/CardLabel";
import { META_ICONS } from "../icons/MetaIcon";
import Stack from "./Stack";
import { InlineRow } from "./InlineRow";
import SendRequestBtn from "./card/SendRequestBtn";
import { Price } from "./card/WeightAndPrice";

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
      <div className="flex justify-center">
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
      <Trip trip={trip} isSenderRequesting={isSenderRequesting} />
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
        variant="primary"
      />
    </div>
  );
}
function Trip({
  trip,
  isSenderRequesting,
}: {
  trip: Trip;
  isSenderRequesting: boolean;
}) {
  const label = isSenderRequesting ? "Traveler`s Trip" : "Your Trip";
  return (
    <Stack>
      <CardLabel variant={"trip"} label={label} />
      <IconTextRow
        Icon={META_ICONS.travelerOutline}
        label={`${trip.user.firstName} ${trip.user.lastName}`}
        iconSize="md"
      />
      <InlineRow>
        <IconTextRow Icon={META_ICONS.planeIcon} label={trip.route.origin} />
        <IconTextRow
          Icon={META_ICONS.arrow}
          label={trip.route.destination}
          iconSize="xsm"
        />
      </InlineRow>
      <IconTextRow
        Icon={META_ICONS.calender}
        label={trip.route.date.toDateString()}
      />
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
        <CardLabel variant={"parcel"} label={label} />
        <IconTextRow
          Icon={META_ICONS.parcelBox}
          label={parcel.details.category.join("|")}
        />
        <IconTextRow
          Icon={META_ICONS.scale}
          label={`${parcel.details.weight.toString()} ${"kg"}`}
        />
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
