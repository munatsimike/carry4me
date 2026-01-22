import { Card } from "@/app/components/card/Card";
import CardLabel from "@/app/components/card/CardLabel";
import SendRequestBtn from "@/app/components/card/SendRequestBtn";
import User from "@/app/components/card/User";
import { WeightAndPrice } from "@/app/components/card/WeightAndPrice";
import CategoryRow from "@/app/components/CategoryRow";
import DateRow from "@/app/components/DateRow";
import HeartToggle from "@/app/components/HeartToggle";
import LineDivider from "@/app/components/LineDivider";
import RouteRow from "@/app/components/RouteRow";
import Stack from "@/app/components/Stack";
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
        <CategoryRow tag={"sender"} category={parcel.details.category} />
        <RouteRow
          origin={parcel.details.origin}
          destination={parcel.details.destination}
        />
        <DateRow date={"Not specific"} />
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
