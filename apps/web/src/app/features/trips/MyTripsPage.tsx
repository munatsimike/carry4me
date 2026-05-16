import { useAuth } from "@/app/shared/supabase/AuthProvider";
import DefaultContainer from "@/components/ui/DefualtContianer";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SupabaseTripsRepository } from "./data/SupabaseTripsRepository";
import { namedCall } from "@/app/shared/Authentication/application/NamedCall";
import { ListingTable } from "../dashboard/components/ListingTable";
import { DeleteTripUseCase } from "./application/DeleteTripUseCase";
import { useToast } from "@/app/components/Toast";
import { MyTripsUseCase } from "./application/MyTripsUseCase";
import type { TripListing } from "./domain/Trip";
import type { FormValues } from "@/types/Ui";
import { AnimatePresence } from "framer-motion";
import CreateTripModal from "./ui/CreateTripModal";
import CustomModal from "@/app/components/CustomModal";
import TravelerCard from "./ui/TravelerCard";
import EmptyState from "@/app/components/EmptyState";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import { useMediaQuery } from "@/app/shared/Authentication/UI/hooks/useMediaQuery";
import { MobileListingCard } from "../dashboard/components/MobileListingCard";
import FAB from "@/app/components/FAB";
import { useNavigate } from "react-router-dom";

export function MyTripsPage() {
  const [loading, setLoading] = useState(true);
  const [mypTrips, setMyTrips] = useState<TripListing[]>([]);
  const isMobile = useMediaQuery();
  const { user, refreshProfile, profile } = useAuth();
  const navigate = useNavigate();
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

  const { showSupabaseError } = useUniversalModal();

  const deleteTrip = async (tripId: string) => {
    const { result } = await namedCall(
      "delete trip",
      deleteTripUseCase.execute(tripId),
    );
    if (!result.success) {
      return;
    }

    await refreshProfile();
    toast("Trip deleted successfully", { variant: "success" });
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
        showSupabaseError(result.error);
        return;
      }

      if (result.data) {
        setLoading(false);
        setMyTrips(result.data);
      }
    }
    loadTrips();
  }, [user?.id]);

  const handleOnClick = () => {
    if (!user?.id) return;

    if (!profile) {
      navigate("/complete-profile");
      return;
    }

    setCreatTripModalState(true);
  };
  return (
    <DefaultContainer outerClassName="bg-canvas min-h-screen">
      {loading ? (
        <p>Loading…</p>
      ) : sortedTrips.length === 0 ? (
        <EmptyState
          title={"No Trips"}
          description={
            "You haven’t posted any trips yet. Start by creating a new trips to let others send trips with you."
          }
          action={
            <Button
              onClick={() => handleOnClick()}
              className="w-full"
              variant={"primary"}
              size={"sm"}
            >
              + Post a trip
            </Button>
          }
        />
      ) : isMobile ? (
        <MobileListingCard
          data={mypTrips}
          onEdit={setEditTrip}
          onDelete={deleteTrip}
          setListingPreview={setTripPreview}
          setModalState={setCreatTripModalState}
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

      <AnimatePresence>
        {/* edit trip */}
        {showCreateTripModal && (
          <CreateTripModal
            mode={editTrip ? "edit" : undefined}
            initialFormValues={editTrip ? editTrip : undefined}
            setModalState={() => setCreatTripModalState(false)}
          />
        )}
        {/*show preview mode */}
        {tripreview && (
          <CustomModal onClose={() => setTripPreview(null)} width="md">
            <TravelerCard
              trip={tripreview}
              onClick={() => null}
              mode="preview"
              setTrips={() => null}
            />
          </CustomModal>
        )}{" "}
      </AnimatePresence>
      {sortedTrips.length > 0 && !showCreateTripModal && (
        <FAB
          onClick={() => setCreatTripModalState(true)}
          isAuthed={!!user?.id}
          variant="trip"
        />
      )}
    </DefaultContainer>
  );
}
