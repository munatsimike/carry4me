import type { BrowseMarketplaceAction } from "@/app/components/BrowseMarketplaceActions";

export type FavouritesEmptyStateConfig = {
  title: string;
  body: string;
  actions?: BrowseMarketplaceAction[];
};

type FavouritesEmptyStateParams = {
  selectedTab: import("../domain/types").MyFavTabs;
  hasFilter: boolean;
  isSearchActive: boolean;
  hasAnyFavourites: boolean;
};

export function toFavouritesEmptyState({
  selectedTab,
  hasFilter,
  isSearchActive,
  hasAnyFavourites,
}: FavouritesEmptyStateParams): FavouritesEmptyStateConfig {
  if (!hasAnyFavourites) {
    return {
      title: "No favourites yet",
      body: "Save trips and parcels you like by tapping the heart icon. They'll show up here for easy access.",
      actions: [
        { label: "Browse trips", href: "/travelers", tone: "trips" },
        { label: "Browse parcels", href: "/parcels", tone: "parcels" },
      ],
    };
  }

  if (hasFilter || isSearchActive) {
    return {
      title: "No matching favourites",
      body: "Try adjusting your search or filters to find more saved listings.",
    };
  }

  if (selectedTab === "trip") {
    return {
      title: "No saved trips",
      body: "You haven't saved any trips yet. Browse travelers and tap the heart to save one.",
      actions: [{ label: "Browse trips", href: "/travelers", tone: "trips" }],
    };
  }

  return {
    title: "No saved parcels",
    body: "You haven't saved any parcels yet. Browse parcels and tap the heart to save one.",
    actions: [{ label: "Browse parcels", href: "/parcels", tone: "parcels" }],
  };
}
