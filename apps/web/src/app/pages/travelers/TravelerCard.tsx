import type { Traveler } from "@/types/Ui";
import { Card } from "../../components/card/Card";
import CardLabel from "../../components/card/CardLabel";
import HeartToggle from "@/app/components/HeartToggle";
import { META_ICONS } from "@/app/icons/MetaIcon";
import LineDivider from "@/app/components/LineDivider";
import IconTextRow from "@/app/components/card/IconTextRow";
import LableTextRow from "@/app/components/LabelTextRow";
import CardFooter from "@/app/components/card/CardFooter";
import User from "@/app/components/card/User";
import WeightAndPrice from "@/app/components/card/WeightAndPrice";

type TravelerProps = {
  traveler: Traveler;
};
export default function TravelerCard({ traveler }: TravelerProps) {
  return (
    <Card>
      <div className="flex justify-between">
        <CardLabel tag={"Trip"} />
        <HeartToggle />
      </div>
      <User
        tag={"Traveler"}
        userName={`${traveler.user.firstName} ${traveler.user.lastName}`}
      />
      <LineDivider />
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <IconTextRow
            Icon={META_ICONS.planeIcon}
            label={traveler.route.origin}
          />
          <IconTextRow
            iconSize="xsm"
            Icon={META_ICONS.arrow}
            label={traveler.route.destination}
          />
        </div>

        <IconTextRow
          Icon={META_ICONS.calender}
          label={traveler.route.date.toDateString()}
        />
        <LableTextRow
          label={"Accepts : "}
          text={traveler.route.acceptedParcels.join("|")}
        />
      </div>
      <LineDivider />
      <WeightAndPrice
        weight={traveler.route.availableWeight}
        price={traveler.route.pricePerKg}
        location={"UK"}
      />
      <LineDivider />
      <CardFooter />
    </Card>
  );
}
