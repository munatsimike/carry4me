import type { BrowseMarketplaceAction } from "@/app/components/BrowseMarketplaceActions";

export type EmptyStateConfig = {
  title: string;
  body: string;
  actions?: BrowseMarketplaceAction[];
};

export function toEmptyStateForMapper(navTab: string): EmptyStateConfig {
  switch (navTab) {
    case "ongoing":
      return {
        title: "No ongoing requests",
        body: "You have no ongoing requests yet. Browse trips or parcels to get started.",
        actions: [
          { label: "Browse trips", href: "/travelers", tone: "trips" },
          { label: "Browse parcels", href: "/parcels", tone: "parcels" },
        ],
      };

    case "declined":
      return {
        title: "No declined requests",
        body: "You don’t have any declined requests.",
      };

    case "cancelled":
      return {
        title: "No cancelled requests",
        body: "You haven’t cancelled any requests.",
      };

    case "completed":
      return {
        title: "No completed requests",
        body: "You haven’t completed any deliveries yet.",
        actions: [
          { label: "Browse trips", href: "/travelers", tone: "trips" },
          { label: "Browse parcels", href: "/parcels", tone: "parcels" },
        ],
      };

    case "expired":
      return {
        title: "No expired requests",
        body: "Requests that pass the payment window without payment will appear here.",
        actions: [
          { label: "Browse trips", href: "/travelers", tone: "trips" },
          { label: "Browse parcels", href: "/parcels", tone: "parcels" },
        ],
      };

    default:
      return {
        title: "No requests found",
        body: "Requests will appear here once you start interacting with the marketplace.",
      };
  }
}
