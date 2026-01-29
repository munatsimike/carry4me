import DefaultContainer from "@/components/ui/DefualtContianer";
import Travelers from "./Travelers";
import { travelers, loggedInUserParcel } from "../../../Data";
import type { TestUITrip } from "@/types/Ui";
import { useMemo, useState } from "react";
import CustomModal from "@/app/components/CustomModal";
import ConfirmRequest from "@/app/components/ConfirmRequest";
import PageSection from "@/app/components/PageSection";
import Search from "@/app/components/Search";
import { CreateTripUseCase } from "../application/CreateTripUsecase";
import { SupabaseTripsRepository } from "../data/SupabaseTripsRepository";
import type { UITrip } from "../domain/UITrip";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import type { User } from "@supabase/supabase-js";

const trip: UITrip = {
  originCountry: "UK",
  originCity: "London",
  destinationCountry: "Zimbabwe",
  destinationCity: "Harare",
  departureDate: "2026-01-26",
  arrivalDate: null,
  capacityKg: 8,
  pricePerKg: 20,
};

export default function TravelersPage() {
  const repo = useMemo(() => new SupabaseTripsRepository(), []);
  const useCase = useMemo(() => new CreateTripUseCase(repo), [repo]);
  const [selectedTrip, setTrip] = useState<TestUITrip | null>(null);
  const [selectedCountry, setCountry] = useState<string>("");
  const [selectedCity, setCity] = useState<string>("");
  const onClose = () => setTrip(null);
  const { user, loading } = useAuth();
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
        {user && (
          <button disabled={loading || !user?.id} onClick={() => createTrip}>
            {" "}
            create trip
          </button>
        )}
        <Travelers trips={travelers} onClick={setTrip} />
      </DefaultContainer>
      {selectedTrip && (
        <CustomModal onClose={onClose}>
          {
            <ConfirmRequest
              trip={selectedTrip}
              parcel={loggedInUserParcel}
              onClose={onClose}
            />
          }
        </CustomModal>
      )}
    </>
  );
}

async function createTrip(
  loading: boolean,
  user: User,
  useCase: CreateTripUseCase,
) {
  if (loading || !user) return;

  try {
    await useCase.execute(user.id, trip);
    console.log("Trip created");
  } catch (e) {
    console.error(e);
  }
}
