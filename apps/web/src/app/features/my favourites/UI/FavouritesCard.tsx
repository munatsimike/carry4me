import { ListingCard } from "@/app/components/card/ListingCard";
import type { Listing } from "@/app/shared/Authentication/domain/Listing";
type ListingProps = {
  listing: Listing;
  onClick: (parcel: Listing) => void;
  onLikeToggle: (v: string) => void;
};

export default function FavouriteCard({
  listing,
  onClick,
  onLikeToggle,
}: ListingProps) {
  return (
    <ListingCard
      toggleLike={onLikeToggle}
      listing={listing}
      onClick={onClick}
    />
  );
}
