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
import type { ParcelListing } from "@/app/features/parcels/domain/Parcel";
import type { CardMode } from "@/types/Ui";
import type { GoodsCategory } from "../../goods/domain/GoodsCategory";

type ParcelProps = {
  parcel: ParcelListing;
  onClick: (parcel: ParcelListing) => void;
  mode?: CardMode;
};

export default function ParcelCard({
  parcel,
  onClick,
  mode = "display",
}: ParcelProps) {
  const categories = parcel.goodsCategory.map((x:GoodsCategory) => x.name);
  const isDisplayMode = mode === "display";
  const hoverClass = isDisplayMode ? true : false;
  const borderClass = isDisplayMode ? "border border-neutral-200" : "";
  const ShandowClass = isDisplayMode ? "shadow-md" : "";
  return (
    <Card
      hover={hoverClass}
      borderClass={borderClass}
      shadowClass={ShandowClass}
    >
      <div
        className={`flex justify-between ${isDisplayMode ? "pb-1" : "pb-2"}`}
      >
        <span className="flex flex-col gap-2">
          {!isDisplayMode && (
            <span className="flex justify-center text-sm pb-2 text-neutral-500">
              This is how your parcel will appear to travelers
            </span>
          )}
          <span className="flex justify-between gap-2">
            <CardLabel variant={"parcel"} label="Parcel" />
          </span>
        </span>

        <HeartToggle isActive={isDisplayMode} />
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
        isActive={!isDisplayMode}
        buttonTextVariant="onDark"
        iconColorVariant="onDark"
        buttonVariant="primary"
        payLoad={parcel}
        primaryAction={onClick}
      />
    </Card>
  );
}
