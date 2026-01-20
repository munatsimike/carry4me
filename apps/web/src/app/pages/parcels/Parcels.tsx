import type { Parcel } from "@/types/Ui";
import ParcelCard from "./ParcelCard";

export type ParcelsProps = {
  parcels: Parcel[];
  onClick: (parcel: Parcel) => void;
};
export default function Travelers({ parcels, onClick }: ParcelsProps) {
  return (
    <div className="grid grid-col-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {parcels.map((parcel) => (
        <ParcelCard parcel={parcel} onClick={onClick} />
      ))}
    </div>
  );
}
