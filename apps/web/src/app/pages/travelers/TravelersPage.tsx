import DefaultContainer from "@/components/ui/DefualtContianer";
import Travelers from "./Travelers";
import { travelers, loggedInUserParcel } from "../../Data";
import type { Trip } from "@/types/Ui";
import { useState } from "react";
import CustomModal from "@/app/components/CustomModal";
import ConfirmRequest from "@/app/components/ConfirmRequest";
import PageSection from "@/app/components/PageSection";
import Search from "@/app/components/Search";

export default function TravelersPage() {
  const [selectedTrip, setTrip] = useState<Trip | null>(null);
  const [selectedCountry, setCountry] = useState<string>("");
  const [selectedCity, setCity] = useState<string>("");
  const onClose = () => setTrip(null);

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
      <DefaultContainer outerClassName="bg-neutral-200 min-h-screen">
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
