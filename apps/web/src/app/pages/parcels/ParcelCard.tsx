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
import type { Parcel } from "@/app/features/parcels/domain/Parcel";

type ParcelProps = {
  parcel: Parcel;
  onClick: (parcel: Parcel) => void;
};
export default function ParcelCard({ parcel, onClick }: ParcelProps) {
  const categories = parcel.categories.map((x) => x.name).join(" - ");
  return (
    <Card>
      <div className="flex justify-between">
        <CardLabel variant={"parcel"} label="Parcel" />
        <HeartToggle />
      </div>
      <User
        tag={"Sender"}
        userName={`${parcel.user.fullName?.charAt(0)}${"."} ${parcel.user.fullName}`}
      />
      <LineDivider />
      <Stack>
        <CategoryRow tag={"sender"} category={categories} />
        <RouteRow
          origin={parcel.route.originCountry}
          destination={parcel.route.destinationCountry}
        />
        <DateRow date={"Not specific"} />
      </Stack>
      <LineDivider />
      <WeightAndPrice
        weightLabel="Weight : "
        weight={parcel.weightKg}
        priceLabel="Budget : "
        price={parcel.budget}
        location={"UK"}
      />
      <LineDivider />
      <SendRequestBtn payLoad={parcel} primaryAction={onClick} />
    </Card>
  );
}
