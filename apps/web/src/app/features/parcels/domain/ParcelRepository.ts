import type { CreateParcel } from "./CreateParcel";
import type { ParcelListing } from "./Parcel";
import type { ParcelDto } from "../application/ParcelDto";

export interface ParcelRepository {
  createParcel(parcel: CreateParcel): Promise<string>;
  fetchParcels(userId?: string): Promise<ParcelListing[]>;
  parcelsById(userId: string): Promise<ParcelListing[]>;
  deleteParcel(parcelId: string): Promise<string>;
  editParcel(editParcel: Partial<ParcelDto>): Promise<string>;
}
