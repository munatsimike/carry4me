import type { CarryRequestRepository } from "../domain/CarryRequestRepository";
import { CARRY_REQUEST_STATUSES, ROLES } from "../domain/CreateCarryRequest";
import { toCreateCarryRequestMapper } from "../domain/toCreateCarryRequestMapper";
import type { ParcelListing } from "../../parcels/domain/Parcel";
import type { TripListing } from "../../trips/domain/Trip";

export class CreateCarryRequestUseCase {
  repo: CarryRequestRepository;

  constructor(repo: CarryRequestRepository) {
    this.repo = repo;
  }

  async execute(
    loggedInUserId: string,
    parcel: ParcelListing,
    trip: TripListing,
  ): Promise<string> {
    const userRole =
      loggedInUserId === parcel.user.id ? ROLES.SENDER : ROLES.TRAVELER;
    return await this.repo.createCarryRequest(
      toCreateCarryRequestMapper(
        parcel,
        trip,
        userRole,
        CARRY_REQUEST_STATUSES.PENDING_ACCEPTANCE,
      ),
    );
  }
}
