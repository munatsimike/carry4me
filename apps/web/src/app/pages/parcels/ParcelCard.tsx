import { Card } from "@/app/components/card/Card";
import CardLabel from "@/app/components/card/CardLabel";
import IconTextRow from "@/app/components/card/IconTextRow";
import SendRequestBtn from "@/app/components/card/SendRequestBtn";
import User from "@/app/components/card/User";
import {WeightAndPrice} from "@/app/components/card/WeightAndPrice";
import HeartToggle from "@/app/components/HeartToggle";
import { InlineRow } from "@/app/components/InlineRow";
import LineDivider from "@/app/components/LineDivider";
import Stack from "@/app/components/Stack";
import { META_ICONS } from "@/app/icons/MetaIcon";
import type { Parcel } from "@/types/Ui";

type ParcelProps = {
  parcel: Parcel;
  onClick: (parcel: Parcel) => void;
};
export default function ParcelCard({ parcel, onClick }: ParcelProps) {
  return (
    <Card>
      <div className="flex justify-between">
        <CardLabel variant={"parcel"} label="Parcel" />
        <HeartToggle />
      </div>
      <User
        tag={"Sender"}
        userName={`${parcel.user.firstName.charAt(0)}${"."} ${parcel.user.lastName}`}
      />
      <LineDivider />
      <Stack>
        <IconTextRow
          Icon={META_ICONS.parcelBox}
          label={parcel.details.category.join("|")}
        />
        <InlineRow>
          <IconTextRow
            Icon={META_ICONS.planeIcon}
            label={parcel.details.origin}
          />
          <IconTextRow
            iconSize="xsm"
            Icon={META_ICONS.arrow}
            label={parcel.details.destination}
          />
        </InlineRow>
        <IconTextRow
          Icon={META_ICONS.calender}
          label={
            parcel.details.date
              ? parcel.details.date.toDateString()
              : "Not specific"
          }
        />
      </Stack>
      <LineDivider />
      <WeightAndPrice
        weightLabel="Weight : "
        weight={parcel.details.weight}
        priceLabel="Budget : "
        price={parcel.details.pricePerKg}
        location={"UK"}
      />
      <LineDivider />
      <SendRequestBtn
        payLoad={parcel}
        primaryAction={onClick}
        variant="primary"
      />
    </Card>
  );
}
