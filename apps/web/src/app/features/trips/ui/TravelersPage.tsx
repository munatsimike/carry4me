import DefaultContainer from "@/components/ui/DefualtContianer";
import Travelers from "./Travelers";
import { useEffect, useMemo, useState } from "react";
import CustomModal from "@/app/components/CustomModal";
import ConfirmRequest from "@/app/components/ConfirmRequest";
import PageSection from "@/app/components/PageSection";
import Search, { SearchResults } from "@/app/components/Search";
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
import { FilterOptionsRow } from "@/app/components/FilterOptionsRow";
import ListingSelectionModal from "@/app/components/ListingSelectionModal";
import { filterByCountryCity, filterByDepartDate, filterByPriceRange } from "@/app/util/filters";
import type { CustomRange } from "@/types/Ui";

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

  const [parcels, setParcel] = useState<ParcelListing[]>([]);
  const [modalState, setModalState] = useState<boolean>(false);
  const [selectedParcel, setSelectedParcel] = useState<ParcelListing | null>(
    null,
  );
  const [parcelSelectionOpen, setParcelSelectionOpen] =
    useState<boolean>(false);

  const { toast } = useToast();
  const [filteredTrips, setFilteredTrips] = useState<TripListing[]>([]);
  const [searchCountry, setSearchCountry] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const country = searchCountry.toLowerCase().trim();
  const [clearSearchResults, setClearResults] = useState<boolean>(false);
  const city = searchCity.toLowerCase().trim();
  const isSearchActive = !!country && !!city;
  //store filter date
  const [filterByPrice, setFilterByPrice] = useState<CustomRange>({
    min: 0,
    max: 0,
  });
  const [filterByDate, setFilterByDate] = useState<string>("");
  const shouldFilter = !!filterByDate || filterByPrice.max > 0;

  useEffect(() => {
    if (isSearchActive) {
      setFilteredTrips(filterByCountryCity(city, country, tripList));
    }
    if (filterByDate) {
      setFilteredTrips(filterByDepartDate(filterByDate, tripList));
    }

    if (filterByPrice.max > 0) {
      setFilteredTrips(filterByPriceRange(filterByPrice, tripList));
    }
  }, [searchCountry, searchCity, tripList, filterByDate, filterByPrice]);
  const handleRequest = async (trip: TripListing) => {
    if (!user?.id) {
      return;
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

    if (parcels.length === 0) {
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

      if (result.data.length === 1) {
        setSelectedParcel(result.data[0]);
      }

      if (result.data.length > 1) {
        setParcel(result.data);
        setParcelSelectionOpen(true);
      }
    }

    if (parcels.length > 1 && !parcelSelectionOpen) {
      setParcelSelectionOpen(true);
    }

    setTrip(trip);
    setModalState(true);
  };

  return (
    <>
      <PageSection>
        <Search
          countries={["UK", "USA", "Ireland"]}
          cities={["London", "Birmingham"]}
          setSearchCountry={setSearchCountry}
          setSearchCity={setSearchCity}
          setClearResults={() => setClearResults(false)}
          clearResults={clearSearchResults}
        />
        <FilterOptionsRow
          setSelectedDate={setFilterByDate}
          setFilterByPrice={setFilterByPrice}
          setFilteredList={() => setFilteredTrips([])}
        />
        <SearchResults
          isSearchActive={isSearchActive}
          searchResults={filteredTrips.length}
          onClick={() => setClearResults(true)}
        />
      </PageSection>
      <DefaultContainer outerClassName="bg-canvas min-h-screen">
        {tripList && (
          <Travelers
            trips={isSearchActive || shouldFilter ? filteredTrips : tripList}
            onClick={handleRequest}
          />
        )}
      </DefaultContainer>

      <ListingSelectionModal
        listingSelectionOpen={parcelSelectionOpen}
        user={user}
        selectedListing={selectedTrip}
        listings={parcels}
        setListingSelectionOpen={setParcelSelectionOpen}
        setSelectedListing={setSelectedParcel}
        setModalState={setModalState}
      />
      <AnimatePresence>
        {selectedTrip && selectedParcel && user && modalState && (
          <CustomModal
            width="xl"
            onClose={() => {
              setSelectedParcel(null);
              setModalState(false);
            }}
          >
            <ConfirmRequest
              loggedInUserId={user.id}
              trip={selectedTrip}
              parcel={selectedParcel}
              onClose={() => {
                setSelectedParcel(null);
                setModalState(false);
              }}
              isSenderRequesting={user.id === selectedParcel.user.id}
            />
          </CustomModal>
        )}
      </AnimatePresence>
    </>
  );
}
