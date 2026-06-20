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

export const browseMarketplaceTextClass = browseMarketplaceTitleClass;
