import type { Trip } from "@/types/Ui";
import { Card } from "../../components/card/Card";
import CardLabel from "../../components/card/CardLabel";
import HeartToggle from "@/app/components/HeartToggle";
import { META_ICONS } from "@/app/icons/MetaIcon";
import LineDivider from "@/app/components/LineDivider";
import IconTextRow from "@/app/components/card/IconTextRow";
import LableTextRow from "@/app/components/LabelTextRow";
import User from "@/app/components/card/User";
import WeightAndPrice from "@/app/components/card/WeightAndPrice";
import Stack from "@/app/components/Stack";
import { InlineRow } from "@/app/components/InlineRow";
import SendRequestBtn from "@/app/components/card/SendRequestBtn";

type TravelerProps = {
  trip: Trip;
  onClick: (trip: Trip) => void;
};
export default function TravelerCard({ trip, onClick }: TravelerProps) {
  return (
    <Card>
      <div className="flex justify-between">
        <CardLabel variant={"trip"} label="Trip" />
        <HeartToggle />
      </div>
      <User
        tag={"Traveler"}
        userName={`${trip.user.firstName.charAt(0)}${"."} ${trip.user.lastName}`}
      />
      <LineDivider />
      <Stack>
        <InlineRow>
          <IconTextRow Icon={META_ICONS.planeIcon} label={trip.route.origin} />
          <IconTextRow
            iconSize="xsm"
            Icon={META_ICONS.arrow}
            label={trip.route.destination}
          />
        </InlineRow>

        <IconTextRow
          Icon={META_ICONS.calender}
          label={trip.route.date.toDateString()}
        />
        <LableTextRow
          label={"Accepts : "}
          text={trip.route.acceptedParcels.join("|")}
        />
      </Stack>
      <LineDivider />
      <WeightAndPrice
        weight={trip.route.availableWeight}
        price={trip.route.pricePerKg}
        location={"UK"}
      />
      <LineDivider />
      <SendRequestBtn payLoad={trip} primaryAction={onClick} />
    </Card>
  );
}
