
import type { RepoResponse } from "../../domain/RepoResponse";
import { supabase } from "../../supabase/client";

export type Table = "parcels"| "trips"

export async function deleteById(parcelId: string, table: Table): Promise<RepoResponse<string>> {
  const { data, error, status } = await supabase
    .from(table)
    .delete()
    .eq("id", parcelId)
    .select("id");

  if (error) {
    return {
      data: null,
      error: error.message,
      status,
    };
  }

  if (!data || data.length === 0) {
    return {
      data: null,
      error: "Parcel not found or not authorized.",
      status,
    };
  }

  return {
    data: parcelId,
    error: null,
    status,
  };
}
