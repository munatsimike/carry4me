import ConfirmRequest from "@/app/components/ConfirmRequest";
import CustomModal from "@/app/components/CustomModal";
import DefaultContainer from "@/components/ui/DefualtContianer";
import type { Parcel } from "@/types/Ui";
import { useState } from "react";
import Parcels from "./Parcels";
import { loggedInUserTrip, parlecs } from "../../Data";
import Search from "@/app/components/Search";
import PageSection from "@/app/components/PageSection";

export default function ParcelsPage() {
  const [selectedParcel, setParcel] = useState<Parcel | null>(null);
  const onClose = () => setParcel(null);

  const [selectedCountry, setCountry] = useState<string>("");
  const [selectedCity, setCity] = useState<string>("");

  return (
    <>
      <DefaultContainer>
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
        <Parcels parcels={parlecs} onClick={setParcel} />
      </DefaultContainer>
      {selectedParcel && (
        <CustomModal onClose={onClose}>
          {
            <ConfirmRequest
              trip={loggedInUserTrip}
              parcel={selectedParcel}
              onClose={onClose}
              isSenderRequesting={false}
            />
          }
        </CustomModal>
      )}
    </>
  );
}
