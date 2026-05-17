import type { ParcelListing } from "../domain/Parcel";
import type { ParcelRepository } from "../domain/ParcelRepository";
import type { ListingPageParams, PaginatedResult } from "@/types/Pagination";

export class GetParcelsUseCase {
  repo: ParcelRepository;

  constructor(repo: ParcelRepository) {
    this.repo = repo;
  }

  async execute(userId?: string): Promise<ParcelListing[]> {
    return (await this.repo.fetchParcels(userId)) as ParcelListing[];
  }

  async executePaged(
    userId: string | undefined,
    params: ListingPageParams,
  ): Promise<PaginatedResult<ParcelListing>> {
    return (await this.repo.fetchParcels(
      userId,
      params,
    )) as PaginatedResult<ParcelListing>;
  }
}
