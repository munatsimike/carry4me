import DefaultContainer from "@/components/ui/DefualtContianer";
import Travelers from "./Travelers";

import { useMemo, useState } from "react";
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
import { isNetworkError } from "@/app/util/isNetworkError";
import { AnimatePresence } from "framer-motion";
import { GetParcelUseCase } from "../../parcels/application/GetParcelUseCase";
import { SupabaseParcelRepository } from "../../parcels/data/SupabaseParcelRepository";
import type { Parcel } from "../../parcels/domain/Parcel";
import { useAuthState } from "@/app/shared/supabase/AuthState";

export default function TravelersPage() {
  const repo = useMemo(() => new SupabaseTripsRepository(), []);
  const fetchTripsUseCase = useMemo(() => new GetTripsUseCase(repo), [repo]);
  const parcelRepo = useMemo(() => new SupabaseParcelRepository(), []);
  const getParcelUseCase = useMemo(
    () => new GetParcelUseCase(parcelRepo),
    [parcelRepo],
  );
  const goodsRepo = useMemo(() => new SupabaseGoodsRepository(), []);
  const getGoodsUseCase = useMemo(
    () => new GetGoodsUseCase(goodsRepo),
    [goodsRepo],
  );

  // fetch trips
  const {
    data: trips,
    error,
    isLoading,
  } = useAsync(() => fetchTripsUseCase.execute(), []);
  if (error) {
    if (isNetworkError(error)) {
    }
  }

  // fetch goods categories
  const {
    data: goods,
    isLoading: processing,
    error: categoryError,
  } = useAsync(() => getGoodsUseCase.execute(), []);

  if (categoryError) {
  }

  const [selectedTrip, setTrip] = useState<Trip | null>(null);
  const [selectedCountry, setCountry] = useState<string>("");
  const [selectedCity, setCity] = useState<string>("");
  const { userId: userId, userLoggedIn } = useAuthState();

  const [tripLoaded, setTripLoaded] = useState<boolean>(false);
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const onClose = () => setTrip(null);

  const handleRequest = async (trip: Trip) => {
    setTrip(trip);
    if (!userId || !userLoggedIn) return;
    if (!tripLoaded) {
      const data = await getParcelUseCase.execute(userId);
      setParcel(data);
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
        {trips && <Travelers trips={trips} onClick={handleRequest} />}
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
