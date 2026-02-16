import type { Result } from "@/app/shared/Authentication/domain/Result";
import type { Parcel } from "../../parcels/domain/Parcel";
import type { Trip } from "../../trips/domain/Trip";
import { CARRY_REQUEST_STATUSES, ROLES } from "../domain/CreateCarryRequest";
import { toCreateCarryRequestMapper } from "../domain/toCreateCarryRequestMapper";
import type { CreateCarryRequestUseCase } from "./CreateCarryReaquest";

export class SendCarryRequestUseCase {
  createCarryRequest: CreateCarryRequestUseCase;

  constructor(createCarryRequest: CreateCarryRequestUseCase) {
    this.createCarryRequest = createCarryRequest;
  }

  async execute(
    loggedInUserId: string,
    parcel: Parcel,
    trip: Trip,
  ): Promise<Result<string>> {
    const userRole =
      loggedInUserId === parcel.user.id ? ROLES.SENDER : ROLES.TRAVELER;

    return this.createCarryRequest.execute(
      toCreateCarryRequestMapper(
        parcel,
        trip,
        userRole,
        CARRY_REQUEST_STATUSES.PENDING_ACCEPTANCE,
      ),
    );
  }
}
