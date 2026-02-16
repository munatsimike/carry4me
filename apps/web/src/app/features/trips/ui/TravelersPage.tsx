import DefaultContainer from "@/components/ui/DefualtContianer";
import Travelers from "./Travelers";
import { useEffect, useMemo, useState } from "react";
import CustomModal from "@/app/components/CustomModal";
import ConfirmRequest from "@/app/components/ConfirmRequest";
import PageSection from "@/app/components/PageSection";
import Search from "@/app/components/Search";
import { SupabaseTripsRepository } from "../data/SupabaseTripsRepository";
import { GetTripsUseCase } from "../application/GetTripsUseCase";
import type { Trip } from "../domain/Trip";
import { GetGoodsUseCase } from "../../goods/application/GetGoodsUseCase";
import { SupabaseGoodsRepository } from "../../goods/data/SupabaseGoodsRepository";
import { useAsync } from "@/app/hookes/useAsync";

import { AnimatePresence } from "framer-motion";
import { GetParcelUseCase } from "../../parcels/application/GetParcelUseCase";
import { SupabaseParcelRepository } from "../../parcels/data/SupabaseParcelRepository";
import type { Parcel } from "../../parcels/domain/Parcel";
import { useAuthState } from "@/app/shared/supabase/AuthState";
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
  const goodsRepo = useMemo(() => new SupabaseGoodsRepository(), []);
  const getGoodsUseCase = useMemo(
    () => new GetGoodsUseCase(goodsRepo),
    [goodsRepo],
  );

  const [tripList, setTripList] = useState<Trip[]>([]);

  useEffect(() => {
    let cancel = false;
    async function fetchTravelers() {
      const { result } = await namedCall(
        "travelers",
        fetchTripsUseCase.execute(),
      );

      if (cancel) return;

      if (!result.success) {
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

  const [selectedTrip, setTrip] = useState<Trip | null>(null);
  const [selectedCountry, setCountry] = useState<string>("");
  const [selectedCity, setCity] = useState<string>("");
  const { userId: userId, userLoggedIn } = useAuthState();

  const [tripLoaded, setTripLoaded] = useState<boolean>(false);
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const onClose = () => setTrip(null);
  const { toast } = useToast();

  const handleRequest = async (trip: Trip) => {
    if (trip.user.id === userId) {
      toast(
        "You can’t match with your own trip. Browse available parcels instead.",
        {
          variant: "warning",
        },
      );
      return;
    }

    if (!tripLoaded && userId) {
      const { result } = await namedCall(
        "Parcel",
        getParcelUseCase.execute(userId),
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
      setTripLoaded(true);
    }
  };

  return (
    <>
      <PageSection>
        <Search
          countries={["UK", "USA", "Ireland"]}
          cities={["London", "Birmingham"]}
          onClick={() => () => null}
          onCityChange={setCity}
          onCountryChange={setCountry}
          selectedCountry={selectedCountry}
          selectedCity={selectedCity}
        />
      </PageSection>
      <DefaultContainer outerClassName="bg-canvas min-h-screen">
        {tripList && <Travelers trips={tripList} onClick={handleRequest} />}
      </DefaultContainer>
      <AnimatePresence>
        {selectedTrip && parcel && userId && (
          <CustomModal width="xl" onClose={onClose}>
            <ConfirmRequest
              loggedInUserId={userId}
              trip={selectedTrip}
              parcel={parcel}
              onClose={onClose}
              isSenderRequesting={userId === parcel.user.id}
            />
          </CustomModal>
        )}
      </AnimatePresence>
    </>
  );
}
