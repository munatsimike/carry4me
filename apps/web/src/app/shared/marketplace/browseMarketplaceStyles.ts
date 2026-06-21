import { cn } from "@/app/lib/cn";

export type BrowseMarketplaceTone = "trips" | "parcels";

/** Light browse surface for trip actions (matches dashboard). */
export const browseTripsSurfaceClass = cn(
  "border border-primary-200 bg-primary-50 shadow-sm",
  "hover:border-primary-300 hover:bg-primary-100 hover:shadow-md",
);

/** Light browse surface for parcel actions (matches dashboard). */
export const browseParcelsSurfaceClass = cn(
  "border border-slate-700/20 bg-slate-700/10 shadow-sm",
  "hover:border-slate-700/30 hover:bg-slate-700/15 hover:shadow-md",
);

export const browseMarketplaceSurfaceClass: Record<
  BrowseMarketplaceTone,
  string
> = {
  trips: browseTripsSurfaceClass,
  parcels: browseParcelsSurfaceClass,
};

export const browseMarketplaceTitleClass: Record<BrowseMarketplaceTone, string> =
  {
    trips: "text-primary-800",
    parcels: "text-slate-700",
  };

export const browseMarketplaceSubtitleClass = "text-slate-600";

export const browseMarketplaceIconClass: Record<BrowseMarketplaceTone, string> =
  {
    trips: "text-primary-600",
    parcels: "text-slate-600",
  };

export const browseMarketplaceArrowClass: Record<BrowseMarketplaceTone, string> =
  {
    trips: "text-primary-500",
    parcels: "text-slate-500",
  };

/** Compact browse buttons in empty states, modals, and lists. */
export const browseMarketplaceButtonClass: Record<BrowseMarketplaceTone, string> =
  {
    trips: cn("w-full whitespace-nowrap hover:ring-0", browseTripsSurfaceClass),
    parcels: cn(
      "w-full whitespace-nowrap hover:ring-0",
      browseParcelsSurfaceClass,
    ),
  };

/** Listing card hover: `1` = tinted fill, `2` = outline ring + lift (white bg). */
export const LISTING_CARD_HOVER_STYLE = 1 as 1 | 2;

const listingCardTransition =
  "transition-[background-color,border-color,box-shadow,ring-color] duration-200 ease-out";

/** Parcel card hover: lighter than browse button (/15), still visible on white. */
const listingCardParcelHoverClass =
  "hover:border-slate-700/28 hover:bg-slate-700/10 hover:shadow-md hover:shadow-slate-200/50";

const listingCardHoverTinted: Record<BrowseMarketplaceTone, string> = {
  trips: cn(
    "border border-primary-200 bg-white shadow-sm",
    listingCardTransition,
    "hover:border-primary-300 hover:bg-primary-100 hover:shadow-md hover:shadow-primary-100/40",
  ),
  parcels: cn(
    "border border-slate-700/20 bg-white shadow-sm",
    listingCardTransition,
    listingCardParcelHoverClass,
  ),
};

const listingCardHoverOutline: Record<BrowseMarketplaceTone, string> = {
  trips: cn(
    "border border-primary-200 bg-white shadow-sm ring-0 ring-offset-0",
    listingCardTransition,
    "hover:border-primary-400 hover:shadow-xl hover:shadow-primary-900/5",
    "hover:ring-2 hover:ring-primary-200/90 hover:ring-offset-2",
  ),
  parcels: cn(
    "border border-[#334155]/20 bg-white shadow-sm ring-0 ring-offset-0",
    listingCardTransition,
    "hover:border-[#334155]/45 hover:shadow-xl hover:shadow-slate-900/5",
    "hover:ring-2 hover:ring-slate-300/90 hover:ring-offset-2",
  ),
};

/** Marketplace listing cards (trips / parcels browse grids). */
export const listingCardHoverClass: Record<BrowseMarketplaceTone, string> =
  LISTING_CARD_HOVER_STYLE === 2
    ? listingCardHoverOutline
    : listingCardHoverTinted;

export const listingCardPreviewClass: Record<BrowseMarketplaceTone, string> = {
  trips: "border border-primary-200 bg-white",
  parcels: "border border-slate-700/20 bg-white",
};

const listingCardDividerHoverTinted: Record<BrowseMarketplaceTone, string> = {
  trips: "transition-colors duration-200 group-hover/card:border-primary-200",
  parcels:
    "transition-colors duration-200 group-hover/card:border-slate-700/25",
};

const listingCardDividerHoverOutline: Record<BrowseMarketplaceTone, string> = {
  trips: "transition-colors duration-200 group-hover/card:border-primary-100",
  parcels: "transition-colors duration-200 group-hover/card:border-slate-200",
};

export const listingCardDividerHoverClass: Record<
  BrowseMarketplaceTone,
  string
> =
  LISTING_CARD_HOVER_STYLE === 2
    ? listingCardDividerHoverOutline
    : listingCardDividerHoverTinted;

export const browseMarketplaceTextClass = browseMarketplaceTitleClass;
