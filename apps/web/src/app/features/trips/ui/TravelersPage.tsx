import DefaultContainer from "@/components/ui/DefualtContianer";
import Travelers from "./Travelers";
import { useEffect, useMemo, useState } from "react";
import CustomModal from "@/app/components/CustomModal";
import ConfirmRequest from "@/app/components/ConfirmRequest";
import PageSection from "@/app/components/PageSection";
import Search from "@/app/components/Search";
import { SupabaseTripsRepository } from "../data/SupabaseTripsRepository";
import { GetTripsUseCase } from "../application/GetTripsUseCase";
import type { TripListing } from "../domain/Trip";
import { AnimatePresence } from "framer-motion";
import { GetParcelUseCase } from "../../parcels/application/GetParcelUseCase";
import { SupabaseParcelRepository } from "../../parcels/data/SupabaseParcelRepository";
import type { ParcelListing } from "../../parcels/domain/Parcel";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { useToast } from "@/app/components/Toast";
import { namedCall } from "@/app/shared/Authentication/application/NamedCall";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";

export default function TravelersPage() {
  const repo = useMemo(() => new SupabaseTripsRepository(), []);
  const fetchTripsUseCase = useMemo(() => new GetTripsUseCase(repo), [repo]);
  const parcelRepo = useMemo(() => new SupabaseParcelRepository(), []);
  const getParcelUseCase = useMemo(
    () => new GetParcelUseCase(parcelRepo),
    [parcelRepo],
  );
  const { showSupabaseError } = useUniversalModal();
  const [tripList, setTripList] = useState<TripListing[]>([]);

  useEffect(() => {
    let cancel = false;
    async function fetchTravelers() {
      const { result } = await namedCall(
        "travelers",
        fetchTripsUseCase.execute(),
      );

      if (cancel) return;

      if (!result.success) {
        console.log(result.error);
        showSupabaseError(result.error, result.status, {
          onRetry: fetchTravelers,
        });
        return;
      }
      if (result.success) setTripList(result.data);
    }

    fetchTravelers();

    return () => {
      cancel = true;
    };
  }, []);

  const [selectedTrip, setTrip] = useState<TripListing | null>(null);
  const { user } = useAuth();

  const [parcel, setParcel] = useState<ParcelListing | null>(null);
  const [modalState, setModalState] = useState<boolean>(false);
  const onClose = () => setTrip(null);
  const { toast } = useToast();

  const handleRequest = async (trip: TripListing) => {
    if (!user?.id) {
      return;
    } else {
      setModalState(true);
    }

    if (trip.user.id === user?.id) {
      toast(
        "You can’t match with your own trip. Browse available parcels instead.",
        {
          variant: "warning",
        },
      );
      return;
    }

    if (!parcel) {
      const { result } = await namedCall(
        "Parcel",
        getParcelUseCase.execute(user.id),
      );

      if (!result.success) {
        showSupabaseError(result.error, result.status, {
          onRetry: () => handleRequest(trip),
        });
        return;
      }

      if (result.data === null) {
        toast("Post a parcel first to start matching with travelers.", {
          variant: "warning",
        });
        return;
      }

      setParcel(result.data);
      setTrip(trip);
    }
  };

  return (
    <>
      <PageSection>
        <Search
          countries={["UK", "USA", "Ireland"]}
          cities={["London", "Birmingham"]}
        />
      </PageSection>
      <DefaultContainer outerClassName="bg-canvas min-h-screen">
        {tripList && <Travelers trips={tripList} onClick={handleRequest} />}
      </DefaultContainer>
      <AnimatePresence>
        {selectedTrip && parcel && user && modalState && (
          <CustomModal width="xl" onClose={() => setModalState(false)}>
            <ConfirmRequest
              loggedInUserId={user.id}
              trip={selectedTrip}
              parcel={parcel}
              onSubmitted={onClose}
              isSenderRequesting={user.id === parcel.user.id}
            />
          </CustomModal>
        )}
      </AnimatePresence>
    </>
  );
}
