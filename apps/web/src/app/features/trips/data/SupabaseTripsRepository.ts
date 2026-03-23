import { supabase } from "@/app/shared/supabase/client";
import type { TripsRepository } from "../domain/TripRepository";
import type { CreateTripListing } from "../domain/CreateTrip";
import { TRIPSTATUSES, type TripListing } from "../domain/Trip";
import { mapTripRowToTrip } from "../domain/tripmappers";
import type { RepoResponse } from "@/app/shared/domain/RepoResponse";
import {
  deleteById,
  getFavListingIds,
} from "@/app/shared/Authentication/domain/SupabaseHelper";
import type { TripDto } from "../application/TripDto";

export class SupabaseTripsRepository implements TripsRepository {
  async editTrip(editTrip: Partial<TripDto>): Promise<RepoResponse<string>> {
    const { data, error, status } = await supabase
      .from("trips")
      .update(editTrip)
      .eq("id", editTrip.id)
      .select("id")
      .single();

    if (error)
      return {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          status: status,
        },
      };
    return { data: data.id, error: null };
  }

  async deleteTrip(parcelId: string): Promise<RepoResponse<string>> {
    return deleteById(parcelId, "trips");
  }
  async tripsById(userId: string): Promise<RepoResponse<TripListing[]>> {
    return this.listTrips(userId, true);
  }

  async reserveWeight(
    tripId: string,
    parcelWeight: number,
  ): Promise<RepoResponse<string>> {
    const {
      data: trip,
      error: fetchError,
      status: fetchStatus,
    } = await supabase
      .from("trips")
      .select("reserved_weight_kg")
      .eq("id", tripId)
      .single();

    if (fetchError)
      return {
        data: null,
        error: {
          code: fetchError.code,
          message: fetchError.message,
          status: fetchStatus,
        },
      };

    const currentReservedWeight = trip.reserved_weight_kg ?? 0;
    const newReservedWeight = currentReservedWeight + parcelWeight;

    const { data, error, status } = await supabase
      .from("trips")
      .update({ reserved_weight_kg: newReservedWeight })
      .eq("id", tripId)
      .select("id")
      .single();

    if (error)
      return {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          status: status,
        },
      };

    return { data: data.id, error: null };
  }

  async availableSpace(
    tripId: string,
    parcelWeight: number,
  ): Promise<RepoResponse<boolean>> {
    const { data, status, error } = await supabase.rpc(
      "trip_has_available_capacity",
      {
        p_trip_id: tripId,
        p_required_weight: parcelWeight,
      },
    );
    if (error)
      return {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          status: status,
        },
      };
    return { data, error: null };
  }

  async listTrips(
    userId?: string,
    shouldFilter: boolean = false,
  ): Promise<RepoResponse<TripListing[]>> {
    let query = supabase.from("trips").select(`
      *,
      traveler:profiles(id, full_name, avatar_url),
      trip_accepted_categories(
        category:goods_categories(
          id,
          slug,
          name
        )
      )
    `);

    if (shouldFilter && userId) {
      query.eq("traveler_user_id", userId);
    }
    query.eq("status", TRIPSTATUSES.ACTIVE);

    const { data, error, status } = await query;

     if(error)  return {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          status: status,
        },
      };
      
    const favTripIds = await getFavListingIds(userId ?? "", "trip_id");
    const favTripIdSet = new Set(favTripIds ?? []);
    const result = data.map((row) => mapTripRowToTrip(row, favTripIdSet));
    return { data: result, error: null };
  }

  async createTrip(
    userId: string,
    input: CreateTripListing,
  ): Promise<RepoResponse<string>> {
    const { data, error, status } = await supabase
      .from("trips")
      .insert({
        traveler_user_id: userId,
        origin_country: input.originCountry,
        origin_city: input.originCity,
        destination_country: input.destinationCountry,
        destination_city: input.destinationCity,
        depart_date: input.departureDate,
        arrive_date: input.arrivalDate ?? null,
        capacity_kg: input.capacityKg,
        price_per_kg: input.pricePerKg,
        status: input.status,
      })
      .select("id")
      .single();

    if(error)  return {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          status: status,
        },
      };
    return { data: data.id, error: null };
  }
}
