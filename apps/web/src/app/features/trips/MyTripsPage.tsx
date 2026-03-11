import { useAuth } from "@/app/shared/supabase/AuthProvider";
import DefaultContainer from "@/components/ui/DefualtContianer";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SupabaseTripsRepository } from "./data/SupabaseTripsRepository";
import { namedCall } from "@/app/shared/Authentication/application/NamedCall";
import { ListingTable } from "../dashboard/components/ListingTable";
import { DeleteTripUseCase } from "./application/DeleteTripUseCase";
import { useToast } from "@/app/components/Toast";
import CustomText from "@/components/ui/CustomText";
import { MyTripsUseCase } from "./application/MyTripsUseCase";
import type { TripListing } from "./domain/Trip";
import type { FormValues } from "@/types/Ui";
import { AnimatePresence } from "framer-motion";
import CreateTripModal from "./ui/CreateTripModal";
import CustomModal from "@/app/components/CustomModal";
import TravelerCard from "./ui/TravelerCard";
import { useGoods } from "@/app/shared/Authentication/UI/GoodsProvider";
import EmptyState from "@/app/components/EmptyState";

export function MyTripsPage() {
  const [loading, setLoading] = useState(true);
  const [mypTrips, setMyTrips] = useState<TripListing[]>([]);

  const { user, refreshProfile } = useAuth();
  const [tripreview, setTripPreview] = useState<TripListing | null>(null);
  const [showCreateTripModal, setCreatTripModalState] =
    useState<boolean>(false);
  const [editTrip, setEditTrip] = useState<FormValues | null>(null);
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
    return [...mypTrips].sort((a, b) => (a.departDate > b.departDate ? 1 : -1));
  }, [mypTrips]);

  const {
    goodsCategories,
    ensureGoodsLoaded,
    loading: goodsLoading,
  } = useGoods();

  useEffect(() => {
    if (!showCreateTripModal) return;
    ensureGoodsLoaded();
  }, [showCreateTripModal, ensureGoodsLoaded]);

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
        setMyTrips(result.data);
      }
    }
    loadTrips();
  }, [user?.id]);

  return (
    <DefaultContainer outerClassName="bg-canvas min-h-screen">
      <div>
        <div className="flex items-center justify-between">
          <CustomText textSize="xl" textVariant="primary" className="pl-4">
            My Trips
          </CustomText>

          {sortedTrips.length > 0 && (
            <Button variant={"primary"} size={"xsm"}>
              + Post a trip
            </Button>
          )}
        </div>

        {loading ? (
          <p>Loading…</p>
        ) : sortedTrips.length === 0 ? (
          <EmptyState
            title={"No Trips"}
            description={
              "You haven’t posted any trips yet. Start by creating a new trips to let others send trips with you."
            }
            action={
              <Button className="w-full" variant={"primary"} size={"sm"}>
                + Post a trip
              </Button>
            }
          />
        ) : (
          <ListingTable
            data={mypTrips}
            onEdit={setEditTrip}
            onDelete={deleteTrip}
            setListingPreview={setTripPreview}
            setModalState={setCreatTripModalState}
          />
        )}
      </div>
      <AnimatePresence>
        {/* edit parcel */}
        {showCreateTripModal && editTrip && (
          <CreateTripModal
            mode="edit"
            initialFormValues={editTrip}
            goodsCategory={goodsCategories}
            setModalState={setCreatTripModalState}
          />
        )}
        {/*show preview moda */}
        {tripreview && (
          <CustomModal onClose={() => setTripPreview(null)} width="md">
            <TravelerCard
              trip={tripreview}
              onClick={() => null}
              mode="preview"
            />
          </CustomModal>
        )}{" "}
      </AnimatePresence>
    </DefaultContainer>
  );
}
