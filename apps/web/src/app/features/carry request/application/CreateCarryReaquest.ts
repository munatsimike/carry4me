import type { Result } from "@/app/shared/Authentication/domain/Result";
import type { CarryRequestRepository } from "../domain/CarryRequestRepository";
import { CARRY_REQUEST_STATUSES, ROLES } from "../domain/CreateCarryRequest";
import { toCreateCarryRequestMapper } from "../domain/toCreateCarryRequestMapper";
import type { ParcelListing } from "../../parcels/domain/Parcel";
import type { TripListing } from "../../trips/domain/Trip";
import { toResult } from "@/app/shared/Authentication/application/toResultMapper";

export class CreateCarryRequestUseCase {
  repo: CarryRequestRepository;

  constructor(repo: CarryRequestRepository) {
    this.repo = repo;
  }

  async execute(
    loggedInUserId: string,
    parcel: ParcelListing,
    trip: TripListing,
  ): Promise<Result<string>> {
    const userRole =
      loggedInUserId === parcel.user.id ? ROLES.SENDER : ROLES.TRAVELER;
    const result = await this.repo.createCarryRequest(
      toCreateCarryRequestMapper(
        parcel,
        trip,
        userRole,
        CARRY_REQUEST_STATUSES.PENDING_ACCEPTANCE,
      ),
    );
    return toResult(result);
  }
}
