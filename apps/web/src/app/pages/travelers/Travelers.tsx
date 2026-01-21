import type { Trip } from "@/types/Ui";
import TravelerCard from "./TravelerCard";

export type TravlersProps = {
  trips: Trip[];
  onClick: (trip: Trip) => void;
};
export default function Travelers({ trips, onClick }: TravlersProps) {
  return (
    <div className="grid grid-col-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {trips.map((trip, index) => (
        <TravelerCard key={index} trip={trip} onClick={onClick} />
      ))}
    </div>
  );
}
