import { useAuth } from "@/app/shared/supabase/AuthProvider";
import DefaultContainer from "@/components/ui/DefualtContianer";

import { useEffect, useMemo, useState } from "react";

// trips.types.ts
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { SupabaseTripsRepository } from "./data/SupabaseTripsRepository";
import { namedCall } from "@/app/shared/Authentication/application/NamedCall";

import { ListingTable } from "../dashboard/components/ListingTable";
import { DeleteTripUseCase } from "./application/DeleteTripUseCase";
import { useToast } from "@/app/components/Toast";
import CustomText from "@/components/ui/CustomText";
import { MyTripsUseCase } from "./application/MyTripsUseCase";
import type { FormValues } from "../dashboard/CreateParcelModal";
import type { ParcelListing } from "../parcels/domain/Parcel";
import type { TripListing } from "./domain/Trip";
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
  const [tripsListing, setTableData] = useState<TripListing[]>([]);
  const [editTrip, setEditTrip] = useState<boolean | null>(null);
  const { user, refreshProfile, profile } = useAuth();
  const tripRepo = useMemo(() => new SupabaseTripsRepository(), []);
  const { toast } = useToast();

  const tripByIdUseCase = useMemo(
    () => new MyTripsUseCase(tripRepo),
    [tripRepo],
  );
  const deleteTripUseCase = useMemo(
    () => new DeleteTripUseCase(tripRepo),
    [tripRepo],
  );

  const sortedTrips = useMemo(() => {
    return [...tripsListing].sort((a, b) =>
      a.departDate > b.departDate ? 1 : -1,
    );
  }, [tripsListing]);

  const deleteTrip = async (parcelId: string) => {
    const { result } = await namedCall(
      "delete parcel",
      deleteTripUseCase.execute(parcelId),
    );
    if (!result.success) {
      return;
    }

    await refreshProfile();
    toast("Parcel deleted successfully", { variant: "success" });
  };

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
        setTableData(result.data);
      }
    }
    loadTrips();
  }, [user?.id]);

  return (
    <DefaultContainer outerClassName="bg-canvas min-h-screen">
      <div>
        <div className="flex items-center justify-between">
          <span>My Trips</span>

          {sortedTrips.length > 0 && (
            <Button variant={"primary"} size={"xsm"}>
              + Post a trip
            </Button>
          )}
        </div>

        {loading ? (
          <p>Loading…</p>
        ) : sortedTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="flex flex-col p-4 gap-4 max-w-md bg-white shadow-md rounded-2xl">
              <h2 className="text-xl font-semibold text-gray-800">
                No parcels yet
              </h2>

              <CustomText as="p">
                You haven’t posted any parcels yet. Start by creating a new
                parcels to let others send trips with you.
              </CustomText>

              <Button variant={"primary"} size={"sm"}>
                + Post a trip
              </Button>
            </span>
          </div>
        ) : (
          <ListingTable
            onClick={() => null}
            data={tripsListing}
            onEdit={setEditTrip}
            onDelete={deleteTrip}
            setFormValues={function (v: FormValues): void {
              throw new Error("Function not implemented.");
            }}
            setParcel={function (p: ParcelListing): void {
              throw new Error("Function not implemented.");
            }}
          />
        )}
      </div>
    </DefaultContainer>
  );
}
