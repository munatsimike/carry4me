export type EmptyStateConfig = {
  title: string;
  body: string;
  actions?: {
    label: string;
    href: string;
    variant: "primary" | "secondary";
  }[];
};

export function toEmptyStateForMapper(navTab: string): EmptyStateConfig {
  switch (navTab) {
    case "ongoing":
      return {
        title: "No ongoing requests",
        body: "You have no ongoing requests yet. Start by browsing parcels or trips to connect with other users.",
        actions: [
          {
            label: "Browse Trips",
            href: "/travelers",
            variant: "secondary",
          },
          {
            label: "Browse Parcels",
            href: "/parcels",
            variant: "primary",
          },
        ]
      };

    case "declined":
      return {
        title: "No declined requests",
        body: "You don't have any declined requests.",
      };

    case "cancelled":
      return {
        title: "No cancelled requests",
        body: "You haven't cancelled any requests.",
      };

    case "completed":
      return {
        title: "No completed requests",
        body: "You haven't completed any deliveries yet.",
        actions: [
          {
            label: "Browse Trips",
            href: "/travelers",
            variant: "secondary",
          },
          {
            label: "Browse Parcels",
            href: "/parcels",
            variant: "primary",
          },
        ]
      };

    default:
      return {
        title: "No requests found",
        body: "Requests will appear here once you start interacting with the marketplace.",
      };
  }
}
