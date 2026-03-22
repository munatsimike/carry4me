import type { RepoResponse } from "@/app/shared/domain/RepoResponse";
import type { CreateParcel } from "./CreateParcel";
import type { ParcelListing } from "./Parcel";
import type { ParcelDto } from "../application/ParcelDto";

export interface ParcelRepository {
  createParcel(parcel: CreateParcel): Promise<RepoResponse<string>>;
  fetchParcels(): Promise<RepoResponse<ParcelListing[]>>;
  parcelsById(userId: string): Promise<RepoResponse<ParcelListing[]>>;
  deleteParcel(parcelId: string): Promise<RepoResponse<string>>;
  editParcel(editParcel: Partial<ParcelDto>): Promise<RepoResponse<string>>;
}
