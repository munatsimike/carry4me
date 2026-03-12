import CustomModal from "@/app/components/CustomModal";
import DefaultContainer from "@/components/ui/DefualtContianer";
import { useEffect, useMemo, useState } from "react";
import Parcels from "./Parcels";
import Search from "@/app/components/Search";
import { SupabaseParcelRepository } from "@/app/features/parcels/data/SupabaseParcelRepository";
import type { ParcelListing } from "@/app/features/parcels/domain/Parcel";
import { GetParcelsUseCase } from "@/app/features/parcels/application/GetParcelsUseCase";
import type { TripListing } from "@/app/features/trips/domain/Trip";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { GetTripUseCase } from "@/app/features/trips/application/GetTripUseCase";
import { SupabaseTripsRepository } from "@/app/features/trips/data/SupabaseTripsRepository";
import { useToast } from "@/app/components/Toast";
import { namedCall } from "@/app/shared/Authentication/application/NamedCall";
import PageSection from "@/app/components/PageSection";
import { AnimatePresence } from "framer-motion";
import ConfirmRequest from "@/app/components/ConfirmRequest";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import { FilterOptionsRow } from "@/app/components/FilterOptionsRow";

export default function ParcelsPage() {
  const parcelRepo = useMemo(() => new SupabaseParcelRepository(), []);
  const getParcelsUseCase = useMemo(
    () => new GetParcelsUseCase(parcelRepo),
    [parcelRepo],
  );
  const { showSupabaseError } = useUniversalModal();
  const tripRepo = useMemo(() => new SupabaseTripsRepository(), []);
  const getTripUseCase = useMemo(
    () => new GetTripUseCase(tripRepo),
    [parcelRepo],
  );

  const [parcelsList, setParcelsList] = useState<ParcelListing[]>([]);

  useEffect(() => {
    let cancel = false;

    if (cancel) return;

    async function fetchParcels() {
      const { result } = await namedCall(
        "parcels",
        getParcelsUseCase.execute(),
      );

      if (!result.success) {
        showSupabaseError(result.error, result.status, {
          onRetry: fetchParcels,
        });
        return;
      }

      if (result.success) setParcelsList(result.data);
    }

    fetchParcels();

    return () => {
      cancel = true;
    };
  }, []);

  const [selectedParcel, setParcel] = useState<ParcelListing | null>(null);
  const onClose = () => setParcel(null);
  const [modalState, setModalState] = useState<boolean>(false);
  const { toast } = useToast();

  // trip to matched with a parcel. when a user selects a parcel they should have a trip.
  const [userTrip, setUserTrip] = useState<TripListing | null>(null);

  const { user } = useAuth();

  //
  const handleRequest = async (parcel: ParcelListing) => {
    if (!user) {
      return;
    } else {
      setModalState(true);
    }
    // check if parcel to be matched to a trip does not belong to the logged in user
    if (parcel.user.id === user.id) {
      toast(
        "You can’t match with your own parcel.Browse available trips instead.",
        { variant: "warning" },
      );
      return;
    }

    if (!userTrip) {
      // fetch a trip to be matched with a parcel
      const trip = await namedCall("trip", getTripUseCase.execute(user.id));

      if (!trip.result.success) {
        showSupabaseError(trip.result.error, trip.result.status, {
          onRetry: () => handleRequest(parcel),
        });
        return;
      }

      // check if any trip is available for the loggedin user
      if (trip.result.success && trip.result.data === null) {
        toast("Post a trip first to start matching with senders.", {
          variant: "warning",
        });
        return;
      }
      setUserTrip(trip.result.data);
      setParcel(parcel);
    }
  };

  return (
    <>
      <PageSection>
        <Search countries={["UK", "USA"]} cities={["London", "Birmingham"]} />
        <FilterOptionsRow />
      </PageSection>
      <DefaultContainer outerClassName="bg-canvas min-h-screen">
        {parcelsList && (
          <Parcels parcels={parcelsList} onClick={handleRequest} />
        )}
      </DefaultContainer>
      <AnimatePresence>
        {selectedParcel && user && userTrip && modalState && (
          <CustomModal width="xl" onClose={() => setModalState(false)}>
            <ConfirmRequest
              loggedInUserId={user.id}
              trip={userTrip}
              parcel={selectedParcel}
              onSubmitted={onClose}
              isSenderRequesting={user.id === selectedParcel.user.id}
            />
          </CustomModal>
        )}
      </AnimatePresence>
    </>
  );
}
