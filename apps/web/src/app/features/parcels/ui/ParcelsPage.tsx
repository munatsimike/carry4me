import CustomModal from "@/app/components/CustomModal";
import DefaultContainer from "@/components/ui/DefualtContianer";
import { useMemo, useState } from "react";
import Parcels from "./Parcels";
import Search from "@/app/components/Search";
import PageSection from "@/app/components/PageSection";
import { SupabaseParcelRepository } from "@/app/features/parcels/data/SupabaseParcelRepository";
import { useAsync } from "@/app/hookes/useAsync";
import type { Parcel } from "@/app/features/parcels/domain/Parcel";
import { GetParcelsUseCase } from "@/app/features/parcels/application/GetParcelsUseCase";
import type { Trip } from "@/app/features/trips/domain/Trip";
import ConfirmRequest from "@/app/components/ConfirmRequest";
import { useAuthState } from "@/app/shared/supabase/AuthState";
import { GetTripUseCase } from "@/app/features/trips/application/GetTripUseCase";
import { SupabaseTripsRepository } from "@/app/features/trips/data/SupabaseTripsRepository";
import { AnimatePresence } from "framer-motion";

export default function ParcelsPage() {
  const parcelRepo = useMemo(() => new SupabaseParcelRepository(), []);
  const getParcelsUseCase = useMemo(
    () => new GetParcelsUseCase(parcelRepo), // all parcels
    [parcelRepo],
  );

  const tripRepo = useMemo(() => new SupabaseTripsRepository(), []);
  const getTripUseCase = useMemo(
    () => new GetTripUseCase(tripRepo), // get a single paarcel
    [parcelRepo],
  );

  const { data, error, isLoading } = useAsync(() =>
    getParcelsUseCase.execute(),
  );

  if (error) {
    console.log(error);
  }
  const [selectedParcel, setParcel] = useState<Parcel | null>(null);
  const onClose = () => setParcel(null);
  const [selectedCountry, setCountry] = useState<string>("");
  const [selectedCity, setCity] = useState<string>("");
  const [tripLoaded, setTripLoaded] = useState(false);
  // trip to matched with a parcel. when a user selects a parcel they should have a trip.
  const [userTrip, setUserTrip] = useState<Trip | null>(null);

  // hooks must be here, NOT inside if blocks
  const { userId, userLoggedIn } = useAuthState();

  const handleRequest = async (parcel: Parcel) => {
    setParcel(parcel);
    if (!tripLoaded && userId && userLoggedIn) {
      const trip = await getTripUseCase.execute(userId);
      setUserTrip(trip);
      setTripLoaded(true);
    }
  };

  return (
    <>
      <PageSection>
        <Search
          countries={["UK", "USA"]}
          cities={["London", "Birmingham"]}
          onClick={() => () => null}
          onCityChange={setCity}
          onCountryChange={setCountry}
          selectedCountry={selectedCountry}
          selectedCity={selectedCity}
        />
      </PageSection>
      <DefaultContainer outerClassName="bg-canvas min-h-screen">
        {data && <Parcels parcels={data} onClick={handleRequest} />}
      </DefaultContainer>
      <AnimatePresence>
        {selectedParcel && userId && userTrip && (
          <CustomModal width="xl" onClose={onClose}>
            <ConfirmRequest
              loggedInUserId={userId}
              trip={userTrip}
              parcel={selectedParcel}
              onClose={onClose}
              isSenderRequesting={userId === selectedParcel.user.id}
            />
          </CustomModal>
        )}
      </AnimatePresence>
    </>
  );
}
