import { useAuth } from "@/app/shared/supabase/AuthProvider";
import DefaultContainer from "@/components/ui/DefualtContianer";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ListingTable } from "../dashboard/components/ListingTable";
import { useToast } from "@/app/components/Toast";
import ParcelCard from "./ui/ParcelCard";
import CustomModal from "@/app/components/CustomModal";
import type { FormValues } from "@/types/Ui";
import type { ParcelListing } from "./domain/Parcel";
import type { Listing } from "@/app/shared/Authentication/domain/Listing";
import EmptyState from "@/app/components/EmptyState";
import PageHeading from "@/app/components/PageHeading";
import PageLoadingSpinner from "@/app/components/PageLoadingSpinner";
import { MobileListingCard } from "../dashboard/components/MobileListingCard";
import FAB from "@/app/components/FAB";
import { useMyParcels } from "@/app/hooks/queries/useParcelsQueries";
import { useQueryErrorEffect } from "@/app/hooks/useQueryErrorEffect";
import {
  useDeleteParcelMutation,
  useUpdateParcelStatusMutation,
} from "@/app/hooks/mutations/useParcelMutations";
import { useMarketplaceActionGuard } from "@/app/shared/Authentication/UI/hooks/useMarketplaceActionGuard";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import { confirmListingDelete, confirmListingStatusChange } from "@/app/shared/listings/listingStatusConfirmation";
import {
  HorizontalMenu,
  type TabItem,
} from "@/app/shared/Authentication/UI/SegmentedTabs";
import {
  countMyParcelsByStatusFilter,
  getMyParcelsFilterEmptyState,
  matchesMyParcelsStatusFilter,
  MY_PARCELS_STATUS_FILTERS,
  type MyParcelsStatusFilter,
} from "./application/myParcelsStatusFilter";

export function MyParcelsPage() {
  const [parcelPreview, setParcelPreview] = useState<ParcelListing | null>(
    null,
  );
  const [statusFilter, setStatusFilter] = useState<MyParcelsStatusFilter>(
    MY_PARCELS_STATUS_FILTERS.ACTIVE,
  );
  const { user } = useAuth();
  const { guardAction } = useMarketplaceActionGuard();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { confirm } = useUniversalModal();

  const { data: myParcels = [], isLoading, error } = useMyParcels(user?.id);
  useQueryErrorEffect(error);

  const deleteParcelMutation = useDeleteParcelMutation();
  const updateParcelStatusMutation = useUpdateParcelStatusMutation();

  const sortedParcels = useMemo(() => {
    return [...myParcels].sort((a, b) =>
      a.departDate > b.departDate ? 1 : -1,
    );
  }, [myParcels]);

  const filterTabs = useMemo<TabItem<MyParcelsStatusFilter>[]>(
    () => [
      {
        id: MY_PARCELS_STATUS_FILTERS.ACTIVE,
        label: "Active",
        count: countMyParcelsByStatusFilter(
          myParcels,
          MY_PARCELS_STATUS_FILTERS.ACTIVE,
        ),
      },
      {
        id: MY_PARCELS_STATUS_FILTERS.MATCHED,
        label: "Matched",
        count: countMyParcelsByStatusFilter(
          myParcels,
          MY_PARCELS_STATUS_FILTERS.MATCHED,
        ),
      },
      {
        id: MY_PARCELS_STATUS_FILTERS.COMPLETED,
        label: "Completed",
        count: countMyParcelsByStatusFilter(
          myParcels,
          MY_PARCELS_STATUS_FILTERS.COMPLETED,
        ),
      },
    ],
    [myParcels],
  );

  const filteredParcels = useMemo(() => {
    return sortedParcels.filter((parcel) =>
      matchesMyParcelsStatusFilter(parcel.status, statusFilter),
    );
  }, [sortedParcels, statusFilter]);

  const filterEmptyState = getMyParcelsFilterEmptyState(statusFilter);

  const deleteParcel = async (listing: Listing) => {
    const shouldProceed = await confirmListingDelete(listing, confirm);
    if (!shouldProceed) return;

    try {
      await deleteParcelMutation.mutateAsync(listing.id);
      toast("Parcel deleted successfully.", { variant: "success" });
    } catch {
      // Errors are surfaced by the mutation hook.
    }
  };

  const toggleParcelStatus = async (listing: Listing, active: boolean) => {
    const shouldProceed = await confirmListingStatusChange(
      listing,
      active,
      confirm,
    );
    if (!shouldProceed) return;

    try {
      await updateParcelStatusMutation.mutateAsync({
        parcelId: listing.id,
        active,
      });
      toast(
        active
          ? "Parcel activated successfully."
          : "Parcel deactivated successfully.",
        { variant: "success" },
      );
    } catch {
      // Errors are surfaced by the mutation hook.
    }
  };

  const handleOnClick = () => {
    guardAction(() => {
      navigate("/create-parcel?mode=create&returnTo=/my/parcels");
    });
  };

  const handleEdit = (values: FormValues) => {
    if (!values.id) return;
    navigate(
      `/create-parcel?mode=edit&id=${values.id}&returnTo=/my/parcels`,
    );
  };

  return (
    <DefaultContainer outerClassName="bg-canvas min-h-screen py-4 sm:py-6 lg:py-8">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:gap-4">
        <PageHeading
          title="My parcels"
          subtitle="Manage the parcels you've posted. Edit details or deactivate a parcel to hide it from travelers."
        />
        {sortedParcels.length > 0 ? (
          <HorizontalMenu
            tabs={filterTabs}
            selectedTab={statusFilter}
            setTab={setStatusFilter}
          />
        ) : null}
      </div>
      {isLoading ? (
        <PageLoadingSpinner />
      ) : sortedParcels.length === 0 ? (
        <EmptyState
          title="No parcels yet"
          description={
            "You haven’t posted a parcel yet. Add one to start receiving trip requests."
          }
          action={
            <Button
              className="w-full"
              onClick={() => handleOnClick()}
              variant={"primary"}
              size={"sm"}
            >
              Post parcel
            </Button>
          }
        />
      ) : filteredParcels.length === 0 ? (
        <EmptyState
          title={filterEmptyState.title}
          description={filterEmptyState.description}
        />
      ) : (
        <>
          <div className="w-full min-w-0 pb-24 lg:hidden">
            <MobileListingCard
              setListingPreview={setParcelPreview}
              data={filteredParcels}
              onEdit={handleEdit}
              onDelete={deleteParcel}
              onToggleStatus={toggleParcelStatus}
              setModalState={() => {}}
            />
          </div>
          <div className="hidden min-w-0 lg:block">
            <ListingTable
              setListingPreview={setParcelPreview}
              data={filteredParcels}
              onEdit={handleEdit}
              onDelete={deleteParcel}
              onToggleStatus={toggleParcelStatus}
              showDateColumn={false}
              setModalState={() => {}}
            />
          </div>
        </>
      )}

      {parcelPreview && (
        <CustomModal onClose={() => setParcelPreview(null)} width="md">
          <ParcelCard
            toggleLike={() => null}
            parcel={parcelPreview}
            onClick={() => null}
            mode="preview"
          />
        </CustomModal>
      )}
      {sortedParcels.length > 0 && (
        <FAB
          onClick={handleOnClick}
          isAuthed={!!user?.id}
          variant="parcel"
        />
      )}
    </DefaultContainer>
  );
}
