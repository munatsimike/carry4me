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
import EmptyState from "@/app/components/EmptyState";
import { useMediaQuery } from "@/app/shared/Authentication/UI/hooks/useMediaQuery";
import { MobileListingCard } from "../dashboard/components/MobileListingCard";
import PageSection from "@/app/components/PageSection";
import FAB from "@/app/components/FAB";
import { useMyParcels } from "@/app/hooks/queries/useParcelsQueries";
import { useQueryErrorEffect } from "@/app/hooks/useQueryErrorEffect";
import { useDeleteParcelMutation } from "@/app/hooks/mutations/useParcelMutations";
import { useMarketplaceActionGuard } from "@/app/shared/Authentication/UI/hooks/useMarketplaceActionGuard";

export function MyParcelsPage() {
  const [parcelPreview, setParcelPreview] = useState<ParcelListing | null>(
    null,
  );
  const { user } = useAuth();
  const { guardAction } = useMarketplaceActionGuard();
  const { toast } = useToast();
  const isMobile = useMediaQuery();
  const navigate = useNavigate();

  const { data: myParcels = [], isLoading, error } = useMyParcels(user?.id);
  useQueryErrorEffect(error);

  const deleteParcelMutation = useDeleteParcelMutation();

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
    <>
      <PageSection>
        <div className="flex items-center justify-center"></div>
      </PageSection>
      <DefaultContainer outerClassName="bg-canvas min-h-screen">
        {isLoading ? (
          <p>Loading…</p>
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
        ) : isMobile ? (
          <MobileListingCard
            setListingPreview={setParcelPreview}
            data={myParcels}
            onEdit={handleEdit}
            onDelete={deleteParcel}
            setModalState={() => {}}
          />
        ) : (
          <ListingTable
            setListingPreview={setParcelPreview}
            data={myParcels}
            onEdit={handleEdit}
            onDelete={deleteParcel}
            setModalState={() => {}}
          />
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
    </>
  );
}
