import { useAuth } from "@/app/shared/supabase/AuthProvider";
import DefaultContainer from "@/components/ui/DefualtContianer";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ListingTable } from "../dashboard/components/ListingTable";
import { useToast } from "@/app/components/Toast";
import type { TripListing } from "./domain/Trip";
import type { FormValues } from "@/types/Ui";
import { AnimatePresence } from "framer-motion";
import CreateTripModal from "./ui/CreateTripModal";
import CustomModal from "@/app/components/CustomModal";
import TravelerCard from "./ui/TravelerCard";
import EmptyState from "@/app/components/EmptyState";
import { useMediaQuery } from "@/app/shared/Authentication/UI/hooks/useMediaQuery";
import { MobileListingCard } from "../dashboard/components/MobileListingCard";
import FAB from "@/app/components/FAB";
import { useMyTrips } from "@/app/hooks/queries/useTripsQueries";
import { useQueryErrorEffect } from "@/app/hooks/useQueryErrorEffect";
import { useDeleteTripMutation } from "@/app/hooks/mutations/useTripMutations";
import { getAccountActionBlockReason } from "@/app/shared/Authentication/domain/accountStatus";

export function MyTripsPage() {
  const isMobile = useMediaQuery();
  const { user, profile } = useAuth();
  const [tripreview, setTripPreview] = useState<TripListing | null>(null);
  const [showCreateTripModal, setCreatTripModalState] =
    useState<boolean>(false);
  const [editTrip, setEditTrip] = useState<FormValues | null>(null);
  const { toast } = useToast();

  const { data: myTrips = [], isLoading, error } = useMyTrips(user?.id);
  useQueryErrorEffect(error);

  const deleteTripMutation = useDeleteTripMutation();

  const sortedTrips = useMemo(() => {
    return [...myTrips].sort((a, b) => (a.departDate > b.departDate ? 1 : -1));
  }, [myTrips]);

  const deleteTrip = (tripId: string) => {
    deleteTripMutation.mutate(tripId, {
      onSuccess: () => {
        toast("Trip deleted successfully.", { variant: "success" });
      },
    });
  };

  const handleOnClick = () => {
    const blockReason = getAccountActionBlockReason(profile, "post_listing");
    if (blockReason) {
      toast(blockReason, { variant: "warning" });
      return;
    }

    setCreatTripModalState(true);
  };

  return (
    <DefaultContainer outerClassName="bg-canvas min-h-screen">
      {isLoading ? (
        <p>Loading…</p>
      ) : sortedTrips.length === 0 ? (
        <EmptyState
          title="No trips yet"
          description={
            "You haven’t posted a trip yet. Add one to start receiving parcel requests."
          }
          action={
            <Button
              onClick={() => handleOnClick()}
              className="w-full"
              variant={"primary"}
              size={"sm"}
            >
              Post trip
            </Button>
          }
        />
      ) : isMobile ? (
        <MobileListingCard
          data={myTrips}
          onEdit={setEditTrip}
          onDelete={deleteTrip}
          setListingPreview={setTripPreview}
          setModalState={setCreatTripModalState}
        />
      ) : (
        <ListingTable
          data={myTrips}
          onEdit={setEditTrip}
          onDelete={deleteTrip}
          setListingPreview={setTripPreview}
          setModalState={setCreatTripModalState}
        />
      )}

      <AnimatePresence>
        {showCreateTripModal && (
          <CreateTripModal
            mode={editTrip ? "edit" : undefined}
            initialFormValues={editTrip ? editTrip : undefined}
            setModalState={() => setCreatTripModalState(false)}
          />
        )}
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
          onClick={handleOnClick}
          isAuthed={!!user?.id}
          variant="trip"
        />
      )}
    </DefaultContainer>
  );
}
