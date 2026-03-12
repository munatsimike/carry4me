import type { Listing } from "@/app/shared/Authentication/domain/Listing";
import { Card } from "./Card";
import CardLabel from "./CardLabel";
import HeartToggle from "../HeartToggle";
import LineDivider from "../LineDivider";
import RouteRow from "../RouteRow";
import Stack from "../Stack";
import DateRow from "../DateRow";
import { WeightAndPrice } from "./WeightAndPrice";
import CategoryRow from "../CategoryRow";
import SendRequestBtn from "./SendRequestBtn";
import type { CardMode } from "@/types/Ui";
import type { GoodsCategory } from "@/app/features/goods/domain/GoodsCategory";
import User from "./User";

interface ListingCardProps<T extends Listing> {
  mode?: CardMode;
  listing: T;
  onClick: (d: T) => void;
}

export function ListingCard<T extends Listing>({
  mode = "display",
  listing,
  onClick,
}: ListingCardProps<T>) {
  const goodsCategories = listing.goodsCategory.map(
    (x: GoodsCategory) => x.name,
  );

  const isDisplayMode = mode === "display";
  const borderClass = isDisplayMode ? "border border-neutral-200" : "";
  const shadowClass = isDisplayMode ? "shadow-md hover:shadow-lg" : "";
  const isTripListing = listing.type === "trip";

  return (
    <Card
      hover={isDisplayMode}
      borderClass={borderClass}
      shadowClass={shadowClass}
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
            <CardLabel
              variant={isTripListing ? "trip" : "parcel"}
              label={isTripListing ? "Trip" : "Parcel"}
            />
          </span>
        </span>

        <HeartToggle isActive={isDisplayMode} />
      </div>
      <User
        tag={isTripListing ? "Traveler" : "Sender"}
        userName={`${listing.user.fullName?.charAt(0)}${"."} ${listing.user.fullName.substring(listing.user.fullName.indexOf(" "))}`}
        avatar={listing.user.avatarUrl}
      />
      <LineDivider />
      <Stack>
        <RouteRow
          origin={listing.route.originCountry}
          destination={listing.route.destinationCountry}
        />
        <DateRow date={"Not specific"} />
        <CategoryRow
          tag={isTripListing ? "traveler" : "sender"}
          category={goodsCategories}
        />
      </Stack>
      <LineDivider />
      <WeightAndPrice
        weightLabel={isTripListing ? "Available space" : "Weight"}
        weight={listing.weightKg}
        priceLabel={isTripListing ? "Price" : "Budget"}
        price={listing.pricePerKg * listing.weightKg}
        location={"UK"}
      />
      <LineDivider />
      <SendRequestBtn
        isActive={!isDisplayMode}
        buttonTextVariant="onDark"
        iconColorVariant="onDark"
        buttonVariant="primary"
        payLoad={listing}
        primaryAction={onClick}
       listingType={listing.type}
      />
    </Card>
  );
}
