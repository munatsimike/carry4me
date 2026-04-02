import { useAuth } from "@/app/shared/supabase/AuthProvider";
import DefaultContainer from "@/components/ui/DefualtContianer";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { namedCall } from "@/app/shared/Authentication/application/NamedCall";
import { ListingTable } from "../dashboard/components/ListingTable";
import { SupabaseParcelRepository } from "./data/SupabaseParcelRepository";
import { DeleteParcelUseCase } from "./application/DeleteParcelUseCase";
import { useToast } from "@/app/components/Toast";
import { AnimatePresence } from "framer-motion";

import CreateParcelModal from "./ui/CreateParcelModal";
import ParcelCard from "./ui/ParcelCard";
import CustomModal from "@/app/components/CustomModal";
import type { FormValues } from "@/types/Ui";
import type { ParcelListing } from "./domain/Parcel";
import EmptyState from "@/app/components/EmptyState";
import CustomText from "@/components/ui/CustomText";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import { GetParcelsByIdUseCase } from "./application/GetParcelsByIdUseCase";
import { useMediaQuery } from "@/app/shared/Authentication/UI/hooks/useMediaQuery";
import { MobileListingCard } from "../dashboard/components/MobileListingCard";
import PageSection from "@/app/components/PageSection";
import FAB from "@/app/components/FAB";

export function MyParcelsPage() {
  const [loading, setLoading] = useState(true);
  const [myParcels, setMyParcels] = useState<ParcelListing[]>([]);
  const [editParcel, setFormValues] = useState<FormValues | null>(null);
  const [parcelPreview, setParcelPreview] = useState<ParcelListing | null>(
    null,
  );
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const parcelRepo = useMemo(() => new SupabaseParcelRepository(), []);
  const getParcelByIdUseCase = useMemo(
    () => new GetParcelsByIdUseCase(parcelRepo),
    [parcelRepo],
  );
  const deleteParcelUseCase = useMemo(
    () => new DeleteParcelUseCase(parcelRepo),
    [parcelRepo],
  );

  const isMobile = useMediaQuery();
  const { showSupabaseError } = useUniversalModal();
  const [showParcelModal, setParcelModalState] = useState<boolean>(false);
  const sortedParcels = useMemo(() => {
    return [...myParcels].sort((a, b) =>
      a.departDate > b.departDate ? 1 : -1,
    );
  }, [myParcels]);

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

  useEffect(() => {
    async function loadTrips() {
      if (!user?.id) return;
      setLoading(true);
      const { result } = await namedCall(
        "myParcels",
        getParcelByIdUseCase.execute(user?.id),
      );
      if (!result.success) {
        setLoading(false);
        showSupabaseError(result.error);
        return;
      }

      if (result.data) {
        setLoading(false);
        setMyParcels(result.data);
      }
    }
    loadTrips();
  }, [user?.id]);

  return (
    <>
      <PageSection>
        <div className="flex items-center justify-center"></div>
      </PageSection>
      <DefaultContainer outerClassName="bg-canvas min-h-screen">
        {loading ? (
          <p>Loading…</p>
        ) : sortedParcels.length === 0 ? (
          <EmptyState
            title={"No parcels"}
            description={
              "You haven’t posted any parcels yet. Start by creating a new parcels to let others send trips with you."
            }
            action={
              <Button
                className="w-full"
                onClick={() => setParcelModalState(true)}
                variant={"primary"}
                size={"sm"}
              >
                + Post a parcel
              </Button>
            }
          />
        ) : isMobile ? (
          <MobileListingCard
            setListingPreview={setParcelPreview}
            data={myParcels}
            onEdit={setFormValues} // set edit
            onDelete={deleteParcel}
            setModalState={setParcelModalState}
          />
        ) : (
          <ListingTable
            setListingPreview={setParcelPreview}
            data={myParcels}
            onEdit={setFormValues} // set edit
            onDelete={deleteParcel}
            setModalState={setParcelModalState}
          />
        )}

        <AnimatePresence>
          {/* edit parcel */}
          {showParcelModal && (
            <CreateParcelModal
              mode={editParcel ? "edit" : undefined}
              initialFormValues={editParcel ? editParcel : undefined}
              setModalState={() => setParcelModalState(false)}
            />
          )}
          {/*show preview moda */}
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
          <FAB onClick={() => setParcelModalState(true)} isAuthed={!!user?.id} />
        )}
      </DefaultContainer>
    </>
  );
}
