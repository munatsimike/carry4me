import { useAuth } from "@/app/shared/supabase/AuthProvider";
import DefaultContainer from "@/components/ui/DefualtContianer";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ListingTable } from "../dashboard/components/ListingTable";
import { useToast } from "@/app/components/Toast";
import type { TripListing } from "./domain/Trip";
import type { FormValues } from "@/types/Ui";
import type { Listing } from "@/app/shared/Authentication/domain/Listing";
import CustomModal from "@/app/components/CustomModal";
import TravelerCard from "./ui/TravelerCard";
import EmptyState from "@/app/components/EmptyState";
import PageHeading from "@/app/components/PageHeading";
import PageLoadingSpinner from "@/app/components/PageLoadingSpinner";
import { MobileListingCard } from "../dashboard/components/MobileListingCard";
import FAB from "@/app/components/FAB";
import { useMyTrips } from "@/app/hooks/queries/useTripsQueries";
import { useQueryErrorEffect } from "@/app/hooks/useQueryErrorEffect";
import {
  useDeleteTripMutation,
  useUpdateTripStatusMutation,
} from "@/app/hooks/mutations/useTripMutations";
import { useMarketplaceActionGuard } from "@/app/shared/Authentication/UI/hooks/useMarketplaceActionGuard";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import { confirmListingDelete, confirmListingStatusChange } from "@/app/shared/listings/listingStatusConfirmation";
import {
  HorizontalMenu,
  type TabItem,
} from "@/app/shared/Authentication/UI/SegmentedTabs";
import {
  countMyTripsByStatusFilter,
  getMyTripsFilterEmptyState,
  matchesMyTripsStatusFilter,
  MY_TRIPS_STATUS_FILTERS,
  type MyTripsStatusFilter,
} from "./application/myTripsStatusFilter";

export function MyTripsPage() {
  const { user } = useAuth();
  const { guardAction } = useMarketplaceActionGuard();
  const [tripreview, setTripPreview] = useState<TripListing | null>(null);
  const [statusFilter, setStatusFilter] = useState<MyTripsStatusFilter>(
    MY_TRIPS_STATUS_FILTERS.ACTIVE,
  );
  const { toast } = useToast();
  const navigate = useNavigate();
  const { confirm } = useUniversalModal();

  const { data: myTrips = [], isLoading, error } = useMyTrips(user?.id);
  useQueryErrorEffect(error);

  const deleteTripMutation = useDeleteTripMutation();
  const updateTripStatusMutation = useUpdateTripStatusMutation();

  const sortedTrips = useMemo(() => {
    return [...myTrips].sort((a, b) => (a.departDate > b.departDate ? 1 : -1));
  }, [myTrips]);

  const filterTabs = useMemo<TabItem<MyTripsStatusFilter>[]>(
    () => [
      {
        id: MY_TRIPS_STATUS_FILTERS.ACTIVE,
        label: "Active",
        count: countMyTripsByStatusFilter(
          myTrips,
          MY_TRIPS_STATUS_FILTERS.ACTIVE,
        ),
      },
      {
        id: MY_TRIPS_STATUS_FILTERS.FULL,
        label: "Full",
        count: countMyTripsByStatusFilter(myTrips, MY_TRIPS_STATUS_FILTERS.FULL),
      },
      {
        id: MY_TRIPS_STATUS_FILTERS.COMPLETED,
        label: "Completed",
        count: countMyTripsByStatusFilter(
          myTrips,
          MY_TRIPS_STATUS_FILTERS.COMPLETED,
        ),
      },
    ],
    [myTrips],
  );

  const filteredTrips = useMemo(() => {
    return sortedTrips.filter((trip) =>
      matchesMyTripsStatusFilter(trip.status, statusFilter),
    );
  }, [sortedTrips, statusFilter]);

  const filterEmptyState = getMyTripsFilterEmptyState(statusFilter);

  const deleteTrip = async (listing: Listing) => {
    const shouldProceed = await confirmListingDelete(listing, confirm);
    if (!shouldProceed) return;

    try {
      await deleteTripMutation.mutateAsync(listing.id);
      toast("Trip deleted successfully.", { variant: "success" });
    } catch {
      // Errors are surfaced by the mutation hook.
    }
  };

  const toggleTripStatus = async (listing: Listing, active: boolean) => {
    const shouldProceed = await confirmListingStatusChange(
      listing,
      active,
      confirm,
    );
    if (!shouldProceed) return;

    try {
      await updateTripStatusMutation.mutateAsync({ tripId: listing.id, active });
      toast(
        active ? "Trip activated successfully." : "Trip deactivated successfully.",
        { variant: "success" },
      );
    } catch {
      // Errors are surfaced by the mutation hook.
    }
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
    <DefaultContainer outerClassName="bg-canvas min-h-screen py-4 sm:py-6 lg:py-8">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:gap-4">
        <PageHeading
          title="My trips"
          subtitle="Manage the trips you've posted. Edit details or deactivate a trip to hide it from senders."
        />
        {sortedTrips.length > 0 ? (
          <HorizontalMenu
            tabs={filterTabs}
            selectedTab={statusFilter}
            setTab={setStatusFilter}
          />
        ) : null}
      </div>
      {isLoading ? (
        <PageLoadingSpinner />
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
      ) : filteredTrips.length === 0 ? (
        <EmptyState
          title={filterEmptyState.title}
          description={filterEmptyState.description}
        />
      ) : (
        <>
          <div className="w-full min-w-0 pb-24 lg:hidden">
            <MobileListingCard
              data={filteredTrips}
              onEdit={handleEdit}
              onDelete={deleteTrip}
              onToggleStatus={toggleTripStatus}
              setListingPreview={setTripPreview}
              setModalState={() => {}}
            />
          </div>
          <div className="hidden min-w-0 lg:block">
            <ListingTable
              data={filteredTrips}
              onEdit={handleEdit}
              onDelete={deleteTrip}
              onToggleStatus={toggleTripStatus}
              setListingPreview={setTripPreview}
              setModalState={() => {}}
            />
          </div>
        </>
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
