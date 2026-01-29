import type { TestUITrip } from "@/types/Ui";
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

type TravelerProps = {
  trip: TestUITrip;
  onClick: (trip: TestUITrip) => void;
};
export default function TravelerCard({ trip, onClick }: TravelerProps) {
  return (
    <Card>
      <SpaceBetweenRow>
        <CardLabel variant={"trip"} label="Trip" />
        <HeartToggle />
      </SpaceBetweenRow>
      <User
        tag={"Traveler"}
        userName={`${trip.user.firstName.charAt(0)}${"."} ${trip.user.lastName}`}
      />
      <LineDivider />
      <Stack>
        <RouteRow
          origin={trip.route.origin}
          destination={trip.route.destination}
        />
        <DateRow date={trip.route.date.toDateString()} />
        <CategoryRow category={trip.route.acceptedParcels} />
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
