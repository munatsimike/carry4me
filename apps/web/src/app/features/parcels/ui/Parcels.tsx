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
    <div className="grid min-w-0 grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {parcels.map((parcel, index) => (
        <ParcelCard
          toggleLike={toggleLike}
          key={index}
          parcel={parcel}
          onClick={onClick}
        />
      ))}
    </div>
  );
}
