import { supabase } from "@/app/shared/supabase/client";
import { throwIfSupabaseError } from "@/app/shared/domain/AppError";

import type { LocationRepository } from "../Authentication/domain/LocationRepository";
import type { MyLocation } from "../Authentication/domain/MyLocation";

export class SupabaseLocationRepository implements LocationRepository {
  async getLocations(): Promise<MyLocation[]> {
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

    throwIfSupabaseError(error);

    return (data ?? []).map((country) => ({
      country: {
        id: country.id,
        name: country.name,
        code: country.code,
      },
      cities: country.cities ?? [],
    }));
  }
}
