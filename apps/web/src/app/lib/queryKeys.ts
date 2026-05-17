export const queryKeys = {
  locations: {
    all: ["locations"] as const,
  },
  trips: {
    all: ["trips"] as const,
    list: (userId?: string) =>
      [...queryKeys.trips.all, "list", userId ?? "guest"] as const,
    browse: (userId: string | undefined, params: unknown) =>
      [...queryKeys.trips.all, "browse", userId ?? "guest", params] as const,
    mine: (userId: string) => [...queryKeys.trips.all, "mine", userId] as const,
    byUser: (userId: string) =>
      [...queryKeys.trips.all, "byUser", userId] as const,
  },
  parcels: {
    all: ["parcels"] as const,
    list: (userId?: string) =>
      [...queryKeys.parcels.all, "list", userId ?? "guest"] as const,
    browse: (userId: string | undefined, params: unknown) =>
      [...queryKeys.parcels.all, "browse", userId ?? "guest", params] as const,
    mine: (userId: string) =>
      [...queryKeys.parcels.all, "mine", userId] as const,
    byUser: (userId: string) =>
      [...queryKeys.parcels.all, "byUser", userId] as const,
  },
  carryRequests: {
    all: ["carryRequests"] as const,
    list: (userId: string) =>
      [...queryKeys.carryRequests.all, "list", userId] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (userId: string) =>
      [...queryKeys.notifications.all, "list", userId] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    detail: (userId: string) =>
      [...queryKeys.dashboard.all, "detail", userId] as const,
  },
  goods: {
    all: ["goods"] as const,
    categories: ["goods", "categories"] as const,
  },
  favourites: {
    all: ["favourites"] as const,
    list: (userId: string) =>
      [...queryKeys.favourites.all, "list", userId] as const,
  },
} as const;
