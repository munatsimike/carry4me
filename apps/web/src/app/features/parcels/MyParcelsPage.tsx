import { useAuth } from "@/app/shared/supabase/AuthProvider";
import DefaultContainer from "@/components/ui/DefualtContianer";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { namedCall } from "@/app/shared/Authentication/application/NamedCall";
import { ListingTable } from "../dashboard/components/ListingTable";
import { SupabaseParcelRepository } from "./data/SupabaseParcelRepository";
import { MyParcelsIdUseCase } from "./application/MyParcelsUseCase";
import { DeleteParcelUseCase } from "./application/DeleteParcelUseCase";
import { useToast } from "@/app/components/Toast";
import { AnimatePresence } from "framer-motion";
import { useGoods } from "@/app/shared/Authentication/UI/GoodsProvider";
import CreateParcelModal from "./ui/CreateParcelModal";
import ParcelCard from "./ui/ParcelCard";
import CustomModal from "@/app/components/CustomModal";
import type { FormValues } from "@/types/Ui";
import type { ParcelListing } from "./domain/Parcel";
import EmptyState from "@/app/components/EmptyState";
import CustomText from "@/components/ui/CustomText";

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
  const myParcelsUsecase = useMemo(
    () => new MyParcelsIdUseCase(parcelRepo),
    [parcelRepo],
  );
  const deleteParcelUseCase = useMemo(
    () => new DeleteParcelUseCase(parcelRepo),
    [parcelRepo],
  );

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

  const {
    goodsCategories,
    ensureGoodsLoaded,
    loading: goodsLoading,
  } = useGoods();

  useEffect(() => {
    if (!showParcelModal) return;
    ensureGoodsLoaded();
  }, [showParcelModal, ensureGoodsLoaded]);

  useEffect(() => {
    async function loadTrips() {
      if (!user?.id) return;
      setLoading(true);
      const { result } = await namedCall(
        "myParcels",
        myParcelsUsecase.execute(user?.id),
      );
      if (!result.success) {
        setLoading(false);
        return;
      }

      if (result.data) {
        setLoading(false);
        result.data;
        setMyParcels(result.data);
      }
    }
    loadTrips();
  }, [user?.id]);

  return (
    <DefaultContainer outerClassName="bg-canvas min-h-screen">
      <div>
        <div className="flex items-center justify-between">
          <CustomText
            textSize="xl"
            textVariant="primary"
            className="pl-4 font-medium"
          >
            My Parcels
          </CustomText>

          {sortedParcels.length > 0 && (
            <Button
              onClick={() => setParcelModalState(true)}
              variant={"primary"}
              size={"xsm"}
            >
              + Post a parcel
            </Button>
          )}
        </div>

        {loading || goodsLoading ? (
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
        ) : (
          <ListingTable
            setListingPreview={setParcelPreview}
            data={myParcels}
            onEdit={setFormValues} // set edit
            onDelete={deleteParcel}
            setModalState={setParcelModalState}
          />
        )}
      </div>

      <AnimatePresence>
        {/* edit parcel */}
        {showParcelModal && (
          <CreateParcelModal
            mode={editParcel ? "edit" : undefined}
            initialFormValues={editParcel ? editParcel : undefined}
            goodsCategory={goodsCategories}
            setModalState={setParcelModalState}
          />
        )}
        {/*show preview moda */}
        {parcelPreview && (
          <CustomModal onClose={() => setParcelPreview(null)} width="md">
            <ParcelCard
              parcel={parcelPreview}
              onClick={() => null}
              mode="preview"
            />
          </CustomModal>
        )}{" "}
      </AnimatePresence>
    </DefaultContainer>
  );
}
