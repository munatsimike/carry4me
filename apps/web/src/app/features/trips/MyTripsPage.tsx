import { useAuth } from "@/app/shared/supabase/AuthProvider";
import DefaultContainer from "@/components/ui/DefualtContianer";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ListingTable } from "../dashboard/components/ListingTable";
import { useToast } from "@/app/components/Toast";
import type { TripListing } from "./domain/Trip";
import type { FormValues } from "@/types/Ui";
import CustomModal from "@/app/components/CustomModal";
import TravelerCard from "./ui/TravelerCard";
import EmptyState from "@/app/components/EmptyState";
import { useMediaQuery } from "@/app/shared/Authentication/UI/hooks/useMediaQuery";
import { MobileListingCard } from "../dashboard/components/MobileListingCard";
import FAB from "@/app/components/FAB";
import { useMyTrips } from "@/app/hooks/queries/useTripsQueries";
import { useQueryErrorEffect } from "@/app/hooks/useQueryErrorEffect";
import { useDeleteTripMutation } from "@/app/hooks/mutations/useTripMutations";
import { useMarketplaceActionGuard } from "@/app/shared/Authentication/UI/hooks/useMarketplaceActionGuard";

export function MyTripsPage() {
  const isMobile = useMediaQuery();
  const { user } = useAuth();
  const { guardAction } = useMarketplaceActionGuard();
  const [tripreview, setTripPreview] = useState<TripListing | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

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
    guardAction(() => {
      navigate("/create-trip?mode=create&returnTo=/my/trips");
    });
  };

  const handleEdit = (values: FormValues) => {
    if (!values.id) return;
    navigate(`/create-trip?mode=edit&id=${values.id}&returnTo=/my/trips`);
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
          onEdit={handleEdit}
          onDelete={deleteTrip}
          setListingPreview={setTripPreview}
          setModalState={() => {}}
        />
      ) : (
        <ListingTable
          data={myTrips}
          onEdit={handleEdit}
          onDelete={deleteTrip}
          setListingPreview={setTripPreview}
          setModalState={() => {}}
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
      )}

      {sortedTrips.length > 0 && (
        <FAB
          onClick={handleOnClick}
          isAuthed={!!user?.id}
          variant="trip"
        />
      )}
    </DefaultContainer>
  );
}
