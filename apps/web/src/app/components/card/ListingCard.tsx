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
import { dateFormat, type CardMode } from "@/types/Ui";
import type { GoodsCategory } from "@/app/features/goods/domain/GoodsCategory";
import User from "./User";
import { format } from "date-fns";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { useToast } from "../Toast";
import { useToggleFavouriteMutation } from "@/app/hooks/mutations/useFavouriteMutations";

interface ListingCardProps<T extends Listing> {
  mode?: CardMode;
  listing: T;
  toggleLike: (v: string) => void;
  onClick: (d: T) => void;
}

export function ListingCard<T extends Listing>({
  mode = "display",
  listing,
  onClick,
  toggleLike,
}: ListingCardProps<T>) {
  const goodsCategories = listing.goodsCategory.map(
    (x: GoodsCategory) => x.name,
  );

  const { user } = useAuth();
  const { toast } = useToast();
  const toggleFavourite = useToggleFavouriteMutation();

  const isDisplayMode = mode === "display";
  const isTripListing = listing.type === "trip";
  const borderClass = isTripListing
    ? "border border-primary-200"
    : "border border-purple-200";
  const shadowClass = isDisplayMode ? "shadow-sm hover:shadow-md" : "";

  const handleToggleLike = () => {
    if (!user?.id) {
      toast("Please sign in to save parcels or trips.", {
        variant: "warning",
      });
      return;
    }

    toggleFavourite.mutate(
      {
        userId: user.id,
        listingId: listing.id,
        listingType: listing.type,
      },
      {
        onSuccess: () => toggleLike(listing.id),
      },
    );
  };

  return (
    <Card
      enableHover={isDisplayMode}
      className="group"
      borderClass={borderClass}
      shadowClass={shadowClass}
    >
      <div className="flex min-w-0 justify-between gap-3 pb-1">
        <span className="flex min-w-0 flex-col gap-2">
          {!isDisplayMode && (
            <span className="flex justify-center text-sm pb-2 text-neutral-500">
              {`This is how your ${isTripListing ? "trip" : "parcel"} will appear to ${isTripListing ? "senders" : "travelers"}`}
            </span>
          )}
          <span className="flex justify-between gap-2">
            <CardLabel
              variant={isTripListing ? "trip" : "parcel"}
              label={isTripListing ? "Trip" : "Parcel"}
            />
          </span>
        </span>

        <HeartToggle
          isActive={isDisplayMode}
          isLiked={listing.isLiked}
          onToggleLike={() => {
            handleToggleLike();
          }}
        />
      </div>
      <User
        tag={isTripListing ? "Traveler" : "Sender"}
        userName={`${listing.user.fullName?.charAt(0)}${"."} ${listing.user.fullName.substring(listing.user.fullName.indexOf(" "))}`}
        avatar={listing.user.avatarUrl}
      />
      <LineDivider heightClass="my-2" />
      <Stack>
        <RouteRow
          origin={listing.route.originCountry}
          originCity={listing.route.originCity}
          destination={listing.route.destinationCountry}
        />

        <DateRow
          date={
            listing.type === "trip"
              ? format(new Date(listing.departDate), dateFormat)
              : "Flexible"
          }
        />

        <CategoryRow
          tag={isTripListing ? "traveler" : "sender"}
          category={goodsCategories}
        />
      </Stack>
      <LineDivider heightClass="my-2" />
      <WeightAndPrice
        weightLabel={isTripListing ? "Available space" : "Parcel weight"}
        weight={listing.weightKg}
        priceLabel={isTripListing ? "Price per kg" : "Budget per kg"}
        price={listing.pricePerKg}
        country={listing.route.originCountry}
      />
      <LineDivider heightClass="my-2" />
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
