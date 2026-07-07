import type { Listing } from "@/app/shared/Authentication/domain/Listing";
import { Card } from "./Card";
import CardLabel from "./CardLabel";
import HeartToggle from "../HeartToggle";
import LineDivider from "../LineDivider";
import RouteRow from "../RouteRow";
import Stack from "../Stack";
import DateRow from "../DateRow";
import ParcelSendingRow from "@/app/features/parcels/ui/ParcelSendingRow";
import { WeightAndPrice } from "./WeightAndPrice";
import CategoryRow from "../CategoryRow";
import SendRequestBtn from "./SendRequestBtn";
import { dateFormat, type CardMode } from "@/types/Ui";
import type { GoodsCategory } from "@/app/features/goods/domain/GoodsCategory";
import { formatTripAcceptedCategoryLabels } from "@/app/features/goods/domain/goodsCategoryConstants";
import User from "./User";
import { format } from "date-fns";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { useToast } from "../Toast";
import { useToggleFavouriteMutation } from "@/app/hooks/mutations/useFavouriteMutations";
import {
  listingCardDividerHoverClass,
  listingCardHoverClass,
  listingCardPreviewClass,
  type BrowseMarketplaceTone,
} from "@/app/shared/marketplace/browseMarketplaceStyles";

function formatListingCardUserName(fullName: string | null | undefined): string {
  if (!fullName?.trim()) return "";

  const parts = fullName.trim().split(/\s+/);
  const firstInitial = parts[0].charAt(0).toUpperCase();

  if (parts.length === 1) {
    return `${firstInitial}.`;
  }

  const surname = parts.slice(1).join(" ");
  return `${firstInitial}. ${surname}`;
}

interface ListingCardProps<T extends Listing> {
  mode?: CardMode;
  listing: T;
  toggleLike: (v: string) => void;
  onClick: (d: T) => void;
  hideSendRequest?: boolean;
}

export function ListingCard<T extends Listing>({
  mode = "display",
  listing,
  onClick,
  toggleLike,
  hideSendRequest = false,
}: ListingCardProps<T>) {
  const { user } = useAuth();
  const { toast } = useToast();
  const toggleFavourite = useToggleFavouriteMutation();

  const isDisplayMode = mode === "display";
  const showMarketplaceActions = isDisplayMode && !hideSendRequest;
  const isTripListing = listing.type === "trip";
  const cardTone: BrowseMarketplaceTone = isTripListing ? "trips" : "parcels";
  const goodsCategories = isTripListing
    ? formatTripAcceptedCategoryLabels(listing.goodsCategory)
    : listing.goodsCategory.map((x: GoodsCategory) => x.name);
  const cardSurfaceClass = isDisplayMode
    ? listingCardHoverClass[cardTone]
    : listingCardPreviewClass[cardTone];
  const dividerHoverClass = isDisplayMode
    ? listingCardDividerHoverClass[cardTone]
    : "";

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
      sizeClass="max-w-none"
      className={`group/card ${cardSurfaceClass}`}
      borderClass=""
      shadowClass=""
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
          isActive={showMarketplaceActions}
          isLiked={listing.isLiked}
          onToggleLike={() => {
            handleToggleLike();
          }}
        />
      </div>
      <User
        tag={isTripListing ? "Traveler" : "Sender"}
        userName={formatListingCardUserName(listing.user.fullName)}
        avatar={listing.user.avatarUrl}
      />
      <LineDivider heightClass="my-2" className={dividerHoverClass} />
      <Stack>
        <RouteRow
          origin={listing.route.originCountry}
          originCity={listing.route.originCity}
          destination={listing.route.destinationCountry}
        />

        <CategoryRow
          tag={isTripListing ? "traveler" : "sender"}
          category={goodsCategories}
        />

        {isTripListing ? (
          <DateRow
            date={format(new Date(listing.departDate), dateFormat)}
          />
        ) : (
          <ParcelSendingRow items={listing.items} />
        )}
      </Stack>
      <LineDivider heightClass="my-2" className={dividerHoverClass} />
      <WeightAndPrice
        weightLabel={isTripListing ? "Available space" : "Parcel weight"}
        weight={listing.weightKg}
        priceLabel={isTripListing ? "Price per kg" : "Budget per kg"}
        price={listing.pricePerKg}
        country={listing.route.originCountry}
      />
      {showMarketplaceActions ? (
        <>
          <LineDivider heightClass="my-2" className={dividerHoverClass} />
          <SendRequestBtn
            isActive={!isDisplayMode}
            buttonTextVariant="onDark"
            buttonVariant="primary"
            payLoad={listing}
            primaryAction={onClick}
            listingType={listing.type}
          />
        </>
      ) : null}
    </Card>
  );
}
