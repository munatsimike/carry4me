import type { Traveler } from "@/types/Ui";
import TravelerCard from "./TravelerCard";

export type TravlersProps = {
  travelers: Traveler[];
};
export default function Travelers({ travelers }: TravlersProps) {
  return (
    <div className="grid grid-col-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {travelers.map((traveler) => (
        <TravelerCard traveler={traveler} />
      ))}
    </div>
  );
}
