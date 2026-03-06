import type { RepoResponse } from "@/app/shared/domain/RepoResponse";
import type { CreateParcel } from "./CreateParcel";
import type { Parcel } from "./Parcel";
import type { ParcelDto } from "../application/ParcelDto";

export interface ParcelRepository {
  createParcel(parcel: CreateParcel): Promise<RepoResponse<string>>;
  fetchParcels(): Promise<RepoResponse<Parcel[]>>;
  fetchParcel(userId: string): Promise<RepoResponse<Parcel>>;
  parcelById(userId: string): Promise<RepoResponse<Parcel[]>>;
  deleteParcel(parcelId: string): Promise<RepoResponse<string>>;
  editParcel(editParcel: Partial<ParcelDto>): Promise<RepoResponse<string>>;
}
