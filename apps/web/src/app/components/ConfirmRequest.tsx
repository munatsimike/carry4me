import CustomText from "@/components/ui/CustomText";
import SvgIcon from "@/components/ui/SvgIcon";
import type { Parcel, Trip } from "@/types/Ui";
import LineDivider from "./LineDivider";
import IconTextRow from "./card/IconTextRow";
import CardLabel from "./card/CardLabel";
import LabelTextRow from "./LabelTextRow";
import { META_ICONS } from "../icons/MetaIcon";
import { countryToCurrency } from "../Mapper";
import Stack from "./Stack";
import { InlineRow } from "./InlineRow";
import SendRequestBtn from "./card/SendRequestBtn";

export default function ConfirmRequest({
  trip,
  parcel,
  onClose,
}: {
  trip: Trip;
  parcel: Parcel;
  onClose: () => void;
}) {
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
          {
            "You're requesting this traveler to carry your parcel on their trip."
          }
        </CustomText>
      </div>
      <LineDivider />
      <Stack>
        <CardLabel variant={"trip"} label="Trip" />
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
        <LabelTextRow
          label={"Price per kg : "}
          text={`${countryToCurrency[trip.route.origin]}${trip.route.pricePerKg.toString()}`}
        />
      </Stack>
      <LineDivider />
      <Stack>
        <CardLabel variant={"parcel"} label="Your Parcel" />
        <IconTextRow
          Icon={META_ICONS.parcelBox}
          label={parcel.details.category.join("|")}
        />
        <IconTextRow
          Icon={META_ICONS.scale}
          label={`${parcel.details.weight.toString()} ${"kg"}`}
        />
        <LabelTextRow
          label={"Total price : "}
          text={`${countryToCurrency[parcel.details.location]}${parcel.details.budget.toString()}`}
        />
      </Stack>
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
