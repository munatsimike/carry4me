import type { Listing } from "@/app/shared/Authentication/domain/Listing";

import FavouriteCard from "./FavouritesCard";

export type FavouriteProps = {
  listings: Listing[];
  onClick: (favourite: Listing) => void;
  toggleLike: (v:string)=>void;
};
export default function FavouritesList({
  listings,
  onClick,
  toggleLike,
}: FavouriteProps) {
  return (
    <div className="grid grid-col-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
      {listings.map((listing, index) => (
        <FavouriteCard
          key={index}
          listing={listing}
          onClick={onClick}
          onLikeToggle={toggleLike}
        />
      ))}
    </div>
  );
}
