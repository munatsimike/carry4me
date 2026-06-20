import type { CreateParcel } from "./CreateParcel";
import type { ParcelListing } from "./Parcel";
import type { ParcelDto } from "../application/ParcelDto";
import type { ListingPageParams, PaginatedResult } from "@/types/Pagination";

export interface ParcelRepository {
  createParcel(parcel: CreateParcel): Promise<string>;
  fetchParcels(
    userId?: string,
    params?: ListingPageParams,
  ): Promise<ParcelListing[] | PaginatedResult<ParcelListing>>;
  parcelsById(userId: string, parcelId?: string): Promise<ParcelListing[]>;
  /** OPEN parcels only — for send-request / match selection. */
  parcelsForMatching(userId: string): Promise<ParcelListing[]>;
  deleteParcel(parcelId: string): Promise<string>;
  editParcel(editParcel: Partial<ParcelDto>): Promise<string>;
  setParcelListingActive(parcelId: string, active: boolean): Promise<string>;
}
