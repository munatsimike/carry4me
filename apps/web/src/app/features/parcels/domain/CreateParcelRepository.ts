import type { RepoResponse } from "@/app/shared/domain/RepoResponse";
import type { CreateParcel } from "./CreateParcel";
import type { Parcel } from "./Parcel";

export interface ParcelRepository {
  createParcel(parcel: CreateParcel): Promise<RepoResponse<string>>;
  fetchParcels(): Promise<RepoResponse<Parcel[]>>;
  fetchParcel(userId: string): Promise<RepoResponse<Parcel>>;
}
