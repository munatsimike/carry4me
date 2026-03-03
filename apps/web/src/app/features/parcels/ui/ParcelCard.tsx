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
  const categories = parcel.categories.map((x) => x.name);
  return (
    <Card>
      <div className="flex justify-between">
        <CardLabel variant={"parcel"} label="Parcel" />
        <HeartToggle />
      </div>
      <User
        tag={"Sender"}
        userName={`${parcel.user.fullName?.charAt(0)}${"."} ${parcel.user.fullName.substring(parcel.user.fullName.indexOf(" "))}`}
        avatar={parcel.user.avatarUrl}
      />
      <LineDivider />
      <Stack>
        <RouteRow
          origin={parcel.route.originCountry}
          destination={parcel.route.destinationCountry}
        />
        <DateRow date={"Not specific"} />
        <CategoryRow tag={"sender"} category={categories} />
      </Stack>
      <LineDivider />
      <WeightAndPrice
        weightLabel="Weight"
        weight={parcel.weightKg}
        priceLabel="Budget"
        price={parcel.pricePerKg * parcel.weightKg}
        location={"UK"}
      />
      <LineDivider />
      <SendRequestBtn
        buttonTextVariant="onDark"
        iconColorVariant="onDark"
        buttonVariant="primary"
        payLoad={parcel}
        primaryAction={onClick}
      />
    </Card>
  );
}
