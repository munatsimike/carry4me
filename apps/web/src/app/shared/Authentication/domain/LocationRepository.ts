import type { MyLocation } from "./MyLocation";

export interface LocationRepository {
  getLocations(): Promise<MyLocation[]>;
}
