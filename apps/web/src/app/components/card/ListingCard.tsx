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
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import { namedCall } from "@/app/shared/Authentication/application/NamedCall";
import { SupabaseFavouriteRepository } from "@/app/features/my favourites/data/SupabaseFavouriteRepository";
import { useEffect, useMemo, useState } from "react";
import { UpadateFavouriteUseCase } from "@/app/features/my favourites/application/UpdateFavouriteUseCase";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { useToast } from "../Toast";

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

  const favouritesRepo = useMemo(() => new SupabaseFavouriteRepository(), []);

  const updateFavUseCase = useMemo(
    () => new UpadateFavouriteUseCase(favouritesRepo),
    [favouritesRepo],
  );
  const { user } = useAuth();

  const { showSupabaseError } = useUniversalModal();
  const isDisplayMode = mode === "display";
  const borderClass = isDisplayMode ? "border border-neutral-200" : "";
  const shadowClass = isDisplayMode ? "shadow-sm hover:shadow-md" : "";
  const isTripListing = listing.type === "trip";
  const [updateFav, setUpdate] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!updateFav) return;
    async function onToggleLike() {
      if (!user?.id) {
        toast("You need to login to like parcels or trips.", {
          variant: "warning",
        });
        return;
      }
      const { result } = await namedCall(
        "onLIke",
        updateFavUseCase.execute({
          userId: user.id,
          listingId: listing.id,
          listingType: listing.type,
        }),
      );

      if (!result.success) {
        showSupabaseError(result.error);
        return;
      }
      toggleLike(listing.id);
      setUpdate(false);
    }
    onToggleLike();
  }, [updateFav]);

  return (
    <Card
      enableHover={isDisplayMode}
      borderClass={borderClass}
      shadowClass={shadowClass}
    >
      <div
        className={`flex justify-between ${isDisplayMode ? "pb-1" : "pb-2"}`}
      >
        <span className="flex flex-col gap-2">
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
            setUpdate(true);
          }}
        />
      </div>
      <User
        tag={isTripListing ? "Traveler" : "Sender"}
        userName={`${listing.user.fullName?.charAt(0)}${"."} ${listing.user.fullName.substring(listing.user.fullName.indexOf(" "))}`}
        avatar={listing.user.avatarUrl}
      />
      <LineDivider heightClass="my-3" />
      <Stack>
        <RouteRow
          origin={listing.route.originCountry}
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
      <LineDivider heightClass="my-3" />
      <WeightAndPrice
        weightLabel={isTripListing ? "Available space" : "Parcel Weight"}
        weight={listing.weightKg}
        priceLabel={isTripListing ? "Price/kg" : "Budget/kg"}
        price={listing.pricePerKg}
        location={"UK"}
      />
      <LineDivider heightClass="my-3" />
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
