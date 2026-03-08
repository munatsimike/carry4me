import { useAuth } from "@/app/shared/supabase/AuthProvider";
import DefaultContainer from "@/components/ui/DefualtContianer";
import { useEffect, useMemo, useState } from "react";
// trips.types.ts
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { namedCall } from "@/app/shared/Authentication/application/NamedCall";
import { ListingTable } from "../dashboard/components/ListingTable";
import { SupabaseParcelRepository } from "./data/SupabaseParcelRepository";
import { MyParcelsIdUseCase } from "./application/MyParcelsUseCase";
import CustomText from "@/components/ui/CustomText";
import { DeleteParcelUseCase } from "./application/DeleteParcelUseCase";
import { useToast } from "@/app/components/Toast";
import { AnimatePresence } from "framer-motion";
import { useGoods } from "@/app/shared/Authentication/UI/GoodsProvider";
import CreateParcelModal, {
  type FormValues,
} from "../dashboard/CreateParcelModal";
import type { ParcelListing } from "./domain/Parcel";
import ParcelCard from "./ui/ParcelCard";
import CustomModal from "@/app/components/CustomModal";
import type { Listing } from "@/app/shared/Authentication/domain/Listing";
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
  const [parcels, setTableData] = useState<Listing[]>([]);
  const [formValues, setFormValues] = useState<FormValues | null>(null);
  const [showParcelPreviewModal, setPreviewModalState] =
    useState<boolean>(false);
  const [parcelPreiew, setParcel] = useState<Listing | null>(null);
  const { user, refreshProfile, profile } = useAuth();
  const { toast } = useToast();
  const parcelRepo = useMemo(() => new SupabaseParcelRepository(), []);
  const tripByIdUseCase = useMemo(
    () => new MyParcelsIdUseCase(parcelRepo),
    [parcelRepo],
  );
  const deleteParcelUseCase = useMemo(
    () => new DeleteParcelUseCase(parcelRepo),
    [parcelRepo],
  );

  const [showParcelModal, setParcelModalState] = useState<boolean>(false);
  const sortedParcels = useMemo(() => {
    return [...parcels].sort((a, b) => (a.departDate > b.departDate ? 1 : -1));
  }, [parcels]);

  // delete parcel
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

  const {
    goodsCategories,
    ensureGoodsLoaded,
    loading: goodsLoading,
  } = useGoods();

  useEffect(() => {
    if (!showParcelModal) return;
    ensureGoodsLoaded();
  }, [showParcelModal, ensureGoodsLoaded]);

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
    <DefaultContainer outerClassName="bg-canvas min-h-screen">
      <div>
        <div className="flex items-center justify-between">
          <span>My Parcels</span>

          {sortedParcels.length > 0 && (
            <Button variant={"primary"} size={"xsm"}>
              + Post a parcel
            </Button>
          )}
        </div>

        {loading || goodsLoading ? (
          <p>Loading…</p>
        ) : sortedParcels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="flex flex-col p-4 gap-4 max-w-md bg-white shadow-md rounded-2xl">
              <h2 className="text-xl font-semibold text-gray-800">
                No parcels yet
              </h2>

              <CustomText as="p">
                You haven’t posted any parcels yet. Start by creating a new
                parcels to let others send trips with you.
              </CustomText>

              <Button
                onClick={() => setParcelModalState(true)}
                variant={"primary"}
                size={"sm"}
              >
                + Post a parcel
              </Button>
            </span>
          </div>
        ) : (
          <ListingTable
            onClick={() => setPreviewModalState(true)} // set preview
            setParcel={setParcel}
            data={parcels}
            onEdit={setParcelModalState} // set edit
            onDelete={deleteParcel}
            setFormValues={setFormValues}
          />
        )}
      </div>

      <AnimatePresence>
        {/* edit parcel */}
        {showParcelModal && (
          <CreateParcelModal
            mode="edit"
            initialFormValues={formValues}
            goodsCategory={goodsCategories}
            setModalState={setParcelModalState}
          />
        )}
        {/*show preview moda */}
        {showParcelPreviewModal && parcelPreiew && (
          <CustomModal onClose={() => setPreviewModalState(false)} width="md">
            <ParcelCard
              parcel={parcelPreiew}
              onClick={() => null}
              mode="preview"
            />
          </CustomModal>
        )}{" "}
      </AnimatePresence>
    </DefaultContainer>
  );
}
