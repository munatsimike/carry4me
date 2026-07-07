import type { ParcelListing } from "@/app/features/parcels/domain/Parcel";
import type { CardMode } from "@/types/Ui";
import { ListingCard } from "@/app/components/card/ListingCard";

type ParcelProps = {
  parcel: ParcelListing;
  onClick: (parcel: ParcelListing) => void;
  mode?: CardMode;
  toggleLike: (v: string) => void;
  hideSendRequest?: boolean;
};
export default function ParcelCard({
  parcel,
  onClick,
  toggleLike,
  mode = "display",
  hideSendRequest = false,
}: ParcelProps) {
  return (
    <ListingCard
      toggleLike={toggleLike}
      mode={mode}
      listing={parcel}
      onClick={onClick}
      hideSendRequest={hideSendRequest}
    />
  );
}
