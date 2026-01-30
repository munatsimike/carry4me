import { Card } from "../../../components/card/Card";
import CardLabel from "../../../components/card/CardLabel";
import HeartToggle from "@/app/components/HeartToggle";
import LineDivider from "@/app/components/LineDivider";
import User from "@/app/components/card/User";
import { WeightAndPrice } from "@/app/components/card/WeightAndPrice";
import Stack from "@/app/components/Stack";
import SendRequestBtn from "@/app/components/card/SendRequestBtn";
import RouteRow from "@/app/components/RouteRow";
import CategoryRow from "@/app/components/CategoryRow";
import DateRow from "@/app/components/DateRow";
import SpaceBetweenRow from "@/app/components/SpaceBetweenRow";
import type { Trip } from "../domain/Trip";

type TravelerProps = {
  trip: Trip;
  onClick: (trip: Trip) => void;
};

export default function TravelerCard({ trip, onClick }: TravelerProps) {
  const goods = trip.acceptedGoods.map((c) => c.name).join(" ");
  return (
    <Card>
      <SpaceBetweenRow>
        <CardLabel variant={"trip"} label="Trip" />
        <HeartToggle />
      </SpaceBetweenRow>
      <User
        tag={"Traveler"}
        userName={`${trip.user.fullName?.charAt(0)}${"."} ${trip.user.fullName?.split(" ")[1]}`}
      />
      <LineDivider />
      <Stack>
        <RouteRow
          origin={trip.route.originCountry}
          destination={trip.route.destinationCountry}
        />
        <DateRow date={trip.departDate} />

        <CategoryRow category={goods} />
      </Stack>
      <LineDivider />
      <WeightAndPrice
        weight={trip.capacityKg}
        price={trip.pricePerKg}
        location={"UK"}
      />
      <LineDivider />
      <SendRequestBtn payLoad={trip} primaryAction={onClick} />
    </Card>
  );
}
