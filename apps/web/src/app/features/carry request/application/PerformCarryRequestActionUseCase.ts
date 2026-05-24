import type { PerformActionRepository } from "../domain/PerformActionRepository";
import { type UIActionKey } from "../ui/ActionsMapper";
import type { SupabaseCarryRequestRepository } from "../data/SupabaseCarryRequestRepository";
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
    return await this.performActionRepo.performAction(action, carryRequestId);
  }

  async isPaymentExpired(requestId: string): Promise<boolean> {
    return await this.carryRequestRepo.isPaymentExpired(requestId);
  }

  async isSpaceAvailable(
    tripId: string,
    requiredSpac: number,
  ): Promise<boolean> {
    return await this.tripRepo.availableSpace(tripId, requiredSpac);
  }

  async isParcelAvailable(parcelId: string): Promise<boolean> {
    return await this.parcelRepo.isParcelOpen(parcelId);
  }

  async reserveWeight(tripId: string, parcelWeight: number): Promise<string> {
    return await this.tripRepo.reserveWeight(tripId, parcelWeight);
  }
}
