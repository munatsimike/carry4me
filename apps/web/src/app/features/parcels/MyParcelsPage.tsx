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
import { confirmListingStatusChange } from "@/app/shared/listings/listingStatusConfirmation";

export function MyParcelsPage() {
  const [parcelPreview, setParcelPreview] = useState<ParcelListing | null>(
    null,
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

  const deleteParcel = (parcelId: string) => {
    deleteParcelMutation.mutate(parcelId, {
      onSuccess: () => {
        toast("Parcel deleted successfully.", { variant: "success" });
      },
    });
  };

  const toggleParcelStatus = async (listing: Listing, active: boolean) => {
    const shouldProceed = await confirmListingStatusChange(
      listing,
      active,
      confirm,
    );
    if (!shouldProceed) return;

    updateParcelStatusMutation.mutate(
      { parcelId: listing.id, active },
      {
        onSuccess: () => {
          toast(active ? "Parcel activated." : "Parcel deactivated.", {
            variant: "success",
          });
        },
      },
    );
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
      ) : (
        <>
          <div className="w-full min-w-0 pb-24 lg:hidden">
            <MobileListingCard
              setListingPreview={setParcelPreview}
              data={myParcels}
              onEdit={handleEdit}
              onDelete={deleteParcel}
              onToggleStatus={toggleParcelStatus}
              setModalState={() => {}}
            />
          </div>
          <div className="hidden min-w-0 lg:block">
            <ListingTable
              setListingPreview={setParcelPreview}
              data={myParcels}
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
