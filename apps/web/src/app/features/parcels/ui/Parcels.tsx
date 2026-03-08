import type { ParcelListing } from "@/app/features/parcels/domain/Parcel";
import ParcelCard from "./ParcelCard";

export type ParcelsProps = {
  parcels: ParcelListing[];
  onClick: (parcel: ParcelListing) => void;
};
export default function Travelers({ parcels, onClick }: ParcelsProps) {
  return (
    <div className="grid grid-col-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {parcels.map((parcel, index) => (
        <ParcelCard key={index} parcel={parcel} onClick={onClick} />
      ))}
    </div>
  );
}
