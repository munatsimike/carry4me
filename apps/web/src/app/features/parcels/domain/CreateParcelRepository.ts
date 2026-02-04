import type { CreateParcel } from "./CreateParcel";
import type { Parcel } from "./Parcel";

export interface ParcelRepository {
  createParcel(parcel: CreateParcel): Promise<string>;
  fetchParcel(): Promise<Parcel[]>;
}
