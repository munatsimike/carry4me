import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { useSignInModal } from "@/app/shared/Authentication/SignInModalContext";
import DefaultContainer from "@/components/ui/DefualtContianer";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ListingTable } from "../dashboard/components/ListingTable";
import { useToast } from "@/app/components/Toast";
import { AnimatePresence } from "framer-motion";
import CreateParcelModal from "./ui/CreateParcelModal";
import ParcelCard from "./ui/ParcelCard";
import CustomModal from "@/app/components/CustomModal";
import type { FormValues } from "@/types/Ui";
import type { ParcelListing } from "./domain/Parcel";
import EmptyState from "@/app/components/EmptyState";
import { useMediaQuery } from "@/app/shared/Authentication/UI/hooks/useMediaQuery";
import { MobileListingCard } from "../dashboard/components/MobileListingCard";
import PageSection from "@/app/components/PageSection";
import FAB from "@/app/components/FAB";
import { useNavigate } from "react-router-dom";
import { useMyParcels } from "@/app/hooks/queries/useParcelsQueries";
import { useQueryErrorEffect } from "@/app/hooks/useQueryErrorEffect";
import { useDeleteParcelMutation } from "@/app/hooks/mutations/useParcelMutations";
import { COMPLETE_PROFILE_PATH } from "@/app/shared/Authentication/domain/profileCompletion";

export function MyParcelsPage() {
  const [editParcel, setFormValues] = useState<FormValues | null>(null);
  const [parcelPreview, setParcelPreview] = useState<ParcelListing | null>(
    null,
  );
  const { user, profileIncomplete } = useAuth();
  const { openSignInModal } = useSignInModal();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useMediaQuery();
  const [showParcelModal, setParcelModalState] = useState<boolean>(false);

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
    if (!user?.id) {
      openSignInModal({ redirectTo: "/my/parcels" });
      return;
    }

    if (profileIncomplete) {
      navigate(COMPLETE_PROFILE_PATH);
      return;
    }

    setParcelModalState(true);
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
            onEdit={setFormValues}
            onDelete={deleteParcel}
            setModalState={setParcelModalState}
          />
        ) : (
          <ListingTable
            setListingPreview={setParcelPreview}
            data={myParcels}
            onEdit={setFormValues}
            onDelete={deleteParcel}
            setModalState={setParcelModalState}
          />
        )}

        <AnimatePresence>
          {showParcelModal && (
            <CreateParcelModal
              mode={editParcel ? "edit" : undefined}
              initialFormValues={editParcel ? editParcel : undefined}
              setModalState={() => setParcelModalState(false)}
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
          )}{" "}
        </AnimatePresence>
        {sortedParcels.length > 0 && !showParcelModal && (
          <FAB
            onClick={() => setParcelModalState(true)}
            isAuthed={!!user?.id}
            variant="parcel"
          />
        )}
      </DefaultContainer>
    </>
  );
}
