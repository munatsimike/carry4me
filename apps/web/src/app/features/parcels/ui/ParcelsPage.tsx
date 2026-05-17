import CustomModal from "@/app/components/CustomModal";
import DefaultContainer from "@/components/ui/DefualtContianer";
import { useMemo, useState } from "react";
import Parcels from "./Parcels";
import Search, { SearchResults } from "@/app/components/Search";
import type { ParcelListing } from "@/app/features/parcels/domain/Parcel";
import type { TripListing } from "@/app/features/trips/domain/Trip";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { useSignInModal } from "@/app/shared/Authentication/SignInModalContext";
import { useToast } from "@/app/components/Toast";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/app/lib/queryKeys";
import { getTripUseCase } from "@/app/lib/useCases";
import {
  useParcelsList,
  useToggleParcelListLike,
} from "@/app/hooks/queries/useParcelsQueries";
import { useQueryErrorEffect } from "@/app/hooks/useQueryErrorEffect";
import PageSection from "@/app/components/PageSection";
import { AnimatePresence, motion } from "framer-motion";
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
import type { CustomRange, LayoutContext, SortOption } from "@/types/Ui";
import EmptyState from "@/app/components/EmptyState";
import CustomText from "@/components/ui/CustomText";
import { Button } from "@/components/ui/Button";
import CreateParcelModal from "./CreateParcelModal";
import { useMediaQuery } from "@/app/shared/Authentication/UI/hooks/useMediaQuery";
import Toolbar from "@/app/components/MobileFilterOptions";
import { useScrollDirection } from "@/app/shared/Authentication/UI/hooks/useScrollDirection";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { useFiltersForm } from "@/app/shared/Authentication/UI/hooks/useFiltersForm";
import FAB from "@/app/components/FAB";

export default function ParcelsPage() {
  const { showSupabaseError } = useUniversalModal();
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const { openSignInModal } = useSignInModal();

  const {
    data: parcelsList = [],
    isFetched,
    error,
  } = useParcelsList(user?.id);
  useQueryErrorEffect(error);
  const toggleParcelLike = useToggleParcelListLike(user?.id);

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
      try {
        const data = await queryClient.fetchQuery({
          queryKey: queryKeys.trips.byUser(user.id),
          queryFn: () => getTripUseCase.execute(user.id),
        });

        if (data.length === 0) {
          toast("Post a trip first to start matching with senders.", {
            variant: "warning",
          });
          return;
        }

        if (data.length === 1) {
          setSelectedTrip(data[0]);
        }

        if (data.length > 1) {
          setUserTrips(data);
          setTripSelectionOpen(true);
        }
      } catch (err) {
        showSupabaseError(err);
        return;
      }
    }

    if (userTrips.length > 1 && !tripSelectionOpen) {
      setTripSelectionOpen(true);
    }
    setParcel(parcel);
    setModalState(true);
  };

  const handleLikeUpdate = (id: string) => {
    toggleParcelLike(id);
  };
  const isMobile = useMediaQuery();
  const [mobileFilter, setMobileFilter] = useState<boolean>(false);
  const scrollDirection = useScrollDirection();
  const { isSearchOpen, setIsSearchOpen } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const filterForm = useFiltersForm({
    setSelectedDate: setFilterByDate,
    setPriceRange,
    setWeightRange,
    setGoodsCategory,
    setSortOption,
  });

  const { clearFilters, hasFilter } = filterForm;

  const filterContent = (
    <FilterOptionsRow
      filterForm={filterForm}
      tag="sender"
      setMobileFilter={() => setMobileFilter(false)}
    />
  );

  const searchContent = (
    <Search
      setSearchCity={setSearchCity}
      setSearchCountry={setSearchCountry}
      setClearResults={() => setClearResults(false)}
      clearResults={clearSearchResults}
    />
  );
  const handleOnClick = () => {
    if (!user?.id) {
      openSignInModal({ redirectTo: "/parcels" });
      return;
    }

    if (!profile) {
      navigate("/complete-profile");
      return;
    }

    setParcelModalState(true);
  };

  return (
    <>
      <div className="sticky top-[50px] z-40 bg-white border-neutral-200 px-4">
        <AnimatePresence initial={false}>
          {isMobile && scrollDirection === "up" && (
            <motion.div
              key="mobile-filters"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="py-2"
            >
              <Toolbar
                hasActiveFilters={hasFilter}
                onFilter={() => setMobileFilter(true)}
                onClear={clearFilters}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <PageSection align={isMobile ? "left" : "center"}>
        {!isMobile && searchContent}
        <AnimatePresence>
          {isMobile && isSearchOpen && (
            <CustomModal onClose={() => setIsSearchOpen(false)}>
              {searchContent}
            </CustomModal>
          )}

          {isMobile && mobileFilter && (
            <CustomModal onClose={() => setMobileFilter(false)}>
              {filterContent}
            </CustomModal>
          )}
        </AnimatePresence>
        {!isMobile && filterContent}

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
        {hasFilter && displayedParcels.length === 0 && (
          <EmptyState
            title="No matching parcels"
            description="Try adjusting your search or changing filters. Clear filters or search to see all parcels."
          />
        )}
        {displayedParcels.length === 0 && isFetched && !hasFilter && (
          <EmptyState
            title="No parcels available"
            description="No parcels found. Post your parcels to start receiving trip requests from travelers."
            action={
              <Button
                onClick={() => handleOnClick()}
                type={"button"}
                variant="primary"
                size="sm"
                className="w-full mt-1"
              >
                <CustomText textVariant="onDark" textSize="sm">
                  {"Post Parcel"}
                </CustomText>
              </Button>
            }
          />
        )}
        <Link to="/create-parcel?mode=create">
          <FAB isAuthed={!!user?.id} variant="parcel" />
        </Link>{" "}
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
