import { useAuth } from "@/app/shared/supabase/AuthProvider";
import DefaultContainer from "@/components/ui/DefualtContianer";

import { useEffect, useMemo, useState } from "react";

// trips.types.ts
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { SupabaseTripsRepository } from "./data/SupabaseTripsRepository";
import { namedCall } from "@/app/shared/Authentication/application/NamedCall";
import { TripByIdUseCase, type TableData } from "./application/TripByIDUseCase";
import { TripParcelTable } from "../dashboard/components/TripParcelTable";
export type TripStatus = "draft" | "active" | "paused" | "completed";

export const tripEditSchema = z.object({
  from_country: z.string().min(2),
  from_city: z.string().min(1),
  to_country: z.string().min(2),
  to_city: z.string().min(1),
  departure_date: z.string().min(8), // keep simple; you can refine to date
  available_kg: z.coerce.number().min(0),
  price_per_kg: z.coerce.number().min(0),
  status: z.enum(["draft", "active", "paused", "completed"]),
});

export type TripEditInput = z.infer<typeof tripEditSchema>;

export function MyTripsPage() {
  const [loading, setLoading] = useState(true);
  const [trips, setTableData] = useState<TableData[]>([]);
  const [editTrip, setEditTrip] = useState<TableData | null>(null);
  const { user, refreshProfile, profile } = useAuth();
  const tripRepo = useMemo(() => new SupabaseTripsRepository(), []);
  const tripByIdUseCase = useMemo(
    () => new TripByIdUseCase(tripRepo),
    [tripRepo],
  );

  const sortedTrips = useMemo(() => {
    return [...trips].sort((a, b) => (a.departDate > b.departDate ? 1 : -1));
  }, [trips]);

  useEffect(() => {
    async function loadTrips() {
      if (!user?.id) return;
      setLoading(true);
      const { result } = await namedCall(
        "my trips",
        tripByIdUseCase.execute(user?.id),
      );
      if (!result.success) {
        setLoading(false);
        console.log(result);
        return;
      }

      if (result.data) {
        setLoading(false);
        result.data;
        setTableData(result.data);
      }
    }
    loadTrips();
  }, [user?.id]);

  return (
    <DefaultContainer>
      <div>
        <div className="flex items-center justify-between">
          <span>My Trips</span>

          {sortedTrips.length > 0 && (
            <Button variant={"primary"} size={"xsm"}>
              + Post a parcel
            </Button>
          )}
        </div>

        {loading ? (
          <p>Loading…</p>
        ) : sortedTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <h2 className="text-xl font-semibold text-gray-800">
              No trips yet
            </h2>
            <p className="mt-2 mb-6 text-gray-500 max-w-md">
              You haven’t posted any trips yet. Start by creating a new trip to
              let others send trip with you.
            </p>
            <Button variant={"primary"} size={"sm"}>
              + Post a trip
            </Button>
          </div>
        ) : (
          <TripParcelTable data={trips} onEdit={setEditTrip} onDelete={()=>null} />
        )}
      </div>
    </DefaultContainer>
  );
}
