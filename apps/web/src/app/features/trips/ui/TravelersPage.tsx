import DefaultContainer from "@/components/ui/DefualtContianer";
import Travelers from "./Travelers";
import { useEffect, useMemo, useState } from "react";
import CustomModal from "@/app/components/CustomModal";
import ConfirmRequest from "@/app/components/ConfirmRequest";
import PageSection from "@/app/components/PageSection";
import Search, { SearchResults } from "@/app/components/Search";
import type { TripListing } from "../domain/Trip";
import { AnimatePresence, motion } from "framer-motion";
import type { ParcelListing } from "../../parcels/domain/Parcel";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { useSignInModal } from "@/app/shared/Authentication/SignInModalContext";
import { useToast } from "@/app/components/Toast";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import { FilterOptionsRow } from "@/app/components/FilterOptionsRow";
import ListingSelectionModal from "@/app/components/ListingSelectionModal";
import type { CustomRange, LayoutContext, SortOption } from "@/types/Ui";
import EmptyState from "@/app/components/EmptyState";
import { Button } from "@/components/ui/Button";
import CustomText from "@/components/ui/CustomText";
import PaginationControls from "@/app/components/PaginationControls";
import CreateTripModal from "./CreateTripModal";
import { useMediaQuery } from "@/app/shared/Authentication/UI/hooks/useMediaQuery";
import Toolbar from "@/app/components/MobileFilterOptions";
import { useScrollDirection } from "@/app/shared/Authentication/UI/hooks/useScrollDirection";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { useFiltersForm } from "@/app/shared/Authentication/UI/hooks/useFiltersForm";
import FAB from "@/app/components/FAB";
import {
  useToggleTripListLike,
  useTripsList,
} from "@/app/hooks/queries/useTripsQueries";
import { useQueryErrorEffect } from "@/app/hooks/useQueryErrorEffect";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/app/lib/queryKeys";
import { getParcelUseCase } from "@/app/lib/useCases";
import type { ListingPageParams } from "@/types/Pagination";
import { COMPLETE_PROFILE_PATH } from "@/app/shared/Authentication/domain/profileCompletion";

const PAGE_SIZE = 9;

export default function TravelersPage() {
  const { user, profileIncomplete } = useAuth();
  const { openSignInModal } = useSignInModal();
  const { showSupabaseError } = useUniversalModal();
  const queryClient = useQueryClient();

  const [selectedTrip, setTrip] = useState<TripListing | null>(null);
  const [parcels, setParcel] = useState<ParcelListing[]>([]);
  const [modalState, setModalState] = useState<boolean>(false);
  const [selectedParcel, setSelectedParcel] = useState<ParcelListing | null>(
    null,
  );
  const [parcelSelectionOpen, setParcelSelectionOpen] =
    useState<boolean>(false);
  const { toast } = useToast();
  const [searchCountry, setSearchCountry] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const country = searchCountry.toLowerCase().trim();
  const [clearSearchResults, setClearResults] = useState<boolean>(false);
  const city = searchCity.toLowerCase().trim();
  const isSearchActive = !!country && !!city;
  const [goodsCategory, setGoodsCategory] = useState<string[]>([]);

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
  const [tripModalState, setTripModalState] = useState<boolean>(false);
  const [page, setPage] = useState(1);

  const listingParams = useMemo<ListingPageParams>(() => ({
    page,
    pageSize: PAGE_SIZE,
    filters: {
      searchCountry,
      searchCity,
      departDate: filterByDate,
      priceRange,
      weightRange,
      goodsCategories: goodsCategory,
      sortOption,
    },
  }), [
    page,
    searchCity,
    searchCountry,
    filterByDate,
    priceRange,
    weightRange,
    goodsCategory,
    sortOption,
  ]);

  const {
    data: tripPage,
    isFetched,
    error,
    isFetching,
  } = useTripsList(user?.id, listingParams);
  useQueryErrorEffect(error);

  const tripList = tripPage?.items ?? [];
  const displayedTrips = tripList;
  const totalTrips = tripPage?.total ?? 0;
  const toggleTripLike = useToggleTripListLike(user?.id, listingParams);

  useEffect(() => {
    setPage(1);
  }, [
    searchCity,
    searchCountry,
    filterByDate,
    priceRange,
    weightRange,
    goodsCategory,
    sortOption,
  ]);

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
      try {
        const data = await queryClient.fetchQuery({
          queryKey: queryKeys.parcels.byUser(user.id),
          queryFn: () => getParcelUseCase.execute(user.id),
        });

        if (data.length === 0) {
          toast("Post a parcel first to start matching with travelers.", {
            variant: "warning",
          });
          return;
        }

        if (data.length === 1) {
          setSelectedParcel(data[0]);
        }

        if (data.length > 1) {
          setParcel(data);
          setParcelSelectionOpen(true);
        }
      } catch (err) {
        showSupabaseError(err);
        return;
      }
    }

    if (parcels.length > 1 && !parcelSelectionOpen) {
      setParcelSelectionOpen(true);
    }

    setTrip(trip);
    setModalState(true);
  };

  const handleLikeUpdate = (id: string) => {
    toggleTripLike(id);
  };

  const [mobileFilter, setMobileFilter] = useState<boolean>(false);
  const { isSearchOpen, setIsSearchOpen } = useOutletContext<LayoutContext>();
  const isMobile = useMediaQuery();
  const scrollDirection = useScrollDirection();
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
      setMobileFilter={() => setMobileFilter(false)}
    />
  );

  const searchContent = (
    <Search
      setSearchCountry={setSearchCountry}
      setSearchCity={setSearchCity}
      setClearResults={() => setClearResults(false)}
      clearResults={clearSearchResults}
    />
  );

  const handleOnClick = () => {
    if (!user?.id) {
      openSignInModal({ redirectTo: "/travelers" });
      return;
    }

    if (profileIncomplete) {
      navigate(COMPLETE_PROFILE_PATH);
      return;
    }

    setTripModalState(true);
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
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
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
      <PageSection>
        {!isMobile && searchContent}
        <AnimatePresence>
          {isMobile && mobileFilter && (
            <CustomModal onClose={() => setMobileFilter(false)}>
              {filterContent}
            </CustomModal>
          )}

          {!isMobile && filterContent}

          {isMobile && isSearchOpen && (
            <CustomModal onClose={() => setIsSearchOpen(false)}>
              {searchContent}
            </CustomModal>
          )}
        </AnimatePresence>
        <SearchResults
          isSearchActive={isSearchActive}
          searchResults={totalTrips}
          onClick={() => setClearResults(true)}
        />
      </PageSection>
      <DefaultContainer outerClassName="bg-canvas min-h-screen">
        <AnimatePresence>
          {tripModalState && (
            <CreateTripModal setModalState={() => setTripModalState(false)} />
          )}
        </AnimatePresence>
        {isFetching && isFetched && (
          <CustomText textVariant="secondary" textSize="sm">
            Updating trips...
          </CustomText>
        )}

        {displayedTrips.length === 0 && isFetched && !hasFilter && !isSearchActive && (
          <EmptyState
            title="No trips available"
            description="No trips found. Post your trip to start receiving parcel requests from senders."
            action={
              <Button
                onClick={() => handleOnClick()}
                type="button"
                variant="primary"
                size="sm"
                className="w-full mt-1"
              >
                <CustomText textVariant="onDark" textSize="sm">
                  {"Post Trip"}
                </CustomText>
              </Button>
            }
          />
        )}

        {displayedTrips.length > 0 && (
          <Travelers
            trips={displayedTrips}
            onClick={handleRequest}
            onToggleLikd={handleLikeUpdate}
          />
        )}

        {(hasFilter || isSearchActive) && displayedTrips.length === 0 && isFetched && (
          <EmptyState
            title="No matching travelers"
            description="Try adjusting your search or changing filters. Clear filters or search to see all travelers."
          />
        )}

        {tripPage && displayedTrips.length > 0 && (
          <PaginationControls
            page={tripPage.page}
            total={tripPage.total}
            pageSize={tripPage.pageSize}
            hasPreviousPage={tripPage.hasPreviousPage}
            hasNextPage={tripPage.hasNextPage}
            isFetching={isFetching}
            onPrevious={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() => setPage((current) => current + 1)}
          />
        )}

        <Link to="/create-trip?mode=create">
          <FAB isAuthed={!!user?.id} variant="trip" />
        </Link>
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
