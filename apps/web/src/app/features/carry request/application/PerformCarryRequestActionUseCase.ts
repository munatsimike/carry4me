import type { Result } from "@/app/shared/Authentication/domain/Result";
import type { PerformActionRepository } from "../domain/PerformActionRepository";
import { type UIActionKey } from "../ui/ActionsMapper";
import type { SupabaseCarryRequestRepository } from "../data/SupabaseCarryRequestRepository";
import { toResult } from "@/app/shared/Authentication/application/toResultMapper";
import type { SupabaseTripsRepository } from "../../trips/data/SupabaseTripsRepository";
import type { SupabaseParcelRepository } from "../../parcels/data/SupabaseParcelRepository";

export class PerformCarryRequestActionUseCase {
  performActionRepo: PerformActionRepository;
  carryRequestRepo: SupabaseCarryRequestRepository;
  tripRepo: SupabaseTripsRepository;
  parcelRepo: SupabaseParcelRepository;

  constructor(
    carryRequestRepo: SupabaseCarryRequestRepository,
    performActionRepo: PerformActionRepository,
    tripRepo: SupabaseTripsRepository,
    parcelRepo: SupabaseParcelRepository,
  ) {
    this.performActionRepo = performActionRepo;
    this.carryRequestRepo = carryRequestRepo;
    this.tripRepo = tripRepo;
    this.parcelRepo = parcelRepo;
  }

  async execute(action: UIActionKey, carryRequestId: string) {
    const result = await this.performActionRepo.performAction(
      action,
      carryRequestId,
    );

    return result;
  }

  async isExpired(requestId: string): Promise<Result<boolean>> {
    const result = await this.carryRequestRepo.isExpired(requestId);
    return toResult(result);
  }

  async isSpaceAvailable(
    tripId: string,
    requiredSpac: number,
  ): Promise<Result<boolean>> {
    const result = await this.tripRepo.availableSpace(tripId, requiredSpac);
    return toResult(result);
  }

  async isParcelAvailable(parcelId: string): Promise<Result<boolean>> {
    const result = await this.parcelRepo.isParcelOpen(parcelId);

    return toResult(result);
  }

  async reserveWeight(
    tripId: string,
    parcelWeight: number,
  ): Promise<Result<string>> {
    const result = await this.tripRepo.reserveWeight(tripId, parcelWeight);
    return toResult(result);
  }
}
