import { useAuth } from "@/app/shared/supabase/AuthProvider";
import DefaultContainer from "@/components/ui/DefualtContianer";
import { useEffect, useMemo, useState } from "react";
// trips.types.ts
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { namedCall } from "@/app/shared/Authentication/application/NamedCall";
import { TripParcelTable } from "../dashboard/components/TripParcelTable";
import { SupabaseParcelRepository } from "./data/SupabaseParcelRepository";
import { ParcelByIdUseCase } from "./application/ParcelByIdUseCase";
import type { TableData } from "../trips/application/TripByIDUseCase";
import CustomText from "@/components/ui/CustomText";
import { DeleteParcelUseCase } from "./application/DeleteParcelUseCase";
import { useToast } from "@/app/components/Toast";
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

export function MyParcelsPage() {
  const [loading, setLoading] = useState(true);
  const [parcels, setTableData] = useState<TableData[]>([]);
  const [editTrip, setEditParcel] = useState<TableData | null>(null);
  const { user, refreshProfile, profile } = useAuth();
  const { toast } = useToast();
  const parcelRepo = useMemo(() => new SupabaseParcelRepository(), []);
  const tripByIdUseCase = useMemo(
    () => new ParcelByIdUseCase(parcelRepo),
    [parcelRepo],
  );
  const deleteParcelUseCase = useMemo(
    () => new DeleteParcelUseCase(parcelRepo),
    [parcelRepo],
  );

  const sortedParcels = useMemo(() => {
    return [...parcels].sort((a, b) => (a.departDate > b.departDate ? 1 : -1));
  }, [parcels]);

  const deleteParcel = async (parcelId: string) => {
    const { result } = await namedCall(
      "delete parcel",
      deleteParcelUseCase.execute(parcelId),
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
          <span>My Parcels</span>

          {sortedParcels.length > 0 && (
            <Button variant={"primary"} size={"xsm"}>
              + Post a parcel
            </Button>
          )}
        </div>

        {loading ? (
          <p>Loading…</p>
        ) : sortedParcels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <h2 className="text-xl font-semibold text-gray-800">
              No parcels yet
            </h2>
            <CustomText as="p" className=" max-w-md pt-2 pb-4">
              You haven’t posted any parcels yet. Start by creating a new
              parcels to let others send trips with you.
            </CustomText>

            <Button variant={"primary"} size={"sm"}>
              + Post a parcel
            </Button>
          </div>
        ) : (
          <TripParcelTable
            data={parcels}
            onEdit={setEditParcel}
            onDelete={deleteParcel}
          />
        )}
      </div>
    </DefaultContainer>
  );
}
