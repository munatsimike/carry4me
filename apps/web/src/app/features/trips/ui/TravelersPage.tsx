import DefaultContainer from "@/components/ui/DefualtContianer";
import Travelers from "./Travelers";
import { loggedInUserParcel } from "../../../Data";
import { useMemo, useState } from "react";
import CustomModal from "@/app/components/CustomModal";
import ConfirmRequest from "@/app/components/ConfirmRequest";
import PageSection from "@/app/components/PageSection";
import Search from "@/app/components/Search";
import { SupabaseTripsRepository } from "../data/SupabaseTripsRepository";
import { FetchTripUseCase } from "../application/FetchTripsUseCase";
import type { Trip } from "../domain/Trip";
import { GetGoodsUseCase } from "../../goods/application/GetGoodsUseCase";
import { SupabaseGoodsRepository } from "../../goods/data/SupabaseGoodsRepository";
import { useAsync } from "@/app/hookes/useAsync";
import { isNetworkError } from "@/app/util/isNetworkError";


export default function TravelersPage() {
  const repo = useMemo(() => new SupabaseTripsRepository(), []);
  const fetchTripsUseCase = useMemo(() => new FetchTripUseCase(repo), [repo]);
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
      <DefaultContainer outerClassName="bg-canvas min-h-screen">
        {trips && <Travelers trips={trips} onClick={setTrip} />}
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