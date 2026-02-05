import type { CreateParcel } from "./CreateParcel";
import type { Parcel } from "./Parcel";

export interface ParcelRepository {
  createParcel(parcel: CreateParcel): Promise<string>;
  fetchParcels(): Promise<Parcel[]>;
  fetchParcel(userId: string): Promise<Parcel | null>;
}
