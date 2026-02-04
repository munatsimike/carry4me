import ConfirmRequest from "@/app/components/ConfirmRequest";
import CustomModal from "@/app/components/CustomModal";
import DefaultContainer from "@/components/ui/DefualtContianer";

import { useMemo, useState } from "react";
import Parcels from "./Parcels";
import { loggedInUserTrip, parlecs } from "../../Data";
import Search from "@/app/components/Search";
import PageSection from "@/app/components/PageSection";
import { GetParcelUseCase } from "@/app/features/parcels/application/GetParcelUseCase";
import { SupabaseParcelRepository } from "@/app/features/parcels/data/SupabaseCreateParcelRepository";
import { useAsync } from "@/app/hookes/useAsync";
import type { Parcel } from "@/app/features/parcels/domain/Parcel";

export default function ParcelsPage() {
  const parcelRepo = useMemo(() => new SupabaseParcelRepository(), []);
  const getParcelUseCase = useMemo(
    () => new GetParcelUseCase(parcelRepo),
    [parcelRepo],
  );

  const { data, error, isLoading } = useAsync(() => getParcelUseCase.execute());

  if (error) {
    console.log(error);
  }

  const [selectedParcel, setParcel] = useState<Parcel | null>(null);
  const onClose = () => setParcel(null);

  const [selectedCountry, setCountry] = useState<string>("");
  const [selectedCity, setCity] = useState<string>("");

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
        <Parcels parcels={data ? data : []} onClick={setParcel} />
      </DefaultContainer>
      {selectedParcel && (
        <CustomModal onClose={onClose}>
          {
            <></>
            /*
            <ConfirmRequest
              trip={}
              parcel={selectedParcel}
              onClose={onClose}
              isSenderRequesting={false}
            />*/
          }
        </CustomModal>
      )}
    </>
  );
}
