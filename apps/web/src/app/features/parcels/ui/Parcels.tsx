import MarketplaceListingGrid from "@/app/components/MarketplaceListingGrid";
import type { ParcelListing } from "@/app/features/parcels/domain/Parcel";
import ParcelCard from "./ParcelCard";

export type ParcelsProps = {
  parcels: ParcelListing[];
  onClick: (parcel: ParcelListing) => void;
  toggleLike: (v: string) => void;
};
export default function Travelers({
  parcels,
  onClick,
  toggleLike,
}: ParcelsProps) {
  return (
    <MarketplaceListingGrid>
      {parcels.map((parcel) => (
        <ParcelCard
          toggleLike={toggleLike}
          key={parcel.id}
          parcel={parcel}
          onClick={onClick}
        />
      ))}
    </MarketplaceListingGrid>
  );
}
