import CustomModal from "@/app/components/CustomModal";
import DefaultContainer from "@/components/ui/DefualtContianer";
import { useEffect, useMemo, useState } from "react";
import Parcels from "./Parcels";
import Search, { SearchResults } from "@/app/components/Search";
import { SupabaseParcelRepository } from "@/app/features/parcels/data/SupabaseParcelRepository";
import type { ParcelListing } from "@/app/features/parcels/domain/Parcel";
import { GetParcelsUseCase } from "@/app/features/parcels/application/GetParcelsUseCase";
import type { TripListing } from "@/app/features/trips/domain/Trip";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { GetTripUseCase } from "@/app/features/trips/application/GetTripUseCase";
import { SupabaseTripsRepository } from "@/app/features/trips/data/SupabaseTripsRepository";
import { useToast } from "@/app/components/Toast";
import { namedCall } from "@/app/shared/Authentication/application/NamedCall";
import PageSection from "@/app/components/PageSection";
import { AnimatePresence } from "framer-motion";
import ConfirmRequest from "@/app/components/ConfirmRequest";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import { FilterOptionsRow, sortTrips } from "@/app/components/FilterOptionsRow";
import ListingSelectionModal from "@/app/components/ListingSelectionModal";
import {
  filterByCountryCity,
  filterByGoodsCategory,
  filterByPriceRange,
  filterByWeightRange,
} from "@/app/util/filters";
import type { CustomRange, SortOption } from "@/types/Ui";
import EmptyState from "@/app/components/EmptyState";
import { toggleLike } from "@/app/shared/Authentication/UI/helpers";
import CustomText from "@/components/ui/CustomText";
import { Button } from "@/components/ui/Button";
import CreateParcelModal from "./CreateParcelModal";

export default function ParcelsPage() {
  const parcelRepo = useMemo(() => new SupabaseParcelRepository(), []);
  const getParcelsUseCase = useMemo(
    () => new GetParcelsUseCase(parcelRepo),
    [parcelRepo],
  );
  const { showSupabaseError } = useUniversalModal();
  const tripRepo = useMemo(() => new SupabaseTripsRepository(), []);
  const getTripUseCase = useMemo(
    () => new GetTripUseCase(tripRepo),
    [parcelRepo],
  );
  const [parcelsList, setParcelsList] = useState<ParcelListing[]>([]);
  const { user } = useAuth();
  const [dataloaded, setDataLoaded] = useState<boolean>(false);
  useEffect(() => {
    let cancel = false;

    if (cancel) return;

    async function fetchParcels() {
      const { result } = await namedCall(
        "parcels",
        getParcelsUseCase.execute(user?.id),
      );

      if (!result.success) {
        showSupabaseError(result.error, result.status);
        return;
      }

      if (result.success) {
        setParcelsList(result.data);
        setDataLoaded(true);
      }
    }

    fetchParcels();

    return () => {
      cancel = true;
    };
  }, []);

  const [selectedParcel, setParcel] = useState<ParcelListing | null>(null);
  const [modalState, setModalState] = useState<boolean>(false);
  const { toast } = useToast();
  const [tripSelectionOpen, setTripSelectionOpen] = useState(false);
  // trips to matched with a parcel. when a user selects a parcel they should have a trip.
  const [userTrips, setUserTrips] = useState<TripListing[]>([]);
  // selected parcel to be matched with a trip
  const [selectedTrip, setSelectedTrip] = useState<TripListing | null>(null);
  //store search results and filtered results
  const [searchCountry, setSearchCountry] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [clearSearchResults, setClearResults] = useState<boolean>(false);

  const country = searchCountry.toLowerCase().trim();
  const city = searchCity.toLowerCase().trim();
  const isSearchActive = !!country && !!city;
  const [priceRange, setPriceRange] = useState<CustomRange>({
    min: 0,
    max: 0,
  });

  const [weightRange, setWeightRange] = useState<CustomRange>({
    min: 0,
    max: 0,
  });
  const [filterByDate, setFilterByDate] = useState<string>("");
  const [sortOption, setSortOption] = useState<SortOption | undefined>();
  const [goodsCategory, setGoodsCategory] = useState<string[]>([]);
  const [hasFilter, setHasFilter] = useState<boolean>(false);
  const [parcelModalState, setParcelModalState] = useState<boolean>(false);

  const displayedParcels = useMemo(() => {
    let result = parcelsList;

    if (isSearchActive) {
      result = filterByCountryCity(searchCity, searchCountry, result);
    }

    if (priceRange.max > 0 || priceRange.min > 0) {
      result = filterByPriceRange(priceRange, result);
    }

    if (weightRange.max > 0 || weightRange.min > 0) {
      result = filterByWeightRange(weightRange, result);
    }

    if (goodsCategory.length > 0) {
      result = filterByGoodsCategory(goodsCategory, result);
    }

    if (sortOption) {
      result = sortTrips(result, sortOption);
    }

    return result;
  }, [
    parcelsList,
    isSearchActive,
    searchCity,
    searchCountry,
    filterByDate,
    priceRange,
    weightRange,
    goodsCategory,
    sortOption,
  ]);
  //
  const handleRequest = async (parcel: ParcelListing) => {
    if (!user) {
      return;
    }

    // check if parcel to be matched to a trip does not belong to the logged in user
    if (parcel.user.id === user.id) {
      toast(
        "You can’t match with your own parcel.Browse available trips instead.",
        { variant: "warning" },
      );
      return;
    }

    if (userTrips.length === 0) {
      // fetch a trip to be matched with a parcel
      const { result } = await namedCall(
        "trip",
        getTripUseCase.execute(user.id),
      );
      if (!result.success) {
        showSupabaseError(result.error, result.status);
        return;
      }

      // check if any trip is available for the loggedin user
      if (result.success && result.data === null) {
        toast("Post a trip first to start matching with senders.", {
          variant: "warning",
        });
        return;
      }

      if (result.data.length === 1) {
        setSelectedTrip(result.data[0]);
      }

      if (result.data.length > 1) {
        setUserTrips(result.data);
        setTripSelectionOpen(true);
      }
    }

    if (userTrips.length > 1 && !tripSelectionOpen) {
      setTripSelectionOpen(true);
    }
    setParcel(parcel);
    setModalState(true);
  };

  const handleLikeUpdate = (id: string) => {
    toggleLike(id, setParcelsList);
  };

  return (
    <>
      <PageSection>
        <Search
          countries={["UK", "USA"]}
          cities={["London", "Florida"]}
          setSearchCity={setSearchCity}
          setSearchCountry={setSearchCountry}
          setClearResults={() => setClearResults(false)}
          clearResults={clearSearchResults}
        />
        <FilterOptionsRow
          setSelectedDate={setFilterByDate}
          setPriceRange={setPriceRange}
          setWeightRange={setWeightRange}
          setGoodsCategory={setGoodsCategory}
          setSortOption={setSortOption}
          tag="sender"
          setHasFilter={setHasFilter}
        />
        <SearchResults
          isSearchActive={isSearchActive}
          searchResults={displayedParcels.length}
          onClick={() => setClearResults(true)}
        />
      </PageSection>
      <DefaultContainer outerClassName="bg-canvas min-h-screen">
        <AnimatePresence>
          {parcelModalState && (
            <CreateParcelModal
              goodsCategory={[]}
              setModalState={() => setParcelModalState(false)}
            />
          )}
        </AnimatePresence>
        {parcelsList.length > 0 && (
          <Parcels
            parcels={displayedParcels}
            onClick={handleRequest}
            toggleLike={handleLikeUpdate}
          />
        )}

        {displayedParcels.length === 0 && dataloaded && (
          <EmptyState
            title="No parcels available"
            description="No parcels found. Post your parcels to start receiving trip requests from travelers."
            action={
              <Button
                onClick={() => setParcelModalState(true)}
                type={"button"}
                variant="primary"
                size="md"
                className="w-full mt-1"
              >
                <CustomText textVariant="onDark" textSize="md">
                  {"Post parcel"}
                </CustomText>
              </Button>
            }
          />
        )}

        {hasFilter && displayedParcels.length === 0 && (
          <EmptyState
            title="No matching parcels"
            description="Try adjusting your search or changing filters. Clear filters or search to see all parcels."
          />
        )}
      </DefaultContainer>

      <ListingSelectionModal
        listingSelectionOpen={tripSelectionOpen}
        user={user}
        selectedListing={selectedParcel}
        listings={userTrips}
        setListingSelectionOpen={setTripSelectionOpen}
        setSelectedListing={setSelectedTrip}
        setModalState={setModalState}
      />
      <AnimatePresence>
        {selectedParcel && user && selectedTrip && modalState && (
          <CustomModal
            width="xl"
            onClose={() => {
              setModalState(false);
              setSelectedTrip(null);
            }}
          >
            <ConfirmRequest
              loggedInUserId={user.id}
              trip={selectedTrip}
              parcel={selectedParcel}
              onClose={() => {
                setSelectedTrip(null);
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
