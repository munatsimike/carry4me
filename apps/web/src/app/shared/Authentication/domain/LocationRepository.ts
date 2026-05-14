import type { RepoResponse } from "../../domain/RepoResponse";

import type { MyLocation } from "./MyLocation";

export interface LocationRepository {
  getLocations(): Promise<RepoResponse<MyLocation[]>>;

}