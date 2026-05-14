import { supabase } from "@/app/shared/supabase/client";

import type { LocationRepository } from "../Authentication/domain/LocationRepository";
import type { RepoResponse } from "../domain/RepoResponse";
import type { MyLocation } from "../Authentication/domain/MyLocation";

export class SupabaseLocationRepository implements LocationRepository {
  async getLocations(): Promise<RepoResponse<MyLocation[]>> {
    const { data, error } = await supabase
      .from("countries")
      .select(
        `
        id,
        name,
        code,
        cities (
          id,
          name
        )
      `,
      )
      .order("name", { ascending: true })
      .order("name", {
        ascending: true,
        referencedTable: "cities",
      });

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code ?? undefined,
          status: null,
        },
      };
    }

    return {
      data: (data ?? []).map((country) => ({
        country: {
          id: country.id,
          name: country.name,
          code: country.code,
        },
        cities: country.cities ?? [],
      })),
      error: null,
    };
  }
}
